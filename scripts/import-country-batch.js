#!/usr/bin/env node

/**
 * Import postal codes from extracted country CSV files
 * Processes one country at a time with proper batch handling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TEMP_DIR = path.join(__dirname, '..', 'temp');
const BATCH_SIZE = 500;
const DATABASE_NAME = 'kisigua-production';

/**
 * Execute wrangler command
 */
function executeWranglerCommand(args) {
  return new Promise((resolve, reject) => {
    const wrangler = spawn('npx', ['wrangler', ...args], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    wrangler.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    wrangler.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    wrangler.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Wrangler command failed: ${stderr}`));
      }
    });
  });
}

/**
 * Parse CSV line into postal code object
 */
function parseCsvLine(line) {
  const fields = line.split(';');
  
  if (fields.length < 12) {
    return null;
  }

  const [
    countryCode,
    postalCode,
    placeName,
    adminName1,
    adminCode1,
    adminName2,
    adminCode2,
    adminName3,
    adminCode3,
    latitude,
    longitude,
    accuracy
  ] = fields;

  // Validate required fields
  if (!countryCode || !postalCode || !placeName || !latitude || !longitude) {
    return null;
  }

  // Parse coordinates
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  return {
    country_code: countryCode.trim(),
    postal_code: postalCode.trim(),
    place_name: placeName.trim().replace(/'/g, "''"), // Escape quotes
    admin_name1: adminName1?.trim().replace(/'/g, "''") || null,
    admin_code1: adminCode1?.trim() || null,
    admin_name2: adminName2?.trim().replace(/'/g, "''") || null,
    admin_code2: adminCode2?.trim() || null,
    admin_name3: adminName3?.trim().replace(/'/g, "''") || null,
    admin_code3: adminCode3?.trim() || null,
    latitude: lat,
    longitude: lng,
    accuracy: parseInt(accuracy) || 6
  };
}

/**
 * Create batch insert SQL
 */
function createBatchInsertSQL(records) {
  const values = records.map(record => {
    const escapedValues = [
      `'${record.country_code}'`,
      `'${record.postal_code}'`,
      `'${record.place_name}'`,
      record.admin_name1 ? `'${record.admin_name1}'` : 'NULL',
      record.admin_code1 ? `'${record.admin_code1}'` : 'NULL',
      record.admin_name2 ? `'${record.admin_name2}'` : 'NULL',
      record.admin_code2 ? `'${record.admin_code2}'` : 'NULL',
      record.admin_name3 ? `'${record.admin_name3}'` : 'NULL',
      record.admin_code3 ? `'${record.admin_code3}'` : 'NULL',
      record.latitude.toString(),
      record.longitude.toString(),
      record.accuracy.toString()
    ];
    
    return `(${escapedValues.join(', ')})`;
  }).join(',\n  ');

  return `
INSERT OR IGNORE INTO postal_codes (
  country_code, postal_code, place_name,
  admin_name1, admin_code1, admin_name2, admin_code2,
  admin_name3, admin_code3, latitude, longitude, accuracy
) VALUES
  ${values};
`;
}

/**
 * Import records from a country CSV file
 */
async function importCountryFile(countryCode) {
  const csvFile = path.join(TEMP_DIR, `${countryCode.toLowerCase()}_postal_codes.csv`);
  
  if (!fs.existsSync(csvFile)) {
    console.error(`❌ CSV file not found: ${csvFile}`);
    return false;
  }

  console.log(`\n🌍 Importing ${countryCode} postal codes...`);
  console.log(`📁 File: ${csvFile}`);

  // Read and process CSV file
  const csvContent = fs.readFileSync(csvFile, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  console.log(`📊 Total records: ${lines.length.toLocaleString()}`);

  let batch = [];
  let batchNumber = 1;
  let importedCount = 0;
  let skippedCount = 0;

  for (const line of lines) {
    const record = parseCsvLine(line);
    if (!record) {
      skippedCount++;
      continue;
    }

    batch.push(record);

    // Process batch when it reaches the batch size
    if (batch.length >= BATCH_SIZE) {
      console.log(`📦 Processing batch ${batchNumber} (${batch.length} records)...`);
      
      const success = await processBatch(batch, batchNumber, countryCode);
      if (success) {
        importedCount += batch.length;
        console.log(`✅ Batch ${batchNumber} completed. Total imported: ${importedCount.toLocaleString()}`);
      } else {
        console.error(`❌ Batch ${batchNumber} failed`);
        return false;
      }

      batch = [];
      batchNumber++;

      // Progress update
      if (importedCount % 2500 === 0) {
        console.log(`🎯 Progress: ${importedCount.toLocaleString()} records imported`);
      }
    }
  }

  // Process remaining records
  if (batch.length > 0) {
    console.log(`📦 Processing final batch ${batchNumber} (${batch.length} records)...`);
    const success = await processBatch(batch, batchNumber, countryCode);
    if (success) {
      importedCount += batch.length;
    }
  }

  console.log(`✅ ${countryCode} import completed!`);
  console.log(`📊 Imported: ${importedCount.toLocaleString()} records`);
  console.log(`⏭️ Skipped: ${skippedCount.toLocaleString()} records`);

  return true;
}

/**
 * Process a batch of records
 */
async function processBatch(records, batchNumber, countryCode) {
  try {
    // Create SQL file for this batch
    const batchFileName = `batch_${countryCode}_${batchNumber.toString().padStart(4, '0')}.sql`;
    const batchFilePath = path.join(TEMP_DIR, batchFileName);
    
    // Generate INSERT statement
    const sql = createBatchInsertSQL(records);
    
    // Write SQL to temporary file
    fs.writeFileSync(batchFilePath, sql);
    
    // Execute the batch using wrangler
    await executeWranglerCommand([
      'd1', 'execute', DATABASE_NAME, '--remote',
      '--file', batchFilePath
    ]);
    
    // Clean up temporary file
    fs.unlinkSync(batchFilePath);
    
    return true;
  } catch (error) {
    console.error(`❌ Batch ${batchNumber} failed:`, error.message);
    return false;
  }
}

/**
 * Import specific country
 */
async function importCountry(countryCode) {
  console.log(`🚀 Starting ${countryCode} import...`);
  const success = await importCountryFile(countryCode);
  
  if (success) {
    console.log(`🎉 ${countryCode} import completed successfully!`);
  } else {
    console.error(`❌ ${countryCode} import failed!`);
  }
  
  return success;
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  const countryCode = process.argv[2];
  
  if (!countryCode) {
    console.log('Usage: node import-country-batch.js <COUNTRY_CODE>');
    console.log('Example: node import-country-batch.js DE');
    console.log('Available: DE, IT, ES, FR');
    process.exit(1);
  }

  importCountry(countryCode.toUpperCase())
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

export { importCountry };

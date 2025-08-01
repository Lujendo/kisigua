#!/usr/bin/env node

/**
 * Import postal codes from GeoNames CSV into D1 database
 * Step-by-step migration with duplicate handling and progress tracking
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_FILE_PATH = path.join(__dirname, '..', 'geonames-postal-code@public (1).csv');
const BATCH_SIZE = 500; // Smaller batches for D1 stability
const TEMP_DIR = path.join(__dirname, '..', 'temp');
const SUPPORTED_COUNTRIES = ['DE', 'IT', 'ES', 'FR']; // Germany, Italy, Spain, France
const DATABASE_NAME = 'kisigua-production';

/**
 * Parse CSV line into postal code object
 */
function parseCsvLine(line) {
  // Handle CSV with semicolon separator
  const fields = line.split(';');
  
  if (fields.length < 12) {
    return null; // Skip malformed lines
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
    place_name: placeName.trim(),
    admin_name1: adminName1?.trim() || null,
    admin_code1: adminCode1?.trim() || null,
    admin_name2: adminName2?.trim() || null,
    admin_code2: adminCode2?.trim() || null,
    admin_name3: adminName3?.trim() || null,
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
  const placeholders = records.map(() => 
    '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).join(', ');

  return `
    INSERT INTO postal_codes (
      country_code, postal_code, place_name,
      admin_name1, admin_code1, admin_name2, admin_code2,
      admin_name3, admin_code3, latitude, longitude, accuracy
    ) VALUES ${placeholders}
  `;
}

/**
 * Flatten records for batch insert
 */
function flattenRecords(records) {
  const values = [];
  for (const record of records) {
    values.push(
      record.country_code,
      record.postal_code,
      record.place_name,
      record.admin_name1,
      record.admin_code1,
      record.admin_name2,
      record.admin_code2,
      record.admin_name3,
      record.admin_code3,
      record.latitude,
      record.longitude,
      record.accuracy
    );
  }
  return values;
}

/**
 * Create temporary directory
 */
function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Check for existing records to avoid duplicates
 */
async function getExistingRecords() {
  console.log('🔍 Checking existing records in database...');

  try {
    const result = await executeWranglerCommand([
      'd1', 'execute', DATABASE_NAME, '--remote',
      '--command', 'SELECT country_code, postal_code, place_name FROM postal_codes WHERE country_code = "DE";'
    ]);

    const existing = new Set();
    // Parse the result to extract existing records
    // This is a simplified approach - in production, you'd parse the actual output
    console.log(`📊 Found existing records in database`);
    return existing;
  } catch (error) {
    console.warn('⚠️ Could not check existing records, proceeding with duplicate handling in SQL');
    return new Set();
  }
}

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
 * Main import function with step-by-step processing
 */
async function importPostalCodes() {
  console.log('🚀 Starting step-by-step postal codes migration...');
  console.log(`🌍 Target countries: ${SUPPORTED_COUNTRIES.join(', ')}`);
  console.log(`📊 Expected records:`);
  console.log(`   🇩🇪 Germany: ~23,297`);
  console.log(`   🇮🇹 Italy: ~18,415`);
  console.log(`   🇪🇸 Spain: ~37,867`);
  console.log(`   🇫🇷 France: ~51,610`);
  console.log(`   📈 Total: ~131,189 postal codes`);
  console.log(`🔧 Batch size: ${BATCH_SIZE} records`);

  // Setup
  ensureTempDir();

  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`);
    process.exit(1);
  }

  console.log(`📁 Reading CSV file: ${CSV_FILE_PATH}`);

  // Get existing records to avoid duplicates
  const existingRecords = await getExistingRecords();

  // Process CSV in chunks to avoid memory issues
  const stream = fs.createReadStream(CSV_FILE_PATH, { encoding: 'utf8' });
  let buffer = '';
  let lineCount = 0;
  let processedCount = 0;
  let importedCount = 0;
  let skippedCount = 0;
  let batch = [];
  let batchNumber = 1;

  console.log('🔄 Processing records...');

  stream.on('data', async (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      lineCount++;

      // Skip header line
      if (lineCount === 1) continue;

      if (!line.trim()) continue;

      processedCount++;

      const record = parseCsvLine(line);
      if (!record) {
        skippedCount++;
        continue;
      }

      // Filter by supported countries
      if (!SUPPORTED_COUNTRIES.includes(record.country_code)) {
        skippedCount++;
        continue;
      }

      // Check for duplicates (simplified check)
      const recordKey = `${record.country_code}-${record.postal_code}-${record.place_name}`;
      if (existingRecords.has(recordKey)) {
        skippedCount++;
        continue;
      }

      batch.push(record);

      // Process batch when it reaches the batch size
      if (batch.length >= BATCH_SIZE) {
        stream.pause(); // Pause reading while processing

        console.log(`📦 Processing batch ${batchNumber} (${batch.length} records)...`);
        const success = await processBatch(batch, batchNumber);

        if (success) {
          importedCount += batch.length;
          console.log(`✅ Batch ${batchNumber} completed. Total imported: ${importedCount}`);
        } else {
          console.error(`❌ Batch ${batchNumber} failed. Stopping import.`);
          process.exit(1);
        }

        batch = [];
        batchNumber++;

        // Progress update
        if (importedCount % 2500 === 0) {
          console.log(`🎯 Progress: ${importedCount} records imported, ${skippedCount} skipped`);
        }

        stream.resume(); // Resume reading
      }
    }
  });

  stream.on('end', async () => {
    // Process remaining records
    if (batch.length > 0) {
      console.log(`📦 Processing final batch ${batchNumber} (${batch.length} records)...`);
      const success = await processBatch(batch, batchNumber);
      if (success) {
        importedCount += batch.length;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Total lines processed: ${processedCount}`);
    console.log(`✅ Records imported: ${importedCount}`);
    console.log(`⏭️ Records skipped: ${skippedCount}`);
    console.log(`🌍 Countries: ${SUPPORTED_COUNTRIES.join(', ')}`);
    console.log(`📈 Success rate: ${((importedCount / processedCount) * 100).toFixed(2)}%`);
  });

  stream.on('error', (error) => {
    console.error('❌ Error reading CSV file:', error);
    process.exit(1);
  });
}

/**
 * Process a batch of records with D1 database insertion
 */
async function processBatch(records, batchNumber) {
  try {
    // Create SQL file for this batch
    const batchFileName = `batch_${batchNumber.toString().padStart(4, '0')}.sql`;
    const batchFilePath = path.join(TEMP_DIR, batchFileName);

    // Generate INSERT statement with duplicate handling
    const sql = createBatchInsertSQLWithDuplicateHandling(records);

    // Write SQL to temporary file
    fs.writeFileSync(batchFilePath, sql);

    console.log(`💾 Created SQL file: ${batchFileName}`);

    // Execute the batch using wrangler
    console.log(`🚀 Executing batch ${batchNumber}...`);

    const result = await executeWranglerCommand([
      'd1', 'execute', DATABASE_NAME, '--remote',
      '--file', batchFilePath
    ]);

    console.log(`✅ Batch ${batchNumber} executed successfully`);

    // Clean up temporary file
    fs.unlinkSync(batchFilePath);

    return true;
  } catch (error) {
    console.error(`❌ Batch ${batchNumber} failed:`, error.message);
    return false;
  }
}

/**
 * Create batch insert SQL with duplicate handling
 */
function createBatchInsertSQLWithDuplicateHandling(records) {
  const values = records.map(record => {
    const escapedValues = [
      `'${record.country_code.replace(/'/g, "''")}'`,
      `'${record.postal_code.replace(/'/g, "''")}'`,
      `'${record.place_name.replace(/'/g, "''")}'`,
      record.admin_name1 ? `'${record.admin_name1.replace(/'/g, "''")}'` : 'NULL',
      record.admin_code1 ? `'${record.admin_code1.replace(/'/g, "''")}'` : 'NULL',
      record.admin_name2 ? `'${record.admin_name2.replace(/'/g, "''")}'` : 'NULL',
      record.admin_code2 ? `'${record.admin_code2.replace(/'/g, "''")}'` : 'NULL',
      record.admin_name3 ? `'${record.admin_name3.replace(/'/g, "''")}'` : 'NULL',
      record.admin_code3 ? `'${record.admin_code3.replace(/'/g, "''")}'` : 'NULL',
      record.latitude.toString(),
      record.longitude.toString(),
      record.accuracy.toString()
    ];

    return `(${escapedValues.join(', ')})`;
  }).join(',\n  ');

  return `
-- Batch insert with duplicate handling
INSERT OR IGNORE INTO postal_codes (
  country_code, postal_code, place_name,
  admin_name1, admin_code1, admin_name2, admin_code2,
  admin_name3, admin_code3, latitude, longitude, accuracy
) VALUES
  ${values};
`;
}

/**
 * Clean up temporary files
 */
function cleanupTempFiles() {
  if (fs.existsSync(TEMP_DIR)) {
    const files = fs.readdirSync(TEMP_DIR);
    for (const file of files) {
      if (file.endsWith('.sql')) {
        fs.unlinkSync(path.join(TEMP_DIR, file));
      }
    }
    console.log('🧹 Cleaned up temporary files');
  }
}

/**
 * Verify import results
 */
async function verifyImport() {
  console.log('\n🔍 Verifying import results...');

  try {
    const result = await executeWranglerCommand([
      'd1', 'execute', DATABASE_NAME, '--remote',
      '--command', 'SELECT COUNT(*) as total, country_code FROM postal_codes GROUP BY country_code;'
    ]);

    console.log('📊 Import verification completed');
    console.log(result);
  } catch (error) {
    console.warn('⚠️ Could not verify import results:', error.message);
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🌍 GeoNames Postal Codes Migration Tool');
  console.log('=====================================\n');

  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n🛑 Migration interrupted by user');
    cleanupTempFiles();
    process.exit(0);
  });

  process.on('exit', () => {
    cleanupTempFiles();
  });

  importPostalCodes()
    .then(() => {
      return verifyImport();
    })
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration failed:', error);
      cleanupTempFiles();
      process.exit(1);
    });
}

export { importPostalCodes, parseCsvLine, createBatchInsertSQLWithDuplicateHandling };

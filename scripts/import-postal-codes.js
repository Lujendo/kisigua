#!/usr/bin/env node

/**
 * Import postal codes from GeoNames CSV into D1 database
 * Optimized for batch processing and performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_FILE_PATH = path.join(__dirname, '..', 'geonames-postal-code@public (1).csv');
const BATCH_SIZE = 1000; // Process in batches for better performance
const SUPPORTED_COUNTRIES = ['DE', 'AT', 'CH', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'CZ', 'DK', 'SE', 'NO', 'FI']; // European countries for now

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
 * Main import function
 */
async function importPostalCodes() {
  console.log('🚀 Starting postal codes import...');
  
  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`);
    process.exit(1);
  }

  console.log(`📁 Reading CSV file: ${CSV_FILE_PATH}`);
  
  // Read and process CSV file
  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const lines = csvContent.split('\n');
  
  console.log(`📊 Total lines in CSV: ${lines.length}`);
  
  // Skip header line and process data
  const dataLines = lines.slice(1).filter(line => line.trim());
  let processedCount = 0;
  let importedCount = 0;
  let batch = [];
  
  console.log('🔄 Processing records...');
  
  for (const line of dataLines) {
    processedCount++;
    
    const record = parseCsvLine(line);
    if (!record) {
      continue; // Skip invalid records
    }
    
    // Filter by supported countries
    if (!SUPPORTED_COUNTRIES.includes(record.country_code)) {
      continue;
    }
    
    batch.push(record);
    
    // Process batch when it reaches the batch size
    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch);
      importedCount += batch.length;
      batch = [];
      
      // Progress update
      if (importedCount % 10000 === 0) {
        console.log(`✅ Imported ${importedCount} records...`);
      }
    }
  }
  
  // Process remaining records
  if (batch.length > 0) {
    await processBatch(batch);
    importedCount += batch.length;
  }
  
  console.log(`🎉 Import completed!`);
  console.log(`📊 Processed: ${processedCount} lines`);
  console.log(`✅ Imported: ${importedCount} postal codes`);
  console.log(`🌍 Countries: ${SUPPORTED_COUNTRIES.join(', ')}`);
}

/**
 * Process a batch of records (placeholder for actual DB insertion)
 */
async function processBatch(records) {
  // This would be replaced with actual D1 database insertion
  // For now, we'll just log the batch info
  console.log(`📦 Processing batch of ${records.length} records`);
  
  // Example of what the actual implementation would look like:
  /*
  const sql = createBatchInsertSQL(records);
  const values = flattenRecords(records);
  
  try {
    await db.prepare(sql).bind(...values).run();
  } catch (error) {
    console.error('❌ Batch insert failed:', error);
    throw error;
  }
  */
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  importPostalCodes().catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
}

export { importPostalCodes, parseCsvLine, createBatchInsertSQL, flattenRecords };

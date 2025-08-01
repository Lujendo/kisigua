#!/usr/bin/env node

/**
 * Extract target country records from GeoNames CSV
 * Creates separate files for each country to make migration more manageable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_FILE_PATH = path.join(__dirname, '..', 'geonames-postal-code@public (1).csv');
const OUTPUT_DIR = path.join(__dirname, '..', 'temp');
const TARGET_COUNTRIES = ['DE', 'IT', 'ES', 'FR'];

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
 * Extract records for target countries
 */
async function extractTargetCountries() {
  console.log('🌍 Extracting Target Country Records');
  console.log('====================================\n');
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`);
    process.exit(1);
  }

  console.log(`📁 Reading CSV file: ${CSV_FILE_PATH}`);
  console.log(`🎯 Target countries: ${TARGET_COUNTRIES.join(', ')}`);
  console.log(`📂 Output directory: ${OUTPUT_DIR}\n`);

  // Initialize counters and file streams
  const countryCounts = {};
  const countryFiles = {};
  
  for (const country of TARGET_COUNTRIES) {
    countryCounts[country] = 0;
    countryFiles[country] = fs.createWriteStream(
      path.join(OUTPUT_DIR, `${country.toLowerCase()}_postal_codes.csv`)
    );
    // Write header
    countryFiles[country].write('country_code;postal_code;place_name;admin_name1;admin_code1;admin_name2;admin_code2;admin_name3;admin_code3;latitude;longitude;accuracy\n');
  }

  // Process CSV file
  const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const lines = fileContent.split('\n');
  
  console.log(`📊 Total lines in CSV: ${lines.length.toLocaleString()}`);
  console.log('🔄 Processing records...\n');

  let processedLines = 0;
  let totalExtracted = 0;

  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;

    processedLines++;
    
    // Quick country check before full parsing
    const countryCode = line.split(';')[0]?.trim();
    if (!TARGET_COUNTRIES.includes(countryCode)) {
      continue;
    }

    const record = parseCsvLine(line);
    if (!record) {
      continue;
    }

    // Write to country-specific file
    const countryFile = countryFiles[record.country_code];
    if (countryFile) {
      countryFile.write(`${record.country_code};${record.postal_code};${record.place_name};${record.admin_name1 || ''};${record.admin_code1 || ''};${record.admin_name2 || ''};${record.admin_code2 || ''};${record.admin_name3 || ''};${record.admin_code3 || ''};${record.latitude};${record.longitude};${record.accuracy}\n`);
      countryCounts[record.country_code]++;
      totalExtracted++;
    }

    // Progress update
    if (processedLines % 100000 === 0) {
      console.log(`📈 Processed ${processedLines.toLocaleString()} lines, extracted ${totalExtracted.toLocaleString()} records`);
    }
  }

  // Close all file streams
  for (const country of TARGET_COUNTRIES) {
    countryFiles[country].end();
  }

  console.log('\n🎉 Extraction completed!');
  console.log('========================');
  console.log(`📊 Total lines processed: ${processedLines.toLocaleString()}`);
  console.log(`✅ Total records extracted: ${totalExtracted.toLocaleString()}\n`);

  console.log('📋 Records by country:');
  for (const country of TARGET_COUNTRIES) {
    const flag = { DE: '🇩🇪', IT: '🇮🇹', ES: '🇪🇸', FR: '🇫🇷' }[country];
    console.log(`   ${flag} ${country}: ${countryCounts[country].toLocaleString()}`);
  }

  console.log('\n📂 Generated files:');
  for (const country of TARGET_COUNTRIES) {
    const filename = `${country.toLowerCase()}_postal_codes.csv`;
    const filepath = path.join(OUTPUT_DIR, filename);
    const stats = fs.statSync(filepath);
    console.log(`   📄 ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  }

  return countryCounts;
}

// Run the extraction
if (import.meta.url === `file://${process.argv[1]}`) {
  extractTargetCountries()
    .then((counts) => {
      console.log('\n✅ Ready for migration!');
      console.log('Next steps:');
      console.log('1. Run migration for each country file');
      console.log('2. Monitor progress with migration-progress.js');
      console.log('3. Verify results with check-database-status.js');
    })
    .catch(error => {
      console.error('❌ Extraction failed:', error);
      process.exit(1);
    });
}

export { extractTargetCountries };

#!/usr/bin/env node

/**
 * Check database status before migration
 * Provides overview of current postal codes data
 */

import { spawn } from 'child_process';

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
 * Check table existence and structure
 */
async function checkTableStructure() {
  console.log('🔍 Checking postal_codes table structure...');
  
  try {
    const result = await executeWranglerCommand([
      'd1', 'execute', DATABASE_NAME, '--remote',
      '--command', 'PRAGMA table_info(postal_codes);'
    ]);
    
    console.log('✅ Table structure verified');
    return true;
  } catch (error) {
    console.error('❌ Table structure check failed:', error.message);
    return false;
  }
}

/**
 * Check current record count
 */
async function checkRecordCount() {
  console.log('📊 Checking current record count...');
  
  try {
    const result = await executeWranglerCommand([
      'd1', 'execute', DATABASE_NAME, '--remote',
      '--command', 'SELECT COUNT(*) as total FROM postal_codes;'
    ]);
    
    console.log('Current records in database:');
    console.log(result);
    
    return true;
  } catch (error) {
    console.error('❌ Record count check failed:', error.message);
    return false;
  }
}

/**
 * Check records by country
 */
async function checkRecordsByCountry() {
  console.log('🌍 Checking records by country...');
  
  try {
    const result = await executeWranglerCommand([
      'd1', 'execute', DATABASE_NAME, '--remote',
      '--command', 'SELECT country_code, COUNT(*) as count FROM postal_codes GROUP BY country_code ORDER BY count DESC;'
    ]);
    
    console.log('Records by country:');
    console.log(result);
    
    return true;
  } catch (error) {
    console.error('❌ Country breakdown check failed:', error.message);
    return false;
  }
}

/**
 * Check for sample records
 */
async function checkSampleRecords() {
  console.log('🔍 Checking sample records...');

  try {
    const result = await executeWranglerCommand([
      'd1', 'execute', DATABASE_NAME, '--remote',
      '--command', 'SELECT place_name, postal_code, country_code, admin_name1 FROM postal_codes WHERE country_code IN ("DE", "IT", "ES", "FR") LIMIT 8;'
    ]);

    console.log('Sample records from target countries:');
    console.log(result);

    return true;
  } catch (error) {
    console.error('❌ Sample records check failed:', error.message);
    return false;
  }
}

/**
 * Check database size
 */
async function checkDatabaseSize() {
  console.log('💾 Checking database size...');
  
  try {
    const result = await executeWranglerCommand([
      'd1', 'execute', DATABASE_NAME, '--remote',
      '--command', 'SELECT page_count * page_size as size_bytes FROM pragma_page_count(), pragma_page_size();'
    ]);
    
    console.log('Database size information:');
    console.log(result);
    
    return true;
  } catch (error) {
    console.error('❌ Database size check failed:', error.message);
    return false;
  }
}

/**
 * Main status check function
 */
async function checkDatabaseStatus() {
  console.log('🌍 Database Status Check');
  console.log('========================\n');
  
  const checks = [
    { name: 'Table Structure', fn: checkTableStructure },
    { name: 'Record Count', fn: checkRecordCount },
    { name: 'Records by Country', fn: checkRecordsByCountry },
    { name: 'Sample Records', fn: checkSampleRecords },
    { name: 'Database Size', fn: checkDatabaseSize }
  ];
  
  let passedChecks = 0;
  
  for (const check of checks) {
    console.log(`\n--- ${check.name} ---`);
    const success = await check.fn();
    if (success) {
      passedChecks++;
    }
    console.log(''); // Add spacing
  }
  
  console.log('=========================');
  console.log(`✅ Passed: ${passedChecks}/${checks.length} checks`);
  
  if (passedChecks === checks.length) {
    console.log('🎉 Database is ready for migration!');
  } else {
    console.log('⚠️ Some checks failed. Please review before migration.');
  }
  
  return passedChecks === checks.length;
}

// Run the status check
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDatabaseStatus()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Status check failed:', error);
      process.exit(1);
    });
}

export { checkDatabaseStatus };

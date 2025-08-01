#!/usr/bin/env node

/**
 * Monitor migration progress in real-time
 * Shows current database state during migration
 */

import { spawn } from 'child_process';

const DATABASE_NAME = 'kisigua-production';
const REFRESH_INTERVAL = 10000; // 10 seconds

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
        reject(new Error(`Command failed: ${stderr}`));
      }
    });
  });
}

/**
 * Get current record count
 */
async function getCurrentCount() {
  try {
    const result = await executeWranglerCommand([
      'd1', 'execute', DATABASE_NAME, '--remote',
      '--command', 'SELECT COUNT(*) as total FROM postal_codes WHERE country_code IN ("DE", "IT", "ES", "FR");'
    ]);
    
    // Parse the result to extract the number
    const match = result.match(/│\s*(\d+)\s*│/);
    return match ? parseInt(match[1]) : 0;
  } catch (error) {
    return -1; // Error indicator
  }
}

/**
 * Display progress
 */
function displayProgress(current, target, startTime) {
  const elapsed = Date.now() - startTime;
  const elapsedSeconds = Math.floor(elapsed / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingSeconds = elapsedSeconds % 60;
  
  const percentage = target > 0 ? ((current / target) * 100).toFixed(2) : 0;
  const rate = elapsedSeconds > 0 ? (current / elapsedSeconds).toFixed(2) : 0;
  
  const eta = rate > 0 ? Math.floor((target - current) / rate) : 0;
  const etaMinutes = Math.floor(eta / 60);
  const etaSeconds = eta % 60;
  
  console.clear();
  console.log('🚀 Migration Progress Monitor');
  console.log('============================\n');
  console.log(`📊 Records imported: ${current.toLocaleString()} / ${target.toLocaleString()}`);
  console.log(`📈 Progress: ${percentage}%`);
  console.log(`⏱️ Elapsed: ${elapsedMinutes}m ${remainingSeconds}s`);
  console.log(`🚄 Rate: ${rate} records/second`);
  
  if (eta > 0) {
    console.log(`⏳ ETA: ${etaMinutes}m ${etaSeconds}s`);
  }
  
  // Progress bar
  const barLength = 40;
  const filledLength = Math.floor((current / target) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  console.log(`\n[${bar}] ${percentage}%`);
  
  console.log('\n💡 Press Ctrl+C to stop monitoring');
}

/**
 * Monitor migration progress
 */
async function monitorProgress() {
  const TARGET_RECORDS = 131189; // Expected total for DE, IT, ES, FR
  const startTime = Date.now();
  let previousCount = 0;

  console.log('🔍 Starting migration progress monitor...');
  console.log(`🌍 Target countries: Germany, Italy, Spain, France`);
  console.log(`🎯 Target: ${TARGET_RECORDS.toLocaleString()} postal codes total\n`);
  
  const monitor = setInterval(async () => {
    const currentCount = await getCurrentCount();
    
    if (currentCount === -1) {
      console.log('❌ Error getting current count');
      return;
    }
    
    displayProgress(currentCount, TARGET_RECORDS, startTime);
    
    // Check if migration is complete
    if (currentCount >= TARGET_RECORDS) {
      clearInterval(monitor);
      console.log('\n🎉 Migration appears to be complete!');
      console.log('✅ Run the verification script to confirm results');
      process.exit(0);
    }
    
    // Check if migration has stalled
    if (currentCount === previousCount) {
      console.log('\n⚠️ No progress detected in the last interval');
    }
    
    previousCount = currentCount;
  }, REFRESH_INTERVAL);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(monitor);
    console.log('\n🛑 Progress monitoring stopped');
    process.exit(0);
  });
}

// Run the progress monitor
if (import.meta.url === `file://${process.argv[1]}`) {
  monitorProgress().catch(error => {
    console.error('❌ Progress monitoring failed:', error);
    process.exit(1);
  });
}

export { monitorProgress };

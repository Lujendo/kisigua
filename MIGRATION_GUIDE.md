# 🚀 Step-by-Step Multi-Country Postal Codes Migration Guide

## Overview

This guide walks you through migrating postal codes from **Germany, Italy, Spain, and France** from the GeoNames CSV file into your Cloudflare D1 database, with duplicate handling and progress monitoring.

**Target Countries & Records:**
- 🇩🇪 **Germany (DE)**: 23,297 postal codes
- 🇮🇹 **Italy (IT)**: 18,415 postal codes
- 🇪🇸 **Spain (ES)**: 37,867 postal codes
- 🇫🇷 **France (FR)**: 51,610 postal codes
- **📊 Total**: 131,189 postal codes

## 📋 Pre-Migration Checklist

### 1. Verify Database Status
```bash
node scripts/check-database-status.js
```

**Expected Output:**
- ✅ Table structure verified
- ✅ Current record count (should show ~28 sample records)
- ✅ Records by country (should show DE: 13, IT: 5, ES: 5, FR: 5)
- ✅ Sample records from all target countries displayed
- ✅ Database size information

### 2. Verify CSV File
```bash
ls -lh "geonames-postal-code@public (1).csv"
wc -l "geonames-postal-code@public (1).csv"
grep "^DE;" "geonames-postal-code@public (1).csv" | wc -l
```

**Expected Output:**
- File size: ~165MB
- Total lines: ~1,826,153
- Target country records: 131,189 (DE: 23,297, IT: 18,415, ES: 37,867, FR: 51,610)

## 🚀 Migration Process

### Step 1: Start Progress Monitor (Optional)
Open a second terminal and run:
```bash
node scripts/migration-progress.js
```

This will show real-time progress updates every 10 seconds.

### Step 2: Run the Migration
```bash
node scripts/import-postal-codes.js
```

**What happens:**
1. **Setup Phase** (30 seconds)
   - Creates temporary directory
   - Checks existing records
   - Prepares for batch processing

2. **Processing Phase** (15-30 minutes)
   - Processes CSV in 500-record batches
   - Filters for German records only
   - Handles duplicates with `INSERT OR IGNORE`
   - Shows progress every 2,500 records

3. **Verification Phase** (1 minute)
   - Counts imported records
   - Verifies data integrity
   - Cleans up temporary files

### Step 3: Monitor Progress
The migration will show output like:
```
🚀 Starting step-by-step postal codes migration...
📊 Target: ~23,297 German postal codes
🔧 Batch size: 500 records

📁 Reading CSV file: /path/to/geonames-postal-code@public (1).csv
🔍 Checking existing records in database...
🔄 Processing records...

📦 Processing batch 1 (500 records)...
✅ Batch 1 completed. Total imported: 500
📦 Processing batch 2 (500 records)...
✅ Batch 2 completed. Total imported: 1000
🎯 Progress: 2500 records imported, 0 skipped
...
```

## 📊 Expected Timeline

| Phase | Duration | Records | Description |
|-------|----------|---------|-------------|
| Setup | 30s | - | Initialize and check existing data |
| Batch 1-10 | 2-3 min | 5,000 | Initial batches (fastest) |
| Batch 11-30 | 8-12 min | 15,000 | Middle batches (steady) |
| Batch 31-47 | 5-8 min | 8,297 | Final batches (remaining) |
| Verification | 1 min | - | Count and verify results |
| **Total** | **15-25 min** | **23,297** | **Complete migration** |

## 🔍 Monitoring Commands

### Check Current Progress
```bash
npx wrangler d1 execute kisigua-production --remote --command="SELECT COUNT(*) as total FROM postal_codes WHERE country_code = 'DE';"
```

### Check Latest Records
```bash
npx wrangler d1 execute kisigua-production --remote --command="SELECT place_name, postal_code, created_at FROM postal_codes WHERE country_code = 'DE' ORDER BY created_at DESC LIMIT 5;"
```

### Check for Duplicates
```bash
npx wrangler d1 execute kisigua-production --remote --command="SELECT postal_code, place_name, COUNT(*) as count FROM postal_codes WHERE country_code = 'DE' GROUP BY postal_code, place_name HAVING count > 1;"
```

## 🛠️ Troubleshooting

### Migration Stops or Fails

1. **Check Error Message**
   - Look for specific batch number that failed
   - Check temporary files in `temp/` directory

2. **Resume Migration**
   ```bash
   # The script handles duplicates, so you can safely re-run
   node scripts/import-postal-codes.js
   ```

3. **Manual Batch Recovery**
   ```bash
   # If a specific batch failed, check temp directory
   ls temp/
   # Re-run specific batch file if needed
   npx wrangler d1 execute kisigua-production --remote --file=temp/batch_0025.sql
   ```

### Performance Issues

1. **Reduce Batch Size**
   Edit `scripts/import-postal-codes.js`:
   ```javascript
   const BATCH_SIZE = 250; // Reduce from 500
   ```

2. **Check D1 Limits**
   - D1 has rate limits for API calls
   - The script includes automatic retry logic
   - Larger batches may hit timeout limits

### Verification Failures

1. **Check Record Count**
   ```bash
   node scripts/check-database-status.js
   ```

2. **Manual Verification**
   ```bash
   npx wrangler d1 execute kisigua-production --remote --command="SELECT COUNT(*) FROM postal_codes WHERE country_code = 'DE';"
   ```

## ✅ Post-Migration Verification

### 1. Record Count Verification
```bash
node scripts/check-database-status.js
```

**Expected Results:**
- Total German records: 23,297
- No duplicate records
- Sample records display correctly

### 2. Test Specific Locations
```bash
# Test Neckartenzlingen
curl "https://kisigua.com/api/locations/postal/72654?country=DE"

# Test search functionality
curl "https://kisigua.com/api/locations/search?q=Neckartenzlingen&country=DE"
```

### 3. Test Distance Calculations
```bash
# Find locations near Esslingen (should include Neckartenzlingen)
curl "https://kisigua.com/api/locations/nearby?lat=48.7394&lng=9.3089&radius=25&country=DE&limit=10"
```

## 🎯 Success Criteria

✅ **Migration Complete When:**
- 23,297 German postal codes imported
- No duplicate records
- API endpoints return correct data
- Search functionality works for Neckartenzlingen
- Distance calculations work correctly

✅ **Performance Targets:**
- Postal code lookup: < 100ms
- Location search: < 500ms
- Nearby search: < 1000ms

## 🚨 Emergency Procedures

### Stop Migration
```bash
# Press Ctrl+C in the migration terminal
# The script will clean up temporary files automatically
```

### Rollback (if needed)
```bash
# Remove all German records (CAUTION!)
npx wrangler d1 execute kisigua-production --remote --command="DELETE FROM postal_codes WHERE country_code = 'DE';"

# Restore sample data
npx wrangler d1 execute kisigua-production --remote --file=sample_postal_data.sql
```

### Clean Restart
```bash
# Remove temporary files
rm -rf temp/

# Check database status
node scripts/check-database-status.js

# Restart migration
node scripts/import-postal-codes.js
```

## 📞 Support

If you encounter issues:

1. **Check the logs** - Migration script provides detailed error messages
2. **Verify prerequisites** - Ensure wrangler is authenticated and D1 access works
3. **Monitor resources** - Check D1 usage limits in Cloudflare dashboard
4. **Test incrementally** - Start with smaller batch sizes if needed

---

**Ready to start the migration?** Run the pre-migration checklist first! 🚀

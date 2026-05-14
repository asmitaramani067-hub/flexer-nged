# Migration Status - Live Data to Neon

## ✅ Completed

1. **Data Export from Live Database**
   - Successfully exported 3,845 trade_opportunity_versions
   - Successfully exported 5,791 nged_windows
   - Successfully exported 120,801 nged_delivery_periods
   - Total data size: ~22MB
   - Files saved to: `data-export/` directory

2. **Migration Scripts Created**
   - `scripts/export-to-json.ts` - Export from live DB to JSON
   - `scripts/import-from-json.ts` - Import JSON to Neon
   - `scripts/migrate-live-batch.ts` - Direct batch migration
   - `scripts/test-live-connection.ts` - Test live DB connectivity

3. **NPM Scripts Added**
   - `npm run export-data` - Export from live database
   - `npm run import-data` - Import to Neon database
   - `npm run migrate-live` - Direct migration (if connectivity allows)

## ⚠️ Pending

**Import to Neon Database**

The data has been exported but NOT yet imported to Neon due to network connectivity issues from the local machine.

### Issue
Connection timeouts when trying to reach Neon database:
```
Error: connect ETIMEDOUT
```

This is likely due to:
1. Network restrictions on local machine
2. Neon database being paused (auto-resumes on connection)
3. Firewall/proxy blocking outbound connections

### Solutions

#### Option 1: Import from Cloud Environment (Recommended)
Deploy to Vercel and run the import from there:

```bash
# 1. Deploy to Vercel
vercel deploy

# 2. SSH into Vercel or use Vercel CLI
vercel env pull
npx tsx scripts/import-from-json.ts
```

#### Option 2: Import from Different Network
Run the import script from a machine with better internet connectivity:

```bash
# Copy data-export folder to another machine
scp -r data-export/ user@remote-machine:/path/

# On remote machine
cd /path/nged-cmz-estimator
npm install
npm run import-data
```

#### Option 3: Use Neon CLI
Upload data directly using Neon's CLI or web interface:

```bash
# Install Neon CLI
npm install -g neonctl

# Import data
neonctl import --project-id your-project-id --database neondb
```

#### Option 4: Wait and Retry
Sometimes Neon databases pause after inactivity. Wait a few minutes and retry:

```bash
npm run import-data
```

## 📊 Data Summary

### Live Database (Source)
- **Host:** 10.2.0.13:15432
- **Database:** flexer
- **User:** flexer_migrator
- **Status:** ✅ Connected and exported

### Neon Database (Target)
- **Host:** ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech
- **Database:** neondb
- **User:** neondb_owner
- **Status:** ⚠️ Connectivity issues from local machine

### Data Counts
| Table | Records |
|-------|---------|
| trade_opportunity_versions | 3,845 |
| nged_windows | 5,791 |
| nged_delivery_periods | 120,801 |

### CMZ Codes Available
The exported data contains opportunities for multiple CMZ codes. After import, you can query:

```sql
SELECT "cmzCode", COUNT(*) as total
FROM public.trade_opportunity_versions
WHERE valid_to IS NULL
GROUP BY "cmzCode"
ORDER BY total DESC;
```

## 🔄 Next Steps

1. **Choose an import method** from the options above
2. **Run the import script** to load data into Neon
3. **Verify the import** with test queries
4. **Test the application** with real CMZ codes
5. **Remove dummy data** (already done during export)

## 🧪 Testing After Import

Once data is imported, test with real CMZ codes:

```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "cmz_code": "CMZ_T10A_EM_0097",
    "battery_kwh": 20,
    "inverter_kw": 5,
    "solar_kw": 4,
    "ev_kw": 8,
    "heat_pump_kw": 20
  }'
```

## 📝 Files

- `data-export/trade_opportunity_versions.json` - 1.2MB
- `data-export/nged_windows.json` - 338KB
- `data-export/nged_delivery_periods.json` - 21MB
- `data-export/README.md` - Documentation

**Note:** JSON files are gitignored due to size.

## 🔒 Security

Live database credentials are hardcoded in migration scripts for convenience. For production:
1. Use environment variables
2. Rotate credentials after migration
3. Restrict database access by IP
4. Use read-only credentials for exports

## 📞 Support

If you continue to have connectivity issues:
1. Check Neon dashboard for database status
2. Verify DATABASE_URL is correct
3. Try from a different network
4. Contact Neon support if database is stuck in paused state
5. Consider using a different Neon region closer to your location

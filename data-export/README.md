# Data Export Directory

This directory contains exported NGED opportunity data from the live database.

## Files

- `trade_opportunity_versions.json` - 3,845 opportunities (~1.2MB)
- `nged_windows.json` - 5,791 windows (~338KB)
- `nged_delivery_periods.json` - 120,801 delivery periods (~21MB)

**Total:** ~22MB

## Export Data

To export fresh data from the live database:

```bash
npx tsx scripts/export-to-json.ts
```

This connects to the live database at `10.2.0.13:15432` and exports all NGED data to JSON files in this directory.

## Import to Neon

To import the exported data into Neon database:

```bash
npx tsx scripts/import-from-json.ts
```

**Note:** This requires network connectivity to Neon. If you get timeout errors, you may need to:
1. Run from a machine with better internet connectivity
2. Check if Neon database is paused (it auto-resumes on first connection)
3. Try from a Vercel deployment or cloud environment

## Alternative: Direct Migration

If you have connectivity to both databases, you can migrate directly:

```bash
npm run migrate-live
```

This uses the batch migration script that processes data in chunks.

## Data Files

The JSON files are gitignored due to their size. After exporting, you can:
- Import them locally
- Upload to cloud storage
- Transfer to a deployment environment
- Use them for backup/restore

## Schema

The data follows this structure:

### trade_opportunity_versions
```json
{
  "id": 1,
  "opportunityId": "OPP_123",
  "opportunityName": "CMZ Competition",
  "cmzCode": "CMZ_T10A_EM_0097",
  "serviceResponseDirection": "GTU",
  "utilisationCeilingPrice": "50.00",
  "valid_to": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### nged_windows
```json
{
  "id": 1,
  "opportunity_version_id": 1
}
```

### nged_delivery_periods
```json
{
  "id": 1,
  "window_id": 1,
  "minRequiredCapacityMw": "0.005",
  "startDate": "2024-01-15",
  "startTime": "17:00",
  "endTime": "19:00"
}
```

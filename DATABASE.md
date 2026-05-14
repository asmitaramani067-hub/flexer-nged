# Database Setup - Neon PostgreSQL

## Overview

The NGED CMZ Earning Estimator uses **Neon PostgreSQL** as its database, hosted on AWS.

## Connection Details

The database connection is configured via environment variables in `.env.local`:

```env
DATABASE_URL=postgresql://neondb_owner:npg_4xuzRdIin6Vc@ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Database Schema

### Tables

1. **trade_opportunity_versions** - NGED competition opportunities
   - `id` - Primary key
   - `opportunityId` - External opportunity identifier
   - `opportunityName` - Human-readable name
   - `cmzCode` - CMZ zone code (e.g., `CMZ_T10A_EM_0097`)
   - `serviceResponseDirection` - `GTU` (UP) or `DTU` (DOWN)
   - `utilisationCeilingPrice` - Reward rate in £/MWh
   - `valid_to` - Expiry timestamp (NULL = active)

2. **nged_windows** - Competition windows
   - `id` - Primary key
   - `opportunity_version_id` - Foreign key to trade_opportunity_versions

3. **nged_delivery_periods** - Specific delivery time slots
   - `id` - Primary key
   - `window_id` - Foreign key to nged_windows
   - `minRequiredCapacityMw` - Minimum capacity requirement in MW
   - `startDate` - Delivery date
   - `startTime` - Start time (HH:MM format)
   - `endTime` - End time (HH:MM format)

## Seeding Sample Data

To populate the database with sample NGED competition data:

```bash
npm run seed-db
```

Or manually:

```bash
npx tsx scripts/seed-neon.ts
```

This creates sample competitions for:
- `CMZ_T10A_EM_0097`
- `CMZ_T10A_EM_0111_G`

With 6 months of historical data (UP and DOWN competitions).

## Testing Database Connection

```bash
npx tsx scripts/test-db.ts
```

## Checking Database Schema

```bash
npx tsx scripts/check-schema.ts
```

## Migration from Staging DB

If you need to migrate data from the staging database (10.2.0.13:15432):

```bash
npx tsx scripts/migrate-to-neon.ts
```

**Note:** Requires access to the staging database with correct credentials.

## Query Examples

### Find all competitions for a CMZ code:

```sql
SELECT 
  tov."opportunityName",
  tov."serviceResponseDirection",
  tov."utilisationCeilingPrice",
  dp."startDate",
  dp."startTime",
  dp."endTime"
FROM public.trade_opportunity_versions tov
JOIN public.nged_windows w ON w.opportunity_version_id = tov.id
JOIN public.nged_delivery_periods dp ON dp.window_id = w.id
WHERE tov."cmzCode" = 'CMZ_T10A_EM_0097'
AND tov.valid_to IS NULL
ORDER BY dp."startDate" DESC;
```

### Count active opportunities:

```sql
SELECT 
  "cmzCode",
  COUNT(*) as total_opportunities
FROM public.trade_opportunity_versions
WHERE valid_to IS NULL
GROUP BY "cmzCode";
```

## Production Deployment

For Vercel deployment, add the `DATABASE_URL` environment variable in the Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add `DATABASE_URL` with the Neon connection string
3. Redeploy the application

The connection pool is configured with:
- Max connections: 5
- Idle timeout: 30 seconds
- Connection timeout: 5 seconds
- SSL: Required with `rejectUnauthorized: false`

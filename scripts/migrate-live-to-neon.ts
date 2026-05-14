/**
 * Migrate real NGED data from live database to Neon
 * Clears dummy data and replaces with production data
 * 
 * Usage:
 *   npm run migrate-live
 *   OR with custom credentials:
 *   LIVE_DB_USER=your_user LIVE_DB_PASSWORD=your_pass npm run migrate-live
 */
import { Pool } from 'pg';

// Source: Live Production DB (use env vars or defaults)
const livePool = new Pool({
  host: process.env.LIVE_DB_HOST || '10.2.0.13',
  port: parseInt(process.env.LIVE_DB_PORT || '15432'),
  database: process.env.LIVE_DB_NAME || 'flexer',
  user: process.env.LIVE_DB_USER || 'flexer_migrator',
  password: process.env.LIVE_DB_PASSWORD || '36V5lz5hZHQxoKi',
  ssl: false,
  max: 5,
});

// Target: Neon DB
const neonPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4xuzRdIin6Vc@ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 30000, // 30 seconds
  idleTimeoutMillis: 30000,
});

async function migrate() {
  try {
    console.log('🔄 Starting migration from live database to Neon...\n');
    
    // Step 1: Test connections
    console.log('📡 Testing connections...');
    await livePool.query('SELECT NOW()');
    console.log('✓ Live database connected');
    
    await neonPool.query('SELECT NOW()');
    console.log('✓ Neon database connected\n');
    
    // Step 2: Clear dummy data from Neon
    console.log('🧹 Clearing dummy data from Neon...');
    await neonPool.query('TRUNCATE public.trade_opportunity_versions CASCADE');
    console.log('✓ Dummy data cleared\n');
    
    // Step 3: Fetch data from live database
    console.log('📥 Fetching data from live database...');
    
    // Get trade_opportunity_versions
    const tovResult = await livePool.query(`
      SELECT 
        id,
        "opportunityId",
        "opportunityName",
        "cmzCode",
        "serviceResponseDirection",
        "utilisationCeilingPrice",
        valid_to,
        created_at
      FROM public.trade_opportunity_versions
      ORDER BY id
    `);
    console.log(`✓ Found ${tovResult.rows.length} trade_opportunity_versions`);
    
    // Get nged_windows
    const windowsResult = await livePool.query(`
      SELECT 
        id,
        opportunity_version_id,
        created_at
      FROM public.nged_windows
      ORDER BY id
    `);
    console.log(`✓ Found ${windowsResult.rows.length} nged_windows`);
    
    // Get nged_delivery_periods
    const periodsResult = await livePool.query(`
      SELECT 
        id,
        window_id,
        "minRequiredCapacityMw",
        "startDate",
        "startTime",
        "endTime",
        created_at
      FROM public.nged_delivery_periods
      ORDER BY id
    `);
    console.log(`✓ Found ${periodsResult.rows.length} nged_delivery_periods\n`);
    
    // Step 4: Insert into Neon
    console.log('📤 Inserting data into Neon...');
    
    // Insert trade_opportunity_versions
    let tovCount = 0;
    for (const row of tovResult.rows) {
      await neonPool.query(`
        INSERT INTO public.trade_opportunity_versions 
        (id, "opportunityId", "opportunityName", "cmzCode", "serviceResponseDirection", "utilisationCeilingPrice", valid_to, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          "opportunityId" = EXCLUDED."opportunityId",
          "opportunityName" = EXCLUDED."opportunityName",
          "cmzCode" = EXCLUDED."cmzCode",
          "serviceResponseDirection" = EXCLUDED."serviceResponseDirection",
          "utilisationCeilingPrice" = EXCLUDED."utilisationCeilingPrice",
          valid_to = EXCLUDED.valid_to
      `, [
        row.id,
        row.opportunityId,
        row.opportunityName,
        row.cmzCode,
        row.serviceResponseDirection,
        row.utilisationCeilingPrice,
        row.valid_to,
        row.created_at
      ]);
      tovCount++;
      
      if (tovCount % 100 === 0) {
        process.stdout.write(`\r  Progress: ${tovCount}/${tovResult.rows.length} opportunities`);
      }
    }
    console.log(`\n✓ Inserted ${tovCount} trade_opportunity_versions`);
    
    // Insert nged_windows
    let windowCount = 0;
    for (const row of windowsResult.rows) {
      await neonPool.query(`
        INSERT INTO public.nged_windows 
        (id, opportunity_version_id, created_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET
          opportunity_version_id = EXCLUDED.opportunity_version_id
      `, [row.id, row.opportunity_version_id, row.created_at]);
      windowCount++;
      
      if (windowCount % 100 === 0) {
        process.stdout.write(`\r  Progress: ${windowCount}/${windowsResult.rows.length} windows`);
      }
    }
    console.log(`\n✓ Inserted ${windowCount} nged_windows`);
    
    // Insert nged_delivery_periods
    let periodCount = 0;
    for (const row of periodsResult.rows) {
      await neonPool.query(`
        INSERT INTO public.nged_delivery_periods 
        (id, window_id, "minRequiredCapacityMw", "startDate", "startTime", "endTime", created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          window_id = EXCLUDED.window_id,
          "minRequiredCapacityMw" = EXCLUDED."minRequiredCapacityMw",
          "startDate" = EXCLUDED."startDate",
          "startTime" = EXCLUDED."startTime",
          "endTime" = EXCLUDED."endTime"
      `, [
        row.id,
        row.window_id,
        row.minRequiredCapacityMw,
        row.startDate,
        row.startTime,
        row.endTime,
        row.created_at
      ]);
      periodCount++;
      
      if (periodCount % 100 === 0) {
        process.stdout.write(`\r  Progress: ${periodCount}/${periodsResult.rows.length} periods`);
      }
    }
    console.log(`\n✓ Inserted ${periodCount} nged_delivery_periods\n`);
    
    // Step 5: Verify migration
    console.log('🔍 Verifying migration...');
    
    const verifyResult = await neonPool.query(`
      SELECT 
        tov."cmzCode",
        COUNT(DISTINCT tov.id) as opportunities,
        COUNT(DISTINCT w.id) as windows,
        COUNT(dp.id) as periods
      FROM public.trade_opportunity_versions tov
      LEFT JOIN public.nged_windows w ON w.opportunity_version_id = tov.id
      LEFT JOIN public.nged_delivery_periods dp ON dp.window_id = w.id
      WHERE tov.valid_to IS NULL
      GROUP BY tov."cmzCode"
      ORDER BY tov."cmzCode"
    `);
    
    console.log('\nActive opportunities by CMZ code:');
    for (const row of verifyResult.rows) {
      console.log(`  ${row.cmzCode}: ${row.opportunities} opportunities, ${row.windows} windows, ${row.periods} periods`);
    }
    
    // Get total counts
    const totalResult = await neonPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM public.trade_opportunity_versions) as total_opportunities,
        (SELECT COUNT(*) FROM public.nged_windows) as total_windows,
        (SELECT COUNT(*) FROM public.nged_delivery_periods) as total_periods
    `);
    
    console.log('\nTotal records in Neon:');
    console.log(`  Opportunities: ${totalResult.rows[0].total_opportunities}`);
    console.log(`  Windows: ${totalResult.rows[0].total_windows}`);
    console.log(`  Periods: ${totalResult.rows[0].total_periods}`);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 You can now test the application with real data.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await livePool.end();
    await neonPool.end();
  }
}

// Run migration
migrate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

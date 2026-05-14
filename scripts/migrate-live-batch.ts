/**
 * Batch migration from live database to Neon
 * Processes data in smaller chunks with progress tracking
 */
import { Pool } from 'pg';
import * as fs from 'fs';

const BATCH_SIZE = 100;
const PROGRESS_FILE = '/tmp/migration-progress.json';

// Source: Live Production DB
const livePool = new Pool({
  host: '10.2.0.13',
  port: 15432,
  database: 'flexer',
  user: 'flexer_migrator',
  password: '36V5lz5hZHQxoKi',
  ssl: false,
  max: 5,
});

// Target: Neon DB
const neonPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4xuzRdIin6Vc@ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 60000,
});

interface Progress {
  lastTovId: number;
  lastWindowId: number;
  lastPeriodId: number;
  tovCount: number;
  windowCount: number;
  periodCount: number;
}

function loadProgress(): Progress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (e) {
    // Ignore
  }
  return { lastTovId: 0, lastWindowId: 0, lastPeriodId: 0, tovCount: 0, windowCount: 0, periodCount: 0 };
}

function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function migrate() {
  let progress = loadProgress();
  
  try {
    console.log('🔄 Starting batch migration from live database to Neon...\n');
    
    // Test connections
    console.log('📡 Testing connections...');
    await livePool.query('SELECT NOW()');
    console.log('✓ Live database connected');
    
    console.log('⏳ Connecting to Neon (this may take a moment)...');
    const neonTest = await neonPool.query('SELECT NOW()');
    console.log('✓ Neon database connected:', neonTest.rows[0].now);
    
    // Clear dummy data only on first run
    if (progress.tovCount === 0) {
      console.log('\n🧹 Clearing dummy data from Neon...');
      await neonPool.query('TRUNCATE public.trade_opportunity_versions CASCADE');
      console.log('✓ Dummy data cleared\n');
    } else {
      console.log(`\n📊 Resuming from: TOV ID ${progress.lastTovId}, Window ID ${progress.lastWindowId}, Period ID ${progress.lastPeriodId}\n`);
    }
    
    // Migrate trade_opportunity_versions in batches
    console.log('📥 Migrating trade_opportunity_versions...');
    let hasMore = true;
    while (hasMore) {
      const tovBatch = await livePool.query(`
        SELECT id, "opportunityId", "opportunityName", "cmzCode", "serviceResponseDirection", "utilisationCeilingPrice", valid_to, created_at
        FROM public.trade_opportunity_versions
        WHERE id > $1
        ORDER BY id
        LIMIT $2
      `, [progress.lastTovId, BATCH_SIZE]);
      
      if (tovBatch.rows.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const row of tovBatch.rows) {
        await neonPool.query(`
          INSERT INTO public.trade_opportunity_versions 
          (id, "opportunityId", "opportunityName", "cmzCode", "serviceResponseDirection", "utilisationCeilingPrice", valid_to, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [row.id, row.opportunityId, row.opportunityName, row.cmzCode, row.serviceResponseDirection, row.utilisationCeilingPrice, row.valid_to, row.created_at]);
        
        progress.lastTovId = row.id;
        progress.tovCount++;
      }
      
      saveProgress(progress);
      process.stdout.write(`\r  Progress: ${progress.tovCount} opportunities migrated (last ID: ${progress.lastTovId})`);
    }
    console.log(`\n✓ Migrated ${progress.tovCount} trade_opportunity_versions\n`);
    
    // Migrate nged_windows in batches
    console.log('📥 Migrating nged_windows...');
    hasMore = true;
    while (hasMore) {
      const windowBatch = await livePool.query(`
        SELECT id, opportunity_version_id, created_at
        FROM public.nged_windows
        WHERE id > $1
        ORDER BY id
        LIMIT $2
      `, [progress.lastWindowId, BATCH_SIZE]);
      
      if (windowBatch.rows.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const row of windowBatch.rows) {
        await neonPool.query(`
          INSERT INTO public.nged_windows (id, opportunity_version_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (id) DO NOTHING
        `, [row.id, row.opportunity_version_id, row.created_at]);
        
        progress.lastWindowId = row.id;
        progress.windowCount++;
      }
      
      saveProgress(progress);
      process.stdout.write(`\r  Progress: ${progress.windowCount} windows migrated (last ID: ${progress.lastWindowId})`);
    }
    console.log(`\n✓ Migrated ${progress.windowCount} nged_windows\n`);
    
    // Migrate nged_delivery_periods in batches
    console.log('📥 Migrating nged_delivery_periods...');
    hasMore = true;
    while (hasMore) {
      const periodBatch = await livePool.query(`
        SELECT id, window_id, "minRequiredCapacityMw", "startDate", "startTime", "endTime", created_at
        FROM public.nged_delivery_periods
        WHERE id > $1
        ORDER BY id
        LIMIT $2
      `, [progress.lastPeriodId, BATCH_SIZE]);
      
      if (periodBatch.rows.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const row of periodBatch.rows) {
        await neonPool.query(`
          INSERT INTO public.nged_delivery_periods 
          (id, window_id, "minRequiredCapacityMw", "startDate", "startTime", "endTime", created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [row.id, row.window_id, row.minRequiredCapacityMw, row.startDate, row.startTime, row.endTime, row.created_at]);
        
        progress.lastPeriodId = row.id;
        progress.periodCount++;
      }
      
      saveProgress(progress);
      process.stdout.write(`\r  Progress: ${progress.periodCount} periods migrated (last ID: ${progress.lastPeriodId})`);
    }
    console.log(`\n✓ Migrated ${progress.periodCount} nged_delivery_periods\n`);
    
    // Verify
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
      LIMIT 10
    `);
    
    console.log('\nSample CMZ codes (first 10):');
    for (const row of verifyResult.rows) {
      console.log(`  ${row.cmzCode}: ${row.opportunities} opportunities, ${row.windows} windows, ${row.periods} periods`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    // Clean up progress file
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log(`\n💾 Progress saved. Run again to resume from: TOV ${progress.lastTovId}, Window ${progress.lastWindowId}, Period ${progress.lastPeriodId}`);
    throw error;
  } finally {
    await livePool.end();
    await neonPool.end();
  }
}

migrate().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

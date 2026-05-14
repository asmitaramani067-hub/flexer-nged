/**
 * Migrate data from staging DB to Neon DB
 */
import { Pool } from 'pg';

// Source: Staging DB
const sourcePool = new Pool({
  host: '10.2.0.13',
  port: 15432,
  database: 'flexer',
  user: 'flexer_migrator',
  password: 'flexer_migrator',
  ssl: false,
});

// Target: Neon DB
const targetPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_4xuzRdIin6Vc@ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false, require: true },
});

async function migrate() {
  try {
    console.log('🔍 Checking source database schema...\n');
    
    // Get table structures from source
    const tables = await sourcePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('trade_opportunity_versions', 'nged_windows', 'nged_delivery_periods')
      ORDER BY table_name
    `);
    
    console.log('Found tables in source:', tables.rows.map(r => r.table_name));
    
    for (const { table_name } of tables.rows) {
      // Get CREATE TABLE statement
      const columns = await sourcePool.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table_name]);
      
      console.log(`\n📋 ${table_name}: ${columns.rows.length} columns`);
      
      // Get row count
      const count = await sourcePool.query(`SELECT COUNT(*) FROM public.${table_name}`);
      console.log(`   ${count.rows[0].count} rows`);
    }
    
    console.log('\n✅ Schema check complete. Ready to create tables in Neon.');
    console.log('\n⚠️  This script will now create tables and copy data.');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create tables in target (simplified schema for MVP)
    console.log('\n📝 Creating tables in Neon...');
    
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS public.trade_opportunity_versions (
        id SERIAL PRIMARY KEY,
        "opportunityId" VARCHAR(255),
        "opportunityName" VARCHAR(255),
        "cmzCode" VARCHAR(100),
        "serviceResponseDirection" VARCHAR(50),
        "utilisationCeilingPrice" DECIMAL(10, 2),
        valid_to TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ trade_opportunity_versions');
    
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS public.nged_windows (
        id SERIAL PRIMARY KEY,
        opportunity_version_id INTEGER REFERENCES public.trade_opportunity_versions(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ nged_windows');
    
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS public.nged_delivery_periods (
        id SERIAL PRIMARY KEY,
        window_id INTEGER REFERENCES public.nged_windows(id),
        "minRequiredCapacityMw" DECIMAL(10, 4),
        "startDate" DATE,
        "startTime" VARCHAR(10),
        "endTime" VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ nged_delivery_periods');
    
    // Copy data
    console.log('\n📦 Copying data...');
    
    // Copy trade_opportunity_versions
    const tovData = await sourcePool.query(`
      SELECT 
        id,
        "opportunityId",
        "opportunityName",
        "cmzCode",
        "serviceResponseDirection",
        "utilisationCeilingPrice",
        valid_to
      FROM public.trade_opportunity_versions
    `);
    
    for (const row of tovData.rows) {
      await targetPool.query(`
        INSERT INTO public.trade_opportunity_versions 
        (id, "opportunityId", "opportunityName", "cmzCode", "serviceResponseDirection", "utilisationCeilingPrice", valid_to)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [row.id, row.opportunityId, row.opportunityName, row.cmzCode, row.serviceResponseDirection, row.utilisationCeilingPrice, row.valid_to]);
    }
    console.log(`✓ Copied ${tovData.rows.length} trade_opportunity_versions`);
    
    // Copy nged_windows
    const windowsData = await sourcePool.query(`
      SELECT id, opportunity_version_id
      FROM public.nged_windows
    `);
    
    for (const row of windowsData.rows) {
      await targetPool.query(`
        INSERT INTO public.nged_windows (id, opportunity_version_id)
        VALUES ($1, $2)
        ON CONFLICT (id) DO NOTHING
      `, [row.id, row.opportunity_version_id]);
    }
    console.log(`✓ Copied ${windowsData.rows.length} nged_windows`);
    
    // Copy nged_delivery_periods
    const periodsData = await sourcePool.query(`
      SELECT 
        id,
        window_id,
        "minRequiredCapacityMw",
        "startDate",
        "startTime",
        "endTime"
      FROM public.nged_delivery_periods
    `);
    
    for (const row of periodsData.rows) {
      await targetPool.query(`
        INSERT INTO public.nged_delivery_periods 
        (id, window_id, "minRequiredCapacityMw", "startDate", "startTime", "endTime")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [row.id, row.window_id, row.minRequiredCapacityMw, row.startDate, row.startTime, row.endTime]);
    }
    console.log(`✓ Copied ${periodsData.rows.length} nged_delivery_periods`);
    
    console.log('\n✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

migrate();

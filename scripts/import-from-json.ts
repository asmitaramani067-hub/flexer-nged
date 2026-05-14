/**
 * Import JSON files into Neon database
 */
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const neonPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4xuzRdIin6Vc@ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 60000,
});

const INPUT_DIR = path.join(__dirname, '../data-export');

async function importData() {
  try {
    console.log('📥 Importing data into Neon database...\n');
    
    // Test connection
    console.log('Testing Neon connection...');
    await neonPool.query('SELECT NOW()');
    console.log('✓ Connected to Neon\n');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await neonPool.query('TRUNCATE public.trade_opportunity_versions CASCADE');
    console.log('✓ Cleared\n');
    
    // Import trade_opportunity_versions
    console.log('Importing trade_opportunity_versions...');
    const tovData = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'trade_opportunity_versions.json'), 'utf8')
    );
    
    for (let i = 0; i < tovData.length; i++) {
      const row = tovData[i];
      await neonPool.query(`
        INSERT INTO public.trade_opportunity_versions 
        (id, "opportunityId", "opportunityName", "cmzCode", "serviceResponseDirection", "utilisationCeilingPrice", valid_to, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [row.id, row.opportunityId, row.opportunityName, row.cmzCode, row.serviceResponseDirection, row.utilisationCeilingPrice, row.valid_to, row.createdAt]);
      
      if ((i + 1) % 100 === 0) {
        process.stdout.write(`\r  Progress: ${i + 1}/${tovData.length}`);
      }
    }
    console.log(`\n✓ Imported ${tovData.length} trade_opportunity_versions\n`);
    
    // Import nged_windows
    console.log('Importing nged_windows...');
    const windowsData = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'nged_windows.json'), 'utf8')
    );
    
    for (let i = 0; i < windowsData.length; i++) {
      const row = windowsData[i];
      await neonPool.query(`
        INSERT INTO public.nged_windows (id, opportunity_version_id)
        VALUES ($1, $2)
      `, [row.id, row.opportunity_version_id]);
      
      if ((i + 1) % 100 === 0) {
        process.stdout.write(`\r  Progress: ${i + 1}/${windowsData.length}`);
      }
    }
    console.log(`\n✓ Imported ${windowsData.length} nged_windows\n`);
    
    // Import nged_delivery_periods
    console.log('Importing nged_delivery_periods...');
    const periodsData = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'nged_delivery_periods.json'), 'utf8')
    );
    
    for (let i = 0; i < periodsData.length; i++) {
      const row = periodsData[i];
      await neonPool.query(`
        INSERT INTO public.nged_delivery_periods 
        (id, window_id, "minRequiredCapacityMw", "startDate", "startTime", "endTime")
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [row.id, row.window_id, row.minRequiredCapacityMw, row.startDate, row.startTime, row.endTime]);
      
      if ((i + 1) % 100 === 0) {
        process.stdout.write(`\r  Progress: ${i + 1}/${periodsData.length}`);
      }
    }
    console.log(`\n✓ Imported ${periodsData.length} nged_delivery_periods\n`);
    
    // Verify
    console.log('Verifying import...');
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
    
    console.log('\n✅ Import complete!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await neonPool.end();
  }
}

importData();

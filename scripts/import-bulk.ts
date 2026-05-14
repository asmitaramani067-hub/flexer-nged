/**
 * Bulk import JSON files into Neon database (faster)
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
const BATCH_SIZE = 500;

async function importData() {
  try {
    console.log('📥 Bulk importing data into Neon database...\n');
    
    // Test connection
    console.log('Testing Neon connection...');
    await neonPool.query('SELECT NOW()');
    console.log('✓ Connected to Neon\n');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await neonPool.query('TRUNCATE public.trade_opportunity_versions CASCADE');
    console.log('✓ Cleared\n');
    
    // Import trade_opportunity_versions in batches
    console.log('Importing trade_opportunity_versions...');
    const tovData = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'trade_opportunity_versions.json'), 'utf8')
    );
    
    for (let i = 0; i < tovData.length; i += BATCH_SIZE) {
      const batch = tovData.slice(i, i + BATCH_SIZE);
      const values: any[] = [];
      const placeholders: string[] = [];
      
      batch.forEach((row: any, idx: number) => {
        const offset = idx * 8;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);
        values.push(
          row.id,
          row.opportunityId,
          row.opportunityName,
          row.cmzCode,
          row.serviceResponseDirection,
          row.utilisationCeilingPrice,
          row.valid_to,
          row.createdAt
        );
      });
      
      await neonPool.query(`
        INSERT INTO public.trade_opportunity_versions 
        (id, "opportunityId", "opportunityName", "cmzCode", "serviceResponseDirection", "utilisationCeilingPrice", valid_to, created_at)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO NOTHING
      `, values);
      
      process.stdout.write(`\r  Progress: ${Math.min(i + BATCH_SIZE, tovData.length)}/${tovData.length}`);
    }
    console.log(`\n✓ Imported ${tovData.length} trade_opportunity_versions\n`);
    
    // Import nged_windows in batches
    console.log('Importing nged_windows...');
    const windowsData = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'nged_windows.json'), 'utf8')
    );
    
    for (let i = 0; i < windowsData.length; i += BATCH_SIZE) {
      const batch = windowsData.slice(i, i + BATCH_SIZE);
      const values: any[] = [];
      const placeholders: string[] = [];
      
      batch.forEach((row: any, idx: number) => {
        const offset = idx * 2;
        placeholders.push(`($${offset + 1}, $${offset + 2})`);
        values.push(row.id, row.opportunity_version_id);
      });
      
      await neonPool.query(`
        INSERT INTO public.nged_windows (id, opportunity_version_id)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO NOTHING
      `, values);
      
      process.stdout.write(`\r  Progress: ${Math.min(i + BATCH_SIZE, windowsData.length)}/${windowsData.length}`);
    }
    console.log(`\n✓ Imported ${windowsData.length} nged_windows\n`);
    
    // Import nged_delivery_periods in batches
    console.log('Importing nged_delivery_periods...');
    const periodsData = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'nged_delivery_periods.json'), 'utf8')
    );
    
    for (let i = 0; i < periodsData.length; i += BATCH_SIZE) {
      const batch = periodsData.slice(i, i + BATCH_SIZE);
      const values: any[] = [];
      const placeholders: string[] = [];
      
      batch.forEach((row: any, idx: number) => {
        const offset = idx * 6;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
        values.push(
          row.id,
          row.window_id,
          row.minRequiredCapacityMw,
          row.startDate,
          row.startTime,
          row.endTime
        );
      });
      
      await neonPool.query(`
        INSERT INTO public.nged_delivery_periods 
        (id, window_id, "minRequiredCapacityMw", "startDate", "startTime", "endTime")
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO NOTHING
      `, values);
      
      process.stdout.write(`\r  Progress: ${Math.min(i + BATCH_SIZE, periodsData.length)}/${periodsData.length}`);
    }
    console.log(`\n✓ Imported ${periodsData.length} nged_delivery_periods\n`);
    
    // Verify
    console.log('🔍 Verifying import...');
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
    
    // Get total counts
    const totalResult = await neonPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM public.trade_opportunity_versions) as total_opportunities,
        (SELECT COUNT(*) FROM public.nged_windows) as total_windows,
        (SELECT COUNT(*) FROM public.nged_delivery_periods) as total_periods
    `);
    
    console.log('\n📊 Total records in Neon:');
    console.log(`  Opportunities: ${totalResult.rows[0].total_opportunities}`);
    console.log(`  Windows: ${totalResult.rows[0].total_windows}`);
    console.log(`  Periods: ${totalResult.rows[0].total_periods}`);
    
    console.log('\n✅ Import complete! Real data is now in Neon.');
    console.log('\n💡 Test with real CMZ codes from the list above.');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await neonPool.end();
  }
}

importData();

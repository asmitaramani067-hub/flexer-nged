/**
 * Export live database to JSON files
 * These can then be imported into Neon from a machine with better connectivity
 */
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const livePool = new Pool({
  host: '10.2.0.13',
  port: 15432,
  database: 'flexer',
  user: 'flexer_migrator',
  password: '36V5lz5hZHQxoKi',
  ssl: false,
  max: 5,
});

const OUTPUT_DIR = path.join(__dirname, '../data-export');

async function exportData() {
  try {
    console.log('📤 Exporting data from live database...\n');
    
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Export trade_opportunity_versions
    console.log('Exporting trade_opportunity_versions...');
    const tovResult = await livePool.query(`
      SELECT id, "opportunityId", "opportunityName", "cmzCode", "serviceResponseDirection", "utilisationCeilingPrice", valid_to, "createdAt"
      FROM public.trade_opportunity_versions
      ORDER BY id
    `);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'trade_opportunity_versions.json'),
      JSON.stringify(tovResult.rows, null, 2)
    );
    console.log(`✓ Exported ${tovResult.rows.length} trade_opportunity_versions`);
    
    // Export nged_windows
    console.log('Exporting nged_windows...');
    const windowsResult = await livePool.query(`
      SELECT id, opportunity_version_id
      FROM public.nged_windows
      ORDER BY id
    `);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'nged_windows.json'),
      JSON.stringify(windowsResult.rows, null, 2)
    );
    console.log(`✓ Exported ${windowsResult.rows.length} nged_windows`);
    
    // Export nged_delivery_periods
    console.log('Exporting nged_delivery_periods...');
    const periodsResult = await livePool.query(`
      SELECT id, window_id, "minRequiredCapacityMw", "startDate", "startTime", "endTime"
      FROM public.nged_delivery_periods
      ORDER BY id
    `);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'nged_delivery_periods.json'),
      JSON.stringify(periodsResult.rows, null, 2)
    );
    console.log(`✓ Exported ${periodsResult.rows.length} nged_delivery_periods`);
    
    console.log(`\n✅ Export complete! Files saved to: ${OUTPUT_DIR}`);
    console.log('\nTo import into Neon, run: npm run import-from-json');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await livePool.end();
  }
}

exportData();

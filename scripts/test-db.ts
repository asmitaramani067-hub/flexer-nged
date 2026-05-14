/**
 * Test script to verify Neon DB connection and schema
 */
import { getPool } from '../lib/db';

async function testConnection() {
  const pool = getPool();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Connection successful:', result.rows[0]);
    
    // Check for required tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('trade_opportunity_versions', 'nged_windows', 'nged_delivery_periods')
      ORDER BY table_name
    `);
    
    console.log('\n✓ Found tables:', tables.rows.map(r => r.table_name));
    
    if (tables.rows.length < 3) {
      console.log('\n⚠ Missing tables! Expected: trade_opportunity_versions, nged_windows, nged_delivery_periods');
      console.log('Found:', tables.rows.length, 'tables');
    }
    
    // Check row counts
    for (const row of tables.rows) {
      const count = await pool.query(`SELECT COUNT(*) FROM public.${row.table_name}`);
      console.log(`  - ${row.table_name}: ${count.rows[0].count} rows`);
    }
    
    // Test a sample query
    if (tables.rows.length === 3) {
      console.log('\nTesting sample query...');
      const sample = await pool.query(`
        SELECT COUNT(*) as total
        FROM public.trade_opportunity_versions tov
        WHERE tov.valid_to IS NULL
      `);
      console.log('✓ Active opportunities:', sample.rows[0].total);
    }
    
  } catch (error) {
    console.error('✗ Database error:', error);
  } finally {
    await pool.end();
  }
}

testConnection();

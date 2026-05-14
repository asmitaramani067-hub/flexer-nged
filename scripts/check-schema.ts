/**
 * Check what tables and schemas exist in Neon DB
 */
import { getPool } from '../lib/db';

async function checkSchema() {
  const pool = getPool();
  
  try {
    // List all schemas
    const schemas = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schema_name
    `);
    console.log('Available schemas:', schemas.rows.map(r => r.schema_name));
    
    // List all tables in all schemas
    const tables = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);
    
    console.log('\nAll tables:');
    for (const row of tables.rows) {
      console.log(`  ${row.table_schema}.${row.table_name}`);
    }
    
    if (tables.rows.length === 0) {
      console.log('  (no tables found)');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();

/**
 * Test connection to live database
 */
import { Pool } from 'pg';

async function testConnection() {
  // Try different credential combinations
  const credentials = [
    { user: 'flexer_migrator', password: '36V5lz5hZHQxoKi', label: 'flexer_migrator (correct)' },
    { user: 'svc_flexer', password: '7CeYrCTZqQ2r09ct', label: 'svc_flexer' },
    { user: 'flexer', password: 'flexer', label: 'flexer' },
    { user: 'postgres', password: 'postgres', label: 'postgres' },
  ];

  for (const cred of credentials) {
    console.log(`\nTrying ${cred.label}...`);
    const pool = new Pool({
      host: '10.2.0.13',
      port: 15432,
      database: 'flexer',
      user: cred.user,
      password: cred.password,
      ssl: false,
      connectionTimeoutMillis: 5000,
    });

    try {
      const result = await pool.query('SELECT NOW(), current_user');
      console.log(`✓ SUCCESS with ${cred.label}`);
      console.log(`  Current time: ${result.rows[0].now}`);
      console.log(`  Current user: ${result.rows[0].current_user}`);
      
      // Try to count records
      const count = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM public.trade_opportunity_versions) as opportunities,
          (SELECT COUNT(*) FROM public.nged_windows) as windows,
          (SELECT COUNT(*) FROM public.nged_delivery_periods) as periods
      `);
      console.log(`  Records: ${count.rows[0].opportunities} opportunities, ${count.rows[0].windows} windows, ${count.rows[0].periods} periods`);
      
      await pool.end();
      console.log(`\n✅ Use these credentials for migration:`);
      console.log(`   User: ${cred.user}`);
      console.log(`   Password: ${cred.password}`);
      return;
    } catch (error: any) {
      console.log(`✗ Failed: ${error.message}`);
      await pool.end();
    }
  }

  console.log('\n❌ All credential combinations failed');
  console.log('\nPlease provide the correct credentials:');
  console.log('  LIVE_DB_USER=your_user LIVE_DB_PASSWORD=your_pass npm run migrate-live');
}

testConnection();

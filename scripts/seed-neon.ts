/**
 * Seed Neon DB with sample NGED competition data
 */
import { getPool } from '../lib/db';

async function seed() {
  const pool = getPool();
  
  try {
    console.log('🌱 Seeding Neon database...\n');
    
    // Create tables
    console.log('📝 Creating tables...');
    
    await pool.query(`
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
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.nged_windows (
        id SERIAL PRIMARY KEY,
        opportunity_version_id INTEGER REFERENCES public.trade_opportunity_versions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ nged_windows');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.nged_delivery_periods (
        id SERIAL PRIMARY KEY,
        window_id INTEGER REFERENCES public.nged_windows(id) ON DELETE CASCADE,
        "minRequiredCapacityMw" DECIMAL(10, 4),
        "startDate" DATE,
        "startTime" VARCHAR(10),
        "endTime" VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ nged_delivery_periods');
    
    // Clear existing data
    console.log('\n🧹 Clearing existing data...');
    await pool.query('TRUNCATE public.trade_opportunity_versions CASCADE');
    
    // Insert sample data for CMZ_T10A_EM_0097
    console.log('\n📦 Inserting sample data...');
    
    const cmzCodes = ['CMZ_T10A_EM_0097', 'CMZ_T10A_EM_0111_G'];
    let tovCount = 0;
    let windowCount = 0;
    let periodCount = 0;
    
    for (const cmzCode of cmzCodes) {
      // Create opportunities for the past 6 months
      const today = new Date();
      for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - monthOffset);
        
        // UP competition
        const upResult = await pool.query(`
          INSERT INTO public.trade_opportunity_versions 
          ("opportunityId", "opportunityName", "cmzCode", "serviceResponseDirection", "utilisationCeilingPrice", valid_to)
          VALUES ($1, $2, $3, $4, $5, NULL)
          RETURNING id
        `, [
          `OPP_UP_${cmzCode}_${monthOffset}`,
          `${cmzCode} UP Competition ${monthOffset}`,
          cmzCode,
          'GTU',
          50.00 + (monthOffset * 5)
        ]);
        tovCount++;
        
        const upTovId = upResult.rows[0].id;
        
        // Create window
        const upWindowResult = await pool.query(`
          INSERT INTO public.nged_windows (opportunity_version_id)
          VALUES ($1)
          RETURNING id
        `, [upTovId]);
        windowCount++;
        
        const upWindowId = upWindowResult.rows[0].id;
        
        // Create 3 delivery periods for this month
        for (let day = 1; day <= 3; day++) {
          const deliveryDate = new Date(date);
          deliveryDate.setDate(day);
          
          await pool.query(`
            INSERT INTO public.nged_delivery_periods 
            (window_id, "minRequiredCapacityMw", "startDate", "startTime", "endTime")
            VALUES ($1, $2, $3, $4, $5)
          `, [
            upWindowId,
            0.005, // 5 kW minimum
            deliveryDate.toISOString().split('T')[0],
            '17:00',
            '19:00'
          ]);
          periodCount++;
        }
        
        // DOWN competition
        const downResult = await pool.query(`
          INSERT INTO public.trade_opportunity_versions 
          ("opportunityId", "opportunityName", "cmzCode", "serviceResponseDirection", "utilisationCeilingPrice", valid_to)
          VALUES ($1, $2, $3, $4, $5, NULL)
          RETURNING id
        `, [
          `OPP_DOWN_${cmzCode}_${monthOffset}`,
          `${cmzCode} DOWN Competition ${monthOffset}`,
          cmzCode,
          'DTU',
          45.00 + (monthOffset * 4)
        ]);
        tovCount++;
        
        const downTovId = downResult.rows[0].id;
        
        // Create window
        const downWindowResult = await pool.query(`
          INSERT INTO public.nged_windows (opportunity_version_id)
          VALUES ($1)
          RETURNING id
        `, [downTovId]);
        windowCount++;
        
        const downWindowId = downWindowResult.rows[0].id;
        
        // Create 3 delivery periods
        for (let day = 1; day <= 3; day++) {
          const deliveryDate = new Date(date);
          deliveryDate.setDate(day);
          
          await pool.query(`
            INSERT INTO public.nged_delivery_periods 
            (window_id, "minRequiredCapacityMw", "startDate", "startTime", "endTime")
            VALUES ($1, $2, $3, $4, $5)
          `, [
            downWindowId,
            0.005,
            deliveryDate.toISOString().split('T')[0],
            '10:00',
            '12:00'
          ]);
          periodCount++;
        }
      }
    }
    
    console.log(`✓ Created ${tovCount} opportunities`);
    console.log(`✓ Created ${windowCount} windows`);
    console.log(`✓ Created ${periodCount} delivery periods`);
    
    // Verify
    console.log('\n🔍 Verifying data...');
    const verify = await pool.query(`
      SELECT 
        tov."cmzCode",
        COUNT(DISTINCT tov.id) as opportunities,
        COUNT(DISTINCT w.id) as windows,
        COUNT(dp.id) as periods
      FROM public.trade_opportunity_versions tov
      LEFT JOIN public.nged_windows w ON w.opportunity_version_id = tov.id
      LEFT JOIN public.nged_delivery_periods dp ON dp.window_id = w.id
      GROUP BY tov."cmzCode"
      ORDER BY tov."cmzCode"
    `);
    
    for (const row of verify.rows) {
      console.log(`  ${row.cmzCode}: ${row.opportunities} opportunities, ${row.windows} windows, ${row.periods} periods`);
    }
    
    console.log('\n✅ Seeding complete!');
    console.log('\n💡 Test with: CMZ_T10A_EM_0097 or CMZ_T10A_EM_0111_G');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

seed();

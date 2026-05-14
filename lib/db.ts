import { Pool } from 'pg';

// Singleton pool — reused across requests in the same process
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    // Prefer DATABASE_URL if set (Neon, Vercel, etc.)
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
          require: true,
        },
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      });
    } else {
      // Fallback to individual env vars
      pool = new Pool({
        host:     process.env.DB_HOST     || 'ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech',
        port:     parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME     || 'neondb',
        user:     process.env.DB_USER     || 'neondb_owner',
        password: process.env.DB_PASSWORD || 'npg_4xuzRdIin6Vc',
        ssl:      { rejectUnauthorized: false, require: true },
        max:      5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      });
    }
  }
  return pool;
}
// postgresql://neondb_owner:npg_4xuzRdIin6Vc@ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
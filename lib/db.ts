import { Pool } from 'pg';

// Singleton pool — reused across requests in the same process
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host:     process.env.DB_HOST     || '10.2.0.13',
      port:     parseInt(process.env.DB_PORT || '15432'),
      database: process.env.DB_NAME     || 'flexer',
      user:     process.env.DB_USER     || 'flexer_migrator',
      password: process.env.DB_PASSWORD || '36V5lz5hZHQxoKi',
      ssl:      false,
      max:      5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return pool;
}

import { Pool } from 'pg';

// Singleton pool — reused across requests in the same process
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    // Prefer DATABASE_URL if set (Neon, Vercel, etc.)
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        // Allow pool to recover from connection errors
        allowExitOnIdle: false,
      });
    } else {
      // Fallback to individual env vars
      pool = new Pool({
        host:     process.env.DB_HOST     || 'ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech',
        port:     parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME     || 'neondb',
        user:     process.env.DB_USER     || 'neondb_owner',
        password: process.env.DB_PASSWORD || 'npg_4xuzRdIin6Vc',
        ssl:      { rejectUnauthorized: false },
        max:      10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        allowExitOnIdle: false,
      });
    }
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
      // Don't exit the process, let the pool recover
    });
  }
  return pool;
}

// Helper function to execute queries with retry logic
export async function queryWithRetry<T = any>(
  queryText: string,
  params?: any[],
  maxRetries = 2
): Promise<{ rows: T[] }> {
  const pool = getPool();
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(queryText, params);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`Query attempt ${attempt + 1} failed:`, error.message);
      
      // If it's a connection error and we have retries left, wait and retry
      if (attempt < maxRetries && (
        error.message?.includes('timeout') ||
        error.message?.includes('terminated') ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT'
      )) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's not a retryable error or we're out of retries, throw
      throw error;
    }
  }
  
  throw lastError || new Error('Query failed after retries');
}
// postgresql://neondb_owner:npg_4xuzRdIin6Vc@ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
// lib/db.js
import { Pool } from 'pg';

let pool = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL || null;

  // Delay throwing until first use. If connectionString is missing,
  // we'll throw when query() is called, not at import time.
  if (!connectionString) return null;

  pool = new Pool({
    connectionString,
    ssl: {
      // for many hosted Postgres setups on Vercel/Heroku, this is necessary
      rejectUnauthorized: false
    }
  });

  return pool;
}

export async function query(text, params) {
  const p = getPool();
  if (!p) {
    throw new Error('DATABASE_URL not set in environment. Set it in .env.local for development or in Vercel env vars for production.');
  }

  const client = await p.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

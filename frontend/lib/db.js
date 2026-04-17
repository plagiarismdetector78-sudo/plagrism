// lib/db.js
import { Pool } from 'pg';

let pool = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL || null;

  // Delay throwing until first use. If connectionString is missing,
  // we'll throw when query() is called, not at import time.
  if (!connectionString) return null;

  try {
    pool = new Pool({
      connectionString,
      ssl: {
        // for many hosted Postgres setups on Vercel/Heroku, this is necessary
        rejectUnauthorized: false
      }
    });
  } catch (e) {
    // Provide a clearer error when the connection string is malformed.
    throw new Error(
      'Invalid DATABASE_URL. It must be a valid Postgres URL like: postgresql://user:password@host:5432/dbname?schema=public'
    );
  }

  return pool;
}

export async function query(text, params) {
  const p = getPool();
  if (!p) {
    throw new Error('DATABASE_URL not set in environment. Set it in .env.local for development or in Vercel env vars for production.');
  }

  let client;
  try {
    client = await p.connect();
  } catch (e) {
    // pg internally parses the connection string; invalid formats can crash with
    // messages like "Cannot read properties of undefined (reading 'searchParams')".
    if (e?.message?.includes('searchParams') || e?.message?.includes('Invalid URL')) {
      throw new Error(
        'Invalid DATABASE_URL. It must be a valid Postgres URL like: postgresql://user:password@host:5432/dbname?schema=public'
      );
    }
    throw e;
  }

  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

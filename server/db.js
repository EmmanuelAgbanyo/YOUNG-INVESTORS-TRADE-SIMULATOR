import pg from 'pg';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

// Connection pool for Neon serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon-specific optimizations
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  max: 20, // Adjust based on your serverless tier
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection & Auto-Migrate
const initDB = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✓ Connected to Neon database at', res.rows[0].now);
    
    // Auto-create missing tables for login persistency
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        theme VARCHAR(20) DEFAULT 'dark',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      );

      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
        cash NUMERIC(15, 2) DEFAULT 100000.00,
        unsettled_cash JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Database schema verified automatically');

  } catch (err) {
    console.error('Database connection or migration failed:', err);
  }
};

initDB();

export default pool;

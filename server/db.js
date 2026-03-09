import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('✓ Connected to Neon database');
  }
});

export default pool;

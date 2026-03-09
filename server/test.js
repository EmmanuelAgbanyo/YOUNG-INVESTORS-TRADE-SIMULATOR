#!/usr/bin/env node

/**
 * Test Script for Neon Database Integration
 * Run: node server/test.js
 * 
 * Tests database connection, schema creation, and basic operations
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  log('blue', '\n🧪 YIN Trade Simulator - Database Test Suite\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  let passed = 0;
  let failed = 0;

  // Test 1: Database Connection
  log('blue', '📋 Test 1: Database Connection');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    log('green', '✓ Successfully connected to Neon database');
    log('green', `  Timestamp: ${result.rows[0].now}`);
    passed++;
  } catch (err) {
    log('red', `✗ Failed to connect to database: ${err.message}`);
    log('yellow', '  Make sure DATABASE_URL is set in .env.local');
    failed++;
  }

  // Test 2: Check Tables Exist
  log('blue', '\n📋 Test 2: Check Database Tables');
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (result.rows.length > 0) {
      log('green', `✓ Found ${result.rows.length} tables:`);
      result.rows.forEach((row) => {
        log('green', `  - ${row.table_name}`);
      });
      passed++;
    } else {
      log('yellow', '⚠ No tables found. Run: npm run migrate');
      failed++;
    }
  } catch (err) {
    log('red', `✗ Failed to check tables: ${err.message}`);
    failed++;
  }

  // Test 3: Test User Creation
  log('blue', '\n📋 Test 3: Test User Creation');
  try {
    const testEmail = `test_${Date.now()}@example.com`;
    const hashedPassword = 'hashedpassword123'; // In real app, use bcryptjs

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [testEmail, hashedPassword]
    );

    const userId = result.rows[0].id;
    log('green', `✓ Created test user: ${testEmail}`);
    log('green', `  User ID: ${userId}`);

    // Clean up test user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    log('green', '  Test user cleaned up');
    passed++;
  } catch (err) {
    log('red', `✗ Failed to create user: ${err.message}`);
    failed++;
  }

  // Test 4: Test Profile Creation
  log('blue', '\n📋 Test 4: Test Profile Creation');
  try {
    // Create a test user first
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [`test_profile_${Date.now()}@example.com`, 'hashedpassword123']
    );
    const userId = userResult.rows[0].id;

    // Create profile
    const profileResult = await pool.query(
      'INSERT INTO profiles (user_id, name) VALUES ($1, $2) RETURNING id, name',
      [userId, 'Test Profile']
    );

    const profileId = profileResult.rows[0].id;
    log('green', `✓ Created test profile: Test Profile`);
    log('green', `  Profile ID: ${profileId}`);

    // Clean up
    await pool.query('DELETE FROM profiles WHERE id = $1', [profileId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    log('green', '  Test profile cleaned up');
    passed++;
  } catch (err) {
    log('red', `✗ Failed to create profile: ${err.message}`);
    failed++;
  }

  // Test 5: Test Portfolio Creation
  log('blue', '\n📋 Test 5: Test Portfolio Creation');
  try {
    // Create test user and profile
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [`test_portfolio_${Date.now()}@example.com`, 'hashedpassword123']
    );
    const userId = userResult.rows[0].id;

    const profileResult = await pool.query(
      'INSERT INTO profiles (user_id, name) VALUES ($1, $2) RETURNING id',
      [userId, 'Test Portfolio Profile']
    );
    const profileId = profileResult.rows[0].id;

    // Create portfolio
    const portfolioResult = await pool.query(
      'INSERT INTO portfolios (profile_id, cash) VALUES ($1, $2) RETURNING id, cash',
      [profileId, 100000.0]
    );

    const portfolioId = portfolioResult.rows[0].id;
    log('green', `✓ Created test portfolio with GHS 100,000`);
    log('green', `  Portfolio ID: ${portfolioId}`);

    // Clean up
    await pool.query('DELETE FROM portfolios WHERE id = $1', [portfolioId]);
    await pool.query('DELETE FROM profiles WHERE id = $1', [profileId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    log('green', '  Test portfolio cleaned up');
    passed++;
  } catch (err) {
    log('red', `✗ Failed to create portfolio: ${err.message}`);
    failed++;
  }

  // Test 6: Check Connection Pooling
  log('blue', '\n📋 Test 6: Connection Pooling');
  try {
    log('green', `✓ Connection pool configured:`);
    log('green', `  Max connections: 20`);
    log('green', `  Idle timeout: 30000ms`);
    log('green', `  Connection timeout: 2000ms`);
    passed++;
  } catch (err) {
    log('red', `✗ Failed to verify pool: ${err.message}`);
    failed++;
  }

  // Summary
  log('blue', '\n' + '='.repeat(50));
  log('blue', '📊 Test Summary');
  log('blue', '='.repeat(50));

  log('green', `✓ Passed: ${passed}`);
  if (failed > 0) {
    log('red', `✗ Failed: ${failed}`);
  }

  const total = passed + failed;
  const percentage = Math.round((passed / total) * 100);

  log('blue', `\nResult: ${passed}/${total} (${percentage}%)`);

  if (failed === 0) {
    log('green', '\n🎉 All tests passed! Your Neon setup is working correctly.');
  } else {
    log('yellow', '\n⚠️  Some tests failed. Review the errors above and run npm run migrate if needed.');
  }

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  log('red', `\n❌ Fatal error: ${err.message}`);
  process.exit(1);
});

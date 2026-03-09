import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ===== AUTH ROUTES =====

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );
    const userId = result.rows[0].id;

    // Create default profile
    const profileResult = await pool.query(
      'INSERT INTO profiles (user_id, name) VALUES ($1, $2) RETURNING id',
      [userId, name]
    );
    const profileId = profileResult.rows[0].id;

    // Create default portfolio
    await pool.query(
      'INSERT INTO portfolios (profile_id) VALUES ($1)',
      [profileId]
    );

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, userId, message: 'User created successfully' });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    const result = await pool.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== PROFILE ROUTES =====

app.get('/api/profiles/:userId', verifyToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, user_id, name, bio, avatar_url, theme FROM profiles WHERE user_id = $1',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/profiles', verifyToken, async (req, res) => {
  const { userId } = req.user;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const result = await pool.query(
      'INSERT INTO profiles (user_id, name) VALUES ($1, $2) RETURNING id, name, theme',
      [userId, name]
    );
    const profileId = result.rows[0].id;

    // Create portfolio for new profile
    await pool.query(
      'INSERT INTO portfolios (profile_id) VALUES ($1)',
      [profileId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Profile name already exists for this user' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// ===== PORTFOLIO ROUTES =====

app.get('/api/portfolios/:profileId', verifyToken, async (req, res) => {
  const { profileId } = req.params;
  try {
    const portfolio = await pool.query(
      'SELECT id, profile_id, cash FROM portfolios WHERE profile_id = $1',
      [profileId]
    );
    if (portfolio.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const holdings = await pool.query(
      'SELECT symbol, quantity, avg_cost FROM holdings WHERE portfolio_id = $1',
      [portfolio.rows[0].id]
    );

    res.json({
      ...portfolio.rows[0],
      holdings: holdings.rows.reduce((acc, h) => {
        acc[h.symbol] = { symbol: h.symbol, quantity: h.quantity, avgCost: parseFloat(h.avg_cost) };
        return acc;
      }, {})
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== ORDERS ROUTES =====

app.post('/api/orders', verifyToken, async (req, res) => {
  const { portfolioId, symbol, tradeType, orderType, quantity, limitPrice } = req.body;
  if (!portfolioId || !symbol || !tradeType || !orderType || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO orders (portfolio_id, symbol, trade_type, order_type, quantity, limit_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING id, symbol, trade_type, order_type, quantity, status, created_at`,
      [portfolioId, symbol, tradeType, orderType, quantity, limitPrice || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/orders/:portfolioId', verifyToken, async (req, res) => {
  const { portfolioId } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, symbol, trade_type, order_type, quantity, price, limit_price, status, created_at, executed_at
       FROM orders WHERE portfolio_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [portfolioId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== TEAMS ROUTES =====

app.post('/api/teams', verifyToken, async (req, res) => {
  const { profileId, teamName } = req.body;
  if (!profileId || !teamName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const teamResult = await pool.query(
      'INSERT INTO teams (name, leader_id) VALUES ($1, $2) RETURNING id, name',
      [teamName, profileId]
    );
    const teamId = teamResult.rows[0].id;

    // Add leader as team member
    await pool.query(
      'INSERT INTO team_members (team_id, profile_id) VALUES ($1, $2)',
      [teamId, profileId]
    );

    // Create invite code
    const code = `${teamName.substring(0, 4).toUpperCase()}${Math.random().toString(36).substring(2, 6)}`;
    await pool.query(
      'INSERT INTO team_invites (team_id, code) VALUES ($1, $2)',
      [teamId, code]
    );

    res.status(201).json({ ...teamResult.rows[0], inviteCode: code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/teams/join', verifyToken, async (req, res) => {
  const { profileId, inviteCode } = req.body;
  if (!profileId || !inviteCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const inviteResult = await pool.query(
      'SELECT team_id FROM team_invites WHERE code = $1 AND expires_at > NOW()',
      [inviteCode]
    );
    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invite code' });
    }

    const teamId = inviteResult.rows[0].team_id;
    await pool.query(
      'INSERT INTO team_members (team_id, profile_id) VALUES ($1, $2)',
      [teamId, profileId]
    );

    res.json({ message: 'Joined team successfully', teamId });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Already a member of this team' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// ===== GSE MARKET SCRAPER =====
import axios from 'axios';
import * as cheerio from 'cheerio';

app.get('/api/market/gse', async (req, res) => {
  try {
    let stocks = [];

    // Primary Source: Official Kwayisi GSE REST API (Fast, Reliable, JSON)
    try {
      const { data } = await axios.get('https://dev.kwayisi.org/apis/gse/live', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 8000
      });

      console.log('[GSE API] Raw data:', data);
      if (Array.isArray(data)) {
        stocks = data.map(item => ({
          symbol: item.name, // The API uses 'name' for the ticker symbol (e.g., 'MTNGH')
          price: parseFloat(item.price) || 0,
          change: parseFloat(item.change) || 0,
          volume: parseInt(item.volume) || 0
        })).filter(s => s.symbol && s.price > 0);
      }
    } catch (apiError) {
      console.error('Kwayisi REST API Fetch Error:', apiError.message);
    }

    if (stocks.length > 0) {
      // Return 200 OK with the freshly fetched real-time market array
      res.json(stocks);
    } else {
      // Return hardcoded mock data as an absolute last resort if the network fails entirely, ensuring UI never breaks
      const MOCK_FALLBACK = [
        { symbol: "MTNGH", price: 1.60 }, { symbol: "SCB", price: 18.23 }, { symbol: "GCB", price: 3.40 },
        { symbol: "EGL", price: 2.39 }, { symbol: "GOIL", price: 1.50 }, { symbol: "TOTAL", price: 9.00 }
      ];
      console.warn("Returning MOCK fallback data due to Kwayisi API failure.");
      res.json(MOCK_FALLBACK);
    }

  } catch (error) {
    console.error('Master Scraping API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch GSE live data.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ API server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

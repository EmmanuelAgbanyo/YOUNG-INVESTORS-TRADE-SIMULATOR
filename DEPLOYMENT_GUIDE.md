# 🚀 Complete Deployment Guide - YIN Trade Simulator

## Overview

This guide walks you through deploying your full-stack YIN Trade Simulator application to production using:
- **Frontend**: Netlify or Vercel
- **Backend**: Vercel Functions or Render
- **Database**: Neon PostgreSQL (serverless)

---

## Prerequisites

- Node.js 18+ installed locally
- GitHub account (for CI/CD)
- Neon account (https://console.neon.tech)
- Netlify account (https://netlify.com) OR Vercel account (https://vercel.com)
- Git initialized in your project

---

## Phase 1: Local Development Setup ✅

### 1.1 Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 1.2 Create `.env.local` File

Copy `.env.example` and fill in your values:

```bash
# Root directory
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Database Connection (get from Neon)
DATABASE_URL=postgresql://user:password@host/database

# JWT Secret (generate: openssl rand -base64 32)
JWT_SECRET=your_secret_key_here_at_least_32_chars

# Gemini API Key (from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# Node Environment
NODE_ENV=development

# API URL for frontend (localhost during dev)
VITE_API_URL=http://localhost:3001
```

### 1.3 Set Up Neon Database

1. Go to https://console.neon.tech and sign up
2. Create a new project (e.g., "yin-trade-simulator")
3. Copy the **Connection String** (looks like: `postgresql://user:password@host/database`)
4. Add it to `.env.local` as `DATABASE_URL`

### 1.4 Run Database Migrations

```bash
cd server
npm run migrate
```

Expected output:
```
✓ Creating users table
✓ Creating profiles table
✓ Creating portfolios table
✓ Creating holdings table
✓ Creating orders table
✓ Creating teams table
✓ Creating team_invites table
✓ Creating performance_history table
✓ Creating indexes
✓ Schema initialized successfully
```

### 1.5 Test Backend Locally

```bash
cd server
npm run dev
```

You should see:
```
🚀 YIN Trade Simulator API running on http://localhost:3001
📊 Database connection initialized
```

In another terminal, test the API:

```bash
curl http://localhost:3001/api/market
# Expected: {"status": "Market initialized"}

curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 1.6 Test Database Operations

```bash
cd server
npm test
```

This runs 6 comprehensive tests:
- ✓ Database connection
- ✓ Table existence
- ✓ User creation
- ✓ Profile creation
- ✓ Portfolio creation
- ✓ Connection pooling

### 1.7 Run Frontend Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

The app should now connect to your local backend at `http://localhost:3001`

---

## Phase 2: Deploy Backend 🎯

### Option A: Vercel Functions (Recommended)

**Advantages:**
- Same platform as frontend option
- Zero-config deployment
- Automatic scaling
- Free tier available

**Steps:**

1. **Restructure Backend for Vercel**

```bash
# Create api folder (Vercel convention)
mkdir -p api
mv server/server.js api/index.js
```

2. **Update imports in api/index.js**

Change:
```javascript
import { pool, initializeSchema } from './db.js'
import { createSchema } from './migrations.js'
```

To:
```javascript
import { pool, initializeSchema } from '../server/db.js'
import { createSchema } from '../server/migrations.js'
```

3. **Configure Vercel**

Update `vercel.json`:

```json
{
  "framework": "node",
  "buildCommand": "npm install -g node-gyp && npm install",
  "outputDirectory": "api",
  "regions": ["sfo1", "iad1"],
  "env": [
    {
      "key": "DATABASE_URL",
      "description": "Neon PostgreSQL connection string"
    },
    {
      "key": "JWT_SECRET",
      "description": "Secret key for JWT signing"
    },
    {
      "key": "NODE_ENV",
      "value": "production"
    }
  ],
  "functions": {
    "api/index.js": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

4. **Deploy to Vercel**

```bash
npm install -g vercel
vercel --prod
```

When prompted, add environment variables (from `.env.local`):
- `DATABASE_URL` → Your Neon connection string
- `JWT_SECRET` → Your secret key
- `NODE_ENV` → `production`

5. **Get Your API URL**

After deployment, you'll get:
```
✓ Production: https://your-app.vercel.app
```

Your backend API is now at: `https://your-app.vercel.app/api`

---

### Option B: Render.com (Alternative)

**Advantages:**
- Simple deployment
- Free tier with limitations
- Great for learning

**Steps:**

1. Push your code to GitHub

```bash
git add .
git commit -m "Add backend API"
git push origin main
```

2. Go to https://render.com and sign up

3. Click "New" → "Web Service"

4. Connect your GitHub repository

5. Configure:
   - **Name**: `yin-trade-api`
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `node server.js`
   - **Region**: Choose closest to your users

6. Add Environment Variables:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = your secret
   - `NODE_ENV` = `production`

7. Click "Create Web Service"

Your backend will be at: `https://yin-trade-api.onrender.com`

---

## Phase 3: Deploy Frontend 🎨

### Option A: Netlify Deployment

**Advantages:**
- Excellent for React/Vite apps
- Built-in redirects for SPAs
- Free SSL/TLS
- Intuitive UI

**Steps:**

1. **Build locally to test**

```bash
npm run build
```

Should create `dist/` folder with your optimized app.

2. **Push to GitHub**

```bash
git add .
git commit -m "Add Neon database integration"
git push origin main
```

3. **Connect to Netlify**

- Go to https://netlify.com
- Click "New site from Git"
- Choose GitHub, select your repository
- Configure:
  - **Build command**: `npm run build`
  - **Publish directory**: `dist`
  - **Functions directory**: Leave empty

4. **Add Environment Variables**

In Netlify dashboard → Site settings → Build & deploy → Environment:

```
VITE_API_URL=https://your-backend-url.vercel.app
```

If using Vercel for backend: `https://your-app.vercel.app`
If using Render for backend: `https://yin-trade-api.onrender.com`

5. **Configure API Redirects**

Your `netlify.toml` already has:

```toml
[[redirects]]
from = "/api/*"
to = "/.netlify/functions/api/:splat"
status = 200

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

This ensures all API calls go to your backend and SPA routing works.

6. **Deploy**

```bash
netlify deploy --prod
```

Your frontend will be at: `https://your-site.netlify.app`

---

### Option B: Vercel Frontend Deployment

**If using Vercel for both frontend and backend:**

1. **Configuration already done in vercel.json**

2. **Deploy**

```bash
vercel --prod
```

3. **Add Environment Variables**

In Vercel dashboard → Project Settings → Environment Variables:

```
VITE_API_URL=https://your-app.vercel.app/api
```

---

## Phase 4: Database Production Configuration 🗄️

### Optimize Neon for Production

1. **Set Compute Size** (Neon Console)

For a small app with <1000 users:
- Compute: `0.25 CU` (smallest, ~$10/month)
- Storage: `10GB` (included free tier)

For a medium app with 1000-10000 users:
- Compute: `1 CU` (~$50/month)
- Storage: `100GB`

2. **Enable Automatic Backups**

In Neon Console → Backups:
- Retention: 7 days
- Frequency: Daily
- Point-in-time recovery: Enabled

3. **Monitor Connection Limits**

Your backend pool is configured for:
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

Monitor in Neon Console → Monitoring tab.

4. **Scale Database Down During Off-Hours**

In Neon Console → Compute:
- Enable "Autosuspend" after 5 minutes of inactivity
- This saves money when app isn't being used

---

## Phase 5: Security Hardening 🔒

### Before Going to Production

1. **Remove Hardcoded API Keys**

✓ DONE - Gemini API key now in `.env.local`

2. **Rotate JWT Secret**

Generate a new secret:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32))
```

Update in your backend environment.

3. **Set Secure Headers**

Your backend already includes CORS, but add more in `server/server.js`:

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

4. **Enable HTTPS Everywhere**

- Netlify: ✓ Automatic SSL/TLS
- Vercel: ✓ Automatic SSL/TLS
- Render: ✓ Automatic SSL/TLS
- Neon: ✓ SSL only

5. **Rate Limiting**

Add to `server/server.js`:

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
  // ... existing code
});
```

---

## Phase 6: Testing in Production ✅

### Run Integration Tests

```bash
# Test database connectivity
curl https://your-api.vercel.app/api/market

# Test user registration
curl -X POST https://your-api.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"prod@example.com","password":"Test123!"}'

# Test login
curl -X POST https://your-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prod@example.com","password":"Test123!"}'
```

### Performance Testing

Use LoadImpact or k6:

```bash
npm install -g k6

# Create load-test.js
export default function() {
  http.get('https://your-frontend.netlify.app');
  http.get('https://your-api.vercel.app/api/market');
}

# Run test
k6 run load-test.js
```

### Monitor Errors

1. **Frontend**: Netlify Analytics & Logs
2. **Backend**: Vercel Function Logs
3. **Database**: Neon Monitoring tab

---

## Phase 7: CI/CD Setup 🔄

### GitHub Actions for Automatic Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Backend to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          
      - name: Deploy Frontend to Netlify
        run: netlify deploy --prod
        env:
          NETLIFY_TOKEN: ${{ secrets.NETLIFY_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Add Secrets to GitHub

1. Go to GitHub repo → Settings → Secrets
2. Add:
   - `VERCEL_TOKEN` (from Vercel dashboard)
   - `NETLIFY_TOKEN` (from Netlify dashboard)
   - `NETLIFY_SITE_ID` (from Netlify)

Now every push to `main` automatically deploys! 🎉

---

## Phase 8: Monitoring & Maintenance 📊

### Set Up Alerts

**Neon Database:**
- CPU usage > 80%
- Connections > 15 (of 20)
- Query time > 1 second

**Backend (Vercel):**
- Function errors > 1%
- Response time > 1 second
- Memory usage > 80%

**Frontend (Netlify):**
- Build failures
- Deployment errors
- Client-side errors (via Sentry if added)

### Regular Maintenance

**Weekly:**
- [ ] Check error logs
- [ ] Monitor database size
- [ ] Review performance metrics

**Monthly:**
- [ ] Update dependencies: `npm outdated`
- [ ] Review security advisories: `npm audit`
- [ ] Optimize database indexes (if needed)

**Quarterly:**
- [ ] Full backup verification
- [ ] Load testing
- [ ] Security penetration test

---

## Troubleshooting 🔧

### "Cannot POST /api/auth/login"

**Cause**: Backend not deployed or API URL misconfigured
**Fix**: 
- Check `VITE_API_URL` environment variable
- Verify backend is running: `curl https://your-api.vercel.app/api/market`

### "Connection Pool Limit Exceeded"

**Cause**: Too many database connections
**Fix**:
- Reduce pool size in `server/db.js` to `max: 10`
- Enable autosuspend in Neon console
- Check for connection leaks (ensure `.release()` is called)

### "JWT Token Expired"

**Cause**: Token expiration handled correctly, but frontend not refreshing
**Fix**: 
- Implement token refresh endpoint in backend
- Update `useAPI.ts` to refresh automatically
- See DATABASE_SETUP.md for token refresh pattern

### "CORS Error when accessing API"

**Cause**: Frontend domain not whitelisted
**Fix**: Update in `server/server.js`:

```javascript
const corsOptions = {
  origin: [
    'https://your-frontend.netlify.app',
    'http://localhost:5173'
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

### "Blank Screen in Production"

**Cause**: API URL pointing to wrong backend
**Fix**:
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Ensure backend is deployed and accessible

---

## Quick Reference URLs

After deployment, bookmark these:

```
Frontend:        https://your-site.netlify.app
API Backend:     https://your-api.vercel.app/api
Database Admin:  https://console.neon.tech
Netlify Logs:    https://app.netlify.com/sites/your-site/deploys
Vercel Logs:     https://vercel.com/your-org/your-project/deployments
```

---

## Success Checklist ✅

Before declaring victory:

- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can login with registered credentials
- [ ] Portfolio loads with initial balance
- [ ] Can place a trade
- [ ] Trade appears in order history
- [ ] Portfolio balance updates after trade
- [ ] Can create a team and invite members
- [ ] Market events generate correctly
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] Database backups enabled
- [ ] Error monitoring configured
- [ ] Performance metrics acceptable
- [ ] SSL/TLS working on all domains

---

## Support & Resources

- **Neon Docs**: https://neon.tech/docs
- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Express.js**: https://expressjs.com
- **PostgreSQL**: https://www.postgresql.org/docs
- **React**: https://react.dev

---

**Deployment Complete! 🎉**

Your YIN Trade Simulator is now live and ready for users.

Good luck! 📈

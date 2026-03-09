# YIN Trade Simulator - Neon Database Integration

This guide covers setting up and deploying the YIN Trade Simulator with Neon PostgreSQL for persistent data storage.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   React Frontend (Vite)                     │
│              (Runs on Vercel, Netlify, or local)           │
└────────────────────┬────────────────────────────────────────┘
                     │ API Calls (REST)
                     │
┌────────────────────▼────────────────────────────────────────┐
│            Express.js API Server (Node.js)                  │
│         (Vercel Functions, Netlify Functions, or Railway)  │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL Queries
                     │
┌────────────────────▼────────────────────────────────────────┐
│         Neon PostgreSQL (Managed Database)                  │
│         (Persists users, portfolios, orders, teams)        │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Local Development

#### 1. Clone & Setup

```bash
git clone <repo-url>
cd young-investors-trade-simulator
npm install
```

#### 2. Create Neon Database

1. Go to https://console.neon.tech
2. Create a new project
3. Copy your connection string

#### 3. Configure Environment

Create `.env.local` in the root:

```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
JWT_SECRET=dev-secret-key-change-in-prod
VITE_API_URL=http://localhost:3001
```

#### 4. Initialize Database

```bash
cd server
npm install
npm run migrate
```

#### 5. Run Development Servers

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

Visit http://localhost:5173

## Deployment

### Option 1: Vercel (Recommended)

**Best for**: Full-stack React + Node.js apps, automatic deployments

#### Steps:

1. **Push to GitHub** (if not already)
```bash
git add .
git commit -m "Add Neon database integration"
git push
```

2. **Connect to Vercel**
   - Go to https://vercel.com/import
   - Select your GitHub repo
   - Click Import

3. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
     - `DATABASE_URL` - Your Neon connection string
     - `JWT_SECRET` - Generate: `openssl rand -base64 32`
     - `NODE_ENV` - Set to `production`
     - `VITE_API_URL` - Set to your Vercel domain (e.g., `https://your-app.vercel.app`)

4. **Deploy**
   - Vercel automatically detects Next.js/Vite
   - Creates serverless functions for `/api/*` routes
   - Runs `npm run build` for frontend

#### Custom Configuration:

Create `vercel.json` (already provided):
```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "env": {
    "DATABASE_URL": { "required": true },
    "JWT_SECRET": { "required": true }
  }
}
```

### Option 2: Netlify

**Best for**: Frontend-first deployments with Functions

#### Steps:

1. **Connect to Netlify**
   - Go to https://app.netlify.com/start
   - Select GitHub repo
   - Click Deploy Site

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `server`

3. **Add Environment Variables**
   - Site Settings → Environment → Environment Variables
   - Add same variables as Vercel

4. **Deploy Functions**
   - Move `server/server.js` to `netlify/functions/api.js`
   - Or configure with netlify.toml (already provided)

### Option 3: Railway (Full Backend)

**Best for**: Dedicated backend server + PostgreSQL

#### Steps:

1. **Create Railway Account** - https://railway.app

2. **Connect GitHub** - Deploy your repo

3. **Add PostgreSQL** - Railway → Add Service → PostgreSQL

4. **Set Environment Variables**

5. **Deploy** - Railway automatically builds and deploys

## Database Schema

### Tables

#### users
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique email
- `password_hash` (VARCHAR) - Hashed password
- `created_at`, `updated_at` - Timestamps

#### profiles
- `id` (UUID) - Primary key
- `user_id` (UUID FK) - References users
- `name` (VARCHAR) - Profile name
- `theme` (VARCHAR) - Dark/Light
- `created_at`, `updated_at`

#### portfolios
- `id` (UUID) - Primary key
- `profile_id` (UUID FK) - References profiles
- `cash` (DECIMAL) - Available cash
- `created_at`, `updated_at`

#### holdings
- `id` (UUID) - Primary key
- `portfolio_id` (UUID FK) - References portfolios
- `symbol` (VARCHAR) - Stock symbol
- `quantity` (INTEGER) - Shares owned
- `avg_cost` (DECIMAL) - Average purchase price

#### orders
- `id` (UUID) - Primary key
- `portfolio_id` (UUID FK) - References portfolios
- `symbol` (VARCHAR) - Stock symbol
- `trade_type` (VARCHAR) - BUY or SELL
- `order_type` (VARCHAR) - MARKET, LIMIT, TRAILING_STOP
- `quantity` (INTEGER) - Number of shares
- `status` (VARCHAR) - PENDING, WORKING, EXECUTED, etc.
- `created_at`, `executed_at`, `updated_at`

#### teams
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Team name
- `leader_id` (UUID FK) - Team leader (references profiles)
- `created_at`, `updated_at`

#### team_members
- `id` (UUID) - Primary key
- `team_id` (UUID FK) - References teams
- `profile_id` (UUID FK) - References profiles

#### team_invites
- `id` (UUID) - Primary key
- `team_id` (UUID FK) - References teams
- `code` (VARCHAR) - Unique invite code
- `created_at`, `expires_at` - Timestamps

## API Endpoints

### Authentication

#### Sign Up
```
POST /api/auth/signup
Body: { email, password, name }
Response: { token, userId }
```

#### Login
```
POST /api/auth/login
Body: { email, password }
Response: { token, userId }
```

### Profiles

#### Get User Profiles
```
GET /api/profiles/:userId
Headers: { Authorization: Bearer <token> }
Response: [{ id, name, theme, ... }]
```

#### Create Profile
```
POST /api/profiles
Headers: { Authorization: Bearer <token> }
Body: { name }
Response: { id, name, theme }
```

### Portfolio

#### Get Portfolio
```
GET /api/portfolios/:profileId
Headers: { Authorization: Bearer <token> }
Response: { id, cash, holdings: { symbol: { quantity, avgCost } } }
```

### Orders

#### Place Order
```
POST /api/orders
Headers: { Authorization: Bearer <token> }
Body: { portfolioId, symbol, tradeType, orderType, quantity, limitPrice? }
Response: { id, symbol, status, createdAt }
```

#### Get Orders
```
GET /api/orders/:portfolioId
Headers: { Authorization: Bearer <token> }
Response: [{ id, symbol, tradeType, status, createdAt, ... }]
```

### Teams

#### Create Team
```
POST /api/teams
Headers: { Authorization: Bearer <token> }
Body: { profileId, teamName }
Response: { id, name, inviteCode }
```

#### Join Team
```
POST /api/teams/join
Headers: { Authorization: Bearer <token> }
Body: { profileId, inviteCode }
Response: { teamId, message }
```

## Troubleshooting

### Connection Issues

**Problem**: Database connection timeout
**Solution**:
- Check `?sslmode=require` in connection string
- Verify Neon project is active
- Test with: `psql $DATABASE_URL -c "SELECT NOW();"`

### Migration Fails

**Problem**: "relation already exists"
**Solution**:
- Drop existing tables: `npm run migrate` (drops and recreates)
- Or connect to Neon and drop manually:
  ```sql
  DROP TABLE IF EXISTS table_name CASCADE;
  ```

### API Won't Connect

**Problem**: 401 Unauthorized errors
**Solution**:
- Ensure `JWT_SECRET` matches between dev and prod
- Verify token is being sent: `Authorization: Bearer <token>`
- Check token hasn't expired

### Frontend Can't Reach API

**Problem**: CORS errors or network failures
**Solution**:
- Verify `VITE_API_URL` is correct in frontend `.env`
- Check CORS is enabled in server (Express has `cors()` middleware)
- Test API directly: `curl https://your-api.vercel.app/api/health`

## Performance Optimization

### Connection Pooling

Already configured in `server/db.js`:
```javascript
max: 20, // Max connections
idleTimeoutMillis: 30000 // Timeout inactive connections
```

### Database Indexes

Indexes created on:
- Foreign keys (automatic)
- Frequently queried columns (user_id, profile_id, etc.)
- Order timestamp for sorting

### Query Optimization

- Fetch only needed columns
- Limit results (e.g., last 100 orders)
- Use pagination for large datasets
- Add caching layer (Redis) if needed

## Security Best Practices

1. **Never Commit Secrets**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Strong JWT Secret**
   ```bash
   openssl rand -base64 32
   ```

3. **Password Hashing**
   - Uses bcryptjs (10 salt rounds)
   - Always hash before storing

4. **HTTPS Only**
   - All deployment platforms use HTTPS by default
   - Connection string requires `sslmode=require`

5. **Environment Isolation**
   - Separate `DATABASE_URL` for dev/prod
   - Never use production DB for testing

6. **Regular Backups**
   - Neon auto-backups (check dashboard)
   - Export data periodically for safety

## Monitoring & Debugging

### Check API Health
```bash
curl https://your-app.vercel.app/api/health
```

### View Database in Neon Console
- Go to https://console.neon.tech
- Click on your project
- Use Data Browser to view tables

### Enable Debug Logging

In `server/server.js`, add:
```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
```

### Monitor Vercel Logs
- Vercel Dashboard → Project → Functions
- View real-time logs and errors

## Next Steps

1. ✅ Setup Neon database
2. ✅ Deploy backend API
3. ✅ Deploy frontend
4. ⬜ Add more features:
   - Real stock market data API integration
   - WebSocket for real-time prices
   - Admin dashboard
   - Email notifications
   - Payment processing

## Support & Resources

- **Neon Docs**: https://neon.tech/docs
- **PostgreSQL**: https://www.postgresql.org/docs
- **Express.js**: https://expressjs.com
- **Vite**: https://vitejs.dev
- **Vercel**: https://vercel.com/docs

## Contributing

Submit issues and PRs to improve the app!

## License

MIT License - See LICENSE file

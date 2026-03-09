# Neon Database Setup Guide

## Prerequisites

1. **Neon Account**: Sign up at https://neon.tech
2. **Node.js**: Version 18+ installed
3. **Git**: For version control

## Step 1: Create Neon Project

1. Go to https://console.neon.tech
2. Click "New Project"
3. Choose a region (e.g., us-east-1)
4. Database name: `yin_simulator` (default is fine)
5. Click "Create project"
6. Copy the connection string from the dashboard

## Step 2: Set Environment Variables

Create `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]?sslmode=require

# API Server
PORT=3001
NODE_ENV=development

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-key-change-this-in-production

# Frontend API URL
VITE_API_URL=http://localhost:3001
```

For Netlify/Vercel, add these environment variables in your deployment platform's settings:
- `DATABASE_URL` - Your Neon connection string
- `JWT_SECRET` - A random secure string (generate with `openssl rand -base64 32`)
- `NODE_ENV` - Set to `production`

## Step 3: Install Dependencies

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies (if not done)
cd ..
npm install
```

## Step 4: Run Migrations

Initialize the database schema:

```bash
cd server
npm run migrate
```

This will create all necessary tables and indexes.

## Step 5: Start Development

### Terminal 1 - Backend API:
```bash
cd server
npm run dev
```

### Terminal 2 - Frontend:
```bash
npm run dev
```

Visit http://localhost:5173

## Step 6: Deploy to Production

### Option A: Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy (runs `npm run build` automatically)

### Option B: Netlify

1. Add `netlify.toml` to root directory
2. Deploy via Netlify CLI or GitHub integration
3. Set environment variables in Netlify dashboard

## Connection String Format

Your Neon connection string looks like:
```
postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
```

- `[user]`: Default is `postgres` or your custom user
- `[password]`: Your database password
- `[host]`: Neon-provided host (e.g., `ep-xxxxx.us-east-1.neon.tech`)
- `[dbname]`: Database name (default: `neondb`)

## Useful Neon Commands

Check connection:
```bash
psql $DATABASE_URL -c "SELECT NOW();"
```

View database in Neon dashboard:
- Tables
- Data browser
- Query editor
- Backups

## Troubleshooting

### Connection Timeout
- Ensure `?sslmode=require` is in connection string
- Check IP whitelist (Neon allows all IPs by default)
- Test connection string in terminal

### Migration Fails
- Ensure database exists
- Check user has CREATE TABLE permissions
- Verify connection string is correct

### API Won't Connect
- Check `DATABASE_URL` is set correctly
- Verify Neon project is active
- Check logs: `npm run dev` will show errors

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.local` for local development
2. **Use strong JWT_SECRET** - Generate with `openssl rand -base64 32`
3. **Rotate credentials regularly** - Especially in production
4. **Use connection pooling** - Already configured in `server/db.js`
5. **Enable backups** - Neon has automatic backups
6. **Monitor queries** - Use Neon dashboard query insights

## Performance Optimization

1. **Connection Pooling**: Already enabled with max 20 connections
2. **Query Caching**: Implement in API handlers as needed
3. **Indexes**: Created on all foreign keys and frequently queried columns
4. **Read Replicas**: Available on Neon paid plans

## API Endpoints Reference

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login (returns JWT token)

### Profiles
- `GET /api/profiles/:userId` - Get all profiles for user
- `POST /api/profiles` - Create new profile

### Portfolio
- `GET /api/portfolios/:profileId` - Get portfolio and holdings

### Orders
- `POST /api/orders` - Place new order
- `GET /api/orders/:portfolioId` - Get order history

### Teams
- `POST /api/teams` - Create team
- `POST /api/teams/join` - Join team with invite code

All endpoints (except auth) require JWT token in header:
```
Authorization: Bearer <token>
```

## Support

- Neon Docs: https://neon.tech/docs
- Community: https://discord.gg/n
- Issues: GitHub Issues

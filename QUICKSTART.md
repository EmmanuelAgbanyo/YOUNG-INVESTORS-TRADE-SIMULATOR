# Quick Start: Neon Database + Vercel Deployment

## In 5 Minutes

### 1. Create Neon Database (1 min)
```bash
# Go to https://console.neon.tech
# Click "Create Project"
# Copy the connection string (looks like: postgresql://user:pass@host/db?sslmode=require)
```

### 2. Configure Local Environment (1 min)
```bash
# Create .env.local in root directory
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://YOUR_CONNECTION_STRING_HERE
JWT_SECRET=dev-secret-key-for-testing
VITE_API_URL=http://localhost:3001
EOF
```

### 3. Initialize Database (1 min)
```bash
cd server
npm install
npm run migrate
cd ..
```

### 4. Run Local Servers (1 min)
```bash
# Terminal 1
npm run dev

# Terminal 2 (new terminal)
cd server && npm run dev
```

Visit http://localhost:5173

### 5. Deploy to Vercel (1 min)
```bash
# Push to GitHub
git add .
git commit -m "Add Neon database integration"
git push

# Then:
# 1. Go to https://vercel.com/import
# 2. Select your GitHub repo
# 3. Add environment variables:
#    - DATABASE_URL = your Neon connection string
#    - JWT_SECRET = generate with: openssl rand -base64 32
#    - NODE_ENV = production
# 4. Click Deploy
```

## That's It! 🎉

Your app is now:
- ✅ Running locally with persistent database
- ✅ Deployed to Vercel with full-stack backend
- ✅ Using Neon PostgreSQL for data storage

## Next: Integrate Frontend with API

Edit `components/ProfileManager.tsx` to use `useAPI.ts` hooks instead of localStorage:

```typescript
import { apiClient } from '../hooks/useAPI';

// Before: localStorage.getItem('yin_trade_profiles')
// After: await apiClient.getProfiles(userId)

// See DATABASE_SETUP.md for full integration examples
```

## Troubleshooting

**Connection failed?**
```bash
# Test Neon connection
psql $DATABASE_URL -c "SELECT NOW();"
```

**API not working?**
```bash
# Check server is running
curl http://localhost:3001/api/health
```

**Build fails on Vercel?**
- Check Node version: `node --version` (need 18+)
- Clear cache: Vercel Dashboard → Settings → Git → Redeploy

## Documentation

- Full setup: [DATABASE_SETUP.md](DATABASE_SETUP.md)
- Neon guide: [NEON_SETUP.md](NEON_SETUP.md)
- API reference: See DATABASE_SETUP.md → API Endpoints

## Support

Issues? Check:
1. [DATABASE_SETUP.md](DATABASE_SETUP.md) → Troubleshooting
2. [NEON_SETUP.md](NEON_SETUP.md) → Troubleshooting
3. Neon docs: https://neon.tech/docs

# YIN Trade Simulator# Yin Trade Simulator



A browser-based stock trading simulator for young investors to learn trading strategies with virtual money. Features real-time stock price simulation, portfolio management, team trading, and an AI-powered trading assistant.[Project Description]



## Features## Getting Started



✨ **Core Trading**### Prerequisites

- Real-time stock price simulation

- Buy/Sell/Market orders with Limit and Trailing Stop orders- Node.js

- Portfolio tracking with holdings and performance metrics

- Order history and execution tracking### Installation and Running



👥 **Team Features**1. **Clone the repository:**

- Create trading teams and invite members   ```bash

- Share portfolios with team members   git clone https://github.com/your-username/your-repository.git

- Collaborative trading and analysis   ```

2. **Navigate to the project directory:**

🤖 **AI Assistant**   ```bash

- Gemini AI-powered market analysis   cd your-repository

- Stock-specific trading recommendations   ```

- Portfolio review and market summaries3. **Install dependencies:**

   ```bash

💰 **Data Persistence**   npm install

- Neon PostgreSQL for permanent data storage   ```

- User authentication with JWT tokens4. **Set up your environment variables:**

- Multi-profile support per user   - Create a `.env.local` file in the root of the project.

   - Add your Gemini API key to the `.env.local` file:

## Quick Start     ```

     GEMINI_API_KEY=your_api_key

### Local Development     ```

5. **Run the development server:**

#### 1. Prerequisites   ```bash

- Node.js 18+   npm run dev

- Neon account (https://neon.tech)   ```

- Git

## Usage

#### 2. Clone & Setup

```bash[Instructions on how to use the application]

git clone https://github.com/EmmanuelAgbanyo/YOUNG-INVESTORS-TRADE-SIMULATOR.git

cd YOUNG-INVESTORS-TRADE-SIMULATOR## Building for Production

npm install

```To create a production build of the application, run the following command:



#### 3. Setup Neon Database```bash

npm run build

Create a free Neon account at https://console.neon.tech and copy your connection string.```



#### 4. Configure EnvironmentThis will create a `dist` directory with the production-ready files. You can preview the production build with:



Create `.env.local`:```bash

```envnpm run preview

DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]?sslmode=require```

JWT_SECRET=your-secret-key-change-this
VITE_API_URL=http://localhost:3001
VITE_GEMINI_API_KEY=your-gemini-api-key
```

#### 5. Initialize Database

```bash
cd server
npm install
npm run migrate
cd ..
```

#### 6. Run Development Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server
npm run dev
```

Visit http://localhost:5173

## Production Deployment

### Option 1: Vercel (Recommended)

1. Push to GitHub
2. Import repo at https://vercel.com/import
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Option 2: Netlify

1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed deployment instructions.

## Architecture

```
Frontend (React/Vite) → Express.js API Server → Neon PostgreSQL
```

- **Frontend**: React 18 with TypeScript, running on Vercel/Netlify/local
- **Backend**: Express.js server with JWT authentication
- **Database**: PostgreSQL (Neon) for data persistence
- **AI**: Google Gemini API for trading insights

## API Endpoints

All endpoints (except auth) require JWT token: `Authorization: Bearer <token>`

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login (returns JWT)

### Profiles
- `GET /api/profiles/:userId` - Get all profiles
- `POST /api/profiles` - Create new profile

### Portfolio
- `GET /api/portfolios/:profileId` - Get portfolio and holdings

### Orders
- `POST /api/orders` - Place new order
- `GET /api/orders/:portfolioId` - Get order history

### Teams
- `POST /api/teams` - Create team
- `POST /api/teams/join` - Join with invite code

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secret-key

# API Configuration
VITE_API_URL=http://localhost:3001        # dev
# Production: https://your-api.vercel.app

# AI Features
VITE_GEMINI_API_KEY=your-gemini-api-key   # optional

# Server
PORT=3001
NODE_ENV=production|development
```

## Database Schema

- **users** - User accounts with authentication
- **profiles** - Trading profiles per user
- **portfolios** - Portfolio state (cash, holdings)
- **holdings** - Stock positions
- **orders** - Trading history
- **teams** - Trading teams
- **team_members** - Team membership
- **team_invites** - Invite codes for teams

See [NEON_SETUP.md](NEON_SETUP.md) for schema details.

## Troubleshooting

### Blank Page on Load
- Check browser console for errors
- Verify API server is running (`npm run dev` in server folder)
- Check `VITE_API_URL` environment variable

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Test with: `psql $DATABASE_URL -c "SELECT NOW();"`
- Check Neon project is active
- Ensure `?sslmode=require` in connection string

### API Errors
- Check JWT token is being sent in headers
- Verify `JWT_SECRET` matches between dev and prod
- Check API server logs for detailed errors

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 18+)
- Rebuild: `npm run build`

## Development

### Project Structure
```
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks (including API)
│   ├── types.ts        # TypeScript type definitions
│   └── App.tsx         # Main app component
├── server/
│   ├── server.js       # Express API server
│   ├── db.js           # Database connection
│   ├── migrations.js   # Database schema
│   └── package.json
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
└── DATABASE_SETUP.md   # Complete setup guide
```

### Available Scripts

**Frontend:**
- `npm run dev` - Start Vite dev server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

**Backend:**
- `npm run dev` - Start Express server (port 3001, with auto-reload)
- `npm run start` - Start server (production)
- `npm run migrate` - Initialize/reset database

## Performance Tips

- Use connection pooling (already configured)
- Enable Neon caching in production
- Implement response caching for frequently accessed data
- Monitor API response times

## Security

- JWT tokens expire after 7 days
- Passwords hashed with bcryptjs (10 rounds)
- SSL/TLS required for database connections
- CORS enabled only for trusted origins
- Environment variables never committed

## Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Commit changes
4. Push and create a Pull Request

## Support

- **Issues**: GitHub Issues
- **Docs**: [DATABASE_SETUP.md](DATABASE_SETUP.md), [NEON_SETUP.md](NEON_SETUP.md)
- **Community**: Discord/Community links

## License

MIT License - See LICENSE file

## Roadmap

- [ ] Real stock market data integration
- [ ] WebSocket for real-time prices
- [ ] Mobile app
- [ ] Advanced charting
- [ ] Leaderboards
- [ ] Payment processing
- [ ] Email notifications

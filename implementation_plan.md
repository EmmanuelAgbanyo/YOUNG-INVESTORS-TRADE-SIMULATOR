# Migrate to Firebase Backend & Realtime Database

This plan outlines migrating the YOUNG INVESTORS TRADE SIMULATOR from its current Express + Neon PostgreSQL architecture over to Firebase Authentication and Firebase Realtime Database. 

## User Review Required

> [!WARNING]
> Before executing this plan, we need your confirmation. Migrating to Firebase means we will be ripping out the local database connection (`server/db.js`) and local JWT authentication. 

## Proposed Changes

---

### Phase 1: Environment & Project Initialization
Instead of hosting a Node server to act as a middleman for database queries, we will connect the React frontend directly to Firebase.

- **Authentication Setup**: The plan will start by running `firebase login` to authenticate your machine.
- **Firebase Project Creation**: We will create a fresh Firebase project (or use an existing one) and register a Web App.
- **Initialization**: Run `firebase init` to pull down configurations for Authentication and Realtime Database into the workspace.

### Phase 2: Frontend Firebase Setup & Authentication Migration
The custom authentication system (bcrypt + JWT + frontend auth states) will be swapped out for Google's robust Firebase Auth.

#### [NEW] `src/firebase.ts` (or equivalent location)
Add the Firebase Web configuration and initialize the `auth` and `database` services to be exported for your React application.

#### [MODIFY] `package.json`
Add `firebase` to frontend dependencies.

#### [MODIFY] `components/ProfileManager.tsx` & `contexts/hooks`
Refactor the authentication flow to use `createUserWithEmailAndPassword` and `signInWithEmailAndPassword`, allowing Firebase SDK to seamlessly handle the persistent session state, avoiding `localStorage` hacks.

---

### Phase 3: Database Schema Migration to Realtime Database
We will convert your relational tables into a JSON tree suitable for Realtime Database.

#### [MODIFY] `hooks/useAPI.ts`
Completely rewrite the API client. Instead of using `fetch()` endpoints like `/api/profiles` or `/api/portfolios`, the code will directly query the Firebase Realtime Database using `get()`, `set()`, `push()` and `update()`.

Proposed RTDB structure:
```json
{
  "users": {
    "UID": { "email": "..." }
  },
  "profiles": {
    "profileId": { "user_id": "UID", "name": "...", "bio": "..." }
  },
  "portfolios": {
    "profileId": { "cash": 100000.00 }
  },
  "holdings": {
    "profileId": { "MTNGH": { "quantity": 100, "avg_cost": 1.50 } }
  },
  "orders": {
    "profileId": {
      "orderId": { "symbol": "MTNGH", "type": "BUY", "quantity": 100, "status": "COMPLETED" }
    }
  },
  "teams": { ... }
}
```

#### [DELETE] `server/db.js` & `server/migrations.js`
We will no longer need connection strings or PG table setups.

---

### Phase 4: Market Data Scraper Pivot
Your Node.js server currently scrapes GSE data under the endpoint `/api/market/gse`. Since we're deprecating the relational database endpoints, we still need a way to serve this web scraping functionality.

> [!NOTE]
> **Proposed Solution**: We preserve `server/server.js` purely as a background worker. Instead of answering HTTP queries, we update the worker to run continuously (e.g. every 60 seconds), scrape the market data, and write the latest GSE prices directly into the Firebase Realtime Database under a `/market_data` path.
> 
> The React frontend can then bind a real-time listening hook to `/market_data`, gaining **instant, real-time UI updates** whenever the backend updates a stock price. This provides an incredible simulator experience!

## Open Questions

1. Do you already have a Firebase Project created for this that you want to link, or should I create a completely brand-new Firebase Project for you during execution?
2. Does the proposed pivot for the Market Data via an RTDB worker/scraper sound good to you? (This gives your users true real-time websocket updates without constant polling!)

## Verification Plan

### Manual Verification
- **Login/Signup Flow**: Ensure users can sign up and the identity appears in Firebase Auth console.
- **Portfolios**: Ensure that upon successful signup, initial portfolios (starting cash) inject correctly into RTDB.
- **Market Data Listeners**: Ensure the frontend updates stock prices immediately when data changes in the Realtime DB without having to refresh.

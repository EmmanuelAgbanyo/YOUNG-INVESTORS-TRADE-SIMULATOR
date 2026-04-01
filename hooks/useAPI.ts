import { auth, database } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  ref, 
  get, 
  set, 
  update,
  remove,
  push, 
  child, 
  query, 
  orderByChild, 
  equalTo,
  onValue
} from 'firebase/database';

class APIClient {
  private googleProvider = new GoogleAuthProvider();

  // Google Auth endpoint
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      const user = result.user;
      
      // Check if profile exists
      const profiles = await this.getProfiles(user.uid);
      
      if (profiles.length === 0) {
        // Create a default profile for the first-time sign-in
        const profileRef = push(ref(database, 'profiles'));
        const profileId = profileRef.key;
        await set(profileRef, {
          user_id: user.uid,
          email: user.email,
          name: user.displayName || 'User',
          bio: "",
          avatar_url: user.photoURL || "",
          theme: "dark",
          createdAt: Date.now()
        });

        // Initialize default portfolio
        await set(ref(database, `portfolios/${profileId}`), {
          cash: 100000.00,
          createdAt: Date.now()
        });
      }

      return { token: user.accessToken, userId: user.uid };
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-In popup was closed before completion. Please try again.');
      }
      throw new Error(err.message || 'Google Sign-In failed.');
    }
  }
  
  // Auth endpoints
  async signup(email: string, password: string, name: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update Auth display name
      await updateProfile(user, { displayName: name });

      // Create a default profile for the user in RTDB
      const profileRef = push(ref(database, 'profiles'));
      const profileId = profileRef.key;
      await set(profileRef, {
        user_id: user.uid,
        email: email,
        name: name,
        bio: "",
        avatar_url: "",
        theme: "dark",
        createdAt: Date.now()
      });

      // Initialize default portfolio with starting cash
      await set(ref(database, `portfolios/${profileId}`), {
        cash: 100000.00,
        createdAt: Date.now()
      });

      return { token: user.accessToken, userId: user.uid };
    } catch (err: any) {
      console.error("Signup Error:", err);
      // Map Firebase error codes to friendly messages
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('This username is already taken. Please log in or choose a different username.');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('Invalid username format. Please avoid special characters.');
      } else if (err.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (err.code === 'PERMISSION_DENIED' || err.message?.includes('PERMISSION_DENIED')) {
        throw new Error('Database permission error. Please contact support.');
      }
      throw new Error(err.message || 'Signup failed. Please try again.');
    }
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { token: userCredential.user.accessToken, userId: userCredential.user.uid };
    } catch (err: any) {
      console.error("Login Error:", err);
      // Map Firebase error codes to friendly messages
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-login-credentials') {
        throw new Error('Incorrect username or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please wait a moment and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (err.code === 'PERMISSION_DENIED' || err.message?.includes('PERMISSION_DENIED')) {
        throw new Error('Database permission error. Please contact support.');
      }
      throw new Error(err.message || 'Login failed. Please try again.');
    }
  }

  async logout() {
      return signOut(auth);
  }

  // Profile endpoints
  async getProfiles(userId: string) {
    try {
      const profilesQuery = query(ref(database, 'profiles'), orderByChild('user_id'), equalTo(userId));
      const snapshot = await get(profilesQuery);
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert object map to array
        return Object.keys(data).map(key => ({ id: key, ...data[key] }));
      }
      return [];
    } catch (err: any) {
      throw new Error(err.message || 'API request failed');
    }
  }

  // Subscription helpers
  subscribeProfiles(callback: (profiles: any[]) => void) {
    const profilesRef = ref(database, 'profiles');
    return onValue(profilesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const profilesList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      callback(profilesList);
    });
  }

  subscribePortfolios(callback: (portfolios: any) => void) {
    const portfoliosRef = ref(database, 'portfolios');
    return onValue(portfoliosRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
  }

  subscribeHoldings(callback: (holdings: any) => void) {
    const holdingsRef = ref(database, 'holdings');
    return onValue(holdingsRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
  }

  subscribeHistory(callback: (history: any) => void) {
    const historyRef = ref(database, 'history');
    return onValue(historyRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
  }

  async updateProfileStatus(id: string, isDisqualified: boolean) {
    try {
      const profileRef = ref(database, `profiles/${id}`);
      await update(profileRef, { isDisqualified });
      return true;
    } catch (err) {
      console.error("Update profile status failed:", err);
      return false;
    }
  }

  async getAllProfiles() {
    try {
      const snapshot = await get(ref(database, 'profiles'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({ id: key, ...data[key] }));
      }
      return [];
    } catch (err: any) {
      throw new Error(err.message || 'API request failed');
    }
  }

  async getAllPortfolios() {
    try {
      const snapshot = await get(ref(database, 'portfolios'));
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return {};
    } catch (err: any) {
      throw new Error(err.message || 'API request failed');
    }
  }

  async getAllHistory() {
    try {
      const snapshot = await get(ref(database, 'history'));
      return snapshot.val() || {};
    } catch (err: any) {
      return {};
    }
  }

  async getAllHoldings() {
    try {
      const snapshot = await get(ref(database, 'holdings'));
      return snapshot.val() || {};
    } catch (err: any) {
      return {};
    }
  }

  async syncExternalProfile(id: string, data: any, state: any) {
    try {
      const profileRef = ref(database, `profiles/${id}`);
      
      // Update profile
      await set(profileRef, {
        user_id: id,
        name: data.name,
        email: data.email || '',
        teamId: data.teamId || '',
        isTeamLeader: data.isTeamLeader || false,
        isDisqualified: data.isDisqualified || false,
        createdAt: data.createdAt || Date.now(),
        syncedFromAdmin: true,
        lastSyncedAt: Date.now()
      });

      // Update state if provided
      if (state) {
        await Promise.all([
          set(ref(database, `portfolios/${id}`), {
            cash: state.portfolio.cash,
            unsettledCash: state.portfolio.unsettledCash || [],
            performanceHistory: state.performanceHistory || [],
            updatedAt: Date.now()
          }),
          set(ref(database, `holdings/${id}`), state.portfolio.holdings || {}),
          set(ref(database, `history/${id}`), state.orderHistory || [])
        ]);
      }
      return true;
    } catch (err) {
      console.error("Sync failed for", id, err);
      return false;
    }
  }

  async resetAllSimulationData() {
    try {
      const nodesToDelete = [
        'profiles',
        'portfolios',
        'holdings',
        'history',
        'teams',
        'team_invites',
        'team_members',
        'orders'
      ];
      
      const deletions = nodesToDelete.map(node => remove(ref(database, node)));
      await Promise.all(deletions);
      return true;
    } catch (err) {
      console.error("Full reset failed:", err);
      throw err;
    }
  }

  async createProfile(name: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("Unauthorized");

    const profileRef = push(ref(database, 'profiles'));
    const profileId = profileRef.key;
    const profileData = {
        user_id: user.uid,
        name: name,
        bio: "",
        avatar_url: "",
        theme: "dark",
        createdAt: Date.now()
    };
    await set(profileRef, profileData);

    await set(ref(database, `portfolios/${profileId}`), {
      cash: 100000.00,
      createdAt: Date.now()
    });

    return { id: profileId, ...profileData };
  }

  // Portfolio endpoints
  async getPortfolio(profileId: string) {
    try {
      const portfolioSnap = await get(ref(database, `portfolios/${profileId}`));
      if (!portfolioSnap.exists()) {
        throw new Error('Portfolio not found');
      }
      
      const portfolio = portfolioSnap.val();
      portfolio.id = profileId;

      const holdingsSnap = await get(ref(database, `holdings/${profileId}`));
      portfolio.holdings = holdingsSnap.exists() ? holdingsSnap.val() : {};

      return portfolio;
    } catch (err: any) {
      throw new Error(err.message || 'API request failed');
    }
  }

  // Orders endpoints
  async placeOrder(portfolioId: string, symbol: string, tradeType: string, orderType: string, quantity: number, limitPrice: number | null = null) {
    try {
      // In a real app, logic to deduct cash & update holdings occurs in a secure backend environment or heavily validated Cloud Functions.
      // For simulator simplicity, we write it locally here.
      const orderRef = push(ref(database, `orders/${portfolioId}`));
      const orderData = {
        symbol,
        trade_type: tradeType,
        order_type: orderType,
        quantity,
        limit_price: limitPrice,
        status: 'PENDING',
        created_at: Date.now()
      };
      
      await set(orderRef, orderData);
      
      // Update portfolio holdings right away as a simulator shortcut:
      const portfolioRef = ref(database, `portfolios/${portfolioId}`);
      const portSnap = await get(portfolioRef);
      if (!portSnap.exists()) throw new Error("Portfolio not found");
      const currentCash = portSnap.val().cash || 0;

      // Fetch live price
      const marketSnap = await get(ref(database, `market_data/${symbol}`));
      if (!marketSnap.exists()) throw new Error("Market data not available for " + symbol);
      const currentPrice = marketSnap.val().price;

      const holdingRef = ref(database, `holdings/${portfolioId}/${symbol}`);
      const holdSnap = await get(holdingRef);
      let holdData = holdSnap.exists() ? holdSnap.val() : { quantity: 0, avg_cost: 0 };

      const totalCost = currentPrice * quantity;

      if (tradeType === 'BUY') {
         if (currentCash < totalCost) throw new Error("Insufficient funds");
         // Recalculate avg cost
         const newTotalQty = holdData.quantity + quantity;
         const newAvgCost = ((holdData.avg_cost * holdData.quantity) + totalCost) / newTotalQty;
         await set(holdingRef, { quantity: newTotalQty, avg_cost: newAvgCost });
         await set(portfolioRef, { ...portSnap.val(), cash: currentCash - totalCost });
      } else if (tradeType === 'SELL') {
         if (holdData.quantity < quantity) throw new Error("Insufficient shares");
         await set(holdingRef, { quantity: holdData.quantity - quantity, avg_cost: holdData.avg_cost });
         await set(portfolioRef, { ...portSnap.val(), cash: currentCash + totalCost });
      }

      await set(orderRef, { ...orderData, status: 'EXECUTED', executed_at: Date.now(), price: currentPrice });
      return { id: orderRef.key, ...orderData, status: 'EXECUTED' };
    } catch (err: any) {
        throw new Error(err.message || "Order placement failed");
    }
  }

  async getOrders(portfolioId: string) {
    const ordersSnap = await get(ref(database, `orders/${portfolioId}`));
    if (ordersSnap.exists()) {
      const data = ordersSnap.val();
      return Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a,b) => b.created_at - a.created_at);
    }
    return [];
  }

  // Teams endpoints
  async createTeam(profileId: string, teamName: string) {
    const teamRef = push(ref(database, 'teams'));
    const teamId = teamRef.key;
    await set(teamRef, {
      name: teamName,
      leader_id: profileId,
      created_at: Date.now()
    });

    const inviteCode = `${teamName.substring(0, 4).toUpperCase()}${Math.random().toString(36).substring(2, 6)}`;
    await set(ref(database, `team_invites/${inviteCode}`), {
      team_id: teamId,
      created_at: Date.now()
    });

    await set(ref(database, `team_members/${teamId}/${profileId}`), {
      joined_at: Date.now()
    });

    return { id: teamId, name: teamName, inviteCode };
  }

  async joinTeam(profileId: string, inviteCode: string) {
    const inviteSnap = await get(ref(database, `team_invites/${inviteCode}`));
    if (!inviteSnap.exists()) throw new Error('Invalid or expired invite code');
    
    const teamId = inviteSnap.val().team_id;
    await set(ref(database, `team_members/${teamId}/${profileId}`), {
        joined_at: Date.now()
    });

    return { message: 'Joined team successfully', teamId };
  }
}

export const apiClient = new APIClient();

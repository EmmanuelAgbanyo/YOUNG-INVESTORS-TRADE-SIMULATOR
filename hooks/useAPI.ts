import { auth, database } from '../firebase';
import type { AccountStatus, AuthClaims, Competition, CompetitionInvite, CompetitionStatus, Permission, StaffMember, StaffRole, SupportMessage, SupportTicket, SupportTicketPriority, SupportTicketStatus } from '../types';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  getIdTokenResult,
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
      const profiles = await this.getProfiles(userCredential.user.uid);
      const isSuspended = profiles.some((profile: any) => profile.accountStatus === 'SUSPENDED');
      if (isSuspended) {
        await signOut(auth);
        throw new Error('This account is suspended. Please contact support.');
      }
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

  async getAuthClaims(forceRefresh = false): Promise<AuthClaims | null> {
    if (!auth.currentUser) return null;
    const tokenResult = await getIdTokenResult(auth.currentUser, forceRefresh);
    const role = tokenResult.claims.role as AuthClaims['role'] | undefined;
    const permissions = Array.isArray(tokenResult.claims.permissions)
      ? tokenResult.claims.permissions.filter((value): value is Permission => typeof value === 'string')
      : [];
    if (!role) return null;
    return { role, permissions, claimsVersion: typeof tokenResult.claims.claimsVersion === 'number' ? tokenResult.claims.claimsVersion : undefined };
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

  subscribeOrders(callback: (orders: any) => void) {
    const ordersRef = ref(database, 'orders');
    return onValue(ordersRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
  }

  async updateAccountStatus(id: string, accountStatus: AccountStatus) {
    try {
      await update(ref(database, `profiles/${id}`), { accountStatus });
      await this.writeAudit('ACCOUNT_STATUS_CHANGED', id, { accountStatus });
      return true;
    } catch (err) {
      console.error('Update account status failed:', err);
      return false;
    }
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

  // Market Status & Admin Settings Sync
  subscribeMarketStatus(callback: (status: MarketStatus) => void) {
    const statusRef = ref(database, 'market_status');
    return onValue(statusRef, (snapshot) => {
      callback(snapshot.val() || 'CLOSED');
    });
  }

  subscribeMarketControlMode(callback: (mode: MarketControlMode) => void) {
    const modeRef = ref(database, 'market_control_mode');
    return onValue(modeRef, (snapshot) => {
      callback(snapshot.val() || 'AUTO');
    });
  }

  async updateMarketControlMode(mode: MarketControlMode) {
    try {
      await set(ref(database, 'market_control_mode'), mode);
      return true;
    } catch (err) {
      console.error("Update market control mode failed:", err);
      return false;
    }
  }

  async updateMarketStatus(status: MarketStatus, updateMode: boolean = true) {
    try {
      const updates: any = {
        'market_status': status
      };
      if (updateMode) {
        updates['market_control_mode'] = 'MANUAL';
      }
      
      const dbRef = ref(database);
      await update(dbRef, updates);
      return true;
    } catch (err) {
      console.error("Update market status failed:", err);
      return false;
    }
  }

  subscribeAdminSettings(callback: (settings: AdminSettings) => void) {
    const settingsRef = ref(database, 'admin_settings');
    return onValue(settingsRef, (snapshot) => {
      callback(snapshot.val());
    });
  }

  async updateAdminSettings(settings: AdminSettings) {
    try {
      await set(ref(database, 'admin_settings'), settings);
      return true;
    } catch (err) {
      console.error("Update admin settings failed:", err);
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

  async resetProfileData(profileId: string) {
    try {
      const nodesToDelete = [
        `portfolios/${profileId}`,
        `holdings/${profileId}`,
        `history/${profileId}`,
        `orders/${profileId}`
      ];
      
      const deletions = nodesToDelete.map(node => remove(ref(database, node)));
      await Promise.all(deletions);
      return true;
    } catch (err) {
      console.error("Profile reset failed:", err);
      return false;
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

  // Competition operations
  async getAllCompetitions(): Promise<Competition[]> {
    try {
      const snapshot = await get(ref(database, 'competitions'));
      const data = snapshot.val() || {};
      return Object.keys(data).map(id => ({ id, ...data[id] }));
    } catch (error) {
      console.warn('Competitions unavailable:', error);
      return [];
    }
  }

  async createCompetition(input: Omit<Competition, 'id' | 'inviteCode' | 'createdAt' | 'participantIds' | 'createdBy'>, createdBy: string) {
    const competitionRef = push(ref(database, 'competitions'));
    const id = competitionRef.key as string;
    const inviteCode = `${input.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'YIN'}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const competition: Competition = { ...input, id, inviteCode, createdBy, createdAt: Date.now(), participantIds: [] };
    await set(competitionRef, competition);
    await this.writeAudit('COMPETITION_CREATED', id, { name: input.name, status: input.status });
    return competition;
  }

  async updateCompetitionStatus(id: string, status: CompetitionStatus) {
    await update(ref(database, `competitions/${id}`), { status, updatedAt: Date.now() });
    await this.writeAudit('COMPETITION_STATUS_CHANGED', id, { status });
    return true;
  }

  async createCompetitionInvite(competitionId: string, email?: string): Promise<CompetitionInvite> {
    const competitionSnap = await get(ref(database, `competitions/${competitionId}`));
    if (!competitionSnap.exists()) throw new Error('Competition not found');
    const competition = competitionSnap.val() as Competition;
    const inviteRef = push(ref(database, `competition_invites/${competitionId}`));
    const invite: CompetitionInvite = { id: inviteRef.key as string, competitionId, inviteCode: competition.inviteCode, email: email?.trim() || undefined, status: 'PENDING', createdAt: Date.now() };
    await set(inviteRef, invite);
    return invite;
  }

  async acceptCompetitionInvite(profileId: string, inviteCode: string) {
    const competitionsSnap = await get(ref(database, 'competitions'));
    const competitions = competitionsSnap.val() || {};
    const match = Object.values(competitions).find((item: any) => item.inviteCode === inviteCode && ['INVITE_ONLY', 'OPEN'].includes(item.status)) as any;
    if (!match) throw new Error('Invalid or inactive competition invite');
    if ((match.participantIds || []).includes(profileId)) return match;
    if ((match.participantIds || []).length >= Number(match.maxParticipants || 0)) throw new Error('This competition is full');
    const id = Object.keys(competitions).find(key => competitions[key].inviteCode === inviteCode) as string;
    await update(ref(database, `competitions/${id}`), { participantIds: [...(match.participantIds || []), profileId], status: match.status === 'INVITE_ONLY' ? 'OPEN' : match.status });
    return { ...match, id, participantIds: [...(match.participantIds || []), profileId] };
  }

  // Support operations
  async getAllSupportTickets(): Promise<SupportTicket[]> {
    try {
      const snapshot = await get(ref(database, 'support_tickets'));
      const data = snapshot.val() || {};
      return Object.keys(data).map(id => ({ ...data[id], id, messages: Object.values(data[id].messages || {}) as SupportMessage[] })).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.warn('Support tickets unavailable:', error);
      return [];
    }
  }

  async createSupportTicket(input: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>, firstMessage: string) {
    const ticketRef = push(ref(database, 'support_tickets'));
    const id = ticketRef.key as string;
    const messageRef = push(ref(database, `support_tickets/${id}/messages`));
    const ticket: any = { ...input, id, createdAt: Date.now(), updatedAt: Date.now(), messages: { [messageRef.key as string]: { id: messageRef.key, senderId: input.userId, senderName: input.userName, senderRole: 'USER', text: firstMessage, createdAt: Date.now() } } };
    await set(ticketRef, ticket);
    return ticket as SupportTicket;
  }

  async addSupportTicketMessage(ticketId: string, message: Omit<SupportMessage, 'id' | 'createdAt'>) {
    const messageRef = push(ref(database, `support_tickets/${ticketId}/messages`));
    const payload = { ...message, id: messageRef.key, createdAt: Date.now() };
    await set(messageRef, payload);
    await update(ref(database, `support_tickets/${ticketId}`), { updatedAt: Date.now(), status: message.senderRole === 'USER' ? 'OPEN' : 'WAITING_FOR_USER' });
    return payload as SupportMessage;
  }

  async updateSupportTicket(ticketId: string, patch: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assignedTo' | 'assignedName'>>) {
    await update(ref(database, `support_tickets/${ticketId}`), { ...patch, updatedAt: Date.now() });
    return true;
  }

  // Staff and admin provisioning records. Actual Firebase Auth creation should be completed by a trusted server or Cloud Function.
  async getStaffMembers(): Promise<StaffMember[]> {
    try {
      const snapshot = await get(ref(database, 'staff'));
      const data = snapshot.val() || {};
      return Object.keys(data).map(id => ({ id, ...data[id] }));
    } catch (error) {
      console.warn('Staff records unavailable:', error);
      return [];
    }
  }

  async createStaffMember(input: Omit<StaffMember, 'id' | 'invitedAt' | 'status'>) {
    const staffRef = push(ref(database, 'staff'));
    const staff: StaffMember = { ...input, id: staffRef.key as string, status: 'INVITED', invitedAt: Date.now() };
    await set(staffRef, staff);
    await this.writeAudit('STAFF_INVITED', staff.id, { email: staff.email, role: staff.role });
    return staff;
  }

  async updateStaffMember(id: string, patch: Partial<Pick<StaffMember, 'name' | 'role' | 'status' | 'permissions'>>) {
    await update(ref(database, `staff/${id}`), patch);
    await this.writeAudit('STAFF_UPDATED', id, patch);
    return true;
  }

  async writeAudit(action: string, targetId: string, metadata: Record<string, unknown> = {}) {
    const actor = auth.currentUser;
    const auditRef = push(ref(database, 'admin_audit'));
    await set(auditRef, { id: auditRef.key, action, targetId, metadata, actorId: actor?.uid || 'unknown', actorEmail: actor?.email || '', createdAt: Date.now() });
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

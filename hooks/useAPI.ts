// Frontend API client for Neon-backed backend
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

class APIClient {
  token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  async request(method: string, endpoint: string, body: any = null) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }

      return await response.json();
    } catch (err) {
      console.error(`API Error [${method} ${endpoint}]:`, err);
      throw err;
    }
  }

  // Auth endpoints
  async signup(email, password, name) {
    const data = await this.request('POST', '/api/auth/signup', {
      email,
      password,
      name,
    });
    this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('POST', '/api/auth/login', {
      email,
      password,
    });
    this.setToken(data.token);
    return data;
  }

  // Profile endpoints
  async getProfiles(userId) {
    return this.request('GET', `/api/profiles/${userId}`);
  }

  async createProfile(name) {
    return this.request('POST', '/api/profiles', { name });
  }

  // Portfolio endpoints
  async getPortfolio(profileId) {
    return this.request('GET', `/api/portfolios/${profileId}`);
  }

  // Orders endpoints
  async placeOrder(portfolioId, symbol, tradeType, orderType, quantity, limitPrice = null) {
    return this.request('POST', '/api/orders', {
      portfolioId,
      symbol,
      tradeType,
      orderType,
      quantity,
      limitPrice,
    });
  }

  async getOrders(portfolioId) {
    return this.request('GET', `/api/orders/${portfolioId}`);
  }

  // Teams endpoints
  async createTeam(profileId, teamName) {
    return this.request('POST', '/api/teams', { profileId, teamName });
  }

  async joinTeam(profileId, inviteCode) {
    return this.request('POST', '/api/teams/join', { profileId, inviteCode });
  }
}

export const apiClient = new APIClient();

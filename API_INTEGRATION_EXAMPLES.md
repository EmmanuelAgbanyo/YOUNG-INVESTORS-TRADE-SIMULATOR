// Example: How to integrate useAPI into React components
// Copy these patterns to your existing components

// ============================================
// Example 1: Login Component Integration
// ============================================

import { useState } from 'react';
import { apiClient } from '../hooks/useAPI';

export function LoginExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await apiClient.login(email, password);
      console.log('Login successful:', result);
      // Now you have the JWT token stored automatically
      // Redirect to dashboard or main app
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// ============================================
// Example 2: Profile Manager Integration
// ============================================

import { useEffect, useState } from 'react';
import { apiClient } from '../hooks/useAPI';

interface Profile {
  id: string;
  name: string;
  theme: string;
}

export function ProfileManagerExample() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const userId = 'current-user-id'; // Get from auth state

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProfiles(userId);
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProfile = await apiClient.createProfile(newProfileName);
      setProfiles([...profiles, newProfile]);
      setNewProfileName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    }
  };

  return (
    <div>
      <h2>Your Profiles</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {loading ? (
        <p>Loading profiles...</p>
      ) : (
        <ul>
          {profiles.map((profile) => (
            <li key={profile.id}>{profile.name}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCreateProfile}>
        <input
          type="text"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          placeholder="New profile name"
          required
        />
        <button type="submit">Create Profile</button>
      </form>
    </div>
  );
}

// ============================================
// Example 3: Place Order Integration
// ============================================

import { useState } from 'react';
import { apiClient } from '../hooks/useAPI';

export function PlaceOrderExample() {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const portfolioId = 'current-portfolio-id'; // Get from state

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await apiClient.placeOrder(
        portfolioId,
        symbol,
        tradeType,
        orderType,
        parseInt(quantity),
        orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined
      );

      setSuccess(`Order placed: ${symbol} x${quantity} @ ${tradeType}`);
      
      // Reset form
      setSymbol('');
      setQuantity('');
      setLimitPrice('');
      
      // Refresh order history
      // loadOrders(); // Call your refresh function
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePlaceOrder}>
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="Stock Symbol (e.g., AAPL)"
        required
      />
      
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Quantity"
        required
      />

      <select value={tradeType} onChange={(e) => setTradeType(e.target.value as 'BUY' | 'SELL')}>
        <option value="BUY">BUY</option>
        <option value="SELL">SELL</option>
      </select>

      <select value={orderType} onChange={(e) => setOrderType(e.target.value as 'MARKET' | 'LIMIT')}>
        <option value="MARKET">Market Order</option>
        <option value="LIMIT">Limit Order</option>
      </select>

      {orderType === 'LIMIT' && (
        <input
          type="number"
          step="0.01"
          value={limitPrice}
          onChange={(e) => setLimitPrice(e.target.value)}
          placeholder="Limit Price"
          required
        />
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Placing order...' : 'Place Order'}
      </button>
    </form>
  );
}

// ============================================
// Example 4: Portfolio View Integration
// ============================================

import { useEffect, useState } from 'react';
import { apiClient } from '../hooks/useAPI';

interface Portfolio {
  id: string;
  cash: number;
  holdings: Record<
    string,
    { symbol: string; quantity: number; avgCost: number }
  >;
}

export function PortfolioViewExample() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const profileId = 'current-profile-id'; // Get from state

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPortfolio(profileId);
      setPortfolio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading portfolio...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!portfolio) return <p>No portfolio found</p>;

  return (
    <div>
      <h2>Portfolio</h2>
      <div>
        <strong>Cash:</strong> GHS {portfolio.cash.toFixed(2)}
      </div>

      <h3>Holdings</h3>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Quantity</th>
            <th>Avg Cost</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(portfolio.holdings).map((holding) => (
            <tr key={holding.symbol}>
              <td>{holding.symbol}</td>
              <td>{holding.quantity}</td>
              <td>GHS {holding.avgCost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={loadPortfolio}>Refresh</button>
    </div>
  );
}

// ============================================
// Example 5: Using Logout
// ============================================

export function LogoutExample() {
  const handleLogout = () => {
    apiClient.clearToken();
    window.location.href = '/login';
  };

  return (
    <button onClick={handleLogout} style={{ padding: '10px 20px' }}>
      Logout
    </button>
  );
}

// ============================================
// Best Practices
// ============================================

/*
1. ERROR HANDLING:
   - Always wrap API calls in try-catch
   - Show user-friendly error messages
   - Log errors to console for debugging

2. LOADING STATES:
   - Show loading indicator while fetching
   - Disable buttons during loading
   - Prevent duplicate submissions

3. TOKEN MANAGEMENT:
   - apiClient automatically stores/retrieves token
   - Check token expiry on app startup
   - Redirect to login if token invalid

4. STATE MANAGEMENT:
   - Use useState for local component state
   - Use useEffect for initial data loading
   - Consider Context API or Redux for global state

5. API CALLS:
   - Make API calls in useEffect (with empty dependency array for initial load)
   - Debounce frequent API calls
   - Implement pagination for large datasets

6. USER FEEDBACK:
   - Show success messages after actions
   - Show loading skeletons for better UX
   - Disable buttons during loading

7. OFFLINE HANDLING:
   - Check network status before API calls
   - Show offline message to users
   - Queue requests to send when online
*/


import type { Stock, OHLC } from './types.ts';

export const DEFAULT_STARTING_CAPITAL = 100000;
export const MARKET_OPEN_DELAY_MS = 5000;

// Default admin and market simulation parameters
export const DEFAULT_MARKET_DURATION_MINUTES = 5;
export const DEFAULT_ANNUAL_DRIFT = 0.08; // 8% annual growth trend
export const DEFAULT_ANNUAL_VOLATILITY = 0.20; // 20% annual volatility
export const DEFAULT_EVENT_CHANCE_PER_TICK = 0.05; // 5% chance of an event each tick
export const DEFAULT_CIRCUIT_BREAKER_ENABLED = true;
export const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 0.07; // 7% market drop
export const DEFAULT_CIRCUIT_BREAKER_HALT_SECONDS = 30;
export const DEFAULT_SIMULATION_SPEED = 'Normal';
export const DEFAULT_INTEREST_RATE = 0.02; // 2% annual interest rate
export const DEFAULT_COMMISSION_FEE = 0.005; // 0.5% per trade


const createInitialHistory = (price: number): OHLC[] => [{ open: price, high: price, low: price, close: price }];

// FIX: Added 'priceHistory' to each stock object to match the 'Stock' type definition.
// Added volatility and trend to each stock for a more realistic simulation.
export const STOCKS_DATA: Stock[] = [
  { symbol: 'MTNGH', name: 'MTN Ghana', price: 1.55, priceHistory: createInitialHistory(1.55), volatility: 0.02, trend: 0.0005 },
  { symbol: 'CAL', name: 'CAL Bank', price: 0.68, priceHistory: createInitialHistory(0.68), volatility: 0.015, trend: 0.0003 },
  { symbol: 'TOTAL', name: 'TotalEnergies Marketing', price: 9.90, priceHistory: createInitialHistory(9.90), volatility: 0.025, trend: 0.0002 },
  { symbol: 'GOIL', name: 'GOIL PLC', price: 1.60, priceHistory: createInitialHistory(1.60), volatility: 0.022, trend: 0.00025 },
  { symbol: 'GCB', name: 'GCB Bank PLC', price: 4.01, priceHistory: createInitialHistory(4.01), volatility: 0.018, trend: 0.0004 },
  { symbol: 'EGL', name: 'Enterprise Group PLC', price: 3.90, priceHistory: createInitialHistory(3.90), volatility: 0.019, trend: 0.0006 },
  { symbol: 'FML', name: 'Fan Milk PLC', price: 1.80, priceHistory: createInitialHistory(1.80), volatility: 0.03, trend: -0.0001 },
  { symbol: 'SOGEGH', name: 'Societe Generale Ghana', price: 1.25, priceHistory: createInitialHistory(1.25), volatility: 0.016, trend: 0.0002 },
  { symbol: 'UNIL', name: 'Unilever Ghana PLC', price: 19.98, priceHistory: createInitialHistory(19.98), volatility: 0.012, trend: 0.0007 },
  { symbol: 'GGBL', name: 'Guinness Ghana Breweries', price: 3.20, priceHistory: createInitialHistory(3.20), volatility: 0.028, trend: 0.0003 },
  { symbol: 'SCB', name: 'Standard Chartered Bank', price: 20.00, priceHistory: createInitialHistory(20.00), volatility: 0.011, trend: 0.0005 },
  { symbol: 'BOPP', name: 'Benso Oil Palm Plantation', price: 21.00, priceHistory: createInitialHistory(21.00), volatility: 0.035, trend: 0.0008 },
  { symbol: 'GSR', name: 'Ghana Stock Exchange', price: 15.00, priceHistory: createInitialHistory(15.00), volatility: 0.008, trend: 0.0001 },
  { symbol: 'ACCESS', name: 'Access Bank Ghana', price: 4.50, priceHistory: createInitialHistory(4.50), volatility: 0.021, trend: 0.00045 },
  { symbol: 'ETI', name: 'Ecobank Transnational', price: 0.15, priceHistory: createInitialHistory(0.15), volatility: 0.04, trend: 0.0001 },
];
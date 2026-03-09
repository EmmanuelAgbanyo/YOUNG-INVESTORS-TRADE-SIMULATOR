
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
  { symbol: 'MTNGH', name: 'MTN Ghana', price: 1.60, priceHistory: createInitialHistory(1.60), volatility: 0.012, trend: 0.0008 },
  { symbol: 'SCB', name: 'Standard Chartered Bank', price: 18.23, priceHistory: createInitialHistory(18.23), volatility: 0.011, trend: 0.0015 },
  { symbol: 'GCB', name: 'GCB Bank PLC', price: 3.40, priceHistory: createInitialHistory(3.40), volatility: 0.015, trend: 0.0012 },
  { symbol: 'EGL', name: 'Enterprise Group PLC', price: 2.39, priceHistory: createInitialHistory(2.39), volatility: 0.019, trend: 0.0007 },
  { symbol: 'GOIL', name: 'GOIL PLC', price: 1.50, priceHistory: createInitialHistory(1.50), volatility: 0.022, trend: 0.0005 },
  { symbol: 'TOTAL', name: 'TotalEnergies Marketing', price: 9.00, priceHistory: createInitialHistory(9.00), volatility: 0.025, trend: 0.001 },
  { symbol: 'CAL', name: 'CalBank PLC', price: 0.48, priceHistory: createInitialHistory(0.48), volatility: 0.018, trend: 0.0003 },
  { symbol: 'FML', name: 'Fan Milk PLC', price: 2.10, priceHistory: createInitialHistory(2.10), volatility: 0.03, trend: -0.0002 },
  { symbol: 'SOGEGH', name: 'Societe Generale Ghana', price: 1.53, priceHistory: createInitialHistory(1.53), volatility: 0.016, trend: 0.0006 },
  { symbol: 'UNIL', name: 'Unilever Ghana PLC', price: 12.00, priceHistory: createInitialHistory(12.00), volatility: 0.012, trend: 0.0009 },
  { symbol: 'GGBL', name: 'Guinness Ghana Breweries', price: 4.45, priceHistory: createInitialHistory(4.45), volatility: 0.028, trend: 0.0005 },
  { symbol: 'BOPP', name: 'Benso Oil Palm Plantation', price: 21.00, priceHistory: createInitialHistory(21.00), volatility: 0.035, trend: 0.002 },
  { symbol: 'ACCESS', name: 'Access Bank Ghana', price: 4.54, priceHistory: createInitialHistory(4.54), volatility: 0.021, trend: 0.0012 },
  { symbol: 'ETI', name: 'Ecobank Transnational', price: 0.15, priceHistory: createInitialHistory(0.15), volatility: 0.04, trend: 0.0004 },
  { symbol: 'CPC', name: 'Cocoa Processing Company', price: 0.08, priceHistory: createInitialHistory(0.08), volatility: 0.06, trend: -0.001 },
  { symbol: 'SIC', name: 'SIC Insurance Company', price: 0.24, priceHistory: createInitialHistory(0.24), volatility: 0.025, trend: 0.0002 },
  { symbol: 'TBL', name: 'Trust Bank Gambia', price: 0.80, priceHistory: createInitialHistory(0.80), volatility: 0.018, trend: 0.0001 },
  { symbol: 'ALW', name: 'Aluworks Limited', price: 0.10, priceHistory: createInitialHistory(0.10), volatility: 0.05, trend: -0.0005 },
  { symbol: 'CLYD', name: 'Clydestone Ghana', price: 0.03, priceHistory: createInitialHistory(0.03), volatility: 0.08, trend: 0.0001 },
  { symbol: 'CMLT', name: 'Camelot Ghana', price: 0.14, priceHistory: createInitialHistory(0.14), volatility: 0.03, trend: -0.0001 },
  { symbol: 'DASPHARMA', name: 'Dannex Ayrton Starwin', price: 0.36, priceHistory: createInitialHistory(0.36), volatility: 0.04, trend: 0.0004 },
  { symbol: 'MAC', name: 'Mega African Capital', price: 5.38, priceHistory: createInitialHistory(5.38), volatility: 0.02, trend: 0.0008 },
  { symbol: 'MMH', name: 'Meridian-Marshall Holdings', price: 0.11, priceHistory: createInitialHistory(0.11), volatility: 0.05, trend: 0.0002 },
  { symbol: 'GLD', name: 'NewGold ETF', price: 341.20, priceHistory: createInitialHistory(341.20), volatility: 0.015, trend: 0.0015 },
  { symbol: 'AGA', name: 'AngloGold Ashanti', price: 35.50, priceHistory: createInitialHistory(35.50), volatility: 0.02, trend: 0.001 },
  { symbol: 'TLW', name: 'Tullow Oil Plc', price: 11.92, priceHistory: createInitialHistory(11.92), volatility: 0.035, trend: 0.0005 },
];
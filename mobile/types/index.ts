/**
 * Nexora Finance — Type Definitions
 */

// ─── User Profile ───────────────────────────────────────────
export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  default_currency: string;
  created_at: string;
}

// ─── Bank Account ───────────────────────────────────────────
export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_name: string;
  balance: number;
  currency: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Crypto Holding ─────────────────────────────────────────
export interface CryptoHolding {
  id: string;
  user_id: string;
  coin_id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchase_price: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Stock Holding ──────────────────────────────────────────
export interface StockHolding {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  shares: number;
  purchase_price: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Bill / Liability ───────────────────────────────────────
export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'one-time';
  due_date: string | null;
  icon: string | null;
  is_liability: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Chat Message ───────────────────────────────────────────
export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ─── Market Data (CoinGecko) ────────────────────────────────
export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_24h: number;
  total_volume: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: { large: string; small: string; thumb: string };
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    price_change_24h: number;
    market_cap: { usd: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    ath: { usd: number };
    atl: { usd: number };
  };
}

export interface ChartDataPoint {
  timestamp: number;
  price: number;
}

// ─── Stock Data (Finnhub) ───────────────────────────────────
export interface StockQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High
  l: number;  // Low
  o: number;  // Open
  pc: number; // Previous close
  t: number;  // Timestamp
}

export interface StockSearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

// ─── Portfolio Summary ──────────────────────────────────────
export interface PortfolioSummary {
  totalNetWorth: number;
  totalAssets: number;
  totalCrypto: number;
  totalStocks: number;
  totalLiabilities: number;
  changePercent: number;
}

// ─── Add Asset Form Types ───────────────────────────────────
export type AssetCategory = 'bank' | 'crypto' | 'stock' | 'bill';

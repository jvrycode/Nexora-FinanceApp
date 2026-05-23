/**
 * CoinGecko API Service — Crypto market data
 * Uses the FREE public API (no key needed, supports CORS)
 * Rate limit: ~10-30 calls/min
 */
import { CoinMarketData, ChartDataPoint } from '@/types';

const BASE_URL = 'https://api.coingecko.com/api/v3';
const TIMEOUT_MS = 10_000;

// ─── In-memory cache (5 min TTL) ─────────────────────────────
const cache: Record<string, { data: any; at: number }> = {};
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string): any | null {
  const entry = cache[key];
  if (entry && Date.now() - entry.at < CACHE_TTL) return entry.data;
  return null;
}
function setCached(key: string, data: any) {
  cache[key] = { data, at: Date.now() };
}

async function fetchCG(endpoint: string, retries = 3): Promise<any> {
  const cached = getCached(endpoint);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { signal: controller.signal });
    clearTimeout(timer);

    if (response.status === 429 && retries > 0) {
      // Rate limited — back off exponentially
      const delay = (4 - retries) * 3000;
      await new Promise((r) => setTimeout(r, delay));
      return fetchCG(endpoint, retries - 1);
    }
    if (!response.ok) {
      throw new Error(`CoinGecko error: ${response.status}`);
    }
    const data = await response.json();
    setCached(endpoint, data);
    return data;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out. Check your connection.');
    throw err;
  }
}

/**
 * Get top coins by market cap with sparkline data
 */
export async function getMarketData(
  page = 1,
  perPage = 20,
  sparkline = true
): Promise<CoinMarketData[]> {
  const data = await fetchCG(
    `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=${sparkline}&price_change_percentage=24h`
  );
  return data;
}

/**
 * Get top gainers (sorted by 24h price change)
 */
export async function getTopGainers(perPage = 20): Promise<CoinMarketData[]> {
  const data = await getMarketData(1, 100, false);
  return data
    .filter((coin: CoinMarketData) => coin.price_change_percentage_24h > 0)
    .sort((a: CoinMarketData, b: CoinMarketData) => b.price_change_percentage_24h - a.price_change_percentage_24h)
    .slice(0, perPage);
}

/**
 * Get top losers
 */
export async function getTopLosers(perPage = 20): Promise<CoinMarketData[]> {
  const data = await getMarketData(1, 100, false);
  return data
    .filter((coin: CoinMarketData) => coin.price_change_percentage_24h < 0)
    .sort((a: CoinMarketData, b: CoinMarketData) => a.price_change_percentage_24h - b.price_change_percentage_24h)
    .slice(0, perPage);
}

/**
 * Get historical price chart data for a specific coin
 */
export async function getCoinChart(
  coinId: string,
  days: number | string = 7
): Promise<ChartDataPoint[]> {
  const data = await fetchCG(
    `/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
  );
  return data.prices.map(([timestamp, price]: [number, number]) => ({
    timestamp,
    price,
  }));
}

/**
 * Get detailed info for a specific coin
 */
export async function getCoinDetail(coinId: string) {
  return fetchCG(
    `/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
  );
}

/**
 * Search for coins by query
 */
export async function searchCoins(query: string) {
  const data = await fetchCG(`/search?query=${encodeURIComponent(query)}`);
  return data.coins?.slice(0, 10) || [];
}

/**
 * Get global crypto market data
 */
export async function getGlobalMarketData() {
  const data = await fetchCG('/global');
  return data.data;
}

/**
 * Get prices for specific coin IDs (for portfolio valuation)
 */
export async function getCoinPrices(coinIds: string[]): Promise<Record<string, { usd: number }>> {
  if (coinIds.length === 0) return {};
  const ids = coinIds.join(',');
  return fetchCG(`/simple/price?ids=${ids}&vs_currencies=usd`);
}

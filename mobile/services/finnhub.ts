/**
 * Finnhub API Service — Stock market data
 * Free tier: 60 calls/min
 */
import { StockQuote, StockSearchResult } from '@/types';

const BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.EXPO_PUBLIC_FINNHUB_API_KEY || '';

async function fetchFH(endpoint: string) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(`${BASE_URL}${endpoint}${separator}token=${API_KEY}`);
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get real-time stock quote
 */
export async function getStockQuote(symbol: string): Promise<StockQuote> {
  return fetchFH(`/quote?symbol=${symbol.toUpperCase()}`);
}

/**
 * Search for stocks by query
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  const data = await fetchFH(`/search?q=${encodeURIComponent(query)}`);
  // Filter to only common stocks
  return (data.result || [])
    .filter((item: StockSearchResult) => item.type === 'Common Stock')
    .slice(0, 10);
}

/**
 * Get company profile
 */
export async function getCompanyProfile(symbol: string) {
  return fetchFH(`/stock/profile2?symbol=${symbol.toUpperCase()}`);
}

/**
 * Get stock candle data (historical prices)
 */
export async function getStockCandles(
  symbol: string,
  resolution: string = 'D',
  from: number,
  to: number
) {
  return fetchFH(
    `/stock/candle?symbol=${symbol.toUpperCase()}&resolution=${resolution}&from=${from}&to=${to}`
  );
}

/**
 * Get multiple stock quotes at once
 */
export async function getMultipleQuotes(
  symbols: string[]
): Promise<Record<string, StockQuote>> {
  const results: Record<string, StockQuote> = {};
  // Finnhub doesn't have a batch endpoint, so we fetch in parallel
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        results[symbol] = await getStockQuote(symbol);
      } catch (error) {
        console.warn(`Failed to fetch quote for ${symbol}:`, error);
      }
    })
  );
  return results;
}

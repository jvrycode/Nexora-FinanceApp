/**
 * Portfolio Service — Aggregates all user data for net worth calculations
 */
import { supabase } from '@/lib/supabase';
import { getCoinPrices } from '@/services/coingecko';
import { getMultipleQuotes } from '@/services/finnhub';
import { BankAccount, CryptoHolding, StockHolding, Bill, PortfolioSummary } from '@/types';

/**
 * Fetch all bank accounts for a user
 */
export async function getBankAccounts(userId: string): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch all crypto holdings for a user
 */
export async function getCryptoHoldings(userId: string): Promise<CryptoHolding[]> {
  const { data, error } = await supabase
    .from('crypto_holdings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch all stock holdings for a user
 */
export async function getStockHoldings(userId: string): Promise<StockHolding[]> {
  const { data, error } = await supabase
    .from('stock_holdings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch all bills for a user
 */
export async function getBills(userId: string): Promise<Bill[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Calculate complete portfolio summary with live prices
 */
export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const [bankAccounts, cryptoHoldings, stockHoldings, bills] = await Promise.all([
    getBankAccounts(userId),
    getCryptoHoldings(userId),
    getStockHoldings(userId),
    getBills(userId),
  ]);

  // Calculate bank totals
  const totalAssets = bankAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  // Calculate crypto totals with live prices
  let totalCrypto = 0;
  if (cryptoHoldings.length > 0) {
    try {
      const coinIds = cryptoHoldings.map((h) => h.coin_id);
      const prices = await getCoinPrices(coinIds);
      totalCrypto = cryptoHoldings.reduce((sum, h) => {
        const price = prices[h.coin_id]?.usd || 0;
        return sum + Number(h.quantity) * price;
      }, 0);
    } catch {
      // Fallback to purchase prices if API fails
      totalCrypto = cryptoHoldings.reduce(
        (sum, h) => sum + Number(h.quantity) * (Number(h.purchase_price) || 0),
        0
      );
    }
  }

  // Calculate stock totals with live prices
  let totalStocks = 0;
  if (stockHoldings.length > 0) {
    try {
      const symbols = stockHoldings.map((h) => h.symbol);
      const quotes = await getMultipleQuotes(symbols);
      totalStocks = stockHoldings.reduce((sum, h) => {
        const quote = quotes[h.symbol];
        const price = quote?.c || Number(h.purchase_price) || 0;
        return sum + Number(h.shares) * price;
      }, 0);
    } catch {
      totalStocks = stockHoldings.reduce(
        (sum, h) => sum + Number(h.shares) * (Number(h.purchase_price) || 0),
        0
      );
    }
  }

  // Calculate liabilities (monthly bills)
  const totalLiabilities = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);

  const totalNetWorth = totalAssets + totalCrypto + totalStocks - totalLiabilities;

  return {
    totalNetWorth,
    totalAssets,
    totalCrypto,
    totalStocks,
    totalLiabilities,
    changePercent: 0, // Will implement historical tracking later
  };
}

// ─── CRUD Operations ────────────────────────────────────────

export async function addBankAccount(userId: string, data: Partial<BankAccount>) {
  const { error } = await supabase.from('bank_accounts').insert({
    user_id: userId,
    bank_name: data.bank_name,
    account_name: data.account_name,
    balance: data.balance,
    currency: data.currency || 'USD',
    icon: data.icon,
  });
  if (error) throw error;
}

export async function addCryptoHolding(userId: string, data: Partial<CryptoHolding>) {
  const { error } = await supabase.from('crypto_holdings').insert({
    user_id: userId,
    coin_id: data.coin_id,
    symbol: data.symbol,
    name: data.name,
    quantity: data.quantity,
    purchase_price: data.purchase_price,
  });
  if (error) throw error;
}

export async function addStockHolding(userId: string, data: Partial<StockHolding>) {
  const { error } = await supabase.from('stock_holdings').insert({
    user_id: userId,
    symbol: data.symbol,
    name: data.name,
    shares: data.shares,
    purchase_price: data.purchase_price,
  });
  if (error) throw error;
}

export async function addBill(userId: string, data: Partial<Bill>) {
  const { error } = await supabase.from('bills').insert({
    user_id: userId,
    name: data.name,
    amount: data.amount,
    frequency: data.frequency || 'monthly',
    due_date: data.due_date,
    icon: data.icon,
    is_liability: data.is_liability ?? true,
  });
  if (error) throw error;
}

export async function deleteAsset(table: string, assetId: string) {
  const { error } = await supabase.from(table).delete().eq('id', assetId);
  if (error) throw error;
}

export async function updateBankBalance(accountId: string, balance: number) {
  const { error } = await supabase
    .from('bank_accounts')
    .update({ balance, updated_at: new Date().toISOString() })
    .eq('id', accountId);
  if (error) throw error;
}

export async function updateBankAccount(accountId: string, data: Partial<BankAccount>) {
  const { error } = await supabase
    .from('bank_accounts')
    .update({ bank_name: data.bank_name, account_name: data.account_name, balance: data.balance })
    .eq('id', accountId);
  if (error) throw error;
}

export async function updateCryptoHolding(holdingId: string, data: Partial<CryptoHolding>) {
  const { error } = await supabase
    .from('crypto_holdings')
    .update({ name: data.name, symbol: data.symbol, quantity: data.quantity, purchase_price: data.purchase_price })
    .eq('id', holdingId);
  if (error) throw error;
}

export async function updateStockHolding(holdingId: string, data: Partial<StockHolding>) {
  const { error } = await supabase
    .from('stock_holdings')
    .update({ name: data.name, symbol: data.symbol, shares: data.shares, purchase_price: data.purchase_price })
    .eq('id', holdingId);
  if (error) throw error;
}

export async function updateBill(billId: string, data: Partial<Bill>) {
  const { error } = await supabase
    .from('bills')
    .update({ name: data.name, amount: data.amount, frequency: data.frequency })
    .eq('id', billId);
  if (error) throw error;
}


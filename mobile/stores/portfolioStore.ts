/**
 * Portfolio Store — Global state management with Zustand
 */
import { create } from 'zustand';
import { PortfolioSummary, BankAccount, CryptoHolding, StockHolding, Bill } from '@/types';
import * as portfolioService from '@/services/portfolio';

interface PortfolioState {
  // Data
  summary: PortfolioSummary | null;
  bankAccounts: BankAccount[];
  cryptoHoldings: CryptoHolding[];
  stockHoldings: StockHolding[];
  bills: Bill[];

  // Loading states
  loading: boolean;
  refreshing: boolean;

  // Actions
  loadPortfolio: (userId: string) => Promise<void>;
  refreshPortfolio: (userId: string) => Promise<void>;
  addBankAccount: (userId: string, data: Partial<BankAccount>) => Promise<void>;
  addCryptoHolding: (userId: string, data: Partial<CryptoHolding>) => Promise<void>;
  addStockHolding: (userId: string, data: Partial<StockHolding>) => Promise<void>;
  addBill: (userId: string, data: Partial<Bill>) => Promise<void>;
  updateBankAccount: (userId: string, id: string, data: Partial<BankAccount>) => Promise<void>;
  updateCryptoHolding: (userId: string, id: string, data: Partial<CryptoHolding>) => Promise<void>;
  updateStockHolding: (userId: string, id: string, data: Partial<StockHolding>) => Promise<void>;
  updateBill: (userId: string, id: string, data: Partial<Bill>) => Promise<void>;
  deleteAsset: (table: string, assetId: string, userId: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  summary: null,
  bankAccounts: [],
  cryptoHoldings: [],
  stockHoldings: [],
  bills: [],
  loading: true,
  refreshing: false,

  loadPortfolio: async (userId: string) => {
    set({ loading: true });
    try {
      const [summary, bankAccounts, cryptoHoldings, stockHoldings, bills] =
        await Promise.all([
          portfolioService.getPortfolioSummary(userId),
          portfolioService.getBankAccounts(userId),
          portfolioService.getCryptoHoldings(userId),
          portfolioService.getStockHoldings(userId),
          portfolioService.getBills(userId),
        ]);

      set({ summary, bankAccounts, cryptoHoldings, stockHoldings, bills, loading: false });
    } catch (error) {
      console.error('Failed to load portfolio:', error);
      set({ loading: false });
    }
  },

  refreshPortfolio: async (userId: string) => {
    set({ refreshing: true });
    await get().loadPortfolio(userId);
    set({ refreshing: false });
  },

  addBankAccount: async (userId, data) => {
    await portfolioService.addBankAccount(userId, data);
    await get().loadPortfolio(userId);
  },

  addCryptoHolding: async (userId, data) => {
    await portfolioService.addCryptoHolding(userId, data);
    await get().loadPortfolio(userId);
  },

  addStockHolding: async (userId, data) => {
    await portfolioService.addStockHolding(userId, data);
    await get().loadPortfolio(userId);
  },

  addBill: async (userId, data) => {
    await portfolioService.addBill(userId, data);
    await get().loadPortfolio(userId);
  },

  deleteAsset: async (table, assetId, userId) => {
    await portfolioService.deleteAsset(table, assetId);
    await get().loadPortfolio(userId);
  },

  updateBankAccount: async (userId, id, data) => {
    await portfolioService.updateBankAccount(id, data);
    await get().loadPortfolio(userId);
  },

  updateCryptoHolding: async (userId, id, data) => {
    await portfolioService.updateCryptoHolding(id, data);
    await get().loadPortfolio(userId);
  },

  updateStockHolding: async (userId, id, data) => {
    await portfolioService.updateStockHolding(id, data);
    await get().loadPortfolio(userId);
  },

  updateBill: async (userId, id, data) => {
    await portfolioService.updateBill(id, data);
    await get().loadPortfolio(userId);
  },
}));

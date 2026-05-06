/**
 * Settings Store — Global user preferences shared across all screens
 */
import { create } from 'zustand';

interface SettingsState {
  currency: string;
  setCurrency: (currency: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: 'USD',
  setCurrency: (currency) => set({ currency }),
}));

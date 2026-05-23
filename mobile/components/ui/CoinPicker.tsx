/**
 * CoinPicker — Searchable dropdown for selecting a cryptocurrency.
 * Filters a built-in list of top coins. On selection, surfaces
 * { name, coinId, symbol } back to the parent via onSelect.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

export interface CoinOption {
  name: string;
  coinId: string;
  symbol: string;
}

// ─── Top coins list ─────────────────────────────────────────────
// Add more here as needed — coinId must match CoinGecko slug.
const TOP_COINS: CoinOption[] = [
  { name: 'Bitcoin',        coinId: 'bitcoin',          symbol: 'BTC' },
  { name: 'Ethereum',       coinId: 'ethereum',         symbol: 'ETH' },
  { name: 'Tether',         coinId: 'tether',           symbol: 'USDT' },
  { name: 'BNB',            coinId: 'binancecoin',      symbol: 'BNB' },
  { name: 'Solana',         coinId: 'solana',           symbol: 'SOL' },
  { name: 'XRP',            coinId: 'ripple',           symbol: 'XRP' },
  { name: 'USD Coin',       coinId: 'usd-coin',         symbol: 'USDC' },
  { name: 'Cardano',        coinId: 'cardano',          symbol: 'ADA' },
  { name: 'Avalanche',      coinId: 'avalanche-2',      symbol: 'AVAX' },
  { name: 'Dogecoin',       coinId: 'dogecoin',         symbol: 'DOGE' },
  { name: 'Polkadot',       coinId: 'polkadot',         symbol: 'DOT' },
  { name: 'Chainlink',      coinId: 'chainlink',        symbol: 'LINK' },
  { name: 'Shiba Inu',      coinId: 'shiba-inu',        symbol: 'SHIB' },
  { name: 'Litecoin',       coinId: 'litecoin',         symbol: 'LTC' },
  { name: 'Bitcoin Cash',   coinId: 'bitcoin-cash',     symbol: 'BCH' },
  { name: 'Stellar',        coinId: 'stellar',          symbol: 'XLM' },
  { name: 'Uniswap',        coinId: 'uniswap',          symbol: 'UNI' },
  { name: 'Monero',         coinId: 'monero',           symbol: 'XMR' },
  { name: 'Cosmos',         coinId: 'cosmos',           symbol: 'ATOM' },
  { name: 'Ethereum Classic',coinId:'ethereum-classic', symbol: 'ETC' },
  { name: 'Filecoin',       coinId: 'filecoin',         symbol: 'FIL' },
  { name: 'Hedera',         coinId: 'hedera-hashgraph', symbol: 'HBAR' },
  { name: 'Aptos',          coinId: 'aptos',            symbol: 'APT' },
  { name: 'Arbitrum',       coinId: 'arbitrum',         symbol: 'ARB' },
  { name: 'Optimism',       coinId: 'optimism',         symbol: 'OP' },
  { name: 'Near Protocol',  coinId: 'near',             symbol: 'NEAR' },
  { name: 'Injective',      coinId: 'injective-protocol',symbol:'INJ' },
  { name: 'Sui',            coinId: 'sui',              symbol: 'SUI' },
  { name: 'Tron',           coinId: 'tron',             symbol: 'TRX' },
  { name: 'Pepe',           coinId: 'pepe',             symbol: 'PEPE' },
];

interface CoinPickerProps {
  selected: CoinOption | null;
  onSelect: (coin: CoinOption) => void;
}

export function CoinPicker({ selected, onSelect }: CoinPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return TOP_COINS;
    return TOP_COINS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.coinId.toLowerCase().includes(q),
    );
  }, [query]);

  const handleSelect = (coin: CoinOption) => {
    onSelect(coin);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onSelect({ name: '', coinId: '', symbol: '' });
    setQuery('');
    setOpen(true);
  };

  return (
    <View style={styles.wrapper}>
      {/* Trigger / selected display */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.75}
      >
        <Ionicons
          name="logo-bitcoin"
          size={18}
          color={Colors.textSecondary}
          style={styles.triggerIcon}
        />
        <Text style={[styles.triggerText, !selected?.name && styles.placeholder]}>
          {selected?.name || 'Select a coin'}
        </Text>
        {selected?.name ? (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        ) : (
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textTertiary}
          />
        )}
      </TouchableOpacity>

      {/* Selected coin badge row */}
      {selected?.name ? (
        <View style={styles.badge}>
          <Text style={styles.badgeSymbol}>{selected.symbol}</Text>
          <Text style={styles.badgeId}>{selected.coinId}</Text>
        </View>
      ) : null}

      {/* Dropdown */}
      {open && (
        <View style={styles.dropdown}>
          {/* Search input */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search coins..."
              placeholderTextColor={Colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.coinId}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.65}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowId}>{item.coinId}</Text>
                </View>
                <Text style={styles.rowSymbol}>{item.symbol}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No coins found</Text>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },

  // Trigger button
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  triggerIcon: {
    marginRight: Spacing.md,
  },
  triggerText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  placeholder: {
    color: Colors.textTertiary,
  },

  // Selected info badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  badgeSymbol: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  badgeId: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },

  // Dropdown panel
  dropdown: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    maxHeight: 280,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowLeft: {
    flex: 1,
  },
  rowName: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  rowId: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  rowSymbol: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginLeft: Spacing.md,
  },
  empty: {
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    padding: Spacing.xl,
  },
});

/**
 * Markets Screen — Crypto & stock market data
 * Matches the second reference image (market list with sparklines)
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMarketData, getTopGainers, getGlobalMarketData } from '@/services/coingecko';
import { SparklineChart } from '@/components/ui/SparklineChart';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { SkeletonMarketList } from '@/components/ui/Skeleton';
import Svg, { Path } from 'react-native-svg';
import { GlassCard } from '@/components/ui/GlassCard';
import { CoinMarketData } from '@/types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

type FilterType = 'all' | 'gainers' | 'losers';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatPrice(price: number): string {
  if (price >= 1) {
    return '$' + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '$' + price.toFixed(6);
}

function formatPercent(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

// ─── Trend Bar — replaces sparkline for CMC free tier ───────
function TrendBar({ changePercent }: { changePercent: number }) {
  const isUp = changePercent >= 0;
  // Clamp bar fill to 5–95% based on magnitude (max 20% = full bar)
  const magnitude = Math.min(Math.abs(changePercent) / 20, 1);
  const fillPct = 0.05 + magnitude * 0.9;
  const barW = 64;
  const barH = 28;
  const midY = barH / 2;

  // Draw a simple diagonal line + filled accent area
  const x1 = isUp ? 0 : barW * fillPct;
  const x2 = isUp ? barW * fillPct : barW;
  const y1 = isUp ? barH - 4 : 4;
  const y2 = isUp ? 4 : barH - 4;

  return (
    <View style={{ width: barW, height: barH, justifyContent: 'center' }}>
      <Svg width={barW} height={barH}>
        {/* Background track */}
        <Path
          d={`M4,${midY} L${barW - 4},${midY}`}
          stroke={Colors.surfaceLight}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Trend line */}
        <Path
          d={`M${x1},${y1} L${x2},${y2}`}
          stroke={Colors.text}
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.7}
        />
        {/* Endpoint dot */}
        <Path
          d={`M${x2},${y2}`}
          stroke={Colors.text}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

// ─── Coin Row ───────────────────────────────────────────────
function CoinRow({ coin }: { coin: CoinMarketData }) {
  const isUp = coin.price_change_percentage_24h >= 0;

  return (
    <TouchableOpacity
      style={styles.coinRow}
      onPress={() => router.push({
        pathname: '/market/[id]',
        params: {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: coin.image,
          current_price: String(coin.current_price),
          market_cap: String(coin.market_cap),
          price_change_24h: String(coin.price_change_24h),
          price_change_percentage_24h: String(coin.price_change_percentage_24h),
          total_volume: String(coin.total_volume),
        },
      })}
      activeOpacity={0.6}
    >
      <View style={{ marginRight: Spacing.md }}>
        <CoinIcon symbol={coin.symbol} size={42} />
      </View>
      <View style={styles.coinInfo}>
        <Text style={styles.coinName}>{coin.name}</Text>
        <Text style={styles.coinSymbol}>{coin.symbol.toUpperCase()}</Text>
      </View>
      <View style={styles.sparkContainer}>
        {coin.sparkline_in_7d?.price?.length ? (
          <SparklineChart
            data={coin.sparkline_in_7d.price}
            width={70}
            height={28}
            showGradient
          />
        ) : (
          <TrendBar changePercent={coin.price_change_percentage_24h} />
        )}
      </View>
      <View style={styles.coinPriceCol}>
        <Text style={[styles.coinPrice, { color: isUp ? Colors.positive : Colors.negative }]}>
          {formatPrice(coin.current_price)}
        </Text>
        <Text style={[styles.changeText, isUp ? styles.changeTextUp : styles.changeTextDown]}>
          {formatPercent(coin.price_change_percentage_24h)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}


// ─── Main Markets Screen ────────────────────────────────────
export default function MarketsScreen() {
  const [coins, setCoins] = useState<CoinMarketData[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalData, setGlobalData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      // Stagger the two calls slightly to reduce rate-limit pressure
      const marketData = await getMarketData(1, 30, true);
      setCoins(marketData);
    } catch (err: any) {
      console.error('Failed to load market data:', err);
      setError(err?.message || 'Failed to load market data. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // Global market data is optional — don't block coins if it fails
    try {
      await new Promise((r) => setTimeout(r, 400));
      const global = await getGlobalMarketData();
      setGlobalData(global);
    } catch {
      // Non-critical — silently skip
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter coins
  const filteredCoins = coins.filter((coin) => {
    if (filter === 'gainers') return coin.price_change_percentage_24h > 0;
    if (filter === 'losers') return coin.price_change_percentage_24h < 0;
    return true;
  }).sort((a, b) => {
    if (filter === 'gainers') return b.price_change_percentage_24h - a.price_change_percentage_24h;
    if (filter === 'losers') return a.price_change_percentage_24h - b.price_change_percentage_24h;
    return 0;
  });

  const marketChange = globalData?.market_cap_change_percentage_24h_usd || 0;
  const isMarketUp = marketChange >= 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Sticky frosted header ── */}
      <View style={styles.stickyHeader}>
        <View style={[styles.header, { marginTop: Spacing.xl }]}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              Market is {isMarketUp ? 'up' : 'down'}
            </Text>
            <View style={[styles.marketBadge, isMarketUp ? styles.marketBadgeUp : styles.marketBadgeDown]}>
              <Ionicons
                name={isMarketUp ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={isMarketUp ? Colors.positive : Colors.negative}
              />
              <Text style={[styles.marketBadgeText, { color: isMarketUp ? Colors.positive : Colors.negative }]}>
                {Math.abs(marketChange).toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.filters}>
          {[
            { key: 'all', label: 'All assets' },
            { key: 'gainers', label: 'Top gainers' },
            { key: 'losers', label: 'Top losers' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setFilter(f.key as FilterType);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Scrollable coin list ── */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <SkeletonMarketList />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="wifi-outline" size={40} color={Colors.textTertiary} />
            <Text style={styles.errorTitle}>Couldn't load markets</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadData(); }}>
              <Ionicons name="refresh-outline" size={16} color={Colors.background} />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredCoins.length === 0 ? (
          <View style={styles.errorContainer}>
            <Ionicons name="search-outline" size={40} color={Colors.textTertiary} />
            <Text style={styles.errorTitle}>No coins found</Text>
            <Text style={styles.errorMsg}>Try switching to "All assets"</Text>
          </View>
        ) : (
          <View style={styles.coinList}>
            {filteredCoins.map((coin) => (
              <CoinRow key={coin.id} coin={coin} />
            ))}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 0,
    paddingHorizontal: Spacing.xl,
  },
  // Sticky frosted header
  stickyHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  // Header
  header: {
    marginBottom: Spacing.xxl,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  marketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  marketBadgeUp: {
    backgroundColor: Colors.positive + '15',
  },
  marketBadgeDown: {
    backgroundColor: Colors.negative + '15',
  },
  marketBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  // Filters
  filters: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  filterPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  filterTextActive: {
    color: Colors.background,
    fontWeight: FontWeight.semibold,
  },
  // Coin List
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  // Error / empty states
  errorContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  errorMsg: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.text,
  },
  retryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.background,
  },
  coinList: {
    gap: 0,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  coinImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
  },
  coinInfo: {
    flex: 1,
  },
  coinName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  coinSymbol: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sparkContainer: {
    marginRight: Spacing.lg,
  },
  coinPriceCol: {
    alignItems: 'flex-end',
  },
  coinPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  changeBadgeUp: {
    backgroundColor: Colors.positive + '15',
  },
  changeBadgeDown: {
    backgroundColor: Colors.negative + '15',
  },
  changeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  changeTextUp: {
    color: Colors.positive,
  },
  changeTextDown: {
    color: Colors.negative,
  },
});

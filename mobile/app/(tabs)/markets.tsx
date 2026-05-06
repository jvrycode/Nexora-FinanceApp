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
} from 'react-native';
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

  const loadData = useCallback(async () => {
    try {
      const [marketData, global] = await Promise.all([
        getMarketData(1, 30, true),
        getGlobalMarketData(),
      ]);
      setCoins(marketData);
      setGlobalData(global);
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        {/* Header — matching reference "In the past 24 hours / Market is up" */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>In the past 24 hours</Text>
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
                {Math.abs(marketChange).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Filter pills — matching reference [All assets] [Top gainers] */}
        <View style={styles.filters}>
          {[
            { key: 'all', label: 'All assets' },
            { key: 'gainers', label: 'Top gainers' },
            { key: 'losers', label: 'Top losers' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
              onPress={() => setFilter(f.key as FilterType)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.filterText, filter === f.key && styles.filterTextActive]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coin List */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <SkeletonMarketList />
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
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
    paddingVertical: 60,
    alignItems: 'center',
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

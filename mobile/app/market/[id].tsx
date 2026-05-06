/**
 * Market Detail — Coin detail with price chart
 * Uses data passed from the markets list to render immediately,
 * then loads chart data from CoinGecko.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCoinDetail, getCoinChart } from '@/services/coingecko';
import { PriceChart } from '@/components/ui/PriceChart';
import { GlassCard } from '@/components/ui/GlassCard';
import { ChartDataPoint } from '@/types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

const TIME_RANGES = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 'max' as const },
];

function fmt(n: number, dec = 2) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.statRow}>
      <Text style={st.statLabel}>{label}</Text>
      <Text style={st.statValue}>{value}</Text>
    </View>
  );
}

export default function MarketDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    symbol: string;
    image: string;
    current_price: string;
    market_cap: string;
    price_change_24h: string;
    price_change_percentage_24h: string;
    total_volume: string;
  }>();

  const id = params.id;

  // Build initial coin data from route params (renders instantly)
  const price = parseFloat(params.current_price || '0');
  const change24h = parseFloat(params.price_change_24h || '0');
  const changePct = parseFloat(params.price_change_percentage_24h || '0');
  const marketCap = parseFloat(params.market_cap || '0');
  const volume = parseFloat(params.total_volume || '0');
  const symbol = params.symbol || '';
  const name = params.name || '';
  const isUp = changePct >= 0;

  // Enriched detail (loaded from API if available)
  const [detail, setDetail] = useState<any>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(1); // default 1W

  useEffect(() => {
    if (!id) return;
    // Try to load enriched detail — non-blocking, UI already has data from params
    loadDetail();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadChart(TIME_RANGES[selectedRange].days);
  }, [id, selectedRange]);

  const loadDetail = async () => {
    try {
      const data = await getCoinDetail(id!);
      setDetail(data);
    } catch (e) {
      // Not critical — we already have basic data from route params
      console.warn('Could not load enriched detail:', e);
    }
  };

  const loadChart = async (days: number | string) => {
    setChartLoading(true);
    try {
      const data = await getCoinChart(id!, days);
      setChartData(data);
    } catch (e) {
      console.warn('Could not load chart:', e);
    }
    setChartLoading(false);
  };

  // Use enriched data if available, otherwise fall back to route params
  const md = detail?.market_data;
  const displayPrice = md?.current_price?.usd ?? price;
  const displayChange24h = md?.price_change_24h ?? change24h;
  const displayChangePct = md?.price_change_percentage_24h ?? changePct;
  const displayMarketCap = md?.market_cap?.usd ?? marketCap;
  const displayVolume = md?.total_volume?.usd ?? volume;
  const displayHigh24h = md?.high_24h?.usd;
  const displayLow24h = md?.low_24h?.usd;
  const displayAth = md?.ath?.usd;
  const displayAtl = md?.atl?.usd;
  const displayIsUp = displayChangePct >= 0;

  // If we have no ID and no name, the coin truly wasn't found
  if (!id && !name) {
    return <View style={st.loader}><Text style={{ color: Colors.textSecondary }}>Coin not found</Text></View>;
  }

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={st.headerTitle}>{symbol.toUpperCase() || '...'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Price */}
        <View style={st.priceSection}>
          <Text style={[st.priceLine, { color: displayIsUp ? Colors.positive : Colors.negative }]}>
            {fmt(displayPrice)}
          </Text>
          <View style={st.changeRow}>
            <Ionicons name={displayIsUp ? 'arrow-up' : 'arrow-down'} size={14} color={displayIsUp ? Colors.positive : Colors.negative} />
            <Text style={[st.changeText, { color: displayIsUp ? Colors.positive : Colors.negative }]}>
              {displayIsUp ? '+' : ''}{fmt(displayChange24h)} ({displayIsUp ? '+' : ''}{displayChangePct.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Chart */}
        <View style={st.chartContainer}>
          {chartLoading ? (
            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            </View>
          ) : chartData.length > 0 ? (
            <PriceChart data={chartData} />
          ) : (
            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: Colors.textTertiary, fontSize: FontSize.sm }}>Chart data unavailable — try again shortly</Text>
            </View>
          )}
        </View>

        {/* Time Range Selector */}
        <View style={st.timeRanges}>
          {TIME_RANGES.map((r, i) => (
            <TouchableOpacity
              key={r.label}
              style={[st.timeBtn, selectedRange === i && st.timeBtnActive]}
              onPress={() => setSelectedRange(i)}
            >
              <Text style={[st.timeText, selectedRange === i && st.timeTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Market Stats */}
        <GlassCard style={st.statsCard}>
          <Text style={st.statsTitle}>Market Stats</Text>
          <StatRow label="Market Cap" value={fmt(displayMarketCap)} />
          <StatRow label="24h Volume" value={fmt(displayVolume)} />
          {displayHigh24h != null && <StatRow label="24h High" value={fmt(displayHigh24h)} />}
          {displayLow24h != null && <StatRow label="24h Low" value={fmt(displayLow24h)} />}
          {displayAth != null && <StatRow label="All-Time High" value={fmt(displayAth)} />}
          {displayAtl != null && <StatRow label="All-Time Low" value={fmt(displayAtl, 6)} />}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xxl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  priceSection: { marginBottom: Spacing.xxl },
  priceLine: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.xs },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  chartContainer: { marginBottom: Spacing.lg, marginHorizontal: -Spacing.xl, paddingHorizontal: Spacing.xl },
  timeRanges: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xxl, gap: Spacing.sm },
  timeBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, flex: 1, alignItems: 'center', backgroundColor: Colors.surfaceElevated },
  timeBtnActive: { backgroundColor: Colors.text },
  timeText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  timeTextActive: { color: Colors.background, fontWeight: FontWeight.semibold },
  statsCard: { marginBottom: Spacing.lg },
  statsTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.lg },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.surfaceLight },
  statLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
  statValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold },
});

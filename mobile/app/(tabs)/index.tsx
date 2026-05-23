/**
 * Dashboard Screen — Net worth overview with live auto-refresh,
 * sparkline trend, last-updated timestamp, empty states.
 */
import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { BankCard, CARD_WIDTH } from '@/components/ui/BankCard';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');
const AUTO_REFRESH_MS = 60_000; // 60 seconds

function formatCurrency(amount: number, currencyCode = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, minimumFractionDigits: 2 }).format(amount);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}



// ─── Full-width gradient area chart ─────────────────────────
function NetWorthChart({ history: rawHistory, isUp, width: w, height: h = 80 }: {
  history: number[]; isUp: boolean; width: number; height?: number;
}) {
  if (rawHistory.length === 0) return <View style={{ height: h }} />;

  const history = rawHistory.length === 1 ? [rawHistory[0], rawHistory[0]] : rawHistory;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max === min ? 1 : max - min;
  const pad = 4;
  const pts = history.map((v, i) => {
    const yRatio = max === min ? 0.5 : (v - min) / range;
    return {
      x: (i / (history.length - 1)) * w,
      y: pad + (h - pad * 2) - yRatio * (h - pad * 2),
    };
  });
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L${w},${h} L0,${h} Z`;
  const color = isUp ? Colors.positive : Colors.negative;
  const gradId = isUp ? 'nwGradUp' : 'nwGradDown';
  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.15" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={fillPath} fill={`url(#${gradId})`} />
      {/* Glow layers */}
      <Path d={linePath} fill="none" stroke={color} strokeWidth={8} strokeOpacity={0.15} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={linePath} fill="none" stroke={color} strokeWidth={4} strokeOpacity={0.3} strokeLinecap="round" strokeLinejoin="round" />
      {/* Core line */}
      <Path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Quick Action ────────────────────────────────────────────
function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    onPress();
  };
  return (
    <TouchableOpacity style={styles.quickAction} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={22} color={Colors.text} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Asset Row ───────────────────────────────────────────────
function AssetRow({ icon, iconColor, name, subtitle, amount, onPress, onDelete }: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  name: string;
  subtitle?: string;
  amount: number;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const isNegative = amount < 0;
  const handlePress = () => {
    Haptics.selectionAsync().catch(() => { });
    onPress?.();
  };
  const row = (
    <TouchableOpacity style={styles.assetRow} onPress={handlePress} activeOpacity={0.6} disabled={!onPress}>
      <View style={[styles.assetIcon, { backgroundColor: (iconColor || Colors.accent) + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor || Colors.accent} />
      </View>
      <View style={styles.assetInfo}>
        <Text style={styles.assetName}>{name}</Text>
        {subtitle && <Text style={styles.assetSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={[styles.assetAmount, isNegative && { color: Colors.negative }]}>
        {formatCurrency(amount)}
      </Text>
      {onPress && <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} style={{ marginLeft: 6 }} />}
    </TouchableOpacity>
  );

  if (onDelete) {
    return <SwipeableRow onDelete={onDelete}>{row}</SwipeableRow>;
  }
  return row;
}

// ─── Empty State ─────────────────────────────────────────────
function EmptyState({ message, onAdd, addLabel }: { message: string; onAdd: () => void; addLabel: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="add-circle-outline" size={28} color={Colors.textTertiary} />
      <Text style={styles.emptyText}>{message}</Text>
      <TouchableOpacity style={styles.emptyAddBtn} onPress={onAdd}>
        <Text style={styles.emptyAddText}>{addLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Section ─────────────────────────────────────────────────
function Section({ title, total, children, isNegative, currency = 'USD' }: {
  title: string; total: number; children: React.ReactNode; isNegative?: boolean; currency?: string;
}) {
  return (
    <GlassCard style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={[styles.sectionTotal, isNegative && total > 0 && { color: Colors.negative }]}>
          {isNegative && total > 0 ? '-' : ''}{formatCurrency(Math.abs(total), currency)}
        </Text>
      </View>
      {children}
    </GlassCard>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────
export default function DashboardScreen() {
  const { user } = useAuth();
  const { summary, bankAccounts, cryptoHoldings, stockHoldings, bills, loading, refreshing, loadPortfolio, refreshPortfolio, deleteAsset } = usePortfolioStore();
  const { currency } = useSettingsStore();

  const [showChartModal, setShowChartModal] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'1W' | '1M' | '3M' | 'ALL'>('1M');
  const [netWorthHistory, setNetWorthHistory] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doRefresh = useCallback(async () => {
    if (!user?.id) return;
    await loadPortfolio(user.id);
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    if (user?.id) doRefresh();
  }, [user?.id]);

  // Auto-refresh every 60s
  useEffect(() => {
    timerRef.current = setInterval(doRefresh, AUTO_REFRESH_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [doRefresh]);


  // Build net worth history for sparkline (accumulate snapshots)
  useEffect(() => {
    if (summary?.totalNetWorth != null) {
      setNetWorthHistory(prev => {
        const next = [...prev, summary.totalNetWorth].slice(-20); // keep last 20 snapshots
        return next;
      });
    }
  }, [summary?.totalNetWorth]);

  const onRefresh = useCallback(() => {
    if (user?.id) refreshPortfolio(user.id);
  }, [user?.id]);

  const handleAddAsset = (category?: string) => {
    router.push({ pathname: '/add-asset', params: { category: category || 'bank' } });
  };

  const userName = user?.user_metadata?.full_name || 'User';
  const isUp = (summary?.changePercent ?? 0) >= 0;
  const netWorthIsUp = netWorthHistory.length >= 2
    ? netWorthHistory[netWorthHistory.length - 1] >= netWorthHistory[0]
    : true;

  const maxNetWorth = netWorthHistory.length > 0 ? Math.max(...netWorthHistory) : 0;
  const minNetWorth = netWorthHistory.length > 0 ? Math.min(...netWorthHistory) : 0;
  const dollarChange = netWorthHistory.length > 1 ? netWorthHistory[netWorthHistory.length - 1] - netWorthHistory[0] : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.text} colors={[Colors.text]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}, {userName.split(' ')[0]}.</Text>
        </View>

        {loading && !summary ? (
          <SkeletonDashboard />
        ) : (
          <>
            {/* Net Worth Card — tap to expand */}
            <TouchableOpacity activeOpacity={0.92} onPress={() => setShowChartModal(true)} style={{ marginBottom: Spacing.xxl }}>
              <GlassCard variant="accent" style={styles.netWorthCard}>
                <Text style={styles.netWorthLabel}>Total Net Worth</Text>
                <AnimatedNumber value={summary?.totalNetWorth || 0} style={styles.netWorthAmount} />

                {/* Change badge */}
                {summary && (
                  <View style={[styles.changeBadge, { backgroundColor: (netWorthIsUp ? Colors.positive : Colors.negative) + '20' }]}>
                    <Ionicons
                      name={netWorthIsUp ? 'arrow-up' : 'arrow-down'}
                      size={11}
                      color={netWorthIsUp ? Colors.positive : Colors.negative}
                    />
                    <Text style={[styles.changeText, { color: netWorthIsUp ? Colors.positive : Colors.negative }]}>
                      {summary.changePercent !== 0 ? `${Math.abs(summary.changePercent).toFixed(1)}%` : 'No change'} this month
                    </Text>
                  </View>
                )}

                {/* Full-width area chart */}
                <View style={styles.chartWrapper}>
                  <NetWorthChart history={netWorthHistory} isUp={netWorthIsUp} width={width - 80} height={80} />
                </View>

                <Text style={styles.tapHint}>Tap to expand</Text>
              </GlassCard>
            </TouchableOpacity>

            {/* Full-screen chart modal */}
            <Modal visible={showChartModal} animationType="slide" transparent={true}>
              <BlurView intensity={90} tint="dark" style={styles.modalBg}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Net Worth History</Text>
                  <TouchableOpacity onPress={() => setShowChartModal(false)}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalNetWorth}>
                  {formatCurrency(summary?.totalNetWorth || 0, currency)}
                </Text>
                <View style={[styles.changeBadge, { alignSelf: 'center', marginBottom: Spacing.xl, backgroundColor: (netWorthIsUp ? Colors.positive : Colors.negative) + '20' }]}>
                  <Ionicons name={netWorthIsUp ? 'arrow-up' : 'arrow-down'} size={11} color={netWorthIsUp ? Colors.positive : Colors.negative} />
                  <Text style={[styles.changeText, { color: netWorthIsUp ? Colors.positive : Colors.negative }]}>
                    {summary?.changePercent !== 0 ? `${Math.abs(summary?.changePercent ?? 0).toFixed(1)}%` : 'No change'} this month
                  </Text>
                </View>

                <View style={styles.fullChartWrapper}>
                  <NetWorthChart history={netWorthHistory} isUp={netWorthIsUp} width={width - 40} height={200} />
                </View>

                {/* Time filters */}
                <View style={styles.timeFilters}>
                  {(['1W', '1M', '3M', 'ALL'] as const).map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filterPill, timeFilter === f && styles.filterPillActive]}
                      onPress={() => setTimeFilter(f)}
                    >
                      <Text style={[styles.filterText, timeFilter === f && styles.filterTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Quick Stats Row */}
                {netWorthHistory.length > 0 && (
                  <View style={styles.chartStatsRow}>
                    <View style={styles.chartStatItem}>
                      <Text style={styles.chartStatLabel}>Highest</Text>
                      <Text style={styles.chartStatValue}>{formatCurrency(maxNetWorth, currency)}</Text>
                    </View>
                    <View style={styles.chartStatDivider} />
                    <View style={styles.chartStatItem}>
                      <Text style={styles.chartStatLabel}>Lowest</Text>
                      <Text style={styles.chartStatValue}>{formatCurrency(minNetWorth, currency)}</Text>
                    </View>
                    <View style={styles.chartStatDivider} />
                    <View style={styles.chartStatItem}>
                      <Text style={styles.chartStatLabel}>Change</Text>
                      <Text style={[styles.chartStatValue, { color: dollarChange >= 0 ? Colors.positive : Colors.negative }]}>
                        {dollarChange >= 0 ? '+' : ''}{formatCurrency(dollarChange, currency)}
                      </Text>
                    </View>
                  </View>
                )}
              </BlurView>
            </Modal>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <QuickAction icon="add-circle-outline" label="Add" onPress={() => handleAddAsset()} />
              <QuickAction icon="trending-up-outline" label="Markets" onPress={() => router.push('/(tabs)/markets')} />
              <QuickAction icon="chatbubble-outline" label="AI Chat" onPress={() => router.push('/(tabs)/chat')} />
            </View>

            {/* Bank Accounts */}
            <GlassCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bank Accounts</Text>
                <Text style={styles.sectionTotal}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2 }).format(summary?.totalAssets || 0)}</Text>
              </View>
              {bankAccounts.length === 0 ? (
                <EmptyState message="No bank accounts added yet" onAdd={() => handleAddAsset('bank')} addLabel="+ Add Account" />
              ) : (
                <>
                  {/* Horizontal card carousel */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardCarousel}
                    decelerationRate="fast"
                    snapToInterval={CARD_WIDTH + 16}
                    snapToAlignment="start"
                    style={styles.carouselScroll}
                  >
                    {bankAccounts.map((acc) => (
                      <BankCard
                        key={acc.id}
                        bankName={acc.bank_name}
                        accountName={acc.account_name || ''}
                        balance={Number(acc.balance)}
                        onPress={() => router.push({ pathname: '/edit-asset', params: { category: 'bank', id: acc.id, bank_name: acc.bank_name, account_name: acc.account_name || '', balance: String(acc.balance) } })}
                        onDelete={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { }); deleteAsset('bank_accounts', acc.id, user!.id); }}
                      />
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={[styles.addRow, { marginTop: Spacing.md }]} onPress={() => handleAddAsset('bank')}>
                    <Ionicons name="add" size={18} color={Colors.accent} />
                    <Text style={styles.addRowText}>Add Account</Text>
                  </TouchableOpacity>
                </>
              )}
            </GlassCard>

            {/* Crypto */}
            <Section title="Crypto" total={summary?.totalCrypto || 0} currency={currency}>
              {cryptoHoldings.length === 0 ? (
                <EmptyState message="No crypto holdings added yet" onAdd={() => handleAddAsset('crypto')} addLabel="+ Add Crypto" />
              ) : (
                <>
                  {cryptoHoldings.map((holding) => (
                    <AssetRow
                      key={holding.id}
                      icon="logo-bitcoin"
                      iconColor={Colors.bitcoin}
                      name={holding.name}
                      subtitle={`${holding.quantity} ${holding.symbol.toUpperCase()}`}
                      amount={Number(holding.quantity) * (Number(holding.purchase_price) || 0)}
                      onPress={() => router.push({ pathname: '/edit-asset', params: { category: 'crypto', id: holding.id, coin_name: holding.name, coin_id: holding.coin_id, coin_symbol: holding.symbol, quantity: String(holding.quantity), purchase_price: String(holding.purchase_price || '') } })}
                      onDelete={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { }); deleteAsset('crypto_holdings', holding.id, user!.id); }}
                    />
                  ))}
                  <TouchableOpacity style={styles.addRow} onPress={() => handleAddAsset('crypto')}>
                    <Ionicons name="add" size={18} color={Colors.accent} />
                    <Text style={styles.addRowText}>Add Crypto</Text>
                  </TouchableOpacity>
                </>
              )}
            </Section>

            {/* Stocks */}
            <Section title="Stocks" total={summary?.totalStocks || 0} currency={currency}>
              {stockHoldings.length === 0 ? (
                <EmptyState message="No stock holdings added yet" onAdd={() => handleAddAsset('stock')} addLabel="+ Add Stock" />
              ) : (
                <>
                  {stockHoldings.map((holding) => (
                    <AssetRow
                      key={holding.id}
                      icon="stats-chart-outline"
                      iconColor={Colors.textSecondary}
                      name={holding.name}
                      subtitle={`${holding.shares} shares • ${holding.symbol}`}
                      amount={Number(holding.shares) * (Number(holding.purchase_price) || 0)}
                      onPress={() => router.push({ pathname: '/edit-asset', params: { category: 'stock', id: holding.id, stock_symbol: holding.symbol, stock_name: holding.name, shares: String(holding.shares), purchase_price: String(holding.purchase_price || '') } })}
                      onDelete={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { }); deleteAsset('stock_holdings', holding.id, user!.id); }}
                    />
                  ))}
                  <TouchableOpacity style={styles.addRow} onPress={() => handleAddAsset('stock')}>
                    <Ionicons name="add" size={18} color={Colors.accent} />
                    <Text style={styles.addRowText}>Add Stock</Text>
                  </TouchableOpacity>
                </>
              )}
            </Section>

            {/* Bills & Liabilities */}
            <Section title="Bills & Liabilities" total={summary?.totalLiabilities || 0} isNegative currency={currency}>
              {bills.length === 0 ? (
                <EmptyState message="No bills or liabilities added yet" onAdd={() => handleAddAsset('bill')} addLabel="+ Add Bill" />
              ) : (
                <>
                  {bills.map((bill) => (
                    <AssetRow
                      key={bill.id}
                      icon="receipt-outline"
                      iconColor={Colors.negative}
                      name={bill.name}
                      subtitle={bill.frequency}
                      amount={-Number(bill.amount)}
                      onPress={() => router.push({ pathname: '/edit-asset', params: { category: 'bill', id: bill.id, bill_name: bill.name, bill_amount: String(bill.amount), frequency: bill.frequency || 'monthly' } })}
                      onDelete={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { }); deleteAsset('bills', bill.id, user!.id); }}
                    />
                  ))}
                  <TouchableOpacity style={styles.addRow} onPress={() => handleAddAsset('bill')}>
                    <Ionicons name="add" size={18} color={Colors.accent} />
                    <Text style={styles.addRowText}>Add Bill</Text>
                  </TouchableOpacity>
                </>
              )}
            </Section>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xxl },
  greeting: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, letterSpacing: -0.5 },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  // Net Worth Card
  netWorthCard: { alignItems: 'center', paddingTop: Spacing.xxxl, paddingBottom: Spacing.lg, paddingHorizontal: 0, overflow: 'hidden' },
  netWorthLabel: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium, backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: Spacing.md },
  netWorthAmount: { fontSize: FontSize.hero, fontWeight: FontWeight.bold, color: Colors.text, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  netWorthBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: BorderRadius.full, marginTop: Spacing.sm, alignSelf: 'center' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  chartWrapper: { width: '100%', marginTop: Spacing.xl, paddingHorizontal: Spacing.xl },
  tapHint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  dots: { flexDirection: 'row', gap: 6, marginTop: Spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textTertiary },
  dotActive: { backgroundColor: Colors.text, width: 18, borderRadius: 3 },
  // Full-screen modal
  modalBg: { flex: 1, paddingTop: Spacing.xxl + 40 }, // extra padding for full screen transparent
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  modalNetWorth: { fontSize: FontSize.hero, fontWeight: FontWeight.bold, color: Colors.text, letterSpacing: -1, textAlign: 'center', marginBottom: Spacing.sm },
  fullChartWrapper: { width: '100%', paddingHorizontal: Spacing.lg, marginBottom: Spacing.xxl },
  timeFilters: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  filterPill: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceElevated },
  filterPillActive: { backgroundColor: Colors.text },
  filterText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  filterTextActive: { color: Colors.background },
  // Quick Actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.xxl },
  quickAction: { alignItems: 'center', gap: Spacing.sm },
  quickActionIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  quickActionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  // Sections
  section: { marginBottom: Spacing.lg },
  carouselScroll: { marginHorizontal: -Spacing.xl },
  cardCarousel: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, paddingTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  sectionTotal: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, fontVariant: ['tabular-nums'] },
  // Asset Row
  assetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderTopWidth: 0, borderTopColor: 'transparent' },
  assetIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  assetInfo: { flex: 1 },
  assetName: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text },
  assetSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  assetAmount: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, fontVariant: ['tabular-nums'] },
  // Add Row
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderTopWidth: 0, borderTopColor: 'transparent' },
  addRowText: { fontSize: FontSize.md, color: Colors.accent, fontWeight: FontWeight.medium },
  // Empty State
  emptyState: { paddingVertical: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center' },
  emptyAddBtn: { marginTop: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceElevated },
  emptyAddText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },

  // Chart Stats
  chartStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  chartStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  chartStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartStatValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  chartStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

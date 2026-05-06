/**
 * Skeleton — Shimmer loading placeholder for premium loading states
 * Replaces blank screens with animated pulsing bars
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.surfaceElevated,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Pre-built skeleton layouts */

export function SkeletonCard() {
  return (
    <View style={skStyles.card}>
      <View style={skStyles.row}>
        <Skeleton width={40} height={40} borderRadius={12} />
        <View style={skStyles.textCol}>
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={11} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={70} height={14} />
      </View>
    </View>
  );
}

export function SkeletonNetWorth() {
  return (
    <View style={skStyles.netWorth}>
      <Skeleton width={120} height={14} borderRadius={20} />
      <Skeleton width={200} height={38} style={{ marginTop: 12 }} />
      <Skeleton width={100} height={12} style={{ marginTop: 12 }} />
    </View>
  );
}

export function SkeletonCoinRow() {
  return (
    <View style={skStyles.coinRow}>
      <Skeleton width={42} height={42} borderRadius={21} />
      <View style={skStyles.textCol}>
        <Skeleton width={90} height={14} />
        <Skeleton width={40} height={11} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={60} height={24} borderRadius={4} />
      <View style={{ alignItems: 'flex-end' }}>
        <Skeleton width={80} height={14} />
        <Skeleton width={50} height={11} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function SkeletonMarketList() {
  return (
    <View>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonCoinRow key={i} />
      ))}
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={skStyles.dashboard}>
      <SkeletonNetWorth />
      <View style={skStyles.quickActions}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ alignItems: 'center', gap: 8 }}>
            <Skeleton width={52} height={52} borderRadius={26} />
            <Skeleton width={36} height={10} />
          </View>
        ))}
      </View>
      {[1, 2].map((i) => (
        <View key={i} style={skStyles.section}>
          <View style={skStyles.sectionHeader}>
            <Skeleton width={120} height={16} />
            <Skeleton width={60} height={16} />
          </View>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  textCol: {
    flex: 1,
  },
  netWorth: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xxl,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xxl,
  },
  dashboard: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
});

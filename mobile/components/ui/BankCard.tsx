/**
 * BankCard — Ultra-clean minimalist dark card.
 * No icons, no clutter. Pure typography and material.
 */
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = Math.min(SCREEN_WIDTH - 80, 320);
const CARD_HEIGHT = CARD_WIDTH * 0.63;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface BankCardProps {
  bankName: string;
  accountName: string;
  balance: number;
  onPress?: () => void;
  onDelete?: () => void;
}

export function BankCard({ bankName, accountName, balance, onPress, onDelete }: BankCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.972, useNativeDriver: true, speed: 50, bounciness: 2 }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 4 }).start();

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        {/* Dark base */}
        <View style={styles.base} />

        {/* Satin sheen */}
        <Svg style={StyleSheet.absoluteFill as any} width="100%" height="100%">
          <Defs>
            <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#ffffff" stopOpacity="0.06" />
              <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
              <Stop offset="1" stopColor="#000000" stopOpacity="0.2" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#sheen)" />
        </Svg>

        {/* Card content */}
        <View style={styles.cardContent}>

          {/* Top — Bank name */}
          <View style={styles.topRow}>
            <Text style={styles.bankName}>{bankName.toUpperCase()}</Text>
          </View>

          {/* Middle — masked card number */}
          <Text style={styles.cardNumber}>••••   ••••   ••••   0101</Text>

          {/* Bottom — holder & balance */}
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.fieldLabel}>CARD HOLDER</Text>
              <Text style={styles.cardHolder} numberOfLines={1}>
                {(accountName || bankName).toUpperCase()}
              </Text>
            </View>
            <View style={styles.rightBlock}>
              <Text style={styles.fieldLabel}>BALANCE</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
            </View>
          </View>
        </View>

        {/* Delete button */}
        {onDelete && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.xxl,
    marginRight: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.75,
    shadowRadius: 22,
    elevation: 16,
  },
  touchable: {
    flex: 1,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111111',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 3,
  },
  cardNumber: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  rightBlock: {
    alignItems: 'flex-end',
  },
  fieldLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1.8,
    marginBottom: 4,
    fontWeight: FontWeight.medium,
  },
  cardHolder: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  deleteBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
});

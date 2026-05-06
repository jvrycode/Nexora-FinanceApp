/**
 * GlassCard — Glassmorphism-style card matching the dark premium UI
 */
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'accent';
  noPadding?: boolean;
}

export function GlassCard({ children, style, variant = 'default', noPadding }: GlassCardProps) {
  return (
    <BlurView
      intensity={30}
      tint="dark"
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'accent' && styles.accent,
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(17, 17, 17, 0.65)', // Partially transparent
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)', // Subtle glass edge highlight
  },
  elevated: {
    backgroundColor: 'rgba(26, 26, 26, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  accent: {
    backgroundColor: 'rgba(17, 17, 17, 0.5)',
  },
  noPadding: {
    padding: 0,
  },
});

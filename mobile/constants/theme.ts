/**
 * Nexora Finance — Premium Dark Theme
 * Inspired by the reference banking/crypto UI images
 */

export const Colors = {
  // Core backgrounds
  background: '#000000',
  surface: '#111111',
  surfaceElevated: '#1A1A1A',
  surfaceLight: '#222222',

  // Borders
  border: 'transparent',
  borderLight: 'transparent',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#7A7A7A',
  textMuted: '#555555',

  // Accent colors
  accent: '#FFFFFF',
  accentLight: '#E0E0E0',
  accentDark: '#CCCCCC',

  // Status colors — Green / Red for financial indicators
  positive: '#00C087',
  positiveLight: '#00C08720',
  negative: '#FF4D4F',
  negativeLight: '#FF4D4F20',

  // Special
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.8)',
  glassBg: 'rgba(255,255,255,0.06)',
  glassStroke: 'transparent',

  // Tab bar
  tabBarBg: '#000000',
  tabBarActive: '#FFFFFF',
  tabBarInactive: '#666666',

  // Chat
  chatBubbleUser: '#FFFFFF',
  chatBubbleAI: '#1A1A1A',

  // Crypto-specific (Grayscale)
  bitcoin: '#FFFFFF',
  ethereum: '#E0E0E0',
  tether: '#CCCCCC',
  xrp: '#FFFFFF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 42,
  giant: 56,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
};

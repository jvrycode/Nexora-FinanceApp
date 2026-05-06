/**
 * CoinIcon — Premium monochromatic crypto icons
 * Matches the reference design: clean white symbols on dark circular backgrounds.
 * Has built-in SVG icons for top cryptocurrencies.
 * Falls back to letter initials for unknown coins.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import { Colors, FontWeight } from '@/constants/theme';

interface CoinIconProps {
  symbol: string;
  imageUrl?: string;
  size?: number;
}

// ─── SVG icon paths for top cryptocurrencies ────────────────
// Each returns an SVG group scaled to a 24x24 viewBox
function CryptoSVG({ symbol, color, size }: { symbol: string; color: string; size: number }) {
  const s = size * 0.5; // icon area inside the circle
  const offset = (size - s) / 2;

  switch (symbol.toUpperCase()) {
    case 'BTC':
      // Bitcoin ₿ symbol
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path
            d="M24.5 11.2c1.8.8 3 2.2 2.7 4.5-.2 1.7-1.2 2.7-2.6 3.2 2.2.7 3.3 2.3 2.9 4.8-.5 3.2-2.9 4.1-6.2 4.4V31h-2v-2.8h-1.6V31h-2v-2.8H13v-2h1.2c.7 0 .8-.2.8-.8V17.8c0-.7-.3-.8-.9-.8H13v-2h3.3V12h2v2.9h1.6V12h2v2.1c2.4.2 4.2.9 4.6 3.1zM17.9 17v3.4h2.4c1.5 0 2.5-.4 2.6-1.7.2-1.4-.7-1.7-2.3-1.7h-2.7zm0 5.6v3.8h2.9c1.6 0 2.7-.4 2.8-1.9.2-1.6-.9-1.9-2.8-1.9h-2.9z"
            fill={color}
          />
        </Svg>
      );

    case 'ETH':
      // Ethereum diamond
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path d="M20 8l-8 12.5L20 24l8-3.5L20 8z" fill={color} opacity={0.9} />
          <Path d="M12 20.5L20 32l8-11.5-8 3.5-8-3.5z" fill={color} opacity={0.6} />
        </Svg>
      );

    case 'SOL':
      // Solana stacked lines
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path d="M11 27h14.5l3.5-3.5H14.5L11 27z" fill={color} />
          <Path d="M11 16.5L14.5 13H29l-3.5 3.5H11z" fill={color} />
          <Path d="M11 21.75h14.5L29 18.25H14.5L11 21.75z" fill={color} />
        </Svg>
      );

    case 'USDC':
      // Dollar sign in circle
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Circle cx={20} cy={20} r={10} stroke={color} strokeWidth={1.5} fill="none" />
          <Path
            d="M20 12v1.5M20 26.5V28M22.5 16.5c0-1.4-1.1-2.5-2.5-2.5s-2.5 1.1-2.5 2.5c0 1.4 1.1 2.5 2.5 2.5s2.5 1.1 2.5 2.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      );

    case 'USDT':
      // Tether T symbol
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path d="M13 14h14v3H13z" fill={color} />
          <Rect x={18.5} y={14} width={3} height={15} rx={1.5} fill={color} />
        </Svg>
      );

    case 'BNB':
      // Binance diamond
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path d="M20 10l3 3-3 3-3-3 3-3z" fill={color} />
          <Path d="M27 17l3 3-3 3-3-3 3-3z" fill={color} />
          <Path d="M13 17l3 3-3 3-3-3 3-3z" fill={color} />
          <Path d="M20 24l3 3-3 3-3-3 3-3z" fill={color} />
        </Svg>
      );

    case 'XRP':
      // XRP X shape
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path
            d="M14 12l4.5 5.5L20 19.5l1.5-2L26 12h3l-7.5 8.5L29 29h-3l-4.5-5.5L20 21.5l-1.5 2L14 29h-3l7.5-8.5L11 12h3z"
            fill={color}
          />
        </Svg>
      );

    case 'ADA':
      // Cardano simplified
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Circle cx={20} cy={14} r={2} fill={color} />
          <Circle cx={20} cy={26} r={2} fill={color} />
          <Circle cx={14} cy={17} r={1.5} fill={color} />
          <Circle cx={26} cy={17} r={1.5} fill={color} />
          <Circle cx={14} cy={23} r={1.5} fill={color} />
          <Circle cx={26} cy={23} r={1.5} fill={color} />
          <Circle cx={20} cy={20} r={3} stroke={color} strokeWidth={1.5} fill="none" />
        </Svg>
      );

    case 'DOGE':
      // Doge D
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path
            d="M15 12h5c5.5 0 8.5 3.5 8.5 8s-3 8-8.5 8h-5V12zm3 3v10h2c3.5 0 5.5-2.2 5.5-5s-2-5-5.5-5h-2z"
            fill={color}
          />
          <Path d="M14 19h10v2H14z" fill={color} />
        </Svg>
      );

    case 'TRX':
      // Tron triangle
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path d="M20 10L10 30h6l4-10 4 10h6L20 10z" fill={color} />
        </Svg>
      );

    case 'AVAX':
      // Avalanche A
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path d="M20 11L10 29h6l4-10 4 10h6L20 11z" fill={color} />
          <Path d="M17 25h6" stroke={color} strokeWidth={2} />
        </Svg>
      );

    case 'DOT':
      // Polkadot circles
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Circle cx={20} cy={12} r={3} fill={color} />
          <Circle cx={20} cy={28} r={3} fill={color} />
          <Circle cx={20} cy={20} r={4.5} fill="none" stroke={color} strokeWidth={2} />
        </Svg>
      );

    case 'MATIC':
    case 'POL':
      // Polygon
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path d="M25 16l5 3v6l-5 3-5-3v-6l5-3z" fill={color} opacity={0.8} />
          <Path d="M15 16l5 3v6l-5 3-5-3v-6l5-3z" fill={color} opacity={0.5} />
        </Svg>
      );

    case 'LINK':
      // Chainlink hexagon
      return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Path d="M20 10l8.66 5v10L20 30l-8.66-5V15L20 10z" fill="none" stroke={color} strokeWidth={2} />
          <Path d="M20 16l4.33 2.5v5L20 26l-4.33-2.5v-5L20 16z" fill={color} />
        </Svg>
      );

    default:
      return null;
  }
}

export function CoinIcon({ symbol, imageUrl, size = 40 }: CoinIconProps) {
  const letters = symbol.slice(0, 2).toUpperCase();
  const fontSize = size * 0.34;
  const iconColor = Colors.text;

  // Check if we have a built-in SVG icon
  const hasSvg = CryptoSVG({ symbol, color: iconColor, size }) !== null;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {hasSvg ? (
        <CryptoSVG symbol={symbol} color={iconColor} size={size} />
      ) : (
        <Text style={[styles.letters, { fontSize }]}>{letters}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letters: {
    color: Colors.text,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
  },
});

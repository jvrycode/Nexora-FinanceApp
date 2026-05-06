/**
 * SparklineChart — Mini sparkline chart for market list items
 * Matches the reference image's small charts next to crypto names
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { Colors } from '@/constants/theme';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showGradient?: boolean;
}

export function SparklineChart({
  data,
  width = 80,
  height = 32,
  color,
  showGradient = false,
}: SparklineChartProps) {
  if (!data || data.length < 2) return null;

  // Determine if trend is up or down
  const isUp = data[data.length - 1] >= data[0];
  const lineColor = color || (isUp ? Colors.positive : Colors.negative);

  // Normalize data to fit within bounds
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Create gradient fill path
  const firstPoint = data[0];
  const lastIndex = data.length - 1;
  const pathPoints = data.map((value, index) => {
    const x = (index / lastIndex) * (width - padding * 2) + padding;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const fillPath = `M${pathPoints[0].x},${pathPoints[0].y} ${pathPoints.map(p => `L${p.x},${p.y}`).join(' ')} L${pathPoints[lastIndex].x},${height} L${pathPoints[0].x},${height} Z`;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.3" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {showGradient && (
          <Path d={fillPath} fill="url(#sparkGradient)" />
        )}
        <Polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

/**
 * PriceChart — Interactive area chart with crosshair tooltip
 * Hover (web) or touch-drag (mobile) to see price at any point.
 */
import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Rect } from 'react-native-svg';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { ChartDataPoint } from '@/types';

interface PriceChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  color?: string;
}

function formatPrice(n: number): string {
  if (n >= 1) return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function PriceChart({
  data,
  width = Dimensions.get('window').width - 40,
  height = 220,
  color = Colors.accent,
}: PriceChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<View>(null);
  const layoutRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const chartData = useMemo(() => {
    if (!data || data.length < 2) return null;

    const prices = data.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const paddingY = 10;
    const chartHeight = height - paddingY * 2;

    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * width,
      y: paddingY + chartHeight - ((d.price - min) / range) * chartHeight,
      price: d.price,
      timestamp: d.timestamp,
    }));

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
      .join(' ');

    const fillPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

    return { points, linePath, fillPath, min, max };
  }, [data, width, height]);

  // Find the nearest data point to the cursor X position
  const findNearest = useCallback(
    (clientX: number) => {
      if (!chartData) return;
      const rect = layoutRef.current;
      const relX = clientX - rect.x;
      const ratio = Math.max(0, Math.min(1, relX / width));
      const idx = Math.round(ratio * (data.length - 1));
      setActiveIndex(idx);
    },
    [chartData, data.length, width]
  );

  const handleLayout = useCallback(() => {
    containerRef.current?.measureInWindow((x, y, w, h) => {
      layoutRef.current = { x, y, width: w, height: h };
    });
  }, []);

  // Web: mouse events
  const webHandlers = Platform.OS === 'web'
    ? {
        onMouseMove: (e: any) => findNearest(e.nativeEvent.pageX),
        onMouseLeave: () => setActiveIndex(null),
      }
    : {};

  // Mobile: touch events
  const touchHandlers = Platform.OS !== 'web'
    ? {
        onTouchStart: (e: any) => findNearest(e.nativeEvent.pageX),
        onTouchMove: (e: any) => findNearest(e.nativeEvent.pageX),
        onTouchEnd: () => setActiveIndex(null),
      }
    : {};

  if (!chartData) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noData}>No chart data available</Text>
      </View>
    );
  }

  const isUp = data[data.length - 1].price >= data[0].price;
  const chartColor = isUp ? Colors.positive : Colors.negative;
  const activePoint = activeIndex !== null ? chartData.points[activeIndex] : null;

  return (
    <View
      ref={containerRef}
      style={[styles.container, { width, height: height + 48 }]}
      onLayout={handleLayout}
      {...webHandlers}
      {...touchHandlers}
    >
      {/* Tooltip */}
      <View style={styles.tooltipRow}>
        {activePoint ? (
          <>
            <Text style={styles.tooltipPrice}>{formatPrice(activePoint.price)}</Text>
            <Text style={styles.tooltipDate}>{formatDate(activePoint.timestamp)}</Text>
          </>
        ) : (
          <Text style={styles.tooltipHint}>Hover or drag on the chart</Text>
        )}
      </View>

      {/* Chart SVG */}
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={chartColor} stopOpacity="0.3" />
            <Stop offset="0.6" stopColor={chartColor} stopOpacity="0.08" />
            <Stop offset="1" stopColor={chartColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Gradient fill area */}
        <Path d={chartData.fillPath} fill="url(#areaGrad)" />

        {/* Price line */}
        <Path
          d={chartData.linePath}
          fill="none"
          stroke={chartColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Crosshair when active */}
        {activePoint && (
          <>
            {/* Vertical line */}
            <Line
              x1={activePoint.x}
              y1={0}
              x2={activePoint.x}
              y2={height}
              stroke={Colors.textSecondary}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            {/* Horizontal line */}
            <Line
              x1={0}
              y1={activePoint.y}
              x2={width}
              y2={activePoint.y}
              stroke={Colors.textSecondary}
              strokeWidth={0.5}
              strokeDasharray="3,3"
            />
            {/* Active dot */}
            <Circle
              cx={activePoint.x}
              cy={activePoint.y}
              r={5}
              fill={Colors.background}
              stroke={chartColor}
              strokeWidth={2.5}
            />
          </>
        )}

        {/* Invisible hit area for better touch/hover detection */}
        <Rect x={0} y={0} width={width} height={height} fill="transparent" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    cursor: 'crosshair' as any,
  },
  noData: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: 80,
  },
  tooltipRow: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  tooltipPrice: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  tooltipDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  tooltipHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
});

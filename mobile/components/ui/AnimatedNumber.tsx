/**
 * AnimatedNumber — Smoothly animates between number values
 * Used on the net worth card for a premium counting effect
 */
import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  style?: TextStyle | TextStyle[];
  formatter?: (n: number) => string;
}

function defaultFormat(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

export function AnimatedNumber({
  value,
  duration = 600,
  prefix = '',
  style,
  formatter = defaultFormat,
}: AnimatedNumberProps) {
  const animRef = useRef(new Animated.Value(0)).current;
  const prevValue = useRef(0);
  const [display, setDisplay] = useState(formatter(value));

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = to;

    if (from === to) {
      setDisplay(prefix + formatter(to));
      return;
    }

    animRef.setValue(0);
    const listener = animRef.addListener(({ value: t }) => {
      const current = from + (to - from) * t;
      setDisplay(prefix + formatter(current));
    });

    Animated.timing(animRef, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start(() => {
      setDisplay(prefix + formatter(to));
    });

    return () => animRef.removeListener(listener);
  }, [value]);

  return <Text style={style}>{display}</Text>;
}

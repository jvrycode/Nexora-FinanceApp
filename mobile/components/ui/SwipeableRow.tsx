/**
 * SwipeableRow — Swipe left to reveal delete action on asset rows
 * Works on both web (mouse drag) and mobile (touch)
 */
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';

const DELETE_WIDTH = 80;
const THRESHOLD = DELETE_WIDTH * 0.4;

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(Math.max(g.dx, -DELETE_WIDTH));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -THRESHOLD) {
          Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true }).start();
          setSwiped(true);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          setSwiped(false);
        }
      },
    })
  ).current;

  const close = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    setSwiped(false);
  };

  const handleDelete = () => {
    Animated.timing(translateX, { toValue: -Dimensions.get('window').width, duration: 250, useNativeDriver: true }).start(() => {
      onDelete();
    });
  };

  return (
    <View style={styles.container}>
      {/* Delete action behind */}
      <View style={styles.deleteAction}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={20} color={Colors.text} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Content slides left */}
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.negative,
    borderRadius: BorderRadius.sm,
  },
  deleteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteText: {
    fontSize: FontSize.xs,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  content: {
    backgroundColor: Colors.background,
  },
});

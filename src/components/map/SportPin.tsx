import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, components } from '../../constants/theme';
import type { Sport } from '../../types';

interface SportPinProps {
  sport: Sport;
  count?: number;
}

// Custom map marker rendered as a React Native view.
// The "tail" is a small rotated square below the bubble.
export function SportPin({ sport, count }: SportPinProps) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.bubble, { backgroundColor: sport.color }]}>
        <Text style={styles.emoji}>{sport.emoji}</Text>
        {count !== undefined && count > 1 && (
          <View style={[styles.badge, { backgroundColor: sport.color }]}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </View>
      {/* Tail: rotated square clipped by overflow hidden on wrapper */}
      <View style={[styles.tail, { backgroundColor: sport.color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  bubble: {
    width: components.pin.size + 8,
    height: components.pin.size + 8,
    borderRadius: (components.pin.size + 8) / 2,
    borderWidth: components.pin.borderWidth,
    borderColor: components.pin.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
    // Elevation for Android / shadow for iOS
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emoji: {
    fontSize: 16,
  },
  tail: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: '700',
  },
});

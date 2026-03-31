import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radius, spacing } from '../../constants/theme';

interface TagProps {
  label: string;
  color?: string;
  textColor?: string;
  dot?: boolean;
}

export function Tag({
  label,
  color = colors.primaryMid,
  textColor = colors.primary,
  dot = false,
}: TagProps) {
  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      {dot && <View style={[styles.dot, { backgroundColor: textColor }]} />}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});

import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, typography, radius, spacing } from '../../constants/theme';
import { sports, type SportId } from '../../constants/theme';

interface FilterPillsProps {
  activeSport: SportId | 'all';
  onChange: (sport: SportId | 'all') => void;
}

export function FilterPills({ activeSport, onChange }: FilterPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* "All" pill */}
      <TouchableOpacity
        onPress={() => onChange('all')}
        style={[styles.pill, activeSport === 'all' && styles.activePill]}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.pillLabel,
            activeSport === 'all' && styles.activePillLabel,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {sports.map((sport) => {
        const isActive = activeSport === sport.id;
        return (
          <TouchableOpacity
            key={sport.id}
            onPress={() => onChange(sport.id)}
            style={[styles.pill, isActive && styles.activePill]}
            activeOpacity={0.8}
          >
            <View style={[styles.dot, { backgroundColor: sport.color }]} />
            <Text
              style={[
                styles.pillLabel,
                isActive && styles.activePillLabel,
              ]}
            >
              {sport.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  activePill: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  pillLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
  },
  activePillLabel: {
    color: colors.white,
  },
});

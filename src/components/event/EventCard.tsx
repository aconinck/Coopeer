import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, components, spacing, radius } from '../../constants/theme';
import type { Event } from '../../types';

interface EventCardProps {
  event: Event;
  sportEmoji?: string;
}

function formatEventDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatEventTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function EventCard({ event, sportEmoji }: EventCardProps) {
  const router = useRouter();
  const spotsLeft = event.maxPlayers - event.confirmed.length;
  const lowSpots = spotsLeft < 5;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/event/${event.id}` as never)}
      activeOpacity={0.85}
      style={styles.card}
    >
      <View style={styles.left}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateDay}>
            {event.date.toLocaleDateString('en-US', { weekday: 'short' })}
          </Text>
          <Text style={styles.dateNum}>
            {event.date.getDate()}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {sportEmoji ? `${sportEmoji} ` : ''}{event.title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={12} color={colors.gray500} />
          <Text style={styles.meta}>
            {formatEventTime(event.date)} – {formatEventTime(event.endDate)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={colors.gray500} />
          <Text style={styles.meta} numberOfLines={1}>
            {event.venueName}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={[styles.spotsBadge, lowSpots && styles.spotsBadgeLow]}>
          <Text style={[styles.spotsText, lowSpots && styles.spotsTextLow]}>
            {spotsLeft} left
          </Text>
        </View>
        <Text style={styles.confirmedCount}>
          {event.confirmed.length}/{event.maxPlayers}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: components.eventCard.width,
    height: components.eventCard.height,
    backgroundColor: colors.surface,
    borderRadius: components.eventCard.borderRadius,
    borderWidth: 1,
    borderColor: colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  left: {
    alignItems: 'center',
  },
  dateBlock: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 44,
  },
  dateDay: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  dateNum: {
    fontSize: typography.sizes.xl,
    color: colors.black,
    fontWeight: typography.weights.bold,
    lineHeight: 28,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  spotsBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  spotsBadgeLow: {
    backgroundColor: '#FFF0EE',
  },
  spotsText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  spotsTextLow: {
    color: colors.error,
  },
  confirmedCount: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MemberAvatars } from './MemberAvatars';
import { colors, typography, components, spacing } from '../../constants/theme';
import type { Team } from '../../types';

interface TeamCardProps {
  team: Team;
  nextEventDate?: string;
  /** When true, tapping navigates to the manager admin panel */
  isManager?: boolean;
}

export function TeamCard({ team, nextEventDate, isManager = false }: TeamCardProps) {
  const router = useRouter();
  const destination = isManager ? `/manage/${team.id}` : `/team/${team.id}`;

  return (
    <TouchableOpacity
      onPress={() => router.push(destination as never)}
      activeOpacity={0.85}
      style={[styles.card, team.isNew && styles.newCard]}
    >
      {team.isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>New</Text>
        </View>
      )}

      <View style={styles.sportBadge}>
        <Text style={styles.sportEmoji}>{team.sport.emoji}</Text>
      </View>

      <Text style={styles.teamName} numberOfLines={2}>
        {team.name}
      </Text>

      {nextEventDate && (
        <Text style={styles.eventLabel} numberOfLines={1}>
          Next game: {nextEventDate}
        </Text>
      )}

      <View style={styles.footer}>
        <MemberAvatars members={team.members} maxVisible={3} size={22} />
        <Text style={styles.memberCount}>{team.memberCount}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: components.teamCard.width,
    height: components.teamCard.height,
    backgroundColor: colors.surface,
    borderRadius: components.teamCard.borderRadius,
    borderWidth: 1,
    borderColor: components.teamCard.border,
    paddingVertical: components.teamCard.paddingVertical,
    paddingHorizontal: components.teamCard.paddingHorizontal,
    justifyContent: 'space-between',
  },
  newCard: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: '#FFF3C9',
    borderRadius: components.teamCard.borderRadius,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.goldText,
  },
  sportBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportEmoji: {
    fontSize: 18,
  },
  teamName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
    flex: 1,
    marginTop: spacing.xs,
  },
  eventLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberCount: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    fontWeight: typography.weights.bold,
  },
});

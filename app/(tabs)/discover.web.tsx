// Web version of Discover — shows a placeholder since react-native-maps
// doesn't support web. The real map runs on iOS/Android only.
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FilterPills } from '../../src/components/map/FilterPills';
import { NavBar } from '../../src/components/shared/NavBar';
import { Tag } from '../../src/components/shared/Tag';
import { colors, typography, spacing, radius, sports } from '../../src/constants/theme';
import type { SportId } from '../../src/constants/theme';

const MOCK_TEAMS = [
  { id: 't1', name: 'Bentonville Strikers', sport: sports[0], schedule: 'Fridays 8pm', memberCount: 14, maxMembers: 22, trialPrice: 700, monthlyPrice: 2900, location: 'Lawrence Plaza Field' },
  { id: 't2', name: 'Crystal Bridges Picklers', sport: sports[1], schedule: 'Saturdays 9am', memberCount: 8, maxMembers: 12, trialPrice: 700, monthlyPrice: 2400, location: 'Crystal Bridges Courts' },
  { id: 't3', name: 'Walmart Campus Ballers', sport: sports[2], schedule: 'Tue & Thu 12pm', memberCount: 18, maxMembers: 20, trialPrice: 700, monthlyPrice: 3200, location: 'Campus Recreation Center' },
  { id: 't4', name: 'Slaughter Pen Tennis Club', sport: sports[3], schedule: 'Wednesdays 6pm', memberCount: 10, maxMembers: 16, trialPrice: 700, monthlyPrice: 2600, location: 'Slaughter Pen Park' },
  { id: 't5', name: 'Razorback Trail Runners', sport: sports[4], schedule: 'Sundays 7am', memberCount: 22, maxMembers: 40, trialPrice: 700, monthlyPrice: 1800, location: 'Razorback Greenway' },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [activeSport, setActiveSport] = useState<SportId | 'all'>('all');

  const filtered = activeSport === 'all'
    ? MOCK_TEAMS
    : MOCK_TEAMS.filter((t) => t.sport.id === activeSport);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.gray500} />
          <Text style={styles.searchPlaceholder}>Search sports near you</Text>
        </View>
        <View style={styles.locationBadge}>
          <Ionicons name="location" size={12} color={colors.primary} />
          <Text style={styles.locationText}>Bentonville, AR</Text>
        </View>
      </View>

      {/* Filter pills */}
      <FilterPills activeSport={activeSport} onChange={setActiveSport} />

      {/* Team list */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{filtered.length} teams near you</Text>
        {filtered.map((team) => {
          const spotsLeft = team.maxMembers - team.memberCount;
          return (
            <TouchableOpacity
              key={team.id}
              style={styles.teamCard}
              onPress={() => router.push(`/team/${team.id}` as never)}
              activeOpacity={0.85}
            >
              <View style={[styles.sportBadge, { backgroundColor: team.sport.color + '22' }]}>
                <Text style={styles.sportEmoji}>{team.sport.emoji}</Text>
              </View>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{team.name}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={12} color={colors.gray500} />
                  <Text style={styles.meta}>{team.schedule}</Text>
                  <Ionicons name="location-outline" size={12} color={colors.gray500} />
                  <Text style={styles.meta} numberOfLines={1}>{team.location}</Text>
                </View>
                <Text style={styles.spots} numberOfLines={1}>
                  {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                </Text>
              </View>
              <View style={styles.priceBlock}>
                <View style={styles.trialBadge}>
                  <Text style={styles.trialText}>${(team.trialPrice / 100).toFixed(0)}</Text>
                </View>
                <Text style={styles.monthlyText}>${(team.monthlyPrice / 100).toFixed(0)}/mo</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>

      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: colors.gray500,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  locationText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  sportBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportEmoji: {
    fontSize: 22,
  },
  teamInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  teamName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  meta: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  spots: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  trialBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  trialText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  monthlyText: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
  },
});

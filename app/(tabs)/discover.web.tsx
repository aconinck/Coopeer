// Web version of Discover — AllTrails-style browse screen.
// react-native-maps doesn't support web, so we show a premium list view instead.
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NavBar } from '../../src/components/shared/NavBar';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  sports,
} from '../../src/constants/theme';
import type { SportId } from '../../src/constants/theme';

const MOCK_TEAMS = [
  {
    id: 't1',
    name: 'Bentonville Strikers',
    sport: sports[0],
    schedule: 'Fridays 8pm',
    memberCount: 14,
    maxMembers: 22,
    trialPrice: 700,
    monthlyPrice: 2900,
    location: 'Lawrence Plaza Field',
    level: 'Intermediate',
  },
  {
    id: 't2',
    name: 'Crystal Bridges Picklers',
    sport: sports[1],
    schedule: 'Saturdays 9am',
    memberCount: 8,
    maxMembers: 12,
    trialPrice: 700,
    monthlyPrice: 2400,
    location: 'Crystal Bridges Courts',
    level: 'Casual',
  },
  {
    id: 't3',
    name: 'Walmart Campus Ballers',
    sport: sports[2],
    schedule: 'Tue & Thu 12pm',
    memberCount: 18,
    maxMembers: 20,
    trialPrice: 700,
    monthlyPrice: 3200,
    location: 'Campus Recreation Center',
    level: 'Competitive',
  },
  {
    id: 't4',
    name: 'Slaughter Pen Tennis Club',
    sport: sports[3],
    schedule: 'Wednesdays 6pm',
    memberCount: 10,
    maxMembers: 16,
    trialPrice: 700,
    monthlyPrice: 2600,
    location: 'Slaughter Pen Park',
    level: 'Intermediate',
  },
  {
    id: 't5',
    name: 'Razorback Trail Runners',
    sport: sports[4],
    schedule: 'Sundays 7am',
    memberCount: 22,
    maxMembers: 40,
    trialPrice: 700,
    monthlyPrice: 1800,
    location: 'Razorback Greenway',
    level: 'Casual',
  },
];

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function DiscoverWebScreen() {
  const router = useRouter();
  const [activeSport, setActiveSport] = useState<SportId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_TEAMS.filter((t) => {
    const matchesSport = activeSport === 'all' || t.sport.id === activeSport;
    const matchesSearch =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky search header */}
        <View style={styles.searchHeader}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.locationText}>Bentonville, AR</Text>
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.gray500} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search teams, sports, venues..."
              placeholderTextColor={colors.gray500}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.gray100} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroGradient}>
            <Text style={styles.heroLabel}>DISCOVER</Text>
            <Text style={styles.heroTitle}>Teams near you</Text>
            <Text style={styles.heroSub}>
              Join a game for $7 · Subscribe if you love it
            </Text>
            <View style={styles.heroBadge}>
              <Ionicons name="location" size={12} color={colors.primary} />
              <Text style={styles.heroBadgeText}>Bentonville, AR</Text>
            </View>
          </View>
        </View>

        {/* Sport filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          <TouchableOpacity
            onPress={() => setActiveSport('all')}
            style={[styles.pill, activeSport === 'all' && styles.pillActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, activeSport === 'all' && styles.pillTextActive]}>
              All Sports
            </Text>
          </TouchableOpacity>
          {sports.map((sport) => {
            const isActive = activeSport === sport.id;
            return (
              <TouchableOpacity
                key={sport.id}
                onPress={() => setActiveSport(sport.id)}
                style={[styles.pill, isActive && styles.pillActive, isActive && { borderColor: sport.color, backgroundColor: sport.color + '18' }]}
                activeOpacity={0.8}
              >
                <Text style={styles.pillEmoji}>{sport.emoji}</Text>
                <Text style={[styles.pillText, isActive && { color: sport.color }]}>
                  {sport.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results count */}
        <View style={styles.resultsRow}>
          <Text style={styles.resultsLabel}>
            {filtered.length} team{filtered.length !== 1 ? 's' : ''} found
          </Text>
          <TouchableOpacity style={styles.sortBtn}>
            <Ionicons name="options-outline" size={14} color={colors.gray500} />
            <Text style={styles.sortText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Team cards */}
        <View style={styles.cardList}>
          {filtered.map((team) => {
            const spotsLeft = team.maxMembers - team.memberCount;
            return (
              <TouchableOpacity
                key={team.id}
                style={styles.card}
                onPress={() => router.push(`/team/${team.id}` as never)}
                activeOpacity={0.88}
              >
                {/* Cover area */}
                <View style={[styles.cardCover, { backgroundColor: team.sport.color + '25' }]}>
                  <Text style={styles.cardEmoji}>{team.sport.emoji}</Text>
                  <View style={[styles.sportBadge, { backgroundColor: team.sport.color }]}>
                    <Text style={styles.sportBadgeText}>{team.sport.label}</Text>
                  </View>
                  <View style={[
                    styles.levelBadge,
                    team.level === 'Competitive' && styles.levelCompetitive,
                    team.level === 'Casual' && styles.levelCasual,
                  ]}>
                    <Text style={styles.levelText}>{team.level}</Text>
                  </View>
                </View>

                {/* Card body */}
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>{team.name}</Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={13} color={colors.gray500} />
                      <Text style={styles.metaText}>{team.schedule}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={13} color={colors.gray500} />
                      <Text style={styles.metaText} numberOfLines={1}>{team.location}</Text>
                    </View>
                  </View>

                  {/* Members progress bar */}
                  <View style={styles.membersRow}>
                    <Text style={styles.membersText}>
                      {team.memberCount}/{team.maxMembers} members
                    </Text>
                    <Text style={[styles.spotsText, spotsLeft <= 3 && styles.spotsUrgent]}>
                      {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(team.memberCount / team.maxMembers) * 100}%` as `${number}%`,
                          backgroundColor: spotsLeft <= 3 ? colors.error : colors.success,
                        },
                      ]}
                    />
                  </View>

                  {/* Price + CTA */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.trialLabel}>Try once</Text>
                      <Text style={styles.trialPrice}>{formatPrice(team.trialPrice)}</Text>
                    </View>
                    <View style={styles.monthlyBlock}>
                      <Text style={styles.monthlyLabel}>Join</Text>
                      <Text style={styles.monthlyPrice}>{formatPrice(team.monthlyPrice)}/mo</Text>
                    </View>
                    <TouchableOpacity style={styles.ctaBtn}>
                      <Text style={styles.ctaBtnText}>View Team</Text>
                      <Ionicons name="arrow-forward" size={14} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface2,
  },

  // Sticky search header
  searchHeader: {
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.gray100,
    ...shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.black,
    paddingVertical: 0,
  },

  // Hero
  heroCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroGradient: {
    padding: spacing.xl,
    gap: spacing.xs,
    backgroundColor: colors.primary,
  },
  heroLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.white,
    lineHeight: 34,
  },
  heroSub: {
    fontSize: typography.sizes.base,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xs,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.md,
  },
  heroBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },

  // Filter pills
  pillsRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray100,
    ...shadows.card,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
  },
  pillTextActive: {
    color: colors.white,
  },

  // Results
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  resultsLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sortText: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    fontWeight: typography.weights.bold,
  },

  // Card list
  cardList: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray100,
    ...shadows.card,
  },
  cardCover: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 52,
  },
  sportBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  sportBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  levelCompetitive: {
    backgroundColor: '#FEE2E2',
  },
  levelCasual: {
    backgroundColor: '#D1FAE5',
  },
  levelText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  metaRow: {
    gap: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    flex: 1,
  },
  membersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membersText: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
  },
  spotsText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  spotsUrgent: {
    color: colors.error,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray100,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    gap: spacing.md,
  },
  trialLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
  },
  trialPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  monthlyBlock: {
    flex: 1,
  },
  monthlyLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
  },
  monthlyPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  ctaBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
});

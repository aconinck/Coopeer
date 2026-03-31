// Team public profile — conversion screen.
// Accessible without login. Shared via deep link coopeer.app/team/[slug].
// Design: open for iteration (no Figma reference yet).
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/shared/Button';
import { Tag } from '../../src/components/shared/Tag';
import { MemberAvatars } from '../../src/components/team/MemberAvatars';
import { getTeam, getTeamEvents } from '../../src/services/api';
import { colors, typography, spacing, radius } from '../../src/constants/theme';
import type { Team, Event } from '../../src/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = 220;

const LEVEL_LABELS: Record<Team['level'], string> = {
  casual: 'Casual',
  intermediate: 'Intermediate',
  competitive: 'Competitive',
};

export default function TeamProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getTeam(id), getTeamEvents(id)]).then(([t, events]) => {
      setTeam(t ?? null);
      const next = events
        .filter((e) => e.date > new Date())
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;
      setNextEvent(next);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!team) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Team not found</Text>
      </SafeAreaView>
    );
  }

  const spotsLeft = team.maxMembers - team.memberCount;
  const descLong = team.description.length > 120;

  return (
    <View style={styles.container}>
      {/* Hero image with gradient overlay */}
      <ImageBackground
        source={team.coverImage ? { uri: team.coverImage } : { uri: '' }}
        style={styles.hero}
        // Fallback background color shown when no cover image
      >
        <View style={styles.heroGradient}>
          <SafeAreaView edges={['top']} style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color={colors.white} />
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.heroBottom}>
            <Text style={styles.heroTeamName}>{team.name}</Text>
          </View>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tags */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
          <Tag label={team.sport.label} color={team.sport.color + '22'} textColor={team.sport.color} />
          <Tag label={LEVEL_LABELS[team.level]} color={colors.background} textColor={colors.gray500} />
          <Tag label={team.location.venueName} color={colors.background} textColor={colors.gray500} />
          <Tag label={team.schedule} color={colors.background} textColor={colors.gray500} />
        </ScrollView>

        {/* Description */}
        <View>
          <Text style={styles.description} numberOfLines={descExpanded || !descLong ? undefined : 3}>
            {team.description}
          </Text>
          {descLong && (
            <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)}>
              <Text style={styles.readMore}>
                {descExpanded ? 'Show less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Next game */}
        {nextEvent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next game</Text>
            <View style={styles.infoRows}>
              <InfoRow
                icon="calendar-outline"
                label="When"
                value={nextEvent.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                }) + ' · ' + nextEvent.date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              />
              <InfoRow
                icon="location-outline"
                label="Where"
                value={`${nextEvent.venueName} · ${nextEvent.venueAddress}`}
              />
              <InfoRow
                icon="people-outline"
                label="Spots left"
                value={`${spotsLeft} of ${team.maxMembers}`}
                valueColor={spotsLeft < 5 ? colors.primary : undefined}
              />
            </View>
          </View>
        )}

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>
          <View style={styles.membersRow}>
            <MemberAvatars members={team.members} maxVisible={6} size={36} />
            <Text style={styles.memberCount}>{team.memberCount} members</Text>
          </View>
        </View>

        {/* Bottom padding for CTA bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA bar — fixed at bottom */}
      <View style={styles.ctaBar}>
        <SafeAreaView edges={['bottom']} style={styles.ctaInner}>
          <Button
            label={`Try once · $${(team.trialPrice / 100).toFixed(0)}`}
            onPress={() =>
              router.push({
                pathname: '/checkout',
                params: { teamId: team.id, mode: 'trial' },
              } as never)
            }
            variant="outline"
            style={styles.ctaButton}
          />
          <Button
            label={`Join · $${(team.monthlyPrice / 100).toFixed(0)}/mo`}
            onPress={() =>
              router.push({
                pathname: '/checkout',
                params: { teamId: team.id, mode: 'subscription' },
              } as never)
            }
            variant="primary"
            style={styles.ctaButton}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.gray500} style={{ width: 20 }} />
      <View style={styles.infoRowText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  errorText: {
    fontSize: typography.sizes.base,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  hero: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    backgroundColor: colors.primaryMid,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroTop: {
    paddingHorizontal: spacing.md,
  },
  heroBottom: {
    padding: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  heroTeamName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    letterSpacing: typography.tracking.tight,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  tagsRow: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.gray600,
    lineHeight: 22,
  },
  readMore: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
    letterSpacing: typography.tracking.tight,
  },
  infoRows: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoRowText: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  infoValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  memberCount: {
    fontSize: typography.sizes.base,
    color: colors.gray500,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  ctaInner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  ctaButton: {
    flex: 1,
  },
});

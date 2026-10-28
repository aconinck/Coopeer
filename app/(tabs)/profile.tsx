import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, type } from '../../src/constants/theme';
import { enter } from '../../src/constants/motion';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { confirmDestructive } from '../../src/lib/format';
import { open } from '../../src/lib/nav';
import { sports, type SportId } from '../../src/state/models';
import { achievements, homeTown, levelName, memberSince, skillTrees, sportProgress, totals } from '../../src/state/profile';
import { AchievementBadge } from '../../src/profile/AchievementBadge';
import { SkillTree } from '../../src/profile/SkillTree';
import { SPORT_CARD_WIDTH, SportLevelCard } from '../../src/profile/SportLevelCard';
import { Avatar, StatRow, card } from '../../src/ui/Display';
import { Rail, Section } from '../../src/ui/Layout';
import { ListGroup, ListRow } from '../../src/ui/ListGroup';
import { ClubCard } from '../../src/ui/Rows';
import { Screen } from '../../src/ui/Screen';

const BADGES_PREVIEW = 6;
const COLUMNS = 3;

/**
 * Profile (Airbnb / AllTrails / Uber patterns): identity card, your sports with levels,
 * a skill tree per sport, achievements, your clubs, then account settings.
 */
export default function ProfileScreen() {
  const store = useStore();
  const session = useSession();
  const user = session.user;
  const reduceMotion = useReducedMotion();
  const [sport, setSport] = useState<SportId>(sportProgress[0].sport);
  const [allBadges, setAllBadges] = useState(false);

  const earned = achievements.filter((a) => a.earned).length;
  const badges = allBadges ? achievements : [...achievements].sort((a, b) => Number(b.earned) - Number(a.earned)).slice(0, BADGES_PREVIEW);
  const badgeRows: (typeof badges)[] = [];
  for (let i = 0; i < badges.length; i += COLUMNS) badgeRows.push(badges.slice(i, i + COLUMNS));
  const current = sportProgress.find((p) => p.sport === sport) ?? sportProgress[0];
  const stagger = (index: number) => (reduceMotion ? undefined : enter(index));

  return (
    <Screen variant="tab" title="Profile">
      <Animated.View entering={stagger(0)}>
        <View style={styles.identity}>
          <View style={styles.identityTop}>
            <View>
              {user && <Avatar member={{ id: user.id, name: user.name }} size={84} />}
              <View style={styles.verified}>
                <Ionicons name="checkmark" size={14} color={colors.white} />
              </View>
            </View>
            <View style={styles.identityText}>
              <Text style={type.title2} numberOfLines={1}>
                {user?.name ?? 'Player'}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons name="location-sharp" size={13} color={colors.label2} />
                <Text style={[type.subhead, styles.muted]}>{homeTown}</Text>
              </View>
              <Text style={[type.footnote, styles.muted]}>On Coopeer since {memberSince}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsBleed}>
            <StatRow stats={[...totals, { value: `${store.myClubs.length}`, label: 'Clubs' }]} />
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={stagger(1)}>
        <Section title="Your sports" caption="Tap a sport to see its skill tree.">
          <Rail snap={SPORT_CARD_WIDTH}>
            {sportProgress.map((progress) => (
              <SportLevelCard key={progress.sport} progress={progress} selected={progress.sport === sport} onPress={() => setSport(progress.sport)} />
            ))}
          </Rail>
        </Section>
      </Animated.View>

      <Animated.View entering={stagger(2)}>
        <Section title={`${sports[sport].label} skill tree`} caption={`Level ${current.level} · ${levelName(current.level)} · ${Math.round(current.toNext * 100)}% to level ${current.level + 1}`}>
          <Animated.View key={sport} entering={reduceMotion ? undefined : FadeIn.duration(220)}>
            <SkillTree sport={sport} tiers={skillTrees[sport]} />
          </Animated.View>
        </Section>
      </Animated.View>

      <Animated.View entering={stagger(3)}>
        <Section
          title="Achievements"
          caption={`${earned} of ${achievements.length} earned`}
          action={achievements.length > BADGES_PREVIEW ? { label: allBadges ? 'Show less' : 'See all', onPress: () => setAllBadges((v) => !v) } : undefined}
        >
          <View style={styles.badges}>
            {badgeRows.map((row) => (
              <View key={row.map((b) => b.id).join('-')} style={styles.badgeRow}>
                {row.map((badge) => (
                  <AchievementBadge key={badge.id} achievement={badge} />
                ))}
                {Array.from({ length: COLUMNS - row.length }, (_, i) => (
                  <View key={i} style={styles.flex} />
                ))}
              </View>
            ))}
          </View>
        </Section>
      </Animated.View>

      <Animated.View entering={stagger(4)}>
        <Section title="Your clubs" action={{ label: 'See all', onPress: () => router.navigate('/clubs') }}>
          {store.myClubs.length > 0 ? (
            <Rail snap={176}>
              {store.myClubs.map((club) => (
                <ClubCard key={club.id} club={club} width={176} onPress={() => open.clubPage(club.id)} />
              ))}
            </Rail>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => router.navigate('/map')} style={({ pressed }) => [styles.emptyClubs, pressed && { opacity: 0.7 }]}>
              <Ionicons name="people-outline" size={22} color={colors.label2} />
              <Text style={[type.subhead, styles.flex]}>You haven't joined a club yet. Find one on the map.</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.label3} />
            </Pressable>
          )}
        </Section>
      </Animated.View>

      <Animated.View entering={stagger(5)}>
        <Section title="Account">
          <ListGroup>
            <ListRow icon="person-outline" title="Personal info" subtitle="Name, phone number" onPress={() => router.push('/personal-info')} />
            <ListRow icon="card-outline" title="Payments" subtitle="Memberships and payment methods" onPress={() => router.push('/payments')} />
            <ListRow icon="help-circle-outline" title="How Coopeer works" onPress={() => router.push('/how-it-works')} />
          </ListGroup>
          <ListGroup>
            <ListRow
              icon="log-out-outline"
              title="Sign out"
              destructive
              onPress={() => confirmDestructive('Sign out of Coopeer?', 'You can sign back in anytime with your phone number.', 'Sign out', session.signOut)}
            />
          </ListGroup>
        </Section>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  muted: { color: colors.label2 },
  identity: { ...card, padding: space.lg, gap: space.lg },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  identityText: { flex: 1, gap: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verified: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.verified,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  statsBleed: { marginHorizontal: -space.md },
  badges: { ...card, paddingVertical: space.lg, paddingHorizontal: space.sm, gap: space.lg },
  badgeRow: { flexDirection: 'row' },
  emptyClubs: { ...card, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
});

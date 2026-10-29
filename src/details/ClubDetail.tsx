import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../constants/theme';
import { enter, exit } from '../constants/motion';
import { DetailLayout, useDetailNav } from '../ui/DetailLayout';
import { ME, gameStatus, inviteUrl, isToday, type Club } from '../state/models';
import { useSession } from '../state/session';
import { useStore } from '../state/store';
import { confirmDestructive, dollars, shareText } from '../lib/format';
import { ActionBar, PrimaryButton, SecondaryButton, TextButton, haptic } from '../ui/Buttons';
import { Avatar, ClubLogo, KindTag, SectionHeader, VerifiedBadge, card } from '../ui/Display';
import { GameRow, LinkRow } from '../ui/Rows';
import { MoreMenu, type MenuItem } from '../ui/Screen';
import { Segmented, type SegmentOption } from '../ui/Segmented';

type Tab = 'Games' | 'About' | 'Members';
const tabs: SegmentOption<Tab>[] = [
  { value: 'Games', label: 'Games' },
  { value: 'About', label: 'About' },
  { value: 'Members', label: 'Members' },
];

/** Figma club page: Games / About / Members. Non-members see "Join club" in the action bar. */
export function ClubDetail({ id }: { id: string }) {
  const nav = useDetailNav();
  const store = useStore();
  const session = useSession();
  const [tab, setTab] = useState<Tab>('Games');
  const club = id ? store.club(id) : undefined;
  const isMember = club ? store.isMember(club.id) : false;
  const isAdmin = club ? store.isAdmin(club.id) : false;

  const reduceMotion = useReducedMotion();
  const [celebrating, setCelebrating] = useState(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(false), 1200);
    return () => clearTimeout(timer);
  }, [celebrating]);

  if (!club) {
    return (
      <DetailLayout title="Club">
        <Text style={[type.body, styles.secondary]}>This club couldn't be found.</Text>
      </DetailLayout>
    );
  }

  const next = store.nextGameFor(club.id);
  const menu: MenuItem[] = [
    ...(isAdmin ? [{ label: 'New game', icon: 'add-circle-outline' as const, onPress: () => router.push(`/create/game?club=${club.id}`) }] : []),
    { label: 'Invite with QR code', icon: 'qr-code-outline', onPress: () => router.push(`/invite/${club.id}`) },
    { label: 'Share invite link', icon: 'share-outline', onPress: () => shareText(`Join ${club.name} on Coopeer`, inviteUrl(club)) },
  ];
  if (isMember && club.ownerId !== ME.id) {
    menu.push({
      label: 'Leave club',
      icon: 'exit-outline',
      destructive: true,
      onPress: () =>
        confirmDestructive(`Leave ${club.name}?`, 'Its games will disappear from your schedule. You can rejoin anytime.', 'Leave club', () =>
          store.leave(club.id),
        ),
    });
  }

  return (
    <DetailLayout
      title={club.name}
      trailing={<MoreMenu items={menu} />}
      footer={
        celebrating ? (
          <ActionBar caption="Its games are now on your schedule.">
            <PrimaryButton title="Welcome to the club" success onPress={() => undefined} />
          </ActionBar>
        ) : isMember ? null : (
          <ActionBar caption={`${dollars(club.monthlyPrice)}/month · all club games included · cancel anytime`}>
            {next && <SecondaryButton title="Try a game" onPress={() => nav.game(next.id)} />}
            <PrimaryButton
              title="Join club"
              onPress={() =>
                session.requireAuth(() => {
                  haptic.success();
                  store.join(club.id);
                  setCelebrating(true);
                })
              }
            />
          </ActionBar>
        )
      }
    >
      <View style={styles.header}>
        {club.photoUri ? <Image source={{ uri: club.photoUri }} style={styles.photo} accessibilityIgnoresInvertColors /> : <ClubLogo club={club} size={72} />}
        <View style={styles.headerText}>
          <KindTag kind="club" />
          <View style={styles.nameRow}>
            <Text style={[type.title2, styles.nameText]}>{club.name}</Text>
            {club.verified && <VerifiedBadge size={20} />}
          </View>
          <Text style={[type.subhead, styles.secondary]}>{club.cadence}</Text>
          {isMember && (
            <Animated.View entering={mounted.current && !reduceMotion ? FadeIn.duration(260) : undefined} style={styles.memberRow}>
              <Ionicons name={isAdmin ? 'shield-checkmark' : 'checkmark-circle'} size={14} color={colors.going} />
              <Text style={[type.footnote, { color: colors.going, fontWeight: '600' }]}>{isAdmin ? "You're an admin" : "You're a member"}</Text>
            </Animated.View>
          )}
        </View>
      </View>

      <Segmented options={tabs} value={tab} onChange={setTab} />

      <Animated.View key={tab} entering={FadeIn.duration(220)} exiting={FadeOut.duration(100)} style={styles.tabBody}>
        {tab === 'Games' && <GamesTab club={club} />}
        {tab === 'About' && <AboutTab club={club} />}
        {tab === 'Members' && <MembersTab club={club} />}
      </Animated.View>
    </DetailLayout>
  );
}

function GamesTab({ club }: { club: Club }) {
  const nav = useDetailNav();
  const store = useStore();
  const games = store.gamesFor(club.id);
  const today = games.filter((g) => isToday(gameStatus(g, store.now)));
  const upcoming = games.filter((g) => gameStatus(g, store.now) === 'later');
  const isAdmin = store.isAdmin(club.id);
  const newGame = () => router.push(`/create/game?club=${club.id}`);

  if (games.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="calendar-outline" size={36} color={colors.label3} />
        <Text style={[type.subhead, styles.secondary]}>No games scheduled</Text>
        {isAdmin && (
          <View style={styles.emptyAction}>
            <PrimaryButton title="New game" icon="add" onPress={newGame} />
          </View>
        )}
      </View>
    );
  }

  return (
    <>
      {isAdmin && (
        <Pressable accessibilityRole="button" onPress={newGame} style={({ pressed }) => [styles.newGame, pressed && { opacity: 0.6 }]}>
          <Ionicons name="add-circle" size={22} color={colors.brand} />
          <Text style={[type.headline, { color: colors.brand }]}>New game</Text>
        </Pressable>
      )}
      {today.length > 0 && <SectionHeader title="Today" />}
      {today.map((game, index) => (
        <GameRow key={game.id} index={index} game={game} onPress={() => nav.game(game.id)} />
      ))}
      {upcoming.length > 0 && <SectionHeader title="Upcoming" />}
      {upcoming.map((game, index) => (
        <GameRow key={game.id} index={today.length + index} game={game} onPress={() => nav.game(game.id)} />
      ))}
    </>
  );
}

function AboutTab({ club }: { club: Club }) {
  const nav = useDetailNav();
  const store = useStore();
  const [expanded, setExpanded] = useState(false);
  const home = store.place(club.homePlaceId);
  const facts: [string, string][] = [
    ['Plays', club.cadence],
    ['Level', club.level],
    ['Members', String(club.memberCount)],
    ['Price', `${dollars(club.monthlyPrice)}/month`],
  ];

  return (
    <>
      <View style={styles.block}>
        <Text style={type.headline}>Description</Text>
        <Text style={[type.body, styles.secondary]} numberOfLines={expanded ? undefined : 3}>
          {club.about}
        </Text>
        <TextButton title={expanded ? 'Show less' : 'Read more'} onPress={() => setExpanded(!expanded)} />
      </View>

      <View style={[card, styles.facts]}>
        {facts.map(([label, value]) => (
          <View key={label} style={styles.fact}>
            <Text style={[type.subhead, styles.secondary, styles.factLabel]}>{label}</Text>
            <Text style={type.subhead}>{value}</Text>
          </View>
        ))}
      </View>

      {home && (
        <View style={styles.block}>
          <Text style={type.headline}>Home</Text>
          <LinkRow title={home.name} subtitle={home.address} icon="location" onPress={() => nav.place(home.id)} />
        </View>
      )}

      {club.links.length > 0 && (
        <View style={styles.block}>
          <Text style={type.headline}>Links</Text>
          {club.links.map((link) => (
            <LinkRow
              key={link.url}
              title={link.title}
              subtitle={link.url.replace(/^https?:\/\//, '')}
              icon="link"
              onPress={() => Linking.openURL(link.url)}
            />
          ))}
        </View>
      )}
    </>
  );
}

function MembersTab({ club }: { club: Club }) {
  const nav = useDetailNav();
  const [query, setQuery] = useState('');
  const filtered = query ? club.members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())) : club.members;

  return (
    <>
      <View style={styles.search}>
        <Ionicons name="search" size={16} color={colors.label2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search members"
          placeholderTextColor={colors.label3}
          style={[type.body, styles.searchInput]}
        />
      </View>
      <Text style={type.headline}>{club.memberCount} members</Text>
      {filtered.map((member, index) => (
        <Animated.View
          key={member.id}
          layout={LinearTransition.duration(240)}
          entering={enter(index)}
          exiting={exit()}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${member.name}'s profile`}
            onPress={() => nav.player(member.id)}
            style={({ pressed }) => [styles.memberItem, pressed && { opacity: 0.6 }]}
          >
            <Avatar member={member} size={36} />
            <Text style={[type.body, { flex: 1 }]}>{member.name}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.label3} />
          </Pressable>
        </Animated.View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  secondary: { color: colors.label2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  headerText: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameText: { flexShrink: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabBody: { gap: space.md },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  emptyAction: { flexDirection: 'row', width: 200, marginTop: space.sm },
  newGame: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  photo: { width: 72, height: 72, borderRadius: radius.card },
  block: { gap: space.sm, alignItems: 'stretch' },
  facts: { padding: space.lg, gap: space.sm },
  fact: { flexDirection: 'row', gap: space.lg },
  factLabel: { width: 72 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.fill,
  },
  searchInput: { flex: 1, color: colors.label, paddingVertical: 0 },
  memberItem: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs },
});

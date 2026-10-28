import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, space, type } from '../../src/constants/theme';
import { gameStatus, inviteUrl, isToday, type Club } from '../../src/state/models';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { confirmDestructive, dollars, shareText } from '../../src/lib/format';
import { open } from '../../src/lib/nav';
import { ActionBar, PrimaryButton, SecondaryButton, TextButton } from '../../src/ui/Buttons';
import { Avatar, ClubLogo, KindTag, SectionHeader, card } from '../../src/ui/Display';
import { GameRow, LinkRow } from '../../src/ui/Rows';
import { MoreMenu, Screen, type MenuItem } from '../../src/ui/Screen';

type Tab = 'Games' | 'About' | 'Members';
const tabs: Tab[] = ['Games', 'About', 'Members'];

/** Figma club page: Games / About / Members. Non-members see "Join club" in the action bar. */
export default function ClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const session = useSession();
  const [tab, setTab] = useState<Tab>('Games');
  const club = id ? store.club(id) : undefined;
  const isMember = club ? store.isMember(club.id) : false;

  const wasMember = useRef(isMember);
  useEffect(() => {
    if (isMember && !wasMember.current && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    wasMember.current = isMember;
  }, [isMember]);

  if (!club) {
    return (
      <Screen title="Club">
        <Text style={[type.body, styles.secondary]}>This club couldn't be found.</Text>
      </Screen>
    );
  }

  const next = store.nextGameFor(club.id);
  const menu: MenuItem[] = [
    { label: 'Invite with QR code', icon: 'qr-code-outline', onPress: () => router.push(`/invite/${club.id}`) },
    { label: 'Share invite link', icon: 'share-outline', onPress: () => shareText(`Join ${club.name} on Coopeer`, inviteUrl(club)) },
  ];
  if (isMember) {
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
    <Screen
      title={club.name}
      trailing={<MoreMenu items={menu} />}
      footer={
        isMember ? null : (
          <ActionBar caption={`${dollars(club.monthlyPrice)}/month · all club games included · cancel anytime`}>
            {next && <SecondaryButton title="Try a game" onPress={() => open.game(next.id)} />}
            <PrimaryButton title="Join club" onPress={() => session.requireAuth(() => store.join(club.id))} />
          </ActionBar>
        )
      }
    >
      <View style={styles.header}>
        <ClubLogo club={club} size={72} />
        <View style={styles.headerText}>
          <KindTag kind="club" />
          <Text style={type.title2}>{club.name}</Text>
          <Text style={[type.subhead, styles.secondary]}>{club.cadence}</Text>
          {isMember && (
            <View style={styles.memberRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.going} />
              <Text style={[type.footnote, { color: colors.going, fontWeight: '600' }]}>You're a member</Text>
            </View>
          )}
        </View>
      </View>

      <Segmented value={tab} onChange={setTab} />

      {tab === 'Games' && <GamesTab club={club} />}
      {tab === 'About' && <AboutTab club={club} />}
      {tab === 'Members' && <MembersTab club={club} />}
    </Screen>
  );
}

function Segmented({ value, onChange }: { value: Tab; onChange: (tab: Tab) => void }) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = tab === value;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[type.subhead, { fontWeight: selected ? '600' : '500' }]}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function GamesTab({ club }: { club: Club }) {
  const store = useStore();
  const games = store.gamesFor(club.id);
  const today = games.filter((g) => isToday(gameStatus(g, store.now)));
  const upcoming = games.filter((g) => gameStatus(g, store.now) === 'later');

  if (games.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="calendar-outline" size={36} color={colors.label3} />
        <Text style={[type.subhead, styles.secondary]}>No games scheduled</Text>
      </View>
    );
  }

  return (
    <>
      {today.length > 0 && <SectionHeader title="Today" />}
      {today.map((game) => (
        <GameRow key={game.id} game={game} onPress={() => open.game(game.id)} />
      ))}
      {upcoming.length > 0 && <SectionHeader title="Upcoming" />}
      {upcoming.map((game) => (
        <GameRow key={game.id} game={game} onPress={() => open.game(game.id)} />
      ))}
    </>
  );
}

function AboutTab({ club }: { club: Club }) {
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
          <LinkRow title={home.name} subtitle={home.address} icon="location" onPress={() => open.place(home.id)} />
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
      {filtered.map((member) => (
        <View key={member.id} style={styles.memberItem}>
          <Avatar member={member} size={36} />
          <Text style={type.body}>{member.name}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  secondary: { color: colors.label2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  headerText: { flex: 1, gap: 3 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  segmented: { flexDirection: 'row', backgroundColor: colors.fill, borderRadius: radius.full, padding: 3 },
  segment: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  segmentSelected: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
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

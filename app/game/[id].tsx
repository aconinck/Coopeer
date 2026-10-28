import { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, space, type } from '../../src/constants/theme';
import { gameStatus, sports, spotsLeft, type Club, type Game } from '../../src/state/models';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { dollars, monthDay, openDirections, shareText, time } from '../../src/lib/format';
import { open } from '../../src/lib/nav';
import { ActionBar, IconButton, PrimaryButton, SecondaryButton } from '../../src/ui/Buttons';
import { AvatarStack, ClubLogo, InfoChip, KindTag, StatusBadge, gameBadge } from '../../src/ui/Display';
import { Screen } from '../../src/ui/Screen';

/** Figma "Evento": one game, its time and place, who's going, and Decline / I'm in. */
export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const game = id ? store.game(id) : undefined;
  const place = game ? store.place(game.placeId) : undefined;

  const wasGoing = useRef(game?.myRSVP === 'going');
  useEffect(() => {
    const going = game?.myRSVP === 'going';
    if (going && !wasGoing.current && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    wasGoing.current = going;
  }, [game?.myRSVP]);

  if (!game || !place) {
    return (
      <Screen variant="sheet" title="Game">
        <Text style={[type.body, styles.secondary]}>This game couldn't be found.</Text>
      </Screen>
    );
  }

  const club = game.clubId ? store.club(game.clubId) : undefined;
  const isMember = club ? store.isMember(club.id) : false;
  const badge = gameBadge(game, isMember, store.now);
  const progress = Math.min(game.going.length / Math.max(game.capacity, 1), 1);

  return (
    <Screen variant="sheet" title="Game" footer={<Footer game={game} isMember={isMember} />}>
      <View style={styles.topLine}>
        <KindTag kind={club ? 'clubGame' : 'openGame'} />
        {badge && <StatusBadge kind={badge} />}
      </View>
      <Text style={[type.largeTitle, game.isCanceled && styles.strike]}>{game.title}</Text>
      <HostRow club={club} />
      <Text style={[type.body, styles.secondary]}>{game.details}</Text>

      <View style={styles.divider} />

      <View style={styles.chips}>
        <InfoChip text={monthDay(game.start)} />
        <View style={styles.flex} />
        <InfoChip text={time(game.start)} />
        <Text style={styles.secondary}>–</Text>
        <InfoChip text={time(game.end)} />
      </View>

      <Pressable accessibilityRole="button" onPress={() => openDirections(place)} style={({ pressed }) => [styles.location, pressed && styles.pressed]}>
        <Ionicons name="location-outline" size={22} color={colors.label2} />
        <View style={styles.flex}>
          <Text style={type.headline}>{place.name}</Text>
          <Text style={[type.subhead, styles.secondary, styles.underline]}>{place.address}</Text>
        </View>
        <Ionicons name="navigate" size={20} color={colors.brand} />
      </Pressable>

      <View style={styles.divider} />

      <View style={styles.topLine}>
        <Text style={type.headline}>Going</Text>
        <Text style={[type.subhead, styles.secondary, { fontWeight: '600', fontVariant: ['tabular-nums'] }]}>
          {game.going.length} of {game.capacity}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.goingRow}>
        <AvatarStack members={game.going} size={28} limit={3} />
        <View style={styles.flex} />
        <Pressable accessibilityRole="button" onPress={() => router.push(`/attendees/${game.id}`)} style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
          <Text style={[type.subhead, { fontWeight: '600' }]}>See who's going</Text>
        </Pressable>
        <IconButton
          icon="share-outline"
          label="Share"
          onPress={() => shareText(`${game.title} · ${monthDay(game.start)} ${time(game.start)} at ${place.name}`, `coopeer://game/${game.id}`)}
        />
      </View>
    </Screen>
  );
}

function HostRow({ club }: { club?: Club }) {
  if (!club) {
    return (
      <View style={styles.host}>
        <Ionicons name="enter-outline" size={18} color={colors.label2} />
        <Text style={[type.subhead, styles.secondary]}>Open game — anyone can join</Text>
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" onPress={() => open.clubFromSheet(club.id)} style={({ pressed }) => [styles.host, pressed && styles.pressed]}>
      <ClubLogo club={club} size={28} />
      <Text style={type.subhead}>
        Hosted by <Text style={{ fontWeight: '700' }}>{club.name}</Text>
      </Text>
      <Ionicons name="chevron-forward" size={14} color={colors.label3} />
    </Pressable>
  );
}

function Footer({ game, isMember }: { game: Game; isMember: boolean }) {
  const store = useStore();
  const session = useSession();
  const status = gameStatus(game, store.now);

  if (game.isCanceled) return <ActionBar caption="This game was canceled." />;
  if (status === 'ended') return <ActionBar caption="This game has ended." />;
  if (game.myRSVP === 'going') {
    return (
      <ActionBar caption="You're in. See you there!">
        <SecondaryButton title="Can't make it" onPress={() => store.setRSVP(game.id, 'declined')} />
      </ActionBar>
    );
  }

  const declined = game.myRSVP === 'declined';
  const full = spotsLeft(game) === 0;
  return (
    <ActionBar caption={isMember ? 'Included in your club membership.' : `Drop-in ${dollars(game.dropInPrice)} · paid at the ${sports[game.sport].placeNoun}`}>
      <SecondaryButton
        title={declined ? 'Not going' : 'Decline'}
        disabled={declined}
        onPress={() => session.requireAuth(() => store.setRSVP(game.id, 'declined'))}
      />
      <PrimaryButton title={full ? 'Full' : "I'm in"} disabled={full} onPress={() => session.requireAuth(() => store.setRSVP(game.id, 'going'))} />
    </ActionBar>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  secondary: { color: colors.label2 },
  strike: { textDecorationLine: 'line-through' },
  underline: { textDecorationLine: 'underline' },
  pressed: { opacity: 0.7 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  host: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: space.xs },
  chips: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  location: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  track: { height: 8, borderRadius: radius.full, backgroundColor: colors.fill2, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: radius.full, backgroundColor: colors.brand },
  goingRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pill: { height: 40, paddingHorizontal: space.lg, borderRadius: radius.full, backgroundColor: colors.fill, justifyContent: 'center' },
});

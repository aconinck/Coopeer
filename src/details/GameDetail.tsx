import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../constants/theme';
import { enter, spring, timing } from '../constants/motion';
import { DetailLayout, useDetailNav } from '../ui/DetailLayout';
import { gameStatus, sports, spotsLeft, type Club, type Game } from '../state/models';
import { useSession } from '../state/session';
import { useStore } from '../state/store';
import { dollars, monthDay, openDirections, shareText, time } from '../lib/format';
import { ActionBar, IconButton, PrimaryButton, SecondaryButton, haptic } from '../ui/Buttons';
import { AvatarStack, ClubLogo, InfoChip, KindTag, StatusBadge, gameBadge } from '../ui/Display';

/** Figma "Evento": one game, its time and place, who's going, and Decline / I'm in. */
export function GameDetail({ id }: { id: string }) {
  const nav = useDetailNav();
  const store = useStore();
  const game = id ? store.game(id) : undefined;
  const place = game ? store.place(game.placeId) : undefined;

  if (!game || !place) {
    return (
      <DetailLayout title="Game">
        <Text style={[type.body, styles.secondary]}>This game couldn't be found.</Text>
      </DetailLayout>
    );
  }

  const club = game.clubId ? store.club(game.clubId) : undefined;
  const isMember = club ? store.isMember(club.id) : false;
  const badge = gameBadge(game, isMember, store.now);
  const progress = Math.min(game.going.length / Math.max(game.capacity, 1), 1);

  return (
    <DetailLayout title="Game" footer={<Footer game={game} isMember={isMember} />}>
      <Stagger index={0}>
        <View style={styles.topLine}>
          <KindTag kind={club ? 'clubGame' : 'openGame'} />
          {badge && <StatusBadge kind={badge} />}
        </View>
        <Text style={[type.largeTitle, game.isCanceled && styles.strike]}>{game.title}</Text>
        <HostRow club={club} />
        <Text style={[type.body, styles.secondary]}>{game.details}</Text>
      </Stagger>

      <View style={styles.divider} />

      <Stagger index={1}>
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
      </Stagger>

      <View style={styles.divider} />

      <Stagger index={2}>
        <View style={styles.topLine}>
          <Text style={type.headline}>Going</Text>
          <RollingCount value={game.going.length} suffix={` of ${game.capacity}`} />
        </View>
        <ProgressTrack value={progress} />
        <View style={styles.goingRow}>
          <AvatarStack members={game.going} size={28} limit={3} />
          <View style={styles.flex} />
          <Pressable accessibilityRole="button" onPress={() => nav.attendees(game.id)} style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
            <Text style={[type.subhead, { fontWeight: '600' }]}>See who's going</Text>
          </Pressable>
          <IconButton
            icon="share-outline"
            label="Share"
            onPress={() => shareText(`${game.title} · ${monthDay(game.start)} ${time(game.start)} at ${place.name}`, `coopeer://game/${game.id}`)}
          />
        </View>
      </Stagger>
    </DetailLayout>
  );
}

function Stagger({ index, children }: { index: number; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View entering={reduceMotion ? undefined : enter(index)} style={styles.group}>
      {children}
    </Animated.View>
  );
}

/** Going bar eases to its new width whenever the count changes. */
function ProgressTrack({ value }: { value: number }) {
  const [width, setWidth] = useState(0);
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withSpring(value, spring.smooth);
  }, [value, fill]);
  const style = useAnimatedStyle(() => ({ width: fill.value * width }));
  return (
    <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.trackFill, style]} />
    </View>
  );
}

/** The number cross-fades when it changes. */
function RollingCount({ value, suffix }: { value: number; suffix: string }) {
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);
  return (
    <View style={styles.countRow}>
      <Animated.Text key={value} entering={first.current ? undefined : FadeIn.duration(timing.fade.duration)} style={[type.subhead, styles.count]}>
        {value}
      </Animated.Text>
      <Text style={[type.subhead, styles.count]}>{suffix}</Text>
    </View>
  );
}

function HostRow({ club }: { club?: Club }) {
  const nav = useDetailNav();
  if (!club) {
    return (
      <View style={styles.host}>
        <Ionicons name="enter-outline" size={18} color={colors.label2} />
        <Text style={[type.subhead, styles.secondary]}>Open game — anyone can join</Text>
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" onPress={() => nav.club(club.id)} style={({ pressed }) => [styles.host, pressed && styles.pressed]}>
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
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(false), 1200);
    return () => clearTimeout(timer);
  }, [celebrating]);

  const imIn = () =>
    session.requireAuth(() => {
      haptic.success();
      store.setRSVP(game.id, 'going');
      setCelebrating(true);
    });

  if (game.isCanceled) return <ActionBar caption="This game was canceled." />;
  if (status === 'ended') return <ActionBar caption="This game has ended." />;
  if (celebrating) {
    return (
      <ActionBar caption="See you there!">
        <PrimaryButton title="You're in" success onPress={() => undefined} />
      </ActionBar>
    );
  }
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
      <PrimaryButton title={full ? 'Full' : "I'm in"} disabled={full} onPress={imIn} />
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
  group: { gap: space.md },
  countRow: { flexDirection: 'row', overflow: 'hidden' },
  count: { color: colors.label2, fontWeight: '600', fontVariant: ['tabular-nums'] },
  goingRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pill: { height: 40, paddingHorizontal: space.lg, borderRadius: radius.full, backgroundColor: colors.fill, justifyContent: 'center' },
});

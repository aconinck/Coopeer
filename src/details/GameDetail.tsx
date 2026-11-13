import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../constants/theme';
import { enter, spring, timing } from '../constants/motion';
import { DetailLayout, useDetailNav } from '../ui/DetailLayout';
import { gameStatus, sports, spotsLeft, type Club, type RSVP } from '../state/models';
import { useSession } from '../state/session';
import { useStore } from '../state/store';
import { dollars, monthDay, openDirections, shareText, time } from '../lib/format';
import { heroImageFor } from '../lib/heroImage';
import { AvatarStack, ClubLogo, StatusBadge, VerifiedBadge, gameBadge } from '../ui/Display';
import { CoverImage } from '../ui/CoverImage';
import { RSVPCapsule } from '../ui/RSVPCapsule';
import { MoreMenu } from '../ui/Screen';

const COVER_HEIGHT = 480;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function repeatText(repeat: string | undefined, start: Date): string | null {
  if (!repeat || repeat === 'never') return null;
  if (repeat === 'weekly') return `Every ${DAY_NAMES[start.getDay()]}`;
  if (repeat === 'weekdays') return 'Every weekday';
  if (repeat === 'custom') return 'Repeating';
  return null;
}

/**
 * One game, Apple Invites style: the cover photo runs edge to edge under the header, then fades and blurs into
 * the screen color. Title, reply capsule, host, place and guests sit on top of that wash.
 */
export function GameDetail({ id }: { id: string }) {
  const nav = useDetailNav();
  const store = useStore();
  const session = useSession();
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
  const status = gameStatus(game, store.now);
  const closed = game.isCanceled || status === 'ended';
  const full = spotsLeft(game) === 0 && game.myRSVP !== 'going';
  const progress = Math.min(game.going.length / Math.max(game.capacity, 1), 1);
  const base = colors.white;
  const image = heroImageFor(game, place, store.places);
  const when = `${monthDay(game.start)} · ${time(game.start)} – ${time(game.end)}`;
  const repeatLabel = repeatText(game.repeat, game.start);
  const caption = game.isCanceled
    ? 'This game was canceled.'
    : status === 'ended'
      ? 'This game has ended.'
      : full
        ? 'This game is full. You can still say maybe.'
        : isMember
          ? 'Included in your club membership.'
          : `Drop-in ${dollars(game.dropInPrice)} · paid at the ${sports[game.sport].placeNoun}`;

  const reply = (next: RSVP) => session.requireAuth(() => store.setRSVP(game.id, next));
  const payAndGo = () =>
    session.requireAuth(() => {
      if (game.dropInPrice === 0 || isMember) { reply('going'); return; }
      const isRecurring = (game.repeat && game.repeat !== 'never') || !!club;
      if (isRecurring && club && club.monthlyPrice > 0) {
        Alert.alert(
          game.title,
          `${repeatLabel ?? 'Recurring game'} · ${dollars(game.dropInPrice)} drop-in`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: `Pay ${dollars(game.dropInPrice)} · just this game`, onPress: () => store.setRSVP(game.id, 'going') },
            { text: `Join ${club.name} · ${dollars(club.monthlyPrice)}/mo`, onPress: () => store.setRSVP(game.id, 'going') },
          ],
          { cancelable: true },
        );
      } else {
        Alert.alert(
          'Pay with Apple Pay',
          `${dollars(game.dropInPrice)} drop-in · ${game.title}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: `Pay ${dollars(game.dropInPrice)}`, onPress: () => store.setRSVP(game.id, 'going') },
          ],
          { cancelable: true },
        );
      }
    });
  const menu = [
    { label: 'Share', icon: 'share-outline' as const, onPress: () => shareText(`${game.title} · ${monthDay(game.start)} ${time(game.start)} at ${place.name}`, `coopeer://game/${game.id}`) },
    { label: 'Directions', icon: 'navigate-outline' as const, onPress: () => openDirections(place) },
  ];

  return (
    <DetailLayout
      title=""
      trailing={<MoreMenu items={menu} />}
      coverColor={base}
      cover={image ? <CoverImage source={image} base={base} height={COVER_HEIGHT} /> : null}
    >
      <Stagger index={0} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.kind}>
            <Ionicons name="calendar" size={11} color={colors.white} />
            <Text style={[type.caption2, styles.kindText]}>{club ? 'CLUB GAME' : 'OPEN GAME'}</Text>
          </View>
          {gameBadge(game, isMember, store.now) === 'live' && <StatusBadge kind="live" onMedia />}
        </View>
        <View style={styles.heroBottom}>
          <Text style={[type.largeTitle, styles.heroTitle, game.isCanceled && styles.strike]}>{game.title}</Text>
          <Text style={[type.subhead, styles.heroLine]}>{when}</Text>
          <Text style={[type.subhead, styles.heroLine]} numberOfLines={1}>{place.name}</Text>
          {repeatLabel ? (
            <View style={styles.repeatPill}>
              <Ionicons name="repeat" size={12} color={colors.brand} />
              <Text style={[type.caption2, styles.repeatText]}>{repeatLabel}</Text>
            </View>
          ) : null}
          <View style={styles.capsuleWrap}>
            {game.dropInPrice > 0 && !isMember && !closed ? (
              <PayButton
                price={game.dropInPrice}
                going={game.myRSVP === 'going'}
                onPay={payAndGo}
                onCancel={() => reply('none')}
              />
            ) : (
              <RSVPCapsule value={game.myRSVP} onChange={reply} disabled={closed} tone="light" />
            )}
          </View>
          <Text style={[type.footnote, styles.heroCaption]}>{caption}</Text>
        </View>
      </Stagger>

      <Stagger index={1} style={styles.section}>
        <HostRow club={club} nav={nav} />
      </Stagger>

      {game.details ? (
        <Stagger index={2} style={styles.section}>
          <View style={styles.glassCard}>
            <Text style={[type.subhead, styles.details]}>{game.details}</Text>
          </View>
        </Stagger>
      ) : null}

      <Stagger index={3} style={styles.section}>
        <Pressable accessibilityRole="button" onPress={() => openDirections(place)} style={({ pressed }) => [styles.glassCard, styles.location, pressed && styles.pressed]}>
          <Ionicons name="location-outline" size={22} color={colors.label} />
          <View style={styles.flex}>
            <Text style={[type.headline, styles.onDark]}>{place.name}</Text>
            <Text style={[type.subhead, styles.dim]}>{place.address}</Text>
          </View>
          <Ionicons name="navigate" size={20} color={colors.label} />
        </Pressable>
      </Stagger>

      <Stagger index={4} style={styles.section}>
        <View style={[styles.glassCard, styles.going]}>
          <View style={styles.topLine}>
            <Text style={[type.headline, styles.onDark]}>Going</Text>
            <RollingCount value={game.going.length} suffix={` of ${game.capacity}`} />
          </View>
          <ProgressTrack value={progress} />
          <Pressable accessibilityRole="button" onPress={() => nav.attendees(game.id)} style={({ pressed }) => [styles.goingRow, pressed && styles.pressed]}>
            <AvatarStack members={game.going} size={32} limit={5} />
            <View style={styles.flex} />
            <Text style={[type.subhead, styles.link]}>See who's going</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.label2} />
          </Pressable>
        </View>
      </Stagger>
    </DetailLayout>
  );
}

function PayButton({ price, going, onPay, onCancel }: { price: number; going: boolean; onPay: () => void; onCancel: () => void }) {
  if (going) {
    return (
      <View style={payStyles.row}>
        <View style={payStyles.youreIn}>
          <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
          <Text style={[type.headline, payStyles.youreInText]}>You're in</Text>
        </View>
        <Pressable onPress={onCancel} style={({ pressed }) => [payStyles.cancelBtn, pressed && styles.pressed]}>
          <Text style={[type.footnote, payStyles.cancelText]}>Cancel</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <Pressable onPress={onPay} style={({ pressed }) => [payStyles.payBtn, pressed && styles.pressed]}>
      <Ionicons name="logo-apple" size={18} color={colors.white} />
      <Text style={[type.headline, payStyles.payText]}>Pay {dollars(price)} · I'm in</Text>
    </Pressable>
  );
}

const payStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  youreIn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs },
  youreInText: { color: colors.brand, fontWeight: '700' },
  cancelBtn: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.full, backgroundColor: 'rgba(0,0,0,0.08)' },
  cancelText: { color: colors.label2 },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, backgroundColor: colors.label, borderRadius: radius.full, paddingVertical: 16, paddingHorizontal: space.xl },
  payText: { color: colors.white, fontWeight: '700' },
});

function Stagger({ index, children, style }: { index: number; children: ReactNode; style?: object }) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View entering={reduceMotion ? undefined : enter(index)} style={style}>
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

function HostRow({ club, nav }: { club?: Club; nav: ReturnType<typeof useDetailNav> }) {
  if (!club) {
    return (
      <View style={[styles.glassCard, hostStyles.openGame]}>
        <View style={hostStyles.openIcon}>
          <Ionicons name="people" size={20} color={colors.label2} />
        </View>
        <Text style={[type.subhead, hostStyles.openText]}>Open game · anyone can join</Text>
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" onPress={() => nav.club(club.id)} style={({ pressed }) => [styles.glassCard, hostStyles.root, pressed && styles.pressed]}>
      <Text style={[type.caption2, hostStyles.byLine]}>ORGANIZED BY</Text>
      <ClubLogo club={club} size={64} />
      <View style={hostStyles.nameRow}>
        <Text style={[type.title3, hostStyles.clubName]}>{club.name}</Text>
        {club.verified ? <VerifiedBadge size={15} /> : null}
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.label3} style={hostStyles.chevron} />
    </Pressable>
  );
}

const GLASS = 'rgba(0,0,0,0.04)';
const GLASS_BORDER = 'rgba(0,0,0,0.07)';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  secondary: { color: colors.label2 },
  onDark: { color: colors.label },
  dim: { color: colors.label2 },
  bold: { fontWeight: '700' },
  link: { color: colors.label2, fontWeight: '600' },
  strike: { textDecorationLine: 'line-through' },
  pressed: { opacity: 0.7 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero: { minHeight: 150, gap: space.lg, justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 26, borderRadius: radius.full, backgroundColor: 'rgba(0,0,0,0.35)' },
  kindText: { color: colors.white, fontWeight: '700' },
  heroBottom: { paddingHorizontal: space.lg, gap: 4, alignItems: 'center' },
  heroTitle: { color: colors.label, textAlign: 'center' },
  // Stronger than label2 so the when/place lines read clearly on the light cover wash.
  heroLine: { color: 'rgba(0,0,0,0.72)', textAlign: 'center' },
  repeatPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.brandSoft, marginTop: 2 },
  repeatText: { color: colors.brand, fontWeight: '600' },
  capsuleWrap: { alignSelf: 'stretch', marginTop: space.lg },
  // Use label (black) base with 60% opacity — legible on the near-white bg below the button.
  heroCaption: { color: 'rgba(0,0,0,0.60)', textAlign: 'center', marginTop: space.sm },
  section: { paddingHorizontal: space.lg, marginTop: space.md },
  glassCard: { padding: space.lg, gap: space.md, borderRadius: 26, backgroundColor: GLASS, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: GLASS_BORDER },
  details: { color: colors.label2, textAlign: 'center' },
  location: { flexDirection: 'row', alignItems: 'center' },
  going: { gap: space.md },
  track: { height: 8, borderRadius: radius.full, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: radius.full, backgroundColor: colors.label },
  countRow: { flexDirection: 'row', overflow: 'hidden' },
  count: { color: colors.label2, fontWeight: '600', fontVariant: ['tabular-nums'] },
  goingRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});

const hostStyles = StyleSheet.create({
  root: { alignItems: 'center', paddingVertical: space.xl, gap: space.sm, position: 'relative' },
  byLine: { color: colors.label3, letterSpacing: 0.6, fontWeight: '600' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  clubName: { color: colors.label, fontWeight: '700' },
  chevron: { position: 'absolute', right: space.lg, top: '50%' } as never,
  openGame: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  openIcon: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  openText: { color: colors.label2 },
});

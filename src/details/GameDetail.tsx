import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
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
import { PrimaryButton, SecondaryButton } from '../ui/Buttons';
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
  const image = heroImageFor(game, place);
  const when = `${monthDay(game.start)} · ${time(game.start)} – ${time(game.end)}`;
  const repeatLabel = repeatText(game.repeat, game.start);
  const weekly = store.isWeekly(game);
  const day = DAY_NAMES[game.start.getDay()];
  const invited = game.invitedBy && game.myRSVP === 'none' && !closed ? game.invitedBy : undefined;
  const caption = game.isCanceled
    ? 'This game was canceled.'
    : status === 'ended'
      ? 'This game has ended.'
      : game.myRSVP === 'going'
        ? weekly
          ? `You're in this game, and in every ${day} game.`
          : "You're in this game only."
        : weekly && game.myRSVP === 'declined'
          ? `You're skipping this one. Every other ${day} still counts.`
          : full
            ? 'This game is full. You can still say maybe.'
            : isMember
              ? 'Included in your club membership.'
              : `Drop-in ${dollars(game.dropInPrice)} · paid at the ${sports[game.sport].placeNoun}`;
  const setWeekly = (on: boolean) => {
    if (game.seriesId) session.requireAuth(() => store.setWeekly(game.seriesId as string, on));
  };

  const reply = (next: RSVP) => session.requireAuth(() => store.setRSVP(game.id, next));
  const menu = [
    { label: 'Share', icon: 'share-outline' as const, onPress: () => shareText(`${game.title} · ${monthDay(game.start)} ${time(game.start)} at ${place.name}`, `coopeer://game/${game.id}`) },
    { label: 'Directions', icon: 'navigate-outline' as const, onPress: () => openDirections(place) },
  ];

  const footerJoin = !closed ? (
    game.myRSVP === 'going'
      ? <SecondaryButton title="You're in" onPress={() => reply('none')} />
      : <PrimaryButton title={full ? 'Join waitlist' : 'Join game'} onPress={() => reply('going')} disabled={false} />
  ) : null;

  return (
    <DetailLayout
      title=""
      trailing={<MoreMenu items={menu} />}
      coverColor={base}
      cover={image ? <CoverImage source={image} base={base} height={COVER_HEIGHT} /> : null}
      footer={footerJoin}
    >
      <Stagger index={0} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.kind}>
            <Ionicons name="calendar" size={11} color={colors.white} />
            <Text style={[type.caption2, styles.kindText]}>{`${club ? 'CLUB' : 'OPEN'} GAME${game.seriesId ? ' · WEEKLY' : ''}`}</Text>
          </View>
          {gameBadge(game, isMember, store.now) === 'live' && <StatusBadge kind="live" onMedia />}
        </View>
        <View style={styles.heroBottom}>
          <Text style={[type.largeTitle, styles.heroTitle, game.isCanceled && styles.strike]}>{game.title}</Text>
          <Text style={[type.subhead, styles.heroLine]}>{when}</Text>
          <Text style={[type.subhead, styles.heroLine]} numberOfLines={1}>{place.name}</Text>
          {repeatLabel && game.myRSVP === 'going' ? (
            <View style={styles.repeatPill}>
              <Ionicons name="repeat" size={12} color={colors.brand} />
              <Text style={[type.caption2, styles.repeatText]}>{repeatLabel}</Text>
            </View>
          ) : null}
          {invited ? (
            <Text style={[type.subhead, styles.invited]}>{invited.name.split(' ')[0]} invited you to this game</Text>
          ) : null}
          <Text style={[type.footnote, styles.heroCaption]}>{caption}</Text>
        </View>
      </Stagger>

      {game.seriesId && !closed && game.myRSVP === 'going' ? (
        <Stagger index={1} style={styles.section}>
          <View style={[styles.glassCard, styles.weeklyCard]}>
            <View style={styles.weeklyIcon}>
              <Ionicons name="repeat" size={20} color={colors.brand} />
            </View>
            <View style={styles.flex}>
              <Text style={[type.headline, styles.onDark]}>Every {day}</Text>
              <Text style={[type.footnote, styles.dim]}>
                {weekly ? "You're in each week automatically. Choose Not going above to skip one." : 'Join every week and skip any one you cannot make.'}
              </Text>
            </View>
            <Switch accessibilityLabel={`Join every ${day}`} value={weekly} onValueChange={setWeekly} trackColor={{ true: colors.brand }} />
          </View>
        </Stagger>
      ) : null}

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
  invited: { color: colors.brand, textAlign: 'center', fontWeight: '600', marginTop: space.sm },
  weeklyCard: { flexDirection: 'row', alignItems: 'center' },
  weeklyIcon: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
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

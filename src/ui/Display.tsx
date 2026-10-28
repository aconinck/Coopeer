import { useEffect, useRef, type ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, layout, radius, shadow, space, type } from '../constants/theme';
import { spring, timing } from '../constants/motion';
import { gameStatus, initials, sports, spotsLeft, type Club, type Game, type Member, type SportId } from '../state/models';
import { isTomorrow, time, weekday } from '../lib/format';

const avatarPalette = [colors.brand, colors.soccer, colors.pickleball, '#30B0C7', '#FF2D55', '#AF52DE', '#00C7BE'];

export function Avatar({ member, size = 36 }: { member: Member; size?: number }) {
  const isMe = member.id === 'me';
  const hash = member.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <View
      accessibilityLabel={member.name}
      style={[styles.center, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarPalette[hash % avatarPalette.length] }]}
    >
      <Text style={{ color: colors.white, fontWeight: '700', fontSize: size * (isMe ? 0.3 : 0.38) }}>
        {isMe ? 'You' : initials(member.name)}
      </Text>
    </View>
  );
}

export function AvatarStack({ members, total, size = 24, limit = 4 }: { members: Member[]; total?: number; size?: number; limit?: number }) {
  const mounted = useMounted();
  const shown = members.slice(0, limit);
  const extra = (total ?? members.length) - shown.length;
  const ring = { borderWidth: 2, borderColor: colors.surface, borderRadius: size };
  return (
    <View style={styles.row} accessibilityLabel={`${total ?? members.length} people`}>
      {shown.map((member, index) => (
        <Animated.View
          key={member.id}
          layout={LinearTransition.springify().mass(1).stiffness(spring.smooth.stiffness).damping(spring.smooth.damping)}
          entering={mounted && member.id === 'me' ? FadeIn.duration(timing.fade.duration) : undefined}
          style={[ring, { marginLeft: index === 0 ? 0 : -size * 0.32 }]}
        >
          <Avatar member={member} size={size} />
        </Animated.View>
      ))}
      {extra > 0 && (
        <Animated.View layout={LinearTransition.springify().mass(1).stiffness(spring.smooth.stiffness).damping(spring.smooth.damping)} style={[ring, { marginLeft: -size * 0.32 }]}>
          <View style={[styles.center, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.fill2 }]}>
            <Text style={{ fontSize: size * 0.36, fontWeight: '700', color: colors.label2 }}>+{extra}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

/** True after the first render — lets "something changed" animations skip the initial mount. */
function useMounted() {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  return mounted.current;
}

export function SportIcon({ sport, size = 28, ring }: { sport: SportId; size?: number; ring?: boolean }) {
  const info = sports[sport];
  return (
    <View
      accessibilityLabel={info.label}
      style={[
        styles.center,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: info.color },
        ring && { borderWidth: 2, borderColor: colors.white },
      ]}
    >
      <MaterialCommunityIcons name={info.icon} size={size * 0.56} color={colors.white} />
    </View>
  );
}

/** Clubs are always a rounded square; games are always a date tile. */
export function ClubLogo({ club, size = 52 }: { club: Club; size?: number }) {
  const info = sports[club.sport];
  if (club.photoUri) {
    return <Image source={{ uri: club.photoUri }} style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: info.color }} />;
  }
  return (
    <View style={[styles.center, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: info.color }]}>
      <MaterialCommunityIcons name={info.icon} size={size * 0.5} color={colors.white} />
    </View>
  );
}

/** Coopeer-confirmed club. A blue seal next to the name, like Apple's verified marks. */
export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <View accessible accessibilityLabel="Verified club" style={styles.center}>
      <MaterialCommunityIcons name="check-decagram" size={size} color={colors.verified} />
    </View>
  );
}

export function DateTile({ game, now }: { game: Game; now: Date }) {
  const status = gameStatus(game, now);
  const top =
    status === 'live' ? 'LIVE' : status === 'soon' || status === 'today' ? 'TODAY' : isTomorrow(game.start, now) ? 'TMRW' : weekday(game.start).toUpperCase();
  const topColor = status === 'live' ? colors.live : status === 'later' || status === 'ended' ? colors.label2 : colors.brand;
  return (
    <View style={styles.dateTile}>
      <TileTop text={top} color={topColor} pulse={status === 'live'} />
      <Text style={styles.tileTime} numberOfLines={1} adjustsFontSizeToFit>
        {time(game.start)}
      </Text>
    </View>
  );
}

function TileTop({ text, color, pulse }: { text: string; color: string; pulse: boolean }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (!pulse || reduceMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(withSequence(withTiming(0.55, { duration: 1100, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) })), -1);
  }, [pulse, reduceMotion, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.Text style={[type.caption2, { color, fontWeight: '800' }, style]}>{text}</Animated.Text>;
}

export type BadgeKind = 'live' | 'going' | 'notGoing' | 'reply' | 'new' | 'canceled' | 'full' | 'member';

const tones = {
  red: { color: colors.live, bg: 'rgba(255,59,48,0.14)' },
  green: { color: colors.going, bg: 'rgba(48,179,90,0.14)' },
  orange: { color: colors.orange, bg: 'rgba(255,149,0,0.16)' },
  brand: { color: colors.brand, bg: colors.brandSoft },
  gray: { color: colors.label2, bg: colors.fill },
};

const badgeInfo: Record<BadgeKind, { title: string; tone: keyof typeof tones }> = {
  live: { title: 'Live', tone: 'red' },
  going: { title: 'Going', tone: 'green' },
  notGoing: { title: 'Not going', tone: 'orange' },
  reply: { title: 'Reply', tone: 'gray' },
  new: { title: 'New', tone: 'brand' },
  canceled: { title: 'Canceled', tone: 'red' },
  full: { title: 'Full', tone: 'orange' },
  member: { title: 'Member', tone: 'green' },
};

export function gameBadge(game: Game, isMember: boolean, now: Date): BadgeKind | null {
  if (game.isCanceled) return 'canceled';
  if (gameStatus(game, now) === 'live') return 'live';
  if (game.myRSVP === 'going') return 'going';
  if (game.myRSVP === 'declined') return 'notGoing';
  if (spotsLeft(game) === 0) return 'full';
  if (game.isNew) return 'new';
  return isMember ? 'reply' : null;
}

/** `onMedia`: solid white pill for sitting on a photo/cover (no nested pill). */
export function StatusBadge({ kind, onMedia }: { kind: BadgeKind; onMedia?: boolean }) {
  const mounted = useMounted();
  const { title, tone } = badgeInfo[kind];
  const { color, bg } = tones[tone];
  return (
    <Animated.View key={kind} entering={mounted ? FadeIn.duration(timing.fade.duration) : undefined} style={[styles.badge, { backgroundColor: onMedia ? colors.surface : bg }, onMedia && styles.badgeOnMedia]}>
      {kind === 'live' && <View style={styles.liveDot} />}
      {kind === 'member' && <Ionicons name="checkmark" size={12} color={color} />}
      <Text style={[type.caption, { color, fontWeight: '600' }]}>{title}</Text>
    </Animated.View>
  );
}

/** Tiny label that teaches the difference between a one-time game and a recurring club. */
export function KindTag({ kind }: { kind: 'clubGame' | 'openGame' | 'club' }) {
  const label = kind === 'club' ? 'Club' : kind === 'openGame' ? 'Open game' : 'Club game';
  return (
    <View style={styles.row}>
      <Ionicons name={kind === 'club' ? 'people' : 'calendar'} size={11} color={colors.label2} />
      <Text style={[type.caption2, { color: colors.label2, marginLeft: 4 }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

/**
 * Section title (Airbnb pattern): bold title, optional one-line caption, optional "See all" link on the right.
 * Use one per section; never stack two headers without content between them.
 */
export function SectionHeader({ title, caption, action }: { title: string; caption?: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionText} accessibilityRole="header">
        <Text style={type.title3}>{title}</Text>
        {caption ? <Text style={[type.footnote, { color: colors.label2 }]}>{caption}</Text> : null}
      </View>
      {action && (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.5 }}>
          <Text style={[type.subhead, styles.sectionAction]}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Strava-style row of big numbers with small labels, separated by hairlines. */
export function StatRow({ stats }: { stats: { value: string; label: string; tone?: string }[] }) {
  return (
    <View style={styles.statRow}>
      {stats.map((stat, index) => (
        <View key={stat.label} style={[styles.stat, index > 0 && styles.statDivider]}>
          <Text style={[styles.statValue, stat.tone ? { color: stat.tone } : null]} numberOfLines={1} adjustsFontSizeToFit>
            {stat.value}
          </Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ProgressBar({ value, color = colors.brand, height = 6 }: { value: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={[styles.track, { height, borderRadius: height / 2 }]}
    >
      <View style={{ width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

/** Rounded-square tile holding an icon. The one way icons sit next to text in rows. */
export function IconTile({ icon, color = colors.label, background = colors.fill, size = layout.iconTile }: { icon: ComponentProps<typeof Ionicons>['name']; color?: string; background?: string; size?: number }) {
  return (
    <View style={[styles.center, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: background }]}>
      <Ionicons name={icon} size={size * 0.56} color={color} />
    </View>
  );
}

export function InfoChip({ text }: { text: string }) {
  return (
    <View style={styles.infoChip}>
      <Text style={[type.subhead, { fontWeight: '500', fontVariant: ['tabular-nums'] }]}>{text}</Text>
    </View>
  );
}

/** Card surface: white, generous radius, no outline, a whisper of shadow. */
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  ...shadow.card,
} as const;

/**
 * Soft tinted pill: icon + short segments separated by dots ("Soccer • Club game").
 * The one way to show a category or status at the top of a card.
 */
export function Tag({
  icon,
  segments,
  color = colors.label,
  tint,
  live,
  iconColor,
}: {
  icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  segments: string[];
  color?: string;
  tint?: string;
  live?: boolean;
  /** Sport color for the icon when `live` (the text stays red). */
  iconColor?: string;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: tint ?? `${color}14` }]}>
      {live && icon ? (
        <View>
          <MaterialCommunityIcons name={icon} size={17} color={iconColor ?? color} />
          <View style={styles.tagLiveBadge} />
        </View>
      ) : live ? (
        <View style={styles.tagLive} />
      ) : icon ? (
        <MaterialCommunityIcons name={icon} size={16} color={color} />
      ) : null}
      {segments.map((segment, index) => (
        <View key={segment} style={styles.row}>
          {index > 0 && <View style={[styles.tagDot, { backgroundColor: `${color}40` }]} />}
          <Text style={[type.subhead, styles.tagText, { color: index === 0 ? color : colors.label }]} numberOfLines={1}>
            {segment}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md, marginTop: space.sm },
  sectionText: { flex: 1, gap: 2 },
  sectionAction: { color: colors.label, fontWeight: '600', textDecorationLine: 'underline' },
  statRow: { flexDirection: 'row', alignItems: 'stretch' },
  stat: { flex: 1, gap: 1, paddingHorizontal: space.md },
  statDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.separator },
  statValue: { fontSize: 20, lineHeight: 25, fontWeight: '700', letterSpacing: -0.3, fontVariant: ['tabular-nums'], color: colors.label },
  statLabel: { ...type.caption2, color: colors.label2, fontWeight: '600' },
  track: { width: '100%', backgroundColor: colors.fill, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  dateTile: {
    width: 82,
    height: 52,
    borderRadius: radius.tile,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tileTime: { ...type.footnote, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: radius.full, alignSelf: 'flex-start', flexShrink: 1 },
  tagText: { fontWeight: '600' },
  tagDot: { width: 5, height: 5, borderRadius: 3, marginRight: 6 },
  tagLive: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  tagLiveBadge: { position: 'absolute', top: -2, right: -3, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.live, borderWidth: 1.5, borderColor: colors.surface },
  badgeOnMedia: { height: 26, paddingHorizontal: 10 },
  infoChip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 10, backgroundColor: colors.fill },
});

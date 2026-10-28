import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  LinearTransition,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../constants/theme';
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
          layout={LinearTransition.springify().damping(18)}
          entering={mounted && member.id === 'me' ? ZoomIn.springify().damping(10) : undefined}
          style={[ring, { marginLeft: index === 0 ? 0 : -size * 0.32 }]}
        >
          <Avatar member={member} size={size} />
        </Animated.View>
      ))}
      {extra > 0 && (
        <Animated.View layout={LinearTransition.springify().damping(18)} style={[ring, { marginLeft: -size * 0.32 }]}>
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
  return (
    <View style={[styles.center, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: info.color }]}>
      <MaterialCommunityIcons name={info.icon} size={size * 0.5} color={colors.white} />
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
    opacity.value = withRepeat(withSequence(withTiming(0.35, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
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

export function StatusBadge({ kind }: { kind: BadgeKind }) {
  const mounted = useMounted();
  const { title, tone } = badgeInfo[kind];
  const { color, bg } = tones[tone];
  return (
    <Animated.View key={kind} entering={mounted ? ZoomIn.springify().damping(11) : undefined} style={[styles.badge, { backgroundColor: bg }]}>
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

export function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  return (
    <View style={{ gap: 2, marginTop: space.sm }} accessibilityRole="header">
      <Text style={type.title3}>{title}</Text>
      {caption ? <Text style={[type.footnote, { color: colors.label2 }]}>{caption}</Text> : null}
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

export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: colors.separator,
} as const;

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
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
  infoChip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 10, backgroundColor: colors.fill },
});

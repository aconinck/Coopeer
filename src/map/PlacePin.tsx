import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors, radius, shadow, type } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { gameStatus, sports, type Club, type Game, type PlaceKind, type Place, type SportId } from '../state/models';
import { time } from '../lib/format';

const kindStyle: Record<PlaceKind, { bg: string; border: string }> = {
  park:   { bg: '#E8F5EC', border: '#30B35A' },
  field:  { bg: '#D4EDD9', border: '#1E8A3B' },
  courts: { bg: '#ECEAFC', border: '#5B5BD6' },
  trail:  { bg: '#DFF2EF', border: '#1F9D8B' },
  center: { bg: '#FFF0E0', border: '#FF9500' },
};

function PlaceIcon({ kind, selected }: { kind: PlaceKind; selected: boolean }) {
  const { bg, border } = kindStyle[kind];
  const iconColor = selected ? colors.brand : border;

  if (kind === 'park') {
    return (
      <View style={[styles.place, { backgroundColor: bg, borderColor: selected ? colors.brand : border }]}>
        <Svg width={20} height={20} viewBox="0 0 20 20">
          <Circle cx="10" cy="8" r="5.5" fill={iconColor} />
          <Rect x="8.5" y="12" width="3" height="4" rx="1" fill={selected ? colors.brand : '#8B5E3C'} />
        </Svg>
      </View>
    );
  }

  if (kind === 'field') {
    return (
      <View style={[styles.place, { backgroundColor: bg, borderColor: selected ? colors.brand : border }]}>
        <Svg width={20} height={20} viewBox="0 0 20 20">
          {/* center circle */}
          <Circle cx="10" cy="10" r="4.5" stroke="white" strokeWidth="1.5" fill="none" />
          {/* center dot */}
          <Circle cx="10" cy="10" r="1.2" fill="white" />
          {/* center line */}
          <Line x1="2" y1="10" x2="18" y2="10" stroke="white" strokeWidth="1.5" />
        </Svg>
      </View>
    );
  }

  if (kind === 'courts') {
    return (
      <View style={[styles.place, { backgroundColor: bg, borderColor: selected ? colors.brand : border }]}>
        <Svg width={20} height={20} viewBox="0 0 20 20">
          {/* court outline */}
          <Rect x="4" y="3" width="12" height="14" rx="1" stroke={iconColor} strokeWidth="1.5" fill="none" />
          {/* net */}
          <Line x1="4" y1="10" x2="16" y2="10" stroke={iconColor} strokeWidth="1.5" />
          {/* kitchen lines */}
          <Line x1="4" y1="6.5" x2="16" y2="6.5" stroke={iconColor} strokeWidth="1" opacity="0.5" />
          <Line x1="4" y1="13.5" x2="16" y2="13.5" stroke={iconColor} strokeWidth="1" opacity="0.5" />
        </Svg>
      </View>
    );
  }

  if (kind === 'trail') {
    return (
      <View style={[styles.place, { backgroundColor: bg, borderColor: selected ? colors.brand : border }]}>
        <Svg width={20} height={20} viewBox="0 0 20 20">
          {/* mountain peaks */}
          <Path d="M2 17 L10 4 L18 17 Z" stroke={iconColor} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          <Path d="M6 17 L12 9.5 L16 17" stroke={iconColor} strokeWidth="1" fill="none" strokeLinejoin="round" opacity="0.5" />
        </Svg>
      </View>
    );
  }

  // center / community center
  return (
    <View style={[styles.place, { backgroundColor: bg, borderColor: selected ? colors.brand : border }]}>
      <Svg width={20} height={20} viewBox="0 0 20 20">
        {/* roof */}
        <Path d="M2 8 L10 2 L18 8" stroke={iconColor} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
        {/* building */}
        <Rect x="4" y="8" width="12" height="10" rx="0.5" stroke={iconColor} strokeWidth="1.5" fill="none" />
        {/* door */}
        <Rect x="8" y="13" width="4" height="5" rx="0.5" fill={iconColor} />
      </Svg>
    </View>
  );
}

export interface PlaceSummary {
  place: Place;
  games: Game[];
  clubs: Club[];
  sports: SportId[];
  live?: Game;
  next?: Game;
}

export function summarize(place: Place, games: Game[], clubs: Club[], sport: SportId | null, now: Date): PlaceSummary {
  const sportGames = games.filter((g) => !sport || g.sport === sport);
  return {
    place,
    games: sportGames,
    clubs: clubs.filter((c) => !sport || c.sport === sport),
    sports: place.sports.filter((s) => !sport || s === sport),
    live: sportGames.find((g) => gameStatus(g, now) === 'live'),
    next: sportGames.find((g) => {
      const status = gameStatus(g, now);
      return status === 'soon' || status === 'today';
    }),
  };
}

export function pinLabel(summary: PlaceSummary) {
  const game = summary.live ?? summary.next;
  if (!game) return null;
  const extra = summary.games.filter((g) => g.id !== game.id && gameStatus(g, new Date()) !== 'later').length;
  const base = summary.live ? 'LIVE' : time(game.start);
  return extra > 0 ? `${base} +${extra}` : base;
}

/**
 * A map marker has two layers that must never look alike:
 *  - the PLACE (park, field, courts, trail) is a calm, neutral badge that is always there;
 *  - ACTIVITY (a game live now or later today) is a loud pill that floats above it.
 * The tail tip is the bottom edge, so callers anchor it at the coordinate.
 */
export function PlacePin({ summary, selected = false }: { summary: PlaceSummary; selected?: boolean }) {
  const isLive = !!summary.live;
  const activity = summary.live ?? summary.next;
  const label = pinLabel(summary);
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!isLive || reduceMotion) return;
    pulse.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.sin) }), -1, false);
    return () => cancelAnimation(pulse);
  }, [isLive, reduceMotion, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.4 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.9 }],
  }));

  const tone = colors.brand;
  const tailColor = selected ? colors.brand : kindStyle[summary.place.kind].border;

  return (
    <View style={styles.root}>
      {isLive && activity && (
        <View style={styles.activityWrap} accessibilityLabel={`${sports[activity.sport].label} game live now`}>
          <View style={styles.liveBox}>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pulse, pulseStyle]} />
            <View style={styles.liveDot}>
              <MaterialCommunityIcons name={sports[activity.sport].icon} size={15} color={colors.white} />
            </View>
          </View>
          <View style={[styles.activityTail, { borderTopColor: colors.live }]} />
        </View>
      )}
      {!isLive && activity && label && (
        <View style={styles.activityWrap}>
          <View style={[styles.activity, { backgroundColor: tone }]}>
            <MaterialCommunityIcons name={sports[activity.sport].icon} size={14} color={colors.white} />
            <Text numberOfLines={1} style={[type.footnote, styles.activityLabel]}>
              {label}
            </Text>
          </View>
          <View style={[styles.activityTail, { borderTopColor: tone }]} />
        </View>
      )}
      <PlaceIcon kind={summary.place.kind} selected={selected} />
      <View style={[styles.placeTail, { borderTopColor: tailColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  pulse: { borderRadius: radius.full, backgroundColor: colors.live },
  liveBox: { width: 30, height: 30 },
  liveDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.live,
    borderWidth: 2,
    borderColor: colors.white,
    ...shadow.soft,
  },
  activityWrap: { alignItems: 'center', marginBottom: 4 },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    ...shadow.soft,
  },
  activityLabel: { color: colors.white, fontWeight: '700', fontVariant: ['tabular-nums'] },
  activityTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  place: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    ...shadow.soft,
  },
  placeTail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

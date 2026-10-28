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
import { colors, radius, shadow, type } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { gameStatus, placeKinds, sports, type Club, type Game, type Place, type SportId } from '../state/models';
import { time } from '../lib/format';

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

  const kind = placeKinds[summary.place.kind];
  const tone = colors.brand;

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
      <View style={[styles.place, selected && styles.placeSelected]}>
        <MaterialCommunityIcons name={kind.icon} size={17} color={selected ? colors.brand : colors.label2} />
      </View>
      <View style={styles.placeTail} />
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
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.separator,
    ...shadow.soft,
  },
  placeSelected: { borderColor: colors.brand },
  placeTail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.surface,
  },
});

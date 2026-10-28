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
import { gameStatus, type Club, type Game, type Place, type SportId } from '../state/models';
import { time } from '../lib/format';
import { SportIcon } from '../ui/Display';

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
  if (summary.live) return 'LIVE';
  if (summary.next) return time(summary.next.start);
  if (summary.clubs.length > 0) return summary.clubs.length === 1 ? '1 club' : `${summary.clubs.length} clubs`;
  return null;
}

/**
 * Map pin = a place: its sport icons plus the single most useful fact —
 * LIVE now, today's next game time, or how many clubs play there.
 * The tail tip is the bottom edge, so callers anchor it at the coordinate.
 */
export function PlacePin({ summary }: { summary: PlaceSummary }) {
  const isLive = !!summary.live;
  const label = pinLabel(summary);
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!isLive || reduceMotion) return;
    pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(pulse);
  }, [isLive, reduceMotion, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.6 }],
  }));

  return (
    <View style={styles.root}>
      <View>
        {isLive && <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pulse, pulseStyle]} />}
        <View style={[styles.bubble, { backgroundColor: isLive ? colors.live : colors.surface }]}>
          <View style={styles.icons}>
            {summary.sports.map((sport, index) => (
              <View key={sport} style={{ marginLeft: index === 0 ? 0 : -9 }}>
                <SportIcon sport={sport} size={30} ring />
              </View>
            ))}
          </View>
          {label && (
            <Text numberOfLines={1} style={[type.footnote, styles.label, { color: isLive ? colors.white : colors.label }]}>
              {label}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.tail, { borderTopColor: isLive ? colors.live : colors.surface }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  pulse: { borderRadius: radius.full, backgroundColor: colors.live },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 3,
    borderRadius: radius.full,
    ...shadow.soft,
  },
  icons: { flexDirection: 'row' },
  label: { fontWeight: '700', paddingRight: 8, fontVariant: ['tabular-nums'] },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

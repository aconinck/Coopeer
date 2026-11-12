import { useEffect, type ReactNode } from 'react';
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
import { colors, radius, shadow } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { gameStatus, placeKinds, sports, type Club, type Game, type PlaceKind, type Place, type SportId } from '../state/models';

export function PlaceIcon({ kind, selected, size = 40, icon }: { kind: PlaceKind; selected?: boolean; size?: number; icon?: ReactNode }) {
  const info = placeKinds[kind];
  return (
    <View style={[styles.place, { width: size, height: size, borderRadius: size / 2, backgroundColor: info.color }, selected && styles.placeSelected]}>
      {icon ?? <MaterialCommunityIcons name={info.icon} size={size * 0.5} color={colors.white} />}
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

const SWAP_MS = 3000;

/**
 * A map marker is the PLACE (a colored circle with its kind icon, always there). When a game is live or
 * later today, a small dot sits on its top-right corner (red + pulse for live, orange for later today) and
 * the circle's icon swaps every 3 seconds between the park icon and the icon of the sport being played.
 */
export function PlacePin({ summary, selected = false }: { summary: PlaceSummary; selected?: boolean }) {
  const isLive = !!summary.live;
  const activity = summary.live ?? summary.next;
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);
  const swap = useSharedValue(0);

  useEffect(() => {
    if (!isLive || reduceMotion) return;
    pulse.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.sin) }), -1, false);
    return () => cancelAnimation(pulse);
  }, [isLive, reduceMotion, pulse]);

  useEffect(() => {
    if (!activity || reduceMotion) {
      swap.value = 0;
      return;
    }
    let showSport = false;
    const timer = setInterval(() => {
      showSport = !showSport;
      swap.value = withTiming(showSport ? 1 : 0, { duration: 320, easing: Easing.inOut(Easing.quad) });
    }, SWAP_MS);
    return () => clearInterval(timer);
  }, [activity, reduceMotion, swap]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.1 }],
  }));
  const kindStyle = useAnimatedStyle(() => ({ opacity: 1 - swap.value, transform: [{ scale: 1 - swap.value * 0.35 }] }));
  const sportStyle = useAnimatedStyle(() => ({ opacity: swap.value, transform: [{ scale: 0.65 + swap.value * 0.35 }] }));

  const kind = placeKinds[summary.place.kind];
  const icon = activity ? (
    <View style={styles.iconStack}>
      <Animated.View style={[styles.iconLayer, kindStyle]}>
        <MaterialCommunityIcons name={kind.icon} size={20} color={colors.white} />
      </Animated.View>
      <Animated.View style={[styles.iconLayer, sportStyle]}>
        <MaterialCommunityIcons name={sports[activity.sport].icon} size={20} color={colors.white} />
      </Animated.View>
    </View>
  ) : undefined;

  return (
    <View style={styles.root} accessibilityLabel={activity ? `${summary.place.name}, ${isLive ? 'game live now' : 'game today'}` : summary.place.name}>
      <PlaceIcon kind={summary.place.kind} selected={selected} icon={icon} />
      {activity && (
        <View pointerEvents="none" style={styles.badgeBox}>
          {isLive && <Animated.View style={[StyleSheet.absoluteFill, styles.pulse, pulseStyle]} />}
          <View style={[styles.badge, { backgroundColor: isLive ? colors.live : colors.brand }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  pulse: { borderRadius: radius.full, backgroundColor: colors.live },
  iconStack: { width: 20, height: 20 },
  iconLayer: { position: 'absolute', left: 0, top: 0, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  badgeBox: { position: 'absolute', top: -3, right: -3, width: 16, height: 16 },
  badge: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.white, ...shadow.soft },
  place: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    ...shadow.soft,
  },
  placeSelected: { borderWidth: 3, shadowOpacity: 0.3, shadowRadius: 10 },
});

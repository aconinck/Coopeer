import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
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
 * Map pin = a place. Shows its sports plus the most useful fact:
 * LIVE now, the time of today's next game, or how many clubs play there.
 */
export function PlacePin({ summary, selected }: { summary: PlaceSummary; selected?: boolean }) {
  const isLive = !!summary.live;
  const label = pinLabel(summary);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLive) return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: Platform.OS !== 'web' }),
    );
    loop.start();
    return () => loop.stop();
  }, [isLive, pulse]);

  return (
    <View
      style={[styles.root, selected && styles.selected]}
      accessibilityRole="button"
      accessibilityLabel={[summary.place.name, label].filter(Boolean).join(', ')}
    >
      <View>
        {isLive && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.pulse,
              {
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
              },
            ]}
          />
        )}
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
      <Text style={styles.name} numberOfLines={1}>
        {summary.place.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  selected: { transform: [{ scale: 1.15 }] },
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
  name: {
    marginTop: 2,
    maxWidth: 140,
    fontSize: 11,
    fontWeight: '700',
    color: colors.label,
    textShadowColor: colors.white,
    textShadowRadius: 3,
  },
});

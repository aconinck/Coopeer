import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { heroImageFor } from '../src/lib/heroImage';
import { triggerCascade } from '../src/lib/firstVisit';
import { gameStatus } from '../src/state/models';
import { useStore } from '../src/state/store';
import { InviteCard } from '../src/ui/InviteCard';

const LOOP_N = 6;
const CARD_GAP = 14;
const SCROLL_DURATION = 22000;
const BG = '#0E1A0A';

export default function DiscoveryScreen() {
  const { width, height } = useWindowDimensions();
  const store = useStore();

  const CARD_W = Math.round(width * 0.55);
  const CARD_H = Math.round(CARD_W * 1.3);
  const CARD_UNIT = CARD_W + CARD_GAP;
  const loopW = useRef(LOOP_N * CARD_UNIT);

  const baseGames = store.games
    .filter((g) => !g.isCanceled && gameStatus(g, store.now) !== 'ended')
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, LOOP_N);
  const padded =
    baseGames.length > 0
      ? Array.from({ length: LOOP_N }, (_, i) => baseGames[i % baseGames.length])
      : [];
  // Duplicate for seamless horizontal loop
  const cardGames = [...padded, ...padded];

  const scrollX = useSharedValue(0);
  const cardsY = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    scrollX.value = withRepeat(
      withTiming(loopW.current, { duration: SCROLL_DURATION, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(scrollX);
  }, []);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -scrollX.value }],
  }));

  const cardsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardsY.value }],
    opacity: interpolate(cardsY.value, [0, -height * 0.25], [1, 0], Extrapolation.CLAMP),
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const handleExplore = () => {
    cancelAnimation(scrollX);
    triggerCascade();
    cardsY.value = withTiming(-height * 0.35, { duration: 360, easing: Easing.in(Easing.quad) });
    screenOpacity.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) });
    setTimeout(() => router.replace('/map'), 290);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <Animated.View style={[StyleSheet.absoluteFill, screenStyle]}>
        {/* Cards strip — outer view handles exit animation (fly up), inner clips horizontal scroll */}
        <Animated.View style={[styles.stripOuter, { marginTop: 28 }, cardsStyle]}>
          <View style={[styles.stripInner, { height: CARD_H + 48 }]}>
            <Animated.View style={[styles.track, trackStyle]}>
              {cardGames.map((game, i) => {
                const place = store.place(game.placeId);
                return (
                  <InviteCard
                    key={`${game.id}-${i}`}
                    game={game}
                    place={place}
                    club={game.clubId ? store.club(game.clubId) : undefined}
                    image={place ? heroImageFor(game, place, store.places) : null}
                    now={store.now}
                    width={CARD_W}
                    height={CARD_H}
                    onPress={() => {}}
                  />
                );
              })}
            </Animated.View>
          </View>
        </Animated.View>

        {/* Copy and CTA */}
        <View style={styles.bottom}>
          <Text style={styles.headline}>{'Find games.\nBuild your crew.\nHave fun.'}</Text>
          <Text style={styles.subhead}>Sports near you, every day.</Text>
          <Pressable
            onPress={handleExplore}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="Explore"
          >
            <Text style={styles.ctaText}>Explore</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  stripOuter: {},
  stripInner: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingHorizontal: CARD_GAP,
    alignItems: 'center',
  },
  bottom: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    gap: 10,
  },
  headline: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 48,
  },
  subhead: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.58)',
    fontWeight: '400',
  },
  cta: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaPressed: { opacity: 0.86 },
  ctaText: {
    color: BG,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

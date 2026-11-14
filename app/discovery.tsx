import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import Animated, {
  Easing,
  Extrapolation,
  FadeInDown,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { heroImageFor } from '../src/lib/heroImage';
import { triggerCascade } from '../src/lib/firstVisit';
import { gameStatus } from '../src/state/models';
import { useStore } from '../src/state/store';
import { PrimaryButton } from '../src/ui/Buttons';
import { FlowBackground } from '../src/ui/FlowBackground';
import { InviteCard } from '../src/ui/InviteCard';

const CARD_GAP = 14;
// The cards ride one big invisible wheel: each card's center sits on the circle, upright toward the outside, and
// the whole wheel turns as a single piece (one rotation drives every card, so they never move on their own).
const WHEEL_RADIUS = 1.8; // × the layout width; its center is far below the cards
const SECONDS_PER_CARD = 3.6;
const WHEEL_TOP = 36;
// The wheel sits this share of the screen height lower than the top of its area.
const WHEEL_OFFSET = 0.1;
const INK = '#1C1C1E';

export default function DiscoveryScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const reduceMotion = useReducedMotion();

  const layoutW = Math.min(width, 560);
  const CARD_W = Math.round(layoutW * 0.55);
  const CARD_H = Math.round(CARD_W * 1.3);
  const R = Math.round(layoutW * WHEEL_RADIUS);
  // Cards as many as fit around the circle without their inner edges touching; spaced evenly over 360°.
  const stepGuess = (CARD_W + CARD_GAP) / (R - CARD_H / 2);
  const count = Math.max(8, Math.floor((2 * Math.PI) / stepGuess));
  const step = 360 / count;
  // Use the actual visible content height (subtracting safe area) for proportions
  const contentH = height - insets.top - insets.bottom;
  const cardsZoneH = Math.round(contentH * 0.52);

  const baseGames = store.games
    .filter((g) => !g.isCanceled && gameStatus(g, store.now) !== 'ended')
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 8);
  const wheelGames = baseGames.length > 0 ? Array.from({ length: count }, (_, i) => baseGames[i % baseGames.length]) : [];

  const spin = useSharedValue(0);
  const cardsY = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    spin.value = 0;
    spin.value = withRepeat(withTiming(-360, { duration: count * SECONDS_PER_CARD * 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(spin);
  }, [count, reduceMotion, spin]);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const cardsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardsY.value }],
    opacity: interpolate(cardsY.value, [0, -height * 0.25], [1, 0], Extrapolation.CLAMP),
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const handleExplore = () => {
    cancelAnimation(spin);
    triggerCascade();
    cardsY.value = withTiming(-height * 0.35, { duration: 360, easing: Easing.in(Easing.quad) });
    screenOpacity.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) });
    setTimeout(() => router.replace('/map'), 290);
  };

  // How far the wheel's sides sink below its top, so the strip is tall enough not to clip the cards.
  const sink = R * (1 - Math.cos((Math.PI / 180) * step * 1.2)) + CARD_H * 0.15;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <FlowBackground progress={1} reach={0.9} />
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[StyleSheet.absoluteFill, screenStyle]}>
          {/* Upper half — the wheel of cards */}
          <Animated.View style={[{ height: cardsZoneH, justifyContent: 'center', top: Math.round(height * WHEEL_OFFSET) }, cardsStyle]}>
            <View style={[styles.strip, { height: WHEEL_TOP + CARD_H + sink }]}>
              <Animated.View
                style={[
                  styles.wheel,
                  { width: 2 * R, height: 2 * R, left: width / 2 - R, top: WHEEL_TOP + CARD_H / 2 },
                  wheelStyle,
                ]}
              >
                {wheelGames.map((game, i) => {
                  const place = store.place(game.placeId);
                  const angle = i * step;
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <View
                      key={`${game.id}-${i}`}
                      style={[
                        styles.slot,
                        {
                          width: CARD_W,
                          height: CARD_H,
                          left: R + R * Math.sin(rad) - CARD_W / 2,
                          top: R - R * Math.cos(rad) - CARD_H / 2,
                          transform: [{ rotate: `${angle}deg` }],
                        },
                      ]}
                    >
                      <InviteCard
                        game={game}
                        place={place}
                        club={game.clubId ? store.club(game.clubId) : undefined}
                        image={place ? heroImageFor(game, place) : null}
                        now={store.now}
                        width={CARD_W}
                        height={CARD_H}
                        onPress={() => {}}
                      />
                    </View>
                  );
                })}
              </Animated.View>
            </View>
          </Animated.View>

          {/* Lower half — copy and CTA, centered */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(300).springify()} style={[styles.bottom, { height: contentH - cardsZoneH }]}>
            <Text style={styles.headline}>{'Find games.\nBuild your crew.\nHave fun.'}</Text>
            <Text style={styles.subhead}>Sports near you, every day.</Text>
            <View style={styles.cta}>
              <PrimaryButton title="Explore" onPress={handleExplore} />
            </View>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFBF7' },
  safe: { flex: 1 },
  strip: { overflow: 'hidden' },
  wheel: { position: 'absolute' },
  slot: { position: 'absolute' },
  bottom: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  headline: {
    fontSize: 38,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.8,
    lineHeight: 48,
    textAlign: 'center',
  },
  subhead: {
    fontSize: 16,
    color: 'rgba(28,28,30,0.6)',
    fontWeight: '400',
    textAlign: 'center',
  },
  cta: { alignSelf: 'stretch', flexDirection: 'row', marginTop: 20 },
});

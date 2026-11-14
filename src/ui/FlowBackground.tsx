import { useEffect } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { spring } from '../constants/motion';

/** The colored glows only live in the bottom share of the screen; the top stays white (fields and titles sit there). */
const COLOR_ZONE = 0.7;

interface BlobSpec {
  color: string;
  /** Center, as a share of the color zone. */
  x: number;
  y: number;
  /** Diameter, as a share of the larger screen side. */
  size: number;
  /** Peak opacity at the center. */
  alpha: number;
  /** Drift, in px, and loop length. */
  dx: number;
  dy: number;
  duration: number;
  delay: number;
  scale: number;
}

// Sky blue, peach, orange-coral and a hint of dusk rose: the sunrise reference, mostly white.
const BLOBS: BlobSpec[] = [
  { color: '#5CB0F7', x: 0.1, y: 0.45, size: 0.85, alpha: 0.6, dx: 130, dy: 80, duration: 13000, delay: 0, scale: 1.2 },
  { color: '#FFB977', x: 0.95, y: 0.65, size: 0.8, alpha: 0.65, dx: -120, dy: 90, duration: 15000, delay: 900, scale: 1.15 },
  { color: '#F28B6B', x: 0.55, y: 1.0, size: 0.8, alpha: 0.55, dx: 140, dy: -70, duration: 17000, delay: 400, scale: 1.22 },
  { color: '#B5566B', x: 0.1, y: 1.05, size: 0.6, alpha: 0.3, dx: 110, dy: -50, duration: 19000, delay: 1600, scale: 1.15 },
];

/**
 * The sign-up and welcome backdrop: white, with large soft sunrise glows drifting slowly along the bottom 70% and
 * dissolving to white before the top, so nothing colored sits behind the title and fields. The glows are radial
 * gradients (blurred edges, cheap on web and native), blurred a little more on web. `progress` (0-1) nudges the
 * field upward as a flow advances. Honors reduced motion: the glows then stay where they start.
 */
export function FlowBackground({ progress = 0, reach = COLOR_ZONE }: { progress?: number; /** How much of the screen, from the bottom, the glows may fill (0-1). */ reach?: number }) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const shift = useSharedValue(0);
  const zoneHeight = height * reach;

  useEffect(() => {
    shift.value = reduceMotion ? progress : withSpring(progress, spring.smooth);
  }, [progress, reduceMotion, shift]);

  const field = useAnimatedStyle(() => ({ transform: [{ translateY: -shift.value * height * 0.04 }] }));
  const webBlur = (Platform.OS === 'web' ? { filter: 'blur(36px)' } : null) as ViewStyle | null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.base]}>
      <View style={[styles.zone, { height: zoneHeight }]}>
        <Animated.View style={[StyleSheet.absoluteFill, webBlur, field]}>
          {BLOBS.map((blob) => (
            <Blob key={blob.color} blob={blob} width={width} height={zoneHeight} animate={!reduceMotion} />
          ))}
        </Animated.View>
        <LinearGradient colors={['#FFFFFF', '#FFFFFFD9', '#FFFFFF00']} locations={reach > 0.8 ? [0, 0.15, 0.45] : [0, 0.3, 0.6]} style={StyleSheet.absoluteFill} />
      </View>
    </View>
  );
}

function Blob({ blob, width, height, animate }: { blob: BlobSpec; width: number; height: number; animate: boolean }) {
  const diameter = Math.max(width, height) * blob.size;
  const t = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;
    t.value = withDelay(blob.delay, withRepeat(withTiming(1, { duration: blob.duration, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [animate, blob.delay, blob.duration, t]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob.dx * t.value }, { translateY: blob.dy * t.value }, { scale: 1 + (blob.scale - 1) * t.value }],
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', left: blob.x * width - diameter / 2, top: blob.y * height - diameter / 2, width: diameter, height: diameter }, style]}
    >
      <Svg width={diameter} height={diameter}>
        <Defs>
          <RadialGradient id={`glow-${blob.color}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={blob.color} stopOpacity={blob.alpha} />
            <Stop offset="0.5" stopColor={blob.color} stopOpacity={blob.alpha * 0.4} />
            <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={diameter} height={diameter} fill={`url(#glow-${blob.color})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: '#FFFFFF' },
  zone: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
});

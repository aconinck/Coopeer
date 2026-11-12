import type { ComponentProps } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';

const STEPS = 6;

/**
 * A blur whose strength fades out along one edge. `strong` is the edge where it is strongest.
 * Web: one backdrop-filter masked by a gradient, so it is perfectly smooth. Native: stacked blur bands
 * (each blurs what is behind it, so the steps compound).
 */
export function FadingBlur({ strong, radius = 16, tint = 'light', style }: { strong: 'top' | 'bottom'; radius?: number; tint?: 'light' | 'dark'; style?: ViewStyle }) {
  if (Platform.OS === 'web') {
    const mask = `linear-gradient(to ${strong === 'top' ? 'bottom' : 'top'}, #000 35%, transparent 100%)`;
    const web = { backdropFilter: `blur(${radius}px)`, WebkitBackdropFilter: `blur(${radius}px)`, maskImage: mask, WebkitMaskImage: mask } as unknown as ViewStyle;
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, web, style]} />;
  }
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {Array.from({ length: STEPS }, (_, i) => (
        <BlurView
          key={i}
          tint={tint}
          intensity={Math.round((radius / STEPS) * 3)}
          style={[styles.band, strong === 'top' ? { top: 0 } : { bottom: 0 }, { height: `${(1 - i / STEPS) * 100}%` }]}
        />
      ))}
    </View>
  );
}

/**
 * An even, light blur over everything behind it (no fade). Web: plain backdrop-filter (the stock blur adds a
 * color-boosting saturate). Animate `style` (opacity) on this very element: an ancestor with opacity < 1
 * becomes a backdrop root and the blur would see nothing behind it.
 */
export function SoftBlur({ radius = 8, style }: { radius?: number; style?: ComponentProps<typeof Animated.View>['style'] }) {
  if (Platform.OS === 'web') {
    const web = { backdropFilter: `blur(${radius}px)`, WebkitBackdropFilter: `blur(${radius}px)`, backgroundColor: 'rgba(255,255,255,0.08)' } as unknown as ViewStyle;
    return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, web, style]} />;
  }
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <BlurView tint="light" intensity={radius * 2.5} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

/**
 * Header backdrop that fades out downward instead of a solid block: content scrolling under a header softens
 * and dissolves into the screen color. Place at the top, behind the header; `height` covers the header plus runway.
 */
export function TopBlur({ height, zIndex = 4 }: { height: number; zIndex?: number }) {
  return (
    <View pointerEvents="none" style={[styles.root, { height, zIndex }]}>
      <FadingBlur strong="top" radius={22} />
      <LinearGradient colors={[`${colors.bg}CC`, `${colors.bg}66`, `${colors.bg}00`]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, right: 0, top: 0 },
  band: { position: 'absolute', left: 0, right: 0 },
});

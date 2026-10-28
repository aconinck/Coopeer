import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { colors, radius as radii, shadow } from '../constants/theme';

let hasLiquidGlass = false;
try {
  hasLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();
} catch {
  hasLiquidGlass = false;
}

interface GlassProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** Solid-ish tint, e.g. colors.live for a live pin. */
  tint?: string;
  interactive?: boolean;
}

/**
 * Liquid Glass surface. Uses the real iOS 26 material when available,
 * and a blurred translucent fallback on older iOS, Android and web.
 */
export function Glass({ children, style, radius = radii.card, tint, interactive }: GlassProps) {
  if (hasLiquidGlass) {
    return (
      <GlassView glassEffectStyle="regular" tintColor={tint} isInteractive={interactive} style={[{ borderRadius: radius }, style]}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[shadow.glass, { borderRadius: radius }, style]}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint ?? colors.glass, opacity: tint ? 0.92 : 1 }]} />
      </View>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.glassBorder }]}
      />
      {children}
    </View>
  );
}

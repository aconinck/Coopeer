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
  /** Different radius for the bottom corners (a full-height sheet has square bottom corners). */
  bottomRadius?: number;
  /** Solid-ish tint, e.g. colors.live for a live pin. */
  tint?: string;
  interactive?: boolean;
}

/**
 * Liquid Glass surface. Uses the real iOS 26 material when available,
 * and a blurred translucent fallback on older iOS, Android and web.
 */
export function Glass({ children, style, radius = radii.card, bottomRadius = radius, tint, interactive }: GlassProps) {
  const corners = { borderTopLeftRadius: radius, borderTopRightRadius: radius, borderBottomLeftRadius: bottomRadius, borderBottomRightRadius: bottomRadius };
  if (hasLiquidGlass) {
    return (
      <GlassView glassEffectStyle="regular" tintColor={tint} isInteractive={interactive} style={[corners, style]}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[shadow.glass, corners, style]}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, corners, { overflow: 'hidden' }]}>
        {/* The radius goes on the layers too: on web a rounded parent does not clip backdrop-filter (square block). */}
        <BlurView intensity={60} tint="light" style={[StyleSheet.absoluteFill, corners]} />
        <View style={[StyleSheet.absoluteFill, corners, { backgroundColor: tint ?? colors.glass, opacity: tint ? 0.92 : 1 }]} />
      </View>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, corners, { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.glassBorder }]}
      />
      {children}
    </View>
  );
}

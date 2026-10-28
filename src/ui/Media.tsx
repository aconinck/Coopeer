import type { ReactNode } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { colors, media, type MediaAspect } from '../constants/theme';

/**
 * Frame for any image or video. Sized by a media token, clips its content and sits on a neutral
 * backdrop, so loading or mismatched media never shows black bars.
 */
export function MediaFrame({ aspect, style, children }: { aspect?: MediaAspect; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return <View style={[styles.frame, aspect && { aspectRatio: media[aspect] }, style]}>{children}</View>;
}

/** An image that always covers its frame. */
export function FillImage({ source, label }: { source: ImageSourcePropType; label?: string }) {
  return <Image source={source} resizeMode="cover" accessibilityLabel={label} accessibilityIgnoresInvertColors style={fill} />;
}

/**
 * Explicit width/height (not just absoluteFill): on web, <img>/<video> are replaced elements and
 * ignore left/right/bottom, so absoluteFill alone leaves them at their intrinsic size.
 */
export const fill = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } as const;

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', backgroundColor: colors.fill },
});

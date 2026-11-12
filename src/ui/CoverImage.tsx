import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View, type ImageSourcePropType, type ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fill } from './Media';
import { FadingBlur } from './TopBlur';

const fallback = require('../../assets/images/hero-soccer.jpg') as ImageSourcePropType;

/**
 * A blur that grows from nothing to full strength downward, over the photo it sits on (the parent clips it).
 * Web: a blurred copy of the same photo, masked to fade in (masking a backdrop-filter leaves a hard edge where it
 * starts; masking an element's own pixels does not). Native: stacked blur bands.
 */
export function ProgressiveBlurImage({ source, from = 0.2, to = 0.9, radius = 28 }: { source: ImageSourcePropType; from?: number; to?: number; radius?: number }) {
  if (Platform.OS === 'web') {
    const mask = `linear-gradient(to bottom, transparent ${from * 100}%, #000 ${to * 100}%)`;
    const copy = { filter: `blur(${radius}px)`, transform: [{ scale: 1.14 }], maskImage: mask, WebkitMaskImage: mask } as unknown as ImageStyle;
    return <Image source={source} resizeMode="cover" accessibilityIgnoresInvertColors style={[fill, copy]} />;
  }
  return <FadingBlur strong="bottom" tint="dark" radius={radius} style={{ top: `${from * 100}%` }} />;
}

/**
 * Apple Invites cover: the photo is sharp at the top, then loses opacity and gains blur as it goes down
 * until it has dissolved into `base` (the screen color), so the content below sits on a soft wash.
 */
export function CoverImage({ source, base, height }: { source: ImageSourcePropType; base: string; height: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [source]);
  const shown = failed ? fallback : source;
  return (
    <View pointerEvents="none" style={[styles.root, { height }]}>
      <Image source={shown} onError={() => setFailed(true)} resizeMode="cover" accessibilityIgnoresInvertColors style={fill} />
      <ProgressiveBlurImage source={shown} from={0.12} to={0.62} radius={26} />
      <LinearGradient
        colors={[`${base}00`, `${base}59`, `${base}CC`, base]}
        locations={[0.2, 0.42, 0.66, 0.9]}
        style={fill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
});

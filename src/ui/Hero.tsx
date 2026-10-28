import { useEffect, useState, type ReactNode } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { colors, flow, flowColors } from '../constants/theme';

const LOGO_PATHS = [
  'M686.389 475.252C686.066 509.793 686.228 540.445 684.893 570.979C684.713 575.73 678.423 582.639 673.489 584.462C615.471 605.597 557.453 626.733 498.897 646.118C464.454 657.554 449.71 646.033 447.038 609.882C445.705 591.928 445.018 573.745 442.361 555.934C438.933 532.739 428.334 526.542 405.941 532.268C404.452 532.632 403.112 533.186 401.649 533.622C357.682 546.778 335.535 576.15 335.208 621.736C335.083 638.994 335.054 656.298 334.857 673.581C334.65 695.259 304.689 712.692 280.286 717C280.286 717 279.795 657.769 280.099 630.265C280.638 582.153 281.658 534.031 281.402 485.956C281.329 471.112 285.209 462.873 300.434 458.143C334.217 447.586 385.785 433.843 419.441 422.927C450.197 412.955 460.86 420.018 464.667 452.292C466.537 467.875 466.314 483.713 466.814 499.538C467.984 535.329 481.506 545.909 515.835 534.836C555.245 522.131 594.047 507.701 633.102 493.989C649.346 488.253 665.663 482.491 686.363 475.18L686.389 475.252Z',
  'M720.975 313.936C720.677 348.548 720.839 379.2 719.602 409.781C719.396 414.46 713.127 421.2 708.193 423.023C657.363 441.62 606.435 460.17 554.995 477.043C525.584 486.702 510.336 475.358 507.426 444.707C505.707 426.808 505.215 408.717 503.184 390.848C499.881 362.517 488.926 355.314 462.056 364.156C428.451 375.216 395.248 387.184 361.845 398.818C354.873 401.28 347.901 403.743 337.191 407.525C337.565 373.128 337.369 341.922 338.813 310.783C339.002 306.514 346.76 300.784 352.197 298.783C396.034 282.818 439.998 267.211 484.17 252.42C508.976 244.145 519.77 250.435 523.8 276.246C526.575 293.934 526.395 312.181 527.005 330.148C528.175 365.94 541.816 376.397 576.161 364.914C623.259 349.252 669.823 332.08 721 314.007L720.975 313.936Z',
];

export function Logo({ size = 96, color = colors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="250 220 500 520" accessibilityLabel="Coopeer">
      {LOGO_PATHS.map((d) => (
        <Path key={d.slice(0, 12)} d={d} fill={color} />
      ))}
    </Svg>
  );
}

/** Photo + its crop inside the 390×844 frame, as placed in Figma (fractions of frame size). */
export interface HeroImage {
  source: ImageSourcePropType;
  crop: { left: number; top: number; width: number; height: number };
}

export const heroImages: Record<'welcome' | 'done', HeroImage> = {
  // Figma 5:100 — 1266×844 at x −578.5
  welcome: {
    source: require('../../assets/images/hero-soccer.jpg') as ImageSourcePropType,
    crop: { left: -578.5 / 390, top: 0, width: 1266 / 390, height: 1 },
  },
  // Figma 939:1501 — 733×1038 at (−157, −152)
  done: {
    source: require('../../assets/images/hero-welcome.jpg') as ImageSourcePropType,
    crop: { left: -157 / 390, top: -152 / 844, width: 733 / 390, height: 1038 / 844 },
  },
};

const pct = (n: number) => `${n * 100}%` as const;

/**
 * Full-bleed photo with the Figma shade (44% black → black). The photo drifts
 * slowly (Ken Burns) so the screen feels alive.
 */
export function HeroBackground({ image, shadeFrom = 0 }: { image: HeroImage; shadeFrom?: number }) {
  const reduceMotion = useReducedMotion();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    drift.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [drift, reduceMotion]);

  const photo = useAnimatedStyle(() => ({
    transform: [{ scale: 1.06 + drift.value * 0.06 }, { translateX: -8 + drift.value * 16 }, { translateY: drift.value * -10 }],
  }));

  return (
    <View style={styles.fill} pointerEvents="none">
      <Animated.View style={[styles.fill, photo]}>
        <Image
          source={image.source}
          resizeMode="cover"
          style={{
            position: 'absolute',
            left: pct(image.crop.left),
            top: pct(image.crop.top),
            width: pct(image.crop.width),
            height: pct(image.crop.height),
          }}
        />
      </Animated.View>
      <HeroShade shadeFrom={shadeFrom} />
    </View>
  );
}

function HeroShade({ shadeFrom }: { shadeFrom: number }) {
  return (
    <Svg style={styles.fill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset={shadeFrom} stopColor={flowColors.heroShadeBottom} stopOpacity={shadeFrom > 0 ? 0 : 0.44} />
          <Stop offset="1" stopColor={flowColors.heroShadeBottom} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#shade)" />
    </Svg>
  );
}

export const heroVideo = {
  source: require('../../assets/video/hero.mp4') as VideoSource,
  poster: require('../../assets/video/hero.jpg') as ImageSourcePropType,
};

/**
 * Looping, muted background clip under the Figma shade. The poster frame shows
 * instantly; the video fades in once it can play. Reduced motion keeps the poster.
 */
export function HeroVideo({ source, poster }: { source: VideoSource; poster: ImageSourcePropType }) {
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const opacity = useSharedValue(0);
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (reduceMotion) return;
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') setReady(true);
    });
    player.play();
    return () => sub.remove();
  }, [player, reduceMotion]);

  useEffect(() => {
    if (ready) opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
  }, [ready, opacity]);

  const videoStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.fill} pointerEvents="none">
      <Image source={poster} resizeMode="cover" style={styles.fill} />
      <Animated.View style={[styles.fill, videoStyle]}>
        <VideoView player={player} style={styles.fill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} />
      </Animated.View>
      <HeroShade shadeFrom={0} />
    </View>
  );
}

/** Staggered entrance for hero content: each child slides up with a short delay. */
export function HeroItem({ index, children }: { index: number; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(120 + index * 90).springify().damping(18).stiffness(140)}>
      {children}
    </Animated.View>
  );
}

/** Figma "_button/main": 316×64 pill. `variant="text"` is the orange text button under it. */
export function HeroButton({
  title,
  onPress,
  variant = 'filled',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'text';
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const filled = variant === 'filled';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
    >
      <Animated.View style={[styles.cta, filled && styles.ctaFilled, disabled && { opacity: 0.6 }, style]}>
        <Text style={[flow.heroCta, { color: filled ? colors.white : colors.brand }]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  cta: {
    width: flow.ctaWidth,
    maxWidth: '100%',
    height: flow.ctaHeight,
    borderRadius: flow.ctaHeight / 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  ctaFilled: { backgroundColor: colors.brand },
});

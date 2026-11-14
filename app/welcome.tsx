import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, useReducedMotion, ZoomIn } from 'react-native-reanimated';
import { spring } from '../src/constants/motion';
import { colors, flow, space, type } from '../src/constants/theme';
import { PrimaryButton } from '../src/ui/Buttons';
import { HeroItem, HeroVideo, Logo, heroVideo } from '../src/ui/Hero';

const MEDIA_SHARE = 0.7;

/**
 * Welcome: splash (logo on white) → the looping clip across the top, fading into a white screen with a centered
 * title, a quiet subtitle and one button underneath.
 */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [splash, setSplash] = useState(!reduceMotion);
  const mediaHeight = Math.round(height * MEDIA_SHARE);

  useEffect(() => {
    if (!splash) return;
    const timer = setTimeout(() => setSplash(false), 900);
    return () => clearTimeout(timer);
  }, [splash]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.media, { height: mediaHeight }]} pointerEvents="none">
        <HeroVideo source={heroVideo.source} poster={heroVideo.poster} mono shade={false} />
        <LinearGradient
          colors={[`${colors.white}00`, `${colors.white}CC`, colors.white]}
          locations={[0.55, 0.85, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {!splash && (
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }]}>
          <HeroItem index={0}>
            <Text style={[flow.heroTitle, styles.title]}>Discover a{'\n'}new world!</Text>
          </HeroItem>
          <HeroItem index={1}>
            <Text style={[type.callout, styles.body]}>Don&apos;t be alone! Find a group to enjoy your favorite sport!</Text>
          </HeroItem>
          <HeroItem index={2}>
            <View style={styles.action}>
              <PrimaryButton title="Get started" onPress={() => router.push('/auth?from=welcome')} />
            </View>
          </HeroItem>
        </View>
      )}

      {splash && (
        <Animated.View style={styles.splash} exiting={FadeOut.duration(260)}>
          <Animated.View
            entering={ZoomIn.withInitialValues({ transform: [{ scale: 0.96 }] })
              .springify()
              .mass(1)
              .stiffness(spring.smooth.stiffness)
              .damping(spring.smooth.damping)}
          >
            <Animated.View entering={FadeIn.duration(300)}>
              <Logo size={72} />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  media: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  content: { flex: 1, justifyContent: 'flex-end', alignItems: 'stretch', paddingHorizontal: space.lg, gap: space.sm },
  title: { color: colors.label, textAlign: 'center' },
  body: { color: colors.label2, textAlign: 'center', paddingHorizontal: space.md },
  action: { alignSelf: 'stretch', flexDirection: 'row', marginTop: space.lg },
  splash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
});

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeOut, useReducedMotion, ZoomIn } from 'react-native-reanimated';
import { colors, flow } from '../src/constants/theme';
import { HeroButton, HeroItem, HeroVideo, Logo, heroVideo } from '../src/ui/Hero';

/** Figma Login: splash (logo on white) → looping hero video with "Discover a new world!" and Get started. */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [splash, setSplash] = useState(!reduceMotion);

  useEffect(() => {
    if (!splash) return;
    const timer = setTimeout(() => setSplash(false), 900);
    return () => clearTimeout(timer);
  }, [splash]);

  return (
    <View style={styles.root}>
      <StatusBar style={splash ? 'dark' : 'light'} />
      <HeroVideo source={heroVideo.source} poster={heroVideo.poster} />

      {!splash && (
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 34) + 45 }]}>
          <HeroItem index={0}>
            <Text style={[flow.heroTitle, styles.title]}>Discover a{'\n'}new world!</Text>
          </HeroItem>
          <HeroItem index={1}>
            <Text style={[flow.heroBody, styles.body]}>Don&apos;t be alone! Find a group to enjoy your favorite sport!</Text>
          </HeroItem>
          <View style={styles.actions}>
            <HeroItem index={2}>
              <HeroButton title="Get started" onPress={() => router.push('/auth?from=welcome')} />
            </HeroItem>
          </View>
        </View>
      )}

      {splash && (
        <Animated.View style={styles.splash} exiting={FadeOut.duration(260)}>
          <Animated.View entering={ZoomIn.springify().damping(12)}>
            <Logo size={72} />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: flow.heroGutter },
  title: { color: colors.white, maxWidth: 260 },
  body: { color: colors.white, maxWidth: 230, marginTop: 12 },
  actions: { marginTop: 44 },
  splash: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
});

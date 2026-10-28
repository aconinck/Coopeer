import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../constants/theme';
import { timing } from '../constants/motion';
import { Glass } from '../ui/Glass';
import { clips } from './media';
import type { ClipName } from './posts';

/**
 * 4:5 looping clip. Plays only while `active` (mostly on screen and tab focused);
 * the poster stays until the first frame plays. Tap toggles sound.
 */
export function FeedClip({ clip, tag, active }: { clip: ClipName; tag: string; active: boolean }) {
  const media = clips[clip];
  const reduceMotion = useReducedMotion();
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const player = useVideoPlayer(media.video, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    const sub = player.addListener('playingChange', ({ isPlaying }) => setPlaying(isPlaying));
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    if (active && !reduceMotion) player.play();
    else player.pause();
  }, [active, reduceMotion, player]);

  const posterOpacity = useSharedValue(1);
  useEffect(() => {
    if (playing) posterOpacity.value = withTiming(0, timing.fade);
  }, [playing, posterOpacity]);
  const posterStyle = useAnimatedStyle(() => ({ opacity: posterOpacity.value }));

  const toggleSound = () => {
    const next = !muted;
    player.muted = next;
    setMuted(next);
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={muted ? 'Unmute clip' : 'Mute clip'} onPress={toggleSound} style={styles.media}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, posterStyle]}>
        <Image source={media.poster} resizeMode="cover" style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={styles.tag} pointerEvents="none">
        <Text style={[type.caption2, styles.tagText]}>{tag}</Text>
      </View>
      <Glass radius={radius.full} style={styles.sound}>
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={16} color={colors.label} />
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  media: { width: '100%', aspectRatio: 4 / 5, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.black },
  tag: {
    position: 'absolute',
    left: space.md,
    top: space.md,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
  },
  tagText: { color: colors.white, fontWeight: '800' },
  sound: { position: 'absolute', right: space.md, bottom: space.md, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});

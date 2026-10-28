import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { colors, layout, radius, space, type } from '../constants/theme';
import { spring } from '../constants/motion';
import { haptic } from '../ui/Buttons';
import { Glass } from '../ui/Glass';
import { Segmented, type SegmentOption } from '../ui/Segmented';
import { useTourTarget } from '../tour/Tour';

export type MapMode = 'all' | 'clubs' | 'matches';

const modes: SegmentOption<MapMode>[] = [
  { value: 'all', label: 'All' },
  { value: 'clubs', label: 'Clubs' },
  { value: 'matches', label: 'Matches' },
];

/** Top of the map: what to show (All | Clubs | Matches) and an independent "Happening now" switch. */
export function MapTopBar({
  mode,
  onModeChange,
  now,
  onNowChange,
}: {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  now: boolean;
  onNowChange: (now: boolean) => void;
}) {
  const tourRef = useTourTarget('modes');
  return (
    <View style={styles.row} pointerEvents="box-none">
      <View ref={tourRef} collapsable={false}>
      <Glass radius={radius.full} style={styles.capsule}>
        <Segmented options={modes} value={mode} onChange={onModeChange} bare size="large" style={styles.segment} />
        <View style={styles.divider} />
        <NowToggle on={now} onChange={onNowChange} />
      </Glass>
      </View>
    </View>
  );
}

function NowToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const reduceMotion = useReducedMotion();
  const fill = useSharedValue(on ? 1 : 0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    fill.value = reduceMotion ? (on ? 1 : 0) : withSpring(on ? 1 : 0, spring.snappy);
  }, [on, fill, reduceMotion]);

  useEffect(() => {
    if (!on || reduceMotion) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(pulse);
  }, [on, pulse, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({ opacity: fill.value }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 1.4 }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Happening now"
      accessibilityState={{ checked: on }}
      onPress={() => {
        haptic.selection();
        onChange(!on);
      }}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <View style={styles.toggle}>
        <Animated.View pointerEvents="none" style={[styles.toggleFill, fillStyle]} />
        <View style={styles.dotBox}>
          {on && <Animated.View style={[styles.halo, haloStyle]} />}
          <View style={[styles.dot, { backgroundColor: on ? colors.white : colors.live }]} />
        </View>
        <Text style={[type.callout, styles.toggleLabel, { color: on ? colors.white : colors.label }]}>Now</Text>
      </View>
    </Pressable>
  );
}

/** Track 50 = 42 thumb + 4 padding: the Now pill is the same height as the thumb but lives outside the segment, past a hairline. */
const PAD = 4;
const HEIGHT = 42;

const styles = StyleSheet.create({
  row: { paddingHorizontal: layout.gutter },
  capsule: { flexDirection: 'row', alignItems: 'center', padding: PAD - 3, paddingRight: PAD, overflow: 'hidden' },
  segment: { flex: 1 },
  divider: { width: StyleSheet.hairlineWidth, height: 22, backgroundColor: colors.separator, marginHorizontal: space.sm },
  toggle: { height: HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: colors.fill, overflow: 'hidden' },
  toggleFill: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.live, borderRadius: radius.full },
  toggleLabel: { fontWeight: '600' },
  dotBox: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  halo: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  pressed: { opacity: 0.8 },
});

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type } from '../constants/theme';
import { spring } from '../constants/motion';
import type { RSVP } from '../state/models';
import { haptic } from './Buttons';

type Choice = Exclude<RSVP, 'none'>;
type IconName = keyof typeof Ionicons.glyphMap;

const choices: { value: Choice; title: string; on: IconName; off: IconName; tone: string; idle: string }[] = [
  { value: 'going', title: 'Going', on: 'checkmark-circle', off: 'checkmark-circle-outline', tone: colors.going, idle: 'rgba(255,255,255,0.92)' },
  { value: 'declined', title: 'Not Going', on: 'close-circle', off: 'close-circle-outline', tone: colors.live, idle: '#FF6B61' },
  { value: 'maybe', title: 'Maybe', on: 'help-circle', off: 'help-circle-outline', tone: '#8E6CF0', idle: 'rgba(255,255,255,0.92)' },
];

const PAD = 6;
const HEIGHT = 78;

/**
 * The Apple Invites reply control: a dark translucent capsule with Going / Not Going / Maybe. The chosen answer
 * is a soft white pill (colored icon and label) that glides between segments; thin dividers separate the rest.
 * Tap the chosen answer again to clear it.
 */
export function RSVPCapsule({ value, onChange, disabled, tone = 'dark' }: { value: RSVP; onChange: (next: RSVP) => void; disabled?: boolean; tone?: 'dark' | 'light' }) {
  const light = tone === 'light';
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = choices.findIndex((c) => c.value === value);
  const x = useSharedValue(Math.max(index, 0));
  const shown = useSharedValue(index >= 0 ? 1 : 0);
  const segment = width > 0 ? (width - PAD * 2) / choices.length : 0;

  useEffect(() => {
    if (index >= 0) x.value = reduceMotion ? index : withSpring(index, spring.smooth);
    shown.value = reduceMotion ? (index >= 0 ? 1 : 0) : withSpring(index >= 0 ? 1 : 0, spring.smooth);
  }, [index, reduceMotion, x, shown]);

  const pillStyle = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateX: x.value * segment }] }));

  return (
    <View style={[styles.capsule, light && styles.capsuleLight, disabled && styles.disabled]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="radiogroup">
      {segment > 0 && <Animated.View pointerEvents="none" style={[styles.pill, light && styles.pillLight, { width: segment }, pillStyle]} />}
      {segment > 0 &&
        [1, 2].map((boundary) => (
          <View
            key={boundary}
            pointerEvents="none"
            style={[styles.divider, { left: PAD + segment * boundary }, (index === boundary || index === boundary - 1) && styles.hidden]}
          />
        ))}
      {choices.map((choice) => {
        const selected = choice.value === value;
        return (
          <Pressable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => {
              if (choice.value === 'going' && !selected) haptic.success();
              else haptic.selection();
              onChange(selected ? 'none' : choice.value);
            }}
            style={styles.segment}
          >
            <Ionicons name={selected ? choice.on : choice.off} size={26} color={selected ? choice.tone : light && choice.value !== 'declined' ? colors.label2 : choice.idle} />
            <Text style={[type.subhead, styles.title, { color: selected ? choice.tone : light ? colors.label : colors.white }]}>{choice.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    height: HEIGHT,
    flexDirection: 'row',
    padding: PAD,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  capsuleLight: { backgroundColor: 'rgba(0,0,0,0.05)', borderColor: 'rgba(0,0,0,0.08)' },
  pillLight: { backgroundColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  disabled: { opacity: 0.5 },
  pill: { position: 'absolute', top: PAD, bottom: PAD, left: PAD, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.94)' },
  divider: { position: 'absolute', top: 22, bottom: 22, width: StyleSheet.hairlineWidth * 2, backgroundColor: 'rgba(255,60,48,0.55)' },
  hidden: { opacity: 0 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  title: { fontWeight: '700' },
});

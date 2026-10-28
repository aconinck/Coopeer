import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, radius, space, type } from '../constants/theme';
import { Glass } from './Glass';

// Action placement rules (same on every screen):
// 1. A screen's main action lives in the bottom ActionBar: [secondary] [PRIMARY].
// 2. Step-by-step flows (login, team code) use the round NextButton bottom-right.
// 3. The top-right header holds at most one control: "+" to add, "…" for more.
// 4. Places and clubs open as pages; games always open as a sheet.
// 5. Destructive actions always ask for confirmation.

export type IconName = ComponentProps<typeof Ionicons>['name'];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_IN = { damping: 18, stiffness: 420 } as const;
const PRESS_OUT = { damping: 9, stiffness: 260 } as const;

export const haptic = {
  light: () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  selection: () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  },
  success: () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
};

/** Spring "squish" on press-in, slight overshoot on release. */
export function usePressScale(to = 0.96, dim = 1) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * (1 - dim),
    transform: [{ scale: 1 - pressed.value * (1 - to) }],
  }));
  return {
    style,
    onPressIn: () => {
      pressed.value = reduceMotion ? 1 : withSpring(1, PRESS_IN);
    },
    onPressOut: () => {
      pressed.value = reduceMotion ? 0 : withSpring(0, PRESS_OUT);
    },
  };
}

interface ButtonProps {
  title: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PrimaryButton({ title, icon, onPress, disabled, loading, success }: ButtonProps & { success?: boolean }) {
  const inactive = disabled || loading || success;
  const press = usePressScale(0.96);
  const tint = useSharedValue(success ? 1 : 0);

  useEffect(() => {
    tint.value = withSpring(success ? 1 : 0, { damping: 16, stiffness: 180 });
  }, [success, tint]);

  const bg = useAnimatedStyle(() => ({
    backgroundColor: disabled && !success ? colors.gray3 : interpolateColor(tint.value, [0, 1], [colors.brand, colors.going]),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={inactive}
      style={[styles.button, bg, press.style]}
    >
      {success ? (
        <Animated.View key="success" entering={ZoomIn.springify().damping(12)} style={styles.row}>
          <Ionicons name="checkmark-circle" size={20} color={colors.white} />
          <Text style={[type.headline, styles.white]}>{title}</Text>
        </Animated.View>
      ) : loading ? (
        <Animated.View key="loading" entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
          <ActivityIndicator color={colors.white} />
        </Animated.View>
      ) : (
        <Animated.View key="label" entering={FadeIn.duration(160)} style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={colors.white} />}
          <Text style={[type.headline, styles.white]}>{title}</Text>
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}

export function SecondaryButton({ title, icon, onPress, disabled, destructive }: ButtonProps & { destructive?: boolean }) {
  const color = destructive ? colors.live : colors.label;
  const press = usePressScale(0.96);
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      style={[styles.button, { backgroundColor: colors.fill }, disabled && { opacity: 0.45 }, press.style]}
    >
      <View style={styles.row}>
        {icon && <Ionicons name={icon} size={18} color={color} />}
        <Text style={[type.headline, { color }]}>{title}</Text>
      </View>
    </AnimatedPressable>
  );
}

/** The bottom glass bar that holds a screen's main actions. */
export function ActionBar({ caption, children }: { caption?: string | null; children?: ReactNode }) {
  return (
    <Glass radius={radius.sheet} style={styles.actionBar}>
      {caption ? (
        <Animated.Text key={caption} entering={FadeIn.duration(220)} style={[type.footnote, styles.caption]}>
          {caption}
        </Animated.Text>
      ) : null}
      {children ? <View style={styles.actionRow}>{children}</View> : null}
    </Glass>
  );
}

export function NextButton({ enabled, loading, onPress }: { enabled: boolean; loading?: boolean; onPress: () => void }) {
  const press = usePressScale(0.92);
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Continue"
      accessibilityState={{ disabled: !enabled, busy: !!loading }}
      disabled={!enabled || loading}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.next, { backgroundColor: enabled ? colors.brand : colors.gray3 }, press.style]}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Ionicons name="arrow-forward" size={26} color={colors.white} />}
    </AnimatedPressable>
  );
}

/** Round glass button for headers and map controls. */
export function IconButton({ icon, label, onPress, tint }: { icon: IconName; label: string; onPress: () => void; tint?: string }) {
  const press = usePressScale(0.9);
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={6}
      style={press.style}
    >
      <Glass radius={radius.full} style={styles.iconButton} interactive>
        <Ionicons name={icon} size={20} color={tint ?? colors.label} />
      </Glass>
    </AnimatedPressable>
  );
}

export function Chip({
  title,
  icon,
  color = colors.brand,
  selected,
  onPress,
}: {
  title: string;
  icon?: ReactNode;
  color?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const press = usePressScale(0.94);
  const reduceMotion = useReducedMotion();
  const on = useSharedValue(selected ? 1 : 0);
  const iconPop = useSharedValue(1);

  useEffect(() => {
    on.value = withTiming(selected ? 1 : 0, { duration: 180 });
    if (selected && !reduceMotion) iconPop.value = withSequence(withSpring(1.3, { damping: 8, stiffness: 400 }), withSpring(1, { damping: 10 }));
  }, [selected, on, iconPop, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: on.value,
    transform: [{ scale: 0.85 + on.value * 0.15 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconPop.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.chip, press.style]}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.chipFill, { backgroundColor: color }, fillStyle]} />
      {icon ? <Animated.View style={iconStyle}>{icon}</Animated.View> : null}
      <Text style={[type.subhead, { fontWeight: '600', color: selected ? colors.white : colors.label }]}>{title}</Text>
    </AnimatedPressable>
  );
}

export function TextButton({ title, onPress, disabled, color = colors.brand }: { title: string; onPress: () => void; disabled?: boolean; color?: string }) {
  const press = usePressScale(0.94, 0.6);
  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      hitSlop={8}
      style={press.style}
    >
      <Text style={[type.subhead, { fontWeight: '600', color: disabled ? colors.label3 : color }]}>{title}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: layout.control,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  white: { color: colors.white },
  actionBar: { padding: space.sm, gap: space.sm },
  caption: { color: colors.label2, textAlign: 'center', paddingTop: space.xs, paddingHorizontal: space.md },
  actionRow: { flexDirection: 'row', gap: space.sm },
  next: { width: 60, height: 60, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: layout.iconButton, height: layout.iconButton, alignItems: 'center', justifyContent: 'center' },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.fill,
    overflow: 'hidden',
  },
  chipFill: { borderRadius: radius.full },
});

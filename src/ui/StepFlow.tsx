import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInLeft,
  FadeInRight,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { colors, flow, flowColors, space, type } from '../constants/theme';

const isNative = Platform.OS !== 'web';
const snappy = { damping: 18, stiffness: 260, mass: 0.7 };

// Progress persists across step screens so the bar animates from where it was.
let lastProgress = 0;

/**
 * One step of a flow (login, team code), sized from the Figma frames: bare back
 * arrow + progress bar, 36pt title, underline input, 64pt round Next button.
 */
export function StepScaffold({
  title,
  subtitle,
  progress,
  canContinue,
  loading,
  success,
  onNext,
  onBack,
  backIcon = 'arrow-back',
  direction = 'forward',
  children,
}: {
  title: string;
  subtitle?: string;
  progress: number;
  canContinue: boolean;
  loading?: boolean;
  /** Briefly morphs the Next arrow into a checkmark before advancing. */
  success?: boolean;
  onNext: () => void;
  onBack: () => void;
  backIcon?: 'arrow-back' | 'close';
  /** Which way the content slides in. */
  direction?: 'forward' | 'back';
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const keyboardUp = useKeyboardVisible();
  const entering = reduceMotion
    ? undefined
    : (direction === 'forward' ? FadeInRight : FadeInLeft).springify().damping(20).stiffness(180);

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top + flow.headerTop }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backIcon === 'close' ? 'Close' : 'Back'}
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name={backIcon} size={backIcon === 'close' ? 22 : 20} color={colors.label} />
        </Pressable>
        <StepProgress value={progress} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bounces={false}>
        <Animated.View entering={entering}>
          <Text style={[flow.title, { color: colors.label }]}>{title}</Text>
          {subtitle ? <Text style={[type.callout, styles.subtitle]}>{subtitle}</Text> : null}
          <View style={styles.fields}>{children}</View>
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: keyboardUp ? flow.nextKeyboardGap : Math.max(insets.bottom, space.lg) + space.sm },
        ]}
      >
        <StepNextButton enabled={canContinue} loading={loading} success={success} onPress={onNext} />
      </View>
    </KeyboardAvoidingView>
  );
}

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!isNative) return;
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/** Thin black-on-gray bar that springs to its new value. */
export function StepProgress({ value }: { value: number }) {
  const clamped = Math.min(Math.max(value, 0), 1);
  const width = useSharedValue(lastProgress);
  useEffect(() => {
    width.value = withSpring(clamped, { damping: 20, stiffness: 120 });
    lastProgress = clamped;
  }, [clamped, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

/** 64pt round Next button: springs alive when enabled, squishes on press, morphs to a check on success. */
export function StepNextButton({
  enabled,
  loading,
  success,
  onPress,
}: {
  enabled: boolean;
  loading?: boolean;
  success?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const active = useSharedValue(enabled ? 1 : 0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    active.value = withTiming(enabled || success ? 1 : 0, { duration: 180 });
    if (enabled && !reduceMotion) scale.value = withSequence(withSpring(1.12, snappy), withSpring(1, snappy));
  }, [enabled, success, active, scale, reduceMotion]);

  useEffect(() => {
    if (success && !reduceMotion) scale.value = withSequence(withSpring(1.15, snappy), withSpring(1, snappy));
  }, [success, scale, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(active.value, [0, 1], [colors.gray3, colors.brand]),
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue"
      accessibilityState={{ disabled: !enabled, busy: !!loading }}
      disabled={!enabled || loading || success}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.92, snappy);
        if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, snappy);
      }}
    >
      <Animated.View style={[styles.next, style]}>
        {success ? (
          <Animated.View key="check" entering={reduceMotion ? undefined : ZoomIn.springify().damping(12)}>
            <Ionicons name="checkmark" size={30} color={colors.white} />
          </Animated.View>
        ) : loading ? (
          <Spinner />
        ) : (
          <Ionicons name="arrow-forward" size={26} color={colors.white} />
        )}
      </Animated.View>
    </Pressable>
  );
}

function Spinner() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 800 }), -1, false);
  }, [rotation]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return <Animated.View style={[styles.spinner, style]} accessibilityLabel="Loading" />;
}

/** Underline-only input (Figma: 24pt semibold, no box). The underline lights up on focus. */
export function UnderlineField({
  prefix,
  error,
  onFocus,
  onBlur,
  autoFocus = true,
  ...props
}: TextInputProps & { prefix?: string; error?: boolean }) {
  const input = useRef<TextInput>(null);
  const focus = useSharedValue(0);

  // Focus after the entrance animation; a plain autoFocus is lost while the view animates in.
  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => input.current?.focus(), 320);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  const line = useAnimatedStyle(() => ({
    backgroundColor: error ? colors.live : interpolateColor(focus.value, [0, 1], [flowColors.track, colors.label]),
    transform: [{ scaleY: 1 + focus.value }],
  }));
  const shake = useShake(!!error);

  return (
    <Animated.View style={shake}>
      <View style={styles.inputRow}>
        {prefix ? <Text style={[flow.input, { color: colors.label2 }]}>{prefix}</Text> : null}
        <TextInput
          ref={input}
          placeholderTextColor={colors.label3}
          style={[flow.input, styles.input]}
          onFocus={(e) => {
            focus.value = withTiming(1, { duration: 200 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.value = withTiming(0, { duration: 200 });
            onBlur?.(e);
          }}
          {...props}
        />
      </View>
      <Animated.View style={[styles.line, line]} />
    </Animated.View>
  );
}

/** Horizontal shake + error haptic whenever `error` turns true. */
function useShake(error: boolean) {
  const x = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!error) return;
    if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (reduceMotion) return;
    const t = (to: number) => withTiming(to, { duration: 55 });
    x.value = withSequence(t(-12), t(12), t(-9), t(9), t(-4), t(0));
  }, [error, x, reduceMotion]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
}

/** Big grouped digits ("12 35 56 54"): each typed digit pops in; red + shake on error. */
export function CodeField({
  value,
  onChange,
  length,
  groupSize = 2,
  error,
  oneTimeCode,
}: {
  value: string;
  onChange: (code: string) => void;
  length: number;
  groupSize?: number;
  error?: boolean;
  oneTimeCode?: boolean;
}) {
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const complete = value.length === length;
  const shake = useShake(!!error);
  const lineState = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => input.current?.focus(), 320);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    lineState.value = withTiming(error ? 2 : complete ? 1 : 0, { duration: 220 });
  }, [error, complete, lineState]);

  const line = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(lineState.value, [0, 1, 2], [flowColors.track, colors.brand, colors.live]),
  }));

  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel={`Code, ${value.length} of ${length} digits`}>
      <Animated.View style={[styles.digits, shake]}>
        {Array.from({ length }, (_, i) => (
          <Digit
            key={i}
            char={value[i]}
            gap={i > 0 && i % groupSize === 0}
            color={error ? colors.live : colors.brand}
            isNext={focused && i === value.length}
          />
        ))}
      </Animated.View>
      <Animated.View style={[styles.line, line]} />
      <TextInput
        ref={input}
        value={value}
        onChangeText={(text) => {
          const next = text.replace(/\D/g, '').slice(0, length);
          if (isNative && next.length > value.length) Haptics.selectionAsync();
          onChange(next);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType={oneTimeCode ? 'oneTimeCode' : 'none'}
        autoComplete={oneTimeCode ? 'sms-otp' : 'off'}
        maxLength={length}
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

function Digit({ char, gap, color, isNext }: { char?: string; gap: boolean; color: string; isNext: boolean }) {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (char && !reduceMotion) {
      scale.value = 0.6;
      scale.value = withSpring(1, { damping: 10, stiffness: 320, mass: 0.6 });
    }
  }, [char, scale, reduceMotion]);

  useEffect(() => {
    if (isNext && !reduceMotion) {
      pulse.value = withRepeat(withSequence(withTiming(0.35, { duration: 520 }), withTiming(1, { duration: 520 })), -1);
    } else {
      pulse.value = withTiming(1, { duration: 120 });
    }
  }, [isNext, pulse, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: char ? 1 : pulse.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[flow.code, styles.digit, gap && styles.digitGap, { color: char ? color : colors.gray3 }, style]}>
      {char ?? '0'}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: flow.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: flow.backLeft,
    paddingRight: flow.backLeft,
    gap: 12,
  },
  back: { width: 20, alignItems: 'flex-start' },
  track: { flex: 1, height: flow.progressHeight, borderRadius: 2, backgroundColor: flowColors.track, overflow: 'hidden' },
  fill: { height: flow.progressHeight, backgroundColor: colors.label, borderRadius: 2 },
  content: { paddingLeft: flow.gutterLeft, paddingRight: flow.gutterRight, paddingTop: flow.titleGap },
  subtitle: { color: colors.label2, marginTop: space.sm },
  fields: { marginTop: flow.fieldGap, gap: space.md },
  footer: { alignItems: 'flex-end', paddingRight: flow.nextRight, paddingTop: space.sm },
  next: { width: flow.nextSize, height: flow.nextSize, borderRadius: flow.nextSize / 2, alignItems: 'center', justifyContent: 'center' },
  spinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: flowColors.spinnerTrack,
    borderTopColor: colors.white,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingBottom: 10 },
  input: { flex: 1, minWidth: 0, color: colors.label, paddingVertical: 0, outlineStyle: 'none' } as never,
  line: { height: 1, borderRadius: 1 },
  digits: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 6 },
  digit: { textAlign: 'center', minWidth: 24 },
  digitGap: { marginLeft: 14 },
  hiddenInput: { position: 'absolute', opacity: 0, width: '100%', height: '100%' },
});

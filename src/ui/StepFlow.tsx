import { useEffect, useRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, type } from '../constants/theme';
import { IconButton, NextButton } from './Buttons';

/**
 * One step of a flow (login, team code), matching the Figma: back arrow + progress
 * bar, big title, underline input, round orange Next button bottom-right.
 */
export function StepScaffold({
  title,
  subtitle,
  progress,
  canContinue,
  loading,
  onNext,
  onBack,
  backIcon = 'arrow-back',
  children,
}: {
  title: string;
  subtitle?: string;
  progress: number;
  canContinue: boolean;
  loading?: boolean;
  onNext: () => void;
  onBack: () => void;
  backIcon?: 'arrow-back' | 'close';
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + space.sm }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <IconButton icon={backIcon} label={backIcon === 'close' ? 'Close' : 'Back'} onPress={onBack} />
        <View style={styles.track} accessibilityLabel={`Step progress ${Math.round(progress * 100)} percent`}>
          <View style={[styles.fill, { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }]} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.largeTitle}>{title}</Text>
        {subtitle ? <Text style={[type.body, { color: colors.label2 }]}>{subtitle}</Text> : null}
        <View style={{ marginTop: space.xl, gap: space.md }}>{children}</View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <NextButton enabled={canContinue} loading={loading} onPress={onNext} />
      </View>
    </KeyboardAvoidingView>
  );
}

/** Underline-only input (Figma: no box borders). */
export function UnderlineField({
  prefix,
  error,
  ...props
}: TextInputProps & { prefix?: string; error?: boolean }) {
  return (
    <View style={[styles.underline, { borderBottomColor: error ? colors.live : colors.separator }]}>
      {prefix ? <Text style={[type.title2, { color: colors.label2, fontWeight: '500' }]}>{prefix}</Text> : null}
      <TextInput
        autoFocus
        placeholderTextColor={colors.label3}
        style={[type.title2, styles.input]}
        {...props}
      />
    </View>
  );
}

/** Big grouped digits ("12 35 56 54"): typed digits turn orange, red on error. */
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
  useEffect(() => {
    const timer = setTimeout(() => input.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, []);

  const digits = Array.from({ length }, (_, i) => value[i]);
  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel="Code" style={[styles.underline, { borderBottomColor: error ? colors.live : colors.separator, justifyContent: 'center' }]}>
      <Text style={type.code}>
        {digits.map((digit, i) => (
          <Text key={i} style={{ color: digit ? (error ? colors.live : colors.brand) : colors.gray3 }}>
            {i > 0 && i % groupSize === 0 ? ' ' : ''}
            {digit ?? '0'}
          </Text>
        ))}
      </Text>
      <TextInput
        ref={input}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: space.lg },
  track: { flex: 1, height: 3, borderRadius: radius.full, backgroundColor: colors.fill2, overflow: 'hidden', marginRight: 56 },
  fill: { height: 3, backgroundColor: colors.label },
  content: { paddingHorizontal: space.xl, paddingTop: space.xl, gap: space.sm },
  footer: { alignItems: 'flex-end', paddingHorizontal: space.xl, paddingTop: space.sm },
  underline: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderBottomWidth: 1, paddingVertical: space.sm },
  input: { flex: 1, minWidth: 0, color: colors.label, fontWeight: '500', paddingVertical: 0, outlineStyle: 'none' } as never,
  hiddenInput: { position: 'absolute', opacity: 0, width: '100%', height: '100%' },
});

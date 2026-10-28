import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { colors, flow, flowColors, radius, space, type } from '../constants/theme';
import { spring, timing } from '../constants/motion';

// Small building blocks for the creator flows (Figma "Criando Equipe" / "Criando Partida").

export const haptics = {
  selection: () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  },
  success: () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
};

/** Figma field label: 14pt gray, sits right above its underline input. */
export function FieldLabel({ children }: { children: string }) {
  return <Text style={[type.footnote, styles.label]}>{children}</Text>;
}

/** Figma category chip (29pt pill): light orange, solid orange when selected. */
export function ChoiceChip({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        if (!selected) haptics.selection();
        onPress();
      }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[type.subhead, styles.chipText, selected && { color: colors.white }]}>{title}</Text>
    </Pressable>
  );
}

/** Figma secondary CTA under the main pill: light orange fill, orange label. */
export function LightPill({ title, onPress, compact }: { title: string; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.lightPill, compact && styles.lightPillCompact, pressed && styles.pressed]}
    >
      <Text style={[compact ? type.subhead : flow.heroCta, { color: colors.brand, fontWeight: '700' }]}>{title}</Text>
    </Pressable>
  );
}

/** 73pt check badge from the "All set!" frame. */
export function CheckBadge() {
  return (
    <View style={styles.badgeOuter} accessibilityLabel="Done">
      <View style={styles.badgeInner}>
        <Ionicons name="checkmark" size={26} color={colors.white} />
      </View>
    </View>
  );
}

/** Figma "Código do Clube": four 79pt boxes, two digits each. */
export function CodeBoxes({ code }: { code: string }) {
  const pairs = code.match(/\d{2}/g) ?? [];
  return (
    <View style={styles.codeRow} accessibilityLabel={`Club code ${code.split('').join(' ')}`}>
      {pairs.map((pair, i) => (
        <View key={i} style={styles.codeBox}>
          <Text selectable style={styles.codeText}>
            {pair}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Row used inside option sheets: label (+ detail) and a checkmark when selected. */
export function OptionRow({
  title,
  detail,
  selected,
  onPress,
  leading,
  trailing,
}: {
  title: string;
  detail?: string;
  selected?: boolean;
  onPress?: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.optionRow, pressed && onPress && { backgroundColor: colors.fill }]}
    >
      {leading}
      <View style={styles.flex}>
        <Text style={[type.body, selected && { color: colors.brand, fontWeight: '600' }]}>{title}</Text>
        {detail ? (
          <Text style={[type.footnote, { color: colors.label2 }]} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing ?? (selected ? <Ionicons name="checkmark" size={20} color={colors.brand} /> : null)}
    </Pressable>
  );
}

/**
 * Bottom sheet for picking options (Figma: address search, members, repeat).
 * Slides up with a smooth, no-bounce spring over a fading backdrop.
 */
export function OptionSheet({
  visible,
  onClose,
  header,
  footer,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = reduceMotion ? withTiming(1, timing.fade) : withSpring(1, spring.smooth);
    } else if (mounted) {
      progress.value = withTiming(0, timing.fade, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, mounted, progress, reduceMotion]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panel = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height * 0.7 }],
  }));

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={[styles.panel, { maxHeight: height * 0.78, paddingBottom: Math.max(insets.bottom, space.lg) }, panel]}>
        <View style={styles.grabber} />
        {header}
        <ScrollView style={styles.flexGrow} contentContainerStyle={styles.panelBody} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer ? <View style={styles.panelFooter}>{footer}</View> : null}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexGrow: { flexGrow: 0 },
  pressed: { opacity: 0.6 },
  label: { color: colors.label2, marginBottom: -space.xs },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.brand },
  chipText: { color: colors.label, fontWeight: '600' },
  lightPill: {
    width: flow.ctaWidth,
    maxWidth: '100%',
    height: flow.ctaHeight,
    borderRadius: flow.ctaHeight / 2,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  lightPillCompact: { width: 155, height: 44, borderRadius: 22, alignSelf: 'auto' },
  badgeOuter: {
    width: 73,
    height: 73,
    borderRadius: 37,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: { width: 45, height: 45, borderRadius: 23, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  codeRow: { flexDirection: 'row', gap: 7 },
  codeBox: {
    width: 79,
    height: 79,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    borderColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: { ...flow.code, color: colors.brand, fontVariant: ['tabular-nums'] },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 52,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.tile,
  },
  backdrop: { backgroundColor: flowColors.backdrop },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: space.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: flow.grabberWidth / 2,
    height: 5,
    borderRadius: 3,
    backgroundColor: flowColors.grabber,
    marginBottom: space.md,
  },
  panelBody: { paddingHorizontal: space.sm, paddingBottom: space.md },
  panelFooter: { paddingHorizontal: space.lg, paddingTop: space.sm },
});

import { useRef, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, radius, space, type } from '../constants/theme';
import { IconButton, haptic, type IconName } from './Buttons';
import { Glass } from './Glass';

export const useTabBarSpace = () => {
  const insets = useSafeAreaInsets();
  return layout.tabBarHeight + Math.max(insets.bottom, space.md) + space.sm;
};

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/explore');
}

interface ScreenProps {
  title?: string;
  /** Tab roots use a large title and no back button. */
  variant?: 'tab' | 'page' | 'sheet';
  /** At most one control: a "+" or a "…" menu. */
  trailing?: ReactNode;
  /** Usually an <ActionBar>. */
  footer?: ReactNode;
  children: ReactNode;
}

export function Screen({ title, variant = 'page', trailing, footer, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const [footerHeight, setFooterHeight] = useState(0);
  const top = variant === 'sheet' ? space.md : insets.top;
  const bottomInset = variant === 'tab' ? tabBarSpace : Math.max(insets.bottom, space.md);

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      {variant === 'tab' ? (
        <View style={styles.largeHeader}>
          <Text style={type.largeTitle} accessibilityRole="header">
            {title}
          </Text>
          {trailing}
        </View>
      ) : (
        <View style={styles.header}>
          <IconButton
            icon={variant === 'sheet' ? 'close' : 'chevron-back'}
            label={variant === 'sheet' ? 'Close' : 'Back'}
            onPress={goBack}
          />
          <Text style={[type.headline, styles.headerTitle]} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          <View style={styles.trailing}>{trailing}</View>
        </View>
      )}

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: footerHeight + bottomInset + space.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {footer ? (
        <View
          style={[styles.footer, { bottom: (variant === 'tab' ? tabBarSpace : Math.max(insets.bottom, space.sm)) }]}
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export interface MenuItem {
  label: string;
  icon: IconName;
  onPress: () => void;
  destructive?: boolean;
}

/** The single top-right control ("…" by default, "+" for add menus). Opens a small glass menu. */
export function MoreMenu({ items, icon = 'ellipsis-horizontal', label = 'More' }: { items: MenuItem[]; icon?: IconName; label?: string }) {
  const [open, setOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  // Run the chosen action only after the menu has fully closed, so it can
  // present a new screen (iOS refuses to present while a modal is dismissing).
  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };
  // Web restores focus to the trigger when the modal unmounts; wait so the next screen keeps focus.
  const afterClose = () => {
    if (Platform.OS !== 'ios') setTimeout(runPending, Platform.OS === 'web' ? 250 : 0);
  };
  const show = () => {
    haptic.light();
    setOpen(true);
    progress.value = 0;
    progress.value = reduceMotion ? 1 : withSpring(1, { damping: 18, stiffness: 260 });
  };
  const hide = (then?: () => void) => {
    pending.current = then ?? null;
    progress.value = withTiming(0, { duration: 140 }, (finished) => {
      if (!finished) return;
      runOnJS(setOpen)(false);
      runOnJS(afterClose)();
    });
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(progress.value * 1.5, 1),
    transform: [{ scale: 0.85 + progress.value * 0.15 }],
  }));

  return (
    <>
      <IconButton icon={icon} label={label} onPress={show} />
      <Modal transparent visible={open} animationType="none" onRequestClose={() => hide()} onDismiss={runPending}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.menuScrim, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => hide()} accessibilityLabel="Close menu" />
        </Animated.View>
        <Animated.View style={[styles.menu, { top: insets.top + 56 }, cardStyle]}>
          <Glass radius={radius.card} style={styles.menuCard}>
            {items.map((item, index) => (
              <Animated.View key={item.label} entering={reduceMotion ? undefined : FadeInDown.delay(40 + index * 40).springify().damping(18)}>
                <Pressable
                  accessibilityRole="menuitem"
                  onPress={() => hide(item.onPress)}
                  style={({ pressed }) => [styles.menuItem, index > 0 && styles.menuDivider, pressed && { backgroundColor: colors.fill }]}
                >
                  <Text style={[type.body, { color: item.destructive ? colors.live : colors.label, flex: 1 }]}>{item.label}</Text>
                  <Ionicons name={item.icon} size={18} color={item.destructive ? colors.live : colors.label} />
                </Pressable>
              </Animated.View>
            ))}
          </Glass>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  largeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  trailing: { minWidth: layout.iconButton, alignItems: 'flex-end' },
  content: { padding: space.lg, gap: space.md },
  footer: { position: 'absolute', left: space.md, right: space.md },
  menu: { position: 'absolute', right: space.lg, minWidth: 240, transformOrigin: 'right top' },
  menuCard: { paddingVertical: space.xs },
  menuScrim: { backgroundColor: 'rgba(0,0,0,0.08)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 13 },
  menuDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
});

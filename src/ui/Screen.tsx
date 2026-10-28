import { useRef, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, radius, space, type } from '../constants/theme';
import { IconButton, type IconName } from './Buttons';
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

  // Run the chosen action only after the menu has fully closed, so it can
  // present a new screen (iOS refuses to present while a modal is dismissing).
  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };
  const choose = (action: () => void) => {
    pending.current = action;
    setOpen(false);
    if (Platform.OS !== 'ios') setTimeout(runPending, 320);
  };

  return (
    <>
      <IconButton icon={icon} label={label} onPress={() => setOpen(true)} />
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)} onDismiss={runPending}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="Close menu" />
        <Glass radius={radius.card} style={[styles.menu, { top: insets.top + 56 }]}>
          {items.map((item, index) => (
            <Pressable
              key={item.label}
              accessibilityRole="menuitem"
              onPress={() => choose(item.onPress)}
              style={({ pressed }) => [styles.menuItem, index > 0 && styles.menuDivider, pressed && { backgroundColor: colors.fill }]}
            >
              <Text style={[type.body, { color: item.destructive ? colors.live : colors.label, flex: 1 }]}>{item.label}</Text>
              <Ionicons name={item.icon} size={18} color={item.destructive ? colors.live : colors.label} />
            </Pressable>
          ))}
        </Glass>
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
  menu: { position: 'absolute', right: space.lg, minWidth: 240, paddingVertical: space.xs },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 13 },
  menuDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
});

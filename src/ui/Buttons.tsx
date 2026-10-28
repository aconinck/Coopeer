import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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

interface ButtonProps {
  title: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PrimaryButton({ title, icon, onPress, disabled, loading }: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? colors.gray3 : colors.brand },
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={colors.white} />}
          <Text style={[type.headline, { color: colors.white }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ title, icon, onPress, disabled, destructive }: ButtonProps & { destructive?: boolean }) {
  const color = destructive ? colors.live : colors.label;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, { backgroundColor: colors.fill }, pressed && styles.pressed, disabled && { opacity: 0.45 }]}
    >
      <View style={styles.row}>
        {icon && <Ionicons name={icon} size={18} color={color} />}
        <Text style={[type.headline, { color }]}>{title}</Text>
      </View>
    </Pressable>
  );
}

/** The bottom glass bar that holds a screen's main actions. */
export function ActionBar({ caption, children }: { caption?: string | null; children?: ReactNode }) {
  return (
    <Glass radius={radius.sheet} style={styles.actionBar}>
      {caption ? <Text style={[type.footnote, styles.caption]}>{caption}</Text> : null}
      {children ? <View style={styles.actionRow}>{children}</View> : null}
    </Glass>
  );
}

export function NextButton({ enabled, loading, onPress }: { enabled: boolean; loading?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue"
      accessibilityState={{ disabled: !enabled, busy: !!loading }}
      disabled={!enabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.next, { backgroundColor: enabled ? colors.brand : colors.gray3 }, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Ionicons name="arrow-forward" size={26} color={colors.white} />}
    </Pressable>
  );
}

/** Round glass button for headers and map controls. */
export function IconButton({ icon, label, onPress, tint }: { icon: IconName; label: string; onPress: () => void; tint?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => pressed && styles.pressed}>
      <Glass radius={radius.full} style={styles.iconButton} interactive>
        <Ionicons name={icon} size={20} color={tint ?? colors.label} />
      </Glass>
    </Pressable>
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { backgroundColor: selected ? color : colors.fill }, pressed && styles.pressed]}
    >
      {icon}
      <Text style={[type.subhead, { fontWeight: '600', color: selected ? colors.white : colors.label }]}>{title}</Text>
    </Pressable>
  );
}

export function TextButton({ title, onPress, disabled, color = colors.brand }: { title: string; onPress: () => void; disabled?: boolean; color?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} hitSlop={8}>
      <Text style={[type.subhead, { fontWeight: '600', color: disabled ? colors.label3 : color }]}>{title}</Text>
    </Pressable>
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
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
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
  },
});

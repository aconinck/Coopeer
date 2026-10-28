import { Children, Fragment, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, type } from '../constants/theme';
import { IconTile, card } from './Display';

/**
 * Grouped list (Uber / iOS Settings pattern): one card, rows separated by inset hairlines.
 * Optional small title above the card.
 */
export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.group}>
      {title ? <Text style={styles.title}>{title.toUpperCase()}</Text> : null}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 && <View style={styles.separator} />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

export function ListRow({
  icon,
  tint = colors.label,
  title,
  subtitle,
  value,
  onPress,
  destructive,
}: {
  icon?: ComponentProps<typeof Ionicons>['name'];
  tint?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {icon && <IconTile icon={icon} color={destructive ? colors.live : tint} />}
      <View style={styles.text}>
        <Text style={[type.body, destructive && { color: colors.live }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[type.footnote, styles.muted]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? <Text style={[type.subhead, styles.muted]}>{value}</Text> : null}
      {onPress && !destructive && <Ionicons name="chevron-forward" size={16} color={colors.label3} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  title: { ...type.caption2, color: colors.label2, paddingHorizontal: space.lg, letterSpacing: 0.6 },
  card: { ...card, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, minHeight: 56, paddingVertical: space.sm },
  pressed: { backgroundColor: colors.fill },
  text: { flex: 1, gap: 1 },
  muted: { color: colors.label2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: space.lg + 32 + space.md },
});

import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, radius } from '../constants/theme';
import { Glass } from '../ui/Glass';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Zoom in, zoom out and recenter in one glass capsule, like Apple Maps. */
/** `following`: the camera is on your location → filled arrow; once you pan away it turns to an outline. */
export function MapControls({ onZoomIn, onZoomOut, onRecenter, following }: { onZoomIn: () => void; onZoomOut: () => void; onRecenter: () => void; following: boolean }) {
  return (
    <Glass radius={radius.card} style={styles.capsule}>
      <Control icon="add" label="Zoom in" onPress={onZoomIn} />
      <View style={styles.divider} />
      <Control icon="remove" label="Zoom out" onPress={onZoomOut} />
      <View style={styles.divider} />
      <Control icon={following ? 'navigate' : 'navigate-outline'} label={following ? 'Showing your location' : 'Show my location'} tint={colors.brand} onPress={onRecenter} />
    </Glass>
  );
}

function Control({ icon, label, onPress, tint }: { icon: IconName; label: string; onPress: () => void; tint?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={2} style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
      <Ionicons name={icon} size={22} color={tint ?? colors.label} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  capsule: { width: layout.iconButton, overflow: 'hidden' },
  control: { width: layout.iconButton, height: layout.iconButton, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.fill },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 10, backgroundColor: colors.separator },
});

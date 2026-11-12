import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, radius, shadow } from '../constants/theme';
import { haptic } from '../ui/Buttons';
import { Glass } from '../ui/Glass';
import { Segmented, type SegmentOption } from '../ui/Segmented';
import { useTourTarget } from '../tour/Tour';
import { ProfileButton } from '../ui/ProfileButton';

export type MapView = 'tile' | 'map';

const views: SegmentOption<MapView>[] = [
  { value: 'tile', label: 'Tile', icon: (selected) => <Ionicons name={selected ? 'grid' : 'grid-outline'} size={20} color={selected ? colors.label : colors.label2} /> },
  { value: 'map', label: 'Map', icon: (selected) => <Ionicons name={selected ? 'map' : 'map-outline'} size={20} color={selected ? colors.label : colors.label2} /> },
];

/** Top of the home screen: an icon-only Tile | Map switch on the left, your avatar (opens Profile) on the right. */
export function MapTopBar({ view, onViewChange }: { view: MapView; onViewChange: (view: MapView) => void }) {
  const switchRef = useTourTarget('modes');
  return (
    <View style={styles.row} pointerEvents="box-none">
      <View ref={switchRef} collapsable={false} style={styles.switch}>
        <Glass radius={radius.full} style={styles.capsule}>
          <Segmented options={views} value={view} onChange={onViewChange} bare size="large" />
        </Glass>
      </View>
      <ProfileButton />
    </View>
  );
}

const AVATAR = 50;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.gutter },
  switch: { width: 112 },
  capsule: { padding: 1, overflow: 'hidden' },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, ...shadow.soft },
  pressed: { opacity: 0.8 },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, layout, radius, space } from '../constants/theme';
import type { IconName } from './Buttons';
import { Glass } from './Glass';

const tabs: Record<string, { label: string; icon: IconName; activeIcon: IconName }> = {
  explore: { label: 'Explore', icon: 'map-outline', activeIcon: 'map' },
  clubs: { label: 'Clubs', icon: 'people-outline', activeIcon: 'people' },
  schedule: { label: 'Schedule', icon: 'calendar-outline', activeIcon: 'calendar' },
  profile: { label: 'Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
};

/** Floating Liquid Glass tab bar (iOS 26 style). */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, space.md) }]}>
      <Glass radius={radius.full} style={styles.bar}>
        {state.routes.map((route, index) => {
          const tab = tabs[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={[styles.item, focused && styles.itemActive]}
            >
              <Ionicons name={focused ? tab.activeIcon : tab.icon} size={23} color={focused ? colors.brand : colors.label} />
              <Text style={[styles.label, { color: focused ? colors.brand : colors.label }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, right: space.lg },
  bar: { height: layout.tabBarHeight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  item: { flex: 1, height: layout.tabBarHeight - 12, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', gap: 1 },
  itemActive: { backgroundColor: colors.brandSoft },
  label: { fontSize: 10, fontWeight: '600' },
});

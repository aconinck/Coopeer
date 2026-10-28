import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, layout, radius, space } from '../constants/theme';
import { spring } from '../constants/motion';
import { haptic, type IconName } from './Buttons';
import { Glass } from './Glass';
import { useTourTarget } from '../tour/Tour';

const tabs: Record<string, { label: string; icon: IconName; activeIcon: IconName }> = {
  map: { label: 'Map', icon: 'map-outline', activeIcon: 'map' },
  clubs: { label: 'Clubs', icon: 'people-outline', activeIcon: 'people' },
  explore: { label: 'Explore', icon: 'compass-outline', activeIcon: 'compass' },
  schedule: { label: 'Schedule', icon: 'calendar-outline', activeIcon: 'calendar' },
  profile: { label: 'Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
};

/** Floating Liquid Glass tab bar (iOS 26 style) with a sliding active pill. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [slots, setSlots] = useState<Record<number, { x: number; width: number }>>({});
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const visible = useSharedValue(0);
  const tourRef = useTourTarget('tabs');

  const active = slots[state.index];
  useEffect(() => {
    if (!active) return;
    if (visible.value === 0 || reduceMotion) {
      pillX.value = active.x;
      pillW.value = active.width;
      visible.value = 1;
    } else {
      pillX.value = withSpring(active.x, spring.snappy);
      pillW.value = withSpring(active.width, spring.snappy);
    }
  }, [active, pillX, pillW, visible, reduceMotion]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: visible.value,
    width: pillW.value,
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, space.md) }]}>
      <View ref={tourRef} collapsable={false}>
      <Glass radius={radius.full} style={styles.bar}>
        <Animated.View pointerEvents="none" style={[styles.pill, pillStyle]} />
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
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                setSlots((current) => (current[index]?.x === x && current[index]?.width === width ? current : { ...current, [index]: { x, width } }));
              }}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  haptic.selection();
                  navigation.navigate(route.name);
                }
              }}
              style={styles.item}
            >
              <Ionicons name={focused ? tab.activeIcon : tab.icon} size={23} color={focused ? colors.brand : colors.label} />
              <Text style={[styles.label, { color: focused ? colors.brand : colors.label }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </Glass>
      </View>
    </View>
  );
}

const ITEM_HEIGHT = layout.tabBarHeight - 12;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, right: space.lg },
  bar: { height: layout.tabBarHeight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  pill: {
    position: 'absolute',
    left: 0,
    top: (layout.tabBarHeight - ITEM_HEIGHT) / 2,
    height: ITEM_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.brandSoft,
  },
  item: { flex: 1, height: ITEM_HEIGHT, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', gap: 1 },
  label: { fontSize: 10, fontWeight: '600' },
});

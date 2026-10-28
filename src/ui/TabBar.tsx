import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, layout, radius, space } from '../constants/theme';
import { haptic, type IconName } from './Buttons';
import { Glass } from './Glass';

const tabs: Record<string, { label: string; icon: IconName; activeIcon: IconName }> = {
  explore: { label: 'Explore', icon: 'map-outline', activeIcon: 'map' },
  clubs: { label: 'Clubs', icon: 'people-outline', activeIcon: 'people' },
  schedule: { label: 'Schedule', icon: 'calendar-outline', activeIcon: 'calendar' },
  profile: { label: 'Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
};

const PILL_SPRING = { damping: 18, stiffness: 220, mass: 0.8 } as const;

/** Floating Liquid Glass tab bar (iOS 26 style) with a sliding active pill. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [slots, setSlots] = useState<Record<number, { x: number; width: number }>>({});
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const visible = useSharedValue(0);

  const active = slots[state.index];
  useEffect(() => {
    if (!active) return;
    if (visible.value === 0 || reduceMotion) {
      pillX.value = active.x;
      pillW.value = active.width;
      visible.value = 1;
    } else {
      pillX.value = withSpring(active.x, PILL_SPRING);
      pillW.value = withSpring(active.width, PILL_SPRING);
    }
  }, [active, pillX, pillW, visible, reduceMotion]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: visible.value,
    width: pillW.value,
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, space.md) }]}>
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
              <TabIcon focused={focused} icon={focused ? tab.activeIcon : tab.icon} />
              <Text style={[styles.label, { color: focused ? colors.brand : colors.label }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}

function TabIcon({ focused, icon }: { focused: boolean; icon: IconName }) {
  const reduceMotion = useReducedMotion();
  const bounce = useSharedValue(1);
  useEffect(() => {
    if (focused && !reduceMotion) {
      bounce.value = withSequence(withSpring(1.18, { damping: 8, stiffness: 420 }), withSpring(1, { damping: 10, stiffness: 220 }));
    }
  }, [focused, bounce, reduceMotion]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: bounce.value }] }));
  return (
    <Animated.View style={style}>
      <Ionicons name={icon} size={23} color={focused ? colors.brand : colors.label} />
    </Animated.View>
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

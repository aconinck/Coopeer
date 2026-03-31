import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, components } from '../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabItem {
  route: string;
  icon: IconName;
  activeIcon: IconName;
  label: string;
}

const TABS: TabItem[] = [
  {
    route: '/(tabs)/discover',
    icon: 'compass-outline',
    activeIcon: 'compass',
    label: 'Discover',
  },
  {
    route: '/(tabs)/teams',
    icon: 'people-outline',
    activeIcon: 'people',
    label: 'My Teams',
  },
  {
    route: '/(tabs)/feed',
    icon: 'newspaper-outline',
    activeIcon: 'newspaper',
    label: 'Feed',
  },
  {
    route: '/(tabs)/ranking',
    icon: 'star-outline',
    activeIcon: 'star',
    label: 'Ranking',
  },
  {
    route: '/(tabs)/profile',
    icon: 'person-outline',
    activeIcon: 'person',
    label: 'Profile',
  },
];

export function NavBar() {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = `/${segments.join('/')}`;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TABS.map((tab) => {
          const isActive = currentRoute.includes(tab.route.replace('/(tabs)', ''));
          return (
            <TouchableOpacity
              key={tab.route}
              onPress={() => router.push(tab.route as never)}
              style={[styles.item, isActive && styles.activeItem]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={20}
                color={isActive ? colors.white : colors.gray500}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: components.navBar.background,
    borderWidth: 1,
    borderColor: components.navBar.border,
    borderRadius: components.navBar.borderRadius,
    padding: components.navBar.padding,
    gap: components.navBar.padding,
    width: components.navBar.width,
    height: components.navBar.height,
  },
  item: {
    width: components.navBar.itemSize,
    height: components.navBar.itemSize,
    borderRadius: components.navBar.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeItem: {
    backgroundColor: colors.primary,
  },
});

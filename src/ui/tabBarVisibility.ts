import { Easing, makeMutable, withTiming } from 'react-native-reanimated';

/** 0 = tab bar in place, 1 = slid out of view. Scrolling screens flip it (down hides, up shows); the tab bar and anything docked above it follow. */
export const tabBarHidden = makeMutable(0);

export function setTabBarHidden(hidden: boolean) {
  tabBarHidden.value = withTiming(hidden ? 1 : 0, { duration: 240, easing: Easing.out(Easing.cubic) });
}

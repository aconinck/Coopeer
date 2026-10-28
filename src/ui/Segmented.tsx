import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius, type } from '../constants/theme';
import { spring } from '../constants/motion';
import { haptic } from './Buttons';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

const PAD = 3;
const HEIGHT = { regular: 34, large: 42 } as const;

/** iOS segmented control: a white thumb glides between equal segments. `bare` drops the gray track (for glass); `size="large"` is the chunkier iOS 26 version. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  bare,
  size = 'regular',
  style,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  bare?: boolean;
  size?: keyof typeof HEIGHT;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(options.findIndex((o) => o.value === value), 0);
  const segment = (width - PAD * 2) / options.length;
  const x = useSharedValue(0);
  const ready = width > 0;

  useEffect(() => {
    if (!ready) return;
    x.value = reduceMotion ? index * segment : withSpring(index * segment, spring.snappy);
  }, [index, segment, ready, x, reduceMotion]);

  const h = HEIGHT[size];
  const thumbStyle = useAnimatedStyle(() => ({ width: segment, opacity: ready ? 1 : 0, transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.track, bare && styles.bare, style]} accessibilityRole="tablist" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View pointerEvents="none" style={[styles.thumb, { height: h, borderRadius: h / 2 }, size === 'large' && styles.thumbLarge, thumbStyle]} />
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) haptic.selection();
              onChange(option.value);
            }}
            style={[styles.segment, { height: h }]}
          >
            <Text numberOfLines={1} style={[size === 'large' ? type.callout : type.subhead, { fontWeight: selected ? '600' : '500', color: selected ? colors.label : colors.label2 }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.fill, borderRadius: radius.full, padding: PAD },
  bare: { backgroundColor: 'transparent' },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  thumb: {
    position: 'absolute',
    left: PAD,
    top: PAD,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbLarge: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
});

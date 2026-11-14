import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius } from '../constants/theme';
import { Glass } from './Glass';

const ITEM_H = 46;
const VISIBLE = 5;
const PAD = ITEM_H * Math.floor(VISIBLE / 2);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface BirthDate {
  year: number;
  /** 0-11 */
  month: number;
  day: number;
}

export const daysIn = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/** Whole years between a birth date and today. */
export function ageOf(birth: BirthDate, today = new Date()): number {
  let age = today.getFullYear() - birth.year;
  if (today.getMonth() < birth.month || (today.getMonth() === birth.month && today.getDate() < birth.day)) age -= 1;
  return age;
}

/**
 * Liquid Glass birthday picker: Month · Day · Year wheels inside one glass panel, a translucent capsule marking the
 * selected row. Rows fade with distance from the center, each snap ticks a haptic (native only) and the day column
 * shrinks to the month length.
 */
export function BirthPicker({ value, onChange, minYear, maxYear }: { value: BirthDate; onChange: (next: BirthDate) => void; minYear: number; maxYear: number }) {
  const years = useMemo(() => Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i), [minYear, maxYear]);
  const dayCount = daysIn(value.year, value.month);
  const days = useMemo(() => Array.from({ length: dayCount }, (_, i) => i + 1), [dayCount]);

  // A longer month to a shorter one (Jan 31 → Feb) pulls the day back to the last valid one.
  useEffect(() => {
    if (value.day > dayCount) onChange({ ...value, day: dayCount });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayCount]);

  return (
    <Glass radius={28} style={styles.panel}>
      <View pointerEvents="none" style={styles.capsule} />
      <View style={styles.columns}>
        <Wheel flex={1.5} items={MONTHS} index={value.month} label="Month" onChange={(month) => onChange({ ...value, month })} />
        <Wheel flex={0.8} items={days.map(String)} index={Math.min(value.day, dayCount) - 1} label="Day" onChange={(i) => onChange({ ...value, day: i + 1 })} />
        <Wheel flex={1} items={years.map(String)} index={Math.max(years.indexOf(value.year), 0)} label="Year" onChange={(i) => onChange({ ...value, year: years[i] })} />
      </View>
    </Glass>
  );
}

function Wheel({ items, index, onChange, label, flex }: { items: string[]; index: number; onChange: (index: number) => void; label: string; flex: number }) {
  const scroll = useRef<ScrollViewInstance | null>(null);
  const [live, setLive] = useState(index);
  const last = useRef(index);

  // Place the wheel on its value on mount and whenever the value is changed from outside (day clamp).
  useEffect(() => {
    setLive(index);
    last.current = index;
    const timer = setTimeout(() => scroll.current?.scrollTo({ y: index * ITEM_H, animated: false }), 60);
    return () => clearTimeout(timer);
    // Only when the target index or the list length changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length]);

  const indexAt = (y: number) => Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_H)));

  const settle = (y: number) => {
    const next = indexAt(y);
    if (next !== last.current) {
      last.current = next;
      onChange(next);
    }
  };

  return (
    <View style={[styles.wheel, { flex }]} accessibilityLabel={label} accessibilityRole="adjustable">
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: PAD }}
        onScroll={(e) => {
          const next = indexAt(e.nativeEvent.contentOffset.y);
          setLive((prev) => {
            if (prev !== next && Platform.OS !== 'web') void Haptics.selectionAsync();
            return next;
          });
        }}
        onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => settle(e.nativeEvent.contentOffset.y)}
      >
        {items.map((item, i) => {
          const distance = Math.abs(i - live);
          return (
            <View key={`${label}-${item}`} style={styles.item}>
              <Text numberOfLines={1} style={[styles.text, distance === 0 && styles.textSelected, { opacity: distance === 0 ? 1 : distance === 1 ? 0.5 : 0.24 }]}>
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { height: ITEM_H * VISIBLE, overflow: 'hidden', paddingHorizontal: 12 },
  columns: { flex: 1, flexDirection: 'row' },
  capsule: {
    position: 'absolute',
    top: PAD,
    left: 10,
    right: 10,
    height: ITEM_H,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  wheel: { height: ITEM_H * VISIBLE },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 20, fontWeight: '500', color: colors.label },
  textSelected: { fontWeight: '700' },
});

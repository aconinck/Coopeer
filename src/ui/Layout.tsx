import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { layout, space } from '../constants/theme';
import { SectionHeader } from './Display';

/**
 * A screen section: header + content, with the standard gap above it.
 * Screens are a stack of Sections; this is what gives every screen the same rhythm.
 */
export function Section({
  title,
  caption,
  action,
  first,
  children,
}: {
  title?: string;
  caption?: string;
  action?: { label: string; onPress: () => void };
  /** The first section on a screen sits closer to the title. */
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.section, first && styles.first]}>
      {title ? <SectionHeader title={title} caption={caption} action={action} /> : null}
      {children}
    </View>
  );
}

/** Horizontal card rail that bleeds to the screen edges but starts aligned with the gutter. */
export function Rail({ children, snap }: { children: ReactNode; snap?: number }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.rail}
      snapToInterval={snap ? snap + space.md : undefined}
      decelerationRate={snap ? 'fast' : 'normal'}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md, marginTop: layout.sectionGap - space.md },
  first: { marginTop: 0 },
  bleed: { marginHorizontal: -layout.gutter },
  rail: { gap: space.md, paddingHorizontal: layout.gutter },
});

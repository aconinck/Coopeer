import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../constants/theme';
import { spring } from '../constants/motion';
import { DetailLayout } from '../ui/DetailLayout';
import type { Member } from '../state/models';
import { useStore } from '../state/store';
import { Avatar, card } from '../ui/Display';

/** Figma "Ver confirmados": searchable Going / Not going / No response. */
export function AttendeesDetail({ id }: { id: string }) {
  const store = useStore();
  const game = id ? store.game(id) : undefined;
  const [query, setQuery] = useState('');

  if (!game) {
    return (
      <DetailLayout title="Who's going">
        <Text style={[type.body, styles.secondary]}>This game couldn't be found.</Text>
      </DetailLayout>
    );
  }

  const match = (members: Member[]) =>
    query ? members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())) : members;

  return (
    <DetailLayout title="Who's going">
      <View style={styles.search}>
        <Ionicons name="search" size={16} color={colors.label2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={colors.label3}
          style={[type.body, styles.searchInput]}
        />
      </View>
      <Section title="Going" members={match(game.going)} />
      <Section title="Not going" members={match(game.declined)} />
      <Section title="No response" members={match(game.noResponse)} />
    </DetailLayout>
  );
}

function Section({ title, members }: { title: string; members: Member[] }) {
  if (members.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[type.footnote, styles.sectionTitle]}>
        {title.toUpperCase()} · {members.length}
      </Text>
      <View style={card}>
        {members.map((member, index) => (
          <Animated.View
            key={member.id}
            layout={LinearTransition.springify().mass(1).stiffness(spring.smooth.stiffness).damping(spring.smooth.damping)}
            entering={FadeIn.delay(Math.min(index, 10) * 30)}
            exiting={FadeOut.duration(120)}
            style={[styles.row, index > 0 && styles.divider]}
          >
            <Avatar member={member} size={32} />
            <Text style={type.body}>{member.name}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  secondary: { color: colors.label2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.fill,
  },
  searchInput: { flex: 1, color: colors.label, paddingVertical: 0 },
  section: { gap: space.xs },
  sectionTitle: { color: colors.label2, paddingHorizontal: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
});

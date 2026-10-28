import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, space, type } from '../constants/theme';
import { sports, type SportId } from '../state/models';
import type { Skill, SkillTier } from '../state/profile';
import { ProgressBar, card } from '../ui/Display';

const NODE = 56;

/**
 * A sport's skill tree: tiers from fundamentals to leadership, joined by a spine.
 * Mastered skills are filled with the sport color, skills in progress are ringed, locked ones are gray.
 * Tapping a skill explains how to earn it.
 */
export function SkillTree({ sport, tiers }: { sport: SportId; tiers: SkillTier[] }) {
  const color = sports[sport].color;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tiers.flatMap((t) => t.skills).find((s) => s.id === selectedId) ?? null;

  return (
    <View style={styles.card}>
      {tiers.map((tier, tierIndex) => {
        const done = tier.skills.filter((s) => s.state === 'mastered').length;
        const reached = tier.skills.some((s) => s.state !== 'locked');
        return (
          <View key={tier.title} style={styles.tier}>
            {tierIndex > 0 && <View style={[styles.spine, { backgroundColor: reached ? color : colors.locked }]} />}
            <View style={styles.tierHeader}>
              <Text style={[styles.tierLabel, { color: reached ? colors.label : colors.label3 }]}>
                TIER {tierIndex + 1} · {tier.title.toUpperCase()}
              </Text>
              <Text style={[type.caption, styles.muted]}>
                {done}/{tier.skills.length}
              </Text>
            </View>
            <View style={styles.nodes}>
              <View style={[styles.rail, { backgroundColor: reached ? `${color}55` : colors.locked }]} />
              {tier.skills.map((skill) => (
                <SkillNode key={skill.id} skill={skill} color={color} selected={skill.id === selectedId} onPress={() => setSelectedId(skill.id === selectedId ? null : skill.id)} />
              ))}
            </View>
          </View>
        );
      })}

      {selected && (
        <Animated.View key={selected.id} entering={FadeIn.duration(200)} style={styles.detail}>
          <View style={styles.detailTop}>
            <Text style={type.headline}>{selected.name}</Text>
            <Text style={[type.footnote, { color: selected.state === 'mastered' ? color : colors.label2, fontWeight: '600' }]}>
              {selected.state === 'mastered' ? 'Mastered' : selected.state === 'learning' ? `${Math.round((selected.progress ?? 0) * 100)}%` : 'Locked'}
            </Text>
          </View>
          <Text style={[type.subhead, styles.muted]}>{selected.how}</Text>
          {selected.state === 'learning' && <ProgressBar value={selected.progress ?? 0} color={color} />}
        </Animated.View>
      )}
    </View>
  );
}

function SkillNode({ skill, color, selected, onPress }: { skill: Skill; color: string; selected: boolean; onPress: () => void }) {
  const mastered = skill.state === 'mastered';
  const locked = skill.state === 'locked';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${skill.name}, ${skill.state}`} accessibilityState={{ selected }} onPress={onPress} style={styles.node}>
      <View
        style={[
          styles.circle,
          mastered && { backgroundColor: color, borderColor: color },
          skill.state === 'learning' && { backgroundColor: colors.surface, borderColor: color },
          locked && { backgroundColor: colors.fill, borderColor: colors.locked },
          selected && styles.circleSelected,
        ]}
      >
        <MaterialCommunityIcons name={skill.icon} size={24} color={mastered ? colors.white : locked ? colors.label3 : color} />
        {locked && (
          <View style={styles.lock}>
            <Ionicons name="lock-closed" size={10} color={colors.white} />
          </View>
        )}
        {mastered && (
          <View style={[styles.lock, { backgroundColor: colors.surface }]}>
            <Ionicons name="checkmark" size={11} color={color} />
          </View>
        )}
      </View>
      <Text style={[type.caption, styles.nodeName, locked && styles.muted]} numberOfLines={2}>
        {skill.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { ...card, padding: space.lg, gap: space.lg },
  tier: { gap: space.md },
  spine: { position: 'absolute', top: -space.lg, height: space.lg, width: 3, left: '50%', marginLeft: -1.5, borderRadius: 2 },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierLabel: { ...type.caption2, letterSpacing: 0.6 },
  muted: { color: colors.label2 },
  nodes: { flexDirection: 'row', justifyContent: 'space-around' },
  rail: { position: 'absolute', top: NODE / 2 - 1.5, left: '16%', right: '16%', height: 3, borderRadius: 2 },
  node: { width: 88, alignItems: 'center', gap: 6 },
  circle: { width: NODE, height: NODE, borderRadius: NODE / 2, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  circleSelected: { transform: [{ scale: 1.06 }] },
  lock: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.label3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  nodeName: { textAlign: 'center', fontWeight: '600' },
  detail: { gap: space.sm, padding: space.md, borderRadius: 14, backgroundColor: colors.bg },
  detailTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

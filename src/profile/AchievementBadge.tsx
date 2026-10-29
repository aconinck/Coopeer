import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, type } from '../constants/theme';
import type { Achievement } from '../state/profile';
import { ProgressBar } from '../ui/Display';

const SIZE = 68;

/** AllTrails-style medal: tier-colored ring when earned, gray with progress when not yet. */
export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const tone = achievement.earned ? colors[achievement.tier] : colors.locked;
  const [current, total] = achievement.progress;
  return (
    <View style={styles.root} accessible accessibilityLabel={`${achievement.title}. ${achievement.description} ${achievement.earned ? 'Earned' : `${current} of ${total}`}`}>
      <View style={[styles.medal, { borderColor: tone, backgroundColor: achievement.earned ? `${tone}1F` : colors.fill }]}>
        <View style={[styles.inner, { backgroundColor: achievement.earned ? tone : colors.surface }]}>
          <MaterialCommunityIcons name={achievement.icon} size={26} color={achievement.earned ? colors.white : colors.label3} />
        </View>
      </View>
      <Text style={[type.caption, styles.title, !achievement.earned && styles.muted]} numberOfLines={1}>
        {achievement.title}
      </Text>
      {achievement.earned ? (
        <Text style={[type.caption, styles.muted]}>Earned</Text>
      ) : (
        <View style={styles.progress}>
          <ProgressBar value={current / total} color={colors.label2} height={4} />
          <Text style={[type.caption, styles.muted]}>
            {current}/{total}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', gap: 4 },
  medal: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  inner: { width: SIZE - 18, height: SIZE - 18, borderRadius: (SIZE - 18) / 2, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '700', marginTop: 2 },
  muted: { color: colors.label2 },
  progress: { width: 56, alignItems: 'center', gap: 2 },
});

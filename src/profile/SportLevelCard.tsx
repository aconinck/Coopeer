import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space, type } from '../constants/theme';
import { sports } from '../state/models';
import { levelName, type SportProgress } from '../state/profile';
import { ProgressBar, SportIcon, card } from '../ui/Display';

export const SPORT_CARD_WIDTH = 200;

/** One sport you play: level, progress to the next one, and a headline stat. Tapping selects its skill tree. */
export function SportLevelCard({ progress, selected, onPress }: { progress: SportProgress; selected: boolean; onPress: () => void }) {
  const info = sports[progress.sport];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${info.label}, level ${progress.level}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && { borderColor: info.color, borderWidth: 2 }, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.top}>
        <SportIcon sport={progress.sport} size={36} />
        <View style={styles.levelBadge}>
          <Text style={styles.levelNumber}>{progress.level}</Text>
        </View>
      </View>
      <View style={styles.text}>
        <Text style={type.headline}>{info.label}</Text>
        <Text style={[type.footnote, styles.muted]}>
          Level {progress.level} · {levelName(progress.level)}
        </Text>
      </View>
      <ProgressBar value={progress.toNext} color={info.color} />
      <View style={styles.bottom}>
        <Text style={[type.footnote, styles.muted]}>{progress.games} games</Text>
        <Text style={[type.footnote, styles.strong]}>
          {progress.highlight.value} <Text style={styles.muted}>{progress.highlight.label.toLowerCase()}</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { ...card, width: SPORT_CARD_WIDTH, padding: space.md, gap: space.md },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelBadge: { minWidth: 32, height: 32, borderRadius: 16, paddingHorizontal: 8, backgroundColor: colors.label, alignItems: 'center', justifyContent: 'center' },
  levelNumber: { color: colors.white, fontWeight: '800', fontSize: 15, fontVariant: ['tabular-nums'] },
  text: { gap: 1 },
  muted: { color: colors.label2 },
  strong: { fontWeight: '700', color: colors.label },
  bottom: { flexDirection: 'row', justifyContent: 'space-between' },
});

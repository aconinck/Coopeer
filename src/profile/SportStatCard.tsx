import { StyleSheet, Text, View } from 'react-native';
import { space, type } from '../constants/theme';
import { sports, type SportId } from '../state/models';
import { colors } from '../constants/theme';
import { formatHours } from '../state/profile';
import { SportIcon, card } from '../ui/Display';

export const SPORT_CARD_WIDTH = 168;

/** One sport: how many games and hours. Both come straight from games played. */
export function SportStatCard({ sport, games, hours }: { sport: SportId; games: number; hours: number }) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${sports[sport].label}: ${games} games, ${formatHours(hours)} hours`}>
      <SportIcon sport={sport} size={36} />
      <View style={styles.text}>
        <Text style={type.headline}>{sports[sport].label}</Text>
        <Text style={[type.footnote, styles.muted]}>
          {games} {games === 1 ? 'game' : 'games'} · {formatHours(hours)} h
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...card, width: SPORT_CARD_WIDTH, padding: space.md, gap: space.md },
  text: { gap: 1 },
  muted: { color: colors.label2 },
});

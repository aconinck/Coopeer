import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '../constants/theme';
import { sportIds } from '../state/models';
import { achievementsFor, type PlayerStats } from '../state/profile';
import { card } from '../ui/Display';
import { Rail, Section } from '../ui/Layout';
import { AchievementBadge } from './AchievementBadge';
import { SPORT_CARD_WIDTH, SportStatCard } from './SportStatCard';
import type { SportId } from '../state/models';

const PREVIEW = 6;
const COLUMNS = 3;

/** Sports this player plays (or picked at sign-up), each with games and hours. */
export function SportsSection({ stats, favorites, first, caption }: { stats: PlayerStats; favorites: SportId[]; first?: boolean; caption?: string }) {
  const list = sportIds.filter((id) => stats.bySport[id].games > 0 || favorites.includes(id));
  if (list.length === 0) return null;
  return (
    <Section first={first} title="Sports" caption={caption}>
      <Rail snap={SPORT_CARD_WIDTH}>
        {list.map((id) => (
          <SportStatCard key={id} sport={id} games={stats.bySport[id].games} hours={stats.bySport[id].hours} />
        ))}
      </Rail>
    </Section>
  );
}

/** Medals from plain thresholds. `earnedOnly` hides the locked ones (someone else's profile). */
export function AchievementsSection({ stats, earnedOnly }: { stats: PlayerStats; earnedOnly?: boolean }) {
  const [all, setAll] = useState(false);
  const every = achievementsFor(stats);
  const earned = every.filter((a) => a.earned).length;
  const pool = earnedOnly ? every.filter((a) => a.earned) : every;
  if (pool.length === 0) return null;
  const sorted = [...pool].sort((a, b) => Number(b.earned) - Number(a.earned));
  const shown = all ? sorted : sorted.slice(0, PREVIEW);
  const rows: (typeof shown)[] = [];
  for (let i = 0; i < shown.length; i += COLUMNS) rows.push(shown.slice(i, i + COLUMNS));

  return (
    <Section
      title="Achievements"
      caption={`${earned} of ${every.length} earned`}
      action={pool.length > PREVIEW ? { label: all ? 'Show less' : 'See all', onPress: () => setAll((v) => !v) } : undefined}
    >
      <View style={styles.badges}>
        {rows.map((row) => (
          <View key={row.map((b) => b.id).join('-')} style={styles.row}>
            {row.map((badge) => (
              <AchievementBadge key={badge.id} achievement={badge} />
            ))}
            {Array.from({ length: COLUMNS - row.length }, (_, i) => (
              <View key={i} style={styles.fill} />
            ))}
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  badges: { ...card, paddingVertical: space.lg, paddingHorizontal: space.sm, gap: space.lg },
  row: { flexDirection: 'row' },
  fill: { flex: 1 },
});

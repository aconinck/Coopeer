import { StyleSheet, Text, View } from 'react-native';
import { colors, space, type } from '../constants/theme';
import { sports } from '../state/models';
import { useStore } from '../state/store';
import { formatHours } from '../state/profile';
import { AchievementsSection, SportsSection } from '../profile/PlayerSections';
import { usePlayer } from '../profile/usePlayer';
import { DetailLayout, useDetailNav } from '../ui/DetailLayout';
import { Avatar, StatRow, card } from '../ui/Display';
import { Section } from '../ui/Layout';
import { ListGroup, ListRow } from '../ui/ListGroup';

/**
 * Someone's public profile: four numbers, the sports they play, medals they earned and their clubs.
 * Numbers are the same derived ones as your own profile (games, hours, places, clubs).
 */
export function PlayerDetail({ id }: { id: string }) {
  const store = useStore();
  const nav = useDetailNav();
  const player = usePlayer(id);
  const { stats } = player;
  const clubs = player.clubIds.map((clubId) => store.club(clubId)).filter((c) => c !== undefined);
  const played = (Object.keys(stats.bySport) as (keyof typeof stats.bySport)[]).filter((s) => stats.bySport[s].games > 0);

  return (
    <DetailLayout title="Profile">
      <View style={styles.identity}>
        <Avatar member={{ id, name: player.name }} size={84} />
        <Text style={[type.title2, styles.center]} numberOfLines={2}>
          {player.name}
        </Text>
        <Text style={[type.subhead, styles.muted]}>
          {played.length > 0 ? played.map((s) => sports[s].label).join(' · ') : player.loading ? 'Loading…' : 'No games yet'}
        </Text>
        {player.since && <Text style={[type.footnote, styles.muted]}>On Coopeer since {player.since}</Text>}
      </View>

      <View style={styles.stats}>
        <StatRow
          stats={[
            { value: `${stats.games}`, label: 'Games' },
            { value: formatHours(stats.hours), label: 'Hours' },
            { value: `${stats.places}`, label: 'Places' },
            { value: `${stats.clubs}`, label: 'Clubs' },
          ]}
        />
      </View>

      <SportsSection stats={stats} favorites={[]} first />
      <AchievementsSection stats={stats} earnedOnly />

      {clubs.length > 0 && (
        <Section title="Clubs">
          <ListGroup>
            {clubs.map((club) => (
              <ListRow
                key={club.id}
                icon="people-outline"
                title={club.name}
                subtitle={`${sports[club.sport].label} · ${club.memberCount} members`}
                onPress={() => nav.club(club.id)}
              />
            ))}
          </ListGroup>
        </Section>
      )}
    </DetailLayout>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: space.xs, paddingTop: space.sm },
  center: { textAlign: 'center' },
  muted: { color: colors.label2 },
  stats: { ...card, paddingVertical: space.md },
});

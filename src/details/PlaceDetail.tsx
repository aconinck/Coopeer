import { StyleSheet, Text, View } from 'react-native';
import { colors, space, type } from '../constants/theme';
import { DetailLayout, useDetailNav } from '../ui/DetailLayout';
import { useStore } from '../state/store';
import { openDirections } from '../lib/format';
import { ActionBar, PrimaryButton } from '../ui/Buttons';
import { SectionHeader, SportIcon } from '../ui/Display';
import { ClubRow, GameRow } from '../ui/Rows';

/** A map pin's sheet: games happening here (one-time) and clubs that play here (recurring). */
export function PlaceDetail({ id }: { id: string }) {
  const nav = useDetailNav();
  const store = useStore();
  const place = store.place(id);

  if (!place) {
    return (
      <DetailLayout title="Place">
        <Text style={type.body}>This place doesn't exist anymore.</Text>
      </DetailLayout>
    );
  }

  const games = store.upcomingGamesAt(place.id);
  const clubs = store.clubsAt(place.id);

  return (
    <DetailLayout
      title={place.name}
      footer={
        <ActionBar>
          <PrimaryButton title="Directions" icon="navigate" onPress={() => openDirections(place)} />
        </ActionBar>
      }
    >
      <View style={styles.header}>
        <View style={styles.icons}>
          {place.sports.map((sport, index) => (
            <View key={sport} style={{ marginLeft: index === 0 ? 0 : -10 }}>
              <SportIcon sport={sport} size={44} ring />
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={type.title2}>{place.name}</Text>
          <Text style={[type.subhead, { color: colors.label2 }]}>{place.address}</Text>
        </View>
      </View>

      <SectionHeader title="Games here" caption="One-time. Tap one, say you're in, show up." />
      {games.length === 0 && <Text style={[type.subhead, { color: colors.label2 }]}>No games scheduled here yet.</Text>}
      {games.map((game, index) => (
        <GameRow key={game.id} index={index} game={game} showPlace={false} onPress={() => nav.game(game.id)} />
      ))}

      {clubs.length > 0 && <SectionHeader title="Clubs that play here" caption="Recurring groups. Join once, play every week." />}
      {clubs.map((club, index) => (
        <ClubRow key={club.id} index={games.length + index} club={club} onPress={() => nav.club(club.id)} />
      ))}
    </DetailLayout>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icons: { flexDirection: 'row' },
});

import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, space, type } from '../../src/constants/theme';
import { useStore } from '../../src/state/store';
import { openDirections } from '../../src/lib/format';
import { open } from '../../src/lib/nav';
import { ActionBar, PrimaryButton } from '../../src/ui/Buttons';
import { SectionHeader, SportIcon } from '../../src/ui/Display';
import { ClubRow, GameRow } from '../../src/ui/Rows';
import { Screen } from '../../src/ui/Screen';

/** A map pin's sheet: games happening here (one-time) and clubs that play here (recurring). */
export default function PlaceSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const place = store.place(id);

  if (!place) {
    return (
      <Screen variant="sheet" title="Place">
        <Text style={type.body}>This place doesn't exist anymore.</Text>
      </Screen>
    );
  }

  const games = store.upcomingGamesAt(place.id);
  const clubs = store.clubsAt(place.id);

  return (
    <Screen
      variant="sheet"
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
      {games.map((game) => (
        <GameRow key={game.id} game={game} showPlace={false} onPress={() => open.game(game.id)} />
      ))}

      {clubs.length > 0 && <SectionHeader title="Clubs that play here" caption="Recurring groups. Join once, play every week." />}
      {clubs.map((club) => (
        <ClubRow key={club.id} club={club} onPress={() => open.clubFromSheet(club.id)} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icons: { flexDirection: 'row' },
});

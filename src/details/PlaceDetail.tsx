import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from '../constants/theme';
import { DetailLayout, useDetailNav } from '../ui/DetailLayout';
import { useStore } from '../state/store';
import { openDirections } from '../lib/format';
import { ActionBar, PrimaryButton } from '../ui/Buttons';
import { SectionHeader, SportIcon } from '../ui/Display';
import { ClubRow, GameRow } from '../ui/Rows';
import { PlaceHero } from '../ui/PlaceHero';
import { placeKinds, sports, type SportId } from '../state/models';

const listSports = (ids: SportId[]) => {
  const names = ids.map((id) => sports[id].label.toLowerCase());
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

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
      <PlaceHero place={place} />

      <View style={styles.titleBlock}>
        <Text style={type.title2}>{place.name}</Text>
        <Text style={[type.subhead, { color: colors.label2 }]}>
          {placeKinds[place.kind].label} · {place.address}
        </Text>
      </View>

      {place.sports.length > 0 && (
        <>
          <SectionHeader title="Sports here" caption={`Available here: ${listSports(place.sports)}.`} />
          <View style={styles.sportRow}>
            {place.sports.map((sport) => (
              <View key={sport} style={styles.sportPill}>
                <SportIcon sport={sport} size={26} />
                <Text style={[type.subhead, { fontWeight: '600' }]}>{sports[sport].label}</Text>
              </View>
            ))}
          </View>
        </>
      )}

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
  titleBlock: { gap: 2 },
  sportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  sportPill: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6, paddingLeft: 6, paddingRight: space.md, borderRadius: radius.full, backgroundColor: colors.fill },
});

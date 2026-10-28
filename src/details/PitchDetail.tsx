import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { colors, mapColors, radius, space, type } from '../constants/theme';
import { useStore } from '../state/store';
import { pitchById, pitchSubtitle, pitchTitle, placeForPitch, type Pitch } from '../map/pitches';
import { ActionBar, PrimaryButton, SecondaryButton } from '../ui/Buttons';
import { DetailLayout, useDetailNav } from '../ui/DetailLayout';
import { SectionHeader, SportIcon, card } from '../ui/Display';
import { ClubRow, GameRow } from '../ui/Rows';

/**
 * A soccer field or pickleball court tapped on the map. Shows what already happens here and
 * lets anyone start something: a one-time game (no club needed) or a club that plays here weekly.
 */
export function PitchDetail({ id }: { id: string }) {
  const nav = useDetailNav();
  const store = useStore();
  const pitch = pitchById(id);

  if (!pitch) {
    return (
      <DetailLayout title="Field">
        <Text style={[type.body, styles.secondary]}>This field couldn't be found.</Text>
      </DetailLayout>
    );
  }

  const place = placeForPitch(pitch, store.places);
  const games = place ? store.upcomingGamesAt(place.id).filter((g) => g.sport === pitch.sport) : [];
  const clubs = place ? store.clubsAt(place.id).filter((c) => c.sport === pitch.sport) : [];

  return (
    <DetailLayout
      title={pitchTitle(pitch)}
      footer={
        <ActionBar caption="A game happens once — anyone can join. A club plays here every week.">
          <SecondaryButton title="Start a club" onPress={() => router.push(`/create/club?pitch=${pitch.id}`)} />
          <PrimaryButton title="Start a game" onPress={() => router.push(`/create/game?pitch=${pitch.id}`)} />
        </ActionBar>
      }
    >
      <View style={styles.hero}>
        <PitchIllustration pitch={pitch} />
      </View>

      <View style={styles.header}>
        <SportIcon sport={pitch.sport} size={40} />
        <View style={styles.flex}>
          <Text style={type.title2}>{pitchTitle(pitch)}</Text>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color={colors.label2} />
            <Text style={[type.subhead, styles.secondary]}>{pitchSubtitle(pitch)}</Text>
          </View>
        </View>
      </View>

      <SectionHeader title="Games here" caption="One-time. Tap one, say you're in, show up." />
      {games.length === 0 ? (
        <Text style={[type.subhead, styles.secondary]}>Nothing scheduled yet — be the first to start a game.</Text>
      ) : (
        games.map((game, index) => <GameRow key={game.id} game={game} index={index} showPlace={false} onPress={() => nav.game(game.id)} />)
      )}

      {clubs.length > 0 && <SectionHeader title="Clubs that play here" caption="Recurring groups. Join once, play every week." />}
      {clubs.map((club, index) => (
        <ClubRow key={club.id} club={club} index={index} onPress={() => nav.club(club.id)} />
      ))}
    </DetailLayout>
  );
}

/** Big version of the map illustration, always drawn landscape. */
function PitchIllustration({ pitch }: { pitch: Pitch }) {
  const soccer = pitch.sport === 'soccer';
  const L = 300;
  const W = soccer ? 190 : 140;
  const line = mapColors.fieldLine;
  return (
    <Svg width="100%" height={soccer ? 170 : 130} viewBox={`${-L / 2 - 10} ${-W / 2 - 10} ${L + 20} ${W + 20}`}>
      <Rect x={-L / 2} y={-W / 2} width={L} height={W} rx={10} fill={soccer ? mapColors.soccerField : mapColors.court} stroke={line} strokeWidth={4} />
      {soccer ? (
        <>
          <Line x1={0} y1={-W / 2} x2={0} y2={W / 2} stroke={line} strokeWidth={3} />
          <Circle r={W * 0.17} fill="none" stroke={line} strokeWidth={3} />
          <Circle r={3} fill={line} />
          <Rect x={-L / 2} y={-W * 0.24} width={L * 0.14} height={W * 0.48} fill="none" stroke={line} strokeWidth={3} />
          <Rect x={L / 2 - L * 0.14} y={-W * 0.24} width={L * 0.14} height={W * 0.48} fill="none" stroke={line} strokeWidth={3} />
          <Rect x={-L / 2} y={-W * 0.11} width={L * 0.05} height={W * 0.22} fill="none" stroke={line} strokeWidth={3} />
          <Rect x={L / 2 - L * 0.05} y={-W * 0.11} width={L * 0.05} height={W * 0.22} fill="none" stroke={line} strokeWidth={3} />
        </>
      ) : (
        <>
          <Line x1={0} y1={-W / 2} x2={0} y2={W / 2} stroke={line} strokeWidth={4} />
          <Line x1={-L * 0.16} y1={-W / 2} x2={-L * 0.16} y2={W / 2} stroke={line} strokeWidth={3} />
          <Line x1={L * 0.16} y1={-W / 2} x2={L * 0.16} y2={W / 2} stroke={line} strokeWidth={3} />
          <Line x1={-L / 2} y1={0} x2={-L * 0.16} y2={0} stroke={line} strokeWidth={3} />
          <Line x1={L * 0.16} y1={0} x2={L / 2} y2={0} stroke={line} strokeWidth={3} />
        </>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  secondary: { color: colors.label2 },
  hero: { ...card, padding: space.md, borderRadius: radius.card, backgroundColor: mapColors.ground },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, type } from '../../src/constants/theme';
import { gameStatus, isToday } from '../../src/state/models';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { open } from '../../src/lib/nav';
import { PrimaryButton } from '../../src/ui/Buttons';
import { SectionHeader } from '../../src/ui/Display';
import { GameRow } from '../../src/ui/Rows';
import { Screen } from '../../src/ui/Screen';

/** Figma "Hoje": games from your clubs plus games you said you're in for. */
export default function ScheduleScreen() {
  const store = useStore();
  const session = useSession();

  if (!session.isSignedIn) {
    return (
      <Screen variant="tab" title="Schedule">
        <Empty
          title="Your games live here"
          text="Sign in with your phone number to keep track of the games you're playing."
          action="Sign in"
          onPress={() => router.push('/auth')}
        />
      </Screen>
    );
  }

  const games = store.mySchedule;
  const today = games.filter((g) => isToday(gameStatus(g, store.now)));
  const upcoming = games.filter((g) => gameStatus(g, store.now) === 'later');

  return (
    <Screen variant="tab" title="Schedule">
      {games.length === 0 && (
        <Empty
          title="Nothing scheduled"
          text="Find a game on the map, or join a club to get its games here automatically."
          action="Explore the map"
          onPress={() => router.navigate('/map')}
        />
      )}
      {today.length > 0 && <SectionHeader title="Today" />}
      {today.map((game, index) => (
        <GameRow key={game.id} index={index} game={game} onPress={() => open.game(game.id)} />
      ))}
      {upcoming.length > 0 && <SectionHeader title="Upcoming" />}
      {upcoming.map((game, index) => (
        <GameRow key={game.id} index={today.length + index} game={game} onPress={() => open.game(game.id)} />
      ))}
    </Screen>
  );
}

function Empty({ title, text, action, onPress }: { title: string; text: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="calendar" size={44} color={colors.label3} />
      <Text style={type.title2}>{title}</Text>
      <Text style={[type.subhead, styles.text]}>{text}</Text>
      <View style={styles.action}>
        <PrimaryButton title={action} onPress={onPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  text: { color: colors.label2, textAlign: 'center', paddingHorizontal: space.lg },
  action: { flexDirection: 'row', alignSelf: 'stretch', marginTop: space.sm },
});

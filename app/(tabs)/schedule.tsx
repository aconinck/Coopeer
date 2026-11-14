import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, type } from '../../src/constants/theme';
import { gameStatus, isToday } from '../../src/state/models';
import { time, weekday } from '../../src/lib/format';
import { useStore } from '../../src/state/store';
import { open } from '../../src/lib/nav';
import { PrimaryButton } from '../../src/ui/Buttons';
import { Section } from '../../src/ui/Layout';
import { ListGroup, ListRow } from '../../src/ui/ListGroup';
import { GameRow } from '../../src/ui/Rows';
import { Screen, MoreMenu } from '../../src/ui/Screen';

/** Figma "Hoje": games from your clubs plus games you said you're in for. */
export default function ScheduleScreen() {
  const store = useStore();

  const games = store.mySchedule;
  // "You're in" is only what you confirmed (this game or every week); club games you have not answered wait below.
  const confirmed = games.filter((g) => g.myRSVP === 'going');
  const pending = games.filter((g) => (g.myRSVP === 'none' || g.myRSVP === 'maybe') && !g.isCanceled);
  const today = confirmed.filter((g) => isToday(gameStatus(g, store.now)));
  const upcoming = confirmed.filter((g) => gameStatus(g, store.now) === 'later');
  // The next game of every series you joined every week: this is where "weekly" is told apart from one-time games.
  const weeklyNext = [...new Map(confirmed.filter((g) => store.isWeekly(g) && !g.isCanceled).map((g) => [g.seriesId, g])).values()];

  return (
    <Screen variant="tab" title="Schedule" trailing={<MoreMenu icon="add" label="Create" items={[
        { label: 'Start a game', icon: 'football-outline', onPress: () => router.push('/create/game') },
        { label: 'Create a club', icon: 'people-outline', onPress: () => router.push('/create/club') },
        { label: 'Join via code', icon: 'qr-code-outline', onPress: () => router.push('/join?mode=scan') },
      ]} />}>
      {confirmed.length + pending.length === 0 && (
        <Empty
          title="Nothing scheduled"
          text="Find a game on the map, or join a club and its games show up here to confirm."
          action="Explore the map"
          onPress={() => router.navigate('/map')}
        />
      )}
      {weeklyNext.length > 0 && (
        <Section first title="Every week" caption="Games you joined every week. Open one to skip a week or stop.">
          <ListGroup>
            {weeklyNext.map((g) => (
              <ListRow key={g.seriesId} icon="repeat" tint={colors.brand} title={g.title} subtitle={`Every ${weekday(g.start)} · ${time(g.start)}${store.club(g.clubId ?? '') ? ` · ${store.club(g.clubId ?? '')?.name}` : ''}`} onPress={() => open.game(g.id)} />
            ))}
          </ListGroup>
        </Section>
      )}
      {today.length > 0 && (
        <Section first={weeklyNext.length === 0} title="Today" caption={`${today.length} ${today.length === 1 ? 'game' : 'games'}`}>
          {today.map((game, index) => (
            <GameRow key={game.id} index={index} game={game} onPress={() => open.game(game.id)} />
          ))}
        </Section>
      )}
      {upcoming.length > 0 && (
        <Section first={today.length === 0 && weeklyNext.length === 0} title="Upcoming" caption="Games you're in for.">
          {upcoming.map((game, index) => (
            <GameRow key={game.id} index={today.length + index} game={game} onPress={() => open.game(game.id)} />
          ))}
        </Section>
      )}
      {pending.length > 0 && (
        <Section first={confirmed.length === 0} title="From your clubs" caption="Not confirmed yet. Say if you're in.">
          {pending.map((game, index) => (
            <GameRow key={game.id} index={confirmed.length + index} game={game} onPress={() => open.game(game.id)} />
          ))}
        </Section>
      )}
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

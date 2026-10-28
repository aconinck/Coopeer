import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, type } from '../../src/constants/theme';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { open } from '../../src/lib/nav';
import { PrimaryButton, SecondaryButton } from '../../src/ui/Buttons';
import { ClubCard, GamesVsClubsCard } from '../../src/ui/Rows';
import { MoreMenu, Screen } from '../../src/ui/Screen';

const joinScan = () => router.push('/join?mode=scan');
const joinCode = () => router.push('/join?mode=code');

/** Figma "Seus Clubes": the clubs you belong to. "+" is how you join a new one. */
export default function ClubsScreen() {
  const store = useStore();
  const session = useSession();
  const clubs = session.isSignedIn ? store.myClubs : [];

  const rows: (typeof clubs)[] = [];
  for (let i = 0; i < clubs.length; i += 2) rows.push(clubs.slice(i, i + 2));

  return (
    <Screen variant="tab" title="Your Clubs" trailing={
        <MoreMenu
          icon="add"
          label="Join a club"
          items={[
            { label: 'Scan QR code', icon: 'qr-code-outline', onPress: joinScan },
            { label: 'Enter team code', icon: 'keypad-outline', onPress: joinCode },
            { label: 'Find clubs on the map', icon: 'map-outline', onPress: () => router.navigate('/explore') },
          ]}
        />
      }>
      {clubs.length > 0 ? (
        rows.map((row, rowIndex) => (
          <View key={row.map((c) => c.id).join('-')} style={styles.gridRow}>
            {row.map((club, col) => (
              <ClubCard key={club.id} index={rowIndex * 2 + col} club={club} onPress={() => open.clubPage(club.id)} />
            ))}
            {row.length === 1 && <View style={styles.flex} />}
          </View>
        ))
      ) : (
        <>
          <View style={styles.empty}>
            <Ionicons name="people" size={44} color={colors.label3} />
            <Text style={type.title2}>No clubs yet</Text>
            <Text style={[type.subhead, styles.emptyText]}>
              Got a code or QR from a club organizer? Join in seconds. Or find clubs that play near you on the map.
            </Text>
            <View style={styles.emptyActions}>
              <PrimaryButton title="Scan QR code" icon="qr-code-outline" onPress={joinScan} />
              <SecondaryButton title="Enter code" icon="keypad-outline" onPress={joinCode} />
            </View>
          </View>
          <GamesVsClubsCard />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gridRow: { flexDirection: 'row', gap: space.md },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  emptyText: { color: colors.label2, textAlign: 'center', paddingHorizontal: space.lg },
  emptyActions: { flexDirection: 'row', gap: space.sm, alignSelf: 'stretch', marginTop: space.sm },
});

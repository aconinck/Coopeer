import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, type } from '../../src/constants/theme';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { open } from '../../src/lib/nav';
import { PrimaryButton, SecondaryButton, TextButton } from '../../src/ui/Buttons';
import { ClubCard, GamesVsClubsCard } from '../../src/ui/Rows';
import { MoreMenu, Screen } from '../../src/ui/Screen';
import { Rail, Section } from '../../src/ui/Layout';

const createClub = () => router.push('/create/club');
const joinScan = () => router.push('/join?mode=scan');
const joinCode = () => router.push('/join?mode=code');

/** Figma "Seus Clubes": the clubs you belong to. "+" creates or joins one. */
export default function ClubsScreen() {
  const store = useStore();
  const session = useSession();
  const clubs = session.isSignedIn ? store.myClubs : [];

  const discover = store.clubs.filter((c) => !store.isMember(c.id)).sort((a, b) => Number(!!b.verified) - Number(!!a.verified));

  const rows: (typeof clubs)[] = [];
  for (let i = 0; i < clubs.length; i += 2) rows.push(clubs.slice(i, i + 2));

  return (
    <Screen variant="tab" title="Your Clubs" trailing={
        <MoreMenu
          icon="add"
          label="Add a club"
          items={[
            { label: 'Create a club', icon: 'add-circle-outline', onPress: createClub },
            { label: 'Scan QR code', icon: 'qr-code-outline', onPress: joinScan },
            { label: 'Enter team code', icon: 'keypad-outline', onPress: joinCode },
            { label: 'Find clubs on the map', icon: 'map-outline', onPress: () => router.navigate('/map') },
          ]}
        />
      }>
      {clubs.length > 0 ? (
        <Section first title="Your clubs" caption={`${clubs.length} ${clubs.length === 1 ? 'club' : 'clubs'} · games land in your schedule`}>
          {rows.map((row, rowIndex) => (
            <View key={row.map((c) => c.id).join('-')} style={styles.gridRow}>
              {row.map((club, col) => (
                <ClubCard key={club.id} index={rowIndex * 2 + col} club={club} onPress={() => open.clubPage(club.id)} />
              ))}
              {row.length === 1 && <View style={styles.flex} />}
            </View>
          ))}
        </Section>
      ) : (
        <>
          <View style={styles.empty}>
            <Ionicons name="people" size={44} color={colors.label3} />
            <Text style={type.title2}>No clubs yet</Text>
            <Text style={[type.subhead, styles.emptyText]}>
              Got a code or QR from a club organizer? Join in seconds. Or start your own club and invite your crew.
            </Text>
            <View style={styles.emptyActions}>
              <PrimaryButton title="Scan QR code" icon="qr-code-outline" onPress={joinScan} />
              <SecondaryButton title="Enter code" icon="keypad-outline" onPress={joinCode} />
            </View>
            <TextButton title="Create a club" onPress={createClub} />
          </View>
          <GamesVsClubsCard />
        </>
      )}

      {discover.length > 0 && (
        <Section first={false} title="Clubs near you" caption="Verified first. Join once, play every week." action={{ label: 'Map', onPress: () => router.navigate('/map') }}>
          <Rail snap={176}>
            {discover.map((club) => (
              <ClubCard key={club.id} club={club} width={176} onPress={() => open.club(club.id)} />
            ))}
          </Rail>
        </Section>
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

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, type } from '../../src/constants/theme';
import { enter } from '../../src/constants/motion';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { ME, type Club } from '../../src/state/models';
import { confirmDestructive } from '../../src/lib/format';
import { open } from '../../src/lib/nav';
import { formatHours } from '../../src/state/profile';
import { AchievementsSection, SportsSection } from '../../src/profile/PlayerSections';
import { usePlayer } from '../../src/profile/usePlayer';
import { Avatar, StatRow, card } from '../../src/ui/Display';
import { Rail, Section } from '../../src/ui/Layout';
import { ListGroup, ListRow } from '../../src/ui/ListGroup';
import { ClubCard } from '../../src/ui/Rows';
import { Screen } from '../../src/ui/Screen';
import { PhotoPicker } from '../../src/ui/PhotoPicker';

const HOME_TOWN = 'Bentonville, AR';

/**
 * Profile (Airbnb / AllTrails / Uber patterns): identity card with four numbers, your sports,
 * achievements, your clubs, then account settings. Every number is derived from games you played.
 */
export default function ProfileScreen() {
  const store = useStore();
  const session = useSession();
  const user = session.user;
  const reduceMotion = useReducedMotion();
  const player = usePlayer(user?.id ?? 'me');
  const stagger = (index: number) => (reduceMotion ? undefined : enter(index));
  const { stats } = player;
  const [editingPhoto, setEditingPhoto] = React.useState(false);
  const [pendingPhoto, setPendingPhoto] = React.useState<string | null>(null);

  const savePhoto = async () => {
    await session.updatePhoto(pendingPhoto);
    setEditingPhoto(false);
    setPendingPhoto(null);
  };

  return (
    <Screen variant="tab" title="Profile">
      {editingPhoto && (
        <View style={styles.photoModal}>
          <View style={styles.photoModalCard}>
            <Text style={[type.headline, styles.photoModalTitle]}>Update photo</Text>
            <PhotoPicker
              photoUri={pendingPhoto ?? user?.photoUri ?? null}
              onChange={setPendingPhoto}
            />
            <View style={styles.photoModalActions}>
              <Pressable onPress={() => { setEditingPhoto(false); setPendingPhoto(null); }} style={styles.photoModalCancel}>
                <Text style={[type.body, { color: colors.label2 }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={savePhoto} style={styles.photoModalSave}>
                <Text style={[type.body, { color: colors.white, fontWeight: '600' }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <Animated.View entering={stagger(0)}>
        <View style={styles.identity}>
          <View style={styles.identityTop}>
            <Pressable onPress={() => { setPendingPhoto(null); setEditingPhoto(true); }} style={{ position: 'relative' }}>
              {user && <Avatar member={{ id: user.id, name: user.name, photoUri: user.photoUri }} size={84} />}
              <View style={styles.editPhotoBadge}>
                <Ionicons name="camera" size={12} color={colors.white} />
              </View>
            </Pressable>
            <View style={styles.identityText}>
              <Text style={type.title2} numberOfLines={1}>
                {user?.name ?? 'Player'}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons name="location-sharp" size={13} color={colors.label2} />
                <Text style={[type.subhead, styles.muted]}>{HOME_TOWN}</Text>
              </View>
              {player.since && <Text style={[type.footnote, styles.muted]}>On Coopeer since {player.since}</Text>}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsBleed}>
            <StatRow
              stats={[
                { value: `${stats.games}`, label: 'Games' },
                { value: formatHours(stats.hours), label: 'Hours' },
                { value: `${stats.places}`, label: 'Places' },
                { value: `${store.myClubs.length}`, label: 'Clubs' },
              ]}
            />
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={stagger(1)}>
        <SportsSection stats={stats} favorites={player.favorites} caption="Games and hours, counted from every game you play." />
      </Animated.View>

      <Animated.View entering={stagger(2)}>
        <AchievementsSection stats={stats} />
      </Animated.View>

      <Animated.View entering={stagger(3)}>
        <ClubsSection myClubs={store.myClubs} uid={user?.id} />
      </Animated.View>

      <Animated.View entering={stagger(4)}>
        <Section title="Account">
          <ListGroup>
            <ListRow icon="person-outline" title="Personal info" subtitle="Name, phone number" onPress={() => router.push('/personal-info')} />
            <ListRow icon="card-outline" title="Payments" subtitle="Memberships and payment methods" onPress={() => router.push('/payments')} />
            <ListRow icon="help-circle-outline" title="How Coopeer works" onPress={() => router.push('/how-it-works')} />
          </ListGroup>
          <ListGroup>
            <ListRow
              icon="log-out-outline"
              title="Sign out"
              destructive
              onPress={() => confirmDestructive('Sign out of Coopeer?', 'You can sign back in anytime with your phone number.', 'Sign out', session.signOut)}
            />
          </ListGroup>
        </Section>
      </Animated.View>
    </Screen>
  );
}

function ClubsSection({ myClubs, uid }: { myClubs: Club[]; uid?: string }) {
  const meId = uid ?? ME.id;
  const adminClubs = myClubs.filter((c) => c.adminIds?.includes(meId));
  const memberClubs = myClubs.filter((c) => !c.adminIds?.includes(meId));

  if (myClubs.length === 0) {
    return (
      <Section title="Your clubs" action={{ label: 'See all', onPress: () => router.navigate('/clubs') }}>
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/map')} style={({ pressed }) => [styles.emptyClubs, pressed && { opacity: 0.7 }]}>
          <Ionicons name="people-outline" size={22} color={colors.label2} />
          <Text style={[type.subhead, styles.flex]}>You haven't joined a club yet. Find one on the map.</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.label3} />
        </Pressable>
      </Section>
    );
  }

  return (
    <Section title="Your clubs" action={{ label: 'See all', onPress: () => router.navigate('/clubs') }}>
      {adminClubs.length > 0 && (
        <View style={styles.subGroup}>
          <Text style={[type.footnote, styles.subLabel]}>Managing</Text>
          <Rail snap={176}>
            {adminClubs.map((club) => (
              <ClubCard key={club.id} club={club} width={176} onPress={() => open.clubPage(club.id)} />
            ))}
          </Rail>
        </View>
      )}
      {memberClubs.length > 0 && (
        <View style={adminClubs.length > 0 ? styles.subGroup : undefined}>
          {adminClubs.length > 0 && <Text style={[type.footnote, styles.subLabel]}>Member</Text>}
          <Rail snap={176}>
            {memberClubs.map((club) => (
              <ClubCard key={club.id} club={club} width={176} onPress={() => open.clubPage(club.id)} />
            ))}
          </Rail>
        </View>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  muted: { color: colors.label2 },
  identity: { ...card, padding: space.lg, gap: space.lg },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  identityText: { flex: 1, gap: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editPhotoBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brand,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModal: {
    position: 'absolute',
    inset: 0,
    zIndex: 100,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  photoModalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: space.xl,
    width: '100%',
    maxWidth: 400,
    gap: space.xl,
    alignItems: 'center',
  },
  photoModalTitle: { alignSelf: 'flex-start' },
  photoModalActions: { flexDirection: 'row', gap: space.md, alignSelf: 'stretch' },
  photoModalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  photoModalSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    backgroundColor: colors.brand,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  statsBleed: { marginHorizontal: -space.md },
  emptyClubs: { ...card, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  subGroup: { gap: space.xs },
  subLabel: { color: colors.label2, paddingHorizontal: space.lg },
});

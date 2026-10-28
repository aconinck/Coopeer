import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../../src/constants/theme';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { confirmDestructive } from '../../src/lib/format';
import type { IconName } from '../../src/ui/Buttons';
import { Avatar, card } from '../../src/ui/Display';
import { Screen } from '../../src/ui/Screen';

/** Figma "Perfil": who you are, payments, and sign out. */
export default function ProfileScreen() {
  const store = useStore();
  const session = useSession();
  const user = session.user;
  const goingCount = store.mySchedule.filter((g) => g.myRSVP === 'going').length;

  return (
    <Screen variant="tab" title="Profile">
      <View style={styles.header}>
        {user ? (
          <>
            <Avatar member={{ id: user.id, name: user.name }} size={88} />
            <Text style={[type.title2, styles.white]}>{user.name}</Text>
            <Text style={[type.subhead, styles.whiteSoft]}>
              {store.myClubs.length} clubs · {goingCount} games coming up
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="person-circle" size={80} color={colors.white} />
            <Text style={[type.title3, styles.white]}>You're browsing as a guest</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/auth')} style={({ pressed }) => [styles.signIn, pressed && { opacity: 0.7 }]}>
              <Text style={[type.headline, styles.white]}>Sign in with phone</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={card}>
        {user && <Row icon="person-outline" label="Personal info" onPress={() => router.push('/personal-info')} />}
        {user && <Row icon="card-outline" label="Payments" onPress={() => router.push('/payments')} divider />}
        <Row icon="help-circle-outline" label="How Coopeer works" onPress={() => router.push('/how-it-works')} divider={!!user} />
      </View>

      {user && (
        <View style={card}>
          <Row
            label="Sign out"
            destructive
            onPress={() =>
              confirmDestructive('Sign out of Coopeer?', 'You can sign back in anytime with your phone number.', 'Sign out', session.signOut)
            }
          />
        </View>
      )}
    </Screen>
  );
}

function Row({ icon, label, onPress, divider, destructive }: { icon?: IconName; label: string; onPress: () => void; divider?: boolean; destructive?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && { backgroundColor: colors.fill }]}
    >
      {icon && <Ionicons name={icon} size={20} color={colors.brand} />}
      <Text style={[type.body, styles.flex, destructive && { color: colors.live }]}>{label}</Text>
      {!destructive && <Ionicons name="chevron-forward" size={16} color={colors.label3} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand,
    borderRadius: radius.card,
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
  },
  white: { color: colors.white },
  whiteSoft: { color: colors.white, opacity: 0.85 },
  signIn: {
    marginTop: space.sm,
    paddingHorizontal: space.xl,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, minHeight: 50 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  flex: { flex: 1 },
});

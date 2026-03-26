// Profile — personal stats, payments, settings.
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/shared/Avatar';
import { NavBar } from '../../src/components/shared/NavBar';
import { colors, typography, spacing, radius } from '../../src/constants/theme';

// Mock user data — replace with useAuth() when auth is wired up
const MOCK_USER = {
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  stats: { games: 14, goals: 7, winRate: 64 },
  eloRating: 1380,
  trustScore: 95,
};

interface StatCellProps {
  value: string | number;
  label: string;
}

function StatCell({ value, label }: StatCellProps) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface MenuRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}

function MenuRow({ icon, label, onPress, destructive }: MenuRowProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuRow} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={destructive ? colors.error : colors.gray500} />
      <Text style={[styles.menuLabel, destructive && styles.destructiveLabel]}>{label}</Text>
      {!destructive && <Ionicons name="chevron-forward" size={16} color={colors.gray100} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={styles.identityCard}>
          <Avatar name={MOCK_USER.name} size={64} />
          <View>
            <Text style={styles.userName}>{MOCK_USER.name}</Text>
            <Text style={styles.userEmail}>{MOCK_USER.email}</Text>
            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark" size={12} color={colors.success} />
              <Text style={styles.trustScore}>Trust score: {MOCK_USER.trustScore}/100</Text>
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCell value={MOCK_USER.stats.games} label="Games" />
          <StatCell value={MOCK_USER.stats.goals} label="Goals" />
          <StatCell value={`${MOCK_USER.stats.winRate}%`} label="Win rate" />
          <StatCell value={MOCK_USER.eloRating} label="ELO" />
        </View>

        {/* Settings menu */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuRow icon="card-outline" label="Payment methods" />
            <MenuRow icon="receipt-outline" label="Billing history" />
            <MenuRow icon="notifications-outline" label="Notifications" />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>App</Text>
          <View style={styles.menuCard}>
            <MenuRow icon="share-outline" label="Share Coopeer" />
            <MenuRow icon="help-circle-outline" label="Help & Support" />
            <MenuRow icon="log-out-outline" label="Sign out" destructive />
          </View>
        </View>
      </ScrollView>

      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 64,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    letterSpacing: typography.tracking.tight,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  identityCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  userName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  trustScore: {
    fontSize: typography.sizes.sm,
    color: colors.success,
    fontWeight: typography.weights.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.gray100,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
    marginTop: 2,
  },
  menuSection: {
    gap: spacing.sm,
  },
  menuSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.black,
  },
  destructiveLabel: {
    color: colors.error,
  },
});

// Manager dashboard — revenue overview, delinquent members.
// Figma: Dashboard section (_user/teampage)
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../src/components/shared/Avatar';
import { colors, typography, spacing, radius } from '../../../src/constants/theme';

const SCREEN_W = Dimensions.get('window').width;

// Mock revenue data — 6 months
const MONTHLY_DATA = [
  { month: 'Jan', amount: 450 },
  { month: 'Feb', amount: 450 },
  { month: 'Mar', amount: 490 },
  { month: 'Apr', amount: 450 },
  { month: 'May', amount: 450 },
  { month: 'Jun', amount: 1250 },
];

const DELINQUENTS = [
  { id: 'd1', name: 'Arthur Coninck', amount: 300 },
  { id: 'd2', name: 'Ronald Hills', amount: 300 },
  { id: 'd3', name: 'Marcos Castro', amount: 300 },
  { id: 'd4', name: 'Keylor Navas', amount: 300 },
  { id: 'd5', name: 'Dave Jones', amount: 300 },
];

const BAR_MAX = Math.max(...MONTHLY_DATA.map((d) => d.amount));
const BAR_HEIGHT = 80;
const BAR_WIDTH = Math.floor((SCREEN_W - spacing.lg * 2 - 32) / MONTHLY_DATA.length);

type View_ = 'overview' | 'delinquents';

export default function DashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeView, setActiveView] = useState<View_>('overview');

  if (activeView === 'delinquents') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveView('overview')}>
            <Ionicons name="chevron-back" size={20} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delinquents</Text>
          <View style={{ width: 20 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* "Cobrar Todos" */}
          <TouchableOpacity style={styles.chargeAllBtn}>
            <Text style={styles.chargeAllText}>Charge all</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Delinquent list</Text>

          {DELINQUENTS.map((d) => (
            <View key={d.id} style={styles.delinquentRow}>
              <Avatar name={d.name} size={36} />
              <View style={styles.delinquentInfo}>
                <Text style={styles.delinquentName}>{d.name}</Text>
                <Text style={styles.delinquentAmount}>${d.amount.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.chargeBtn}>
                <Text style={styles.chargeBtnText}>Charge</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.adminNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.adminNavBtn}>
            <Ionicons name="bar-chart" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/event/create?teamId=${id}` as never)}
            style={styles.adminNavBtn}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Monthly earnings */}
        <View style={styles.metricsCard}>
          <View style={styles.metricHeader}>
            <View style={styles.metricTitleRow}>
              <Ionicons name="flame" size={14} color={colors.primary} />
              <Text style={styles.metricTitle}>Monthly earnings</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAllLink}>See all ↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.earningsRow}>
            <Text style={styles.earningsAmount}>$1,250.00</Text>
            <View style={styles.growthBadge}>
              <Text style={styles.growthText}>+4.5%</Text>
            </View>
          </View>

          {/* Bar chart */}
          <View style={styles.chart}>
            {MONTHLY_DATA.map((d, i) => {
              const barH = Math.max(4, (d.amount / BAR_MAX) * BAR_HEIGHT);
              const isCurrent = i === MONTHLY_DATA.length - 1;
              return (
                <View key={d.month} style={[styles.barColumn, { width: BAR_WIDTH }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barH,
                        backgroundColor: isCurrent ? colors.success : colors.gray100,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{d.month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Delinquents */}
        <TouchableOpacity style={styles.metricsCard} onPress={() => setActiveView('delinquents')}>
          <View style={styles.metricHeader}>
            <View style={styles.metricTitleRow}>
              <Ionicons name="alert-circle" size={14} color={colors.primary} />
              <Text style={styles.metricTitle}>Delinquents</Text>
            </View>
            <Text style={styles.seeAllLink}>See all</Text>
          </View>

          <View style={styles.earningsRow}>
            <Text style={[styles.earningsAmount, styles.negativeAmount]}>-$250.00</Text>
            <View style={[styles.growthBadge, styles.growthBadgeNeutral]}>
              <Text style={[styles.growthText, styles.growthTextNeutral]}>+1.5%</Text>
            </View>
          </View>

          {/* Small delinquent chart */}
          <View style={styles.chart}>
            {MONTHLY_DATA.map((d, i) => {
              const barH = Math.max(4, (d.amount / BAR_MAX) * 48);
              const isCurrent = i === MONTHLY_DATA.length - 1;
              return (
                <View key={d.month} style={[styles.barColumn, { width: BAR_WIDTH }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barH,
                        backgroundColor: isCurrent ? colors.primary : colors.gray100,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{d.month}</Text>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.adminNav}>
        <TouchableOpacity style={[styles.adminNavBtn, styles.adminNavBtnActive]}>
          <Ionicons name="bar-chart" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/event/create?teamId=${id}` as never)}
          style={styles.adminNavBtn}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.gray500} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primaryLight,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
    letterSpacing: typography.tracking.tight,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  metricsCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricTitle: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  seeAllLink: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  earningsAmount: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.black,
    letterSpacing: typography.tracking.tight,
  },
  negativeAmount: {
    color: colors.error,
  },
  growthBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  growthBadgeNeutral: {
    backgroundColor: colors.primaryMid,
  },
  growthText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#059669',
  },
  growthTextNeutral: {
    color: colors.primary,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: BAR_HEIGHT + 20,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  bar: {
    borderRadius: radius.sm,
    width: '80%',
  },
  barLabel: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
  },
  sectionLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  chargeAllBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  chargeAllText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  delinquentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  delinquentInfo: {
    flex: 1,
  },
  delinquentName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  delinquentAmount: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  chargeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  chargeBtnText: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    fontWeight: typography.weights.bold,
  },
  adminNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  adminNavBtn: {
    padding: spacing.sm,
  },
  adminNavBtnActive: {
    opacity: 1,
  },
});

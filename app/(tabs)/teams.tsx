// My Teams — dashboard showing all teams the user participates in.
// Figma reference: node 254:1431 (Main Screens / Dashboard)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TeamCard } from '../../src/components/team/TeamCard';
import { NavBar } from '../../src/components/shared/NavBar';
import { getMyTeams, getTeamEvents } from '../../src/services/api';
import { colors, typography, spacing } from '../../src/constants/theme';
import type { Team, Event } from '../../src/types';

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [nextEvents, setNextEvents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTeams().then(async (myTeams) => {
      setTeams(myTeams);

      // Fetch the next event date for each team
      const eventsMap: Record<string, string> = {};
      await Promise.all(
        myTeams.map(async (team) => {
          const events = await getTeamEvents(team.id);
          const next = events
            .filter((e) => e.date > new Date())
            .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
          if (next) {
            eventsMap[team.id] = next.date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
          }
        })
      );
      setNextEvents(eventsMap);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header — matches Figma: #FFF8ED bg, title + add button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Teams</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : teams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No teams yet</Text>
          <Text style={styles.emptySubtitle}>
            Discover teams on the map and join your first game
          </Text>
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TeamCard team={item} nextEventDate={nextEvents[item.id]} />
          )}
        />
      )}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.sizes.base,
    color: colors.gray500,
    textAlign: 'center',
  },
  grid: {
    padding: spacing.md,
    paddingBottom: 100,
    gap: 12,
  },
  row: {
    gap: 12,
    justifyContent: 'flex-start',
  },
});

// Schedule — all upcoming events across all of the user's teams.
// Useful for multi-sport users. Groups events by date.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventCard } from '../../src/components/event/EventCard';
import { NavBar } from '../../src/components/shared/NavBar';
import { getMyEvents } from '../../src/services/api';
import { colors, typography, spacing } from '../../src/constants/theme';
import type { Event } from '../../src/types';

interface Section {
  title: string;
  data: Event[];
}

function groupEventsByDate(events: Event[]): Section[] {
  const map = new Map<string, Event[]>();

  events
    .filter((e) => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .forEach((event) => {
      const dateKey = event.date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(event);
    });

  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function ScheduleScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyEvents().then((events) => {
      setSections(groupEventsByDate(events));
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No upcoming games</Text>
          <Text style={styles.emptySubtitle}>
            Join a team to see your schedule here
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <EventCard event={item} />
          )}
          stickySectionHeadersEnabled={false}
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
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
    gap: spacing.sm,
  },
  sectionHeader: {
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
  },
});

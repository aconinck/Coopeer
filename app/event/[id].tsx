// Event detail — matches Figma node 456:2877 (_user/teampage)
// Modal-style card with date/time chips, progress bar, RSVP CTAs.
// Guest list opens as a second bottom sheet.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Avatar } from '../../src/components/shared/Avatar';
import { getEvent } from '../../src/services/api';
import { colors, typography, spacing, radius } from '../../src/constants/theme';
import type { Event, Member } from '../../src/types';

const SCREEN_H = Dimensions.get('window').height;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [guestListOpen, setGuestListOpen] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');

  const sheetY = useSharedValue(SCREEN_H);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  useEffect(() => {
    if (!id) return;
    getEvent(id).then((e) => {
      setEvent(e ?? null);
      setLoading(false);
    });
  }, [id]);

  function openGuestList() {
    setGuestListOpen(true);
    sheetY.value = withSpring(0, { damping: 22 });
  }

  function closeGuestList() {
    sheetY.value = withSpring(SCREEN_H, { damping: 22 }, () => {
      // runOnJS needed but keeping it simple — state update is fast enough
    });
    setTimeout(() => setGuestListOpen(false), 350);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </SafeAreaView>
    );
  }

  const confirmedCount = event.confirmed.length;
  const totalGuests = event.maxPlayers;
  const progressPct = Math.min(1, confirmedCount / totalGuests);
  const descLong = event.description.length > 80;

  // Format date/time chips — matches Figma "Dez 20" + "7:00 pm - 8:00 pm"
  const dateChip = event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStart = event.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const timeEnd = event.endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const allMembers = [
    ...event.confirmed.map((m) => ({ ...m, status: 'confirmed' as const })),
    ...event.declined.map((m) => ({ ...m, status: 'declined' as const })),
    ...event.pending.map((m) => ({ ...m, status: 'pending' as const })),
  ].filter((m) => !guestSearch || m.name.toLowerCase().includes(guestSearch.toLowerCase()));

  const confirmedFiltered = allMembers.filter((m) => m.status === 'confirmed');
  const declinedFiltered = allMembers.filter((m) => m.status === 'declined');
  const pendingFiltered = allMembers.filter((m) => m.status === 'pending');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Event</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.black} />
          </TouchableOpacity>
        </View>

        {/* Title + description */}
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View>
          <Text style={styles.description} numberOfLines={descExpanded || !descLong ? undefined : 2}>
            {event.description}
          </Text>
          {descLong && (
            <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)}>
              <Text style={styles.readMore}>{descExpanded ? 'See less' : 'Read all'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date + time chips — matches Figma */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{dateChip}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{timeStart} – {timeEnd}</Text>
          </View>
        </View>

        {/* Location row — matches Figma: pin icon, venue bold, address underlined */}
        <View style={styles.locationDivider} />
        <TouchableOpacity style={styles.locationRow} activeOpacity={0.7}>
          <Ionicons name="location" size={18} color={colors.gray500} />
          <View style={styles.locationText}>
            <Text style={styles.venueName}>{event.venueName}</Text>
            <Text style={styles.venueAddress}>{event.venueAddress}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.gray100} />
        </TouchableOpacity>
        <View style={styles.locationDivider} />

        {/* Confirmed section */}
        <Text style={styles.confirmedLabel}>Confirmed</Text>
        <View style={styles.confirmedRow}>
          <Text style={styles.guestCount}>{totalGuests} guests</Text>
          <Text style={styles.confirmedCount}>{confirmedCount} confirmed</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
        </View>

        {/* Action pills — "Ver Confirmados" + "Compartilhar" */}
        <View style={styles.pillActions}>
          <TouchableOpacity style={styles.pillBtn} onPress={openGuestList}>
            <Text style={styles.pillBtnText}>View confirmed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pillBtn}>
            <Text style={styles.pillBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* RSVP bar — "Recusar" + "To Dentro" */}
      <View style={styles.rsvpBar}>
        <SafeAreaView edges={['bottom']} style={styles.rsvpInner}>
          <TouchableOpacity style={[styles.rsvpBtn, styles.rsvpDecline]}>
            <Text style={styles.rsvpDeclineText}>Can't make it</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rsvpBtn, styles.rsvpConfirm]}>
            <Text style={styles.rsvpConfirmText}>I'm in!</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Guest list sheet */}
      {guestListOpen && (
        <Animated.View style={[styles.guestSheet, sheetStyle]}>
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Search */}
            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color={colors.gray500} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor={colors.gray500}
                value={guestSearch}
                onChangeText={setGuestSearch}
              />
            </View>

            <ScrollView contentContainerStyle={styles.guestList} showsVerticalScrollIndicator={false}>
              <MemberSection title="Confirmed" members={confirmedFiltered} />
              <MemberSection title="Declined" members={declinedFiltered} />
              <MemberSection title="No response" members={pendingFiltered} />
            </ScrollView>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={closeGuestList}>
              <Ionicons name="close" size={20} color={colors.gray500} />
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function MemberSection({
  title,
  members,
}: {
  title: string;
  members: (Member & { status: 'confirmed' | 'declined' | 'pending' })[];
}) {
  if (members.length === 0) return null;
  return (
    <View style={styles.guestSection}>
      <Text style={styles.guestSectionTitle}>{title}</Text>
      {members.map((m) => (
        <View key={m.id} style={styles.guestRow}>
          <Avatar name={m.name} uri={m.avatar} size={38} />
          <Text style={styles.guestName}>{m.name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: colors.gray500,
    margin: spacing.xl,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
    letterSpacing: typography.tracking.tight,
  },
  eventTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
    letterSpacing: typography.tracking.tight,
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.gray500,
    lineHeight: 22,
  },
  readMore: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },

  // Date/time chips — matches Figma bordered pill chips
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.black,
    fontWeight: typography.weights.bold,
  },

  // Location — matches Figma divider style
  locationDivider: {
    height: 1,
    backgroundColor: colors.gray100,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  locationText: {
    flex: 1,
  },
  venueName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  venueAddress: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    textDecorationLine: 'underline',
  },

  // Confirmed section
  confirmedLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginTop: spacing.xs,
  },
  confirmedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  guestCount: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  confirmedCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.primaryMid,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },

  // Pill action buttons — matches Figma "Ver Confirmados" / "Compartilhar"
  pillActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pillBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  pillBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },

  // RSVP bar
  rsvpBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  rsvpInner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  rsvpBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpDecline: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  rsvpDeclineText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  rsvpConfirm: {
    backgroundColor: colors.primary,
  },
  rsvpConfirmText: {
    fontSize: typography.sizes.base,
    color: colors.white,
    fontWeight: typography.weights.bold,
  },

  // Guest list sheet
  guestSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginVertical: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.black,
  },
  guestList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  guestSection: {
    gap: spacing.sm,
  },
  guestSectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  guestName: {
    fontSize: typography.sizes.base,
    color: colors.black,
  },
  closeSheetBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    padding: spacing.sm,
  },
});

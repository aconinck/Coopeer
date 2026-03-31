// Discover — AllTrails-style map screen.
// Full-screen map with bottom drawer: search + filters + team list.
// No login required. First screen new users see after onboarding.
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Image,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NavBar } from '../../src/components/shared/NavBar';
import { SportPin } from '../../src/components/map/SportPin';
import { useLocation } from '../../src/hooks/useLocation';
import { useTeams } from '../../src/hooks/useTeams';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  sports,
} from '../../src/constants/theme';
import type { Team } from '../../src/types';
import type { SportId } from '../../src/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Snap points for the bottom drawer (distance from top of screen)
const SNAP_COLLAPSED = SCREEN_H - 140; // just search bar visible
const SNAP_HALF = SCREEN_H * 0.45;     // filters + first cards
const SNAP_FULL = 88;                   // full list (leaves room for status bar)

const INITIAL_DELTA = { latitudeDelta: 0.04, longitudeDelta: 0.04 };

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function DiscoverScreen() {
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const [activeSport, setActiveSport] = useState<SportId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { latitude, longitude } = useLocation();
  const { teams } = useTeams({ latitude, longitude, sport: activeSport });

  const region: Region | undefined =
    latitude && longitude
      ? { latitude, longitude, ...INITIAL_DELTA }
      : undefined;

  // Bottom drawer animation
  const drawerY = useRef(new Animated.Value(SNAP_COLLAPSED)).current;
  const lastY = useRef(SNAP_COLLAPSED);

  function snapTo(target: number) {
    lastY.current = target;
    Animated.spring(drawerY, {
      toValue: target,
      useNativeDriver: false,
      damping: 20,
      stiffness: 180,
    }).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 4,
      onPanResponderMove: (_, gs) => {
        const next = Math.max(SNAP_FULL, Math.min(SNAP_COLLAPSED, lastY.current + gs.dy));
        drawerY.setValue(next);
      },
      onPanResponderRelease: (_, gs) => {
        const currentY = lastY.current + gs.dy;
        const velocity = gs.vy;

        if (velocity < -0.5 || currentY < SNAP_HALF - 80) {
          if (currentY < (SNAP_FULL + SNAP_HALF) / 2) {
            snapTo(SNAP_FULL);
          } else {
            snapTo(SNAP_HALF);
          }
        } else if (velocity > 0.5 || currentY > SNAP_HALF + 80) {
          if (currentY > (SNAP_HALF + SNAP_COLLAPSED) / 2) {
            snapTo(SNAP_COLLAPSED);
          } else {
            snapTo(SNAP_HALF);
          }
        } else {
          // snap to nearest
          const distances = [
            { snap: SNAP_FULL, dist: Math.abs(currentY - SNAP_FULL) },
            { snap: SNAP_HALF, dist: Math.abs(currentY - SNAP_HALF) },
            { snap: SNAP_COLLAPSED, dist: Math.abs(currentY - SNAP_COLLAPSED) },
          ];
          distances.sort((a, b) => a.dist - b.dist);
          snapTo(distances[0].snap);
        }
      },
    })
  ).current;

  function handleRecenter() {
    if (!latitude || !longitude || !mapRef.current) return;
    mapRef.current.animateToRegion({ latitude, longitude, ...INITIAL_DELTA }, 400);
  }

  const filtered = searchQuery.trim()
    ? teams.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.venueName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : teams;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Full-screen map */}
      {region && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {teams.map((team) => (
            <Marker
              key={team.id}
              coordinate={{ latitude: team.location.lat, longitude: team.location.lng }}
              onPress={() => snapTo(SNAP_HALF)}
              tracksViewChanges={false}
            >
              <SportPin sport={team.sport} />
            </Marker>
          ))}
        </MapView>
      )}

      {/* Recenter button — floats top-right, fixed position above the drawer peek height */}
      <View style={styles.recenterWrapper}>
        <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter} activeOpacity={0.85}>
          <Ionicons name="locate" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom drawer */}
      <Animated.View style={[styles.drawer, { top: drawerY }]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.gray500} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sports near you"
              placeholderTextColor={colors.gray500}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => snapTo(SNAP_HALF)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.gray100} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sport filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          <TouchableOpacity
            onPress={() => setActiveSport('all')}
            style={[styles.pill, activeSport === 'all' && styles.pillActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, activeSport === 'all' && styles.pillTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {sports.map((sport) => {
            const isActive = activeSport === sport.id;
            return (
              <TouchableOpacity
                key={sport.id}
                onPress={() => setActiveSport(sport.id)}
                style={[styles.pill, isActive && styles.pillActive]}
                activeOpacity={0.8}
              >
                <Text style={styles.pillEmoji}>{sport.emoji}</Text>
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {sport.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Team list — only visible when drawer is expanded */}
        <ScrollView
          style={styles.teamList}
          contentContainerStyle={styles.teamListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.resultsLabel}>
            {filtered.length} team{filtered.length !== 1 ? 's' : ''} near you
          </Text>
          {filtered.map((team) => (
            <TeamPreviewCard
              key={team.id}
              team={team}
              onPress={() => router.push(`/team/${team.id}` as never)}
            />
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>
      </Animated.View>

      <NavBar />
    </View>
  );
}

// ─── Team Preview Card ────────────────────────────────────────────────────────

interface TeamPreviewCardProps {
  team: Team;
  onPress: () => void;
}

function TeamPreviewCard({ team, onPress }: TeamPreviewCardProps) {
  const spotsLeft = team.maxMembers - team.memberCount;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Cover image or sport-color gradient fallback */}
      <View style={[styles.cardCover, { backgroundColor: team.sport.color + '33' }]}>
        {team.coverImage ? (
          <Image source={{ uri: team.coverImage }} style={styles.cardImage} />
        ) : (
          <Text style={styles.cardEmoji}>{team.sport.emoji}</Text>
        )}
        {/* Sport badge */}
        <View style={[styles.sportBadge, { backgroundColor: team.sport.color }]}>
          <Text style={styles.sportBadgeText}>{team.sport.label}</Text>
        </View>
        {/* Trial price badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>{formatPrice(team.trialPrice)} trial</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{team.name}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={12} color={colors.gray500} />
          <Text style={styles.cardMetaText}>{team.schedule}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={12} color={colors.gray500} />
          <Text style={styles.cardMetaText} numberOfLines={1}>{team.location.venueName}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={[styles.spotsText, spotsLeft <= 3 && styles.spotsUrgent]}>
            {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
          </Text>
          <Text style={styles.monthlyText}>{formatPrice(team.monthlyPrice)}/mo</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface2,
  },

  // Recenter — sits 160px above bottom to float above the peek drawer
  recenterWrapper: {
    position: 'absolute',
    right: spacing.md,
    bottom: 160,
  },
  recenterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },

  // Bottom drawer
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -40, // extend past bottom for smooth bounce
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...shadows.elevated,
  },
  handleArea: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray100,
  },

  // Search
  searchRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.gray100,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.black,
    paddingVertical: 0,
  },

  // Filter pills
  pillsRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: colors.gray100,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillEmoji: {
    fontSize: 13,
  },
  pillText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
  },
  pillTextActive: {
    color: colors.white,
  },

  // Team list
  teamList: {
    flex: 1,
  },
  teamListContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  resultsLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Team preview card
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray100,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  cardCover: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  cardEmoji: {
    fontSize: 40,
  },
  sportBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  sportBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  priceBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.black,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  priceBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardMetaText: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  spotsText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  spotsUrgent: {
    color: colors.error,
  },
  monthlyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
});

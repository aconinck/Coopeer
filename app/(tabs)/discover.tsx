// Discover — primary screen. Full-screen map with sport pins + filters.
// No login required. First screen new users see.
// Design: open for iteration (no Figma reference yet).
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterPills } from '../../src/components/map/FilterPills';
import { SportPin } from '../../src/components/map/SportPin';
import { TeamBottomSheet } from '../../src/components/map/TeamBottomSheet';
import { NavBar } from '../../src/components/shared/NavBar';
import { useLocation } from '../../src/hooks/useLocation';
import { useTeams } from '../../src/hooks/useTeams';
import { colors, spacing, radius } from '../../src/constants/theme';
import type { Team } from '../../src/types';
import type { SportId } from '../../src/constants/theme';

const INITIAL_DELTA = { latitudeDelta: 0.04, longitudeDelta: 0.04 };

export default function DiscoverScreen() {
  const mapRef = useRef<MapView>(null);
  const [activeSport, setActiveSport] = useState<SportId | 'all'>('all');
  const [selectedTeams, setSelectedTeams] = useState<Team[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { latitude, longitude, loading: locationLoading } = useLocation();
  const { teams } = useTeams({ latitude, longitude, sport: activeSport });

  const region: Region | undefined =
    latitude && longitude
      ? { latitude, longitude, ...INITIAL_DELTA }
      : undefined;

  function handlePinPress(team: Team) {
    // Group all teams at this coordinate (within ~100m)
    const nearby = teams.filter(
      (t) =>
        Math.abs(t.location.lat - team.location.lat) < 0.001 &&
        Math.abs(t.location.lng - team.location.lng) < 0.001
    );
    setSelectedTeams(nearby.length > 0 ? nearby : [team]);
  }

  function handleRecenter() {
    if (!latitude || !longitude || !mapRef.current) return;
    mapRef.current.animateToRegion({ latitude, longitude, ...INITIAL_DELTA }, 400);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {region && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {teams.map((team) => (
            <Marker
              key={team.id}
              coordinate={{ latitude: team.location.lat, longitude: team.location.lng }}
              onPress={() => handlePinPress(team)}
              tracksViewChanges={false}
            >
              <SportPin sport={team.sport} />
            </Marker>
          ))}
        </MapView>
      )}

      {/* Overlay controls */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.gray500} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sports near you"
              placeholderTextColor={colors.gray500}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity onPress={handleRecenter} style={styles.recenterBtn}>
            <Ionicons name="locate" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter pills */}
        <View style={styles.pillsWrapper}>
          <FilterPills activeSport={activeSport} onChange={setActiveSport} />
        </View>
      </SafeAreaView>

      {/* Bottom sheet on pin tap */}
      {selectedTeams && (
        <TeamBottomSheet
          teams={selectedTeams}
          onClose={() => setSelectedTeams(null)}
        />
      )}

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 44,
    // Subtle shadow without elevation artifacts
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.black,
    paddingVertical: 0, // Android fix
  },
  recenterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pillsWrapper: {
    marginTop: spacing.sm,
  },
});

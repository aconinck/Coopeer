import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../constants/theme';
import { placeKinds, type Place, type PlaceKind, type SportId } from '../state/models';
import { usePlaceSearch, type GeoResult } from '../lib/geocode';
import { distanceMeters } from '../lib/geo';
import { useStore } from '../state/store';

const NEAR_METERS = 120;

/**
 * Results for a place search, shared by "Create club" and "Create game".
 * Places Coopeer already knows come first; places found on the map come after and are
 * saved as new places when picked. Callers render their own search field.
 */
export function PlaceResults({
  query,
  sport,
  selectedId,
  onSelect,
}: {
  query: string;
  sport: SportId | null;
  selectedId: string | null;
  onSelect: (placeId: string) => void;
}) {
  const store = useStore();
  const text = query.trim().toLowerCase();
  const remote = usePlaceSearch(query, sport);

  const known = store.places.filter((p) => (text ? `${p.name} ${p.address}`.toLowerCase().includes(text) : !sport || p.sports.includes(sport)));
  const found = remote.results.filter((r) => !store.places.some((p) => p.id === r.id || distanceMeters(p, r) < NEAR_METERS));

  const pickKnown = (place: Place) => {
    const saved = sport && !place.sports.includes(sport) ? store.addPlace({ ...place, sports: [sport] }) : place;
    onSelect(saved.id);
  };

  const pickFound = (result: GeoResult) => {
    const saved = store.addPlace({
      id: result.id,
      kind: result.kind,
      name: result.name,
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
      sports: sport ? [sport] : [],
    });
    onSelect(saved.id);
  };

  const showHeaders = text.length > 0;
  const empty = known.length === 0 && found.length === 0 && !remote.loading;

  return (
    <View style={styles.list}>
      {known.length > 0 && showHeaders && <Text style={styles.header}>ON COOPEER</Text>}
      {known.map((place) => (
        <Row key={place.id} kind={place.kind} title={place.name} subtitle={place.address} selected={place.id === selectedId} onPress={() => pickKnown(place)} />
      ))}

      {showHeaders && (found.length > 0 || remote.loading) && (
        <View style={styles.headerRow}>
          <Text style={styles.header}>FOUND ON THE MAP</Text>
          {remote.loading && <ActivityIndicator size="small" color={colors.label2} />}
        </View>
      )}
      {found.map((result) => (
        <Row key={result.id} kind={result.kind} title={result.name} subtitle={result.address} selected={result.id === selectedId} onPress={() => pickFound(result)} />
      ))}

      {showHeaders && remote.error && <Text style={[type.footnote, styles.note]}>Couldn't search the map. Check your connection.</Text>}
      {showHeaders && empty && !remote.error && <Text style={[type.subhead, styles.note]}>No places match “{query.trim()}”. Try the park name or an address.</Text>}
      {!showHeaders && known.length === 0 && <Text style={[type.subhead, styles.note]}>Search for a park, field, trail or address.</Text>}
    </View>
  );
}

function Row({ kind, title, subtitle, selected, onPress }: { kind: PlaceKind; title: string; subtitle: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons name={placeKinds[kind].icon} size={20} color={selected ? colors.brand : colors.label2} />
      </View>
      <View style={styles.text}>
        <Text style={type.headline} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[type.footnote, { color: colors.label2 }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected ? colors.brand : colors.gray3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  header: { ...type.caption2, color: colors.label2, marginTop: space.xs, letterSpacing: 0.6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  rowSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  note: { color: colors.label2, textAlign: 'center', paddingVertical: space.lg },
});

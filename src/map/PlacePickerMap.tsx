import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../constants/theme';
import type { SportId } from '../state/models';
import { useStore } from '../state/store';
import { summarize } from './PlacePin';
import { StreetMap, type StreetMapHandle } from './StreetMap';

const HEIGHT = 220;

/**
 * Small map for picking a place (create club / create game). Shows only the calm place badges
 * for the sport; tap one to select it. Picking from the list below glides the map to it.
 */
export function PlacePickerMap({
  sport,
  selectedId,
  onSelect,
  style,
}: {
  sport: SportId | null;
  selectedId: string | null;
  onSelect: (placeId: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const store = useStore();
  const map = useRef<StreetMapHandle>(null);
  const [ready, setReady] = useState(false);

  const places = useMemo(
    () => store.places.filter((p) => p.id === selectedId || !sport || p.sports.includes(sport)),
    [store.places, sport, selectedId],
  );
  const summaries = useMemo(() => places.map((p) => summarize(p, [], [], sport, store.now)), [places, sport, store.now]);
  const selected = places.find((p) => p.id === selectedId);

  useEffect(() => {
    if (!ready) return;
    // Wait a frame so the map has measured itself.
    const id = setTimeout(() => {
      if (selected) map.current?.focus(selected, 0, HEIGHT);
      else if (places.length) map.current?.fit(places, 24, HEIGHT - 8);
    }, 30);
    return () => clearTimeout(id);
  }, [ready, selected, places]);

  return (
    <View style={[styles.frame, style]} onLayout={() => setReady(true)}>
      <StreetMap ref={map} summaries={summaries} selectedId={selectedId} onSelect={(place) => onSelect(place.id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: HEIGHT, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surface2 },
});

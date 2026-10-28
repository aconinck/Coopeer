import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Place } from '../state/models';
import { PlacePin, type PlaceSummary } from './PlacePin';

export interface PlaceMapHandle {
  focus: (place: Place) => void;
  recenter: () => void;
}

export interface PlaceMapProps {
  summaries: PlaceSummary[];
  selectedId: string | null;
  onSelect: (place: Place) => void;
  bottomInset: number;
}

export const BENTONVILLE = { latitude: 36.362, longitude: -94.2115, latitudeDelta: 0.055, longitudeDelta: 0.055 };

/** Native map (Apple Maps on iOS, Google Maps on Android). */
export const PlaceMap = forwardRef<PlaceMapHandle, PlaceMapProps>(function PlaceMap(
  { summaries, selectedId, onSelect, bottomInset },
  ref,
) {
  const map = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    focus: (place) =>
      map.current?.animateToRegion(
        { latitude: place.latitude - 0.006, longitude: place.longitude, latitudeDelta: 0.022, longitudeDelta: 0.022 },
        350,
      ),
    recenter: () => map.current?.animateToRegion(BENTONVILLE, 350),
  }));

  return (
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      initialRegion={BENTONVILLE}
      showsUserLocation
      showsPointsOfInterests={false}
      showsCompass={false}
      toolbarEnabled={false}
      mapPadding={{ top: 0, right: 0, bottom: bottomInset, left: 0 }}
    >
      {summaries.map((summary) => (
        <Marker
          key={summary.place.id}
          coordinate={{ latitude: summary.place.latitude, longitude: summary.place.longitude }}
          anchor={{ x: 0.5, y: 0.78 }}
          onPress={() => onSelect(summary.place)}
          zIndex={summary.live ? 2 : 1}
        >
          <PlacePin summary={summary} selected={summary.place.id === selectedId} />
        </Marker>
      ))}
    </MapView>
  );
});

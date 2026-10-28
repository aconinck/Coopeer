import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { LatLng } from './geo';

export type LocationStatus = 'pending' | 'granted' | 'denied' | 'unavailable';

/**
 * The player's current position, kept fresh while the screen is mounted.
 * Asks for "while using the app" permission once; if denied, `coords` stays null and the map
 * falls back to the launch city.
 */
export function useCurrentLocation() {
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<LocationStatus>('pending');

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (!granted) {
          setStatus('denied');
          return;
        }
        setStatus('granted');
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 15, timeInterval: 5000 },
          (position) => setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        );
        if (cancelled) sub.remove();
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  return { coords, status };
}

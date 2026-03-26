import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

const DEFAULT_LOCATION = {
  // Bentonville, AR — initial launch market
  latitude: 36.3729,
  longitude: -94.2088,
};

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function requestLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (!cancelled) {
          setState({
            ...DEFAULT_LOCATION,
            error: 'Location permission denied — showing Bentonville, AR',
            loading: false,
          });
        }
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!cancelled) {
        setState({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          error: null,
          loading: false,
        });
      }
    }

    requestLocation().catch(() => {
      if (!cancelled) {
        setState({
          ...DEFAULT_LOCATION,
          error: 'Could not get location',
          loading: false,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

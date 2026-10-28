import { useLocalSearchParams } from 'expo-router';
import { PlaceDetail } from '../../src/details/PlaceDetail';
import { RouteDetail } from '../../src/ui/DetailLayout';

/** Deep-link / page version. In-app, this detail opens in the bottom sheet. */
export default function PlaceDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RouteDetail variant="sheet">
      <PlaceDetail id={id ?? ''} />
    </RouteDetail>
  );
}

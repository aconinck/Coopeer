import { useLocalSearchParams } from 'expo-router';
import { AttendeesDetail } from '../../src/details/AttendeesDetail';
import { RouteDetail } from '../../src/ui/DetailLayout';

/** Deep-link / page version. In-app, this detail opens in the bottom sheet. */
export default function AttendeesDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RouteDetail variant="sheet">
      <AttendeesDetail id={id ?? ''} />
    </RouteDetail>
  );
}

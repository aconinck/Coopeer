import { useLocalSearchParams } from 'expo-router';
import { ClubDetail } from '../../src/details/ClubDetail';
import { RouteDetail } from '../../src/ui/DetailLayout';

/** Deep-link / page version. In-app, this detail opens in the bottom sheet. */
export default function ClubDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RouteDetail variant="page">
      <ClubDetail id={id ?? ''} />
    </RouteDetail>
  );
}

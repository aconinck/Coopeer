import { useLocalSearchParams } from 'expo-router';
import { PlayerDetail } from '../../src/details/PlayerDetail';
import { RouteDetail } from '../../src/ui/DetailLayout';

/** Deep-link / page version. In-app, a player's profile opens in the bottom sheet. */
export default function PlayerDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RouteDetail variant="sheet">
      <PlayerDetail id={id ?? ''} />
    </RouteDetail>
  );
}

import { useLocalSearchParams } from 'expo-router';
import { GameDetail } from '../../src/details/GameDetail';
import { RouteDetail } from '../../src/ui/DetailLayout';

/** Deep-link / page version. In-app, this detail opens in the bottom sheet. */
export default function GameDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RouteDetail variant="sheet">
      <GameDetail id={id ?? ''} />
    </RouteDetail>
  );
}

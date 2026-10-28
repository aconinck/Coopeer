import { Text } from 'react-native';
import { type } from '../../src/constants/theme';
import { Screen } from '../../src/ui/Screen';

export default function ExploreFeed() {
  return (
    <Screen variant="tab" title="Explore">
      <Text style={type.body}>Feed coming soon.</Text>
    </Screen>
  );
}

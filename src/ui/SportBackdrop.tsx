import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sports, type SportId } from '../state/models';

/**
 * What a game card shows while we have no photo for it: the sport's color and its icon, large and quiet. It says
 * which sport it is without passing a generic picture off as the real place.
 */
export function SportBackdrop({ sport }: { sport: SportId }) {
  const { color, icon } = sports[sport];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={[color, `${color}B3`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.icon}>
        <MaterialCommunityIcons name={icon} size={220} color="rgba(255,255,255,0.22)" />
      </View>
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.38)']} locations={[0.4, 1]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});

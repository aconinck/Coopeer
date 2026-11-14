import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, flow, type } from '../constants/theme';
import { haptics } from '../create/ui';

/**
 * Figma "Foto do Clube": the name over concentric rings and one circle to add (or edit) the image.
 * Shared by Create a club and sign-up so both look the same.
 */
export function RingPhotoPicker({
  name,
  uri,
  onChange,
  emptyName,
  emptyCaption = 'Add an image',
  filledCaption,
}: {
  name: string;
  uri?: string | null;
  onChange: (uri: string) => void;
  emptyName: string;
  emptyCaption?: string;
  filledCaption: string;
}) {
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      haptics.selection();
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.photoArea}>
      {[420, 300, 210].map((size) => (
        <View key={size} pointerEvents="none" style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, uri ? styles.ringFilled : null]} />
      ))}
      <Text style={[flow.input, styles.photoName, uri ? { color: colors.brand } : null]} numberOfLines={1}>
        {name || emptyName}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={uri ? 'Change image' : 'Add an image'} onPress={pick} style={({ pressed }) => [styles.photoCircle, pressed && { opacity: 0.7 }]}>
        {uri ? (
          <Animated.View entering={FadeIn.duration(260)}>
            <Image source={{ uri }} style={styles.photo} />
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color={colors.label} />
            </View>
          </Animated.View>
        ) : (
          <Ionicons name="add" size={32} color={colors.brand} />
        )}
      </Pressable>
      <Text style={[type.footnote, styles.photoCaption]}>{uri ? filledCaption : emptyCaption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photoArea: { height: 380, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: colors.brandSoft },
  ringFilled: { backgroundColor: colors.brandSoft, opacity: 0.45 },
  photoName: { position: 'absolute', top: 40, maxWidth: 260, textAlign: 'center' },
  photoCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1.5,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  photo: { width: 116, height: 116, borderRadius: 58 },
  editBadge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  photoCaption: { position: 'absolute', bottom: 24, textAlign: 'center', color: colors.label2, maxWidth: 300 },
});

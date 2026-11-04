import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, space, type } from '../constants/theme';

interface Props {
  photoUri: string | null;
  onChange: (uri: string | null) => void;
  size?: number;
}

/**
 * Reusable photo picker: circular avatar preview + camera/library/remove buttons.
 * Used in signup (PhotoStep) and profile editing.
 */
export function PhotoPicker({ photoUri, onChange, size = 120 }: Props) {
  const halfSize = size / 2;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
  };

  return (
    <View style={styles.root}>
      <Pressable
        onPress={pickImage}
        style={({ pressed }) => [{ position: 'relative', width: size, height: size }, pressed && { opacity: 0.8 }]}
        accessibilityLabel="Choose photo"
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ width: size, height: size, borderRadius: halfSize }} />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size, borderRadius: halfSize }]}>
            <Ionicons name="person" size={size * 0.43} color={colors.label3} />
          </View>
        )}
        <View style={[styles.badge, { right: 2, bottom: 2 }]}>
          <Ionicons name="camera" size={18} color={colors.white} />
        </View>
      </Pressable>

      <View style={styles.actions}>
        {Platform.OS !== 'web' && (
          <Pressable onPress={takePhoto} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="camera-outline" size={18} color={colors.label} />
            <Text style={[type.subhead, styles.btnText]}>Take photo</Text>
          </Pressable>
        )}
        <Pressable onPress={pickImage} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="images-outline" size={18} color={colors.label} />
          <Text style={[type.subhead, styles.btnText]}>Choose from library</Text>
        </Pressable>
        {photoUri && (
          <Pressable onPress={() => onChange(null)} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="trash-outline" size={18} color={colors.live} />
            <Text style={[type.subhead, { color: colors.live }]}>Remove</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: space.lg },
  placeholder: {
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.separator,
  },
  badge: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  actions: { gap: space.sm, alignItems: 'center' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  btnText: { color: colors.label },
});

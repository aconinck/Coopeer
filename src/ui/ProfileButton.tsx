import { Pressable, StyleSheet, View } from 'react-native';
import { colors, shadow } from '../constants/theme';
import { open } from '../lib/nav';
import { useSession } from '../state/session';
import { haptic } from './Buttons';
import { Avatar } from './Display';

const SIZE = 50;

/** Your picture, top right of every main screen. Opens your profile in the bottom sheet. */
export function ProfileButton() {
  const { user } = useSession();
  if (!user) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Your profile"
      onPress={() => {
        haptic.selection();
        open.profile();
      }}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <View style={styles.avatar}>
        <Avatar member={{ id: user.id, name: user.name, photoUri: user.photoUri }} size={SIZE} silhouette />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: colors.fill, ...shadow.soft },
  pressed: { opacity: 0.8 },
});

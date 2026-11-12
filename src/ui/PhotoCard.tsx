import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { colors, radius, shadow, space, type } from '../constants/theme';

/** Photo on top, caption underneath (the Explore rails): one badge on the photo, a title and one quiet line below. */
export function PhotoCard({
  image,
  title,
  subtitle,
  badge,
  live,
  width,
  height,
  onPress,
}: {
  image: ImageSourcePropType | null;
  title: string;
  subtitle: string;
  badge?: string;
  live?: boolean;
  width: number;
  height: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
    >
      <View style={[styles.photo, { width, height }]}>
        {image ? <Image source={image} resizeMode="cover" accessibilityIgnoresInvertColors style={styles.image} /> : null}
        {badge ? (
          <View style={[styles.badge, live && styles.badgeLive]}>
            {live ? <View style={styles.liveDot} /> : null}
            <Text style={[type.caption, styles.badgeText]}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[type.callout, styles.title]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[type.subhead, styles.subtitle]} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.92 },
  photo: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.fill, ...shadow.soft },
  image: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  badge: { position: 'absolute', left: space.sm, top: space.sm, height: 26, paddingHorizontal: 10, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.42)' },
  badgeLive: { backgroundColor: colors.live },
  badgeText: { color: colors.white, fontWeight: '700' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  title: { marginTop: space.sm, color: colors.label, fontWeight: '600' },
  subtitle: { color: colors.label2, marginTop: 1 },
});

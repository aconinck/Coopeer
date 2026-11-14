import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../constants/theme';
import { placeKinds, sports, type Place } from '../state/models';

const HEIGHT = 196;

/**
 * Top of a place's sheet: swipeable photos when we have them, otherwise a calm illustration
 * tinted with the place's main sport so a park never looks like an empty card.
 */
export function PlaceHero({ place }: { place: Place }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const photos = place.photos ?? [];
  const tint = place.sports[0] ? sports[place.sports[0]].color : colors.gray3;

  if (photos.length === 0) {
    return (
      <View accessibilityLabel={`${place.name} illustration`} style={[styles.hero, styles.illustration, { backgroundColor: `${tint}22` }]}>
        <MaterialCommunityIcons name="pine-tree" size={120} color={`${tint}33`} style={styles.treeLeft} />
        <MaterialCommunityIcons name="pine-tree" size={84} color={`${tint}2B`} style={styles.treeRight} />
        <View style={[styles.badge, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name={placeKinds[place.kind].icon} size={38} color={tint} />
        </View>
      </View>
    );
  }

  const credit = photos[index]?.credit;
  return (
    <View style={styles.hero} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          scrollEventThrottle={32}
        >
          {photos.map((photo) => (
            <Image key={photo.uri} source={{ uri: photo.uri }} accessibilityLabel={`Photo of ${place.name}`} style={{ width, height: HEIGHT, backgroundColor: colors.fill }} />
          ))}
        </ScrollView>
      )}
      {photos.length > 1 && (
        <View pointerEvents="none" style={styles.dots}>
          {photos.map((photo, i) => (
            <View key={photo.uri} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
      {credit ? (
        <Text pointerEvents="none" style={[type.caption2, styles.credit]}>
          {credit}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: HEIGHT, borderRadius: radius.card, overflow: 'hidden' },
  illustration: { alignItems: 'center', justifyContent: 'center' },
  treeLeft: { position: 'absolute', left: space.lg, bottom: -8 },
  treeRight: { position: 'absolute', right: space.xl, bottom: -6 },
  badge: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: space.sm, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { backgroundColor: colors.white },
  credit: { position: 'absolute', left: space.md, bottom: space.sm, color: colors.white, opacity: 0.85, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 },
});

import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View, type ViewToken } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, space, type } from '../../src/constants/theme';
import { enter } from '../../src/constants/motion';
import { sportIds, sports, type SportId } from '../../src/state/models';
import { PostCard } from '../../src/feed/PostCard';
import { posts, type FeedPost } from '../../src/feed/posts';
import { Chip } from '../../src/ui/Buttons';
import { useTabBarSpace } from '../../src/ui/Screen';

const VIEWABILITY = { itemVisiblePercentThreshold: 60 };

/** Explore: what other players in town are posting — clips, results, highlights, photos. */
export default function ExploreFeed() {
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const [sport, setSport] = useState<SportId | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [visibleClipId, setVisibleClipId] = useState<string | null>(null);
  const [focused, setFocused] = useState(true);

  // Clips only play while this tab is on screen.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const data = useMemo(() => posts.filter((p) => !sport || p.sport === sport), [sport]);

  // Play the first clip that is at least 60% visible; everything else stays paused.
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<FeedPost>[] }) => {
    const clip = viewableItems.find((v) => v.isViewable && v.item?.kind === 'clip');
    setVisibleClipId(clip?.item?.id ?? null);
  }).current;

  const header = (
    <View style={styles.header}>
      <Text style={type.largeTitle} accessibilityRole="header">
        Explore
      </Text>
      <Text style={[type.subhead, styles.subtitle]}>Clips, results and highlights from players in Bentonville.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip title="All" selected={!sport} onPress={() => setSport(null)} />
        {sportIds.map((id) => (
          <Chip
            key={id}
            title={sports[id].label}
            color={sports[id].color}
            selected={sport === id}
            onPress={() => setSport(sport === id ? null : id)}
            icon={<MaterialCommunityIcons name={sports[id].icon} size={16} color={sport === id ? colors.white : sports[id].color} />}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <Animated.View entering={enter(index)}>
            <PostCard
              post={item}
              active={focused && item.id === visibleClipId}
              liked={!!liked[item.id]}
              onToggleLike={() => setLiked((current) => ({ ...current, [item.id]: !current[item.id] }))}
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={Separator}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY}
        contentContainerStyle={[styles.list, { paddingTop: insets.top, paddingBottom: tabBarSpace + space.lg }]}
        showsVerticalScrollIndicator={false}
      />
      <View pointerEvents="none" style={[styles.statusBar, { height: insets.top }]} />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: space.lg },
  header: { paddingTop: space.sm, paddingBottom: space.sm, gap: space.xs },
  subtitle: { color: colors.label2 },
  chips: { gap: space.sm, paddingVertical: space.md },
  separator: { height: space.lg },
  statusBar: { position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: colors.bg },
});

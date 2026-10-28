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

/** Rows of the feed list: title, the sticky sport chips, then posts. Only the chips stick. */
type Row = { kind: 'title'; id: 'title' } | { kind: 'chips'; id: 'chips' } | { kind: 'post'; id: string; post: FeedPost };
const STICKY = [1];

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

  const data = useMemo<Row[]>(
    () => [
      { kind: 'title', id: 'title' },
      { kind: 'chips', id: 'chips' },
      ...posts.filter((p) => !sport || p.sport === sport).map((post) => ({ kind: 'post' as const, id: post.id, post })),
    ],
    [sport],
  );

  // Play the first clip that is at least 60% visible; everything else stays paused.
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<Row>[] }) => {
    const clip = viewableItems.find((v) => v.isViewable && v.item?.kind === 'post' && v.item.post.kind === 'clip');
    setVisibleClipId(clip?.item?.id ?? null);
  }).current;

  const title = (
    <View style={styles.header}>
      <Text style={type.largeTitle} accessibilityRole="header">
        Explore
      </Text>
      <Text style={[type.subhead, styles.subtitle]}>Clips, results and highlights from players in Bentonville.</Text>
    </View>
  );

  const chips = (
    <View style={styles.sticky}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip title="All" selected={!sport} onPress={() => setSport(null)} />
        {sportIds.map((id) => (
          <Chip
            key={id}
            title={sports[id].label}
            color={sports[id].color}
            selected={sport === id}
            onPress={() => setSport(sport === id ? null : id)}
            icon={<MaterialCommunityIcons name={sports[id].icon} size={16} color={sport === id ? colors.white : colors.label2} />}
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
        stickyHeaderIndices={STICKY}
        renderItem={({ item, index }) =>
          item.kind === 'title' ? (
            title
          ) : item.kind === 'chips' ? (
            chips
          ) : (
            <Animated.View entering={enter(index - 2)} style={styles.post}>
              <PostCard
                post={item.post}
                active={focused && item.id === visibleClipId}
                liked={!!liked[item.id]}
                onToggleLike={() => setLiked((current) => ({ ...current, [item.id]: !current[item.id] }))}
              />
            </Animated.View>
          )
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY}
        style={{ marginTop: insets.top }}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarSpace + space.lg }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: space.lg },
  header: { paddingTop: space.sm, gap: space.xs },
  sticky: { marginHorizontal: -space.lg, paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xs, marginBottom: space.sm, backgroundColor: colors.bg },
  subtitle: { color: colors.label2 },
  chips: { gap: space.sm, paddingVertical: space.md },
  post: { marginBottom: space.lg },
});

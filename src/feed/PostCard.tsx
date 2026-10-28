import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../constants/theme';
import { spring } from '../constants/motion';
import { sports } from '../state/models';
import { useStore } from '../state/store';
import { shareText } from '../lib/format';
import { open } from '../lib/nav';
import { haptic, usePressScale } from '../ui/Buttons';
import { Avatar, ClubLogo, SportIcon, card } from '../ui/Display';
import { FeedClip } from './FeedClip';
import { photos } from './media';
import { timeAgo, type FeedPost, type HighlightPost, type PhotoPost, type ResultPost } from './posts';
import { FillImage, MediaFrame } from '../ui/Media';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PostCard({ post, active, liked, onToggleLike }: { post: FeedPost; active: boolean; liked: boolean; onToggleLike: () => void }) {
  const store = useStore();
  const club = store.club(post.clubId);

  const hasMedia = post.kind === 'clip' || post.kind === 'photo';

  // Card anatomy (Strava): header, then media edge to edge, then caption and actions.
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${post.author.name}, ${club?.name ?? ''}`} onPress={() => open.club(post.clubId)} style={[styles.header, styles.pad]}>
        <Avatar member={post.author} size={36} />
        <View style={styles.flex}>
          <Text style={type.headline} numberOfLines={1}>
            {post.author.name}
          </Text>
          <View style={styles.row}>
            {club && <ClubLogo club={club} size={16} />}
            <Text style={[type.footnote, styles.secondary]} numberOfLines={1}>
              {club?.name} · {timeAgo(post.minutesAgo)}
            </Text>
          </View>
        </View>
        <SportIcon sport={post.sport} size={24} />
      </Pressable>

      {post.kind === 'clip' && <FeedClip clip={post.clip} tag={post.tag} active={active} aspect={post.aspect} />}
      {post.kind === 'photo' && <Gallery post={post} />}
      {!hasMedia && (
        <View style={styles.pad}>
          {post.kind === 'result' && <ResultCard post={post} />}
          {post.kind === 'highlight' && <HighlightCard post={post} />}
        </View>
      )}

      <View style={[styles.pad, styles.bottom]}>
        {hasMedia && <Text style={type.body}>{post.caption}</Text>}
        <Actions post={post} liked={liked} onToggleLike={onToggleLike} />
      </View>
    </View>
  );
}

/** Photo layouts: one photo at its aspect, two side by side, three as a big one plus a stacked pair. */
function Gallery({ post }: { post: PhotoPost }) {
  const list = post.photos;
  if (list.length === 1) {
    return (
      <MediaFrame aspect={post.aspect ?? 'portrait'}>
        <FillImage source={photos[list[0]]} label={post.caption} />
      </MediaFrame>
    );
  }
  if (list.length === 2) {
    return (
      <View style={styles.grid}>
        {list.map((name) => (
          <MediaFrame key={name} aspect="portrait" style={styles.flex}>
            <FillImage source={photos[name]} />
          </MediaFrame>
        ))}
      </View>
    );
  }
  return (
    <MediaFrame aspect="square">
      <View style={[styles.grid, StyleSheet.absoluteFill]}>
        <View style={[styles.flex2, styles.cell]}>
          <FillImage source={photos[list[0]]} />
        </View>
        <View style={[styles.flex, styles.stack]}>
          {list.slice(1, 3).map((name, i) => (
            <View key={name} style={[styles.flex, styles.cell]}>
              <FillImage source={photos[name]} />
              {i === 1 && list.length > 3 && (
                <View style={styles.more}>
                  <Text style={[type.title3, { color: colors.white }]}>+{list.length - 3}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </MediaFrame>
  );
}

function ResultCard({ post }: { post: ResultPost }) {
  const store = useStore();
  const place = store.place(post.placeId);
  const press = usePressScale(0.98);
  const [a, b] = post.score;
  const live = post.status === 'live';
  const onPress = () => (post.gameId ? open.game(post.gameId) : open.club(post.clubId));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${post.home} ${a}, ${post.away} ${b}, ${live ? 'live' : 'final'}`}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.board, press.style]}
    >
      <View style={styles.boardTop}>
        <View style={[styles.status, live && styles.statusLive]}>
          {live && <View style={styles.liveDot} />}
          <Text style={[type.caption2, { color: live ? colors.live : colors.label2 }]}>{live ? 'LIVE' : 'FINAL'}</Text>
        </View>
        <Text style={[type.footnote, styles.secondary]} numberOfLines={1}>
          {sports[post.sport].label} · {place?.name}
        </Text>
      </View>
      <View style={styles.scoreRow}>
        <Team name={post.home} won={a > b} />
        <Text style={styles.score}>
          <Text style={a >= b ? styles.scoreWin : styles.scoreLose}>{a}</Text>
          <Text style={styles.scoreLose}> – </Text>
          <Text style={b >= a ? styles.scoreWin : styles.scoreLose}>{b}</Text>
        </Text>
        <Team name={post.away} won={b > a} align="right" />
      </View>
      {post.mvp && (
        <View style={styles.mvp}>
          <Ionicons name="star" size={14} color={colors.brand} />
          <Avatar member={post.mvp} size={22} />
          <Text style={type.subhead}>
            <Text style={{ fontWeight: '600' }}>{post.mvp.name}</Text>
            <Text style={styles.secondary}> · MVP</Text>
          </Text>
          <View style={styles.flex} />
          <Ionicons name="chevron-forward" size={16} color={colors.label3} />
        </View>
      )}
    </AnimatedPressable>
  );
}

function Team({ name, won, align = 'left' }: { name: string; won: boolean; align?: 'left' | 'right' }) {
  return (
    <Text numberOfLines={2} style={[type.subhead, styles.team, { textAlign: align, fontWeight: won ? '700' : '500', color: won ? colors.label : colors.label2 }]}>
      {name}
    </Text>
  );
}

function HighlightCard({ post }: { post: HighlightPost }) {
  const press = usePressScale(0.98);
  const onPress = () => (post.gameId ? open.game(post.gameId) : open.club(post.clubId));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${post.title}: ${post.stat} ${post.statLabel}`}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.highlight, press.style]}
    >
      <View style={styles.highlightTop}>
        <Avatar member={post.author} size={44} />
        <View style={styles.flex}>
          <Text style={[type.caption2, { color: colors.brand }]}>HIGHLIGHT</Text>
          <Text style={type.title3}>{post.title}</Text>
        </View>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.stat}>{post.stat}</Text>
        <Text style={[type.headline, styles.secondary]}>{post.statLabel}</Text>
      </View>
      <Text style={[type.subhead, styles.secondary]}>{post.caption}</Text>
    </AnimatedPressable>
  );
}

function Actions({ post, liked, onToggleLike }: { post: FeedPost; liked: boolean; onToggleLike: () => void }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const likes = post.likes + (liked ? 1 : 0);

  const like = () => {
    haptic.selection();
    if (!reduceMotion && !liked) {
      // Calm acknowledgement: a slight swell that settles without overshoot.
      scale.value = withSequence(withTiming(1.12, { duration: 110 }), withSpring(1, spring.snappy));
    }
    onToggleLike();
  };

  return (
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel={liked ? 'Unlike' : 'Like'} accessibilityState={{ selected: liked }} onPress={like} hitSlop={8} style={styles.action}>
        <Animated.View style={heartStyle}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? colors.live : colors.label} />
        </Animated.View>
        <Text style={[type.subhead, styles.count]}>{likes}</Text>
      </Pressable>
      <View style={styles.action} accessibilityLabel={`${post.comments} comments`}>
        <Ionicons name="chatbubble-outline" size={20} color={colors.label} />
        <Text style={[type.subhead, styles.count]}>{post.comments}</Text>
      </View>
      <View style={styles.flex} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share"
        hitSlop={8}
        onPress={() => shareText(`${post.author.name} on Coopeer`, `coopeer://post/${post.id}`)}
      >
        <Ionicons name="share-outline" size={21} color={colors.label} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secondary: { color: colors.label2 },
  flex2: { flex: 2 },
  card: { ...card, overflow: 'hidden', paddingTop: space.md, gap: space.md },
  pad: { paddingHorizontal: space.md },
  bottom: { gap: space.md, paddingBottom: space.md },
  grid: { flexDirection: 'row', gap: 2 },
  stack: { gap: 2 },
  cell: { overflow: 'hidden', backgroundColor: colors.fill },
  more: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  board: { borderRadius: radius.card, backgroundColor: colors.bg, padding: space.lg, gap: space.md },
  boardTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.fill },
  statusLive: { backgroundColor: 'rgba(255,59,48,0.14)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  team: { flex: 1 },
  score: { fontSize: 44, lineHeight: 52, fontWeight: '800', fontVariant: ['tabular-nums'] },
  scoreWin: { color: colors.label },
  scoreLose: { color: colors.label3 },
  mvp: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  highlight: { borderRadius: radius.card, backgroundColor: colors.brandSoft, padding: space.lg, gap: space.md },
  highlightTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  stat: { fontSize: 56, lineHeight: 62, fontWeight: '800', color: colors.brand, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { fontVariant: ['tabular-nums'] },
});

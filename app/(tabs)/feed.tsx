// Feed — FACEIT-style social activity feed.
// Dark themed. Posts: photo, match result, rank up, goal announcement.
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NavBar } from '../../src/components/shared/NavBar';
import {
  colors,
  typography,
  spacing,
  radius,
} from '../../src/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType = 'photo' | 'video' | 'match_result' | 'rank_up' | 'goal';

interface FeedPost {
  id: string;
  author: { name: string; avatar?: string; teamName: string };
  type: PostType;
  timestamp: Date;
  // photo / video
  imageUrl?: string;
  caption?: string;
  // match_result
  matchResult?: {
    teamA: string;
    scoreA: number;
    teamB: string;
    scoreB: number;
    winner: string;
  };
  // rank_up
  rankUp?: {
    playerName: string;
    oldElo: number;
    newElo: number;
    gain: number;
  };
  // goal
  goal?: {
    playerName: string;
    teamName: string;
    minute: number;
  };
  likes: number;
  comments: number;
  liked: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_POSTS: FeedPost[] = [
  {
    id: 'p1',
    author: { name: 'Carlos Rivera', teamName: 'Bentonville Strikers' },
    type: 'match_result',
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    matchResult: {
      teamA: 'Bentonville Strikers',
      scoreA: 3,
      teamB: 'Crystal Bridges FC',
      scoreB: 1,
      winner: 'Bentonville Strikers',
    },
    likes: 24,
    comments: 6,
    liked: false,
  },
  {
    id: 'p2',
    author: { name: 'Mia Chen', teamName: 'Bentonville Strikers' },
    type: 'rank_up',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    rankUp: {
      playerName: 'Mia Chen',
      oldElo: 1204,
      newElo: 1252,
      gain: 48,
    },
    likes: 37,
    comments: 11,
    liked: true,
  },
  {
    id: 'p3',
    author: { name: 'Jorge Mendez', teamName: 'Walmart Campus Ballers' },
    type: 'photo',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    caption: 'Post-game vibes at the campus court. Best squad ever! 🏀🔥',
    likes: 58,
    comments: 14,
    liked: false,
  },
  {
    id: 'p4',
    author: { name: 'Luis Torres', teamName: 'Bentonville Strikers' },
    type: 'goal',
    timestamp: new Date(Date.now() - 1000 * 60 * 115),
    goal: {
      playerName: 'Luis Torres',
      teamName: 'Bentonville Strikers',
      minute: 67,
    },
    likes: 19,
    comments: 3,
    liked: false,
  },
  {
    id: 'p5',
    author: { name: 'Sarah Kim', teamName: 'Crystal Bridges Picklers' },
    type: 'match_result',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    matchResult: {
      teamA: 'Crystal Bridges Picklers',
      scoreA: 11,
      teamB: 'Bentonville Paddles',
      scoreB: 8,
      winner: 'Crystal Bridges Picklers',
    },
    likes: 31,
    comments: 9,
    liked: true,
  },
  {
    id: 'p6',
    author: { name: 'Derek Walsh', teamName: 'Razorback Trail Runners' },
    type: 'photo',
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800',
    caption: 'Sunday morning at the Razorback Greenway. 12 miles done!',
    likes: 44,
    comments: 7,
    liked: false,
  },
  {
    id: 'p7',
    author: { name: 'Aisha Grant', teamName: 'Walmart Campus Ballers' },
    type: 'rank_up',
    timestamp: new Date(Date.now() - 1000 * 60 * 320),
    rankUp: {
      playerName: 'Aisha Grant',
      oldElo: 980,
      newElo: 1021,
      gain: 41,
    },
    likes: 52,
    comments: 18,
    liked: false,
  },
  {
    id: 'p8',
    author: { name: 'Tom Bradley', teamName: 'Slaughter Pen Tennis Club' },
    type: 'goal',
    timestamp: new Date(Date.now() - 1000 * 60 * 400),
    goal: {
      playerName: 'Tom Bradley',
      teamName: 'Slaughter Pen Tennis Club',
      minute: 34,
    },
    likes: 8,
    comments: 2,
    liked: false,
  },
  {
    id: 'p9',
    author: { name: 'Priya Nair', teamName: 'Crystal Bridges Picklers' },
    type: 'photo',
    timestamp: new Date(Date.now() - 1000 * 60 * 500),
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    caption: 'New court, who dis? 🏓',
    likes: 63,
    comments: 21,
    liked: true,
  },
  {
    id: 'p10',
    author: { name: 'Marcus Webb', teamName: 'Bentonville Strikers' },
    type: 'match_result',
    timestamp: new Date(Date.now() - 1000 * 60 * 720),
    matchResult: {
      teamA: 'Bentonville Strikers',
      scoreA: 2,
      teamB: 'NWA FC',
      scoreB: 2,
      winner: 'Draw',
    },
    likes: 16,
    comments: 5,
    liked: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface AuthorRowProps {
  author: FeedPost['author'];
  timestamp: Date;
  typeLabel: string;
  typeLabelColor: string;
}

function AuthorRow({ author, timestamp, typeLabel, typeLabelColor }: AuthorRowProps) {
  return (
    <View style={authorStyles.row}>
      {/* Avatar */}
      <View style={authorStyles.avatar}>
        <Text style={authorStyles.avatarText}>{getInitials(author.name)}</Text>
      </View>
      <View style={authorStyles.info}>
        <Text style={authorStyles.name}>{author.name}</Text>
        <View style={authorStyles.metaRow}>
          <Text style={authorStyles.team}>{author.teamName}</Text>
          <Text style={authorStyles.dot}>·</Text>
          <Text style={authorStyles.time}>{timeAgo(timestamp)}</Text>
        </View>
      </View>
      <View style={[authorStyles.typeLabel, { backgroundColor: typeLabelColor + '22' }]}>
        <Text style={[authorStyles.typeLabelText, { color: typeLabelColor }]}>{typeLabel}</Text>
      </View>
    </View>
  );
}

const authorStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  info: { flex: 1 },
  name: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  team: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.45)',
  },
  dot: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.3)',
  },
  time: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.35)',
  },
  typeLabel: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  typeLabelText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

// Action bar (like / comment / share)
interface ActionBarProps {
  post: FeedPost;
  onLike: () => void;
}

function ActionBar({ post, onLike }: ActionBarProps) {
  return (
    <View style={actionStyles.row}>
      <TouchableOpacity style={actionStyles.action} onPress={onLike} activeOpacity={0.7}>
        <Ionicons
          name={post.liked ? 'heart' : 'heart-outline'}
          size={20}
          color={post.liked ? colors.error : 'rgba(255,255,255,0.5)'}
        />
        <Text style={[actionStyles.count, post.liked && { color: colors.error }]}>
          {post.likes}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={actionStyles.action} activeOpacity={0.7}>
        <Ionicons name="chatbubble-outline" size={18} color="rgba(255,255,255,0.5)" />
        <Text style={actionStyles.count}>{post.comments}</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={actionStyles.action} activeOpacity={0.7}>
        <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    </View>
  );
}

const actionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    gap: spacing.lg,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  count: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: typography.weights.bold,
  },
});

// ─── Post card renderers ───────────────────────────────────────────────────────

interface PostCardProps {
  post: FeedPost;
  onLike: (id: string) => void;
}

function PhotoPostCard({ post, onLike }: PostCardProps) {
  return (
    <View style={cardStyles.card}>
      <AuthorRow
        author={post.author}
        timestamp={post.timestamp}
        typeLabel="Photo"
        typeLabelColor="rgba(255,255,255,0.6)"
      />
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={cardStyles.heroImage} />
      )}
      {post.caption && (
        <Text style={cardStyles.caption}>{post.caption}</Text>
      )}
      <ActionBar post={post} onLike={() => onLike(post.id)} />
    </View>
  );
}

function MatchResultCard({ post, onLike }: PostCardProps) {
  const result = post.matchResult!;
  const isDraw = result.winner === 'Draw';
  const aWon = !isDraw && result.winner === result.teamA;
  const bWon = !isDraw && result.winner === result.teamB;

  return (
    <View style={cardStyles.card}>
      <AuthorRow
        author={post.author}
        timestamp={post.timestamp}
        typeLabel="Match"
        typeLabelColor={colors.success}
      />
      <View style={matchStyles.body}>
        <Text style={matchStyles.sectionLabel}>MATCH RESULT</Text>
        <View style={matchStyles.scoreRow}>
          <View style={matchStyles.teamCol}>
            <Text style={[matchStyles.teamName, aWon && matchStyles.winnerText]} numberOfLines={2}>
              {result.teamA}
            </Text>
          </View>
          <View style={matchStyles.scoreBlock}>
            <Text style={[matchStyles.score, aWon && matchStyles.winnerScore]}>{result.scoreA}</Text>
            <Text style={matchStyles.dash}>—</Text>
            <Text style={[matchStyles.score, bWon && matchStyles.winnerScore]}>{result.scoreB}</Text>
          </View>
          <View style={[matchStyles.teamCol, matchStyles.teamColRight]}>
            <Text style={[matchStyles.teamName, bWon && matchStyles.winnerText]} numberOfLines={2}>
              {result.teamB}
            </Text>
          </View>
        </View>
        {!isDraw && (
          <View style={matchStyles.winnerBadge}>
            <Ionicons name="trophy" size={14} color={colors.primary} />
            <Text style={matchStyles.winnerBadgeText}>{result.winner} wins</Text>
          </View>
        )}
        {isDraw && (
          <View style={[matchStyles.winnerBadge, matchStyles.drawBadge]}>
            <Text style={matchStyles.drawText}>Draw</Text>
          </View>
        )}
        <TouchableOpacity style={matchStyles.detailsBtn}>
          <Text style={matchStyles.detailsBtnText}>View match details</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <ActionBar post={post} onLike={() => onLike(post.id)} />
    </View>
  );
}

const matchStyles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teamCol: {
    flex: 1,
  },
  teamColRight: {
    alignItems: 'flex-end',
  },
  teamName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  winnerText: {
    color: colors.white,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  score: {
    fontSize: 52,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.35)',
    fontVariant: ['tabular-nums'],
    lineHeight: 60,
  },
  winnerScore: {
    color: colors.primary,
  },
  dash: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.25)',
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '1A',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  winnerBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  drawBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  drawText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.5)',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  detailsBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
});

function RankUpCard({ post, onLike }: PostCardProps) {
  const ru = post.rankUp!;

  return (
    <View style={cardStyles.card}>
      <AuthorRow
        author={post.author}
        timestamp={post.timestamp}
        typeLabel="Rank Up"
        typeLabelColor={colors.gold}
      />
      <View style={rankStyles.body}>
        <Text style={rankStyles.trophy}>🏆</Text>
        <Text style={rankStyles.headline}>Rank Up!</Text>
        <Text style={rankStyles.playerName}>{ru.playerName}</Text>
        <View style={rankStyles.eloRow}>
          <View style={rankStyles.eloChip}>
            <Text style={rankStyles.eloOld}>{ru.oldElo}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.success} />
          <View style={[rankStyles.eloChip, rankStyles.eloNewChip]}>
            <Text style={rankStyles.eloNew}>{ru.newElo}</Text>
          </View>
        </View>
        <View style={rankStyles.gainBadge}>
          <Ionicons name="trending-up" size={14} color={colors.success} />
          <Text style={rankStyles.gainText}>+{ru.gain} ELO</Text>
        </View>
      </View>
      <ActionBar post={post} onLike={() => onLike(post.id)} />
    </View>
  );
}

const rankStyles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  trophy: {
    fontSize: 48,
  },
  headline: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gold,
    letterSpacing: -0.3,
  },
  playerName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  eloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eloChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  eloNewChip: {
    backgroundColor: colors.success + '22',
  },
  eloOld: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.4)',
    fontVariant: ['tabular-nums'],
  },
  eloNew: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.success,
    fontVariant: ['tabular-nums'],
  },
  gainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success + '1A',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  gainText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
});

function GoalCard({ post, onLike }: PostCardProps) {
  const goal = post.goal!;

  return (
    <View style={cardStyles.card}>
      <AuthorRow
        author={post.author}
        timestamp={post.timestamp}
        typeLabel="Goal"
        typeLabelColor={colors.soccer}
      />
      <View style={goalStyles.body}>
        <Text style={goalStyles.ball}>⚽</Text>
        <Text style={goalStyles.headline}>GOAL!</Text>
        <Text style={goalStyles.playerName}>{goal.playerName}</Text>
        <Text style={goalStyles.teamName}>{goal.teamName}</Text>
        <View style={goalStyles.minuteBadge}>
          <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.6)" />
          <Text style={goalStyles.minuteText}>{goal.minute}'</Text>
        </View>
      </View>
      <ActionBar post={post} onLike={() => onLike(post.id)} />
    </View>
  );
}

const goalStyles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  ball: {
    fontSize: 52,
    marginBottom: spacing.xs,
  },
  headline: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    letterSpacing: 2,
  },
  playerName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  teamName: {
    fontSize: typography.sizes.base,
    color: 'rgba(255,255,255,0.55)',
  },
  minuteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  minuteText: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: typography.weights.bold,
  },
});

// Shared card shell styles
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  caption: {
    fontSize: typography.sizes.base,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_POSTS);

  const handleLike = useCallback((id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  }, []);

  function renderPost(post: FeedPost) {
    const props: PostCardProps = { post, onLike: handleLike };
    switch (post.type) {
      case 'photo':
      case 'video':
        return <PhotoPostCard key={post.id} {...props} />;
      case 'match_result':
        return <MatchResultCard key={post.id} {...props} />;
      case 'rank_up':
        return <RankUpCard key={post.id} {...props} />;
      case 'goal':
        return <GoalCard key={post.id} {...props} />;
      default:
        return null;
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.safeHeader}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Feed</Text>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={22} color={colors.white} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {posts.map(renderPost)}
        <View style={{ height: 120 }} />
      </ScrollView>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
  },
  safeHeader: {
    backgroundColor: colors.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    letterSpacing: typography.tracking.tight,
  },
  bellBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.surfaceDark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
});

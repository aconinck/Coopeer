import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Avatar } from '../shared/Avatar';
import { MemberAvatars } from '../team/MemberAvatars';
import { colors, typography, spacing, radius } from '../../constants/theme';
import type { Team } from '../../types';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SNAP_OPEN = -SCREEN_HEIGHT * 0.45;
const SNAP_CLOSED = 0;

interface TeamBottomSheetProps {
  teams: Team[];
  areaLabel?: string;
  onClose: () => void;
}

function TeamPreviewRow({ team }: { team: Team }) {
  const router = useRouter();
  const spotsLeft = team.maxMembers - team.memberCount;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/team/${team.id}` as never)}
      style={styles.teamRow}
      activeOpacity={0.8}
    >
      <View style={[styles.sportBadge, { backgroundColor: team.sport.color + '22' }]}>
        <Text style={styles.sportEmoji}>{team.sport.emoji}</Text>
      </View>

      <View style={styles.teamInfo}>
        <Text style={styles.teamName} numberOfLines={1}>
          {team.name}
        </Text>
        <Text style={styles.teamMeta} numberOfLines={1}>
          {team.schedule} · {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
        </Text>
        <MemberAvatars members={team.members} maxVisible={4} size={20} />
      </View>

      <View style={styles.priceBlock}>
        <View style={styles.trialBadge}>
          <Text style={styles.trialText}>${(team.trialPrice / 100).toFixed(0)} trial</Text>
        </View>
        <Text style={styles.monthlyText}>
          ${(team.monthlyPrice / 100).toFixed(0)}/mo
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function TeamBottomSheet({
  teams,
  areaLabel,
  onClose,
}: TeamBottomSheetProps) {
  const translateY = useSharedValue(SNAP_OPEN);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(SNAP_OPEN, e.translationY + SNAP_OPEN);
    })
    .onEnd((e) => {
      if (e.velocityY > 500 || translateY.value > SNAP_OPEN / 2) {
        translateY.value = withSpring(SNAP_CLOSED, { damping: 20 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(SNAP_OPEN, { damping: 20 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const sportName = teams[0]?.sport.label ?? 'sports';

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.sheet, animatedStyle]}>
        {/* Handle */}
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>
            {teams.length} team{teams.length !== 1 ? 's' : ''} in this area
          </Text>
          <Text style={styles.subtitle}>
            {areaLabel ?? sportName} · open spots available
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {teams.slice(0, 3).map((team) => (
            <TeamPreviewRow key={team.id} team={team} />
          ))}
        </ScrollView>

        {teams.length > 3 && (
          <TouchableOpacity style={styles.seeAll}>
            <Text style={styles.seeAllText}>
              See all {teams.length} teams →
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: -SCREEN_HEIGHT * 0.5,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 32,
    height: 3,
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    letterSpacing: typography.tracking.tight,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  sportBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportEmoji: {
    fontSize: 20,
  },
  teamInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  teamName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  teamMeta: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  trialBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  trialText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  monthlyText: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
  },
  seeAll: {
    alignItems: 'center',
    padding: spacing.md,
  },
  seeAllText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
});

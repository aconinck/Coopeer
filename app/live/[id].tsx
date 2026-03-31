// Live score — manager interface during a game.
// Dark full-screen. Working count-up timer. Big scoreboard. Goal confirmation sheet.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/shared/Avatar';
import { getEvent } from '../../src/services/api';
import { colors, typography, spacing, radius } from '../../src/constants/theme';
import type { Event, Member } from '../../src/types';

// ─── Timer helper ─────────────────────────────────────────────────────────────

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LiveScoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [matchGoals, setMatchGoals] = useState<Record<string, number>>({});
  const [pendingPlayer, setPendingPlayer] = useState<Member | null>(null);
  const [pendingTeam, setPendingTeam] = useState<'A' | 'B' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    getEvent(id).then((e) => setEvent(e ?? null));
  }, [id]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }

  function handleGoalPress(member: Member, team: 'A' | 'B') {
    setPendingPlayer(member);
    setPendingTeam(team);
  }

  function confirmGoal() {
    if (!pendingPlayer || !pendingTeam) return;
    if (pendingTeam === 'A') setScoreA((s) => s + 1);
    else setScoreB((s) => s + 1);
    setMatchGoals((prev) => ({
      ...prev,
      [pendingPlayer.id]: (prev[pendingPlayer.id] ?? 0) + 1,
    }));
    const name = pendingPlayer.name;
    setPendingPlayer(null);
    setPendingTeam(null);
    showToast(`Goal! ${name}`);
  }

  function cancelGoal() {
    setPendingPlayer(null);
    setPendingTeam(null);
  }

  function handleEndGame() {
    Alert.alert(
      'End Game',
      `Final score: ${scoreA} — ${scoreB}\n\nAre you sure you want to end this game?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Game',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            router.replace(`/result/${id}`);
          },
        },
      ]
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading match...</Text>
      </View>
    );
  }

  const teamAPlayers = event.confirmed.slice(0, Math.ceil(event.confirmed.length / 2));
  const teamBPlayers = event.confirmed.slice(Math.ceil(event.confirmed.length / 2));
  const totalPlayers = event.confirmed.length;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.topSafe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.matchTitle} numberOfLines={1}>{event.title}</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <Text style={styles.timer}>{formatTimer(elapsed)}</Text>
          <TouchableOpacity
            onPress={() => setIsRunning(!isRunning)}
            style={[styles.timerBtn, isRunning && styles.timerBtnActive]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={18}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Scoreboard */}
        <View style={styles.scoreboard}>
          <View style={styles.teamSide}>
            <Text style={styles.teamLabel} numberOfLines={1}>Home</Text>
            <Text style={[styles.scoreNum, scoreA > scoreB && styles.leadingScore]}>
              {scoreA}
            </Text>
          </View>
          <View style={styles.scoreDivider}>
            <Text style={styles.scoreSep}>—</Text>
          </View>
          <View style={[styles.teamSide, styles.teamSideRight]}>
            <Text style={[styles.scoreNum, scoreB > scoreA && styles.leadingScore]}>
              {scoreB}
            </Text>
            <Text style={[styles.teamLabel, styles.teamLabelRight]} numberOfLines={1}>
              Away
            </Text>
          </View>
        </View>

        <View style={styles.divider} />
      </SafeAreaView>

      {/* Player list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>Home team · {teamAPlayers.length} players</Text>
        {teamAPlayers.map((member) => (
          <PlayerRow
            key={member.id}
            member={member}
            matchGoals={matchGoals[member.id] ?? 0}
            onGoal={() => handleGoalPress(member, 'A')}
          />
        ))}

        <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
          Away team · {teamBPlayers.length} players
        </Text>
        {teamBPlayers.map((member) => (
          <PlayerRow
            key={member.id}
            member={member}
            matchGoals={matchGoals[member.id] ?? 0}
            onGoal={() => handleGoalPress(member, 'B')}
          />
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* End game button */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity style={styles.endGameBtn} onPress={handleEndGame} activeOpacity={0.8}>
          <Ionicons name="stop-circle-outline" size={18} color={colors.error} />
          <Text style={styles.endGameText}>End Game</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Goal confirmation modal */}
      <Modal
        visible={!!pendingPlayer}
        transparent
        animationType="slide"
        onRequestClose={cancelGoal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.goalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.goalEmoji}>⚽</Text>
            <Text style={styles.goalSheetTitle}>Goal!</Text>
            <Text style={styles.goalSheetSubtitle}>
              by <Text style={styles.goalPlayerName}>{pendingPlayer?.name}</Text>
            </Text>
            <Text style={styles.goalMinute}>
              Minute {formatTimer(elapsed).replace(':', '′')}
            </Text>
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.sheetCancelBtn} onPress={cancelGoal} activeOpacity={0.8}>
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetConfirmBtn} onPress={confirmGoal} activeOpacity={0.8}>
                <Ionicons name="checkmark" size={18} color={colors.white} />
                <Text style={styles.sheetConfirmText}>Confirm Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastEmoji}>⚽</Text>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Player row ───────────────────────────────────────────────────────────────

interface PlayerRowProps {
  member: Member;
  matchGoals: number;
  onGoal: () => void;
}

function PlayerRow({ member, matchGoals, onGoal }: PlayerRowProps) {
  return (
    <View style={rowStyles.container}>
      <Avatar name={member.name} uri={member.avatar} size={40} />
      <View style={rowStyles.info}>
        <Text style={rowStyles.name}>{member.name}</Text>
        {matchGoals > 0 && (
          <View style={rowStyles.goalsRow}>
            {Array.from({ length: Math.min(matchGoals, 5) }).map((_, i) => (
              <Text key={i} style={rowStyles.ballEmoji}>⚽</Text>
            ))}
            {matchGoals > 5 && (
              <Text style={rowStyles.extraGoals}>+{matchGoals - 5}</Text>
            )}
          </View>
        )}
      </View>
      {matchGoals > 0 && (
        <View style={rowStyles.goalCount}>
          <Text style={rowStyles.goalCountText}>{matchGoals}g</Text>
        </View>
      )}
      <TouchableOpacity style={rowStyles.addBtn} onPress={onGoal} activeOpacity={0.8}>
        <Ionicons name="add" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  info: { flex: 1 },
  name: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  goalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  ballEmoji: { fontSize: 11 },
  extraGoals: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
    marginLeft: 2,
  },
  goalCount: {
    backgroundColor: colors.primary + '25',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  goalCountText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: 'rgba(255,255,255,0.5)',
  },

  // Top safe area
  topSafe: {
    backgroundColor: colors.black,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchTitle: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.7)',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error + '22',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  liveText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.error,
    letterSpacing: 1,
  },

  // Timer
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  timer: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: colors.white,
    fontVariant: ['tabular-nums'],
    lineHeight: 56,
  },
  timerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBtnActive: {
    backgroundColor: colors.primary + '30',
  },

  // Scoreboard
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.xl,
  },
  teamSide: {
    flex: 1,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  teamSideRight: {
    alignItems: 'flex-end',
  },
  teamLabel: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  teamLabelRight: {
    textAlign: 'right',
  },
  scoreNum: {
    fontSize: 80,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.3)',
    lineHeight: 84,
    fontVariant: ['tabular-nums'],
  },
  leadingScore: {
    color: colors.primary,
  },
  scoreDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  scoreSep: {
    fontSize: 36,
    color: 'rgba(255,255,255,0.2)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  sectionHeaderSpaced: {
    marginTop: spacing.lg,
  },

  // Footer / end game
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(26,26,26,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  endGameBtn: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(226,75,74,0.12)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  endGameText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.error,
  },

  // Goal confirmation sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  goalSheet: {
    backgroundColor: '#1C2029',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: spacing.sm,
  },
  goalEmoji: {
    fontSize: 52,
  },
  goalSheetTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    letterSpacing: -0.3,
  },
  goalSheetSubtitle: {
    fontSize: typography.sizes.lg,
    color: 'rgba(255,255,255,0.6)',
  },
  goalPlayerName: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  goalMinute: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: spacing.sm,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.sm,
  },
  sheetCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.6)',
  },
  sheetConfirmBtn: {
    flex: 2,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  sheetConfirmText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },

  // Toast
  toast: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(28,32,41,0.95)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toastEmoji: {
    fontSize: 18,
  },
  toastText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
});

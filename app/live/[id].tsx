// Live score — manager interface during a game.
// Design: open for iteration (no Figma reference yet).
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/shared/Avatar';
import { getEvent } from '../../src/services/api';
import { colors, typography, spacing, radius } from '../../src/constants/theme';
import type { Event, Member } from '../../src/types';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function LiveScoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pendingGoalMember, setPendingGoalMember] = useState<Member | null>(null);
  const [pendingGoalTeam, setPendingGoalTeam] = useState<'A' | 'B' | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  function handleGoalPress(member: Member, team: 'A' | 'B') {
    setPendingGoalMember(member);
    setPendingGoalTeam(team);
  }

  function confirmGoal() {
    if (pendingGoalTeam === 'A') setScoreA((s) => s + 1);
    else setScoreB((s) => s + 1);
    setPendingGoalMember(null);
    setPendingGoalTeam(null);
  }

  function handleEndGame() {
    Alert.alert('End Game', 'Are you sure you want to end this game?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Game',
        style: 'destructive',
        onPress: () => {
          setIsRunning(false);
          router.replace(`/result/${id}`);
        },
      },
    ]);
  }

  if (!event) return null;

  const teamAPlayers = event.confirmed.slice(0, Math.ceil(event.confirmed.length / 2));
  const teamBPlayers = event.confirmed.slice(Math.ceil(event.confirmed.length / 2));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.matchTitle}>{event.title}</Text>
        <View style={styles.timerRow}>
          <Text style={styles.timer}>{formatTimer(elapsed)}</Text>
          <TouchableOpacity
            onPress={() => setIsRunning(!isRunning)}
            style={styles.timerBtn}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={16}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.teamSide}>
          <Text style={styles.teamLabel} numberOfLines={1}>Home</Text>
          <Text style={[styles.scoreNum, scoreA > scoreB && styles.leadingScore]}>
            {scoreA}
          </Text>
        </View>
        <Text style={styles.scoreDash}>–</Text>
        <View style={[styles.teamSide, styles.teamSideRight]}>
          <Text style={[styles.scoreNum, scoreB > scoreA && styles.leadingScore]}>
            {scoreB}
          </Text>
          <Text style={styles.teamLabel} numberOfLines={1}>Away</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.playerList} showsVerticalScrollIndicator={false}>
        {/* Team A */}
        <Text style={styles.teamHeader}>Home team</Text>
        {teamAPlayers.map((member) => (
          <PlayerRow
            key={member.id}
            member={member}
            onGoal={() => handleGoalPress(member, 'A')}
          />
        ))}

        {/* Team B */}
        <Text style={[styles.teamHeader, { marginTop: spacing.lg }]}>Away team</Text>
        {teamBPlayers.map((member) => (
          <PlayerRow
            key={member.id}
            member={member}
            onGoal={() => handleGoalPress(member, 'B')}
          />
        ))}
      </ScrollView>

      {/* End game */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity style={styles.endGameBtn} onPress={handleEndGame}>
          <Text style={styles.endGameText}>End Game</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Goal confirmation modal */}
      <Modal
        visible={!!pendingGoalMember}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingGoalMember(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Goal by {pendingGoalMember?.name}?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setPendingGoalMember(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmGoal}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PlayerRow({ member, onGoal }: { member: Member; onGoal: () => void }) {
  return (
    <View style={styles.playerRow}>
      <Avatar name={member.name} uri={member.avatar} size={36} />
      <Text style={styles.playerName}>{member.name}</Text>
      <Text style={styles.playerGoals}>{member.stats.goals}g</Text>
      <TouchableOpacity style={styles.addGoalBtn} onPress={onGoal}>
        <Ionicons name="add" size={18} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  matchTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.7)',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timer: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  timerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
  teamSide: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  teamSideRight: {
    alignItems: 'flex-end',
  },
  teamLabel: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreNum: {
    fontSize: 72,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 72,
  },
  leadingScore: {
    color: colors.primary,
  },
  scoreDash: {
    fontSize: 40,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 16,
  },
  playerList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.sm,
  },
  teamHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
  },
  playerName: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  playerGoals: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.5)',
    width: 28,
    textAlign: 'right',
  },
  addGoalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  endGameBtn: {
    height: 52,
    backgroundColor: 'rgba(226,75,74,0.2)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endGameText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: 280,
    gap: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalCancel: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  modalCancelText: {
    fontSize: typography.sizes.base,
    color: colors.gray500,
    fontWeight: typography.weights.bold,
  },
  modalConfirm: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: typography.sizes.base,
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
});

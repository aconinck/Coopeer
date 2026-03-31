// Post-game result — final score, MVP vote, share card, survey prompt.
// Design: open for iteration (no Figma reference yet).
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/shared/Avatar';
import { colors, typography, spacing, radius } from '../../src/constants/theme';

// Mock result data — wire to real match state
const MOCK_RESULT = {
  teamA: 'Home',
  teamB: 'Away',
  scoreA: 3,
  scoreB: 2,
  topScorer: { id: 'm1', name: 'Alex Rivera', goals: 2 },
  mvpCandidates: [
    { id: 'm1', name: 'Alex Rivera' },
    { id: 'm2', name: 'Jordan Lee' },
    { id: 'm3', name: 'Sam Torres' },
  ],
};

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mvpVote, setMvpVote] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState({
    scoreCorrect: null as boolean | null,
    topScorerCorrect: null as boolean | null,
    issue: '',
  });

  const homeWon = MOCK_RESULT.scoreA > MOCK_RESULT.scoreB;

  function handleVoteMvp(memberId: string) {
    if (voted) return;
    setMvpVote(memberId);
    setVoted(true);
    // Show survey after MVP vote for random users
    setTimeout(() => setShowSurvey(true), 800);
  }

  if (showSurvey) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.surveyContent}>
          <Text style={styles.surveyTitle}>Help validate this result</Text>
          <Text style={styles.surveySubtitle}>3 quick questions — takes 10 seconds</Text>

          {/* Q1 */}
          <View style={styles.surveyQ}>
            <Text style={styles.surveyQuestion}>
              Was the final score {MOCK_RESULT.scoreA}–{MOCK_RESULT.scoreB}?
            </Text>
            <View style={styles.surveyOptions}>
              {([true, false] as const).map((v) => (
                <TouchableOpacity
                  key={String(v)}
                  style={[
                    styles.surveyOption,
                    surveyAnswers.scoreCorrect === v && styles.surveyOptionActive,
                  ]}
                  onPress={() => setSurveyAnswers((s) => ({ ...s, scoreCorrect: v }))}
                >
                  <Text
                    style={[
                      styles.surveyOptionText,
                      surveyAnswers.scoreCorrect === v && styles.surveyOptionTextActive,
                    ]}
                  >
                    {v ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Q2 */}
          <View style={styles.surveyQ}>
            <Text style={styles.surveyQuestion}>
              Was {MOCK_RESULT.topScorer.name} the top scorer?
            </Text>
            <View style={styles.surveyOptions}>
              {(['Yes', 'No', "Don't know"] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.surveyOption,
                    surveyAnswers.topScorerCorrect === (v === 'Yes') && v !== "Don't know" &&
                      styles.surveyOptionActive,
                  ]}
                  onPress={() =>
                    setSurveyAnswers((s) => ({
                      ...s,
                      topScorerCorrect: v === "Don't know" ? null : v === 'Yes',
                    }))
                  }
                >
                  <Text style={styles.surveyOptionText}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => router.replace('/(tabs)/ranking')}
          >
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Final score */}
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Final Score</Text>
          <View style={styles.finalScore}>
            <View style={styles.finalTeam}>
              <Text style={styles.finalTeamName}>{MOCK_RESULT.teamA}</Text>
              <Text style={[styles.finalScoreNum, homeWon && styles.winnerScore]}>
                {MOCK_RESULT.scoreA}
              </Text>
            </View>
            <Text style={styles.finalDash}>–</Text>
            <View style={[styles.finalTeam, styles.finalTeamRight]}>
              <Text style={[styles.finalScoreNum, !homeWon && styles.winnerScore]}>
                {MOCK_RESULT.scoreB}
              </Text>
              <Text style={styles.finalTeamName}>{MOCK_RESULT.teamB}</Text>
            </View>
          </View>
          <Text style={styles.winnerLabel}>
            {homeWon ? MOCK_RESULT.teamA : MOCK_RESULT.teamB} wins!
          </Text>
        </View>

        {/* Top scorer */}
        <View style={styles.topScorerCard}>
          <Text style={styles.sectionTitle}>Top Scorer</Text>
          <View style={styles.topScorerRow}>
            <Text style={styles.topScorerEmoji}>⚽</Text>
            <Avatar name={MOCK_RESULT.topScorer.name} size={44} />
            <View>
              <Text style={styles.topScorerName}>{MOCK_RESULT.topScorer.name}</Text>
              <Text style={styles.topScorerGoals}>{MOCK_RESULT.topScorer.goals} goals</Text>
            </View>
          </View>
        </View>

        {/* MVP vote */}
        <View style={styles.mvpCard}>
          <Text style={styles.sectionTitle}>Vote MVP</Text>
          <Text style={styles.mvpSubtitle}>Pick the player of the game</Text>
          <View style={styles.mvpGrid}>
            {MOCK_RESULT.mvpCandidates.map((candidate) => (
              <TouchableOpacity
                key={candidate.id}
                onPress={() => handleVoteMvp(candidate.id)}
                style={[
                  styles.mvpCandidate,
                  mvpVote === candidate.id && styles.mvpCandidateSelected,
                ]}
                disabled={voted}
                activeOpacity={0.8}
              >
                <Avatar name={candidate.name} size={48} />
                <Text style={styles.mvpCandidateName} numberOfLines={1}>
                  {candidate.name.split(' ')[0]}
                </Text>
                {mvpVote === candidate.id && (
                  <View style={styles.mvpCheckmark}>
                    <Ionicons name="checkmark" size={12} color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Share */}
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={18} color={colors.white} />
          <Text style={styles.shareBtnText}>Share result</Text>
        </TouchableOpacity>

        {/* Season ranking CTA */}
        <TouchableOpacity
          style={styles.rankingCTA}
          onPress={() => router.replace('/(tabs)/ranking')}
        >
          <Text style={styles.rankingCTAText}>See season ranking →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  resultCard: {
    backgroundColor: colors.black,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  resultLabel: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  finalScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  finalTeam: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  finalTeamRight: {
    alignItems: 'flex-end',
  },
  finalTeamName: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  finalScoreNum: {
    fontSize: 56,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.3)',
    lineHeight: 60,
  },
  winnerScore: {
    color: colors.primary,
  },
  finalDash: {
    fontSize: 36,
    color: 'rgba(255,255,255,0.2)',
  },
  winnerLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  topScorerCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  topScorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  topScorerEmoji: {
    fontSize: 28,
  },
  topScorerName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  topScorerGoals: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  mvpCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    gap: spacing.md,
  },
  mvpSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    marginTop: -spacing.sm,
  },
  mvpGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  mvpCandidate: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    gap: spacing.sm,
    position: 'relative',
  },
  mvpCandidateSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  mvpCandidateName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  mvpCheckmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    backgroundColor: colors.black,
    borderRadius: radius.full,
  },
  shareBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  rankingCTA: {
    alignItems: 'center',
  },
  rankingCTAText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },

  // Survey
  surveyContent: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  surveyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
    letterSpacing: typography.tracking.tight,
  },
  surveySubtitle: {
    fontSize: typography.sizes.base,
    color: colors.gray500,
    marginTop: -spacing.md,
  },
  surveyQ: {
    gap: spacing.md,
  },
  surveyQuestion: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  surveyOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  surveyOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gray100,
    backgroundColor: colors.white,
  },
  surveyOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  surveyOptionText: {
    fontSize: typography.sizes.base,
    color: colors.gray500,
    fontWeight: typography.weights.bold,
  },
  surveyOptionTextActive: {
    color: colors.primary,
  },
  submitBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  submitBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
});

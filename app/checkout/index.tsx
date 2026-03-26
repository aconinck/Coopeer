// Checkout — bottom sheet style payment screen.
// Figma: Pricing section. Shows team + pricing breakdown + card + "Pagar" CTA.
// Triggered from team profile "Try once" or "Join" CTAs.
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MemberAvatars } from '../../src/components/team/MemberAvatars';
import { colors, typography, spacing, radius } from '../../src/constants/theme';

// Mock team data — replace with real data fetching when API is ready
const MOCK_CHECKOUT = {
  teamName: 'Bentonville Strikers',
  teamLogo: null as string | null,
  memberCount: 14,
  subtotal: 2900, // cents
  fee: 290, // cents
  members: [
    { id: 'm1', name: 'Alex Rivera', trustScore: 88, stats: { goals: 0, assists: 0, gamesPlayed: 0, gamesPresent: 0, eloRating: 0, badges: [] }, joinedAt: new Date() },
    { id: 'm2', name: 'Jordan Lee', trustScore: 95, stats: { goals: 0, assists: 0, gamesPlayed: 0, gamesPresent: 0, eloRating: 0, badges: [] }, joinedAt: new Date() },
    { id: 'm3', name: 'Sam Torres', trustScore: 72, stats: { goals: 0, assists: 0, gamesPlayed: 0, gamesPresent: 0, eloRating: 0, badges: [] }, joinedAt: new Date() },
  ],
  card: {
    brand: 'VISA',
    last4: '4798',
    holderName: 'My Card Name',
  },
};

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ teamId?: string; mode?: string }>();
  const router = useRouter();
  const mode = params.mode ?? 'subscription';
  const [loading, setLoading] = useState(false);

  const isSubscription = mode === 'subscription';
  const total = MOCK_CHECKOUT.subtotal + MOCK_CHECKOUT.fee;
  const trialPrice = 700; // cents

  const displayTotal = isSubscription
    ? `$${(total / 100).toFixed(2)} / mo`
    : `$${(trialPrice / 100).toFixed(2)}`;

  async function handlePay() {
    setLoading(true);
    // TODO: integrate Stripe payment intent here
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    router.replace('/(tabs)/teams');
  }

  return (
    <View style={styles.container}>
      {/* Dim background — tapping it goes back */}
      <TouchableOpacity style={styles.backdrop} onPress={() => router.back()} activeOpacity={1} />

      {/* Bottom sheet card */}
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Team identity row */}
          <View style={styles.teamRow}>
            <View style={styles.teamLogoWrapper}>
              {MOCK_CHECKOUT.teamLogo ? (
                <Image source={{ uri: MOCK_CHECKOUT.teamLogo }} style={styles.teamLogo} />
              ) : (
                <View style={[styles.teamLogo, styles.teamLogoFallback]}>
                  <Text style={styles.teamLogoEmoji}>⚽</Text>
                </View>
              )}
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{MOCK_CHECKOUT.teamName}</Text>
              <MemberAvatars
                members={MOCK_CHECKOUT.members}
                maxVisible={4}
                size={26}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Pricing breakdown */}
          <View style={styles.pricingBlock}>
            {isSubscription ? (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Subtotal</Text>
                  <Text style={styles.priceValue}>${(MOCK_CHECKOUT.subtotal / 100).toFixed(2)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, styles.feeLabel]}>Platform fee (3%)</Text>
                  <Text style={[styles.priceValue, styles.feeLabel]}>${(MOCK_CHECKOUT.fee / 100).toFixed(2)}</Text>
                </View>
                <View style={[styles.priceRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{displayTotal}</Text>
                </View>
              </>
            ) : (
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Trial game</Text>
                <Text style={styles.totalValue}>{displayTotal}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Saved card row */}
          <TouchableOpacity style={styles.cardRow} activeOpacity={0.7}>
            <View>
              <Text style={styles.cardHolderName}>{MOCK_CHECKOUT.card.holderName}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardBrand}>{MOCK_CHECKOUT.card.brand}</Text>
                <Text style={styles.cardLast4}>XXXX-{MOCK_CHECKOUT.card.last4}</Text>
              </View>
            </View>
            <Ionicons name="pencil" size={18} color={colors.gray500} />
          </TouchableOpacity>

          {/* Pay button */}
          <TouchableOpacity
            style={[styles.payBtn, loading && styles.payBtnLoading]}
            onPress={handlePay}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.payBtnText}>{loading ? 'Processing…' : 'Pay'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginVertical: spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  teamLogoWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  teamLogo: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  teamLogoFallback: {
    backgroundColor: colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoEmoji: {
    fontSize: 32,
  },
  teamInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  teamName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
    letterSpacing: typography.tracking.tight,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: spacing.sm,
  },
  pricingBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  feeLabel: {
    fontWeight: typography.weights.regular,
    color: colors.gray500,
  },
  priceValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  totalRow: {
    marginTop: spacing.xs,
  },
  totalLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  totalValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  cardHolderName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  cardBrand: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#1A1F71', // Visa blue
  },
  cardLast4: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  payBtn: {
    height: 58,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  payBtnLoading: {
    opacity: 0.7,
  },
  payBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
});

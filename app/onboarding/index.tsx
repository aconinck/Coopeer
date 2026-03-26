// Onboarding flow — splash → hero → phone auth → confirmation
// Figma reference: Login section, nodes 953:839
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CoopeerIcon } from '../../src/components/shared/CoopeerIcon';
import { colors, typography, spacing, radius } from '../../src/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Step = 'splash' | 'hero' | 'phone' | 'confirm';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('splash');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);

  // Splash — just the logo on white, auto-advances
  React.useEffect(() => {
    if (step === 'splash') {
      const t = setTimeout(() => setStep('hero'), 1800);
      return () => clearTimeout(t);
    }
  }, [step]);

  if (step === 'splash') {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="dark" />
        <CoopeerIcon size={72} color={colors.primary} />
      </View>
    );
  }

  if (step === 'hero') {
    return (
      <View style={styles.heroContainer}>
        <StatusBar style="light" />
        {/* Progress line */}
        <View style={styles.progressLine}>
          <View style={[styles.progressFill, { width: '33%' }]} />
        </View>

        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800' }}
          style={styles.heroImage}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay}>
            <SafeAreaView edges={['bottom']} style={styles.heroContent}>
              <Text style={styles.heroTitle}>Discovery a{'\n'}new world!</Text>
              <Text style={styles.heroSubtitle}>
                Don't be alone! Find a group to enjoy your favorite sport!
              </Text>
              <TouchableOpacity
                style={styles.beginBtn}
                onPress={() => setStep('phone')}
                activeOpacity={0.85}
              >
                <Text style={styles.beginBtnText}>Begin</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.faceIdBtn}>
                <Ionicons name="scan-outline" size={28} color={colors.white} />
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (step === 'phone') {
    const canProceed = phone.replace(/\D/g, '').length >= 10;
    return (
      <KeyboardAvoidingView
        style={styles.authContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar style="dark" />
        <SafeAreaView edges={['top']} style={styles.authHeader}>
          <TouchableOpacity onPress={() => setStep('hero')} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={20} color={colors.black} />
          </TouchableOpacity>
          {/* Step progress bar */}
          <View style={styles.stepBar}>
            <View style={[styles.stepFill, { flex: 2, backgroundColor: colors.black }]} />
            <View style={[styles.stepFill, { flex: 1 }]} />
          </View>
        </SafeAreaView>

        <View style={styles.authBody}>
          <Text style={styles.authTitle}>Phone number</Text>
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 000 000 0000"
            placeholderTextColor={colors.gray100}
            keyboardType="phone-pad"
            autoFocus
          />
        </View>

        <View style={styles.authFooter}>
          <TouchableOpacity
            style={[styles.nextBtn, canProceed && styles.nextBtnActive]}
            onPress={() => canProceed && setStep('confirm')}
            disabled={!canProceed}
          >
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Confirm step
  const handleConfirm = () => {
    if (code === '000000') {
      setCodeError(true);
      return;
    }
    // Proceed to main app
    router.replace('/(tabs)/discover');
  };

  const canConfirm = code.replace(/\D/g, '').length === 6;

  return (
    <KeyboardAvoidingView
      style={styles.authContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.authHeader}>
        <TouchableOpacity onPress={() => setStep('phone')} style={styles.backArrow}>
          <Ionicons name="arrow-back" size={20} color={colors.black} />
        </TouchableOpacity>
        <View style={styles.stepBar}>
          <View style={[styles.stepFill, { flex: 1, backgroundColor: colors.black }]} />
          <View style={[styles.stepFill, { flex: 1, backgroundColor: colors.black }]} />
        </View>
      </SafeAreaView>

      <View style={styles.authBody}>
        <Text style={styles.authTitle}>Confirmation</Text>
        <Text style={styles.authHint}>Enter the 6-digit code sent to {phone}</Text>
        <TextInput
          style={[styles.codeInput, codeError && styles.codeInputError]}
          value={code}
          onChangeText={(v) => { setCode(v); setCodeError(false); }}
          placeholder="00 00 00"
          placeholderTextColor={colors.gray100}
          keyboardType="number-pad"
          maxLength={7}
          autoFocus
        />
        {codeError && <Text style={styles.codeError}>Wrong code — try again</Text>}
      </View>

      <View style={styles.authFooter}>
        <TouchableOpacity
          style={[styles.nextBtn, canConfirm && styles.nextBtnActive]}
          onPress={handleConfirm}
          disabled={!canConfirm}
        >
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Splash
  splashContainer: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  heroContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  progressLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  heroImage: {
    flex: 1,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  heroContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  heroTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    letterSpacing: typography.tracking.tight,
  },
  heroSubtitle: {
    fontSize: typography.sizes.base,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  beginBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  faceIdBtn: {
    alignSelf: 'center',
    padding: spacing.sm,
  },

  // Auth screens (phone + confirm)
  authContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  authHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  backArrow: {
    padding: spacing.xs,
  },
  stepBar: {
    flex: 1,
    flexDirection: 'row',
    height: 3,
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    overflow: 'hidden',
    gap: spacing.xs,
  },
  stepFill: {
    height: '100%',
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
  },
  authBody: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  authTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
    letterSpacing: typography.tracking.tight,
  },
  authHint: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    marginTop: -spacing.sm,
  },
  phoneInput: {
    fontSize: typography.sizes.xl,
    color: colors.black,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.gray100,
    paddingBottom: spacing.sm,
    fontWeight: typography.weights.bold,
  },
  codeInput: {
    fontSize: typography.sizes.xxl,
    color: colors.black,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.gray100,
    paddingBottom: spacing.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 8,
  },
  codeInputError: {
    borderBottomColor: colors.error,
    color: colors.error,
  },
  codeError: {
    fontSize: typography.sizes.sm,
    color: colors.error,
  },
  authFooter: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  nextBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnActive: {
    backgroundColor: colors.primary,
  },
});

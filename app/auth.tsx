import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, space, type } from '../src/constants/theme';
import { formatUSPhone } from '../src/lib/format';
import { MIN_PASSWORD, passwordMet, passwordRules, passwordValid } from '../src/lib/password';
import { ACCOUNT_EXISTS, useSession, type ContactKind } from '../src/state/session';
import { ageOf, BirthPicker, type BirthDate } from '../src/ui/BirthPicker';
import { FlowBackground } from '../src/ui/FlowBackground';
import { RingPhotoPicker } from '../src/ui/ProfilePhotoPicker';
import { StepScaffold, UnderlineField } from '../src/ui/StepFlow';
import { Segmented } from '../src/ui/Segmented';
import { Glass } from '../src/ui/Glass';
import { sportIds, sports, type SportId } from '../src/state/models';

type Step = 'contact' | 'password' | 'welcomeBack' | 'newPassword' | 'name' | 'photo' | 'age' | 'sports';
type Direction = 'forward' | 'back';

const THIS_YEAR = new Date().getFullYear();
const MIN_AGE = 13;
const MAX_AGE = 100;

/** How far along each step is: the progress bar and the drift of the background. */
const stepProgress: Record<Step, number> = {
  contact: 0.12,
  password: 0.5,
  welcomeBack: 1,
  newPassword: 0.28,
  name: 0.42,
  photo: 0.56,
  age: 0.7,
  sports: 0.85,
};

/**
 * Identifier-first auth: enter email or phone → system checks if registered →
 * existing users enter password, new users create one then set up profile.
 */
export default function Auth() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const session = useSession();
  const [step, setStepState] = useState<Step>('contact');
  const [direction, setDirection] = useState<Direction>('forward');
  const go = (next: Step, dir: Direction = 'forward') => {
    setDirection(dir);
    setStepState(next);
  };

  const [kind, setKind] = useState<ContactKind>('email');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [birth, setBirth] = useState<BirthDate>({ year: THIS_YEAR - 25, month: 0, day: 1 });
  const [favorites, setFavorites] = useState<SportId[]>([]);

  const digits = phone.replace(/\D/g, '');
  const e164 = `+1${digits}`;

  const finish = () => {
    if (from === 'welcome') router.replace('/map');
    else router.back();
    session.finishAuth();
  };

  // One backdrop behind every step, so it keeps drifting while the steps slide over it.
  return (
    <View style={styles.root}>
      <FlowBackground progress={stepProgress[step]} />
      {renderStep()}
    </View>
  );

  function renderStep() {
  switch (step) {
    case 'contact':
      return (
        <ContactStep
          kind={kind}
          setKind={(k) => { setKind(k); setContact(''); setPhone(''); }}
          phone={phone}
          setPhone={setPhone}
          digits={digits}
          contact={contact}
          setContact={setContact}
          direction={direction}
          onContinue={async (exists) => {
            setIsExisting(exists);
            if (kind === 'phone') setContact(e164);
            go(exists ? 'password' : 'newPassword');
          }}
        />
      );
    case 'password':
      return (
        <PasswordStep
          contact={kind === 'phone' ? phone : contact}
          kind={kind}
          direction={direction}
          onBack={() => go('contact', 'back')}
          onDone={() => go('welcomeBack')}
        />
      );
    case 'welcomeBack':
      return (
        <WelcomeBackStep
          name={session.user?.name ?? ''}
          onDone={finish}
        />
      );
    case 'newPassword':
      return (
        <NewPasswordStep
          contact={kind === 'phone' ? phone : contact}
          kind={kind}
          direction={direction}
          onBack={() => go('contact', 'back')}
          onExists={() => { setIsExisting(true); go('password'); }}
          onDone={() => go('name')}
        />
      );
    case 'name':
      return <NameStep fullName={fullName} setFullName={setFullName} direction={direction} onBack={() => go('newPassword', 'back')} onDone={() => go('photo')} />;
    case 'photo':
      return <PhotoStep name={fullName.trim()} photoUri={photoUri} setPhotoUri={setPhotoUri} direction={direction} onBack={() => go('name', 'back')} onDone={() => go('age')} />;
    case 'age':
      return <AgeStep birth={birth} setBirth={setBirth} direction={direction} onBack={() => go('photo', 'back')} onDone={() => go('sports')} />;
    case 'sports':
      return (
        <SportsStep
          selected={favorites}
          setSelected={setFavorites}
          direction={direction}
          onBack={() => go('age', 'back')}
          onDone={async () => {
            await session.completeProfile({ name: fullName.trim(), birthYear: birth.year, sports: favorites, goal: 'play', photoUri: photoUri ?? undefined });
            session.finishAuth();
            router.replace('/discovery');
          }}
        />
      );
  }
  }
}

// ─── Contact step ─────────────────────────────────────────────────────────────

function ContactStep({
  kind,
  setKind,
  phone,
  setPhone,
  digits,
  contact,
  setContact,
  direction,
  onContinue,
}: {
  kind: ContactKind;
  setKind: (k: ContactKind) => void;
  phone: string;
  setPhone: (v: string) => void;
  digits: string;
  contact: string;
  setContact: (v: string) => void;
  direction: Direction;
  onContinue: (exists: boolean) => Promise<void>;
}) {
  const session = useSession();
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const canContinue = kind === 'email' ? validEmail : digits.length === 10;

  const proceed = async () => {
    setLoading(true);
    setError(null);
    try {
      const normalized = kind === 'email' ? contact.trim().toLowerCase() : `+1${digits}`;
      const exists = await session.checkContact(normalized, kind);
      // Say which way it goes for a beat before sliding on.
      setHint(exists ? 'Welcome back. Enter your password.' : "New here. Let's create your account.");
      await new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : 450));
      await onContinue(exists);
      setHint(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepScaffold
      title="Sign in or create account"
      subtitle="Enter your email or phone to continue."
      progress={stepProgress.contact}
      canContinue={canContinue}
      loading={loading}
      onNext={proceed}
      onBack={() => router.back()}
      backIcon="close"
      direction={direction}
      transparent
    >
      <Glass radius={40} style={styles.kindToggle}>
        <Segmented
          bare
          size="large"
          options={[{ value: 'email' as ContactKind, label: 'Email' }, { value: 'phone' as ContactKind, label: 'Phone' }]}
          value={kind}
          onChange={setKind}
        />
      </Glass>

      {kind === 'email' ? (
        <>
          <UnderlineField
            placeholder="you@example.com"
            value={contact}
            onChangeText={(text) => { setError(null); setContact(text); }}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={() => canContinue && proceed()}
          />
          {contact.endsWith('@') || (contact.includes('@') && !contact.slice(contact.indexOf('@') + 1).includes('.')) ? (
            <View style={styles.domainRow}>
              {['gmail.com', 'icloud.com', 'outlook.com'].map((domain) => (
                <Pressable
                  key={domain}
                  style={({ pressed }) => [styles.domainChip, pressed && { opacity: 0.65 }]}
                  onPress={() => {
                    const base = contact.includes('@') ? contact.slice(0, contact.indexOf('@') + 1) : `${contact}@`;
                    setContact(base + domain);
                  }}
                >
                  <Text style={styles.domainChipText}>{domain}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <UnderlineField
          prefix="+1"
          placeholder="(479) 555-0123"
          value={phone}
          onChangeText={(text) => { setError(null); setPhone(formatUSPhone(text)); }}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          returnKeyType="done"
          onSubmitEditing={() => canContinue && proceed()}
        />
      )}

      {error ? <Text style={[type.footnote, styles.error]}>{error}</Text> : null}
      {hint ? (
        <Animated.Text entering={reduceMotion ? undefined : FadeIn.duration(200)} style={[type.subhead, styles.hint]}>
          {hint}
        </Animated.Text>
      ) : null}
      <Text style={[type.footnote, styles.muted]}>By continuing you agree to Coopeer&apos;s Terms and Privacy Policy.</Text>
    </StepScaffold>
  );
}

// ─── Password step (existing user) ────────────────────────────────────────────

function PasswordStep({
  contact,
  kind,
  direction,
  onBack,
  onDone,
}: {
  contact: string;
  kind: ContactKind;
  direction: Direction;
  onBack: () => void;
  onDone: () => void;
}) {
  const session = useSession();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const normalized = kind === 'email' ? contact.trim().toLowerCase() : `+1${contact.replace(/\D/g, '')}`;
  const canContinue = password.length >= 1;

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await session.contactSignIn(normalized, password, kind);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Incorrect password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepScaffold
      title="Welcome back"
      subtitle={contact}
      progress={stepProgress.password}
      canContinue={canContinue}
      loading={loading}
      onNext={submit}
      onBack={onBack}
      direction={direction}
      transparent
    >
      <UnderlineField
        placeholder="Password"
        value={password}
        onChangeText={(text) => { setError(null); setPassword(text); }}
        secureTextEntry
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="done"
        onSubmitEditing={() => canContinue && submit()}
      />
      {error ? <Text style={[type.footnote, styles.error]}>{error}</Text> : null}
      {resetSent ? <Text style={[type.footnote, styles.muted]}>Reset link sent — check your email.</Text> : null}
      {kind === 'email' && (
        <View style={{ alignItems: 'flex-start', marginTop: space.sm }}>
          <Text
            style={[type.footnote, styles.link]}
            onPress={async () => {
              setError(null);
              try {
                await session.resetPassword(normalized);
                setResetSent(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not send reset email.');
              }
            }}
          >
            Forgot password?
          </Text>
        </View>
      )}
    </StepScaffold>
  );
}

// ─── New password step (new user) ─────────────────────────────────────────────

function NewPasswordStep({
  contact,
  kind,
  direction,
  onBack,
  onExists,
  onDone,
}: {
  contact: string;
  kind: ContactKind;
  direction: Direction;
  onBack: () => void;
  onExists: () => void;
  onDone: () => void;
}) {
  const session = useSession();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = kind === 'email' ? contact.trim().toLowerCase() : `+1${contact.replace(/\D/g, '')}`;
  const canContinue = passwordValid(password);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await session.contactSignUp(normalized, password, kind);
      onDone();
    } catch (e) {
      // The account exists after all (the check could not see it): carry on to sign in.
      if (e instanceof Error && e.message === ACCOUNT_EXISTS) onExists();
      else setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepScaffold
      title="Create a password"
      subtitle={contact}
      progress={stepProgress.newPassword}
      canContinue={canContinue}
      loading={loading}
      onNext={submit}
      onBack={onBack}
      direction={direction}
      transparent
    >
      <UnderlineField
        placeholder={`At least ${MIN_PASSWORD} characters`}
        value={password}
        onChangeText={(text) => { setError(null); setPassword(text); }}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={() => canContinue && submit()}
      />
      <PasswordChecklist password={password} />
      {error ? <Text style={[type.footnote, styles.error]}>{error}</Text> : null}
    </StepScaffold>
  );
}

/** Strength bar (one segment per rule met) plus the rules, each ticking off live as it is satisfied. */
function PasswordChecklist({ password }: { password: string }) {
  const reduceMotion = useReducedMotion();
  const met = passwordMet(password);
  const total = passwordRules.length;
  const complete = met === total;
  const tone = complete ? colors.going : met >= 3 ? colors.brand : colors.live;
  const wasComplete = useRef(false);

  useEffect(() => {
    if (complete && !wasComplete.current && Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    wasComplete.current = complete;
  }, [complete]);

  return (
    <View style={styles.checklist}>
      <View style={styles.strengthRow} accessibilityLabel={`Password strength ${met} of ${total}`}>
        {passwordRules.map((rule, i) => (
          <View key={rule.id} style={[styles.strengthBlock, i < met && { backgroundColor: tone }]} />
        ))}
      </View>
      <Glass radius={22} style={styles.rulesCard}>
        {passwordRules.map((rule) => {
          const ok = rule.test(password);
          return (
            <View key={rule.id} style={styles.rule} accessibilityLabel={`${rule.label}, ${ok ? 'met' : 'not met'}`}>
              {ok ? (
                <Animated.View key="on" entering={reduceMotion ? undefined : FadeIn.duration(160)}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.going} />
                </Animated.View>
              ) : (
                <Ionicons name="ellipse-outline" size={20} color={colors.label3} />
              )}
              <Text style={[type.subhead, ok ? styles.ruleMet : styles.ruleOpen]}>{rule.label}</Text>
            </View>
          );
        })}
      </Glass>
    </View>
  );
}

// ─── Profile steps ────────────────────────────────────────────────────────────

function PhotoStep({
  name,
  photoUri,
  setPhotoUri,
  direction,
  onBack,
  onDone,
}: {
  name: string;
  photoUri: string | null;
  setPhotoUri: (uri: string | null) => void;
  direction: Direction;
  onBack: () => void;
  onDone: () => void;
}) {
  return (
    <StepScaffold
      title="Add a photo"
      subtitle="Help your teammates recognize you."
      progress={stepProgress.photo}
      canContinue={true}
      onNext={onDone}
      onBack={onBack}
      direction={direction}
      transparent
    >
      <RingPhotoPicker
        name={name}
        uri={photoUri}
        onChange={setPhotoUri}
        emptyName="Your name"
        emptyCaption="Add a photo"
        filledCaption="This is how your teammates will see you."
      />
      {!photoUri && (
        <View style={styles.skipRow}>
          <Pressable accessibilityRole="button" onPress={onDone} hitSlop={10}>
            <Text style={[type.subhead, styles.muted]}>Skip for now</Text>
          </Pressable>
        </View>
      )}
    </StepScaffold>
  );
}

function NameStep({
  fullName,
  setFullName,
  direction,
  onBack,
  onDone,
}: {
  fullName: string;
  setFullName: (v: string) => void;
  direction: Direction;
  onBack: () => void;
  onDone: () => void;
}) {
  const valid = fullName.trim().length >= 2;
  return (
    <StepScaffold
      title="Your name"
      subtitle="So your teammates know who's coming."
      progress={stepProgress.name}
      canContinue={valid}
      onNext={onDone}
      onBack={onBack}
      direction={direction}
      transparent
    >
      <UnderlineField
        placeholder="Full name"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        textContentType="name"
        autoComplete="name"
        returnKeyType="done"
        onSubmitEditing={() => valid && onDone()}
      />
    </StepScaffold>
  );
}

// ─── Welcome back screen ──────────────────────────────────────────────────────

function WelcomeBackStep({ name, onDone }: { name: string; onDone: () => void }) {
  const firstName = name.split(' ')[0] || name;
  const emojiScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    emojiScale.value = withSequence(
      withSpring(1.25, { damping: 7, stiffness: 180 }),
      withSpring(1.0, { damping: 12, stiffness: 140 }),
    );
    textOpacity.value = withDelay(280, withTiming(1, { duration: 380 }));
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emojiStyle = useAnimatedStyle(() => ({ transform: [{ scale: emojiScale.value }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View style={styles.welcomeRoot}>
      <Animated.Text style={[styles.welcomeEmoji, emojiStyle]}>🙌</Animated.Text>
      <Animated.View style={textStyle}>
        <Text style={styles.welcomeLabel}>Welcome back,</Text>
        <Text style={styles.welcomeName}>{firstName}!</Text>
      </Animated.View>
    </View>
  );
}

// ─── Birthday step ────────────────────────────────────────────────────────────

function AgeStep({
  birth,
  setBirth,
  direction,
  onBack,
  onDone,
}: {
  birth: BirthDate;
  setBirth: (v: BirthDate) => void;
  direction: Direction;
  onBack: () => void;
  onDone: () => void;
}) {
  const age = ageOf(birth);
  const valid = age >= MIN_AGE && age <= MAX_AGE;
  return (
    <StepScaffold
      title="Your birthday"
      subtitle="Helps us match you with the right level and age groups. Never shown publicly."
      progress={stepProgress.age}
      canContinue={valid}
      onNext={onDone}
      onBack={onBack}
      direction={direction}
      transparent
    >
      <BirthPicker value={birth} onChange={setBirth} minYear={THIS_YEAR - MAX_AGE} maxYear={THIS_YEAR - MIN_AGE + 1} />
      {valid ? (
        <Text style={[type.subhead, styles.muted, styles.center]}>You&apos;re {age}.</Text>
      ) : (
        <Text style={[type.subhead, styles.error, styles.center]}>You must be {MIN_AGE} or older to join.</Text>
      )}
    </StepScaffold>
  );
}


function SportsStep({
  selected,
  setSelected,
  direction,
  onBack,
  onDone,
}: {
  selected: SportId[];
  setSelected: (v: SportId[]) => void;
  direction: Direction;
  onBack: () => void;
  onDone: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const allSelected = sportIds.every((id) => selected.includes(id));

  const toggle = (id: SportId) =>
    setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const toggleAll = () => {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected([...sportIds]);
    }
  };

  const proceed = () => {
    setBusy(true);
    onDone().catch(() => setBusy(false));
  };

  return (
    <StepScaffold
      title="Favorite sports"
      subtitle="Pick all you play."
      progress={stepProgress.sports}
      canContinue={selected.length > 0 && !busy}
      loading={busy}
      onNext={proceed}
      onBack={onBack}
      direction={direction}
      transparent
    >
      <View style={styles.pillRow}>
        {/* All pill */}
        <Pressable
          style={({ pressed }) => [styles.pill, allSelected && styles.pillActive, pressed && { opacity: 0.7 }]}
          onPress={() => { if (Platform.OS !== 'web') void Haptics.selectionAsync(); toggleAll(); }}
          accessibilityRole="checkbox"
          accessibilityLabel="All sports"
          accessibilityState={{ checked: allSelected }}
        >
          <Text style={[styles.pillText, allSelected && styles.pillTextActive]}>All</Text>
        </Pressable>

        {/* Real sport pills */}
        {sportIds.map((id) => {
          const active = selected.includes(id);
          return (
            <Pressable
              key={id}
              style={({ pressed }) => [
                styles.pill,
                active && styles.pillActive,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => { if (Platform.OS !== 'web') void Haptics.selectionAsync(); toggle(id); }}
              accessibilityRole="checkbox"
              accessibilityLabel={sports[id].label}
              accessibilityState={{ checked: active }}
            >
              <MaterialCommunityIcons
                name={sports[id].icon}
                size={16}
                color={active ? colors.white : colors.label2}
              />
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{sports[id].label}</Text>
            </Pressable>
          );
        })}

      </View>
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: { color: colors.live },
  muted: { color: colors.label3 },
  link: { color: colors.brand },
  tiles: { flexDirection: 'row', gap: space.sm },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.label,
    borderColor: colors.label,
  },
  pillText: {
    ...type.subhead,
    color: colors.label2,
    fontWeight: '500',
  },
  pillTextActive: {
    color: colors.white,
  },
  welcomeRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
  },
  welcomeEmoji: {
    fontSize: 72,
  },
  welcomeLabel: {
    ...type.title3,
    color: colors.label2,
    textAlign: 'center',
  },
  welcomeName: {
    ...type.largeTitle,
    color: colors.label,
    textAlign: 'center',
    fontWeight: '700',
  },
  domainRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.sm,
    flexWrap: 'wrap',
  },
  domainChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  domainChipText: {
    ...type.subhead,
    color: colors.label2,
  },
  strengthRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: space.sm,
  },
  strengthBlock: {
    flex: 1,
    height: 4,
    borderRadius: 100,
    backgroundColor: colors.separator,
  },
  kindToggle: { marginBottom: space.lg },
  center: { textAlign: 'center' },
  hint: { color: colors.label2 },
  skipRow: { alignItems: 'center', marginTop: space.sm },
  checklist: { gap: space.md, marginTop: space.sm },
  rulesCard: { padding: space.md, gap: space.sm },
  rule: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  ruleOpen: { color: colors.label2 },
  ruleMet: { color: colors.label },
});

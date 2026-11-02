import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, type ScrollViewInstance } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, space, type } from '../src/constants/theme';
import { formatUSPhone } from '../src/lib/format';
import { useSession, type ContactKind } from '../src/state/session';
import { requestTour } from '../src/tour/Tour';
import { OptionCard, SportTile, StepScaffold, UnderlineField } from '../src/ui/StepFlow';
import { sportIds, sports, type Goal, type SportId } from '../src/state/models';

type Step = 'contact' | 'password' | 'newPassword' | 'name' | 'age' | 'sports' | 'goal';
type Direction = 'forward' | 'back';

const THIS_YEAR = new Date().getFullYear();
const MIN_AGE = 13;
const WHEEL_ITEM_H = 50;
const WHEEL_VISIBLE = 5;
const WHEEL_PAD = WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2);

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
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState(THIS_YEAR - 25);
  const [favorites, setFavorites] = useState<SportId[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);

  const digits = phone.replace(/\D/g, '');
  const e164 = `+1${digits}`;

  const finish = () => {
    if (from === 'welcome') router.replace('/map');
    else router.back();
    session.finishAuth();
  };

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
          onDone={() => go('name')}
        />
      );
    case 'name':
      return <NameStep name={name} setName={setName} direction={direction} onBack={() => go('newPassword', 'back')} onDone={() => go('age')} />;
    case 'age':
      return <AgeStep birthYear={birthYear} setBirthYear={setBirthYear} direction={direction} onBack={() => go('name', 'back')} onDone={() => go('sports')} />;
    case 'sports':
      return <SportsStep selected={favorites} setSelected={setFavorites} direction={direction} onBack={() => go('age', 'back')} onDone={() => go('goal')} />;
    case 'goal':
      return (
        <GoalStep
          goal={goal}
          setGoal={setGoal}
          direction={direction}
          onBack={() => go('sports', 'back')}
          onDone={async () => {
            const chosen = goal ?? 'play';
            await session.completeProfile({ name, birthYear, sports: favorites, goal: chosen });
            await requestTour();
            session.finishAuth();
            if (chosen === 'join') router.replace('/clubs');
            else router.replace(favorites[0] ? `/map?sport=${favorites[0]}` : '/map');
            if (chosen === 'host') router.push(favorites[0] ? `/create/game?sport=${favorites[0]}` : '/create/game');
          }}
        />
      );
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const canContinue = kind === 'email' ? validEmail : digits.length === 10;

  const proceed = async () => {
    setLoading(true);
    setError(null);
    try {
      const normalized = kind === 'email' ? contact.trim().toLowerCase() : `+1${digits}`;
      const exists = await session.checkContact(normalized, kind);
      await onContinue(exists);
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
      progress={0.14}
      canContinue={canContinue}
      loading={loading}
      onNext={proceed}
      onBack={() => router.back()}
      backIcon="close"
      direction={direction}
    >
      <View style={styles.kindToggle}>
        <TouchableOpacity
          style={[styles.kindBtn, kind === 'email' && styles.kindBtnActive]}
          onPress={() => setKind('email')}
          activeOpacity={0.7}
        >
          <Text style={[styles.kindBtnText, kind === 'email' && styles.kindBtnTextActive]}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.kindBtn, kind === 'phone' && styles.kindBtnActive]}
          onPress={() => setKind('phone')}
          activeOpacity={0.7}
        >
          <Text style={[styles.kindBtnText, kind === 'phone' && styles.kindBtnTextActive]}>Phone</Text>
        </TouchableOpacity>
      </View>

      {kind === 'email' ? (
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

  const normalized = kind === 'email' ? contact.trim().toLowerCase() : contact;
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
      progress={0.5}
      canContinue={canContinue}
      loading={loading}
      onNext={submit}
      onBack={onBack}
      direction={direction}
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

  const normalized = kind === 'email' ? contact.trim().toLowerCase() : contact;
  const canContinue = password.length >= 6;

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await session.contactSignUp(normalized, password, kind);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepScaffold
      title="Create a password"
      subtitle={contact}
      progress={0.28}
      canContinue={canContinue}
      loading={loading}
      onNext={submit}
      onBack={onBack}
      direction={direction}
    >
      <UnderlineField
        placeholder="At least 6 characters"
        value={password}
        onChangeText={(text) => { setError(null); setPassword(text); }}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={() => canContinue && submit()}
      />
      {error ? <Text style={[type.footnote, styles.error]}>{error}</Text> : null}
    </StepScaffold>
  );
}

// ─── Profile steps ────────────────────────────────────────────────────────────

function NameStep({
  name,
  setName,
  direction,
  onBack,
  onDone,
}: {
  name: string;
  setName: (v: string) => void;
  direction: Direction;
  onBack: () => void;
  onDone: () => void;
}) {
  const valid = name.trim().length >= 2;
  return (
    <StepScaffold
      title="Full name"
      subtitle="So your teammates know who's coming."
      progress={0.43}
      canContinue={valid}
      onNext={onDone}
      onBack={onBack}
      direction={direction}
    >
      <UnderlineField
        placeholder="Alex Rivera"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        textContentType="name"
        autoComplete="name"
        returnKeyType="next"
        onSubmitEditing={() => valid && onDone()}
      />
    </StepScaffold>
  );
}

// ─── Year wheel picker ────────────────────────────────────────────────────────

function YearWheelPicker({ year, onChange }: { year: number; onChange: (y: number) => void }) {
  const minYear = THIS_YEAR - 100;
  const maxYear = THIS_YEAR - MIN_AGE;
  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i),
    [minYear, maxYear],
  );
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const [centeredYear, setCenteredYear] = useState(year);

  useEffect(() => {
    const idx = years.indexOf(year);
    if (idx < 0) return;
    setTimeout(() => scrollRef.current?.scrollTo({ y: idx * WHEEL_ITEM_H, animated: false }), 80);
  }, []);

  const fromOffset = useCallback(
    (offsetY: number, haptic: boolean) => {
      const idx = Math.max(0, Math.min(years.length - 1, Math.round(offsetY / WHEEL_ITEM_H)));
      const y = years[idx];
      setCenteredYear(y);
      if (haptic && y !== centeredYear && Platform.OS !== 'web') {
        void Haptics.selectionAsync();
      }
      return y;
    },
    [years, centeredYear],
  );

  return (
    <View style={styles.wheelOuter}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: WHEEL_PAD }}
        scrollEventThrottle={16}
        onScroll={(e) => fromOffset(e.nativeEvent.contentOffset.y, false)}
        onMomentumScrollEnd={(e) => onChange(fromOffset(e.nativeEvent.contentOffset.y, true))}
        onScrollEndDrag={(e) => onChange(fromOffset(e.nativeEvent.contentOffset.y, true))}
      >
        {years.map((y) => (
          <View key={y} style={styles.wheelItem}>
            <Text style={[styles.wheelText, y === centeredYear && styles.wheelTextSelected]}>{y}</Text>
          </View>
        ))}
      </ScrollView>
      {/* top + bottom fade masks */}
      <View style={[styles.wheelFade, styles.wheelFadeTop]} pointerEvents="none" />
      <View style={[styles.wheelFade, styles.wheelFadeBottom]} pointerEvents="none" />
      {/* selection indicator lines */}
      <View style={styles.wheelSelector} pointerEvents="none" />
    </View>
  );
}

function AgeStep({
  birthYear,
  setBirthYear,
  direction,
  onBack,
  onDone,
}: {
  birthYear: number;
  setBirthYear: (v: number) => void;
  direction: Direction;
  onBack: () => void;
  onDone: () => void;
}) {
  const age = THIS_YEAR - birthYear;
  const valid = age >= MIN_AGE && age <= 100;
  return (
    <StepScaffold
      title="Birth year"
      subtitle="Helps us match you with the right level and age groups. Never shown publicly."
      progress={0.57}
      canContinue={valid}
      onNext={onDone}
      onBack={onBack}
      direction={direction}
    >
      <YearWheelPicker year={birthYear} onChange={setBirthYear} />
      {valid && <Text style={[type.subhead, styles.muted]}>You're {age}.</Text>}
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
  onDone: () => void;
}) {
  const toggle = (id: SportId) => setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  return (
    <StepScaffold
      title="Your sports"
      subtitle="Tap all you play. We'll show these first."
      progress={0.71}
      canContinue={selected.length > 0}
      onNext={onDone}
      onBack={onBack}
      direction={direction}
    >
      <View style={styles.tiles}>
        {sportIds.map((id) => (
          <SportTile key={id} icon={sports[id].icon} color={sports[id].color} title={sports[id].label} selected={selected.includes(id)} onPress={() => toggle(id)} />
        ))}
      </View>
    </StepScaffold>
  );
}

const goals: { id: Goal; icon: 'map-search-outline' | 'account-group-outline' | 'flag-plus-outline'; title: string; detail: string }[] = [
  { id: 'play', icon: 'map-search-outline', title: 'Find a game', detail: 'See what is happening near you today.' },
  { id: 'join', icon: 'account-group-outline', title: 'Join a club', detail: 'Play with the same group every week.' },
  { id: 'host', icon: 'flag-plus-outline', title: 'Start a game', detail: 'Pick a place and time. Players near you join.' },
];

function GoalStep({
  goal,
  setGoal,
  direction,
  onBack,
  onDone,
}: {
  goal: Goal | null;
  setGoal: (v: Goal) => void;
  direction: Direction;
  onBack: () => void;
  onDone: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <StepScaffold
      title="What's first?"
      subtitle="We'll take you straight there. You can do all of it later."
      progress={1}
      canContinue={goal !== null && !busy}
      onNext={() => {
        if (busy) return;
        setBusy(true);
        onDone().catch(() => setBusy(false));
      }}
      onBack={onBack}
      direction={direction}
    >
      <View style={styles.options}>
        {goals.map((g) => (
          <OptionCard key={g.id} icon={g.icon} title={g.title} detail={g.detail} selected={goal === g.id} onPress={() => setGoal(g.id)} />
        ))}
      </View>
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.live },
  muted: { color: colors.label3 },
  link: { color: colors.brand },
  options: { gap: space.md },
  tiles: { flexDirection: 'row', gap: space.sm },
  kindToggle: {
    flexDirection: 'row',
    backgroundColor: colors.fill,
    borderRadius: radius.tile,
    padding: 3,
    marginBottom: space.lg,
    gap: 2,
  },
  kindBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.tile - 2,
    alignItems: 'center',
  },
  kindBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  kindBtnText: {
    ...type.subhead,
    color: colors.label3,
  },
  kindBtnTextActive: {
    color: colors.label,
  },
  // ─── Wheel picker ───────────────────────────────────────────────────────────
  wheelOuter: {
    height: WHEEL_ITEM_H * WHEEL_VISIBLE,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  wheelItem: {
    height: WHEEL_ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelText: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.label3,
  },
  wheelTextSelected: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.label,
  },
  wheelFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: WHEEL_PAD,
  },
  wheelFadeTop: {
    top: 0,
    backgroundColor: colors.bg,
    opacity: 0.88,
  },
  wheelFadeBottom: {
    bottom: 0,
    backgroundColor: colors.bg,
    opacity: 0.88,
  },
  wheelSelector: {
    position: 'absolute',
    top: WHEEL_PAD,
    left: 32,
    right: 32,
    height: WHEEL_ITEM_H,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
});

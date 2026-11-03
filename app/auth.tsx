import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, type ScrollViewInstance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, space, type } from '../src/constants/theme';
import { formatUSPhone } from '../src/lib/format';
import { useSession, type ContactKind } from '../src/state/session';
import { requestTour } from '../src/tour/Tour';
import { SportTile, StepScaffold, UnderlineField } from '../src/ui/StepFlow';
import { sportIds, sports, type SportId } from '../src/state/models';

type Step = 'contact' | 'password' | 'newPassword' | 'name' | 'age' | 'sports';
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
      return (
        <SportsStep
          selected={favorites}
          setSelected={setFavorites}
          direction={direction}
          onBack={() => go('age', 'back')}
          onDone={async () => {
            await session.completeProfile({ name, birthYear, sports: favorites, goal: 'play' });
            await requestTour();
            session.finishAuth();
            router.replace(favorites[0] ? `/map?sport=${favorites[0]}` : '/map');
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
      {/* top + bottom gradient fades — must match StepScaffold's colors.surface background */}
      <LinearGradient
        colors={[colors.surface, colors.surface + '00']}
        style={[styles.wheelGrad, { top: 0 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[colors.surface + '00', colors.surface]}
        style={[styles.wheelGrad, { bottom: 0 }]}
        pointerEvents="none"
      />
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

const INTEREST_SPORTS: { id: string; label: string; icon: string }[] = [
  { id: 'basketball', label: 'Basketball', icon: 'basketball' },
  { id: 'tennis', label: 'Tennis', icon: 'tennis-ball' },
  { id: 'volleyball', label: 'Volleyball', icon: 'volleyball' },
  { id: 'running', label: 'Running', icon: 'run' },
  { id: 'cycling', label: 'Cycling', icon: 'bike' },
  { id: 'golf', label: 'Golf', icon: 'golf' },
  { id: 'swimming', label: 'Swimming', icon: 'swim' },
  { id: 'yoga', label: 'Yoga', icon: 'yoga' },
];

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
  const [interests, setInterests] = useState<string[]>([]);
  const allSelected = sportIds.every((id) => selected.includes(id));

  const toggle = (id: SportId) =>
    setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const toggleAll = () => setSelected(allSelected ? [] : [...sportIds]);

  const toggleInterest = (id: string) =>
    setInterests((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const proceed = () => {
    setBusy(true);
    const save = interests.length > 0
      ? AsyncStorage.setItem('coopeer.sport_interests', JSON.stringify(interests)).catch(() => {})
      : Promise.resolve();
    save.then(() => onDone()).catch(() => setBusy(false));
  };

  return (
    <StepScaffold
      title="Favorite sports"
      subtitle="Pick all you play."
      progress={0.85}
      canContinue={selected.length > 0 && !busy}
      loading={busy}
      onNext={proceed}
      onBack={onBack}
      direction={direction}
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
                active && { backgroundColor: sports[id].color, borderColor: sports[id].color },
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

        {/* Interest sport pills (data gathering) */}
        {INTEREST_SPORTS.map(({ id, label, icon }) => {
          const active = interests.includes(id);
          return (
            <Pressable
              key={id}
              style={({ pressed }) => [
                styles.pill,
                active && styles.pillActive,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => { if (Platform.OS !== 'web') void Haptics.selectionAsync(); toggleInterest(id); }}
              accessibilityRole="checkbox"
              accessibilityLabel={label}
              accessibilityState={{ checked: active }}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={16}
                color={active ? colors.white : colors.label2}
              />
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
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
  wheelGrad: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: WHEEL_PAD,
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

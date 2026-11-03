import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, type ScrollViewInstance } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, space, type } from '../src/constants/theme';
import { formatUSPhone } from '../src/lib/format';
import { useSession, type ContactKind } from '../src/state/session';
import { requestTour } from '../src/tour/Tour';
import { SportTile, StepScaffold, UnderlineField } from '../src/ui/StepFlow';
import { Segmented } from '../src/ui/Segmented';
import { Glass } from '../src/ui/Glass';
import { sportIds, sports, type SportId } from '../src/state/models';

type Step = 'contact' | 'password' | 'welcomeBack' | 'newPassword' | 'name' | 'photo' | 'age' | 'sports';
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
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
          onDone={() => go('name')}
        />
      );
    case 'name':
      return <NameStep firstName={firstName} setFirstName={setFirstName} lastName={lastName} setLastName={setLastName} direction={direction} onBack={() => go('newPassword', 'back')} onDone={() => go('photo')} />;
    case 'photo':
      return <PhotoStep photoUri={photoUri} setPhotoUri={setPhotoUri} direction={direction} onBack={() => go('name', 'back')} onDone={() => go('age')} />;
    case 'age':
      return <AgeStep birthYear={birthYear} setBirthYear={setBirthYear} direction={direction} onBack={() => go('photo', 'back')} onDone={() => go('sports')} />;
    case 'sports':
      return (
        <SportsStep
          selected={favorites}
          setSelected={setFavorites}
          direction={direction}
          onBack={() => go('age', 'back')}
          onDone={async () => {
            await session.completeProfile({ name: `${firstName.trim()} ${lastName.trim()}`.trim(), birthYear, sports: favorites, goal: 'play' });
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
      <PasswordStrengthBar length={password.length} />
      {error ? <Text style={[type.footnote, styles.error]}>{error}</Text> : null}
    </StepScaffold>
  );
}

function PasswordStrengthBar({ length }: { length: number }) {
  const MIN = 6;
  const done = length >= MIN;
  return (
    <View style={styles.strengthRow}>
      {Array.from({ length: MIN }, (_, i) => (
        <View
          key={i}
          style={[styles.strengthBlock, i < length && { backgroundColor: done ? '#34C759' : colors.brand }]}
        />
      ))}
    </View>
  );
}

// ─── Profile steps ────────────────────────────────────────────────────────────

function PhotoStep({
  photoUri,
  setPhotoUri,
  direction,
  onBack,
  onDone,
}: {
  photoUri: string | null;
  setPhotoUri: (uri: string | null) => void;
  direction: Direction;
  onBack: () => void;
  onDone: () => void;
}) {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  return (
    <StepScaffold
      title="Add a photo"
      subtitle="Help your teammates recognize you."
      progress={0.5}
      canContinue={true}
      onNext={onDone}
      onBack={onBack}
      direction={direction}
    >
      <View style={styles.photoCenter}>
        <Pressable
          onPress={pickImage}
          style={({ pressed }) => [styles.avatarWrap, pressed && { opacity: 0.8 }]}
          accessibilityLabel="Choose photo"
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={52} color={colors.label3} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={18} color={colors.white} />
          </View>
        </Pressable>
        <View style={styles.photoActions}>
          {Platform.OS !== 'web' && (
            <Pressable onPress={takePhoto} style={({ pressed }) => [styles.photoBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="camera-outline" size={18} color={colors.label} />
              <Text style={[type.subhead, styles.photoBtnText]}>Take photo</Text>
            </Pressable>
          )}
          <Pressable onPress={pickImage} style={({ pressed }) => [styles.photoBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="images-outline" size={18} color={colors.label} />
            <Text style={[type.subhead, styles.photoBtnText]}>Choose from library</Text>
          </Pressable>
          {photoUri && (
            <Pressable onPress={() => setPhotoUri(null)} style={({ pressed }) => [styles.photoBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="trash-outline" size={18} color={colors.live} />
              <Text style={[type.subhead, { color: colors.live }]}>Remove</Text>
            </Pressable>
          )}
        </View>
      </View>
    </StepScaffold>
  );
}

function NameStep({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  direction,
  onBack,
  onDone,
}: {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  direction: Direction;
  onBack: () => void;
  onDone: () => void;
}) {
  const lastRef = useRef<any>(null);
  const valid = firstName.trim().length >= 1 && lastName.trim().length >= 1;
  return (
    <StepScaffold
      title="Your name"
      subtitle="So your teammates know who's coming."
      progress={0.43}
      canContinue={valid}
      onNext={onDone}
      onBack={onBack}
      direction={direction}
    >
      <UnderlineField
        placeholder="First name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        textContentType="givenName"
        autoComplete="given-name"
        returnKeyType="next"
        onSubmitEditing={() => lastRef.current?.focus?.()}
      />
      <View style={{ height: space.lg }} />
      <UnderlineField
        ref={lastRef}
        placeholder="Last name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        textContentType="familyName"
        autoComplete="family-name"
        autoFocus={false}
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
  const allSelected =
    sportIds.every((id) => selected.includes(id)) &&
    INTEREST_SPORTS.every(({ id }) => interests.includes(id));

  const toggle = (id: SportId) =>
    setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const toggleAll = () => {
    if (allSelected) {
      setSelected([]);
      setInterests([]);
    } else {
      setSelected([...sportIds]);
      setInterests(INTEREST_SPORTS.map((s) => s.id));
    }
  };

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
  welcomeRoot: {
    flex: 1,
    backgroundColor: colors.surface,
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
    width: 20,
    height: 3,
    borderRadius: 100,
    backgroundColor: colors.separator,
  },
  kindToggle: { marginBottom: space.lg },
  photoCenter: { alignItems: 'center', gap: space.lg },
  avatarWrap: { position: 'relative', width: 120, height: 120 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.separator,
  },
  avatarBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  photoActions: { gap: space.sm, alignItems: 'center' },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  photoBtnText: { color: colors.label },
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

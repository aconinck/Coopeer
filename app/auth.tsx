import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, space, type } from '../src/constants/theme';
import { formatUSPhone } from '../src/lib/format';
import { useSession } from '../src/state/session';
import { requestTour } from '../src/tour/Tour';
import { TextButton } from '../src/ui/Buttons';
import { CodeField, OptionCard, SportTile, StepScaffold, UnderlineField } from '../src/ui/StepFlow';
import { sportIds, sports, type Goal, type SportId } from '../src/state/models';

type Step = 'phone' | 'code' | 'name' | 'age' | 'sports' | 'goal';
type Direction = 'forward' | 'back';

/**
 * Phone-only login: number → SMS code. New players then set up a quick profile —
 * name → age → favorite sports → what they want to do first — and land right in that flow.
 */
export default function Auth() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const session = useSession();
  const [step, setStepState] = useState<Step>('phone');
  const [direction, setDirection] = useState<Direction>('forward');
  const go = (next: Step, dir: Direction = 'forward') => {
    setDirection(dir);
    setStepState(next);
  };
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
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
    case 'phone':
      return <PhoneStep phone={phone} setPhone={setPhone} digits={digits} direction={direction} onSent={() => go('code')} />;
    case 'code':
      return (
        <CodeStep
          phone={e164}
          displayPhone={phone}
          direction={direction}
          onBack={() => go('phone', 'back')}
          onVerified={(needsName) => (needsName ? go('name') : finish())}
        />
      );
    case 'name':
      return <NameStep name={name} setName={setName} direction={direction} onBack={() => go('code', 'back')} onDone={() => go('age')} />;
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
            await session.completeProfile({ name, birthYear: Number(birthYear) || undefined, sports: favorites, goal: chosen });
            await requestTour();
            session.finishAuth();
            // The goal is the last step: land them straight in what they picked.
            if (chosen === 'join') router.replace('/clubs');
            else router.replace(favorites[0] ? `/map?sport=${favorites[0]}` : '/map');
            if (chosen === 'host') router.push(favorites[0] ? `/create/game?sport=${favorites[0]}` : '/create/game');
          }}
        />
      );
  }
}

function PhoneStep({
  phone,
  setPhone,
  digits,
  direction,
  onSent,
}: {
  phone: string;
  setPhone: (v: string) => void;
  digits: string;
  direction: Direction;
  onSent: () => void;
}) {
  const session = useSession();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setSending(true);
    try {
      await session.sendCode(`+1${digits}`);
      onSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <StepScaffold
      title="Phone number"
      subtitle="We'll text you a code. No password, ever."
      progress={0.14}
      canContinue={digits.length === 10}
      loading={sending}
      onNext={send}
      onBack={() => router.back()}
      backIcon="close"
      direction={direction}
    >
      <UnderlineField
        prefix="+1"
        placeholder="(479) 555-0123"
        value={phone}
        onChangeText={(text) => {
          setError(null);
          setPhone(formatUSPhone(text));
        }}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        error={!!error}
        onSubmitEditing={() => digits.length === 10 && send()}
      />
      {error ? <Text style={[type.footnote, styles.error]}>{error}</Text> : null}
      <Text style={[type.footnote, styles.muted]}>By continuing you agree to Coopeer&apos;s Terms and Privacy Policy.</Text>
    </StepScaffold>
  );
}

function CodeStep({
  phone,
  displayPhone,
  direction,
  onBack,
  onVerified,
}: {
  phone: string;
  displayPhone: string;
  direction: Direction;
  onBack: () => void;
  onVerified: (needsName: boolean) => void;
}) {
  const session = useSession();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendIn, setResendIn] = useState(30);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const verify = async (value: string) => {
    if (verifying || value.length !== 6) return;
    setVerifying(true);
    try {
      const needsName = await session.verify(phone, value);
      setSuccess(true);
      // Let the arrow morph into a check before moving on.
      setTimeout(() => onVerified(needsName), reduceMotion ? 0 : 480);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That code didn't work.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <StepScaffold
      title="Confirmation"
      subtitle={`Enter the 6-digit code we sent to +1 ${displayPhone}.`}
      progress={0.28}
      canContinue={code.length === 6}
      loading={verifying}
      success={success}
      onNext={() => verify(code)}
      onBack={onBack}
      direction={direction}
    >
      <CodeField
        value={code}
        onChange={(next) => {
          setCode(next);
          if (next.length < 6) setError(null);
          if (next.length === 6) verify(next);
        }}
        length={6}
        groupSize={3}
        error={!!error}
        oneTimeCode
      />
      {error ? <Text style={[type.footnote, styles.error]}>{error}</Text> : null}
      <View style={{ alignItems: 'flex-start', marginTop: space.sm }}>
        <TextButton
          title={resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
          disabled={resendIn > 0}
          onPress={() => {
            setCode('');
            setError(null);
            setResendIn(30);
            session.sendCode(phone);
          }}
        />
      </View>
    </StepScaffold>
  );
}

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

const THIS_YEAR = new Date().getFullYear();
const MIN_AGE = 13;

function AgeStep({
  birthYear,
  setBirthYear,
  direction,
  onBack,
  onDone,
}: {
  birthYear: string;
  setBirthYear: (v: string) => void;
  direction: Direction;
  onBack: () => void;
  onDone: () => void;
}) {
  const year = Number(birthYear);
  const age = birthYear.length === 4 ? THIS_YEAR - year : null;
  const valid = age !== null && age >= MIN_AGE && age <= 100;
  const tooYoung = age !== null && age < MIN_AGE;
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
      <UnderlineField
        placeholder="1996"
        value={birthYear}
        onChangeText={(text) => setBirthYear(text.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        autoComplete="birthdate-year"
        error={tooYoung || (age !== null && age > 100)}
        onSubmitEditing={() => valid && onDone()}
      />
      {valid && <Text style={[type.subhead, styles.muted]}>You're {age}.</Text>}
      {tooYoung && <Text style={[type.footnote, styles.error]}>You need to be at least {MIN_AGE} to use Coopeer.</Text>}
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
  options: { gap: space.md },
  tiles: { flexDirection: 'row', gap: space.sm },
});

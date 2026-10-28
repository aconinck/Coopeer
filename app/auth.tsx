import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, type } from '../src/constants/theme';
import { formatUSPhone } from '../src/lib/format';
import { useSession } from '../src/state/session';
import { ActionBar, PrimaryButton, SecondaryButton, TextButton } from '../src/ui/Buttons';
import { CodeField, StepScaffold, UnderlineField } from '../src/ui/StepFlow';
import { HeroBackground } from '../src/ui/Hero';

type Step = 'phone' | 'code' | 'name' | 'done';

/** Phone-only login: number → SMS code → (new people only) name. No passwords. */
export default function Auth() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const session = useSession();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  const digits = phone.replace(/\D/g, '');
  const e164 = `+1${digits}`;

  const finish = () => {
    if (from === 'welcome') router.replace('/explore');
    else router.back();
    session.finishAuth();
  };

  switch (step) {
    case 'phone':
      return <PhoneStep phone={phone} setPhone={setPhone} digits={digits} onSent={() => setStep('code')} />;
    case 'code':
      return (
        <CodeStep
          phone={e164}
          displayPhone={phone}
          onBack={() => setStep('phone')}
          onVerified={(needsName) => (needsName ? setStep('name') : finish())}
        />
      );
    case 'name':
      return <NameStep name={name} setName={setName} onBack={() => setStep('code')} onDone={() => setStep('done')} />;
    case 'done':
      return (
        <DoneStep
          name={name.trim()}
          onExplore={async () => {
            await session.completeProfile(name);
            finish();
          }}
          onJoin={async () => {
            await session.completeProfile(name);
            finish();
            router.push('/join?mode=code');
          }}
        />
      );
  }
}

function PhoneStep({ phone, setPhone, digits, onSent }: { phone: string; setPhone: (v: string) => void; digits: string; onSent: () => void }) {
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
      progress={0.33}
      canContinue={digits.length === 10}
      loading={sending}
      onNext={send}
      onBack={() => router.back()}
      backIcon="close"
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
  onBack,
  onVerified,
}: {
  phone: string;
  displayPhone: string;
  onBack: () => void;
  onVerified: (needsName: boolean) => void;
}) {
  const session = useSession();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(30);

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
      onVerified(needsName);
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
      progress={0.66}
      canContinue={code.length === 6}
      loading={verifying}
      onNext={() => verify(code)}
      onBack={onBack}
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

function NameStep({ name, setName, onBack, onDone }: { name: string; setName: (v: string) => void; onBack: () => void; onDone: () => void }) {
  const valid = name.trim().length >= 2;
  return (
    <StepScaffold
      title="Full name"
      subtitle="So your teammates know who's coming."
      progress={0.9}
      canContinue={valid}
      onNext={onDone}
      onBack={onBack}
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

function DoneStep({ name, onExplore, onJoin }: { name: string; onExplore: () => Promise<void>; onJoin: () => Promise<void> }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const first = name.split(' ')[0] || name;

  const run = (action: () => Promise<void>) => async () => {
    if (busy) return;
    setBusy(true);
    await action();
  };

  return (
    <View style={styles.hero}>
      <StatusBar style="light" />
      <HeroBackground />
      <View style={[styles.heroContent, { paddingTop: insets.top }]}>
        <Text style={[type.hero, styles.center, { color: colors.white }]}>Welcome,{'\n'}{first}!</Text>
        <Text style={[type.title3, styles.center, styles.heroSubtitle]}>
          Find a game near you tonight, or join a club with its code.
        </Text>
      </View>
      <View style={{ paddingHorizontal: space.md, paddingBottom: Math.max(insets.bottom, space.md) }}>
        <ActionBar>
          <SecondaryButton title="Join a club" onPress={run(onJoin)} disabled={busy} />
          <PrimaryButton title="Explore" onPress={run(onExplore)} loading={busy} />
        </ActionBar>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.live },
  muted: { color: colors.label3 },
  hero: { flex: 1, backgroundColor: colors.heroDark },
  heroContent: { flex: 1, justifyContent: 'center', paddingHorizontal: space.xl, gap: space.md },
  center: { textAlign: 'center' },
  heroSubtitle: { color: colors.white, opacity: 0.8, fontWeight: '400' },
});

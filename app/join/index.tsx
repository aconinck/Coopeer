import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../../src/constants/theme';
import { TEAM_CODE_LENGTH, dollars, extractTeamCode } from '../../src/lib/format';
import { sports, type Club } from '../../src/state/models';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { ActionBar, IconButton, PrimaryButton, SecondaryButton, TextButton } from '../../src/ui/Buttons';
import { AvatarStack, ClubLogo } from '../../src/ui/Display';
import { Glass } from '../../src/ui/Glass';
import { CodeField, StepScaffold } from '../../src/ui/StepFlow';

function haptic(kind: Haptics.NotificationFeedbackType) {
  if (Platform.OS !== 'web') Haptics.notificationAsync(kind);
}

/** Every way into a club ends here: QR scan, typed code, or a coopeer://join/<code> link. */
export default function Join() {
  const params = useLocalSearchParams<{ mode?: string; code?: string }>();
  const store = useStore();
  const [mode, setMode] = useState<'scan' | 'code'>(params.mode === 'scan' ? 'scan' : 'code');
  const [code, setCode] = useState(params.code?.replace(/\D/g, '').slice(0, TEAM_CODE_LENGTH) ?? '');
  const [lookingUp, setLookingUp] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [foundId, setFoundId] = useState<string | null>(null);

  const lookUp = async (value: string) => {
    if (lookingUp || value.length !== TEAM_CODE_LENGTH) return;
    setLookingUp(true);
    const club = await store.findClub(value);
    setLookingUp(false);
    if (club) {
      setFoundId(club.id);
    } else {
      setNotFound(true);
      haptic(Haptics.NotificationFeedbackType.Error);
    }
  };

  useEffect(() => {
    if (code.length === TEAM_CODE_LENGTH) lookUp(code);
    // Only on first open (deep link / prefilled code).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const found = foundId ? store.club(foundId) : undefined;

  return (
    <View style={styles.root}>
      {mode === 'scan' ? (
        <ScanStep
          onCode={(scanned) => {
            setCode(scanned);
            setNotFound(false);
            setMode('code');
            lookUp(scanned);
          }}
          onTypeInstead={() => setMode('code')}
        />
      ) : (
        <StepScaffold
          title="Team code"
          subtitle="Ask the club organizer for their 8-digit code."
          progress={0.5}
          canContinue={code.length === TEAM_CODE_LENGTH}
          loading={lookingUp}
          onNext={() => lookUp(code)}
          onBack={() => router.back()}
          backIcon="close"
        >
          <CodeField
            value={code}
            onChange={(next) => {
              setCode(next);
              if (next.length < TEAM_CODE_LENGTH) setNotFound(false);
              if (next.length === TEAM_CODE_LENGTH) lookUp(next);
            }}
            length={TEAM_CODE_LENGTH}
            groupSize={2}
            error={notFound}
          />
          {notFound ? (
            <Text style={[type.footnote, { color: colors.live, fontWeight: '500' }]}>
              Wrong code — no club found. Check the digits and try again.
            </Text>
          ) : null}
          <View style={{ alignItems: 'flex-start', marginTop: space.sm }}>
            <TextButton title="Scan QR code instead" onPress={() => setMode('scan')} />
          </View>
        </StepScaffold>
      )}

      {found ? (
        <FoundPanel
          club={found}
          onCancel={() => {
            setFoundId(null);
            setCode('');
          }}
        />
      ) : null}
    </View>
  );
}

function ScanStep({ onCode, onTypeInstead }: { onCode: (code: string) => void; onTypeInstead: () => void }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [invalid, setInvalid] = useState(false);
  const lastPayload = useRef<string | null>(null);
  const done = useRef(false);

  const granted = permission?.granted === true;
  const canAsk = permission?.canAskAgain !== false;

  return (
    <View style={styles.scanRoot}>
      {granted && Platform.OS !== 'web' ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (done.current || data === lastPayload.current) return;
              lastPayload.current = data;
              const code = extractTeamCode(data);
              if (!code) {
                setInvalid(true);
                haptic(Haptics.NotificationFeedbackType.Error);
                return;
              }
              done.current = true;
              onCode(code);
            }}
          />
          <View pointerEvents="none" style={styles.viewfinderWrap}>
            <View style={styles.viewfinder} />
          </View>
        </>
      ) : (
        <View style={styles.permission}>
          <Ionicons name="qr-code-outline" size={56} color={colors.label2} />
          <Text style={[type.title3, { textAlign: 'center' }]}>Scan the club&apos;s QR code</Text>
          <Text style={[type.subhead, { color: colors.label2, textAlign: 'center' }]}>
            {Platform.OS === 'web'
              ? 'Scanning works in the Coopeer app on your phone. Here, type the club code instead.'
              : canAsk
                ? 'Coopeer needs your camera to scan club QR codes. Nothing is recorded.'
                : 'Camera access is off. Turn it on in Settings, or type the club code instead.'}
          </Text>
          {Platform.OS !== 'web' && canAsk ? (
            <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
              <PrimaryButton title="Allow camera" icon="camera-outline" onPress={requestPermission} />
            </View>
          ) : null}
        </View>
      )}

      <View style={[styles.scanHeader, { top: insets.top + space.sm }]}>
        <IconButton icon="close" label="Close" onPress={() => router.back()} />
        <Glass radius={radius.full} style={styles.titlePill}>
          <Text style={type.headline}>Scan QR code</Text>
        </Glass>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.scanFooter, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <ActionBar
          caption={invalid ? "That QR isn't a Coopeer club code." : granted && Platform.OS !== 'web' ? "Point at the club's QR code." : null}
        >
          <SecondaryButton title="Enter code instead" icon="keypad-outline" onPress={onTypeInstead} />
        </ActionBar>
      </View>
    </View>
  );
}

/** Figma "_join/found": the club behind the code, with Join. */
function FoundPanel({ club, onCancel }: { club: Club; onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const session = useSession();
  const isMember = store.isMember(club.id);
  const place = store.place(club.homePlaceId);
  const wasMember = useRef(isMember);

  useEffect(() => {
    if (isMember && !wasMember.current) haptic(Haptics.NotificationFeedbackType.Success);
    wasMember.current = isMember;
  }, [isMember]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} onPress={onCancel} accessibilityLabel="Dismiss" />
      <Glass radius={radius.sheet} style={[styles.panel, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <View style={styles.grabber} />
        <View style={styles.panelBody}>
          <ClubLogo club={club} size={88} />
          <Text style={[type.title2, { textAlign: 'center' }]}>{club.name}</Text>
          <Text style={[type.subhead, { color: colors.label2 }]}>
            {sports[club.sport].label} · {club.cadence}
          </Text>
          <AvatarStack members={club.members} total={club.memberCount} size={30} limit={5} />
          {place ? (
            <View style={styles.placeRow}>
              <Ionicons name="location" size={14} color={colors.label2} />
              <Text style={[type.footnote, { color: colors.label2 }]}>{place.name}</Text>
            </View>
          ) : null}
        </View>
        <ActionBar
          caption={isMember ? "You're in! Its games are now on your schedule." : `${dollars(club.monthlyPrice)}/month · cancel anytime`}
        >
          {isMember ? (
            <PrimaryButton title="Done" icon="checkmark" onPress={() => router.back()} />
          ) : (
            <>
              <SecondaryButton title="Cancel" onPress={onCancel} />
              <PrimaryButton title="Join" onPress={() => session.requireAuth(() => store.join(club.id))} />
            </>
          )}
        </ActionBar>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scanRoot: { flex: 1, backgroundColor: colors.black },
  scanHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  titlePill: { paddingHorizontal: space.lg, paddingVertical: space.sm },
  scanFooter: { position: 'absolute', left: space.md, right: space.md, bottom: 0 },
  viewfinderWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  viewfinder: { width: 250, height: 250, borderRadius: radius.sheet, borderWidth: 4, borderColor: colors.white },
  permission: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
  },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, paddingTop: space.sm, gap: space.lg },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: radius.full, backgroundColor: colors.label3 },
  panelBody: { alignItems: 'center', gap: space.sm, paddingTop: space.md },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});

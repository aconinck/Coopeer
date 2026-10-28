import { useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { colors, flow, radius, space, type } from '../../src/constants/theme';
import { enter } from '../../src/constants/motion';
import { dollars, shareText } from '../../src/lib/format';
import { COOPEER_FEE, inviteUrl, memberPrice, sportIds, sports, type Club, type ClubLink, type SportId } from '../../src/state/models';
import { pitchPlace, useStore } from '../../src/state/store';
import { pitchById } from '../../src/map/pitches';
import { PlaceResults } from '../../src/ui/PlaceResults';
import { HeroButton } from '../../src/ui/Hero';
import { SportTile, StepScaffold, UnderlineField } from '../../src/ui/StepFlow';
import { PlacePickerMap } from '../../src/map/PlacePickerMap';
import { CheckBadge, CodeBoxes, FieldLabel, LightPill, haptics } from '../../src/create/ui';

/** Close the flow; opened from a deep link there is nothing to go back to. */
const leave = () => (router.canGoBack() ? router.back() : router.replace('/map'));

type Step = 'details' | 'photo' | 'sport' | 'place' | 'price' | 'payout';
const fullOrder: Step[] = ['details', 'photo', 'sport', 'place', 'price', 'payout'];
// Started from a field/court on the map: sport and home are already known.
const pitchOrder: Step[] = ['details', 'photo', 'price', 'payout'];

/** Figma "Criando Equipe" + "Pricing": everything a creator needs to open a club. */
export default function CreateClub() {
  const store = useStore();
  const { pitch: pitchParam } = useLocalSearchParams<{ pitch?: string }>();
  const pitch = pitchParam ? pitchById(pitchParam) : undefined;
  const pitchHome = pitch ? pitchPlace(pitch, store.places) : undefined;
  const order = pitch ? pitchOrder : fullOrder;
  const [step, setStep] = useState<Step>('details');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [about, setAbout] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [sport, setSport] = useState<SportId | null>(pitch?.sport ?? null);
  const [placeId, setPlaceId] = useState<string | null>(pitchHome?.id ?? null);
  const [price, setPrice] = useState('');
  const [routing, setRouting] = useState('');
  const [account, setAccount] = useState('');
  const [holder, setHolder] = useState('');
  const [created, setCreated] = useState<Club | null>(null);

  const go = (delta: 1 | -1) => {
    const next = order[order.indexOf(step) + delta];
    if (!next) {
      if (delta === -1) leave();
      return;
    }
    setDirection(delta === 1 ? 'forward' : 'back');
    setStep(next);
  };

  const create = () => {
    const homePlaceId = pitch ? store.placeForPitch(pitch.id)?.id : placeId;
    if (!sport || !homePlaceId) return;
    const links: ClubLink[] = link.trim() ? [{ title: 'Website', url: link.trim().startsWith('http') ? link.trim() : `https://${link.trim()}` }] : [];
    const club = store.createClub({
      name,
      about,
      links,
      sport,
      homePlaceId,
      monthlyPrice: Number(price),
      photoUri,
      payoutLast4: account.slice(-4),
    });
    haptics.success();
    setCreated(club);
  };

  if (created) return <Done club={created} />;

  const common = { progress: (order.indexOf(step) + 1) / order.length, direction, onBack: () => go(-1), backIcon: step === 'details' ? ('close' as const) : ('arrow-back' as const) };

  switch (step) {
    case 'details':
      return (
        <StepScaffold
          {...common}
          title="Club name"
          subtitle={pitchHome && pitch ? `${sports[pitch.sport].label} · plays at ${pitchHome.name}` : undefined}
          canContinue={name.trim().length >= 2}
          onNext={() => go(1)}
        >
          <View style={styles.fields}>
            <View style={styles.field}>
              <FieldLabel>Club name</FieldLabel>
              <UnderlineField placeholder="Friday Night Soccer" value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="next" />
            </View>
            <View style={styles.field}>
              <FieldLabel>Link (optional)</FieldLabel>
              <UnderlineField
                autoFocus={false}
                placeholder="chat.whatsapp.com/…"
                value={link}
                onChangeText={setLink}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
            <View style={styles.field}>
              <FieldLabel>Description</FieldLabel>
              <UnderlineField autoFocus={false} placeholder="Who plays, level, vibe" value={about} onChangeText={setAbout} />
            </View>
          </View>
        </StepScaffold>
      );

    case 'photo':
      return (
        <StepScaffold {...common} title="Club photo" canContinue onNext={() => go(1)}>
          <PhotoPicker name={name.trim()} uri={photoUri} onChange={setPhotoUri} />
          {!photoUri && (
            <View style={styles.center}>
              <Pressable accessibilityRole="button" onPress={() => go(1)} hitSlop={10}>
                <Text style={[type.subhead, styles.muted]}>Skip</Text>
              </Pressable>
            </View>
          )}
        </StepScaffold>
      );

    case 'sport':
      return (
        <StepScaffold {...common} title="Sport" subtitle="Soccer, pickleball and trails to start." canContinue={sport !== null} onNext={() => go(1)}>
          <View style={styles.tiles}>
            {sportIds.map((id) => (
              <SportTile
                key={id}
                icon={sports[id].icon}
                color={sports[id].color}
                title={sports[id].label}
                selected={sport === id}
                onPress={() => {
                  setSport(id);
                  setPlaceId(null);
                }}
              />
            ))}
          </View>
        </StepScaffold>
      );

    case 'place':
      return (
        <StepScaffold {...common} title="Where do you play?" subtitle="Your home field or courts. Games default here." canContinue={placeId !== null} onNext={() => go(1)}>
          <PlaceList sport={sport} selectedId={placeId} onSelect={setPlaceId} />
        </StepScaffold>
      );

    case 'price':
      return (
        <StepScaffold {...common} title="Plan price" canContinue={Number(price) >= 1} onNext={() => go(1)}>
          <PriceField value={price} onChange={setPrice} />
        </StepScaffold>
      );

    case 'payout':
      return (
        <StepScaffold
          {...common}
          title="Payout account"
          subtitle="Where member payments are sent each month."
          canContinue={/^\d{9}$/.test(routing) && /^\d{4,17}$/.test(account) && holder.trim().length >= 2}
          onNext={create}
        >
          <View style={styles.fields}>
            <View style={styles.field}>
              <FieldLabel>Routing number</FieldLabel>
              <UnderlineField placeholder="9 digits" value={routing} onChangeText={(t) => setRouting(t.replace(/\D/g, '').slice(0, 9))} keyboardType="number-pad" />
            </View>
            <View style={styles.field}>
              <FieldLabel>Account number</FieldLabel>
              <UnderlineField
                autoFocus={false}
                placeholder="Account number"
                value={account}
                onChangeText={(t) => setAccount(t.replace(/\D/g, '').slice(0, 17))}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.field}>
              <FieldLabel>Account holder</FieldLabel>
              <UnderlineField autoFocus={false} placeholder="Full legal name" value={holder} onChangeText={setHolder} autoCapitalize="words" textContentType="name" />
            </View>
          </View>
        </StepScaffold>
      );
  }
}

/** Figma "Foto do Clube": name over concentric rings, a circle to add (or edit) the image. */
function PhotoPicker({ name, uri, onChange }: { name: string; uri?: string; onChange: (uri: string) => void }) {
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      haptics.selection();
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.photoArea}>
      {[420, 300, 210].map((size) => (
        <View key={size} pointerEvents="none" style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, uri && styles.ringFilled]} />
      ))}
      <Text style={[flow.input, styles.photoName, uri && { color: colors.brand }]} numberOfLines={1}>
        {name || 'Your club'}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={uri ? 'Change image' : 'Add an image'} onPress={pick} style={({ pressed }) => [styles.photoCircle, pressed && { opacity: 0.7 }]}>
        {uri ? (
          <Animated.View entering={FadeIn.duration(260)}>
            <Image source={{ uri }} style={styles.photo} />
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color={colors.label} />
            </View>
          </Animated.View>
        ) : (
          <Ionicons name="add" size={32} color={colors.brand} />
        )}
      </Pressable>
      <Text style={[type.footnote, styles.photoCaption]}>
        {uri ? 'This is how your club appears when people search for it.' : 'Add an image'}
      </Text>
    </View>
  );
}

function PlaceList({ sport, selectedId, onSelect }: { sport: SportId | null; selectedId: string | null; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  return (
    <View style={styles.places}>
      <PlacePickerMap
        sport={sport}
        selectedId={selectedId}
        onSelect={(id) => {
          haptics.selection();
          onSelect(id);
        }}
      />
      <View style={styles.placeSearch}>
        <Ionicons name="search" size={18} color={colors.label2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search a park, field, trail or address"
          placeholderTextColor={colors.label2}
          autoCorrect={false}
          returnKeyType="search"
          style={[type.body, styles.placeSearchInput]}
        />
        {query ? (
          <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.label2} />
          </Pressable>
        ) : null}
      </View>
      <PlaceResults
        query={query}
        sport={sport}
        selectedId={selectedId}
        onSelect={(id) => {
          haptics.selection();
          setQuery('');
          onSelect(id);
        }}
      />
    </View>
  );
}

/** Figma "Valor do Plano": big orange price, monthly, and what members actually pay. */
function PriceField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const amount = Number(value) || 0;
  return (
    <View style={styles.priceArea}>
      <Text style={[type.subhead, styles.muted]}>Price per member</Text>
      <View style={styles.priceRow}>
        <Text style={[flow.title, styles.priceText]}>$</Text>
        <TextInput
          autoFocus
          value={value}
          onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.label3}
          style={[flow.title, styles.priceText, styles.priceInput]}
          accessibilityLabel="Monthly price per member in dollars"
        />
      </View>
      <View style={styles.priceLine} />
      <Text style={[type.subhead, styles.muted]}>Monthly</Text>

      <Text style={[type.subhead, styles.muted, { marginTop: space.xxl }]}>Final price paid per member</Text>
      <View style={styles.finalRow}>
        <Text style={[flow.input, { fontWeight: '700' }]}>{amount ? `$${memberPrice(amount).toFixed(2)}` : '—'}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About the fee"
          hitSlop={10}
          onPress={() =>
            Platform.OS === 'web'
              ? window.alert(`Coopeer adds a ${COOPEER_FEE * 100}% fee on top of your price. You receive ${dollars(amount)} per member.`)
              : Alert.alert('Coopeer fee', `Coopeer adds a ${COOPEER_FEE * 100}% fee on top of your price. You receive ${dollars(amount)} per member.`)
          }
          style={styles.help}
        >
          <Text style={[type.footnote, { fontWeight: '700' }]}>?</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Figma "Tudo Pronto!" (Option 2): check badge, club code boxes, share / go to club. */
function Done({ club }: { club: Club }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const fade = (i: number) => (reduceMotion ? undefined : enter(i));

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(club.code);
    haptics.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <View style={[styles.done, { paddingTop: insets.top + 74, paddingBottom: Math.max(insets.bottom, 34) }]}>
      <StatusBar style="dark" />
      <Animated.View entering={fade(0)}>
        <CheckBadge />
      </Animated.View>
      <Animated.View entering={fade(1)} style={styles.doneText}>
        <Text style={flow.title}>All set!</Text>
        <Text style={[flow.heroBody, styles.muted]}>Invite members, create games and get started.</Text>
      </Animated.View>

      <Animated.View entering={fade(2)} style={styles.codeBlock}>
        <CodeBoxes code={club.code} />
        <View style={styles.codeFooter}>
          <Text style={[flow.heroBody, { fontWeight: '600' }]}>Club code</Text>
          <LightPill compact title={copied ? 'Copied ✓' : 'Copy code'} onPress={copy} />
        </View>
      </Animated.View>

      <View style={styles.flex} />
      <Animated.View entering={fade(3)} style={styles.doneActions}>
        <HeroButton title="Share club" onPress={() => shareText(`Join ${club.name} on Coopeer — code ${club.code}`, inviteUrl(club))} />
        <LightPill title="Go to club" onPress={() => router.replace(`/club/${club.id}`)} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  muted: { color: colors.label2 },
  center: { alignItems: 'center' },
  fields: { gap: 26 },
  field: { gap: space.sm },
  tiles: { flexDirection: 'row', gap: space.sm },
  photoArea: { height: 380, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: colors.brandSoft },
  ringFilled: { backgroundColor: colors.brandSoft, opacity: 0.45 },
  photoName: { position: 'absolute', top: 40, maxWidth: 260, textAlign: 'center' },
  photoCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1.5,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  photo: { width: 116, height: 116, borderRadius: 58 },
  editBadge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  photoCaption: { position: 'absolute', bottom: 24, textAlign: 'center', color: colors.label2, maxWidth: 300 },
  places: { gap: space.sm },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  placeRowSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  placeSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.fill,
    marginBottom: space.xs,
  },
  placeSearchInput: { flex: 1, color: colors.label, paddingVertical: 0, outlineStyle: 'none' } as never,
  priceArea: { alignItems: 'center', gap: space.xs, marginTop: space.lg },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  priceText: { color: colors.brand },
  priceInput: { minWidth: 60, textAlign: 'center', paddingVertical: 0, outlineStyle: 'none' } as never,
  priceLine: { width: 312, maxWidth: '100%', height: 1, backgroundColor: colors.separator },
  finalRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  help: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.fill2, alignItems: 'center', justifyContent: 'center' },
  done: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 27 },
  doneText: { gap: space.sm, marginTop: 18, maxWidth: 305 },
  codeBlock: { marginTop: 65, gap: 18 },
  codeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 337 },
  doneActions: { gap: 13, alignItems: 'center' },
});

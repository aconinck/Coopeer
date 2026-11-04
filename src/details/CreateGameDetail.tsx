import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../constants/theme';
import { monthDay, time, weekday } from '../lib/format';
import { open } from '../lib/nav';
import { ME, sportIds, sports, type Member, type Repeat, type SportId } from '../state/models';
import { pitchPlace, useStore } from '../state/store';
import { pitchById } from '../map/pitches';
import { Avatar } from '../ui/Display';
import { ActionBar, PrimaryButton } from '../ui/Buttons';
import { PlaceResults } from '../ui/PlaceResults';
import { PlacePickerMap } from '../map/PlacePickerMap';
import { ChoiceChip, FieldLabel, OptionRow, OptionSheet, haptics } from '../create/ui';
import { DetailLayout } from '../ui/DetailLayout';

const OPEN = 'open';
const DAY = 24 * 3600 * 1000;
const SLOT = 30;
const slots = Array.from({ length: (23 - 6) * 2 + 1 }, (_, i) => 6 * 60 + i * SLOT);

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const at = (day: Date, minutes: number) => new Date(day.getTime() + minutes * 60_000);
const label = (minutes: number) => time(at(startOfDay(new Date()), minutes));

type Picker = 'date' | 'start' | 'end' | 'place' | 'members' | null;

/** Create a game inside the global bottom sheet (full-height). */
export function CreateGameDetail({
  sport: sportParam,
  pitch: pitchParam,
  club: clubParam,
}: {
  sport?: string;
  pitch?: string;
  club?: string;
}) {
  const store = useStore();
  const pitch = pitchParam ? pitchById(pitchParam) : undefined;
  const pitchPreview = pitch ? pitchPlace(pitch, store.places) : undefined;
  const adminClubs = store.clubs.filter((c) => store.isAdmin(c.id) && (!pitch || c.sport === pitch.sport));
  const initialClub = clubParam && store.isAdmin(clubParam) ? store.club(clubParam) : undefined;

  const [host, setHost] = useState<string>(initialClub?.id ?? OPEN);
  const club = host === OPEN ? undefined : store.club(host);
  const [openSport, setOpenSport] = useState<SportId>(
    pitch?.sport ?? (sportIds.find((id) => id === sportParam) ?? 'soccer'),
  );
  const sport: SportId = pitch?.sport ?? club?.sport ?? openSport;

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [day, setDay] = useState(() => startOfDay(new Date(Date.now() + DAY)));
  const [startMin, setStartMin] = useState(19 * 60);
  const [endMin, setEndMin] = useState(20 * 60 + 30);
  const [repeat, setRepeat] = useState<Repeat>('never');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [placeId, setPlaceId] = useState<string | null>(pitchPreview?.id ?? initialClub?.homePlaceId ?? null);
  const others = useMemo(() => (club?.members ?? []).filter((m) => m.id !== ME.id), [club]);
  const [invited, setInvited] = useState<Set<string>>(() => new Set(others.map((m) => m.id)));
  const [picker, setPicker] = useState<Picker>(null);
  const [focused, setFocused] = useState<'title' | 'details' | null>(null);

  const chooseHost = (id: string) => {
    setHost(id);
    const next = id === OPEN ? undefined : store.club(id);
    setInvited(new Set((next?.members ?? []).filter((m) => m.id !== ME.id).map((m) => m.id)));
    if (!pitch && next) setPlaceId(next.homePlaceId);
  };

  const picked = placeId ? store.place(placeId) : undefined;
  const place = pitchPreview ?? (picked && picked.sports.includes(sport) ? picked : undefined);
  const start = at(day, startMin);
  const end = at(day, endMin);
  const valid = title.trim().length >= 2 && !!place && endMin > startMin && start.getTime() > Date.now();
  const allInvited = invited.size === others.length;

  const create = () => {
    if (!valid || !place) return;
    const finalPlace = pitch ? (store.placeForPitch(pitch.id) ?? place) : place;
    const game = store.createGame({
      clubId: club?.id ?? null,
      sport,
      title,
      details,
      start,
      end,
      placeId: finalPlace.id,
      repeat,
      customDays: repeat === 'custom' ? customDays : undefined,
      inviteeIds: allInvited ? null : [...invited],
    });
    haptics.success();
    open.game(game.id);
  };

  return (
    <DetailLayout
      title="New game"
      footer={
        <ActionBar>
          <PrimaryButton title="Create" onPress={create} disabled={!valid} />
        </ActionBar>
      }
    >
      <View style={styles.form}>
        {/* Host */}
        <View style={styles.field}>
          <FieldLabel>Who&apos;s it for?</FieldLabel>
          <View style={styles.chips}>
            <ChoiceChip title="Open game" selected={host === OPEN} onPress={() => chooseHost(OPEN)} />
            {adminClubs.map((c) => (
              <ChoiceChip key={c.id} title={c.name} selected={host === c.id} onPress={() => chooseHost(c.id)} />
            ))}
          </View>
          <Text style={[type.footnote, styles.muted]}>
            {club
              ? `${club.name} members are invited automatically.`
              : 'Anyone on Coopeer can see it on the map and join.'}
          </Text>
        </View>

        {/* Sport (only for open games without a pitch) */}
        {!pitch && !club && (
          <View style={styles.field}>
            <FieldLabel>Sport</FieldLabel>
            <View style={styles.chips}>
              {sportIds.map((id) => (
                <ChoiceChip
                  key={id}
                  title={sports[id].label}
                  selected={openSport === id}
                  onPress={() => { haptics.selection(); setOpenSport(id); }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Title */}
        <View style={styles.field}>
          <FieldLabel>Game name</FieldLabel>
          <TextInput
            autoFocus
            value={title}
            onChangeText={setTitle}
            placeholder="Friday Night Soccer"
            placeholderTextColor={colors.label3}
            onFocus={() => setFocused('title')}
            onBlur={() => setFocused(null)}
            style={[type.title3, styles.input]}
          />
          <View style={[styles.underline, focused === 'title' && styles.underlineFocused]} />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <FieldLabel>Description</FieldLabel>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder={club ? 'Write something for your members' : 'Level, what to bring, how teams are picked'}
            placeholderTextColor={colors.label3}
            multiline
            onFocus={() => setFocused('details')}
            onBlur={() => setFocused(null)}
            style={[type.body, styles.input, styles.multiline]}
          />
          <View style={[styles.underline, focused === 'details' && styles.underlineFocused]} />
        </View>

        {/* Date/time */}
        <View style={styles.whenRow}>
          <ValueChip text={monthDay(day)} onPress={() => setPicker('date')} label="Date" />
          <View style={styles.flex} />
          <ValueChip text={label(startMin)} onPress={() => setPicker('start')} label="Start time" />
          <Text style={styles.muted}>–</Text>
          <ValueChip text={label(endMin)} onPress={() => setPicker('end')} label="End time" />
        </View>
        <View style={styles.repeatRow}>
          {(
            [
              ['never', 'Never'] as [Repeat, string],
              ['weekly', `Every ${weekday(start)}`] as [Repeat, string],
              ['weekdays', 'Weekdays'] as [Repeat, string],
              ['custom', 'Custom'] as [Repeat, string],
            ] as const
          ).map(([val, t]) => (
            <ChoiceChip
              key={val}
              title={t}
              selected={repeat === val}
              onPress={() => { haptics.selection(); setRepeat(val); }}
            />
          ))}
        </View>
        {repeat === 'custom' && (
          <View style={styles.dayRow}>
            {(['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const).map((letter, index) => {
              const active = customDays.includes(index);
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    haptics.selection();
                    setCustomDays(active ? customDays.filter((d) => d !== index) : [...customDays, index]);
                  }}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{letter}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Location */}
        <View style={styles.divider} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !!pitch }}
          disabled={!!pitch}
          onPress={() => setPicker('place')}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Ionicons name="location-outline" size={20} color={colors.label2} />
          {place ? (
            <View style={styles.flex}>
              <Text style={type.headline}>{place.name}</Text>
              <Text style={[type.footnote, styles.muted, styles.underlineText]}>{place.address}</Text>
            </View>
          ) : (
            <Text style={[type.body, styles.flex, styles.placeholder]}>Location</Text>
          )}
          <Ionicons name={pitch ? 'lock-closed' : 'pencil'} size={16} color={colors.label2} />
        </Pressable>

        {/* Members (club games only) */}
        {club && <View style={styles.divider} />}
        {club && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setPicker('members')}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Ionicons name="people-outline" size={20} color={colors.label2} />
            <Text style={[type.body, styles.flex, invited.size === 0 && others.length > 0 && styles.placeholder]}>
              {others.length === 0
                ? 'Just you for now — share the club code to invite people'
                : allInvited
                  ? 'All members'
                  : invited.size === 0
                    ? 'No members invited'
                    : `${invited.size} members invited`}
            </Text>
            <Ionicons name="pencil" size={16} color={colors.label2} />
          </Pressable>
        )}
      </View>

      {/* Sub-pickers (Modals — render outside layout hierarchy) */}
      <OptionSheet visible={picker === 'date'} onClose={() => setPicker(null)} header={<SheetTitle>Date</SheetTitle>}>
        {Array.from({ length: 21 }, (_, i) => startOfDay(new Date(Date.now() + i * DAY))).map((d, i) => (
          <OptionRow
            key={d.toISOString()}
            title={monthDay(d)}
            detail={i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : undefined}
            selected={d.getTime() === day.getTime()}
            onPress={() => { haptics.selection(); setDay(d); setPicker(null); }}
          />
        ))}
      </OptionSheet>

      <OptionSheet
        visible={picker === 'start' || picker === 'end'}
        onClose={() => setPicker(null)}
        header={<SheetTitle>{picker === 'end' ? 'Ends' : 'Starts'}</SheetTitle>}
      >
        {slots
          .filter((m) => picker !== 'end' || m > startMin)
          .map((m) => (
            <OptionRow
              key={m}
              title={label(m)}
              selected={(picker === 'end' ? endMin : startMin) === m}
              onPress={() => {
                haptics.selection();
                if (picker === 'end') {
                  setEndMin(m);
                } else {
                  const length = endMin - startMin;
                  setStartMin(m);
                  setEndMin(Math.min(m + Math.max(length, SLOT), 23 * 60 + 30));
                }
                setPicker(null);
              }}
            />
          ))}
      </OptionSheet>

      <PlaceSheet
        visible={picker === 'place'}
        sport={sport}
        selectedId={placeId}
        onClose={() => setPicker(null)}
        onSelect={(id) => setPlaceId(id)}
      />

      <MembersSheet
        visible={picker === 'members'}
        members={others}
        invited={invited}
        onChange={setInvited}
        onClose={() => setPicker(null)}
      />
    </DetailLayout>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ValueChip({ text, onPress, label: a11y }: { text: string; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${a11y}: ${text}`}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Text style={[type.subhead, { fontWeight: '500', fontVariant: ['tabular-nums'] }]}>{text}</Text>
    </Pressable>
  );
}

function SheetTitle({ children }: { children: string }) {
  return <Text style={[type.headline, styles.sheetTitle]}>{children}</Text>;
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={16} color={colors.label2} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.label3}
        style={[type.body, styles.searchInput]}
        autoCorrect={false}
      />
    </View>
  );
}

function PlaceSheet({
  visible, sport, selectedId, onClose, onSelect,
}: {
  visible: boolean;
  sport: SportId;
  selectedId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  return (
    <OptionSheet
      visible={visible}
      onClose={onClose}
      header={<SearchField value={query} onChange={setQuery} placeholder="Search a park, field, trail or address" />}
    >
      <PlacePickerMap
        style={styles.pickerMap}
        sport={sport}
        selectedId={selectedId}
        onSelect={(id) => { haptics.selection(); onSelect(id); onClose(); }}
      />
      <PlaceResults
        query={query}
        sport={sport}
        selectedId={selectedId}
        onSelect={(id) => { haptics.selection(); setQuery(''); onSelect(id); onClose(); }}
      />
    </OptionSheet>
  );
}

function MembersSheet({
  visible, members, invited, onChange, onClose,
}: {
  visible: boolean;
  members: Member[];
  invited: Set<string>;
  onChange: (next: Set<string>) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = members.filter((m) => !q || m.name.toLowerCase().includes(q));
  const all = invited.size === members.length;
  const toggle = (id: string) => {
    haptics.selection();
    const next = new Set(invited);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };
  return (
    <OptionSheet
      visible={visible}
      onClose={onClose}
      header={
        <View style={styles.membersHeader}>
          <SearchField value={query} onChange={setQuery} placeholder="Search members" />
          <View style={styles.membersBar}>
            <Text style={[type.subhead, { fontWeight: '600' }]}>Club members</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => { haptics.selection(); onChange(all ? new Set() : new Set(members.map((m) => m.id))); }}
              style={({ pressed }) => [styles.smallPill, pressed && styles.pressed]}
            >
              <Text style={[type.footnote, { fontWeight: '600' }]}>{all ? 'Remove all' : 'Invite all'}</Text>
            </Pressable>
          </View>
        </View>
      }
      footer={<PrimaryButton title="Done" onPress={onClose} />}
    >
      {shown.map((m) => {
        const isIn = invited.has(m.id);
        return (
          <OptionRow
            key={m.id}
            title={m.name}
            leading={<Avatar member={m} size={32} />}
            trailing={
              isIn ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.brand} />
              ) : (
                <Ionicons name="add-circle-outline" size={22} color={colors.label3} />
              )
            }
            onPress={() => toggle(m.id)}
          />
        );
      })}
    </OptionSheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  flex: { flex: 1 },
  muted: { color: colors.label2 },
  placeholder: { color: colors.label3 },
  pressed: { opacity: 0.6 },
  field: { gap: space.sm },
  input: { color: colors.label, paddingVertical: 0, outlineStyle: 'none' } as never,
  multiline: { minHeight: 44, textAlignVertical: 'top' },
  underline: { height: 1, backgroundColor: colors.separator },
  underlineFocused: { height: 2, backgroundColor: colors.brand },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  whenRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  chip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 10, borderWidth: 1, borderColor: colors.separator },
  repeatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  dayRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dayChip: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.fill, borderWidth: 1, borderColor: colors.separator },
  dayChipActive: { backgroundColor: colors.label, borderColor: colors.label },
  dayChipText: { fontSize: 13, fontWeight: '600', color: colors.label2 },
  dayChipTextActive: { color: colors.white },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
  underlineText: { textDecorationLine: 'underline' },
  pickerMap: { marginBottom: space.md },
  sheetTitle: { paddingHorizontal: space.xl, paddingBottom: space.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 40,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.fill,
  },
  searchInput: { flex: 1, color: colors.label, paddingVertical: 0, outlineStyle: 'none' } as never,
  membersHeader: { gap: space.sm },
  membersBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg },
  smallPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.fill },
});

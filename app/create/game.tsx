import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../../src/constants/theme';
import { monthDay, time, weekday } from '../../src/lib/format';
import { open } from '../../src/lib/nav';
import { ME, type Member, type Repeat, type SportId } from '../../src/state/models';
import { useStore } from '../../src/state/store';
import { Avatar } from '../../src/ui/Display';
import { HeroButton } from '../../src/ui/Hero';
import { FieldLabel, OptionRow, OptionSheet, haptics } from '../../src/create/ui';

type Picker = 'date' | 'start' | 'end' | 'repeat' | 'place' | 'members' | null;

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

/** Figma "Criando Partida" (Evento): an admin schedules a game for their club. */
export default function CreateGame() {
  const { club: clubId } = useLocalSearchParams<{ club: string }>();
  const store = useStore();
  const insets = useSafeAreaInsets();
  const club = clubId ? store.club(clubId) : undefined;

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [day, setDay] = useState(() => startOfDay(new Date(Date.now() + DAY)));
  const [startMin, setStartMin] = useState(19 * 60);
  const [endMin, setEndMin] = useState(20 * 60 + 30);
  const [repeat, setRepeat] = useState<Repeat>('never');
  const [placeId, setPlaceId] = useState(club?.homePlaceId ?? null);
  const others = useMemo(() => (club?.members ?? []).filter((m) => m.id !== ME.id), [club]);
  const [invited, setInvited] = useState<Set<string>>(() => new Set(others.map((m) => m.id)));
  const [picker, setPicker] = useState<Picker>(null);
  const [focused, setFocused] = useState<'title' | 'details' | null>(null);

  if (!club) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + space.lg }]}>
        <Text style={[type.body, styles.muted]}>This club couldn&apos;t be found.</Text>
      </View>
    );
  }

  const place = placeId ? store.place(placeId) : undefined;
  const start = at(day, startMin);
  const end = at(day, endMin);
  const valid = title.trim().length >= 2 && !!place && endMin > startMin && start.getTime() > Date.now();
  const allInvited = invited.size === others.length;
  const repeatLabel = repeat === 'never' ? 'Repeat' : repeat === 'weekly' ? `Every ${weekday(start)}` : 'Every weekday';

  const create = () => {
    if (!valid || !place) return;
    const game = store.createGame({
      clubId: club.id,
      title,
      details,
      start,
      end,
      placeId: place.id,
      repeat,
      inviteeIds: allInvited ? null : [...invited],
    });
    haptics.success();
    router.back();
    open.game(game.id);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.md }]}>
      <View style={styles.header}>
        <Text style={type.headline} accessibilityRole="header">
          New game
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={colors.label} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={[type.footnote, styles.muted]}>{club.name}</Text>

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

        <View style={styles.field}>
          <FieldLabel>Description</FieldLabel>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Write something for your members"
            placeholderTextColor={colors.label3}
            multiline
            onFocus={() => setFocused('details')}
            onBlur={() => setFocused(null)}
            style={[type.body, styles.input, styles.multiline]}
          />
          <View style={[styles.underline, focused === 'details' && styles.underlineFocused]} />
        </View>

        <View style={styles.whenRow}>
          <ValueChip text={monthDay(day)} onPress={() => setPicker('date')} label="Date" />
          <View style={styles.flex} />
          <ValueChip text={label(startMin)} onPress={() => setPicker('start')} label="Start time" />
          <Text style={styles.muted}>–</Text>
          <ValueChip text={label(endMin)} onPress={() => setPicker('end')} label="End time" />
        </View>
        <Pressable accessibilityRole="button" onPress={() => setPicker('repeat')} style={({ pressed }) => [styles.repeat, pressed && styles.pressed]}>
          <Text style={[type.subhead, { fontWeight: '600' }]}>{repeatLabel}</Text>
        </Pressable>

        <View style={styles.divider} />
        <Pressable accessibilityRole="button" onPress={() => setPicker('place')} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <Ionicons name="location-outline" size={20} color={colors.label2} />
          {place ? (
            <View style={styles.flex}>
              <Text style={type.headline}>{place.name}</Text>
              <Text style={[type.footnote, styles.muted, styles.underlineText]}>{place.address}</Text>
            </View>
          ) : (
            <Text style={[type.body, styles.flex, styles.placeholder]}>Location</Text>
          )}
          <Ionicons name="pencil" size={16} color={colors.label2} />
        </Pressable>

        <View style={styles.divider} />
        <Pressable accessibilityRole="button" onPress={() => setPicker('members')} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
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
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <HeroButton title="Create" onPress={create} disabled={!valid} />
      </View>

      <OptionSheet visible={picker === 'date'} onClose={() => setPicker(null)} header={<SheetTitle>Date</SheetTitle>}>
        {Array.from({ length: 21 }, (_, i) => startOfDay(new Date(Date.now() + i * DAY))).map((d, i) => (
          <OptionRow
            key={d.toISOString()}
            title={monthDay(d)}
            detail={i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : undefined}
            selected={d.getTime() === day.getTime()}
            onPress={() => {
              haptics.selection();
              setDay(d);
              setPicker(null);
            }}
          />
        ))}
      </OptionSheet>

      <OptionSheet visible={picker === 'start' || picker === 'end'} onClose={() => setPicker(null)} header={<SheetTitle>{picker === 'end' ? 'Ends' : 'Starts'}</SheetTitle>}>
        {slots
          .filter((m) => picker !== 'end' || m > startMin)
          .map((m) => (
            <OptionRow
              key={m}
              title={label(m)}
              selected={(picker === 'end' ? endMin : startMin) === m}
              onPress={() => {
                haptics.selection();
                if (picker === 'end') setEndMin(m);
                else {
                  const length = endMin - startMin;
                  setStartMin(m);
                  setEndMin(Math.min(m + Math.max(length, SLOT), 23 * 60 + 30));
                }
                setPicker(null);
              }}
            />
          ))}
      </OptionSheet>

      <RepeatSheet visible={picker === 'repeat'} value={repeat} start={start} onClose={() => setPicker(null)} onApply={setRepeat} />

      <PlaceSheet visible={picker === 'place'} sport={club.sport} selectedId={placeId} onClose={() => setPicker(null)} onSelect={(id) => setPlaceId(id)} />

      <MembersSheet visible={picker === 'members'} members={others} invited={invited} onChange={setInvited} onClose={() => setPicker(null)} />
    </View>
  );
}

function ValueChip({ text, onPress, label: a11y }: { text: string; onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${a11y}: ${text}`} onPress={onPress} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
      <Text style={[type.subhead, { fontWeight: '500', fontVariant: ['tabular-nums'] }]}>{text}</Text>
    </Pressable>
  );
}

function SheetTitle({ children }: { children: string }) {
  return <Text style={[type.headline, styles.sheetTitle]}>{children}</Text>;
}

/** Figma "Repetir": pick, then Apply. */
function RepeatSheet({ visible, value, start, onClose, onApply }: { visible: boolean; value: Repeat; start: Date; onClose: () => void; onApply: (r: Repeat) => void }) {
  const [draft, setDraft] = useState<Repeat>(value);
  const options: [Repeat, string][] = [
    ['never', 'Never'],
    ['weekly', `Every ${weekday(start)}`],
    ['weekdays', 'Every weekday (Mon–Fri)'],
  ];
  return (
    <OptionSheet
      visible={visible}
      onClose={onClose}
      header={<SheetTitle>Repeat</SheetTitle>}
      footer={
        <HeroButton
          title="Apply"
          onPress={() => {
            onApply(draft);
            onClose();
          }}
        />
      }
    >
      {options.map(([id, title]) => (
        <OptionRow
          key={id}
          title={title}
          selected={draft === id}
          onPress={() => {
            haptics.selection();
            setDraft(id);
          }}
        />
      ))}
    </OptionSheet>
  );
}

/** Figma "Adicionando endereço": search the places Coopeer knows. */
function PlaceSheet({
  visible,
  sport,
  selectedId,
  onClose,
  onSelect,
}: {
  visible: boolean;
  sport: SportId;
  selectedId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const store = useStore();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const places = store.places.filter((p) => p.sports.includes(sport) && (!q || `${p.name} ${p.address}`.toLowerCase().includes(q)));
  return (
    <OptionSheet visible={visible} onClose={onClose} header={<SearchField value={query} onChange={setQuery} placeholder="Search places" />}>
      {places.map((p) => (
        <OptionRow
          key={p.id}
          title={p.name}
          detail={p.address}
          selected={p.id === selectedId}
          onPress={() => {
            haptics.selection();
            onSelect(p.id);
            onClose();
          }}
        />
      ))}
      {places.length === 0 && <Text style={[type.subhead, styles.muted, styles.emptyText]}>No places match “{query}”.</Text>}
    </OptionSheet>
  );
}

/** Figma "Removendo/Adicionando usuários": everyone is invited by default; remove or invite one by one. */
function MembersSheet({
  visible,
  members,
  invited,
  onChange,
  onClose,
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
              onPress={() => {
                haptics.selection();
                onChange(all ? new Set() : new Set(members.map((m) => m.id)));
              }}
              style={({ pressed }) => [styles.smallPill, pressed && styles.pressed]}
            >
              <Text style={[type.footnote, { fontWeight: '600' }]}>{all ? 'Remove all' : 'Invite all'}</Text>
            </Pressable>
          </View>
        </View>
      }
      footer={<HeroButton title="Done" onPress={onClose} />}
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
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${m.name}`} hitSlop={8} onPress={() => toggle(m.id)}>
                  <Ionicons name="close-circle" size={24} color={colors.brand} />
                </Pressable>
              ) : (
                <Pressable accessibilityRole="button" accessibilityLabel={`Invite ${m.name}`} onPress={() => toggle(m.id)} style={({ pressed }) => [styles.smallPill, pressed && styles.pressed]}>
                  <Text style={[type.footnote, { fontWeight: '600' }]}>Invite</Text>
                </Pressable>
              )
            }
          />
        );
      })}
    </OptionSheet>
  );
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  muted: { color: colors.label2 },
  placeholder: { color: colors.label3 },
  pressed: { opacity: 0.6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, height: 44 },
  body: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.lg },
  field: { gap: space.sm },
  input: { color: colors.label, paddingVertical: 0, outlineStyle: 'none' } as never,
  multiline: { minHeight: 44, textAlignVertical: 'top' },
  underline: { height: 1, backgroundColor: colors.separator },
  underlineFocused: { height: 2, backgroundColor: colors.brand },
  whenRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  chip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 10, borderWidth: 1, borderColor: colors.separator },
  repeat: { height: 36, borderRadius: radius.tile, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
  underlineText: { textDecorationLine: 'underline' },
  footer: { paddingHorizontal: space.lg, paddingTop: space.sm, alignItems: 'center' },
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
  membersBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl },
  smallPill: { paddingHorizontal: space.md, height: 28, borderRadius: radius.full, backgroundColor: colors.fill2, alignItems: 'center', justifyContent: 'center' },
  emptyText: { padding: space.lg, textAlign: 'center' },
});


import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ListRenderItemInfo, useWindowDimensions } from 'react-native';
import { FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, shadow, space, type } from '../../src/constants/theme';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { open } from '../../src/lib/nav';
import { useCurrentLocation } from '../../src/lib/useLocation';
import { sports, sportIds, type Club, type SportId } from '../../src/state/models';
import { ProfileButton } from '../../src/ui/ProfileButton';
import { ClubCard, ClubRow } from '../../src/ui/Rows';
import { Screen } from '../../src/ui/Screen';
import { Rail, Section } from '../../src/ui/Layout';

const createClub = () => router.push('/create/club');
const joinScan = () => router.push('/join?mode=scan');

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type SortKey = 'nearby' | 'members' | 'games';

function SportChip({ id, active, onPress }: { id: SportId | null; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sportChip, active && styles.sportChipActive, pressed && { opacity: 0.75 }]}
    >
      {id ? (
        <MaterialCommunityIcons
          name={sports[id].icon}
          size={14}
          color={active ? colors.white : colors.label2}
        />
      ) : (
        <Ionicons name="apps" size={14} color={active ? colors.white : colors.label2} />
      )}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {id ? sports[id].label : 'All'}
      </Text>
    </Pressable>
  );
}

/** Bottom sheet listing all clubs with sport filter + sort. */
function ExploreSheet({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const { coords } = useCurrentLocation();
  const session = useSession();
  const [sportFilter, setSportFilter] = useState<SportId | null>(null);
  const [sort, setSort] = useState<SortKey>('nearby');

  const sorted = useMemo(() => {
    let list = sportFilter ? store.clubs.filter((c) => c.sport === sportFilter) : [...store.clubs];

    if (sort === 'nearby' && coords) {
      list = list.sort((a, b) => {
        const pa = store.place(a.homePlaceId);
        const pb = store.place(b.homePlaceId);
        const da = pa ? haversine(coords.latitude, coords.longitude, pa.latitude, pa.longitude) : 999;
        const db = pb ? haversine(coords.latitude, coords.longitude, pb.latitude, pb.longitude) : 999;
        return da - db;
      });
    } else if (sort === 'members') {
      list = list.sort((a, b) => b.memberCount - a.memberCount);
    } else if (sort === 'games') {
      list = list.sort((a, b) => store.gamesFor(b.id).length - store.gamesFor(a.id).length);
    }

    // Verified clubs float to top within any sort
    return list.sort((a, b) => Number(!!b.verified) - Number(!!a.verified));
  }, [store, sportFilter, sort, coords]);

  const renderItem = ({ item }: ListRenderItemInfo<Club>) => (
    <ClubRow
      club={item}
      onPress={() => {
        onClose();
        open.club(item.id);
      }}
    />
  );

  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={type.title3}>All clubs</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.label2} />
          </Pressable>
        </View>

        {/* Sort pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(['nearby', 'members', 'games'] as SortKey[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => setSort(key)}
              style={[styles.sortChip, sort === key && styles.chipActive]}
            >
              <Text style={[styles.chipText, sort === key && styles.chipTextActive]}>
                {key === 'nearby' ? 'Nearby' : key === 'members' ? 'Most members' : 'Most active'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Sport filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <SportChip id={null} active={sportFilter === null} onPress={() => setSportFilter(null)} />
          {sportIds.map((id) => (
            <SportChip
              key={id}
              id={id}
              active={sportFilter === id}
              onPress={() => setSportFilter(sportFilter === id ? null : id)}
            />
          ))}
        </ScrollView>

        {sorted.length === 0 ? (
          <View style={styles.sheetEmpty}>
            <Text style={[type.subhead, { color: colors.label2 }]}>No clubs match this filter.</Text>
          </View>
        ) : (
          <FlatList
            data={sorted}
            keyExtractor={(c) => c.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {session.isSignedIn && (
          <Pressable onPress={() => { onClose(); createClub(); }} style={styles.createBtn}>
            <Ionicons name="add-circle-outline" size={18} color={colors.brand} />
            <Text style={[type.subhead, { color: colors.brand, fontWeight: '600' }]}>Start your own club</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function ClubsScreen() {
  const store = useStore();
  const session = useSession();
  const { coords } = useCurrentLocation();
  const { width } = useWindowDimensions();
  const [sportFilter, setSportFilter] = useState<SportId | null>(null);
  const [showExplore, setShowExplore] = useState(false);

  const myClubs = session.isSignedIn ? store.myClubs : [];
  const myClubsFiltered = sportFilter ? myClubs.filter((c) => c.sport === sportFilter) : myClubs;

  const nearbyClubs = useMemo(() => {
    let list = store.clubs.filter((c) => !store.isMember(c.id));
    if (sportFilter) list = list.filter((c) => c.sport === sportFilter);
    if (coords) {
      list = [...list].sort((a, b) => {
        const pa = store.place(a.homePlaceId);
        const pb = store.place(b.homePlaceId);
        const da = pa ? haversine(coords.latitude, coords.longitude, pa.latitude, pa.longitude) : 999;
        const db = pb ? haversine(coords.latitude, coords.longitude, pb.latitude, pb.longitude) : 999;
        return da - db;
      });
    }
    return list;
  }, [store, sportFilter, coords]);

  const rows: (typeof myClubsFiltered)[] = [];
  for (let i = 0; i < myClubsFiltered.length; i += 2) rows.push(myClubsFiltered.slice(i, i + 2));

  const clubW = Math.min(Math.round(width * 0.42), 172);

  return (
    <Screen
      variant="tab"
      title="Your Clubs"
      trailing={<ProfileButton />}
    >
      {/* Sport filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterRow, styles.filterBarContent]}
        style={styles.filterBar}
      >
        <SportChip id={null} active={sportFilter === null} onPress={() => setSportFilter(null)} />
        {sportIds.map((id) => (
          <SportChip
            key={id}
            id={id}
            active={sportFilter === id}
            onPress={() => setSportFilter(sportFilter === id ? null : id)}
          />
        ))}
      </ScrollView>

      {/* Your clubs */}
      {myClubsFiltered.length > 0 ? (
        <Section
          first
          title="Your clubs"
          caption={`${myClubsFiltered.length} ${myClubsFiltered.length === 1 ? 'club' : 'clubs'} · games land in your schedule`}
        >
          {rows.map((row, rowIndex) => (
            <View key={row.map((c) => c.id).join('-')} style={styles.gridRow}>
              {row.map((club, col) => (
                <ClubCard
                  key={club.id}
                  index={rowIndex * 2 + col}
                  club={club}
                  onPress={() => open.clubPage(club.id)}
                />
              ))}
              {row.length === 1 && <View style={styles.flex} />}
            </View>
          ))}
        </Section>
      ) : myClubs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people" size={44} color={colors.label3} />
          <Text style={type.title2}>No clubs yet</Text>
          <Text style={[type.subhead, styles.emptyText]}>
            Join a club and their games will show up in your schedule.
          </Text>
          <Pressable
            onPress={joinScan}
            style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="qr-code-outline" size={18} color={colors.label} />
            <Text style={[type.subhead, { fontWeight: '600' }]}>Join via code or QR</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Clubs near you — horizontal rail */}
      {nearbyClubs.length > 0 && (
        <Section
          title="Clubs near you"
          caption="Groups that play every week."
        >
          <Rail snap={clubW}>
            {nearbyClubs.slice(0, 10).map((club, i) => (
              <ClubCard
                key={club.id}
                club={club}
                index={i}
                width={clubW}
                onPress={() => open.club(club.id)}
              />
            ))}
          </Rail>
          <Pressable
            onPress={() => setShowExplore(true)}
            style={({ pressed }) => [styles.exploreMoreBtn, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="compass-outline" size={16} color={colors.brand} />
            <Text style={[type.subhead, { color: colors.brand, fontWeight: '600' }]}>
              Explore more{store.clubs.length > 10 ? ` · ${store.clubs.length} clubs total` : ''}
            </Text>
            <Ionicons name="chevron-forward" size={15} color={colors.brand} />
          </Pressable>
        </Section>
      )}

      {showExplore && <ExploreSheet onClose={() => setShowExplore(false)} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gridRow: { flexDirection: 'row', gap: space.md },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  emptyText: { color: colors.label2, textAlign: 'center', paddingHorizontal: space.lg },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
    paddingVertical: 14,
    paddingHorizontal: space.xl,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.separator,
  },
  // ─── Sport filter chips ──────────────────────────────────────────────────────
  filterBar: { marginBottom: space.sm },
  filterBarContent: { gap: space.sm },
  filterRow: {
    flexDirection: 'row',
    gap: space.sm,
    paddingBottom: space.sm,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  sportChipActive: {
    backgroundColor: colors.label,
    borderColor: colors.label,
  },
  chipText: {
    ...type.footnote,
    color: colors.label2,
    fontWeight: '500',
  },
  chipTextActive: { color: colors.white },
  // ─── Explore more button ─────────────────────────────────────────────────────
  exploreMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: 2,
  },
  // ─── Explore sheet ──────────────────────────────────────────────────────────
  sheetOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 200,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: space.sm,
    maxHeight: '90%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
    marginBottom: space.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  sortChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  chipActive: {
    backgroundColor: colors.label,
    borderColor: colors.label,
  },
  sheetList: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: 2 },
  sheetEmpty: { padding: space.xl, alignItems: 'center' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
});

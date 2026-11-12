import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ListRenderItemInfo } from 'react-native';
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
const joinCode = () => router.push('/join?mode=code');
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

/** Bottom sheet listing all non-member clubs with sport filter + sort. */
function ExploreSheet({
  clubs,
  onClose,
}: {
  clubs: Club[];
  onClose: () => void;
}) {
  const store = useStore();
  const { coords } = useCurrentLocation();
  const session = useSession();
  const [sportFilter, setSportFilter] = useState<SportId | null>(null);
  const [sort, setSort] = useState<SortKey>('nearby');

  const sorted = useMemo(() => {
    let list = sportFilter ? clubs.filter((c) => c.sport === sportFilter) : clubs;

    if (sort === 'nearby' && coords) {
      list = [...list].sort((a, b) => {
        const pa = store.place(a.homePlaceId);
        const pb = store.place(b.homePlaceId);
        const da = pa ? haversine(coords.latitude, coords.longitude, pa.latitude, pa.longitude) : 999;
        const db = pb ? haversine(coords.latitude, coords.longitude, pb.latitude, pb.longitude) : 999;
        return da - db;
      });
    } else if (sort === 'members') {
      list = [...list].sort((a, b) => b.memberCount - a.memberCount);
    } else if (sort === 'games') {
      list = [...list].sort((a, b) => store.gamesFor(b.id).length - store.gamesFor(a.id).length);
    }

    // Verified clubs always float to top within any sort
    return list.sort((a, b) => Number(!!b.verified) - Number(!!a.verified));
  }, [clubs, sportFilter, sort, coords, store]);

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
        {/* Handle */}
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <Text style={type.title3}>Explore clubs</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.label2} />
          </Pressable>
        </View>

        {/* Sort pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(['nearby', 'members', 'games'] as SortKey[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => setSort(key)}
              style={[styles.chip, sort === key && styles.chipActive]}
            >
              <Text style={[styles.chipText, sort === key && styles.chipTextActive]}>
                {key === 'nearby' ? 'Nearby' : key === 'members' ? 'Most members' : 'Most active'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Sport filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            onPress={() => setSportFilter(null)}
            style={[styles.sportChip, sportFilter === null && styles.chipActive]}
          >
            <Text style={[styles.chipText, sportFilter === null && styles.chipTextActive]}>All</Text>
          </Pressable>
          {sportIds.map((id) => (
            <Pressable
              key={id}
              onPress={() => setSportFilter(sportFilter === id ? null : id)}
              style={[styles.sportChip, sportFilter === id && styles.chipActive]}
            >
              <MaterialCommunityIcons
                name={sports[id].icon}
                size={15}
                color={sportFilter === id ? colors.white : colors.label2}
              />
              <Text style={[styles.chipText, sportFilter === id && styles.chipTextActive]}>
                {sports[id].label}
              </Text>
            </Pressable>
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

/** Figma "Seus Clubes": the clubs you belong to. "+" creates one. */
export default function ClubsScreen() {
  const store = useStore();
  const session = useSession();
  const clubs = session.isSignedIn ? store.myClubs : [];
  const [showExplore, setShowExplore] = useState(false);

  const nonMember = store.clubs.filter((c) => !store.isMember(c.id));

  const rows: (typeof clubs)[] = [];
  for (let i = 0; i < clubs.length; i += 2) rows.push(clubs.slice(i, i + 2));

  return (
    <Screen
      variant="tab"
      title="Your Clubs"
      trailing={
        <ProfileButton />
      }
    >
      {clubs.length > 0 ? (
        <Section
          first
          title="Your clubs"
          caption={`${clubs.length} ${clubs.length === 1 ? 'club' : 'clubs'} · games land in your schedule`}
        >
          {rows.map((row, rowIndex) => (
            <View key={row.map((c) => c.id).join('-')} style={styles.gridRow}>
              {row.map((club, col) => (
                <ClubCard key={club.id} index={rowIndex * 2 + col} club={club} onPress={() => open.clubPage(club.id)} />
              ))}
              {row.length === 1 && <View style={styles.flex} />}
            </View>
          ))}
        </Section>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="people" size={44} color={colors.label3} />
          <Text style={type.title2}>No clubs yet</Text>
          <Text style={[type.subhead, styles.emptyText]}>
            Join a club and their games will show up in your schedule.
          </Text>
          <Pressable
            onPress={() => { void (async () => { await joinScan(); })(); }}
            style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="qr-code-outline" size={18} color={colors.label} />
            <Text style={[type.subhead, { fontWeight: '600' }]}>Join via code or QR</Text>
          </Pressable>
        </View>
      )}

      {/* Explore clubs CTA — always visible at the bottom */}
      <Pressable
        onPress={() => setShowExplore(true)}
        style={({ pressed }) => [styles.exploreCard, pressed && { opacity: 0.82 }]}
      >
        <View style={styles.exploreIcon}>
          <Ionicons name="compass-outline" size={24} color={colors.brand} />
        </View>
        <View style={styles.exploreText}>
          <Text style={[type.headline, { color: colors.label }]}>Explore clubs</Text>
          <Text style={[type.footnote, { color: colors.label2 }]}>
            {nonMember.length > 0
              ? `${nonMember.length} club${nonMember.length === 1 ? '' : 's'} near Bentonville`
              : 'Find groups that play every week'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.label3} />
      </Pressable>

      {showExplore && (
        <ExploreSheet clubs={nonMember} onClose={() => setShowExplore(false)} />
      )}
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
  exploreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: 20,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  exploreIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreText: { flex: 1, gap: 2 },
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
  filterRow: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  chip: {
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
  chipText: {
    ...type.footnote,
    color: colors.label2,
    fontWeight: '500',
  },
  chipTextActive: { color: colors.white },
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

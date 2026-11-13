import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, type ListRenderItemInfo, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../../src/constants/theme';
import { spring, timing } from '../../src/constants/motion';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { open } from '../../src/lib/nav';
import { useCurrentLocation } from '../../src/lib/useLocation';
import { sports, sportIds, type Club, type SportId } from '../../src/state/models';
import { ClubCard, ClubRow } from '../../src/ui/Rows';
import { Screen, MoreMenu } from '../../src/ui/Screen';
import { Rail, Section } from '../../src/ui/Layout';

const createGame = () => router.push('/create/game');
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

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.75 }]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SportChip({ id, active, onPress }: { id: SportId | null; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.75 }]}
    >
      {id ? (
        <MaterialCommunityIcons name={sports[id].icon} size={14} color={active ? colors.white : colors.label2} />
      ) : (
        <Ionicons name="apps" size={14} color={active ? colors.white : colors.label2} />
      )}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {id ? sports[id].label : 'All'}
      </Text>
    </Pressable>
  );
}

/** Explore all clubs — sport filter + sort, standard modal style. */
function ExploreSheet({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const { coords } = useCurrentLocation();
  const session = useSession();
  const reduceMotion = useReducedMotion();
  const [sportFilter, setSportFilter] = useState<SportId | null>(null);
  const [sort, setSort] = useState<SortKey>('nearby');

  const progress = useSharedValue(0);
  const pending = useRef<(() => void) | null>(null);

  // Animate in on mount
  useEffect(() => {
    progress.value = 0;
    progress.value = reduceMotion ? 1 : withSpring(1, spring.smooth);
  }, []);

  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  const hide = (then?: () => void) => {
    pending.current = then ?? null;
    progress.value = withTiming(0, { duration: 220 }, (finished) => {
      if (!finished) return;
      runOnJS(onClose)();
      runOnJS(runPending)();
    });
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.35 }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 420 }],
  }));

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

    return list.sort((a, b) => Number(!!b.verified) - Number(!!a.verified));
  }, [store, sportFilter, sort, coords]);

  const renderItem = ({ item }: ListRenderItemInfo<Club>) => (
    <ClubRow
      club={item}
      onPress={() => {
        hide(() => open.club(item.id));
      }}
    />
  );

  return (
    <Modal transparent visible animationType="none" onRequestClose={() => hide()} onDismiss={runPending}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.sheetScrim, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => hide()} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={[styles.sheetWrap, sheetStyle]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={type.title3}>All clubs</Text>
          <Pressable onPress={() => hide()} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.label2} />
          </Pressable>
        </View>

        {/* Sort */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(['nearby', 'members', 'games'] as SortKey[]).map((key) => (
            <FilterChip
              key={key}
              label={key === 'nearby' ? 'Nearby' : key === 'members' ? 'Most members' : 'Most active'}
              active={sort === key}
              onPress={() => setSort(key)}
            />
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
          <Pressable onPress={() => hide(createClub)} style={styles.sheetCreateBtn}>
            <Ionicons name="add-circle-outline" size={18} color={colors.brand} />
            <Text style={[type.subhead, { color: colors.brand, fontWeight: '600' }]}>Start your own club</Text>
          </Pressable>
        )}
      </Animated.View>
    </Modal>
  );
}

export default function ClubsScreen() {
  const store = useStore();
  const session = useSession();
  const { coords } = useCurrentLocation();
  const { width } = useWindowDimensions();
  const [showExplore, setShowExplore] = useState(false);

  const myClubs = session.isSignedIn ? store.myClubs : [];

  const nearbyClubs = useMemo(() => {
    let list = store.clubs.filter((c) => !store.isMember(c.id));
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
  }, [store, coords]);

  const rows: (typeof myClubs)[] = [];
  for (let i = 0; i < myClubs.length; i += 2) rows.push(myClubs.slice(i, i + 2));

  const clubW = Math.min(Math.round(width * 0.42), 172);

  return (
    <Screen
      variant="tab"
      title="Your Clubs"
      trailing={
        <MoreMenu
          icon="add"
          label="Create"
          items={[
            { label: 'Start a game', icon: 'football-outline', onPress: createGame },
            { label: 'Create a club', icon: 'people-outline', onPress: createClub },
            { label: 'Join via code', icon: 'qr-code-outline', onPress: joinScan },
          ]}
        />
      }
      contentStyle={styles.screenContent}
    >
      {/* Flex container: "Your clubs" fills middle, "Clubs near you" docks at bottom */}
      <View style={styles.flex}>
        {/* Your clubs — grows to fill available space */}
        <View style={styles.clubsSection}>
          {myClubs.length > 0 ? (
            <Section first title="Your clubs">
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
                  {row.length === 1 && <View style={styles.gridFlex} />}
                </View>
              ))}
            </Section>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="people" size={52} color={colors.label3} />
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
          )}
        </View>

        {/* Clubs near you — docked at bottom, no caption, "Explore more" top-right */}
        {nearbyClubs.length > 0 && (
          <Section
            title="Clubs near you"
            action={{ label: 'Explore more', onPress: () => setShowExplore(true) }}
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
          </Section>
        )}
      </View>

      {showExplore && <ExploreSheet onClose={() => setShowExplore(false)} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { flexGrow: 1 },
  flex: { flex: 1, gap: space.xl },
  // ─── Your clubs ──────────────────────────────────────────────────────────────
  clubsSection: { flex: 1 },
  gridRow: { flexDirection: 'row', gap: space.md },
  gridFlex: { flex: 1 },
  // ─── Empty state ─────────────────────────────────────────────────────────────
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    paddingVertical: space.xxl,
    minHeight: 320,
  },
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
  // ─── Filter chips (inside ExploreSheet) ──────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  chip: {
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
  chipActive: { backgroundColor: colors.label, borderColor: colors.label },
  chipText: { ...type.footnote, color: colors.label2, fontWeight: '500' },
  chipTextActive: { color: colors.white },
  // ─── Explore sheet ────────────────────────────────────────────────────────────
  sheetScrim: { backgroundColor: colors.label },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: space.sm,
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
  sheetList: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: 2 },
  sheetEmpty: { padding: space.xl, alignItems: 'center' },
  sheetCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
});

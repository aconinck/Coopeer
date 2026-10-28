import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../../src/constants/theme';
import { enter as fadeEnter, spring } from '../../src/constants/motion';
import { gameStatus, isToday, sportIds, sports, type Place, type SportId } from '../../src/state/models';
import { useStore } from '../../src/state/store';
import { open } from '../../src/lib/nav';
import { distanceMeters, MILE_METERS } from '../../src/lib/geo';
import { router, useLocalSearchParams } from 'expo-router';
import { useTourTarget } from '../../src/tour/Tour';
import { OptionRow, OptionSheet } from '../../src/create/ui';
import { IconTile } from '../../src/ui/Display';
import { useCurrentLocation } from '../../src/lib/useLocation';
import { MapControls } from '../../src/map/MapControls';
import { MapTopBar, type MapMode } from '../../src/map/MapTopBar';
import { StreetMap, type StreetMapHandle } from '../../src/map/StreetMap';
import { summarize } from '../../src/map/PlacePin';
import { pitchById } from '../../src/map/pitches';
import { Chip } from '../../src/ui/Buttons';
import { SectionHeader } from '../../src/ui/Display';
import { Glass } from '../../src/ui/Glass';
import { ClubCard, GameRow } from '../../src/ui/Rows';
import { useTabBarSpace } from '../../src/ui/Screen';
import { SHEET_HALF, useSheet } from '../../src/ui/Sheet';
import { sheetController } from '../../src/ui/sheetController';

const DRAWER_SPRING = spring.smooth;
const CLUB_CARD_WIDTH = 176;
const FIT_RADIUS_MILES = 10;
const TOP_BAR_HEIGHT = 50;
const BENTONVILLE = { latitude: 36.3625, longitude: -94.2105 };

export default function MapScreen() {
  const store = useStore();
  const sheet = useSheet();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { height } = useWindowDimensions();
  const map = useRef<StreetMapHandle>(null);
  const reduceMotion = useReducedMotion();
  const maxListHeight = height * 0.46;

  const params = useLocalSearchParams<{ sport?: string }>();
  const initialSport = sportIds.includes(params.sport as SportId) ? (params.sport as SportId) : null;
  const [sport, setSport] = useState<SportId | null>(initialSport);

  // Your location: the blue dot, and the recenter arrow is filled while the camera follows you
  // and turns to an outline as soon as you move the map away.
  const { coords } = useCurrentLocation();
  const [following, setFollowing] = useState(true);
  const center = coords ?? BENTONVILLE;
  const locateMe = () => {
    setFollowing(true);
    if (coords) map.current?.locate(coords, insets.top + TOP_BAR_HEIGHT + space.lg, height - tabBarSpace - 170);
    else map.current?.recenter();
  };
  const located = useRef(false);
  useEffect(() => {
    if (!coords || !following) return;
    if (!located.current && initialSport) {
      located.current = true;
      return;
    }
    located.current = true;
    map.current?.locate(coords, insets.top + TOP_BAR_HEIGHT + space.lg, height - tabBarSpace - 170);
    // Follow position updates only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.latitude, coords?.longitude]);
  const [mode, setMode] = useState<MapMode>('all');
  const [liveOnly, setLiveOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [creating, setCreating] = useState(false);
  const drawerTourRef = useTourTarget('drawer');
  const createTourRef = useTourTarget('create');
  // Close the menu first; web needs the sheet gone before the next screen takes focus.
  const createThen = (path: '/create/game' | '/create/club') => {
    setCreating(false);
    setTimeout(() => router.push(path === '/create/game' && sport ? `/create/game?sport=${sport}` : path), 250);
  };

  // Whatever the sheet shows, highlight its place on the map and glide the camera to it.
  const root = sheet.isOpen ? sheet.root : null;
  const selectedPlaceId =
    root?.kind === 'place'
      ? root.id
      : root?.kind === 'game'
        ? store.game(root.id)?.placeId ?? null
        : root?.kind === 'club'
          ? store.club(root.id)?.homePlaceId ?? null
          : null;
  const selectedPitchId = root?.kind === 'pitch' ? root.id : null;

  useEffect(() => {
    const place = selectedPlaceId ? store.place(selectedPlaceId) : undefined;
    if (place) {
      setFollowing(false);
      map.current?.focus(place, insets.top + TOP_BAR_HEIGHT + space.lg, height * (1 - SHEET_HALF));
    }
    // Only when the selection changes, not on every store tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlaceId]);

  useEffect(() => {
    const pitch = selectedPitchId ? pitchById(selectedPitchId) : undefined;
    if (pitch) {
      setFollowing(false);
      map.current?.focus(pitch, insets.top + TOP_BAR_HEIGHT + space.lg, height * (1 - SHEET_HALF));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPitchId]);

  const matches = useCallback(
    (...texts: (string | undefined)[]) => {
      const needle = query.trim().toLowerCase();
      return !needle || texts.some((text) => text?.toLowerCase().includes(needle));
    },
    [query],
  );

  const summaries = useMemo(
    () =>
      store.places
        .filter((place) => !sport || place.sports.includes(sport))
        .map((place) => summarize(place, store.upcomingGamesAt(place.id), store.clubsAt(place.id), sport, store.now))
        .map((s) => {
          // Clubs: places where a club plays (activity pills only for a club game live now). Matches: places with a game today.
          if (mode === 'clubs') {
            const games = s.games.filter((g) => g.clubId !== null);
            return { ...s, games, live: games.find((g) => gameStatus(g, store.now) === 'live'), next: undefined };
          }
          if (mode === 'matches') return { ...s, clubs: [] };
          return s;
        })
        .filter((s) => (mode === 'clubs' ? s.clubs.length > 0 : mode === 'matches' ? !!(s.live || s.next) : true))
        .filter((s) => !liveOnly || s.live)
        .filter((s) => matches(s.place.name, s.place.address, ...s.sports.map((id) => sports[id].label), ...s.clubs.map((c) => c.name), ...s.games.map((g) => g.title))),
    [store, sport, mode, liveOnly, matches],
  );

  const visiblePlaceIds = new Set(summaries.map((s) => s.place.id));
  const games = (mode === 'clubs' ? [] : store.games)
    .filter((g) => visiblePlaceIds.has(g.placeId) && !g.isCanceled && (!sport || g.sport === sport))
    .filter((g) => isToday(gameStatus(g, store.now)) && (!liveOnly || gameStatus(g, store.now) === 'live'))
    .filter((g) => matches(g.title, store.place(g.placeId)?.name))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const liveGames = games.filter((g) => gameStatus(g, store.now) === 'live');
  const laterGames = games.filter((g) => gameStatus(g, store.now) !== 'live');
  const clubs = (mode === 'matches' ? [] : store.clubs)
    .filter((c) => visiblePlaceIds.has(c.homePlaceId) && (!sport || c.sport === sport) && matches(c.name, store.place(c.homePlaceId)?.name))
    .filter((c) => !liveOnly || store.gamesFor(c.id).some((g) => gameStatus(g, store.now) === 'live'));

  // Picking a sport zooms out to show every matching place within 10 miles; clearing it returns to the default view.
  const pickSport = (id: SportId | null) => {
    setSport(id);
    if (!id) {
      locateMe();
      return;
    }
    setFollowing(false);
    const nearby = store.places.filter((p) => p.sports.includes(id) && distanceMeters(p, center) <= FIT_RADIUS_MILES * MILE_METERS);
    map.current?.fit(nearby, insets.top + TOP_BAR_HEIGHT + space.lg, height - tabBarSpace - 170);
  };

  // Coming from sign-up with a favorite sport (/map?sport=…): open on that filter, zoomed to fit.
  useEffect(() => {
    if (!initialSport) return;
    const timer = setTimeout(() => pickSport(initialSport), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSport]);

  const selectPlace = (place: Place) => {
    setExpanded(false);
    open.place(place.id);
  };

  // The drawer steps aside (slides down) while the detail sheet is up.
  const drawerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(sheet.isOpen ? 0 : 1, { duration: 180 }),
    transform: [{ translateY: withSpring(sheet.isOpen ? 260 : 0, DRAWER_SPRING) }],
  }));

  // Expanding grows only the games list (a clipped height), so the search and chips never stretch.
  const expandProgress = useSharedValue(0);
  const listContentHeight = useSharedValue(0);
  useEffect(() => {
    expandProgress.value = reduceMotion ? withTiming(expanded ? 1 : 0, { duration: 0 }) : withSpring(expanded ? 1 : 0, spring.smooth);
  }, [expanded, expandProgress, reduceMotion]);
  const listStyle = useAnimatedStyle(() => ({
    height: expandProgress.value * Math.min(listContentHeight.value, maxListHeight),
  }));

  // The drawer follows the finger (list height tracks the drag) and settles by position + velocity.
  const dragFrom = useSharedValue(0);
  const drawerPan = Gesture.Pan()
    .activeOffsetY([-6, 6])
    .onStart(() => {
      dragFrom.value = expandProgress.value;
    })
    .onUpdate((e) => {
      const range = Math.max(Math.min(listContentHeight.value, maxListHeight), 1);
      expandProgress.value = Math.min(Math.max(dragFrom.value - e.translationY / range, 0), 1);
    })
    .onEnd((e) => {
      const open = e.velocityY < -400 || (e.velocityY < 400 && expandProgress.value > 0.5);
      expandProgress.value = withSpring(open ? 1 : 0, { ...spring.smooth, velocity: 0 });
      runOnJS(setExpanded)(open);
    });

  let row = 0;
  const enter = () => fadeEnter(row++);

  return (
    <View style={styles.root}>
      <StreetMap
        ref={map}
        summaries={summaries}
        selectedId={selectedPlaceId}
        onSelect={selectPlace}
        selectedPitchId={selectedPitchId}
        userLocation={coords}
        onUserMove={() => setFollowing(false)}
        attributionTop={insets.top + space.sm + TOP_BAR_HEIGHT + 6}
        onPitchPress={(pitch) => {
          setExpanded(false);
          sheetController.open({ kind: 'pitch', id: pitch.id });
        }}
        onBackgroundPress={() => {
          if (sheet.isOpen) sheetController.close();
          else setExpanded(false);
        }}
      />

      <View style={[styles.topBar, { top: insets.top + space.sm }]} pointerEvents="box-none">
        <MapTopBar mode={mode} onModeChange={setMode} now={liveOnly} onNowChange={setLiveOnly} />
      </View>

      <View style={[styles.controls, { top: insets.top + space.sm + TOP_BAR_HEIGHT + space.sm }]} pointerEvents="box-none">
        <MapControls onZoomIn={() => map.current?.zoomIn()} onZoomOut={() => map.current?.zoomOut()} onRecenter={locateMe} following={following} />
      </View>

      <Animated.View pointerEvents={sheet.isOpen ? 'none' : 'box-none'} style={[styles.drawerWrap, { bottom: tabBarSpace }, drawerStyle]}>
        <View>
          <Glass radius={radius.sheet} style={styles.drawer}>
            <GestureDetector gesture={drawerPan}>
              <View collapsable={false} ref={drawerTourRef}>
                <Pressable accessibilityRole="button" accessibilityLabel={expanded ? 'Collapse list' : 'Expand list'} onPress={() => setExpanded((v) => !v)} style={styles.grabberArea}>
                  <View style={styles.grabber} />
                </Pressable>

                <View style={styles.search}>
                  <Ionicons name="search" size={18} color={colors.label2} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    onFocus={() => setExpanded(true)}
                    placeholder="Search places, clubs, games"
                    placeholderTextColor={colors.label2}
                    returnKeyType="search"
                    style={[type.body, styles.searchInput]}
                  />
                  {query ? (
                    <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color={colors.label2} />
                    </Pressable>
                  ) : null}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
                  <Chip
                    title="All"
                    selected={!sport}
                    onPress={() => pickSport(null)}
                    icon={<MaterialCommunityIcons name="compass-outline" size={17} color={!sport ? colors.white : colors.label} />}
                  />
                  {sportIds.map((id) => (
                    <Chip
                      key={id}
                      title={sports[id].label}
                      color={sports[id].color}
                      selected={sport === id}
                      onPress={() => pickSport(sport === id ? null : id)}
                      icon={<MaterialCommunityIcons name={sports[id].icon} size={17} color={sport === id ? colors.white : colors.label2} />}
                    />
                  ))}
                </ScrollView>

                <View ref={createTourRef} collapsable={false}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Create new game or club"
                    onPress={() => setCreating(true)}
                    style={({ pressed }) => [styles.createNew, pressed && styles.createNewPressed]}
                  >
                    <Ionicons name="add-circle" size={20} color={colors.brand} />
                    <Text style={[type.subhead, styles.createNewText]}>Create new</Text>
                  </Pressable>
                </View>
              </View>
            </GestureDetector>

            <Animated.View
              pointerEvents={expanded ? 'auto' : 'none'}
              accessibilityElementsHidden={!expanded}
              importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
              style={[styles.listClip, listStyle]}
            >
              <ScrollView
                style={{ maxHeight: maxListHeight }}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                onContentSizeChange={(_, h) => {
                  listContentHeight.value = h;
                }}
              >
                {liveGames.length > 0 && (
                  <Animated.View entering={enter()}>
                    <SectionHeader title="Happening now" caption="Live games you can still jump into." />
                  </Animated.View>
                )}
                {liveGames.map((game) => (
                  <Animated.View key={game.id} entering={enter()}>
                    <GameRow game={game} onPress={() => open.game(game.id)} />
                  </Animated.View>
                ))}
                {clubs.length > 0 && (
                  <Animated.View entering={enter()}>
                    <SectionHeader title="Clubs nearby" caption="Groups that play every week." />
                  </Animated.View>
                )}
                {clubs.length > 0 && (
                  <Animated.View entering={enter()}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={CLUB_CARD_WIDTH + space.md}
                      snapToAlignment="start"
                      decelerationRate="fast"
                      contentContainerStyle={styles.rail}
                    >
                      {clubs.map((club) => (
                        <ClubCard key={club.id} club={club} width={CLUB_CARD_WIDTH} onPress={() => open.club(club.id)} />
                      ))}
                    </ScrollView>
                  </Animated.View>
                )}
                {laterGames.length > 0 && (
                  <Animated.View entering={enter()}>
                    <SectionHeader title="Later today" caption="One-time games. Show up and play." />
                  </Animated.View>
                )}
                {laterGames.map((game) => (
                  <Animated.View key={game.id} entering={enter()}>
                    <GameRow game={game} onPress={() => open.game(game.id)} />
                  </Animated.View>
                ))}
                {games.length === 0 && clubs.length === 0 && (
                  <View style={styles.empty}>
                    <Ionicons name="football-outline" size={32} color={colors.label3} />
                    <Text style={type.headline}>Nothing here yet</Text>
                    <Text style={[type.subhead, { color: colors.label2 }]}>{liveOnly ? 'Nothing is live right now. Turn off Now to see later today.' : 'Try another sport or clear your search.'}</Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </Glass>
        </View>
      </Animated.View>

      <OptionSheet visible={creating} onClose={() => setCreating(false)} header={<Text style={[type.title3, styles.createTitle]}>Create new</Text>}>
        <OptionRow
          title="Start a game"
          detail="One game at any place. No club needed."
          leading={<IconTile icon="football-outline" color={colors.brand} background={colors.brandSoft} />}
          onPress={() => createThen('/create/game')}
        />
        <OptionRow
          title="Create a club"
          detail="A group that plays every week."
          leading={<IconTile icon="people-outline" color={colors.brand} background={colors.brandSoft} />}
          onPress={() => createThen('/create/club')}
        />
      </OptionSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  controls: { position: 'absolute', right: space.lg },
  topBar: { position: 'absolute', left: 0, right: 0, zIndex: 2 },
  drawerWrap: { position: 'absolute', left: space.lg, right: space.lg },
  drawer: { paddingHorizontal: space.lg, paddingBottom: space.md },
  grabberArea: { alignItems: 'center', paddingVertical: space.sm },
  grabber: { width: 36, height: 5, borderRadius: 3, backgroundColor: colors.label3 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.fill,
  },
  searchInput: { flex: 1, color: colors.label, paddingVertical: 0, outlineStyle: 'none' } as never,
  chips: { gap: space.sm, paddingTop: space.md, paddingBottom: space.sm },
  createNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    marginBottom: space.xs,
    borderRadius: radius.full,
    backgroundColor: colors.brandSoft,
  },
  createNewPressed: { opacity: 0.8 },
  createNewText: { color: colors.brand, fontWeight: '600' },
  createTitle: { paddingHorizontal: space.sm, paddingBottom: space.sm },
  listClip: { overflow: 'hidden' },
  list: { gap: space.md, paddingBottom: space.lg },
  rail: { gap: space.md },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl },
});

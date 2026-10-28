import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../../src/constants/theme';
import { enter as fadeEnter, spring } from '../../src/constants/motion';
import { gameStatus, isToday, sportIds, sports, type Place, type SportId } from '../../src/state/models';
import { useStore } from '../../src/state/store';
import { open } from '../../src/lib/nav';
import { StreetMap, type StreetMapHandle } from '../../src/map/StreetMap';
import { summarize } from '../../src/map/PlacePin';
import { pitchById } from '../../src/map/pitches';
import { Chip, IconButton } from '../../src/ui/Buttons';
import { SectionHeader } from '../../src/ui/Display';
import { Glass } from '../../src/ui/Glass';
import { ClubRow, GameRow, GamesVsClubsCard } from '../../src/ui/Rows';
import { useTabBarSpace } from '../../src/ui/Screen';
import { SHEET_HALF, useSheet } from '../../src/ui/Sheet';
import { sheetController } from '../../src/ui/sheetController';

const EXPLAINER_KEY = 'explore.explainerDismissed';
const DRAWER_SPRING = spring.smooth;

export default function MapScreen() {
  const store = useStore();
  const sheet = useSheet();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { height } = useWindowDimensions();
  const map = useRef<StreetMapHandle>(null);

  const [sport, setSport] = useState<SportId | null>(null);
  const [liveOnly, setLiveOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [explainerDismissed, setExplainerDismissed] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(EXPLAINER_KEY).then((value) => setExplainerDismissed(value === 'true'));
  }, []);

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
    if (place) map.current?.focus(place, insets.top + 56, height * (1 - SHEET_HALF));
    // Only when the selection changes, not on every store tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlaceId]);

  useEffect(() => {
    const pitch = selectedPitchId ? pitchById(selectedPitchId) : undefined;
    if (pitch) map.current?.focus(pitch, insets.top + 56, height * (1 - SHEET_HALF));
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
        .filter((s) => !liveOnly || s.live)
        .filter((s) => matches(s.place.name, s.place.address, ...s.sports.map((id) => sports[id].label), ...s.clubs.map((c) => c.name), ...s.games.map((g) => g.title))),
    [store, sport, liveOnly, matches],
  );

  const visiblePlaceIds = new Set(summaries.map((s) => s.place.id));
  const games = store.games
    .filter((g) => visiblePlaceIds.has(g.placeId) && !g.isCanceled && (!sport || g.sport === sport))
    .filter((g) => isToday(gameStatus(g, store.now)) && (!liveOnly || gameStatus(g, store.now) === 'live'))
    .filter((g) => matches(g.title, store.place(g.placeId)?.name))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const liveGames = games.filter((g) => gameStatus(g, store.now) === 'live');
  const laterGames = games.filter((g) => gameStatus(g, store.now) !== 'live');
  const clubs = liveOnly
    ? []
    : store.clubs.filter((c) => visiblePlaceIds.has(c.homePlaceId) && (!sport || c.sport === sport) && matches(c.name, store.place(c.homePlaceId)?.name));
  const totalLive = store.games.filter((g) => !g.isCanceled && gameStatus(g, store.now) === 'live').length;

  const summaryLine = [
    liveGames.length > 0 && `${liveGames.length} live now`,
    laterGames.length > 0 && `${laterGames.length} later today`,
    `${clubs.length} clubs nearby`,
  ]
    .filter(Boolean)
    .join(' · ');

  const selectPlace = (place: Place) => {
    setExpanded(false);
    open.place(place.id);
  };

  // The drawer steps aside (slides down) while the detail sheet is up.
  const drawerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(sheet.isOpen ? 0 : 1, { duration: 180 }),
    transform: [{ translateY: withSpring(sheet.isOpen ? 260 : 0, DRAWER_SPRING) }],
  }));

  const drawerPan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onEnd((e) => {
      if (e.translationY < -24 || e.velocityY < -400) runOnJS(setExpanded)(true);
      else if (e.translationY > 24 || e.velocityY > 400) runOnJS(setExpanded)(false);
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
        {totalLive > 0 ? <LivePill count={totalLive} active={liveOnly} onPress={() => setLiveOnly((v) => !v)} /> : <View />}
        <IconButton icon="navigate" label="Recenter map" tint={colors.brand} onPress={() => map.current?.recenter()} />
      </View>

      <Animated.View pointerEvents={sheet.isOpen ? 'none' : 'box-none'} style={[styles.drawerWrap, { bottom: tabBarSpace }, drawerStyle]}>
        <Animated.View layout={LinearTransition.springify().mass(1).stiffness(spring.smooth.stiffness).damping(spring.smooth.damping)}>
          <Glass radius={radius.sheet} style={styles.drawer}>
            <GestureDetector gesture={drawerPan}>
              <View collapsable={false}>
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
                    selected={!sport && !liveOnly}
                    onPress={() => {
                      setSport(null);
                      setLiveOnly(false);
                    }}
                  />
                  {sportIds.map((id) => (
                    <Chip
                      key={id}
                      title={sports[id].label}
                      color={sports[id].color}
                      selected={sport === id}
                      onPress={() => setSport(sport === id ? null : id)}
                      icon={<MaterialCommunityIcons name={sports[id].icon} size={16} color={sport === id ? colors.white : sports[id].color} />}
                    />
                  ))}
                  <Chip
                    title="Live now"
                    color={colors.live}
                    selected={liveOnly}
                    onPress={() => setLiveOnly((v) => !v)}
                    icon={<View style={[styles.liveDot, liveOnly && { backgroundColor: colors.white }]} />}
                  />
                </ScrollView>

                {!expanded && (
                  <Animated.Text entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={[type.footnote, styles.summary]}>
                    {summaryLine}
                  </Animated.Text>
                )}
              </View>
            </GestureDetector>

            {expanded && (
              <ScrollView style={{ maxHeight: height * 0.46 }} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {!explainerDismissed && (
                  <Animated.View entering={enter()} exiting={FadeOut.duration(160)}>
                    <GamesVsClubsCard
                      onDismiss={() => {
                        setExplainerDismissed(true);
                        AsyncStorage.setItem(EXPLAINER_KEY, 'true');
                      }}
                    />
                  </Animated.View>
                )}
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
                {clubs.length > 0 && (
                  <Animated.View entering={enter()}>
                    <SectionHeader title="Clubs nearby" caption="Groups that play every week." />
                  </Animated.View>
                )}
                {clubs.map((club) => (
                  <Animated.View key={club.id} entering={enter()}>
                    <ClubRow club={club} onPress={() => open.club(club.id)} />
                  </Animated.View>
                ))}
                {games.length === 0 && clubs.length === 0 && (
                  <View style={styles.empty}>
                    <Ionicons name="football-outline" size={32} color={colors.label3} />
                    <Text style={type.headline}>Nothing here yet</Text>
                    <Text style={[type.subhead, { color: colors.label2 }]}>Try another sport or clear your search.</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </Glass>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function LivePill({ count, active, onPress }: { count: number; active: boolean; onPress: () => void }) {
  const reduceMotion = useReducedMotion();
  const beat = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    beat.value = withRepeat(withSequence(withTiming(1.25, { duration: 1100, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) })), -1);
  }, [beat, reduceMotion]);
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: beat.value }] }));

  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress}>
      <Glass radius={radius.full} style={styles.livePill} tint={active ? colors.live : undefined}>
        <Animated.View style={[styles.liveDot, active && { backgroundColor: colors.white }, dotStyle]} />
        <Text style={[type.subhead, { fontWeight: '600', color: active ? colors.white : colors.label }]}>{count} live now</Text>
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: 14, height: 40 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  drawerWrap: { position: 'absolute', left: space.sm, right: space.sm },
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
  chips: { gap: space.sm, paddingVertical: space.md },
  summary: { color: colors.label2, fontWeight: '500' },
  list: { gap: space.md, paddingBottom: space.lg },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl },
});

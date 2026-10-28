import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../../src/constants/theme';
import { gameStatus, isToday, sportIds, sports, type Place, type SportId } from '../../src/state/models';
import { useStore } from '../../src/state/store';
import { open } from '../../src/lib/nav';
import { PlaceMap, type PlaceMapHandle } from '../../src/map/PlaceMap';
import { summarize } from '../../src/map/PlacePin';
import { Chip, IconButton } from '../../src/ui/Buttons';
import { SectionHeader } from '../../src/ui/Display';
import { Glass } from '../../src/ui/Glass';
import { ClubRow, GameRow, GamesVsClubsCard } from '../../src/ui/Rows';
import { useTabBarSpace } from '../../src/ui/Screen';

const EXPLAINER_KEY = 'explore.explainerDismissed';

export default function Explore() {
  const store = useStore();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { height } = useWindowDimensions();
  const map = useRef<PlaceMapHandle>(null);

  const [sport, setSport] = useState<SportId | null>(null);
  const [liveOnly, setLiveOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [explainerDismissed, setExplainerDismissed] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(EXPLAINER_KEY).then((value) => setExplainerDismissed(value === 'true'));
    if (Platform.OS !== 'web') Location.requestForegroundPermissionsAsync().catch(() => undefined);
  }, []);

  useFocusEffect(useCallback(() => setSelectedId(null), []));

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
    setSelectedId(place.id);
    map.current?.focus(place);
    open.place(place.id);
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderRelease: (_, g) => {
          if (g.dy < -30) setExpanded(true);
          if (g.dy > 30) setExpanded(false);
        },
      }),
    [],
  );

  return (
    <View style={styles.root}>
      <PlaceMap ref={map} summaries={summaries} selectedId={selectedId} onSelect={selectPlace} bottomInset={tabBarSpace + 150} />

      <View style={[styles.topBar, { top: insets.top + space.sm }]} pointerEvents="box-none">
        {totalLive > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setLiveOnly((v) => !v)}>
            <Glass radius={radius.full} style={styles.livePill} tint={liveOnly ? colors.live : undefined}>
              <View style={[styles.liveDot, liveOnly && { backgroundColor: colors.white }]} />
              <Text style={[type.subhead, { fontWeight: '600', color: liveOnly ? colors.white : colors.label }]}>
                {totalLive} live now
              </Text>
            </Glass>
          </Pressable>
        ) : (
          <View />
        )}
        <IconButton icon="navigate" label="Recenter map" tint={colors.brand} onPress={() => map.current?.recenter()} />
      </View>

      <View style={[styles.drawerWrap, { bottom: tabBarSpace }]}>
        <Glass radius={radius.sheet} style={styles.drawer}>
          <View {...pan.panHandlers}>
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

            {!expanded && <Text style={[type.footnote, styles.summary]}>{summaryLine}</Text>}
          </View>

          {expanded && (
            <ScrollView style={{ maxHeight: height * 0.48 }} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
              {!explainerDismissed && (
                <GamesVsClubsCard
                  onDismiss={() => {
                    setExplainerDismissed(true);
                    AsyncStorage.setItem(EXPLAINER_KEY, 'true');
                  }}
                />
              )}
              {liveGames.length > 0 && <SectionHeader title="Happening now" caption="Live games you can still jump into." />}
              {liveGames.map((game) => (
                <GameRow key={game.id} game={game} onPress={() => open.game(game.id)} />
              ))}
              {laterGames.length > 0 && <SectionHeader title="Later today" caption="One-time games. Show up and play." />}
              {laterGames.map((game) => (
                <GameRow key={game.id} game={game} onPress={() => open.game(game.id)} />
              ))}
              {clubs.length > 0 && <SectionHeader title="Clubs nearby" caption="Groups that play every week." />}
              {clubs.map((club) => (
                <ClubRow key={club.id} club={club} onPress={() => open.club(club.id)} />
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
      </View>
    </View>
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

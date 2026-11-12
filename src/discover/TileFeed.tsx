import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, radius, space, type } from '../constants/theme';
import { heroImageFor } from '../lib/heroImage';
import { gameStatus, isToday, sports, type Club, type Game, type Place, type SportId } from '../state/models';
import { useSession } from '../state/session';
import { useStore } from '../state/store';
import { PlaceIcon } from '../map/PlacePin';
import { SectionHeader } from '../ui/Display';
import { InviteCard, inviteWhen } from '../ui/InviteCard';
import { Rail } from '../ui/Layout';
import { PhotoCard } from '../ui/PhotoCard';
import { setTabBarHidden } from '../ui/tabBarVisibility';

const greeting = (now: Date) => (now.getHours() < 12 ? 'Good morning,' : now.getHours() < 18 ? 'Good afternoon,' : 'Good evening,');

/**
 * Tile view: an Explore home for everything around you. Live now, new games and clubs, what is coming up,
 * clubs near you and places to play. Each rail hides itself when it has nothing for the chosen sport.
 */
export function TileFeed({
  sport,
  matches,
  top,
  bottom,
  onOpenGame,
  onOpenClub,
  onOpenPlace,
}: {
  sport: SportId | null;
  matches: (...texts: (string | undefined)[]) => boolean;
  top: number;
  bottom: number;
  onOpenGame: (game: Game) => void;
  onOpenClub: (club: Club) => void;
  onOpenPlace: (place: Place) => void;
}) {
  const store = useStore();
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const now = store.now;
  const lastY = useRef(0);
  const hidden = useRef(false);
  // Scrolling down slides the tab bar away; scrolling back up (or reaching the top) brings it back.
  const onScroll = (y: number) => {
    const dy = y - lastY.current;
    lastY.current = y;
    const next = y <= 24 ? false : dy > 6 ? true : dy < -6 ? false : hidden.current;
    if (next !== hidden.current) {
      hidden.current = next;
      setTabBarHidden(next);
    }
  };

  const imageFor = (game: Game): ImageSourcePropType | null => {
    const place = store.place(game.placeId);
    return place ? heroImageFor(game, place, store.places) : null;
  };
  const clubImage = (club: Club): ImageSourcePropType | null => {
    const place = store.place(club.homePlaceId);
    return place ? heroImageFor({ sport: club.sport }, place, store.places) : null;
  };
  const where = (game: Game) => store.place(game.placeId)?.name ?? '';

  const upcoming = store.games
    .filter((g) => !g.isCanceled && gameStatus(g, now) !== 'ended' && (!sport || g.sport === sport) && matches(g.title, where(g), g.clubId ? store.club(g.clubId)?.name : undefined))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const live = upcoming.filter((g) => gameStatus(g, now) === 'live');
  const fresh = [
    ...upcoming.filter((g) => g.isNew && gameStatus(g, now) !== 'live').map((g) => ({ kind: 'game' as const, game: g })),
    ...store.clubs.filter((c) => c.isNew && (!sport || c.sport === sport) && matches(c.name, store.place(c.homePlaceId)?.name)).map((c) => ({ kind: 'club' as const, club: c })),
  ];
  const comingUp = upcoming.filter((g) => gameStatus(g, now) !== 'live');
  const clubs = store.clubs.filter((c) => (!sport || c.sport === sport) && matches(c.name, store.place(c.homePlaceId)?.name));
  const places = store.places
    .filter((p) => (!sport || p.sports.includes(sport)) && matches(p.name, p.address))
    .sort((a, b) => (b.photos?.length ?? 0) - (a.photos?.length ?? 0))
    .slice(0, 8);

  const liveW = Math.min(width * 0.74, 300);
  const freshW = Math.min(width * 0.52, 220);
  const wideW = Math.min(width * 0.74, 300);
  const clubW = Math.min(width * 0.4, 168);
  const first = user?.name.split(' ')[0] ?? 'there';
  const empty = live.length + fresh.length + comingUp.length + clubs.length + places.length === 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: top, paddingBottom: bottom + space.lg, paddingHorizontal: layout.gutter, gap: layout.sectionGap }} showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={(e) => onScroll(e.nativeEvent.contentOffset.y)}
    >
      <View style={styles.hello}>
        <View>
          <Text style={[type.title, styles.helloLight]}>{greeting(now)}</Text>
          <Text style={[type.title, styles.helloName]}>{first}</Text>
        </View>
      </View>

      {live.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Happening now" caption="Live games you can still jump into." />
          <Rail snap={liveW}>
            {live.map((game) => (
              <InviteCard key={game.id} game={game} place={store.place(game.placeId)} club={game.clubId ? store.club(game.clubId) : undefined} image={imageFor(game)} now={now} width={liveW} height={Math.round(liveW * 1.25)} onPress={() => onOpenGame(game)} />
            ))}
          </Rail>
        </View>
      )}

      {fresh.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="New near you" caption="Just created games and clubs." />
          <Rail snap={freshW}>
            {fresh.map((item) =>
              item.kind === 'game' ? (
                <PhotoCard key={item.game.id} image={imageFor(item.game)} title={item.game.title} subtitle={`${where(item.game)} · ${inviteWhen(item.game, now)}`} badge="New game" width={freshW} height={Math.round(freshW * 1.2)} onPress={() => onOpenGame(item.game)} />
              ) : (
                <PhotoCard key={item.club.id} image={clubImage(item.club)} title={item.club.name} subtitle={`${sports[item.club.sport].label} · ${item.club.memberCount} members`} badge="New club" width={freshW} height={Math.round(freshW * 1.2)} onPress={() => onOpenClub(item.club)} />
              ),
            )}
          </Rail>
        </View>
      )}

      {comingUp.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Coming up" caption="Games and events on the calendar." />
          <Rail snap={wideW}>
            {comingUp.map((game) => (
              <PhotoCard key={game.id} image={imageFor(game)} title={game.title} subtitle={`${where(game)} · ${game.clubId ? store.club(game.clubId)?.name : 'Open game'}`} badge={isToday(gameStatus(game, now)) ? inviteWhen(game, now) : inviteWhen(game, now)} width={wideW} height={Math.round(wideW * 0.6)} onPress={() => onOpenGame(game)} />
            ))}
          </Rail>
        </View>
      )}

      {clubs.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Clubs near you" caption="Groups that play every week." />
          <Rail snap={clubW}>
            {clubs.map((club) => (
              <PhotoCard key={club.id} image={clubImage(club)} title={club.name} subtitle={club.cadence} badge={sports[club.sport].label} width={clubW} height={clubW} onPress={() => onOpenClub(club)} />
            ))}
          </Rail>
        </View>
      )}

      {places.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Places to play" caption="Parks, fields, courts and trails." />
          <View style={styles.grid}>
            {places.map((place) => (
              <Pressable key={place.id} accessibilityRole="button" accessibilityLabel={place.name} onPress={() => onOpenPlace(place)} style={({ pressed }) => [styles.placeTile, pressed && styles.pressed]}>
                <PlaceIcon kind={place.kind} size={44} />
                <Text style={[type.subhead, styles.placeName]} numberOfLines={2}>
                  {place.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {empty && (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={32} color={colors.label3} />
          <Text style={type.headline}>Nothing around you yet</Text>
          <Text style={[type.subhead, styles.emptyText]}>Start a game or a club with Create new.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: colors.bg },
  hello: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  helloLight: { color: colors.label3 },
  helloName: { color: colors.label },
  section: { gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  placeTile: { width: '47.5%', flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, borderRadius: radius.card, backgroundColor: colors.fill },
  placeName: { flex: 1, color: colors.label, fontWeight: '600' },
  pressed: { opacity: 0.85 },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl },
  emptyText: { color: colors.label2, textAlign: 'center' },
});

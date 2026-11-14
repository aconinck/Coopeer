import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, radius, space, type } from '../constants/theme';
import { heroImageFor } from '../lib/heroImage';
import { router } from 'expo-router';
import { gameStatus, isInvited, type Club, type Game, type Place, type SportId } from '../state/models';
import { useSession } from '../state/session';
import { useStore } from '../state/store';
import { PlaceIcon } from '../map/PlacePin';
import { SectionHeader } from '../ui/Display';
import { InviteCard, inviteWhen } from '../ui/InviteCard';
import { Invitations } from '../ui/Invitations';
import { Rail } from '../ui/Layout';
import { ClubCard } from '../ui/Rows';
import { PhotoCard } from '../ui/PhotoCard';
import { setTabBarHidden } from '../ui/tabBarVisibility';
import { consumeCascade } from '../lib/firstVisit';

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
  // Consumed once on first mount after the discovery screen; drives section stagger.
  const cascade = useRef(consumeCascade()).current;
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
    return place ? heroImageFor(game, place) : null;
  };
  const where = (game: Game) => store.place(game.placeId)?.name ?? '';

  const active = store.games.filter((g) => !g.isCanceled && gameStatus(g, now) !== 'ended').sort((a, b) => a.start.getTime() - b.start.getTime());
  // Only a game you answered "I'm in" to counts as yours; belonging to a club does not confirm you.
  const next = active.find((g) => g.myRSVP === 'going');
  const upcoming = active.filter((g) => g.id !== next?.id && !isInvited(g) && (!sport || g.sport === sport) && matches(g.title, where(g), g.clubId ? store.club(g.clubId)?.name : undefined));
  const live = upcoming.filter((g) => gameStatus(g, now) === 'live');
  const rest = upcoming.filter((g) => gameStatus(g, now) !== 'live');
  const fromClubs = rest.filter((g) => g.clubId !== null && store.isMember(g.clubId));
  const nearby = rest.filter((g) => !(g.clubId !== null && store.isMember(g.clubId)));
  const clubs = store.clubs.filter((c) => !store.isMember(c.id) && (!sport || c.sport === sport) && matches(c.name, store.place(c.homePlaceId)?.name));
  const places = store.places
    .filter((p) => (!sport || p.sports.includes(sport)) && matches(p.name, p.address))
    .sort((a, b) => (b.photos?.length ?? 0) - (a.photos?.length ?? 0))
    .slice(0, 8);

  const liveW = Math.min(width * 0.74, 300);
  const freshW = Math.min(width * 0.52, 220);
  const wideW = Math.min(width * 0.74, 300);
  const clubW = Math.min(width * 0.4, 168);
  const first = user?.name.split(' ')[0] ?? 'there';
  const empty = store.ready && !next && store.clubInvites.length + store.gameInvites.length + live.length + fromClubs.length + nearby.length + clubs.length + places.length === 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: top, paddingBottom: bottom + space.lg, paddingHorizontal: layout.gutter, gap: layout.sectionGap }} showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={(e) => onScroll(e.nativeEvent.contentOffset.y)}
    >
      <Animated.View style={styles.hello} entering={cascade ? FadeIn.duration(400) : undefined}>
        <View>
          <Text style={[type.title, styles.helloLight]}>{greeting(now)}</Text>
          <Text style={[type.title, styles.helloName]}>{first}</Text>
        </View>
      </Animated.View>

      {next && (
        <Animated.View style={styles.section} entering={cascade ? FadeIn.duration(400).delay(100) : undefined}>
          <SectionHeader title="Your next" caption={`${store.isWeekly(next) ? "You're in every week" : "You're in this game"} · ${inviteWhen(next, now)}`} action={{ label: 'Schedule', onPress: () => router.push('/schedule') }} />
          <InviteCard game={next} place={store.place(next.placeId)} club={next.clubId ? store.club(next.clubId) : undefined} image={imageFor(next)} now={now} width={Math.min(width - layout.gutter * 2, 560)} height={Math.round(Math.min(width - layout.gutter * 2, 560) * 0.72)} onPress={() => onOpenGame(next)} />
        </Animated.View>
      )}

      <Invitations onOpenClub={onOpenClub} onOpenGame={onOpenGame} />

      {live.length > 0 && (
        <Animated.View style={styles.section} entering={cascade ? FadeIn.duration(400).delay(150) : undefined}>
          <SectionHeader title="Happening now" caption="Live games you can still jump into." />
          <Rail snap={liveW}>
            {live.map((game) => (
              <InviteCard key={game.id} game={game} place={store.place(game.placeId)} club={game.clubId ? store.club(game.clubId) : undefined} image={imageFor(game)} now={now} width={liveW} height={Math.round(liveW * 1.25)} onPress={() => onOpenGame(game)} />
            ))}
          </Rail>
        </Animated.View>
      )}

      {fromClubs.length > 0 && (
        <Animated.View style={styles.section} entering={cascade ? FadeIn.duration(400).delay(300) : undefined}>
          <SectionHeader title="From your clubs" caption="Tap a game to say if you're in." />
          <Rail snap={freshW}>
            {fromClubs.map((game) => (
              <PhotoCard key={game.id} image={imageFor(game)} sport={game.sport} title={game.title} subtitle={`${where(game)} · ${game.clubId ? store.club(game.clubId)?.name : ''}`} badge={inviteWhen(game, now)} width={wideW} height={Math.round(wideW * 0.6)} onPress={() => onOpenGame(game)} />
            ))}
          </Rail>
        </Animated.View>
      )}

      {nearby.length > 0 && (
        <Animated.View style={styles.section} entering={cascade ? FadeIn.duration(400).delay(450) : undefined}>
          <SectionHeader title="Games near you" caption="Open to everyone." />
          <Rail snap={liveW}>
            {nearby.map((game) => (
              <InviteCard key={game.id} game={game} place={store.place(game.placeId)} club={game.clubId ? store.club(game.clubId) : undefined} image={imageFor(game)} now={now} width={liveW} height={Math.round(liveW * 1.25)} onPress={() => onOpenGame(game)} />
            ))}
          </Rail>
        </Animated.View>
      )}

      {clubs.length > 0 && (
        <Animated.View style={styles.section} entering={cascade ? FadeIn.duration(400).delay(750) : undefined}>
          <SectionHeader title="Clubs near you" caption="Join a group that plays together." />
          <Rail snap={clubW}>
            {clubs.map((club, i) => (
              <ClubCard key={club.id} club={club} index={i} width={clubW} onPress={() => onOpenClub(club)} />
            ))}
          </Rail>
        </Animated.View>
      )}

      {places.length > 0 && (
        <Animated.View style={styles.section} entering={cascade ? FadeIn.duration(400).delay(900) : undefined}>
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
        </Animated.View>
      )}

      {empty && (
        <Animated.View style={styles.empty} entering={cascade ? FadeIn.duration(400).delay(150) : undefined}>
          <Ionicons name="calendar-outline" size={32} color={colors.label3} />
          <Text style={type.headline}>Nothing around you yet</Text>
          <Text style={[type.subhead, styles.emptyText]}>Start a game or a club with Create new.</Text>
        </Animated.View>
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

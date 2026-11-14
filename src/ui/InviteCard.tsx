import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, type } from '../constants/theme';
import { gameStatus, spotsLeft, type Club, type Game, type Place } from '../state/models';
import { isTomorrow, monthDay, time } from '../lib/format';
import { useStore } from '../state/store';
import { ProgressiveBlurImage } from './CoverImage';
import { SportBackdrop } from './SportBackdrop';

/** Short, human date line for a card: "Today · 7:00 PM", "Tomorrow · 7:00 PM", "Fri, Nov 13 · 7:00 PM". */
export function inviteWhen(game: Game, now: Date) {
  const day = game.start.toDateString() === now.toDateString() ? 'Today' : isTomorrow(game.start, now) ? 'Tomorrow' : monthDay(game.start);
  return `${day} · ${time(game.start)}`;
}

/**
 * Modern photo card: photo fills the card, progressive blur dissolves it into the page background color,
 * dark title and location sit on that light wash. One minimal glass pill top-right for time / LIVE.
 */
export function InviteCard({
  game,
  place,
  club: _club,
  image,
  now,
  width,
  height,
  onPress,
}: {
  game: Game;
  place: Place | undefined;
  club: Club | undefined;
  image: ImageSourcePropType | null;
  now: Date;
  width: number;
  height: number;
  onPress: () => void;
}) {
  const store = useStore();
  const live = gameStatus(game, now) === 'live';
  const going = game.myRSVP === 'going';
  const weekly = store.isWeekly(game);
  const left = spotsLeft(game);
  const where = place ? place.name : '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${game.title}, ${inviteWhen(game, now)}${where ? `, ${where}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width, height }, pressed && styles.pressed]}
    >
      {image
        ? <Image source={image} resizeMode="cover" accessibilityIgnoresInvertColors style={styles.image} />
        : <SportBackdrop sport={game.sport} />
      }

      {/* Progressive blur from the mid-point down */}
      {image ? <ProgressiveBlurImage source={image} from={0.38} to={0.82} radius={26} /> : null}

      {/* Dissolve into page background at the bottom so dark text reads clearly */}
      <LinearGradient
        colors={['transparent', colors.bg]}
        locations={[0.52, 0.94]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top: status pill only, right-aligned */}
      <View style={styles.top}>
        <View style={[styles.pill, live && styles.pillLive]}>
          {live ? <View style={styles.liveDot} /> : null}
          <Text style={[type.caption2, styles.pillText]}>{live ? 'LIVE' : inviteWhen(game, now)}</Text>
        </View>
      </View>

      {/* Bottom: title, location, minimal status */}
      <View style={styles.bottom}>
        <Text style={[type.title2, styles.title]} numberOfLines={2}>{game.title}</Text>
        {where ? (
          <Text style={[type.footnote, styles.where]} numberOfLines={1}>{where}</Text>
        ) : null}
        {going ? (
          <View style={styles.rsvpRow}>
            <Ionicons name={weekly ? 'repeat' : 'checkmark-circle'} size={13} color={colors.brand} />
            <Text style={[type.caption2, styles.rsvpText]}>{weekly ? "You're in · Weekly" : "You're in"}</Text>
          </View>
        ) : left > 0 ? (
          <Text style={[type.caption2, styles.spots]}>{left} spot{left !== 1 ? 's' : ''} left</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.sheet, overflow: 'hidden', backgroundColor: colors.fill },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  image: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  top: { flexDirection: 'row', justifyContent: 'flex-end', padding: space.md },
  pill: {
    height: 26, paddingHorizontal: 10, borderRadius: radius.full,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  pillLive: { backgroundColor: 'rgba(200,0,0,0.82)' },
  pillText: { color: colors.white, fontWeight: '700', letterSpacing: 0.1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  bottom: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: space.lg, paddingBottom: space.xl, paddingTop: space.sm,
    gap: 3,
  },
  title: { color: colors.label, fontWeight: '700' },
  where: { color: colors.label2 },
  rsvpRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rsvpText: { color: colors.brand, fontWeight: '600' },
  spots: { color: colors.label3, marginTop: 2 },
});

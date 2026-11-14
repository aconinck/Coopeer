import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, shadow, space, type } from '../constants/theme';
import { gameStatus, spotsLeft, type Club, type Game, type Place } from '../state/models';
import { isTomorrow, monthDay, time } from '../lib/format';
import { useStore } from '../state/store';
import { AvatarStack, SportIcon } from './Display';
import { ProgressiveBlurImage } from './CoverImage';
import { SportBackdrop } from './SportBackdrop';

/** Short, human date line for a card: "Today · 7:00 PM", "Tomorrow · 7:00 PM", "Fri, Nov 13 · 7:00 PM". */
export function inviteWhen(game: Game, now: Date) {
  const day = game.start.toDateString() === now.toDateString() ? 'Today' : isTomorrow(game.start, now) ? 'Tomorrow' : monthDay(game.start);
  return `${day} · ${time(game.start)}`;
}

/**
 * Apple Invites style card: the place photo fills it, a soft gradient at the bottom carries the title,
 * where and when. One sport icon top-left, one Live / when pill top-right. No other chrome.
 */
export function InviteCard({
  game,
  place,
  club,
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
      {image ? <Image source={image} resizeMode="cover" accessibilityIgnoresInvertColors style={styles.image} /> : <SportBackdrop sport={game.sport} />}
      {image ? <ProgressiveBlurImage source={image} from={0.4} to={1} radius={22} /> : null}

      <View style={styles.top}>
        <SportIcon sport={game.sport} size={36} ring />
        <View style={[styles.pill, live && styles.pillLive]}>
          {live ? <View style={styles.liveDot} /> : null}
          <Text style={[type.footnote, styles.pillText]}>{live ? 'LIVE' : inviteWhen(game, now)}</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={[type.largeTitle, styles.title]} numberOfLines={2}>
          {game.title}
        </Text>
        <View style={styles.meta}>
          <MaterialCommunityIcons name="map-marker" size={15} color="rgba(255,255,255,0.85)" />
          <Text style={[type.subhead, styles.metaText]} numberOfLines={1}>
            {where}
            {club ? ` · ${club.name}` : ' · Open game'}
          </Text>
        </View>
        <View style={styles.footer}>
          {game.going.length > 0 ? <AvatarStack members={game.going} total={game.going.length} size={26} limit={4} /> : <View />}
          {going ? (
            <View style={styles.reply}>
              <Ionicons name={weekly ? 'repeat' : 'checkmark'} size={14} color={colors.white} />
              <Text style={[type.footnote, styles.pillText]}>{weekly ? "You're in · Weekly" : "You're in"}</Text>
            </View>
          ) : (
            <Text style={[type.footnote, styles.spots]}>
              {game.seriesId ? 'Weekly · ' : ''}
              {left === 0 ? 'Full' : `${left} spots left`}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.sheet, overflow: 'hidden', backgroundColor: colors.gray3, ...shadow.glass },
  pressed: { opacity: 0.94 },
  image: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.lg },
  pill: { height: 32, paddingHorizontal: 14, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.38)' },
  pillLive: { backgroundColor: colors.live },
  pillText: { color: colors.white, fontWeight: '700', fontVariant: ['tabular-nums'] },
  reply: { height: 28, paddingHorizontal: 12, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.going },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.white },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, gap: 6 },
  title: { color: colors.white, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: 'rgba(255,255,255,0.92)', flexShrink: 1, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xs },
  spots: { color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
});

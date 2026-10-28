import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { enter } from '../constants/motion';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../constants/theme';
import { gameStatus, spotsLeft, sports, type Club, type Game } from '../state/models';
import { useStore } from '../state/store';
import { useSession } from '../state/session';
import { isTomorrow, time, weekday } from '../lib/format';
import { TextButton, haptic, usePressScale } from './Buttons';
import { AvatarStack, ClubLogo, KindTag, StatusBadge, Tag, VerifiedBadge, card } from './Display';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Tappable card: springs down on press, and staggers in when given a list index. */
function PressCard({
  index,
  onPress,
  style,
  grow,
  width,
  children,
}: {
  index?: number;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  grow?: boolean;
  width?: number;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const press = usePressScale(0.98, 0.9);
  const entering = index === undefined || reduceMotion ? undefined : enter(index);
  return (
    <Animated.View entering={entering} style={[grow && styles.grow, width !== undefined && { width }]}>
      <AnimatedPressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[style, press.style]}
      >
        {children}
      </AnimatedPressable>
    </Animated.View>
  );
}

/**
 * The one way a game is shown in any list. Calm, airy card: a soft tinted tag (sport • kind) with
 * who's going on the right, a big title, one quiet meta line (time • place), then spots and the
 * main action as a pill — tap "I'm in" without opening the game.
 */
export function GameRow({ game, showPlace = true, onPress, index }: { game: Game; showPlace?: boolean; onPress: () => void; index?: number }) {
  const store = useStore();
  const session = useSession();
  const club = game.clubId ? store.club(game.clubId) : undefined;
  const place = store.place(game.placeId);
  const status = gameStatus(game, store.now);
  const isLive = status === 'live';
  const left = spotsLeft(game);
  const sport = sports[game.sport];
  const day = isLive ? 'Started' : status === 'soon' || status === 'today' ? 'Today' : isTomorrow(game.start, store.now) ? 'Tomorrow' : weekday(game.start);
  const going = game.myRSVP === 'going';
  const ended = status === 'ended' || game.isCanceled;
  const tone = isLive ? colors.live : sport.color;

  const imIn = () =>
    session.requireAuth(() => {
      haptic.success();
      store.setRSVP(game.id, 'going');
    });

  return (
    <PressCard index={index} onPress={onPress} style={styles.gameCard}>
      <View style={styles.gameTop}>
        <Tag
          live={isLive}
          icon={sport.icon}
          iconColor={sport.color}
          color={tone}
          segments={[isLive ? 'Live' : sport.label, club ? 'Club game' : 'Open game']}
        />
        <AvatarStack members={game.going} total={game.going.length} size={32} limit={3} />
      </View>

      <View style={styles.gameText}>
        <Text style={[styles.gameTitle, game.isCanceled && styles.strike]} numberOfLines={2}>
          {game.title}
        </Text>
        <View style={styles.metaLine}>
          <Text style={[type.subhead, styles.meta]} numberOfLines={1}>
            {day} · {time(game.start)} – {time(game.end)}
          </Text>
        </View>
        <Text style={[type.subhead, styles.meta]} numberOfLines={1}>
          {showPlace && place ? place.name : club?.name ?? 'Open to everyone'}
          {showPlace && place && club ? ` · ${club.name}` : ''}
        </Text>
      </View>

      <View style={styles.gameBottom}>
        <View style={styles.spots}>
          <Text style={styles.spotsValue}>{left === 0 ? 'Full' : left}</Text>
          <Text style={[type.footnote, styles.meta]}>{left === 0 ? `${game.going.length} going` : left === 1 ? 'spot left' : 'spots left'}</Text>
        </View>
        {ended ? (
          <StatusBadge kind={game.isCanceled ? 'canceled' : 'full'} />
        ) : going ? (
          <View style={[styles.cta, styles.ctaDone]}>
            <Ionicons name="checkmark" size={16} color={colors.going} />
            <Text style={[styles.ctaText, { color: colors.going }]}>You're in</Text>
          </View>
        ) : left === 0 ? (
          <View style={[styles.cta, styles.ctaMuted]}>
            <Text style={[styles.ctaText, { color: colors.label2 }]}>Full</Text>
          </View>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel={`I'm in for ${game.title}`} onPress={imIn} hitSlop={6} style={({ pressed }) => [styles.cta, { backgroundColor: isLive ? colors.live : colors.brand }, pressed && styles.ctaPressed]}>
            <Text style={[styles.ctaText, { color: colors.white }]}>{isLive ? 'Join now' : "I'm in"}</Text>
          </Pressable>
        )}
      </View>
    </PressCard>
  );
}

/** The one way a club is shown in any list. */
export function ClubRow({ club, onPress, index }: { club: Club; onPress: () => void; index?: number }) {
  const store = useStore();
  const isMember = store.isMember(club.id);
  return (
    <PressCard index={index} onPress={onPress} style={styles.card}>
      <ClubLogo club={club} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <KindTag kind="club" />
          {isMember ? <StatusBadge kind="member" /> : club.isNew ? <StatusBadge kind="new" /> : null}
        </View>
        <View style={styles.nameLine}>
          <Text style={[type.headline, styles.shrink]} numberOfLines={1}>
            {club.name}
          </Text>
          {club.verified && <VerifiedBadge />}
        </View>
        <Text style={[type.subhead, { color: colors.label2 }]}>{club.cadence}</Text>
        <View style={styles.topLine}>
          <Text style={[type.footnote, { color: colors.label2 }]}>
            {club.memberCount} members · {club.level}
          </Text>
          <AvatarStack members={club.members} total={club.memberCount} size={20} limit={3} />
        </View>
      </View>
    </PressCard>
  );
}

/**
 * Club card for grids and rails, same family as GameRow: logo + verified seal, a big name,
 * the weekly rhythm as a soft tag, and members with the next game at the bottom.
 */
export function ClubCard({ club, onPress, index, width }: { club: Club; onPress: () => void; index?: number; width?: number }) {
  const store = useStore();
  const next = store.nextGameFor(club.id);
  const status = next ? gameStatus(next, store.now) : null;
  const sport = sports[club.sport];
  const nextText = !next
    ? 'No games yet'
    : status === 'live'
      ? 'Live now'
      : status === 'soon' || status === 'today'
        ? `Today ${time(next.start)}`
        : `${weekday(next.start)} ${time(next.start)}`;

  return (
    <PressCard index={index} onPress={onPress} grow={width === undefined} width={width} style={[styles.clubCard, width === undefined && styles.grow]}>
      <View style={styles.clubTop}>
        <ClubLogo club={club} size={44} />
        {club.isNew ? <StatusBadge kind="new" /> : club.verified ? <VerifiedBadge size={20} /> : null}
      </View>
      <View style={styles.clubText}>
        <Text style={styles.clubName} numberOfLines={2}>
          {club.name}
        </Text>
        <Text style={[type.footnote, styles.meta]} numberOfLines={1}>
          {sport.label} · {club.memberCount} members
        </Text>
      </View>
      <View style={[styles.nextPill, { backgroundColor: status === 'live' ? 'rgba(255,59,48,0.10)' : colors.surface2 }]}>
        <View style={[styles.nextDot, { backgroundColor: status === 'live' ? colors.live : next ? colors.going : colors.label3 }]} />
        <Text style={[type.footnote, { fontWeight: '600', color: status === 'live' ? colors.live : colors.label }]} numberOfLines={1}>
          {nextText}
        </Text>
      </View>
    </PressCard>
  );
}

export function LinkRow({ title, subtitle, icon, onPress, index }: { title: string; subtitle: string; icon: 'location' | 'link'; onPress: () => void; index?: number }) {
  return (
    <PressCard index={index} onPress={onPress} style={[styles.card, { alignItems: 'center' }]}>
      <Ionicons name={icon} size={20} color={colors.brand} style={{ width: 28, textAlign: 'center' }} />
      <View style={styles.body}>
        <Text style={[type.subhead, { fontWeight: '600' }]}>{title}</Text>
        <Text style={[type.footnote, { color: colors.label2 }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.label3} />
    </PressCard>
  );
}

/** Teaches the core concept: games are one-time, clubs are recurring. */
export function GamesVsClubsCard({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <View style={[card, { padding: space.lg, gap: space.md }]}>
      <View style={styles.topLine}>
        <Text style={type.headline}>How Coopeer works</Text>
        {onDismiss && <TextButton title="Got it" onPress={onDismiss} />}
      </View>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Explainer icon="calendar" title="Game" text="Happens once. Tap “I'm in”, show up, play. No commitment." />
        <Explainer icon="people" title="Club" text="Plays every week. Join once and all its games land in your schedule." />
      </View>
      <View style={[styles.topLine, { justifyContent: 'flex-start', gap: space.sm }]}>
        <Ionicons name="location" size={14} color={colors.label2} />
        <Text style={[type.footnote, { color: colors.label2, flex: 1 }]}>Every pin is a place. Many clubs and games can share one.</Text>
      </View>
    </View>
  );
}

function Explainer({ icon, title, text }: { icon: 'calendar' | 'people'; title: string; text: string }) {
  return (
    <View style={{ flex: 1, gap: space.xs }}>
      <View style={[styles.topLine, { justifyContent: 'flex-start', gap: 6 }]}>
        <Ionicons name={icon} size={15} color={colors.brand} />
        <Text style={[type.subhead, { fontWeight: '700', color: colors.brand }]}>{title}</Text>
      </View>
      <Text style={[type.footnote, { color: colors.label2 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...card, flexDirection: 'row', gap: space.md, padding: space.md },
  gameCard: { ...card, padding: space.lg, gap: space.lg },
  gameTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  gameText: { gap: 2 },
  gameTitle: { fontSize: 22, lineHeight: 27, fontWeight: '600', letterSpacing: -0.4, color: colors.label, marginBottom: 4 },
  metaLine: { flexDirection: 'row', alignItems: 'center' },
  meta: { color: colors.label2 },
  gameBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  spots: { gap: 0 },
  spotsValue: { fontSize: 26, lineHeight: 30, fontWeight: '600', letterSpacing: -0.5, color: colors.label, fontVariant: ['tabular-nums'] },
  cta: { height: 44, paddingHorizontal: 22, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  ctaText: { fontSize: 16, fontWeight: '600' },
  ctaDone: { backgroundColor: 'rgba(48,179,90,0.12)' },
  ctaMuted: { backgroundColor: colors.fill },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  clubCard: { ...card, padding: space.lg, gap: space.md },
  clubTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clubText: { gap: 2, minHeight: 64 },
  clubName: { fontSize: 18, lineHeight: 23, fontWeight: '600', letterSpacing: -0.3, color: colors.label },
  nextPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', height: 30, paddingHorizontal: 12, borderRadius: radius.full, maxWidth: '100%' },
  nextDot: { width: 7, height: 7, borderRadius: 4 },
  nameLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  shrink: { flexShrink: 1 },
  body: { flex: 1, gap: 3 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  strike: { textDecorationLine: 'line-through' },
  grow: { flex: 1 },
});

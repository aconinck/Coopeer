import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { enter } from '../constants/motion';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, type } from '../constants/theme';
import { gameStatus, spotsLeft, type Club, type Game } from '../state/models';
import { useStore } from '../state/store';
import { time, weekday } from '../lib/format';
import { TextButton, usePressScale } from './Buttons';
import { AvatarStack, ClubLogo, DateTile, KindTag, StatusBadge, card, gameBadge } from './Display';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Tappable card: springs down on press, and staggers in when given a list index. */
function PressCard({
  index,
  onPress,
  style,
  grow,
  children,
}: {
  index?: number;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  grow?: boolean;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const press = usePressScale(0.98, 0.9);
  const entering = index === undefined || reduceMotion ? undefined : enter(index);
  return (
    <Animated.View entering={entering} style={grow && styles.grow}>
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

/** The one way a game is shown in any list. */
export function GameRow({ game, showPlace = true, onPress, index }: { game: Game; showPlace?: boolean; onPress: () => void; index?: number }) {
  const store = useStore();
  const club = game.clubId ? store.club(game.clubId) : undefined;
  const place = store.place(game.placeId);
  const badge = gameBadge(game, club ? store.isMember(club.id) : false, store.now);
  const isLive = gameStatus(game, store.now) === 'live';
  const left = spotsLeft(game);
  const host = club?.name ?? 'Open to everyone';

  return (
    <PressCard index={index} onPress={onPress} style={[styles.card, isLive && styles.liveCard]}>
      <DateTile game={game} now={store.now} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <KindTag kind={club ? 'clubGame' : 'openGame'} />
          {badge && <StatusBadge kind={badge} />}
        </View>
        <Text style={[type.headline, game.isCanceled && styles.strike]} numberOfLines={1}>
          {game.title}
        </Text>
        <Text style={[type.subhead, { color: colors.label2 }]} numberOfLines={1}>
          {showPlace && place ? `${place.name} · ${host}` : host}
        </Text>
        <View style={styles.topLine}>
          <Text style={[type.footnote, { color: colors.label2 }]}>
            {left === 0 ? `${game.going.length} going · full` : `${game.going.length} going · ${left} spots left`}
          </Text>
          <AvatarStack members={game.going} size={20} limit={3} />
        </View>
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
        <Text style={type.headline} numberOfLines={1}>
          {club.name}
        </Text>
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

/** Figma "Seus Clubes" grid card. */
export function ClubCard({ club, onPress, index }: { club: Club; onPress: () => void; index?: number }) {
  const store = useStore();
  const next = store.nextGameFor(club.id);
  const status = next ? gameStatus(next, store.now) : null;
  const nextText = !next
    ? 'Nothing scheduled'
    : status === 'live'
      ? 'Live now'
      : status === 'soon' || status === 'today'
        ? `Today · ${time(next.start)}`
        : `${weekday(next.start)} · ${time(next.start)}`;

  return (
    <PressCard index={index} onPress={onPress} grow style={[styles.gridCard, club.isNew && styles.newCard]}>
      <View style={styles.topLine}>
        <ClubLogo club={club} size={40} />
        {club.isNew && <StatusBadge kind="new" />}
      </View>
      <Text style={[type.headline, { minHeight: 44 }]} numberOfLines={2}>
        {club.name}
      </Text>
      <View>
        <Text style={[type.caption, { color: colors.label2 }]}>Next game</Text>
        <Text style={[type.subhead, { fontWeight: '500', color: status === 'live' ? colors.live : colors.label }]} numberOfLines={1}>
          {nextText}
        </Text>
      </View>
      <AvatarStack members={club.members} total={club.memberCount} size={22} limit={3} />
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
  liveCard: { borderColor: 'rgba(255,59,48,0.45)', borderWidth: 1 },
  newCard: { borderColor: 'rgba(255,97,0,0.45)', borderWidth: 1 },
  gridCard: { ...card, flex: 1, padding: space.md, gap: space.sm },
  body: { flex: 1, gap: 3 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  strike: { textDecorationLine: 'line-through' },
  grow: { flex: 1 },
});

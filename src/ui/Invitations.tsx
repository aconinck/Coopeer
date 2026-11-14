import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space, type } from '../constants/theme';
import { sports, type Club, type ClubInvite, type Game } from '../state/models';
import { useSession } from '../state/session';
import { useStore } from '../state/store';
import { PrimaryButton, SecondaryButton, haptic } from './Buttons';
import { Avatar, ClubLogo, SectionHeader, card } from './Display';
import { inviteWhen } from './InviteCard';

const firstName = (name: string) => name.split(' ')[0];

/**
 * Personal invitations, nothing else: someone asked you to join a club, or to play a game. A club's own games and
 * open games are never listed here. Each one answers in place; tapping the text opens it first.
 */
export function Invitations({ onOpenClub, onOpenGame, clubsOnly }: { onOpenClub: (club: Club) => void; onOpenGame: (game: Game) => void; clubsOnly?: boolean }) {
  const store = useStore();
  const clubInvites = store.clubInvites;
  const gameInvites = clubsOnly ? [] : store.gameInvites;
  if (clubInvites.length + gameInvites.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Invitations" caption={clubsOnly ? 'People who asked you to join their club.' : 'People who asked you personally.'} />
      {clubInvites.map((invite) => (
        <ClubInvitation key={invite.id} invite={invite} onOpen={onOpenClub} />
      ))}
      {gameInvites.map((game) => (
        <GameInvitation key={game.id} game={game} onOpen={onOpenGame} />
      ))}
    </View>
  );
}

function ClubInvitation({ invite, onOpen }: { invite: ClubInvite; onOpen: (club: Club) => void }) {
  const store = useStore();
  const session = useSession();
  const club = store.club(invite.clubId);
  if (!club) return null;
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${club.name}, invited by ${invite.from.name}`} onPress={() => onOpen(club)} style={({ pressed }) => [styles.top, pressed && styles.pressed]}>
        <ClubLogo club={club} size={52} />
        <View style={styles.text}>
          <Text style={[type.footnote, styles.from]} numberOfLines={1}>
            {firstName(invite.from.name)} invited you to join
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {club.name}
          </Text>
          <Text style={[type.footnote, styles.from]} numberOfLines={1}>
            {sports[club.sport].label} · {club.memberCount} members · {club.cadence}
          </Text>
        </View>
        <Avatar member={invite.from} size={28} />
      </Pressable>
      <View style={styles.actions}>
        <SecondaryButton title="Not now" onPress={() => store.dismissClubInvite(invite.id)} />
        <PrimaryButton
          title="Join club"
          onPress={() =>
            session.requireAuth(() => {
              haptic.success();
              store.acceptClubInvite(invite.id);
            })
          }
        />
      </View>
    </View>
  );
}

function GameInvitation({ game, onOpen }: { game: Game; onOpen: (game: Game) => void }) {
  const store = useStore();
  const session = useSession();
  const from = game.invitedBy;
  const place = store.place(game.placeId);
  if (!from) return null;
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${game.title}, invited by ${from.name}`} onPress={() => onOpen(game)} style={({ pressed }) => [styles.top, pressed && styles.pressed]}>
        <Avatar member={from} size={52} />
        <View style={styles.text}>
          <Text style={[type.footnote, styles.from]} numberOfLines={1}>
            {firstName(from.name)} invited you to play
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {game.title}
          </Text>
          <Text style={[type.footnote, styles.from]} numberOfLines={1}>
            {inviteWhen(game, store.now)}
            {place ? ` · ${place.name}` : ''}
          </Text>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <SecondaryButton title="Can't go" onPress={() => session.requireAuth(() => store.setRSVP(game.id, 'declined'))} />
        <PrimaryButton
          title="I'm in"
          onPress={() =>
            session.requireAuth(() => {
              haptic.success();
              store.setRSVP(game.id, 'going');
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  card: { ...card, padding: space.lg, gap: space.lg },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pressed: { opacity: 0.8 },
  text: { flex: 1, gap: 2 },
  from: { color: colors.label2 },
  title: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: -0.3, color: colors.label },
  actions: { flexDirection: 'row', gap: space.sm },
});

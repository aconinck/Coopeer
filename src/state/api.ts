import { supabase } from '../lib/supabase';
import type { PlayedGame } from './profile';
import { ME, type Club, type ClubLink, type Game, type Member, type NewProfile, type Place, type PlaceKind, type RSVP, type SkillLevel, type SportId, type User } from './models';

// Supabase reads and writes. Rows are mapped to the same models the screens already use;
// the signed-in user's profile always maps to ME, so "is this me?" checks keep working.

type ProfileRow = { id: string; name: string };
type PlaceRow = {
  id: string;
  kind: PlaceKind;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  sports: SportId[];
  photos: { uri: string; credit?: string }[] | null;
};
type ClubRow = {
  id: string;
  name: string;
  sport: SportId;
  home_place_id: string;
  cadence: string;
  about: string;
  links: ClubLink[] | null;
  monthly_price: number;
  level: SkillLevel;
  code: string;
  verified: boolean;
  photo_uri: string | null;
  owner_id: string | null;
  payout_last4: string | null;
  created_at: string;
  club_members: { user_id: string; role: 'member' | 'admin'; joined_at: string; profiles: ProfileRow | null }[];
};
type GameRow = {
  id: string;
  sport: SportId;
  place_id: string;
  club_id: string | null;
  title: string;
  details: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  drop_in_price: number;
  level: SkillLevel;
  is_canceled: boolean;
  host_id: string | null;
  created_at: string;
  rsvps: { user_id: string; status: 'going' | 'declined' | 'invited'; updated_at: string; profiles: ProfileRow | null }[];
};

export interface Snapshot {
  places: Place[];
  clubs: Club[];
  games: Game[];
  memberships: Set<string>;
}

const NEW_DAYS = 14;
const isRecent = (iso: string, days: number) => Date.now() - new Date(iso).getTime() < days * 24 * 3600 * 1000;

function db() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function fetchAll(uid: string): Promise<Snapshot> {
  const client = db();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [places, clubs, games] = await Promise.all([
    client.from('places').select('*'),
    client.from('clubs').select('*, club_members(user_id, role, joined_at, profiles(id, name))'),
    client.from('games').select('*, rsvps(user_id, status, updated_at, profiles(id, name))').gte('ends_at', since).order('starts_at'),
  ]);
  fail(places.error);
  fail(clubs.error);
  fail(games.error);

  const member = (p: ProfileRow | null, id: string): Member => (id === uid ? ME : { id, name: p?.name ?? 'Player' });
  const me = (id: string | null) => (id === uid ? ME.id : id ?? undefined);

  const memberships = new Set<string>();
  const mappedClubs = ((clubs.data ?? []) as ClubRow[]).map((c): Club => {
    const rows = [...c.club_members].sort((a, b) => a.joined_at.localeCompare(b.joined_at));
    if (rows.some((m) => m.user_id === uid)) memberships.add(c.id);
    const members = rows.map((m) => member(m.profiles, m.user_id));
    return {
      id: c.id,
      name: c.name,
      sport: c.sport,
      homePlaceId: c.home_place_id,
      cadence: c.cadence,
      about: c.about,
      links: c.links ?? [],
      members,
      memberCount: members.length,
      monthlyPrice: Number(c.monthly_price),
      level: c.level,
      code: c.code,
      isNew: isRecent(c.created_at, NEW_DAYS),
      verified: c.verified,
      photoUri: c.photo_uri ?? undefined,
      ownerId: me(c.owner_id),
      adminIds: rows.filter((m) => m.role === 'admin' || m.user_id === c.owner_id).map((m) => (m.user_id === uid ? ME.id : m.user_id)),
      payoutLast4: c.payout_last4 ?? undefined,
    };
  });

  const mappedGames = ((games.data ?? []) as GameRow[]).map((g): Game => {
    const by = (status: string) =>
      g.rsvps
        .filter((r) => r.status === status)
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
        .map((r) => member(r.profiles, r.user_id));
    const mine = g.rsvps.find((r) => r.user_id === uid)?.status;
    const myRSVP: RSVP = mine === 'going' || mine === 'declined' ? mine : 'none';
    return {
      id: g.id,
      sport: g.sport,
      placeId: g.place_id,
      clubId: g.club_id,
      title: g.title,
      details: g.details,
      start: new Date(g.starts_at),
      end: new Date(g.ends_at),
      capacity: g.capacity,
      going: by('going'),
      declined: by('declined'),
      noResponse: by('invited'),
      dropInPrice: Number(g.drop_in_price),
      level: g.level,
      myRSVP,
      isCanceled: g.is_canceled,
      isNew: isRecent(g.created_at, 2),
    };
  });

  const mappedPlaces = ((places.data ?? []) as PlaceRow[]).map(
    (p): Place => ({
      id: p.id,
      kind: p.kind,
      name: p.name,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      sports: p.sports,
      photos: p.photos?.length ? p.photos : undefined,
    }),
  );

  return { places: mappedPlaces, clubs: mappedClubs, games: mappedGames, memberships };
}

/** Calls `onChange` (debounced) whenever places, clubs, members, games or RSVPs change. Returns unsubscribe. */
export function subscribe(onChange: () => void) {
  const client = db();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const bump = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onChange, 300);
  };
  const channel = client.channel('coopeer-data');
  for (const table of ['places', 'clubs', 'club_members', 'games', 'rsvps']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, bump);
  }
  channel.subscribe();
  return () => {
    if (timer) clearTimeout(timer);
    client.removeChannel(channel);
  };
}

export async function joinClub(uid: string, clubId: string) {
  fail((await db().from('club_members').upsert({ club_id: clubId, user_id: uid }, { onConflict: 'club_id,user_id', ignoreDuplicates: true })).error);
}

export async function leaveClub(uid: string, clubId: string) {
  fail((await db().from('club_members').delete().eq('club_id', clubId).eq('user_id', uid)).error);
}

export async function setRSVP(uid: string, gameId: string, rsvp: RSVP) {
  const table = db().from('rsvps');
  if (rsvp === 'none') fail((await table.delete().eq('game_id', gameId).eq('user_id', uid)).error);
  else fail((await table.upsert({ game_id: gameId, user_id: uid, status: rsvp, updated_at: new Date().toISOString() }, { onConflict: 'game_id,user_id' })).error);
}

export async function createClub(uid: string, club: Club) {
  const client = db();
  fail(
    (
      await client.from('clubs').insert({
        id: club.id,
        name: club.name,
        sport: club.sport,
        home_place_id: club.homePlaceId,
        cadence: club.cadence,
        about: club.about,
        links: club.links,
        monthly_price: club.monthlyPrice,
        level: club.level,
        code: club.code,
        photo_uri: club.photoUri ?? null,
        owner_id: uid,
        payout_last4: club.payoutLast4 ?? null,
      })
    ).error,
  );
  fail((await client.from('club_members').insert({ club_id: club.id, user_id: uid, role: 'admin' })).error);
}

export async function setClubCadence(clubId: string, cadence: string) {
  fail((await db().from('clubs').update({ cadence }).eq('id', clubId)).error);
}

export async function createGames(uid: string, games: Game[], inviteeIds: string[]) {
  const client = db();
  fail(
    (
      await client.from('games').insert(
        games.map((g) => ({
          id: g.id,
          sport: g.sport,
          place_id: g.placeId,
          club_id: g.clubId,
          title: g.title,
          details: g.details,
          starts_at: g.start.toISOString(),
          ends_at: g.end.toISOString(),
          capacity: g.capacity,
          drop_in_price: g.dropInPrice,
          level: g.level,
          host_id: uid,
        })),
      )
    ).error,
  );
  const rsvps = games.flatMap((g) => [
    { game_id: g.id, user_id: uid, status: 'going' },
    ...inviteeIds.filter((id) => id !== ME.id && id !== uid).map((id) => ({ game_id: g.id, user_id: id, status: 'invited' })),
  ]);
  fail((await client.from('rsvps').insert(rsvps)).error);
}

export async function savePlace(uid: string, place: Place, isNew: boolean) {
  const table = db().from('places');
  if (isNew) {
    fail(
      (
        await table.insert({
          id: place.id,
          kind: place.kind,
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          sports: place.sports,
          photos: place.photos ?? [],
          created_by: uid,
        })
      ).error,
    );
  } else {
    fail((await table.update({ sports: place.sports }).eq('id', place.id)).error);
  }
}

// Profiles -------------------------------------------------------------------

type ProfileFull = { id: string; phone: string | null; name: string; birth_year: number | null; sports: SportId[] | null; goal: User['goal'] | null };

export async function loadProfile(uid: string, phone: string): Promise<User | null> {
  const { data, error } = await db().from('profiles').select('id, phone, name, birth_year, sports, goal').eq('id', uid).maybeSingle();
  fail(error);
  if (!data) return null;
  const row = data as ProfileFull;
  return { id: row.id, phone: row.phone ?? phone, name: row.name, birthYear: row.birth_year ?? undefined, sports: row.sports ?? [], goal: row.goal ?? undefined };
}

export async function saveProfile(uid: string, phone: string, profile: NewProfile) {
  fail(
    (
      await db()
        .from('profiles')
        .upsert({ id: uid, phone, name: profile.name, birth_year: profile.birthYear ?? null, sports: profile.sports ?? [], goal: profile.goal ?? null })
    ).error,
  );
}

export async function updateProfileName(uid: string, name: string) {
  fail((await db().from('profiles').update({ name }).eq('id', uid)).error);
}

// Player history -------------------------------------------------------------------

export interface PlayerData {
  name: string;
  sports: SportId[];
  createdAt?: Date;
  played: PlayedGame[];
  clubIds: string[];
}

/** A player's profile plus every ended game they were "going" to. Separate from fetchAll, which only keeps recent games. */
export async function fetchPlayer(userId: string): Promise<PlayerData | null> {
  const client = db();
  const [profile, rsvps, memberships] = await Promise.all([
    client.from('profiles').select('name, sports, created_at').eq('id', userId).maybeSingle(),
    client
      .from('rsvps')
      .select('games!inner(sport, place_id, starts_at, ends_at, is_canceled)')
      .eq('user_id', userId)
      .eq('status', 'going')
      .eq('games.is_canceled', false)
      .lt('games.ends_at', new Date().toISOString()),
    client.from('club_members').select('club_id').eq('user_id', userId),
  ]);
  fail(profile.error);
  fail(rsvps.error);
  fail(memberships.error);
  if (!profile.data) return null;

  type Row = { games: { sport: SportId; place_id: string; starts_at: string; ends_at: string } | { sport: SportId; place_id: string; starts_at: string; ends_at: string }[] | null };
  const played: PlayedGame[] = [];
  for (const row of (rsvps.data ?? []) as unknown as Row[]) {
    const g = Array.isArray(row.games) ? row.games[0] : row.games;
    if (g) played.push({ sport: g.sport, placeId: g.place_id, start: new Date(g.starts_at), end: new Date(g.ends_at) });
  }
  const p = profile.data as { name: string; sports: SportId[] | null; created_at: string };
  return {
    name: p.name,
    sports: p.sports ?? [],
    createdAt: new Date(p.created_at),
    played,
    clubIds: ((memberships.data ?? []) as { club_id: string }[]).map((m) => m.club_id),
  };
}

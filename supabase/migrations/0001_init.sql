-- Coopeer schema: Place · Club · Game, plus profiles, memberships and RSVPs.
-- Ids are text so seeded demo rows keep readable ids (p1, c1, g1) and the app can create ids offline.
-- A signed-in user's profile id is auth.uid()::text.

create table public.profiles (
  id text primary key,
  phone text,
  name text not null,
  birth_year int,
  sports text[] not null default '{}',
  goal text check (goal in ('play', 'join', 'host')),
  created_at timestamptz not null default now()
);

create table public.places (
  id text primary key default gen_random_uuid()::text,
  kind text not null check (kind in ('park', 'field', 'courts', 'trail', 'center')),
  name text not null,
  address text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  sports text[] not null default '{}',
  photos jsonb not null default '[]',
  created_by text references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.clubs (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  sport text not null check (sport in ('soccer', 'pickleball', 'trails')),
  home_place_id text not null references public.places (id),
  cadence text not null default 'No regular time yet',
  about text not null default '',
  links jsonb not null default '[]',
  monthly_price numeric(8, 2) not null default 0,
  level text not null default 'All levels' check (level in ('Casual', 'All levels', 'Competitive')),
  code text not null unique check (code ~ '^\d{8}$'),
  verified boolean not null default false,
  photo_uri text,
  owner_id text references public.profiles (id) on delete set null,
  payout_last4 text,
  created_at timestamptz not null default now()
);

create table public.club_members (
  club_id text not null references public.clubs (id) on delete cascade,
  user_id text not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table public.games (
  id text primary key default gen_random_uuid()::text,
  sport text not null check (sport in ('soccer', 'pickleball', 'trails')),
  place_id text not null references public.places (id),
  club_id text references public.clubs (id) on delete cascade,
  title text not null,
  details text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null default 14 check (capacity > 0),
  drop_in_price numeric(8, 2) not null default 7,
  level text not null default 'All levels' check (level in ('Casual', 'All levels', 'Competitive')),
  is_canceled boolean not null default false,
  host_id text references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index games_starts_at on public.games (starts_at);
create index games_place on public.games (place_id);

create table public.rsvps (
  game_id text not null references public.games (id) on delete cascade,
  user_id text not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('going', 'declined', 'invited')),
  updated_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

-- Helpers for policies -------------------------------------------------------

create or replace function public.me() returns text language sql stable as $$ select auth.uid()::text $$;

create or replace function public.is_club_admin(club text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from club_members where club_id = club and user_id = auth.uid()::text and role = 'admin')
      or exists (select 1 from clubs where id = club and owner_id = auth.uid()::text)
$$;

-- Row level security ---------------------------------------------------------
-- Everyone signed in can read everything (it is a discovery app). Writes are limited to your own rows.

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.games enable row level security;
alter table public.rsvps enable row level security;

create policy "read profiles" on public.profiles for select to authenticated using (true);
create policy "create own profile" on public.profiles for insert to authenticated with check (id = public.me());
create policy "update own profile" on public.profiles for update to authenticated using (id = public.me());

create policy "read places" on public.places for select to authenticated using (true);
create policy "add places" on public.places for insert to authenticated with check (created_by = public.me());
-- Anyone can add a sport to a place (merging search results); keep it simple for now.
create policy "update places" on public.places for update to authenticated using (true);

create policy "read clubs" on public.clubs for select to authenticated using (true);
create policy "create own club" on public.clubs for insert to authenticated with check (owner_id = public.me());
create policy "admins update club" on public.clubs for update to authenticated using (public.is_club_admin(id));

create policy "read members" on public.club_members for select to authenticated using (true);
create policy "join as yourself" on public.club_members for insert to authenticated
  with check (user_id = public.me() and (role = 'member' or public.is_club_admin(club_id)));
create policy "leave a club" on public.club_members for delete to authenticated using (user_id = public.me());

create policy "read games" on public.games for select to authenticated using (true);
create policy "host games" on public.games for insert to authenticated
  with check (host_id = public.me() and (club_id is null or public.is_club_admin(club_id)));
create policy "host updates game" on public.games for update to authenticated
  using (host_id = public.me() or (club_id is not null and public.is_club_admin(club_id)));

create policy "read rsvps" on public.rsvps for select to authenticated using (true);
create policy "rsvp as yourself or invite" on public.rsvps for insert to authenticated
  with check (
    user_id = public.me()
    or (status = 'invited' and exists (select 1 from public.games g where g.id = game_id and g.host_id = public.me()))
  );
create policy "change your rsvp" on public.rsvps for update to authenticated using (user_id = public.me());
create policy "remove your rsvp" on public.rsvps for delete to authenticated using (user_id = public.me());

-- Realtime: the app refreshes when any of these change ---------------------

alter publication supabase_realtime add table public.places, public.clubs, public.club_members, public.games, public.rsvps;

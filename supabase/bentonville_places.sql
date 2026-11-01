-- Bentonville, AR — complete places dataset.
-- Coordinates verified via OSM/Photon. Safe to re-run (upserts on id).
-- Run this AFTER 0001_init.sql and seed.sql.

begin;

-- ── Update existing places with verified coordinates and full sports ──────────

insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p1', 'field', 'Lawrence Plaza Field',
  '100 NW 1st St, Bentonville, AR 72712',
  36.3729, -94.2088,
  array['soccer']::text[],
  '[]'::jsonb
) on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, address = excluded.address,
  latitude = excluded.latitude, longitude = excluded.longitude,
  sports = excluded.sports, photos = excluded.photos;

-- Memorial Park: verified OSM coords, adds trails to sports
insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p2', 'park', 'Memorial Park',
  '401 NE Martin Luther King Jr Pkwy, Bentonville, AR 72712',
  36.3748655, -94.1853824,
  array['soccer', 'pickleball', 'trails']::text[],
  '[]'::jsonb
) on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, address = excluded.address,
  latitude = excluded.latitude, longitude = excluded.longitude,
  sports = excluded.sports, photos = excluded.photos;

-- Osage Park: updated coords, adds trails for boardwalk
insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p3', 'park', 'Osage Park',
  '700 SW 16th St, Bentonville, AR 72712',
  36.3510, -94.2270,
  array['pickleball', 'trails']::text[],
  '[]'::jsonb
) on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, address = excluded.address,
  latitude = excluded.latitude, longitude = excluded.longitude,
  sports = excluded.sports, photos = excluded.photos;

-- Creekside Park: verified OSM coords, adds trails
insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p4', 'park', 'Creekside Park',
  '3104 SW Bright Rd, Bentonville, AR 72712',
  36.3413489, -94.2382813,
  array['pickleball', 'trails']::text[],
  '[]'::jsonb
) on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, address = excluded.address,
  latitude = excluded.latitude, longitude = excluded.longitude,
  sports = excluded.sports, photos = excluded.photos;

insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p5', 'park', 'Phillips Park',
  '2001 SE J St, Bentonville, AR 72712',
  36.3537, -94.2042,
  array['soccer']::text[],
  '[]'::jsonb
) on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, address = excluded.address,
  latitude = excluded.latitude, longitude = excluded.longitude,
  sports = excluded.sports, photos = excluded.photos;

-- Citizens Park / Community Center: updated name and sports
insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p6', 'center', 'Citizens Park & Community Center',
  '1101 SW Citizens Cir, Bentonville, AR 72712',
  36.3485, -94.2130,
  array['soccer', 'pickleball', 'trails']::text[],
  '[]'::jsonb
) on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, address = excluded.address,
  latitude = excluded.latitude, longitude = excluded.longitude,
  sports = excluded.sports, photos = excluded.photos;

-- Crystal Bridges Trails: keep photo credit
insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p7', 'trail', 'Crystal Bridges Trails',
  '600 Museum Way, Bentonville, AR 72712',
  36.3815, -94.2024,
  array['trails']::text[],
  '[{"uri":"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Crystal_Bridges_Museum_of_American_Art_May_2017_03.jpg/960px-Crystal_Bridges_Museum_of_American_Art_May_2017_03.jpg","credit":"Photo: Michael Barera · CC BY-SA 4.0"}]'::jsonb
) on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, address = excluded.address,
  latitude = excluded.latitude, longitude = excluded.longitude,
  sports = excluded.sports, photos = excluded.photos;

-- Slaughter Pen: updated coords to main trailhead area
insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p8', 'trail', 'Slaughter Pen MTB Park',
  'N Walton Blvd, Bentonville, AR 72712',
  36.3954, -94.2028,
  array['trails']::text[],
  '[]'::jsonb
) on conflict (id) do update set
  kind = excluded.kind, name = excluded.name, address = excluded.address,
  latitude = excluded.latitude, longitude = excluded.longitude,
  sports = excluded.sports, photos = excluded.photos;

-- ── New places ────────────────────────────────────────────────────────────────

insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p9', 'park', 'Orchards Park',
  '1100 NE John Deshields Blvd, Bentonville, AR 72716',
  36.3779, -94.1945,
  array['trails']::text[],
  '[]'::jsonb
) on conflict (id) do nothing;

insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p10', 'park', 'Park Springs Park',
  '300 NW 10th St, Bentonville, AR 72712',
  36.3856109, -94.2114305,
  array['trails']::text[],
  '[]'::jsonb
) on conflict (id) do nothing;

insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p11', 'trail', 'Coler Mountain Bike Preserve',
  '2500 NW Grove Ln, Bentonville, AR 72712',
  36.4010, -94.2250,
  array['trails']::text[],
  '[]'::jsonb
) on conflict (id) do nothing;

insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p12', 'park', 'Lake Bentonville',
  '2100 SW I St, Bentonville, AR 72712',
  36.3575, -94.2240,
  array['trails']::text[],
  '[]'::jsonb
) on conflict (id) do nothing;

insert into public.places (id, kind, name, address, latitude, longitude, sports, photos)
values (
  'p13', 'trail', 'Bentonville Bike Playground',
  '2400 N Walton Blvd, Bentonville, AR 72712',
  36.3940, -94.2045,
  array['trails']::text[],
  '[]'::jsonb
) on conflict (id) do nothing;

commit;

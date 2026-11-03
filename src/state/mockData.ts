import type { Club, Game, Member, Payment, Place } from './models';

// Same as ME in models.ts (not imported: scripts/make_seed.ts loads this file straight in Node).
const ME: Member = { id: 'me', name: 'You' };

// Bentonville, AR — launch market. Game times are relative to app start so
// there is always something live, soon and later.

const people: Member[] = [
  { id: 'm0',  name: 'Alex Rivera',    photoUri: 'https://i.pravatar.cc/150?img=3'  },
  { id: 'm1',  name: 'Jordan Lee',     photoUri: 'https://i.pravatar.cc/150?img=5'  },
  { id: 'm2',  name: 'Sam Torres',     photoUri: 'https://i.pravatar.cc/150?img=8'  },
  { id: 'm3',  name: 'Casey Wong',     photoUri: 'https://i.pravatar.cc/150?img=11' },
  { id: 'm4',  name: 'Taylor Brooks',  photoUri: 'https://i.pravatar.cc/150?img=16' },
  { id: 'm5',  name: 'Morgan Diaz',    photoUri: 'https://i.pravatar.cc/150?img=21' },
  { id: 'm6',  name: 'Riley Chen',     photoUri: 'https://i.pravatar.cc/150?img=25' },
  { id: 'm7',  name: 'Jamie Patel',    photoUri: 'https://i.pravatar.cc/150?img=29' },
  { id: 'm8',  name: 'Drew Carter',    photoUri: 'https://i.pravatar.cc/150?img=33' },
  { id: 'm9',  name: 'Avery Kim',      photoUri: 'https://i.pravatar.cc/150?img=38' },
  { id: 'm10', name: 'Quinn Foster',   photoUri: 'https://i.pravatar.cc/150?img=42' },
  { id: 'm11', name: 'Parker Hughes',  photoUri: 'https://i.pravatar.cc/150?img=47' },
  { id: 'm12', name: 'Reese Morgan',   photoUri: 'https://i.pravatar.cc/150?img=52' },
  { id: 'm13', name: 'Skyler Ward',    photoUri: 'https://i.pravatar.cc/150?img=57' },
  { id: 'm14', name: 'Emerson Hale',   photoUri: 'https://i.pravatar.cc/150?img=61' },
  { id: 'm15', name: 'Rowan Price',    photoUri: 'https://i.pravatar.cc/150?img=65' },
];

const crowd = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, i) => people[(i + offset) % people.length]);

export const places: Place[] = [
  { id: 'p1', kind: 'field', name: 'Lawrence Plaza Field', address: '100 NW 1st St, Bentonville, AR', latitude: 36.3729, longitude: -94.2088, sports: ['soccer'] },
  { id: 'p2', kind: 'park', name: 'Memorial Park', address: '1100 NE J St, Bentonville, AR', latitude: 36.37621, longitude: -94.19123, sports: ['soccer', 'pickleball'] },
  { id: 'p3', kind: 'courts', name: 'Osage Park Courts', address: 'Osage Park, Bentonville, AR', latitude: 36.3554, longitude: -94.21726, sports: ['pickleball'] },
  { id: 'p4', kind: 'courts', name: 'Creekside Park Courts', address: 'Creekside Park, Bentonville, AR', latitude: 36.34012, longitude: -94.23727, sports: ['pickleball'] },
  { id: 'p5', kind: 'park', name: 'Phillips Park', address: '2001 SE J St, Bentonville, AR', latitude: 36.3537, longitude: -94.2042, sports: ['soccer'] },
  { id: 'p6', kind: 'center', name: 'Community Center', address: '1101 SW Citizens Cir, Bentonville, AR', latitude: 36.3631, longitude: -94.229, sports: ['soccer', 'pickleball'] },
  { id: 'p7', kind: 'trail', name: 'Crystal Bridges Trails', address: '600 Museum Way, Bentonville, AR', latitude: 36.3815, longitude: -94.2024, sports: ['trails'],
    photos: [{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Crystal_Bridges_Museum_of_American_Art_May_2017_03.jpg/960px-Crystal_Bridges_Museum_of_American_Art_May_2017_03.jpg', credit: 'Photo: Michael Barera · CC BY-SA 4.0' }] },
  { id: 'p8', kind: 'trail', name: 'Slaughter Pen Trails', address: 'Slaughter Pen Hollow, Bentonville, AR', latitude: 36.3862, longitude: -94.2165, sports: ['trails'] },
  { id: 'p9', kind: 'trail', name: 'Coler Mountain Bike Preserve', address: 'SW 28th St, Bentonville, AR', latitude: 36.3873, longitude: -94.2372, sports: ['trails'],
    photos: [{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/My_secret_spot_%28Unsplash%29.jpg/800px-My_secret_spot_%28Unsplash%29.jpg', credit: 'Jared Sluyter · CC0 1.0' }] },
  { id: 'p10', kind: 'trail', name: 'Handcut Hollow MTB Park', address: 'Handcut Hollow, Bentonville, AR', latitude: 36.3962, longitude: -94.1768, sports: ['trails'] },
  { id: 'p11', kind: 'park', name: 'Town Branch Park', address: '401 SE 5th St, Bentonville, AR', latitude: 36.3713, longitude: -94.2041, sports: ['soccer'],
    photos: [{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/A_Street_Promenade_in_Bentonville%2C_Arkansas.jpg/800px-A_Street_Promenade_in_Bentonville%2C_Arkansas.jpg', credit: 'Brandonrush · CC0 1.0' }] },
  { id: 'p12', kind: 'park', name: 'Park Springs Park', address: 'NW Orchard Dr, Bentonville, AR', latitude: 36.3856, longitude: -94.2114, sports: ['soccer', 'pickleball'],
    photos: [{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Dave_Peel_Park_in_Bentonville%2C_AR.jpg/800px-Dave_Peel_Park_in_Bentonville%2C_AR.jpg', credit: 'Brandonrush · CC0 1.0' }] },
  { id: 'p13', kind: 'park', name: 'Orchards Park', address: 'Orchards Park, Bentonville, AR', latitude: 36.3762, longitude: -94.1953, sports: ['soccer'] },
  { id: 'p14', kind: 'courts', name: 'Enfield Park Courts', address: 'NW Enfield Rd, Bentonville, AR', latitude: 36.3869, longitude: -94.2007, sports: ['pickleball'] },
];

export const clubs: Club[] = [
  {
    id: 'c1', name: 'Bentonville Strikers', sport: 'soccer', homePlaceId: 'p1', cadence: 'Every Fri · 8 PM',
    about: 'Casual Friday night soccer under the lights at Lawrence Plaza. All skill levels — we split teams on the spot and grab beers at Pedaler\'s Pub after. No cleats required.',
    links: [{ title: 'WhatsApp group', url: 'https://chat.whatsapp.com/strikers' }],
    members: crowd(12), memberCount: 34, monthlyPrice: 29, level: 'Casual', code: '12355654', verified: true,
  },
  {
    id: 'c2', name: 'Sunday League', sport: 'soccer', homePlaceId: 'p2', cadence: 'Every Sun · 10 AM',
    about: '11v11 full-size matches at Memorial Park. Intermediate to competitive level — a volunteer referee every game, standings tracked online. Bring both a light and a dark top.',
    links: [{ title: 'League table', url: 'https://sundayleaguenwa.com/standings' }],
    members: crowd(10, 3), memberCount: 48, monthlyPrice: 35, level: 'Competitive', code: '22446688', verified: true,
  },
  {
    id: 'c3', name: 'Osage Park Picklers', sport: 'pickleball', homePlaceId: 'p3', cadence: 'Every Sat · 9 AM',
    about: 'Friendly Saturday round robins at the Osage courts. Beginners are paired with experienced players. All paddles provided — just show up.',
    links: [], members: crowd(8, 5), memberCount: 22, monthlyPrice: 24, level: 'All levels', code: '33557799', isNew: true,
  },
  {
    id: 'c4', name: 'Dink & Drive', sport: 'pickleball', homePlaceId: 'p2', cadence: 'Tue & Thu · 6 PM',
    about: 'After-work doubles ladder at Memorial Park. Rotating partners, ratings 3.0–4.0. Points tracked each session — full standings updated every Friday.',
    links: [{ title: 'Ladder standings', url: 'https://dinkanddrive.club/ladder' }],
    members: crowd(9, 7), memberCount: 26, monthlyPrice: 24, level: 'All levels', code: '44668800', verified: true,
  },
  {
    id: 'c5', name: 'Phillips Park FC', sport: 'soccer', homePlaceId: 'p5', cadence: 'Every Wed · 7 PM',
    about: 'Wednesday 7v7 under the lights at Phillips Park. Good mix of ages and levels — come ready to run.',
    links: [], members: crowd(10, 2), memberCount: 30, monthlyPrice: 29, level: 'All levels', code: '55779911',
  },
  {
    id: 'c6', name: 'Lunch Pickleball', sport: 'pickleball', homePlaceId: 'p6', cadence: 'Mon & Wed · 12 PM',
    about: 'Drop-in open play at the Community Center over lunch. Loaners paddles available, courts 3 & 4. Wrap up by 1:30.',
    links: [], members: crowd(7, 9), memberCount: 18, monthlyPrice: 18, level: 'Casual', code: '66881133',
  },
  {
    id: 'c7', name: 'NWA Futsal', sport: 'soccer', homePlaceId: 'p6', cadence: 'Every Thu · 8 PM',
    about: 'Indoor 5v5 futsal inside the Community Center. Fast, technical, and a lot of fun. Competitive vibe — bring your A-game.',
    links: [], members: crowd(8, 11), memberCount: 20, monthlyPrice: 32, level: 'Competitive', code: '77992244', isNew: true,
  },
  {
    id: 'c8', name: 'Bentonville Trail Crew', sport: 'trails', homePlaceId: 'p7', cadence: 'Every Sat · 7 AM',
    about: 'Sunrise group runs and hikes on the Crystal Bridges and Slaughter Pen loop trails. All paces welcome — no one gets left behind. Coffee at Onyx after most Saturdays.',
    links: [{ title: 'Strava club', url: 'https://strava.com/clubs/bnvtrailcrew' }],
    members: crowd(9, 4), memberCount: 41, monthlyPrice: 12, level: 'All levels', code: '88003355', verified: true,
  },
];

export function makeGames(now: Date): Game[] {
  const at = (minutes: number) => new Date(now.getTime() + minutes * 60_000);
  const day = (days: number, hour: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date;
  };
  const base = { declined: [] as Member[], noResponse: [] as Member[], myRSVP: 'none' as const };

  // A few weeks of finished games so profiles have real history (you were at most of them).
  const history: Game[] = Array.from({ length: 14 }, (_, i): Game => {
    const week = Math.floor(i / 2) + 1;
    const kind = [
      { sport: 'soccer' as const, placeId: 'p1', clubId: 'c1', title: 'Friday Night Soccer', hour: 20, hours: 1.5, capacity: 14 },
      { sport: 'pickleball' as const, placeId: i % 4 < 2 ? 'p2' : 'p3', clubId: 'c4', title: 'Doubles Ladder', hour: 18, hours: 2, capacity: 8 },
    ][i % 2];
    const start = day(-(week * 7 - (i % 2) * 2), kind.hour);
    const end = new Date(start.getTime() + kind.hours * 3_600_000);
    const trail = i === 4 || i === 11;
    return {
      ...base,
      id: `h${i + 1}`,
      sport: trail ? 'trails' : kind.sport,
      placeId: trail ? (i === 4 ? 'p7' : 'p8') : kind.placeId,
      clubId: trail ? 'c8' : kind.clubId,
      title: trail ? 'Sunrise Hike' : kind.title,
      details: '',
      start: trail ? day(-(week * 7), 7) : start,
      end: trail ? new Date(day(-(week * 7), 7).getTime() + 2 * 3_600_000) : end,
      capacity: trail ? 12 : kind.capacity,
      going: i % 3 === 2 ? crowd(6, i) : [ME, ...crowd(7, i)],
      dropInPrice: trail ? 0 : 7,
      level: 'All levels',
      myRSVP: i % 3 === 2 ? 'none' : 'going',
    };
  });

  return [
    ...history,
    { ...base, id: 'g1', sport: 'soccer', placeId: 'p1', clubId: 'c1', title: 'Friday Night Soccer',
      details: 'Weekly 7v7. Bring a light and a dark shirt.', start: at(-25), end: at(65), capacity: 14,
      going: crowd(11), declined: crowd(2, 12), noResponse: crowd(3, 14), dropInPrice: 7, level: 'Casual' },
    { ...base, id: 'g2', sport: 'pickleball', placeId: 'p4', clubId: null, title: 'Open Play · Doubles',
      details: 'Rotating doubles, winners stay on. Balls provided.', start: at(40), end: at(160), capacity: 8,
      going: crowd(5, 4), dropInPrice: 7, level: 'All levels', isNew: true },
    { ...base, id: 'g3', sport: 'pickleball', placeId: 'p2', clubId: 'c4', title: 'Doubles Ladder',
      details: 'Ladder night. Check in 10 minutes early.', start: at(180), end: at(300), capacity: 12,
      going: crowd(6, 7), declined: crowd(1, 2), noResponse: crowd(4, 9), dropInPrice: 7, level: 'All levels' },
    { ...base, id: 'g4', sport: 'soccer', placeId: 'p5', clubId: null, title: 'Pickup 7v7',
      details: 'Open pickup game. Teams picked on the spot.', start: at(300), end: at(390), capacity: 14,
      going: crowd(9, 1), dropInPrice: 7, level: 'All levels' },
    { ...base, id: 'g5', sport: 'pickleball', placeId: 'p3', clubId: 'c3', title: 'Saturday Round Robin',
      details: 'Round robin, 15-minute games.', start: day(1, 9), end: day(1, 11), capacity: 16,
      going: crowd(10, 5), noResponse: crowd(3), dropInPrice: 7, level: 'All levels' },
    { ...base, id: 'g6', sport: 'soccer', placeId: 'p2', clubId: 'c2', title: 'League Match',
      details: 'Sunday League round 6.', start: day(2, 10), end: day(2, 12), capacity: 22,
      going: crowd(15, 3), declined: crowd(2), noResponse: crowd(4, 6), dropInPrice: 10, level: 'Competitive' },
    { ...base, id: 'g7', sport: 'pickleball', placeId: 'p6', clubId: null, title: 'Lunch Open Play',
      details: 'Indoor courts 3 and 4.', start: at(-15), end: at(45), capacity: 8,
      going: crowd(7, 8), dropInPrice: 7, level: 'Casual' },
    { ...base, id: 'g8', sport: 'soccer', placeId: 'p6', clubId: 'c7', title: 'Futsal Night',
      details: '5v5, 8-minute games.', start: day(1, 20), end: day(1, 22), capacity: 15,
      going: crowd(8, 11), noResponse: crowd(2, 1), dropInPrice: 8, level: 'Competitive' },
    { ...base, id: 'g9', sport: 'soccer', placeId: 'p1', clubId: 'c1', title: 'Friday Night Soccer',
      details: 'Weekly 7v7. Bring a light and a dark shirt.', start: day(7, 20), end: day(7, 22), capacity: 14,
      going: crowd(4), noResponse: crowd(8, 4), dropInPrice: 7, level: 'Casual', isNew: true },
    { ...base, id: 'g10', sport: 'pickleball', placeId: 'p2', clubId: 'c4', title: 'Doubles Ladder',
      details: 'Ladder night.', start: day(2, 18), end: day(2, 20), capacity: 12,
      going: crowd(3, 7), noResponse: crowd(6, 2), dropInPrice: 7, level: 'All levels', isCanceled: true },
    { ...base, id: 'g11', sport: 'trails', placeId: 'p7', clubId: 'c8', title: 'Sunrise Group Hike',
      details: '4 mile loop at a conversational pace. Bring water.', start: at(90), end: at(210), capacity: 20,
      going: crowd(8, 4), dropInPrice: 0, level: 'All levels' },
    { ...base, id: 'g12', sport: 'trails', placeId: 'p8', clubId: null, title: 'Trail Run · Slaughter Pen',
      details: 'Easy 5K on the Slaughter Pen loop.', start: day(1, 7), end: day(1, 9), capacity: 12,
      going: crowd(4, 9), dropInPrice: 0, level: 'Casual' },
  ];
}

export const payments: Payment[] = [
  { id: 'pm1', clubName: 'Bentonville Strikers', amount: 29, method: 'Apple Pay' },
  { id: 'pm2', clubName: 'Dink & Drive', amount: 24, method: 'Visa •••• 2315' },
];

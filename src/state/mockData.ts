import type { Club, Game, Member, Payment, Place } from './models';

// Same as ME in models.ts (not imported: scripts/make_seed.ts loads this file straight in Node).
const ME: Member = { id: 'me', name: 'You' };

// Bentonville, AR — launch market. Game times are relative to app start so
// there is always something live, soon and later.

const people: Member[] = [
  'Alex Rivera', 'Jordan Lee', 'Sam Torres', 'Casey Wong', 'Taylor Brooks', 'Morgan Diaz',
  'Riley Chen', 'Jamie Patel', 'Drew Carter', 'Avery Kim', 'Quinn Foster', 'Parker Hughes',
  'Reese Morgan', 'Skyler Ward', 'Emerson Hale', 'Rowan Price',
].map((name, index) => ({ id: `m${index}`, name }));

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
];

export const clubs: Club[] = [
  {
    id: 'c1', name: 'Bentonville Strikers', sport: 'soccer', homePlaceId: 'p1', cadence: 'Every Fri · 8 PM',
    about: 'Casual Friday night soccer. All skill levels welcome — we split teams fairly and grab drinks after.',
    links: [{ title: 'Group chat', url: 'https://chat.whatsapp.com/strikers' }],
    members: crowd(12), memberCount: 34, monthlyPrice: 29, level: 'Casual', code: '12355654', verified: true,
  },
  {
    id: 'c2', name: 'Sunday League', sport: 'soccer', homePlaceId: 'p2', cadence: 'Every Sun · 10 AM',
    about: '11v11 on full-size fields. Intermediate to competitive. Referee every match.',
    links: [], members: crowd(10, 3), memberCount: 48, monthlyPrice: 35, level: 'Competitive', code: '22446688', verified: true,
  },
  {
    id: 'c3', name: 'Osage Park Picklers', sport: 'pickleball', homePlaceId: 'p3', cadence: 'Every Sat · 9 AM',
    about: 'Weekend round robins at the Osage Park courts. Beginners get paired with experienced players.',
    links: [], members: crowd(8, 5), memberCount: 22, monthlyPrice: 24, level: 'All levels', code: '33557799', isNew: true,
  },
  {
    id: 'c4', name: 'Dink & Drive', sport: 'pickleball', homePlaceId: 'p2', cadence: 'Tue & Thu · 6 PM',
    about: 'After-work doubles ladder. Rotating partners, ratings 3.0–4.0.',
    links: [{ title: 'Ladder standings', url: 'https://dinkanddrive.club/ladder' }],
    members: crowd(9, 7), memberCount: 26, monthlyPrice: 24, level: 'All levels', code: '44668800', verified: true,
  },
  {
    id: 'c5', name: 'Phillips Park FC', sport: 'soccer', homePlaceId: 'p5', cadence: 'Every Wed · 7 PM',
    about: 'Midweek 7v7 under the lights.', links: [], members: crowd(10, 2), memberCount: 30,
    monthlyPrice: 29, level: 'All levels', code: '55779911',
  },
  {
    id: 'c6', name: 'Lunch Pickleball', sport: 'pickleball', homePlaceId: 'p6', cadence: 'Mon & Wed · 12 PM',
    about: 'Indoor open play over lunch. Paddles available to borrow.', links: [], members: crowd(7, 9),
    memberCount: 18, monthlyPrice: 18, level: 'Casual', code: '66881133',
  },
  {
    id: 'c7', name: 'NWA Futsal', sport: 'soccer', homePlaceId: 'p6', cadence: 'Every Thu · 8 PM',
    about: 'Indoor 5v5 futsal. Fast, technical, fun.', links: [], members: crowd(8, 11),
    memberCount: 20, monthlyPrice: 32, level: 'Competitive', code: '77992244', isNew: true,
  },
  {
    id: 'c8', name: 'Bentonville Trail Crew', sport: 'trails', homePlaceId: 'p7', cadence: 'Every Sat · 7 AM',
    about: 'Sunrise group hikes and trail runs on the Crystal Bridges and Slaughter Pen loops. All paces, nobody gets left behind.',
    links: [], members: crowd(9, 4), memberCount: 41, monthlyPrice: 12, level: 'All levels', code: '88003355', verified: true,
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

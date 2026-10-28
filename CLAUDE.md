# Coopeer

Sports discovery app — find a game nearby or join a club that plays every week.
Think "Airbnb for local sports." Launch market: Bentonville, AR. Sports: **soccer and pickleball only** for now.

Users browse the map without an account, tap "I'm in" on a one-time game ($7 drop-in)
or join a club (monthly). Login is phone number + SMS code only, asked only when they act.

## Tech stack

- Expo SDK 55 + Expo Router (file-based routes in `app/`), React Native, TypeScript strict
- Custom SVG street map (`src/map/StreetMap.tsx`): grayscale, streets only, thick simplified shapes,
  identical on iOS/Android/web. Street data is baked from OpenStreetMap into `src/map/streetData.ts`
  (Bentonville bbox); pan/pinch/double-tap via gesture-handler + Reanimated.
- `react-native-reanimated` 4 for all motion; `expo-haptics` for feedback (never on web)
- `expo-glass-effect` (real iOS 26 Liquid Glass) with an `expo-blur` fallback — always via `src/ui/Glass.tsx`
- `expo-camera` (QR scanning), `react-native-qrcode-svg` (invite QR), `expo-haptics`, AsyncStorage
- Runs in Expo Go (no custom native code). Web build deploys to Vercel from the branch.

`ios/` holds an earlier native SwiftUI prototype of the same design. It is a reference only and is not kept in sync.

## Domain model — Place · Club · Game

- **Place**: where people play. **Every map pin is a Place**, never a club or a game.
- **Club**: a recurring group ("Every Fri · 8 PM"). Join once (code, QR, link or "Join club"); its games land in Schedule.
- **Game**: one occurrence at a place and time. Hosted by a club, or open (`clubId: null`). RSVP with "I'm in".

Visual language that teaches the difference — keep it consistent:
- Games are always shown with a **DateTile** (LIVE / TODAY / weekday + time) and a "Club game"/"Open game" KindTag.
- Clubs are always shown with a rounded-square **ClubLogo** and a "Club" KindTag.
- Use `GameRow`, `ClubRow`, `ClubCard` from `src/ui/Rows.tsx`; never hand-roll another list item for these.

Map pins show the place's sport icons plus one fact: **LIVE**, today's next game time, or "N clubs".
Place names fade in as you zoom; the selected pin lifts and the others dim.

## Bottom sheet

Everything tapped on the map or in a list (place, game, club, who's going) opens in the **global
bottom sheet** (`src/ui/Sheet.tsx`, mounted once in `app/_layout.tsx`). It snaps to half/full by drag
velocity, rubber-bands at the top, keeps the ActionBar pinned to the visible bottom, and navigates
inside itself (slide in/out) with a back button. Detail content lives in `src/details/*` and renders
through `DetailLayout` + `useDetailNav()`, so the same component works in the sheet or as a page.
Open it with `open.place/game/club(id)` from `src/lib/nav.ts`; "Your Clubs" uses `open.clubPage(id)`.

## Action placement rules (every screen)

1. A screen's main action lives in the bottom **ActionBar**: `[SecondaryButton] [PrimaryButton]`, optional caption.
   Exception, matching the Figma: hero screens and the "club found" sheet use a full-width pill with a text button below.
2. Step-by-step flows (login, team code) use `StepScaffold`: back/close + progress bar, big title, round **NextButton** bottom-right.
3. The top-right header holds at most **one** control: `MoreMenu` ("…", or `icon="add"` for "+").
4. Details open in the bottom sheet (`open.*`); inside a detail use `useDetailNav()` so navigation stays in the sheet.
5. Destructive actions always confirm (`confirmDestructive`).
6. Login only when acting: wrap actions in `session.requireAuth(() => ...)`.

## Project structure

```
app/
  _layout.tsx            Providers + Stack (sheet/modal presentation per route)
  index.tsx              Redirect: /welcome or /explore
  welcome.tsx            Hero (Figma Login)
  auth.tsx               Phone → code → name → welcome (one route, internal steps)
  (tabs)/                explore (map), clubs, schedule, profile — custom glass TabBar
  place|game|club|attendees/[id].tsx   Thin route wrappers (deep links, Clubs tab page) around src/details/*
  join/index.tsx         Scan QR or type 8-digit code → "club found" panel
  join/[code].tsx        Deep link coopeer://join/<code>
  invite/[id].tsx        Club QR + code + share
  personal-info.tsx, payments.tsx, how-it-works.tsx
src/
  constants/theme.ts     ALL design tokens (colors, type, space, radius, shadow)
  state/models.ts        Types + sports + helpers (gameStatus, spotsLeft…)
  state/mockData.ts      Bentonville places, clubs, games (relative to app start)
  state/store.tsx        Data provider — replace internals with a real API
  state/session.tsx      Phone-OTP session — swap mockAuth for Firebase/Twilio
  lib/format.ts          Time, phone, team-code parsing, share, directions, confirm
  lib/nav.ts             open.place / open.game / open.club
  details/               PlaceDetail, GameDetail (Figma "Evento"), ClubDetail (Games/About/Members), AttendeesDetail
  map/                   StreetMap, PlacePin, projection, streetData (generated)
  ui/                    Glass, Buttons, Display, Rows, Screen, StepFlow, TabBar, Hero, Sheet, DetailLayout
```

## Figma

File: https://www.figma.com/design/2vwhX7miuvPYLshOXMxJD3/Clubez---App (page `1:2`).
Sections: Login `953:839`, Sign up `953:840`, Join a team `953:841`, Main screens `953:842`,
Clubs `953:843`, Event `953:844`. Follow their structure (underline inputs, progress bar,
round next button, found-club sheet, Games/About/Members tabs, Decline / I'm in) with the
Liquid Glass styling from `src/ui`.

## Motion

Motion should feel physical and quick: springs (not linear timing) for anything the finger moves,
stagger list entrances by ~45ms, confirm success with a morph + haptic, shake + error haptic on
wrong input. Always honor `useReducedMotion()`. Never put `entering`/`exiting`/`layout` on the same
`Animated.View` that has an animated transform/opacity — wrap it.

## Code rules

1. Colors, type, spacing, radii only from `src/constants/theme.ts` (`flow` tokens hold the Figma step-flow measurements).
2. TypeScript strict, no `any`. `StyleSheet.create`; inline styles only for dynamic values.
3. Build screens from `src/ui` components; add to the kit instead of duplicating patterns in a screen.
4. English UI strings only (US-first).
5. No extra features without asking — keep scope tight.
6. Must work on iOS, Android and web; Expo Go compatible (no custom native modules).
7. Before pushing: `npx tsc --noEmit` and `npx expo export --platform web` must pass (CI runs both).

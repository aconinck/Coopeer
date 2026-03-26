# Coopeer

Sports discovery app — find, join, and manage local amateur sports teams.
Think "Airbnb for local sports." Built with Expo + React Native + TypeScript.

## What this app does

Users open the app, see a map of teams near them, pay $7 to try a game,
subscribe monthly if they like it. Managers create teams for free and earn
via the member subscriptions. Coopeer charges 3–6% per transaction.
Initial market: Bentonville, AR.

---

## Tech Stack

- Expo SDK 55 + Expo Router (file-based navigation)
- React Native + TypeScript (strict mode, no `any`)
- React Native Maps (main map view)
- Stripe React Native SDK (payments)
- Anthropic SDK (`claude-haiku-4-5-20251001` for in-app assistant)
- AsyncStorage (local persistence)
- React Native Reanimated + Gesture Handler (animations/gestures)
- react-native-svg (brand icon rendering — install with `npx expo install react-native-svg`)

---

## Brand

**Logo icon:** Two overlapping wave/zigzag shapes — see `assets/icons/logo-icon.svg`.
Use `src/components/shared/CoopeerIcon.tsx` to render it in React Native.
Once `react-native-svg` is installed, uncomment the SVG block in that file.

**Colors:** Brand primary is `#FF6100` (exact orange from the SVG).
Never use `#FF7A0A` — the correct value is in `src/constants/theme.ts`.

**Typography:** Nunito Sans throughout. Falls back to system font until loaded.

---

## Project Structure

```
coopeer/
├── app/
│   ├── (tabs)/
│   │   ├── discover.tsx       # Tab 1 — Map + sport filters
│   │   ├── teams.tsx          # Tab 2 — My teams dashboard
│   │   ├── schedule.tsx       # Tab 3 — Upcoming events
│   │   ├── ranking.tsx        # Tab 4 — Season ELO + badges
│   │   └── profile.tsx        # Tab 5 — Stats + settings
│   ├── team/[id].tsx          # Public team profile (pre-join)
│   ├── event/[id].tsx         # Event detail + RSVP (Figma: 456:2877)
│   ├── live/[id].tsx          # Live score — manager only
│   ├── result/[id].tsx        # Post-game result + MVP + survey
│   ├── checkout/index.tsx     # Payment bottom sheet
│   ├── manage/
│   │   ├── [id].tsx           # Admin panel — Eventos/Detalhes/Membros tabs
│   │   └── [id]/dashboard.tsx # Revenue dashboard + delinquents
│   ├── onboarding/index.tsx   # Splash → hero → phone → confirm
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── map/               # SportPin, FilterPills, TeamBottomSheet
│   │   ├── team/              # TeamCard (isManager prop), MemberAvatars
│   │   ├── event/             # EventCard
│   │   ├── gamification/      # RankingCard, BadgeItem, SeasonProgress
│   │   ├── payment/           # PricingCTA, CheckoutSheet
│   │   └── shared/            # Button, Avatar, Tag, NavBar, CoopeerIcon
│   ├── constants/theme.ts     # ALL design tokens — only source of truth
│   ├── services/
│   │   ├── api.ts             # Mock data + API stubs
│   │   ├── claude.ts          # Anthropic SDK integration
│   │   └── stripe.ts          # Stripe helpers (stub)
│   ├── hooks/
│   │   ├── useLocation.ts     # Device GPS (defaults to Bentonville, AR)
│   │   ├── useTeams.ts        # Teams near coordinate
│   │   └── useAuth.ts         # Auth state via AsyncStorage
│   └── types/index.ts         # All TypeScript interfaces
└── assets/
    ├── icons/logo-icon.svg    # Brand icon (SVG source)
    └── images/
```

---

## Design Tokens — NEVER hardcode these

```typescript
// src/constants/theme.ts — single source of truth
colors.primary       = '#FF6100'   // brand orange (from SVG)
colors.primaryLight  = '#FFF4ED'   // cream background
colors.primaryBorder = '#FFD4A8'   // border for cream cards
colors.primaryMid    = '#FFEBCF'   // nav bar background

colors.black         = '#1A1A1A'
colors.gray100       = '#D1D1D1'   // borders, separators
colors.gray500       = '#5D5D5D'   // secondary text
colors.success       = '#1D9E75'
colors.error         = '#E24B4A'

// Sport colors (fixed, never change)
colors.soccer        = '#FF6100'
colors.pickleball    = '#7F77DD'
colors.basketball    = '#D85A30'
colors.tennis        = '#1D9E75'
colors.running       = '#378ADD'
```

---

## Figma Reference

File: https://www.figma.com/design/2vwhX7miuvPYLshOXMxJD3/Clubez---App

| Section | Node | Status |
|---|---|---|
| Login / Onboarding | 953:839 | ✓ Phone auth flow implemented |
| Sign Up | 953:840 | ✓ Implemented |
| Join a Team (code entry) | 953:841 | ✓ Implemented |
| Dashboard (My Teams) | 254:1431 | ✓ Implemented |
| Team Page (admin) | 255:2073 | ✓ `manage/[id].tsx` |
| Event Detail | 456:2877 | ✓ Modal style, date chips, guest sheet |
| Checkout / Subscription | 954:1209 | ✓ Bottom sheet + Pagar |
| Admin Dashboard | — | ✓ Revenue chart + delinquents |
| Discover / Map | — | ✗ Spec in screen guide below |
| Team Public Profile | — | ✗ Spec in screen guide below |
| Live Score | — | ✗ Open for iteration |
| Post-Game Result + Survey | — | ✗ Open for iteration |
| Ranking | — | ✗ Open for iteration |

---

## Key Design Patterns (from Figma)

### Form fields
All inputs use **underline style only** — no box borders.
Label above in 12px gray, value below in 16px bold black.

### Step progress bar
A thin horizontal bar at top of auth/onboarding screens.
Black filled segments = completed steps, gray = remaining.

### Circular next button
Orange circle (52×52, `borderRadius: 999`) aligned to the right.
Gray when disabled, `colors.primary` when active.

### Buttons
- **Primary**: `height: 58`, `borderRadius: 999`, orange, full-width pill
- **Outline**: same height, `backgroundColor: primaryLight`, orange border/text
- **Pill action** (e.g. "Ver Confirmados"): `height: 40`, lighter weight

### Event status badges
- `Agora` (Now): green `#D1FAE5` / `#059669`
- `Novo` (New): orange `primaryMid` / `primary`
- `Confirmado`: same green as "Now"
- `Cheio` (Full): amber `#FEF3C7` / `#D97706`

### Admin bottom nav
Two icons only: `bar-chart-outline` → dashboard, `add-circle-outline` → create event.
Centered, no labels.

---

## Navigation Flow

```
App launch:
  → onboarding/index (splash + hero + phone auth)
  → (tabs)/discover

Player journey:
  discover → team/[id] → checkout → (tabs)/teams

Manager journey (same person can be both):
  (tabs)/teams [isManager TeamCard] → manage/[id]
  manage/[id] (Eventos tab, "Now" event) → live/[id]
  live/[id] "End Game" → result/[id]
  result/[id] → (tabs)/ranking
  manage/[id] (bar chart icon) → manage/[id]/dashboard

Deep links:
  coopeer://team/[slug]    → team/[id]
  coopeer://match/[id]     → result/[id]
  coopeer://invite/[code]  → onboarding (auto-join after login)
```

---

## Auth

Phone number auth (not email/password):
1. Enter phone → send OTP (Twilio or Firebase Auth)
2. Enter 6-digit code → verify
3. On success → `router.replace('/(tabs)/discover')`

User stored in AsyncStorage via `src/hooks/useAuth.ts`.
Map and team profiles are accessible **without login** — auth only
triggered when tapping "Try once" or "Join".

---

## Screens — Implementation Guide

### Discover (Map) — PRIMARY, no Figma yet

Full-screen `react-native-maps` MapView. Absolute overlay:
- Search pill (white, `borderRadius: 999`, shadow)
- `FilterPills` row below search (horizontal scroll)
- `SportPin` markers per team (colored bubble + tail)
- `TeamBottomSheet` slides up on pin tap

Design decisions to propose if iterating:
- Group nearby pins into a cluster marker when zoomed out
- Show user's avatar on the map at their current position

### Team Public Profile — no Figma yet

Hero image (220px) → gradient overlay → team name bold white.
Body: tag pills row, description (expandable), next game section,
members row, fixed CTA bar with "Try once · $7" + "Join · $X/mo".

### Admin Panel (`manage/[id]`)

Three-tab layout matching Figma:
- **Events tab**: Today section + Upcoming section, event rows with status badges
  - "Now" events navigate to `live/[id]`
- **Details tab**: Description + Links fields (underline style), "Add new" link
- **Members tab**: Search + member list with "Remove" buttons
Bottom admin nav: chart + plus.

### Dashboard (`manage/[id]/dashboard`)

Revenue card: monthly bar chart, green for current month.
Delinquents card: same chart in orange, taps into delinquents list.
Delinquents list: "Charge all" button, per-member "Charge" buttons.

### Checkout (`checkout/index`)

Bottom sheet overlaid on the previous screen (modal presentation):
- Handle bar
- Team logo (72×72, rounded-16) + team name + stacked avatars
- Divider
- Subtotal / Fee / **Total bold** pricing breakdown
- Card row: holder name + "VISA XXXX-XXXX" + pencil edit icon
- "Pay" orange full-width button (height 58)

### Live Score (`live/[id]`)

Dark (`colors.black`) full-screen. Timer at top + play/pause.
Large scoreboard with orange accent on the leading team.
Player rows: avatar + name + goal count + orange "+" button.
Goal confirmation micro-modal before adding.
"End Game" destructive button at bottom (red border, red text).

### Result + Survey (`result/[id]`)

Dark result card: final score, winner label.
Top scorer card: emoji + avatar + name + goal count.
MVP vote grid: 3 candidate cards, tap to vote (orange border selected).
"Share result" button → `Share.share()` with a message.
Survey shown to random users after MVP vote:
Q1: Score correct? (Yes/No)
Q2: Top scorer correct? (Yes/No/Don't know)
Submit → `router.replace('/(tabs)/ranking')`

---

## Data — Mock vs Real

`src/services/api.ts` contains all mock data and async stubs.
All API functions simulate network delay (300–600ms).

When wiring to a real backend, replace the functions in `api.ts` only.
Components and hooks should not change.

Real teams in Bentonville AR area are already in the mock:
- Bentonville Strikers (soccer, Lawrence Plaza)
- Crystal Bridges Picklers (pickleball)
- Walmart Campus Ballers (basketball)
- Slaughter Pen Tennis Club (tennis)
- Razorback Trail Runners (running)

---

## Claude Integration

`src/services/claude.ts` uses `claude-haiku-4-5-20251001` for:
- Generating team descriptions (managers)
- Answering sports rules questions
- Suggesting optimal game times

All API calls use streaming when a `onChunk` callback is provided.

---

## Code Rules

1. **All colors from `src/constants/theme.ts`** — never hardcode hex values
2. **TypeScript strict** — no `any`, all props typed
3. **StyleSheet.create only** — no inline styles except dynamic values
4. **Functional components + hooks** — no class components
5. **Figma-marked screens (✓)**: match pixel-perfectly
6. **Open-for-iteration screens (✗)**: explain design decisions when building
7. **English strings only** — app is US-first; no Portuguese in UI
8. **No extra features** without asking — keep scope tight
9. **Expo APIs preferred** over bare React Native equivalents
10. **Both iOS and Android** — no iOS-only APIs without Android fallback

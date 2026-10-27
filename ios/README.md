# Coopeer for iOS

Native SwiftUI app for iOS 26 (Liquid Glass). Soccer and pickleball only for now.

## Run it

1. Xcode 26 on a Mac.
2. Open `ios/Coopeer.xcodeproj`.
3. Choose an iPhone simulator and press Run (⌘R).
   On a real iPhone, pick your team under *Signing & Capabilities* first.

Login: any 10-digit US number, then any 6-digit code. `000000` simulates a wrong code.
Team codes to try: `12355654` (Bentonville Strikers), `33557799` (Crystal Bridges Picklers).
Deep link: `xcrun simctl openurl booted coopeer://join/22446688`.
QR scanning needs a real device (the simulator has no camera).

## The model: Place · Club · Game

| | What it is | Example | How you join | Shown as |
|---|---|---|---|---|
| **Place** | Where people play | Memorial Park | — | A pin on the map |
| **Club** | A group that plays every week | Dink & Drive, Tue & Thu 6 PM | Once, by code, QR or "Join club" ($/month) | Rounded-square logo |
| **Game** | One occurrence, at a place and time | Doubles Ladder, today 6 PM | "I'm in" — no commitment ($7 drop-in, free for club members) | Date tile (LIVE / TODAY / weekday + time) |

- A club hosts games. A game can also be **open** (pickup, no club).
- Many clubs can share one place. That's why every pin is a place.
- Joining a club puts all its games in your Schedule automatically.

Map pins show the place's sports and the most useful fact: **LIVE**, the time of today's next game, or how many clubs play there.

## Where actions go (every screen)

1. A screen's main action is in the bottom **ActionBar**: `[secondary] [PRIMARY]`.
2. Step flows (login, team code) use the round **Next** button bottom-right.
3. The top-right toolbar holds at most one menu: `+` to add, `…` for more.
4. Places and clubs push inside the current stack. **Games always open as a sheet.**
5. Destructive actions (leave club, sign out, cancel membership) always confirm.
6. Login is asked only when you act (I'm in, Join). Browsing never needs an account.

## Code map

```
Coopeer/
├── App/            CoopeerApp (root + tabs), AppRouter (deep links), Navigation (routes, auth gate)
├── DesignSystem/   Theme tokens, Buttons (ActionBar, NextButton, Chip), StepFlow, Components
├── Models/         Sport, Place, Club, Game, Member
├── Services/       AppStore (mock data, swap for API), Session + AuthService (phone OTP), QRCode
└── Features/
    ├── Auth/       Welcome hero, phone → code → name → welcome
    ├── Explore/    Map, pins, bottom drawer, place detail
    ├── Clubs/      Your clubs grid, club page (Games / About / Members)
    ├── Join/       Scan QR, team code, "club found" sheet, invite QR
    ├── Events/     Game detail (I'm in / Decline), who's going, schedule
    └── Profile/    Profile, personal info, payments
```

The project uses Xcode's synchronized folders: any file added under `Coopeer/` is built automatically.

## Wiring real services

- **Phone auth**: implement `AuthService` (Firebase Phone Auth or Twilio Verify) and use it in `Session`.
  The code field already uses `.oneTimeCode`, so iOS autofills the SMS code.
- **Data**: replace the method bodies in `AppStore`; views only use its public methods.
- **Universal links**: `TeamCode.extract` already accepts `https://coopeer.app/join/<code>`;
  add the Associated Domains entitlement and an `apple-app-site-association` file to enable it.

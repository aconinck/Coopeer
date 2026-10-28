# Coopeer on Supabase

Without keys the app runs on in-memory demo data. With keys it uses this database and phone login.

## 1. Create the project

1. supabase.com → New project (region close to Arkansas, e.g. `us-east-1`).
2. **SQL Editor** → paste and run `migrations/0001_init.sql` (tables, security rules, realtime).
3. **SQL Editor** → paste and run `seed.sql` (Bentonville demo places, clubs, games, players).
   Game times are relative to when you run it; re-run it any time to get fresh live/today games
   (`node scripts/make_seed.ts` regenerates it from `src/state/mockData.ts`).

## 2. Phone login

**Authentication → Sign In / Providers → Phone**: enable it.

- To test without sending real SMS: add **Test phone numbers**, e.g. `14795550100=123456`.
  Then log in in the app with (479) 555-0100 and code 123456.
- For real SMS, pick Twilio (Account SID, Auth Token, Messaging Service SID). Twilio charges per SMS.

## 3. Keys in the app

Project Settings → API → copy into `.env` (git-ignored):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

Restart Expo after changing `.env`. On Vercel, add the same two variables.

Never put the `service_role` key in the app: it bypasses every security rule.

## What lives where

| Table | What |
| --- | --- |
| `profiles` | One per player (`id` = auth user id): name, birth year, favorite sports, goal |
| `places` | Map pins: parks, fields, courts, trails |
| `clubs` / `club_members` | Recurring groups and who is in them (`admin` can host club games) |
| `games` / `rsvps` | One occurrence each; `going`, `declined` or `invited` per player |

Not in the database yet (still demo data): payments, feed posts, profile stats/achievements,
and club photos (stored as the local file path; needs Supabase Storage).

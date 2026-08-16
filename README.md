# Quran Khatm — Backend API

Node.js + Express + MongoDB (Mongoose) REST API for the Quran Khatm app —
auth, Khatm management, Para claiming/completion, members, invites, and
activity. This is Phase 2/3 of the original spec; the frontend (Phase 1) is
a separate project.

## Setup

1. **Install MongoDB** — either run it locally, or create a free
   [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and copy its
   connection string.
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env`:
   - `MONGODB_URI` — your local or Atlas connection string
   - `JWT_SECRET` — generate one with:
     ```bash
     node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
     ```
   - `CORS_ORIGIN` — the frontend's URL (defaults to `http://localhost:5173`,
     which matches the Vite dev server)
4. **Run it:**
   ```bash
   npm run dev    # with auto-restart (nodemon)
   npm start      # plain node
   ```
   You should see `MongoDB connected` and `Quran Khatm API listening on
   http://localhost:5000`.
5. **Check it's alive:** open `http://localhost:5000/api/health` — should
   return `{"success":true,"message":"OK"}`.

## How this was verified

I don't have a live MongoDB available in the sandbox I build in (its network
access is restricted to a small allowlist that doesn't include MongoDB's
download servers), so I could not run a full request-through-database
integration test before handing this off. To still ship something verified
rather than "trust me":

- **Every file passes `node --check`** (syntax-valid).
- **The Express app was instantiated and all 17 routes were confirmed
  registered** exactly matching the spec's endpoint list.
- **All business logic that doesn't require a live DB connection was unit
  tested and passes** — Para generation (30 Paras, all `available`), the
  progress calculation (verified against your spec's own example: 9/30 →
  30%, then 10/30 → 33%), password hashing/verification (bcrypt), and JWT
  sign/verify (including rejecting a garbage token).
- **HTTP-layer behavior that doesn't touch the DB was tested against a real
  running server** — health check, 404 handling, and auth/validation errors
  that short-circuit before any database call (missing signup fields, short
  password, missing/invalid token).

What's **not** independently verified: the actual MongoDB read/write paths
(user creation, Khatm creation, Para claim/complete against a real
database, invite-code lookup, etc.) — the code is written and reviewed
carefully (see "Design notes" below for the trickier parts), but you should
test the full flow once it's running against your real MongoDB instance.
If anything breaks, send me the exact error and I'll fix it.

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/signup` | — | Create an account, returns `{ user, token }` |
| POST | `/login` | — | Returns `{ user, token }` |
| GET | `/me` | ✓ | Current user's profile |

### Khatms (`/api/khatms`) — all require auth
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create a Khatm — auto-generates 30 Paras, creator becomes first member |
| GET | `/` | List Khatms the current user belongs to |
| GET | `/:id` | Get one Khatm (must be a member) |
| PUT | `/:id` | Edit title/message/etc. (creator only) |
| POST | `/:id/join` | Join directly by Khatm ID |
| GET | `/:id/members` | List members |
| GET | `/:id/paras` | List all 30 Paras with status |
| POST | `/:id/paras/:paraNumber/claim` | Claim an available Para |
| POST | `/:id/paras/:paraNumber/complete` | Mark your claimed Para completed |
| POST | `/:id/invite` | Get this Khatm's invite code |
| GET | `/:id/activity` | Recent activity feed |

### Invite (`/api/invite`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:inviteCode` | — (public) | Preview a Khatm before joining — powers the "Join Khatm" screen |
| POST | `/:inviteCode/join` | ✓ | Join the Khatm this code belongs to |

All responses follow `{ success: boolean, data?, message? }`. Errors are
`{ success: false, message }` with an appropriate status code.

## Design notes (the parts worth knowing about)

- **Para claiming is race-safe.** `POST /paras/:n/claim` uses a single
  atomic `findOneAndUpdate` with the condition `status: "available"` baked
  into the query filter itself — not a read-then-write. If two people tap
  "Claim" on the same Para at nearly the same moment, MongoDB guarantees
  only one update succeeds; the other gets a `409` telling them it's no
  longer available. This directly satisfies your spec's "only one user
  should be able to claim a Para at a time."
- **Completing is similarly guarded** — only the exact member who claimed a
  Para can complete it (`403` otherwise), and completing an
  already-completed Para is a no-op (`200` with `message: "Already
  completed."`) rather than a duplicate activity entry or an error.
- **Khatm auto-completes.** When the 30th Para is marked completed, the
  Khatm's `status` flips to `"completed"` and `completedAt` is set, in the
  same request — no separate cron job or polling needed.
- **Invite preview is intentionally public** (no auth) so your frontend's
  "Join Khatm" screen can show the Khatm name/progress/member count before
  asking someone to sign in, matching the screen you originally spec'd.
- **Progress math** lives in a Mongoose virtual on the Khatm model
  (`khatm.progress` → `{ completed, claimed, available, percent }`), so it's
  computed consistently everywhere the Khatm is returned rather than
  duplicated per-route.

## Connecting the React frontend

The frontend currently uses `KhatmContext`/`AuthContext` with in-memory mock
data. To wire it to this API: replace the mock state in those contexts with
`fetch`/`axios` calls to these endpoints, store the JWT (e.g. in memory or
`sessionStorage` — not `localStorage` if you want it cleared on tab close),
and send it as `Authorization: Bearer <token>` on every `/api/khatms/*`
request. Happy to do this wiring next if you want.

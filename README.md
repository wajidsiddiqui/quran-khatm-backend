# Quran Khatm: Backend

The REST API behind **[Quran Khatm](https://github.com/wajidsiddiqui/quran-khatm-frontend)**, a web app where family and friends complete a full reading of the Quran together, one Juz at a time.

It handles accounts, Khatms, claiming and completing Juz, members, invites, the activity feed, notifications, and reading progress and bookmarks.

Built with **Node.js, Express and MongoDB (Mongoose)**.

---

## What it does

- **Accounts:** sign up and log in with bcrypt-hashed passwords and JWT tokens
- **Khatms:** creating one generates all 30 Juz automatically, and the creator becomes the first member
- **Claiming a Juz** is race-safe: if two people claim the same Juz at the same moment, only one succeeds and the other is told it's taken
- **Completing a Juz:** only the person who claimed it can complete it
- **Finishing a Khatm:** completes automatically when all 30 Juz are done; the creator can also finish it from the final Dua screen
- **Invites:** every Khatm gets a unique invite code, with a public preview so people can see the Khatm before joining
- **Activity feed and notifications:** members are notified when someone joins, claims or completes a Juz
- **Reading progress and bookmarks:** remembers where you stopped in your Juz, and lets you bookmark verses while reading the Quran

---

## Run it

```bash
git clone https://github.com/wajidsiddiqui/quran-khatm-backend.git
cd quran-khatm-backend
npm install
```

Create a `.env` file (copy `.env.example`):

| Variable | What it's for |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas (or local) connection string |
| `JWT_SECRET` | Any long random string, used to sign login tokens |
| `JWT_EXPIRES_IN` | How long a login lasts, for example `30d` |
| `PORT` | API port, usually `5000` |
| `CORS_ORIGIN` | Frontend address(es) allowed to call the API, comma-separated, for example `http://localhost:5173` |
| `RESEND_API_KEY` | Only needed if email verification is switched on |

Never commit your real `.env`; it's already in `.gitignore`.

Start it:

```bash
npm run dev
```

You should see:

```
MongoDB connected: ...
Quran Khatm API listening on http://localhost:5000
```

Check it's alive at `http://localhost:5000/api/health`. It should return `{"success":true,"message":"OK"}`.

---

## API endpoints

All responses look like `{ success, data, message }`. Routes marked ✓ need a login token (`Authorization: Bearer <token>`).

### Auth: `/api/auth`
| Method | Path | Auth | What it does |
|---|---|---|---|
| POST | `/signup` | | Create an account |
| POST | `/login` | | Log in and get a token |
| GET | `/me` | ✓ | The logged-in user |

### Khatms: `/api/khatms` (all ✓)
| Method | Path | What it does |
|---|---|---|
| POST | `/` | Create a Khatm (30 Juz are generated) |
| GET | `/` | Khatms I belong to |
| GET | `/invite/:inviteCode` | Find a Khatm by invite code |
| GET | `/:id` | One Khatm (members only) |
| PUT | `/:id` | Edit a Khatm (creator only) |
| POST | `/:id/join` | Join a Khatm |
| POST | `/:id/complete` | Finish the Khatm (creator only) |
| GET | `/:id/members` | Members with their claimed and completed Juz |
| GET | `/:id/paras` | All 30 Juz with their status |
| POST | `/:id/paras/:n/claim` | Claim Juz *n* |
| POST | `/:id/paras/:n/complete` | Mark your Juz *n* as completed |
| POST | `/:id/invite` | Get the invite code |
| GET | `/:id/activity` | Activity feed |

(The URLs still say `paras` so existing links keep working; in the app they're called Juz.)

### Invites: `/api/invite`
| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/:inviteCode` | | Public preview of a Khatm |
| POST | `/:inviteCode/join` | ✓ | Join through an invite |

### Notifications: `/api/notifications` (all ✓)
| Method | Path | What it does |
|---|---|---|
| GET | `/` | My notifications |
| PATCH | `/read-all` | Mark all as read |

### Reading progress and bookmarks: `/api/reading-progress` (all ✓)
| Method | Path | What it does |
|---|---|---|
| GET | `/` | All my saved reading progress |
| GET | `/quran` | My Quran bookmarks |
| POST | `/quran` | Save a Quran bookmark |
| GET | `/:khatmId/:juzNumber` | Where I stopped in a Juz |
| POST | `/:khatmId/:juzNumber` | Save where I stopped |
| DELETE | `/:progressId` | Remove saved progress |

---

## Project structure

```
server.js                 starts the app and connects to MongoDB
src/
├── app.js                Express setup, CORS, routes
├── config/db.js          MongoDB connection
├── models/               User, Khatm (30 Juz + members), Activity, Notification, ReadingProgress
├── controllers/          the logic behind each route
├── routes/               URL → controller mapping
├── middleware/           login protection, error handling
└── utils/                tokens, error helpers, email
tests-manual/             quick tests that run without a database
```

Run the quick tests:

```bash
node tests-manual/logic.test.mjs
node tests-manual/http.test.mjs
```

---

## Recent updates (November 2026)

- Moved to a new MongoDB Atlas cluster
- User-facing messages now say "Juz" instead of "Para"
- Removed a log line that printed part of the email API key
- Fixed the test scripts' import paths so they run again

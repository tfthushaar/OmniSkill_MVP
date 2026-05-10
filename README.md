# OMNI-SKILL — Career Graph

**Omni-Skill** is a verified career evidence platform for students, esports participants, Discord/community operators, and early-career digital-native talent. It connects to gaming and community platforms, analyzes verified digital activity, and converts it into explainable career-ready proof.

> "Verified digital activity → Professional proof. No fake science."

---

## What It Does

Traditional resumes ignore or trivialize experience gained outside formal internships — Discord administration, esports leadership, tournament organization, guild management, competitive play. Omni-Skill fixes that by turning verified digital participation into structured career evidence.

**For users:**
- Submit evidence claims (Discord admin, esports player, tournament organizer, club member, guild leader)
- Connect gaming accounts (FACEIT, Steam, Riot Games, Discord) to back claims with platform data
- Get an admin-verified **Omni-Skill Passport** — shareable profile, evidence cards, resume bullets, career track suggestions, and PDF export

**For admins:**
- Review, approve, reject, or request more info on submitted claims
- Assign verification levels 1–5 (self-reported → institution-verified)
- Evidence cards and resume bullets are generated only from approved claims

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Recharts |
| Backend | FastAPI, SQLModel, Python 3.11+ |
| Database | SQLite (local) / PostgreSQL via Supabase (production) |
| Auth | Custom JWT (PBKDF2-SHA256, no external dependency) |
| Platform APIs | FACEIT Data API v4, Steam Web API, Riot Account API v1, Discord OAuth2 |
| Fonts | Barlow Condensed, Share Tech Mono, Rajdhani |
| Deployment | Vercel (frontend) + Render.com free tier (backend) |

---

## Repository Structure

```
OmniSkill_MVP/
├── apps/
│   ├── api/                  FastAPI backend
│   │   ├── app/
│   │   │   ├── core/         Config (env vars, API keys)
│   │   │   ├── models.py     SQLModel database schema
│   │   │   ├── schemas.py    Pydantic request/response models
│   │   │   ├── routers/      API route handlers
│   │   │   │   ├── auth.py
│   │   │   │   ├── connectors.py   Platform integrations
│   │   │   │   ├── evidence.py
│   │   │   │   ├── admin.py
│   │   │   │   └── passport.py
│   │   │   └── services/
│   │   │       ├── faceit.py       FACEIT Data API
│   │   │       ├── steam.py        Steam Web API
│   │   │       ├── riot.py         Riot Account API
│   │   │       ├── discord_connector.py  Discord OAuth2
│   │   │       ├── passport.py     Passport assembly + career tracks
│   │   │       └── pdf.py          PDF export
│   │   ├── create_admin.py   One-shot admin seed script
│   │   └── requirements.txt
│   └── web/                  Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── page.tsx          Landing page
│           │   ├── dashboard/        Passport workspace (4 tabs)
│           │   ├── passport/[username]/  Public passport page
│           │   └── admin/            Admin verification queue
│           └── lib/
│               ├── api.ts            apiFetch utility
│               └── types.ts          Shared TypeScript types
├── packages/
│   └── shared-types/
├── infra/
│   └── docker-compose.yml
└── render.yaml               Render.com deployment config
```

---

## Local Setup

### Backend

```bash
cd apps/api
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # fill in any API keys you want to test
uvicorn app.main:app --reload
```

The API starts at `http://localhost:8000`. Auto-creates SQLite DB on first run.

### Frontend

```bash
cd apps/web
npm install
# No .env needed for local dev (defaults to http://localhost:8000)
npm run dev
```

Opens at `http://localhost:3000`.

---

## Admin Credentials

**Option A — Seed via env vars (recommended for production):**
Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before starting the backend. The admin user is created automatically on first boot.

**Option B — Seed script (local or Render shell):**
```bash
# from apps/api/
.venv\Scripts\python.exe create_admin.py admin@omniskill.app YourPassword123!
```

**Option C — Invite code:**
Set `ADMIN_INVITE_CODE` in your env, then register normally and enter the code in the "Invite code" field on the signup form.

---

## Platform Connections

Each connected platform requires an API key set in environment variables. All keys are free:

| Platform | Env Var | Get Key At |
|---|---|---|
| FACEIT | `FACEIT_API_KEY` | developers.faceit.com |
| Steam | `STEAM_API_KEY` | steamcommunity.com/dev/apikey |
| Riot Games | `RIOT_API_KEY` | developer.riotgames.com (expires every 24 h) |
| Discord OAuth | `DISCORD_CLIENT_ID` + `DISCORD_CLIENT_SECRET` + `DISCORD_REDIRECT_URI` | discord.com/developers |

If a key is not set, the connect button returns a clear error message — the rest of the app works fine without it.

---

## Verification System

| Level | Name | Meaning |
|---|---|---|
| 1 | Self-reported | User submitted the claim; no external proof |
| 2 | Account-linked | A connected platform account confirms identity |
| 3 | Platform data verified | API data confirms rank/activity/participation |
| 4 | Peer / community verified | Other members or moderators confirm the claim |
| 5 | Institution verified | College club, organizer, or employer confirms it |

**Evidence state machine:** `draft → submitted → under_review → needs_more_info → approved / rejected → revoked`

---

## Career Signals

Evidence claims map to career signals:

| Evidence Type | Signal | Career Translation |
|---|---|---|
| Discord Admin | Community Operations | Community management, trust & safety, platform ops |
| Esports Player | Competitive Discipline | Esports analyst, competitive coordinator |
| Tournament Organizer | Event Coordination | Event producer, operations manager |
| Club Member | Campus Esports Participation | Campus relations, student community coordinator |
| Guild Leader | Digital Team Leadership | Team lead, digital operations coordinator |

---

## Free Hosting (Production)

| Service | Provider | Cost |
|---|---|---|
| Frontend | Vercel | Free |
| Backend | Render.com (Web Service) | Free (spins down after 15 min idle) |
| Database | Supabase (PostgreSQL) | Free (500 MB, auto-pauses weekly) |
| File uploads | `/tmp/uploads` on Render | Free (ephemeral — resets on restart) |

**Environment variables needed on Render:**
```
DATABASE_URL=postgresql://...    # from Supabase project settings
SECRET_KEY=<auto-generated>
SEED_ADMIN_EMAIL=admin@you.com
SEED_ADMIN_PASSWORD=<strong>
ADMIN_INVITE_CODE=<your-code>
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app
UPLOAD_DIR=/tmp/uploads
```

**Environment variable needed on Vercel:**
```
NEXT_PUBLIC_API_URL=https://omniskill-api.onrender.com
```

---

## API Reference (Key Endpoints)

```
POST /auth/register          Create account
POST /auth/login             Sign in
GET  /me                     Current user + profile

PATCH /profile               Upsert profile
POST  /evidence              Submit evidence claim
POST  /evidence/:id/files    Upload proof file

GET  /connections            List all platform connections
POST /connect/faceit         Connect FACEIT { username }
POST /connect/steam          Connect Steam { steam_id }
POST /connect/riot           Connect Riot { game_name, tag_line }
GET  /connect/discord/start  Get Discord OAuth URL
GET  /connect/discord/callback   Discord OAuth callback
POST /connect/discord/manual Manual Discord link { username }
POST /sync/:provider         Re-sync a connected account
DELETE /connections/:provider    Disconnect

GET  /passport/me            Authenticated passport
GET  /passport/public/:username  Public passport
POST /passport/export-pdf    Download PDF

GET  /admin/evidence/pending               Pending review queue
POST /admin/evidence/:id/approve           Approve
POST /admin/evidence/:id/reject            Reject
POST /admin/evidence/:id/request-info      Request more info

GET  /health                 Health check
```

---

## What's Next

- Discord OAuth guild/role evidence (requires Discord app setup)
- FACEIT match history normalization into activity timeline
- Club dashboard for esports societies (B2B Phase 2)
- Playwright HTML-to-PDF for polished PDF export
- OpenAI wording layer for resume bullets (verified facts only)
- Tournament organizer event verification

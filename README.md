# BodyBench

A role-based fitness assessment platform. Users take a scored workout test, track progress over time, and optionally connect to a trainer. Trainers manage their gym and monitor client progress. A superadmin oversees the entire platform.

**Live:** [bodybench.netlify.app](https://bodybench.netlify.app) &nbsp;|&nbsp; **Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Supabase · Leaflet

---

## Features

### Users
- **Assessment** — fill in exercises (push-ups, squats, plank, jog time, etc.) and get an instant weighted score out of 100
- **Result page** — score ring, category badge (Excellent / Good / Average / Needs Improvement), BMI, per-metric breakdown
- **Dashboard** — stats (total, latest, best, avg), score trend chart, BMI trend, avg score per metric
- **History** — full assessment log with soft-delete and restore
- **Gym view** — see your trainer's gym on a map; join a trainer via a join code

### Trainers (Admins)
- **Field Config** — create, edit, delete assessment fields with custom scoring tiers, min/max, units, and per-section grouping
- **Gym management** — set gym name and location on an interactive map
- **Client grid** — search and browse clients, click through to a detail panel with full history, score trends, and BMI

### Superadmin
- **Trainer Requests** — approve or reject trainer signup requests
- **All Gyms** — interactive map of every gym; click a marker to drill into any trainer's gym view
- **All Users** — table of all platform users with search, score sparklines, trainer filter, and client detail panel

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 (JIT), Inter font |
| Routing | React Router v7 |
| Backend / Auth / DB | Supabase (PostgreSQL + RLS + Auth) |
| Maps | Leaflet + React Leaflet |
| Charts | Custom SVG (TrendChart, BarChart) |
| Testing | Vitest + JSDOM · Playwright (E2E) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Install & run

```bash
git clone https://github.com/Udayverma0906/BodyBench.git
cd BodyBench
npm install
```

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev       # http://localhost:5173
```

### Other commands

```bash
npm run build       # TypeScript check + Vite production build
npm run preview     # Preview production build locally
npm run lint        # ESLint
npm run test        # Vitest unit tests
npm run test:watch  # Vitest watch mode
npm run test:ui     # Vitest browser UI
npm run test:e2e    # Playwright end-to-end tests
```

---

## Project Structure

```
src/
├── pages/
│   ├── Landing.tsx              # Hero page
│   ├── Login.tsx                # Email + OAuth sign-in / sign-up
│   ├── Assessment.tsx           # Fitness assessment form
│   ├── Result.tsx               # Score, BMI, breakdown
│   ├── History.tsx              # Past assessments + restore
│   ├── Dashboard.tsx            # Analytics dashboard
│   ├── MyGym.tsx                # Gym view (trainer or client)
│   └── admin/
│       ├── FieldConfigPage.tsx  # Configure assessment fields
│       ├── TrainerRequestsPage.tsx
│       ├── AllGymsPage.tsx
│       └── AllUsersPage.tsx
│
├── components/
│   ├── layout/Navbar.tsx        # Glass nav, profile popup, theme toggle
│   ├── ui/                      # Button, BasePopup, ScoreRing, TrendChart
│   ├── forms/InputField.tsx
│   ├── dashboard/               # WidgetShell, StatWidget, TrendWidget, BarWidget
│   ├── gym/                     # ClientCard, ClientGrid, ClientDetailPanel
│   ├── map/                     # GymMap, LocationPicker
│   └── assessments/             # DeletedAssessmentsPanel
│
├── context/
│   ├── AuthContext.tsx          # user, profile, isAdmin, isSuperAdmin
│   └── ThemeContext.tsx         # dark / light toggle (localStorage)
│
├── hooks/
│   ├── useFieldConfigs.ts       # Merge admin + global field configs
│   ├── useDashboardData.ts      # Compute dashboard stats
│   └── useAssessment.ts         # Assessment submit + save logic
│
├── utils/
│   └── calculateScore.ts        # Tier-based, weight-adjusted scoring
│
└── types/
    ├── database.ts              # Supabase row types
    ├── assessment.ts
    └── widget.ts
```

---

## Roles & Access Control

| Role | How to obtain | Access |
|------|--------------|--------|
| `user` | Default on signup | Assessment, Result, History, Dashboard, Gym (client mode) |
| `admin` | Superadmin approves a trainer request | Everything above + Field Config, Gym (trainer mode) |
| `superadmin` | Set manually in DB | Everything above + Trainer Requests, All Gyms, All Users |

Route guards (`ProtectedRoute`, `AdminRoute`, `SuperAdminRoute`) enforce access on the client. Supabase Row Level Security enforces it at the database level.

---

## Scoring System

Each assessment field has a `scoring_tiers` array stored in the database. Scoring is evaluated per field:

- **Higher is better** (e.g. push-ups): award points when `value >= threshold`
- **Lower is better** (e.g. jog time): award points when `value <= threshold`
- **Strength metrics** are weight-adjusted: `score × (user_weight / 70 kg)`

Final score is the sum of all field points, capped at 100.

| Score | Category |
|-------|---------|
| 81 – 100 | Excellent |
| 61 – 80 | Good |
| 41 – 60 | Average |
| 0 – 40 | Needs Improvement |

If an admin hasn't configured fields, the app falls back to built-in defaults (age, push-ups, pull-ups, squats, plank, sit-ups, jog time, flexibility, resting HR).

---

## Database Schema (key tables)

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` — role, gym info, admin_id, join_code |
| `assessments` | Score, category, breakdown (JSONB), form_data (JSONB), soft-delete via `is_active` |
| `field_configs` | Admin-configured assessment fields; `admin_id = null` for global defaults; soft-delete via `is_deleted` |

RPCs used: `get_gym_clients`, `get_all_gyms`, `get_all_users_admin`, `get_trainer_gym`.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

---

## License

MIT

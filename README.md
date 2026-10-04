# CrocheTa

*Mag-crochet tamu! Every stitch made cozy.* ("Crochet tamu" is Kapampangan for "let's crochet".)

![Built with AI: Claude](https://img.shields.io/badge/built%20with%20AI-Claude-FF8EAF)

CrocheTa is a crochet companion. It counts the row and stitch you are on with as many
extra counters as a project needs, shows your pattern with highlighters that follow your
place, keeps track of the yarn and hooks you own, and lets you share milestones with other
crocheters. Light and dark mode included.

**Live app:** not deployed yet
**Demo (GitHub Pages, demo mode):** not deployed yet
**Demo video:** coming in week 3

![The row tracker on desktop](docs/assets/screenshot-tracker.png)

## 1. Overview

It is built for crocheters who have more than one project going at once and lose their
place in long patterns. Two questions come up every time they pick up the hook: "which
row was I on?" and "do I already have this yarn?". CrocheTa answers both, and the
community feed is where finished rows get shown off.

## 2. Setup and installation

### What to install first

- **Node.js 20 or later** (`node --version`). The server uses `node --env-file`, which
  needs 20+.
- **PostgreSQL 16 or 17**, local or hosted (Neon, Supabase, Render). Only needed for
  the full stack, not for demo mode.
- Optional: **Docker**, if you would rather run Postgres in a container.

### Get the code and install

```bash
git clone https://github.com/<your-username>/<this-repo>.git
cd <this-repo>
cd client && npm install
cd ../server && npm install
```

### Environment variables

Each folder has a committed `.env.example` with placeholders. Copy it to `.env` (which
is git-ignored) and fill it in. Never commit a real `.env`.

**`client/.env`**

| Variable | Example | What it does |
| --- | --- | --- |
| `VITE_USE_MOCK_API` | `true` | Unset or `true`: demo mode, data lives in your browser. Only the exact value `false` uses the real API. |
| `VITE_API_BASE_URL` | *(empty)* | Leave empty when the server serves the client (the normal setup). Only set it if the API is on a different origin. |

**`server/.env`**

| Variable | Example | What it does |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:devpassword@localhost:5432/crocheta` | Postgres connection string. Contains a password. |
| `APP_USER` | `crocheter` | Username for the password gate. Leave empty locally to turn the gate off. |
| `APP_PASSWORD` | `a-long-random-phrase` | Password for the gate. Required when `NODE_ENV=production`, or the server refuses to start. |
| `CORS_ORIGINS` | `http://localhost:5173` | Origins allowed to call the API from another origin (the Vite dev server). |
| `NODE_ENV` | `development` | Set to `production` on the host. |
| `PORT` | *(do not set)* | The host sets it. Defaults to 3000 locally. |

`VITE_` values are compiled into the public JavaScript. Never put a secret in one.

### Set up the database

```bash
# Postgres in Docker, if you do not have one installed
docker run --name crocheta-pg -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=crocheta -p 5432:5432 -d postgres:17

cd server
cp .env.example .env      # check DATABASE_URL
npm run db:reset          # creates the tables, then adds invented sample data
```

`db:reset` starts with `TRUNCATE`. Never run it against the deployed database unless you
mean to wipe it.

## 3. How to run it

**Demo mode, no server or database:**

```bash
cd client
cp .env.example .env
npm run dev
```

Open http://localhost:5173. You should see the Community feed with a green "Demo mode"
notice and three sample posts. Anything you add is stored in your browser only.

**Full stack, real Postgres:**

```bash
# terminal 1
cd server
npm run dev                # prints: CrocheTa API listening on http://localhost:3000

# terminal 2, with VITE_USE_MOCK_API=false in client/.env
cd client
npm run dev
```

Open http://localhost:5173. The demo notice is gone and data now comes from Postgres.
Vite forwards `/api` requests to port 3000.

**Production-style, one server:**

```bash
cd client && npm run build:real        # builds with VITE_USE_MOCK_API=false, works on Windows too
cd ../server
# put APP_USER=me and APP_PASSWORD=secret in server/.env, then:
npm run dev
```

Open http://localhost:3000. The browser asks for the username and password once, then
the whole app works.

Check the API on its own:

```bash
curl http://localhost:3000/healthz                    # {"ok":true}
curl http://localhost:3000/readyz                     # {"ok":true,"db":"up"}
curl -u me:secret http://localhost:3000/api/projects  # JSON list of projects
```

## 4. Features and usage

When the app opens, a short splash plays: the smiling yarn-ball logo drops in and
settles, its thread draws itself, and the name hops up letter by letter. It plays once
per browser session, a tap or key skips it, and with reduced motion turned on it just
shows the logo.

| Screen | Route | What you do there |
| --- | --- | --- |
| Community | `/` | Read and search posts, write a post, like it, comment on it, save it with the heart, delete it. The Saved tab shows only saved posts. Snapshot posts show the project and its row progress. |
| Stitch Tracker | `/workspace/:id` | The main row counter (tap the yarn ball), a stitch counter, and **any number of extra counters**: each has a name, a colour, an optional repeat (1 to N, then back to 1) and can be **linked** so it moves with every row. **Reminders** pop up on a given row, once or every N rows. Timer, notes, confetti at each quarter, hearts every 10th row, **voice control** ("next", "back", "stitch"), bubbly mint minus and strawberry plus buttons, a **floating counter pill** that appears in the corner when you scroll down to the pattern, a **mini counter** window, Zen focus mode, Share snapshot. |
| Pattern (inside the tracker) | | **Import** a PDF, an image, a phone photo of a paper pattern, or pasted text. Then: a **row bar** that moves down one line per finished row, **highlights** in four colours, **free drawing** in four colours and three widths, **stickers** (star, warning, heart, check, note with text), a **chart crosshair** that follows a chart stitch by stitch and moves up a row as you count, **bookmarks** that pin part of the pattern (sizes, abbreviations) above it, erase, undo, hide marks. Everything is saved to the database. |
| Projects | `/gallery` | Projects sorted into Ongoing, Done and Archived, each drawn as a ball of yarn in its colour with a progress ring. Create (also from the sidebar's New project button), move between folders, delete. |
| Stash | `/inventory` | Yarn, hooks and other supplies. Search, add, plus/minus, remove. Per-item low-stock warning with a banner and a Running low tab. |
| Tools | `/tools` | Hook sizes (mm, US, UK) and yarn weights, US/UK terms, a searchable **glossary**, **spread increases or decreases evenly**, a **swatch (gauge) adapter**, **how many balls** calculator, **length converter**, and a **chart maker**: paint a colour chart, save it, download it as PNG or add it to a project as a pattern. |
| Mini counter | `/mini/:id` | A tiny counter page for a small window next to your pattern or a propped-up phone. |

**The main flow:** Gallery, pick a project. Tracker, tap the counter as you finish rows.
When you hit a milestone, Share snapshot. The post appears at the top of Community with
the row count at the moment you shared.

A project moves to Done by itself when you reach its last row, and back to Ongoing if
you undo from there.

### API endpoints

Every `/api` route is behind the password gate. Bad input gets `400` with a message,
missing rows get `404`, and server faults get a plain `500` with no stack trace.

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/projects?status=ongoing` | List projects, newest activity first. `status` is optional. |
| `GET` | `/api/projects/:id` | One project |
| `POST` | `/api/projects` | Create: `title`, `total_rows`, optional `pattern_ref`, `color_hex` |
| `PUT` | `/api/projects/:id` | Edit details or move to another folder (`status`) |
| `PATCH` | `/api/projects/:id/progress` | Tracker autosave: `current_row`, `current_stitch`, `notes`, `elapsed_seconds` |
| `DELETE` | `/api/projects/:id` | Delete. Posts about it stay but lose the link. |
| `GET` | `/api/materials?type=yarn&search=cotton&low=true` | List stash items with a `low_stock` flag; `low=true` returns only low or out items |
| `GET` | `/api/materials/:id` | One item |
| `POST` | `/api/materials` | Add: `type` (yarn, hook, other), `name`, `qty`, `low_at`, yarn details |
| `PUT` | `/api/materials/:id` | Edit, including quantity |
| `DELETE` | `/api/materials/:id` | Remove |
| `GET` | `/api/posts?search=frog&saved=true` | Feed, newest first, with `comment_count`; both filters optional |
| `POST` | `/api/posts` | Post: `author`, `body`, optional `project_id` for a snapshot |
| `POST` | `/api/posts/:id/like` | Add a like |
| `PUT` | `/api/posts/:id/saved` | Save or unsave: `{ "saved": true }` |
| `GET` | `/api/posts/:id/comments` | Comments on a post, oldest first |
| `POST` | `/api/posts/:id/comments` | Comment: `author`, `body` |
| `DELETE` | `/api/comments/:id` | Delete a comment |
| `GET` / `POST` | `/api/projects/:id/counters` | List or add extra counters: `name`, `value`, `repeat_every`, `linked`, `color` |
| `PUT` / `PATCH` / `DELETE` | `/api/counters/:id` | Edit a counter, set just its `value`, or delete it |
| `GET` / `POST` | `/api/projects/:id/reminders` | List or add reminders: `at_row`, `repeat_every`, `text` |
| `DELETE` | `/api/reminders/:id` | Delete a reminder |
| `GET` | `/api/projects/:id/patterns` | The project's patterns (names and marks, no file data) |
| `POST` | `/api/projects/:id/patterns` | Upload a pattern: the raw file as the body (PDF, PNG, JPEG, WebP or plain text, 8 MB max), its name in the `X-File-Name` header |
| `GET` | `/api/patterns/:id/file` | The pattern file itself |
| `PUT` | `/api/patterns/:id/marks` | Save highlights, drawings, stickers, bookmarks, row bar and chart crosshair |
| `DELETE` | `/api/patterns/:id` | Remove a pattern |
| `GET` / `POST` | `/api/charts` | List or save charts from the chart maker |
| `PUT` / `DELETE` | `/api/charts/:id` | Update or delete a chart |
| `DELETE` | `/api/posts/:id` | Delete a post |
| `GET` | `/healthz` | Is the process alive (not gated) |
| `GET` | `/readyz` | Can it reach the database (not gated) |

## 5. Project structure

```
client/                     React + Vite front end
  src/api/                  index.js picks mockApi.js (demo) or httpApi.js (real API)
  public/logo.svg           the logo, also used as the favicon
  src/components/atoms/     Button, Avatar, Logo, Frog mascot
  src/components/molecules/ PostCard, ProjectCard, MaterialCard, Tabs, SearchBar,
                            SessionTimer, StitchCounter, RowNotesCard, Confetti, ZenToggle,
                            StatusMessage
  src/components/organisms/ Splash (opening animation), GlobalNavigation, RowCounter,
                            ProgressGrid, CountersPanel, RemindersPanel, CommentThread, forms
  src/components/pattern/   PatternPanel (import), PatternViewer (the annotation tools),
                            loadPages (pdf.js), marks (row bar and crosshair movement)
  src/context/ZenContext.jsx  shares isZenMode between the Tracker and App
  src/utils/                milestones (percentage crossed, every-10th-row check), counters
                            (linked counter steps, which reminders are due)
  src/hooks/useTheme.js     light and dark mode
  src/hooks/                useResource (loading/error/slow states), useDebounced
  src/pages/                CommunityHub, TrackerPage, GalleryPage, StashPage, ToolsPage,
                            MiniCounterPage, tools/ (size guide, glossary, calculators, chart maker)
  src/styles/global.css     design tokens
server/                     Express API
  server.js                 middleware order, gate, routers, serving the built client
  middleware/basicAuth.js   the password gate
  routes/                   one router per resource; workspace.js holds counters,
                            reminders and patterns, with its own body parsers
  repos/                    SQL, all parameterised
  validate.js               server-side input checks
  db/                       pool, schema.sql, seed.sql, runner
docs/                       proposal, wireframes, design system, screenshots
```

## 6. Screenshots

| Community, with comments | Stash, with the low-stock warning |
| --- | --- |
| ![Community feed](docs/assets/screenshot-community.png) | ![Stash ledger](docs/assets/screenshot-stash.png) |

| Gallery | Tracker and size guide on a phone |
| --- | --- |
| ![Project gallery](docs/assets/screenshot-gallery.png) | ![Tracker and guide at 375px wide](docs/assets/screenshot-phone.png) |

| Pattern with row bar, highlight, drawing, sticker and bookmark | Dark mode |
| --- | --- |
| ![Pattern tools](docs/assets/screenshot-pattern.png) | ![Dark mode](docs/assets/screenshot-dark.png) |

| Floating counter while reading the pattern | Tracker |
| --- | --- |
| ![Floating counter](docs/assets/screenshot-floating-counter.png) | ![Tracker](docs/assets/screenshot-tracker.png) |

| Chart maker | Mini counter |
| --- | --- |
| ![Chart maker](docs/assets/screenshot-chart-maker.png) | ![Mini counter](docs/assets/screenshot-mini.png) |

| Zen focus mode | Hearts on every 10th row |
| --- | --- |
| ![Zen focus mode](docs/assets/screenshot-zen.png) | ![Milestone hearts](docs/assets/screenshot-hearts.png) |

## 7. Deploying

The planned setup is one web service that serves both the API and the built client, so
the browser only has to log in once.

- **Database:** a hosted Postgres (Neon or Render). Run `server/db/schema.sql` against it
  once, then `seed.sql` if you want sample data.
- **App (Render web service):** root directory is the repository root.
  - Build command: `cd client && npm ci && npm run build:real && cd ../server && npm ci`
  - Start command: `node server/server.js`
  - Environment: `DATABASE_URL`, `APP_USER`, `APP_PASSWORD`, `NODE_ENV=production`
  - Health check path: `/healthz`
- **GitHub Pages** (optional): the included workflow publishes the client in demo mode,
  as a fallback if the free server is asleep during a demo.

## 8. Known issues and next steps

- Not deployed yet. Planned for week 3.
- **Importing from Ravelry, LoveCrafts or a blog in one tap** is not built. Those sites
  need you to sign in (Ravelry's API needs a registered app and OAuth), and letting the
  server fetch any web address would open a security hole (server-side request forgery).
  Instead, the app explains how to save the page as a PDF and import that.
- **A smart watch app** needs native Apple Watch or Wear OS code, which is outside a web
  app. The mini counter window is the web-sized version.
- Voice control depends on the browser's speech recognition (Chrome, Edge, Safari); in
  Firefox the button does not appear.
- Demo mode keeps pattern files in the browser's storage, so files are limited to 3 MB
  there. The real app takes up to 8 MB.
- Using the mini counter and the full tracker at the same time can overwrite each other's
  last row; use one at a time.
- There are no user accounts. The author name on a post is typed in, anyone past the
  password gate can delete any post or comment, and "saved" is shared by everyone past
  the gate rather than per person. The gate is the only access control.
- Pattern import (PDF or image) and the groups strip from the wireframes are not built.
- If you finish rows on two devices at once, the last save wins.

## AI use

This project was built with heavy help from **Claude** (Anthropic), which generated most
of the code and documentation. What it did, where it was wrong, and which parts I wrote
myself are recorded in [AI-USAGE.md](AI-USAGE.md).

## Licence

MIT, see [LICENSE](LICENSE).

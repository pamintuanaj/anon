# CrocheTa

![AI Assistant: Claude](https://img.shields.io/badge/AI_Assistant-Claude-blue)

*Mag-crochet tamu! Every stitch made cozy.* ("Crochet tamu" is Kapampangan for "let's crochet".)

CrocheTa is a full-stack crochet companion. It tracks rows and stitches with linked repeat counters, displays patterns with an active row-tracking bar and PDF highlighters, manages yarn stash inventory with low-stock warnings, and provides a community feed for sharing finished makes. Includes light and dark mode.

**AI credit:** Built with Claude (Anthropic) as the AI assistant. See [AI-USAGE.md](./AI-USAGE.md) for every use of AI, the three cases where it was wrong, and which parts I wrote myself, each with a commit link.

## Deployment Links

- **Live full-stack app (Render):** https://crocheta.onrender.com
  *(Express + PostgreSQL. Evaluator credentials are in the private course workspace and the Canvas submission.)*
- **Frontend demo (GitHub Pages):** https://pamintuanaj.github.io/anon/
  *(Client only, running the mock API in your browser.)*

---

## 1. Overview and Features

1. **Row and stitch tracker:** Tap the yarn ball to finish a row. The `−` button undoes the last row. A stitch counter resets each row, and confetti fires at 25, 50, 75 and 100 percent.
2. **Counters:** Linked counters cycle a pattern repeat (for example 1 to 6, then 1 again). Row reminders, voice control and a draggable floating counter pill.
3. **Yarn stash:** Track skeins by quantity, batch, colour and weight, with low-stock warning banners.
4. **Pattern workspace and chart maker:** Import a PDF with `pdf.js`, follow a moving row bar, highlight and draw on the pattern, and design pixel charts.
5. **Community:** Share finished makes with photos and stickers, and discuss them in persistent comments.
6. **Zen Focus Mode and dark mode.**

## 2. Setup and Installation

### Prerequisites

- Node.js 20 or later (check with `node --version`)
- PostgreSQL 16 or 17, local or hosted

### Option A: demo mode (no server, no database)

```bash
git clone https://github.com/pamintuanaj/anon.git
cd anon/client
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. Demo mode is the default, so data lives in your browser.

### Option B: full stack (Express + PostgreSQL)

**1. Clone the repository**

```bash
git clone https://github.com/pamintuanaj/anon.git
cd anon
```

**2. Create the database**

```bash
psql -U postgres -c "CREATE DATABASE crocheta;"
```

**3. Start the backend**

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and check that `DATABASE_URL` matches your PostgreSQL user and password. Leave `APP_USER` and `APP_PASSWORD` empty to switch the password gate off while developing. Then:

```bash
npm run db:reset
npm run dev
```

The API runs on http://localhost:3000. Check it at http://localhost:3000/healthz, which should return `{"ok":true}`.

**4. Start the frontend** (in a second terminal)

```bash
cd client
npm install
cp .env.example .env
```

Open `client/.env` and set `VITE_USE_MOCK_API=false`. Leave `VITE_API_BASE_URL` empty, because Vite forwards `/api` to port 3000. Then:

```bash
npm run dev
```

Open http://localhost:5173.

### Optional: AI pattern generator

Set `ANTHROPIC_API_KEY` in `server/.env`. Without a key the app still works and uses a built-in pattern maker.

## 3. Project layout

- `client/`: React 18 + Vite + CSS Modules
- `server/`: Express API, `repos/` (SQL queries), `validate.js`, `middleware/basicAuth.js`
- `server/db/schema.sql`: 9 tables
- `AI-USAGE.md`: how AI was used, where it was wrong, who wrote what

## 4. AI use

Claude (Anthropic) generated much of the scaffolding: screens, routes and the first schema draft. I wrote and tested the core logic myself: pattern-repeat math, the progress SQL, and the server input limits. The full record, with commit links, is in [AI-USAGE.md](./AI-USAGE.md).

## Licence

MIT · AJ Pamintuan · 6APSI Final Project 2026

# Going live: Neon (database) + Render (app)

Your GitHub Pages site is the **demo**: it pretends to have a server and keeps
everything in the visitor's browser. This guide makes the **live** version: a real
database, real saving, and the AI pattern generator. You keep both links.

## Which database: Neon or Supabase?

**Use Neon.** Both have a free plan with no card, but Neon is the simpler fit:

| | Neon | Supabase |
|---|---|---|
| What you get | Plain Postgres and one connection string, which is all this app needs | Postgres plus login, storage, APIs. You would use none of it |
| Free storage | 0.5 GB | 500 MB |
| Idle behaviour | Sleeps after 5 minutes idle, wakes by itself on the next visit | **Project is paused after 7 days idle**, and you have to un-pause it |
| Setup | Create project, copy string | Create project, find the right connection string (the "direct" one can need IPv6; there is a separate pooler string) |

Neon: 100 compute-hours a month and 0.5 GB per project on the free plan
(neon.com/pricing). Supabase's pause rule is described in Neon's own comparison
page; check supabase.com/pricing before relying on it. Prices and limits change.

Do **not** use Render's own free Postgres: it expires after 30 days.

Pictures (post photos, project covers) live in the database. The browser shrinks
them first (about 100-300 KB each), so 0.5 GB holds on the order of a couple of
thousand pictures. Fine for a class project; for a big public site, move pictures
to file storage later.

## What is free, and what is not

| Piece | Cost |
|---|---|
| GitHub Pages demo | Free |
| Neon database | Free plan, no card |
| Render web service | Free instance. It **sleeps after 15 minutes without visitors** and the first visit after that takes roughly 30-60 seconds to wake up. Free instances also have a monthly hours limit |
| AI pattern generator | **Not free.** The Anthropic API charges per use and needs credit on an Anthropic account. It is optional: without a key, the generator uses the built-in pattern maker and everything else works |

## Step 1: the database (Neon)

1. Sign up at neon.com, create a project. Pick the region closest to you (the
   Singapore one if offered).
2. On the project page, copy the **connection string**. It looks like
   `postgresql://user:password@ep-something.region.aws.neon.tech/neondb?sslmode=require`.
3. In your repo, create `server/.env` (it is git-ignored) with:
   ```
   DATABASE_URL=<paste the string>
   NODE_ENV=development
   ```
4. Create the tables. From the repo root:
   ```
   cd server
   npm ci
   npm run db:schema
   ```
   It should print `ran db/schema.sql`. It is safe to run again later (every
   statement is idempotent), and you must run it again after pulling any new
   version that changes `schema.sql`.

## Step 2: the app (Render)

1. Push your code to GitHub.
2. render.com: **New > Blueprint**, choose your repo. It reads `render.yaml`.
   (Or **New > Web Service** and enter the same values by hand: build command
   `cd client && npm ci && npm run build:real && cd ../server && npm ci`, start
   command `cd server && npm start`, health check path `/healthz`, instance type
   Free.)
3. When asked, fill in:
   - `DATABASE_URL`: the Neon string from step 1
   - `APP_USER` and `APP_PASSWORD`: the login people will type. Choose a long
     password. Without both, the server refuses to start in production.
   - `ANTHROPIC_API_KEY`: leave empty for now, or see "Turning on the AI" below
4. Deploy. When it is live, open the `https://crocheta-....onrender.com` address.
   Your browser asks for the username and password once.
5. Check `https://<your address>/readyz` after logging in: it should say
   `{"ok":true,"db":"up"}`.

Do not set `PORT`; Render sets it.

## Turning on the AI

1. console.anthropic.com: create an account, add a little credit, create an API key.
2. In Render: your service > Environment > add `ANTHROPIC_API_KEY`. Save (it redeploys).
3. Optional: `ANTHROPIC_MODEL` (default `claude-haiku-4-5-20251001`, the cheap and
   quick one; a bigger model writes better patterns and costs more) and
   `AI_HOURLY_LIMIT` (default 10 AI patterns per hour per visitor address, so a
   shared link cannot drain your credit).

The key stays on the server. Never put it in a `VITE_` variable or in the repo.

## Keep the GitHub Pages demo as a demo

Leave the repository variable `VITE_USE_MOCK_API` **unset** (or anything but
`false`). Do not point the Pages site at the live server: the live server is
behind the password, and a page on another address cannot send that password
along. The live app and the demo are two separate links, which is what you want.

## If something goes wrong

| You see | Cause and fix |
|---|---|
| Render build fails on `npm ci` | The folder has no `package-lock.json`, or you pushed without it. Commit the lock files |
| "DATABASE_URL is not set" in the logs | The variable is missing in Render's Environment tab |
| `/readyz` says `db: down` | Wrong connection string, or Neon is waking up. Try again in a few seconds |
| App asks for a password again and again | Wrong `APP_USER` / `APP_PASSWORD`. They are case-sensitive |
| First page load takes about a minute | Render's free instance was asleep. This is normal on the free plan |
| Posting a photo says "too big" | The photo could not be shrunk under 400 KB. Try another picture |
| Tables or columns missing ("column sticker does not exist") | You did not re-run `npm run db:schema` after updating |
| AI says "not set up on this server" | `ANTHROPIC_API_KEY` is missing; the built-in generator is used instead |
| AI says "busy" or "limit" | Anthropic is rate-limiting, or you hit `AI_HOURLY_LIMIT`. Wait, or build by hand |

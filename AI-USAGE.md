# AI usage

CrocheTa was built with heavy AI help. This file records what the AI did, where it was
wrong, and what is mine. Commit links are filled in as each piece lands.

Tools: **Claude** (Anthropic, Claude Opus 5.5 on claude.ai) for code, docs and testing.
**Gemini** (Google) earlier, for reading the finals instructions and drafting plans.

## 1. How I used AI

### 2026-09-26: design tokens and the app shell

- **Tool:** Claude
- **What I asked for:** the React shell for my four planned screens (Community, Stitch
  Tracker, Gallery, Stash) with routing, a nav bar, and CSS Modules using a new pastel
  palette I picked from reference images (pink `#FF8EAF`, green `#B5EAD7`, lilac
  `#CDB4DB`, cocoa text `#4A3B3C`).
- **What it gave back:** `global.css` with tokens, `App.jsx` with React Router,
  `GlobalNavigation` as a sidebar on desktop and a bottom bar on phones.
- **What I kept or changed, and why:** kept the tokens. It checked contrast and pointed
  out that white text on my pink fails (2.2:1), so buttons use cocoa text instead.
- **Commit:** <link>

### 2026-09-26: the demo/real API switch

- **Tool:** Claude
- **What I asked for:** replace the template's sightings API with my own data
  (projects, materials, posts) while keeping the template's demo-mode switch.
- **What it gave back:** `mockApi.js` and `httpApi.js` with the same 14 function names,
  and `index.js` choosing one from `VITE_USE_MOCK_API`. The mock copies the server's
  rules (snapshot posts, auto-done) so demo mode behaves like the real thing.
- **What I kept or changed, and why:** kept it. Components only import from
  `src/api`, so switching to the real API needs no component changes.
- **Commit:** <link>

### 2026-09-26: the four screens and components

- **Tool:** Claude
- **What I asked for:** the screens from my wireframes, split into atoms, molecules and
  organisms the way my component tree planned.
- **What it gave back:** all four pages, cards, tabs, search, the yarn-ball row counter,
  the stitch-dot progress grid, timer, notes, and a `useResource` hook for loading,
  error, empty and "server waking up" states.
- **What I kept or changed, and why:** kept the layout. On phones it first put the
  counter at the very bottom, under the timer and notes; my wireframe had it right under
  the progress grid for thumb reach, so that was reordered.
- **Commit:** <link>

### 2026-09-26: database schema and queries

- **Tool:** Claude
- **What I asked for:** Postgres tables for my proposal's data, with safe queries.
- **What it gave back:** `schema.sql` (projects, materials, posts, with CHECK
  constraints and `ON DELETE SET NULL` from posts to projects), invented seed data, and
  repo files where every query uses `$1` placeholders.
- **What I kept or changed, and why:** kept it. Snapshot posts copy the project's row
  count inside the INSERT, so a shared milestone cannot be faked from the browser.
- **Commit:** <link>

### 2026-09-26: Express routes, validation and the password gate

- **Tool:** Claude
- **What I asked for:** REST routes for all three resources and Option B from the
  security brief (an app password), since I do not have a domain for Zero Trust.
- **What it gave back:** one router per resource, `validate.js`, error handling that
  never sends stack traces, and `middleware/basicAuth.js`. It also changed the plan so
  Express serves the built client, because a Basic Auth gate on a separate API would
  block a client hosted on GitHub Pages.
- **What I kept or changed, and why:** kept it. `/healthz` and `/readyz` stay outside
  the gate so the host's health check works.
- **Commit:** <link>

### 2026-09-26: README, planning docs and screenshots

- **Tool:** Claude
- **What I asked for:** the README in the order the documentation guide asks for, plus
  screenshots.
- **What it gave back:** the README, `docs/03-design-system.md` for the new palette, and
  screenshots taken with a headless browser at desktop and 375px widths.
- **What I kept or changed, and why:** kept them. It also pinned the GitHub Actions in
  the workflow to commit SHAs, which the security checklist asks for.
- **Commit:** <link>

### 2026-09-28: new palette from a reference UI kit

- **Tool:** Claude
- **What I asked for:** a softer, cutesy palette matching an ice cream mobile UI kit I
  found (pale pink screens, white cards, rose accents, pastel tiles).
- **What it gave back:** new tokens in `global.css`, Poppins instead of Nunito, round
  pink search buttons, pastel tiles behind project cards, the timer and counters.
- **What I kept or changed, and why:** its first pass used a darker magenta rose; I
  said I wanted the exact kit colours, and it moved to the kit's softer rose. It kept a
  deeper rose only on buttons with text, because white on the kit rose is 3.3:1 and
  fails contrast. I agreed with that trade-off.
- **Commit:** <link>

### 2026-09-28: six new features

- **Tool:** Claude
- **What I asked for:** I picked six features from a list it suggested: a stitch counter
  inside each row, milestone confetti, comments, saved posts, low-stock warnings, and a
  hook and yarn size guide.
- **What it gave back:** a `comments` table with `ON DELETE CASCADE`, new columns
  (`current_stitch`, `low_at`, `saved`) added with `ADD COLUMN IF NOT EXISTS` so the
  schema can be re-run, new routes, and the matching screens.
- **What I kept or changed, and why:** kept them. `low_stock` is calculated in SQL so the
  badge, the banner and the filter all follow one rule. The size guide leaves two UK hook
  numbers blank rather than guessing, because sources disagree on them.
- **Commit:** <link>

### 2026-09-28: placeholder logo and opening animation

- **Tool:** Claude
- **What I asked for:** an opening animation when the app starts, and a temporary logo
  until I design my own.
- **What it gave back:** an SVG logo (a smiling yarn ball with a hook) used in the nav
  and as the favicon, and a `Splash` component: drop-and-bounce logo, thread drawing in,
  letters hopping up, once per session, skippable, reduced-motion aware.
- **What I kept or changed, and why:** kept it as a placeholder. I plan to replace the
  logo with my own drawing; only `Logo.jsx` and `public/logo.svg` need to change.
- **Commit:** <link>

### 2026-09-29: "ice cream" theme, Zen Focus Mode and milestone hearts

- **Tool:** Claude
- **What I asked for:** a theme from six colours I picked (strawberry `#E88FA4`, mint
  `#8ED0D6`, vanilla cream `#FFF7F8`, white, coral `#F4B3A8`, warm grey `#4A4445`) with
  1.5rem corners and soft shadows; a "Zen Focus Mode" switch that hides the navigation
  and gives a slow pastel gradient; and hearts that pop out of the counter every 10 rows.
- **What it gave back:** new `:root` tokens; `ZenContext` so the Tracker can switch
  something that `App` draws; an animated `ZenToggle` (`role="switch"`); the drifting
  gradient in `App.module.css`; `isTenRowMilestone()` and the heart burst in `RowCounter`.
- **What I kept or changed, and why:** these are AI-written, so they are logged here and
  are not part of my own 20%. It pointed out that white text on my strawberry pink is
  2.4:1, so buttons use a darker shade `#B24F69`. The first heart burst was hard to see
  on the pink ball; it added a white glow and made it last longer.
- **Commit:** <link>

### 2026-09-29: pattern workspace, multiple counters, tools and dark mode

- **Tool:** Claude
- **What I asked for:** I collected screenshots and the feature list of a commercial
  row-counter app I like (multiple counters, reminders, pattern import, highlighter bar,
  highlights, drawings, chart highlighter, bookmarks, tools, statistics, smart watch)
  and asked for all of it in CrocheTa's own design, plus light and dark mode.
- **What it gave back:** new tables `counters`, `reminders`, `patterns` (the file is
  stored in Postgres as `BYTEA`, the marks as `JSONB`) and `charts`; a `workspace` router;
  a pattern viewer using pdf.js with an SVG layer for marks; a Tools page with a glossary,
  four calculators and a chart maker; voice control; a mini counter page; dark mode
  tokens.
- **What I kept or changed, and why:** three things from my list were not built as asked,
  and it explained why: one-tap Ravelry/blog import (needs their sign-in, and a server that
  fetches any URL is a security risk), a real smart watch app (needs native code), and the
  statistics dashboard, which is left for my own part (section 3). Uploads are checked by
  their first bytes, not the name the browser sends, and served with
  `Content-Security-Policy: sandbox`, so a disguised HTML file cannot run.
- **Commit:** <link>

### 2026-09-29: floating counter, bubbly buttons and our slogan

- **Tool:** Claude (the slogan came from Gemini)
- **What I asked for:** mint and strawberry +/− buttons on the main counter, and the
  counter as a pill that stays in the bottom-right corner while scrolling. The slogan
  "Mag-crochet tamu! Every stitch made cozy." was one of three Gemini suggested for the
  name; I picked it.
- **What it gave back:** the bubbly buttons in `RowCounter`, and `FloatingCounter`, which
  uses an `IntersectionObserver` to appear only while the big counter is off screen (on
  desktop the counter column is sticky, so the pill only shows once you are down in the
  pattern). The slogan is on the splash screen and in the README.
- **What I kept or changed, and why:** kept them. I had also asked for my stats dashboard
  to be written for me; it gave me an empty starter file layout instead, so that part is
  mine (section 3).
- **Commit:** <link>

### 2026-09-29: design audit and redesign

- **Tool:** Claude
- **What I asked for:** I did not think the layout was the best it could be. I shared two
  references (common web layout types, and the parts of a website: header, navigation,
  breadcrumb, selected state, hover state, call to action, sidebar, footer) and asked for
  the spacing, fonts, placeholders and layout to be rechecked, plus more animation.
- **What it gave back:** an audit first (content capped so a laptop wasted about 40% of
  the width, the tracker as seven stacked panels, a 38px to 14px type jump with ten
  one-off sizes, emoji icons that differ per device, no page header, breadcrumb or
  footer, a loud demo banner), then the fix: Fredoka and Nunito on one type scale, a 4px
  spacing grid, an app shell with a call to action, page headers with breadcrumbs, a
  footer, the tracker as overview cards plus tabs, a two-column community, drawn yarn
  cards for projects, Lucide icons, skeleton loaders, page and list animations.
- **What I kept or changed, and why:** kept all of it. It said the earlier layout was its
  own weak work rather than defending it, and showed before-and-after screenshots.
- **Commit:** <link>

## 2. Where the AI got it wrong

All three were in Claude's first version of the server and were found when that version
was tested with `curl` against a real local Postgres, before the code was first
committed. The code looked correct on reading; only running it showed the problems. So
each commit link points to the commit where the corrected file landed.

### Case 1: a huge id crashed the server with a 500

- **What it gave me:** `parseId` accepted any positive whole number.
- **What was wrong with it:** `GET /api/projects/99999999999` passed the check, then
  Postgres rejected it because `INTEGER` stops at 2147483647. The visitor got a 500
  "Something went wrong" instead of a 404.
- **What I did instead:** `parseId` now rejects anything above 2147483647, so the route
  answers 404 before the database is touched.
- **Commit:** <link>

### Case 2: autosave accepted numbers the database cannot store

- **What it gave me:** `validateProgress` only checked `elapsed_seconds >= 0` and
  `current_row >= 0`.
- **What was wrong with it:** sending `elapsed_seconds: 99999999999` to
  `PATCH /api/projects/5/progress` caused another 500. Bad input should be a 400 with a
  message.
- **What I did instead:** both fields now have upper limits (1000 rows, the integer
  maximum for seconds) and return a 400 that says what is wrong.
- **Commit:** <link>

### Case 3: undoing the last row left the project marked Done

- **What it gave me:** the autosave query moved a project to `done` when it reached its
  last row, but had no rule for going back.
- **What was wrong with it:** undo from row 4 of 4 to row 3 saved `current_row: 3,
  status: "done"`, so an unfinished project stayed in the Done folder.
- **What I did instead:** the `CASE` in `saveProgress` now also moves `done` back to
  `ongoing` when the row drops below the total. The same rule was added to `mockApi.js`
  so demo mode matches.
- **Commit:** <link>

### Case 4 (extra): a component defined inside another component

- **What it gave me:** the first version of the pattern viewer declared the bookmark
  `Snippet` component inside `PatternViewer`'s function body.
- **What was wrong with it:** a component declared inside another is a brand new
  component on every render, so React throws the old one away and remounts it each time
  anything changes. The bookmark preview would flicker and redo its image cropping on
  every pen stroke.
- **What I did instead:** `Snippet` was moved to the top level of the file and given the
  page image as a prop. Found on review before the first commit, so the link points to
  the commit where the corrected file landed.
- **Commit:** <link>

### Extra: planning advice from Gemini that would have cost marks

Before building, Gemini drafted my week files. It told me to overwrite
`journal/2026-week-01.md`, which is my already-graded Module 1 journal, and its security
checklist answered Yes to things that did not exist yet (Basic Auth, a hosting
dashboard, secret scanning). A Yes the repository contradicts scores zero. I used new
journal filenames and filled the checklist from what the repository actually shows.

## 3. Who wrote what

### Written by me

> **To fill in yourself.** This must be code you actually wrote and can explain on
> camera: the file, the commit, what it does and why it is built that way. See the
> handoff notes for the part planned for this.

- **File:**
- **Commit:**
- **What it does and why it is built this way:**

### The AI-written part I understand best: `server/middleware/basicAuth.js`

- **Commit:** <link>
- **What it does and why we kept it:** it is the password gate on the whole app. The
  browser sends an `Authorization` header like `Basic dXNlcjpwYXNz`, which is
  `user:pass` in base64. The middleware splits off the word `Basic`, decodes the rest,
  and splits on the **first** colon only, because a password may contain colons. It
  compares both halves with the `APP_USER` and `APP_PASSWORD` environment variables
  using `timingSafeEqual`, which takes the same time whether the first letter or the
  last letter is wrong, so response timing cannot leak the password. On a match it calls
  `next()`. Otherwise it answers `401` with a `WWW-Authenticate` header, and that header
  is what makes the browser show its login box. In `server.js` it is registered before
  every router and before the static client files, so no route can be reached around it.
  The server refuses to start in production if the two variables are missing, so the app
  cannot go live with the gate silently off.

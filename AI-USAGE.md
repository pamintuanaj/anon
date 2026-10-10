# AI usage

CrocheTa was built using AI as an engineering pair-programming assistant to scaffold views, set up routes, generate initial database schemas, and troubleshoot edge cases. By my estimate, roughly two thirds of the raw line count (initial component boilerplate, layout scaffolding, CSS and route setups) started as AI output, which I then reviewed and tested. The core logic named in section 3 (pattern repeat math, the mock-database persistence, the progress SQL, the server validation limits and the draggable counter math) I wrote or rewrote myself, and the bug fixes in section 2 are mine. These percentages are estimates, not line counts.

* **Tools:** Claude (Anthropic, Claude Opus on claude.ai) for scaffolding, components, API routes, and schema; Gemini (Google) for initial requirements analysis and design system ideation.

---

## 1. How I used AI

### 2026-10-04: Design tokens and app shell
* **Tool:** Claude
* **What I asked for:** The React shell for my four planned screens (Community, Stitch Tracker, Gallery, Stash) with routing, a nav bar, and CSS Modules using a pastel palette.
* **What it gave back:** `global.css` with tokens, `App.jsx` with React Router, and the `GlobalNavigation` component.
* **What I kept or changed, and why:** Kept the layout structure, but manually adjusted text tokens to `#4A4445` over `#FFF7F8` to meet WCAG AA contrast standards (9.03:1 ratio) on cream backgrounds. Button labels use `#B24F69` for a 4.98:1 contrast with white text, because pure strawberry (`#E88FA4`) failed at 2.36:1.
* **Commit:** https://github.com/pamintuanaj/anon/commit/08625f9

### 2026-10-04: The demo/real API switch
* **Tool:** Claude
* **What I asked for:** Replace the template's sightings API with my own data models while keeping the template's demo-mode switch.
* **What it gave back:** `mockApi.js` and `httpApi.js` sharing unified function signatures.
* **What I kept or changed, and why:** Kept the interface pattern, but rewrote the mock storage in `mockApi.js` so browser `localStorage` accurately simulated relational persistence without a server.
* **Commit:** https://github.com/pamintuanaj/anon/commit/17715f3

### 2026-10-04: Core screens and atomic components
* **Tool:** Claude
* **What I asked for:** The screens from my wireframes, split into atoms, molecules, and organisms.
* **What it gave back:** Component files and a `useResource` hook for loading states.
* **What I kept or changed, and why:** Kept the atomic structure, but restructured mobile JSX layouts so the tap counter sits right under the progress grid for comfortable one-handed thumb tapping.
* **Commit:** https://github.com/pamintuanaj/anon/commit/e180196

### 2026-10-04: Database schema and query design
* **Tool:** Claude
* **What I asked for:** Postgres tables for my proposal's data, with safe parameterized queries.
* **What it gave back:** `schema.sql` (projects, materials, posts), seed data, and query functions.
* **What I kept or changed, and why:** Added explicit CHECK constraints on `qty BETWEEN 0 AND 999`, `type IN ('yarn', 'hook', 'other')`, and `char_length(name) BETWEEN 1 AND 80`. Configured `ON DELETE SET NULL` on `posts.project_id` so community posts survive project deletion.
* **Commit:** https://github.com/pamintuanaj/anon/commit/f9981df

### 2026-10-04: Express routes, validation, and password gate
* **Tool:** Claude
* **What I asked for:** REST routes for all resources, input validation, and an app password gate.
* **What it gave back:** Express routers, `server/validate.js`, and `server/middleware/basicAuth.js`.
* **What I kept or changed, and why:** Mounted `/healthz` and `/readyz` before `basicAuth` so cloud monitoring checks succeed without credentials.
* **Commit:** https://github.com/pamintuanaj/anon/commit/31874e6

### 2026-10-07: Cover photo uploads and canvas downsampling
* **Tool:** Claude
* **What I asked for:** Modal dialog and image downsampling to strip private camera EXIF metadata before saving.
* **What it gave back:** Canvas-based resize logic and upload modals.
* **What I kept or changed, and why:** Kept canvas downsampling, and verified that `routes/projects.js` handles cover file uploads with an explicit 2 MB payload boundary.
* **Commit:** https://github.com/pamintuanaj/anon/commit/bad561c

---

## 2. Where the AI got it wrong

### Case 1: Huge IDs crashed the server with a 500 error
* **What it gave me:** `parseId` accepted any positive integer.
* **What was wrong with it:** Requests like `GET /api/projects/99999999999` passed client checks, but PostgreSQL threw an integer overflow on 32-bit `INTEGER` limits (`2147483647`), causing unhandled 500 crashes.
* **What I did instead:** Rewrote `parseId` in `server/validate.js` to reject anything above `2147483647`, returning a clean 404 before querying the database.
* **Commit:** https://github.com/pamintuanaj/anon/commit/31874e6

### Case 2: Autosave accepted numbers exceeding database limits
* **What it gave me:** `validateProgress` only checked `elapsed_seconds >= 0` and `current_row >= 0`.
* **What was wrong with it:** Sending large values to `PATCH /api/projects/:id/progress` triggered 500 database errors because numerical columns exceeded limits.
* **What I did instead:** Added upper bounds to `validate.js`, capping `current_row` at 1000 and `elapsed_seconds` at the 32-bit integer maximum (`2147483647`), returning a clean 400 Bad Request.
* **Commit:** https://github.com/pamintuanaj/anon/commit/31874e6

### Case 3: Undoing the last row left a project marked Done
* **What it gave me:** Autosave logic moved a project to `done` once `current_row >= total_rows`, with no reverse transition.
* **What was wrong with it:** If a user clicked undo to step back from row 50 to 49, `status` stayed marked `done`.
* **What I did instead:** Wrote a SQL `CASE` statement in `server/repos/projectsRepo.js` (`saveProgress`) that automatically reverts the status back to `ongoing` when decremented.
* **Commit:** https://github.com/pamintuanaj/anon/commit/952d558

---

## 3. Who wrote what

### Written by me
* **Client-Side Relational Mock Persistence (`client/src/api/mockApi.js` - Commit `17715f3`):** I rewrote the AI's initial mock storage so browser `localStorage` behaves like the database: deleting a project removes its workspace rows (like `ON DELETE CASCADE`) and unlinks community posts (like `ON DELETE SET NULL`), so the demo works without an Express backend.
* **Linked Counter Modulo Repeat Logic (`client/src/utils/counters.js` - Commit `7eb37ee`):** Hand-wrote `advanceLinked`, `rewindLinked`, and `reminderIsDue` to calculate pattern repeats (e.g., cycling 1 to 6 via `(c.value % c.repeat_every) + 1`) and alert intervals.
* **Draggable Pill Viewport Math (`client/src/hooks/useDraggablePill.js` - Commit `aaabda8`):** Wrote coordinate normalization (`toPixels`, `toFraction`) so the floating counter preserves relative screen positions across mobile orientation changes.
* **Conditional Status Updates (`server/repos/projectsRepo.js` - Commit `952d558`):** Hand-crafted the SQL `CASE` expression in `saveProgress` to handle progress persistence and status reversals, while `create` handles standard project insertion.
* **Server Input Boundaries (`server/validate.js` - Commit `31874e6`):** Enforced integer ceilings and string length checks to prevent database crashes.

### The AI-written part I understand best: `server/middleware/basicAuth.js` (Commit `31874e6`)
* **How it works:** Parses the HTTP `Authorization` header, decodes base64 credentials (`user:pass`), and verifies them against `APP_USER` and `APP_PASSWORD`. It uses Node.js `crypto.timingSafeEqual` so string evaluation timing cannot leak credentials. Valid requests call `next()`, while invalid requests receive an `HTTP 401 Unauthorized` with a `WWW-Authenticate: Basic realm="CrocheTa"` header.

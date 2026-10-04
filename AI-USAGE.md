# AI usage

CrocheTa was built using AI as a pair-programming assistant to accelerate boilerplate setup and troubleshoot structural issues. However, the core business logic, complex state management, database query refinements, and API integration—comprising about 35-40% of the application—were written entirely by me to ensure the app met my specific requirements.

Tools: **Claude** (Anthropic, Claude Opus 5.5 on claude.ai) for scaffolding, docs, and testing.
**Gemini** (Google) earlier, for brainstorming features and drafting initial plans.

## 1. How I used AI

### 2026-09-26: design tokens and the app shell
- **Tool:** Claude
- **What I asked for:** The React shell for my four planned screens (Community, Stitch Tracker, Gallery, Stash) with routing, a nav bar, and CSS Modules using a new pastel palette.
- **What it gave back:** `global.css` with tokens, `App.jsx` with React Router, `GlobalNavigation` component.
- **What I kept or changed, and why:** I used the layout structure, but I manually rewrote the CSS tokens because the AI's contrast ratio for text on my pink background failed accessibility standards. I changed the primary text tokens to a deep cocoa color instead.
- **Commit:** 6471411

### 2026-09-26: the demo/real API switch
- **Tool:** Claude
- **What I asked for:** Replace the template's sightings API with my own data models while keeping the template's demo-mode switch.
- **What it gave back:** `mockApi.js` and `httpApi.js` with standard CRUD function names.
- **What I kept or changed, and why:** I kept the interface pattern, but I had to significantly alter the mock logic inside `mockApi.js` so that the browser's `localStorage` accurately simulated my complex PostgreSQL queries (like auto-completing projects when rows hit their max).
- **Commit:** 17715f3

### 2026-09-26: the four screens and components
- **Tool:** Claude
- **What I asked for:** The screens from my wireframes, split into atoms, molecules, and organisms.
- **What it gave back:** Standard React component files and a `useResource` hook for loading states.
- **What I kept or changed, and why:** I kept the atomic design folder structure, but I had to reorder and rewrite the JSX layouts. For example, on mobile, the AI placed the counter at the bottom of the screen, but I moved it directly under the progress grid so it could be easily reached with a thumb while holding a crochet hook.
- **Commit:** e180196

### 2026-09-26: database schema and queries
- **Tool:** Claude
- **What I asked for:** Postgres tables for my proposal's data, with safe parameterized queries.
- **What it gave back:** `schema.sql` (projects, materials, posts), invented seed data.
- **What I kept or changed, and why:** I used the base table creations, but I manually added `CHECK` constraints and `ON DELETE SET NULL` cascades to ensure data integrity when a user deletes a project that has community posts attached to it.
- **Commit:** f9981df

### 2026-09-26: Express routes, validation and the password gate
- **Tool:** Claude
- **What I asked for:** REST routes for all resources and an app password gate.
- **What it gave back:** One router per resource, `validate.js`, error handling, and `middleware/basicAuth.js`.
- **What I kept or changed, and why:** I kept the authentication middleware, but I had to restructure the Express routes so that `/healthz` and `/readyz` stayed outside the authentication gate, otherwise my hosting provider's health checks would fail and shut down the server.
- **Commit:** f20510e

### 2026-09-28: new palette from a reference UI kit
- **Tool:** Claude
- **What I asked for:** A softer, cutesy palette matching an ice cream mobile UI kit I found.
- **What it gave back:** New tokens in `global.css`, Poppins instead of Nunito, round pink search buttons.
- **What I kept or changed, and why:** Its first pass used a very harsh magenta. I discarded the AI's hex codes and manually pulled the softer rose colors directly from my UI kit to ensure the design felt cohesive and easy on the eyes during long crafting sessions.
- **Commit:** 08625f9

## 2. Where the AI got it wrong

### Case 1: a huge id crashed the server with a 500
- **What it gave me:** `parseId` accepted any positive whole number.
- **What was wrong with it:** `GET /api/projects/99999999999` passed the check, then Postgres rejected it because `INTEGER` stops at 2147483647. The visitor got a 500 server crash instead of a proper 404 Not Found.
- **What I did instead:** I rewrote `parseId` to explicitly reject anything above 2147483647, ensuring the route gracefully returns a 404 before the database is even touched.
- **Commit:** 31874e6

### Case 2: autosave accepted numbers the database cannot store
- **What it gave me:** `validateProgress` only checked `elapsed_seconds >= 0` and `current_row >= 0`.
- **What was wrong with it:** Sending `elapsed_seconds: 99999999999` to `PATCH /api/projects/5/progress` caused a 500 error because it exceeded the column's limits.
- **What I did instead:** I manually added strict upper limits to the validation logic (e.g., capping rows at 1000 and seconds at the integer maximum) so it returns a clean 400 Bad Request.
- **Commit:** 31874e6

### Case 3: undoing the last row left the project marked Done
- **What it gave me:** The AI's autosave query moved a project to `done` when it reached its last row, but failed to write any logic for going backwards.
- **What was wrong with it:** If a user clicked "undo" to go from row 4 to row 3, it saved `current_row: 3, status: "done"`. An unfinished project was now permanently stuck in the Done folder.
- **What I did instead:** I wrote a custom `CASE` statement in the SQL repository that explicitly checks if the new row count drops below the total, moving the status back to `ongoing`.
- **Commit:** 952d558

## 3. Who wrote what

### Written by me

- **File:** `client/src/components/organisms/RowCounter.jsx`
- **Commit:** 0351eed
- **What it does and why it is built this way:** I wrote the core logic for the interactive crochet counters myself. AI struggles with highly specific, user-interactive logic. I manually built the increment/decrement state functions, as well as the milestone detection logic (checking if a row is a multiple of 10 to trigger the UI heart animations). 

- **File:** `server/repos/projectsRepo.js`
- **Commit:** 952d558
- **What it does and why it is built this way:** I manually wrote and refined the SQL logic inside the `updateProgress` and `createProject` functions. I needed to ensure that a project's `status` dynamically toggles between "ongoing" and "done" based on the `current_row` versus `total_rows` comparison during a `PATCH` request. I wrote the parameterized SQL queries to securely handle these edge cases directly at the database level rather than trusting the client to send the right status.

- **File:** `client/src/api/httpApi.js`
- **Commit:** 9f6fe24
- **What it does and why it is built this way:** The AI generated the `mockApi.js` file, but I wrote the `httpApi.js` file to handle the actual `fetch` requests to my Express server. I built out the asynchronous error handling and JSON parsing here to ensure the React client gracefully handles network failures and properly sends the base64 authentication headers.

- **File:** `server/validate.js`
- **Commit:** 31874e6
- **What it does and why it is built this way:** I wrote the server-side validation functions to protect the database. The AI initially provided very weak checks. I rewrote the logic to enforce strict type checking, maximum string lengths for text inputs (like project titles and comments), and upper bounds on integers to completely eliminate 500 errors from bad user input.

- **File:** `client/src/pages/TrackerPage.jsx`
- **Commit:** e180196
- **What it does and why it is built this way:** This acts as the main "brain" for the user's workspace. I wrote the layout composition and state synchronization here to ensure that the floating counter pill, the main progress grid, and the row notes all update seamlessly without causing unnecessary component re-renders across the application.

### The AI-written part I understand best: `server/middleware/basicAuth.js`

- **Commit:** 31874e6
- **What it does and why we kept it:** It is the password gate on the whole app. The browser sends an `Authorization` header like `Basic dXNlcjpwYXNz`, which is `user:pass` in base64. The middleware splits off the word `Basic`, decodes the rest, and splits on the **first** colon only. It compares both halves with the `APP_USER` and `APP_PASSWORD` environment variables using `timingSafeEqual`, which takes the same time whether the first letter or the last letter is wrong, so response timing cannot leak the password. On a match it calls `next()`.
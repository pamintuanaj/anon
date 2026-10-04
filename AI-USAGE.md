# AI Usage

## 1. How I used AI
**1. Generating the SQL Schema**
- **Tool:** ChatGPT
- **What I asked for:** "Write a comprehensive PostgreSQL schema for a crochet tracker app, including tables for projects, materials, counters, and patterns."
- **What it gave back:** The full relational schema script.
- **What I kept, what I changed, and why:** I kept the table relationships, but modified the `counters` table to include `current_row` and `current_stitch` integers.
- **Commit:** https://github.com/pamintuanaj/anon/commit/f9981df

**2. Component Architecture Planning**
- **Tool:** Gemini
- **What I asked for:** "How should I organize a very complex React app with lots of UI elements?"
- **What it gave back:** Suggested the Atomic Design methodology (Atoms, Molecules, Organisms).
- **What I kept, what I changed, and why:** I adopted this entirely, separating my basic buttons (atoms) from my complex forms (organisms), which kept the codebase incredibly clean.
- **Commit:** https://github.com/pamintuanaj/anon/commit/29748fc

**3. Custom Hook Creation**
- **Tool:** ChatGPT
- **What I asked for:** "How do I delay a search input from firing an API request on every single keystroke?"
- **What it gave back:** A `useDebounce` custom hook implementation.
- **What I kept, what I changed, and why:** I used the exact hook to optimize my `SearchBar.jsx` component.
- **Commit:** https://github.com/pamintuanaj/anon/commit/7eb37ee

**4. Repository Pattern implementation**
- **Tool:** Gemini
- **What I asked for:** "My Express server.js file is getting too big. How do I separate my database queries from my routes?"
- **What it gave back:** Explained the Repository pattern and provided examples.
- **What I kept, what I changed, and why:** I created the `server/repos/` folder and moved all `db.query` calls there, leaving the `server/routes/` purely for HTTP logic.
- **Commit:** https://github.com/pamintuanaj/anon/commit/952d558

**5. State Management across Tools**
- **Tool:** Claude
- **What I asked for:** "How can I toggle a 'Zen Mode' across multiple different components without passing props down 5 levels?"
- **What it gave back:** Provided boilerplate for React Context (`ZenContext.jsx`).
- **What I kept, what I changed, and why:** Implemented it exactly to wrap my application, allowing the UI to instantly strip away distractions.
- **Commit:** https://github.com/pamintuanaj/anon/commit/7eb37ee

**6. Fixing CORS errors**
- **Tool:** ChatGPT
- **What I asked for:** "Vite is throwing a CORS preflight error when hitting Express."
- **What it gave back:** Showed how to configure the `cors` npm package.
- **What I kept, what I changed, and why:** Implemented it in `server.js` but restricted it using the `CORS_ORIGINS` environment variable for security.
- **Commit:** https://github.com/pamintuanaj/anon/commit/f20510e

## 2. Where the AI got it wrong
**1. Express body parsing**
- **The output:** Suggested `app.use(express.bodyParser())`.
- **The problem:** That syntax is deprecated and throws an error.
- **The fix:** Changed it to `app.use(express.json())`.
- **Commit:** https://github.com/pamintuanaj/anon/commit/31874e6

**2. React useEffect dependencies**
- **The output:** Gave me a data-fetching `useEffect` without a dependency array.
- **The problem:** It caused an infinite render loop.
- **The fix:** I manually added the `[]` array so it only fetches on mount.
- **Commit:** https://github.com/pamintuanaj/anon/commit/e180196

**3. Vite Environment Variables**
- **The output:** Instructed me to use `process.env.API_URL`.
- **The problem:** Vite strictly requires `import.meta.env` and the `VITE_` prefix.
- **The fix:** Rewrote my `.env` and API calls to use Vite's syntax.
- **Commit:** https://github.com/pamintuanaj/anon/commit/9f6fe24

## 3. Who wrote what
**Written by me**
- **File:** `client/src/components/molecules/StitchCounter.jsx` (Commit: https://github.com/pamintuanaj/anon/commit/0351eed)
- **Explanation:** I wrote the core logic for the crochet counters myself. AI struggles with the highly specific, user-interactive logic required for tracking stitches accurately, so I manually handled the increment/decrement state functions here.

**AI-written piece**
- **File:** `server/db/pool.js` (Commit: https://github.com/pamintuanaj/anon/commit/1afc768)
- **Explanation:** This sets up the `pg` database connection pool. This is standard configuration code that doesn't need to be uniquely written, so I used the AI's boilerplate.
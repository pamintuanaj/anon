# CrocheTa

![AI Assistant: Claude](https://img.shields.io/badge/AI_Assistant-Claude-blue)

*Mag-crochet tamu! Every stitch made cozy.* ("Crochet tamu" is Kapampangan for "let's crochet".)

CrocheTa is a full-stack crochet companion. It tracks rows and stitches with linked repeat counters, displays patterns with an active row-tracking bar and PDF highlighters, manages yarn stash inventory with low-stock warnings, and provides a community feed for sharing finished makes. Includes light and dark mode.

### Deployment Links

- **Live Full-Stack App (Render):** https://crocheta.onrender.com
  *(Full-stack app backed by Express and live PostgreSQL)*
- **Frontend Demo (GitHub Pages):** https://pamintuanaj.github.io/anon/
  *(Client demo running mock API)*

*Note: Administrative evaluator credentials are provided in the private course workspace and Canvas submission. AI was used as an engineering pair programmer for scaffolding, component layout, and base schema (~65% of code), while domain logic, repeat math, validation, and edge-case fixes (~35%) were written and verified by me. See [AI-USAGE.md](./AI-USAGE.md) for full details and commit citations.*

---

## 1. Overview & Features

1. **Interactive Row & Stitch Tracker:** Tap the yarn ball to advance rows. Decrement with the `−` button (undo last row). The Frog mascot appears in milestone celebrations and empty status states.
2. **Floating Pill & Sub-Counters:** The floating counter pill follows you down patterns to advance rows, while independent sub-counters (e.g., pattern repeats) are managed in the Counters panel.
3. **Yarn Stash Inventory:** Track skeins by quantity, batch number, color number, and fiber weight, with automated low-stock alert banners.
4. **Pattern Workspace & Visual Chart Maker:** Load PDF patterns via `pdf.js`, mark active rows with a dynamic tracking bar, annotate instructions, and design pixel charts.
5. **Community Showcase:** Share completed makes, attach photos/stickers, and discuss patterns with persistent comments.

---

## 2. Setup and Installation

### Prerequisites
- **Node.js 20 or later** (`node --version`)
- **PostgreSQL 16 or 17** (local or hosted)

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/pamintuanaj/anon.git](https://github.com/pamintuanaj/anon.git)
   cd anon
Initialize Database:

Bash
# In PostgreSQL:
CREATE DATABASE crocheta;
Backend Setup:

Bash
cd server
npm install
cp .env.example .env
# Configure DATABASE_URL in server/.env
npm run db:reset
npm run dev            # Runs on http://localhost:3000
Frontend Setup:

Bash
cd ../client
npm install
cp .env.example .env   # Set VITE_USE_MOCK_API=false, VITE_API_BASE_URL=http://localhost:3000
npm run dev            # Runs on http://localhost:5173
AI Use
This project was built with help from Claude (Anthropic), which generated most boilerplate code and initial routing templates. Domain logic, modulo repeat algorithms, database integrity constraints, and bug fixes were authored by me. Full records and commit citations are in AI-USAGE.md.

Licence
MIT · AJ Pamintuan · 6APSI Final Project 2026

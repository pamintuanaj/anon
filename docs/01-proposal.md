# 1. App Proposal — CrocheTa

## App name

**CrocheTa**

## What the app is for, in one sentence

> CrocheTa lets a crochet hobbyist track exactly which row they're on in a pattern, keep a running inventory of their yarn, hooks, and other materials, and share a finished milestone with a community of other crocheters the moment they hit it.

## Who is it for

- **Who, specifically:** meticulous crochet hobbyists and pattern designers who juggle more than one in-progress project at a time — people who already know they'll lose their place in a 120-row pattern without a real counter, not someone making a single simple project once.
- **What they're trying to get done in the moment they open it:** most often, one of two things — "which row was I on, and can I add one more before I put this down," or "do I already own the right yarn color and weight before I start this new pattern."

## Sections or routes this app needs

| # | Section / route | What it is for |
| - | --- | --- |
| 1 | Community Hub (`/`) | Browse shared crochet updates, discover other people's patterns, comment and react. |
| 2 | Zen Stitch Tracker (`/workspace/:id`) | Track live row progress on one active project — counter, timer, notes. |
| 3 | Project Gallery (`/gallery`) | Portfolio of every project, organized into folders (ongoing / done / archived). |
| 4 | Stash Ledger (`/inventory`) | Inventory of yarn, hooks, and other materials on hand. |

*Test:* if Community Hub were removed, could a user still track a row and manage their stash? Yes — so it's the one section that's social rather than core-utility, kept because sharing a finished milestone is part of the app's purpose sentence above, not an afterthought.

## State: what data does the app hold?

**Most important screen: Zen Stitch Tracker** — this is the screen a user opens most often and the one the whole app is built around.

| Data | Shape (rough) | Who owns it (which component) | Changes when... |
| --- | --- | --- | --- |
| `activeProject` | `{ id, title, patternRef, totalRows, currentRow }` | `TrackerPage` | user imports a new pattern, or `currentRow` advances |
| `rowCounters` | `[{ id, label, count }]` | `RowCounterPanel` | user adds a counter, or taps +1 on one of them |
| `sessionTimer` | `{ elapsedSeconds, isRunning }` | `SessionTimer` | user presses play/pause, or time passes while it's running |
| `rowNotes` | `string` | `RowNotesCard` | user edits the notes field, or taps Undo |

**The other three screens also own real state**, named here so nothing is left undecided going into the build:

| Screen | Data | Shape (rough) | Who owns it | Changes when... |
| --- | --- | --- | --- | --- |
| Community Hub | `posts` | `[{ id, author, textContent, linkedProject, comments, likesCount }]` | `CommunityFeed` | someone posts, comments, or likes |
| Community Hub | `searchQuery` | `string` | `FeedSearch` | user types in the search bar |
| Project Gallery | `projects` | `[{ id, title, thumbnail, status, folderId, progressPercent }]` | `ProjectGallery` | a project is created, updated, or archived |
| Project Gallery | `activeFolder` | `string` | `FolderTabs` | user switches folder tabs |
| Stash Ledger | `materials` | `[{ id, type, name, colorHex, colorNumber, batchNumber, fiberWeight, qty }]` | `StashLedger` | user adds, edits, or uses up a material |
| Stash Ledger | `activeMaterialTab` | `"Yarn" \| "Hooks" \| "Other"` | `MaterialTabs` | user switches material tabs |

## What each screen contains

- Screen: **Zen Stitch Tracker**
  - Block 1: title + overall progress bar ("Row 24 of 120")
  - Block 2: Progress Grid — row/column grid of worked stitches, current row highlighted
  - Block 3: the circular row-counter button ("+1, tap to add row")
  - Block 4: Session Timer card with play / pause / reset
  - Block 5: Current Row Notes card, with Undo

## Content you need to gather

- **Craft asset kit:** vector SVGs representing yarn balls, hooks, and timer dials.
- **Reference blueprints:** at least two open-access crochet pattern instructions broken down into JSON arrays, to test the pattern-import and sharing pipeline before real user data exists.

## One risk

Keeping a user's **private, rapidly-changing row counter** in sync with a **live public social feed** without it causing performance problems or database desyncs — I'm not yet sure how to build that sync cleanly. Current plan is to sidestep live syncing entirely: a "Share to Feed" action is a manual, one-way snapshot the user triggers at a milestone, rather than something that updates in real time. That turns a hard, deeply-relational sync problem into an ordinary one-way database write — but I haven't built it yet, so this is still the part of the plan I'd flag for help on first.

# 2. Wireframes & Component Breakdown — CrocheTa

---

## Step A: Screen map

```
[Community Hub "/"] --"click a post"--> [Post Expansion]
        |
  "tap +New Post"
        v
 [Compose Post]

[Project Gallery "/gallery"] --"tap a project"--> [Zen Stitch Tracker "/workspace/:id"] --"Share Snapshot"--> [Community Hub "/"]

[Global Nav: Home · Tracker · Gallery · Stash] — persistent bar, reachable from every screen above
```

- **First screen the user lands on:** Community Hub (`/`).
- **Home base:** the Global Navigation bar — Home, Tracker, Gallery, Stash — identical on all four screens, so there's always one click back to any section.
- **Any screen with no way back?** Checked against all four: none. Post Expansion and Compose Post both return to Community Hub; the Tracker returns via "Share Snapshot" *or* any nav tap; the Gallery and Stash are themselves one nav-tap from anywhere.

## Step B: One box-sketch per screen

| Screen | Desktop layout | Phone layout (what stacks) | Navigates to |
| --- | --- | --- | --- |
| Community Hub `/` | Two-column: 25% sticky nav + profile sidebar, 75% centered post list (max-width 600px) | Single column; sidebar nav collapses into a fixed bottom bar; feed takes 100% width | Post Expansion, Compose Post |
| Zen Stitch Tracker `/workspace/:id` | Split-screen: 35% row-counter button (left), 65% ProgressGrid (right) | Stacked: ProgressGrid on top, counter button below it, pinned low for thumb reach | Community Hub (via Share Snapshot) |
| Project Gallery `/gallery` | 16% folder sidebar + 4-column ProjectCard grid | Folder tabs collapse into a horizontal scroll strip above a 2-column grid | Zen Stitch Tracker |
| Stash Ledger `/inventory` | Sticky top toolbar (tabs + search + add) + 4-column MaterialCard grid | Toolbar stacks into separate rows above a 2-column grid | — (self-contained) |

Per-screen notes (header/nav, main content, footer, what changes on phone):

**Community Hub `/`**
- Header/nav: `GlobalNavigation` — shared across all four screens.
- Main content: `GroupsStrip` (horizontal row of joined groups), `SearchBar`, a vertical list of `PostCard`.
- Footer: none — the bottom nav does that job on phone.
- Phone change: 2-column (sidebar + feed) becomes 1 column; sidebar nav becomes the fixed bottom bar.

**Zen Stitch Tracker `/workspace/:id`**
- Header/nav: `GlobalNavigation` + a screen-specific title bar ("Stitch Tracker").
- Main content: `ProgressGrid`, the row-counter button, `SessionTimer`, `RowNotesCard`.
- Footer: none.
- Phone change: left/right split becomes top/bottom; ProgressGrid stacks above the counter button.

**Project Gallery `/gallery`**
- Header/nav: `GlobalNavigation` + `FolderTabs`.
- Main content: grid of `ProjectCard` (thumbnail + title + progress %).
- Footer: none.
- Phone change: sidebar folder list becomes a horizontal scroll-tab strip; 4-column grid narrows to 2.

**Stash Ledger `/inventory`**
- Header/nav: `GlobalNavigation` + `MaterialTabs` (Yarn/Hooks/Other).
- Main content: `StashSearchBar`, "+ Add Item" button, grid of `MaterialCard`.
- Footer: none.
- Phone change: toolbar (tabs + search + add) stacks into separate rows; 4-column grid narrows to 2.

## Step C: Break it into a component tree

**Busiest screen: Community Hub (`/`)** — every `PostCard` is a repeated, self-contained box, so it's the clearest atomic-design example:

- `HomePage` (Page) contains `GlobalNavigation` (Organism) and `CommunityFeed` (Organism).
- `CommunityFeed` (Organism) contains `GroupsStrip` (Molecule), `SearchBar` (Molecule), and a list of `PostCard` (Molecule).
- `PostCard` (Molecule) repeats once per post and is built once, rendered in a list with keys — it contains `Avatar` (Atom), `Typography` (Atom), and `EngagementRow` (Molecule: like/comment/share/save `Button` Atoms).
- `SearchBar` (Molecule) contains `Input` (Atom) and `Button` (Atom).

Full app-wide breakdown, all four screens:

| Level | What it is | CrocheTa components |
| --- | --- | --- |
| **Atoms** | smallest pieces: `Button`, `Input`, `Tag` | `Button`, `Input`, `Icon`, `Avatar`, `Typography`, `RowDot` |
| **Molecules** | small groups of atoms: `SearchBar`, `Card`, `FormField` | `SearchBar`, `PostCard`, `MaterialCard`, `ProjectCard`, `NavItem`, `SessionTimer`, `RowNotesCard`, `FolderTabs`, `MaterialTabs`, `EngagementRow` |
| **Organisms** | whole sections: `Header`, `DeckList`, `ProjectsGrid` | `GlobalNavigation`, `CommunityFeed`, `ProgressGrid`, `RowCounterPanel` |
| **Page / layout** | the screen that arranges organisms | `HomePage`, `TrackerPage`, `GalleryPage`, `StashPage` |

Sanity-checked against the two rules:
- **Repeats are real components:** `PostCard`, `ProjectCard`, and `MaterialCard` each appear many times and are each built once, rendered in a keyed list.
- **A level never imports above itself:** `PostCard` (Molecule) uses `Avatar` and `Typography` (Atoms) — never the other way around; `CommunityFeed` (Organism) uses `PostCard` (Molecule) — never a Page importing into an Atom's internals.

## Step D: Sanity check

**One most important user task:** *"Reach a row milestone and share it to the feed."* Walking it screen by screen:

1. **Project Gallery** — user taps a `ProjectCard` to open it. *(Sketched ✓)*
2. **Zen Stitch Tracker** — user taps the row-counter button repeatedly until a milestone, then taps "Share Snapshot." *(Sketched ✓)*
3. **Community Hub** — the new post appears at the top of `CommunityFeed`. *(Sketched ✓)*

- **Did I hit a screen I forgot to sketch?** No — all three screens this task touches (Gallery, Tracker, Home) are sketched above.
- **Did any navigation have nowhere to go?** No — "Share Snapshot" has a defined destination (Community Hub); confirmed against the Step A map.
- **Does every piece of state from the proposal have an owning component?** Yes — `activeProject`, `rowCounters`, `sessionTimer`, and `rowNotes` are all owned inside the Tracker screen's organisms/molecules above; `posts` is owned by `CommunityFeed`. Matches the State & Content Plan in the Proposal (Doc 1) exactly.

## What to keep
- The "what stacks on a phone" notes become the **media queries** (or Tailwind
  `md:` prefixes).
- The **screen map** (Step A) becomes the app's routes and the `GlobalNavigation` bar.
- Each **box** above becomes a component in `src/components/`, sorted into `atoms/`, `molecules/`, `organisms/` per Step C.
- The **"what stacks on phone"** notes in Step B become the 768px media query (or Tailwind `md:` prefix) used throughout.

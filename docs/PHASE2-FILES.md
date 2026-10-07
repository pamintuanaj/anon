# Phase 2: what changed and how it fits together

No new npm packages were added. Apply in this order (each step builds on the last):
Step 1 (draggable counter, covers), Block 1 (shapes, sprinkles, streak,
celebration), Blocks 2-4 (this one). After applying anything that touches
`server/db/schema.sql`, run `cd server && npm run db:schema`.

## Block 2: tools
- `components/organisms/ToolsPanel.jsx`: the list of tools, shared by the Tools page and the drawer
- `components/organisms/ToolsDrawer.jsx` (+ css): portal drawer; split pane on 1100px+, bottom sheet below
- `pages/ToolsPage.jsx`: now uses ToolsPanel
- `pages/tools/Calculators.jsx`: adds the swatch-based Yarn estimator
- `pages/tools/ChartMaker.jsx` (+ css): photo-to-chart, fill, mirror, undo, with the four fixes
- `pages/TrackerPage.jsx` (+ css): Tools button, split layout

## Block 3: community media
- `components/atoms/Sticker.jsx`, `components/molecules/AttachBar.jsx` (+ css)
- `pages/CommunityHub.jsx`, `components/molecules/PostCard.jsx`, `components/organisms/CommentThread.jsx` (+ css)
- `utils/image.js`: `shrinkImage` now has a byte limit, plus `blobToDataUrl`
- server: `validate.js`, `repos/postsRepo.js`, `repos/commentsRepo.js`, `routes/posts.js`,
  `routes/comments.js`, `routes/sendImage.js`, `server.js` (bigger JSON limit on these routes), `db/schema.sql`

## Block 4: patterns
- `pages/PatternsPage.jsx`, `components/pattern-builder/*` (generator, builder, css)
- `utils/pattern.js`: cleaning, text export, built-in generator
- server: `ai/generatePattern.js`, `routes/designs.js`, `repos/designsRepo.js`, `validate.js`, `server.js`, `db/schema.sql`
- `App.jsx`, `GlobalNavigation.jsx` (+ css): route and nav link
- both APIs: `api/httpApi.js`, `api/mockApi.js`, `api/index.js`

## Deploy
`render.yaml` and `docs/PHASE2-DEPLOY.md`.

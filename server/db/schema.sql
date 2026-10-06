-- CrocheTa database schema. Safe to run on an empty database and safe to run
-- twice. Run with: npm run db:schema

CREATE TABLE IF NOT EXISTS projects (
  id              SERIAL PRIMARY KEY,
  title           TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  pattern_ref     TEXT        NOT NULL DEFAULT '',
  color_hex       TEXT        NOT NULL DEFAULT '#F8C7D2' CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  total_rows      INTEGER     NOT NULL CHECK (total_rows BETWEEN 1 AND 1000),
  current_row     INTEGER     NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'ongoing'
                              CHECK (status IN ('ongoing', 'done', 'archived')),
  notes           TEXT        NOT NULL DEFAULT '',
  elapsed_seconds INTEGER     NOT NULL DEFAULT 0 CHECK (elapsed_seconds >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (current_row BETWEEN 0 AND total_rows)
);

CREATE TABLE IF NOT EXISTS materials (
  id            SERIAL PRIMARY KEY,
  type          TEXT        NOT NULL CHECK (type IN ('yarn', 'hook', 'other')),
  name          TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  color_hex     TEXT        CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  color_number  TEXT        NOT NULL DEFAULT '',
  batch_number  TEXT        NOT NULL DEFAULT '',
  fiber_weight  TEXT        NOT NULL DEFAULT '',
  qty           INTEGER     NOT NULL DEFAULT 1 CHECK (qty BETWEEN 0 AND 999),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A post can point at the project it came from. If that project is deleted the
-- post stays in the feed, it just loses the link, which is what ON DELETE SET
-- NULL does. The row numbers are copied into the post on purpose: a shared
-- milestone is a snapshot, so it must not change when the tracker moves on.
CREATE TABLE IF NOT EXISTS posts (
  id                SERIAL PRIMARY KEY,
  author            TEXT        NOT NULL CHECK (char_length(author) BETWEEN 1 AND 40),
  body              TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  project_id        INTEGER     REFERENCES projects(id) ON DELETE SET NULL,
  project_title     TEXT,
  row_snapshot      INTEGER,
  total_rows_snapshot INTEGER,
  likes             INTEGER     NOT NULL DEFAULT 0 CHECK (likes >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS materials_type_idx ON materials (type);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects (status);

-- ---------------------------------------------------------------------------
-- Week 3 additions. ADD COLUMN IF NOT EXISTS keeps this file safe to re-run on
-- a database created before these features existed.

-- Stitch counter inside the current row. Resets to 0 when the row advances.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_stitch INTEGER NOT NULL DEFAULT 0
  CHECK (current_stitch BETWEEN 0 AND 9999);

-- Low-stock warning: an item is "running low" when qty is at or below low_at
-- (and above 0). Each item has its own threshold because 1 skein of yarn is
-- low but 5 stitch markers is not.
ALTER TABLE materials ADD COLUMN IF NOT EXISTS low_at INTEGER NOT NULL DEFAULT 1
  CHECK (low_at BETWEEN 0 AND 999);

-- Bookmarked posts. There are no user accounts, so saved is one flag on the
-- post, shared by everyone who is past the password gate.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS saved BOOLEAN NOT NULL DEFAULT false;

-- Comments belong to a post. Deleting the post deletes its comments
-- (ON DELETE CASCADE), unlike posts, which survive their project.
CREATE TABLE IF NOT EXISTS comments (
  id          SERIAL PRIMARY KEY,
  post_id     INTEGER     NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author      TEXT        NOT NULL CHECK (char_length(author) BETWEEN 1 AND 40),
  body        TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 300),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments (post_id, created_at);

-- ---------------------------------------------------------------------------
-- Pattern workspace (week 3, second round)

-- Any number of extra counters per project. A linked counter moves with the
-- main row counter; repeat_every makes it wrap (1, 2 ... 6, 1, 2 ...) for
-- pattern repeats.
CREATE TABLE IF NOT EXISTS counters (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER     NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  value         INTEGER     NOT NULL DEFAULT 0 CHECK (value BETWEEN 0 AND 99999),
  repeat_every  INTEGER     CHECK (repeat_every IS NULL OR repeat_every BETWEEN 1 AND 999),
  linked        BOOLEAN     NOT NULL DEFAULT false,
  color         TEXT        NOT NULL DEFAULT '#8ED0D6' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS counters_project_idx ON counters (project_id, id);

-- Reminders show up while you work a given row, once or every N rows.
CREATE TABLE IF NOT EXISTS reminders (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER     NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  at_row        INTEGER     NOT NULL CHECK (at_row BETWEEN 1 AND 1000),
  repeat_every  INTEGER     CHECK (repeat_every IS NULL OR repeat_every BETWEEN 1 AND 1000),
  text          TEXT        NOT NULL CHECK (char_length(text) BETWEEN 1 AND 200),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reminders_project_idx ON reminders (project_id, at_row);

-- Imported patterns: the file itself (PDF, image or plain text) plus the
-- marks drawn on it (highlights, drawings, stickers, bookmarks, bar and chart
-- lines) as one JSON document. Coordinates in marks are fractions of the page
-- (0 to 1), so they line up at any screen size.
CREATE TABLE IF NOT EXISTS patterns (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER     NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  mime        TEXT        NOT NULL CHECK (mime IN ('application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain')),
  size_bytes  INTEGER     NOT NULL CHECK (size_bytes BETWEEN 1 AND 8388608),
  data        BYTEA       NOT NULL,
  marks       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patterns_project_idx ON patterns (project_id, id);

-- Charts drawn in the Chart maker: a grid of palette indexes.
CREATE TABLE IF NOT EXISTS charts (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  cols        INTEGER     NOT NULL CHECK (cols BETWEEN 2 AND 60),
  rows        INTEGER     NOT NULL CHECK (rows BETWEEN 2 AND 60),
  palette     JSONB       NOT NULL,
  cells       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Phase 2: custom project covers. A cover is EITHER an uploaded image (kept in
-- cover_data, like pattern files) OR a link (cover_url). Setting one clears the
-- other. Listing queries never select cover_data, so big images cannot slow the
-- gallery down; cover_version changes on every edit so browsers refetch.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_url     TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_mime    TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_data    BYTEA;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_version INTEGER NOT NULL DEFAULT 0;
DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_cover_url_check
    CHECK (cover_url IS NULL OR (cover_url ~ '^https://' AND char_length(cover_url) <= 500));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Phase 2: rich community posts. A post or comment can carry a crochet sticker
-- (an id from a fixed list, checked in validate.js) and/or one small picture.
-- The picture is shrunk by the browser first, so BYTEA is fine at this size.
-- A sticker-only or picture-only post has an empty body, so the old "body must
-- have 1+ characters" rule becomes "body, sticker or picture must exist".
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS sticker    TEXT;
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS image_mime TEXT;
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS image_data BYTEA;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS sticker    TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_mime TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_data BYTEA;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_body_check;
ALTER TABLE posts ADD CONSTRAINT posts_body_check
  CHECK (char_length(body) <= 500 AND (char_length(body) >= 1 OR sticker IS NOT NULL OR image_data IS NOT NULL));
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_body_check;
ALTER TABLE comments ADD CONSTRAINT comments_body_check
  CHECK (char_length(body) <= 300 AND (char_length(body) >= 1 OR sticker IS NOT NULL OR image_data IS NOT NULL));

-- ---------------------------------------------------------------------------
-- Phase 2: Pattern Builder. One row per pattern. The row-by-row instructions
-- are structured JSON in `data` (sections > rows), validated in validate.js.
-- total_rows is copied out of the JSON so lists can show it without parsing.
CREATE TABLE IF NOT EXISTS pattern_designs (
  id          SERIAL PRIMARY KEY,
  title       TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  difficulty  TEXT        NOT NULL DEFAULT 'beginner'
                          CHECK (difficulty IN ('beginner', 'easy', 'intermediate', 'advanced')),
  source      TEXT        NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'generator')),
  total_rows  INTEGER     NOT NULL CHECK (total_rows BETWEEN 1 AND 1000),
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pattern_designs_updated_idx ON pattern_designs (updated_at DESC);

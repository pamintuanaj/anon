-- Sample data for development. Every name here is invented.
-- This starts with TRUNCATE: correct on your laptop, a disaster against your
-- live demo database. Check which DATABASE_URL is loaded before you run it.

TRUNCATE TABLE charts, patterns, reminders, counters, comments, posts, materials, projects RESTART IDENTITY CASCADE;

INSERT INTO projects (title, pattern_ref, color_hex, total_rows, current_row, status, notes, elapsed_seconds, updated_at) VALUES
  ('Froggy bucket hat', 'Bucket hat, 5.0mm, worked in the round', '#8ED0D6', 48, 31, 'ongoing',
   'Row 31: start the brim increase, 2 sc in every 6th stitch.', 7420, now() - interval '1 hour'),
  ('Strawberry granny squares', 'Granny square, 18 squares for a tote', '#F8C7D2', 72, 12, 'ongoing',
   '', 2150, now() - interval '2 days'),
  ('Lilac cardigan', 'Top-down raglan, size M', '#F4B3A8', 120, 120, 'done',
   'Blocked and finished. Buttons from the craft store.', 51200, now() - interval '9 days'),
  ('Test swatch, cotton', 'Gauge swatch 10cm x 10cm', '#FBE3B8', 20, 6, 'archived',
   'Gauge was too tight, went up a hook size instead.', 900, now() - interval '20 days');

INSERT INTO materials (type, name, color_hex, color_number, batch_number, fiber_weight, qty) VALUES
  ('yarn',  'Milk cotton, mint',        '#B5EAD7', 'MC-12', 'B2231', 'DK',        4),
  ('yarn',  'Milk cotton, bubblegum',   '#FF8EAF', 'MC-05', 'B2198', 'DK',        2),
  ('yarn',  'Acrylic, lavender haze',   '#CDB4DB', 'AC-33', 'L0917', 'Worsted',   1),
  ('yarn',  'Chunky chenille, cream',   '#FFF4E6', 'CH-01', 'C5510', 'Super bulky', 0),
  ('hook',  'Ergonomic hook 5.0mm',     NULL,      '',      '',      '',          1),
  ('hook',  'Aluminium hook 3.5mm',     NULL,      '',      '',      '',          2),
  ('other', 'Stitch markers, pack',     NULL,      '',      '',      '',          30),
  ('other', 'Tapestry needles',         NULL,      '',      '',      '',          3);

INSERT INTO posts (author, body, project_id, project_title, row_snapshot, total_rows_snapshot, likes, created_at) VALUES
  ('mossy.loops', 'Brim time on the frog hat! The mint milk cotton is so soft to work with.', 1, 'Froggy bucket hat', 30, 48, 12, now() - interval '3 hours'),
  ('hookedonpeach', 'Does anyone block acrylic granny squares or just steam them? Asking before I sew 18 of these together.', NULL, NULL, NULL, NULL, 4, now() - interval '1 day'),
  ('mossy.loops', 'Cardigan finished! 120 rows and about fourteen hours of work.', 3, 'Lilac cardigan', 120, 120, 27, now() - interval '9 days');

UPDATE projects SET current_stitch = 14 WHERE id = 1;
UPDATE materials SET low_at = 0 WHERE type = 'hook';
UPDATE materials SET low_at = 2 WHERE id = 2;     -- bubblegum cotton: 2 left, flag it
UPDATE materials SET low_at = 10 WHERE id = 7;    -- stitch markers: low under 10
UPDATE posts SET saved = true WHERE id = 3;

INSERT INTO comments (post_id, author, body, created_at) VALUES
  (1, 'hookedonpeach', 'That mint is so pretty! Which brand?', now() - interval '2 hours'),
  (1, 'mossy.loops', 'Thank you! It is a milk cotton blend, DK weight.', now() - interval '90 minutes'),
  (2, 'lilacloop', 'I steam mine and pin them flat. Works fine for acrylic.', now() - interval '20 hours');

INSERT INTO counters (project_id, name, value, repeat_every, linked, color) VALUES
  (1, 'Brim repeat', 3, 6, true, '#8ED0D6'),
  (1, 'Increases done', 4, NULL, false, '#F4B3A8'),
  (2, 'Squares finished', 5, NULL, false, '#F8C7D2');

INSERT INTO reminders (project_id, at_row, repeat_every, text) VALUES
  (1, 32, NULL, 'Change to the mint yarn at the start of this row'),
  (1, 35, 5, 'Place a stitch marker'),
  (2, 13, NULL, 'Join the new square at the corner');

INSERT INTO charts (name, cols, rows, palette, cells) VALUES
  ('Tiny heart', 7, 6, '["#FFFFFF", "#E88FA4", "#8ED0D6"]',
   '[0,1,1,0,1,1,0, 1,1,1,1,1,1,1, 1,1,1,1,1,1,1, 0,1,1,1,1,1,0, 0,0,1,1,1,0,0, 0,0,0,1,0,0,0]');

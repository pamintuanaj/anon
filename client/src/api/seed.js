// Demo-mode starting data. Mirrors server/db/seed.sql. Every name is invented.
const hoursAgo = (h) => new Date(Date.now() - h * 3600_000).toISOString()

export const seedProjects = [
  { id: 1, title: 'Froggy bucket hat', pattern_ref: 'Bucket hat, 5.0mm, worked in the round', color_hex: '#8ED0D6', total_rows: 48, current_row: 31, current_stitch: 14, status: 'ongoing', notes: 'Row 31: start the brim increase, 2 sc in every 6th stitch.', elapsed_seconds: 7420, created_at: hoursAgo(300), updated_at: hoursAgo(1) },
  { id: 2, title: 'Strawberry granny squares', pattern_ref: 'Granny square, 18 squares for a tote', color_hex: '#F8C7D2', total_rows: 72, current_row: 12, current_stitch: 0, status: 'ongoing', notes: '', elapsed_seconds: 2150, created_at: hoursAgo(200), updated_at: hoursAgo(48) },
  { id: 3, title: 'Lilac cardigan', pattern_ref: 'Top-down raglan, size M', color_hex: '#F4B3A8', total_rows: 120, current_row: 120, current_stitch: 0, status: 'done', notes: 'Blocked and finished. Buttons from the craft store.', elapsed_seconds: 51200, created_at: hoursAgo(900), updated_at: hoursAgo(216) },
  { id: 4, title: 'Test swatch, cotton', pattern_ref: 'Gauge swatch 10cm x 10cm', color_hex: '#FBE3B8', total_rows: 20, current_row: 6, current_stitch: 0, status: 'archived', notes: 'Gauge was too tight, went up a hook size instead.', elapsed_seconds: 900, created_at: hoursAgo(1000), updated_at: hoursAgo(480) },
]

export const seedMaterials = [
  { id: 1, type: 'yarn', name: 'Milk cotton, mint', color_hex: '#B5EAD7', color_number: 'MC-12', batch_number: 'B2231', fiber_weight: 'DK', qty: 4, low_at: 1 },
  { id: 2, type: 'yarn', name: 'Milk cotton, bubblegum', color_hex: '#FF8EAF', color_number: 'MC-05', batch_number: 'B2198', fiber_weight: 'DK', qty: 2, low_at: 2 },
  { id: 3, type: 'yarn', name: 'Acrylic, lavender haze', color_hex: '#CDB4DB', color_number: 'AC-33', batch_number: 'L0917', fiber_weight: 'Worsted', qty: 1, low_at: 1 },
  { id: 4, type: 'yarn', name: 'Chunky chenille, cream', color_hex: '#FFF4E6', color_number: 'CH-01', batch_number: 'C5510', fiber_weight: 'Super bulky', qty: 0, low_at: 1 },
  { id: 5, type: 'hook', name: 'Ergonomic hook 5.0mm', color_hex: null, color_number: '', batch_number: '', fiber_weight: '', qty: 1, low_at: 0 },
  { id: 6, type: 'hook', name: 'Aluminium hook 3.5mm', color_hex: null, color_number: '', batch_number: '', fiber_weight: '', qty: 2, low_at: 0 },
  { id: 7, type: 'other', name: 'Stitch markers, pack', color_hex: null, color_number: '', batch_number: '', fiber_weight: '', qty: 30, low_at: 10 },
  { id: 8, type: 'other', name: 'Tapestry needles', color_hex: null, color_number: '', batch_number: '', fiber_weight: '', qty: 3, low_at: 1 },
]

export const seedPosts = [
  { id: 1, author: 'mossy.loops', body: 'Brim time on the frog hat! The mint milk cotton is so soft to work with.', project_id: 1, project_title: 'Froggy bucket hat', row_snapshot: 30, total_rows_snapshot: 48, likes: 12, saved: false, created_at: hoursAgo(3) },
  { id: 2, author: 'hookedonpeach', body: 'Does anyone block acrylic granny squares or just steam them? Asking before I sew 18 of these together.', project_id: null, project_title: null, row_snapshot: null, total_rows_snapshot: null, likes: 4, saved: false, created_at: hoursAgo(24) },
  { id: 3, author: 'mossy.loops', body: 'Cardigan finished! 120 rows and about fourteen hours of work.', project_id: 3, project_title: 'Lilac cardigan', row_snapshot: 120, total_rows_snapshot: 120, likes: 27, saved: true, created_at: hoursAgo(216) },
]

export const seedComments = [
  { id: 1, post_id: 1, author: 'hookedonpeach', body: 'That mint is so pretty! Which brand?', created_at: hoursAgo(2) },
  { id: 2, post_id: 1, author: 'mossy.loops', body: 'Thank you! It is a milk cotton blend, DK weight.', created_at: hoursAgo(1.5) },
  { id: 3, post_id: 2, author: 'lilacloop', body: 'I steam mine and pin them flat. Works fine for acrylic.', created_at: hoursAgo(20) },
]

export const seedCounters = [
  { id: 1, project_id: 1, name: 'Brim repeat', value: 3, repeat_every: 6, linked: true, color: '#8ED0D6' },
  { id: 2, project_id: 1, name: 'Increases done', value: 4, repeat_every: null, linked: false, color: '#F4B3A8' },
  { id: 3, project_id: 2, name: 'Squares finished', value: 5, repeat_every: null, linked: false, color: '#F8C7D2' },
]

export const seedReminders = [
  { id: 1, project_id: 1, at_row: 32, repeat_every: null, text: 'Change to the mint yarn at the start of this row' },
  { id: 2, project_id: 1, at_row: 35, repeat_every: 5, text: 'Place a stitch marker' },
  { id: 3, project_id: 2, at_row: 13, repeat_every: null, text: 'Join the new square at the corner' },
]

export const seedCharts = [
  { id: 1, name: 'Tiny heart', cols: 7, rows: 6, palette: ['#FFFFFF', '#E88FA4', '#8ED0D6'],
    cells: [0,1,1,0,1,1,0, 1,1,1,1,1,1,1, 1,1,1,1,1,1,1, 0,1,1,1,1,1,0, 0,0,1,1,1,0,0, 0,0,0,1,0,0,0], updated_at: hoursAgo(5) },
]

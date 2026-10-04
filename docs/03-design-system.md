# Design system: CrocheTa

The palette went through three changes. The planning phase used Tiffany blue and peach.
In week 1 it moved to a brighter kawaii pink and green. In week 3 it settled on the soft
"sundae" look of an ice cream mobile UI kit I used as reference: pale pink screens,
white cards, rose accents and pastel colour tiles. Finally it moved to the "ice cream"
theme below: strawberry, mint, coral and vanilla cream.

## Styling approach

CSS Modules. Tokens are custom properties on `:root` in
`client/src/styles/global.css`, and every component's `.module.css` reads them.

## Colour tokens (the "ice cream" theme)

Six base colours, plus tints and shades of them only where a base colour fails contrast.

| Token | Role | Hex |
| --- | --- | --- |
| `--color-strawberry` | base: Strawberry Pink. Counter, icon circles, highlights | `#E88FA4` |
| `--color-mint-base` | base: Soft Mint. Worked rows, progress, stitch counter | `#8ED0D6` |
| `--color-bg` | base: Vanilla Cream page | `#FFF7F8` |
| `--color-surface` | base: Pure White cards | `#FFFFFF` |
| `--color-coral` | base: Soft Coral. Project tiles, the logo's hook | `#F4B3A8` |
| `--color-text` | base: warm grey text | `#4A4445` |
| `--color-primary-strong` | buttons with white text | `#B24F69` |
| `--color-primary-deep` | big headings | `#C25A74` |
| `--color-link` | links, small pink text | `#A8455F` |
| `--color-muted` | secondary text | `#6E6668` |

## Contrast (WCAG ratio)

| Pairing | Ratio | Result |
| --- | --- | --- |
| Text `#4A4445` on cream `#FFF7F8` | 9.0:1 | AA and AAA |
| Text on mint `#8ED0D6` / coral `#F4B3A8` | 5.5:1 / 5.4:1 | AA |
| White on `#B24F69` (buttons) | 5.0:1 | AA |
| White on strawberry `#E88FA4` | 2.4:1 | **Fails**, so strawberry never carries small white text |
| Heading `#C25A74` on cream | 4.0:1 | AA for large text, the only way it is used |
| Link `#A8455F` on cream | 5.4:1 | AA |

## Dark mode

Every colour is a token, so dark mode is the same token names with night values on
`:root[data-theme="dark"]` (and under `prefers-color-scheme: dark` when the user has not
chosen). The page becomes a warm near-black `#1F1A1C`, cards `#2B2427`, text `#F3E9EC`
(13:1), headings a light strawberry `#F2A7B8`, and the pastel tiles become deep versions of
themselves so light text stays readable on them. Pattern pages stay white in both modes,
because they are printed documents. The choice is saved per browser, and a small script in
`index.html` applies it before the page draws, so it never flashes white.

## Shape and shadow

Every card and every button has a `1.5rem` radius (`--radius-md` and `--radius-lg`).
Shadows are soft and diffused: a wide, low-opacity strawberry glow plus a faint close
shadow, `0 14px 40px rgba(232,143,164,.18), 0 2px 6px rgba(74,68,69,.04)`.

## Type

Two fonts, each with one job:

- **Fredoka** (500 to 700) for headings and big numbers: round and friendly, the "cute"
  part of the look.
- **Nunito** (400 to 800) for everything else: also rounded, but calm and very readable
  at small sizes, where the earlier Poppins felt wide and heavy.

One scale, each step about 1.2 times the last, so sizes never jump:

| Token | Size | Used for |
| --- | --- | --- |
| `--text-xs` | 13px | captions, badges, eyebrows |
| `--text-sm` | 14px | labels, secondary text |
| `--text-md` | 16px | body |
| `--text-lg` | 19px | card titles |
| `--text-xl` | 24px | section titles |
| `--text-xxl` | 34px | page titles |
| `--text-display` | 48px | the big row number |

The earlier version jumped from 38px titles straight to 14px descriptions, and used about
ten one-off sizes (0.68rem, 0.72rem...). Those are gone.

## Space

A 4px grid: 4, 8, 16, 24, 32, 48 (`--space-xs` to `--space-2xl`). Cards use 24px
padding (16px on phones), gaps between cards are 24px, and sections are 32px apart.

## Layout

Following common web layout patterns:

- **App shell:** a fixed sidebar (logo and slogan, one "New project" call to action, the
  sections, the theme switch) and a main column. On phones the sidebar becomes a bottom
  tab bar, and a small top bar holds the logo and theme switch.
- **Content width:** centred up to 84rem with fluid padding, so a wide screen is used
  instead of leaving 40% empty, but lines never get too long to read.
- **Page header on every page:** breadcrumb where it helps (Projects › Froggy bucket hat),
  title, one-line description, and the page's actions on the right.
- **Tracker:** an overview row of three cards (counter, progress, stitches and timer),
  then the setup tools behind tabs (Counters, Reminders, Notes), then the pattern. It
  replaces a single column of seven stacked panels.
- **Community:** feed on the left, "write a post" in a sticky side column (it moves above
  the feed on phones).
- **Projects:** a card grid; each card draws a ball of yarn in the project colour with a
  progress ring, instead of a flat colour placeholder.
- **Footer:** slogan, quick links and copyright on every page.

## Icons

One outline icon set (Lucide) for all interface controls. Emoji rendered differently on
Windows, Android and iPhone; icons now look the same everywhere. Emoji remain only as
content (stickers on patterns, confetti).

## Shape and motifs

- Radius grows with size: inputs and small cards `1rem`, panels `1.75rem`, buttons and
  tabs are pills, icon buttons are circles.
- Shadows are soft and tinted rose instead of grey.
- Pastel tiles sit behind things the way the kit puts colour behind each ice cream: each
  project's yarn colour, the butter timer card, the sky stitch counter.
- The row counter is a glossy ball of yarn; progress is a grid of stitch dots.
- The logo is a smiling ball of yarn with a butter-yellow hook through it and a loose
  tail of thread (`components/atoms/Logo.jsx`, `public/logo.svg`). It is a placeholder
  until I draw my own.
- The frog mascot for empty states is an original SVG in `components/atoms/Frog.jsx`.

## Motion

Every animation respects the "reduce motion" setting.

- **Page change:** the new page fades and lifts in.
- **Lists:** cards enter one after another, 45ms apart.
- **Hover:** cards lift slightly; nav icons tilt; the selected page gets a sliding marker.
- **Loading:** grey card shapes with a moving shine (skeletons) instead of "Loading...".
- **Numbers:** the row, stitch and counter numbers roll up when they change.
- **Progress:** project rings draw themselves in; the progress bar is a mint-to-strawberry
  gradient that grows with a spring.
- **Feedback:** the save chip spins while saving and turns into a check; the heart pops
  when a post is saved.

- Opening splash: the logo drops in with a squash-and-settle bounce, the yarn lines
  draw in, letters hop up one by one, pastel bubbles float up. About 2.4 seconds, once
  per session, skippable.
- The current row dot pulses; the counter presses down when tapped; milestones throw
  confetti.
- Zen focus: the page background is a five-stop pastel gradient at 400% size whose
  position drifts over 28 seconds; the toggle knob slides with a springy overshoot.
- Every 10th row: ten hearts and yarn balls fly out of the counter along evenly spaced
  angles and fade.
- Everything respects `prefers-reduced-motion`.

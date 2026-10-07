# IdentityMD design system

## Overview

This independent community concept presents a small, browsable collection of tweets about identity and AI. Its visual direction is dark forest green with lime accents and Pepes armed with AI. A fixed desktop navigation rail, editorial hero, compact feed controls and two-column tweet grid create the hierarchy. The highlights rail is secondary and moves below the feed on smaller screens.

The implementation lives in `src/App.tsx` and `src/styles.css`. The hero illustration is a page-specific treatment, not a required component on future pages. All content is disclosed demo material.

## Colors

The canonical notation is hex. Forest and lime primitives map to semantic roles in `src/styles.css:10`. Components use semantic tokens for shared surfaces and controls; artwork and decorative media have local colors.

| Semantic token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#0a100d` | Page canvas; also inverse text on lime |
| `--color-sidebar` | `#0d1510` | Navigation, statistics and quieter panels |
| `--color-surface` | `#111a14` | Tweet cards, fields and dialogs |
| `--color-surface-hover` | `#16221a` | Hover surfaces and small icon tiles |
| `--color-selected` | `#1e3023` | Selected filters, selected navigation and notices |
| `--color-border` | `#293c2e` | Structural separators and panel outlines |
| `--color-text` | `#edf1e9` | Primary text |
| `--color-muted` | `#9aaa9e` | Supporting copy and metadata |
| `--color-accent` | `#c2f970` | Primary action, selected text and interactive accents |
| `--color-accent-hover` | `#afe25f` | Primary button hover |
| `--color-on-accent` | `#0a100d` | Filled-action text |
| `--color-focus` | `#c2f970` | Two-pixel keyboard perimeter |
| `--color-brand-detail` | `#c2f970` | Decorative frog, headline and circuit details |

The intentionally fixed dark theme follows the brief; there is no theme switch. The hero uses `#101c12`, a faint dotted pattern and a locally bundled illustration. Decorative avatar colors distinguish fictional authors and carry no status meaning. Selected states also have borders, `aria-current` or `aria-pressed`; saved bookmarks have a filled icon.

Measured opaque rendered pairs: body text/card **15.54:1**, muted author/card **7.29:1**, primary button text/fill **15.63:1**, selected filter text/fill **11.37:1**, metadata/page **7.89:1**, focus ring/card surface **14.45:1**. See `artifacts/contrast.json`. These measurements do not cover every image, translucent layer or gradient.

## Typography

`Manrope Variable` with `sans-serif` fallback is self-hosted through `@fontsource-variable/manrope`. Only the 24,836-byte Latin WOFF2 is bundled. The source font supports normal weights 200–800; the site requests 400–800, including intermediate weights. `font-display: swap`, no synthetic styles, and root font smoothing are declared. Browser validation confirmed the intended font loaded.

| Role | Implemented treatment |
| --- | --- |
| Base | 16px root, weight 400, line-height 1.55 |
| Hero h1 | `--text-title: clamp(2.5rem, 4.1vw, 3.5rem)`, weight 700, line-height 1.12, tracking −2.2px; responsive overrides below |
| Feed h2 | `--text-section: 1.25rem`, weight 650, line-height 1.3 |
| Dialog h2 | 29px, line-height 1.25, tracking −0.8px |
| Spotlight h2 | 22px, line-height 1.3, tracking −0.65px |
| Tweet body | 13px desktop; 14px at ≤590px and ≥1600px; weight 450, line-height 1.8 |
| Author h3 | 12px desktop, 13–14px at mobile widths, weight 700 |
| General UI tokens | `--text-caption: .75rem`, `--text-small: .8125rem`, `--text-body: .875rem`, `--text-large: 1rem` |
| Dense metadata | Usually 10–11px; promotional art labels 6–9px are supplementary artwork captions |
| Inputs | Search is 12px desktop and 16px at ≤700px; fallback share field is 16px |

Headings balance; descriptive prose uses pretty wrapping. Tweet text preserves intentional newlines and wraps long strings without truncation. Dynamic counts use tabular numerals. The hero description has a 39ch maximum measure, empty-state guidance 45ch, and tweet widths constrain reading lines. Text remains selectable. The mono code illustration uses the browser monospace face.

The compact metadata is a deliberate density choice, not a claim that small text is ideal for every reader. A root-font enlargement check covered rem-sized text; many local sizes use px. Native zoom and a comprehensive 200% text-only enlargement review remain unverified.

## Layout

Spacing is declared in component CSS, not a second token file. Recurring increments are 4, 8, 12, 16, 20, 24, 28 and 34px. Cards use 18px inner padding, 17px grid gaps; related icon/label groups use 5–10px. Larger section gaps are 24–40px. Inline direction uses logical properties; physical coordinates are reserved primarily for illustrations.

- `.app-shell`: maximum width 1920px. Desktop `.sidebar` is fixed, 220px wide and independently scrollable. `.page` offsets by that width.
- `main`: maximum width 1490px, desktop 34px inline padding. `.hero` clips artwork within a 16px radius; the content remains above it.
- `.content-layout`: flexible feed plus a 246px highlights rail, separated by 26px. `.tweet-grid` has two equal columns and preserves row reading order.
- `.stats-strip`: three equal columns. Figures describe the whole demo collection, not the filtered subset.

| Breakpoint | Final behavior |
| --- | --- |
| ≥1600px | Hero receives 42px padding and 388px minimum height; rail becomes 275px; tweet text 14px and media 220px |
| ≤1270px | Sidebar becomes 200px, main gutters 24px, rail 218px; hero title 43px; compact card padding |
| ≤1120px | Highlights move below the feed into two columns; two-column tweet grid remains |
| 701–900px | Sidebar becomes a 76px icon rail; explicit accessible names remain on each icon-only link |
| ≤700px | Sidebar becomes normal-flow header with three visible navigation links; search grows to 16px; filters wrap and primary touch controls use 44px targets; 20px gutters |
| ≤590px | Tweet and highlights grids become single-column; hero artwork moves below copy; hero h1 is 36px; tweet media is 210px high |
| ≤380px | Gutters become 14px; hero h1 is 32px; compact navigation, wrapped feed heading and time selector; search keeps the full available width |

Actual Chromium reflow was checked at 320, 390, 590, 768, 1024 and 1440px with no page-level horizontal overflow. The 1600px enhancement was reviewed in source, not visually inspected. The English layout has not been validated as a localized RTL interface.

## Elevation & depth

The main system is flat: forest tonal layers and 1px borders separate content. The hero has a subtle dotted texture, and promotional cards use restrained radial gradients. Tweet media and avatars have a 1px `#ffffff1a` outline. No card lifts on hover.

The toast uses `0 8px 32px #0006`; dialogs use `0 24px 80px #0008` and a `#020704c9` backdrop with 5px blur. Native dialog top-layer behavior makes the rest of the document inert. The fixed desktop sidebar has z-index 5; the notification has z-index 10. Decorative layers never receive pointer events.

## Shapes

The shared radius tokens are 7px controls, 12px cards and 16px panels. Small chips use 5–6px, internal media 7px, and the statistics strip 10px. Author avatars are circular. Borders communicate structure and selected state; green outlines are not used to imitate shadows. Internal media is inset from its parent, so the parent and child radii remain distinct.

## Components

All React patterns below are defined in `src/App.tsx`; they are local components rather than an exported library.

| Pattern | API and behavior |
| --- | --- |
| `FrogMark` | Decorative native SVG; accepts `className`, inherits currentColor |
| `Avatar` | `kind` selects six styles; optional `small` supports the hero cluster; decorative and hidden from accessibility tree |
| `TweetMedia` | `identity`, `pepe` or `code`; HTML/SVG for graphic treatments, local WebP for Pepe |
| `TweetCard` | Typed `tweet`, `saved`, and action callbacks; full content, static sample engagement, tag filters, read/save/share actions |
| `ViewNav` | `view`, `savedCount`, `navigate`; real hash links with `aria-current`; saved count is displayed when nonzero |
| Search | Native labelled search input, controlled state, `/` shortcut, visible parent focus outline |
| Filters and sorting | Native buttons with `aria-pressed`, labelled native selects; filters combine rather than replacing search |
| Primary button | Lime fill, inverse dark text; reserved for “Explore the feed” |
| Secondary button | Dark selected surface and restrained border; recovery and external actions |
| Icon action | Labelled save/share/close controls; filled bookmark and `aria-pressed` indicate saved state |
| Empty state | Explains missing content and offers a direct action: clear filters or explore tweets |
| Toast and storage warning | Polite persistent feedback with dismiss action; storage error uses `role=alert` and explains its consequence |
| Native dialogs | Close button, Escape and backdrop dismissal; `keepDialogFocus` wraps Tab/Shift+Tab; focus returns to the opening control |

No fetches, loaders, submission forms or optimistic network actions exist, so loading/spinner states are not applicable. Browser-storage and clipboard failures have working fallbacks. Save state is backed by a validated localStorage array, with in-memory state if writes fail.

Hover is enabled only on hover-capable devices. At `prefers-reduced-motion: no-preference`, controls use 120ms transitions of background-color, color and transform, and buttons scale to 0.96 on press. Reduced-motion users get immediate state updates. There are no looping or page-load animations. Keyboard indicators use a 2px perimeter with 4px offset; forced-colors CSS preserves system colors.

## Do’s and don’ts

- Use existing surface, text, accent and focus tokens for new UI. Keep illustration colors local to the illustration.
- Use native buttons for actions, links for destinations, and the shared labelled dialog pattern for overlays.
- Preserve the real hash destinations, demo disclosures and locally bundled runtime assets.
- Keep full tweet content available and action targets distinct; avoid truncating posts or turning static counts into pretend social actions.
- Keep one visually dominant filled action in each view. Do not add a wallet or account flow to a regular community feed.
- To add a page, add a hash view to `ViewNav`, reuse the page/feed shell and cards, define its empty state, then validate keyboard access and narrow reflow against the same tokens.

Design guidance: Jakub Krehel, Better Interface, MIT. Documentation method: Paul Bakaus, Impeccable, Apache-2.0. Pinned source commits, attribution and license texts are retained in `README.md` and `artifacts/design-guidance-licenses.txt`.

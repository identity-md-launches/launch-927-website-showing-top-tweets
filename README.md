# IdentityMD — The community signal

A responsive, forest-green tweet dashboard with an AI-equipped Pepe illustration. Built with React, TypeScript and Vite. The complete static website is in **`dist/`**; the publisher can serve it directly without rebuilding.

**Content note:** all nine posts, authors, handles, counts and relative times are clearly disclosed fictional demo content. This is an independent community concept, not an official IdentityMD property or a live X feed. Links to X open a real search for `IdentityMD` or `identity.md`.

## Run locally

Use Node.js 22.12+ and npm. The worker used Node 22.22.2 and npm 10.9.7.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Dependencies are reproducible from `package-lock.json`; keep dependency and cache directories out of the submission.

## Build and preview

```sh
npm run typecheck
npm run build
npm run preview
```

The build replaces `dist/`. The preview serves that export. To serve the already included export without installing JavaScript dependencies:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080/`. Use an HTTP server rather than opening the HTML through `file://`, because the application uses JavaScript modules.

## What works

- Top, Latest and Saved views, including browser back/forward navigation.
- Full-text search across posts, authors and hashtags; `/` focuses search.
- Topic filters, time periods, engagement/recency/like sorting, and loading the rest of the collection.
- Local bookmarks that survive reloads; recoverable empty states and a storage-unavailable warning.
- Tweet detail dialogs with keyboard focus containment, Escape dismissal and focus return.
- Shareable `#tweet=signal-01` links. Sharing copies the link; a selectable field appears if clipboard access is blocked.
- Trending-topic shortcuts and external X search links.

“Top engagement” uses `likes + (2 × reposts) + replies`. Time filters apply to the sample `hoursAgo` values, which do not advance. Counts are illustrative, and the decorative sparkline is not a historical metric. Bookmarks are local to this browser and are not synced to X. The app never posts, likes or reposts on X.

## Validate the production export

After building, install a Playwright browser once and run:

```sh
npx playwright install chromium
npm run test:interactions
```

On Linux, Playwright may also need its system dependencies (`npx playwright install --with-deps chromium`). An existing compatible Chromium can be selected through `CHROMIUM_PATH`. `SITE_DIST` and `ARTIFACTS_DIR` optionally select the export and evidence directories. The validation script owns its temporary `/preview/` HTTP server and browser, and closes both before exiting. It does not require a long-running background server.

Actual worker results, 2026-10-07:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed, exit 0 |
| `npm run build` | Passed, exit 0; Vite 7.3.7 |
| `node scripts/validate.mjs` with installed Chromium | 31 checks passed, exit 0 |
| Automated accessibility scans | 0 violations in desktop, tablet, mobile saved state and tweet dialog; unresolved automated contrast checks are documented |
| Reflow | No horizontal page overflow at 320, 390, 590, 768, 1024 and 1440 CSS pixels |
| Runtime failures | No console, page, HTTP or resource failures in the tested flows |
| Offline dependency verification | Passed with non-local runtime requests blocked |

To respect this assignment’s dependency-directory restrictions, installation and build commands ran in `/tmp/identitymd-build`, a mirror of the submitted source and lockfile. The final browser run tested the **repository’s `dist/`**, not the development server. Export parity is recorded in the validation evidence. The supplied browser connector failed to initialize because its cache directory was read-only; the installed Chromium was used successfully through Playwright instead.

See [the complete review](artifacts/validation.md), [machine-readable interaction results](artifacts/interaction-results.json), [desktop screenshot](artifacts/desktop.png), [mobile screenshot](artifacts/mobile-first-screen.png), and [size report](artifacts/bundle-size.json). These are worker observations, not independent certification. Native browser zoom, physical devices, assistive-technology sessions, Safari/Firefox and external X availability were not verified.

## Publish

Upload **the contents of `dist/` together**, including `index.html`, `favicon.svg`, `assets/` and `licenses/`, to any static HTTP(S) host. Select `dist` as the publish directory if the host asks. No backend, private credentials, wallet, redirect rules or server-side rendering are required. Hosting at a subdirectory is supported: Vite uses `base: './'`, assets are relative, and navigation uses URL fragments. No server rewrite is needed for shared tweet links.

When editing the source, rebuild and include the refreshed export alongside the source and lockfile in the submission. Git staging and commits were not performed by the worker because this task prohibits touching `.git/`. `dist/` is deliberately not ignored. The explicit ignore-file path budget and complete submission budget are in [artifacts/submission-budget.md](artifacts/submission-budget.md).

## Edit and extend

- `src/data.ts`: typed demo posts and filtering/ranking logic. Replace examples with verified, licensed content if a real collection is available; also update demo disclosures and collection totals.
- `src/App.tsx`: page, reusable cards, navigation, dialogs and browser persistence.
- `src/styles.css`: implemented tokens and responsive layouts.
- `public/assets/ai-pepe.webp`: generated illustration, bundled locally.
- `scripts/validate.mjs`: repeatable production interaction and accessibility checks.
- [DESIGN.md](DESIGN.md): typography, colors, components and breakpoint behavior.

The illustration was created with the built-in imagegen tool, then encoded to WebP. Its exact prompt and saved path are in [artifacts/image-prompt.txt](artifacts/image-prompt.txt). No image-generation service is needed to build or run the site.

Manrope is bundled under the SIL Open Font License; React and Lucide notices are included in `public/licenses/` and the export. Design guidance is adapted from Jakub Krehel’s Better Interface (MIT, pinned commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`), and documentation guidance from Paul Bakaus’s Impeccable (Apache-2.0, pinned commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`). Both guidance licenses and attribution are preserved in [artifacts/design-guidance-licenses.txt](artifacts/design-guidance-licenses.txt). The design documentation is newly written for this implementation.

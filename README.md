# Pratham Pandey portfolio

A six-page, broadsheet-inspired portfolio with plain HTML, CSS, and JavaScript.
Navigation, project cards, case studies, and architecture explanations are
pre-rendered. JavaScript adds the modal menu, swipe selector, architecture
walkthroughs, and optional GSAP/Lenis motion.

## Preview

The committed HTML is ready to serve without installing a build tool:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`. For a preview server that also reproduces a static
host's custom 404 behavior, use Node.js 22+:

```bash
npm ci
npm run preview
```

## Authoring and generation

| Source                        | Purpose                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `js/config.js`                | Build-time personal/project content, external links, architecture nodes, edges, and example paths |
| `scripts/pages.mjs`           | Shared shell, home/about copy, and case-study templates                                           |
| `scripts/build.mjs`           | Validates project relationships and generates the six HTML pages                                  |
| `js/shared.js`                | Modal menu, page transitions, scroll progress, and optional smooth scrolling                      |
| `js/home.js`                  | Progressive swipe-card and keyboard interactions                                                  |
| `js/project.js`               | Keyboard-accessible architecture controls and illustrative walkthroughs                           |
| `css/tokens.css`              | Canonical visual tokens, base styles, and shared shell                                            |
| `css/themes.css`              | Project-specific portfolio themes                                                                 |
| `css/pages.css`               | Components and responsive page layouts                                                            |
| `site.config.json`            | Default deployment base path and optional absolute site URL                                       |
| `assets/images/manifest.json` | Generated image dimensions and responsive WebP variants                                           |

After changing content or templates:

```bash
npm run build
npm run check
npm test
```

Commit regenerated HTML alongside its source changes. Do not hand-edit the
generated `index.html`, `about/index.html`, `projects/*/index.html`, or `404.html`.
`npm run build:check` detects stale generated pages without writing them.

### Images

Original JPEGs remain available as fallbacks. To replace a portrait or add a real
project screenshot, update the image paths in the content/templates, then run:

```bash
npm run images
npm run build
```

The image task uses Sharp to generate 320/640px WebP screenshot variants and
480/960px portrait variants (capped at the original width), plus a manifest.
Gallery images have dimensions, responsive sources, and native lazy loading.
The five 640px screenshot variants total **155,958 bytes**, compared with
**1,377,164 bytes** for the originals: approximately **89% smaller**. This is an
asset-size comparison, not a network-performance benchmark.

### Content accuracy

`CONTENT_SOURCES.md` records documentation snapshots and editorial decisions.
The architecture console is an illustrative model with project-specific edges
and paths; it does not perform live requests, measurements, or verification.
Projects without screenshots label their galleries as interface concepts.
Convertix's violet palette is a portfolio presentation choice.

## Interaction and accessibility

- Primary content and navigation remain available with JavaScript disabled.
- Cards retain native links, support touch/pointer gestures and directional keys,
  preserve focus, and make inactive cards inert.
- The menu is a native modal dialog with focus containment and restoration;
  fallback navigation remains visible if enhancement is unavailable.
- Architecture nodes support Enter/Space activation; tabs support arrow keys,
  Home, and End. Screen-reader status messages describe selections and examples.
- Galleries always offer native horizontal scrolling and keyboard access.
- Reduced motion uses the static project grid and untimed example-flow summaries.
  Changing the preference at runtime cancels/reverts motion.
- Core navigation and controls also work if animation libraries fail to load.
- Content paints immediately; entrance effects do not require a blocking loader.
- Shared heading line heights and restrained letter spacing keep display text
  legible across pages. Card typography scales with its container, and section
  banners remain in view rather than scrolling their text off-screen.

## Checks

Install the browser once:

```bash
npx playwright install chromium
```

Then run:

```bash
npm run check
npm test
```

Checks cover formatting, generated-page consistency, JavaScript syntax, routes
and local assets, click/touch/drag behavior, keyboard focus, architecture tabs and
placement, separate example branches, gallery reachability, no-JavaScript
rendering, failed animation libraries, reduced motion, and nested 404s.
Browser tests use desktop (1440px), mobile (390px), and reduced-motion profiles.
The layout suite also checks all six pages at 320, 390, 768, 1024, and 1440px for
compressed headings, text overflowing columns, and collisions between titles,
badges, and descriptions.
External font requests are stubbed so regression checks do not depend on Google
Fonts availability. Failure screenshots/traces go to ignored `test-results/`.

## Deployment

### GitHub Pages (recommended)

In **Settings → Pages**, set the build source to **GitHub Actions**.
`.github/workflows/pages.yml` verifies pull requests and pushes, then deploys
the default branch after checks pass. It reads the actual Pages base path and URL
from `actions/configure-pages`, including repository subpaths and custom domains.
Only generated pages and runtime assets are uploaded; project documents, tools,
tests, and source design references are excluded from the published artifact.

### Other static hosts or branch-based Pages

Set `basePath` in `site.config.json` to `/` for a root deployment or
`/repository-name/` for repository Pages. Optionally set `url` to the complete
public site base URL to generate canonical and absolute Open Graph image URLs.
Then regenerate and publish the HTML and runtime assets.

To produce a separate artifact instead of updating committed pages:

```bash
npm run build -- --base /portfolio/ --url https://example.github.io/portfolio/ --out-dir dist/site
node scripts/serve.mjs --dir dist/site --base /portfolio/ --port 4174
```

The explicit deployment base is essential for `404.html`: static hosts preserve
the missing URL, so assets and recovery links must resolve correctly even at
`/portfolio/missing/nested/page`. Recovery also works without JavaScript.

## Dependencies and retained references

Runtime libraries are vendored locally: GSAP **3.12.5**, ScrollTrigger **3.12.5**,
and Lenis **1.1.18**. Google Fonts supplies the editorial typefaces, with local
system fallbacks. There are no runtime npm dependencies; the lockfile pins
development tools. Update vendored libraries intentionally and rerun browser
checks after replacing them.

`PLAN.md`, `DESIGN (2).md`, `theme (1).css`, `variables (1).css`, and
`tokens (1).json` are historical design inputs, not active styles. The `convertix/`,
`easy cloud storage/`, and `meme capsule/` folders contain source documentation
about featured products. Existing `screenshots/` captures are historical visual
references. Active tokens live only in `css/tokens.css` and `css/themes.css`.

The superseded `js/main.js` and `css/styles.css` implementations have been removed.
`REPAIR_PLAN.md` tracks the review remediation and acceptance criteria.

# Portfolio repair plan

## Scope and approach

Preserve the broadsheet visual direction and plain HTML/CSS/JavaScript runtime.
Generate complete static pages from shared templates and project data, then use
JavaScript only to enhance them. Publish a clean artifact with an explicit base
path so nested 404s work on both root domains and repository subpaths.

## Implementation checklist

- [x] Pre-render shared navigation/footer, the project grid, and all case-study content.
- [x] Preserve native card links; handle drag cancellation and touch scrolling.
- [x] Use one directional keyboard handler, guard transitions, preserve focus, and make inactive cards inert.
- [x] Provide native gallery scrolling at every viewport and motion preference.
- [x] Use a modal menu with focus containment/restoration and a no-JavaScript navigation fallback.
- [x] Keep SVG positioning separate from selection effects; provide keyboard-accessible nodes and tabs.
- [x] Render project-specific architecture edges and clearly labeled illustrative walkthroughs.
- [x] Reconcile content with identified documentation snapshots; remove unsubstantiated metrics and guarantees.
- [x] Generate deployment-base-aware 404 assets and home links, including without JavaScript.
- [x] Generate responsive WebP screenshots with dimensions and lazy loading.
- [x] Format first-party source, remove confirmed obsolete runtime code, and document retained design references.
- [x] Add repeatable interaction, route, no-JavaScript, reduced-motion, and deployment regression tests.
- [x] Add CI checks and a GitHub Pages artifact deployment workflow.

## Acceptance criteria

- Every page contains its primary content and usable navigation in the HTML response.
- Mouse/touch clicks open case studies; previous/next and arrow keys move exactly one project and retain useful focus.
- The final gallery image is reachable on mobile, desktop, and with reduced motion.
- Closed menus cannot receive focus; open menus contain focus and restore it on close.
- Node coordinates stay stable during hover/selection, and node details/tabs work from the keyboard.
- Diagrams model each project's branches and fallback paths; demos never claim real verification or timing.
- Root and repository-subpath nested 404s return 404 with working assets and recovery links.
- Optimized screenshots are materially smaller than the original JPEG set.
- Syntax, formatting, generated-page consistency, and browser regressions pass.

## Source-of-truth decisions

See `CONTENT_SOURCES.md` for snapshot selection and `README.md` for authoring,
generation, testing, vendored dependency versions, and deployment instructions.
Historical design briefs and product documents remain reference material.

## Verification results

- `npm run check`: formatting, all six generated pages, and runtime syntax passed.
- `npm test`: 45 passed; 6 intentionally skipped carousel-specific cases in the
  reduced-motion profile, which uses the static grid instead.
- `git diff --check`: passed.
- Chromium coverage: desktop, mobile, reduced motion, JavaScript disabled,
  unavailable animation libraries, and root/repository-base nested 404 recovery.
- Visual review with the real fonts included 1440px, 768px, 390px, and 320px
  layouts. It caught a narrow-card sizing issue, now covered by a regression.
- Additional regressions cover runtime motion-preference focus changes and
  repeated card animations after cycling through the whole deck.
- Screenshot originals: 1,377,164 bytes; 640px WebP variants: 155,958 bytes.
- The GitHub Pages workflow is configured; remote publication requires selecting
  GitHub Actions as the repository's Pages source and pushing these changes.

## Typography and overlap follow-up

- Replaced sub-1 line heights and excessive negative tracking throughout the
  display headings, card artwork, menus, section headings, and footer.
- Reduced oversized titles, removed the floating drop cap, and gave body text
  comfortable leading. Homepage name lines now have explicit block wrappers.
- Card headers stack titles and status badges; artwork uses container-relative
  sizes. Inactive deck content is hidden so it cannot bleed through the stack.
- Metadata and skill lists wrap safely; architecture labels stay legible in a
  horizontally scrollable diagram instead of shrinking to tiny text on mobile.
- Removed horizontal banner translation and made sticky headers opaque.
- Added `tests/layout.spec.js`; the failing baseline reproduced the original
  typography problems before the fixes. The suite checks every page at five
  viewport widths and exercises each project card's text layout.
- Reviewed real-font renders across all six routes and five widths, plus
  desktop/mobile screenshots of heroes, biography, project grids, and footers.

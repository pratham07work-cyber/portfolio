# Case-study content provenance

These case studies describe supplied project documents, not live audits of those
products. Project status, personal role, and public URLs remain editable in
`js/config.js`. Architecture walkthroughs are explanatory sequences generated
locally; they do not contact, benchmark, or verify the described services.

## Meme Capsule

Source: `meme capsule/MEME_CAPSULE_KNOWLEDGE.md`, especially the portable context's
**PUBLIC MOBILE APP (v3.4 / versionCode 25)** and **PUBLIC WEB PLATFORM** sections.
Those sections describe React 19 / Capacitor 8 and a 12-item rolling mobile FIFO
target, versus React 18 on the separate web frontend. Earlier sections still
mention v2.7 and a seven-item buffer. The portfolio uses the newer explicitly
versioned mobile snapshot and avoids claiming it is the current live release.
The homepage timeframe is therefore “2026 / evolving releases.”

Pratham's role remains original ideator and lead frontend. Backend engineering
and curation are separate responsibilities. Removed unsupported render-time,
cold-start, SQL-time, HTTP-version, and zero-latency guarantees.

## Easy Storage Cloud

Sources: `easy cloud storage/relay-runbook.md` (What it does, TURN configuration,
Current Status & Gaps), `relay-architecture.md`, and `REMOTE_VAULT.md`.
The phone/drive is the primary store. TURN and HTTP/WebSocket fallback can relay
file bytes; “never touches a third-party server” was too broad. Removed the
unsupported 99.9% NAT success rate and 1050 MB/s throughput claim. The diagram
includes direct and relayed paths rather than a universal four-node loop.

## Convertix

Source: `convertix/ARCHITECTURE.md` (system diagram, frontend, media services,
backend, and conversion history). Media and document operations take different
branches. Hive records local conversion history. The document specifies a
30-second deletion target; the case study attributes this to the design rather
than presenting it as a verified live guarantee. Removed unsupported FPS,
database latency, guaranteed hardware acceleration, and sandbox isolation claims.

Convertix's violet palette is a portfolio presentation theme, not a claim to
reproduce the application's undocumented palette. The two projects without
screenshots explicitly label their gallery items as interface concepts.

## Updating claims

When source documents change, update this provenance note and `js/config.js`,
then run `npm run build`. Add performance claims only with a dated measurement,
method, and relevant device/deployment conditions.

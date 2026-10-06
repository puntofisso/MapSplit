# MapSplit v2 — Single-File Design

**Date:** 2026-07-23
**Status:** Implemented — see "Divergences from the design" at the end
**Supersedes:** `2026-07-22-mapsplit-design.md` (the MapLibre/TerraDraw prototype)

## Purpose

Rebuild MapSplit as **one self-contained `index.html`** that runs by
double-clicking it in Finder — no web server, no npm, no CDN, no basemap tile
file, no Go CLI. It must work offline.

The behaviour stays the same as the prototype: a map of the UK, a straight line
at an arbitrary angle dividing the country in two, and live per-side statistics
as the line is dragged.

## Motivation

The prototype's dependencies vastly outweigh what it actually does:

| Dependency | Why it was there | Cost |
| --- | --- | --- |
| MapLibre GL JS | drew a background | ~800 KB |
| PMTiles + Protomaps | supplied that background | 2.8 GB (now 6.7 MB) |
| TerraDraw + adapter | dragged a 2-point line | ~300 KB + a long tail of bugs |
| A range-capable HTTP server | serving `.pmtiles` byte ranges | blocks `file://` |

The interesting part of MapSplit — Mercator classification and half-plane
clipping — is ~150 lines of pure maths that already exists and depends on none
of it. TerraDraw in particular cost disproportionate effort during the prototype
(feature lifecycle, vanishing drag handles after a programmatic update, a 9-dp
coordinate-precision validator) to manage two numbers we can own outright.

## Decisions

Settled during brainstorming on 2026-07-23:

1. **Scope:** remove everything — server, CDN, tiles, and tooling. One file.
2. **Interaction:** fixed view. Drag the line and its endpoints; **no pan, no
   zoom.** The window rescales to fit on resize; that is the only view change.
3. **Rendering:** **SVG**, not canvas.
4. **Structure:** genuinely one file. ES modules are unavailable because
   `import` from a relative path is blocked under `file://`, so the script is a
   single classic `<script>` with sectioned pure functions.

## Non-goals

- Pan and zoom. The transform layer is deliberately not built.
- Basemap detail: no roads, rivers, towns, or place labels.
- Any build step, package manager, or bundler.
- Replacing the prototype. It stays in the repo as a working reference.

## Architecture

```
index.html          ~150–200 KB, mostly coordinates
  <style>           layout + panel (ported from css/style.css)
  <svg>             the map
  <aside id=panel>  stats cards + H/V buttons (ported from index.html)
  <script>
    UK_OUTLINE      inlined coastline path data
    // --- geometry (pure) ---   verbatim from js/geometry.js
    // --- stats (pure) ---      verbatim from js/stats.js
    // --- data source ---       verbatim from js/data-source/synthetic.js
    // --- render ---            new (~70 lines), replaces js/map.js
    // --- interaction ---       new (~60 lines), replaces js/divider.js
tests.html          browser-run assertions over the pure functions
```

### What carries over unchanged

These are already pure and dependency-free, and are copied in verbatim:

- **`js/geometry.js`** — `lngLatToMerc`, `mercToLngLat`, `sideValue`,
  `clipToHalfPlane`, `computeSplit`. The correctness-critical module. Not one
  line changes.
- **`js/stats.js`** — `computeStats`.
- **`js/data-source/synthetic.js`** and **`interface.js`** — the
  `{ label, unit, getFeatures() }` contract is preserved exactly, so real data
  sources (OA/LSOA centroids, uploaded CSV/GeoJSON) still slot in behind it.
- **`js/config.js`** — unchanged apart from deleting the `tiles` block.

### What is deleted

- **`js/map.js`** — MapLibre + PMTiles + Protomaps init.
- **`js/divider.js`** — all TerraDraw wiring.
- The missing-tiles banner in `js/ui.js`, which becomes dead code.

Roughly 300 lines of our own code replaces ~1.1 MB of libraries.

## Key design decisions

### 1. The projection is free — Mercator goes straight into `viewBox`

Everything is drawn in **raw normalised Web Mercator coordinates**: coastline,
points, half-plane polygons, divider. No screen transform is written at all.
The SVG `viewBox` is set to the UK's Mercator bounding box:

```html
<svg viewBox="0.4760 0.2848 0.0293 0.0552" preserveAspectRatio="xMidYMid meet">
```

That is the display bbox `[-8.65, 49.8, 1.9, 61.0]` projected — the same box the
`.pmtiles` extract used. Note it is **smaller** than `config.padBbox`
(`[-13, 47, 5, 62]`, projecting to `0.4639 0.2789 0.0500 0.0728`), which
`computeSplit` clips the half-planes against. That relationship must hold: the
fills are generated over the larger padded box so they always cover the
viewport, whatever the window aspect ratio does to `preserveAspectRatio`.

Three consequences:

- **Resize is free.** The browser rescales; no resize handler is needed.
- **Strokes** would otherwise be invisible at this coordinate scale, so every
  stroked element carries `vector-effect="non-scaling-stroke"`, pinning width to
  screen pixels.
- **Pointer → world** is exact via `svg.getScreenCTM().inverse()` applied to a
  `DOMPoint`. This is the piece that would otherwise be hand-rolled and get
  subtly wrong.

This preserves the core invariant from `CLAUDE.md`: classification happens in
Web Mercator, so a point's side depends only on geography and the line.

### 2. Point colouring via two clipped copies, not per-point restyling

Restyling 3,500 `<circle>` elements on every pointermove frame would stutter.
Instead the point set is rendered **twice**, each copy clipped to one
half-plane, with fill set once on the group:

```html
<clipPath id="clip-n"><polygon points="…north ring…"/></clipPath>
<clipPath id="clip-s"><polygon points="…south ring…"/></clipPath>

<g clip-path="url(#clip-n)" fill="#2f6f9f">…3500 circles…</g>
<g clip-path="url(#clip-s)" fill="#c93b52">…3500 circles…</g>
```

Dragging updates **two `points` attributes**; the browser clips on the
compositor. Per-point DOM work per frame is zero, and total DOM writes per frame
is about six. The half-plane rings come from `computeSplit`, which already
returns exactly these two polygons.

The circles are created once at startup and never touched again.

### 3. Statistics still classify every point in JS

Rendering avoids per-point work, but the stats cannot: each frame runs
`sideValue` over all 3,500 points to sum weight and count per side. That is
3,500 cross products, ~0.05 ms — negligible. Mercator coordinates are
precomputed once at startup, as the prototype already does.

### 4. Interaction

`pointerdown` on the SVG converts to Mercator and hit-tests in this order:

1. within a threshold of endpoint A or B → **reangle** (drag that endpoint);
2. within a threshold of the segment → **translate** (drag the whole line);
3. otherwise → ignore.

Thresholds are expressed in screen pixels and converted to world units via the
current CTM scale, so grab targets stay the same physical size at any window
size. `setPointerCapture` on the SVG keeps the drag alive when the cursor leaves
the element — the usual failure of hand-rolled dragging. Repainting is throttled
to one `requestAnimationFrame`, matching the prototype.

The Horizontal/Vertical snap buttons become plain arithmetic on two endpoints,
with no validation layer to satisfy and no risk of losing the drag handles.

Handles are two `<circle class="handle">` elements, styled in CSS with real
`:hover` and `cursor` states.

## Data flow

```
UK_OUTLINE (inlined)  ─────────────────────────► <path class="coast">   (once)
synthetic.getFeatures() ──► precomputed Mercator ──► two <g> of circles  (once)

pointer drag ──► endpoints A,B ──► computeSplit() ──┬─► 2 clipPath polygons
                                                    ├─► divider <line>
                                                    └─► classify points
                                                          └─► computeStats()
                                                                └─► panel
```

Startup work happens once; the drag path touches only the last four steps.

## The coastline data

Source: **Natural Earth 1:50m admin-0 countries**, GBR + IRL. Ireland is drawn
for geographic context and **excluded from statistics** — it is coastline only,
carrying no data points.

Preparation, run once as a one-off:

1. `curl` the GeoJSON.
2. Keep the GBR and IRL features; drop all properties.
3. Round coordinates to **4 decimal places** (~11 m at UK latitudes — far finer
   than a country-scale map resolves).
4. Project each ring to normalised Mercator and emit SVG path strings.
5. Paste the result into `index.html` as a `const`.

Expected ~60–90 KB, giving a final `index.html` of ~150–200 KB.

**Tooling caveat:** step 3–4 are scripted with `python3` (preinstalled on macOS,
not Node). The **output is committed**, so no one ever runs this again — but it
means the repo is not literally tool-free at authoring time. If that is
unacceptable, the alternative is doing the decimation in the browser and saving
the result by hand; this design assumes `python3`.

## Testing

The prototype's 15 logic assertions (Mercator round-trip, deterministic
synthetic output, side classification, stats summing to totals, north/south fill
labelling) are preserved, run in the browser instead of Node.

`tests.html` fetches `index.html`, extracts the text between
`/* BEGIN PURE */` and `/* END PURE */` markers, evaluates it, and asserts
against it. Extracting rather than copying means the tests cannot drift from the
implementation.

**`fetch()` of a sibling file is blocked under `file://`**, so `tests.html` must
be opened over HTTP — `http://localhost/MapSplit/tests.html` on this machine.
No range requests are involved, so any static server works.

This is a deliberate asymmetry: **the app needs no server; the tests do.**

New assertions to add for the code that is genuinely new:

- screen↔world round-trip through the CTM at several window sizes;
- hit-testing picks endpoint over segment when the two overlap;
- snap-to-horizontal produces two points of equal latitude, and vertical equal
  longitude.

## Risks and what we lose

- **No basemap detail.** A coastline over flat colour, nothing else. The result
  resembles the Alasdair Rae poster that inspired MapSplit far more than it
  resembles a slippy map. This is the intended trade.
- **No pan or zoom**, by decision. Some users will reach for it.
- **`clipPath` performance** on very large point counts is assumed good but
  unmeasured at >3,500 points. If a future real dataset is much larger, the
  fallback is canvas for the point layer only.
- **Coastline fidelity.** 1:50m generalises small islands away. Acceptable for a
  country-scale split; it would not be for regional analysis.
- **One-file editing ergonomics.** A ~200 KB file with an inlined data blob is
  awkward to navigate. Mitigated by putting `UK_OUTLINE` last, after all the
  logic, so the code sits at the top of the file.

## Migration

The prototype is **kept, not deleted** — it stays runnable at
`http://localhost/MapSplit/` as a visual reference to compare the rewrite
against. The new version lands alongside it, and the two are reconciled only
once the rewrite is confirmed good.

Proposed layout during the transition:

```
index.html         # v2, single file, double-clickable   ← new
tests.html         # v2 browser tests                    ← new
legacy/            # the MapLibre prototype, moved intact
  index.html
  css/ js/
data/uk.pmtiles    # still used by legacy/ only
```

The final decision on whether to delete `legacy/` is deferred until after the
rewrite is verified.

## Divergences from the design

Four things changed during implementation. Recorded here so the spec matches
what actually exists.

### 1. The clip rectangle is derived from the window, not fixed

The design claimed a fixed `padBbox` larger than `displayBbox` would always
cover the viewport. **That was wrong.** `preserveAspectRatio="xMidYMid meet"`
letterboxes the tall viewBox, so the visible world extent depends on the
window's aspect ratio — on a 1960×957 window it is ~113,000 world units across
while `padBbox` spans only ~50,000, leaving the tints short of the edges.

`visibleBbox()` now derives the clip box from the viewport corners via the CTM,
padded 10%, with longitude and latitude clamped (Mercator diverges at the poles
and wraps past ±180°). `CONFIG.padBbox` survives only as a pre-layout fallback.
Resize now triggers a full recompute, not just a handle-size update.

### 2. North/south labelling comes from the line's normal

`computeSplit` originally decided which half was north by averaging each
polygon's **vertex** latitudes. That is not an area centroid, so it depends on
the clip rectangle's shape — and once the rectangle was window-derived it
inverted the labels outright (Scotland red, southern England blue).

Replaced with `northSignFor(A, B)`: substituting `M + s·N` into `sideValue`
yields exactly `s·|AB|`, so the positive half-plane is always the side the
normal `N = (-dy, dx)` points to, and `N` points north exactly when `dx < 0`.
O(1), and independent of any bounding box.

This bug was **latent in the prototype's `geometry.js`** too; the fixed
`padBbox` merely hid it.

### 3. The cards relabel to West/East near vertical — RESOLVED

Originally shipped as a known limitation: for a near-vertical divide the halves
are genuinely east and west, so calling them North and South was wrong, and the
halves swapped as an endpoint rotated through vertical.

Now `computeSplit` also returns `orientation` (`'ns'` / `'we'`) and `labels`,
and the cards rename themselves. The threshold is `tan(22.5°)`, **not** 45° —
the canonical NW–SE diagonal is steeper than 45° in Mercator and must keep its
North/South naming.

**One discontinuity remains, and is topologically unavoidable**: rotating a line
through 180° returns the same line with its halves exchanged, so no continuous
assignment exists. Picking the sign rule per regime (`dx` for North/South, `dy`
for West/East) confines the swap to the regime boundary, where the words change
at the same moment — self-explanatory rather than mysterious. In particular
there is **no longer a flip at vertical**, which is where the Vertical button
lands. A test sweeps 180° in 1° steps and asserts exactly one flip, always
co-located with a relabel.

Note this renamed the API: the halves are `primary` / `secondary` throughout
(and `northSign` became `primarySign`), since "north" is no longer always true.

### 5. The panel can be minimised

Added for mobile: a `−`/`+` control collapses the panel to its title bar plus a
one-line "West 61.1% · East 38.9%" summary, so the answer stays visible while
the map does not get covered. It starts collapsed under 640px, where the
expanded panel would otherwise take ~45% of the viewport height (measured: 362px
of an 800px viewport, versus 79px collapsed). Touch targets go to 44px and the
grab radius widens to 24px on coarse pointers.

### 4. Coastline is 1:10m, not 1:50m

10m turned out to be only 9,515 points for GBR+IRL before simplification.
Douglas–Peucker at 10 world units (~400 m, sub-pixel even at 4K) plus dropping
rings under 4,000 world units² gives 62 rings and 72 KB — within the design's
budget at markedly better fidelity. `tools/prep_coast.py` reproduces it.

### 6. "What's being counted" breakdown box

A collapsed disclosure under the cards lists the **top five contributing
clusters per side**, by the weight each contributes *to that side*, with a
`+ N more` roll-up that preserves the total.

The data-source contract gained two **optional** fields, `groups` (a per-point
integer index) and `groupNames`. The synthetic source records which cluster
generated each point instead of discarding it. Attributing at generation time
rather than re-deriving by nearest-city afterwards is what makes the columns
reconcile *exactly* with the card totals; a test asserts this to the penny.
Sources without groups still work — the box hides itself.

A cluster the divider passes through contributes to both sides and so appears in
both columns. Those rows are marked `†` with an explanatory footnote, because
otherwise the same name in two columns reads as a bug rather than as the most
interesting fact on the panel. With the default diagonal, London and Manchester
are both cut.

The box rebuilds its markup only while open, so dragging costs nothing when it
is shut, and opening it calls `recompute()` directly rather than through
`scheduleRecompute()` — a discrete user action has nothing to throttle.

Final `index.html`: **110 KB**.

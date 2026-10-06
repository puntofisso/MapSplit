# MapSplit — Prototype Design

**Date:** 2026-07-22
**Status:** Approved (prototype)

## Purpose

A single-page HTML/JS app that shows a map of the UK, lets the user overlay a
straight line at an arbitrary angle that divides the country in two, and reports
a statistic (e.g. population) for each side of the line — live, as the line is
dragged. Inspired by Alasdair Rae's population-weighted north/south split map.

## Scope (this prototype)

- Self-hosted UK basemap via **Protomaps** (`.pmtiles`) rendered with MapLibre GL JS.
- One **synthetic** weighted point dataset standing in for population.
- A **draggable dividing line** (two endpoints) via **TerraDraw**.
- **Colored points + faint tinted half-planes** showing the split.
- A **stats panel**: weighted total, point count, and % for each side, updating live.
- Graceful failure: if the `.pmtiles` file is missing, the app still runs
  (points/line/stats over a blank background) and shows a clear banner.

Explicitly **out of scope** for now (but designed behind interfaces so they slot
in later): real data (OA/LSOA centroids, gridded raster, uploaded CSV/GeoJSON),
angle/offset sliders, multiple statistics, saving/sharing.

## Architecture

Pure static one-pager, no build step. ES modules loaded from CDN.

```
index.html          # shell + CDN imports (maplibre-gl, pmtiles, protomaps, terra-draw)
css/style.css       # layout + panel styling
js/
  config.js         # UK view, tile source, colors, synthetic params — the one place to tweak
  geometry.js       # PURE: mercator projection, side classification, half-plane clipping
  stats.js          # PURE: aggregate weight/count/% per side
  data-source/
    interface.js    # the data-source contract (label, unit, getFeatures)
    synthetic.js    # seeded synthetic weighted points clustered over GB
  divider.js        # TerraDraw wiring: draggable 2-endpoint line, throttled change events
  map.js            # MapLibre + Protomaps init, custom sources/layers (fills, points, line)
  ui.js             # stats panel + banner rendering
  main.js           # wires data → map → divider → geometry → stats → ui
data/
  uk.pmtiles        # (not committed) self-hosted basemap, see CLAUDE.md
```

### Key design decisions

1. **TerraDraw owns interaction; our geometry owns the split.** TerraDraw manages
   a finite 2-vertex LineString whose endpoints (and body) are draggable. From
   those two points we compute the *infinite* dividing line, the two tinted
   half-plane polygons, and per-point side membership ourselves.

2. **Classification in Web Mercator.** A point's side is the sign of the cross
   product of `(B−A)` and `(P−A)` with all three in Web Mercator coordinates.
   Because the line is straight in Mercator (= straight on screen), side
   membership depends only on geography + line, not on pan/zoom.

3. **Half-planes by convex clipping.** A padded UK bounding rectangle is projected
   to Mercator and clipped against the dividing line (Sutherland–Hodgman,
   half-plane) into two polygons, converted back to lng/lat for MapLibre fills.
   Their edges (constant lng/lat, and the straight cut) render straight on screen.

4. **North/blue vs south/red** assigned by comparing the two polygons' centroid
   latitude, so the northern side is always blue and the southern red — matching
   the reference — regardless of line angle.

5. **Pluggable data source.** `interface.js` defines `{ label, unit, getFeatures() }`
   returning a GeoJSON FeatureCollection of points with a numeric `weight`
   property. `synthetic.js` is one implementation; real sources implement the
   same contract later.

### Data flow

Load synthetic FeatureCollection once → render as circles. On (throttled) line
change: reclassify every point in Mercator → recolor circles + rebuild the two
fill polygons + the extended divider line → `stats.js` re-aggregates → panel updates.

## Testing

Prototype-level: pure modules (`geometry.js`, `stats.js`) are the correctness-
critical pieces and are written as side-effect-free functions that can be exercised
directly. Manual verification: load app, confirm the line drags, halves recolor,
and the two side totals always sum to the dataset total.

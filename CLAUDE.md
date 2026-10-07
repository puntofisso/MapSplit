# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MapSplit is a single-page HTML/JS app: it shows a map of the UK, lets the user
drag a straight line (arbitrary angle) that divides the country in two, and
reports a statistic for each side — live. Inspired by Alasdair Rae's
population-weighted north/south split map.

There are **three** live builds in this repo. Each owns its own CSS, JS and test
page, and they share nothing — the game has its own `Play/data/`, the tools use the root
`data/samples/` — so a change to one can never break another.

| | `index.html` | `index.php` | `Play/index.php` | `legacy/` |
| --- | --- | --- | --- | --- |
| What it is | the tool, offline | the live front door | the daily game | the prototype |
| Markup | `index.html` | `index.php` | `Play/index.php` | `legacy/index.html` |
| CSS | `style.css` | `style-main.css` | `Play/style-game.css` | `legacy/css/style.css` |
| JS | `app.js` | `app-main.js` | `Play/app-game.js` | `legacy/js/*.js` |
| Tests | `tests.html` | `tests-main.html` | `Play/tests-game.html` | none |
| Ads | no | no | **yes** (below the fold) | no |
| On disk | yes | yes | yes | **no — git history only** |
| Needs a server | **no** | yes (PHP) | yes (PHP + fetch) | yes (range requests) |
| Scrolls | no | no | **yes** | no |

**Ads have been removed from the project.** `index-ads.php` (with its
`style-ads.css`, `app-ads.js` and `tests-ads.html`) was retired on 2026-08-26 to
`bak/ads-build-retired/`, which is git-ignored — none of those four files was
ever committed, so that directory is the only copy. The game (then
`index-game.php`, now `Play/index.php`) had its ad bar, AdSense loader and all
consent scripts stripped out entirely, before a
horizontal unit was re-added below the fold. Its shell is a **two-row grid**
(`"topbar" / "play"`), and the map is a **boxed 760px column** rather than the
full viewport — see "One column, and the rails beside it".

`index.php` keeps the AdSense machinery **dormant** behind `$SHOW_ADS = false`:
the loader, the `<footer id="adbar">` and the consent UI are all gated on it, so
one word turns them back on. That makes it the reference for how the ad setup
looked, if it is ever wanted again — the retired files in `bak/` are the fuller
record.

The whole Google consent saga is written up in the retired build's notes and in
this file's history: the short version is that Google's floating toolbar is
scroll-triggered, and MapSplit's `overflow: hidden` + `position: fixed` shell
means the page can never scroll, so Google's placement logic fell back to an
arbitrary mid-page offset. Worth knowing before anyone re-introduces ads to a
full-viewport page here.

`index-old.html` is still a byte-identical copy of `index.html`, kept as a
backup.

**Standing instruction from the repo owner: never edit `index.html`.** It is the
reference implementation. Work in `index.php` or the `-game` files.

`deploy.sh tool|game` rsyncs one of the two sites — the tool to
`puntofisso.net/MapSplit/`, the game to `playmapsplit.puntofisso.net` — from
an explicit file list per site; add new files there or they will not ship. It **pre-flight checks that every listed file
exists and aborts before contacting the server**, because rsync otherwise
uploads what it can find and merely complains about the rest, which leaves the
live site referencing a stylesheet that 404s.

Two things are excluded deliberately. `tests-*.html` are development tools that
localhost serves fine. `Google-Ads-Dropin/` is superseded by the `$SHOW_ADS`
flag, and its `switchon.php` / `switchoff.php` are **unauthenticated endpoints
that write and delete a file** — nothing includes `ads.php` any more, so
shipping it only puts an open write endpoint on a public server. Copies from
earlier deploys are still on the server; rsync without `--delete` will not
remove them, so that has to be done by hand.

## Running it

**`index.html`: double-click it in Finder.** No server, no npm, no CDN, no
network. The markup is in `index.html`, the CSS in `style.css`, and all the
logic + the coastline constant in `app.js`; the page pulls the last two in with
a plain `<link rel="stylesheet">` and a **classic** `<script src>`. Those are
no-cors subresource loads, so they work under `file://` — which `fetch`, an ES
module `import`, and a CDN `<script>` do **not**. So: keep the three files
side by side with relative paths, never convert `app.js` to `type="module"` or
add an `import`/`fetch`, and never point at a CDN. Break any of those and the
double-click launch stops working.

It also serves fine over HTTP at `http://localhost/MapSplit/` (Apache is already
running on this machine and its docroot resolves to this folder).

**The `.php` builds cannot be double-clicked** — they need PHP, so use
`http://localhost/MapSplit/index.php` or `.../Play/`. The PHP does
two things: it cache-busts the local CSS/JS with their mtime (`$v()`), and it
emits the AdSense tag only when the host is `puntofisso.net`, because requesting
a real ad from localhost is invalid traffic of the kind that gets an account
suspended rather than ignored. Off the live host you get a sized placeholder.

The mtime cache-busting exists because a stale cached stylesheet silently
masking an edit is the single most confusing failure mode in this repo. Do not
remove it.

**A map-only region previews the axis its shape implies** — `bootGame` picks
`'we'` for a frame wider than it is tall (the US, the world) and `'ns'`
otherwise (the UK, the EU). Splitting the US north/south is not the interesting
question about the US, and a preview stuck on the wrong axis undersells the map
it is previewing.

**`Play/index.php` is HTTP-only by construction**, and unlike the tool it has no
synthetic fallback: its dataset is `fetch`ed, and scoring a player against
different numbers from everyone else is worse than telling them plainly that the
data did not load.

`legacy/` no longer exists on disk (see its section below); if you restore it
from git it must be served over HTTP with **range-request support**, because
`.pmtiles` is read via byte ranges and a plain `python -m http.server` does not
serve ranges reliably. Apache does — `http://localhost/MapSplit/legacy/`.

## Testing

One test page per build, each extracting the pure block from **its own** JS.
All pass as of the last run:

| Page | Extracts from | Assertions |
| --- | --- | --- |
| `tests.html` | `app.js` | 89 |
| `tests-main.html` | `app-main.js` | 89 |
| `Play/tests-game.html` | `Play/app-game.js` | 178 |

Open e.g. `http://localhost/MapSplit/Play/tests-game.html` — pass/fail is rendered in
the page. When you touch one build, run that build's page; the others cannot be
affected, because nothing is shared.

`test(name, fn)` does **not** await, so test bodies must be synchronous. Since
`getFeatures()` is a promise (see the data-source contract), the synthetic
fixtures are resolved once into `SYN` at the top of the data-source section and
the assertions read from there.

The tests need a server even though the app does not: each test page extracts
the `/* BEGIN PURE */ … /* END PURE */` block from its JS by `fetch()`, which
`file://` blocks. Extracting rather than copying is deliberate — the tests
cannot drift from the implementation. Anything pure belongs inside those
markers so it gets tested.

Browsers cache aggressively here; append `?v=N` when re-checking a change.

## Basemap tiles (required for the map background)

The basemap is a self-hosted Protomaps `.pmtiles` file at `data/uk.pmtiles`
(git-ignored, not committed). The app runs **without** it — you get points, line,
and stats over a blank background plus an on-screen banner — but for the real
basemap, create the file once.

The archive in `data/` is **2.7 MB**, reduced from an unrestricted 2.8 GB UK
extract by two independent cuts, both measured rather than guessed:

1. **`--maxzoom=8`** (2.8 GB → 6.7 MB, 440×). MapSplit shows the whole country
   at `zoom: 5.1`, so zooms 9–15 are never visible — and they are 99.8% of the
   bytes. `legacy/js/config.js` caps `maxZoom: 9` to match.
2. **Dropping the `landuse` and `pois` layers** (6.7 MB → 2.7 MB, −60%). Across
   all 211 tiles, `landuse` alone is **61.5%** of the payload: park, forest and
   residential-zoning polygons, invisible at country scale. `pois` is 0.3%.
   Remaining layers: `boundaries, buildings, earth, landcover, places, roads,
   water`.

Further cuts if ever wanted: also dropping `landcover` gives 2.3 MB, and
capping at z7 as well gives 1.6 MB.

```bash
# Install the pmtiles CLI (Go): https://github.com/protomaps/go-pmtiles/releases
# The daily global build at build.protomaps.com only keeps roughly the last
# ~5 days and has NO directory index, so pick a recent date. Find a valid one:
for d in $(seq 0 6); do
  day=$(date -v-${d}d +%Y%m%d)   # GNU date: date -d "-$d day" +%Y%m%d
  code=$(curl -s -o /dev/null -w "%{http_code}" -r 0-0 "https://build.protomaps.com/$day.pmtiles")
  echo "$day -> $code"           # 206 = exists, 404 = rotated off
done

# Then extract the UK/GB+NI bounding box (replace the date with a valid one):
pmtiles extract https://build.protomaps.com/YYYYMMDD.pmtiles data/uk.pmtiles \
  --bbox=-8.65,49.8,1.9,61.0 --maxzoom=8
```

`pmtiles extract` also reads a **local** archive, so an existing full-zoom file
can be shrunk without re-downloading:

```bash
pmtiles extract SOME-FULL.pmtiles data/uk.pmtiles --maxzoom=8
```

Then drop the heavy layers. The pmtiles CLI **cannot** filter layers and
tippecanoe is not installed here, so use the bundled script — it rewrites each
tile without the named MVT layers and rebuilds the archive via MBTiles:

```bash
python3 tools/strip_layers.py IN.pmtiles /tmp/out.mbtiles data/uk.pmtiles landuse,pois 0 8
```

To see where the bytes actually are before choosing what to drop,
`tools/layer_sizes.py` prints a per-layer and per-zoom breakdown.

`bak/` is git-ignored and holds `uk-z8-all-layers.pmtiles` (6.7 MB) — the z8
build before layer-stripping, kept as a fallback. **The original 2.8 GB z0–15
archive was deleted on 2026-07-23**; regenerating it means re-downloading from
`build.protomaps.com`, whose daily builds rotate off after ~5 days.

Glyphs and sprites are loaded from `protomaps.github.io/basemaps-assets` (no API
key needed); only the tiles are self-hosted.

## Architecture — `index.html` (the reference build)

**Read this section first whatever you are working on.** The `-ads` and `-game`
builds began as copies of these three files and still share this structure, this
pure/impure split and this data-source contract; their own sections below record
only where they diverge.

Three files: `index.html` (markup only), `style.css`, and `app.js`. `app.js`
holds the logic in four sections in order: **config → pure logic → render →
interaction**, with the inlined `COAST` constant. `tools/prep_coast.py`
regenerates `COAST` from Natural Earth; you never need to run it.
`tools/prep_regions.py` supersedes it — it does the same job for four regions
and reproduces this exact constant as `Play/data/coast/uk.js` — but `prep_coast.py`
is kept because it is the record of how the inlined constant was made.

- **The `/* BEGIN PURE */ … /* END PURE */` block** holds everything with no DOM
  dependency: Mercator projection, world-unit conversion, `sideValue`,
  Sutherland–Hodgman clipping, `computeSplit`, `computeStats`, `hitTest`,
  `snapEndpoints`, the whole ingest layer, and the synthetic data source.
  each build's test page extracts and tests exactly this block from its own
  JS — **put new pure logic inside the markers**, or it ships untested.
- **The data-source contract** — `{ label, unit, render, sources, getFeatures() }`, where
  `getFeatures()` resolves a **promise** of `{ coords, weights }` plus
  **optional** `{ groups, groupNames }`. Every source is async, including the
  synthetic one whose data is already in memory: a file read and a fetch are
  asynchronous, and one always-async contract costs one `.then` instead of a
  branch at every call site forever. `render` is a hint — `'points'` |
  `'raster'` | `'choropleth'` — that the SVG renderer currently ignores; it
  exists so a canvas renderer can be added without changing any source.
  `sources` is the provenance shown in the panel's **Sources** box — a list of
  `{ label, url }` normalised by the pure `normalizeSources`, where a `null`
  url renders as plain text rather than a link. It rides on the source object,
  not on the picker's selection, so the box always describes what is actually
  on the map — including the `file://` boot fallback, where the dropdown still
  reads "Population (LA)" but synthetic is what rendered. Every dataset has one:
  catalogue entries declare `sources` in `CONFIG.datasets`, the synthetic source
  takes `CONFIG.synthetic.sources`, and an uploaded file gets a url-less
  "Loaded from your file: …" entry synthesised in `commitFile`. There is a test
  asserting no catalogue entry ships without provenance — the box is the only
  place the app says where its numbers came from, which is why the About dialog
  no longer carries a Datasets list.
  `groups` is a per-point integer index into `groupNames`; supply it and the
  "What's being counted" box appears, omit it and the box hides itself.
  **Attribute groups at parse time, never by nearest-neighbour afterwards**
  — that is what makes the breakdown reconcile exactly with the card totals
  rather than approximately (there is a test asserting the columns sum to the
  side totals to the penny, for both a synthetic and a parsed source).

### Loading real data

Five input shapes are supported, each with a parser in the pure block and a
`create*Source` wrapper. `createSourceFromText(name, text, opts)` sniffs the
shape and dispatches; `opts.type` skips the sniffing.

| Shape | `type` | Parser | Notes |
| --- | --- | --- | --- |
| CSV / TSV | `csv` | `parseCsvText` | quoted fields, delimiter auto-detected |
| GeoJSON points | `geojson-points` | `parseGeoJsonPoints` | Point + MultiPoint |
| GeoJSON polygons | `geojson-polygons` | `parseGeoJsonPolygons` | reduced to centroids |
| grid as JSON | `grid-json` | `parseGridJson` | `bbox` or `west`/`north` + cell size |
| ESRI ASCII grid | `ascii-grid` | `parseAsciiGrid` | `.asc`, degrees only |

Columns and properties are found by alias (`COLUMN_ALIASES`) and can be
overridden per dataset with `weightColumn` / `groupColumn` /
`weightProperty` / `groupProperty`. Every guess the ingest layer makes is
reported in the panel's notice line, because silently picking a weight column
is how a plausible wrong answer gets believed.

**Dropping or picking a CSV/GeoJSON file opens a column-mapping dialog first**
(`openMapping` in the interaction section): dropdowns for longitude/latitude
(CSV only — GeoJSON takes them from geometry), value and group, each
pre-selected to the alias guess via the pure `describeCsvFields` /
`describeGeojsonFields`. Confirm parses with those as explicit overrides; the
guesses are only pre-fills, so a header the aliases miss (e.g. `Population2024`
does not match the exact alias `population`) simply starts on "— none —" for the
user to set. Grids skip the dialog — a raster has no columns. The catalogue
(fetch) path is unchanged. The dialog's "— none —" is the `NO_COLUMN` sentinel:
it means *explicitly no column* — distinct from an absent override, which would
fall back to alias detection and re-pick the declined column.

**The parse/load split is the load-bearing part.** Parsing is pure and inside
the markers, so it is tested; `FileReader`, `fetch` and the picker are in the
interaction section. Keep new formats on the same side of that line.

`data/samples/` currently holds **only the four CSVs** the catalogue uses —
`LA.csv`, `LA-grouped.csv`, `LSOA.csv`, `HMRC.csv`. The one-file-per-shape
sample set (`uk-blocks.geojson`, `uk-cities.geojson`, `uk-density-grid.json`,
`uk-density.asc`) was deleted from the working tree and is recoverable from git
history. The GeoJSON and grid parsers are therefore **still tested but no longer
demonstrated by a bundled file**; restore one from git if you need a worked
example of a shape.

**Drag-and-drop is the primary path**, because `FileReader` works under
`file://` and `fetch` does not. Anything listed in `CONFIG.datasets` is fetched
and therefore makes those *entries* HTTP-only; the app itself still opens by
double-click and the picker says so when a fetch fails.

Polygons are reduced to their **area-weighted Mercator centroid**, so a unit
the divider crosses counts wholly on one side. With ~35k LSOAs that is noise;
with 48 counties it is visible — the since-deleted `uk-blocks.geojson` sample
showed that distortion deliberately (4.0% vs the same data as points at 19.3%).
The fix,
when wanted, is area-weighted splitting — clip each ring to each half-plane and
apportion by area. `clipToHalfPlane` is already the right tool: Sutherland–
Hodgman needs only the *clip* region to be convex, and a half-plane is, so a
concave subject still yields the correct signed area. Pre-filter by each
polygon's bbox so only the ones the line actually straddles get clipped.

`CONFIG.svgPointLimit` (50,000) is where the SVG renderer starts drawing a
strided subsample. **Stats always use every point**; only the drawing is
thinned, and the panel says so. Raising it is what a canvas renderer is for —
SVG is currently *faster* than canvas here, because dragging rewrites two
clip polygons rather than touching any point, so canvas only wins once the node
count, per-point colouring, or real choropleths force it.

**Hover tooltip.** There are no per-circle handlers. `drawPoints` records the
world coordinates of the points it actually draws (`drawnWorld`, with `drawnIdx`
mapping back to the data index), and a single throttled `pointermove` on the SVG
calls the pure `nearestPoint` to find the closest *drawn* dot within a few
pixels — so a strided subsample never shows a tooltip over blank space — then
names its value and, when the source has groups, its group. The divider handles
win the pointer, so no tooltip appears over a grab zone.

### Three things to know before editing the rendering

1. **The SVG user space is world units**, not pixels or lng/lat:
   `world = (normalised Mercator − origin) × 1e6`, so coastline path data is
   short integers. `viewBox="0 0 29306 55249"`. Convert with `mercToWorld` /
   `worldToMerc`. Strokes need `vector-effect="non-scaling-stroke"` or they
   vanish at this scale; anything sized in screen pixels (grab radius, handle
   size) must be scaled by `unitsPerPx` from `getScreenCTM()`.

2. **Points are drawn twice, each copy clipped to one half-plane.** Dragging
   updates two `clipPath` polygons — about six DOM writes per frame — instead of
   restyling 3,500 circles. Do not "simplify" this into per-point colouring.

3. **The clip rectangle is derived from the window, not fixed.**
   `preserveAspectRatio="xMidYMid meet"` letterboxes the viewBox, so how much
   world is on screen depends on the window's aspect ratio. `visibleBbox()`
   computes it from the viewport corners; `CONFIG.padBbox` is only a pre-layout
   fallback. Resize must trigger a full recompute.

### The two halves are `primary` / `secondary`, not `north` / `south`

`computeSplit` returns `primary` (drawn blue) and `secondary` (red), plus
`orientation` — `'ns'` or `'we'` — and `labels`, e.g. `['North', 'South']`.
**The compass words depend on the line's angle:** a divide running roughly
north–south splits the country *west/east*, so the cards relabel themselves.

The threshold is `VERTICAL_BAND = tan(22.5°)`, deliberately **not** 45°: the
canonical NW–SE diagonal this app exists to draw is steeper than 45° in
Mercator, and calling that "West/East" would be wrong.

**Exactly one discontinuity is unavoidable** — rotating a line through 180°
returns the same line with its halves exchanged, so no continuous rule can keep
blue on the same half forever. Choosing the sign rule per regime confines that
swap to the North/South ↔ West/East boundary, where the words change at the
same instant. A test sweeps 180° and asserts there is exactly one flip and that
it coincides with a relabel; if you touch `primarySignFor` or `orientationFor`,
that test is the one that matters.

## Architecture — `Play/index.php` (the daily game)

**The game is its own site.** It lives in `Play/` and is served from its own
domain, `https://playmapsplit.puntofisso.net/` (split from the tool on
2026-10-07) — that string is also `GAME.shareUrl`, which every shared
scorecard carries. `Play/` is **self-contained**: every URL it uses is relative
to it (`data/coast/`, `data/stats.json`, `data/stats/`, `data/games/`), so it
works the same as a docroot of its own or as `localhost:8765/MapSplit/Play/`.
Nothing in it may reach outside with `../` — that is what lets the two sites
deploy separately (`./deploy.sh tool` / `./deploy.sh game`).
`Play/data/legacy/` holds the first season's `puzzles.csv` and a copy of the
sample CSVs that `CONFIG.datasets` names; only `tests-game.html` reads them,
and they are not deployed. The front tool keeps its own `data/samples/`.

A daily puzzle on the same geometry. One fixed axis, one target share, **three
statistics**, and **one committed guess each**:

> **MapSplit #1 · North / South** — Find the line that puts 70% of
> *HMRC Tax Amount* north of it. Round 2 of 3.

### Normal and Pro

Two difficulty modes, in `MODES` (pure block):

| | asks for | at | `target` | `snapAxis` |
| --- | --- | --- | --- | --- |
| **Normal** (default) | always the 50/50 line | level or upright only | `50` | `true` |
| **Pro** | whatever split the day names | **any bearing**, diagonals included | `null` | `false` |

`target: null` means "use the puzzle row's own" and `snapAxis: true` means
"collapse the row's bearing to the cardinal it most resembles", so the mode
table stays a pure statement of what a mode *is*, and **`puzzleForDate` is the
only place difficulty touches anything**. Everything downstream — the task
wording, the answer, the grading, the takeaway, the scorecard — reads `axis` and
`target` and has no notion of mode at all. Normal is first and therefore the
default: 50/50 on a level line is the question the map makes you want to answer,
and an arbitrary percentage on a tilted one is the acquired taste.

**A diagonal costs the engine nothing and the player a great deal**, which is
why the angle belongs on the mode next to the target rather than in a second
difficulty system. Sliding is one-dimensional at any angle: the line still has
exactly one degree of freedom, `offsetOfPoint` still projects onto the normal,
and grading is untouched (there is a test asserting the true line yields its
target on six axes). What a diagonal costs is *reading* — you know Britain's
shape upright, and a tilted line has to be judged against a mental map you do
not have.

`snapAxisToCardinal` resolves ties toward the axis the line is turning *toward*:
45° → `we`, 135° → `ns`. Arbitrary, but it has to be decided somewhere.

**Every axis states its target against a northerly side** (westerly on the
upright tie), so the same line is never described as "40% North-west" in one
place and "60% South-east" in another. `axisSpec` flips a southward normal to
achieve that, which also fixed the wart the two cardinal presets existed to
paper over — a derived 90° used to name its sides East/West and read backwards.
It now reproduces `AXES.we` exactly, including `snapZero`ing `cos(π/2)`'s 6.1e-17
to a true zero, without which `lineCoordLabel`'s `n[0] === 0` test fails and a
row authored as `axis=90` silently loses the longitude that `axis=we` reports.

**Scores are per region × mode.** The same day scored against 50% and against
the day's own target are different games and must not share a store.
`storeKeyFor(regionId, modeId)` gives **UK + Pro** the original flat
`mapsplit-game-v2` key — everything already saved under it was played at the
table's own target, which is exactly what Pro means, so that is the honest
mapping and not merely a convenient one. Every other pair gets
`mapsplit-game-v2-<region>-<mode>`.

**The spread invariant is checked at every mode's effective axis AND target**,
not just the table's. Normal forces 50% *and* levels a diagonal, and it is the
default, so a row that only held at its own axis and target would ship a broken
default. The two vary independently: 135° is one of the safest axes on this data
and its N/S snap is a completely different question about a completely different
line. The full measurement is under "The puzzle table" below; the short version
is that Normal gets 25 km on the N/S row and **15 km on the W/E row**, both
outside the 10 km bullseye but both tighter than the Pro targets those rows were
chosen for.

**Two tests guard this, and they cover different things.** One measures the
built-in fallback `GAME.puzzles` (three hand-written rows); the other parses
**`Play/data/legacy/puzzles.csv` itself** and checks all 120 authored days in both modes —
closest pair 18.3 km. Until that second test existed the shipped file was never
validated at all, which was survivable with 8 cardinal days and is not with 120
across ten angles: one bad day is invisible until the morning it comes up. It
groups a day's rounds by *effective* axis before comparing, because two rounds
on different axes are different questions and neither can be traced onto the
other.

W/E-in-Normal is the thinnest number shipping and the first to re-measure if
the datasets change.

The scorecard's first line carries the map and the difficulty — `MapSplit 🇬🇧 #3
· Pro` — and each row carries its own axis as a glyph, because with per-round
axes there is no single one to put in the header. `axisGlyph` leans the way the
LINE leans, not the way the normal points: `↕` `↔` `⟍` (NW–SE, i.e. 45°) `⟋`
(NE–SW, i.e. 135°). A reader matching a glyph against the map they just played
is looking at the line. The share URL carries whatever is not the default —
`?r=us&m=pro` — or a link from a US Pro card opens on whatever map and
difficulty the reader last happened to pick.

### Regions: the map picker, and map-only regions

Four flags in the top bar switch the map. `REGIONS` (pure block) is the whole
registry, and **`puzzles` is the only thing that makes a region playable**, so
the two can never disagree: `data/samples/` holds UK statistics and nothing
else, so `eu`, `us` and `world` ship an empty table, `puzzleForDate` returns
null for them, and the page renders the map alone. Give a region a table and it
is playable — there is no second flag to remember to flip.

**A map-only region is not a dead page.** The coastline, the two tinted halves,
the line and the hand all work; you can drag it and watch the split move.
Nothing is scored and nothing is stored. `recompute()` was split for this:
everything above the point loop is geometry and needs no data, and only the
classification and the stats below it bail out early. The interactive guards
went from `roundLocked()` to **`playable()`** (`mapOnly || !roundLocked()`) —
`roundLocked()` is true for a map-only region because there is no round, which
silently froze the line the first time. `commitGuess` is still gated on
`roundLocked()` alone, so a map-only drag can never record a guess and Enter
there does nothing.

**Switching region reloads the page.** Half the module caches something derived
from the projection — the drawn point arrays, the coastline paths, the tooltip
index, the revealed answers — and a reload is one line that cannot miss one of
them, against an audit of a dozen caches that can.

**Where a choice comes from**, in order: the URL (`?r=`, `?m=`), then the last
choice in `localStorage` (`mapsplit-region`, `mapsplit-mode`), then the first
entry. An unknown id in either falls through instead of blanking the page.
Regions and modes share one pair of helpers — `findById` and `resolveChoice` —
because they are the same problem twice. The region is saved only *after* its
coast file has loaded, so a missing file cannot strand a player on it every
visit.

`sessionGame(GAME, region, mode)` is a shallow copy of the config carrying that
region's puzzle table, the ids, labels, flag, `forceTarget` and share URL, so
nothing downstream needed a new parameter. A test asserts it does not mutate
`GAME` — it is called once at boot, but a mutation there would corrupt the
shipped table for every later read.

The UK coastline is **no longer inlined** in `app-game.js`; that 71 KB constant
is gone and `Play/data/coast/uk.js` is the only copy. A test asserts the file's
`origin` and `scale` still match the `WORLD_ORIGIN` / `WORLD_SCALE` defaults the
pure block is compiled with, because if those drift every UK coordinate shifts
silently.

### The page SCROLLS — and that is deliberate

`Play/index.php` is **not** a fixed full-viewport shell like `index.html` and
`index.php`. `html, body` carry no `overflow: hidden`, `#shell` is in normal
flow, `#stage` has an explicit `height: 76vh; min-height: 360px`, and a `#below`
section of real content follows it.

That is a fix, not a style choice. Google's floating consent toolbar is
**scroll-triggered**: on a page where `scrollTop` is permanently 0 and
`scrollHeight === clientHeight`, its placement logic falls back to an arbitrary
mid-page offset and the badge lands over the map. Proved by building an ordinary
scrolling page on the same domain, where the badge behaved normally. **Do not
put `overflow: hidden` back on `html, body` here.**

**`$SHOW_ADS` is the first line of `Play/index.php`** and is the whole switch.
`false` renders a page with no trace of AdSense in it: no loader, no `<ins>`, no
"Advertisement" label, no reserved slot height, no consent button. Verified by
rendering all four flag × host combinations and grepping the output — with the
flag off, every marker is absent on both hosts. It is deliberately at the very
top of the file rather than down in the AdSense block, because that is where
someone turning ads off will look.

`$adsLive` is the separate host gate: even with the flag on, the real tag is
only emitted for `puntofisso.net`, and localhost gets a sized placeholder.

**The ad lives below the fold**, in the content flow inside `#below`, after a
block of real content — measured at ~1069px down on desktop and ~1320px on
mobile, both well past the viewport. It is a FIXED-size request (no
`data-ad-format`, no `data-full-width-responsive`) with the size declared in
`style-game.css` and `!important`, because AdSense rewrites the unit's inline
style. `#ad-slot` clips to a fixed height so a tall creative cannot push the
content below it around: verified by injecting a 300x600, after which the stage
height, the slot height and the position of everything above were all unchanged.

There are deliberately **no consent-repositioning workarounds** on this page —
no `fc-` promotion script, no `#ft-floating-toolbar` override. Both existed to
paper over the fixed layout, and re-adding them would undo the fix. If the badge
ever misbehaves again, check whether the page still scrolls before reaching for
CSS.

Four things hold the interaction together now that the document moves:

- **`touch-action: none` on `#map`** — without it a touch-drag scrolls the page
  instead of sliding the line.
- **The arrow-key handler calls `preventDefault()`**, or nudging the line would
  scroll the document. Same for Space during the reveal.
- **`#topbar` is `position: sticky`** with an opaque background, so the task and
  the guess button stay reachable while reading below the map.
- **Nothing recomputes on scroll, and nothing needs to.** `eventToWorld` and
  `visibleBbox` go through `getScreenCTM()`, which is viewport-relative and
  already accounts for scroll. Verified: an identical 90px drag scores the same
  at `scrollY` 0 and 300.
- **`commitGuess` calls `ensureStageVisible()`.** The reveal happens on the map,
  so a player who has scrolled down to the ad would otherwise commit and see
  nothing — the toast is `position: absolute` inside `#stage` and scrolls away
  with it. It only scrolls when less than half the stage is on screen, so a
  player already watching the map is never yanked around.

### One column, and the rails beside it

The map is **not full-bleed**. `--col` (760px) is the single number that sets
the width of the map box, the top bar's contents and the prose below it, so the
three share one centre and one pair of edges — a map wider than the text under
it read as two pages stapled together. The box itself is `#stage`: bordered,
rounded, shadowed, height `clamp(360px, 68vh, 620px)`, sitting on a `--page`
background that is deliberately *not* `--sea`, so it reads as an object on the
page rather than as the page.

`#play` is the grid around it: one column on a narrow screen, and
`--rail | --col | --rail` above **1140px** = `col + 2×(rail + gap)`. The two
`.rail` asides are **empty on purpose — there is no ad in them**. They exist so
that adding one later is a markup change and not a relayout: the explicit column
tracks hold their width whether or not anything is in them, which was measured —
filling a rail with a 160×600 block left `#stage` at exactly the same x. Below
the breakpoint `"rail-l"`/`"rail-r"` are not areas in the template, so a filled
rail auto-places into a new row **under** the box, which is where a lateral unit
has to go on a phone anyway; `.rail:empty { display: none }` keeps two empty ones
from opening 48px of dead `gap` there.

Raising `--rail` to 300 (for a 300×600) is a one-line change, but the 1140px
breakpoint is hard-coded and has to move with it.

### The top bar

Three separate things, and they were once one run-on sentence that read as a
status line: the puzzle number, the round, and the task. The first two are
chrome and sit small in `.bar-meta` with the guess pips; the
**task gets its own tinted, left-ruled box (`#hud`) as the last row of the bar**,
hard against the map, with the drag hint (`#hud-hint`) under it. It is the only
thing in the bar the player has to read.

Everything in the bar lives in `.bar-inner`, capped at `--col` and centred, so
the task box lines up exactly with the map box under it. The wordmark used to
hang off the bar's left edge at full height; that pushed the rest of the bar
right, which was invisible while the map was full-bleed and obvious the moment
it was not. It is now just the first item in `.bar-top`, with the links opposite.

What is still NOT in the bar is the split — see rule 1.

### The reveal

Committing a guess does **not** advance the round. It enters a reveal state:
the answer line sweeps into place and a toast shows the verdict, the points and
the fact. `advanceRound()` — the toast's button, or Enter/Space — is the only
way forward.

This is load-bearing, not decoration. `commitGuess` used to start the next round
inline, so the next dataset landed and replaced everything within about a
second: an animation had no time to play and the fact no time to be read. The
same trap ate an attempt to clear the verdict on round start. During the reveal
the line cannot be dragged, nudged, or re-committed.

**`animOffset` must never outlive its animation.** `requestAnimationFrame` does
not run in a hidden or occluded tab, so a reveal that never animates leaves the
override pinned at the player's own line — and the answer is drawn where they
guessed rather than where it is. That was observed, not theorised: with frames
suspended the sweep advanced zero frames and the "revealed" line sat exactly on
the guess. So `animateAnswer` arms a `setTimeout` for the duration + 250ms
alongside the sweep — timers are throttled in a background tab but still fire —
and whichever finishes first calls `endAnswerAnimation()`, which cancels both
and clears the override. `advanceRound` calls it *first* too. A pretty animation
must never decide whether the map tells the truth.

**Answer lines need `vector-effect: non-scaling-stroke` like every other
stroke here**, and answer labels anchor to `labelBbox` — `visibleBbox(0)`, the
visible rectangle *without* the 10% overflow pad that `clipBbox` carries for the
half-plane fills. Both were shipped wrong at first and had the same symptom:
the reveal appeared to do nothing. A 2-unit stroke is ~1/35 of a pixel at this
viewBox, and a label anchored to the padded rect lands 10% off the edge of the
map.

Revealed answers are drawn by `renderAnswers()` **entirely from
`round.results`**, so a resize just redraws them and there is no second copy of
the truth to keep in sync. Every previous round's answer stays on the map,
faded and labelled, because the takeaway compares against them and a line you
can see beats a line described in words. `lineEdgePoint` anchors each label —
it uses the real line/rectangle intersection rather than clamping a coordinate,
because clamping x and y independently moves the point **off** the line at any
angle that is not level or upright.

### The six rules that hold the design together

1. **The split is never displayed while playing.** No live readout, no
   breakdown. A visible percentage reduces the puzzle to "drag until the number
   matches", so the live summary and the whole breakdown dialog were removed
   rather than hidden. `recompute()` computes the stats and throws them away.
   If you add any readout, you have removed the game.
2. **No retries — and do not add them back.** The quantity is monotonic and
   smooth, so a guess that reports its own signed error hands over nearly
   complete information and the next guess is linear interpolation. That is
   binary search, not deduction: it converges in two steps whatever the
   tolerance, which is why the original five-guess format could not be saved by
   tuning. Variety comes from three *different statistics*, whose answers sit in
   different places, not from three attempts at one.
3. **Releasing the line IS the guess.** There is no commit button any more.
   `endDrag` calls `commitGuess()` on `pointerup` — but only if the line
   actually moved, tracked as `drag.moved`: a tap that moved nothing is a
   mis-tap or a failed scroll, and ending a one-guess round on one would commit
   a guess the player never made. `pointercancel` never commits. The keyboard
   path is unchanged (arrows nudge, Enter commits), and it is the only way to
   fine-tune, since a release now ends the round. A `#grip` hand rides the
   midpoint of the visible line — the affordance, since a 2px line in a
   world-unit viewBox reads as decoration — placed by `recompute()` and shown
   or hidden by the single `syncGrip()`.
4. **The axis is fixed and the line only slides.** That is what makes the answer
   unique — one degree of freedom, one correct offset — and therefore what makes
   a distance meaningful. A free angle puts infinitely many valid lines at every
   target. Handles, the rotate affordance and the snap buttons are all gone;
   `pointerdown` anywhere on the map starts a slide and the motion is projected
   onto the normal.
5. **Scoring is by DISTANCE, not by percentage points.** This is the one that
   was measured rather than guessed, and it is not negotiable without redoing
   the measurement. One screen pixel of drag moves the achieved share by
   **2.3–4.2 percentage points** on real data — the derivative is enormous
   wherever population is dense — so a percentage-based band of 10 points put
   the entire 1000-to-0 scoring range inside **about three pixels of travel**,
   and every play-through scored zero. Distance is what the player controls and
   is linear in pixels (~2.4 km/px at this map size). `bullseyeKm: 10` is ~4 px;
   `zeroAtKm: 250` gives ~104 px of gradient. There is a test asserting the
   gradient stays reachable by dragging.
6. **The task is worded as "find the line", never "hit the percentage".** It follows from
   rule 5: near a city a line 5 km out can still miss the share by nine points,
   and telling that player "bullseye" after asking them to hit 70% reads as the
   game lying. Framed as finding a line, 5 km out genuinely *is* nearly right.
   Feedback leads with the distance and reports the achieved share second.

### Removed from the game, and why

The dataset dropdown, the file upload and drag-and-drop (the puzzle picks the
data), the breakdown (it lets you back out the split without guessing), the
snap buttons and the rotation handles (the axis is fixed), and the ⚖ balance
buttons (they jump straight to the 50/50 line, one-click-solving any 50%
puzzle). The **Lock in guess** button went too (2026-08-27):
releasing the line commits, so a button was a second way to do the same thing
sitting where the map wanted to be.

`loadFile` / `openMapping` and the `#map-modal` markup are **dead but present**:
the pure ingest layer beneath them is still what parses each round's CSV.
Strip them once the game's shape is settled.

Each round loads its dataset **with** the group column, because the takeaway
needs the place names. What is suppressed is only the `Grouping by the "Name"
column` note the ingest layer emits about it — the chatter was the problem, not
the data. Every other note (skipped rows, a guessed weight column) still shows,
because those change what is being counted.

**Arrow keys nudge the line** by one pixel's worth (Shift for ten) and Enter
commits. That is not a nicety: the bullseye is ~4 px wide, so a mouse can reach
it but not comfortably, and the keys are also the only way to play without a
pointing device.

### The authored puzzle list — `Play/data/legacy/puzzles.csv`

**One row per ROUND**, three rows sharing a date. A round is the unit a person
thinks about, and it is what lets axis and target belong to the round rather
than the day:

```csv
date,round,dataset,field,axis,target
2026-09-01,1,LA.csv,Population2024,ns,40
2026-09-01,2,HMRC.csv,Total tax: Amount,we,55
2026-09-01,3,HMRC.csv,Self-employment income: Number of individuals,ns,45
```

- **`dataset` + `field` name a catalogue entry by FILE and COLUMN**, never by
  its display label. The labels carry emoji and are written for the screen;
  nobody should have to reproduce them by hand. `datasetForFile` resolves them,
  case- and path-insensitively, with the column alias-normalised.
- **`axis` is per round**, so a day can ask North/South then West/East. It takes
  `ns`, `we`, **or a bearing in degrees** — the shipped file uses ten angles at
  15° steps. Pro plays the bearing as written; **Normal snaps it to the nearest
  cardinal**, so every diagonal row has to be safe as two different questions.
- **`target` is optional and usually omitted.** Leave it blank and Pro's
  percentage is derived from the day by `proTargetFor` out of `GAME.proTargets`
  — measured bands, per axis, with a single `diag` band shared by every bearing
  because a band per angle is a promise the data cannot keep. Normal ignores it
  either way and asks for 50%.
  The point is that authoring a day should never require thinking in
  percentages.
- **Dates are authoritative; rotation is the fallback.** A row naming today
  wins, so a themed puzzle can be pinned to a date. Every other day falls back
  to `d % list.length`, which is what stops the game going blank the morning
  after the list runs out — a stale puzzle beats no puzzle.
- **It fails loudly.** `parsePuzzleCsv` throws, naming the row, on an unknown
  file/column, an unparseable axis or an out-of-range target; `loadPuzzleList`
  shows the notice and stops. A list that half-loads would score players against
  different numbers from each other.

`tools/puzzle_builder.html` generates the file. It extracts the pure block and
loads the real datasets, so its numbers are the game's numbers, then enumerates
every valid (axis × target × trio) and lays them out one per day, spacing
repeats as far apart as the pool allows. It also collapses catalogue entries
that are the *same* line (Population LA and its grouped twin; HMRC Employed and
Taxpayers are 0 km apart).

**A row is valid only if it clears the bullseye twice** — as Pro plays it (its
own axis, its own target) and as Normal plays it (the *snapped* cardinal, at
50%). Those are two different lines through two different questions.

**The "Min gap" control is not decoration, and 10 km is the wrong value for it.**
A row at 10.1 km satisfies the invariant and still hands out a near-free round.
Worse, a bare pass makes near-dead axes look usable: 60° has exactly ONE valid
combination on this data, so an even rotation would ship the identical puzzle
ten times at the thinnest margin available. **Ask for 18 km and such an axis
disappears by measurement** rather than by a hard-coded exclusion list — which
is the only mechanism that will still be correct for a region whose dead angle
is somewhere else. On the current UK data:

| min gap | axes usable | distinct puzzles |
| --- | --- | --- |
| 10 km (bare invariant) | 12 | 120, but 45° and 60° are one puzzle each |
| **18 km (shipped)** | **10** | **61** |
| 25 km | 6 | 16 |

The shipped file is **120 days at 18 km, ten angles, twelve days each**; its
closest pair anywhere is 18.3 km. That is nearly 3× the old cardinal-only pool
of 22 distinct puzzles while being *stricter* than it was. More statistics is
still the bigger unlock for a full year, but diagonals bought most of a season
from data that was already there.

`REGIONS[].puzzleUrl` points a region at its file; `REGIONS[].puzzles` is the
built-in fallback used only when a region declares no file, and is what the
tests measure against.

### The built-in puzzle table

```js
puzzles: [
  { axis: 'ns', target: 40,
    stats: ['Population (LA 🇬🇧)', 'HMRC 🇬🇧 Tax Amount', 'HMRC 🇬🇧 Self-Employed'] },
]
```

**The target is not cosmetic, and it is NOT transferable between axes.** The
three statistics must resolve to lines further apart than `bullseyeKm`.

**Why — and the earlier explanation in this file was wrong.** It used to say a
player could "nail round 1, not move at all, and collect free bullseyes". They
cannot: the line resets to the centre of `padBbox` at the start of every round.
The real mechanism is that `renderAnswers()` keeps every revealed answer on the
map during later rounds, dashed and labelled, so the player can simply drag onto
round 1's line. The bullseye is ~4 px, so tracing a drawn line is full marks.
**That makes the invariant a consequence of a display choice, not a law** — see
`BACKLOG.md`, "should revealed answers stay on the map while you play?". Minimum pairwise gap between the three
statistics, on this data, by axis and target:

| target | 25% | 30% | 35% | 40% | 45% | 50% | 55% | 60% | 65% | 70% | 75% |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **N/S** | 20 | 43 | 30 | **43** | 46 | 25 | 15 | 6 | 5 | 4 | 2 |
| **W/E** | 7 | 6 | 9 | 7 | 17 | 15 | **21** | 21 | 12 | 5 | 2 |

(km; **bold** = the shipped targets. 70% N/S was the original value and was
*inside* the bullseye, which is what started all this.)

**Diagonals are not a uniform sweep between the two**, and this is the single
most surprising number in the repo. Same trio, same method:

| target | 25% | 30% | 35% | 40% | 45% | 50% | 55% | 60% | 65% | 70% |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **45°** | 11 | 12 | 9 | 7 | 7 | 5 | 2 | 0 | 0 | 0 |
| **60°** | 5 | 2 | 3 | 1 | 0 | 0 | 2 | 1 | 2 | 1 |
| **120°** | 15 | 18 | 27 | 17 | 20 | 36 | 46 | 31 | 14 | 8 |
| **135°** | 18 | 41 | 32 | 26 | 37 | 39 | **47** | 28 | 15 | 9 |

**45–60° is dead and 120–135° is the richest axis in the table — better than N/S
at its best.** That is a fact about Britain, not about the code: the population
spine runs London–Birmingham–Manchester–Glasgow, roughly NW–SE, and a line at
45° lies *along* it, so population, tax and self-employment all resolve to
nearly the same line. The perpendicular cuts across every city in turn and
separates them maximally. **Expect the dead angle to sit somewhere else entirely
in another country — measure it, never assume it.**

**The two axes do not agree anywhere useful.** N/S is forgiving across a wide
30–45% plateau; W/E is only workable in a narrow 45–60% band, and 40% — the
right answer for N/S — is **6.9 km on W/E, inside the bullseye**. Copying a
target from one axis to the other is the trap to know about here. Britain is
only ~500 km wide and its population is simply not arranged along that axis the
way it is along the other.

Normal mode forces 50% on every row regardless: 25 km on N/S, **15 km on W/E**.
Both clear, but W/E-in-Normal is the thinnest thing shipping and the first
number to re-measure when the data changes.

A test asserts the shipped table keeps its statistics further apart than
`bullseyeKm` **at every mode's effective axis and target**, another asserts the
table exercises more than one axis, and a third parses **`Play/data/legacy/puzzles.csv`
itself** and checks all 120 authored days the same way — **run
`Play/tests-game.html` after editing the puzzle CSV**, since it loads the real
datasets to check this.

These are *minimum pairwise* gaps, which is what the test enforces and what a
player can exploit: the closest pair is the one that hands out a free bullseye.
An earlier revision of this file reported larger figures for the same targets
under the name "spread"; it was measured differently and has been replaced.

One row per day from `GAME.epoch`, indexed with `%` so a short table still
yields a puzzle on every date instead of running out. **Parse the planned CSV
into exactly this shape and assign it; nothing else changes.** `axis` takes
`'ns'`, `'we'`, or a bearing in degrees — 45 is the NW–SE diagonal, 135 the
NE–SW one — and it needs no new code path because sliding is one-dimensional at
any angle. Tests assert
every row's axis parses, its target is in range, and every stat name exists in
`CONFIG.datasets` — a typo would otherwise surface only as a blank map at
midnight.

Days roll at **UTC** midnight so two players in different time zones are never
on different puzzles, and `dayNumber` parses both dates as UTC so DST cannot
introduce a fractional day. A date before the epoch clamps to puzzle 1, so a
wrong system clock gives a playable puzzle rather than a blank page.

### The geometry the game adds

- **`quantilePosition(values, weights, fraction)`** generalises
  `balancePosition` — which is exactly this at fraction 0.5, and there is a test
  pinning them together. `targetOffset` wraps it to answer "where is the line
  that puts X% on the normal side?".
- **`shareAbove`** grades by projecting onto the normal, so grading never
  depends on `primarySignFor`'s labelling or on the primary/secondary
  discontinuity. A test checks it agrees with `computeSplit` on the same line.
- **`offsetGapKm`** measures the gap with a **haversine at a reference point**,
  not by scaling a Mercator delta. Parallel lines in Mercator are *not* a
  constant ground distance apart: a degree of longitude is ~67 km at 53°N and
  ~59 km at 58°N, so a West/East puzzle's gap already varies ~13% along its own
  length. That is not a cost of allowing diagonals — the cardinal axes already
  had it. The reference is the round's **weighted centroid**, which is what
  makes the number reproducible rather than a function of where you looked.
- **`axisSpec`** returns `{ angle, normal, sides }`. The two cardinal presets
  carry an explicit normal so the target is stated against the conventional side
  ("70% North", "70% West"); derived from the angle alone, 90° would name its
  sides East/West and read backwards.

### Scoring, state and sharing

`points = 1000 × (1 − km / zeroAtKm)`, clamped at zero, summed across the three
rounds for 3,000 a day. The line resets between rounds to the centre of
`CONFIG.padBbox` — **not** the viewport, whose extent depends on the player's
window aspect ratio; every player must meet every stat from the identical
starting line or the scores are not comparable.

State persists per-date in `localStorage` under **`mapsplit-game-v2`** (v1 was
the abandoned five-guess shape and must never be fed to this code), trimmed to
30 days. Every `localStorage` call is wrapped in try/catch — Safari private mode
throws on write — and a failure only stops persistence, never play.

Sharing uses `navigator.share` on mobile and the clipboard elsewhere. The
scorecard is selectable text, not an image, so a refused clipboard still leaves
something copyable, and a test asserts the shared text leaks neither the
achieved share, the error, nor the distance — it gets pasted in public.

### The takeaway

After each committed guess — **never before** — the round states the fact its
answer encodes:

> 40% of HMRC 🇬🇧 Tax Amount is north of 52.03°N — a line through Central
> Bedfordshire. That is 87 km south of the Population (LA 🇬🇧) line.

Generated from the data, not authored per puzzle: the true line and its
neighbourhood are already computed for the distance payoff, so a new dataset in
the CSV needs no new prose. It arrives too late to help that round, so it costs
no difficulty — it is what stops a zero-point day being a wasted one. It is
delivered in the reveal toast (below), and the result dialog repeats all three
under "What you learned today".

Two details in `placeNearLine`:

- It names the **heaviest** of the 20 points nearest the line, not the closest
  one. The closest is usually a district nobody recognises; the heaviest of the
  neighbourhood is somewhere the reader has heard of and still genuinely near.
- `tidyPlaceName` strips statistical-geography codes (`Leeds 001A` → `Leeds`),
  which is what makes LSOA-based puzzles readable. Names that merely end in
  something numeric are left alone.

`lineCoordLabel` gives a latitude for a level line and a longitude for an
upright one, and **null for a diagonal** — a diagonal is neither a parallel nor
a meridian, and inventing one number for it would be worse than saying nothing.
The coordinate leads and the place follows, because the line crosses the whole
country: naming one town is a landmark, not a location.

## Architecture — `legacy/` (the prototype)

> **`legacy/` has been deleted from the working tree** and exists only in git
> history. The section below is kept because it records *why* the current
> geometry is shaped the way it is — in particular the centroid-labelling bug
> that `primarySignFor` exists to avoid. Treat it as history, not as code you
> can open. The table at the top of this file lists it for the same reason.

Data → map → divider → geometry → stats → UI. Wired in `legacy/js/main.js`.

- **`js/config.js`** — the single place to tweak: UK view (center/zoom), the
  padded bounding box, tile source path, colors, synthetic-data params.
- **`js/geometry.js`** — PURE, no DOM/map deps. Web Mercator projection, point
  side-classification (sign of a cross product in Mercator), and Sutherland–Hodgman
  half-plane clipping that turns the UK bbox + line into two fill polygons. This is
  the correctness-critical module; keep it pure and test it directly.
- **`js/stats.js`** — PURE. Aggregates weight/count/% per side.
- **`js/data-source/interface.js`** — the data-source contract: `{ label, unit,
  getFeatures() }` returning a GeoJSON point FeatureCollection where each feature
  has a numeric `weight`. **All future real data sources (OA/LSOA centroids,
  gridded raster, uploaded CSV/GeoJSON) implement this same interface** — do not
  bake dataset assumptions elsewhere.
- **`js/data-source/synthetic.js`** — a seeded synthetic implementation (weighted
  points clustered around GB cities). Placeholder for real population data.
- **`js/divider.js`** — TerraDraw wiring. Owns a finite 2-vertex draggable line
  (drag an endpoint = reangle, drag the body = translate). Emits throttled change
  events with the current two endpoints.
- **`js/map.js`** — MapLibre GL JS + Protomaps init and the custom sources/layers
  (tinted half-plane fills, colored points, divider line).
- **`js/ui.js`** — stats panel and the missing-tiles banner.

### Core idea to preserve (all builds)

Interaction owns a *finite draggable segment*; **our geometry owns the split**.
From the two endpoints we derive the *infinite* dividing line, the two
half-planes, and per-point membership. Classification happens in **Web Mercator**
so a point's side depends only on geography + line, never on pan/zoom or window
size. The northern half is always blue, the southern always red.

Which half is which comes from the **line's normal** (`primarySignFor`: the
positive half-plane is the side `N = (-dy, dx)` points to; `N` points north
exactly when `dx < 0` and west exactly when `dy > 0`) — **not** from the
polygons' centroid latitude. The prototype's centroid approach depends on the
shape of the clip rectangle and mislabels the halves outright when that
rectangle changes; `legacy/js/geometry.js` still carries that latent bug.

The panel can be minimised to its title bar plus a one-line
"West 61.1% · East 38.9%" summary, and starts minimised under 640px wide.

A collapsed "What's being counted" disclosure under the cards lists the top five
contributing clusters per side. It only rebuilds its markup while open, so
dragging costs nothing when it is shut. Clusters the divider passes through
contribute to both sides and are marked `†`, so the same name appearing in both
columns reads as information rather than a bug.

## Region coastlines — `Play/data/coast/*.js`

Four regions, generated by `tools/prep_regions.py` from Natural Earth and
rendered by nothing yet: `uk` (10m), `eu` (50m), `us` (50m), `world` (110m).
**`BACKLOG.md` has the plan and the blocker** — in short, `data/samples/` is
UK-only, so the other three can be drawn but not played.

Each file is a **classic `<script src>`** assigning into a global:

```js
window.MapSplitCoast = window.MapSplitCoast || {};
window.MapSplitCoast['us'] = { id, label, flag, displayBbox, padBbox,
                               defaultLine, origin, scale, viewBox,
                               subject: [...], context: [...] };
```

Not JSON and not a module, and that is the portability requirement rather than a
style choice: `index.html` opens by double-click, and under `file://` a no-cors
subresource load is the only kind that works — `fetch` and `import` both fail.
The same file can therefore be pulled in statically or injected as a `<script>`
tag on demand, with or without a server.

Each region carries **everything** needed to draw and play it, because a
consumer that must be told a region's origin out of band is not portable.
`subject` is the land the statistics count; `context` is background land that is
not counted — the generalisation of the UK build's GBR/IRL split, named for what
it does rather than for a country.

Three things worth knowing before regenerating:

- **Tolerances are in world units, which are absolute** — a fraction of the
  whole Mercator square, not of the region. 10 units is sub-pixel for the UK
  (viewBox 29,306 wide) and absurd over-detail for the world (1,000,000 wide),
  so every region names its own tolerance and its own source resolution.
- **The UK region reproduces the inlined `COAST` constant byte for byte**, and
  that is the regression test for the generator: same source, same tolerance, no
  clipping (which `prep_coast.py` did not do either). Verified after the
  rewrite — 55 subject paths and 7 context paths, all identical.
- **Rings are clipped to the display bbox** for every region except the UK.
  Country polygons run far past a regional frame (Russia in the EU box, Canada
  in the US box) and unclipped they dominate the bytes for geometry nobody can
  see. Sutherland–Hodgman again: only the clip rectangle has to be convex.

Deliberate omissions, all of them because a single straight line in one Mercator
projection cannot mean anything across them: Alaska and Hawaii (the `us` frame
is the contiguous 48), the EU outermost regions — Canaries, Azores, Madeira, the
French DOM, which Eurostat's own maps show as insets — and Antarctica.

`tools/preview_regions.html` draws all four from the files alone, with each
region's `defaultLine` overlaid to prove the coastline and the geometry share
one coordinate system. It is a dev tool and is not deployed.

## Data pipeline — `sources/` → `Play/data/stats/` (in progress, not yet wired in)

The game's statistics are being rebuilt through a repeatable pipeline;
`sources/README.md` is the full description and the yearly runbook. One folder
per source (`source.json` + `build.py`), run by `tools/pipeline/run.py`, which
writes `Play/data/stats/<id>.csv` (always `lon,lat,value,name`), the catalogue
`Play/data/stats.json`, and the licence record `Play/data/stats/README.md`. Standard
library only — the local pandas is broken, and `tools/pipeline/sheets.py`
reads .ods/.xlsx directly.

- **Every source must be UK-wide** (all four nations), and must declare its
  licence and attribution; the build refuses one that does not.
- **Religion and ethnicity are out** as game statistics, by the owner's
  decision (2026-10-06), and so are country of birth, year of arrival,
  English proficiency and **age** (every census age band sat within ~3 km of
  the population line). Politics is in. The census source enforces this with
  `excludedTables`; its build refuses a statistic from an excluded table.
- **Census geography** (`sources/smallareas`): Output Areas are grouped into
  46,844 LSOA-sized areas (LSOA 2021 in E&W, Data Zones 2022 in Scotland, Data
  Zones 2021 in NI), cached in `data/raw/smallareas/areas.json` — delete it to
  rebuild. `tools/pipeline/survey_census.py` measures every census variable's
  50/50 lines against the population's; output in `review/census-survey.csv`.
- **Census and OSM ship aggregated to local authorities** (`"aggregate": "lad"`
  in their `source.json`, applied by `run.py` via `common.aggregate_lad`): each
  authority's total sits at that statistic's own weighted centre within it.
  This took `Play/data/stats/` from 68 MB to 1.4 MB and moved answer lines by a
  median 1.1 km (max 7.4 km, castles W/E) — all inside the bullseye; valid
  Normal days went 785 → 761. Three OSM statistics opt out (`"aggregate": null`,
  reason in `aggregateNote`) because one authority would hold >10% as a single
  point: Pret (Westminster), distilleries (Moray, Highland), standing stones
  (Wiltshire). Small-area files are still built by deleting the flag; the
  pre-aggregation measurements are in `review/before-aggregation/`.
- **GDAL is broken here too** (Homebrew dylib mismatch) — hence
  `tools/pipeline/shapefile.py`.
- `data/raw/` is git-ignored **and** excluded in `deploy.sh` — `.gitignore`
  does not apply to rsync, and `data` is deployed as a whole directory.
- The Sheffield/Barnsley hole in `data/samples/*.csv` came from ONS and HMRC
  tables still using pre-2023 codes (E08000019/16). `LAD_CODE_CHANGES` in
  `tools/pipeline/common.py` maps them, and an unexplained dropped area now
  fails the build. The samples themselves were patched on 2026-10-07 from the
  same source files they were built from (`data-scripts/LA-population.csv`,
  `LA-income.csv`, old codes), so their vintage is unchanged; the front door
  and `index.html` keep using them as worked examples for people's own data.

**The game now reads the pipeline's output** (switched 2026-10-06): the UK
region declares `statsUrl` (`Play/data/stats.json`, turned into the runtime
catalogue by the pure `catalogueFromStats`) and `gamesUrl` (`Play/data/games/`,
one file per UTC year, parsed by `parseGamesJson`). A missing year file falls
back to the previous year and `puzzleForDate`'s rotation. `puzzleUrl`
(`Play/data/legacy/puzzles.csv`) and `CONFIG.datasets` remain for the tests and as the
record of the first season.

- **Themes and schedules**: `schedule/themes.json` (themes, caps, spacing
  rules) → `node tools/pipeline/schedule.mjs YEAR [--from DATE]` →
  `Play/data/games/YEAR.json` plus `review/schedule-YEAR.csv`. Seeded by the year,
  so regenerating gives the identical file. No day repeats within a year; the
  generator re-verifies every day's gaps with the game's own code.
  `tools/pipeline/themes.mjs [--normal-only]` counts each theme's valid days.
- **Pro is hidden** (`hidden: true` in `MODES`): the schedules are generated and
  validated for Normal only. A saved or linked `m=pro` falls back to Normal;
  `#mode-picker[hidden]` needs its own CSS rule because `.bar-modes` sets
  `display: flex`. The How-to-play copy for Pro is parked in a PHP comment.
- **Preview mode**: `Play/?date=YYYY-MM-DD` plays that day, with a prev/next
  bar, and keeps scores in a separate `…-preview` store so a previewed future
  day is not "already played" when it arrives.
- Local Apache's docroot no longer points here; `php -S localhost:8765 -t ..`
  from this folder serves `http://localhost:8765/MapSplit/Play/`.
- **Data URLs are versioned.** Each statistic carries a 12-hex content `hash`
  in `stats.json` (written by `run.py`), which `catalogueFromStats` appends as
  `?v=`; `stats.json` and `Play/data/games/*.json` are stamped with
  `window.MAPSPLIT_DATA_VERSION`, the newest of their mtimes, emitted by
  `Play/index.php` (`$dataVersion`). Without it a cached old catalogue could
  meet a new schedule after the yearly refresh.
- **The takeaway's place is chosen near the middle of the data.**
  `placeNearLine` takes an optional `along` array (`alongOfPoint`, the
  coordinate along the line) and only considers points inside the
  statistic's 25th–75th weighted percentile along it — an upright line through
  Edinburgh used to name itself after Orkney.
- `Play/tests-game.html` now has 178 assertions, including ones that load the
  shipped `stats.json` and both schedules.

## Design specs

- `docs/superpowers/specs/2026-07-23-mapsplit-single-file-design.md` — current,
  including a "Divergences from the design" section recording what changed
  during implementation and why.
- `docs/superpowers/specs/2026-07-22-mapsplit-design.md` — the prototype.

The `-ads` and `-game` builds have **no** spec document; their design decisions
are recorded in their sections above and in the comments in the code. If either
grows much further, write one.

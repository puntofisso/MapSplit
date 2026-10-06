/* BEGIN PURE */
// =========================================================================
// Everything between the PURE markers is free of DOM and rendering concerns.
// tests.html extracts this block verbatim and asserts against it, so the
// tests can never drift from the implementation. Keep it dependency-free.
// =========================================================================

// All six HMRC entries are cuts of one upstream table, so they share one
// `sources` literal rather than repeating it six times.
var HMRC_SOURCES = [
  { label: 'HMRC Table 3.14 — Income and tax by borough and district or unitary authority',
    url: 'https://www.gov.uk/government/statistics/income-and-tax-by-borough-and-district-or-unitary-authority-2010-to-2011' },
  { label: 'Local Authority District (May 2025) boundaries — centroids',
    url: 'https://geoportal.statistics.gov.uk/datasets/local-authority-districts-may-2025-boundaries-uk-bfe-v2/explore' },
];

var CONFIG = {
  // The display bounding box [west, south, east, north]. Defines the viewBox.
  displayBbox: [-8.65, 49.8, 1.9, 61.0],
  // Fallback box the half-plane fills are clipped against, used only before
  // the first layout. Once the SVG has a CTM the clip box is derived from the
  // actually-visible world extent instead — a FIXED box cannot work, because
  // "xMidYMid meet" letterboxes the tall viewBox and the visible extent then
  // depends on the window's aspect ratio.
  padBbox: [-13, 47, 5, 62],
  defaultLine: [
    [-4.05, 54.9],
    [1.35, 50.9],
  ],
  synthetic: {
    count: 3500, seed: 42,
    // The synthetic source is a dataset like any other as far as the sources
    // box is concerned — an entry with no `url` renders as plain text.
    sources: [
      { label: 'Illustrative fake data: ~3,500 points scattered around GB cities ' +
               'from a fixed random seed, so the map is identical every time.' },
    ],
  },
  // Grab radius / handle size, in screen pixels.
  grabRadiusPx: 14,
  handleRadiusPx: 7,

  // --- The dataset catalogue ---------------------------------------------
  // ADD YOUR TEST FILES HERE. Each entry is fetched on demand and fed to the
  // matching parser; the picker in the panel appears only when this list is
  // non-empty, so leaving it empty keeps the file exactly as it was.
  //
  //   { label, unit, url, type?, weightColumn?, groupColumn?, sources? }
  //
  // `sources` is the provenance shown in the panel's Sources box whenever this
  // dataset is the one rendered — a list of { label, url? }. An entry without a
  // `url` renders as plain text, which is how the synthetic source and an
  // uploaded file describe themselves. GIVE EVERY DATASET ONE: it is the only
  // place the app says where its numbers came from.
  //
  // `type` is optional — it is sniffed from the extension and content when
  // omitted. Valid values: 'csv', 'geojson-points', 'geojson-polygons',
  // 'grid-json', 'ascii-grid'.
  //
  // CAVEAT, and it is the whole tension in this design: fetch() does not work
  // under file://, so anything listed here makes the app HTTP-only. Serving
  // from http://localhost/MapSplit/ is fine. Drag-and-drop, by contrast, uses
  // FileReader and keeps working on a double-click — which is why the file
  // drop is the primary path and this catalogue is the secondary one.
  // The five entries below are the bundled samples in data/samples/ — one per
  // (the paths climb out of Play/, which is where this build lives; data/ is
  // shared with the other builds and stays at the repo root)
  // supported shape, small enough to read in a text editor. They double as the
  // format documentation. Delete them once real data is wired in.
  datasets: [
    { label: 'Population (LA 🇬🇧)', unit: 'people',
      url: '../data/samples/LA.csv', type: 'csv',
      weightColumn: 'Population2024', groupColumn: 'Name',
      sources: [
        { label: 'One point per UK local authority. Centroids from Local Authority District (May 2025) boundaries',
          url: 'https://geoportal.statistics.gov.uk/datasets/local-authority-districts-may-2025-boundaries-uk-bfe-v2/explore' },
        { label: 'ONS mid-year population estimates',
          url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland' },
      ] },
      { label: 'Population (LA 🇬🇧, grouped)', unit: 'people',
      url: '../data/samples/LA-grouped.csv', type: 'csv',
      weightColumn: 'Population2024', groupColumn: 'Nation',
      sources: [
        { label: 'As Population (LA), but grouped by Nation in "What\'s being counted". Centroids from Local Authority District (May 2025) boundaries',
          url: 'https://geoportal.statistics.gov.uk/datasets/local-authority-districts-may-2025-boundaries-uk-bfe-v2/explore' },
        { label: 'ONS mid-year population estimates',
          url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland' },
      ] },
      { label: 'Population (LSOA 🏴󠁧󠁢󠁥󠁮󠁧󠁿 + 🏴󠁧󠁢󠁷󠁬󠁳󠁿)', unit: 'people',
      url: '../data/samples/LSOA.csv', type: 'csv',
      weightColumn: 'Population', groupColumn: 'LSOA21NM',
      sources: [
        { label: 'One point per Lower-layer Super Output Area in England & Wales. Centroids from LSOA (December 2021) boundaries',
          url: 'https://geoportal.statistics.gov.uk/datasets/ons::lower-layer-super-output-areas-december-2021-boundaries-ew-bsc-v4-2/about' },
        { label: 'ONS LSOA mid-year population estimates (mid-2024)',
          url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/lowersuperoutputareamidyearpopulationestimates' },
      ] },
      { label: 'HMRC 🇬🇧 Self-Employed', unit: 'people',
      url: '../data/samples/HMRC.csv', type: 'csv',
      weightColumn: 'Self-employment income: Number of individuals', groupColumn: 'Name',
      sources: HMRC_SOURCES },
      { label: 'HMRC 🇬🇧 Employed', unit: 'people',
      url: '../data/samples/HMRC.csv', type: 'csv',
      weightColumn: 'Employment income: Number of individuals', groupColumn: 'Name',
      sources: HMRC_SOURCES },
      { label: 'HMRC 🇬🇧 Retired', unit: 'people',
      url: '../data/samples/HMRC.csv', type: 'csv',
      weightColumn: 'Pension income: Number of individuals', groupColumn: 'Name',
      sources: HMRC_SOURCES },
      { label: 'HMRC 🇬🇧 Taxpayers', unit: 'people',
      url: '../data/samples/HMRC.csv', type: 'csv',
      weightColumn: 'Total tax: Number of individuals', groupColumn: 'Name',
      sources: HMRC_SOURCES },
      { label: 'HMRC 🇬🇧 Tax Amount', unit: 'GBP',
      url: '../data/samples/HMRC.csv', type: 'csv',
      weightColumn: 'Total tax: Amount', groupColumn: 'Name',
      sources: HMRC_SOURCES },
  ],

  // Above this many points the SVG renderer draws a deterministic subsample,
  // because ~50k circles × 2 clipped copies is where DOM node count starts to
  // cost more than the drag budget. STATS ALWAYS USE EVERY POINT — only the
  // drawing is thinned, and the panel says so. Raising this is what the canvas
  // renderer is for.
  svgPointLimit: 50000,
};

// --- Web Mercator (normalised 0..1 unit square) -------------------------

function lngLatToMerc(ll) {
  var lng = ll[0], lat = ll[1];
  var x = lng / 360 + 0.5;
  var sin = Math.sin((lat * Math.PI) / 180);
  var clamped = Math.max(-0.9999, Math.min(0.9999, sin));
  var y = 0.5 - (0.25 * Math.log((1 + clamped) / (1 - clamped))) / Math.PI;
  return [x, y];
}

function mercToLngLat(p) {
  var x = p[0], y = p[1];
  var lng = (x - 0.5) * 360;
  var lat = (2 * Math.atan(Math.exp((0.5 - y) * 2 * Math.PI)) - Math.PI / 2) * (180 / Math.PI);
  return [lng, lat];
}

// --- World units --------------------------------------------------------
// The SVG user space is normalised Mercator shifted to the display bbox
// origin and scaled up, so path data is short integers instead of long
// decimals. Two multiplies convert either way.

var WORLD_ORIGIN = [0.47597222222222224, 0.2847580883651208];
var WORLD_SCALE = 1000000;

function mercToWorld(m) {
  return [(m[0] - WORLD_ORIGIN[0]) * WORLD_SCALE, (m[1] - WORLD_ORIGIN[1]) * WORLD_SCALE];
}

function worldToMerc(w) {
  return [w[0] / WORLD_SCALE + WORLD_ORIGIN[0], w[1] / WORLD_SCALE + WORLD_ORIGIN[1]];
}

function lngLatToWorld(ll) { return mercToWorld(lngLatToMerc(ll)); }
function worldToLngLat(w) { return mercToLngLat(worldToMerc(w)); }

// --- Side classification ------------------------------------------------

// Signed area of triangle A,B,P (in Mercator). Sign tells which side of the
// infinite line A→B the point P lies on. Zero means exactly on the line.
function sideValue(A, B, P) {
  return (B[0] - A[0]) * (P[1] - A[1]) - (B[1] - A[1]) * (P[0] - A[0]);
}

// --- Convex polygon clipping to a half-plane (Sutherland–Hodgman) -------

function clipToHalfPlane(poly, A, B, keep) {
  var out = [];
  var n = poly.length;
  for (var i = 0; i < n; i++) {
    var cur = poly[i];
    var nxt = poly[(i + 1) % n];
    var sc = sideValue(A, B, cur) * keep;
    var sn = sideValue(A, B, nxt) * keep;
    if (sc >= 0) out.push(cur);
    if ((sc >= 0) !== (sn >= 0)) {
      var rawC = sideValue(A, B, cur);
      var rawN = sideValue(A, B, nxt);
      var t = rawC / (rawC - rawN);
      out.push([cur[0] + t * (nxt[0] - cur[0]), cur[1] + t * (nxt[1] - cur[1])]);
    }
  }
  return out;
}

// --- Naming the two halves ----------------------------------------------
//
// A divide that runs roughly east–west splits the country north/south; one
// that runs roughly north–south splits it west/east. Which words to use is
// therefore a property of the line's angle.
//
// Within tan(22.5°) of vertical we switch to West/East. The threshold is
// deliberately NOT 45°: the canonical NW–SE divide this app exists to draw is
// steeper than 45° in Mercator, and calling that "West/East" would be wrong.
var VERTICAL_BAND = 0.41421356; // tan(22.5°)

function orientationFor(A, B) {
  var dx = Math.abs(B[0] - A[0]);
  var dy = Math.abs(B[1] - A[1]);
  return dx < VERTICAL_BAND * dy ? 'we' : 'ns';
}

var LABELS = { ns: ['North', 'South'], we: ['West', 'East'] };

// Which of the two half-planes is the primary (blue) one?
//
// Derived from the line's normal, NOT from the clipped polygons. Substituting
// M + s·N (M the midpoint of AB, N the normal (-dy, dx)) into sideValue gives
// exactly s·|AB|, so the POSITIVE half-plane is always the side N points to.
// In Mercator y grows southward, so N points north exactly when dx < 0, and
// N points west exactly when dy > 0.
//
// An earlier version averaged the latitude of each polygon's vertices. That is
// a vertex average rather than an area centroid, so it depended on the shape of
// the clip rectangle and mislabelled the halves outright once the rectangle was
// derived from the window instead of being a fixed box.
//
// ONE DISCONTINUITY IS UNAVOIDABLE. Rotating a line through 180° returns the
// same line with its halves exchanged, so no continuous rule can keep "blue"
// on the same half forever. Choosing the rule per regime confines the swap to
// a single regime boundary — where the words change from North/South to
// West/East at the same instant, which at least makes it self-explanatory.
// Previously the swap happened at exactly vertical while the cards still said
// North and South, which was not.
function primarySignFor(A, B) {
  var dx = B[0] - A[0];
  var dy = B[1] - A[1];
  if (orientationFor(A, B) === 'we') return dy > 0 ? 1 : -1; // west half
  if (dx !== 0) return dx < 0 ? 1 : -1; // north half
  return dy > 0 ? 1 : -1; // fully degenerate; keep it deterministic
}

// Intersections of the infinite line A→B with a Mercator rectangle's 4 edges.
function lineRectIntersections(A, B, rect) {
  var d = [B[0] - A[0], B[1] - A[1]];
  var pts = [];
  var edges = [
    [rect[0], rect[1]],
    [rect[1], rect[2]],
    [rect[2], rect[3]],
    [rect[3], rect[0]],
  ];
  for (var i = 0; i < edges.length; i++) {
    var P = edges[i][0], Q = edges[i][1];
    var e = [Q[0] - P[0], Q[1] - P[1]];
    var denom = d[0] * e[1] - d[1] * e[0];
    if (Math.abs(denom) < 1e-12) continue; // parallel
    var s = ((A[0] - P[0]) * d[1] - (A[1] - P[1]) * d[0]) / -denom;
    if (s >= -1e-9 && s <= 1 + 1e-9) {
      pts.push([P[0] + s * e[0], P[1] + s * e[1]]);
    }
  }
  return pts;
}

// Given the two divider endpoints (lng/lat) and a bbox [w,s,e,n], return the
// two half-planes as Mercator rings plus the divider line clipped to the bbox.
//
// The halves are `primary` (drawn blue) and `secondary` (red). Which compass
// words describe them is in `orientation` — 'ns' for North/South, 'we' for
// West/East — because that depends on the line's angle. `primarySign` is the
// sideValue sign corresponding to the primary half.
function computeSplit(endpointA, endpointB, padBbox) {
  var A = lngLatToMerc(endpointA);
  var B = lngLatToMerc(endpointB);

  var w = padBbox[0], s = padBbox[1], e = padBbox[2], n = padBbox[3];
  var rect = [
    lngLatToMerc([w, n]),
    lngLatToMerc([e, n]),
    lngLatToMerc([e, s]),
    lngLatToMerc([w, s]),
  ];

  var polyPos = clipToHalfPlane(rect, A, B, +1);
  var polyNeg = clipToHalfPlane(rect, A, B, -1);

  var primarySign = primarySignFor(A, B);
  var posIsPrimary = primarySign === 1;

  var inter = lineRectIntersections(A, B, rect);
  var dividerLine = inter.length >= 2 ? [inter[0], inter[1]] : null;

  return {
    primary: posIsPrimary ? polyPos : polyNeg,
    secondary: posIsPrimary ? polyNeg : polyPos,
    dividerLine: dividerLine,
    primarySign: primarySign,
    orientation: orientationFor(A, B),
    labels: LABELS[orientationFor(A, B)],
    A: A,
    B: B,
  };
}

// --- Stats --------------------------------------------------------------

// sides: array of 'primary' | 'secondary'. weights: parallel array of numbers.
function computeStats(sides, weights) {
  var acc = { primary: { weight: 0, count: 0 }, secondary: { weight: 0, count: 0 } };
  for (var i = 0; i < sides.length; i++) {
    var side = sides[i];
    if (side !== 'primary' && side !== 'secondary') continue;
    acc[side].weight += weights[i] || 0;
    acc[side].count += 1;
  }
  var totalWeight = acc.primary.weight + acc.secondary.weight;
  var totalCount = acc.primary.count + acc.secondary.count;
  var pct = function (w) { return totalWeight > 0 ? (100 * w) / totalWeight : 0; };
  return {
    primary: { weight: acc.primary.weight, count: acc.primary.count, pct: pct(acc.primary.weight) },
    secondary: { weight: acc.secondary.weight, count: acc.secondary.count, pct: pct(acc.secondary.weight) },
    totalWeight: totalWeight,
    totalCount: totalCount,
  };
}

// --- Hit testing --------------------------------------------------------

// Squared distance from P to the finite segment AB.
function distSqToSegment(P, A, B) {
  var vx = B[0] - A[0], vy = B[1] - A[1];
  var wx = P[0] - A[0], wy = P[1] - A[1];
  var len2 = vx * vx + vy * vy;
  var t = len2 > 0 ? (wx * vx + wy * vy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  var dx = P[0] - (A[0] + t * vx);
  var dy = P[1] - (A[1] + t * vy);
  return dx * dx + dy * dy;
}

// Endpoints win over the segment body when both are within range, so the
// grab zones around A and B are never swallowed by the line itself.
function hitTest(P, A, B, radius) {
  var r2 = radius * radius;
  var da = (P[0] - A[0]) * (P[0] - A[0]) + (P[1] - A[1]) * (P[1] - A[1]);
  var db = (P[0] - B[0]) * (P[0] - B[0]) + (P[1] - B[1]) * (P[1] - B[1]);
  if (da <= r2 || db <= r2) return da <= db ? 'a' : 'b';
  if (distSqToSegment(P, A, B) <= r2) return 'line';
  return null;
}

// Index of the closest point in `pts` to `P` within `radius`, or -1. Powers the
// hover tooltip: a single scan over the drawn points each frame, rather than a
// listener on every one of thousands of circles. `pts`, `P` and `radius` must
// share one coordinate space (the caller uses world units).
function nearestPoint(pts, P, radius) {
  var best = -1, bestD = radius * radius;
  for (var i = 0; i < pts.length; i++) {
    var dx = pts[i][0] - P[0], dy = pts[i][1] - P[1];
    var d = dx * dx + dy * dy;
    if (d <= bestD) { bestD = d; best = i; }
  }
  return best;
}

// --- Snapping -----------------------------------------------------------

// Reangle to exactly horizontal (constant latitude, an E–W divide) or
// vertical (constant longitude, an N–S divide), keeping the midpoint and
// roughly the length.
function snapEndpoints(a, b, orientation) {
  var mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  var half = Math.min(5, Math.max(2, Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
  if (orientation === 'horizontal') {
    return [[mid[0] - half, mid[1]], [mid[0] + half, mid[1]]];
  }
  return [[mid[0], mid[1] - half], [mid[0], mid[1] + half]];
}

// Given parallel arrays of scalar `values` (latitudes for a horizontal line,
// longitudes for a vertical one) and non-negative `weights`, return the
// coordinate at which a threshold divides the total weight into two halves as
// evenly as discrete weighted data allows — the weighted-median boundary.
//
// Classifying a point against a horizontal line depends only on whether its
// latitude sits above or below the line's, and latitude → Mercator-y is
// monotonic, so the exact-balance latitude is the weighted median of the
// points' latitudes. Longitude works the same for a vertical line.
//
// The one point that straddles the halfway mark must fall wholly on one side,
// so a perfect 50/50 is usually impossible. We try that pivot on each side and
// keep whichever leaves the smaller imbalance, then return the MIDPOINT between
// the two points the boundary passes between, so no point lands exactly on the
// line and the partition is unambiguous.
function balancePosition(values, weights) {
  var n = values.length;
  if (n === 0) return 0;
  var idx = [];
  for (var i = 0; i < n; i++) idx.push(i);
  idx.sort(function (p, q) { return values[p] - values[q]; });
  var sv = [], sw = [], total = 0;
  for (var j = 0; j < n; j++) {
    sv.push(values[idx[j]]);
    var w = Math.max(0, weights[idx[j]] || 0);
    sw.push(w);
    total += w;
  }
  // No weight to balance: fall back to the midpoint of the value range.
  if (total <= 0) return (sv[0] + sv[n - 1]) / 2;

  var half = total / 2;
  var cum = 0, k = 0;
  for (k = 0; k < n; k++) {
    cum += sw[k];
    if (cum >= half) break;
  }
  var cumBefore = cum - sw[k];               // weight strictly below the pivot
  var diffPivotAbove = Math.abs(total - 2 * cum);        // pivot on lower side
  var diffPivotBelow = Math.abs(total - 2 * cumBefore);  // pivot on upper side

  var span = sv[n - 1] - sv[0];
  var eps = (span > 0 ? span : Math.abs(sv[0]) || 1) * 1e-6;
  function nearestBelow(pos) {   // nearest value strictly below sv[pos]
    for (var m = pos - 1; m >= 0; m--) if (sv[m] < sv[pos]) return sv[m];
    return sv[pos] - eps;        // pos is at the minimum
  }
  function nearestAbove(pos) {   // nearest value strictly above sv[pos]
    for (var m = pos + 1; m < n; m++) if (sv[m] > sv[pos]) return sv[m];
    return sv[pos] + eps;        // pos is at the maximum
  }

  if (diffPivotBelow < diffPivotAbove) {
    return (nearestBelow(k) + sv[k]) / 2;    // boundary just below the pivot
  }
  return (sv[k] + nearestAbove(k)) / 2;      // boundary just above the pivot
}

// --- The data-source contract -------------------------------------------
//
//   { label, unit, render, getFeatures() -> Promise<{ coords, weights,
//                                                     groups?, groupNames? }> }
//
// `getFeatures` is a PROMISE in every source, including the ones whose data is
// already in memory. A file read and a fetch are asynchronous and a synthetic
// generator is not, but giving them different shapes would put a branch at
// every call site forever; one always-async contract costs one `.then`.
//
// `render` is a hint, not an instruction: 'points' | 'raster' | 'choropleth'.
// The SVG renderer treats them all as points today. It exists so a canvas
// renderer can be added later without changing any source.
// Provenance for the panel's Sources box. Whatever CONFIG (or a caller) hands
// over is untrusted shape: keep the entries that have a usable label, coerce a
// missing or blank url to null so the renderer's link-or-text branch is a plain
// null check, and give anything else an empty list. A malformed entry must not
// be able to blank the box or throw mid-render.
function normalizeSources(raw) {
  if (!raw || !raw.length) return [];
  var out = [];
  for (var i = 0; i < raw.length; i++) {
    var s = raw[i];
    if (!s) continue;
    var label = typeof s.label === 'string' ? s.label.trim() : '';
    if (!label) continue;
    var url = typeof s.url === 'string' ? s.url.trim() : '';
    out.push({ label: label, url: url || null });
  }
  return out;
}

function makeSource(spec) {
  var features = spec.features;
  return {
    label: spec.label,
    unit: spec.unit,
    render: spec.render || 'points',
    // Where the numbers came from; see normalizeSources.
    sources: normalizeSources(spec.sources),
    // Human-readable remarks about how the data was interpreted — columns
    // guessed, rows dropped, polygons reduced to centroids. Surfaced in the
    // panel, because silently guessing a weight column is how a plausible
    // wrong answer gets believed.
    notes: spec.notes || [],
    getFeatures: function () { return Promise.resolve(features); },
  };
}

// =========================================================================
// Data ingest
// =========================================================================
//
// Four input shapes, one output shape. Everything below turns a raw payload
// into `{ coords, weights, groups?, groupNames? }`, which means the geometry,
// the stats and the breakdown never learn what kind of file the numbers came
// from. Adding a fifth format means adding a parser here and nothing else.
//
// PARSING lives inside the PURE markers, so tests.html covers it. LOADING —
// FileReader, fetch, the file picker — does not, and lives in the interaction
// section below. Keep that split: it is the only reason this layer is testable.

// Header names seen in the wild, normalised. First match wins, so the most
// specific alias for each kind comes first.
var COLUMN_ALIASES = {
  lng: ['lng', 'lon', 'long', 'longitude', 'x'],
  lat: ['lat', 'latitude', 'y'],
  weight: ['weight', 'value', 'population', 'people', 'pop', 'count', 'total', 'amount', 'n'],
  group: ['group', 'category', 'region', 'name', 'area', 'label', 'class', 'type'],
};

// The mapping dialog's "— none —" choice. It must mean "explicitly no column",
// which is different from an absent override (that would fall back to alias
// auto-detection and re-pick the very column the user just declined). A null
// byte cannot collide with a real header or property name.
var NO_COLUMN = String.fromCharCode(0);

function normaliseHeader(s) {
  return String(s == null ? '' : s).trim().toLowerCase().replace(/[\s_.-]+/g, '');
}

// `headers` must already be normalised. Returns -1 when nothing matches.
function findColumn(headers, kind, override) {
  var i;
  if (override === NO_COLUMN) return -1; // "— none —": no column, no auto-detect
  if (override != null && override !== '') {
    var want = normaliseHeader(override);
    for (i = 0; i < headers.length; i++) if (headers[i] === want) return i;
    return -1;
  }
  var aliases = COLUMN_ALIASES[kind];
  for (var a = 0; a < aliases.length; a++) {
    for (i = 0; i < headers.length; i++) if (headers[i] === aliases[a]) return i;
  }
  return -1;
}

// Thousands separators are stripped, so "1,234" reads as 1234. The cost is
// that a European decimal comma ("1,5") reads as 15 — detectable only from
// context this parser does not have. Semicolon-delimited files are the usual
// carrier; if that turns up, pass an explicit converter rather than guessing.
function toNumber(v) {
  if (typeof v === 'number') return v;
  if (v == null) return NaN;
  var t = String(v).trim().replace(/[\s,]/g, '');
  if (t === '') return NaN;
  return Number(t);
}

// Mercator is undefined at the poles and the app clamps at ±85°, so a row
// outside that is a data error rather than a point that lands off-screen.
function isValidLngLat(lng, lat) {
  return isFinite(lng) && isFinite(lat) &&
    lng >= -180 && lng <= 180 && lat >= -85 && lat <= 85;
}

// Assigns each distinct label a stable integer index, in first-seen order.
// Groups are attributed AT PARSE TIME, never by nearest-neighbour afterwards
// — that is what makes the breakdown reconcile exactly with the card totals.
function makeGroupIndex() {
  var names = [];
  var byName = Object.create(null);
  return {
    names: names,
    idFor: function (raw) {
      var k = raw == null || raw === '' ? 'Unlabelled' : String(raw);
      if (byName[k] === undefined) { byName[k] = names.length; names.push(k); }
      return byName[k];
    },
  };
}

// A parse result carries its own notes so the caller does not have to
// reconstruct what happened.
function finishFeatures(coords, weights, group, skipped, notes) {
  if (!coords.length) {
    throw new Error('No usable rows: every record was missing or had an out-of-range coordinate.');
  }
  if (skipped > 0) {
    notes.push(skipped + ' record' + (skipped === 1 ? '' : 's') +
      ' skipped (missing or out-of-range coordinates).');
  }
  var out = { coords: coords, weights: weights, skipped: skipped, notes: notes };
  // groups/groupNames are optional in the contract; only attach them when the
  // input actually carried a categorical column worth breaking down by.
  if (group && group.names.length > 1) {
    out.groups = group.ids;
    out.groupNames = group.names;
  }
  return out;
}

// --- CSV / delimited text -----------------------------------------------

// Whichever of these splits the header line into the most fields.
function detectDelimiter(line) {
  var best = ',', bestN = -1;
  [',', ';', '\t', '|'].forEach(function (d) {
    var n = line.split(d).length;
    if (n > bestN) { bestN = n; best = d; }
  });
  return best;
}

// RFC4180-ish: quoted fields, doubled quotes inside them, LF or CRLF. Written
// out rather than split() because a quoted place name containing a comma
// ("Newcastle, Staffordshire") is common enough to break the naive version.
function parseDelimited(text, delim) {
  var rows = [], row = [], field = '', inQuotes = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    if (inQuotes) {
      if (ch !== '"') { field += ch; continue; }
      if (text.charAt(i + 1) === '"') { field += '"'; i++; continue; }
      inQuotes = false;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === delim) { row.push(field); field = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// opts: { lngColumn, latColumn, weightColumn, groupColumn, delimiter, unit }
function parseCsvText(text, opts) {
  opts = opts || {};
  var body = String(text).replace(/^﻿/, ''); // Excel writes a BOM
  var delim = opts.delimiter || detectDelimiter(body.split('\n')[0] || '');
  var rows = parseDelimited(body, delim);
  if (rows.length < 2) throw new Error('CSV needs a header row and at least one data row.');

  var raw = rows[0];
  var headers = raw.map(normaliseHeader);
  var iLng = findColumn(headers, 'lng', opts.lngColumn);
  var iLat = findColumn(headers, 'lat', opts.latColumn);
  if (iLng < 0 || iLat < 0) {
    throw new Error('CSV needs a longitude column (' + COLUMN_ALIASES.lng.join(', ') +
      ') and a latitude column (' + COLUMN_ALIASES.lat.join(', ') +
      '). Found: ' + raw.join(', ') + '.');
  }
  var iW = findColumn(headers, 'weight', opts.weightColumn);
  var iG = findColumn(headers, 'group', opts.groupColumn);

  var notes = [];
  if (iW < 0) notes.push('No weight column found — every record counts as 1.');
  else if (!opts.weightColumn) notes.push('Weighting by the "' + raw[iW].trim() + '" column.');
  if (iG >= 0) notes.push('Grouping by the "' + raw[iG].trim() + '" column.');

  var coords = [], weights = [], group = makeGroupIndex();
  group.ids = [];
  var skipped = 0;
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    if (row.length === 1 && row[0].trim() === '') continue; // trailing blank line
    var lng = toNumber(row[iLng]);
    var lat = toNumber(row[iLat]);
    if (!isValidLngLat(lng, lat)) { skipped++; continue; }
    var w = iW < 0 ? 1 : toNumber(row[iW]);
    if (!isFinite(w)) w = 0;
    coords.push([lng, lat]);
    weights.push(w);
    group.ids.push(iG < 0 ? 0 : group.idFor(row[iG]));
  }
  var res = finishFeatures(coords, weights, iG < 0 ? null : group, skipped, notes);
  res.unit = opts.unit || (iW >= 0 ? raw[iW].trim() : 'records');
  return res;
}

// Lists a delimited file's header names and the column the alias logic would
// pick for each role — WITHOUT parsing the body — so the loader can offer them
// in the mapping dialog, pre-selected, before committing to a full parse.
function describeCsvFields(text, opts) {
  opts = opts || {};
  var firstLine = String(text).replace(/^﻿/, '').split('\n')[0] || '';
  var delim = opts.delimiter || detectDelimiter(firstLine);
  var raw = (parseDelimited(firstLine, delim)[0] || []).map(function (h) {
    return String(h).trim();
  });
  var headers = raw.map(normaliseHeader);
  var pick = function (kind) {
    var idx = findColumn(headers, kind, null);
    return idx >= 0 ? raw[idx] : null;
  };
  return {
    fields: raw,
    guesses: { lng: pick('lng'), lat: pick('lat'), weight: pick('weight'), group: pick('group') },
  };
}

// --- GeoJSON ------------------------------------------------------------

function geoJsonFeatures(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('Not GeoJSON.');
  if (Array.isArray(obj)) return obj;
  if (obj.type === 'FeatureCollection') return obj.features || [];
  if (obj.type === 'Feature') return [obj];
  if (obj.type && obj.coordinates) return [{ type: 'Feature', geometry: obj, properties: {} }];
  throw new Error('Not GeoJSON: expected a FeatureCollection, Feature or geometry.');
}

// Property names are per-feature rather than a fixed header row, so sample the
// first 50 features to build the candidate list. `numericOnly` keeps a "name"
// property from being picked as the weight.
function pickProperty(features, kind, override, numericOnly) {
  if (override === NO_COLUMN) return null; // "— none —": no property, no auto-detect
  if (override) return override;
  var keys = [];
  for (var i = 0; i < features.length && i < 50; i++) {
    var p = features[i] && features[i].properties;
    if (!p) continue;
    for (var k in p) {
      if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
      if (numericOnly && !isFinite(toNumber(p[k]))) continue;
      if (keys.indexOf(k) < 0) keys.push(k);
    }
  }
  var idx = findColumn(keys.map(normaliseHeader), kind, null);
  return idx >= 0 ? keys[idx] : null;
}

function readProps(features, opts) {
  var weightProp = pickProperty(features, 'weight', opts.weightProperty, true);
  var groupProp = pickProperty(features, 'group', opts.groupProperty, false);
  var notes = [];
  if (!weightProp) notes.push('No numeric weight property found — every feature counts as 1.');
  else if (!opts.weightProperty) notes.push('Weighting by the "' + weightProp + '" property.');
  if (groupProp) notes.push('Grouping by the "' + groupProp + '" property.');
  return { weightProp: weightProp, groupProp: groupProp, notes: notes };
}

// The GeoJSON analogue of describeCsvFields: the property keys seen across the
// first 50 features, plus the value/group the alias logic would pick. Longitude
// and latitude are structural in GeoJSON geometry, so they are not offered.
function describeGeojsonFields(obj, opts) {
  opts = opts || {};
  var features = geoJsonFeatures(obj);
  var fields = [];
  for (var i = 0; i < features.length && i < 50; i++) {
    var p = features[i] && features[i].properties;
    if (!p) continue;
    for (var k in p) {
      if (Object.prototype.hasOwnProperty.call(p, k) && fields.indexOf(k) < 0) fields.push(k);
    }
  }
  return {
    fields: fields,
    guesses: {
      weight: pickProperty(features, 'weight', null, true),
      group: pickProperty(features, 'group', null, false),
    },
  };
}

// opts: { weightProperty, groupProperty, unit }
function parseGeoJsonPoints(obj, opts) {
  opts = opts || {};
  var features = geoJsonFeatures(obj);
  var meta = readProps(features, opts);
  var coords = [], weights = [], group = makeGroupIndex();
  group.ids = [];
  var skipped = 0;

  for (var i = 0; i < features.length; i++) {
    var f = features[i] || {};
    var g = f.geometry;
    if (!g) { skipped++; continue; }
    var props = f.properties || {};
    var w = meta.weightProp ? toNumber(props[meta.weightProp]) : 1;
    if (!isFinite(w)) w = 0;
    var gid = meta.groupProp ? group.idFor(props[meta.groupProp]) : 0;

    var positions;
    if (g.type === 'Point') positions = [g.coordinates];
    else if (g.type === 'MultiPoint') positions = g.coordinates || [];
    else { skipped++; continue; }

    // A MultiPoint is one record with one weight; splitting it evenly keeps
    // the collection's total intact, which is what the percentages depend on.
    var share = positions.length ? w / positions.length : 0;
    var used = 0;
    for (var p = 0; p < positions.length; p++) {
      var c = positions[p] || [];
      if (!isValidLngLat(toNumber(c[0]), toNumber(c[1]))) continue;
      coords.push([toNumber(c[0]), toNumber(c[1])]);
      weights.push(share);
      group.ids.push(gid);
      used++;
    }
    if (!used) skipped++;
  }

  var res = finishFeatures(coords, weights, meta.groupProp ? group : null, skipped,
    meta.notes);
  res.unit = opts.unit || (meta.weightProp || 'features');
  return res;
}

// --- GeoJSON polygons ---------------------------------------------------
//
// A polygon crossed by the divider genuinely lies on both sides, so reducing
// it to one point is an approximation and is labelled as one. The area-
// weighted centroid is computed in MERCATOR — the same space the split is
// computed in — so the representative point is consistent with the
// classification that will be applied to it.
//
// Two known limits, both of which matter more the larger the units are:
//   * the centroid of a concave shape can fall outside it (a crescent-shaped
//     council area, a firth), and
//   * a straddled polygon is counted wholly on one side.
// With ~35k LSOAs that is noise. With 48 counties it is visible. The fix is
// area-weighted splitting — clip each ring to each half-plane and apportion by
// area — for which `clipToHalfPlane` above is already the right tool, since
// Sutherland–Hodgman needs only the CLIP region to be convex and a half-plane
// is. That is deliberately left for later.

// Signed area and area-weighted centroid of one ring, in Mercator units.
function ringCentroid(mercRing) {
  var n = mercRing.length;
  // Tolerate both closed and open rings.
  if (n > 1 && mercRing[0][0] === mercRing[n - 1][0] && mercRing[0][1] === mercRing[n - 1][1]) n--;
  if (n < 1) return null;
  var a2 = 0, cx = 0, cy = 0, i, p, q;
  for (i = 0; i < n; i++) {
    p = mercRing[i];
    q = mercRing[(i + 1) % n];
    var cross = p[0] * q[1] - q[0] * p[1];
    a2 += cross;
    cx += (p[0] + q[0]) * cross;
    cy += (p[1] + q[1]) * cross;
  }
  // A degenerate ring (collinear, or a single repeated vertex) has zero area
  // and the centroid formula divides by it. Fall back to the vertex mean.
  if (a2 === 0) {
    var mx = 0, my = 0;
    for (i = 0; i < n; i++) { mx += mercRing[i][0]; my += mercRing[i][1]; }
    return { x: mx / n, y: my / n, area: 0 };
  }
  return { x: cx / (3 * a2), y: cy / (3 * a2), area: Math.abs(a2 / 2) };
}

// Holes are subtracted from the outer ring, both from the area and from the
// first moment, which is what keeps a ring-shaped feature's centroid honest.
function polygonCentroid(mercRings) {
  if (!mercRings || !mercRings.length) return null;
  var outer = ringCentroid(mercRings[0]);
  if (!outer) return null;
  var ax = outer.area * outer.x, ay = outer.area * outer.y, at = outer.area;
  for (var h = 1; h < mercRings.length; h++) {
    var hole = ringCentroid(mercRings[h]);
    if (!hole) continue;
    ax -= hole.area * hole.x;
    ay -= hole.area * hole.y;
    at -= hole.area;
  }
  if (at <= 0) return outer; // holes swallowed the shape; outer ring is the best guess
  return { x: ax / at, y: ay / at, area: at };
}

function toMercRings(rings) {
  var out = [];
  for (var i = 0; i < rings.length; i++) {
    var ring = rings[i] || [];
    var m = [];
    for (var j = 0; j < ring.length; j++) {
      var c = ring[j] || [];
      var lng = toNumber(c[0]), lat = toNumber(c[1]);
      if (!isValidLngLat(lng, lat)) continue;
      m.push(lngLatToMerc([lng, lat]));
    }
    if (m.length) out.push(m);
  }
  return out;
}

// opts: { weightProperty, groupProperty, unit }
function parseGeoJsonPolygons(obj, opts) {
  opts = opts || {};
  var features = geoJsonFeatures(obj);
  var meta = readProps(features, opts);
  var coords = [], weights = [], group = makeGroupIndex();
  group.ids = [];
  var skipped = 0;

  for (var i = 0; i < features.length; i++) {
    var f = features[i] || {};
    var g = f.geometry;
    if (!g) { skipped++; continue; }
    var props = f.properties || {};
    var w = meta.weightProp ? toNumber(props[meta.weightProp]) : 1;
    if (!isFinite(w)) w = 0;

    var parts;
    if (g.type === 'Polygon') parts = [g.coordinates || []];
    else if (g.type === 'MultiPolygon') parts = g.coordinates || [];
    else { skipped++; continue; }

    // Combine the parts of a MultiPolygon by area, so a mainland-plus-islands
    // authority is represented by a point near the mainland rather than out at
    // sea halfway to the islands.
    var ax = 0, ay = 0, at = 0, fallback = null;
    for (var p = 0; p < parts.length; p++) {
      var c = polygonCentroid(toMercRings(parts[p]));
      if (!c) continue;
      if (!fallback) fallback = c;
      ax += c.x * c.area; ay += c.y * c.area; at += c.area;
    }
    var pt = at > 0 ? { x: ax / at, y: ay / at } : fallback;
    if (!pt) { skipped++; continue; }

    var ll = mercToLngLat([pt.x, pt.y]);
    if (!isValidLngLat(ll[0], ll[1])) { skipped++; continue; }
    coords.push(ll);
    weights.push(w);
    group.ids.push(meta.groupProp ? group.idFor(props[meta.groupProp]) : 0);
  }

  meta.notes.unshift('Each polygon is reduced to its area-weighted centroid, ' +
    'so a unit the divider crosses counts wholly on one side.');
  var res = finishFeatures(coords, weights, meta.groupProp ? group : null, skipped,
    meta.notes);
  res.unit = opts.unit || (meta.weightProp || 'areas');
  return res;
}

// --- Gridded data -------------------------------------------------------
//
// A grid cell IS a point: its centre carries the cell's value as a weight. No
// approximation is involved as long as the cells are small relative to the
// country, and an equal-area grid is arguably the most honest input this app
// can take, because every weight then covers the same amount of ground.

// Row-major from the NORTH-WEST corner, which is the convention both formats
// below use. `values` may contain null / NaN / a nodata sentinel for gaps.
function gridToFeatures(spec, opts) {
  opts = opts || {};
  var cols = spec.cols, rows = spec.rows;
  if (!(cols > 0 && rows > 0)) throw new Error('Grid needs positive cols and rows.');
  var values = spec.values || [];
  if (values.length !== cols * rows) {
    throw new Error('Grid has ' + values.length + ' values but cols×rows = ' + cols * rows + '.');
  }
  var west = spec.west, north = spec.north;
  var cellLng = spec.cellLng, cellLat = spec.cellLat;
  var nodata = spec.nodata;

  var coords = [], weights = [];
  var skipped = 0, gaps = 0;
  for (var r = 0; r < rows; r++) {
    var lat = north - (r + 0.5) * cellLat;
    for (var c = 0; c < cols; c++) {
      var v = toNumber(values[r * cols + c]);
      // A no-data sentinel and a zero are both "nothing here". They are
      // counted separately from `skipped`, which means a BROKEN cell — the
      // two must not be reported with the same wording, or a grid whose
      // projection is wrong looks identical to one that is merely sparse.
      if (!isFinite(v) || (nodata != null && v === nodata) || v === 0) { gaps++; continue; }
      var lng = west + (c + 0.5) * cellLng;
      if (!isValidLngLat(lng, lat)) { skipped++; continue; }
      coords.push([lng, lat]);
      weights.push(v);
    }
  }
  var notes = [cols + '×' + rows + ' grid, cell centres used as points.'];
  if (gaps) notes.push(gaps + ' empty cells (zero or no-data) omitted.');
  var res = finishFeatures(coords, weights, null, skipped, notes);
  res.unit = opts.unit || 'value';
  return res;
}

// { west, north, cellLng, cellLat, cols, rows, values[, nodata] }
// or { bbox: [w, s, e, n], cols, rows, values[, nodata] }
function parseGridJson(obj, opts) {
  if (!obj || typeof obj !== 'object') throw new Error('Not a grid object.');
  var cols = obj.cols || obj.ncols || obj.width;
  var rows = obj.rows || obj.nrows || obj.height;
  var spec = { cols: cols, rows: rows, values: obj.values || obj.data, nodata: obj.nodata };
  if (obj.bbox && obj.bbox.length === 4) {
    spec.west = toNumber(obj.bbox[0]);
    spec.north = toNumber(obj.bbox[3]);
    spec.cellLng = (toNumber(obj.bbox[2]) - spec.west) / cols;
    spec.cellLat = (spec.north - toNumber(obj.bbox[1])) / rows;
  } else {
    spec.west = toNumber(obj.west !== undefined ? obj.west : (obj.origin || [])[0]);
    spec.north = toNumber(obj.north !== undefined ? obj.north : (obj.origin || [])[1]);
    spec.cellLng = toNumber(obj.cellLng !== undefined ? obj.cellLng : obj.cellSize);
    spec.cellLat = toNumber(obj.cellLat !== undefined ? obj.cellLat : obj.cellSize);
  }
  if (!isFinite(spec.west) || !isFinite(spec.north) || !isFinite(spec.cellLng) || !isFinite(spec.cellLat)) {
    throw new Error('Grid needs either a bbox, or west/north plus cell sizes.');
  }
  return gridToFeatures(spec, opts);
}

// ESRI ASCII grid (.asc) — six header lines then whitespace-separated values.
// Worth supporting because it is what most published raster extracts arrive
// as, and it needs no library. NOTE: the coordinates must already be in
// degrees; a British National Grid .asc will parse and land in the Atlantic.
function parseAsciiGrid(text, opts) {
  var tokens = String(text).trim().split(/\s+/);
  var head = {}, i = 0;
  var KEYS = ['ncols', 'nrows', 'xllcorner', 'xllcenter', 'yllcorner', 'yllcenter',
              'cellsize', 'nodata_value'];
  while (i < tokens.length - 1 && KEYS.indexOf(String(tokens[i]).toLowerCase()) >= 0) {
    head[String(tokens[i]).toLowerCase()] = toNumber(tokens[i + 1]);
    i += 2;
  }
  var cols = head.ncols, rows = head.nrows, cell = head.cellsize;
  if (!(cols > 0 && rows > 0 && isFinite(cell))) {
    throw new Error('ASCII grid needs ncols, nrows and cellsize in its header.');
  }
  // xllcenter refers to the centre of the corner cell rather than its corner.
  var west = head.xllcorner !== undefined ? head.xllcorner : head.xllcenter - cell / 2;
  var southEdge = head.yllcorner !== undefined ? head.yllcorner : head.yllcenter - cell / 2;
  if (!isFinite(west) || !isFinite(southEdge)) {
    throw new Error('ASCII grid needs xllcorner/yllcorner (or xllcenter/yllcenter).');
  }
  return gridToFeatures({
    cols: cols, rows: rows, cellLng: cell, cellLat: cell,
    west: west, north: southEdge + rows * cell,
    values: tokens.slice(i),
    nodata: head.nodata_value !== undefined ? head.nodata_value : -9999,
  }, opts);
}

// --- Source factories ---------------------------------------------------
// Thin wrappers: parse, then hand the result to `makeSource`. They exist so a
// caller can name the shape it has rather than reaching for a parser.

function labelFromName(name) {
  return String(name || 'dataset').replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '');
}

function sourceFrom(parsed, opts, render) {
  opts = opts || {};
  return makeSource({
    label: opts.label || parsed.label || 'dataset',
    unit: opts.unit || parsed.unit || 'value',
    render: render,
    notes: parsed.notes,
    sources: opts.sources,
    features: parsed,
  });
}

function createCsvSource(text, opts) {
  return sourceFrom(parseCsvText(text, opts), opts, 'points');
}
function createGeoJsonPointSource(obj, opts) {
  return sourceFrom(parseGeoJsonPoints(obj, opts), opts, 'points');
}
function createPolygonSource(obj, opts) {
  return sourceFrom(parseGeoJsonPolygons(obj, opts), opts, 'choropleth');
}
function createGridSource(input, opts) {
  var parsed = typeof input === 'string'
    ? (String(input).trim().toLowerCase().indexOf('ncols') === 0
        ? parseAsciiGrid(input, opts)
        : parseGridJson(JSON.parse(input), opts))
    : parseGridJson(input, opts);
  return sourceFrom(parsed, opts, 'raster');
}

// --- Sniffing -----------------------------------------------------------

// Returns one of 'csv' | 'geojson-points' | 'geojson-polygons' | 'grid-json'
// | 'ascii-grid'. The filename is a hint; the content decides.
function detectSourceType(name, text) {
  var lower = String(name || '').toLowerCase();
  var head = String(text).slice(0, 4096).replace(/^﻿/, '').trim();
  if (/\.asc$/.test(lower) || /^ncols\s/i.test(head)) return 'ascii-grid';
  if (head.charAt(0) === '{' || head.charAt(0) === '[') {
    var obj;
    try { obj = JSON.parse(text); } catch (e) { throw new Error('File looks like JSON but will not parse: ' + e.message); }
    if (obj && (obj.values || obj.data) && (obj.cols || obj.ncols || obj.width)) return 'grid-json';
    var feats = geoJsonFeatures(obj);
    for (var i = 0; i < feats.length; i++) {
      var g = feats[i] && feats[i].geometry;
      if (!g) continue;
      if (g.type === 'Polygon' || g.type === 'MultiPolygon') return 'geojson-polygons';
      if (g.type === 'Point' || g.type === 'MultiPoint') return 'geojson-points';
    }
    throw new Error('GeoJSON contains no Point, MultiPoint, Polygon or MultiPolygon geometries.');
  }
  return 'csv';
}

// The single entry point for "here is a file's text, give me a source".
// `opts.type` skips sniffing.
function createSourceFromText(name, text, opts) {
  opts = opts || {};
  var type = opts.type || detectSourceType(name, text);
  var withLabel = {};
  for (var k in opts) if (Object.prototype.hasOwnProperty.call(opts, k)) withLabel[k] = opts[k];
  if (!withLabel.label) withLabel.label = labelFromName(name);

  switch (type) {
    case 'csv': return createCsvSource(text, withLabel);
    case 'geojson-points': return createGeoJsonPointSource(JSON.parse(text), withLabel);
    case 'geojson-polygons': return createPolygonSource(JSON.parse(text), withLabel);
    case 'grid-json': return createGridSource(JSON.parse(text), withLabel);
    case 'ascii-grid': return createGridSource(text, withLabel);
    default: throw new Error('Unknown dataset type "' + type + '".');
  }
}

// --- Synthetic data source ---------------------------------------------
// The reference implementation of the contract, and the default source.

// [lng, lat, relativeWeight, name]
var CITIES = [
  [-0.1278, 51.5074, 9000, 'London'],
  [-1.8904, 52.4862, 2600, 'Birmingham'],
  [-2.2426, 53.4808, 2700, 'Manchester'],
  [-1.5491, 53.8008, 1900, 'Leeds'],
  [-4.2518, 55.8642, 1800, 'Glasgow'],
  [-3.1883, 55.9533, 900, 'Edinburgh'],
  [-2.9916, 53.4084, 1400, 'Liverpool'],
  [-2.5879, 51.4545, 1100, 'Bristol'],
  [-1.6178, 54.9783, 1100, 'Newcastle'],
  [-1.4701, 53.3811, 1200, 'Sheffield'],
  [-3.1791, 51.4816, 900, 'Cardiff'],
  [-5.9301, 54.5973, 900, 'Belfast'],
  [-1.1398, 52.6369, 700, 'Leicester'],
  [-1.2577, 51.752, 500, 'Oxford'],
  [1.2974, 52.6309, 450, 'Norwich'],
  [-3.5339, 50.7184, 450, 'Exeter'],
  [-2.1043, 57.1497, 500, 'Aberdeen'],
  [-4.1427, 50.3755, 500, 'Plymouth'],
  [-1.4043, 50.9097, 600, 'Southampton'],
  [-2.9784, 54.8951, 220, 'Carlisle'],
  [-4.6292, 55.4586, 300, 'Ayrshire'],
  [-3.9, 57.6, 180, 'Highlands'],
];

// Deterministic pseudo-random (mulberry32).
function makeRng(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box–Muller normal.
function gaussian(rng) {
  var u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function createSyntheticSource(opts) {
  opts = opts || {};
  var count = opts.count === undefined ? 3500 : opts.count;
  var seed = opts.seed === undefined ? 42 : opts.seed;
  var rng = makeRng(seed);
  var totalCityWeight = 0;
  for (var c = 0; c < CITIES.length; c++) totalCityWeight += CITIES[c][2];

  // Each point records the cluster that generated it. Attributing at synthesis
  // time (rather than re-deriving by nearest-city afterwards) means the
  // breakdown reconciles exactly with the totals instead of approximating them.
  var groupNames = CITIES.map(function (c) { return c[3]; }).concat(['Rural scatter']);
  var RURAL = groupNames.length - 1;

  var coords = [];
  var weights = [];
  var groups = [];
  for (var i = 0; i < count; i++) {
    // 85% of points cluster around cities (weighted by size); 15% scatter
    // as a sparse rural background across GB.
    var lng, lat, weight, group;
    if (rng() < 0.85) {
      var r = rng() * totalCityWeight;
      var ci = 0;
      for (var j = 0; j < CITIES.length; j++) {
        r -= CITIES[j][2];
        if (r <= 0) { ci = j; break; }
      }
      var city = CITIES[ci];
      var spread = 0.12 + 0.18 * (city[2] / 9000); // bigger cities spread more
      lng = city[0] + gaussian(rng) * spread;
      lat = city[1] + gaussian(rng) * spread * 0.6;
      weight = 400 + Math.abs(gaussian(rng)) * 1200;
      group = ci;
    } else {
      lng = -7 + rng() * 8.5; // roughly GB longitudes
      lat = 50 + rng() * 8.5; // roughly GB latitudes
      weight = 50 + rng() * 300;
      group = RURAL;
    }
    coords.push([lng, lat]);
    weights.push(Math.round(weight));
    groups.push(group);
  }

  return makeSource({
    label: 'population (synthetic)',
    unit: 'people',
    render: 'points',
    sources: opts.sources,
    // `groups`/`groupNames` are OPTIONAL in the data-source contract. A source
    // without them still works; the breakdown box just hides itself.
    features: { coords: coords, weights: weights, groups: groups, groupNames: groupNames },
  });
}

// --- Contribution breakdown ---------------------------------------------

// For each side, which clusters contribute the most weight TO THAT SIDE?
//
// A cluster the divider passes through contributes to both sides and so appears
// in both columns, with `split: true` so the UI can mark it — otherwise the same
// name showing up twice looks like a bug rather than the most interesting fact
// on the panel.
//
// Returns { primary, secondary } where each is
//   { rows: [{ name, weight, split }], moreCount, moreWeight }
function summariseContributors(sides, weights, groups, groupNames, limit) {
  limit = limit || 5;
  var acc = [];
  for (var g = 0; g < groupNames.length; g++) acc.push({ primary: 0, secondary: 0 });
  for (var i = 0; i < sides.length; i++) {
    var g2 = groups[i];
    if (g2 === undefined || !acc[g2]) continue;
    acc[g2][sides[i]] += weights[i] || 0;
  }

  function column(side) {
    var rows = [];
    for (var g = 0; g < acc.length; g++) {
      if (acc[g][side] <= 0) continue;
      rows.push({
        name: groupNames[g],
        weight: acc[g][side],
        split: acc[g].primary > 0 && acc[g].secondary > 0,
      });
    }
    rows.sort(function (a, b) { return b.weight - a.weight; });
    var head = rows.slice(0, limit);
    var tail = rows.slice(limit);
    var moreWeight = 0;
    for (var t = 0; t < tail.length; t++) moreWeight += tail[t].weight;
    return { rows: head, moreCount: tail.length, moreWeight: moreWeight };
  }

  return { primary: column('primary'), secondary: column('secondary') };
}

// --- the daily game -----------------------------------------------------
//
// One puzzle a day: a fixed axis, one target share, three statistics. You get
// ONE committed guess per statistic — no retries.
//
// Retries were tried and removed. The quantity being guessed is monotonic and
// smooth (slide the line north, the northern share falls, continuously), so a
// guess that reports its own signed error hands over almost complete
// information and the next guess is linear interpolation. That is binary
// search, not deduction — it converges in two steps whatever the tolerance,
// which is why no amount of tuning saved the five-guess format.
//
// The axis is FIXED by the puzzle and the line only slides along its normal.
// That is what makes the answer unique: one degree of freedom, one correct
// offset, and therefore a real distance to report ("38 km too far north").
// A free angle would put infinitely many valid lines at every target and
// destroy the payoff.
//
// All pure: a round's grade depends only on the numbers. The controller near
// the end of the file owns localStorage, the clipboard and the buttons.

var GAME = {
  // Day 1. dayNumber() counts UTC days from here, so the puzzle rolls over at
  // midnight UTC for every player at the same instant.
  epoch: '2026-08-25',
  // GRADING IS BY DISTANCE, NOT BY PERCENTAGE POINTS — measured, not guessed.
  // One pixel of drag moves the achieved share by 2.3–4.2 percentage points on
  // this data (the derivative is huge wherever the population is dense), so a
  // half-point tolerance would need a quarter-pixel of precision and the whole
  // 0–10 point scoring range spanned about three pixels of movement. Every
  // score came out zero. Distance is what the player actually controls: it is
  // linear in pixels (~2.4 km/px at this map size), so the gradient is smooth
  // and a careful drag is rewarded. The achieved percentage is still what gets
  // reported — it is the interesting fact — it just is not what is scored.
  bullseyeKm: 10,     // ~4 px: tight, but reachable, and trivial with arrow keys
  zeroAtKm: 250,      // ~105 px of gradient; a quarter of the country
  maxPoints: 1000,
  shareUrl: 'https://puntofisso.net/MapSplit/Play/',

  // Pro's percentage when the puzzle list does not name one — which is the
  // normal case, because the list is authored as "which statistic, which
  // axis" and nobody should have to think in percentages to write a day.
  //
  // Picked deterministically from the day, so every player gets the same one.
  // The bands are MEASURED, not chosen: the three statistics have to resolve
  // to lines further apart than bullseyeKm, and W/E is far less forgiving than
  // N/S on this data (see the table on `puzzles`). A percentage outside these
  // bands is not wrong so much as likely to make a round free.
  //
  // `diag` covers EVERY bearing, because a band per angle is a promise the
  // data cannot keep. [45,50,55] is the measured intersection of what is safe
  // across the diagonals worth authoring — narrow on purpose, since a blank
  // target on a hand-written diagonal row has to land somewhere defensible.
  proTargets: {
    ns: [30, 35, 40, 45],
    we: [45, 50, 55, 60],
    diag: [45, 50, 55],
    'default': [40, 45, 50, 55],
  },

  // The puzzle table, one row per day starting at `epoch`.
  //
  // THIS IS THE SEAM THE 30-DAY CSV FILLS: date order, one row each, columns
  // axis / target / three stat names. Assign the parsed rows here and nothing
  // else changes. Indexing wraps with %, so a short table (like today's single
  // sample) still yields a puzzle on every date rather than running out.
  //
  // `axis` takes 'ns', 'we', or a bearing in degrees — 45 is the NW–SE
  // diagonal. Sliding is one-dimensional at any angle, so a diagonal day needs
  // no new code path. PRO PLAYS THE BEARING AS WRITTEN; NORMAL SNAPS IT to the
  // nearest cardinal, so every diagonal row has to be safe on two axes.
  // TARGET CHOICE IS NOT COSMETIC. The three statistics must disagree by more
  // than a bullseye or the format collapses: at 70% their answers on this data
  // sit 9 km apart — inside bullseyeKm — so a player could nail round 1, not
  // move, and collect three bullseyes. Measured spread by target:
  //   20% 44km · 30% 87km · 40% 87km · 50% 83km · 60% 25km · 70% 9km · 80% 6km
  // The middle of the range is where population, tax and self-employment
  // genuinely diverge; the extremes all collapse onto London. There is a test
  // asserting the shipped table keeps its statistics further apart than
  // bullseyeKm — run it after editing the puzzle CSV.
  //
  // THE TARGET IS PER AXIS, NOT GLOBAL. West/East is far less forgiving than
  // North/South on this data — the country is only ~500 km wide and the
  // population is not laid out along that axis the way it is along the other.
  // Minimum pairwise gap between the three statistics, measured:
  //
  //   target   25%   30%   35%   40%   45%   50%   55%   60%   65%   70%
  //   N/S       20    43    30    43    46    25    15     6     5     4  km
  //   W/E        7     6     9     7    17    15    21    21    12     5  km
  //
  // 40% is the best of a wide plateau for N/S and *inside the 10 km bullseye*
  // for W/E. 55% is W/E's best. Copying a target across axes is the trap here.
  // Normal mode forces 50% on every row regardless, which is 25 km on N/S and
  // 15 km on W/E — both clear, but W/E is the thinnest thing shipping and the
  // first to re-measure when the data changes.
  //
  // DIAGONALS ARE NOT A UNIFORM SWEEP BETWEEN THE TWO. Same trio, same method:
  //
  //   target    25%   30%   35%   40%   45%   50%   55%   60%   65%   70%
  //    45°       11    12     9     7     7     5     2     0     0     0  km
  //    60°        5     2     3     1     0     0     2     1     2     1  km
  //   120°       15    18    27    17    20    36    46    31    14     8  km
  //   135°       18    41    32    26    37    39    47    28    15     9  km
  //
  // 45–60° is DEAD and 120–135° is the richest axis in the table — better than
  // N/S at its best. That is a fact about Britain, not about the code: the
  // population spine runs London–Birmingham–Manchester–Glasgow, roughly NW–SE,
  // and a line at 45° lies ALONG it, so population, tax and self-employment
  // all resolve to nearly the same line. The perpendicular cuts across every
  // city in turn and separates them maximally. Expect the dead angle to sit
  // somewhere else entirely in another country — measure, never assume.
  puzzles: [
    { axis: 'ns', target: 40,
      stats: ['Population (LA 🇬🇧)', 'HMRC 🇬🇧 Tax Amount', 'HMRC 🇬🇧 Self-Employed'] },
    { axis: 'we', target: 55,
      stats: ['Population (LA 🇬🇧)', 'HMRC 🇬🇧 Tax Amount', 'HMRC 🇬🇧 Self-Employed'] },
    // Pro plays this at 135°/55% (47 km apart); Normal snaps it to N/S at
    // 50% (25 km). Safe on both, which is what a diagonal row has to be.
    { axis: '135', target: 55,
      stats: ['Population (LA 🇬🇧)', 'HMRC 🇬🇧 Tax Amount', 'HMRC 🇬🇧 Self-Employed'] },
  ],
};

// --- regions -------------------------------------------------------------
// Which map is in play. Each region owns a coastline file (data/coast/<id>.js,
// built by tools/prep_regions.py) carrying its own origin, viewBox, bboxes and
// default line, and its own puzzle table.
//
// `puzzles` is the ONLY thing that decides whether a region is playable, so the
// two can never drift apart: data/samples/ holds UK statistics and nothing
// else, so every other region has an empty table, puzzleForDate() returns null
// for it, and the page shows the map alone. Add a table and that region is
// playable — there is no second flag to remember to flip.
var REGIONS = [
  // `puzzleUrl` is the authored day-by-day list. `puzzles` is the fallback
  // baked into the code: it plays if the region declares no file, and it is
  // what the tests measure against. The file wins whenever it loads.
  // `gamesUrl` + `statsUrl` (the yearly schedule and the statistics catalogue
  // built by tools/pipeline/) supersede `puzzleUrl` (the hand-authored CSV)
  // whenever both are declared; the CSV path is kept for the tests and as
  // the record of how the first season was authored.
  { id: 'uk',    label: 'United Kingdom', flag: '🇬🇧', puzzles: GAME.puzzles,
    puzzleUrl: '../data/puzzles.csv',
    gamesUrl: '../data/games/', statsUrl: '../data/stats.json', dataBase: '../data/' },
  { id: 'eu',    label: 'European Union', flag: '🇪🇺', puzzles: [] },
  { id: 'us',    label: 'United States',  flag: '🇺🇸', puzzles: [] },
  { id: 'world', label: 'World',          flag: '🌍',           puzzles: [] },
];

// Regions and modes are both "a list of things with ids, one of which is
// chosen", so they share these two rather than having a copy each.
function findById(list, id) {
  for (var i = 0; i < (list || []).length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
}

// The choice to open with: an explicit URL parameter wins (so a shared link
// lands on the right map and the right mode), then whatever was chosen last,
// then the first in the list. An unknown id in either falls through rather
// than blanking the page.
function resolveChoice(list, urlId, savedId) {
  if (findById(list, urlId)) return urlId;
  if (findById(list, savedId)) return savedId;
  return (list && list.length) ? list[0].id : null;
}

// --- difficulty ----------------------------------------------------------
// Normal always asks for the halfway line; Pro asks for whatever split the
// day's puzzle names. `target: null` means "use the row's own", so the mode
// table stays a pure statement of what the mode IS and puzzleForDate does the
// overriding — nothing has to rewrite the puzzle table per mode.
//
// Normal is first, and therefore the default: 50/50 is the question the map
// makes you want to answer, and the arbitrary-percentage version is the
// acquired taste.
var MODES = [
  { id: 'normal', label: 'Normal', target: 50, snapAxis: true,
    blurb: 'Always the 50/50 line, level or upright.' },
  // HIDDEN (2026-10-06): the yearly schedules are generated and validated for
  // Normal only. The mode, its store key and its tests stay; it simply is not
  // offered, and a saved or linked 'pro' falls back to Normal.
  { id: 'pro', label: 'Pro', target: null, snapAxis: false, hidden: true,
    blurb: 'Whatever split the day names, at whatever angle.' },
];

function isPlayableRegion(region) {
  return !!(region && ((region.puzzles && region.puzzles.length) ||
                       region.puzzleUrl || region.gamesUrl));
}

// One localStorage key per region AND mode, so a player can have a day in
// progress on each combination — the same day scored against 50% and against
// the day's own target are different games and must not share a store.
//
// UK + Pro keeps the ORIGINAL flat key. Everything saved under it was played
// at the puzzle table's own target, which is precisely what Pro means, so that
// is the honest mapping rather than a convenient one. Re-keying uniformly
// would orphan every existing player's history. (v1 was the abandoned
// five-guess shape and must never be fed to this code.)
function storeKeyFor(regionId, modeId) {
  if (regionId === 'uk' && modeId === 'pro') return 'mapsplit-game-v2';
  return 'mapsplit-game-v2-' + regionId + '-' + modeId;
}

// A GAME-shaped config for one region. Everything downstream — puzzleForDate,
// scoreDay, shareText — already takes a cfg, so handing it a copy with this
// region's puzzle table costs one shallow clone and threads nothing new
// through a dozen call sites.
function sessionGame(cfg, region, mode) {
  var out = {};
  for (var k in cfg) {
    if (Object.prototype.hasOwnProperty.call(cfg, k)) out[k] = cfg[k];
  }
  out.puzzles = (region && region.puzzles) || [];
  out.regionId = region ? region.id : null;
  out.regionLabel = region ? region.label : '';
  out.regionFlag = region ? region.flag : '';
  out.modeId = mode ? mode.id : null;
  out.modeLabel = mode ? mode.label : '';
  // null means "use the puzzle row's own target"; a number overrides every
  // row. puzzleForDate is the single place that reads it.
  out.forceTarget = mode ? mode.target : null;
  // The angle rides alongside the target, and for the same reason: it is a
  // statement about the MODE, applied in exactly one place (puzzleForDate).
  out.forceCardinal = mode ? !!mode.snapAxis : false;
  // The share URL names both, or a link from a US Pro scorecard opens on
  // whatever map and difficulty the reader happened to pick last.
  var q = [];
  if (region && region.id !== 'uk') q.push('r=' + region.id);
  if (mode && mode.id !== MODES[0].id) q.push('m=' + mode.id);
  if (q.length) out.shareUrl = cfg.shareUrl + '?' + q.join('&');
  return out;
}

function pad2(n) { return (n < 10 ? '0' : '') + n; }

// 'YYYY-MM-DD' for a timestamp, in UTC. The day boundary is UTC so two players
// in different time zones are never on different puzzles.
function utcDateString(ms) {
  var d = new Date(ms);
  return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
}

// Whole days from epochStr to dateStr, both 'YYYY-MM-DD' read as UTC midnight.
// Exact integer arithmetic: no DST, no rounding drift.
function dayNumber(dateStr, epochStr) {
  var a = Date.parse(dateStr + 'T00:00:00Z');
  var b = Date.parse(epochStr + 'T00:00:00Z');
  if (isNaN(a) || isNaN(b)) return NaN;
  return Math.round((a - b) / 86400000);
}

// --- the axis -----------------------------------------------------------
// Mercator space here has +x EAST and +y SOUTH. `axis` fixes the line's
// direction; the split runs along the line's unit normal, and `sides[0]` is
// always the side the normal points to — the side the target is stated
// against.
//
//   angle 0   level line    -> North / South
//   angle 90  upright line  -> West / East
//   angle 45  NW–SE line    -> North-east / South-west

var COMPASS = ['North', 'North-east', 'East', 'South-east',
               'South', 'South-west', 'West', 'North-west'];

function snapZero(v) { return Math.abs(v) < 1e-12 ? 0 : v; }

function bearingName(n) {
  var deg = (Math.atan2(n[0], -n[1]) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return COMPASS[Math.round(deg / 45) % 8];
}

// The two cardinal presets carry an explicit normal so the target is stated
// against the conventional side — "70% North", "70% West". Derived from the
// angle alone, 90° would name its sides East/West and read backwards.
var AXES = {
  ns: { angle: 0,  normal: [0, -1], sides: ['North', 'South'] },
  we: { angle: 90, normal: [-1, 0], sides: ['West', 'East'] },
};

function axisSpec(axis) {
  if (AXES[axis]) return AXES[axis];
  var deg = Number(axis);
  if (axis === '' || axis === null || axis === undefined || !isFinite(deg)) return null;
  var r = (deg * Math.PI) / 180;
  // Snap the near-zero component to EXACTLY zero. cos(PI/2) is 6.1e-17, not 0,
  // and lineCoordLabel tests `n[0] === 0` / `n[1] === 0` to decide whether the
  // line is a parallel or a meridian — so without this, `axis=90` is a
  // hair off upright, reports no coordinate at all, and its takeaway silently
  // loses the longitude that `axis=we` would have given. Same line, same
  // question, different answer, for no reason a reader could ever see.
  var n = [snapZero(Math.sin(r)), snapZero(-Math.cos(r))];
  // Orient the normal NORTHWARD (westward on a tie), so a derived axis states
  // its target against the same kind of side the two presets do — "40% North-
  // west", never "60% South-east" for the identical line. Without this, 90°
  // named its sides East/West and read backwards, which is why the presets
  // carry an explicit normal at all. Flipping is free: the normal is the only
  // definition of "which side", so everything downstream stays consistent.
  var southward = n[1] > 1e-12 || (Math.abs(n[1]) <= 1e-12 && n[0] > 0);
  if (southward) n = [-n[0], -n[1]];
  return { angle: deg, normal: n,
           sides: [bearingName(n), bearingName([-n[0], -n[1]])] };
}

// Collapse an authored bearing to the cardinal axis it most resembles.
// Normal mode uses this; Pro takes the bearing as written.
//
// A diagonal costs the ENGINE nothing — the line still has exactly one degree
// of freedom and grading still projects onto the normal — but it costs the
// PLAYER a great deal, because a tilted line has to be read against a country
// whose shape you only know upright. That asymmetry is precisely the
// Normal/Pro distinction, which is why the angle belongs on the mode next to
// the target rather than in a second difficulty system.
//
// Ties resolve to the axis the line is turning TOWARD: 45 -> 'we', 135 -> 'ns'.
// Arbitrary, but it has to be decided somewhere, and a diagonal exactly on the
// tie is authored deliberately or not at all.
function snapAxisToCardinal(axis) {
  if (AXES[axis]) return axis;
  var spec = axisSpec(axis);
  if (!spec) return axis;
  var deg = ((spec.angle % 180) + 180) % 180;
  return (deg < 45 || deg >= 135) ? 'ns' : 'we';
}

// Cardinal axes have their own measured proTargets band; every diagonal shares
// one, because a band per bearing is a promise the data cannot keep.
function proTargetBand(axisId) {
  return AXES[axisId] ? axisId : 'diag';
}

// Where a Mercator point sits along the axis normal. The line at offset t is
// exactly the set of points whose offset is t, so this is the single number
// that positions the line.
function offsetOfPoint(mercPt, spec) {
  return mercPt[0] * spec.normal[0] + mercPt[1] * spec.normal[1];
}

// The line at offset t, as two lng/lat endpoints long enough to cross the bbox
// at any angle.
function lineAtOffset(spec, t, padBbox) {
  var n = spec.normal;
  var d = [-n[1], n[0]];                       // unit vector along the line
  var w = padBbox[0], s = padBbox[1], e = padBbox[2], nth = padBbox[3];
  var c = lngLatToMerc([(w + e) / 2, (s + nth) / 2]);
  var corner = lngLatToMerc([w, nth]);
  var half = 2 * Math.hypot(corner[0] - c[0], corner[1] - c[1]);
  var k = t - offsetOfPoint(c, spec);          // slide the centre onto the line
  var p = [c[0] + k * n[0], c[1] + k * n[1]];
  return [
    mercToLngLat([p[0] - half * d[0], p[1] - half * d[1]]),
    mercToLngLat([p[0] + half * d[0], p[1] + half * d[1]]),
  ];
}

// --- grading ------------------------------------------------------------

// Percentage of total weight strictly on the normal side (sides[0]) of the
// line at offset t. The game grades with this rather than routing through
// computeSplit, so it never depends on primarySignFor's labelling or on the
// one unavoidable primary/secondary discontinuity.
function shareAbove(values, weights, t) {
  var above = 0, total = 0;
  for (var i = 0; i < values.length; i++) {
    var w = Math.max(0, weights[i] || 0);
    total += w;
    if (values[i] > t) above += w;
  }
  return total > 0 ? (100 * above) / total : 0;
}

// The offset at which `fraction` of the total weight lies BELOW the line.
// Generalises balancePosition, which is exactly this at fraction 0.5 — the
// boundary is placed between two distinct neighbouring values so no point ever
// sits on the line.
function quantilePosition(values, weights, fraction) {
  var n = values.length;
  if (n === 0) return 0;
  var idx = [];
  for (var i = 0; i < n; i++) idx.push(i);
  idx.sort(function (p, q) { return values[p] - values[q]; });
  var sv = [], sw = [], total = 0;
  for (var j = 0; j < n; j++) {
    sv.push(values[idx[j]]);
    var w = Math.max(0, weights[idx[j]] || 0);
    sw.push(w);
    total += w;
  }
  var span = sv[n - 1] - sv[0];
  var eps = (span > 0 ? span : Math.abs(sv[0]) || 1) * 1e-6;
  if (total <= 0) return (sv[0] + sv[n - 1]) / 2;

  var wanted = total * Math.min(1, Math.max(0, fraction));
  // A target of 0% or 100% has its line outside the data entirely; put it just
  // clear of the extreme rather than on top of a point.
  if (wanted <= 0) return sv[0] - eps;
  if (wanted >= total) return sv[n - 1] + eps;

  var cum = 0, k = 0;
  for (k = 0; k < n; k++) {
    cum += sw[k];
    if (cum >= wanted) break;
  }
  if (k >= n) k = n - 1;
  var cumBefore = cum - sw[k];
  function nearestBelow(pos) {
    for (var m = pos - 1; m >= 0; m--) if (sv[m] < sv[pos]) return sv[m];
    return sv[pos] - eps;
  }
  function nearestAbove(pos) {
    for (var m = pos + 1; m < n; m++) if (sv[m] > sv[pos]) return sv[m];
    return sv[pos] + eps;
  }
  // Whichever side of the pivot lands closer to the requested weight.
  if (Math.abs(wanted - cumBefore) < Math.abs(wanted - cum)) {
    return (nearestBelow(k) + sv[k]) / 2;
  }
  return (sv[k] + nearestAbove(k)) / 2;
}

// The offset of the line that puts exactly `target` percent on sides[0].
function targetOffset(values, weights, target) {
  return quantilePosition(values, weights, 1 - target / 100);
}

var EARTH_RADIUS_KM = 6371;

function haversineKm(a, b) {
  var toRad = Math.PI / 180;
  var dLat = (b[1] - a[1]) * toRad, dLon = (b[0] - a[0]) * toRad;
  var la1 = a[1] * toRad, la2 = b[1] * toRad;
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function weightedCentroidMerc(mercPts, weights) {
  var sx = 0, sy = 0, total = 0;
  for (var i = 0; i < mercPts.length; i++) {
    var w = Math.max(0, weights[i] || 0);
    sx += mercPts[i][0] * w; sy += mercPts[i][1] * w; total += w;
  }
  if (total > 0) return [sx / total, sy / total];
  // No weight: fall back to the plain mean so the reference point still exists.
  for (i = 0; i < mercPts.length; i++) { sx += mercPts[i][0]; sy += mercPts[i][1]; }
  var n = mercPts.length || 1;
  return [sx / n, sy / n];
}

// Ground distance between two parallel lines, measured at `ref`.
//
// Parallel lines in Mercator are NOT a constant ground distance apart, because
// Mercator's scale varies with latitude. It is fine for level lines — a degree
// of latitude is ~111 km everywhere — but meridians converge: a degree of
// longitude is ~67 km at 53°N and ~59 km at 58°N, so a West/East puzzle's gap
// already varies by ~13% depending where along the line you measure. That is
// not a cost of allowing diagonals; the cardinal axes already had it.
//
// Measuring at ONE agreed point — the weighted centroid of that round's own
// data, the middle of where the statistic actually lives — is what makes the
// number reproducible instead of a function of where you happened to look.
function offsetGapKm(tA, tB, spec, ref) {
  var n = spec.normal;
  var base = offsetOfPoint(ref, spec);
  var pa = [ref[0] + (tA - base) * n[0], ref[1] + (tA - base) * n[1]];
  var pb = [ref[0] + (tB - base) * n[0], ref[1] + (tB - base) * n[1]];
  return haversineKm(mercToLngLat(pa), mercToLngLat(pb));
}

// Which way the player's line was wrong: a larger offset means it sits further
// along the normal, i.e. towards sides[0].
function missSide(t, tTrue, spec) {
  if (t === tTrue) return '';
  return t > tTrue ? spec.sides[0] : spec.sides[1];
}

function isSolved(km, cfg) { return km <= cfg.bullseyeKm; }

// One shot per round, so accuracy is the whole score — there is no attempt
// multiplier left to apply. `km` is the distance between the player's line and
// the correct one; see the note on bullseyeKm for why it is not the percentage.
function scoreRound(km, cfg) {
  var acc = 1 - km / cfg.zeroAtKm;
  if (acc < 0) acc = 0;
  return Math.round(cfg.maxPoints * acc);
}

function scoreDay(results, cfg) {
  var sum = 0;
  for (var i = 0; i < results.length; i++) sum += results[i].points || 0;
  return sum;
}

function dayMaxPoints(cfg, roundCount) { return cfg.maxPoints * roundCount; }

// --- the puzzle list ------------------------------------------------------
//
// Authored as one row per ROUND — three rows share a date — because a round is
// the unit a person actually thinks about, and because axis and target then
// belong to the round rather than the day:
//
//     date,round,dataset,field,axis
//     2026-09-01,1,LA.csv,Population2024,ns
//     2026-09-01,2,HMRC.csv,Total tax: Amount,we
//
// `target` is an OPTIONAL sixth column. Leave it out and Pro's percentage is
// derived from the day (see GAME.proTargets); Normal ignores it either way and
// asks for 50%.
function parsePuzzleCsv(text, catalogue) {
  var body = String(text).replace(/^﻿/, '');
  var rows = parseDelimited(body, detectDelimiter(body.split('\n')[0] || ''));
  if (rows.length < 2) {
    throw new Error('The puzzle list needs a header row and at least one round.');
  }
  var head = rows[0].map(normaliseHeader);
  var col = function (name) { return head.indexOf(name); };
  var iDate = col('date'), iRound = col('round'), iSet = col('dataset');
  var iField = col('field'), iAxis = col('axis'), iTarget = col('target');
  if (iDate < 0 || iSet < 0 || iField < 0) {
    throw new Error('The puzzle list needs date, dataset and field columns. Found: ' +
      rows[0].join(', ') + '.');
  }

  var byDate = {}, order = [];
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    if (row.length === 1 && row[0].trim() === '') continue;
    var date = String(row[iDate] || '').trim();
    if (!date) continue;
    var file = String(row[iSet] || '').trim();
    var field = String(row[iField] || '').trim();
    var entry = datasetForFile(catalogue, file, field);
    // Loud, and naming the row: a puzzle list that half-loads would score
    // players against different numbers on different days.
    if (!entry) {
      throw new Error('Puzzle list row ' + (r + 1) + ' (' + date + '): no dataset in the ' +
        'catalogue for file "' + file + '" column "' + field + '".');
    }
    var axis = iAxis >= 0 ? String(row[iAxis] || '').trim() : '';
    if (!axis) axis = 'ns';
    if (!axisSpec(axis)) {
      throw new Error('Puzzle list row ' + (r + 1) + ' (' + date + '): "' + axis +
        '" is not an axis. Use ns, we, or a bearing in degrees.');
    }
    var target = null;
    if (iTarget >= 0 && String(row[iTarget] || '').trim() !== '') {
      target = toNumber(row[iTarget]);
      if (!isFinite(target) || target <= 0 || target >= 100) {
        throw new Error('Puzzle list row ' + (r + 1) + ' (' + date + '): target "' +
          row[iTarget] + '" is not a percentage between 0 and 100.');
      }
    }
    if (!byDate[date]) { byDate[date] = { date: date, rounds: [] }; order.push(date); }
    byDate[date].rounds.push({
      stat: entry.label, axis: axis, target: target,
      seq: iRound >= 0 ? toNumber(row[iRound]) : byDate[date].rounds.length + 1,
    });
  }
  if (!order.length) throw new Error('The puzzle list has no usable rows.');

  order.sort();
  return order.map(function (d) {
    var day = byDate[d];
    // Round order comes from the `round` column when there is one, so the file
    // can be sorted any way the author likes.
    day.rounds.sort(function (a, b) {
      return (isFinite(a.seq) ? a.seq : 0) - (isFinite(b.seq) ? b.seq : 0);
    });
    return day;
  });
}

// Both authoring shapes reduce to { date, rounds: [{ stat, axis, target }] }.
// The literal table in GAME.puzzles states one axis and target for all three
// statistics; the CSV states them per round. Normalising here means nothing
// downstream has to know which was written.
function normalisePuzzleRow(row) {
  if (!row) return null;
  if (row.rounds) return row;
  var stats = row.stats || [];
  return {
    date: row.date || null,
    rounds: stats.map(function (stat) {
      return { stat: stat, axis: row.axis,
               target: (row.target === undefined ? null : row.target) };
    }),
  };
}

// Pro's percentage for a round that does not name one. Deterministic from the
// day and the round index — never random — so two players on the same day meet
// the same puzzle.
function proTargetFor(dayIndex, roundIndex, axisId, cfg) {
  var bands = (cfg && cfg.proTargets) || {};
  var band = bands[proTargetBand(axisId)] || bands['default'] || [50];
  if (!band.length) return 50;
  var i = (Math.abs(dayIndex) * 7 + roundIndex * 3) % band.length;
  return band[i];
}

function puzzleForDate(dateStr, cfg) {
  var list = cfg && cfg.puzzles;
  if (!list || !list.length) return null;
  var d = dayNumber(dateStr, cfg.epoch);
  if (isNaN(d)) return null;
  // A date before launch is still puzzle 1 rather than a negative index, so a
  // wrong system clock gives a playable puzzle, not a blank page.
  if (d < 0) d = 0;
  // DATES ARE AUTHORITATIVE. A row that names today wins, so a themed puzzle
  // can be pinned to a date. Rotation is the fallback for every other day,
  // which is what stops the game going blank the morning after the list runs
  // out — a stale puzzle beats no puzzle.
  var row = null;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].date === dateStr) { row = list[i]; break; }
  }
  if (!row) row = list[d % list.length];
  row = normalisePuzzleRow(row);
  if (!row || !row.rounds || !row.rounds.length) return null;

  var rounds = [];
  for (var k = 0; k < row.rounds.length; k++) {
    var rr = row.rounds[k];
    // Normal collapses an authored diagonal to the cardinal it most resembles;
    // Pro plays the bearing as written. Same seam as forceTarget below, so a
    // diagonal day is still one row that both modes can read.
    var axisId = cfg.forceCardinal ? snapAxisToCardinal(rr.axis) : rr.axis;
    var spec = axisSpec(axisId);
    if (!spec || !rr.stat) return null;
    // The mode's target overrides the round's. This is the ONLY place
    // difficulty touches the puzzle: everything downstream — the task wording,
    // the answer, the grading, the takeaway — reads `target` and needs no
    // notion of mode. When neither the mode nor the row names one, it is
    // derived from the day so that authoring a list never requires thinking
    // in percentages.
    var target;
    if (cfg.forceTarget !== null && cfg.forceTarget !== undefined) target = cfg.forceTarget;
    else if (rr.target !== null && rr.target !== undefined) target = rr.target;
    // Keyed on the EFFECTIVE axis: a band measured on N/S says nothing about
    // the same percentage on W/E (see the table on `puzzles`), so a snapped
    // round must draw from the band for the axis it will actually be played on.
    else target = proTargetFor(d, k, axisId, cfg);
    // `question` is the wording for the task line ("Waitrose shops"); the
    // CSV-authored rows have none, so they fall back to the label as before.
    rounds.push({ stat: rr.stat, question: rr.question || rr.stat, axis: axisId, spec: spec,
                  sides: spec.sides, target: target });
  }
  return { n: d + 1, date: dateStr, theme: row.theme || null, rounds: rounds };
}

// Find a catalogue entry the way the puzzle list names one: by FILE and
// COLUMN, not by display label. The labels carry emoji and are written for the
// screen; a hand-authored puzzle CSV should not have to reproduce them exactly.
function datasetForFile(list, file, field) {
  var wantFile = String(file == null ? '' : file).split('/').pop().toLowerCase();
  var wantField = normaliseHeader(field);
  for (var i = 0; i < (list || []).length; i++) {
    var e = list[i];
    var base = String(e.url == null ? '' : e.url).split('/').pop().toLowerCase();
    if (base !== wantFile) continue;
    var col = e.weightColumn || e.weightProperty || '';
    if (normaliseHeader(col) === wantField) return e;
  }
  return null;
}

// The game's dataset catalogue, built from data/stats.json (written by
// tools/pipeline/run.py). Every statistic there is the same four-column CSV —
// lon,lat,value,name — so each entry differs only in its file, wording and
// provenance. Labels must be unique, because rounds and findDataset look
// statistics up by label; a duplicate would silently serve the wrong data.
function catalogueFromStats(stats, baseUrl) {
  var out = [], seen = {};
  var ids = Object.keys(stats || {}).sort();
  for (var i = 0; i < ids.length; i++) {
    var s = stats[ids[i]];
    if (!s || !s.label || !s.file) throw new Error('stats.json: entry "' + ids[i] + '" lacks a label or file.');
    if (seen[s.label]) {
      throw new Error('stats.json: "' + s.label + '" is the label of both ' + seen[s.label] +
        ' and ' + ids[i] + '.');
    }
    seen[s.label] = ids[i];
    // Provenance for the Sources box: the publishers' pages, then the licence
    // the file itself is under and the attribution its sources require (the
    // ODbL in particular requires it to be visible wherever OSM data is shown).
    var src = (s.sources || []).slice();
    if (s.derivedLicence) {
      src.push({ label: 'Licence: ' + s.derivedLicence.name, url: s.derivedLicence.url });
    }
    for (var a = 0; a < (s.attribution || []).length; a++) {
      src.push({ label: s.attribution[a], url: null });
    }
    out.push({
      id: ids[i], label: s.label, question: s.question || s.label, unit: s.unit,
      url: baseUrl + s.file, type: 'csv', weightColumn: 'value', groupColumn: 'name',
      sources: src,
    });
  }
  return out;
}

// One year's schedule, data/games/YYYY.json (written by
// tools/pipeline/schedule.mjs), into the shape puzzleForDate reads:
// [{ date, theme, rounds: [{ stat, question, axis, target }] }]. FAILS LOUDLY,
// naming the day, on an unknown statistic or axis — same reasoning as
// parsePuzzleCsv: a schedule that half-loads scores players against different
// numbers. target stays null: Normal forces 50%, and the schedule was only
// validated at 50%.
function parseGamesJson(obj, catalogue) {
  if (!obj || !obj.days || !obj.days.length) throw new Error('The schedule has no days.');
  var out = [];
  for (var i = 0; i < obj.days.length; i++) {
    var d = obj.days[i];
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(String(d.date))) {
      throw new Error('Schedule entry ' + (i + 1) + ' has no valid date.');
    }
    if (!d.rounds || !d.rounds.length) throw new Error('Schedule ' + d.date + ' has no rounds.');
    var rounds = [];
    for (var k = 0; k < d.rounds.length; k++) {
      var id = d.rounds[k][0], ax = String(d.rounds[k][1]);
      var e = findById(catalogue, id);
      if (!e) throw new Error('Schedule ' + d.date + ': no statistic "' + id + '" in stats.json.');
      if (!axisSpec(ax)) throw new Error('Schedule ' + d.date + ': "' + ax + '" is not an axis.');
      rounds.push({ stat: e.label, question: e.question, axis: ax, target: null });
    }
    out.push({ date: d.date, theme: d.title || d.theme || null, rounds: rounds });
  }
  return out;
}

// The schedule file to load for a date: one file per calendar year (UTC).
function gamesFileFor(dateStr) {
  return String(dateStr).slice(0, 4) + '.json';
}

function findDataset(label, list) {
  for (var i = 0; i < (list || []).length; i++) {
    if (list[i].label === label) return list[i];
  }
  return null;
}

// --- sharing ------------------------------------------------------------

function repeatStr(s, n) { return n > 0 ? new Array(n + 1).join(s) : ''; }

// Five cells per round, more filled the closer it landed. Green is reserved
// for a bullseye, so a shared grid answers "did they nail any of them" at a
// glance.
function guessBar(km, cfg) {
  var solved = isSolved(km, cfg);
  var filled = solved ? 5 : Math.max(0, 5 - Math.ceil(km / (cfg.zeroAtKm / 5)));
  // Only a bullseye may show all five, or the grid claims a hit that did not
  // happen.
  if (filled > 4 && !solved) filled = 4;
  return repeatStr(solved ? '🟩' : '🟨', filled) + repeatStr('⬜', 5 - filled);
}

// Thousands separators without Intl, so the shared text is byte-identical
// whatever locale the player's browser is in.
function groupDigits(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// --- revealing the answer ------------------------------------------------

function easeOutCubic(p) {
  var q = p < 0 ? 0 : (p > 1 ? 1 : p);
  return 1 - Math.pow(1 - q, 3);
}

// Where the line at offset t meets the edge of `bbox` — used to anchor each
// revealed answer's label so it sits at the edge of the map rather than under
// the country.
//
// Uses the real line/rectangle intersection rather than clamping a coordinate
// into range: clamping x and y independently moves the point OFF the line at
// any angle that is not level or upright, which put the 135-degree label beside
// its own line instead of on it. The intersections are on the line and on the
// boundary by construction.
//
// Of the two, take the westmost — and for an upright line, where both share a
// longitude, the northmost. That is the edge a reader's eye starts from.
function lineEdgePoint(spec, t, bbox) {
  var w = bbox[0], s = bbox[1], e = bbox[2], nth = bbox[3];
  var rect = [
    lngLatToMerc([w, nth]), lngLatToMerc([e, nth]),
    lngLatToMerc([e, s]), lngLatToMerc([w, s]),
  ];
  var ep = lineAtOffset(spec, t, bbox);
  var A = lngLatToMerc(ep[0]), B = lngLatToMerc(ep[1]);
  var pts = lineRectIntersections(A, B, rect);
  if (!pts.length) return mercToLngLat(A);      // line misses the box entirely
  var best = pts[0];
  for (var i = 1; i < pts.length; i++) {
    var dx = pts[i][0] - best[0];
    // +y is SOUTH in this projection, so a smaller y is further north.
    if (dx < -1e-12 || (Math.abs(dx) <= 1e-12 && pts[i][1] < best[1])) best = pts[i];
  }
  return mercToLngLat(best);
}

// --- the takeaway -------------------------------------------------------
//
// After a guess is committed — never before — each round states the fact its
// answer encodes: "70% of Population lives north of a line through Sheffield."
// It arrives too late to help that round, so it costs no difficulty, and it is
// why a bad day still leaves you with something.
//
// Generated from the data rather than authored per puzzle: the true line and
// its neighbourhood are already computed for the distance payoff, so a new
// dataset in the CSV needs no new prose.

// Statistical geography names a small area as "Leeds 001A" or "Camden 004".
// The trailing code is noise in a sentence, and the town in front of it is the
// part a reader recognises.
function tidyPlaceName(name) {
  return String(name == null ? '' : name)
    .replace(/\s+\d{2,4}[A-Za-z]?$/, '')
    .trim();
}

// The place to name for a line at offset t.
//
// NOT simply the closest point: the closest is often a tiny district nobody
// recognises. Take the `pool` nearest points to the line and name the HEAVIEST
// of them, so the sentence lands on somewhere the reader has heard of while
// staying genuinely near the line.
function placeNearLine(values, weights, groups, groupNames, t, pool) {
  if (!groups || !groupNames || !groupNames.length) return null;
  var n = values.length;
  if (!n) return null;
  var idx = [];
  for (var i = 0; i < n; i++) idx.push(i);
  idx.sort(function (a, b) {
    return Math.abs(values[a] - t) - Math.abs(values[b] - t);
  });
  var take = Math.min(pool || 20, n);
  var best = -1, bestW = -Infinity;
  for (var k = 0; k < take; k++) {
    var w = Math.max(0, weights[idx[k]] || 0);
    if (w > bestW) { bestW = w; best = idx[k]; }
  }
  if (best < 0) return null;
  var name = tidyPlaceName(groupNames[groups[best]]);
  return name || null;
}

// Where the line sits, as a coordinate — but only when that is meaningful.
// A level line is a parallel and a upright line is a meridian, so each has one
// honest number. A diagonal has neither, and inventing one would be worse than
// saying nothing.
function lineCoordLabel(spec, t, padBbox) {
  var n = spec.normal;
  var w = padBbox[0], s = padBbox[1], e = padBbox[2], nth = padBbox[3];
  var ref = lngLatToMerc([(w + e) / 2, (s + nth) / 2]);
  var base = offsetOfPoint(ref, spec);
  var ll = mercToLngLat([ref[0] + (t - base) * n[0], ref[1] + (t - base) * n[1]]);
  if (n[0] === 0) {
    return Math.abs(ll[1]).toFixed(2) + '°' + (ll[1] >= 0 ? 'N' : 'S');
  }
  if (n[1] === 0) {
    return Math.abs(ll[0]).toFixed(2) + '°' + (ll[0] >= 0 ? 'E' : 'W');
  }
  return null;
}

// One round's fact, plus how it compares with the round before it — which is
// the actual insight the three-statistic format exists to deliver: the tax line
// and the population line are not in the same place.
function takeawayText(result, prev, sides, target) {
  if (!result) return '';
  // Coordinate first, place second: the line crosses the whole country, so
  // naming one town is a landmark rather than a location. The number is the
  // fact; the town is what makes it stick.
  var where;
  if (result.coord && result.place) where = result.coord + ' — a line through ' + result.place;
  else if (result.coord) where = result.coord;
  else if (result.place) where = 'a line through ' + result.place;
  else where = 'today\'s line';
  var s = target + '% of ' + result.stat + ' is ' +
    sides[0].toLowerCase() + ' of ' + where + '.';
  if (prev && prev.place && isFinite(result.crossKm) && result.crossSide) {
    s += ' That is ' + Math.round(result.crossKm) + ' km ' +
      result.crossSide.toLowerCase() + ' of the ' + prev.stat + ' line.';
  }
  return s;
}

// A level line, an upright one and a diagonal are different questions; the
// scorecard has to say which without spending a word on it. The two diagonal
// glyphs lean the way the LINE leans, not the way the normal points — a reader
// matching the glyph against the map they just played is looking at the line.
function axisGlyph(axisId) {
  var spec = axisSpec(axisId);
  if (!spec) return '·';
  if (spec.sides[0] === 'North' || spec.sides[0] === 'South') return '↕';
  if (spec.sides[0] === 'West' || spec.sides[0] === 'East') return '↔';
  // Line direction is the normal turned 90°. Mercator y runs SOUTH, so a
  // direction with dx and dy of the same sign descends left-to-right: NW–SE.
  var n = spec.normal;
  return (-n[1] * n[0] > 0) ? '⟍' : '⟋';
}

function shareText(round, cfg) {
  var lines = [];
  // The flag is part of the identity: two players on different maps have
  // incomparable scores, and a scorecard that does not say which map it is
  // invites exactly that comparison.
  // The axis and the target used to be day-level and lived on their own line.
  // They are per round now, so each row states its own — which also makes a
  // mixed-axis day readable instead of mysterious.
  lines.push('MapSplit ' + (cfg.regionFlag ? cfg.regionFlag + ' ' : '') +
             '#' + round.n + (cfg.modeLabel ? ' · ' + cfg.modeLabel : ''));
  for (var i = 0; i < round.results.length; i++) {
    var res = round.results[i];
    lines.push(guessBar(res.km, cfg) + ' ' + axisGlyph(res.axis) + ' ' +
               res.target + '% ' + res.sideName + ' · ' + res.stat);
  }
  lines.push(groupDigits(scoreDay(round.results, cfg)) + '/' +
             groupDigits(dayMaxPoints(cfg, round.rounds.length)) + ' points');
  lines.push(cfg.shareUrl);
  return lines.join('\n');
}

/* END PURE */

// =========================================================================
// Rendering + interaction. DOM-bound; replaces the prototype's map.js,
// divider.js and ui.js.
// =========================================================================

// --- the active region ---------------------------------------------------
// The UK coastline used to be a 71 KB constant inlined right here. It now
// lives in data/coast/uk.js alongside the other three, loaded on demand —
// there is no second copy to keep in step, and switching map is the same code
// path for every region.
//
// Loaded with a <script> tag rather than fetch() on purpose: that is what makes
// the region files portable to index.html, which opens under file:// where
// fetch is blocked. See tools/prep_regions.py.
var REGION = null;          // the active region's coast file
var REGION_ID = null;

function loadRegionCoast(id, cb) {
  var reg = window.MapSplitCoast && window.MapSplitCoast[id];
  if (reg) return cb(null, reg);
  var el = document.createElement('script');
  el.src = '../data/coast/' + encodeURIComponent(id) + '.js';
  el.onload = function () {
    var r = window.MapSplitCoast && window.MapSplitCoast[id];
    cb(r ? null : new Error('coast file loaded but registered nothing'), r);
  };
  el.onerror = function () { cb(new Error('could not load ../data/coast/' + id + '.js')); };
  document.head.appendChild(el);
}

// Point every projection at this region before anything is drawn or measured.
// WORLD_ORIGIN lives in the pure block because mercToWorld closes over it; it
// is a var rather than a const precisely so a region can move it.
function useRegion(reg) {
  REGION = reg;
  REGION_ID = reg.id;
  WORLD_ORIGIN = reg.origin;
  WORLD_SCALE = reg.scale;
  CONFIG.displayBbox = reg.displayBbox;
  CONFIG.padBbox = reg.padBbox;
  CONFIG.defaultLine = reg.defaultLine;
  clipBbox = reg.padBbox;
  endpoints = [reg.defaultLine[0].slice(), reg.defaultLine[1].slice()];
}

var svg = document.getElementById('map');
// The viewBox is padded around the tight GB coastline so the country never
// touches the frame. Portrait screens (phones) get more margin: there "meet"
// fits by width, so with no padding GB spans edge-to-edge and reads as "zoomed
// in", cramped under the top panel and the bottom ad. The extra sea margin
// pulls it clear. Everything else keys off getScreenCTM(), so it follows along.
function applyViewBox() {
  if (!REGION) return;
  var W = REGION.viewBox[2], H = REGION.viewBox[3];
  // The SVG is a grid cell now, not the viewport, so the portrait test is on
  // the box's own shape: a wide window with a 316px ad rail can still leave a
  // portrait map, and it is the map that needs the extra sea margin.
  var box = svg.getBoundingClientRect();
  var portrait = box.width > 0 ? box.height > box.width
                               : window.innerHeight > window.innerWidth;
  var m = portrait ? 0.16 : 0.04;
  var mx = W * m, my = H * m;
  svg.setAttribute('viewBox',
    (-mx) + ' ' + (-my) + ' ' + (W + 2 * mx) + ' ' + (H + 2 * my));
}

// --- render the coastline -------------------------------------------------
// `context` first, underneath: land that is shown for orientation but carries
// no data points and is excluded from the statistics — Ireland behind GB,
// Canada and Mexico behind the US. `subject` is the land being counted.
// Rebuilt rather than appended, so switching region cannot leave the previous
// one underneath.
function drawCoast() {
  var g = document.getElementById('coast');
  var NS = 'http://www.w3.org/2000/svg';
  g.textContent = '';
  if (!REGION) return;
  [['context', 'land context'], ['subject', 'land']].forEach(function (spec) {
    (REGION[spec[0]] || []).forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('class', spec[1]);
      g.appendChild(p);
    });
  });
}

// --- points --------------------------------------------------------------
// The point set is drawn TWICE, each copy clipped to one half-plane. Dragging
// then updates two clip polygons instead of restyling thousands of circles, so
// per-point work per frame is zero.
//
// These four are rebuilt whenever the source changes, so they are `var`s the
// loader reassigns rather than constants.
var source = null;
var data = null;
var mercPts = [];  // precomputed; classification is hot
var sides = [];

// The subset of points actually drawn (every stride-th), in world units, with a
// parallel map back to the data index. The hover tooltip hit-tests against these
// so it only ever names a visible dot, never blank space in a strided subsample.
var drawnWorld = [];
var drawnIdx = [];
var pointRadiusWorld = 0;

function drawPoints() {
  var NS = 'http://www.w3.org/2000/svg';
  var gN = document.getElementById('pts-primary');
  var gS = document.getElementById('pts-secondary');
  gN.textContent = '';
  gS.textContent = '';

  var n = mercPts.length;
  // Keep the ink roughly constant as the point count changes: at 3,500 points
  // 110 world units is ≈1.8px at a typical window height, and a denser set
  // needs smaller marks to stay legible rather than becoming a solid blob.
  var r = Math.max(25, Math.min(260, Math.round(110 * Math.sqrt(3500 / Math.max(1, n)))));

  // Above the limit, draw an evenly-strided subsample. A stride is used rather
  // than a random sample so the drawing is deterministic, and because most
  // real files are not spatially sorted. The STATISTICS still use every point;
  // only the drawing is thinned, and the panel says so.
  var stride = n > CONFIG.svgPointLimit ? Math.ceil(n / CONFIG.svgPointLimit) : 1;

  // Reset the tooltip lookup for the new draw.
  drawnWorld = [];
  drawnIdx = [];
  pointRadiusWorld = r;

  var fragN = document.createDocumentFragment();
  var fragS = document.createDocumentFragment();
  for (var i = 0; i < n; i += stride) {
    var w = mercToWorld(mercPts[i]);
    var x = Math.round(w[0]), y = Math.round(w[1]);
    drawnWorld.push([x, y]);
    drawnIdx.push(i);
    var cN = document.createElementNS(NS, 'circle');
    cN.setAttribute('cx', x); cN.setAttribute('cy', y); cN.setAttribute('r', r);
    cN.setAttribute('class', 'pt-primary');
    fragN.appendChild(cN);
    var cS = document.createElementNS(NS, 'circle');
    cS.setAttribute('cx', x); cS.setAttribute('cy', y); cS.setAttribute('r', r);
    cS.setAttribute('class', 'pt-secondary');
    fragS.appendChild(cS);
  }
  gN.appendChild(fragN);
  gS.appendChild(fragS);
  return stride;
}

// --- panel ---------------------------------------------------------------
var fmtInt = new Intl.NumberFormat('en-GB');
// Most recent stats and compass labels. Written every recompute, read only
// when the player commits a guess.
var lastStats = null;
var lastLabels = null;
var noticeEl = document.getElementById('notice');


// --- screen scale --------------------------------------------------------
// One world unit is a fraction of a pixel, so grab radii and handle sizes
// must be converted from screen pixels via the current CTM. Recomputed on
// resize, which is the only view change this app has.
var unitsPerPx = 1;
var clipBbox = CONFIG.padBbox; // replaced with the visible extent once laid out
// The same rectangle WITHOUT the overflow pad: what the player can actually
// see. Answer labels anchor to this, or they are drawn 10% off the edge of the
// map and never appear.
var labelBbox = CONFIG.padBbox;

// The half-plane fills must cover the whole window, but "xMidYMid meet"
// letterboxes the viewBox, so how much world is on screen depends on the
// window's aspect ratio. Derive the clip box from the viewport corners
// (padded 10%) rather than assuming a fixed one.
function visibleBbox(padFrac) {
  var ctm = svg.getScreenCTM();
  if (!ctm || !ctm.a) return CONFIG.padBbox;
  var inv = ctm.inverse();
  // getScreenCTM() is relative to the VIEWPORT, so the corners to invert are
  // the svg's client rect — not (0,0)-(innerWidth,innerHeight). Those were the
  // same thing while the map filled the window; with the ad rail and the
  // status bar they are not, and using the window would stretch the half-plane
  // fills past the map box.
  var r = svg.getBoundingClientRect();
  var tl = new DOMPoint(r.left, r.top).matrixTransform(inv);
  var br = new DOMPoint(r.right, r.bottom).matrixTransform(inv);
  var f = padFrac === undefined ? 0.1 : padFrac;
  var padX = (br.x - tl.x) * f;
  var padY = (br.y - tl.y) * f;
  var nw = worldToLngLat([tl.x - padX, tl.y - padY]);
  var se = worldToLngLat([br.x + padX, br.y + padY]);
  // Mercator explodes near the poles and wraps past ±180°, so clamp.
  var clampLng = function (v) { return Math.max(-179.9, Math.min(179.9, v)); };
  var clampLat = function (v) { return Math.max(-85, Math.min(85, v)); };
  return [clampLng(nw[0]), clampLat(se[1]), clampLng(se[0]), clampLat(nw[1])];
}

function syncScreenScale() {
  var ctm = svg.getScreenCTM();
  if (!ctm || !ctm.a) return;
  unitsPerPx = 1 / ctm.a;
  // Handles are drawn in a group scaled by unitsPerPx, so their radius is set
  // once in screen pixels rather than converted to world units every resize.
  clipBbox = visibleBbox();
  labelBbox = visibleBbox(0);
}

// --- elements ------------------------------------------------------------
var polyPrimary = document.getElementById('poly-primary');
var polySecondary = document.getElementById('poly-secondary');
var tintPrimary = document.getElementById('tint-primary');
var tintSecondary = document.getElementById('tint-secondary');
var dividerExt = document.getElementById('divider-ext');
var dividerSeg = document.getElementById('divider-seg');
var hitSeg = document.getElementById('hit-seg');
var grip = document.getElementById('grip');

function ringToPoints(mercRing) {
  var out = '';
  for (var i = 0; i < mercRing.length; i++) {
    var w = mercToWorld(mercRing[i]);
    out += (i ? ' ' : '') + w[0].toFixed(1) + ',' + w[1].toFixed(1);
  }
  return out;
}

// --- the recompute pipeline ---------------------------------------------
// endpoints are the source of truth, held in lng/lat.
var endpoints = [CONFIG.defaultLine[0].slice(), CONFIG.defaultLine[1].slice()];

// The game's line has ONE degree of freedom. `axis` is the puzzle's fixed
// direction (set once the puzzle is known) and `offset` positions the line
// along its normal; `endpoints` becomes a derived value, rebuilt from the two.
var axis = null;
var offset = 0;

function setOffset(t) {
  if (!axis) return;
  offset = t;
  endpoints = lineAtOffset(axis, offset, CONFIG.padBbox);
  scheduleRecompute();
}

function recompute() {
  if (!REGION || !axis) return;
  var split = computeSplit(endpoints[0], endpoints[1], clipBbox);

  var ptsPrimary = ringToPoints(split.primary);
  var ptsSecondary = ringToPoints(split.secondary);
  polyPrimary.setAttribute('points', ptsPrimary);
  polySecondary.setAttribute('points', ptsSecondary);
  tintPrimary.setAttribute('points', ptsPrimary);
  tintSecondary.setAttribute('points', ptsSecondary);

  if (split.dividerLine) {
    var e0 = mercToWorld(split.dividerLine[0]);
    var e1 = mercToWorld(split.dividerLine[1]);
    dividerExt.setAttribute('x1', e0[0]); dividerExt.setAttribute('y1', e0[1]);
    dividerExt.setAttribute('x2', e1[0]); dividerExt.setAttribute('y2', e1[1]);
    dividerExt.style.display = '';
    // The hand rides the middle of the visible line. Authored in screen pixels
    // and scaled back by unitsPerPx, so it stays one size at any zoom.
    grip.setAttribute('transform',
      'translate(' + ((e0[0] + e1[0]) / 2) + ' ' + ((e0[1] + e1[1]) / 2) +
      ') scale(' + unitsPerPx + ')');
    syncGrip();
  } else {
    dividerExt.style.display = 'none';
    grip.style.display = 'none';
  }

  var wa = lngLatToWorld(endpoints[0]);
  var wb = lngLatToWorld(endpoints[1]);
  [dividerSeg, hitSeg].forEach(function (el) {
    el.setAttribute('x1', wa[0]); el.setAttribute('y1', wa[1]);
    el.setAttribute('x2', wb[0]); el.setAttribute('y2', wb[1]);
  });
  // The handle groups are placed by transform and scaled back to screen pixels,
  // so the handle circle and its rotation arrow keep a fixed on-screen size.
  // No handle placement: the axis is fixed, so there is nothing to rotate and
  // the handles are hidden by style-game.css.

  // Everything above is geometry and needs no data: the halves, the tints and
  // the line are drawn for a region that has no statistics yet, which is the
  // whole point of being able to look at a map before its data exists. Only
  // the points and the stats below need a source. A load in flight, or a
  // resize during one, lands here too.
  if (!data) { renderAnswers(); return; }

  // Classification stays per-point in JS — 3,500 cross products is ~0.05ms.
  for (var i = 0; i < mercPts.length; i++) {
    var sgn = sideValue(split.A, split.B, mercPts[i]) >= 0 ? 1 : -1;
    sides[i] = sgn === split.primarySign ? 'primary' : 'secondary';
  }

  var stats = computeStats(sides, data.weights);
  // Computed and thrown away. The whole game rests on the player not being
  // able to read the split until they commit — a live readout would reduce the
  // puzzle to dragging until the number matches. Grading does not use this at
  // all: commitGuess() calls shareAbove() on the projected values, which is
  // independent of primary/secondary labelling.
  void stats;
  // Revealed answers are positioned in world units too, so a resize has to
  // redraw them alongside everything else.
  renderAnswers();
}

// Throttle to one repaint per animation frame.
var scheduled = false;
function scheduleRecompute() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(function () {
    scheduled = false;
    recompute();
  });
}

// --- interaction ---------------------------------------------------------
// { mode: 'a'|'b'|'line', last: [world x, y], mid: [world x, y], half: number }
// For a handle drag we pivot the whole bar around its midpoint at a FIXED
// length — the bar only rotates, it never resizes — so `mid` and `half` are
// captured once at pointerdown and held for the duration of the drag.
var drag = null;

function eventToWorld(evt) {
  var pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  var m = svg.getScreenCTM();
  if (!m) return null;
  var p = pt.matrixTransform(m.inverse());
  return [p.x, p.y];
}

// The line has ONE degree of freedom: its offset along the axis normal. Any
// pointerdown on the map starts a slide — a 1-D control should not make the
// player hunt for a thin line — and the pointer's motion is projected onto the
// normal, so the line can translate but never rotate.
svg.addEventListener('pointerdown', function (evt) {
  // A map-only region has no round, so roundLocked() is true for it — and
  // sliding the line is the ONLY thing there is to do there. playable() is
  // the guard everything interactive uses, rather than roundLocked() alone.
  if (!axis || !playable() || isRevealing()) return;
  var P = eventToWorld(evt);
  if (!P) return;
  drag = { last: P, moved: false };
  document.body.classList.add('dragging');
  grip.style.display = 'none';
  try { svg.setPointerCapture(evt.pointerId); } catch (e) { /* synthetic pointer */ }
  evt.preventDefault();
});

svg.addEventListener('pointermove', function (evt) {
  if (!drag) return;
  var P = eventToWorld(evt);
  if (!P) return;
  // Project the movement onto the normal and discard the rest.
  var dx = P[0] - drag.last[0], dy = P[1] - drag.last[1];
  var along = dx * axis.normal[0] + dy * axis.normal[1];
  drag.last = P;
  // A pointerdown that never moves is a stray tap, not a guess (see endDrag).
  if (along !== 0) drag.moved = true;
  setOffset(offset + along / WORLD_SCALE);
  evt.preventDefault();
});

function endDrag(evt, commit) {
  if (!drag) return;
  var moved = drag.moved;
  drag = null;
  document.body.classList.remove('dragging');
  if (evt) {
    try {
      if (svg.hasPointerCapture(evt.pointerId)) svg.releasePointerCapture(evt.pointerId);
    } catch (e) { /* nothing to release */ }
  }
  // Letting go IS the guess — there is no commit button. But only after the
  // line actually moved: a tap that moved nothing is a mis-tap or a failed
  // scroll, and ending the round on one would commit a guess the player never
  // made. Committing hides the hand; a cancelled drag has to put it back.
  if (commit && moved) commitGuess();
  syncGrip();
}
svg.addEventListener('pointerup', function (evt) { endDrag(evt, true); });
svg.addEventListener('pointercancel', function (evt) { endDrag(evt, false); });

// =========================================================================
// Loading. The impure half of the ingest split: FileReader, fetch and the
// picker live here; everything they hand off to is in the PURE block above.
// =========================================================================

function showNotice(messages, isError) {
  var list = [].concat(messages || []).filter(Boolean);
  noticeEl.className = 'notice' + (isError ? ' error' : '');
  noticeEl.textContent = list.join(' ');
  noticeEl.hidden = !list.length;
}

// Fills the Sources box under the picker. Built with DOM calls rather than
// innerHTML because one of these labels is a user-supplied filename.
function renderSources(list) {
  var ul = document.getElementById('sources-list');
  ul.textContent = '';
  (list || []).forEach(function (s) {
    var li = document.createElement('li');
    if (s.url) {
      var a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.label;
      li.appendChild(a);
    } else {
      li.textContent = s.label;
    }
    ul.appendChild(li);
  });
}

// Swaps in a new source: await its features, rebuild the projected cache and
// the circles, then recompute. Any failure leaves the previous source intact,
// because a bad file should not blank the map.
function setSource(next) {
  return Promise.resolve()
    .then(function () { return next.getFeatures(); })
    .then(function (features) {
      if (!features || !features.coords || !features.coords.length) {
        throw new Error('Source returned no features.');
      }
      source = next;
      data = features;
      mercPts = features.coords.map(lngLatToMerc);
      sides = new Array(features.coords.length);

      var stride = drawPoints();
      document.getElementById('credit-source').textContent = source.label;
      renderSources(source.sources);

      var notes = (source.notes || []).slice();
      if (stride > 1) {
        notes.push('Drawing every ' + stride + 'th point (' +
          fmtInt.format(Math.ceil(mercPts.length / stride)) + ' of ' +
          fmtInt.format(mercPts.length) + '); all are counted.');
      }
      // The grouping note is ingest chatter with no meaning for a player now
      // that the breakdown is gone — but the names themselves are needed for
      // the takeaway, so the note is filtered, not the data. Anything else the
      // ingest layer reports (skipped rows, a guessed weight column) still
      // shows, because those change what is being counted.
      showNotice(notes.filter(function (t) { return !/^Grouping by /.test(t); }), false);
      // Derive this round's projection and answer before the first paint.
      onRoundData();
      recompute();
      return source;
    })
    .catch(function (err) {
      showNotice(['Could not load that dataset: ' + (err && err.message ? err.message : err)], true);
      throw err;
    });
}

// Parse with an explicit option set and swap the source in. Shared by the grid
// fast-path and the mapping dialog's Confirm; a parse error surfaces in the
// notice line and leaves the current source intact.
function commitFile(name, text, opts) {
  var src;
  // An uploaded file has no catalogue entry, so it describes itself: a
  // url-less entry, which the box renders as plain text.
  if (!opts.sources) opts.sources = [{ label: 'Loaded from your file: ' + name }];
  try {
    src = createSourceFromText(name, text, opts);
  } catch (e) {
    showNotice([(e && e.message) || String(e)], true);
    return;
  }
  setSource(src).catch(function () {});
  // An uploaded file matches no catalogue entry — deselect and grey the picker
  // (it stays enabled) so it doesn't falsely claim one of its options is live.
  var picker = document.getElementById('dataset-picker');
  if (picker) { picker.selectedIndex = -1; picker.classList.add('deselected'); }
}

// --- the column-mapping dialog -------------------------------------------
var modalEl = document.getElementById('map-modal');
var modalFields = document.getElementById('modal-fields');
var modalSub = document.getElementById('modal-sub');
var modalConfirm = document.getElementById('modal-confirm');
var modalCancel = document.getElementById('modal-cancel');
var pendingConfirm = null; // what Confirm runs; set per open

function closeModal() {
  modalEl.hidden = true;
  modalFields.textContent = '';
  pendingConfirm = null;
}

// One labelled <select> listing `fields`, with `guess` pre-selected. Optional
// fields lead with "— none —"; a required field with no valid guess leads with
// a disabled placeholder so Confirm starts disabled.
function makeFieldSelect(labelText, fields, guess, required) {
  var wrap = document.createElement('div');
  wrap.className = 'modal-field';
  var lab = document.createElement('label');
  lab.textContent = labelText;
  if (!required) {
    var opt = document.createElement('span');
    opt.className = 'modal-req';
    opt.textContent = ' (optional)';
    lab.appendChild(opt);
  }
  var sel = document.createElement('select');
  if (required && fields.indexOf(guess) < 0) {
    var ph = document.createElement('option');
    ph.value = ''; ph.textContent = 'Choose a column…';
    ph.disabled = true; ph.selected = true;
    sel.appendChild(ph);
  }
  if (!required) {
    var none = document.createElement('option');
    none.value = NO_COLUMN; none.textContent = '— none —';
    sel.appendChild(none);
  }
  fields.forEach(function (name) {
    var o = document.createElement('option');
    o.value = name; o.textContent = name;
    if (name === guess) o.selected = true;
    sel.appendChild(o);
  });
  wrap.appendChild(lab);
  wrap.appendChild(sel);
  modalFields.appendChild(wrap);
  return sel;
}

// Build the dialog for a CSV or GeoJSON file, pre-filled with the alias guesses,
// and wire Confirm to parse with the chosen columns. lng/lat are only asked for
// CSV — GeoJSON takes coordinates from the geometry.
function openMapping(name, text, type) {
  var isCsv = type === 'csv';
  var desc;
  try {
    desc = isCsv ? describeCsvFields(text, {}) : describeGeojsonFields(JSON.parse(text), {});
  } catch (e) {
    showNotice([(e && e.message) || String(e)], true);
    return;
  }
  // Nothing to map (a GeoJSON with no properties): parse straight through.
  if (!desc.fields.length) { commitFile(name, text, { type: type }); return; }

  modalFields.textContent = '';
  modalSub.textContent = isCsv
    ? 'Choose which columns in “' + name + '” to use.'
    : 'Choose which properties in “' + name + '” to use — coordinates come from the geometry.';

  var lngSel, latSel;
  if (isCsv) {
    lngSel = makeFieldSelect('Longitude', desc.fields, desc.guesses.lng, true);
    latSel = makeFieldSelect('Latitude', desc.fields, desc.guesses.lat, true);
  }
  var valSel = makeFieldSelect('Value', desc.fields, desc.guesses.weight, false);
  var grpSel = makeFieldSelect('Label or Group', desc.fields, desc.guesses.group, false);

  function validate() {
    modalConfirm.disabled = isCsv && !(lngSel.value && latSel.value);
  }
  if (isCsv) {
    lngSel.addEventListener('change', validate);
    latSel.addEventListener('change', validate);
  }
  validate();

  pendingConfirm = function () {
    var opts = { type: type };
    if (isCsv) {
      opts.lngColumn = lngSel.value;
      opts.latColumn = latSel.value;
      opts.weightColumn = valSel.value; // header name or NO_COLUMN
      opts.groupColumn = grpSel.value;
    } else {
      opts.weightProperty = valSel.value;
      opts.groupProperty = grpSel.value;
    }
    commitFile(name, text, opts);
  };

  modalEl.hidden = false;
  modalConfirm.focus();
}

modalConfirm.addEventListener('click', function () {
  var fn = pendingConfirm;
  closeModal();
  if (fn) fn();
});
modalCancel.addEventListener('click', function () {
  closeModal();
  showNotice(['Load cancelled — showing the previous data.'], false);
});
// Backdrop click and Escape both cancel.
modalEl.addEventListener('click', function (e) { if (e.target === modalEl) modalCancel.click(); });
document.addEventListener('keydown', function (e) {
  if (!modalEl.hidden && e.key === 'Escape') modalCancel.click();
});

// About / info dialog — a static overlay; content is populated later.
var infoModalEl = document.getElementById('info-modal');
var btnInfo = document.getElementById('btn-info');
var infoClose = document.getElementById('info-close');
function openInfoModal() {
  infoModalEl.hidden = false;
  infoClose.focus();
}
btnInfo.addEventListener('click', openInfoModal);
var linkInfo = document.getElementById('link-info');
if (linkInfo) linkInfo.addEventListener('click', openInfoModal);
infoClose.addEventListener('click', function () { infoModalEl.hidden = true; });
infoModalEl.addEventListener('click', function (e) {
  if (e.target === infoModalEl) infoModalEl.hidden = true;
});
document.addEventListener('keydown', function (e) {
  if (!infoModalEl.hidden && e.key === 'Escape') infoModalEl.hidden = true;
});

// Sources dialog — the provenance box moved out of the panel to keep it short.
// renderSources() and setSource() still write to #sources-list and
// #credit-source unchanged; only where those ids sit in the document moved.
var sourcesModalEl = document.getElementById('sources-modal');
var btnSources = document.getElementById('btn-sources');
var sourcesClose = document.getElementById('sources-close');
function closeSourcesModal() { sourcesModalEl.hidden = true; }
function openSourcesModal(e) {
  if (e) e.preventDefault();
  sourcesModalEl.hidden = false;
  sourcesClose.focus();
}
btnSources.addEventListener('click', openSourcesModal);
// The same dialog is reachable from the footer link below the fold.
var footSources = document.getElementById('foot-sources');
if (footSources) footSources.addEventListener('click', openSourcesModal);
sourcesClose.addEventListener('click', closeSourcesModal);
sourcesModalEl.addEventListener('click', function (e) {
  if (e.target === sourcesModalEl) closeSourcesModal();
});
document.addEventListener('keydown', function (e) {
  if (!sourcesModalEl.hidden && e.key === 'Escape') closeSourcesModal();
});

// Drag-and-drop and the file picker both land here. FileReader works under
// file://, which is why this is the primary path — see CONFIG.datasets. CSV and
// GeoJSON open the mapping dialog first; grids have no columns to map.
function loadFile(file) {
  showNotice(['Reading ' + file.name + '…'], false);
  var reader = new FileReader();
  reader.onerror = function () { showNotice(['Could not read ' + file.name + '.'], true); };
  reader.onload = function () {
    var text = String(reader.result);
    var type;
    try {
      type = detectSourceType(file.name, text);
    } catch (e) {
      showNotice([(e && e.message) || String(e)], true);
      return;
    }
    if (type === 'grid-json' || type === 'ascii-grid') commitFile(file.name, text, { type: type });
    else openMapping(file.name, text, type);
  };
  reader.readAsText(file);
}

// The catalogue path. fetch() is blocked under file://, so say that plainly
// rather than reporting a bare network error the user cannot act on.
function loadDataset(entry, onFail) {
  showNotice(['Fetching ' + entry.label + '…'], false);
  fetch(entry.url)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + entry.url);
      return r.text();
    })
    .then(function (text) { return setSource(createSourceFromText(entry.url, text, entry)); })
    .catch(function (err) {
      // A caller (e.g. the boot path) can recover — fetch fails under file://,
      // so the double-click launch falls back to the synthetic default.
      if (onFail) { onFail(err); return; }
      var hint = location.protocol === 'file:'
        ? ' Catalogue datasets are fetched, which a browser blocks under file:// — serve the folder over HTTP, or drag the file in instead.'
        : '';
      showNotice(['Could not load ' + entry.label + ': ' +
        ((err && err.message) || err) + '.' + hint], true);
    });
}


// --- resize --------------------------------------------------------------
// Resizing changes both the pixel↔world scale and the visible extent, so the
// fills must be rebuilt too — not just the handle sizes.
function relayout() {
  applyViewBox();
  syncScreenScale();
  scheduleRecompute();
}
window.addEventListener('resize', relayout);
// A window resize is no longer the only thing that changes the map's size: the
// ad rail can appear, fill, or collapse without the window moving at all. Watch
// the box itself. ResizeObserver also fires once on observe, which does the
// initial sizing for free.
if (window.ResizeObserver) {
  new ResizeObserver(relayout).observe(document.getElementById('stage'));
}

// Touch targets need to be bigger than mouse ones.
if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
  CONFIG.grabRadiusPx = 24;
  CONFIG.handleRadiusPx = 10;
}

syncScreenScale();


// =========================================================================
// The game controller. Impure by definition — localStorage, the clipboard,
// the buttons and the clock. Every decision comes from the pure, tested
// functions at the top of this file.
// =========================================================================

// v2: the stored shape changed completely when the format went from five
// guesses on one stat to one guess on each of three. Old v1 rounds must never
// be fed to this code, and a bumped key is the cheapest way to guarantee it.
// Set from the active region and mode at boot; see storeKeyFor(). A `var`,
// not a const, because those two decide it.
var STORE_KEY = 'mapsplit-game-v2';
// What the player last chose. Kept apart from the score stores so clearing a
// day never loses the preferences, and vice versa.
var REGION_KEY = 'mapsplit-region';
var MODE_KEY = 'mapsplit-mode';

var puzzle = null;   // { n, date, spec, sides, target, stats: [...] }
var round = null;    // { ...puzzle, results: [ { stat, achieved, error, ... } ] }
var roundIndex = 0;  // which stat is being played

// Per-round, derived once when the stat's data lands: every point's position
// along the axis normal, plus the answer.
var axisValues = null;
var trueOffset = 0;
var centroid = null;
var truePlace = null;
var trueCoord = null;

var hudNo = document.getElementById('hud-no');
var hudTask = document.getElementById('hud-task');
var hudRound = document.getElementById('hud-round');
var hudDots = document.getElementById('hud-dots');
var hudHint = document.getElementById('hud-hint');
var regionPicker = document.getElementById('region-picker');
var modePicker = document.getElementById('mode-picker');
var MODE_ID = null;

// True when the chosen region has no puzzle table — the map is browsable but
// there is nothing to guess. Set once at boot; see bootGame().
var mapOnly = false;

// Built from REGIONS rather than written into the markup, so adding a region
// is one line in that table. A region with no statistics is NOT disabled: the
// whole point is being able to go and look at the map.
function renderRegions(activeId) {
  if (!regionPicker) return;
  regionPicker.textContent = '';
  REGIONS.forEach(function (r) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'region-btn' + (r.id === activeId ? ' is-active' : '');
    b.setAttribute('aria-pressed', r.id === activeId ? 'true' : 'false');
    var playable = isPlayableRegion(r);
    b.title = r.label + (playable ? '' : ' — map only, no statistics yet');
    b.setAttribute('aria-label', b.title);
    if (!playable) b.classList.add('is-maponly');
    var f = document.createElement('span');
    f.className = 'region-flag';
    f.setAttribute('aria-hidden', 'true');
    f.textContent = r.flag;
    b.appendChild(f);
    b.addEventListener('click', function () { switchRegion(r.id); });
    regionPicker.appendChild(b);
  });
}

// Normal / Pro. A segmented pair rather than a checkbox: both options have to
// be legible at once, because "Pro" alone says nothing about what changes.
function visibleModes() {
  return MODES.filter(function (m) { return !m.hidden; });
}

function renderModes(activeId) {
  if (!modePicker) return;
  modePicker.textContent = '';
  // One choice is no choice: with Pro hidden the picker disappears entirely.
  modePicker.hidden = visibleModes().length < 2;
  visibleModes().forEach(function (m) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mode-btn' + (m.id === activeId ? ' is-active' : '');
    b.setAttribute('aria-pressed', m.id === activeId ? 'true' : 'false');
    b.title = m.label + ' — ' + m.blurb;
    b.textContent = m.label;
    b.addEventListener('click', function () { switchMode(m.id); });
    modePicker.appendChild(b);
  });
}

// Switching either reloads the page. Half this module caches something derived
// from the projection or the puzzle — the drawn point arrays, the coastline
// paths, the tooltip's index, the answers, the solved offsets — and a reload
// is one line that cannot miss one of them, against an audit of a dozen caches
// that can. The page is small and both choices are persisted, so the reload
// lands where it should.
function switchTo(param, key, id) {
  try { localStorage.setItem(key, id); } catch (e) { /* private mode */ }
  var url = new URL(window.location.href);
  url.searchParams.set(param, id);
  window.location.replace(url.toString());
}

function switchRegion(id) {
  if (id !== REGION_ID) switchTo('r', REGION_KEY, id);
}

function switchMode(id) {
  if (id !== MODE_ID) switchTo('m', MODE_KEY, id);
}

var btnScores = document.getElementById('btn-scores');

function roundLocked() { return !round || roundIndex >= round.rounds.length; }

// The round in play. Axis, sides and target are per ROUND now, not per day, so
// a day can ask a North/South question and then a West/East one.
function currentRound() {
  return (round && round.rounds && round.rounds[roundIndex]) || null;
}
// The hand is an invitation to move the line, so it goes away the moment the
// line cannot be moved: during a reveal, once the day is done, and while the
// player is actually dragging (they have the idea by then, and it would sit
// under their finger).
// Is the line live? Map-only regions have no round, so roundLocked() is true
// for them, but the line still slides — that is the whole of what they offer.
// Committing is separately gated: commitGuess() bails on roundLocked(), so a
// map-only drag can never record a guess, and Enter there does nothing.
function playable() { return mapOnly || !roundLocked(); }

function gripVisible() {
  if (!axis || isRevealing() || drag) return false;
  return playable();
}

// One place decides whether the hand is on screen, called from everything that
// can change the answer: recompute (the line moved), endDrag, and renderHud
// (a guess was committed, or a round started).
function syncGrip() {
  if (grip) grip.style.display = gripVisible() ? '' : 'none';
}
// True between committing a guess and pressing Next: the answer is on screen,
// the line must not move and nothing may be committed.
function isRevealing() { return !toastEl.hidden; }

// Every localStorage call is wrapped: Safari private mode throws on write,
// quota can be full, and a hand-edited value can be unparseable. None of that
// is worth breaking the game over — the day just stops persisting.
function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch (e) { return {}; }
}

function saveRound() {
  if (!round) return;
  try {
    var all = loadStore();
    all[round.date] = { n: round.n, rounds: round.rounds.map(function (r) {
                          return { stat: r.stat, axis: r.axis, target: r.target };
                        }), results: round.results };
    var keys = Object.keys(all).sort();   // ISO dates sort lexicographically
    while (keys.length > 30) { delete all[keys.shift()]; }
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  } catch (e) { /* nothing to do, and nothing worth breaking */ }
}

function renderHud() {
  // No puzzle for this region: say so plainly and stop. There is no round to
  // describe, no pips to draw and nothing to commit — but the map is live and
  // the line still slides, so the hint has to stop promising a guess.
  if (mapOnly) {
    hudNo.textContent = 'MapSplit';
    hudRound.textContent = 'Map only';
    hudTask.textContent = (REGION ? REGION.flag + ' ' + REGION.label : 'This map') +
      ' has no statistics yet, so there is no puzzle here.';
    hudHint.textContent = '\u270B Drag the line to see the split — nothing is ' +
      'scored, and no guess is recorded.';
    hudDots.textContent = '';
    btnScores.hidden = true;
    syncGrip();
    return;
  }
  if (!round) return;
  hudNo.textContent = 'MapSplit #' + round.n;
  var done = roundLocked();
  var cur = currentRound();
  hudRound.textContent = done
    ? 'Complete'
    : (round.theme ? round.theme + ' \u00b7 ' : '') +
      'Round ' + (roundIndex + 1) + ' of ' + round.rounds.length;
  // "Find the line", not "hit 70%". The score is the distance from the correct
  // line, so the task has to be stated that way or the feedback contradicts it:
  // in a dense area a line 5 km out can still miss the share by nine points,
  // and calling that a bullseye reads as the game lying. Framed as finding a
  // line, being 5 km out IS nearly right, and the share is just the detail.
  hudTask.textContent = done
    ? 'Come back tomorrow for a new puzzle.'
    : 'Find the line that puts ' + cur.target + '% of ' +
      (cur.question || cur.stat) + ' ' + cur.sides[0].toLowerCase() + ' of it.';

  hudDots.textContent = '';
  for (var i = 0; i < round.rounds.length; i++) {
    var r = round.results[i];
    var dot = document.createElement('i');
    dot.className = 'g-dot' + (r ? (isSolved(r.km, GAME) ? ' g-hit' : ' g-used') : '');
    hudDots.appendChild(dot);
  }

  btnScores.hidden = round.results.length === 0;
  // No commit button any more — releasing the line is the commit. The hint
  // line under the task is what tells the player so, and it has nothing to
  // say once there is nothing left to drag.
  hudHint.hidden = done;
  syncGrip();
}

// The reveal happens ON THE MAP: the answer line sweeps into place and the
// toast sits over the stage. The page scrolls now, so a player who has scrolled
// down to read (or to the ad) would commit and see nothing. Bring the map back
// — but only when enough of it is actually off screen, so a player already
// looking at it is never yanked around.
function ensureStageVisible() {
  var stage = document.getElementById('stage');
  if (!stage) return;
  var r = stage.getBoundingClientRect();
  var vh = window.innerHeight || document.documentElement.clientHeight;
  var visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
  if (visible >= r.height * 0.5) return;
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    stage.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  } catch (e) {
    stage.scrollIntoView();   // older signature
  }
}

function commitGuess() {
  if (roundLocked() || !axisValues || !data || isRevealing()) return;
  ensureStageVisible();
  var cur = currentRound();
  var achieved = shareAbove(axisValues, data.weights, offset);
  var km = offsetGapKm(offset, trueOffset, cur.spec, centroid);
  var side = missSide(offset, trueOffset, cur.spec);

  var result = {
    stat: cur.stat,
    axis: cur.axis,                 // so the scorecard and the takeaway can
    sides: cur.sides,               // describe a round without the day's help
    target: cur.target,
    sideName: cur.sides[0],
    achieved: achieved,
    error: Math.abs(achieved - cur.target),   // reported, not scored
    km: km,
    side: side,
    points: scoreRound(km, GAME),
    place: truePlace,
    coord: trueCoord,
    trueOffset: trueOffset,
  };
  // How this round's ANSWER compares with the previous one — the insight the
  // three-statistic format exists to deliver. Measured against a FIXED
  // reference (the bbox centre), not either round's own centroid, so the two
  // lines are compared on one ruler.
  //
  // ONLY against a previous round on the SAME AXIS. "87 km south of the
  // Population line" is meaningless when one line is level and the other is
  // upright — they cross. takeawayText already drops the sentence when
  // crossKm is absent, so an axis change simply omits the comparison.
  var prev = null;
  for (var pi = round.results.length - 1; pi >= 0; pi--) {
    if (round.results[pi].axis === cur.axis) { prev = round.results[pi]; break; }
  }
  if (prev && isFinite(prev.trueOffset)) {
    var pb = CONFIG.padBbox;
    var ref = lngLatToMerc([(pb[0] + pb[2]) / 2, (pb[1] + pb[3]) / 2]);
    result.crossKm = offsetGapKm(trueOffset, prev.trueOffset, cur.spec, ref);
    result.crossSide = missSide(trueOffset, prev.trueOffset, cur.spec);
  }
  round.results.push(result);
  saveRound();

  // Reveal, and STOP. The round used to advance right here, which left no time
  // for the answer to animate or the fact to be read — the next round's data
  // landed and replaced both within a second. advanceRound() is now the only
  // way forward, and the player presses it.
  showToast(result, prev);
  animateAnswer(offset, trueOffset);
  renderHud();
}

// Sub-kilometre precision would be false: the gap is measured at one reference
// point on a projection whose scale varies along the line.
function fmtKm(km) {
  return km >= 10 ? Math.round(km) + ' km' : km.toFixed(1) + ' km';
}


// Fine control. Dragging resolves to roughly 2.4 km per pixel, and the
// bullseye is 10 km wide — about four pixels — so a mouse can reach it but not
// comfortably. Arrow keys nudge by one pixel's worth, Shift by ten, which puts
// an exact answer within reach of anyone willing to tap. Also the only way to
// play this without a pointing device at all.
document.addEventListener('keydown', function (e) {
  if (!axis || !resultModal.hidden) return;
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  // During the reveal the only meaningful key is the one that moves on.
  if (isRevealing()) {
    if (e.key === 'Enter' || e.key === ' ') { advanceRound(); e.preventDefault(); }
    return;
  }
  if (!playable()) return;
  var dx = 0, dy = 0;
  if (e.key === 'ArrowUp') dy = -1;
  else if (e.key === 'ArrowDown') dy = 1;
  else if (e.key === 'ArrowLeft') dx = -1;
  else if (e.key === 'ArrowRight') dx = 1;
  else if (e.key === 'Enter') { commitGuess(); e.preventDefault(); return; }
  else return;
  // Exactly what a drag of this many screen pixels would do: build the world
  // delta, project it onto the normal, discard the rest.
  var px = (e.shiftKey ? 10 : 1) * unitsPerPx;
  var along = (dx * axis.normal[0] + dy * axis.normal[1]) * px;
  setOffset(offset + along / WORLD_SCALE);
  e.preventDefault();
});
btnScores.addEventListener('click', function () { showResult(); });

// --- per-round setup -----------------------------------------------------

// Load the current stat's dataset, project every point onto the axis normal,
// and solve for the answer. The line resets to the middle of the country so
// every player meets every stat from the same starting position.
function startRound() {
  if (roundLocked()) return;
  axisValues = null;
  // The verdict and the takeaway deliberately SURVIVE into the next round.
  // commitGuess() advances the round immediately, so clearing them here would
  // wipe the result before the player could read it — and carrying the
  // takeaway forward is the point: knowing where the population line fell is
  // exactly what should inform the guess about tax. Costs ~90px of chrome on a
  // phone, which #topbar's max-height already caps.
  renderHud();

  var cur = currentRound();
  // The axis belongs to the ROUND, so it is adopted here rather than once at
  // boot. Everything that projects — onRoundData, the drag, the arrow keys —
  // reads this.
  axis = cur.spec;
  var entry = findDataset(cur.stat, CONFIG.datasets);
  if (!entry) {
    showNotice(['Round ' + (roundIndex + 1) + ' names a dataset that is not in ' +
      'the catalogue: ' + cur.stat], true);
    return;
  }
  // Groups ARE loaded: placeNearLine needs the names to say "a line through
  // Sheffield". What gets suppressed is only the note the ingest layer emits
  // about them (see showGameNotice) — the chatter was the problem, not the
  // data. Everything else the notice carries, like skipped rows, still shows.
  var opts = {};
  for (var k in entry) {
    if (Object.prototype.hasOwnProperty.call(entry, k)) opts[k] = entry[k];
  }

  // The game is HTTP-only by construction: its data is fetched, and fetch is
  // blocked under file://. There is deliberately no synthetic fallback —
  // scoring a player against different numbers from everyone else is worse
  // than telling them plainly that it did not load.
  loadDataset(opts, function (err) {
    showNotice(['Could not load round ' + (roundIndex + 1) + ' (' +
      ((err && err.message) || err) + '). The game must be served over HTTP.'], true);
  });
}

// Called by setSource once a round's features are in. Everything the grading
// needs is derived here, once, rather than per guess.
function onRoundData() {
  if (!round || !data || !axis) return;
  axisValues = mercPts.map(function (m) { return offsetOfPoint(m, axis); });
  trueOffset = targetOffset(axisValues, data.weights, currentRound().target);
  centroid = weightedCentroidMerc(mercPts, data.weights);
  truePlace = placeNearLine(axisValues, data.weights, data.groups,
                            data.groupNames, trueOffset, 20);
  trueCoord = lineCoordLabel(axis, trueOffset, CONFIG.padBbox);
  // Start at the middle of the country — from CONFIG.padBbox, NOT from the
  // viewport. The visible extent depends on the player's window aspect ratio,
  // and every player must meet every stat from the identical starting line or
  // the scores are not comparable.
  var pb = CONFIG.padBbox;
  var mid = lngLatToMerc([(pb[0] + pb[2]) / 2, (pb[1] + pb[3]) / 2]);
  setOffset(offsetOfPoint(mid, axis));
  renderHud();
}

// --- revealed answers on the map -----------------------------------------
// Derived entirely from round.results, so a resize just redraws them and there
// is no second copy of the truth to keep in sync. `animOffset` temporarily
// overrides the newest answer's position while it sweeps into place.
var answersG = document.getElementById('answers');
var animOffset = null;

function renderAnswers() {
  if (!round || !axis) return;
  var res = round.results;
  answersG.textContent = '';
  for (var i = 0; i < res.length; i++) {
    var t = (animOffset !== null && i === res.length - 1) ? animOffset : res[i].trueOffset;
    if (!isFinite(t)) continue;
    // Each revealed answer is drawn on ITS OWN axis. A day can mix them, and
    // drawing a North/South answer as a West/East line would be a lie the
    // player has no way to detect.
    var spec = (res[i].axis && axisSpec(res[i].axis)) || axis;
    var ep = lineAtOffset(spec, t, clipBbox);
    var a = lngLatToWorld(ep[0]), b = lngLatToWorld(ep[1]);
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    // Only the newest is 'fresh'; the rest fade back so they read as history.
    g.setAttribute('class', 'answer' + (i === res.length - 1 && isRevealing() ? ' fresh' : ''));
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a[0]); line.setAttribute('y1', a[1]);
    line.setAttribute('x2', b[0]); line.setAttribute('y2', b[1]);
    line.setAttribute('class', 'answer-line');
    g.appendChild(line);
    // The label is authored in screen pixels and scaled back by unitsPerPx, the
    // same trick the divider handles used, so it keeps a fixed on-screen size.
    var anchor = lngLatToWorld(lineEdgePoint(spec, t, labelBbox));
    var tag = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tag.setAttribute('class', 'answer-tag');
    tag.setAttribute('transform',
      'translate(' + anchor[0] + ' ' + anchor[1] + ') scale(' + unitsPerPx + ')');
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', 6); text.setAttribute('y', -5);
    text.textContent = res[i].stat;
    tag.appendChild(text);
    g.appendChild(tag);
    answersG.appendChild(g);
  }
}

// Sweep the answer from where the player left their line to where it belongs,
// so the size of the error is watched rather than read. Reduced motion, or a
// tab whose frames are suspended, still ends in the right place because the
// final state is written outside the animation.
var revealRAF = null;
var revealTimer = null;

// Stop any sweep and drop the visual override, so what is drawn is the real
// answer position again. Called before starting a sweep and whenever the
// reveal ends — animOffset must never outlive its animation.
function endAnswerAnimation() {
  if (revealRAF) { cancelAnimationFrame(revealRAF); revealRAF = null; }
  if (revealTimer) { clearTimeout(revealTimer); revealTimer = null; }
  animOffset = null;
}

function animateAnswer(fromOffset, toOffset) {
  endAnswerAnimation();
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || fromOffset === toOffset) { renderAnswers(); return; }
  animOffset = fromOffset;
  renderAnswers();
  var t0 = null, dur = 700;
  // requestAnimationFrame does not run in a hidden or occluded tab, so the
  // sweep can fail to advance a single frame — and then animOffset sits pinned
  // at the player's own line for the whole reveal, drawing the answer where
  // they guessed. A timer (which is throttled in a background tab but still
  // fires) guarantees the override is dropped and the truth is drawn.
  revealTimer = setTimeout(function () {
    endAnswerAnimation();
    renderAnswers();
  }, dur + 250);
  revealRAF = requestAnimationFrame(function frame(ts) {
    if (t0 === null) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    animOffset = fromOffset + (toOffset - fromOffset) * easeOutCubic(p);
    renderAnswers();
    if (p < 1) { revealRAF = requestAnimationFrame(frame); }
    else { endAnswerAnimation(); renderAnswers(); }
  });
}

// --- the toast ------------------------------------------------------------
var toastEl = document.getElementById('toast');
var toastVerdict = document.getElementById('toast-verdict');
var toastFact = document.getElementById('toast-fact');
var toastPoints = document.getElementById('toast-points');
var toastNext = document.getElementById('toast-next');

function showToast(result, prev) {
  toastVerdict.textContent = isSolved(result.km, GAME)
    ? 'Bullseye — ' + fmtKm(result.km) + ' from the answer.'
    : fmtKm(result.km) + ' too far ' + result.side.toLowerCase() + '.';
  toastVerdict.className = isSolved(result.km, GAME) ? 'fb-hit' : 'fb-miss';
  toastFact.textContent = takeawayText(result, prev, result.sides, result.target);
  toastPoints.textContent = result.points + ' pts';
  toastNext.textContent = (roundIndex + 1 >= round.rounds.length)
    ? 'See today\'s result'
    : 'Next round →';
  toastEl.hidden = false;
  toastNext.focus();
}

function advanceRound() {
  if (toastEl.hidden) return;
  // Kill the sweep FIRST. requestAnimationFrame does not run in a hidden or
  // occluded tab, so a reveal that is never animated would otherwise leave
  // animOffset pinned at the player's own line — and the answer would be drawn
  // where they guessed rather than where it is. A pretty animation must never
  // be what decides whether the map tells the truth.
  endAnswerAnimation();
  toastEl.hidden = true;
  roundIndex++;
  renderAnswers();          // the freshly revealed line fades back with the rest
  if (roundLocked()) { renderHud(); showResult(); return; }
  startRound();
}
toastNext.addEventListener('click', advanceRound);

// --- the result dialog ---------------------------------------------------
var resultModal = document.getElementById('result-modal');
var resTitle = document.getElementById('res-title');
var resLine = document.getElementById('res-line');
var resRows = document.getElementById('res-rows');
var resScore = document.getElementById('res-score');
var btnShare = document.getElementById('btn-share');
var shareNote = document.getElementById('share-note');
var resLearn = document.getElementById('res-learn');
var resLearnHead = document.getElementById('res-learn-head');

function showResult() {
  if (!round) return;
  var total = scoreDay(round.results, GAME);
  var max = dayMaxPoints(GAME, round.rounds.length);
  var hits = round.results.filter(function (r) { return isSolved(r.km, GAME); }).length;

  resTitle.textContent = roundLocked() ? 'Today\'s result' : 'So far today';
  // The axis and the target vary by round now, so the summary line describes
  // the DAY rather than restating one question: how many axes it used, and
  // how it went.
  var axesUsed = [];
  round.rounds.forEach(function (r) {
    var name = r.sides[0] + '/' + r.sides[1];
    if (axesUsed.indexOf(name) < 0) axesUsed.push(name);
  });
  resLine.textContent = axesUsed.join(' + ') +
    (hits ? ' · ' + hits + ' bullseye' + (hits > 1 ? 's' : '') : '');

  resRows.textContent = '';
  round.results.forEach(function (r) {
    var row = document.createElement('li');
    var bar = document.createElement('span');
    bar.className = 'r-bar';
    bar.textContent = guessBar(r.km, GAME);
    var name = document.createElement('span');
    name.className = 'r-name';
    name.textContent = r.stat;
    var detail = document.createElement('span');
    detail.className = 'r-detail';
    detail.textContent = axisGlyph(r.axis) + ' ' + r.target + '% ' + r.sideName + ' · ' +
      (isSolved(r.km, GAME) ? 'bullseye, ' + fmtKm(r.km) : fmtKm(r.km) + ' ' + r.side.toLowerCase()) +
      ' · put ' + r.achieved.toFixed(1) + '% · ' + r.points + ' pts';
    row.appendChild(bar); row.appendChild(name); row.appendChild(detail);
    resRows.appendChild(row);
  });

  // "What you learned today" — the whole reason a zero-point day is not a
  // wasted one.
  resLearn.textContent = '';
  round.results.forEach(function (r, i) {
    var text = takeawayText(r, i > 0 ? round.results[i - 1] : null,
                            r.sides, r.target);
    if (!text) return;
    var li = document.createElement('li');
    li.textContent = text;
    resLearn.appendChild(li);
  });
  resLearnHead.hidden = resLearn.children.length === 0;

  resScore.textContent = groupDigits(total) + ' / ' + groupDigits(max) + ' points';
  shareNote.hidden = true;
  btnShare.hidden = !roundLocked();   // nothing to share mid-day
  resultModal.hidden = false;
  (roundLocked() ? btnShare : document.getElementById('result-close')).focus();
}

function closeResult() { resultModal.hidden = true; }
document.getElementById('result-close').addEventListener('click', closeResult);
resultModal.addEventListener('click', function (e) {
  if (e.target === resultModal) closeResult();
});
document.addEventListener('keydown', function (e) {
  if (!resultModal.hidden && e.key === 'Escape') closeResult();
});

// Share sheet on mobile, clipboard elsewhere. Both can fail or be refused, and
// neither failure should look like the game broke — the grid is already on
// screen and selectable, so the fallback is to say so.
function doShare() {
  var text = shareText(round, GAME);
  function note(msg) { shareNote.textContent = msg; shareNote.hidden = false; }
  if (navigator.share) {
    navigator.share({ text: text }).catch(function () { /* user cancelled */ });
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      function () { note('Copied to clipboard.'); },
      function () { note('Could not copy automatically — select the rows above.'); }
    );
    return;
  }
  note('Copying is not available here — select the rows above.');
}
btnShare.addEventListener('click', doShare);

// Fetch the puzzle list. FAIL LOUDLY: a list that half-loads, or that
// silently falls back to a different set of days, would score players against
// different numbers from each other — worse than telling them plainly that it
// did not load. The built-in table is a fallback only for a region that
// declares no file at all.
//
// A region with gamesUrl loads the statistics catalogue (stats.json) and the
// schedule for the year of `dateStr`. If that year's file is missing it tries
// the year before: the rotation fallback in puzzleForDate then keeps the game
// playing — a stale puzzle beats no puzzle on 1 January.
function fetchJson(url) {
  return fetch(url).then(function (r) {
    if (!r.ok) throw new Error(url + ': HTTP ' + r.status);
    return r.json();
  });
}

function loadPuzzleList(region, dateStr, cb) {
  if (region && region.gamesUrl) {
    var year = Number(String(dateStr).slice(0, 4));
    fetchJson(region.statsUrl).then(function (stats) {
      var catalogue = catalogueFromStats(stats, region.dataBase);
      return fetchJson(region.gamesUrl + gamesFileFor(dateStr))
        .catch(function () { return fetchJson(region.gamesUrl + (year - 1) + '.json'); })
        .then(function (games) {
          // The runtime catalogue REPLACES the sample one: rounds name
          // statistics by label, and every label now comes from stats.json.
          CONFIG.datasets = catalogue;
          cb(null, parseGamesJson(games, catalogue));
        });
    }).catch(function (e) { cb(e); });
    return;
  }
  if (!region || !region.puzzleUrl) return cb(null, null);
  fetch(region.puzzleUrl)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (text) {
      var list;
      try { list = parsePuzzleCsv(text, CONFIG.datasets); }
      catch (e) { return cb(e); }
      cb(null, list);
    })
    .catch(function (e) { cb(e); });
}

// --- preview: check any day without touching real scores ------------------
// ?date=YYYY-MM-DD plays that day's puzzle instead of today's. It is for the
// owner checking a schedule, so: scores go to a SEPARATE store (a previewed
// future day must not count as played when it arrives), and a bar offers the
// previous / next day. Nothing is hidden by it — the schedule file is public
// anyway — but it is not linked from anywhere.
var PREVIEW_DATE = (function () {
  var d = new URLSearchParams(window.location.search).get('date');
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d + 'T00:00:00Z')) ? d : null;
})();

function playDate() {
  return PREVIEW_DATE || utcDateString(Date.now());
}

function renderPreviewBar(puzzle) {
  if (!PREVIEW_DATE) return;
  var bar = document.getElementById('preview-bar') || document.createElement('div');
  bar.id = 'preview-bar';
  bar.textContent = '';
  var link = function (label, date) {
    var a = document.createElement('a');
    var url = new URL(window.location.href);
    if (date) url.searchParams.set('date', date); else url.searchParams.delete('date');
    a.href = url.toString();
    a.textContent = label;
    return a;
  };
  var t = Date.parse(PREVIEW_DATE + 'T00:00:00Z');
  bar.appendChild(link('\u2190 ' + utcDateString(t - 86400000), utcDateString(t - 86400000)));
  var mid = document.createElement('span');
  mid.textContent = 'Preview: ' + PREVIEW_DATE +
    (puzzle && puzzle.theme ? ' \u00b7 ' + puzzle.theme : '') + ' \u00b7 scores kept apart';
  bar.appendChild(mid);
  bar.appendChild(link(utcDateString(t + 86400000) + ' \u2192', utcDateString(t + 86400000)));
  bar.appendChild(link('Today', null));
  var hud = document.getElementById('hud');
  if (hud && !bar.parentNode) hud.parentNode.insertBefore(bar, hud);
}

// --- go ------------------------------------------------------------------
// Boot is asynchronous now: the coastline is a separate file per region, so
// nothing can be projected, measured or drawn until it has arrived.
(function boot() {
  var params = new URLSearchParams(window.location.search);
  var saved = null;
  try { saved = localStorage.getItem(REGION_KEY); } catch (e) { /* private mode */ }
  var savedMode = null;
  try { savedMode = localStorage.getItem(MODE_KEY); } catch (e) { /* private mode */ }
  var id = resolveChoice(REGIONS, params.get('r'), saved);
  var region = findById(REGIONS, id);
  MODE_ID = resolveChoice(visibleModes(), params.get('m'), savedMode);
  var mode = findById(MODES, MODE_ID);
  try { localStorage.setItem(MODE_KEY, MODE_ID); } catch (e) { /* private mode */ }
  renderRegions(id);
  renderModes(MODE_ID);

  loadRegionCoast(id, function (err, reg) {
    if (err || !reg) {
      showNotice(['Could not load the map for ' + (region ? region.label : id) +
        ' (' + ((err && err.message) || 'unknown error') + ').'], true);
      return;
    }
    // Remember the choice only once its map has actually loaded, so a broken
    // or missing coast file cannot leave the player stuck on it every visit.
    try { localStorage.setItem(REGION_KEY, id); } catch (e) { /* private mode */ }

    useRegion(reg);
    STORE_KEY = storeKeyFor(id, MODE_ID) + (PREVIEW_DATE ? '-preview' : '');
    applyViewBox();
    drawCoast();
    syncScreenScale();

    loadPuzzleList(region, playDate(), function (perr, list) {
      if (perr) {
        showNotice(['Could not load the puzzle list (' + perr.message + '). ' +
          'The game needs data/stats.json and data/games/, served over HTTP.'], true);
        return;
      }
      // The file replaces the region's table for this session only — REGIONS
      // keeps its built-in list, which is what the tests measure.
      var active = list
        ? { id: region.id, label: region.label, flag: region.flag, puzzles: list }
        : region;
      GAME = sessionGame(GAME, active, mode);
      bootGame(active);
    });
  });
})();

// How far into the day a restored save is — needed before `round` exists, to
// pick the axis the map should open on.
function roundIndexForRestore(puzzle, saved) {
  var n = (saved && saved.results && saved.results.length) || 0;
  return Math.min(n, puzzle.rounds.length - 1);
}

function bootGame(region) {
  mapOnly = !isPlayableRegion(region);
  if (mapOnly) {
    // No round, no data, no scoring — but a live map. The axis has to be set
    // to something or there is no line to drag, so take it from the region's
    // own shape: a wide frame (the US, the world) previews West/East and a
    // tall one (the UK, the EU) previews North/South. A preview stuck on the
    // wrong axis undersells the map it is previewing — splitting the US
    // north/south is not the interesting question about the US.
    axis = axisSpec(REGION.viewBox[2] > REGION.viewBox[3] ? 'we' : 'ns');
    var pb = CONFIG.padBbox;
    setOffset(offsetOfPoint(lngLatToMerc([(pb[0] + pb[2]) / 2, (pb[1] + pb[3]) / 2]), axis));
    renderHud();
    return;
  }
  puzzle = puzzleForDate(playDate(), GAME);
  renderPreviewBar(puzzle);
  if (!puzzle) {
    showNotice(['No puzzle is configured for today.'], true);
    return;
  }
  var saved = loadStore()[puzzle.date];
  round = {
    n: puzzle.n, date: puzzle.date, theme: puzzle.theme, rounds: puzzle.rounds,
    results: (saved && saved.results) || [],
  };
  axis = puzzle.rounds[Math.min(roundIndexForRestore(puzzle, saved), puzzle.rounds.length - 1)].spec;
  roundIndex = Math.min(round.results.length, round.rounds.length);
  // A finished day restores with the LAST round's axis, so the line it draws
  // matches the answer it is showing.
  axis = round.rounds[Math.min(roundIndex, round.rounds.length - 1)].spec;
  renderHud();
  if (roundLocked()) {
    // A finished day restored from storage: the map still shows where every
    // answer was, so the result dialog is not the only record of it.
    if (round.results.length) setOffset(round.results[round.results.length - 1].trueOffset);
    showResult();
    return;
  }
  startRound();
}

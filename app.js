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
  // supported shape, small enough to read in a text editor. They double as the
  // format documentation. Delete them once real data is wired in.
  datasets: [
    { label: 'Population (LA 🇬🇧)', unit: 'people',
      url: 'data/samples/LA.csv', type: 'csv',
      weightColumn: 'Population2024', groupColumn: 'Name',
      sources: [
        { label: 'One point per UK local authority. Centroids from Local Authority District (May 2025) boundaries',
          url: 'https://geoportal.statistics.gov.uk/datasets/local-authority-districts-may-2025-boundaries-uk-bfe-v2/explore' },
        { label: 'ONS mid-year population estimates',
          url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland' },
      ] },
      { label: 'Population (LA 🇬🇧, grouped)', unit: 'people',
      url: 'data/samples/LA-grouped.csv', type: 'csv',
      weightColumn: 'Population2024', groupColumn: 'Nation',
      sources: [
        { label: 'As Population (LA), but grouped by Nation in "What\'s being counted". Centroids from Local Authority District (May 2025) boundaries',
          url: 'https://geoportal.statistics.gov.uk/datasets/local-authority-districts-may-2025-boundaries-uk-bfe-v2/explore' },
        { label: 'ONS mid-year population estimates',
          url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland' },
      ] },
      { label: 'Population (LSOA 🏴󠁧󠁢󠁥󠁮󠁧󠁿 + 🏴󠁧󠁢󠁷󠁬󠁳󠁿)', unit: 'people',
      url: 'data/samples/LSOA.csv', type: 'csv',
      weightColumn: 'Population', groupColumn: 'LSOA21NM',
      sources: [
        { label: 'One point per Lower-layer Super Output Area in England & Wales. Centroids from LSOA (December 2021) boundaries',
          url: 'https://geoportal.statistics.gov.uk/datasets/ons::lower-layer-super-output-areas-december-2021-boundaries-ew-bsc-v4-2/about' },
        { label: 'ONS LSOA mid-year population estimates (mid-2024)',
          url: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/lowersuperoutputareamidyearpopulationestimates' },
      ] },
      { label: 'HMRC 🇬🇧 Self-Employed', unit: 'people',
      url: 'data/samples/HMRC.csv', type: 'csv',
      weightColumn: 'Self-employment income: Number of individuals', groupColumn: 'Name',
      sources: HMRC_SOURCES },
      { label: 'HMRC 🇬🇧 Employed', unit: 'people',
      url: 'data/samples/HMRC.csv', type: 'csv',
      weightColumn: 'Employment income: Number of individuals', groupColumn: 'Name',
      sources: HMRC_SOURCES },
      { label: 'HMRC 🇬🇧 Retired', unit: 'people',
      url: 'data/samples/HMRC.csv', type: 'csv',
      weightColumn: 'Pension income: Number of individuals', groupColumn: 'Name',
      sources: HMRC_SOURCES },
      { label: 'HMRC 🇬🇧 Taxpayers', unit: 'people',
      url: 'data/samples/HMRC.csv', type: 'csv',
      weightColumn: 'Total tax: Number of individuals', groupColumn: 'Name',
      sources: HMRC_SOURCES },
      { label: 'HMRC 🇬🇧 Tax Amount', unit: 'GBP',
      url: 'data/samples/HMRC.csv', type: 'csv',
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
/* END PURE */

// =========================================================================
// Rendering + interaction. DOM-bound; replaces the prototype's map.js,
// divider.js and ui.js.
// =========================================================================

var COAST = {"viewBox":[0,0,29306,55249],"GBR":["M6562 54758L6535 54777L6502 54760L6507 54700L6531 54665L6572 54720L6562 54758Z","M20428 51018L20849 51191L20947 51195L20980 51221L20980 51281L21020 51281L21077 51371L21077 51404L21041 51433L20893 51486L20799 51576L20782 51762L20474 51854L20373 51825L19900 51474L19868 51461L19763 51474L19668 51523L19735 51400L19845 51306L20087 51191L20068 51251L20136 51243L20201 51189L20296 51071L20365 51023L20428 51018Z","M21420 50951L21420 50984L21192 50951L21192 50922L21254 50896L21326 50769L21361 50771L21395 50822L21361 50864L21361 50891L21420 50951Z","M11074 49290L11054 49312L11032 49281L11028 49221L11038 49165L11052 49157L11074 49290Z","M26629 48375L26560 48405L26235 48377L26181 48356L26132 48307L26066 48192L26102 48070L26122 48043L26158 48033L26529 48168L26618 48256L26645 48322L26629 48375Z","M11095 39512L11177 39507L11277 39616L11313 39734L11365 39824L11351 39874L11328 39885L11300 39874L11243 39822L11160 39683L11037 39673L10989 39591L10989 39559L11063 39493L11095 39512Z","M12352 39611L12387 39620L12521 39591L12578 39525L12644 39559L12764 39565L12798 39591L12741 39654L12644 39836L12439 39923L12373 39974L12305 40062L12300 40151L12280 40151L12182 40222L12138 40277L11932 40393L11827 40354L11809 40380L11770 40383L11772 40274L11847 40150L11817 40130L11775 40151L11714 40240L11673 40257L11579 40162L11541 40162L11529 40016L11473 39963L11380 39781L11330 39718L11365 39310L11359 39242L11330 39173L11379 39136L11735 39014L12015 39048L12148 39134L12175 39283L12265 39334L12263 39418L12320 39493L12352 39611Z","M6139 30393L6206 30414L6311 30344L6381 30361L6695 30528L6917 30462L7025 30482L7081 30508L7230 30673L7258 30725L7248 30996L7189 31180L7210 31224L7351 31234L7393 31252L7429 31283L7449 31327L7444 31415L7394 31595L7399 31628L7480 31642L7555 31681L7621 31743L7677 31826L7724 31973L7808 32057L7858 32144L7915 32406L8068 32484L8134 32584L8151 32584L8101 32481L7923 32291L7967 32208L8051 32232L8137 32308L8189 32387L8223 32539L8215 32674L8175 32780L8113 32850L8031 32891L7865 32941L7791 32981L7718 33048L7563 33309L7597 33332L7618 33440L7653 33444L7808 33229L8061 33081L8148 33132L8209 33138L8543 33083L8592 33166L8648 33192L8710 33477L8743 33547L8790 33574L8809 33614L8837 33868L8942 34017L8923 34063L8934 34133L8866 34245L8849 34304L8868 34383L8858 34462L8794 34531L8780 34569L8820 34622L8779 34645L8744 34712L8706 34719L8673 34685L8619 34524L8586 34507L8537 34411L8532 34358L8551 34302L8615 34220L8629 34148L8618 33999L8589 33889L8541 33808L8348 33622L8273 33579L8189 33574L8209 33654L8202 33701L8151 33771L8190 33772L8266 33833L8370 33841L8401 33868L8295 33898L8277 33919L8361 33967L8348 34080L8365 34120L8401 34133L8380 34198L8401 34228L8302 34521L8200 34604L8170 34654L8282 34612L8411 34535L8529 34502L8610 34589L8637 34770L8603 34908L8529 35016L8437 35112L8380 35112L8361 35210L8317 35235L8296 35229L8287 35192L8253 35157L8092 35143L7974 35155L7744 35231L7728 35288L7726 35560L7656 35828L7606 35892L7489 35951L7404 36043L7285 36133L7249 36151L7140 36160L7096 36152L7047 36116L7047 36087L7125 36054L6877 35972L6845 35885L6629 35828L6611 35860L6570 35826L6452 35860L6398 35804L6375 35800L6339 35863L6342 35968L6312 36024L6156 36062L6109 36000L6032 36003L5794 36092L5708 36076L5649 36147L5609 36126L5493 36000L5536 35889L5539 35835L5510 35780L5572 35700L5598 35613L5582 35528L5519 35453L5432 35386L5399 35381L5325 35454L5292 35451L5173 35362L5072 35222L5034 35089L5009 35060L4911 35009L4959 34983L4982 34935L4977 34866L4917 34703L4845 34667L4800 34554L4628 34409L4534 34361L4447 34369L4365 34449L4230 34664L4139 34733L4068 34725L4049 34735L4070 34821L4030 34884L3996 34881L4003 34932L4096 34978L4079 35045L4178 35129L4140 35183L4157 35261L4098 35300L3946 35340L3891 35388L3858 35467L3897 35508L3901 35533L3846 35561L3851 35656L3805 35726L3767 35746L3757 35728L3762 35542L3678 35592L3658 35616L3658 35648L3721 35781L3675 35786L3540 35740L3487 35747L3461 35684L3401 35675L3432 35634L3362 35628L3248 35719L3188 35731L2892 35661L2859 35637L2845 35556L2826 35525L2626 35374L2411 35376L2258 35355L2204 35322L2168 35248L2157 35038L2138 34962L2097 34931L1942 34897L1858 34774L1799 34625L1719 34624L1649 34587L1399 34277L1372 34238L1358 34162L1323 34129L1388 34093L1536 34049L1604 34008L1799 33738L2010 33788L2119 33793L2225 33751L2502 33486L2617 33447L2610 33351L2580 33343L2490 33398L2447 33381L2319 33278L2255 33318L2232 33317L2182 33232L2065 33173L2042 33123L2064 33051L2001 33003L2139 32934L2234 32838L2272 32840L2351 32910L2443 32958L2537 32951L2633 32896L2779 32771L2874 32798L2957 32772L3009 32801L3075 32787L3051 32724L3074 32539L3275 32288L3319 32202L3348 32099L3336 31925L3347 31868L3369 31838L3425 31815L3448 31776L3436 31613L3447 31578L3469 31565L3458 31522L3536 31400L3597 31341L3775 31314L3843 31224L3897 31204L3870 31294L3914 31296L4040 31258L4090 31264L4211 31327L4307 31341L4403 31327L4536 31195L4556 31044L4589 30964L4653 30883L4687 30595L4731 30591L4906 30695L5265 30677L5582 30528L5774 30514L5917 30371L5977 30339L6039 30332L6139 30393Z","M6877 30062L6884 30115L6866 30176L6820 30262L6839 30159L6775 30104L6573 30096L6635 30045L6704 30026L6877 30062Z","M9812 29398L9685 29422L9535 29407L9408 29362L9293 29289L9179 29188L9141 28954L9141 28920L9179 28856L9058 28660L9034 28542L9048 28383L9085 28277L9152 28171L9238 28095L9332 28078L9313 28007L9408 28007L9588 28098L9637 28145L9694 28237L9733 28342L9789 28585L9757 28651L9877 28776L9884 28887L9791 28922L9806 28987L9942 29057L9881 29101L9922 29322L9883 29367L9812 29398Z","M10113 27975L10094 28007L10059 28005L9999 27876L9818 27703L9751 27419L9655 27352L9637 27316L9581 27154L9585 27076L9675 27028L9846 27197L9914 27232L9930 27345L9999 27400L10033 27466L10078 27598L10107 27752L10056 27876L10107 27934L10113 27975Z","M7077 27472L7085 27621L7103 27667L7223 27792L7199 27909L7232 27954L7277 27976L7271 28088L7296 28209L7234 28247L7199 28316L7182 28279L7132 28356L6995 28456L6917 28481L6798 28462L6763 28481L6742 28585L6634 28692L6563 28718L6497 28694L6458 28585L6474 28473L6535 28403L6685 28316L6626 28142L6591 28100L6458 28044L6470 27955L6667 27741L6606 27710L6527 27696L6448 27709L6392 27757L6287 28010L6198 28072L6075 28246L5997 28259L5962 28212L5965 28131L6001 28044L5961 28007L5991 27926L6115 27741L6022 27673L6081 27610L6103 27424L6124 27385L6225 27312L6376 27243L6441 27181L6477 27197L6456 27229L6422 27400L6442 27489L6463 27525L6497 27535L6477 27404L6536 27294L6626 27204L6725 27145L6794 27049L6910 26990L6972 26926L7000 26936L7027 26985L7077 27472Z","M6991 26075L6901 26230L6869 26330L6877 26418L6821 26460L6745 26482L6669 26480L6611 26449L6655 26413L6715 26229L6790 26124L6810 26107L6854 26125L6877 26106L6856 26041L6978 26015L6991 26075Z","M7972 26532L7738 26999L7677 27197L7648 27186L7579 27274L7533 27298L7513 27336L7466 27603L7396 27653L7287 27646L7188 27579L7144 27454L7120 27216L7125 27130L7152 27052L7241 26993L7368 26875L7586 26832L7677 26754L7415 26785L7373 26705L7408 26591L7486 26463L7571 26357L7628 26313L7712 26287L8065 25930L8150 25873L8210 25902L8224 26079L8083 26255L7972 26532Z","M8124 25825L8058 25833L8088 25752L8227 25629L8268 25744L8211 25796L8124 25825Z","M8437 25322L8443 25392L8394 25537L8368 25693L8340 25662L8287 25527L8316 25479L8346 25360L8380 25322L8408 25351L8437 25322Z","M8515 25011L8457 25154L8475 25220L8412 25259L8360 25225L8342 25145L8380 25045L8415 25018L8478 25030L8515 25011Z","M8742 24532L8700 24618L8649 24677L8589 24706L8515 24703L8545 24623L8589 24566L8676 24570L8716 24560L8742 24532Z","M6917 24288L6771 24297L6702 24286L6629 24220L6689 24137L6763 24117L6887 24230L6917 24288Z","M4912 24415L4854 24418L4680 24337L4611 24117L4672 24082L4860 24051L5025 23960L5230 23891L5300 23894L5335 23982L5296 24046L5128 24067L5123 24151L5068 24199L4946 24238L4896 24326L4912 24415Z","M7268 23536L7337 23638L7449 23910L7465 24004L7772 24014L7835 24081L7878 24051L7932 24051L8037 24185L8134 24185L8166 24211L8235 24316L8248 24377L8268 24388L8309 24378L8338 24398L8323 24497L8227 24463L8292 24568L8312 24637L8277 24669L8186 24671L8146 24651L8151 24597L8134 24576L8077 24566L8086 24632L8053 24691L7961 24772L7961 24809L8056 24753L8160 24737L8206 24761L8187 24816L8139 24875L7892 25044L7783 25071L7694 25011L7768 24920L7772 24874L7749 24847L7715 24850L7647 24874L7598 24961L7478 24999L7257 25113L7178 25193L7077 25148L6953 25220L6695 25220L6649 25306L6620 25322L6528 25299L6451 25253L6401 25198L6361 25121L6344 25028L6369 24957L6429 24916L6499 24902L6554 24912L6674 25081L6725 25045L6725 25011L6667 24977L6717 24954L6843 24983L6934 24915L7125 24874L7250 24783L7303 24728L7286 24703L7231 24718L7068 24809L6933 24844L6864 24839L6810 24790L6797 24737L6836 24649L6903 24625L6924 24601L6986 24425L7010 24395L7135 24395L7300 24316L7334 24288L7352 24189L7315 24117L7136 24210L7077 24220L7007 24264L6877 24051L6820 24018L6560 23973L6506 23947L6422 23873L6554 23773L6474 23662L6458 23601L6560 23591L6649 23529L6698 23588L6722 23588L6742 23566L6749 23468L6831 23404L7030 23359L7069 23386L7199 23428L7182 23529L7268 23536Z","M5794 23638L5649 23757L5603 23773L5503 23743L5478 23842L5453 23814L5411 23704L5488 23690L5561 23617L5718 23370L5808 23302L5873 23273L5956 23200L6077 23170L6104 23185L6001 23428L5958 23480L5897 23497L5794 23638Z","M3522 21666L3546 21690L3466 21687L3442 21705L3355 21791L3370 21838L3346 21872L3303 21892L3260 21898L3079 21863L3037 21841L3038 21793L3070 21743L3149 21698L3162 21645L3155 21587L3127 21550L3195 21500L3262 21485L3314 21441L3336 21303L3432 21373L3375 21481L3489 21550L3522 21666Z","M6611 21512L6611 21550L6685 21550L6648 21736L6594 21841L6518 21888L6411 21898L6362 21871L6316 21749L6235 21701L6148 21610L6096 21582L6263 21388L6349 21318L6458 21303L6603 21397L6664 21467L6611 21512Z","M5928 21343L5838 21359L5677 21338L5816 21244L5868 21230L5900 21259L5968 21277L6001 21303L5928 21343Z","M7568 20109L7476 20146L7403 20115L7339 20047L7322 19976L7389 19935L7484 19955L7557 20029L7568 20109Z","M3603 19510L3851 19685L3808 19706L3754 19685L3754 19721L3816 19733L3903 19817L3965 19826L3965 19861L3888 19902L3828 19873L3777 19822L3662 19752L3553 19615L3489 19650L3540 19715L3554 19782L3689 19826L3735 19899L3777 19920L3906 19935L3995 20041L4040 20037L4027 20112L3935 20198L3870 20391L3816 20416L3603 20359L3603 20391L3781 20446L3830 20496L3867 20683L3861 20785L3830 20846L3782 20815L3729 20806L3622 20811L3622 20846L3813 20846L3861 20887L3928 20983L3984 20989L3984 21021L3919 21089L3690 21041L3603 21094L3522 20998L3498 20943L3426 20674L3416 20591L3432 20496L3385 20428L3318 20391L3375 20313L3431 20117L3444 20087L3480 20075L3501 20004L3394 19615L3449 19574L3603 19510Z","M3771 19111L3851 19122L3830 19157L3854 19179L3927 19157L4022 19228L4004 19260L3967 19237L3904 19295L3851 19298L3866 19349L3890 19369L3994 19385L4016 19420L4013 19455L3772 19527L3699 19510L3483 19376L3451 19316L3465 19219L3502 19139L3557 19090L3622 19087L3689 19123L3723 19117L3754 19087L3771 19111Z","M7410 19048L7312 19457L7315 19615L7375 19738L7390 19822L7209 19930L7161 19899L7182 19826L7152 19783L7169 19365L7190 19279L7235 19238L7315 19228L7315 19193L7258 19087L7289 19054L7317 19051L7373 19087L7373 19048L7334 18978L7380 18998L7410 19048Z","M7450 18859L7449 18942L7406 18919L7389 18864L7396 18795L7429 18730L7410 18692L7448 18638L7467 18635L7486 18660L7450 18859Z","M4058 18231L4103 18260L4187 18215L4224 18243L4326 18247L4378 18276L4403 18341L4308 18479L4269 18472L4220 18395L4108 18302L3984 18302L3984 18341L4035 18355L4022 18447L4102 18441L4127 18465L4155 18583L4200 18584L4289 18553L4234 18667L4167 18715L4004 18730L3927 18765L3870 18660L3834 18670L3716 18765L3716 18804L3916 18804L4080 18756L4183 18784L4211 18836L4146 18978L3973 18979L3927 19016L3882 18981L3785 18989L3735 18978L3699 18947L3622 18804L3699 18765L3608 18757L3440 18646L3355 18624L3317 18681L3275 18687L3070 18553L3070 18518L3133 18473L3260 18196L3319 18229L3508 18196L3508 18231L3432 18267L3482 18334L3716 18057L3716 18090L3660 18196L3811 18260L3870 18267L3870 18231L3813 18196L3872 18170L4003 18071L4079 18057L4113 18106L4124 18154L4107 18198L4058 18231Z","M6497 17983L6546 18071L6638 18161L6715 18302L6839 18409L6892 18478L6934 18571L6991 19157L6953 19421L6938 19460L6864 19533L6839 19580L6919 19513L6968 19495L7010 19510L7034 19562L6972 19685L6985 19771L7085 19899L7065 19945L6934 20037L7172 20005L7235 20023L7247 20065L7214 20112L7144 20146L7144 20181L7338 20134L7426 20218L7533 20215L7574 20236L7637 20359L7677 20363L7734 20286L7849 20291L7928 20211L8006 20182L8087 20183L8134 20248L8341 20248L8295 20375L8308 20464L8276 20555L8220 20633L8119 20719L8077 20741L7967 20752L7947 20787L7942 20900L7916 20970L7772 21076L7587 21346L7490 21428L7342 21457L7303 21439L7277 21373L7285 21285L7360 21174L7353 21094L7492 20842L7523 20811L7791 20674L7791 20639L7636 20705L7399 20709L7384 20696L7373 20601L7308 20489L7239 20426L7296 20601L7248 20712L7220 20741L7239 20779L7156 20929L7115 20951L7079 20911L7047 20639L7010 20604L6972 20639L6904 20572L6877 20569L6877 20601L6917 20643L6869 20676L6477 20779L6477 20741L6592 20601L6592 20569L6491 20580L6401 20639L6306 20461L6363 20428L6401 20359L6274 20371L6227 20357L6096 20181L6022 20005L6204 19888L6267 19899L6423 20058L6497 20075L6461 20007L6233 19801L6201 19794L6075 19826L6115 19794L6115 19756L6039 19721L6075 19685L6031 19644L6039 19545L5998 19556L5906 19650L5923 19557L5887 19471L5864 19539L5800 19574L5774 19615L5769 19674L5800 19768L5794 19826L5748 19866L5493 19778L5428 19734L5376 19671L5329 19463L5213 19375L5184 19260L5354 19260L5291 19159L5286 19097L5306 19032L5344 18976L5372 18961L5399 18978L5589 19276L5639 19316L5676 19324L5660 19228L5696 19193L5608 19068L5609 19025L5635 19015L5663 18972L5794 19016L5767 18922L5696 18840L5611 18784L5542 18765L5608 18637L5614 18563L5582 18518L5582 18479L5639 18480L5710 18566L5772 18608L5794 18730L5821 18763L5969 18851L6070 18970L6192 18942L6129 19096L6157 19105L6216 19028L6249 18926L6286 18945L6497 19228L6497 19193L6458 19122L6459 19051L6325 18871L6279 18763L6362 18553L6296 18554L6249 18518L6261 18447L6210 18341L6206 18279L6213 18262L6362 18164L6422 18002L6458 18019L6497 17983Z","M4111 17919L4031 17956L3965 17948L4083 17817L4136 17805L4161 17861L4111 17919Z","M225 17438L164 17452L109 17411L81 17304L124 17340L225 17354L272 17379L225 17438Z","M4591 16876L4592 16989L4558 17010L4459 16944L4430 17038L4363 17058L4363 16983L4478 16870L4540 16841L4591 16876Z","M4969 15099L5059 15202L5087 15184L5112 15210L5163 15328L4935 15328L4935 15292L4973 15292L4973 15259L4938 15239L4899 15129L4917 15076L4969 15099Z","M6818 14555L6896 14567L6896 14607L6712 14732L6667 14784L6677 14866L6656 14888L6587 14912L6560 14987L6478 15020L6477 15145L6421 15182L6344 15184L6395 15269L6498 15301L6609 15294L6685 15259L6820 15112L6914 15069L6942 15073L6917 15112L6917 15145L6934 15145L6896 15220L6917 15292L6819 15346L6763 15436L6712 15463L6674 15457L6546 15384L6422 15400L6293 15329L6249 15328L6344 15580L6311 15625L6325 15691L6276 15731L6135 15763L6042 15880L6001 15906L5906 15871L5830 15942L5686 15982L5641 15978L5641 16014L5746 16017L6107 15930L6193 15877L6230 15871L6267 15897L6295 15950L6306 16086L6344 16125L6300 16175L6249 16193L6312 16229L6382 16229L6248 16394L6182 16411L5847 16340L5831 16379L5958 16471L6057 16501L6096 16555L6096 16591L6001 16730L5951 16767L5830 16730L5830 16769L5868 16805L5868 16844L5806 16876L5754 16865L5711 16825L5638 16670L5611 16658L5597 16685L5612 16745L5660 16844L5641 16876L5552 16831L5511 16778L5417 16556L5391 16411L5432 16274L5512 16198L5613 16165L5717 16157L5717 16125L5449 16125L5437 16217L5372 16301L5239 16411L5275 16469L5333 16626L5403 16677L5489 16805L5429 16844L5447 16877L5506 16912L5525 17058L5297 17001L5201 16944L5175 16961L5123 17058L5239 17123L5315 17272L5300 17313L5262 17339L5163 17343L5163 17379L5184 17379L5184 17411L5122 17401L4993 17304L4973 17343L5030 17411L4969 17496L4896 17556L4935 17592L4657 17824L4637 17816L4270 17395L4236 17285L4314 17279L4337 17303L4363 17411L4591 17197L4625 17139L4688 17118L4822 17123L4687 17019L4687 16983L4829 16900L4912 16881L4995 16900L5049 16944L4956 16844L5030 16805L5030 16769L4869 16769L4831 16752L4758 16676L4717 16658L4556 16666L4483 16638L4459 16555L4424 16585L4400 16584L4270 16483L4384 16369L4439 16372L4422 16301L4597 16255L4765 16157L4504 16230L4422 16229L4456 16156L4517 16157L4517 16125L4439 16125L4486 16084L4517 16014L4373 16105L4270 15906L4285 15844L4232 15781L4241 15714L4272 15668L4270 15616L4305 15594L4325 15547L4270 15508L4270 15475L4479 15461L4536 15436L4433 15373L4422 15310L4444 15210L4498 15145L4646 15236L4668 15239L4689 15221L4841 15292L4841 15328L4758 15322L4777 15397L4869 15527L4866 15608L4894 15718L4973 15871L4973 15724L4896 15547L4924 15527L4946 15436L5069 15405L5143 15368L5215 15404L5282 15470L5315 15547L5391 15436L5297 15364L5258 15220L5184 15220L5163 15145L5106 15040L5163 15004L5136 14941L5087 14931L5314 14728L5373 14643L5407 14663L5468 14607L5563 14607L5637 14584L5813 14490L5907 14372L6401 13988L6538 13807L6618 13728L6685 13734L6742 13797L6791 13892L6839 14079L6889 14164L6898 14220L6847 14245L6827 14275L6763 14495L6818 14555Z","M14728 12982L14748 13003L14834 13003L15016 12945L15128 12934L15272 13040L15365 13041L15548 13003L15641 13045L15624 13142L15571 13251L15558 13331L15460 13516L15367 13622L15335 13725L15335 13811L15365 13875L15424 13912L15515 13883L15537 13912L15546 13974L15534 14022L15480 14060L15455 14248L15334 14486L15187 14702L15082 14823L14966 14892L14723 14979L14625 15040L14478 15190L14431 15327L14379 15415L14263 15547L13653 16053L13447 16160L13396 16211L13329 16411L13234 16477L13146 16498L12942 16639L12913 16714L12911 16769L12853 16730L12872 16697L12762 16668L12682 16620L12669 16641L12701 16730L12743 16762L12829 16766L12872 16787L12949 16912L12892 17010L12878 17063L12891 17123L12722 17090L12625 17197L12547 17195L12388 17112L12311 17090L12086 17150L12025 17107L11936 16980L11882 16932L11827 16912L11973 17134L12062 17209L12168 17233L12280 17179L12338 17168L12435 17274L12501 17322L12546 17320L12530 17233L12708 17356L12806 17382L12962 17256L13051 17277L13101 17343L13063 17411L13153 17437L13256 17390L13356 17295L13477 17130L13511 17136L13529 17187L13522 17272L13500 17317L13122 17817L13059 17868L12949 18019L12894 18030L12851 18009L12837 17958L12872 17877L12797 17804L12700 17840L12485 18036L12448 18053L12378 18057L12196 18109L12098 18101L12059 18232L11977 18283L11797 18468L11749 18553L11727 18633L11861 18572L12004 18381L12130 18302L12237 18190L12356 18128L12410 18139L12447 18186L12587 18218L12648 18215L12727 18142L12848 18064L12891 18057L12904 18123L12847 18230L12766 18332L12685 18396L12587 18553L12625 18624L12496 18637L12443 18669L12396 18730L12422 18778L12403 18786L12339 18765L12187 18765L12187 18804L12267 18801L12339 18836L12288 18955L12225 19048L12376 19078L12434 19048L12502 18942L12594 18922L12686 18805L12819 18740L12788 18684L12684 18589L12761 18594L13016 18553L13283 18580L13368 18553L13792 18235L13958 18196L13901 18302L13938 18332L14053 18302L13996 18164L14098 18200L14206 18196L14290 18109L14317 18043L14301 17983L14328 17930L14415 17948L14558 17877L14904 17892L15111 18029L15476 18157L15597 18161L15710 18125L15881 18000L15928 17983L16367 17983L16414 18045L16441 18057L16518 18025L16547 18057L16642 18011L16879 18094L16967 18090L17011 18161L17089 18090L17139 18095L17270 18164L17290 18124L17366 18164L17471 18090L17558 18133L17602 18050L17651 18019L17710 18030L17889 18125L17961 18110L18127 17983L18172 17972L18479 17983L18498 18048L18546 18125L18580 18129L18626 18088L18660 18090L18711 18181L18946 18447L18996 18722L19039 18804L19028 18901L19057 18958L19136 19048L19096 19053L19077 19092L19080 19136L19141 19171L18944 19416L18896 19509L18889 19580L18599 19854L18527 19967L18348 20443L18282 20709L18266 20814L18274 20909L18327 20951L18335 20995L18289 21092L18038 21497L17953 21680L17916 21863L17955 21975L17954 22037L17890 22133L17861 22251L17821 22308L17725 22384L17584 22611L17539 22666L17384 22766L17288 22866L17248 22950L17218 23172L17146 23284L17118 23359L17137 23497L17072 23587L17043 23674L17000 23728L16740 23917L16692 24023L16528 24117L16451 24288L16424 24301L16348 24257L15526 24378L15419 24428L15322 24503L15033 24800L14916 24849L14796 24809L14829 24856L14878 24875L14996 24874L15054 24858L15171 24787L15279 24761L15833 24478L15887 24396L15947 24358L16014 24347L16111 24427L16209 24435L16242 24497L16248 24593L16227 24683L16146 24809L16214 24809L16242 24912L16319 24942L16337 24977L16591 24997L16652 25028L16870 25220L16870 25250L16722 25397L16671 25496L16605 25527L16472 25558L16296 25679L16233 25697L16165 25685L15994 25595L15861 25592L15793 25611L15743 25694L15596 25799L15442 25977L15340 26024L15310 26077L15240 26318L15199 26346L15004 26357L14743 26500L14634 26519L14525 26512L14076 26378L13829 26382L13722 26346L13624 26276L13425 26077L13368 26075L13368 26106L13534 26223L13581 26275L13690 26483L13787 26483L13838 26572L13872 26585L14029 26550L14091 26551L14568 26686L14699 26686L14775 26665L14852 26746L15356 26788L15442 26892L15477 26899L15651 26881L15861 26788L15926 26731L16020 26593L16089 26585L16053 26483L16186 26338L16242 26313L16708 26347L16761 26371L16840 26481L16891 26514L16851 26622L16890 26636L16961 26622L17003 26652L17061 26585L17215 26708L17321 26743L17497 26892L17617 26958L18089 27059L18115 27182L18196 27222L18249 27283L18445 27671L18812 28145L18880 28320L18940 28363L18982 28450L19008 28442L19048 28383L19079 28387L19149 28447L19173 28518L19117 28518L19117 28548L19150 28568L19248 28540L19308 28548L19498 28685L19487 28787L19536 28856L19498 28887L19498 28920L19575 28987L19552 29064L19613 29124L19625 29183L19635 29511L19613 29708L19630 29814L19698 29940L19706 30026L19667 30149L19672 30181L19704 30301L19803 30426L19780 30490L19839 30595L19800 30727L19811 30777L19872 30887L19916 31126L19973 31159L20103 31538L20222 31658L20243 31710L20242 31898L20249 31941L20269 31958L20262 32003L20426 32603L20485 32754L20582 32883L20772 32981L20772 33017L20715 33017L20715 33039L20753 33157L20792 33214L20743 33279L20677 33309L20684 33344L20698 33364L20744 33375L20758 33339L20772 33342L20792 33411L20826 33404L20867 33244L20962 33349L21133 33385L21268 33476L21839 33655L22464 34055L22543 34133L22575 34199L22582 34328L22611 34369L22742 34477L22784 34552L22865 34786L22876 34913L22913 34969L22942 34979L22923 35047L22999 35149L23020 35174L23133 35205L23258 35292L23305 35485L23378 35564L23718 35701L23818 35793L23572 35929L23487 36029L23418 36216L23479 36348L23608 36799L24399 38005L24442 38160L24408 38312L24392 38329L24332 38378L24393 38234L24406 38155L24362 38120L24304 38100L24184 38012L24124 37989L23903 38085L23771 38059L23667 37989L23402 37643L23305 37570L23180 37550L22830 37669L22610 37669L22515 37692L22419 37605L22258 37586L22199 37605L22010 37733L22104 37797L22146 37723L22223 37686L22307 37681L22372 37698L22556 37841L22677 37762L23174 37669L23252 37703L23504 38109L23628 38174L23713 38277L23761 38312L23898 38343L24028 38507L24294 38727L24450 38785L24494 38838L24516 38963L24637 39048L24616 39080L24665 39117L24739 39255L24978 39946L25017 40122L25018 40320L24944 40594L24812 40648L24564 40901L24474 40952L24256 41277L24198 41340L24089 41397L24052 41461L24056 41517L24141 41523L24285 41489L24321 41504L24503 41629L24713 41934L24762 41898L24932 41900L24977 41927L25055 42039L25096 42060L25081 41957L25246 41728L25296 41492L25377 41300L25473 41200L25610 41135L25759 41106L25894 41112L25873 41077L25930 41057L26112 41112L26349 41112L26460 41141L26586 41203L26718 41236L26844 41178L26782 41144L26711 41143L26711 41112L27569 41320L27906 41494L28595 42026L28676 42118L28742 42231L28881 42716L28863 42814L28880 42884L28882 43139L28948 43353L28901 43437L28831 43673L28827 43761L28704 44087L28557 44333L28558 44654L28423 45189L28205 45282L28158 45336L28117 45303L28094 45398L27760 45815L27729 45827L27540 45582L27458 45556L27320 45444L27244 45428L27244 45459L27401 45596L27558 45640L27570 45661L27558 45753L27502 45739L27377 45767L27265 45706L26998 45767L27071 45802L27533 45831L27589 45798L27579 45882L27360 46108L27439 46154L27540 46170L27602 46090L27606 46185L27573 46256L27415 46404L27272 46501L27182 46539L26987 46568L26935 46560L26909 46537L26750 46262L26742 46347L26700 46395L26598 46446L26492 46538L26455 46694L26349 46755L26227 46722L26159 46729L25968 46816L26109 46868L26141 46939L26220 46861L26397 46821L26482 46786L26562 46720L26611 46711L26654 46755L26660 46793L26634 46878L26672 47003L26644 47027L26633 47065L26624 47193L26560 47247L26635 47242L26672 47278L26596 47406L26454 47535L26295 47634L26170 47674L25950 47638L25835 47641L25759 47702L25645 47727L25608 47763L25563 47720L25487 47725L25295 47776L25255 47903L25218 47947L25096 48010L25273 47979L25297 47965L25332 47888L25513 47838L25958 47903L25999 47932L26033 47995L26037 48038L26009 48063L25951 48070L25808 48049L25721 48134L25619 48159L25568 48192L25629 48275L25655 48286L25894 48286L26008 48316L25973 48202L25987 48159L26046 48162L26081 48300L26151 48405L26742 48472L27086 48365L27983 48281L28051 48322L28025 48468L27987 48544L27968 48559L27869 48559L27854 48574L27863 48670L27929 48862L27953 49038L27930 49208L27873 49349L27798 49440L27612 49504L27536 49563L27411 49573L27339 49655L27284 49678L27102 49682L26991 49735L26882 49835L26712 50096L26750 50380L26653 50419L26256 50288L26146 50324L25873 50591L25762 50642L25160 50771L25042 50817L24979 50922L24884 50984L24781 51131L24677 51133L24495 51077L24367 51072L24293 51010L24124 50984L23547 50773L23455 50764L23380 50804L23279 50763L22923 50891L22447 50891L21992 51044L21922 51001L21896 51011L21880 51050L21899 51133L21886 51178L21833 51208L21770 51187L21516 51024L21496 50998L21511 50953L21629 50891L21629 50864L21515 50771L21467 50805L21447 50800L21475 50741L21419 50710L21331 50694L21192 50708L21094 50975L21020 50984L20964 50920L21058 50708L21007 50681L20792 50708L20906 50818L20903 50950L20867 50984L20830 50982L20734 50934L20696 50865L20607 50817L20541 50760L20413 50708L20309 50581L19954 50380L19954 50408L20068 50460L20353 50787L20377 50847L20369 50899L20306 50922L20087 50951L20125 50984L20125 51011L19999 51035L19896 51086L19792 51071L19691 51256L19577 51200L19325 51164L19106 51251L18930 51218L18868 51221L18760 51268L18639 51380L18613 51281L18506 51251L18411 51251L18364 51164L18243 51344L18312 51327L18373 51281L18465 51421L18603 51442L18623 51476L18603 51550L18660 51583L18563 51703L18569 51768L18517 51792L18291 51797L18035 51688L17520 51630L17425 51569L17366 51578L17261 51613L17229 51655L17194 51749L17179 51842L17204 51885L17274 51908L17281 51963L17213 52094L17196 52094L17193 51928L17129 51819L16547 51371L16070 51191L16007 51189L15798 51237L15699 51303L15634 51311L15529 51281L15346 51404L15232 51371L14973 51451L14873 51613L14672 51703L14562 51684L14525 51648L14455 51478L14404 51433L14395 51484L14430 51524L14491 51733L14396 51840L14356 51915L14289 52124L14292 52209L14340 52392L14216 52412L14168 52448L14149 52511L14169 52583L14217 52606L14340 52600L14340 52630L14310 52722L14264 52738L14250 52761L14231 52870L14198 52893L14154 52879L14110 52841L14089 52938L13968 52991L13939 53033L13880 53299L13901 53408L13700 53467L13544 53421L13503 53467L13399 53372L13238 53171L13056 53004L12999 52996L12885 53056L12825 53108L12766 53085L12722 53046L12739 52989L12678 52972L12616 52927L12587 52860L12625 52779L12492 52779L12440 52726L12385 52574L12474 52392L12418 52419L12360 52392L12327 52470L12265 52484L12265 52511L12305 52538L12316 52582L12282 52662L12246 52674L12111 52662L12158 52730L12316 52704L12378 52752L12282 52779L12282 52808L12360 52808L12339 52841L12417 52841L12417 52868L12367 52902L12378 52989L12319 52985L12264 52871L12216 52841L11979 52779L11851 52792L11649 52920L11541 52962L11084 52989L11076 53009L11046 53019L11008 52900L10988 52897L10941 52930L10827 52954L10796 52990L10818 53079L10750 53154L10741 53182L10760 53257L10722 53362L10694 53392L10556 53371L10504 53393L10452 53456L10403 53484L10285 53523L10248 53562L10132 53763L10098 53709L10082 53555L10047 53523L9992 53539L9995 53627L9960 53674L9960 53701L10018 53763L9976 53769L9916 53812L9903 53911L9789 53970L9844 53975L9884 54000L9942 54000L9982 54125L9867 54324L9785 54320L9732 54341L9650 54439L9608 54563L9555 54530L9471 54437L9446 54386L9437 54267L9417 54224L9338 54094L9239 54000L9072 53920L8959 53899L8820 53822L8762 53826L8689 53851L8636 53896L8654 54031L8623 54089L8574 54129L8418 54187L8285 54201L8180 54160L8151 54029L8198 54017L8210 53972L8189 53940L8169 53813L8237 53687L8259 53672L8341 53642L8518 53539L8613 53505L8720 53436L8780 53435L8866 53517L8922 53545L8979 53510L9062 53346L9161 53346L9264 53288L9582 52952L9723 52868L9734 52795L9712 52653L9743 52631L9806 52630L9999 52526L10031 52442L10069 52109L10096 52048L10151 52004L10208 52004L10285 51942L10314 52017L10323 52126L10360 52094L10410 52125L10525 52131L10570 52153L10539 52095L10399 52031L10356 51975L10374 51898L10360 51825L10429 51839L10636 51825L10715 51798L10835 51583L10818 51517L10828 51471L10856 51450L10894 51461L11091 51291L11145 51159L11197 51099L11313 51011L11389 50858L11375 50470L11406 50288L11465 50140L11443 50043L11441 49981L11454 49953L11702 49953L11817 50016L11979 50034L12077 49986L12265 49775L12310 49699L12339 49682L12272 49459L12206 49350L12320 49350L12338 49302L12334 49255L12282 49196L12282 49168L12494 49083L13001 49035L13158 48987L13359 48987L13420 48975L13508 48927L13558 48923L13917 49018L14141 49010L14488 49091L14571 49170L14625 49196L14942 49182L15142 49119L15242 49105L15426 49115L15535 49099L15613 49044L15634 49075L15596 49138L15634 49168L15681 49077L15696 48987L15672 48893L15665 48642L15634 48590L15688 48606L15716 48594L15728 48484L15807 48361L15765 48316L15825 48253L15914 48271L16016 48171L16204 47918L16254 47878L16303 47849L16482 47802L16538 47744L16784 47321L16860 47270L16877 47194L16927 47089L17086 46921L17181 46790L17348 46722L17393 46680L17415 46628L17407 46577L17366 46538L17354 46621L17304 46668L17133 46714L17022 46878L16856 46988L16545 47371L16491 47414L16360 47444L16204 47552L16087 47595L15852 47611L15816 47596L15765 47519L15651 47659L15401 47813L15329 47888L15291 47979L15215 48010L15250 48104L15230 48200L15181 48257L15086 48234L14891 48316L14197 48253L14146 48223L14015 48043L13852 47907L13814 47903L13763 47928L13700 47896L13646 47841L13617 47796L13613 47777L13634 47763L13555 47518L13522 47458L13425 47369L13381 47284L13357 47257L13320 47247L13021 47284L12945 47325L12920 47352L12917 47394L12987 47519L12872 47519L12843 47559L12828 47519L12788 47495L12769 47491L12722 47552L12674 47524L12579 47506L12454 47611L12370 47580L12360 47627L12324 47626L12160 47556L12111 47552L12091 47491L12144 47451L12112 47347L12111 47278L12206 47247L12265 47153L12282 47186L12265 47186L12265 47214L12303 47247L12389 47218L12530 47209L12663 47175L12722 47075L12721 47014L12707 47006L12652 47062L12620 47066L12510 47054L12360 46969L12320 46997L12101 47030L12041 47007L11899 46868L11863 46786L12028 46795L12054 46755L11952 46746L11910 46714L11884 46660L11922 46578L11922 46538L11902 46507L11808 46630L11780 46623L11732 46568L11678 46577L11669 46609L11732 46694L11637 46746L11531 46750L11322 46722L11124 46762L11033 46828L11027 46939L10995 46951L10938 47130L10875 47089L10808 47153L10518 47156L10475 47186L10403 47292L10351 47315L10328 47358L10303 47369L10260 47341L10079 47282L10012 47233L10037 47186L9997 47099L9860 47064L9806 47003L9824 46972L10037 47003L10018 46939L10172 46969L10303 46905L10437 46878L10505 46831L10533 46824L10570 46844L10570 46816L10491 46737L10475 46628L10521 46537L10627 46510L10627 46477L10514 46533L10358 46547L10323 46568L10369 46568L10402 46587L10415 46627L10399 46694L10439 46729L10429 46780L10387 46824L10172 46875L9724 46825L9675 46844L9703 46917L9671 46956L9631 46954L9637 46878L9500 46771L9446 46755L9545 46746L9648 46638L9789 46599L9833 46554L9841 46511L9824 46328L9789 46206L9751 46170L9732 46200L9682 46157L9573 46142L9523 46108L9484 46138L9275 46170L9313 46142L9298 46074L9332 46044L9332 46016L9310 45958L9336 45931L9437 45924L9488 45904L9608 45798L9693 45785L9807 45742L9894 45665L9903 45549L9942 45549L9942 45521L9909 45492L9913 45461L9944 45438L10065 45433L10245 45523L10299 45523L10379 45490L10360 45428L10579 45490L10605 45471L10589 45336L10610 45318L10703 45302L10757 45264L10916 45045L10954 45044L11046 45117L11040 44983L11146 44931L11489 44944L11521 44932L11571 44850L11654 44825L11709 44787L11846 44637L11885 44610L12039 44579L12369 44293L12530 44062L12612 43902L12649 43799L12697 43503L12760 43344L12739 43246L12760 43154L12782 43149L12872 43188L12920 43170L13063 43063L13063 43029L12988 43030L12769 43095L12726 43060L12600 42884L12568 42814L12577 42700L12622 42587L12681 42499L12740 42451L12760 42371L12914 42263L12949 42216L12876 42225L12828 42264L12781 42275L12569 42014L12503 41859L12510 41822L12559 41806L12591 41773L12549 41601L12556 41504L12739 41366L12701 41332L12638 41390L12609 41383L12587 41332L12516 41387L12440 41393L12282 41366L12081 41429L11980 41491L11787 41489L11677 41566L11579 41681L11596 41712L11552 41739L11525 41792L11524 41851L11558 41900L11482 41963L11448 41959L11410 41912L11265 41838L11232 41845L11177 41900L11115 41916L10960 41900L10840 41991L10798 41963L10826 41920L10818 41872L10875 41775L11261 41324L11461 41251L11685 41076L11740 40982L11922 40862L11956 40719L11970 40473L11988 40454L12007 40464L12026 40525L12073 40415L12185 40279L12265 40235L12360 40064L12422 39987L12496 39938L12577 39913L12665 39905L12731 39934L12827 39880L12892 39862L12987 39782L13291 39655L13385 39655L13357 39570L13276 39485L13254 39429L13360 39452L13444 39525L13499 39495L13559 39515L13616 39568L13661 39637L13705 39665L14022 39656L14132 39630L14661 39367L14777 39363L14941 39462L14998 39546L15355 39779L15451 39908L15460 39718L15318 39447L15180 39245L15177 39173L15207 39126L15258 39098L15433 39058L15533 38977L15596 38982L15661 39061L15825 39493L15943 39621L16024 39658L16110 39655L16125 39604L16146 39591L16233 39620L16318 39605L16394 39559L16379 39500L16408 39425L16432 39398L16479 39406L16528 39363L16349 39394L16318 39414L16299 39482L16251 39506L16129 39493L16010 39448L15903 39372L15814 39276L15748 39173L15426 38465L15411 38401L15418 38336L15451 38262L15634 37957L15805 37748L15829 37698L15940 37619L15975 37570L15737 37567L15635 37521L15558 37410L15538 37252L15570 36897L15537 36767L15581 36685L15646 36645L15901 36547L15947 36542L16004 36578L16022 36529L16089 36477L16058 36424L16154 36324L16166 36248L16070 36303L15985 36312L15922 36161L15994 36087L16086 35940L16176 35903L16261 35731L16108 35449L16099 35404L16159 35381L16221 35320L16263 35236L16261 35145L16242 35145L16232 35216L16192 35273L15959 35435L15916 35556L15863 35589L15738 35598L15701 35568L15663 35499L15646 35423L15672 35374L15652 35320L15626 35274L15595 35253L15558 35271L15570 35337L15525 35557L15442 35663L15367 35809L15291 35850L15291 36022L15167 35860L15085 35847L15025 35793L15047 35570L15004 35534L15004 35501L15097 35472L15120 35334L15118 35077L15075 35102L15052 35152L15025 35271L15050 35364L15008 35386L14944 35380L14842 35415L14782 35354L14682 35174L14563 35007L14547 34930L14572 34812L14546 34696L14472 34654L14377 34455L14312 34396L14050 34027L13991 33986L13933 33885L13996 33803L14055 33637L14128 33262L14280 32883L14394 32818L14473 32692L14497 32600L14472 32518L14617 32104L14682 32024L14736 32011L14798 32072L14843 32090L14987 32024L14813 31925L14926 31814L15101 31760L15136 31771L15194 31826L15353 31866L15585 31795L15634 31760L15442 31760L15442 31727L15496 31718L15581 31673L15634 31694L15634 31658L15566 31626L15318 31694L14434 31628L14303 31576L14263 31592L14280 31628L14233 31651L14189 31633L14110 31562L14073 31694L14095 31746L14115 31946L14110 32024L14079 32103L14032 32130L13773 32105L13701 32116L13641 32218L13444 32186L13463 32222L13438 32240L13417 32236L13385 32186L13417 32127L13444 32156L13425 32090L13349 32186L13368 32255L13311 32291L13406 32387L13234 32475L13016 32641L12884 32659L12798 32653L12798 32617L12762 32590L12779 32554L12784 32443L12778 32394L12740 32377L12739 32354L12698 32390L12666 32459L12657 32541L12684 32617L12575 32636L12434 32543L12336 32379L12360 32186L12318 32212L12251 32299L12206 32321L12165 32316L11925 32190L11842 32000L11797 31988L11759 32058L11732 32171L11758 32284L11797 32387L11882 32401L11918 32426L11951 32471L11960 32532L11922 32646L11961 32716L11926 32786L11950 32978L11884 33072L11854 33083L11732 33047L11636 32981L11537 32984L11351 32716L11259 32625L10932 32420L10807 32384L10747 32347L10695 32210L10636 32185L10530 32186L10464 32216L10345 32326L10279 32430L10264 32483L10284 32615L10305 32665L10333 32686L10428 32965L10508 33035L10494 33231L10530 33309L10294 33214L10268 33181L10253 33026L10285 32981L10253 32920L10265 32850L10213 32844L10172 32818L10130 32644L10047 32591L9783 32270L9702 32124L9651 31953L9637 31760L9664 31498L9704 31460L9793 31458L9819 31387L9847 31413L9946 31607L9970 31873L10053 31969L10103 31977L10151 31925L10172 31856L10072 31654L9999 31410L10007 31270L10086 31044L10117 30855L10171 30799L10285 30725L10466 30478L10508 30459L10514 30367L10589 30159L10584 30005L10604 29930L10769 29743L10835 29526L10925 29444L11110 29356L11177 29258L11201 29125L11176 29006L11109 28921L11008 28887L11066 28798L11052 28689L10992 28586L10911 28518L10760 28450L10670 28447L10644 28429L10665 28346L10504 28240L10414 28158L10360 28078L10482 27946L10525 27840L10513 27673L10465 27521L10437 27167L10454 27034L10494 26947L10557 26892L10696 26844L10734 26849L10910 26933L10957 26941L10989 26926L11049 26964L11511 27037L11579 26991L11167 26902L11046 26825L10904 26643L10792 26600L10740 26548L10665 26418L10627 26245L10586 26234L10571 26272L10590 26384L10722 26585L10753 26675L10735 26715L10684 26724L10617 26723L10551 26695L10521 26625L10513 26304L10621 26017L10818 25697L10831 25626L10818 25607L10750 25682L10551 26075L10491 26078L10471 26039L10475 25886L10463 25819L10435 25768L10397 25754L10360 25799L10430 26064L10455 26235L10447 26313L10411 26327L10405 26365L10437 26686L10399 26706L10265 26652L10265 26686L10336 26729L10365 26768L10379 26825L10368 26896L10285 27028L10252 27180L10225 27231L10186 27275L10153 27281L10066 27261L10021 27207L9981 27080L9942 26840L9831 26690L9796 26586L9751 26622L9901 26973L9922 27077L9899 27125L9845 27107L9662 26955L9637 26891L9637 26788L9584 26891L9548 27046L9467 27167L9533 27306L9580 27470L9529 27471L9408 27400L9315 27366L9286 27327L9268 27203L9209 27148L9199 27113L9199 26976L9239 26840L9199 26652L9268 26574L9571 26041L9732 25973L9848 25881L9875 25852L9974 25624L10018 25558L10208 25454L10305 25382L10360 25250L10208 25399L10161 25424L10048 25434L10001 25454L9960 25493L9836 25765L9505 25992L9275 26347L9179 26381L9149 26537L9115 26588L9055 26607L8934 26585L8925 26486L8904 26498L8875 26855L8942 26892L8993 27133L9027 27167L9008 27231L9048 27261L9008 27298L9162 27466L9231 27584L9256 27710L9237 27778L9199 27811L9104 27841L9062 27872L8935 28016L8858 28178L8837 28346L8777 28393L8799 28450L8795 28563L8820 28593L8854 28602L8875 28652L8858 28716L8781 28764L8799 28856L8723 29021L8720 29179L8685 29188L8624 29352L8579 29419L8515 29459L8515 29489L8578 29496L8629 29559L8676 29689L8708 29722L8680 29795L8543 29974L8427 30049L8361 30062L8248 30026L8123 30096L8043 30094L7994 30075L7964 30015L7926 29695L7941 29600L8018 29534L8151 29358L8134 29035L8173 28890L8134 28786L8269 28412L8279 28313L8248 28246L8399 28117L8436 27993L8524 27835L8641 27770L8737 27679L8824 27549L8875 27400L8606 27707L8474 27803L8437 27805L8456 27741L8342 27688L8304 27639L8283 27572L8281 27439L8266 27400L8383 27222L8418 27116L8553 26960L8490 26993L8396 27105L8323 27143L8273 27196L8248 27197L8228 27164L8204 27052L8509 26575L8532 26514L8520 26491L8553 26449L8517 26433L8401 26514L8384 26606L8264 26746L8266 26855L8220 26945L8210 26960L8182 26949L8174 26920L8204 26724L8306 26520L8515 26214L8535 26153L8571 26147L8662 26206L8654 26145L8610 26106L8587 25984L8687 25810L8723 25697L8639 25722L8520 25886L8456 25939L8510 25733L8610 25558L8585 25492L8619 25438L8765 25374L8770 25337L8752 25301L8715 25285L8599 25322L8521 25396L8494 25390L8478 25346L8485 25290L8548 24999L8576 24934L8629 24874L8680 24906L8755 24897L8894 24840L8894 24809L8827 24814L8707 24854L8646 24840L8723 24635L8811 24573L8799 24532L8869 24433L8962 24387L9242 24362L9467 24426L9559 24403L9634 24338L9810 24096L9901 23890L9960 23807L9899 23841L9789 24082L9675 24185L9580 24326L9462 24340L9166 24271L9089 24342L9044 24309L8998 24117L8961 24135L8928 24180L8875 24288L8837 24257L8951 23945L9017 24011L9085 24039L9148 24036L9403 23877L9467 23807L9373 23865L9275 23873L9138 23973L9104 23982L9026 23915L8989 23910L9137 23600L9275 23462L9310 23397L9256 23359L9256 23322L9342 23253L9449 23257L9531 23183L9593 23183L9713 23221L9770 23204L9880 23131L10103 23079L10151 23045L9693 23147L9477 23042L9504 22941L9709 22709L9806 22526L9641 22674L9577 22776L9490 22819L9467 22941L9393 23060L9278 23093L9252 23139L9194 23161L9061 23352L8932 23415L8892 23507L8798 23564L8657 23768L8473 23989L8266 24151L8242 24132L8209 24065L8081 24018L7999 23945L8041 23863L8058 23773L8037 23773L7934 23917L7766 23881L7352 23537L7334 23497L7338 23418L7367 23379L7407 23365L7546 23355L7642 23375L7731 23422L7808 23497L7829 23460L7734 23372L7734 23322L8028 23122L8096 23114L8271 23206L8341 23221L8488 23210L8570 23189L8629 23149L8371 23183L8310 23173L8170 23083L8056 23052L7753 23221L7648 23252L7582 23237L7485 23183L7292 23198L7087 23141L7017 23148L6912 23236L6843 23222L6742 23149L6704 23030L6710 22981L6742 22988L6763 22976L6860 22849L7286 22803L7458 22696L7505 22708L7601 22803L7772 22888L7755 22779L7727 22742L7677 22734L7677 22696L7745 22695L7808 22734L7848 22682L7911 22661L8037 22696L7829 22592L7776 22528L7774 22473L7813 22434L8100 22392L8215 22341L8304 22249L8268 22231L8217 22237L8171 22261L8127 22346L8071 22344L7961 22315L7985 22264L8096 22141L7971 22118L7709 22177L7580 22141L7772 22110L7772 22072L7694 21999L7743 21940L7829 21617L7877 21554L7955 21497L8041 21467L8113 21481L8227 21655L8310 21707L8401 21721L8552 21685L8685 21617L8685 21582L8552 21636L8515 21617L8453 21661L8392 21643L8235 21553L8250 21417L8189 21373L8077 21408L7972 21338L7941 21300L7983 21215L8151 20989L8268 20994L8345 20941L8414 20968L8588 21089L8862 21092L8896 21039L9027 21059L9027 21021L8972 20986L8637 21059L8515 20919L8282 20848L8248 20795L8267 20707L8401 20496L8350 20409L8416 20312L8533 20237L8629 20215L8718 20284L8805 20389L8899 20461L9008 20426L9008 20391L8892 20363L8866 20340L8825 20265L8745 20181L8781 20105L8848 20032L8915 20005L8915 19967L8847 19938L8733 20075L8532 20181L8474 20173L8314 20110L8194 20150L8137 20146L8113 20075L8189 19899L8321 19788L8371 19861L8436 19850L8746 19700L8870 19584L8894 19439L8847 19428L8772 19506L8646 19685L8574 19741L8361 19685L8429 19641L8453 19607L8418 19465L8361 19510L8174 19758L8104 19794L7960 19816L7895 19783L7848 19580L7868 19576L7886 19545L7848 19471L7846 19402L7886 19333L7753 19279L7715 19067L7772 18910L7786 18730L7829 18730L7808 18624L7857 18604L7907 18614L8104 18801L8151 18836L8175 18816L8223 18890L8361 18978L8323 18871L8524 18836L8703 18854L8715 18820L8630 18748L8505 18719L8381 18736L8304 18804L8210 18692L8248 18624L8155 18607L8020 18341L7900 18296L7886 18231L7902 18168L7958 18104L7942 18019L8046 17959L8099 17956L8181 18049L8215 18044L8266 17948L8236 17939L8170 17844L8137 17824L7906 17770L7897 17714L7913 17475L7886 17304L7917 17197L7982 17123L8052 17094L8126 17094L8198 17117L8266 17162L8264 17336L8304 17518L8368 17612L8411 17633L8456 17631L8401 17518L8463 17524L8515 17556L8497 17454L8513 17313L8475 17233L8368 17131L8332 17072L8361 17019L8340 17013L8323 16983L8437 16805L8507 16876L8610 16876L8594 17019L8672 17125L8786 17186L8875 17197L8858 17162L8892 17117L8925 16968L8951 16912L8986 16913L9113 16968L9229 17095L9323 17154L9523 17233L9451 17128L9370 17090L9248 16963L9048 16860L9035 16804L9048 16769L9065 16765L9106 16793L9122 16730L9175 16763L9252 16878L9313 16912L9427 16876L9587 16967L9688 17068L9806 17123L9886 17267L9942 17304L9869 17107L9591 16862L9523 16844L9523 16805L9578 16805L9600 16767L9571 16641L9537 16611L9448 16592L9408 16555L9326 16533L9211 16387L9141 16372L9161 16340L9120 16280L9065 16261L8951 16268L8989 16193L8989 16157L8897 15989L8950 15918L9055 15948L9122 16086L9182 16036L9303 16064L9370 15978L9353 15978L9364 15879L9332 15799L9370 15799L9370 15763L9313 15724L9350 15696L9467 15655L9467 15616L9331 15611L9292 15580L9313 15547L9292 15521L9218 15475L9239 15364L9203 15364L9176 15344L9048 15145L9050 15057L9095 15042L9276 15152L9323 15165L9539 15056L9599 15064L9658 15112L9716 15038L9779 15004L9829 15020L9951 15112L10090 15100L10132 15112L10323 15259L10296 15203L10189 15112L10225 15081L10305 15067L10342 15040L10111 15004L10057 15065L10028 15076L10000 15064L9871 14975L9761 14823L9694 14712L9658 14567L9713 14567L9685 14511L9686 14458L9732 14350L9742 14245L9817 14278L9978 14391L10094 14386L9991 14288L9999 14245L9980 14206L9927 14246L9867 14245L9867 14206L9903 14206L9903 14169L9846 14130L10000 14038L10151 14130L9846 13859L9845 13763L9851 13717L9873 13692L10020 13604L10061 13558L10094 13476L10075 13476L10125 13165L10172 13109L10529 13189L10595 13233L10644 13298L10684 13476L10674 13582L10644 13661L10695 13620L10717 13571L10734 13382L10773 13311L10760 13222L10894 13380L11083 13495L11063 13622L10932 13763L10803 14069L10854 14060L11046 13859L11064 13777L11165 13713L11216 13661L11292 13398L11360 13367L11479 13391L11596 13443L11732 13546L11732 13661L11667 13738L11541 14060L11589 14039L11636 13992L11711 13879L11710 13812L11854 13661L12036 13549L12119 13564L12202 13644L12265 13661L12225 13622L12255 13599L12303 13516L12334 13511L12425 13546L12449 13530L12471 13459L12502 13443L12608 13443L12690 13463L12746 13405L12781 13315L12836 13286L12906 13417L12968 13404L13206 13443L13444 13404L13564 13347L13755 13201L13861 13149L14035 13115L14124 13118L14187 13149L14149 13185L14217 13249L14294 13242L14453 13185L14607 13256L14683 13256L14720 13149L14622 13091L14577 13036L14547 12963L14611 12877L14653 12849L14699 12857L14728 12982Z","M16013 12083L15918 12156L15914 12204L15933 12272L15899 12303L15942 12466L15923 12521L15861 12562L15728 12419L15728 12379L15766 12340L15737 12260L15651 12123L15719 12155L15753 12147L15786 12123L15786 12083L15596 12083L15596 12049L15703 12001L15825 11976L15953 11986L16018 12018L16013 12083Z","M15011 11674L15158 11903L15118 11936L15118 11976L15174 11995L15215 12049L15215 12083L15096 12114L15037 12160L15004 12233L15088 12227L15250 12148L15329 12156L15260 12262L15122 12303L14863 12303L14784 12092L14699 12013L14642 11903L14657 11826L14642 11793L14623 11786L14590 11817L14550 11788L14500 11789L14491 11735L14538 11609L14602 11545L14724 11500L14758 11499L14896 11622L15011 11674Z","M15261 10346L15357 10445L15460 10423L15488 10446L15558 10531L15499 10568L15552 10628L15710 10719L15672 10756L15710 10793L15545 10860L15520 10848L15497 10935L15442 11014L15378 11071L15329 11088L15424 11147L15529 11161L15661 11021L15765 11120L15880 11054L15924 11082L15985 11163L16032 11125L16013 11238L16070 11251L16163 11181L16277 11157L16304 11167L16318 11202L16300 11256L16146 11382L16177 11452L16217 11497L16264 11513L16318 11499L16261 11348L16312 11344L16405 11281L16451 11272L16490 11294L16507 11336L16510 11479L16487 11517L16434 11545L16328 11569L16292 11596L16228 11718L16184 11753L15930 11658L15898 11628L15747 11330L15712 11337L15628 11436L15577 11422L15548 11445L15460 11422L15499 11499L15413 11492L15380 11510L15367 11569L15298 11540L15131 11568L15061 11499L15032 11380L15041 11263L15074 11162L15118 11088L15118 11054L15061 10907L15012 10950L15025 11054L14974 11030L14928 11054L14954 11077L14981 11232L14957 11281L14891 11348L14891 11382L14797 11346L14713 11208L14676 11028L14739 10830L14722 10586L14795 10427L14919 10339L15053 10313L15187 10320L15261 10346Z","M16764 10293L16756 10313L16833 10310L16867 10319L16891 10346L16855 10337L16825 10366L16819 10415L16851 10464L16884 10473L16985 10423L16987 10451L16967 10464L16949 10526L16966 10559L17042 10608L16993 10664L16872 10683L16813 10719L16807 10597L16766 10536L16710 10528L16662 10568L16669 10653L16609 10675L16566 10633L16624 10531L16743 10486L16756 10423L16624 10276L16734 10237L16773 10242L16764 10293Z","M15614 10129L15748 10101L15784 10101L15825 10125L15823 10159L15758 10232L15763 10392L15681 10423L15512 10393L15439 10343L15376 10259L15360 10160L15410 10086L15488 10047L15558 10050L15576 10107L15614 10129Z","M16337 9791L16337 9828L16407 9826L16451 9902L16358 10071L16364 10227L16386 10271L16432 10276L16432 10313L16302 10351L16280 10330L16271 10258L16245 10206L16209 10175L16166 10165L16166 10050L16202 10081L16289 10050L16272 9833L16284 9777L16313 9746L16358 9750L16358 9791L16337 9791Z","M17374 9517L17382 9569L17251 9576L17197 9604L17071 9852L17042 9868L17038 9750L16991 9755L16870 9902L16891 9791L16837 9823L16814 9821L16794 9791L16634 9995L16585 9979L16578 10053L16562 10087L16548 10075L16561 9936L16642 9868L16737 9717L16818 9681L16830 9606L16773 9528L16840 9527L16952 9459L17022 9453L17022 9494L16939 9558L16870 9646L16908 9680L16940 9649L17031 9630L17104 9548L17232 9528L17330 9387L17348 9401L17374 9517Z","M15843 9220L15795 9271L15805 9345L15728 9345L15728 9382L15985 9474L16053 9646L16142 9680L16166 9717L16166 9750L16111 9750L16013 9868L16022 9783L16053 9717L15916 9582L15841 9538L15765 9528L15765 9568L15805 9646L15765 9606L15743 9654L15723 9669L15701 9663L15652 9627L15558 9382L15491 9356L15480 9305L15627 9325L15672 9305L15749 9190L15791 9158L15843 9196L15843 9220Z","M19561 8139L19554 8182L19592 8182L19592 8223L19497 8306L19457 8321L19441 8240L19462 8149L19513 8093L19575 8069L19630 8070L19632 8097L19573 8120L19561 8139Z","M20356 5124L20352 5151L20394 5118L20403 5160L20342 5360L20323 5399L20308 5398L20320 5217L20310 5285L20228 5392L20223 5368L20258 5318L20285 5177L20311 5122L20290 5035L20373 4999L20356 5124Z","M18339 4922L18297 4985L18231 4955L18160 4873L18166 4832L18228 4776L18293 4766L18324 4776L18339 4922Z","M21042 4623L21056 4727L21075 4728L21110 4697L21110 4735L21104 4815L21065 4922L21045 5042L21017 5056L20936 4994L20910 4956L20919 4775L20873 4706L20875 4646L20928 4638L20979 4663L21001 4649L21010 4603L21029 4592L21042 4623Z","M21317 3741L21208 3776L21155 3742L21204 3619L21232 3580L21295 3561L21340 3512L21438 3503L21493 3480L21479 3537L21317 3741Z","M21780 2231L21805 2232L21848 2192L21891 2203L21921 2235L21931 2284L21915 2346L21847 2411L21688 2344L21610 2346L21610 2388L21649 2462L21574 2444L21420 2157L21420 2115L21744 2115L21774 2131L21780 2231Z","M20439 2280L20419 2338L20392 2346L20413 2476L20316 2655L20373 2655L20348 2693L20316 2697L20373 2736L20316 2925L20368 2905L20413 2851L20430 2886L20384 3007L20392 3082L20339 3106L20273 3302L20222 3351L20222 3394L20292 3393L20353 3351L20349 3250L20425 3192L20601 3159L20469 3058L20430 3005L20495 2931L20522 2946L20527 3040L20620 2869L20646 2854L20696 2886L20733 2943L20715 3005L20778 3050L20811 3159L20792 3198L20829 3232L20795 3262L20734 3228L20627 3341L20637 3354L20736 3313L20696 3351L20696 3394L20790 3338L20823 3361L20829 3470L20849 3470L20860 3412L20883 3417L20906 3394L20963 3232L20980 3313L21006 3220L21048 3155L21100 3122L21154 3121L21115 3218L20919 3455L20903 3497L20906 3543L20923 3552L20988 3454L21024 3427L21060 3427L21077 3488L21054 3633L21030 3658L20813 3682L20772 3700L20829 3758L20969 3793L21041 3850L20867 4019L20877 4104L20890 4113L20910 4084L21001 4121L20890 4232L20839 4254L20792 4239L20742 4125L20715 4121L20697 4153L20700 4188L20736 4239L20736 4274L20685 4282L20641 4313L20641 4347L20753 4347L20696 4503L20747 4427L20811 4389L20730 4576L20715 4659L20760 4595L20819 4569L20850 4597L20811 4694L20906 4774L20906 4809L20829 4809L20829 4850L20849 4850L20849 4888L20803 4856L20746 4922L20696 4923L20736 4964L20723 5011L20708 5037L20658 5044L20658 5078L20736 5116L20688 5179L20714 5253L20765 5306L20792 5307L20778 5386L20736 5429L20684 5439L20641 5421L20653 5496L20715 5655L20691 5717L20651 5714L20563 5655L20569 5887L20546 5991L20506 6069L20487 6031L20518 6157L20487 6296L20517 6335L20525 6382L20514 6424L20487 6450L20430 6337L20409 6394L20386 6387L20381 6345L20413 6296L20413 6258L20371 6219L20284 6241L20239 6217L20206 6148L20255 6077L20239 5989L20262 5944L20289 5917L20353 5914L20353 5882L20279 5803L20279 5765L20353 5765L20337 5666L20409 5486L20451 5221L20521 5001L20506 4850L20491 4828L20460 4829L20448 4774L20502 4608L20474 4610L20422 4659L20391 4655L20382 4635L20431 4441L20506 4313L20506 4274L20453 4268L20412 4327L20335 4503L20257 4279L20198 4221L20108 4198L20108 4239L20162 4267L20205 4315L20279 4465L20260 4545L20180 4468L20144 4465L20146 4568L20126 4642L20101 4656L20087 4579L20053 4612L20034 4732L20011 4774L19985 4772L19877 4694L19803 4618L19785 4567L19803 4503L19835 4471L19954 4431L19919 4403L19851 4285L19824 4406L19792 4458L19759 4466L19727 4361L19603 4431L19515 4431L19492 4358L19413 4338L19390 4306L19333 4051L19384 3968L19476 3903L19530 3887L19575 3892L19680 4008L19727 4007L19706 3930L19803 3968L19782 3892L19913 3875L19951 3919L19954 4087L20011 4045L19973 3930L20030 3930L20011 3850L20076 3821L20149 3845L20210 3920L20239 4045L20316 3930L20239 3850L20296 3700L20332 3731L20373 3735L20339 3672L20388 3654L20527 3658L20460 3611L20378 3592L20312 3549L20296 3428L20213 3512L20182 3505L20153 3462L20143 3408L20152 3354L20182 3313L20182 3275L20095 3275L20058 3264L20030 3232L20033 3065L20011 2886L19974 2996L19916 3082L19873 3063L19864 3017L19880 2964L19916 2925L19772 2938L19727 2886L19701 2952L19661 2974L19565 2967L19557 2936L19597 2804L19622 2774L19706 2774L19727 2620L19786 2522L19822 2516L19860 2578L19894 2697L19986 2793L20090 2830L20182 2774L20151 2748L20039 2736L19962 2631L19916 2620L19992 2462L20108 2388L20068 2346L20100 2278L20087 2231L20155 2196L20231 2208L20373 2311L20392 2269L20344 2214L20350 2157L20413 2034L20441 2147L20439 2280Z","M21028 1509L21058 1608L21090 1542L21147 1523L21268 1534L21269 1610L21248 1646L21248 1689L21286 1724L21256 1792L21258 1846L21306 1957L21268 2076L21132 1929L21077 1921L21148 2035L21211 2192L21136 2232L21096 2224L21058 2192L21071 2255L21105 2291L21192 2311L21172 2346L21219 2404L21220 2473L21187 2528L21134 2543L21175 2640L21192 2755L21184 2826L21162 2839L21096 2810L21028 2813L20994 2799L20980 2755L20970 2758L20951 2814L20980 2851L20980 2886L20887 2865L20823 2795L20784 2671L20750 2138L20774 2017L20867 1999L20858 2101L20889 2168L20932 2207L20963 2192L20906 1939L20940 1818L20918 1780L20915 1728L20961 1564L20994 1510L21028 1509Z","M21873 1190L21782 1264L21801 1375L21746 1378L21801 1413L21801 1456L21667 1608L21745 1796L21704 1844L21677 1847L21610 1801L21431 1812L21344 1767L21361 1657L21344 1569L21393 1609L21408 1563L21382 1413L21429 1393L21455 1315L21455 1230L21420 1184L21420 1142L21464 1119L21516 1063L21554 997L21553 944L21579 886L21611 885L21638 928L21649 1006L21638 1069L21579 1138L21553 1184L21560 1201L21658 1122L21717 913L21744 869L21762 897L21853 925L21906 998L21915 1068L21839 1103L21915 1142L21873 1190Z"],"IRL":["M-3261 47180L-3214 47174L-3193 47189L-3232 47230L-3450 47303L-3522 47267L-3515 47224L-3421 47170L-3261 47180Z","M-4656 45874L-4634 45895L-4588 45896L-4577 45925L-4596 45959L-4754 46044L-4851 46053L-4877 46079L-4933 46087L-4942 46053L-4894 45989L-4727 45867L-4656 45874Z","M-3062 40368L-2960 40355L-2836 40390L-2815 40424L-2840 40458L-2838 40489L-2753 40524L-2757 40560L-2807 40575L-3135 40423L-3226 40358L-3198 40317L-3132 40315L-3062 40368Z","M-2801 39917L-2895 39946L-2945 39889L-2972 39762L-2914 39694L-2837 39694L-2745 39832L-2801 39917Z","M-3630 36248L-3573 36374L-3630 36374L-3624 36450L-3649 36542L-3585 36513L-3557 36517L-3535 36542L-3535 36573L-3576 36685L-3573 36831L-3633 36887L-3686 36857L-3801 36735L-3904 36731L-3916 36685L-3905 36518L-3935 36477L-3992 36459L-4202 36506L-4278 36496L-4415 36443L-4489 36442L-4489 36409L-4357 36390L-4310 36342L-4277 36248L-4232 36284L-4184 36248L-4123 36322L-4052 36302L-3926 36216L-3683 36224L-3630 36248Z","M461 31658L341 31697L280 31693L234 31658L234 31562L291 31526L272 31493L296 31466L316 31459L426 31536L449 31580L461 31658Z","M4225 30151L4363 30215L4467 30233L4593 30288L4651 30332L4712 30304L4751 30378L4742 30478L4660 30528L4489 30584L4401 30642L4306 30737L4140 30808L3982 31014L3897 31204L3843 31224L3775 31314L3597 31341L3536 31400L3458 31522L3469 31565L3447 31578L3436 31613L3448 31776L3425 31815L3369 31838L3347 31868L3336 31925L3348 32099L3319 32202L3275 32288L3074 32539L3051 32724L3075 32787L3009 32801L2957 32772L2874 32798L2779 32771L2633 32896L2537 32951L2443 32958L2351 32910L2272 32840L2234 32838L2139 32934L2001 33003L2064 33051L2042 33123L2065 33173L2182 33232L2232 33317L2255 33318L2319 33278L2447 33381L2490 33398L2580 33343L2610 33351L2617 33447L2502 33486L2225 33751L2119 33793L2010 33788L1799 33738L1604 34008L1536 34049L1388 34093L1323 34129L1358 34162L1372 34238L1399 34277L1649 34587L1719 34624L1799 34625L1858 34774L1942 34897L2097 34931L2138 34962L2157 35038L2168 35248L2204 35322L2258 35355L2411 35376L2626 35374L2826 35525L2845 35556L2859 35637L2892 35661L3188 35731L3248 35719L3362 35628L3432 35634L3401 35675L3461 35684L3487 35747L3540 35740L3675 35786L3721 35781L3658 35648L3658 35616L3678 35592L3762 35542L3757 35728L3767 35746L3805 35726L3851 35656L3846 35561L3901 35533L3897 35508L3858 35467L3891 35388L3946 35340L4098 35300L4157 35261L4140 35183L4178 35129L4079 35045L4096 34978L4003 34932L3996 34881L4030 34884L4070 34821L4049 34735L4068 34725L4139 34733L4230 34664L4365 34449L4447 34369L4534 34361L4628 34409L4800 34554L4845 34667L4917 34703L4977 34866L4982 34935L4959 34983L4911 35009L5009 35060L5034 35089L5072 35222L5173 35362L5292 35451L5325 35454L5399 35381L5432 35386L5519 35453L5582 35528L5598 35613L5572 35700L5510 35780L5539 35835L5536 35889L5493 36000L5609 36126L5649 36147L5708 36076L5794 36092L6032 36003L6109 36000L6156 36062L6312 36024L6342 35968L6339 35863L6375 35800L6398 35804L6452 35860L6570 35826L6786 36032L6849 36069L6906 36151L6965 36157L7010 36181L7063 36259L7053 36317L6962 36426L6915 36444L6846 36419L6742 36345L6703 36353L6508 36267L6362 36248L6362 36283L6395 36307L6344 36413L6310 36631L6325 36799L6387 36883L6480 36932L6685 36960L6656 37079L6653 37162L6681 37234L6742 37284L6685 37349L6671 37474L6691 37804L6723 37940L6742 37989L6841 38064L6889 38178L7104 38312L7146 38417L7153 38487L7135 38551L6991 38854L6970 38807L6921 38799L6820 38854L6998 38940L7022 39046L7047 39080L7010 39144L7055 39167L7169 39174L7220 39207L7189 39291L7154 39293L7077 39239L7020 39173L6994 39178L6925 39207L6763 39334L6755 39385L6930 39607L7008 39626L7092 39671L7068 39766L7070 39932L7085 40000L7147 40091L7164 40141L7144 40225L7277 40481L7258 40509L7267 40697L7218 40951L7254 41022L7371 41156L7379 41190L7328 41226L7300 41312L7256 41364L7161 41584L7182 41618L7063 41732L7000 41841L6934 42060L6950 42162L6893 42297L6763 42530L6748 42615L6788 42884L6780 43079L6575 43438L6525 43500L6479 43526L6372 43703L6346 43774L6344 43997L6325 43963L6278 43931L6116 43945L6059 43926L6075 43844L5982 43906L5982 43935L6024 43951L6094 44036L6115 44096L6097 44143L6184 44163L6225 44248L6325 44096L6325 44124L6278 44219L6334 44323L6477 44468L6397 44665L6334 44743L6287 44746L6251 44718L6303 44618L6299 44598L6267 44594L6179 44681L6058 44682L6058 44654L6115 44654L6077 44620L6048 44621L6001 44654L5868 44682L5751 44751L5702 44745L5630 44667L5579 44640L5373 44577L5177 44607L5123 44594L5123 44560L5206 44502L5234 44445L5239 44375L5158 44469L5104 44493L5049 44468L5030 44496L5030 44594L5087 44560L5078 44627L5049 44682L5087 44682L5087 44715L5049 44715L5070 44746L4869 44870L4772 44994L4725 44965L4751 44910L4850 44823L4851 44779L4803 44594L4759 44521L4666 44438L4626 44296L4591 44248L4611 44418L4668 44560L4633 44672L4639 44716L4708 44715L4708 44746L4536 44932L4289 44965L4305 44915L4384 44808L4288 44775L4249 44780L4249 44808L4289 44870L4202 44839L4168 44850L4118 44932L4063 44957L3906 44932L3374 44989L3182 45093L3079 45117L3041 45174L3013 45179L2965 45086L2917 45101L2864 45140L2830 45200L2841 45274L2868 45240L2911 45233L3064 45289L3069 45309L3053 45364L2965 45428L2945 45597L2894 45611L2818 45662L2671 45646L2613 45675L2574 45807L2280 45767L2254 45666L2223 45647L2204 45815L2167 45875L2080 45951L2022 45955L2104 46031L2137 46044L2107 46089L1929 46142L1783 46207L1741 46262L1794 46323L1748 46350L1539 46394L1433 46436L1258 46453L1122 46445L1110 46429L1117 46397L1185 46351L1166 46292L1245 46269L1318 46200L1242 46170L1263 46111L1299 46077L1286 46039L1267 46028L1222 46077L1129 46040L1015 46044L1015 46016L991 45993L841 46044L670 46045L613 46077L705 46112L822 46129L891 46182L841 46323L977 46323L958 46384L994 46412L918 46446L1015 46446L958 46538L980 46610L967 46645L845 46795L771 46836L667 46862L596 46939L578 46888L539 46851L495 46833L461 46844L502 46876L516 46928L503 46977L461 47003L441 46912L382 46879L254 46878L254 46905L282 46922L368 46939L411 46905L423 46939L399 46985L358 47003L308 47137L329 47306L293 47274L254 47184L215 47153L169 47148L33 47186L-299 47153L-259 47196L-213 47214L-111 47214L-111 47247L-147 47278L-90 47306L-138 47366L-128 47458L-233 47444L-258 47463L-320 47397L-422 47397L-491 47375L-509 47397L-566 47372L-606 47423L-661 47552L-775 47595L-787 47643L-811 47632L-842 47580L-948 47519L-1175 47580L-1308 47519L-1308 47552L-1271 47580L-1294 47631L-1370 47694L-1507 47691L-1499 47763L-1539 47765L-1594 47857L-1675 47840L-1708 47857L-1728 47763L-1804 47812L-1810 47851L-1848 47856L-1942 47916L-2032 47918L-1974 47873L-1935 47796L-2008 47839L-2019 47824L-1964 47724L-1861 47644L-1882 47611L-1994 47688L-2088 47796L-2122 47751L-2088 47595L-2153 47543L-2204 47535L-2240 47552L-2217 47606L-2296 47644L-2493 47688L-2518 47764L-2585 47763L-2670 47828L-2718 47827L-2721 47782L-2755 47733L-2794 47710L-2813 47749L-2964 47888L-2926 47918L-3116 48010L-3108 47960L-3133 47969L-3213 48043L-3232 48010L-3251 48043L-3232 47918L-3268 47900L-3289 47857L-3228 47838L-3177 47802L-3028 47668L-2870 47611L-2699 47431L-2489 47306L-2617 47292L-3153 47566L-3326 47580L-3157 47472L-3112 47388L-3003 47350L-2661 47164L-2624 47105L-2533 47094L-2430 47039L-2246 46978L-2240 46905L-2203 46844L-2203 46816L-2242 46796L-2333 46841L-2397 46790L-2432 46786L-2432 46694L-2528 46630L-2518 46768L-2489 46816L-2545 46831L-2713 46973L-2954 47012L-3050 47052L-3400 47102L-3556 47186L-3564 47232L-3589 47258L-3763 47316L-3830 47369L-3945 47336L-4073 47352L-4135 47381L-4184 47431L-4202 47397L-4181 47381L-4174 47330L-4148 47293L-3959 47240L-3916 47214L-3916 47194L-3935 47186L-3924 47131L-3946 47098L-4030 47089L-3995 47033L-3934 47021L-3822 47030L-3760 47004L-3630 46878L-3630 46844L-3744 46844L-3696 46763L-3609 46695L-3440 46630L-3478 46722L-3383 46688L-3351 46643L-3346 46568L-3261 46602L-3154 46599L-3154 46568L-3232 46538L-3232 46510L-3123 46403L-3068 46372L-3021 46292L-2926 46292L-2836 46264L-2674 46172L-2585 46142L-2585 46108L-2787 46135L-3078 46246L-3131 46279L-3171 46337L-3306 46351L-3289 46384L-3372 46438L-3402 46446L-3383 46351L-3423 46351L-3478 46412L-3611 46446L-3732 46543L-3797 46571L-3859 46538L-3985 46655L-4127 46722L-4110 46662L-4373 46538L-4267 46504L-4242 46396L-4289 46282L-4402 46228L-4434 46252L-4503 46360L-4697 46510L-4713 46452L-4680 46321L-4697 46262L-4830 46250L-4811 46200L-4812 46179L-4830 46170L-4811 46108L-4849 46108L-4849 46077L-4757 46065L-4456 45969L-4447 45938L-4458 45893L-4498 45869L-4550 45774L-4602 45767L-4602 45739L-4468 45675L-4490 45609L-4354 45562L-4106 45428L-3842 45372L-3730 45305L-3670 45151L-3649 45151L-3649 45232L-3623 45267L-3546 45274L-3554 45232L-3496 44965L-3410 45017L-3323 45021L-3116 44994L-3175 44932L-3078 44870L-3630 44901L-3594 44994L-3624 45066L-3641 44992L-3668 44962L-3744 44932L-3828 44926L-4201 45021L-4267 45063L-4354 44965L-4422 45016L-4494 44943L-4525 44941L-4602 44965L-4602 44994L-4506 45024L-4506 45052L-4708 44994L-4773 44994L-4762 45038L-4734 45052L-4794 45054L-4904 45107L-4963 45117L-5030 45092L-5049 45037L-5078 44870L-5003 44808L-5003 44780L-5031 44743L-4999 44703L-4887 44654L-4907 44715L-4846 44767L-4811 44780L-4783 44763L-4787 44662L-4754 44622L-4794 44594L-4768 44525L-4735 44506L-4640 44496L-4547 44364L-4516 44344L-4227 44259L-4184 44296L-4212 44496L-4030 44468L-3948 44420L-3875 44338L-3850 44243L-3916 44155L-3819 44153L-3788 44170L-3801 44217L-3774 44411L-3604 44482L-3510 44503L-3395 44505L-3266 44388L-3232 44403L-3268 44434L-3222 44462L-3021 44434L-3065 44388L-3192 44375L-3324 44313L-3366 44344L-3387 44321L-3420 44217L-3360 44268L-3331 44268L-3289 44248L-3366 44217L-3366 44183L-3268 44155L-3299 44079L-3290 43857L-3336 43810L-3483 43783L-3560 43745L-3611 43689L-3569 43646L-3516 43628L-3329 43615L-3053 43486L-2974 43392L-2926 43363L-2854 43365L-2735 43409L-2747 43347L-2779 43316L-2870 43313L-2848 43266L-2870 43219L-2842 43134L-2849 43079L-2773 42967L-2758 42981L-2689 42936L-2575 42967L-2354 42967L-2279 43006L-2230 42954L-2190 42936L-1946 42951L-1905 42932L-1728 42936L-1584 42897L-1507 42829L-1168 42721L-1118 42686L-1095 42736L-1044 42748L-988 42736L-948 42717L-892 42610L-861 42592L-375 42530L-281 42498L-332 42497L-512 42423L-604 42404L-785 42433L-863 42403L-867 42374L-832 42342L-839 42216L-846 42169L-889 42151L-813 42029L-973 42096L-1038 42157L-1044 42216L-1134 42389L-1380 42723L-1433 42751L-1680 42779L-1766 42874L-1835 42874L-1897 42842L-1746 42714L-1747 42652L-1835 42707L-2038 42772L-2179 42777L-2293 42742L-2335 42676L-2430 42662L-2468 42624L-2454 42553L-2484 42526L-2585 42530L-2585 42561L-2537 42589L-2508 42652L-2718 42751L-2901 42806L-2936 42922L-2957 42929L-3002 42904L-3076 42960L-3573 43029L-3573 43001L-3405 42892L-3261 42854L-2699 42311L-2718 42248L-2621 42185L-2467 42180L-2357 42133L-2316 41994L-2331 41973L-2316 41934L-2337 41900L-2277 41854L-2223 41775L-2187 41669L-2164 41649L-2160 41557L-1987 41390L-1956 41300L-2008 41284L-2226 41295L-2299 41269L-2221 41190L-2105 41008L-2049 40954L-2070 40922L-1921 40638L-1815 40495L-1728 40316L-1670 40291L-1604 40330L-1474 40454L-1413 40481L-1241 40407L-1175 40446L-1167 40372L-1206 40330L-1328 40291L-1328 40257L-1165 40225L-1122 40243L-1037 40313L-983 40320L-983 40291L-1099 40225L-1099 40190L-999 40226L-935 40175L-914 40181L-928 40225L-901 40263L-836 40311L-796 40320L-852 40162L-773 40041L-680 39972L-785 40000L-1060 39991L-1099 39972L-1050 39941L-870 39905L-870 39874L-948 39874L-948 39845L-922 39821L-813 39782L-813 39750L-1034 39718L-1186 39772L-2087 39846L-2216 39921L-2278 39937L-2394 39937L-2453 39909L-2546 39782L-2492 39701L-2513 39647L-2559 39648L-2598 39834L-2630 39894L-2673 39901L-2718 39845L-2718 39810L-2664 39714L-2687 39504L-2632 39464L-2575 39493L-2530 39413L-2642 39302L-2612 39267L-2508 39207L-2657 39210L-2699 39239L-2663 39294L-2657 39375L-2682 39443L-2735 39464L-2785 39412L-2744 39244L-2746 39207L-2785 39172L-2840 39239L-2874 39254L-2993 39483L-3036 39537L-3168 39597L-3213 39597L-3314 39496L-3435 39524L-3478 39493L-3437 39329L-3417 39311L-3309 39288L-3154 39173L-3154 39144L-3251 39144L-3251 39109L-3192 39080L-3192 39048L-3264 39061L-3326 39109L-3325 39142L-3362 39166L-3404 39161L-3420 39109L-3405 39067L-3350 39028L-3326 38982L-3362 38987L-3430 39048L-3504 39018L-3535 39048L-3543 39094L-3534 39189L-3643 39234L-3789 39226L-3822 39207L-3887 39093L-3926 39080L-4038 39100L-4104 39093L-4144 39048L-4189 39079L-4240 39080L-4186 38954L-4145 38926L-4087 38918L-3981 38940L-3939 38935L-3897 38889L-3897 38854L-3956 38832L-3992 38759L-3807 38810L-3784 38759L-3838 38764L-3943 38744L-4048 38698L-4106 38631L-4124 38546L-4174 38469L-4287 38495L-4315 38469L-4251 38413L-4049 38440L-4070 38344L-3946 38345L-3822 38378L-3765 38469L-3670 38378L-3839 38265L-3880 38208L-3774 38184L-3558 38206L-3478 38184L-3383 38124L-3346 38120L-3258 38175L-2908 38213L-2908 38184L-2956 38159L-3149 38176L-3270 38129L-3496 37989L-3535 37780L-3471 37530L-3496 37445L-3469 37426L-3193 37359L-3164 37329L-3061 37378L-2546 37284L-2546 37249L-2699 37185L-2642 37153L-2654 37082L-2625 37040L-2528 36960L-2603 36928L-2563 36879L-2546 36799L-2603 36831L-2682 36801L-3078 36799L-3352 36954L-3502 36990L-3594 36893L-3559 36866L-3542 36734L-3496 36700L-3496 36573L-3516 36573L-3516 36542L-3383 36506L-3227 36599L-3216 36709L-3183 36735L-3160 36720L-3154 36573L-3230 36483L-3268 36477L-3251 36542L-3282 36530L-3334 36378L-3332 36335L-3346 36312L-3410 36315L-3469 36204L-3478 36134L-3466 36063L-3398 36029L-3366 35987L-3405 35969L-3406 35942L-3346 35893L-3366 35860L-3289 35793L-3315 35770L-3347 35768L-3420 35793L-3416 35849L-3459 35860L-3459 35893L-3440 35893L-3521 35994L-3599 36010L-3669 35952L-3725 35828L-3671 35830L-3496 35763L-3580 35700L-3614 35655L-3630 35598L-3556 35634L-3687 35469L-3649 35495L-3617 35497L-3573 35436L-3717 35314L-3780 35289L-3822 35339L-3782 35390L-3797 35430L-3844 35449L-3897 35436L-3859 35501L-3859 35534L-3933 35536L-3992 35569L-3992 35598L-3956 35612L-3942 35641L-3935 35731L-4013 35763L-3942 35833L-3936 35874L-3983 35893L-4076 35870L-4102 35822L-4106 35731L-4027 35540L-4003 35400L-3916 35271L-4003 35269L-4038 35252L-4070 35210L-4017 35209L-3954 35047L-3801 34947L-3771 34884L-3744 34882L-3708 34979L-3672 35009L-3575 35040L-3535 35012L-3492 35070L-3440 35047L-3420 35077L-3481 35196L-3548 35249L-3617 35241L-3687 35174L-3705 35267L-3661 35295L-3596 35300L-3500 35355L-3425 35267L-3383 35242L-3421 35184L-3403 35108L-3358 35041L-3316 35012L-3256 35029L-3159 35102L-3097 35112L-3135 35045L-3192 35012L-3192 34979L-3139 34966L-3078 34979L-3130 34948L-3276 34916L-3306 34867L-3322 34799L-3317 34764L-3154 34719L-3095 34734L-2990 34802L-2936 34817L-2459 34852L-2345 34817L-2261 34882L-2040 34914L-1979 34888L-1901 34814L-1718 34882L-1697 34902L-1660 35012L-1582 34993L-1577 34979L-1558 35017L-1577 35145L-1516 35174L-1516 35210L-1570 35247L-1557 35291L-1422 35414L-1387 35468L-1365 35541L-1365 35634L-1347 35634L-1330 35409L-1347 35339L-1285 35313L-1223 35250L-1175 35154L-1156 35030L-1115 34951L-1021 34939L-852 34979L-803 34948L-616 35067L-574 35077L-437 35077L-377 35058L-320 35012L-243 35071L-73 35037L5 35077L46 35222L125 35254L215 35374L252 35345L295 35335L386 35339L386 35307L252 35244L216 35155L174 35127L81 35112L81 35077L156 34979L255 35019L303 34975L499 35012L405 34914L352 34890L243 34886L223 34873L215 34834L230 34786L329 34852L384 34818L363 34773L244 34719L-32 34720L-47 34704L-51 34654L-39 34618L23 34565L103 34541L489 34281L509 34066L530 34081L575 34198L738 34098L1007 34045L1133 33957L1222 33937L1222 33901L1130 33898L1089 33878L1053 33833L1205 33705L1198 33612L1326 33494L1318 33375L1389 33433L1423 33440L1470 33244L1451 33214L1343 33294L1153 33326L994 33440L1027 33325L1008 33291L967 33276L926 33297L855 33390L784 33426L617 33603L537 33637L537 33607L605 33526L737 33440L729 33372L694 33330L653 33375L634 33375L643 33269L607 33269L560 33335L524 33454L467 33391L455 33317L433 33309L368 33342L268 33359L239 33425L147 33375L-63 33374L-111 33342L-89 33296L-115 33269L-345 33180L-394 33181L-356 33113L-356 33083L-392 33060L-410 33026L-404 32995L-292 32960L-263 32867L-231 32830L-34 32686L37 32658L316 32665L462 32714L537 32716L537 32686L343 32637L291 32584L334 32563L459 32557L491 32570L570 32684L620 32712L672 32686L524 32537L420 32500L319 32427L254 32420L266 32373L348 32354L442 32255L497 32311L558 32316L689 32291L844 32353L901 32354L901 32321L791 32287L746 32236L748 32156L787 32115L896 32134L937 32123L900 32092L869 32006L832 31988L767 31988L748 32090L669 32086L604 32016L553 31917L518 31826L554 31800L643 31856L718 31837L787 31791L705 31756L643 31694L537 31562L537 31526L590 31492L653 31526L689 31460L672 31460L686 31391L767 31364L841 31228L867 31257L875 31370L901 31393L917 31373L934 31284L958 31258L915 31031L928 30993L960 30962L1032 30761L1075 30758L1232 30827L1413 30761L1362 30867L1356 30912L1371 30936L1487 30789L1709 30661L1747 30623L1807 30473L1870 30462L1944 30519L1920 30573L1794 30661L1794 30695L1911 30631L1947 30667L1989 30663L2060 30625L2098 30695L2087 30781L2194 30725L2159 30804L2098 30827L2098 30860L2204 30866L2265 30739L2257 30686L2194 30595L2177 30496L2365 30296L2385 30332L2317 30595L2365 30661L2389 30662L2417 30630L2442 30625L2590 30731L2651 30894L2632 31059L2727 30826L2670 30643L2653 30532L2629 30479L2594 30462L2572 30498L2613 30695L2575 30687L2499 30595L2418 30570L2384 30540L2394 30478L2470 30323L2470 30296L2569 30312L2613 30296L2713 30209L2748 30196L2795 30214L2885 30367L2861 30545L2876 30588L2992 30661L3016 30784L3049 30838L3117 30897L3123 30976L3107 31056L3079 31093L3038 31105L2954 31195L2803 31294L2803 31327L2969 31295L3023 31324L2992 31427L2822 31562L2691 31727L2691 31760L2796 31708L3060 31450L3089 31443L3113 31391L3280 31327L3316 31268L3333 31189L3321 31122L3257 31072L3298 30960L3298 30844L3278 30835L3166 30661L3079 30578L3057 30494L3057 30446L3119 30390L3149 30305L3157 30207L3127 30129L3254 30160L3298 30129L3280 30062L3395 30147L3456 30145L3562 30030L3618 30012L3674 30040L3716 30129L3639 30129L3692 30168L3753 30197L3815 30199L3870 30159L3693 30017L3609 29910L3603 29796L3529 29751L3472 29689L3515 29659L3566 29671L3660 29726L3896 29802L4003 29861L4040 29893L4183 30112L4225 30151Z"]};

var svg = document.getElementById('map');
// The viewBox is padded around the tight GB coastline so the country never
// touches the frame. Portrait screens (phones) get more margin: there "meet"
// fits by width, so with no padding GB spans edge-to-edge and reads as "zoomed
// in", cramped under the top panel and the bottom ad. The extra sea margin
// pulls it clear. Everything else keys off getScreenCTM(), so it follows along.
function applyViewBox() {
  var W = COAST.viewBox[2], H = COAST.viewBox[3];
  var m = window.innerHeight > window.innerWidth ? 0.16 : 0.04;
  var mx = W * m, my = H * m;
  svg.setAttribute('viewBox',
    (-mx) + ' ' + (-my) + ' ' + (W + 2 * mx) + ' ' + (H + 2 * my));
}
applyViewBox();

// --- one-time render: coastline -----------------------------------------
(function drawCoast() {
  var g = document.getElementById('coast');
  var NS = 'http://www.w3.org/2000/svg';
  // Ireland first, as background context; it carries no data points and is
  // excluded from the statistics.
  [['IRL', 'land context'], ['GBR', 'land']].forEach(function (spec) {
    COAST[spec[0]].forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('class', spec[1]);
      g.appendChild(p);
    });
  });
})();

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
var statLabelEl = document.getElementById('stat-label');
var noticeEl = document.getElementById('notice');

function renderCard(el, s, unit) {
  el.querySelector('.stat-weight').textContent = fmtInt.format(Math.round(s.weight));
  el.querySelector('.stat-unit').textContent = unit;
  el.querySelector('.stat-count').textContent = fmtInt.format(s.count) + ' points';
  el.querySelector('.stat-pct').textContent = s.pct.toFixed(1) + '%';
}

var cardPrimary = document.getElementById('card-primary');
var cardSecondary = document.getElementById('card-secondary');
var summaryEl = document.getElementById('summary');

function setLabel(el, text) {
  var node = el.querySelector('.card-label');
  if (node.textContent !== text) node.textContent = text;
}

// The one-line readout shown while the panel is collapsed.
function renderSummary(labels, stats) {
  summaryEl.innerHTML =
    '<span class="s-primary">' + labels[0] + ' ' + stats.primary.pct.toFixed(1) + '%</span>' +
    '<span class="s-sep">·</span>' +
    '<span class="s-secondary">' + labels[1] + ' ' + stats.secondary.pct.toFixed(1) + '%</span>';
}

// --- breakdown box -------------------------------------------------------
// Hidden entirely when the data source supplies no groups, since the contract
// makes them optional.
var breakdownEl = document.getElementById('breakdown');
var bdTotal = document.getElementById('bd-total');
var bdNote = document.getElementById('bd-note');
var bdHead = { primary: document.getElementById('bd-head-primary'),
               secondary: document.getElementById('bd-head-secondary') };
var bdList = { primary: document.getElementById('bd-list-primary'),
               secondary: document.getElementById('bd-list-secondary') };
// Set per source: the contract makes groups optional, and a CSV without a
// categorical column is a perfectly good source with no breakdown to show.
var hasGroups = false;

var compactFmt = new Intl.NumberFormat('en-GB', {
  notation: 'compact', maximumFractionDigits: 1,
});

// en-GB renders millions lowercase ("1.2m"), which reads as milli- or metres.
// Thousands stay lowercase 'k' by convention.
function fmtCompact(n) {
  return compactFmt.format(n).replace(/m$/, 'M');
}

// Group names now come from arbitrary loaded files, so escape before building
// markup — a name with & or < would otherwise corrupt the list.
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function renderColumn(side, col, label) {
  bdHead[side].textContent = label;
  var html = '';
  for (var i = 0; i < col.rows.length; i++) {
    var r = col.rows[i];
    var name = escapeHtml(r.name);
    // title carries the full name, since a long one is clamped to two lines.
    html += '<li><span class="bd-n' + (r.split ? ' bd-split' : '') + '" title="' +
      name + '">' + name + '</span><span class="bd-w">' + fmtCompact(r.weight) + '</span></li>';
  }
  if (col.moreCount > 0) {
    html += '<li class="bd-more"><span class="bd-n">+ ' + col.moreCount + ' more</span>' +
      '<span class="bd-w">' + fmtCompact(col.moreWeight) + '</span></li>';
  }
  bdList[side].innerHTML = html;
}

function renderBreakdown(labels, stats) {
  // Rebuilding this markup on every drag frame would be wasted work while the
  // disclosure is shut, and it is shut by default.
  if (!hasGroups || !breakdownEl.open) return;
  var sum = summariseContributors(sides, data.weights, data.groups, data.groupNames, 5);
  renderColumn('primary', sum.primary, labels[0] + ' ' + stats.primary.pct.toFixed(1) + '%');
  renderColumn('secondary', sum.secondary, labels[1] + ' ' + stats.secondary.pct.toFixed(1) + '%');
  bdTotal.textContent =
    fmtInt.format(stats.totalCount) + ' points · ' +
    fmtInt.format(Math.round(stats.totalWeight)) + ' ' + source.unit + ' in total';
  var anySplit = sum.primary.rows.concat(sum.secondary.rows).some(function (r) { return r.split; });
  bdNote.textContent = anySplit
    ? '† the divider passes through this cluster, so it counts towards both sides.'
    : 'Each cluster falls entirely on one side of the divider.';
}

// Opening it must fill it in immediately rather than waiting for the next
// pointer move. Recompute directly rather than via scheduleRecompute: this is a
// discrete user action, not a drag frame, so there is nothing to throttle and
// nothing to gain from waiting for an animation frame.
breakdownEl.addEventListener('toggle', function () {
  if (breakdownEl.open) recompute();
});

// --- collapsing ----------------------------------------------------------
// Minimising leaves the title bar and the two percentages, so the panel stops
// covering the map on a phone without hiding the answer.
var panel = document.getElementById('panel');
var btnCollapse = document.getElementById('btn-collapse');

function setCollapsed(collapsed) {
  panel.classList.toggle('collapsed', collapsed);
  summaryEl.hidden = !collapsed;
  btnCollapse.textContent = collapsed ? '+' : '−';
  btnCollapse.setAttribute('aria-expanded', String(!collapsed));
  var label = collapsed ? 'Expand panel' : 'Minimise panel';
  btnCollapse.setAttribute('aria-label', label);
  btnCollapse.title = label;
}

btnCollapse.addEventListener('click', function () {
  setCollapsed(!panel.classList.contains('collapsed'));
});

// --- screen scale --------------------------------------------------------
// One world unit is a fraction of a pixel, so grab radii and handle sizes
// must be converted from screen pixels via the current CTM. Recomputed on
// resize, which is the only view change this app has.
var unitsPerPx = 1;
var clipBbox = CONFIG.padBbox; // replaced with the visible extent once laid out

// The half-plane fills must cover the whole window, but "xMidYMid meet"
// letterboxes the viewBox, so how much world is on screen depends on the
// window's aspect ratio. Derive the clip box from the viewport corners
// (padded 10%) rather than assuming a fixed one.
function visibleBbox() {
  var ctm = svg.getScreenCTM();
  if (!ctm || !ctm.a) return CONFIG.padBbox;
  var inv = ctm.inverse();
  var tl = new DOMPoint(0, 0).matrixTransform(inv);
  var br = new DOMPoint(window.innerWidth, window.innerHeight).matrixTransform(inv);
  var padX = (br.x - tl.x) * 0.1;
  var padY = (br.y - tl.y) * 0.1;
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
  handleCircleA.setAttribute('r', CONFIG.handleRadiusPx);
  handleCircleB.setAttribute('r', CONFIG.handleRadiusPx);
  clipBbox = visibleBbox();
}

// --- elements ------------------------------------------------------------
var polyPrimary = document.getElementById('poly-primary');
var polySecondary = document.getElementById('poly-secondary');
var tintPrimary = document.getElementById('tint-primary');
var tintSecondary = document.getElementById('tint-secondary');
var dividerExt = document.getElementById('divider-ext');
var dividerSeg = document.getElementById('divider-seg');
var hitSeg = document.getElementById('hit-seg');
var handleA = document.getElementById('handle-a');
var handleB = document.getElementById('handle-b');
var handleCircleA = handleA.querySelector('.handle');
var handleCircleB = handleB.querySelector('.handle');

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

function recompute() {
  // A source is loaded asynchronously now, so the first frames — and any
  // resize during a load — can arrive before there is anything to count.
  if (!data) return;
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
  } else {
    dividerExt.style.display = 'none';
  }

  var wa = lngLatToWorld(endpoints[0]);
  var wb = lngLatToWorld(endpoints[1]);
  [dividerSeg, hitSeg].forEach(function (el) {
    el.setAttribute('x1', wa[0]); el.setAttribute('y1', wa[1]);
    el.setAttribute('x2', wb[0]); el.setAttribute('y2', wb[1]);
  });
  // The handle groups are placed by transform and scaled back to screen pixels,
  // so the handle circle and its rotation arrow keep a fixed on-screen size.
  handleA.setAttribute('transform', 'translate(' + wa[0] + ' ' + wa[1] + ') scale(' + unitsPerPx + ')');
  handleB.setAttribute('transform', 'translate(' + wb[0] + ' ' + wb[1] + ') scale(' + unitsPerPx + ')');

  // Classification stays per-point in JS — 3,500 cross products is ~0.05ms.
  for (var i = 0; i < mercPts.length; i++) {
    var sgn = sideValue(split.A, split.B, mercPts[i]) >= 0 ? 1 : -1;
    sides[i] = sgn === split.primarySign ? 'primary' : 'secondary';
  }

  var stats = computeStats(sides, data.weights);
  // The compass words follow the line's angle: a roughly north–south divide
  // splits the country west/east, not north/south.
  setLabel(cardPrimary, split.labels[0]);
  setLabel(cardSecondary, split.labels[1]);
  renderCard(cardPrimary, stats.primary, source.unit);
  renderCard(cardSecondary, stats.secondary, source.unit);
  renderSummary(split.labels, stats);
  renderBreakdown(split.labels, stats);
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

svg.addEventListener('pointerdown', function (evt) {
  var P = eventToWorld(evt);
  if (!P) return;
  var A = lngLatToWorld(endpoints[0]);
  var B = lngLatToWorld(endpoints[1]);
  var mode = hitTest(P, A, B, CONFIG.grabRadiusPx * unitsPerPx);
  if (!mode) return;
  cancelSweep();
  drag = {
    mode: mode,
    last: P,
    mid: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2],
    half: Math.hypot(B[0] - A[0], B[1] - A[1]) / 2,
  };
  document.body.classList.add('dragging');
  // Pointer capture keeps the drag alive when the cursor leaves the element.
  svg.setPointerCapture(evt.pointerId);
  evt.preventDefault();
});

svg.addEventListener('pointermove', function (evt) {
  if (!drag) return;
  var P = eventToWorld(evt);
  if (!P) return;
  if (drag.mode === 'line') {
    var dx = P[0] - drag.last[0];
    var dy = P[1] - drag.last[1];
    for (var i = 0; i < 2; i++) {
      var w = lngLatToWorld(endpoints[i]);
      endpoints[i] = worldToLngLat([w[0] + dx, w[1] + dy]);
    }
    drag.last = P;
  } else {
    // Rotate the bar around its fixed midpoint: the grabbed handle follows the
    // pointer's *direction* only, at the captured half-length, and the opposite
    // handle mirrors it. Length is preserved — dragging cannot resize the bar.
    var vx = P[0] - drag.mid[0], vy = P[1] - drag.mid[1];
    var len = Math.hypot(vx, vy) || 1;
    var ex = drag.mid[0] + (vx / len) * drag.half;
    var ey = drag.mid[1] + (vy / len) * drag.half;
    var ox = drag.mid[0] - (vx / len) * drag.half;
    var oy = drag.mid[1] - (vy / len) * drag.half;
    var grabbed = drag.mode === 'a' ? 0 : 1;
    endpoints[grabbed] = worldToLngLat([ex, ey]);
    endpoints[1 - grabbed] = worldToLngLat([ox, oy]);
  }
  scheduleRecompute();
});

function endDrag(evt) {
  if (!drag) return;
  drag = null;
  document.body.classList.remove('dragging');
  if (evt && svg.hasPointerCapture(evt.pointerId)) svg.releasePointerCapture(evt.pointerId);
}
svg.addEventListener('pointerup', endDrag);
svg.addEventListener('pointercancel', endDrag);

// --- hover tooltip -------------------------------------------------------
// One delegated hit-test rather than a listener per circle: on each move we
// find the nearest DRAWN point (so a strided subsample never shows a tooltip
// over blank space) and name its value, plus its group when the source has one.
var tipEl = document.getElementById('point-tip');
var fmtDec = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });
var tipEvt = null, tipRaf = false;

function fmtValue(n) {
  if (!isFinite(n)) return String(n);
  return Number.isInteger(n) ? fmtInt.format(n) : fmtDec.format(n);
}

function hideTip() { tipEl.hidden = true; }

function updateTip() {
  tipRaf = false;
  var evt = tipEvt;
  if (!evt || drag || !data || !drawnWorld.length) { hideTip(); return; }
  var P = eventToWorld(evt);
  if (!P) { hideTip(); return; }
  // The divider handles win the pointer: no tooltip while hovering a grab zone.
  var A = lngLatToWorld(endpoints[0]), B = lngLatToWorld(endpoints[1]);
  if (hitTest(P, A, B, CONFIG.grabRadiusPx * unitsPerPx)) { hideTip(); return; }
  // A little forgiveness beyond the dot's own radius, floored at ~8px so tiny
  // marks in a dense set are still catchable.
  var radius = Math.max(pointRadiusWorld, 8 * unitsPerPx);
  var j = nearestPoint(drawnWorld, P, radius);
  if (j < 0) { hideTip(); return; }
  var idx = drawnIdx[j];

  tipEl.textContent = '';
  if (data.groups && data.groupNames) {
    var name = data.groupNames[data.groups[idx]];
    if (name) {
      var ns = document.createElement('span');
      ns.className = 'tip-name';
      ns.textContent = name;
      tipEl.appendChild(ns);
      tipEl.appendChild(document.createElement('br'));
    }
  }
  var vs = document.createElement('span');
  vs.className = 'tip-val';
  vs.textContent = fmtValue(data.weights[idx]) + ' ' + (source.unit || 'value');
  tipEl.appendChild(vs);

  // Offset from the cursor, then flip if it would run off-screen.
  tipEl.style.left = (evt.clientX + 14) + 'px';
  tipEl.style.top = (evt.clientY + 14) + 'px';
  tipEl.hidden = false;
  var box = tipEl.getBoundingClientRect();
  if (box.right > window.innerWidth) tipEl.style.left = (evt.clientX - box.width - 14) + 'px';
  if (box.bottom > window.innerHeight) tipEl.style.top = (evt.clientY - box.height - 14) + 'px';
}

svg.addEventListener('pointermove', function (evt) {
  if (drag) { hideTip(); return; }
  tipEvt = evt;
  if (tipRaf) return;
  tipRaf = true;
  requestAnimationFrame(updateTip);
});
svg.addEventListener('pointerleave', hideTip);
svg.addEventListener('pointerdown', hideTip);

// --- snap buttons --------------------------------------------------------
// The centre of the window in lng/lat, from the viewport's mid pixel through
// the inverse screen CTM — exact under the letterboxing, so a snapped line sits
// dead centre rather than at the old midpoint. Falls back to the clip box.
function viewportCenterLngLat() {
  var ctm = svg.getScreenCTM();
  if (!ctm || !ctm.a) {
    return [(clipBbox[0] + clipBbox[2]) / 2, (clipBbox[1] + clipBbox[3]) / 2];
  }
  var c = new DOMPoint(window.innerWidth / 2, window.innerHeight / 2)
    .matrixTransform(ctm.inverse());
  return worldToLngLat([c.x, c.y]);
}

function snap(orientation) {
  cancelSweep();
  var s = snapEndpoints(endpoints[0], endpoints[1], orientation);
  // Recentre on the window: shift both endpoints so the midpoint is the
  // viewport centre, keeping the length snapEndpoints chose.
  var c = viewportCenterLngLat();
  var dx = c[0] - (s[0][0] + s[1][0]) / 2;
  var dy = c[1] - (s[0][1] + s[1][1]) / 2;
  endpoints = [[s[0][0] + dx, s[0][1] + dy], [s[1][0] + dx, s[1][1] + dy]];
  scheduleRecompute();
}
document.getElementById('btn-horizontal').addEventListener('click', function () { snap('horizontal'); });
document.getElementById('btn-vertical').addEventListener('click', function () { snap('vertical'); });

// --- Balance to the 50/50 split -----------------------------------------
// `balancePosition` (pure) gives the exact-balance latitude/longitude on the
// TRUE weights. Building the line from it is impure — it needs the viewport
// centre for the free axis and, optionally, a per-frame sweep — so it lives
// here rather than in the tested block.
var animateChk = document.getElementById('animate-balance');
var sweepRAF = null;
function cancelSweep() {
  if (sweepRAF) { cancelAnimationFrame(sweepRAF); sweepRAF = null; }
}

function balanceLine(orientation) {
  cancelSweep();
  if (!data || !data.coords.length) return;
  var isH = orientation === 'horizontal';   // horizontal line → North/South split
  // Balance latitude for a horizontal line, longitude for a vertical one.
  var values = data.coords.map(function (c) { return isH ? c[1] : c[0]; });
  var target = balancePosition(values, data.weights);

  var c = viewportCenterLngLat();
  // Same length rule as snapEndpoints, so the segment matches the snap buttons.
  var len = Math.hypot(endpoints[1][0] - endpoints[0][0],
                       endpoints[1][1] - endpoints[0][1]);
  var half = Math.min(5, Math.max(2, len / 2));
  function build(fixed) {
    return isH
      ? [[c[0] - half, fixed], [c[0] + half, fixed]]
      : [[fixed, c[1] - half], [fixed, c[1] + half]];
  }

  var animate = animateChk.checked &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!animate) {
    endpoints = build(target);
    scheduleRecompute();
    return;
  }

  // Sweep the fixed coordinate from an edge to the target: north → down for a
  // horizontal line, west → across for a vertical one. recompute() runs each
  // frame, so the card percentages visibly converge and settle at ~50/50.
  var start = isH ? clipBbox[3] : clipBbox[0];
  var t0 = null, dur = 600;
  function frame(ts) {
    if (t0 === null) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    var e = 1 - Math.pow(1 - p, 3);          // ease-out cubic
    endpoints = build(start + (target - start) * e);
    recompute();
    sweepRAF = p < 1 ? requestAnimationFrame(frame) : null;
  }
  sweepRAF = requestAnimationFrame(frame);
}
document.getElementById('btn-balance-ns').addEventListener('click', function () { balanceLine('horizontal'); });
document.getElementById('btn-balance-we').addEventListener('click', function () { balanceLine('vertical'); });

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
      hasGroups = !!(features.groups && features.groupNames);
      breakdownEl.hidden = !hasGroups;
      statLabelEl.textContent = source.label;
      document.getElementById('credit-source').textContent = source.label;
      renderSources(source.sources);

      var notes = (source.notes || []).slice();
      if (stride > 1) {
        notes.push('Drawing every ' + stride + 'th point (' +
          fmtInt.format(Math.ceil(mercPts.length / stride)) + ' of ' +
          fmtInt.format(mercPts.length) + '); all are counted.');
      }
      showNotice(notes, false);
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

(function wireLoading() {
  var picker = document.getElementById('dataset-picker');
  var fileInput = document.getElementById('file-input');

  if (CONFIG.datasets && CONFIG.datasets.length) {
    picker.hidden = false;
    // All catalogue datasets list in CONFIG order; the synthetic default is
    // always appended last (value -999, matched by the i < 0 branch below).
    var opts = CONFIG.datasets.map(function (d, i) {
      return '<option value="' + i + '">' + d.label + '</option>';
    });
    opts.push('<option value="-999">Synthetic (fake) population</option>');
    picker.innerHTML = opts.join('');
    picker.value = '0';
    picker.addEventListener('change', function () {
      picker.classList.remove('deselected'); // a real choice again
      var i = Number(picker.value);
      if (i < 0) setSource(createSyntheticSource(CONFIG.synthetic)).catch(function () {});
      else loadDataset(CONFIG.datasets[i]);
    });
  }

  document.getElementById('btn-load').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files[0]) loadFile(fileInput.files[0]);
    fileInput.value = ''; // so re-picking the same file fires `change` again
  });

  // dragover must be cancelled or the browser navigates to the file instead.
  var depth = 0;
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('dragenter', function (e) {
    e.preventDefault();
    depth++;
    document.body.classList.add('drop-active');
  });
  window.addEventListener('dragleave', function () {
    // dragenter/dragleave fire per element crossed, so count rather than
    // clearing on the first leave — otherwise the overlay flickers off as the
    // pointer moves between the panel and the map.
    depth = Math.max(0, depth - 1);
    if (!depth) document.body.classList.remove('drop-active');
  });
  window.addEventListener('drop', function (e) {
    e.preventDefault();
    depth = 0;
    document.body.classList.remove('drop-active');
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) loadFile(f);
  });
})();

// --- go ------------------------------------------------------------------
// Resizing changes both the pixel↔world scale and the visible extent, so the
// fills must be rebuilt too — not just the handle sizes.
window.addEventListener('resize', function () {
  applyViewBox();
  syncScreenScale();
  scheduleRecompute();
});

// Touch targets need to be bigger than mouse ones.
if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
  CONFIG.grabRadiusPx = 24;
  CONFIG.handleRadiusPx = 10;
}

// Start minimised on a narrow screen, where the expanded panel would cover
// most of the map.
setCollapsed(window.matchMedia('(max-width: 640px)').matches);

syncScreenScale();
// The default source is the first catalogue dataset (Population by LA). It is
// fetched, which a browser blocks under file://, so a double-click launch can't
// load it — fall back to the synthetic source there so the map is never blank.
(function bootSource() {
  var picker = document.getElementById('dataset-picker');
  var first = CONFIG.datasets && CONFIG.datasets[0];
  if (!first) {
    setSource(createSyntheticSource(CONFIG.synthetic)).catch(function () {});
    return;
  }
  loadDataset(first, function () {
    if (picker) picker.value = '-1'; // keep the dropdown honest with what rendered
    setSource(createSyntheticSource(CONFIG.synthetic)).catch(function () {});
  });
})();

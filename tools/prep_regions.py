"""Natural Earth -> one self-contained coastline file per region.

Supersedes prep_coast.py, which did the same thing for the UK alone and hard-
coded that region's bounding box. You do NOT need to run this: its output is
already in Play/data/coast/*.js. It exists so those files are reproducible.

    # fetch the three Natural Earth resolutions (see NE_URLS below), then:
    python3 tools/prep_regions.py /path/to/ne-downloads Play/data/coast

WHAT IT EMITS, and why that shape
---------------------------------
One file per region, each assigning into a global registry:

    window.MapSplitCoast = window.MapSplitCoast || {};
    window.MapSplitCoast['us'] = { ...everything about the region... };

A classic <script src> — NOT JSON, and NOT an ES module. That is the whole
point of "portable" here: a no-cors subresource load is the only kind that
works under file://, which is how index.html is opened (double-click, no
server). fetch() and `import` both fail there. So the same file can be pulled
in statically by index.html, or injected as a <script> tag on demand by the
game, and neither needs a server.

Each region carries EVERYTHING needed to draw and play it, because a consumer
that has to be told a region's origin separately is not portable:

    id, label, flag        identity, for a picker
    displayBbox            [w,s,e,n] — defines origin and viewBox
    padBbox                the pre-layout clip fallback (see app.js)
    defaultLine            two lng/lat endpoints to start from
    origin, scale          world units = (normalised Mercator - origin) * scale
    viewBox                [0, 0, W, H] in those world units
    subject                paths for the land the statistics COUNT
    context                paths for background land that is NOT counted

`subject` / `context` is the generalisation of the UK build's GBR / IRL: Ireland
was drawn as context because it carries no data points. Every region needs the
same distinction (the US frame shows Canada and Mexico; the EU frame shows its
neighbours), so it is named for what it does rather than for one country.

TOLERANCES
----------
Douglas-Peucker tolerance and the minimum ring area are in WORLD UNITS, which
are absolute — a fraction of the whole Mercator square, not of the region. So
they cannot be shared between regions: 10 units is sub-pixel for the UK
(viewBox 29,306 wide) and absurd over-detail for the world (1,000,000 wide).
Each region therefore names its own, chosen so the tolerance is roughly 0.03%
of that region's viewBox width — sub-pixel on a 4K display — and the source
resolution is stepped down as the frame grows.

The UK region deliberately reproduces prep_coast.py's output byte for byte
(10m source, tol 10, min area 4000, and no clipping, which that script did not
do). That is the regression test for this rewrite: same input, same bytes.
"""
import json, math, os, sys

SCALE = 1_000_000

NE_URLS = {
    '110m': 'https://raw.githubusercontent.com/martynafford/natural-earth-geojson'
            '/master/110m/cultural/ne_110m_admin_0_countries.json',
    '50m':  'https://raw.githubusercontent.com/martynafford/natural-earth-geojson'
            '/master/50m/cultural/ne_50m_admin_0_countries.json',
    '10m':  'https://raw.githubusercontent.com/martynafford/natural-earth-geojson'
            '/master/10m/cultural/ne_10m_admin_0_countries.json',
}

EU27 = ('AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU '
        'LUX MLT NLD POL PRT ROU SVK SVN ESP SWE').split()

# `subject: None` means "every country in the frame is counted".
REGIONS = [
    {
        'id': 'uk', 'label': 'United Kingdom', 'flag': '\U0001F1EC\U0001F1E7',
        'res': '10m',
        'displayBbox': [-8.65, 49.8, 1.9, 61.0],
        'padBbox': [-13, 47, 5, 62],
        'defaultLine': [[-4.05, 54.9], [1.35, 50.9]],
        'subject': ['GBR'], 'context': ['IRL'],
        'tol': 10.0, 'minArea': 4000.0,
        # prep_coast.py did not clip, and the UK output must stay identical.
        'clip': False,
    },
    {
        'id': 'eu', 'label': 'European Union', 'flag': '\U0001F1EA\U0001F1FA',
        'res': '50m',
        # Mainland EU plus the Nordics, Malta and Cyprus. The outermost regions
        # (Canaries, Azores, Madeira, the French DOM) are OUTSIDE this frame and
        # are clipped away — Eurostat's own maps show them as insets, which a
        # single-projection split line cannot do. Say so wherever this is used.
        'displayBbox': [-11.0, 34.0, 34.0, 72.0],
        'padBbox': [-22.0, 27.0, 45.0, 76.0],
        'defaultLine': [[4.0, 58.0], [20.0, 42.0]],
        'subject': EU27, 'context': None,
        'tol': 40.0, 'minArea': 30000.0,
        'clip': True,
    },
    {
        'id': 'us', 'label': 'United States', 'flag': '\U0001F1FA\U0001F1F8',
        'res': '50m',
        # The contiguous 48. Alaska and Hawaii are outside the frame on purpose:
        # a single straight line in one Mercator projection cannot mean anything
        # sensible across a country that spans the antimeridian.
        'displayBbox': [-125.0, 24.0, -66.5, 49.6],
        'padBbox': [-140.0, 15.0, -52.0, 57.0],
        'defaultLine': [[-104.0, 45.0], [-84.0, 29.0]],
        'subject': ['USA'], 'context': None,
        'tol': 40.0, 'minArea': 30000.0,
        'clip': True,
    },
    {
        'id': 'world', 'label': 'World', 'flag': '\U0001F30D',
        'res': '110m',
        # Every inhabited landmass. Antarctica falls outside the south edge and
        # is clipped away: in Mercator it is a smear along the bottom of the
        # frame and it has no population to split.
        'displayBbox': [-180.0, -56.0, 180.0, 80.0],
        'padBbox': [-180.0, -70.0, 180.0, 84.0],
        'defaultLine': [[-30.0, 60.0], [60.0, -20.0]],
        'subject': None, 'context': None,
        'tol': 300.0, 'minArea': 250000.0,
        'clip': True,
    },
]


def merc(lng, lat):
    x = lng / 360 + 0.5
    s = max(-0.9999, min(0.9999, math.sin(math.radians(lat))))
    y = 0.5 - (0.25 * math.log((1 + s) / (1 - s))) / math.pi
    return x, y


def dp(pts, tol):
    """Douglas-Peucker, iterative.

    prep_coast.py's recursive version was fine for two countries at 10m; a
    world ring can nest deep enough to hit Python's recursion limit, and a
    stack costs nothing.
    """
    n = len(pts)
    if n < 3:
        return list(pts)
    keep = [False] * n
    keep[0] = keep[n - 1] = True
    stack = [(0, n - 1)]
    while stack:
        lo, hi = stack.pop()
        if hi - lo < 2:
            continue
        ax, ay = pts[lo]
        bx, by = pts[hi]
        dx, dy = bx - ax, by - ay
        den = math.hypot(dx, dy)
        imax, dmax = lo, -1.0
        for i in range(lo + 1, hi):
            px, py = pts[i]
            if den == 0:
                d = math.hypot(px - ax, py - ay)
            else:
                d = abs(dx * (ay - py) - (ax - px) * dy) / den
            if d > dmax:
                imax, dmax = i, d
        if dmax > tol:
            keep[imax] = True
            stack.append((lo, imax))
            stack.append((imax, hi))
    return [pts[i] for i in range(n) if keep[i]]


def area(pts):
    n = len(pts)
    return abs(sum(pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1]
                   for i in range(n))) / 2


def clip_rect(pts, x0, y0, x1, y1):
    """Sutherland-Hodgman against the display rectangle.

    Country polygons run far past any regional frame — Russia in the EU box,
    Canada in the US box — and unclipped they dominate the output bytes for
    geometry nobody can see. The subject polygon may be concave; only the CLIP
    region has to be convex, and a rectangle is.
    """
    def inside(p, edge):
        if edge == 0: return p[0] >= x0
        if edge == 1: return p[0] <= x1
        if edge == 2: return p[1] >= y0
        return p[1] <= y1

    def cross(a, b, edge):
        ax, ay = a
        bx, by = b
        if edge in (0, 1):
            x = x0 if edge == 0 else x1
            t = (x - ax) / (bx - ax)
            return (x, ay + t * (by - ay))
        y = y0 if edge == 2 else y1
        t = (y - ay) / (by - ay)
        return (ax + t * (bx - ax), y)

    out = list(pts)
    for edge in range(4):
        if not out:
            return []
        src, out = out, []
        prev = src[-1]
        for cur in src:
            ci, pi = inside(cur, edge), inside(prev, edge)
            if ci:
                if not pi:
                    out.append(cross(prev, cur, edge))
                out.append(cur)
            elif pi:
                out.append(cross(prev, cur, edge))
            prev = cur
    return out


def rings(feature):
    g = feature['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        for ring in poly:
            yield ring


def code_of(f):
    p = f['properties']
    return p.get('ADM0_A3') or p.get('adm0_a3')


def build(region, features):
    W, S, E, N = region['displayBbox']
    ox, oy = merc(W, N)
    x1, y1 = merc(E, S)
    vw, vh = round((x1 - ox) * SCALE), round((y1 - oy) * SCALE)

    subject_codes = region['subject']
    context_codes = region['context']
    out = {'subject': [], 'context': []}
    stats = {'kept': 0, 'dropped': 0, 'clipped': 0}

    for f in features:
        code = code_of(f)
        if subject_codes is None:
            bucket = 'subject'
        elif code in subject_codes:
            bucket = 'subject'
        elif context_codes is None or code in context_codes:
            bucket = 'context'
        else:
            continue

        for ring in rings(f):
            pts = []
            for pair in ring:
                x, y = merc(pair[0], pair[1])
                pts.append(((x - ox) * SCALE, (y - oy) * SCALE))
            if region['clip']:
                before = len(pts)
                pts = clip_rect(pts, 0, 0, vw, vh)
                if len(pts) != before:
                    stats['clipped'] += 1
            if len(pts) < 4 or area(pts) < region['minArea']:
                stats['dropped'] += 1
                continue
            simp = dp(pts, region['tol'])
            if len(simp) < 4:
                stats['dropped'] += 1
                continue
            stats['kept'] += 1
            out[bucket].append(
                'M' + 'L'.join('%d %d' % (round(x), round(y)) for x, y in simp) + 'Z')

    return {
        'id': region['id'], 'label': region['label'], 'flag': region['flag'],
        'displayBbox': region['displayBbox'],
        'padBbox': region['padBbox'],
        'defaultLine': region['defaultLine'],
        'origin': [ox, oy], 'scale': SCALE,
        'viewBox': [0, 0, vw, vh],
        'subject': out['subject'], 'context': out['context'],
    }, stats


def emit(reg, path):
    body = json.dumps(reg, separators=(',', ':'), ensure_ascii=False)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(
            '// Generated by tools/prep_regions.py — do not hand-edit.\n'
            '// Portable on purpose: a classic <script src> works under file://,\n'
            '// which fetch() and ES module imports do not.\n'
            'window.MapSplitCoast = window.MapSplitCoast || {};\n'
            'window.MapSplitCoast[%s] = %s;\n' % (json.dumps(reg['id']), body))
    return os.path.getsize(path)


if __name__ == '__main__':
    src_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    out_dir = sys.argv[2] if len(sys.argv) > 2 else 'Play/data/coast'
    only = sys.argv[3:] or None
    os.makedirs(out_dir, exist_ok=True)

    cache = {}
    for region in REGIONS:
        if only and region['id'] not in only:
            continue
        res = region['res']
        if res not in cache:
            p = os.path.join(src_dir, 'ne_%s.json' % res)
            cache[res] = json.load(open(p, encoding='utf-8'))['features']
        reg, stats = build(region, cache[res])
        size = emit(reg, os.path.join(out_dir, '%s.js' % region['id']))
        print('%-6s %-4s viewBox=%d x %-7d subject=%-4d context=%-4d '
              'kept=%-4d dropped=%-4d clipped=%-4d %6.1f KB'
              % (region['id'], res, reg['viewBox'][2], reg['viewBox'][3],
                 len(reg['subject']), len(reg['context']),
                 stats['kept'], stats['dropped'], stats['clipped'], size / 1024))

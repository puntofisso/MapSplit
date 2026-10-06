"""Shared helpers for the data pipeline: paths, fetching, local-authority
geography, and the checks every statistic must pass before it ships.

Standard library only (plus pyproj in the sources that need BNG), so that a
rebuild next year does not depend on the state of anyone's scientific Python.
"""
import csv
import json
import os
import urllib.request

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SOURCES = os.path.join(REPO, 'sources')
RAW = os.path.join(REPO, 'data', 'raw')
STATS = os.path.join(REPO, 'data', 'stats')

UK_BBOX = (-8.7, 49.8, 1.9, 61.0)       # matches the game's displayBbox
NATIONS = {'E': 'England', 'W': 'Wales', 'S': 'Scotland', 'N': 'Northern Ireland'}


class BuildError(Exception):
    pass


def raw_path(source_id, name):
    return os.path.join(RAW, source_id, name)


def fetch_arcgis(url, dest, fields, refresh=False, page=2000):
    """Page through an ArcGIS FeatureServer layer → GeoJSON (WGS84) file.
    ONS layers cap a response at 1000–2000 features; tens of thousands of
    LSOAs need paging, which a plain URL in source.json cannot express."""
    if os.path.exists(dest) and not refresh:
        return dest
    feats, offset = [], 0
    while True:
        q = ('%s/query?where=1%%3D1&outFields=%s&outSR=4326&f=geojson'
             '&resultOffset=%d&resultRecordCount=%d&orderByFields=FID' % (url, fields, offset, page))
        req = urllib.request.Request(q, headers={'User-Agent': 'MapSplit-pipeline (puntofisso.net)'})
        with urllib.request.urlopen(req, timeout=300) as r:
            got = json.load(r).get('features', [])
        feats += got
        if len(got) < page:
            break
        offset += page
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    json.dump({'type': 'FeatureCollection', 'features': feats}, open(dest, 'w'))
    return dest


def fetch(url, dest, refresh=False):
    """Download url → dest unless it is already there. Returns dest."""
    if os.path.exists(dest) and not refresh:
        return dest
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'MapSplit-pipeline (puntofisso.net)'})
    tmp = dest + '.part'
    with urllib.request.urlopen(req, timeout=300) as r, open(tmp, 'wb') as f:
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
    os.replace(tmp, dest)
    return dest


# --- Local-authority geography --------------------------------------------

# ONS and HMRC tables still publish some authorities under their pre-change
# codes while the boundaries carry the new ones. A miss here is silent — the
# area simply drops out — which is exactly how Sheffield and Barnsley went
# missing from the first game data. Every source that joins on LA code goes
# through lad_code(), and lad_join() refuses to finish with an unmatched code.
LAD_CODE_CHANGES = {
    'E08000016': 'E08000038',   # Barnsley  (2023 boundary change)
    'E08000019': 'E08000039',   # Sheffield (2023 boundary change)
}


# Tried in turn. In October 2026 overpass-api.de and kumi were throttling
# hard (~8 min per query with retries); the mail.ru mirror answered in ~1 min.
OVERPASS = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter',
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter']


def fetch_overpass(selector, dest, refresh=False, tries=6):
    """Every UK element matching an Overpass selector (e.g. '[brand=Greggs]')
    → JSON of {type,id,lat,lon,name}. Ways and relations come back as their
    centre. The public servers rate-limit and time out under load, so this
    retries across mirrors with growing pauses rather than failing a build."""
    if os.path.exists(dest) and not refresh:
        return dest
    import time
    import urllib.parse
    q = ('[out:json][timeout:300];area["ISO3166-1"="GB"][admin_level=2]->.uk;'
         'nwr%s(area.uk);out center tags;' % selector)
    body = urllib.parse.urlencode({'data': q}).encode()
    last = None
    for attempt in range(tries):
        ep = OVERPASS[attempt % len(OVERPASS)]
        try:
            req = urllib.request.Request(ep, data=body, headers={
                'User-Agent': 'MapSplit-pipeline (puntofisso.net)'})
            with urllib.request.urlopen(req, timeout=330) as r:
                d = json.load(r)
            if d.get('remark') and 'error' in d['remark'].lower():
                raise BuildError(d['remark'])
            els = []
            for e in d.get('elements', []):
                c = e if 'lat' in e else e.get('center')
                if c:
                    els.append({'type': e['type'], 'id': e['id'], 'lat': c['lat'], 'lon': c['lon'],
                                'name': e.get('tags', {}).get('name', '')})
            if not els:
                # A busy server can answer with an empty set, and so can a
                # selector that matches nothing (Waitrose is tagged "Waitrose
                # & Partners"). Neither should become an empty statistic.
                raise BuildError('no elements for %s' % selector)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            json.dump(els, open(dest, 'w'))
            return dest
        except Exception as e:      # network, HTTP 429/504, bad JSON
            last = e
            time.sleep(20 * (attempt + 1))
    raise BuildError('Overpass failed for %s: %s' % (selector, last))


def lad_code(code):
    code = str(code).strip()
    return LAD_CODE_CHANGES.get(code, code)


_LAD = None


def lads():
    """{code: {'lon','lat','name','rings'}} from the LAD May 2025 BUC file.

    lon/lat is ONS's own label point (always inside the polygon), which is
    what the first game data used too. rings are kept for point-in-polygon.
    """
    global _LAD
    if _LAD is None:
        p = raw_path('boundaries', 'lad25_buc.geojson')
        if not os.path.exists(p):
            raise BuildError('missing %s — run the boundaries source first' % p)
        _LAD = {}
        for f in json.load(open(p))['features']:
            pr = f['properties']
            g = f['geometry']
            polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
            rings = []
            for poly in polys:
                outer = poly[0]
                xs = [c[0] for c in outer]; ys = [c[1] for c in outer]
                rings.append(((min(xs), min(ys), max(xs), max(ys)), poly))
            _LAD[pr['LAD25CD']] = {'lon': pr['LONG'], 'lat': pr['LAT'],
                                   'name': pr['LAD25NM'], 'rings': rings}
    return _LAD


def _in_ring(x, y, ring):
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def lad_at(lon, lat):
    """Code of the LA containing the point, or the nearest label point when
    the point is offshore (piers, lighthouses, offshore wind)."""
    best = None
    for code, la in lads().items():
        for (x0, y0, x1, y1), poly in la['rings']:
            if x0 <= lon <= x1 and y0 <= lat <= y1 and _in_ring(lon, lat, poly[0]) \
                    and not any(_in_ring(lon, lat, h) for h in poly[1:]):
                return code
    for code, la in lads().items():
        d = (la['lon'] - lon) ** 2 + (la['lat'] - lat) ** 2
        if best is None or d < best[0]:
            best = (d, code)
    return best[1]


def nation_of(code):
    return NATIONS.get(str(code)[:1])


# --- Output ---------------------------------------------------------------

def row(lon, lat, value, name, code):
    """One output point. `code` is a GSS code; it only feeds the checks."""
    return {'lon': float(lon), 'lat': float(lat), 'value': value, 'name': name, 'code': code}


def _num(v):
    return int(v) if float(v).is_integer() else round(v, 4)


def write_stat(stat_id, rows):
    os.makedirs(STATS, exist_ok=True)
    path = os.path.join(STATS, stat_id + '.csv')
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f, lineterminator='\n')
        w.writerow(['lon', 'lat', 'value', 'name'])
        # Zero-weight points cannot move a weighted quantile, and in sparse
        # census variables they are most of the file.
        for r in sorted(rows, key=lambda r: (r['code'], r['name'])):
            if r['value'] == 0:
                continue
            w.writerow([round(r['lon'], 4), round(r['lat'], 4), _num(r['value']), r['name']])
    return path


# --- Checks ---------------------------------------------------------------

def check_stat(stat, rows):
    """Fail on anything that would make the game silently wrong; return
    warnings for things a human should look at in the review."""
    sid = stat['id']
    warnings = []
    if not rows:
        raise BuildError('%s: no rows' % sid)
    for r in rows:
        v = r['value']
        if v is None or v != v or v < 0:
            raise BuildError('%s: bad value %r at %s' % (sid, v, r['name']))
        box = stat.get('frame', UK_BBOX)   # a statistic may widen it, with a caveat saying why
        if not (box[0] <= r['lon'] <= box[2] and box[1] <= r['lat'] <= box[3]):
            raise BuildError('%s: point outside the UK frame at %s (%s, %s)'
                             % (sid, r['name'], r['lon'], r['lat']))
    total = sum(r['value'] for r in rows)
    if total <= 0:
        raise BuildError('%s: total is zero' % sid)

    # One point carrying a big share pins the answer line to that point
    # (Dinorwig pumped storage did this to hydro).
    top = max(rows, key=lambda r: r['value'])
    cap = stat.get('maxPointShare', 0.10)
    if top['value'] / total > cap:
        raise BuildError('%s: %s holds %.0f%% of the total (limit %.0f%%)'
                         % (sid, top['name'], 100 * top['value'] / total, 100 * cap))

    by_nation = {n: 0.0 for n in NATIONS.values()}
    for r in rows:
        n = nation_of(r['code'])
        if n:
            by_nation[n] += r['value']
    shares = {n: v / total for n, v in by_nation.items()}
    for n, s in shares.items():
        if s == 0 and n not in stat.get('absentFrom', {}):
            warnings.append('%s: zero in %s' % (sid, n))

    expect = stat.get('expectTotal')
    if expect:
        lo, hi = expect
        if not (lo <= total <= hi):
            raise BuildError('%s: total %s outside the expected %s–%s' % (sid, total, lo, hi))
    return {'points': sum(1 for r in rows if r['value'] > 0), 'total': total,
            'shares': {n: round(s, 4) for n, s in shares.items()}}, warnings


# --- Census small areas ---------------------------------------------------

_SMALL = None


def small_areas():
    """(oa_to_area, areas) for the whole UK.

    oa_to_area maps every census Output Area code (and NI Data Zone, which is
    already the unit) to its LSOA / Data Zone; areas maps that code to
    {'lon','lat','lad','name'}. Built once from sources/smallareas and cached
    in data/raw/smallareas/areas.json, because naming ~47k points by
    point-in-polygon takes a while.
    """
    global _SMALL
    if _SMALL is not None:
        return _SMALL
    base = os.path.join(RAW, 'smallareas')
    cache = os.path.join(base, 'areas.json')
    if os.path.exists(cache):
        _SMALL = tuple(json.load(open(cache)))
        return _SMALL

    from pyproj import Transformer
    import shapefile
    bng = Transformer.from_crs(27700, 4326, always_xy=True)
    irish = Transformer.from_crs(29902, 4326, always_xy=True)
    oa_to_area, areas = {}, {}

    # England & Wales: ONS lookup + ONS LSOA population-weighted centroids.
    # The lookup's own LAD is authoritative; point-in-polygon against the
    # ultra-generalised boundaries misplaces ~0.6% of LSOAs along borders, so
    # it is only the fallback for authorities created since 2022 (Cumberland,
    # North Yorkshire, Somerset...), which are whole mergers and safe for it.
    lsoa_lad = {}
    for r in csv.DictReader(open(os.path.join(base, 'oa21_lsoa21_lookup_ew.csv'), encoding='utf-8-sig')):
        oa_to_area[r['OA21CD']] = r['LSOA21CD']
        lsoa_lad[r['LSOA21CD']] = lad_code(r['LAD22CD'])
    current = lads()
    for f in json.load(open(os.path.join(base, 'lsoa21_pwc_ew.geojson')))['features']:
        lon, lat = f['geometry']['coordinates']
        lad = lsoa_lad.get(f['properties']['LSOA21CD'])
        if lad not in current:
            lad = lad_at(lon, lat)
        areas[f['properties']['LSOA21CD']] = {'lon': lon, 'lat': lat, 'lad': lad}

    # Scotland: NRS lookup; DZ point = population-weighted mean of OA centroids.
    for r in csv.DictReader(open(os.path.join(base, 'oa22_dz22_iz22', 'OA22_DZ22_IZ22.csv'), encoding='utf-8-sig')):
        oa_to_area[r['OA22']] = r['DZ22']
    acc = {}
    shp = os.path.join(base, 'output-area-2022-pwc', 'OutputArea2022_PWC', 'OutputArea2022_PWC.shp')
    for x, y, a in shapefile.read_points(shp):
        dz = oa_to_area.get(a['code'])
        if dz is None:
            raise BuildError('Scottish OA %s has no Data Zone in the NRS lookup' % a['code'])
        w = max(a['Popcount'], 1.0)          # an empty OA still marks the area
        s = acc.setdefault(dz, [0.0, 0.0, 0.0, a['council']])
        s[0] += x * w; s[1] += y * w; s[2] += w
    for dz, (sx, sy, sw, council) in acc.items():
        lon, lat = bng.transform(sx / sw, sy / sw)
        areas[dz] = {'lon': lon, 'lat': lat, 'lad': lad_code(council)}

    # Northern Ireland: the census unit IS the Data Zone; NISRA centroids.
    for r in csv.DictReader(open(os.path.join(base, 'ni-dz21-pwc', 'census-2021-population-weighted-centroids-data-zone.csv'), encoding='utf-8-sig')):
        lon, lat = irish.transform(float(r['X']), float(r['Y']))
        oa_to_area[r['DZ2021_code']] = r['DZ2021_code']
        areas[r['DZ2021_code']] = {'lon': lon, 'lat': lat, 'lad': lad_at(lon, lat)}

    la = lads()
    for a in areas.values():
        if a['lad'] not in la:
            raise BuildError('small area placed in unknown LA %s' % a['lad'])
        a['name'] = la[a['lad']]['name']
    _SMALL = (oa_to_area, areas)
    json.dump([oa_to_area, areas], open(cache, 'w'))
    return _SMALL


# --- Aggregation ----------------------------------------------------------

def aggregate_lad(rows):
    """One point per local authority: the statistic summed over the LA, placed
    at the statistic's OWN weighted centre within it (not the LA's label
    point), so a district's pubs sit where its pubs are. Averaging lon/lat
    directly is fine at the scale of one authority."""
    acc = {}
    for r in rows:
        if r['value'] <= 0:
            continue
        a = acc.setdefault(r['code'], [0.0, 0.0, 0.0])
        a[0] += r['lon'] * r['value']
        a[1] += r['lat'] * r['value']
        a[2] += r['value']
    la = lads()
    return [row(sx / w, sy / w, w, la[code]['name'], code) for code, (sx, sy, w) in acc.items()]

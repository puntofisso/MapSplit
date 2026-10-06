"""Survey EVERY Unified Census variable: where would its 50/50 line fall on
each axis, and how far is that from the population's line?

    python3 tools/pipeline/survey_census.py > /tmp/census_survey.csv

This is the "find all questions in a dataset" step for the census. It is an
exploration aid, not the game's grading: it uses plain weighted medians in
Web Mercator, which is what the game's quantilePosition does, but the final
numbers for shipped puzzles come from the game's own code.
"""
import csv
import glob
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common  # noqa: E402

EXCLUDED_TABLES = {'uk021', 'uk023', 'uk030'}   # ethnicity, religion: owner's rule
R2 = math.sqrt(0.5)
# Each axis is a projection of Mercator (x east, y SOUTH) onto the direction
# the answer moves in, signed so that a POSITIVE gap means the statistic's line
# sits that way of the population's: north, east, north-east, north-west.
# 'nwse' is a line running NW–SE, which lies ALONG the London–Glasgow spine
# (the dead axis CLAUDE.md describes); 'nesw' runs NE–SW and cuts across it.
AXES = {
    'ns':   lambda x, y: -y,
    'we':   lambda x, y: x,
    'nwse': lambda x, y: (x - y) * R2,
    'nesw': lambda x, y: (-x - y) * R2,
}


def merc(lon, lat):
    s = math.sin(math.radians(lat))
    return lon / 360 + 0.5, 0.5 - 0.25 * math.log((1 + s) / (1 - s)) / math.pi


def wmedian(vals, wts):
    pairs = sorted(zip(vals, wts))
    half = sum(wts) / 2
    acc = 0
    for v, w in pairs:
        acc += w
        if acc >= half:
            return v


def main():
    base = os.path.join(common.RAW, 'unified_census')
    meta = {r['Variable_ID']: r for r in csv.DictReader(
        open(os.path.join(base, 'unified_census_variable_metadata.csv'), encoding='utf-8-sig'))}
    oa_to_area, areas = common.small_areas()
    codes = sorted(areas)
    idx = {c: i for i, c in enumerate(codes)}
    pts = [merc(areas[c]['lon'], areas[c]['lat']) for c in codes]
    nation = [areas[c]['lad'][0] for c in codes]

    sums = {}
    for path in sorted(glob.glob(os.path.join(base, 'csv', 'uk*.csv'))):
        table = os.path.basename(path)[:-4]
        if table in EXCLUDED_TABLES:
            continue
        rd = csv.reader(open(path, encoding='utf-8-sig'))
        head = next(rd)
        cols = head[1:]
        acc = [[0.0] * len(codes) for _ in cols]
        for r in rd:
            i = idx[oa_to_area[r[0]]]
            for j, v in enumerate(r[1:]):
                if v:
                    acc[j][i] += float(v)
        for j, c in enumerate(cols):
            sums[c] = acc[j]

    ref_lat = 52.5
    km_per_unit = 40075 * math.cos(math.radians(ref_lat))
    proj = {ax: [f(x, y) for x, y in pts] for ax, f in AXES.items()}

    def lines(w):
        return {ax: wmedian(proj[ax], w) for ax in AXES}

    pop = lines(sums['uk001001'])
    out = csv.writer(sys.stdout, lineterminator='\n')
    out.writerow(['variable', 'name', 'unit', 'total', 'ns_lat', 'we_lon',
                  'ns_km', 'we_km', 'nwse_km', 'nesw_km', 'max_abs_km',
                  'top_area_share', 'E', 'W', 'S', 'N'])
    for vid, vals in sums.items():
        m = meta.get(vid, {})
        if m.get('Variable_Name', '').split(':')[-1].strip().startswith('Total') or vid.endswith('001'):
            continue
        tot = sum(vals)
        if tot <= 0:
            continue
        L = lines(vals)
        km = {ax: (L[ax] - pop[ax]) * km_per_unit for ax in AXES}
        y = -L['ns']
        lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y))))
        lon = (L['we'] - 0.5) * 360
        nat = {k: 0.0 for k in 'EWSN'}
        for v, n in zip(vals, nation):
            nat[n] += v
        out.writerow([vid, m.get('Variable_Name', vid), m.get('Unit', ''), int(tot),
                      round(lat, 3), round(lon, 3)]
                     + [round(km[ax]) for ax in AXES]
                     + [round(max(abs(v) for v in km.values()))]
                     + [round(max(vals) / tot, 4)] + [round(nat[k] / tot, 3) for k in 'EWSN'])


if __name__ == '__main__':
    main()

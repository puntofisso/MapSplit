"""REPD → one point per project, weighted by capacity (MW) or counted.

Projects without coordinates are dropped; the build fails if they carry more
than maxMissingCoordShare of a statistic's weight, so a bad quarterly extract
cannot quietly lose a region.
"""
import csv

import common


def build(src):
    from pyproj import Transformer
    bng = Transformer.from_crs(27700, 4326, always_xy=True)
    rows = list(csv.DictReader(open(common.raw_path('repd', src['fetch'][0]['file']), encoding='latin-1')))
    out = {}
    for st in src['stats']:
        pts, lost, total, swapped = [], 0.0, 0.0, []
        for r in rows:
            if r['Technology Type'] not in st['technologies'] or \
                    r['Development Status (short)'] not in st['statuses']:
                continue
            try:
                w = 1.0 if st['weight'] == 'count' else float(r['Installed Capacity (MWelec)'])
            except ValueError:
                w = 0.0
            total += w
            try:
                x, y = float(r['X-coordinate']), float(r['Y-coordinate'])
            except ValueError:
                lost += w
                continue
            # Some rows have easting and northing swapped (seen on Highland
            # and Aberdeenshire battery sites). No UK easting exceeds 700 km,
            # so an X above that with a plausible Y is a swap, not a place.
            if x > 700000 and y < 700000:
                x, y = y, x
                swapped.append(r['Site Name'])
            lon, lat = bng.transform(x, y)
            code = common.lad_at(lon, lat)
            pts.append(common.row(lon, lat, w, common.lads()[code]['name'], code))
        if total and lost / total > src['maxMissingCoordShare']:
            raise common.BuildError('%s: %.1f%% of the weight has no coordinates' % (st['id'], 100 * lost / total))
        if swapped:
            print('    %s: swapped X/Y back for %d project(s): %s' % (st['id'], len(swapped), '; '.join(swapped)))
        out[st['id']] = pts
    return out, {}

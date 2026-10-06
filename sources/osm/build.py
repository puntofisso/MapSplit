"""OpenStreetMap (via Overpass) → one point per place, weight 1, named after
the local authority it falls in. The raw JSON per statistic is in
data/raw/osm/<id>.json."""
import json

import common


def build(src):
    out = {}
    lads = common.lads()
    for st in src['stats']:
        els = json.load(open(common.raw_path('osm', st['id'] + '.json')))
        rows = []
        seen = set()
        outside = 0
        for e in els:
            # Overpass's area for the UK relation reaches some overseas
            # territories (a Starbucks in Turks and Caicos came back).
            x0, y0, x1, y1 = common.UK_BBOX
            if not (x0 <= e['lon'] <= x1 and y0 <= e['lat'] <= y1):
                outside += 1
                continue
            key = (e['type'], e['id'])
            if key in seen:
                continue
            seen.add(key)
            code = common.lad_at(e['lon'], e['lat'])
            rows.append(common.row(e['lon'], e['lat'], 1.0, lads[code]['name'], code))
        if outside:
            print('    %s: dropped %d element(s) outside the UK frame' % (st['id'], outside))
        out[st['id']] = rows
    return out, {}

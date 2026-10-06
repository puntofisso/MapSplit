"""HoC Library candidacies → votes per party per constituency, at the
constituency's ONS label point. 'Did not vote' is electorate minus valid
votes, counted once per constituency."""
import csv
import json

import common


def build(src):
    pts = {}
    for f in json.load(open(common.raw_path('boundaries', 'pcon24_points.json')))['features']:
        a = f['attributes']
        pts[a['PCON24CD']] = (a['LONG'], a['LAT'], a['PCON24NM'])

    votes = {}          # (party, code) -> votes
    seats = {}          # code -> (electorate, valid)
    unknown = set()
    path = common.raw_path('ge2024', 'candidacies.csv')
    for r in csv.DictReader(open(path, encoding='utf-8-sig')):
        code = r['Constituency geographic code']
        if code not in pts:
            unknown.add(code)
            continue
        party = r['Main party abbreviation']
        votes[(party, code)] = votes.get((party, code), 0) + int(r['Candidate vote count'])
        seats[code] = (int(r['Electorate']), int(r['Election valid vote count']))
    if unknown:
        raise common.BuildError('ge2024: constituencies with no ONS point: %s' % sorted(unknown))

    out, dropped = {}, {}
    for stat in src['stats']:
        rows = []
        for code, (lon, lat, name) in pts.items():
            if code not in seats:
                dropped.setdefault(stat['id'], []).append(code)
                continue
            if stat['party'] is None:
                v = seats[code][0] - seats[code][1]
            else:
                v = votes.get((stat['party'], code), 0)
            rows.append(common.row(lon, lat, v, name, code))
        out[stat['id']] = rows
    return out, dropped

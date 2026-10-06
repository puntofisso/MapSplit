"""Unified UK Census → one point per LSOA / Data Zone per variable.

Reads only the tables the declared statistics use, sums Output Areas into
their small area (common.small_areas), and refuses any variable from a table
listed in excludedTables — so a content rule cannot be undone by a typo.
"""
import csv
import os

import common


def build(src):
    base = common.raw_path('unified_census', 'csv')
    oa_to_area, areas = common.small_areas()
    by_table = {}
    for st in src['stats']:
        table = st['variable'][:-3]
        if table in src.get('excludedTables', {}):
            raise common.BuildError('%s uses excluded table %s (%s)'
                                    % (st['id'], table, src['excludedTables'][table]))
        by_table.setdefault(table, []).append(st)

    sums = {}
    for table, stats in by_table.items():
        rd = csv.reader(open(os.path.join(base, table + '.csv'), encoding='utf-8-sig'))
        head = next(rd)
        cols = {st['id']: head.index(st['variable']) for st in stats}
        acc = {sid: {} for sid in cols}
        for r in rd:
            area = oa_to_area.get(r[0])
            if area is None:
                raise common.BuildError('census area %s is in no small area' % r[0])
            for sid, ci in cols.items():
                if r[ci]:
                    acc[sid][area] = acc[sid].get(area, 0.0) + float(r[ci])
        sums.update(acc)

    out = {}
    for st in src['stats']:
        rows = []
        for code, v in sums[st['id']].items():
            a = areas[code]
            rows.append(common.row(a['lon'], a['lat'], v, a['name'], a['lad']))
        out[st['id']] = rows
    return out, {}

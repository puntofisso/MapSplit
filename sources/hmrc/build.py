"""HMRC SPI Table 3.14 (by LA) → one point per LA per column.

Counts are published in thousands and amounts in £ millions; `scale` in
source.json turns them back into people and pounds. '[Not available]' cells
are suppressed estimates and are dropped — the runner then insists each
dropped area is explained in knownGaps.
"""
import common
import sheets

LA_PREFIXES = ('E06', 'E07', 'E08', 'E09', 'W06', 'S12', 'N09')


def build(src):
    table = sheets.read_ods(common.raw_path('hmrc', src['fetch'][0]['file']))['Table_3_14']
    head = next(i for i, r in enumerate(table) if r[:2] == ['Area Code', 'Area Name'])
    cols = table[head]
    data = {}
    for r in table[head + 1:]:
        if r and isinstance(r[0], str) and r[0][:3] in LA_PREFIXES:
            data[common.lad_code(r[0])] = r

    lads = common.lads()
    out, dropped = {}, {}
    for stat in src['stats']:
        ci = cols.index(stat['column'])
        rows = []
        for code, la in lads.items():
            r = data.get(code)
            v = r[ci] if r and ci < len(r) else None
            if not isinstance(v, float):
                dropped.setdefault(stat['id'], []).append(code)
                continue
            rows.append(common.row(la['lon'], la['lat'], v * stat['scale'], la['name'], code))
        out[stat['id']] = rows
    return out, dropped

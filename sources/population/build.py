"""ONS MYE2 (persons by single year of age, by LA) → one point per LA."""
import common
import sheets


def build(src):
    book = sheets.read_xlsx(common.raw_path('population', 'mye25tablesuk.xlsx'), only=['MYE2 - Persons'])
    table = book['MYE2 - Persons']
    head = next(i for i, r in enumerate(table) if r[:2] == ['Code', 'Name'])
    cols = table[head]
    # Age columns are '0'..'89' and '90 and over'; 'All ages' is the total.
    age_col = {}
    for i, h in enumerate(cols):
        h = str(h)
        if h.isdigit():
            age_col[int(h)] = i
        elif h.startswith('90'):
            age_col[90] = i
    all_col = cols.index('All ages')

    lads = common.lads()
    data = {}
    for r in table[head + 1:]:
        if not r or not isinstance(r[0], str):
            continue
        code = common.lad_code(r[0])
        if code in lads:
            data[code] = r

    out, dropped = {}, {}
    for stat in src['stats']:
        lo, hi = stat['ages']
        rows = []
        for code, la in lads.items():
            r = data.get(code)
            if r is None:
                dropped.setdefault(stat['id'], []).append(code)
                continue
            if (lo, hi) == (0, 999):
                v = r[all_col]
            else:
                v = sum(r[age_col[a]] for a in age_col if lo <= a <= hi)
            rows.append(common.row(la['lon'], la['lat'], v, la['name'], code))
        out[stat['id']] = rows
    return out, dropped

"""Read .ods and .xlsx sheets with the standard library only.

No pandas: the local install is broken (numpy ABI mismatch) and a build that
depends on the state of someone's scientific Python is not repeatable.
Both formats are a zip of XML, so this is small.
"""
import zipfile
import xml.etree.ElementTree as ET

ODS_NS = {
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
}
T = '{%s}' % ODS_NS['table']
O = '{%s}' % ODS_NS['office']
X = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'


def _ods_cell(c):
    v = c.get(O + 'value')
    if v is not None:
        return float(v)
    return ''.join(c.itertext()).strip()


def read_ods(path):
    """{sheet name: [[cell, ...], ...]}; numbers come back as floats."""
    root = ET.fromstring(zipfile.ZipFile(path).read('content.xml'))
    out = {}
    for t in root.iter(T + 'table'):
        rows = []
        for r in t.iter(T + 'table-row'):
            row = []
            for c in r:
                if c.tag not in (T + 'table-cell', T + 'covered-table-cell'):
                    continue
                n = min(int(c.get(T + 'number-columns-repeated', '1')), 200)
                row.extend([_ods_cell(c)] * n)
            while row and row[-1] == '':
                row.pop()
            rep = min(int(r.get(T + 'number-rows-repeated', '1')), 1 if not row else 10**6)
            rows.extend([row] * rep)
        out[t.get(T + 'name')] = rows
    return out


def _col_index(ref):
    n = 0
    for ch in ref:
        if ch.isalpha():
            n = n * 26 + (ord(ch.upper()) - 64)
        else:
            break
    return n - 1


def read_xlsx(path, only=None):
    """{sheet name: [[cell, ...], ...]}; `only` limits which sheets are parsed."""
    z = zipfile.ZipFile(path)
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).iter(X + 'si'):
            shared.append(''.join(t.text or '' for t in si.iter(X + 't')))
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    target = {r.get('Id'): r.get('Target') for r in rels}
    out = {}
    for s in wb.iter(X + 'sheet'):
        name = s.get('name')
        if only and name not in only:
            continue
        p = target[s.get(R + 'id')].lstrip('/')
        p = p if p.startswith('xl/') else 'xl/' + p
        rows = []
        for r in ET.fromstring(z.read(p)).iter(X + 'row'):
            row = []
            for c in r.iter(X + 'c'):
                i = _col_index(c.get('r', 'A'))
                while len(row) < i:
                    row.append('')
                v = c.find(X + 'v')
                t = c.get('t')
                if t == 's' and v is not None:
                    val = shared[int(v.text)]
                elif t == 'inlineStr':
                    val = ''.join(x.text or '' for x in c.iter(X + 't'))
                elif v is not None:
                    try:
                        val = float(v.text)
                    except ValueError:
                        val = v.text
                else:
                    val = ''
                row.append(val)
            rows.append(row)
        out[name] = rows
    return out

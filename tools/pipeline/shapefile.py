"""Read a POINT shapefile (.shp + .dbf) with the standard library.

Only what the pipeline needs: point geometry and the attribute table. GDAL
(ogr2ogr) is installed here but broken by a Homebrew library mismatch, and a
yearly rebuild should not hinge on that.
"""
import struct


def read_dbf(path):
    with open(path, 'rb') as f:
        head = f.read(32)
        n, hlen, rlen = struct.unpack('<IHH', head[4:12])
        fields = []
        while True:
            d = f.read(32)
            if d[0] == 0x0D:
                break
            name = d[:11].split(b'\0')[0].decode('ascii')
            fields.append((name, chr(d[11]), d[16]))
        f.seek(hlen)
        rows = []
        for _ in range(n):
            rec = f.read(rlen)
            if rec[:1] == b'*':          # deleted record
                continue
            pos, row = 1, {}
            for name, typ, size in fields:
                raw = rec[pos:pos + size].decode('latin-1').strip()
                pos += size
                if typ in 'NF' and raw:
                    row[name] = float(raw)
                else:
                    row[name] = raw
            rows.append(row)
    return rows


def read_points(shp_path):
    """[(x, y, {attributes})] in the file's own coordinate system."""
    attrs = read_dbf(shp_path[:-4] + '.dbf')
    pts = []
    with open(shp_path, 'rb') as f:
        f.seek(100)
        while True:
            rh = f.read(8)
            if len(rh) < 8:
                break
            _, clen = struct.unpack('>II', rh)
            body = f.read(clen * 2)
            stype = struct.unpack('<i', body[:4])[0]
            if stype == 0:
                pts.append(None)
                continue
            if stype not in (1, 11, 21):
                raise ValueError('not a point shapefile (shape type %d)' % stype)
            pts.append(struct.unpack('<dd', body[4:20]))
    if len(pts) != len(attrs):
        raise ValueError('%s: %d shapes but %d attribute rows' % (shp_path, len(pts), len(attrs)))
    return [(p[0], p[1], a) for p, a in zip(pts, attrs) if p is not None]

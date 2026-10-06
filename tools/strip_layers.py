"""Rewrite a .pmtiles archive with some MVT layers removed.

One-off. data/uk.pmtiles is already built; this exists so that is reproducible.
The pmtiles CLI cannot filter layers and tippecanoe is not installed here.

    python3 tools/strip_layers.py IN.pmtiles /tmp/o.mbtiles OUT.pmtiles landuse,pois 0 8

Layers are top-level length-delimited fields in the Tile message, so dropping
one is a matter of re-emitting the tile without that field — no geometry decode
and no re-encode, so nothing else is perturbed.

Writes MBTiles (plain sqlite), then `pmtiles convert` produces the archive.
"""
import gzip, json, math, os, sqlite3, subprocess, sys

SRC, OUT_MBT, OUT_PM = sys.argv[1], sys.argv[2], sys.argv[3]
DROP = set(sys.argv[4].split(","))
MINZ, MAXZ = int(sys.argv[5]), int(sys.argv[6])
W, S, E, N = -8.65, 49.8, 1.9, 61.0


def varint(buf, i):
    shift = result = 0
    while True:
        b = buf[i]
        i += 1
        result |= (b & 0x7F) << shift
        if not b & 0x80:
            return result, i
        shift += 7


def enc_varint(v):
    out = bytearray()
    while True:
        b = v & 0x7F
        v >>= 7
        out.append(b | (0x80 if v else 0))
        if not v:
            return bytes(out)


def layer_name(body):
    j = 0
    while j < len(body):
        k, j = varint(body, j)
        f, w = k >> 3, k & 7
        if w == 2:
            l, j = varint(body, j)
            if f == 1:
                return body[j : j + l].decode("utf8", "replace")
            j += l
        elif w == 0:
            _, j = varint(body, j)
        else:
            break
    return "?"


def strip(buf, drop):
    out = bytearray()
    i, n = 0, len(buf)
    while i < n:
        start = i
        key, i = varint(buf, i)
        field, wire = key >> 3, key & 7
        if wire == 2:
            ln, j = varint(buf, i)
            body = buf[j : j + ln]
            i = j + ln
            if field == 3 and layer_name(body) in drop:
                continue  # drop this layer
            out += buf[start:i]
        elif wire == 0:
            _, i = varint(buf, i)
            out += buf[start:i]
        else:
            out += buf[start:]
            break
    return bytes(out)


def tile_range(z):
    def xt(lng):
        return int((lng + 180.0) / 360.0 * (1 << z))

    def yt(lat):
        r = math.radians(lat)
        return int((1.0 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2.0 * (1 << z))

    return xt(W), xt(E), yt(N), yt(S)


meta = json.loads(subprocess.run(["pmtiles", "show", SRC, "--metadata"],
                                 capture_output=True, text=True).stdout)
if "vector_layers" in meta:
    meta["vector_layers"] = [v for v in meta["vector_layers"] if v.get("id") not in DROP]

for p in (OUT_MBT, OUT_PM):
    if os.path.exists(p):
        os.remove(p)

db = sqlite3.connect(OUT_MBT)
db.execute("CREATE TABLE metadata (name TEXT, value TEXT)")
db.execute("CREATE TABLE tiles (zoom_level INT, tile_column INT, tile_row INT, tile_data BLOB)")
db.execute("CREATE UNIQUE INDEX tile_index ON tiles (zoom_level, tile_column, tile_row)")

kept = dropped_bytes = 0
for z in range(MINZ, MAXZ + 1):
    x0, x1, y0, y1 = tile_range(z)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            p = subprocess.run(["pmtiles", "tile", SRC, str(z), str(x), str(y)],
                               capture_output=True)
            if p.returncode != 0 or not p.stdout:
                continue
            raw = p.stdout
            try:
                buf = gzip.decompress(raw)
            except Exception:
                buf = raw
            new = strip(buf, DROP)
            dropped_bytes += len(buf) - len(new)
            blob = gzip.compress(new, 9)
            db.execute(
                "INSERT OR REPLACE INTO tiles VALUES (?,?,?,?)",
                (z, x, (1 << z) - 1 - y, sqlite3.Binary(blob)),
            )
            kept += 1

rows = {
    "name": meta.get("name", "Basemap"),
    "format": "pbf",
    "minzoom": str(MINZ),
    "maxzoom": str(MAXZ),
    "bounds": f"{W},{S},{E},{N}",
    "type": "baselayer",
    "compression": "gzip",
    "json": json.dumps({"vector_layers": meta.get("vector_layers", [])}),
    "attribution": meta.get("attribution", ""),
}
for k, v in rows.items():
    db.execute("INSERT INTO metadata VALUES (?,?)", (k, v))
db.commit()
db.close()

subprocess.run(["pmtiles", "convert", OUT_MBT, OUT_PM], check=True,
               capture_output=True)
print(f"tiles: {kept}   dropped {dropped_bytes:,} uncompressed bytes of {sorted(DROP)}")
print(f"{OUT_PM}: {os.path.getsize(OUT_PM):,} bytes")

"""Per-layer byte breakdown of a .pmtiles archive.

MVT: Tile{ repeated Layer layers = 3 }, Layer{ string name = 1 }.
Both are length-delimited, so a minimal varint scanner gets each layer's
encoded size without decoding geometry.
"""
import gzip, math, subprocess, sys, collections

ARCHIVE = sys.argv[1]
MINZ, MAXZ = int(sys.argv[2]), int(sys.argv[3])
W, S, E, N = -8.65, 49.8, 1.9, 61.0


def tile_range(z):
    def xt(lng):
        return int((lng + 180.0) / 360.0 * (1 << z))

    def yt(lat):
        r = math.radians(lat)
        return int((1.0 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2.0 * (1 << z))

    return xt(W), xt(E), yt(N), yt(S)


def varint(buf, i):
    shift = result = 0
    while True:
        b = buf[i]
        i += 1
        result |= (b & 0x7F) << shift
        if not b & 0x80:
            return result, i
        shift += 7


def layer_sizes(buf):
    """-> {layer_name: encoded_bytes}"""
    out = {}
    i, n = 0, len(buf)
    while i < n:
        key, i = varint(buf, i)
        field, wire = key >> 3, key & 7
        if wire == 2:
            ln, i = varint(buf, i)
            body = buf[i : i + ln]
            i += ln
            if field == 3:  # a Layer
                j, name = 0, "?"
                while j < len(body):
                    k2, j = varint(body, j)
                    f2, w2 = k2 >> 3, k2 & 7
                    if w2 == 2:
                        l2, j = varint(body, j)
                        if f2 == 1:
                            name = body[j : j + l2].decode("utf8", "replace")
                            break
                        j += l2
                    elif w2 == 0:
                        _, j = varint(body, j)
                    else:
                        break
                out[name] = out.get(name, 0) + ln
        elif wire == 0:
            _, i = varint(buf, i)
        else:
            break
    return out


totals = collections.Counter()
per_zoom = collections.Counter()
tiles = 0
raw_total = 0

for z in range(MINZ, MAXZ + 1):
    x0, x1, y0, y1 = tile_range(z)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            p = subprocess.run(
                ["pmtiles", "tile", ARCHIVE, str(z), str(x), str(y)],
                capture_output=True,
            )
            if p.returncode != 0 or not p.stdout:
                continue
            raw = p.stdout
            raw_total += len(raw)
            tiles += 1
            try:
                buf = gzip.decompress(raw)
            except Exception:
                buf = raw
            ls = layer_sizes(buf)
            totals.update(ls)
            per_zoom[z] += len(raw)

grand = sum(totals.values())
print(f"tiles fetched: {tiles}   compressed bytes: {raw_total:,}   uncompressed: {grand:,}\n")
print(f"{'layer':<14}{'uncompressed':>14}  {'share':>7}")
print("-" * 38)
for name, b in totals.most_common():
    print(f"{name:<14}{b:>14,}  {100*b/grand:6.1f}%")
print("-" * 38)
print(f"{'TOTAL':<14}{grand:>14,}\n")
print(f"{'zoom':<6}{'compressed':>14}  {'share':>7}")
print("-" * 30)
for z in sorted(per_zoom):
    print(f"z{z:<5}{per_zoom[z]:>14,}  {100*per_zoom[z]/raw_total:6.1f}%")

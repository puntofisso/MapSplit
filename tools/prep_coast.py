"""One-off: Natural Earth 10m GBR+IRL -> SVG path data in integer world units.

You do NOT need to run this. Its output is already inlined in app.js as the
COAST constant; this file exists only so that result is reproducible.

World units = (normalised Web Mercator - origin) * SCALE, so path data is short
integers rather than long decimals. The app converts between world units and
normalised Mercator with two multiplies.

Usage:
    curl -sLO https://raw.githubusercontent.com/martynafford/\
natural-earth-geojson/master/10m/cultural/ne_10m_admin_0_countries.json
    mv ne_10m_admin_0_countries.json ne10m.json
    python3 prep_coast.py 10 4000     # tolerance, min-ring-area (world units)

Tolerance 10 world units is ~400 m, i.e. sub-pixel even on a 4K display, and
yields ~72 KB of path data. Then paste coast.json's contents into app.js.
"""
import json, math, sys

SCALE = 1_000_000
DISPLAY_BBOX = (-8.65, 49.8, 1.9, 61.0)  # matches the .pmtiles extract


def merc(lng, lat):
    x = lng / 360 + 0.5
    s = max(-0.9999, min(0.9999, math.sin(math.radians(lat))))
    y = 0.5 - (0.25 * math.log((1 + s) / (1 - s))) / math.pi
    return x, y


def dp(pts, tol):
    """Douglas-Peucker on projected points."""
    if len(pts) < 3:
        return pts
    ax, ay = pts[0]
    bx, by = pts[-1]
    dx, dy = bx - ax, by - ay
    den = math.hypot(dx, dy)
    imax, dmax = 0, -1.0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        if den == 0:
            d = math.hypot(px - ax, py - ay)
        else:
            d = abs(dx * (ay - py) - (ax - px) * dy) / den
        if d > dmax:
            imax, dmax = i, d
    if dmax > tol:
        return dp(pts[: imax + 1], tol)[:-1] + dp(pts[imax:], tol)
    return [pts[0], pts[-1]]


def rings(feature):
    g = feature["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    for poly in polys:
        for ring in poly:
            yield ring


def build(path, tol_units, min_area_units):
    data = json.load(open(path))
    out = {}
    for f in data["features"]:
        code = f["properties"].get("ADM0_A3")
        if code not in ("GBR", "IRL"):
            continue
        paths, kept, dropped = [], 0, 0
        for ring in rings(f):
            pts = []
            for lng, lat in ring:
                x, y = merc(lng, lat)
                pts.append(((x - OX) * SCALE, (y - OY) * SCALE))
            # shoelace area, to drop specks
            a = abs(
                sum(
                    pts[i][0] * pts[(i + 1) % len(pts)][1]
                    - pts[(i + 1) % len(pts)][0] * pts[i][1]
                    for i in range(len(pts))
                )
            ) / 2
            if a < min_area_units:
                dropped += 1
                continue
            simp = dp(pts, tol_units)
            if len(simp) < 4:
                dropped += 1
                continue
            kept += 1
            d = "M" + "L".join(f"{round(x)} {round(y)}" for x, y in simp) + "Z"
            paths.append(d)
        out[code] = {"paths": paths, "kept": kept, "dropped": dropped}
    return out


W, S, E, N = DISPLAY_BBOX
OX, OY = merc(W, N)
X1, Y1 = merc(E, S)
VW, VH = round((X1 - OX) * SCALE), round((Y1 - OY) * SCALE)

if __name__ == "__main__":
    tol = float(sys.argv[1]) if len(sys.argv) > 1 else 40.0
    area = float(sys.argv[2]) if len(sys.argv) > 2 else 4000.0
    res = build("ne10m.json", tol, area)
    total = sum(len(p) for v in res.values() for p in v["paths"])
    print(f"tol={tol:>6} minarea={area:>8}  bytes={total:>7}  viewBox=0 0 {VW} {VH}")
    for k, v in res.items():
        print(f"   {k}: {v['kept']} rings kept, {v['dropped']} dropped")
    json.dump(
        {"viewBox": [0, 0, VW, VH], "origin": [OX, OY], "scale": SCALE,
         "GBR": res["GBR"]["paths"], "IRL": res["IRL"]["paths"]},
        open("coast.json", "w"),
    )

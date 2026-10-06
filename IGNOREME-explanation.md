How the coastline was made

  It's a small one-off Python script (tools/prep_coast.py) that runs a five-step pipeline. You never need to run it — its
  output is already frozen into index.html as the COAST constant — but here's what it does:

  1. Start with real coastline data. Download Natural Earth's 1:10m country polygons (a public-domain GeoJSON file). Keep only
  two features: GBR (United Kingdom) and IRL (Ireland). Everything else is thrown away.
  2. Project each point. Every polygon is a list of longitude/latitude corners. Each (lng, lat) is run through the merc()
  function — the standard Web Mercator formula — to get an (x, y) on a flat 0–1 square. This is the exact same projection the
  app uses live for your data points, which is the whole trick: coastline and data land in the same coordinate space, so they
  line up.
  3. Convert to "world units." The 0–1 Mercator numbers are shifted by an origin and multiplied by 1,000,000, so instead of
  0.4783921… you get a short integer like 14712. That keeps the SVG path text compact (M 14712 8231 L …) rather than full of
  long decimals.
  4. Simplify and de-speck. Two cleanups shrink the file from megabytes to ~72 KB:
    - Douglas–Peucker (dp()) drops points that don't change the shape by more than a tolerance (~400 m — sub-pixel even on a
  4K screen). A gentle curve of 500 points becomes maybe 30.
    - Tiny rings dropped (min_area): the shoelace-area formula measures each ring; anything smaller than a threshold (a rock,
  a tiny islet) is deleted.
  5. Emit SVG paths. Each surviving ring becomes one "M x y L x y … Z" string, written to coast.json, which then gets pasted
  inline into index.html.

  So the coastline is just simplified real polygons, projected the same way as your data, stored as integers.

  Projection caveats — the part that matters for your files

  The coastline itself is fine and settled. Natural Earth ships in WGS84 lon/lat degrees, the script assumes that, and it's
  baked in. Nothing to worry about there.

  The caveat is about the data files you load (CSV, GeoJSON, grids). The app projects them at runtime with that identical
  merc() function, which assumes:

  - Longitude/latitude in degrees (WGS84 / EPSG:4326). Longitude first-ish (the app finds columns by name), values roughly in
  −8…+2 for lng and 49…61 for lat over the UK.

  Two specific traps:

  1. British National Grid (easting/northing, EPSG:27700) is the big one. A lot of UK open data (ONS, OS) ships as
  eastings/northings — numbers like 530000, 180000. Those will parse without any error and silently land your points in the 
  Atlantic Ocean, wildly off the coastline. There's no warning because they're valid numbers. Fix: reproject to EPSG:4326
  first — in QGIS, Export → Save As → CRS: EPSG:4326.
  2. Decimal commas. The parser strips thousands separators, so 1,234 reads as 1234 — but that means a European-style decimal
  1,5 becomes 15. Convert to dot decimals first (such files are usually semicolon-delimited).

  There's a subtler point worth knowing but not something you need to fix: Mercator distorts area toward the poles, so
  Scotland looks a bit larger than an equal-area map would show. This is purely cosmetic — it does not affect the split 
  statistics, because point classification (which side of the line each point is on) happens in the same Mercator space
  consistently. Your population counts are correct regardless.

  Bottom line: you don't touch the coastline. Just make sure every file you load is lon/lat in degrees (WGS84) — if it's
  British National Grid, reproject it first, or your points will be in the sea.

  Most of this is already captured in the README's "Gotchas" section, if you want it in the repo docs.

# MapSplit

Drag a straight line across the UK at any angle and see, live, what falls on
each side — a population split, a density split, whatever the loaded dataset
measures. Inspired by Alasdair Rae's population-weighted north/south map:
[**"Where is the population centre of the North?"**](https://www.linkedin.com/posts/alasdair-rae-17640a124_where-is-the-population-centre-of-the-north-share-7485216364216012800-y140/).

`index.html` is one self-contained file — double-click it in Finder, no server
and no network needed. (The bundled datasets in the picker are the one
exception; see [Loading data](#loading-data).)

---

## Loading data

Two ways to get a dataset in:

1. **Drag a file onto the map**, or click **"Load a file…"**. This is the
   primary path and works offline from a double-clicked `index.html`, because
   the browser reads the file locally (`FileReader`) rather than fetching it.
   For a CSV or GeoJSON, a **column-mapping dialog** opens first (see below).
2. **The dataset picker**, populated from `CONFIG.datasets` near the top of
   `index.html`. These are *fetched*, which a browser blocks under `file://`,
   so the picker only works when the folder is served over HTTP
   (`http://localhost/MapSplit/`). The app tells you this if a fetch fails.

### Choosing the columns

When you drop or pick a CSV or GeoJSON, a dialog asks which column is
**longitude**, **latitude**, the **value** to measure, and an optional
**group** to break the total down by. (GeoJSON doesn't ask for longitude and
latitude — they come from the geometry. Grids skip the dialog entirely: a raster
has no columns.) Each dropdown is pre-selected to the app's best guess, so when
the guess is right it's one click; when it can't guess — e.g. a column called
`Population2024`, which doesn't exactly match the alias `population` — it starts
on "— none —" for you to set. The **value** drives the North/South statistic;
the **group** makes the "What's being counted" breakdown appear.

Once loaded, **hover a point** to see its value (and its group, if you chose
one).

Whatever the app guesses — which column is the weight, which is the group, how
many rows it skipped — is also reported in a notice line in the panel. Read it: a
silently-guessed weight column is how a plausible wrong answer gets believed.

### Sample files

`data/samples/` holds one small, human-readable file per supported format.
They double as worked examples of each format below, and every one is listed in
the picker.

| File | Format |
| --- | --- |
| `uk-cities.csv` | CSV |
| `uk-cities.geojson` | GeoJSON points |
| `uk-blocks.geojson` | GeoJSON polygons |
| `uk-density-grid.json` | grid as JSON |
| `uk-density.asc` | ESRI ASCII grid |

---

## Supported formats

All coordinates must be **longitude/latitude in degrees (WGS84)**. This is the
single most common thing to get wrong — see [Gotchas](#gotchas).

The format is sniffed from the file automatically. To force it, add a `type`
field to the `CONFIG.datasets` entry, or the format is inferred from the
extension and contents on drop.

### CSV / TSV — `type: "csv"`

A header row plus one row per point. The delimiter (`,` `;` tab `|`) is
auto-detected. Quoted fields with embedded commas are handled
(`"Newcastle, Staffs"`).

Columns are found by name, case- and punctuation-insensitively. First match
wins:

| Role | Accepted header names | Required? |
| --- | --- | --- |
| Longitude | `lng`, `lon`, `long`, `longitude`, `x` | **yes** |
| Latitude | `lat`, `latitude`, `y` | **yes** |
| Weight | `weight`, `value`, `population`, `people`, `pop`, `count`, `total`, `amount`, `n` | no — defaults to 1 per row |
| Group | `group`, `category`, `region`, `name`, `area`, `label`, `class`, `type` | no |

```csv
name,region,longitude,latitude,population
London,England,-0.1278,51.5074,8899000
Edinburgh,Scotland,-3.1883,55.9533,526000
```

The **weight** is the number each side is measured in (population, households,
£, tonnes…). The **group** is an optional category that powers the "What's
being counted" breakdown — e.g. region, party, tenure.

**Best fit:** ONS / NOMIS **Output Area or LSOA population-weighted centroids**
with a population column. That is the closest real equivalent to what the app
was built to show.

### GeoJSON points — `type: "geojson-points"`

A `FeatureCollection` of `Point` or `MultiPoint` features. The weight and group
are read from feature `properties`, using the same alias lists as CSV (only
*numeric* properties are eligible as the weight, so a `name` string is never
picked by mistake).

A `MultiPoint`'s weight is split evenly across its positions, so the
collection's total is preserved.

### GeoJSON polygons — `type: "geojson-polygons"`

A `FeatureCollection` of `Polygon` or `MultiPolygon` features (e.g. LSOA / MSOA
/ local-authority boundaries) with a numeric property as the weight.

> **Each polygon is reduced to a single point — its area-weighted centroid.**
> A unit the dividing line crosses therefore counts *wholly* on one side, not
> split between them. For thousands of small units (35k LSOAs) that error is
> noise. For a few big ones (48 counties) it is visibly wrong. The bundled
> `uk-blocks.geojson` shows this on purpose: as polygons a mid-UK split reads
> 4.0% / 96.0%, but the *same data as points* reads 19.3% / 80.7%.

If you have a choice, **prefer centroids (CSV/points) over boundaries** for
now. Area-weighted splitting — apportioning each straddled polygon by how much
of its area falls each side — is the planned improvement.

### Gridded data — `type: "grid-json"` or `"ascii-grid"`

A regular grid where each cell's centre becomes a weighted point. An
equal-area grid is arguably the most honest input the app can take, since every
weight then covers the same amount of ground. Zero and no-data cells are
dropped from drawing.

**Grid as JSON.** Values are **row-major from the north-west corner**:

```json
{ "cols": 42, "rows": 45, "bbox": [-8.5, 49.75, 2.0, 61.0],
  "values": [ 0, 0, 1234, ... ], "nodata": -9999 }
```

Instead of `bbox` you may give `west`, `north` and `cellLng`/`cellLat` (or a
single `cellSize`).

**ESRI ASCII grid** (`.asc`) — the six-line header then whitespace-separated
values, as exported by QGIS and most raster tools:

```
ncols 42
nrows 45
xllcorner -8.5
yllcorner 49.75
cellsize 0.25
NODATA_value -9999
0 0 1234 ...
```

**Best fit:** any published population-density raster — but resample it to a
manageable resolution first (a national 1 km grid is ~250k cells; see
[Gotchas](#gotchas)).

---

## Overriding the guesses

If the auto-detected column or property is wrong, set it explicitly on the
`CONFIG.datasets` entry:

```js
{ label: 'Households by LSOA', unit: 'households',
  url: 'data/lsoa.csv', type: 'csv',
  weightColumn: 'hh_count', groupColumn: 'region' }
```

- CSV: `lngColumn`, `latColumn`, `weightColumn`, `groupColumn`, `delimiter`
- GeoJSON: `weightProperty`, `groupProperty`
- All: `label`, `unit`

---

## Gotchas

- **Projection.** Coordinates must be lon/lat in degrees. A British National
  Grid (easting/northing) file will parse without complaint and land in the
  Atlantic — reproject to WGS84 first (in QGIS: *Export → Save As → EPSG:4326*).
- **Decimal commas.** Thousands separators are stripped, so `1,234` reads as
  1234 — but that means a European decimal comma `1,5` reads as 15. Such files
  are usually semicolon-delimited; convert to a dot decimal first.
- **Polygons collapse to centroids** — see the GeoJSON polygons section.
- **Big point sets.** Above 50,000 points the map draws an evenly-strided
  subsample so the drag stays smooth. **The statistics always use every
  point** — only the drawing is thinned, and the panel says so.

---

## Developing

- **Run:** double-click `index.html`, or serve the folder and open
  `http://localhost/MapSplit/`.
- **Tests:** `http://localhost/MapSplit/tests.html` — 65 assertions rendered
  pass/fail in the page (needs HTTP; it `fetch`es the pure block out of
  `index.html`).
- **Basemap:** the coastline is inlined, so the map works with no tiles. For
  the full Protomaps basemap, create `data/uk.pmtiles` — see `CLAUDE.md`.

Architecture, the data-source contract, and the ingest internals are documented
in **`CLAUDE.md`**.

---

## Credits

- Inspiration: [Alasdair Rae — *Where is the population centre of the
  North?*](https://www.linkedin.com/posts/alasdair-rae-17640a124_where-is-the-population-centre-of-the-north-share-7485216364216012800-y140/)
- Coastline: Natural Earth 1:10m (public domain).
- Bundled sample data is synthetic.

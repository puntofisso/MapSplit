# sources/ — where every statistic in the game comes from

One folder per **source** (a publisher's dataset). Everything about it lives
there:

- `source.json` — what it is, who publishes it, the vintage, **the licence and
  the attribution statement**, the URLs to fetch, how and when to refresh it,
  known gaps, and the statistics it yields (each with the wording that fills
  "Find the line that puts half of all ___ north of it").
- `build.py` — the preprocessing: raw download → points with values.

`boundaries/` yields no statistics; it supplies the coordinates and names that
the others attach their numbers to, and its licence is carried into theirs.

## Running it

```bash
python3 tools/pipeline/run.py                  # rebuild everything
python3 tools/pipeline/run.py hmrc             # one source
python3 tools/pipeline/run.py --refresh hmrc   # re-download its raw files first
```

Raw downloads go to `data/raw/<source>/` (git-ignored, never deployed). Output:

- `Play/data/stats/<statistic>.csv` — always `lon,lat,value,name`
- `Play/data/stats.json` — the catalogue: label, question, unit, licences,
  attribution, provenance links, caveats, nation shares
- `Play/data/stats/README.md` — the licence record for the derived files

## Measuring: the review sheet

```bash
node tools/pipeline/measure.mjs
```

Runs the game's own pure code (extracted from `Play/app-game.js`, like the
test pages) over every statistic in `Play/data/stats.json` on twelve axes at 50%,
and writes:

- `review/questions.csv` — one row per statistic × axis: the question as the
  game words it, where the line falls, the place the takeaway would name, its
  distance from the census-population line ("surprise"), and every other
  statistic within 18 km on that axis (those can never share a day).
- `review/statistics.csv` — one row per statistic: N/S and W/E lines, the most
  surprising axis, the licence of its file, and its caveats.

## What the build refuses to ship

- a blank, negative or non-numeric value
- a point outside the UK frame
- one point holding more than 10% of the total (`maxPointShare` overrides it, per statistic)
- a total outside `expectTotal`, where one is given
- **an area that drops out of a join without an explanation in `knownGaps`** —
  this is what would have caught Sheffield and Barnsley going missing
- a source without a licence or attribution

A source can ask for its points to be aggregated to local authorities with
`"aggregate": "lad"` (census and OSM do; a statistic opts out with
`"aggregate": null` and an `aggregateNote`). The 10% single-point check runs
AFTER aggregation, which is what catches an authority that would dominate.

A statistic that is zero in a whole nation is a warning, not a failure (Labour
does not stand in Northern Ireland); declaring it under `absentFrom` records
why and puts the reason in the catalogue's caveats.

## Adding a source

1. Create `sources/<id>/source.json` (copy an existing one) and `build.py`.
2. `build(src)` returns `({stat_id: rows}, {stat_id: [dropped codes]})`, where
   each row comes from `common.row(lon, lat, value, name, code)`.
3. Join on LA codes through `common.lad_code()`; name located points with
   `common.lad_at()`.
4. Run it, read the warnings, and check totals against the publisher's.

## Yearly refresh (November)

Data is frozen for a calendar year — changing it mid-year would move the
answers to days not yet played — so every refresh lands with next year's
schedule.

1. For each source, read its `refresh` field and check for a new vintage.
2. Update URL / file names / vintage in `source.json`; `run.py --refresh <id>`.
3. Fix whatever the checks reject (new codes → `LAD_CODE_CHANGES`; newly
   suppressed areas → `knownGaps`, after confirming they really are suppressed).
4. Compare against last year's lines; re-measure; regenerate next year's
   schedule; run `Play/tests-game.html`; deploy before 31 December.

Statistic ids never change across vintages, so a schedule that names
`hmrc-tax-amount` simply gets that year's file.

## When Overpass will not cooperate (OSM)

The public Overpass servers throttle and time out under load; `fetch_overpass`
retries across mirrors (mail.ru was the fast one in October 2026), and an
empty answer is treated as a failure, never as an empty statistic. If a
refresh still cannot get through, the fallback is Geofabrik's full
`great-britain-latest.osm.pbf` plus the Ireland extract, filtered by tag with
`osmium tags-filter` — **not** Geofabrik's free shapefiles, which drop the
`brand`, `craft`, `cuisine` and `emergency` tags these statistics are defined by.
Statistics postponed for this reason sit under `deferred` in
`sources/osm/source.json` (lifeboat stations, as of October 2026).


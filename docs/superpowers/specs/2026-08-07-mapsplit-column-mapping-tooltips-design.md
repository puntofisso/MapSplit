# MapSplit — column-mapping dialog & per-point tooltips

Date: 2026-08-07
Status: approved design, ready for implementation plan

## Problem

Loading a file (drag-drop or "Load a file…") currently parses it immediately
with auto-detected columns and swaps the source in with no user input. For an
arbitrary file the user has no way to say *which* column is longitude, latitude,
the value to measure, or a category to group by — they are stuck with whatever
`findColumn`/`pickProperty` guessed. There is also no way to inspect an
individual point: the app shows only the two aggregate cards.

`data-scripts/LA.csv` (`Index, Code, Name_x, Longitude, Latitude, Name_y,
Population2024`) is the motivating example.

## Goals

1. On file load, prompt the user to map columns, with the auto-detected guesses
   pre-filled, so the common case is a single confirming click.
2. The chosen **value** column drives the North/South statistic (as the weight
   does today).
3. A chosen **group** column makes the existing "What's being counted" breakdown
   appear.
4. Each point shows a **tooltip** on hover with its value (and its group/name, if
   a group column was chosen).

## Non-goals

- The catalogue picker (`CONFIG.datasets`, the fetch path) is unchanged — those
  entries are curated and may already carry explicit column config.
- Grid files (`grid-json`, `ascii-grid`) get no dialog: a raster has no columns
  to choose; longitude/latitude/value are structural.
- No editing of a mapping after load (reload the file to remap). No persistence
  of mappings across sessions.
- Grouping quality is the user's choice: picking a unique-per-row column (e.g. a
  name) yields a 1-row-per-group breakdown. We do not police this.

## Scope of the prompt

| Shape | Dialog? | Fields asked |
| --- | --- | --- |
| CSV / TSV | yes | Longitude\*, Latitude\*, Value, Group |
| GeoJSON points | yes | Value, Group (lng/lat from geometry) |
| GeoJSON polygons | yes | Value, Group (lng/lat from centroid) |
| grid-json / ascii-grid | no | — |

\* required. Value and Group may be "— none —".

## Design

### A. Field-describe helpers (pure, tested)

Two new functions inside the `/* BEGIN PURE */ … /* END PURE */` block, so
`tests.html` exercises them and they cannot drift:

- `describeCsvFields(text, opts)` → `{ fields, guesses }` where `fields` is the
  raw header names (delimiter auto-detected exactly as `parseCsvText` does, BOM
  stripped) and `guesses` is `{ lng, lat, weight, group }`, each the raw header
  name the current alias logic would pick, or `null`. Parses only the header row
  plus enough to detect the delimiter — it does not read every data row.
- `describeGeojsonFields(obj, opts)` → `{ fields, guesses }` where `fields` is
  the property keys sampled from the first 50 features (reusing the same sampling
  as `pickProperty`) and `guesses` is `{ weight, group }`. Numeric-only
  eligibility for `weight` is preserved so a string `name` is never guessed as
  the value.

These reuse the existing `normaliseHeader`, `findColumn`, `COLUMN_ALIASES`,
`detectDelimiter`, `parseDelimited`, and `pickProperty` — no new alias logic.

The existing parsers already accept `lngColumn` / `latColumn` / `weightColumn` /
`groupColumn` (CSV) and `weightProperty` / `groupProperty` (GeoJSON) overrides,
so **no parser changes are needed** beyond calling them with the chosen values.

### B. The mapping modal (impure, interaction section)

An in-page overlay built with the DOM (no native `prompt`/`alert`, so it works
under `file://`). Structure:

- A backdrop plus a centered card titled e.g. "Map the columns in `<filename>`".
- One labelled `<select>` per field in scope for the sniffed type. Each `<select>`
  is populated from `fields`; required fields (CSV lng/lat) have no "— none —"
  option, optional fields (value, group) do. The option matching the guess is
  pre-selected.
- **Confirm** and **Cancel** buttons. Confirm is disabled while a required field
  is unset (cannot happen when a guess exists, but guards a file with no
  detectable coordinate column).

Flow, replacing the immediate parse in `loadFile`:

1. Read text (as today).
2. `detectSourceType(name, text)`.
3. If grid → parse + `setSource` as today (no dialog).
4. Else → call the matching describe helper, open the modal pre-filled.
   - **Confirm** → build an `opts` object from the selections
     (`{ lngColumn, latColumn, weightColumn, groupColumn }` for CSV;
     `{ weightProperty, groupProperty }` for GeoJSON, plus `type` from the sniff),
     call `createSourceFromText(name, text, opts)`, then `setSource`.
   - **Cancel** → do nothing; the current source and map stay intact.

Errors from the parser continue to surface through `showNotice` and leave the
previous source intact, exactly as now.

### C. Value drives the stat

No new mechanism. The chosen value column is passed as the weight override; the
cards, percentages and unit label already follow the weight column
(`res.unit = opts.unit || raw[iW]`).

### D. Group → "What's being counted"

No new mechanism. A chosen group column produces `groups` + `groupNames`;
`setSource` already sets `hasGroups` and toggles `breakdownEl.hidden`. The dialog
only has to let the user pick the column.

### E. Per-point tooltip

Rendering is unchanged (two bulk clip layers, no per-circle handlers). Tooltip is
a single delegated hit-test:

- `drawPoints()` records the indices it actually draws (`drawnIdx`, every
  `stride`-th `i`) so the tooltip matches only visible dots — never blank space
  in a strided subsample.
- A pure `nearestPoint(mercPts, drawnIdx, P, radiusWorld)` → index or `-1`
  returns the nearest drawn point within the radius (squared-distance scan over
  the drawn subset; ≤50k comparisons, sub-millisecond). Pure and tested.
- A `pointermove` handler on the SVG (separate from, and yielding to, the drag
  handler): when not dragging and not over a handle, convert the event to world
  units (`eventToWorld`), call `nearestPoint` with a small screen-pixel radius
  (`× unitsPerPx`), and if hit, position a floating `#point-tip` div near the
  cursor showing the group/name (when a group column was chosen) and the value +
  unit. Hidden on miss, on drag start, and on `pointerleave`. Throttled to one
  update per animation frame.
- Works for any weighted source, synthetic included — it reads `data.weights`,
  `data.groups`, `data.groupNames`, and `source.unit`, which every source has.

## Files touched

- `index.html`
  - PURE block: `describeCsvFields`, `describeGeojsonFields`, `nearestPoint`.
  - `drawPoints`: record and return/expose `drawnIdx`.
  - interaction section: the modal (markup injected or static + toggled), the
    tooltip element and its `pointermove` hit-test, and the rewrite of `loadFile`
    to route through the dialog.
  - CSS: modal overlay/card, `#point-tip`.
  - HTML: modal container, `#point-tip` container.
- `tests.html`: assertions for `describeCsvFields` (header list, guesses,
  delimiter, missing-column → null lng/lat guess), `describeGeojsonFields`
  (property sampling, numeric-only weight guess), and `nearestPoint` (hit within
  radius, miss outside, nearest-of-several, empty `drawnIdx`).
- `CLAUDE.md`: note the load dialog in the "Loading real data" section and the
  new test count.
- `README.md`: mention the column-mapping prompt and the tooltip in the loading
  section.

## Testing

- New pure helpers get direct assertions (above).
- The parse/load split is preserved: everything new that is pure lives inside the
  markers; the modal, tooltip DOM and wiring live in the interaction section.
- Manual: load `data-scripts/LA.csv`, confirm the pre-filled guesses
  (`Longitude`/`Latitude`/`Population2024`), see the stat driven by population,
  pick `Name_x` as group to reveal the breakdown, and hover a point to read its
  value.

## Open risks / notes

- Tooltip over a strided subsample only reports drawn points; this is deliberate
  and consistent with "drawing is thinned, stats use every point".
- Grouping by a high-cardinality column produces a long, thin breakdown — a UX
  wart, not a correctness bug; left to the user.

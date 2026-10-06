# MapSplit — "Balance" buttons (50/50 split)

Date: 2026-08-08

## Goal

Add two buttons that move the dividing line to the position where the two
sides carry **equal weight** (50/50), one for a horizontal line and one for a
vertical line. Offer an animated "sweep" that visibly finds the balance point,
plus an instant jump, so both can be compared.

## Behaviour

- **`Balance N–S`** — a horizontal line (constant latitude) placed so the North
  and South weight totals are as close to equal as the data allows.
- **`Balance W–E`** — a vertical line (constant longitude) placed so the West
  and East weight totals are equal.
- **`☑ Animate`** checkbox (default on) toggles between the animated sweep and
  an instant jump, so both motions are testable from one pair of buttons.

The 50/50 target is computed from the **true weights**, not the rounded card
percentages — the point of the feature is exactness the eye can't get by
dragging.

## The maths (pure, tested)

Point classification against a horizontal line depends only on whether a point's
latitude is above or below the line's; latitude → Mercator-y is monotonic, so a
horizontal line's exact-balance latitude is the **weighted median of the points'
latitudes**. A vertical line is the same on longitude.

New pure function inside the `/* BEGIN PURE */ … /* END PURE */` markers:

```
balancePosition(values, weights) -> number
```

- Sort the (value, weight) pairs by value ascending.
- Accumulate weight from the low end until the cumulative crosses half the
  total.
- Return the **midpoint between the two straddling values** (the value at the
  crossover and the next one up). Placing the line strictly between two points
  makes the partition unambiguous and as close to 50/50 as discrete weighted
  data allows.
- Degenerate inputs: empty → return the single value or `NaN`-safe fallback;
  all weight at one value → return that value; crossover at the last point →
  nudge just past the max so every point lands on one side.

Tests in `tests.html` (which extracts this block):
1. Symmetric values with equal weights → boundary at the centre.
2. A hand-checked asymmetric case.
3. The full pipeline: feeding the balanced endpoints through `computeSplit` +
   `computeStats` reconciles both sides to ~50/50 (within the largest single
   point's weight), for a synthetic source.

## Building the line (impure)

Reuse the existing `snap()` pattern:

- Fix the balanced coordinate (median latitude for N–S, median longitude for
  W–E).
- Take the **free** axis (longitude for N–S, latitude for W–E) from the viewport
  centre, as `snap()` already does.
- Keep the `snapEndpoints`-style segment length.

So `Balance N–S` produces two endpoints at equal latitude = median; `Balance
W–E` at equal longitude = median.

## Motion (impure, interaction section)

- **Animate on:** sweep the fixed coordinate from the edge to the median over
  ~0.6 s with an ease-out curve — top → down for N–S, left → right for W–E —
  calling `scheduleRecompute()` each frame so the cards' percentages visibly
  converge and settle at ~50/50.
- **Animate off:** set the endpoints to the target and recompute once.
- **`prefers-reduced-motion: reduce`** forces the instant path regardless of the
  checkbox.
- A running sweep is cancelled if another balance/snap/drag begins, so motions
  never fight.

## Pure/impure split

`balancePosition` is pure, inside the markers, and tested. The rAF sweep,
viewport-centre lookup, edge-start choice, and button/checkbox wiring live in
the interaction section — the same discipline the rest of the app follows.

## Out of scope

- No change to how points are classified or how existing snap buttons work.
- No area-weighted polygon splitting (centroids still, as today).

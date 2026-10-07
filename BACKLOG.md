# MapSplit backlog

Things deliberately deferred, with enough context to pick them up cold. Newest
first. Delete an entry when it ships.

---

## Multi-region play

`Play/data/coast/{uk,eu,us,world}.js` exist and render. **The picker, per-region
scores and map-only regions all shipped on 2026-08-27** — see CLAUDE.md,
"Regions". What is left:

### 0. Every region needs its OWN dead-angle measurement

Diagonals shipped for the UK on 2026-08-30 and the finding does not transfer:
45–60° is unusable there because it lies along the London–Glasgow population
spine, while 135° is the best axis in the table. Another country's spine points
somewhere else. `tools/puzzle_builder.html` measures this from the data, so the
work per region is running it, not reasoning about it — but nobody should copy
the UK's angle list across.

### 1. Datasets for the new regions — THE BLOCKER

`data/samples/` holds **UK data only** (`LA.csv`, `LA-grouped.csv`, `LSOA.csv`,
`HMRC.csv`). A coastline is a backdrop; the game splits a *statistic*, and
there is no EU, US or world statistic in the repo. Until there is, the EU / US /
World regions can be drawn but not played.

Each region needs at least three statistics whose answer lines sit further apart
than `bullseyeKm` at the chosen target — that invariant is what makes the
three-round format work, and `Play/tests-game.html` asserts it for the shipped
puzzle table. Expect to re-measure the target per region: 40% is right for the
UK because population, tax and self-employment diverge there; nothing says it is
right for the US.

Plausible sources, none yet evaluated: Eurostat NUTS-2/3 population (`demo_r_pjangrp3`),
US Census county population + IRS SOI county data, and for the world either
GHSL/GPW gridded population or a country-level table.

### 2. Copy below the map is still UK-only

`#below` ("How to play", "Why distance", Sources) describes the UK puzzle
whatever region is selected. On a map-only region the task box says plainly
that there is no puzzle, so nothing is *wrong*, but the prose underneath still
promises three rounds. Worth a per-region pass once the datasets land.

### 3. Regions in `MapSplit/index.php` (the tool) — EXPLICITLY NOT NOW

The repo owner asked for the coast files to be portable *so that* the main tool
can offer regions later, and asked that it not be done yet. The files are shaped
for it: each is a classic `<script src>` assigning into `window.MapSplitCoast`,
carrying its own origin, viewBox, bboxes and default line, so a consumer needs
no out-of-band knowledge. `index.html` is never to be edited (standing
instruction); `index.php` is the one to change.

---

## REVISIT: should revealed answers stay on the map while you play?

Raised and deferred 2026-08-27, at the repo owner's request.

The "three statistics must resolve to lines more than `bullseyeKm` apart"
invariant is **not a fact about the game**. It is a consequence of one display
choice: `renderAnswers()` draws every previously revealed answer during later
rounds — dashed, 40% opacity, labelled with the statistic's name.

An earlier version of CLAUDE.md justified the invariant as "nail round 1, don't
move, collect free bullseyes". **That was wrong**, and the owner rejected it
correctly: the line resets to the centre of `padBbox` at the start of every
round (verified). The real mechanism is simpler — the player can *see* round 1's
answer line and drag onto it. The bullseye is 10 km ≈ **4 px**, so tracing a
drawn line is a free 1,000 points.

**What is actually at stake.** With the answers hidden until the day's result,
the exploit degrades to inference — the takeaway still says round 1's line was
at 52.40°N, so "tax probably sits near population" remains a guess a thoughtful
player can make, which is the game working as designed. The constraint would
relax a long way, though probably not vanish; the threshold would need
re-measuring rather than assuming.

Why it matters beyond tidiness: **the invariant is what caps the puzzle list.**
Of 440 candidate (axis × target × trio) combinations on the current UK data only
124 pass, giving **22 distinct puzzles**. Hiding answers during play would move
that toward 440 and 40. Neither is a year, so the larger unlock is still more
statistics — but the two compound.

Against changing it: the persistent lines are one of the better parts of the
reveal, and the takeaway leans on them ("that is 70 km south of the Population
line"). The owner's own note is that stacked lines are "not ideal" as a display
regardless of scoring.

No decision taken. Revisit alongside the dataset work.

---

## ~~Mixing axes WITHIN a day's three rounds~~ — SHIPPED 2026-08-27

Built. The notes below are kept because they record why the shape is what it is.

Today the axis is a property of the **day**: one row of
`GAME.puzzles` carries one `axis` and one `target` for all three rounds. The
ask is for round 1 to be North/South and round 2 West/East, within the same
puzzle.

### Shape

Normalise both authoring shapes into `puzzle.rounds[]` inside `puzzleForDate`,
so nothing downstream has to know which was written:

```js
// uniform — what the table has today, still valid
{ axis: 'ns', target: 40, stats: ['A', 'B', 'C'] }
// mixed
{ rounds: [ { stat: 'A', axis: 'ns', target: 40 },
            { stat: 'B', axis: 'we', target: 55 },
            { stat: 'C', axis: 'ns', target: 45 } ] }
```

### Per-round axis REQUIRES per-round target

Not optional. Measured minimum pairwise gaps (see CLAUDE.md): 40% gives 43 km
on N/S and **6.9 km on W/E — inside the 10 km bullseye**. A day that switched
axis while keeping one target would ship a free round.

### It RELAXES the spread invariant, which is the real prize

The invariant exists because a player who nails round 1 and does not move can
collect round 2 free. Across a change of axis that exploit does not exist: the
line resets to the centre *and* reorients, so the previous answer carries no
information. **Only rounds sharing an axis need to be further apart than
`bullseyeKm`.** That removes the current tension where one target has to suit
both axes, and it opens up targets that are unusable today.

### What it touches

- `round.spec` / `round.sides` / `round.target` are day-level and read in ~10
  places (`renderHud`, `commitGuess`, `onRoundData`, `showToast`, `showResult`,
  `shareText`). All become `round.rounds[roundIndex]`.
- **`crossKm` / `crossSide` become wrong.** They compare this round's answer
  with the previous round's — "that is 87 km south of the Population line" —
  which is meaningless between a horizontal line and a vertical one. Compare
  against the most recent previous result *on the same axis*, or omit it.
- `shareText`'s first line names the day's single axis. With mixed axes that
  moves to a per-row marker (↕ / ↔) or comes off entirely.
- The `tests-game.html` spread test iterates rows × modes; it becomes rows ×
  modes × axis-groups-within-a-row.

**No storage migration needed** — `saveRound` writes a day-level `target` but
`bootGame` only ever reads `saved.results`, and every result is already
per-round.

---

## Free-angle puzzles with a distance payoff

Deferred 2026-08-26. **Not the same thing as the diagonals that shipped on
2026-08-30** — those fix the angle per round and let Pro author any bearing,
which keeps the one degree of freedom the distance score depends on. This entry
is about letting the PLAYER choose the angle, which is still open: a free angle
puts infinitely many valid lines at every target, so "how far off were you" has
no obvious definition and the whole scoring model would need redoing.

---

## The 30-day puzzles CSV

Unresolved: **dates-authoritative** (a `date` column per row; the game refuses
unauthored days) vs **rotation** (rows consumed in order from `GAME.epoch`,
wrapping with `%` — what the code does today). Also undecided: what happens when
the CSV fails to load. Recommendation is to fail loudly rather than silently
serve the sample row, since scoring a player against different numbers from
everyone else is worse than telling them the data did not load.

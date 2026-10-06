// Measure every statistic in data/stats.json on every axis the game can play,
// using the GAME'S OWN CODE, and write the review sheet.
//
//   node tools/pipeline/measure.mjs            → review/questions.csv
//                                                 review/statistics.csv
//
// Like the test pages, this extracts the /* BEGIN PURE */ … /* END PURE */
// block from Play/app-game.js rather than re-implementing the geometry, so the
// numbers here are the numbers a player is graded against.
//
// A QUESTION is one statistic on one axis at one target. For each it reports
// where the line falls, the place the takeaway would name, how far it sits
// from the population's line on the same axis ("surprise"), and which other
// statistics' lines are within the minimum gap — the ones it can never share
// a day with.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const js = fs.readFileSync(path.join(ROOT, 'Play/app-game.js'), 'utf8');
const pure = js.slice(js.indexOf('/* BEGIN PURE */'), js.indexOf('/* END PURE */'));
const G = new Function(pure + `; return { CONFIG, GAME, parseCsvText, axisSpec, lngLatToMerc,
  offsetOfPoint, targetOffset, offsetGapKm, weightedCentroidMerc, placeNearLine,
  lineCoordLabel, snapAxisToCardinal };`)();

const BASELINE = 'census-population';   // the line a player with no idea starts from
const MIN_GAP_KM = 18;                    // the authoring gap CLAUDE.md settled on
const AXES = ['ns', 'we', '15', '30', '45', '60', '75', '105', '120', '135', '150', '165'];
const TARGET = 50;

const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/stats.json'), 'utf8'));
const ids = Object.keys(cat).sort();

// Load and project every statistic once.
const data = {};
for (const id of ids) {
  const text = fs.readFileSync(path.join(ROOT, 'data', cat[id].file), 'utf8');
  const p = G.parseCsvText(text, {});
  const merc = p.coords.map(c => G.lngLatToMerc(c));
  data[id] = { ...p, merc, ref: G.weightedCentroidMerc(merc, p.weights) };
}

// Every statistic's answer offset on every axis.
const lines = {};       // lines[axis][id] = t
for (const ax of AXES) {
  const spec = G.axisSpec(ax);
  lines[ax] = {};
  for (const id of ids) {
    const d = data[id];
    const vals = d.merc.map(m => G.offsetOfPoint(m, spec));
    d['vals_' + ax] = vals;
    lines[ax][id] = G.targetOffset(vals, d.weights, TARGET);
  }
}

const q = s => /[",\n]/.test(String(s)) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s);
const rows = [['statistic', 'label', 'family', 'source', 'axis', 'normal_mode_axis', 'sides',
  'question', 'line_at', 'place', 'km_from_population', 'toward',
  'closest_other', 'closest_km', 'n_within_min_gap', 'within_min_gap']];
const best = {};

for (const ax of AXES) {
  const spec = G.axisSpec(ax);
  for (const id of ids) {
    const d = data[id], e = cat[id], t = lines[ax][id];
    const tPop = lines[ax][BASELINE];
    const km = G.offsetGapKm(t, tPop, spec, d.ref);
    const toward = t > tPop ? spec.sides[0] : spec.sides[1];
    let closest = null, ck = Infinity;
    const near = [];
    for (const o of ids) {
      if (o === id) continue;
      const k = G.offsetGapKm(t, lines[ax][o], spec, d.ref);
      if (k < ck) { ck = k; closest = o; }
      if (k < MIN_GAP_KM) near.push(o);
    }
    const place = G.placeNearLine(d['vals_' + ax], d.weights, d.groups, d.groupNames, t, 20);
    const at = G.lineCoordLabel(spec, t, G.CONFIG.padBbox) || '(diagonal)';
    const sentence = `Find the line that puts ${TARGET}% of ${e.question} ${spec.sides[0].toLowerCase()} of it`;
    rows.push([id, e.label, e.family, e.source, ax, G.snapAxisToCardinal(ax), spec.sides.join('/'),
      sentence, at, place || '', Math.round(km), id === BASELINE ? '' : toward,
      closest, Math.round(ck), near.length, near.join(' ')]);
    if (!best[id] || km > best[id].km) best[id] = { km, ax, toward };
  }
}
fs.mkdirSync(path.join(ROOT, 'review'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'review/questions.csv'), rows.map(r => r.map(q).join(',')).join('\n') + '\n');

// One row per statistic: its most surprising axis, and its N/S and W/E numbers.
const pick = (id, ax) => rows.find(r => r[0] === id && r[4] === ax);
const srows = [['statistic', 'label', 'family', 'source', 'points', 'ns_line', 'ns_km', 'ns_toward',
  'we_line', 'we_km', 'we_toward', 'best_axis', 'best_km', 'best_toward', 'licence', 'caveats']];
for (const id of ids) {
  const e = cat[id], ns = pick(id, 'ns'), we = pick(id, 'we'), b = best[id];
  srows.push([id, e.label, e.family, e.source, e.points, ns[8], ns[10], ns[11], we[8], we[10], we[11],
    b.ax, Math.round(b.km), id === BASELINE ? '' : b.toward, e.derivedLicence.name, e.caveats.join(' | ')]);
}
fs.writeFileSync(path.join(ROOT, 'review/statistics.csv'), srows.map(r => r.map(q).join(',')).join('\n') + '\n');
console.log(`${ids.length} statistics × ${AXES.length} axes = ${rows.length - 1} questions → review/questions.csv, review/statistics.csv`);

// Shared by themes.mjs and schedule.mjs: the game's own pure code, the
// statistics catalogue, and answer lines measured with them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MIN_GAP_KM = 18;            // the authoring gap CLAUDE.md settled on
export const NORMAL_AXES = ['ns', 'we'];
export const ALL_AXES = ['ns', 'we', '15', '30', '45', '60', '75', '105', '120', '135', '150', '165'];

// Extract /* BEGIN PURE */ … /* END PURE */ from the game, as the test pages do,
// so every number here is the number a player is graded against.
export function loadGame() {
  const js = fs.readFileSync(path.join(ROOT, 'Play/app-game.js'), 'utf8');
  const pure = js.slice(js.indexOf('/* BEGIN PURE */'), js.indexOf('/* END PURE */'));
  return new Function(pure + `; return { CONFIG, GAME, parseCsvText, axisSpec, lngLatToMerc,
    offsetOfPoint, targetOffset, offsetGapKm, weightedCentroidMerc, snapAxisToCardinal,
    proTargetBand, placeNearLine, lineCoordLabel };`)();
}

export const readJson = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

// lines[id][axis][target] = offset, plus each statistic's weighted centroid.
export function measureLines(G, cat, ids, axes, targetsFor) {
  const line = {}, ref = {};
  for (const id of ids) {
    if (!cat[id]) throw new Error('unknown statistic: ' + id);
    const p = G.parseCsvText(fs.readFileSync(path.join(ROOT, 'data', cat[id].file), 'utf8'), {});
    const merc = p.coords.map(c => G.lngLatToMerc(c));
    ref[id] = G.weightedCentroidMerc(merc, p.weights);
    line[id] = {};
    for (const ax of axes) {
      const spec = G.axisSpec(ax);
      const vals = merc.map(m => G.offsetOfPoint(m, spec));
      line[id][ax] = {};
      for (const t of targetsFor(ax)) line[id][ax][t] = G.targetOffset(vals, p.weights, t);
    }
  }
  return { line, ref };
}

// Smallest pairwise gap among statistics on one axis at one target, measured
// at each statistic's own centroid and the smaller taken, so the order of the
// statistics cannot change the verdict.
export function minGap(G, L, ids, ax, t) {
  const spec = G.axisSpec(ax);
  let m = Infinity;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = ids[i], b = ids[j];
    const ta = L.line[a][ax][t], tb = L.line[b][ax][t];
    m = Math.min(m, G.offsetGapKm(ta, tb, spec, L.ref[a]), G.offsetGapKm(ta, tb, spec, L.ref[b]));
  }
  return m;
}

export function trios(list) {
  const out = [];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++)
    for (let k = j + 1; k < list.length; k++) out.push([list[i], list[j], list[k]]);
  return out;
}

// Small seeded PRNG (mulberry32): the same seed always yields the same year.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function csv(rows) {
  const q = s => /[",\n]/.test(String(s)) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s);
  return rows.map(r => r.map(q).join(',')).join('\n') + '\n';
}

// How many valid days can each theme produce?
//
//   node tools/pipeline/themes.mjs                → review/themes.csv, review/theme-days.csv
//   node tools/pipeline/themes.mjs --normal-only  → review/themes-normal.csv, …-normal.csv
//
// A day is three statistics from one theme, all on the same axis. It is valid
// when every pair of its lines is at least MIN_GAP_KM apart:
//   - in NORMAL mode: the axis snapped to N/S or W/E, target 50%, AND
//   - in PRO mode (unless --normal-only): the axis as written, at some target
//     from the game's own proTargets band (the schedule would pin it).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, MIN_GAP_KM, NORMAL_AXES, ALL_AXES, loadGame, readJson, measureLines,
  minGap, trios, csv } from './lib.mjs';

const NORMAL_ONLY = process.argv.includes('--normal-only');
const AXES = NORMAL_ONLY ? NORMAL_AXES : ALL_AXES;
const G = loadGame();
const cat = readJson('data/stats.json');
const themes = readJson('schedule/themes.json').themes;
const ids = [...new Set(themes.flatMap(t => t.stats))];
const proBand = ax => G.GAME.proTargets[G.proTargetBand(ax)] || [50];
const L = measureLines(G, cat, ids, AXES, ax => new Set([50, ...(NORMAL_ONLY ? [] : proBand(ax))]));

const dayRows = [['theme', 'stat_1', 'stat_2', 'stat_3', 'axis', 'normal_axis', 'normal_min_gap_km',
  'pro_target', 'pro_min_gap_km']];
const sum = [['theme', 'title', 'stats', 'trios_possible', 'trios_valid_somewhere', 'valid_days',
  'valid_days_by_axis', 'stats_never_in_a_valid_day']];
let grand = 0;
for (const th of themes) {
  const all = trios(th.stats);
  let days = 0;
  const byAxis = {}, okTrios = new Set(), used = new Set();
  for (const trio of all) for (const ax of AXES) {
    const nAx = G.snapAxisToCardinal(ax);
    const nGap = minGap(G, L, trio, nAx, 50);
    if (nGap < MIN_GAP_KM) continue;
    let bestT = 50, bestG = nGap;
    if (!NORMAL_ONLY) {
      bestG = -1;
      for (const t of proBand(ax)) {
        const g = minGap(G, L, trio, ax, t);
        if (g > bestG) { bestG = g; bestT = t; }
      }
      if (bestG < MIN_GAP_KM) continue;
    }
    days++;
    byAxis[ax] = (byAxis[ax] || 0) + 1;
    okTrios.add(trio.join(' '));
    trio.forEach(x => used.add(x));
    dayRows.push([th.id, ...trio, ax, nAx, Math.round(nGap), bestT, Math.round(bestG)]);
  }
  grand += days;
  sum.push([th.id, th.title, th.stats.length, all.length, okTrios.size, days,
    AXES.filter(a => byAxis[a]).map(a => a + ':' + byAxis[a]).join(' '),
    th.stats.filter(x => !used.has(x)).join(' ')]);
}
const SUFFIX = NORMAL_ONLY ? '-normal' : '';
fs.writeFileSync(path.join(ROOT, `review/themes${SUFFIX}.csv`), csv(sum));
fs.writeFileSync(path.join(ROOT, `review/theme-days${SUFFIX}.csv`), csv(dayRows));
console.log(`${themes.length} themes, ${grand} valid days → review/themes${SUFFIX}.csv, review/theme-days${SUFFIX}.csv`);

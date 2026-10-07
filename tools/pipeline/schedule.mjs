// Generate a year of daily puzzles.
//
//   node tools/pipeline/schedule.mjs 2027                 → Play/data/games/2027.json
//   node tools/pipeline/schedule.mjs 2026 --from 2026-10-07
//   node tools/pipeline/schedule.mjs 2027 --seed 42       (default seed = the year)
//
// Also writes review/schedule-<year>.csv: the same year as a readable table.
//
// Rules (schedule/themes.json → rules, themes[].maxDaysPerYear / filler):
//   - every day is three statistics from one theme on one axis (Normal mode:
//     N/S or W/E at 50%), and all three lines are ≥ MIN_GAP_KM apart;
//   - NO DAY REPEATS within the calendar year (same three statistics, same axis);
//   - a theme appears at most maxDaysPerYear times (default in rules), the
//     filler theme takes up whatever is left;
//   - the same theme is ≥ minDaysBetweenSameTheme days apart and the same
//     statistic ≥ minDaysBetweenSameStat days apart — relaxed only when
//     nothing else fits, and every relaxation is reported;
//   - the order comes from a PRNG seeded with the year, so regenerating gives
//     the identical file, and each year comes out differently.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, MIN_GAP_KM, NORMAL_AXES, loadGame, readJson, measureLines, minGap,
  trios, rng, csv } from './lib.mjs';

const args = process.argv.slice(2);
const year = Number(args.find(a => /^\d{4}$/.test(a)));
if (!year) { console.error('usage: schedule.mjs YEAR [--from YYYY-MM-DD] [--seed N]'); process.exit(1); }
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const seed = Number(opt('--seed') || year);
const from = opt('--from') || `${year}-01-01`;

const G = loadGame();
const cat = readJson('Play/data/stats.json');
const cfg = readJson('schedule/themes.json');
const R = cfg.rules;
const themes = cfg.themes;
const rand = rng(seed);

// --- candidates: every valid (trio, axis) per theme --------------------------
const ids = [...new Set(themes.flatMap(t => t.stats))];
const L = measureLines(G, cat, ids, NORMAL_AXES, () => [50]);
const cand = {};
for (const th of themes) {
  cand[th.id] = [];
  for (const trio of trios(th.stats)) for (const ax of NORMAL_AXES) {
    const g = minGap(G, L, trio, ax, 50);
    if (g >= MIN_GAP_KM) cand[th.id].push({ trio, ax, gap: g, key: [...trio].sort().join('+') + '@' + ax });
  }
}

// --- dates ------------------------------------------------------------------
const dates = [];
for (let t = Date.parse(from + 'T00:00:00Z'); ; t += 86400000) {
  const d = new Date(t).toISOString().slice(0, 10);
  if (!d.startsWith(String(year))) break;
  dates.push(d);
}

// --- quotas -----------------------------------------------------------------
// Capped themes are scaled to the length of the period (a partial year gets a
// proportional share), then the filler takes the rest.
const share = dates.length / 365;
const quota = {};
let capped = 0;
for (const th of themes) if (!th.filler) {
  const cap = Math.round((th.maxDaysPerYear ?? R.defaultMaxDaysPerYear) * share);
  // Never plan to use EVERY valid day of a small theme: the last few would be
  // squeezed into December regardless of spacing. 10% headroom, absorbed by
  // the filler, is what removed the year-end relaxations.
  quota[th.id] = Math.min(cap, Math.floor(cand[th.id].length * 0.9));
  capped += quota[th.id];
}
const fillers = themes.filter(t => t.filler);
let rest = dates.length - capped;
for (const th of fillers) {
  quota[th.id] = Math.min(Math.ceil(rest / fillers.length), cand[th.id].length);
}
const totalQuota = Object.values(quota).reduce((a, b) => a + b, 0);
if (totalQuota < dates.length) {
  console.error(`only ${totalQuota} valid days for ${dates.length} dates — add themes or raise caps`);
  process.exit(1);
}
// If the filler overshoots (rounding), trim it so quotas sum exactly.
for (const th of fillers) {
  const over = Object.values(quota).reduce((a, b) => a + b, 0) - dates.length;
  if (over > 0) quota[th.id] -= Math.min(over, quota[th.id]);
}

// --- schedule, day by day ---------------------------------------------------
const lastTheme = {}, lastStat = {}, lastAxis = {}, usedKeys = new Set();
const relaxations = [];
const days = [];
for (let i = 0; i < dates.length; i++) {
  const left = dates.length - i;
  // Urgency = share of the remaining days this theme still needs; a little
  // seeded jitter so equal themes do not always come out in the same order.
  const ranked = themes
    .filter(th => quota[th.id] > 0)
    .map(th => ({ th, score: quota[th.id] / left + rand() * 0.02 }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.th);

  // Relax as little as possible, and in this order: first try EVERY theme at
  // full spacing (the most urgent theme being blocked today is not a reason
  // to bend a rule if another theme fits); only then shorten the statistic
  // gap, and only after that the theme gap.
  // Before any relaxation, a theme that has used up its share may take the day
  // anyway, if it still has unused valid days: going a day or two past a SOFT
  // (default) cap is better than two statistics repeating within the week. A
  // cap set explicitly in themes.json (maxDaysPerYear) is never exceeded.
  const spare = themes.filter(th => quota[th.id] <= 0 && (th.filler || th.maxDaysPerYear === undefined));
  let choice = null, tgap = R.minDaysBetweenSameTheme, sgap = R.minDaysBetweenSameStat;
  search:
  for (tgap = R.minDaysBetweenSameTheme; tgap >= 0; tgap--) {
    for (sgap = R.minDaysBetweenSameStat; sgap >= 0; sgap--) {
      const full = tgap === R.minDaysBetweenSameTheme && sgap === R.minDaysBetweenSameStat;
      for (const th of full ? [...ranked, ...spare] : ranked) {
        if (lastTheme[th.id] !== undefined && i - lastTheme[th.id] < tgap) continue;
        const ok = cand[th.id].filter(c => !usedKeys.has(c.key) &&
          c.trio.every(st => lastStat[st] === undefined || i - lastStat[st] >= sgap));
        if (!ok.length) continue;
        // Prefer the axis this theme did NOT use last time; otherwise random.
        const fresh = ok.filter(c => c.ax !== lastAxis[th.id]);
        const pool = fresh.length ? fresh : ok;
        choice = { th, c: pool[Math.floor(rand() * pool.length)], sgap };
        break search;
      }
    }
  }
  if (!choice) { console.error(`no valid day left for ${dates[i]}`); process.exit(1); }
  const { th, c } = choice;
  if (tgap < R.minDaysBetweenSameTheme) relaxations.push(`${dates[i]}: theme gap relaxed to ${tgap} (${th.id})`);
  if (sgap < R.minDaysBetweenSameStat) relaxations.push(`${dates[i]}: statistic gap relaxed to ${sgap} (${th.id})`);
  quota[th.id]--;
  usedKeys.add(c.key);
  lastTheme[th.id] = i; lastAxis[th.id] = c.ax;
  c.trio.forEach(s => { lastStat[s] = i; });
  // Round order shuffled too, so a theme's statistics do not always come
  // out in the order they are listed.
  const order = [...c.trio];
  for (let k = order.length - 1; k > 0; k--) {        // Fisher–Yates
    const j = Math.floor(rand() * (k + 1));
    [order[k], order[j]] = [order[j], order[k]];
  }
  days.push({ date: dates[i], theme: th.id, title: th.title, gapKm: Math.round(c.gap),
              rounds: order.map(s => [s, c.ax]) });
}

// --- verify what was written, independently of how it was built -------------
const seen = new Set();
for (const d of days) {
  const key = d.rounds.map(r => r[0]).sort().join('+') + '@' + d.rounds[0][1];
  if (seen.has(key)) throw new Error('repeated day ' + key);
  seen.add(key);
  const g = minGap(G, L, d.rounds.map(r => r[0]), d.rounds[0][1], 50);
  if (g < MIN_GAP_KM) throw new Error(`${d.date}: lines only ${g.toFixed(1)} km apart`);
}

// --- write -----------------------------------------------------------------
fs.mkdirSync(path.join(ROOT, 'Play/data/games'), { recursive: true });
const out = path.join(ROOT, `Play/data/games/${year}.json`);
// One day per line, so the file reads (and diffs) like a calendar.
const lines = days.map(d => '  ' + JSON.stringify(d));
const head = {
  year, seed, from, generated: new Date().toISOString().slice(0, 10), mode: R.mode,
  minGapKm: MIN_GAP_KM, rules: { ...R, _readme: undefined },
};
fs.writeFileSync(out, JSON.stringify(head, null, 1).replace(/\n}$/, ',\n "days": [\n') +
  lines.join(',\n') + '\n ]\n}\n');
JSON.parse(fs.readFileSync(out, 'utf8'));   // must round-trip

const label = id => cat[id].label;
fs.writeFileSync(path.join(ROOT, `review/schedule-${year}.csv`), csv([
  ['date', 'weekday', 'theme', 'axis', 'round_1', 'round_2', 'round_3', 'closest_pair_km'],
  ...days.map(d => [d.date, new Date(d.date + 'T00:00:00Z').toUTCString().slice(0, 3), d.title,
    d.rounds[0][1] === 'ns' ? 'North/South' : 'West/East', ...d.rounds.map(r => label(r[0])), d.gapKm])]));

const perTheme = {};
days.forEach(d => { perTheme[d.title] = (perTheme[d.title] || 0) + 1; });
console.log(`${year}: ${days.length} days (${from} → ${dates[dates.length - 1]}), seed ${seed} → ${path.relative(ROOT, out)}`);
console.log('  per theme: ' + Object.entries(perTheme).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log(`  N/S ${days.filter(d => d.rounds[0][1] === 'ns').length} · W/E ${days.filter(d => d.rounds[0][1] === 'we').length}`);
console.log(relaxations.length ? `  ${relaxations.length} relaxation(s):\n    ` + relaxations.join('\n    ') : '  no rules relaxed');

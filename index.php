<?php
// Cache-bust the local CSS/JS with their mtime. Browsers cache these hard, and
// a stale copy silently masking an edit is the single most confusing failure
// mode when working on this page.
$v = function ($f) {
    $path = __DIR__ . '/' . $f;
    return $f . '?v=' . (is_file($path) ? filemtime($path) : '0');
};

// --- AdSense ---------------------------------------------------------------
// One responsive horizontal unit in the bottom bar. Fill AD_SLOT in with the
// slot id from AdSense (see the README note) and the ad goes live on the
// production host.
$AD_CLIENT = 'ca-pub-4410734268512605';
$AD_SLOT   = '8803444436';

// MASTER SWITCH for this page. false = no ad bar, no AdSense loader, no consent
// UI, and the map takes the space the bar was using. The slot and client above
// are left intact deliberately: this turns the DISPLAY off, it does not
// dismantle the setup, so flipping this one word brings everything back exactly
// as it was. Nothing else in the project serves ads: the ad-supported build
// was retired on 2026-08-26 (see CLAUDE.md), so this flag is the only ad
// machinery left standing.
$SHOW_ADS = false;


// Only ever request a real ad from the live site. A page served from localhost
// asking for ads is invalid traffic, and it is the kind that gets an account
// suspended rather than merely ignored — so the tag is simply not emitted
// anywhere else, and the bar shows a sized placeholder instead.
$adsLive = $SHOW_ADS
    && $AD_SLOT !== ''
    && strpos(($_SERVER['HTTP_HOST'] ?? ''), 'puntofisso.net') !== false;
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MapSplit — divide location data into 2 parts</title>
    <script defer data-domain="puntofisso.net" src="https://plausible.puntofisso.net/js/script.file-downloads.outbound-links.js"></script>
    <link rel="stylesheet" href="<?= $v('style-main.css') ?>" />
<?php if ($adsLive): ?>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=<?= htmlspecialchars($AD_CLIENT, ENT_QUOTES) ?>" crossorigin="anonymous"></script>
<?php endif; ?>
  </head>
  <body>
    <!-- Page shell. Stacked full-width rows at every screen size:

           "topbar"   everything the app knows and every control
           "stage"    the map, which gets all the space left over
           "adbar"    one ad, and nothing else — omitted when $SHOW_ADS is
                      false, and the grid's third row then collapses to zero
                      height, handing the space to the map

         Nothing overlays the map and nothing sits beside it, so there is no
         second layout to reason about — desktop and mobile differ only in how
         tightly the bars are packed.

         The map is not the viewport, which is why visibleBbox(),
         viewportCenterLngLat() and applyViewBox() in app-main.js measure
         #stage's client rect rather than window.innerWidth/innerHeight. -->
    <div id="shell">
      <!-- Top bar: the app's only chrome. The answer on the left, the
           controls on the right, the ingest notice under both when there is
           one. The breakdown and the provenance are one click away in their
           own dialogs, because neither is needed to read the split and both
           are tall. -->
      <header id="topbar">
        <!-- The logo sits outside #topbar-main so it can anchor the bar's left
             edge at full height, rather than wrapping along with the controls. -->
        <div class="bar-brand">
          <h1>MapSplit</h1>
          <button type="button" id="btn-info" aria-label="About MapSplit" title="About MapSplit"
                  aria-haspopup="dialog">i</button>
        </div>

        <div id="topbar-main">
        <p id="summary"></p>

        <div class="bar-controls">
          <div class="bar-group bar-data">
            <!-- Populated from CONFIG.datasets; stays hidden while that list is
                 empty, so the default file is unchanged. -->
            <select id="dataset-picker" aria-label="Choose a dataset" hidden></select>
            <button type="button" id="btn-load" aria-label="Load a file…" title="Load a file…">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <input type="file" id="file-input" accept=".csv,.tsv,.txt,.json,.geojson,.asc" hidden />
          </div>

          <div class="bar-group bar-snaps">
            <button type="button" id="btn-horizontal" title="Snap the line level (North–South split)">↔ <span class="btn-word">Horizontal</span></button>
            <button type="button" id="btn-vertical" title="Snap the line upright (West–East split)">↕ <span class="btn-word">Vertical</span></button>
            <button type="button" id="btn-balance-ns" title="Move a horizontal line to the 50/50 North–South split">⚖ N–S</button>
            <button type="button" id="btn-balance-we" title="Move a vertical line to the 50/50 West–East split">⚖ W–E</button>
          </div>

          <div class="bar-group bar-links">
            <label class="animate-toggle" title="Animate the balance search"><input type="checkbox" id="animate-balance" checked /> Animate</label>
            <!-- Hidden by setSource() when the data source supplies no groups,
                 since the contract makes them optional. -->
            <button type="button" id="btn-breakdown" class="link-info" aria-haspopup="dialog" hidden><span class="lbl-long">What's being counted</span><span class="lbl-short">Breakdown</span></button>
            <button type="button" id="btn-sources" class="link-info" aria-haspopup="dialog">Sources</button>
<?php if ($adsLive): ?>
            <!-- Revealed by the script at the end of <body> once Funding
                 Choices is confirmed present, so a blocked CMP leaves no dead
                 button behind. See that script for why this has to exist. -->
            <button type="button" id="btn-privacy" class="link-info" hidden><span class="lbl-long">Privacy settings</span><span class="lbl-short">Privacy</span></button>
<?php endif; ?>
            <span class="bar-stat">Statistic: <span id="stat-label">—</span></span>
          </div>
        </div>

        <!-- Every guess the ingest layer makes is reported here, because
             silently picking a weight column is how a plausible wrong answer
             gets believed. -->
        <p id="notice" class="notice" hidden></p>
        </div>
      </header>
      <div id="stage">
        <svg id="map" preserveAspectRatio="xMidYMid meet" aria-label="Map of the UK with a dividing line">
          <defs>
            <clipPath id="clip-primary" clipPathUnits="userSpaceOnUse"><polygon id="poly-primary" points="" /></clipPath>
            <clipPath id="clip-secondary" clipPathUnits="userSpaceOnUse"><polygon id="poly-secondary" points="" /></clipPath>
            <!-- Rotation affordance: a 120° arc over the handle with an arrowhead at
                 each end (rotate either way). Authored in screen pixels; placed by a
                 per-handle group scaled so 1 unit here == 1 screen pixel. -->
            <g id="rot-hint">
              <path class="rot-arc" d="M -11.26 -6.5 A 13 13 0 0 1 11.26 -6.5" />
              <polygon class="rot-head" points="13.76,-2.17 7.8,-4.5 14.72,-8.5" />
              <polygon class="rot-head" points="-13.76,-2.17 -14.72,-8.5 -7.8,-4.5" />
            </g>
          </defs>
          <g id="coast"></g>
          <polygon id="tint-primary" class="half-primary" points="" />
          <polygon id="tint-secondary" class="half-secondary" points="" />
          <g id="pts-primary" clip-path="url(#clip-primary)"></g>
          <g id="pts-secondary" clip-path="url(#clip-secondary)"></g>
          <line id="divider-ext" />
          <line id="divider-seg" />
          <line id="hit-seg" />
          <g id="handle-a" class="handle-group">
            <use href="#rot-hint" />
            <circle class="handle" />
          </g>
          <g id="handle-b" class="handle-group">
            <use href="#rot-hint" />
            <circle class="handle" />
          </g>
        </svg>

      </div>

<?php if ($SHOW_ADS): ?>
      <!-- Ad bar. One responsive horizontal unit, height-capped by CSS so a
           creative can never grow into the map. The "Advertisement" label is
           there because an ad butted against a page's own chrome has to be
           distinguishable from it — that is both the AdSense placement rule
           and the honest thing to do. -->
      <footer id="adbar">
        <span class="ad-tag">Advertisement</span>
        <div id="ad-slot">
<?php if ($adsLive): ?>
          <!-- NO data-ad-format and NO data-full-width-responsive, deliberately.
               Both hand the size choice to the network, and "horizontal" is a
               hint rather than a constraint — ask for it and you can still be
               served a 300x600, which is exactly what happened. Without them
               this is a FIXED-size request, and the size comes from the
               computed CSS on .adsbygoogle at the moment push() runs. Change
               the size in style-main.css, not here. -->
          <ins class="adsbygoogle"
               data-ad-client="<?= htmlspecialchars($AD_CLIENT, ENT_QUOTES) ?>"
               data-ad-slot="<?= htmlspecialchars($AD_SLOT, ENT_QUOTES) ?>"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
<?php else: ?>
          <p class="ad-placeholder">Ad slot &mdash; 728&times;90 desktop, 320&times;100 mobile</p>
<?php endif; ?>
        </div>
      </footer>
<?php endif; ?>
    </div>

    <!-- One floating tooltip, repositioned per pointer move (see the tooltip
         hit-test). Hidden whenever the pointer is not over a drawn point.
         Outside #shell because it is position:fixed to the viewport. -->
    <div id="point-tip" hidden></div>

    <!-- Column-mapping dialog. Its fields are rebuilt from the loaded file's
         columns each time it opens; see openMapping() in the loading section. -->
    <div id="map-modal" class="modal" hidden>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">Map the columns</h2>
        <p id="modal-sub" class="modal-sub"></p>
        <div id="modal-fields"></div>
        <div class="modal-actions">
          <button type="button" id="modal-cancel">Cancel</button>
          <button type="button" id="modal-confirm">Show data</button>
        </div>
      </div>
    </div>

    <!-- Breakdown dialog. Clusters the divider passes through contribute to
         both sides and are marked †, so the same name in both columns reads as
         information rather than a bug. Rebuilt only while open. -->
    <div id="breakdown-modal" class="modal" hidden>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="breakdown-title">
        <h2 id="breakdown-title">What's being counted</h2>
        <p id="bd-total" class="bd-total"></p>
        <div class="bd-cols">
          <div class="bd-col bd-primary">
            <h3 id="bd-head-primary"></h3>
            <ul id="bd-list-primary"></ul>
          </div>
          <div class="bd-col bd-secondary">
            <h3 id="bd-head-secondary"></h3>
            <ul id="bd-list-secondary"></ul>
          </div>
        </div>
        <p id="bd-note" class="bd-note"></p>
        <div class="modal-actions">
          <button type="button" id="breakdown-close">Close</button>
        </div>
      </div>
    </div>

    <!-- Sources dialog. The only place the app says where its numbers came
         from, so every dataset has an entry (see the data-source contract). -->
    <div id="sources-modal" class="modal" hidden>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="sources-title">
        <h2 id="sources-title">Sources</h2>
        <div class="info-body">
          <h3>Data: <span id="credit-source">—</span></h3>
          <ul id="sources-list"></ul>

          <h3>Basemap</h3>
          <p><a href="https://www.naturalearthdata.com/downloads/10m-cultural-vectors/"
                target="_blank" rel="noopener">Natural Earth 1:10m</a> (public domain),
             simplified and inlined as an SVG path — no map tiles.</p>
        </div>
        <div class="modal-actions">
          <button type="button" id="sources-close">Close</button>
        </div>
      </div>
    </div>

    <!-- About / info dialog. -->
    <div id="info-modal" class="modal" hidden>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="info-title">
        <h2 id="info-title">About MapSplit</h2>
        <div id="info-body" class="info-body">
          <p>MapSplit: draw a movable straight line across the UK and reports a statistic
             for each side.</p>

          <h3>Using it</h3>
          <ul>
            <li>Select a <strong>dataset</strong> from the drop down or upload your own file (see below how to).
                Where its numbers came from is listed under <strong>Sources</strong>, linked below the drop down.</li>
            <li>Drag the <strong>line</strong> across the country;
                rotate the <strong>handle</strong> to any angle.</li>
            <li>Use <strong>↔ Horizontal</strong> and <strong>↕ Vertical</strong> to
                snap back to a level line.</li>
            <li>Check the totals and the partial breakdown in <strong>What's being counted</strong>. When a
                line runs roughly north–south the split is labelled West/East instead of North/South.</li>
            <li><strong>Hover</strong> a point to see more a data tooltip.</li>
          </ul>

          <h3>Loading your own data</h3>
          <p>Drag a file onto the map, or use the upload button. A dialog lets you confirm which column is which. Accepted files:
             CSV/TSV, GeoJSON points or polygons, and JSON or ESRI-ASCII grids.
             The minimum each needs:</p>
          <ul>
            <li><strong>CSV/TSV</strong>: a column for longitude, one for latitude column, and a numeric value column. An optional text column can group the
                points. </li>
            <li><strong>GeoJSON</strong>: Point/MultiPoint, or polygons (reduced
                to their centroids), with a numeric property.</li>
            <li><strong>Grids</strong>: a bounding box (or origin + cell size) and
                a numeric value per cell.</li>
          </ul>

          <p class="info-src"><strong>IMPORTANT:</strong> coordinates must be unprojected <strong>WGS84
             longitude/latitude in degrees</strong> (EPSG:4326).</p>

          <h3>Play the daily game</h3>
          <p><a href="https://playmapsplit.puntofisso.net/" target="_blank" rel="noopener">MapSplit
             Play</a> turns this into a daily puzzle: three statistics a day, and
             you find the line that splits each one in half.</p>

          <h3>Development notes</h3>
          <p>This website was developed by Giuseppe Sollazzo with an LLM-aided workflow using Claude Opus 5 and manual tests.</p>
          <p>The datasets were created by cleaning and merging the source data above using a manually created <a href="https://github.com/puntofisso/MapSplit/blob/main/data-scripts/Notebook.ipynb">Jupyter notebook</a></p>

        </div>
        <div class="modal-actions">
          <button type="button" id="info-close">Close</button>
        </div>
      </div>
    </div>

    <script src="<?= $v('app-main.js') ?>"></script>
<?php if ($adsLive): ?>
    <script>
    /* Google's GDPR message ends with "look for a link at the bottom of this
       page or in the site menu to manage or withdraw consent". That link is
       the PUBLISHER's job. Funding Choices shows the consent dialog once and
       then renders nothing persistent — it just exposes
       googlefc.showRevocationMessage() for re-opening it. Without this button
       there is no route back into the consent choices, which is exactly why
       no control ever appeared on the page.

       Inline here rather than in app-main.js because it is meaningless without
       the AdSense loader, and this whole block is only emitted alongside it.

       The button starts hidden and is revealed only once the API is really
       there: googlefc arrives asynchronously after adsbygoogle.js, and if the
       CMP is blocked or fails it never arrives at all — in which case a
       visible "Privacy settings" button that did nothing would be worse than
       no button. */
    (function () {
      var btn = document.getElementById('btn-privacy');
      if (!btn) return;
      var tries = 0;
      (function poll() {
        var fc = window.googlefc;
        if (fc && typeof fc.showRevocationMessage === 'function') {
          btn.hidden = false;
          btn.addEventListener('click', function () {
            try { fc.showRevocationMessage(); } catch (e) { /* never break the map */ }
          });
          return;
        }
        if (++tries < 40) setTimeout(poll, 250);   // give up after ~10s
      })();
    })();
    </script>
<?php endif; ?>
  </body>
</html>

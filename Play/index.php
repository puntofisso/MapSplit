<?php
// ===========================================================================
// ADS: ON/OFF. This one line is the whole switch.
//
//     true  — ads on (but still only on the live host; see $adsLive below)
//     false — every trace of AdSense is gone from the rendered page: no
//             loader script, no <ins> unit, no "Advertisement" label, no
//             reserved slot height, no consent/Privacy-settings button.
//             Nothing to hide with CSS and nothing left to lay out around.
//
// Flip it, reload. Nothing else in this file or in app-game.js needs touching.
// ===========================================================================
$SHOW_ADS = false;

// Cache-bust the local CSS/JS with their mtime. Browsers cache these hard, and
// a stale copy silently masking an edit is the single most confusing failure
// mode when working on this page.
$v = function ($f) {
    $path = __DIR__ . '/' . $f;
    return $f . '?v=' . (is_file($path) ? filemtime($path) : '0');
};

// The same for the DATA the game fetches: stats.json and the yearly schedules
// change at every refresh, and a browser pairing a cached old catalogue with a
// new schedule would fail — or worse, score against last year's numbers. The
// newest of their mtimes stamps both URLs; each statistic file carries its own
// content hash inside stats.json, so it is versioned from there.
$dataVersion = 0;
foreach (array_merge([__DIR__ . '/data/stats.json'], glob(__DIR__ . '/data/games/*.json') ?: []) as $p) {
    if (is_file($p)) $dataVersion = max($dataVersion, filemtime($p));
}

// --- AdSense ---------------------------------------------------------------
// ONE fixed-size unit, BELOW THE FOLD in the content flow — never over the map.
//
// This page scrolls on purpose (see style-game.css). Google's consent badge is
// scroll-triggered, and the fixed non-scrolling shell this replaced left its
// placement logic with nothing to read, which is how the badge ended up parked
// mid-map. With an ordinary scrolling document it places itself bottom-left,
// so there are deliberately NO consent-repositioning workarounds here. If you
// re-introduce one, check first that it is still needed.
$AD_CLIENT = 'ca-pub-4410734268512605';
$AD_SLOT   = '8803444436';

// Only ever request a real ad from the live site. A page served from localhost
// asking for ads is invalid traffic of the kind that gets an account suspended
// rather than ignored, so the tag is simply not emitted anywhere else.
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
    <!-- Privacy-friendly analytics by Plausible (the playmapsplit.puntofisso.net site) -->
    <script async src="https://plausible.puntofisso.net/js/pa-LIzdQiag_UL_LfBCBMxeU.js"></script>
    <script>
      window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
      plausible.init()
    </script>
    <link rel="stylesheet" href="<?= $v('style-game.css') ?>" />
<?php if ($adsLive): ?>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=<?= htmlspecialchars($AD_CLIENT, ENT_QUOTES) ?>" crossorigin="anonymous"></script>
<?php endif; ?>
  </head>
  <body>
    <!-- Page shell. Two stacked full-width rows at every screen size:

           "topbar"   the puzzle, the guess button and the links
           "stage"    the map, which gets everything left over

         Nothing overlays the map and nothing sits beside it, so there is no
         second layout to reason about — desktop and mobile differ only in how
         tightly the bars are packed.

         The map is not the viewport, which is why visibleBbox(),
         viewportCenterLngLat() and applyViewBox() in app-game.js measure
         #stage's client rect rather than window.innerWidth/innerHeight. -->
    <div id="shell">
      <!-- Top bar: the app's only chrome. The answer on the left, the
           controls on the right, the ingest notice under both when there is
           one. The breakdown and the provenance are one click away in their
           own dialogs, because neither is needed to read the split and both
           are tall. -->
      <header id="topbar">
        <!-- Everything in the bar sits in the SAME centred column as the map
             box and the prose below it. The wordmark used to hang off the bar's
             left edge, which pushed the rest of the bar right and left the task
             visibly off-centre from the map once the map stopped being
             full-bleed. In the column it is just the first thing in the top
             row. -->
        <div class="bar-inner">
        <div class="bar-top">
          <div class="bar-brand">
            <h1>MapSplit</h1>
            <button type="button" id="btn-info" aria-label="About MapSplit" title="About MapSplit"
                    aria-haspopup="dialog">i</button>
          </div>

          <!-- Which map. Built by renderRegions() from the REGIONS table, not
               written out here, so adding a region is one line of JS. Flags
               alone would be a guessing game for anyone who does not read them
               instantly, so each carries a title and an accessible name. -->
          <div class="bar-group bar-regions" id="region-picker" role="group"
               aria-label="Choose a map"></div>

          <!-- Difficulty. Both labels are always visible: "Pro" on its own
               says nothing about what changes, and the pair does. Built by
               renderModes() from the MODES table. -->
          <div class="bar-group bar-modes" id="mode-picker" role="group"
               aria-label="Difficulty"></div>

          <div class="bar-group bar-links">
            <button type="button" id="btn-sources" class="link-info" aria-haspopup="dialog">Sources</button>
            <button type="button" id="btn-scores" class="link-info" aria-haspopup="dialog" hidden>Score</button>
<?php if ($adsLive): ?>
            <!-- Google's GDPR message tells users to "look for a link at the
                 bottom of this page or in the site menu" to change their
                 choice. Supplying that link is the PUBLISHER's job, and
                 showRevocationMessage() is the documented API for it. Stays
                 hidden until googlefc confirms the API exists, so a blocked or
                 failed CMP leaves no dead button behind. -->
            <button type="button" id="btn-privacy" class="link-info" hidden><span class="lbl-long">Privacy settings</span><span class="lbl-short">Privacy</span></button>
<?php endif; ?>
          </div>
        </div>

        <!-- Three separate things, and they used to be one sentence: which
             puzzle it is, which round you are on, and what you have to do.
             The first two are chrome and sit small in the meta row; the task
             is the only thing the player has to read, so it gets its own
             boxed row at the BOTTOM of the bar, hard against the map.
             Note what is NOT here: the split. The player must not be able to
             read the answer off the bar while dragging, or the puzzle
             collapses into "drag until the number matches". -->
        <div class="bar-group bar-meta">
          <strong id="hud-no">MapSplit</strong>
          <span id="hud-round" class="hud-round"></span>
          <span id="hud-dots" aria-label="Guesses used"></span>
        </div>

        <!-- The task. Its own boxed row, last in the bar and hard against
             the map, because it is the question and everything else here is
             furniture. -->
        <div id="hud">
          <p id="hud-task">Loading today's puzzle…</p>
          <p id="hud-hint" class="hud-hint"><span aria-hidden="true">✋</span> Drag the line anywhere on the map &mdash; let go to lock in your guess.</p>
        </div>

        <!-- Every guess the ingest layer makes is reported here, because
             silently picking a weight column is how a plausible wrong answer
             gets believed. -->
        <p id="notice" class="notice" hidden></p>
        </div>
      </header>
      <!-- The play area: the map boxed to the same column the prose below it
           uses, with an empty rail either side. The rails are placeholders —
           there is deliberately NO ad in them — but they are why the map is
           column-width rather than full-bleed: a lateral unit drops into one
           without moving the map a pixel, and below 1140px the columns
           collapse and the rails stack under the box. -->
      <div id="play">
        <aside class="rail rail-l"></aside>
        <div id="stage">
          <svg id="map" preserveAspectRatio="xMidYMid meet" aria-label="Map of the UK with a dividing line">
            <defs>
              <clipPath id="clip-primary" clipPathUnits="userSpaceOnUse"><polygon id="poly-primary" points="" /></clipPath>
              <clipPath id="clip-secondary" clipPathUnits="userSpaceOnUse"><polygon id="poly-secondary" points="" /></clipPath>
            </defs>
            <g id="coast"></g>
            <polygon id="tint-primary" class="half-primary" points="" />
            <polygon id="tint-secondary" class="half-secondary" points="" />
            <!-- One group per revealed answer, rebuilt from round.results by
                 renderAnswers(). Previous rounds' answers stay on the map, faded,
                 because the takeaway compares against them and a line you can see
                 beats a line described in words. -->
            <g id="answers"></g>
            <g id="pts-primary" clip-path="url(#clip-primary)"></g>
            <g id="pts-secondary" clip-path="url(#clip-secondary)"></g>
            <line id="divider-ext" />
            <line id="divider-seg" />
            <line id="hit-seg" />
            <!-- The grab affordance. A 1-D control whose only visible part is a
                 2px line reads as decoration; the hand says the line is the
                 thing you move. Placed by recompute() at the midpoint of the
                 visible line and scaled back to screen pixels, like every other
                 screen-sized thing in this world-unit viewBox. -->
            <g id="grip" aria-hidden="true">
              <circle id="grip-disc" r="15" />
              <text id="grip-hand" y="5">✋</text>
            </g>
          </svg>

          <!-- The reveal. Nothing advances until its button is pressed: commitGuess
           used to start the next round immediately, which left no time for the
           answer to animate or the fact to be read. -->
          <div id="toast" class="toast" hidden role="status" aria-live="polite">
            <p id="toast-verdict"></p>
            <p id="toast-fact"></p>
            <div class="toast-actions">
              <span id="toast-points"></span>
              <button type="button" id="toast-next">Next round &rarr;</button>
            </div>
          </div>

        </div>
        <aside class="rail rail-r"></aside>
      </div>

    </div>

    <!-- Below the fold. Real content, and also the reason the page has any
         height beyond the viewport at all: Google's consent badge is
         scroll-triggered, and the fixed non-scrolling shell this replaced gave
         it nothing to react to. -->
    <main id="below">
      <h2>How to play</h2>
      <p>One puzzle a day, in <strong>three rounds</strong>. Each round names a
         statistic and asks you to find the line that splits it in half &mdash;
         say <em>half of all income tax north of the line</em>. The three
         answers sit in different places, and that is the point: tax does not
         live where population lives.</p>
      <ul>
        <li>The round's <strong>angle is fixed</strong>. The line only slides &mdash;
            drag anywhere on the map, or use the <strong>arrow keys</strong>
            (hold <strong>Shift</strong> for bigger steps) to be exact.</li>
        <li>Every round asks for the <strong>50/50 line</strong>: level, to
            split north from south, or upright, to split west from east.</li>
        <?php /* Pro mode is hidden (MODES in app-game.js). When it returns,
           restore: "<strong>Normal</strong> always asks for the 50/50 line, level
           or upright. <strong>Pro</strong> asks for whatever split the day names
           &mdash; and at whatever angle, including diagonals. A tilted line is the
           same one slider; what is harder is reading it against a country whose
           shape you only know upright." */ ?>
        <li>You <strong>cannot see the split</strong> while you move the line.
            That is the game. <strong>Let go of the line</strong> &mdash; or press
            <strong>Enter</strong> &mdash; and the guess is locked in.</li>
        <li><strong>One guess per round.</strong> No retries &mdash; with a smooth,
            continuous quantity a second guess would just be arithmetic on the
            first.</li>
        <li>You are scored on <strong>how far your line is from the correct
            one</strong>, not on the percentage you hit. Within
            <strong>10&nbsp;km</strong> is a bullseye; the score reaches zero at
            <strong>250&nbsp;km</strong>. 1,000 points a round, 3,000 a day.</li>
      </ul>

<?php if ($SHOW_ADS): ?>
      <!-- Ad. In the content flow, below the fold, after a block of real
           content — so it never covers the map and never competes with the
           puzzle. The height is reserved by CSS whether or not a creative
           arrives, so nothing below it jumps when the ad fills.

           NO data-ad-format and NO data-full-width-responsive, deliberately:
           both hand the size choice to the network, and "horizontal" is a hint
           rather than a constraint — ask for it and a 300x600 can still come
           back. Without them this is a FIXED-size request and the size comes
           from the computed CSS on .adsbygoogle when push() runs. Change the
           size in style-game.css, not here. -->
      <aside class="adbox">
        <span class="ad-tag">Advertisement</span>
        <div id="ad-slot">
<?php if ($adsLive): ?>
          <ins class="adsbygoogle"
               data-ad-client="<?= htmlspecialchars($AD_CLIENT, ENT_QUOTES) ?>"
               data-ad-slot="<?= htmlspecialchars($AD_SLOT, ENT_QUOTES) ?>"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
<?php else: ?>
          <p class="ad-placeholder">Ad slot &mdash; 728&times;90 desktop, 320&times;100 mobile</p>
<?php endif; ?>
        </div>
      </aside>
<?php endif; ?>

      <h2>Why distance, not percentage?</h2>
      <p>Near a city, a line one pixel further north can swing the share by
         several points while barely moving at all. Distance is what you actually
         control, so distance is what gets scored &mdash; and a line 5&nbsp;km out
         genuinely is nearly right, even when the percentage says otherwise.</p>

      <h2>Where the numbers come from</h2>
      <p>Real published data covering the whole UK: the 2021/22 census (via the
         Unified UK Census from the Geographic Data Service), ONS population
         estimates, HMRC income and tax statistics, the 2024 general election
         results from the House of Commons Library, the government's Renewable
         Energy Planning Database, and shops and landmarks from OpenStreetMap.
         Each point is a local authority, a constituency or a single place; the
         line splits the country in two and the statistic is totalled on each
         side. The exact source of every round is under
         <a href="#" id="foot-sources">Sources</a>.</p>

      <!-- An ad unit belongs here when ads return: in the content flow, below
           the fold, where it neither covers the map nor competes with the
           puzzle. See index.php for the AdSense pattern ($SHOW_ADS). -->

      <footer class="site-foot">
        <p>MapSplit &mdash; drag a line across the UK and see what it divides.
           Built by Giuseppe Sollazzo.
           Coastline: Natural Earth 1:10m (public domain).</p>
        <!-- Credits the licences require wherever the data is shown. The ODbL
             line in particular must be visible: shops and landmarks are
             OpenStreetMap data. Per-round detail is in the Sources dialog. -->
        <p class="site-credits">Shops and landmarks &copy;
           <a href="https://www.openstreetmap.org/copyright" target="_blank"
              rel="noopener">OpenStreetMap contributors</a>, available under the
           Open Database Licence. Contains public sector information licensed
           under the Open Government Licence v3.0, and Parliamentary information
           licensed under the Open Parliament Licence v3.0. Census data provided
           by the Geographic Data Service (geods.ac.uk).</p>
      </footer>
    </main>

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

    <!-- Result dialog. Shown when the round ends, and reachable again from the
         Score button afterwards, so closing it is never a dead end. The grid is
         rendered as selectable text rather than an image: it is exactly the
         characters that go on the clipboard, so what you see is what you paste,
         and it still works when the clipboard API is refused. -->
    <div id="result-modal" class="modal" hidden>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="res-title">
        <h2 id="res-title">Round over</h2>
        <p id="res-line" class="modal-sub"></p>
        <ul id="res-rows" class="res-rows"></ul>
        <h3 id="res-learn-head" class="res-learn-head" hidden>What you learned today</h3>
        <ul id="res-learn" class="res-learn"></ul>
        <p id="res-score"></p>
        <p id="share-note" class="share-note" hidden></p>
        <div class="modal-actions">
          <button type="button" id="result-close">Close</button>
          <button type="button" id="btn-share">Share</button>
        </div>
      </div>
    </div>

    <!-- About / info dialog. -->
    <div id="info-modal" class="modal" hidden>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="info-title">
        <h2 id="info-title">How to play</h2>
        <div id="info-body" class="info-body">
          <h3>How to play</h3>
          <p>One puzzle a day, in <strong>three rounds</strong>. Each round names a
             statistic and asks you to find the line that splits it in half
             &mdash; say <em>half of all income tax north of the line</em>.</p>
          <ul>
            <li>Drag and release the line to lock in your guess. You can also use the arrow keys (hold Shift for bigger steps) when you want to be
                exact and hit Enter.</li>
            <li><strong>One guess per round.</strong> There are no retries.</li>
            <li>You are scored on <strong>how far your line is from the correct
                one</strong>, not on the percentage you hit. Within
                <strong>10&nbsp;km</strong> is a bullseye; the score reaches zero at
                <strong>250&nbsp;km</strong>. 1,000 points a round, 3,000 a day.</li>
          </ul>
        
          <h3>Where the numbers come from</h3>
          <p>Real published data for the whole UK &mdash; the census, ONS, HMRC,
             the 2024 election, renewable energy projects and OpenStreetMap
             &mdash; listed for each round under <strong>Sources</strong>. Each
             point is a local authority, a constituency or a single place; a line
             splits the country into two half-planes and the statistic is
             totalled on each side.</p>

          <h3>Split your own data</h3>
          <p>The <a href="https://puntofisso.net/MapSplit/" target="_blank" rel="noopener">MapSplit
             tool</a> lets you drag a line at any angle across the UK, with
             sample datasets or a file of your own, and see the totals on each
             side as you go.</p>

          <h3>Development notes</h3>
          <p>This website was developed by Giuseppe Sollazzo with an LLM-aided workflow using Claude Opus 5 and manual tests.</p>
          <p>The datasets are built from the publishers' own files by a
             repeatable pipeline &mdash; every source, its licence and each
             processing step are in the
             <a href="https://github.com/puntofisso/MapSplit/tree/main/sources"
                target="_blank" rel="noopener">sources folder on GitHub</a>.</p>
        </div>
        <div class="modal-actions">
          <button type="button" id="info-close">Close</button>
        </div>
      </div>
    </div>

    <script>window.MAPSPLIT_DATA_VERSION = <?= json_encode((string) $dataVersion) ?>;</script>
    <script src="<?= $v('app-game.js') ?>"></script>
<?php if ($adsLive): ?>
    <script>
    /* Reveal the Privacy settings link once Funding Choices is actually
       present. Inline here rather than in app-game.js because it is meaningless
       without the AdSense loader, and this block is only emitted alongside it.
       googlefc arrives asynchronously after adsbygoogle.js, so poll — and if it
       never arrives (blocked CMP, ad blocker) the button simply stays hidden
       instead of becoming a control that does nothing. */
    (function () {
      var btn = document.getElementById('btn-privacy');
      if (!btn) return;
      var tries = 0;
      (function poll() {
        var fc = window.googlefc;
        if (fc && typeof fc.showRevocationMessage === 'function') {
          btn.hidden = false;
          btn.addEventListener('click', function () {
            try { fc.showRevocationMessage(); } catch (e) { /* never break the game */ }
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

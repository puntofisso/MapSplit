/* Dismissable adverts, for index-ads.php only.
 *
 * Lives here rather than in app.js because app.js is shared with index.html,
 * which has no AdSense units and must not grow code for them. Loaded with a
 * plain classic <script defer>, matching the rest of the project.
 *
 * Dismissal lasts until the next page load, deliberately — nothing is stored.
 * "Get this off my map right now" is the promise; a reload is a fresh start.
 * That also keeps the ad request honest: the page asks for an ad exactly once
 * per load and always shows what it asked for, so there is no way to book an
 * impression nobody saw. */
(function () {
  'use strict';

  function slots() {
    return [document.getElementById('ad'), document.getElementById('ad-mobile')];
  }

  function init() {
    slots().forEach(function (el) {
      if (!el || !el.querySelector('.adsbygoogle')) return;

      // Requesting the ad is this file's job, not the markup's — see ads.php.
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) { /* a blocked or failed loader must not break the map */ }

      var btn = el.querySelector('.ad-close');
      if (btn) btn.addEventListener('click', function () { el.hidden = true; });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

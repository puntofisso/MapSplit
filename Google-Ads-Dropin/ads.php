<?php
/**
 * Google AdSense drop-in for MapSplit.
 *
 * Three moving parts:
 *   switchon.php / switchoff.php  create and delete the .ads-enabled marker
 *   ads_enabled()                 reports whether that marker is there
 *   ads_loader() / ads_unit()     emit the AdSense tags, and nothing at all
 *                                 while the switch is off
 *
 * The marker lives next to this file (__DIR__), so the toggle works the same
 * whoever includes it and from wherever. Callers fall back to the house ads in
 * the else-branch of ads_enabled(); this file never renders a fallback itself,
 * so the drop-in stays droppable into a page with different house creative.
 */

/**
 * One entry per placement, each with its own AdSense unit so desktop and
 * mobile report separately.
 *
 * These are FIXED sizes, deliberately. A responsive unit lets AdSense pick the
 * size, and both of these float over the map — hand that choice away and you
 * get a 560px-tall creative covering the country. So each placement names one
 * size and omits data-ad-format; 'full_width' stays false so the unit cannot
 * expand to the viewport. style.css pins the same numbers with !important,
 * because adsbygoogle.js rewrites this inline style once it picks a creative
 * and an inline style beats an ordinary rule.
 */
function ads_config() {
    return array(
        'client' => 'ca-pub-4410734268512605',
        'placements' => array(
            // Bottom-right corner on desktop: the standard medium rectangle.
            'desktop' => array(
                'slot'   => '5877758576',
                'width'  => 300,
                'height' => 250,
            ),
            // Bottom bar under 640px: the standard large mobile banner, which
            // is 100px tall and so costs about a sixth of a phone screen.
            'mobile' => array(
                'slot'   => '9905417313',
                'width'  => 320,
                'height' => 100,
            ),
        ),
    );
}

/** True when the URL switch has been thrown on. */
function ads_enabled() {
    return file_exists(__DIR__ . '/.ads-enabled');
}

/**
 * The adsbygoogle loader, for <head>. Call it once per page — the static guard
 * makes a second call a no-op, so a caller with several units cannot load the
 * library twice.
 */
function ads_loader() {
    static $done = false;
    if ($done || !ads_enabled()) return;
    $done = true;
    $client = htmlspecialchars(ads_config()['client'], ENT_QUOTES);
    echo "\n    <script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="
       . $client . "\" crossorigin=\"anonymous\"></script>"
       . "\n    <script defer src=\"Google-Ads-Dropin/ads.js\"></script>";
}

/** One ad unit, named by placement. Silent when the switch is off. */
function ads_unit($placement) {
    if (!ads_enabled()) return;
    $cfg = ads_config();
    if (!isset($cfg['placements'][$placement])) return;
    $p = $cfg['placements'][$placement];
    $e = function ($v) { return htmlspecialchars($v, ENT_QUOTES); };
    echo '<ins class="adsbygoogle"'
       . ' style="display:inline-block;width:' . (int) $p['width'] . 'px'
       . ';height:' . (int) $p['height'] . 'px"'
       . ' data-ad-client="' . $e($cfg['client']) . '"'
       . ' data-ad-slot="' . $e($p['slot']) . '"'
       . ' data-full-width-responsive="false"></ins>';
    // No inline push: ads.js decides whether to request an ad at all. Loading
    // one and then hiding it would book an impression nobody saw, which is
    // invalid traffic — so a dismissed session must never make the request.

}

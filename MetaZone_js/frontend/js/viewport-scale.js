// viewport-scale.js (v0.9.1)
//
// MetaZone's whole UI (base.css) is built on fixed-pixel values --
// panel widths, dropzone heights, font sizes -- tuned to look right in
// the app's reference window size (1300x900, see app.py). That's
// exact and correct on the display it was designed on, but the same
// fixed pixels take up a much bigger share of a smaller/lower-res
// screen (1366x768 and similar 720p-class monitors), which is what
// reads as the UI being "huge". This script does NOT change any of
// that pixel design -- it applies one uniform CSS `zoom` to the whole
// document so the entire UI scales down (or, up to 100%, back up)
// together, preserving every proportion exactly, to fit whatever
// window size the app actually ends up at on the current screen.
//
// CSS `zoom` (not `transform: scale`) is deliberate: unlike transform,
// zoom genuinely changes the effective viewport for vh/vw-based
// layout (this app leans on calc(100vh - ...) throughout) and for
// position:sticky/fixed/absolute -- so scaled content still reflows,
// scrolls and hit-tests correctly instead of just being visually
// stretched over unscaled layout math.
//
// Scale is derived from the window's own size vs. the 1300x900
// design reference, capped at 100% (never zooms IN past the design's
// native size -- a maximized window on a big/4K screen just shows the
// UI at its normal size with extra room around it, rather than
// blowing it up) and floored so it never shrinks past legibility.
(function () {
  var DESIGN_WIDTH = 1300;
  var DESIGN_HEIGHT = 900;
  var MIN_SCALE = 0.55;
  var MAX_SCALE = 1.0;

  var root = document.documentElement;

  // Graceful no-op on any engine that doesn't support CSS zoom (older
  // WebKitGTK builds) -- app simply keeps its pre-v0.9.1 sizing there
  // instead of risking a broken/partial scale.
  if (!root || !('zoom' in root.style)) return;

  // The API Manager / Meta Embedder utility popups load this same
  // index.html at their own small, already-appropriate window sizes
  // (see bridge.py) -- leave those alone entirely.
  if (new URLSearchParams(location.search).get('popup')) return;

  var resizeTimer = null;

  function applyScale() {
    // Reset to 1 first so the innerWidth/innerHeight read below is
    // always the window's true physical size, never a size already
    // distorted by a previously-applied zoom -- otherwise each
    // subsequent resize would compute its new scale from the wrong
    // (already-scaled) baseline.
    root.style.zoom = '1';
    var w = window.innerWidth || root.clientWidth;
    var h = window.innerHeight || root.clientHeight;
    if (!w || !h) return;

    var scale = Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT);
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    root.style.zoom = String(scale);
  }

  applyScale();
  // Re-measure once more after the DOM is actually ready, in case the
  // very first measurement (taken while <head> was still parsing) was
  // ever unreliable in a given environment -- cheap, and a no-op if
  // the number hasn't changed.
  document.addEventListener('DOMContentLoaded', applyScale);

  // Debounced: a window drag-resize fires this rapidly; only rescale
  // once movement settles rather than on every intermediate frame.
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyScale, 80);
  });
})();

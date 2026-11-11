/* A thin reading-progress line along the top of article pages. */
(function () {
  var bar = document.querySelector('.read-bar span');
  if (!bar) return;
  var ticking = false;
  function paint() {
    ticking = false;
    var d = document.documentElement;
    var max = d.scrollHeight - d.clientHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, Math.max(0, d.scrollTop / max)) : 0) + ')';
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  paint();
})();

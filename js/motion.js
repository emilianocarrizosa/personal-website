/* A small motion switch for every page. "off" means no fades or transitions at all.
   Default: follow the visitor's system setting (Reduce Motion = off). The choice is remembered on this device. */
(function () {
  'use strict';
  var root = document.documentElement;
  var buttons = [].slice.call(document.querySelectorAll('[data-motion-toggle]'));
  if (!buttons.length) return;
  function label() {
    var on = root.getAttribute('data-motion') !== 'off';
    buttons.forEach(function (b) {
      b.hidden = false;
      b.textContent = 'Motion: ' + (on ? 'on' : 'off');
      b.setAttribute('aria-label', 'Motion: ' + (on ? 'on' : 'off') + '. Switch ' + (on ? 'off' : 'on'));
    });
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-motion') === 'off' ? 'on' : 'off';
      root.setAttribute('data-motion', next);
      try { localStorage.setItem('motion', next); } catch (e) {}
      label();
    });
  });
  label();
})();

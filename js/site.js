/* emilianocar.com — home page behaviour.
   Sections open as native <dialog> windows over the bands. The address bar always says where you are
   (#work, #about, ... #resume), so Back, Forward, reloads and shared links all behave. */
(function () {
  'use strict';
  var bandsEl = document.querySelector('.bands');
  if (!bandsEl || !window.HTMLDialogElement) return;

  var KEYS = ['name', 'work', 'about', 'experience', 'services', 'skills', 'writing', 'contact'];
  var desktop = window.matchMedia('(min-width:760px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var base = location.pathname + location.search;
  var bandFor = {};
  var lastFocus = null;

  [].forEach.call(document.querySelectorAll('.band-link'), function (a) { bandFor[a.getAttribute('data-key')] = a.closest('.band'); });
  var $ = function (id) { return document.getElementById(id); };
  var dialogs = [].slice.call(document.querySelectorAll('dialog.win'));

  function currentKey() {
    var h = '';
    try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
    return (KEYS.indexOf(h) > -1 || h === 'resume') ? h : '';
  }
  function parentOf(k) { return k === 'resume' ? 'experience' : ''; }
  function wanted(k) {
    if (!k) return [];
    if (k === 'resume') return ['experience', 'resume'];
    if (k === 'name' && desktop.matches) return [];       // on desktop the Name band opens in place
    return [k];
  }

  /* ----- navigation ----- */
  function go(key, trigger) {
    if (trigger) lastFocus = trigger;
    var cur = currentKey();
    if (key === cur) return;
    var url = key ? '#' + key : base;
    if (cur === 'name' && key) history.replaceState({ app: 1 }, '', url);   // hopping band to band: one Back returns home
    else history.pushState({ app: 1 }, '', url);
    sync();
  }
  function back() {                                        // close the top-most layer
    var cur = currentKey();
    if (!cur) return;
    if (history.state && history.state.app) { history.back(); return; }
    var p = parentOf(cur);
    history.replaceState(null, '', p ? '#' + p : base);
    sync();
  }

  /* ----- bands ----- */
  function setBand(key) {
    var open = key === 'resume' ? 'experience' : key;
    [].forEach.call(document.querySelectorAll('.band.is-open'), function (b) { b.classList.remove('is-open'); });
    if (open && bandFor[open]) { bandFor[open].classList.add('is-open'); bandsEl.classList.add('has-open'); }
    else bandsEl.classList.remove('has-open');
    if (open !== 'name') closePlaques(true);
  }

  /* ----- windows ----- */
  function resumeBtn() {                                   // the "View résumé" button that is actually on screen
    var all = document.querySelectorAll('#experience [data-key="resume"]');
    for (var i = 0; i < all.length; i++) if (all[i].getClientRects().length) return all[i];
    return null;
  }
  function zoomFrames(d, reverse) {
    var b = resumeBtn(); if (!b) return null;
    var br = b.getBoundingClientRect(), r = d.getBoundingClientRect();
    if (!br.width || !r.width) return null;
    var dx = (br.left + br.width / 2) - (r.left + r.width / 2), dy = (br.top + br.height / 2) - (r.top + r.height / 2);
    var s = Math.max(0.05, Math.min(0.2, br.width / r.width));
    var from = { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', opacity: 0 };
    var mid = { transform: 'translate(' + dx * 0.4 + 'px,' + dy * 0.4 + 'px) scale(' + (s + 0.45) + ')', opacity: 1, offset: 0.55 };
    var to = { transform: 'none', opacity: 1 };
    return reverse ? [{ transform: 'none', opacity: 1 }, { transform: from.transform, opacity: 0 }] : [from, mid, to];
  }
  function openDlg(d) {
    if (!d || d.open) return;
    try { d.showModal(); } catch (e) { return; }
    if (!d.animate) return;
    if (reduce.matches) { d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 }); return; }
    var kf = d.id === 'resume' ? zoomFrames(d, false) : null;
    if (kf) d.animate(kf, { duration: 460, easing: 'cubic-bezier(.2,.9,.25,1)' });
    else d.animate([{ opacity: 0, transform: 'translateY(8px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function closeDlg(d) {
    if (!d.open || d._closing) return;
    d._closing = true;
    var fin = function () { d._byUs = true; if (d.open) d.close(); d._closing = false; };
    if (reduce.matches || !d.animate) { fin(); return; }
    var kf = d.id === 'resume' ? zoomFrames(d, true) : null;
    var anim = kf ? d.animate(kf, { duration: 300, easing: 'cubic-bezier(.4,0,.6,1)' })
                  : d.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6px) scale(.99)' }], { duration: 140, easing: 'ease-in' });
    anim.finished.then(fin, fin);
  }
  var prevKey = currentKey();
  function sync() {
    var key = currentKey(), want = wanted(key);
    setBand(key);
    if (prevKey === 'name' && !key && desktop.matches && bandFor.name) bandFor.name.querySelector('.band-link').focus({ preventScroll: true });
    prevKey = key;
    dialogs.forEach(function (d) { if (d.open && want.indexOf(d.id) < 0) closeDlg(d); });
    want.forEach(function (id) { openDlg($(id)); });
  }

  dialogs.forEach(function (d) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); back(); });
    d.addEventListener('mousedown', function (e) { d._bd = e.target === d; });
    d.addEventListener('click', function (e) { if (e.target === d && d._bd) back(); });
    d.addEventListener('close', function () {
      var ours = d._byUs; d._byUs = false;
      if (!ours && wanted(currentKey()).indexOf(d.id) > -1) { back(); return; }   // closed some other way
      if (d.id === 'resume') { var rb = resumeBtn(); if (rb) rb.focus(); return; }
      if (!document.querySelector('dialog[open]') && !wanted(currentKey()).length) {
        var f = lastFocus && document.contains(lastFocus) ? lastFocus : (bandFor[d.id === 'name' ? 'name' : d.id] || document).querySelector('.band-link');
        if (f && f.focus) f.focus({ preventScroll: true });
      }
    });
  });
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-close]');
    if (c) { e.preventDefault(); back(); }
  });
  [].forEach.call(document.querySelectorAll('a[data-key]'), function (a) {
    a.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      var key = a.getAttribute('data-key');
      if (key === 'name' && desktop.matches && currentKey() === 'name') { back(); return; }
      go(key, a);
    });
  });
  window.addEventListener('popstate', sync);
  (desktop.addEventListener ? desktop.addEventListener.bind(desktop, 'change') : desktop.addListener.bind(desktop))(sync);

  /* ----- wall label + curator's note on the open Name band (desktop) ----- */
  var plaques = [
    { tag: $('tag-label'), pl: $('plaque-label') },
    { tag: $('tag-note'), pl: $('plaque-note') }
  ];
  function closePlaques(silent) {
    plaques.forEach(function (p) {
      if (!p.pl || p.pl.hidden) return;
      p.pl.hidden = true; p.tag.hidden = false; p.tag.setAttribute('aria-expanded', 'false');
      if (!silent) p.tag.focus();
    });
  }
  plaques.forEach(function (p) {
    if (!p.tag || !p.pl) return;
    p.tag.addEventListener('click', function () {
      closePlaques(true);
      p.tag.setAttribute('aria-expanded', 'true'); p.tag.hidden = true; p.pl.hidden = false;
      var x = p.pl.querySelector('[data-plaque-close]'); if (x) x.focus();
    });
    p.pl.addEventListener('click', function (e) { if (e.target.closest('[data-plaque-close]')) closePlaques(); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
    var anyOpen = plaques.some(function (p) { return p.pl && !p.pl.hidden; });
    if (anyOpen) { e.preventDefault(); closePlaques(); }
    else if (currentKey() === 'name' && desktop.matches) { e.preventDefault(); back(); }
  });

  /* ----- copy email ----- */
  var cb = $('copy-email'), cs = $('copy-status'), tm;
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return legacy(t); });
    return Promise.resolve(legacy(t));
  }
  function legacy(t) {
    var ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    (document.querySelector('dialog[open]') || document.body).appendChild(ta);
    ta.select(); ta.setSelectionRange(0, t.length);
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove(); return ok;
  }
  if (cb) cb.addEventListener('click', function () {
    copyText(cb.getAttribute('data-email')).then(function (ok) {
      cs.textContent = ok ? 'Copied.' : 'Couldn’t copy. Select the address above instead.';
      clearTimeout(tm); tm = setTimeout(function () { cs.textContent = ''; }, 3000);
    });
  });

  /* ----- Writing: browse, search, paging ----- */
  var list = $('w-list');
  if (list) (function () {
    var items = [].slice.call(list.querySelectorAll('.post'));
    var tools = $('w-tools'), none = $('w-none'), pager = $('w-pager'), note = $('w-note');
    if (!items.length) { if (tools) tools.hidden = true; return; }
    var PER = 10, cat = 'all', q = '', page = 1;
    var blurb = { tech: 'Notes on IT, security and systems.', personal: 'Reflection on work, values, and life.' };
    var filters = [].slice.call(document.querySelectorAll('.w-browse [data-cat]'));
    function render() {
      [].forEach.call(list.querySelectorAll('.w-year'), function (n) { n.remove(); });
      var match = items.filter(function (it) {
        return (cat === 'all' || it.getAttribute('data-cat') === cat) && (!q || it.getAttribute('data-search').indexOf(q) > -1);
      });
      var pages = Math.max(1, Math.ceil(match.length / PER));
      if (page > pages) page = pages;
      var slice = match.slice((page - 1) * PER, page * PER), lastYear = null;
      items.forEach(function (it) { it.hidden = slice.indexOf(it) < 0; });
      slice.forEach(function (it) {
        var y = it.getAttribute('data-year');
        if (y !== lastYear) { var h = document.createElement('p'); h.className = 'w-year'; h.textContent = y; list.insertBefore(h, it); lastYear = y; }
      });
      none.hidden = match.length > 0;
      pager.hidden = pages < 2;
      $('w-pg').textContent = 'Page ' + page + ' of ' + pages;
      $('w-prev').disabled = page <= 1; $('w-next').disabled = page >= pages;
      filters.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-cat') === cat ? 'true' : 'false'); });
      if (cat === 'all') { note.hidden = true; }
      else { note.hidden = false; note.textContent = blurb[cat] + ' '; var s = document.createElement('button'); s.type = 'button'; s.className = 'link'; s.textContent = 'Show all'; s.onclick = function () { cat = 'all'; page = 1; render(); }; note.appendChild(s); }
    }
    filters.forEach(function (b) { b.addEventListener('click', function () { cat = b.getAttribute('data-cat'); page = 1; render(); }); });
    $('w-q').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); page = 1; render(); });
    $('w-prev').addEventListener('click', function () { page--; render(); });
    $('w-next').addEventListener('click', function () { page++; render(); });
    render();
  })();

  if (currentKey()) sync();
})();

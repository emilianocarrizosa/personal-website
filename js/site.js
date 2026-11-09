/* emilianocar.com — home page behaviour.
   Sections open as native <dialog> windows over the bands. The address bar always says where you are
   (#work, #about, ... #resume), so Back, Forward, reloads and shared links all behave. */
(function () {
  'use strict';
  var bandsEl = document.querySelector('.bands');
  if (!bandsEl || !window.HTMLDialogElement) return;

  var KEYS = ['name', 'work', 'about', 'experience', 'services', 'skills', 'writing', 'contact'];
  var PARENT = { resume: 'experience', colophon: 'contact' };   // windows that open on top of another one
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
    return (KEYS.indexOf(h) > -1 || PARENT[h]) ? h : '';
  }
  function parentOf(k) { return PARENT[k] || ''; }
  function wanted(k) {
    if (!k) return [];
    if (PARENT[k]) return [PARENT[k], k];
    return [k];
  }

  /* ----- navigation ----- */
  function go(key, trigger) {
    if (trigger) lastFocus = trigger;
    var cur = currentKey();
    if (key === cur) return;
    var url = key ? '#' + key : base;
    history.pushState({ app: 1 }, '', url);
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

  /* ----- windows ----- */
  function resumeBtn() {                                   // the "View résumé" button that is actually on screen
    var all = document.querySelectorAll('#experience [data-key="resume"]');
    for (var i = 0; i < all.length; i++) if (all[i].getClientRects().length) return all[i];
    return null;
  }
  /* Windows only fade: slow, still, no zoom or slide. */
  var EASE = 'cubic-bezier(.4,0,.2,1)';
  function openDlg(d) {
    if (!d || d.open) return;
    try { d.showModal(); } catch (e) { return; }
    d.classList.remove('is-closing');
    if (!d.animate) return;
    d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduce.matches ? 120 : 380, easing: EASE, fill: 'backwards' });
  }
  function closeDlg(d) {
    if (!d.open || d._closing) return;
    d._closing = true;
    var fin = function () { d._byUs = true; if (d.open) d.close(); d._closing = false; d.classList.remove('is-closing'); };
    if (reduce.matches || !d.animate) { fin(); return; }
    d.classList.add('is-closing');
    var anim = d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: EASE, fill: 'forwards' });
    anim.finished.then(fin, fin);
  }
  function sync() {
    var key = currentKey(), want = wanted(key);
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
      if (PARENT[d.id]) {
        var tr = d.id === 'resume' ? resumeBtn() : document.querySelector('#' + PARENT[d.id] + ' [data-key="' + d.id + '"]');
        if (tr) tr.focus(); return;
      }
      if (!document.querySelector('dialog[open]') && !wanted(currentKey()).length) {
        var f = lastFocus && document.contains(lastFocus) ? lastFocus : (bandFor[d.id] || document).querySelector('.band-link');
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
      go(key, a);
    });
  });
  window.addEventListener('popstate', sync);

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

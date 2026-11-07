/* Home page: highlight the nav link and edge-rail segment for the section on screen,
   and tint the browser's address bar to match. The page works without this script. */
(function () {
    'use strict';
    var sections = Array.prototype.slice.call(document.querySelectorAll('.band[id]'));
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
    var segs = Array.prototype.slice.call(document.querySelectorAll('.rail i'));
    var nav = document.querySelector('.nav-links');
    var theme = document.querySelector('meta[name="theme-color"]');
    if (!sections.length || !('IntersectionObserver' in window)) return;

    function show(id) {
        links.forEach(function (a) {
            var on = a.getAttribute('href') === '#' + id;
            if (on) { a.setAttribute('aria-current', 'location'); } else { a.removeAttribute('aria-current'); }
            if (on && nav && nav.scrollWidth > nav.clientWidth) {            // keep the active tab visible on phones
                nav.scrollTo({ left: a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2 });
            }
        });
        sections.forEach(function (s, i) { if (segs[i]) segs[i].classList.toggle('on', s.id === id); });
        var s = document.getElementById(id);
        if (theme && s) theme.setAttribute('content', getComputedStyle(s).getPropertyValue('--bg').trim() || '#141414');
    }

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) show(e.target.id); });
    }, { rootMargin: '-50% 0px -50% 0px' });          // whichever section crosses the middle of the screen
    sections.forEach(function (s) { io.observe(s); });
    show(sections[0].id);
})();

/* "Free me": turns the home-page tiles into bouncing, falling boxes.
   Plain JS, no dependencies. Axis-aligned boxes only (no rotation).
   Escape or the floating button puts everything back. */
(function () {
    'use strict';

    var btn = document.getElementById('free-me');
    var grid = document.querySelector('.page--home .grid');
    if (!btn || !grid) return;

    var root = document.documentElement;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var say = document.createElement('p');
    say.className = 'sr'; say.setAttribute('role', 'status');
    document.body.appendChild(say);

    var GRAVITY = 2200, BOUNCE = 0.62, STEP = 1 / 120, REST_SPEED = 90, BOTTOM_STRIP = 76;
    var active = false, busy = false, lock = false;
    var bodies = [], world = null, raf = 0, last = 0, acc = 0, drag = null;

    function label(text) { btn.textContent = text; }

    function sync() {
        btn.hidden = reduce.matches;
        if (reduce.matches && active) release(true);
    }
    if (reduce.addEventListener) reduce.addEventListener('change', sync); else reduce.addListener(sync);
    sync();

    btn.addEventListener('click', function () {
        if (busy) return;
        active ? release(false) : free();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && active && !busy) release(false); });
    // Only a width change ends it: phones fire resize whenever the address bar slides away.
    var lastW = root.clientWidth;
    window.addEventListener('resize', function () {
        var w = root.clientWidth, changed = w !== lastW; lastW = w;
        if (active && changed) release(true);
    });

    /* ---------- start ---------- */
    function free() {
        var tiles = Array.prototype.filter.call(grid.children, function (el) { return el.classList.contains('tile'); });
        var sx = window.scrollX, sy = window.scrollY;
        var vw = root.clientWidth, vh = window.innerHeight;
        var docH = Math.max(root.scrollHeight, vh);

        var items = [], area = 0, tallest = 0;
        tiles.forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) return;            // hidden on this screen size
            items.push({ el: el, x: r.left + sx, y: r.top + sy, w: r.width, h: r.height });
            area += r.width * r.height; tallest = Math.max(tallest, r.height);
        });
        if (!items.length) return;

        // If everything can comfortably pile up inside the visible screen, use the screen.
        // Otherwise (small phones) use the whole page so tiles never have to overlap.
        var usable = vh - BOTTOM_STRIP;
        lock = area / (vw * usable) < 0.55 && tallest < usable * 0.6;
        world = lock ? { l: 0, r: vw, t: sy, b: sy + usable } : { l: 0, r: vw, t: 0, b: docH };

        bodies = items.map(function (it) {
            var ghost = document.createElement('div');
            ghost.className = 'fm-ghost ' + it.el.className.split(/\s+/).filter(function (c) { return /^(c\d+|r\d+|t3)$/.test(c); }).join(' ');
            ghost.style.height = it.h + 'px';
            ghost.setAttribute('aria-hidden', 'true');
            grid.insertBefore(ghost, it.el);

            var b = {
                el: it.el, ghost: ghost, x: it.x, y: it.y, w: it.w, h: it.h,
                vx: (Math.random() - 0.5) * 1400, vy: -300 - Math.random() * 900,
                im: 10000 / (it.w * it.h), drag: false
            };
            b.x = Math.min(Math.max(b.x, world.l), world.r - b.w);
            b.y = Math.min(Math.max(b.y, world.t), world.b - b.h);
            it.el.style.width = it.w + 'px';
            it.el.style.height = it.h + 'px';
            it.el.classList.add('fm-free');
            it.el.addEventListener('pointerdown', down);
            it.el.addEventListener('dragstart', prevent);
            return b;
        });

        if (lock) root.classList.add('fm-lock');
        btn.classList.add('fm-btn--float');
        label('Put them back');
        say.textContent = 'Tiles released. Press Escape or the Put them back button to return them.';
        active = true; draw();
        acc = 0; last = performance.now();
        raf = requestAnimationFrame(frame);
    }

    /* ---------- physics ---------- */
    function frame(now) {
        if (!active) return;
        acc += Math.min((now - last) / 1000, 0.05); last = now;
        while (acc >= STEP) { step(STEP); acc -= STEP; }
        draw();
        raf = requestAnimationFrame(frame);
    }

    function step(dt) {
        var i, j, k, b;
        for (i = 0; i < bodies.length; i++) {
            b = bodies[i];
            if (b.drag) continue;
            b.vy += GRAVITY * dt;
            b.x += b.vx * dt; b.y += b.vy * dt;
        }
        bodies.sort(function (p, q) { return (q.y + q.h) - (p.y + p.h); });   // resolve the bottom of a stack first
        for (k = 0; k < 8; k++) {
            for (i = 0; i < bodies.length; i++) walls(bodies[i], dt);
            for (i = 0; i < bodies.length; i++)
                for (j = i + 1; j < bodies.length; j++) pair(bodies[i], bodies[j]);
            for (i = 0; i < bodies.length; i++) walls(bodies[i], dt);
        }
        for (i = 0; i < bodies.length; i++) {            // let tiny jitters come to rest
            b = bodies[i];
            if (!b.drag && Math.abs(b.vx) < 6) b.vx = 0;
            if (!b.drag && Math.abs(b.vy) < 24 && b.y + b.h >= world.b - 1) b.vy = 0;
        }
    }

    function walls(b, dt) {
        var e = function (v) { return Math.abs(v) < REST_SPEED ? 0 : BOUNCE; };
        if (b.x < world.l) { b.x = world.l; if (b.vx < 0) b.vx = -b.vx * e(b.vx); }
        if (b.x + b.w > world.r) { b.x = world.r - b.w; if (b.vx > 0) b.vx = -b.vx * e(b.vx); }
        if (b.y < world.t) { b.y = world.t; if (b.vy < 0) b.vy = -b.vy * e(b.vy); }
        if (b.y + b.h > world.b) {
            b.y = world.b - b.h;
            if (b.vy > 0) b.vy = -b.vy * e(b.vy);
            b.vx -= b.vx * Math.min(1, 5 * dt);          // floor friction
        }
    }

    function pair(a, b) {
        var ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        if (ox <= 0) return;
        var oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (oy <= 0) return;
        var ia = a.drag ? 0 : a.im, ib = b.drag ? 0 : b.im, tot = ia + ib;
        if (!tot) return;

        var nx = 0, ny = 0, pen;
        if (ox < oy) { nx = (b.x + b.w / 2 > a.x + a.w / 2) ? 1 : -1; pen = ox; }
        else { ny = (b.y + b.h / 2 > a.y + a.h / 2) ? 1 : -1; pen = oy; }

        pen = Math.max(pen - 0.2, 0);
        a.x -= nx * pen * ia / tot; a.y -= ny * pen * ia / tot;
        b.x += nx * pen * ib / tot; b.y += ny * pen * ib / tot;

        var rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv >= 0) return;
        var j = -(1 + (-rv < REST_SPEED ? 0 : BOUNCE)) * rv / tot;
        a.vx -= j * ia * nx; a.vy -= j * ia * ny;
        b.vx += j * ib * nx; b.vy += j * ib * ny;

        var tx = -ny, ty = nx;                           // a little sliding friction
        var jt = -((b.vx - a.vx) * tx + (b.vy - a.vy) * ty) / tot * 0.12;
        a.vx -= jt * ia * tx; a.vy -= jt * ia * ty;
        b.vx += jt * ib * tx; b.vy += jt * ib * ty;
    }

    function draw() {
        for (var i = 0; i < bodies.length; i++) {
            var b = bodies[i];
            b.el.style.transform = 'translate3d(' + Math.round(b.x) + 'px,' + Math.round(b.y) + 'px,0)';
        }
    }

    /* ---------- grab and throw ---------- */
    function prevent(e) { e.preventDefault(); }
    function bodyOf(el) { for (var i = 0; i < bodies.length; i++) if (bodies[i].el === el) return bodies[i]; return null; }

    function down(e) {
        if (!active || busy || (e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('.btn')) return;
        var b = bodyOf(e.currentTarget);
        if (!b) return;
        drag = { b: b, id: e.pointerId, sx: e.pageX, sy: e.pageY, ox: e.pageX - b.x, oy: e.pageY - b.y, moved: false, hist: [] };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
        document.addEventListener('pointercancel', up);
    }

    function move(e) {
        if (!drag || e.pointerId !== drag.id) return;
        var b = drag.b;
        if (!drag.moved) {
            if (Math.hypot(e.pageX - drag.sx, e.pageY - drag.sy) < 6) return;
            drag.moved = true; b.drag = true; b.vx = b.vy = 0;
            b.el.classList.add('fm-drag');
        }
        b.x = Math.min(Math.max(e.pageX - drag.ox, world.l), world.r - b.w);
        b.y = Math.min(Math.max(e.pageY - drag.oy, world.t), world.b - b.h);
        var now = performance.now();
        drag.hist.push({ t: now, x: b.x, y: b.y });
        while (drag.hist.length > 2 && now - drag.hist[0].t > 100) drag.hist.shift();
        var f = drag.hist[0], dt = Math.max((now - f.t) / 1000, 0.016);
        b.vx = (b.x - f.x) / dt; b.vy = (b.y - f.y) / dt;
    }

    function up(e) {
        if (!drag || e.pointerId !== drag.id) return;
        var b = drag.b, moved = drag.moved, lastMove = drag.hist.length ? drag.hist[drag.hist.length - 1].t : 0;
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        drag = null;
        if (!moved) return;
        b.drag = false; b.el.classList.remove('fm-drag');
        if (performance.now() - lastMove > 80) b.vx = b.vy = 0;   // held still before letting go
        var speed = Math.hypot(b.vx, b.vy);
        if (speed > 2600) { b.vx *= 2600 / speed; b.vy *= 2600 / speed; }
        // the release should not count as a click on the tile's link
        var stop = function (ev) { ev.preventDefault(); ev.stopPropagation(); };
        b.el.addEventListener('click', stop, true);
        setTimeout(function () { b.el.removeEventListener('click', stop, true); }, 60);
    }

    /* ---------- put everything back ---------- */
    function release(instant) {
        if (!active) return;
        active = false; cancelAnimationFrame(raf);
        if (drag) {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            document.removeEventListener('pointercancel', up);
            drag = null;
        }
        say.textContent = 'Tiles returned.';
        label('Free me');
        if (instant) return cleanup();

        busy = true; btn.disabled = true;
        var sx = window.scrollX, sy = window.scrollY;
        bodies.forEach(function (b) {
            var r = b.ghost.getBoundingClientRect();
            b.el.classList.remove('fm-drag');
            b.el.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)';
            b.el.style.transform = 'translate3d(' + Math.round(r.left + sx) + 'px,' + Math.round(r.top + sy) + 'px,0)';
        });
        setTimeout(cleanup, 620);
    }

    function cleanup() {
        bodies.forEach(function (b) {
            b.el.classList.remove('fm-free', 'fm-drag');
            b.el.removeEventListener('pointerdown', down);
            b.el.removeEventListener('dragstart', prevent);
            b.el.style.width = b.el.style.height = b.el.style.transform = b.el.style.transition = '';
            if (b.ghost.parentNode) b.ghost.parentNode.removeChild(b.ghost);
        });
        bodies = []; world = null;
        root.classList.remove('fm-lock');
        btn.classList.remove('fm-btn--float');
        btn.disabled = false; busy = false;
    }
})();

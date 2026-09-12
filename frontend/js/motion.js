/* ==========================================================================
   ACTA — Motion engine
   Behaviour attaches declaratively through data-attributes so pages stay
   markup-first:
     data-reveal[="left|right|scale|blur|hero"]  reveal on scroll
     data-stagger="60"                            stagger children by Nms
     data-count="18490" [data-count-prefix]       animated number
     data-tilt                                    pointer tilt (fine pointers)
     data-parallax="0.15"                         scroll parallax
     data-ripple                                  tap ripple
   ========================================================================== */
(function (global) {
  'use strict';

  var reduced = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function motionOff() {
    return reduced || document.documentElement.getAttribute('data-motion') === 'off';
  }

  /* ------------------------------------------------------------ Reveal */
  var revealObserver = null;

  function initReveal(root) {
    root = root || document;

    /* Apply stagger delays before observing. */
    root.querySelectorAll('[data-stagger]').forEach(function (parent) {
      var step = parseInt(parent.getAttribute('data-stagger'), 10) || 60;
      var base = parseInt(parent.getAttribute('data-stagger-base'), 10) || 0;
      Array.prototype.forEach.call(parent.children, function (child, i) {
        child.style.setProperty('--reveal-delay', (base + i * step) + 'ms');
        if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '');
      });
    });

    var targets = root.querySelectorAll('[data-reveal]:not(.is-in)');
    if (motionOff()) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }

    targets.forEach(function (el) {
      /* Anything already in view on load reveals immediately rather than
         waiting for a scroll that may never come on short pages. */
      var r = el.getBoundingClientRect();
      if (r.top < global.innerHeight * 0.92 && r.bottom > 0) {
        el.classList.add('is-in');
      } else {
        revealObserver.observe(el);
      }
    });
  }

  /* ---------------------------------------------------------- Counters */
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function countUp(el, opts) {
    opts = opts || {};
    var to = parseFloat(el.getAttribute('data-count'));
    if (isNaN(to)) return;
    var from = parseFloat(el.getAttribute('data-count-from')) || 0;
    var dur = parseInt(el.getAttribute('data-count-dur'), 10) || 1200;
    var dec = parseInt(el.getAttribute('data-count-dec'), 10) || 0;
    var prefix = el.getAttribute('data-count-prefix') || '';
    var suffix = el.getAttribute('data-count-suffix') || '';
    var group = el.getAttribute('data-count-group') !== 'false';

    function fmt(v) {
      var s = group ? Number(v.toFixed(dec)).toLocaleString('en-IN') : v.toFixed(dec);
      return prefix + s + suffix;
    }

    if (motionOff() || opts.instant) { el.textContent = fmt(to); return; }

    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      el.textContent = fmt(from + (to - from) * easeOutExpo(p));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initCounters(root) {
    root = root || document;
    var els = root.querySelectorAll('[data-count]:not([data-counted])');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.setAttribute('data-counted', '1');
        countUp(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------- Tilt */
  function initTilt(root) {
    root = root || document;
    if (motionOff() || !global.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    root.querySelectorAll('[data-tilt]:not([data-tilt-ready])').forEach(function (el) {
      el.setAttribute('data-tilt-ready', '1');
      el.classList.add('tilt');
      var max = parseFloat(el.getAttribute('data-tilt')) || 7;

      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        el.dataset.tilting = 'true';
        el.style.transform =
          'perspective(900px) rotateX(' + (-py * max).toFixed(2) + 'deg) rotateY(' +
          (px * max).toFixed(2) + 'deg) translateZ(0)';
      });

      el.addEventListener('pointerleave', function () {
        el.dataset.tilting = 'false';
        el.style.transform = '';
      });
    });
  }

  /* --------------------------------------------------------- Parallax */
  var parallaxItems = [];
  var parallaxRAF = null;

  function initParallax(root) {
    root = root || document;
    if (motionOff()) return;
    root.querySelectorAll('[data-parallax]:not([data-parallax-ready])').forEach(function (el) {
      el.setAttribute('data-parallax-ready', '1');
      parallaxItems.push({ el: el, factor: parseFloat(el.getAttribute('data-parallax')) || 0.12 });
    });
    if (parallaxItems.length && !parallaxRAF) {
      var scroller = document.querySelector('.page[style], .page') || global;
      global.addEventListener('scroll', queueParallax, { passive: true });
      if (scroller !== global && scroller.addEventListener) {
        scroller.addEventListener('scroll', queueParallax, { passive: true });
      }
      queueParallax();
    }
  }

  function queueParallax() {
    if (parallaxRAF) return;
    parallaxRAF = requestAnimationFrame(function () {
      parallaxRAF = null;
      var vh = global.innerHeight;
      parallaxItems.forEach(function (item) {
        var r = item.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var centerOffset = (r.top + r.height / 2) - vh / 2;
        item.el.style.transform = 'translate3d(0,' + (-centerOffset * item.factor).toFixed(2) + 'px,0)';
      });
    });
  }

  /* ----------------------------------------------- Pointer-led aurora */
  function initAuroraPointer() {
    if (motionOff()) return;
    var blobs = document.querySelectorAll('.aurora__blob');
    if (!blobs.length) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    global.addEventListener('pointermove', function (e) {
      tx = (e.clientX / global.innerWidth - 0.5) * 42;
      ty = (e.clientY / global.innerHeight - 0.5) * 42;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    function tick() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      blobs.forEach(function (b, i) {
        var d = (i + 1) * 0.5;
        b.style.setProperty('--bx', (cx * d).toFixed(2) + 'px');
        b.style.setProperty('--by', (cy * d).toFixed(2) + 'px');
      });
      raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(tick) : null;
    }
  }

  /* ----------------------------------------------------------- Ripple */
  function initRipple() {
    document.addEventListener('pointerdown', function (e) {
      var host = e.target.closest('.btn, [data-ripple], .fab, .composer__send');
      if (!host || motionOff()) return;
      var r = host.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 1.1;
      var span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (e.clientX - r.left - size / 2) + 'px';
      span.style.top = (e.clientY - r.top - size / 2) + 'px';
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      host.appendChild(span);
      setTimeout(function () { span.remove(); }, 640);
    }, { passive: true });
  }

  /* ------------------------------------------------------ Type-on text */
  function typeInto(el, text, opts) {
    opts = opts || {};
    var speed = opts.speed || 16;
    if (motionOff()) { el.textContent = text; if (opts.done) opts.done(); return function () {}; }

    el.textContent = '';
    el.classList.add('caret');
    var i = 0, timer = null;

    function step() {
      /* Emit 2 characters per tick so long strings stay snappy. */
      i = Math.min(text.length, i + 2);
      el.textContent = text.slice(0, i);
      if (i < text.length) {
        timer = setTimeout(step, speed);
      } else {
        el.classList.remove('caret');
        if (opts.done) opts.done();
      }
    }
    timer = setTimeout(step, opts.delay || 0);
    return function cancel() { clearTimeout(timer); el.classList.remove('caret'); el.textContent = text; };
  }

  /* ------------------------------------------------------ Score rings */
  function drawScoreRing(el, value, opts) {
    opts = opts || {};
    var size = opts.size || 46, stroke = opts.stroke || 4;
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var pct = Math.max(0, Math.min(100, value)) / 100;

    el.classList.add('score-ring');
    el.style.width = el.style.height = size + 'px';
    el.innerHTML =
      '<svg viewBox="0 0 ' + size + ' ' + size + '">' +
        '<defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="var(--brand-400)"/>' +
          '<stop offset="100%" stop-color="var(--cyan-400)"/>' +
        '</linearGradient></defs>' +
        '<circle class="score-ring__track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + stroke + '"/>' +
        '<circle class="score-ring__bar" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + stroke + '" ' +
          'stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + c.toFixed(2) + '"/>' +
      '</svg>' +
      '<span class="score-ring__num">' + Math.round(value) + '</span>';

    var bar = el.querySelector('.score-ring__bar');
    var target = (c * (1 - pct)).toFixed(2);
    if (motionOff()) { bar.style.strokeDashoffset = target; return; }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { bar.style.strokeDashoffset = target; });
    });
  }

  /* ------------------------------------------------------------ Meters */
  function initMeters(root) {
    (root || document).querySelectorAll('.meter__fill[data-value]:not([data-filled])').forEach(function (el) {
      el.setAttribute('data-filled', '1');
      var v = Math.max(0, Math.min(100, parseFloat(el.getAttribute('data-value')) || 0));
      if (motionOff()) { el.style.width = v + '%'; return; }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.style.width = v + '%'; });
      });
    });
  }

  /* ---------------------------------------------------------- Bootstrap */
  function refresh(root) {
    initReveal(root);
    initCounters(root);
    initTilt(root);
    initParallax(root);
    initMeters(root);
  }

  function init() {
    refresh(document);
    initRipple();
    initAuroraPointer();
  }

  global.ACTA = global.ACTA || {};
  global.ACTA.motion = {
    init: init,
    refresh: refresh,
    reveal: initReveal,
    countUp: countUp,
    typeInto: typeInto,
    drawScoreRing: drawScoreRing,
    meters: initMeters,
    get disabled() { return motionOff(); }
  };
})(window);

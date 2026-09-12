/* ==========================================================================
   ACTA — UI shell
   Renders the persistent chrome (aurora, header, tab bar), owns theme and
   motion preferences, and provides toast / sheet / format helpers.
   ========================================================================== */
(function (global) {
  'use strict';

  var icon = global.ACTA.icon;
  var store = global.ACTA.store;

  /* --------------------------------------------------------- Navigation */
  var NAV = [
    { id: 'dashboard',  href: 'dashboard.html',  label: 'Home',     icon: 'home' },
    { id: 'discover',   href: 'discover.html',   label: 'Discover', icon: 'compass' },
    { id: 'monitoring', href: 'monitoring.html', label: 'Monitor',  icon: 'radar' },
    { id: 'approvals',  href: 'approvals.html',  label: 'Approvals',icon: 'shield' },
    { id: 'more',       href: 'more.html',       label: 'More',     icon: 'grid' }
  ];

  /* ------------------------------------------------------------ Format */
  var fmt = {
    inr: function (n, opts) {
      opts = opts || {};
      if (n === 0 && opts.freeLabel) return opts.freeLabel;
      var s = Math.round(Math.abs(n)).toLocaleString('en-IN');
      return (n < 0 ? '−' : '') + '₹' + s;
    },
    compactInr: function (n) {
      if (Math.abs(n) >= 10000000) return '₹' + (n / 10000000).toFixed(1) + 'Cr';
      if (Math.abs(n) >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
      if (Math.abs(n) >= 1000) return '₹' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
      return '₹' + n;
    },
    pct: function (n, dec) {
      var d = dec === undefined ? 1 : dec;
      return (n > 0 ? '+' : '') + n.toFixed(d) + '%';
    },
    ago: function (ts) {
      var s = Math.round((Date.now() - ts) / 1000);
      if (s < 0) return fmt.until(ts);
      if (s < 45) return 'just now';
      if (s < 90) return '1 min ago';
      var m = Math.round(s / 60);
      if (m < 60) return m + ' min ago';
      var h = Math.round(m / 60);
      if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
      var d = Math.round(h / 24);
      if (d < 7) return d + (d === 1 ? ' day ago' : ' days ago');
      return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    },
    until: function (ts) {
      var s = Math.round((ts - Date.now()) / 1000);
      if (s <= 0) return 'now';
      if (s < 60) return 'in ' + s + 's';
      var m = Math.round(s / 60);
      if (m < 60) return 'in ' + m + ' min';
      var h = Math.round(m / 60);
      if (h < 24) return 'in ' + h + 'h';
      return 'in ' + Math.round(h / 24) + 'd';
    },
    time: function (ts) {
      return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    },
    clock: function (ts) {
      return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    },
    title: function (s) { return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  };

  /* Escape untrusted strings before they reach innerHTML. */
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------------------------------------------------- Status vocabulary */
  var STATUS = {
    monitoring:        { label: 'Monitoring',       chip: 'chip--info',   icon: 'radar' },
    awaiting_approval: { label: 'Needs approval',   chip: 'chip--warn',   icon: 'shield' },
    completed:         { label: 'Completed',        chip: 'chip--ok',     icon: 'check' },
    failed:            { label: 'Failed',           chip: 'chip--danger', icon: 'alert' },
    running:           { label: 'Running',          chip: 'chip--brand',  icon: 'bolt' },
    paused:            { label: 'Paused',           chip: '',             icon: 'pause' },
    pending:           { label: 'Pending',          chip: 'chip--warn',   icon: 'clock' },
    approved:          { label: 'Approved',         chip: 'chip--ok',     icon: 'check' },
    rejected:          { label: 'Rejected',         chip: 'chip--danger', icon: 'close' },
    confirmed:         { label: 'Confirmed',        chip: 'chip--ok',     icon: 'check' },
    refunded:          { label: 'Refunded',         chip: 'chip--info',   icon: 'refresh' }
  };
  function status(key) { return STATUS[key] || { label: fmt.title(key), chip: '', icon: 'info' }; }

  /* --------------------------------------------------------- Background */
  function renderAurora() {
    if (document.querySelector('.aurora')) return;
    var el = document.createElement('div');
    el.className = 'aurora';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="aurora__blob aurora__blob--1"></div>' +
      '<div class="aurora__blob aurora__blob--2"></div>' +
      '<div class="aurora__blob aurora__blob--3"></div>' +
      '<div class="aurora__veil"></div>' +
      '<div class="aurora__grain"></div>';
    document.body.prepend(el);
  }

  /* ------------------------------------------------------------- Header */
  function renderHeader(shell, cfg) {
    var header = document.createElement('header');
    header.className = 'app-header';

    var left = cfg.back
      ? '<button class="btn btn--icon btn--quiet" data-back aria-label="Go back">' + icon('arrowLeft') + '</button>'
      : '<a class="brand" href="dashboard.html" aria-label="ACTA home">' +
          '<span class="brand__mark">' + icon('bolt', 'icon--fill') + '</span>' +
          '<span>ACTA</span></a>';

    var title = cfg.title
      ? '<div class="grow" style="min-width:0;text-align:' + (cfg.back ? 'center' : 'left') + '">' +
          '<div class="app-header__title clamp-1">' + esc(cfg.title) + '</div>' +
          (cfg.subtitle ? '<div class="app-header__sub clamp-1">' + esc(cfg.subtitle) + '</div>' : '') +
        '</div>'
      : '<div class="grow"></div>';

    var pending = (store.read('approvals') || []).filter(function (a) { return a.status === 'pending'; }).length;

    var right =
      '<div class="row" style="gap:6px">' +
        '<button class="btn btn--icon btn--quiet" data-theme-toggle aria-label="Switch theme">' + icon('moon') + '</button>' +
        '<a class="btn btn--icon btn--quiet" href="activity.html" aria-label="Agent activity" style="position:relative">' +
          icon('bell') +
          (pending ? '<span class="tab__badge" style="top:6px;right:6px;margin:0">' + pending + '</span>' : '') +
        '</a>' +
      '</div>';

    header.innerHTML = cfg.back ? (left + title + right) : (left + title + right);
    shell.prepend(header);

    header.querySelector('[data-back]') && header.querySelector('[data-back]').addEventListener('click', function () {
      if (history.length > 1) history.back(); else location.href = 'dashboard.html';
    });

    header.querySelector('[data-theme-toggle]').addEventListener('click', toggleTheme);
    syncThemeIcon();

    /* Header gains a frosted backdrop once content scrolls under it. */
    var scroller = document.querySelector('.page');
    var onScroll = function () {
      var y = scroller && scroller.scrollHeight > scroller.clientHeight + 4 && getComputedStyle(scroller).overflowY === 'auto'
        ? scroller.scrollTop : global.scrollY;
      header.setAttribute('data-scrolled', y > 6 ? 'true' : 'false');
    };
    global.addEventListener('scroll', onScroll, { passive: true });
    if (scroller) scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------ Tab bar */
  function renderTabbar(shell, activeId) {
    var pending = (store.read('approvals') || []).filter(function (a) { return a.status === 'pending'; }).length;

    var bar = document.createElement('nav');
    bar.className = 'tabbar';
    bar.setAttribute('aria-label', 'Primary');
    bar.innerHTML = '<div class="tabbar__inner"><span class="tabbar__indicator"></span>' +
      NAV.map(function (n) {
        var current = n.id === activeId;
        return '<a class="tab" href="' + n.href + '" data-nav="' + n.id + '"' +
          (current ? ' aria-current="page"' : '') + '>' +
          icon(n.icon) +
          '<span>' + n.label + '</span>' +
          (n.id === 'approvals' && pending ? '<span class="tab__badge">' + pending + '</span>' : '') +
        '</a>';
      }).join('') + '</div>';

    shell.appendChild(bar);

    /* Slide the glass indicator under the active tab. */
    function placeIndicator() {
      var active = bar.querySelector('.tab[aria-current="page"]') || bar.querySelector('.tab');
      var ind = bar.querySelector('.tabbar__indicator');
      if (!active || !ind) return;
      ind.style.width = active.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + active.offsetLeft + 'px)';
    }
    requestAnimationFrame(placeIndicator);
    global.addEventListener('resize', placeIndicator);

    /* Animate out before navigating so pages cross-fade. */
    bar.querySelectorAll('.tab').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (a.getAttribute('aria-current') === 'page') { e.preventDefault(); return; }
        navigateTo(a.getAttribute('href'), e);
      });
    });
  }

  /**
   * Navigate with the page-out transition.
   * When motion is off and the click came from a real link, we simply let the
   * browser follow it; called without an event, we navigate directly.
   */
  function navigateTo(href, e) {
    if (!href) return;
    if (global.ACTA.motion.disabled) {
      if (!e) location.href = href;
      return;
    }
    if (e) e.preventDefault();
    document.body.setAttribute('data-leaving', 'true');
    setTimeout(function () { location.href = href; }, 170);
  }

  /* -------------------------------------------------------------- Theme */
  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    syncThemeIcon();
    setTimeout(function () { global.ACTA.charts && global.ACTA.charts.redrawAll(); }, 60);
  }

  function currentTheme() {
    var t = store.read('prefs.theme') || 'dark';
    if (t !== 'system') return t;
    return global.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function toggleTheme() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    store.set('prefs.theme', next);
    applyTheme(next);
    toast(next === 'dark' ? 'Dark theme' : 'Light theme', { icon: next === 'dark' ? 'moon' : 'sun' });
  }

  function syncThemeIcon() {
    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    btn.innerHTML = icon(currentTheme() === 'dark' ? 'sun' : 'moon');
  }

  function applyMotion() {
    document.documentElement.setAttribute('data-motion', store.read('prefs.motion') || 'on');
  }

  function applyPerf() {
    var pref = store.read('prefs.perf') || 'auto';
    var lite = pref === 'lite';
    if (pref === 'auto') {
      /* Cheap heuristic: few cores or a small slow device gets lighter blur. */
      var cores = navigator.hardwareConcurrency || 4;
      var mem = navigator.deviceMemory || 4;
      lite = cores <= 4 && mem <= 4;
    }
    document.documentElement.setAttribute('data-perf', lite ? 'lite' : 'full');
  }

  /* ------------------------------------------------------------- Toasts */
  function toastHost() {
    var host = document.querySelector('.toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'toast-host';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    return host;
  }

  function toast(message, opts) {
    opts = opts || {};
    var host = toastHost();
    var el = document.createElement('div');
    el.className = 'toast glass-3 glass--edge' + (opts.tone ? ' toast--' + opts.tone : '');
    el.innerHTML = icon(opts.icon || (opts.tone === 'danger' ? 'alert' : opts.tone === 'ok' ? 'check' : 'info')) +
                   '<span class="grow">' + esc(message) + '</span>';
    host.appendChild(el);

    var life = opts.duration || 2600;
    setTimeout(function () {
      el.setAttribute('data-leaving', 'true');
      setTimeout(function () { el.remove(); }, 320);
    }, life);
    return el;
  }

  /* -------------------------------------------------------------- Sheet */
  var openSheet = null;

  function sheet(opts) {
    closeSheet();

    var scrim = document.createElement('div');
    scrim.className = 'scrim';

    var el = document.createElement('div');
    el.className = 'sheet glass-3 glass--edge glass--frost';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML =
      '<div class="sheet__grip"></div>' +
      (opts.title ? '<div class="row-between" style="margin-bottom:var(--s-3)">' +
        '<h3 class="sheet__title">' + esc(opts.title) + '</h3>' +
        '<button class="btn btn--icon btn--quiet" data-close aria-label="Close">' + icon('close') + '</button></div>' : '') +
      '<div class="sheet__body">' + (opts.html || '') + '</div>';

    document.body.appendChild(scrim);
    document.body.appendChild(el);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(function () {
      scrim.setAttribute('data-open', 'true');
      el.setAttribute('data-open', 'true');
      global.ACTA.motion.refresh(el);
    });

    scrim.addEventListener('click', closeSheet);
    var closeBtn = el.querySelector('[data-close]');
    if (closeBtn) closeBtn.addEventListener('click', closeSheet);
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-sheet-close]')) closeSheet();
    });

    attachSwipeToDismiss(el);
    openSheet = { el: el, scrim: scrim, onClose: opts.onClose };
    if (opts.onOpen) opts.onOpen(el);
    return el;
  }

  /* Drag the sheet down past a threshold to dismiss — expected on mobile. */
  function attachSwipeToDismiss(el) {
    var startY = 0, dy = 0, dragging = false;

    el.addEventListener('touchstart', function (e) {
      if (el.scrollTop > 0) return;
      dragging = true;
      startY = e.touches[0].clientY;
      el.style.transition = 'none';
    }, { passive: true });

    el.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      dy = e.touches[0].clientY - startY;
      if (dy < 0) dy = 0;
      el.style.transform = 'translate(-50%, ' + dy + 'px)';
    }, { passive: true });

    el.addEventListener('touchend', function () {
      if (!dragging) return;
      dragging = false;
      el.style.transition = '';
      el.style.transform = '';
      if (dy > 110) closeSheet();
      dy = 0;
    });
  }

  function closeSheet() {
    if (!openSheet) return;
    var ref = openSheet;
    openSheet = null;
    ref.el.setAttribute('data-open', 'false');
    ref.el.style.transform = '';
    ref.scrim.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    setTimeout(function () {
      ref.el.remove();
      ref.scrim.remove();
      if (ref.onClose) ref.onClose();
    }, 340);
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  /* ------------------------------------------------- Segmented control */
  function segmented(el, onChange) {
    var buttons = Array.prototype.slice.call(el.querySelectorAll('button'));
    var thumb = el.querySelector('.segmented__thumb');
    if (!thumb) {
      thumb = document.createElement('span');
      thumb.className = 'segmented__thumb';
      el.prepend(thumb);
    }

    function place() {
      var active = el.querySelector('button[aria-selected="true"]') || buttons[0];
      if (!active) return;
      thumb.style.width = active.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + (active.offsetLeft - 4) + 'px)';
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        buttons.forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
        place();
        if (onChange) onChange(b.dataset.value, b);
      });
    });

    if (!el.querySelector('button[aria-selected="true"]') && buttons[0]) {
      buttons[0].setAttribute('aria-selected', 'true');
    }
    requestAnimationFrame(place);
    global.addEventListener('resize', place);
    return { place: place };
  }

  /* ------------------------------------------------------------ Switch */
  function bindSwitches(root) {
    (root || document).querySelectorAll('.switch:not([data-bound])').forEach(function (sw) {
      sw.setAttribute('data-bound', '1');
      sw.setAttribute('role', 'switch');
      sw.setAttribute('tabindex', '0');
      var toggle = function () {
        var next = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', String(next));
        sw.dispatchEvent(new CustomEvent('switch:change', { detail: { checked: next }, bubbles: true }));
        haptic();
      };
      sw.addEventListener('click', toggle);
      sw.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
      });
    });
  }

  function haptic(ms) {
    if (navigator.vibrate && !global.ACTA.motion.disabled) {
      try { navigator.vibrate(ms || 8); } catch (e) {}
    }
  }

  /* ------------------------------------------------------------- Splash */
  function renderSplash() {
    if (sessionStorage.getItem('acta.splash') === 'seen') return;
    sessionStorage.setItem('acta.splash', 'seen');
    var s = document.createElement('div');
    s.className = 'splash';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<span class="brand__mark">' + icon('bolt', 'icon--fill') + '</span>';
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 1400);
  }

  /* ---------------------------------------------------------- Bootstrap */
  function mount(cfg) {
    cfg = cfg || {};
    store.seed(global.ACTA.data.seed);

    applyTheme(store.read('prefs.theme') || 'dark');
    applyMotion();
    applyPerf();

    renderAurora();

    var shell = document.querySelector('.shell');
    if (shell && cfg.chrome !== false) {
      renderHeader(shell, cfg);
      renderTabbar(shell, cfg.nav);
    }

    /* Route every in-app link through the page transition. */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || a.dataset.noTransition !== undefined) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank' || /^https?:|^mailto:|^tel:/.test(href)) return;
      if (a.closest('.tabbar')) return; /* already handled */
      navigateTo(href, e);
    });

    global.ACTA.motion.init();
    bindSwitches(document);
    if (cfg.splash !== false) renderSplash();
  }

  global.ACTA = global.ACTA || {};
  global.ACTA.ui = {
    mount: mount,
    NAV: NAV,
    fmt: fmt,
    esc: esc,
    status: status,
    toast: toast,
    sheet: sheet,
    closeSheet: closeSheet,
    segmented: segmented,
    bindSwitches: bindSwitches,
    haptic: haptic,
    applyTheme: applyTheme,
    applyMotion: applyMotion,
    applyPerf: applyPerf,
    currentTheme: currentTheme,
    navigateTo: navigateTo
  };
})(window);

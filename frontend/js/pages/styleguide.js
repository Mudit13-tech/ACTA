/* ==========================================================================
   ACTA — Design system page
   ========================================================================== */
(function () {
  'use strict';

  var A = window.ACTA;
  var icon = A.icon, esc = A.ui.esc, store = A.store;

  A.ui.applyTheme(store.read('prefs.theme') || 'dark');
  A.ui.applyMotion();
  A.ui.applyPerf();

  var aurora = document.createElement('div');
  aurora.className = 'aurora';
  aurora.setAttribute('aria-hidden', 'true');
  aurora.innerHTML = '<div class="aurora__blob aurora__blob--1"></div>' +
                     '<div class="aurora__blob aurora__blob--2"></div>' +
                     '<div class="aurora__blob aurora__blob--3"></div>' +
                     '<div class="aurora__veil"></div><div class="aurora__grain"></div>';
  document.body.prepend(aurora);

  document.querySelectorAll('[data-icon]').forEach(function (el) {
    el.insertAdjacentHTML('beforeend', icon(el.getAttribute('data-icon'), 'icon--fill'));
  });

  var themeBtn = document.querySelector('[data-theme-toggle]');
  function paint() { themeBtn.innerHTML = icon(A.ui.currentTheme() === 'dark' ? 'sun' : 'moon'); }
  paint();
  themeBtn.addEventListener('click', function () {
    var next = A.ui.currentTheme() === 'dark' ? 'light' : 'dark';
    store.set('prefs.theme', next);
    A.ui.applyTheme(next);
    paint();
  });

  window.addEventListener('scroll', function () {
    document.getElementById('siteHeader').setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
  }, { passive: true });

  /* ------------------------------------------------------------- Colour */
  function swatches(host, list) {
    document.getElementById(host).innerHTML = list.map(function (v) {
      return '<div class="swatch glass" data-reveal="scale">' +
        '<div class="swatch__chip" style="background:var(' + v + ')"></div>' +
        '<div class="swatch__meta"><b>' + esc(v.replace('--', '')) + '</b>' +
        '<span>var(' + esc(v) + ')</span></div>' +
      '</div>';
    }).join('');
  }

  swatches('swatchBrand', ['--brand-300', '--brand-400', '--brand-500', '--brand-600',
                           '--cyan-300', '--cyan-400', '--cyan-500', '--violet-400', '--pink-400']);
  swatches('swatchState', ['--ok-400', '--warn-400', '--danger-400', '--info-400',
                           '--bg', '--bg-2', '--text', '--text-mute']);

  /* --------------------------------------------------------------- Type */
  var TYPE = [
    ['--t-3xl', 'display', 'Tell the agent what you want'],
    ['--t-2xl', 'display', 'Eight stages, one engine'],
    ['--t-xl',  'display', 'Approval required'],
    ['--t-lg',  'display', 'Casa Del Mar, Candolim'],
    ['--t-md',  '',        'Booking prepared for your review'],
    ['--t-base','',        'The agent never infers permission from intent alone.'],
    ['--t-sm',  '',        'Free cancellation until 14 Sep · sea-view deluxe'],
    ['--t-xs',  '',        'idempotency_key=act-311-91cd'],
    ['--t-2xs', 'eyebrow', 'Action states']
  ];

  document.getElementById('typeScale').innerHTML = TYPE.map(function (t) {
    var cls = t[1] === 'display' ? 'display w-600' : t[1] === 'eyebrow' ? 'eyebrow' : '';
    return '<div class="type-row" data-reveal="left">' +
      '<small>font-size: var(' + esc(t[0]) + ')</small>' +
      '<div class="' + cls + '" style="font-size:var(' + t[0] + ');line-height:1.2">' + esc(t[2]) + '</div>' +
    '</div>';
  }).join('');

  /* -------------------------------------------------------------- Glass */
  var GLASS = [
    ['glass', 'Level 1', 'Base pane — lists, rows, quiet cards'],
    ['glass-2 glass--edge', 'Level 2', 'Raised — hero cards, approvals'],
    ['glass-3 glass--edge glass--sheen', 'Level 3', 'Floating — sheets, toasts'],
    ['glass glass--edge glass--tint-brand', 'Tint brand', 'Wash of colour through the pane'],
    ['glass glass--edge glass--tint-warn', 'Tint warn', 'Policy held this back'],
    ['glass glass--edge glass--tint-ok', 'Tint ok', 'Verified outcome']
  ];

  document.getElementById('glassDemo').innerHTML = GLASS.map(function (g) {
    return '<div class="demo-box ' + g[0] + '" data-reveal="scale">' +
      '<b class="w-600" style="display:block;font-size:var(--t-sm)">' + esc(g[1]) + '</b>' +
      '<span class="mute" style="font-size:var(--t-2xs)">' + esc(g[2]) + '</span>' +
    '</div>';
  }).join('');

  /* ------------------------------------------------------ Space & radius */
  document.getElementById('spaceDemo').innerHTML = [1,2,3,4,5,6,7,8,9].map(function (n) {
    return '<div class="row" data-reveal="left">' +
      '<span class="mono t-2xs faint" style="width:60px">--s-' + n + '</span>' +
      '<span class="space-bar" style="width:var(--s-' + n + ')"></span>' +
    '</div>';
  }).join('');

  document.getElementById('radiusDemo').innerHTML =
    ['xs','sm','md','lg','xl','2xl','pill'].map(function (r) {
      return '<div class="radius-box" style="border-radius:var(--r-' + r + ')" data-reveal="scale">--r-' + r + '</div>';
    }).join('');

  /* --------------------------------------------------------- Components */
  document.getElementById('componentDemo').innerHTML =
    block('Buttons',
      '<div class="row wrap" style="gap:var(--s-2)">' +
        '<button class="btn btn--primary">Approve &amp; execute</button>' +
        '<button class="btn">Change</button>' +
        '<button class="btn btn--ghost">Ghost</button>' +
        '<button class="btn btn--danger">Reject</button>' +
        '<button class="btn btn--sm">Small</button>' +
        '<button class="btn btn--icon">' + icon('more') + '</button>' +
        '<button class="btn" disabled>Disabled</button>' +
      '</div>') +

    block('Chips &amp; status',
      '<div class="row wrap" style="gap:6px">' +
        '<span class="chip chip--active">Best match</span>' +
        '<span class="chip">Neutral</span>' +
        '<span class="chip chip--ok"><span class="dot"></span>Confirmed</span>' +
        '<span class="chip chip--warn"><span class="dot"></span>Needs approval</span>' +
        '<span class="chip chip--danger"><span class="dot"></span>Failed</span>' +
        '<span class="chip chip--info"><span class="dot"></span>Monitoring</span>' +
        '<span class="chip"><span class="pulse-dot"></span>Live</span>' +
      '</div>') +

    block('Inputs',
      '<div class="stack">' +
        '<div class="field"><label class="field__label">Text</label>' +
        '<input class="input" placeholder="Tell the agent what you want…"></div>' +
        '<div class="field"><label class="field__label">Range</label>' +
        '<input class="range" type="range" min="0" max="100" value="42"></div>' +
        '<div class="row-between"><span class="t-sm">Switch</span>' +
        '<button class="switch" aria-checked="true"></button></div>' +
        '<div class="segmented" id="sgSeg">' +
          '<button data-value="a" aria-selected="true">Pending</button>' +
          '<button data-value="b">Decided</button>' +
          '<button data-value="c">All</button>' +
        '</div>' +
      '</div>') +

    block('Feedback',
      '<div class="stack">' +
        '<div class="meter"><span class="meter__fill" data-value="72"></span></div>' +
        '<div class="meter meter--warn"><span class="meter__fill" data-value="38"></span></div>' +
        '<div class="row" style="gap:var(--s-4);align-items:center">' +
          '<div data-score="96"></div><div data-score="72"></div>' +
          '<span class="spinner"></span>' +
          '<div class="skeleton" style="height:12px;flex:1"></div>' +
        '</div>' +
        '<div class="pipeline">' +
          '<span class="pipeline__step" data-state="done"></span>' +
          '<span class="pipeline__step" data-state="done"></span>' +
          '<span class="pipeline__step" data-state="active"></span>' +
          '<span class="pipeline__step"></span>' +
          '<span class="pipeline__step"></span>' +
        '</div>' +
        '<div class="row wrap" style="gap:var(--s-2)">' +
          '<button class="btn btn--sm" data-toast="ok">Toast: success</button>' +
          '<button class="btn btn--sm" data-toast="warn">Toast: warning</button>' +
          '<button class="btn btn--sm" data-sheet>Open a sheet</button>' +
        '</div>' +
      '</div>') +

    block('Timeline',
      '<ul class="timeline">' +
        '<li class="tl-item tl-item--done"><div class="tl-item__title">Parsed the goal</div>' +
        '<div class="tl-item__body">Budget ₹15,000 · 3 nights · rating ≥ 4.2</div></li>' +
        '<li class="tl-item tl-item--done"><div class="tl-item__title">Ranked 3 candidates</div>' +
        '<div class="tl-item__body">Leader scored 96</div></li>' +
        '<li class="tl-item tl-item--active"><div class="tl-item__title">Preparing the action</div>' +
        '<div class="tl-item__body">Nothing is committed yet</div></li>' +
        '<li class="tl-item tl-item--wait"><div class="tl-item__title">Waiting on your approval</div>' +
        '<div class="tl-item__body">Above the auto-spend limit</div></li>' +
      '</ul>');

  function block(title, body) {
    return '<div data-reveal>' +
      '<div class="eyebrow" style="margin-bottom:var(--s-3)">' + title + '</div>' +
      '<div class="glass glass--edge pad">' + body + '</div>' +
    '</div>';
  }

  A.ui.segmented(document.getElementById('sgSeg'));
  A.ui.bindSwitches(document);
  A.views.hydrateScores(document);

  document.getElementById('componentDemo').addEventListener('click', function (e) {
    var t = e.target.closest('[data-toast]');
    if (t) {
      var tone = t.getAttribute('data-toast');
      A.ui.toast(tone === 'ok' ? 'Executed successfully' : 'Above your auto-spend limit', { tone: tone });
      return;
    }
    if (e.target.closest('[data-sheet]')) {
      A.ui.sheet({
        title: 'Bottom sheet',
        html: '<p class="t-sm soft" style="margin-bottom:var(--s-4)">' +
                'Sheets carry the heaviest glass level, drag to dismiss on touch, and close on Escape or a scrim tap.' +
              '</p>' +
              '<button class="btn btn--primary btn--block" data-sheet-close>Close</button>'
      });
    }
  });

  /* -------------------------------------------------------------- Icons */
  document.getElementById('iconGrid').innerHTML =
    '<div class="swatches">' +
      A.iconNames.map(function (n) {
        return '<div class="center" style="padding:10px 4px" data-reveal="scale">' +
          '<span style="color:var(--accent);display:inline-block">' + icon(n) + '</span>' +
          '<div class="mono" style="font-size:9px;color:var(--text-faint);margin-top:6px">' + esc(n) + '</div>' +
        '</div>';
      }).join('') +
    '</div>';

  /* ------------------------------------------------------------- Motion */
  var EASINGS = [
    ['--e-out', 'Expo-out — the house curve for anything entering'],
    ['--e-spring', 'Spring — taps, toggles, the tab indicator'],
    ['--e-in-out', 'In-out — ambient loops and drifting blobs'],
    ['--e-soft', 'Soft — exits and dismissals']
  ];

  document.getElementById('motionDemo').innerHTML =
    EASINGS.map(function (e, i) {
      return '<div data-reveal="left">' +
        '<div class="row-between t-xs" style="margin-bottom:8px">' +
          '<span class="mono faint">var(' + esc(e[0]) + ')</span>' +
          '<span class="mute">' + esc(e[1]) + '</span>' +
        '</div>' +
        '<div class="ease-track"><span class="ease-dot" data-ease="' + i + '" style="left:0;transition:left 900ms var(' + e[0] + ')"></span></div>' +
      '</div>';
    }).join('') +
    '<button class="btn btn--primary btn--block" id="playEase" style="margin-top:var(--s-3)">Play the easings</button>' +
    '<p class="t-2xs faint">Distance scales with element size: chips travel 8px, cards 18px, heroes 28px. ' +
      'Anything the user triggers responds within 200ms.</p>';

  document.getElementById('playEase').addEventListener('click', function () {
    var dots = document.querySelectorAll('.ease-dot');
    dots.forEach(function (d) { d.style.left = '0'; });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        dots.forEach(function (d) { d.style.left = 'calc(100% - 18px)'; });
      });
    });
  });

  A.motion.init();
})();

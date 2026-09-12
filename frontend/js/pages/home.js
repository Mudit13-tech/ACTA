/* ==========================================================================
   ACTA — Landing page
   ========================================================================== */
(function () {
  'use strict';

  var A = window.ACTA;
  var icon = A.icon, esc = A.ui.esc, store = A.store;

  /* Theme + motion prefs without the app chrome. */
  A.ui.applyTheme(store.read('prefs.theme') || 'dark');
  A.ui.applyMotion();
  A.ui.applyPerf();

  /* Aurora background */
  var aurora = document.createElement('div');
  aurora.className = 'aurora';
  aurora.setAttribute('aria-hidden', 'true');
  aurora.innerHTML = '<div class="aurora__blob aurora__blob--1"></div>' +
                     '<div class="aurora__blob aurora__blob--2"></div>' +
                     '<div class="aurora__blob aurora__blob--3"></div>' +
                     '<div class="aurora__veil"></div><div class="aurora__grain"></div>';
  document.body.prepend(aurora);

  /* Fill every data-icon placeholder. */
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    el.insertAdjacentHTML('beforeend', icon(el.getAttribute('data-icon'), 'icon--fill'));
  });

  /* Theme toggle */
  var themeBtn = document.querySelector('[data-theme-toggle]');
  function paintThemeBtn() { themeBtn.innerHTML = icon(A.ui.currentTheme() === 'dark' ? 'sun' : 'moon'); }
  paintThemeBtn();
  themeBtn.addEventListener('click', function () {
    var next = A.ui.currentTheme() === 'dark' ? 'light' : 'dark';
    store.set('prefs.theme', next);
    A.ui.applyTheme(next);
    paintThemeBtn();
  });

  /* Sticky header state */
  var header = document.getElementById('siteHeader');
  window.addEventListener('scroll', function () {
    header.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
  }, { passive: true });

  /* Scroll progress bar — fallback for browsers without scroll timelines. */
  var bar = document.getElementById('scrollProgress');
  if (!CSS.supports('animation-timeline: scroll()')) {
    window.addEventListener('scroll', function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    }, { passive: true });
  }

  /* ------------------------------------------------- Device preview loop */
  var previewFrames = [
    function () {
      return '<div class="mini mini--head"><span>Command Center</span><span class="pulse-dot"></span></div>' +
        '<div class="mini glass"><div class="mini__label">New task</div>' +
        '<div style="margin-top:6px;font-size:11px" id="typedGoal"></div></div>' +
        '<div class="mini glass"><div class="mini__label">Planning</div>' +
        '<div class="mini__bars"><i class="on"></i><i class="now"></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div style="margin-top:7px;font-size:10px;color:var(--text-mute)">Parsed the goal · 96% confidence</div></div>' +
        '<div class="mini__cta">Agent is working…</div>';
    },
    function () {
      return '<div class="mini mini--head"><span>Candidates</span><span style="font-size:10px;color:var(--text-mute)">3 found</span></div>' +
        '<div class="mini glass"><div class="mini__row"><span class="mini__emoji">🏖️</span>' +
        '<div style="flex:1"><div style="font-weight:600">Casa Del Mar</div>' +
        '<div style="font-size:10px;color:var(--text-mute)">₹13,200 · free cancel</div></div>' +
        '<b style="color:var(--cyan-400)">96</b></div></div>' +
        '<div class="mini glass"><div class="mini__row"><span class="mini__emoji">🌴</span>' +
        '<div style="flex:1"><div style="font-weight:600">Palm Grove</div>' +
        '<div style="font-size:10px;color:var(--text-mute)">₹14,850</div></div>' +
        '<b style="color:var(--text-mute)">87</b></div></div>' +
        '<div class="mini glass"><div class="mini__row"><span class="mini__emoji">🏨</span>' +
        '<div style="flex:1"><div style="font-weight:600">The Sandbar</div>' +
        '<div style="font-size:10px;color:var(--danger-400)">non-refundable</div></div>' +
        '<b style="color:var(--text-mute)">72</b></div></div>' +
        '<div class="mini__cta">Ranked by your weights</div>';
    },
    function () {
      return '<div class="mini mini--head"><span>Approval needed</span><span class="pulse-dot pulse-dot--warn"></span></div>' +
        '<div class="mini glass" style="text-align:center;padding:14px">' +
        '<div class="mini__label">Amount</div>' +
        '<div style="font-family:var(--font-display);font-size:22px;font-weight:600;margin-top:2px">₹13,200</div>' +
        '<div style="font-size:10px;color:var(--warn-400);margin-top:6px">Above your ₹2,000 auto-spend limit</div></div>' +
        '<div class="mini glass" style="font-size:10px;color:var(--text-mute)">' +
        'Score 96 cleared the 90 threshold. Free cancellation until 14 Sep.</div>' +
        '<div class="mini__cta">Approve action</div>';
    },
    function () {
      return '<div class="mini mini--head"><span>Verified</span><span style="color:var(--ok-400)">✓</span></div>' +
        '<div class="mini glass" style="text-align:center;padding:16px">' +
        '<div style="font-size:28px">🏖️</div>' +
        '<div style="font-weight:600;margin-top:6px">Booking confirmed</div>' +
        '<div style="font-size:10px;color:var(--text-mute);margin-top:3px">ref ST-44190 · verified with provider</div></div>' +
        '<div class="mini glass" style="font-size:10px;color:var(--text-mute)">' +
        'Outcome and preferences saved for the next run.</div>' +
        '<div class="mini__cta" style="background:linear-gradient(120deg,var(--ok-500),var(--cyan-500))">Executed successfully</div>';
    }
  ];

  var screen = document.getElementById('devicePreview');
  var frame = 0;

  function showFrame(i) {
    screen.innerHTML = previewFrames[i]();
    screen.querySelectorAll('.mini.glass').forEach(function (el, n) {
      el.classList.add('item-in');
      el.style.animationDelay = (n * 70) + 'ms';
    });
    if (i === 0) {
      var t = document.getElementById('typedGoal');
      if (t) A.motion.typeInto(t, 'Find a well-rated Goa hotel under ₹15,000 for 3 nights, near the beach.', { speed: 18 });
    }
  }

  showFrame(0);
  if (!A.motion.disabled) {
    setInterval(function () {
      frame = (frame + 1) % previewFrames.length;
      showFrame(frame);
    }, 4200);
  }

  /* ------------------------------------------------------------ Marquee */
  var marqueeItems = [
    'Natural-language goals', 'Live candidate discovery', 'Normalised comparison',
    'Transparent scoring', 'Price monitoring', 'Human-in-the-loop approvals',
    'Idempotent actions', 'Verified outcomes', 'Immutable audit trail',
    'Policy-gated autonomy', 'Connector tool contracts'
  ];
  var track = document.getElementById('marqueeTrack');
  var chips = marqueeItems.map(function (m) { return '<span class="chip">' + esc(m) + '</span>'; }).join('');
  track.innerHTML = chips + chips; /* duplicated for a seamless -50% loop */

  /* -------------------------------------------------------- Loop stages */
  document.getElementById('loopGrid').innerHTML = A.data.STAGES.map(function (s, i) {
    return '<li class="loop-card glass glass--edge" data-reveal>' +
      '<span class="loop-card__n">' + (i + 1) + '</span>' +
      '<div><h4>' + esc(s.label) + '</h4><p>' + esc(s.blurb) + '</p></div>' +
    '</li>';
  }).join('');

  /* ---------------------------------------------------------- Verticals */
  var FLOWS = {
    shopping:    ['Search', 'Compare', 'Score', 'Monitor', 'Prepare checkout', 'Approval', 'Purchase'],
    travel:      ['Search', 'Compare', 'Check policy', 'Reserve', 'Verify'],
    reservation: ['Search', 'Availability', 'Rank', 'Reserve', 'Verify']
  };

  document.getElementById('verticalGrid').innerHTML = A.data.VERTICALS.map(function (v) {
    var tone = A.views.VERTICAL_TONE[v.id];
    return '<article class="vertical-card glass-2 glass--edge" data-reveal data-tilt="5">' +
      '<div class="vertical-card__top">' +
        '<span class="icon-tile icon-tile--' + tone + '">' + icon(v.icon) + '</span>' +
        '<div><h3>' + esc(v.label) + '</h3>' +
        '<span class="t-2xs mute">Action depth: ' + esc(v.depth) + '</span></div>' +
      '</div>' +
      '<p class="t-sm soft">' + esc(v.blurb) + '</p>' +
      '<div class="vertical-card__example">“' + esc(v.example) + '”</div>' +
      '<div class="vertical-card__flow">' +
        FLOWS[v.id].map(function (f) { return '<span class="chip chip--sm">' + esc(f) + '</span>'; }).join('') +
      '</div>' +
    '</article>';
  }).join('');

  /* ------------------------------------------------------- Architecture */
  var NODES = [
    { label: 'USER / GOAL',   c1: '#3b82f6', c2: '#6366f1' },
    { label: 'AI PLANNER',    c1: '#14b8a6', c2: '#22d3ee' },
    { label: 'TASK ENGINE',   c1: '#10b981', c2: '#34d399' },
    { label: 'TOOLS API/WEB', c1: '#f59e0b', c2: '#fbbf24' },
    { label: 'DECISION',      c1: '#6366f1', c2: '#818cf8' },
    { label: 'POLICY+ACTION', c1: '#ef4444', c2: '#fb7185' }
  ];
  document.getElementById('archRow').innerHTML = NODES.map(function (n, i) {
    return '<div class="arch__node" style="background:linear-gradient(135deg,' + n.c1 + ',' + n.c2 + ');--reveal-delay:' + (i * 70) + 'ms" data-reveal="scale">' +
      esc(n.label) + '</div>';
  }).join('');

  var LAYERS = [
    ['Frontend', 'Task entry, live dashboard, approvals, monitoring, order history, charts, notifications.'],
    ['API / Orchestration', 'Auth, task lifecycle, agent sessions, tool registry, policy checks, audit events.'],
    ['Agent planner', 'Goal parsing, task decomposition, choosing tools, deciding next steps.'],
    ['Tool layer', 'Search, fetch, browser interaction, travel APIs, product data, reservation and payment services.'],
    ['Decision engine', 'Scoring, ranking, constraints, price and availability logic, confidence.'],
    ['Action engine', 'Form filling, checkout preparation, reservation, cancellation, purchase execution.'],
    ['Verification', 'Confirmation checks, state polling, webhooks, idempotency, failure recovery.'],
    ['Data / infra', 'PostgreSQL, Redis/BullMQ, object storage, logs, metrics, Docker deployment.']
  ];
  document.getElementById('layerList').innerHTML = LAYERS.map(function (l) {
    return '<div class="layer-row glass" data-reveal="left"><b>' + esc(l[0]) + '</b><span>' + esc(l[1]) + '</span></div>';
  }).join('');

  /* -------------------------------------------------------------- Policy */
  var POLICIES = [
    ['tag',      'Spend limit',  'Auto-buy up to ₹2,000; ask above ₹2,000.'],
    ['grid',     'Category',     'Groceries allowed; electronics require approval.'],
    ['bolt',     'Action type',  'Free cancellation may be autonomous; paid cancellation asks.'],
    ['shield',   'Vendor',       'Only providers on the user-approved connector list.'],
    ['clock',    'Timing',       'Never act outside the configured time window.'],
    ['lock',     'Data access',  'Saved profile data is used only for approved tasks.'],
    ['alert',    'Escalation',   'Low confidence or an unexpected page change stops the run.']
  ];
  document.getElementById('policyGrid').innerHTML = POLICIES.map(function (p) {
    return '<div class="policy-card glass glass--edge" data-reveal>' +
      '<span class="icon-tile icon-tile--warn">' + icon(p[0]) + '</span>' +
      '<div><b>' + esc(p[1]) + '</b><p>' + esc(p[2]) + '</p></div>' +
    '</div>';
  }).join('');

  var STATES = ['PLANNED', 'READY', 'APPROVAL_REQUIRED', 'APPROVED', 'EXECUTING', 'VERIFYING', 'COMPLETED'];
  document.getElementById('statesFlow').innerHTML = STATES.map(function (s, i) {
    return '<span>' + s + '</span>' + (i < STATES.length - 1 ? '<i>→</i>' : '');
  }).join('');

  /* Smooth in-page anchors without the page-transition handler intercepting */
  document.querySelectorAll('.site-nav a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var t = document.querySelector(a.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: A.motion.disabled ? 'auto' : 'smooth', block: 'start' });
    });
  });

  A.motion.init();
})();

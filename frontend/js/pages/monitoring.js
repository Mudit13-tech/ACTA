/* ==========================================================================
   ACTA — Monitoring
   Conditions the agent is watching, their progress toward the trigger, and
   a live tick so the page visibly stays awake.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.ACTA;
  var icon = A.icon, esc = A.ui.esc, fmt = A.ui.fmt, store = A.store, views = A.views;

  A.ui.mount({ nav: 'monitoring', title: 'Monitoring', subtitle: 'What the agent is watching' });

  var monitors = store.read('monitors') || [];

  /* ------------------------------------------------------------ Summary */
  function renderSummary() {
    var active = monitors.filter(function (m) { return m.active; });
    var met = active.filter(function (m) { return m.current <= m.target; });
    var saved = monitors.reduce(function (s, m) { return s + Math.max(0, m.start - m.current); }, 0);

    document.getElementById('monitorSummary').innerHTML =
      '<div class="glass-2 glass--edge pad" data-reveal="scale">' +
        '<div class="row-between" style="margin-bottom:var(--s-4)">' +
          '<div>' +
            '<div class="eyebrow">Tracked savings</div>' +
            '<div class="display t-2xl w-600 tnum" data-count="' + saved + '" data-count-prefix="₹">0</div>' +
          '</div>' +
          '<span class="icon-tile icon-tile--ok breathe">' + icon('trend') + '</span>' +
        '</div>' +
        '<div class="row" style="gap:var(--s-3)">' +
          summaryPill(active.length, 'active', 'cyan') +
          summaryPill(met.length, 'conditions met', met.length ? 'ok' : 'brand') +
          summaryPill(monitors.length - active.length, 'paused', 'warn') +
        '</div>' +
      '</div>';
  }

  function summaryPill(n, label, tone) {
    return '<div class="well pad-sm grow center">' +
      '<div class="display t-lg w-600 tnum" style="color:var(--' +
        (tone === 'ok' ? 'ok-400' : tone === 'warn' ? 'warn-400' : tone === 'cyan' ? 'cyan-400' : 'brand-300') + ')">' + n + '</div>' +
      '<div class="t-2xs mute">' + esc(label) + '</div>' +
    '</div>';
  }

  /* --------------------------------------------------------------- Head */
  document.getElementById('monitorHead').innerHTML =
    '<div class="row-between" data-reveal>' +
      '<div>' +
        '<h2 class="t-xl">Monitors</h2>' +
        '<p class="t-sm mute" style="margin-top:4px">Re-checked on a schedule until the condition is true or the task expires.</p>' +
      '</div>' +
    '</div>';

  /* --------------------------------------------------------------- List */
  function renderList() {
    var host = document.getElementById('monitorList');

    if (!monitors.length) {
      host.innerHTML = views.empty('radar', 'Nothing is being watched',
        'Ask the agent to watch a price or availability and it will check on a schedule.',
        '<a class="btn btn--primary" href="dashboard.html">Create a task</a>');
      A.motion.refresh(host);
      return;
    }

    host.innerHTML =
      views.sectionHead('Watch list') +
      '<div class="stack">' + monitors.map(views.monitorCard).join('') + '</div>' +
      '<p class="t-2xs faint" style="margin-top:var(--s-4)">' +
        'When a condition becomes true the agent prepares the action and applies your policy — it does not buy silently.' +
      '</p>';

    /* Sparklines + meters */
    monitors.forEach(function (m) {
      var canvas = host.querySelector('[data-spark="' + m.id + '"]');
      if (canvas && m.history) A.charts.sparkline(canvas, m.history, { height: 34 });
    });

    A.ui.bindSwitches(host);
    A.motion.refresh(host);
  }

  /* Toggle a monitor on or off */
  document.getElementById('monitorList').addEventListener('switch:change', function (e) {
    var sw = e.target.closest('[data-monitor-toggle]');
    if (!sw) return;
    var id = sw.getAttribute('data-monitor-toggle');
    var active = e.detail.checked;

    store.patchIn('monitors', id, { active: active });
    var m = monitors.find(function (x) { return x.id === id; });
    if (m) m.active = active;

    A.ui.toast(active ? 'Monitor resumed' : 'Monitor paused', { tone: active ? 'ok' : 'warn', icon: active ? 'play' : 'pause' });
    renderSummary();
    A.motion.refresh(document.getElementById('monitorSummary'));
  });

  /* ------------------------------------------------------- The live tick
     A visible heartbeat: every few seconds one active monitor's price moves
     a little, the card updates in place and flashes. Stands in for the
     BullMQ worker pushing a price over SSE. */
  function tick() {
    var active = monitors.filter(function (m) { return m.active; });
    if (!active.length) return;

    var m = active[Math.floor(Math.random() * active.length)];
    var drift = (Math.random() - 0.58) * 0.012;      /* slight downward bias */
    var next = Math.max(Math.round(m.target * 0.86), Math.round(m.current * (1 + drift)));
    if (next === m.current) return;

    var wasAbove = m.current > m.target;
    m.current = next;
    m.changePct = ((m.current - m.start) / m.start) * 100;
    m.lastChecked = Date.now();
    m.nextCheck = Date.now() + 12 * 60 * 1000;
    m.history = (m.history || []).slice(1).concat(next);
    store.patchIn('monitors', m.id, {
      current: m.current, changePct: m.changePct,
      lastChecked: m.lastChecked, nextCheck: m.nextCheck, history: m.history
    });

    var card = document.querySelector('[data-monitor="' + m.id + '"]');
    if (card) {
      var priceEl = card.querySelector('[data-monitor-price]');
      if (priceEl) {
        priceEl.textContent = fmt.inr(m.current);
        priceEl.classList.remove('flash');
        void priceEl.offsetWidth;             /* restart the flash animation */
        priceEl.classList.add('flash');
      }
      var canvas = card.querySelector('[data-spark="' + m.id + '"]');
      if (canvas) A.charts.sparkline(canvas, m.history, { height: 34, duration: 400 });
    }

    if (wasAbove && m.current <= m.target) {
      A.ui.toast(m.label + ' hit your target', { tone: 'ok', icon: 'bolt', duration: 3600 });
      A.ui.haptic(18);
      store.push('events', {
        id: 'e-' + Date.now(), taskId: m.taskId, type: 'monitor.triggered', level: 'ok',
        label: 'Condition met: ' + m.condition, detail: 'current=' + m.current, at: Date.now()
      });
      renderList();
    }

    renderSummary();
    var sum = document.getElementById('monitorSummary');
    sum.querySelectorAll('[data-count]').forEach(function (el) {
      el.setAttribute('data-counted', '1');
      A.motion.countUp(el);
    });
  }

  renderSummary();
  renderList();

  if (!A.motion.disabled) {
    var timer = setInterval(tick, 5200);
    document.addEventListener('visibilitychange', function () {
      /* Stop burning cycles when the tab is hidden. */
      if (document.hidden) { clearInterval(timer); timer = null; }
      else if (!timer) timer = setInterval(tick, 5200);
    });
  }

  A.motion.refresh(document);
})();

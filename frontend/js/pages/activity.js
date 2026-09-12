/* ==========================================================================
   ACTA — Agent Activity
   The audit trail: tool calls, decisions, approvals, retries and failures,
   newest first, filterable by level.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.ACTA;
  var icon = A.icon, esc = A.ui.esc, fmt = A.ui.fmt, store = A.store, views = A.views;

  A.ui.mount({ nav: 'more', back: true, title: 'Agent Activity', subtitle: 'Immutable audit trail' });

  var filter = 'all';
  var events = store.read('events') || [];

  /* --------------------------------------------------------------- Head */
  var byLevel = events.reduce(function (acc, e) { acc[e.level] = (acc[e.level] || 0) + 1; return acc; }, {});

  document.getElementById('activityHead').innerHTML =
    '<div class="glass-2 glass--edge pad" data-reveal="scale">' +
      '<div class="row-between" style="margin-bottom:var(--s-3)">' +
        '<div>' +
          '<div class="eyebrow">Events recorded</div>' +
          '<div class="display t-2xl w-600 tnum" data-count="' + events.length + '">0</div>' +
        '</div>' +
        '<span class="icon-tile icon-tile--brand breathe">' + icon('activity') + '</span>' +
      '</div>' +
      '<div class="row wrap" style="gap:6px">' +
        '<span class="chip chip--sm chip--ok">' + (byLevel.ok || 0) + ' succeeded</span>' +
        '<span class="chip chip--sm">' + (byLevel.info || 0) + ' informational</span>' +
        '<span class="chip chip--sm chip--warn">' + (byLevel.warn || 0) + ' held</span>' +
        '<span class="chip chip--sm chip--danger">' + (byLevel.danger || 0) + ' failed</span>' +
      '</div>' +
    '</div>';

  /* ------------------------------------------------------------ Filters */
  document.getElementById('activityFilters').innerHTML =
    '<div class="filter-bar" id="levelFilter" data-reveal>' +
      '<button class="chip chip--active" data-level="all">Everything</button>' +
      '<button class="chip" data-level="ok">' + icon('check') + 'Succeeded</button>' +
      '<button class="chip" data-level="warn">' + icon('shield') + 'Held</button>' +
      '<button class="chip" data-level="danger">' + icon('alert') + 'Failed</button>' +
      '<button class="chip" data-level="info">' + icon('info') + 'Info</button>' +
    '</div>';

  document.getElementById('levelFilter').addEventListener('click', function (e) {
    var b = e.target.closest('[data-level]');
    if (!b) return;
    filter = b.getAttribute('data-level');
    document.querySelectorAll('#levelFilter .chip').forEach(function (x) {
      x.classList.toggle('chip--active', x === b);
    });
    A.ui.haptic();
    renderFeed();
  });

  /* --------------------------------------------------------------- Feed */
  function renderFeed() {
    var list = events.filter(function (e) { return filter === 'all' || e.level === filter; });
    var host = document.getElementById('activityFeed');

    if (!list.length) {
      host.innerHTML = views.empty('activity', 'No events at this level',
        'Switch the filter, or run a task and watch the trail fill in.');
      A.motion.refresh(host);
      return;
    }

    /* Group by day so a long trail stays readable. */
    var groups = {};
    list.forEach(function (e) {
      var key = new Date(e.at).toDateString();
      (groups[key] = groups[key] || []).push(e);
    });

    host.innerHTML = Object.keys(groups).map(function (day) {
      var label = day === new Date().toDateString() ? 'Today'
        : day === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday'
        : new Date(day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      return '<div style="margin-bottom:var(--s-5)">' +
        '<div class="eyebrow" style="margin-bottom:var(--s-3)">' + esc(label) + '</div>' +
        '<div class="glass glass--edge pad">' +
          '<ul class="timeline">' + groups[day].map(views.eventItem).join('') + '</ul>' +
        '</div>' +
      '</div>';
    }).join('') +
    '<p class="t-2xs faint">' +
      'Every state transition is appended, never edited. This is the record used for debugging and dispute investigation.' +
    '</p>';

    A.motion.refresh(host);
  }

  renderFeed();
  A.motion.refresh(document);
})();

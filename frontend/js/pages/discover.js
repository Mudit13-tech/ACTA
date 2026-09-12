/* ==========================================================================
   ACTA — Discover
   Browse and compare candidates: filters, ranking, value score, price
   history and the policy summary behind each option.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.ACTA;
  var icon = A.icon, esc = A.ui.esc, fmt = A.ui.fmt, views = A.views;

  A.ui.mount({ nav: 'discover', title: 'Discover', subtitle: 'Compare what the agent found' });

  var params = new URLSearchParams(location.search);
  var set = params.get('set') || 'travel';
  var sort = 'score';
  var onlyActionable = false;

  /* ---------------------------------------------------------------- Head */
  document.getElementById('discoverHead').innerHTML =
    '<div class="segmented" id="setSwitch" role="tablist" aria-label="Vertical" data-reveal>' +
      A.data.VERTICALS.map(function (v) {
        return '<button role="tab" data-value="' + v.id + '"' +
          (v.id === set ? ' aria-selected="true"' : '') + '>' + esc(v.label.split(' ')[0]) + '</button>';
      }).join('') +
    '</div>';

  A.ui.segmented(document.getElementById('setSwitch'), function (value) {
    set = value;
    render();
  });

  /* ------------------------------------------------------------- Filters */
  document.getElementById('discoverFilters').innerHTML =
    '<div class="filter-bar" id="filterBar" data-reveal>' +
      '<button class="chip chip--active" data-sort="score">' + icon('sparkle') + 'Best match</button>' +
      '<button class="chip" data-sort="price">' + icon('tag') + 'Lowest price</button>' +
      '<button class="chip" data-sort="rating">' + icon('star') + 'Top rated</button>' +
      '<button class="chip" data-filter="actionable">' + icon('shield') + 'Actionable only</button>' +
    '</div>';

  document.getElementById('filterBar').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sort], [data-filter]');
    if (!b) return;
    A.ui.haptic();

    if (b.hasAttribute('data-sort')) {
      sort = b.getAttribute('data-sort');
      document.querySelectorAll('#filterBar [data-sort]').forEach(function (x) {
        x.classList.toggle('chip--active', x === b);
      });
    } else {
      onlyActionable = !onlyActionable;
      b.classList.toggle('chip--active', onlyActionable);
    }
    render();
  });

  /* --------------------------------------------------------------- Body */
  function visibleCandidates() {
    var list = A.data.candidatesFor(set);

    if (onlyActionable) {
      /* An option is actionable when it has a flexible policy and a score
         at or above the default action threshold. */
      list = list.filter(function (c) {
        return c.score >= 85 && /free cancellation|replacement|return|cancellation up to/i.test(c.policy);
      });
    }

    return list.sort(function (a, b) {
      if (sort === 'price') return a.price - b.price;
      if (sort === 'rating') return b.rating - a.rating;
      return b.score - a.score;
    });
  }

  function render() {
    var list = visibleCandidates();
    renderChart(list);
    renderList(list);
  }

  /* ---------------------------------------------------- Price comparison */
  function renderChart(list) {
    var host = document.getElementById('discoverChart');
    var withHistory = list.filter(function (c) { return c.history && c.history.length > 2; });

    if (!withHistory.length) {
      host.innerHTML =
        views.sectionHead('Price comparison') +
        '<div class="glass glass--edge pad" data-reveal>' +
          '<canvas id="barCanvas" height="150"></canvas>' +
          '<div class="t-2xs mute center" style="margin-top:8px">Estimated total for the party, including taxes.</div>' +
        '</div>';
      A.charts.bar(document.getElementById('barCanvas'), list.map(function (c) {
        return { label: c.title.split(/[ ,—]/)[0], value: c.price, display: fmt.compactInr(c.price) };
      }), { height: 150 });
      return;
    }

    var lead = withHistory[0];
    host.innerHTML =
      views.sectionHead('Price history', '60 days') +
      '<div class="glass glass--edge pad" data-reveal>' +
        '<div class="row-between" style="margin-bottom:var(--s-3)">' +
          '<div>' +
            '<div class="t-xs mute clamp-1">' + esc(lead.title) + '</div>' +
            '<div class="display t-lg w-600 tnum">' + fmt.inr(lead.price) + '</div>' +
          '</div>' +
          '<div class="center">' +
            '<div class="t-2xs mute">vs 60-day high</div>' +
            '<div class="t-sm w-600 up">−' +
              Math.round(((Math.max.apply(null, lead.history) - lead.price) / Math.max.apply(null, lead.history)) * 100) +
            '%</div>' +
          '</div>' +
        '</div>' +
        '<div class="chart"><canvas id="histCanvas" height="130"></canvas></div>' +
        '<div class="chart__legend" style="margin-top:10px">' +
          '<span><i style="background:linear-gradient(90deg,var(--brand-400),var(--cyan-400))"></i>Observed price</span>' +
          '<span><i style="background:var(--warn-400)"></i>Your trigger</span>' +
        '</div>' +
      '</div>';

    A.charts.area(document.getElementById('histCanvas'), lead.history, {
      height: 130,
      target: Math.round(Math.min.apply(null, lead.history) * 0.97),
      targetLabel: 'trigger',
      labels: ['60 days ago', 'today']
    });
  }

  /* ---------------------------------------------------------- Card list */
  function renderList(list) {
    var host = document.getElementById('discoverList');

    if (!list.length) {
      host.innerHTML = views.empty('filter', 'Nothing matches those filters',
        'Loosen the policy filter, or let the agent keep monitoring for a better option.',
        '<a class="btn btn--primary" href="monitoring.html">Open monitoring</a>');
      A.motion.refresh(host);
      return;
    }

    host.innerHTML =
      views.sectionHead(list.length + ' candidates', 'Compare table', '#compare') +
      '<div class="stack">' +
        list.map(function (c, i) { return views.candidateCard(c, { lead: i === 0 && sort === 'score' }); }).join('') +
      '</div>' +

      '<div id="compare" style="margin-top:var(--s-6)">' +
        views.sectionHead('Side by side') +
        '<div class="glass glass--edge pad-sm" data-reveal>' +
          '<div class="compare-scroll">' +
            '<table class="compare-table">' +
              '<thead><tr><th>Option</th><th>Price</th><th>Rating</th><th>Policy</th><th>Score</th></tr></thead>' +
              '<tbody>' +
                list.map(function (c) {
                  return '<tr>' +
                    '<td>' + esc(c.emoji) + ' ' + esc(c.title.split(',')[0]) + '</td>' +
                    '<td class="tnum">' + fmt.inr(c.price, { freeLabel: '—' }) + '</td>' +
                    '<td class="tnum">★ ' + c.rating + '</td>' +
                    '<td class="' + (/non-refundable|card hold/i.test(c.policy) ? 'down' : 'up') + '">' +
                      esc(c.policy.length > 22 ? c.policy.slice(0, 20) + '…' : c.policy) + '</td>' +
                    '<td class="w-600 tnum">' + c.score + '</td>' +
                  '</tr>';
                }).join('') +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
        '<p class="t-2xs faint" style="margin-top:10px">' +
          'Normalised values: prices include taxes for the full stay or order, and policies are mapped to a common schema before comparison.' +
        '</p>' +
      '</div>';

    views.hydrateScores(host);
    A.motion.refresh(host);
  }

  document.getElementById('discoverList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-inspect]');
    if (!b) return;
    var c = A.data.candidateById(b.getAttribute('data-inspect'));
    if (c) views.explainCandidate(c);
  });

  render();
})();

/* ==========================================================================
   ACTA — Orders & Bookings
   Completed and failed actions with their confirmation, verification and
   refund state.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.ACTA;
  var icon = A.icon, esc = A.ui.esc, fmt = A.ui.fmt, store = A.store, views = A.views;

  A.ui.mount({ nav: 'more', back: true, title: 'Orders & Bookings', subtitle: 'What actually happened' });

  var orders = store.read('orders') || [];
  var filter = 'all';

  /* --------------------------------------------------------------- Head */
  document.getElementById('orderHead').innerHTML =
    '<div class="segmented" id="orderFilter" role="tablist" data-reveal>' +
      '<button role="tab" data-value="all" aria-selected="true">All</button>' +
      '<button role="tab" data-value="confirmed">Confirmed</button>' +
      '<button role="tab" data-value="failed">Failed</button>' +
    '</div>';

  A.ui.segmented(document.getElementById('orderFilter'), function (v) { filter = v; renderList(); });

  /* -------------------------------------------------------------- Stats */
  var confirmed = orders.filter(function (o) { return o.status === 'confirmed'; });
  var failedCount = orders.filter(function (o) { return o.status === 'failed'; }).length;
  var spent = confirmed.reduce(function (s, o) { return s + o.amount; }, 0);
  var successRate = orders.length ? Math.round((confirmed.length / orders.length) * 100) : 0;

  document.getElementById('orderStats').innerHTML =
    '<div class="glass-2 glass--edge pad" data-reveal="scale">' +
      '<div class="row-between" style="margin-bottom:var(--s-4)">' +
        '<div>' +
          '<div class="eyebrow">Total committed</div>' +
          '<div class="display t-2xl w-600 tnum" data-count="' + spent + '" data-count-prefix="₹">0</div>' +
        '</div>' +
        '<div id="rateRing"></div>' +
      '</div>' +
      '<div class="row" style="gap:var(--s-3)">' +
        '<div class="well pad-sm grow center">' +
          '<div class="display t-lg w-600 tnum" style="color:var(--ok-400)">' + confirmed.length + '</div>' +
          '<div class="t-2xs mute">confirmed</div>' +
        '</div>' +
        '<div class="well pad-sm grow center">' +
          '<div class="display t-lg w-600 tnum" style="color:var(--danger-400)">' + failedCount + '</div>' +
          '<div class="t-2xs mute">failed safely</div>' +
        '</div>' +
        '<div class="well pad-sm grow center">' +
          '<div class="display t-lg w-600 tnum" style="color:var(--cyan-400)">' + successRate + '%</div>' +
          '<div class="t-2xs mute">action success</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  A.motion.drawScoreRing(document.getElementById('rateRing'), successRate, { size: 56, stroke: 5 });

  /* --------------------------------------------------------------- List */
  function renderList() {
    var list = orders.filter(function (o) { return filter === 'all' || o.status === filter; });
    var host = document.getElementById('orderList');

    if (!list.length) {
      host.innerHTML = views.empty('receipt', 'Nothing here yet',
        'Actions the agent completes — or safely abandons — are recorded here with their provider reference.');
      A.motion.refresh(host);
      return;
    }

    host.innerHTML =
      views.sectionHead(list.length + ' records') +
      '<div class="stack">' + list.map(views.orderCard).join('') + '</div>' +
      '<p class="t-2xs faint" style="margin-top:var(--s-4)">' +
        'Card data is never stored by ACTA. Payments run through the provider’s hosted flow and are confirmed by signed webhook.' +
      '</p>';

    A.motion.refresh(host);
  }

  /* Tap a record to see its verification trail. */
  document.getElementById('orderList').addEventListener('click', function (e) {
    var card = e.target.closest('[data-order]');
    if (!card) return;
    e.preventDefault();

    var o = orders.find(function (x) { return x.id === card.getAttribute('data-order'); });
    if (!o) return;

    var st = A.ui.status(o.status);

    A.ui.sheet({
      title: 'Verification trail',
      html:
        '<div class="row" style="gap:var(--s-3);margin-bottom:var(--s-4)">' +
          '<span class="option__media" style="width:52px;height:52px;font-size:23px">' + esc(o.emoji) + '</span>' +
          '<div class="grow">' +
            '<div class="w-600">' + esc(o.title) + '</div>' +
            '<div class="t-xs mute">' + esc(o.vendor) + ' · ' + fmt.ago(o.placedAt) + '</div>' +
          '</div>' +
          '<span class="chip chip--sm ' + st.chip + '"><span class="dot"></span>' + st.label + '</span>' +
        '</div>' +

        '<div class="row well pad-sm" style="margin-bottom:var(--s-4)">' +
          '<div class="grow"><div class="t-2xs mute">Amount</div>' +
            '<div class="display w-600">' + fmt.inr(o.amount, { freeLabel: 'No charge' }) + '</div></div>' +
          '<div class="grow"><div class="t-2xs mute">Reference</div>' +
            '<div class="mono t-sm w-600">' + (o.ref ? esc(o.ref) : '—') + '</div></div>' +
        '</div>' +

        '<div class="eyebrow" style="margin-bottom:10px">What the agent did</div>' +
        '<ul class="timeline">' +
          o.steps.map(function (s, i) {
            var cls = o.status === 'failed' && i >= o.steps.length - 2 ? 'tl-item--fail' : 'tl-item--done';
            return '<li class="tl-item ' + cls + '">' +
              '<div class="row-between"><span class="tl-item__title t-xs">' + esc(s[0]) + '</span>' +
              '<span class="tl-item__time">' + fmt.time(s[1]) + '</span></div></li>';
          }).join('') +
        '</ul>' +

        (o.simulated ? '<div class="chip chip--sm chip--info" style="margin-top:var(--s-4)">' + icon('info') + 'Simulated transaction</div>' : '') +

        '<div class="row" style="gap:var(--s-2);margin-top:var(--s-5)">' +
          (o.status === 'confirmed' && o.amount > 0
            ? '<button class="btn btn--danger grow" data-cancel="' + esc(o.id) + '">Request cancellation</button>'
            : '') +
          '<button class="btn btn--primary grow" data-sheet-close>Close</button>' +
        '</div>',

      onOpen: function (el) {
        var cancelBtn = el.querySelector('[data-cancel]');
        if (!cancelBtn) return;
        cancelBtn.addEventListener('click', function () {
          store.patchIn('orders', o.id, { status: 'refunded' });
          o.status = 'refunded';
          store.push('events', {
            id: 'e-' + Date.now(), taskId: o.taskId, type: 'action.cancelled', level: 'info',
            label: 'Cancellation requested for ' + o.title, detail: 'ref ' + (o.ref || 'none'), at: Date.now()
          });
          A.ui.closeSheet();
          A.ui.toast('Cancellation requested', { icon: 'refresh' });
          renderList();
        });
      }
    });
  });

  renderList();
  A.motion.refresh(document);
})();

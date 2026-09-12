/* ==========================================================================
   ACTA — Approvals
   The human-in-the-loop inbox: what the agent wants to do, why policy held
   it back, and the approve / change / reject decision.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.ACTA;
  var icon = A.icon, esc = A.ui.esc, fmt = A.ui.fmt, store = A.store, views = A.views;

  A.ui.mount({ nav: 'approvals', title: 'Approvals', subtitle: 'Decisions waiting on you' });

  var filter = 'pending';

  /* --------------------------------------------------------------- Head */
  document.getElementById('approvalHead').innerHTML =
    '<div class="stack" data-reveal>' +
      '<div>' +
        '<h2 class="t-xl">Approval inbox</h2>' +
        '<p class="t-sm mute" style="margin-top:4px">' +
          'The agent never infers permission from intent. Every sensitive action is checked against your policy first.' +
        '</p>' +
      '</div>' +
      '<div class="segmented" id="approvalFilter" role="tablist">' +
        '<button role="tab" data-value="pending" aria-selected="true">Pending</button>' +
        '<button role="tab" data-value="decided">Decided</button>' +
        '<button role="tab" data-value="all">All</button>' +
      '</div>' +
    '</div>';

  A.ui.segmented(document.getElementById('approvalFilter'), function (v) {
    filter = v;
    renderList();
  });

  /* ------------------------------------------------------ Policy summary */
  function renderPolicy() {
    var p = store.read('policy');
    var allowed = Object.keys(p.categories).filter(function (k) { return p.categories[k]; });

    document.getElementById('approvalPolicy').innerHTML =
      '<div class="glass glass--edge pad" data-reveal>' +
        '<div class="row-between" style="margin-bottom:var(--s-3)">' +
          '<div class="row" style="gap:var(--s-2)">' +
            '<span style="color:var(--accent)">' + icon('shield') + '</span>' +
            '<span class="w-600 t-sm">Active policy</span>' +
          '</div>' +
          '<a class="t-xs w-600" style="color:var(--accent)" href="settings.html">Edit</a>' +
        '</div>' +
        '<div class="row wrap" style="gap:6px">' +
          '<span class="chip chip--sm">Auto-buy under ' + fmt.inr(p.autoSpendLimit) + '</span>' +
          '<span class="chip chip--sm">Ceiling ' + fmt.inr(p.hardCeiling) + '</span>' +
          (allowed.length ? '<span class="chip chip--sm chip--ok">' + allowed.length + ' auto categories</span>' : '<span class="chip chip--sm chip--warn">No auto categories</span>') +
          (p.freeCancelAutonomous ? '<span class="chip chip--sm chip--ok">Free cancels autonomous</span>' : '') +
          (p.timeWindow.enabled ? '<span class="chip chip--sm">' + esc(p.timeWindow.from) + '–' + esc(p.timeWindow.to) + '</span>' : '') +
        '</div>' +
      '</div>';
  }

  /* --------------------------------------------------------------- List */
  function renderList() {
    var all = store.read('approvals') || [];
    var list = all.filter(function (a) {
      if (filter === 'pending') return a.status === 'pending';
      if (filter === 'decided') return a.status !== 'pending';
      return true;
    });

    var host = document.getElementById('approvalList');

    if (!list.length) {
      host.innerHTML = views.empty(
        filter === 'pending' ? 'check' : 'inbox',
        filter === 'pending' ? 'Nothing needs you' : 'No decisions yet',
        filter === 'pending'
          ? 'Every prepared action is inside your policy right now. The agent will interrupt only when it is not.'
          : 'Approvals you decide will appear here with their outcome.',
        filter === 'pending' ? '<a class="btn" href="monitoring.html">See what is being watched</a>' : '');
      A.motion.refresh(host);
      return;
    }

    host.innerHTML = '<div class="stack">' + list.map(views.approvalCard).join('') + '</div>';
    A.motion.refresh(host);
  }

  /* ------------------------------------------------------------ Actions */
  document.getElementById('approvalList').addEventListener('click', function (e) {
    var approveBtn = e.target.closest('[data-approve]');
    var rejectBtn  = e.target.closest('[data-reject]');
    var modifyBtn  = e.target.closest('[data-modify]');

    if (approveBtn) return decide(approveBtn.getAttribute('data-approve'), 'approved');
    if (rejectBtn)  return decide(rejectBtn.getAttribute('data-reject'), 'rejected');
    if (modifyBtn)  return modify(modifyBtn.getAttribute('data-modify'));
  });

  function findApproval(id) {
    return (store.read('approvals') || []).find(function (a) { return a.id === id; });
  }

  function decide(id, decision) {
    var a = findApproval(id);
    if (!a) return;

    store.patchIn('approvals', id, { status: decision, decidedAt: Date.now() });
    store.push('events', {
      id: 'e-' + Date.now(), taskId: a.taskId,
      type: 'approval.' + decision, level: decision === 'approved' ? 'ok' : 'warn',
      label: fmt.title(decision) + ': ' + a.title,
      detail: 'rule=' + a.policyRule.split('—')[0].trim().replace(/\s+/g, '_').toLowerCase(),
      at: Date.now()
    });

    A.ui.haptic(decision === 'approved' ? 18 : 10);

    if (decision === 'approved') {
      execute(a);
    } else {
      store.patchIn('tasks', a.taskId, { status: 'monitoring', note: 'Action rejected. Back to monitoring for a better option.' });
      A.ui.toast('Rejected — the agent will keep looking', { tone: 'warn', icon: 'close' });
      renderList();
      refreshBadges();
    }
  }

  /* Change the action before approving: adjust the amount cap or defer. */
  function modify(id) {
    var a = findApproval(id);
    if (!a) return;

    A.ui.sheet({
      title: 'Change before approving',
      html:
        '<p class="t-sm mute" style="margin-bottom:var(--s-4)">' +
          'Approving with a change sends the agent back with a tighter constraint rather than cancelling the task.' +
        '</p>' +

        '<div class="field" style="margin-bottom:var(--s-4)">' +
          '<label class="field__label" for="newCap">Maximum I will pay</label>' +
          '<div class="row" style="gap:var(--s-3)">' +
            '<input class="range grow" type="range" id="newCap" min="' + Math.round(a.amount * 0.6) +
              '" max="' + Math.round(a.amount * 1.2) + '" step="100" value="' + a.amount + '">' +
            '<span class="display w-600 tnum" id="newCapOut" style="min-width:76px;text-align:right">' + fmt.inr(a.amount) + '</span>' +
          '</div>' +
        '</div>' +

        '<div class="stack-sm" style="margin-bottom:var(--s-5)">' +
          modOption('tighter', 'Only act below my new cap', 'The agent keeps monitoring until the price fits.') +
          modOption('defer', 'Ask me again tomorrow', 'The action is held and re-surfaced in 24 hours.') +
          modOption('once', 'Approve this once, at the new cap', 'Executes now if the current price is within the cap.') +
        '</div>' +

        '<button class="btn btn--primary btn--block" id="applyMod">Apply change</button>',

      onOpen: function (el) {
        var range = el.querySelector('#newCap');
        var out = el.querySelector('#newCapOut');
        range.addEventListener('input', function () { out.textContent = fmt.inr(parseInt(range.value, 10)); });

        el.querySelectorAll('[data-mod]').forEach(function (opt) {
          opt.addEventListener('click', function () {
            el.querySelectorAll('[data-mod]').forEach(function (x) { x.setAttribute('data-selected', 'false'); });
            opt.setAttribute('data-selected', 'true');
          });
        });

        el.querySelector('#applyMod').addEventListener('click', function () {
          var cap = parseInt(range.value, 10);
          var selected = el.querySelector('[data-mod][data-selected="true"]');
          var choice = selected ? selected.getAttribute('data-mod') : 'tighter';

          A.ui.closeSheet();

          if (choice === 'once' && cap >= a.amount) {
            decide(a.id, 'approved');
            return;
          }

          store.patchIn('approvals', a.id, {
            status: choice === 'defer' ? 'pending' : 'pending',
            amount: a.amount,
            reason: choice === 'defer'
              ? 'Deferred by you — will be re-surfaced tomorrow.'
              : 'Held by you at a ' + fmt.inr(cap) + ' cap. The agent will act only below it.',
            expiresAt: choice === 'defer' ? Date.now() + 86400000 : a.expiresAt
          });

          store.patchIn('tasks', a.taskId, {
            status: 'monitoring',
            note: choice === 'defer' ? 'Deferred for a day at your request.' : 'Watching for a price below ' + fmt.inr(cap) + '.'
          });

          store.push('events', {
            id: 'e-' + Date.now(), taskId: a.taskId, type: 'approval.modified', level: 'info',
            label: 'Approval changed: cap set to ' + fmt.inr(cap), detail: 'choice=' + choice, at: Date.now()
          });

          A.ui.toast(choice === 'defer' ? 'Deferred to tomorrow' : 'Cap updated — monitoring resumed', { icon: 'shield' });
          renderList();
          refreshBadges();
        });
      }
    });
  }

  function modOption(value, title, body) {
    return '<button class="well pad-sm row" data-mod="' + value + '" data-selected="' + (value === 'tighter') + '" ' +
      'style="width:100%;text-align:left;gap:var(--s-3);align-items:flex-start">' +
      '<span class="icon-tile icon-tile--brand" style="width:32px;height:32px;border-radius:10px">' + icon('check') + '</span>' +
      '<span class="grow"><b class="t-sm w-600" style="display:block">' + esc(title) + '</b>' +
      '<span class="t-xs mute">' + esc(body) + '</span></span>' +
    '</button>';
  }

  /* --------------------------------------------------- Execute + verify */
  function execute(a) {
    var html =
      '<div class="center stack" style="align-items:center">' +
        '<div id="execRing"></div>' +
        '<div class="w-600" id="execLabel">Executing…</div>' +
        '<div class="t-xs mute" id="execSub">Idempotency key ' + esc(a.actionId) + '-' + Math.random().toString(16).slice(2, 6) + '</div>' +
      '</div>' +
      '<ul class="timeline" id="execSteps" style="margin-top:var(--s-5)"></ul>';

    var sheetEl = A.ui.sheet({ title: 'Action', html: html });
    A.motion.drawScoreRing(sheetEl.querySelector('#execRing'), 0, { size: 64, stroke: 5 });

    var ref = (a.vendor === 'Sandbox Travel' ? 'ST-' : a.vendor === 'TableLine' ? 'TL-' : 'MC-') +
              Math.floor(40000 + Math.random() * 9999);

    var steps = [
      'Action dispatched to ' + a.vendor,
      a.amount > 0 ? 'Hosted payment link settled' : 'Provider acknowledged the request',
      'Confirmation reference ' + ref + ' received',
      'State verified against the provider'
    ];

    var list = sheetEl.querySelector('#execSteps');
    var i = 0;

    (function tick() {
      if (i >= steps.length) return finish();
      var li = document.createElement('li');
      li.className = 'tl-item tl-item--done item-in';
      li.innerHTML = '<div class="row-between"><span class="tl-item__title t-xs">' + esc(steps[i]) + '</span>' +
                     '<span class="tl-item__time">' + fmt.clock(Date.now()) + '</span></div>';
      list.appendChild(li);
      A.motion.drawScoreRing(sheetEl.querySelector('#execRing'), Math.round(((i + 1) / steps.length) * 100), { size: 64, stroke: 5 });
      i++;
      setTimeout(tick, 760);
    })();

    function finish() {
      sheetEl.querySelector('#execLabel').textContent = 'Executed successfully';
      sheetEl.querySelector('#execSub').textContent = 'Simulated transaction · ' + ref;

      store.push('orders', {
        id: 'o-' + Math.floor(500 + Math.random() * 499),
        actionId: a.actionId, taskId: a.taskId, status: 'confirmed',
        title: a.title.replace(/^(Book|Purchase|Reserve)\s+/i, ''),
        vendor: a.vendor, emoji: a.emoji, amount: a.amount, currency: 'INR', ref: ref,
        placedAt: Date.now(), verifiedAt: Date.now() + 45000,
        kind: a.amount > 0 ? 'purchase' : 'reservation', simulated: true,
        steps: steps.map(function (s, n) { return [s, Date.now() + n * 14000]; })
      });

      store.patchIn('tasks', a.taskId, {
        status: 'completed', stage: 'verify', progress: 1,
        note: 'Executed and verified. Reference ' + ref + '.'
      });

      store.push('events', {
        id: 'e-' + Date.now(), taskId: a.taskId, type: 'action.verified', level: 'ok',
        label: 'Action executed and verified', detail: 'ref ' + ref + ' · state=confirmed', at: Date.now()
      });

      A.ui.toast('Executed successfully', { tone: 'ok', icon: 'check' });

      setTimeout(function () {
        A.ui.closeSheet();
        renderList();
        refreshBadges();
      }, 1100);
    }
  }

  /* Keep the tab-bar and header badges honest after a decision. */
  function refreshBadges() {
    var pending = (store.read('approvals') || []).filter(function (a) { return a.status === 'pending'; }).length;
    var badge = document.querySelector('.tab[data-nav="approvals"] .tab__badge');
    if (pending && badge) badge.textContent = pending;
    else if (pending && !badge) {
      var tab = document.querySelector('.tab[data-nav="approvals"]');
      if (tab) tab.insertAdjacentHTML('beforeend', '<span class="tab__badge">' + pending + '</span>');
    } else if (!pending && badge) badge.remove();

    var headerBadge = document.querySelector('.app-header .tab__badge');
    if (headerBadge) { if (pending) headerBadge.textContent = pending; else headerBadge.remove(); }
  }

  renderPolicy();
  renderList();
  A.motion.refresh(document);
})();

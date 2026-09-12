/* ==========================================================================
   ACTA — Shared view renderers
   Markup-returning functions used across pages so a card looks identical
   wherever it appears.
   ========================================================================== */
(function (global) {
  'use strict';

  var A = global.ACTA;
  var icon = A.icon, esc = A.ui.esc, fmt = A.ui.fmt, status = A.ui.status;

  var VERTICAL_ICON = { shopping: 'cart', travel: 'hotel', reservation: 'dining' };
  var VERTICAL_TONE = { shopping: 'brand', travel: 'cyan', reservation: 'warn' };

  /* ------------------------------------------------------------ Task card */
  function taskCard(task, opts) {
    opts = opts || {};
    var st = status(task.status);
    var pct = Math.round((task.progress || 0) * 100);
    var tone = VERTICAL_TONE[task.vertical] || 'brand';

    return '' +
    '<a class="card glass glass--edge card--tap" href="task.html?id=' + esc(task.id) + '" data-reveal>' +
      '<div class="row" style="align-items:flex-start;gap:var(--s-3)">' +
        '<span class="icon-tile icon-tile--' + tone + '">' + icon(VERTICAL_ICON[task.vertical] || 'bolt') + '</span>' +
        '<div class="grow">' +
          '<div class="row-between" style="align-items:flex-start">' +
            '<div class="w-600 t-sm clamp-2" style="line-height:1.35">' + esc(task.intent) + '</div>' +
            '<span class="chip chip--sm ' + st.chip + '"><span class="dot"></span>' + st.label + '</span>' +
          '</div>' +
          '<div class="row mute t-xs" style="margin-top:6px;gap:var(--s-3)">' +
            '<span class="mono">' + esc(task.id) + '</span>' +
            '<span>' + fmt.ago(task.createdAt) + '</span>' +
            (task.goal && task.goal.budget ? '<span>' + fmt.compactInr(task.goal.budget) + ' cap</span>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      (opts.compact ? '' :
        '<div style="margin-top:var(--s-3)">' +
          '<div class="pipeline">' + pipelineSteps(task.stage) + '</div>' +
          '<div class="row-between t-2xs mute" style="margin-top:8px">' +
            '<span>' + esc(stageLabel(task.stage)) + '</span>' +
            '<span class="tnum">' + pct + '%</span>' +
          '</div>' +
        '</div>') +
      (task.note && !opts.compact ? '<div class="t-xs mute" style="margin-top:10px">' + esc(task.note) + '</div>' : '') +
    '</a>';
  }

  function stageLabel(id) {
    var s = A.data.STAGES.find(function (x) { return x.id === id; });
    return s ? s.label : fmt.title(id);
  }

  function pipelineSteps(currentStage) {
    var stages = A.data.STAGES;
    var idx = stages.findIndex(function (s) { return s.id === currentStage; });
    return stages.map(function (s, i) {
      var state = i < idx ? 'done' : (i === idx ? 'active' : 'todo');
      return '<span class="pipeline__step" data-state="' + state + '" title="' + esc(s.label) + '"></span>';
    }).join('');
  }

  /* ------------------------------------------------------- Candidate card */
  function candidateCard(c, opts) {
    opts = opts || {};
    var drop = c.was ? Math.round(((c.was - c.price) / c.was) * 100) : 0;

    return '' +
    '<article class="option glass ' + (opts.lead ? 'glass-2 glass--edge' : '') + '" data-candidate="' + esc(c.id) + '" data-reveal>' +
      '<div class="option__media">' + esc(c.emoji) + '</div>' +
      '<div class="grow">' +
        '<div class="row-between" style="align-items:flex-start;gap:var(--s-2)">' +
          '<div class="grow">' +
            (opts.lead ? '<span class="chip chip--sm chip--brand" style="margin-bottom:6px">' + icon('sparkle') + 'Recommended</span>' : '') +
            '<div class="option__title clamp-2">' + esc(c.title) + '</div>' +
            '<div class="option__meta" style="margin-top:3px">' + esc(c.provider) + ' · ' +
              '<span class="w-600">★ ' + c.rating + '</span> <span class="faint">(' + c.reviews.toLocaleString('en-IN') + ')</span>' +
            '</div>' +
          '</div>' +
          '<div data-score="' + c.score + '"></div>' +
        '</div>' +

        '<div class="row wrap" style="gap:5px;margin-top:9px">' +
          c.attrs.map(function (a) { return '<span class="chip chip--sm">' + esc(a) + '</span>'; }).join('') +
        '</div>' +

        '<div class="row-between" style="margin-top:10px;align-items:flex-end">' +
          '<div>' +
            '<span class="option__price t-md">' + fmt.inr(c.price, { freeLabel: 'No deposit' }) + '</span>' +
            (c.was ? ' <span class="t-xs mute" style="text-decoration:line-through">' + fmt.inr(c.was) + '</span>' +
                     ' <span class="t-xs up w-600">−' + drop + '%</span>' : '') +
            '<div class="t-2xs mute" style="margin-top:2px">' + esc(c.policy) + '</div>' +
          '</div>' +
          (opts.action !== false ? '<button class="btn btn--sm" data-inspect="' + esc(c.id) + '">Why?</button>' : '') +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* Render the score rings inside freshly-inserted candidate cards. */
  function hydrateScores(root) {
    (root || document).querySelectorAll('[data-score]:not([data-score-drawn])').forEach(function (el) {
      el.setAttribute('data-score-drawn', '1');
      A.motion.drawScoreRing(el, parseFloat(el.getAttribute('data-score')) || 0, { size: 44 });
    });
  }

  /* ----------------------------------------------------- Why-this sheet */
  function explainCandidate(c) {
    var html =
      '<div class="row" style="gap:var(--s-3);margin-bottom:var(--s-4)">' +
        '<div class="option__media" style="width:54px;height:54px;font-size:24px">' + esc(c.emoji) + '</div>' +
        '<div class="grow">' +
          '<div class="w-600">' + esc(c.title) + '</div>' +
          '<div class="t-xs mute">' + esc(c.provider) + ' · ' + fmt.inr(c.price, { freeLabel: 'No deposit' }) + '</div>' +
        '</div>' +
        '<div data-score="' + c.score + '"></div>' +
      '</div>' +

      '<div class="eyebrow" style="margin-bottom:8px">Why the agent ranked it here</div>' +
      '<ul class="stack-sm" style="margin-bottom:var(--s-4)">' +
        c.why.map(function (w) {
          return '<li class="row" style="align-items:flex-start;gap:9px">' +
            '<span style="color:var(--accent);margin-top:2px">' + icon('check', 'icon') + '</span>' +
            '<span class="t-sm soft">' + esc(w) + '</span></li>';
        }).join('') +
      '</ul>' +

      '<div class="well pad-sm stack-sm" style="margin-bottom:var(--s-4)">' +
        scoreRow('Price vs budget', Math.min(100, Math.round((c.score + 4)))) +
        scoreRow('Rating & reviews', Math.round(c.rating / 5 * 100)) +
        scoreRow('Policy flexibility', /free cancellation|replacement|return/i.test(c.policy) ? 92 : 38) +
        scoreRow('Preference match', Math.max(40, c.score - 6)) +
      '</div>' +

      '<div class="t-2xs faint" style="margin-bottom:var(--s-4)">' +
        'Weights come from your saved preferences. The agent shows the factors behind a decision, not its raw reasoning trace.' +
      '</div>' +

      '<div class="row" style="gap:var(--s-2)">' +
        '<button class="btn btn--primary grow" data-sheet-close>Got it</button>' +
        '<a class="btn" href="discover.html" data-sheet-close>Compare all</a>' +
      '</div>';

    var el = A.ui.sheet({ title: 'Decision breakdown', html: html });
    hydrateScores(el);
    A.motion.meters(el);
    return el;
  }

  function scoreRow(label, value) {
    return '<div>' +
      '<div class="row-between t-xs" style="margin-bottom:5px">' +
        '<span class="soft">' + esc(label) + '</span>' +
        '<span class="w-600 tnum">' + value + '</span>' +
      '</div>' +
      '<div class="meter"><span class="meter__fill" data-value="' + value + '"></span></div>' +
    '</div>';
  }

  /* ------------------------------------------------------- Monitor card */
  function monitorCard(m) {
    var hit = m.current <= m.target;
    var progress = Math.max(0, Math.min(100, ((m.start - m.current) / (m.start - m.target)) * 100));

    return '' +
    '<article class="card glass glass--edge" data-monitor="' + esc(m.id) + '" data-reveal>' +
      '<div class="row" style="align-items:flex-start;gap:var(--s-3)">' +
        '<span class="option__media" style="width:44px;height:44px;font-size:20px">' + esc(m.emoji) + '</span>' +
        '<div class="grow">' +
          '<div class="row-between" style="align-items:flex-start">' +
            '<div class="w-600 t-sm clamp-1">' + esc(m.label) + '</div>' +
            '<button class="switch" aria-checked="' + (m.active ? 'true' : 'false') + '" data-monitor-toggle="' + esc(m.id) + '" aria-label="Toggle monitor"></button>' +
          '</div>' +
          '<div class="mono t-2xs mute" style="margin-top:3px">' + esc(m.condition) + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="row-between" style="margin-top:var(--s-3);align-items:flex-end">' +
        '<div>' +
          '<div class="t-2xs mute">Current</div>' +
          '<div class="row" style="gap:8px;align-items:baseline">' +
            '<span class="display t-lg w-600 tnum" data-monitor-price>' + fmt.inr(m.current) + '</span>' +
            '<span class="t-xs w-600 ' + (m.changePct < 0 ? 'up' : 'down') + '">' + fmt.pct(m.changePct) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="center">' +
          '<div class="t-2xs mute">Target</div>' +
          '<div class="t-sm w-600 tnum">' + fmt.inr(m.target) + '</div>' +
        '</div>' +
        '<div style="width:88px"><canvas data-spark="' + esc(m.id) + '" height="34"></canvas></div>' +
      '</div>' +

      '<div style="margin-top:var(--s-3)">' +
        '<div class="meter' + (hit ? '' : ' meter--warn') + '"><span class="meter__fill" data-value="' + progress.toFixed(0) + '"></span></div>' +
        '<div class="row-between t-2xs mute" style="margin-top:7px">' +
          '<span>' + (hit ? 'Condition met — action eligible' : Math.round(100 - progress) + '% to target') + '</span>' +
          '<span>Next check ' + (m.active ? fmt.until(m.nextCheck) : 'paused') + '</span>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* ------------------------------------------------------ Approval card */
  function approvalCard(a) {
    var st = status(a.status);
    var riskTone = a.risk === 'high' ? 'danger' : a.risk === 'medium' ? 'warn' : 'ok';
    var pending = a.status === 'pending';

    return '' +
    '<article class="card glass-2 glass--edge" data-approval="' + esc(a.id) + '" data-reveal>' +
      '<div class="row-between" style="align-items:flex-start;margin-bottom:var(--s-3)">' +
        '<div class="row" style="gap:var(--s-3)">' +
          '<span class="option__media" style="width:44px;height:44px;font-size:20px">' + esc(a.emoji) + '</span>' +
          '<div>' +
            '<div class="w-600 t-sm">' + esc(a.title) + '</div>' +
            '<div class="t-xs mute">' + esc(a.vendor) + ' · ' + fmt.ago(a.createdAt) + '</div>' +
          '</div>' +
        '</div>' +
        '<span class="chip chip--sm ' + st.chip + '"><span class="dot"></span>' + st.label + '</span>' +
      '</div>' +

      '<div class="row-between well pad-sm" style="margin-bottom:var(--s-3)">' +
        '<div>' +
          '<div class="t-2xs mute">Amount</div>' +
          '<div class="display t-lg w-600 tnum">' + fmt.inr(a.amount, { freeLabel: 'No charge' }) + '</div>' +
        '</div>' +
        '<div class="center">' +
          '<div class="t-2xs mute">Risk</div>' +
          '<span class="chip chip--sm chip--' + riskTone + '">' + fmt.title(a.risk) + '</span>' +
        '</div>' +
        (pending ? '<div class="center">' +
          '<div class="t-2xs mute">Expires</div>' +
          '<div class="t-sm w-600">' + fmt.until(a.expiresAt) + '</div>' +
        '</div>' : '') +
      '</div>' +

      '<div class="row" style="align-items:flex-start;gap:9px;margin-bottom:var(--s-3)">' +
        '<span style="color:var(--warn-400);flex:0 0 auto">' + icon('shield') + '</span>' +
        '<div>' +
          '<div class="t-xs w-600">' + esc(a.policyRule) + '</div>' +
          '<div class="t-xs mute" style="margin-top:2px">' + esc(a.reason) + '</div>' +
        '</div>' +
      '</div>' +

      (a.simulated ? '<span class="chip chip--sm chip--info" style="margin-bottom:var(--s-3)">' + icon('info') + 'Simulated transaction</span>' : '') +

      (pending ?
        '<div class="row" style="gap:var(--s-2)">' +
          '<button class="btn btn--primary grow" data-approve="' + esc(a.id) + '">Approve</button>' +
          '<button class="btn" data-modify="' + esc(a.id) + '">Change</button>' +
          '<button class="btn btn--danger btn--icon" data-reject="' + esc(a.id) + '" aria-label="Reject">' + icon('close') + '</button>' +
        '</div>'
        :
        '<div class="t-xs mute row" style="gap:6px">' + icon('check') + 'Decided ' + fmt.ago(a.decidedAt || a.createdAt) + '</div>') +
    '</article>';
  }

  /* --------------------------------------------------------- Order card */
  function orderCard(o) {
    var st = status(o.status);
    return '' +
    '<a class="card glass glass--edge card--tap" data-order="' + esc(o.id) + '" href="#" data-no-transition data-reveal>' +
      '<div class="row" style="gap:var(--s-3);align-items:flex-start">' +
        '<span class="option__media" style="width:44px;height:44px;font-size:20px">' + esc(o.emoji) + '</span>' +
        '<div class="grow">' +
          '<div class="row-between" style="align-items:flex-start">' +
            '<div class="w-600 t-sm clamp-1">' + esc(o.title) + '</div>' +
            '<span class="chip chip--sm ' + st.chip + '"><span class="dot"></span>' + st.label + '</span>' +
          '</div>' +
          '<div class="row t-xs mute" style="gap:var(--s-3);margin-top:5px">' +
            '<span>' + esc(o.vendor) + '</span>' +
            '<span>' + fmt.ago(o.placedAt) + '</span>' +
          '</div>' +
          '<div class="row-between" style="margin-top:8px">' +
            '<span class="option__price t-sm">' + fmt.inr(o.amount, { freeLabel: 'No charge' }) + '</span>' +
            '<span class="mono t-2xs mute">' + (o.ref ? esc(o.ref) : 'no reference') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</a>';
  }

  /* -------------------------------------------------------- Event row */
  var LEVEL_ICON = { ok: 'check', info: 'info', warn: 'shield', danger: 'alert' };
  var LEVEL_CLASS = { ok: 'tl-item--done', info: '', warn: 'tl-item--wait', danger: 'tl-item--fail' };

  function eventItem(e) {
    return '' +
    '<li class="tl-item ' + (LEVEL_CLASS[e.level] || '') + '" data-reveal>' +
      '<div class="row-between" style="align-items:flex-start;gap:var(--s-3)">' +
        '<div class="grow">' +
          '<div class="tl-item__title">' + esc(e.label) + '</div>' +
          '<div class="tl-item__body mono">' + esc(e.detail) + '</div>' +
        '</div>' +
        '<span class="tl-item__time">' + fmt.ago(e.at) + '</span>' +
      '</div>' +
      '<div class="row t-2xs faint" style="gap:8px;margin-top:5px">' +
        '<span class="mono">' + esc(e.type) + '</span>' +
        (e.taskId ? '<span class="mono">' + esc(e.taskId) + '</span>' : '') +
      '</div>' +
    '</li>';
  }

  /* --------------------------------------------------------- Empty state */
  function empty(iconName, title, body, cta) {
    return '<div class="empty" data-reveal>' +
      '<div class="empty__icon">' + icon(iconName) + '</div>' +
      '<div class="w-600">' + esc(title) + '</div>' +
      '<div class="t-sm mute" style="margin-top:5px;max-width:30ch;margin-inline:auto">' + esc(body) + '</div>' +
      (cta ? '<div style="margin-top:var(--s-4)">' + cta + '</div>' : '') +
    '</div>';
  }

  /* Section heading with an optional trailing link */
  function sectionHead(title, linkText, href) {
    return '<div class="row-between" style="margin-bottom:var(--s-3)">' +
      '<h3 class="t-md w-600">' + esc(title) + '</h3>' +
      (linkText ? '<a class="t-xs w-600" style="color:var(--accent)" href="' + esc(href || '#') + '">' + esc(linkText) + '</a>' : '') +
    '</div>';
  }

  A.views = {
    taskCard: taskCard,
    candidateCard: candidateCard,
    hydrateScores: hydrateScores,
    explainCandidate: explainCandidate,
    monitorCard: monitorCard,
    approvalCard: approvalCard,
    orderCard: orderCard,
    eventItem: eventItem,
    empty: empty,
    sectionHead: sectionHead,
    pipelineSteps: pipelineSteps,
    stageLabel: stageLabel,
    scoreRow: scoreRow,
    VERTICAL_ICON: VERTICAL_ICON,
    VERTICAL_TONE: VERTICAL_TONE
  };
})(window);

/* ==========================================================================
   ACTA — Agent Workspace
   One task, from goal to verified outcome: constraints, live candidates,
   the recommendation, the agent timeline and the action state.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.ACTA;
  var icon = A.icon, esc = A.ui.esc, fmt = A.ui.fmt, store = A.store, views = A.views;

  var params = new URLSearchParams(location.search);
  var taskId = params.get('id');
  var autoRun = params.get('run') === '1';

  var tasks = store.read('tasks') || [];
  var task = tasks.find(function (t) { return t.id === taskId; }) || tasks[0];

  A.ui.mount({
    nav: 'dashboard',
    back: true,
    title: task ? views.stageLabel(task.stage) + ' · ' + task.id : 'Task',
    subtitle: task ? A.ui.status(task.status).label : ''
  });

  if (!task) {
    document.getElementById('taskHead').innerHTML =
      views.empty('inbox', 'Task not found', 'It may have been cleared from local storage.',
        '<a class="btn btn--primary" href="dashboard.html">Back to the command center</a>');
    A.motion.refresh(document);
    return;
  }

  var candidates = A.data.candidatesFor(task.candidateSet);
  var leader = task.topCandidate
    ? A.data.candidateById(task.topCandidate)
    : (candidates[0] || null);

  /* --------------------------------------------------------------- Head */
  function renderHead() {
    var st = A.ui.status(task.status);
    var running = task.status === 'running';

    document.getElementById('taskHead').innerHTML =
      '<div class="task-hero glass-2 glass--edge" data-reveal="scale">' +
        '<div class="row-between" style="margin-bottom:var(--s-3)">' +
          '<span class="chip chip--sm ' + st.chip + '">' +
            (running ? '<span class="pulse-dot pulse-dot--brand"></span>' : '<span class="dot"></span>') +
            st.label + '</span>' +
          '<span class="mono t-2xs faint">' + esc(task.id) + '</span>' +
        '</div>' +
        '<p class="task-hero__intent">' + esc(task.intent) + '</p>' +
        '<div class="row t-2xs mute" style="gap:var(--s-4);margin-top:var(--s-3)">' +
          '<span class="row" style="gap:5px">' + icon('clock') + fmt.ago(task.createdAt) + '</span>' +
          '<span class="row" style="gap:5px">' + icon('calendar') + 'Expires ' + fmt.until(task.deadline) + '</span>' +
        '</div>' +
      '</div>';
  }

  /* ----------------------------------------------------------- Pipeline */
  function renderPipeline() {
    var stages = A.data.STAGES;
    var idx = stages.findIndex(function (s) { return s.id === task.stage; });

    document.getElementById('taskPipeline').innerHTML =
      '<div class="stage-strip" id="stageStrip">' +
        stages.map(function (s, i) {
          var state = i < idx ? 'done' : (i === idx ? 'active' : 'todo');
          return '<span class="stage-pill" data-stage="' + s.id + '" data-state="' + state + '">' + esc(s.label) + '</span>';
        }).join('') +
      '</div>';
    scrollStageIntoView();
  }

  function scrollStageIntoView() {
    var strip = document.getElementById('stageStrip');
    var active = strip && strip.querySelector('[data-state="active"]');
    if (active && strip) {
      strip.scrollTo({ left: Math.max(0, active.offsetLeft - 70), behavior: A.motion.disabled ? 'auto' : 'smooth' });
    }
  }

  /* --------------------------------------------------------------- Goal */
  function renderGoal() {
    var g = task.goal || {};
    var cells = [];
    if (g.budget) cells.push(['Budget', fmt.inr(g.budget)]);
    if (g.nights) cells.push(['Nights', g.nights]);
    if (g.party) cells.push(['Party size', g.party]);
    if (g.time) cells.push(['Time', g.time]);
    if (g.destination) cells.push(['Destination', g.destination]);
    if (g.category) cells.push(['Category', g.category]);
    if (g.size) cells.push(['Size', g.size]);
    cells.push(['Act above', (g.actionThreshold || 90) + ' score']);

    var constraints = g.constraints || [];

    document.getElementById('taskGoal').innerHTML =
      views.sectionHead('Structured goal') +
      '<div class="glass glass--edge pad" data-reveal>' +
        '<div class="goal-grid">' +
          cells.slice(0, 4).map(function (c) {
            return '<div class="goal-cell well"><span>' + esc(c[0]) + '</span><b>' + esc(c[1]) + '</b></div>';
          }).join('') +
        '</div>' +
        (constraints.length ?
          '<div style="margin-top:var(--s-3)">' +
            '<div class="eyebrow" style="margin-bottom:8px">Constraints</div>' +
            '<div class="row wrap" style="gap:5px">' +
              constraints.map(function (c) { return '<span class="chip chip--sm mono">' + esc(c) + '</span>'; }).join('') +
            '</div>' +
          '</div>' : '') +
        '<button class="btn btn--ghost btn--sm btn--block" style="margin-top:var(--s-4)" id="showJson">' +
          icon('brain') + 'View the parsed goal object</button>' +
      '</div>';

    document.getElementById('showJson').addEventListener('click', function () {
      A.ui.sheet({
        title: 'Goal object',
        html: '<p class="t-sm mute" style="margin-bottom:var(--s-3)">' +
                'This is what the intent extractor hands to the planner. Everything downstream — ' +
                'search, scoring, policy — reads these fields, not the original sentence.</p>' +
              '<pre class="code">' + esc(JSON.stringify({
                task_id: task.id, vertical: task.vertical, intent: task.intent,
                goal: task.goal, stage: task.stage, status: task.status
              }, null, 2)) + '</pre>' +
              '<button class="btn btn--primary btn--block" style="margin-top:var(--s-4)" data-sheet-close>Close</button>'
      });
    });
  }

  /* ---------------------------------------------------- Recommendation */
  function renderRecommendation() {
    var host = document.getElementById('taskRecommendation');

    if (!leader || task.status === 'running') {
      host.innerHTML = views.sectionHead('Recommendation') +
        '<div class="glass glass--edge pad" data-reveal>' +
          '<div class="row" style="gap:var(--s-3)">' +
            '<div class="skeleton" style="width:62px;height:62px;border-radius:14px"></div>' +
            '<div class="grow stack-sm">' +
              '<div class="skeleton" style="height:13px;width:72%"></div>' +
              '<div class="skeleton" style="height:11px;width:48%"></div>' +
              '<div class="skeleton" style="height:11px;width:60%"></div>' +
            '</div>' +
          '</div>' +
          '<div class="t-xs mute center" style="margin-top:var(--s-4)">Searching supported providers…</div>' +
        '</div>';
      return;
    }

    var others = candidates.filter(function (c) { return c.id !== leader.id; }).slice(0, 2);

    host.innerHTML =
      views.sectionHead('Recommendation', 'Compare all', 'discover.html?set=' + encodeURIComponent(task.candidateSet)) +
      '<div class="stack">' +
        views.candidateCard(leader, { lead: true }) +
        (others.length
          ? '<div class="eyebrow" style="margin-top:var(--s-2)">Also considered</div>' +
            others.map(function (c) { return views.candidateCard(c); }).join('')
          : '') +
      '</div>';

    views.hydrateScores(host);

    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-inspect]');
      if (!b) return;
      var c = A.data.candidateById(b.getAttribute('data-inspect'));
      if (c) views.explainCandidate(c);
    });
  }

  /* ----------------------------------------------------------- Timeline */
  function renderTimeline() {
    document.getElementById('taskTimeline').innerHTML =
      '<div class="row-between" style="margin-bottom:var(--s-3)">' +
        '<h3 class="t-md w-600">Agent timeline</h3>' +
        '<button class="btn btn--sm btn--ghost" id="replayBtn">' + icon('refresh') + 'Replay</button>' +
      '</div>' +
      '<div class="glass glass--edge pad" data-reveal>' +
        '<div class="timeline-wrap"><ul class="timeline" id="timeline"></ul></div>' +
      '</div>';

    document.getElementById('replayBtn').addEventListener('click', function () {
      startRun(true);
    });
  }

  /* ------------------------------------------------------- Action dock */
  function renderAction() {
    var host = document.getElementById('taskAction');
    var approval = (store.read('approvals') || []).find(function (a) {
      return a.taskId === task.id && a.status === 'pending';
    });

    if (task.status === 'awaiting_approval' && approval) {
      host.innerHTML =
        '<div class="action-dock glass-3 glass--edge glass--tint-warn" data-reveal>' +
          '<div class="row" style="gap:var(--s-3);margin-bottom:var(--s-3)">' +
            '<span class="icon-tile icon-tile--warn">' + icon('shield') + '</span>' +
            '<div class="grow">' +
              '<div class="w-600 t-sm">Approval required</div>' +
              '<div class="t-xs mute">' + esc(approval.policyRule) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="row-between well pad-sm" style="margin-bottom:var(--s-3)">' +
            '<span class="t-xs mute">' + esc(approval.title) + '</span>' +
            '<span class="display w-600">' + fmt.inr(approval.amount, { freeLabel: 'No charge' }) + '</span>' +
          '</div>' +
          '<div class="row" style="gap:var(--s-2)">' +
            '<button class="btn btn--primary grow" id="approveNow">Approve &amp; execute</button>' +
            '<a class="btn" href="approvals.html">Details</a>' +
          '</div>' +
        '</div>';

      document.getElementById('approveNow').addEventListener('click', function () {
        executeAction(approval);
      });
      return;
    }

    if (task.status === 'monitoring') {
      var m = (store.read('monitors') || []).find(function (x) { return x.taskId === task.id; });
      host.innerHTML =
        '<div class="action-dock glass-2 glass--edge" data-reveal>' +
          '<div class="row" style="gap:var(--s-3);margin-bottom:var(--s-3)">' +
            '<span class="icon-tile icon-tile--cyan">' + icon('radar') + '</span>' +
            '<div class="grow">' +
              '<div class="w-600 t-sm">Monitoring for the trigger</div>' +
              '<div class="t-xs mute">' + (m ? esc(m.condition) + ' · next check ' + fmt.until(m.nextCheck) : 'Watching for a better price.') + '</div>' +
            '</div>' +
          '</div>' +
          '<a class="btn btn--block" href="monitoring.html">Manage this monitor</a>' +
        '</div>';
      return;
    }

    if (task.status === 'completed') {
      var order = (store.read('orders') || []).find(function (o) { return o.taskId === task.id; });
      host.innerHTML =
        '<div class="action-dock glass-2 glass--edge glass--tint-ok" data-reveal>' +
          '<div class="row" style="gap:var(--s-3)">' +
            '<span class="icon-tile icon-tile--ok">' + icon('check') + '</span>' +
            '<div class="grow">' +
              '<div class="w-600 t-sm">Executed and verified</div>' +
              '<div class="t-xs mute">' + (order ? 'Reference ' + esc(order.ref) : 'Outcome confirmed with the provider.') + '</div>' +
            '</div>' +
          '</div>' +
          '<a class="btn btn--block" style="margin-top:var(--s-3)" href="orders.html">View the record</a>' +
        '</div>';
      return;
    }

    if (task.status === 'failed') {
      host.innerHTML =
        '<div class="action-dock glass-2 glass--edge glass--tint-danger" data-reveal>' +
          '<div class="row" style="gap:var(--s-3);margin-bottom:var(--s-3)">' +
            '<span class="icon-tile icon-tile--danger">' + icon('alert') + '</span>' +
            '<div class="grow">' +
              '<div class="w-600 t-sm">Stopped before acting</div>' +
              '<div class="t-xs mute">' + esc(task.note) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="row" style="gap:var(--s-2)">' +
            '<button class="btn btn--primary grow" id="retryTask">Retry the run</button>' +
            '<a class="btn" href="activity.html">Audit</a>' +
          '</div>' +
        '</div>';

      document.getElementById('retryTask').addEventListener('click', function () {
        store.patchIn('tasks', task.id, { status: 'running', stage: 'understand', progress: 0.05 });
        task.status = 'running'; task.stage = 'understand';
        renderHead(); renderPipeline(); renderAction();
        startRun(true);
        A.ui.toast('Retrying with a fresh plan', { tone: 'ok', icon: 'refresh' });
      });
      return;
    }

    /* Running */
    host.innerHTML =
      '<div class="action-dock glass-2 glass--edge" data-reveal>' +
        '<div class="row" style="gap:var(--s-3)">' +
          '<span class="spinner"></span>' +
          '<div class="grow">' +
            '<div class="w-600 t-sm">Agent is working</div>' +
            '<div class="t-xs mute">Nothing is committed until an action is prepared and policy-checked.</div>' +
          '</div>' +
          '<button class="btn btn--sm btn--ghost" id="skipRun">Skip</button>' +
        '</div>' +
      '</div>';

    var skip = document.getElementById('skipRun');
    if (skip) skip.addEventListener('click', function () { if (runner) runner.skip(); });
  }

  /* -------------------------------------------------- Execute an action */
  function executeAction(approval) {
    A.ui.haptic(20);
    store.patchIn('approvals', approval.id, { status: 'approved', decidedAt: Date.now() });

    var html =
      '<div class="center stack" style="align-items:center">' +
        '<div id="execRing"></div>' +
        '<div class="w-600" id="execLabel">Executing…</div>' +
        '<div class="t-xs mute" id="execSub">Running the approved action with an idempotency key.</div>' +
      '</div>' +
      '<ul class="timeline" id="execSteps" style="margin-top:var(--s-5)"></ul>';

    var sheetEl = A.ui.sheet({ title: 'Action', html: html });
    A.motion.drawScoreRing(sheetEl.querySelector('#execRing'), 0, { size: 64, stroke: 5 });

    var steps = [
      ['Action dispatched to Sandbox Travel', 'tl-item--done'],
      ['Provider acknowledged the request', 'tl-item--done'],
      ['Confirmation reference ST-44190 received', 'tl-item--done'],
      ['State verified against the provider', 'tl-item--done']
    ];

    var list = sheetEl.querySelector('#execSteps');
    var i = 0;

    (function tick() {
      if (i >= steps.length) return finish();
      var li = document.createElement('li');
      li.className = 'tl-item item-in ' + steps[i][1];
      li.innerHTML = '<div class="tl-item__title t-xs">' + esc(steps[i][0]) + '</div>' +
                     '<div class="tl-item__time">' + fmt.clock(Date.now()) + '</div>';
      list.appendChild(li);
      A.motion.drawScoreRing(sheetEl.querySelector('#execRing'),
        Math.round(((i + 1) / steps.length) * 100), { size: 64, stroke: 5 });
      i++;
      setTimeout(tick, 780);
    })();

    function finish() {
      sheetEl.querySelector('#execLabel').textContent = 'Executed successfully';
      sheetEl.querySelector('#execSub').textContent = 'Simulated transaction · reference ST-44190';

      store.patchIn('tasks', task.id, { status: 'completed', stage: 'verify', progress: 1,
        note: 'Executed and verified. Reference ST-44190.' });

      store.push('orders', {
        id: 'o-' + Math.floor(500 + Math.random() * 499),
        actionId: approval.actionId, taskId: task.id, status: 'confirmed',
        title: approval.title.replace(/^(Book|Purchase|Reserve)\s+/i, ''),
        vendor: approval.vendor, emoji: approval.emoji,
        amount: approval.amount, currency: 'INR', ref: 'ST-44190',
        placedAt: Date.now(), verifiedAt: Date.now() + 40000,
        kind: 'booking', simulated: true,
        steps: steps.map(function (s, n) { return [s[0], Date.now() + n * 12000]; })
      });

      store.push('events', {
        id: 'e-' + Date.now(), taskId: task.id, type: 'action.verified', level: 'ok',
        label: 'Action executed and verified', detail: 'ref ST-44190 · state=confirmed', at: Date.now()
      });

      A.ui.toast('Executed successfully', { tone: 'ok', icon: 'check' });

      setTimeout(function () {
        A.ui.closeSheet();
        task.status = 'completed'; task.stage = 'verify';
        renderHead(); renderPipeline(); renderAction();
      }, 1100);
    }
  }

  /* ------------------------------------------------------------ The run */
  var runner = null;

  function startRun(force) {
    var timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    var goal = {
      vertical: task.vertical,
      budget: task.goal && task.goal.budget,
      constraints: (task.goal && task.goal.constraints) || [],
      actionThreshold: (task.goal && task.goal.actionThreshold) || 90,
      confidence: 94
    };

    var script = task.vertical === 'travel' && !force && !task.fresh
      ? A.data.AGENT_SCRIPT
      : A.agent.scriptFor(goal);

    if (force) { task.status = 'running'; renderAction(); }

    runner = A.agent.run({
      timeline: timeline,
      script: script,
      autoscroll: false,
      onStage: function (stageId) {
        task.stage = stageId;
        renderPipeline();
        var idx = A.data.STAGES.findIndex(function (s) { return s.id === stageId; });
        store.patchIn('tasks', task.id, { stage: stageId, progress: (idx + 1) / A.data.STAGES.length });
      },
      onStep: function (step) {
        if (step.stage === 'decide' && step.kind === 'ok') {
          leader = candidates[0] || null;
          var saved = task.status;
          task.status = 'ranked';
          renderRecommendation();
          task.status = saved;
        }
      },
      onDone: function () {
        var last = script[script.length - 1];
        var ends = last && last.kind === 'approval' ? 'awaiting_approval' : 'monitoring';

        task.status = ends;
        task.fresh = false;
        store.patchIn('tasks', task.id, { status: ends, fresh: false, progress: ends === 'awaiting_approval' ? 0.84 : 0.62 });

        if (ends === 'awaiting_approval' && !(store.read('approvals') || []).some(function (a) { return a.taskId === task.id && a.status === 'pending'; })) {
          store.push('approvals', {
            id: 'a-' + Math.floor(80 + Math.random() * 900),
            actionId: 'act-' + Math.floor(300 + Math.random() * 99),
            taskId: task.id, status: 'pending',
            title: (task.vertical === 'travel' ? 'Book ' : task.vertical === 'reservation' ? 'Reserve ' : 'Purchase ') + (leader ? leader.title : 'the recommendation'),
            vendor: leader ? leader.provider : 'Mock Commerce',
            emoji: leader ? leader.emoji : '🛒',
            amount: leader ? leader.price : 0,
            currency: 'INR',
            risk: leader && leader.price > 10000 ? 'high' : 'medium',
            policyRule: 'Spend limit — auto-buy up to ' + fmt.inr(store.read('policy.autoSpendLimit')) + '; ask above it',
            reason: 'Score ' + (leader ? leader.score : '—') + ' cleared the ' + goal.actionThreshold + ' threshold. Amount exceeds the auto-spend limit.',
            detail: leader ? [leader.attrs.join(' · '), leader.policy, leader.ship] : [],
            createdAt: Date.now(), expiresAt: Date.now() + 3600000, simulated: true
          });
        }

        renderHead(); renderPipeline(); renderRecommendation(); renderAction();
        A.ui.haptic(16);
      }
    });
  }

  /* ------------------------------------------------------------- Render */
  renderHead();
  renderPipeline();
  renderGoal();
  renderRecommendation();
  renderTimeline();
  renderAction();

  if (autoRun || task.status === 'running') {
    startRun(false);
  } else {
    /* Replay the finished run instantly so the timeline is never empty. */
    var timeline = document.getElementById('timeline');
    var goalLike = { vertical: task.vertical, budget: task.goal && task.goal.budget,
                     constraints: (task.goal && task.goal.constraints) || [],
                     actionThreshold: (task.goal && task.goal.actionThreshold) || 90, confidence: 94 };
    var past = task.vertical === 'travel' ? A.data.AGENT_SCRIPT : A.agent.scriptFor(goalLike);
    timeline.innerHTML = past.map(function (s, i) {
      var cls = i === past.length - 1
        ? (task.status === 'failed' ? 'tl-item--fail' : task.status === 'awaiting_approval' ? 'tl-item--wait' : 'tl-item--done')
        : 'tl-item--done';
      return '<li class="tl-item ' + cls + '" data-reveal>' +
        '<div class="row-between" style="align-items:flex-start;gap:var(--s-3)">' +
          '<div class="grow"><div class="tl-item__title">' + esc(s.title) + '</div>' +
          '<div class="tl-item__body">' + esc(s.body) + '</div></div>' +
          '<span class="tl-item__time">' + fmt.time(task.createdAt + i * 60000) + '</span>' +
        '</div></li>';
    }).join('');
  }

  A.motion.refresh(document);
})();

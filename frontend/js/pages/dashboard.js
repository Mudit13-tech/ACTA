/* ==========================================================================
   ACTA — Command Center
   Start tasks, see live activity, jump into anything that needs you.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.ACTA;
  var icon = A.icon, esc = A.ui.esc, fmt = A.ui.fmt, store = A.store, views = A.views;

  A.ui.mount({ nav: 'dashboard' });

  var state = store.get();

  /* ------------------------------------------------------------ Greeting */
  function hourGreeting() {
    var h = new Date().getHours();
    if (h < 5) return 'Still up';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  document.getElementById('greeting').innerHTML =
    '<div class="greeting" data-reveal>' +
      '<div class="greeting__date">' +
        new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) +
      '</div>' +
      '<h2>' + hourGreeting() + ', ' + esc(state.prefs.name) + '.</h2>' +
      '<p class="soft t-sm" style="margin-top:6px">What should the agent take care of?</p>' +
    '</div>';

  /* ------------------------------------------------------------ Composer */
  var SUGGESTIONS = [
    'Find a well-rated Goa hotel under ₹15,000 for 3 nights near the beach',
    'Find the best 27-inch monitor under ₹20,000',
    'Reserve a table for 4 tomorrow at 8 PM under ₹5,000',
    'Watch the Sony WH-1000XM5 and tell me if it drops below ₹24,000'
  ];

  document.getElementById('composer').innerHTML =
    '<div class="composer-wrap" data-reveal="scale">' +
      '<div class="composer glass-2 glass--edge">' +
        '<div class="composer__row">' +
          '<textarea class="composer__input" id="taskInput" rows="1" ' +
            'placeholder="Tell the agent what you want…" ' +
            'aria-label="Describe your task in plain language"></textarea>' +
          '<button class="composer__send" id="taskSend" aria-label="Start task">' + icon('send', 'icon--fill') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="suggestions" id="suggestions">' +
        SUGGESTIONS.map(function (s, i) {
          return '<button class="chip" data-suggestion="' + i + '">' + icon('sparkle') +
                 esc(s.length > 34 ? s.slice(0, 32) + '…' : s) + '</button>';
        }).join('') +
      '</div>' +
    '</div>';

  var input = document.getElementById('taskInput');

  /* Grow the textarea with its content, up to the CSS max-height. */
  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 132) + 'px';
  }
  input.addEventListener('input', autosize);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });

  document.getElementById('taskSend').addEventListener('click', submit);

  document.getElementById('suggestions').addEventListener('click', function (e) {
    var b = e.target.closest('[data-suggestion]');
    if (!b) return;
    input.value = SUGGESTIONS[parseInt(b.getAttribute('data-suggestion'), 10)];
    autosize();
    input.focus();
    A.ui.haptic();
  });

  function submit() {
    var text = input.value.trim();
    if (!text) {
      input.focus();
      A.ui.toast('Describe what you want first', { tone: 'warn' });
      return;
    }

    var goal = A.agent.parseIntent(text);
    var id = 't-' + Math.floor(1000 + Math.random() * 8999);

    store.push('tasks', {
      id: id,
      vertical: goal.vertical,
      status: 'running',
      intent: text,
      goal: {
        budget: goal.budget,
        currency: 'INR',
        nights: goal.nights,
        party: goal.party,
        time: goal.time,
        constraints: goal.constraints,
        actionThreshold: goal.actionThreshold
      },
      stage: 'understand',
      progress: 0.05,
      createdAt: Date.now(),
      deadline: Date.now() + 2 * 24 * 3600 * 1000,
      candidateSet: goal.vertical,
      topCandidate: null,
      note: 'Agent run started from the command center.',
      fresh: true
    });

    store.push('events', {
      id: 'e-' + Date.now(),
      taskId: id,
      type: 'task.created',
      level: 'info',
      label: 'Task created from natural language',
      detail: 'confidence=' + goal.confidence + '% · vertical=' + goal.vertical,
      at: Date.now()
    });

    A.ui.haptic(14);
    A.ui.toast('Task created — planning now', { tone: 'ok', icon: 'bolt' });
    A.ui.navigateTo('task.html?id=' + id + '&run=1');
  }

  /* --------------------------------------------------------- Quick stats */
  var tasks = state.tasks || [];
  var monitors = state.monitors || [];
  var approvals = state.approvals || [];
  var orders = state.orders || [];

  var activeCount = tasks.filter(function (t) {
    return t.status === 'running' || t.status === 'monitoring' || t.status === 'awaiting_approval';
  }).length;
  var pendingApprovals = approvals.filter(function (a) { return a.status === 'pending'; }).length;
  var activeMonitors = monitors.filter(function (m) { return m.active; }).length;
  var saved = monitors.reduce(function (sum, m) { return sum + Math.max(0, m.start - m.current); }, 0);

  document.getElementById('quickStats').innerHTML =
    '<div class="stat-grid" data-stagger="60">' +
      statTile('Active tasks', activeCount, 'bolt', 'brand', activeCount ? 'Agent is working' : 'Nothing running') +
      statTile('Watching', activeMonitors, 'radar', 'cyan', activeMonitors + ' live conditions') +
      statTile('Approvals', pendingApprovals, 'shield', pendingApprovals ? 'warn' : 'ok', pendingApprovals ? 'Waiting on you' : 'All clear') +
      statTile('Tracked savings', saved, 'trend', 'ok', 'Since monitoring began', true) +
    '</div>';

  function statTile(label, value, iconName, tone, sub, money) {
    return '<div class="stat glass glass--edge">' +
      '<div class="stat__top">' +
        '<span class="stat__label">' + esc(label) + '</span>' +
        '<span class="icon-tile icon-tile--' + tone + '" style="width:28px;height:28px;border-radius:9px">' +
          icon(iconName) + '</span>' +
      '</div>' +
      '<div class="stat__value" data-count="' + value + '"' +
        (money ? ' data-count-prefix="₹"' : '') + '>0</div>' +
      '<div class="t-2xs mute">' + esc(sub) + '</div>' +
    '</div>';
  }

  /* --------------------------------------------------------- Alert cards */
  var alerts = [];

  if (pendingApprovals) {
    var a = approvals.find(function (x) { return x.status === 'pending'; });
    alerts.push(
      '<a class="alert-card glass-2 glass--edge glass--tint-warn card--tap" href="approvals.html" data-reveal>' +
        '<span class="icon-tile icon-tile--warn">' + icon('shield') + '</span>' +
        '<div class="alert-card__body">' +
          '<h4>' + pendingApprovals + (pendingApprovals === 1 ? ' action needs' : ' actions need') + ' your approval</h4>' +
          '<p>' + esc(a.title) + ' · ' + fmt.inr(a.amount, { freeLabel: 'no charge' }) + ' · ' + esc(a.policyRule.split('—')[0].trim()) + '</p>' +
        '</div>' +
        '<span class="chev"></span>' +
      '</a>');
  }

  var triggered = monitors.filter(function (m) { return m.active && m.current <= m.target; });
  if (triggered.length) {
    alerts.push(
      '<a class="alert-card glass-2 glass--edge glass--tint-ok card--tap" href="monitoring.html" data-reveal>' +
        '<span class="icon-tile icon-tile--ok">' + icon('trend') + '</span>' +
        '<div class="alert-card__body">' +
          '<h4>' + triggered.length + ' monitor condition met</h4>' +
          '<p>' + esc(triggered[0].label) + ' hit ' + fmt.inr(triggered[0].current) + '</p>' +
        '</div>' +
        '<span class="chev"></span>' +
      '</a>');
  }

  var failed = tasks.filter(function (t) { return t.status === 'failed'; });
  if (failed.length) {
    alerts.push(
      '<a class="alert-card glass glass--edge card--tap" href="task.html?id=' + esc(failed[0].id) + '" data-reveal>' +
        '<span class="icon-tile icon-tile--danger">' + icon('alert') + '</span>' +
        '<div class="alert-card__body">' +
          '<h4>A task stopped instead of guessing</h4>' +
          '<p>' + esc(failed[0].note) + '</p>' +
        '</div>' +
        '<span class="chev"></span>' +
      '</a>');
  }

  document.getElementById('alerts').innerHTML = alerts.length
    ? '<div class="stack">' + alerts.join('') + '</div>'
    : '';

  /* --------------------------------------------------------- Active tasks */
  var shown = tasks.slice(0, 4);
  document.getElementById('activeTasks').innerHTML =
    views.sectionHead('Your tasks', tasks.length > 4 ? 'View all' : '', 'activity.html') +
    (shown.length
      ? '<div class="stack">' + shown.map(function (t) { return views.taskCard(t); }).join('') + '</div>'
      : views.empty('inbox', 'No tasks yet',
          'Describe a goal above and the agent will plan, search and come back with a ranked recommendation.'));

  /* ------------------------------------------------------ Activity preview */
  var events = (state.events || []).slice(0, 4);
  document.getElementById('activityPreview').innerHTML =
    views.sectionHead('Agent activity', 'Full audit', 'activity.html') +
    '<div class="glass glass--edge pad" data-reveal>' +
      '<ul class="timeline">' + events.map(views.eventItem).join('') + '</ul>' +
    '</div>';

  /* ------------------------------------------------------------- Wire up */
  A.motion.refresh(document);
  autosize();
})();

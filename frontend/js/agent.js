/* ==========================================================================
   ACTA — Agent run engine (front-end simulation)
   Streams a scripted observe → reason → act → verify loop into a timeline,
   emitting the same events the real orchestrator would push over SSE.
   Swap `run()` for an EventSource and the UI is unchanged.
   ========================================================================== */
(function (global) {
  'use strict';

  var A = global.ACTA;
  var icon = A.icon, esc = A.ui.esc, fmt = A.ui.fmt;

  var KIND = {
    json:       { tone: 'brand',  icon: 'brain'  },
    tool:       { tone: 'cyan',   icon: 'link'   },
    candidates: { tone: 'brand',  icon: 'layers' },
    score:      { tone: 'brand',  icon: 'trend'  },
    ok:         { tone: 'ok',     icon: 'check'  },
    warn:       { tone: 'warn',   icon: 'shield' },
    approval:   { tone: 'warn',   icon: 'shield' },
    fail:       { tone: 'danger', icon: 'alert'  }
  };

  /**
   * Run a scripted agent loop.
   * @param {Object} o
   *   o.timeline   {HTMLElement} ordered list to append steps to
   *   o.script     {Array}       steps (defaults to the demo travel script)
   *   o.onStage    {Function}    (stageId, step, index) => void
   *   o.onStep     {Function}    (step, index) => void
   *   o.onDone     {Function}    () => void
   *   o.speed      {Number}      multiplier, 1 = scripted timing
   * @returns {{stop: Function, skip: Function}}
   */
  function run(o) {
    var script = o.script || A.data.AGENT_SCRIPT;
    var timeline = o.timeline;
    var speed = o.speed || 1;
    var i = 0;
    var timer = null;
    var stopped = false;
    var lastStage = null;

    function emit(step, index) {
      var meta = KIND[step.kind] || { tone: 'brand', icon: 'bolt' };
      var li = document.createElement('li');
      li.className = 'tl-item tl-item--active item-in';
      li.innerHTML =
        '<div class="row-between" style="align-items:flex-start;gap:var(--s-3)">' +
          '<div class="grow">' +
            '<div class="row" style="gap:7px">' +
              '<span style="color:var(--' + (meta.tone === 'ok' ? 'ok-400' : meta.tone === 'warn' ? 'warn-400' : meta.tone === 'danger' ? 'danger-400' : meta.tone === 'cyan' ? 'cyan-400' : 'brand-300') + ')">' +
                icon(meta.icon) + '</span>' +
              '<span class="tl-item__title">' + esc(step.title) + '</span>' +
            '</div>' +
            '<div class="tl-item__body" data-typed></div>' +
          '</div>' +
          '<span class="tl-item__time">' + fmt.clock(Date.now()) + '</span>' +
        '</div>' +
        (step.payload ? '<pre class="code" style="margin-top:9px">' + esc(step.payload) + '</pre>' : '');

      /* Previous step is finished the moment a new one starts. */
      var prev = timeline.querySelector('.tl-item--active');
      if (prev) { prev.classList.remove('tl-item--active'); prev.classList.add('tl-item--done'); }

      timeline.appendChild(li);

      var body = li.querySelector('[data-typed]');
      A.motion.typeInto(body, step.body, { speed: 12 });

      if (o.autoscroll !== false) {
        li.scrollIntoView({ behavior: A.motion.disabled ? 'auto' : 'smooth', block: 'nearest' });
      }

      if (step.stage !== lastStage) {
        lastStage = step.stage;
        if (o.onStage) o.onStage(step.stage, step, index);
      }
      if (o.onStep) o.onStep(step, index, li);
      A.ui.haptic(6);
    }

    function next() {
      if (stopped) return;
      if (i >= script.length) {
        var last = timeline.querySelector('.tl-item--active');
        if (last) {
          last.classList.remove('tl-item--active');
          var terminal = script[script.length - 1];
          last.classList.add(terminal && terminal.kind === 'approval' ? 'tl-item--wait' : 'tl-item--done');
        }
        if (o.onDone) o.onDone();
        return;
      }
      var step = script[i];
      emit(step, i);
      i++;
      timer = setTimeout(next, Math.max(220, (step.ms || 800) / speed));
    }

    timer = setTimeout(next, o.delay === undefined ? 320 : o.delay);

    return {
      stop: function () { stopped = true; clearTimeout(timer); },
      skip: function () {
        clearTimeout(timer);
        while (i < script.length) { emit(script[i], i); i++; }
        var last = timeline.querySelector('.tl-item--active');
        if (last) { last.classList.remove('tl-item--active'); last.classList.add('tl-item--done'); }
        if (o.onDone) o.onDone();
      }
    };
  }

  /* --------------------------------------------------------------------
     Intent parsing — a deliberately small rule-based stand-in for the LLM
     extractor. Good enough to make the demo feel responsive, and it shows
     the shape of the structured Goal object the real parser must return.
     -------------------------------------------------------------------- */
  var VERTICAL_HINTS = [
    { id: 'travel',      re: /\b(hotel|stay|resort|trip|goa|manali|nights?|room|flight|travel|villa)\b/i },
    { id: 'reservation', re: /\b(table|restaurant|reserve|reservation|dinner|lunch|book a table|seats?)\b/i },
    { id: 'shopping',    re: /\b(buy|monitor|laptop|phone|headphones?|keyboard|purchase|deal|shop|under\s*(rs|₹))\b/i }
  ];

  function parseIntent(text) {
    var t = String(text || '').trim();

    /* Budget: "under 20000", "₹15,000", "rs. 5000", "20k" */
    var budget = null;
    var kMatch = t.match(/(?:under|below|within|upto|up to|max|₹|rs\.?\s*)\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|lakh|l)?/i);
    if (kMatch) {
      budget = parseFloat(kMatch[1].replace(/,/g, ''));
      var unit = (kMatch[2] || '').toLowerCase();
      if (unit === 'k' || unit === 'thousand') budget *= 1000;
      if (unit === 'lakh' || unit === 'l') budget *= 100000;
    }

    var vertical = 'shopping';
    for (var i = 0; i < VERTICAL_HINTS.length; i++) {
      if (VERTICAL_HINTS[i].re.test(t)) { vertical = VERTICAL_HINTS[i].id; break; }
    }

    var nights = (t.match(/(\d+)\s*nights?/i) || [])[1];
    var party = (t.match(/(?:for|table for|party of)\s*(\d+)\b/i) || [])[1];
    var time = (t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) || null);

    var constraints = [];
    if (/free cancel|refundable/i.test(t)) constraints.push('free_cancellation');
    if (/beach/i.test(t)) constraints.push('near_beach');
    if (/well[- ]rated|good|best|top/i.test(t)) constraints.push('rating>=4.3');
    if (/fast|quick|today|tomorrow|asap/i.test(t)) constraints.push('fast_delivery');
    if (/\b(\d{2})\s*inch|\b(\d{2})"/i.test(t)) constraints.push('size_match');

    return {
      vertical: vertical,
      intent: t,
      budget: budget,
      currency: 'INR',
      nights: nights ? parseInt(nights, 10) : null,
      party: party ? parseInt(party, 10) : null,
      time: time ? (time[1] + ':' + (time[2] || '00') + ' ' + time[3].toUpperCase()) : null,
      constraints: constraints,
      actionThreshold: 90,
      confidence: Math.min(97, 62 + constraints.length * 7 + (budget ? 14 : 0))
    };
  }

  /* Build a bespoke script from a parsed goal so any typed task animates. */
  function scriptFor(goal) {
    var set = goal.vertical;
    var candidates = A.data.candidatesFor(set);
    var leader = candidates[0];
    var money = goal.budget ? fmt.inr(goal.budget) : 'no stated cap';
    var toolName = set === 'travel' ? 'sandbox_travel.search'
                 : set === 'reservation' ? 'tableline.availability'
                 : 'mock_commerce.search';

    return [
      { stage: 'understand', title: 'Parsed the goal', kind: 'json', ms: 900,
        body: 'Extracted vertical, budget and constraints at ' + goal.confidence + '% confidence.',
        payload: JSON.stringify({
          vertical: goal.vertical,
          budget: goal.budget ? { amount: goal.budget, currency: 'INR' } : null,
          constraints: goal.constraints,
          action_threshold: goal.actionThreshold
        }, null, 2) },
      { stage: 'understand', title: 'Planned the run', ms: 650,
        body: 'Four subtasks queued and two tools selected from the registry.' },
      { stage: 'discover', title: 'Called ' + toolName, kind: 'tool', ms: 1000,
        body: 'Querying supported providers for candidates inside ' + money + '.' },
      { stage: 'discover', title: 'Collected ' + candidates.length + ' candidates', kind: 'candidates', ms: 750,
        body: candidates.map(function (c) { return c.title; }).join(' · ') + '.' },
      { stage: 'evaluate', title: 'Normalised the set', ms: 850,
        body: 'Prices, policies and attributes mapped into one comparable schema.' },
      { stage: 'decide', title: 'Scored and ranked', kind: 'score', ms: 950,
        body: candidates.slice(0, 3).map(function (c) { return c.title.split(',')[0] + ' ' + c.score; }).join(' · ') + '.' },
      { stage: 'decide', title: 'Recommendation ready', kind: 'ok', ms: 700,
        body: leader ? leader.title + ' at ' + fmt.inr(leader.price, { freeLabel: 'no deposit' }) + ' leads with a score of ' + leader.score + '.' : 'No candidate cleared the hard constraints.' },
      { stage: 'act', title: leader && leader.score >= goal.actionThreshold ? 'Prepared the action' : 'Holding for a better option',
        kind: leader && leader.score >= goal.actionThreshold ? 'tool' : 'warn', ms: 900,
        body: leader && leader.score >= goal.actionThreshold
          ? 'Checkout prepared with an idempotency key. Nothing is committed yet.'
          : 'Top score is below your ' + goal.actionThreshold + ' threshold, so the task moves to monitoring instead.' },
      { stage: leader && leader.score >= goal.actionThreshold ? 'act' : 'monitor',
        title: leader && leader.score >= goal.actionThreshold ? 'Policy check — approval required' : 'Monitor armed',
        kind: leader && leader.score >= goal.actionThreshold ? 'approval' : 'ok', ms: 800,
        body: leader && leader.score >= goal.actionThreshold
          ? 'Amount exceeds your auto-spend limit, so the action is waiting on you.'
          : 'Re-checking every 15 minutes until the condition is met or the task expires.' }
    ];
  }

  A.agent = { run: run, parseIntent: parseIntent, scriptFor: scriptFor };
})(window);

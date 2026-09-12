/* ==========================================================================
   ACTA — Settings
   Autonomy is the product, so this page is where the user actually shapes
   how much the agent may do alone.
   ========================================================================== */
(function () {
  'use strict';

  var A = window.ACTA;
  var icon = A.icon, esc = A.ui.esc, fmt = A.ui.fmt, store = A.store, views = A.views;

  A.ui.mount({ nav: 'more', back: true, title: 'Settings', subtitle: 'Autonomy & personalisation' });

  var policy = store.read('policy');
  var prefs = store.read('prefs');

  /* ------------------------------------------------------------ Profile */
  document.getElementById('settingsProfile').innerHTML =
    '<div class="glass-2 glass--edge pad" data-reveal="scale">' +
      '<div class="row" style="gap:var(--s-3)">' +
        '<span class="icon-tile icon-tile--brand" style="width:52px;height:52px;border-radius:17px">' + icon('user') + '</span>' +
        '<div class="grow">' +
          '<div class="w-600">' + esc(prefs.name) + '</div>' +
          '<div class="t-xs mute">Autonomy: ' + autonomyLabel() + '</div>' +
        '</div>' +
        '<span class="chip chip--sm chip--ok"><span class="dot"></span>Policy active</span>' +
      '</div>' +
    '</div>';

  function autonomyLabel() {
    var allowed = Object.keys(policy.categories).filter(function (k) { return policy.categories[k]; }).length;
    if (policy.autoSpendLimit >= 10000 && allowed >= 3) return 'High';
    if (policy.autoSpendLimit >= 2000) return 'Balanced';
    return 'Cautious';
  }

  /* ----------------------------------------------------------- Autonomy */
  function renderAutonomy() {
    document.getElementById('settingsAutonomy').innerHTML =
      views.sectionHead('Spend policy') +
      '<div class="glass glass--edge pad" data-reveal>' +

        '<div class="center" style="margin-bottom:var(--s-4)">' +
          '<div class="eyebrow">Act alone up to</div>' +
          '<div class="limit-display" id="limitOut">' + fmt.inr(policy.autoSpendLimit) + '</div>' +
          '<div class="t-xs mute" style="margin-top:2px">Above this, the agent asks first.</div>' +
        '</div>' +

        '<input class="range" type="range" id="limitRange" min="0" max="20000" step="250" value="' + policy.autoSpendLimit + '" ' +
          'aria-label="Auto-spend limit">' +
        '<div class="row-between t-2xs faint" style="margin-top:6px">' +
          '<span>₹0 · always ask</span><span>₹20,000</span>' +
        '</div>' +

        '<div class="glass-divider"></div>' +

        '<div class="field">' +
          '<label class="field__label" for="ceiling">Hard ceiling — never act above this</label>' +
          '<div class="row" style="gap:var(--s-3)">' +
            '<input class="range grow" type="range" id="ceiling" min="5000" max="100000" step="1000" value="' + policy.hardCeiling + '">' +
            '<span class="display w-600 tnum" id="ceilingOut" style="min-width:82px;text-align:right">' + fmt.inr(policy.hardCeiling) + '</span>' +
          '</div>' +
        '</div>' +

        '<div class="glass-divider"></div>' +

        settingRow('freeCancelAutonomous', 'Free cancellations are autonomous',
          'Anything reversible at no cost can proceed without asking.', policy.freeCancelAutonomous) +
        settingRow('escalateOnLowConfidence', 'Stop when confidence is low',
          'An unexpected page change or a weak match halts the run instead of guessing.', policy.escalateOnLowConfidence) +
        settingRow('timeWindowEnabled', 'Only act between ' + esc(policy.timeWindow.from) + ' and ' + esc(policy.timeWindow.to),
          'Outside the window the agent queues actions instead of running them.', policy.timeWindow.enabled) +
      '</div>';

    var range = document.getElementById('limitRange');
    var out = document.getElementById('limitOut');
    range.addEventListener('input', function () {
      out.textContent = parseInt(range.value, 10) === 0 ? 'Always ask' : fmt.inr(parseInt(range.value, 10));
    });
    range.addEventListener('change', function () {
      policy.autoSpendLimit = parseInt(range.value, 10);
      store.set('policy.autoSpendLimit', policy.autoSpendLimit);
      A.ui.haptic();
      A.ui.toast('Auto-spend limit updated', { icon: 'shield' });
    });

    var ceil = document.getElementById('ceiling');
    var ceilOut = document.getElementById('ceilingOut');
    ceil.addEventListener('input', function () { ceilOut.textContent = fmt.inr(parseInt(ceil.value, 10)); });
    ceil.addEventListener('change', function () {
      policy.hardCeiling = parseInt(ceil.value, 10);
      store.set('policy.hardCeiling', policy.hardCeiling);
      A.ui.toast('Hard ceiling updated', { icon: 'lock' });
    });

    A.ui.bindSwitches(document.getElementById('settingsAutonomy'));
  }

  function settingRow(key, title, body, checked) {
    return '<div class="setting-row">' +
      '<div class="setting-row__text"><b>' + esc(title) + '</b><span>' + esc(body) + '</span></div>' +
      '<button class="switch" data-setting="' + key + '" aria-checked="' + (checked ? 'true' : 'false') + '" ' +
        'aria-label="' + esc(title) + '"></button>' +
    '</div>';
  }

  document.getElementById('settingsAutonomy').addEventListener('switch:change', function (e) {
    var sw = e.target.closest('[data-setting]');
    if (!sw) return;
    var key = sw.getAttribute('data-setting');
    var v = e.detail.checked;

    if (key === 'timeWindowEnabled') store.set('policy.timeWindow.enabled', v);
    else store.set('policy.' + key, v);

    A.ui.toast(v ? 'Rule enabled' : 'Rule disabled', { icon: 'shield', tone: v ? 'ok' : 'warn' });
  });

  /* --------------------------------------------------------- Categories */
  var CATEGORY_META = {
    groceries:   { label: 'Groceries',   icon: 'cart',   note: 'Low value, repeat purchases' },
    electronics: { label: 'Electronics', icon: 'bolt',   note: 'High value — usually worth asking' },
    travel:      { label: 'Travel',      icon: 'hotel',  note: 'Bookings and stays' },
    dining:      { label: 'Dining',      icon: 'dining', note: 'Reservations, mostly free to cancel' }
  };

  function renderCategories() {
    document.getElementById('settingsCategories').innerHTML =
      views.sectionHead('Autonomous categories') +
      '<div class="glass glass--edge pad" data-reveal>' +
        Object.keys(CATEGORY_META).map(function (k) {
          var m = CATEGORY_META[k];
          return '<div class="setting-row">' +
            '<span class="icon-tile icon-tile--brand" style="width:34px;height:34px;border-radius:11px">' + icon(m.icon) + '</span>' +
            '<div class="setting-row__text"><b>' + esc(m.label) + '</b><span>' + esc(m.note) + '</span></div>' +
            '<button class="switch" data-category="' + k + '" aria-checked="' + (policy.categories[k] ? 'true' : 'false') + '" ' +
              'aria-label="' + esc(m.label) + '"></button>' +
          '</div>';
        }).join('') +
        '<p class="t-2xs faint" style="margin-top:var(--s-3)">' +
          'A category being on means the agent may act without asking — still inside your spend limit and hard ceiling.' +
        '</p>' +
      '</div>';

    A.ui.bindSwitches(document.getElementById('settingsCategories'));
  }

  document.getElementById('settingsCategories').addEventListener('switch:change', function (e) {
    var sw = e.target.closest('[data-category]');
    if (!sw) return;
    var k = sw.getAttribute('data-category');
    store.set('policy.categories.' + k, e.detail.checked);
    policy.categories[k] = e.detail.checked;
    A.ui.toast(CATEGORY_META[k].label + (e.detail.checked ? ' can run autonomously' : ' now requires approval'),
      { icon: 'shield', tone: e.detail.checked ? 'ok' : 'warn' });
  });

  /* ------------------------------------------------------------ Vendors */
  document.getElementById('settingsVendors').innerHTML =
    views.sectionHead('Approved connectors') +
    '<div class="glass glass--edge pad" data-reveal>' +
      '<p class="t-xs mute" style="margin-bottom:var(--s-3)">' +
        'The agent may only transact with providers on this list. Each connector declares what it can safely do.' +
      '</p>' +
      '<div class="stack-sm">' +
        policy.vendorAllowlist.map(function (v) {
          return '<div class="well pad-sm row">' +
            '<span class="icon-tile icon-tile--cyan" style="width:32px;height:32px;border-radius:10px">' + icon('link') + '</span>' +
            '<div class="grow"><b class="t-sm w-600">' + esc(v) + '</b>' +
            '<div class="t-2xs mute">search · availability · prepare · execute</div></div>' +
            '<span class="chip chip--sm chip--ok"><span class="dot"></span>Allowed</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="well pad-sm row" style="margin-top:var(--s-2);opacity:.6">' +
        '<span class="icon-tile" style="width:32px;height:32px;border-radius:10px">' + icon('lock') + '</span>' +
        '<div class="grow"><b class="t-sm w-600">Everything else</b>' +
        '<div class="t-2xs mute">Blocked — no universal website automation</div></div>' +
      '</div>' +
    '</div>';

  /* --------------------------------------------------------- Appearance */
  function renderAppearance() {
    document.getElementById('settingsAppearance').innerHTML =
      views.sectionHead('Appearance & motion') +
      '<div class="glass glass--edge pad" data-reveal>' +
        '<div class="field" style="margin-bottom:var(--s-4)">' +
          '<span class="field__label">Theme</span>' +
          '<div class="segmented" id="themeSeg">' +
            '<button data-value="dark"' + (prefs.theme === 'dark' ? ' aria-selected="true"' : '') + '>Dark</button>' +
            '<button data-value="light"' + (prefs.theme === 'light' ? ' aria-selected="true"' : '') + '>Light</button>' +
            '<button data-value="system"' + (prefs.theme === 'system' ? ' aria-selected="true"' : '') + '>System</button>' +
          '</div>' +
        '</div>' +

        '<div class="setting-row">' +
          '<div class="setting-row__text"><b>Motion</b>' +
            '<span>Reveals, transitions and the live aurora background.</span></div>' +
          '<button class="switch" data-pref="motion" aria-checked="' + (prefs.motion === 'on' ? 'true' : 'false') + '" aria-label="Motion"></button>' +
        '</div>' +

        '<div class="setting-row">' +
          '<div class="setting-row__text"><b>Reduced blur</b>' +
            '<span>Lighter glass for older phones and longer battery life.</span></div>' +
          '<button class="switch" data-pref="perf" aria-checked="' + (prefs.perf === 'lite' ? 'true' : 'false') + '" aria-label="Reduced blur"></button>' +
        '</div>' +
      '</div>';

    A.ui.segmented(document.getElementById('themeSeg'), function (v) {
      store.set('prefs.theme', v);
      prefs.theme = v;
      A.ui.applyTheme(v);
      A.ui.toast('Theme: ' + v, { icon: v === 'light' ? 'sun' : 'moon' });
    });

    A.ui.bindSwitches(document.getElementById('settingsAppearance'));
  }

  document.getElementById('settingsAppearance').addEventListener('switch:change', function (e) {
    var sw = e.target.closest('[data-pref]');
    if (!sw) return;
    var key = sw.getAttribute('data-pref');

    if (key === 'motion') {
      var v = e.detail.checked ? 'on' : 'off';
      store.set('prefs.motion', v);
      A.ui.applyMotion();
      A.ui.toast(e.detail.checked ? 'Motion on' : 'Motion off', { icon: 'sparkle' });
    } else {
      var p = e.detail.checked ? 'lite' : 'auto';
      store.set('prefs.perf', p);
      A.ui.applyPerf();
      A.ui.toast(e.detail.checked ? 'Reduced blur on' : 'Full glass restored', { icon: 'eye' });
    }
  });

  /* ------------------------------------------------------------- Danger */
  document.getElementById('settingsDanger').innerHTML =
    '<div class="glass glass--edge pad" data-reveal>' +
      '<div class="row" style="gap:var(--s-3);margin-bottom:var(--s-3)">' +
        '<span class="icon-tile icon-tile--danger">' + icon('refresh') + '</span>' +
        '<div class="grow"><b class="t-sm w-600" style="display:block">Reset the demo</b>' +
        '<span class="t-xs mute">Clears local tasks, approvals, orders and preferences.</span></div>' +
      '</div>' +
      '<button class="btn btn--danger btn--block" id="resetBtn">Reset local data</button>' +
    '</div>' +
    '<p class="t-2xs faint center" style="margin-top:var(--s-4)">' +
      'ACTA front-end prototype · all state lives in this browser' +
    '</p>';

  document.getElementById('resetBtn').addEventListener('click', function () {
    A.ui.sheet({
      title: 'Reset everything?',
      html: '<p class="t-sm soft" style="margin-bottom:var(--s-5)">' +
              'Tasks, monitors, approvals, orders and your policy go back to the seeded demo state. This cannot be undone.' +
            '</p>' +
            '<div class="row" style="gap:var(--s-2)">' +
              '<button class="btn grow" data-sheet-close>Keep my data</button>' +
              '<button class="btn btn--danger grow" id="confirmReset">Reset</button>' +
            '</div>',
      onOpen: function (el) {
        el.querySelector('#confirmReset').addEventListener('click', function () {
          store.reset();
          A.ui.closeSheet();
          A.ui.toast('Demo reset', { tone: 'ok', icon: 'refresh' });
          setTimeout(function () { location.href = 'dashboard.html'; }, 700);
        });
      }
    });
  });

  renderAutonomy();
  renderCategories();
  renderAppearance();
  A.motion.refresh(document);
})();

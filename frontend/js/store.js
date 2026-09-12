/* ==========================================================================
   ACTA — Store
   A tiny observable state container persisted to localStorage. Pages read
   from it, mutate through set()/update(), and re-render on change.
   ========================================================================== */
(function (global) {
  'use strict';

  var KEY = 'acta.state.v1';
  var listeners = [];

  var DEFAULTS = {
    prefs: {
      theme: 'dark',          /* dark | light | system */
      motion: 'on',           /* on | off */
      perf: 'auto',           /* auto | lite */
      currency: 'INR',
      name: 'Mudit'
    },
    policy: {
      autoSpendLimit: 2000,   /* auto-approve below this (INR) */
      hardCeiling: 25000,     /* never act above this */
      categories: { groceries: true, electronics: false, travel: false, dining: true },
      freeCancelAutonomous: true,
      timeWindow: { enabled: true, from: '08:00', to: '22:00' },
      vendorAllowlist: ['Mock Commerce', 'Sandbox Travel', 'TableLine'],
      escalateOnLowConfidence: true,
      confidenceFloor: 72
    },
    tasks: null,              /* seeded from data.js on first run */
    monitors: null,
    approvals: null,
    orders: null,
    events: null,
    seeded: false
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function deepMerge(base, over) {
    var out = clone(base);
    Object.keys(over || {}).forEach(function (k) {
      var v = over[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
        out[k] = deepMerge(out[k], v);
      } else if (v !== undefined) {
        out[k] = v;
      }
    });
    return out;
  }

  var state;
  try {
    var raw = localStorage.getItem(KEY);
    state = raw ? deepMerge(DEFAULTS, JSON.parse(raw)) : clone(DEFAULTS);
  } catch (e) {
    state = clone(DEFAULTS);
  }

  var saveQueued = false;
  function persist() {
    if (saveQueued) return;
    saveQueued = true;
    requestAnimationFrame(function () {
      saveQueued = false;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
    });
  }

  function emit(path) {
    listeners.forEach(function (fn) {
      try { fn(state, path); } catch (e) { console.warn('[store] listener failed', e); }
    });
  }

  var Store = {
    get: function () { return state; },

    /** set('policy.autoSpendLimit', 5000) */
    set: function (path, value) {
      var parts = path.split('.');
      var node = state;
      for (var i = 0; i < parts.length - 1; i++) {
        if (node[parts[i]] === undefined || node[parts[i]] === null) node[parts[i]] = {};
        node = node[parts[i]];
      }
      node[parts[parts.length - 1]] = value;
      persist();
      emit(path);
      return value;
    },

    /** update('policy', {autoSpendLimit: 5000}) — shallow-merges an object */
    update: function (path, patch) {
      var current = Store.read(path) || {};
      return Store.set(path, deepMerge(current, patch));
    },

    read: function (path) {
      return path.split('.').reduce(function (n, k) {
        return (n === undefined || n === null) ? undefined : n[k];
      }, state);
    },

    push: function (path, item) {
      var arr = Store.read(path);
      if (!Array.isArray(arr)) arr = Store.set(path, []);
      arr.unshift(item);
      persist();
      emit(path);
      return item;
    },

    /** Replace the first item in an array matching id */
    patchIn: function (path, id, patch) {
      var arr = Store.read(path) || [];
      var i = arr.findIndex(function (x) { return x.id === id; });
      if (i < 0) return null;
      arr[i] = deepMerge(arr[i], patch);
      persist();
      emit(path);
      return arr[i];
    },

    subscribe: function (fn) {
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
    },

    reset: function () {
      state = clone(DEFAULTS);
      try { localStorage.removeItem(KEY); } catch (e) {}
      emit('*');
    },

    /* Seed collections from the demo dataset exactly once. */
    seed: function (seedData) {
      if (state.seeded && state.tasks) return state;
      state.tasks     = state.tasks     || clone(seedData.tasks);
      state.monitors  = state.monitors  || clone(seedData.monitors);
      state.approvals = state.approvals || clone(seedData.approvals);
      state.orders    = state.orders    || clone(seedData.orders);
      state.events    = state.events    || clone(seedData.events);
      state.seeded = true;
      persist();
      return state;
    }
  };

  global.ACTA = global.ACTA || {};
  global.ACTA.store = Store;
})(window);

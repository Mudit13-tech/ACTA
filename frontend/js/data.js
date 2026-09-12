/* ==========================================================================
   ACTA — Demo dataset
   Stands in for the Node/Postgres backend described in the blueprint.
   Shapes mirror the suggested core tables so swapping in a real API is a
   matter of replacing the fetch, not the UI.
   ========================================================================== */
(function (global) {
  'use strict';

  var now = Date.now();
  var min = 60 * 1000, hr = 60 * min, day = 24 * hr;

  /* ---------------------------------------------------------- Verticals */
  var VERTICALS = [
    { id: 'shopping',    label: 'Shopping',     icon: 'cart',   depth: 'High',
      blurb: 'Search, compare, score, monitor, prepare checkout, purchase.',
      example: 'Find the best 27-inch monitor under Rs. 20,000.' },
    { id: 'travel',      label: 'Hotels / Travel', icon: 'hotel', depth: 'High',
      blurb: 'Search, compare, evaluate cancellation and location, reserve, verify.',
      example: 'Find a well-rated Goa hotel under Rs. 15,000 for 3 nights.' },
    { id: 'reservation', label: 'Reservations', icon: 'dining', depth: 'Medium/High',
      blurb: 'Search availability, rank, reserve, verify.',
      example: 'Find a restaurant for 4 tomorrow at 8 PM under Rs. 5,000.' }
  ];

  /* ------------------------------------------------------- Agent stages */
  var STAGES = [
    { id: 'understand', label: 'Understand', blurb: 'Natural language becomes a structured goal, budget, dates and constraints.' },
    { id: 'discover',   label: 'Discover',   blurb: 'Searches APIs and supported sites to collect live candidates.' },
    { id: 'evaluate',   label: 'Evaluate',   blurb: 'Normalises price, rating, policy, location and availability.' },
    { id: 'decide',     label: 'Decide',     blurb: 'Ranks candidates with rules, preferences and scoring.' },
    { id: 'monitor',    label: 'Monitor',    blurb: 'Keeps watching price, inventory and changing conditions.' },
    { id: 'act',        label: 'Act',        blurb: 'Fills forms, prepares checkout, reserves or purchases where supported.' },
    { id: 'verify',     label: 'Verify',     blurb: 'Confirms order state, payment status and references.' },
    { id: 'learn',      label: 'Learn',      blurb: 'Stores outcomes and preferences to improve the next run.' }
  ];

  /* ------------------------------------------------------- Candidates */
  var CANDIDATES = {
    shopping: [
      { id: 'c-mon-1', emoji: '🖥️', title: 'LG UltraGear 27GP850', provider: 'Mock Commerce',
        price: 18490, was: 20990, rating: 4.6, reviews: 2840, score: 94,
        attrs: ['27" QHD', '165Hz', 'Nano IPS', '1ms'],
        policy: '7-day replacement', ship: 'Delivers Tue, 16 Sep', stock: 'In stock',
        why: ['Cheapest QHD 165Hz panel meeting the 27" constraint', 'Rating 4.6 over 2.8k reviews clears the 4.3 floor', '12% below its own 60-day median'],
        history: [20990, 20990, 20490, 20490, 19990, 20490, 19490, 19290, 18990, 18490, 18490, 18490, 19290, 18490] },
      { id: 'c-mon-2', emoji: '🖥️', title: 'Dell S2721DGF', provider: 'Mock Commerce',
        price: 19750, was: 22500, rating: 4.5, reviews: 1960, score: 89,
        attrs: ['27" QHD', '165Hz', 'IPS', 'HDR400'],
        policy: '10-day return', ship: 'Delivers Wed, 17 Sep', stock: 'Only 3 left',
        why: ['Best colour coverage in the set', 'Sits Rs. 1,260 above the leader for a marginal panel gain'],
        history: [22500, 22500, 21990, 21500, 21500, 20990, 20500, 20500, 19990, 19750, 19750, 20200, 19750, 19750] },
      { id: 'c-mon-3', emoji: '🖥️', title: 'Samsung Odyssey G5', provider: 'Sandbox Retail',
        price: 16990, was: 18990, rating: 4.2, reviews: 5120, score: 81,
        attrs: ['27" QHD', '144Hz', 'VA', 'Curved'],
        policy: '7-day replacement', ship: 'Delivers Mon, 15 Sep', stock: 'In stock',
        why: ['Lowest price in the set', 'VA panel and 4.2 rating fall below the preference for IPS'],
        history: [18990, 18990, 18500, 18500, 17990, 17990, 17500, 16990, 16990, 17490, 16990, 16990, 16990, 16990] },
      { id: 'c-mon-4', emoji: '🖥️', title: 'BenQ MOBIUZ EX2710Q', provider: 'Mock Commerce',
        price: 21900, was: 23990, rating: 4.4, reviews: 740, score: 74,
        attrs: ['27" QHD', '165Hz', 'IPS', 'HDRi'],
        policy: '7-day return', ship: 'Delivers Thu, 18 Sep', stock: 'In stock',
        why: ['Exceeds the Rs. 20,000 hard budget — excluded from action eligibility'],
        history: [23990, 23990, 23500, 23500, 22900, 22900, 22500, 22500, 21900, 21900, 22400, 21900, 21900, 21900] }
    ],
    travel: [
      { id: 'c-hot-1', emoji: '🏖️', title: 'Casa Del Mar, Candolim', provider: 'Sandbox Travel',
        price: 13200, was: 15600, rating: 4.7, reviews: 1180, score: 96,
        attrs: ['3 nights', '240m to beach', 'Breakfast', 'Pool'],
        policy: 'Free cancellation until 14 Sep', ship: 'Sea-view deluxe', stock: '2 rooms left',
        why: ['Only candidate inside budget with free cancellation', '240m beach distance beats the 1km preference', 'Rating 4.7 is the highest in the set'],
        history: [15600, 15600, 15200, 14900, 14900, 14200, 14200, 13800, 13800, 13200, 13200, 13900, 13200, 13200] },
      { id: 'c-hot-2', emoji: '🌴', title: 'Palm Grove Resort, Calangute', provider: 'Sandbox Travel',
        price: 14850, was: 16400, rating: 4.4, reviews: 2260, score: 87,
        attrs: ['3 nights', '600m to beach', 'Breakfast'],
        policy: 'Free cancellation until 11 Sep', ship: 'Garden room', stock: 'Available',
        why: ['Inside budget with a shorter cancellation window', 'Larger property, lower rating'],
        history: [16400, 16400, 16000, 16000, 15600, 15600, 15200, 15200, 14850, 14850, 15100, 14850, 14850, 14850] },
      { id: 'c-hot-3', emoji: '🏨', title: 'The Sandbar, Baga', provider: 'Sandbox Travel',
        price: 11400, was: 12800, rating: 4.0, reviews: 890, score: 72,
        attrs: ['3 nights', '1.4km to beach', 'No breakfast'],
        policy: 'Non-refundable', ship: 'Standard room', stock: 'Available',
        why: ['Cheapest option but non-refundable — policy engine blocks autonomous booking'],
        history: [12800, 12800, 12400, 12400, 12000, 12000, 11800, 11400, 11400, 11400, 11900, 11400, 11400, 11400] }
    ],
    reservation: [
      { id: 'c-res-1', emoji: '🍜', title: 'Toko — Asian Kitchen', provider: 'TableLine',
        price: 3200, was: null, rating: 4.6, reviews: 1420, score: 92,
        attrs: ['Table for 4', '8:00 PM', '2.1 km'],
        policy: 'Free cancellation up to 2h before', ship: 'Indoor booth', stock: '3 slots at 8 PM',
        why: ['Exact 8 PM slot for 4 available', 'Estimated Rs. 3,200 for four sits under the Rs. 5,000 cap'],
        history: [] },
      { id: 'c-res-2', emoji: '🍕', title: 'Forno Vivo', provider: 'TableLine',
        price: 4100, was: null, rating: 4.5, reviews: 980, score: 85,
        attrs: ['Table for 4', '8:15 PM', '3.4 km'],
        policy: 'Free cancellation up to 4h before', ship: 'Terrace', stock: '1 slot at 8:15 PM',
        why: ['Nearest alternative slot, 15 minutes later than requested'],
        history: [] },
      { id: 'c-res-3', emoji: '🍣', title: 'Umi Sushi Bar', provider: 'TableLine',
        price: 5600, was: null, rating: 4.8, reviews: 640, score: 68,
        attrs: ['Table for 4', '8:30 PM', '5.8 km'],
        policy: 'Card hold required', ship: 'Counter seating', stock: 'Waitlist',
        why: ['Highest rated but the estimate breaches the Rs. 5,000 budget'],
        history: [] }
    ]
  };

  /* ------------------------------------------------------------- Tasks */
  var tasks = [
    {
      id: 't-1041', vertical: 'shopping', status: 'monitoring',
      intent: 'Find the best 27-inch monitor under Rs. 20,000',
      goal: { budget: 20000, currency: 'INR', category: 'Monitors', size: '27 inch',
              constraints: ['QHD or better', 'Rating >= 4.3', 'Delivery within 7 days'],
              actionThreshold: 92 },
      stage: 'monitor', progress: 0.62,
      createdAt: now - 5 * hr, deadline: now + 2 * day,
      candidateSet: 'shopping', topCandidate: 'c-mon-1',
      note: 'Watching for a drop below Rs. 18,000 before buying.'
    },
    {
      id: 't-1040', vertical: 'travel', status: 'awaiting_approval',
      intent: 'Goa hotel, 3 nights, under Rs. 15,000, near the beach',
      goal: { budget: 15000, currency: 'INR', nights: 3, destination: 'Goa',
              constraints: ['Rating >= 4.2', 'Under 1km from beach', 'Free cancellation'],
              actionThreshold: 90 },
      stage: 'act', progress: 0.84,
      createdAt: now - 40 * min, deadline: now + 20 * hr,
      candidateSet: 'travel', topCandidate: 'c-hot-1',
      note: 'Booking prepared. Rs. 13,200 exceeds the auto-spend limit, so approval is required.'
    },
    {
      id: 't-1039', vertical: 'reservation', status: 'completed',
      intent: 'Table for 4 tomorrow at 8 PM under Rs. 5,000',
      goal: { budget: 5000, currency: 'INR', party: 4, time: '20:00',
              constraints: ['Within 5 km', 'Rating >= 4.4'], actionThreshold: 85 },
      stage: 'verify', progress: 1,
      createdAt: now - 26 * hr, deadline: now + 10 * hr,
      candidateSet: 'reservation', topCandidate: 'c-res-1',
      note: 'Reserved and verified. Confirmation TL-88214.'
    },
    {
      id: 't-1038', vertical: 'shopping', status: 'failed',
      intent: 'Mechanical keyboard under Rs. 6,000 with hot-swap switches',
      goal: { budget: 6000, currency: 'INR', category: 'Keyboards',
              constraints: ['Hot-swap', 'Wireless'], actionThreshold: 88 },
      stage: 'act', progress: 0.55,
      createdAt: now - 3 * day, deadline: now - 4 * hr,
      candidateSet: 'shopping', topCandidate: null,
      note: 'Connector returned a changed checkout page. Escalated instead of guessing.'
    }
  ];

  /* ---------------------------------------------------------- Monitors */
  var monitors = [
    { id: 'm-21', taskId: 't-1041', label: 'LG UltraGear 27GP850', emoji: '🖥️',
      condition: 'price < 18000', target: 18000, current: 18490, start: 20990,
      frequency: '15 min', lastChecked: now - 4 * min, nextCheck: now + 11 * min,
      changePct: -11.9, active: true, provider: 'Mock Commerce',
      history: [20990, 20990, 20490, 20490, 19990, 20490, 19490, 19290, 18990, 18490, 18490, 18490, 19290, 18490] },
    { id: 'm-22', taskId: 't-1040', label: 'Casa Del Mar, Candolim', emoji: '🏖️',
      condition: 'price < 13000 OR rooms < 2', target: 13000, current: 13200, start: 15600,
      frequency: '30 min', lastChecked: now - 12 * min, nextCheck: now + 18 * min,
      changePct: -15.4, active: true, provider: 'Sandbox Travel',
      history: [15600, 15600, 15200, 14900, 14900, 14200, 14200, 13800, 13800, 13200, 13200, 13900, 13200, 13200] },
    { id: 'm-23', taskId: null, label: 'Sony WH-1000XM5', emoji: '🎧',
      condition: 'price < 24000', target: 24000, current: 26490, start: 29990,
      frequency: '1 hour', lastChecked: now - 22 * min, nextCheck: now + 38 * min,
      changePct: -11.7, active: true, provider: 'Mock Commerce',
      history: [29990, 29990, 28990, 28990, 27990, 28490, 27490, 27490, 26990, 26990, 26490, 27200, 26490, 26490] },
    { id: 'm-24', taskId: null, label: 'Goa flights, 14–17 Oct', emoji: '✈️',
      condition: 'price < 9500', target: 9500, current: 10840, start: 10200,
      frequency: '2 hours', lastChecked: now - 51 * min, nextCheck: now + 69 * min,
      changePct: 6.3, active: false, provider: 'Sandbox Travel',
      history: [10200, 10100, 10400, 10400, 10650, 10650, 10500, 10500, 10900, 10900, 10700, 11100, 10840, 10840] }
  ];

  /* --------------------------------------------------------- Approvals */
  var approvals = [
    { id: 'a-77', actionId: 'act-311', taskId: 't-1040', status: 'pending',
      title: 'Book Casa Del Mar, Candolim', vendor: 'Sandbox Travel', emoji: '🏖️',
      amount: 13200, currency: 'INR', risk: 'medium',
      policyRule: 'Spend limit — auto-buy up to Rs. 2,000; ask above Rs. 2,000',
      reason: 'Score 96 cleared the 90 threshold. Free cancellation until 14 Sep. Amount exceeds the auto-spend limit.',
      detail: ['3 nights, 14–17 Oct', 'Sea-view deluxe, breakfast included', 'Free cancellation until 14 Sep', 'Card charged by provider, not stored by ACTA'],
      createdAt: now - 18 * min, expiresAt: now + 42 * min, simulated: true },
    { id: 'a-76', actionId: 'act-309', taskId: 't-1041', status: 'pending',
      title: 'Purchase LG UltraGear 27GP850', vendor: 'Mock Commerce', emoji: '🖥️',
      amount: 18490, currency: 'INR', risk: 'high',
      policyRule: 'Category — electronics require approval',
      reason: 'Price matched the monitor condition. Electronics are outside the autonomous category list.',
      detail: ['Checkout prepared, payment link generated', 'Delivers Tue, 16 Sep', '7-day replacement window', 'Idempotency key act-309-3f2a'],
      createdAt: now - 2 * hr, expiresAt: now + 6 * hr, simulated: true },
    { id: 'a-75', actionId: 'act-302', taskId: 't-1039', status: 'approved',
      title: 'Reserve Toko — Asian Kitchen', vendor: 'TableLine', emoji: '🍜',
      amount: 0, currency: 'INR', risk: 'low',
      policyRule: 'Action type — free cancellation may be autonomous',
      reason: 'No card hold required and cancellation is free up to 2 hours before.',
      detail: ['Table for 4 at 8:00 PM', 'Confirmation TL-88214'],
      createdAt: now - 25 * hr, decidedAt: now - 25 * hr, simulated: true }
  ];

  /* ------------------------------------------------------------ Orders */
  var orders = [
    { id: 'o-512', actionId: 'act-302', taskId: 't-1039', status: 'confirmed',
      title: 'Toko — Asian Kitchen', vendor: 'TableLine', emoji: '🍜',
      amount: 0, currency: 'INR', ref: 'TL-88214',
      placedAt: now - 25 * hr, verifiedAt: now - 25 * hr + 40 * 1000,
      kind: 'reservation', simulated: true,
      steps: [ ['Reservation submitted', now - 25 * hr], ['Provider acknowledged', now - 25 * hr + 12000], ['Confirmation reference received', now - 25 * hr + 40000], ['State verified against provider', now - 25 * hr + 52000] ] },
    { id: 'o-511', actionId: 'act-298', taskId: null, status: 'confirmed',
      title: 'Anker 737 Power Bank', vendor: 'Mock Commerce', emoji: '🔋',
      amount: 8990, currency: 'INR', ref: 'MC-40231',
      placedAt: now - 4 * day, verifiedAt: now - 4 * day + 90 * 1000,
      kind: 'purchase', simulated: true,
      steps: [ ['Checkout prepared', now - 4 * day], ['Approval granted', now - 4 * day + 30000], ['Payment captured', now - 4 * day + 70000], ['Order confirmed MC-40231', now - 4 * day + 90000] ] },
    { id: 'o-510', actionId: 'act-291', taskId: null, status: 'refunded',
      title: 'Blue Tokai Subscription', vendor: 'Mock Commerce', emoji: '☕',
      amount: 1450, currency: 'INR', ref: 'MC-39880',
      placedAt: now - 9 * day, verifiedAt: now - 9 * day + 60 * 1000,
      kind: 'purchase', simulated: true,
      steps: [ ['Order placed', now - 9 * day], ['Cancelled by user', now - 8 * day], ['Refund initiated', now - 8 * day + 3600000], ['Refund settled', now - 7 * day] ] },
    { id: 'o-509', actionId: 'act-287', taskId: 't-1038', status: 'failed',
      title: 'Keychron K2 Pro', vendor: 'Sandbox Retail', emoji: '⌨️',
      amount: 5890, currency: 'INR', ref: null,
      placedAt: now - 3 * day, verifiedAt: null,
      kind: 'purchase', simulated: true,
      steps: [ ['Checkout prepared', now - 3 * day], ['Page structure changed unexpectedly', now - 3 * day + 20000], ['Action halted before payment', now - 3 * day + 21000], ['Escalated to user', now - 3 * day + 22000] ] }
  ];

  /* ------------------------------------------------------- Audit events */
  var events = [
    { id: 'e-9001', taskId: 't-1040', type: 'approval.requested', level: 'warn',
      label: 'Approval requested for Rs. 13,200 booking', detail: 'policy: spend_limit_exceeded', at: now - 18 * min },
    { id: 'e-9000', taskId: 't-1040', type: 'action.prepared', level: 'info',
      label: 'Booking prepared for Casa Del Mar', detail: 'idempotency_key=act-311-91cd', at: now - 19 * min },
    { id: 'e-8999', taskId: 't-1040', type: 'decision.ranked', level: 'ok',
      label: 'Ranked 3 candidates, leader scored 96', detail: 'threshold=90 → action eligible', at: now - 21 * min },
    { id: 'e-8998', taskId: 't-1040', type: 'tool.call', level: 'info',
      label: 'sandbox_travel.search returned 3 candidates', detail: '412ms · 3 normalised', at: now - 23 * min },
    { id: 'e-8997', taskId: 't-1041', type: 'monitor.checked', level: 'info',
      label: 'Price check: Rs. 18,490 (no change)', detail: 'condition price < 18000 not met', at: now - 4 * min },
    { id: 'e-8996', taskId: 't-1041', type: 'monitor.triggered', level: 'ok',
      label: 'Price fell 4.1% since last check', detail: 'Rs. 19,290 → Rs. 18,490', at: now - 64 * min },
    { id: 'e-8995', taskId: 't-1038', type: 'action.failed', level: 'danger',
      label: 'Checkout halted — page structure changed', detail: 'escalated, no payment attempted', at: now - 3 * day },
    { id: 'e-8994', taskId: 't-1039', type: 'action.verified', level: 'ok',
      label: 'Reservation verified with TableLine', detail: 'ref TL-88214 · state=confirmed', at: now - 25 * hr }
  ];

  /* ------------------------------- Scripted agent run (task workspace) */
  var AGENT_SCRIPT = [
    { stage: 'understand', title: 'Parsed the goal',
      body: 'Budget Rs. 15,000 · Goa · 3 nights · rating ≥ 4.2 · under 1 km from the beach · act above score 90.',
      kind: 'json',
      payload: '{\n  "vertical": "travel",\n  "destination": "Goa",\n  "nights": 3,\n  "budget": { "amount": 15000, "currency": "INR" },\n  "constraints": ["rating>=4.2", "beach_distance<1km", "free_cancellation"],\n  "action_threshold": 90\n}',
      ms: 900 },
    { stage: 'understand', title: 'Built the execution plan',
      body: 'Four subtasks queued: search, normalise, score, decide. Two tools selected from the registry.', ms: 700 },
    { stage: 'discover', title: 'Called sandbox_travel.search',
      body: 'Queried availability for 14–17 Oct across Candolim, Calangute and Baga.', kind: 'tool', ms: 1100 },
    { stage: 'discover', title: 'Collected 3 candidates',
      body: 'Casa Del Mar · Palm Grove Resort · The Sandbar.', kind: 'candidates', ms: 800 },
    { stage: 'evaluate', title: 'Normalised the set',
      body: 'Converted nightly rates to a 3-night total including taxes, mapped cancellation terms to a common schema.', ms: 900 },
    { stage: 'evaluate', title: 'Checked hard constraints',
      body: 'The Sandbar is non-refundable — excluded from autonomous action but kept for comparison.', kind: 'warn', ms: 700 },
    { stage: 'decide', title: 'Scored and ranked',
      body: 'Casa Del Mar 96 · Palm Grove 87 · The Sandbar 72.', kind: 'score', ms: 1000 },
    { stage: 'decide', title: 'Recommendation ready',
      body: 'Leader clears the 90 threshold, so the action becomes eligible.', kind: 'ok', ms: 600 },
    { stage: 'act', title: 'Prepared the booking',
      body: 'Sea-view deluxe held, guest details filled from the approved profile, idempotency key generated.', kind: 'tool', ms: 1200 },
    { stage: 'act', title: 'Policy check — approval required',
      body: 'Rs. 13,200 exceeds the Rs. 2,000 auto-spend limit. Paused for your decision.', kind: 'approval', ms: 800 }
  ];

  global.ACTA = global.ACTA || {};
  global.ACTA.data = {
    VERTICALS: VERTICALS,
    STAGES: STAGES,
    CANDIDATES: CANDIDATES,
    AGENT_SCRIPT: AGENT_SCRIPT,
    seed: { tasks: tasks, monitors: monitors, approvals: approvals, orders: orders, events: events },
    candidatesFor: function (set) { return (CANDIDATES[set] || []).slice(); },
    candidateById: function (id) {
      var all = [];
      Object.keys(CANDIDATES).forEach(function (k) { all = all.concat(CANDIDATES[k]); });
      return all.find(function (c) { return c.id === id; }) || null;
    }
  };

  /* Seed the store the moment the dataset is available, so a page script can
     read collections before it calls ui.mount(). Seeding is idempotent. */
  if (global.ACTA.store) global.ACTA.store.seed(global.ACTA.data.seed);
})(window);

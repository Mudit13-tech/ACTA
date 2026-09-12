/* ==========================================================================
   ACTA — Icon set. Inline SVG paths, stroked, 24x24 grid.
   Usage:  icon('search')            -> markup string
           iconEl('search', 'w-5')   -> element
   ========================================================================== */
(function (global) {
  'use strict';

  var P = {
    /* navigation */
    home:      '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M9.5 20v-5.5h5V20"/>',
    compass:   '<circle cx="12" cy="12" r="9"/><path d="m15.2 8.8-2 5.4-5.4 2 2-5.4z"/>',
    radar:     '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" class="icon--fill"/><path d="M12 12 19 6"/>',
    shield:    '<path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    receipt:   '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    activity:  '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
    settings:  '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    grid:      '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',

    /* actions */
    search:    '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    send:      '<path d="M4 12 20 4l-7 16-2.2-6.2z"/>',
    plus:      '<path d="M12 5v14M5 12h14"/>',
    close:     '<path d="M6 6l12 12M18 6 6 18"/>',
    check:     '<path d="m5 13 4.5 4.5L19 7"/>',
    arrowRight:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chevDown:  '<path d="m6 9 6 6 6-6"/>',
    external:  '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v6H4V6h6"/>',
    filter:    '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    refresh:   '<path d="M3.5 12a8.5 8.5 0 0 1 14.3-6.2L21 8"/><path d="M21 4v4h-4"/><path d="M20.5 12a8.5 8.5 0 0 1-14.3 6.2L3 16"/><path d="M3 20v-4h4"/>',
    more:      '<circle cx="5" cy="12" r="1.4" class="icon--fill"/><circle cx="12" cy="12" r="1.4" class="icon--fill"/><circle cx="19" cy="12" r="1.4" class="icon--fill"/>',

    /* domain */
    cart:      '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.6 12.4h11L21 7H6"/>',
    hotel:     '<path d="M3 20V6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v14"/><path d="M14 11h6a1 1 0 0 1 1 1v8"/><path d="M2 20h20"/><path d="M6.5 8.5h3M6.5 12h3M6.5 15.5h3M17 15h1"/>',
    dining:    '<path d="M6 3v8a2.5 2.5 0 0 0 5 0V3"/><path d="M8.5 11v10"/><path d="M17.5 3c-1.5 1.5-2 3.5-2 6s.7 3 2 3 2-1 2-3V3z"/><path d="M17.5 12v9"/>',
    bolt:      '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    brain:     '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8V16a3 3 0 0 0 4 2.8V4.6A3 3 0 0 0 9 4Z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8V16a3 3 0 0 1-4 2.8V4.6A3 3 0 0 1 15 4Z"/>',
    tag:       '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.4" class="icon--fill"/>',
    bell:      '<path d="M18 15V10a6 6 0 1 0-12 0v5l-2 3h16z"/><path d="M10 21h4"/>',
    clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
    calendar:  '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    pin:       '<path d="M12 22s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="11" r="2.6"/>',
    star:      '<path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z"/>',
    trend:     '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    trendDown: '<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
    card:      '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19"/><path d="M6.5 15h3"/>',
    lock:      '<rect x="4" y="10.5" width="16" height="10.5" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    eye:       '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    robot:     '<rect x="4" y="8" width="16" height="12" rx="3.5"/><path d="M12 4v4"/><circle cx="12" cy="3" r="1.4"/><circle cx="9" cy="14" r="1.3" class="icon--fill"/><circle cx="15" cy="14" r="1.3" class="icon--fill"/>',
    layers:    '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    play:      '<path d="M7 4.5 19 12 7 19.5z"/>',
    pause:     '<path d="M8.5 5v14M15.5 5v14"/>',
    alert:     '<path d="M12 4.5 2.8 20h18.4z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".9" class="icon--fill"/>',
    info:      '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".9" class="icon--fill"/>',
    sparkle:   '<path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9z"/><path d="M18.5 3.5 19.2 5.8 21.5 6.5 19.2 7.2 18.5 9.5 17.8 7.2 15.5 6.5 17.8 5.8z"/>',
    moon:      '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
    sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    user:      '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    inbox:     '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13l2.5 8v6H3v-6z"/>',
    link:      '<path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7L11.4 6.3"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.4-1.3"/>',
    db:        '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    rocket:    '<path d="M12 2.5c3.5 2.2 5.5 6 5.5 10L12 17l-5.5-4.5c0-4 2-7.8 5.5-10Z"/><circle cx="12" cy="9.5" r="2"/><path d="M8.5 16.5 6 22l4.2-1.8M15.5 16.5 18 22l-4.2-1.8"/>'
  };

  function icon(name, cls) {
    var d = P[name] || P.info;
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }

  function iconEl(name, cls) {
    var wrap = document.createElement('div');
    wrap.innerHTML = icon(name, cls);
    return wrap.firstChild;
  }

  global.ACTA = global.ACTA || {};
  global.ACTA.icon = icon;
  global.ACTA.iconEl = iconEl;
  global.ACTA.iconNames = Object.keys(P);
})(window);

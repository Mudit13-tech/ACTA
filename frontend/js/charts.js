/* ==========================================================================
   ACTA — Charts
   Small canvas renderers, no dependencies. Retina-aware, theme-aware,
   animated on first paint, redrawn on resize and theme change.
   ========================================================================== */
(function (global) {
  'use strict';

  var registry = [];

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function setup(canvas, height) {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || canvas.parentElement.clientWidth || 300;
    var h = height || canvas.clientHeight || 120;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function animate(dur, draw) {
    if (global.ACTA.motion && global.ACTA.motion.disabled) { draw(1); return; }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      draw(easeOutExpo(p));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* Catmull-Rom → bezier, so price lines read as smooth curves. */
  function smoothPath(ctx, pts) {
    if (pts.length < 2) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i], p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      ctx.bezierCurveTo(
        p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6,
        p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6,
        p2.x, p2.y
      );
    }
  }

  /* -------------------------------------------------------- Area chart */
  function areaChart(canvas, data, opts) {
    opts = opts || {};
    if (!canvas || !data || data.length < 2) return;
    var height = opts.height || 130;

    function render(progress) {
      var s = setup(canvas, height);
      var ctx = s.ctx, w = s.w, h = s.h;
      var padT = 14, padB = opts.labels ? 20 : 8, padX = 2;

      var min = Math.min.apply(null, data);
      var max = Math.max.apply(null, data);
      if (opts.target !== undefined) { min = Math.min(min, opts.target); max = Math.max(max, opts.target); }
      var span = (max - min) || 1;
      min -= span * 0.12; max += span * 0.12; span = max - min;

      var plotW = w - padX * 2, plotH = h - padT - padB;
      var x = function (i) { return padX + (i / (data.length - 1)) * plotW; };
      var y = function (v) { return padT + (1 - (v - min) / span) * plotH; };

      /* Horizontal guides */
      ctx.strokeStyle = cssVar('--glass-hairline', 'rgba(255,255,255,.08)');
      ctx.lineWidth = 1;
      for (var g = 0; g <= 2; g++) {
        var gy = padT + (plotH / 2) * g;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }

      /* Target line */
      if (opts.target !== undefined) {
        var ty = y(opts.target);
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = cssVar('--warn-400', '#fbbf24');
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(w, ty); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = cssVar('--warn-400', '#fbbf24');
        ctx.font = '600 9px ' + cssVar('--font-sans', 'system-ui');
        ctx.textAlign = 'right';
        ctx.fillText(opts.targetLabel || 'target', w - 4, ty - 5);
      }

      /* How much of the series to draw this frame */
      var count = Math.max(2, Math.round(2 + (data.length - 2) * progress));
      var pts = [];
      for (var i = 0; i < count; i++) pts.push({ x: x(i), y: y(data[i]) });

      var accent = opts.color || cssVar('--brand-400', '#7a7dff');
      var accent2 = opts.color2 || cssVar('--cyan-400', '#34e0d0');

      /* Fill */
      var grad = ctx.createLinearGradient(0, padT, 0, h);
      grad.addColorStop(0, hexA(accent, 0.34));
      grad.addColorStop(1, hexA(accent, 0));
      ctx.beginPath();
      smoothPath(ctx, pts);
      ctx.lineTo(pts[pts.length - 1].x, h - padB + padB);
      ctx.lineTo(pts[0].x, h - padB + padB);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      /* Line */
      var lineGrad = ctx.createLinearGradient(0, 0, w, 0);
      lineGrad.addColorStop(0, accent);
      lineGrad.addColorStop(1, accent2);
      ctx.beginPath();
      smoothPath(ctx, pts);
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.stroke();

      /* Head dot */
      var last = pts[pts.length - 1];
      ctx.beginPath(); ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = hexA(accent2, 0.20); ctx.fill();
      ctx.beginPath(); ctx.arc(last.x, last.y, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = accent2; ctx.fill();
      ctx.strokeStyle = cssVar('--bg', '#05070f'); ctx.lineWidth = 1.6; ctx.stroke();

      if (opts.labels && progress === 1) {
        ctx.fillStyle = cssVar('--text-faint', 'rgba(255,255,255,.3)');
        ctx.font = '500 9px ' + cssVar('--font-sans', 'system-ui');
        ctx.textAlign = 'left';  ctx.fillText(opts.labels[0], 2, h - 5);
        ctx.textAlign = 'right'; ctx.fillText(opts.labels[1], w - 2, h - 5);
      }
    }

    animate(opts.duration || 1100, render);
    track(canvas, render);
  }

  /* --------------------------------------------------------- Sparkline */
  function sparkline(canvas, data, opts) {
    opts = opts || {};
    if (!canvas || !data || data.length < 2) return;
    var height = opts.height || 34;

    function render(progress) {
      var s = setup(canvas, height);
      var ctx = s.ctx, w = s.w, h = s.h;
      var min = Math.min.apply(null, data), max = Math.max.apply(null, data);
      var span = (max - min) || 1;
      var pad = 4;
      var count = Math.max(2, Math.round(2 + (data.length - 2) * progress));
      var pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({ x: (i / (data.length - 1)) * w, y: pad + (1 - (data[i] - min) / span) * (h - pad * 2) });
      }
      var up = data[data.length - 1] >= data[0];
      var color = opts.color || (up ? cssVar('--danger-400', '#fb7185') : cssVar('--ok-400', '#4ade80'));

      ctx.beginPath(); smoothPath(ctx, pts);
      ctx.lineTo(pts[pts.length - 1].x, h); ctx.lineTo(0, h); ctx.closePath();
      ctx.fillStyle = hexA(color, 0.16); ctx.fill();

      ctx.beginPath(); smoothPath(ctx, pts);
      ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.stroke();
    }

    animate(opts.duration || 900, render);
    track(canvas, render);
  }

  /* -------------------------------------------------------- Bar chart */
  function barChart(canvas, items, opts) {
    opts = opts || {};
    if (!canvas || !items || !items.length) return;
    var height = opts.height || 150;

    function render(progress) {
      var s = setup(canvas, height);
      var ctx = s.ctx, w = s.w, h = s.h;
      var padB = 22, padT = 6;
      var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
      var gap = 10;
      var bw = Math.min(46, (w - gap * (items.length - 1)) / items.length);
      var totalW = bw * items.length + gap * (items.length - 1);
      var x0 = (w - totalW) / 2;

      items.forEach(function (item, i) {
        var full = ((h - padB - padT) * item.value) / max;
        var bh = full * progress;
        var x = x0 + i * (bw + gap);
        var y = h - padB - bh;

        var grad = ctx.createLinearGradient(0, y, 0, h - padB);
        var c1 = item.color || cssVar('--brand-400', '#7a7dff');
        var c2 = item.color2 || cssVar('--cyan-400', '#34e0d0');
        grad.addColorStop(0, c1);
        grad.addColorStop(1, hexA(c2, 0.35));

        roundRect(ctx, x, y, bw, Math.max(bh, 2), 7);
        ctx.fillStyle = grad; ctx.fill();

        ctx.fillStyle = cssVar('--text-mute', 'rgba(255,255,255,.5)');
        ctx.font = '600 9px ' + cssVar('--font-sans', 'system-ui');
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x + bw / 2, h - 7);

        if (progress > 0.85) {
          ctx.fillStyle = cssVar('--text', '#eef1fb');
          ctx.font = '700 10px ' + cssVar('--font-display', 'system-ui');
          ctx.fillText(item.display || item.value, x + bw / 2, y - 5);
        }
      });
    }

    animate(opts.duration || 1000, render);
    track(canvas, render);
  }

  /* ------------------------------------------------------------ Utils */
  function hexA(color, alpha) {
    color = (color || '').trim();
    if (color.indexOf('#') === 0) {
      var hex = color.slice(1);
      if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
      var n = parseInt(hex, 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
    }
    if (color.indexOf('rgb') === 0) {
      var parts = color.replace(/rgba?\(|\)/g, '').split(',').slice(0, 3);
      return 'rgba(' + parts.join(',') + ',' + alpha + ')';
    }
    return 'rgba(122,125,255,' + alpha + ')';
  }

  /* Re-render on resize / theme change */
  function track(canvas, render) {
    registry = registry.filter(function (r) { return r.canvas.isConnected; });
    registry.push({ canvas: canvas, render: render });
  }

  var resizeTimer = null;
  global.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redrawAll, 140);
  });

  function redrawAll() {
    registry = registry.filter(function (r) { return r.canvas.isConnected; });
    registry.forEach(function (r) { r.render(1); });
  }

  global.ACTA = global.ACTA || {};
  global.ACTA.charts = {
    area: areaChart,
    sparkline: sparkline,
    bar: barChart,
    redrawAll: redrawAll
  };
})(window);

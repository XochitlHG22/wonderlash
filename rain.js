/* Wonder Lash Rain engine
   createRain(canvas, {sprites:{bottle,brush,swatch}}) -> {add(name,isNew), setMode(m), names()}
   Every name becomes a falling bottle, brush or swatch with the name on a label. */
(function () {
  var BLOCK = ['fuck','shit','cunt','dick','bitch','nigg','fag','porn','sex','kurwa','fitta','kuk','puta','pendejo'];
  function clean(raw) {
    var s = String(raw || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
    if (!s) return '';
    var low = s.toLowerCase().replace(/[^a-z]/g, '');
    for (var i = 0; i < BLOCK.length; i++) if (low.indexOf(BLOCK[i]) !== -1) return '';
    return s;
  }

  function createRain(canvas, opts) {
    var ctx = canvas.getContext('2d');
    var sprites = opts.sprites;
    var kinds = ['bottle', 'brush', 'swatch'];
    var colors = opts.colors || { label: '#6E0F24', labelText: '#FBE7EE', fresh: '#F08DB4', dot1: '#E58AAE', dot2: '#8A1631' };
    var font = opts.font || '"Tenor Sans", "Helvetica Neue", Arial, sans-serif';
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var W = 0, H = 0, dpr = 1;
    var all = [];          // every name seen, in order
    var fresh = [];        // names waiting for their first fall
    var cursor = 0;        // cycling pointer through all
    var drops = [];
    var dots = [];
    var mode = 'live';
    var lastSpawn = 0, last = 0;

    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round((W * H) / 5200);
      dots = [];
      for (var i = 0; i < n; i++) dots.push(newDot(true));
    }
    function newDot(anywhere) {
      return { x: Math.random() * W, y: anywhere ? Math.random() * H : -10, v: 40 + Math.random() * 90,
        l: 3 + Math.random() * 7, c: Math.random() < 0.6 ? colors.dot1 : colors.dot2, a: 0.25 + Math.random() * 0.5 };
    }

    function spawn(name, isFresh) {
      var kind = kinds[Math.floor(Math.random() * kinds.length)];
      var img = sprites[kind];
      var base = H * (mode === 'thanks' ? 0.19 : 0.22) * (isFresh ? 1.25 : 1);
      var h = kind === 'swatch' ? base * 0.55 : base;
      var w = img && img.naturalHeight ? h * img.naturalWidth / img.naturalHeight : h * 0.6;
      var margin = Math.min(W * 0.08, 90);
      drops.push({
        name: name, kind: kind, img: img, w: w, h: h, fresh: isFresh,
        x: margin + Math.random() * (W - margin * 2), y: -h - 40,
        v: H * (0.07 + Math.random() * 0.05) * (reduce ? 0.5 : 1),
        sway: 8 + Math.random() * 18, ph: Math.random() * 6.28,
        rot: (Math.random() - 0.5) * (kind === 'swatch' ? 0.3 : 0.5), t: 0
      });
    }

    function nextName() {
      if (fresh.length) return { n: fresh.shift(), f: true };
      if (!all.length) return null;
      cursor = (cursor + 1) % all.length;
      return { n: all[cursor], f: false };
    }

    function maxDrops() {
      var byArea = Math.round(W / 110);
      return Math.max(5, Math.min(mode === 'thanks' ? 30 : 20, byArea));
    }

    function label(d, cx, top) {
      var fs = Math.max(12, Math.round(H * (d.fresh ? 0.03 : 0.024)));
      ctx.font = fs + 'px ' + font;
      var tw = ctx.measureText(d.name).width;
      var ph = fs * 0.55, pv = fs * 0.35;
      var bw = tw + ph * 2, bh = fs + pv * 2;
      var x = cx - bw / 2, y = top;
      ctx.fillStyle = d.fresh ? colors.fresh : colors.label;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, bh / 2); else ctx.rect(x, y, bw, bh);
      ctx.fill();
      ctx.fillStyle = d.fresh ? colors.label : colors.labelText;
      ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      ctx.fillText(d.name, cx, y + bh / 2 + 1);
    }

    function frame(ts) {
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;
      ctx.clearRect(0, 0, W, H);

      // background lash-rain dots
      ctx.lineCap = 'round';
      for (var i = 0; i < dots.length; i++) {
        var p = dots[i];
        p.y += p.v * dt;
        if (p.y > H + 10) { dots[i] = newDot(false); continue; }
        ctx.strokeStyle = p.c; ctx.globalAlpha = p.a; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.l * 0.35, p.y + p.l); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // spawn
      var gap = mode === 'thanks' ? 450 : 900;
      if (fresh.length) gap = 300;
      if (ts - lastSpawn > gap && drops.length < maxDrops()) {
        var nn = nextName();
        if (nn) spawn(nn.n, nn.f);
        lastSpawn = ts;
      }

      // drops
      for (var j = drops.length - 1; j >= 0; j--) {
        var d = drops[j];
        d.t += dt; d.y += d.v * dt;
        var cx = d.x + Math.sin(d.t * 1.1 + d.ph) * d.sway;
        if (d.y > H + d.h + 60) { drops.splice(j, 1); continue; }
        ctx.save();
        ctx.translate(cx, d.y + d.h / 2);
        ctx.rotate(d.rot + Math.sin(d.t * 0.9 + d.ph) * 0.06);
        if (d.fresh) { ctx.shadowColor = colors.fresh; ctx.shadowBlur = 28; }
        if (d.img && d.img.complete && d.img.naturalWidth) ctx.drawImage(d.img, -d.w / 2, -d.h / 2, d.w, d.h);
        ctx.restore();
        label(d, cx, d.y + d.h + H * 0.012);
      }
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    requestAnimationFrame(frame);

    return {
      add: function (raw, isNew) {
        var n = clean(raw);
        if (!n) return '';
        all.push(n);
        if (isNew) fresh.push(n); else if (all.length <= 3) fresh.push(n);
        return n;
      },
      setMode: function (m) { mode = m; },
      names: function () { return all.slice(); },
      clean: clean
    };
  }
  window.createRain = createRain;
  window.cleanName = clean;
})();

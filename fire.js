/* Fire background: flames and embers rise from the bottom, dark smoke drifts above them.
   The pointer acts like wind and pushes the fire sideways. */
(function () {
  const cv = document.getElementById('fire');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, flames = [], smoke = [], embers = [], mouse = { x: -999, y: -999 }, running = true, last = 0, time = 0;

  // pre-rendered soft sprites: hot core, orange body, red tips, and dark smoke
  function sprite(stops) {
    const s = document.createElement('canvas'); s.width = s.height = 128;
    const g = s.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([o, col]) => gr.addColorStop(o, col));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return s;
  }
  const S = [
    sprite([[0, 'rgba(255,240,190,.95)'], [.35, 'rgba(255,170,60,.6)'], [1, 'rgba(255,100,20,0)']]),
    sprite([[0, 'rgba(255,150,50,.85)'], [.45, 'rgba(240,80,20,.45)'], [1, 'rgba(200,40,10,0)']]),
    sprite([[0, 'rgba(220,50,15,.7)'], [.5, 'rgba(150,25,8,.35)'], [1, 'rgba(90,10,5,0)']]),
  ];
  const SMOKE = sprite([[0, 'rgba(70,40,30,.55)'], [.6, 'rgba(40,22,18,.25)'], [1, 'rgba(20,10,8,0)']]);

  const rnd = (a, b) => a + Math.random() * (b - a);
  function newFlame(spread) {
    // fire is uneven: use a slow wave so some places burn taller than others
    const x = Math.random() * W, tall = .55 + .45 * Math.sin(x * .008 + time * .0012) ** 2;
    return { x, y: H + 10 - (spread ? Math.random() * H * .3 : 0), r: rnd(45, 95) * tall, vy: -rnd(2.4, 4.4) * tall, life: spread ? Math.random() : 0, sp: rnd(.011, .018), ph: Math.random() * 6.3 };
  }
  const newSmoke = spread => ({ x: Math.random() * W, y: H * rnd(.55, 1) - (spread ? Math.random() * H * .5 : 0), r: rnd(80, 160), vy: -rnd(.5, 1.1), life: spread ? Math.random() : 0, sp: rnd(.0018, .0034), ph: Math.random() * 6.3 });
  const newEmber = spread => ({ x: Math.random() * W, y: spread ? Math.random() * H : H + 5, r: rnd(1, 2.8), vy: -rnd(.8, 2.6), life: spread ? Math.random() : 0, sp: rnd(.003, .008), ph: Math.random() * 6.3 });

  function init() {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    const k = W < 700 ? .5 : 1;
    flames = Array.from({ length: Math.min(90, Math.round(W / 14 * k)) }, () => newFlame(true));
    smoke = Array.from({ length: Math.round(18 * k) }, () => newSmoke(true));
    embers = Array.from({ length: Math.round(55 * k) }, () => newEmber(true));
  }

  function wind(p, strength) {           // pointer pushes particles sideways
    const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
    if (d < 200) p.x += dx / (d || 1) * (200 - d) * strength;
  }

  function step(dt) {
    time += dt * 16.7;
    for (const p of flames) {
      p.life += p.sp * dt; p.y += p.vy * dt; p.x += Math.sin(time * .004 + p.ph) * .9 * dt; wind(p, .02);
      if (p.life >= 1) Object.assign(p, newFlame(false));
    }
    for (const p of smoke) {
      p.life += p.sp * dt; p.y += p.vy * dt; p.r += .12 * dt; p.x += Math.sin(time * .0007 + p.ph) * .4 * dt; wind(p, .01);
      if (p.life >= 1) Object.assign(p, newSmoke(false));
    }
    for (const p of embers) {
      p.life += p.sp * dt; p.y += p.vy * dt; p.x += Math.sin(time * .003 + p.ph) * 1.1 * dt; wind(p, .03);
      if (p.life >= 1 || p.y < -10) Object.assign(p, newEmber(false));
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    for (const p of smoke) { ctx.globalAlpha = Math.sin(Math.PI * p.life) * .55; ctx.drawImage(SMOKE, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
    ctx.globalCompositeOperation = 'lighter';
    for (const p of flames) {
      const r = p.r * (1 - p.life * .65);                           // flames taper as they rise
      ctx.globalAlpha = Math.sin(Math.PI * Math.min(p.life * 1.05, 1)) * .55;
      ctx.drawImage(S[p.life < .3 ? 0 : p.life < .65 ? 1 : 2], p.x - r, p.y - r, r * 2, r * 2);
    }
    for (const p of embers) {
      ctx.globalAlpha = Math.sin(Math.PI * p.life);
      ctx.fillStyle = p.life < .5 ? '#ffd27a' : '#ff7a2b';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(2.5, (t - last) / 16.7 || 1); last = t;
    step(dt); draw();
    if (!reduce) requestAnimationFrame(loop);
  }

  addEventListener('resize', init);
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running && !reduce) { last = performance.now(); requestAnimationFrame(loop); } });
  init();
  if (reduce) { for (let i = 0; i < 90; i++) step(1); draw(); } else requestAnimationFrame(loop);
})();

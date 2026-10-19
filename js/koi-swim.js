/* Hassan Fish Store — real koi photos that swim and follow the cursor (three.js r149, global THREE).
   Each koi is a cut-out photo mapped onto a ribbon that bends along a swimming spine.
   Exposes window.KoiSwim = { initHero }. */
(function () {
  'use strict';
  if (!window.THREE) { window.KoiSwim = null; return; }
  const T = window.THREE;

  // ---------- math helpers ----------
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

  // Grid with i running head → tail and j running across the photo.
  function gridGeometry(rows, cols) {
    const g = new T.BufferGeometry();
    const count = rows * (cols + 1);
    const pos = new Float32Array(count * 3), uv = new Float32Array(count * 2), idx = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j <= cols; j++) {
        const k = i * (cols + 1) + j;
        uv[k * 2] = j / cols; uv[k * 2 + 1] = 1 - i / (rows - 1);
      }
    }
    for (let i = 0; i < rows - 1; i++) {
      for (let j = 0; j < cols; j++) {
        const a = i * (cols + 1) + j, b = a + cols + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    g.setIndex(idx);
    g.setAttribute('position', new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage));
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    return g;
  }

  // Soft shadow: the photo's alpha, sampled at a blurry mip level.
  function shadowMaterial(tex, opacity) {
    return new T.ShaderMaterial({
      uniforms: { map: { value: tex }, opacity: { value: opacity } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D map; uniform float opacity; varying vec2 vUv;
        void main(){
          float a = texture2D(map, vUv, 2.5).a;
          a *= smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x) * smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
          gl_FragColor = vec4(0.0, 0.02, 0.08, a * opacity);
        }`,
      transparent: true, depthWrite: false, side: T.DoubleSide
    });
  }

  const SPINE = 40, ROWS = 56, COLS = 10;
  const WHITE = new T.Color(0xffffff);

  // ---------- one swimming photo koi ----------
  class PhotoKoi {
    constructor(tex, aspect, opts) {
      this.L = opts.length || 2.6;
      this.W = this.L * aspect;
      this.maxSpeed = (opts.maxSpeed || 0.85) * this.L;
      this.minSpeed = (opts.minSpeed || 0.14) * this.L;
      this.z = this.baseZ = opts.z || 0;
      this.baseTint = new T.Color(opts.tint || 0xffffff);
      this.seg = this.L / (SPINE - 1);
      this.heading = opts.heading || 0;
      this.speed = this.minSpeed;
      this.phase = Math.random() * TAU;
      this.time = Math.random() * 10;
      this.angVel = 0; this.sf = 0;
      this.orbitDir = Math.random() < 0.5 ? -1 : 1;

      this.px = new Float32Array(SPINE); this.py = new Float32Array(SPINE);
      this.qx = new Float32Array(SPINE); this.qy = new Float32Array(SPINE);
      this.fx = new Float32Array(SPINE); this.fy = new Float32Array(SPINE);
      for (let i = 0; i < SPINE; i++) {
        this.px[i] = (opts.x || 0) - Math.cos(this.heading) * this.seg * i;
        this.py[i] = (opts.y || 0) - Math.sin(this.heading) * this.seg * i;
      }

      this.group = new T.Group();
      this.group.position.z = this.z;
      const geo = gridGeometry(ROWS, COLS);
      this.mat = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide, color: opts.tint || 0xffffff });
      this.mat.toneMapped = false;
      this.body = new T.Mesh(geo, this.mat);
      this.body.frustumCulled = false;
      this.body.renderOrder = 2;
      this.shadow = new T.Mesh(geo, shadowMaterial(tex, opts.shadow === undefined ? 0.45 : opts.shadow));
      this.shadow.frustumCulled = false;
      this.shadow.renderOrder = 1;
      this.shadow.position.set(this.L * 0.07, -this.L * 0.11, -this.L * 0.35);
      this.group.add(this.shadow, this.body);
      this.S = { x: 0, y: 0, fx: 1, fy: 0, sx: 0, sy: 1 };
      this.pose(0);
    }

    get headX() { return this.px[0]; }
    get headY() { return this.py[0]; }

    // Steer the head toward (tx, ty), circling it lazily once close; `rush` > 1 speeds up (e.g. for food).
    steer(dt, tx, ty, rush) {
      rush = rush || 1;
      const dx = tx - this.px[0], dy = ty - this.py[0];
      const dist = Math.hypot(dx, dy);
      const orbit = this.L * 0.45;
      let desired = Math.atan2(dy, dx);
      if (dist < orbit) desired += (1 - dist / orbit) * 1.4 * this.orbitDir;
      const diff = wrapAngle(desired - this.heading);

      let target = lerp(this.minSpeed, this.maxSpeed * rush, smooth(this.L * 0.25, this.L * 1.6, dist));
      target *= 1 - 0.45 * Math.min(1, Math.abs(diff) / Math.PI);
      this.speed += (target - this.speed) * Math.min(1, dt * 1.6);

      const turn = Math.max(1.3, this.speed / (this.L * 0.28));
      const dh = clamp(diff, -turn * dt, turn * dt);
      this.heading = wrapAngle(this.heading + dh);
      this.angVel = lerp(this.angVel, dh / Math.max(dt, 1e-4), Math.min(1, dt * 4));
      this.px[0] += Math.cos(this.heading) * this.speed * dt;
      this.py[0] += Math.sin(this.heading) * this.speed * dt;
      this.sf = clamp((this.speed - this.minSpeed) / (this.maxSpeed - this.minSpeed), 0, 1);
      this.follow();
    }

    // Body segments trail the head like a chain, with a bend limit so the photo never folds.
    follow() {
      const px = this.px, py = this.py, seg = this.seg, maxBend = 0.07;
      for (let i = 1; i < SPINE; i++) {
        let dx = px[i] - px[i - 1], dy = py[i] - py[i - 1];
        const len = Math.hypot(dx, dy) || 1e-6; dx /= len; dy /= len;
        let qx, qy;
        if (i === 1) { qx = -Math.cos(this.heading); qy = -Math.sin(this.heading); }
        else {
          qx = px[i - 1] - px[i - 2]; qy = py[i - 1] - py[i - 2];
          const ql = Math.hypot(qx, qy) || 1e-6; qx /= ql; qy /= ql;
        }
        const ang = Math.atan2(qx * dy - qy * dx, qx * dx + qy * dy);
        if (Math.abs(ang) > maxBend) {
          const a = Math.sign(ang) * maxBend, c = Math.cos(a), s = Math.sin(a);
          dx = qx * c - qy * s; dy = qx * s + qy * c;
        }
        px[i] = px[i - 1] + dx * seg; py[i] = py[i - 1] + dy * seg;
      }
    }

    sample(t, S) {
      const f = clamp(t, 0, 1) * (SPINE - 1);
      const i = Math.min(Math.floor(f), SPINE - 2), k = f - i;
      S.x = lerp(this.qx[i], this.qx[i + 1], k);
      S.y = lerp(this.qy[i], this.qy[i + 1], k);
      let fx = lerp(this.fx[i], this.fx[i + 1], k), fy = lerp(this.fy[i], this.fy[i + 1], k);
      const l = Math.hypot(fx, fy) || 1; fx /= l; fy /= l;
      S.fx = fx; S.fy = fy; S.sx = -fy; S.sy = fx;
      return S;
    }

    pose(dt) {
      this.time += dt;
      this.phase += dt * (2.8 + 7 * this.sf);
      const { px, py, qx, qy, fx, fy } = this;
      const amp = this.L * (0.5 + 0.6 * this.sf);

      // swimming wave layered on top of the steering chain
      for (let i = 0; i < SPINE; i++) {
        const a = Math.max(0, i - 1), b = Math.min(SPINE - 1, i + 1);
        let tx = px[a] - px[b], ty = py[a] - py[b];
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const t = i / (SPINE - 1);
        const w = amp * (0.008 + 0.075 * Math.pow(t, 2.2)) * Math.sin(t * TAU * 0.9 - this.phase);
        qx[i] = px[i] - ty * w; qy[i] = py[i] + tx * w;
      }
      for (let i = 0; i < SPINE; i++) {
        const a = Math.max(0, i - 1), b = Math.min(SPINE - 1, i + 1);
        let tx = qx[a] - qx[b], ty = qy[a] - qy[b];
        const tl = Math.hypot(tx, ty) || 1; fx[i] = tx / tl; fy[i] = ty / tl;
      }

      // map the photo onto the bent spine; pectoral fins paddle a little
      const S = this.S, half = this.W / 2, L = this.L, time = this.time;
      const paddle = (1 - 0.7 * this.sf) * L * 0.03;
      const p = this.body.geometry.attributes.position.array;
      let k = 0;
      for (let i = 0; i < ROWS; i++) {
        const t = i / (ROWS - 1);
        this.sample(t, S);
        const finRow = smooth(0.12, 0.2, t) * (1 - smooth(0.3, 0.4, t));
        for (let j = 0; j <= COLS; j++) {
          const v = (j / COLS) * 2 - 1;
          const fin = finRow * smooth(0.5, 1, Math.abs(v));
          const sway = fin * paddle * Math.sin(time * 2.6 + (v > 0 ? 0 : 1.4));
          p[k++] = S.x + S.sx * v * half + S.fx * sway;
          p[k++] = S.y + S.sy * v * half + S.fy * sway;
          p[k++] = fin * paddle * 0.6 * Math.cos(time * 2.6);
        }
      }
      this.body.geometry.attributes.position.needsUpdate = true;
      this.group.position.z = this.z + L * 0.03 * Math.sin(time * 0.8);
    }
  }

  function dotSprite() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(cv);
  }

  // ---------- hero scene ----------
  // fish: [{ photo, length, x, y, heading, z, follow, tint }] — `follow` koi chase the pointer, the rest wander.
  function initHero(canvas, photos, fish) {
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);  // transparent: the page's ocean photo shows through

    const scene = new T.Scene();
    scene.fog = new T.Fog(0x1a6a8c, 12, 30);
    const camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
    const halfFov = T.MathUtils.degToRad(17.5);

    // drifting particles
    const PN = 220, pPos = new Float32Array(PN * 3), pSpd = new Float32Array(PN);
    for (let i = 0; i < PN; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 26;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pPos[i * 3 + 2] = -8 + Math.random() * 10;
      pSpd[i] = 0.05 + Math.random() * 0.18;
    }
    const pGeo = new T.BufferGeometry();
    pGeo.setAttribute('position', new T.BufferAttribute(pPos, 3).setUsage(T.DynamicDrawUsage));
    const particles = new T.Points(pGeo, new T.PointsMaterial({
      size: 0.06, map: dotSprite(), color: 0xbfe6ff, transparent: true, opacity: 0.6,
      depthWrite: false, blending: T.AdditiveBlending
    }));
    particles.frustumCulled = false; particles.renderOrder = 5;
    scene.add(particles);

    // koi, added as their photos load (deepest first so nearer koi draw on top)
    const kois = [];
    const loader = new T.TextureLoader();
    fish.slice().sort((a, b) => (a.z || 0) - (b.z || 0)).forEach((f, order) => {
      const ph = photos[f.photo];
      if (!ph) return;
      loader.load(ph.src, tex => {
        tex.encoding = T.sRGBEncoding;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const koi = new PhotoKoi(tex, ph.w / ph.h, f);
        koi.chasesPointer = !!f.follow;
        koi.wanderSeed = order * 37 + 5;
        koi.body.renderOrder += order * 3; koi.shadow.renderOrder += order * 3;
        kois.push(koi);
        scene.add(koi.group);
      });
    });

    // food pellets and ripples
    const pellets = [], ripples = [];
    const pelletGeo = new T.SphereGeometry(0.045, 10, 8);
    const pelletMat = new T.MeshBasicMaterial({ color: 0xa8682e });
    const ringGeo = new T.RingGeometry(0.92, 1, 64);
    function ripple(x, y, size) {
      const m = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.6, depthWrite: false, fog: false }));
      m.position.set(x, y, 0.5);
      m.renderOrder = 50;
      m.userData = { age: 0, size };
      scene.add(m); ripples.push(m);
    }

    let view = { halfW: 6, halfH: 3.8 };
    function resize() {
      const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      const halfH = Math.max(3.8, 3.9 / aspect);
      const dist = halfH / Math.tan(halfFov);
      camera.aspect = aspect;
      camera.position.set(0, 0, dist);
      camera.updateProjectionMatrix();
      scene.fog.near = dist; scene.fog.far = dist + 18;
      view = { halfW: halfH * aspect, halfH };
    }
    resize();
    window.addEventListener('resize', resize);

    // pointer → world (on the z = 0 plane)
    const ray = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 0, 1), 0), hit = new T.Vector3();
    function toWorld(cx, cy) {
      const r = canvas.getBoundingClientRect();
      if (cy < r.top || cy > r.bottom || cx < r.left || cx > r.right) return null;
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.ray.intersectPlane(plane, hit) ? { x: hit.x, y: hit.y } : null;
    }
    let pointer = null, pointerAt = -1e9, touchMode = false;
    const onMove = (x, y, touch) => { pointer = toWorld(x, y); pointerAt = performance.now(); touchMode = touch; };
    window.addEventListener('pointermove', e => onMove(e.clientX, e.clientY, e.pointerType !== 'mouse'), { passive: true });
    window.addEventListener('pointerdown', e => onMove(e.clientX, e.clientY, e.pointerType !== 'mouse'), { passive: true });
    window.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY, true); }, { passive: true });
    document.addEventListener('mouseleave', () => { pointer = null; });

    function feed(cx, cy) {
      const w = toWorld(cx, cy);
      if (!w) return;
      const m = new T.Mesh(pelletGeo, pelletMat);
      m.position.set(w.x, w.y, 0.9);
      m.renderOrder = 40;
      m.userData = { age: 0 };
      scene.add(m); pellets.push(m);
      ripple(w.x, w.y, 0.9);
    }

    const wander = (t, seed, sx, sy) => ({
      x: view.halfW * sx * Math.sin(t * (0.09 + (seed % 7) * 0.012) + seed),
      y: view.halfH * sy * Math.sin(t * (0.13 + (seed % 5) * 0.015) + seed * 2.3)
    });

    let running = true, last = performance.now(), clock = 0;
    const io = new IntersectionObserver(es => { running = es[0].isIntersecting; if (running) last = performance.now(); });
    io.observe(canvas);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) last = performance.now(); });

    function frame(now) {
      requestAnimationFrame(frame);
      if (!running || document.hidden) return;
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now; clock += dt;

      const idleMs = touchMode ? 2500 : 8000;
      const pointerLive = pointer && now - pointerAt < idleMs;
      const camZ = camera.position.z;
      // where a pellet at z = 0 appears on a deeper koi's plane, so deep koi visually reach the food
      const onPlane = (p, koi) => { const k = (camZ - koi.z) / camZ; return { x: p.position.x * k, y: p.position.y * k }; };
      for (const koi of kois) {
        // every koi races for the nearest food, then followers chase the pointer, otherwise wander
        let target = null, best = Infinity;
        for (const p of pellets) {
          const q = onPlane(p, koi);
          const d = Math.hypot(q.x - koi.headX, q.y - koi.headY);
          if (d < best) { best = d; target = q; }
        }
        const feeding = !!target;
        if (!target && koi.chasesPointer && pointerLive) target = pointer;
        if (!target) target = koi.chasesPointer ? wander(clock, koi.wanderSeed, 0.6, 0.5) : wander(clock, koi.wanderSeed, 1.05, 0.95);
        // deep koi rise toward the surface while feeding, and sink back afterwards
        koi.z = lerp(koi.z, feeding ? koi.baseZ * 0.35 : koi.baseZ, Math.min(1, dt * (feeding ? 1.2 : 0.4)));
        koi.mat.color.copy(koi.baseTint).lerp(WHITE, koi.baseZ ? 1 - koi.z / koi.baseZ : 0);
        koi.steer(dt, target.x, target.y, feeding ? 1.8 : 1);
        koi.pose(dt);
      }

      for (let i = pellets.length - 1; i >= 0; i--) {
        const p = pellets[i];
        p.userData.age += dt;
        p.position.z = Math.max(0.05, p.position.z - dt * 0.25);
        const eater = kois.find(k => { const q = onPlane(p, k); return Math.hypot(q.x - k.headX, q.y - k.headY) < k.L * 0.1; });
        if (eater || p.userData.age > 14) {
          if (eater) { ripple(p.position.x, p.position.y, 0.5); eater.speed *= 0.6; }
          scene.remove(p); pellets.splice(i, 1);
        }
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i], u = r.userData;
        u.age += dt;
        const s = 0.05 + u.size * u.age / 1.4;
        r.scale.set(s, s, s);
        r.material.opacity = 0.6 * (1 - u.age / 1.4);
        if (u.age > 1.4) { scene.remove(r); r.material.dispose(); ripples.splice(i, 1); }
      }

      const pa = pGeo.attributes.position.array;
      for (let i = 0; i < PN; i++) {
        pa[i * 3 + 1] += pSpd[i] * dt;
        pa[i * 3] += Math.sin(clock * 0.5 + i) * 0.002;
        if (pa[i * 3 + 1] > 9) pa[i * 3 + 1] = -9;
      }
      pGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);

    return { feed };
  }

  window.KoiSwim = { initHero };
})();

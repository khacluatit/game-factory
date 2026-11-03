// Quiet Pagoda — chính điện 3D + nghi thức + trạng thái. Chạy trong WKWebView (có cầu nối native) hoặc trình duyệt (giả lập mua).
(function () {
  'use strict';
  const T = window.T, LANG = window.LANG, NAMES = window.NAMES;
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const SHOT = params.get('shot') || window.QP_SHOT || null;
  const native = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.qp);
  const post = m => { if (native) { try { window.webkit.messageHandlers.qp.postMessage(m); } catch (e) { /* ignore */ } } };
  const TZ = LANG === 'zh' ? 8 : 7;
  const H24 = 24 * 3600 * 1000;

  // ---------------- products ----------------
  const P = {
    incense: { id: 'com.beemob.quietpagoda.incense', kind: 'offer' },
    lantern: { id: 'com.beemob.quietpagoda.lantern', kind: 'offer' },
    fruit: { id: 'com.beemob.quietpagoda.fruit', kind: 'offer' },
    robes: { id: 'com.beemob.quietpagoda.robes', kind: 'keep' },
    beadsSkin: { id: 'com.beemob.quietpagoda.beads', kind: 'keep' },
    tet: { id: 'com.beemob.quietpagoda.tet', kind: 'keep' }
  };
  const price = {}; Object.keys(P).forEach(k => price[k] = '$0.99');
  const keyById = id => Object.keys(P).find(k => P[k].id === id);

  // ---------------- state ----------------
  const DEF = {
    v: 1, name: null, streak: 0, lastDay: null, restWeek: null, visits: 0, lotus: 0, wish: '',
    totals: { bow: 0, beads: 0, moktak: 0 }, today: { day: null, bow: 0, beads: 0, moktak: 0, litAt: 0, prompted: false },
    owned: {}, robe: '#7A6A5A', tetOn: true, offerings: [],
    settings: { ambient: true, effects: true, haptics: true, nMorning: false, nEvening: false, nMoon: true }, onboarded: false
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  function load() {
    let s = null;
    try { if (window.QP_STATE) s = typeof window.QP_STATE === 'string' ? JSON.parse(window.QP_STATE) : window.QP_STATE; } catch (e) { s = null; }
    if (!s) { try { s = JSON.parse(localStorage.getItem('qp') || 'null'); } catch (e) { s = null; } }
    s = s || {};
    const out = Object.assign(clone(DEF), s);
    out.settings = Object.assign(clone(DEF.settings), s.settings || {});
    out.totals = Object.assign(clone(DEF.totals), s.totals || {});
    out.today = Object.assign(clone(DEF.today), s.today || {});
    out.owned = Object.assign({}, s.owned || {});
    return out;
  }
  let S = load();
  if (!S.name) S.name = NAMES[Math.floor(Math.random() * NAMES.length)];
  let saveTimer = 0;
  function save() {
    if (SHOT) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const j = JSON.stringify(S);
      post({ type: 'save', state: j });
      try { localStorage.setItem('qp', j); } catch (e) { /* ignore */ }
    }, 300);
  }
  const pad = n => (n < 10 ? '0' : '') + n;
  const dayKey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const weekKey = d => { const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return dayKey(x); };
  function rollDay() { const k = dayKey(new Date()); if (S.today.day !== k) S.today = { day: k, bow: 0, beads: 0, moktak: 0, litAt: 0, prompted: false }; }
  function markVisit() {
    const now = new Date(), k = dayKey(now);
    if (S.lastDay === k) return;
    let gap = 99;
    if (S.lastDay) gap = Math.round((new Date(k + 'T12:00:00') - new Date(S.lastDay + 'T12:00:00')) / H24);
    if (gap === 1) S.streak++;
    else if (gap === 2 && S.restWeek !== weekKey(now)) { S.streak++; S.restWeek = weekKey(now); }
    else S.streak = 1;
    S.lastDay = k; S.visits++; save(); renderTop();
  }
  rollDay();
  S.offerings = (S.offerings || []).filter(o => o.until > Date.now());

  if (SHOT) {
    Object.assign(S, { streak: 7, visits: 23, lotus: 12, onboarded: true, wish: LANG === 'vi' ? 'Mong mẹ mau khỏe, cả nhà bình an qua mùa đông.' : (LANG === 'zh' ? '願母親早日康復，闔家平安過冬。' : 'May my mother get well soon and the family stay safe this winter.') });
    S.totals = { bow: 1240, beads: 9 * 108, moktak: 300 };
    S.today = { day: dayKey(new Date()), bow: 72, beads: 0, moktak: 0, litAt: Date.now(), prompted: true };
    S.offerings = [
      { type: 'lantern', wish: 0, name: NAMES[0], until: Date.now() + 21 * 3600e3 },
      { type: 'lantern', wish: 3, name: NAMES[4], until: Date.now() + 9 * 3600e3 },
      { type: 'lantern', wish: 1, name: NAMES[7], until: Date.now() + 15 * 3600e3 },
      { type: 'fruit', wish: 2, name: NAMES[2], until: Date.now() + 5 * 3600e3 }
    ];
  }

  // ---------------- time & calendar ----------------
  function hourNow() { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  function phaseOf(h) { if (h >= 4.5 && h < 6.8) return 'dawn'; if (h >= 6.8 && h < 16.5) return 'day'; if (h >= 16.5 && h < 19) return 'dusk'; return 'night'; }
  const forcedPhase = params.get('phase') || (SHOT === 'pond' ? 'night' : SHOT === 'journal' ? 'day' : SHOT ? 'dusk' : null);
  const phase = () => forcedPhase || phaseOf(hourNow());
  const inRitual = () => { if (SHOT) return false; const h = hourNow(); return (h >= 5 && h < 5.5) || (h >= 18 && h < 18.5); };
  const lunarToday = () => window.Lunar.lunarOf(new Date(), TZ);
  function daysToFull() { const d = new Date(); for (let i = 0; i < 31; i++) { const x = new Date(d); x.setDate(d.getDate() + i); if (window.Lunar.lunarOf(x, TZ).day === 15) return i; } return 0; }
  const moonDay = () => SHOT === 'pond' || [1, 15].includes(lunarToday().day);

  // ---------------- renderer & scene ----------------
  const canvas = $('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !!SHOT });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#120806');
  scene.fog = new THREE.FogExp2('#1a0d0a', 0.045);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);

  const std = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0 }, o || {}));
  function mesh(geo, mat, x, y, z, shadow, parent) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    (parent || scene).add(m); return m;
  }
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const radialTex = (inner, outer) => canvasTex(64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const flameTex = canvasTex(64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,230,180,1)'); gr.addColorStop(0.4, 'rgba(255,170,90,0.6)'); gr.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const smokeTex = radialTex('rgba(255,255,255,0.55)', 'rgba(255,255,255,0)');
  const glowTex = radialTex('rgba(255,220,160,0.9)', 'rgba(255,200,120,0)');

  const gold = std('#C9963E', { metalness: 0.75, roughness: 0.32 });
  const lacquer = std('#7A2418', { roughness: 0.45 });
  const darkWood = std('#3A1D14', { roughness: 0.85 });
  const wallMat = std('#4A2018', { roughness: 0.95 });

  // floor
  const floorTex = canvasTex(512, 512, (g, w) => {
    g.fillStyle = '#5A3424'; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#553020' : '#5E3726'; g.fillRect(0, i * 32, w, 32); g.fillStyle = '#3E2216'; g.fillRect(0, i * 32, w, 2); const off = (i * 97) % 256; g.fillRect(off, i * 32, 2, 32); g.fillRect(off + 256, i * 32, 2, 32); }
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 5);
  const floor = mesh(new THREE.PlaneGeometry(12, 19.2), std('#ffffff', { map: floorTex, roughness: 0.7 }), 0, 0, 0);
  floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  const runner = mesh(new THREE.PlaneGeometry(1.4, 15), std('#6E1F18', { roughness: 0.95 }), 0, 0.005, 1.5); runner.rotation.x = -Math.PI / 2; runner.castShadow = false;
  mesh(new THREE.BoxGeometry(12, 6.5, 0.3), wallMat, 0, 3.25, -9.6);
  // front wall with door
  mesh(new THREE.BoxGeometry(4.6, 6.5, 0.3), wallMat, -3.7, 3.25, 9.6);
  mesh(new THREE.BoxGeometry(4.6, 6.5, 0.3), wallMat, 3.7, 3.25, 9.6);
  mesh(new THREE.BoxGeometry(2.8, 3.2, 0.3), wallMat, 0, 4.9, 9.6);
  const ceil = mesh(new THREE.PlaneGeometry(12, 19.2), darkWood, 0, 6.2, 0); ceil.rotation.x = Math.PI / 2;
  for (let z = -8; z <= 8; z += 2.6) mesh(new THREE.BoxGeometry(12, 0.3, 0.35), darkWood, 0, 6.0, z);
  for (const x of [-3.5, 3.5]) mesh(new THREE.BoxGeometry(0.35, 0.35, 19.2), darkWood, x, 5.85, 0);

  const shaftTex = canvasTex(64, 256, (g, w, h) => { for (let y = 0; y < h; y++) { const a = 0.55 * Math.pow(1 - y / h, 1.6); for (let x = 0; x < w; x++) { const e = Math.sin(Math.PI * x / (w - 1)); g.fillStyle = 'rgba(255,255,255,' + (a * e * e).toFixed(3) + ')'; g.fillRect(x, y, 1, 1); } } });
  const windowMats = [], shaftMats = [];
  for (const side of [-1, 1]) {
    const wall = mesh(new THREE.PlaneGeometry(19.2, 6.5), wallMat, side * 6, 3.25, 0); wall.rotation.y = -side * Math.PI / 2;
    for (const z of [-5.5, -1.5, 2.5]) {
      const pm = new THREE.MeshBasicMaterial({ color: '#F2B070' }); windowMats.push(pm);
      const pane = mesh(new THREE.PlaneGeometry(1.4, 2.0), pm, side * 5.97, 3.3, z, false); pane.rotation.y = -side * Math.PI / 2;
      for (let k = -1; k <= 1; k++) mesh(new THREE.BoxGeometry(0.06, 2.0, 0.06), darkWood, side * 5.93, 3.3, z + k * 0.45, false);
      mesh(new THREE.BoxGeometry(0.06, 0.06, 1.4), darkWood, side * 5.93, 3.3, z, false);
      if (z > 0) continue;
      const start = new THREE.Vector3(side * 5.9, 3.3, z), end = new THREE.Vector3(side * 1.2, 0, z + 1.6);
      const dir = end.clone().sub(start), len = dir.length(); dir.normalize();
      const sm = new THREE.MeshBasicMaterial({ color: '#F6D29A', map: shaftTex, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
      shaftMats.push(sm);
      for (let r = 0; r < 2; r++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.0, len), sm); s.position.copy(start).addScaledVector(dir, len / 2); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); s.rotateY(r * Math.PI / 2); scene.add(s); }
    }
  }
  const columns = [];
  for (const x of [-3.5, 3.5]) for (const z of [-6.2, -2.4, 1.4, 5.2]) {
    columns.push(mesh(new THREE.CylinderGeometry(0.26, 0.28, 6, 20), lacquer, x, 3, z));
    mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.25, 20), std('#7C746A', { roughness: 0.9 }), x, 0.12, z);
  }

  // altar & Buddha
  mesh(new THREE.BoxGeometry(7, 0.5, 3), std('#5A2014', { roughness: 0.6 }), 0, 0.25, -7.9);
  mesh(new THREE.BoxGeometry(5, 0.5, 2.2), std('#6E2A18', { roughness: 0.55 }), 0, 0.75, -8.1);
  mesh(new THREE.BoxGeometry(3.4, 0.08, 1.2), gold, 0, 1.04, -7.3);
  const B = new THREE.Group(); B.position.set(0, 1.0, -8.4); scene.add(B);
  mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.35, 32), gold, 0, 0.18, 0, true, B);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; const p = mesh(new THREE.SphereGeometry(0.22, 12, 8), gold, Math.cos(a), 0.38, Math.sin(a), true, B); p.scale.set(0.7, 1.1, 0.45); p.rotation.y = -a; p.rotation.z = 0.35; }
  const prof = [[0, 0], [0.92, 0], [0.98, 0.18], [0.78, 0.36], [0.5, 0.5], [0.52, 0.85], [0.56, 1.18], [0.42, 1.36], [0.16, 1.46], [0.13, 1.55], [0, 1.56]].map(p => new THREE.Vector2(p[0], p[1]));
  mesh(new THREE.LatheGeometry(prof, 40), gold, 0, 0.42, 0, true, B);
  mesh(new THREE.SphereGeometry(0.33, 32, 24), gold, 0, 2.25, 0, true, B);
  mesh(new THREE.SphereGeometry(0.13, 16, 12), gold, 0, 2.6, 0, true, B);
  const haloMat = new THREE.MeshBasicMaterial({ color: '#F6D29A', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const halo = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), haloMat); halo.position.set(0, 2.05, -0.55); B.add(halo);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.035, 8, 64), gold); ring.position.set(0, 2.25, -0.45); B.add(ring);
  const glow = new THREE.PointLight('#FFC77A', 6, 7, 2); glow.position.set(0, 2.6, -7.2); scene.add(glow);

  const flames = [];
  function candle(x, z) {
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12), std('#EFE4CC', { roughness: 0.6 }), x, 1.28, z);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    sp.position.set(x, 1.56, z); sp.scale.set(0.35, 0.5, 1); scene.add(sp);
    const l = new THREE.PointLight('#FFB46A', 2.2, 6, 2); l.position.set(x, 1.7, z + 0.2); scene.add(l);
    flames.push({ sp, l, base: 2.2, seed: Math.random() * 10 });
  }
  candle(-1.3, -7.2); candle(1.3, -7.2);
  for (const [x, c] of [[-0.7, '#E46B4A'], [-0.45, '#D9A441'], [0.5, '#8DAA5B'], [0.72, '#E89AAE']]) mesh(new THREE.SphereGeometry(0.11, 16, 12), std(c, { roughness: 0.5 }), x, 1.18, -7.15);
  for (const x of [-2.0, 2.0]) { mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.45, 16), std('#3E5C66', { roughness: 0.4 }), x, 1.3, -7.4); mesh(new THREE.SphereGeometry(0.22, 12, 10), std('#E8C7D0', { roughness: 0.8 }), x, 1.62, -7.4); }
  // bell & moktak beside the altar
  const bellG = new THREE.Group(); bellG.position.set(-3.0, 0, -6.6); scene.add(bellG);
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), darkWood, 0, 0.5, 0, true, bellG);
  mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.38, 24, 1, true), std('#6E5430', { metalness: 0.7, roughness: 0.4, side: THREE.DoubleSide }), 0, 1.2, 0, true, bellG);
  const mok = mesh(new THREE.SphereGeometry(0.28, 20, 14), std('#7A3A1E', { roughness: 0.5 }), 3.0, 0.62, -6.6); mok.scale.set(1.2, 0.8, 1);
  mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.45, 16), darkWood, 3.0, 0.22, -6.6);

  // fruit offering (shown while an offering is active)
  const fruitG = new THREE.Group(); fruitG.position.set(0, 1.08, -6.95); scene.add(fruitG);
  mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.06, 24), gold, 0, 0, 0, true, fruitG);
  [['#E46B4A', -0.18, 0.1, 0], ['#D9A441', 0.16, 0.12, 0.05], ['#8DAA5B', 0, 0.12, -0.16], ['#E89AAE', 0.02, 0.26, 0], ['#F2C14E', -0.06, 0.12, 0.18]].forEach(([c, x, y, z]) => mesh(new THREE.SphereGeometry(0.13, 16, 12), std(c, { roughness: 0.45 }), x, y, z, true, fruitG));
  fruitG.visible = false;

  // incense burner + smoke
  const burner = new THREE.Group(); burner.position.set(0, 0, -5.4); scene.add(burner);
  const bronze = std('#8C6A3E', { metalness: 0.6, roughness: 0.45 });
  mesh(new THREE.CylinderGeometry(0.45, 0.32, 0.4, 24), bronze, 0, 0.75, 0, true, burner);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8), bronze, Math.cos(a) * 0.28, 0.28, Math.sin(a) * 0.28, true, burner); }
  const tipMat = new THREE.MeshBasicMaterial({ color: '#552A1A' });
  for (let i = -1; i <= 1; i++) { const s = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6), std('#8A3A22'), i * 0.1, 1.2, 0, false, burner); s.rotation.z = i * 0.12; mesh(new THREE.SphereGeometry(0.025, 8, 6), tipMat, i * 0.064, 1.5, 0, false, burner); }
  const agarG = new THREE.Group(); burner.add(agarG);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const s = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), std('#5A2A18'), Math.cos(a) * 0.16, 1.3, Math.sin(a) * 0.16, false, agarG); s.rotation.z = Math.cos(a) * 0.1; s.rotation.x = Math.sin(a) * 0.1; mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: '#FF7A3A' }), Math.cos(a) * 0.2, 1.75, Math.sin(a) * 0.2, false, agarG); }
  agarG.visible = false;
  const SMOKE = 90, smokePos = new Float32Array(SMOKE * 3), smokeAge = new Float32Array(SMOKE);
  for (let i = 0; i < SMOKE; i++) smokeAge[i] = Math.random() * 4;
  const smokeGeo = new THREE.BufferGeometry(); smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
  const smokeMat = new THREE.PointsMaterial({ map: smokeTex, size: 0.5, transparent: true, opacity: 0.2, depthWrite: false, color: '#E8DCC8' });
  const smoke = new THREE.Points(smokeGeo, smokeMat); smoke.position.set(0, 1.5, -5.4); scene.add(smoke);

  // lanterns
  const lanternLights = [];
  function hangLantern(x, z, y) {
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 6.2 - (y || 4.4), 4), darkWood, x, (6.2 + (y || 4.4)) / 2, z, false);
    const lan = mesh(new THREE.SphereGeometry(0.24, 20, 14), new THREE.MeshStandardMaterial({ color: '#B8321F', emissive: '#C8462A', emissiveIntensity: 0.8, roughness: 0.6 }), x, y || 4.4, z, false); lan.scale.y = 1.2;
    mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.3, 6), std('#D9A441'), x, (y || 4.4) - 0.45, z, false);
    return lan;
  }
  for (const [x, z] of [[-2, -4.6], [2, -4.6], [-2, -1.0], [2, -1.0]]) {
    hangLantern(x, z);
    const l = new THREE.PointLight('#FF8A55', 1.6, 6, 2); l.position.set(x, 4.2, z); scene.add(l);
    const f = { sp: null, l, base: 1.6, seed: Math.random() * 10 }; flames.push(f); lanternLights.push(f);
  }

  // Tết decorations
  const tetG = new THREE.Group(); scene.add(tetG);
  function blossomTree(x, z, color) {
    const g = new THREE.Group(); g.position.set(x, 0, z); tetG.add(g);
    mesh(new THREE.CylinderGeometry(0.4, 0.32, 0.5, 16), std('#3E5C66', { roughness: 0.4 }), 0, 0.25, 0, true, g);
    mesh(new THREE.CylinderGeometry(0.05, 0.09, 1.6, 8), darkWood, 0, 1.2, 0, true, g);
    const pm = std(color, { roughness: 0.7 });
    for (let i = 0; i < 46; i++) { const a = Math.random() * Math.PI * 2, r = 0.2 + Math.random() * 0.75, y = 1.5 + Math.random() * 1.0; mesh(new THREE.SphereGeometry(0.09 + Math.random() * 0.05, 8, 6), pm, Math.cos(a) * r, y, Math.sin(a) * r * 0.7, false, g); }
  }
  blossomTree(-3.0, -8.4, '#F2A7B8'); blossomTree(3.0, -8.4, '#F2C94C');
  const coupletMat = std('#A8231A', { roughness: 0.6 });
  for (const x of [-3.5, 3.5]) { const c = mesh(new THREE.PlaneGeometry(0.4, 2.4), coupletMat, x + (x < 0 ? 0.3 : -0.3), 2.6, -2.4 + 0.29, false, tetG); c.rotation.y = 0; }
  tetG.visible = false;

  // ---------------- courtyard & lotus pond (outside the front door) ----------------
  const court = mesh(new THREE.PlaneGeometry(40, 30), std('#5E5446', { roughness: 0.95 }), 0, -0.01, 24.6); court.rotation.x = -Math.PI / 2; court.castShadow = false;
  const waterMat = new THREE.MeshStandardMaterial({ color: '#24394A', roughness: 0.15, metalness: 0.3 });
  const water = mesh(new THREE.CircleGeometry(5, 64), waterMat, 0, 0.03, 18); water.rotation.x = -Math.PI / 2; water.castShadow = false;
  const rim = mesh(new THREE.TorusGeometry(5.05, 0.18, 8, 64), std('#8A8172', { roughness: 0.9 }), 0, 0.06, 18); rim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + Math.random() * 0.2, r = 7 + Math.random() * 5; const h = 2.5 + Math.random() * 2.5; const t = mesh(new THREE.ConeGeometry(0.9 + Math.random() * 0.6, h, 7), std('#1F3326', { roughness: 0.9 }), Math.cos(a) * r, h / 2, 18 + Math.sin(a) * r + 2); t.castShadow = false; }
  const padMat = std('#3F6B4E', { roughness: 0.8, side: THREE.DoubleSide }), petalMat = std('#E89AAE', { roughness: 0.6 }), petal2 = std('#F0B6C4', { roughness: 0.6 });
  const lotusMats = [[petalMat, petal2], [std('#F4F0E6', { roughness: 0.6 }), std('#FFFFFF', { roughness: 0.6 })], [std('#E9C25A', { roughness: 0.6 }), std('#F2D88A', { roughness: 0.6 })]];
  const lotusG = new THREE.Group(); scene.add(lotusG);
  const pondSpot = i => { const a = i * 2.39996, r = 0.9 + Math.sqrt(i + 1) * 0.68; return [Math.cos(a) * Math.min(r, 4.4), 18 + Math.sin(a) * Math.min(r, 4.4)]; };
  for (let i = 0; i < 22; i++) { const [x, z] = pondSpot(i + 40); const p = mesh(new THREE.CircleGeometry(0.42 + Math.random() * 0.2, 16), padMat, x, 0.05, z, false); p.rotation.x = -Math.PI / 2; }
  function renderLotus() {
    while (lotusG.children.length) lotusG.remove(lotusG.children[0]);
    const n = S.lotus % 36 === 0 && S.lotus > 0 ? 36 : S.lotus % 36, gen = Math.floor(Math.max(S.lotus - 1, 0) / 36);
    for (let i = 0; i < n; i++) {
      const [x, z] = pondSpot(i); const mats = lotusMats[(gen + (i < (S.lotus % 36 || 36) ? 0 : 0)) % 3];
      const g = new THREE.Group(); g.position.set(x, 0.05, z); lotusG.add(g);
      const pd = mesh(new THREE.CircleGeometry(0.4, 16), padMat, 0, 0, 0, false, g); pd.rotation.x = -Math.PI / 2;
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const pt = mesh(new THREE.SphereGeometry(0.12, 10, 8), k % 2 ? mats[0] : mats[1], Math.cos(a) * 0.12, 0.12, Math.sin(a) * 0.12, false, g); pt.scale.set(0.6, 1.4, 0.4); pt.rotation.y = -a; pt.rotation.z = 0.5; }
      mesh(new THREE.SphereGeometry(0.06, 8, 6), std('#F2C14E'), 0, 0.16, 0, false, g);
    }
  }
  renderLotus();
  const pondLanternG = new THREE.Group(); scene.add(pondLanternG);
  const pondLanterns = [];
  function renderPondLanterns() {
    while (pondLanternG.children.length) pondLanternG.remove(pondLanternG.children[0]);
    pondLanterns.length = 0;
    S.offerings.filter(o => o.type === 'lantern').slice(-12).forEach((o, i) => {
      const g = new THREE.Group(); const a = i * 1.7 + 0.6, r = 1.4 + (i % 4) * 0.8; g.position.set(Math.cos(a) * r, 0.06, 18 + Math.sin(a) * r); pondLanternG.add(g);
      const base = mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.08, 16), petal2, 0, 0.02, 0, false, g);
      for (let k = 0; k < 8; k++) { const ang = k / 8 * Math.PI * 2; const pt = mesh(new THREE.SphereGeometry(0.13, 10, 8), petalMat, Math.cos(ang) * 0.17, 0.14, Math.sin(ang) * 0.17, false, g); pt.scale.set(0.6, 1.5, 0.45); pt.rotation.y = -ang; pt.rotation.z = 0.45; }
      const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); f.position.y = 0.3; f.scale.set(0.3, 0.4, 1); g.add(f);
      base.userData.o = o; pondLanterns.push({ g, o, a, r, seed: Math.random() * 6 });
    });
  }
  renderPondLanterns();
  const moon = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), new THREE.MeshBasicMaterial({ color: '#F3E6C4', fog: false })); moon.position.set(5.5, 6.5, 36); moon.lookAt(0, 4.6, 10.6); scene.add(moon);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#F3E6C4', blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.5 })); moonGlow.position.copy(moon.position); moonGlow.scale.set(12, 12, 1); scene.add(moonGlow);
  const moonRef = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#F3E6C4', blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.35 })); moonRef.position.set(1.6, 0.08, 21.5); moonRef.scale.set(1.2, 0.35, 1); scene.add(moonRef);
  const flies = []; for (let i = 0; i < 24; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#F6E27A', blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.scale.set(0.25, 0.25, 1); scene.add(s); flies.push({ s, a: Math.random() * 6.28, r: 1.5 + Math.random() * 3.5, h: 0.4 + Math.random() * 1.6, sp: 0.1 + Math.random() * 0.25 }); }

  // ---------------- cushions & avatars ----------------
  const cushions = [], cushMat = std('#8A2B1F', { roughness: 0.9 });
  for (const z of [-2.6, -0.4, 1.8]) for (const x of [-4.5, -3.0, -1.5, 1.5, 3.0, 4.5]) { const c = mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.14, 24), cushMat, x, 0.07, z); c.userData = { x, z, taken: null }; cushions.push(c); }
  const robes = ['#7D8A96', '#8C7D6B', '#7A6650', '#8A939E', '#9A8A78'];
  const skin = std('#E8C4A0', { roughness: 0.7 }), hair = std('#24170F', { roughness: 0.9 });
  function makeAvatar(robe) {
    const g = new THREE.Group(), p = new THREE.Group(); g.add(p);
    const body = mesh(new THREE.CylinderGeometry(0.2, 0.36, 0.55, 18), std(robe, { roughness: 0.85 }), 0, 0.42, 0, true, p);
    mesh(new THREE.SphereGeometry(0.26, 24, 18), skin, 0, 0.9, 0, true, p);
    const h = mesh(new THREE.SphereGeometry(0.275, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, 0, 0.92, 0, false, p); h.rotation.x = 0.55;
    g.userData = { pivot: p, body, bowT: 0, small: false };
    scene.add(g); return g;
  }
  const npcs = [];
  const seatAt = (av, c) => { av.position.set(c.userData.x, 0.12, c.userData.z); av.rotation.y = 0; c.userData.taken = av; av.userData.cushion = c; };
  const freeCushions = () => cushions.filter(c => !c.userData.taken);
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  function npcTarget() {
    const p = phase(); let n = { dawn: 4, day: 5, dusk: 6, night: 3 }[p];
    if (inRitual()) n = 12; if (moonDay()) n = Math.round(n * 1.5);
    if (SHOT === 'pond' || SHOT === 'journal') n = 6; else if (SHOT) n = 9;
    return Math.min(n, 16);
  }
  function spawnSeated() {
    const fc = freeCushions(); if (!fc.length) return;
    const c = rnd(fc), av = makeAvatar(rnd(robes));
    Object.assign(av.userData, { name: rnd(NAMES), state: 'sit', nextBow: 2 + Math.random() * 8, leaveAt: 40 + Math.random() * 90 });
    seatAt(av, c); npcs.push(av);
  }
  function spawnWalker() {
    const fc = freeCushions(); if (!fc.length) return;
    const c = rnd(fc); c.userData.taken = 'reserved';
    const av = makeAvatar(rnd(robes));
    Object.assign(av.userData, { name: rnd(NAMES), state: 'enter', target: c, pi: 0, path: [new THREE.Vector3(0, 0, c.userData.z + 0.9), new THREE.Vector3(c.userData.x, 0, c.userData.z + 0.9), new THREE.Vector3(c.userData.x, 0.12, c.userData.z)] });
    av.position.set(0, 0, 9.4); npcs.push(av);
  }

  // player
  const player = makeAvatar(S.robe);
  const HALL_SPOT = new THREE.Vector3(0.9, 0, 5.4);
  player.position.copy(HALL_SPOT);
  function applyRobe() { player.userData.body.material.color.set(S.robe); }
  let mode = 'hall', walk = null, playerCushion = null;

  // ---------------- lighting & phases ----------------
  const ambient = new THREE.AmbientLight('#FFE2C0', 0.2); scene.add(ambient);
  const hemi = new THREE.HemisphereLight('#FFD9A8', '#2A1410', 0.25); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFB070', 1.4); sun.position.set(-11, 8, 3); sun.target.position.set(0, 0, -1); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 }); sun.shadow.bias = -0.0005;
  const outLight = new THREE.DirectionalLight('#FFE0B0', 0.0); outLight.position.set(6, 10, 30); outLight.target.position.set(0, 0, 18); scene.add(outLight, outLight.target);
  const PH = {
    dawn: { win: '#F4C08E', sun: '#FFC9A0', si: 1.2, amb: 0.28, fog: '#2A1A16', sky: '#C98E7A', fd: 0.04, shaft: 0.2, lamp: 0.9, out: 0.8, water: '#5A6A7A' },
    day: { win: '#F6E3B8', sun: '#FFF0D0', si: 1.6, amb: 0.36, fog: '#2A1A14', sky: '#9DB4C4', fd: 0.035, shaft: 0.18, lamp: 0.6, out: 1.4, water: '#4E6E80' },
    dusk: { win: '#F2A860', sun: '#FFB070', si: 1.4, amb: 0.2, fog: '#1A0D0A', sky: '#D9875A', fd: 0.045, shaft: 0.24, lamp: 1.0, out: 0.9, water: '#3C4A5C' },
    night: { win: '#2B3656', sun: '#6A7FB0', si: 0.15, amb: 0.17, fog: '#0E0A0C', sky: '#141A2C', fd: 0.05, shaft: 0.0, lamp: 1.5, out: 0.25, water: '#1C2A3A' }
  };
  let curPhase = null;
  function applyPhase(force) {
    const k = phase(); if (k === curPhase && !force) return; curPhase = k; const t = PH[k];
    windowMats.forEach(m => m.color.set(t.win)); shaftMats.forEach(m => m.opacity = t.shaft);
    sun.color.set(t.sun); sun.intensity = t.si; ambient.intensity = t.amb; outLight.intensity = t.out; waterMat.color.set(t.water);
    flames.forEach(f => f.mult = t.lamp * (moonDay() && f !== flames[0] && f !== flames[1] ? 1.25 : 1));
    moon.visible = moonGlow.visible = moonRef.visible = k === 'night'; flies.forEach(f => f.s.visible = k === 'night' || k === 'dusk');
    applyFog();
  }
  function applyFog() {
    const t = PH[curPhase];
    if (mode === 'pond' || mode === 'toPond') { scene.fog.color.set(t.sky); scene.fog.density = 0.018; scene.background.set(t.sky); }
    else { scene.fog.color.set(t.fog); scene.fog.density = t.fd; scene.background.set(t.fog); }
  }
  applyPhase(true);

  function applyOfferings() {
    const now = Date.now();
    S.offerings = S.offerings.filter(o => o.until > now);
    agarG.visible = S.offerings.some(o => o.type === 'incense');
    fruitG.visible = S.offerings.some(o => o.type === 'fruit');
    tetG.visible = !!(S.owned.tet && S.tetOn);
    renderPondLanterns();
  }
  applyOfferings();

  // ---------------- camera & input ----------------
  let yaw = 0, pitch = 0;
  const camPos = new THREE.Vector3(0, 2.9, 8.6), camTarget = new THREE.Vector3(0, 1.7, -6);
  const camAt = camPos.clone(), camLook = camTarget.clone();
  let dragging = false, moved = 0, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', e => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } Audio.unlock(); });
  canvas.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy); yaw = THREE.MathUtils.clamp(yaw - dx * 0.004, -0.6, 0.6); pitch = THREE.MathUtils.clamp(pitch - dy * 0.003, -0.3, 0.3); });
  canvas.addEventListener('pointerup', e => { dragging = false; if (moved < 10) pick(e); });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let tagFor = null, tagUntil = 0, tagText = '';
  function pick(e) {
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (mode === 'pond') {
      const hit = ray.intersectObjects(pondLanternG.children, true)[0];
      if (hit) { let o = hit.object; while (o.parent && o.parent !== pondLanternG) o = o.parent; const pl = pondLanterns.find(p => p.g === o); if (pl) showTag(pl.g, pl.o.name + ' · ' + T.wishes[pl.o.wish] + ' · ' + T.hoursLeft(Math.max(1, Math.round((pl.o.until - Date.now()) / 3600e3)))); }
      return;
    }
    const avHit = ray.intersectObjects(npcs, true)[0];
    if (avHit) { let o = avHit.object; while (o.parent && !npcs.includes(o)) o = o.parent; showTag(o, T.pilgrim + ' · ' + o.userData.name); return; }
    if (mode !== 'hall') return;
    const fh = ray.intersectObject(floor)[0]; if (!fh) return;
    let best = null, bd = 1.0;
    for (const c of cushions) { const d = Math.hypot(c.userData.x - fh.point.x, c.userData.z - fh.point.z); if (d < bd) { bd = d; best = c; } }
    if (!best) { const bh = ray.intersectObject(burner, true)[0]; if (bh) openOffer(); return; }
    if (best.userData.taken) { flashHint(T.seatTaken); return; }
    goSit(best);
  }
  function showTag(obj, text) { tagFor = obj; tagText = text; tagUntil = clock.elapsedTime + 3.5; $('tag').textContent = text; }

  // ---------------- UI ----------------
  const hallUI = $('hallUI'), sitUI = $('sitUI'), pondUI = $('pondUI');
  function renderTop() {
    const l = lunarToday(); $('lunar').firstChild.nodeValue = T.lunar(l.day, l.month);
    $('lunar2').textContent = l.day === 1 ? T.newMoon : T.toFull(daysToFull());
    $('streakChip').textContent = T.streak(S.streak);
  }
  function renderStatic() {
    $('bIncense').textContent = T.incense; $('bPond').textContent = T.pond; $('bEnter').textContent = T.enter; $('bStand').textContent = T.stand;
    $('npcNote').textContent = T.npcNote; $('hint').textContent = T.tapCushion;
    $('bLantern').textContent = T.items.lantern + ' · ' + price.lantern;
    ['gassho', 'bow', 'beads', 'moktak'].forEach(k => { $('r-' + k).querySelector('span').textContent = T[k]; });
    $('bJournal').setAttribute('aria-label', T.journal); $('bSettings').setAttribute('aria-label', T.settings);
    $('lotusCount').textContent = T.lotusCount(S.lotus % 36 || (S.lotus ? 36 : 0), 36);
    document.title = T.title;
  }
  let hintTimer = 0;
  function flashHint(t) { $('hint').textContent = t; clearTimeout(hintTimer); hintTimer = setTimeout(() => { $('hint').textContent = T.tapCushion; }, 2500); }
  let toastTimer = 0;
  function toast(text, actions) {
    const el = $('toast'); el.innerHTML = ''; const s = document.createElement('div'); s.textContent = text; el.appendChild(s);
    if (actions) { const row = document.createElement('div'); row.className = 'row'; actions.forEach(([label, fn, cls]) => { const b = document.createElement('button'); b.textContent = label; b.className = cls || ''; b.style.background = cls === 'gold' ? 'var(--gold)' : 'var(--paper-2)'; b.style.color = 'var(--brown)'; b.onclick = () => { el.hidden = true; fn && fn(); }; row.appendChild(b); }); el.appendChild(row); }
    el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, actions ? 7000 : 2600);
  }
  function updateBanner() {
    const b = $('banner'), h = hourNow();
    if (mode === 'pond') { b.hidden = true; return; }
    if (inRitual()) { b.textContent = T.ritualNow; b.hidden = false; return; }
    const next = [5, 18].find(x => x > h && x - h <= 0.5);
    if (next !== undefined && !SHOT) { b.textContent = T.ritualSoon(next === 5 ? '5:00' : '18:00'); b.hidden = false; } else b.hidden = true;
  }

  // ---------------- sitting & rituals ----------------
  function goSit(c) {
    c.userData.taken = player; playerCushion = c; mode = 'walking';
    walk = { pts: [player.position.clone(), new THREE.Vector3(0, 0, c.userData.z + 0.9), new THREE.Vector3(c.userData.x, 0, c.userData.z + 0.9), new THREE.Vector3(c.userData.x, 0.12, c.userData.z)], i: 0 };
    flashHint(T.walking); haptic('light');
  }
  function sitDone() { mode = 'sit'; player.rotation.y = 0; hallUI.hidden = true; sitUI.hidden = false; selectRitual(ritual); showCount(); }
  function stand() {
    mode = 'hall'; if (playerCushion) playerCushion.userData.taken = null; playerCushion = null; holdBow = false;
    player.position.copy(HALL_SPOT); player.rotation.y = 0; player.userData.pivot.rotation.x = 0; player.userData.bowT = 0;
    hallUI.hidden = false; sitUI.hidden = true; $('beadstrip').hidden = true;
  }
  let ritual = 'bow', holdBow = false;
  function selectRitual(k) { ritual = k; ['gassho', 'bow', 'beads', 'moktak'].forEach(id => $('r-' + id).classList.toggle('on', id === k)); $('beadstrip').hidden = k !== 'beads'; if (k === 'beads') drawBeads(); showCount(); }
  function showCount() {
    const c = $('count'), lab = $('countLabel');
    if (ritual === 'bow') { c.textContent = (S.today.bow % 108 || (S.today.bow ? 108 : 0)) + ' / 108'; lab.textContent = T.bowsToday; }
    else if (ritual === 'beads') { c.textContent = (S.today.beads % 108 || (S.today.beads ? 108 : 0)) + ' / 108'; lab.textContent = T.beadsToday; }
    else if (ritual === 'moktak') { c.textContent = String(S.today.moktak); lab.textContent = T.moktakToday; }
    else { c.textContent = '·'; lab.textContent = T.gasshoNow; }
  }
  function practiced() { rollDay(); markVisit(); }
  function complete108() {
    S.lotus++; renderLotus(); renderStatic(); Audio.bell(2.2); haptic('success');
    toast(T.lotusBloom);
    if (!S.today.prompted) { S.today.prompted = true; setTimeout(() => toast(T.offerToast, [[T.items.lantern + ' · ' + price.lantern, () => buy('lantern', 0), 'gold'], [T.later, null]]), 2800); }
    save();
  }
  function doBow() {
    const u = player.userData; if (u.bowT > 0) return;
    practiced(); u.bowT = 2.2; u.small = false; S.today.bow++; S.totals.bow++; Audio.bell(1); haptic('soft'); showCount();
    if (S.today.bow % 108 === 0) complete108(); save();
  }
  function doBead() { practiced(); S.today.beads++; S.totals.beads++; Audio.bead(); haptic('light'); showCount(); if (S.today.beads % 108 === 0) complete108(); save(); }
  function doMoktak() { practiced(); S.today.moktak++; S.totals.moktak++; Audio.moktak(); haptic('light'); const u = player.userData; if (u.bowT <= 0) { u.bowT = 0.35; u.small = true; u.smallAmp = 0.08; } showCount(); save(); }
  function doGassho() { practiced(); const u = player.userData; if (u.bowT <= 0) { u.bowT = 1.2; u.small = true; u.smallAmp = 0.2; } Audio.bell(0.5); haptic('soft'); save(); }
  const rb = $('r-bow');
  rb.addEventListener('pointerdown', e => { e.preventDefault(); Audio.unlock(); if (ritual !== 'bow') selectRitual('bow'); holdBow = true; doBow(); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => rb.addEventListener(ev, () => { holdBow = false; }));
  $('r-gassho').addEventListener('click', () => { Audio.unlock(); selectRitual('gassho'); doGassho(); });
  $('r-beads').addEventListener('click', () => { Audio.unlock(); if (ritual !== 'beads') selectRitual('beads'); else doBead(); });
  $('r-moktak').addEventListener('click', () => { Audio.unlock(); selectRitual('moktak'); doMoktak(); });
  $('bStand').addEventListener('click', stand);

  // bead strip
  const beadC = $('beadc'); let beadOff = 0, beadDrag = null;
  function drawBeads() {
    const r = beadC.getBoundingClientRect(); if (!r.width) return; const dpr = Math.min(window.devicePixelRatio || 1, 2);
    beadC.width = r.width * dpr; beadC.height = r.height * dpr; const g = beadC.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, r.width, r.height);
    const sp = 34, cy = r.height / 2, skinned = !!S.owned.beadsSkin;
    g.strokeStyle = 'rgba(217,164,65,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, cy); g.lineTo(r.width, cy); g.stroke();
    for (let x = (beadOff % sp) - sp; x < r.width + sp; x += sp) {
      const d = Math.abs(x - r.width / 2), big = d < sp / 2;
      const rad = big ? 14 : 11; const gr = g.createRadialGradient(x - 4, cy - 4, 2, x, cy, rad);
      gr.addColorStop(0, skinned ? '#E2B07A' : '#9A6A4A'); gr.addColorStop(1, skinned ? '#8A5A32' : '#3E2418');
      g.fillStyle = gr; g.beginPath(); g.arc(x, cy, rad, 0, Math.PI * 2); g.fill();
    }
  }
  beadC.addEventListener('pointerdown', e => { Audio.unlock(); beadDrag = e.clientX; try { beadC.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } });
  beadC.addEventListener('pointermove', e => {
    if (beadDrag === null) return; const dx = e.clientX - beadDrag; beadDrag = e.clientX;
    const before = Math.floor(beadOff / 34); beadOff += dx; const after = Math.floor(beadOff / 34);
    if (after !== before) for (let i = 0; i < Math.abs(after - before); i++) doBead();
    drawBeads();
  });
  ['pointerup', 'pointercancel'].forEach(ev => beadC.addEventListener(ev, () => { beadDrag = null; }));

  // ---------------- hall buttons, pond ----------------
  $('bIncense').addEventListener('click', () => { Audio.unlock(); openOffer(); });
  function lightFree() {
    rollDay(); if (S.today.litAt) { toast(T.incenseUsed); return; }
    S.today.litAt = Date.now(); practiced(); tipMat.color.set('#FF7A3A'); Audio.bell(0.7); haptic('soft'); toast(T.incenseLit); save();
  }
  $('bPond').addEventListener('click', () => { Audio.unlock(); goPond(); });
  $('bEnter').addEventListener('click', goHall);
  $('bLantern').addEventListener('click', () => openOffer('lantern'));
  function fadeTo(fn) { const f = $('fade'); f.style.opacity = '1'; setTimeout(() => { fn(); snapCam = true; setTimeout(() => { f.style.opacity = '0'; }, 120); }, 320); }
  function goPond() { fadeTo(() => { if (mode === 'sit') stand(); mode = 'pond'; applyFog(); hallUI.hidden = true; sitUI.hidden = true; pondUI.hidden = false; renderStatic(); }); }
  function goHall() { fadeTo(() => { mode = 'hall'; applyFog(); pondUI.hidden = true; hallUI.hidden = false; renderTop(); }); }

  // ---------------- sheets ----------------
  const wrap = $('sheetWrap'), sheet = $('sheet');
  function openSheet(html, full) { sheet.className = 'sheet' + (full ? ' full' : ''); sheet.innerHTML = html; wrap.hidden = false; }
  function closeSheet() { wrap.hidden = true; sheet.innerHTML = ''; }
  $('scrim').addEventListener('click', closeSheet);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ICON = {
    incense: '<svg viewBox="0 0 44 44"><rect x="10" y="30" width="24" height="8" rx="3" fill="#8C6A3E"/><g stroke="#7A2E1F" stroke-width="2"><line x1="16" y1="30" x2="14" y2="8"/><line x1="22" y1="30" x2="22" y2="6"/><line x1="28" y1="30" x2="30" y2="8"/><line x1="19" y1="30" x2="18" y2="10"/><line x1="25" y1="30" x2="26" y2="10"/></g></svg>',
    lantern: '<svg viewBox="0 0 44 44"><path d="M6 30 Q22 38 38 30 L34 26 Q22 32 10 26 Z" fill="#E89AAE"/><path d="M22 10 Q28 18 22 28 Q16 18 22 10 Z" fill="#E89AAE"/><path d="M12 16 Q20 20 20 28 Q12 24 12 16 Z" fill="#F0B6C4"/><path d="M32 16 Q24 20 24 28 Q32 24 32 16 Z" fill="#F0B6C4"/><circle cx="22" cy="24" r="2.5" fill="#F6D29A"/></svg>',
    fruit: '<svg viewBox="0 0 44 44"><ellipse cx="22" cy="34" rx="16" ry="4" fill="#A86B3C"/><circle cx="16" cy="26" r="6" fill="#E46B4A"/><circle cx="27" cy="25" r="7" fill="#D9A441"/><circle cx="21" cy="18" r="5" fill="#8DAA5B"/><circle cx="30" cy="17" r="4" fill="#E89AAE"/></svg>'
  };
  let offerSel = 'incense', wishSel = 0;
  function openOffer(pre) {
    rollDay(); if (pre) offerSel = pre;
    const freeUsed = !!S.today.litAt;
    openSheet(`<div class="grab"></div><div class="shead"><h2>${T.censer}</h2><button class="pill" data-a="close">${T.done}</button></div>
      <div class="card"><div class="t"><b>${T.free3}</b><span>${freeUsed ? T.freeUsed : T.freeLeft}</span></div><button class="pill gold" data-a="free" ${freeUsed ? 'disabled style="opacity:.5"' : ''}>${T.light}</button></div>
      <div class="label">${T.itemsHead}</div>
      <div class="items">${['incense', 'lantern', 'fruit'].map(k => `<button class="item ${k === offerSel ? 'sel' : ''}" data-o="${k}">${ICON[k]}<span>${T.items[k]}</span><span class="p">${price[k]}</span></button>`).join('')}</div>
      <div class="label">${T.wishHead}</div>
      <div class="chips">${T.wishes.map((w, i) => `<button class="${i === wishSel ? 'sel' : ''}" data-w="${i}">${esc(w)}</button>`).join('')}</div>
      <button class="big" data-a="buy">${T.offer(T.items[offerSel], price[offerSel])}</button>`);
    sheet.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'close') closeSheet();
      else if (b.dataset.a === 'free') { closeSheet(); if (mode !== 'hall' && mode !== 'sit') { mode = 'hall'; applyFog(); pondUI.hidden = true; hallUI.hidden = false; } lightFree(); }
      else if (b.dataset.o) { offerSel = b.dataset.o; openOffer(); }
      else if (b.dataset.w) { wishSel = +b.dataset.w; openOffer(); }
      else if (b.dataset.a === 'buy') { buy(offerSel, wishSel); }
    };
  }
  const ROBES = [['#7A6A5A', null], ['#6B4A32', 'robes'], ['#C98A2E', 'robes'], ['#E8E2D6', 'robes']];
  function openJournal() {
    const rounds = Math.floor(S.totals.beads / 108);
    openSheet(`<div class="shead"><h2>${T.journal}</h2><button class="pill" data-a="close">${T.done}</button></div>
      <div class="streak"><span>${T.streakHead}</span><b>${T.streak(S.streak)}</b><span>${T.restLeft}</span></div>
      <div class="stats"><div><b>${S.totals.bow.toLocaleString()}</b><span>${T.totBow}</span></div><div><b>${rounds}</b><span>${T.totBeads}</span></div><div><b>${S.visits}</b><span>${T.totDays}</span></div></div>
      <div class="label">${T.yourWish}</div>
      <textarea id="wish" placeholder="${esc(T.wishPh)}">${esc(S.wish)}</textarea>
      <div class="label">${T.keep}</div>
      <div class="list">${['robes', 'beadsSkin', 'tet'].map(k => `<div class="card"><div class="t"><b>${T.items[k]}</b><span>${T.itemsSub[k]}</span></div>${S.owned[k] ? `<span style="font-weight:700;color:#3E5C66">${T.owned}</span>` : `<button class="pill gold" data-b="${k}">${price[k]}</button>`}</div>`).join('')}
        ${S.owned.robes ? `<div class="card"><div class="t"><b>${T.robeColor}</b></div><div class="swatches">${ROBES.map(([c]) => `<button aria-label="${c}" data-robe="${c}" class="${S.robe === c ? 'sel' : ''}" style="background:${c}"></button>`).join('')}</div></div>` : ''}
        ${S.owned.tet ? `<div class="card"><div class="t"><b>${T.tetOn}</b></div><button class="sw" role="switch" aria-checked="${S.tetOn}" data-a="tet"></button></div>` : ''}
      </div>
      <button class="link" data-a="restore">${T.restore}</button>`, true);
    const ta = $('wish'); ta.addEventListener('input', () => { S.wish = ta.value.slice(0, 1000); save(); });
    sheet.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'close') closeSheet();
      else if (b.dataset.b) buy(b.dataset.b);
      else if (b.dataset.robe) { S.robe = b.dataset.robe; applyRobe(); save(); openJournal(); }
      else if (b.dataset.a === 'tet') { S.tetOn = !S.tetOn; applyOfferings(); save(); openJournal(); }
      else if (b.dataset.a === 'restore') { if (native) post({ type: 'restore' }); else toast(T.restored); }
    };
  }
  function openSettings() {
    const s = S.settings, sw = (k, label) => `<div class="card"><div class="t"><b>${label}</b></div><button class="sw" role="switch" aria-checked="${!!s[k]}" data-s="${k}"></button></div>`;
    openSheet(`<div class="grab"></div><div class="shead"><h2>${T.settings}</h2><button class="pill" data-a="close">${T.done}</button></div>
      <div class="list">${sw('ambient', T.ambient)}${sw('effects', T.effects)}${sw('haptics', T.haptics)}</div>
      <div class="label">${T.notif}</div>
      <div class="list">${sw('nMorning', T.nMorning)}${sw('nEvening', T.nEvening)}${sw('nMoon', T.nMoon)}</div>
      <div class="list"><div class="card"><div class="t"><b>${T.yourName}</b></div><input type="text" id="nameIn" maxlength="20" value="${esc(S.name)}"></div></div>
      <button class="link" data-a="restore">${T.restore}</button>
      <button class="link" data-a="privacy">${T.privacy}</button>`);
    const ni = $('nameIn'); ni.addEventListener('change', () => { const v = ni.value.trim(); if (v) { S.name = v; save(); } });
    sheet.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'close') closeSheet();
      else if (b.dataset.s) { const k = b.dataset.s; s[k] = !s[k]; b.setAttribute('aria-checked', String(s[k])); if (k === 'ambient') Audio.ambient(s.ambient); if (k[0] === 'n') { if (s[k]) post({ type: 'notifyPermission' }); schedule(); } save(); }
      else if (b.dataset.a === 'restore') { if (native) post({ type: 'restore' }); else toast(T.restored); }
      else if (b.dataset.a === 'privacy') { const u = window.QP_PRIVACY || 'https://khacluatit.github.io/game-factory/quietpagoda/privacy.html'; if (native) post({ type: 'open', url: u }); else window.open(u, '_blank'); }
    };
  }
  $('bJournal').addEventListener('click', openJournal);
  $('bSettings').addEventListener('click', openSettings);

  // ---------------- onboarding ----------------
  function onboarding(step) {
    const ob = $('ob'); ob.hidden = false;
    const cards = [[T.ob1t, T.ob1b], [T.ob2t, T.ob2b], [T.ob3t, T.ob3b]];
    const art = '<svg width="260" height="200" viewBox="0 0 300 240" aria-hidden="true"><ellipse cx="150" cy="214" rx="140" ry="14" fill="#E3D4BD"/><g transform="translate(60 200)"><ellipse cx="0" cy="6" rx="30" ry="11" fill="#9B3B2E"/><path d="M-20 4 Q-22 -24 0 -30 Q22 -24 20 4 Z" fill="#7D8A96"/><circle cx="0" cy="-43" r="16" fill="#24170F"/></g><g transform="translate(150 200)"><ellipse cx="0" cy="6" rx="34" ry="12" fill="#9B3B2E"/><path d="M-23 4 Q-25 -27 0 -34 Q25 -27 23 4 Z" fill="#7A6A5A"/><circle cx="0" cy="-49" r="18" fill="#24170F"/></g><g transform="translate(240 200)"><ellipse cx="0" cy="6" rx="30" ry="11" fill="#9B3B2E"/><path d="M-20 4 Q-22 -24 0 -30 Q22 -24 20 4 Z" fill="#8C7D6B"/><circle cx="0" cy="-43" r="16" fill="#24170F"/></g><circle cx="150" cy="60" r="34" fill="#D9A441" opacity="0.45"/></svg>';
    ob.innerHTML = `${art}<h1>${cards[step][0]}</h1><p>${cards[step][1]}</p>
      ${step === 2 ? `<div class="card" style="width:100%;max-width:420px;margin-top:14px"><div class="t" style="text-align:left"><b>${T.ob3n}</b></div><button class="sw" role="switch" aria-checked="${S.settings.nMoon}" id="obN"></button></div>` : ''}
      <div class="dots">${[0, 1, 2].map(i => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>
      <button class="big" id="obNext">${step < 2 ? T.next : T.start}</button>`;
    if (step === 2) $('obN').onclick = e => { S.settings.nMoon = !S.settings.nMoon; e.currentTarget.setAttribute('aria-checked', String(S.settings.nMoon)); };
    $('obNext').onclick = () => {
      Audio.unlock();
      if (step < 2) return onboarding(step + 1);
      ob.hidden = true; S.onboarded = true; if (S.settings.nMoon) post({ type: 'notifyPermission' }); schedule(); save();
    };
  }

  // ---------------- store bridge ----------------
  function buy(key, wish) {
    if (native) { pendingWish[key] = wish || 0; post({ type: 'buy', id: P[key].id }); return; }
    setTimeout(() => window.QP.onPurchase(P[key].id, true), 500); pendingWish[key] = wish || 0;
  }
  const pendingWish = {};
  window.QP = {
    onProducts(list) { (list || []).forEach(p => { const k = keyById(p.id); if (k && p.price) price[k] = p.price; }); renderStatic(); },
    onPurchase(id, ok) {
      const k = keyById(id); if (!k) return;
      if (!ok) { toast(T.buyFail); return; }
      if (P[k].kind === 'offer') { S.offerings.push({ type: k, wish: pendingWish[k] || 0, name: S.name, until: Date.now() + H24 }); practiced(); }
      else S.owned[k] = true;
      applyOfferings(); save(); closeSheet(); haptic('success'); Audio.bell(1.2);
      toast(T.bought + ' · ' + T.items[k]);
      if (k === 'lantern') setTimeout(goPond, 900);
    },
    onOwned(ids) { (ids || []).forEach(id => { const k = keyById(id); if (k && P[k].kind === 'keep') S.owned[k] = true; }); applyOfferings(); save(); if (!wrap.hidden && sheet.classList.contains('full')) openJournal(); },
    onRestored(ids) { this.onOwned(ids); toast(T.restored); },
    onNotifyPermission(granted) { if (!granted) { S.settings.nMorning = S.settings.nEvening = S.settings.nMoon = false; save(); } else schedule(); },
    onForeground() { rollDay(); applyPhase(); applyOfferings(); renderTop(); updateBanner(); }
  };

  // ---------------- notifications ----------------
  function schedule() {
    const s = S.settings, items = [], now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const at = (h, m) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
      if (s.nMorning) items.push({ id: 'm' + i, date: at(4, 50), title: T.nMorningT, body: T.nMorningB });
      if (s.nEvening) items.push({ id: 'e' + i, date: at(17, 50), title: T.nEveningT, body: T.nEveningB });
      const l = window.Lunar.lunarOf(d, TZ);
      if (s.nMoon && (l.day === 1 || l.day === 15)) items.push({ id: 'l' + i, date: at(6, 30), title: l.day === 15 ? T.nFullT : T.nNewT, body: T.nMoonB });
    }
    const list = items.filter(x => x.date > now).sort((a, b) => a.date - b.date).slice(0, 60).map(x => ({ id: x.id, ts: Math.floor(x.date.getTime() / 1000), title: x.title, body: x.body }));
    post({ type: 'schedule', items: list });
  }

  // ---------------- audio ----------------
  const Audio = (() => {
    let ac = null, amb = null, unlocked = false;
    const on = () => S.settings.effects && ac;
    function ctx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } return ac; }
    function env(node, peak, dur, dest) { const g = ac.createGain(); g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(peak, ac.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur); node.connect(g); g.connect(dest || ac.destination); return g; }
    function noiseBuf(sec) { const b = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } return b; }
    const api = {
      unlock() { if (SHOT) return; ctx(); if (!ac) return; if (ac.state === 'suspended') ac.resume(); if (!unlocked) { unlocked = true; api.ambient(S.settings.ambient); } },
      bell(s) { if (!on()) return; s = s || 1; for (const [f, a] of [[392, 0.18], [784, 0.07], [1176, 0.04], [523, 0.05]]) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f; env(o, a * Math.min(s, 1.6), 3.5 * s); o.start(); o.stop(ac.currentTime + 4 * s); } },
      moktak() { if (!on()) return; const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(820, ac.currentTime); o.frequency.exponentialRampToValueAtTime(420, ac.currentTime + 0.08); env(o, 0.35, 0.18); o.start(); o.stop(ac.currentTime + 0.2); },
      bead() { if (!on()) return; const o = ac.createOscillator(); o.type = S.owned.beadsSkin ? 'triangle' : 'square'; o.frequency.value = S.owned.beadsSkin ? 1300 : 1900; env(o, S.owned.beadsSkin ? 0.12 : 0.05, 0.05); o.start(); o.stop(ac.currentTime + 0.06); },
      ambient(enable) {
        if (!ac) return;
        if (amb) { try { amb.src.stop(); } catch (e) { /* ignore */ } amb = null; }
        if (!enable) return;
        const src = ac.createBufferSource(); src.buffer = noiseBuf(4); src.loop = true;
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
        const g = ac.createGain(); g.gain.value = 0.05; src.connect(f); f.connect(g); g.connect(ac.destination); src.start(); amb = { src, g };
      },
      chirp() { if (!ac || !S.settings.ambient) return; const o = ac.createOscillator(); o.type = 'sine'; const t = ac.currentTime, base = 2600 + Math.random() * 1200; o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * 1.4, t + 0.08); env(o, 0.025, 0.12); o.start(); o.stop(t + 0.15); },
      cricket() { if (!ac || !S.settings.ambient) return; for (let i = 0; i < 3; i++) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 4400; const g = ac.createGain(); const t = ac.currentTime + i * 0.07; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.012, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.06); } }
    };
    return api;
  })();
  function haptic(style) { if (S.settings.haptics) post({ type: 'haptic', style }); }

  // ---------------- loop ----------------
  const clock = new THREE.Clock();
  function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.7 ? 62 : 50; camera.updateProjectionMatrix(); if (!$('beadstrip').hidden) drawBeads(); }
  window.addEventListener('resize', resize); resize();
  function tickAvatar(av, dt) {
    const u = av.userData; if (u.bowT <= 0) return;
    u.bowT -= dt; const total = u.small ? (u.smallAmp > 0.1 ? 1.2 : 0.35) : 2.2, p = 1 - Math.max(u.bowT, 0) / total;
    u.pivot.rotation.x = -Math.sin(p * Math.PI) * (u.small ? u.smallAmp : 1.05);
    if (u.bowT <= 0) { u.pivot.rotation.x = 0; u.small = false; }
  }
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  let slowT = 0, ritualBeat = 0, ambT = 0, snapCam = false;
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    for (const f of flames) { const k = (f.mult || 1) * (0.85 + 0.15 * Math.sin(t * 9 + f.seed) * Math.sin(t * 4.3 + f.seed * 2)); f.l.intensity = f.base * k; if (f.sp) f.sp.scale.set(0.32 + 0.04 * Math.sin(t * 11 + f.seed), 0.48 + 0.06 * Math.sin(t * 7 + f.seed), 1); }
    haloMat.opacity = 0.2 + 0.04 * Math.sin(t * 0.8);
    const lit = S.today.litAt && Date.now() - S.today.litAt < 10 * 60e3;
    tipMat.color.set(lit ? '#FF7A3A' : '#552A1A');
    const rate = (agarG.visible ? 1.8 : 1) * (lit ? 1.3 : 1);
    for (let i = 0; i < SMOKE; i++) { smokeAge[i] += dt * 0.5 * rate; if (smokeAge[i] > 4) smokeAge[i] = 0; const a = smokeAge[i]; smokePos[i * 3] = Math.sin(a * 1.7 + i) * 0.12 * a + Math.sin(t * 0.6) * 0.1 * a; smokePos[i * 3 + 1] = a * 0.85; smokePos[i * 3 + 2] = Math.cos(a * 1.3 + i * 0.7) * 0.08 * a; }
    smokeGeo.attributes.position.needsUpdate = true; smokeMat.opacity = agarG.visible ? 0.32 : (lit ? 0.26 : 0.18); smokeMat.size = agarG.visible ? 0.65 : 0.5;
    // pond life
    pondLanterns.forEach(pl => { pl.a += dt * 0.03; pl.g.position.x = Math.cos(pl.a) * pl.r; pl.g.position.z = 18 + Math.sin(pl.a) * pl.r; pl.g.position.y = 0.06 + Math.sin(t * 1.2 + pl.seed) * 0.02; });
    flies.forEach(f => { if (!f.s.visible) return; f.a += dt * f.sp; f.s.position.set(Math.cos(f.a) * f.r, f.h + Math.sin(t * 2 + f.r) * 0.2, 18 + Math.sin(f.a * 1.3) * f.r * 0.8); f.s.material.opacity = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.7 + f.r)); });

    // NPCs
    const target = npcTarget();
    for (const av of npcs.slice()) {
      const u = av.userData;
      if (u.state === 'sit') {
        u.nextBow -= dt; if (u.nextBow <= 0) { u.bowT = 2.2; u.small = false; u.nextBow = 4 + Math.random() * 10; }
        u.leaveAt -= dt * (npcs.length > target + 1 ? 4 : 1);
        if (!SHOT && u.leaveAt <= 0 && u.bowT <= 0) { u.cushion.userData.taken = null; u.state = 'leave'; u.pi = 0; u.path = [new THREE.Vector3(u.cushion.userData.x, 0, u.cushion.userData.z + 0.9), new THREE.Vector3(0, 0, u.cushion.userData.z + 0.9), new THREE.Vector3(0, 0, 9.6)]; }
      } else {
        const tg = u.path[u.pi]; tmp.copy(tg).sub(av.position); const d = tmp.length();
        if (d < 0.05) { u.pi++; if (u.pi >= u.path.length) { if (u.state === 'leave') { scene.remove(av); npcs.splice(npcs.indexOf(av), 1); } else { seatAt(av, u.target); u.state = 'sit'; u.nextBow = 1 + Math.random() * 4; u.leaveAt = 50 + Math.random() * 90; } } }
        else { tmp.normalize(); av.position.addScaledVector(tmp, Math.min(d, dt * 1.1)); av.rotation.y = Math.atan2(-tmp.x, -tmp.z); if (u.pi < u.path.length - 1) av.position.y = Math.abs(Math.sin(t * 8)) * 0.04; }
      }
      tickAvatar(av, dt);
    }
    if (!SHOT && npcs.length < target && Math.random() < dt * 0.2) spawnWalker();

    // player
    if (mode === 'walking' && walk) {
      const tg = walk.pts[walk.i + 1]; tmp.copy(tg).sub(player.position); const d = tmp.length();
      if (d < 0.05) { walk.i++; if (walk.i >= walk.pts.length - 1) { player.position.copy(walk.pts[walk.pts.length - 1]); walk = null; sitDone(); } }
      else { tmp.normalize(); player.position.addScaledVector(tmp, Math.min(d, dt * 1.8)); player.rotation.y = Math.atan2(-tmp.x, -tmp.z); }
    }
    if (mode === 'sit' && holdBow && player.userData.bowT <= 0) doBow();
    tickAvatar(player, dt);
    player.visible = mode !== 'pond';

    // ritual ambience
    if (inRitual() && S.settings.effects) { ritualBeat -= dt; if (ritualBeat <= 0) { Audio.moktak(); ritualBeat = 1.3; } }
    ambT -= dt; if (ambT <= 0) { ambT = 2 + Math.random() * 5; if (phase() === 'night') Audio.cricket(); else if (phase() !== 'dusk' || Math.random() < 0.4) Audio.chirp(); }

    // camera
    if (mode === 'sit' && playerCushion) { camPos.set(playerCushion.userData.x * 0.5 + 0.7, 2.4, playerCushion.userData.z + 3.8); camTarget.set(playerCushion.userData.x * 0.3, 1.6, -8); }
    else if (mode === 'pond') { camPos.set(0, 4.6, 10.6); camTarget.set(0, 0.4, 18.5); }
    else { camPos.set(0, 2.9, 8.6); camTarget.set(0, 1.7, -6); }
    const k = (SHOT || snapCam) ? 1 : 1 - Math.pow(0.03, dt); snapCam = false;
    camAt.lerp(camPos, k); camLook.lerp(camTarget, k);
    camera.position.copy(camAt).add(tmp2.set(Math.sin(t * 0.15) * 0.12, Math.sin(t * 0.2) * 0.04, 0));
    const look = camLook.clone().sub(camera.position), sph = new THREE.Spherical().setFromVector3(look);
    sph.theta += yaw; sph.phi = THREE.MathUtils.clamp(sph.phi - pitch, 0.5, 2.5);
    camera.lookAt(camera.position.clone().add(new THREE.Vector3().setFromSpherical(sph)));

    // tag
    const tagEl = $('tag');
    if (tagFor && t < tagUntil) { const p = new THREE.Vector3(); tagFor.getWorldPosition(p); p.y += mode === 'pond' ? 0.7 : 1.35; p.project(camera); tagEl.style.left = ((p.x + 1) / 2 * window.innerWidth) + 'px'; tagEl.style.top = ((1 - p.y) / 2 * window.innerHeight) + 'px'; tagEl.hidden = p.z > 1; }
    else tagEl.hidden = true;

    slowT -= dt; if (slowT <= 0) { slowT = 20; applyPhase(); updateBanner(); if (S.offerings.some(o => o.until < Date.now())) applyOfferings(); }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // ---------------- boot ----------------
  for (let i = 0; i < npcTarget(); i++) spawnSeated();
  renderTop(); renderStatic(); updateBanner(); applyRobe();
  if (SHOT === 'sit') { const c = cushions.find(x => !x.userData.taken && x.userData.x === 1.5) || freeCushions()[0]; c.userData.taken = player; playerCushion = c; player.position.set(c.userData.x, 0.12, c.userData.z); sitDone(); player.userData.bowT = 1.1; }
  else if (SHOT === 'pond') { mode = 'pond'; applyFog(); hallUI.hidden = true; pondUI.hidden = false; renderStatic(); }
  else if (SHOT === 'journal') openJournal();
  else if (!S.onboarded) onboarding(0);
  if (!SHOT) schedule();
  post({ type: 'ready' });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) window.QP.onForeground(); });
  window.__qpReady = true;
  requestAnimationFrame(frame);
})();

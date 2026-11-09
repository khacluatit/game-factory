// Quiet Pagoda — chính điện 3D + nghi thức + trạng thái. Chạy trong WKWebView (có cầu nối native) hoặc trình duyệt (giả lập mua).
(function () {
  'use strict';
  const T = window.T, LANG = window.LANG, NAMES = window.NAMES;
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const SHOT = params.get('shot') || window.QP_SHOT || null;
  const native = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.qp);
  const post = m => { if (native) { try { window.webkit.messageHandlers.qp.postMessage(m); } catch (e) { /* ignore */ } } };
  const TZ = (LANG === 'zh' || LANG === 'zhs') ? 8 : (LANG === 'ko' || LANG === 'ja') ? 9 : 7;
  const H24 = 24 * 3600 * 1000;
  const OUT = ['pond', 'gate', 'yard', 'bell'];

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
    totals: { bow: 0, beads: 0, moktak: 0, chant: 0 }, today: { day: null, bow: 0, beads: 0, moktak: 0, chant: 0, litAt: 0, prompted: false },
    owned: {}, robe: '#7A6A5A', tetOn: true, offerings: [],
    settings: { ambient: true, effects: true, haptics: true, nMorning: false, nEvening: false, nMoon: true, chantSpeed: 1 }, onboarded: false, tut: 0
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
    if (s.onboarded && s.tut === undefined) out.tut = 9; // người dùng 1.0 không cần xem hướng dẫn
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
  function rollDay() { const k = dayKey(new Date()); if (S.today.day !== k) S.today = { day: k, bow: 0, beads: 0, moktak: 0, chant: 0, litAt: 0, prompted: false }; }
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
    Object.assign(S, { streak: 7, visits: 23, lotus: 12, onboarded: true, wish: ({ vi: 'Mong mẹ mau khỏe, cả nhà bình an qua mùa đông.', zh: '願母親早日康復，闔家平安過冬。', zhs: '愿母亲早日康复，阖家平安过冬。', ko: '어머니가 빨리 회복하시고 가족 모두 평안히 겨울을 나길.', ja: '母が早く元気になり、家族みんなで穏やかに冬を越せますように。' })[LANG] || 'May my mother get well soon and the family stay safe this winter.' });
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
  renderer.toneMappingExposure = 1.55;
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

  const envTex = window.Figures.warmEnv(renderer);
  const gold = std('#C9963E', { metalness: 0.92, roughness: 0.28, envMap: envTex, envMapIntensity: 1.1 });
  const goldDark = std('#8E6424', { metalness: 0.85, roughness: 0.45, envMap: envTex, envMapIntensity: 0.8 });
  const porcelain = new THREE.MeshPhysicalMaterial({ color: '#F4EFE6', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15, envMap: envTex, envMapIntensity: 0.6 });
  const lacquer = std('#7A2418', { roughness: 0.45 });
  const darkWood = std('#3A1D14', { roughness: 0.85 });
  const wallMat = std('#4A2018', { roughness: 0.95, side: THREE.DoubleSide });

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
  const B = window.Figures.makeBuddha(gold, goldDark, glowTex); B.position.set(0, 1.0, -8.4); scene.add(B);
  const haloMat = B.userData.halo;
  const QA = window.Figures.makeQuanAm(porcelain, gold, glowTex); QA.position.set(-2.95, 0.5, -7.9); QA.rotation.y = 0.3; scene.add(QA);
  const DT = window.Figures.makeDiaTang(gold, goldDark, glowTex); DT.position.set(2.95, 0.5, -7.9); DT.rotation.y = -0.3; scene.add(DT);
  const sideLight = new THREE.PointLight('#FFD9A8', 1.6, 5, 2); sideLight.position.set(0, 3.0, -6.0); scene.add(sideLight);
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
  let bellSwing = 0; const bellBody = bellG.children[1];
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
  for (const [x, z] of [[-2, -5.4], [2, -5.4], [-2, -3.0], [2, -3.0]]) {
    hangLantern(x, z, 4.9);
    const l = new THREE.PointLight('#FF8A55', 1.6, 6, 2); l.position.set(x, 4.6, z); scene.add(l);
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
  blossomTree(-4.4, -6.2, '#F2A7B8'); blossomTree(4.4, -6.2, '#F2C94C');
  const coupletMat = std('#A8231A', { roughness: 0.6 });
  for (const x of [-3.5, 3.5]) { const c = mesh(new THREE.PlaneGeometry(0.4, 2.4), coupletMat, x + (x < 0 ? 0.3 : -0.3), 2.6, -2.4 + 0.29, false, tetG); c.rotation.y = 0; }
  tetG.visible = false;

  // ---------------- courtyard & lotus pond (outside the front door) ----------------
  const waterMat = new THREE.MeshStandardMaterial({ color: '#24394A', roughness: 0.15, metalness: 0.3 });
  const water = mesh(new THREE.CircleGeometry(5, 64), waterMat, 0, 0.03, 18); water.rotation.x = -Math.PI / 2; water.castShadow = false;
  const rim = mesh(new THREE.TorusGeometry(5.05, 0.18, 8, 64), std('#8A8172', { roughness: 0.9 }), 0, 0.06, 18); rim.rotation.x = Math.PI / 2;
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
  const moon = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), new THREE.MeshBasicMaterial({ color: '#F3E6C4', fog: false })); moon.position.set(-14, 14, 70); moon.lookAt(0, 4.6, 10.6); scene.add(moon);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#F3E6C4', blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.5 })); moonGlow.position.copy(moon.position); moonGlow.scale.set(12, 12, 1); scene.add(moonGlow);
  const moonRef = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#F3E6C4', blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.35 })); moonRef.position.set(-1.8, 0.08, 21.8); moonRef.scale.set(1.2, 0.35, 1); scene.add(moonRef);
  const flies = []; for (let i = 0; i < 24; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#F6E27A', blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.scale.set(0.25, 0.25, 1); scene.add(s); flies.push({ s, a: Math.random() * 6.28, r: 1.5 + Math.random() * 3.5, h: 0.4 + Math.random() * 1.6, sp: 0.1 + Math.random() * 0.25 }); }

  // ---------------- cảnh quan ngoài: cổng tam quan, sân, gác chuông (1.2) ----------------
  const TP = window.Temple.build(scene, { lacquer, darkWood, porcelain, gold, glowTex, flameTex, env: envTex }, { label: T.plaque });
  const bellSwing2 = { v: 0 };

  // ---------------- cushions & avatars ----------------
  const cushions = [], cushMat = std('#8A2B1F', { roughness: 0.9 });
  for (const z of [-2.6, -0.4, 1.8]) for (const x of [-4.5, -3.0, -1.5, 1.5, 3.0, 4.5]) { const c = mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.14, 24), cushMat, x, 0.07, z); c.userData = { x, z, taken: null }; cushions.push(c); window.Figures.blob(scene, x, z, 0.6, 0.5); }
  for (const x of [-3.5, 3.5]) for (const z of [-6.2, -2.4, 1.4, 5.2]) window.Figures.blob(scene, x, z, 0.8, 0.45);
  const robes = ['#6F7F8F', '#8C7D6B', '#7A5A3A', '#D9D3C6', '#9AA3AD', '#5E6E7E'];
  function makeAvatar(robe, kind) { const g = window.Figures.makeAvatar({ robe, kind }); scene.add(g); return g; }
  const npcs = [];
  const seatAt = (av, c) => { av.position.set(c.userData.x, 0.12, c.userData.z); av.rotation.y = 0; c.userData.taken = av; av.userData.cushion = c; av.userData.setPose('sit'); };
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
    av.position.set(0, 0, 9.4); av.userData.setPose('stand'); npcs.push(av);
  }

  // player
  const player = makeAvatar(S.robe, 'adult');
  const HALL_SPOT = new THREE.Vector3(0.9, 0, 5.4);
  player.position.copy(HALL_SPOT); player.userData.setPose('stand');
  function applyRobe() { player.userData.body.material.color.set(S.robe); }
  let mode = 'hall', walk = null, playerCushion = null;

  // ---------------- lighting & phases ----------------
  const ambient = new THREE.AmbientLight('#FFE2C0', 0.2); scene.add(ambient);
  const hemi = new THREE.HemisphereLight('#FFE2BC', '#4A2418', 0.55); scene.add(hemi);
  const fill = new THREE.PointLight('#FFD8A8', 2.2, 16, 1.6); fill.position.set(0, 5.2, -2.5); scene.add(fill);
  const fill2 = new THREE.PointLight('#FFC890', 1.4, 12, 1.6); fill2.position.set(0, 4.2, 3.5); scene.add(fill2);
  const sun = new THREE.DirectionalLight('#FFB070', 1.4); sun.position.set(-11, 8, 3); sun.target.position.set(0, 0, -1); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 }); sun.shadow.bias = -0.0005;
  const outLight = new THREE.DirectionalLight('#FFE0B0', 0.0); outLight.position.set(6, 10, 30); outLight.target.position.set(0, 0, 18); scene.add(outLight, outLight.target);
  const PH = {
    dawn: { win: '#F4C08E', sun: '#FFC9A0', si: 1.4, amb: 0.42, fog: '#3A2620', sky: '#C98E7A', fd: 0.026, shaft: 0.2, lamp: 0.9, out: 0.8, water: '#5A6A7A' },
    day: { win: '#F6E3B8', sun: '#FFF0D0', si: 1.9, amb: 0.5, fog: '#3A2820', sky: '#9DB4C4', fd: 0.022, shaft: 0.18, lamp: 0.6, out: 1.4, water: '#4E6E80' },
    dusk: { win: '#F2A860', sun: '#FFB070', si: 1.5, amb: 0.36, fog: '#2A1712', sky: '#D9875A', fd: 0.03, shaft: 0.24, lamp: 1.0, out: 0.9, water: '#3C4A5C' },
    night: { win: '#2B3656', sun: '#6A7FB0', si: 0.2, amb: 0.3, fog: '#160F10', sky: '#141A2C', fd: 0.034, shaft: 0.0, lamp: 1.5, out: 0.25, water: '#1C2A3A' }
  };
  let curPhase = null;
  function applyPhase(force) {
    const k = phase(); if (k === curPhase && !force) return; curPhase = k; const t = PH[k];
    windowMats.forEach(m => m.color.set(t.win)); shaftMats.forEach(m => m.opacity = t.shaft);
    sun.color.set(t.sun); sun.intensity = t.si; ambient.intensity = t.amb; fill.intensity = curPhase === 'night' ? 2.6 : 2.0; outLight.intensity = t.out; waterMat.color.set(t.water);
    flames.forEach(f => f.mult = t.lamp * (moonDay() && f !== flames[0] && f !== flames[1] ? 1.25 : 1));
    moon.visible = moonGlow.visible = moonRef.visible = k === 'night';
    const lampOn = k === 'night' || k === 'dusk'; TP.lanterns.forEach(l => { l.box.material.emissiveIntensity = lampOn ? 1.6 : 0; l.f.material.opacity = lampOn ? 0.75 : 0; }); flies.forEach(f => f.s.visible = k === 'night' || k === 'dusk');
    applyFog();
  }
  function applyFog() {
    const t = PH[curPhase];
    if (OUT.includes(mode) || (mode === 'tour' && camera.position.z > 10)) { scene.fog.color.set(t.sky); scene.fog.density = 0.012; scene.background.set(t.sky); }
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
    if (mode === 'gate' || mode === 'tour') { if (mode === 'tour' && tour) tour.t0 = Math.min(tour.t0, performance.now() - 7500 * 0.93); return; }
    if (mode === 'yard' || mode === 'bell') {
      const hb = ray.intersectObject(TP.bellTower, true)[0], hq = ray.intersectObject(TP.quanAm, true)[0], ho = ray.intersectObject(TP.bodhi, true)[0];
      const hits = [hb, hq, ho].filter(Boolean).sort((a, b) => a.distance - b.distance); const h = hits[0]; if (!h) return;
      if (h === hb) { if (mode === 'yard') goOut('bell'); else { Audio.unlock(); Audio.bigBell(); bellSwing2.v = 1; haptic('soft'); } }
      else if (h === hq) showTag(TP.quanAm, T.qaOut); else showTag(TP.bodhi, T.bodhiTag);
      return;
    }
    if (mode === 'pond') {
      const hit = ray.intersectObjects(pondLanternG.children, true)[0];
      if (hit) { let o = hit.object; while (o.parent && o.parent !== pondLanternG) o = o.parent; const pl = pondLanterns.find(p => p.g === o); if (pl) showTag(pl.g, pl.o.name + ' · ' + T.wishes[pl.o.wish] + ' · ' + T.hoursLeft(Math.max(1, Math.round((pl.o.until - Date.now()) / 3600e3)))); }
      return;
    }
    const inst = ray.intersectObjects([bellG, mok], true)[0];
    if (inst && mode !== 'pond') { Audio.unlock(); let o = inst.object; while (o.parent && o !== bellG && o !== mok) o = o.parent; if (o === bellG) { Audio.bigBell(); bellSwing = 1; haptic('soft'); } else { Audio.moktak(true); haptic('light'); } return; }
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
  const hallUI = $('hallUI'), sitUI = $('sitUI'), pondUI = $('pondUI'), gateUI = $('gateUI'), yardUI = $('yardUI'), bellUI = $('bellUI');
  function showUI(m) { hallUI.hidden = m !== 'hall'; sitUI.hidden = m !== 'sit'; pondUI.hidden = m !== 'pond'; gateUI.hidden = m !== 'gate'; yardUI.hidden = m !== 'yard'; bellUI.hidden = m !== 'bell'; }
  function renderTop() {
    const l = lunarToday(); $('lunar').firstChild.nodeValue = T.lunar(l.day, l.month);
    $('lunar2').textContent = l.day === 1 ? T.newMoon : T.toFull(daysToFull());
    $('streakChip').textContent = T.streak(S.streak);
  }
  function renderStatic() {
    $('bIncense').textContent = T.incense; $('bPond').textContent = T.pond; $('bEnter').textContent = T.enter; $('bStand').textContent = T.stand;
    $('npcNote').textContent = T.npcNote; $('hint').textContent = T.tapCushion;
    $('bLantern').textContent = T.items.lantern + ' · ' + price.lantern;
    $('bPond').textContent = T.toYard; $('bEnter').textContent = T.back; $('bGo').textContent = T.enterTemple; $('gateHint').textContent = T.gateHint;
    $('yHall').textContent = T.toHall; $('yBell').textContent = T.bellTower; $('yPond').textContent = T.pondBtn; $('yGate').textContent = T.toGate;
    $('bRoll').textContent = T.ringRoll; $('bBack').textContent = T.back; $('bellHint').textContent = T.bellHint; $('cVoice').setAttribute('aria-label', T.voice);
    ['gassho', 'bow', 'beads', 'moktak', 'chant'].forEach(k => { $('r-' + k).querySelector('span').textContent = T[k]; });
    $('cStop').textContent = T.cStop; [...$('cSpeed').children].forEach((b, i) => { b.textContent = T.speeds[i]; });
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
    if (mode !== 'hall' && mode !== 'sit') { b.hidden = true; return; }
    if (inRitual()) { b.textContent = T.ritualNow + (chant ? '' : ' · ' + T.ritualTap); b.hidden = false; return; }
    const next = [5, 18].find(x => x > h && x - h <= 0.5);
    if (next !== undefined && !SHOT) { b.textContent = T.ritualSoon(next === 5 ? '5:00' : '18:00'); b.hidden = false; } else b.hidden = true;
  }

  // ---------------- sitting & rituals ----------------
  function goSit(c) {
    c.userData.taken = player; playerCushion = c; mode = 'walking';
    walk = { pts: [player.position.clone(), new THREE.Vector3(0, 0, c.userData.z + 0.9), new THREE.Vector3(c.userData.x, 0, c.userData.z + 0.9), new THREE.Vector3(c.userData.x, 0.12, c.userData.z)], i: 0 };
    flashHint(T.walking); haptic('light');
  }
  function sitDone() { mode = 'sit'; player.rotation.y = 0; player.userData.setPose('sit'); hallUI.hidden = true; sitUI.hidden = false; selectRitual(ritual === 'chant' ? 'bow' : ritual); showCount(); if (S.tut === 1) { S.tut = 2; save(); showCoach(2); } if (pendingKhoaLe) { pendingKhoaLe = false; startKhoaLe(); } }
  function stand() {
    mode = 'hall'; if (playerCushion) playerCushion.userData.taken = null; playerCushion = null; holdBow = false;
    player.position.copy(HALL_SPOT); player.rotation.y = 0; player.userData.pivot.rotation.x = 0; player.userData.bowT = 0; player.userData.setPose('stand');
    hallUI.hidden = false; sitUI.hidden = true; $('beadstrip').hidden = true; if (chant) stopChant();
  }
  let ritual = 'bow', holdBow = false;
  function selectRitual(k) { ritual = k; ['gassho', 'bow', 'beads', 'moktak', 'chant'].forEach(id => $('r-' + id).classList.toggle('on', id === k)); $('beadstrip').hidden = k !== 'beads'; if (k === 'beads') drawBeads(); showCount(); }
  function showCount() {
    const c = $('count'), lab = $('countLabel');
    if (ritual === 'bow') { c.textContent = (S.today.bow % 108 || (S.today.bow ? 108 : 0)) + ' / 108'; lab.textContent = T.bowsToday; }
    else if (ritual === 'beads') { c.textContent = (S.today.beads % 108 || (S.today.beads ? 108 : 0)) + ' / 108'; lab.textContent = T.beadsToday; }
    else if (ritual === 'moktak') { c.textContent = String(S.today.moktak); lab.textContent = T.moktakToday; }
    else if (ritual === 'chant') { c.textContent = String(S.today.chant || 0); lab.textContent = T.chantToday + ' · ' + T.chantTap; }
    else { c.textContent = '·'; lab.textContent = T.gasshoNow; }
  }
  function practiced() { rollDay(); markVisit(); }
  function complete108() {
    S.lotus++; renderLotus(); renderStatic(); Audio.bell(2.2); setTimeout(() => Audio.bellRoll(), 2500); haptic('success');
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
  $('r-chant').addEventListener('click', () => { Audio.unlock(); selectRitual('chant'); openChantPick(); });
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
    S.today.litAt = Date.now(); practiced(); tipMat.color.set('#FF7A3A'); Audio.match(); setTimeout(() => Audio.bell(0.7), 900); haptic('soft'); toast(T.incenseLit); save();
  }
  $('bPond').addEventListener('click', () => { Audio.unlock(); goOut('yard'); });
  $('bEnter').addEventListener('click', () => goOut('yard'));
  $('yHall').addEventListener('click', goHall); $('yBell').addEventListener('click', () => goOut('bell')); $('yPond').addEventListener('click', goPond); $('yGate').addEventListener('click', () => goOut('gate'));
  $('bBack').addEventListener('click', () => goOut('yard'));
  $('bRoll').addEventListener('click', () => { Audio.unlock(); Audio.bellRoll(); bellSwing2.v = 1; haptic('soft'); });
  $('bGo').addEventListener('click', () => { Audio.unlock(); startTour(); });
  $('banner').addEventListener('click', () => { if (!inRitual() || chant) return; Audio.unlock(); if (mode === 'sit') startKhoaLe(); else if (mode === 'hall') { const c = freeCushions().sort((a, b) => Math.abs(a.userData.x) - Math.abs(b.userData.x))[0]; if (c) { pendingKhoaLe = true; goSit(c); } } });
  let pendingKhoaLe = false;
  function goOut(m) { fadeTo(() => { if (mode === 'sit') stand(); mode = m; applyFog(); showUI(m); renderStatic(); }); }
  // đi bộ từ cổng tam quan vào chính điện
  let tour = null;
  const TOUR = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.3, 55), new THREE.Vector3(0, 1.9, 39), new THREE.Vector3(0, 1.85, 31), new THREE.Vector3(-4.2, 1.85, 24.5), new THREE.Vector3(-6.4, 1.85, 18), new THREE.Vector3(-3.6, 1.85, 12.2), new THREE.Vector3(0, 2.2, 10.6), new THREE.Vector3(0, 2.9, 8.6)]);
  function startTour() { tour = { t: 0, step: 0, t0: performance.now() }; mode = 'tour'; showUI('none'); $('hint').textContent = T.tapSkip; }
  function endTour() { tour = null; S.gateDay = dayKey(new Date()); save(); mode = 'hall'; applyFog(); showUI('hall'); snapCam = true; renderStatic(); renderTop(); updateBanner(); }
  $('bLantern').addEventListener('click', () => openOffer('lantern'));
  function fadeTo(fn) { const f = $('fade'); f.style.opacity = '1'; setTimeout(() => { fn(); snapCam = true; setTimeout(() => { f.style.opacity = '0'; }, 120); }, 320); }
  function goPond() { goOut('pond'); }
  function goHall() { fadeTo(() => { mode = 'hall'; applyFog(); showUI('hall'); renderTop(); updateBanner(); }); }

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
      else if (b.dataset.a === 'free') { closeSheet(); if (mode !== 'hall' && mode !== 'sit') { mode = 'hall'; applyFog(); showUI('hall'); } lightFree(); }
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
      <div class="stats"><div><b>${S.totals.bow.toLocaleString()}</b><span>${T.totBow}</span></div><div><b>${rounds}</b><span>${T.totBeads}</span></div><div><b>${S.totals.chant || 0}</b><span>${T.totChant}</span></div></div><div class="stats" style="grid-template-columns:1fr"><div><b>${S.visits}</b><span>${T.totDays}</span></div></div>
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
      <button class="link" data-a="tut">${T.tutAgain}</button>
      <button class="link" data-a="restore">${T.restore}</button>
      <button class="link" data-a="privacy">${T.privacy}</button>`);
    const ni = $('nameIn'); ni.addEventListener('change', () => { const v = ni.value.trim(); if (v) { S.name = v; save(); } });
    sheet.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'close') closeSheet();
      else if (b.dataset.s) { const k = b.dataset.s; s[k] = !s[k]; b.setAttribute('aria-checked', String(s[k])); if (k === 'ambient') Audio.ambient(s.ambient); if (k[0] === 'n') { if (s[k]) post({ type: 'notifyPermission' }); schedule(); } save(); }
      else if (b.dataset.a === 'restore') { if (native) post({ type: 'restore' }); else toast(T.restored); }
      else if (b.dataset.a === 'tut') { closeSheet(); if (mode === 'sit') stand(); if (mode === 'pond') { mode = 'hall'; applyFog(); pondUI.hidden = true; hallUI.hidden = false; } S.tut = 1; save(); showCoach(1); }
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
      ob.hidden = true; S.onboarded = true; if (S.settings.nMoon) post({ type: 'notifyPermission' }); schedule(); S.tut = 1; save(); showCoach(1);
    };
  }


  // ---------------- tụng kinh ----------------
  const SUTRAS = window.SUTRAS || [];
  const CH_SPEED = [0.95, 0.7, 0.5];
  const TKEY = { vi: 'vi', en: 'en', zh: 'zh', zhs: 'zhs', ko: 'ko', ja: 'ja' }[LANG] || 'en';
  const READ = { vi: 'vi', ko: 'ko', zh: 'zh', zhs: 'zh' }[LANG] || null;
  let chant = null;
  function openChantPick() {
    openSheet(`<div class="grab"></div><div class="shead"><h2>${T.chantPick}</h2><button class="pill" data-a="close">${T.done}</button></div>
      <div class="sutras"><button data-s="khoa-le"><b>${esc(T.khoaLe)}</b><span>${esc(T.khoaLeSub)}</span></button>${SUTRAS.map(x => `<button data-s="${x.id}"><b>${esc(x.title[TKEY] || x.title.en)}</b><span>${esc(T.sutraSub[x.id] || '')} · ${T.lines(x.lines.length)}</span></button>`).join('')}</div>`);
    sheet.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'close') closeSheet(); else if (b.dataset.s) { closeSheet(); if (b.dataset.s === 'khoa-le') startKhoaLe(); else startChant(b.dataset.s); } };
  }
  let chantQueue = [];
  function startKhoaLe() {
    chantQueue = ['sam-hoi', 'hoi-huong'];
    Audio.bigBell(); setTimeout(() => Audio.bigBell(), 3200); setTimeout(() => Audio.bigBell(), 6400);
    setTimeout(() => { rollDay(); if (!S.today.litAt) { S.today.litAt = Date.now(); save(); } Audio.match(); }, 8000);
    startChant('heart', 9.5);
  }
  function startChant(id, delay) {
    const x = SUTRAS.find(q => q.id === id); if (!x) return;
    rollDay();
    const total = x.lines.reduce((n, l) => n + l.h.length, 0);
    chant = { x, line: 0, ch: -1, wait: delay || 2.6, done: 0, total, round: (S.today.chant || 0) + 1, speaking: false };
    sitUI.hidden = true; $('chantUI').hidden = false; $('coach').hidden = true; document.querySelector('.top').hidden = true; $('banner').hidden = true;
    $('cTitle').textContent = x.title[TKEY] || x.title.en; $('cRound').textContent = T.round(chant.round);
    [...$('cSpeed').children].forEach((b, i) => b.classList.toggle('sel', i === S.settings.chantSpeed));
    if (!delay) Audio.bell(1.4); haptic('soft'); renderChant();
    $('cVoice').setAttribute('aria-pressed', String(!!S.settings.voice));
  }
  function stopChant() { chant = null; chantQueue = []; Speech.stop(); $('chantUI').hidden = true; document.querySelector('.top').hidden = false; if (mode === 'sit') { sitUI.hidden = false; showCount(); } }
  function finishChant() {
    practiced(); S.today.chant = (S.today.chant || 0) + 1; S.totals.chant = (S.totals.chant || 0) + 1;
    Audio.khanh(); haptic('success'); save();
    if (chantQueue.length) { const next = chantQueue.shift(), q = chantQueue; chant = null; Speech.stop(); setTimeout(() => { if (mode === 'sit') { startChant(next, 1.6); chantQueue = q; } }, 1500); return; }
    setTimeout(() => Audio.bell(1.8), 1400); stopChant(); toast(T.chantDone);
  }
  const spans = (arr, upto, cls) => arr.map((c, i) => `<span${i <= upto ? ` class="${cls}"` : ''}>${esc(c)}</span>`).join(READ === 'vi' || READ === 'zh' ? ' ' : '');
  function readTokens(l) { if (READ === 'vi') return l.vi.split(' '); if (READ === 'zh') return l.zh.split(' '); if (READ === 'ko') return [...l.ko.replace(/\s/g, '')]; return null; }
  function lineHtml(l, cls, upto) {
    const han = [...(LANG === 'zhs' ? l.s : l.h)], rt = readTokens(l);
    const hh = han.map((c, k) => `<span${k <= upto ? ' class="on"' : ''}>${esc(c)}</span>`).join('');
    return `<div class="ln ${cls}"><div class="han">${hh}</div>${rt ? `<div class="rd">${spans(rt, upto, 'on')}</div>` : ''}</div>`;
  }
  function renderChant() {
    if (!chant) return; const L = chant.x.lines, i = chant.line;
    let h = '';
    if (i > 0) h += lineHtml(L[i - 1], 'dim', -1);
    h += lineHtml(L[i], 'cur', chant.ch);
    if (i + 1 < L.length) h += lineHtml(L[i + 1], 'dim', -1);
    if (!READ) { const sec = chant.x.sections.find(z => i >= z.from && i < z.to); if (sec) h += `<div class="mean">${esc(LANG === 'ja' ? sec.ja : sec.en)}</div>`; }
    $('cScroll').innerHTML = h;
    $('cProg').style.width = (100 * chant.done / chant.total).toFixed(1) + '%';
  }
  function tickChant(dt) {
    if (!chant) return; chant.wait -= dt; if (chant.wait > 0) return;
    const L = chant.x.lines; let l = L[chant.line];
    if (chant.ch + 1 >= l.h.length && chant.speaking) return;
    chant.ch++;
    if (chant.ch === 0) speakLine(chant.line);
    if (chant.ch >= l.h.length) {
      chant.line++; chant.ch = -1;
      if (chant.line >= L.length) { finishChant(); return; }
      if (chant.x.sections.some(z => z.from === chant.line)) { Audio.khanh(); chant.wait = 2.2; }
      else chant.wait = CH_SPEED[S.settings.chantSpeed] * 0.8;
      renderChant(); return;
    }
    chant.done++;
    Audio.moktak(chant.ch === 0);
    const u = player.userData; if (u.bowT <= 0) { u.bowT = 0.35; u.small = true; u.smallAmp = 0.05; }
    chant.wait = CH_SPEED[S.settings.chantSpeed]; renderChant();
  }
  $('cStop').addEventListener('click', () => { stopChant(); });
  $('cVoice').addEventListener('click', () => { S.settings.voice = !S.settings.voice; $('cVoice').setAttribute('aria-pressed', String(S.settings.voice)); if (!S.settings.voice) { Speech.stop(); if (chant) chant.speaking = false; } save(); });
  // Giọng đọc: dùng giọng có sẵn trên iPhone (AVSpeechSynthesizer qua cầu nối native; trình duyệt dùng speechSynthesis).
  // Khi có file thu âm thật (Web/audio/<kinh>/<dòng>.m4a) có thể thay ở đây.
  const VOICE_LANG = { vi: 'vi-VN', ko: 'ko-KR', zh: 'zh-TW', zhs: 'zh-CN', ja: 'ja-JP', en: 'en-US' }[LANG] || 'en-US';
  const Speech = (() => {
    let cb = null, timer = 0;
    const done = () => { clearTimeout(timer); const f = cb; cb = null; if (f) f(); };
    return {
      say(text, onEnd) {
        if (!text) { onEnd && onEnd(); return; }
        cb = onEnd || null; clearTimeout(timer); timer = setTimeout(done, 2500 + text.length * 260);
        if (native) { post({ type: 'speak', text, lang: VOICE_LANG, rate: 0.36 }); return; }
        try { const u = new SpeechSynthesisUtterance(text); u.lang = VOICE_LANG; u.rate = 0.72; u.pitch = 0.85; u.onend = done; u.onerror = done; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) { done(); }
      },
      stop() { cb = null; clearTimeout(timer); if (native) post({ type: 'stopSpeak' }); else { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } } },
      ended: done
    };
  })();
  function speakLine(i) {
    if (!S.settings.voice || !chant || SHOT) return; const l = chant.x.lines[i];
    if (READ) { chant.speaking = true; const text = READ === 'vi' ? l.vi : READ === 'ko' ? l.ko : (LANG === 'zhs' ? l.s : l.h); Speech.say(text, () => { if (chant) chant.speaking = false; }); }
    else { const sec = chant.x.sections.find(z => z.from === i); if (sec) Speech.say(LANG === 'ja' ? sec.ja : sec.en); }
  }
  $('cMok').addEventListener('click', () => { Audio.unlock(); Audio.moktak(true); haptic('light'); });
  $('cSpeed').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.settings.chantSpeed = +b.dataset.v; [...$('cSpeed').children].forEach((x, i) => x.classList.toggle('sel', i === S.settings.chantSpeed)); save(); });

  // ---------------- hướng dẫn chơi ----------------
  let coachStep = 0;
  function showCoach(n) {
    if (SHOT) return; coachStep = n; const c = $('coach');
    const txt = { 1: [T.tut1t, T.tut1b], 2: [T.tut2t, T.tut2b], 3: [T.tut3t, T.tut3b] }[n];
    $('coachT').textContent = txt[0]; $('coachB').textContent = txt[1]; $('coachN').textContent = n + ' / 3';
    $('coachSkip').textContent = T.skip;
    let ok = $('coachOk'); if (!ok) { ok = document.createElement('button'); ok.id = 'coachOk'; ok.className = 'pill gold'; $('coachSkip').parentNode.appendChild(ok); ok.onclick = coachNext; }
    ok.textContent = T.gotIt; ok.hidden = n === 1;
    const bub = $('coachBub');
    if (n === 1) { bub.style.top = 'calc(env(safe-area-inset-top, 0px) + 96px)'; bub.style.bottom = ''; }
    else { bub.style.top = ''; bub.style.bottom = n === 2 ? 'calc(env(safe-area-inset-bottom, 0px) + 230px)' : 'calc(env(safe-area-inset-bottom, 0px) + 150px)'; }
    c.hidden = false; placeCoach();
  }
  function coachNext() {
    if (coachStep === 2) { S.tut = 3; $('coach').hidden = true; save(); if (mode === 'hall') showCoach(3); }
    else { S.tut = 9; $('coach').hidden = true; save(); }
  }
  $('coachSkip').addEventListener('click', () => { S.tut = 9; $('coach').hidden = true; save(); });
  const cvec = new THREE.Vector3();
  function placeCoach() {
    const c = $('coach'); if (c.hidden) return; const ring = $('coachRing');
    if (coachStep === 1) {
      let free = null, bs = 1e9;
      for (const q of freeCushions()) { cvec.set(q.userData.x, 0.2, q.userData.z).project(camera); if (Math.abs(cvec.x) > 0.75 || cvec.y < -0.55 || cvec.z > 1) continue; const sc = Math.abs(cvec.x) * 2 - cvec.y * 0.5; if (sc < bs) { bs = sc; free = q; } }
      if (!free) { ring.hidden = true; return; }
      cvec.set(free.userData.x, 0.2, free.userData.z).project(camera);
      ring.hidden = false; ring.style.left = ((cvec.x + 1) / 2 * window.innerWidth) + 'px'; ring.style.top = ((1 - cvec.y) / 2 * window.innerHeight) + 'px';
    } else {
      const el = coachStep === 2 ? document.querySelector('.ritual') : $('bIncense'); const r = el.getBoundingClientRect();
      ring.hidden = !r.width; ring.style.left = (r.left + r.width / 2) + 'px'; ring.style.top = (r.top + r.height / 2) + 'px';
      if (coachStep === 2) { ring.style.width = ring.style.height = '0px'; ring.hidden = true; }
    }
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
    onSpoken() { Speech.ended(); },
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
    let ac = null, amb = null, unlocked = false, master = null, wet = null, roll = null;
    const on = () => S.settings.effects && ac;
    function ctx() {
      if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
      if (ac && !master) {
        // vang của chính điện: impulse nhiễu tắt dần ~3.2 s
        master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
        const len = Math.floor(ac.sampleRate * 3.2), ir = ac.createBuffer(2, len, ac.sampleRate);
        for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < ac.sampleRate * 0.012 ? i / (ac.sampleRate * 0.012) : 1); }
        const conv = ac.createConvolver(); conv.buffer = ir;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
        wet = ac.createGain(); wet.gain.value = 0.32; wet.connect(conv); conv.connect(lp); lp.connect(master);
      }
      return ac;
    }
    function out(node, wetAmt) { node.connect(master); if (wetAmt) { const g = ac.createGain(); g.gain.value = wetAmt; node.connect(g); g.connect(wet); } }
    function env(node, peak, dur, t0, att) { const t = t0 || ac.currentTime, g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + (att || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); node.connect(g); return g; }
    let nb = null;
    function noise() { if (!nb) { nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const s = ac.createBufferSource(); s.buffer = nb; return s; }
    function partial(f, amp, dur, t, bus, detune) {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f; if (detune) o.detune.value = detune;
      const g = env(o, amp, dur, t, 0.003); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
    }
    function strike(t, cutoff, amp, dur, bus) { const n = noise(), f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = cutoff; f.Q.value = 1.2; n.connect(f); env(f, amp, dur, t, 0.001).connect(bus); n.start(t); n.stop(t + dur + 0.02); }

    // Mõ gỗ: tiếng "cốc" rỗng — xung ngắn qua 2 cộng hưởng gỗ + thân mõ trầm
    function mok(t, accent) {
      const bus = ac.createGain(); bus.gain.value = accent ? 1.25 : 1; out(bus, 0.5);
      const v = 0.94 + Math.random() * 0.12;
      for (const [f, q, a, d] of [[440 * v, 18, 0.9, 0.13], [1180 * v, 14, 0.35, 0.07], [2350 * v, 8, 0.12, 0.03]]) {
        const n = noise(), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; n.connect(bp);
        env(bp, a, d, t, 0.001).connect(bus); n.start(t); n.stop(t + 0.01);
      }
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(260 * v, t); o.frequency.exponentialRampToValueAtTime(200 * v, t + 0.1);
      env(o, 0.28, 0.11, t, 0.001).connect(bus); o.start(t); o.stop(t + 0.14);
    }
    // Chuông gia trì (chuông bát): thỉnh khi lạy
    function bowl(t, s) {
      const bus = ac.createGain(); bus.gain.value = 0.5 * Math.min(s, 1.6); out(bus, 0.6);
      const f0 = 620;
      for (const [r, a, d, dt] of [[1, 0.5, 5.5, 0], [2.71, 0.22, 3.6, 4], [5.2, 0.08, 1.8, -6], [8.4, 0.03, 0.8, 0], [1, 0.25, 5.5, 3.5]]) partial(f0 * r, a, d * Math.max(0.6, s), t, bus, dt);
      strike(t, 3400, 0.18, 0.04, bus);
    }
    // Đại hồng chung: trầm, nhiều bội âm không điều hoà, tiếng đánh gỗ vào đồng, ngân dài
    function bigBell(t, amp) {
      const bus = ac.createGain(); bus.gain.value = amp || 0.7; out(bus, 0.75);
      const f0 = 98;
      for (const [r, a, d, dt] of [[0.5, 0.55, 14, 0], [1, 0.5, 11, 0], [1, 0.3, 11, 2.5], [1.19, 0.26, 8, 0], [1.5, 0.2, 7, -3], [2, 0.16, 6, 0], [2.74, 0.1, 4.5, 2], [3.3, 0.06, 3, 0], [5.4, 0.04, 1.8, 0]]) partial(f0 * r, a, d, t, bus, dt);
      strike(t, 260, 0.6, 0.12, bus); strike(t, 900, 0.18, 0.05, bus);
    }
    const api = {
      unlock() { if (SHOT) return; ctx(); if (!ac) return; if (ac.state === 'suspended') ac.resume(); if (!unlocked) { unlocked = true; api.ambient(S.settings.ambient); } },
      bell(s) { if (!on()) return; bowl(ac.currentTime + 0.01, s || 1); },
      bigBell() { if (!on()) return; bigBell(ac.currentTime + 0.01, 0.75); },
      moktak(accent) { if (!on()) return; mok(ac.currentTime + 0.005, accent); },
      // Hồi chuông: 3 tiếng khoan thai · dồn dần 7 tiếng · 3 tiếng ngân dứt
      bellRoll() {
        if (!on() || (roll && ac.currentTime < roll)) return;
        const gaps = [6, 6, 5, 4, 3.2, 2.5, 1.9, 1.5, 1.3, 1.2, 4.5, 6, 6];
        let t = ac.currentTime + 0.05; bigBell(t, 0.75);
        gaps.forEach((g, i) => { t += g; bigBell(t, i >= 9 ? 0.7 : 0.45 + i * 0.03); });
        roll = t + 8;
      },
      rolling() { return !!(ac && roll && ac.currentTime < roll); },
      // Khánh: chuông đá/đồng mỏng, tiếng trong, ngân ~3 s — mở và kết mỗi đoạn kinh
      khanh() { if (!on()) return; const t = ac.currentTime + 0.01, bus = ac.createGain(); bus.gain.value = 0.42; out(bus, 0.55);
        for (const [f, a, d, dt] of [[1318, 0.5, 3.2, 0], [1318, 0.22, 3.2, 5], [3420, 0.18, 1.8, 0], [5140, 0.08, 0.9, -4], [7300, 0.04, 0.4, 0]]) partial(f, a, d, t, bus, dt);
        strike(t, 5200, 0.12, 0.02, bus); },
      // Que diêm quẹt + hương bén lửa
      match() { if (!on()) return; const t = ac.currentTime + 0.01, bus = ac.createGain(); bus.gain.value = 0.9; out(bus, 0.2);
        const n = noise(), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(2400, t); bp.frequency.exponentialRampToValueAtTime(5200, t + 0.12); bp.Q.value = 1.5; n.connect(bp); env(bp, 0.5, 0.16, t, 0.004).connect(bus); n.start(t); n.stop(t + 0.2);
        const n2 = noise(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; n2.connect(lp); env(lp, 0.18, 0.7, t + 0.12, 0.05).connect(bus); n2.start(t + 0.1); n2.stop(t + 0.9);
        for (let i = 0; i < 6; i++) { const tt = t + 0.25 + Math.random() * 0.6, c = noise(), hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000; c.connect(hp); env(hp, 0.12, 0.012, tt, 0.001).connect(bus); c.start(tt); c.stop(tt + 0.03); } },
      // Bước chân trên nền gạch
      step() { if (!on()) return; const t = ac.currentTime + 0.005, bus = ac.createGain(); bus.gain.value = 0.35 + Math.random() * 0.1; out(bus, 0.35);
        const n = noise(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380 + Math.random() * 120; n.connect(lp); env(lp, 0.6, 0.09, t, 0.004).connect(bus); n.start(t); n.stop(t + 0.12);
        const n2 = noise(), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 2; n2.connect(bp); env(bp, 0.05, 0.05, t + 0.02, 0.002).connect(bus); n2.start(t + 0.02); n2.stop(t + 0.08); },
      // Ếch kêu ban đêm
      frog() { if (!ac || !S.settings.ambient) return; const t0 = ac.currentTime + 0.01, k = 2 + Math.floor(Math.random() * 3), f0 = 300 + Math.random() * 120;
        for (let i = 0; i < k; i++) { const t = t0 + i * 0.16, o = ac.createOscillator(), am = ac.createOscillator(), ag = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = f0; am.frequency.value = 38; ag.gain.value = 0.5; am.connect(ag.gain);
          const lp = ac.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = f0 * 2.2; lp.Q.value = 3; o.connect(lp); lp.connect(ag); env(ag, 0.03, 0.11, t, 0.01).connect(master); o.start(t); am.start(t); o.stop(t + 0.13); am.stop(t + 0.13); } },
      bead() { if (!on()) return; const t = ac.currentTime, bus = ac.createGain(); bus.gain.value = 1; out(bus, 0.25); const n = noise(), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = S.owned.beadsSkin ? 1500 : 2600; bp.Q.value = 10; n.connect(bp); env(bp, S.owned.beadsSkin ? 0.5 : 0.3, 0.05, t, 0.001).connect(bus); n.start(t); n.stop(t + 0.01); },
      ambient(enable) {
        if (!ac) return;
        if (amb) { try { amb.src.stop(); amb.lfo.stop(); } catch (e) { /* ignore */ } amb = null; }
        if (!enable) return;
        const b = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
        const src = ac.createBufferSource(); src.buffer = b; src.loop = true;
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
        const g = ac.createGain(); g.gain.value = 0.05; src.connect(f); f.connect(g); g.connect(master); src.start();
        const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 220; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); amb = { src, g, lfo };
      },
      chirp() { if (!ac || !S.settings.ambient) return; const o = ac.createOscillator(); o.type = 'sine'; const t = ac.currentTime, base = 2600 + Math.random() * 1200; o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * 1.4, t + 0.08); env(o, 0.025, 0.12, t, 0.01).connect(master); o.start(); o.stop(t + 0.15); },
      cricket() { if (!ac || !S.settings.ambient) return; for (let i = 0; i < 3; i++) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 4400; const t = ac.currentTime + i * 0.07; env(o, 0.012, 0.05, t, 0.01).connect(master); o.start(t); o.stop(t + 0.06); } }
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
  let stepT = 0, slowT = 0, ritualBeat = 0, ritualN = 0, ritualRolled = false, ambT = 0, snapCam = false;
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
        if (!SHOT && u.leaveAt <= 0 && u.bowT <= 0) { u.cushion.userData.taken = null; u.state = 'leave'; u.pi = 0; u.setPose('stand'); u.path = [new THREE.Vector3(u.cushion.userData.x, 0, u.cushion.userData.z + 0.9), new THREE.Vector3(0, 0, u.cushion.userData.z + 0.9), new THREE.Vector3(0, 0, 9.6)]; }
      } else {
        const tg = u.path[u.pi]; tmp.copy(tg).sub(av.position); const d = tmp.length();
        if (d < 0.05) { u.pi++; if (u.pi >= u.path.length) { if (u.state === 'leave') { scene.remove(av); npcs.splice(npcs.indexOf(av), 1); } else { seatAt(av, u.target); u.state = 'sit'; u.nextBow = 1 + Math.random() * 4; u.leaveAt = 50 + Math.random() * 90; } } }
        else { tmp.normalize(); av.position.addScaledVector(tmp, Math.min(d, dt * 1.1)); av.rotation.y = Math.atan2(-tmp.x, -tmp.z); if (u.pi < u.path.length - 1) { av.position.y = Math.abs(Math.sin(t * 8)) * 0.03; u.walkCycle(t); } }
      }
      tickAvatar(av, dt);
    }
    if (!SHOT && npcs.length < target && Math.random() < dt * 0.2) spawnWalker();

    // player
    if (mode === 'walking' && walk) {
      const tg = walk.pts[walk.i + 1]; tmp.copy(tg).sub(player.position); const d = tmp.length();
      if (d < 0.05) { walk.i++; if (walk.i >= walk.pts.length - 1) { player.position.copy(walk.pts[walk.pts.length - 1]); walk = null; sitDone(); } }
      else { tmp.normalize(); player.position.addScaledVector(tmp, Math.min(d, dt * 1.8)); player.rotation.y = Math.atan2(-tmp.x, -tmp.z); player.userData.walkCycle(t); }
    }
    if (mode === 'sit' && holdBow && player.userData.bowT <= 0) doBow();
    tickChant(dt);
    if (mode === 'walking' && walk && S.settings.effects) { stepT -= dt; if (stepT <= 0) { stepT = 0.42; Audio.step(); } }
    if (!$('coach').hidden) placeCoach(); else if (S.tut === 3 && mode === 'hall' && !SHOT && wrap.hidden) showCoach(3);
    tickAvatar(player, dt);
    player.visible = mode === 'hall' || mode === 'sit' || mode === 'walking';

    if (bellSwing2.v > 0) { bellSwing2.v = Math.max(0, bellSwing2.v - dt * 0.25); TP.bell.rotation.z = Math.sin(t * 2.4) * 0.05 * bellSwing2.v; TP.bellLog.rotation.z = Math.sin(t * 2.4 + 1) * 0.12 * bellSwing2.v; }
    TP.bodhi.userData.crown.rotation.y = Math.sin(t * 0.3) * 0.02;
    if (bellSwing > 0) { bellSwing = Math.max(0, bellSwing - dt * 0.35); bellBody.rotation.z = Math.sin(t * 5) * 0.06 * bellSwing; }
    // ritual ambience
    if (inRitual() && S.settings.effects && !chant) { if (!ritualRolled) { ritualRolled = true; Audio.bellRoll(); } if (!Audio.rolling()) { ritualBeat -= dt; if (ritualBeat <= 0) { Audio.moktak(ritualN % 4 === 0); ritualN++; ritualBeat = 1.05; } } } else ritualRolled = false;
    ambT -= dt; if (ambT <= 0) { ambT = 2 + Math.random() * 5; if (phase() === 'night') { if (Math.random() < 0.3) Audio.frog(); else Audio.cricket(); } else if (phase() !== 'dusk' || Math.random() < 0.4) Audio.chirp(); }

    // camera
    if (mode === 'sit' && playerCushion) { camPos.set(playerCushion.userData.x * 0.5 + 0.7, 2.4, playerCushion.userData.z + 3.8); camTarget.set(playerCushion.userData.x * 0.3, 1.6, -8); }
    else if (mode === 'pond') { camPos.set(0, 4.6, 10.6); camTarget.set(0, 0.4, 18.5); }
    else if (mode === 'gate') { camPos.set(0, 2.3, 55); camTarget.set(0, 3.6, 34); }
    else if (mode === 'yard') { camPos.set(0, 4.4, 35.5); camTarget.set(0, 3.2, 12); }
    else if (mode === 'bell') { camPos.set(-1.2, 3.4, 36.8); camTarget.set(-9.2, 3.6, 27.5); }
    else if (mode === 'tour' && tour) {
      tour.t = Math.min(1, Math.max(tour.t, (performance.now() - tour.t0) / 7500)); const e = tour.t < 0.5 ? 2 * tour.t * tour.t : 1 - Math.pow(-2 * tour.t + 2, 2) / 2;
      TOUR.getPointAt(e, camPos); TOUR.getPointAt(Math.min(1, e + 0.06), camTarget); camTarget.y = 2.4; if (e > 0.94) camTarget.set(0, 1.7, -6);
      tour.step -= dt; if (tour.step <= 0 && tour.t < 0.97) { tour.step = 0.5; Audio.step(); }
      if (tour.t >= 1) endTour(); else if (camPos.z < 10.2 && !tour.inside) { tour.inside = true; applyFog(); }
    }
    else { camPos.set(0, 2.9, 8.6); camTarget.set(0, 1.7, -6); }
    const k = (SHOT || snapCam || mode === 'tour') ? 1 : 1 - Math.pow(0.03, dt); snapCam = false;
    camAt.lerp(camPos, k); camLook.lerp(camTarget, k);
    camera.position.copy(camAt).add(tmp2.set(Math.sin(t * 0.15) * 0.12, Math.sin(t * 0.2) * 0.04, 0));
    const look = camLook.clone().sub(camera.position), sph = new THREE.Spherical().setFromVector3(look);
    sph.theta += yaw; sph.phi = THREE.MathUtils.clamp(sph.phi - pitch, 0.5, 2.5);
    camera.lookAt(camera.position.clone().add(new THREE.Vector3().setFromSpherical(sph)));

    // tag
    const tagEl = $('tag');
    if (tagFor && t < tagUntil) { const p = new THREE.Vector3(); tagFor.getWorldPosition(p); p.y += mode === 'pond' ? 0.7 : (tagFor === TP.quanAm ? 4.4 : tagFor === TP.bodhi ? 4 : 1.35); p.project(camera); tagEl.style.left = ((p.x + 1) / 2 * window.innerWidth) + 'px'; tagEl.style.top = ((1 - p.y) / 2 * window.innerHeight) + 'px'; tagEl.hidden = p.z > 1; }
    else tagEl.hidden = true;

    slowT -= dt; if (slowT <= 0) { slowT = 20; applyPhase(); updateBanner(); if (S.offerings.some(o => o.until < Date.now())) applyOfferings(); }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // ---------------- boot ----------------
  for (let i = 0; i < npcTarget(); i++) spawnSeated();
  renderTop(); renderStatic(); updateBanner(); applyRobe();
  if (SHOT === 'sit') { const c = cushions.find(x => !x.userData.taken && x.userData.x === 1.5) || freeCushions()[0]; c.userData.taken = player; playerCushion = c; player.position.set(c.userData.x, 0.12, c.userData.z); sitDone(); player.userData.bowT = 1.1; }
  else if (SHOT === 'pond') { mode = 'pond'; applyFog(); showUI('pond'); renderStatic(); }
  else if (['gate', 'yard', 'bell'].includes(SHOT)) { mode = SHOT; applyFog(); showUI(SHOT); renderStatic(); }
  else if (SHOT === 'journal') openJournal();
  else if (SHOT === 'chant') { const c = cushions.find(x => !x.userData.taken && x.userData.x === 1.5) || freeCushions()[0]; c.userData.taken = player; playerCushion = c; player.position.set(c.userData.x, 0.12, c.userData.z); sitDone(); startChant('heart'); chant.line = 4; chant.ch = 3; chant.done = 24; chant.wait = 999; renderChant(); }
  else if (!S.onboarded) onboarding(0);
  else if (!SHOT && S.gateDay !== dayKey(new Date()) && !(S.tut > 0 && S.tut < 3)) { mode = 'gate'; applyFog(); showUI('gate'); snapCam = true; }
  else if (S.tut > 0 && S.tut < 3) { S.tut = 1; showCoach(1); }
  if (!SHOT) schedule();
  post({ type: 'ready' });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) window.QP.onForeground(); });
  window.__qpReady = true;
  requestAnimationFrame(frame);
})();

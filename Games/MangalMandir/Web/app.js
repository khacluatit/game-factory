// Mangal Mandir — đền Hindu 3D: darshan, aarti, arpan, abhishek, japa, path, parikrama, tulsi, surya arghya, panchang.
// Chạy trong WKWebView (cầu nối native "qp") hoặc trình duyệt (giả lập mua).
(function () {
  'use strict';
  const T = window.T, LANG = window.LANG, HI = LANG === 'hi';
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const SHOT = params.get('shot') || window.QP_SHOT || null;
  const native = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.qp);
  const post = m => { if (native) { try { window.webkit.messageHandlers.qp.postMessage(m); } catch (e) { /* ignore */ } } };
  const H24 = 24 * 3600 * 1000;
  const OUT = ['gate', 'yard', 'arghya'];
  const ORDER = ['krishna', 'shiva', 'ganesha', 'lakshmi', 'hanuman'];
  const DAY_SHRINE = ['ganesha', 'shiva', 'hanuman', 'ganesha', 'krishna', 'lakshmi', 'hanuman'];
  const DAY_DEITY = ['surya', 'shiva', 'hanuman', 'ganesha', 'krishna', 'lakshmi', 'hanuman'];
  const OFFER = {
    ganesha: ['modak', 'durva', 'hibiscus'], shiva: ['bael', 'whiteflower', 'fruit'], hanuman: ['sindoor', 'jasmineoil', 'ladoo', 'redflower'],
    krishna: ['tulsi', 'makhan', 'yellowflower', 'peacock'], lakshmi: ['lotus', 'kheer', 'ghee']
  };
  const PRASAD = { ganesha: 'modak', shiva: 'fruit', hanuman: 'ladoo', krishna: 'makhan', lakshmi: 'kheer' };
  const AARTI_ROUNDS = 7, PARI_ROUNDS = 3;

  // ---------------- products ----------------
  const P = {
    deepmala: { id: 'com.beemob.mangalmandir.deepmala', price: '₹99' }, flowers: { id: 'com.beemob.mangalmandir.flowers', price: '₹49' },
    sphatik: { id: 'com.beemob.mangalmandir.sphatik', price: '₹49' }, chandan: { id: 'com.beemob.mangalmandir.chandan', price: '₹49' }, goldmala: { id: 'com.beemob.mangalmandir.goldmala', price: '₹49' }
  };
  const price = {}; Object.keys(P).forEach(k => price[k] = HI ? P[k].price : (k === 'deepmala' ? '$2.99' : '$0.99'));
  const keyById = id => Object.keys(P).find(k => P[k].id === id);

  // ---------------- state ----------------
  const DEF = {
    v: 1, streak: 0, lastDay: null, restWeek: null, visits: 0, gateDay: null, cur: null,
    totals: { aarti: 0, japa: 0, malas: 0, path: 0, arpan: 0, pari: 0, abhi: 0, arghya: 0, tulsi: 0 },
    today: { day: null, aarti: {}, offered: {}, japa: 0, tulsi: false, arghya: false, abhi: false, pari: false },
    japaN: 0, japaRound: 1, mala: 'sandal', owned: {}, show: { deepmala: true, flowers: true },
    settings: { ambient: true, effects: true, haptics: true, nMorning: false, nEvening: false, nEkadashi: false, nFest: true, pathSpeed: 1, city: null, lang: null },
    onboarded: false, tut: 0
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  function load() {
    let s = null;
    try { if (window.QP_STATE) s = typeof window.QP_STATE === 'string' ? JSON.parse(window.QP_STATE) : window.QP_STATE; } catch (e) { s = null; }
    if (!s) { try { s = JSON.parse(localStorage.getItem('mm') || 'null'); } catch (e) { s = null; } }
    s = s || {};
    const out = Object.assign(clone(DEF), s);
    for (const k of ['settings', 'totals', 'today', 'show']) out[k] = Object.assign(clone(DEF[k]), s[k] || {});
    out.owned = Object.assign({}, s.owned || {});
    return out;
  }
  let S = load();
  if (!S.settings.city) S.settings.city = window.Panchang.defaultCity();
  let saveTimer = 0;
  function save() {
    if (SHOT) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { const j = JSON.stringify(S); post({ type: 'save', state: j }); try { localStorage.setItem('mm', j); } catch (e) { /* ignore */ } }, 300);
  }
  const pad = n => (n < 10 ? '0' : '') + n;
  const dayKey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const weekKey = d => { const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return dayKey(x); };
  function rollDay() { const k = dayKey(new Date()); if (S.today.day !== k) { S.today = clone(DEF.today); S.today.day = k; renderOfferings(); } }
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
  const practiced = () => { rollDay(); markVisit(); };
  if (SHOT) Object.assign(S, { streak: 7, visits: 23, onboarded: true, tut: 9, japaN: 54, japaRound: 2, owned: { deepmala: true, flowers: true } });

  // ---------------- time ----------------
  const hourNow = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  const panToday = () => window.Panchang.day(new Date(), S.settings.city);
  function phaseOf() {
    const p = panToday(), now = Date.now(), r = p.rise, s = p.set;
    if (now > r - 50 * 60e3 && now < r + 40 * 60e3) return 'dawn';
    if (now >= r + 40 * 60e3 && now < s - 50 * 60e3) return 'day';
    if (now >= s - 50 * 60e3 && now < s + 40 * 60e3) return 'dusk';
    return 'night';
  }
  const forcedPhase = params.get('phase') || (SHOT === 'yard' || SHOT === 'gate' ? 'day' : SHOT === 'aarti' ? 'dusk' : SHOT ? 'dusk' : null);
  let phaseCache = null, phaseAt = 0;
  const phase = () => { if (forcedPhase) return forcedPhase; if (!phaseCache || Date.now() - phaseAt > 30e3) { phaseCache = phaseOf(); phaseAt = Date.now(); } return phaseCache; };
  const wday = () => new Date().getDay();
  const todayShrine = () => DAY_SHRINE[wday()];

  // ---------------- renderer & scene ----------------
  const canvas = $('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !!SHOT });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1C0E09');
  scene.fog = new THREE.FogExp2('#2A1810', 0.03);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.08, 400);
  const std = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0 }, o || {}));
  function mesh(geo, mat, x, y, z, shadow, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; } (parent || scene).add(m); return m; }
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  const radialTex = (inner, outer) => canvasTex(64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const flameTex = canvasTex(64, 96, (g, w, h) => { const gr = g.createRadialGradient(32, 62, 2, 32, 56, 34); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.35, 'rgba(255,190,90,0.85)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(58, 54, 32, 92); g.quadraticCurveTo(6, 54, 32, 4); g.fill(); });
  const glowTex = radialTex('rgba(255,215,150,0.95)', 'rgba(255,190,110,0)');
  const smokeTex = radialTex('rgba(255,255,255,0.5)', 'rgba(255,255,255,0)');
  const dropTex = radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)');

  const envTex = window.Figures.warmEnv(renderer);
  const gold = std('#D2A04A', { metalness: 0.9, roughness: 0.28, envMap: envTex, envMapIntensity: 1.1 });
  const brass = std('#C9963E', { metalness: 0.85, roughness: 0.32, envMap: envTex, envMapIntensity: 1.0 });
  const copper = std('#B8693A', { metalness: 0.8, roughness: 0.35, envMap: envTex });
  const waterMat = new THREE.MeshStandardMaterial({ color: '#3E6A7A', roughness: 0.12, metalness: 0.35 });
  const MT = window.Mandir.build(scene, { gold, brass, env: envTex, water: waterMat, garland: window.Deities.garland, blob: window.Figures.blob }, { label: 'MANGAL MANDIR' });

  // ---------------- tượng thần ----------------
  const DM = { gold, env: envTex };
  const DEITY = {};
  { const sh = MT.shrines;
    const add = (k, g, s) => { g.position.copy(sh[k].pos); g.rotation.y = sh[k].rot; g.scale.setScalar(s); scene.add(g); DEITY[k] = g; };
    add('ganesha', window.Deities.makeGanesha(DM), 1.25);
    add('shiva', window.Deities.makeLinga(DM), 1.15);
    add('krishna', window.Deities.makeKrishna(DM), 1.0);
    add('lakshmi', window.Deities.makeLakshmi(DM), 1.0);
    add('hanuman', window.Deities.makeHanuman(DM), 1.0);
    const n = window.Deities.makeNandi(DM), r = sh.shiva.rot; n.position.set(sh.shiva.pos.x + Math.sin(r) * 2.3, 0, sh.shiva.pos.z + Math.cos(r) * 2.3); n.rotation.y = r + Math.PI; n.scale.setScalar(1.15); scene.add(n);
    window.Figures.blob(scene, n.position.x, n.position.z, 0.7, 0.4);
  }
  const lingaTop = new THREE.Vector3(); DEITY.shiva.updateMatrixWorld(true); lingaTop.set(0, 0.78, 0).applyMatrix4(DEITY.shiva.matrixWorld);

  // ---------------- đèn: diya + đèn đứng + đèn sân ----------------
  const flames = [];
  function flame(pos, s, light) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
    sp.position.copy(pos); sp.scale.set(s * 0.6, s, 1); scene.add(sp);
    const f = { sp, s, seed: Math.random() * 10, l: null, base: 0 };
    if (light) { f.l = new THREE.PointLight('#FFB060', light, 6, 2); f.l.position.copy(pos).add(new THREE.Vector3(0, 0.2, 0)); scene.add(f.l); f.base = light; }
    flames.push(f); return f;
  }
  MT.lamps.forEach(l => flame(l.pos, l.s * 0.7, 0));
  const shrineLights = {};
  for (const k of ORDER) { const s = MT.shrines[k]; const l = new THREE.PointLight('#FFC27A', 4.2, 6.5, 1.8); l.position.copy(s.plate).lerp(s.cam, 0.25); l.position.y = 2.1; scene.add(l); shrineLights[k] = { l, base: 4.2, seed: Math.random() * 9 }; }
  const deepaFlames = MT.deepa.map(p => flame(p, 0.16, 0));
  const deepaLight = new THREE.PointLight('#FFB060', 0, 12, 1.6); deepaLight.position.set(-4.4, 3.0, 16.6); scene.add(deepaLight);

  // Deepmala (IAP): hàng trăm diya dọc mái, bậc, tường sân
  const DMP = [];
  { const ring = (cx, cy, cz, w, d, step) => { for (let x = -w / 2; x <= w / 2; x += step) { DMP.push(cx + x, cy, cz - d / 2, cx + x, cy, cz + d / 2); } for (let z = -d / 2 + step; z < d / 2; z += step) { DMP.push(cx - w / 2, cy, cz + z, cx + w / 2, cy, cz + z); } };
    for (let i = 0; i < 6; i++) ring(0, 7.15 + i * 0.62, 2.6 - i * 0.05, 13.2 - i * 1.7 + 0.1, 12.0 - i * 1.5 + 0.1, 0.55);
    for (let i = 0; i < 4; i++) for (let x = -2.6 - i * 0.2; x <= 2.6 + i * 0.2; x += 0.45) DMP.push(x, -0.13 - 0.15 * i, 12.62 + i * 0.42);
    for (const s of [-1, 1]) { for (let z = 12.8; z <= 38.2; z += 0.8) DMP.push(s * 14.2, 1.68, z); for (let x = 2.8; x <= 14; x += 0.8) DMP.push(s * x, 1.68, 38.6); }
    for (let i = 0; i < 4; i++) { const w = 5.6 - i * 0.8; for (let t = -w / 2; t <= w / 2; t += 0.45) DMP.push(7.2 + t, -0.38 - i * 0.22, 21.5 - w / 2 + 0.2, 7.2 + t, -0.38 - i * 0.22, 21.5 + w / 2 - 0.2); }
    for (const x of [-1.75, 1.75]) for (let y = 0.2; y < 4.5; y += 0.5) DMP.push(x + 0.32, y - 0.6, 38.6, x - 0.32, y - 0.6, 38.6);
  }
  const dmGeo = new THREE.BufferGeometry(); dmGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DMP), 3));
  const dmMat = new THREE.PointsMaterial({ map: glowTex, color: '#FFB860', size: 0.42, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const deepmala = new THREE.Points(dmGeo, dmMat); scene.add(deepmala); deepmala.visible = false;
  // Hoa cúc (IAP): vòng hoa giữa các cột, quanh cổng
  const flowerG = new THREE.Group(); scene.add(flowerG); flowerG.visible = false;
  { const V = (x, y, z) => new THREE.Vector3(x, y, z);
    for (const x of [-3.4, 3.4]) { const zs = [-5.4, -1.2, 3.0, 7.0]; for (let i = 0; i < 3; i++) window.Deities.garland(flowerG, [V(x, 5.1, zs[i]), V(x, 4.4, (zs[i] + zs[i + 1]) / 2), V(x, 5.1, zs[i + 1])], 46, 0.05); }
    for (const z of [-5.4, -1.2, 3.0, 7.0]) window.Deities.garland(flowerG, [V(-3.4, 5.1, z), V(0, 4.3, z), V(3.4, 5.1, z)], 70, 0.05);
    for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 8; pts.push(V(s * 1.75 + Math.cos(a) * 0.33, -0.2 + i / 40 * 4.2, 38.6 + Math.sin(a) * 0.33)); } window.Deities.garland(flowerG, pts, 120, 0.05); }
    window.Deities.garland(flowerG, [V(-2.2, 3.6, 11.4), V(-1.6, 3.0, 11.5), V(-1.0, 3.6, 11.4)], 30, 0.05); window.Deities.garland(flowerG, [V(1.0, 3.6, 11.4), V(1.6, 3.0, 11.5), V(2.2, 3.6, 11.4)], 30, 0.05);
  }
  function applyDecor() { deepmala.visible = !!(S.owned.deepmala && S.show.deepmala); flowerG.visible = !!(S.owned.flowers && S.show.flowers); }

  // ---------------- lễ vật trên bệ ----------------
  const offerG = new THREE.Group(); scene.add(offerG);
  function itemMesh(k) {
    const g = new THREE.Group();
    const plate = mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.025, 20), brass, 0, 0.012, 0, true, g);
    const m = (c, o) => std(c, o);
    if (k === 'modak') { for (const [x, z, y] of [[-0.05, 0, 0.05], [0.05, 0.02, 0.05], [0, -0.05, 0.05], [0, 0.0, 0.11]]) { const s = mesh(new THREE.ConeGeometry(0.045, 0.09, 10), m('#F6EEDC', { roughness: 0.5 }), x, y + 0.02, z, true, g); } }
    else if (k === 'durva' || k === 'tulsi' || k === 'bael') { const c = k === 'durva' ? '#5E9A3A' : k === 'tulsi' ? '#3E7A34' : '#3E6A2A'; for (let i = 0; i < 9; i++) { const l = mesh(new THREE.SphereGeometry(0.035, 8, 6), m(c, { roughness: 0.7 }), Math.cos(i * 2.4) * 0.06 * (i % 3), 0.04, Math.sin(i * 2.4) * 0.06 * (i % 3), true, g); l.scale.set(0.5, 0.3, 1.4); l.rotation.y = i * 1.1; } }
    else if (k === 'hibiscus' || k === 'redflower' || k === 'whiteflower' || k === 'yellowflower' || k === 'lotus') {
      const c = { hibiscus: '#D3302A', redflower: '#C82838', whiteflower: '#F6F2EA', yellowflower: '#F2B416', lotus: '#E04A6A' }[k];
      for (let f = 0; f < (k === 'lotus' ? 1 : 3); f++) { const fx = (f - 1) * 0.08, sc = k === 'lotus' ? 1.6 : 1; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const p = mesh(new THREE.SphereGeometry(0.035 * sc, 8, 6), m(c, { roughness: 0.6 }), fx + Math.cos(a) * 0.03 * sc, 0.05, Math.sin(a) * 0.03 * sc, true, g); p.scale.set(1, 0.5, 1.4); p.rotation.y = -a; } mesh(new THREE.SphereGeometry(0.015 * sc, 6, 5), m('#F2C14E'), fx, 0.06, 0, true, g); }
    }
    else if (k === 'fruit') { [['#E46B4A', -0.05, 0], ['#F2C14E', 0.05, 0.02], ['#8DAA5B', 0, -0.05], ['#E8A040', 0.0, 0.05]].forEach(([c, x, z], i) => mesh(new THREE.SphereGeometry(0.045, 12, 10), m(c, { roughness: 0.45 }), x, 0.05 + (i === 3 ? 0.04 : 0), z, true, g)); }
    else if (k === 'ladoo') { for (const [x, y, z] of [[-0.05, 0.05, 0], [0.05, 0.05, 0], [0, 0.05, 0.06], [0, 0.05, -0.06], [0, 0.11, 0]]) mesh(new THREE.SphereGeometry(0.045, 12, 10), m('#F2A23A', { roughness: 0.85 }), x, y, z, true, g); }
    else if (k === 'sindoor') { mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.05, 16), brass, 0, 0.04, 0, true, g); mesh(new THREE.SphereGeometry(0.055, 12, 8), m('#E0461E', { roughness: 0.9 }), 0, 0.065, 0, true, g).scale.y = 0.4; }
    else if (k === 'jasmineoil') { mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.1, 12), m('#F2E6B0', { roughness: 0.1, transparent: true, opacity: 0.8 }), 0, 0.06, 0, true, g); mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8), brass, 0, 0.125, 0, true, g); for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(0.018, 6, 5), m('#FFFFFF'), Math.cos(i * 1.6) * 0.09, 0.03, Math.sin(i * 1.6) * 0.09, true, g); }
    else if (k === 'makhan' || k === 'kheer') { mesh(new THREE.CylinderGeometry(0.075, 0.05, 0.05, 16), k === 'makhan' ? m('#7A4A2A') : brass, 0, 0.04, 0, true, g); mesh(new THREE.SphereGeometry(0.07, 14, 8), m(k === 'makhan' ? '#FFF6D8' : '#F6EBCF', { roughness: 0.5 }), 0, 0.06, 0, true, g).scale.y = 0.35; if (k === 'kheer') for (let i = 0; i < 5; i++) mesh(new THREE.SphereGeometry(0.008, 6, 5), m('#7AA040'), Math.cos(i * 1.3) * 0.03, 0.085, Math.sin(i * 1.3) * 0.03, false, g); }
    else if (k === 'peacock') { mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.32, 5), m('#7A6A40'), 0.0, 0.05, 0, true, g).rotation.z = 1.35; const e = mesh(new THREE.SphereGeometry(0.06, 12, 8), m('#1E7A5A'), 0.15, 0.06, 0, true, g); e.scale.set(1.2, 0.2, 0.8); mesh(new THREE.SphereGeometry(0.03, 10, 6), m('#2A6AB8'), 0.15, 0.07, 0, true, g).scale.set(1.2, 0.2, 0.8); }
    else if (k === 'ghee') { mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.03, 14), m('#B5782C'), 0, 0.03, 0, true, g); g.userData.lamp = true; }
    return g;
  }
  const itemOffsets = [[0, 0], [-0.24, 0.02], [0.24, 0.02], [0, -0.16]];
  function renderOfferings() {
    while (offerG.children.length) offerG.remove(offerG.children[0]);
    flames.filter(f => f.offer).forEach(f => { scene.remove(f.sp); f.dead = true; });
    for (const k of ORDER) {
      const list = (S.today.offered || {})[k] || []; const s = MT.shrines[k];
      list.slice(0, 4).forEach((it, i) => {
        const g = itemMesh(it); const [ox, oz] = itemOffsets[i];
        g.position.set(s.plate.x + Math.cos(s.rot) * ox + Math.sin(s.rot) * oz, s.plate.y, s.plate.z - Math.sin(s.rot) * ox + Math.cos(s.rot) * oz); g.rotation.y = s.rot;
        offerG.add(g);
        if (g.userData.lamp) { const f = flame(g.position.clone().add(new THREE.Vector3(0, 0.1, 0)), 0.14, 0); f.offer = true; }
      });
    }
    for (let i = flames.length - 1; i >= 0; i--) if (flames[i].dead) flames.splice(i, 1);
  }

  // ---------------- người đi lễ ----------------
  const SARI = ['#C8162C', '#E8761E', '#2E7A5A', '#7A2A6A', '#F2B416', '#1E5AA8', '#E04A8A', '#8A5A2A'];
  const KURTA = ['#F4EEDC', '#E8D8B8', '#6A8AA8', '#F2C46A', '#C8C0B0'];
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  function makePerson(kind, female) {
    const robe = female ? rnd(SARI) : rnd(KURTA);
    const av = window.Figures.makeAvatar({ robe, kind, style: female ? 'long' : 'short' });
    if (female) { const pallu = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.2, 0.58, 0.04), new THREE.Vector3(0.0, 0.42, -0.26), new THREE.Vector3(0.24, 0.22, -0.28), new THREE.Vector3(0.32, 0.04, -0.12)]), 24, 0.045, 8), std(new THREE.Color(robe).offsetHSL(0.05, 0, 0.12), { roughness: 0.8 })); av.userData.pivot.add(pallu); }
    scene.add(av); return av;
  }
  const hallPeople = [];
  { const spots = [[-1.3, -4.1, 0.1, 'ganesha'], [3.9, 7.4, -Math.PI / 2 - 0.6, 'hanuman'], [-4.1, -1.5, Math.PI / 2 + 0.5, 'shiva']];
    spots.forEach(([x, z, r], i) => { const av = makePerson(i === 2 ? 'elder' : 'adult', i !== 1); av.position.set(x, 0, z); av.rotation.y = r; av.userData.setPose('stand'); av.userData.setArms('gassho'); Object.assign(av.userData, { next: 2 + i * 2 }); hallPeople.push(av); });
  }
  // một người đang đi parikrama quanh điện chính
  const PARI_PATH = [[0, -4.75], [-2.55, -5.0], [-2.6, -9.0], [2.6, -9.0], [2.55, -5.0]];
  const pariWalker = makePerson('adult', true); pariWalker.userData.setPose('stand'); pariWalker.position.set(2.55, 0, -6.2); Object.assign(pariWalker.userData, { i: 4 });
  // sân: đi quanh tulsi, ngắm sân
  const yardPeople = [];
  { const a = makePerson('adult', true); a.userData.setPose('stand'); a.userData.setArms('gassho'); a.userData.tulsi = 0; yardPeople.push(a);
    const b = makePerson('elder', false); b.userData.setPose('stand'); b.userData.route = [[-0.9, 37], [-0.9, 16.6], [-1.6, 14.2], [-3.2, 16.0], [-0.9, 18.0], [-0.9, 37]]; b.userData.i = 1; b.position.set(-0.9, -0.6, 30); yardPeople.push(b);
    const c = makePerson('child', true); c.userData.setPose('stand'); c.userData.follow = b; c.position.set(-0.3, -0.6, 30.6); yardPeople.push(c);
    const d = makePerson('adult', false); d.userData.setPose('stand'); d.position.set(5.3, -0.6, 19.4); d.rotation.y = -Math.PI / 2 - 0.4; d.userData.setArms('gassho'); d.userData.kundStand = true; yardPeople.push(d); }
  for (const av of [...hallPeople, pariWalker]) window.Figures.blob(scene, av.position.x, av.position.z, 0.45, 0.35);

  // ---------------- giọt nước (abhishek, tulsi, arghya) ----------------
  const DROPS = 80, dropPos = new Float32Array(DROPS * 3), dropVel = new Float32Array(DROPS * 3), dropAge = new Float32Array(DROPS).fill(99);
  const dropGeo = new THREE.BufferGeometry(); dropGeo.setAttribute('position', new THREE.BufferAttribute(dropPos, 3));
  const dropMat = new THREE.PointsMaterial({ map: dropTex, size: 0.07, transparent: true, depthWrite: false, color: '#DDEEFF', opacity: 0.85 });
  const drops = new THREE.Points(dropGeo, dropMat); drops.frustumCulled = false; scene.add(drops);
  let dropIdx = 0, dropFloor = 0;
  function emitDrop(from, vel, floorY) { const i = dropIdx++ % DROPS; dropPos[i * 3] = from.x + (Math.random() - 0.5) * 0.02; dropPos[i * 3 + 1] = from.y; dropPos[i * 3 + 2] = from.z + (Math.random() - 0.5) * 0.02; dropVel[i * 3] = vel.x + (Math.random() - 0.5) * 0.08; dropVel[i * 3 + 1] = vel.y; dropVel[i * 3 + 2] = vel.z + (Math.random() - 0.5) * 0.08; dropAge[i] = 0; dropFloor = floorY; }
  // bình (lota) đồng dùng để rót
  const lota = new THREE.Group(); scene.add(lota); lota.visible = false; lota.scale.setScalar(0.62);
  mesh(new THREE.LatheGeometry([[0, 0], [0.07, 0.0], [0.11, 0.05], [0.12, 0.1], [0.09, 0.16], [0.05, 0.19], [0.06, 0.22], [0.075, 0.24], [0.07, 0.25]].map(([x, y]) => new THREE.Vector2(x, y)), 24), copper, 0, -0.12, 0, true, lota);
  const lotaSpout = new THREE.Object3D(); lotaSpout.position.set(0, 0.13, 0.07); lota.add(lotaSpout);

  // ---------------- đĩa aarti ----------------
  const thali = new THREE.Group(); scene.add(thali); thali.visible = false;
  mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.025, 28), brass, 0, 0, 0, true, thali);
  mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 28), brass, 0, 0.012, 0, false, thali).rotation.x = Math.PI / 2;
  const thaliFlames = [];
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, r = i === 0 ? 0 : 0.12; const x = Math.cos(a) * r, z = Math.sin(a) * r; mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.025, 12), std('#B5782C'), x, 0.025, z, false, thali); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.position.set(x, 0.09, z); sp.scale.set(0.06, 0.1, 1); thali.add(sp); thaliFlames.push(sp); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; mesh(new THREE.SphereGeometry(0.018, 8, 6), std(i % 2 ? '#F28C1E' : '#D3302A'), Math.cos(a) * 0.16, 0.03, Math.sin(a) * 0.16, false, thali); }
  const thaliLight = new THREE.PointLight('#FFB060', 0, 3.5, 1.6); thali.add(thaliLight); thaliLight.position.y = 0.15;

  // ---------------- bầu trời, mặt trời ----------------
  const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 24, 16), skyMat); sky.position.set(0, 0, 20); scene.add(sky);
  const SKY = { dawn: ['#F4B48A', '#8AA4C8'], day: ['#CFE3F2', '#6E9CCB'], dusk: ['#F29A5A', '#4A3A6A'], night: ['#1A2238', '#06080F'] };
  function paintSky(k) { const [lo, hi] = SKY[k]; skyMat.map = canvasTex(4, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, hi); gr.addColorStop(0.55, lo); gr.addColorStop(1, lo); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); skyMat.needsUpdate = true; }
  const sunDisk = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFD08A', blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sunDisk.position.set(120, 18, 30); sunDisk.scale.set(40, 40, 1); scene.add(sunDisk);
  const sunCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex('rgba(255,245,215,1)', 'rgba(255,220,150,0)'), depthWrite: false, fog: false })); sunCore.position.copy(sunDisk.position); sunCore.scale.set(12, 12, 1); scene.add(sunCore);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex('rgba(250,240,215,1)', 'rgba(250,240,215,0)'), depthWrite: false, fog: false })); moon.position.set(-60, 60, 120); moon.scale.set(14, 14, 1); scene.add(moon);
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(Array.from({ length: 900 }, (_, i) => { const k = Math.floor(i / 3), a = k * 2.399, y = 0.15 + (k % 97) / 97 * 0.85, r = Math.sqrt(1 - y * y); return i % 3 === 0 ? Math.cos(a) * r * 170 : i % 3 === 1 ? y * 170 : 20 + Math.sin(a) * r * 170; })), 3)), new THREE.PointsMaterial({ color: '#FFF6E0', size: 0.6, fog: false, transparent: true, opacity: 0.85 }));
  scene.add(stars);

  // ---------------- ánh sáng ----------------
  const ambient = new THREE.AmbientLight('#FFE6CC', 0.3); scene.add(ambient);
  const hemi = new THREE.HemisphereLight('#FFF0DC', '#5A3A24', 0.6); scene.add(hemi);
  const fill = new THREE.PointLight('#FFE2B8', 3.0, 18, 1.4); fill.position.set(0, 5.4, -1.5); scene.add(fill);
  const fill2 = new THREE.PointLight('#FFD8A8', 2.0, 14, 1.4); fill2.position.set(0, 4.6, 5.5); scene.add(fill2);
  const sanctum = new THREE.PointLight('#FFC880', 5, 6, 1.6); sanctum.position.set(0, 2.6, -6.2); scene.add(sanctum);
  const sun = new THREE.DirectionalLight('#FFF0D8', 1.6); sun.position.set(24, 30, 36); sun.target.position.set(0, 0, 20); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 30, bottom: -30, near: 5, far: 110 }); sun.shadow.bias = -0.0006;
  const PH = {
    dawn: { sun: '#FFC9A0', si: 1.2, amb: 0.34, hemi: 0.55, fog: '#3A2418', fd: 0.026, win: '#F6C08E', lamp: 1.0, outFog: '#D9A88A', exp: 1.3 },
    day: { sun: '#FFF4E0', si: 2.0, amb: 0.42, hemi: 0.75, fog: '#3E2A1E', fd: 0.02, win: '#FFF0D0', lamp: 0.75, outFog: '#C8D8E4', exp: 1.25 },
    dusk: { sun: '#FFB070', si: 1.3, amb: 0.3, hemi: 0.5, fog: '#2A1812', fd: 0.028, win: '#F2A860', lamp: 1.15, outFog: '#C88866', exp: 1.35 },
    night: { sun: '#7A8AC0', si: 0.25, amb: 0.24, hemi: 0.28, fog: '#140C0A', fd: 0.03, win: '#2B3656', lamp: 1.35, outFog: '#141A2C', exp: 1.45 }
  };
  let curPhase = null;
  function applyPhase(force) {
    const k = mode === 'arghya' ? 'dawn' : phase(); if (k === curPhase && !force) return; curPhase = k; const t = PH[k];
    sun.color.set(t.sun); sun.intensity = t.si; ambient.intensity = t.amb; hemi.intensity = t.hemi; renderer.toneMappingExposure = t.exp;
    MT.windowMats.forEach(m => m.color.set(t.win)); paintSky(k);
    flames.forEach(f => { f.mult = t.lamp; });
    const lampOn = k === 'night' || k === 'dusk'; deepaFlames.forEach(f => { f.sp.visible = lampOn; }); deepaLight.intensity = lampOn ? 3.2 : 0;
    stars.visible = moon.visible = k === 'night'; sunDisk.visible = sunCore.visible = k !== 'night';
    sunDisk.material.color.set(k === 'day' ? '#FFF2D0' : '#FFB070'); sunDisk.position.set(120, k === 'day' ? 70 : 16, mode === 'arghya' ? 24 : 30); sunCore.position.copy(sunDisk.position);
    waterMat.color.set(k === 'night' ? '#1C2A3A' : k === 'day' ? '#4E7E8E' : '#5A6A7A');
    applyFog();
  }
  function applyFog() {
    const t = PH[curPhase];
    const outside = OUT.includes(mode) || (mode === 'tour' && camera.position.z > 9.9);
    if (outside) { scene.fog.color.set(t.outFog); scene.fog.density = curPhase === 'night' ? 0.012 : 0.006; sky.visible = true; }
    else { scene.fog.color.set(t.fog); scene.fog.density = t.fd; sky.visible = true; }
  }

  // ---------------- camera & input ----------------
  let mode = 'darshan', cur = S.cur && ORDER.includes(S.cur) ? S.cur : todayShrine();
  if (S.lastDay !== dayKey(new Date())) cur = todayShrine();
  let yaw = 0, pitch = 0;
  const camPos = new THREE.Vector3(0, 2, 8), camTarget = new THREE.Vector3(0, 1.5, -6), camAt = camPos.clone(), camLook = camTarget.clone();
  let dragging = false, moved = 0, lx = 0, ly = 0, downX = 0, downY = 0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  canvas.addEventListener('pointerdown', e => {
    dragging = true; moved = 0; lx = downX = e.clientX; ly = downY = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } Audio.unlock();
    if (mode === 'aarti') aartiPointer(e, 'down');
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (mode === 'aarti') { aartiPointer(e, 'move'); return; }
    if (mode === 'parikrama' || mode === 'tour') return;
    yaw = THREE.MathUtils.clamp(yaw - dx * 0.004, -0.55, 0.55); pitch = THREE.MathUtils.clamp(pitch - dy * 0.003, -0.25, 0.3);
  });
  canvas.addEventListener('pointerup', e => {
    dragging = false;
    if (mode === 'aarti') { aartiPointer(e, 'up'); return; }
    if (moved < 10) pick(e);
    else if (mode === 'darshan' && Math.abs(e.clientX - downX) > 90 && Math.abs(e.clientY - downY) < 70) { yaw = 0; step(e.clientX < downX ? 1 : -1); }
  });
  function hitObj(list) { const h = ray.intersectObjects(list, true)[0]; if (!h) return null; let o = h.object; while (o.parent && !list.includes(o)) o = o.parent; return o; }
  let tagFor = null, tagUntil = 0;
  function pick(e) {
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (mode === 'tour') { if (tour) tour.t0 = Math.min(tour.t0, performance.now() - TOUR_MS * 0.96); return; }
    if (mode === 'yard') { const o = hitObj([MT.tulsi, MT.kund, MT.deepastambha]); if (o === MT.tulsi) waterTulsi(); else if (o === MT.kund) startArghya(); return; }
    if (mode !== 'darshan' && mode !== 'path') return;
    const bellList = Object.keys(MT.bells).map(k => MT.bells[k].g);
    const b = hitObj(bellList); if (b) { const k = Object.keys(MT.bells).find(q => MT.bells[q].g === b); ringBell(k, true); return; }
    const d = hitObj(ORDER.map(k => DEITY[k])); if (d) { const k = ORDER.find(q => DEITY[q] === d); if (k !== cur) goShrine(k); }
  }
  function ringBell(k, user) {
    const bl = MT.bells[k]; if (!bl) return; bl.swing = 1; bl.t = 0;
    Audio.ghanta(k === 'door' ? 1.3 : 1); if (user) haptic('light');
    if (user && S.tut === 1) { S.tut = 2; save(); showCoach(2); }
  }

  // ---------------- UI chung ----------------
  const UIS = { darshan: 'darshanUI', aarti: 'aartiUI', japa: 'japaUI', path: 'pathUI', parikrama: 'pariUI', abhishek: 'abhiUI', yard: 'yardUI', arghya: 'arghyaUI', gate: 'gateUI', tour: 'tourUI' };
  function showUI(m) { for (const k of Object.keys(UIS)) $(UIS[k]).hidden = k !== m; $('topBar').hidden = !(m === 'darshan' || m === 'yard' || m === 'gate'); updateBanner(); }
  function renderTop() {
    const p = panToday();
    $('wday').textContent = T.days[wday()];
    $('tithi').textContent = T.tithi(p.idx, p.paksha) + (p.fest ? ' · ' + T.fest(p.fest) : p.obs.length ? ' · ' + T.obs(p.obs[0]) : '');
    $('streak').textContent = T.streak(Math.max(S.streak, 0));
  }
  function updateBanner() {
    const b = $('banner'); if (mode !== 'darshan' && mode !== 'yard') { b.hidden = true; return; }
    const p = panToday();
    let txt = '';
    if (p.fest) txt = T.fest(p.fest);
    else if (wday() === 0 && !S.today.arghya) txt = T.sunday;
    else if (p.obs.length) txt = T.obs(p.obs[0]);
    b.textContent = txt; b.hidden = !txt;
  }
  function renderDarshan() {
    const D = T.deity(cur), i = ORDER.indexOf(cur);
    $('dName').textContent = D.d; $('dSub').textContent = (HI ? '' : D.en) + (cur === todayShrine() ? (HI ? '' : ' · ') + T.todayDeity : '');
    $('bPrev').textContent = '‹ ' + T.dShort(ORDER[(i + ORDER.length - 1) % ORDER.length]); $('bNext').textContent = T.dShort(ORDER[(i + 1) % ORDER.length]) + ' ›';
    $('aAarti').querySelector('span').textContent = T.sub.aarti + (S.today.aarti[cur] ? ' ✓' : ''); $('aArpan').querySelector('span').textContent = T.sub.arpan + ((S.today.offered[cur] || []).length ? ' ✓' : '');
    $('aJapa').querySelector('span').textContent = T.sub.japa; $('aPath').querySelector('span').textContent = T.sub.path;
    $('bAbhi').hidden = cur !== 'shiva'; $('bAbhi').textContent = T.abhishek + (S.today.abhi ? ' ✓' : ''); $('bYard').textContent = T.courtyard;
    $('bPari').hidden = !(cur === 'ganesha' || cur === 'shiva');
  }
  function renderStatic() {
    document.title = T.title; $('bStore').setAttribute('aria-label', T.store); $('bSettings').setAttribute('aria-label', T.settings);
    $('aDone').textContent = T.done; $('jDone').textContent = T.done; $('pStop').textContent = T.done; $('abDone').textContent = T.done; $('agDone').textContent = T.done; $('pariStop').textContent = T.stop;
    $('bShankh').querySelector('span').textContent = T.shankh; $('bGhanta').querySelector('span').textContent = T.ghanta;
    $('yTemple').textContent = T.yTemple; $('yTulsi').querySelector('span').textContent = T.ySub.tulsi; $('yArghya').querySelector('span').textContent = T.ySub.arghya; $('yGate').textContent = T.yGate; $('yHint').textContent = T.yHint;
    $('gHint').textContent = T.gHint; $('agPour').textContent = T.pour; $('abPour').textContent = T.pour; $('gGo').textContent = T.gGo; $('tHint').textContent = T.tapSkip; $('jHint').textContent = T.japaHint; $('jOf').textContent = T.of108;
    [...$('pSpeed').children].forEach((b, i) => { b.textContent = T.speeds[i]; });
  }
  let toastTimer = 0;
  function toast(text, icon, actions) {
    const el = $('toast'); el.innerHTML = ''; if (icon) { const d = document.createElement('div'); d.innerHTML = icon; el.appendChild(d.firstChild); }
    const s = document.createElement('div'); s.textContent = text; el.appendChild(s);
    if (actions) { const row = document.createElement('div'); row.className = 'row'; actions.forEach(([label, fn, gold]) => { const b = document.createElement('button'); b.textContent = label; b.style.background = gold ? 'var(--saffron)' : 'var(--marble-2)'; b.style.color = gold ? 'var(--ink)' : 'var(--brown)'; b.onclick = () => { el.hidden = true; fn && fn(); }; row.appendChild(b); }); el.appendChild(row); }
    el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, actions ? 7000 : 2800);
  }
  function fadeTo(fn) { const f = $('fade'); f.style.opacity = '1'; setTimeout(() => { fn(); snapCam = true; setTimeout(() => { f.style.opacity = '0'; }, 120); }, 300); }
  function setMode(m) { mode = m; applyPhase(true); showUI(m); }
  function goShrine(k) { cur = k; S.cur = k; save(); yaw = 0; pitch = 0; renderDarshan(); if (mode !== 'darshan') setMode('darshan'); }
  function step(dir) { const i = ORDER.indexOf(cur); goShrine(ORDER[(i + dir + ORDER.length) % ORDER.length]); Audio.step(); }
  $('bPrev').addEventListener('click', () => { Audio.unlock(); step(-1); });
  $('bNext').addEventListener('click', () => { Audio.unlock(); step(1); if (S.tut === 3) coachDone(); });
  $('bYard').addEventListener('click', () => { Audio.unlock(); fadeTo(() => setMode('yard')); });
  $('yTemple').addEventListener('click', () => { Audio.unlock(); fadeTo(() => { setMode('darshan'); renderDarshan(); }); });
  $('yGate').addEventListener('click', () => fadeTo(() => setMode('gate')));
  $('gGo').addEventListener('click', () => { Audio.unlock(); startTour(); });
  $('tithiChip').addEventListener('click', () => { Audio.unlock(); openPanchang(); });
  $('bStore').addEventListener('click', () => { Audio.unlock(); openStore(); });
  $('bSettings').addEventListener('click', () => { Audio.unlock(); openSettings(); });

  // ---------------- AARTI ----------------
  let aarti = null;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), cvec = new THREE.Vector3();
  function startAarti() {
    rollDay(); const tx = window.TEXTS.aarti[cur];
    aarti = { acc: 0, last: null, rounds: 0, phase: 'wave', ang: -Math.PI / 2, beat: 0.6, n: 0, lineAt: 0, txt: tx, recv: 0, auto: 0 };
    setMode('aarti'); $('aTitle').textContent = HI ? tx.title.hi : tx.title.en; $('aSub').textContent = T.deity(cur).d;
    $('aCount').textContent = T.aartiOf(0, AARTI_ROUNDS); $('aHint').textContent = T.aHint; $('ring').style.display = '';
    thali.visible = true; thaliLight.intensity = 2.2; Audio.match(); Audio.tanpura(true); setTimeout(() => Audio.shankhShort(), 500);
    renderLyric(); haptic('soft');
  }
  function renderLyric() {
    if (!aarti) return; const L = aarti.txt.lines, n = L.length, i0 = (aarti.rounds * 2) % n; const a = L[i0], b = L[(i0 + 1) % n];
    const one = l => `<div class="d">${esc(l.d)}</div>${HI ? '' : `<div class="r">${esc(l.r)}</div><div class="m">${esc(l.en)}</div>`}`;
    $('lyr').innerHTML = one(a) + `<div style="height:4px"></div>` + one(b);
  }
  function deityScreen() { const s = MT.shrines[cur]; cvec.copy(s.look).project(camera); return { x: (cvec.x + 1) / 2 * innerWidth, y: (1 - cvec.y) / 2 * innerHeight }; }
  function aartiPointer(e, kind) {
    if (!aarti) return;
    const c = deityScreen();
    if (aarti.phase === 'wave') {
      const a = Math.atan2(e.clientY - c.y, e.clientX - c.x);
      if (kind === 'down') { aarti.last = a; return; }
      if (kind === 'up') { aarti.last = null; return; }
      if (aarti.last === null) { aarti.last = a; return; }
      let d = a - aarti.last; d = Math.atan2(Math.sin(d), Math.cos(d)); aarti.last = a;
      if (d > 0 && d < 0.8) { aarti.acc += d; aarti.ang = a; aarti.auto = 0; }
      else if (d < 0) { aarti.ang = a; }
    } else if (aarti.phase === 'receive') {
      if (kind === 'down') aarti.sy = e.clientY;
      if (kind === 'move' && aarti.sy !== undefined && e.clientY - aarti.sy > 70) receiveAarti();
    }
  }
  function tickAarti(dt, t) {
    if (!aarti) return; const s = MT.shrines[cur];
    // vị trí đĩa: vòng tròn trước tượng, theo góc màn hình
    const fwd = tmp.copy(s.cam).sub(s.look).setY(0).normalize(); const right = tmp2.set(fwd.z, 0, -fwd.x);
    const ctr = s.look.clone().addScaledVector(fwd, 0.7);
    if (aarti.phase === 'wave') {
      const r = 0.42; thali.position.copy(ctr).addScaledVector(right, -Math.cos(aarti.ang) * r); thali.position.y = s.look.y - Math.sin(aarti.ang) * r * 0.95;
      const rounds = Math.floor(aarti.acc / (Math.PI * 2));
      if (rounds > aarti.rounds) { aarti.rounds = rounds; $('aCount').textContent = T.aartiOf(Math.min(rounds, AARTI_ROUNDS), AARTI_ROUNDS); renderLyric(); haptic('light'); if (rounds >= AARTI_ROUNDS) { aarti.phase = 'receive'; $('aHint').textContent = T.aReceive; $('ring').style.display = 'none'; Audio.shankhShort(); } }
      const c = deityScreen(); $('ring').style.left = c.x + 'px'; $('ring').style.top = c.y + 'px';
    } else if (aarti.phase === 'receive') {
      aarti.recv += dt; const k = 0.5 + 0.5 * Math.sin(aarti.recv * 3);
      thali.position.copy(ctr).addScaledVector(fwd, 0.4 + k * 0.15); thali.position.y = s.look.y - 0.35;
    } else if (aarti.phase === 'done') { thali.position.lerp(s.plate.clone().add(new THREE.Vector3(0, 0.05, 0)), 1 - Math.pow(0.05, dt)); }
    thali.rotation.y += dt * 0.3;
    thaliFlames.forEach((f, i) => f.scale.set(0.06 + 0.01 * Math.sin(t * 13 + i), 0.1 + 0.02 * Math.sin(t * 9 + i * 2), 1));
    thaliLight.intensity = 2.0 + 0.4 * Math.sin(t * 11);
    // nhạc aarti: manjira mỗi nhịp, chuông mỗi 2 nhịp
    if (aarti.phase !== 'done') { aarti.beat -= dt; if (aarti.beat <= 0) { aarti.beat = 0.52; aarti.n++; Audio.manjira(aarti.n % 4 === 1); if (aarti.n % 2 === 0) { const bl = MT.bells[cur]; if (bl) { bl.swing = 0.6; } Audio.ghanta(0.6, true); } if (cur === 'shiva' && aarti.n % 8 === 0) Audio.damru(); } }
  }
  function receiveAarti() {
    if (!aarti || aarti.phase !== 'receive') return; aarti.phase = 'done';
    const g = $('glow'); g.style.opacity = '1'; setTimeout(() => { g.style.opacity = '0'; }, 900);
    haptic('success'); Audio.ghanta(1); setTimeout(() => Audio.bowl(1.4), 500);
    practiced(); S.today.aarti[cur] = true; S.totals.aarti++; save();
    const p = PRASAD[cur]; setTimeout(() => { toast(T.aartiDone(T.item(p)), SVG[p] || SVG.modak); }, 600);
    setTimeout(() => endAarti(), 2200);
    if (S.tut === 2) { S.tut = 3; save(); setTimeout(() => showCoach(3), 2600); }
  }
  function endAarti() { aarti = null; thali.visible = false; thaliLight.intensity = 0; Audio.tanpura(false); setMode('darshan'); renderDarshan(); }
  $('aAarti').addEventListener('click', () => { Audio.unlock(); $('coach').hidden = true; startAarti(); });
  $('aDone').addEventListener('click', endAarti);
  let shankhHold = false;
  $('bShankh').addEventListener('pointerdown', e => { e.preventDefault(); Audio.unlock(); shankhHold = true; Audio.shankh(true); haptic('soft'); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => $('bShankh').addEventListener(ev, () => { if (shankhHold) { shankhHold = false; Audio.shankh(false); } }));
  $('bGhanta').addEventListener('click', () => { Audio.unlock(); ringBell(cur, true); });

  // ---------------- ARPAN ----------------
  const SVG = {
    modak: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="40" rx="18" ry="4" fill="#C9963E"/><path d="M12 38 Q10 24 18 16 Q20 22 24 12 Q28 22 30 16 Q38 24 36 38 Z" fill="#F6EEDC" stroke="#D9C49A"/><path d="M24 12 L24 38" stroke="#D9C49A"/></svg>',
    durva: '<svg viewBox="0 0 48 48"><g stroke="#4E8A36" stroke-width="3" stroke-linecap="round"><path d="M24 42 L16 8"/><path d="M24 42 L24 6"/><path d="M24 42 L32 8"/><path d="M24 42 L10 16"/><path d="M24 42 L38 16"/></g></svg>',
    hibiscus: '<svg viewBox="0 0 48 48"><g fill="#D3302A"><circle cx="24" cy="12" r="8"/><circle cx="13" cy="21" r="8"/><circle cx="35" cy="21" r="8"/><circle cx="17" cy="33" r="8"/><circle cx="31" cy="33" r="8"/></g><circle cx="24" cy="23" r="5" fill="#F2C14E"/></svg>',
    bael: '<svg viewBox="0 0 48 48"><g fill="#3E7A2A"><ellipse cx="24" cy="14" rx="6" ry="11"/><ellipse cx="13" cy="27" rx="6" ry="11" transform="rotate(-50 13 27)"/><ellipse cx="35" cy="27" rx="6" ry="11" transform="rotate(50 35 27)"/></g><path d="M24 26 L24 44" stroke="#5A4A2A" stroke-width="2"/></svg>',
    whiteflower: '<svg viewBox="0 0 48 48"><g fill="#F6F2EA" stroke="#D9CDB8"><circle cx="24" cy="13" r="7"/><circle cx="14" cy="21" r="7"/><circle cx="34" cy="21" r="7"/><circle cx="18" cy="32" r="7"/><circle cx="30" cy="32" r="7"/></g><circle cx="24" cy="23" r="4" fill="#F2C14E"/></svg>',
    fruit: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="40" rx="18" ry="4" fill="#C9963E"/><circle cx="16" cy="30" r="7" fill="#E46B4A"/><circle cx="29" cy="29" r="8" fill="#F2C14E"/><circle cx="22" cy="20" r="6" fill="#8DAA5B"/></svg>',
    sindoor: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="36" rx="16" ry="6" fill="#C9963E"/><ellipse cx="24" cy="30" rx="12" ry="7" fill="#E0461E"/></svg>',
    jasmineoil: '<svg viewBox="0 0 48 48"><rect x="17" y="14" width="14" height="26" rx="5" fill="#F2E6B0" stroke="#C9A24A"/><rect x="21" y="8" width="6" height="7" fill="#C9963E"/><circle cx="10" cy="38" r="4" fill="#fff" stroke="#ddd"/><circle cx="38" cy="38" r="4" fill="#fff" stroke="#ddd"/></svg>',
    ladoo: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="40" rx="18" ry="4" fill="#C9963E"/><circle cx="16" cy="32" r="7" fill="#F2A23A"/><circle cx="32" cy="32" r="7" fill="#F2A23A"/><circle cx="24" cy="22" r="7" fill="#F6B04A"/></svg>',
    redflower: '<svg viewBox="0 0 48 48"><g fill="#C82838"><circle cx="24" cy="13" r="7"/><circle cx="14" cy="21" r="7"/><circle cx="34" cy="21" r="7"/><circle cx="18" cy="32" r="7"/><circle cx="30" cy="32" r="7"/></g><circle cx="24" cy="23" r="4" fill="#F2C14E"/></svg>',
    tulsi: '<svg viewBox="0 0 48 48"><g fill="#3E7A34"><ellipse cx="24" cy="12" rx="5" ry="9"/><ellipse cx="14" cy="24" rx="5" ry="9" transform="rotate(-60 14 24)"/><ellipse cx="34" cy="24" rx="5" ry="9" transform="rotate(60 34 24)"/><ellipse cx="24" cy="32" rx="5" ry="9"/></g></svg>',
    makhan: '<svg viewBox="0 0 48 48"><path d="M8 26 Q24 46 40 26 Z" fill="#7A4A2A"/><ellipse cx="24" cy="26" rx="16" ry="5" fill="#FFF6D8"/><circle cx="20" cy="22" r="3" fill="#fff"/><circle cx="28" cy="22" r="3" fill="#fff"/></svg>',
    yellowflower: '<svg viewBox="0 0 48 48"><g fill="#F2B416"><circle cx="24" cy="13" r="7"/><circle cx="14" cy="21" r="7"/><circle cx="34" cy="21" r="7"/><circle cx="18" cy="32" r="7"/><circle cx="30" cy="32" r="7"/></g><circle cx="24" cy="23" r="4" fill="#E46A1E"/></svg>',
    peacock: '<svg viewBox="0 0 48 48"><path d="M8 42 L30 18" stroke="#7A6A40" stroke-width="2"/><ellipse cx="32" cy="15" rx="10" ry="13" fill="#1E7A5A" transform="rotate(40 32 15)"/><ellipse cx="32" cy="15" rx="5" ry="7" fill="#2A6AB8" transform="rotate(40 32 15)"/><circle cx="32" cy="15" r="3" fill="#1A1A50"/></svg>',
    lotus: '<svg viewBox="0 0 48 48"><path d="M24 8 Q31 22 24 36 Q17 22 24 8 Z" fill="#E04A6A"/><path d="M10 18 Q22 24 22 36 Q10 30 10 18 Z" fill="#F07A96"/><path d="M38 18 Q26 24 26 36 Q38 30 38 18 Z" fill="#F07A96"/><path d="M6 34 Q24 44 42 34" stroke="#3E7A34" stroke-width="3" fill="none"/></svg>',
    kheer: '<svg viewBox="0 0 48 48"><path d="M8 24 Q24 44 40 24 Z" fill="#C9963E"/><ellipse cx="24" cy="24" rx="16" ry="5" fill="#F6EBCF"/><circle cx="20" cy="23" r="1.5" fill="#7AA040"/><circle cx="27" cy="22" r="1.5" fill="#7AA040"/></svg>',
    ghee: '<svg viewBox="0 0 48 48"><path d="M10 34 Q24 44 38 34 L34 30 Q24 36 14 30 Z" fill="#B5782C"/><path d="M24 10 Q32 22 24 30 Q16 22 24 10 Z" fill="#FFC85A"/><path d="M24 18 Q27 24 24 28 Q21 24 24 18 Z" fill="#FFF2C0"/></svg>'
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wrap = $('sheetWrap'), sheet = $('sheet');
  function openSheet(html, full) { sheet.className = 'sheet' + (full ? ' full' : ''); sheet.innerHTML = html; wrap.hidden = false; }
  function closeSheet() { wrap.hidden = true; sheet.innerHTML = ''; sheet.onclick = null; }
  $('scrim').addEventListener('click', closeSheet);
  function openArpan() {
    rollDay(); const have = S.today.offered[cur] || [];
    openSheet(`<div class="grab"></div><div class="shead"><h2>${esc(T.arpanTitle(HI ? T.deity(cur).d : T.dShort(cur)))}</h2><button class="pill" data-a="close">${T.done}</button></div>
      <div class="tray">${OFFER[cur].map(k => `<button data-i="${k}" class="${have.includes(k) ? 'off' : ''}">${SVG[k]}<b>${esc(T.itemD(k))}</b><span>${esc(HI ? '' : T.item(k))}${have.includes(k) ? ' ✓' : ''}</span></button>`).join('')}</div>
      <div class="note">${esc(T.arpanNote)}</div>`);
    sheet.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'close') closeSheet();
      else if (b.dataset.i) { const k = b.dataset.i; if (have.includes(k)) return; offerItem(k); openArpan(); }
    };
  }
  function offerItem(k) {
    rollDay(); const list = S.today.offered[cur] = S.today.offered[cur] || []; if (list.includes(k)) return; list.push(k);
    practiced(); S.totals.arpan++; save();
    // bay từ trước camera vào bệ
    const g = itemMesh(k); scene.add(g); const s = MT.shrines[cur]; const from = camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.8)); from.y -= 0.35;
    flyers.push({ g, from, to: s.plate.clone(), t: 0 });
    Audio.bowl(0.7); haptic('light');
  }
  const flyers = [];
  function tickFlyers(dt) { for (let i = flyers.length - 1; i >= 0; i--) { const f = flyers[i]; f.t += dt / 0.8; const k = Math.min(1, f.t), e = 1 - Math.pow(1 - k, 2); f.g.position.lerpVectors(f.from, f.to, e); f.g.position.y += Math.sin(k * Math.PI) * 0.35; if (k >= 1) { scene.remove(f.g); flyers.splice(i, 1); renderOfferings(); renderDarshan(); } } }
  $('aArpan').addEventListener('click', () => { Audio.unlock(); openArpan(); });

  // ---------------- JAPA ----------------
  const MALAS = { sandal: { bead: ['#E2B07A', '#9A6A3A'], free: true }, rudraksha: { bead: ['#9A5A3A', '#4A2416'], free: true }, tulsi: { bead: ['#D8C08A', '#8A7A4A'], free: true }, sphatik: { bead: ['#FFFFFF', '#B8C8D8'], iap: 'sphatik' }, chandan: { bead: ['#E0603A', '#7A1E14'], iap: 'chandan' }, goldmala: { bead: ['#9A5A3A', '#4A2416'], gold: true, iap: 'goldmala' } };
  const malaC = $('malaC'); let malaAnim = 0, malaDir = 1;
  function startJapa() {
    const j = window.TEXTS.japa[cur]; setMode('japa'); $('jTitle').textContent = HI ? 'जप' : 'Japa'; $('jSub').textContent = T.deity(cur).d;
    $('jMantra').innerHTML = `<div class="d" style="font-size:24px">${esc(j.d)}</div>${HI ? `<div class="m">${esc(j.hi)}</div>` : `<div class="r">${esc(j.r)}</div><div class="m">${esc(j.en)}</div>`}`;
    renderMalas(); renderJapa(); requestAnimationFrame(drawMala);
  }
  function renderJapa() { $('jCount').textContent = S.japaN; $('jRound').textContent = T.round(S.japaRound); }
  function renderMalas() {
    $('jMalas').innerHTML = Object.keys(MALAS).map(k => { const m = MALAS[k], locked = m.iap && !S.owned[m.iap]; return `<button data-m="${k}" class="${S.mala === k ? 'sel' : ''}">${esc(T.malas[k])}${locked ? `<i>${price[m.iap]}</i>` : ''}</button>`; }).join('');
  }
  $('jMalas').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const k = b.dataset.m, m = MALAS[k]; if (m.iap && !S.owned[m.iap]) { buy(m.iap); return; } S.mala = k; save(); renderMalas(); drawMala(); });
  function drawMala() {
    const r = malaC.getBoundingClientRect(); if (!r.width) return; const dpr = Math.min(devicePixelRatio || 1, 2);
    malaC.width = r.width * dpr; malaC.height = r.height * dpr; const g = malaC.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height);
    const cx = r.width / 2, cy = r.height / 2, R = r.width * 0.4, M = MALAS[S.mala], N = 36;
    g.strokeStyle = M.gold ? 'rgba(242,179,61,0.8)' : 'rgba(242,217,168,0.55)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    const off = malaAnim * (Math.PI * 2 / (N + 1)) * malaDir;
    for (let i = 0; i < N; i++) {
      const a = Math.PI / 2 + (i + 1) * (Math.PI * 2 / (N + 1)) + off; const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      const rad = r.width * 0.026; const gr = g.createRadialGradient(x - rad * 0.35, y - rad * 0.35, rad * 0.15, x, y, rad); gr.addColorStop(0, M.bead[0]); gr.addColorStop(1, M.bead[1]);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      if (S.mala === 'rudraksha' || S.mala === 'goldmala') { g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - rad * 0.7, y); g.lineTo(x + rad * 0.7, y); g.stroke(); }
      if (M.gold) { g.fillStyle = '#F2C14E'; g.beginPath(); g.arc(x, y - rad * 0.85, rad * 0.3, 0, Math.PI * 2); g.fill(); }
    }
    // hạt sumeru (guru) to ở dưới + tua
    const sx = cx, sy = cy + R; g.fillStyle = M.bead[1]; g.beginPath(); g.arc(sx, sy, r.width * 0.042, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#F2D9A8'; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = '#D3302A'; g.lineWidth = 3; for (const dx of [-6, 0, 6]) { g.beginPath(); g.moveTo(sx + dx * 0.5, sy + r.width * 0.04); g.lineTo(sx + dx, sy + r.width * 0.11); g.stroke(); }
    if (malaAnim > 0.001) { malaAnim *= 0.8; requestAnimationFrame(drawMala); } else malaAnim = 0;
  }
  malaC.addEventListener('pointerdown', e => { e.preventDefault(); Audio.unlock(); japaBead(); });
  function japaBead() {
    rollDay(); practiced(); S.japaN++; S.totals.japa++; S.today.japa++; malaAnim = 1; requestAnimationFrame(drawMala);
    Audio.bead(S.mala); haptic('light');
    if (S.japaN >= 108) { S.japaN = 0; S.japaRound++; S.totals.malas++; malaDir = -malaDir; Audio.bowl(1.6); haptic('success'); toast(T.japaTurn); }
    renderJapa(); save();
  }
  $('aJapa').addEventListener('click', () => { Audio.unlock(); startJapa(); });
  $('jDone').addEventListener('click', () => { setMode('darshan'); renderDarshan(); });

  // ---------------- PATH (đọc) ----------------
  let reading = null;
  const PATH_SPEED = [0, 6.5, 4.2];
  function readingsFor(k) {
    const X = window.TEXTS, out = [X.aarti[k]];
    if (k === 'hanuman') out.unshift(X.chalisa);
    if (k === 'shiva') out.push(X.mrityunjaya);
    out.push(X.gayatri);
    return out;
  }
  function openPathPick() {
    const list = readingsFor(cur);
    openSheet(`<div class="grab"></div><div class="shead"><h2>${T.pathPick}</h2><button class="pill" data-a="close">${T.done}</button></div>
      <div class="pick">${list.map(x => `<button data-p="${x.id}"><b><span class="deva">${esc(x.title.hi)}</span>${HI ? '' : ' · ' + esc(x.title.en)}</b><span>${esc(x.src)} · ${T.lines(x.lines.length)}</span></button>`).join('')}</div>`);
    sheet.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'close') closeSheet(); else if (b.dataset.p) { closeSheet(); startPath(list.find(x => x.id === b.dataset.p)); } };
  }
  function startPath(x) {
    reading = { x, i: 0, wait: PATH_SPEED[S.settings.pathSpeed] + 1.5, rep: 1, reps: x.repeat || 1 };
    setMode('path'); $('pTitle').textContent = HI ? x.title.hi : x.title.en; $('pSub').textContent = x.src;
    [...$('pSpeed').children].forEach((b, i) => b.classList.toggle('sel', i === S.settings.pathSpeed));
    Audio.tanpura(true); Audio.bowl(1.0); renderPath();
  }
  function renderPath() {
    if (!reading) return; const L = reading.x.lines, i = reading.i;
    const ln = (l, cls) => `<div class="ln ${cls}"><div class="d">${esc(l.d)}</div>${HI ? '' : `<div class="r">${esc(l.r)}</div>`}</div>`;
    let h = ''; if (i > 0) h += ln(L[i - 1], 'dim'); h += ln(L[i], 'cur'); if (i + 1 < L.length) h += ln(L[i + 1], 'dim');
    const m = HI ? (L[i].hi || '') : L[i].en; if (m) h += `<div class="m">${esc(m)}</div>`;
    $('pScroll').innerHTML = h; $('pProg').style.width = (100 * (i + 1) / L.length).toFixed(1) + '%';
  }
  function nextLine() {
    if (!reading) return; reading.i++; reading.wait = PATH_SPEED[S.settings.pathSpeed];
    if (reading.i >= reading.x.lines.length) {
      if (reading.rep < reading.reps) { reading.rep++; reading.i = 0; Audio.bowl(0.8); renderPath(); return; }
      practiced(); S.totals.path++; save(); Audio.bowl(1.6); haptic('success'); toast(T.pathDone); stopPath(); return;
    }
    if (reading.x.lines[reading.i].k === 'd' && reading.x.lines[reading.i - 1].k !== 'd') Audio.bowl(0.6);
    renderPath();
  }
  function stopPath() { reading = null; Audio.tanpura(false); setMode('darshan'); renderDarshan(); }
  function tickPath(dt) { if (!reading || !PATH_SPEED[S.settings.pathSpeed]) return; reading.wait -= dt; if (reading.wait <= 0) nextLine(); }
  $('aPath').addEventListener('click', () => { Audio.unlock(); openPathPick(); });
  $('pStop').addEventListener('click', stopPath);
  $('pNext').addEventListener('click', () => { Audio.unlock(); nextLine(); });
  $('pScroll').addEventListener('click', () => { Audio.unlock(); nextLine(); });
  $('pBell').addEventListener('click', () => { Audio.unlock(); ringBell(cur, true); });
  $('pSpeed').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.settings.pathSpeed = +b.dataset.v; [...$('pSpeed').children].forEach((x, i) => x.classList.toggle('sel', i === S.settings.pathSpeed)); if (reading) reading.wait = PATH_SPEED[S.settings.pathSpeed]; save(); });

  // ---------------- PARIKRAMA ----------------
  let pari = null;
  const me = makePerson('adult', false); me.userData.setPose('stand'); me.visible = false;
  function startPari() {
    let pts;
    if (cur === 'ganesha') pts = PARI_PATH.map(([x, z]) => new THREE.Vector3(x, 0, z));
    else { const s = MT.shrines.shiva, c = s.pos, r = s.rot; const P2 = a => new THREE.Vector3(c.x + Math.sin(r + a) * 1.55, 0, c.z + Math.cos(r + a) * 1.55); pts = [P2(0), P2(0.45), P2(0.9), P2(1.2)]; }
    const curve = new THREE.CatmullRomCurve3(pts, cur === 'ganesha', 'centripetal');
    pari = { curve, t: 0, round: 0, half: cur !== 'ganesha', dir: 1, step: 0 };
    me.visible = true; me.userData.setArms('gassho'); curve.getPointAt(0, me.position);
    setMode('parikrama'); $('pariHint').textContent = cur === 'ganesha' ? T.pariHint : T.pariShiva; $('pariCount').textContent = T.pariRound(1, PARI_ROUNDS); Audio.tanpura(true);
  }
  function tickPari(dt, t) {
    if (!pari) return; const sp = pari.half ? 0.16 : 0.075;
    if (pari.half) { pari.t += dt * sp * pari.dir; if (pari.t >= 1) { pari.t = 1; pari.dir = -1; } else if (pari.t <= 0 && pari.dir < 0) { pari.t = 0; pari.dir = 1; pari.round++; roundDone(); } }
    else { pari.t += dt * sp; if (pari.t >= 1) { pari.t -= 1; pari.round++; roundDone(); } }
    if (!pari) return;
    const u = Math.max(0, Math.min(1, pari.t)); pari.curve.getPointAt(u, me.position); pari.curve.getTangentAt(u, tmp); if (pari.dir < 0) tmp.negate();
    turnTo(me, Math.atan2(-tmp.x, -tmp.z), 8, dt); me.userData.walkCycle(t); me.position.y = Math.abs(Math.sin(t * 8)) * 0.02;
    if (cur === 'ganesha') { camPos.set(me.position.x * 0.45, 5.5, -0.6); camTarget.set(me.position.x * 0.7, 0.9, me.position.z); }
    else { const s = MT.shrines.shiva; camPos.copy(s.cam); camPos.y = 3.6; camTarget.copy(me.position).lerp(lingaTop, 0.5); camTarget.y = 0.9; }
    pari.step -= dt; if (pari.step <= 0) { pari.step = 0.5; Audio.step(); }
  }
  function roundDone() {
    $('pariCount').textContent = T.pariRound(Math.min(pari.round + 1, PARI_ROUNDS), PARI_ROUNDS); Audio.ghanta(0.7); haptic('light');
    if (pari.round >= PARI_ROUNDS) { practiced(); S.totals.pari++; S.today.pari = true; save(); toast(T.pariDone); endPari(); }
  }
  function endPari() { pari = null; me.visible = false; Audio.tanpura(false); setMode('darshan'); renderDarshan(); snapCam = true; }
  $('bPari').addEventListener('click', () => { Audio.unlock(); startPari(); });
  $('pariStop').addEventListener('click', endPari);

  // ---------------- ABHISHEK (Shiva) ----------------
  let abhi = null;
  function startAbhi() {
    abhi = { kind: 'water', poured: 0, hold: false, need: 7, done: false };
    setMode('abhishek'); $('abSub').textContent = T.abSub; $('abHint').textContent = T.abHint; $('abPour').textContent = T.pour;
    const j = window.TEXTS.japa.shiva; $('abText').innerHTML = `<div class="d" style="font-size:24px">${esc(j.d)}</div>${HI ? '' : `<div class="r">${esc(j.r)}</div>`}`;
    $('abKind').innerHTML = ['water', 'milk'].map(k => `<button data-k="${k}" class="${k === 'water' ? 'sel' : ''}">${T[k]}</button>`).join('');
    lota.visible = true; renderAbhi();
  }
  function renderAbhi() { $('abCount').textContent = Math.min(100, Math.round(100 * abhi.poured / abhi.need)) + '%'; }
  $('abKind').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || !abhi) return; abhi.kind = b.dataset.k; [...$('abKind').children].forEach(x => x.classList.toggle('sel', x === b)); dropMat.color.set(abhi.kind === 'milk' ? '#FFFFFF' : '#DDEEFF'); });
  $('abPour').addEventListener('pointerdown', e => { e.preventDefault(); Audio.unlock(); if (abhi) { abhi.hold = true; Audio.pour(true); haptic('soft'); } });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => $('abPour').addEventListener(ev, () => { if (abhi && abhi.hold) { abhi.hold = false; Audio.pour(false); } }));
  function tickAbhi(dt, t) {
    if (!abhi) return; const s = MT.shrines.shiva;
    const fwd = tmp.copy(s.cam).sub(s.look).setY(0).normalize();
    lota.position.copy(lingaTop).addScaledVector(fwd, 0.22); lota.position.y = lingaTop.y + 0.32;
    lota.lookAt(lingaTop.x, lota.position.y, lingaTop.z);
    const tilt = abhi.hold ? 1.25 : 0.25; lota.rotation.x += (tilt - lota.rotation.x) * Math.min(1, dt * 6);
    if (abhi.hold) {
      abhi.poured += dt; lotaSpout.getWorldPosition(tmp2);
      for (let i = 0; i < 3; i++) emitDrop(tmp2, new THREE.Vector3((lingaTop.x - tmp2.x) * 1.2, -0.2, (lingaTop.z - tmp2.z) * 1.2), lingaTop.y - 0.55);
      renderAbhi();
      if (!abhi.done && abhi.poured >= abhi.need) { abhi.done = true; abhi.hold = false; Audio.pour(false); practiced(); S.today.abhi = true; S.totals.abhi++; save(); Audio.ghanta(1); Audio.damru(); haptic('success'); toast(T.abDone); setTimeout(endAbhi, 1600); }
    }
  }
  function endAbhi() { abhi = null; lota.visible = false; Audio.pour(false); setMode('darshan'); renderDarshan(); }
  $('bAbhi').addEventListener('click', () => { Audio.unlock(); startAbhi(); });
  $('abDone').addEventListener('click', endAbhi);

  // ---------------- TULSI & ARGHYA ----------------
  let tulsiT = 0;
  function waterTulsi() {
    rollDay(); tulsiT = 2.4; lota.visible = true; Audio.pour(true); setTimeout(() => Audio.pour(false), 2200); haptic('soft');
    if (!S.today.tulsi) { S.today.tulsi = true; S.totals.tulsi++; practiced(); save(); setTimeout(() => toast(T.tulsiDone), 2300); }
  }
  function tickTulsi(dt) {
    if (tulsiT <= 0) return; tulsiT -= dt; const top = MT.tulsiTop;
    lota.position.set(top.x + 0.55, top.y + 0.75, top.z + 0.45); lota.lookAt(top.x, lota.position.y, top.z); lota.rotation.x = 1.1;
    lotaSpout.getWorldPosition(tmp2); for (let i = 0; i < 2; i++) emitDrop(tmp2, new THREE.Vector3((top.x - tmp2.x) * 1.0, -0.3, (top.z - tmp2.z) * 1.0), top.y + 0.1);
    if (tulsiT <= 0) lota.visible = false;
  }
  $('yTulsi').addEventListener('click', () => { Audio.unlock(); waterTulsi(); });
  let argh = null;
  function startArghya() {
    argh = { poured: 0, hold: false, need: 6, done: false, line: 0, lt: 0 };
    fadeTo(() => { setMode('arghya'); $('agSub').textContent = T.agSub; $('agHint').textContent = T.agHint; $('agPour').textContent = T.pour; lota.visible = true; renderArghya(); Audio.tanpura(true); });
  }
  function renderArghya() { const L = window.TEXTS.gayatri.lines, l = L[argh.line % L.length]; $('agText').innerHTML = `<div class="d">${esc(l.d)}</div>${HI ? `<div class="m">${esc(l.hi)}</div>` : `<div class="r">${esc(l.r)}</div><div class="m">${esc(l.en)}</div>`}`; $('agCount').textContent = Math.min(100, Math.round(100 * argh.poured / argh.need)) + '%'; }
  $('agPour').addEventListener('pointerdown', e => { e.preventDefault(); Audio.unlock(); if (argh) { argh.hold = true; Audio.pour(true); } });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => $('agPour').addEventListener(ev, () => { if (argh && argh.hold) { argh.hold = false; Audio.pour(false); } }));
  function tickArghya(dt) {
    if (!argh) return; argh.lt += dt; if (argh.lt > 3.2) { argh.lt = 0; argh.line++; renderArghya(); }
    const base = new THREE.Vector3(2.4, 2.05, 21.0); lota.position.copy(base); lota.lookAt(base.x + 3, base.y, base.z + 1.2);
    const tilt = argh.hold ? 1.3 : 0.2; lota.rotation.x += (tilt - lota.rotation.x) * Math.min(1, dt * 6);
    if (argh.hold) {
      argh.poured += dt; lotaSpout.getWorldPosition(tmp2); for (let i = 0; i < 3; i++) emitDrop(tmp2, new THREE.Vector3(2.6, 0.5, 0.1), -1.2);
      renderArghya();
      if (!argh.done && argh.poured >= argh.need) { argh.done = true; argh.hold = false; Audio.pour(false); practiced(); S.today.arghya = true; S.totals.arghya++; save(); Audio.ghanta(1); Audio.shankhShort(); haptic('success'); toast(T.agDone); setTimeout(endArghya, 1800); }
    }
  }
  function endArghya() { argh = null; lota.visible = false; Audio.pour(false); Audio.tanpura(false); fadeTo(() => setMode('yard')); }
  $('yArghya').addEventListener('click', () => { Audio.unlock(); startArghya(); });
  $('agDone').addEventListener('click', endArghya);

  // ---------------- tour: cổng → kệ dép → sân → điện ----------------
  let tour = null; const TOUR_MS = 9000;
  let TOUR = null;
  function startTour() {
    const s = MT.shrines[cur]; const V = (x, y, z) => new THREE.Vector3(x, y, z);
    TOUR = new THREE.CatmullRomCurve3([V(0, 1.2, 49), V(0, 1.1, 40), V(1.4, 1.0, 36.4), V(0.4, 1.1, 31), V(0.2, 1.2, 22), V(0, 1.4, 14.4), V(0, 1.7, 10.6), V(0, 1.9, 7.6), s.cam.clone()], false, 'centripetal');
    tour = { t0: performance.now(), step: 0, inside: false }; setMode('tour'); Audio.step();
  }
  function endTour() { tour = null; S.gateDay = dayKey(new Date()); save(); setMode('darshan'); renderDarshan(); snapCam = true; ringBell('door', false); if (S.tut === 0) { S.tut = 1; save(); setTimeout(() => showCoach(1), 900); } }

  // ---------------- sheets: panchang, settings, store ----------------
  function openPanchang() {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    const p = panToday(), city = window.Panchang.cityOf(S.settings.city);
    const tm = ms => { const d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
    let cells = T.daysShort.map(d => `<div class="h">${esc(d)}</div>`).join('');
    for (let i = 0; i < first; i++) cells += '<div class="c e"></div>';
    for (let d = 1; d <= days; d++) {
      const q = window.Panchang.day(new Date(y, m, d), S.settings.city);
      const tag = q.fest ? T.fest(q.fest) : q.obs.includes('ekadashi') ? T.obs('ekadashi') : q.obs.includes('purnima') ? T.obs('purnima') : q.obs.includes('amavasya') ? T.obs('amavasya') : '';
      cells += `<div class="c${d === now.getDate() ? ' today' : ''}${q.fest ? ' fest' : ''}">${d}<small>${esc(tag ? tag.split(' ')[0] : T.tithiShort(q.idx, q.paksha).slice(0, HI ? 6 : 5))}</small></div>`;
    }
    const up = window.Panchang.upcoming(now, 6).map(([k, f]) => { const [yy, mm, dd] = k.split('-').map(Number); return `<div class="item"><div class="t"><b>${esc(T.fest(f))}</b></div><span class="p">${dd} ${esc(T.months[mm - 1].slice(0, HI ? 10 : 3))} ${yy}</span></div>`; }).join('');
    openSheet(`<div class="grab"></div><div class="shead"><h2>${T.panchang}</h2><button class="pill" data-a="close">${T.done}</button></div>
      <div class="item" style="background:var(--maroon);color:var(--ink);border-color:var(--maroon)"><div class="t"><b class="deva" style="font-size:17px">${esc(T.tithi(p.idx, p.paksha))}</b><span style="color:var(--ink-soft)">${esc(T.days[now.getDay()])} · ${esc(HI ? city[2] : city[1])}</span></div><div class="t" style="text-align:right"><span style="color:var(--ink-soft)">${T.sunrise} ${tm(p.rise)}</span><span style="color:var(--ink-soft)">${T.sunset} ${tm(p.set)}</span></div></div>
      <div class="label">${esc(T.months[m])} ${y}</div><div class="cal">${cells}</div>
      <div class="label">${T.upcoming}</div><div class="list">${up}</div>
      <div class="label">${T.city}</div><select id="citySel" aria-label="${esc(T.city)}">${window.Panchang.CITIES.map(c => `<option value="${c[0]}" ${c[0] === S.settings.city ? 'selected' : ''}>${esc(HI ? c[2] : c[1])}</option>`).join('')}</select>
      <div class="note">${esc(T.panchangNote)}</div>`, true);
    $('citySel').addEventListener('change', e => { S.settings.city = e.target.value; phaseCache = null; save(); renderTop(); updateBanner(); applyPhase(true); schedule(); openPanchang(); });
    sheet.onclick = e => { const b = e.target.closest('button'); if (b && b.dataset.a === 'close') closeSheet(); };
  }
  function openSettings() {
    const s = S.settings, sw = (k, label) => `<div class="item"><div class="t"><b>${esc(label)}</b></div><button class="sw" role="switch" aria-label="${esc(label)}" aria-checked="${!!s[k]}" data-s="${k}"></button></div>`;
    openSheet(`<div class="grab"></div><div class="shead"><h2>${T.settings}</h2><button class="pill" data-a="close">${T.done}</button></div>
      <div class="list">${sw('ambient', T.ambient)}${sw('effects', T.effects)}${sw('haptics', T.haptics)}</div>
      <div class="label">${T.notif}</div><div class="list">${sw('nMorning', T.nMorning)}${sw('nEvening', T.nEvening)}${sw('nEkadashi', T.nEkadashi)}${sw('nFest', T.nFest)}</div>
      <div class="label">${T.language}</div><div class="chips">${[['auto', T.langAuto], ['en', 'English'], ['hi', 'हिन्दी']].map(([k, n]) => `<button class="${(s.lang || 'auto') === k ? 'sel' : ''}" data-l="${k}">${esc(n)}</button>`).join('')}</div>
      <button class="link" data-a="tut">${T.tutAgain}</button><button class="link" data-a="restore">${T.restore}</button><button class="link" data-a="privacy">${T.privacy}</button>
      <div class="note">${esc(T.disclaimer)}</div>`);
    sheet.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'close') closeSheet();
      else if (b.dataset.s) { const k = b.dataset.s; s[k] = !s[k]; b.setAttribute('aria-checked', String(s[k])); if (k === 'ambient') Audio.ambient(s.ambient); if (k[0] === 'n') { if (s[k]) post({ type: 'notifyPermission' }); schedule(); } save(); }
      else if (b.dataset.l) { if ((s.lang || 'auto') === b.dataset.l) return; s.lang = b.dataset.l === 'auto' ? null : b.dataset.l; const j = JSON.stringify(S); post({ type: 'save', state: j }); try { localStorage.setItem('mm', j); } catch (er) { /* ignore */ } setTimeout(() => { if (native) post({ type: 'reload' }); else location.replace(location.pathname + '?lang=' + b.dataset.l); }, 300); }
      else if (b.dataset.a === 'tut') { closeSheet(); S.tut = 1; save(); if (mode !== 'darshan') { setMode('darshan'); renderDarshan(); } showCoach(1); }
      else if (b.dataset.a === 'restore') { if (native) post({ type: 'restore' }); else toast(T.restored); }
      else if (b.dataset.a === 'privacy') { const u = window.QP_PRIVACY || 'https://khacluatit.github.io/game-factory/mangalmandir/privacy.html'; if (native) post({ type: 'open', url: u }); else window.open(u, '_blank'); }
    };
  }
  function openStore() {
    openSheet(`<div class="grab"></div><div class="shead"><h2>${T.store}</h2><button class="pill" data-a="close">${T.done}</button></div>
      <div class="list">${Object.keys(P).map(k => `<div class="item"><div class="t"><b>${esc(T.prod[k][0])}</b><span>${esc(T.prod[k][1])}</span></div>${S.owned[k] ? (k === 'deepmala' || k === 'flowers' ? `<button class="sw" role="switch" aria-label="${esc(T.show)}" aria-checked="${!!S.show[k]}" data-t="${k}"></button>` : `<span class="p">${T.owned}</span>`) : `<button class="pill gold" data-b="${k}">${price[k]}</button>`}</div>`).join('')}</div>
      <button class="link" data-a="restore">${T.restore}</button><div class="note">${esc(T.disclaimer)}</div>`);
    sheet.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'close') closeSheet();
      else if (b.dataset.b) buy(b.dataset.b);
      else if (b.dataset.t) { S.show[b.dataset.t] = !S.show[b.dataset.t]; applyDecor(); save(); openStore(); }
      else if (b.dataset.a === 'restore') { if (native) post({ type: 'restore' }); else toast(T.restored); }
    };
  }

  // ---------------- onboarding & coach ----------------
  function onboarding(stepN) {
    const ob = $('ob'); ob.hidden = false; const c = T.ob[stepN];
    const art = '<svg width="220" height="170" viewBox="0 0 220 170" aria-hidden="true"><path d="M110 12 Q82 50 80 92 L140 92 Q138 50 110 12 Z" fill="#F4EBDC"/><circle cx="110" cy="12" r="6" fill="#C9A24A"/><path d="M110 6 L110 -8 L126 0 L110 4" fill="#F07A1A"/><rect x="58" y="92" width="104" height="58" fill="#EFE3CC"/><path d="M96 150 L96 118 Q110 104 124 118 L124 150 Z" fill="#5A2A16"/><path d="M58 100 Q110 122 162 100" stroke="#F28C1E" stroke-width="7" fill="none" stroke-linecap="round"/><g transform="translate(40 150)"><ellipse rx="10" ry="4" fill="#B5782C"/><path d="M0 -3 Q-4 -12 0 -18 Q4 -12 0 -3 Z" fill="#FFC85A"/></g><g transform="translate(180 150)"><ellipse rx="10" ry="4" fill="#B5782C"/><path d="M0 -3 Q-4 -12 0 -18 Q4 -12 0 -3 Z" fill="#FFC85A"/></g></svg>';
    ob.innerHTML = `${art}<h1>${esc(c[0])}</h1><p>${esc(c[1])}</p>
      ${stepN === 2 ? `<div class="item"><div class="t"><b>${esc(T.obN)}</b></div><button class="sw" role="switch" aria-label="${esc(T.obN)}" aria-checked="${S.settings.nMorning}" id="obN"></button></div>` : ''}
      <div class="dots">${[0, 1, 2].map(i => `<i class="${i === stepN ? 'on' : ''}"></i>`).join('')}</div>
      <button class="big" id="obNext">${stepN < 2 ? T.next : T.start}</button>`;
    if (stepN === 2) $('obN').onclick = e => { S.settings.nMorning = !S.settings.nMorning; e.currentTarget.setAttribute('aria-checked', String(S.settings.nMorning)); };
    $('obNext').onclick = () => {
      Audio.unlock(); if (stepN < 2) return onboarding(stepN + 1);
      ob.hidden = true; S.onboarded = true; if (S.settings.nMorning) post({ type: 'notifyPermission' }); schedule(); save();
      fadeTo(() => setMode('gate'));
    };
  }
  let coachN = 0;
  function showCoach(n) {
    if (SHOT || mode !== 'darshan') return; coachN = n; const c = $('coach'), t = T.tut[n - 1];
    $('coachT').textContent = t[0]; $('coachB').textContent = t[1]; $('coachSkip').textContent = T.skip; $('coachOk').textContent = T.gotIt;
    c.style.top = n === 1 ? 'calc(env(safe-area-inset-top, 0px) + 90px)' : ''; c.style.bottom = n === 1 ? '' : 'calc(env(safe-area-inset-bottom, 0px) + 300px)';
    $('coachOk').hidden = n !== 3; c.hidden = false;
  }
  function coachDone() { S.tut = 9; $('coach').hidden = true; save(); }
  $('coachSkip').addEventListener('click', coachDone); $('coachOk').addEventListener('click', coachDone);

  // ---------------- store bridge ----------------
  function buy(key) { if (native) { post({ type: 'buy', id: P[key].id }); return; } setTimeout(() => window.QP.onPurchase(P[key].id, true), 400); }
  window.QP = {
    onProducts(list) { (list || []).forEach(p => { const k = keyById(p.id); if (k && p.price) price[k] = p.price; }); if (mode === 'japa') renderMalas(); },
    onPurchase(id, ok) {
      const k = keyById(id); if (!k) return; if (!ok) { toast(T.buyFail); return; }
      S.owned[k] = true; S.show[k] = true; if (MALAS[k]) S.mala = k; applyDecor(); save(); haptic('success'); Audio.bowl(1.2);
      toast(T.bought + ' · ' + T.prod[k][0]); if (!wrap.hidden) openStore(); if (mode === 'japa') { renderMalas(); drawMala(); }
    },
    onOwned(ids) { (ids || []).forEach(id => { const k = keyById(id); if (k) S.owned[k] = true; }); applyDecor(); save(); if (mode === 'japa') renderMalas(); },
    onRestored(ids) { this.onOwned(ids); toast(T.restored); },
    onNotifyPermission(granted) { if (!granted) { ['nMorning', 'nEvening', 'nEkadashi', 'nFest'].forEach(k => { S.settings[k] = false; }); save(); } else schedule(); },
    onSpoken() { },
    onForeground() { rollDay(); phaseCache = null; applyPhase(); renderTop(); updateBanner(); if (mode === 'darshan') renderDarshan(); }
  };

  // ---------------- notifications ----------------
  function schedule() {
    const s = S.settings, items = [], now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i), q = window.Panchang.day(d, s.city), dn = T.dShort(DAY_DEITY[d.getDay()]);
      if (s.nMorning) items.push({ id: 'm' + i, date: new Date(q.rise + 30 * 60e3), title: T.nMorningT, body: T.nMorningB(dn) });
      if (s.nEvening) items.push({ id: 'e' + i, date: new Date(q.set - 5 * 60e3), title: T.nEveningT, body: T.nEveningB });
      if (s.nFest && q.fest) { const x = new Date(d); x.setHours(7, 0, 0, 0); items.push({ id: 'f' + i, date: x, title: T.nFestT(T.fest(q.fest)), body: T.nFestB }); }
      if (s.nEkadashi) { const nx = new Date(d); nx.setDate(d.getDate() + 1); const q2 = window.Panchang.day(nx, s.city); if (q2.obs.includes('ekadashi')) { const x = new Date(d); x.setHours(19, 0, 0, 0); items.push({ id: 'k' + i, date: x, title: T.nEkaT, body: T.nEkaB }); } }
    }
    const list = items.filter(x => x.date > now).sort((a, b) => a.date - b.date).slice(0, 60).map(x => ({ id: x.id, ts: Math.floor(x.date.getTime() / 1000), title: x.title, body: x.body }));
    post({ type: 'schedule', items: list });
  }

  // ---------------- audio ----------------
  const Audio = (() => {
    let ac = null, amb = null, unlocked = false, master = null, wet = null, shk = null, tanOn = false, tanT = 0, tanI = 0, pourN = null;
    const on = () => S.settings.effects && ac;
    function ctx() {
      if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
      if (ac && !master) {
        master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
        const len = Math.floor(ac.sampleRate * 2.8), ir = ac.createBuffer(2, len, ac.sampleRate);
        for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * (i < ac.sampleRate * 0.01 ? i / (ac.sampleRate * 0.01) : 1); }
        const conv = ac.createConvolver(); conv.buffer = ir; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
        wet = ac.createGain(); wet.gain.value = 0.34; wet.connect(conv); conv.connect(lp); lp.connect(master);
      }
      return ac;
    }
    function out(node, w) { node.connect(master); if (w) { const g = ac.createGain(); g.gain.value = w; node.connect(g); g.connect(wet); } }
    function env(node, peak, dur, t0, att) { const t = t0 || ac.currentTime, g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + (att || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); node.connect(g); return g; }
    let nb = null;
    function noise() { if (!nb) { nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; return s; }
    function partial(f, amp, dur, t, bus, detune) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f; if (detune) o.detune.value = detune; const g = env(o, amp, dur, t, 0.002); g.connect(bus); o.start(t); o.stop(t + dur + 0.05); }
    function hit(t, f, q, amp, dur, bus) { const n = noise(), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; n.connect(bp); env(bp, amp, dur, t, 0.001).connect(bus); n.start(t); n.stop(t + dur + 0.02); }
    // chuông đồng ghanta: lưỡi gõ 3 lần liền, bội âm không điều hoà, ngân ~3 s
    function ghanta(t, size, soft) {
      const bus = ac.createGain(); bus.gain.value = (soft ? 0.18 : 0.38) * Math.min(size, 1.4); out(bus, 0.45);
      const f0 = 980 / Math.max(0.6, size);
      const strikes = soft ? [0] : [0, 0.16, 0.29];
      strikes.forEach((dt, k) => { const a = 1 - k * 0.25, tt = t + dt;
        for (const [r, amp, d, det] of [[1, 0.5, 3.2, 0], [1, 0.25, 3.2, 6], [2.4, 0.3, 2.0, 0], [3.9, 0.16, 1.2, -4], [5.6, 0.1, 0.7, 0], [7.8, 0.05, 0.35, 0], [0.55, 0.12, 2.6, 0]]) partial(f0 * r, amp * a, d * (0.7 + size * 0.3), tt, bus, det);
        hit(tt, 5200, 2, 0.12 * a, 0.02, bus); });
    }
    function bowl(t, s) { const bus = ac.createGain(); bus.gain.value = 0.32 * Math.min(s, 1.6); out(bus, 0.5); const f0 = 560; for (const [r, a, d, dt] of [[1, 0.5, 5, 0], [2.71, 0.22, 3.4, 4], [5.2, 0.08, 1.6, -6], [1, 0.25, 5, 3.5]]) partial(f0 * r, a, d * Math.max(0.6, s), t, bus, dt); hit(t, 3400, 1.2, 0.12, 0.03, bus); }
    function manjira(t, acc) { const bus = ac.createGain(); bus.gain.value = acc ? 0.2 : 0.13; out(bus, 0.4); for (const [f, a, d] of [[2950, 0.4, 0.9], [4410, 0.3, 0.7], [6230, 0.18, 0.45], [8150, 0.1, 0.3], [3010, 0.3, 0.9]]) partial(f * (0.99 + Math.random() * 0.02), a, d, t, bus, 0); hit(t, 7200, 1.5, 0.25, 0.03, bus); }
    function damru(t) { const bus = ac.createGain(); bus.gain.value = 0.5; out(bus, 0.3); for (let i = 0; i < 8; i++) { const tt = t + i * 0.085, f = i % 2 ? 210 : 165; const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.4, tt); o.frequency.exponentialRampToValueAtTime(f, tt + 0.05); env(o, 0.5, 0.09, tt, 0.002).connect(bus); o.start(tt); o.stop(tt + 0.1); hit(tt, 900, 1.5, 0.15, 0.04, bus); } }
    function pluck(t, f, amp) {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f * 1.003;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6; lp.frequency.setValueAtTime(f * 9, t); lp.frequency.exponentialRampToValueAtTime(f * 3.2, t + 2.6); // "jawari" rì rào
      o.connect(lp); o2.connect(lp); const g = env(lp, amp, 4.4, t, 0.02); out(g, 0.5); o.start(t); o2.start(t); o.stop(t + 4.5); o2.stop(t + 4.5);
    }
    const api = {
      unlock() { if (SHOT) return; ctx(); if (!ac) return; if (ac.state === 'suspended') ac.resume(); if (!unlocked) { unlocked = true; api.ambient(S.settings.ambient); } },
      ghanta(size, soft) { if (!on()) return; ghanta(ac.currentTime + 0.01, size || 1, soft); },
      bowl(s) { if (!on()) return; bowl(ac.currentTime + 0.01, s || 1); },
      manjira(acc) { if (!on()) return; manjira(ac.currentTime + 0.005, acc); },
      damru() { if (!on()) return; damru(ac.currentTime + 0.01); },
      // tù và shankh: tiếng kèn ốc — sóng răng cưa qua 2 cộng hưởng, rung nhẹ, hơi thở
      shankh(start) {
        if (!on()) return; const t = ac.currentTime;
        if (start) {
          if (shk) return; const f = 233; const bus = ac.createGain(); bus.gain.setValueAtTime(0.0001, t); bus.gain.exponentialRampToValueAtTime(0.32, t + 0.45); out(bus, 0.5);
          const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.9, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.5);
          const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.2; vg.gain.value = 5; vib.connect(vg); vg.connect(o.detune);
          const f1 = ac.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 820; f1.Q.value = 2.5; const f2 = ac.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1650; f2.Q.value = 4;
          const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; o.connect(lp); lp.connect(f1); lp.connect(f2); const g2 = ac.createGain(); g2.gain.value = 0.6; f2.connect(g2); f1.connect(bus); g2.connect(bus);
          const lo = ac.createGain(); lo.gain.value = 0.25; lp.connect(lo); lo.connect(bus);
          const n = noise(), hp = ac.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 2200; hp.Q.value = 0.8; const ng = ac.createGain(); ng.gain.value = 0.05; n.connect(hp); hp.connect(ng); ng.connect(bus);
          o.start(t); vib.start(t); n.start(t); shk = { o, vib, n, bus };
        } else if (shk) { const s = shk; shk = null; s.bus.gain.cancelScheduledValues(t); s.bus.gain.setValueAtTime(Math.max(0.0001, s.bus.gain.value), t); s.bus.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); s.o.frequency.exponentialRampToValueAtTime(220, t + 0.6); [s.o, s.vib, s.n].forEach(x => x.stop(t + 0.65)); }
      },
      shankhShort() { if (!on()) return; api.shankh(true); setTimeout(() => api.shankh(false), 1600); },
      tanpura(v) { tanOn = !!v; tanT = 0; },
      tick(dt) { if (!tanOn || !on() || !S.settings.ambient) return; tanT -= dt; if (tanT <= 0) { tanT = 1.15; const sa = 138.6, notes = [sa * 0.75, sa, sa, sa * 0.5]; pluck(ac.currentTime + 0.02, notes[tanI % 4], 0.05); tanI++; } },
      pour(v) { if (!on()) return; if (v && !pourN) { const n = noise(), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.7; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.12, ac.currentTime + 0.15); n.connect(bp); bp.connect(g); out(g, 0.2); const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 7; lg.gain.value = 500; lfo.connect(lg); lg.connect(bp.frequency); n.start(); lfo.start(); pourN = { n, g, lfo }; } else if (!v && pourN) { const p = pourN; pourN = null; const t = ac.currentTime; p.g.gain.cancelScheduledValues(t); p.g.gain.setValueAtTime(Math.max(0.0001, p.g.gain.value), t); p.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); p.n.stop(t + 0.3); p.lfo.stop(t + 0.3); } },
      match() { if (!on()) return; const t = ac.currentTime + 0.01, bus = ac.createGain(); bus.gain.value = 0.8; out(bus, 0.2); const n = noise(), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(2400, t); bp.frequency.exponentialRampToValueAtTime(5200, t + 0.12); bp.Q.value = 1.5; n.connect(bp); env(bp, 0.5, 0.16, t, 0.004).connect(bus); n.start(t); n.stop(t + 0.2); const n2 = noise(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; n2.connect(lp); env(lp, 0.18, 0.7, t + 0.12, 0.05).connect(bus); n2.start(t + 0.1); n2.stop(t + 0.9); },
      step() { if (!on()) return; const t = ac.currentTime + 0.005, bus = ac.createGain(); bus.gain.value = 0.3 + Math.random() * 0.1; out(bus, 0.35); const n = noise(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520 + Math.random() * 150; n.connect(lp); env(lp, 0.5, 0.08, t, 0.004).connect(bus); n.start(t); n.stop(t + 0.1); },
      bead(kind) { if (!on()) return; const t = ac.currentTime, bus = ac.createGain(); bus.gain.value = 1; out(bus, 0.25); const f = { sphatik: 4200, rudraksha: 1600, goldmala: 1900, chandan: 2400, tulsi: 2100, sandal: 2600 }[kind] || 2600; const n = noise(), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = kind === 'sphatik' ? 18 : 9; n.connect(bp); env(bp, 0.4, 0.05, t, 0.001).connect(bus); n.start(t); n.stop(t + 0.02); if (kind === 'sphatik') partial(f * 1.5, 0.05, 0.25, t, bus, 0); },
      ambient(enable) {
        if (!ac) return; if (amb) { try { amb.src.stop(); amb.lfo.stop(); } catch (e) { /* ignore */ } amb = null; } if (!enable) return;
        const b = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
        const src = ac.createBufferSource(); src.buffer = b; src.loop = true; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 480; const g = ac.createGain(); g.gain.value = 0.045; src.connect(f); f.connect(g); g.connect(master); src.start();
        const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.06; lg.gain.value = 200; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); amb = { src, lfo };
      },
      chirp() { if (!ac || !S.settings.ambient) return; const o = ac.createOscillator(); o.type = 'sine'; const t = ac.currentTime, base = 2600 + Math.random() * 1400; o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * 1.35, t + 0.07); env(o, 0.02, 0.11, t, 0.01).connect(master); o.start(); o.stop(t + 0.13); },
      cricket() { if (!ac || !S.settings.ambient) return; for (let i = 0; i < 3; i++) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 4400; const t = ac.currentTime + i * 0.07; env(o, 0.01, 0.05, t, 0.01).connect(master); o.start(t); o.stop(t + 0.06); } },
      // tiếng công kêu "mi-áo" buổi sáng
      peacock() { if (!ac || !S.settings.ambient) return; const t0 = ac.currentTime + 0.02; for (let k = 0; k < 2; k++) { const t = t0 + k * 0.42, o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(620, t); o.frequency.exponentialRampToValueAtTime(1250, t + 0.12); o.frequency.exponentialRampToValueAtTime(900, t + 0.3); const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 2; o.connect(bp); env(bp, 0.035, 0.32, t, 0.03).connect(master); o.start(t); o.stop(t + 0.35); } }
    };
    return api;
  })();
  function haptic(style) { if (S.settings.haptics) post({ type: 'haptic', style }); }

  // ---------------- loop ----------------
  const clock = new THREE.Clock();
  function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.7 ? 60 : 48; camera.updateProjectionMatrix(); if (mode === 'japa') drawMala(); }
  window.addEventListener('resize', resize); resize();
  function tickAvatar(av, dt) { const u = av.userData; if (u.bowT <= 0) return; u.bowT -= dt; const total = 1.4, p = 1 - Math.max(u.bowT, 0) / total; u.pivot.rotation.x = -Math.sin(p * Math.PI) * 0.45; if (u.bowT <= 0) u.pivot.rotation.x = 0; }
  const turnTo = (av, ang, k, dt) => { let d = ang - av.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); av.rotation.y += d * Math.min(1, k * dt); };
  let snapCam = true, ambT = 0, slowT = 0;
  function walkTo(av, x, z, y, sp, dt, t) { tmp.set(x - av.position.x, 0, z - av.position.z); const d = tmp.length(); if (d < 0.05) return true; tmp.normalize(); av.position.addScaledVector(tmp, Math.min(d, dt * sp)); turnTo(av, Math.atan2(-tmp.x, -tmp.z), 6, dt); av.userData.walkCycle(t); av.position.y = y + Math.abs(Math.sin(t * 8)) * 0.02; return false; }
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    for (const f of flames) { if (!f.sp.visible) continue; const k = (f.mult || 1) * (0.88 + 0.12 * Math.sin(t * 9 + f.seed) * Math.sin(t * 4.3 + f.seed * 2)); f.sp.scale.set(f.s * 0.6 * (0.95 + 0.05 * Math.sin(t * 11 + f.seed)), f.s * k, 1); }
    for (const k of ORDER) { const L = shrineLights[k]; L.l.intensity = L.base * (curPhase === 'day' ? 0.75 : 1) * (0.92 + 0.08 * Math.sin(t * 7 + L.seed)); }
    if (deepmala.visible) dmMat.opacity = (curPhase === 'night' || curPhase === 'dusk') ? 0.85 + 0.15 * Math.sin(t * 6) : 0.0;
    // chuông đung đưa
    for (const k of Object.keys(MT.bells)) { const b = MT.bells[k]; if (b.swing <= 0.001) continue; b.t += dt; b.swing *= Math.pow(0.35, dt); b.bell.rotation.z = Math.sin(b.t * 7) * 0.35 * b.swing; b.bell.rotation.x = Math.sin(b.t * 5.3) * 0.12 * b.swing; }
    // cờ bay
    for (const f of MT.flags) { const pos = f.geometry.attributes.position, b = f.userData.base; for (let i = 0; i < pos.count; i++) { const x = b[i * 3]; pos.setZ(i, Math.sin(x * 4 - t * 4) * 0.08 * x); } pos.needsUpdate = true; }
    if (MT.peepal) MT.peepal.userData.crown.rotation.y = Math.sin(t * 0.3) * 0.02;
    // người đi lễ
    const inside = !OUT.includes(mode);
    for (const av of hallPeople) { av.visible = inside; const u = av.userData; u.next -= dt; if (u.next <= 0 && u.bowT <= 0) { u.bowT = 1.4; u.next = 5 + Math.random() * 6; } tickAvatar(av, dt); }
    pariWalker.visible = inside && !(mode === 'parikrama' && cur === 'ganesha');
    { const u = pariWalker.userData, [x, z] = PARI_PATH[u.i]; if (walkTo(pariWalker, x, z, 0, 0.7, dt, t)) u.i = (u.i + 1) % PARI_PATH.length; }
    for (const av of yardPeople) {
      av.visible = !inside || mode === 'tour'; const u = av.userData;
      if (u.tulsi !== undefined) { u.tulsi += dt * 0.35; const a = -u.tulsi; const tx = MT.tulsiTop.x + Math.cos(a) * 1.25, tz = MT.tulsiTop.z + Math.sin(a) * 1.25; walkTo(av, tx, tz, -0.6, 2, dt, t); }
      else if (u.route) { const [x, z] = u.route[u.i]; if (walkTo(av, x, z, -0.6, 0.6, dt, t)) u.i = (u.i + 1) % u.route.length; }
      else if (u.follow) { const L = u.follow; tmp2.set(L.position.x + 0.6 * Math.cos(L.rotation.y) + 0.4 * Math.sin(L.rotation.y), 0, L.position.z - 0.6 * Math.sin(L.rotation.y) + 0.4 * Math.cos(L.rotation.y)); if (walkTo(av, tmp2.x, tmp2.z, -0.6, 0.9, dt, t * 1.2)) { turnTo(av, L.rotation.y, 3, dt); av.userData.walkCycle(0); } }
      else if (u.kundStand) { u.next = (u.next || 3) - dt; if (u.next <= 0 && u.bowT <= 0) { u.bowT = 1.4; u.next = 6; } av.position.y = -0.6; tickAvatar(av, dt); }
    }
    // giọt nước
    let anyDrop = false;
    for (let i = 0; i < DROPS; i++) { if (dropAge[i] > 2) continue; anyDrop = true; dropAge[i] += dt; dropVel[i * 3 + 1] -= 9.8 * dt * 0.6; dropPos[i * 3] += dropVel[i * 3] * dt; dropPos[i * 3 + 1] += dropVel[i * 3 + 1] * dt; dropPos[i * 3 + 2] += dropVel[i * 3 + 2] * dt; if (dropPos[i * 3 + 1] < dropFloor) { dropAge[i] = 99; dropPos[i * 3 + 1] = -100; } }
    if (anyDrop) dropGeo.attributes.position.needsUpdate = true;
    tickAarti(dt, t); tickPath(dt); tickPari(dt, t); tickAbhi(dt, t); tickTulsi(dt); tickArghya(dt); tickFlyers(dt); Audio.tick(dt);
    ambT -= dt; if (ambT <= 0) { ambT = 2.5 + Math.random() * 5; const ph = phase(); if (ph === 'night') Audio.cricket(); else if (ph === 'dawn' && Math.random() < 0.25) Audio.peacock(); else if (Math.random() < 0.6) Audio.chirp(); }

    // camera
    const s = MT.shrines[cur];
    if (mode === 'gate') { camPos.set(0, 1.3, 49.5); camTarget.set(0, 2.4, 36); }
    else if (mode === 'yard') { camPos.set(0, 4.6, 35.5); camTarget.set(0, 2.6, 14); }
    else if (mode === 'arghya') { camPos.set(0.6, 2.7, 21.4); camTarget.set(40, -3.2, 21.6); }
    else if (mode === 'tour' && tour) {
      const k = Math.min(1, (performance.now() - tour.t0) / TOUR_MS); const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      TOUR.getPointAt(e, camPos); TOUR.getPointAt(Math.min(1, e + 0.05), camTarget); camTarget.y = 1.4; if (e > 0.9) camTarget.lerp(s.look, (e - 0.9) / 0.1);
      tour.step -= dt; if (tour.step <= 0 && k < 0.97) { tour.step = 0.5; Audio.step(); }
      if (!tour.inside && camPos.z < 9.9) { tour.inside = true; applyFog(); }
      if (k >= 1) endTour();
    }
    else if (mode === 'parikrama') { /* tickPari đặt camPos/camTarget */ }
    else if (mode === 'aarti') { camPos.copy(s.cam).lerp(s.look, 0.22); camTarget.copy(s.look); }
    else if (mode === 'abhishek') { camPos.copy(s.cam).lerp(s.look, 0.2); camPos.y = 2.0; camTarget.copy(lingaTop).add(new THREE.Vector3(0, 0.15, 0)); }
    else { camPos.copy(s.cam); camTarget.copy(s.look); }
    if (SHOT && params.get('cam')) { const c = params.get('cam').split(',').map(Number); camPos.set(c[0], c[1], c[2]); camTarget.set(c[3], c[4], c[5]); }
    const k = (SHOT || snapCam || mode === 'tour') ? 1 : 1 - Math.pow(0.02, dt); snapCam = false;
    camAt.lerp(camPos, k); camLook.lerp(camTarget, k);
    camera.position.copy(camAt).add(tmp2.set(Math.sin(t * 0.17) * 0.04, Math.sin(t * 0.23) * 0.025, 0));
    const look = camLook.clone().sub(camera.position), sph = new THREE.Spherical().setFromVector3(look);
    if (mode !== 'aarti' && mode !== 'tour' && mode !== 'parikrama') { sph.theta += yaw; sph.phi = THREE.MathUtils.clamp(sph.phi - pitch, 0.6, 2.4); } else { yaw *= 0.9; pitch *= 0.9; }
    camera.lookAt(camera.position.clone().add(new THREE.Vector3().setFromSpherical(sph)));

    const tagEl = $('tag'); if (tagFor && t < tagUntil) { const p = new THREE.Vector3(); tagFor.getWorldPosition(p); p.y += 0.6; p.project(camera); tagEl.style.left = ((p.x + 1) / 2 * innerWidth) + 'px'; tagEl.style.top = ((1 - p.y) / 2 * innerHeight) + 'px'; tagEl.hidden = p.z > 1; } else tagEl.hidden = true;
    slowT -= dt; if (slowT <= 0) { slowT = 15; applyPhase(); renderTop(); }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // ---------------- boot ----------------
  renderStatic(); renderTop(); renderDarshan(); renderOfferings(); applyDecor(); applyPhase(true);
  if (SHOT) {
    if (SHOT === 'gate') setMode('gate');
    else if (SHOT === 'yard') setMode('yard');
    else if (SHOT === 'darshan') { cur = params.get('d') || 'ganesha'; S.today.offered = { [cur]: OFFER[cur].slice(0, 3) }; renderOfferings(); setMode('darshan'); renderDarshan(); }
    else if (SHOT === 'aarti') { cur = params.get('d') || 'ganesha'; startAarti(); aarti.acc = Math.PI * 2 * 3.4; aarti.ang = -0.6; }
    else if (SHOT === 'japa') { cur = params.get('d') || 'shiva'; startJapa(); }
    else if (SHOT === 'path') { cur = 'hanuman'; startPath(window.TEXTS.chalisa); reading.i = 6; renderPath(); }
    else if (SHOT === 'panchang') { setMode('darshan'); renderDarshan(); openPanchang(); }
    else if (SHOT === 'arpan') { cur = params.get('d') || 'lakshmi'; setMode('darshan'); renderDarshan(); openArpan(); }
    else if (SHOT === 'abhishek') { cur = 'shiva'; startAbhi(); abhi.hold = true; }
    else if (SHOT === 'arghya') { argh = { poured: 1, hold: true, need: 6, done: false, line: 1, lt: 0 }; setMode('arghya'); lota.visible = true; renderArghya(); }
    else if (SHOT === 'pari') { cur = 'ganesha'; startPari(); pari.t = +(params.get('t') || 0.3); }
    else { setMode('darshan'); renderDarshan(); }
  } else if (!S.onboarded) { setMode('gate'); onboarding(0); }
  else if (S.gateDay !== dayKey(new Date())) setMode('gate');
  else { setMode('darshan'); renderDarshan(); if (S.tut > 0 && S.tut < 9) showCoach(Math.min(S.tut, 3)); }
  if (!SHOT) schedule();
  post({ type: 'ready' });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) window.QP.onForeground(); });
  window.__ready = true;
  requestAnimationFrame(frame);
})();

// Kiến trúc đền kiểu Nagara (Bắc Ấn): sảnh mandapa cẩm thạch trắng, điện chính garbhagriha có tháp shikhara,
// 4 khám thờ hai bên, chuông ghanta, cổng torana, sân có tulsi, hồ kund, cột đèn deepastambha, cây bồ đề (peepal).
// Toạ độ: sảnh x ∈ [-6, 6], z ∈ [-9.6, 9.6], cửa ở z = 9.6; sân tới z = 38; cổng ở z = 38.4.
(function () {
  'use strict';
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const std = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, metalness: 0 }, o || {}));
  function put(parent, geo, mat, x, y, z, shadow) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; } parent.add(m); return m; }
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  const lathe = (pts, seg, phi) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg || 32, phi || 0);

  // ---------- textures ----------
  const marbleTex = canvasTex(512, 512, (g, w) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#EDE6DA' : '#F6F1E8'; g.fillRect(x * 64, y * 64, 64, 64); }
    g.strokeStyle = 'rgba(150,140,125,0.25)'; g.lineWidth = 1;
    for (let i = 0; i < 40; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * w; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.4) * 60; y += (Math.random() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
    g.strokeStyle = 'rgba(120,100,80,0.35)'; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, w); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
  });
  marbleTex.wrapS = marbleTex.wrapT = THREE.RepeatWrapping;
  const sandTex = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#D9B98E'; g.fillRect(0, 0, w, w);
    for (let y = 0; y < w; y += 32) for (let x = ((y / 32) % 2) * 32; x < w + 64; x += 64) { g.fillStyle = ['#DCBE94', '#D2B286', '#E0C49C'][(x + y) % 3]; g.fillRect(x + 1, y + 1, 62, 30); }
  });
  sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
  const grassTex = canvasTex(256, 256, (g, w) => { g.fillStyle = '#5E7040'; g.fillRect(0, 0, w, w); for (let i = 0; i < 2600; i++) { g.fillStyle = ['#56683A', '#6A7C48', '#70824C', '#4E6034'][i % 4]; g.fillRect(Math.random() * w, Math.random() * w, 2, 3); } });
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  // dải phù điêu chạy quanh chân tường (hoa sen, hoa văn)
  const friezeTex = canvasTex(512, 64, (g, w, h) => {
    g.fillStyle = '#E8DDCB'; g.fillRect(0, 0, w, h); g.fillStyle = '#C9A05A'; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
    for (let x = 16; x < w; x += 32) { g.fillStyle = '#D48A3A'; g.beginPath(); g.ellipse(x, h / 2, 9, 14, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#E8DDCB'; g.beginPath(); g.ellipse(x, h / 2, 4, 8, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#B85A2A'; g.fillRect(x + 14, 14, 3, h - 28); }
  });
  friezeTex.wrapS = THREE.RepeatWrapping;
  // jali: cửa sổ đá chạm lưới
  const jaliTex = canvasTex(128, 192, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff';
    for (let y = 12; y < h; y += 16) for (let x = 8 + ((y / 16) % 2) * 8; x < w; x += 16) { g.beginPath(); g.arc(x, y, 5.5, 0, Math.PI * 2); g.fill(); }
  });
  // trần: mandala đồng tâm
  const mandalaTex = canvasTex(512, 512, (g, w) => {
    g.fillStyle = '#F3EADB'; g.fillRect(0, 0, w, w); const c = w / 2;
    const rings = [['#C9A05A', 240], ['#F3EADB', 228], ['#B8462A', 210], ['#F3EADB', 200], ['#E2A13A', 170], ['#F3EADB', 158], ['#2E6A5A', 120], ['#F3EADB', 110], ['#C9A05A', 70], ['#B8462A', 40]];
    rings.forEach(([col, r]) => { g.fillStyle = col; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#F3EADB'; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; g.beginPath(); g.ellipse(c + Math.cos(a) * 185, c + Math.sin(a) * 185, 10, 22, a + Math.PI / 2, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#E2A13A'; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.beginPath(); g.ellipse(c + Math.cos(a) * 90, c + Math.sin(a) * 90, 12, 28, a + Math.PI / 2, 0, Math.PI * 2); g.fill(); }
  });
  function signTex(text, sub) {
    return canvasTex(512, 128, (g, w, h) => {
      g.fillStyle = '#7A1E14'; g.fillRect(0, 0, w, h); g.strokeStyle = '#E2B04A'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = '#F6D27A'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 54px "Kohinoor Devanagari", "Noto Serif Devanagari", serif'; g.fillText(text, w / 2, sub ? 52 : h / 2 + 4);
      if (sub) { g.font = '600 22px system-ui, sans-serif'; g.fillText(sub, w / 2, 98); }
    });
  }

  function build(scene, M, opts) {
    const R = { lamps: [], bells: {}, shrines: {}, flags: [], deepa: [], torans: [] };
    const marble = std('#FFFFFF', { map: marbleTex, roughness: 0.35, envMap: M.env, envMapIntensity: 0.35 });
    const plaster = std('#F2E8D6', { roughness: 0.9, side: THREE.DoubleSide });
    const cream = std('#EFE3CC', { roughness: 0.75 });
    const sandstone = std('#D9A878', { roughness: 0.85 });
    const saffron = std('#E8761E', { roughness: 0.7 });
    const vermil = std('#B8321F', { roughness: 0.6 });
    const gold = M.gold, brass = M.brass;
    const wood = std('#5A3420', { roughness: 0.7 });
    const silver = std('#D8D8D2', { metalness: 0.85, roughness: 0.3, envMap: M.env });

    // ================= SẢNH MANDAPA (bên trong) =================
    marbleTex.repeat.set(3, 5);
    const floor = put(scene, new THREE.PlaneGeometry(12, 19.2), marble, 0, 0, 0); floor.rotation.x = -Math.PI / 2; floor.castShadow = false; R.floor = floor;
    const runner = put(scene, new THREE.PlaneGeometry(1.5, 14.5), std('#9A1E1A', { roughness: 0.95 }), 0, 0.004, 2.1); runner.rotation.x = -Math.PI / 2; runner.castShadow = false;
    const rb = put(scene, new THREE.PlaneGeometry(1.62, 14.6), std('#D49A3A', { roughness: 0.9 }), 0, 0.002, 2.1); rb.rotation.x = -Math.PI / 2; rb.castShadow = false;
    // tường
    put(scene, new THREE.BoxGeometry(12, 6.5, 0.3), plaster, 0, 3.25, -9.6);
    put(scene, new THREE.BoxGeometry(4.6, 6.5, 0.3), plaster, -3.7, 3.25, 9.6);
    put(scene, new THREE.BoxGeometry(4.6, 6.5, 0.3), plaster, 3.7, 3.25, 9.6);
    put(scene, new THREE.BoxGeometry(2.8, 2.9, 0.3), plaster, 0, 5.05, 9.6);
    // khung cửa chính chạm khắc
    for (const x of [-1.5, 1.5]) put(scene, new THREE.BoxGeometry(0.22, 3.6, 0.4), sandstone, x, 1.8, 9.6);
    put(scene, new THREE.BoxGeometry(3.24, 0.3, 0.42), sandstone, 0, 3.66, 9.6);
    const windowMats = [];
    const fr = std('#FFFFFF', { map: friezeTex, roughness: 0.8 }); friezeTex.repeat.set(6, 1);
    for (const side of [-1, 1]) {
      const wall = put(scene, new THREE.PlaneGeometry(19.2, 6.5), plaster, side * 6, 3.25, 0); wall.rotation.y = -side * Math.PI / 2;
      const fz = put(scene, new THREE.PlaneGeometry(19.2, 0.5), fr, side * 5.98, 0.6, 0, false); fz.rotation.y = -side * Math.PI / 2;
      for (const z of [-7.6, -0.6, 8.2]) {
        const pm = new THREE.MeshBasicMaterial({ color: '#F2C890', alphaMap: jaliTex, transparent: true }); windowMats.push(pm);
        const pane = put(scene, new THREE.PlaneGeometry(1.3, 2.0), pm, side * 5.95, 3.4, z, false); pane.rotation.y = -side * Math.PI / 2;
        const back = put(scene, new THREE.PlaneGeometry(1.3, 2.0), std('#5A4030'), side * 5.97, 3.4, z, false); back.rotation.y = -side * Math.PI / 2;
        // khung vòm cửa sổ
        const arc = put(scene, new THREE.TorusGeometry(0.65, 0.07, 8, 24, Math.PI), sandstone, side * 5.92, 4.4, z, false); arc.rotation.y = -side * Math.PI / 2;
        for (const k of [-1, 1]) put(scene, new THREE.BoxGeometry(0.1, 2.0, 0.14), sandstone, side * 5.92, 3.4, z + k * 0.68, false);
      }
    }
    R.windowMats = windowMats;
    // trần + mái vòm mandala ở giữa
    const ceil = put(scene, new THREE.PlaneGeometry(12, 19.2), cream, 0, 6.3, 0); ceil.rotation.x = Math.PI / 2;
    const dome = put(scene, new THREE.CircleGeometry(2.6, 48), std('#FFFFFF', { map: mandalaTex, roughness: 0.8 }), 0, 6.29, 1.0, false); dome.rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++) { const ring = put(scene, new THREE.TorusGeometry(2.62 - i * 0.02, 0.06, 6, 48), gold, 0, 6.26 - i * 0.02, 1.0, false); ring.rotation.x = Math.PI / 2; }
    for (const z of [-8.3, -5.4, -2.3, 4.3, 7.6]) put(scene, new THREE.BoxGeometry(12, 0.22, 0.3), sandstone, 0, 6.18, z, false);
    // cột: chân vuông, thân bát giác, đầu cột tầng + dải vàng
    const columns = [];
    for (const x of [-3.4, 3.4]) for (const z of [-5.4, -1.2, 3.0, 7.0]) {
      put(scene, new THREE.BoxGeometry(0.7, 0.5, 0.7), marble, x, 0.25, z);
      put(scene, new THREE.BoxGeometry(0.56, 0.18, 0.56), sandstone, x, 0.59, z);
      columns.push(put(scene, new THREE.CylinderGeometry(0.24, 0.27, 4.6, 8), marble, x, 3.0, z));
      for (const y of [1.6, 3.0, 4.4]) put(scene, new THREE.CylinderGeometry(0.29, 0.29, 0.08, 8), gold, x, y, z, false);
      put(scene, lathe([[0.25, 0], [0.4, 0.15], [0.42, 0.3], [0.3, 0.45], [0.38, 0.6], [0.38, 0.75]], 8), marble, x, 5.3, z);
      put(scene, new THREE.BoxGeometry(0.9, 0.18, 0.9), sandstone, x, 6.12, z);
      M.blob && M.blob(scene, x, z, 0.8, 0.4);
    }
    R.columns = columns;
    // đèn diya treo bằng xích
    function hangingDiya(x, z, y) {
      put(scene, new THREE.CylinderGeometry(0.008, 0.008, 6.3 - y - 0.1, 4), brass, x, (6.3 + y + 0.1) / 2, z, false);
      const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
      put(g, lathe([[0, -0.05], [0.18, 0.0], [0.22, 0.05], [0.2, 0.07]], 20), brass, 0, 0, 0);
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; put(g, new THREE.SphereGeometry(0.035, 8, 6), brass, Math.cos(a) * 0.17, 0.07, Math.sin(a) * 0.17, false); R.lamps.push({ pos: V3(x + Math.cos(a) * 0.17, y + 0.14, z + Math.sin(a) * 0.17), s: 0.16 }); }
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const ch = put(g, new THREE.CylinderGeometry(0.005, 0.005, 0.5, 4), brass, Math.cos(a) * 0.1, 0.3, Math.sin(a) * 0.1, false); ch.rotation.z = -Math.cos(a) * 0.35; ch.rotation.x = Math.sin(a) * 0.35; }
      return g;
    }
    for (const [x, z] of [[-1.8, -3.4], [1.8, -3.4], [-1.8, 5.0], [1.8, 5.0]]) hangingDiya(x, z, 4.3);
    // đèn đứng bằng đồng (samai) – dùng cho mỗi khám thờ
    function samai(parent, x, z, h) {
      const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
      put(g, lathe([[0, 0], [0.18, 0], [0.18, 0.03], [0.06, 0.08], [0.035, 0.2], [0.03, h - 0.15], [0.05, h - 0.1], [0.04, h - 0.06], [0, h - 0.05]], 16), brass, 0, 0, 0);
      put(g, lathe([[0, 0], [0.12, 0.02], [0.16, 0.06], [0.15, 0.08]], 16), brass, 0, h - 0.05, 0);
      put(g, new THREE.ConeGeometry(0.03, 0.18, 8), brass, 0, h + 0.18, 0);
      const pts = []; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; pts.push(V3(x + Math.cos(a) * 0.13, h + 0.08, z + Math.sin(a) * 0.13)); }
      return { g, pts };
    }

    // ---------- điện chính (garbhagriha) – Ganesha ----------
    const GG = new THREE.Group(); GG.position.set(0, 0, -7.0); scene.add(GG);
    const gw = 3.6, gd = 3.0, gh = 4.4;
    put(GG, new THREE.BoxGeometry(gw, gh, 0.3), plaster, 0, gh / 2, -gd / 2);
    for (const s of [-1, 1]) put(GG, new THREE.BoxGeometry(0.3, gh, gd), plaster, s * gw / 2, gh / 2, 0);
    put(GG, new THREE.BoxGeometry(gw + 0.3, 0.3, gd + 0.3), sandstone, 0, gh, 0);
    for (const s of [-1, 1]) put(GG, new THREE.BoxGeometry((gw - 1.9) / 2, gh - 3.0, 0.3), plaster, s * (gw / 2 - (gw - 1.9) / 4), 3.0 + (gh - 3.0) / 2, gd / 2);
    for (const s of [-1, 1]) put(GG, new THREE.BoxGeometry((gw - 1.9) / 2, 3.0, 0.3), plaster, s * (gw / 2 - (gw - 1.9) / 4), 1.5, gd / 2);
    // khung cửa bạc chạm khắc + toran
    for (const s of [-1, 1]) { put(GG, new THREE.BoxGeometry(0.16, 3.0, 0.36), silver, s * 1.0, 1.5, gd / 2 + 0.02); for (let y = 0.4; y < 3; y += 0.45) put(GG, new THREE.SphereGeometry(0.05, 10, 8), gold, s * 1.0, y, gd / 2 + 0.22, false); }
    put(GG, new THREE.BoxGeometry(2.16, 0.2, 0.36), silver, 0, 3.08, gd / 2 + 0.02);
    put(GG, new THREE.BoxGeometry(0.6, 0.6, 0.06), std('#FFFFFF', { map: signTex('श्री', null), roughness: 0.5 }), 0, 3.55, gd / 2 + 0.18, false);
    put(GG, new THREE.BoxGeometry(2.0, 0.3, 0.1), sandstone, 0, 0.15, gd / 2 + 0.1);
    put(GG, new THREE.BoxGeometry(1.2, 0.5, 0.9), marble, 0, 0.25, -0.5); // bệ tượng
    put(GG, new THREE.BoxGeometry(1.4, 0.12, 1.1), gold, 0, 0.56, -0.5);
    R.torans.push({ x: 0, y: 3.0, z: -7.0 + gd / 2 + 0.3, w: 2.0 });
    R.shrines.ganesha = { pos: V3(0, 0.62, -7.5), rot: 0, cam: V3(0, 2.35, -0.9), look: V3(0, 1.75, -7.5), plate: V3(0, 0.9, -5.15), bell: V3(-1.25, 2.5, -5.2) };
    // bậc đá trước điện
    put(scene, new THREE.BoxGeometry(2.4, 0.12, 0.6), marble, 0, 0.06, -5.2);
    const s1 = samai(scene, -1.45, -5.0, 1.2), s2 = samai(scene, 1.45, -5.0, 1.2); R.lamps.push(...s1.pts.map(p => ({ pos: p, s: 0.2, big: true })), ...s2.pts.map(p => ({ pos: p, s: 0.2, big: true })));
    // bệ dâng lễ trước điện chính
    put(scene, new THREE.BoxGeometry(1.4, 0.7, 0.6), marble, 0, 0.35, -5.15);

    // ---------- 4 khám thờ hai bên ----------
    function niche(name, side, z) {
      const g = new THREE.Group(); g.position.set(side * 5.55, 0, z); g.rotation.y = -side * Math.PI / 2; scene.add(g);
      // nền + bệ
      put(g, new THREE.BoxGeometry(2.4, 0.3, 1.2), marble, 0, 0.15, 0.1);
      put(g, new THREE.BoxGeometry(1.5, 0.45, 0.8), marble, 0, 0.52, -0.05);
      put(g, new THREE.BoxGeometry(1.6, 0.06, 0.9), gold, 0, 0.77, -0.05);
      // khung khám: 2 cột + vòm + mái nhỏ
      for (const s of [-1, 1]) { put(g, new THREE.CylinderGeometry(0.08, 0.1, 2.9, 8), marble, s * 1.05, 1.75, 0.55); for (const y of [0.8, 1.9, 3.0]) put(g, new THREE.CylinderGeometry(0.11, 0.11, 0.05, 8), gold, s * 1.05, y, 0.55, false); }
      const arcG = new THREE.TorusGeometry(1.05, 0.08, 8, 32, Math.PI); put(g, arcG, sandstone, 0, 3.2, 0.55);
      put(g, new THREE.BoxGeometry(2.5, 0.2, 1.3), sandstone, 0, 4.35, 0.05);
      put(g, lathe([[0, 0], [0.9, 0], [0.75, 0.35], [0.55, 0.6], [0.3, 0.85], [0.12, 1.0], [0, 1.05]], 4, Math.PI / 4), sandstone, 0, 4.45, 0.05);
      put(g, new THREE.SphereGeometry(0.1, 10, 8), gold, 0, 5.55, 0.05);
      put(g, new THREE.PlaneGeometry(2.2, 4.2), std('#C9562A', { roughness: 0.9 }), 0, 2.4, -0.48, false); // nền khám màu son
      const wpos = new THREE.Vector3(); g.updateMatrixWorld(); const W = v => v.clone().applyMatrix4(g.matrixWorld);
      const lampA = samai(g, -0.85, 0.75, 1.0), lampB = samai(g, 0.85, 0.75, 1.0);
      g.updateMatrixWorld(true);
      [...lampA.pts, ...lampB.pts].forEach(p => { const lp = W(V3(p.x - g.position.x, p.y, p.z - g.position.z)); }); // (giữ chỗ)
      const lampsW = []; for (const lm of [lampA, lampB]) { lm.g.updateMatrixWorld(true); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; lampsW.push(V3(Math.cos(a) * 0.13, 1.08, Math.sin(a) * 0.13).applyMatrix4(lm.g.matrixWorld)); } }
      lampsW.forEach(p => R.lamps.push({ pos: p, s: 0.18, big: true }));
      R.torans.push({ x: side * 5.0, y: 3.15, z, w: 2.0, rotY: -side * Math.PI / 2 });
      const front = W(V3(0, 0, 3.4)), look = W(V3(0, 1.45, -0.1)), plate = W(V3(0, 0.82, 0.32)), bell = W(V3(-0.75, 2.45, 1.15)), pos = W(V3(0, 0.8, -0.1));
      front.y = 2.05;
      R.shrines[name] = { pos, rot: -side * Math.PI / 2, cam: front, look, plate, bell, group: g };
    }
    niche('shiva', -1, -3.4); niche('krishna', -1, 5.1); niche('lakshmi', 1, -3.4); niche('hanuman', 1, 5.1);
    // Shiva: linga đặt thấp hơn (trên bệ ngắn)
    R.shrines.shiva.pos.y = 0.8;

    // ---------- chuông ghanta ở cửa ----------
    function ghanta(x, y, z, s) {
      const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
      put(g, new THREE.CylinderGeometry(0.01, 0.01, 6.3 - y, 4), brass, 0, (6.3 - y) / 2, 0, false);
      const bell = new THREE.Group(); g.add(bell);
      put(bell, lathe([[0, 0.02], [0.05 * s, 0.0], [0.09 * s, -0.08 * s], [0.12 * s, -0.22 * s], [0.16 * s, -0.32 * s], [0.17 * s, -0.36 * s], [0.155 * s, -0.36 * s]], 28), brass, 0, 0, 0);
      const cl = put(bell, new THREE.SphereGeometry(0.03 * s, 10, 8), brass, 0, -0.33 * s, 0, false);
      put(bell, new THREE.CylinderGeometry(0.006, 0.006, 0.3 * s, 4), brass, 0, -0.18 * s, 0, false);
      put(bell, new THREE.TorusGeometry(0.03 * s, 0.01, 6, 12), brass, 0, 0.04, 0, false);
      return { g, bell, clapper: cl, swing: 0, t: 99 };
    }
    R.bells.door = ghanta(0, 3.4, 8.6, 1.4);
    for (const k of Object.keys(R.shrines)) { const p = R.shrines[k].bell; R.bells[k] = ghanta(p.x, p.y, p.z, 0.9); }

    // ================= NGOẠI THẤT =================
    const ext = std('#F4EBDC', { roughness: 0.85 });
    // tường ngoài (mặt ngoài sảnh)
    for (const s of [-1, 1]) put(scene, new THREE.BoxGeometry(0.1, 6.6, 19.8), ext, s * 6.32, 3.3, 0);
    put(scene, new THREE.BoxGeometry(12.6, 6.6, 0.1), ext, 0, 3.3, -9.82);
    for (const s of [-1, 1]) put(scene, new THREE.BoxGeometry(4.9, 6.6, 0.1), ext, s * 3.85, 3.3, 9.82);
    put(scene, new THREE.BoxGeometry(2.8, 2.95, 0.1), ext, 0, 5.12, 9.82);
    // chân nền (jagati) bậc cao
    put(scene, new THREE.BoxGeometry(13.6, 0.6, 23.2), sandstone, 0, -0.29, 1.0);
    put(scene, new THREE.BoxGeometry(13.8, 0.08, 23.4), std('#C88A58', { roughness: 0.8 }), 0, -0.02, 1.0, false);
    // hiên trước (ardha mandapa): 4 cột + mái
    for (const x of [-2.2, -1.0, 1.0, 2.2]) { put(scene, new THREE.CylinderGeometry(0.16, 0.18, 3.6, 8), cream, x, 1.8, 11.4); put(scene, new THREE.BoxGeometry(0.42, 0.25, 0.42), sandstone, x, 0.12, 11.4); put(scene, new THREE.BoxGeometry(0.46, 0.2, 0.46), sandstone, x, 3.7, 11.4); }
    put(scene, new THREE.BoxGeometry(5.6, 0.3, 2.4), sandstone, 0, 3.95, 10.8);
    put(scene, lathe([[0, 0], [3.2, 0], [2.6, 0.5], [1.8, 0.9], [0.9, 1.2], [0, 1.3]], 4, Math.PI / 4), cream, 0, 4.1, 10.8).scale.set(0.95, 1, 0.45);
    for (let i = 0; i < 4; i++) { const top = -0.15 * (i + 1), h = top + 0.62; put(scene, new THREE.BoxGeometry(5.6 + i * 0.4, h, 0.42), i % 2 ? sandstone : marble, 0, top - h / 2, 12.81 + i * 0.42); }
    const porch = put(scene, new THREE.PlaneGeometry(5.8, 2.6), marble, 0, 0.02, 11.3); porch.rotation.x = -Math.PI / 2; porch.castShadow = false;
    const sign = put(scene, new THREE.BoxGeometry(2.4, 0.6, 0.06), std('#FFFFFF', { map: signTex('मंगल मंदिर', opts.label || ''), roughness: 0.5 }), 0, 4.45, 12.05, false);
    R.torans.push({ x: 0, y: 3.35, z: 11.65, w: 4.6 });
    // mái mandapa: kim tự tháp nhiều tầng (phamsana)
    for (let i = 0; i < 6; i++) { const w = 13.2 - i * 1.7, d = 12.0 - i * 1.5; put(scene, new THREE.BoxGeometry(w, 0.5, d), i % 2 ? sandstone : ext, 0, 6.85 + i * 0.62, 2.6 - i * 0.05); put(scene, new THREE.BoxGeometry(w + 0.2, 0.08, d + 0.2), gold, 0, 7.1 + i * 0.62, 2.6 - i * 0.05, false); }
    put(scene, new THREE.SphereGeometry(0.6, 16, 10), ext, 0, 10.6, 2.3).scale.set(1, 0.5, 1);
    put(scene, lathe([[0, 0], [0.3, 0], [0.42, 0.2], [0.25, 0.45], [0.12, 0.55], [0.15, 0.7], [0, 0.8]], 20), gold, 0, 10.85, 2.3);
    // tháp shikhara trên điện chính: thân cong (lathe 8 cạnh), các gân dọc, amalaka, kalasha, cờ
    const SH = new THREE.Group(); SH.position.set(0, 6.3, -6.6); scene.add(SH); R.shikhara = SH;
    const prof = []; for (let i = 0; i <= 14; i++) { const t = i / 14; prof.push([3.4 * (1 - Math.pow(t, 1.7)) * (1 - 0.15 * t) + 0.55 * t, t * 11]); }
    const tower = put(SH, lathe(prof, 8, Math.PI / 8), ext, 0, 0, 0); tower.scale.set(1, 1, 0.92);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8; const pts = prof.slice(0, 13).map(([r, y]) => V3(Math.cos(a) * (r + 0.12), y, Math.sin(a) * (r + 0.12) * 0.92)); const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.12, 6), sandstone); t.castShadow = true; SH.add(t); }
    for (let i = 1; i < 12; i++) { const [r, y] = prof[i]; const ring = put(SH, new THREE.TorusGeometry(r + 0.05, 0.06, 6, 8), i % 3 ? sandstone : gold, 0, y, 0, false); ring.rotation.x = Math.PI / 2; ring.rotation.z = Math.PI / 8; ring.scale.set(1, 0.92, 1); }
    // shikhara phụ nhỏ (urushringa) bốn góc
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const mp = []; for (let i = 0; i <= 8; i++) { const t = i / 8; mp.push([1.1 * (1 - Math.pow(t, 1.6)) + 0.18 * t, t * 4]); } put(SH, lathe(mp, 8, Math.PI / 8), ext, sx * 2.0, 0.2, sz * 1.6); put(SH, new THREE.SphereGeometry(0.28, 12, 6), sandstone, sx * 2.0, 4.25, sz * 1.6).scale.set(1, 0.4, 1); }
    const amal = put(SH, new THREE.TorusGeometry(0.75, 0.32, 16, 32), sandstone, 0, 11.1, 0); amal.rotation.x = Math.PI / 2;
    put(SH, lathe([[0, 0], [0.35, 0], [0.5, 0.25], [0.38, 0.55], [0.16, 0.7], [0.22, 0.85], [0.1, 1.05], [0, 1.3]], 20), gold, 0, 11.35, 0);
    put(SH, new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), wood, 0.25, 12.6, 0);
    // cờ dhvaja nghệ tam giác
    function flagMesh(parent, x, y, z, w, h) {
      const geo = new THREE.PlaneGeometry(w, h, 12, 4); const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) { const px = pos.getX(i) + w / 2, py = pos.getY(i); pos.setY(i, py * (1 - px / w * 0.92)); }
      geo.translate(w / 2, 0, 0);
      const m = put(parent, geo, std('#F07A1A', { roughness: 0.8, side: THREE.DoubleSide }), x, y, z, false);
      m.userData.base = Float32Array.from(pos.array); R.flags.push(m); return m;
    }
    flagMesh(SH, 0.27, 13.35, 0, 1.6, 0.9);

    // ================= SÂN =================
    const grass = put(scene, new THREE.PlaneGeometry(60, 70), std('#FFFFFF', { map: grassTex, roughness: 0.95 }), 0, -0.6, 22); grass.rotation.x = -Math.PI / 2; grass.castShadow = false; grassTex.repeat.set(14, 16);
    const yardS = put(scene, new THREE.PlaneGeometry(28, 26), std('#FFFFFF', { map: sandTex, roughness: 0.85 }), 0, -0.58, 25.4); yardS.rotation.x = -Math.PI / 2; yardS.castShadow = false; sandTex.repeat.set(9, 8);
    const path = put(scene, new THREE.PlaneGeometry(2.6, 26), std('#FFFFFF', { map: marbleTex, roughness: 0.4 }), 0, -0.57, 25.4); path.rotation.x = -Math.PI / 2; path.castShadow = false;
    // tường bao thấp quanh sân
    const wallM = std('#E9D3B0', { roughness: 0.9 });
    for (const s of [-1, 1]) { put(scene, new THREE.BoxGeometry(0.5, 2.2, 26), wallM, s * 14.2, 0.5, 25.4); put(scene, new THREE.BoxGeometry(11.6, 2.2, 0.5), wallM, s * 8.4, 0.5, 38.6); for (let z = 13; z <= 38; z += 3.2) put(scene, new THREE.BoxGeometry(0.7, 0.3, 0.7), saffron, s * 14.2, 1.75, z, false); }
    // cổng torana
    const GT = new THREE.Group(); GT.position.set(0, -0.6, 38.6); scene.add(GT); R.gate = GT;
    for (const s of [-1, 1]) {
      put(GT, new THREE.BoxGeometry(0.9, 0.5, 0.9), sandstone, s * 1.75, 0.25, 0);
      put(GT, new THREE.CylinderGeometry(0.28, 0.32, 4.4, 8), cream, s * 1.75, 2.7, 0);
      for (const y of [1.2, 2.6, 4.0]) put(GT, new THREE.CylinderGeometry(0.34, 0.34, 0.1, 8), gold, s * 1.75, y, 0, false);
      put(GT, new THREE.BoxGeometry(0.8, 0.3, 0.8), sandstone, s * 1.75, 5.05, 0);
      put(GT, lathe([[0, 0], [0.4, 0], [0.42, 0.3], [0.25, 0.7], [0.08, 0.95], [0, 1.0]], 8), cream, s * 1.75, 5.2, 0);
      put(GT, new THREE.SphereGeometry(0.12, 10, 8), gold, s * 1.75, 6.25, 0);
    }
    // 3 xà ngang cong kiểu torana Sanchi
    for (let i = 0; i < 3; i++) { const y = 3.6 + i * 0.62, w = 4.8 + i * 0.3; const beam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-w / 2, y + 0.12, 0), V3(-w / 4, y, 0), V3(w / 4, y, 0), V3(w / 2, y + 0.12, 0)]), 20, 0.14, 8), i === 1 ? saffron : sandstone); beam.castShadow = true; GT.add(beam); for (const s of [-1, 1]) put(GT, new THREE.SphereGeometry(0.2, 10, 8), sandstone, s * (w / 2 + 0.1), y + 0.15, 0).scale.set(1, 1, 0.6); }
    put(GT, new THREE.BoxGeometry(2.4, 0.55, 0.08), std('#FFFFFF', { map: signTex('मंगल मंदिर', opts.label || ''), roughness: 0.5 }), 0, 4.5, 0.18, false);
    put(GT, new THREE.SphereGeometry(0.22, 12, 10), gold, 0, 5.45, 0);
    flagMesh(GT, 0, 5.9, 0, 0.9, 0.5); put(GT, new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), wood, 0, 5.55, 0);
    // chuông nhỏ treo dưới xà
    for (const x of [-1.2, -0.4, 0.4, 1.2]) { put(GT, new THREE.CylinderGeometry(0.005, 0.005, 0.4, 4), brass, x, 3.3, 0, false); put(GT, lathe([[0, 0], [0.05, -0.02], [0.08, -0.12], [0.085, -0.14]], 16), brass, x, 3.12, 0); }
    R.torans.push({ x: 0, y: 3.35, z: 38.75, w: 3.2 });
    // kệ để dép ngay sau cổng
    const rack = new THREE.Group(); rack.position.set(2.9, -0.6, 35.6); rack.rotation.y = -Math.PI / 2; scene.add(rack); R.rack = rack;
    put(rack, new THREE.BoxGeometry(2.0, 0.9, 0.5), wood, 0, 0.45, 0);
    for (const y of [0.3, 0.6]) put(rack, new THREE.BoxGeometry(1.95, 0.04, 0.48), std('#3A2214'), 0, y, 0.02, false);
    const shoeM = [std('#2A2A30'), std('#7A3020'), std('#3A3020'), std('#5A5A60'), std('#8A6A40')];
    for (let i = 0; i < 9; i++) { const sh = put(rack, new THREE.SphereGeometry(0.07, 10, 8), shoeM[i % 5], -0.8 + (i % 5) * 0.38, i < 5 ? 0.37 : 0.67, 0.05, false); sh.scale.set(1, 0.5, 2.0); }
    // tulsi vrindavan
    const TV = new THREE.Group(); TV.position.set(-6.2, -0.6, 21.5); scene.add(TV); R.tulsi = TV;
    put(TV, new THREE.BoxGeometry(1.4, 0.3, 1.4), sandstone, 0, 0.15, 0);
    put(TV, new THREE.BoxGeometry(1.0, 1.0, 1.0), std('#F4E6C8', { roughness: 0.8 }), 0, 0.8, 0);
    for (const s of [-1, 1]) for (const t of [-1, 1]) put(TV, new THREE.BoxGeometry(0.14, 1.02, 0.14), saffron, s * 0.5, 0.8, t * 0.5, false);
    put(TV, new THREE.BoxGeometry(0.42, 0.5, 0.05), std('#7A1E14'), 0, 0.8, 0.51, false);
    put(TV, new THREE.SphereGeometry(0.08, 10, 8), std('#FFC85A', { emissive: '#FF8A3A', emissiveIntensity: 0.6 }), 0, 0.72, 0.56, false);
    put(TV, new THREE.BoxGeometry(1.15, 0.12, 1.15), sandstone, 0, 1.36, 0);
    const tl = std('#3E6A34', { roughness: 0.85 }), tl2 = std('#5A4A6A', { roughness: 0.85 });
    for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 0.08 + (i % 5) * 0.06, h = 1.5 + (i / 26) * 0.75; put(TV, new THREE.IcosahedronGeometry(0.1 + (i % 3) * 0.03, 0), i % 4 ? tl : tl2, Math.cos(a) * r, h, Math.sin(a) * r, true); }
    put(TV, new THREE.CylinderGeometry(0.02, 0.03, 0.7, 5), wood, 0, 1.75, 0);
    R.tulsiTop = V3(-6.2, 1.2, 21.5);
    // hồ kund bậc đá
    const K = new THREE.Group(); K.position.set(7.2, -0.6, 21.5); scene.add(K); R.kund = K;
    for (let i = 0; i < 4; i++) { const w = 5.6 - i * 0.8; const fr2 = new THREE.Shape(); fr2.moveTo(-w / 2, -w / 2); fr2.lineTo(w / 2, -w / 2); fr2.lineTo(w / 2, w / 2); fr2.lineTo(-w / 2, w / 2); const hw = w / 2 - 0.4; const hl = new THREE.Path(); hl.moveTo(-hw, -hw); hl.lineTo(-hw, hw); hl.lineTo(hw, hw); hl.lineTo(hw, -hw); fr2.holes.push(hl); const st = put(K, new THREE.ExtrudeGeometry(fr2, { depth: 0.22, bevelEnabled: false }), i % 2 ? sandstone : std('#E6CFA6', { roughness: 0.85 }), 0, 0.02 - i * 0.22, 0); st.rotation.x = -Math.PI / 2; }
    const water = put(K, new THREE.PlaneGeometry(2.6, 2.6), M.water, 0, -0.6, 0, false); water.rotation.x = -Math.PI / 2; R.water = water;
    const pad = std('#3F6B4E', { roughness: 0.8, side: THREE.DoubleSide }), pk = std('#F2A0B4', { roughness: 0.6 });
    for (let i = 0; i < 7; i++) { const a = i * 2.2, r = 0.4 + (i % 3) * 0.3; const p = put(K, new THREE.CircleGeometry(0.22, 14), pad, Math.cos(a) * r, -0.58, Math.sin(a) * r, false); p.rotation.x = -Math.PI / 2; if (i % 2 === 0) put(K, new THREE.SphereGeometry(0.08, 10, 8), pk, Math.cos(a) * r, -0.5, Math.sin(a) * r, false).scale.set(1, 1.3, 1); }
    R.kundEdge = V3(7.2, -0.3, 19.0);
    // cột đèn deepastambha giữa sân
    const DS = new THREE.Group(); DS.position.set(0, -0.6, 15.6); scene.add(DS); R.deepastambha = DS;
    put(DS, new THREE.BoxGeometry(1.2, 0.5, 1.2), sandstone, 0, 0.25, 0);
    put(DS, new THREE.CylinderGeometry(0.2, 0.32, 5.0, 8), std('#7A6A5A', { roughness: 0.8 }), 0, 3.0, 0);
    for (let tier = 0; tier < 7; tier++) { const y = 1.2 + tier * 0.65, n = 8; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + tier * 0.4; const r = 0.42 - tier * 0.025; const arm = put(DS, new THREE.BoxGeometry(0.22, 0.05, 0.08), std('#6A5A4A'), Math.cos(a) * (r - 0.1), y, Math.sin(a) * (r - 0.1), false); arm.rotation.y = -a; put(DS, new THREE.CylinderGeometry(0.05, 0.035, 0.04, 8), brass, Math.cos(a) * r, y + 0.04, Math.sin(a) * r, false); R.deepa.push(V3(Math.cos(a) * r, y + 0.1 - 0.6, 15.6 + Math.sin(a) * r)); } }
    put(DS, lathe([[0, 0], [0.32, 0], [0.4, 0.15], [0.2, 0.4], [0, 0.55]], 12), brass, 0, 5.5, 0);
    // cây bồ đề (peepal) có bệ chabutra và chỉ đỏ quấn
    function peepal(x, z, s) {
      const g = new THREE.Group(); g.position.set(x, -0.6, z); g.scale.setScalar(s); scene.add(g);
      put(g, new THREE.CylinderGeometry(2.0, 2.1, 0.6, 24), sandstone, 0, 0.3, 0);
      const bark = std('#6A5A48', { roughness: 0.95 });
      put(g, new THREE.CylinderGeometry(0.45, 0.7, 4.2, 12), bark, 0, 2.6, 0);
      for (let i = 0; i < 4; i++) put(g, new THREE.TorusGeometry(0.55, 0.02, 6, 20), vermil, 0, 1.3 + i * 0.07, 0, false).rotation.x = Math.PI / 2;
      for (let i = 0; i < 5; i++) { const a = i * 1.26; const br = put(g, new THREE.CylinderGeometry(0.12, 0.22, 2.4, 8), bark, Math.cos(a) * 0.7, 4.8, Math.sin(a) * 0.7); br.rotation.z = Math.cos(a) * 0.6; br.rotation.x = -Math.sin(a) * 0.6; }
      const lm = [std('#4E7A3A', { roughness: 0.85 }), std('#5E8A44', { roughness: 0.85 }), std('#3E6A30', { roughness: 0.85 })];
      const crown = new THREE.Group(); g.add(crown);
      for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 1.0 + (i % 4) * 0.55; put(crown, new THREE.IcosahedronGeometry(1.15 + (i % 3) * 0.3, 1), lm[i % 3], Math.cos(a) * r, 5.6 + (i % 3) * 0.6, Math.sin(a) * r); }
      g.userData.crown = crown; return g;
    }
    R.peepal = peepal(-10.0, 31.0, 0.95);
    // cây xanh viền sân (ashoka dáng cao, neem tán tròn)
    function tree(x, z, s, kind) {
      const g = new THREE.Group(); g.position.set(x, -0.6, z); g.scale.setScalar(s); scene.add(g);
      const bark = std('#4A3424', { roughness: 0.95 });
      if (kind === 'ashoka') { put(g, new THREE.CylinderGeometry(0.12, 0.2, 2.0, 8), bark, 0, 1.0, 0); const lm = std('#2E5A2A', { roughness: 0.9 }); for (let i = 0; i < 6; i++) put(g, new THREE.ConeGeometry(0.9 - i * 0.12, 1.3, 10), lm, 0, 1.6 + i * 0.7, 0); }
      else { put(g, new THREE.CylinderGeometry(0.2, 0.32, 2.8, 10), bark, 0, 1.4, 0); const lm = std('#4A6A34', { roughness: 0.9 }); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; put(g, new THREE.IcosahedronGeometry(1.0 + (i % 3) * 0.2, 1), lm, Math.cos(a) * 0.9, 3.1 + (i % 2) * 0.4, Math.sin(a) * 0.9); } put(g, new THREE.IcosahedronGeometry(1.3, 1), lm, 0, 3.9, 0); }
    }
    for (const z of [14, 19, 25, 31, 36]) { tree(-12.6, z, 1.0, 'ashoka'); if (z !== 19 && z !== 25) tree(12.6, z + 1.5, 1.0, 'ashoka'); }
    tree(10.5, 32.5, 1.2, 'neem'); tree(-9.0, 12.6, 1.1, 'neem'); tree(-17, 8, 1.6, 'neem'); tree(17, 6, 1.6, 'neem'); tree(-18, -4, 1.8, 'neem'); tree(18, -6, 1.8, 'neem');
    // chậu hoa cúc vạn thọ dọc lối đi
    const pot = std('#A8502A', { roughness: 0.85 }), mar = [std('#F28C1E', { roughness: 0.9 }), std('#F6B21C', { roughness: 0.9 })];
    for (const z of [17.5, 20.5, 23.5, 26.5, 29.5, 32.5]) for (const s of [-1, 1]) { const x = s * 1.85; put(scene, lathe([[0, 0], [0.22, 0], [0.3, 0.35], [0.32, 0.4]], 14), pot, x, -0.58, z); for (let i = 0; i < 9; i++) { const a = i * 2.3, r = (i % 3) * 0.09; put(scene, new THREE.IcosahedronGeometry(0.07, 1), mar[i % 2], x + Math.cos(a) * r, -0.12 + (i % 2) * 0.06, z + Math.sin(a) * r, false); } }
    // đèn đá nhỏ (diya stand) hai bên lối
    for (const z of [19, 25, 31]) for (const s of [-1, 1]) { const x = s * 3.4; put(scene, new THREE.BoxGeometry(0.4, 0.15, 0.4), sandstone, x, -0.52, z); put(scene, new THREE.CylinderGeometry(0.06, 0.08, 0.9, 8), sandstone, x, -0.0, z); put(scene, lathe([[0, 0], [0.14, 0.02], [0.17, 0.08]], 12), brass, x, 0.45, z); R.deepa.push(V3(x, 0.6, z)); }

    // ---------- vòng hoa toran (cúc vạn thọ + lá xoài) ----------
    const leafM = std('#2E5A24', { roughness: 0.8 });
    for (const t of R.torans) {
      const g = new THREE.Group(); g.position.set(t.x, t.y, t.z); g.rotation.y = t.rotY || 0; scene.add(g);
      const pts = [V3(-t.w / 2, 0, 0), V3(-t.w / 4, -0.18, 0.02), V3(0, -0.24, 0.03), V3(t.w / 4, -0.18, 0.02), V3(t.w / 2, 0, 0)];
      M.garland(g, pts, Math.round(t.w * 22), 0.045);
      for (let i = 0; i <= Math.round(t.w * 3); i++) { const x = -t.w / 2 + 0.15 + i * (t.w - 0.3) / Math.round(t.w * 3); const l = put(g, new THREE.SphereGeometry(0.05, 6, 4), leafM, x, -0.32 + Math.abs(x / t.w) * 0.25, 0.05, false); l.scale.set(0.8, 2.6, 0.3); }
    }
    return R;
  }
  window.Mandir = { build };
})();

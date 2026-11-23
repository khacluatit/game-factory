// Cảnh quan chùa bản 1.3 (bố cục chùa Bắc Bộ): cổng tam quan gỗ có gác chuông, lối đá lan can, hồ lớn có đảo Quan Âm,
// nghi môn, sân gạch, Tam bảo mái thấp, điện Mẫu, nhà Tổ, vườn tháp, tường bao, ruộng và tre. Mọi thứ dựng bằng code.
(function () {
  'use strict';
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  function std(color, o) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, metalness: 0 }, o || {})); }
  function put(parent, geo, mat, x, y, z, shadow) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; } parent.add(m); return m; }
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

  const tileTex = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#5E2416'; g.fillRect(0, 0, w, w);
    for (let y = 0; y < w; y += 16) { g.fillStyle = (y / 16) % 2 ? '#6E2C1A' : '#642818'; g.fillRect(0, y, w, 12); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, y + 12, w, 4); for (let x = (y / 16 % 2) * 8; x < w; x += 16) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x, y, 2, 12); } }
  });
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  const stoneTex = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#A99C86'; g.fillRect(0, 0, w, w);
    for (let y = 0; y < w; y += 64) for (let x = ((y / 64) % 2) * 32; x < w + 64; x += 64) { g.fillStyle = ['#B2A68F', '#A4977F', '#ADA18A'][(x + y) % 3]; g.fillRect(x + 2, y + 2, 60, 60); }
    g.strokeStyle = 'rgba(60,50,40,0.35)'; g.lineWidth = 3; for (let y = 0; y <= w; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  });
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
  const grassTex = canvasTex(256, 256, (g, w) => { g.fillStyle = '#56603E'; g.fillRect(0, 0, w, w); for (let i = 0; i < 2600; i++) { g.fillStyle = ['#4D5838', '#5E6A44', '#626E46', '#48522F'][i % 4]; g.fillRect(Math.random() * w, Math.random() * w, 2, 3); } });
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;

  // ---------- bản 1.3: vật liệu kiểu chùa Bắc Bộ ----------
  const brickTex = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#8E4A32'; g.fillRect(0, 0, w, w);
    for (let y = 0; y < w; y += 32) for (let x = 0; x < w; x += 32) { g.fillStyle = ['#B25A3C', '#A85236', '#BA6444', '#A04E34'][((x + y * 3) / 32) % 4]; g.fillRect(x + 1.5, y + 1.5, 29, 29); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x + 1.5, y + 22, 29, 8); }
  });
  brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping;
  // ngói mũi hài sẫm
  const nbTileTex = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#3E3A36'; g.fillRect(0, 0, w, w);
    for (let y = 0; y < w; y += 16) for (let x = ((y / 16) % 2) * 8; x < w + 16; x += 16) {
      g.fillStyle = ['#4A4642', '#55504A', '#46423E'][(x + y) % 3]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14, y); g.lineTo(x + 14, y + 10); g.quadraticCurveTo(x + 7, y + 17, x, y + 10); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y + 10, 14, 2);
    }
  });
  nbTileTex.wrapS = nbTileTex.wrapT = THREE.RepeatWrapping;
  const fieldTex = canvasTex(256, 256, (g, w) => { for (let y = 0; y < w; y += 8) { g.fillStyle = ['#8AA84E', '#7E9C46', '#93B056', '#86A44A'][(y / 8) % 4]; g.fillRect(0, y, w, 8); } g.fillStyle = 'rgba(80,60,30,0.35)'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 3, w); });
  fieldTex.wrapS = fieldTex.wrapT = THREE.RepeatWrapping;

  // mái kiểu Bắc Bộ: thấp, rộng, diềm mái hạ thấp, đầu đao cong vừa phải, bờ nóc có hai đầu kìm
  function roofNB(parent, cx, cy, cz, w, d, h, over, mat, ridgeMat, rotY, curl) {
    const G = new THREE.Group(); G.position.set(cx, cy, cz); G.rotation.y = rotY || 0; parent.add(G);
    const drop = over * 0.42, c = curl == null ? 0.45 : curl;
    const sh = new THREE.Shape(); sh.moveTo(-w / 2 - over, -drop); sh.quadraticCurveTo(-w / 4, h * 0.35, 0, h); sh.quadraticCurveTo(w / 4, h * 0.35, w / 2 + over, -drop); sh.lineTo(w / 2 + over - 0.25, -drop - 0.12); sh.quadraticCurveTo(w / 4, h * 0.3 - 0.2, 0, h - 0.25); sh.quadraticCurveTo(-w / 4, h * 0.3 - 0.2, -w / 2 - over + 0.25, -drop - 0.12); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: d + over * 2, bevelEnabled: false, curveSegments: 10 });
    geo.translate(0, 0, -(d + over * 2) / 2);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.3, uv.getY(i) * 0.3);
    put(G, geo, mat, 0, 0, 0);
    put(G, new THREE.BoxGeometry(0.34, 0.36, d + over * 2 + 0.2), ridgeMat, 0, h + 0.05, 0);
    // đầu kìm hai đầu bờ nóc
    for (const sz of [-1, 1]) { const z = sz * (d / 2 + over + 0.05); const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, h + 0.1, z), V3(0, h + 0.45, z + sz * 0.18), V3(0, h + 0.6, z - sz * 0.12)]), 10, 0.14, 8), ridgeMat); t.castShadow = true; G.add(t); }
    // đầu đao 4 góc
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const p0 = V3(sx * (w / 2 + over - 0.5), -drop + 0.15, sz * (d / 2 + over - 0.1)), p1 = V3(sx * (w / 2 + over + 0.1), -drop + 0.1, sz * (d / 2 + over + 0.15)), p2 = V3(sx * (w / 2 + over + 0.35), -drop + c, sz * (d / 2 + over + 0.35));
      const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, p1, p2]), 10, 0.1, 8), ridgeMat); t.castShadow = true; G.add(t);
      put(G, new THREE.SphereGeometry(0.12, 8, 6), ridgeMat, p2.x, p2.y + 0.04, p2.z);
    }
    return G;
  }

  function lotusPedestal(parent, x, y, z, r, mat) {
    const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
    put(g, new THREE.CylinderGeometry(r, r * 1.08, r * 0.35, 28), mat, 0, r * 0.17, 0);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const p = put(g, new THREE.SphereGeometry(r * 0.22, 10, 8), mat, Math.cos(a) * r * 0.92, r * 0.42, Math.sin(a) * r * 0.92); p.scale.set(0.7, 1.2, 0.45); p.rotation.y = -a; p.rotation.z = 0.35; }
    return g;
  }

  function tree(parent, x, z, s, leaf) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
    const bark = std('#4A3424', { roughness: 0.95 });
    put(g, new THREE.CylinderGeometry(0.22, 0.38, 3.2, 10), bark, 0, 1.6, 0);
    const lm = std(leaf || '#3F5F36', { roughness: 0.9 });
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const c = put(g, new THREE.IcosahedronGeometry(1.1 + (i % 3) * 0.2, 1), lm, Math.cos(a) * 1.0, 3.4 + (i % 2) * 0.5, Math.sin(a) * 1.0); c.rotation.set(i, i * 2, 0); }
    put(g, new THREE.IcosahedronGeometry(1.4, 1), lm, 0, 4.3, 0);
    return g;
  }

  function bodhi(parent, x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const bark = std('#5A4636', { roughness: 0.95 });
    put(g, new THREE.CylinderGeometry(0.45, 0.8, 4.2, 12), bark, 0, 2.1, 0);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const r = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 0.9, 0), V3(Math.cos(a) * 0.8, 0.3, Math.sin(a) * 0.8), V3(Math.cos(a) * 1.5, 0.02, Math.sin(a) * 1.5)]), 8, 0.16, 6), bark); g.add(r); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3; const b = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 3.6, 0), V3(Math.cos(a) * 1.4, 4.8, Math.sin(a) * 1.4), V3(Math.cos(a) * 2.6, 5.6, Math.sin(a) * 2.6)]), 8, 0.14, 6), bark); g.add(b); }
    const lm = [std('#3E6A34', { roughness: 0.85 }), std('#4C7A3C', { roughness: 0.85 }), std('#35592D', { roughness: 0.85 })];
    const crown = new THREE.Group(); g.add(crown);
    for (let i = 0; i < 26; i++) { const a = i * 2.399, r = 1.0 + (i % 5) * 0.62, y = 5.2 + Math.sin(i * 1.7) * 0.9 + (i % 3) * 0.35; const c = put(crown, new THREE.IcosahedronGeometry(1.0 + (i % 4) * 0.18, 1), lm[i % 3], Math.cos(a) * r, y, Math.sin(a) * r); c.rotation.set(i, i * 0.7, 0); }
    g.userData.crown = crown;
    return g;
  }

  function stoneLantern(parent, x, z, flameTex) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const st = std('#8C8476', { roughness: 0.95 });
    put(g, new THREE.BoxGeometry(0.5, 0.18, 0.5), st, 0, 0.09, 0);
    put(g, new THREE.CylinderGeometry(0.1, 0.13, 0.8, 8), st, 0, 0.58, 0);
    put(g, new THREE.BoxGeometry(0.42, 0.08, 0.42), st, 0, 1.02, 0);
    const box = put(g, new THREE.BoxGeometry(0.34, 0.34, 0.34), std('#F6D29A', { emissive: '#FFB060', emissiveIntensity: 0.0, roughness: 0.6 }), 0, 1.23, 0, false);
    put(g, new THREE.ConeGeometry(0.36, 0.3, 4), st, 0, 1.55, 0).rotation.y = Math.PI / 4;
    put(g, new THREE.SphereGeometry(0.06, 8, 6), st, 0, 1.74, 0);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, color: '#FFC27A', blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0 })); f.position.set(0, 1.23, 0); f.scale.set(0.9, 0.9, 1); g.add(f);
    return { g, box, f };
  }

  // biển chữ Hán dọc (câu đối) / ngang
  function textTex(lines, w, h, opts) {
    return canvasTex(w, h, (c) => {
      c.fillStyle = opts.bg || '#7A2418'; c.fillRect(0, 0, w, h); c.strokeStyle = '#D9A441'; c.lineWidth = Math.max(4, w * 0.04); c.strokeRect(c.lineWidth, c.lineWidth, w - 2 * c.lineWidth, h - 2 * c.lineWidth);
      c.fillStyle = opts.fg || '#F2CE6A'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (opts.vertical) { const ch = [...lines[0]], fs = Math.min(w * 0.62, (h * 0.86) / ch.length); c.font = `bold ${fs}px "Songti TC","Songti SC","Noto Serif TC",serif`; ch.forEach((k, i) => c.fillText(k, w / 2, h * 0.07 + fs * (i + 0.5) * 1.0 + (h * 0.86 - fs * ch.length) / 2)); }
      else lines.forEach((l, i) => { c.font = l.font; c.fillText(l.t, w / 2, l.y); });
    });
  }
  // trụ biểu đá xám, đầu có lồng đèn và búp sen
  function pillar(parent, x, z, h, mats, couplet, gold) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const st = std('#9C978C', { roughness: 0.95 }), st2 = std('#8A857A', { roughness: 0.95 });
    put(g, new THREE.BoxGeometry(0.95, 0.4, 0.95), st2, 0, 0.2, 0);
    put(g, new THREE.BoxGeometry(0.66, h, 0.66), st, 0, h / 2 + 0.4, 0);
    for (const y of [1.0, h * 0.6 + 0.4, h + 0.2]) put(g, new THREE.BoxGeometry(0.76, 0.12, 0.76), st2, 0, y, 0);
    put(g, new THREE.BoxGeometry(0.82, 0.55, 0.82), st, 0, h + 0.67, 0);
    for (const s of [-1, 1]) { put(g, new THREE.BoxGeometry(0.42, 0.3, 0.05), std('#4A443C'), 0, h + 0.67, s * 0.42, false); put(g, new THREE.BoxGeometry(0.05, 0.3, 0.42), std('#4A443C'), s * 0.42, h + 0.67, 0, false); }
    put(g, new THREE.ConeGeometry(0.62, 0.32, 4), st2, 0, h + 1.1, 0).rotation.y = Math.PI / 4;
    const bud = put(g, new THREE.SphereGeometry(0.2, 14, 10), st, 0, h + 1.42, 0); bud.scale.y = 1.4;
    // phượng chầu hai bên đầu trụ (khối giản lược)
    for (const s of [-1, 1]) { const b = put(g, new THREE.SphereGeometry(0.13, 8, 6), st2, s * 0.34, h + 1.0, 0); b.scale.set(0.6, 0.9, 1.3); }
    if (couplet) { const t = textTex([couplet], 64, 400, { vertical: true, bg: '#3A3630', fg: '#E8D9B0' }); put(g, new THREE.PlaneGeometry(0.4, h * 0.6), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }), 0, 0.4 + h * 0.52, 0.335, false); }
    return g;
  }
  // lan can đá: trụ vuông + thanh ngang + tấm chạm
  function balustrade(parent, x0, z0, x1, z1, gaps) {
    const g = new THREE.Group(); parent.add(g);
    const st = std('#B3ADA2', { roughness: 0.95 }), st2 = std('#A39D92', { roughness: 0.95 });
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.2)), ang = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; put(g, new THREE.BoxGeometry(0.22, 0.95, 0.22), st, x, 0.47, z); put(g, new THREE.SphereGeometry(0.11, 8, 6), st2, x, 1.0, z); }
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, mx = x0 + (x1 - x0) * (t0 + t1) / 2, mz = z0 + (z1 - z0) * (t0 + t1) / 2;
      if (gaps && gaps.some(([gx, gz]) => Math.hypot(gx - mx, gz - mz) < L / n * 0.6)) continue;
      const seg = L / n - 0.22;
      const r = put(g, new THREE.BoxGeometry(0.12, 0.1, seg), st, mx, 0.86, mz); r.rotation.y = ang;
      const p = put(g, new THREE.BoxGeometry(0.07, 0.48, seg), st2, mx, 0.42, mz); p.rotation.y = ang;
    }
    return g;
  }
  // cổng tam quan gỗ hai tầng, lầu trên treo đại hồng chung
  function gateNB(parent, z, mats, label) {
    const g = new THREE.Group(); g.position.set(0, 0, z); parent.add(g);
    const wood = std('#5E3420', { roughness: 0.7 }), woodD = std('#3E2214', { roughness: 0.8 }), panel = std('#6E3E24', { roughness: 0.75 }), stone = std('#9C978C', { roughness: 0.95 });
    const tile = std('#ffffff', { map: nbTileTex, roughness: 0.8 }), ridge = std('#D8D2C4', { roughness: 0.85 });
    put(g, new THREE.BoxGeometry(8.4, 0.35, 3.8), stone, 0, 0.17, 0);
    put(g, new THREE.BoxGeometry(3.4, 0.18, 1.2), stone, 0, 0.09, 2.4); put(g, new THREE.BoxGeometry(3.0, 0.18, 1.0), stone, 0, 0.09, -2.4);
    const xs = [-3.5, -1.4, 1.4, 3.5];
    for (const x of xs) for (const zz of [-1.3, 1.3]) put(g, new THREE.CylinderGeometry(0.17, 0.19, 3.4, 12), wood, x, 2.05, zz);
    for (const zz of [-1.3, 1.3]) put(g, new THREE.BoxGeometry(7.4, 0.3, 0.26), woodD, 0, 3.6, zz);
    for (const x of xs) put(g, new THREE.BoxGeometry(0.26, 0.3, 2.86), woodD, x, 3.6, 0);
    // cửa bức bàn hai gian bên, gian giữa mở
    for (const s of [-1, 1]) {
      const cx = s * 2.45;
      for (let k = 0; k < 4; k++) { const px = cx - 0.78 + k * 0.52; put(g, new THREE.BoxGeometry(0.48, 2.9, 0.08), panel, px, 1.9, 1.3); put(g, new THREE.BoxGeometry(0.36, 0.7, 0.04), std('#E8C98A', { roughness: 0.8, emissive: '#3A2410', emissiveIntensity: 0.2 }), px, 2.85, 1.34, false); for (const y of [1.2, 1.9]) put(g, new THREE.BoxGeometry(0.36, 0.5, 0.04), woodD, px, y, 1.34, false); }
    }
    // hai cánh cửa giữa mở hé
    for (const s of [-1, 1]) { const d = put(g, new THREE.BoxGeometry(1.3, 3.0, 0.08), panel, s * 1.0, 1.85, 1.0); d.rotation.y = s * 1.2; }
    // diềm mái tầng dưới
    roofNB(g, 0, 3.75, 0, 3.0, 7.4, 1.0, 0.9, tile, ridge, Math.PI / 2, 0.35);
    // lầu chuông
    const up = new THREE.Group(); g.add(up);
    put(up, new THREE.BoxGeometry(5.4, 0.22, 2.6), woodD, 0, 4.25, 0);
    for (const x of [-2.4, 2.4]) for (const zz of [-1.05, 1.05]) put(up, new THREE.CylinderGeometry(0.14, 0.15, 2.4, 10), wood, x, 5.5, zz);
    for (const zz of [-1.05, 1.05]) { put(up, new THREE.BoxGeometry(5.0, 0.24, 0.22), woodD, 0, 6.6, zz); for (let k = -4; k <= 4; k++) put(up, new THREE.BoxGeometry(0.06, 0.6, 0.06), woodD, k * 0.55, 4.66, zz, false); put(up, new THREE.BoxGeometry(5.0, 0.08, 0.1), woodD, 0, 4.96, zz, false); }
    put(up, new THREE.BoxGeometry(0.22, 0.24, 2.3), woodD, 0, 6.55, 0);
    roofNB(up, 0, 6.75, 0, 2.4, 5.0, 1.3, 0.75, tile, ridge, Math.PI / 2, 0.45);
    const bell = new THREE.Group(); bell.position.set(0, 6.35, 0); up.add(bell);
    const pts = [[0, 0], [0.18, 0], [0.42, -0.12], [0.56, -0.6], [0.62, -1.3], [0.7, -1.62], [0.66, -1.7], [0, -1.7]].map(([r, y]) => new THREE.Vector2(r * 0.85, y * 0.85));
    const bronze = std('#6E5A32', { metalness: 0.75, roughness: 0.4, envMap: mats.env, envMapIntensity: 0.6 });
    put(bell, new THREE.LatheGeometry(pts, 36), bronze, 0, 0, 0);
    for (const y of [-0.4, -0.82, -1.24]) put(bell, new THREE.TorusGeometry(0.52 + (y < -1 ? 0.05 : 0) - (y > -0.5 ? 0.06 : 0), 0.022, 6, 36), bronze, 0, y, 0, false).rotation.x = Math.PI / 2;
    put(bell, new THREE.TorusGeometry(0.14, 0.045, 8, 16), bronze, 0, 0.07, 0);
    const log = new THREE.Group(); log.position.set(1.2, 6.5, 0); up.add(log);
    const logM = std('#7A5636', { roughness: 0.85 });
    put(log, new THREE.CylinderGeometry(0.11, 0.11, 1.2, 12), logM, 0, -1.15, 0).rotation.z = Math.PI / 2;
    for (const sx of [-0.4, 0.4]) put(log, new THREE.CylinderGeometry(0.012, 0.012, 1.15, 4), std('#C9B48A'), sx, -0.57, 0, false);
    // biển tên chùa ở diềm giữa, câu đối hai cột trước
    const plaqueTex = textTex([{ t: '靜 心 寺', font: 'bold 74px "Songti TC","Songti SC","Noto Serif TC",serif', y: label ? 64 : 80 }].concat(label ? [{ t: label, font: '600 30px Georgia,"New York",serif', y: 126 }] : []), 512, 160, {});
    for (const sz of [-1, 1]) { const pl = put(g, new THREE.PlaneGeometry(2.0, 0.62), new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.6 }), 0, 3.25, sz * 1.46, false); if (sz < 0) pl.rotation.y = Math.PI; }
    const cL = textTex(['佛日增輝'], 64, 400, { vertical: true }), cR = textTex(['法輪常轉'], 64, 400, { vertical: true });
    put(g, new THREE.PlaneGeometry(0.3, 2.0), new THREE.MeshStandardMaterial({ map: cR, roughness: 0.6 }), 1.4, 2.0, 1.5, false);
    put(g, new THREE.PlaneGeometry(0.3, 2.0), new THREE.MeshStandardMaterial({ map: cL, roughness: 0.6 }), -1.4, 2.0, 1.5, false);
    // băng rôn đỏ hai bên
    const banner = std('#C8302A', { roughness: 0.7 });
    for (const s of [-1, 1]) put(g, new THREE.BoxGeometry(0.5, 1.9, 0.04), banner, s * 4.25, 1.6, 1.85, false);
    return { g, bell, log, up };
  }
  // nghi môn (cổng thứ hai): một gian, mái hai tầng nhỏ
  function nghiMon(parent, z, mats) {
    const g = new THREE.Group(); g.position.set(0, 0, z); parent.add(g);
    const tile = std('#ffffff', { map: nbTileTex, roughness: 0.8 }), ridge = std('#D8D2C4', { roughness: 0.85 });
    put(g, new THREE.BoxGeometry(5.2, 0.3, 2.4), std('#9C978C', { roughness: 0.95 }), 0, 0.15, 0);
    for (const x of [-1.7, 1.7]) for (const zz of [-0.7, 0.7]) put(g, new THREE.CylinderGeometry(0.15, 0.16, 3.0, 12), mats.lacquer, x, 1.8, zz);
    for (const zz of [-0.7, 0.7]) put(g, new THREE.BoxGeometry(3.8, 0.26, 0.22), mats.darkWood, 0, 3.2, zz);
    roofNB(g, 0, 3.35, 0, 1.5, 3.6, 0.8, 0.75, tile, ridge, Math.PI / 2, 0.35);
    put(g, new THREE.BoxGeometry(2.2, 0.7, 1.0), mats.lacquer, 0, 4.25, 0);
    roofNB(g, 0, 4.55, 0, 1.0, 2.2, 0.75, 0.55, tile, ridge, Math.PI / 2, 0.4);
    const red = std('#C8402A', { emissive: '#7A1A10', emissiveIntensity: 0.4, roughness: 0.6 });
    for (const sx of [-0.7, 0.7]) { const l = put(g, new THREE.SphereGeometry(0.22, 14, 10), red, sx, 2.6, 0.75); l.scale.set(1, 1.15, 1); }
    return g;
  }
  // nhà thờ phụ (điện Mẫu, nhà Tổ): mặt trước mở, 4 cột son, mái Bắc Bộ, khám thờ bên trong
  function shrineHall(parent, x, z, w, d, mats, wallCol) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const tile = std('#ffffff', { map: nbTileTex, roughness: 0.8 }), ridge = std('#D8D2C4', { roughness: 0.85 });
    const wall = std(wallCol || '#E6DED0', { roughness: 0.95 }), inner = std('#F0E6D6', { roughness: 0.95, side: THREE.DoubleSide });
    put(g, new THREE.BoxGeometry(w + 1.2, 0.4, d + 1.6), std('#9C978C', { roughness: 0.95 }), 0, 0.2, 0.3);
    const fl = put(g, new THREE.PlaneGeometry(w, d), std('#B25A3C', { roughness: 0.85 }), 0, 0.41, 0, false); fl.rotation.x = -Math.PI / 2;
    put(g, new THREE.BoxGeometry(w, 3.6, 0.25), wall, 0, 2.2, -d / 2);
    for (const s of [-1, 1]) put(g, new THREE.BoxGeometry(0.25, 3.6, d), wall, s * w / 2, 2.2, 0);
    const back = put(g, new THREE.PlaneGeometry(w - 0.3, 3.4), inner, 0, 2.2, -d / 2 + 0.14, false);
    const xs = [-w / 2 + 0.3, -w / 6, w / 6, w / 2 - 0.3];
    for (const cx of xs) put(g, new THREE.CylinderGeometry(0.15, 0.17, 3.6, 12), mats.lacquer, cx, 2.2, d / 2);
    put(g, new THREE.BoxGeometry(w, 0.3, 0.26), mats.darkWood, 0, 4.0, d / 2);
    // cửa bức bàn mở hai bên gian giữa
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const p = put(g, new THREE.BoxGeometry(0.55, 3.0, 0.07), std('#6E3E24', { roughness: 0.75 }), s * (w / 2 - 0.62 - k * 0.6), 1.95, d / 2 - 0.1); }
    roofNB(g, 0, 4.15, 0.3, d + 0.8, w, 1.6, 1.0, tile, ridge, Math.PI / 2, 0.4);
    // bệ cao + khám thếp vàng phía sau, bàn thờ thấp phía trước
    put(g, new THREE.BoxGeometry(w * 0.66, 1.1, 0.8), std('#7A2418', { roughness: 0.5 }), 0, 0.95, -d / 2 + 0.55);
    put(g, new THREE.BoxGeometry(w * 0.68, 0.06, 0.84), mats.gold, 0, 1.52, -d / 2 + 0.55, false);
    put(g, new THREE.BoxGeometry(w * 0.72, 2.6, 0.1), std('#8A1A12', { roughness: 0.5 }), 0, 2.2, -d / 2 + 0.18);
    const kham = put(g, new THREE.BoxGeometry(w * 0.74, 0.28, 0.9), mats.gold, 0, 3.4, -d / 2 + 0.55);
    for (const s of [-1, 1]) put(g, new THREE.BoxGeometry(0.16, 2.0, 0.9), mats.gold, s * w * 0.36, 2.45, -d / 2 + 0.55);
    put(g, new THREE.BoxGeometry(w * 0.56, 0.85, 0.7), std('#6E2014', { roughness: 0.5 }), 0, 0.82, -d / 2 + 1.45);
    put(g, new THREE.BoxGeometry(w * 0.57, 0.05, 0.72), mats.gold, 0, 1.26, -d / 2 + 1.45, false);
    const lamp = new THREE.PointLight('#FFC27A', 2.2, 6, 2); lamp.position.set(0, 2.6, -d / 2 + 2.2); g.add(lamp);
    return { g, lamp, shelfZ: -d / 2 + 0.55, shelfY: 1.55, altarZ: -d / 2 + 1.45, deskTop: 1.29 };
  }
  // tháp mộ gạch nhiều tầng
  function stupa(parent, x, z, tiers, w) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const br = std('#A8523A', { roughness: 0.9 }), pl = std('#E8DCC8', { roughness: 0.9 }), rf = std('#5A2418', { roughness: 0.8 });
    let y = 0;
    put(g, new THREE.BoxGeometry(w * 1.3, 0.3, w * 1.3), std('#9C978C', { roughness: 0.95 }), 0, 0.15, 0); y = 0.3;
    for (let i = 0; i < tiers; i++) {
      const ww = w * (1 - i * 0.13), h = i === 0 ? 1.4 : 0.9;
      put(g, new THREE.BoxGeometry(ww, h, ww), br, 0, y + h / 2, 0);
      put(g, new THREE.PlaneGeometry(ww * 0.5, h * 0.62), pl, 0, y + h / 2, ww / 2 + 0.01, false);
      const r = put(g, new THREE.CylinderGeometry(ww * 0.5, ww * 0.82, 0.24, 4), rf, 0, y + h + 0.12, 0); r.rotation.y = Math.PI / 4;
      y += h + 0.26;
    }
    put(g, new THREE.CylinderGeometry(0.06, 0.16, 0.6, 8), std('#8A6A32', { metalness: 0.5, roughness: 0.4 }), 0, y + 0.3, 0);
    return g;
  }
  function cycad(parent, x, z, s) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s || 1); parent.add(g);
    put(g, new THREE.CylinderGeometry(0.55, 0.4, 0.6, 16), std('#B0502E', { roughness: 0.7 }), 0, 0.3, 0);
    put(g, new THREE.CylinderGeometry(0.16, 0.2, 0.7, 10), std('#4A3A26', { roughness: 0.95 }), 0, 0.95, 0);
    const lf = std('#3E7A3A', { roughness: 0.8 });
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 1.25, 0), V3(Math.cos(a) * 0.5, 1.7, Math.sin(a) * 0.5), V3(Math.cos(a) * 1.0, 1.35, Math.sin(a) * 1.0)]), 8, 0.06, 5), lf); t.scale.y = 1; g.add(t); }
    return g;
  }
  function wallRun(parent, x0, z0, x1, z1, h, wall, cap) {
    const L = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    const w = put(parent, new THREE.BoxGeometry(0.4, h, L), wall, mx, h / 2, mz); w.rotation.y = ang;
    const c = put(parent, new THREE.BoxGeometry(0.75, 0.2, L + 0.3), cap, mx, h + 0.1, mz); c.rotation.y = ang;
    return w;
  }
  // ---------- tiểu cảnh ----------
  function bonsaiPot(parent, x, z, s, pot) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
    const potM = std(pot || '#3E5C7A', { roughness: 0.3, metalness: 0.1 }), rimM = std('#E8E2D6', { roughness: 0.4 });
    put(g, new THREE.CylinderGeometry(0.42, 0.3, 0.5, 20), potM, 0, 0.25, 0); put(g, new THREE.TorusGeometry(0.42, 0.035, 8, 24), rimM, 0, 0.5, 0).rotation.x = Math.PI / 2;
    put(g, new THREE.CylinderGeometry(0.4, 0.4, 0.04, 20), std('#4A3424'), 0, 0.49, 0, false);
    const bark = std('#5A4030', { roughness: 0.95 }), leaf = std('#3E6A34', { roughness: 0.85 });
    const trunk = [V3(0, 0.5, 0), V3(0.12, 0.85, 0.02), V3(-0.1, 1.15, 0), V3(0.08, 1.45, 0.02)];
    g.add(Object.assign(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trunk), 16, 0.06, 8), bark), { castShadow: true }));
    for (const [px, py, pz, r] of [[0.32, 0.95, 0.05, 0.28], [-0.32, 1.22, 0, 0.3], [0.12, 1.55, 0.02, 0.34], [0.38, 1.35, -0.05, 0.22]]) { const pad = put(g, new THREE.SphereGeometry(r, 14, 8), leaf, px, py, pz); pad.scale.set(1.25, 0.42, 1.0); }
    return g;
  }
  function lotusJar(parent, x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const jar = std('#7A4A2A', { roughness: 0.5 });
    put(g, new THREE.LatheGeometry([[0, 0], [0.42, 0], [0.62, 0.3], [0.66, 0.55], [0.56, 0.78], [0.5, 0.82], [0.48, 0.78]].map(([a, b]) => new THREE.Vector2(a, b)), 24), jar, 0, 0, 0);
    const w = put(g, new THREE.CircleGeometry(0.48, 24), std('#2E4A3E', { roughness: 0.2, metalness: 0.2 }), 0, 0.74, 0, false); w.rotation.x = -Math.PI / 2;
    const pad = std('#3F6B4E', { roughness: 0.8, side: THREE.DoubleSide }), pet = std('#E89AAE', { roughness: 0.6 });
    for (let i = 0; i < 4; i++) { const a = i * 1.7; const p = put(g, new THREE.CircleGeometry(0.16, 12), pad, Math.cos(a) * 0.25, 0.75, Math.sin(a) * 0.25, false); p.rotation.x = -Math.PI / 2; }
    const stem = put(g, new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), std('#4E7A3C'), 0.05, 1.0, 0, false);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const pt = put(g, new THREE.SphereGeometry(0.07, 8, 6), pet, 0.05 + Math.cos(a) * 0.05, 1.28, Math.sin(a) * 0.05, false); pt.scale.set(0.6, 1.4, 0.4); pt.rotation.y = -a; pt.rotation.z = 0.4; }
    return g;
  }
  function flowerBed(parent, x, z, w, d) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    put(g, new THREE.BoxGeometry(w, 0.3, d), std('#8C8476', { roughness: 0.95 }), 0, 0.15, 0);
    put(g, new THREE.BoxGeometry(w - 0.16, 0.12, d - 0.16), std('#4A3A2A'), 0, 0.31, 0, false);
    const hedge = std('#3F6A34', { roughness: 0.9 });
    const cols = ['#E8A23A', '#D9534A', '#F2D06A', '#E89AAE', '#F4F0E6'];
    const n = Math.max(3, Math.round(w * d * 3));
    for (let i = 0; i < n; i++) { const px = (Math.random() - 0.5) * (w - 0.4), pz = (Math.random() - 0.5) * (d - 0.4); const b = put(g, new THREE.IcosahedronGeometry(0.2 + Math.random() * 0.08, 0), hedge, px, 0.48, pz, false); b.scale.y = 0.8;
      put(g, new THREE.SphereGeometry(0.05, 6, 5), std(cols[i % cols.length], { roughness: 0.6 }), px + 0.08, 0.66, pz + 0.05, false); }
    return g;
  }
  function bamboo(parent, x, z, n) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const stalk = std('#6E8A3A', { roughness: 0.6 }), leaf = std('#5E8A44', { roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < n; i++) { const px = (Math.random() - 0.5) * 1.6, pz = (Math.random() - 0.5) * 1.6, h = 4 + Math.random() * 2.5, lean = (Math.random() - 0.5) * 0.15;
      const c = put(g, new THREE.CylinderGeometry(0.05, 0.06, h, 6), stalk, px, h / 2, pz); c.rotation.z = lean;
      for (let k = 0; k < 6; k++) { const y = h * (0.45 + k * 0.09); const l = put(g, new THREE.PlaneGeometry(0.5, 0.09), leaf, px + Math.sin(lean) * -y + Math.cos(k * 2.3) * 0.2, y, pz + Math.sin(k * 2.3) * 0.2, false); l.rotation.set(0.3, k * 2.3, 0.4); } }
    return g;
  }
  function flag(parent, x, z, h) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    put(g, new THREE.CylinderGeometry(0.05, 0.07, h, 8), std('#C9B48A', { metalness: 0.3, roughness: 0.4 }), 0, h / 2, 0);
    put(g, new THREE.SphereGeometry(0.09, 10, 8), std('#E2B556', { metalness: 0.6, roughness: 0.3 }), 0, h + 0.05, 0);
    const tex = canvasTex(300, 200, (c, w, hh) => { const cols = ['#2D5DB0', '#F2C230', '#C8302A', '#F6F4EE', '#E8862A']; for (let i = 0; i < 5; i++) { c.fillStyle = cols[i]; c.fillRect(i * w / 6, 0, w / 6, hh * 0.75); } for (let i = 0; i < 5; i++) { c.fillStyle = cols[i]; c.fillRect(w * 5 / 6, i * hh * 0.15, w / 6, hh * 0.15); c.fillRect(i * w / 6, hh * 0.75, w / 6, hh * 0.25); } c.fillStyle = cols[0]; c.fillRect(w * 5 / 6, hh * 0.75, w / 6, hh * 0.25); });
    const geo = new THREE.PlaneGeometry(1.5, 1.0, 12, 4); geo.translate(0.75, 0, 0);
    const cloth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8 })); cloth.position.set(0.05, h - 0.6, 0); g.add(cloth);
    g.userData.cloth = cloth; g.userData.base = geo.attributes.position.array.slice();
    return g;
  }
  function bigUrn(parent, x, z, mats) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const br = std('#5E4A2A', { metalness: 0.7, roughness: 0.4, envMap: mats.env, envMapIntensity: 0.6 });
    put(g, new THREE.BoxGeometry(1.4, 0.4, 1.4), std('#8C8476', { roughness: 0.95 }), 0, 0.2, 0);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; const l = put(g, new THREE.CylinderGeometry(0.06, 0.09, 0.5, 8), br, Math.cos(a) * 0.38, 0.62, Math.sin(a) * 0.38); }
    put(g, new THREE.LatheGeometry([[0, 0], [0.5, 0], [0.64, 0.2], [0.62, 0.5], [0.55, 0.6], [0.58, 0.66]].map(([a, b]) => new THREE.Vector2(a, b)), 28), br, 0, 0.82, 0);
    for (const sx of [-1, 1]) put(g, new THREE.TorusGeometry(0.14, 0.035, 8, 16), br, sx * 0.62, 1.45, 0).rotation.y = Math.PI / 2;
    const roofG = new THREE.Group(); roofG.position.y = 1.9; g.add(roofG);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(roofG, new THREE.CylinderGeometry(0.035, 0.035, 0.7, 6), br, sx * 0.4, -0.1, sz * 0.4);
    put(roofG, new THREE.ConeGeometry(0.75, 0.5, 4), br, 0, 0.45, 0).rotation.y = Math.PI / 4;
    put(roofG, new THREE.SphereGeometry(0.1, 10, 8), br, 0, 0.78, 0);
    put(g, new THREE.CylinderGeometry(0.5, 0.5, 0.04, 24), std('#9A8E7A'), 0, 1.46, 0, false);
    return g;
  }
  // ---------- bố cục 1.3: trục chính cổng (z 38.4) → lối đá → nghi môn (z 19.6) → sân gạch → Tam bảo (gốc toạ độ) ----------
  const POND = { x: -9.5, z: 28, w: 9, d: 13, island: 1.9 };
  function build(scene, mats, opts) {
    const R = new THREE.Group(); scene.add(R);
    const tile = std('#ffffff', { map: nbTileTex, roughness: 0.8 }), ridge = std('#D8D2C4', { roughness: 0.85 });
    const M = Object.assign({ tile, ridge }, mats);
    const flat = (geo, mat, x, y, z, rx) => { const m = put(R, geo, mat, x, y, z, false); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m; };
    // nền: cỏ trong tường, ruộng lúa bên trái, đường làng trước cổng
    const gt = grassTex.clone(); gt.needsUpdate = true; gt.repeat.set(14, 16);
    flat(new THREE.PlaneGeometry(90, 110), std('#ffffff', { map: gt, roughness: 1 }), 0, -0.03, 12);
    const ft = fieldTex.clone(); ft.needsUpdate = true; ft.repeat.set(4, 10);
    flat(new THREE.PlaneGeometry(40, 90), std('#ffffff', { map: ft, roughness: 1 }), -40, -0.02, 12);
    const rt = stoneTex.clone(); rt.needsUpdate = true; rt.repeat.set(16, 1.2);
    flat(new THREE.PlaneGeometry(100, 5), std('#C8BCA4', { map: rt, roughness: 1 }), 0, -0.01, 41.8);
    // sân gạch đỏ trước Tam bảo
    const bt = brickTex.clone(); bt.needsUpdate = true; bt.repeat.set(10, 5);
    flat(new THREE.PlaneGeometry(22, 9.6), std('#ffffff', { map: bt, roughness: 0.9 }), 0, -0.012, 14.8);
    // lối đá thẳng trục
    const pt = stoneTex.clone(); pt.needsUpdate = true; pt.repeat.set(1.2, 6);
    flat(new THREE.PlaneGeometry(3.2, 19), std('#ffffff', { map: pt, roughness: 0.9, color: '#D8D0C0' }), 0, 0.004, 29.2);
    balustrade(R, -1.75, 20.8, -1.75, 36.6, [[-1.75, 28]]); balustrade(R, 1.75, 20.8, 1.75, 36.6);
    const step = put(R, new THREE.BoxGeometry(6, 0.3, 1.4), std('#8C8476', { roughness: 0.95 }), 0, 0.15, 10.4);

    // ---- Tam bảo: hiên cột son, mái thấp rộng ngói mũi hài ----
    for (const x of [-5.2, -1.8, 1.8, 5.2]) { put(R, new THREE.CylinderGeometry(0.24, 0.26, 5.6, 16), M.lacquer, x, 2.8, 10.9); put(R, new THREE.CylinderGeometry(0.38, 0.4, 0.22, 16), std('#7C746A', { roughness: 0.9 }), x, 0.11, 10.9); }
    put(R, new THREE.BoxGeometry(12.6, 0.36, 0.45), M.darkWood, 0, 5.6, 10.9);
    const plaster = std('#E8E0D2', { roughness: 0.95 });
    for (const s of [-1, 1]) { put(R, new THREE.BoxGeometry(0.2, 6.2, 19.6), plaster, s * 6.2, 3.1, 0); }
    put(R, new THREE.BoxGeometry(12.6, 6.2, 0.2), plaster, 0, 3.1, -9.85);
    // cửa bức bàn mặt tiền
    const panel = std('#6E3E24', { roughness: 0.75 });
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { const px = s * (1.75 + k * 0.7); put(R, new THREE.BoxGeometry(0.64, 4.4, 0.08), panel, px, 2.2, 9.85); put(R, new THREE.BoxGeometry(0.5, 1.0, 0.04), std('#E8C98A', { roughness: 0.8, emissive: '#3A2410', emissiveIntensity: 0.25 }), px, 3.5, 9.9, false); }
    roofNB(R, 0, 6.05, 0.4, 22.2, 13.2, 2.4, 1.5, tile, ridge, 0, 0.45);
    // bờ nóc có chữ
    const rt2 = textTex([{ t: '靜 心 寺', font: 'bold 60px "Songti TC","Noto Serif TC",serif', y: 64 }], 320, 128, { bg: '#E8E0D2', fg: '#7A2418' });
    const rp = put(R, new THREE.PlaneGeometry(1.8, 0.72), new THREE.MeshStandardMaterial({ map: rt2, roughness: 0.7 }), 0, 9.0, 0.4, false); rp.rotation.y = Math.PI / 2;
    // biển "Đại Hùng Bảo Điện" trên cửa
    const ht = canvasTex(512, 128, (c, w, h) => { c.fillStyle = '#5A1C12'; c.fillRect(0, 0, w, h); c.strokeStyle = '#D9A441'; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#F2CE6A'; c.font = 'bold 70px "Songti TC", "Noto Serif TC", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('大 雄 寶 殿', w / 2, h / 2 + 4); });
    put(R, new THREE.PlaneGeometry(3.0, 0.75), new THREE.MeshStandardMaterial({ map: ht, roughness: 0.6 }), 0, 5.0, 9.97, false);
    // đèn lồng đỏ hiên
    const redL = std('#C8402A', { emissive: '#7A1A10', emissiveIntensity: 0.45, roughness: 0.6 });
    for (const x of [-3.5, 3.5]) { const l = put(R, new THREE.SphereGeometry(0.34, 16, 12), redL, x, 4.6, 10.9, false); l.scale.set(1, 1.15, 1); put(R, new THREE.CylinderGeometry(0.01, 0.01, 0.6, 4), M.darkWood, x, 5.2, 10.9, false); }
    // ---- sân: đỉnh đồng, đèn đá, trụ biểu, bồn cây tròn, hồ nhỏ bên phải ----
    const urn = bigUrn(R, 0, 14.6, M);
    pillar(R, -7.6, 11.4, 5.2, M, '佛日增輝'); pillar(R, 7.6, 11.4, 5.2, M, '法輪常轉');
    for (const sx of [-1, 1]) {
      const pl = put(R, new THREE.CylinderGeometry(1.5, 1.55, 0.4, 32), std('#B8B2A6', { roughness: 0.95 }), sx * 5.4, 0.2, 16.8);
      const hedge = put(R, new THREE.CylinderGeometry(1.35, 1.35, 0.35, 24), std('#4E7A3E', { roughness: 0.9 }), sx * 5.4, 0.55, 16.8, false);
      bonsaiPot(R, sx * 5.4, 16.8, 1.2, '#7A3A2A');
      for (const z of [12.4, 18.6]) bonsaiPot(R, sx * 2.9, z, 0.85, sx < 0 ? '#3E5C7A' : '#B0502E');
    }
    const sp = put(R, new THREE.BoxGeometry(4.0, 0.35, 2.8), std('#B3ADA2', { roughness: 0.95 }), 8.6, 0.17, 15.2);
    const smallWater = put(R, new THREE.PlaneGeometry(3.5, 2.3), std('#3A5A5C', { roughness: 0.15, metalness: 0.3 }), 8.6, 0.36, 15.2, false); smallWater.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 5; i++) { const p = put(R, new THREE.CircleGeometry(0.22, 12), std('#3F6B4E', { roughness: 0.8, side: THREE.DoubleSide }), 7.4 + i * 0.6, 0.38, 14.6 + (i % 2) * 1.0, false); p.rotation.x = -Math.PI / 2; }
    for (const z of [13.6, 16.8]) { const palm = new THREE.Group(); palm.position.set(11.2, 0, z); R.add(palm); put(palm, new THREE.CylinderGeometry(0.1, 0.14, 5.5, 8), std('#8A7A5E'), 0, 2.75, 0); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 5.5, 0), V3(Math.cos(a) * 0.9, 5.9, Math.sin(a) * 0.9), V3(Math.cos(a) * 1.7, 5.2, Math.sin(a) * 1.7)]), 8, 0.07, 5), std('#4E7A3E', { roughness: 0.8 })); palm.add(t); } }
    // ---- nghi môn + trụ biểu ----
    nghiMon(R, 19.6, M);
    pillar(R, -3.3, 19.6, 4.4, M); pillar(R, 3.3, 19.6, 4.4, M);
    // ---- hồ lớn bên trái: bờ gạch, đảo bát giác thờ Quan Âm, cầu đá ra lối đi ----
    const rim = brickTex.clone(); rim.needsUpdate = true; rim.repeat.set(6, 8);
    flat(new THREE.PlaneGeometry(POND.w + 2.6, POND.d + 2.6), std('#ffffff', { map: rim, roughness: 0.9 }), POND.x, 0.01, POND.z);
    const isl = new THREE.Group(); isl.position.set(POND.x, 0, POND.z); R.add(isl);
    const oct = put(isl, new THREE.CylinderGeometry(POND.island, POND.island + 0.1, 0.4, 8), std('#C9C3B6', { roughness: 0.9 }), 0, 0.2, 0); oct.rotation.y = Math.PI / 8;
    for (let k = 0; k < 8; k++) { const a0 = k / 8 * Math.PI * 2, a1 = (k + 1) / 8 * Math.PI * 2, r = POND.island - 0.1; if (k === 0) continue; const x0 = Math.cos(a0) * r, z0 = Math.sin(a0) * r, x1 = Math.cos(a1) * r, z1 = Math.sin(a1) * r; const bg = balustrade(isl, x0, z0, x1, z1); bg.position.y = 0.4; }
    // cầu đá
    put(R, new THREE.BoxGeometry(-1.6 - (POND.x + POND.island), 0.3, 1.3), std('#B9B2A4', { roughness: 0.9 }), ((POND.x + POND.island) + -1.6) / 2, 0.2, POND.z);
    for (const s of [-1, 1]) balustrade(R, POND.x + POND.island + 0.2, POND.z + s * 0.62, -1.9, POND.z + s * 0.62).position.y = 0.2;
    const qa = window.Figures.makeQuanAm(mats.porcelain, mats.gold, mats.glowTex); const qaG = new THREE.Group(); qaG.position.set(POND.x, 0.4, POND.z); qaG.rotation.y = Math.PI / 2; R.add(qaG);
    put(qaG, new THREE.BoxGeometry(1.4, 0.7, 1.4), std('#D6D0C4', { roughness: 0.9 }), 0, 0.35, 0);
    qa.scale.setScalar(1.25); qa.position.y = 0.7; qaG.add(qa);
    put(qaG, new THREE.BoxGeometry(1.0, 0.75, 0.6), std('#E8E2D6', { roughness: 0.85 }), 0, 0.37, 1.25);
    put(qaG, new THREE.CylinderGeometry(0.22, 0.18, 0.28, 16), std('#6E5A32', { metalness: 0.6, roughness: 0.45 }), 0, 0.88, 1.25);
    // ---- vườn hai bên lối đi ----
    for (const sx of [-1, 1]) for (const z of [23.5, 32.5]) if (!(sx < 0)) flowerBed(R, sx * 3.6, z, 1.6, 5.5);
    for (const z of [22.4, 25.8, 30.4, 34.0]) { bonsaiPot(R, -2.6, z, 0.8, '#3E5C7A'); }
    const lanterns = [];
    for (const z of [23.2, 27.6, 32.4]) lanterns.push(stoneLantern(R, 2.6, z, mats.flameTex));
    for (const sx of [-1, 1]) lanterns.push(stoneLantern(R, sx * 2.6, 12.6, mats.flameTex));
    for (const [x, z] of [[-5.2, 22.0], [-5.2, 34.2], [-13.8, 22.0], [-13.8, 34.2]]) lanterns.push(stoneLantern(R, x, z, mats.flameTex));
    const bo = bodhi(R, 9.6, 30.5);
    for (const [x, z, s] of [[6.2, 24.5, 0.9], [13.5, 25, 1.0], [7.0, 35.5, 0.85], [14.5, 34.5, 1.1]]) tree(R, x, z, s, '#4A6A3C');
    // ---- cổng tam quan gỗ, gác chuông ở lầu trên ----
    const gt2 = gateNB(R, 38.4, M, opts.label);
    pillar(R, -5.4, 39.4, 5.0, M); pillar(R, 5.4, 39.4, 5.0, M);
    const flags = [flag(R, 7.4, 40.6, 7.5)];
    // ---- tường bao vôi trắng gờ ngói đỏ ----
    const wallM = std('#EDE7DC', { roughness: 0.95 }), capM = std('#A8442C', { roughness: 0.8 });
    wallRun(R, -19, -19, -19, 38.4, 1.9, wallM, capM); wallRun(R, 19, -19, 19, 38.4, 1.9, wallM, capM); wallRun(R, -19, -19, 19, -19, 1.9, wallM, capM);
    wallRun(R, -19, 38.4, -4.3, 38.4, 1.9, wallM, capM); wallRun(R, 4.3, 38.4, 19, 38.4, 1.9, wallM, capM);
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) put(R, new THREE.BoxGeometry(0.7, 0.4, 0.06), capM, sx * (7 + k * 3), 1.2, 38.62, false);
    // ---- điện Mẫu (trái) & nhà Tổ (phải) sau Tam bảo, vườn tháp phía sau bên phải ----
    const mau = shrineHall(R, -12.5, -1.5, 7.0, 5.0, M, '#E6DED0');
    const to = shrineHall(R, 12.5, -1.5, 7.0, 5.0, M, '#E6DED0');
    const thap = new THREE.Group(); thap.position.set(12.0, 0, -12.6); R.add(thap);
    const tb = brickTex.clone(); tb.needsUpdate = true; tb.repeat.set(4, 3);
    const tf = put(thap, new THREE.PlaneGeometry(10, 7), std('#ffffff', { map: tb, roughness: 0.9 }), 0, 0.012, 0, false); tf.rotation.x = -Math.PI / 2; tf.receiveShadow = true;
    stupa(thap, 0, -1.6, 5, 1.6); stupa(thap, -3.2, -1.2, 3, 1.2); stupa(thap, 3.2, -1.2, 3, 1.2);
    put(thap, new THREE.BoxGeometry(2.2, 0.95, 1.0), std('#E6E0D4', { roughness: 0.9 }), 0, 0.47, 0.6);
    put(thap, new THREE.CylinderGeometry(0.2, 0.16, 0.26, 14), std('#EDEFF4', { roughness: 0.3 }), 0, 1.08, 0.6);
    for (const sx of [-1, 1]) cycad(thap, sx * 2.0, 1.8, 0.9);
    const bulbs = []; { const bm = new THREE.MeshBasicMaterial({ color: '#FFE2A0' }); for (const side of [-1, 1]) for (let k = 0; k <= 10; k++) { const t = k / 10, x = side * 4.6 * (1 - t) , y = 4.2 - Math.sin(t * Math.PI) * 0.7 + t * 2.0, z = -1.6 + side * 0.01; const b = put(thap, new THREE.SphereGeometry(0.06, 6, 5), bm, x, y, z, false); bulbs.push(b); } }
    // ---- cây đa, tre, bên ngoài ----
    const trees = [[-16.5, 36, 1.3], [16.5, 36.5, 1.2], [-16.5, 8, 1.3], [16.5, 8, 1.3], [-6.5, -13.5, 1.1], [4.5, -15, 1.2], [-16.5, -14, 1.3], [-24, 20, 1.4], [26, 10, 1.4], [-12, 46, 1.2], [12, 47, 1.3]];
    trees.forEach(([x, z, s], i) => tree(R, x, z, s, i % 2 ? '#3F5F36' : '#4A6A3C'));
    for (const z of [-8, 4, 16, 28, 40]) bamboo(R, 22.5, z, 9);
    for (const z of [-4, 12, 30]) bamboo(R, 17.2, z, 6);
    bamboo(R, -17, 18, 6);

    // ---- Tết: cây nêu, câu đối Tết đỏ ở cổng, cây lộc trong sân ----
    const tet = new THREE.Group(); R.add(tet);
    { const neu = new THREE.Group(); neu.position.set(3.3, 0, 35.6); tet.add(neu);
      put(neu, new THREE.CylinderGeometry(0.06, 0.09, 8.5, 8), std('#9AAA5A', { roughness: 0.6 }), 0, 4.25, 0);
      for (let k = 0; k < 6; k++) { const l = put(neu, new THREE.PlaneGeometry(0.9, 0.14), std('#6E8A3A', { side: THREE.DoubleSide }), 0.3, 8.0 + k * 0.08, 0, false); l.rotation.set(0.4, k * 1.1, -0.5); }
      const cloth = put(neu, new THREE.PlaneGeometry(0.28, 2.4), std('#D8342A', { side: THREE.DoubleSide, roughness: 0.8 }), 0.16, 6.6, 0, false);
      put(neu, new THREE.TorusGeometry(0.28, 0.02, 6, 20), std('#D9A441', { metalness: 0.6, roughness: 0.4 }), 0, 7.9, 0, false);
      for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2; put(neu, new THREE.ConeGeometry(0.05, 0.12, 8), std('#D9A441', { metalness: 0.6, roughness: 0.4 }), Math.cos(a) * 0.28, 7.72, Math.sin(a) * 0.28, false); }
      neu.userData.cloth = cloth; tet.userData.neu = neu; }
    const tetR = textTex(['天增歲月人增壽'], 64, 520, { vertical: true, bg: '#C8241A', fg: '#F2D27A' }), tetL = textTex(['春滿乾坤福滿門'], 64, 520, { vertical: true, bg: '#C8241A', fg: '#F2D27A' });
    put(tet, new THREE.PlaneGeometry(0.42, 2.7), new THREE.MeshStandardMaterial({ map: tetR, roughness: 0.7 }), 3.95, 1.95, 40.3, false);
    put(tet, new THREE.PlaneGeometry(0.42, 2.7), new THREE.MeshStandardMaterial({ map: tetL, roughness: 0.7 }), -3.95, 1.95, 40.3, false);
    const tetLan = []; for (const x of [-2.4, -0.8, 0.8, 2.4]) { const l = put(tet, new THREE.SphereGeometry(0.24, 14, 10), redL, x, 3.15, 39.9, false); l.scale.set(1, 1.15, 1); tetLan.push(l); }
    const loc = new THREE.Group(); loc.position.set(-5.4, 0, 16.8); tet.add(loc);
    { const bark = std('#5A4030', { roughness: 0.95 }); put(loc, new THREE.CylinderGeometry(0.1, 0.16, 1.6, 8), bark, 0, 1.4, 0);
      const pink = std('#F2A7B8', { roughness: 0.7 }), yel = std('#F2C94C', { roughness: 0.7 }), tag = std('#D8342A', { roughness: 0.7, side: THREE.DoubleSide });
      for (let i = 0; i < 70; i++) { const a = i * 2.39996, r = 0.2 + (i % 9) * 0.1, y = 2.0 + ((i * 37) % 11) / 11 * 1.1; put(loc, new THREE.SphereGeometry(0.07, 6, 5), i % 3 ? pink : yel, Math.cos(a) * r, y, Math.sin(a) * r, false); }
      for (let i = 0; i < 14; i++) { const a = i * 1.37, r = 0.5 + (i % 3) * 0.12; const t = put(loc, new THREE.PlaneGeometry(0.1, 0.22), tag, Math.cos(a) * r, 2.0 + (i % 4) * 0.22, Math.sin(a) * r, false); t.rotation.y = -a; } }
    tet.userData.loc = loc; tet.visible = false;

    return { root: R, bell: gt2.bell, bellLog: gt2.log, bellTower: gt2.up, bellPos: V3(0, 5.6, 38.4), bodhi: bo, quanAm: qaG, lanterns, gate: gt2.g, step, flags, pond: POND, mau, to, thap, bulbs, tet, loc, urn };
  }

  window.Temple = { build, POND };
})();

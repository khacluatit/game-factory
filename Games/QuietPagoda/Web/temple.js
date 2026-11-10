// Cảnh quan ngoài chính điện (bản 1.2): mái chính điện, sân, lối đá, tường bao, cổng tam quan,
// gác chuông, cây bồ đề, tượng Quan Âm lộ thiên, đèn đá. Mọi thứ dựng bằng code.
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

  // mái ngói hai mái với đầu đao cong vút
  function roof(parent, cx, cy, cz, w, d, h, over, mat, ridgeMat, rotY) {
    const G = new THREE.Group(); G.position.set(cx, cy, cz); G.rotation.y = rotY || 0; parent.add(G);
    const sh = new THREE.Shape(); sh.moveTo(-w / 2 - over, 0); sh.lineTo(w / 2 + over, 0); sh.lineTo(0, h); sh.lineTo(-w / 2 - over, 0);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: d + over * 2, bevelEnabled: false });
    geo.translate(0, 0, -(d + over * 2) / 2);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.35, uv.getY(i) * 0.35);
    const m = put(G, geo, mat, 0, 0, 0); m.rotation.y = 0;
    put(G, new THREE.BoxGeometry(0.28, 0.32, d + over * 2 + 0.3), ridgeMat, 0, h + 0.1, 0);
    // đầu đao ở 4 góc
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const p0 = V3(sx * (w / 2 + over - 0.2), 0.05, sz * (d / 2 + over - 0.2)), p1 = V3(sx * (w / 2 + over + 0.35), 0.25, sz * (d / 2 + over + 0.35)), p2 = V3(sx * (w / 2 + over + 0.55), 0.85, sz * (d / 2 + over + 0.55));
      const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, p1, p2]), 12, 0.11, 8), ridgeMat); t.castShadow = true; G.add(t);
      put(G, new THREE.SphereGeometry(0.15, 10, 8), ridgeMat, p2.x, p2.y + 0.05, p2.z);
    }
    // hai đầu bờ nóc cong
    for (const sz of [-1, 1]) { const z = sz * (d / 2 + over + 0.15); const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, h + 0.1, z), V3(0, h + 0.5, z + sz * 0.25), V3(0, h + 0.75, z - sz * 0.1)]), 10, 0.13, 8), ridgeMat); G.add(t); }
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

  function bellTower(parent, x, z, mats) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const plat = std('#9A8E7A', { map: stoneTex, roughness: 0.95 });
    put(g, new THREE.BoxGeometry(4.2, 0.5, 4.2), plat, 0, 0.25, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { put(g, new THREE.CylinderGeometry(0.17, 0.19, 4.4, 14), mats.lacquer, sx * 1.55, 2.7, sz * 1.55); put(g, new THREE.CylinderGeometry(0.28, 0.3, 0.2, 14), plat, sx * 1.55, 0.6, sz * 1.55); }
    for (const sz of [-1, 1]) put(g, new THREE.BoxGeometry(3.5, 0.22, 0.24), mats.darkWood, 0, 4.7, sz * 1.55);
    for (const sx of [-1, 1]) put(g, new THREE.BoxGeometry(0.24, 0.22, 3.5), mats.darkWood, sx * 1.55, 4.7, 0);
    put(g, new THREE.BoxGeometry(0.2, 0.2, 3.3), mats.darkWood, 0, 4.55, 0);
    roof(g, 0, 4.85, 0, 3.4, 3.4, 1.1, 0.7, mats.tile, mats.ridge);
    roof(g, 0, 6.15, 0, 2.0, 2.0, 0.9, 0.45, mats.tile, mats.ridge);
    put(g, new THREE.BoxGeometry(1.8, 0.35, 1.8), mats.lacquer, 0, 6.05, 0);
    // đại hồng chung
    const bell = new THREE.Group(); bell.position.set(0, 4.45, 0); g.add(bell);
    const pts = [[0, 0], [0.18, 0], [0.42, -0.12], [0.56, -0.6], [0.62, -1.3], [0.7, -1.62], [0.66, -1.7], [0, -1.7]].map(([r, y]) => new THREE.Vector2(r, y));
    const bronze = std('#6E5A32', { metalness: 0.75, roughness: 0.4, envMap: mats.env, envMapIntensity: 0.6 });
    put(bell, new THREE.LatheGeometry(pts, 36), bronze, 0, 0, 0);
    for (const y of [-0.45, -0.95, -1.45]) put(bell, new THREE.TorusGeometry(0.6 + (y < -1 ? 0.06 : 0) - (y > -0.5 ? 0.07 : 0), 0.025, 6, 36), bronze, 0, y, 0, false).rotation.x = Math.PI / 2;
    put(bell, new THREE.TorusGeometry(0.16, 0.05, 8, 16), bronze, 0, 0.08, 0);
    // chày gỗ treo ngang
    // chày treo bằng 2 dây từ xà (4.65) → xoay quanh xà như con lắc
    const log = new THREE.Group(); log.position.set(1.34, 4.65, 0); g.add(log);
    const logM = std('#7A5636', { roughness: 0.85 });
    put(log, new THREE.CylinderGeometry(0.12, 0.12, 1.3, 12), logM, 0, -1.25, 0).rotation.z = Math.PI / 2;
    put(log, new THREE.CylinderGeometry(0.125, 0.125, 0.05, 12), std('#4A3222'), -0.64, -1.25, 0).rotation.z = Math.PI / 2;
    for (const sx of [-0.45, 0.45]) put(log, new THREE.CylinderGeometry(0.012, 0.012, 1.25, 4), std('#C9B48A'), sx, -0.62, 0, false);
    return { g, bell, log };
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
  function pillar(parent, x, z, h, mats, couplet, gold) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const wall = mats.wall, trim = mats.trim;
    put(g, new THREE.BoxGeometry(0.95, 0.4, 0.95), mats.stone, 0, 0.2, 0);
    put(g, new THREE.BoxGeometry(0.72, h, 0.72), wall, 0, h / 2 + 0.4, 0);
    for (const y of [1.0, h * 0.55 + 0.4, h + 0.2]) put(g, new THREE.BoxGeometry(0.82, 0.12, 0.82), trim, 0, y, 0);
    put(g, new THREE.BoxGeometry(0.9, 0.5, 0.9), wall, 0, h + 0.65, 0);
    put(g, new THREE.ConeGeometry(0.62, 0.35, 4), mats.ridge, 0, h + 1.07, 0).rotation.y = Math.PI / 4;
    lotusPedestal(g, 0, h + 1.2, 0, 0.26, gold);
    put(g, new THREE.SphereGeometry(0.2, 16, 12), gold, 0, h + 1.55, 0);
    if (couplet) { const t = textTex([couplet], 64, 400, { vertical: true }); put(g, new THREE.PlaneGeometry(0.42, h * 0.62), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), 0, 0.4 + h * 0.5, 0.365, false); }
    return g;
  }
  // cổng tam quan: 3 khối cửa, cửa giữa cao hơn, mái chồng diêm, trụ biểu có câu đối
  function gate(parent, z, mats, label) {
    const g = new THREE.Group(); g.position.set(0, 0, z); parent.add(g);
    const wall = std('#D9B776', { roughness: 0.88 }), trim = std('#8A3A22', { roughness: 0.75 }), stone = std('#8C8476', { roughness: 0.95 });
    const goldM = std('#D6A548', { metalness: 0.6, roughness: 0.35, envMap: mats.env, envMapIntensity: 0.7 });
    const M2 = Object.assign({ wall, trim, stone }, mats);
    const block = (cx, w, h, aw, ah) => {
      const sh = new THREE.Shape(); sh.moveTo(cx - w / 2, 0); sh.lineTo(cx + w / 2, 0); sh.lineTo(cx + w / 2, h); sh.lineTo(cx - w / 2, h); sh.lineTo(cx - w / 2, 0);
      const p = new THREE.Path(); p.moveTo(cx - aw / 2, 0); p.lineTo(cx - aw / 2, ah - aw / 2); p.absarc(cx, ah - aw / 2, aw / 2, Math.PI, 0, true); p.lineTo(cx + aw / 2, 0); p.lineTo(cx - aw / 2, 0); sh.holes.push(p);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.1, bevelEnabled: false, curveSegments: 24 }); geo.translate(0, 0, -0.55); put(g, geo, wall, 0, 0, 0);
      for (const sz of [-1, 1]) { const tr = new THREE.Mesh(new THREE.TorusGeometry(aw / 2 + 0.09, 0.08, 8, 32, Math.PI), trim); tr.position.set(cx, ah - aw / 2, sz * 0.56); g.add(tr); for (const sx of [-1, 1]) put(g, new THREE.BoxGeometry(0.16, ah - aw / 2, 0.16), trim, cx + sx * (aw / 2 + 0.09), (ah - aw / 2) / 2, sz * 0.56, false); }
      put(g, new THREE.BoxGeometry(w + 0.2, 0.18, 1.3), trim, cx, h - 0.05, 0);
      put(g, new THREE.BoxGeometry(w + 0.1, 0.35, 1.25), stone, cx, 0.17, 0);
      for (const sz of [-1, 1]) for (const sx of [-1, 1]) put(g, new THREE.BoxGeometry((w - aw) / 2 - 0.5, h * 0.42, 0.06), std('#C9A262', { roughness: 0.9 }), cx + sx * (aw / 2 + (w - aw) / 4), h * 0.5, sz * 0.57, false);
    };
    block(0, 4.6, 5.4, 2.4, 3.8);
    block(-4.2, 3.0, 4.0, 1.5, 2.7);
    block(4.2, 3.0, 4.0, 1.5, 2.7);
    // mái
    roof(g, 0, 5.4, 0, 1.3, 4.8, 0.9, 0.7, mats.tile, mats.ridge, Math.PI / 2);
    put(g, new THREE.BoxGeometry(3.4, 1.6, 1.0), wall, 0, 6.85, 0);
    put(g, new THREE.BoxGeometry(3.6, 0.15, 1.15), trim, 0, 7.6, 0);
    roof(g, 0, 7.65, 0, 1.2, 3.8, 1.0, 0.65, mats.tile, mats.ridge, Math.PI / 2);
    for (const sx of [-1, 1]) roof(g, sx * 4.2, 4.0, 0, 1.3, 3.2, 0.75, 0.55, mats.tile, mats.ridge, Math.PI / 2);
    // pháp luân trên nóc
    const wheel = new THREE.Group(); wheel.position.set(0, 9.05, 0); g.add(wheel);
    put(wheel, new THREE.TorusGeometry(0.32, 0.05, 8, 28), goldM, 0, 0, 0); put(wheel, new THREE.SphereGeometry(0.08, 10, 8), goldM, 0, 0, 0);
    for (let k = 0; k < 8; k++) { const sp = put(wheel, new THREE.CylinderGeometry(0.02, 0.02, 0.62, 6), goldM, 0, 0, 0, false); sp.rotation.z = k * Math.PI / 8; }
    // biển tên chùa
    const plaqueTex = textTex([{ t: '靜 心 寺', font: 'bold 74px "Songti TC","Songti SC","Noto Serif TC",serif', y: label ? 64 : 80 }].concat(label ? [{ t: label, font: '600 30px Georgia,"New York",serif', y: 126 }] : []), 512, 160, {});
    for (const sz of [-1, 1]) { const pl = put(g, new THREE.PlaneGeometry(2.6, 0.82), new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.6 }), 0, 6.85, sz * 0.51, false); if (sz < 0) pl.rotation.y = Math.PI; }
    const sideTex = textTex([{ t: '佛 光', font: 'bold 64px "Songti TC","Noto Serif TC",serif', y: 64 }], 256, 128, {});
    const sideTex2 = textTex([{ t: '法 輪', font: 'bold 64px "Songti TC","Noto Serif TC",serif', y: 64 }], 256, 128, {});
    put(g, new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.6 }), -4.2, 3.35, 0.56, false);
    put(g, new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshStandardMaterial({ map: sideTex2, roughness: 0.6 }), 4.2, 3.35, 0.56, false);
    // trụ biểu có câu đối
    pillar(g, -6.2, 0.2, 5.0, M2, '佛日增輝', goldM); pillar(g, 6.2, 0.2, 5.0, M2, '法輪常轉', goldM);
    pillar(g, -2.6, 0.75, 4.2, M2, '慈悲喜捨', goldM); pillar(g, 2.6, 0.75, 4.2, M2, '戒定慧學', goldM);
    // bậc thềm + đèn lồng đỏ dưới vòm giữa
    put(g, new THREE.BoxGeometry(5.2, 0.16, 1.2), stone, 0, 0.08, 1.15); put(g, new THREE.BoxGeometry(4.6, 0.16, 0.8), stone, 0, 0.08, 2.0);
    const red = std('#C8402A', { emissive: '#7A1A10', emissiveIntensity: 0.4, roughness: 0.6 });
    for (const sx of [-0.7, 0.7]) { const l = put(g, new THREE.SphereGeometry(0.28, 16, 12), red, sx, 3.05, 0.2); l.scale.set(1, 1.2, 1); put(g, new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10), goldM, sx, 3.42, 0.2, false); put(g, new THREE.CylinderGeometry(0.05, 0.02, 0.3, 6), std('#E2B556'), sx, 2.62, 0.2, false); put(g, new THREE.CylinderGeometry(0.01, 0.01, 0.4, 4), stone, sx, 3.65, 0.2, false); }
    return g;
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
  function rockery(parent, x, z, mats) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    const st = std('#8A8478', { roughness: 0.95 }), moss = std('#56703E', { roughness: 0.9 });
    put(g, new THREE.CylinderGeometry(1.6, 1.7, 0.45, 24), std('#8C8476', { roughness: 0.95 }), 0, 0.22, 0);
    const w = put(g, new THREE.CircleGeometry(1.45, 24), std('#2E4A5A', { roughness: 0.15, metalness: 0.3 }), 0, 0.42, 0, false); w.rotation.x = -Math.PI / 2;
    for (const [px, pz, h, r] of [[0, 0, 2.2, 0.55], [0.5, 0.3, 1.4, 0.45], [-0.5, -0.2, 1.6, 0.42], [0.2, -0.5, 1.0, 0.35]]) { const rk = put(g, new THREE.ConeGeometry(r, h, 6, 3), st, px, 0.4 + h / 2, pz); rk.rotation.set(0.1, px * 3, 0.08); const pos = rk.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { pos.setX(i, pos.getX(i) * (0.8 + Math.random() * 0.4)); pos.setZ(i, pos.getZ(i) * (0.8 + Math.random() * 0.4)); } rk.geometry.computeVertexNormals();
      put(g, new THREE.IcosahedronGeometry(r * 0.35, 0), moss, px + r * 0.3, 0.4 + h * 0.62, pz + r * 0.2, false); }
    // chùa nhỏ trên non bộ
    put(g, new THREE.BoxGeometry(0.18, 0.16, 0.18), std('#C8402A'), 0, 2.62, 0, false); put(g, new THREE.ConeGeometry(0.2, 0.14, 4), mats.ridge, 0, 2.77, 0, false).rotation.y = Math.PI / 4;
    return g;
  }

  function build(scene, mats, opts) {
    const R = new THREE.Group(); scene.add(R);
    const tile = std('#ffffff', { map: tileTex, roughness: 0.75 }), ridge = std('#4A1C14', { roughness: 0.7 });
    const M = Object.assign({ tile, ridge }, mats);
    // nền ngoài: cỏ + sân đá + lối đi
    const gt = grassTex.clone(); gt.needsUpdate = true; gt.repeat.set(10, 12);
    const grass = put(R, new THREE.PlaneGeometry(60, 70), std('#ffffff', { map: gt, roughness: 1 }), 0, -0.02, 35, false); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true;
    const ct = stoneTex.clone(); ct.needsUpdate = true; ct.repeat.set(7, 7);
    const yard = put(R, new THREE.PlaneGeometry(28, 28.4), std('#ffffff', { map: ct, roughness: 0.95 }), 0, -0.012, 23.8, false); yard.rotation.x = -Math.PI / 2; yard.receiveShadow = true;
    const pt = stoneTex.clone(); pt.needsUpdate = true; pt.repeat.set(1.2, 4);
    const path = put(R, new THREE.PlaneGeometry(2.6, 15), std('#ffffff', { map: pt, roughness: 0.9, color: '#D8CCB4' }), 0, 0.004, 30.6, false); path.rotation.x = -Math.PI / 2; path.receiveShadow = true;
    for (const sx of [-1, 1]) { const ring = new THREE.Mesh(new THREE.RingGeometry(5.4, 6.9, 48, 1, sx < 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI), std('#D8CCB4', { roughness: 0.9 })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.006, 18); ring.receiveShadow = true; R.add(ring); }
    const step = put(R, new THREE.BoxGeometry(6, 0.3, 1.4), std('#8C8476', { roughness: 0.95 }), 0, 0.15, 10.4);
    // mái và hiên chính điện
    for (const x of [-5.2, -1.8, 1.8, 5.2]) { put(R, new THREE.CylinderGeometry(0.24, 0.26, 6.3, 16), M.lacquer, x, 3.15, 10.9); put(R, new THREE.CylinderGeometry(0.38, 0.4, 0.22, 16), std('#7C746A', { roughness: 0.9 }), x, 0.11, 10.9); }
    put(R, new THREE.BoxGeometry(12.6, 0.4, 0.5), M.darkWood, 0, 6.25, 10.9);
    roof(R, 0, 6.45, 0.6, 12.6, 21.2, 2.6, 1.0, tile, ridge);
    put(R, new THREE.BoxGeometry(7.6, 1.1, 14.6), M.lacquer, 0, 8.9, 0.6);
    roof(R, 0, 9.45, 0.6, 7.2, 14, 1.7, 0.6, tile, ridge);
    // bảng ngang trên cửa chính điện
    const ht = canvasTex(512, 128, (c, w, h) => { c.fillStyle = '#5A1C12'; c.fillRect(0, 0, w, h); c.strokeStyle = '#D9A441'; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#F2CE6A'; c.font = 'bold 70px "Songti TC", "Noto Serif TC", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('大 雄 寶 殿', w / 2, h / 2 + 4); });
    put(R, new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshStandardMaterial({ map: ht, roughness: 0.6 }), 0, 5.3, 9.78, false);
    // tường bao
    const wallM = std('#C9A666', { roughness: 0.95 }), capM = ridge;
    for (const sx of [-1, 1]) { put(R, new THREE.BoxGeometry(0.5, 1.8, 30), wallM, sx * 14, 0.9, 24); put(R, new THREE.BoxGeometry(0.9, 0.22, 30.4), capM, sx * 14, 1.9, 24); }
    for (const sx of [-1, 1]) { put(R, new THREE.BoxGeometry(7.6, 1.8, 0.5), wallM, sx * 10.2, 0.9, 38.4); put(R, new THREE.BoxGeometry(7.9, 0.22, 0.9), capM, sx * 10.2, 1.9, 38.4); }
    const gateG = gate(R, 38.4, M, opts.label);
    // tiểu cảnh dọc lối vào
    for (const z of [28.5, 32.5, 36.2]) for (const sx of [-1, 1]) bonsaiPot(R, sx * 3.1, z, 0.95, sx < 0 ? '#3E5C7A' : '#7A3A2A');
    for (const sx of [-1, 1]) { flowerBed(R, sx * 4.4, 30.5, 1.4, 7.5); lotusJar(R, sx * 2.6, 11.6); bonsaiPot(R, sx * 7.2, 12.1, 1.25, '#3E5C7A'); bonsaiPot(R, sx * 2.6, 40.6, 1.3, '#7A3A2A'); }
    const flags = [flag(R, -3.4, 37.0, 5.2), flag(R, 3.4, 37.0, 5.2)];
    flags[1].rotation.y = Math.PI;
    bigUrn(R, 0, 25.6, M);
    rockery(R, -9.6, 35.2, M);
    bamboo(R, -12.6, 31, 9); bamboo(R, 12.8, 22, 9); bamboo(R, -12.8, 15.5, 7); bamboo(R, 12.6, 36.5, 7);
    // cây
    const trees = [[-11.5, 13, 1.0], [11.8, 12.5, 0.9], [-12, 35, 1.1], [12, 35.5, 1.0], [-17, 20, 1.3], [17, 24, 1.3], [-18, 34, 1.2], [18, 40, 1.1], [-8, 44, 1.2], [9, 45, 1.3], [-19, 8, 1.4], [19, 8, 1.4]];
    trees.forEach(([x, z, s], i) => tree(R, x, z, s, i % 2 ? '#3F5F36' : '#4A6A3C'));
    const bo = bodhi(R, 9.4, 29.5);
    // gác chuông
    const bt = bellTower(R, -9.2, 27.5, M);
    // Quan Âm lộ thiên
    const qa = window.Figures.makeQuanAm(mats.porcelain, mats.gold, mats.glowTex); const qaG = new THREE.Group(); qaG.position.set(9.6, 0, 16.5); qaG.rotation.y = -1.25; R.add(qaG);
    put(qaG, new THREE.BoxGeometry(2.2, 0.8, 2.2), std('#8C8476', { roughness: 0.95 }), 0, 0.4, 0);
    qa.scale.setScalar(1.35); qa.position.y = 0.8; qaG.add(qa);
    const urn = put(qaG, new THREE.CylinderGeometry(0.42, 0.32, 0.5, 18), std('#6E5A32', { metalness: 0.6, roughness: 0.45 }), 0, 0.95, 1.6);
    put(qaG, new THREE.CylinderGeometry(0.3, 0.3, 0.7, 12), std('#8C8476'), 0, 0.35, 1.6);
    // đèn đá dọc lối đi
    const lanterns = [];
    for (const z of [26.5, 30.5, 34.5]) for (const sx of [-1, 1]) lanterns.push(stoneLantern(R, sx * 2.1, z, mats.flameTex));
    for (const sx of [-1, 1]) lanterns.push(stoneLantern(R, sx * 3.6, 12.2, mats.flameTex));
    return { root: R, bell: bt.bell, bellLog: bt.log, bellTower: bt.g, bodhi: bo, quanAm: qaG, lanterns, gate: gateG, step, flags };
  }

  window.Temple = { build };
})();

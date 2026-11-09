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
    const log = new THREE.Group(); log.position.set(1.05, 3.4, 0); g.add(log);
    put(log, new THREE.CylinderGeometry(0.12, 0.12, 1.3, 12), std('#7A5636', { roughness: 0.85 }), 0, 0, 0).rotation.z = Math.PI / 2;
    for (const sx of [-0.45, 0.45]) put(log, new THREE.CylinderGeometry(0.012, 0.012, 1.25, 4), std('#C9B48A'), sx, 0.62, 0, false);
    return { g, bell, log };
  }

  // cổng tam quan
  function gate(parent, z, mats, label) {
    const g = new THREE.Group(); g.position.set(0, 0, z); parent.add(g);
    const wall = std('#D7B46E', { roughness: 0.9 }), trim = std('#8A3A22', { roughness: 0.8 });
    const sh = new THREE.Shape(); sh.moveTo(-6, 0); sh.lineTo(6, 0); sh.lineTo(6, 4.6); sh.lineTo(-6, 4.6); sh.lineTo(-6, 0);
    const arch = (cx, w, h) => { const p = new THREE.Path(); p.moveTo(cx - w / 2, 0); p.lineTo(cx - w / 2, h - w / 2); p.absarc(cx, h - w / 2, w / 2, Math.PI, 0, true); p.lineTo(cx + w / 2, 0); p.lineTo(cx - w / 2, 0); return p; };
    sh.holes.push(arch(0, 2.6, 3.7), arch(-3.8, 1.6, 2.7), arch(3.8, 1.6, 2.7));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.0, bevelEnabled: false }); geo.translate(0, 0, -0.5);
    put(g, geo, wall, 0, 0, 0);
    put(g, new THREE.BoxGeometry(12.4, 0.3, 1.3), trim, 0, 4.7, 0);
    put(g, new THREE.BoxGeometry(12.6, 0.25, 1.4), std('#7A746A', { roughness: 0.95 }), 0, 0.12, 0);
    roof(g, 0, 4.85, 0, 1.0, 12.0, 0.9, 0.6, mats.tile, mats.ridge, Math.PI / 2);
    put(g, new THREE.BoxGeometry(4.2, 1.5, 1.0), wall, 0, 6.15, 0);
    roof(g, 0, 6.9, 0, 1.0, 4.4, 1.0, 0.6, mats.tile, mats.ridge, Math.PI / 2);
    // biển tên chùa
    const plaqueTex = canvasTex(512, 160, (c, w, h) => {
      c.fillStyle = '#7A2418'; c.fillRect(0, 0, w, h); c.strokeStyle = '#D9A441'; c.lineWidth = 10; c.strokeRect(8, 8, w - 16, h - 16);
      c.fillStyle = '#F2CE6A'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = 'bold 74px "Songti TC", "Songti SC", "Noto Serif TC", serif'; c.fillText('靜 心 寺', w / 2, label ? 66 : h / 2);
      if (label) { c.font = '600 30px Georgia, "New York", serif'; c.fillText(label, w / 2, 126); }
    });
    for (const sz of [-1, 1]) { const pl = put(g, new THREE.PlaneGeometry(2.6, 0.82), new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.6 }), 0, 6.15, sz * 0.51, false); if (sz < 0) pl.rotation.y = Math.PI; }
    // trụ biểu hai bên
    for (const sx of [-1, 1]) { put(g, new THREE.BoxGeometry(0.7, 6.2, 0.9), wall, sx * 6.35, 3.1, 0); put(g, new THREE.SphereGeometry(0.42, 14, 10), std('#E2B556', { roughness: 0.5, metalness: 0.4 }), sx * 6.35, 6.6, 0); }
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
    return { root: R, bell: bt.bell, bellLog: bt.log, bellTower: bt.g, bodhi: bo, quanAm: qaG, lanterns, gate: gateG, step };
  }

  window.Temple = { build };
})();

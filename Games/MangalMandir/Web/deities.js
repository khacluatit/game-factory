// Tượng thần (murti) dựng bằng hình khối Three.js. Mỗi tượng nhìn về +z, gốc toạ độ = mặt bệ.
// Hình tượng theo chuẩn: Ganesha (đầu voi, ngà phải gãy, 4 tay: rìu-móc, dây thòng lọng, ban phước, bát modak; chuột ở chân),
// Shiva (linga đá đen trên yoni, tripundra, rắn naga, bình jaladhari; bò Nandi quay mặt vào), Lakshmi (ngồi trên sen, 4 tay: 2 hoa sen,
// ban phước rải tiền vàng, ban ơn; 2 voi hai bên), Hanuman (thân màu sindoor, chùy gada, đuôi), Krishna (da xanh, sáo, lông công, áo vàng).
(function () {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const std = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.6, metalness: 0 }, o || {}));
  function add(p, geo, mat, x, y, z, cast) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (cast !== false) { m.castShadow = true; m.receiveShadow = true; } p.add(m); return m; }
  const sph = (p, r, mat, x, y, z, sx, sy, sz) => { const m = add(p, new THREE.SphereGeometry(r, 28, 20), mat, x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); return m; };
  const cyl = (p, rt, rb, h, mat, x, y, z, seg) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg || 24), mat, x, y, z);
  const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg || 40).rotateY(Math.PI);
  function tube(p, pts, r, mat, closed, rEnd) {
    const curve = new THREE.CatmullRomCurve3(pts, !!closed);
    const g = new THREE.TubeGeometry(curve, 64, r, 12, !!closed);
    if (rEnd !== undefined) { // vuốt nhỏ dần (vòi voi, đuôi)
      const pos = g.attributes.position, n = 65, ring = 13; const c = new THREE.Vector3();
      for (let i = 0; i < n; i++) { const k = 1 - (1 - rEnd / r) * (i / (n - 1)); curve.getPointAt(i / (n - 1), c); for (let j = 0; j < ring; j++) { const idx = i * ring + j; const v = new THREE.Vector3().fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c); pos.setXYZ(idx, v.x, v.y, v.z); } }
      pos.needsUpdate = true; g.computeVertexNormals();
    }
    const m = new THREE.Mesh(g, mat); m.castShadow = true; p.add(m); return m;
  }
  function limb(p, a, b, r, mat, r2) {
    const d = b.clone().sub(a), len = d.length();
    const m = add(p, new THREE.CylinderGeometry(r2 || r, r, len, 18), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize());
    sph(p, r, mat, a.x, a.y, a.z); sph(p, r2 || r, mat, b.x, b.y, b.z); return m;
  }
  // bàn tay: lòng bàn tay + 4 ngón + ngón cái; dir 'up' = thế abhaya (giơ lên, lòng tay ra trước)
  function hand(p, pos, mat, rotX, rotY, rotZ, s) {
    const g = new THREE.Group(); g.position.copy(pos); g.rotation.set(rotX || 0, rotY || 0, rotZ || 0); g.scale.setScalar(s || 1); p.add(g);
    const palm = add(g, new THREE.BoxGeometry(0.1, 0.11, 0.035), mat, 0, 0, 0); palm.geometry.translate(0, 0.0, 0);
    for (let i = 0; i < 4; i++) { const f = add(g, new THREE.CapsuleGeometry(0.012, 0.06, 4, 8), mat, -0.036 + i * 0.024, 0.09 - Math.abs(i - 1.5) * 0.008, 0.004); }
    const th = add(g, new THREE.CapsuleGeometry(0.013, 0.045, 4, 8), mat, 0.065, 0.0, 0.01); th.rotation.z = -0.8;
    return g;
  }
  // vòng hoa cúc vạn thọ (cam/vàng) dọc đường cong
  function garland(p, pts, n, r, closed) {
    const curve = new THREE.CatmullRomCurve3(pts, !!closed);
    const mats = [std('#F28C1E', { roughness: 0.9 }), std('#F6B21C', { roughness: 0.9 }), std('#E8641A', { roughness: 0.9 })];
    const geo = new THREE.IcosahedronGeometry(r, 1);
    const ims = mats.map(m => new THREE.InstancedMesh(geo, m, Math.ceil(n / 3)));
    const m4 = new THREE.Matrix4(), q = new THREE.Vector3(); const cnt = [0, 0, 0];
    for (let i = 0; i < n; i++) { curve.getPointAt(i / (closed ? n : n - 1), q); const k = i % 3; m4.makeTranslation(q.x, q.y, q.z); ims[k].setMatrixAt(cnt[k]++, m4); }
    ims.forEach((im, k) => { im.count = cnt[k]; im.castShadow = true; p.add(im); });
  }
  // vương miện (mukut) dạng tháp có gai
  function mukut(p, y, r, h, gold, gem) {
    const g = new THREE.Group(); g.position.y = y; p.add(g);
    add(g, lathe([[0, 0], [r, 0], [r * 1.02, h * 0.12], [r * 0.86, h * 0.3], [r * 0.7, h * 0.55], [r * 0.42, h * 0.8], [r * 0.18, h * 0.95], [0, h]], 24), gold);
    add(g, new THREE.TorusGeometry(r * 1.0, r * 0.08, 8, 32), gold, 0, h * 0.06, 0).rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.42; const s = add(g, new THREE.ConeGeometry(r * 0.13, h * 0.35, 6), gold, Math.sin(a) * r * 0.92, h * 0.28, Math.cos(a) * r * 0.92); s.rotation.x = 0.25 * Math.cos(a); s.rotation.z = -0.25 * Math.sin(a); }
    sph(g, r * 0.12, gem || std('#C0182A', { roughness: 0.2, metalness: 0.2 }), 0, h * 0.25, r * 0.9);
    sph(g, r * 0.1, gold, 0, h * 1.02, 0);
    return g;
  }
  // khung vòm trang trí sau lưng tượng (prabhavali)
  function prabhavali(p, w, h, y, z, gold) {
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(-w / 2, h * 0.55); sh.quadraticCurveTo(-w / 2, h, 0, h * 1.05); sh.quadraticCurveTo(w / 2, h, w / 2, h * 0.55); sh.lineTo(w / 2, 0);
    const hole = new THREE.Path(); const iw = w * 0.82; hole.moveTo(-iw / 2, 0.02); hole.lineTo(-iw / 2, h * 0.52); hole.quadraticCurveTo(-iw / 2, h * 0.93, 0, h * 0.97); hole.quadraticCurveTo(iw / 2, h * 0.93, iw / 2, h * 0.52); hole.lineTo(iw / 2, 0.02); sh.holes.push(hole);
    const m = add(p, new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2, curveSegments: 24 }), gold, 0, y, z);
    // các tia nhỏ (jwala) trên vòm
    for (let i = 0; i <= 12; i++) { const t = i / 12, a = Math.PI * (1 - t); const x = Math.cos(a) * w * 0.5, yy = y + h * 0.55 + Math.sin(a) * h * 0.5; const c = add(p, new THREE.ConeGeometry(0.035, 0.12, 5), gold, x, yy, z + 0.02); c.rotation.z = a - Math.PI / 2; }
    return m;
  }

  // ---------------- Ganesha ----------------
  function makeGanesha(M) {
    const G = new THREE.Group();
    const skin = std('#E0602A', { roughness: 0.55 }), skinD = std('#C24E22', { roughness: 0.6 }), gold = M.gold, cloth = std('#F2C230', { roughness: 0.75 }), clothR = std('#B81E2A', { roughness: 0.75 });
    const white = std('#F4EEDC', { roughness: 0.4 }), dark = std('#2A1A12', { roughness: 0.5 });
    // ngồi: thân dưới, chân xếp (chân trái gập, chân phải buông)
    sph(G, 0.42, cloth, 0, 0.2, 0.02, 1.15, 0.5, 0.95);
    limb(G, V3(-0.36, 0.14, 0.18), V3(0.08, 0.1, 0.36), 0.12, cloth, 0.1);
    limb(G, V3(0.34, 0.16, 0.16), V3(0.42, 0.06, 0.42), 0.12, cloth, 0.1);
    sph(G, 0.08, skin, 0.1, 0.08, 0.4, 1.3, 0.6, 1); sph(G, 0.08, skin, 0.44, 0.04, 0.5, 1, 0.6, 1.3);
    add(G, new THREE.TorusGeometry(0.08, 0.018, 8, 20), gold, 0.44, 0.06, 0.5).rotation.x = Math.PI / 2;
    // bụng to + thân
    sph(G, 0.36, skin, 0, 0.56, 0.08, 1.05, 1.0, 0.95);
    sph(G, 0.28, skin, 0, 0.86, -0.02, 1.15, 0.9, 0.85);
    add(G, new THREE.TorusGeometry(0.36, 0.035, 10, 40), clothR, 0, 0.42, 0.06).rotation.x = Math.PI / 2 - 0.15;
    // dây rắn quanh bụng (nagabandha) – vàng
    add(G, new THREE.TorusGeometry(0.37, 0.02, 8, 40), gold, 0, 0.5, 0.06).rotation.x = Math.PI / 2 - 0.1;
    // dây yajnopavita chéo ngực
    tube(G, [V3(-0.24, 1.0, 0.12), V3(-0.05, 0.8, 0.27), V3(0.18, 0.55, 0.32), V3(0.3, 0.4, 0.2)], 0.012, white);
    // đầu voi
    const H = new THREE.Group(); H.position.set(0, 1.18, 0.02); G.add(H);
    sph(H, 0.22, skin, 0, 0, 0, 1.05, 1.0, 0.95);
    sph(H, 0.16, skin, 0, 0.1, 0.04, 1.1, 0.8, 0.9);
    sph(H, 0.075, skin, -0.075, 0.1, 0.13, 1, 0.8, 0.8); sph(H, 0.075, skin, 0.075, 0.1, 0.13, 1, 0.8, 0.8); // gò trán
    // tai lớn
    for (const s of [-1, 1]) { const e = sph(H, 0.27, skin, s * 0.27, -0.02, -0.04, 0.32, 1.0, 0.85); e.rotation.y = s * 0.5; const ein = sph(H, 0.24, std('#D99060', { roughness: 0.7 }), s * 0.3, -0.02, -0.01, 0.1, 0.88, 0.72); ein.rotation.y = s * 0.5; }
    // mắt
    for (const s of [-1, 1]) { sph(H, 0.032, white, s * 0.085, 0.03, 0.19, 1.2, 0.8, 0.5); sph(H, 0.018, dark, s * 0.085, 0.03, 0.205); }
    // tilak (vạch đỏ + chấm) trên trán
    add(H, new THREE.BoxGeometry(0.02, 0.09, 0.01), clothR, 0, 0.13, 0.2);
    // vòi cong về bên trái (Vamamukhi), đầu vòi chạm bát modak
    tube(H, [V3(0, -0.04, 0.17), V3(0, -0.2, 0.26), V3(0.03, -0.4, 0.3), V3(0.12, -0.56, 0.34), V3(0.22, -0.64, 0.38), V3(0.28, -0.6, 0.42)], 0.075, skin, false, 0.03);
    // ngà: phải gãy ngắn, trái đủ
    const tl = add(H, new THREE.ConeGeometry(0.03, 0.2, 10), white, 0.11, -0.12, 0.2); tl.rotation.set(1.9, 0, -0.4);
    const tr = add(H, new THREE.ConeGeometry(0.03, 0.08, 10), white, -0.11, -0.09, 0.2); tr.rotation.set(1.9, 0, 0.4);
    mukut(H, 0.16, 0.15, 0.36, gold);
    // 4 tay
    const sh = (s) => V3(s * 0.3, 0.98, 0.0);
    // tay trên phải (bên trái người xem = +x? tượng nhìn +z nên tay phải của tượng ở -x): cầm rìu móc ankusha
    limb(G, sh(-1), V3(-0.5, 1.1, 0.02), 0.07, skin, 0.06); limb(G, V3(-0.5, 1.1, 0.02), V3(-0.52, 1.38, 0.06), 0.06, skin, 0.05);
    hand(G, V3(-0.52, 1.44, 0.07), skin, 0, 0, 0);
    const ank = new THREE.Group(); ank.position.set(-0.52, 1.44, 0.11); G.add(ank);
    cyl(ank, 0.012, 0.012, 0.42, gold, 0, 0.05, 0); add(ank, new THREE.TorusGeometry(0.05, 0.012, 6, 16, Math.PI), gold, 0.05, 0.26, 0).rotation.z = Math.PI / 2;
    add(ank, new THREE.ConeGeometry(0.02, 0.08, 6), gold, 0, 0.3, 0);
    // tay trên trái: dây thòng lọng pasha
    limb(G, sh(1), V3(0.5, 1.1, 0.02), 0.07, skin, 0.06); limb(G, V3(0.5, 1.1, 0.02), V3(0.52, 1.38, 0.06), 0.06, skin, 0.05);
    hand(G, V3(0.52, 1.44, 0.07), skin, 0, 0, 0);
    add(G, new THREE.TorusGeometry(0.09, 0.014, 8, 24), gold, 0.55, 1.58, 0.1);
    // tay dưới phải: abhaya (lòng bàn tay ra trước)
    limb(G, V3(-0.32, 0.92, 0.04), V3(-0.4, 0.68, 0.2), 0.075, skin, 0.065); limb(G, V3(-0.4, 0.68, 0.2), V3(-0.36, 0.86, 0.38), 0.065, skin, 0.055);
    hand(G, V3(-0.36, 0.93, 0.41), skin, -0.2, 0, 0, 1.1);
    // tay dưới trái: bát modak trên lòng bàn tay
    limb(G, V3(0.32, 0.92, 0.04), V3(0.44, 0.62, 0.2), 0.075, skin, 0.065); limb(G, V3(0.44, 0.62, 0.2), V3(0.34, 0.5, 0.4), 0.065, skin, 0.055);
    const bowl = add(G, lathe([[0, 0], [0.1, 0.0], [0.12, 0.04], [0.11, 0.06]], 24), gold, 0.3, 0.5, 0.44);
    for (const [x, z] of [[0.27, 0.44], [0.33, 0.44], [0.3, 0.48], [0.3, 0.4]]) sph(G, 0.035, white, x, 0.58, z, 1, 1.3, 1);
    sph(G, 0.035, white, 0.3, 0.63, 0.44, 1, 1.3, 1);
    for (const s of [-1, 1]) for (const [x, y, z] of [[s * 0.5, 1.12, 0.02], [s * 0.4, 0.7, 0.2]]) add(G, new THREE.TorusGeometry(0.068, 0.014, 8, 20), gold, x, y, z).rotation.x = Math.PI / 2;
    // vòng hoa
    garland(G, [V3(-0.28, 1.02, 0.12), V3(-0.3, 0.7, 0.36), V3(0, 0.52, 0.44), V3(0.3, 0.7, 0.36), V3(0.28, 1.02, 0.12)], 46, 0.032);
    // chuột Mushak ở chân, quay ra trước, cầm modak
    const R = new THREE.Group(); R.position.set(0.5, -0.0, 0.62); R.rotation.y = -0.4; G.add(R);
    const grey = std('#6E6A66', { roughness: 0.7 });
    sph(R, 0.09, grey, 0, 0.08, 0, 0.9, 0.8, 1.3); sph(R, 0.05, grey, 0, 0.12, 0.12, 0.9, 0.9, 1.3);
    for (const s of [-1, 1]) sph(R, 0.025, grey, s * 0.04, 0.17, 0.1);
    sph(R, 0.01, dark, 0, 0.12, 0.19); tube(R, [V3(0, 0.06, -0.1), V3(0.06, 0.03, -0.2), V3(0.14, 0.02, -0.22)], 0.008, grey);
    sph(R, 0.03, white, 0, 0.1, 0.19, 1, 1.3, 1);
    prabhavali(G, 1.6, 1.85, -0.02, -0.38, gold);
    return G;
  }

  // ---------------- Shiva linga + Nandi ----------------
  function makeLinga(M) {
    const G = new THREE.Group();
    const stone = std('#1E1C1E', { roughness: 0.25, metalness: 0.1, envMap: M.env, envMapIntensity: 0.6 }), white = std('#F2EEE6', { roughness: 0.5 }), red = std('#B81E2A', { roughness: 0.5 });
    // yoni: bệ tròn có máng (somasutra) chĩa sang trái người xem
    const base = add(G, lathe([[0, 0], [0.42, 0], [0.44, 0.06], [0.36, 0.1], [0.38, 0.16], [0.46, 0.2], [0.46, 0.26], [0.2, 0.27], [0, 0.27]], 48), stone);
    const sp = add(G, new THREE.BoxGeometry(0.42, 0.06, 0.16), stone, -0.56, 0.235, 0); add(G, new THREE.BoxGeometry(0.3, 0.02, 0.08), std('#2C2A2C', { roughness: 0.3 }), -0.6, 0.27, 0);
    // linga
    add(G, lathe([[0, 0], [0.17, 0], [0.17, 0.32], [0.16, 0.4], [0.12, 0.47], [0.06, 0.5], [0, 0.505]], 40), stone, 0, 0.27, 0);
    // tripundra (3 vạch trắng) + chấm đỏ
    for (let i = 0; i < 3; i++) { const b = add(G, new THREE.TorusGeometry(0.172, 0.01, 6, 24, Math.PI * 0.55), white, 0, 0.6 + i * 0.045, 0); b.rotation.set(Math.PI / 2, 0, Math.PI * 0.225); }
    sph(G, 0.018, red, 0, 0.645, 0.172);
    // lá bael ba thuỳ trên đỉnh
    const leaf = std('#3E7A34', { roughness: 0.6, side: THREE.DoubleSide });
    for (const a of [-0.6, 0, 0.6]) { const l = sph(G, 0.05, leaf, Math.sin(a) * 0.05, 0.775, 0.06 + Math.cos(a) * 0.04, 0.6, 0.15, 1.4); l.rotation.y = a; }
    // rắn naga cuộn quanh, mũ xoè che phía sau
    const naga = M.gold;
    const coil = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 4.2, y = 0.3 + i / 40 * 0.42; coil.push(V3(Math.cos(a) * 0.2, y, Math.sin(a) * 0.2)); }
    coil.push(V3(0, 0.8, -0.22), V3(0, 0.92, -0.2)); tube(G, coil, 0.026, naga);
    // Panchamukha naga: thân dựng sau linga, mũ phồng xoè, 5 đầu cúi về phía trước che trên đỉnh linga
    const hoodG = new THREE.Group(); hoodG.position.set(0, 0.92, -0.2); hoodG.rotation.x = 0.35; G.add(hoodG);
    const hoodIn = std('#E8C66A', { roughness: 0.4, metalness: 0.6 });
    const hs = new THREE.Shape(); hs.moveTo(0, 0); hs.bezierCurveTo(-0.08, 0.04, -0.22, 0.1, -0.21, 0.22); hs.bezierCurveTo(-0.2, 0.3, -0.1, 0.33, 0, 0.3); hs.bezierCurveTo(0.1, 0.33, 0.2, 0.3, 0.21, 0.22); hs.bezierCurveTo(0.22, 0.1, 0.08, 0.04, 0, 0);
    const hood = add(hoodG, new THREE.ExtrudeGeometry(hs, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 16 }), naga, 0, 0, -0.02);
    for (let i = 0; i < 3; i++) { const b = add(hoodG, new THREE.TorusGeometry(0.05 + i * 0.045, 0.006, 6, 24, Math.PI), hoodIn, 0, 0.06, 0.03, false); }
    for (let i = -2; i <= 2; i++) {
      const a = i * 0.36, nx = Math.sin(a) * 0.17, ny = 0.2 + Math.cos(a) * 0.1;
      tube(hoodG, [V3(nx * 0.4, 0.1, 0.02), V3(nx * 0.85, ny - 0.02, 0.04), V3(nx, ny + 0.03, 0.08)], 0.022, naga);
      const hd = sph(hoodG, 0.034, naga, nx, ny + 0.05, 0.11, 0.9, 0.6, 1.5); hd.rotation.x = 0.5; hd.rotation.y = -a * 0.4;
      for (const e of [-1, 1]) sph(hoodG, 0.007, std('#B81E2A', { roughness: 0.2 }), nx + e * 0.018, ny + 0.065, 0.135);
    }
    // trishul (đinh ba) của Shiva cắm sau linga, buộc trống damru và dải vải
    const TR = new THREE.Group(); TR.position.set(0.42, 0.0, -0.32); G.add(TR); const steel = std('#5E5C66', { metalness: 0.85, roughness: 0.3, envMap: M.env });
    cyl(TR, 0.022, 0.022, 1.75, steel, 0, 0.875, 0, 10);
    add(TR, new THREE.TorusGeometry(0.11, 0.02, 8, 24, Math.PI), steel, 0, 1.78, 0).rotation.z = Math.PI;
    add(TR, new THREE.ConeGeometry(0.035, 0.26, 8), steel, 0, 1.92, 0);
    for (const s of [-1, 1]) add(TR, new THREE.ConeGeometry(0.028, 0.16, 8), steel, s * 0.11, 1.84, 0);
    add(TR, new THREE.BoxGeometry(0.06, 0.03, 0.06), M.gold, 0, 1.68, 0);
    const dm = new THREE.Group(); dm.position.set(0.0, 1.5, 0.04); dm.rotation.z = Math.PI / 2; TR.add(dm);
    const dmw = std('#8A5A2A', { roughness: 0.6 }), skinH = std('#E8D8B8', { roughness: 0.7 });
    for (const s of [-1, 1]) { const c = add(dm, new THREE.CylinderGeometry(0.02, 0.06, 0.08, 16), dmw, 0, s * 0.04, 0); if (s < 0) c.rotation.x = Math.PI; add(dm, new THREE.CircleGeometry(0.06, 16), skinH, 0, s * 0.081, 0, false).rotation.x = -s * Math.PI / 2; }
    add(dm, new THREE.TorusGeometry(0.022, 0.006, 6, 12), std('#B81E2A'), 0, 0, 0).rotation.x = Math.PI / 2;
    tube(TR, [V3(0, 1.48, 0.02), V3(0.04, 1.36, 0.06), V3(0.02, 1.22, 0.05)], 0.01, std('#E8641A', { roughness: 0.8 }));
    // bình đồng jaladhari treo phía trên
    const pot = new THREE.Group(); pot.position.set(0, 1.55, 0); G.add(pot);
    const copper = std('#B8693A', { metalness: 0.75, roughness: 0.35, envMap: M.env });
    add(pot, lathe([[0, -0.18], [0.08, -0.17], [0.15, -0.1], [0.16, 0.02], [0.1, 0.1], [0.07, 0.14], [0.09, 0.17], [0, 0.17]], 28), copper);
    for (const a of [0, 2.1, 4.2]) cyl(pot, 0.005, 0.005, 0.9, M.gold, Math.cos(a) * 0.12, 0.6, Math.sin(a) * 0.12, 4);
    G.userData.pot = pot;
    garland(G, [V3(-0.44, 0.26, 0.12), V3(0, 0.25, 0.47), V3(0.44, 0.26, 0.12)], 30, 0.03);
    return G;
  }
  function makeNandi(M) {
    const G = new THREE.Group(), w = std('#D8D2C6', { roughness: 0.55 }), d = std('#2A2422', { roughness: 0.6 }), gold = M.gold;
    sph(G, 0.34, w, 0, 0.32, 0, 0.8, 0.62, 1.25); // thân nằm
    sph(G, 0.2, w, 0, 0.5, 0.2, 0.9, 0.9, 0.8); // vai/bướu
    sph(G, 0.16, w, 0, 0.55, 0.42, 0.75, 0.85, 1.2); // đầu
    sph(G, 0.1, w, 0, 0.47, 0.56, 0.8, 0.7, 0.9); // mõm
    for (const s of [-1, 1]) { const h = add(G, new THREE.ConeGeometry(0.03, 0.16, 8), d, s * 0.09, 0.7, 0.38); h.rotation.z = -s * 0.5; sph(G, 0.05, w, s * 0.14, 0.58, 0.36, 1.4, 0.5, 0.8); sph(G, 0.018, d, s * 0.07, 0.58, 0.5); }
    for (const [x, z] of [[-0.2, 0.25], [0.2, 0.25], [-0.2, -0.3], [0.2, -0.3]]) sph(G, 0.09, w, x, 0.08, z, 1.1, 0.6, 1.6);
    add(G, new THREE.TorusGeometry(0.15, 0.025, 8, 24), gold, 0, 0.5, 0.3).rotation.x = 1.2;
    sph(G, 0.04, gold, 0, 0.36, 0.38);
    garland(G, [V3(-0.14, 0.55, 0.28), V3(0, 0.38, 0.4), V3(0.14, 0.55, 0.28)], 18, 0.025);
    tube(G, [V3(0, 0.36, -0.5), V3(0.15, 0.15, -0.55), V3(0.2, 0.05, -0.4)], 0.02, w);
    return G;
  }

  // ---------------- Lakshmi ----------------
  function makeLakshmi(M) {
    const G = new THREE.Group();
    const skin = std('#E8B98A', { roughness: 0.5 }), sari = std('#C8162C', { roughness: 0.65 }), gold = M.gold, pink = std('#F2A0B4', { roughness: 0.6 }), pink2 = std('#E77A98', { roughness: 0.6 }), dark = std('#1E1410');
    // sen hồng làm toà
    const L = new THREE.Group(); G.add(L);
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 12; i++) { const a = (i + ring * 0.5) / 12 * Math.PI * 2, r = 0.42 - ring * 0.1; const p = sph(L, 0.13, ring ? pink : pink2, Math.cos(a) * r, 0.08 + ring * 0.05, Math.sin(a) * r, 0.55, 0.35, 1.0); p.rotation.y = -a + Math.PI / 2; p.rotation.x = 0.4; }
    // ngồi xếp bằng, sari đỏ viền vàng
    sph(G, 0.34, sari, 0, 0.3, 0.05, 1.15, 0.42, 0.9);
    add(G, new THREE.TorusGeometry(0.38, 0.018, 8, 40), gold, 0, 0.26, 0.05).rotation.x = Math.PI / 2;
    add(G, lathe([[0.18, 0], [0.2, 0.15], [0.17, 0.3], [0.14, 0.4], [0.15, 0.5], [0.0, 0.52]], 32), sari, 0, 0.36, 0);
    add(G, lathe([[0.15, 0], [0.16, 0.08], [0.0, 0.1]], 32), skin, 0, 0.84, 0);
    // dupatta vắt vai
    tube(G, [V3(-0.17, 0.86, 0.05), V3(-0.05, 0.7, 0.16), V3(0.12, 0.55, 0.16), V3(0.2, 0.42, 0.06)], 0.035, sari);
    // cổ + đầu
    cyl(G, 0.05, 0.055, 0.1, skin, 0, 0.93, 0);
    const H = new THREE.Group(); H.position.set(0, 1.07, 0.01); G.add(H);
    sph(H, 0.11, skin, 0, 0, 0, 0.92, 1.05, 0.95);
    sph(H, 0.115, dark, 0, 0.03, -0.02, 0.98, 1.0, 0.95);
    for (const s of [-1, 1]) { sph(H, 0.016, std('#F6F0E6'), s * 0.04, 0.0, 0.095, 1.3, 0.7, 0.5); sph(H, 0.009, dark, s * 0.04, 0.0, 0.102); }
    sph(H, 0.012, std('#C0182A'), 0, 0.05, 0.103); // bindi
    sph(H, 0.012, std('#B02840'), 0, -0.055, 0.098, 1.6, 0.6, 0.6);
    mukut(H, 0.07, 0.095, 0.24, gold);
    for (const s of [-1, 1]) sph(H, 0.022, gold, s * 0.1, -0.04, 0.0);
    // 4 tay: 2 tay trên cầm sen, tay dưới phải ban phước (tiền vàng rơi), tay dưới trái varada
    for (const s of [-1, 1]) {
      limb(G, V3(s * 0.17, 0.86, 0), V3(s * 0.3, 0.86, 0.02), 0.04, skin, 0.035); limb(G, V3(s * 0.3, 0.86, 0.02), V3(s * 0.32, 1.06, 0.06), 0.035, skin, 0.03);
      hand(G, V3(s * 0.32, 1.11, 0.07), skin, 0, 0, 0, 0.75);
      cyl(G, 0.008, 0.008, 0.3, std('#3E7A34'), s * 0.33, 1.2, 0.09, 6);
      const lotus = new THREE.Group(); lotus.position.set(s * 0.33, 1.36, 0.09); G.add(lotus);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const p = sph(lotus, 0.04, i % 2 ? pink : pink2, Math.cos(a) * 0.035, 0.03, Math.sin(a) * 0.035, 0.5, 1.2, 0.35); p.rotation.y = -a; p.rotation.z = 0.5; }
      limb(G, V3(s * 0.16, 0.8, 0.04), V3(s * 0.24, 0.6, 0.18), 0.04, skin, 0.035);
      for (const y of [0.86, 1.0]) add(G, new THREE.TorusGeometry(0.04, 0.01, 6, 16), gold, s * 0.31, y, 0.03).rotation.x = Math.PI / 2;
    }
    hand(G, V3(-0.26, 0.57, 0.23), skin, -0.3, 0, 0, 0.75);
    hand(G, V3(0.26, 0.55, 0.23), skin, -1.2, 0, 0, 0.75);
    // tiền vàng rơi từ tay phải
    const coins = new THREE.Group(); G.add(coins); G.userData.coins = coins;
    for (let i = 0; i < 7; i++) { const c = add(coins, new THREE.CylinderGeometry(0.022, 0.022, 0.006, 14), gold, -0.27 + (i % 2) * 0.02, 0.48 - i * 0.07, 0.25 + (i % 3) * 0.01, false); c.rotation.x = 1.2 + i * 0.4; }
    garland(G, [V3(-0.15, 0.9, 0.06), V3(-0.1, 0.62, 0.2), V3(0.1, 0.62, 0.2), V3(0.15, 0.9, 0.06)], 30, 0.022);
    // 2 voi hai bên (Gaja Lakshmi), vòi giơ cao
    for (const s of [-1, 1]) {
      const E = new THREE.Group(); E.position.set(s * 0.72, 0.2, -0.05); E.rotation.y = -s * 0.5; E.scale.setScalar(0.85); G.add(E);
      const grey = std('#8C8784', { roughness: 0.7 });
      sph(E, 0.2, grey, 0, 0.3, -0.05, 0.9, 0.85, 1.2); sph(E, 0.13, grey, 0, 0.5, 0.17);
      for (const t of [-1, 1]) sph(E, 0.11, grey, t * 0.12, 0.5, 0.14, 0.25, 1, 0.8);
      tube(E, [V3(0, 0.46, 0.26), V3(0, 0.36, 0.36), V3(0, 0.38, 0.46), V3(-s * 0.02, 0.56, 0.5), V3(-s * 0.06, 0.74, 0.44), V3(-s * 0.12, 0.84, 0.36)], 0.045, grey, false, 0.022);
      for (const t of [-1, 1]) { const tk = add(E, new THREE.ConeGeometry(0.014, 0.1, 8), std('#F4EEDC'), t * 0.05, 0.4, 0.3); tk.rotation.x = 2.2; }
      for (const t of [-1, 1]) sph(E, 0.012, dark, t * 0.07, 0.54, 0.25);
      add(E, new THREE.BoxGeometry(0.12, 0.03, 0.02), std('#C8162C'), 0, 0.6, 0.26); // trang sức trán
      const pot = new THREE.Group(); pot.position.set(-s * 0.13, 0.9, 0.33); pot.rotation.z = -s * 1.1; E.add(pot);
      add(pot, new THREE.LatheGeometry([[0, -0.06], [0.05, -0.05], [0.065, 0.0], [0.045, 0.05], [0.03, 0.065], [0.04, 0.08]].map(([x, y]) => new THREE.Vector2(x, y)), 20), gold);
      E.updateMatrixWorld(true); const mouth = pot.localToWorld(V3(0, 0.085, 0)); const tip = V3(s * 0.2, 1.3, 0.06);
      tube(G, [mouth, V3((mouth.x + tip.x) / 2, mouth.y + 0.12, (mouth.z + tip.z) / 2), tip, V3(s * 0.12, 1.2, 0.07)], 0.012, std('#9ED2F2', { transparent: true, opacity: 0.6, roughness: 0.1 }));
      for (const [x, z] of [[-0.1, 0.1], [0.1, 0.1], [-0.1, -0.18], [0.1, -0.18]]) cyl(E, 0.05, 0.055, 0.2, grey, x, 0.08, z);
      add(E, new THREE.BoxGeometry(0.3, 0.02, 0.3), std('#B81E2A'), 0, 0.47, -0.05);
    }
    prabhavali(G, 1.35, 1.7, -0.02, -0.34, gold);
    return G;
  }

  // ---------------- Hanuman ----------------
  function makeHanuman(M) {
    const G = new THREE.Group();
    const skin = std('#E2551E', { roughness: 0.5 }), skinD = std('#B8401A', { roughness: 0.55 }), gold = M.gold, cloth = std('#C81E1E', { roughness: 0.7 }), dark = std('#1E1410'), white = std('#F4EEDC');
    // đứng: chân, khố đỏ
    for (const s of [-1, 1]) { limb(G, V3(s * 0.11, 0.6, 0), V3(s * 0.13, 0.28, 0.03), 0.075, skin, 0.06); limb(G, V3(s * 0.13, 0.28, 0.03), V3(s * 0.14, 0.04, 0.02), 0.06, skin, 0.05); sph(G, 0.06, skin, s * 0.14, 0.02, 0.07, 0.9, 0.5, 1.6); add(G, new THREE.TorusGeometry(0.05, 0.012, 6, 16), gold, s * 0.14, 0.09, 0.02).rotation.x = Math.PI / 2; }
    add(G, lathe([[0, 0], [0.2, 0], [0.22, 0.14], [0.2, 0.24], [0, 0.26]], 32), cloth, 0, 0.5, 0);
    // thân
    sph(G, 0.2, skin, 0, 0.88, 0.02, 1.2, 1.15, 0.85);
    sph(G, 0.17, skin, 0, 1.1, 0.0, 1.45, 0.75, 0.85);
    add(G, new THREE.TorusGeometry(0.2, 0.02, 8, 32), gold, 0, 0.76, 0.02).rotation.x = Math.PI / 2;
    tube(G, [V3(-0.2, 1.18, 0.06), V3(-0.05, 1.0, 0.18), V3(0.12, 0.82, 0.18), V3(0.2, 0.72, 0.08)], 0.01, white);
    // đầu khỉ: mõm nhô
    const H = new THREE.Group(); H.position.set(0, 1.38, 0.02); G.add(H);
    sph(H, 0.15, skin, 0, 0, 0, 1.0, 1.05, 0.95);
    sph(H, 0.1, skinD, 0, -0.06, 0.1, 1.15, 0.8, 0.85);
    for (const s of [-1, 1]) { sph(H, 0.022, white, s * 0.055, 0.03, 0.13, 1.2, 0.8, 0.5); sph(H, 0.012, dark, s * 0.055, 0.03, 0.143); sph(H, 0.05, skin, s * 0.15, 0.0, 0.0, 0.4, 0.9, 0.7); }
    add(H, new THREE.BoxGeometry(0.1, 0.012, 0.01), dark, 0, -0.08, 0.19);
    add(H, new THREE.BoxGeometry(0.015, 0.06, 0.01), white, 0, 0.1, 0.14); // tilak
    mukut(H, 0.1, 0.12, 0.3, gold);
    // tay phải: abhaya; tay trái: chùy gada tựa vai
    limb(G, V3(-0.24, 1.14, 0), V3(-0.32, 0.92, 0.1), 0.06, skin, 0.05); limb(G, V3(-0.32, 0.92, 0.1), V3(-0.28, 1.1, 0.26), 0.05, skin, 0.045);
    hand(G, V3(-0.28, 1.17, 0.28), skin, -0.15, 0, 0, 0.95);
    limb(G, V3(0.24, 1.14, 0), V3(0.32, 0.9, 0.08), 0.06, skin, 0.05); limb(G, V3(0.32, 0.9, 0.08), V3(0.3, 0.98, 0.24), 0.05, skin, 0.045);
    hand(G, V3(0.3, 1.0, 0.26), skin, -1.3, 0, 0, 0.9);
    const gada = new THREE.Group(); gada.position.set(0.3, 1.0, 0.27); gada.rotation.set(-0.35, 0, -0.35); G.add(gada);
    cyl(gada, 0.018, 0.018, 0.6, gold, 0, 0.25, 0, 10);
    add(gada, lathe([[0, 0], [0.08, 0.03], [0.13, 0.12], [0.12, 0.22], [0.06, 0.28], [0.02, 0.3], [0, 0.32]], 24), gold, 0, 0.52, 0);
    for (const s of [-1, 1]) for (const [x, y, z] of [[s * 0.31, 0.95, 0.09]]) add(G, new THREE.TorusGeometry(0.06, 0.012, 6, 16), gold, x, y, z).rotation.x = Math.PI / 2;
    // đuôi cong lên sau lưng
    { const tp = [V3(0, 0.62, -0.15), V3(0.1, 0.5, -0.32), V3(0.28, 0.7, -0.38), V3(0.38, 1.1, -0.3), V3(0.38, 1.42, -0.24)];
      const c = V3(0.28, 1.56, -0.2); for (let i = 0; i <= 16; i++) { const a = -0.3 + i / 16 * Math.PI * 1.7, r = 0.11 * (1 - i / 16 * 0.55); tp.push(V3(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.z)); }
      tube(G, tp, 0.035, skin, false, 0.014); }
    garland(G, [V3(-0.16, 1.24, 0.08), V3(-0.12, 0.92, 0.22), V3(0.12, 0.92, 0.22), V3(0.16, 1.24, 0.08)], 34, 0.024);
    prabhavali(G, 1.15, 1.95, -0.02, -0.42, gold);
    return G;
  }

  // ---------------- Krishna ----------------
  function makeKrishna(M) {
    const G = new THREE.Group();
    const skin = std('#3E5FA8', { roughness: 0.45 }), pit = std('#F2B416', { roughness: 0.6 }), gold = M.gold, dark = std('#141018'), white = std('#F4F0E6'), green = std('#1E7A5A', { roughness: 0.5 });
    // tư thế tribhanga: hông lệch, chân phải bắt chéo
    G.rotation.y = 0;
    limb(G, V3(-0.09, 0.62, 0), V3(-0.1, 0.32, 0.02), 0.07, skin, 0.055); limb(G, V3(-0.1, 0.32, 0.02), V3(-0.1, 0.04, 0.02), 0.055, skin, 0.045);
    limb(G, V3(0.09, 0.62, 0), V3(0.0, 0.32, 0.06), 0.07, skin, 0.055); limb(G, V3(0.0, 0.32, 0.06), V3(-0.18, 0.06, 0.08), 0.055, skin, 0.045);
    sph(G, 0.05, skin, -0.1, 0.02, 0.07, 0.9, 0.5, 1.6); sph(G, 0.05, skin, -0.2, 0.04, 0.13, 0.9, 0.5, 1.6);
    // dhoti vàng (pitambar)
    add(G, lathe([[0.0, 0], [0.19, 0.0], [0.2, 0.1], [0.17, 0.3], [0.13, 0.42], [0, 0.44]], 32), pit, 0.02, 0.36, 0).rotation.z = 0.06;
    
    // thân
    sph(G, 0.13, skin, 0.03, 0.93, 0.0, 0.9, 1.35, 0.62);
    sph(G, 0.15, skin, 0.03, 1.13, 0.0, 1.15, 0.65, 0.66);
    tube(G, [V3(-0.18, 0.9, 0.1), V3(-0.1, 0.8, 0.18), V3(0.16, 0.95, 0.12), V3(0.2, 1.15, 0.05)], 0.03, pit); // khăn vắt
    // đầu
    const H = new THREE.Group(); H.position.set(0.05, 1.36, 0.0); H.rotation.z = -0.12; G.add(H);
    sph(H, 0.12, skin, 0, 0, 0, 0.92, 1.05, 0.95);
    sph(H, 0.125, dark, 0, 0.04, -0.02, 0.98, 1.0, 0.95);
    for (const s of [-1, 1]) { sph(H, 0.018, white, s * 0.042, 0.005, 0.104, 1.3, 0.7, 0.5); sph(H, 0.01, dark, s * 0.042, 0.005, 0.112); }
    add(H, new THREE.BoxGeometry(0.008, 0.05, 0.01), std('#E8A0B0'), 0, 0.06, 0.115); // tilak Vaishnava
    sph(H, 0.012, std('#B02840'), 0, -0.06, 0.105, 1.6, 0.6, 0.6);
    mukut(H, 0.08, 0.1, 0.24, gold);
    // lông công
    const feather = new THREE.Group(); feather.position.set(0.06, 0.3, -0.02); feather.rotation.z = -0.35; H.add(feather);
    cyl(feather, 0.005, 0.005, 0.3, std('#7A6A40'), 0, 0.1, 0, 6);
    sph(feather, 0.07, green, 0, 0.26, 0, 0.6, 1.2, 0.15); sph(feather, 0.04, std('#2A6AB8'), 0, 0.26, 0.01, 0.6, 1.1, 0.15); sph(feather, 0.018, std('#1A1A50'), 0, 0.26, 0.02, 0.8, 1, 0.2);
    // tay cầm sáo nằm ngang sang phải người xem
    const flute = new THREE.Group(); flute.position.set(-0.02, 1.25, 0.2); flute.rotation.z = -0.25; G.add(flute);
    const fl = cyl(flute, 0.014, 0.014, 0.5, std('#8A5A2A', { roughness: 0.5 }), -0.12, 0, 0, 10); fl.rotation.z = Math.PI / 2;
    for (const x of [-0.3, 0.05]) add(flute, new THREE.TorusGeometry(0.016, 0.004, 6, 12), gold, x, 0, 0).rotation.y = Math.PI / 2;
    limb(G, V3(-0.19, 1.14, 0), V3(-0.3, 0.98, 0.12), 0.05, skin, 0.045); limb(G, V3(-0.3, 0.98, 0.12), V3(-0.3, 1.2, 0.22), 0.045, skin, 0.04);
    hand(G, V3(-0.3, 1.23, 0.22), skin, -0.3, 0.4, 1.5, 0.75);
    limb(G, V3(0.24, 1.14, 0), V3(0.26, 0.98, 0.14), 0.05, skin, 0.045); limb(G, V3(0.26, 0.98, 0.14), V3(0.05, 1.18, 0.24), 0.045, skin, 0.04);
    hand(G, V3(0.02, 1.2, 0.24), skin, -0.3, -0.4, -1.5, 0.75);
    for (const [x, y, z] of [[-0.3, 1.0, 0.12], [0.26, 1.0, 0.14]]) add(G, new THREE.TorusGeometry(0.05, 0.01, 6, 16), gold, x, y, z).rotation.x = Math.PI / 2;
    // vòng hoa vaijayanti dài
    garland(G, [V3(-0.14, 1.22, 0.06), V3(-0.15, 0.8, 0.2), V3(-0.05, 0.5, 0.24), V3(0.1, 0.5, 0.24), V3(0.2, 0.8, 0.2), V3(0.17, 1.22, 0.06)], 52, 0.022);
    prabhavali(G, 1.1, 1.9, -0.02, -0.35, gold);
    return G;
  }

  window.Deities = { makeGanesha, makeLinga, makeNandi, makeLakshmi, makeHanuman, makeKrishna, garland, helpers: { add, sph, cyl, lathe, tube, limb, std } };
})();

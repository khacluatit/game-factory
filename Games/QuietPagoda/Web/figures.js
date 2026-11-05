// Tượng Phật, Bồ Tát và khách hành hương — dựng bằng code (Three.js, không cần model ngoài).
(function () {
  'use strict';
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const UP = V3(0, 1, 0);

  function add(parent, geo, mat, x, y, z, cast) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = cast !== false; m.receiveShadow = true; parent.add(m); return m;
  }
  // khối trụ bo tròn nối 2 điểm (tay, chân)
  function limb(parent, a, b, r, mat) {
    const d = b.clone().sub(a), len = Math.max(d.length() - 2 * r, 0.001);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, d.normalize()); m.castShadow = true; parent.add(m); return m;
  }
  function setLimb(m, a, b) { const d = b.clone().sub(a); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); }
  const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg || 40);
  // cánh sen: hình giọt nước nhọn đầu
  function petalGeo(w, h, d) {
    const g = new THREE.SphereGeometry(1, 18, 14), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = y > 0 ? 1 - Math.pow(y, 1.4) * 0.92 : 1; p.setX(i, p.getX(i) * k * w); p.setZ(i, p.getZ(i) * k * d); p.setY(i, y * h); }
    g.computeVertexNormals(); return g;
  }
  function lotusRing(parent, n, radius, y, w, h, d, tilt, mat, offset) {
    const geo = petalGeo(w, h, d);
    for (let i = 0; i < n; i++) {
      const a = (i + (offset || 0)) / n * Math.PI * 2;
      const pv = new THREE.Group(); pv.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius); pv.rotation.y = -a + Math.PI / 2; parent.add(pv);
      const m = new THREE.Mesh(geo, mat); m.rotation.x = -tilt; m.position.y = h * 0.6; m.castShadow = true; pv.add(m);
    }
  }
  // mắt nhắm, lông mày, miệng: các cung tròn nhỏ
  function arc(parent, r, tube, mat, x, y, z, rotZ, faceY) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 16, Math.PI), mat);
    m.position.set(x, y, z); m.rotation.set(0, faceY || 0, rotZ || 0); parent.add(m); return m;
  }
  function fibSphere(n, minY) { const pts = []; for (let i = 0; i < n * 3 && pts.length < n; i++) { const y = 1 - (i / (n * 3 - 1)) * 2, r = Math.sqrt(1 - y * y), t = i * 2.39996; if (y > minY) pts.push(V3(Math.cos(t) * r, y, Math.sin(t) * r)); } return pts; }
  function curls(parent, center, R, n, minY, size, mat, skipFront) {
    const pts = fibSphere(n, minY).filter(p => !(skipFront && p.z > 0.55 && p.y < 0.5));
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(size, 8, 6), mat, pts.length);
    const m4 = new THREE.Matrix4();
    pts.forEach((p, i) => { m4.makeTranslation(center.x + p.x * R, center.y + p.y * R, center.z + p.z * R); im.setMatrixAt(i, m4); });
    im.castShadow = true; parent.add(im); return im;
  }

  // ---------- Phật Thích Ca ngồi thiền (mặt nhìn +z) ----------
  function makeBuddha(gold, goldDark, glowTex) {
    const B = new THREE.Group();
    add(B, new THREE.CylinderGeometry(1.05, 1.15, 0.28, 8), goldDark, 0, 0.14, 0);
    add(B, new THREE.CylinderGeometry(0.95, 1.02, 0.12, 32), gold, 0, 0.34, 0);
    lotusRing(B, 20, 0.92, 0.36, 0.2, 0.3, 0.08, 0.75, gold, 0);
    lotusRing(B, 14, 0.7, 0.42, 0.22, 0.32, 0.09, 0.45, gold, 0.5);
    add(B, new THREE.CylinderGeometry(0.78, 0.82, 0.1, 32), gold, 0, 0.55, 0);
    // chân xếp bằng
    const lap = add(B, new THREE.SphereGeometry(1, 32, 20), gold, 0, 0.78, 0.08); lap.scale.set(0.95, 0.26, 0.62);
    limb(B, V3(-0.62, 0.84, 0.32), V3(0.42, 0.86, 0.5), 0.16, gold);
    limb(B, V3(0.62, 0.9, 0.3), V3(-0.4, 0.92, 0.46), 0.15, gold);
    const f1 = add(B, new THREE.SphereGeometry(0.12, 16, 10), gold, 0.4, 1.02, 0.42); f1.scale.set(1.3, 0.5, 0.8);
    const f2 = add(B, new THREE.SphereGeometry(0.12, 16, 10), gold, -0.38, 1.04, 0.36); f2.scale.set(1.3, 0.5, 0.8);
    // thân
    const torso = add(B, lathe([[0, 0], [0.54, 0], [0.57, 0.15], [0.52, 0.4], [0.47, 0.6], [0.49, 0.76], [0.44, 0.88], [0.27, 0.98], [0.15, 1.03], [0, 1.04]], 48), gold, 0, 0.88, 0);
    torso.scale.z = 0.78;
    // nếp áo cà sa vắt vai trái
    for (let k = 0; k < 4; k++) { const s = add(B, new THREE.TorusGeometry(0.52 - k * 0.07, 0.022, 8, 40, Math.PI * 0.9), goldDark, 0.05, 1.32 - k * 0.12, 0.1); s.rotation.set(0.15, 0, -0.75 - k * 0.04); s.scale.z = 0.8; }
    // tay: thủ ấn thiền định
    limb(B, V3(-0.46, 1.7, 0.02), V3(-0.58, 1.22, 0.16), 0.1, gold); limb(B, V3(-0.58, 1.22, 0.16), V3(-0.18, 1.0, 0.42), 0.095, gold);
    limb(B, V3(0.46, 1.7, 0.02), V3(0.58, 1.22, 0.16), 0.1, gold); limb(B, V3(0.58, 1.22, 0.16), V3(0.18, 1.0, 0.42), 0.095, gold);
    const h1 = add(B, new THREE.SphereGeometry(0.13, 16, 10), gold, -0.06, 1.02, 0.44); h1.scale.set(1.4, 0.45, 0.9);
    const h2 = add(B, new THREE.SphereGeometry(0.13, 16, 10), gold, 0.06, 1.06, 0.45); h2.scale.set(1.4, 0.45, 0.9);
    // cổ ba ngấn
    add(B, new THREE.CylinderGeometry(0.15, 0.17, 0.2, 24), gold, 0, 2.0, 0);
    for (let k = 0; k < 3; k++) { const t = add(B, new THREE.TorusGeometry(0.155, 0.012, 6, 24), goldDark, 0, 1.95 + k * 0.05, 0, false); t.rotation.x = Math.PI / 2; }
    // đầu
    const head = new THREE.Group(); head.position.set(0, 2.36, 0.02); B.add(head);
    const skull = add(head, new THREE.SphereGeometry(0.34, 40, 30), gold, 0, 0, 0); skull.scale.set(1, 1.12, 0.98);
    for (const s of [-1, 1]) { const e = add(head, new THREE.CapsuleGeometry(0.055, 0.28, 6, 10), gold, s * 0.34, -0.1, 0); e.rotation.z = s * 0.08; }
    curls(head, V3(0, 0.02, 0), 0.35, 150, 0.05, 0.038, goldDark, true);
    add(head, new THREE.SphereGeometry(0.17, 24, 16), gold, 0, 0.38, -0.02);
    curls(head, V3(0, 0.38, -0.02), 0.17, 40, -0.2, 0.03, goldDark, false);
    const line = goldDark;
    arc(head, 0.06, 0.006, line, -0.115, 0.01, 0.332, Math.PI);   // mắt nhắm
    arc(head, 0.06, 0.006, line, 0.115, 0.01, 0.332, Math.PI);
    arc(head, 0.08, 0.005, line, -0.115, 0.1, 0.322, 0);          // lông mày
    arc(head, 0.08, 0.005, line, 0.115, 0.1, 0.322, 0);
    const nose = add(head, new THREE.ConeGeometry(0.035, 0.12, 12), gold, 0, -0.05, 0.36); nose.rotation.x = 0.35;
    arc(head, 0.032, 0.007, line, 0, -0.16, 0.332, Math.PI);       // môi mỉm
    add(head, new THREE.SphereGeometry(0.018, 10, 8), goldDark, 0, 0.16, 0.33, false); // bạch hào
    // hào quang + vầng lửa
    const haloMat = new THREE.MeshBasicMaterial({ map: glowTex, color: '#FFD9A0', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), haloMat); halo.position.set(0, 2.36, -0.46); B.add(halo);
    const ring = add(B, new THREE.TorusGeometry(0.62, 0.035, 10, 64), gold, 0, 2.36, -0.42); ring.castShadow = false;
    const ring2 = add(B, new THREE.TorusGeometry(0.52, 0.015, 8, 64), goldDark, 0, 2.36, -0.42, false);
    const sh = new THREE.Shape(); sh.moveTo(0, 3.6); sh.bezierCurveTo(0.5, 3.0, 1.35, 2.4, 1.25, 1.3); sh.bezierCurveTo(1.2, 0.6, 0.8, 0.3, 0, 0.3); sh.bezierCurveTo(-0.8, 0.3, -1.2, 0.6, -1.25, 1.3); sh.bezierCurveTo(-1.35, 2.4, -0.5, 3.0, 0, 3.6);
    const mand = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 32 }), goldDark);
    mand.position.set(0, 0.2, -0.62); mand.receiveShadow = true; B.add(mand);
    const inner = new THREE.Mesh(new THREE.ShapeGeometry(sh, 32), new THREE.MeshBasicMaterial({ color: '#3A1712', fog: false })); inner.scale.set(0.9, 0.92, 1); inner.position.set(0, 0.32, -0.5); B.add(inner);
    B.userData.halo = haloMat;
    return B;
  }

  // ---------- Quan Thế Âm đứng, sứ trắng (mặt nhìn +z) ----------
  function makeQuanAm(porcelain, gold, glowTex) {
    const G = new THREE.Group();
    const pink = new THREE.MeshStandardMaterial({ color: '#E9B7C2', roughness: 0.5 });
    add(G, new THREE.CylinderGeometry(0.42, 0.48, 0.14, 24), gold, 0, 0.07, 0);
    lotusRing(G, 14, 0.38, 0.12, 0.12, 0.18, 0.05, 0.6, pink, 0);
    add(G, new THREE.CylinderGeometry(0.34, 0.36, 0.06, 24), pink, 0, 0.24, 0);
    const robe = add(G, lathe([[0, 0], [0.36, 0], [0.34, 0.15], [0.29, 0.6], [0.25, 1.0], [0.24, 1.25], [0.29, 1.45], [0.26, 1.55], [0.12, 1.62], [0, 1.63]], 40), porcelain, 0, 0.27, 0); robe.scale.z = 0.8;
    for (let k = 0; k < 5; k++) { const f = add(G, new THREE.CapsuleGeometry(0.018, 0.9, 4, 8), porcelain, -0.2 + k * 0.1, 0.75, 0.25 - Math.abs(k - 2) * 0.02, false); f.rotation.x = -0.06; }
    // khăn trùm đầu
    const veil = add(G, lathe([[0.0, 0.42], [0.16, 0.38], [0.23, 0.2], [0.25, 0.0], [0.3, -0.25], [0.34, -0.38], [0.3, -0.4]], 36), porcelain, 0, 1.98, -0.02); veil.scale.z = 0.95;
    const head = new THREE.Group(); head.position.set(0, 2.0, 0.03); G.add(head);
    const face = add(head, new THREE.SphereGeometry(0.17, 32, 24), porcelain, 0, 0, 0); face.scale.set(0.95, 1.12, 0.95);
    const line = new THREE.MeshStandardMaterial({ color: '#7A6A60', roughness: 0.6 });
    arc(head, 0.035, 0.006, line, -0.06, 0.01, 0.16, Math.PI); arc(head, 0.035, 0.006, line, 0.06, 0.01, 0.16, Math.PI);
    arc(head, 0.022, 0.006, new THREE.MeshStandardMaterial({ color: '#C77A80' }), 0, -0.08, 0.158, Math.PI);
    add(head, new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshStandardMaterial({ color: '#C9463A' }), 0, 0.08, 0.16, false);
    add(head, new THREE.SphereGeometry(0.08, 16, 12), porcelain, 0, 0.2, -0.02); // búi tóc dưới khăn
    // tay: tay phải cầm cành dương liễu, tay trái cầm bình cam lồ
    limb(G, V3(0.26, 1.7, 0.02), V3(0.3, 1.38, 0.14), 0.06, porcelain); limb(G, V3(0.3, 1.38, 0.14), V3(0.16, 1.55, 0.3), 0.055, porcelain);
    add(G, new THREE.SphereGeometry(0.05, 12, 8), porcelain, 0.15, 1.58, 0.32);
    const twig = limb(G, V3(0.14, 1.58, 0.33), V3(0.12, 1.92, 0.42), 0.008, new THREE.MeshStandardMaterial({ color: '#5E6B3A' }));
    const leaf = new THREE.MeshStandardMaterial({ color: '#7E9A56', roughness: 0.7 });
    for (let k = 0; k < 6; k++) { const l = add(G, new THREE.SphereGeometry(0.03, 8, 6), leaf, 0.12 + Math.sin(k) * 0.05, 1.86 - k * 0.04, 0.43 + Math.cos(k) * 0.03, false); l.scale.set(0.5, 1.6, 0.3); l.rotation.z = 0.6 * (k % 2 ? 1 : -1); }
    limb(G, V3(-0.26, 1.7, 0.02), V3(-0.3, 1.28, 0.1), 0.06, porcelain); limb(G, V3(-0.3, 1.28, 0.1), V3(-0.12, 1.18, 0.28), 0.055, porcelain);
    add(G, new THREE.SphereGeometry(0.05, 12, 8), porcelain, -0.1, 1.2, 0.3);
    add(G, lathe([[0, 0], [0.05, 0], [0.07, 0.06], [0.05, 0.13], [0.02, 0.17], [0.025, 0.22], [0, 0.22]], 20), new THREE.MeshPhysicalMaterial({ color: '#BFD9D2', roughness: 0.15, clearcoat: 1 }), -0.08, 1.16, 0.34);
    const haloMat = new THREE.MeshBasicMaterial({ map: glowTex, color: '#FFF0D0', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), haloMat); halo.position.set(0, 2.05, -0.3); G.add(halo);
    add(G, new THREE.TorusGeometry(0.32, 0.02, 8, 48), gold, 0, 2.05, -0.25, false);
    return G;
  }

  // ---------- Địa Tạng Bồ Tát đứng, cầm tích trượng (mặt nhìn +z) ----------
  function makeDiaTang(gold, goldDark, glowTex) {
    const G = new THREE.Group();
    add(G, new THREE.CylinderGeometry(0.42, 0.48, 0.14, 24), goldDark, 0, 0.07, 0);
    lotusRing(G, 14, 0.38, 0.12, 0.12, 0.18, 0.05, 0.6, gold, 0.5);
    add(G, new THREE.CylinderGeometry(0.34, 0.36, 0.06, 24), gold, 0, 0.24, 0);
    const robe = add(G, lathe([[0, 0], [0.36, 0], [0.33, 0.2], [0.29, 0.7], [0.26, 1.1], [0.3, 1.42], [0.27, 1.52], [0.12, 1.58], [0, 1.59]], 40), gold, 0, 0.27, 0); robe.scale.z = 0.8;
    for (let k = 0; k < 3; k++) { const s = add(G, new THREE.TorusGeometry(0.3 - k * 0.04, 0.014, 8, 32, Math.PI * 0.9), goldDark, 0.03, 1.55 - k * 0.12, 0.05, false); s.rotation.set(0.1, 0, -0.8); s.scale.z = 0.8; }
    const head = new THREE.Group(); head.position.set(0, 2.0, 0.02); G.add(head);
    const skull = add(head, new THREE.SphereGeometry(0.17, 32, 24), gold, 0, 0, 0); skull.scale.set(0.98, 1.1, 1);
    for (const s of [-1, 1]) add(head, new THREE.CapsuleGeometry(0.025, 0.12, 4, 8), gold, s * 0.17, -0.04, 0);
    arc(head, 0.035, 0.006, goldDark, -0.06, 0.01, 0.165, Math.PI); arc(head, 0.035, 0.006, goldDark, 0.06, 0.01, 0.165, Math.PI);
    arc(head, 0.022, 0.006, goldDark, 0, -0.08, 0.162, Math.PI);
    add(G, new THREE.CylinderGeometry(0.06, 0.07, 0.12, 16), gold, 0, 1.86, 0.02);
    // tích trượng
    limb(G, V3(0.34, 0.3, 0.2), V3(0.34, 2.55, 0.2), 0.018, gold);
    for (let k = 0; k < 3; k++) { const r = add(G, new THREE.TorusGeometry(0.09 - k * 0.015, 0.008, 6, 20), gold, 0.34, 2.45 + k * 0.05, 0.2, false); r.rotation.y = k * 0.6; }
    add(G, new THREE.SphereGeometry(0.03, 10, 8), gold, 0.34, 2.6, 0.2, false);
    limb(G, V3(0.26, 1.66, 0.02), V3(0.32, 1.28, 0.16), 0.06, gold); limb(G, V3(0.32, 1.28, 0.16), V3(0.34, 1.45, 0.2), 0.055, gold);
    limb(G, V3(-0.26, 1.66, 0.02), V3(-0.28, 1.28, 0.12), 0.06, gold); limb(G, V3(-0.28, 1.28, 0.12), V3(-0.08, 1.3, 0.3), 0.055, gold);
    add(G, new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshStandardMaterial({ color: '#F6E2A8', emissive: '#FFC870', emissiveIntensity: 0.9 }), -0.06, 1.38, 0.32, false);
    const haloMat = new THREE.MeshBasicMaterial({ map: glowTex, color: '#FFD9A0', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), haloMat); halo.position.set(0, 2.02, -0.3); G.add(halo);
    add(G, new THREE.TorusGeometry(0.32, 0.02, 8, 48), gold, 0, 2.02, -0.25, false);
    return G;
  }

  // ---------- Khách hành hương chibi ----------
  const SKIN = ['#EBC7A2', '#E2B590', '#D9A780', '#F0D2B2'];
  const HAIR = ['#24170F', '#2E2018', '#3A2A20', '#8A8580'];
  const STYLES = ['short', 'bun', 'long', 'short', 'bun', 'bald'];
  function makeAvatar(opts) {
    opts = opts || {};
    const robeColor = opts.robe || '#7D8A96', style = opts.style || STYLES[Math.floor(Math.random() * STYLES.length)];
    const skin = new THREE.MeshStandardMaterial({ color: opts.skin || SKIN[Math.floor(Math.random() * SKIN.length)], roughness: 0.65 });
    const hairM = new THREE.MeshStandardMaterial({ color: style === 'bald' ? '#24170F' : (opts.hair || HAIR[Math.floor(Math.random() * HAIR.length)]), roughness: 0.85 });
    const robe = new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.85 });
    const trim = new THREE.MeshStandardMaterial({ color: new THREE.Color(robeColor).multiplyScalar(0.62), roughness: 0.85 });
    const dark = new THREE.MeshStandardMaterial({ color: '#3A2620', roughness: 0.7 });
    const blush = new THREE.MeshBasicMaterial({ color: '#F09A9A', transparent: true, opacity: 0.45, depthWrite: false });
    const g = new THREE.Group(), p = new THREE.Group(); g.add(p);
    // chân xếp bằng (khi ngồi)
    const sitLegs = new THREE.Group(); g.add(sitLegs);
    limb(sitLegs, V3(-0.3, 0.09, -0.02), V3(0.18, 0.09, -0.2), 0.09, robe);
    limb(sitLegs, V3(0.3, 0.11, -0.02), V3(-0.18, 0.11, -0.2), 0.085, robe);
    add(sitLegs, new THREE.SphereGeometry(0.06, 12, 8), skin, 0.2, 0.12, -0.22).scale.set(1, 0.6, 1.4);
    add(sitLegs, new THREE.SphereGeometry(0.06, 12, 8), skin, -0.2, 0.14, -0.2).scale.set(1, 0.6, 1.4);
    // chân đứng (khi đi)
    const standLegs = new THREE.Group(); g.add(standLegs);
    const legL = limb(standLegs, V3(-0.1, 0.3, 0), V3(-0.1, 0.06, 0), 0.07, trim), legR = limb(standLegs, V3(0.1, 0.3, 0), V3(0.1, 0.06, 0), 0.07, trim);
    const footL = add(standLegs, new THREE.SphereGeometry(0.065, 12, 8), dark, -0.1, 0.04, -0.03), footR = add(standLegs, new THREE.SphereGeometry(0.065, 12, 8), dark, 0.1, 0.04, -0.03);
    footL.scale.set(1, 0.6, 1.5); footR.scale.set(1, 0.6, 1.5);
    // thân áo tràng
    p.position.y = 0.1;
    const body = add(p, lathe([[0, 0], [0.34, 0], [0.33, 0.12], [0.27, 0.32], [0.24, 0.44], [0.25, 0.5], [0.16, 0.56], [0.1, 0.58], [0, 0.58]], 28), robe, 0, 0, 0); body.scale.z = 0.86;
    const belt = add(p, new THREE.TorusGeometry(0.3, 0.02, 6, 28), trim, 0, 0.12, 0, false); belt.rotation.x = Math.PI / 2; belt.scale.y = 0.86;
    const collarL = limb(p, V3(-0.12, 0.56, -0.08), V3(0.05, 0.3, -0.25), 0.022, trim), collarR = limb(p, V3(0.12, 0.56, -0.08), V3(-0.02, 0.33, -0.25), 0.022, trim);
    // tay
    const armL = { up: limb(p, V3(-0.24, 0.5, 0), V3(-0.27, 0.32, -0.08), 0.07, robe), lo: limb(p, V3(-0.27, 0.32, -0.08), V3(-0.04, 0.4, -0.27), 0.065, robe), hand: add(p, new THREE.SphereGeometry(0.055, 12, 8), skin, -0.03, 0.42, -0.28) };
    const armR = { up: limb(p, V3(0.24, 0.5, 0), V3(0.27, 0.32, -0.08), 0.07, robe), lo: limb(p, V3(0.27, 0.32, -0.08), V3(0.04, 0.4, -0.27), 0.065, robe), hand: add(p, new THREE.SphereGeometry(0.055, 12, 8), skin, 0.03, 0.42, -0.28) };
    // đầu
    const head = new THREE.Group(); head.position.y = 0.84; p.add(head);
    const skull = add(head, new THREE.SphereGeometry(0.28, 32, 24), skin, 0, 0, 0); skull.scale.set(1, 0.96, 0.96);
    for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.05, 10, 8), skin, s * 0.27, -0.02, 0.02, false);
    arc(head, 0.04, 0.01, dark, -0.1, -0.01, -0.262, 0, Math.PI);   // mắt nhắm cong (mặt nhìn -z)
    arc(head, 0.04, 0.01, dark, 0.1, -0.01, -0.262, 0, Math.PI);
    arc(head, 0.025, 0.008, dark, 0, -0.1, -0.262, Math.PI, Math.PI);
    for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), blush); b.position.set(s * 0.16, -0.07, -0.25); b.rotation.y = Math.PI + s * 0.5; head.add(b); }
    if (style !== 'bald') {
      const cap = add(head, new THREE.SphereGeometry(0.295, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM, 0, 0.02, 0.02); cap.rotation.x = 0.5;
      const fringe = add(head, new THREE.SphereGeometry(0.29, 24, 10, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.18, Math.PI * 0.22), hairM, 0, 0.02, 0, false); fringe.rotation.y = Math.PI;
      if (style === 'bun' || style === 'long') add(head, new THREE.SphereGeometry(0.11, 16, 12), hairM, 0, 0.22, 0.2);
      if (style === 'long') { const back = add(head, new THREE.CapsuleGeometry(0.16, 0.32, 6, 12), hairM, 0, -0.2, 0.16); back.scale.z = 0.6; }
    } else {
      skull.material = skin;
    }
    const arms = { L: armL, R: armR };
    function setArms(mode) {
      const sh = { L: V3(-0.24, 0.5, 0), R: V3(0.24, 0.5, 0) };
      for (const k of ['L', 'R']) {
        const s = k === 'L' ? -1 : 1, a = arms[k];
        let el, hd;
        if (mode === 'gassho') { el = V3(s * 0.27, 0.32, -0.1); hd = V3(s * 0.035, 0.46, -0.3); }
        else if (mode === 'lap') { el = V3(s * 0.3, 0.26, -0.08); hd = V3(s * 0.06, 0.2, -0.26); }
        else { el = V3(s * 0.3, 0.28, 0.02); hd = V3(s * 0.31, 0.08, -0.02); }
        setLimb(a.up, sh[k], el); setLimb(a.lo, el, hd); a.hand.position.copy(hd);
      }
    }
    function setPose(mode) {
      const standing = mode === 'stand';
      sitLegs.visible = !standing; standLegs.visible = standing;
      p.position.y = standing ? 0.3 : 0.1; setArms(standing ? 'hang' : (opts.armsSit || 'gassho'));
    }
    function walkCycle(t) { const s = Math.sin(t * 8) * 0.12; legL.position.z = s * 0.5; legR.position.z = -s * 0.5; footL.position.z = -0.03 + s; footR.position.z = -0.03 - s; }
    setPose('sit');
    g.userData = { pivot: p, body, robe, bowT: 0, small: false, setPose, setArms, walkCycle, style };
    return g;
  }

  // vệt bóng mềm dưới chân (thay ambient occlusion)
  let blobTex = null;
  function blob(scene, x, z, r, op) {
    if (!blobTex) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); blobTex = new THREE.CanvasTexture(c); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: op || 0.45, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.012, z); scene.add(m); return m;
  }

  // môi trường phản chiếu ấm cho vàng và sứ
  function warmEnv(renderer) {
    const es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.BoxGeometry(20, 10, 20), new THREE.MeshBasicMaterial({ color: '#3A1A10', side: THREE.BackSide })));
    const panel = (c, x, y, z, w, h, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry || 0; es.add(m); };
    panel('#FFD9A0', 0, 2, 9.5, 8, 4); panel('#FFB070', -9.5, 2, 0, 6, 3, Math.PI / 2); panel('#F6C98E', 9.5, 2, 0, 6, 3, Math.PI / 2);
    panel('#FFE8C0', 0, 4.9, 0, 6, 6); es.children[es.children.length - 1].rotation.x = Math.PI / 2;
    const pm = new THREE.PMREMGenerator(renderer); const tex = pm.fromScene(es, 0.04).texture; pm.dispose(); return tex;
  }

  window.Figures = { makeBuddha, makeQuanAm, makeDiaTang, makeAvatar, blob, warmEnv };
})();

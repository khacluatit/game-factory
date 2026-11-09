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

  // ---------- chi tiết dùng chung cho tượng đứng ----------
  // áo có nếp gấp: bán kính dao động theo góc, mạnh dần về phía gấu áo
  function foldLathe(pts, seg, folds, amp, upTo) {
    const g = lathe(pts, seg), p = g.attributes.position, maxY = pts[pts.length - 1][1];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i), r = Math.hypot(x, z); if (r < 1e-4) continue;
      const k = Math.max(0, 1 - y / (upTo * maxY)), f = 1 + amp * k * Math.sin(Math.atan2(z, x) * folds);
      p.setX(i, x * f); p.setZ(i, z * f);
    }
    g.computeVertexNormals(); return g;
  }
  function tube(parent, pts, r, mat, closed) { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, !!closed), 80, r, 10, !!closed), mat); m.castShadow = true; parent.add(m); return m; }
  function beadsAlong(parent, pts, n, r, mat, closed) { const c = new THREE.CatmullRomCurve3(pts, !!closed); const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 10, 8), mat, n); const m4 = new THREE.Matrix4(); for (let i = 0; i < n; i++) { const q = c.getPointAt(i / (closed ? n : n - 1)); m4.makeTranslation(q.x, q.y, q.z); im.setMatrixAt(i, m4); } im.castShadow = true; parent.add(im); return im; }
  // bàn tay có ngón (mặt lòng bàn tay hướng theo rotY)
  function hand(parent, pos, mat, rotX, rotY, rotZ) {
    const h = new THREE.Group(); h.position.copy(pos); h.rotation.set(rotX || 0, rotY || 0, rotZ || 0); parent.add(h);
    const palm = add(h, new THREE.SphereGeometry(0.048, 16, 12), mat, 0, 0, 0); palm.scale.set(1, 1.25, 0.5);
    for (let i = 0; i < 4; i++) { const f = add(h, new THREE.CapsuleGeometry(0.011, 0.05 - Math.abs(i - 1.5) * 0.008, 4, 8), mat, -0.03 + i * 0.02, 0.07, 0.004, false); f.rotation.x = 0.15; }
    const t = add(h, new THREE.CapsuleGeometry(0.012, 0.035, 4, 8), mat, 0.05, 0.015, 0.012, false); t.rotation.z = -0.9;
    return h;
  }
  // khuôn mặt tượng (nhìn +z): mắt khép nhìn xuống, mày cong, mũi, môi, bạch hào
  function statueFace(head, R, lineMat, lipMat, dotMat) {
    arc(head, R * 0.2, R * 0.022, lineMat, -R * 0.34, R * 0.02, R * 0.94, Math.PI);
    arc(head, R * 0.2, R * 0.022, lineMat, R * 0.34, R * 0.02, R * 0.94, Math.PI);
    arc(head, R * 0.28, R * 0.018, lineMat, -R * 0.34, R * 0.26, R * 0.9, 0);
    arc(head, R * 0.28, R * 0.018, lineMat, R * 0.34, R * 0.26, R * 0.9, 0);
    const n = add(head, new THREE.SphereGeometry(R * 0.11, 12, 10), head.children[0].material, 0, -R * 0.18, R * 0.97, false); n.scale.set(0.8, 1.5, 0.9);
    const l1 = add(head, new THREE.SphereGeometry(R * 0.1, 12, 8), lipMat, 0, -R * 0.45, R * 0.9, false); l1.scale.set(1.7, 0.45, 0.6);
    const l2 = add(head, new THREE.SphereGeometry(R * 0.09, 12, 8), lipMat, 0, -R * 0.53, R * 0.89, false); l2.scale.set(1.5, 0.5, 0.6);
    add(head, new THREE.SphereGeometry(R * 0.06, 10, 8), dotMat, 0, R * 0.42, R * 0.9, false);
  }
  function haloRings(G, y, z, r, gold, glowTex, color) {
    const haloMat = new THREE.MeshBasicMaterial({ map: glowTex, color: color || '#FFE6B8', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(r * 4.2, r * 4.2), haloMat); halo.position.set(0, y, z - 0.06); G.add(halo);
    add(G, new THREE.TorusGeometry(r, r * 0.07, 10, 64), gold, 0, y, z, false);
    add(G, new THREE.TorusGeometry(r * 0.78, r * 0.03, 8, 64), gold, 0, y, z, false);
    const ring = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; ring.push(V3(Math.cos(a) * r * 0.89, y + Math.sin(a) * r * 0.89, z)); }
    beadsAlong(G, ring, 24, r * 0.045, gold, true);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const pt = add(G, petalGeo(r * 0.06, r * 0.16, r * 0.02), gold, Math.cos(a) * r * 1.12, y + Math.sin(a) * r * 1.12, z, false); pt.rotation.z = a - Math.PI / 2; }
  }
  function sleeve(G, elbow, mat) { const s = add(G, lathe([[0, 0], [0.1, 0], [0.12, 0.03], [0.11, 0.12], [0.08, 0.3], [0.055, 0.4], [0, 0.42]], 24), mat, elbow.x * 1.04, elbow.y - 0.36, elbow.z - 0.02, true); s.scale.z = 0.6; return s; }

  // ---------- Quan Thế Âm đứng, sứ trắng (mặt nhìn +z) ----------
  function makeQuanAm(porcelain, gold, glowTex) {
    const G = new THREE.Group();
    const pinkP = porcelain.clone(); pinkP.color = new THREE.Color('#F2C6CF');
    const scarfM = porcelain.clone(); scarfM.color = new THREE.Color('#BCD3DC');
    const hairM = new THREE.MeshPhysicalMaterial({ color: '#4A5260', roughness: 0.35, clearcoat: 0.8 });
    const lineM = new THREE.MeshStandardMaterial({ color: '#6A5E58', roughness: 0.6 });
    const lipM = new THREE.MeshStandardMaterial({ color: '#D08A90', roughness: 0.5 });
    const redM = new THREE.MeshStandardMaterial({ color: '#C9463A', roughness: 0.4 });
    // đài sen
    add(G, new THREE.CylinderGeometry(0.5, 0.56, 0.14, 32), gold, 0, 0.07, 0);
    lotusRing(G, 18, 0.46, 0.12, 0.13, 0.2, 0.05, 0.75, pinkP, 0);
    lotusRing(G, 12, 0.34, 0.16, 0.13, 0.2, 0.05, 0.4, porcelain, 0.5);
    add(G, new THREE.CylinderGeometry(0.36, 0.38, 0.06, 32), porcelain, 0, 0.3, 0);
    // xiêm y nhiều nếp
    const robe = add(G, foldLathe([[0, 0], [0.4, 0], [0.37, 0.12], [0.31, 0.5], [0.27, 0.9], [0.25, 1.15], [0.27, 1.32], [0.3, 1.45], [0.27, 1.55], [0.14, 1.62], [0, 1.63]], 64, 11, 0.07, 0.75), porcelain, 0, 0.32, 0); robe.scale.z = 0.82;
    const hem = add(G, new THREE.TorusGeometry(0.39, 0.016, 8, 64), gold, 0, 0.34, 0, false); hem.rotation.x = Math.PI / 2; hem.scale.y = 0.82;
    const belt = add(G, new THREE.TorusGeometry(0.262, 0.02, 8, 48), gold, 0, 1.47, 0, false); belt.rotation.x = Math.PI / 2; belt.scale.y = 0.82;
    tube(G, [V3(-0.05, 1.45, 0.23), V3(-0.06, 1.2, 0.27), V3(-0.04, 0.9, 0.3), V3(-0.07, 0.62, 0.33)], 0.012, gold);
    tube(G, [V3(0.05, 1.45, 0.23), V3(0.06, 1.2, 0.27), V3(0.04, 0.9, 0.3), V3(0.07, 0.62, 0.33)], 0.012, gold);
    // chuỗi anh lạc
    add(G, new THREE.CylinderGeometry(0.07, 0.085, 0.14, 20), porcelain, 0, 1.98, 0);
    const neck = []; for (let i = 0; i <= 20; i++) { const a = Math.PI * (0.05 + 0.9 * i / 20); neck.push(V3(Math.cos(a) * 0.2, 1.86 - Math.sin(a) * 0.16, 0.08 + Math.sin(a) * 0.14)); }
    tube(G, neck, 0.012, gold); beadsAlong(G, neck, 15, 0.016, gold);
    add(G, new THREE.SphereGeometry(0.028, 12, 10), redM, 0, 1.7, 0.23, false);
    tube(G, [V3(-0.12, 1.78, 0.2), V3(-0.04, 1.55, 0.25), V3(0, 1.35, 0.26)], 0.008, gold); tube(G, [V3(0.12, 1.78, 0.2), V3(0.04, 1.55, 0.25), V3(0, 1.35, 0.26)], 0.008, gold);
    // dải lụa thiên y
    tube(G, [V3(-0.27, 1.86, -0.02), V3(-0.29, 1.5, 0.18), V3(-0.12, 1.05, 0.31), V3(0.12, 1.05, 0.31), V3(0.29, 1.5, 0.18), V3(0.27, 1.86, -0.02)], 0.014, scarfM);
    tube(G, [V3(-0.3, 1.78, 0.05), V3(-0.37, 1.3, 0.1), V3(-0.36, 0.9, 0.12), V3(-0.4, 0.5, 0.1)], 0.014, scarfM);
    tube(G, [V3(0.3, 1.78, 0.05), V3(0.37, 1.3, 0.1), V3(0.36, 0.9, 0.12), V3(0.4, 0.5, 0.1)], 0.014, scarfM);
    // tay phải giơ trước ngực cầm cành dương liễu
    limb(G, V3(0.27, 1.84, 0.02), V3(0.33, 1.52, 0.1), 0.055, porcelain); limb(G, V3(0.33, 1.52, 0.1), V3(0.18, 1.62, 0.3), 0.045, porcelain);
    sleeve(G, V3(0.32, 1.52, 0.12), porcelain);
    hand(G, V3(0.16, 1.66, 0.32), porcelain, -0.4, 0.4, 0.3);
    const branch = [V3(0.17, 1.7, 0.34), V3(0.22, 1.84, 0.4), V3(0.29, 1.97, 0.44), V3(0.37, 2.06, 0.46)];
    tube(G, branch, 0.006, new THREE.MeshStandardMaterial({ color: '#5E6B3A' }));
    const leaf = new THREE.MeshStandardMaterial({ color: '#7E9A56', roughness: 0.6 }), lc = new THREE.CatmullRomCurve3(branch);
    for (let k = 0; k < 14; k++) { const q = lc.getPointAt(0.2 + k * 0.057); const l = add(G, new THREE.SphereGeometry(0.026, 8, 6), leaf, q.x + (k % 2 ? 0.035 : -0.035), q.y - 0.04, q.z, false); l.scale.set(0.35, 1.9, 0.25); l.rotation.z = k % 2 ? -0.5 : 0.5; }
    // tay trái cầm tịnh bình
    limb(G, V3(-0.27, 1.84, 0.02), V3(-0.32, 1.42, 0.08), 0.055, porcelain); limb(G, V3(-0.32, 1.42, 0.08), V3(-0.15, 1.26, 0.28), 0.045, porcelain);
    sleeve(G, V3(-0.32, 1.42, 0.1), porcelain);
    hand(G, V3(-0.13, 1.24, 0.3), porcelain, 0.2, 0, 1.4);
    const jade = new THREE.MeshPhysicalMaterial({ color: '#A9CFC4', roughness: 0.12, clearcoat: 1 });
    add(G, lathe([[0, 0], [0.04, 0], [0.065, 0.04], [0.07, 0.08], [0.055, 0.13], [0.022, 0.17], [0.018, 0.25], [0.032, 0.27], [0, 0.27]], 28), jade, -0.1, 1.17, 0.34);
    // đầu
    const head = new THREE.Group(); head.position.set(0, 2.16, 0.03); G.add(head);
    const face = add(head, new THREE.SphereGeometry(0.17, 40, 32), porcelain, 0, 0, 0); face.scale.set(0.92, 1.14, 0.95);
    statueFace(head, 0.17, lineM, lipM, redM);
    for (const s of [-1, 1]) { const e = add(head, new THREE.CapsuleGeometry(0.022, 0.12, 4, 10), porcelain, s * 0.158, -0.05, 0, false); add(head, new THREE.SphereGeometry(0.016, 8, 6), gold, s * 0.16, -0.15, 0.01, false); }
    const hair = add(head, new THREE.SphereGeometry(0.18, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM, 0, 0.01, -0.012); hair.scale.set(0.95, 1.16, 0.98); hair.rotation.x = -0.55;
    const part = add(head, new THREE.SphereGeometry(0.182, 40, 12, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.1, Math.PI * 0.2), hairM, 0, 0.01, 0, false); part.scale.set(0.95, 1.16, 0.98); part.rotation.y = 0;
    add(head, new THREE.SphereGeometry(0.09, 20, 14), hairM, 0, 0.24, -0.02); add(head, new THREE.SphereGeometry(0.06, 16, 12), hairM, 0, 0.33, -0.02);
    for (const s of [-1, 1]) { const st = add(head, new THREE.CapsuleGeometry(0.035, 0.32, 6, 10), hairM, s * 0.14, -0.22, -0.08, false); st.rotation.z = s * 0.15; }
    // mão báu
    const band = add(head, new THREE.TorusGeometry(0.172, 0.013, 8, 48, Math.PI), gold, 0, 0.13, -0.01, false); band.rotation.set(Math.PI / 2 - 0.2, 0, 0); band.scale.set(0.97, 1, 1);
    for (let i = -2; i <= 2; i++) { const a = i * 0.42; const pl = add(head, petalGeo(0.035 + (i === 0 ? 0.015 : 0), 0.07 + (i === 0 ? 0.03 : 0), 0.008), gold, Math.sin(a) * 0.17, 0.15 + (i === 0 ? 0.02 : 0), Math.cos(a) * 0.17 - 0.01, false); pl.rotation.y = a; pl.rotation.x = -0.25; }
    add(head, new THREE.SphereGeometry(0.018, 10, 8), redM, 0, 0.19, 0.175, false);
    haloRings(G, 2.18, -0.28, 0.3, gold, glowTex, '#FFF2D8');
    return G;
  }

  // ---------- Địa Tạng Bồ Tát đứng, cầm tích trượng (mặt nhìn +z) ----------
  function makeDiaTang(gold, goldDark, glowTex) {
    const G = new THREE.Group();
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#8a6a3a'; g.lineWidth = 5;
    for (let x = 0; x <= 256; x += 51) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
    for (let y = 0; y <= 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    const kTex = new THREE.CanvasTexture(c); kTex.wrapS = kTex.wrapT = THREE.RepeatWrapping; kTex.repeat.set(3, 2);
    const kasaya = gold.clone(); kasaya.map = kTex; kasaya.color = new THREE.Color('#C08A3A');
    const inner = goldDark;
    const jewelM = new THREE.MeshStandardMaterial({ color: '#FFF0C0', emissive: '#FFC060', emissiveIntensity: 1.2, roughness: 0.2 });
    add(G, new THREE.CylinderGeometry(0.5, 0.56, 0.14, 32), goldDark, 0, 0.07, 0);
    lotusRing(G, 18, 0.46, 0.12, 0.13, 0.2, 0.05, 0.75, gold, 0);
    lotusRing(G, 12, 0.34, 0.16, 0.13, 0.2, 0.05, 0.4, gold, 0.5);
    add(G, new THREE.CylinderGeometry(0.36, 0.38, 0.06, 32), gold, 0, 0.3, 0);
    const under = add(G, foldLathe([[0, 0], [0.38, 0], [0.36, 0.1], [0.32, 0.4], [0, 0.4]], 48, 13, 0.02, 1), inner, 0, 0.32, 0); under.scale.z = 0.82;
    const robe = add(G, foldLathe([[0, 0], [0.37, 0], [0.35, 0.1], [0.3, 0.5], [0.27, 0.9], [0.26, 1.12], [0.29, 1.3], [0.3, 1.42], [0.26, 1.52], [0.13, 1.58], [0, 1.59]], 64, 9, 0.035, 0.7), kasaya, 0, 0.42, 0); robe.scale.z = 0.82;
    for (let k = 0; k < 2; k++) tube(G, [V3(-0.27, 1.92 - k * 0.07, 0.04), V3(-0.05, 1.7 - k * 0.14, 0.27), V3(0.2, 1.4 - k * 0.14, 0.25), V3(0.3, 1.25 - k * 0.12, 0.1)], 0.02, gold);
    const ring = add(G, new THREE.TorusGeometry(0.05, 0.012, 8, 20), gold, 0.18, 1.75, 0.23, false);
    // tràng hạt
    const mala = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; mala.push(V3(Math.cos(a) * 0.17, 1.86 - (Math.sin(a) > 0 ? Math.sin(a) * 0.2 : 0), 0.02 + Math.sin(a) * 0.12)); }
    beadsAlong(G, mala, 28, 0.017, new THREE.MeshStandardMaterial({ color: '#4A2A1A', roughness: 0.4 }), true);
    add(G, new THREE.CylinderGeometry(0.07, 0.085, 0.14, 20), gold, 0, 1.97, 0);
    // tay phải cầm tích trượng
    limb(G, V3(0.27, 1.82, 0.02), V3(0.36, 1.45, 0.1), 0.055, gold); limb(G, V3(0.36, 1.45, 0.1), V3(0.38, 1.5, 0.22), 0.045, gold);
    sleeve(G, V3(0.35, 1.45, 0.12), kasaya);
    tube(G, [V3(0.4, 0.34, 0.24), V3(0.4, 1.5, 0.24), V3(0.4, 2.55, 0.24)], 0.016, gold);
    hand(G, V3(0.38, 1.52, 0.26), gold, 0, -Math.PI / 2, 0);
    const loop = add(G, new THREE.TorusGeometry(0.12, 0.012, 8, 40), gold, 0.4, 2.68, 0.24, false);
    const inner2 = add(G, new THREE.TorusGeometry(0.07, 0.008, 6, 30), gold, 0.4, 2.68, 0.24, false);
    add(G, new THREE.ConeGeometry(0.03, 0.12, 10), gold, 0.4, 2.85, 0.24, false);
    add(G, new THREE.SphereGeometry(0.022, 10, 8), gold, 0.4, 2.68, 0.24, false);
    for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.45; const r = add(G, new THREE.TorusGeometry(0.035, 0.006, 6, 18), gold, 0.4 + Math.cos(a + Math.PI / 2) * 0.12, 2.68 + Math.sin(a + Math.PI / 2) * 0.12 - 0.03, 0.24, false); r.rotation.y = Math.PI / 2; }
    // tay trái nâng ngọc minh châu
    limb(G, V3(-0.27, 1.82, 0.02), V3(-0.32, 1.42, 0.08), 0.055, gold); limb(G, V3(-0.32, 1.42, 0.08), V3(-0.1, 1.42, 0.3), 0.045, gold);
    sleeve(G, V3(-0.32, 1.42, 0.1), kasaya);
    hand(G, V3(-0.08, 1.4, 0.32), gold, -1.3, 0, 0);
    add(G, new THREE.SphereGeometry(0.055, 20, 16), jewelM, -0.08, 1.48, 0.33, false);
    const jg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FFD890', blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.8 })); jg.position.set(-0.08, 1.48, 0.34); jg.scale.set(0.45, 0.45, 1); G.add(jg);
    // đầu tròn của vị tăng
    const head = new THREE.Group(); head.position.set(0, 2.15, 0.02); G.add(head);
    const skull = add(head, new THREE.SphereGeometry(0.175, 40, 32), gold, 0, 0, 0); skull.scale.set(0.96, 1.1, 1);
    const shave = add(head, new THREE.SphereGeometry(0.177, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.38), goldDark, 0, 0.01, -0.02, false); shave.rotation.x = 0.3;
    statueFace(head, 0.175, goldDark, goldDark, goldDark);
    for (const s of [-1, 1]) add(head, new THREE.CapsuleGeometry(0.024, 0.13, 4, 10), gold, s * 0.168, -0.05, 0, false);
    haloRings(G, 2.17, -0.28, 0.3, gold, glowTex);
    return G;
  }

  // ---------- Khách hành hương chibi ----------
  const SKIN = ['#EBC7A2', '#E2B590', '#D9A780', '#F0D2B2'];
  const HAIR = ['#24170F', '#2E2018', '#3A2A20', '#8A8580'];
  const STYLES = ['short', 'bun', 'long', 'short', 'bun', 'bald'];
  function makeAvatar(opts) {
    opts = opts || {};
    const kind = opts.kind || ['adult', 'adult', 'adult', 'elder', 'child', 'monk'][Math.floor(Math.random() * 6)];
    const robeColor = kind === 'monk' ? ['#8A5A2E', '#B8742E', '#6E4A32'][Math.floor(Math.random() * 3)] : (opts.robe || '#7D8A96');
    const style = kind === 'monk' ? 'bald' : kind === 'elder' ? 'bun' : (opts.style || STYLES[Math.floor(Math.random() * 4)]);
    const skin = new THREE.MeshStandardMaterial({ color: opts.skin || SKIN[Math.floor(Math.random() * SKIN.length)], roughness: 0.65 });
    const hairM = new THREE.MeshStandardMaterial({ color: kind === 'elder' ? '#BDB8B0' : (opts.hair || HAIR[Math.floor(Math.random() * 3)]), roughness: 0.8 });
    const white = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
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
    const body = add(p, foldLathe([[0, 0], [0.34, 0], [0.33, 0.12], [0.27, 0.32], [0.24, 0.44], [0.25, 0.5], [0.16, 0.56], [0.1, 0.58], [0, 0.58]], 40, 9, 0.05, 1), robe, 0, 0, 0); body.scale.z = 0.86;
    add(p, new THREE.TorusGeometry(0.335, 0.012, 6, 40), trim, 0, 0.012, 0, false).rotation.x = Math.PI / 2;
    if (kind === 'monk') { const sash = new THREE.MeshStandardMaterial({ color: '#C9822E', roughness: 0.8 }); tube(p, [V3(-0.2, 0.56, 0.06), V3(-0.05, 0.42, -0.24), V3(0.18, 0.2, -0.26), V3(0.3, 0.06, -0.1)], 0.04, sash); tube(p, [V3(-0.2, 0.56, 0.06), V3(0.05, 0.4, 0.24), V3(0.26, 0.18, 0.22)], 0.04, sash); }
    const belt = add(p, new THREE.TorusGeometry(0.3, 0.02, 6, 28), trim, 0, 0.12, 0, false); belt.rotation.x = Math.PI / 2; belt.scale.y = 0.86;
    const collarL = limb(p, V3(-0.12, 0.56, -0.08), V3(0.05, 0.3, -0.25), 0.022, trim), collarR = limb(p, V3(0.12, 0.56, -0.08), V3(-0.02, 0.33, -0.25), 0.022, trim);
    // tay
    const palm = () => { const h = add(p, new THREE.SphereGeometry(0.05, 14, 10), skin, 0, 0, 0); h.scale.set(0.62, 1.25, 0.95); return h; };
    const armL = { up: limb(p, V3(-0.24, 0.5, 0), V3(-0.27, 0.32, -0.08), 0.07, robe), lo: limb(p, V3(-0.27, 0.32, -0.08), V3(-0.04, 0.4, -0.27), 0.068, robe), hand: palm() };
    const armR = { up: limb(p, V3(0.24, 0.5, 0), V3(0.27, 0.32, -0.08), 0.07, robe), lo: limb(p, V3(0.27, 0.32, -0.08), V3(0.04, 0.4, -0.27), 0.068, robe), hand: palm() };
    // đầu
    const head = new THREE.Group(); head.position.y = 0.84; p.add(head);
    const skull = add(head, new THREE.SphereGeometry(0.28, 32, 24), skin, 0, 0, 0); skull.scale.set(1, 0.96, 0.96);
    for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.05, 10, 8), skin, s * 0.27, -0.02, 0.02, false);
    // mặt nhìn -z: mắt mở có ánh sáng, mày, mũi, miệng cười hiền
    for (const s of [-1, 1]) {
      const e = add(head, new THREE.SphereGeometry(0.036, 14, 12), dark, s * 0.1, -0.005, -0.248, false); e.scale.set(0.78, kind === 'elder' ? 0.7 : 1.12, 0.5);
      add(head, new THREE.SphereGeometry(0.011, 8, 6), white, s * 0.1 + 0.012, 0.014, -0.266, false);
      const br = arc(head, 0.04, 0.007, kind === 'monk' ? dark : hairM, s * 0.105, 0.075, -0.255, 0, Math.PI); if (br) br.rotation.z = s * -0.12;
    }
    const nose = add(head, new THREE.SphereGeometry(0.022, 10, 8), skin, 0, -0.05, -0.275, false); nose.scale.set(1, 0.8, 0.7);
    arc(head, 0.028, 0.008, new THREE.MeshStandardMaterial({ color: '#9A4A40', roughness: 0.6 }), 0, -0.1, -0.262, Math.PI, Math.PI);
    for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), blush); b.position.set(s * 0.16, -0.07, -0.25); b.rotation.y = Math.PI + s * 0.5; head.add(b); }
    if (style !== 'bald') {
      const cap = add(head, new THREE.SphereGeometry(0.295, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM, 0, 0.02, 0.02); cap.rotation.x = 0.5;
      const fringe = add(head, new THREE.SphereGeometry(0.29, 24, 10, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.18, Math.PI * 0.22), hairM, 0, 0.02, 0, false); fringe.rotation.y = Math.PI;
      if (style === 'bun' || style === 'long') { add(head, new THREE.SphereGeometry(0.11, 16, 12), hairM, 0, 0.22, 0.2); add(head, new THREE.TorusGeometry(0.06, 0.012, 6, 16), new THREE.MeshStandardMaterial({ color: '#7A2E1E' }), 0, 0.2, 0.15, false).rotation.x = 0.6; }
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
        a.hand.rotation.set(mode === 'gassho' ? -0.3 : 0.2, 0, mode === 'gassho' ? s * -0.15 : 0);
      }
    }
    function setPose(mode) {
      const standing = mode === 'stand';
      sitLegs.visible = !standing; standLegs.visible = standing;
      p.position.y = standing ? 0.3 : 0.1; setArms(standing ? 'hang' : (opts.armsSit || 'gassho'));
    }
    function walkCycle(t) { const s = Math.sin(t * 8) * 0.12; legL.position.z = s * 0.5; legR.position.z = -s * 0.5; footL.position.z = -0.03 + s; footR.position.z = -0.03 - s; }
    if (kind === 'child') g.scale.setScalar(0.76);
    if (kind === 'elder') head.rotation.x = 0.12;
    setPose('sit');
    g.userData = { pivot: p, body, robe, bowT: 0, small: false, setPose, setArms, walkCycle, style, kind };
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

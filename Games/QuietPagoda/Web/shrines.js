// Tượng và ban thờ bản 1.3 (dựng bằng code, không chép tượng thật): Tam thế Phật, tòa Cửu Long, Hộ pháp,
// Đức Ông, Thánh Tăng, Thập điện, Tam tòa Thánh Mẫu, chư Tổ, câu đối trong Tam bảo.
(function () {
  'use strict';
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0 }, o || {}));
  function put(p, geo, mat, x, y, z, sh) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (sh !== false) { m.castShadow = true; m.receiveShadow = true; } p.add(m); return m; }
  const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg || 24);
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  function vText(text, w, h, bg, fg) { return canvasTex(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.strokeStyle = '#8A5A1A'; c.lineWidth = 6; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; const ch = [...text], fs = Math.min(w * 0.66, (h * 0.88) / ch.length); c.font = `bold ${fs}px "Songti TC","Songti SC","Noto Serif TC",serif`; ch.forEach((k, i) => c.fillText(k, w / 2, h * 0.06 + fs * (i + 0.5) + (h * 0.88 - fs * ch.length) / 2)); }); }
  function hText(text, w, h, bg, fg) { return canvasTex(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.strokeStyle = '#D9A441'; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `bold ${h * 0.55}px "Songti TC","Noto Serif TC",serif`; c.fillText(text, w / 2, h / 2 + 3); }); }

  // tượng ngồi tham số: thân áo, đầu, mũ/kiểu tóc theo vị; mặt nhìn +z
  function seated(o) {
    const g = new THREE.Group(), s = o.s || 1; g.scale.setScalar(s);
    const robe = o.robeM || std(o.robe || '#C9963E', { metalness: o.metal || 0, roughness: 0.45 });
    const skin = o.skinM || std(o.skin || '#F2D6B4', { roughness: 0.45, metalness: o.metal ? 0.3 : 0 });
    const trim = std(o.trim || '#D9A441', { metalness: 0.5, roughness: 0.35 });
    // đế
    if (o.base !== false) { put(g, new THREE.CylinderGeometry(0.42, 0.46, 0.14, 20), o.baseM || trim, 0, 0.07, 0); if (o.lotus) for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const p = put(g, new THREE.SphereGeometry(0.1, 8, 6), o.baseM || trim, Math.cos(a) * 0.38, 0.17, Math.sin(a) * 0.38, false); p.scale.set(0.7, 1.1, 0.4); p.rotation.y = -a; p.rotation.z = 0.4; } }
    // chân xếp + thân
    const lap = put(g, new THREE.SphereGeometry(0.36, 20, 12), robe, 0, 0.26, 0.08); lap.scale.set(1.05, 0.38, 0.8);
    put(g, lathe([[0, 0], [0.27, 0], [0.29, 0.12], [0.25, 0.36], [0.2, 0.52], [0.12, 0.58], [0, 0.6]], 24), robe, 0, 0.3, -0.02);
    if (o.sash) put(g, new THREE.TorusGeometry(0.24, 0.025, 6, 24), trim, 0, 0.42, -0.01, false).rotation.x = Math.PI / 2;
    // tay
    for (const sx of [-1, 1]) { const a = put(g, new THREE.CylinderGeometry(0.07, 0.09, 0.36, 10), robe, sx * 0.25, 0.6, 0.06); a.rotation.z = sx * 0.35; a.rotation.x = -0.6; put(g, new THREE.SphereGeometry(0.05, 10, 8), skin, sx * 0.12, 0.42, 0.24); }
    if (o.holds === 'staff') { put(g, new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6), trim, 0.32, 0.75, 0.15); put(g, new THREE.TorusGeometry(0.07, 0.012, 6, 16), trim, 0.32, 1.45, 0.15, false); }
    if (o.holds === 'tablet') put(g, new THREE.BoxGeometry(0.05, 0.32, 0.02), std('#E8DCC0'), 0, 0.62, 0.26).rotation.x = -0.3;
    // cổ + đầu
    put(g, new THREE.CylinderGeometry(0.06, 0.07, 0.08, 10), skin, 0, 0.92, 0);
    const head = put(g, new THREE.SphereGeometry(0.14, 20, 16), skin, 0, 1.06, 0.01); head.scale.set(0.92, 1.08, 0.95);
    const dark = new THREE.MeshBasicMaterial({ color: '#2A1E18' });
    for (const sx of [-1, 1]) { const e = put(g, new THREE.SphereGeometry(0.016, 6, 4), dark, sx * 0.045, 1.08, 0.135, false); e.scale.set(1.5, 0.5, 0.5); }
    put(g, new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: '#B8463A' }), 0, 1.0, 0.14, false).scale.set(2, 0.6, 0.5);
    const hd = o.head || 'buddha';
    if (hd === 'buddha') { const hair = std('#2C3552', { roughness: 0.5 }); const cap = put(g, new THREE.SphereGeometry(0.145, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 1.08, 0); put(g, new THREE.SphereGeometry(0.07, 12, 10), hair, 0, 1.24, -0.01); put(g, new THREE.SphereGeometry(0.018, 6, 4), std('#E8B048', { metalness: 0.5 }), 0, 1.12, 0.14, false); for (const sx of [-1, 1]) { const ear = put(g, new THREE.SphereGeometry(0.04, 8, 6), skin, sx * 0.13, 1.0, 0, false); ear.scale.set(0.4, 1.6, 0.6); } }
    if (hd === 'monk') { for (const sx of [-1, 1]) { const ear = put(g, new THREE.SphereGeometry(0.035, 8, 6), skin, sx * 0.13, 1.04, 0, false); ear.scale.set(0.4, 1.2, 0.6); } }
    if (hd === 'crown' || hd === 'mau') { const cr = std(o.crown || '#D9A441', { metalness: 0.6, roughness: 0.35 }); put(g, lathe([[0.13, 0], [0.16, 0.06], [0.14, 0.16], [0.08, 0.24], [0, 0.26]], 16), cr, 0, 1.14, 0); for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.45; const p = put(g, new THREE.ConeGeometry(0.035, 0.11, 6), cr, Math.sin(a) * 0.15, 1.27, Math.cos(a) * 0.15, false); p.rotation.x = 0.2; }
      if (hd === 'mau') { const veil = std(o.veil || '#C8302A', { roughness: 0.7, side: THREE.DoubleSide }); put(g, new THREE.CylinderGeometry(0.17, 0.24, 0.42, 16, 1, true, Math.PI * 0.35, Math.PI * 1.3), veil, 0, 1.0, -0.02, false); for (const sx of [-1, 1]) put(g, new THREE.CylinderGeometry(0.006, 0.006, 0.22, 4), cr, sx * 0.17, 1.04, 0.04, false); } }
    if (hd === 'hat') { const hm = std(o.hatC || '#2A2A30', { roughness: 0.6 }); put(g, new THREE.BoxGeometry(0.3, 0.16, 0.28), hm, 0, 1.24, -0.01); for (const sx of [-1, 1]) { const w = put(g, new THREE.BoxGeometry(0.16, 0.03, 0.05), hm, sx * 0.23, 1.22, -0.06, false); w.rotation.z = sx * 0.15; } put(g, new THREE.BoxGeometry(0.31, 0.03, 0.29), std('#D9A441', { metalness: 0.5 }), 0, 1.17, -0.01, false); }
    if (o.beard) { const b = put(g, new THREE.ConeGeometry(0.05, 0.16, 8), std('#1E1A18'), 0, 0.9, 0.12, false); b.rotation.x = Math.PI; }
    if (o.halo) { const h = put(g, new THREE.TorusGeometry(0.24, 0.02, 8, 32), std('#D9A441', { metalness: 0.7, roughness: 0.3 }), 0, 1.1, -0.12, false); put(g, new THREE.CircleGeometry(0.24, 32), new THREE.MeshBasicMaterial({ color: '#F2C860', transparent: true, opacity: 0.25, depthWrite: false }), 0, 1.1, -0.13, false); }
    return g;
  }
  // Hộ pháp đứng: giáp màu, mũ trụ, cầm kiếm/đao; mặt hiền (Khuyến Thiện) hoặc dữ (Trừng Ác)
  function guardian(o) {
    const g = new THREE.Group(); g.scale.setScalar(o.s || 1);
    const armor = std(o.armor, { roughness: 0.45 }), trim = std('#D9A441', { metalness: 0.6, roughness: 0.35 }), face = std(o.face, { roughness: 0.5 }), sec = std(o.second, { roughness: 0.5 });
    put(g, new THREE.BoxGeometry(0.9, 0.2, 0.7), std('#7A2418'), 0, 0.1, 0);
    for (const sx of [-1, 1]) { put(g, new THREE.CylinderGeometry(0.13, 0.16, 0.95, 12), sec, sx * 0.17, 0.67, 0); put(g, new THREE.BoxGeometry(0.24, 0.12, 0.34), std('#2A1E18'), sx * 0.17, 0.26, 0.05); }
    put(g, lathe([[0, 0], [0.34, 0], [0.38, 0.2], [0.33, 0.5], [0.3, 0.7], [0.18, 0.8], [0, 0.82]], 24), armor, 0, 1.0, 0);
    put(g, new THREE.CylinderGeometry(0.36, 0.42, 0.42, 20, 1, true), sec, 0, 0.92, 0);
    put(g, new THREE.TorusGeometry(0.33, 0.04, 8, 24), trim, 0, 1.22, 0, false).rotation.x = Math.PI / 2;
    const mirror = put(g, new THREE.CircleGeometry(0.12, 20), trim, 0, 1.45, 0.33, false);
    for (const sx of [-1, 1]) { const sh = put(g, new THREE.SphereGeometry(0.17, 12, 8), trim, sx * 0.38, 1.7, 0); sh.scale.set(1, 0.7, 1); const ar = put(g, new THREE.CylinderGeometry(0.09, 0.11, 0.5, 10), armor, sx * 0.48, 1.45, 0.08); ar.rotation.z = sx * 0.4; ar.rotation.x = -0.5; put(g, new THREE.SphereGeometry(0.07, 10, 8), face, sx * 0.48, 1.28, 0.3); }
    const head = put(g, new THREE.SphereGeometry(0.2, 20, 16), face, 0, 2.02, 0.02); head.scale.set(0.95, 1.1, 0.95);
    const dark = new THREE.MeshBasicMaterial({ color: '#1A1410' });
    for (const sx of [-1, 1]) { const e = put(g, new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#F6F0E6' }), sx * 0.07, 2.06, 0.18, false); put(g, new THREE.SphereGeometry(0.015, 6, 4), dark, sx * 0.07, 2.06, 0.205, false); const brow = put(g, new THREE.BoxGeometry(0.08, 0.018, 0.02), dark, sx * 0.07, 2.12, 0.19, false); brow.rotation.z = o.fierce ? -sx * 0.4 : sx * 0.15; }
    const beard = put(g, new THREE.ConeGeometry(0.07, o.fierce ? 0.3 : 0.22, 8), std('#1E1A18'), 0, 1.84, 0.13, false); beard.rotation.x = Math.PI;
    put(g, lathe([[0.2, 0], [0.22, 0.08], [0.18, 0.2], [0.08, 0.32], [0, 0.34]], 20), armor, 0, 2.16, 0);
    for (const sx of [-1, 1]) { const w = put(g, new THREE.TorusGeometry(0.12, 0.025, 6, 16, Math.PI), trim, sx * 0.22, 2.32, 0, false); w.rotation.y = Math.PI / 2; }
    put(g, new THREE.SphereGeometry(0.05, 8, 6), std('#C8302A'), 0, 2.52, 0, false);
    // vũ khí
    const wp = new THREE.Group(); wp.position.set(0.5, 1.3, 0.32); g.add(wp);
    put(wp, new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), trim, 0, -0.1, 0);
    const blade = put(wp, new THREE.BoxGeometry(0.06, o.fierce ? 0.95 : 0.8, 0.015), std('#C8CCD2', { metalness: 0.8, roughness: 0.25 }), 0, 0.5, 0); if (o.fierce) { blade.scale.x = 1.8; }
    wp.rotation.z = -0.15;
    return g;
  }
  // tòa Cửu Long: khám nhỏ, 9 rồng vòng quanh, Thích Ca sơ sinh đứng giữa chỉ tay
  function cuuLong(gold, skin) {
    const g = new THREE.Group();
    put(g, new THREE.BoxGeometry(0.62, 0.08, 0.42), gold, 0, 0.04, 0);
    const back = put(g, lathe([[0, 0], [0.32, 0], [0.3, 0.3], [0.2, 0.52], [0, 0.6]], 3), gold, 0, 0.08, -0.12); back.scale.z = 0.2; back.rotation.y = Math.PI / 6;
    const dragon = std('#3E8A5A', { metalness: 0.3, roughness: 0.4 });
    for (let k = 0; k < 9; k++) { const a = Math.PI * (0.1 + 0.8 * k / 8); const r = 0.26; const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(Math.cos(a) * r, 0.1, -0.06), V3(Math.cos(a) * r * 1.05, 0.1 + Math.sin(a) * 0.3, -0.04), V3(Math.cos(a) * r * 0.6, 0.1 + Math.sin(a) * 0.44, 0.02)]), 8, 0.018, 5), dragon); g.add(t); }
    const baby = new THREE.Group(); baby.position.set(0, 0.08, 0.04); g.add(baby);
    put(baby, new THREE.CylinderGeometry(0.03, 0.04, 0.16, 8), skin, 0, 0.08, 0);
    put(baby, new THREE.CylinderGeometry(0.045, 0.035, 0.08, 8), std('#C8302A'), 0, 0.12, 0);
    put(baby, new THREE.SphereGeometry(0.04, 10, 8), skin, 0, 0.21, 0);
    const arm = put(baby, new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), skin, 0.03, 0.26, 0); arm.rotation.z = -0.3;
    return g;
  }

  // ----- trong Tam bảo: Tam thế trên cao, Cửu Long, Hộ pháp, Đức Ông, Thánh Tăng, Thập điện, câu đối -----
  function hall(scene, M) {
    const out = { labels: [] };
    const gold = M.gold, goldDark = M.goldDark;
    // bệ cao phía sau cho Tam thế
    put(scene, new THREE.BoxGeometry(5.6, 0.25, 0.9), std('#6E2A18', { roughness: 0.5 }), 0, 3.95, -9.15);
    put(scene, new THREE.BoxGeometry(5.7, 0.06, 0.95), gold, 0, 4.1, -9.15, false);
    const tamThe = new THREE.Group(); scene.add(tamThe);
    const skinG = gold.clone(); skinG.color = new THREE.Color('#E9C98E'); skinG.metalness = 0.55; skinG.roughness = 0.32;
    const robeG = gold.clone(); robeG.color = new THREE.Color('#D9A845'); robeG.roughness = 0.3;
    for (const x of [-1.8, 0, 1.8]) { const b = seated({ s: 0.78, robeM: robeG, skinM: skinG, head: 'buddha', lotus: true, halo: true, baseM: goldDark }); b.position.set(x, 4.13, -9.15); tamThe.add(b); }
    // cửa võng thếp vàng phía trước Tam thế
    const vong = new THREE.Group(); scene.add(vong);
    put(vong, new THREE.BoxGeometry(6.4, 0.32, 0.18), gold, 0, 5.75, -8.6);
    for (const sx of [-1, 1]) { put(vong, new THREE.BoxGeometry(0.28, 2.0, 0.16), gold, sx * 3.1, 4.8, -8.6); const sw = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 6, 16, Math.PI / 2), gold); sw.position.set(sx * 2.3, 4.95, -8.6); sw.rotation.z = sx > 0 ? 0 : Math.PI / 2; scene.add(sw); }
    const hp = put(scene, new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshStandardMaterial({ map: hText('慈悲喜捨', 512, 128, '#6A1A12', '#F2CE6A'), roughness: 0.6 }), 0, 5.75, -8.5, false);
    // Cửu Long trước tượng A Di Đà
    const cl = cuuLong(gold, skinG); cl.position.set(0, 1.04, -7.6); cl.scale.setScalar(1.1); scene.add(cl);
    // Hộ pháp hai bên cửa vào
    const kt = guardian({ armor: '#2E7A6A', second: '#C83A2A', face: '#F2C6B6', s: 1.15 }); kt.position.set(-4.7, 0, 7.6); kt.rotation.y = 0.9; scene.add(kt);
    const ta = guardian({ armor: '#C83A2A', second: '#2E5A9A', face: '#E07A8A', fierce: true, s: 1.15 }); ta.position.set(4.7, 0, 7.6); ta.rotation.y = -0.9; scene.add(ta);
    // ban Đức Ông (trái) & Thánh Tăng (phải), dựa tường hông
    const altar = (x, rot) => { const g = new THREE.Group(); g.position.set(x, 0, 5.6); g.rotation.y = rot; scene.add(g); put(g, new THREE.BoxGeometry(1.8, 0.9, 0.9), std('#7A2418', { roughness: 0.5 }), 0, 0.45, 0); put(g, new THREE.BoxGeometry(1.85, 0.05, 0.95), gold, 0, 0.92, 0, false); put(g, new THREE.BoxGeometry(1.9, 1.6, 0.12), std('#8A1A12', { roughness: 0.5 }), 0, 1.8, -0.45); put(g, new THREE.BoxGeometry(2.0, 0.16, 0.2), gold, 0, 2.62, -0.42); return g; };
    const dongG = altar(-5.3, Math.PI / 2);
    const dong = seated({ s: 0.85, robe: '#C8302A', trim: '#E8B84A', head: 'hat', beard: true, holds: 'tablet', sash: true }); dong.position.set(0, 0.95, -0.15); dongG.add(dong);
    for (const sx of [-1, 1]) { const a = seated({ s: 0.5, robe: '#2E6A9A', head: 'hat', hatC: '#1E1E24', base: false }); a.position.set(sx * 0.62, 0.95, -0.1); dongG.add(a); }
    const tangG = altar(5.3, -Math.PI / 2);
    const tang = seated({ s: 0.85, robe: '#B8742E', trim: '#8A4A1E', head: 'monk', holds: 'staff' }); tang.position.set(0, 0.95, -0.15); tangG.add(tang);
    for (const sx of [-1, 1]) { const a = seated({ s: 0.5, robe: '#8A5A2E', head: 'monk', base: false }); a.position.set(sx * 0.62, 0.95, -0.1); tangG.add(a); }
    // Thập điện Minh vương: 5 vị mỗi bên tường hông
    const bench = std('#5A2014', { roughness: 0.6 });
    for (const sx of [-1, 1]) { put(scene, new THREE.BoxGeometry(0.7, 0.55, 6.0), bench, sx * 5.55, 0.27, -3.6); put(scene, new THREE.BoxGeometry(0.72, 0.04, 6.05), gold, sx * 5.55, 0.56, -3.6, false);
      for (let k = 0; k < 5; k++) { const v = seated({ s: 0.62, robe: k % 2 ? '#D9A441' : '#C8302A', trim: '#E8C060', head: 'crown', crown: '#E0B040', base: false, holds: 'tablet' }); v.position.set(sx * 5.55, 0.58, -6.0 + k * 1.2); v.rotation.y = -sx * Math.PI / 2; scene.add(v); } }
    // câu đối thếp vàng trên 4 cột trước Phật điện
    const cd = (x, z, text) => { const t = vText(text, 64, 512, '#C9963E', '#2A1408'); const p = put(scene, new THREE.PlaneGeometry(0.34, 2.9), new THREE.MeshStandardMaterial({ map: t, metalness: 0.4, roughness: 0.45 }), x, 3.2, z + 0.29, false); return p; };
    cd(-3.5, -6.2, '南無阿彌陀佛'); cd(3.5, -6.2, '南無阿彌陀佛'); cd(-3.5, -2.4, '佛日增輝'); cd(3.5, -2.4, '法輪常轉');
    Object.assign(out, { tamThe, cuuLong: cl, khuyenThien: kt, trungAc: ta, ducOng: dongG, thanhTang: tangG });
    return out;
  }
  // ----- điện Mẫu: Tam tòa Thánh Mẫu + hàng dưới -----
  function mau(sh, M) {
    const g = sh.g, z = sh.shelfZ;
    const colors = [['#C8302A', 0], ['#2E8A4A', 1.15], ['#F2EEE6', -1.15]]; // Thượng Thiên giữa, Thượng Ngàn bên phải người xem, Mẫu Thoải bên trái
    for (const [c, x] of colors) { const m = seated({ s: 0.95, robe: c, head: 'mau', veil: c === '#F2EEE6' ? '#E8E2D6' : c, trim: '#E8B84A', sash: true }); m.position.set(x, sh.shelfY, z); g.add(m); }
    const small = ['#2E8A4A', '#C8302A', '#E8B84A', '#F2EEE6', '#2E6A9A', '#C8302A'];
    small.forEach((c, i) => { const m = seated({ s: 0.48, robe: c, head: i % 2 ? 'hat' : 'mau', veil: c, hatC: '#1E1E24', base: false }); m.position.set(-1.25 + i * 0.5, sh.deskTop, sh.altarZ); g.add(m); });
    const ban = put(g, new THREE.PlaneGeometry(2.0, 0.5), new THREE.MeshStandardMaterial({ map: hText('母儀天下', 512, 128, '#6A1A12', '#F2CE6A'), roughness: 0.6 }), 0, 3.15, sh.shelfZ - 0.3, false);
    return g;
  }
  // ----- nhà Tổ: các vị Tổ áo cà sa đỏ -----
  function to(sh, M) {
    const g = sh.g, z = sh.shelfZ;
    [[0, 1.0], [-1.0, 0.85], [1.0, 0.85]].forEach(([x, s]) => { const m = seated({ s, robe: '#B8302A', trim: '#E8B84A', head: 'monk', sash: true, lotus: true, baseM: std('#C9963E', { metalness: 0.5, roughness: 0.4 }) }); m.position.set(x, sh.shelfY, z); g.add(m); });
    const ban = put(g, new THREE.PlaneGeometry(2.0, 0.5), new THREE.MeshStandardMaterial({ map: hText('祖師堂', 512, 128, '#6A1A12', '#F2CE6A'), roughness: 0.6 }), 0, 3.15, sh.shelfZ - 0.3, false);
    return g;
  }
  window.Shrines = { seated, guardian, cuuLong, hall, mau, to };
})();

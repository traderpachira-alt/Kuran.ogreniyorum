'use strict';

/* =========================================================
   Benim Bahçem — düşük poligonlu (low-poly) 3B bahçe
   Hayvanlar bahçede dolaşır, kuşlar ve kelebekler uçar.
   Three.js (cdnjs) gerekir; yoksa uygulama 2B çıkartmalara döner.
   ========================================================= */

window.Garden3D = (() => {
  const T = window.THREE;
  const G = {
    ready: false, renderer: null, scene: null, camera: null, root: null,
    items: [], raf: 0, last: 0, time: 0, bx: 4, bz: 2.4,
    ray: null, ground: null, drag: null, cb: {}, el: null,
  };

  // ---------- Malzeme ve şekil yardımcıları ----------
  const mats = {};
  const mat = c => mats[c] || (mats[c] = new T.MeshPhongMaterial({ color: c, flatShading: true, shininess: 6 }));
  const geos = {};
  const geo = (key, make) => geos[key] || (geos[key] = make());
  function mesh(g, color, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
    const m = new T.Mesh(g, mat(color));
    m.position.set(x, y, z); m.scale.set(sx, sy, sz);
    return m;
  }
  const ico = (r, color, x, y, z, sx, sy, sz) => mesh(geo('ico', () => new T.IcosahedronGeometry(1, 0)), color, x, y, z, r * (sx || 1), r * (sy || 1), r * (sz || 1));
  const box = (w, h, d, color, x, y, z) => mesh(geo('box', () => new T.BoxGeometry(1, 1, 1)), color, x, y, z, w, h, d);
  const cone = (r, h, color, x, y, z, seg = 5) => mesh(geo('cone' + seg, () => new T.ConeGeometry(1, 1, seg)), color, x, y, z, r, h, r);
  const cyl = (r, h, color, x, y, z, seg = 6) => mesh(geo('cyl' + seg, () => new T.CylinderGeometry(1, 1, 1, seg)), color, x, y, z, r, h, r);
  function eyes(g, y, z, spread, r = 0.045) {
    g.add(ico(r, '#212529', -spread, y, z));
    g.add(ico(r, '#212529', spread, y, z));
  }
  function legs(g, color, pts, h = 0.22, r = 0.05) {
    pts.forEach(([x, z]) => g.add(cyl(r, h, color, x, h / 2, z, 4)));
  }

  // ---------- Modeller (yüz +z yönüne bakar, ayaklar y=0'da) ----------
  const MODELS = {
    chick() {
      const g = new T.Group();
      g.add(ico(0.32, '#ffd43b', 0, 0.38, 0, 1, 0.95, 1.05));
      g.add(ico(0.22, '#ffd43b', 0, 0.72, 0.12));
      g.add(cone(0.07, 0.14, '#f76707', 0, 0.7, 0.36, 4).rotateX(Math.PI / 2));
      eyes(g, 0.78, 0.3, 0.09);
      g.add(ico(0.14, '#fcc419', -0.3, 0.42, -0.02, 0.5, 1, 1.2));
      g.add(ico(0.14, '#fcc419', 0.3, 0.42, -0.02, 0.5, 1, 1.2));
      legs(g, '#f76707', [[-0.1, 0.02], [0.1, 0.02]], 0.12, 0.03);
      return g;
    },
    duck() {
      const g = new T.Group();
      g.add(ico(0.38, '#f8f9fa', 0, 0.4, 0, 1, 0.85, 1.3));
      g.add(ico(0.22, '#f8f9fa', 0, 0.8, 0.28));
      g.add(box(0.16, 0.06, 0.22, '#fd7e14', 0, 0.76, 0.52));
      eyes(g, 0.86, 0.42, 0.11);
      g.add(cone(0.12, 0.25, '#f8f9fa', 0, 0.52, -0.48, 4).rotateX(-Math.PI / 2.5));
      legs(g, '#fd7e14', [[-0.12, 0], [0.12, 0]], 0.1, 0.035);
      return g;
    },
    bunny() {
      const g = new T.Group();
      g.add(ico(0.36, '#f1f3f5', 0, 0.36, -0.05, 1, 0.9, 1.15));
      g.add(ico(0.26, '#f1f3f5', 0, 0.68, 0.25));
      g.add(box(0.09, 0.42, 0.05, '#f1f3f5', -0.1, 1.05, 0.2).rotateZ(0.15));
      g.add(box(0.09, 0.42, 0.05, '#f1f3f5', 0.1, 1.05, 0.2).rotateZ(-0.15));
      g.add(box(0.05, 0.3, 0.02, '#faa2c1', -0.1, 1.05, 0.23).rotateZ(0.15));
      g.add(box(0.05, 0.3, 0.02, '#faa2c1', 0.1, 1.05, 0.23).rotateZ(-0.15));
      eyes(g, 0.74, 0.47, 0.1);
      g.add(ico(0.04, '#f06595', 0, 0.66, 0.5));
      g.add(ico(0.11, '#ffffff', 0, 0.36, -0.45));
      return g;
    },
    cat() {
      const g = new T.Group();
      g.add(ico(0.3, '#ff922b', 0, 0.42, -0.05, 0.9, 0.8, 1.5));
      g.add(ico(0.25, '#ff922b', 0, 0.72, 0.4));
      g.add(cone(0.09, 0.18, '#ff922b', -0.13, 0.95, 0.38, 4));
      g.add(cone(0.09, 0.18, '#ff922b', 0.13, 0.95, 0.38, 4));
      eyes(g, 0.78, 0.62, 0.09);
      g.add(ico(0.035, '#f06595', 0, 0.7, 0.64));
      const tail = cyl(0.04, 0.5, '#ff922b', 0, 0.68, -0.52, 4); tail.rotation.x = -0.6; g.add(tail);
      legs(g, '#e8590c', [[-0.14, 0.25], [0.14, 0.25], [-0.14, -0.3], [0.14, -0.3]], 0.25, 0.05);
      return g;
    },
    sheep() {
      const g = new T.Group();
      g.add(ico(0.42, '#f8f9fa', 0, 0.55, 0, 1, 0.85, 1.25));
      g.add(ico(0.2, '#f8f9fa', -0.18, 0.78, -0.05)); g.add(ico(0.2, '#f8f9fa', 0.18, 0.78, 0.1));
      g.add(box(0.26, 0.28, 0.3, '#495057', 0, 0.68, 0.55));
      eyes(g, 0.74, 0.71, 0.08, 0.04);
      g.add(box(0.12, 0.05, 0.14, '#495057', -0.17, 0.74, 0.5)); g.add(box(0.12, 0.05, 0.14, '#495057', 0.17, 0.74, 0.5));
      legs(g, '#495057', [[-0.18, 0.25], [0.18, 0.25], [-0.18, -0.25], [0.18, -0.25]], 0.3, 0.05);
      return g;
    },
    bug() {
      const g = new T.Group();
      g.add(mesh(geo('dome', () => new T.SphereGeometry(1, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2)), '#fa5252', 0, 0.04, 0, 0.22, 0.18, 0.26));
      g.add(ico(0.1, '#212529', 0, 0.1, 0.24));
      [[-0.09, 0.05], [0.09, 0.05], [-0.07, -0.1], [0.07, -0.1]].forEach(([x, z]) => g.add(ico(0.04, '#212529', x, 0.19, z)));
      g.add(box(0.01, 0.02, 0.48, '#212529', 0, 0.2, -0.02));
      return g;
    },
    camel() {
      const g = new T.Group();
      g.add(ico(0.36, '#e0a96d', 0, 0.95, 0, 0.9, 0.7, 1.4));
      g.add(ico(0.26, '#d4955a', 0, 1.25, -0.05));
      const neck = box(0.16, 0.55, 0.16, '#e0a96d', 0, 1.25, 0.5); neck.rotation.x = 0.5; g.add(neck);
      g.add(box(0.2, 0.18, 0.34, '#e0a96d', 0, 1.52, 0.7));
      eyes(g, 1.6, 0.75, 0.09, 0.035);
      legs(g, '#c78a50', [[-0.15, 0.32], [0.15, 0.32], [-0.15, -0.32], [0.15, -0.32]], 0.75, 0.06);
      return g;
    },
    butterfly() {
      const g = new T.Group();
      g.add(box(0.05, 0.05, 0.3, '#343a40', 0, 0, 0));
      const wing = geo('wing', () => { const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(0.38, 0.25); s.lineTo(0.32, -0.2); s.lineTo(0, -0.05); return new T.ShapeGeometry(s); });
      ['L', 'R'].forEach((side, k) => {
        const pivot = new T.Group();
        const m = new T.Mesh(wing, new T.MeshPhongMaterial({ color: k ? '#cc5de8' : '#f783ac', flatShading: true, side: T.DoubleSide }));
        m.rotation.x = -Math.PI / 2; if (k) m.scale.x = -1;
        pivot.add(m); pivot.userData.wing = k ? 1 : -1; g.add(pivot);
      });
      return g;
    },
    bird() {
      const g = new T.Group();
      g.add(ico(0.2, '#4dabf7', 0, 0, 0, 1, 0.9, 1.4));
      g.add(ico(0.13, '#4dabf7', 0, 0.12, 0.25));
      g.add(cone(0.05, 0.12, '#fcc419', 0, 0.1, 0.42, 4).rotateX(Math.PI / 2));
      eyes(g, 0.17, 0.33, 0.07, 0.025);
      const wingG = geo('bwing', () => new T.BoxGeometry(0.4, 0.03, 0.22));
      [-1, 1].forEach(sd => {
        const pivot = new T.Group(); pivot.position.set(sd * 0.12, 0.05, 0);
        const m = new T.Mesh(wingG, mat('#339af0')); m.position.x = sd * 0.2; pivot.add(m);
        pivot.userData.wing = sd; g.add(pivot);
      });
      return g;
    },
    balloon() {
      const g = new T.Group();
      g.add(ico(0.32, '#ff6b6b', 0, 0, 0, 1, 1.2, 1));
      g.add(cone(0.06, 0.08, '#e03131', 0, -0.4, 0, 4).rotateX(Math.PI));
      g.add(box(0.012, 1.0, 0.012, '#868e96', 0, -0.95, 0));
      return g;
    },
    cloud() {
      const g = new T.Group();
      [[0, 0, 0, 0.45], [0.45, -0.05, 0, 0.35], [-0.45, -0.08, 0.05, 0.32], [0.15, 0.22, 0, 0.32]].forEach(([x, y, z, r]) => g.add(ico(r, '#ffffff', x, y, z)));
      return g;
    },
    flower(color = '#f783ac', h = 0.45, center = '#ffd43b') {
      const g = new T.Group();
      g.add(cyl(0.025, h, '#2f9e44', 0, h / 2, 0, 4));
      g.add(cone(0.08, 0.2, '#40c057', 0.07, h * 0.4, 0, 4).rotateZ(-0.9));
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2;
        g.add(ico(0.075, color, Math.cos(a) * 0.1, h + 0.02, Math.sin(a) * 0.1 + 0.02, 1, 0.5, 1));
      }
      g.add(ico(0.06, center, 0, h + 0.05, 0.02));
      return g;
    },
    sunflower() { const g = MODELS.flower('#fcc419', 0.85, '#8d5524'); g.scale.setScalar(1.25); return g; },
    tree() {
      const g = new T.Group();
      g.add(cyl(0.1, 0.6, '#8d5524', 0, 0.3, 0, 5));
      g.add(ico(0.55, '#37b24d', 0, 1.0, 0));
      g.add(ico(0.38, '#40c057', 0.28, 1.3, 0.1));
      g.add(ico(0.32, '#2f9e44', -0.3, 1.2, -0.1));
      g.add(ico(0.07, '#fa5252', 0.3, 0.95, 0.45)); g.add(ico(0.07, '#fa5252', -0.25, 1.15, 0.4));
      return g;
    },
    house() {
      const g = new T.Group();
      g.add(box(1.0, 0.7, 0.8, '#ffe8cc', 0, 0.35, 0));
      const roof = cone(0.82, 0.5, '#e8590c', 0, 0.95, 0, 4); roof.rotation.y = Math.PI / 4; roof.scale.set(0.85, 0.5, 0.7); g.add(roof);
      g.add(box(0.22, 0.38, 0.02, '#8d5524', 0, 0.19, 0.41));
      g.add(box(0.2, 0.18, 0.02, '#74c0fc', -0.3, 0.42, 0.41)); g.add(box(0.2, 0.18, 0.02, '#74c0fc', 0.3, 0.42, 0.41));
      return g;
    },
    mosque() {
      const g = new T.Group();
      g.add(box(1.1, 0.6, 0.9, '#f8f9fa', 0, 0.3, 0));
      g.add(mesh(geo('dome8', () => new T.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)), '#4dabf7', 0, 0.6, 0, 0.42, 0.42, 0.42));
      g.add(cyl(0.02, 0.18, '#fcc419', 0, 1.1, 0, 4));
      g.add(ico(0.05, '#fcc419', 0, 1.22, 0));
      g.add(cyl(0.09, 1.2, '#f1f3f5', 0.72, 0.6, -0.25, 6));
      g.add(cone(0.11, 0.3, '#4dabf7', 0.72, 1.35, -0.25, 6));
      g.add(box(0.25, 0.35, 0.02, '#1c7ed6', 0, 0.18, 0.46));
      return g;
    },
    rainbow() {
      const g = new T.Group();
      ['#fa5252', '#fd7e14', '#fcc419', '#40c057', '#228be6', '#7950f2'].forEach((c, k) => {
        g.add(mesh(geo('arc' + k, () => new T.TorusGeometry(1.1 - k * 0.1, 0.05, 3, 14, Math.PI)), c, 0, 0, 0));
      });
      g.add(ico(0.22, '#ffffff', -1.0, 0.05, 0)); g.add(ico(0.22, '#ffffff', 1.0, 0.05, 0));
      return g;
    },
  };
  MODELS.turtle = function () {
    const g = new T.Group();
    g.add(mesh(geo('dome', () => new T.SphereGeometry(1, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2)), '#2f9e44', 0, 0.1, 0, 0.42, 0.32, 0.5));
    g.add(cyl(1, 1, '#a9e34b', 0, 0.1, 0, 7));
    g.children[1].scale.set(0.45, 0.06, 0.53);
    g.add(ico(0.14, '#94d82d', 0, 0.2, 0.55));
    eyes(g, 0.26, 0.66, 0.06, 0.03);
    legs(g, '#94d82d', [[-0.28, 0.25], [0.28, 0.25], [-0.28, -0.25], [0.28, -0.25]], 0.12, 0.07);
    return g;
  };

  // ---------- Yeni hayvanlar ve süsler ----------
  Object.assign(MODELS, {
    dog() {
      const g = new T.Group();
      g.add(ico(0.3, '#c08a5b', 0, 0.45, -0.02, 0.9, 0.8, 1.4));
      g.add(ico(0.24, '#c08a5b', 0, 0.74, 0.38));
      g.add(box(0.16, 0.12, 0.16, '#a0704a', 0, 0.67, 0.6));
      g.add(ico(0.045, '#212529', 0, 0.72, 0.69));
      const e1 = box(0.08, 0.24, 0.12, '#8d5524', -0.18, 0.8, 0.36); e1.rotation.z = 0.35; g.add(e1);
      const e2 = box(0.08, 0.24, 0.12, '#8d5524', 0.18, 0.8, 0.36); e2.rotation.z = -0.35; g.add(e2);
      eyes(g, 0.8, 0.57, 0.09);
      const tail = cyl(0.04, 0.32, '#c08a5b', 0, 0.62, -0.46, 4); tail.rotation.x = -0.8; tail.userData.tail = 1; g.add(tail);
      legs(g, '#8d5524', [[-0.13, 0.22], [0.13, 0.22], [-0.13, -0.25], [0.13, -0.25]], 0.3, 0.05);
      return g;
    },
    cow() {
      const g = new T.Group();
      g.add(box(0.55, 0.45, 0.9, '#f8f9fa', 0, 0.62, 0));
      [[-0.28, 0.7, 0.1], [0.28, 0.6, -0.2], [0.28, 0.72, 0.25], [-0.28, 0.55, -0.25]].forEach(([x, y, z]) => g.add(ico(0.11, '#343a40', x, y, z, 0.3, 1, 1)));
      g.add(box(0.36, 0.32, 0.34, '#f8f9fa', 0, 0.84, 0.56));
      g.add(box(0.3, 0.14, 0.08, '#ffc9c9', 0, 0.74, 0.74));
      g.add(cone(0.04, 0.14, '#ffe8cc', -0.14, 1.06, 0.55, 4)); g.add(cone(0.04, 0.14, '#ffe8cc', 0.14, 1.06, 0.55, 4));
      eyes(g, 0.9, 0.73, 0.1, 0.035);
      g.add(ico(0.08, '#ffa8a8', 0, 0.36, -0.15));
      legs(g, '#495057', [[-0.18, 0.3], [0.18, 0.3], [-0.18, -0.3], [0.18, -0.3]], 0.4, 0.06);
      return g;
    },
    frog() {
      const g = new T.Group();
      g.add(ico(0.3, '#40c057', 0, 0.22, 0, 1.1, 0.7, 1));
      [-0.13, 0.13].forEach(x => { g.add(ico(0.1, '#69db7c', x, 0.4, 0.14)); g.add(ico(0.05, '#212529', x, 0.43, 0.23)); });
      g.add(box(0.24, 0.02, 0.02, '#2b8a3e', 0, 0.22, 0.31));
      g.add(ico(0.13, '#2f9e44', -0.27, 0.1, -0.12, 1, 0.5, 1.4)); g.add(ico(0.13, '#2f9e44', 0.27, 0.1, -0.12, 1, 0.5, 1.4));
      return g;
    },
    elephant() {
      const g = new T.Group();
      g.add(ico(0.5, '#adb5bd', 0, 0.78, -0.05, 1, 0.85, 1.3));
      g.add(ico(0.33, '#adb5bd', 0, 0.98, 0.6));
      const ear1 = box(0.05, 0.46, 0.38, '#ced4da', -0.34, 0.98, 0.5); ear1.rotation.y = 0.45; g.add(ear1);
      const ear2 = box(0.05, 0.46, 0.38, '#ced4da', 0.34, 0.98, 0.5); ear2.rotation.y = -0.45; g.add(ear2);
      const trunk = cyl(0.07, 0.6, '#adb5bd', 0, 0.66, 0.86, 6); trunk.rotation.x = 0.3; g.add(trunk);
      const t1 = cone(0.03, 0.18, '#fff9db', -0.12, 0.8, 0.86, 4); t1.rotation.x = 1.9; g.add(t1);
      const t2 = cone(0.03, 0.18, '#fff9db', 0.12, 0.8, 0.86, 4); t2.rotation.x = 1.9; g.add(t2);
      eyes(g, 1.06, 0.88, 0.15, 0.035);
      legs(g, '#868e96', [[-0.22, 0.32], [0.22, 0.32], [-0.22, -0.35], [0.22, -0.35]], 0.5, 0.11);
      return g;
    },
    giraffe() {
      const g = new T.Group();
      g.add(box(0.4, 0.4, 0.75, '#fcc419', 0, 1.0, 0));
      [[-0.21, 1.05, 0.1], [0.21, 0.95, -0.2], [0.21, 1.1, 0.22], [-0.21, 0.92, -0.22]].forEach(([x, y, z]) => g.add(box(0.02, 0.12, 0.14, '#d9480f', x, y, z)));
      const neck = box(0.16, 0.95, 0.16, '#fcc419', 0, 1.6, 0.3); neck.rotation.x = 0.25; g.add(neck);
      g.add(box(0.2, 0.18, 0.34, '#fcc419', 0, 2.08, 0.48));
      g.add(cyl(0.025, 0.14, '#8d5524', -0.06, 2.24, 0.4, 4)); g.add(cyl(0.025, 0.14, '#8d5524', 0.06, 2.24, 0.4, 4));
      eyes(g, 2.13, 0.6, 0.09, 0.03);
      legs(g, '#f59f00', [[-0.13, 0.27], [0.13, 0.27], [-0.13, -0.27], [0.13, -0.27]], 0.82, 0.05);
      return g;
    },
    penguin() {
      const g = new T.Group();
      g.add(ico(0.3, '#212529', 0, 0.45, 0, 0.9, 1.3, 0.85));
      g.add(ico(0.24, '#f8f9fa', 0, 0.42, 0.12, 0.8, 1.15, 0.5));
      g.add(ico(0.2, '#212529', 0, 0.86, 0));
      g.add(ico(0.14, '#f8f9fa', 0, 0.86, 0.1, 1, 1, 0.6));
      const beak = cone(0.05, 0.12, '#fd7e14', 0, 0.83, 0.25, 4); beak.rotation.x = Math.PI / 2; g.add(beak);
      eyes(g, 0.9, 0.2, 0.07, 0.03);
      const f1 = box(0.05, 0.3, 0.15, '#212529', -0.27, 0.5, 0); f1.rotation.z = 0.3; g.add(f1);
      const f2 = box(0.05, 0.3, 0.15, '#212529', 0.27, 0.5, 0); f2.rotation.z = -0.3; g.add(f2);
      g.add(box(0.1, 0.03, 0.14, '#fd7e14', -0.09, 0.02, 0.08)); g.add(box(0.1, 0.03, 0.14, '#fd7e14', 0.09, 0.02, 0.08));
      return g;
    },
    snail() {
      const g = new T.Group();
      g.add(box(0.14, 0.08, 0.55, '#ffe066', 0, 0.04, 0.05));
      g.add(ico(0.2, '#e8590c', 0, 0.26, -0.06, 0.7, 1, 1));
      g.add(mesh(geo('ring', () => new T.TorusGeometry(1, 0.25, 4, 10)), '#ffa94d', 0.13, 0.26, -0.06, 0.1, 0.1, 0.1).rotateY(Math.PI / 2));
      [-0.04, 0.04].forEach(x => { const st = cyl(0.012, 0.16, '#ffe066', x, 0.14, 0.3, 4); st.rotation.x = 0.4; g.add(st); g.add(ico(0.025, '#212529', x, 0.22, 0.34)); });
      return g;
    },
    bee() {
      const g = new T.Group();
      g.add(ico(0.14, '#fcc419', 0, 0, 0, 1, 1, 1.4));
      [-0.06, 0.06].forEach(z => g.add(box(0.27, 0.27, 0.035, '#212529', 0, 0, z)));
      g.add(cone(0.04, 0.08, '#212529', 0, 0, -0.24, 4).rotateX(-Math.PI / 2));
      eyes(g, 0.05, 0.18, 0.06, 0.025);
      const wingG = geo('beewing', () => new T.BoxGeometry(0.22, 0.015, 0.13));
      const wm = new T.MeshPhongMaterial({ color: '#e7f5ff', transparent: true, opacity: 0.75, flatShading: true });
      [-1, 1].forEach(sd => {
        const pivot = new T.Group(); pivot.position.set(sd * 0.05, 0.13, 0);
        const m = new T.Mesh(wingG, wm); m.position.x = sd * 0.11; pivot.add(m);
        pivot.userData.wing = sd; g.add(pivot);
      });
      return g;
    },
    mushroom() {
      const g = new T.Group();
      g.add(cyl(0.08, 0.3, '#fff4e6', 0, 0.15, 0, 6));
      g.add(mesh(geo('dome8', () => new T.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)), '#fa5252', 0, 0.28, 0, 0.3, 0.22, 0.3));
      [[0.12, 0.42, 0.12], [-0.14, 0.4, 0.06], [0.02, 0.48, -0.1], [0.05, 0.38, 0.22]].forEach(([x, y, z]) => g.add(ico(0.04, '#ffffff', x, y, z)));
      return g;
    },
    pond() {
      const g = new T.Group();
      g.add(cyl(0.85, 0.04, '#4dabf7', 0, 0.02, 0, 9));
      for (let k = 0; k < 9; k++) {
        const a = k / 9 * Math.PI * 2;
        g.add(ico(0.12, k % 2 ? '#adb5bd' : '#ced4da', Math.cos(a) * 0.88, 0.05, Math.sin(a) * 0.88, 1, 0.6, 1));
      }
      g.add(cyl(0.16, 0.02, '#40c057', -0.35, 0.05, 0.2, 7));
      g.add(ico(0.05, '#f783ac', -0.35, 0.09, 0.2));
      const fish = new T.Group();
      fish.add(ico(0.09, '#ff922b', 0, 0, 0, 0.7, 0.8, 1.4));
      const tail = cone(0.07, 0.1, '#ff922b', 0, 0, -0.15, 4); tail.rotation.x = -Math.PI / 2; fish.add(tail);
      fish.position.set(0.2, -0.2, 0); fish.visible = false;
      g.add(fish); g.userData.fish = fish;
      return g;
    },
  });

  // Davranışlar: walk = yürür, fly = uçar, float = süzülür, drift = gökyüzünde kayar, still = durur
  const KIND = {
    chick: { k: 'walk', speed: 0.7, hop: 0.06, scale: 0.8 }, duck: { k: 'walk', speed: 0.55, hop: 0.04, scale: 0.85 },
    bunny: { k: 'walk', speed: 1.1, hop: 0.28, scale: 0.85 }, cat: { k: 'walk', speed: 0.8, hop: 0.03, scale: 0.85 },
    sheep: { k: 'walk', speed: 0.45, hop: 0.03, scale: 0.85 }, turtle: { k: 'walk', speed: 0.18, hop: 0, scale: 0.8 },
    bug: { k: 'walk', speed: 0.35, hop: 0, scale: 0.7 }, camel: { k: 'walk', speed: 0.4, hop: 0.03, scale: 0.85 },
    butterfly: { k: 'fly', speed: 0.9, h: 1.1, r: 0.9, scale: 0.8 }, bird: { k: 'fly', speed: 0.6, h: 2.0, r: 1.6, scale: 0.9 },
    balloon: { k: 'float', h: 1.9, scale: 0.9 }, cloud: { k: 'drift', h: 3.2, scale: 1 },
    flower: { k: 'still', scale: 1 }, sunflower: { k: 'still', scale: 1 }, tree: { k: 'still', scale: 1 },
    house: { k: 'still', scale: 1 }, mosque: { k: 'still', scale: 1 }, rainbow: { k: 'still', scale: 0.9 },
    dog: { k: 'walk', speed: 0.9, hop: 0.05, scale: 0.85 }, cow: { k: 'walk', speed: 0.3, hop: 0.02, scale: 0.85 },
    frog: { k: 'walk', speed: 0.6, hop: 0.35, scale: 0.85 }, elephant: { k: 'walk', speed: 0.3, hop: 0.02, scale: 0.8 },
    giraffe: { k: 'walk', speed: 0.4, hop: 0.02, scale: 0.8 }, penguin: { k: 'walk', speed: 0.4, hop: 0.05, scale: 0.85 },
    snail: { k: 'walk', speed: 0.07, hop: 0, scale: 0.9 }, bee: { k: 'fly', speed: 1.4, h: 0.9, r: 0.6, scale: 0.9 },
    mushroom: { k: 'still', scale: 1 }, pond: { k: 'still', scale: 1 },
  };

  // ---------- Kurulum ----------
  function supported() {
    if (!T) return false;
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }
    catch (e) { return false; }
  }
  function mount(el, callbacks) {
    if (G.ready) return true;
    if (!supported()) return false;
    G.el = el; G.cb = callbacks || {};
    G.renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    G.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    G.renderer.domElement.className = 'world-canvas';
    el.appendChild(G.renderer.domElement);
    G.scene = new T.Scene();
    G.camera = new T.PerspectiveCamera(40, 1, 0.1, 100);
    G.camera.position.set(0, 3.6, 7.4);
    G.camera.lookAt(0, 0.7, 0);
    G.scene.add(new T.HemisphereLight('#e7f5ff', '#69db7c', 0.75));
    const sun = new T.DirectionalLight('#fff9db', 0.75); sun.position.set(4, 8, 5); G.scene.add(sun);

    // Hafif engebeli, düşük poligonlu çimen
    const pg = new T.PlaneGeometry(40, 30, 28, 20);
    const pos = pg.attributes.position;
    for (let k = 0; k < pos.count; k++) pos.setZ(k, (Math.random() - 0.5) * 0.18);
    pg.computeVertexNormals();
    const grass = new T.Mesh(pg, new T.MeshPhongMaterial({ color: '#51cf66', flatShading: true, shininess: 0 }));
    grass.rotation.x = -Math.PI / 2; grass.position.z = -6; G.scene.add(grass);
    // Uzakta birkaç tepe
    [[-12, -20, 5, '#40c057'], [1, -22, 6, '#37b24d'], [13, -19, 4.5, '#40c057']].forEach(([x, z, r, c]) => {
      const h = mesh(geo('hill', () => new T.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)), c, x, 0, z, r, r * 0.55, r); G.scene.add(h);
    });
    G.root = new T.Group(); G.scene.add(G.root);
    G.ray = new T.Raycaster();
    G.ground = new T.Plane(new T.Vector3(0, 1, 0), 0);

    const cv = G.renderer.domElement;
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    G.ready = true;
    resize();
    return true;
  }
  function resize() {
    if (!G.ready) return;
    const w = G.el.clientWidth, h = G.el.clientHeight;
    G.renderer.setSize(w, h, false);
    G.camera.aspect = w / h; G.camera.updateProjectionMatrix();
    // Görünen çimen genişliği: kameradan uzaklığa göre yarım genişlik
    const dist = G.camera.position.length();
    G.bx = Math.max(2, Math.tan(T.MathUtils.degToRad(G.camera.fov / 2)) * dist * G.camera.aspect * 0.72);
    G.bz = 2.2;
  }
  // Kayıtlı konum (yüzde) <-> bahçe koordinatı
  const toX = p => (p / 100 * 2 - 1) * G.bx;
  const ZC = 0.9;   // bahçenin ortası kameraya biraz yakın: alt kısım da dolsun
  const toZ = p => ((p - 25) / 67 * 2 - 1) * G.bz + ZC;
  const fromX = x => Math.round(((x / G.bx + 1) / 2 * 100) * 10) / 10;
  const fromZ = z => Math.round((((z - ZC) / G.bz + 1) / 2 * 67 + 25) * 10) / 10;
  const clampX = x => Math.max(-G.bx, Math.min(G.bx, x));
  const clampZ = z => Math.max(ZC - G.bz, Math.min(ZC + G.bz, z));

  function shadowFor(r) {
    const s = new T.Mesh(geo('shadow', () => new T.CircleGeometry(1, 10)),
      mats.__shadow || (mats.__shadow = new T.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.16, depthWrite: false })));
    s.rotation.x = -Math.PI / 2; s.scale.setScalar(r); s.position.y = 0.02;
    return s;
  }

  /** Bahçeyi kayıtlı listeden yeniden kurar. newIdx: yeni alınan öğe gökten düşerek gelir. */
  function setScene(list, newIdx) {
    if (!G.ready) return;
    G.root.clear(); G.items = [];
    list.forEach((st, idx) => {
      const make = MODELS[st.t];
      if (!make) return;
      const info = KIND[st.t] || { k: 'still', scale: 1 };
      const model = make();
      model.scale.multiplyScalar(info.scale || 1);
      const holder = new T.Group();
      holder.add(model);
      const it = { idx, t: st.t, info, holder, model, x: toX(st.x), z: toZ(st.y), y: 0, vy: 0,
        tx: 0, tz: 0, wait: Math.random() * 2, phase: Math.random() * 6, spin: 0, heading: Math.random() * 6.28 };
      it.tx = it.x; it.tz = it.z;
      if (info.k === 'fly') { it.cx = it.x; it.cz = it.z; }
      if (info.k === 'drift') { it.z = -3 - Math.random() * 2; }        // bulutlar arkada, gökyüzünde
      if (info.k !== 'drift' && info.k !== 'fly' && info.k !== 'float') {
        const sh = shadowFor(st.t === 'house' || st.t === 'mosque' ? 0.75 : st.t === 'tree' ? 0.6 : 0.32 * (info.scale || 1));
        G.root.add(sh); it.shadow = sh;
      }
      if (st.t === 'rainbow' || st.t === 'house' || st.t === 'mosque') it.heading = 0;
      if (idx === newIdx) { it.y = 4; it.vy = 0; it.dropping = true; }
      G.root.add(holder);
      G.items.push(it);
      place(it);
    });
  }
  function place(it) {
    const k = it.info.k;
    let y = it.y;
    if (k === 'fly') y += it.info.h; else if (k === 'float') y += it.info.h; else if (k === 'drift') y += it.info.h;
    it.holder.position.set(it.x, y, it.z);
    it.holder.rotation.y = it.heading + it.spin;
    if (it.shadow) it.shadow.position.set(it.x, 0.02, it.z);
  }

  // ---------- Hareket ----------
  function update(dt) {
    G.time += dt;
    G.items.forEach(it => {
      const inf = it.info;
      if (G.drag && G.drag.it === it) { place(it); return; }
      if (it.dropping || it.y > 0 || it.vy !== 0) {          // düşme / zıplama
        it.vy -= 14 * dt; it.y += it.vy * dt;
        if (it.y <= 0) {
          it.y = 0;
          if (it.dropping === true) { it.vy = 3; it.dropping = 'bounce'; } else { it.vy = 0; it.dropping = false; }
        }
      }
      if (it.spin) { it.spin = Math.max(0, it.spin - dt * 8); }
      if (inf.k === 'walk') {
        if (it.wait > 0) { it.wait -= dt; }
        else {
          const dx = it.tx - it.x, dz = it.tz - it.z, d = Math.hypot(dx, dz);
          if (d < 0.08) {
            it.wait = 0.6 + Math.random() * 2.6;
            const r = 0.6 + Math.random() * 2;
            const a = Math.random() * Math.PI * 2;
            it.tx = clampX(it.x + Math.cos(a) * r); it.tz = clampZ(it.z + Math.sin(a) * r);
          } else {
            const step = Math.min(d, inf.speed * dt);
            it.x += dx / d * step; it.z += dz / d * step;
            const want = Math.atan2(dx, dz);
            let diff = want - it.heading; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            it.heading += diff * Math.min(1, dt * 6);
            it.phase += dt * inf.speed * 9;
            if (it.vy === 0 && it.y === 0) {
              it.model.position.y = Math.abs(Math.sin(it.phase)) * inf.hop;
              it.model.rotation.z = Math.sin(it.phase) * (inf.hop ? 0.08 : 0.02);
            }
          }
        }
        if (it.wait > 0) { it.model.position.y *= 0.8; it.model.rotation.z *= 0.8; }
      } else if (inf.k === 'fly') {
        it.phase += dt * inf.speed;
        const px = it.x, pz = it.z;
        it.x = clampX(it.cx + Math.cos(it.phase) * inf.r);
        it.z = clampZ(it.cz + Math.sin(it.phase * 1.3) * inf.r * 0.6);
        it.model.position.y = Math.sin(it.phase * 2.2) * 0.25;
        it.heading = Math.atan2(it.x - px, it.z - pz);
        const flap = Math.sin(G.time * (it.t === 'butterfly' ? 18 : 12));
        it.model.children.forEach(c => { if (c.userData.wing) c.rotation.z = c.userData.wing * flap * 0.7; });
      } else if (inf.k === 'float') {
        it.model.position.y = Math.sin(G.time * 1.3 + it.phase) * 0.15;
        it.model.rotation.z = Math.sin(G.time * 0.9 + it.phase) * 0.08;
      } else if (inf.k === 'drift') {
        it.x += dt * 0.18;
        if (it.x > G.bx + 2) it.x = -G.bx - 2;
      } else if (it.t === 'flower' || it.t === 'sunflower') {
        it.model.rotation.z = Math.sin(G.time * 1.5 + it.phase) * 0.06;
      } else if (it.t === 'pond') {                        // balık arada bir sudan sıçrar
        const f = it.model.userData.fish, cyc = (G.time + it.phase) % 3.5;
        f.visible = cyc < 0.9;
        if (f.visible) { const u = cyc / 0.9; f.position.set(-0.3 + u * 0.6, Math.sin(u * Math.PI) * 0.5, 0); f.rotation.z = 0; f.rotation.x = (u - 0.5) * 2.2; f.rotation.y = Math.PI / 2; }
      }
      if (it.t === 'dog') it.model.children.forEach(c => { if (c.userData.tail) c.rotation.z = Math.sin(G.time * 14) * 0.5; });
      place(it);
    });
  }
  function loop(t) {
    const dt = Math.min(0.05, (t - (G.last || t)) / 1000); G.last = t;
    update(dt);
    G.renderer.render(G.scene, G.camera);
    G.raf = requestAnimationFrame(loop);
  }
  function start() { if (!G.ready || G.raf) return; resize(); G.last = 0; G.raf = requestAnimationFrame(loop); }
  function stop() { cancelAnimationFrame(G.raf); G.raf = 0; }

  // ---------- Dokunma: dokununca zıplar, sürükleyince taşınır ----------
  function hit(e) {
    const r = G.renderer.domElement.getBoundingClientRect();
    const v = new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    G.ray.setFromCamera(v, G.camera);
    return v;
  }
  function onDown(e) {
    hit(e);
    const hits = G.ray.intersectObjects(G.items.map(i => i.holder), true);
    if (!hits.length) return;
    let o = hits[0].object;
    const it = G.items.find(i => { let p = o; while (p) { if (p === i.holder) return true; p = p.parent; } return false; });
    if (!it) return;
    e.preventDefault();
    G.renderer.domElement.setPointerCapture(e.pointerId);
    G.drag = { it, sx: e.clientX, sy: e.clientY, moved: false };
  }
  function onMove(e) {
    if (!G.drag) return;
    if (Math.hypot(e.clientX - G.drag.sx, e.clientY - G.drag.sy) > 8) G.drag.moved = true;
    if (!G.drag.moved) return;
    hit(e);
    const p = new T.Vector3();
    if (!G.ray.ray.intersectPlane(G.ground, p)) return;
    const it = G.drag.it;
    it.x = clampX(p.x); it.z = clampZ(p.z);
    if (it.info.k === 'fly') { it.cx = it.x; it.cz = it.z; }
    it.tx = it.x; it.tz = it.z; it.wait = 1.5;
    it.y = 0.25;
  }
  function onUp() {
    if (!G.drag) return;
    const { it, moved } = G.drag;
    G.drag = null;
    if (moved) {
      it.y = 0.25; it.vy = 0;
      if (G.cb.onMove) G.cb.onMove(it.idx, fromX(it.x), fromZ(it.z));
    } else {
      if (it.info.k === 'walk' || it.info.k === 'still') { it.vy = 4; it.y = 0.01; }
      it.spin = Math.PI * 2;
      if (G.cb.onTap) G.cb.onTap(it.idx, it.t);
    }
  }

  window.addEventListener('resize', resize);
  return { supported, mount, setScene, start, stop, resize, MODELS };
})();

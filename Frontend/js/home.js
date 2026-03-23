// TradeConnect - Home Page Scripts


/* ── SCROLL PROGRESS + NAVBAR SHRINK + FLOAT LOGIN ── */
const navbar    = document.getElementById('navbar');
const floatLogin = document.getElementById('floatLogin');

window.addEventListener('scroll', () => {
  const sy  = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  document.getElementById('spb').style.width = (sy / max * 100) + '%';
  navbar.classList.toggle('scrolled', sy > 60);
  floatLogin.classList.toggle('visible', sy / max > 0.72);
}, { passive: true });


/* ── COUNT-UP ── */
function countUp(el) {
  const target = parseInt(el.dataset.target, 10);
  const s = performance.now();
  const ease = t => 1 - Math.pow(1-t, 3);
  el.removeAttribute('data-target');
  (function step(now) {
    const p = Math.min((now-s)/1700, 1), v = Math.round(ease(p)*target);
    el.textContent = v >= 1000 ? v.toLocaleString() : v;
    if (p < 1) requestAnimationFrame(step);
  })(s);
}

/* ── INTERSECTION OBSERVER — scroll reveals ── */
const animEls  = Array.from(document.querySelectorAll('[data-anim]'));
const seenEls  = new Set();

const animObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const el  = e.target;
    const ratio = e.intersectionRatio;

    if (e.isIntersecting && ratio >= 0.18) {
      el.classList.remove('anim-out');
      el.classList.add('anim-in');
      seenEls.add(el);

      if (el.classList.contains('sg-item')) {
        el.classList.add('in');
        setTimeout(() => {
          el.classList.add('ring-pulse');
          setTimeout(() => el.classList.remove('ring-pulse'), 800);
        }, 200);
      }
      if (el.classList.contains('m-card')) {
        /* animation handled by CSS .anim-in keyframes */
      }
      if (el.closest && el.closest('.cta-section')) {
        const sec = document.querySelector('.cta-section');
        if (sec) {
          setTimeout(() => {
            sec.classList.add('glow-once');
            setTimeout(() => sec.classList.remove('glow-once'), 1400);
          }, 350);
        }
      }

    } else if (!e.isIntersecting && seenEls.has(el)) {
      el.classList.remove('anim-in');
      el.classList.add('anim-out');
      el.addEventListener('transitionend', function snap() {
        if (el.classList.contains('anim-out')) el.classList.remove('anim-out');
        el.removeEventListener('transitionend', snap);
      });
    }
  });
}, { threshold: [0, 0.18, 1], rootMargin: '0px 0px -30px 0px' });

animEls.forEach(el => animObs.observe(el));

document.querySelectorAll('.reveal').forEach(el => {
  if (!el.dataset.anim) {
    el.classList.add('anim-fade-up');
    el.setAttribute('data-anim','');
    animObs.observe(el);
  }
});

document.querySelectorAll('.m-card').forEach((el, i) => {
  if (!el.dataset.anim) {
    el.setAttribute('data-anim','');
    el.style.transitionDelay = (i * 0.09) + 's';
    animObs.observe(el);
  }
});

const countObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && e.target.dataset.target) {
      countUp(e.target);
      countObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.count-up').forEach(el => countObs.observe(el));

/* ── 3D tilt on market cards ── */
document.querySelectorAll('.m-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    gsap.to(card, { rotationY:x*18, rotationX:-y*12, transformPerspective:700, scale:1.04, duration:.3, ease:'power2.out' });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotationY:0, rotationX:0, scale:1, duration:.5, ease:'power2.out' });
  });
});

/* ═══════════════════════════════════════════
   HERO — CYLINDRICAL ORBIT
   Trading objects circling in a cylinder
═══════════════════════════════════════════ */
(function heroCylinder() {
  if (typeof THREE === 'undefined') return;
  const cv = document.getElementById('heroCanvas');
  if (!cv) return;

  const scene = new THREE.Scene();
  const cam   = new THREE.PerspectiveCamera(52, cv.offsetWidth / cv.offsetHeight, 0.1, 100);
  cam.position.set(0, 0.5, 7);

  const ren = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
  ren.setSize(cv.offsetWidth, cv.offsetHeight);
  ren.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  const root = new THREE.Group();
  scene.add(root);

  /* ── Cylinder orbit params ── */
  const RADIUS   = 3.2;   /* orbit radius */
  const CYL_H    = 2.8;   /* height spread */
  const N_ITEMS  = 22;    /* total orbiting objects */
  const BASE_SPD = 0.004; /* base rotation speed */

  /* ── Build orbiting items ── */
  const items = [];

  for (let i = 0; i < N_ITEMS; i++) {
    const angle  = (i / N_ITEMS) * Math.PI * 2;
    const yOff   = (Math.random() - 0.5) * CYL_H;
    const bull   = Math.random() > 0.42;
    const bodyH  = 0.18 + Math.random() * 0.42;
    const lane   = 1 + (i % 3) * 0.22; /* 3 concentric lanes */
    const r      = RADIUS * lane * 0.78;

    const g = new THREE.Group();

    /* Candle body */
    const col  = bull ? 0x32D583 : 0x9B4DCA;
    const bG   = new THREE.BoxGeometry(0.18, bodyH, 0.18);
    const bM   = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.82 });
    g.add(new THREE.Mesh(bG, bM));

    /* Wick top */
    const wG = new THREE.BoxGeometry(0.03, bodyH * 0.5, 0.03);
    const wM = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5 });
    const wt = new THREE.Mesh(wG, wM);
    wt.position.y = bodyH / 2 + bodyH * 0.25;
    g.add(wt);
    /* Wick bottom */
    const wb = new THREE.Mesh(wG, wM.clone());
    wb.position.y = -(bodyH / 2 + bodyH * 0.2);
    g.add(wb);

    root.add(g);
    items.push({
      g, angle,
      r,
      yBase: yOff,
      spd:   BASE_SPD * (0.7 + Math.random() * 0.6) * (i % 2 === 0 ? 1 : -1), /* alternating direction */
      floatPhase: Math.random() * Math.PI * 2,
      floatSpd:   0.008 + Math.random() * 0.008,
      floatAmp:   0.06  + Math.random() * 0.08,
      lane,
    });
  }

  /* ── Background particles ── */
  const pPos = [];
  for (let i = 0; i < 180; i++)
    pPos.push((Math.random()-.5)*18, (Math.random()-.5)*12, (Math.random()-.5)*10);
  const pG2 = new THREE.BufferGeometry();
  pG2.setAttribute('position', new THREE.Float32BufferAttribute(pPos, 3));
  root.add(new THREE.Points(pG2, new THREE.PointsMaterial({
    color: 0x9b82ff, size: 0.04, transparent: true, opacity: 0.28, sizeAttenuation: true
  })));

  /* ── Mouse ── */
  let mX = 0, mY = 0;
  window.addEventListener('mousemove', e => {
    mX = (e.clientX / innerWidth  - 0.5) * 2;
    mY = -(e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  let active = true, rafId = null, fr = 0;

  function render() {
    if (!active) { rafId = null; return; }
    fr++;
    const t = fr * 0.01;

    /* Slow tilt of whole cylinder */
    root.rotation.x = Math.sin(t * 0.12) * 0.14 + mY * 0.05;
    root.rotation.y = t * 0.06 + mX * 0.08;

    /* Update each orbiting item */
    items.forEach(item => {
      item.angle += item.spd;
      item.floatPhase += item.floatSpd;

      const x = Math.cos(item.angle) * item.r;
      const z = Math.sin(item.angle) * item.r;
      const y = item.yBase + Math.sin(item.floatPhase) * item.floatAmp;

      item.g.position.set(x, y, z);

      /* Always face outward from axis */
      item.g.rotation.y = -item.angle;
      item.g.rotation.z = item.spd > 0 ? -0.15 : 0.15;

      /* Smooth fade — invisible in front half, fully visible in back half
         Uses cosine so transition is gradual with no harsh edge */
      const angle01 = (Math.cos(item.angle) + 1) / 2; /* 0=back, 1=front */
      const frontFade = angle01 < 0.5
        ? 1                              /* back half — fully visible */
        : 1 - Math.pow((angle01 - 0.5) * 2, 1.6); /* front half — smooth fade out */

      item.g.traverse(child => {
        if (child.material) {
          const base = child.material._baseOpacity ?? child.material.opacity;
          if (!child.material._baseOpacity) child.material._baseOpacity = base;
          child.material.opacity = Math.max(0, base * frontFade);
        }
      });
    });

    /* Camera drift */
    cam.position.x += (mX * 0.6 - cam.position.x) * 0.02;
    cam.position.y += (mY * 0.4 + 0.5 - cam.position.y) * 0.02;
    cam.lookAt(0, 0, 0);

    ren.render(scene, cam);
    rafId = requestAnimationFrame(render);
  }

  new IntersectionObserver(entries => {
    active = entries[0].isIntersecting;
    if (active && !rafId) render();
  }, { threshold: 0.01 }).observe(document.getElementById('top'));

  window.addEventListener('resize', () => {
    cam.aspect = cv.offsetWidth / cv.offsetHeight;
    cam.updateProjectionMatrix();
    ren.setSize(cv.offsetWidth, cv.offsetHeight);
  }, { passive: true });

  render();
})();


/* ═══════════════════════════════════════════
   THREE.JS — FEATURES (zoom in/out per section)
═══════════════════════════════════════════ */
(function featThree() {
  if (typeof THREE === 'undefined') return;
  const cv = document.getElementById('featCanvas');
  if (!cv) return;

  const W=cv.offsetWidth||innerWidth, H=cv.offsetHeight||600;
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(52,W/H,.1,200);
  cam.position.set(0,0,14);
  const ren=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});
  ren.setSize(W,H); ren.setPixelRatio(Math.min(devicePixelRatio,1.5));

  const group=new THREE.Group(); scene.add(group);
  const icoM=new THREE.MeshBasicMaterial({color:0x7B61FF,wireframe:true,transparent:true,opacity:.16});
  group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.8,1),icoM));

  const N2=80,sp2=[],sc2=[];
  for(let i=0;i<N2;i++){
    const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),r=3.4+(Math.random()-.5)*.6;
    sp2.push(r*Math.sin(ph)*Math.cos(th),r*Math.sin(ph)*Math.sin(th),r*Math.cos(ph));
    const t=Math.random(); sc2.push(.55+.3*t,.44+.06*t,1);
  }
  const spG=new THREE.BufferGeometry();
  spG.setAttribute('position',new THREE.Float32BufferAttribute(sp2,3));
  spG.setAttribute('color',new THREE.Float32BufferAttribute(sc2,3));
  group.add(new THREE.Points(spG,new THREE.PointsMaterial({size:.05,vertexColors:true,transparent:true,opacity:.48,sizeAttenuation:true})));

  const rings=[];
  [{r:4.1,tube:.008,col:0x7B61FF,rx:.2,op:.09},{r:3.5,tube:.007,col:0x5E6AD2,rx:1.2,op:.065},{r:2.8,tube:.006,col:0xb4a0ff,rx:.6,op:.05}].forEach(d=>{
    const m=new THREE.Mesh(new THREE.TorusGeometry(d.r,d.tube,8,100),new THREE.MeshBasicMaterial({color:d.col,transparent:true,opacity:d.op}));
    m.rotation.x=d.rx; group.add(m); rings.push(m);
  });

  let mX2=0,mY2=0,fr=0,active=false,rafId=null,targetCamZ=14,targetScale=1.0;
  window.addEventListener('mousemove',e=>{ mX2=(e.clientX/innerWidth-.5)*2; mY2=-(e.clientY/innerHeight-.5)*2; });

  new IntersectionObserver(entries=>{
    active=entries[0].isIntersecting;
    cv.classList.toggle('active',active);
    if(active&&!rafId) render();
  },{threshold:0.05}).observe(document.getElementById('features'));

  const themes=[
    {camZ:14,scale:1.0,col:0x7B61FF},{camZ:7,scale:1.26,col:0x9b82ff},
    {camZ:18,scale:0.74,col:0x32D583},{camZ:5,scale:1.42,col:0xF9C449},
    {camZ:20,scale:0.62,col:0xF97066},{camZ:9,scale:1.1,col:0x7B61FF},
  ];
  const itemObs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const items=Array.from(document.querySelectorAll('.feat-item'));
      const idx=items.indexOf(e.target); if(idx<0) return;
      const th=themes[idx+1]||themes[0];
      targetCamZ=th.camZ; targetScale=th.scale; icoM.color.setHex(th.col);
    });
  },{threshold:0.55});
  document.querySelectorAll('.feat-item').forEach(el=>itemObs.observe(el));

  function render(){
    if(!active){rafId=null;return;}
    fr++;
    const t=fr*.012;
    group.rotation.y=t*.28; group.rotation.x=t*.12;
    rings[0].rotation.z=t*.18; rings[1].rotation.z=-t*.14; rings[2].rotation.y=t*.22;
    cam.position.x+=(mX2*1.4-cam.position.x)*.015;
    cam.position.y+=(mY2*0.9-cam.position.y)*.015;
    cam.position.z+=(targetCamZ-cam.position.z)*.055;
    group.scale.setScalar(group.scale.x+(targetScale-group.scale.x)*.055);
    cam.lookAt(0,0,0);
    ren.render(scene,cam);
    rafId=requestAnimationFrame(render);
  }

  window.addEventListener('resize',()=>{
    cam.aspect=innerWidth/innerHeight;
    cam.updateProjectionMatrix();
    ren.setSize(innerWidth,innerHeight);
  },{passive:true});
})();

/* ── BUTTON RIPPLE EFFECT ── */
document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});
// ============================================================
// SUBWAY RUNNER — main.js  (2026 Design Upgrade)
// Full game logic — one file, zero dependencies beyond Three.js
// ============================================================

import * as THREE from 'three';

// ============================================================
// GAME DATA
// ============================================================

const CHARACTERS = [
  { id:'jake',   name:'Jake',   color:0xFF6B2B, secondary:0x1565C0, accent:0xFFD700,
    bodyStyle:'default', unlocked:true,  ability:'None',          emoji:'🧑' },
  { id:'tricky', name:'Tricky', color:0xE91E63, secondary:0x880E4F, accent:0x00F5FF,
    bodyStyle:'hat',     unlocked:false, ability:'Fast Switch',   emoji:'👒', tokenCost:30 },
  { id:'fresh',  name:'Fresh',  color:0x00BCD4, secondary:0x006064, accent:0xCCFF00,
    bodyStyle:'cap',     unlocked:false, ability:'+Magnet Range', emoji:'🧢', tokenCost:30 },
];

// WORLD TOUR THEMES — all visual tokens change simultaneously
const THEMES = [
  {
    id:'city', name:'CITY',
    skyBot:0x000814,
    trackColor:0x12121e, railColor:0x444466,
    trainColor:0xF9A825,
    buildingColors:[0x0d1117, 0x111827, 0x1a1a2e],
    ambientColor:0x1a1a3e, dirColor:0x9090ff,
    fogColor:0x000814, fogNear:65, fogFar:130,
    groundColor:0x0a1628,
    orbColors:['rgba(255,0,110,0.15)','rgba(0,245,255,0.12)','rgba(57,255,20,0.10)'],
    accentColor:'#3B82F6',
  },
  {
    id:'tokyo', name:'TOKYO',
    skyBot:0x000000,
    trackColor:0x120820, railColor:0xce93d8,
    trainColor:0xCC0000,
    buildingColors:[0x1a0033, 0x0d0019, 0x200040],
    ambientColor:0x6a0dad, dirColor:0xff80ab,
    fogColor:0x050010, fogNear:50, fogFar:110,
    groundColor:0x100025,
    orbColors:['rgba(255,0,255,0.16)','rgba(0,245,255,0.13)','rgba(255,0,153,0.14)'],
    accentColor:'#FF00FF',
  },
  {
    id:'paris', name:'PARIS',
    skyBot:0x000000,
    trackColor:0x1a1200, railColor:0xc8a96e,
    trainColor:0x2d5a27,
    buildingColors:[0x1a1000, 0x2a1a00, 0x150f00],
    ambientColor:0x5c3200, dirColor:0xffd54f,
    fogColor:0x0a0600, fogNear:70, fogFar:140,
    groundColor:0x1a1000,
    orbColors:['rgba(255,107,53,0.17)','rgba(255,215,0,0.13)','rgba(255,140,0,0.12)'],
    accentColor:'#F97316',
  },
];

const MISSION_POOL = [
  { type:'coins',    target:50,   text:'Collect {n} coins' },
  { type:'coins',    target:100,  text:'Collect {n} coins' },
  { type:'distance', target:500,  text:'Run {n} meters' },
  { type:'distance', target:1000, text:'Run {n} meters' },
  { type:'powerups', target:2,    text:'Use {n} power-ups' },
  { type:'powerups', target:3,    text:'Use {n} power-ups' },
  { type:'rolls',    target:5,    text:'Roll under {n} obstacles' },
  { type:'jumps',    target:5,    text:'Jump over {n} trains' },
  { type:'board',    target:1,    text:'Use a hoverboard' },
  { type:'survive',  target:30,   text:'Survive {n} seconds' },
  { type:'survive',  target:60,   text:'Survive {n} seconds' },
];

const DAILY_WORDS = ['SUBWAY','RUNNER','TRAINS','SPRINT','BOUNCE','ESCAPE','HUSTLE','DANCER','BLAZER','GRAVEL'];

const POWERUP_TYPES = [
  { id:'magnet',   label:'Magnet',   icon:'🧲', color:0x3B82F6, duration:10, css:'magnet',  ringColor:'#3B82F6' },
  { id:'jetpack',  label:'Jetpack',  icon:'🚀', color:0xF97316, duration:8,  css:'jetpack', ringColor:'#F97316' },
  { id:'sneakers', label:'Sneakers', icon:'👟', color:0x22C55E, duration:10, css:'sneakers',ringColor:'#22C55E' },
  { id:'x2',       label:'2× Score', icon:'⭐', color:0xA855F7, duration:15, css:'x2mult',  ringColor:'#A855F7' },
];

// ============================================================
// CONSTANTS
// ============================================================

const LANE_WIDTH    = 3.5;
const LANES         = [-LANE_WIDTH, 0, LANE_WIDTH];
const TRACK_SEG_LEN = 30;
const TRACK_SEGS    = 10;

const SPEED_TIERS = [
  { name:'NORMAL',    speed:18, color:'#22C55E' },
  { name:'FAST',      speed:28, color:'#FFC107' },
  { name:'VERY FAST', speed:38, color:'#F97316' },
  { name:'EXTREME',   speed:50, color:'#FF3333' },
];

// ============================================================
// SAVE DATA
// ============================================================

function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem('subwayRunner2026') || '{}');
    return {
      highScore:       d.highScore       || 0,
      totalCoins:      d.totalCoins      || 0,
      multiplierLevel: d.multiplierLevel || 1,
      selectedChar:    d.selectedChar    || 'jake',
      selectedTheme:   d.selectedTheme   || 'city',
      hoverboards:     d.hoverboards !== undefined ? d.hoverboards : 3,
      missionSet:      d.missionSet      || null,
      missionProgress: d.missionProgress || [0,0,0],
      wordHuntDate:    d.wordHuntDate    || '',
      wordHuntLetters: d.wordHuntLetters || [],
      reduceMotion:    d.reduceMotion    || false,
    };
  } catch(e) {
    return { highScore:0,totalCoins:0,multiplierLevel:1,selectedChar:'jake',selectedTheme:'city',
             hoverboards:3,missionSet:null,missionProgress:[0,0,0],wordHuntDate:'',wordHuntLetters:[],reduceMotion:false };
  }
}
function saveSave(s) {
  try { localStorage.setItem('subwayRunner2026', JSON.stringify(s)); } catch(e){}
}

// ============================================================
// UTILITIES
// ============================================================

const randInt   = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const randFloat = (a,b) => Math.random()*(b-a)+a;
const lerp      = (a,b,t) => a+(b-a)*t;
const clamp     = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const easeOut   = (t) => 1-Math.pow(1-t,3);

let reduceMotion = false;

function showToast(msg, color='#FFD700') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.color = color;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// Coin +1 float-up
function spawnCoinFloat(value, screenX, screenY) {
  if (reduceMotion) return;
  const el = document.createElement('div');
  el.className = 'coin-float';
  el.textContent = `+${value}`;
  el.style.left = `${screenX}px`;
  el.style.top  = `${screenY}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 650);
}

// Screen edge flash
function flashScreen(color, opacity=0.22, durationMs=150) {
  if (reduceMotion) return;
  const el = document.getElementById('screen-flash');
  el.style.background = color;
  el.style.opacity    = opacity;
  setTimeout(() => { el.style.opacity = 0; }, durationMs);
}

// Camera shake state (applied in update)
let cameraShake = { active:false, intensity:0, timer:0, oscillations:0 };
function triggerCameraShake(intensity=5, durationMs=300, oscillations=3) {
  if (reduceMotion) return;
  cameraShake = { active:true, intensity, timer:durationMs/1000, oscillations, elapsed:0 };
}

// Mission banner
let missionBannerTimer = 0;
function showMissionBanner(multLevel) {
  document.getElementById('mb-mult-val').textContent = `×${multLevel}`;
  const b = document.getElementById('mission-banner');
  b.classList.add('show');
  missionBannerTimer = 2.2;
}

// ============================================================
// GEOMETRY HELPERS
// ============================================================

function makeMat(color, roughness=0.75, emissive=null, emissiveIntensity=0) {
  const opts = { color, roughness, metalness:0.08 };
  if (emissive) { opts.emissive = emissive; opts.emissiveIntensity = emissiveIntensity; }
  return new THREE.MeshStandardMaterial(opts);
}
function makeBox(w,h,d,color,roughness=0.75,emissive=null,ei=0) {
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), makeMat(color,roughness,emissive,ei));
}
function makeCyl(rt,rb,h,segs,color) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segs), makeMat(color));
}
function makeSph(r,segs,color,emissive=null,ei=0) {
  return new THREE.Mesh(new THREE.SphereGeometry(r,segs,segs), makeMat(color,0.6,emissive,ei));
}

// ============================================================
// CHARACTER BUILDER (Rule of Three: 60% primary, 30% secondary, 10% accent)
// ============================================================

function buildCharacterMesh(charData) {
  const g  = new THREE.Group();
  const pc = charData.color;
  const sc = charData.secondary;
  const ac = charData.accent;

  // Body (60% primary color)
  const body = makeBox(0.92,1.2,0.6, pc, 0.7);
  body.position.y = 1.0; body.castShadow = true; g.add(body);

  // Head
  const head = makeSph(0.42, 8, 0xFFD5A8);
  head.position.y = 2.0; head.castShadow = true; g.add(head);

  // Eyes
  const eyeL = makeSph(0.08,6, 0x111111); eyeL.position.set(-0.14,2.08,0.38); g.add(eyeL);
  const eyeR = makeSph(0.08,6, 0x111111); eyeR.position.set( 0.14,2.08,0.38); g.add(eyeR);
  // Eye shine (10% accent)
  const shineL = makeSph(0.035,4, ac, ac, 0.8); shineL.position.set(-0.11,2.10,0.43); g.add(shineL);
  const shineR = makeSph(0.035,4, ac, ac, 0.8); shineR.position.set( 0.11,2.10,0.43); g.add(shineR);

  // Legs (30% secondary color)
  const legL = makeBox(0.32,0.82,0.32, sc); legL.position.set(-0.22,0.2,0); legL.castShadow=true; g.add(legL);
  const legR = makeBox(0.32,0.82,0.32, sc); legR.position.set( 0.22,0.2,0); legR.castShadow=true; g.add(legR);

  // Arms (primary)
  const armL = makeBox(0.28,0.82,0.28, pc); armL.position.set(-0.66,1.0,0); armL.castShadow=true; g.add(armL);
  const armR = makeBox(0.28,0.82,0.28, pc); armR.position.set( 0.66,1.0,0); armR.castShadow=true; g.add(armR);

  // Accessory (hat / cap)
  if (charData.bodyStyle === 'hat') {
    const hat = makeCyl(0.35,0.42,0.5,8, 0x880E4F); hat.position.set(0,2.56,0); g.add(hat);
    const brim = makeBox(0.9,0.08,0.9, 0x6a0d40); brim.position.set(0,2.33,0); g.add(brim);
  } else if (charData.bodyStyle === 'cap') {
    const cap = makeBox(0.92,0.18,0.95, 0x006064); cap.position.set(0,2.46,0.04); g.add(cap);
    const brim = makeBox(0.55,0.1,0.28, 0x004D52); brim.position.set(0,2.35,0.5); g.add(brim);
  }

  // Backpack with spray can
  const pack = makeBox(0.62,0.72,0.22, 0x795548); pack.position.set(0,1.0,-0.41); g.add(pack);
  const can  = makeCyl(0.06,0.06,0.3,6, ac); can.position.set(0.16,0.72,-0.55); can.rotation.x=0.3; g.add(can);
  // Accent stripe on body
  const stripe = makeBox(0.93,0.12,0.62, ac, 0.5, ac, 0.4); stripe.position.set(0,1.48,0); g.add(stripe);

  // Selection / board ring
  const ringGeo = new THREE.RingGeometry(0.72,0.88,24);
  const ringMat = new THREE.MeshBasicMaterial({ color:0x00F5FF, side:THREE.DoubleSide, transparent:true, opacity:0.9 });
  const ring    = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI/2; ring.position.y = 0.04; ring.visible = false; ring.name = 'boardRing';
  g.add(ring);

  // Glow mesh (powerup state)
  const glowGeo = new THREE.SphereGeometry(1.0, 10, 10);
  const glowMat = new THREE.MeshBasicMaterial({ color:0x00F5FF, transparent:true, opacity:0, wireframe:false });
  const glow    = new THREE.Mesh(glowGeo, glowMat); glow.name='glow'; glow.position.y=1.0; g.add(glow);

  g.castShadow = true;
  return g;
}

// ============================================================
// TRACK SEGMENT
// ============================================================

class TrackSegment {
  constructor(theme) {
    this.group = new THREE.Group();
    this._build(theme);
  }

  _build(theme) {
    const g = this.group;
    const tw = LANE_WIDTH*3+1.8;

    // Ground
    const track = makeBox(tw,0.3,TRACK_SEG_LEN, theme.trackColor, 0.95);
    track.position.y=-0.15; track.receiveShadow=true; g.add(track);

    // Rail ties
    for (let i=0; i<8; i++) {
      const tie = makeBox(tw,0.1,0.28, 0x3d2b1a);
      tie.position.set(0,0.02, -TRACK_SEG_LEN/2 + i*(TRACK_SEG_LEN/8)+1.6);
      g.add(tie);
    }

    // Rails
    [-LANE_WIDTH*1.5, -LANE_WIDTH*0.5, LANE_WIDTH*0.5, LANE_WIDTH*1.5].forEach(rx => {
      const rail = makeBox(0.1,0.1,TRACK_SEG_LEN, theme.railColor, 0.2);
      rail.position.set(rx,0.07,0); g.add(rail);
    });

    // Lane glow strips (subtle accent)
    [-LANE_WIDTH,0,LANE_WIDTH].forEach(lx => {
      const strip = makeBox(0.06,0.01,TRACK_SEG_LEN, 0x00F5FF, 0.1, 0x00F5FF, 0.15);
      strip.position.set(lx,0.01,0); g.add(strip);
    });

    // Ground sides
    const gL = makeBox(9,0.2,TRACK_SEG_LEN, theme.groundColor||0x0a1628);
    gL.position.set(-LANE_WIDTH*1.5-4.5,-0.1,0); gL.receiveShadow=true; g.add(gL);
    const gR = makeBox(9,0.2,TRACK_SEG_LEN, theme.groundColor||0x0a1628);
    gR.position.set( LANE_WIDTH*1.5+4.5,-0.1,0); gR.receiveShadow=true; g.add(gR);

    this._addBuildings(theme);
  }

  _addBuildings(theme) {
    const g = this.group;
    const colors = theme.buildingColors;
    for (let side=-1; side<=1; side+=2) {
      const count = randInt(2,4);
      for (let i=0; i<count; i++) {
        const w = randFloat(3,8), h = randFloat(9,22), d = randFloat(3,6);
        const col = colors[randInt(0,colors.length-1)];
        const bld = makeBox(w,h,d, col, 0.95);
        const xPos = side*(LANE_WIDTH*1.5+5+randFloat(1,4));
        const zPos = randFloat(-TRACK_SEG_LEN/2, TRACK_SEG_LEN/2);
        bld.position.set(xPos,h/2,zPos);
        bld.castShadow=true; bld.receiveShadow=true; g.add(bld);

        // Lit windows
        if (h>10) {
          for (let wy=3; wy<h-2; wy+=2.8) {
            if (Math.random()>0.4) {
              const win = makeBox(w*0.14,0.65,0.04, 0xFFF9C4, 0.1, 0xfffae0, 0.6);
              win.position.set(xPos+side*0.01, wy, zPos+d/2+0.02); g.add(win);
            }
          }
        }
        // Rooftop light (accent)
        if (Math.random()>0.6) {
          const rLight = makeSph(0.15,6, theme.trainColor||0xff0000, theme.trainColor||0xff0000, 0.8);
          rLight.position.set(xPos, h+0.2, zPos); g.add(rLight);
        }
      }
    }
  }

  setZ(z) { this.group.position.z = z; }
}

// ============================================================
// OBSTACLE
// ============================================================

class Obstacle {
  constructor(type, lane, z, theme) {
    this.type = type;
    this.lane = lane;
    this.z    = z;
    this.alive = true;
    this.halfW = type==='train' ? 1.6 : 0.95;
    this.mesh  = this._build(type, theme);
    this.mesh.position.set(LANES[lane], 0, z);
  }

  _build(type, theme) {
    const g = new THREE.Group();
    if (type==='train') {
      const body = makeBox(LANE_WIDTH-0.3, 4, 18, theme.trainColor, 0.6, theme.trainColor, 0.1);
      body.position.y=2; body.castShadow=true; g.add(body);
      const top = makeBox(LANE_WIDTH-0.6,0.4,17, 0x111111); top.position.y=4.22; g.add(top);
      for (let wz=-6; wz<=6; wz+=3) {
        const win = makeBox(LANE_WIDTH-0.9,1.1,0.08, 0x80DEEA, 0.2, 0x80DEEA, 0.3);
        win.position.set(0,2.5,wz); g.add(win);
      }
      [-7,7].forEach(wz => {
        const wh = makeCyl(0.5,0.5,LANE_WIDTH,8, 0x222222);
        wh.rotation.z=Math.PI/2; wh.position.set(0,0.28,wz); g.add(wh);
      });
      // Headlight glow
      const hl = makeSph(0.25,8, 0xffffaa, 0xffffaa, 1.0);
      hl.position.set(0,2.0,-9); g.add(hl);
    } else if (type==='barrier') {
      const p1=makeBox(0.2,1.8,0.2,0xDD2C00); p1.position.set(-0.72,0.9,0); g.add(p1);
      const p2=makeBox(0.2,1.8,0.2,0xDD2C00); p2.position.set( 0.72,0.9,0); g.add(p2);
      const bar=makeBox(1.65,0.24,0.24,0xFFFFFF); bar.position.set(0,1.5,0); g.add(bar);
      const str=makeBox(1.65,0.18,0.26,0xDD2C00); str.position.set(0,1.22,0); g.add(str);
      // Warning light
      const wl=makeSph(0.14,6,0xFFEB3B,0xFFEB3B,1.0); wl.position.set(0,1.96,0); g.add(wl);
    } else if (type==='highBarrier') {
      const frame=makeBox(2.9,3.6,0.28, 0xBF360C, 0.7, 0xBF360C, 0.1);
      frame.position.y=1.8; frame.castShadow=true; g.add(frame);
      const gap=makeBox(2.5,1.0,0.4, 0x050505); gap.position.y=0.5; g.add(gap);
      const wl=makeSph(0.22,6,0xFF3333,0xFF3333,1.0); wl.position.set(0,3.72,0); g.add(wl);
    }
    return g;
  }
}

// ============================================================
// COIN
// ============================================================

class Coin {
  constructor(lane, z, height=0, isGolden=false) {
    this.lane=lane; this.z=z; this.alive=true;
    this.isGolden=isGolden; this.value=isGolden?5:1;
    const r   = isGolden ? 0.37 : 0.27;
    const col = isGolden ? 0xFFD700 : 0xFFC107;
    const emi = isGolden ? 0xFF8F00 : 0xF57F17;
    const geo = new THREE.CylinderGeometry(r,r,0.1,10);
    const mat = new THREE.MeshStandardMaterial({ color:col, roughness:0.25, metalness:0.85, emissive:emi, emissiveIntensity:isGolden?0.5:0.2 });
    this.mesh = new THREE.Mesh(geo,mat);
    this.mesh.rotation.x = Math.PI/2;
    this.mesh.position.set(LANES[lane], height+0.5, z);
    this.mesh.castShadow = true;
    this.rotSpeed = randFloat(2.5,4.5);
  }
  update(dt) { this.mesh.rotation.z += this.rotSpeed*dt; }
}

// ============================================================
// POWER-UP
// ============================================================

class PowerUp {
  constructor(typeData, lane, z) {
    this.typeData=typeData; this.lane=lane; this.z=z; this.alive=true;
    const g=new THREE.Group();
    const outerMat = new THREE.MeshStandardMaterial({
      color:typeData.color, roughness:0.35, metalness:0.2,
      emissive:typeData.color, emissiveIntensity:0.55, transparent:true, opacity:0.55
    });
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.57,10,10), outerMat));
    const inner = makeBox(0.62,0.62,0.62, 0xffffff, 0.5, 0xffffff, 0.12);
    inner.rotation.y=Math.PI/4; g.add(inner);
    this.mesh=g;
    this.mesh.position.set(LANES[lane],1.2,z);
    this.bobOffset=Math.random()*Math.PI*2;
  }
  update(dt,elapsed) {
    this.mesh.rotation.y += 1.6*dt;
    this.mesh.position.y = 1.2+Math.sin(elapsed*2+this.bobOffset)*0.26;
  }
}

// ============================================================
// LETTER TOKEN (Word Hunt)
// ============================================================

class LetterToken {
  constructor(letter,lane,z) {
    this.letter=letter; this.lane=lane; this.z=z; this.alive=true;
    const g=new THREE.Group();
    const box=makeBox(0.72,0.72,0.14, 0xFFD700, 0.25, 0xFF8F00, 0.5); g.add(box);
    const star=makeSph(0.17,6, 0xffffff, 0xffffff, 0.5); star.position.y=0.46; g.add(star);
    this.mesh=g;
    this.mesh.position.set(LANES[lane],1.0,z);
    this.bobOffset=Math.random()*Math.PI*2;
  }
  update(dt,elapsed) {
    this.mesh.rotation.y += 2*dt;
    this.mesh.position.y = 1.0+Math.sin(elapsed*3+this.bobOffset)*0.2;
  }
}

// ============================================================
// DUST PARTICLE SYSTEM (roll landing)
// ============================================================

class DustSystem {
  constructor(scene) {
    this.scene=scene;
    this.particles=[];
    // Pool of 20 particle meshes
    const geo=new THREE.SphereGeometry(0.08,4,4);
    const mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.6});
    for (let i=0;i<20;i++) {
      const m=new THREE.Mesh(geo,mat.clone());
      m.visible=false; scene.add(m); this.particles.push({mesh:m,active:false});
    }
  }

  burst(x, y, z, count=6) {
    if (reduceMotion) return;
    let spawned=0;
    for (const p of this.particles) {
      if (!p.active && spawned<count) {
        p.mesh.position.set(x+randFloat(-0.4,0.4), y+0.1, z+randFloat(-0.3,0.3));
        p.vx=randFloat(-2,2); p.vy=randFloat(1,3); p.vz=randFloat(-1,1);
        p.life=0.3; p.mesh.visible=true; p.active=true; spawned++;
      }
    }
  }

  update(dt) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.mesh.position.x += p.vx*dt;
      p.mesh.position.y += p.vy*dt;
      p.mesh.position.z += p.vz*dt;
      p.vy -= 8*dt;
      p.life -= dt;
      const fade = clamp(p.life/0.3,0,1);
      p.mesh.material.opacity = fade*0.6;
      p.mesh.scale.setScalar(fade*0.8+0.2);
      if (p.life<=0) { p.mesh.visible=false; p.active=false; }
    }
  }
}

// ============================================================
// MISSION SYSTEM
// ============================================================

class MissionSystem {
  constructor(saveData, onComplete) {
    this.multiplierLevel = saveData.multiplierLevel;
    this.progress  = [...saveData.missionProgress];
    this.onComplete = onComplete;
    this.completedThisRun = 0;
    this.currentSet = (saveData.missionSet && saveData.missionSet.length) ? saveData.missionSet : this._generateSet();
    this.runStats   = { coins:0, distance:0, powerups:0, rolls:0, jumps:0, board:0, survive:0 };
  }

  _generateSet() {
    const pool=[...MISSION_POOL]; const set=[];
    for (let i=0;i<3;i++) { const idx=randInt(0,pool.length-1); set.push({...pool[idx]}); pool.splice(idx,1); }
    return set;
  }

  track(type,amount=1) { if (this.runStats[type]!==undefined) this.runStats[type]+=amount; }

  checkProgress() {
    let anyNew=false;
    this.currentSet.forEach((m,i) => {
      if (this.progress[i]>=m.target) return;
      this.progress[i]=Math.min(m.target, this.runStats[m.type]||0);
      if (this.progress[i]>=m.target) anyNew=true;
    });
    if (this.progress.every((p,i)=>p>=this.currentSet[i].target)) {
      this.multiplierLevel=Math.min(30,this.multiplierLevel+1);
      this.completedThisRun++;
      this.currentSet=this._generateSet(); this.progress=[0,0,0];
      if (this.onComplete) this.onComplete(this.multiplierLevel);
      return 'set_complete';
    }
    return anyNew?'progress':null;
  }

  getActiveMission() {
    for (let i=0;i<3;i++) { if (this.progress[i]<this.currentSet[i].target) return { m:this.currentSet[i], p:this.progress[i], i }; }
    return { m:this.currentSet[0], p:this.progress[0], i:0 };
  }

  getSaveData() { return { missionSet:this.currentSet, missionProgress:this.progress, multiplierLevel:this.multiplierLevel }; }
  getText(m)    { return m.text.replace('{n}',m.target); }
}

// ============================================================
// PLAYER
// ============================================================

class Player {
  constructor(charData, scene) {
    this.charData=charData; this.scene=scene;
    this.lane=1; this.targetLane=1; this.laneT=1;
    this.x=LANES[1];       // actual X for lean calc
    this.y=0; this.vy=0;
    this.isJumping=false; this.isRolling=false; this.rollTimer=0; this.ROLL_DUR=0.7;
    this.dead=false; this.invincible=false; this.invincibleTimer=0;
    this.boardActive=false; this.boardTimer=0; this.BOARD_DUR=30;
    this.activePowerup=null; this.powerupTimer=0; this.puMaxDuration=0;
    this.JUMP_VEL=12; this.GRAVITY=-28;
    this.jetpackY=0;
    this.legAnim=0;
    this.leanAngle=0;       // lean on lane switch
    this.stretchY=1.0;      // squash-stretch
    this.shadowMesh=null;
    this.wasRolling=false;  // for dust on land

    this.mesh = buildCharacterMesh(charData);
    this.mesh.position.set(LANES[1],0,0);
    scene.add(this.mesh);

    // Shadow disc
    const sGeo = new THREE.CircleGeometry(0.55,12);
    const sMat = new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.35});
    this.shadowMesh = new THREE.Mesh(sGeo,sMat);
    this.shadowMesh.rotation.x=-Math.PI/2;
    this.shadowMesh.position.set(LANES[1],0.02,0);
    scene.add(this.shadowMesh);
  }

  switchLane(dir) {
    if (this.dead) return;
    const nl=clamp(this.targetLane+dir,0,2);
    if (nl!==this.targetLane) {
      this.targetLane=nl; this.laneT=0;
      // Lean in direction of switch
      this.leanAngle = dir*0.22;
    }
  }

  jump() {
    if (this.dead||this.activePowerup?.id==='jetpack') return;
    if (this.isRolling) { this.isRolling=false; this.rollTimer=0; }
    if (!this.isJumping) {
      const extra = this.activePowerup?.id==='sneakers' ? 1.55 : 1.0;
      this.vy=this.JUMP_VEL*extra; this.isJumping=true;
    } else if (this.charData.id==='tricky') {
      this.vy=this.JUMP_VEL*0.7;
    }
  }

  roll() {
    if (this.dead||this.activePowerup?.id==='jetpack') return;
    if (this.isJumping) this.vy=Math.min(this.vy,-9);
    this.isRolling=true; this.rollTimer=this.ROLL_DUR;
  }

  activatePowerup(typeData) {
    this.activePowerup=typeData; this.powerupTimer=typeData.duration; this.puMaxDuration=typeData.duration;
    if (typeData.id==='jetpack') this.jetpackY=0;

    // HUD update
    document.getElementById('pu-emoji').textContent = typeData.icon;
    document.getElementById('pu-icon').className = `pu-icon ${typeData.css}`;
    document.getElementById('pu-timer').textContent = `${typeData.duration}s`;
    document.getElementById('pu-ring').style.stroke = typeData.ringColor;
    document.getElementById('pu-slot').classList.add('show');

    // Glow on character
    const glow = this.mesh.getObjectByName('glow');
    if (glow) {
      glow.material.color.set(typeData.color);
      glow.material.opacity = 0.12;
    }

    // Screen edge flash in power-up color
    flashScreen(typeData.ringColor, 0.18, 120);
  }

  activateBoard() {
    this.boardActive=true; this.boardTimer=this.BOARD_DUR;
    document.getElementById('board-btn').classList.add('active-board');
    // Show board label
    const bl=document.getElementById('board-label');
    bl.classList.remove('show');
    setTimeout(()=>bl.classList.add('show'),10);
  }

  update(dt) {
    if (this.dead) return;

    // Lane lerp + lean
    const laneSpeed = this.charData.id==='tricky' ? 10 : 7;
    if (this.targetLane!==this.lane) {
      this.laneT=Math.min(1,this.laneT+dt*laneSpeed);
      this.mesh.position.x = lerp(LANES[this.lane], LANES[this.targetLane], easeOut(this.laneT));
      if (this.laneT>=1) { this.lane=this.targetLane; this.laneT=1; }
    } else {
      this.mesh.position.x = lerp(this.mesh.position.x, LANES[this.targetLane], dt*14);
    }
    this.x = this.mesh.position.x;

    // Lean returns to zero
    this.leanAngle = lerp(this.leanAngle, 0, dt*8);
    this.mesh.rotation.z = this.leanAngle;

    // Vertical physics
    if (this.activePowerup?.id==='jetpack') {
      this.jetpackY=lerp(this.jetpackY,8,dt*3);
      this.y=this.jetpackY; this.vy=0; this.isJumping=false;
    } else {
      this.jetpackY=lerp(this.jetpackY,0,dt*4);
      if (this.isJumping) {
        this.vy+=this.GRAVITY*dt; this.y+=this.vy*dt;
        // Squash-stretch: stretch at peak of jump
        const peakFactor = clamp(1-(this.vy/(this.JUMP_VEL*1.2)),0,1);
        this.stretchY = lerp(this.stretchY, 0.92+peakFactor*0.28, dt*10);
        if (this.y<=0) {
          this.y=0; this.vy=0; this.isJumping=false;
          this.stretchY=1.15; // squash on land
        }
      } else {
        this.y=0;
        this.stretchY=lerp(this.stretchY,1.0,dt*12);
      }
    }

    // Roll
    if (this.isRolling) {
      this.rollTimer-=dt;
      if (this.rollTimer<=0) { this.isRolling=false; this.rollTimer=0; }
    }

    // Mesh Y and scale
    const tY = this.y+(this.isRolling ? -0.4 : 0);
    this.mesh.position.y = lerp(this.mesh.position.y, tY, dt*20);

    const rollScaleY = this.isRolling ? 0.48 : this.stretchY;
    const rollScaleX = this.isRolling ? 1.38 : 1.0;
    this.mesh.scale.y = lerp(this.mesh.scale.y, rollScaleY, dt*16);
    this.mesh.scale.x = lerp(this.mesh.scale.x, rollScaleX, dt*12);

    // Leg + arm bob
    this.legAnim += dt*8;
    const legs=[this.mesh.children[7],this.mesh.children[8]]; // legs are at indices 7,8 (after eyes+shines)
    if (legs[0]&&!this.isRolling) {
      legs[0].position.z = Math.sin(this.legAnim)*0.26;
      legs[1].position.z = Math.sin(this.legAnim+Math.PI)*0.26;
    }
    const arms=[this.mesh.children[9],this.mesh.children[10]];
    if (arms[0]&&!this.isRolling) {
      arms[0].rotation.x = Math.sin(this.legAnim+Math.PI)*0.42;
      arms[1].rotation.x = Math.sin(this.legAnim)*0.42;
    }

    // Shadow — scales with height
    const shadowScale = Math.max(0.1, 1.0-this.y*0.08);
    this.shadowMesh.position.set(this.mesh.position.x, 0.02, this.mesh.position.z);
    this.shadowMesh.scale.setScalar(shadowScale);
    this.shadowMesh.material.opacity = shadowScale*0.35;

    // Board timer
    if (this.boardActive) {
      this.boardTimer-=dt;
      const bt=document.getElementById('board-timer');
      if (this.boardTimer<=0) {
        this.boardActive=false;
        document.getElementById('board-btn').classList.remove('active-board','warn');
        bt.textContent='';
      } else {
        bt.textContent=`${Math.ceil(this.boardTimer)}s`;
        // Warning glow at 5s
        if (this.boardTimer<=5) {
          document.getElementById('board-btn').classList.add('warn');
        }
      }
    }

    // Power-up timer + ring
    if (this.activePowerup) {
      this.powerupTimer-=dt;
      const frac = clamp(this.powerupTimer/this.puMaxDuration,0,1);
      const circ = 175.9;
      document.getElementById('pu-ring').style.strokeDashoffset = circ*(1-frac);
      document.getElementById('pu-timer').textContent=`${Math.ceil(this.powerupTimer)}s`;
      if (this.powerupTimer<=0) {
        if (this.activePowerup.id==='jetpack') this.jetpackY=0;
        this.activePowerup=null;
        document.getElementById('pu-slot').classList.remove('show');
        const glow=this.mesh.getObjectByName('glow');
        if (glow) glow.material.opacity=0;
      }
    }

    // Invincibility flash
    if (this.invincible) {
      this.invincibleTimer-=dt;
      this.mesh.visible=Math.sin(this.invincibleTimer*20)>0;
      if (this.invincibleTimer<=0) { this.invincible=false; this.mesh.visible=true; }
    }

    // Board ring glow pulse
    const ring=this.mesh.getObjectByName('boardRing');
    if (ring) {
      ring.visible=this.boardActive;
      if (this.boardActive) { ring.material.opacity = 0.7+Math.sin(Date.now()*0.006)*0.3; }
    }
  }

  getHitBox() {
    const topY = this.y+(this.isRolling?1.0:2.2);
    return { x:this.mesh.position.x, y:this.y, topY, halfW:0.7, isRolling:this.isRolling, isJumping:this.isJumping };
  }
}

// ============================================================
// TRACK MANAGER
// ============================================================

class TrackManager {
  constructor(scene, theme) {
    this.scene=scene; this.theme=theme;
    this.segments=[]; this.poolZ=0;
    this.obstacles=[]; this.coins=[]; this.powerups=[]; this.letterTokens=[];
    this.letterSpawnQueue=[]; this.nextLetterZ=-200; this.letterSpawnGap=80;
    this._initSegments();
  }

  _initSegments() {
    for (let i=0;i<TRACK_SEGS;i++) {
      const seg=new TrackSegment(this.theme);
      const z = -i*TRACK_SEG_LEN - TRACK_SEG_LEN/2;
      seg.setZ(z);
      this.scene.add(seg.group);
      this.segments.push(seg);
    }
    this.poolZ = -(TRACK_SEGS-1)*TRACK_SEG_LEN - TRACK_SEG_LEN/2;
  }

  setLetters(word, collectedSet) {
    // Only queue uncollected letters
    this.letterSpawnQueue = word.split('').filter(l=>!collectedSet.has(l));
    this.nextLetterZ=-200;
  }

  update(dt, gameSpeed, elapsed) {
    const shift=gameSpeed*dt;

    // Scroll segments
    for (const seg of this.segments) {
      seg.group.position.z+=shift;
      if (seg.group.position.z>TRACK_SEG_LEN) {
        const frontZ=this.poolZ-TRACK_SEG_LEN/2;
        seg.group.position.z=frontZ; this.poolZ=frontZ;
      }
    }

    // Scroll game objects
    const scroll = arr => arr.forEach(o => { o.mesh.position.z+=shift; o.z+=shift; });
    scroll(this.obstacles); scroll(this.coins); scroll(this.powerups); scroll(this.letterTokens);

    this.coins.forEach(c=>c.update(dt));
    this.powerups.forEach(p=>p.update(dt,elapsed));
    this.letterTokens.forEach(l=>l.update(dt,elapsed));

    // Despawn
    const despawn=(arr)=>{
      for(let i=arr.length-1;i>=0;i--) {
        if(arr[i].z>20) { this.scene.remove(arr[i].mesh); arr.splice(i,1); }
      }
    };
    despawn(this.obstacles); despawn(this.coins); despawn(this.powerups); despawn(this.letterTokens);

    this._spawnAhead(gameSpeed, elapsed);
  }

  _spawnAhead(gameSpeed) {
    const spawnZ=-110;
    const tooClose = this.obstacles.some(o=>Math.abs(o.z-spawnZ)<20)||
                     this.coins.some(c=>Math.abs(c.z-spawnZ)<12);
    if (tooClose) return;
    if (Math.min(...this.segments.map(s=>s.group.position.z)) > spawnZ+32) return;
    this._spawnChunk(spawnZ, gameSpeed);

    // Letter token
    if (this.letterSpawnQueue.length>0 && spawnZ<this.nextLetterZ) {
      const letter=this.letterSpawnQueue.shift();
      const lt=new LetterToken(letter, randInt(0,2), spawnZ-55);
      this.scene.add(lt.mesh); this.letterTokens.push(lt);
      this.nextLetterZ=spawnZ-this.letterSpawnGap;
    }
  }

  _spawnChunk(z, gameSpeed) {
    const speedRatio=clamp(gameSpeed/50,0,1);
    const density=lerp(0.5,1.0,speedRatio);

    if (Math.random()<density) {
      const type=this._pickType();
      const blocked=this._pickLanes(type);
      blocked.forEach(lane=>{
        const obs=new Obstacle(type,lane,z,this.theme);
        this.scene.add(obs.mesh); this.obstacles.push(obs);
      });
      [0,1,2].filter(l=>!blocked.includes(l)).forEach(lane=>this._coinLine(lane,z-5,6,2));
    } else {
      this._coinPattern(z);
    }

    if (Math.random()<0.13) {
      const pu=new PowerUp(POWERUP_TYPES[randInt(0,POWERUP_TYPES.length-1)], randInt(0,2), z-32);
      this.scene.add(pu.mesh); this.powerups.push(pu);
    }
    if (Math.random()<0.09) {
      const gc=new Coin(randInt(0,2), z-16, 0.5, true);
      this.scene.add(gc.mesh); this.coins.push(gc);
    }
  }

  _pickType() {
    const r=Math.random();
    if (r<0.35) return 'train';
    if (r<0.62) return 'barrier';
    return 'highBarrier';
  }

  _pickLanes(type) {
    if (type==='train'&&Math.random()<0.38) {
      const a=randInt(0,2); let b=randInt(0,2); while(b===a) b=randInt(0,2);
      return [a,b];
    }
    return [randInt(0,2)];
  }

  _coinLine(lane,z,count,spacing) {
    for (let i=0;i<count;i++) {
      const h=i===Math.floor(count/2)?1.5:0;
      const c=new Coin(lane,z-i*spacing,h);
      this.scene.add(c.mesh); this.coins.push(c);
    }
  }

  _coinPattern(z) {
    const p=randInt(0,3);
    if (p===0) {
      for(let i=0;i<9;i++) { const c=new Coin(i%3,z-i*3); this.scene.add(c.mesh); this.coins.push(c); }
    } else if (p===1) {
      [0,1,2,1,0].forEach((lane,i)=>{ const h=i<2?i*0.8:(4-i)*0.8; const c=new Coin(lane,z-i*4,h); this.scene.add(c.mesh); this.coins.push(c); });
    } else {
      for(let lane=0;lane<3;lane++) for(let j=0;j<4;j++) { const c=new Coin(lane,z-j*3); this.scene.add(c.mesh); this.coins.push(c); }
    }
  }

  magnetCollect(playerX, range=18) {
    let total=0;
    this.coins=this.coins.filter(c=>{
      if(!c.alive) return false;
      if(Math.abs(c.z)<range&&Math.abs(c.mesh.position.x-playerX)<range*1.5) {
        c.alive=false; this.scene.remove(c.mesh); total+=c.value; return false;
      }
      return true;
    });
    return total;
  }
}

// ============================================================
// INSPECTOR
// ============================================================

class Inspector {
  constructor(scene) {
    this.mesh=this._build(); this.mesh.position.set(0,0,16); scene.add(this.mesh); this.z=16;
  }

  _build() {
    const g=new THREE.Group();
    const body=makeBox(1.0,1.4,0.65,0x4CAF50); body.position.y=1.0; g.add(body);
    const head=makeSph(0.45,8,0xFFD5A8); head.position.y=2.06; g.add(head);
    const hat=makeBox(1.0,0.35,1.0,0x2E7D32); hat.position.y=2.62; g.add(hat);
    const brim=makeBox(1.32,0.1,1.32,0x1B5E20); brim.position.y=2.38; g.add(brim);
    const legL=makeBox(0.35,0.85,0.35,0x33691E); legL.position.set(-0.22,0.2,0); g.add(legL);
    const legR=makeBox(0.35,0.85,0.35,0x33691E); legR.position.set( 0.22,0.2,0); g.add(legR);
    return g;
  }

  update(dt, gameSpeed) {
    const targetZ=lerp(16,26,clamp(gameSpeed/50,0,1));
    this.z=lerp(this.z,targetZ,dt*0.45); this.mesh.position.z=this.z;
    const t=Date.now()*0.008;
    if (this.mesh.children[4]) this.mesh.children[4].position.z=Math.sin(t)*0.3;
    if (this.mesh.children[5]) this.mesh.children[5].position.z=Math.sin(t+Math.PI)*0.3;
    const el=document.getElementById('inspector-dist');
    if (el) {
      if (gameSpeed>35) { el.textContent='👮 Inspector falling behind!'; el.style.color='rgba(34,197,94,0.55)'; }
      else              { el.textContent=`👮 Inspector closing in!`;     el.style.color='rgba(255,51,51,0.55)'; }
    }
  }
}

// ============================================================
// WORD HUNT
// ============================================================

class WordHunt {
  constructor(saveData) {
    const today=new Date().toDateString();
    const idx=new Date().getDay();
    this.word=DAILY_WORDS[idx%DAILY_WORDS.length];
    this.collected = (saveData.wordHuntDate===today) ? new Set(saveData.wordHuntLetters) : new Set();
    this.date=today;
    this.complete=(this.collected.size>=this.word.length);
    this._render();
  }

  collectLetter(l) {
    if (this.complete||this.collected.has(l)) return false;
    this.collected.add(l); this._render();
    if (this.collected.size>=this.word.length) { this.complete=true; return 'complete'; }
    return true;
  }

  _render() {
    const c=document.getElementById('hud-word'); if(!c) return;
    c.innerHTML='';
    this.word.split('').forEach(l=>{
      const b=document.createElement('div');
      b.className='letter-slot'+(this.collected.has(l)?' found':'');
      b.textContent=this.collected.has(l)?l:'_';
      c.appendChild(b);
    });
  }

  getSaveData() { return { wordHuntDate:this.date, wordHuntLetters:[...this.collected] }; }
}

// ============================================================
// MAIN GAME CLASS
// ============================================================

class Game {
  constructor() {
    this.canvas   = document.getElementById('game-canvas');
    this.saveData = loadSave();
    reduceMotion  = this.saveData.reduceMotion;
    this.state    = 'menu';
    this.score=0; this.distance=0; this.coinsThisRun=0; this.elapsed=0;
    this.gameSpeed=SPEED_TIERS[0].speed; this.speedTierIdx=0;
    this.lastMilestone=0;

    this._initThree();
    this._initLighting();
    this._initUI();
    this._buildMenu();
    this.clock=new THREE.Clock();
    this._loop();
  }

  // ─── THREE ──────────────────────────────────────

  _initThree() {
    this.scene=new THREE.Scene();
    this.currentTheme=THEMES.find(t=>t.id===this.saveData.selectedTheme)||THEMES[0];
    this.scene.background=new THREE.Color(this.currentTheme.skyBot);
    this.scene.fog=new THREE.Fog(this.currentTheme.fogColor,this.currentTheme.fogNear,this.currentTheme.fogFar);
    this.camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,500);
    this.camera.position.set(0,10,14);
    this.camera.lookAt(0,0,-20);
    this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true});
    this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    window.addEventListener('resize',()=>{
      this.camera.aspect=innerWidth/innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth,innerHeight);
    });
    this.camShakeOffset={x:0,y:0};
  }

  _initLighting() {
    const th=this.currentTheme;
    this.ambientLight=new THREE.AmbientLight(th.ambientColor,0.9); this.scene.add(this.ambientLight);
    this.dirLight=new THREE.DirectionalLight(th.dirColor,1.6);
    this.dirLight.position.set(5,20,10); this.dirLight.castShadow=true;
    this.dirLight.shadow.mapSize.width=1024; this.dirLight.shadow.mapSize.height=1024;
    this.dirLight.shadow.camera.near=0.5; this.dirLight.shadow.camera.far=200;
    this.dirLight.shadow.camera.left=-30; this.dirLight.shadow.camera.right=30;
    this.dirLight.shadow.camera.top=30;   this.dirLight.shadow.camera.bottom=-30;
    this.scene.add(this.dirLight);
    // Second fill light
    this.fillLight=new THREE.PointLight(th.dirColor||0x4466ff,0.5,80);
    this.fillLight.position.set(-8,6,-10); this.scene.add(this.fillLight);
  }

  _applyTheme(id) {
    const th=THEMES.find(t=>t.id===id)||THEMES[0];
    this.currentTheme=th;
    this.saveData.selectedTheme=id; saveSave(this.saveData);
    this.scene.background=new THREE.Color(th.skyBot);
    this.scene.fog=new THREE.Fog(th.fogColor,th.fogNear,th.fogFar);
    this.ambientLight.color.set(th.ambientColor);
    this.dirLight.color.set(th.dirColor);
    this.fillLight.color.set(th.dirColor||0x4466ff);
    // Update ambient orbs
    const orbs=document.querySelectorAll('#ambient-layer .orb, .menu-orbs .mo');
    const oc=th.orbColors||['rgba(255,0,110,0.15)','rgba(0,245,255,0.12)','rgba(57,255,20,0.10)'];
    orbs.forEach((o,i)=>{ o.style.background=oc[i%oc.length]; });
  }

  // ─── UI ─────────────────────────────────────────

  _initUI() {
    document.getElementById('play-btn').addEventListener('click',()=>this._startGame());
    document.getElementById('retry-btn').addEventListener('click',()=>this._startGame());
    document.getElementById('menu-btn-go').addEventListener('click',()=>this._showMenu());
    document.getElementById('menu-btn-pause').addEventListener('click',()=>this._showMenu());
    document.getElementById('pause-btn').addEventListener('click',()=>this._pauseGame());
    document.getElementById('resume-btn').addEventListener('click',()=>this._resumeGame());
    document.getElementById('board-btn').addEventListener('click',()=>this._activateBoard());

    // Mission pill expand/collapse
    const pill=document.getElementById('mission-pill');
    const exp =document.getElementById('hud-missions');
    pill.addEventListener('click',()=>{
      exp.classList.toggle('open');
      pill.style.display=exp.classList.contains('open')?'none':'block';
    });
    exp.addEventListener('click',()=>{
      exp.classList.remove('open'); pill.style.display='block';
    });

    // Keyboard
    this.keys={};
    window.addEventListener('keydown',e=>{ if(this.keys[e.code]) return; this.keys[e.code]=true; this._handleKey(e.code); });
    window.addEventListener('keyup',  e=>{ this.keys[e.code]=false; });

    // Touch swipe
    let tx=0,ty=0;
    window.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
    window.addEventListener('touchend',e=>{
      const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
      if(this.state!=='playing'||!this.player) return;
      if(Math.abs(dx)>Math.abs(dy)) { if(dx>28) this.player.switchLane(1); else if(dx<-28) this.player.switchLane(-1); }
      else { if(dy<-28) this.player.jump(); else if(dy>28) this.player.roll(); }
    },{passive:true});

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.tab-btn').forEach(b=>{b.classList.remove('active'); b.setAttribute('aria-selected','false');});
        document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
        btn.classList.add('active'); btn.setAttribute('aria-selected','true');
        document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
      });
    });

    // Reduce motion toggle
    document.getElementById('reduce-motion-btn').addEventListener('click',()=>{
      reduceMotion=!reduceMotion;
      this.saveData.reduceMotion=reduceMotion; saveSave(this.saveData);
      const btn=document.getElementById('reduce-motion-btn');
      btn.style.color=reduceMotion?'rgba(0,245,255,0.7)':'rgba(255,255,255,0.25)';
      btn.setAttribute('aria-pressed',reduceMotion);
    });
    if (reduceMotion) {
      const btn=document.getElementById('reduce-motion-btn');
      btn.style.color='rgba(0,245,255,0.7)'; btn.setAttribute('aria-pressed','true');
    }

    // Visibility change (auto-pause)
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden&&this.state==='playing') this._pauseGame();
    });
  }

  _handleKey(code) {
    if (this.state==='paused'&&code==='Escape') { this._resumeGame(); return; }
    if (this.state!=='playing'||!this.player) return;
    if (code==='ArrowLeft' ||code==='KeyA') this.player.switchLane(-1);
    if (code==='ArrowRight'||code==='KeyD') this.player.switchLane(1);
    if (code==='ArrowUp'   ||code==='KeyW') this.player.jump();
    if (code==='ArrowDown' ||code==='KeyS') this.player.roll();
    if (code==='Space')                      this._activateBoard();
    if (code==='Escape')                     this._pauseGame();
  }

  _activateBoard() {
    if (this.state!=='playing'||!this.player) return;
    if (this.player.boardActive) { // deactivate
      this.player.boardActive=false;
      document.getElementById('board-btn').classList.remove('active-board','warn');
      document.getElementById('board-timer').textContent='';
      return;
    }
    if (this.saveData.hoverboards>0) { this.player.activateBoard(); }
  }

  // ─── MENU ───────────────────────────────────────

  _buildMenu() {
    document.getElementById('menu-best').textContent  = this.saveData.highScore.toLocaleString();
    document.getElementById('menu-coins').textContent = this.saveData.totalCoins.toLocaleString();
    document.getElementById('menu-mult').textContent  = '×'+this.saveData.multiplierLevel;

    // Characters
    const grid=document.getElementById('char-grid'); grid.innerHTML='';
    CHARACTERS.forEach(ch=>{
      const unlocked=ch.unlocked||(this.saveData.selectedChar===ch.id);
      const sel=(this.saveData.selectedChar===ch.id);
      const card=document.createElement('div');
      card.className='char-card glass'+(sel?' selected':'');
      card.innerHTML=`
        <div class="char-avatar" style="background:radial-gradient(circle at 35% 32%,#fff2,${this._hex(ch.color)})">${ch.emoji}</div>
        <div class="char-name">${ch.name}</div>
        <div class="char-ability">${ch.ability}</div>
        <div class="char-status ${unlocked?'':'locked'}">${sel?'✓ SELECTED':unlocked?'✓ Ready':'🔒 '+ch.tokenCost+' tokens'}</div>`;
      if (unlocked) card.addEventListener('click',()=>{
        this.saveData.selectedChar=ch.id; saveSave(this.saveData); this._buildMenu();
      });
      grid.appendChild(card);
    });

    // Themes
    const tgrid=document.getElementById('theme-grid'); tgrid.innerHTML='';
    THEMES.forEach(th=>{
      const sel=(this.saveData.selectedTheme===th.id);
      const card=document.createElement('div');
      card.className='theme-card glass'+(sel?' selected':'');
      card.innerHTML=`<div class="theme-swatch" style="background:linear-gradient(135deg,${this._hex(th.ambientColor)},${this._hex(th.skyBot)})"></div><div class="theme-name">${th.name}</div>`;
      card.addEventListener('click',()=>{ this._applyTheme(th.id); this._buildMenu(); });
      tgrid.appendChild(card);
    });

    this._buildMenuMissions();
    this._applyTheme(this.saveData.selectedTheme);
  }

  _buildMenuMissions() {
    const c=document.getElementById('menu-missions'); if(!c) return;
    const sd=this.saveData;
    const ms=sd.missionSet||[]; const mp=sd.missionProgress||[0,0,0];
    c.innerHTML=`<div class="mm-header">Multiplier ×${sd.multiplierLevel} — ${3-mp.filter((p,i)=>ms[i]&&p>=ms[i].target).length} tasks left</div>`;
    if (!ms.length) { c.innerHTML+='<div style="font-size:11px;color:rgba(255,255,255,0.35);font-family:Inter,sans-serif">Start a run to generate missions!</div>'; return; }
    ms.forEach((m,i)=>{
      const p=mp[i]||0, pct=Math.min(100,(p/m.target)*100);
      const text=m.text.replace('{n}',m.target);
      c.innerHTML+=`<div class="mm-item"><div class="mm-row"><span>${p>=m.target?'✅':' ◻'} ${text}</span><span style="color:rgba(255,255,255,0.4)">${Math.min(p,m.target)}/${m.target}</span></div><div class="mp-bar-wrap"><div class="mp-bar-fill" style="width:${pct}%"></div></div></div>`;
    });
  }

  _hex(c) { return '#'+c.toString(16).padStart(6,'0'); }

  _showMenu() {
    this.state='menu';
    document.getElementById('menu-screen').style.display='flex';
    document.getElementById('gameover-screen').classList.remove('active');
    document.getElementById('pause-screen').classList.remove('active');
    document.getElementById('hud').classList.remove('active');
    // Teardown scene objects
    if (this.trackManager) {
      [...this.trackManager.obstacles,...this.trackManager.coins,...this.trackManager.powerups,...this.trackManager.letterTokens].forEach(o=>this.scene.remove(o.mesh));
      this.trackManager.segments.forEach(s=>this.scene.remove(s.group));
    }
    if (this.player)    { this.scene.remove(this.player.mesh); this.scene.remove(this.player.shadowMesh); }
    if (this.inspector) this.scene.remove(this.inspector.mesh);
    if (this.dustSystem) this.dustSystem.particles.forEach(p=>this.scene.remove(p.mesh));
    this.player=null; this.trackManager=null; this.inspector=null; this.dustSystem=null;
    this._buildMenu();
  }

  // ─── START ──────────────────────────────────────

  _startGame() {
    this.state='playing';
    document.getElementById('menu-screen').style.display='none';
    document.getElementById('gameover-screen').classList.remove('active');
    document.getElementById('pause-screen').classList.remove('active');
    document.getElementById('hud').classList.add('active');

    this.score=0; this.distance=0; this.coinsThisRun=0;
    this.elapsed=0; this.gameSpeed=SPEED_TIERS[0].speed; this.speedTierIdx=0;
    this.lastMilestone=0;
    this.deathAnimTimer=0; this.isDeathAnim=false;

    this._applyTheme(this.saveData.selectedTheme);
    this.trackManager=new TrackManager(this.scene,this.currentTheme);
    const charData=CHARACTERS.find(c=>c.id===this.saveData.selectedChar)||CHARACTERS[0];
    this.player=new Player(charData,this.scene);
    this.inspector=new Inspector(this.scene);
    this.dustSystem=new DustSystem(this.scene);

    this.missionSystem=new MissionSystem(this.saveData,(newLevel)=>{
      showMissionBanner(newLevel);
      flashScreen('#CCFF00',0.14,180);
      this._renderMissionHUD();
    });

    this.wordHunt=new WordHunt(this.saveData);
    this.trackManager.setLetters(this.wordHunt.word, this.wordHunt.collected);

    // HUD reset
    document.getElementById('pu-slot').classList.remove('show');
    document.getElementById('board-timer').textContent='';
    document.getElementById('board-btn').classList.remove('active-board','warn');
    document.getElementById('board-count').textContent=this.saveData.hoverboards;
    document.getElementById('board-btn').classList.toggle('empty',this.saveData.hoverboards<=0);
    document.getElementById('mission-banner').classList.remove('show');
    document.getElementById('hud-missions').classList.remove('open');
    document.getElementById('mission-pill').style.display='block';

    this._renderMissionHUD();
    this._updateHUD();
    this.camera.position.set(0,10,14);
    this.clock.getDelta();
  }

  // ─── PAUSE / RESUME ─────────────────────────────

  _pauseGame() {
    if (this.state!=='playing') return;
    this.state='paused';
    document.getElementById('pause-screen').classList.add('active');
    document.getElementById('pause-score-preview').textContent='Score: '+Math.floor(this.score).toLocaleString();
  }

  _resumeGame() {
    if (this.state!=='paused') return;
    this.state='playing';
    document.getElementById('pause-screen').classList.remove('active');
    this.clock.getDelta();
  }

  // ─── DEATH ──────────────────────────────────────

  _die() {
    if (!this.player||this.player.dead) return;
    this.player.dead=true; this.isDeathAnim=true; this.deathAnimTimer=1.4;
    this.state='dead';

    // Crash flash + shake
    flashScreen('#FF3333',0.8,200);
    triggerCameraShake(5,320,3);

    if (this.score>this.saveData.highScore) this.saveData.highScore=this.score;
    this.saveData.totalCoins+=this.coinsThisRun;
    const md=this.missionSystem.getSaveData();
    Object.assign(this.saveData,md);
    const wd=this.wordHunt.getSaveData();
    Object.assign(this.saveData,wd);
    saveSave(this.saveData);

    setTimeout(()=>this._showGameOver(),1450);
  }

  _showGameOver() {
    document.getElementById('gameover-screen').classList.add('active');
    document.getElementById('hud').classList.remove('active');
    document.getElementById('go-score').textContent=Math.floor(this.score).toLocaleString();
    document.getElementById('go-dist').textContent=Math.floor(this.distance)+'m';
    document.getElementById('go-coins').textContent=this.coinsThisRun;
    document.getElementById('go-mult').textContent='×'+this.missionSystem.multiplierLevel;

    const isNew=this.score>=this.saveData.highScore;
    const bestEl=document.getElementById('go-best');
    bestEl.textContent=isNew?'🏆 NEW BEST!':'Best: '+this.saveData.highScore.toLocaleString();

    // Mission rows
    const mList=document.getElementById('go-missions-list'); mList.innerHTML='';
    this.missionSystem.currentSet.forEach((m,i)=>{
      const p=Math.min(this.missionSystem.progress[i],m.target);
      const pct=Math.min(100,(p/m.target)*100);
      const done=p>=m.target;
      const color=done?'#CCFF00':'#4FC3F7';
      mList.innerHTML+=`<div class="go-m-row"><span class="go-m-text">${done?'✅':' ◻'} ${m.text.replace('{n}',m.target)}</span><div class="go-m-bar-wrap"><div class="go-m-bar" style="width:${pct}%;background:${color}"></div></div></div>`;
    });
  }

  // ─── HUD ────────────────────────────────────────

  _updateHUD() {
    document.getElementById('hud-score').textContent=String(Math.floor(this.score)).padStart(6,'0');
    document.getElementById('hud-multiplier').textContent='×'+this.missionSystem.multiplierLevel;
    const distEl=document.getElementById('hud-distance');
    distEl.textContent=Math.floor(this.distance)+'m';
    document.getElementById('hud-coins').textContent=this.coinsThisRun;
  }

  _renderMissionHUD() {
    if (!this.missionSystem) return;
    // Active pill
    const {m,p}=this.missionSystem.getActiveMission();
    const pct=Math.min(100,(p/m.target)*100);
    document.getElementById('mp-text').textContent=m.text.replace('{n}',m.target)+` (${Math.min(p,m.target)}/${m.target})`;
    document.getElementById('mp-fill').style.width=pct+'%';

    // Expanded list
    const list=document.getElementById('mission-list'); if(!list) return;
    list.innerHTML='';
    this.missionSystem.currentSet.forEach((mi,i)=>{
      const pi=this.missionSystem.progress[i];
      const pctI=Math.min(100,(pi/mi.target)*100);
      const done=(pi>=mi.target);
      const div=document.createElement('div'); div.className='me-item';
      div.innerHTML=`<div class="me-row${done?' done':''}"><span>${done?'✅':' ◻'} ${mi.text.replace('{n}',mi.target)}</span><span>${Math.min(pi,mi.target)}/${mi.target}</span></div><div class="me-bar"><div class="me-fill${done?' done':''}" style="width:${pctI}%"></div></div>`;
      list.appendChild(div);
    });
  }

  // ─── COLLISION ──────────────────────────────────

  _checkCollisions() {
    if (!this.player||this.player.dead) return;
    const pb=this.player.getHitBox();

    // Obstacles
    for (const obs of this.trackManager.obstacles) {
      if (!obs.alive) continue;
      const oz=obs.mesh.position.z;
      if (oz<-3||oz>4.5) continue;
      const dx=Math.abs(pb.x-obs.mesh.position.x);
      if (dx>obs.halfW+0.45) continue;

      let pass=false;
      if (obs.type==='highBarrier') { pass=pb.isRolling; }
      else if (obs.type==='barrier') { pass=(pb.y>1.2||pb.isRolling); }
      else if (obs.type==='train')   { pass=(pb.y>3.5); }

      if (!pass) {
        obs.alive=false; this.scene.remove(obs.mesh); this._handleHit(); return;
      }
    }

    // Coins
    if (this.player.activePowerup?.id==='magnet') {
      const extra=this.player.charData.id==='fresh'?24:18;
      const v=this.trackManager.magnetCollect(pb.x,extra);
      if (v>0) { this.coinsThisRun+=v; this.missionSystem.track('coins',v); }
    } else {
      for (let i=this.trackManager.coins.length-1;i>=0;i--) {
        const c=this.trackManager.coins[i]; if(!c.alive) continue;
        const cz=c.mesh.position.z;
        if (cz<-2||cz>3.5) continue;
        const cx=c.mesh.position.x, cy=c.mesh.position.y;
        if (Math.abs(pb.x-cx)<1.18&&Math.abs(cy-pb.y-1.0)<2.1&&Math.abs(cz)<2.2) {
          c.alive=false; this.scene.remove(c.mesh); this.trackManager.coins.splice(i,1);
          this.coinsThisRun+=c.value; this.missionSystem.track('coins',c.value);
          // Float +1 label
          spawnCoinFloat(c.value, innerWidth/2+pb.x*30, 120);
          if (c.isGolden) showToast('⭐ Golden Coin! +5','#FFD700');
        }
      }
    }

    // Power-ups
    for (let i=this.trackManager.powerups.length-1;i>=0;i--) {
      const pu=this.trackManager.powerups[i]; if(!pu.alive) continue;
      const pz=pu.mesh.position.z;
      if (pz<-3||pz>4.5) continue;
      const px=pu.mesh.position.x;
      if (Math.abs(pb.x-px)<1.42&&Math.abs(pz)<2.6) {
        pu.alive=false; this.scene.remove(pu.mesh); this.trackManager.powerups.splice(i,1);
        this.player.activatePowerup(pu.typeData);
        this.missionSystem.track('powerups');
        showToast(`${pu.typeData.icon} ${pu.typeData.label}!`,'#fff');
      }
    }

    // Letter tokens
    for (let i=this.trackManager.letterTokens.length-1;i>=0;i--) {
      const lt=this.trackManager.letterTokens[i]; if(!lt.alive) continue;
      const lz=lt.mesh.position.z;
      if (lz<-3||lz>4.5) continue;
      const lx=lt.mesh.position.x;
      if (Math.abs(pb.x-lx)<1.42&&Math.abs(lz)<2.6) {
        lt.alive=false; this.scene.remove(lt.mesh); this.trackManager.letterTokens.splice(i,1);
        const r=this.wordHunt.collectLetter(lt.letter);
        if (r==='complete') {
          showToast('🎉 WORD COMPLETE! +200 coins','#FFD700');
          this.coinsThisRun+=200;
          const wc=document.getElementById('word-complete'); document.getElementById('wc-word').textContent=this.wordHunt.word;
          wc.classList.add('show'); setTimeout(()=>wc.classList.remove('show'),2600);
        } else if (r) {
          showToast(`✨ "${lt.letter}" found!`,'#FFD700');
          flashScreen('#FFD700',0.1,100);
        }
      }
    }
  }

  _handleHit() {
    if (this.player.boardActive) {
      // Board absorbs crash
      this.player.boardActive=false;
      document.getElementById('board-btn').classList.remove('active-board','warn');
      document.getElementById('board-timer').textContent='';
      this.saveData.hoverboards=Math.max(0,this.saveData.hoverboards-1);
      document.getElementById('board-count').textContent=this.saveData.hoverboards;
      document.getElementById('board-btn').classList.toggle('empty',this.saveData.hoverboards<=0);
      // Board explosion effect
      if (this.dustSystem) {
        this.dustSystem.burst(this.player.mesh.position.x, 0.2, this.player.mesh.position.z, 10);
      }
      flashScreen('#00F5FF',0.32,150);
      triggerCameraShake(3,150,1);
      showToast('🛹 Board saved you!','#00F5FF');
      this.missionSystem.track('board');
      this.player.invincible=true; this.player.invincibleTimer=2.0;
      // Glow ring
      const ring=this.player.mesh.getObjectByName('boardRing');
      if (ring) { ring.visible=false; }
    } else {
      this._die();
    }
  }

  // ─── MAIN LOOP ──────────────────────────────────

  _loop() {
    requestAnimationFrame(()=>this._loop());
    const dt=Math.min(this.clock.getDelta(),0.05);
    if      (this.state==='playing') this._update(dt);
    else if (this.state==='dead')    this._updateDeath(dt);
    // Mission banner auto-dismiss
    if (missionBannerTimer>0) {
      missionBannerTimer-=dt;
      if (missionBannerTimer<=0) document.getElementById('mission-banner').classList.remove('show');
    }
    this.renderer.render(this.scene,this.camera);
  }

  _update(dt) {
    this.elapsed+=dt;

    // Speed tiers
    const thresholds=[0,20,50,90];
    for (let i=SPEED_TIERS.length-1;i>=0;i--) {
      if (this.elapsed>=thresholds[i]) {
        if (this.speedTierIdx!==i) {
          this.speedTierIdx=i;
          showToast(`⚡ ${SPEED_TIERS[i].name}!`,SPEED_TIERS[i].color);
          flashScreen(SPEED_TIERS[i].color,0.12,100);
        }
        break;
      }
    }
    const targetSpeed=SPEED_TIERS[this.speedTierIdx].speed;
    this.gameSpeed=lerp(this.gameSpeed,targetSpeed,dt*0.85);

    this.player.update(dt);
    this.trackManager.update(dt, this.gameSpeed, this.elapsed);
    this.inspector.update(dt, this.gameSpeed);
    this.dustSystem.update(dt);

    // Dust on roll end
    if (this.player.wasRolling && !this.player.isRolling) {
      this.dustSystem.burst(this.player.mesh.position.x, 0.1, this.player.mesh.position.z);
    }
    this.player.wasRolling=this.player.isRolling;

    this._checkCollisions();

    // Score / distance
    this.distance+=this.gameSpeed*dt*0.25;
    const mult=this.missionSystem.multiplierLevel*(this.player.activePowerup?.id==='x2'?2:1);
    this.score+=this.gameSpeed*dt*mult*0.5;

    // Mission tracking
    this.missionSystem.track('distance',this.gameSpeed*dt*0.25);
    this.missionSystem.track('survive',dt);
    if (this.player.isRolling) this.missionSystem.track('rolls',dt*0.38);
    if (this.player.isJumping&&this.player.y>0.5) this.missionSystem.track('jumps',dt*0.38);

    const mRes=this.missionSystem.checkProgress();
    if (mRes) this._renderMissionHUD();

    // 500m milestones
    const milestone=Math.floor(this.distance/500)*500;
    if (milestone>this.lastMilestone&&milestone>0) {
      this.lastMilestone=milestone;
      showToast(`🏃 ${milestone}m!`,'#00F5FF');
      const dEl=document.getElementById('hud-distance');
      dEl.classList.add('pulse');
      setTimeout(()=>dEl.classList.remove('pulse'),400);
    }

    this._updateCamera(dt);
    this._updateHUD();
  }

  _updateCamera(dt) {
    if (!this.player) return;
    const px=this.player.mesh.position.x;
    const py=this.player.mesh.position.y;

    // Base follow
    const tx=lerp(this.camera.position.x, px*0.28, dt*4);
    const ty=lerp(this.camera.position.y, 10+py*0.5, dt*3);
    this.camera.position.x=tx; this.camera.position.y=ty; this.camera.position.z=14;

    // Camera shake
    if (cameraShake.active&&!reduceMotion) {
      cameraShake.elapsed+=dt;
      const progress=cameraShake.elapsed/(cameraShake.timer||0.3);
      if (progress>=1) { cameraShake.active=false; this.camera.position.x=tx; }
      else {
        const wave=Math.sin(progress*Math.PI*cameraShake.oscillations*2);
        const decay=1-progress;
        this.camera.position.x+=wave*cameraShake.intensity*decay*0.01;
        this.camera.position.y+=Math.sin(progress*Math.PI*cameraShake.oscillations)*cameraShake.intensity*decay*0.006;
      }
    }

    this.camera.lookAt(px*0.1, py*0.3+1, -15);
  }

  _updateDeath(dt) {
    if (this.deathAnimTimer>0) {
      this.deathAnimTimer-=dt;
      // Dramatic zoom
      this.camera.position.y=lerp(this.camera.position.y,5,dt*2.5);
      this.camera.position.z=lerp(this.camera.position.z,9,dt*2.5);
      if (this.player) {
        this.player.mesh.rotation.z+=dt*4.5;
        this.player.mesh.position.y-=dt*9;
        this.player.mesh.position.y=Math.max(this.player.mesh.position.y,-2);
      }
      this.camera.lookAt(0,1,0);
      if (this.dustSystem) this.dustSystem.update(dt);
    }
  }
}

// ============================================================
// BOOT
// ============================================================

window.addEventListener('DOMContentLoaded',()=>{
  try {
    new Game();
  } catch(e) {
    console.error('Subway Runner failed to initialize:',e);
    document.body.innerHTML=`<div style="color:#fff;padding:40px;font-family:monospace;background:#000;min-height:100vh">
      <h2 style="color:#FF006E;font-family:monospace">⚠ Boot Failed</h2>
      <pre style="margin-top:16px;color:#00F5FF">${e.message}</pre>
      <p style="margin-top:16px;color:rgba(255,255,255,0.5)">Run: npm install &amp;&amp; npm run dev</p>
    </div>`;
  }
});

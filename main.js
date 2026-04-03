// ============================================================
// SUBWAY RUNNER — main.js
// Visual system: bright arcade, saturation hierarchy,
// functional color zoning (Subway Surfers reference)
// ============================================================

import * as THREE from 'three';

// ============================================================
// SOUND SYSTEM
// ============================================================

class SoundSystem {
  _ctx = null;
  _running = false;
  _sirenNode = null;
  _sirenGain = null;

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    }
    return this._ctx;
  }

  // 🎧 Running footsteps
  startRunning() {
    if (this._running) return;
    this._running = true;
    this._loopFootstep();
  }

  _loopFootstep() {
    if (!this._running) return;

    const ctx = this._getCtx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
    osc.connect(gain);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);

    setTimeout(() => this._loopFootstep(), 280);
  }

  stopRunning() {
    this._running = false;
  }

  // 🚨 Police siren
  startSiren() {
    if (this._sirenNode) return;

    const ctx = this._getCtx();

    this._sirenGain = ctx.createGain();
    this._sirenGain.gain.value = 0;
    this._sirenGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 600;

    osc.connect(this._sirenGain);
    osc.start();

    this._sirenNode = osc;
    this._toggleSiren();
  }

  _toggleSiren() {
    if (!this._sirenNode) return;

    const ctx = this._getCtx();
    const freq = Math.random() > 0.5 ? 600 : 800;

    this._sirenNode.frequency.setTargetAtTime(freq, ctx.currentTime, 0.15);

    setTimeout(() => this._toggleSiren(), 400);
  }

  setSirenVolume(v) {
    if (!this._sirenGain) return;
    this._sirenGain.gain.setTargetAtTime(Math.min(v, 0.3), this._getCtx().currentTime, 0.1);
  }

  stopSiren() {
    if (this._sirenNode) {
      try { this._sirenNode.stop(); } catch {}
      this._sirenNode = null;
    }
  }

  // 💥 Crash
  playCrash() {
    const ctx = this._getCtx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    gain.connect(ctx.destination);

    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(gain);
    src.start();
  }

  // 🪙 Coin
  playCoin() {
    const ctx = this._getCtx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.1);
    osc.connect(gain);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }
}

// ============================================================
// GAME DATA
// ============================================================

// Characters: each must contrast clearly against the neutral beige track
const CHARACTERS = [
  { id:'jake',   name:'Jake',   color:0xFF6B2B, secondary:0x1565C0, accent:0xFFD700,
    bodyStyle:'default', unlocked:true,  ability:'None',         emoji:'🧑' },
  { id:'tricky', name:'Tricky', color:0xE91E63, secondary:0x4A148C, accent:0x00E5FF,
    bodyStyle:'hat',     unlocked:false, ability:'Fast Switch',  emoji:'👒', tokenCost:30 },
  { id:'fresh',  name:'Fresh',  color:0x00BCD4, secondary:0x004D60, accent:0x76FF03,
    bodyStyle:'cap',     unlocked:false, ability:'+Magnet Range',emoji:'🧢', tokenCost:30 },
];

// ============================================================
// WORLD THEMES — functional color zoning per visual spec:
//
//  CENTER LANE   → low-sat warm neutral (beige/stone) — max visibility
//  OBSTACLES     → high-contrast saturated (red+white, yellow+navy)
//  ENVIRONMENT   → vibrant but slightly softened (tunnels, foliage)
//  SKY           → bright, vivid — NOT dark
//  LIGHTING      → warm, even, arcade-style — NO harsh cool shadows
// ============================================================

const THEMES = [
  {
    id:'city', name:'CITY',

    // Sky: bright daytime blue, like Subway Surfers default
    skyColor:0x4a9fd4,
    fogColor:0x87ceeb,
    fogNear:80, fogFar:180,

    // Track: warm beige/stone — low saturation, maximum player visibility
    trackColor:0xd6c9a0,    // warm sandy stone
    tieColor:0x8b6914,      // warm dark brown ties
    railColor:0xa0a0a0,     // neutral gray rails

    // Lane divider lines: subtle warm white, NOT neon
    laneLineColor:0xfff8e1,

    // Obstacles: HIGH contrast — bold yellow trains, red+white barriers
    trainColor:0xF9C74F,    // saturated warm yellow (classic subway)
    trainTrim:0x1a2744,     // dark navy trim for contrast

    // Environment: warm orange tunnel arches (Subway Surfers iconic look)
    buildingColors:[0xE07840, 0xC85E2A, 0xB04820],
    tunnelArchColor:0xD4562A,
    groundColor:0x7ab648,   // bright green grass beside track
    groundAccent:0x5a9630,  // darker green variation

    // Lighting: bright warm sunlight — the most important change
    ambientColor:0xfff0d0,
    ambientIntensity:1.4,
    dirColor:0xfff5e0,
    dirIntensity:2.2,
    fillColor:0xffd080,
    fillIntensity:0.6,

    // HUD orb colors for this theme
    orbColors:['rgba(255,165,0,0.22)','rgba(30,160,240,0.16)','rgba(100,215,60,0.12)'],
  },
  {
    id:'tokyo', name:'TOKYO',

    // Tokyo: night-time purple sky, still readable
    skyColor:0x1a1040,
    fogColor:0x2a1060,
    fogNear:55, fogFar:120,

    trackColor:0xc8bfb2,    // still neutral — player visibility preserved
    tieColor:0x5a3080,
    railColor:0xce93d8,

    laneLineColor:0xff80ff,

    trainColor:0xCC0000,    // bold red bullet train
    trainTrim:0xffffff,     // white trim — danger contrast

    buildingColors:[0x220840, 0x341268, 0x180630],
    tunnelArchColor:0x4a1090,
    groundColor:0x1a1a2e,
    groundAccent:0x240a50,

    ambientColor:0x9060cc,
    ambientIntensity:1,
    dirColor:0xff80cc,
    dirIntensity:1.8,
    fillColor:0x6030aa,
    fillIntensity:0.5,

    orbColors:['rgba(255,0,200,0.20)','rgba(0,200,255,0.16)','rgba(255,0,100,0.17)'],
  },
  {
    id:'paris', name:'PARIS',

    // Paris: golden hour warm sky
    skyColor:0xf0a030,
    fogColor:0xffb84d,
    fogNear:60, fogFar:140,

    trackColor:0xe8dcc0,    // warm cream stone
    tieColor:0x7a5020,
    railColor:0xb8a080,

    laneLineColor:0xffe0a0,

    trainColor:0x2d6a27,    // deep green Paris metro
    trainTrim:0xffd700,     // gold trim

    buildingColors:[0xc8a040, 0xd4b050, 0xb88830],
    tunnelArchColor:0xb09040,
    groundColor:0x90c870,
    groundAccent:0x70a850,

    ambientColor:0xffcc66,
    ambientIntensity:1.5,
    dirColor:0xffeebb,
    dirIntensity:2.4,
    fillColor:0xff9020,
    fillIntensity:0.7,

    orbColors:['rgba(255,160,30,0.22)','rgba(255,215,0,0.17)','rgba(255,100,20,0.15)'],
  },
];

// ============================================================
// GAME CONSTANTS
// ============================================================

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
  { id:'magnet',   label:'Magnet',   icon:'🧲', color:0x2196F3, duration:10, css:'magnet',  ringColor:'#2196F3' },
  { id:'jetpack',  label:'Jetpack',  icon:'🚀', color:0xFF6D00, duration:8,  css:'jetpack', ringColor:'#FF6D00' },
  { id:'sneakers', label:'Sneakers', icon:'👟', color:0x00C853, duration:10, css:'sneakers',ringColor:'#00C853' },
  { id:'x2',       label:'2× Score', icon:'⭐', color:0xAA00FF, duration:15, css:'x2mult',  ringColor:'#AA00FF' },
];

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
      hoverboards:     d.hoverboards ?? 3,
      missionSet:      d.missionSet      || null,
      missionProgress: d.missionProgress || [0,0,0],
      wordHuntDate:    d.wordHuntDate    || '',
      wordHuntLetters: d.wordHuntLetters || [],
      reduceMotion:    d.reduceMotion    || false,
    };
  } catch(e) {
    // localStorage unavailable or JSON parse failed - return defaults
    console.warn('Failed to load save data:', e.message);
    return { highScore:0, totalCoins:0, multiplierLevel:1, selectedChar:'jake',
             selectedTheme:'city', hoverboards:3, missionSet:null,
             missionProgress:[0,0,0], wordHuntDate:'', wordHuntLetters:[], reduceMotion:false };
  }
}
function saveSave(s) {
  try { localStorage.setItem('subwayRunner2026', JSON.stringify(s)); } catch(e) {
    // localStorage unavailable - silently fail with warning
    console.warn('Failed to save data:', e.message);
  }
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

function spawnCoinFloat(value, screenX, screenY) {
  if (reduceMotion) return;
  const el = document.createElement('div');
  el.className = 'coin-float';
  el.textContent = `+${value}`;
  el.style.left = `${screenX}px`;
  el.style.top  = `${screenY}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

function flashScreen(color, opacity=0.22, durationMs=150) {
  if (reduceMotion) return;
  const el = document.getElementById('screen-flash');
  el.style.background = color;
  el.style.opacity    = opacity;
  setTimeout(() => { el.style.opacity = 0; }, durationMs);
}

let cameraShake = { active:false, intensity:0, timer:0, oscillations:0, elapsed:0 };
function triggerCameraShake(intensity=5, durationMs=300, oscillations=3) {
  if (reduceMotion) return;
  cameraShake = { active:true, intensity, timer:durationMs/1000, oscillations, elapsed:0 };
}

let missionBannerTimer = 0;
function showMissionBanner(multLevel) {
  document.getElementById('mb-mult-val').textContent = `×${multLevel}`;
  document.getElementById('mission-banner').classList.add('show');
  missionBannerTimer = 2.2;
}

// ============================================================
// GEOMETRY HELPERS
// ============================================================

function makeMat(color, roughness=0.72, emissive=null, ei=0) {
  const o = { color, roughness, metalness:0.06 };
  if (emissive) { o.emissive=emissive; o.emissiveIntensity=ei; }
  return new THREE.MeshStandardMaterial(o);
}
function makeBox(w,h,d,color,roughness=0.72,emissive=null,ei=0) {
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), makeMat(color,roughness,emissive,ei));
}
function makeCyl(rt,rb,h,segs,color,roughness=0.72) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segs), makeMat(color,roughness));
}
function makeSph(r,segs,color,emissive=null,ei=0) {
  return new THREE.Mesh(new THREE.SphereGeometry(r,segs,segs), makeMat(color,0.55,emissive,ei));
}

// ============================================================
// CHARACTER BUILDER
// Rule of Three: 60% primary, 30% secondary, 10% accent
// All colors chosen for high contrast against beige track ground
// ============================================================

function buildCharacterMesh(charData) {
  const g  = new THREE.Group();
  const pc = charData.color;
  const sc = charData.secondary;
  const ac = charData.accent;

  // Body (60% — vivid primary, high contrast vs beige)
  const body = makeBox(0.92,1.2,0.62, pc, 0.65);
  body.position.y=1; body.castShadow=true; g.add(body);

  // Head (skin tone)
  const head = makeSph(0.42,8, 0xFFD5A8);
  head.position.y=2; head.castShadow=true; g.add(head);

  // Eyes
  const eyeL = makeSph(0.08,6, 0x111111); eyeL.position.set(-0.14,2.08,0.38); g.add(eyeL);
  const eyeR = makeSph(0.08,6, 0x111111); eyeR.position.set( 0.14,2.08,0.38); g.add(eyeR);

  // Eye shine — 10% accent glow
  const shineL = makeSph(0.035,4, ac, ac, 1); shineL.position.set(-0.11,2.10,0.43); g.add(shineL);
  const shineR = makeSph(0.035,4, ac, ac, 1); shineR.position.set( 0.11,2.10,0.43); g.add(shineR);

  // Legs (30% — secondary color)
  const legL = makeBox(0.32,0.82,0.32, sc, 0.7); legL.position.set(-0.22,0.2,0); legL.castShadow=true; g.add(legL);
  const legR = makeBox(0.32,0.82,0.32, sc, 0.7); legR.position.set( 0.22,0.2,0); legR.castShadow=true; g.add(legR);

  // Arms (primary)
  const armL = makeBox(0.28,0.82,0.28, pc, 0.65); armL.position.set(-0.66,1,0); armL.castShadow=true; g.add(armL);
  const armR = makeBox(0.28,0.82,0.28, pc, 0.65); armR.position.set( 0.66,1,0); armR.castShadow=true; g.add(armR);

  // Hat / cap accessory
  if (charData.bodyStyle==='hat') {
    const hat  = makeCyl(0.35,0.42,0.5,8, 0x880E4F); hat.position.set(0,2.56,0); g.add(hat);
    const brim = makeBox(0.92,0.08,0.92, 0x6a0d40); brim.position.set(0,2.33,0); g.add(brim);
  } else if (charData.bodyStyle==='cap') {
    const cap  = makeBox(0.92,0.18,0.96, 0x006064); cap.position.set(0,2.46,0.04); g.add(cap);
    const brim = makeBox(0.55,0.1,0.28, 0x004D52); brim.position.set(0,2.35,0.52); g.add(brim);
  }

  // Backpack with spray can
  const pack  = makeBox(0.62,0.72,0.22, 0x8D6E63); pack.position.set(0,1,-0.41); g.add(pack);
  const can   = makeCyl(0.06,0.06,0.3,6, ac); can.position.set(0.16,0.72,-0.55); can.rotation.x=0.3; g.add(can);
  // Accent stripe across body (10% — the eye goes here first)
  const stripe = makeBox(0.93,0.13,0.63, ac, 0.4, ac, 0.55);
  stripe.position.set(0,1.48,0); g.add(stripe);

  // Shoes (darker secondary)
  const shoeL = makeBox(0.34,0.18,0.42, 0x212121); shoeL.position.set(-0.22,-0.22,0.05); g.add(shoeL);
  const shoeR = makeBox(0.34,0.18,0.42, 0x212121); shoeR.position.set( 0.22,-0.22,0.05); g.add(shoeR);

  // Board ring (hoverboard state — safety cyan)
  const ringGeo = new THREE.RingGeometry(0.72,0.90,24);
  const ringMat = new THREE.MeshBasicMaterial({ color:0x00E5FF, side:THREE.DoubleSide, transparent:true, opacity:0.9 });
  const ring    = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x=-Math.PI/2; ring.position.y=0.04; ring.visible=false; ring.name='boardRing';
  g.add(ring);

  // Glow shell (power-up state)
  const glowGeo = new THREE.SphereGeometry(1.05, 10, 10);
  const glowMat = new THREE.MeshBasicMaterial({ color:0x00E5FF, transparent:true, opacity:0 });
  const glow    = new THREE.Mesh(glowGeo, glowMat);
  glow.name='glow'; glow.position.y=1; g.add(glow);

  g.castShadow = true;
  return g;
}

// ============================================================
// TRACK SEGMENT
// Uses all theme properties — fully wired
// ============================================================

class TrackSegment {
  constructor(theme) {
    this.group = new THREE.Group();
    this._build(theme);
  }

  _build(theme) {
    const g  = this.group;
    const tw = LANE_WIDTH*3 + 2;

    // ── TRACK SURFACE — low-sat neutral for player visibility ──
    const track = makeBox(tw, 0.28, TRACK_SEG_LEN, theme.trackColor, 0.95);
    track.position.y=-0.14; track.receiveShadow=true; g.add(track);

    // Rail ties — use theme tieColor
    for (let i=0; i<9; i++) {
      const tie = makeBox(tw, 0.1, 0.3, theme.tieColor);
      tie.position.set(0, 0.02, -TRACK_SEG_LEN/2 + i*(TRACK_SEG_LEN/9) + 1.5);
      g.add(tie);
    }

    // Rails — use theme railColor
    [-LANE_WIDTH*1.5, -LANE_WIDTH*0.5, LANE_WIDTH*0.5, LANE_WIDTH*1.5].forEach(rx => {
      const rail = makeBox(0.1, 0.1, TRACK_SEG_LEN, theme.railColor, 0.3);
      rail.position.set(rx, 0.07, 0); g.add(rail);
    });

    // Lane divider lines — subtle, NOT neon glowing
    [-LANE_WIDTH, 0, LANE_WIDTH].forEach(lx => {
      const line = makeBox(0.05, 0.01, TRACK_SEG_LEN, theme.laneLineColor||0xfff8e1, 0.5);
      line.position.set(lx, 0.005, 0); g.add(line);
    });

    // Ground sides — bright green grass (vibrant environment, lower sat than coins)
    const gL = makeBox(10, 0.22, TRACK_SEG_LEN, theme.groundColor);
    gL.position.set(-LANE_WIDTH*1.5-5, -0.11, 0); gL.receiveShadow=true; g.add(gL);
    const gR = makeBox(10, 0.22, TRACK_SEG_LEN, theme.groundColor);
    gR.position.set( LANE_WIDTH*1.5+5, -0.11, 0); gR.receiveShadow=true; g.add(gR);

    // Tunnel arches / side walls — the iconic Subway Surfers orange arches
    this._addTunnelArches(theme);

    // Background buildings / environment
    this._addBuildings(theme);
  }

  _addTunnelArches(theme) {
    const g = this.group;
    const archColor = theme.tunnelArchColor;
    const spacing = 10;
    const count = Math.ceil(TRACK_SEG_LEN / spacing);

    for (let i=0; i<count; i++) {
      const z = -TRACK_SEG_LEN/2 + i*spacing + 5;

      // Left vertical pillar
      const pillarL = makeBox(1.2, 5.5, 0.8, archColor, 0.85);
      pillarL.position.set(-LANE_WIDTH*1.5-1.8, 2.75, z);
      pillarL.castShadow=true; g.add(pillarL);

      // Right vertical pillar
      const pillarR = makeBox(1.2, 5.5, 0.8, archColor, 0.85);
      pillarR.position.set( LANE_WIDTH*1.5+1.8, 2.75, z);
      pillarR.castShadow=true; g.add(pillarR);

      // Overhead beam connecting arches
      const beam = makeBox(LANE_WIDTH*3+5.6, 0.8, 0.8, archColor, 0.85);
      beam.position.set(0, 5.8, z);
      g.add(beam);

      // Overhead wires (thin dark lines — depth detail)
      [-LANE_WIDTH, 0, LANE_WIDTH].forEach(wx => {
        const wire = makeBox(0.06, 0.06, spacing+1, 0x333333);
        wire.position.set(wx, 5.2, z - spacing/2);
        g.add(wire);
      });
    }
  }

  _addBuildings(theme) {
    for (let side=-1; side<=1; side+=2) {
      const count = randInt(2,3);
      for (let i=0; i<count; i++) {
        this._addBuilding(theme, side);
      }
    }
  }

  _addBuilding(theme, side) {
    const g      = this.group;
    const colors = theme.buildingColors;
    const accent = theme.groundAccent;
    const w = randFloat(4,9);
    const h = randFloat(10,24);
    const d = randFloat(4,7);
    const col  = colors[randInt(0, colors.length-1)];
    const xPos = side*(LANE_WIDTH*1.5 + 7 + randFloat(1,4));
    const zPos = randFloat(-TRACK_SEG_LEN/2, TRACK_SEG_LEN/2);

    const bld = makeBox(w,h,d, col, 0.92);
    bld.position.set(xPos, h/2, zPos);
    bld.castShadow=true; bld.receiveShadow=true; g.add(bld);

    this._addWindows(g, w, h, d, xPos, zPos, side);

    if (Math.random()>0.65) {
      const detail = makeCyl(0.5,0.6,1.2,8, accent||0x4a7a30);
      detail.position.set(xPos + randFloat(-w*0.2,w*0.2), h+0.6, zPos);
      g.add(detail);
    }
  }

  _addWindows(g, w, h, d, xPos, zPos, side) {
    if (h <= 10) { return; }
    for (let wy=3; wy<h-2; wy+=3.2) {
      if (Math.random()>0.35) {
        const win = makeBox(w*0.15, 0.72, 0.05, 0xFFF5C0, 0.1, 0xFFF0A0, 0.7);
        win.position.set(xPos + side*0.01, wy, zPos + d/2 + 0.02);
        g.add(win);
      }
    }
  }

  setZ(z) { this.group.position.z = z; }
}

// ============================================================
// OBSTACLE
// Danger colors: red+white barriers, themed bold trains
// ============================================================

class Obstacle {
  constructor(type, lane, z, theme) {
    this.type  = type;
    this.lane  = lane;
    this.z     = z;
    this.alive = true;
    this.halfW = type==='train' ? 1.6 : 0.95;
    this.mesh  = this._build(type, theme);
    this.mesh.position.set(LANES[lane], 0, z);
  }

  _build(type, theme) {
    const g = new THREE.Group();

    if (type==='train') {
      // Train body — theme color, high saturation
      const body = makeBox(LANE_WIDTH-0.3, 4, 18, theme.trainColor, 0.55);
      body.position.y=2; body.castShadow=true; g.add(body);

      // Trim stripe — dark navy/accent for contrast
      const trim = makeBox(LANE_WIDTH-0.3, 0.35, 18.2, theme.trainTrim||0x1a2744);
      trim.position.y=3.6; g.add(trim);
      const trim2 = makeBox(LANE_WIDTH-0.3, 0.35, 18.2, theme.trainTrim||0x1a2744);
      trim2.position.y=0.45; g.add(trim2);

      // Top cap (dark)
      const top = makeBox(LANE_WIDTH-0.5, 0.5, 17.5, 0x1a1a1a);
      top.position.y=4.25; g.add(top);

      // Windows — bright teal/blue (readable pop against train color)
      for (let wz=-6; wz<=6; wz+=3.5) {
        const win = makeBox(LANE_WIDTH-0.85, 1.2, 0.1, 0x80DEEA, 0.15, 0x80DEEA, 0.35);
        win.position.set(0, 2.4, wz); g.add(win);
      }

      // Number plate
      const plate = makeBox(0.9, 0.6, 0.08, 0xFFFFFF);
      plate.position.set(0, 1.2, -9.1); g.add(plate);

      // Wheels
      [-7.5, 7.5].forEach(wz => {
        const wh = makeCyl(0.5,0.5,LANE_WIDTH,10, 0x1a1a1a, 0.4);
        wh.rotation.z=Math.PI/2; wh.position.set(0,0.28,wz); g.add(wh);
        // Wheel hub
        const hub = makeSph(0.18,6, 0xaaaaaa);
        hub.position.set(0,0.28,wz); g.add(hub);
      });

      // Front headlights (warm yellow glow)
      const hlL = makeSph(0.2,6, 0xFFF0A0, 0xFFF0A0, 1.2);
      hlL.position.set(-0.6, 1.8, -9.1); g.add(hlL);
      const hlR = makeSph(0.2,6, 0xFFF0A0, 0xFFF0A0, 1.2);
      hlR.position.set( 0.6, 1.8, -9.1); g.add(hlR);

    } else if (type==='barrier') {
      // Low barrier — must JUMP over
      // Red+white: maximum danger contrast per spec
      const p1 = makeBox(0.22, 1.9, 0.22, 0xE53935); p1.position.set(-0.74,0.95,0); g.add(p1);
      const p2 = makeBox(0.22, 1.9, 0.22, 0xE53935); p2.position.set( 0.74,0.95,0); g.add(p2);

      // Crossbar — white for maximum visibility
      const bar = makeBox(1.7, 0.28, 0.28, 0xFFFFFF); bar.position.set(0,1.55,0); g.add(bar);

      // Red danger stripe on crossbar
      const stripe = makeBox(1.7, 0.18, 0.3, 0xE53935); stripe.position.set(0,1.25,0); g.add(stripe);

      // Warning light — bright amber (highest sat element)
      const wl = makeSph(0.16,6, 0xFFCA28, 0xFFCA28, 1.5);
      wl.position.set(0,2,0); g.add(wl);

    } else if (type==='highBarrier') {
      // High barrier — must ROLL under
      // Large red frame, clear gap at bottom
      const frame = makeBox(3, 3.8, 0.3, 0xBF360C, 0.65, 0xBF360C, 0.1);
      frame.position.y=1.9; frame.castShadow=true; g.add(frame);

      // Hollow gap for rolling through (dark cutout)
      const gap = makeBox(2.6, 1.1, 0.45, 0x111111); gap.position.y=0.55; g.add(gap);

      // White warning stripes on frame
      for (let sy=2.5; sy<3.8; sy+=0.45) {
        const s = makeBox(2.96, 0.2, 0.32, 0xFFFFFF); s.position.set(0,sy,0); g.add(s);
      }

      // Red warning light on top — HIGH saturation, draws eye
      const wl = makeSph(0.25,8, 0xFF1744, 0xFF1744, 1.8);
      wl.position.set(0,3.95,0); g.add(wl);
    }

    return g;
  }
}

// ============================================================
// COIN — highest saturation in game world, strong emissive
// ============================================================

class Coin {
  constructor(lane, z, height=0, isGolden=false) {
    this.lane=lane; this.z=z; this.alive=true;
    this.isGolden=isGolden; this.value=isGolden?5:1;

    const r   = isGolden ? 0.4 : 0.3;
    const col = isGolden ? 0xFFD700 : 0xFFC107;
    const emi = isGolden ? 0xFF8F00 : 0xF57F17;
    const eiV = isGolden ? 0.65 : 0.3;

    const geo = new THREE.CylinderGeometry(r,r,0.12,12);
    const mat = new THREE.MeshStandardMaterial({
      color:col, roughness:0.2, metalness:0.88,
      emissive:emi, emissiveIntensity:eiV
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = Math.PI/2;
    this.mesh.position.set(LANES[lane], height+0.6, z);
    this.mesh.castShadow = true;
    this.rotSpeed = randFloat(2.5,4.5);

    // Star emboss on face
    const star = makeSph(r*0.38, 5, 0xffffff, 0xffffff, 0.3);
    star.scale.z = 0.2; this.mesh.add(star);
  }

  update(dt) { this.mesh.rotation.z += this.rotSpeed*dt; }
}

// ============================================================
// POWER-UP — each distinct saturated hue, glowing sphere
// ============================================================

class PowerUp {
  constructor(typeData, lane, z) {
    this.typeData=typeData; this.lane=lane; this.z=z; this.alive=true;

    const g = new THREE.Group();

    // Outer glow sphere
    const outerMat = new THREE.MeshStandardMaterial({
      color:typeData.color, roughness:0.3, metalness:0.15,
      emissive:typeData.color, emissiveIntensity:0.65,
      transparent:true, opacity:0.58
    });
    const outer = new THREE.Mesh(new THREE.SphereGeometry(0.6,10,10), outerMat);
    g.add(outer);

    // Inner rotating cube
    const inner = makeBox(0.65,0.65,0.65, 0xffffff, 0.45, 0xffffff, 0.15);
    inner.rotation.y=Math.PI/4; g.add(inner);

    this.mesh = g;
    this.mesh.position.set(LANES[lane], 1.2, z);
    this.bobOffset = Math.random()*Math.PI*2;
  }

  update(dt, elapsed) {
    this.mesh.rotation.y += 1.6*dt;
    this.mesh.position.y = 1.2 + Math.sin(elapsed*2 + this.bobOffset)*0.28;
  }
}

// ============================================================
// LETTER TOKEN (Word Hunt) — gold, high emissive
// ============================================================

class LetterToken {
  constructor(letter, lane, z) {
    this.letter=letter; this.lane=lane; this.z=z; this.alive=true;

    const g   = new THREE.Group();
    const box = makeBox(0.75,0.75,0.16, 0xFFD700, 0.22, 0xFF8F00, 0.55);
    g.add(box);

    // Star on top
    const star = makeSph(0.18,6, 0xffffff, 0xffffff, 0.6);
    star.position.y=0.5; g.add(star);

    // Thin border rim (white)
    const rim = makeBox(0.82,0.82,0.14, 0xffffff, 0.4);
    rim.position.z=-0.01; g.add(rim);

    this.mesh = g;
    this.mesh.position.set(LANES[lane], 1.1, z);
    this.bobOffset = Math.random()*Math.PI*2;
  }

  update(dt, elapsed) {
    this.mesh.rotation.y += 2*dt;
    this.mesh.position.y = 1.1 + Math.sin(elapsed*3 + this.bobOffset)*0.22;
  }
}

// ============================================================
// DUST PARTICLES (pooled — never instantiated during gameplay)
// ============================================================

class DustSystem {
  constructor(scene) {
    this.scene=scene; this.particles=[];
    const geo = new THREE.SphereGeometry(0.08,4,4);
    const mat = new THREE.MeshBasicMaterial({ color:0xffd080, transparent:true, opacity:0.6 });
    for (let i=0;i<20;i++) {
      const m = new THREE.Mesh(geo, mat.clone());
      m.visible=false; scene.add(m);
      this.particles.push({ mesh:m, active:false });
    }
  }

  burst(x,y,z,count=6) {
    if (reduceMotion) return;
    let n=0;
    for (const p of this.particles) {
      if (!p.active && n<count) {
        p.mesh.position.set(x+randFloat(-0.4,0.4), y+0.12, z+randFloat(-0.3,0.3));
        p.vx=randFloat(-2,2); p.vy=randFloat(1,3); p.vz=randFloat(-1,1);
        p.life=0.32; p.mesh.visible=true; p.active=true; n++;
      }
    }
  }

  update(dt) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.mesh.position.x+=p.vx*dt; p.mesh.position.y+=p.vy*dt; p.mesh.position.z+=p.vz*dt;
      p.vy-=8*dt; p.life-=dt;
      const f=clamp(p.life/0.32,0,1);
      p.mesh.material.opacity=f*0.6; p.mesh.scale.setScalar(f*0.8+0.2);
      if (p.life<=0) { p.mesh.visible=false; p.active=false; }
    }
  }
}

// ============================================================
// MISSION SYSTEM
// ============================================================

class MissionSystem {
  constructor(saveData, onComplete) {
    this.multiplierLevel  = saveData.multiplierLevel;
    this.progress         = [...saveData.missionProgress];
    this.onComplete       = onComplete;
    this.completedThisRun = 0;
    this.currentSet = saveData.missionSet?.length
      ? saveData.missionSet : this._generateSet();
    this.runStats = { coins:0, distance:0, powerups:0, rolls:0, jumps:0, board:0, survive:0 };
  }

  _generateSet() {
    const pool=[...MISSION_POOL], set=[];
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
    return anyNew ? 'progress' : null;
  }

  getActiveMission() {
    for (let i=0;i<3;i++) {
      if (this.progress[i]<this.currentSet[i].target)
        return { m:this.currentSet[i], p:this.progress[i], i };
    }
    return { m:this.currentSet[0], p:this.progress[0], i:0 };
  }

  getSaveData() {
    return { missionSet:this.currentSet, missionProgress:this.progress, multiplierLevel:this.multiplierLevel };
  }
  getText(m) { return m.text.replace('{n}',m.target); }
}

// ============================================================
// PLAYER
// ============================================================

class Player {
  constructor(charData, scene) {
    this.charData=charData; this.scene=scene;
    this.lane=1; this.targetLane=1; this.laneT=1;
    this.x=LANES[1];
    this.y=0; this.vy=0;
    this.isJumping=false; this.isRolling=false; this.rollTimer=0; this.ROLL_DUR=0.7;
    this.dead=false; this.invincible=false; this.invincibleTimer=0;
    this.boardActive=false; this.boardTimer=0; this.BOARD_DUR=30;
    this.activePowerup=null; this.powerupTimer=0; this.puMaxDuration=0;
    this.JUMP_VEL=12; this.GRAVITY=-28;
    this.jetpackY=0;
    this.legAnim=0;
    this.leanAngle=0;
    this.stretchY=1;
    this.wasRolling=false;

    this.mesh = buildCharacterMesh(charData);
    this.mesh.position.set(LANES[1],0,0);
    scene.add(this.mesh);

    // Dynamic shadow disc — scales with jump height
    const sGeo = new THREE.CircleGeometry(0.6,12);
    const sMat = new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.38 });
    this.shadowMesh = new THREE.Mesh(sGeo,sMat);
    this.shadowMesh.rotation.x=-Math.PI/2;
    this.shadowMesh.position.set(LANES[1],0.03,0);
    scene.add(this.shadowMesh);
  }

  switchLane(dir) {
    if (this.dead) return;
    const nl = clamp(this.targetLane+dir, 0, 2);
    if (nl!==this.targetLane) {
      this.targetLane=nl; this.laneT=0;
      this.leanAngle = dir*0.24; // lean toward new lane
    }
  }

  jump() {
    if (this.dead || this.activePowerup?.id==='jetpack') return;
    if (this.isRolling) { this.isRolling=false; this.rollTimer=0; }
    if (!this.isJumping) {
      const extra = this.activePowerup?.id==='sneakers' ? 1.55 : 1;
      this.vy=this.JUMP_VEL*extra; this.isJumping=true;
    } else if (this.charData.id==='tricky') {
      this.vy=this.JUMP_VEL*0.7; // Tricky: double jump
    }
  }

  roll() {
    if (this.dead || this.activePowerup?.id==='jetpack') return;
    if (this.isJumping) this.vy=Math.min(this.vy,-9); // jump cancel
    this.isRolling=true; this.rollTimer=this.ROLL_DUR;
  }

  activatePowerup(typeData) {
    this.activePowerup=typeData; this.powerupTimer=typeData.duration; this.puMaxDuration=typeData.duration;
    if (typeData.id==='jetpack') this.jetpackY=0;
    // HUD
    document.getElementById('pu-emoji').textContent=typeData.icon;
    document.getElementById('pu-icon').className=`pu-icon ${typeData.css}`;
    document.getElementById('pu-timer').textContent=`${typeData.duration}s`;
    document.getElementById('pu-ring').style.stroke=typeData.ringColor;
    document.getElementById('pu-slot').classList.add('show');
    // Character glow
    const glow=this.mesh.getObjectByName('glow');
    if (glow) { glow.material.color.set(typeData.color); glow.material.opacity=0.13; }
    // Screen flash in power-up color
    flashScreen(typeData.ringColor, 0.18, 120);
  }

  activateBoard() {
    this.boardActive=true; this.boardTimer=this.BOARD_DUR;
    document.getElementById('board-btn').classList.add('active-board');
    const bl=document.getElementById('board-label');
    bl.classList.remove('show');
    setTimeout(()=>bl.classList.add('show'),10);
  }

  update(dt) {
    if (this.dead) return;
    this._updateMovement(dt);
    this._updatePhysics(dt);
    this._updateAnimation(dt);
    this._updateTimers(dt);
    this._updateVisuals();
  }

  _updateMovement(dt) {
    const laneSpeed = this.charData.id==='tricky' ? 10 : 7;
    if (this.targetLane===this.lane) {
      this.mesh.position.x=lerp(this.mesh.position.x, LANES[this.targetLane], dt*14);
    } else {
      this.laneT=Math.min(1, this.laneT+dt*laneSpeed);
      this.mesh.position.x=lerp(LANES[this.lane], LANES[this.targetLane], easeOut(this.laneT));
      if (this.laneT>=1) { this.lane=this.targetLane; this.laneT=1; }
    }
    this.x=this.mesh.position.x;
    this.leanAngle=lerp(this.leanAngle, 0, dt*9);
    this.mesh.rotation.z=this.leanAngle;
  }

  _updatePhysics(dt) {
    if (this.activePowerup?.id==='jetpack') {
      this.jetpackY=lerp(this.jetpackY, 8, dt*3);
      this.y=this.jetpackY; this.vy=0; this.isJumping=false;
    } else {
      this.jetpackY=lerp(this.jetpackY, 0, dt*4);
      if (this.isJumping) {
        this.vy+=this.GRAVITY*dt; this.y+=this.vy*dt;
        const peakFactor=clamp(1-(this.vy/(this.JUMP_VEL*1.2)),0,1);
        this.stretchY=lerp(this.stretchY, 0.9+peakFactor*0.3, dt*10);
        if (this.y<=0) {
          this.y=0; this.vy=0; this.isJumping=false;
          this.stretchY=1.18;
        }
      } else {
        this.y=0;
        this.stretchY=lerp(this.stretchY, 1, dt*12);
      }
    }
    if (this.isRolling) {
      this.rollTimer-=dt;
      if (this.rollTimer<=0) { this.isRolling=false; this.rollTimer=0; }
    }
    const tY=this.y+(this.isRolling ? -0.4 : 0);
    this.mesh.position.y=lerp(this.mesh.position.y, tY, dt*20);
    const sY=this.isRolling ? 0.48 : this.stretchY;
    const sX=this.isRolling ? 1.4 : 1;
    this.mesh.scale.y=lerp(this.mesh.scale.y, sY, dt*16);
    this.mesh.scale.x=lerp(this.mesh.scale.x, sX, dt*12);
  }

  _updateAnimation(dt) {
    this.legAnim+=dt*8;
    const legs=[this.mesh.children[7],this.mesh.children[8]];
    if (legs[0]&&!this.isRolling) {
      legs[0].position.z=Math.sin(this.legAnim)*0.26;
      legs[1].position.z=Math.sin(this.legAnim+Math.PI)*0.26;
    }
    const arms=[this.mesh.children[9],this.mesh.children[10]];
    if (arms[0]&&!this.isRolling) {
      arms[0].rotation.x=Math.sin(this.legAnim+Math.PI)*0.44;
      arms[1].rotation.x=Math.sin(this.legAnim)*0.44;
    }
    const shadowScale=Math.max(0.1, 1-this.y*0.09);
    this.shadowMesh.position.set(this.mesh.position.x, 0.03, this.mesh.position.z);
    this.shadowMesh.scale.setScalar(shadowScale);
    this.shadowMesh.material.opacity=shadowScale*0.38;
  }

  _updateTimers(dt) {
    if (this.boardActive) {
      this.boardTimer-=dt;
      const bt=document.getElementById('board-timer');
      if (this.boardTimer<=0) {
        this.boardActive=false;
        document.getElementById('board-btn').classList.remove('active-board','warn');
        bt.textContent='';
      } else {
        bt.textContent=`${Math.ceil(this.boardTimer)}s`;
        if (this.boardTimer<=5) { document.getElementById('board-btn').classList.add('warn'); }
      }
    }
    if (this.activePowerup) {
      this.powerupTimer-=dt;
      const frac=clamp(this.powerupTimer/this.puMaxDuration,0,1);
      document.getElementById('pu-ring').style.strokeDashoffset=175.9*(1-frac);
      document.getElementById('pu-timer').textContent=`${Math.ceil(this.powerupTimer)}s`;
      if (this.powerupTimer<=0) {
        if (this.activePowerup.id==='jetpack') { this.jetpackY=0; }
        this.activePowerup=null;
        document.getElementById('pu-slot').classList.remove('show');
        const glow=this.mesh.getObjectByName('glow');
        if (glow) { glow.material.opacity=0; }
      }
    }
    if (this.invincible) {
      this.invincibleTimer-=dt;
      this.mesh.visible=Math.sin(this.invincibleTimer*20)>0;
      if (this.invincibleTimer<=0) { this.invincible=false; this.mesh.visible=true; }
    }
  }

  _updateVisuals() {
    const ring=this.mesh.getObjectByName('boardRing');
    if (ring) {
      ring.visible=this.boardActive;
      if (this.boardActive) { ring.material.opacity=0.7+Math.sin(Date.now()*0.006)*0.3; }
    }
  }

  getHitBox() {
    return {
      x:this.mesh.position.x, y:this.y,
      topY:this.y+(this.isRolling?1:2.2),
      halfW:0.72, isRolling:this.isRolling, isJumping:this.isJumping
    };
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
      seg.setZ(-i*TRACK_SEG_LEN - TRACK_SEG_LEN/2);
      this.scene.add(seg.group);
      this.segments.push(seg);
    }
    this.poolZ=-(TRACK_SEGS-1)*TRACK_SEG_LEN - TRACK_SEG_LEN/2;
  }

  setLetters(word, collectedSet) {
    this.letterSpawnQueue = word.split('').filter(l=>!collectedSet.has(l));
    this.nextLetterZ=-200;
  }

  update(dt, gameSpeed, elapsed) {
    const shift=gameSpeed*dt;

    // Scroll segments (recycle at front)
    for (const seg of this.segments) {
      seg.group.position.z+=shift;
      if (seg.group.position.z>TRACK_SEG_LEN) {
        const fz=this.poolZ-TRACK_SEG_LEN/2;
        seg.group.position.z=fz; this.poolZ=fz;
      }
    }

    // Scroll all game objects
    const scroll=arr=>arr.forEach(o=>{ o.mesh.position.z+=shift; o.z+=shift; });
    scroll(this.obstacles); scroll(this.coins); scroll(this.powerups); scroll(this.letterTokens);

    this.coins.forEach(c=>c.update(dt));
    this.powerups.forEach(p=>p.update(dt,elapsed));
    this.letterTokens.forEach(l=>l.update(dt,elapsed));

    // Despawn behind camera
    const despawn=arr=>{
      for(let i=arr.length-1;i>=0;i--) {
        if(arr[i].z>22) { this.scene.remove(arr[i].mesh); arr.splice(i,1); }
      }
    };
    despawn(this.obstacles); despawn(this.coins); despawn(this.powerups); despawn(this.letterTokens);

    this._spawnAhead(gameSpeed);
  }

  _spawnAhead(gameSpeed) {
    const spawnZ=-115;
    const tooClose=this.obstacles.some(o=>Math.abs(o.z-spawnZ)<22)||
                   this.coins.some(c=>Math.abs(c.z-spawnZ)<12);
    if (tooClose) return;
    if (Math.min(...this.segments.map(s=>s.group.position.z)) > spawnZ+35) return;

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
    const density=lerp(0.5,1,speedRatio);

    if (Math.random()<density) {
      const type=this._pickType();
      const blocked=this._pickLanes(type);
      blocked.forEach(lane=>{
        const obs=new Obstacle(type, lane, z, this.theme);
        this.scene.add(obs.mesh); this.obstacles.push(obs);
      });
      // Coin path on free lanes
      [0,1,2].filter(l=>!blocked.includes(l)).forEach(lane=>this._coinLine(lane,z-5,6,2));
    } else {
      this._coinPattern(z);
    }

    // Power-up (occasional)
    if (Math.random()<0.13) {
      const pu=new PowerUp(POWERUP_TYPES[randInt(0,POWERUP_TYPES.length-1)], randInt(0,2), z-32);
      this.scene.add(pu.mesh); this.powerups.push(pu);
    }

    // Golden coin (rare bonus)
    if (Math.random()<0.09) {
      const gc=new Coin(randInt(0,2), z-16, 0.6, true);
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
    if (type==='train' && Math.random()<0.38) {
      const a=randInt(0,2); let b=randInt(0,2);
      while(b===a) b=randInt(0,2);
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
    if (p===0) { // Zigzag across lanes
      for(let i=0;i<9;i++) { const c=new Coin(i%3,z-i*3); this.scene.add(c.mesh); this.coins.push(c); }
    } else if (p===1) { // Arc (height rises and falls)
      [0,1,2,1,0].forEach((lane,i)=>{ const h=i<2?i*0.85:(4-i)*0.85; const c=new Coin(lane,z-i*4,h); this.scene.add(c.mesh); this.coins.push(c); });
    } else { // Wide spread across all lanes
      for(let lane=0;lane<3;lane++) for(let j=0;j<4;j++) { const c=new Coin(lane,z-j*3); this.scene.add(c.mesh); this.coins.push(c); }
    }
  }

  magnetCollect(playerX, range=18) {
    let total=0;
    this.coins=this.coins.filter(c=>{
      if(!c.alive) return false;
      if(Math.abs(c.z)<range && Math.abs(c.mesh.position.x-playerX)<range*1.5) {
        c.alive=false; this.scene.remove(c.mesh); total+=c.value; return false;
      }
      return true;
    });
    return total;
  }
}

// ============================================================
// INSPECTOR (visual chaser — not a gameplay threat)
// ============================================================

class Inspector {
  constructor(scene) {
    this.mesh=this._build();
    this.mesh.position.set(0,0,16);
    scene.add(this.mesh);
    this.z=16;
  }

  _build() {
    const g=new THREE.Group();
    const body=makeBox(1.05,1.45,0.68, 0x4CAF50); body.position.y=1; g.add(body);
    const head=makeSph(0.46,8, 0xFFD5A8); head.position.y=2.07; g.add(head);
    const hat=makeBox(1.05,0.38,1.05, 0x2E7D32); hat.position.y=2.64; g.add(hat);
    const brim=makeBox(1.36,0.11,1.36, 0x1B5E20); brim.position.y=2.4; g.add(brim);
    const legL=makeBox(0.36,0.88,0.36, 0x33691E); legL.position.set(-0.22,0.2,0); g.add(legL);
    const legR=makeBox(0.36,0.88,0.36, 0x33691E); legR.position.set( 0.22,0.2,0); g.add(legR);
    // Belly badge (star)
    const badge=makeSph(0.18,6, 0xFFD700, 0xFFD700, 0.8); badge.position.set(0,1.3,0.36); g.add(badge);
    return g;
  }

  update(dt, gameSpeed) {
    // Closer at slow speeds, far behind at high speeds
    const targetZ=lerp(14,26, clamp(gameSpeed/50,0,1));
    this.z=lerp(this.z, targetZ, dt*0.45);
    this.mesh.position.z=this.z;
    // Leg bob
    const t=Date.now()*0.008;
    if(this.mesh.children[4]) this.mesh.children[4].position.z=Math.sin(t)*0.32;
    if(this.mesh.children[5]) this.mesh.children[5].position.z=Math.sin(t+Math.PI)*0.32;
    // HUD indicator
    const el=document.getElementById('inspector-dist');
    if (el) {
      if (gameSpeed>35) { el.textContent='👮 Inspector falling behind!'; el.style.color='rgba(100,220,60,0.65)'; }
      else              { el.textContent='👮 Inspector closing in!';     el.style.color='rgba(229,57,53,0.65)'; }
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
    this.collected=(saveData.wordHuntDate===today) ? new Set(saveData.wordHuntLetters) : new Set();
    this.date=today;
    this.complete=(this.collected.size>=this.word.length);
    this._render();
  }

  collectLetter(l) {
    if (this.complete || this.collected.has(l)) return null;
    this.collected.add(l); this._render();
    if (this.collected.size >= this.word.length) { this.complete=true; return 'complete'; }
    return 'found';
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
// GAME — main controller
// ============================================================

class Game {
  constructor() {
    this.canvas   = document.getElementById('game-canvas');
    this.saveData = loadSave();
    reduceMotion  = this.saveData.reduceMotion;
    this.state    = 'menu';
    this.score=0; this.distance=0; this.coinsThisRun=0;
    this.elapsed=0; this.gameSpeed=SPEED_TIERS[0].speed; this.speedTierIdx=0;
    this.lastMilestone=0;

    this.sound = new SoundSystem();
    this._initThree();
    this._initLighting();
    this._initUI();
    this._buildMenu();
    this.clock=new THREE.Clock();
    this._loop();
  }

  // ── THREE SETUP ─────────────────────────────────────────────

  _initThree() {
    this.scene=new THREE.Scene();
    this.currentTheme=THEMES.find(t=>t.id===this.saveData.selectedTheme)||THEMES[0];

    // Bright arcade sky — NOT black
    this.scene.background=new THREE.Color(this.currentTheme.skyColor);

    // Soft depth fade — reduces contrast with distance, maintains silhouettes
    this.scene.fog=new THREE.Fog(
      this.currentTheme.fogColor,
      this.currentTheme.fogNear,
      this.currentTheme.fogFar
    );

    this.camera=new THREE.PerspectiveCamera(62, innerWidth/innerHeight, 0.1, 500);
    this.camera.position.set(0,10,14);
    this.camera.lookAt(0,1,-20);

    this.renderer=new THREE.WebGLRenderer({ canvas:this.canvas, antialias:true });
    this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    // Tone mapping makes colors pop — important for arcade feel
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1;

    globalThis.addEventListener('resize',()=>{
      this.camera.aspect=innerWidth/innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth,innerHeight);
    });
  }

  _initLighting() {
    const th=this.currentTheme;

    // Ambient — warm, bright, arcade-style (NO cool grey)
    this.ambientLight=new THREE.AmbientLight(th.ambientColor, th.ambientIntensity);
    this.scene.add(this.ambientLight);

    // Main directional — warm sun from upper-right
    this.dirLight=new THREE.DirectionalLight(th.dirColor, th.dirIntensity);
    this.dirLight.position.set(8,20,8);
    this.dirLight.castShadow=true;
    this.dirLight.shadow.mapSize.width=1024;
    this.dirLight.shadow.mapSize.height=1024;
    this.dirLight.shadow.camera.near=0.5;
    this.dirLight.shadow.camera.far=200;
    this.dirLight.shadow.camera.left=-35;
    this.dirLight.shadow.camera.right=35;
    this.dirLight.shadow.camera.top=35;
    this.dirLight.shadow.camera.bottom=-35;
    this.dirLight.shadow.bias=-0.001;
    this.scene.add(this.dirLight);

    // Fill light — warm, from lower-left, softens shadows
    this.fillLight=new THREE.PointLight(th.fillColor||th.dirColor, th.fillIntensity||0.5, 100);
    this.fillLight.position.set(-10,4,-5);
    this.scene.add(this.fillLight);

    // Sky hemisphere for extra warmth
    this.hemiLight=new THREE.HemisphereLight(th.skyColor||0x87ceeb, th.groundColor||0x7ab648, 0.4);
    this.scene.add(this.hemiLight);
  }

  // Apply theme changes — fully wired to all lighting and fog
  _applyTheme(id) {
    const th=THEMES.find(t=>t.id===id)||THEMES[0];
    this.currentTheme=th;
    this.saveData.selectedTheme=id; saveSave(this.saveData);

    // Scene
    this.scene.background=new THREE.Color(th.skyColor);
    this.scene.fog=new THREE.Fog(th.fogColor, th.fogNear, th.fogFar);

    // All lights — use theme intensity values
    this.ambientLight.color.set(th.ambientColor);
    this.ambientLight.intensity=th.ambientIntensity;
    this.dirLight.color.set(th.dirColor);
    this.dirLight.intensity=th.dirIntensity;
    this.fillLight.color.set(th.fillColor||th.dirColor);
    this.fillLight.intensity=th.fillIntensity||0.5;
    this.hemiLight.color.set(th.skyColor||0x87ceeb);
    this.hemiLight.groundColor.set(th.groundColor||0x7ab648);

    // Update ambient CSS orbs to match theme palette
    const orbs=document.querySelectorAll('#ambient-layer .orb, .menu-orbs .mo');
    const oc=th.orbColors||['rgba(255,165,0,0.2)','rgba(30,160,240,0.15)','rgba(100,215,60,0.12)'];
    orbs.forEach((o,i)=>{ o.style.background=oc[i%oc.length]; });
  }

  // ── UI ───────────────────────────────────────────────────────

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
    globalThis.addEventListener('keydown', e=>{
      if (this.keys[e.code]) { return; }
      this.keys[e.code]=true;
      this._handleKey(e.code);
    });
    globalThis.addEventListener('keyup', e=>{ this.keys[e.code]=false; });

    // Swipe
    let tx=0, ty=0;
    globalThis.addEventListener('touchstart', e=>{
      tx=e.touches[0].clientX; ty=e.touches[0].clientY;
    },{passive:true});
    globalThis.addEventListener('touchend', e=>{
      const dx=e.changedTouches[0].clientX-tx;
      const dy=e.changedTouches[0].clientY-ty;
      if (this.state!=='playing' || !this.player) return;
      if (Math.abs(dx)>Math.abs(dy)) {
        if (dx>28) { this.player.switchLane(1); }
        else if (dx<-28) { this.player.switchLane(-1); }
      } else if (dy<-28) {
        this.player.jump();
      } else if (dy>28) {
        this.player.roll();
      }
    },{passive:true});

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
      });
    });

    // Reduce motion
    document.getElementById('reduce-motion-btn').addEventListener('click',()=>{
      reduceMotion=!reduceMotion;
      this.saveData.reduceMotion=reduceMotion; saveSave(this.saveData);
      const btn=document.getElementById('reduce-motion-btn');
      btn.style.color=reduceMotion?'rgba(0,229,255,0.8)':'rgba(255,255,255,0.3)';
    });
    if (reduceMotion) document.getElementById('reduce-motion-btn').style.color='rgba(0,229,255,0.8)';

    // Auto-pause on tab switch
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
    if (this.player.boardActive) {
      this.player.boardActive=false;
      document.getElementById('board-btn').classList.remove('active-board','warn');
      document.getElementById('board-timer').textContent='';
      return;
    }
    if (this.saveData.hoverboards>0) this.player.activateBoard();
  }

  // ── MENU ─────────────────────────────────────────────────────

  _hex(c) { return '#'+c.toString(16).padStart(6,'0'); }

  _buildMenu() {
    document.getElementById('menu-best').textContent  = this.saveData.highScore.toLocaleString();
    document.getElementById('menu-coins').textContent = this.saveData.totalCoins.toLocaleString();
    document.getElementById('menu-mult').textContent  = '×'+this.saveData.multiplierLevel;

    // Characters
    const grid=document.getElementById('char-grid'); grid.innerHTML='';
    CHARACTERS.forEach(ch=>{
      const unlocked=ch.unlocked||(this.saveData.selectedChar===ch.id);
      const sel=(this.saveData.selectedChar===ch.id);
      let statusText = '✓ Ready';
      if (sel) { statusText = '✓ SELECTED'; }
      else if (!unlocked) { statusText = `🔒 ${ch.tokenCost} tokens`; }
      const card=document.createElement('div');
      card.className='char-card glass'+(sel?' selected':'');
      card.innerHTML=`
        <div class="char-avatar" style="background:radial-gradient(circle at 35% 32%,rgba(255,255,255,0.15),${this._hex(ch.color)})">${ch.emoji}</div>
        <div class="char-name">${ch.name}</div>
        <div class="char-ability">${ch.ability}</div>
        <div class="char-status ${unlocked?'':'locked'}">${statusText}</div>`;
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
      card.innerHTML=`
        <div class="theme-swatch" style="background:linear-gradient(135deg,${this._hex(th.skyColor)},${this._hex(th.groundColor||0x7ab648)})"></div>
        <div class="theme-name">${th.name}</div>`;
      card.addEventListener('click',()=>{ this._applyTheme(th.id); this._buildMenu(); });
      tgrid.appendChild(card);
    });

    this._buildMenuMissions();
    this._applyTheme(this.saveData.selectedTheme);
  }

  _buildMenuMissions() {
    const c=document.getElementById('menu-missions'); if(!c) return;
    const sd=this.saveData, ms=sd.missionSet||[], mp=sd.missionProgress||[0,0,0];
    c.innerHTML=`<div class="mm-header">Multiplier ×${sd.multiplierLevel}</div>`;
    if (!ms.length) {
      c.innerHTML+='<div style="font-size:11px;color:rgba(255,255,255,0.4);font-family:Inter,sans-serif">Play a run to generate missions!</div>';
      return;
    }
    ms.forEach((m,i)=>{
      const p=mp[i]||0, pct=Math.min(100,(p/m.target)*100);
      c.innerHTML+=`<div class="mm-item"><div class="mm-row"><span>${p>=m.target?'✅':'◻'} ${m.text.replace('{n}',m.target)}</span><span style="color:rgba(255,255,255,0.45)">${Math.min(p,m.target)}/${m.target}</span></div><div class="mp-bar-wrap"><div class="mp-bar-fill" style="width:${pct}%"></div></div></div>`;
    });
  }

  _showMenu() {
    this.state='menu';
    document.getElementById('menu-screen').style.display='flex';
    document.getElementById('gameover-screen').classList.remove('active');
    document.getElementById('pause-screen').classList.remove('active');
    document.getElementById('hud').classList.remove('active');

    // Scene cleanup
    if (this.trackManager) {
      [...this.trackManager.obstacles,...this.trackManager.coins,...this.trackManager.powerups,...this.trackManager.letterTokens]
        .forEach(o=>this.scene.remove(o.mesh));
      this.trackManager.segments.forEach(s=>this.scene.remove(s.group));
    }
    if (this.player)    { this.scene.remove(this.player.mesh); this.scene.remove(this.player.shadowMesh); }
    if (this.inspector) this.scene.remove(this.inspector.mesh);
    if (this.dustSystem) this.dustSystem.particles.forEach(p=>this.scene.remove(p.mesh));

    this.player=null; this.trackManager=null; this.inspector=null; this.dustSystem=null;
    this._buildMenu();
  }

  // ── GAME START ───────────────────────────────────────────────

  _startGame() {
    this.state='playing';
    document.getElementById('menu-screen').style.display='none';
    document.getElementById('gameover-screen').classList.remove('active');
    document.getElementById('pause-screen').classList.remove('active');
    document.getElementById('hud').classList.add('active');

    this.score=0; this.distance=0; this.coinsThisRun=0;
    this.elapsed=0; this.gameSpeed=SPEED_TIERS[0].speed; this.speedTierIdx=0;
    this.lastMilestone=0; this.deathAnimTimer=0; this.isDeathAnim=false;

    this._applyTheme(this.saveData.selectedTheme);

    this.trackManager=new TrackManager(this.scene, this.currentTheme);
    const charData=CHARACTERS.find(c=>c.id===this.saveData.selectedChar)||CHARACTERS[0];
    this.player=new Player(charData, this.scene);
    this.inspector=new Inspector(this.scene);
    this.dustSystem=new DustSystem(this.scene);

    this.missionSystem=new MissionSystem(this.saveData, newLevel=>{
      showMissionBanner(newLevel);
      flashScreen('#76FF03', 0.14, 180);
      this._renderMissionHUD();
    });

    this.wordHunt=new WordHunt(this.saveData);
    this.trackManager.setLetters(this.wordHunt.word, this.wordHunt.collected);

    // HUD reset
    document.getElementById('pu-slot').classList.remove('show');
    document.getElementById('board-timer').textContent='';
    document.getElementById('board-btn').classList.remove('active-board','warn');
    document.getElementById('board-count').textContent=this.saveData.hoverboards;
    document.getElementById('board-btn').classList.toggle('empty', this.saveData.hoverboards<=0);
    document.getElementById('mission-banner').classList.remove('show');
    document.getElementById('hud-missions').classList.remove('open');
    document.getElementById('mission-pill').style.display='block';

    this.sound.startRunning();
    this.sound.startSiren();

    this._renderMissionHUD();
    this._updateHUD();
    this.camera.position.set(0,10,14);
    this.clock.getDelta();
  }

  // ── PAUSE ─────────────────────────────────────────────────────

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

  // ── DEATH ─────────────────────────────────────────────────────

  _die() {
    if (!this.player||this.player.dead) return;
    this.player.dead=true; this.isDeathAnim=true; this.deathAnimTimer=1.4;
    this.state='dead';
    this.sound.playCrash();
    this.sound.stopRunning();
    this.sound.stopSiren();
    flashScreen('#FF1744', 0.78, 200);
    triggerCameraShake(5, 320, 3);

    if (this.score>this.saveData.highScore) this.saveData.highScore=this.score;
    this.saveData.totalCoins+=this.coinsThisRun;
    Object.assign(this.saveData, this.missionSystem.getSaveData());
    Object.assign(this.saveData, this.wordHunt.getSaveData());
    saveSave(this.saveData);

    setTimeout(()=>this._showGameOver(), 1500);
  }

  _showGameOver() {
    document.getElementById('gameover-screen').classList.add('active');
    document.getElementById('hud').classList.remove('active');
    document.getElementById('go-score').textContent=Math.floor(this.score).toLocaleString();
    document.getElementById('go-dist').textContent=Math.floor(this.distance)+'m';
    document.getElementById('go-coins').textContent=this.coinsThisRun;
    document.getElementById('go-mult').textContent='×'+this.missionSystem.multiplierLevel;
    const isNew=this.score>=this.saveData.highScore;
    document.getElementById('go-best').textContent=isNew?'🏆 NEW BEST!':'Best: '+this.saveData.highScore.toLocaleString();

    // Mission breakdown
    const mList=document.getElementById('go-missions-list'); mList.innerHTML='';
    this.missionSystem.currentSet.forEach((m,i)=>{
      const p=Math.min(this.missionSystem.progress[i], m.target);
      const pct=Math.min(100,(p/m.target)*100);
      const done=p>=m.target;
      mList.innerHTML+=`<div class="go-m-row"><span class="go-m-text">${done?'✅':'◻'} ${m.text.replace('{n}',m.target)}</span><div class="go-m-bar-wrap"><div class="go-m-bar" style="width:${pct}%;background:${done?'#76FF03':'#2196F3'}"></div></div></div>`;
    });
  }

  // ── HUD UPDATE ────────────────────────────────────────────────

  _updateHUD() {
    document.getElementById('hud-score').textContent=String(Math.floor(this.score)).padStart(6,'0');
    document.getElementById('hud-multiplier').textContent='×'+this.missionSystem.multiplierLevel;
    document.getElementById('hud-distance').textContent=Math.floor(this.distance)+'m';
    document.getElementById('hud-coins').textContent=this.coinsThisRun;
  }

  _renderMissionHUD() {
    if (!this.missionSystem) return;
    const {m,p}=this.missionSystem.getActiveMission();
    const pct=Math.min(100,(p/m.target)*100);
    document.getElementById('mp-text').textContent=`${m.text.replace('{n}',m.target)} (${Math.min(p,m.target)}/${m.target})`;
    document.getElementById('mp-fill').style.width=pct+'%';

    const list=document.getElementById('mission-list'); if(!list) return;
    list.innerHTML='';
    this.missionSystem.currentSet.forEach((mi,i)=>{
      const pi=this.missionSystem.progress[i];
      const pctI=Math.min(100,(pi/mi.target)*100);
      const done=(pi>=mi.target);
      const div=document.createElement('div'); div.className='me-item';
      div.innerHTML=`<div class="me-row${done?' done':''}"><span>${done?'✅':'◻'} ${mi.text.replace('{n}',mi.target)}</span><span>${Math.min(pi,mi.target)}/${mi.target}</span></div><div class="me-bar"><div class="me-fill${done?' done':''}" style="width:${pctI}%"></div></div>`;
      list.appendChild(div);
    });
  }

  // ── COLLISION ─────────────────────────────────────────────────

  _checkCollisions() {
    if (!this.player||this.player.dead) return;
    const pb=this.player.getHitBox();
    this._checkObstacleCollisions(pb);
    this._checkCoinCollisions(pb);
    this._checkPickupCollisions(pb);
    this._checkLetterCollisions(pb);
  }

  _checkObstacleCollisions(pb) {
    for (const obs of this.trackManager.obstacles) {
      if (!obs.alive) { continue; }
      const oz=obs.mesh.position.z;
      if (oz<-3||oz>5) { continue; }
      const dx=Math.abs(pb.x-obs.mesh.position.x);
      if (dx>obs.halfW+0.42) { continue; }

      const pass = this._canPassObstacle(obs, pb);
      if (!pass) {
        obs.alive=false;
        this.scene.remove(obs.mesh);
        this._handleHit();
        return;
      }
    }
  }

  _canPassObstacle(obs, pb) {
    if (obs.type==='highBarrier') { return pb.isRolling; }
    if (obs.type==='barrier')     { return pb.y>1.2 || pb.isRolling; }
    if (obs.type==='train')       { return pb.y>3.5; }
    return false;
  }

  _checkCoinCollisions(pb) {
    if (this.player.activePowerup?.id==='magnet') {
      const range=this.player.charData.id==='fresh'?24:18;
      const v=this.trackManager.magnetCollect(pb.x, range);
      if (v>0) { this.coinsThisRun+=v; this.missionSystem.track('coins',v); }
      return;
    }
    for (let i=this.trackManager.coins.length-1;i>=0;i--) {
      const c=this.trackManager.coins[i]; if(!c.alive) { continue; }
      const cz=c.mesh.position.z;
      if (cz<-2||cz>4) { continue; }
      const cx=c.mesh.position.x, cy=c.mesh.position.y;
      if (Math.abs(pb.x-cx)<1.2 && Math.abs(cy-pb.y-1)<2.2 && Math.abs(cz)<2.4) {
        c.alive=false; this.scene.remove(c.mesh); this.trackManager.coins.splice(i,1);
        this.coinsThisRun+=c.value; this.missionSystem.track('coins',c.value);
        this.sound.playCoin();
        spawnCoinFloat(c.value, innerWidth/2+pb.x*30, 110);
        if (c.isGolden) { showToast('⭐ Golden! +5','#FFD700'); }
      }
    }
  }

  _checkPickupCollisions(pb) {
    for (let i=this.trackManager.powerups.length-1;i>=0;i--) {
      const pu=this.trackManager.powerups[i]; if(!pu.alive) { continue; }
      const pz=pu.mesh.position.z;
      if (pz<-3||pz>5) { continue; }
      if (Math.abs(pb.x-pu.mesh.position.x)<1.45&&Math.abs(pz)<2.7) {
        pu.alive=false; this.scene.remove(pu.mesh); this.trackManager.powerups.splice(i,1);
        this.player.activatePowerup(pu.typeData);
        this.missionSystem.track('powerups');
        showToast(`${pu.typeData.icon} ${pu.typeData.label}!`,'#fff');
      }
    }
  }

  _checkLetterCollisions(pb) {
    for (let i=this.trackManager.letterTokens.length-1;i>=0;i--) {
      const lt=this.trackManager.letterTokens[i]; if(!lt.alive) { continue; }
      const lz=lt.mesh.position.z;
      if (lz<-3||lz>5) { continue; }
      if (Math.abs(pb.x-lt.mesh.position.x)<1.45&&Math.abs(lz)<2.7) {
        lt.alive=false; this.scene.remove(lt.mesh); this.trackManager.letterTokens.splice(i,1);
        const r=this.wordHunt.collectLetter(lt.letter);
        if (r==='complete') {
          showToast('🎉 WORD COMPLETE! +200','#FFD700');
          this.coinsThisRun+=200;
          document.getElementById('wc-word').textContent=this.wordHunt.word;
          const wc=document.getElementById('word-complete');
          wc.classList.add('show'); setTimeout(()=>wc.classList.remove('show'),2700);
        } else if (r==='found') {
          showToast(`✨ "${lt.letter}" found!`,'#FFD700');
          flashScreen('#FFD700',0.1,100);
        }
      }
    }
  }

  _handleHit() {
    if (this.player.boardActive) {
      // Board absorbs the crash
      this.player.boardActive=false;
      document.getElementById('board-btn').classList.remove('active-board','warn');
      document.getElementById('board-timer').textContent='';
      this.saveData.hoverboards=Math.max(0,this.saveData.hoverboards-1);
      document.getElementById('board-count').textContent=this.saveData.hoverboards;
      document.getElementById('board-btn').classList.toggle('empty',this.saveData.hoverboards<=0);
      this.dustSystem?.burst(this.player.mesh.position.x, 0.2, this.player.mesh.position.z, 10);
      flashScreen('#00E5FF', 0.35, 160);
      triggerCameraShake(3,160,1);
      showToast('🛹 Board saved you!','#00E5FF');
      this.missionSystem.track('board');
      this.player.invincible=true; this.player.invincibleTimer=2;
      const ring=this.player.mesh.getObjectByName('boardRing');
      if (ring) ring.visible=false;
    } else {
      this._die();
    }
  }

  // ── MAIN LOOP ─────────────────────────────────────────────────

  _loop() {
    requestAnimationFrame(()=>this._loop());
    const dt=Math.min(this.clock.getDelta(), 0.05);
    if      (this.state==='playing') this._update(dt);
    else if (this.state==='dead')    this._updateDeath(dt);
    if (missionBannerTimer>0) {
      missionBannerTimer-=dt;
      if (missionBannerTimer<=0) document.getElementById('mission-banner').classList.remove('show');
    }
    this.renderer.render(this.scene, this.camera);
  }

  _update(dt) {
    this.elapsed+=dt;

    // Speed tier progression
    const thresholds=[0,20,50,90];
    for (let i=SPEED_TIERS.length-1;i>=0;i--) {
      if (this.elapsed>=thresholds[i]) {
        if (this.speedTierIdx!==i) {
          this.speedTierIdx=i;
          showToast(`⚡ ${SPEED_TIERS[i].name}!`, SPEED_TIERS[i].color);
          flashScreen(SPEED_TIERS[i].color, 0.12, 100);
        }
        break;
      }
    }
    this.gameSpeed=lerp(this.gameSpeed, SPEED_TIERS[this.speedTierIdx].speed, dt*0.85);

    this.player.update(dt);
    this.trackManager.update(dt, this.gameSpeed, this.elapsed);
    this.inspector.update(dt, this.gameSpeed);
    this.dustSystem.update(dt);

    // Update siren volume based on police distance (danger level)
    const policeDanger = Math.max(0, 1 - (this.gameSpeed / 35));
    this.sound.setSirenVolume(policeDanger * 0.25);

    // Dust burst when roll ends
    if (this.player.wasRolling&&!this.player.isRolling) {
      this.dustSystem.burst(this.player.mesh.position.x, 0.1, this.player.mesh.position.z);
    }
    this.player.wasRolling=this.player.isRolling;

    this._checkCollisions();

    // Score / distance
    this.distance+=this.gameSpeed*dt*0.25;
    const mult=this.missionSystem.multiplierLevel*(this.player.activePowerup?.id==='x2'?2:1);
    this.score+=this.gameSpeed*dt*mult*0.5;

    // Mission tracking
    this.missionSystem.track('distance', this.gameSpeed*dt*0.25);
    this.missionSystem.track('survive', dt);
    if (this.player.isRolling) { this.missionSystem.track('rolls', dt*0.38); }
    if (this.player.isJumping&&this.player.y>0.5) { this.missionSystem.track('jumps', dt*0.38); }

    const mRes=this.missionSystem.checkProgress();
    if (mRes) this._renderMissionHUD();

    // 500m milestone celebration
    const milestone=Math.floor(this.distance/500)*500;
    if (milestone>this.lastMilestone&&milestone>0) {
      this.lastMilestone=milestone;
      showToast(`🏃 ${milestone}m!`, '#00E5FF');
      const dEl=document.getElementById('hud-distance');
      dEl.classList.add('pulse');
      setTimeout(()=>dEl.classList.remove('pulse'),420);
    }

    this._updateCamera(dt);
    this._updateHUD();
  }

  _updateCamera(dt) {
    if (!this.player) return;
    const px=this.player.mesh.position.x;
    const py=this.player.mesh.position.y;

    // Smooth follow — slight offset toward player X
    const tx=lerp(this.camera.position.x, px*0.28, dt*4);
    const ty=lerp(this.camera.position.y, 10+py*0.5, dt*3);
    this.camera.position.x=tx;
    this.camera.position.y=ty;
    this.camera.position.z=14;

    // Camera shake (crash feedback)
    if (cameraShake.active&&!reduceMotion) {
      cameraShake.elapsed+=dt;
      const progress=cameraShake.elapsed/(cameraShake.timer||0.3);
      if (progress>=1) { cameraShake.active=false; }
      else {
        const wave=Math.sin(progress*Math.PI*cameraShake.oscillations*2);
        const decay=1-progress;
        this.camera.position.x+=wave*cameraShake.intensity*decay*0.012;
        this.camera.position.y+=Math.sin(progress*Math.PI*cameraShake.oscillations)*cameraShake.intensity*decay*0.007;
      }
    }

    this.camera.lookAt(px*0.1, py*0.3+1, -15);
  }

  _updateDeath(dt) {
    if (this.deathAnimTimer>0) {
      this.deathAnimTimer-=dt;
      // Dramatic camera pull-back and tilt
      this.camera.position.y=lerp(this.camera.position.y, 5, dt*2.5);
      this.camera.position.z=lerp(this.camera.position.z, 9, dt*2.5);
      if (this.player) {
        this.player.mesh.rotation.z+=dt*4.5;
        this.player.mesh.position.y-=dt*9;
        this.player.mesh.position.y=Math.max(this.player.mesh.position.y,-2);
      }
      this.camera.lookAt(0,1,0);
      this.dustSystem?.update(dt);
    }
  }
}

// ============================================================
// BOOT
// ============================================================

globalThis.addEventListener('DOMContentLoaded',()=>{
  try {
    new Game();
  } catch(e) {
    console.error('Subway Runner boot error:',e);
    document.body.innerHTML=`
      <div style="color:#fff;padding:40px;font-family:monospace;background:#0f3058;min-height:100vh">
        <h2 style="color:#FFD700">⚠ Boot Failed</h2>
        <pre style="margin-top:16px;color:#FF6D00">${e.message}</pre>
        <p style="margin-top:16px;color:rgba(255,255,255,0.5)">Run: npm install &amp;&amp; npm run dev</p>
      </div>`;
  }
});

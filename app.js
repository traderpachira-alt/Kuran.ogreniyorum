'use strict';

/* =========================================================
   Kur'an Öğreniyorum — 4-6 yaş için Arapça harf oyunları
   ========================================================= */

// ---------- Veri: 28 harf ----------
// tr: ekranda yazan ve okunan üstünlü okunuş (بَ = Be, جَ = Ce …); name: harfin adı (ebeveyn için ipucunda)
const LETTERS = [
  { c: 'ا', tr: 'E',  name: 'Elif', hint: 'Dimdik bir çubuk' },
  { c: 'ب', tr: 'Be', name: 'Be',   hint: 'Gemi gibi, altında 1 nokta' },
  { c: 'ت', tr: 'Te', name: 'Te',   hint: 'Üstünde 2 nokta' },
  { c: 'ث', tr: 'Se', name: 'Se (peltek)', hint: 'Üstünde 3 nokta' },
  { c: 'ج', tr: 'Ce', name: 'Cim',  hint: 'Karnında 1 nokta' },
  { c: 'ح', tr: 'Ha', name: 'Ha',   hint: 'Cim gibi ama noktasız' },
  { c: 'خ', tr: 'Ha', name: 'Hı',   hint: 'Başında 1 nokta' },
  { c: 'د', tr: 'De', name: 'Dal',  hint: 'Küçük bir köşe, noktasız' },
  { c: 'ذ', tr: 'Ze', name: 'Zel (peltek)', hint: 'Dal gibi, üstünde 1 nokta' },
  { c: 'ر', tr: 'Ra', name: 'Ra',   hint: 'Kaydırak gibi, noktasız' },
  { c: 'ز', tr: 'Ze', name: 'Ze',   hint: 'Ra gibi, üstünde 1 nokta' },
  { c: 'س', tr: 'Se', name: 'Sin',  hint: 'Üç küçük diş' },
  { c: 'ش', tr: 'Şe', name: 'Şın',  hint: 'Dişlerin üstünde 3 nokta' },
  { c: 'ص', tr: 'Sa', name: 'Sad',  hint: 'Yumurta gibi, noktasız' },
  { c: 'ض', tr: 'Da', name: 'Dad',  hint: 'Sad gibi, üstünde 1 nokta' },
  { c: 'ط', tr: 'Ta', name: 'Tı',   hint: 'Bayrak direği gibi' },
  { c: 'ظ', tr: 'Za', name: 'Zı',   hint: 'Tı gibi, üstünde 1 nokta' },
  { c: 'ع', tr: 'A',  name: 'Ayn',  hint: 'Açık ağız gibi, noktasız' },
  { c: 'غ', tr: 'Ğa', name: 'Ğayn', hint: 'Ayn gibi, üstünde 1 nokta' },
  { c: 'ف', tr: 'Fe', name: 'Fe',   hint: 'Üstünde 1 nokta' },
  { c: 'ق', tr: 'Ka', name: 'Kaf',  hint: 'Üstünde 2 nokta, derin çanak' },
  { c: 'ك', tr: 'Ke', name: 'Kef',  hint: 'İçinde küçük bir işaret' },
  { c: 'ل', tr: 'Le', name: 'Lam',  hint: 'Uzun boylu, aşağı kıvrık' },
  { c: 'م', tr: 'Me', name: 'Mim',  hint: 'Yuvarlak bir başı var' },
  { c: 'ن', tr: 'Ne', name: 'Nun',  hint: 'Kâse gibi, üstünde 1 nokta' },
  { c: 'و', tr: 'Ve', name: 'Vav',  hint: 'Küçük başlı, aşağı kıvrık' },
  { c: 'ه', tr: 'He', name: 'He',   hint: 'Yuvarlacık' },
  { c: 'ي', tr: 'Ye', name: 'Ye',   hint: 'Altında 2 nokta' },
];
const FATHA = '\u064E';
LETTERS.forEach(L => { L.ar = L.c + FATHA; L.cf = L.c + FATHA; });   // üstünlü yazılış: بَ

const COLORS = ['#ff6b6b', '#f76707', '#f59f00', '#37b24d', '#0ca678', '#1c7ed6', '#4c6ef5', '#ae3ec9', '#e64980'];
const colorOf = i => COLORS[i % COLORS.length];
const PRAISE = ['Aferin!', 'Harika!', 'Süpersin!', 'Maşallah!', 'Çok güzel!', 'Bravo!'];
const VERSION = '16 (15.11.2026)';
const MASTERED = 3; // bir harf kaç doğru cevapta "çiçek açar"

// ---------- Yardımcılar ----------
const $ = id => document.getElementById(id);
const rand = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, n) => shuffle(a).slice(0, n);
const wait = ms => new Promise(r => setTimeout(r, ms));

// ---------- Kayıt ----------
const KEY = 'kuran-ogreniyorum-v1';
const DEFAULTS = { stars: 0, spent: 0, seen: [], score: {}, owned: [], scene: [], hat: null, settings: { sfx: true, voice: 'ar', pool: 'auto', speed: 'slow', childName: '' } };
let S = load();
function load() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY));
    if (r) return { ...DEFAULTS, ...r, settings: { ...DEFAULTS.settings, ...(r.settings || {}) } };
  } catch (e) { /* gizli sekme vb. */ }
  return JSON.parse(JSON.stringify(DEFAULTS));
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* yoksay */ } }

function addStars(n = 1) {
  S.stars += n; save();
  $('starNum').textContent = S.stars;
  const el = $('starCount'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}
function markSeen(i) { if (!S.seen.includes(i)) { S.seen.push(i); save(); } }
function scoreUp(i) { S.score[i] = (S.score[i] || 0) + 1; save(); }

/** Oyunlarda kullanılacak harfler: çocuğun gördüğü harfler (en az 4). */
function pool() {
  if (S.settings.pool === 'all') return LETTERS.map((_, i) => i);
  const p = [...S.seen].sort((a, b) => a - b);
  for (let i = 0; p.length < 4; i++) if (!p.includes(i)) p.push(i);
  return p;
}

// ---------- Ses: konuşma ----------
// Öncelik: 1) ses/NN.mp3 kaydı varsa onu çal  2) cihazın Arapça sesi  3) Türkçe isim.
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) { voices = []; } }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
// Aynı dildeki sesler arasında daha doğal olanları (Google, Enhanced, Neural…) tercih et.
const GOOD_VOICE = /google|enhanced|premium|natural|neural|siri|online/i;
function voiceFor(lang) {
  const list = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang));
  return list.find(v => GOOD_VOICE.test(v.name)) || list[0];
}
const hasArabic = () => !!voiceFor('ar');
const RATES = { slow: { ar: 0.55, tr: 0.75 }, normal: { ar: 0.8, tr: 0.95 } };

function speak(text, lang = 'tr', rate) {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceFor(lang);
    if (v) u.voice = v;
    u.lang = v ? v.lang : (lang === 'ar' ? 'ar-SA' : 'tr-TR');
    u.rate = rate || (lang === 'ar' ? 0.8 : 0.95);
    u.pitch = lang === 'ar' ? 1 : 1.15;
    let done = false; const fin = () => { if (!done) { done = true; resolve(); } };
    u.onend = fin; u.onerror = fin;
    setTimeout(fin, 6000);
    speechSynthesis.speak(u);
  });
}

// ---------- Kayıtlı sesler ----------
// Öncelik: 1) ebeveynin bu cihazda kaydettiği ses  2) uygulamayla gelen hoca sesi (ses/)  3) yapay ses
// Kayıtlar Web Audio ile çalınır: önceden çözülür, dokununca bekletmeden başlar.
let actx = null;
function getCtx() { return actx || (actx = new (window.AudioContext || window.webkitAudioContext)()); }
function decodeAudio(buf) {
  return new Promise((res, rej) => {
    try { const p = getCtx().decodeAudioData(buf.slice(0), res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); }
  });
}
let clip = null, srcNode = null;
const recRaw = {};   // harf no -> { buf, type } (ebeveyn kaydı, yedek için ham hali)
const recBuf = {};   // harf no -> çözülmüş ses
const appBuf = {};   // harf no -> uygulamayla gelen çözülmüş ses
let appClips = {};   // harf no -> dosya adı (ses/sesler.json)

const appRaw = {};   // harf no -> { buf, type } (yedek çalma yolu için ham hali)
async function keepAppClip(k, buf) {
  appRaw[k] = { buf, type: 'audio/mpeg' };
  try { appBuf[k] = await decodeAudio(buf); } catch (e) { /* <audio> yolu kullanılır */ }
}
async function loadAppClips() {
  try {
    const embedded = window.KURAN_CLIPS;          // tek dosyalık sürümde sayfanın içine gömülü
    if (embedded) {
      appClips = Object.fromEntries(Object.keys(embedded).map(k => [k, true]));
      await Promise.all(Object.entries(embedded).map(([k, b64]) => keepAppClip(k, b64ToBuf(b64))));
    } else {
      const r = await fetch('ses/sesler.json');
      if (!r.ok) return;
      appClips = await r.json();
      await Promise.all(Object.entries(appClips).map(async ([k, f]) => {
        await keepAppClip(k, await (await fetch('ses/' + f)).arrayBuffer());
      }));
    }
  } catch (e) { /* kayıt yoksa yapay ses kullanılır */ }
  if (current === 'record') renderRecList();
}

// Küçük IndexedDB yardımcısı: { buf: ArrayBuffer, type } olarak saklar (Safari'de de güvenli).
const recStore = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open('kuran-ogreniyorum-sesler', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('rec');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  }));
  const run = (mode, fn) => open().then(db => new Promise((res, rej) => {
    const t = db.transaction('rec', mode);
    const req = fn(t.objectStore('rec'));
    t.oncomplete = () => res(req && req.result);
    t.onerror = () => rej(t.error);
  }));
  return {
    set: (k, v) => run('readwrite', st => st.put(v, k)),
    del: k => run('readwrite', st => st.delete(k)),
    all: () => open().then(db => new Promise((res, rej) => {
      const out = {}, req = db.transaction('rec').objectStore('rec').openCursor();
      req.onsuccess = () => { const c = req.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
      req.onerror = () => rej(req.error);
    })),
  };
})();
/** Ebeveyn kaydını belleğe alır: önce çözmeyi dener, olmazsa <audio> adresi hazırlar. */
async function loadRec(i, buf, type) {
  recRaw[i] = { buf, type };
  delete recBuf[i];
  try { recBuf[i] = await decodeAudio(buf); } catch (e) { /* <audio> yolu kullanılır */ }
}
function dropRec(i) {
  delete recRaw[i]; delete recBuf[i];
}
const hasRec = i => !!recRaw[i];

// iPhone'da sessiz moddayken de çalsın (iOS 17+): ses oturumunu "oynatma" yap.
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* yoksay */ }
// Her dokunuşta ses motorunu uyandır (bazı tarayıcılar yalnızca dokunuşla açar, iPhone arada kapatabilir).
function unlockAudio() {
  try {
    const c = getCtx();
    if (c.state !== 'running') c.resume().catch(() => {});
    const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0);
  } catch (e) { /* yoksay */ }
}
['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio, { capture: true, passive: true }));

let lastPath = '';   // Anne-Baba bölümündeki ses testi için: en son hangi yolla çalındı
function playBuffer(b) {
  return new Promise(resolve => {
    const c = getCtx();
    const s = c.createBufferSource();
    s.buffer = b; s.connect(c.destination);
    s.onended = () => { if (srcNode === s) srcNode = null; resolve(); };
    srcNode = s; s._done = resolve;
    s.start();
    lastPath = 'Web Audio';
  });
}
function playUrl(url) {
  return new Promise((resolve, reject) => {
    const a = new Audio(url);
    clip = a;
    let settled = false;
    const ok = () => { if (!settled) { settled = true; resolve(); } };
    const no = () => { if (!settled) { settled = true; if (clip === a) clip = null; reject(); } };
    a.onended = ok;
    a.onerror = no;
    a.onplaying = () => { lastPath = 'ses dosyası'; };
    const p = a.play();
    if (p && p.catch) p.catch(no);
    setTimeout(() => { if (a.paused && !a.ended) no(); }, 1500);   // hiç başlamadıysa yedeğe geç
  });
}
const rawUrls = new Map();
function rawUrl(raw) {
  if (!rawUrls.has(raw)) rawUrls.set(raw, URL.createObjectURL(new Blob([raw.buf], { type: raw.type })));
  return rawUrls.get(raw);
}
// iPhone/iPad'de Web Audio sessiz moddayken susar; orada önce ses dosyası yolu denenir.
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
/** Bir kaydı en güvenilir yolla çalar: Web Audio açıksa onunla, değilse ses dosyası olarak, o da olmazsa yapay sesle. */
function playSound(buf, raw, fallback) {
  const c = getCtx();
  if (buf && c.state === 'running' && !(IS_IOS && raw)) return playBuffer(buf);
  if (raw) {
    return playUrl(rawUrl(raw)).catch(() => {
      if (buf) return c.resume().then(() => (c.state === 'running' ? playBuffer(buf) : fallback()), fallback);
      return fallback();
    });
  }
  if (buf) return c.resume().then(() => (c.state === 'running' ? playBuffer(buf) : fallback()), fallback);
  return fallback();
}
function hush() {
  try { speechSynthesis.cancel(); } catch (e) { /* yoksay */ }
  if (clip) { clip.pause(); clip = null; }
  if (srcNode) { const s = srcNode; srcNode = null; try { s.onended = null; s.stop(); } catch (e) { /* yoksay */ } if (s._done) s._done(); }
}
function sayLetter(i) {
  const L = LETTERS[i], r = RATES[S.settings.speed] || RATES.slow;
  const tts = () => { lastPath = 'yapay ses'; return (S.settings.voice === 'ar' && hasArabic()) ? speak(L.ar, 'ar', r.ar) : speak(L.tr, 'tr', r.tr); };
  if (recRaw[i]) return playSound(recBuf[i], recRaw[i], tts);    // ebeveynin sesi her zaman önce gelir
  if (appRaw[i]) return playSound(appBuf[i], appRaw[i], tts);    // hocanın sesi
  return tts();
}
function praise() { const p = rand(PRAISE); speak(withName(p, 0.6), 'tr'); return p; }

// ---------- Çocuğun adı ----------
// Ad, Türkçe ek gerektirmeyecek şekilde hitap olarak eklenir.
// Övgülerde sona: "Aferin!" -> "Aferin, Ayşe!"; yönergelerde başa: "Bul bakalım!" -> "Ayşe, bul bakalım!"
const childName = () => (S.settings.childName || '').trim();
function nameFirst(text, chance = 1) {
  const n = childName();
  if (!n || Math.random() > chance) return text;
  return `${n}, ${text[0].toLocaleLowerCase('tr')}${text.slice(1)}`;
}
function withName(text, chance = 1) {
  const n = childName();
  if (!n || Math.random() > chance) return text;
  const m = text.match(/^(.*?)([!?.]*)$/);
  return `${m[1]}, ${n}${m[2] || '!'}`;
}
function cleanName(v) {
  return v.replace(/[^\p{L}\s'-]/gu, '').replace(/\s+/g, ' ').replace(/^\s+/, '').slice(0, 20)
    .split(' ').map(w => (w ? w[0].toLocaleUpperCase('tr') + w.slice(1) : w)).join(' ');
}
function esc(t) { return t.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
function greet() {
  const n = childName();
  $('bubble').innerHTML = n
    ? `Selam <b>${esc(n)}</b>! Ben <b>Hilal</b>.<br>Hadi harfleri öğrenelim!`
    : 'Selam! Ben <b>Hilal</b>.<br>Hadi harfleri öğrenelim!';
}

// ---------- Ses: efektler (dosya gerektirmez) ----------
function tone(freqs, dur = 0.12, type = 'sine', vol = 0.2) {
  if (!S.settings.sfx) return;
  try {
    const actx = getCtx();
    if (actx.state === 'suspended') actx.resume();
    const t0 = actx.currentTime;
    freqs.forEach((f, k) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = t0 + k * dur;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.05);
    });
  } catch (e) { /* yoksay */ }
}
const sfx = {
  ok:   () => tone([523, 659, 784], 0.1, 'triangle'),
  no:   () => tone([330, 247], 0.16, 'sine', 0.15),
  pop:  () => tone([880, 440], 0.06, 'square', 0.07),
  flip: () => tone([620], 0.06, 'triangle', 0.1),
  win:  () => tone([523, 659, 784, 1047, 784, 1047], 0.12, 'triangle'),
};

// ---------- Görsel efektler ----------
function confetti(n = 40) {
  const fx = $('fx');
  for (let k = 0; k < n; k++) {
    const s = document.createElement('span');
    s.className = 'confetti';
    s.style.left = Math.random() * 100 + 'vw';
    s.style.background = rand(COLORS);
    s.style.animationDelay = Math.random() * 0.4 + 's';
    s.style.animationDuration = 1.2 + Math.random() * 0.9 + 's';
    fx.appendChild(s);
    setTimeout(() => s.remove(), 2600);
  }
}
function replayAnim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function renderDots(el, total, filled) {
  el.innerHTML = Array.from({ length: total }, (_, k) => `<i class="${k < filled ? 'on' : ''}"></i>`).join('');
}

// ---------- Ekranlar ----------
const TITLES = {
  home: "Kur'an Öğreniyorum", learn: 'Harfleri Tanı', find: 'Dinle ve Bul', trace: 'Harf Çiz',
  balloon: 'Balon Patlat', memory: 'Hafıza Kartları', garden: 'Harf Bahçem', parent: 'Anne-Baba',
  table: 'Elif-Ba Tablosu', record: 'Harf Seslerim', shop: 'Yıldız Dükkanı', sureler: 'Sureler', sure: 'Sure',
};
let current = 'home';
let replay = null; // ödül ekranındaki "Tekrar" ne yapacak

function show(id) {
  stopBalloon();
  if (window.Garden3D) Garden3D.stop();
  if (typeof stopSure === 'function') stopSure();
  if (typeof stopRec === 'function') stopRec();
  hush();
  current = id;
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  $('title').textContent = TITLES[id];
  $('homeBtn').hidden = id === 'home';
  $('reward').hidden = true;
}

function go(id) {
  if (id === 'learn') return openLearn();
  if (id === 'find') return startFind();
  if (id === 'trace') return startTrace();
  if (id === 'balloon') return startBalloon();
  if (id === 'memory') return startMemory();
  if (id === 'garden') return openGarden();
  if (id === 'table') return openTable();
  if (id === 'shop') return openShop();
  if (id === 'sureler') return openSureler();
}

/** Oyun sonu ödülü. Hata sayısına göre 1-3 yıldız: ok = hatasız sınır, good = 2 yıldız sınırı. */
function starsFor(mistakes, ok, good) { return mistakes <= ok ? 3 : mistakes <= good ? 2 : 1; }
function reward(title, againFn, stars = 3) {
  replay = againFn;
  sfx.win(); confetti(stars === 3 ? 70 : stars === 2 ? 40 : 20); addStars(stars);
  $('rStars').innerHTML = [1, 2, 3].map(k => `<span class="${k <= stars ? 'on' : 'off'}">⭐</span>`).join('');
  $('rTitle').textContent = stars === 3 ? (title || rand(PRAISE)) : stars === 2 ? 'Çok iyi!' : 'Güzel deneme!';
  $('rHint').textContent = stars === 3 ? '' : 'Daha az hata yaparsan 3 yıldız kazanırsın!';
  $('reward').hidden = false;
  const say = {
    3: withName('Tebrikler!') + ' Üç yıldız kazandın!',
    2: withName('Çok iyi!') + ' İki yıldız kazandın! Daha dikkatli olursan üç yıldız kazanırsın.',
    1: withName('Güzel deneme!') + ' Bir yıldız kazandın. Hadi bir daha deneyelim, daha çok yıldız kazanalım!',
  }[stars];
  speak(say, 'tr');
}

// ---------- 1) Harfleri Tanı ----------
let li = 0;
function openLearn(i) {
  if (i === undefined) { i = LETTERS.findIndex((_, k) => !S.seen.includes(k)); if (i < 0) i = 0; }
  li = i; show('learn'); renderLearn();
}
function renderLearn() {
  const L = LETTERS[li], card = $('lCard');
  card.style.setProperty('--c', colorOf(li));
  $('lChar').textContent = L.cf;
  $('lName').textContent = L.tr;
  $('lHint').textContent = `${L.name} harfi · ${L.hint}`;
  $('lCount').textContent = `${li + 1} / ${LETTERS.length}`;
  replayAnim(card, 'pop');
  markSeen(li);
  hush(); sayLetter(li);
}
$('lCard').onclick = () => { replayAnim($('lCard'), 'pop'); hush(); sayLetter(li); };
$('nextL').onclick = () => { li = (li + 1) % LETTERS.length; renderLearn(); };
$('prevL').onclick = () => { li = (li - 1 + LETTERS.length) % LETTERS.length; renderLearn(); };
$('lTrace').onclick = () => startTrace(li);

// ---------- 2) Dinle ve Bul ----------
const FIND_ROUNDS = 6;
const fg = { round: 0, target: 0, locked: false, miss: 0, missThis: false };
function startFind() { fg.round = 0; fg.miss = 0; show('find'); nextFind(); }
function nextFind() {
  if (fg.round >= FIND_ROUNDS) return reward('Kulakların çok iyi!', startFind, starsFor(fg.miss, 0, 2));
  const p = pool();
  const n = p.length >= 8 ? 4 : 3;
  fg.target = rand(p);
  const same = x => LETTERS[x].tr === LETTERS[fg.target].tr;
  let others = sample(p.filter(x => !same(x)), n - 1);
  if (others.length < n - 1) others = others.concat(sample(LETTERS.map((_, k) => k).filter(x => !same(x) && !others.includes(x)), n - 1 - others.length));
  const opts = shuffle([fg.target, ...others]);
  $('fOpts').innerHTML = '';
  opts.forEach((i, k) => {
    const b = document.createElement('button');
    b.className = 'opt'; b.textContent = LETTERS[i].c;
    b.style.setProperty('--c', colorOf(k * 2 + 1));
    b.setAttribute('aria-label', 'Seçenek ' + (k + 1));
    b.onclick = () => pickFind(b, i);
    $('fOpts').appendChild(b);
  });
  renderDots($('fDots'), FIND_ROUNDS, fg.round);
  fg.locked = false; fg.missThis = false;
  promptFind();
}
async function promptFind() { hush(); await speak(nameFirst('Bul bakalım!', 0.5), 'tr'); if (current === 'find') sayLetter(fg.target); }
$('fSpeak').onclick = () => { hush(); sayLetter(fg.target); };
function pickFind(btn, i) {
  if (fg.locked) return;
  if (i === fg.target) {
    fg.locked = true;
    btn.classList.add('right'); sfx.ok(); confetti(25); praise();
    if (!fg.missThis) scoreUp(i);   // "biliyor" puanı yalnızca ilk denemede doğru bilinince

    fg.round++; renderDots($('fDots'), FIND_ROUNDS, fg.round);
    setTimeout(() => { if (current === 'find') nextFind(); }, 1500);
  } else {
    replayAnim(btn, 'wrong'); sfx.no();
    fg.miss++; fg.missThis = true;
    hush(); setTimeout(() => sayLetter(fg.target), 350);
  }
}

// ---------- 3) Harf Çiz ----------
const PENS = ['#fa5252', '#fd7e14', '#fcc419', '#40c057', '#15aabf', '#228be6', '#7950f2', '#e64980', '#8d5524', 'rainbow'];
const PEN_NAMES = { '#fa5252': 'Kırmızı', '#fd7e14': 'Turuncu', '#fcc419': 'Sarı', '#40c057': 'Yeşil', '#15aabf': 'Turkuaz', '#228be6': 'Mavi', '#7950f2': 'Mor', '#e64980': 'Pembe', '#8d5524': 'Kahverengi', rainbow: 'Gökkuşağı' };
function penColor() {
  const p = S.settings.pen || 'rainbow';
  if (p !== 'rainbow') return p;
  tg.hue = (tg.hue + 4) % 360;                      // çizdikçe renk değişir
  return `hsl(${tg.hue}, 85%, 55%)`;
}
function renderPens() {
  const box = $('tPens'); box.innerHTML = '';
  PENS.forEach(p => {
    const b = document.createElement('button');
    b.className = 'pen' + ((S.settings.pen || 'rainbow') === p ? ' on' : '') + (p === 'rainbow' ? ' rainbow' : '');
    if (p !== 'rainbow') b.style.background = p;
    b.setAttribute('aria-label', PEN_NAMES[p] + ' kalem');
    b.onclick = () => { S.settings.pen = p; save(); sfx.flip(); renderPens(); };
    box.appendChild(b);
  });
}
const tg = { idx: 0, drawing: false, last: null, done: false, size: 0, brush: 0, hue: 0, round: 0, miss: 0, hinted: false, drew: false };
const guide = $('tGuide'), draw = $('tDraw');
const gctx = guide.getContext('2d'), dctx = draw.getContext('2d');
// Taşma görünmesin: çizim önce gizli bir tuvale yapılır, ekrana yalnızca harfin içinde kalan kısmı basılır.
const rawC = document.createElement('canvas'), rctx = rawC.getContext('2d');
const maskC = document.createElement('canvas'), mctx = maskC.getContext('2d');
function paintVisible() {
  dctx.save();
  dctx.setTransform(1, 0, 0, 1, 0, 0);
  dctx.globalCompositeOperation = 'copy';
  dctx.drawImage(rawC, 0, 0);
  dctx.globalCompositeOperation = 'destination-in';
  dctx.drawImage(maskC, 0, 0);
  dctx.restore();
}
function clearInk() { rctx.clearRect(0, 0, tg.size, tg.size); dctx.clearRect(0, 0, tg.size, tg.size); }

const TRACE_ROUNDS = 3;
function startTrace(i) {
  show('trace');
  tg.round = 0; tg.miss = 0; tg.hinted = false;
  renderDots($('tDots'), TRACE_ROUNDS, 0);
  if (i === undefined) { const p = pool(); i = p.includes(tg.idx) ? tg.idx : p[0]; }
  tg.idx = i;
  setupTrace();
}
async function setupTrace() {
  renderPens();
  const L = LETTERS[tg.idx];
  $('tName').textContent = L.tr;
  $('tName').style.color = colorOf(tg.idx);
  $('tBox').classList.remove('done');
  tg.done = false;
  try { await document.fonts.load('700 100px "Noto Naskh Arabic"'); } catch (e) { /* yedek font */ }
  const box = $('tBox').getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  tg.size = box.width;
  [guide, draw, rawC, maskC].forEach(c => { c.width = box.width * dpr; c.height = box.height * dpr; c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); });
  tg.brush = Math.max(22, tg.size * 0.09);
  drawGuide(gctx, tg.size, L.c, true);
  drawGuide(mctx, tg.size, L.c, false, 4);     // boyanabilir alan: harfin kendisi (kenarı biraz yumuşak)
  clearInk();
  tg.drew = false;
  hush(); sayLetter(tg.idx);
}
/** Harfi kutunun ortasına, kutunun ~%70'ini dolduracak şekilde yerleştirir. */
function layoutLetter(ctx, size, ch) {
  const base = size * 0.6;
  ctx.font = `700 ${base}px "Noto Naskh Arabic", "Amiri", serif`;
  ctx.direction = 'rtl'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText(ch);
  const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
  const left = m.actualBoundingBoxLeft, right = m.actualBoundingBoxRight;
  const w = Math.max(1, left + right), h = Math.max(1, asc + desc);
  const k = Math.min((size * 0.7) / h, (size * 0.7) / w, 2.2);
  return {
    font: `700 ${base * k}px "Noto Naskh Arabic", "Amiri", serif`,
    x: size / 2 + ((left - right) / 2) * k,
    y: size / 2 + ((asc - desc) / 2) * k,
  };
}
function drawGuide(ctx, size, ch, pretty, extra = 0) {
  ctx.clearRect(0, 0, size, size);
  const L = layoutLetter(ctx, size, ch);
  ctx.font = L.font; ctx.direction = 'rtl'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (pretty) {
    ctx.fillStyle = '#f1ecff'; ctx.fillText(ch, L.x, L.y);
    ctx.setLineDash([6, 8]); ctx.lineWidth = 3; ctx.strokeStyle = '#b197fc'; ctx.strokeText(ch, L.x, L.y); ctx.setLineDash([]);
  } else {
    ctx.fillStyle = ctx.strokeStyle = '#000';
    if (extra) { ctx.lineWidth = extra; ctx.lineJoin = 'round'; ctx.strokeText(ch, L.x, L.y); }
    ctx.fillText(ch, L.x, L.y);
  }
}
function pos(e) { const r = draw.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
draw.addEventListener('pointerdown', e => {
  if (tg.done) return;
  draw.setPointerCapture(e.pointerId);
  tg.drawing = true; tg.drew = true; tg.last = pos(e);
  dot(tg.last);
});
draw.addEventListener('pointermove', e => {
  if (!tg.drawing) return;
  const p = pos(e);
  rctx.strokeStyle = penColor(); rctx.lineWidth = tg.brush; rctx.lineCap = 'round'; rctx.lineJoin = 'round';
  rctx.globalAlpha = 0.8;
  rctx.beginPath(); rctx.moveTo(tg.last.x, tg.last.y); rctx.lineTo(p.x, p.y); rctx.stroke();
  rctx.globalAlpha = 1;
  tg.last = p;
  paintVisible();
});
const endStroke = () => { if (tg.drawing) { tg.drawing = false; checkTrace(); } };
draw.addEventListener('pointerup', endStroke);
draw.addEventListener('pointercancel', endStroke);
function dot(p) {
  rctx.fillStyle = penColor(); rctx.globalAlpha = 0.8;
  rctx.beginPath(); rctx.arc(p.x, p.y, tg.brush / 2, 0, Math.PI * 2); rctx.fill(); rctx.globalAlpha = 1;
  paintVisible();
}
/** Harfin parçalarını (gövde ve her nokta ayrı) bulur: küçük tuvalde bağlı bölgeler. */
function letterParts(mask, N) {
  const lab = new Int16Array(N * N), parts = [];
  for (let p = 0; p < N * N; p++) {
    if (lab[p] || mask[p * 4 + 3] <= 100) continue;
    const id = parts.length + 1, stack = [p], px = [];
    lab[p] = id;
    while (stack.length) {
      const q = stack.pop(); px.push(q);
      const x = q % N, y = (q / N) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, n = ny * N + nx;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || lab[n] || mask[n * 4 + 3] <= 100) continue;
        lab[n] = id; stack.push(n);
      }
    }
    if (px.length >= 3) parts.push(px);       // kenar kırıntılarını yok say
  }
  return parts;
}
/** Çizimi ölçer: harfin her parçası (noktalar dahil) yeterince boyanmış ve taşma az olmalı. */
function checkTrace() {
  const N = 120, scale = N / tg.size;
  const m = document.createElement('canvas'); m.width = m.height = N;
  const mc = m.getContext('2d');
  mc.scale(scale, scale);
  drawGuide(mc, tg.size, LETTERS[tg.idx].c, false);
  const mask = mc.getImageData(0, 0, N, N).data;
  // biraz kalınlaştırılmış harf: "harfin yakınında" sayılan alan
  mc.setTransform(1, 0, 0, 1, 0, 0); mc.clearRect(0, 0, N, N); mc.scale(scale, scale);
  drawGuide(mc, tg.size, LETTERS[tg.idx].c, false, tg.brush * 1.6);
  const near = mc.getImageData(0, 0, N, N).data;
  mc.setTransform(1, 0, 0, 1, 0, 0); mc.clearRect(0, 0, N, N);
  mc.drawImage(rawC, 0, 0, N, N);
  const ink = mc.getImageData(0, 0, N, N).data;
  // Taşma artık sorun değil; yalnızca bütün kutuyu karalamak kabul edilmez.
  let emptyPx = 0, outside = 0;
  for (let k = 3; k < ink.length; k += 4) if (near[k] < 60) { emptyPx++; if (ink[k] > 60) outside++; }
  const scribble = emptyPx ? outside / emptyPx : 0;
  const parts = letterParts(mask, N).sort((a, b) => b.length - a.length);
  const cover = px => px.filter(p => ink[p * 4 + 3] > 60).length / px.length;
  const body = parts.length ? cover(parts[0]) : 0;
  const smallOk = parts.slice(1).every(px => cover(px) >= 0.5);   // noktalar ve küçük işaretler
  if (body > 0.6 && smallOk && scribble < 0.5) return traceSuccess();
  if (body > 0.6 && !smallOk && scribble < 0.5 && !tg.hinted) {        // gövde bitti, nokta eksik
    tg.hinted = true; hush(); speak(nameFirst('Noktaları da unutma!', 0.5), 'tr');
  }
}
function traceSuccess() {
  tg.done = true;
  $('tBox').classList.add('done');
  sfx.ok(); confetti(40); praise();
  scoreUp(tg.idx);
  tg.round++; renderDots($('tDots'), TRACE_ROUNDS, tg.round);
  setTimeout(() => {
    if (current !== 'trace' || !tg.done) return;
    if (tg.round >= TRACE_ROUNDS) reward('Harika çizdin!', () => startTrace(), starsFor(tg.miss, 0, 2));
    else nextTrace();
  }, 2000);
}
function nextTrace() {
  tg.hinted = false;
  const p = pool();
  const k = p.indexOf(tg.idx);
  tg.idx = p[(k + 1) % p.length];
  setupTrace();
}
$('tClear').onclick = () => { if (tg.done) return; clearInk(); if (tg.drew) tg.miss++; tg.drew = false; tg.hinted = false; };
$('tNext').onclick = nextTrace;
$('tSpeak').onclick = () => { hush(); sayLetter(tg.idx); };
window.addEventListener('resize', () => { if (current === 'trace') setupTrace(); });

// ---------- 4) Balon Patlat ----------
const BALLOON_GOAL = 5;
const bg = { target: 0, hits: 0, raf: 0, spawnT: 0, last: 0, items: [] };
function startBalloon() {
  show('balloon');
  bg.target = rand(pool()); bg.hits = 0; bg.miss = 0; bg.items = []; bg.last = 0; bg.spawnT = 0;
  $('sky').innerHTML = '';
  $('bTarget').textContent = LETTERS[bg.target].c;
  $('bTarget').style.color = $('bTarget').style.borderColor = colorOf(bg.target);
  renderDots($('bDots'), BALLOON_GOAL, 0);
  (async () => { hush(); await speak(nameFirst('Bu harfi patlat!', 0.5), 'tr'); if (current === 'balloon') sayLetter(bg.target); })();
  bg.raf = requestAnimationFrame(balloonLoop);
}
function stopBalloon() { cancelAnimationFrame(bg.raf); bg.raf = 0; }
function spawnBalloon() {
  const sky = $('sky'), W = sky.clientWidth, H = sky.clientHeight;
  const p = pool();
  const isTarget = Math.random() < 0.45 || p.length < 2;
  const i = isTarget ? bg.target : rand(p.filter(x => x !== bg.target));
  const el = document.createElement('button');
  el.className = 'balloon';
  el.style.setProperty('--c', rand(COLORS));
  el.innerHTML = `<span class="body">${LETTERS[i].c}</span><span class="string"></span>`;
  el.setAttribute('aria-label', 'Balon');
  const b = { el, i, x: Math.random() * Math.max(0, W - 96), y: H + 10, v: 45 + Math.random() * 35, sway: Math.random() * 6.28, dead: false };
  el.addEventListener('pointerdown', e => { e.preventDefault(); tapBalloon(b); });
  sky.appendChild(el);
  bg.items.push(b);
}
function balloonLoop(t) {
  if (!bg.last) bg.last = t;
  const dt = Math.min(0.05, (t - bg.last) / 1000); bg.last = t;
  bg.spawnT -= dt;
  if (bg.spawnT <= 0) { spawnBalloon(); bg.spawnT = 1.1 + Math.random() * 0.6; }
  bg.items.forEach(b => {
    if (b.dead) return;
    b.y -= b.v * dt; b.sway += dt * 1.6;
    b.el.style.transform = `translate(${b.x + Math.sin(b.sway) * 12}px, ${b.y}px)`;
    if (b.y < -130) { b.dead = true; b.el.remove(); }
  });
  bg.items = bg.items.filter(b => !b.dead);
  bg.raf = requestAnimationFrame(balloonLoop);
}
function tapBalloon(b) {
  if (b.dead) return;
  if (b.i === bg.target) {
    b.dead = true; b.el.classList.add('popped'); sfx.pop(); setTimeout(() => sfx.ok(), 80);
    setTimeout(() => b.el.remove(), 320);
    bg.hits++; scoreUp(b.i);
    renderDots($('bDots'), BALLOON_GOAL, bg.hits);
    if (bg.hits >= BALLOON_GOAL) { stopBalloon(); setTimeout(() => reward('Balon ustası!', startBalloon, starsFor(bg.miss, 0, 2)), 500); }
    else { hush(); sayLetter(b.i); }
  } else {
    replayAnim(b.el, 'nope'); sfx.no(); bg.miss++;
  }
}
$('bTarget').onclick = () => { hush(); sayLetter(bg.target); };

// ---------- 5) Hafıza Kartları ----------
const mg = { open: [], matched: 0, pairs: 3, locked: false };
function startMemory() {
  show('memory');
  const p = pool();
  mg.pairs = p.length >= 8 ? 4 : 3;
  mg.open = []; mg.matched = 0; mg.locked = false; mg.miss = 0;
  const chosen = sample(p, mg.pairs);
  const deck = shuffle([...chosen, ...chosen]);
  const grid = $('mGrid');
  grid.className = 'cards' + (mg.pairs === 4 ? ' four' : '');
  grid.innerHTML = '';
  deck.forEach(i => {
    const c = document.createElement('button');
    c.className = 'mcard';
    c.dataset.i = i;
    c.setAttribute('aria-label', 'Kart');
    c.innerHTML = `<div class="in"><div class="face back">⭐</div><div class="face front" style="--c:${colorOf(i)}">${LETTERS[i].c}</div></div>`;
    c.onclick = () => flipCard(c);
    grid.appendChild(c);
  });
  speak(nameFirst('Aynı harfleri bul!', 0.6), 'tr');
}
function flipCard(c) {
  if (mg.locked || c.classList.contains('open') || c.classList.contains('match')) return;
  c.classList.add('open'); sfx.flip();
  const i = +c.dataset.i;
  hush(); sayLetter(i);
  mg.open.push(c);
  if (mg.open.length < 2) return;
  mg.locked = true;
  const [a, b] = mg.open;
  setTimeout(() => {
    if (a.dataset.i === b.dataset.i) {
      a.classList.replace('open', 'match'); b.classList.replace('open', 'match');
      sfx.ok(); confetti(20); scoreUp(i);
      mg.matched++;
      if (mg.matched === mg.pairs) setTimeout(() => reward('Hafızan çok güçlü!', startMemory, starsFor(mg.miss, mg.pairs, mg.pairs * 2)), 600);
      else praise();
    } else {
      a.classList.remove('open'); b.classList.remove('open'); sfx.no(); mg.miss++;
    }
    mg.open = []; mg.locked = false;
  }, 900);
}

// ---------- 7) Elif-Ba Tablosu: dokun, dinle ----------
function openTable() {
  show('table');
  const g = $('abcGrid');
  if (g.childElementCount) return;
  LETTERS.forEach((L, i) => {
    const b = document.createElement('button');
    b.className = 'abc-cell';
    b.style.setProperty('--c', colorOf(i));
    b.innerHTML = `<span class="ch">${L.cf}</span><span class="nm">${L.tr}</span>`;
    b.setAttribute('aria-label', L.name + ' harfini dinle');
    b.onclick = () => {
      g.querySelectorAll('.playing').forEach(x => x.classList.remove('playing'));
      replayAnim(b, 'playing');
      hush(); sayLetter(i);
      if (!S.seen.includes(i)) markSeen(i);
      clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('playing'), 1400);
    };
    g.appendChild(b);
  });
}

// ---------- 8) Yıldız Dükkanı: yıldızları harca, dünyanı süsle ----------
// Bahçe: düşük poligonlu 3B hayvanlar ve süsler (bahce3d.js). e: dükkân kartındaki simge
const SHOP = [
  { id: 'cloud', e: '☁️', p: 2, ad: 'Bulut' }, { id: 'chick', e: '🐥', p: 2, ad: 'Civciv' },
  { id: 'bug', e: '🐞', p: 2, ad: 'Uğur böceği' }, { id: 'flower', e: '🌸', p: 3, ad: 'Çiçek' },
  { id: 'butterfly', e: '🦋', p: 3, ad: 'Kelebek' }, { id: 'sunflower', e: '🌻', p: 3, ad: 'Ayçiçeği' },
  { id: 'balloon', e: '🎈', p: 4, ad: 'Balon' }, { id: 'turtle', e: '🐢', p: 4, ad: 'Kaplumbağa' },
  { id: 'duck', e: '🦆', p: 4, ad: 'Ördek' }, { id: 'bunny', e: '🐰', p: 5, ad: 'Tavşan' },
  { id: 'cat', e: '🐱', p: 5, ad: 'Kedi' }, { id: 'bird', e: '🐦', p: 5, ad: 'Kuş' },
  { id: 'tree', e: '🌳', p: 6, ad: 'Ağaç' }, { id: 'sheep', e: '🐑', p: 6, ad: 'Kuzu' },
  { id: 'camel', e: '🐪', p: 8, ad: 'Deve' }, { id: 'rainbow', e: '🌈', p: 8, ad: 'Gökkuşağı' },
  { id: 'house', e: '🏡', p: 10, ad: 'Ev' }, { id: 'mosque', e: '🕌', p: 12, ad: 'Cami' },
];
// Eski çıkartmaları (emoji) yeni bahçe öğelerine çevir
const OLD_STICKERS = { '☁️': 'cloud', '🐥': 'chick', '🐞': 'bug', '🌸': 'flower', '🍎': 'flower', '🍓': 'flower', '🦋': 'butterfly',
  '🎈': 'balloon', '🐢': 'turtle', '🐟': 'duck', '🐰': 'bunny', '🐱': 'cat', '🌻': 'sunflower', '🌳': 'tree', '🐑': 'sheep',
  '🌙': 'bird', '🐪': 'camel', '🌈': 'rainbow', '🏡': 'house', '🕌': 'mosque' };
S.scene = (S.scene || []).map(st => (st.t ? st : { t: OLD_STICKERS[st.e] || 'flower', x: st.x, y: st.y }));
const HATS = [
  { id: 'bow', e: '🎀', p: 5 }, { id: 'daisy', e: '🌼', p: 6 }, { id: 'cap', e: '🧢', p: 8 },
  { id: 'tophat', e: '🎩', p: 10 }, { id: 'crown', e: '👑', p: 15 },
];
const SCENE_MAX = 30;
let shopTab = 'sticker';

function renderHat() {
  const h = HATS.find(x => x.id === S.hat);
  $('hat').textContent = h ? h.e : '';
}
function openShop() { show('shop'); renderWorld(); renderShop(); }
let world3d = null;   // null: henüz denenmedi, true/false: 3B çalışıyor mu
function renderWorld(newIdx) {
  const w = $('world');
  $('worldEmpty').hidden = S.scene.length > 0;
  if (world3d === null) {
    world3d = !!(window.Garden3D && Garden3D.mount(w, {
      onTap: (k, t) => { sfx.pop(); setTimeout(() => sfx.ok(), 90); },
      onMove: (k, x, y) => { if (S.scene[k]) { S.scene[k].x = x; S.scene[k].y = y; save(); } },
    }));
    w.classList.toggle('is3d', world3d);
  }
  if (world3d) { Garden3D.setScene(S.scene, newIdx); Garden3D.start(); return; }
  // 3B desteklenmiyorsa (eski cihaz / internet yok): emoji çıkartmalar
  w.querySelectorAll('.sticker').forEach(el => el.remove());
  S.scene.forEach((st, k) => {
    const el = document.createElement('button');
    el.className = 'sticker' + (k === newIdx ? ' new' : '');
    el.textContent = (SHOP.find(it => it.id === st.t) || SHOP[0]).e;
    el.style.left = st.x + '%'; el.style.top = st.y + '%';
    el.setAttribute('aria-label', 'Çıkartma');
    dragSticker(el, k);
    w.appendChild(el);
  });
}
function dragSticker(el, k) {
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId); el.classList.add('drag'); sfx.flip();
    const move = ev => {
      const r = $('world').getBoundingClientRect();
      const x = Math.min(96, Math.max(4, (ev.clientX - r.left) / r.width * 100));
      const y = Math.min(92, Math.max(8, (ev.clientY - r.top) / r.height * 100));
      S.scene[k].x = Math.round(x * 10) / 10; S.scene[k].y = Math.round(y * 10) / 10;
      el.style.left = x + '%'; el.style.top = y + '%';
    };
    const up = () => {
      el.classList.remove('drag'); save();
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });
}
function renderShop() {
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('on', t.dataset.tab === shopTab));
  const g = $('shopGrid'); g.innerHTML = '';
  if (shopTab === 'hat') {
    const prev = document.createElement('div');
    prev.className = 'hat-preview'; prev.style.gridColumn = '1 / -1';
    prev.innerHTML = $('mascot').innerHTML.replace('id="hat"', '');
    g.appendChild(prev);
  }
  (shopTab === 'hat' ? HATS : SHOP).forEach(it => {
    const owned = shopTab === 'hat' && S.owned.includes(it.id);
    const worn = owned && S.hat === it.id;
    const can = !owned && S.stars >= it.p;
    const b = document.createElement('button');
    b.className = 'item ' + (owned ? 'owned' : can ? 'can' : 'cant') + (worn ? ' worn' : '');
    b.innerHTML = `<span class="ie">${it.e}</span>` + (owned
      ? `<span class="tag">${worn ? '✔ Takılı' : 'Tak'}</span>`
      : `<span class="price">⭐ ${it.p}</span><span class="bar"><i style="width:${Math.min(100, S.stars / it.p * 100)}%"></i></span>`);
    b.setAttribute('aria-label', owned ? (worn ? 'Çıkar' : 'Tak') : `${it.ad || ''} ${it.p} yıldız`);
    b.onclick = () => buy(it, b);
    g.appendChild(b);
  });
}
function buy(it, btn) {
  const isHat = shopTab === 'hat';
  if (isHat && S.owned.includes(it.id)) {          // sahip olunan süs: tak / çıkar (ücretsiz)
    S.hat = S.hat === it.id ? null : it.id; save();
    sfx.flip(); renderHat(); renderShop();
    if (S.hat) { hush(); speak("Hilal'e çok yakıştı!", 'tr'); }
    return;
  }
  if (S.stars < it.p) {
    replayAnim(btn, 'nope'); sfx.no();
    hush(); speak(nameFirst(`${it.p - S.stars} yıldız daha topla!`, 0.5), 'tr');
    return;
  }
  S.stars -= it.p; S.spent = (S.spent || 0) + it.p;
  let newIdx;
  if (isHat) {
    S.owned.push(it.id); S.hat = it.id; renderHat();
    hush(); speak(withName('Yaşasın!', 0.7) + " Hilal'e çok yakıştı!", 'tr');
  } else {
    if (S.scene.length >= SCENE_MAX) S.scene.shift();   // dünya dolduysa en eski çıkartma uçar
    S.scene.push({ t: it.id, x: 15 + Math.round(Math.random() * 70), y: 35 + Math.round(Math.random() * 50) });
    newIdx = S.scene.length - 1;
    hush(); speak(withName('Yaşasın!', 0.7) + ` ${it.ad} bahçene geldi!`, 'tr');
  }
  save();
  $('starNum').textContent = S.stars;
  sfx.win(); confetti(40);
  renderWorld(newIdx); renderShop();
}
document.querySelectorAll('.shop-tab').forEach(t => { t.onclick = () => { shopTab = t.dataset.tab; sfx.flip(); renderShop(); }; });
$('starCount').onclick = () => openShop();
$('starCount').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') openShop(); };

// ---------- 6) Harf Bahçem ----------
function openGarden() {
  show('garden');
  const g = $('gGrid'); g.innerHTML = '';
  LETTERS.forEach((L, i) => {
    const b = document.createElement('button');
    const seen = S.seen.includes(i), sc = S.score[i] || 0;
    b.className = 'gcell' + (seen ? '' : ' new');
    b.style.setProperty('--c', colorOf(i));
    b.innerHTML = L.c + (sc >= MASTERED ? '<span class="badge">🌸</span>' : seen ? '<span class="badge">🌱</span>' : '');
    b.setAttribute('aria-label', L.tr);
    b.onclick = () => openLearn(i);
    g.appendChild(b);
  });
}

// ---------- Harf Seslerim: ebeveyn kaydı ----------
const REC_MAX_MS = 6000;
let rec = null;           // { i, mr, stream, timer }
let recIdx = 0;           // dosya seçilirken hangi harf
let recLock = 0;
let micOk = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
try { if (document.featurePolicy && !document.featurePolicy.allowsFeature('microphone')) micOk = false; } catch (e) { /* yoksay */ }

function openRecord() { show('record'); renderRecList(); }
function renderRecList() {
  const n = Object.keys(recRaw).length;
  $('recCount').textContent = `${n} / 28 harf kaydedildi`;
  $('recMicNote').hidden = micOk;
  const list = $('recList'); list.innerHTML = '';
  LETTERS.forEach((L, i) => {
    const has = hasRec(i), busy = rec && rec.i === i;
    const row = document.createElement('div');
    row.className = 'rec-row' + (has ? ' has' : '') + (busy ? ' busy' : '');
    row.style.setProperty('--c', colorOf(i));
    row.innerHTML = `
      <span class="rec-ch">${L.cf}</span>
      <span class="rec-nm">${L.tr} <span class="rec-alt">${L.name}</span><small>${busy ? 'Kaydediliyor… bitince ⏹' : has ? '✔ Kayıtlı' : appClips[i] ? 'Hoca sesi' : 'Yapay ses'}</small></span>
      ${micOk ? `<button class="rec-btn mic" aria-label="${L.tr} harfini kaydet">${busy ? '⏹' : '🎙️'}</button>` : ''}
      <button class="rec-btn file" aria-label="${L.tr} için ses dosyası seç">📁</button>
      <button class="rec-btn play" aria-label="${L.tr} harfini dinle">▶</button>
      ${has ? `<button class="rec-btn del" aria-label="${L.tr} kaydını sil">🗑</button>` : ''}`;
    const q = sel => row.querySelector(sel);
    if (q('.mic')) q('.mic').onclick = () => {
      if (Date.now() < recLock) return;          // yanlışlıkla çift dokunmayı yok say
      recLock = Date.now() + 700;
      busy ? stopRec() : startRec(i);
    };
    q('.file').onclick = () => { recIdx = i; $('recFile').value = ''; $('recFile').click(); };
    q('.play').onclick = () => { hush(); sayLetter(i); };
    if (q('.del')) q('.del').onclick = () => deleteRec(i, q('.del'));
    list.appendChild(row);
  });
}
async function startRec(i) {
  if (rec) stopRec();
  hush();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (e) {
    micOk = false; renderRecList();
    return;
  }
  const chunks = [];
  const mr = new MediaRecorder(stream);
  mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  mr.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    rec = null;
    if (chunks.length) await saveRec(i, new Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
    renderRecList();
    hush(); sayLetter(i);
  };
  rec = { i, mr, stream, timer: setTimeout(stopRec, REC_MAX_MS) };
  sfx.flip();
  mr.start();
  renderRecList();
}
function stopRec() {
  if (!rec) return;
  clearTimeout(rec.timer);
  if (rec.mr.state !== 'inactive') rec.mr.stop();
}
async function saveRec(i, blob) {
  const buf = await blob.arrayBuffer(), type = blob.type || 'audio/mpeg';
  await loadRec(i, buf, type);
  try {
    await recStore.set(i, { buf, type });
    $('recWarn').hidden = true;
  } catch (e) {
    $('recWarn').hidden = false; // bu oturumda çalışır ama kalıcı saklanamadı
  }
}
function deleteRec(i, btn) {
  if (btn.dataset.armed) {
    dropRec(i);
    recStore.del(i).catch(() => {});
    renderRecList();
  } else {
    btn.dataset.armed = '1'; btn.textContent = 'Sil?'; btn.classList.add('armed');
    setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = '🗑'; btn.classList.remove('armed'); } }, 3000);
  }
}
$('recFile').onchange = async e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  if (f.size > 3 * 1024 * 1024) { $('recWarn').textContent = 'Bu dosya çok büyük. Lütfen birkaç saniyelik kısa bir kayıt seçin.'; $('recWarn').hidden = false; return; }
  await saveRec(recIdx, f);
  renderRecList();
  hush(); sayLetter(recIdx);
};
$('recOpen').onclick = openRecord;

// ---------- Yedek al / yedekten yükle ----------
// Yedek dosyası: { app, version, created, recordings: { "0": { type, data(base64) }, ... } }
function bufToB64(buf) {
  const bytes = new Uint8Array(buf); let bin = '';
  for (let k = 0; k < bytes.length; k += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(k, k + 0x8000));
  return btoa(bin);
}
function b64ToBuf(b64) {
  const bin = atob(b64), out = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) out[k] = bin.charCodeAt(k);
  return out.buffer;
}
function recNote(text, ok) {
  const el = $('recInfo'); el.textContent = text; el.hidden = false;
  el.classList.toggle('ok', !!ok);
}
async function exportRecs() {
  const keys = Object.keys(recRaw);
  if (!keys.length) return recNote('Henüz kayıtlı harf yok. Önce birkaç harf kaydedin.');
  const recordings = {};
  for (const k of keys) {
    recordings[k] = { type: recRaw[k].type || 'audio/mpeg', data: bufToB64(recRaw[k].buf) };
  }
  const json = JSON.stringify({ app: 'kuran-ogreniyorum', version: 1, created: new Date().toISOString(), recordings });
  const filename = `kuran-ogreniyorum-sesler-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([json], { type: 'application/json' });
  // claude.ai sayfasında indirme izni üzerinden, kendi sitenizde normal indirme ile
  let dl = null;
  try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { dl = null; }
  if (dl) {
    try { await dl.save({ filename, data: blob }); recNote(`${keys.length} harfin yedeği kaydedildi: ${filename}`, true); }
    catch (e) { if (e && e.code !== 'declined') recNote('Yedek dosyası kaydedilemedi. Lütfen tekrar deneyin.'); }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  recNote(`${keys.length} harfin yedeği indirildi: ${filename}`, true);
}
$('recExport').onclick = exportRecs;
$('recImport').onclick = () => { $('recImportFile').value = ''; $('recImportFile').click(); };
$('recImportFile').onchange = async e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.app !== 'kuran-ogreniyorum' || !j.recordings) throw new Error('format');
    let n = 0;
    for (const [k, v] of Object.entries(j.recordings)) {
      const i = +k;
      if (!(i >= 0 && i < LETTERS.length) || !v.data) continue;
      await saveRec(i, new Blob([b64ToBuf(v.data)], { type: v.type || 'audio/mpeg' }));
      n++;
    }
    renderRecList();
    recNote(`${n} harfin sesi yedekten yüklendi.`, true);
  } catch (err) {
    recNote('Bu dosya bir Kur\'an Öğreniyorum ses yedeği değil.');
  }
};

// ---------- Ebeveyn alanı ----------
function openGate() {
  const a = 2 + Math.floor(Math.random() * 6), b = 2 + Math.floor(Math.random() * 6), ans = a + b;
  $('gateQ').textContent = `${a} + ${b} = ?`;
  const opts = shuffle([ans, ans + 1 + Math.floor(Math.random() * 3), ans - 1 - Math.floor(Math.random() * 3)]);
  $('gateOpts').innerHTML = '';
  opts.forEach(n => {
    const btn = document.createElement('button'); btn.textContent = n;
    btn.onclick = () => { $('gate').hidden = true; if (n === ans) openParent(); };
    $('gateOpts').appendChild(btn);
  });
  $('gate').hidden = false;
}
function audioDiag() {
  const n = Object.keys(appRaw).length, d = Object.keys(appBuf).length;
  const st = actx ? ({ running: 'açık', suspended: 'bekliyor (ekrana dokunun)', interrupted: 'kesildi' }[actx.state] || actx.state) : 'kapalı';
  $('audioDiag').textContent = `Hoca sesleri: ${n}/28 yüklendi, ${d}/28 hazır · Ses motoru: ${st}` + (lastPath ? ` · Son çalan: ${lastPath}` : '');
}
function openParent() {
  show('parent');
  audioDiag();
  const mastered = Object.values(S.score).filter(v => v >= MASTERED).length;
  $('pStats').innerHTML = `<div><b>${S.seen.length}/28</b>harf gördü</div><div><b>${mastered}/28</b>harfi biliyor</div><div><b>${S.stars + (S.spent || 0)}</b>yıldız kazandı</div>`;
  $('optSfx').checked = S.settings.sfx;
  $('optName').value = S.settings.childName || '';
  $('optVoice').value = S.settings.voice;
  $('optPool').value = S.settings.pool;
  $('optSpeed').value = S.settings.speed;
  $('voiceNote').textContent = hasArabic()
    ? 'Bu cihazda Arapça ses bulundu. Harfler Arapça okunur.'
    : 'Bu cihazda Arapça ses bulunamadı; harf isimleri Türkçe okunur. Cihaz ayarlarından (Metin okuma / Konuşma) Arapça ses paketi yükleyebilirsiniz.';
}
$('optSfx').onchange = e => { S.settings.sfx = e.target.checked; save(); };
$('optName').oninput = e => {
  const v = cleanName(e.target.value);
  if (v !== e.target.value) e.target.value = v;
  S.settings.childName = v.trim(); save(); greet();
};
$('soundTest').onclick = async () => { hush(); await sayLetter(1); audioDiag(); setTimeout(audioDiag, 400); };
$('nameTest').onclick = () => { hush(); speak(childName() ? `Aferin, ${childName()}! Maşallah, ${childName()}!` : 'Aferin! Maşallah!', 'tr'); };
$('optVoice').onchange = e => { S.settings.voice = e.target.value; save(); };
$('optPool').onchange = e => { S.settings.pool = e.target.value; save(); };
$('optSpeed').onchange = e => { S.settings.speed = e.target.value; save(); sayLetter(1); };
let resetArmed = false;
$('resetBtn').onclick = () => {
  const btn = $('resetBtn');
  if (!resetArmed) {
    resetArmed = true; btn.textContent = 'Emin misiniz? Silmek için tekrar dokunun';
    setTimeout(() => { resetArmed = false; btn.textContent = 'İlerlemeyi sıfırla'; }, 4000);
    return;
  }
  resetArmed = false; btn.textContent = 'İlerlemeyi sıfırla';
  const settings = S.settings;
  S = JSON.parse(JSON.stringify(DEFAULTS)); S.settings = settings; save();
  $('starNum').textContent = 0; renderHat(); openParent();
};
$('parentBtn').onclick = openGate;
$('gateClose').onclick = () => { $('gate').hidden = true; };

// ---------- Genel bağlantılar ----------
document.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => go(b.dataset.go); });
$('homeBtn').onclick = () => (current === 'record' ? openParent() : show('home'));
$('rHome').onclick = () => show('home');
$('rAgain').onclick = () => { $('reward').hidden = true; if (replay) replay(); };
$('mascot').onclick = () => {
  replayAnim($('bubble'), 'pop');
  const lines = [withName('Selam!') + ' Ben Hilal. Hadi harfleri öğrenelim!', nameFirst('Bugün yeni bir harf öğrenelim mi?', 0.6), nameFirst('Yıldız toplamaya hazır mısın?', 0.6)];
  const line = rand(lines);
  $('bubble').innerHTML = esc(line).replace('Hilal', '<b>Hilal</b>').replace('! ', '!<br>');
  hush(); speak(line, 'tr');
};
$('starNum').textContent = S.stars;

// Çevrimdışı çalışma
try {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => { try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* çerçeve içinde kapalı */ } });
  }
} catch (e) { /* yoksay */ }
$('appVersion').textContent = VERSION;
recStore.all().then(async all => {
  for (const [k, v] of Object.entries(all)) await loadRec(k, v.buf, v.type);
  if (current === 'record') renderRecList();
}).catch(() => {});
loadAppClips();
greet();
renderHat();

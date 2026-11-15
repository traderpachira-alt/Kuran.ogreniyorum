'use strict';

/* =========================================================
   Sureler: İhlâs, Kevser, Fil — sesli okuma ve eş zamanlı vurgulama
   Ses: hocanın kaydı (sure/NNN.mp3) ve kelime zamanlaması (sure/sureler.json),
   tek dosyalık sürümde window.KURAN_SURE içine gömülü.
   app.js'teki yardımcıları kullanır ($, show, sfx, reward, getCtx, IS_IOS …).
   ========================================================= */

const SURE_SIRA = ['112', '108', '105'];   // çocuklar için kısa olandan uzuna
const SM = window.SURE_METIN || {};
const sureSes = {};      // no -> { raw: ArrayBuffer, buf: AudioBuffer|null, timing }
let sureManifest = null;

const arDigits = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

async function loadSureAudio() {
  try {
    const emb = window.KURAN_SURE;
    if (emb) {
      sureManifest = {};
      for (const [no, v] of Object.entries(emb)) {
        sureManifest[no] = v.timing;
        sureSes[no] = { raw: b64ToBuf(v.b64), buf: null, timing: v.timing };
      }
    } else {
      const r = await fetch('sure/sureler.json');
      if (!r.ok) { sureManifest = {}; return; }
      sureManifest = await r.json();
      await Promise.all(Object.entries(sureManifest).map(async ([no, t]) => {
        const raw = await (await fetch('sure/' + t.dosya)).arrayBuffer();
        sureSes[no] = { raw, buf: null, timing: t };
      }));
    }
    for (const s of Object.values(sureSes)) { try { s.buf = await decodeAudio(s.raw); } catch (e) { /* <audio> yolu */ } }
  } catch (e) { sureManifest = sureManifest || {}; }
  if (current === 'sureler') renderSureList();
  if (current === 'sure') renderSureControls();
}

// ---------- Oynatıcı: Web Audio ya da <audio>; konum her an okunabilir ----------
const SP = { mode: null, src: null, el: null, t0: 0, offset: 0, playing: false, no: null };
function spPosition() {
  if (!SP.playing) return SP.offset;
  if (SP.mode === 'media') return SP.el ? SP.el.currentTime : SP.offset;
  return getCtx().currentTime - SP.t0;
}
function spStopInternal() {
  if (SP.src) { try { SP.src.onended = null; SP.src.stop(); } catch (e) { /* yoksay */ } SP.src = null; }
  if (SP.el) { SP.el.pause(); }
}
function spPause() { if (!SP.playing) return; SP.offset = spPosition(); spStopInternal(); SP.playing = false; }
function spPlayWebAudio(s, from) {
  const c = getCtx();
  if (c.state !== 'running') c.resume().catch(() => {});
  const src = c.createBufferSource();
  src.buffer = s.buf; src.connect(c.destination);
  src.start(0, Math.max(0, from));
  SP.src = src; SP.mode = 'webaudio'; SP.t0 = c.currentTime - from; SP.playing = true;
}
function spPlay(no, from) {
  const s = sureSes[no];
  if (!s) return;
  hush(); spStopInternal();
  SP.no = no; SP.offset = from;
  const useMedia = IS_IOS || !s.buf;     // iPhone'da sessiz modda da çalsın; çözülemeyen biçimde de
  if (!useMedia) return spPlayWebAudio(s, from);
  if (!SP.el || SP.el._no !== no) {
    SP.el = new Audio(URL.createObjectURL(new Blob([s.raw], { type: 'audio/mpeg' })));
    SP.el._no = no;
  }
  const el = SP.el;
  SP.mode = 'media'; SP.playing = true;
  try { el.currentTime = from; } catch (e) { /* yoksay */ }
  let started = false;
  el.onplaying = () => { started = true; };
  const p = el.play();
  const fallback = () => { if (started || SP.el !== el || SP.mode !== 'media') return; el.pause(); if (s.buf) spPlayWebAudio(s, from); else SP.playing = false; };
  if (p && p.catch) p.catch(fallback);
  setTimeout(fallback, 1500);
}

// ---------- Liste ----------
function openSureler() { show('sureler'); renderSureList(); }
function renderSureList() {
  const g = $('sureList'); g.innerHTML = '';
  const today = new Date().toISOString().slice(0, 10);
  SURE_SIRA.forEach((no, k) => {
    const s = SM[no]; if (!s) return;
    const done = (S.sureDone || {})[no];
    const b = document.createElement('button');
    b.className = 'sure-card';
    b.style.setProperty('--c', ['#7950f2', '#1c7ed6', '#e8590c'][k % 3]);
    b.innerHTML = `<span class="sc-ar">${s.arapca}</span><span class="sc-tr">${s.ad} Suresi</span>
      <span class="sc-info">${s.ayetler.length} ayet${done === today ? ' · ⭐ bugün tamam' : done ? ' · ✔ okundu' : ''}</span>
      ${sureSes[no] ? '' : '<span class="sc-wait">Ses bekleniyor</span>'}`;
    b.onclick = () => openSure(no);
    g.appendChild(b);
  });
}

// ---------- Okuma ekranı ----------
const SR = { no: null, lines: [], timing: null, raf: 0, line: -1, mode: 'surekli', stopAt: null, waitUntil: 0, nextFrom: null, cache: [] };

function openSure(no) {
  show('sure');
  SR.no = no; SR.line = -1; SR.stopAt = null; SR.waitUntil = 0; SR.nextFrom = null;
  const s = SM[no];
  $('title').textContent = `${s.ad} Suresi`;
  const t = sureSes[no] && sureSes[no].timing;
  SR.timing = t || null;
  const withBesmele = !t || t.besmele;
  SR.lines = (withBesmele ? [{ text: SM.besmele, ok: SM.besmeleOkunus, besmele: true }] : [])
    .concat(s.ayetler.map((a, k) => ({ text: a, ok: s.okunus[k], n: k + 1 })));
  const box = $('sureText'); box.innerHTML = '';
  SR.cache = [];
  SR.lines.forEach((ln, li) => {
    const div = document.createElement('div');
    div.className = 'ayah' + (ln.besmele ? ' besmele' : '');
    const ar = document.createElement('p'); ar.className = 'ayah-ar'; ar.lang = 'ar'; ar.dir = 'rtl';
    const spans = ln.text.split(' ').map((w, wi) => {
      const sp = document.createElement('span'); sp.className = 'qw'; sp.textContent = w;
      sp.onclick = e => { e.stopPropagation(); playWord(li, wi); };
      ar.appendChild(sp); ar.appendChild(document.createTextNode(' '));
      return sp;
    });
    if (ln.n) { const end = document.createElement('span'); end.className = 'aend'; end.textContent = '۝' + arDigits(ln.n); ar.appendChild(end); }
    const ok = document.createElement('p'); ok.className = 'ayah-ok'; ok.textContent = ln.ok;
    div.append(ar, ok);
    div.onclick = () => playLine(li);
    box.appendChild(div);
    SR.cache.push({ div, spans });
  });
  $('sureOkunus').checked = S.settings.okunus !== false;
  box.classList.toggle('no-ok', S.settings.okunus === false);
  renderSureControls();
  paintSure(0, true);
}
function renderSureControls() {
  if (current !== 'sure') return;
  const has = !!sureSes[SR.no];
  $('sureNoAudio').hidden = has;
  ['surePlay', 'sureRestart'].forEach(id => { $(id).disabled = !has; });
  $('surePlay').textContent = SP.playing && SP.no === SR.no ? '⏸' : '▶';
  $('sureMode').classList.toggle('on', SR.mode === 'birlikte');
}
function segOf(li) { return SR.timing && SR.timing.satirlar[li]; }

/** Ekranı verilen zamana göre boyar: okunan kelimeler belirgin, okunmakta olan soldan sağa (sağdan sola) dolar. */
function paintSure(t, force) {
  if (!SR.timing) return;
  let cur = -1;
  SR.timing.satirlar.forEach((seg, li) => { if (t >= seg.s - 0.05 && t <= seg.e + 0.6) cur = li; });
  if (cur === -1) SR.timing.satirlar.forEach((seg, li) => { if (t > seg.e) cur = li; });
  SR.cache.forEach(({ div, spans }, li) => {
    const seg = segOf(li);
    if (!seg) return;
    if (!force && Math.abs(li - cur) > 1 && !div.classList.contains('active') && li !== SR._lastPainted) return;
    div.classList.toggle('active', li === cur && t >= seg.s - 0.05);
    spans.forEach((sp, wi) => {
      const [ws, we] = seg.w[wi] || [seg.s, seg.e];
      const state = t >= we ? 'done' : t >= ws ? 'now' : '';
      if (sp._st !== state) { sp.className = 'qw' + (state ? ' ' + state : ''); sp._st = state; }
      if (state === 'now') sp.style.setProperty('--p', Math.round((t - ws) / (we - ws) * 100) + '%');
    });
  });
  if (cur !== SR.line && cur >= 0) {
    SR.line = cur;
    const d = SR.cache[cur].div;
    const r = d.getBoundingClientRect(), box = $('sure').getBoundingClientRect();
    if (r.top < box.top + 60 || r.bottom > box.bottom - 120) d.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  SR._lastPainted = cur;
}
function sureLoop() {
  if (current !== 'sure') { SR.raf = 0; return; }
  const now = performance.now();
  if (SR.waitUntil) {                                  // "şimdi sen oku" arası
    if (now >= SR.waitUntil) {
      SR.waitUntil = 0; $('sureYourTurn').hidden = true;
      if (SR.nextFrom !== null) { spPlay(SR.no, SR.nextFrom); SR.nextFrom = null; }
    }
  } else if (SP.playing) {
    const t = spPosition();
    paintSure(t);
    const segs = SR.timing.satirlar;
    if (SR.stopAt !== null && t >= SR.stopAt) {        // tek satır / tek kelime dinleme bitti
      spPause(); SR.stopAt = null; renderSureControls();
    } else if (SR.mode === 'birlikte' && SR.stopAt === null) {
      const li = segs.findIndex(sg => t >= sg.e && t < sg.e + 0.4);
      if (li >= 0 && li !== SR._waitedFor) {
        SR._waitedFor = li;
        spPause();
        if (li + 1 < segs.length) {
          SR.nextFrom = segs[li + 1].s - 0.05;
          SR.waitUntil = now + ((segs[li].e - segs[li].s) * 1000 + 1200);
          $('sureYourTurn').hidden = false;
        } else sureFinished();
      }
    }
    if (SP.playing && t >= segs[segs.length - 1].e + 0.3 && SR.stopAt === null) { spPause(); sureFinished(); }
  }
  renderSureControls();
  SR.raf = requestAnimationFrame(sureLoop);
}
function startLoop() { if (!SR.raf) SR.raf = requestAnimationFrame(sureLoop); }
function sureFinished() {
  SP.offset = 0; SR._waitedFor = -1;
  paintSure(1e9, true);
  const today = new Date().toISOString().slice(0, 10);
  S.sureDone = S.sureDone || {};
  if (S.sureDone[SR.no] !== today) {                 // her sure günde bir kez yıldız verir
    S.sureDone[SR.no] = today; save();
    reward(`${SM[SR.no].ad} Suresi tamam!`, () => { $('reward').hidden = true; sureRestart(); }, 3);
  } else {
    S.sureDone[SR.no] = today; save();
    sfx.win(); confetti(40); praise();
  }
}
function sureToggle() {
  if (!sureSes[SR.no]) return;
  if (SR.waitUntil) { SR.waitUntil = 0; SR.nextFrom = null; $('sureYourTurn').hidden = true; renderSureControls(); return; }
  if (SP.playing && SP.no === SR.no) { spPause(); renderSureControls(); return; }
  SR.stopAt = null;
  const end = SR.timing.satirlar[SR.timing.satirlar.length - 1].e;
  const from = SP.no === SR.no && SP.offset < end ? SP.offset : 0;
  if (from === 0) { paintSure(0, true); SR._waitedFor = -1; }
  spPlay(SR.no, from); startLoop(); renderSureControls();
}
function sureRestart() {
  if (!sureSes[SR.no]) return;
  SR.waitUntil = 0; SR.nextFrom = null; SR.stopAt = null; SR._waitedFor = -1; $('sureYourTurn').hidden = true;
  paintSure(0, true); spPlay(SR.no, 0); startLoop();
}
function playLine(li) {
  const seg = segOf(li); if (!seg || !sureSes[SR.no]) return;
  SR.waitUntil = 0; $('sureYourTurn').hidden = true;
  SR.stopAt = seg.e + 0.15; paintSure(seg.s - 0.01, true);
  spPlay(SR.no, Math.max(0, seg.s - 0.05)); startLoop();
}
function playWord(li, wi) {
  const seg = segOf(li); if (!seg || !sureSes[SR.no]) return;
  const [ws, we] = seg.w[wi];
  SR.waitUntil = 0; $('sureYourTurn').hidden = true;
  SR.stopAt = we + 0.08;
  spPlay(SR.no, Math.max(0, ws - 0.05)); startLoop();
}
function stopSure() { spPause(); SR.waitUntil = 0; SR.nextFrom = null; const y = $('sureYourTurn'); if (y) y.hidden = true; }

$('surePlay').onclick = sureToggle;
$('sureRestart').onclick = sureRestart;
$('sureMode').onclick = () => { SR.mode = SR.mode === 'birlikte' ? 'surekli' : 'birlikte'; SR._waitedFor = -1; sfx.flip(); renderSureControls();
  hush(); speak(SR.mode === 'birlikte' ? 'Hoca okusun, sonra sen tekrar et!' : 'Sure baştan sona okunacak.', 'tr'); };
$('sureOkunus').onchange = e => { S.settings.okunus = e.target.checked; save(); $('sureText').classList.toggle('no-ok', !e.target.checked); };
$('sureBack').onclick = () => openSureler();
loadSureAudio();

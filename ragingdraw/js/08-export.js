/* =====================================================================
   RAGING DRAW — EXPORT, FORMAT, AIDE
   PNG / JPEG : rendu vectoriel à la taille demandée, avec la vraie
   résolution (dpi) inscrite dans le fichier.
   PDF : page à la taille physique de l'affiche ; au-delà de ce qu'un
   navigateur sait peindre d'un coup, l'image est rendue par tuiles,
   ce qui permet du 300 dpi même sur une affiche de 120 × 160 cm.
===================================================================== */
const EX = {fmt:'png', q:'hd', jpegQ:95, transparent:false};

function modalShell(id, title, sub, body, actions, wide){
  closeModal();
  const bd = document.createElement('div');
  bd.className = 'modal-backdrop'; bd.id = id;
  bd.innerHTML = `<div class="modal ${wide?'wide':''}" role="dialog" aria-modal="true">
    <div class="mh">${title ? `<h2>${title}</h2>` : ''}${sub ? `<p>${sub}</p>` : ''}<button class="ib mclose" data-act="closeModal" title="${L('Fermer','Close')}">${icon('close')}</button></div>
    <div class="mb">${body}</div>${actions ? `<div class="modal-actions">${actions}</div>` : ''}</div>`;
  document.body.appendChild(bd);
  bd.addEventListener('mousedown', e => { if(e.target === bd) closeModal(); });
  return bd;
}
function closeModal(){ document.querySelectorAll('.modal-backdrop').forEach(m => m.remove()); }

/* ---------- Limites du navigateur ---------- */
const _fitCache = {};
function canvasFits(w, h){
  const k = w + 'x' + h;
  if(k in _fitCache) return _fitCache[k];
  let ok = false;
  try{
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    if(g){ g.fillStyle = '#ff0000'; g.fillRect(w - 1, h - 1, 1, 1); ok = g.getImageData(w - 1, h - 1, 1, 1).data[0] === 255; }
    c.width = c.height = 1;
  }catch(e){ ok = false; }
  return (_fitCache[k] = ok);
}
function maxSingleScale(doc){
  // la plus grande échelle qu'un seul canevas accepte (≈ 16 384 px de côté, 268 Mpx sous Chrome ; moins ailleurs)
  let lo = 0.1, hi = Math.min(32767/doc.w, 32767/doc.h);
  if(canvasFits(Math.floor(doc.w*hi), Math.floor(doc.h*hi))) return hi;
  for(let i = 0; i < 14; i++){
    const mid = (lo + hi)/2;
    if(canvasFits(Math.floor(doc.w*mid), Math.floor(doc.h*mid))) lo = mid; else hi = mid;
  }
  return lo*0.98;
}
function exportPresets(doc){
  const ph = physInches(doc.phys), list = [];
  list.push({id:'web', fr:'Écran', en:'Screen', k:1});
  list.push({id:'hd', fr:'Haute définition', en:'High definition', k:2});
  list.push({id:'ultra', fr:'Ultra', en:'Ultra', k:4});
  if(ph){
    list.push({id:'p150', fr:'Impression 150 dpi', en:'Print 150 dpi', k:ph.w*150/doc.w, dpi:150});
    list.push({id:'p300', fr:'Impression 300 dpi', en:'Print 300 dpi', k:ph.w*300/doc.w, dpi:300});
  }else list.push({id:'x8', fr:'Géant', en:'Giant', k:8});
  return list;
}
function presetDpi(doc, p){
  const ph = physInches(doc.phys);
  if(!ph) return 72*p.k;
  return Math.round(doc.w*p.k/ph.w);
}

/* ---------- Fenêtre d'export ---------- */
function openExport(){
  if(!S.doc) return;
  if(S.editingId) endTextEdit();
  const d = S.doc, ps = exportPresets(d);
  if(!ps.find(p => p.id === EX.q)) EX.q = 'hd';
  const fmts = [
    ['png', 'PNG', L('Sans perte, transparence possible','Lossless, transparency allowed')],
    ['jpg', 'JPEG', L('Léger, parfait pour partager','Light, perfect for sharing')],
    ['pdf', 'PDF', L('Pour l’imprimeur, à la taille réelle','For the printer, at actual size')],
    ['rdraw', L('Projet','Project'), L('Pour le rouvrir et le modifier plus tard','To reopen and edit it later')]
  ];
  const body = `
    <div class="ex-prev"><canvas id="exPrev"></canvas></div>
    <div class="ex-opts">
      <div class="field"><label>${L('Format du fichier','File format')}</label>
        <div class="fmt-choice fmt4">${fmts.map(f => `<button class="fmt-opt ${EX.fmt===f[0]?'active':''}" data-act="exFmt" data-id="${f[0]}"><div class="t">${f[1]}</div><div class="d">${f[2]}</div></button>`).join('')}</div></div>
      <div class="field ex-q ${EX.fmt==='rdraw'?'hidden':''}"><label>${L('Qualité','Quality')}</label>
        <div class="qlist">${ps.map(p => `<button class="qopt ${EX.q===p.id?'active':''}" data-act="exQ" data-id="${p.id}"><b>${L(p.fr, p.en)}</b><span>${fmtNum(d.w*p.k)} × ${fmtNum(d.h*p.k)} px</span></button>`).join('')}</div></div>
      <div class="field ex-jq ${EX.fmt==='jpg'||EX.fmt==='pdf'?'':'hidden'}"><label>${L('Compression','Compression')} <b id="exJqv">${EX.jpegQ} %</b></label><input type="range" min="70" max="100" value="${EX.jpegQ}" id="exJq"></div>
      <label class="ftog ex-tr ${EX.fmt==='png'?'':'hidden'}"><span>${L('Fond transparent (le fond de l’affiche n’est pas exporté)','Transparent background (the poster background isn’t exported)')}</span><input type="checkbox" id="exTr" ${EX.transparent?'checked':''}><i class="sw"></i></label>
      <div class="ex-sum" id="exSum"></div>
    </div>`;
  modalShell('exportBackdrop', L('Exporter l’affiche','Export the poster'), esc(d.title) + ' · ' + esc(formatLabel(d)), body,
    `<button class="btn btn-ghost" data-act="closeModal">${L('Annuler','Cancel')}</button><button class="btn btn-primary" data-act="doExport">${icon('export')} ${L('Exporter','Export')}</button>`, true);
  const jq = document.getElementById('exJq');
  jq.addEventListener('input', () => { EX.jpegQ = +jq.value; document.getElementById('exJqv').textContent = EX.jpegQ + ' %'; exSummary(); });
  document.getElementById('exTr').addEventListener('change', e => { EX.transparent = e.target.checked; exSummary(); });
  const pc = document.getElementById('exPrev');
  const t = renderThumb(d, 260, 340); pc.width = t.width; pc.height = t.height; pc.getContext('2d').drawImage(t, 0, 0);
  exSummary();
}
function refreshExport(){
  const bd = document.getElementById('exportBackdrop'); if(!bd) return;
  bd.querySelectorAll('[data-act="exFmt"]').forEach(b => b.classList.toggle('active', b.dataset.id === EX.fmt));
  bd.querySelectorAll('[data-act="exQ"]').forEach(b => b.classList.toggle('active', b.dataset.id === EX.q));
  bd.querySelector('.ex-q').classList.toggle('hidden', EX.fmt === 'rdraw');
  bd.querySelector('.ex-jq').classList.toggle('hidden', !(EX.fmt === 'jpg' || EX.fmt === 'pdf'));
  bd.querySelector('.ex-tr').classList.toggle('hidden', EX.fmt !== 'png');
  exSummary();
}
function exPlan(){
  const d = S.doc, p = exportPresets(d).find(x => x.id === EX.q) || exportPresets(d)[1];
  let k = p.k, capped = false;
  const tiled = EX.fmt === 'pdf';
  if(!tiled){ const mx = maxSingleScale(d); if(k > mx){ k = mx; capped = true; } }
  const W = Math.round(d.w*k), H = Math.round(d.h*k);
  const ph = physInches(d.phys);
  const dpi = ph ? Math.round(W/ph.w) : Math.round(72*k);
  return {k, W, H, dpi, capped, preset:p, ph};
}
function exSummary(){
  const el = document.getElementById('exSum'); if(!el) return;
  if(EX.fmt === 'rdraw'){
    const n = Object.keys(S.doc.assets).length;
    el.innerHTML = `${icon('save')}<span>${L('Fichier .rdraw : toute l’affiche, ses calques et ses images en pleine résolution','.rdraw file: the whole poster, its layers and its images at full resolution')}${n ? ' (' + n + ' ' + L(n > 1 ? 'images' : 'image', n > 1 ? 'images' : 'image') + ')' : ''}.</span>`;
    return;
  }
  const pl = exPlan();
  const mpx = pl.W*pl.H/1e6;
  const est = EX.fmt === 'png' ? mpx*1e6*1.6 : mpx*1e6*(0.05 + Math.pow((EX.jpegQ - 70)/30, 2)*0.3);
  const size = pl.ph ? round(pl.ph.w*2.54, 1) + ' × ' + round(pl.ph.h*2.54, 1) + ' cm' : '';
  el.innerHTML = `${icon('check')}<span><b>${fmtNum(pl.W)} × ${fmtNum(pl.H)} px</b> · ${pl.dpi} dpi${size ? ' · ' + size : ''} · ≈ ${fmtBytes(est)}` +
    (pl.capped ? `<br><em>${L('Ce navigateur ne peut pas peindre une image aussi grande d’un seul tenant : elle est ramenée au maximum possible. Le PDF, lui, garde la pleine résolution.','This browser can’t paint such a large image in one piece: it’s reduced to the largest possible size. The PDF keeps the full resolution.')}</em>` : '') +
    (EX.fmt === 'pdf' ? `<br>${L('Prêt pour l’imprimeur : la page fait la taille réelle de l’affiche.','Ready for the printer: the page is the poster’s actual size.')}` : '') + '</span>';
}
function progress(msg, pct){
  let el = document.getElementById('exProg');
  if(!el){ el = document.createElement('div'); el.id = 'exProg'; el.className = 'exprog'; el.innerHTML = '<div><span class="spin"></span><b></b><i><s></s></i></div>'; document.body.appendChild(el); }
  el.querySelector('b').textContent = msg;
  el.querySelector('s').style.width = Math.round((pct||0)*100) + '%';
}
function progressEnd(){ const el = document.getElementById('exProg'); if(el) el.remove(); }
const nextFrame = () => new Promise(r => setTimeout(r, 30));

async function doExport(){
  const d = S.doc;
  if(EX.fmt === 'rdraw'){ closeModal(); saveProjectFile(d); return; }
  const pl = exPlan();
  closeModal();
  progress(L('Préparation des polices et des images…','Preparing fonts and images…'), .05);
  await nextFrame();
  try{
    await loadDocFonts(d); await preloadImages(d);
    if(EX.fmt === 'pdf') await exportPDF(d, pl);
    else await exportRaster(d, pl);
  }catch(e){
    console.error(e);
    progressEnd();
    rdAlert(L('L’export n’a pas abouti','The export didn’t finish'), L('Le navigateur a manqué de mémoire pour une image aussi grande. Essaie une qualité plus basse, ou le PDF qui découpe le travail en morceaux.','The browser ran out of memory for such a large image. Try a lower quality, or the PDF, which splits the work into pieces.'));
    return;
  }
  progressEnd();
}
function canvasToBlob(c, type, q){ return new Promise(res => c.toBlob(b => res(b), type, q)); }
async function exportRaster(d, pl){
  progress(L('Rendu en ','Rendering at ') + fmtNum(pl.W) + ' × ' + fmtNum(pl.H) + ' px…', .3);
  await nextFrame();
  const c = document.createElement('canvas'); c.width = pl.W; c.height = pl.H;
  const g = c.getContext('2d');
  const kx = pl.W/d.w;
  g.setTransform(kx, 0, 0, pl.H/d.h, 0, 0);
  renderDoc(g, d, kx, {transparent:EX.fmt === 'png' && EX.transparent});
  progress(L('Encodage du fichier…','Encoding the file…'), .7);
  await nextFrame();
  const type = EX.fmt === 'png' ? 'image/png' : 'image/jpeg';
  let blob = await canvasToBlob(c, type, EX.jpegQ/100);
  c.width = c.height = 1;
  if(!blob) throw new Error('toBlob');
  const buf = new Uint8Array(await blob.arrayBuffer());
  const out = EX.fmt === 'png' ? pngWithDpi(buf, pl.dpi) : jpegWithDpi(buf, pl.dpi);
  downloadBlob(new Blob([out], {type}), safeName(d.title) + (EX.fmt === 'png' ? '.png' : '.jpg'));
  toast(L('Exporté : ','Exported: ') + fmtNum(pl.W) + ' × ' + fmtNum(pl.H) + ' px · ' + fmtBytes(out.length));
}
async function exportPDF(d, pl){
  const TILE = 4096;
  const W = pl.W, H = pl.H, k = W/d.w;
  const ptW = pl.ph ? pl.ph.w*72 : d.w*.75, ptH = pl.ph ? pl.ph.h*72 : d.h*.75;
  const ppx = ptW/W;
  const nx = Math.ceil(W/TILE), ny = Math.ceil(H/TILE), images = [];
  let n = 0;
  for(let ty = 0; ty < ny; ty++) for(let tx = 0; tx < nx; tx++){
    n++;
    progress(L('Rendu ','Rendering ') + (nx*ny > 1 ? L('de la tuile ','tile ') + n + '/' + nx*ny : '') + ' · ' + fmtNum(W) + ' × ' + fmtNum(H) + ' px', .1 + .8*(n - 1)/(nx*ny));
    await nextFrame();
    const x0 = tx*TILE, y0 = ty*TILE;
    // chaque tuile déborde de 2 px sur la suivante : aucun liseré entre les morceaux
    const tw = Math.min(TILE + (tx < nx - 1 ? 2 : 0), W - x0), th = Math.min(TILE + (ty < ny - 1 ? 2 : 0), H - y0);
    const c = document.createElement('canvas'); c.width = tw; c.height = th;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, tw, th);
    g.setTransform(k, 0, 0, k, -x0, -y0);
    renderDoc(g, d, k, {});
    const blob = await canvasToBlob(c, 'image/jpeg', EX.jpegQ/100);
    c.width = c.height = 1;
    if(!blob) throw new Error('tile');
    images.push({bytes:new Uint8Array(await blob.arrayBuffer()), w:tw, h:th, x:x0*ppx, y:ptH - (y0 + th)*ppx, dw:tw*ppx, dh:th*ppx});
  }
  progress(L('Assemblage du PDF…','Assembling the PDF…'), .95);
  await nextFrame();
  const pdf = buildPDF(ptW, ptH, images, d.title);
  downloadBlob(pdf, safeName(d.title) + '.pdf');
  toast(L('PDF exporté : ','PDF exported: ') + fmtNum(W) + ' × ' + fmtNum(H) + ' px · ' + pl.dpi + ' dpi · ' + fmtBytes(pdf.size));
}

/* ---------- PDF minimal (images JPEG) ---------- */
function pdfStr(s){
  let hex = 'FEFF';
  for(const ch of String(s)){ const c = ch.codePointAt(0); if(c > 0xFFFF){ const v = c - 0x10000; hex += ((0xD800 + (v >> 10)).toString(16).padStart(4,'0') + (0xDC00 + (v & 0x3FF)).toString(16).padStart(4,'0')); } else hex += c.toString(16).padStart(4, '0'); }
  return '<' + hex.toUpperCase() + '>';
}
function buildPDF(W, H, images, title){
  const enc = new TextEncoder(), parts = [], offs = [];
  let len = 0;
  const put = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
  const obj = (n, body) => { offs[n] = len; put(n + ' 0 obj\n'); body(); put('\nendobj\n'); };
  put('%PDF-1.4\n'); put(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
  const nImg = images.length, first = 5;
  const f = v => (Math.round(v*1000)/1000).toString();
  obj(1, () => put('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => put('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
  const xo = images.map((im, i) => '/Im' + i + ' ' + (first + i) + ' 0 R').join(' ');
  obj(3, () => put(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(W)} ${f(H)}] /TrimBox [0 0 ${f(W)} ${f(H)}] /Resources << /XObject << ${xo} >> /ProcSet [/PDF /ImageC] >> /Contents 4 0 R >>`));
  const content = images.map((im, i) => `q ${f(im.dw)} 0 0 ${f(im.dh)} ${f(im.x)} ${f(im.y)} cm /Im${i} Do Q`).join('\n');
  obj(4, () => { put(`<< /Length ${enc.encode(content).length} >>\nstream\n`); put(content); put('\nendstream'); });
  images.forEach((im, i) => obj(first + i, () => {
    put(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`);
    put(im.bytes); put('\nendstream');
  }));
  const info = first + nImg;
  const now = new Date(), pad = v => String(v).padStart(2, '0');
  const date = 'D:' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
  obj(info, () => put(`<< /Title ${pdfStr(title || 'Raging Draw')} /Creator (Raging Draw) /Producer (Raging Draw) /CreationDate (${date}) >>`));
  const xref = len, count = info + 1;
  let x = 'xref\n0 ' + count + '\n0000000000 65535 f \n';
  for(let i = 1; i < count; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
  put(x);
  put(`trailer\n<< /Size ${count} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, {type:'application/pdf'});
}

/* ---------- Résolution inscrite dans les fichiers ---------- */
let _crcT = null;
function crc32(buf, start, end){
  if(!_crcT){ _crcT = new Uint32Array(256); for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; _crcT[n] = c >>> 0; } }
  let c = 0xFFFFFFFF;
  for(let i = start; i < end; i++) c = _crcT[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function pngWithDpi(buf, dpi){
  if(buf.length < 33 || buf[12] !== 0x49 || buf[13] !== 0x48) return buf;  // IHDR attendu
  const ppm = Math.round(dpi/0.0254);
  const ch = new Uint8Array(21), dv = new DataView(ch.buffer);
  dv.setUint32(0, 9); ch.set([0x70, 0x48, 0x59, 0x73], 4);
  dv.setUint32(8, ppm); dv.setUint32(12, ppm); ch[16] = 1;
  dv.setUint32(17, crc32(ch, 4, 17));
  const out = new Uint8Array(buf.length + 21);
  out.set(buf.subarray(0, 33), 0); out.set(ch, 33); out.set(buf.subarray(33), 54);
  return out;
}
function jpegWithDpi(buf, dpi){
  if(buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF && buf[3] === 0xE0 && buf[6] === 0x4A && buf[7] === 0x46 && buf[8] === 0x49 && buf[9] === 0x46){
    const d = Math.min(65535, Math.round(dpi));
    buf[13] = 1; buf[14] = d >> 8; buf[15] = d & 255; buf[16] = d >> 8; buf[17] = d & 255;
  }
  return buf;
}

/* ---------- Fichier projet (.rdraw) ---------- */
function saveProjectFile(d){
  const used = new Set(d.objects.filter(o => o.type === 'image' && o.asset).map(o => o.asset));
  const assets = {}; used.forEach(id => { if(d.assets[id]) assets[id] = d.assets[id]; });
  const out = JSON.stringify({app:'ragingdraw', v:1, doc:Object.assign({}, d, {assets})}, (k, v) => k === '_v' ? undefined : v);
  const blob = new Blob([out], {type:'application/json'});
  downloadBlob(blob, safeName(d.title) + '.rdraw');
  toast(L('Projet enregistré : ','Project saved: ') + fmtBytes(blob.size));
}
async function openProjectFile(file){
  let data;
  try{ data = JSON.parse(await readFileAsText(file)); }catch(e){ data = null; }
  if(!data || data.app !== 'ragingdraw' || !data.doc || !Array.isArray(data.doc.objects)){
    rdAlert(L('Fichier non reconnu','File not recognised'), L('Ce fichier n’est pas un projet Raging Draw (.rdraw).','This file isn’t a Raging Draw project (.rdraw).'));
    return;
  }
  const doc = data.doc;
  const exists = S.index.some(m => m.id === doc.id);
  if(exists || !doc.id) doc.id = uid('p');
  doc.assets = doc.assets || {}; doc.fx = Object.assign({grain:0, vignette:0, vignetteColor:'#000000'}, doc.fx || {});
  doc.updatedAt = Date.now(); doc.createdAt = doc.createdAt || Date.now();
  S.doc = doc;
  await saveDoc();
  openDoc(doc);
  toast(L('Projet ouvert : ','Project opened: ') + doc.title);
}

/* ---------- Changer le format ---------- */
function openFormat(){
  const d = S.doc;
  const cards = FORMATS.map(f => `<button class="fmt-card ${d.format===f.id?'active':''}" data-act="pickFormat" data-id="${f.id}"><span class="fc-r"><i style="aspect-ratio:${f.w}/${f.h}"></i></span><b>${L(f.fr, f.en)}</b><small>${f.d}</small></button>`).join('');
  const body = `<div class="fmt-grid">${cards}</div>
    <div class="fmt-custom"><b>${L('Sur mesure','Custom')}</b>
      <label>${L('Largeur','Width')}<input type="number" id="fcW" value="${d.phys ? d.phys.w : d.w}" min="1" step="any"></label>
      <label>${L('Hauteur','Height')}<input type="number" id="fcH" value="${d.phys ? d.phys.h : d.h}" min="1" step="any"></label>
      <label>${L('Unité','Unit')}<select id="fcU">${['px','mm','cm','in'].map(u => `<option value="${u}" ${(d.phys ? d.phys.unit : 'px')===u?'selected':''}>${u}</option>`).join('')}</select></label>
      <button class="btn btn-sm" data-act="applyCustomFormat">${L('Appliquer','Apply')}</button></div>
    <label class="ftog"><span>${L('Adapter le contenu au nouveau format','Fit the content to the new size')}</span><input type="checkbox" id="fcFit" checked><i class="sw"></i></label>`;
  modalShell('formatBackdrop', L('Format de l’affiche','Poster size'), L('Le contenu est mis à l’échelle et recentré.','Content is scaled and re-centred.'), body, '', true);
}
function baseSizeFor(w, h, unit){
  if(unit === 'px') return {w:Math.round(w), h:Math.round(h), phys:null};
  const L2 = 2400;
  return w >= h ? {w:L2, h:Math.round(L2*h/w), phys:{w, h, unit}} : {w:Math.round(L2*w/h), h:L2, phys:{w, h, unit}};
}
function applyFormat(fid, W, H, phys){
  const d = S.doc, fit = document.getElementById('fcFit') ? document.getElementById('fcFit').checked : true;
  const ow = d.w, oh = d.h;
  if(fit){
    const k = Math.min(W/ow, H/oh);
    d.objects.forEach(o => {
      o.x = (o.x - ow/2)*k + W/2; o.y = (o.y - oh/2)*k + H/2; o.w *= k; o.h *= k;
      if(o.type === 'text'){ o.size *= k; }
      if(o.stroke) o.stroke.width *= k;
      if(o.shadow){ o.shadow.blur *= k; o.shadow.x *= k; o.shadow.y *= k; }
      if(o.glow) o.glow.blur *= k;
      if(o.radius) o.radius *= k;
      touch(o);
    });
  }else{
    d.objects.forEach(o => { o.x += (W - ow)/2; o.y += (H - oh)/2; });
  }
  d.w = W; d.h = H; d.phys = phys ? deepClone(phys) : null; d.format = fid;
  closeModal(); S.fitted = false; fitView(); S.fitted = true;
  commit(); renderSide(); updateDocInfo(); renderFlyout(); requestRender();
  toast(L('Nouveau format : ','New size: ') + formatLabel(d));
}

/* ---------- Aide ---------- */
function openHelp(){
  const k = (keys, t) => `<div class="kr"><span>${keys.split('+').map(x => `<kbd>${x}</kbd>`).join('<i>+</i>')}</span><em>${t}</em></div>`;
  const body = `<div class="help">
    <div class="help-steps">
      <div><b>1</b><span><strong>${L('Choisis un modèle','Pick a template')}</strong>${L('ou pars d’une toile vierge.','or start from a blank canvas.')}</span></div>
      <div><b>2</b><span><strong>${L('Glisse tes images','Drop your images')}</strong>${L('sur l’affiche ou dans un cadre photo.','onto the poster or into a photo frame.')}</span></div>
      <div><b>3</b><span><strong>${L('Écris, dessine, décore','Write, draw, decorate')}</strong>${L('tout se règle dans le volet de droite.','everything is adjusted in the right panel.')}</span></div>
      <div><b>4</b><span><strong>${L('Exporte','Export')}</strong>${L('jusqu’au 300 dpi pour l’imprimeur.','up to 300 dpi for the printer.')}</span></div>
    </div>
    <div class="help-cols">
      <div><h4>${L('Outils','Tools')}</h4>${k('V', L('Sélection','Select'))}${k('H', L('Main (ou Espace)','Hand (or Space)'))}${k('B', L('Pinceau','Brush'))}${k('E', L('Gomme','Eraser'))}${k('T', L('Texte','Text'))}${k('R', L('Rectangle','Rectangle'))}${k('O', L('Ellipse','Ellipse'))}${k('L', L('Trait','Line'))}${k('I', L('Importer une image','Import an image'))}${k('K', L('Pipette','Eyedropper'))}${k('[+]', L('Taille du pinceau','Brush size'))}</div>
      <div><h4>${L('Édition','Editing')}</h4>${k('Ctrl+Z', L('Annuler','Undo'))}${k(L('Ctrl+Maj+Z','Ctrl+Shift+Z'), L('Rétablir','Redo'))}${k('Ctrl+D', L('Dupliquer','Duplicate'))}${k('Ctrl+C+V', L('Copier, coller','Copy, paste'))}${k(L('Alt+glisser','Alt+drag'), L('Dupliquer en déplaçant','Duplicate while dragging'))}${k(L('Suppr','Del'), L('Supprimer','Delete'))}${k('Ctrl+]', L('Avancer (Maj : devant)','Forward (Shift: front)'))}${k('Ctrl+[', L('Reculer (Maj : derrière)','Backward (Shift: back)'))}${k(L('Flèches','Arrows'), L('Déplacer (Maj : ×10)','Nudge (Shift: ×10)'))}${k('Ctrl+A', L('Tout sélectionner','Select all'))}</div>
      <div><h4>${L('Vue et poignées','View & handles')}</h4>${k('Ctrl+0', L('Ajuster à l’écran','Fit to screen'))}${k('Ctrl+1', L('Taille réelle','Actual size'))}${k(L('Ctrl+molette','Ctrl+wheel'), L('Zoomer','Zoom'))}${k(L('Maj','Shift'), L('Garder les proportions','Keep proportions'))}${k('Alt', L('Agrandir depuis le centre','Resize from centre'))}${k(L('Maj','Shift'), L('Rotation par 15°','Rotate by 15°'))}${k('Ctrl+E', L('Exporter','Export'))}${k('Ctrl+S', L('Enregistrer','Save'))}</div>
    </div>
    <p class="help-foot">${icon('save')}<span>${L('Tes affiches sont enregistrées automatiquement dans ce navigateur, sur ton ordinateur. Pour les garder ailleurs ou les transmettre, exporte le projet en .rdraw.','Your posters are saved automatically in this browser, on your computer. To keep them elsewhere or share them, export the project as .rdraw.')}</span></p>
  </div>`;
  modalShell('helpBackdrop', L('Raccourcis et prise en main','Shortcuts & getting started'), '', body, `<button class="btn btn-primary" data-act="closeModal">${L('C’est parti','Let’s go')}</button>`, true);
}

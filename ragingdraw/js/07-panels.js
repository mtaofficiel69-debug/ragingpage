/* =====================================================================
   RAGING DRAW — PANNEAUX
   Volet de droite (réglages de ce qui est sélectionné, calques), volet
   « Créer » de gauche, et les petits outils : couleur, dégradé, police.
   Chaque champ est relié à une propriété par data-bind ; tout se met à
   jour en direct, et l'historique note le changement à la fin du geste.
===================================================================== */
const OPEN = new Set(['pos','text','fill','image','effects','brush','bg','fx','aids','shape']);

/* ---------- Liaison champs <-> objets ---------- */
function bindTargets(el){
  const t = el.dataset.target;
  if(t === 'doc') return S.doc ? [S.doc] : [];
  if(t === 'brush') return [S.brush];
  if(t === 'eraser') return [S.eraser];
  if(t === 'S') return [S];
  return selObjs();
}
function getP(o, path){ return path.split('.').reduce((a, k) => a == null ? a : a[k], o); }
function setP(o, path, v){
  const ks = path.split('.'); let a = o;
  for(let i = 0; i < ks.length - 1; i++){ if(a[ks[i]] == null || typeof a[ks[i]] !== 'object') a[ks[i]] = {}; a = a[ks[i]]; }
  a[ks[ks.length-1]] = v;
}
function fieldValue(el){
  if(el.type === 'checkbox') return el.checked;
  const mul = parseFloat(el.dataset.mul || '1');
  if(el.type === 'range' || el.type === 'number' || el.dataset.num){
    let v = parseFloat(String(el.value).replace(',', '.'));
    if(isNaN(v)) return undefined;
    if(el.min !== '' && el.type === 'range') v = clamp(v, parseFloat(el.min), parseFloat(el.max));
    return v/mul;
  }
  return el.value;
}
const TEXT_KEYS = /^(text|font|size|weight|italic|upper|lineHeight|letterSpacing|w|align)$/;
function applyBind(el){
  const path = el.dataset.bind, v = fieldValue(el);
  if(v === undefined) return;
  bindTargets(el).forEach(o => {
    if(path.startsWith('crop.') && o.type === 'image'){ setCrop(o, path.slice(5), v); return; }
    if(path === 'w' && el.dataset.ratio && o.h){ const r = o.h/o.w; setP(o, 'w', v); o.h = v*r; }
    else if(path === 'h' && el.dataset.ratio && o.w){ const r = o.w/o.h; setP(o, 'h', v); o.w = v*r; }
    else setP(o, path, v);
    if(o.type === 'text' && TEXT_KEYS.test(path)) fitTextHeight(o);
    if(o.type) touch(o);
  });
  // le champ jumeau (curseur + nombre) suit
  document.querySelectorAll('[data-bind="' + path + '"]').forEach(x => { if(x !== el && x.dataset.target === el.dataset.target) setFieldFromModel(x); });
  if(el.dataset.target === 'S' || el.dataset.target === 'brush' || el.dataset.target === 'eraser') renderBrushPreview();
  positionTextEdit();
  requestRender();
  if(el.dataset.target !== 'brush' && el.dataset.target !== 'eraser' && el.dataset.target !== 'S') scheduleSave();
  if(path === 'name' || path === 'text') renderLayersIfOpen();
}
function setFieldFromModel(el){
  const t = bindTargets(el)[0]; if(!t) return;
  let v = getP(t, el.dataset.bind);
  if(el.type === 'checkbox'){ el.checked = !!v; return; }
  if(v == null) v = '';
  const mul = parseFloat(el.dataset.mul || '1');
  if(typeof v === 'number'){
    v = v*mul;
    const dec = el.dataset.dec != null ? +el.dataset.dec : (Math.abs(v) < 10 && v % 1 ? 2 : 0);
    v = round(v, dec);
  }
  if(String(el.value) !== String(v)) el.value = v;
}
function syncFields(){
  document.querySelectorAll('#side [data-bind], #flyout [data-bind]').forEach(el => { if(el !== document.activeElement) setFieldFromModel(el); });
}
function setCrop(o, side, v){
  const c = o.crop || (o.crop = {l:0, t:0, r:0, b:0});
  const old = Object.assign({}, c);
  c[side] = clamp(v, 0, .45);
  // on garde l'échelle de l'image : la boîte rétrécit ou grandit avec le recadrage
  const kx = o.w/Math.max(1e-6, (1 - old.l - old.r)*o.nw), ky = o.h/Math.max(1e-6, (1 - old.t - old.b)*o.nh);
  const nw = (1 - c.l - c.r)*o.nw*kx, nh = (1 - c.t - c.b)*o.nh*ky;
  const dxl = ((c.l - old.l) - (c.r - old.r))*o.nw*kx/2, dyl = ((c.t - old.t) - (c.b - old.b))*o.nh*ky/2;
  const p = toWorld(o, dxl, dyl);
  o.w = nw; o.h = nh; o.x = p.x; o.y = p.y;
}

/* ---------- Petits composants ---------- */
function sec(id, title, body, extra){
  const open = OPEN.has(id);
  return `<section class="ps ${open?'open':''}" data-sec="${id}">
    <button class="ps-h" data-act="toggleSec" data-id="${id}">${icon('chevR','ps-chev')}<span>${title}</span>${extra||''}</button>
    <div class="ps-b">${body}</div></section>`;
}
function tAttr(target){ return target ? ` data-target="${target}"` : ''; }
function fRange(label, bind, min, max, step, o){
  o = o || {};
  const t = tAttr(o.target), mul = o.mul ? ` data-mul="${o.mul}"` : '', dec = o.dec != null ? ` data-dec="${o.dec}"` : '';
  return `<label class="fr"><span class="fl">${label}</span>
    <input type="range" min="${min}" max="${max}" step="${step}" data-bind="${bind}"${t}${mul}${dec}>
    <span class="fn"><input type="number" step="${o.nstep||step}" data-bind="${bind}"${t}${mul}${dec}>${o.unit?`<i>${o.unit}</i>`:''}</span></label>`;
}
function fNum(label, bind, o){
  o = o || {};
  return `<label class="fnum"><span>${label}</span><input type="number" step="${o.step||1}" data-bind="${bind}"${tAttr(o.target)}${o.mul?` data-mul="${o.mul}"`:''}${o.ratio?' data-ratio="1"':''} data-dec="${o.dec==null?0:o.dec}">${o.unit?`<i>${o.unit}</i>`:''}</label>`;
}
function fToggle(label, bind, o){
  o = o || {};
  return `<label class="ftog"><span>${label}</span><input type="checkbox" data-bind="${bind}"${tAttr(o.target)}><i class="sw"></i></label>`;
}
function fSelect(label, bind, opts, o){
  o = o || {};
  return `<label class="fsel"><span class="fl">${label}</span><select data-bind="${bind}"${tAttr(o.target)}${o.num?' data-num="1"':''}>${opts.map(x => `<option value="${esc(x[0])}">${esc(x[1])}</option>`).join('')}</select></label>`;
}
function fColor(label, bind, target){
  const t = (target ? (target === 'doc' ? [S.doc] : target === 'brush' ? [S.brush] : []) : selObjs())[0];
  const c = t ? getP(t, bind) : '#000000';
  return `<div class="fcol"><span class="fl">${label}</span>${swatchBtn(c, `data-act="pickColor" data-bind-color="${bind}"${tAttr(target)}`)}</div>`;
}
function swatchBtn(c, attrs){
  const a = Math.round(colorAlpha(c)*100);
  return `<button class="swb" ${attrs}><i style="--c:${esc(c)}"></i><span>${esc(toHex(c).toUpperCase())}${a < 100 ? ' · ' + a + ' %' : ''}</span></button>`;
}
function seg(items, cur, act, extra){
  return `<div class="seg">${items.map(it => `<button class="${String(it[0])===String(cur)?'on':''}" data-act="${act}" data-id="${it[0]}" ${extra||''} title="${esc(it[2]||it[1])}">${it[1]}</button>`).join('')}</div>`;
}
function iconBtn(act, ic, title, id, on){
  return `<button class="ib ${on?'on':''}" data-act="${act}" ${id!=null?`data-id="${id}"`:''} title="${esc(title)}">${icon(ic)}</button>`;
}

/* ---------- Éditeur de peinture (uni / dégradé) ---------- */
function paintEditor(bind, target, p){
  p = p || solid('#000000');
  const attrs = `data-pbind="${bind}"${tAttr(target)}`;
  let body = '';
  if(p.type === 'solid'){
    body = swatchBtn(p.color, `data-act="pickPaint" data-stop="-1" ${attrs}`);
  }else{
    body = `<div class="gbar" style="background:${esc(paintPreviewCss(p))}"></div>` +
      p.stops.map((s, i) => `<div class="gstop">${swatchBtn(s.c, `data-act="pickPaint" data-stop="${i}" ${attrs}`)}
        <input type="range" min="0" max="100" step="1" value="${Math.round(s.o*100)}" data-act-input="stopPos" data-stop="${i}" ${attrs} title="${L('Position','Position')}">
        ${p.stops.length > 2 ? `<button class="ib sm" data-act="delStop" data-stop="${i}" ${attrs} title="${L('Retirer','Remove')}">${icon('close')}</button>` : '<span class="ib-sp"></span>'}</div>`).join('') +
      `<button class="btn btn-ghost btn-sm add-stop" data-act="addStop" ${attrs}>${icon('plus')} ${L('Ajouter une couleur','Add a colour')}</button>` +
      (p.type === 'linear'
        ? `<label class="fr"><span class="fl">${L('Angle','Angle')}</span><input type="range" min="0" max="360" step="1" value="${p.angle||0}" data-act-input="gradAngle" ${attrs}><span class="fn"><input type="number" value="${p.angle||0}" data-act-input="gradAngle" ${attrs}><i>°</i></span></label>`
        : `<label class="fr"><span class="fl">${L('Centre X','Centre X')}</span><input type="range" min="0" max="100" value="${Math.round((p.cx==null?.5:p.cx)*100)}" data-act-input="gradCx" ${attrs}><span class="fn"><input type="number" value="${Math.round((p.cx==null?.5:p.cx)*100)}" data-act-input="gradCx" ${attrs}><i>%</i></span></label>
           <label class="fr"><span class="fl">${L('Centre Y','Centre Y')}</span><input type="range" min="0" max="100" value="${Math.round((p.cy==null?.5:p.cy)*100)}" data-act-input="gradCy" ${attrs}><span class="fn"><input type="number" value="${Math.round((p.cy==null?.5:p.cy)*100)}" data-act-input="gradCy" ${attrs}><i>%</i></span></label>`);
  }
  return `<div class="paint">${seg([['solid',L('Uni','Solid')],['linear',L('Dégradé','Gradient')],['radial',L('Radial','Radial')]], p.type, 'paintType', attrs)}${body}</div>`;
}
function paintTargets(el){ return bindTargets(el); }
function getPaint(o, bind){ return getP(o, bind); }
function setPaintAll(el, fn){
  const bind = el.dataset.pbind;
  paintTargets(el).forEach(o => { const p = deepClone(getPaint(o, bind) || solid('#000000')); const np = fn(p) || p; setP(o, bind, np); if(o.type) touch(o); });
  requestRender(); scheduleSave();
}
function convertPaint(p, type){
  const c0 = p.type === 'solid' ? p.color : p.stops[0].c;
  const c1 = p.type === 'solid' ? withAlpha(p.color, 0) : p.stops[p.stops.length-1].c;
  if(type === 'solid') return solid(c0);
  const stops = p.type === 'solid' ? [stop(0, c0), stop(1, isLight(c0) ? '#5E1418' : '#F0646B')] : p.stops;
  void c1;
  return type === 'linear' ? linear(p.angle || 180, stops) : radial(stops, p.cx, p.cy);
}

/* ---------- Sélecteur de couleur ---------- */
let _pop = null;
function closePop(){ if(_pop){ const p = _pop; _pop = null; p.el.remove(); document.removeEventListener('mousedown', p.away, true); if(p.onClose) p.onClose(); } }
function placePop(el, anchor, w){
  const r = anchor.getBoundingClientRect();
  document.body.appendChild(el);
  const h = el.offsetHeight;
  let left = r.left - w - 12;
  if(left < 8) left = Math.min(window.innerWidth - w - 8, r.right + 12);
  let top = clamp(r.top - 40, 8, window.innerHeight - h - 8);
  el.style.left = left + 'px'; el.style.top = top + 'px';
}
function docColors(){
  const set = new Set();
  const add = c => { if(c && typeof c === 'string') set.add(toHex(c).toUpperCase()); };
  const addP = p => { if(!p) return; if(p.type === 'solid') add(p.color); else (p.stops||[]).forEach(s => add(s.c)); };
  if(S.doc){ addP(S.doc.bg); S.doc.objects.forEach(o => { addP(o.fill); if(o.stroke && o.stroke.on) add(o.stroke.color); if(o.type === 'draw') o.strokes.forEach(s => s.color && add(s.color)); }); }
  add(S.brush.color);
  return [...set].slice(0, 16);
}
function openColorPicker(anchor, initial, onInput, onClose){
  closePop();
  let cur = parseColor(initial || '#000000');
  const el = document.createElement('div');
  el.className = 'pop cpop';
  const used = docColors();
  el.innerHTML = `
    <div class="cp-top"><input type="color" class="cp-native" value="${toHex(cur)}" title="${L('Toutes les couleurs','All colours')}"><div class="cp-fields">
      <label>HEX<input type="text" class="cp-hex" value="${toHex(cur).toUpperCase()}" spellcheck="false" maxlength="9"></label>
      ${window.EyeDropper ? `<button class="ib" data-cp="eye" title="${L('Prendre une couleur à l’écran','Pick a colour from the screen')}">${icon('pipette')}</button>` : ''}
    </div></div>
    <label class="cp-alpha"><span>${L('Opacité','Opacity')}</span><input type="range" min="0" max="100" value="${Math.round(cur.a*100)}" class="cp-a"><b class="cp-av">${Math.round(cur.a*100)} %</b></label>
    <div class="cp-lbl">${L('Nuancier','Swatches')}</div>
    <div class="cp-sw">${SWATCHES.map(c => `<button style="--c:${c}" data-c="${c}" title="${c}"></button>`).join('')}<button class="cp-none" data-c="#00000000" title="${L('Transparent','Transparent')}"></button></div>
    ${used.length ? `<div class="cp-lbl">${L('Dans cette affiche','In this poster')}</div><div class="cp-sw">${used.map(c => `<button style="--c:${c}" data-c="${c}" title="${c}"></button>`).join('')}</div>` : ''}`;
  placePop(el, anchor, 252);
  const nat = el.querySelector('.cp-native'), hex = el.querySelector('.cp-hex'), al = el.querySelector('.cp-a'), av = el.querySelector('.cp-av');
  const emit = (from) => {
    const out = toHex(cur, true);
    if(from !== 'hex') hex.value = toHex(cur, cur.a < 1).toUpperCase();
    if(from !== 'nat') nat.value = toHex(cur);
    if(from !== 'a'){ al.value = Math.round(cur.a*100); }
    av.textContent = Math.round(cur.a*100) + ' %';
    onInput(out);
  };
  nat.addEventListener('input', () => { const c = parseColor(nat.value); c.a = cur.a; cur = c; emit('nat'); });
  hex.addEventListener('input', () => {
    const v = hex.value.trim().replace(/^([^#])/, '#$1');
    if(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)){ cur = parseColor(v); emit('hex'); }
  });
  al.addEventListener('input', () => { cur.a = al.value/100; emit('a'); });
  el.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => {
    const c = parseColor(b.dataset.c);
    if(b.dataset.c !== '#00000000' && cur.a < 0.05) c.a = 1; else if(b.dataset.c !== '#00000000') c.a = cur.a;
    cur = c; emit();
  }));
  const eye = el.querySelector('[data-cp="eye"]');
  if(eye) eye.addEventListener('click', () => { new window.EyeDropper().open().then(r => { const c = parseColor(r.sRGBHex); c.a = cur.a; cur = c; emit(); }).catch(() => {}); });
  const away = e => { if(!el.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) closePop(); };
  setTimeout(() => document.addEventListener('mousedown', away, true), 0);
  _pop = {el, away, onClose};
}

/* ---------- Sélecteur de police ---------- */
function openFontPicker(anchor){
  closePop();
  const o = sel1(); if(!o) return;
  const el = document.createElement('div');
  el.className = 'pop fpop';
  const list = q => FONT_GROUPS.map(g => {
    const items = g.list.filter(f => !q || f.toLowerCase().includes(q));
    if(!items.length) return '';
    return `<div class="fp-g">${L(g.fr, g.en)}</div>` + items.map(f => `<button class="fp-i ${f===o.font?'on':''}" data-font="${esc(f)}" style="font-family:'${esc(f)}', Inter, sans-serif">${esc(f)}</button>`).join('');
  }).join('') || `<div class="fp-empty">${L('Aucune police trouvée','No font found')}</div>`;
  el.innerHTML = `<div class="fp-search">${icon('pen')}<input type="text" placeholder="${L('Chercher une police…','Search a font…')}" spellcheck="false"></div><div class="fp-list">${list('')}</div>`;
  placePop(el, anchor, 280);
  const inp = el.querySelector('input'), lst = el.querySelector('.fp-list');
  inp.addEventListener('input', () => { lst.innerHTML = list(inp.value.trim().toLowerCase()); });
  lst.addEventListener('click', e => {
    const b = e.target.closest('[data-font]'); if(!b) return;
    selObjs().filter(x => x.type === 'text').forEach(x => { x.font = b.dataset.font; ensureFont(x); fitTextHeight(x); touch(x); });
    lst.querySelectorAll('.fp-i').forEach(x => x.classList.toggle('on', x === b));
    commit(); requestRender(); positionTextEdit();
    const fb = document.querySelector('.font-btn'); if(fb){ fb.textContent = b.dataset.font; fb.style.fontFamily = "'" + b.dataset.font + "'"; }
  });
  lst.addEventListener('mouseover', e => {
    const b = e.target.closest('[data-font]'); if(!b) return;
    if(document.fonts) document.fonts.load('400 40px "' + b.dataset.font + '"').catch(() => {});
  });
  const away = e => { if(!el.contains(e.target) && !anchor.contains(e.target)) closePop(); };
  setTimeout(() => { document.addEventListener('mousedown', away, true); inp.focus(); const on = lst.querySelector('.on'); if(on) on.scrollIntoView({block:'center'}); }, 0);
  _pop = {el, away};
}

/* ---------- Volet de droite ---------- */
function renderSide(){
  const side = document.getElementById('side'); if(!side || !S.doc) return;
  const body = side.querySelector('.side-body');
  const st = body ? body.scrollTop : 0;
  const tab = S.rtab;
  side.innerHTML = `<div class="side-tabs">${seg([['props', L('Réglages','Settings')], ['layers', L('Calques','Layers') + ' <b>' + S.doc.objects.length + '</b>']], tab, 'rtab')}</div>
    <div class="side-body">${tab === 'layers' ? layersHtml() : propsHtml()}</div>`;
  syncFields();
  const nb = side.querySelector('.side-body'); if(nb) nb.scrollTop = st;
  if(tab === 'layers') attachLayerDnD();
  renderBrushPreview();
}
function renderLayersIfOpen(){
  if(S.rtab !== 'layers') return;
  const b = document.querySelector('#side .side-body'); if(!b) return;
  const st = b.scrollTop; b.innerHTML = layersHtml(); b.scrollTop = st; attachLayerDnD();
  const t = document.querySelector('#side .side-tabs b'); if(t) t.textContent = S.doc.objects.length;
}
function propsHtml(){
  if(S.tool === 'brush') return brushPanel();
  if(S.tool === 'eraser') return eraserPanel();
  const sel = selObjs();
  if(!sel.length) return docPanel();
  if(sel.length > 1) return multiPanel(sel);
  return objPanel(sel[0]);
}
function brushTiles(){
  const types = [['round', L('Pinceau','Brush'), 'M6 30C16 10 26 34 36 16S52 10 58 22'], ['marker', L('Feutre biseauté','Chisel marker'), 'M6 30C16 10 26 34 36 16S52 10 58 22'],
    ['spray', L('Aérographe','Airbrush'), 'M6 30C16 10 26 34 36 16S52 10 58 22'], ['neon', L('Néon','Neon'), 'M6 30C16 10 26 34 36 16S52 10 58 22']];
  return `<div class="btiles">${types.map(t => `<button class="bt ${S.brush.tool===t[0]?'on':''}" data-act="brushType" data-id="${t[0]}"><canvas width="128" height="80" data-bprev="${t[0]}"></canvas><span>${t[1]}</span></button>`).join('')}</div>`;
}
function renderBrushPreview(){
  document.querySelectorAll('canvas[data-bprev]').forEach(c => {
    const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
    const pts = []; for(let i = 0; i <= 40; i++){ const t = i/40; pts.push(14 + t*100, 40 + Math.sin(t*Math.PI*2)*18, 0.5); }
    const dark = isDarkTheme(); const col = S.brush.color;
    const shown = (isLight(col) && !dark) ? '#23262E' : (!isLight(col) || dark ? col : col);
    drawStroke(g, {tool:c.dataset.bprev, color:shown, size:c.dataset.bprev === 'spray' ? 22 : 10, opacity:1, seed:5, pts}, 1);
  });
}
function quickSwatches(target){
  const cols = ['#FFFFFF','#0B0B10','#D9363E','#F0646B','#5E1418','#3699D4','#F2C94C','#F2994A','#2F9E44','#8E5BD6','#E86FB0'];
  return `<div class="qsw">${cols.map(c => `<button style="--c:${c}" class="${toHex(S.brush.color).toUpperCase()===c?'on':''}" data-act="brushColor" data-id="${c}" title="${c}"></button>`).join('')}${swatchBtn(S.brush.color, `data-act="pickColor" data-bind-color="color" data-target="${target}"`)}</div>`;
}
function brushPanel(){
  const s = sel1();
  const where = s && s.type === 'draw' ? L('Tu dessines dans le calque sélectionné.','You’re drawing on the selected layer.') : L('Chaque nouveau dessin crée son propre calque, que tu peux ensuite déplacer, agrandir ou effacer.','Each new drawing gets its own layer, which you can then move, resize or erase.');
  return `<div class="ph"><span class="ph-ico">${icon('brush')}</span><div><b>${L('Pinceau','Brush')}</b><small>${where}</small></div></div>` +
    sec('brush', L('Pointe','Tip'), brushTiles() +
      fRange(L('Taille','Size'), 'size', 1, 400, 1, {target:'brush', unit:'px'}) +
      fRange(L('Opacité','Opacity'), 'opacity', 5, 100, 1, {target:'brush', mul:100, unit:'%'}) +
      fRange(L('Lissage','Smoothing'), 'smooth', 0, 95, 1, {target:'brush', unit:'%'})) +
    sec('fill', L('Couleur','Colour'), quickSwatches('brush')) +
    `<div class="hint">${icon('bulb')}<span>${L('<b>[</b> et <b>]</b> changent la taille. Avec un stylet, la pression fait varier l’épaisseur. <b>Espace</b> + glisser pour te déplacer.','<b>[</b> and <b>]</b> change the size. With a stylus, pressure changes the thickness. Hold <b>Space</b> and drag to move around.')}</span></div>` +
    `<div class="pbtns"><button class="btn btn-sm" data-act="newDrawLayer">${icon('plus')} ${L('Nouveau calque de dessin','New drawing layer')}</button><button class="btn btn-sm" data-act="tool" data-id="select">${icon('cursor')} ${L('Terminer','Done')}</button></div>`;
}
function eraserPanel(){
  const s = sel1();
  return `<div class="ph"><span class="ph-ico">${icon('eraser')}</span><div><b>${L('Gomme','Eraser')}</b><small>${s ? L('Elle efface sur « ','It erases on “') + esc(typeLabel(s)) + L(' ».','”.') : L('Elle efface l’élément que tu touches : photo, texte, forme ou dessin.','It erases the element you touch: photo, text, shape or drawing.')}</small></div></div>` +
    sec('brush', L('Gomme','Eraser'),
      fRange(L('Taille','Size'), 'size', 2, 600, 1, {target:'eraser', unit:'px'}) +
      fRange(L('Force','Strength'), 'opacity', 5, 100, 1, {target:'eraser', mul:100, unit:'%'})) +
    `<div class="hint">${icon('bulb')}<span>${L('Rien n’est perdu : sélectionne l’élément et choisis « Restaurer ce qui a été gommé » pour tout récupérer.','Nothing is lost: select the element and choose “Restore what was erased” to get everything back.')}</span></div>` +
    `<div class="pbtns"><button class="btn btn-sm" data-act="tool" data-id="select">${icon('cursor')} ${L('Terminer','Done')}</button></div>`;
}
function docPanel(){
  const d = S.doc, ph = physInches(d.phys);
  return `<div class="ph"><span class="ph-ico">${icon('poster')}</span><div><b>${L('L’affiche','The poster')}</b><small>${esc(formatLabel(d))} · ${d.w} × ${d.h}${ph ? ' · ' + L('impression jusqu’à ','print up to ') + fmtNum(ph.w*300) + ' × ' + fmtNum(ph.h*300) + ' px' : ''}</small></div></div>` +
    `<div class="pbtns"><button class="btn btn-sm" data-act="openFormat">${icon('ratio')} ${L('Changer le format','Change size')}</button><button class="btn btn-sm" data-act="flyout" data-id="templates">${icon('templates')} ${L('Modèles','Templates')}</button></div>` +
    sec('bg', L('Fond','Background'), paintEditor('bg', 'doc', d.bg)) +
    sec('fx', L('Ambiance cinéma','Film look'),
      fRange(L('Grain de pellicule','Film grain'), 'fx.grain', 0, 100, 1, {target:'doc', unit:'%'}) +
      fRange(L('Vignettage','Vignette'), 'fx.vignette', 0, 100, 1, {target:'doc', unit:'%'}) +
      fColor(L('Couleur du vignettage','Vignette colour'), 'fx.vignetteColor', 'doc')) +
    sec('aids', L('Aides à la composition','Layout aids'),
      fToggle(L('Magnétisme (centres et bords)','Snapping (centres and edges)'), 'snap', {target:'S'}) +
      fToggle(L('Grille des tiers','Rule-of-thirds grid'), 'grid', {target:'S'}) +
      fToggle(L('Marges de sécurité','Safe margins'), 'safe', {target:'S'})) +
    `<div class="hint">${icon('bulb')}<span>${L('Clique sur un élément pour le régler. Double-clique sur un texte pour l’écrire, sur un cadre photo pour y mettre une image.','Click an element to adjust it. Double-click a text to type, or a photo frame to put an image in it.')}</span></div>`;
}
function alignRow(){
  return `<div class="irow">${iconBtn('align','alignL',L('Aligner à gauche','Align left'),'l')}${iconBtn('align','alignCH',L('Centrer horizontalement','Centre horizontally'),'ch')}${iconBtn('align','alignR',L('Aligner à droite','Align right'),'r')}<span class="irow-sep"></span>${iconBtn('align','alignT',L('Aligner en haut','Align top'),'t')}${iconBtn('align','alignCV',L('Centrer verticalement','Centre vertically'),'cv')}${iconBtn('align','alignB',L('Aligner en bas','Align bottom'),'b')}</div>`;
}
function objActions(o){
  return `<div class="irow acts">${iconBtn('duplicate','copy',L('Dupliquer (Ctrl+D)','Duplicate (Ctrl+D)'))}${iconBtn('arrange','top',L('Premier plan','Bring to front'),'front')}${iconBtn('arrange','up',L('Avancer','Bring forward'),'up')}${iconBtn('arrange','down',L('Reculer','Send backward'),'down')}${iconBtn('arrange','bottom',L('Arrière-plan','Send to back'),'back')}<span class="irow-sep"></span>${iconBtn('toggleLock', o.locked?'lock':'unlock', o.locked?L('Déverrouiller','Unlock'):L('Verrouiller','Lock'), o.id, o.locked)}${iconBtn('toggleVis', o.visible?'eye':'eyeoff', o.visible?L('Masquer','Hide'):L('Afficher','Show'), o.id, !o.visible)}${iconBtn('deleteSel','trash',L('Supprimer (Suppr)','Delete (Del)'))}</div>`;
}
function typeIcon(o){
  return {text:'typeT', image:'image', draw:'brush', path:'sparkles', shape:o.shape === 'ellipse' ? 'ellipse' : o.shape === 'line' ? 'line' : o.shape === 'star' ? 'star' : o.shape === 'triangle' ? 'triangle' : o.shape === 'polygon' ? 'polygon' : 'rect'}[o.type] || 'shapes';
}
function objPanel(o){
  let h = `<div class="ph"><span class="ph-ico">${icon(typeIcon(o))}</span><div class="ph-name"><input type="text" data-bind="name" placeholder="${esc(typeLabel(Object.assign({}, o, {name:''})))}" spellcheck="false"><small>${L('Nom du calque','Layer name')}</small></div></div>` + objActions(o);
  if(o.locked) h += `<div class="hint warn">${icon('lock')}<span>${L('Cet élément est verrouillé : il ne bouge plus. Clique sur le cadenas pour le libérer.','This element is locked: it won’t move. Click the padlock to free it.')}</span></div>`;
  // contenu propre au type
  if(o.type === 'text') h += textSection(o);
  if(o.type === 'image') h += imageSection(o);
  if(o.type === 'shape') h += shapeSection(o);
  if(o.type === 'path') h += sec('fill', L('Couleur','Colour'), paintEditor('fill', '', o.fill) + strokeFields());
  if(o.type === 'draw') h += sec('fill', L('Dessin','Drawing'), `<p class="pnote">${o.strokes.filter(s => s.tool !== 'erase').length} ${L('traits','strokes')}</p><div class="pbtns"><button class="btn btn-sm btn-primary" data-act="tool" data-id="brush">${icon('brush')} ${L('Continuer à dessiner','Keep drawing')}</button><button class="btn btn-sm" data-act="recolorDraw">${icon('palette')} ${L('Tout recolorer','Recolour all')}</button></div>`);
  h += sec('pos', L('Position et taille','Position & size'),
    `<div class="g2">${fNum('X','x')}${fNum('Y','y')}${fNum(L('L','W'),'w',{ratio:o.type!=='shape'&&o.type!=='text'})}${o.type==='text' ? `<label class="fnum dis"><span>H</span><input type="number" data-bind="h" data-dec="0" disabled></label>` : fNum('H','h',{ratio:o.type!=='shape'})}</div>` +
    fRange(L('Rotation','Rotation'), 'rot', -180, 180, 1, {unit:'°'}) +
    `<div class="irow">${iconBtn('flip','flipH',L('Retourner horizontalement','Flip horizontally'),'x', o.flipX)}${iconBtn('flip','flipV',L('Retourner verticalement','Flip vertically'),'y', o.flipY)}<span class="irow-sep"></span><span class="irow-l">${L('Sur l’affiche','On poster')}</span></div>` + alignRow());
  h += effectsSection(o);
  if(o.mask && o.mask.strokes && o.mask.strokes.length) h += `<div class="pbtns"><button class="btn btn-sm" data-act="clearMask">${icon('undo')} ${L('Restaurer ce qui a été gommé','Restore what was erased')}</button></div>`;
  return h;
}
function strokeFields(){
  const o = sel1() || {};
  return fToggle(L('Contour','Outline'), 'stroke.on') + (o.stroke && o.stroke.on ? fColor(L('Couleur du contour','Outline colour'), 'stroke.color') + fRange(L('Épaisseur','Thickness'), 'stroke.width', 0, 120, 0.5, {unit:'px', nstep:1}) : '');
}
function textSection(o){
  const weights = [[100,L('Fine','Thin')],[200,L('Très légère','Extra light')],[300,L('Légère','Light')],[400,L('Normale','Regular')],[500,L('Moyenne','Medium')],[600,L('Demi-grasse','Semi bold')],[700,L('Grasse','Bold')],[800,L('Très grasse','Extra bold')],[900,L('Noire','Black')]];
  return sec('text', L('Texte','Text'),
    `<textarea class="ptext" data-bind="text" rows="3" spellcheck="true"></textarea>
     <button class="font-btn" data-act="fontPicker" style="font-family:'${esc(o.font)}', Inter, sans-serif">${esc(o.font)}</button>
     <div class="g2">${fNum(L('Taille','Size'),'size',{unit:'px'})}<label class="fnum"><span>${L('Graisse','Weight')}</span><select data-bind="weight" data-num="1">${weights.map(w => `<option value="${w[0]}">${w[1]}</option>`).join('')}</select></label></div>
     <div class="irow">${seg([['left',icon('alignL'),L('À gauche','Left')],['center',icon('alignCH'),L('Centré','Centred')],['right',icon('alignR'),L('À droite','Right')]], o.align, 'textAlign')}<span class="irow-sep"></span>${iconBtn('textToggle','typeT',L('Italique','Italic'),'italic',o.italic).replace('</svg>','</svg><i class="lt">I</i>')}${iconBtn('textToggle','typeT',L('Majuscules','Uppercase'),'upper',o.upper).replace('</svg>','</svg><i class="lt">AA</i>')}</div>
     ${fRange(L('Interligne','Line height'), 'lineHeight', 0.6, 2.5, 0.01, {dec:2})}
     ${fRange(L('Espacement des lettres','Letter spacing'), 'letterSpacing', -100, 1000, 5)}`) +
    sec('fill', L('Couleur et contour','Colour & outline'), paintEditor('fill', '', o.fill) + strokeFields()) +
    sec('glow', L('Lueur néon','Neon glow'), fToggle(L('Lueur','Glow'), 'glow.on') + (o.glow && o.glow.on ? fColor(L('Couleur','Colour'), 'glow.color') + fRange(L('Rayonnement','Spread'), 'glow.blur', 0, 300, 1, {unit:'px'}) : ''));
}
function shapeSection(o){
  let x = '';
  if(o.shape === 'rect') x += fRange(L('Coins arrondis','Rounded corners'), 'radius', 0, Math.round(Math.min(o.w, o.h)/2), 1, {unit:'px'});
  if(o.shape === 'star') x += fRange(L('Branches','Points'), 'points', 3, 40, 1) + fRange(L('Creux','Inner radius'), 'inner', 5, 100, 1, {mul:100, unit:'%'});
  if(o.shape === 'polygon') x += fRange(L('Côtés','Sides'), 'sides', 3, 24, 1);
  if(o.shape === 'line') x += fToggle(L('Pointe de flèche','Arrowhead'), 'arrow');
  return sec('shape', L('Forme','Shape'), x + paintEditor('fill', '', o.fill) + strokeFields());
}
function imageSection(o){
  if(!o.asset){
    return sec('image', L('Cadre photo','Photo frame'), `<p class="pnote">${L('Ce cadre attend une image : elle le remplira sans être déformée.','This frame is waiting for an image: it will fill it without being stretched.')}</p><div class="pbtns"><button class="btn btn-sm btn-primary" data-act="replaceImage">${icon('upload')} ${L('Choisir une image','Choose an image')}</button></div>` +
      fToggle(L('Forme ronde','Round shape'), 'ellipse') + fRange(L('Coins arrondis','Rounded corners'), 'radius', 0, Math.round(Math.min(o.w, o.h)/2), 1, {unit:'px'}));
  }
  const im = IMG[o.asset];
  const res = im ? Math.round(im.naturalWidth) + ' × ' + Math.round(im.naturalHeight) + ' px' : '';
  return sec('image', L('Image','Image'),
    `<p class="pnote">${L('Originale : ','Original: ')}${res}</p>
     <div class="pbtns"><button class="btn btn-sm" data-act="replaceImage">${icon('upload')} ${L('Remplacer','Replace')}</button><button class="btn btn-sm" data-act="coverDoc">${icon('fit')} ${L('Remplir l’affiche','Fill poster')}</button><button class="btn btn-sm" data-act="containDoc">${icon('ratio')} ${L('Tout montrer','Fit inside')}</button></div>`) +
    sec('filters', L('Réglages photo','Photo adjustments'),
      fRange(L('Luminosité','Brightness'), 'filters.brightness', 0, 200, 1, {unit:'%'}) +
      fRange(L('Contraste','Contrast'), 'filters.contrast', 0, 200, 1, {unit:'%'}) +
      fRange(L('Saturation','Saturation'), 'filters.saturate', 0, 300, 1, {unit:'%'}) +
      fRange(L('Teinte','Hue'), 'filters.hue', -180, 180, 1, {unit:'°'}) +
      fRange(L('Noir et blanc','Black & white'), 'filters.grayscale', 0, 100, 1, {unit:'%'}) +
      fRange(L('Sépia','Sepia'), 'filters.sepia', 0, 100, 1, {unit:'%'}) +
      fRange(L('Négatif','Invert'), 'filters.invert', 0, 100, 1, {unit:'%'}) +
      fRange(L('Flou','Blur'), 'filters.blur', 0, 60, 0.5, {unit:'px'}) +
      `<div class="pbtns"><button class="btn btn-sm btn-ghost" data-act="resetFilters">${icon('undo')} ${L('Réinitialiser','Reset')}</button></div>` +
      (HAS_FILTER ? '' : `<p class="pnote">${L('Ce navigateur n’applique pas les réglages photo ; Chrome, Edge ou Firefox les appliquent.','This browser doesn’t apply photo adjustments; Chrome, Edge or Firefox do.')}</p>`)) +
    sec('tint', L('Teinte de couleur','Colour tint'), fToggle(L('Teinter l’image','Tint the image'), 'tint.on') + (o.tint && o.tint.on ? fColor(L('Couleur','Colour'), 'tint.color') + fRange(L('Intensité','Strength'), 'tint.amount', 0, 100, 1, {unit:'%'}) : '')) +
    sec('fade', L('Fondu des bords','Edge fade'),
      fRange(L('Haut','Top'), 'fade.top', 0, 100, 1, {unit:'%'}) + fRange(L('Bas','Bottom'), 'fade.bottom', 0, 100, 1, {unit:'%'}) +
      fRange(L('Gauche','Left'), 'fade.left', 0, 100, 1, {unit:'%'}) + fRange(L('Droite','Right'), 'fade.right', 0, 100, 1, {unit:'%'})) +
    sec('crop', L('Recadrage et forme','Crop & shape'),
      fRange(L('Rogner à gauche','Crop left'), 'crop.l', 0, 45, 0.5, {mul:100, unit:'%', dec:1}) + fRange(L('Rogner à droite','Crop right'), 'crop.r', 0, 45, 0.5, {mul:100, unit:'%', dec:1}) +
      fRange(L('Rogner en haut','Crop top'), 'crop.t', 0, 45, 0.5, {mul:100, unit:'%', dec:1}) + fRange(L('Rogner en bas','Crop bottom'), 'crop.b', 0, 45, 0.5, {mul:100, unit:'%', dec:1}) +
      fToggle(L('Forme ronde','Round shape'), 'ellipse') + fRange(L('Coins arrondis','Rounded corners'), 'radius', 0, Math.round(Math.min(o.w, o.h)/2), 1, {unit:'px'}) + strokeFields());
}
function effectsSection(o){
  return sec('effects', L('Effets','Effects'),
    fRange(L('Opacité','Opacity'), 'opacity', 0, 100, 1, {mul:100, unit:'%'}) +
    fSelect(L('Fusion','Blending'), 'blend', BLENDS.map(b => [b[0], L(b[1], b[2])])) +
    fToggle(L('Ombre portée','Drop shadow'), 'shadow.on') +
    (o.shadow && o.shadow.on ? fColor(L('Couleur de l’ombre','Shadow colour'), 'shadow.color') + fRange(L('Flou','Blur'), 'shadow.blur', 0, 300, 1, {unit:'px'}) +
      `<div class="g2">${fNum(L('Décalage X','Offset X'),'shadow.x')}${fNum(L('Décalage Y','Offset Y'),'shadow.y')}</div>` : ''));
}
function multiPanel(sel){
  return `<div class="ph"><span class="ph-ico">${icon('group')}</span><div><b>${sel.length} ${L('éléments sélectionnés','elements selected')}</b><small>${L('Ils bougent, s’agrandissent et s’alignent ensemble.','They move, resize and align together.')}</small></div></div>` +
    `<div class="irow acts">${iconBtn('duplicate','copy',L('Dupliquer','Duplicate'))}${iconBtn('arrange','top',L('Premier plan','Bring to front'),'front')}${iconBtn('arrange','bottom',L('Arrière-plan','Send to back'),'back')}<span class="irow-sep"></span>${iconBtn('deleteSel','trash',L('Supprimer','Delete'))}</div>` +
    sec('pos', L('Aligner entre eux','Align together'), alignRow() + `<div class="irow">${iconBtn('distribute','distH',L('Répartir horizontalement','Distribute horizontally'),'h')}${iconBtn('distribute','distV',L('Répartir verticalement','Distribute vertically'),'v')}<span class="irow-l">${L('Répartir (3 éléments ou plus)','Distribute (3 or more)')}</span></div>`) +
    sec('effects', L('Effets','Effects'), fRange(L('Opacité','Opacity'), 'opacity', 0, 100, 1, {mul:100, unit:'%'}));
}

/* ---------- Calques ---------- */
function layersHtml(){
  const objs = S.doc.objects.slice().reverse();
  if(!objs.length) return `<div class="empty-l">${icon('layers')}<p>${L('Aucun calque pour l’instant. Ajoute un texte, une image ou dessine : chaque élément apparaît ici.','No layers yet. Add a text, an image or draw: every element shows up here.')}</p></div>`;
  return `<div class="layers">${objs.map(o => `<div class="lr ${S.sel.includes(o.id)?'on':''} ${o.visible?'':'off'}" draggable="true" data-lid="${o.id}">
      <span class="lr-ico">${icon(typeIcon(o))}</span>
      <span class="lr-name" title="${L('Double-clique pour renommer','Double-click to rename')}">${esc(typeLabel(o))}</span>
      <button class="ib sm ${o.locked?'on':''}" data-act="toggleLock" data-id="${o.id}" title="${o.locked?L('Déverrouiller','Unlock'):L('Verrouiller','Lock')}">${icon(o.locked?'lock':'unlock')}</button>
      <button class="ib sm" data-act="toggleVis" data-id="${o.id}" title="${o.visible?L('Masquer','Hide'):L('Afficher','Show')}">${icon(o.visible?'eye':'eyeoff')}</button>
    </div>`).join('')}</div><p class="pnote center">${L('Glisse les calques pour changer leur ordre. Le plus haut passe devant.','Drag layers to reorder them. The top one is in front.')}</p>`;
}
function attachLayerDnD(){
  const list = document.querySelector('#side .layers'); if(!list) return;
  let dragId = null;
  list.querySelectorAll('.lr').forEach(row => {
    row.addEventListener('click', e => {
      if(e.target.closest('button')) return;
      const id = row.dataset.lid;
      if(e.shiftKey || e.ctrlKey || e.metaKey) setSel(S.sel.includes(id) ? S.sel.filter(x => x !== id) : S.sel.concat(id), true);
      else setSel([id], true);
    });
    row.addEventListener('dblclick', async e => {
      if(e.target.closest('button')) return;
      const o = objById(row.dataset.lid); if(!o) return;
      const v = await rdPrompt(L('Renommer le calque','Rename layer'), typeLabel(o));
      if(v != null){ o.name = v.trim(); commit(); renderLayersIfOpen(); }
    });
    row.addEventListener('dragstart', e => { dragId = row.dataset.lid; row.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; try{ e.dataTransfer.setData('text/plain', dragId); }catch(err){} });
    row.addEventListener('dragend', () => { row.classList.remove('drag'); list.querySelectorAll('.lr').forEach(r => r.classList.remove('dt','db')); });
    row.addEventListener('dragover', e => {
      if(!dragId) return; e.preventDefault();
      const r = row.getBoundingClientRect(), before = e.clientY < r.top + r.height/2;
      list.querySelectorAll('.lr').forEach(x => x.classList.remove('dt','db'));
      row.classList.add(before ? 'dt' : 'db');
    });
    row.addEventListener('drop', e => {
      e.preventDefault();
      if(!dragId || dragId === row.dataset.lid) return;
      const r = row.getBoundingClientRect(), before = e.clientY < r.top + r.height/2;
      const arr = S.doc.objects, mv = arr.find(o => o.id === dragId);
      const rest = arr.filter(o => o.id !== dragId);
      let idx = rest.findIndex(o => o.id === row.dataset.lid);
      // la liste est affichée du haut (devant) vers le bas (derrière)
      if(before) idx += 1;
      rest.splice(idx, 0, mv);
      S.doc.objects = rest; dragId = null;
      commit(); renderLayersIfOpen(); requestRender();
    });
  });
}

/* ---------- Volet « Créer » ---------- */
function renderFlyoutIf(id){ if(S.flyout === id) renderFlyout(); }
function renderFlyout(){
  const el = document.getElementById('flyout'); if(!el) return;
  document.querySelectorAll('.rail-item[data-act="flyout"]').forEach(r => r.classList.toggle('active', r.dataset.id === S.flyout));
  if(!S.flyout){ el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  const titles = {templates:L('Modèles','Templates'), text:L('Textes','Text'), shapes:L('Formes','Shapes'), decors:L('Décors','Decor'), images:L('Images','Images'), draw:L('Dessin','Drawing')};
  const body = {templates:flyTemplates, text:flyText, shapes:flyShapes, decors:flyDecors, images:flyImages, draw:flyDraw}[S.flyout]();
  el.innerHTML = `<div class="fly-h"><b>${titles[S.flyout]}</b><button class="ib" data-act="closeFlyout" title="${L('Fermer','Close')}">${icon('close')}</button></div><div class="fly-b">${body}</div>`;
  if(S.flyout === 'templates') paintTemplateThumbs();
  if(S.flyout === 'draw'){ syncFields(); renderBrushPreview(); }
}
function flyTemplates(){
  return `<p class="fly-note">${L('Un point de départ, entièrement modifiable. Les cadres photo attendent tes images.','A starting point, fully editable. Photo frames are waiting for your images.')}</p>
    <div class="tgrid">${TEMPLATES.map(t => `<button class="tcard" data-act="applyTemplate" data-id="${t.id}"><span class="tthumb" data-tpl="${t.id}" style="aspect-ratio:${S.doc.w}/${S.doc.h}"></span><span>${L(t.fr, t.en)}</span></button>`).join('')}</div>`;
}
const _tplCache = {};
function paintTemplateThumbs(){
  const d = S.doc;
  document.querySelectorAll('[data-tpl]').forEach(el => {
    const id = el.dataset.tpl, key = id + '|' + d.w + 'x' + d.h + '|' + getLang();
    const put = url => { el.style.backgroundImage = 'url(' + url + ')'; };
    if(_tplCache[key]){ put(_tplCache[key]); return; }
    const tmp = newDoc('', {id:d.format, w:d.w, h:d.h, phys:d.phys}, id);
    loadDocFonts(tmp).then(() => {
      try{ const url = renderThumb(tmp, 220, 300).toDataURL('image/jpeg', .85); _tplCache[key] = url; put(url); }catch(e){}
    });
  });
}
function flyText(){
  const P = textPresets();
  return `<div class="tadd">
      <button class="tbig" data-act="addTextKind" data-id="title"><span style="font-family:'Bebas Neue';font-size:30px;letter-spacing:.04em">${L('AJOUTER UN TITRE','ADD A TITLE')}</span></button>
      <button class="tbig" data-act="addTextKind" data-id="tagline"><span style="font-family:'Cormorant Garamond';font-style:italic;font-weight:600;font-size:20px">${L('Ajouter un slogan','Add a tagline')}</span></button>
      <button class="tbig" data-act="addTextKind" data-id="body"><span style="font-family:Inter;font-size:14px">${L('Ajouter un paragraphe','Add a paragraph')}</span></button>
    </div>
    <div class="fly-lbl">${L('Éléments d’affiche','Poster elements')}</div>
    <div class="plist">${P.filter(p => !['title','tagline','body'].includes(p.id)).map(p => `<button class="pitem" data-act="addTextKind" data-id="${p.id}">${presetPreview(p.id)}<span>${L(p.fr, p.en)}</span></button>`).join('')}</div>
    <p class="fly-note">${L('Astuce : avec l’outil Texte (T), clique n’importe où sur l’affiche pour écrire.','Tip: with the Text tool (T), click anywhere on the poster to type.')}</p>`;
}
function presetPreview(id){
  const m = {
    actors:`<i style="font-family:Oswald;letter-spacing:.12em;font-size:11px">${L('PRÉNOM NOM','FIRST LAST')}</i>`,
    billing:`<i style="font-family:'League Gothic';font-size:12px;line-height:1;letter-spacing:.03em">${L('UN FILM DE PRÉNOM NOM AVEC…','A FIRST LAST FILM STARRING…')}</i>`,
    date:`<i style="font-family:Oswald;font-weight:700;letter-spacing:.08em;font-size:12px">${L('LE 12 MARS','MARCH 12')}</i>`,
    soon:`<i style="font-family:'Bebas Neue';letter-spacing:.3em;font-size:14px;color:var(--accent)">${L('PROCHAINEMENT','COMING SOON')}</i>`,
    quote:`<i style="font-family:'Playfair Display';font-style:italic;font-weight:700;font-size:13px">★★★★★</i>`,
    laurels:`<i>${icon('laurel')}</i>`,
    rating:`<i style="font-family:Oswald;font-weight:700;border:1.5px solid currentColor;border-radius:2px;padding:0 4px;font-size:11px">-12</i>`,
    hand:`<i style="font-family:'Permanent Marker';font-size:14px">${L('Signé…','Signed…')}</i>`
  };
  return `<span class="pprev">${m[id]||''}</span>`;
}
function flyShapes(){
  const sh = [['rect',L('Rectangle','Rectangle'),'rect'],['round',L('Arrondi','Rounded'),'rect'],['ellipse',L('Cercle','Circle'),'ellipse'],['triangle',L('Triangle','Triangle'),'triangle'],
    ['star',L('Étoile','Star'),'star'],['polygon',L('Polygone','Polygon'),'polygon'],['line',L('Trait','Line'),'line'],['arrow',L('Flèche','Arrow'),'arrow']];
  return `<div class="sgrid">${sh.map(s => `<button class="scard" data-act="addShape" data-id="${s[0]}">${icon(s[2])}<span>${s[1]}</span></button>`).join('')}</div>
    <div class="fly-lbl">${L('Dégradés et voiles','Gradients & overlays')}</div>
    <div class="ogrid">
      <button class="ocard" data-act="addOverlay" data-id="bottom"><i style="background:linear-gradient(180deg,transparent,#000)"></i><span>${L('Fondu en bas','Bottom fade')}</span></button>
      <button class="ocard" data-act="addOverlay" data-id="top"><i style="background:linear-gradient(0deg,transparent,#000)"></i><span>${L('Fondu en haut','Top fade')}</span></button>
      <button class="ocard" data-act="addOverlay" data-id="tint"><i style="background:#1F6FA0;opacity:.75"></i><span>${L('Voile de couleur','Colour wash')}</span></button>
      <button class="ocard" data-act="addOverlay" data-id="leak"><i style="background:radial-gradient(circle at 80% 15%,#F2994A,transparent 60%),#111"></i><span>${L('Halo de lumière','Light leak')}</span></button>
      <button class="ocard" data-act="addOverlay" data-id="bars"><i style="background:linear-gradient(180deg,#000 0 18%,#777 18% 82%,#000 82%)"></i><span>${L('Bandes cinéma','Letterbox')}</span></button>
      <button class="ocard" data-act="addOverlay" data-id="duo"><i style="background:linear-gradient(135deg,#3699D4,#E86FB0)"></i><span>${L('Duo de couleurs','Duotone wash')}</span></button>
    </div>
    <p class="fly-note">${L('Astuce : avec R, O ou L, trace directement une forme sur l’affiche. Maj garde les proportions.','Tip: press R, O or L and draw a shape right on the poster. Shift keeps proportions.')}</p>`;
}
function decorSvg(id){
  const d = DECORS[id]();
  return `<svg viewBox="0 0 ${d.vw} ${d.vh}" preserveAspectRatio="xMidYMid meet"><path d="${d.d}" fill="currentColor" fill-rule="${d.rule||'nonzero'}"/></svg>`;
}
function flyDecors(){
  return `<div class="dgrid">${DECOR_LIST.map(d => `<button class="dcard" data-act="addDecor" data-id="${d[0]}">${decorSvg(d[0])}<span>${L(d[1], d[2])}</span></button>`).join('')}</div>
    <p class="fly-note">${L('Tous les décors sont vectoriels : ils restent parfaitement nets, même imprimés en très grand.','Every decor is vector: it stays perfectly sharp, even printed very large.')}</p>`;
}
function flyImages(){
  const used = [...new Set(S.doc.objects.filter(o => o.type === 'image' && o.asset).map(o => o.asset))];
  return `<button class="dropzone" data-act="addImage">${icon('upload')}<b>${L('Importer des images','Import images')}</b><span>${L('ou glisse-les sur l’affiche · JPG, PNG, WebP, SVG… en pleine résolution','or drag them onto the poster · JPG, PNG, WebP, SVG… at full resolution')}</span></button>
    <div class="fly-lbl">${L('Cadres photo','Photo frames')}</div>
    <div class="sgrid">
      <button class="scard" data-act="addFrame" data-id="full">${icon('poster')}<span>${L('Plein cadre','Full bleed')}</span></button>
      <button class="scard" data-act="addFrame" data-id="rect">${icon('image')}<span>${L('Rectangle','Rectangle')}</span></button>
      <button class="scard" data-act="addFrame" data-id="round">${icon('rect')}<span>${L('Arrondi','Rounded')}</span></button>
      <button class="scard" data-act="addFrame" data-id="circle">${icon('ellipse')}<span>${L('Rond','Circle')}</span></button>
    </div>
    ${used.length ? `<div class="fly-lbl">${L('Déjà dans cette affiche','Already in this poster')}</div><div class="igrid">${used.map(a => `<button class="icard" data-act="reuseImage" data-id="${a}" style="background-image:url(${S.doc.assets[a]})" title="${L('Ajouter à nouveau','Add again')}"></button>`).join('')}</div>` : ''}
    <p class="fly-note">${L('Astuce : colle une image avec Ctrl+V. Double-clique sur un cadre photo pour le remplir.','Tip: paste an image with Ctrl+V. Double-click a photo frame to fill it.')}</p>`;
}
function flyDraw(){
  return `<p class="fly-note">${L('Choisis une pointe puis dessine directement sur l’affiche.','Pick a tip and draw right on the poster.')}</p>` + brushTiles() +
    fRange(L('Taille','Size'), 'size', 1, 400, 1, {target:'brush', unit:'px'}) +
    fRange(L('Opacité','Opacity'), 'opacity', 5, 100, 1, {target:'brush', mul:100, unit:'%'}) +
    `<div class="fly-lbl">${L('Couleur','Colour')}</div>` + quickSwatches('brush') +
    `<div class="pbtns"><button class="btn btn-sm btn-primary" data-act="tool" data-id="brush">${icon('brush')} ${L('Dessiner','Draw')}</button><button class="btn btn-sm" data-act="tool" data-id="eraser">${icon('eraser')} ${L('Gommer','Erase')}</button></div>`;
}

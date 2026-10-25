/* =====================================================================
   RAGING DRAW — DÉMARRAGE ET ACTIONS
   Un seul écouteur pour tous les boutons (data-act), comme dans
   Raging Page.
===================================================================== */
function render(){
  closePop();
  const app = document.getElementById('app');
  document.title = S.view === 'editor' && S.doc ? S.doc.title + ' · Raging Draw' : L('Raging Draw : affiches de films','Raging Draw: film posters');
  if(S.view === 'editor' && S.doc){
    app.innerHTML = renderEditorShell();
    attachEditorEvents();
  }else{
    cv = null;
    app.innerHTML = renderHome();
    attachHomeEvents();
  }
}

const ACT = {
  setLang:el => setLang(el.dataset.id),
  toggleTheme:() => toggleTheme(),
  closeModal:() => closeModal(),
  nextTip:() => { homeTipK = (homeTipK + 1) % HOME_TIPS.length; const b = document.querySelector('.wd-tip'); if(b) b.outerHTML = homeTipHtml(); },
  openHelp:() => openHelp(),
  openCreate:() => openCreate(),
  crFmt:el => { CR.fmt = el.dataset.id; document.querySelectorAll('[data-act="crFmt"]').forEach(b => b.classList.toggle('active', b === el)); renderCreateTemplates(); },
  crTpl:el => { CR.tpl = el.dataset.id; document.querySelectorAll('[data-act="crTpl"]').forEach(b => b.classList.toggle('active', b === el)); },
  doCreate:() => doCreate(),
  openSample:() => openSample(),
  openPoster:el => openPoster(el.dataset.id),
  renamePoster:el => renamePoster(el.dataset.id),
  duplicatePoster:el => duplicatePoster(el.dataset.id),
  deletePoster:el => deletePoster(el.dataset.id),
  homeImportImage:() => homeImportImage(),
  homeOpenProject:() => homeOpenProject(),
  goHome:() => goHome(),
  undo:() => undo(),
  redo:() => redo(),
  zoomIn:() => zoomStep(1),
  zoomOut:() => zoomStep(-1),
  zoomFit:() => fitView(),
  tool:el => setTool(el.dataset.id),
  flyout:el => { S.flyout = S.flyout === el.dataset.id ? null : el.dataset.id; if(S.flyout === 'draw') setTool('brush'); renderFlyout(); },
  closeFlyout:() => { S.flyout = null; renderFlyout(); },
  docSettings:() => { if(S.tool !== 'select') setTool('select'); S.rtab = 'props'; OPEN.add('bg'); OPEN.add('fx'); setSel([]); },
  showLayers:() => { S.rtab = 'layers'; renderSide(); },
  rtab:el => { S.rtab = el.dataset.id; renderSide(); },
  toggleSec:el => {
    const id = el.dataset.id, s = el.closest('.ps');
    if(OPEN.has(id)) OPEN.delete(id); else OPEN.add(id);
    if(s) s.classList.toggle('open', OPEN.has(id));
  },
  openExport:() => openExport(),
  exFmt:el => { EX.fmt = el.dataset.id; if(EX.fmt === 'pdf' && exportPresets(S.doc).some(p => p.id === 'p300')) EX.q = 'p300'; refreshExport(); },
  exQ:el => { EX.q = el.dataset.id; refreshExport(); },
  doExport:() => doExport(),
  openFormat:() => openFormat(),
  pickFormat:el => { const f = formatById(el.dataset.id); if(f) applyFormat(f.id, f.w, f.h, f.phys); },
  applyCustomFormat:() => {
    const w = parseFloat(document.getElementById('fcW').value), h = parseFloat(document.getElementById('fcH').value), u = document.getElementById('fcU').value;
    if(!(w > 0 && h > 0)){ toast(L('Indique une largeur et une hauteur.','Enter a width and a height.'), 'warn'); return; }
    if(u === 'px' && (w > 20000 || h > 20000)){ toast(L('20 000 px maximum par côté.','20,000 px maximum per side.'), 'warn'); return; }
    const b = baseSizeFor(w, h, u);
    applyFormat('custom', b.w, b.h, b.phys);
  },
  // objets
  deleteSel:() => deleteSel(),
  duplicate:() => duplicateSel(),
  arrange:el => arrange(el.dataset.id),
  align:el => alignSel(el.dataset.id),
  distribute:el => distributeSel(el.dataset.id),
  flip:el => { selObjs().forEach(o => { if(el.dataset.id === 'x') o.flipX = !o.flipX; else o.flipY = !o.flipY; touch(o); }); commit(); renderSide(); requestRender(); },
  toggleLock:el => { const o = objById(el.dataset.id); if(!o) return; o.locked = !o.locked; commit(); renderSide(); requestRender(); },
  toggleVis:el => { const o = objById(el.dataset.id); if(!o) return; o.visible = !o.visible; commit(); renderSide(); requestRender(); },
  textAlign:el => { selObjs().forEach(o => { if(o.type === 'text'){ o.align = el.dataset.id; touch(o); } }); commit(); renderSide(); requestRender(); },
  textToggle:el => { const k = el.dataset.id; selObjs().forEach(o => { if(o.type === 'text'){ o[k] = !o[k]; ensureFont(o); fitTextHeight(o); touch(o); } }); commit(); renderSide(); requestRender(); },
  fontPicker:el => openFontPicker(el),
  clearMask:() => { selObjs().forEach(o => { o.mask = null; touch(o); }); commit(); renderSide(); requestRender(); toast(L('Tout ce qui avait été gommé est revenu.','Everything that was erased is back.')); },
  recolorDraw:el => {
    const o = sel1(); if(!o || o.type !== 'draw') return;
    const first = (o.strokes.find(s => s.tool !== 'erase') || {}).color || '#FFFFFF';
    openColorPicker(el, first, c => { o.strokes.forEach(s => { if(s.tool !== 'erase') s.color = c; }); touch(o); requestRender(); }, () => { commit(); renderSide(); });
  },
  resetFilters:() => { selObjs().forEach(o => { if(o.type === 'image'){ o.filters = {brightness:100, contrast:100, saturate:100, hue:0, blur:0, grayscale:0, sepia:0, invert:0}; touch(o); } }); commit(); renderSide(); requestRender(); },
  replaceImage:() => { const o = sel1(); if(o) pickImageFile(o); },
  coverDoc:() => { const o = sel1(); if(o && o.asset){ coverDoc(o, false); commit(); syncFields(); requestRender(); } },
  containDoc:() => { const o = sel1(); if(o && o.asset){ coverDoc(o, true); commit(); syncFields(); requestRender(); } },
  addImage:() => pickImageFile(null),
  reuseImage:el => {
    const im = IMG[el.dataset.id]; if(!im) return;
    const W = S.doc.w, H = S.doc.h, k = Math.min(W*.6/im.naturalWidth, H*.6/im.naturalHeight);
    addObjects([mkImage(el.dataset.id, W/2, H/2, im.naturalWidth*k, im.naturalHeight*k, im.naturalWidth, im.naturalHeight)]);
  },
  addFrame:el => {
    const W = S.doc.w, H = S.doc.h, u = Math.min(W, H), t = el.dataset.id;
    let o;
    if(t === 'full') o = mkImage(null, W/2, H/2, W, H, W, H);
    else if(t === 'circle') o = mkImage(null, W/2, H/2, u*.55, u*.55, u, u, {ellipse:true});
    else o = mkImage(null, W/2, H/2, W*.7, H*.45, W, H, {radius:t === 'round' ? u*.04 : 0});
    addObjects([o]);
  },
  addTextKind:el => {
    const p = textPresets().find(x => x.id === el.dataset.id); if(!p) return;
    const list = p.make(S.doc.w, S.doc.h);
    addObjects(list);
    if(list.length === 1 && list[0].type === 'text'){ setTool('select'); setSel([list[0].id]); }
  },
  addShape:el => {
    const W = S.doc.w, H = S.doc.h, u = Math.min(W, H), t = el.dataset.id;
    let o;
    if(t === 'round') o = mkShape('rect', W/2, H/2, u*.5, u*.32, {radius:u*.04});
    else if(t === 'line') o = mkShape('line', W/2, H/2, u*.5, Math.max(2, u*.006), {fill:solid('#FFFFFF')});
    else if(t === 'arrow') o = mkShape('line', W/2, H/2, u*.5, Math.max(3, u*.012), {arrow:true, fill:solid('#FFFFFF')});
    else o = mkShape(t, W/2, H/2, u*.4, u*.4);
    addObjects([o]);
  },
  addOverlay:el => {
    const W = S.doc.w, H = S.doc.h, t = el.dataset.id;
    const list = [];
    if(t === 'bottom') list.push(Object.assign(mkShape('rect', W/2, H*.75, W, H*.5, {fill:linear(180, [stop(0,'#00000000'), stop(1,'#000000F2')])}), {name:L('Fondu en bas','Bottom fade')}));
    if(t === 'top') list.push(Object.assign(mkShape('rect', W/2, H*.2, W, H*.4, {fill:linear(0, [stop(0,'#00000000'), stop(1,'#000000D9')])}), {name:L('Fondu en haut','Top fade')}));
    if(t === 'tint') list.push(Object.assign(mkShape('rect', W/2, H/2, W, H, {fill:solid('#1F6FA0'), blend:'multiply', opacity:.6}), {name:L('Voile de couleur','Colour wash')}));
    if(t === 'leak') list.push(Object.assign(mkShape('rect', W/2, H/2, W, H, {fill:radial([stop(0,'#F2994AE6'), stop(.45,'#D6454555'), stop(1,'#00000000')], .85, .12), blend:'screen'}), {name:L('Halo de lumière','Light leak')}));
    if(t === 'duo') list.push(Object.assign(mkShape('rect', W/2, H/2, W, H, {fill:linear(135, [stop(0,'#3699D4'), stop(1,'#E86FB0')]), blend:'color', opacity:.75}), {name:L('Duo de couleurs','Duotone wash')}));
    if(t === 'bars'){
      const bh = H*.12;
      list.push(Object.assign(mkShape('rect', W/2, bh/2, W, bh, {fill:solid('#000000')}), {name:L('Bande du haut','Top bar')}));
      list.push(Object.assign(mkShape('rect', W/2, H - bh/2, W, bh, {fill:solid('#000000')}), {name:L('Bande du bas','Bottom bar')}));
    }
    addObjects(list);
  },
  addDecor:el => addObjects([addDecorObj(el.dataset.id, S.doc.w, S.doc.h)]),
  applyTemplate:async el => {
    const d = S.doc;
    if(d.objects.length){
      const ok = await rdConfirm(L('Appliquer ce modèle ?','Apply this template?'), L('Il remplace le contenu actuel de l’affiche. Tu pourras revenir en arrière avec Ctrl+Z.','It replaces the poster’s current content. You can go back with Ctrl+Z.'), L('Appliquer','Apply'));
      if(!ok) return;
    }
    const t = newDoc(d.title, {id:d.format, w:d.w, h:d.h, phys:d.phys}, el.dataset.id);
    // les images déjà présentes remplissent les cadres photo du modèle
    const imgs = d.objects.filter(o => o.type === 'image' && o.asset);
    t.objects.filter(o => o.type === 'image').forEach((o, i) => { const src = imgs[i]; if(src) fillFrameWith(o, src.asset, src.nw, src.nh); });
    d.bg = t.bg; d.fx = t.fx; d.objects = t.objects;
    S.sel = [];
    loadDocFonts(d).then(() => requestRender());
    commit(); renderSide(); updateDocInfo(); requestRender();
  },
  newDrawLayer:() => { const o = mkDraw(S.doc.w/2, S.doc.h/2, S.doc.w, S.doc.h); insertObj(o, S.doc.objects.length); S.sel = [o.id]; renderSide(); renderLayersIfOpen(); toast(L('Nouveau calque de dessin : dessine !','New drawing layer: draw away!')); },
  brushType:el => { S.brush.tool = el.dataset.id; document.querySelectorAll('[data-act="brushType"]').forEach(b => b.classList.toggle('on', b.dataset.id === S.brush.tool)); if(S.tool !== 'brush') setTool('brush'); },
  brushColor:el => { S.brush.color = el.dataset.id; if(S.tool !== 'brush' && S.tool !== 'eraser') setTool('brush'); else renderSide(); renderFlyoutIf('draw'); },
  // couleurs et peintures
  pickColor:el => {
    const bind = el.dataset.bindColor, tg = el.dataset.target;
    const targets = tg === 'doc' ? [S.doc] : tg === 'brush' ? [S.brush] : selObjs();
    if(!targets.length) return;
    openColorPicker(el, getP(targets[0], bind) || '#000000', c => {
      targets.forEach(o => { setP(o, bind, c); if(o.type) touch(o); });
      const i = el.querySelector('i'), s = el.querySelector('span');
      if(i) i.style.setProperty('--c', c);
      if(s){ const a = Math.round(colorAlpha(c)*100); s.textContent = toHex(c).toUpperCase() + (a < 100 ? ' · ' + a + ' %' : ''); }
      requestRender(); positionTextEdit();
    }, () => { if(tg !== 'brush') commit(); else { renderSide(); renderFlyoutIf('draw'); } });
  },
  paintType:el => { const host = el; setPaintAll(host, p => p.type === el.dataset.id ? p : convertPaint(p, el.dataset.id)); commit(); renderSide(); },
  pickPaint:el => {
    const targets = bindTargets(el); if(!targets.length) return;
    const bind = el.dataset.pbind, si = +el.dataset.stop;
    const p0 = getP(targets[0], bind);
    const init = si < 0 ? p0.color : p0.stops[si].c;
    openColorPicker(el, init, c => {
      targets.forEach(o => { const p = getP(o, bind); if(si < 0) p.color = c; else if(p.stops[si]) p.stops[si].c = c; if(o.type) touch(o); });
      const i = el.querySelector('i'), s = el.querySelector('span');
      if(i) i.style.setProperty('--c', c);
      if(s){ const a = Math.round(colorAlpha(c)*100); s.textContent = toHex(c).toUpperCase() + (a < 100 ? ' · ' + a + ' %' : ''); }
      const bar = el.closest('.paint') && el.closest('.paint').querySelector('.gbar'); if(bar) bar.style.background = paintPreviewCss(getP(targets[0], bind));
      requestRender(); positionTextEdit();
    }, () => { commit(); });
  },
  addStop:el => { setPaintAll(el, p => { if(p.stops){ const a = p.stops[p.stops.length-1]; p.stops.push(stop(1, a.c)); const n = p.stops.length; p.stops.forEach((s, i) => s.o = round(i/(n-1), 3)); } return p; }); commit(); renderSide(); },
  delStop:el => { const i = +el.dataset.stop; setPaintAll(el, p => { if(p.stops && p.stops.length > 2) p.stops.splice(i, 1); return p; }); commit(); renderSide(); }
};
const ACT_INPUT = {
  stopPos:(el, done) => { const i = +el.dataset.stop; setPaintAll(el, p => { if(p.stops && p.stops[i]) p.stops[i].o = clamp(+el.value/100, 0, 1); return p; }); updGradBar(el); if(done) commit(); },
  gradAngle:(el, done) => { setPaintAll(el, p => { p.angle = clamp(+el.value || 0, 0, 360); return p; }); twin(el); updGradBar(el); if(done) commit(); },
  gradCx:(el, done) => { setPaintAll(el, p => { p.cx = clamp(+el.value/100, 0, 1); return p; }); twin(el); updGradBar(el); if(done) commit(); },
  gradCy:(el, done) => { setPaintAll(el, p => { p.cy = clamp(+el.value/100, 0, 1); return p; }); twin(el); updGradBar(el); if(done) commit(); }
};
function twin(el){ const row = el.closest('.fr'); if(row) row.querySelectorAll('input').forEach(x => { if(x !== el) x.value = el.value; }); }
function updGradBar(el){
  const pe = el.closest('.paint'), t = bindTargets(el)[0]; if(!pe || !t) return;
  const bar = pe.querySelector('.gbar'); if(bar) bar.style.background = paintPreviewCss(getP(t, el.dataset.pbind));
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if(!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if(!fn) return;
  if(el.dataset.stop) e.stopPropagation();
  e.preventDefault();
  fn(el, e);
});
document.addEventListener('keydown', e => {
  const el = e.target.closest && e.target.closest('[data-act][tabindex]');
  if(el && (e.key === 'Enter' || e.key === ' ') && ACT[el.dataset.act]){ e.preventDefault(); ACT[el.dataset.act](el, e); }
});
document.addEventListener('input', e => {
  const el = e.target;
  if(el.dataset && el.dataset.bind){ applyBind(el); return; }
  if(el.dataset && el.dataset.actInput && ACT_INPUT[el.dataset.actInput]) ACT_INPUT[el.dataset.actInput](el, false);
});
document.addEventListener('change', e => {
  const el = e.target;
  if(el.dataset && el.dataset.bind){
    if(el.type === 'checkbox' || el.tagName === 'SELECT') applyBind(el);
    const tg = el.dataset.target;
    if(tg === 'S' || tg === 'brush' || tg === 'eraser'){ requestRender(); return; }
    commit();
    // les cases à cocher font apparaître ou disparaître des réglages
    if(el.type === 'checkbox' || el.dataset.bind === 'blend') renderSide();
    return;
  }
  if(el.dataset && el.dataset.actInput && ACT_INPUT[el.dataset.actInput]) ACT_INPUT[el.dataset.actInput](el, true);
});
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
document.addEventListener('paste', onPaste);
window.addEventListener('resize', () => { if(S.view === 'editor') requestRender(); });
window.addEventListener('beforeunload', () => { if(S.view === 'editor' && S.doc) saveDoc(); });
if(document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => { if(S.view === 'editor'){ S.doc && S.doc.objects.forEach(o => { if(o.type === 'text') touch(o); }); requestRender(); } });

(async function boot(){
  document.documentElement.lang = getLang();
  await dbOpen();
  await refreshIndex();
  render();
  if(!Store.available()) toast(L('Ce navigateur ne permet pas d’enregistrer : exporte ton projet avant de fermer.','This browser can’t save: export your project before closing.'), 'warn');
})();

/* =====================================================================
   TITLE PAGE DESIGN
===================================================================== */
function renderTitlePageDesign(){
  const p = S.project;
  const dims = p.format==='us' ? '8.5 × 11 in · Letter' : '21 × 29,7 cm · A4';
  return `
  <div class="tp-root" id="tpRoot">
  <div class="cards-toolbar"><div class="pane-title" style="margin:0;">${L('Page de titre','Title page')}</div>
    <div class="tp-hd-r"><span style="font-size:13px;color:var(--ink-soft);">${L('N\u2019apparaît jamais dans le corps du scénario','Never appears in the body of the screenplay')}</span><button type="button" class="btn btn-sm" data-act="tpFullscreen" title="${L('Voir la page de titre seule, en plein écran','View the title page alone, full screen')}"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/></svg>${L('Plein écran','Full screen')}</button></div></div>
  <div class="tp-tb-wrap"><div class="tp-tb" id="tpToolbar"></div><div class="tp-pills" id="tpPills"></div></div>
  <div class="tp-design-wrap">
    <div class="tp-preview-col">
      <div class="tp-preview-mat"><div class="tp-preview-shell" id="tpPreviewShell"></div></div>
      <div class="tp-preview-caption"><span>${L('Aperçu à l\u2019échelle','Scaled preview')} · <b>${esc(dims)}</b></span><span>${L('Identique à ce que produira l\u2019export PDF','Identical to what the PDF export will produce')}</span></div>
    </div>
    <div class="tp-controls-col" id="tpControlsCol">${tpControlsHtml()}</div>
  </div>
  </div>`;
}
function tpControlsHtml(){
  const seg = [['content','doc',L('Contenu','Content')], ['bg','image',L('Fond','Background')], ['draw','pen',L('Dessin','Drawing')]];
  return `<div class="tp-seg" role="tablist">${seg.map(s=>`<button type="button" role="tab" class="tp-seg-b ${tpPane===s[0]?'on':''}" data-act="tpPanelTab" data-id="${s[0]}">${icon(s[1])}<span>${s[2]}</span></button>`).join('')}</div>
  <div class="tp-panes" data-pane="${tpPane}">${tpControlsHtmlAll()}</div>`;
}
function tpControlsHtmlAll(){
  const p = S.project; const design = ensureTPDesign(p);
  const fontOpts = TP_FONTS.map(f=>`<div class="tp-font-opt ${design.font===f.id?'active':''}" style="font-family:${f.family}" data-act="tpSetFont" data-id="${f.id}">${esc(f.label)}</div>`).join('');
  const patternOpts = TP_PATTERNS.map(pt=>{
    const css = tpPatternCss({color:design.color, pattern:pt.id});
    return `<div class="tp-pattern-opt ${design.pattern===pt.id?'active':''}" data-act="tpSetPattern" data-id="${pt.id}">
      <div class="tp-pattern-swatch" style="background:${esc(design.bg)};background-image:${css.image};background-size:${css.size};"></div>
      ${esc(pt.label)}
    </div>`;
  }).join('');
  const swatchesText = TP_SWATCHES.map(c=>`<button class="tp-swatch ${design.color===c?'active':''}" style="background:${c}" data-act="tpSetColor" data-id="${c}" title="${c}"></button>`).join('');
  return `
      <div class="tp-panel">
        <div class="tp-panel-head"><div class="tp-panel-icon">${icon('doc')}</div><h4>${L('Contenu','Content')}</h4></div>
        <p class="tp-tip">${L('Astuce : tu peux aussi écrire directement sur la page. Clique sur un texte, puis règle sa police, sa taille et sa couleur dans la barre du haut.','Tip: you can also type straight on the page. Click a text, then set its font, size and color in the toolbar above.')}</p>
        <div class="tp-field">
          <label class="tp-field-label" for="tpProjectTitle">${L('Titre du scénario','Screenplay title')}</label>
          <input type="text" id="tpProjectTitle" placeholder="${L('Le titre de ton scénario','The title of your screenplay')}" value="${esc(p.title||'')}">
          <p class="tp-field-help">${L('Renommer ici, sans repasser par l\u2019accueil : le titre change en même temps dans la barre latérale et dans le portfolio.','Rename it here, without going back to the home screen: the title changes at the same time in the sidebar and in the portfolio.')}</p>
        </div>
        <div class="tp-field">
          <label class="tp-field-label" for="tpAuthorText">${L('Auteur','Author')}</label>
          <input type="text" id="tpAuthorText" placeholder="${L('Ton nom','Your name')}" value="${esc(p.author||'')}">
          <p class="tp-field-help">${L('Affiché sous le titre, précédé de « Écrit par ».','Shown below the title, preceded by \u201cWritten by\u201d.')}</p>
        </div>
        <div class="tp-field">
          <label class="tp-field-label" for="tpExtraText">${L('Phrases supplémentaires','Extra lines')}</label>
          <textarea id="tpExtraText" rows="3" placeholder="${L('Ex. Adapté du roman de…','E.g. Adapted from the novel by…')}">${esc(p.titlePageExtra||'')}</textarea>
          <p class="tp-field-help">${L('Une phrase par ligne : adaptation, avertissement, citation, mention légale…','One line per sentence: adaptation, disclaimer, quote, legal notice…')}</p>
          <label class="tp-checkrow"><input type="checkbox" id="tpShowFoot" ${p.tpShowFoot?'checked':''}><span>${L('Afficher la version et la date en bas de page','Show version and date at the bottom of the page')}</span></label>
        </div>
        <div class="tp-field">
          <label class="tp-field-label" for="tpFreeImgInput">${L('Image à la place du titre','Image in place of the title')}</label>
          <input type="file" id="tpFreeImgInput" accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg,.bmp,.avif">
          <p class="tp-field-help">${L('Tous les formats d\u2019image sont acceptés (PNG avec transparence, JPG, WebP, GIF, SVG…). Sur la page : glisse l\u2019image pour la déplacer, tire sur les points bleus pour l\u2019agrandir ou la rétrécir (coins = proportions gardées, côtés = étirer).','All image formats are accepted (PNG with transparency, JPG, WebP, GIF, SVG…). On the page: drag the image to move it, pull the blue handles to enlarge or shrink it (corners = keep proportions, sides = stretch).')}</p>
          <label class="tp-checkrow"><input type="checkbox" id="tpTitleHidden" ${design.titleHidden?'checked':''}><span>${L('Rendre le titre invisible','Hide the title')}</span></label>
          ${design.freeImg?`<div class="tp-range-row" style="margin-top:12px;"><label>${L('Largeur','Width')}</label><input type="range" id="tpFreeImgW" min="5" max="100" step="1" value="${Math.round(design.freeImg.w)}"><span class="val" id="tpFreeImgWVal">${Math.round(design.freeImg.w)}%</span></div>
          <div class="tp-draw-toolbar" style="margin-top:10px;"><button class="btn btn-sm btn-ghost" data-act="tpFreeImgCenter">${L('Centrer','Center')}</button><button class="btn btn-sm btn-ghost" data-act="tpFreeImgRatio">${L('Rétablir les proportions','Restore proportions')}</button><button class="btn btn-sm btn-danger" data-act="tpFreeImgRemove">${L('Retirer l\u2019image','Remove the image')}</button></div>`:''}
        </div>
      </div>
      <div class="tp-panel">
        <div class="tp-panel-head"><div class="tp-panel-icon">${icon('image')}</div><h4>${L('Fond','Background')}</h4></div>
        <div class="tp-field">
          <label class="tp-field-label">${L('Motif de fond','Background pattern')}</label>
          <div class="tp-pattern-grid">${patternOpts}</div>
        </div>
        <div class="tp-field">
          <label class="tp-field-label">${L('Image de fond','Background image')}</label>
          <input type="file" id="tpImageInput" accept="image/*">
          ${design.bgImage?`<div class="tp-range-row" style="margin-top:10px;"><label>${L('Opacité','Opacity')}</label><input type="range" id="tpImgOpacity" min="0.1" max="1" step="0.05" value="${design.bgImageOpacity}"><span class="val" id="tpImgOpacityVal">${Math.round(design.bgImageOpacity*100)}%</span></div>
          <button class="btn btn-sm btn-danger" style="margin-top:10px;" data-act="tpRemoveImage">${L('Retirer l\u2019image','Remove the image')}</button>`:''}
        </div>
      </div>
      <div class="tp-panel">
        <div class="tp-panel-head"><div class="tp-panel-icon">${icon('pen')}</div><h4>${L('Dessin libre','Freehand drawing')}</h4></div>
        <p class="tp-field-help" style="margin:0 0 10px;">${L('Dessine directement sur la page de titre : logo, croquis, signature…','Draw directly on the title page: logo, sketch, signature…')}</p>
        <div id="tpDrawControls">${tpDrawControlsHtml()}</div>
      </div>`;
}
function tpDrawControlsHtml(){
  const design = ensureTPDesign(S.project);
  if(S.tpDrawMode){
    const colors = ['#23262E','#3699D4','#1F6FA0','#2F9E44','#2F2E44','#ffffff'];
    const colorSwatches = colors.map(c=>`<button class="tp-swatch ${S.tpPenColor===c?'active':''}" style="background:${c}" data-act="tpSetPenColor" data-id="${c}"></button>`).join('');
    const sizes = [3,6,12,20];
    const sizeBtns = sizes.map(s=>`<button class="tp-pen-size ${S.tpPenSize===s?'active':''}" data-act="tpSetPenSize" data-id="${s}" style="width:${12+s*0.6}px;height:${12+s*0.6}px;"></button>`).join('');
    return `<div class="tp-draw-toolbar"><span style="font-size:12.5px;color:var(--ink-soft);">${L('Couleur','Color')}</span>${colorSwatches}</div>
    <div class="tp-draw-toolbar"><span style="font-size:12.5px;color:var(--ink-soft);">${L('Épaisseur','Thickness')}</span>${sizeBtns}</div>
    <div class="tp-draw-toolbar">
      <button class="btn btn-sm btn-ghost" data-act="tpClearDrawing">${L('Effacer','Clear')}</button>
      <button class="btn btn-sm btn-primary" data-act="tpFinishDraw">${L('Terminer le dessin','Finish drawing')}</button>
    </div>`;
  }
  return `<div class="tp-draw-toolbar">
    <button class="btn btn-sm" data-act="tpToggleDraw">${icon('pen')} ${L('Dessiner sur la page','Draw on the page')}</button>
    ${design.drawing?`<button class="btn btn-sm btn-danger" data-act="tpClearDrawing">${L('Effacer le dessin','Clear the drawing')}</button>`:''}
  </div>`;
}
/* Rebuilds the preview shell from scratch (background image / drawing
   layers + text). Only called when those layers actually need to change
   — plain style tweaks go through afterTPChange() instead so an
   in-progress freehand drawing is never wiped out from under the user. */
function refreshTPPreview(){
  const shell = document.getElementById('tpPreviewShell'); if(!shell) return;
  const p = S.project;
  shell.innerHTML = '';
  const tp = buildTitlePageEl(p);
  shell.appendChild(tp);
  tpCanvas = null; tpCtx = null;
  tpDecoratePreview(shell, tp);   // v51 : texte modifiable directement sur la page
  tpFitPreview();
  if(S.tpDrawMode){
    const canvas = document.createElement('canvas');
    canvas.id = 'tpDrawCanvas'; canvas.width = 1000; canvas.height = 1414;
    tp.appendChild(canvas);
    tpCanvas = canvas; tpCtx = canvas.getContext('2d');
    const design = ensureTPDesign(p);
    if(design.drawing){
      const img = new Image();
      img.onload = ()=>{ if(tpCtx) tpCtx.drawImage(img, 0, 0, canvas.width, canvas.height); };
      img.src = design.drawing;
    }
    canvas.addEventListener('mousedown', tpPenDown);
    canvas.addEventListener('mousemove', tpPenMove);
    canvas.addEventListener('mouseup', tpPenUp);
    canvas.addEventListener('mouseleave', tpPenUp);
    canvas.addEventListener('touchstart', tpPenDown, {passive:false});
    canvas.addEventListener('touchmove', tpPenMove, {passive:false});
    canvas.addEventListener('touchend', tpPenUp, {passive:false});
  }
}
/* Style-only change (font, size, color, alignment, pattern): re-apply the
   CSS variables straight onto the existing preview element and refresh
   just the controls column, without tearing down the preview (which
   would otherwise destroy an in-progress drawing canvas). */
/* Reconstruit la colonne de réglages (Contenu, Fond, Dessin) ET re-branche ses champs, recréés à chaque reconstruction. */
function tpRebuildControls(){
  const controls = document.getElementById('tpControlsCol'); if(!controls) return;
  controls.innerHTML = tpControlsHtml();
  try{ onTPTabAttach(true); }catch(e){}
}
function afterTPChange(){
  scheduleAutosave();
  const tp = document.querySelector('#tpPreviewShell .titlepage');
  if(tp) applyTPDesignVars(tp, ensureTPDesign(S.project));
  const controls = document.getElementById('tpControlsCol');
  if(controls) tpRebuildControls();
}
function tpSetFont(id){ ensureTPDesign(S.project).font = id; afterTPChange(); }
function tpSetAlign(id){ ensureTPDesign(S.project).align = id; afterTPChange(); }
function tpSetColor(id){ ensureTPDesign(S.project).color = id; afterTPChange(); }
function tpSetBg(id){ ensureTPDesign(S.project).bg = id; afterTPChange(); }
function tpSetPattern(id){ ensureTPDesign(S.project).pattern = id; afterTPChange(); }
function tpRemoveImage(){
  const d = ensureTPDesign(S.project); d.bgImage = null; d.bgImageOpacity = 1;
  scheduleAutosave(); refreshTPPreview();
  const controls = document.getElementById('tpControlsCol'); if(controls) tpRebuildControls();
}
function tpToggleDraw(){
  S.tpDrawMode = true; refreshTPPreview();
  const dc = document.getElementById('tpDrawControls'); if(dc) dc.innerHTML = tpDrawControlsHtml();
}
function tpFinishDraw(){
  if(tpCanvas) ensureTPDesign(S.project).drawing = tpCanvas.toDataURL('image/png');
  S.tpDrawMode = false; scheduleAutosave(); refreshTPPreview();
  const controls = document.getElementById('tpControlsCol'); if(controls) tpRebuildControls();
}
function tpClearDrawing(){
  if(S.tpDrawMode && tpCtx){ tpCtx.clearRect(0,0,tpCanvas.width,tpCanvas.height); }
  else{ ensureTPDesign(S.project).drawing = null; scheduleAutosave(); refreshTPPreview(); }
  const dc = document.getElementById('tpDrawControls'); if(dc) dc.innerHTML = tpDrawControlsHtml();
}
function tpSetPenColor(id){ S.tpPenColor = id; const dc=document.getElementById('tpDrawControls'); if(dc) dc.innerHTML = tpDrawControlsHtml(); }
function tpSetPenSize(id){ S.tpPenSize = parseInt(id,10); const dc=document.getElementById('tpDrawControls'); if(dc) dc.innerHTML = tpDrawControlsHtml(); }
let tpCanvas = null, tpCtx = null, tpPenDownFlag = false;
function tpCanvasPoint(e){
  const rect = tpCanvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x:(clientX-rect.left)*(tpCanvas.width/rect.width), y:(clientY-rect.top)*(tpCanvas.height/rect.height) };
}
function tpPenDown(e){ e.preventDefault(); tpPenDownFlag = true; const pt = tpCanvasPoint(e); tpCtx.beginPath(); tpCtx.moveTo(pt.x, pt.y); }
function tpPenMove(e){
  if(!tpPenDownFlag || !tpCtx) return; e.preventDefault();
  const pt = tpCanvasPoint(e);
  tpCtx.strokeStyle = S.tpPenColor; tpCtx.lineWidth = S.tpPenSize * 1.6; tpCtx.lineCap='round'; tpCtx.lineJoin='round';
  tpCtx.lineTo(pt.x, pt.y); tpCtx.stroke();
}
function tpPenUp(e){ if(e) e.preventDefault(); tpPenDownFlag = false; }
/* =====================================================================
   v79 — IMAGE LIBRE SUR LA PAGE DE TITRE
   Une image (n'importe quel format que le navigateur sait lire) posée à la place du titre : on la glisse où on veut,
   on l'agrandit / la rétrécit avec les poignées. Position et taille sont enregistrées en % de la page, donc identiques
   à l'écran, à l'impression et dans le PDF. L'image est convertie en PNG (JPEG gardé en JPEG) à l'import : le PDF
   n'accepte nativement que ces deux formats.
===================================================================== */
let tpFreeSel = false;
function tpFreeImgLoad(file){
  const done = src => new Promise(res=>{ const im = new Image(); im.onload = ()=>res(im); im.onerror = ()=>res(null); im.src = src; });
  const reader = new FileReader();
  reader.onerror = ()=>toast(L('Impossible de lire cette image.','Couldn\u2019t read this image.'));
  reader.onload = async ()=>{
    const im = await done(reader.result);
    if(!im){ toast(L('Format d\u2019image non reconnu par le navigateur.','Image format not recognised by the browser.')); return; }
    let w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
    if(!w || !h){ w = 1000; h = 1000; }   // SVG sans dimensions
    const MAX = 3000, k = Math.min(1, MAX / Math.max(w, h));
    const cw = Math.max(1, Math.round(w*k)), ch = Math.max(1, Math.round(h*k));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const ctx = cv.getContext('2d');
    const isJpg = /jpe?g/i.test(file.type || '');
    if(isJpg){ ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,cw,ch); }
    ctx.drawImage(im, 0, 0, cw, ch);
    let url;
    try{ url = isJpg ? cv.toDataURL('image/jpeg', 0.92) : cv.toDataURL('image/png'); }
    catch(err){ toast(L('Impossible de convertir cette image.','Couldn\u2019t convert this image.')); return; }
    const d = ensureTPDesign(S.project);
    const tpEl0 = document.querySelector('#tpPreviewShell .titlepage');
    const pageR = tpEl0 && tpEl0.offsetHeight ? tpEl0.offsetWidth / tpEl0.offsetHeight : (S.project.format==='us' ? 8.5/11 : 21/29.7);
    const wPct = 50, hPct = wPct * (ch/cw) * pageR;
    d.freeImg = { src:url, x:50 - wPct/2, y:Math.max(0, Math.min(100 - hPct, 40 - hPct/2)), w:wPct, h:hPct, ar:ch/cw };
    d.titleHidden = true;   // l'image prend la place du titre
    tpFreeSel = true;
    scheduleAutosave(); refreshTPPreview(); tpRebuildControls();
  };
  reader.readAsDataURL(file);
}
function tpFreeImgApply(){
  const d = ensureTPDesign(S.project), f = d.freeImg;
  const n = document.querySelector('#tpPreviewShell .tp-free-img'); if(!n || !f) return;
  n.style.left = f.x+'%'; n.style.top = f.y+'%'; n.style.width = f.w+'%'; n.style.height = f.h+'%';
}
function tpFreeImgDecorate(shell, tp){
  const n = tp.querySelector('.tp-free-img'); if(!n) return;
  tp.classList.toggle('tp-drawing-on', !!S.tpDrawMode);
  if(S.tpDrawMode) return;
  n.classList.toggle('tp-sel', tpFreeSel);
  if(tpFreeSel){
    ['nw','n','ne','e','se','s','sw','w'].forEach(h=>{ const g = document.createElement('div'); g.className = 'tp-free-h'; g.dataset.h = h; n.appendChild(g); });
  }
  if(!n._tpBound){
    n._tpBound = true;
    n.addEventListener('pointerdown', e=>tpFreeImgDown(e, n, tp));
  }
}
function tpFreeImgDown(e, n, tp){
  if(S.tpDrawMode || (e.button!==undefined && e.button!==0)) return;
  e.preventDefault(); e.stopPropagation();
  const d = ensureTPDesign(S.project), f = d.freeImg; if(!f) return;
  const hEl = e.target.closest ? e.target.closest('.tp-free-h') : null;
  const handle = hEl ? hEl.dataset.h : null;
  const a = document.activeElement; if(a && a!==document.body && a.blur) a.blur();
  if(!tpFreeSel){
    tpFreeSel = true; tpSelect('none');
    tp.querySelectorAll('.tp-free-h').forEach(x=>x.remove());
    n.classList.add('tp-sel');
    ['nw','n','ne','e','se','s','sw','w'].forEach(h=>{ const g = document.createElement('div'); g.className = 'tp-free-h'; g.dataset.h = h; n.appendChild(g); });
  }
  const rect = tp.getBoundingClientRect();
  const sx = e.clientX, sy = e.clientY, o = { x:f.x, y:f.y, w:f.w, h:f.h };
  const pageR = rect.width / rect.height;     // largeur / hauteur de la page
  const ar = o.h / o.w;                       // proportions de départ (en % de page)
  try{ n.setPointerCapture(e.pointerId); }catch(err){}
  const move = ev=>{
    const dx = (ev.clientX - sx) / rect.width * 100, dy = (ev.clientY - sy) / rect.height * 100;
    let x = o.x, y = o.y, w = o.w, h = o.h;
    if(!handle){ x = o.x + dx; y = o.y + dy; }
    else{
      const MIN = 3;
      const L_ = handle.includes('w'), R_ = handle.includes('e'), T_ = handle.includes('n'), B_ = handle.includes('s');
      const corner = handle.length === 2;
      if(L_){ w = o.w - dx; x = o.x + dx; } if(R_){ w = o.w + dx; }
      if(T_){ h = o.h - dy; y = o.y + dy; } if(B_){ h = o.h + dy; }
      if(corner && !ev.shiftKey){
        // coins : proportions gardées (Maj = étirement libre)
        const wFromH = h / ar;
        const useW = Math.abs(w - o.w) * 1 >= Math.abs(wFromH - o.w) * 1;
        if(useW){ h = w * ar; } else { w = wFromH; }
        if(L_) x = o.x + o.w - w; if(T_) y = o.y + o.h - h;
      }
      if(w < MIN){ w = MIN; if(L_) x = o.x + o.w - w; }
      if(h < MIN){ h = MIN; if(T_) y = o.y + o.h - h; }
    }
    f.x = x; f.y = y; f.w = w; f.h = h;
    tpFreeImgApply();
    const sl = document.getElementById('tpFreeImgW'); if(sl){ sl.value = Math.round(f.w); const v = document.getElementById('tpFreeImgWVal'); if(v) v.textContent = Math.round(f.w)+'%'; }
  };
  const up = ()=>{
    n.removeEventListener('pointermove', move); n.removeEventListener('pointerup', up); n.removeEventListener('pointercancel', up);
    try{ n.releasePointerCapture(e.pointerId); }catch(err){}
    scheduleAutosave();
  };
  n.addEventListener('pointermove', move); n.addEventListener('pointerup', up); n.addEventListener('pointercancel', up);
}
function tpFreeImgDeselect(){
  if(!tpFreeSel) return;
  tpFreeSel = false;
  document.querySelectorAll('#tpPreviewShell .tp-free-h').forEach(x=>x.remove());
  document.querySelectorAll('#tpPreviewShell .tp-free-img').forEach(x=>x.classList.remove('tp-sel'));
}
/* cliquer ailleurs que sur l'image la désélectionne */
document.addEventListener('pointerdown', e=>{
  if(!tpFreeSel) return;
  const t = e.target; if(t && t.closest && t.closest('.tp-free-img, #tpFreeImgInput, #tpFreeImgW, [data-act^="tpFreeImg"]')) return;
  tpFreeImgDeselect();
}, true);
function tpFreeImgCenter(){
  const f = ensureTPDesign(S.project).freeImg; if(!f) return;
  f.x = 50 - f.w/2; f.y = Math.max(0, Math.min(100 - f.h, 40 - f.h/2));
  tpFreeImgApply(); scheduleAutosave();
}
function tpFreeImgRatio(){
  const f = ensureTPDesign(S.project).freeImg; if(!f || !f.ar) return;
  const tp = document.querySelector('#tpPreviewShell .titlepage');
  const pageR = tp && tp.offsetHeight ? tp.offsetWidth / tp.offsetHeight : (S.project.format==='us' ? 8.5/11 : 21/29.7);
  const cx = f.x + f.w/2, cy = f.y + f.h/2;
  f.h = f.w * f.ar * pageR; f.x = cx - f.w/2; f.y = cy - f.h/2;
  tpFreeImgApply(); scheduleAutosave();
}
function tpFreeImgRemove(){
  const d = ensureTPDesign(S.project); d.freeImg = null; tpFreeSel = false;
  scheduleAutosave(); refreshTPPreview(); tpRebuildControls();
}
function onTPTabAttach(rebindOnly){
  if(S.tab!=='titlepage') return;
  if(!rebindOnly){ tpCloseMenus(); refreshTPPreview(); tpRenderToolbar(); tpFitPreview(); requestAnimationFrame(tpFitPreview); }
  const bind = (id, evt, fn) => { const el=document.getElementById(id); if(el) el.addEventListener(evt, fn); };
  // Renommer le projet depuis la page de titre. Même effet que le champ
  // « Titre » des Paramètres : on écrit dans le projet, l'aperçu se
  // rafraîchit, et la sauvegarde automatique répercute le nouveau nom dans
  // l'index du portfolio. Un titre entièrement vide est refusé au moment
  // de quitter le champ (un scénario sans nom devient introuvable).
  bind('tpProjectTitle','input', e=>{
    S.project.title = e.target.value;
    scheduleAutosave();
    refreshTPPreview();
    const rail = document.querySelector('.rail-project');
    if(rail) rail.textContent = S.project.title;
  });
  bind('tpProjectTitle','blur', e=>{
    if(!e.target.value.trim()){
      S.project.title = L('Sans titre','Untitled');
      e.target.value = S.project.title;
      scheduleAutosave(); refreshTPPreview();
      const rail = document.querySelector('.rail-project');
      if(rail) rail.textContent = S.project.title;
    }
  });
  bind('tpExtraText','input', e=>{
    S.project.titlePageExtra = e.target.value;
    scheduleAutosave();
    const wrap = document.querySelector('#tpPreviewShell .titlepage .tp-extra-wrap');
    if(wrap){ wrap.innerHTML = tpExtraLinesHtml(e.target.value); tpDecoratePreview(document.getElementById('tpPreviewShell'), document.querySelector('#tpPreviewShell .titlepage')); }
  });
  // Modifier l'auteur depuis la page de titre. Même champ que celui des
  // Paramètres et de la création du projet : on écrit dans le projet, on
  // rafraîchit l'aperçu, et on met à jour le nom retenu par défaut pour la
  // prochaine création (comme le font les traitements de texte pro).
  bind('tpAuthorText','input', e=>{
    S.project.author = e.target.value;
    scheduleAutosave();
    const wrap = document.querySelector('#tpPreviewShell .titlepage .tp-author');
    if(wrap){ wrap.innerHTML = tpAuthorInnerHtml(e.target.value); tpDecoratePreview(document.getElementById('tpPreviewShell'), document.querySelector('#tpPreviewShell .titlepage')); }
  });
  bind('tpAuthorText','blur', e=>{
    if(e.target.value.trim()) setDefaultAuthor(e.target.value.trim());
  });
  bind('tpTitleSize','input', e=>{ ensureTPDesign(S.project).titleSize=+e.target.value; document.getElementById('tpTitleSizeVal').textContent=e.target.value+'pt'; afterTPChangeLight(); });
  bind('tpSubSize','input', e=>{ ensureTPDesign(S.project).subSize=+e.target.value; document.getElementById('tpSubSizeVal').textContent=e.target.value+'pt'; afterTPChangeLight(); });
  bind('tpAuthorSize','input', e=>{ ensureTPDesign(S.project).authorSize=+e.target.value; document.getElementById('tpAuthorSizeVal').textContent=e.target.value+'pt'; afterTPChangeLight(); });
  bind('tpFootSize','input', e=>{ ensureTPDesign(S.project).footSize=+e.target.value; document.getElementById('tpFootSizeVal').textContent=e.target.value+'pt'; afterTPChangeLight(); });
  bind('tpImgOpacity','input', e=>{ ensureTPDesign(S.project).bgImageOpacity=+e.target.value; document.getElementById('tpImgOpacityVal').textContent=Math.round(e.target.value*100)+'%'; afterTPChangeLight(); });
  bind('tpColorPicker','input', e=>{ ensureTPDesign(S.project).color=e.target.value; afterTPChangeLight(); });
  bind('tpFreeImgInput','change', e=>{
    const file = e.target.files && e.target.files[0]; if(!file) return;
    tpFreeImgLoad(file); e.target.value = '';
  });
  bind('tpShowFoot','change', e=>{
    S.project.tpShowFoot = !!e.target.checked;
    scheduleAutosave(); refreshTPPreview();
  });
  bind('tpTitleHidden','change', e=>{
    ensureTPDesign(S.project).titleHidden = !!e.target.checked;
    scheduleAutosave(); refreshTPPreview();
  });
  bind('tpFreeImgW','input', e=>{
    const d = ensureTPDesign(S.project), f = d.freeImg; if(!f) return;
    const ratio = f.h / f.w, cx = f.x + f.w/2, cy = f.y + f.h/2;
    f.w = +e.target.value; f.h = f.w * ratio;
    f.x = cx - f.w/2; f.y = cy - f.h/2;
    const v = document.getElementById('tpFreeImgWVal'); if(v) v.textContent = Math.round(f.w)+'%';
    tpFreeImgApply(); scheduleAutosave();
  });
  bind('tpImageInput','change', e=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{ ensureTPDesign(S.project).bgImage = reader.result; scheduleAutosave(); refreshTPPreview();
      const controls = document.getElementById('tpControlsCol'); if(controls) tpRebuildControls(); };
    reader.readAsDataURL(file);
  });
}
/* Range-slider version of afterTPChange: applies the CSS vars live but
   skips re-rendering the controls column (so the slider you're actively
   dragging doesn't get rebuilt out from under your cursor) and only
   debounce-saves. */
function afterTPChangeLight(){
  scheduleAutosave();
  const tp = document.querySelector('#tpPreviewShell .titlepage');
  if(tp) applyTPDesignVars(tp, ensureTPDesign(S.project));
}

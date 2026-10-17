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
        <p class="tp-tip" style="padding:5px 9px; font-size:12px; line-height:1.35;">${L('Astuce : écris directement sur la page, puis règle le texte dans la barre du haut.','Tip: type straight on the page, then style the text in the toolbar above.')}</p>
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
          <div style="display:grid; grid-template-columns:1fr 1.6fr; gap:8px; margin-top:8px;">
            <div><label class="tp-field-label" for="tpVersionText">${L('Version','Version')}</label><input type="text" id="tpVersionText" value="${esc(p.version||'')}" ${p.tpShowFoot?'':'disabled'}></div>
            <div><label class="tp-field-label" for="tpDateText">${L('Date','Date')}</label><input type="text" id="tpDateText" value="${esc(p.date||'')}" ${p.tpShowFoot?'':'disabled'}></div>
          </div>
        </div>
        <div class="tp-field">
          <label class="tp-field-label" for="tpFreeImgInput">${L('Image à la place du titre','Image in place of the title')}</label>
          <input type="file" id="tpFreeImgInput" accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg,.bmp,.avif">
          <p class="tp-field-help" title="${L('Tous les formats d\u2019image sont acceptés (PNG avec transparence, JPG, WebP, GIF, SVG…). Coins = proportions gardées, côtés = étirer.','All image formats are accepted (PNG with transparency, JPG, WebP, GIF, SVG…). Corners = keep proportions, sides = stretch.')}">${L('Glisse l\u2019image pour la déplacer, tire les points bleus pour la redimensionner.','Drag the image to move it, pull the blue handles to resize it.')}</p>
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
    ['tpVersionText','tpDateText'].forEach(id=>{ const f = document.getElementById(id); if(f) f.disabled = !e.target.checked; });
    scheduleAutosave(); refreshTPPreview();
  });
  // Même champs « Version » et « Date » que dans les Paramètres : on écrit dans le projet.
  bind('tpVersionText','input', e=>{ S.project.version = e.target.value; scheduleAutosave(); refreshTPPreview(); });
  bind('tpDateText','input', e=>{ S.project.date = e.target.value; scheduleAutosave(); refreshTPPreview(); });
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

/* =====================================================================
   PAGE DE TITRE — DÉPLACEMENT LIBRE DES TEXTES
   ---------------------------------------------------------------------
   Chaque texte de la page de titre (titre, sous-titre, « Écrit par »,
   nom de l'auteur, phrases en plus, bas de page) se place où l'on veut.
   - On saisit le texte sélectionné par sa poignée ronde (à gauche) ; le
     sous-titre, « Écrit par » et le bas de page se saisissent aussi
     directement sur le texte (ces blocs ne se tapent pas, donc aucun
     conflit avec le curseur).
   - Aimantation façon WriterDuet / Figma : centre de la page, marges,
     bords et centres des autres textes, avec des repères bleus.
       Maj = un seul axe · Alt / Ctrl / ⌘ = sans aimantation · Échap =
       annuler le geste · double-clic sur la poignée = replacer.
   - Texte sélectionné sans curseur dedans : les flèches le décalent
     (Maj = par grands pas).
   - Les positions sont des décalages en % de la page (design.pos), stockés
     dans le projet comme le reste du design. Elles s'appliquent par un
     simple transform sur chaque bloc : l'aperçu, le plein écran, l'impression
     et l'export PDF (qui relève la géométrie réelle) sont donc identiques,
     et un texte jamais déplacé garde exactement sa place d'avant.
===================================================================== */
const TP_POS_SEL = {title:'.tp-title', sub:'.tp-sub', by:'.tp-author-label', author:'.tp-author-name', extra:'.tp-extra-wrap', foot:'.tp-foot'};
(function(){
  if(document.getElementById('tpMoveCss')) return;
  const st = document.createElement('style'); st.id = 'tpMoveCss';
  st.textContent = `
  .tp-move-h{position:absolute; z-index:6; width:calc(22px * var(--tp-hs,1)); height:calc(22px * var(--tp-hs,1)); box-sizing:border-box; display:flex; align-items:center; justify-content:center; background:#fff; color:var(--accent-2,#1F6FA0); border:calc(2px * var(--tp-hs,1)) solid var(--accent); border-radius:50%; box-shadow:0 calc(2px * var(--tp-hs,1)) calc(8px * var(--tp-hs,1)) #00000033; cursor:grab; touch-action:none; user-select:none; -webkit-user-select:none; line-height:0;}
  .tp-move-h:hover{background:#EAF4FB;}
  .tp-move-h svg{width:56%; height:56%; display:block; pointer-events:none;}
  .tp-moving, .tp-moving *{cursor:grabbing !important; user-select:none !important; -webkit-user-select:none !important;}
  .tp-editing [data-tpk="sub"].tp-sel, .tp-editing [data-tpk="by"].tp-sel, .tp-editing [data-tpk="foot"].tp-sel{cursor:move;}
  .tp-guide{position:absolute; z-index:5; pointer-events:none; background:var(--accent);}
  .tp-guide.v{top:0; bottom:0; width:calc(1px * var(--tp-hs,1)); margin-left:calc(-.5px * var(--tp-hs,1));}
  .tp-guide.h{left:0; right:0; height:calc(1px * var(--tp-hs,1)); margin-top:calc(-.5px * var(--tp-hs,1));}`;
  document.head.appendChild(st);
})();
function tpPosOf(d, k){
  const q = d && d.pos && d.pos[k];
  return { x: q && isFinite(+q.x) ? +q.x : 0, y: q && isFinite(+q.y) ? +q.y : 0 };
}
function tpSetPos(d, k, x, y){
  const r = v => Math.round(v * 100) / 100;
  if(!d.pos || typeof d.pos !== 'object') d.pos = {};
  x = r(x); y = r(y);
  if(!x && !y) delete d.pos[k]; else d.pos[k] = { x, y };
}
/* Pose (ou retire) le décalage de chaque bloc. Idempotent : appelé à la construction de la page, à chaque changement de style et après chaque re-décoration. */
function tpApplyPositions(tp, d){
  if(!tp) return;
  d = d || ensureTPDesign(S.project);
  for(const k in TP_POS_SEL){
    const n = tp.querySelector(TP_POS_SEL[k]); if(!n) continue;
    const q = tpPosOf(d, k);
    n.style.transform = (q.x || q.y) ? `translate(calc(var(--page-w,21cm) * ${q.x/100}), calc(var(--page-h,29.7cm) * ${q.y/100}))` : '';
  }
}
function tpTextRects(n){
  let out = [];
  try{ const rg = document.createRange(); rg.selectNodeContents(n); out = [...rg.getClientRects()].filter(q => q.width > 0 && q.height > 0); }catch(err){}
  if(!out.length) out = [n.getBoundingClientRect()];
  return out;
}
function tpTextRect(n){
  const rs = tpTextRects(n);
  return { left:Math.min(...rs.map(q=>q.left)), top:Math.min(...rs.map(q=>q.top)), right:Math.max(...rs.map(q=>q.right)), bottom:Math.max(...rs.map(q=>q.bottom)) };
}
function tpHitText(e, n){
  const tol = 8;
  return tpTextRects(n).some(q => e.clientX >= q.left - tol && e.clientX <= q.right + tol && e.clientY >= q.top - tol && e.clientY <= q.bottom + tol);
}
function tpPageBox(rect, q){
  return { l:(q.left - rect.left) / rect.width * 100, r:(q.right - rect.left) / rect.width * 100,
           t:(q.top - rect.top) / rect.height * 100, b:(q.bottom - rect.top) / rect.height * 100 };
}
function tpClamp(v, lo, hi){ return lo > hi ? v : Math.max(lo, Math.min(hi, v)); }
function tpSnap(edges, targets, thr){
  let best = null;
  edges.forEach(a => targets.forEach(t => {
    const df = t - a;
    if(Math.abs(df) <= thr && (!best || Math.abs(df) < Math.abs(best.d))) best = { d:df, t };
  }));
  return best;
}
/* Repères d'aimantation : milieu de la page, marges de la page, bords et centres des autres textes (en % de la page). */
function tpSnapTargets(tp, n, rect, sc){
  const cs = getComputedStyle(tp);
  const mL = (parseFloat(cs.paddingLeft) || 0) * sc / rect.width * 100, mR = (parseFloat(cs.paddingRight) || 0) * sc / rect.width * 100;
  const mT = (parseFloat(cs.paddingTop) || 0) * sc / rect.height * 100, mB = (parseFloat(cs.paddingBottom) || 0) * sc / rect.height * 100;
  const X = [50, mL, 100 - mR], Y = [50, mT, 100 - mB];
  tp.querySelectorAll('[data-tpk]').forEach(o => {
    if(o === n || o.classList.contains('tp-title-off') || !(o.textContent || '').trim()) return;
    const b = tpPageBox(rect, tpTextRect(o));
    if(!(b.r - b.l > 0)) return;
    X.push(b.l, (b.l + b.r) / 2, b.r); Y.push(b.t, (b.t + b.b) / 2, b.b);
  });
  return { X, Y };
}
function tpGuides(tp, gx, gy){
  [['v', gx], ['h', gy]].forEach(it => {
    let g = tp.querySelector('.tp-guide.' + it[0]);
    if(it[1] == null){ if(g) g.remove(); return; }
    if(!g){ g = document.createElement('div'); g.className = 'tp-guide ' + it[0]; tp.appendChild(g); }
    if(it[0] === 'v') g.style.left = it[1] + '%'; else g.style.top = it[1] + '%';
  });
}
/* Un geste de déplacement : `cap` est l'élément qui capte le pointeur (la poignée, ou le texte lui-même). */
function tpMoveStart(e, k, n, tp, cap, opts){
  const d = ensureTPDesign(S.project);
  const rect = tp.getBoundingClientRect(); if(!rect.width || !rect.height) return;
  const sc = rect.width / (tp.offsetWidth || rect.width);
  const base = tpPosOf(d, k);
  const box = tpPageBox(rect, tpTextRect(n));
  const tg = tpSnapTargets(tp, n, rect, sc);
  const sx = e.clientX, sy = e.clientY, needThr = !!(opts && opts.threshold);
  let moved = false;
  try{ cap.setPointerCapture(e.pointerId); }catch(err){}
  const move = ev => {
    const rdx = ev.clientX - sx, rdy = ev.clientY - sy;
    if(!moved){
      if(needThr && Math.hypot(rdx, rdy) < 4) return;
      moved = true; tp.classList.add('tp-moving');
      if(needThr){ try{ const s = window.getSelection && window.getSelection(); if(s && s.removeAllRanges) s.removeAllRanges(); }catch(err){} }
    }
    let dx = rdx / rect.width * 100, dy = rdy / rect.height * 100, lockX = false, lockY = false;
    if(ev.shiftKey){ if(Math.abs(dx) >= Math.abs(dy)){ dy = 0; lockY = true; } else { dx = 0; lockX = true; } }
    let gx = null, gy = null;
    if(!(ev.altKey || ev.ctrlKey || ev.metaKey)){
      if(!lockX){ const s = tpSnap([box.l + dx, (box.l + box.r) / 2 + dx, box.r + dx], tg.X, 6 / rect.width * 100); if(s){ dx += s.d; gx = s.t; } }
      if(!lockY){ const s = tpSnap([box.t + dy, (box.t + box.b) / 2 + dy, box.b + dy], tg.Y, 6 / rect.height * 100); if(s){ dy += s.d; gy = s.t; } }
    }
    dx = tpClamp(dx, Math.min(-box.l, 0), Math.max(100 - box.r, 0));   // le texte reste sur la page
    dy = tpClamp(dy, Math.min(-box.t, 0), Math.max(100 - box.b, 0));
    tpSetPos(d, k, base.x + dx, base.y + dy);
    tpApplyPositions(tp, d);
    tpGuides(tp, gx, gy);
    tpUpdateMoveHandle();
  };
  const key = ev => { if(ev.key === 'Escape'){ ev.preventDefault(); ev.stopPropagation(); end(true); } };
  const up = () => end(false);
  const end = cancel => {
    cap.removeEventListener('pointermove', move); cap.removeEventListener('pointerup', up); cap.removeEventListener('pointercancel', up);
    document.removeEventListener('keydown', key, true);
    try{ cap.releasePointerCapture(e.pointerId); }catch(err){}
    tp.classList.remove('tp-moving'); tpGuides(tp, null, null);
    if(cancel){ tpSetPos(d, k, base.x, base.y); tpApplyPositions(tp, d); tpUpdateMoveHandle(); return; }
    if(moved){
      scheduleAutosave();
      // le clic qui suit un glissement ne doit pas changer la sélection
      const sup = ev => { ev.stopPropagation(); ev.preventDefault(); };
      document.addEventListener('click', sup, { capture:true, once:true });
      setTimeout(() => document.removeEventListener('click', sup, true), 30);
    }
  };
  cap.addEventListener('pointermove', move); cap.addEventListener('pointerup', up); cap.addEventListener('pointercancel', up);
  document.addEventListener('keydown', key, true);
}
function tpMakeMoveHandle(tp){
  const h = document.createElement('div'); h.className = 'tp-move-h';
  h.title = L('Glisser pour déplacer · Maj : un seul axe · Alt : sans aimantation · Double-clic : replacer', 'Drag to move · Shift: one axis · Alt: no snapping · Double-click: reset');
  h.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5v13M1.5 8h13M8 1.5L6 3.5M8 1.5l2 2M8 14.5l-2-2M8 14.5l2-2M1.5 8l2-2M1.5 8l2 2M14.5 8l-2-2M14.5 8l-2 2"/></svg>';
  h.addEventListener('pointerdown', e => {
    if(e.button !== undefined && e.button !== 0) return;
    const k = h.dataset.k, n = tpEl(k) ? tp.querySelector('[data-tpk="' + k + '"]') : null; if(!n) return;
    e.preventDefault(); e.stopPropagation();
    tpMoveStart(e, k, n, tp, h, null);
  });
  h.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
  h.addEventListener('click', e => e.stopPropagation());
  h.addEventListener('dblclick', e => {
    e.preventDefault(); e.stopPropagation();
    const k = h.dataset.k; if(!tpEl(k)) return;
    const d = ensureTPDesign(S.project);
    tpSetPos(d, k, 0, 0); tpApplyPositions(tp, d); tpUpdateMoveHandle(); scheduleAutosave();
  });
  tp.appendChild(h);
  return h;
}
/* La poignée suit le texte sélectionné (sélection, frappe, changement de taille, zoom de l'aperçu). */
function tpUpdateMoveHandle(){
  const shell = document.getElementById('tpPreviewShell');
  const tp = shell ? shell.querySelector('.titlepage') : null; if(!tp) return;
  let h = tp.querySelector('.tp-move-h'), n = null;
  if(!S.tpDrawMode && tpEl(tpSel)){
    n = tp.querySelector('[data-tpk="' + tpSel + '"]');
    if(n && n.classList.contains('tp-title-off')) n = null;
  }
  if(!n){ if(h) h.remove(); return; }
  if(!h) h = tpMakeMoveHandle(tp);
  h.dataset.k = tpSel;
  const rect = tp.getBoundingClientRect(); if(!rect.width) return;
  const W = tp.offsetWidth || rect.width, H = tp.offsetHeight || rect.height, sc = rect.width / W;
  const hs = parseFloat(tp.style.getPropertyValue('--tp-hs')) || 1, size = 22 * hs, pad = 3 * hs;
  const q = tpTextRect(n);
  let left = (q.left - rect.left) / sc - size - 12 * hs;
  if(left < pad) left = (q.right - rect.left) / sc + 12 * hs;
  left = tpClamp(left, pad, W - size - pad);
  const top = tpClamp(((q.top + q.bottom) / 2 - rect.top) / sc - size / 2, pad, H - size - pad);
  h.style.left = left + 'px'; h.style.top = top + 'px';
}
/* Saisie directe pour les blocs qui ne se tapent pas (sous-titre, « Écrit par », bas de page). Au toucher : poignée seulement. */
function tpMoveBind(shell){
  if(shell._tpMvBound) return; shell._tpMvBound = true;
  shell.addEventListener('pointerdown', e => {
    if(S.tpDrawMode || (e.button !== undefined && e.button !== 0) || e.pointerType === 'touch') return;
    const n = e.target && e.target.closest ? e.target.closest('[data-tpk]') : null;
    if(!n || n.isContentEditable) return;
    const k = n.dataset.tpk; if(!tpEl(k) || !tpHitText(e, n)) return;
    const tp = n.closest('.titlepage'); if(!tp) return;
    e.preventDefault();
    tpSelect(k);
    tpMoveStart(e, k, n, tp, n, { threshold:true });
  });
}
/* Flèches : décalent le texte sélectionné quand le curseur n'est dans aucun champ (Maj = grands pas). */
function tpNudge(k, ddx, ddy){
  const shell = document.getElementById('tpPreviewShell');
  const tp = shell ? shell.querySelector('.titlepage') : null;
  const n = tp && tpEl(k) ? tp.querySelector('[data-tpk="' + k + '"]') : null; if(!n) return;
  const d = ensureTPDesign(S.project), rect = tp.getBoundingClientRect(); if(!rect.width || !rect.height) return;
  const box = tpPageBox(rect, tpTextRect(n));
  ddx = tpClamp(ddx, Math.min(-box.l, 0), Math.max(100 - box.r, 0));
  ddy = tpClamp(ddy, Math.min(-box.t, 0), Math.max(100 - box.b, 0));
  const b = tpPosOf(d, k);
  tpSetPos(d, k, b.x + ddx, b.y + ddy);
  tpApplyPositions(tp, d); tpUpdateMoveHandle(); scheduleAutosave();
}
document.addEventListener('keydown', e => {
  if(!S || S.tab !== 'titlepage' || S.tpDrawMode || tpFsEl || !document.getElementById('tpRoot')) return;
  if(!tpEl(tpSel) || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if(t && ((t.matches && t.matches('input, textarea, select')) || t.isContentEditable)) return;
  const dir = { ArrowLeft:[-1, 0], ArrowRight:[1, 0], ArrowUp:[0, -1], ArrowDown:[0, 1] }[e.key]; if(!dir) return;
  e.preventDefault();
  const st = e.shiftKey ? 2.5 : 0.25;
  tpNudge(tpSel, dir[0] * st, dir[1] * st);
});

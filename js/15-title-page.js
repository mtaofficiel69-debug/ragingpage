/* =====================================================================
   TITLE PAGE DESIGN
===================================================================== */
function renderTitlePageDesign(){
  const p = S.project;
  const dims = p.format==='us' ? '8.5 × 11 in · Letter' : '21 × 29,7 cm · A4';
  return `
  <div class="tp-root" id="tpRoot">
  <div class="cards-toolbar"><div class="pane-title" style="margin:0;">${L('Page de titre','Title page')}</div>
    <div class="tp-hd-r"><span style="font-size:13px;color:var(--ink-soft);">${L('N\u2019apparaît jamais dans le corps du scénario','Never appears in the body of the screenplay')}</span><button type="button" class="btn btn-sm" data-tpd="draw" title="${L('Dessiner sur la page de titre (s\u2019ouvre en plein écran)','Draw on the title page (opens full screen)')}">${icon('pen')} ${L('Dessiner','Draw')}</button><button type="button" class="btn btn-sm" data-act="tpFullscreen" title="${L('Voir la page de titre seule, en plein écran','View the title page alone, full screen')}"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/></svg>${L('Plein écran','Full screen')}</button></div></div>
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
          <label class="tp-field-label">${L('Textes libres','Free texts')}</label>
          <button type="button" class="btn btn-sm" data-act="tpFtxAdd">+ ${L('Ajouter un texte','Add a text')}</button>
          <p class="tp-field-help">${L('Autant que tu veux. Chacun se déplace avec sa poignée ronde et se règle à part dans la barre du haut : police, taille, couleur, alignement, gras…','As many as you like. Each one moves with its round handle and has its own settings in the toolbar above: font, size, color, alignment, bold…')}</p>
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
/* tpDrawControlsHtml() : voir le moteur de dessin (v90), en bas de ce fichier. */
/* Rebuilds the preview shell from scratch (background image / drawing
   layers + text). Only called when those layers actually need to change
   — plain style tweaks go through afterTPChange() instead so an
   in-progress freehand drawing is never wiped out from under the user. */
function refreshTPPreview(){
  const shell = document.getElementById('tpPreviewShell'); if(!shell) return;
  const p = S.project;
  if(TPD.cv) tpdDetach();
  shell.innerHTML = '';
  const tp = buildTitlePageEl(p, {live:S.tpDrawMode});   // v90 : en mode dessin, le canevas remplace l'image du dessin (jamais deux couches)
  shell.appendChild(tp);
  tpCanvas = null; tpCtx = null;
  tpDecoratePreview(shell, tp);   // v51 : texte modifiable directement sur la page
  tpFitPreview();
  if(S.tpDrawMode && !tpFsEl) tpdAttach(tp);   // v90 : les traits sont des données du projet : reconstruire l'aperçu ne perd plus rien
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
let tpCanvas = null, tpCtx = null, tpPenDownFlag = false;
/* tpToggleDraw, tpFinishDraw, tpClearDrawing, tpSetPenColor, tpSetPenSize et la saisie au stylet / à la souris / au doigt : voir le moteur de dessin (v90), en bas de ce fichier. */
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
  if(!rebindOnly){ tpCloseMenus(); if(S.tpDrawMode && !tpFsEl){ try{ tpdFlush(); }catch(e){} S.tpDrawMode = false; }   // v90 : revenir sur l'onglet ne laisse pas un mode dessin fantôme (les traits sont déjà enregistrés)
    refreshTPPreview(); tpRenderToolbar(); tpFitPreview(); requestAnimationFrame(tpFitPreview); }
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
   v96 — TEXTES LIBRES SUR LA PAGE DE TITRE
   « + Texte » ajoute un texte indépendant de tous les autres : il se tape
   directement sur la page, se déplace avec la poignée ronde (aimantation
   comprise) et a ses propres réglages dans la barre du haut. Il est
   enregistré dans le design (texts, pos et styles sous sa clé) : aperçu,
   plein écran, impression et PDF le montrent au même endroit.
===================================================================== */
function tpFtxAdd(){
  if(S.tpDrawMode) return;
  const d = ensureTPDesign(S.project);
  if(!Array.isArray(d.texts)) d.texts = [];
  let id; do{ id = 'tx' + Math.random().toString(36).slice(2, 8); }while(d.texts.some(t=>t.id===id) || !tpIsFtx(id));
  // posé sur la première place libre (une ligne sous l'autre), pour ne jamais en cacher un autre
  const used = d.texts.map(t=>tpPosOf(d, t.id).y), slots = [];
  for(let y = 40; y <= 76; y += 4) slots.push(y);
  const y = slots.find(v=>!used.some(u=>Math.abs(u - v) < 2)) ?? slots[d.texts.length % slots.length];
  d.texts.push({ id, text:L('Nouveau texte','New text') });
  tpSetPos(d, id, 0, y);
  scheduleAutosave();
  refreshTPPreview();
  tpSelect(id); tpRenderToolbar();
  const el = document.querySelector('#tpPreviewShell [data-tpk="' + id + '"]');
  if(el){
    try{ el.focus({ preventScroll:true }); const r = document.createRange(); r.selectNodeContents(el); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); }catch(err){}
  }
}
function tpFtxDel(id){
  const d = ensureTPDesign(S.project);
  id = id || tpSel; if(!tpIsFtx(id)) return;
  const i = tpFtxList(d).findIndex(t=>t.id===id); if(i<0) return;
  d.texts.splice(i, 1);
  ['Font','Color','Align','Size'].forEach(x=>{ delete d[id + x]; });
  if(d.fmt) delete d.fmt[id];
  if(d.pos) delete d.pos[id];
  if(!d.texts.length) delete d.texts;
  scheduleAutosave();
  tpSel = 'none'; tpCloseMenus();
  refreshTPPreview(); tpRenderToolbar();
}
/* Suppr / Retour arrière sur un texte libre sélectionné (sans curseur dedans) : il est supprimé. */
document.addEventListener('keydown', e => {
  if(!S || S.tab !== 'titlepage' || S.tpDrawMode || tpFsEl || !tpIsFtx(tpSel) || !document.getElementById('tpRoot')) return;
  if(e.key !== 'Delete' && e.key !== 'Backspace') return;
  const t = e.target;
  if(t && ((t.matches && t.matches('input, textarea, select')) || t.isContentEditable)) return;
  e.preventDefault(); tpFtxDel(tpSel);
});

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
  const put = (n, k) => {
    const q = tpPosOf(d, k);
    n.style.transform = (q.x || q.y) ? `translate(calc(var(--page-w,21cm) * ${q.x/100}), calc(var(--page-h,29.7cm) * ${q.y/100}))` : '';
  };
  for(const k in TP_POS_SEL){
    const n = tp.querySelector(TP_POS_SEL[k]); if(!n) continue;
    put(n, k);
  }
  tp.querySelectorAll('.tp-ftx[data-ftx]').forEach(n => put(n, n.dataset.ftx));   // textes libres : même décalage, posé sur leur cadre
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
    tpSetPos(d, k, 0, tpIsFtx(k) ? tpPosOf(d, k).y : 0);   // texte libre : recentré, à la même hauteur tpApplyPositions(tp, d); tpUpdateMoveHandle(); scheduleAutosave();
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

/* =====================================================================
   v90 — DESSIN SUR LA PAGE DE TITRE : moteur par traits
   ---------------------------------------------------------------------
   Avant, le dessin était une simple image : un seul crayon, une poignée
   de couleurs, et deux gestes possibles — tout garder ou tout effacer.
   Il pouvait aussi disparaître : les traits en cours n'étaient enregistrés
   qu'en cliquant sur « Terminer », et toute reconstruction de l'aperçu
   (taper dans un champ, quitter l'onglet…) repartait de l'ancienne image.

   Maintenant chaque trait est une donnée à part entière (design.strokes) :
     · il est enregistré dès qu'il est tracé — rien ne se perd, même si on
       quitte l'onglet ou si l'aperçu est reconstruit ;
     · on peut revenir en arrière trait par trait (Ctrl/⌘ Z), refaire
       (Ctrl/⌘ Maj Z), et « Tout effacer » lui-même s'annule ;
     · les traits sont des coordonnées en fraction de la largeur de la page :
       le dessin reste net à n'importe quel zoom, au plein écran comme au PDF.
   design.drawing reste l'image (PNG transparent) que lisent l'aperçu,
   l'impression et l'export PDF : elle est reconstruite à partir des traits,
   donc tout le reste de l'application fonctionne exactement comme avant.
   Un dessin fait avec l'ancienne version est gardé tel quel comme fond
   (design.strokesBase) : on dessine par-dessus, on peut même le gommer.
===================================================================== */
const TPD_TOOLS = [
  {id:'pen',    fr:'Stylo',      en:'Pen',         mul:1,   alpha:1,   key:'p'},
  {id:'marker', fr:'Feutre',     en:'Marker',      mul:1.7, alpha:.84, key:'m'},
  {id:'pencil', fr:'Crayon',     en:'Pencil',      mul:1.1, alpha:1,   key:'c'},
  {id:'brush',  fr:'Pinceau',    en:'Brush',       mul:1.6, alpha:1,   key:'b'},
  {id:'hl',     fr:'Surligneur', en:'Highlighter', mul:3.6, alpha:.38, key:'h'},
  {id:'eraser', fr:'Gomme',      en:'Eraser',      mul:1.8, alpha:1,   key:'e'}
];
const TPD_ICON = {
  pen:'<path d="M3 13.2l.9-3.4L11.3 2.4l2.3 2.3-7.4 7.4z"/><path d="M10 3.7l2.3 2.3M3 13.2l3.2-.9"/>',
  marker:'<path d="M4.4 14.2l-1.9.3.4-2.2 7.3-7.3 1.8 1.8z"/><path d="M9.2 4.9l2.1-2.1 2.3 2.3-2.1 2.1"/><path d="M2.5 14.6h4"/>',
  pencil:'<path d="M3 13l.7-3.1 7.2-7.2 2.4 2.4-7.2 7.2z"/><path d="M9.3 4.3l2.4 2.4"/><path d="M2.4 14.6h11"/>',
  brush:'<path d="M13.6 2.4c-3.2.4-5.7 2.8-6.8 5.5l1.6 1.6c2.6-1 5.1-3.5 5.2-7.1z"/><path d="M6.8 8c-2 0-3.6 1.2-3.6 3.2 0 1-.6 1.7-1.4 2.2 2.6.7 6.1-.2 6.1-3.5"/>',
  hl:'<path d="M9.6 2.4l4 4-5.1 5.1-4-4z"/><path d="M4.5 7.5L3 11l2.7-.6M2.4 14.2h7.6"/>',
  eraser:'<path d="M3.2 10.4l5.7-6.2 4 3.6-4.6 5.1H5.6z"/><path d="M7.6 6.9l4 3.6M8.5 13.4h5.6"/>',
  undo:'<path d="M3.6 6.4h5.9a3.4 3.4 0 010 6.8H6.2"/><path d="M6.2 3.4L3.2 6.4l3 3"/>',
  redo:'<path d="M12.4 6.4H6.5a3.4 3.4 0 000 6.8h3.3"/><path d="M9.8 3.4l3 3-3 3"/>',
  trash:'<path d="M2.8 4.4h10.4M6.4 4.4V2.9h3.2v1.5M4.3 4.4l.6 8.8h6.2l.6-8.8M7 6.8v4M9 6.8v4"/>',
  hand:'<path d="M5.3 8.4V3.9a1 1 0 012 0V7.2M7.3 7.2V2.9a1 1 0 012 0V7.2M9.3 7.2V3.9a1 1 0 012 0V9.6c0 2.5-1.5 4-4.1 4-1.8 0-2.7-.8-3.7-2.3L2.4 9a1 1 0 011.6-1.2l1.3 1.6"/>',
  eye:'<path d="M10.6 2.4a1.8 1.8 0 012.6 2.5l-2 2 .7.7-1 1-4.2-4.2 1-1 .7.7zM8.6 7.5l-5 5v1h1l5-5"/>',
  full:'<path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/>',
  fit:'<path d="M2.5 6V3.5H5M11 3.5h2.5V6M13.5 10v2.5H11M5 12.5H2.5V10"/><rect x="5.2" y="5.2" width="5.6" height="5.6" rx=".8"/>',
  check:'<path d="M3 8.5l3.2 3.2L13 4.8"/>'
};
function tpdIco(n, sz){ return `<svg width="${sz||16}" height="${sz||16}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${TPD_ICON[n]||''}</svg>`; }

const TPD_PREF_KEY = 'scriptmm_tp_pen';
const TPD = {
  autoFs:false, hintTimer:0,
  tool:'pen', color:'#23262E', alpha:1, recent:[],
  sizes:{pen:4, marker:4, pencil:5, brush:5, hl:5, eraser:8},
  hand:false, space:false, seenPen:false, pop:null, clearArmed:false, clearTimer:0,
  dref:null, undo:[], redo:[],
  cur:null, pid:null, cv:null, ctx:null, lv:null, lctx:null, comm:null, cctx:null, ring:null, tp:null,
  W:0, H:0, raf:0, rasterTimer:0, resizeTimer:0, base:null, baseSrc:''
};
(function(){
  try{
    const o = JSON.parse(localStorage.getItem(TPD_PREF_KEY) || 'null'); if(!o || typeof o !== 'object') return;
    if(TPD_TOOLS.some(t=>t.id===o.tool)) TPD.tool = o.tool;
    if(/^#[0-9a-f]{6}$/i.test(o.color||'')) TPD.color = o.color;
    if(isFinite(+o.alpha)) TPD.alpha = Math.max(.1, Math.min(1, +o.alpha));
    if(o.sizes) for(const k in TPD.sizes) if(isFinite(+o.sizes[k])) TPD.sizes[k] = Math.max(1, Math.min(60, Math.round(+o.sizes[k])));
    if(Array.isArray(o.recent)) TPD.recent = o.recent.filter(c=>/^#[0-9a-f]{6}$/i.test(c)).slice(0,10);
  }catch(e){}
})();
function tpdSavePrefs(){
  try{ localStorage.setItem(TPD_PREF_KEY, JSON.stringify({tool:TPD.tool, color:TPD.color, alpha:TPD.alpha, sizes:TPD.sizes, recent:TPD.recent})); }catch(e){}
  S.tpPenColor = TPD.color; S.tpPenSize = TPD.sizes[TPD.tool];
}
function tpdToolOf(id){ return TPD_TOOLS.find(t=>t.id===(id||TPD.tool)) || TPD_TOOLS[0]; }
function tpdRatio(){ return S.project && S.project.format==='us' ? 11/8.5 : 29.7/21; }
function tpdD(){
  const d = ensureTPDesign(S.project);
  if(!Array.isArray(d.strokes)){ d.strokes = []; d.strokesBase = d.drawing || null; d.strokesRev = 1; d.drawingRev = 1; }
  if(!isFinite(d.strokesRev)) d.strokesRev = 1;
  if(TPD.dref !== d){ TPD.dref = d; TPD.undo = []; TPD.redo = []; }
  return d;
}
function tpdHas(d){ return Array.isArray(d.strokes) ? (d.strokes.length > 0 || !!d.strokesBase) : !!d.drawing; }

/* ---------- rendu des traits (même code à l'écran, dans l'image enregistrée, au PDF) ---------- */
function tpdRng(seed){
  let a = seed | 0;
  return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function tpdSmoothPath(ctx, P, W){
  ctx.beginPath(); ctx.moveTo(P[0][0]*W, P[0][1]*W);
  if(P.length === 2){ ctx.lineTo(P[1][0]*W, P[1][1]*W); return; }
  for(let i = 1; i < P.length - 1; i++){
    const mx = (P[i][0] + P[i+1][0]) / 2 * W, my = (P[i][1] + P[i+1][1]) / 2 * W;
    ctx.quadraticCurveTo(P[i][0]*W, P[i][1]*W, mx, my);
  }
  const l = P[P.length-1]; ctx.lineTo(l[0]*W, l[1]*W);
}
/* Trait à largeur variable (pinceau, stylo sensible à la pression) : un ruban rempli d'un seul tenant, donc sans surépaisseur si le trait est translucide. */
function tpdRibbon(ctx, P, W, wf, base){
  // 1) lissage de la ligne centrale (Chaikin) et des largeurs
  let pts = P.map((q,i)=>({x:q[0]*W, y:q[1]*W, w:wf[i]*base}));
  for(let it = 0; it < 2; it++){
    const out = [pts[0]];
    for(let i = 0; i < pts.length - 1; i++){
      const a = pts[i], b = pts[i+1];
      out.push({x:.75*a.x+.25*b.x, y:.75*a.y+.25*b.y, w:.75*a.w+.25*b.w}, {x:.25*a.x+.75*b.x, y:.25*a.y+.75*b.y, w:.25*a.w+.75*b.w});
    }
    out.push(pts[pts.length-1]); pts = out;
  }
  const n = pts.length, Lp = [], Rp = [];
  for(let i = 0; i < n; i++){
    const a = pts[Math.max(0, i-1)], b = pts[Math.min(n-1, i+1)];
    let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const hw = Math.max(.3, pts[i].w / 2);
    Lp.push([pts[i].x - dy*hw, pts[i].y + dx*hw]); Rp.push([pts[i].x + dy*hw, pts[i].y - dx*hw]);
  }
  ctx.beginPath(); ctx.moveTo(Lp[0][0], Lp[0][1]);
  for(let i = 1; i < n; i++) ctx.lineTo(Lp[i][0], Lp[i][1]);
  for(let i = n - 1; i >= 0; i--) ctx.lineTo(Rp[i][0], Rp[i][1]);
  ctx.closePath();
  // les bouts arrondis tournent dans le même sens que le ruban : en remplissage « non-zéro », deux sens opposés se creuseraient
  let area = 0; const ring = Lp.concat(Rp.slice().reverse());
  for(let i = 0; i < ring.length; i++){ const a = ring[i], b = ring[(i + 1) % ring.length]; area += a[0]*b[1] - b[0]*a[1]; }
  const ccw = area < 0, f = pts[0], l = pts[n-1];
  ctx.moveTo(f.x + Math.max(.3, f.w/2), f.y); ctx.arc(f.x, f.y, Math.max(.3, f.w/2), 0, Math.PI*2, ccw);
  ctx.moveTo(l.x + Math.max(.3, l.w/2), l.y); ctx.arc(l.x, l.y, Math.max(.3, l.w/2), 0, Math.PI*2, ccw);
  ctx.fill();
}
function tpdPencil(ctx, P, W, w, a, seed){
  const rnd = tpdRng(seed || 1);
  ctx.globalAlpha = Math.min(1, .5 * a);
  const hasPr = P.some(q=>q[2] > 0);
  let cnt = 0; ctx.beginPath();
  const stamp = (x, y, pw)=>{
    const k = Math.max(2, Math.round(pw * .5));
    for(let j = 0; j < k; j++){
      const r = Math.sqrt(rnd()) * pw * .5, th = rnd() * Math.PI * 2, dr = Math.max(.35, pw * .1 * (.6 + rnd() * .8));
      const px = x + r * Math.cos(th), py = y + r * Math.sin(th);
      ctx.moveTo(px + dr, py); ctx.arc(px, py, dr, 0, Math.PI*2);
    }
    if(++cnt >= 28){ ctx.fill(); ctx.beginPath(); cnt = 0; }
  };
  const wAt = i => hasPr && P[i][2] > 0 ? w * (.35 + .9 * P[i][2]) : w;
  if(P.length === 1){ for(let r = 0; r < 6; r++) stamp(P[0][0]*W, P[0][1]*W, w); }
  for(let i = 0; i < P.length - 1; i++){
    const x0 = P[i][0]*W, y0 = P[i][1]*W, x1 = P[i+1][0]*W, y1 = P[i+1][1]*W;
    const len = Math.hypot(x1 - x0, y1 - y0), step = Math.max(.7, w * .16), steps = Math.max(1, Math.ceil(len / step));
    for(let s = 0; s < steps; s++){ const t = s / steps; stamp(x0 + (x1-x0)*t, y0 + (y1-y0)*t, wAt(i) + (wAt(i+1) - wAt(i)) * t); }
  }
  if(cnt) ctx.fill();
}
function tpdStroke(ctx, s, W){
  const P = s.p; if(!P || !P.length) return;
  const w = Math.max(.7, s.w * W), a = s.a == null ? 1 : s.a;
  ctx.save();
  ctx.lineCap = s.t === 'hl' ? 'butt' : 'round'; ctx.lineJoin = 'round';
  const col = s.t === 'eraser' ? '#000' : s.c;
  if(s.t === 'eraser') ctx.globalCompositeOperation = 'destination-out';
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.globalAlpha = a;
  if(s.t === 'pencil'){ tpdPencil(ctx, P, W, w, a, s.s); ctx.restore(); return; }
  const press = P.some(q=>q[2] > 0);
  if(P.length === 1){
    const pw = press && P[0][2] > 0 ? w * (.35 + .9 * P[0][2]) : w;
    ctx.beginPath(); ctx.arc(P[0][0]*W, P[0][1]*W, s.t === 'hl' ? pw/2 : Math.max(.35, pw/2), 0, Math.PI*2); ctx.fill();
  }else if(s.t === 'brush' || (s.t === 'pen' && press)){
    const n = P.length; let f = P.map((q,i)=>{
      if(q[2] > 0) return .25 + 1.0 * q[2];
      const a0 = P[Math.max(0,i-1)], b0 = P[Math.min(n-1,i+1)];
      return 1.15 - Math.min(.8, Math.hypot(b0[0]-a0[0], b0[1]-a0[1]) * 25);
    });
    for(let pass = 0; pass < 3; pass++) f = f.map((v,i)=>(f[Math.max(0,i-1)] + v + f[Math.min(n-1,i+1)]) / 3);
    if(s.t === 'brush') f = f.map((v,i)=> v * (.45 + .55 * Math.min(1, (i + 1) / 5)) * (.3 + .7 * Math.min(1, (n - i) / 6)));
    tpdRibbon(ctx, P, W, f, w);
  }else{
    ctx.lineWidth = w; tpdSmoothPath(ctx, P, W); ctx.stroke();
  }
  ctx.restore();
}
function tpdPaintAll(ctx, W, H, d, base){
  ctx.clearRect(0, 0, W, H);
  if(d.strokesBase && base) ctx.drawImage(base, 0, 0, W, H);
  (d.strokes || []).forEach(s=>tpdStroke(ctx, s, W));
}
/* Simplifie un trait fini (Douglas-Peucker) : moins de points, même dessin. */
function tpdSimplify(P, eps){
  if(P.length < 3) return P;
  const keep = new Uint8Array(P.length); keep[0] = keep[P.length-1] = 1;
  const st = [[0, P.length-1]];
  while(st.length){
    const [i0, i1] = st.pop(); let md = 0, mi = -1;
    const ax = P[i0][0], ay = P[i0][1], bx = P[i1][0], by = P[i1][1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
    for(let i = i0 + 1; i < i1; i++){
      const dd = Math.abs((P[i][0]-ax)*dy - (P[i][1]-ay)*dx) / L;
      if(dd > md){ md = dd; mi = i; }
    }
    if(md > eps && mi > 0){ keep[mi] = 1; st.push([i0, mi], [mi, i1]); }
  }
  return P.filter((q,i)=>keep[i]);
}

/* ---------- image enregistrée (design.drawing) reconstruite à partir des traits ---------- */
function tpdBaseReady(d){ return !d.strokesBase || (TPD.base && TPD.baseSrc === d.strokesBase && TPD.base.complete && TPD.base.naturalWidth); }
function tpdLoadBase(d){
  return new Promise(res=>{
    if(!d.strokesBase){ res(); return; }
    if(tpdBaseReady(d)){ res(); return; }
    const im = new Image();
    im.onload = ()=>{ TPD.base = im; TPD.baseSrc = d.strokesBase; res(); };
    im.onerror = ()=>res();
    im.src = d.strokesBase;
  });
}
function tpdBuildRaster(d){
  if(!Array.isArray(d.strokes)) return true;
  if(!d.strokes.length && !d.strokesBase){ d.drawing = null; d.drawingRev = d.strokesRev; return true; }
  if(!tpdBaseReady(d)) return false;
  const W = 2400, H = Math.round(W * tpdRatio());
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  tpdPaintAll(cv.getContext('2d'), W, H, d, TPD.base);
  try{ d.drawing = cv.toDataURL('image/png'); }catch(e){ return false; }
  d.drawingRev = d.strokesRev; return true;
}
/* Appelée par buildTitlePageEl : l'image affichée / imprimée / exportée est toujours à jour avec les traits. */
function tpdSyncRaster(d){
  if(!d || !Array.isArray(d.strokes) || d.drawingRev === d.strokesRev) return;
  if(tpdBuildRaster(d)) return;
  // fond d'un ancien dessin pas encore décodé : on le charge, puis on reconstruit
  tpdLoadBase(d).then(()=>{ if(tpdBuildRaster(d)){ scheduleAutosave(); if(S.tab==='titlepage' && !S.tpDrawMode && document.getElementById('tpPreviewShell')) refreshTPPreview(); } });
}
function tpdFlush(){
  clearTimeout(TPD.rasterTimer); TPD.rasterTimer = 0;
  if(!S.project) return;
  const d = ensureTPDesign(S.project);
  if(Array.isArray(d.strokes) && d.drawingRev !== d.strokesRev) tpdBuildRaster(d);
}
function tpdChanged(){
  const d = tpdD(); d.strokesRev++;
  clearTimeout(TPD.rasterTimer); TPD.rasterTimer = setTimeout(()=>{ TPD.rasterTimer = 0; tpdFlush(); }, 220);
  scheduleAutosave(); tpdSyncBars();
}
window.addEventListener('pagehide', ()=>{ try{ tpdFlush(); }catch(e){} });
document.addEventListener('visibilitychange', ()=>{ if(document.hidden){ try{ tpdFlush(); }catch(e){} } });

/* ---------- canevas : accroche / décroche sur une page (aperçu ou plein écran) ---------- */
function tpdTargetW(tp){
  const r = tp.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  return Math.round(Math.max(1400, Math.min(3000, (r.width || 600) * dpr)));
}
function tpdSizeCanvases(W){
  const H = Math.round(W * tpdRatio());
  TPD.W = W; TPD.H = H;
  [TPD.cv, TPD.lv, TPD.comm].forEach(c=>{ if(c){ c.width = W; c.height = H; } });
}
function tpdRebuild(){
  if(!TPD.cv) return;
  const d = tpdD();
  tpdPaintAll(TPD.cctx, TPD.W, TPD.H, d, TPD.base);
  TPD.ctx.clearRect(0, 0, TPD.W, TPD.H); TPD.ctx.drawImage(TPD.comm, 0, 0);
  TPD.lctx.clearRect(0, 0, TPD.W, TPD.H);
}
function tpdAttach(tp){
  tpdDetach();
  const d = tpdD();
  TPD.tp = tp;
  const mk = id => { const c = document.createElement('canvas'); if(id) c.id = id; return c; };
  TPD.cv = mk('tpDrawCanvas'); TPD.lv = mk('tpDrawLive'); TPD.comm = mk();
  TPD.ctx = TPD.cv.getContext('2d'); TPD.lctx = TPD.lv.getContext('2d'); TPD.cctx = TPD.comm.getContext('2d');
  tpdSizeCanvases(tpdTargetW(tp));
  tp.appendChild(TPD.cv); tp.appendChild(TPD.lv);
  TPD.ring = document.createElement('div'); TPD.ring.className = 'tp-d-ring'; tp.appendChild(TPD.ring);
  const cv = TPD.cv;
  cv.addEventListener('pointerdown', tpdDown);
  cv.addEventListener('pointermove', tpdMove);
  cv.addEventListener('pointerup', tpdUp);
  cv.addEventListener('pointercancel', tpdUp);
  cv.addEventListener('pointerleave', ()=>{ if(TPD.ring) TPD.ring.style.display = 'none'; });
  cv.addEventListener('contextmenu', e=>e.preventDefault());
  tpCanvas = cv; tpCtx = TPD.ctx;
  tpdRebuild();
  if(d.strokesBase && !tpdBaseReady(d)) tpdLoadBase(d).then(()=>{ if(TPD.cv === cv){ tpdRebuild(); } });
  tpdSyncBars();
}
function tpdDetach(){
  if(TPD.raf){ cancelAnimationFrame(TPD.raf); TPD.raf = 0; }
  [TPD.cv, TPD.lv, TPD.ring].forEach(n=>{ if(n && n.parentNode) n.parentNode.removeChild(n); });
  TPD.cv = TPD.lv = TPD.ring = TPD.comm = TPD.ctx = TPD.lctx = TPD.cctx = TPD.tp = null; TPD.cur = null;
  tpCanvas = null; tpCtx = null;
}
/* Le zoom / la taille de la page change : on redessine les traits à la bonne résolution (jamais flou, jamais démesuré). */
function tpdMaybeResize(){
  if(!TPD.cv || !TPD.tp) return;
  clearTimeout(TPD.resizeTimer);
  TPD.resizeTimer = setTimeout(()=>{
    if(!TPD.cv || !TPD.tp || TPD.cur) return;
    const W = tpdTargetW(TPD.tp);
    if(Math.abs(W - TPD.W) / TPD.W > .25){ tpdSizeCanvases(W); tpdRebuild(); }
  }, 240);
}
function tpdCancelStroke(){
  if(!TPD.cur) return;
  TPD.cur = null; if(TPD.lctx) TPD.lctx.clearRect(0, 0, TPD.W, TPD.H);
  tpdLive();
}

/* ---------- saisie ---------- */
function tpdPt(e){
  const r = TPD.cv.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height * tpdRatio();
  return [Math.round(x*10000)/10000, Math.round(y*10000)/10000, e.pointerType === 'pen' ? Math.round((e.pressure || .5)*100)/100 : 0];
}
function tpdAdd(e){
  const q = tpdPt(e), P = TPD.cur.p, l = P[P.length-1];
  if(l && Math.hypot(q[0]-l[0], q[1]-l[1]) < .0008) return;
  P.push(q);
}
function tpdDown(e){
  if(tpFsEl){ const h = tpFsEl.querySelector('.tp-fs-hint'); if(h) h.classList.remove('show'); }   // l\u2019aide se range dès qu\u2019on dessine
  if(tpFsEl){ const h = tpFsEl.querySelector('.tp-fs-hint'); if(h) h.classList.remove('show'); }   // l\u2019aide se range dès qu\u2019on dessine
  if(!S.tpDrawMode || !TPD.cv) return;
  if(e.pointerType === 'mouse' && e.button !== 0) return;
  if(e.pointerType === 'pen') TPD.seenPen = true;
  if(e.pointerType === 'touch' && TPD.seenPen) return;      // paume ignorée quand on dessine au stylet
  if(TPD.hand || TPD.space) return;
  e.preventDefault();
  if(TPD.pop){ tpdClosePop(); }
  if(TPD.cur) return;
  const t = tpdToolOf(), d = tpdD();
  const sz = TPD.sizes[t.id];
  TPD.cur = {t:t.id, c:TPD.color, w:Math.round(sz * .0016 * t.mul * 100000) / 100000, a:t.id === 'eraser' ? 1 : Math.round(t.alpha * TPD.alpha * 100) / 100, s:(Math.random() * 1e9) | 0, p:[]};
  TPD.pid = e.pointerId;
  try{ TPD.cv.setPointerCapture(e.pointerId); }catch(err){}
  tpdAdd(e); tpdLive();
}
function tpdMove(e){
  if(TPD.ring && TPD.tp && e.pointerType !== 'touch') tpdRing(e);
  if(!TPD.cur || e.pointerId !== TPD.pid) return;
  e.preventDefault();
  const list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
  if(list && list.length) list.forEach(ev=>tpdAdd(ev)); else tpdAdd(e);
  tpdLive();
}
function tpdUp(e){
  if(!TPD.cur || (e && e.pointerId !== TPD.pid)) return;
  if(e) e.preventDefault();
  const s = TPD.cur; TPD.cur = null;
  const hasPr = s.p.some(q=>q[2] > 0);
  if(s.t !== 'brush' && !hasPr) s.p = tpdSimplify(s.p, .00025);
  const d = tpdD();
  d.strokes.push(s);
  TPD.undo.push({k:'add', s}); if(TPD.undo.length > 400) TPD.undo.shift(); TPD.redo = [];
  tpdStroke(TPD.cctx, s, TPD.W);
  TPD.ctx.clearRect(0, 0, TPD.W, TPD.H); TPD.ctx.drawImage(TPD.comm, 0, 0);
  TPD.lctx.clearRect(0, 0, TPD.W, TPD.H);
  tpdChanged();
}
function tpdLive(){
  if(TPD.raf) return;
  TPD.raf = requestAnimationFrame(()=>{
    TPD.raf = 0; if(!TPD.cv) return;
    if(!TPD.cur){ return; }
    if(TPD.cur.t === 'eraser'){ TPD.ctx.clearRect(0, 0, TPD.W, TPD.H); TPD.ctx.drawImage(TPD.comm, 0, 0); tpdStroke(TPD.ctx, TPD.cur, TPD.W); }
    else{ TPD.lctx.clearRect(0, 0, TPD.W, TPD.H); tpdStroke(TPD.lctx, TPD.cur, TPD.W); }
  });
}
/* Cercle de la taille du trait sous la souris / le stylet. */
function tpdRing(e){
  const tp = TPD.tp, ring = TPD.ring; if(!tp || !ring) return;
  const r = tp.getBoundingClientRect(), sc = r.width / (tp.offsetWidth || r.width) || 1;
  const t = tpdToolOf(), dia = Math.max(6 / sc, TPD.sizes[t.id] * .0016 * t.mul * (tp.offsetWidth || r.width));
  ring.style.display = 'block';
  ring.style.width = ring.style.height = dia + 'px';
  ring.style.left = ((e.clientX - r.left) / sc) + 'px'; ring.style.top = ((e.clientY - r.top) / sc) + 'px';
  ring.style.borderWidth = (1.5 / sc) + 'px';
}

/* ---------- actions ---------- */
function tpdAfterHistory(){
  tpdRebuild(); tpdChanged();
}
function tpdUndo(){
  const d = tpdD(); tpdCancelStroke();
  const a = TPD.undo.pop(); if(!a) return;
  if(a.k === 'add'){ const i = d.strokes.lastIndexOf(a.s); if(i >= 0) d.strokes.splice(i, 1); }
  else if(a.k === 'clear'){ d.strokes = a.strokes.slice(); d.strokesBase = a.base; }
  TPD.redo.push(a); tpdAfterHistory();
}
function tpdRedo(){
  const d = tpdD(); tpdCancelStroke();
  const a = TPD.redo.pop(); if(!a) return;
  if(a.k === 'add') d.strokes.push(a.s);
  else if(a.k === 'clear'){ d.strokes = []; d.strokesBase = null; }
  TPD.undo.push(a); tpdAfterHistory();
}
/* « Tout effacer » : deux clics (le premier demande confirmation) et, de toute façon, il s'annule comme un trait. */
function tpdClear(){
  if(!TPD.clearArmed){
    TPD.clearArmed = true; clearTimeout(TPD.clearTimer);
    TPD.clearTimer = setTimeout(()=>{ TPD.clearArmed = false; tpdSyncBars(); tpdRefreshPanel(); }, 3500);
    tpdSyncBars(); tpdRefreshPanel(); return;
  }
  TPD.clearArmed = false; clearTimeout(TPD.clearTimer);
  const d = tpdD(); tpdCancelStroke();
  if(!tpdHas(d)){ tpdSyncBars(); tpdRefreshPanel(); return; }
  TPD.undo.push({k:'clear', strokes:d.strokes.slice(), base:d.strokesBase}); TPD.redo = [];
  d.strokes = []; d.strokesBase = null;
  if(TPD.cv) tpdRebuild();
  tpdChanged(); tpdFlush();
  if(!TPD.cv){ refreshTPPreview(); }
  tpdRefreshPanel();
}
function tpdSetTool(id){
  if(!TPD_TOOLS.some(t=>t.id===id)) return;
  TPD.tool = id; TPD.hand = false; tpdSavePrefs(); tpdClosePop(true); tpdRenderBars();
  const t = tpdToolOf(id); tpdHint(`<b>${L(t.fr, t.en)}</b> · ${L('taille et couleur dans la barre','size and color in the bar')}`, 2200);
}
/* Petite bulle en bas du plein écran : dit ce qu'on peut faire, puis s'efface toute seule. */
function tpdWelcome(){
  const touch = window.matchMedia && matchMedia('(pointer:coarse)').matches;
  return touch
    ? L('<b>Dessine avec le doigt ou le stylet</b> · pince pour zoomer · deux doigts pour déplacer','<b>Draw with a finger or stylus</b> · pinch to zoom · two fingers to move')
    : L('<b>Dessine directement sur la page</b> · molette pour zoomer · Espace + glisser pour déplacer','<b>Draw right on the page</b> · wheel to zoom · Space + drag to move');
}
function tpdHint(html, ms){
  if(!tpFsEl) return;
  let h = tpFsEl.querySelector('.tp-fs-hint');
  if(!h){ h = document.createElement('div'); h.className = 'tp-fs-hint'; h.setAttribute('role', 'status'); tpFsEl.appendChild(h); }
  h.innerHTML = html; h.classList.add('show');
  clearTimeout(TPD.hintTimer); TPD.hintTimer = setTimeout(()=>{ h.classList.remove('show'); }, ms || 3000);
}
function tpdSetColor(c){
  if(!/^#[0-9a-f]{6}$/i.test(c||'')) return;
  c = c.toLowerCase(); TPD.color = c;
  TPD.recent = [c, ...TPD.recent.filter(x=>x !== c)].slice(0, 10);
  if(TPD.tool === 'eraser') TPD.tool = 'pen';
  tpdSavePrefs(); tpdRenderBars();
}
function tpdSetSize(v, live){
  const n = Math.max(1, Math.min(60, Math.round(+v) || 1));
  TPD.sizes[TPD.tool] = n; tpdSavePrefs();
  document.querySelectorAll('.tp-d-sizev').forEach(x=>x.textContent = n);
  document.querySelectorAll('#tpdSize').forEach(x=>{ if(+x.value !== n) x.value = n; });
  tpdPreviewDot();
}
function tpdSetAlpha(v){
  TPD.alpha = Math.max(.1, Math.min(1, (+v || 100) / 100)); tpdSavePrefs();
  document.querySelectorAll('.tp-d-alphav').forEach(x=>x.textContent = Math.round(TPD.alpha*100) + '%');
  tpdPreviewDot();
}
function tpdPreviewDot(){
  const t = tpdToolOf(), px = Math.max(2, Math.min(40, TPD.sizes[t.id] * .0016 * t.mul * 560));
  document.querySelectorAll('.tp-d-dot').forEach(x=>{
    x.style.width = x.style.height = px + 'px';
    x.style.background = t.id === 'eraser' ? 'transparent' : TPD.color;
    x.style.border = t.id === 'eraser' ? '1.5px dashed var(--ink-soft)' : '0';
    x.style.opacity = t.id === 'eraser' ? 1 : Math.max(.15, t.alpha * TPD.alpha);
  });
}
function tpdClosePop(noRender){ if(!TPD.pop) return; TPD.pop = null; if(!noRender) tpdRenderBars(); }
function tpdTogglePop(name, bar){
  TPD.pop = (TPD.pop && TPD.pop.name === name && TPD.pop.bar === bar) ? null : {name, bar};
  tpdRenderBars();
}

/* ---------- barre d'outils (aperçu et plein écran partagent le même code) ---------- */
function tpdHsl(h, s, l){
  s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(v=>Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
function tpdPaletteColors(){
  const out = ['#ffffff','#e9edf2','#c9ced6','#9aa1ad','#5c6270','#3a3f4b','#23262e','#000000','#dceefb','#3699d4','#1f6fa0','#2f2e44'];
  [88, 74, 60, 46, 32].forEach(l=>{ for(let h = 0; h < 360; h += 30) out.push(tpdHsl(h, l >= 74 ? 85 : 78, l)); });
  return out;
}
function tpdColorPopHtml(){
  const cur = TPD.color.toLowerCase();
  const sw = c => `<button type="button" class="tp-swatch ${cur === c ? 'active' : ''}" style="background:${c}" data-tpd="color:${c}" title="${c}"></button>`;
  const rec = TPD.recent.length ? `<div class="tp-d-lbl">${L('Récentes','Recent')}</div><div class="tp-d-sw tp-d-sw-r">${TPD.recent.map(sw).join('')}</div>` : '';
  const eye = window.EyeDropper ? `<button type="button" class="tp-tb-btn" data-tpd="eyedrop" title="${L('Prendre une couleur à l\u2019écran','Pick a color from the screen')}">${tpdIco('eye')}</button>` : '';
  return `<div class="tp-tb-pop tp-d-pop tp-d-pop-color">${rec}<div class="tp-d-lbl">${L('Toutes les couleurs','All colors')}</div><div class="tp-d-sw">${tpdPaletteColors().map(sw).join('')}</div>
    <div class="tp-tb-pop-row"><span>${L('Autre couleur','Custom color')}</span><span class="tp-d-cust"><input type="color" id="tpdColorPick" value="${/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#23262e'}" aria-label="${L('Autre couleur','Custom color')}"><input type="text" id="tpdHex" class="tp-d-hex" value="${cur}" maxlength="7" spellcheck="false" aria-label="Hex">${eye}</span></div></div>`;
}
function tpdStrokePopHtml(){
  const t = tpdToolOf(), er = t.id === 'eraser';
  return `<div class="tp-tb-pop tp-d-pop tp-d-pop-stroke">
    <div class="tp-d-prev"><span class="tp-d-dot"></span></div>
    <div class="tp-d-row"><label for="tpdSize">${L('Taille','Size')}</label><input type="range" id="tpdSize" min="1" max="60" step="1" value="${TPD.sizes[t.id]}"><span class="tp-d-sizev">${TPD.sizes[t.id]}</span></div>
    ${er ? '' : `<div class="tp-d-row"><label for="tpdAlpha">${L('Opacité','Opacity')}</label><input type="range" id="tpdAlpha" min="10" max="100" step="5" value="${Math.round(TPD.alpha*100)}"><span class="tp-d-alphav">${Math.round(TPD.alpha*100)}%</span></div>`}
    <div class="tp-d-keys">${L('Raccourcis : [ et ] changent la taille','Shortcuts: [ and ] change the size')}</div></div>`;
}
function tpdBarHtml(bar){
  const fs = bar === 'fs', draw = !!S.tpDrawMode, sep = '<span class="tp-tb-sep"></span>';
  const d = S.project ? ensureTPDesign(S.project) : null;
  if(draw && S.project) tpdD();
  const zoom = fs ? `${draw ? sep : ''}<span class="tp-d-zoom"><button type="button" class="tp-tb-btn" data-tpd="zoomOut" title="${L('Dézoomer (−)','Zoom out (−)')}">−</button><button type="button" class="tp-tb-btn tp-d-zv" data-tpd="zoomFit" title="${L('Ajuster à l\u2019écran (0)','Fit to screen (0)')}">${Math.round((TPFS.z || 1) * 100)}%</button><button type="button" class="tp-tb-btn" data-tpd="zoomIn" title="${L('Zoomer (+)','Zoom in (+)')}">+</button><button type="button" class="tp-tb-btn" data-tpd="zoomFit" title="${L('Ajuster à l\u2019écran (0)','Fit to screen (0)')}">${tpdIco('fit')}</button></span>` : '';
  if(!draw){
    return `<button type="button" class="tp-tb-btn txt tp-d-go" data-tpd="draw">${tpdIco('pen')}<span>${L('Dessiner sur la page','Draw on the page')}</span></button>${sep}<span class="tp-d-zoom"><button type="button" class="tp-tb-btn" data-tpd="zoomOut" title="${L('Dézoomer (−)','Zoom out (−)')}">−</button><button type="button" class="tp-tb-btn tp-d-zv" data-tpd="zoomFit" title="${L('Ajuster à l\u2019écran (0)','Fit to screen (0)')}">${Math.round((TPFS.z || 1) * 100)}%</button><button type="button" class="tp-tb-btn" data-tpd="zoomIn" title="${L('Zoomer (+)','Zoom in (+)')}">+</button><button type="button" class="tp-tb-btn" data-tpd="zoomFit" title="${L('Ajuster à l\u2019écran (0)','Fit to screen (0)')}">${tpdIco('fit')}</button></span>`;
  }
  const tools = TPD_TOOLS.map(t=>`<button type="button" class="tp-tb-btn tp-d-tool ${TPD.tool === t.id && !TPD.hand ? 'on' : ''}" data-tpd="tool:${t.id}" aria-pressed="${TPD.tool === t.id && !TPD.hand ? 'true' : 'false'}" title="${L(t.fr, t.en)} (${t.key.toUpperCase()})">${tpdIco(t.id)}</button>`).join('');
  const hand = fs ? `<button type="button" class="tp-tb-btn tp-d-tool ${TPD.hand ? 'on' : ''}" data-tpd="hand" aria-pressed="${TPD.hand ? 'true' : 'false'}" title="${L('Déplacer la vue (Espace + glisser)','Move the view (Space + drag)')}">${tpdIco('hand')}</button>` : '';
  const pop = n => TPD.pop && TPD.pop.name === n && TPD.pop.bar === bar;
  const er = TPD.tool === 'eraser', t = tpdToolOf();
  const colorW = `<span class="tp-col-wrap"><button type="button" class="tp-tb-btn ${pop('color') ? 'on' : ''}" data-tpd="pop:color" title="${L('Couleur','Color')}"${er ? ' style="opacity:.55"' : ''}><span class="tp-tb-dot" style="background:${TPD.color}"></span><span class="tp-fm-caret">▾</span></button>${pop('color') ? tpdColorPopHtml() : ''}</span>`;
  const strokeW = `<span class="tp-col-wrap"><button type="button" class="tp-tb-btn ${pop('stroke') ? 'on' : ''}" data-tpd="pop:stroke" title="${L('Taille et opacité du trait','Stroke size and opacity')}"><span class="tp-d-dotbox"><span class="tp-d-dot"></span></span><span class="tp-fm-caret">▾</span></button>${pop('stroke') ? tpdStrokePopHtml() : ''}</span>`;
  const can = d && tpdHas(d);
  const hist = `<button type="button" class="tp-tb-btn" data-tpd="undo" title="${L('Annuler le trait (Ctrl/⌘ Z)','Undo stroke (Ctrl/⌘ Z)')}"${TPD.undo.length ? '' : ' disabled'}>${tpdIco('undo')}</button><button type="button" class="tp-tb-btn" data-tpd="redo" title="${L('Refaire (Ctrl/⌘ Maj Z)','Redo (Ctrl/⌘ Shift Z)')}"${TPD.redo.length ? '' : ' disabled'}>${tpdIco('redo')}</button>`;
  const clr = `<button type="button" class="tp-tb-btn tp-d-clear ${TPD.clearArmed ? 'armed' : ''}" data-tpd="clear" title="${L('Tout effacer (s\u2019annule avec Ctrl/⌘ Z)','Clear everything (undo with Ctrl/⌘ Z)')}"${can || TPD.clearArmed ? '' : ' disabled'}>${tpdIco('trash')}${TPD.clearArmed ? `<span>${L('Confirmer ?','Confirm?')}</span>` : ''}</button>`;
  const full = fs ? '' : `<button type="button" class="tp-tb-btn" data-tpd="fs" title="${L('Dessiner en plein écran, avec zoom','Draw full screen, with zoom')}">${tpdIco('full')}</button>`;
  return `${tools}${hand}${sep}${colorW}${strokeW}${sep}${hist}${sep}${clr}${fs ? '' : sep}${full}${zoom}${sep}<button type="button" class="tp-tb-btn txt tp-d-done" data-tpd="finish" title="${L('Terminer et revenir à la page (Échap)','Finish and go back to the page (Esc)')}">${tpdIco('check')}<span>${L('Terminer','Done')}</span></button>`;
}
function tpdPlacePop(bar){
  const pop = bar.querySelector('.tp-d-pop'); if(!pop) return;
  pop.style.left = '0'; pop.style.right = 'auto';
  const r = pop.getBoundingClientRect(), vw = window.innerWidth;
  let dx = 0; if(r.right > vw - 10) dx = vw - 10 - r.right; if(r.left + dx < 10) dx = 10 - r.left;
  if(dx) pop.style.left = dx + 'px';
}
function tpdRenderBars(){
  const main = document.getElementById('tpToolbar');
  if(main && S.tpDrawMode && !tpFsEl){
    main.innerHTML = tpdBarHtml('main');
    const pills = document.getElementById('tpPills'); if(pills) pills.innerHTML = '';
    tpdPlacePop(main);
  }
  const fb = document.getElementById('tpFsToolbar');
  if(fb){ fb.innerHTML = tpdBarHtml('fs'); tpdPlacePop(fb); }
  if(tpFsEl){ tpFsEl.classList.toggle('tp-fs-pan', !!(TPD.hand || TPD.space)); tpFsEl.classList.toggle('tp-fs-drawing', !!(S.tpDrawMode && TPD.autoFs)); }
  tpdPreviewDot(); tpdSyncBars();
  if(typeof tpFsApply === 'function' && tpFsEl) tpFsApply(true);
}
/* Met à jour l'état des boutons sans reconstruire la barre (un menu ouvert ne se referme pas). */
function tpdSyncBars(){
  const d = S.project ? ensureTPDesign(S.project) : null;
  const can = d && tpdHas(d);
  document.querySelectorAll('[data-tpd="undo"]').forEach(b=>b.disabled = !TPD.undo.length);
  document.querySelectorAll('[data-tpd="redo"]').forEach(b=>b.disabled = !TPD.redo.length);
  document.querySelectorAll('[data-tpd="clear"]').forEach(b=>{
    b.disabled = !(can || TPD.clearArmed);
    const armed = TPD.clearArmed;
    if(b.classList.contains('armed') !== armed){
      b.classList.toggle('armed', armed);
      b.innerHTML = tpdIco('trash') + (armed ? `<span>${L('Confirmer ?','Confirm?')}</span>` : '');
    }
  });
}

/* ---------- panneau « Dessin » (colonne de droite) ---------- */
function tpdRefreshPanel(){
  const dc = document.getElementById('tpDrawControls'); if(dc) dc.innerHTML = tpDrawControlsHtml();
}
function tpDrawControlsHtml(){
  const d = ensureTPDesign(S.project), can = tpdHas(d);
  const clr = `<button type="button" class="btn btn-sm ${TPD.clearArmed ? 'btn-danger' : 'btn-ghost'}" data-tpd="clear"${can || TPD.clearArmed ? '' : ' disabled'}>${TPD.clearArmed ? L('Confirmer : tout effacer ?','Confirm: clear everything?') : L('Tout effacer','Clear everything')}</button>`;
  if(S.tpDrawMode){
    return `<p class="tp-tip" style="padding:9px 12px; font-size:12.5px; line-height:1.55;">${L('Tu dessines en plein écran. Les outils sont dans la barre en haut de la page.','You are drawing in full screen. The tools are in the bar at the top of the page.')}<br><b>Ctrl/⌘ Z</b> ${L('annule le dernier trait','undoes the last stroke')} · <b>Ctrl/⌘ Maj Z</b> ${L('le refait','redoes it')}.</p>
    <div class="tp-draw-toolbar">
      <button type="button" class="btn btn-sm" data-tpd="fs">${tpdIco('full', 14)} ${L('Dessiner en plein écran','Draw full screen')}</button>
      ${clr}
    </div>
    <div class="tp-draw-toolbar"><button type="button" class="btn btn-sm btn-primary" data-tpd="finish">${L('Terminer le dessin','Finish drawing')}</button></div>`;
  }
  return `<p class="tp-tip" style="padding:9px 12px; font-size:12.5px; line-height:1.55;">${L('Dessine directement sur la page de titre : logo, croquis, signature… Elle s\u2019ouvre en plein écran avec tous les outils, la palette et le zoom.','Draw directly on the title page: logo, sketch, signature… It opens full screen with every tool, the palette and zoom.')}</p>
  <div class="tp-draw-toolbar">
    <button type="button" class="btn btn-sm btn-primary" data-tpd="draw">${icon('pen')} ${L('Dessiner sur la page','Draw on the page')}</button>
    ${can ? clr.replace(L('Tout effacer','Clear everything'), L('Effacer le dessin','Clear the drawing')) : ''}
  </div>`;
}

/* ---------- entrée / sortie du mode dessin ---------- */
function tpToggleDraw(){
  if(S.tpDrawMode) return;
  tpCloseMenus(); tpdD();
  S.tpDrawMode = true; TPD.pop = null;
  tpdSavePrefs();
  if(tpFsEl){ TPD.autoFs = false; tpFsRebuildPage(); }   // déjà en plein écran (aperçu seul) : on y reste
  else{ TPD.autoFs = true; tpFullscreen(); }              // sinon « Dessiner » ouvre directement le plein écran
  tpRenderToolbar(); tpdRefreshPanel(); tpdRenderBars();
  tpdHint(tpdWelcome(), 6500);
}
function tpFinishDraw(){
  if(!S.tpDrawMode) return;
  tpdCancelStroke(); tpdFlush(); tpdDetach();
  S.tpDrawMode = false; TPD.pop = null; TPD.hand = false; TPD.clearArmed = false;
  scheduleAutosave();
  if(tpFsEl && TPD.autoFs){ TPD.autoFs = false; tpFullscreenExit(); tpRebuildControls(); return; }   // « Terminer » ramène à la page, le dessin est déjà dans l'aperçu
  if(tpFsEl) tpFsRebuildPage();
  refreshTPPreview(); tpRebuildControls(); tpRenderToolbar(); tpdRenderBars();
}
function tpClearDrawing(){ tpdClear(); }
function tpSetPenColor(id){ tpdSetColor(id); }
function tpSetPenSize(id){ tpdSetSize(id); }

/* ---------- clics, saisie, clavier ---------- */
document.addEventListener('click', e=>{
  const b = e.target && e.target.closest ? e.target.closest('[data-tpd]') : null; if(!b || b.disabled) return;
  e.preventDefault();
  const v = String(b.dataset.tpd), i = v.indexOf(':'), a = i < 0 ? v : v.slice(0, i), arg = i < 0 ? '' : v.slice(i + 1);
  const bar = b.closest('.tp-fs-tb') ? 'fs' : 'main';
  switch(a){
    case 'tool': tpdSetTool(arg); break;
    case 'hand': TPD.hand = !TPD.hand; tpdClosePop(true); tpdRenderBars(); break;
    case 'pop': tpdTogglePop(arg, bar); break;
    case 'color': tpdSetColor(arg); TPD.pop = null; tpdRenderBars(); break;
    case 'undo': tpdUndo(); break;
    case 'redo': tpdRedo(); break;
    case 'clear': tpdClear(); break;
    case 'finish': tpFinishDraw(); break;
    case 'draw': tpToggleDraw(); break;
    case 'fs': tpFullscreen(); break;
    case 'fsexit': tpFullscreenExit(); break;
    case 'zoomIn': tpFsZoom(1.25); break;
    case 'zoomOut': tpFsZoom(1 / 1.25); break;
    case 'zoomFit': tpFsFitReset(); break;
    case 'eyedrop':
      try{ new window.EyeDropper().open().then(r=>{ if(r && r.sRGBHex) tpdSetColor(r.sRGBHex); }).catch(()=>{}); }catch(err){}
      break;
  }
});
document.addEventListener('input', e=>{
  const t = e.target; if(!t) return;
  if(t.id === 'tpdSize') tpdSetSize(t.value, true);
  else if(t.id === 'tpdAlpha') tpdSetAlpha(t.value);
  else if(t.id === 'tpdColorPick'){
    TPD.color = String(t.value).toLowerCase(); if(TPD.tool === 'eraser') TPD.tool = 'pen'; tpdSavePrefs();
    document.querySelectorAll('.tp-tb .tp-tb-dot').forEach(x=>x.style.background = TPD.color);
    const hx = document.getElementById('tpdHex'); if(hx) hx.value = TPD.color;
    tpdPreviewDot();
  }
});
document.addEventListener('change', e=>{
  const t = e.target; if(!t) return;
  if(t.id === 'tpdColorPick'){ TPD.recent = [TPD.color, ...TPD.recent.filter(x=>x !== TPD.color)].slice(0, 10); tpdSavePrefs(); tpdRenderBars(); }
  else if(t.id === 'tpdHex'){
    let v = String(t.value).trim(); if(v[0] !== '#') v = '#' + v;
    if(/^#[0-9a-f]{3}$/i.test(v)) v = '#' + v.slice(1).split('').map(c=>c + c).join('');
    if(/^#[0-9a-f]{6}$/i.test(v)){ tpdSetColor(v); } else t.value = TPD.color;
  }
});
document.addEventListener('mousedown', e=>{
  if(TPD.pop && e.target && e.target.closest && !e.target.closest('.tp-col-wrap, .tp-d-pop')) tpdClosePop();
}, true);
document.addEventListener('keydown', e=>{
  if(!S || !(S.tpDrawMode || tpFsEl)) return;
  if(S.tab !== 'titlepage' && !tpFsEl) return;
  const t = e.target, typing = t && ((t.matches && t.matches('input, textarea, select')) || t.isContentEditable);
  const k = String(e.key || '');
  if(k === 'Escape' && TPD.pop){ e.preventDefault(); e.stopPropagation(); tpdClosePop(); return; }
  if(typing) return;
  const mod = e.ctrlKey || e.metaKey;
  if(S.tpDrawMode && mod && !e.altKey && k.toLowerCase() === 'z'){ e.preventDefault(); e.stopPropagation(); e.shiftKey ? tpdRedo() : tpdUndo(); return; }
  if(S.tpDrawMode && mod && !e.altKey && k.toLowerCase() === 'y'){ e.preventDefault(); e.stopPropagation(); tpdRedo(); return; }
  if(mod || e.altKey) return;
  if(k === ' ' && tpFsEl){ e.preventDefault(); TPD.space = true; if(tpFsEl) tpFsEl.classList.add('tp-fs-pan'); return; }
  if(tpFsEl){
    if(k === '+' || k === '='){ e.preventDefault(); tpFsZoom(1.25); return; }
    if(k === '-' || k === '_'){ e.preventDefault(); tpFsZoom(1 / 1.25); return; }
    if(k === '0'){ e.preventDefault(); tpFsFitReset(); return; }
  }
  if(!S.tpDrawMode) return;
  const tool = TPD_TOOLS.find(x=>x.key === k.toLowerCase());
  if(tool){ e.preventDefault(); e.stopPropagation(); tpdSetTool(tool.id); return; }
  if(k === '[' || k === ']'){ e.preventDefault(); tpdSetSize(TPD.sizes[TPD.tool] + (k === ']' ? 1 : -1) * (TPD.sizes[TPD.tool] >= 20 ? 3 : 1)); }
}, true);
document.addEventListener('keyup', e=>{
  if(e.key === ' ' && TPD.space){ TPD.space = false; if(tpFsEl) tpFsEl.classList.remove('tp-fs-pan'); }
}, true);
window.addEventListener('blur', ()=>{ TPD.space = false; if(tpFsEl) tpFsEl.classList.remove('tp-fs-pan'); });

/* =====================================================================
   PAGES SANS NUMÉRO — dans le scénario lui-même, autant qu'on veut
   ---------------------------------------------------------------------
   Comme dans WriterDuet : une page sans numéro est une vraie page du
   scénario, posée où l'on veut (avant la première scène, entre deux
   actes, à la fin...), qu'on voit et qu'on écrit directement dans
   l'éditeur, avec tous les outils habituels (types de ligne, Aligner,
   Carton : taille, police, cadre, centrage sur la page entière).

   Modèle : chaque ligne d'une page sans numéro porte el.fpg, l'identifiant
   de sa page. Des lignes qui se suivent avec le même fpg forment une page :
     · elle commence toujours sur une nouvelle feuille, et ce qui la suit
       aussi (voir computePagination, 07-pagination.js) ;
     · si son contenu dépasse une feuille, la suite passe sur une feuille
       de plus, elle aussi sans numéro ;
     · elle n'a pas de numéro et ne compte pas : la page suivante du
       scénario porte exactement le numéro qu'elle aurait eu sans elle
       (computePageLabels). Le verrouillage des pages (12A, 12B) l'ignore.
   Entrée sur une page sans numéro ajoute une ligne sur cette même page.
   Un scénario sans page sans numéro n'est en rien modifié.
===================================================================== */
/* Lignes [start, end) de la page sans numéro qui contient l'élément idx. */
function fpGroupRange(els, idx){
  const g = els[idx] && els[idx].fpg;
  if(!g) return null;
  let a = idx, b = idx + 1;
  while(a > 0 && els[a - 1].fpg === g) a--;
  while(b < els.length && els[b].fpg === g) b++;
  return { start:a, end:b };
}
/* Nombre de pages sans numéro du scénario (une par suite de lignes de même fpg). */
function fpCount(p){
  const els = (p && p.elements) || [];
  let n = 0;
  for(let i = 0; i < els.length; i++) if(els[i].fpg && (i === 0 || els[i - 1].fpg !== els[i].fpg)) n++;
  return n;
}
/* Modèles proposés à l'insertion (tout reste modifiable ensuite). */
function fpTemplate(kind){
  if(kind === 'center'){
    const el = newElement('card', '');
    el.card = Object.assign(cardDefaults(), { size:12, align:'center', bold:false, italic:false, caps:false, space:0, full:true });
    return el;
  }
  if(kind === 'title'){
    const el = newElement('card', '');
    el.card = Object.assign(cardDefaults(), { size:32, align:'center', bold:true, italic:false, caps:true, space:0, full:true });
    return el;
  }
  return newElement('action', '');
}
/* Où insérer « ici » : juste après la ligne en cours, sans jamais couper un bloc de dialogue, une paire
   simultanée ou une autre page sans numéro. */
function fpInsertIndexAfter(id){
  const els = S.project.elements;
  const idx = id ? findIdx(id) : -1;
  if(idx < 0) return els.length;
  const g = fpGroupRange(els, idx);
  if(g) return g.end;
  const pair = dualPairRange(idx);
  if(pair) return pair.end;
  const bs = dialogueBlockStart(idx);
  if(bs >= 0) return dialogueBlockAt(els, bs).end;
  return idx + 1;
}
function fpCurrentLineId(){
  const line = focusedLine();
  return (line && line.dataset.id) || lastFocusedLineId || null;
}
/* Rend l'éditeur à partir du modèle et place le curseur sur la ligne voulue (pagination complète). */
function fpRefresh(focusId){
  S.pagination._forceFull = true;
  if(S.view === 'editor' && S.tab === 'editor'){
    rebuildEditorAt(focusId, 0);
    const el = focusId ? findEl(focusId) : null;
    if(el) showContextPanel(el);
  }
  scheduleAutosave();
}

/* ---- Menu d'insertion ---- */
let fpMenuAnchor = null, fpWhere = 'here', fpSel = null;
/* Lignes couvertes par la sélection en cours (relevées à l'ouverture du menu : un clic dans le menu peut la perdre). */
function fpSelectedRange(){
  try{
    const sel = window.getSelection();
    if(!sel || !sel.rangeCount || sel.isCollapsed) return null;
    const r = sel.getRangeAt(0);
    const ln = n => { const h = n && (n.nodeType === 1 ? n : n.parentNode); return h && h.closest ? h.closest('#page .line[data-id]') : null; };
    const la = ln(r.startContainer), lb = ln(r.endContainer);
    if(!la || !lb) return null;
    const a = findIdx(la.dataset.id), b = findIdx(lb.dataset.id);
    return (a < 0 || b < 0) ? null : { a: Math.min(a, b), b: Math.max(a, b) };
  }catch(e){ return null; }
}
function openFreePageMenu(anchorId){
  if(!S.project) return;
  closeFreePageMenu();
  fpMenuAnchor = (typeof anchorId === 'string' && anchorId) ? anchorId : fpCurrentLineId();
  if(fpMenuAnchor && !findEl(fpMenuAnchor)) fpMenuAnchor = null;
  fpSel = fpSelectedRange();
  fpWhere = fpMenuAnchor ? 'here' : 'end';
  const cur = fpMenuAnchor ? findEl(fpMenuAnchor) : null;
  const btn = (kind, ic, title, sub) =>
    `<button class="btn" style="width:100%;margin-bottom:8px;justify-content:flex-start;text-align:left;height:auto;padding:9px 12px;" data-act="fpInsert" data-id="${kind}">${icon(ic)} <span><b>${title}</b><br><small style="font-weight:400;color:var(--ink-soft);">${sub}</small></span></button>`;
  const html = `<div class="modal-backdrop" id="fpBackdrop" data-act="closeFreePageMenuBg">
    <div class="modal" style="max-width:460px;">
      <h2>${L('Insérer une page sans numéro','Insert an unnumbered page')}</h2>
      <p style="font-size:13px;color:var(--ink-soft);line-height:1.5;margin:-6px 0 14px;">${L('Elle ne porte aucun numéro et ne compte pas : les pages du scénario gardent leur numérotation. Mets-en autant que tu veux, où tu veux, et personnalise-les comme n’importe quelle page.','It carries no number and is not counted: the script pages keep their numbering. Add as many as you like, wherever you like, and style them like any other page.')}</p>
      <div class="cp-lbl" style="font-size:12px;font-weight:600;margin-bottom:6px;">${L('Où ?','Where?')}</div>
      <div class="cp-seg" id="fpWhereSeg" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
        ${cur ? `<button class="btn btn-sm" data-act="fpSetWhere" data-id="here">${L('Ici, après la ligne en cours','Here, after the current line')}</button>` : ''}
        <button class="btn btn-sm" data-act="fpSetWhere" data-id="start">${L('Au début du scénario','At the start of the script')}</button>
        <button class="btn btn-sm" data-act="fpSetWhere" data-id="end">${L('À la fin','At the end')}</button>
      </div>
      <div class="cp-lbl" style="font-size:12px;font-weight:600;margin-bottom:6px;">${L('Page','Page')}</div>
      ${btn('text', 'emptypage', L('Page de texte','Text page'), L('Vierge : synopsis, note d’intention, remerciements... Laissée vide, elle sort blanche.','Blank: synopsis, statement, acknowledgments... Left empty, it prints blank.'))}
      ${btn('center', 'align', L('Texte centré au milieu de la page','Text centered on the page'), L('Dédicace, citation, épigraphe.','Dedication, quote, epigraph.'))}
      ${btn('title', 'card', L('Grand titre au milieu de la page','Big title on the page'), L('ACTE I, intercalaire, titre d’épisode.','ACT I, divider, episode title.'))}
      ${cur && !cur.fpg ? `<div style="border-top:1px solid var(--hair);margin:8px 0 12px;"></div>
      <button class="btn btn-sm" style="width:100%;justify-content:flex-start;" data-act="fpConvertSelection">${L('Mettre la ligne en cours (ou les lignes sélectionnées) sur une page sans numéro','Put the current line (or the selected lines) on an unnumbered page')}</button>` : ''}
      <div class="modal-actions"><button class="btn btn-ghost" data-act="closeFreePageMenu">${L('Annuler','Cancel')}</button></div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  fpSetWhere(fpWhere);
}
function closeFreePageMenu(){ const b = document.getElementById('fpBackdrop'); if(b) b.remove(); }
function fpSetWhere(w){
  if(w !== 'here' && w !== 'start' && w !== 'end') return;
  fpWhere = w;
  document.querySelectorAll('#fpWhereSeg [data-act="fpSetWhere"]').forEach(b => b.classList.toggle('btn-primary', b.dataset.id === w));
}
function fpInsert(kind){
  if(!S.project) return;
  const els = S.project.elements;
  const at = fpWhere === 'start' ? 0 : (fpWhere === 'here' && fpMenuAnchor) ? fpInsertIndexAfter(fpMenuAnchor) : els.length;
  closeFreePageMenu();
  pushUndo();
  const el = fpTemplate(kind);
  el.fpg = uid('fpg');
  els.splice(at, 0, el);
  fpRefresh(el.id);
  toast(L('Page sans numéro ajoutée : écris dedans comme sur n’importe quelle page.','Unnumbered page added: write on it like on any other page.'));
}
/* Lignes visées : la sélection si elle couvre plusieurs lignes, sinon la ligne en cours (avec tout son bloc
   de dialogue, qu'on ne coupe jamais en deux). */
function fpConvertSelection(){
  if(!S.project) return;
  const els = S.project.elements;
  let a = fpSel ? fpSel.a : (fpMenuAnchor ? findIdx(fpMenuAnchor) : -1), b = fpSel ? fpSel.b : a;
  closeFreePageMenu();
  if(a < 0 || b < 0) return;
  const bsA = dialogueBlockStart(a); if(bsA >= 0){ const pr = dualPairRange(a); a = pr ? pr.start : bsA; }
  const bsB = dialogueBlockStart(b); if(bsB >= 0){ const pr = dualPairRange(b); b = (pr ? pr.end : dialogueBlockAt(els, bsB).end) - 1; }
  pushUndo();
  const g = uid('fpg');
  for(let i = a; i <= b; i++) els[i].fpg = g;
  fpRefresh(els[a].id);
}

/* ---- Panneau de droite, quand le curseur est sur une page sans numéro ---- */
function fpPanelHtml(el){
  const id = el.id;
  return `<div class="pane-title">${L('Page sans numéro','Unnumbered page')}</div>
  <div class="panel-block card-panel" data-fp-id="${id}">
    <p style="font-size:12px;color:var(--ink-soft);line-height:1.5;margin:0 0 10px;">${L('Cette page ne porte pas de numéro et ne compte pas : la page suivante du scénario garde le numéro qu’elle aurait eu sans elle. Elle est imprimée et exportée ici, à sa place.','This page carries no number and is not counted: the next script page keeps the number it would have had without it. It is printed and exported right here, in place.')}</p>
    <p style="font-size:12px;color:var(--ink-soft);line-height:1.5;margin:0 0 12px;">${L('Personnalise-la comme n’importe quelle page : Tab pour changer le type de ligne, « Aligner » pour placer le texte, « Carton » pour la taille, la police, le cadre ou le centrage sur la page entière. Entrée ajoute une ligne sur cette même page.','Style it like any other page: Tab to change the line type, “Align” to place the text, “Card” for size, font, frame or centering on the whole page. Enter adds a line on this same page.')}</p>
    <div class="cp-row"><div class="cp-seg" style="display:flex;flex-direction:column;align-items:stretch;gap:6px;">
      <button class="btn btn-sm" data-act="fpExit" data-id="${id}">${L('Continuer le scénario après cette page','Continue the script after this page')}</button>
      <button class="btn btn-sm" data-act="fpAddAfter" data-id="${id}">+ ${L('Autre page sans numéro après celle-ci','Another unnumbered page after this one')}</button>
      <button class="btn btn-sm" data-act="fpUnset" data-id="${id}">${L('Remettre dans la numérotation','Put back into the numbering')}</button>
      <button class="btn btn-sm btn-danger" data-act="fpDelete" data-id="${id}">${L('Supprimer cette page et son contenu','Delete this page and its content')}</button>
    </div></div>
  </div>`;
}
function fpExit(id){
  const els = S.project.elements, idx = findIdx(id), g = fpGroupRange(els, idx); if(!g) return;
  const nxt = els[g.end];
  if(nxt && !nxt.fpg && !(nxt.text || '').trim()){ fpRefresh(nxt.id); return; }   // une ligne vide attend déjà juste après
  pushUndo();
  const el = newElement('action', '');
  els.splice(g.end, 0, el);
  fpRefresh(el.id);
}
function fpAddAfter(id){ openFreePageMenu(id); }
function fpUnset(id){
  const els = S.project.elements, g = fpGroupRange(els, findIdx(id)); if(!g) return;
  pushUndo();
  for(let i = g.start; i < g.end; i++) delete els[i].fpg;
  fpRefresh(id);
  toast(L('La page compte de nouveau dans la numérotation.','The page counts in the numbering again.'));
}
async function fpDelete(id){
  const els = S.project.elements, g = fpGroupRange(els, findIdx(id)); if(!g) return;
  const hasText = els.slice(g.start, g.end).some(e => (e.text || '').trim());
  if(hasText && !await mmConfirm(L('Supprimer cette page sans numéro et tout son texte ?','Delete this unnumbered page and all its text?'), { title:L('Supprimer la page','Delete the page'), ok:L('Supprimer','Delete'), danger:true })) return;
  pushUndo();
  els.splice(g.start, g.end - g.start);
  if(!els.length) els.push(newElement('action', ''));
  const near = els[Math.min(g.start, els.length - 1)];
  fpRefresh(near.id);
}

Object.assign(ACTIONS, {
  openFreePageMenu: () => openFreePageMenu(), closeFreePageMenu,
  closeFreePageMenuBg: (id, e) => { if(e.target.id === 'fpBackdrop') closeFreePageMenu(); },
  fpSetWhere, fpInsert, fpConvertSelection, fpExit, fpAddAfter, fpUnset, fpDelete
});

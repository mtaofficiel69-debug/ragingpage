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
const FP_MODELS = [
  ['text',   'tplText',   ['Page de texte','Text page'], ['Synopsis, note d’intention, remerciements... Laissée vide, elle sort blanche.','Synopsis, statement, acknowledgments... Left empty, it prints blank.']],
  ['center', 'tplCenter', ['Texte centré sur la page','Text centered on the page'], ['Dédicace, citation, épigraphe.','Dedication, quote, epigraph.']],
  ['title',  'tplTitle',  ['Grand titre sur la page','Big title on the page'], ['ACTE I, intercalaire, titre d’épisode.','ACT I, divider, episode title.']]
];
let fpModel = 'text';
function openFreePageMenu(anchorId){
  if(!S.project) return;
  closeFreePageMenu();
  fpMenuAnchor = (typeof anchorId === 'string' && anchorId) ? anchorId : fpCurrentLineId();
  if(fpMenuAnchor && !findEl(fpMenuAnchor)) fpMenuAnchor = null;
  const cur = fpMenuAnchor ? findEl(fpMenuAnchor) : null;
  // Panneau masqué et curseur déjà sur une page sans numéro : le menu le fait réapparaître.
  if(cur && cur.fpg && fpPanelOff){ fpPanelOff = false; fpSavePanelOff(); showContextPanel(cur); }
  fpSel = fpSelectedRange();
  fpWhere = fpMenuAnchor ? 'here' : 'end';
  fpModel = 'text';
  const where = (w, t, d) => `<div class="fmt-opt" data-act="fpSetWhere" data-id="${w}"><div class="t">${t}</div><div class="d">${d}</div></div>`;
  const html = `<div class="modal-backdrop" id="fpBackdrop" data-act="closeFreePageMenuBg"><div class="modal fp-modal" data-stop="1" role="dialog" aria-modal="true">
      <button type="button" class="fp-x" data-act="closeFreePageMenu" title="${L('Fermer (Échap)','Close (Esc)')}" aria-label="${L('Fermer','Close')}">${icon('close')}</button>
      <div class="fp-head">
        <span class="fp-ico">${icon('nonum')}</span>
        <div><h2>${L('Page sans numéro','Unnumbered page')}</h2>
          <p class="fp-sub">${L('Elle ne compte pas : <b>les pages du scénario gardent leur numéro</b>. Autant que tu veux, où tu veux.','It isn’t counted: <b>the script pages keep their numbers</b>. As many as you like, wherever you like.')}</p></div>
      </div>
      <div class="fp-lbl">${L('Emplacement','Position')}</div>
      <div class="fmt-choice fp-where" id="fpWhereSeg">
        ${cur ? where('here', L('Ici','Here'), L('Après la ligne en cours','After the current line')) : ''}
        ${where('start', L('Au début','At the start'), L('Avant la 1re page','Before page 1'))}
        ${where('end', L('À la fin','At the end'), L('Après la dernière page','After the last page'))}
      </div>
      <div class="fp-lbl">${L('Modèle','Template')}</div>
      <div class="fp-models" id="fpModels">
        ${FP_MODELS.map(m => `<div class="fp-model" data-act="fpSetModel" data-id="${m[0]}">${icon(m[1])}<span><b>${L(m[2][0], m[2][1])}</b><small>${L(m[3][0], m[3][1])}</small></span></div>`).join('')}
      </div>
      <p class="fp-hint">${L('Tout reste modifiable ensuite, comme sur n’importe quelle page (type de ligne, Aligner, Carton).','Everything stays editable afterwards, like on any page (line type, Align, Card).')}</p>
      <div class="modal-actions">
        ${cur && !cur.fpg ? `<button class="btn btn-ghost fp-conv" data-act="fpConvertSelection" title="${L('Les lignes sélectionnées (ou la ligne en cours) passent sur une page sans numéro.','The selected lines (or the current line) move onto an unnumbered page.')}">${L('Utiliser la sélection','Use the selection')}</button>` : ''}
        <button class="btn btn-ghost" data-act="closeFreePageMenu">${L('Annuler','Cancel')}</button>
        <button class="btn btn-primary" data-act="fpInsertChosen">${icon('plus')} ${L('Insérer la page','Insert the page')}</button>
      </div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.addEventListener('keydown', fpMenuKeydown, true);
  fpSetWhere(fpWhere); fpSetModel(fpModel);
  const ok = document.querySelector('#fpBackdrop [data-act="fpInsertChosen"]'); if(ok) ok.focus();
}
function fpMenuKeydown(e){
  if(!document.getElementById('fpBackdrop')){ document.removeEventListener('keydown', fpMenuKeydown, true); return; }
  if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); closeFreePageMenu(); }
  else if(e.key === 'Enter' && !(e.target && e.target.closest && e.target.closest('button'))){ e.preventDefault(); e.stopPropagation(); fpInsert(fpModel); }
}
function closeFreePageMenu(){
  const b = document.getElementById('fpBackdrop'); if(b) b.remove();
  document.removeEventListener('keydown', fpMenuKeydown, true);
}
function fpSetWhere(w){
  if(w !== 'here' && w !== 'start' && w !== 'end') return;
  fpWhere = w;
  document.querySelectorAll('#fpWhereSeg [data-act="fpSetWhere"]').forEach(b => b.classList.toggle('active', b.dataset.id === w));
}
function fpSetModel(m){
  if(!FP_MODELS.some(x => x[0] === m)) return;
  fpModel = m;
  document.querySelectorAll('#fpModels [data-act="fpSetModel"]').forEach(b => b.classList.toggle('active', b.dataset.id === m));
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

/* ---- Panneau de droite, quand le curseur est sur une page sans numéro ----
   Il se ferme (croix) et reste fermé ; le menu ⋮ › « Page sans numéro… » le rouvre. */
let fpPanelOff = false;
try{ fpPanelOff = localStorage.getItem('scriptmm_fpPanelOff') === '1'; }catch(e){}
function fpSavePanelOff(){ try{ localStorage.setItem('scriptmm_fpPanelOff', fpPanelOff ? '1' : '0'); }catch(e){} }
function fpPanelHtml(el){
  if(fpPanelOff) return '';
  const id = el.id;
  const row = (act, ic, label, cls) => `<button type="button" class="fp-act${cls ? ' ' + cls : ''}" data-act="${act}" data-id="${id}">${icon(ic)}<span>${label}</span></button>`;
  return `<div class="fp-panel">
    <div class="pane-title fp-pane-title"><span>${L('Page sans numéro','Unnumbered page')}</span>
      <button type="button" class="fp-x" data-act="fpPanelClose" title="${L('Fermer le panneau','Close the panel')}" aria-label="${L('Fermer','Close')}">${icon('close')}</button></div>
    <p class="fp-note">${L('Pas de numéro, ne compte pas : la page suivante garde son numéro. Entrée ajoute une ligne sur cette page.','No number, not counted: the next page keeps its number. Enter adds a line on this page.')}</p>
    <div class="fp-acts">
      ${row('fpExit', 'plus', L('Continuer le scénario après','Continue the script after'))}
      ${row('fpAddAfter', 'nonum', L('Ajouter une autre page sans numéro','Add another unnumbered page'))}
      ${row('fpUnset', 'hash', L('Remettre dans la numérotation','Put back into the numbering'))}
      ${row('fpDelete', 'trash', L('Supprimer cette page','Delete this page'), 'is-danger')}
    </div>
  </div>`;
}
function fpPanelClose(id){
  fpPanelOff = true; fpSavePanelOff();
  const el = id ? findEl(id) : null;
  if(el && el.type === 'card') showContextPanel(el);                 // le panneau du carton reste
  else {
    const side = document.getElementById('sidePane');
    if(side){ side.dataset.mode = ''; side.classList.add('hidden'); side.innerHTML = ''; }
    if(S.navOpen) renderNavPane();
  }
  toast(L('Panneau fermé. Pour le rouvrir : ⋮ › Page sans numéro…','Panel closed. To reopen it: ⋮ › Unnumbered page…'));
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
  fpSetWhere, fpSetModel, fpInsert, fpInsertChosen: () => fpInsert(fpModel), fpConvertSelection, fpExit, fpAddAfter, fpUnset, fpDelete, fpPanelClose
});

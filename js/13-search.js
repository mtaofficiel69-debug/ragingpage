/* =====================================================================
   SEARCH
===================================================================== */
function onSearchInput(e){ runSearch(e.target.value); }
function onSearchKeydown(e){
  if(e.key==='Enter'){ e.preventDefault(); gotoMatch(e.shiftKey ? -1 : 1); }
}
function runSearch(q, silent){
  S.search.query = q;
  const cnt = document.getElementById('searchCount');
  clearTimeout(_matchTimer); clearMatchMarks();
  if(!q){ S.search.matches=[]; S.search.idx=-1; if(cnt) cnt.textContent=''; return; }
  S.search.matches = S.project.elements.filter(e=>e.text.toLowerCase().includes(q.toLowerCase())).map(e=>e.id);
  S.search.idx = S.search.matches.length? 0 : -1;
  if(cnt) cnt.textContent = S.search.matches.length ? (S.search.idx+1)+'/'+S.search.matches.length : L('Aucun résultat','No results');
  if(!silent && S.search.idx>=0) scrollToMatch();
}
function gotoMatch(dir){
  if(!S.search.matches.length) return;
  S.search.idx = (S.search.idx + dir + S.search.matches.length) % S.search.matches.length;
  document.getElementById('searchCount').textContent = (S.search.idx+1)+'/'+S.search.matches.length;
  scrollToMatch();
}
/* =====================================================================
   ALLER À LA SCÈNE (Ctrl+K)
   -----------------------------------------------------------------
   Fonctionnalité de WriterDuet absente de Raging Page : jusqu'ici, atteindre
   une scène précise obligeait à passer par l'onglet Cartes (donc à QUITTER
   l'éditeur) ou à faire défiler à la main. Ici : une liste filtrable de
   toutes les entêtes, avec leur numéro et leur page, ↑/↓ pour choisir,
   Entrée pour y sauter — le curseur est posé directement dans l'entête,
   prêt à écrire. Réutilise getSceneBlocks(), sceneNumbers() et la
   pagination déjà calculée : aucune nouvelle donnée à maintenir.
===================================================================== */
let jumpSel = 0, jumpList = [];
function jumpScenes(q){
  const numbers = sceneNumbers();
  const needle = (q||'').trim().toLowerCase();
  return getSceneBlocks().filter(b=>b.sceneId).map(b=>({
    id: b.sceneId,
    num: numbers[b.sceneId] || '',
    text: b.elements[0].text || L('(scène sans titre)','(untitled scene)'),
    page: S.pagination.pageOf[b.sceneId] || ''
  })).filter(x=> !needle || x.text.toLowerCase().includes(needle) || String(x.num)===needle);
}
function openJumpScene(){
  if(S.tab!=='editor' || !S.project) return;
  if(document.getElementById('jumpBackdrop')) return;
  const html = `<div class="modal-backdrop" id="jumpBackdrop" data-act="closeJumpSceneBg">
    <div class="modal jump-modal" data-stop="1" style="align-self:flex-start;margin-top:8vh;">
      <input type="text" id="jumpInput" class="jump-input" placeholder="${L('Aller à la scène… (titre, lieu ou numéro)','Go to scene… (title, location or number)')}" autocomplete="off">
      <div class="jump-list" id="jumpList"></div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  jumpSel = 0;
  renderJumpList('');
  const inp = document.getElementById('jumpInput');
  inp.addEventListener('input', e=>{ jumpSel = 0; renderJumpList(e.target.value); });
  inp.addEventListener('keydown', onJumpKeydown);
  inp.focus();
}
function renderJumpList(q){
  jumpList = jumpScenes(q);
  if(jumpSel >= jumpList.length) jumpSel = Math.max(0, jumpList.length-1);
  const box = document.getElementById('jumpList');
  if(!box) return;
  box.innerHTML = jumpList.length ? jumpList.map((x,i)=>`
    <div class="jump-item${i===jumpSel?' sel':''}" data-act="jumpToScene" data-id="${x.id}">
      <span class="jump-num">${x.num}</span>
      <span class="jump-head">${esc(x.text)}</span>
      ${x.page?`<span class="jump-page">${L('p.','p.')} ${x.page}</span>`:''}
    </div>`).join('') : `<div class="jump-empty">${L('Aucune scène ne correspond.','No scene matches.')}</div>`;
  const sel = box.querySelector('.jump-item.sel');
  if(sel) sel.scrollIntoView({block:'nearest'});
}
function onJumpKeydown(e){
  if(e.key==='ArrowDown'){ e.preventDefault(); if(jumpList.length){ jumpSel=(jumpSel+1)%jumpList.length; renderJumpList(e.target.value); } }
  else if(e.key==='ArrowUp'){ e.preventDefault(); if(jumpList.length){ jumpSel=(jumpSel-1+jumpList.length)%jumpList.length; renderJumpList(e.target.value); } }
  else if(e.key==='Enter'){ e.preventDefault(); if(jumpList[jumpSel]) jumpToScene(jumpList[jumpSel].id); }
  else if(e.key==='Escape'){ e.preventDefault(); closeJumpScene(); }
}
function closeJumpScene(){ const b=document.getElementById('jumpBackdrop'); if(b) b.remove(); }
function jumpToScene(id){
  closeJumpScene();
  const div = document.querySelector('#page [data-id="'+id+'"]');
  if(!div) return;
  div.focus();
  const r = document.createRange();
  r.selectNodeContents(div); r.collapse(true);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
  div.scrollIntoView({block:'center', behavior:'smooth'});
  div.style.outline='2px solid #1F6FA0'; clearTimeout(_matchTimer); _matchTimer = setTimeout(clearMatchMarks, 900);
}

/* =====================================================================
   RECHERCHER & REMPLACER (Ctrl+H)
   -----------------------------------------------------------------
   Fonctionnalité de WriterDuet absente de Raging Page : la recherche
   existante savait TROUVER mais pas REMPLACER, alors que c'est l'outil
   qu'on utilise le plus souvent sur un scénario — rebaptiser un
   personnage ou un lieu d'un coup dans tout le texte.
   Deux détails qui comptent ici :
   • la casse est respectée automatiquement : si l'occurrence trouvée est
     tout en majuscules (un nom de personnage sur sa ligne, un lieu dans
     une entête de scène), le remplacement est mis en majuscules lui
     aussi — sinon renommer JEAN en "Paul" cassait toutes les entêtes ;
   • un seul pushUndo() avant l'opération : Ctrl+Z annule TOUT le
     remplacement d'un coup, jamais mot par mot.
===================================================================== */
function escapeRegExp(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function replaceCount(find){
  if(!find || !S.project) return 0;
  const re = new RegExp(escapeRegExp(find),'gi');
  return S.project.elements.reduce((n,el)=> n + ((el.text||'').match(re)||[]).length, 0);
}
function openReplace(){
  if(S.tab!=='editor' || !S.project) return;
  const pre = esc(S.search.query||'');
  const html = `<div class="modal-backdrop" id="replaceBackdrop" data-act="closeReplaceBg">
    <div class="modal" style="max-width:420px;" data-stop="1">
      <h2>${L('Rechercher &amp; remplacer','Find &amp; replace')}</h2>
      <p style="font-size:13.5px;color:var(--ink-soft);margin:-8px 0 14px;">${L('Remplace dans tout le scénario. Les occurrences écrites en majuscules (noms de personnages, entêtes de scène) restent en majuscules. Ctrl+Z annule l\u2019ensemble.','Replaces throughout the whole screenplay. Occurrences written in capitals (character names, scene headings) stay in capitals. Ctrl+Z undoes the whole replacement.')}</p>
      <div class="field"><label>${L('Rechercher','Find')}</label><input type="text" id="replFind" value="${pre}" placeholder="${L('Texte à trouver…','Text to find…')}"></div>
      <div class="field"><label>${L('Remplacer par','Replace with')}</label><input type="text" id="replWith" placeholder="${L('Nouveau texte…','New text…')}"></div>
      <div id="replCount" style="font-size:13px;color:var(--ink-soft);min-height:16px;"></div>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-act="closeReplace">${L('Annuler','Cancel')}</button>
        <button class="btn btn-primary" data-act="doReplaceAll">${L('Remplacer tout','Replace all')}</button>
      </div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  const f = document.getElementById('replFind');
  const refresh = ()=>{
    const n = replaceCount(document.getElementById('replFind').value);
    const c = document.getElementById('replCount');
    if(c) c.textContent = !document.getElementById('replFind').value ? ''
      : (n ? n + ' ' + L(n>1?'occurrences trouvées':'occurrence trouvée', n>1?'matches found':'match found') : L('Aucune occurrence','No matches'));
  };
  if(f){ f.addEventListener('input', refresh); f.focus(); f.select(); refresh(); }
  const w = document.getElementById('replWith');
  if(w) w.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); doReplaceAll(); } });
}
function closeReplace(){ const b=document.getElementById('replaceBackdrop'); if(b) b.remove(); }
function doReplaceAll(){
  const fi = document.getElementById('replFind'), wi = document.getElementById('replWith');
  if(!fi) return;
  const find = fi.value, with_ = wi ? wi.value : '';
  if(!find) return;
  const re = new RegExp(escapeRegExp(find),'gi');
  let n = 0;
  pushUndo();
  S.project.elements.forEach(el=>{
    if(!el.text || !re.test(el.text)){ re.lastIndex = 0; return; }
    re.lastIndex = 0;
    el.text = el.text.replace(re, m=>{
      n++;
      // occurrence tout en majuscules -> on majuscule aussi le remplacement
      return (m === m.toUpperCase() && m !== m.toLowerCase()) ? with_.toUpperCase() : with_;
    });
  });
  closeReplace();
  if(!n){ toast(L('Aucune occurrence trouvée.','No matches found.')); return; }
  scheduleAutosave();
  renderEditorTab();
  if(S.search.query) runSearch(S.search.query, true);
  toast(n>1 ? n+' '+L('occurrences remplacées.','matches replaced.') : L('1 occurrence remplacée.','1 match replaced.'));
}

let _matchTimer = 0;
/* v88 : le contour bleu était retiré sur l'élément gardé en mémoire ; si la ligne était entre-temps
   redessinée (pagination, rafraîchissement), c'est sa copie qui gardait le contour pour toujours.
   On retire maintenant le contour de TOUTES les lignes présentes à l'écran, au moment voulu. */
function clearMatchMarks(){
  document.querySelectorAll('#page .line').forEach(d=>{
    if(d.classList.contains('hl') || (d.style.outline && d.style.outline.indexOf('31, 111, 160') >= 0) || (d.style.outline && d.style.outline.toLowerCase().indexOf('1f6fa0') >= 0)){
      d.classList.remove('hl'); d.style.outline = '';
    }
  });
}
document.addEventListener('mousedown', e=>{ if(e.target && e.target.closest && e.target.closest('#page')){ clearTimeout(_matchTimer); clearMatchMarks(); } }, true);
function scrollToMatch(){
  const id = S.search.matches[S.search.idx];
  const div = document.querySelector('#page [data-id="'+id+'"]');
  /* v87 : un seul contour à la fois. Avant, chaque Entrée laissait le contour de la ligne
     précédente allumé jusqu'à la fin de son minuteur : en spammant Entrée, ils s'empilaient. */
  clearTimeout(_matchTimer);
  clearMatchMarks();
  if(div){ div.scrollIntoView({block:'center', behavior:'smooth'}); div.classList.add('hl'); div.style.outline='2px solid #1F6FA0'; _matchTimer = setTimeout(clearMatchMarks,1200); }
}

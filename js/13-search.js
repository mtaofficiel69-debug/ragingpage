/* =====================================================================
   SEARCH
===================================================================== */
function onSearchInput(e){ runSearch(e.target.value); }
function onSearchKeydown(e){
  if(e.key==='Enter'){ e.preventDefault(); if(e.repeat) return; gotoMatch(e.shiftKey ? -1 : 1); }
}
/* =====================================================================
   RECHERCHE APPROCHANTE (barre de recherche uniquement)
   -----------------------------------------------------------------
   La barre de recherche ne compare plus le texte brut ligne par ligne :
   • le texte est « normalisé » avant comparaison (casse, accents,
     apostrophes droites/courbes, guillemets, tirets, espaces multiples
     ou insécables) ;
   • tout le scénario est mis bout à bout : une phrase qui s'étend sur
     plusieurs lignes est donc trouvée ;
   • si rien ne correspond exactement, on cherche la correspondance la
     plus proche (distance d'édition : une lettre en trop, en moins ou
     différente), les meilleures d'abord. Le compteur affiche alors « ≈ ».
   Le Rechercher & remplacer (Ctrl+H) reste, lui, strictement exact.
===================================================================== */
function searchNorm(s, keep){
  const x = String(s==null?'':s).normalize('NFD');
  return (keep ? x : x.replace(/[\u0300-\u036f]/g,''))
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u02BC\u2032`\u00B4]/g,"'")
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g,'"')
    .replace(/[\u2010-\u2015\u2212]/g,'-')
    .replace(/\u2026/g,'...')
    .replace(/\u0153/g,'oe').replace(/\u00E6/g,'ae')
    .replace(/\s+/g,' ').trim();
}
function searchBuildIndex(keep){
  const spans = []; let text = '', pos = 0;
  S.project.elements.forEach(e=>{
    const n = searchNorm(e.text, keep);
    if(!n) return;
    if(text){ text += ' '; pos++; }
    spans.push({ id:e.id, start:pos, end:pos+n.length });
    text += n; pos += n.length;
  });
  return { text, spans };
}
/* index du segment qui contient la position p (ou le suivant si p tombe sur un séparateur) */
function searchSpanAt(spans, p){
  let lo = 0, hi = spans.length-1, r = 0;
  while(lo <= hi){
    const mid = (lo+hi) >> 1;
    if(spans[mid].start <= p){ r = mid; lo = mid+1; } else hi = mid-1;
  }
  if(p >= spans[r].end && r < spans.length-1) r++;
  return r;
}
function searchFind(q){
  const out = { ids:[], span:{}, approx:false, pos:{}, sp:[], keep:false };
  /* accents : si la recherche contient un accent (é, è, ç…), on le respecte à la lettre ; sinon (« ete »),
     les accents sont ignorés et « ete » trouve aussi « été ». */
  const keep = /[\u0300-\u036f]/.test(String(q==null?'':q).normalize('NFD'));
  out.keep = keep;
  const nq = searchNorm(q, keep), m = nq.length;
  const idx = searchBuildIndex(keep);
  if(!m || !idx.spans.length) return out;
  const t = idx.text, spans = idx.spans;
  out.sp = spans;
  // 1) correspondance exacte (après normalisation), y compris sur plusieurs lignes
  const seen = {};
  let p = t.indexOf(nq);
  while(p >= 0){
    const a = searchSpanAt(spans, p), b = searchSpanAt(spans, p+m-1);
    const id = spans[a].id;
    if(!seen[id]){ seen[id] = 1; out.ids.push(id); out.span[id] = spans.slice(a, b+1).map(x=>x.id); out.pos[id] = { s:p, e:p+m }; }
    p = t.indexOf(nq, p+1);
  }
  if(out.ids.length) return out;
  // 2) sinon : correspondance la plus proche (distance d'édition, algorithme de Sellers)
  const k = m < 4 ? 0 : Math.min(20, Math.max(1, Math.floor(m*0.2)));
  if(!k) return out;
  const qc = new Array(m);
  for(let i=0;i<m;i++) qc[i] = nq.charCodeAt(i);
  let prevD = new Int32Array(m+1), prevS = new Int32Array(m+1);
  let curD = new Int32Array(m+1), curS = new Int32Array(m+1);
  for(let i=0;i<=m;i++){ prevD[i] = i; prevS[i] = 0; }
  const best = {};   // id du premier segment touché -> { d, a, b }
  const n = t.length;
  for(let j=1;j<=n;j++){
    const c = t.charCodeAt(j-1);
    curD[0] = 0; curS[0] = j;
    for(let i=1;i<=m;i++){
      let d = prevD[i-1] + (qc[i-1]===c ? 0 : 1), s = prevS[i-1];
      const extra = prevD[i] + 1;          // caractère en trop dans le texte
      if(extra < d){ d = extra; s = prevS[i]; }
      const missing = curD[i-1] + 1;       // caractère manquant dans le texte
      if(missing < d){ d = missing; s = curS[i-1]; }
      curD[i] = d; curS[i] = s;
    }
    if(curD[m] <= k && curS[m] <= j-1){
      const a = searchSpanAt(spans, curS[m]), b = searchSpanAt(spans, j-1);
      const id = spans[a].id;
      if(!best[id] || curD[m] < best[id].d) best[id] = { d:curD[m], a:a, b:b, s:curS[m], e:j };
    }
    let tmp = prevD; prevD = curD; curD = tmp;
    tmp = prevS; prevS = curS; curS = tmp;
  }
  const hits = Object.keys(best).map(id=>best[id]);
  hits.sort((x,y)=> x.d - y.d || x.a - y.a);
  hits.forEach(h=>{
    const id = spans[h.a].id;
    out.ids.push(id);
    out.span[id] = spans.slice(h.a, h.b+1).map(x=>x.id);
    out.pos[id] = { s:h.s, e:h.e };
  });
  out.approx = out.ids.length > 0;
  return out;
}
function setSearchCount(){
  const cnt = document.getElementById('searchCount');
  if(!cnt) return;
  cnt.textContent = (S.search.idx+1)+'/'+S.search.matches.length + (S.search.approx ? ' \u2248' : '');
  cnt.title = S.search.approx ? L('Correspondance approchante','Approximate match') : '';
}
function runSearch(q, silent){
  S.search.query = q;
  const cnt = document.getElementById('searchCount');
  clearTimeout(_matchTimer); clearMatchMarks();
  if(!q){ S.search.matches=[]; S.search.idx=-1; S.search.approx=false; S.search.spans={}; S.search.pos={}; S.search.sp=[]; if(cnt){ cnt.textContent=''; cnt.title=''; } return; }
  const r = searchFind(q);
  S.search.matches = r.ids; S.search.spans = r.span; S.search.approx = r.approx; S.search.pos = r.pos; S.search.sp = r.sp; S.search.keep = r.keep;
  S.search.idx = S.search.matches.length? 0 : -1;
  if(cnt){
    if(S.search.matches.length) setSearchCount();
    else { cnt.textContent = L('Aucun résultat','No results'); cnt.title = ''; }
  }
  if(!silent && S.search.idx>=0) scrollToMatch();
}
function gotoMatch(dir){
  if(!S.search.matches.length) return;
  S.search.idx = (S.search.idx + dir + S.search.matches.length) % S.search.matches.length;
  setSearchCount();
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
/* Durée du surlignement jaune (recherche) : le compte à rebours ne part qu'une fois la page ARRIVÉE
   sur le résultat (sur un long scénario, le défilement prenait à lui seul presque tout le temps).
   Puis il reste bien visible, s'efface en douceur, et disparaît tout de suite si on clique ou tape dans le texte. */
const HL_HOLD = 2500, HL_FADE = 700, HL_MAX_SCROLL = 4000, HL_STEPS = 6;
let _hlSeq = 0, _hlRaf = 0, _hlOn = false, _hlStep = 0, _hlLines = [];
/* Fondu : des teintes de plus en plus claires sont déclarées une seule fois (rp-search-1 … rp-search-6) ;
   on fait seulement passer le surlignement de l'une à l'autre, ce qui ne redessine que les mots surlignés. */
function searchHlStep(i){
  if(i === _hlStep) return;
  if(window.CSS && CSS.highlights){
    const from = _hlStep ? 'rp-search-' + _hlStep : 'rp-search', h = CSS.highlights.get(from);
    if(h){ CSS.highlights.delete(from); CSS.highlights.set(i ? 'rp-search-' + i : 'rp-search', h); }
  }
  _hlLines.forEach(d => { if(d.isConnected && d.classList.contains('hl')) d.style.background = 'rgba(255,193,7,' + (.28 * (1 - i / (HL_STEPS + 1))).toFixed(3) + ')'; });
  _hlStep = i;
}
/* attend que la ligne trouvée ne bouge plus (fin du défilement), puis laisse le surlignement HL_HOLD ms avant de l'estomper */
function searchHlArm(div){
  const seq = ++_hlSeq, t0 = performance.now();
  let last = null, still = 0;
  const step = () => {
    if(seq !== _hlSeq) return;
    const top = div.isConnected ? div.getBoundingClientRect().top : null;
    if(top !== null && last !== null && Math.abs(top - last) < 0.5) still++; else still = 0;
    last = top;
    if(top === null || still >= 6 || performance.now() - t0 > HL_MAX_SCROLL){ _matchTimer = setTimeout(() => searchHlFade(seq), HL_HOLD); return; }
    _hlRaf = requestAnimationFrame(step);
  };
  _hlRaf = requestAnimationFrame(step);
}
function searchHlFade(seq){
  const t0 = performance.now();
  const step = () => {
    if(seq !== _hlSeq) return;
    const k = (performance.now() - t0) / HL_FADE;
    if(k >= 1){ clearMatchMarks(); return; }
    searchHlStep(Math.min(HL_STEPS, Math.floor(k * (HL_STEPS + 1))));
    _hlRaf = requestAnimationFrame(step);
  };
  _hlRaf = requestAnimationFrame(step);
}
function clearMatchMarks(){
  _hlSeq++; cancelAnimationFrame(_hlRaf); _hlOn = false; _hlLines = [];
  if(window.CSS && CSS.highlights){ CSS.highlights.delete('rp-search'); if(_hlStep) CSS.highlights.delete('rp-search-' + _hlStep); }
  _hlStep = 0;
  document.querySelectorAll('#page .line').forEach(d=>{
    if(d.classList.contains('hl') || (d.style.outline && d.style.outline.indexOf('31, 111, 160') >= 0) || (d.style.outline && d.style.outline.toLowerCase().indexOf('1f6fa0') >= 0)){
      d.classList.remove('hl'); d.style.outline = ''; d.style.background = '';
    }
  });
}
document.addEventListener('mousedown', e=>{ if(e.target && e.target.closest && e.target.closest('#page')){ clearTimeout(_matchTimer); clearMatchMarks(); } }, true);
/* taper dans le scénario efface aussi le surlignement jaune (seulement s'il y en a un : rien à faire sinon) */
document.addEventListener('keydown', e=>{ if(_hlOn && !/^(Shift|Control|Alt|Meta|CapsLock)$/.test(e.key) && e.target && e.target.closest && e.target.closest('#page')){ clearTimeout(_matchTimer); clearMatchMarks(); } }, true);
/* Surlignage façon WriterDuet : on surligne le TEXTE trouvé (fond ambré, sans cadre ni contour), pas la ligne.
   Rien n'est ajouté dans le DOM (API CSS Custom Highlight) : aucun risque de collision avec l'écriture du
   scénario, et le contenu éditable reste strictement intact. Si le navigateur ne sait pas le faire, on teinte
   légèrement la ligne à la place. */
(function(){
  if(typeof document === 'undefined' || document.getElementById('rpSearchHlCss')) return;
  const st = document.createElement('style');
  st.id = 'rpSearchHlCss';
  st.textContent = '::highlight(rp-search){background-color:rgba(255,193,7,.55);}'
    + [1, 2, 3, 4, 5, 6].map(i => '::highlight(rp-search-' + i + '){background-color:rgba(255,193,7,' + (.55 * (1 - i / 7)).toFixed(3) + ');}').join('');
  (document.head || document.documentElement).appendChild(st);
})();
/* même normalisation que searchNorm(), mais en gardant, pour chaque caractère normalisé, sa position d'origine */
function searchNormMap(src, keep){
  src = String(src==null?'':src);
  const chars = [], org = [];
  for(let k=0;k<src.length;k++){
    const d = src[k].normalize('NFD');
    const x = (keep ? d : d.replace(/[\u0300-\u036f]/g,''))
      .toLowerCase()
      .replace(/[\u2018\u2019\u201A\u201B\u02BC\u2032`\u00B4]/g,"'")
      .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g,'"')
      .replace(/[\u2010-\u2015\u2212]/g,'-')
      .replace(/\u2026/g,'...')
      .replace(/\u0153/g,'oe').replace(/\u00E6/g,'ae');
    for(let q=0;q<x.length;q++){
      const ch = x[q];
      if(/\s/.test(ch)){
        if(!chars.length || chars[chars.length-1] === ' ') continue;
        chars.push(' '); org.push(k);
      } else { chars.push(ch); org.push(k); }
    }
  }
  if(chars.length && chars[chars.length-1] === ' '){ chars.pop(); org.pop(); }
  return { n: chars.join(''), map: org };
}
function searchTextRange(div, a, b){
  const w = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
  let pos = 0, n, sn = null, so = 0, en = null, eo = 0;
  while((n = w.nextNode())){
    const len = n.nodeValue.length;
    if(!sn && a < pos+len){ sn = n; so = a - pos; }
    if(sn && b <= pos+len){ en = n; eo = b - pos; break; }
    pos += len;
  }
  if(!sn || !en) return null;
  const r = document.createRange();
  r.setStart(sn, so); r.setEnd(en, eo);
  return r;
}
/* ranges (dans le DOM) du texte trouvé pour la correspondance 'id' ; null si on ne peut pas les établir sûrement */
function searchMatchRanges(id){
  const pos = (S.search.pos||{})[id], sp = S.search.sp||[];
  if(!pos) return null;
  const group = (S.search.spans||{})[id] || [id];
  const ranges = [];
  for(let g=0; g<group.length; g++){
    const seg = sp.filter(x=>x.id === group[g])[0];
    const el = S.project.elements.filter(e=>e.id === group[g])[0];
    const div = document.querySelector('#page [data-id="'+group[g]+'"]');
    if(!seg || !el || !div) return null;
    const nm = searchNormMap(el.text, S.search.keep);
    if(nm.n.length !== seg.end - seg.start || div.textContent !== (el.text||'')) return null;
    const ls = Math.max(pos.s, seg.start) - seg.start, le = Math.min(pos.e, seg.end) - seg.start;
    if(le <= ls) continue;
    const r = searchTextRange(div, nm.map[ls], nm.map[le-1] + 1);
    if(!r) return null;
    ranges.push(r);
  }
  return ranges.length ? ranges : null;
}
function scrollToMatch(){
  const id = S.search.matches[S.search.idx];
  const div = document.querySelector('#page [data-id="'+id+'"]');
  /* un seul surlignage à la fois : chaque saut efface le précédent avant d'en poser un nouveau. */
  clearTimeout(_matchTimer);
  clearMatchMarks();
  if(div){ div.scrollIntoView({block:'center', behavior:'smooth'}); _hlOn = true; searchHlArm(div); }
  let ranges = null;
  if(window.CSS && CSS.highlights && typeof Highlight !== 'undefined'){
    try{ ranges = searchMatchRanges(id); }catch(err){ ranges = null; }
  }
  if(ranges){ CSS.highlights.set('rp-search', new Highlight(...ranges)); return; }
  /* repli : teinte légère sur la ou les lignes concernées (pas de contour) */
  ((S.search.spans||{})[id]||[id]).forEach(x=>{
    const d2 = document.querySelector('#page [data-id="'+x+'"]');
    if(d2){ d2.classList.add('hl'); d2.style.background = 'rgba(255,193,7,.28)'; _hlLines.push(d2); }
  });
}

/* =====================================================================
   SÉLECTION EXPRESS (v9) — toute une scène / tout le scénario
   ---------------------------------------------------------------------
   Un bouton de chaque côté du texte, à la hauteur de chaque titre de
   scène : à gauche (à côté du numéro) = sélectionne la scène entière,
   à droite = sélectionne tout le scénario (comme Ctrl+A). Les boutons
   sont dans une couche séparée posée par-dessus la feuille, repositionnée
   à chaque pagination : le contenu éditable n'est jamais touché.
===================================================================== */
/* Une accolade par scène (et par feuille si la scène court sur plusieurs
   pages : on découpe aux bords des feuilles pour ne pas enjamber le vide
   entre deux pages), plus une accolade « tout le scénario » à droite. Deux
   passes (lecture puis écriture), et on ne reconstruit que si la géométrie
   a changé. */
let ST_HOT = null;
const ST_ALL = '__all__';
function refreshSceneTools(){
  if(ST_LOCK && ST_LOCK.length && !ST_LOCK[0].isConnected) ST_LOCK = null;
  const stack = document.getElementById('pageStack');
  const page = document.getElementById('page');
  if(!stack || !page) return;
  let layer = document.getElementById('sceneTools');
  if(!layer){
    layer = document.createElement('div');
    layer.id = 'sceneTools';
    // mousedown annulé : le clic ne vole ni le focus ni la sélection en cours
    layer.addEventListener('mousedown', e => { if(e.target.closest && e.target.closest('.st-seg')) e.preventDefault(); });
    layer.addEventListener('click', onSceneToolsClick);
    layer.addEventListener('mouseover', e => {
      const seg = e.target.closest ? e.target.closest('.st-seg') : null;
      stSetHot(seg ? seg.dataset.sid : null);
    });
    layer.addEventListener('mouseleave', () => stSetHot(null));
    stack.appendChild(layer);
  }
  const topOf = n => { while(n && n.parentNode !== page) n = n.parentNode; return n; };
  const sheetsR = Array.from(document.querySelectorAll('#sheets .sheet')).map(sh => [sh.offsetTop, sh.offsetTop + sh.offsetHeight]);
  const base = page.offsetTop;
  const all = pageLineDivs();
  const blocks = [];
  let cur = null;
  all.forEach(d => {
    if(d.dataset.type === 'scene'){ cur = { id: d.dataset.id, first: d, last: d }; blocks.push(cur); }
    else if(cur) cur.last = d;
  });
  const segs = [];
  const clip = (id, y0, y1) => {
    if(!sheetsR.length){ if(y1 - y0 > 4) segs.push([id, y0, y1]); return; }
    sheetsR.forEach(r => {
      const lo = Math.max(y0, r[0] + 2), hi = Math.min(y1, r[1] - 2);
      if(hi - lo > 4) segs.push([id, lo, hi]);
    });
  };
  blocks.forEach(bk => {
    const t1 = topOf(bk.first), t2 = topOf(bk.last);
    if(!t1 || !t2) return;
    clip(bk.id, base + t1.offsetTop + 2, base + t2.offsetTop + t2.offsetHeight - 2);
  });
  if(all.length){
    const t1 = topOf(all[0]), t2 = topOf(all[all.length - 1]);
    if(t1 && t2) clip(ST_ALL, base + t1.offsetTop + 2, base + t2.offsetTop + t2.offsetHeight - 2);
  }
  // pastilles : une par scène, à la hauteur du titre
  const chips = blocks.map(bk => {
    const t1 = topOf(bk.first);
    return t1 ? [bk.id, base + t1.offsetTop + Math.max(0, Math.round((t1.offsetHeight - 20) / 2))] : null;
  }).filter(Boolean);
  const sig = chips.map(c => c[0] + ':' + Math.round(c[1])).join('|') + '#' +
    segs.filter(g => g[0] !== ST_ALL).map(g => g[0] + ':' + Math.round(g[1]) + ':' + Math.round(g[2])).join('|');
  if(layer._sig === sig) return;
  layer._sig = sig;
  const tipScene = esc(L('Sélectionner toute cette scène', 'Select this whole scene'));
  const tipAll = esc(L('Sélectionner tout le scénario (comme Ctrl+A)', 'Select the whole script (like Ctrl+A)'));
  const lblScene = esc(L('Scène', 'Scene')), lblAll = esc(L('Tout', 'All'));
  const icoScene = '<svg viewBox="0 0 12 12"><rect x="1.5" y="2" width="9" height="8" rx="1.5" stroke-dasharray="2 1.6"/></svg>';
  const icoAll = '<svg viewBox="0 0 12 12"><path d="M2 2.5h8M2 5h8M2 7.5h8M2 10h5"/></svg>';
  layer.innerHTML =
    segs.filter(g => g[0] !== ST_ALL).map(g =>
      '<div class="st-rail" data-sid="' + esc(g[0]) + '" style="top:' + Math.round(g[1]) + 'px;height:' + Math.round(g[2] - g[1]) + 'px"></div>'
    ).join('') +
    chips.map(c =>
      '<div class="st-chip" style="top:' + Math.round(c[1]) + 'px">' +
        '<div class="st-seg st-one" role="button" data-sid="' + esc(c[0]) + '" title="' + tipScene + '">' + icoScene + '<span class="st-t">' + lblScene + '</span></div>' +
        '<div class="st-seg st-all" role="button" data-sid="' + ST_ALL + '" title="' + tipAll + '">' + icoAll + '<span class="st-t">' + lblAll + '</span></div>' +
      '</div>'
    ).join('');
  if(ST_HOT) stSetHot(ST_HOT);
}
/* Survol : l'accolade s'allume sur toute sa hauteur, et ce qui sera
   sélectionné se teinte légèrement. */
function stSetHot(sid){
  const layer = document.getElementById('sceneTools');
  const page = document.getElementById('page');
  document.querySelectorAll('#page .line.st-hint').forEach(d => d.classList.remove('st-hint'));
  if(page) page.classList.remove('st-hint-all');
  if(layer) layer.querySelectorAll('.st-hot').forEach(g => g.classList.remove('st-hot'));
  ST_HOT = sid || null;
  if(!sid || !layer || !page) return;
  layer.querySelectorAll('.st-seg').forEach(g => { if(g.dataset.sid === sid) g.classList.add('st-hot'); });
  layer.querySelectorAll('.st-rail').forEach(g => { if(sid === ST_ALL || g.dataset.sid === sid) g.classList.add('st-hot'); });
  if(sid === ST_ALL){ page.classList.add('st-hint-all'); return; }
  const div = page.querySelector('[data-id="' + sid + '"]');
  const blk = div ? sceneBlockOf(div) : null;
  if(blk) blk.lines.forEach(d => d.classList.add('st-hint'));
}

/* Les lignes de la scène : du titre jusqu'à la veille du titre suivant. */
function sceneBlockOf(sceneDiv){
  const lines = pageLineDivs();
  const i = lines.indexOf(sceneDiv);
  if(i < 0) return null;
  let j = i + 1;
  while(j < lines.length && lines[j].dataset.type !== 'scene') j++;
  return { lines: lines.slice(i, j), first: lines[i], last: lines[j - 1] };
}
/* Ligne réelle située à une borne posée sur #page (indice d'ENFANT de #page,
   pas indice de ligne : un dialogue simultané compte pour un seul enfant). */
function stBoundaryLine(page, offset, isEnd){
  const kids = page.childNodes;
  const linesIn = n => {
    if(!n || n.nodeType !== 1) return [];
    const inner = n.querySelectorAll('.line[data-id]');
    if(inner.length) return Array.from(inner);
    return n.matches('.line[data-id]') ? [n] : [];
  };
  if(!isEnd){
    for(let i = Math.max(0, offset); i < kids.length; i++){ const l = linesIn(kids[i]); if(l.length) return l[0]; }
  } else {
    for(let i = Math.min(offset, kids.length) - 1; i >= 0; i--){ const l = linesIn(kids[i]); if(l.length) return l[l.length - 1]; }
  }
  return null;
}

/* VERROU TEMPORAIRE DES LIGNES
   Chaque ligne est un contentEditable séparé, et Chrome rabote toute
   sélection partielle qui traverse plusieurs de ces zones (seule la 1re
   ligne resterait surlignée, et Ctrl+C ne copierait qu'elle). Le temps que
   la sélection « scène / scénario » est active, on passe donc les lignes en
   lecture seule : la sélection est alors surlignée et copiée en entier. Dès
   qu'on clique ailleurs ou qu'on appuie sur une touche, tout est rendu
   éditable : Suppr/Retour/Entrée/une lettre remplacent la sélection comme
   dans l'éditeur (via applyRangeEdit), Échap/flèches la referment. */
let ST_LOCK = null;
function stLock(){
  if(ST_LOCK) return;
  const saved = [];
  document.querySelectorAll('#page [contenteditable="true"]').forEach(n => {
    saved.push(n); n.setAttribute('contenteditable', 'false');
  });
  ST_LOCK = saved;
}
function stUnlock(){
  if(!ST_LOCK) return;
  ST_LOCK.forEach(n => { if(n.isConnected) n.setAttribute('contenteditable', 'true'); });
  ST_LOCK = null;
}
/* Clic droit (ou Ctrl+clic sur Mac) SUR une sélection de plusieurs lignes :
   on la garde telle quelle pour que le menu contextuel (Copier…) s'applique
   à elle. Sans cela, le navigateur la réduit à un simple curseur dès le
   bouton enfoncé, et le moteur de glisser-sélectionner de l'éditeur la
   reconstruit à tort au relâchement. */
function stPointInSelection(x, y){
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount || sel.isCollapsed) return false;
  const page = document.getElementById('page');
  const r = sel.getRangeAt(0);
  if(!page || !page.contains(r.commonAncestorContainer)) return false;
  const rects = r.getClientRects();
  for(let i = 0; i < rects.length; i++){
    const q = rects[i];
    if(x >= q.left - 2 && x <= q.right + 2 && y >= q.top - 2 && y <= q.bottom + 2) return true;
  }
  return false;
}
function stIsContextClick(e){
  return e.button === 2 || (e.button === 0 && e.ctrlKey && /Mac|iPhone|iPad/.test(navigator.platform || ''));
}
/* Un clic sur une BARRE DE DÉFILEMENT (celle du centre, des panneaux, de la
   page entière) est signalé par le navigateur comme un mousedown sur
   l'élément qui défile. Il ne doit jamais compter comme « un clic ailleurs » :
   sinon la sélection de scène/scénario sautait dès qu'on attrapait l'ascenseur. */
function stOnScrollbar(e){
  let t = e.target;
  if(!t || t.nodeType !== 1) return false;
  if(t === document.documentElement || t === document.body){
    const de = document.documentElement;
    return e.clientX >= de.clientWidth || e.clientY >= de.clientHeight;
  }
  const r = t.getBoundingClientRect();
  const vBar = t.offsetWidth - t.clientWidth - (t.clientLeft || 0) * 2;
  const hBar = t.offsetHeight - t.clientHeight - (t.clientTop || 0) * 2;
  if(vBar > 0 && e.clientX >= r.left + (t.clientLeft || 0) + t.clientWidth && e.clientX <= r.right) return true;
  if(hBar > 0 && e.clientY >= r.top + (t.clientTop || 0) + t.clientHeight && e.clientY <= r.bottom) return true;
  return false;
}
document.addEventListener('mousedown', e => {
  if(e.target && e.target.closest && e.target.closest('#sceneTools')) return;
  if(stOnScrollbar(e)) return;      // ascenseur : on ne touche à rien
  if(stIsContextClick(e) && stPointInSelection(e.clientX, e.clientY)){
    e.preventDefault();             // la sélection reste, le menu contextuel s'ouvre dessus
    dragStartPoint = null;
    return;
  }
  if(!ST_LOCK) return;
  if(e.button === 2) return;        // clic droit ailleurs : le verrou reste jusqu'au prochain vrai clic
  stUnlock();                       // le clic qui suit pose le curseur normalement
}, true);
document.addEventListener('mouseup', e => {
  if(e.button === 2) dragStartPoint = null;   // un clic droit ne doit jamais refaire une sélection
}, true);
document.addEventListener('keydown', e => {
  if(!ST_LOCK) return;
  if(!document.getElementById('page')){ ST_LOCK = null; return; }
  const k = e.key;
  if(k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'Meta' || k === 'CapsLock') return;
  if(e.ctrlKey || e.metaKey){
    const kl = String(k).toLowerCase();
    if(kl === 'a' && !e.shiftKey){ e.preventDefault(); selectWholeScript(true); return; }
    if(kl === 'x'){
      e.preventDefault();
      const span = selectionSpan();
      const selTxt = window.getSelection().toString();
      stWriteClipboard(selTxt.trim() ? selTxt : ((span && stSpanText(span)) || selTxt));
      stUnlock();
      if(span) applyRangeEdit(span, '');
      return;
    }
    return;                          // Ctrl+C et les autres raccourcis : comportement normal
  }
  if(e.altKey) return;
  if(k === 'Delete' || k === 'Backspace' || k === 'Enter' || k.length === 1){
    e.preventDefault();
    const span = selectionSpan();
    stUnlock();
    if(span) applyRangeEdit(span, k === 'Enter' ? '\n' : (k.length === 1 ? k : ''));
    return;
  }
  stUnlock();                        // Échap, flèches… : on referme la sélection
  const sel = window.getSelection(); if(sel) sel.removeAllRanges();
}, true);

/* Texte d'une sélection multi-lignes relu dans le MODÈLE (et non dans ce que
   le navigateur veut bien sérialiser). Sert de filet à la copie / coupe. */
function stSpanText(span){
  if(!span || !span.a || !span.b || !S.project) return null;
  const ai = findIdx(span.a.dataset.id), bi = findIdx(span.b.dataset.id);
  if(ai < 0 || bi < 0 || bi < ai) return null;
  const els = S.project.elements;
  if(ai === bi) return (els[ai].text || '').slice(span.aOff, span.bOff);
  const out = [];
  for(let i = ai; i <= bi; i++){
    let t = els[i].text || '';
    if(i === ai) t = t.slice(span.aOff);
    if(i === bi) t = t.slice(0, span.bOff);
    out.push(t);
  }
  return out.join('\n');
}
function stWriteClipboard(text){
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); }catch(err){}
    ta.remove();
  };
  try{
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(fallback);
    else fallback();
  }catch(err){ fallback(); }
}
/* Ctrl+C : si le navigateur n'a rien à copier alors qu'une sélection
   multi-lignes existe bien dans l'éditeur, on copie le texte du modèle. */
document.addEventListener('keydown', e => {
  if(!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || String(e.key).toLowerCase() !== 'c') return;
  const page = document.getElementById('page');
  const sel = window.getSelection();
  if(!page || !sel || !sel.rangeCount || sel.isCollapsed) return;
  const r = sel.getRangeAt(0);
  if(!page.contains(r.startContainer) || !page.contains(r.endContainer)) return;
  if(sel.toString().trim()) return;                 // la copie normale marche
  const span = selectionSpan();
  const alt = span && span.multi ? stSpanText(span) : null;
  if(!alt || !alt.trim()) return;
  e.preventDefault();
  stWriteClipboard(alt);
  toast(L('Copié', 'Copied'));
}, true);
function stFlashLines(lines){
  lines.forEach(d => {
    d.classList.remove('st-flash'); void d.offsetWidth; d.classList.add('st-flash');
    setTimeout(() => d.classList.remove('st-flash'), 950);
  });
}
function selectWholeScene(sceneDiv){
  const blk = sceneBlockOf(sceneDiv);
  const page = document.getElementById('page');
  if(!blk || !page) return;
  const topOf = n => { while(n && n.parentNode !== page) n = n.parentNode; return n; };
  const kids = Array.prototype.slice.call(page.childNodes);
  const t1 = topOf(blk.first), t2 = topOf(blk.last);
  if(!t1 || !t2) return;
  stLock();
  // Bornes posées sur #page lui-même (comme Ctrl+A), pas dans les lignes.
  const range = document.createRange();
  range.setStart(page, kids.indexOf(t1));
  range.setEnd(page, kids.indexOf(t2) + 1);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  stFlashLines(blk.lines);
  const num = sceneNumbers()[sceneDiv.dataset.id];
  const n = blk.lines.length;
  toast(L(
    (num ? 'Scène ' + num : 'Scène') + ' sélectionnée · ' + n + ' ligne' + (n > 1 ? 's' : '') + ' — Ctrl+C copier · Suppr effacer',
    (num ? 'Scene ' + num : 'Scene') + ' selected · ' + n + ' line' + (n > 1 ? 's' : '') + ' — Ctrl+C copy · Del delete'));
}
function selectWholeScript(quiet){
  const page = document.getElementById('page');
  if(!page || !page.firstChild) return;
  stLock();
  const range = document.createRange();
  range.selectNodeContents(page);          // exactement comme Ctrl+A
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  if(quiet === true) return;               // Ctrl+A : discret, sans effet ni message
  page.classList.remove('st-flash-all'); void page.offsetWidth; page.classList.add('st-flash-all');
  setTimeout(() => page.classList.remove('st-flash-all'), 950);
  const n = pageLineDivs().length;
  toast(L('Tout le scénario sélectionné · ' + n + ' lignes — Ctrl+C copier · Suppr effacer',
          'Whole script selected · ' + n + ' lines — Ctrl+C copy · Del delete'));
}
function onSceneToolsClick(e){
  const seg = e.target.closest ? e.target.closest('.st-seg') : null;
  const page = document.getElementById('page');
  const layer = document.getElementById('sceneTools');
  if(!seg || !page || !layer) return;
  const sid = seg.dataset.sid;
  const div = sid === ST_ALL ? null : page.querySelector('[data-id="' + sid + '"]');
  if(sid !== ST_ALL && !div) return;
  e.preventDefault();
  const mine = Array.from(layer.querySelectorAll('.st-seg')).filter(g => g.dataset.sid === sid);
  mine.forEach(g => { g.classList.remove('st-pop'); void g.offsetWidth; g.classList.add('st-pop'); });
  setTimeout(() => mine.forEach(g => g.classList.remove('st-pop')), 500);
  if(sid === ST_ALL) selectWholeScript(); else selectWholeScene(div);
}
/* ---- panneau de diagnostic (Ctrl+Alt+D) ----
   Affiche ce que le moteur MESURE réellement. Si la pagination tombe au
   mauvais endroit, c'est presque toujours parce qu'une de ces valeurs est
   fausse (hauteur de page, hauteur de ligne, marges), et non parce que la
   logique de découpe est fausse. */
function renderPgDebug(res){
  let box = document.getElementById('pgDebug');
  if(!box){
    box = document.createElement('div');
    box.id = 'pgDebug';
    box.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:9999;background:#111;color:#0f0;'
      + 'font:11px/1.5 monospace;padding:10px 12px;border-radius:6px;max-width:320px;white-space:pre;'
      + 'box-shadow:0 6px 24px #0007;pointer-events:none;';
    document.body.appendChild(box);
  }
  const g = res.geo, d = res.debug || {};
  const f = focusedLine();
  const cr = f ? caretRect() : null;
  box.textContent =
    'DIAGNOSTIC PAGINATION  (Ctrl+Alt+D)  \u2014 fichier v44\n' +
    'blocs sur la page du curseur : ' + (f && res.pages[(S.pagination.pageOf[f.dataset.id] || 1) - 1] ? res.pages[(S.pagination.pageOf[f.dataset.id] || 1) - 1].length : 'n/a') + '\n' +
    'hauteur feuille   : ' + Math.round(g.pageH) + ' px\n' +
    'marge haut / bas  : ' + Math.round(g.mTop) + ' / ' + Math.round(g.mBottom) + ' px\n' +
    'zone de texte     : ' + Math.round(g.contentH) + ' px\n' +
    'hauteur de ligne  : ' + (d.oneLine ? d.oneLine.toFixed(1) : '?') + ' px\n' +
    'lignes par page   : ' + (d.linesPerPage != null ? d.linesPerPage : '?') + '\n' +
    'blocs / pages     : ' + (d.blocks != null ? d.blocks : '?') + ' / ' + res.pageCount + '\n' +
    'zoom              : ' + (S.pagination.zoom || 1).toFixed(3) + '\n' +
    'bloc au curseur   : ' + (f ? (f.dataset.type + ' \u2192 page ' + S.pagination.pageOf[f.dataset.id]) : 'n/a') + '\n' +
    'page affichée     : ' + S.pagination.current + ' / ' + S.pagination.count + '\n' +
    'curseur (y écran) : ' + (cr ? Math.round((cr.top + cr.bottom) / 2) : 'n/a') + '\n' +
    'SAUTS DE PAGE (reste en bas / place demandée) :\n' +
    ((res.breaks && res.breaks.length) ? res.breaks.slice(-8).map(b =>
      ' → p.' + b.to + ' : reste ' + Math.round(b.free) + ' px (' + (b.free / (d.oneLine || 16)).toFixed(1) + ' l.)'
      + (b.why === 'fit' ? ', il fallait ' + Math.round(b.need) + ' px : ne tient pas'
        : b.why === 'keep' ? ' : bloc solidaire (' + b.type + ')'
        : ' : page verrouillée')).join('\n') : ' aucun');
}
document.addEventListener('keydown', e=>{
  if(e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')){
    e.preventDefault();
    window.__pgDebug = !window.__pgDebug;
    const box = document.getElementById('pgDebug');
    if(!window.__pgDebug && box) box.remove();
    else repaginateNow();
  }
});

/* Pour chaque page > 1 : la scène en cours en haut de page, si celle-ci a
   commencé sur une page précédente (donc « (SUITE) »).
   `spill` (renvoyé par computePagination) signale les pages que survole un
   bloc trop grand pour tenir sur une seule feuille (longue tirade, long
   bloc d'action) : ces pages-là ne reçoivent AUCUNE ligne propre dans
   `pages[k]` — le bloc n'est poussé qu'une fois, sur la page où IL
   commence — alors qu'elles sont pourtant bien réelles, numérotées, et
   affichent du texte. Sans en tenir compte ici, `linesOfPage.length` vaut
   0 sur ces pages : elles étaient vues comme « vides », et la mention de
   continuité n'apparaissait ni en haut de ces pages, ni en bas de celle
   qui les précède. C'était la cause précise des mentions manquantes sur
   les scènes contenant un bloc de texte long — un cas nettement plus
   fréquent après un import, où les paragraphes ne sont pas redécoupés. */
function firstSceneOfEachPage(pages, numbers, spill){
  const out = {};
  let last = null;                     // dernière entête de scène rencontrée
  // Table id -> élément construite UNE fois : findEl() relit tout le scénario à chaque appel
  // (une recherche linéaire par scène, donc quadratique sur un long métrage).
  const byId = new Map(); (S.project.elements || []).forEach(e => byId.set(e.id, e));
  pages.forEach((linesOfPage, k) => {
    const hasContent = linesOfPage.length > 0 || (spill && spill[k]);
    const opensWithScene = linesOfPage.length && linesOfPage[0].dataset.type === 'scene';
    if(k > 0 && !opensWithScene && last && hasContent){
      out[k] = { label:last, continued:true };
    }
    linesOfPage.forEach(div => {
      if(div.dataset.type !== 'scene') return;
      const el = byId.get(div.dataset.id);
      if(!el) return;
      const n = numbers[el.id];
      last = n ? ('SCÈNE ' + n) : ((el.text || '').trim().toUpperCase().slice(0, 40) || 'SCÈNE');
    });
  });
  return out;
}
/* Mention fixe de continuité de page (distincte de la mention de
   continuité de personnage ci-dessus) : « CONTINUITÉ : » en bas de la page
   qui se termine au milieu d'une scène, « (continuité) » en haut de la
   page suivante qui la reprend. Toujours ces mots-là, dans la langue de
   l'interface — ce n'est plus un réglage à choisir dans les Paramètres. */
function pageContWord(pos){
  return pos === 'top' ? L('(continuité)', '(continued)') : L('CONTINUITÉ :', 'CONTINUED:');
}

/* Repagination groupée à l'image (requestAnimationFrame) : si plusieurs
   frappes arrivent dans la même image, on ne recalcule qu'une fois — mais
   sans jamais attendre une pause dans la frappe comme le faisait l'ancien
   debounce à 110ms (c'est ce délai qui donnait l'impression qu'une page
   vide mettait du temps à disparaître). */
/* Une frappe ordinaire (lettre, espace, retour arrière) qui ne change PAS la hauteur de sa ligne ne peut pas
   déplacer un seul saut de page : les sauts ne dépendent que de la hauteur des blocs. On mesure donc la ligne
   juste avant la frappe (pgNoteBeforeInput) et juste après : si elle n'a pas bougé, on ne repagine pas.
   Tout autre cas (la ligne change de hauteur ; scène, personnage, carton, bloc coupé entre deux pages ;
   n'importe quelle autre demande de pagination dans la même image) passe par la pagination normale. */
function pgUnitOf(node){
  const page = document.getElementById('page');
  let n = node && node.nodeType === 1 ? node : (node && node.parentElement);
  while(n && n.parentNode !== page) n = n.parentNode;
  return n && n.classList && n.classList.contains('line') ? n : null;
}
function pgNoteBeforeInput(e){
  const P = S.pagination;
  const unit = pgUnitOf(e.target);
  if(!unit){ P._noSkip = true; return; }
  if(P.pending != null){                       // une pagination est déjà en attente : la hauteur de référence est celle d'avant la 1re frappe
    if(!P._h0 || P._h0.unit !== unit) P._noSkip = true;
    return;
  }
  P._h0 = { unit, h: unit.getBoundingClientRect().height };
}
function pgTypingCanSkip(){
  const P = S.pagination, h0 = P._h0;
  if(P._noSkip || !h0 || !h0.unit.isConnected) return false;
  const u = h0.unit, t = u.dataset.type;
  if(t === 'scene' || t === 'character' || t === 'card' || t === 'note') return false;
  if(u.classList.contains('dual-wrap') || u.classList.contains('is-split') || u.querySelector('.is-split')) return false;
  return Math.abs(u.getBoundingClientRect().height - h0.h) < 0.01;
}
function schedulePaginate(kind){
  const P = S.pagination;
  if(kind !== 'typing') P._noSkip = true;
  if(P.pending != null) return;
  P.pending = requestAnimationFrame(() => {
    P.pending = null;
    if(S.view !== 'editor' || S.tab !== 'editor'){ P._h0 = null; P._noSkip = false; return; }
    const skip = pgTypingCanSkip();
    const unit = P._h0 && P._h0.unit;
    P._h0 = null; P._noSkip = false;
    if(skip){ pgCollectDirty(unit); }
    else {
      if(unit && unit.isConnected) PG_DIRTY.add(unit);     // la ligne tapée a changé de hauteur : c'est elle le point de départ du recalcul
      paginateEditor();
    }
    // CORRECTIF. La pagination vient peut-être de déplacer le bloc en cours
    // d'édition (il a grossi et ne tient plus sur la page). On ne replace la
    // vue qu'APRÈS ce déplacement : viser l'ancienne position faisait glisser
    // le texte sous le curseur juste après l'avoir amené à l'écran.
    if(focusedLine()){ ensureCaretVisible(); updatePageIndicator(); }
  });
}
/* Touche Entrée MAINTENUE : le clavier répète ~30 fois par seconde, plus vite que l'éditeur ne peut créer
   une ligne et la replacer sur un long scénario. Les répétitions s'empilaient alors dans la file d'événements
   et les lignes continuaient d'apparaître APRÈS le relâchement (« ça dérape »). Deux règles, valables
   uniquement pour les répétitions (e.repeat) — un appui isolé n'est jamais retardé ni ignoré :
     · une répétition qui a déjà attendu plus de ENTER_STALE_MS dans la file est ignorée (elle date d'avant
       que l'éditeur ait fini la ligne précédente) : le rythme s'adapte à la vitesse de la machine et
       s'arrête net quand on relâche ;
     · deux lignes ne sont jamais créées à moins de ENTER_REPEAT_MS d'intervalle : cadence régulière. */
const ENTER_REPEAT_MS = 50;
const ENTER_STALE_MS = 70;
let pgLastEnterAt = 0;
function pgThrottleEnterRepeat(e){
  /* Retour arrière / Suppr MAINTENUS : même règle des répétitions « en retard » que pour Entrée. Sur un long
     scénario, effacer une série de lignes vides prend plus de temps que la cadence du clavier : les répétitions
     s'empilaient et l'effacement continuait après avoir lâché la touche. Une répétition qui a attendu plus de
     ENTER_STALE_MS est ignorée ; quand l'éditeur suit, rien ne change (aucune cadence imposée). */
  if((e.key === 'Backspace' || e.key === 'Delete') && e.repeat){
    const waited = performance.now() - e.timeStamp;
    if(waited > ENTER_STALE_MS && waited < 60000){ e.preventDefault(); e.stopImmediatePropagation(); }
    return;
  }
  if(e.key !== 'Enter') return;
  const now = performance.now();
  if(e.repeat){
    const waited = now - e.timeStamp;
    if((waited > ENTER_STALE_MS && waited < 60000) || now - pgLastEnterAt < ENTER_REPEAT_MS){ e.preventDefault(); e.stopImmediatePropagation(); return; }
  }
  pgLastEnterAt = now;
}
/* Pour une action structurelle isolée (Entrée, fusion, changement de type…) :
   on veut que la ligne soit à sa place FINALE avant de lui donner le focus,
   sinon le navigateur amène l'écran à l'ancienne position puis la
   pagination la déplace juste après — d'où l'hésitation entre deux pages
   ressentie en sautant de ligne. Ces actions sont ponctuelles (jamais des
   dizaines par seconde comme la frappe), donc un recalcul synchrone ne
   coûte rien à voir (quelques ms, mesuré). */
function repaginateNow(){
  if(S.pagination.pending != null){ cancelAnimationFrame(S.pagination.pending); S.pagination.pending = null; }
  S.pagination._h0 = null; S.pagination._noSkip = false;
  if(S.view === 'editor' && S.tab === 'editor') paginateEditor();
}

/* ---- indicateur « Page x / y » ---- */
/* La ligne actuellement éditée, ou null. */
function focusedLine(){
  const a = document.activeElement;
  return (a && a.closest) ? a.closest('#page .line') : null;
}
/* Sur quelle feuille tombe une ordonnée donnée (coordonnées écran). Renvoie
   un numéro de page 1-based, ou null s'il n'y a pas encore de feuille. */
/* PERFORMANCE. Les feuilles sont toutes de même hauteur et régulièrement espacées : au lieu de mesurer
   chacune d'elles (326 mesures à chaque frappe sur un long métrage), on lit la première et la dernière et
   on calcule. Mêmes réponses qu'avant, y compris quand l'ordonnée tombe entre deux feuilles. */
function sheetGrid(){
  const box = document.getElementById('sheets');
  const sheets = box ? box.getElementsByClassName('sheet') : [];
  const n = sheets.length; if(!n) return null;
  const r0 = sheets[0].getBoundingClientRect();
  const step = n > 1 ? (sheets[n - 1].getBoundingClientRect().top - r0.top) / (n - 1) : 0;
  return { n, top: r0.top, h: r0.height, step };
}
function pageAtViewportY(y){
  const g = sheetGrid();
  if(!g) return null;
  if(g.n === 1 || !(g.step > 0)) return 1;
  const i = Math.max(0, Math.min(g.n - 1, Math.floor((y - g.top) / g.step)));
  const t = g.top + i * g.step, b = t + g.h;
  if(y >= t && y <= b) return i + 1;                          // dans la feuille
  if(y < t) return i + 1;                                     // avant la première
  if(i === g.n - 1) return g.n;                               // après la dernière
  const dNext = (g.top + (i + 1) * g.step) - y;               // entre deux feuilles : la plus proche
  return (y - b) <= dNext ? i + 1 : i + 2;
}
function pageStep(){
  const stack = document.getElementById('pageStack');
  if(!stack) return 1;
  const k = S.pagination.zoom || 1;
  const pageH = S.project.format === 'us' ? stack.offsetWidth * (11 / 8.5) : stack.offsetWidth * (29.7 / 21);
  return (pageH + PAGE_GAP) * k;
}
/* Page dominante à l'écran — utilisée uniquement quand rien n'est en train
   d'être édité (lecture au défilement). */
function dominantVisiblePage(){
  const pane = document.getElementById('centerPane');
  if(!pane) return 1;
  const paneRect = pane.getBoundingClientRect();
  const g = sheetGrid();
  if(!g) return 1;
  // Seules les feuilles qui croisent la zone visible peuvent l'emporter (calcul, sans mesurer les autres).
  let lo = 0, hi = g.n - 1;
  if(g.n > 1 && g.step > 0){
    lo = Math.max(0, Math.floor((paneRect.top - g.top) / g.step) - 1);
    hi = Math.min(g.n - 1, Math.floor((paneRect.bottom - g.top) / g.step) + 1);
  }
  let best = 0, bestOverlap = 0;
  for(let i = lo; i <= hi; i++){
    const t = g.top + i * g.step, b = t + g.h;
    const overlap = Math.max(0, Math.min(b, paneRect.bottom) - Math.max(t, paneRect.top));
    if(overlap > bestOverlap){ bestOverlap = overlap; best = i; }
  }
  return best + 1;
}
function updatePageIndicator(){
  const el = document.getElementById('pageIndicator');
  if(!el) return;
  // En train d'écrire (le curseur est actuellement visible à l'écran,
  // puisqu'on le maintient dans la vue) : la page affichée est celle où se
  // trouve VRAIMENT le curseur, et elle change dès qu'il atteint la
  // première ligne de la page suivante — même si l'écran montre encore
  // surtout la précédente au-dessus (comme dans Word : le numéro suit le
  // curseur, pas ce qui remplit le plus l'écran).
  // Si en revanche on a défilé manuellement loin du curseur pour relire
  // autre chose, c'est ce qui est à l'écran qui doit faire foi.
  const pane = document.getElementById('centerPane');
  const focused = focusedLine();
  let byCaret = null;
  if(focused && pane){
    const pr = pane.getBoundingClientRect();
    const cr = caretRect();
    const ref = cr || focused.getBoundingClientRect();
    if(ref.bottom > pr.top && ref.top < pr.bottom){
      // CORRECTIF. On regarde sur QUELLE FEUILLE tombe réellement le curseur,
      // au lieu de prendre la page où commence le bloc qui le contient. Un
      // paragraphe un peu long peut commencer en bas d'une feuille : l'ancien
      // code annonçait alors la page du début du bloc, ce qui ne correspondait
      // pas à l'endroit où l'on est en train d'écrire.
      byCaret = pageAtViewportY((ref.top + ref.bottom) / 2)
             || S.pagination.pageOf[focused.dataset.id];
    }
  }
  S.pagination.current = Math.min(S.pagination.count, Math.max(1, byCaret || dominantVisiblePage()));
  // PERFORMANCE : on ne réécrit l'indicateur que s'il change. Le réécrire à l'identique à chaque image
  // relançait, image après image, tout ce qui surveille le document (et un rafraîchissement complet de l'écran).
  const html = `${L('Page','Page')} <b>${esc(pageLbl(S.pagination.current))}</b> / ${S.pagination.count}`;
  if(el.__html !== html || el.innerHTML !== html){ el.innerHTML = html; el.__html = el.innerHTML; }
}
async function goToPage(){
  const _v = await mmPrompt(L('Numéro de page (1 – ' + S.pagination.count + ')', 'Page number (1 – ' + S.pagination.count + ')'), S.pagination.current, {title:L('Aller à la page','Go to page'), ok:L('Aller','Go')});
  const n = parseInt(_v, 10);
  if(!n || n < 1 || n > S.pagination.count) return;
  scrollToPage(n);
}
function scrollToPage(n){
  const zoom = document.getElementById('pageZoom');
  const pane = document.getElementById('centerPane');
  if(!zoom || !pane) return;
  pane.scrollTo({ top: zoom.offsetTop + (n - 1) * pageStep() - 20, behavior:'smooth' });
}

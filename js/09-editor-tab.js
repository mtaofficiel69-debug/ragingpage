/* =====================================================================
   EDITOR TAB — the real script editor
===================================================================== */
function renderEditorTab(){
  const c = document.getElementById('centerPane');
  c.innerHTML = `<div class="page-scroll ${FORMATS[S.project.format].cls}">
    <div id="pageZoom"><div id="pageStack"><div id="sheets"></div><div id="page"></div></div></div>
  </div>`;
  const page = document.getElementById('page');
  const numbers = sceneNumbers();
  const contdOf = contdMap(S.project.elements);
  if(S.focusMode) page.classList.add('focus-mode');
  appendFlow(page, S.project.elements, el=> buildLineDiv(el, numbers, contdOf));
  page.addEventListener('keydown', pgThrottleEnterRepeat, true);   // Entrée maintenue cadencée (capture : passe avant onLineKeydown)
  page.addEventListener('keydown', onLineKeydown);
  page.addEventListener('input', onLineInput);
  page.addEventListener('focusin', onLineFocus);
  // Si le focus quitte carrément l'éditeur (clic ailleurs dans l'appli,
  // changement d'onglet…) plutôt que de passer à une autre ligne, onLineFocus
  // ne se redéclenche pas : on rattrape ici la mention de la ligne quittée.
  page.addEventListener('focusout', ()=>{ setTimeout(refreshContdMarks, 0); });
  page.addEventListener('mousedown', onPageMouseDown);
  page.addEventListener('beforeinput', onBeforeInput);
  page.addEventListener('beforeinput', pgNoteBeforeInput);   // hauteur du bloc avant la frappe (voir schedulePaginate)
  page.addEventListener('paste', onPagePaste);
  page.addEventListener('cut', onPageCut);
  c.addEventListener('scroll', onEditorScroll);
  // CORRECTIF. Rien ne suivait le curseur quand il bougeait SANS que le texte
  // change : flèches, clic souris dans le même paragraphe, Origine/Fin,
  // Page préc./suiv., Ctrl+flèches. L'événement `selectionchange` est le seul
  // qui couvre tous ces cas d'un coup. Il est posé une seule fois sur le
  // document (renderEditorTab peut être rejoué plusieurs fois).
  page.addEventListener('keyup', onCaretMoved);
  if(!selectionWatchBound){
    selectionWatchBound = true;
    document.addEventListener('selectionchange', onSelectionMoved);
  }
  // Première pagination après le rendu, puis une seconde fois quand les
  // polices web sont réellement chargées : tant que Courier Prime n'est pas
  // là, les hauteurs mesurées sont celles de la police de repli et les
  // sauts de page tomberaient au mauvais endroit.
  requestAnimationFrame(()=>{
    paginateEditor();
    // Seconde pagination seulement si une police est encore en cours de chargement : quand elle est déjà
    // là (cas de chaque retour dans l'éditeur), la refaire doublait le temps d'affichage d'un long scénario.
    if(document.fonts && document.fonts.ready && document.fonts.status !== 'loaded') document.fonts.ready.then(()=>repaginateNow());
  });
  if(S.search.query) runSearch(S.search.query, true);
}
/* Déplacement du curseur sans modification du texte.
   `scroll` distingue les deux besoins : après une touche de navigation on
   ramène la vue sur le curseur, mais après un simple clic on se contente de
   rafraîchir l'indicateur — sinon cliquer près d'un bord ferait sauter la
   page sous la souris, ce qui est très désagréable. */
let selectionWatchBound = false, caretRaf = null;
let lastFocusedLineId = null; // dernière ligne éditée, indépendant du focus DOM au moment du clic (voir speakScene)
function scheduleCaretSync(scroll){
  if(caretRaf) return;
  caretRaf = requestAnimationFrame(()=>{
    caretRaf = null;
    if(S.view !== 'editor' || S.tab !== 'editor') return;
    if(!focusedLine()) return;
    // Une pagination est déjà programmée : elle fera le travail elle-même,
    // avec les bonnes positions. On ne veut pas deux recadrages qui se
    // contredisent dans la même image.
    if(S.pagination.pending != null) return;
    if(scroll) ensureCaretVisible();
    updatePageIndicator();
    navSyncActive();
  });
}
/* CORRECTIF (v39). `keyup` se déclenche aussi pour Maj, Ctrl, Alt, Verr. Maj, Échap, F1-F12… qui ne
   déplacent JAMAIS le curseur. En mode Machine à écrire, chacune de ces touches ramenait brutalement la
   vue au curseur : dès qu'on avait fait défiler le document (molette ou barre de défilement) et qu'on
   relâchait une touche, la page « sautait » en arrière et la barre de défilement semblait bloquée. */
function onCaretMoved(e){
  if(e && typeof e.key === 'string' && /^(Shift|Control|Alt|AltGraph|Meta|OS|CapsLock|NumLock|ScrollLock|Escape|ContextMenu|Fn|FnLock|F\d{1,2})$/.test(e.key)) return;
  scheduleCaretSync(true);
}
function onSelectionMoved(){ scheduleCaretSync(false); }

let editorScrollRaf = null;
function onEditorScroll(){
  hideAutocomplete();
  closeExtMenu();
  if(editorScrollRaf) return;
  editorScrollRaf = requestAnimationFrame(()=>{ editorScrollRaf = null; updatePageIndicator(); });
}
/* =====================================================================
   DIALOGUE SIMULTANÉ — LE MODÈLE
   ---------------------------------------------------------------------
   MÊME CONVENTION QUE LE MÉTIER. Un dialogue simultané n'est pas un type
   de ligne : c'est un DRAPEAU posé sur le nom du personnage de DROITE
   (el.dual === true), qui signifie « ce bloc se joue en même temps que
   le bloc de dialogue juste au-dessus ». C'est très exactement ce que
   font Final Draft (<DualDialogue>) et Fountain (le ^ après le nom) —
   donc l'export et l'import se font sans rien traduire, et un fichier
   passé par WriterDuet revient avec ses simultanés intacts.

   POURQUOI PAS UN TYPE DE LIGNE : un bloc simultané reste composé de
   lignes Personnage / Parenthétique / Dialogue tout ce qu'il y a de plus
   normales. Complétion des noms, reprises de parole « (SUITE) »,
   recherche, statistiques, rapports, corbeille : tout continue de
   fonctionner sans une seule ligne de code en plus. Retirer le drapeau
   remet les deux blocs l'un sous l'autre, sans rien perdre.

   LE RENDU. flowUnits() regroupe les éléments en « unités » d'affichage :
   une ligne seule, un bloc de dialogue, ou une PAIRE simultanée. Les
   trois montages qui existent dans l'application (l'éditeur, la mesure
   d'export, la mesure des huitièmes) passent tous par appendFlow(), donc
   l'écran, le PDF, l'impression et la pagination voient rigoureusement la
   même chose — c'est la seule façon d'avoir un WYSIWYG honnête.
===================================================================== */
const DUAL_BODY_TYPES = new Set(['dialogue','parenthetical']);
/* Bornes du bloc de dialogue qui commence à l'indice `start` (un
   Personnage, suivi de ses parenthétiques et de ses répliques). */
function dialogueBlockAt(els, start){
  const arr = [els[start]];
  let j = start + 1;
  while(j < els.length && DUAL_BODY_TYPES.has(els[j].type)){ arr.push(els[j]); j++; }
  return { arr, end:j };
}
/* Remonte de `idx` jusqu'au Personnage qui ouvre son bloc de dialogue.
   Renvoie -1 si la ligne n'appartient pas à un bloc de dialogue. */
function dialogueBlockStart(idx){
  const els = S.project.elements;
  for(let i = Math.min(idx, els.length - 1); i >= 0; i--){
    if(els[i].type === 'character') return i;
    if(!DUAL_BODY_TYPES.has(els[i].type)) return -1;
  }
  return -1;
}
/* Bornes de la PAIRE simultanée qui contient l'élément d'indice `idx`
   (première ligne de la colonne de gauche → dernière ligne de celle de
   droite), ou null si cet élément n'est pas dans une paire. */
function dualPairRange(idx){
  const els = S.project.elements;
  const bs = dialogueBlockStart(idx);
  if(bs < 0) return null;
  if(els[bs].dual){
    const leftStart = bs > 0 ? dialogueBlockStart(bs - 1) : -1;
    if(leftStart < 0 || els[leftStart].dual) return null;
    return { start:leftStart, rightStart:bs, end:dialogueBlockAt(els, bs).end };
  }
  const after = dialogueBlockAt(els, bs).end;
  const nxt = els[after];
  if(nxt && nxt.type === 'character' && nxt.dual)
    return { start:bs, rightStart:after, end:dialogueBlockAt(els, after).end };
  return null;
}
function flowUnits(els){
  const units = [];
  let i = 0;
  while(i < els.length){
    const el = els[i];
    if(el.type === 'character'){
      const b = dialogueBlockAt(els, i);
      const prev = units[units.length - 1];
      // Le drapeau ne vaut que s'il y a bien un bloc de dialogue JUSTE
      // au-dessus, et que celui-ci n'est pas déjà la colonne de droite
      // d'une paire (deux colonnes au maximum, comme partout ailleurs).
      if(el.dual && prev && prev.kind === 'block'){
        units.pop();
        units.push({ kind:'dual', left:prev.arr, right:b.arr });
      } else {
        units.push({ kind:'block', arr:b.arr });
      }
      i = b.end;
      continue;
    }
    units.push({ kind:'single', el });
    i++;
  }
  return units;
}
/* Remplit un conteneur avec le flux mis en page. `make` fabrique la ligne
   (éditable dans l'éditeur, simple nœud de mesure à l'export). */
function appendFlow(container, els, make){
  flowUnits(els).forEach(u=>{
    if(u.kind === 'dual'){
      const wrap = document.createElement('div');
      wrap.className = 'line line--dual dual-wrap';
      wrap.dataset.type = 'dual';
      if(u.left[0] && u.left[0].fpg) wrap.dataset.fpg = u.left[0].fpg;
      const L = document.createElement('div'); L.className = 'dual-col dual-col-l';
      const R = document.createElement('div'); R.className = 'dual-col dual-col-r';
      u.left.forEach(el=> L.appendChild(make(el)));
      u.right.forEach(el=> R.appendChild(make(el)));
      wrap.appendChild(L); wrap.appendChild(R);
      container.appendChild(wrap);
    } else if(u.kind === 'block'){
      u.arr.forEach(el=> container.appendChild(make(el)));
    } else {
      container.appendChild(make(u.el));
    }
  });
}
/* La ligne est-elle dans une paire simultanée ? Les manipulations de DOM
   par voisinage (ligne précédente / suivante) n'y sont plus valables : on
   refait alors proprement le rendu de l'éditeur à partir du modèle. */
function inDualWrap(div){ return !!(div && div.closest && div.closest('.dual-wrap')); }
function rebuildEditorAt(id, offset){
  renderEditorTab();
  const d = document.querySelector('#page [data-id="' + id + '"]');
  if(d) focusDiv(d, Math.min(offset == null ? 0 : offset, (d.textContent || '').length));
}
/* Voisin d'une ligne AU SENS DU MODÈLE (et non du DOM) : dans une paire
   simultanée, la ligne suivante n'est pas toujours le nœud d'à côté. */
/* Toutes les lignes RÉELLES de la page, dans l'ordre du scénario. Les
   colonnes d'un dialogue simultané y figurent (gauche puis droite) alors
   qu'elles ne sont pas des enfants directs de #page : compter ou parcourir
   page.children donnerait un décompte faux dès qu'une paire existe. */
function pageLineDivs(){
  const page = document.getElementById('page');
  return page ? Array.from(page.querySelectorAll('.line[data-id]')) : [];
}
/* Même décompte que pageLineDivs().length, sans relire tout le scénario : les collections vivantes du
   navigateur gardent leur longueur en mémoire tant que la structure ne change pas (une frappe ne la change
   pas). Les lignes réelles = toutes les .line, moins les conteneurs de dialogue simultané. */
function pageLineCount(){
  const page = document.getElementById('page');
  if(!page) return 0;
  if(page.__lc !== page){ page.__lcAll = page.getElementsByClassName('line'); page.__lcDual = page.getElementsByClassName('dual-wrap'); page.__lc = page; }
  return page.__lcAll.length - page.__lcDual.length;
}
function neighborLineDiv(el, dir){
  const i = findIdx(el.id);
  const n = i < 0 ? null : S.project.elements[i + dir];
  return n ? document.querySelector('#page [data-id="' + n.id + '"]') : null;
}

function buildLineDiv(el, numbers, contdOf){
  const div = document.createElement('div');
  div.className = 'line line--'+el.type;
  div.contentEditable = 'true';
  div.dataset.id = el.id;
  div.dataset.type = el.type;
  div.dataset.placeholder = placeholderFor(el.type)||'';
  div.textContent = el.text || '';
  if(!el.text) div.dataset.empty='1';
  if(el.type==='scene' && S.project.settings.showSceneNumbers && numbers[el.id]){
    div.dataset.sceneNum = numbers[el.id]+'.';
  }
  if(contdOf && contdOf[el.id]) div.dataset.contd = contdOf[el.id];
  applyCardStyle(div, el);
  if(S.project.comments && S.project.comments[el.id]){
    div.dataset.comment = '1';
    div.title = L('Commentaire : ','Comment: ') + S.project.comments[el.id];
  }
  return div;
}
function refreshLineDiv(div, el){
  // div.className était réécrit intégralement ici, ce qui effaçait au
  // passage les classes posées dynamiquement ailleurs — 'line-active' (Mode
  // Focus) et 'hl' (surbrillance de recherche). Concrètement : taper Tab
  // pour transformer une ligne d'Action en Personnage (donc créer un nom de
  // personnage) déclenche ce changement de type, et avec le Mode Focus actif
  // la ligne qu'on était pourtant en train d'écrire perdait 'line-active' et
  // retombait dans le texte estompé. On préserve donc ces deux classes.
  const hadActive = div.classList.contains('line-active');
  const hadHl = div.classList.contains('hl');
  div.className = 'line line--'+el.type; div.dataset.type = el.type; div.dataset.placeholder = placeholderFor(el.type)||'';
  if(hadActive) div.classList.add('line-active');
  if(hadHl) div.classList.add('hl');
  if(el.type === 'card' && !el.card) el.card = cardDefaults();
  applyCardStyle(div, el);
  // Le type vient de changer : la chaîne des reprises de parole n'est plus
  // la même, on la recalcule sur tout le script plutôt que sur cette ligne.
  delete div.dataset.contd;
  __contdPrev = null;                 // la mention de cette ligne vient d'être retirée : la prochaine passe doit tout revoir
  setTimeout(refreshContdMarks, 0);
  // Changer de type change les marges et l'indentation, donc la hauteur :
  // la pagination doit être rejouée.
  schedulePaginate();
  if(el.type!=='scene'){
    delete div.dataset.sceneNum;
  }
}
function lineText(div){
  return div.textContent;
}
function findEl(id){ return S.project.elements.find(e=>e.id===id); }
function findIdx(id){ return S.project.elements.findIndex(e=>e.id===id); }

function onLineInput(e){
  const page = document.getElementById('page');
  const div = e.target.closest('.line');
  // Saisie qui n'atterrit pas dans une ligne, ou structure qui ne
  // correspond plus au modèle : on réaligne avant toute chose.
  if(!div || (page && pageLineCount() !== S.project.elements.length)){
    syncFromDOM(); repaginateNow(); scheduleAutosave(); return;
  }
  const el = findEl(div.dataset.id);
  if(!el){ syncFromDOM(); repaginateNow(); return; }
  let text = lineText(div);
  el.text = (el.type === 'card') ? text.replace(/\n$/, '') : text;
  const emp = text ? '' : '1'; if(div.dataset.empty !== emp) div.dataset.empty = emp;   // inchangé : on n'y touche pas (sinon tous les styles [data-empty] sont réévalués)
  autoDetect(el, div);
  refreshContdMarks();
  updateExtMenu(div, el);
  updateAutocomplete(div, el);
  // Le recadrage de la vue et l'indicateur sont désormais rejoués à
  // l'intérieur de schedulePaginate(), une fois les blocs à leur place
  // définitive. Les appeler ici visait l'ancienne mise en page.
  // 'typing' : simple frappe dans cette ligne — la repagination n'a lieu que si sa hauteur a changé.
  const h0 = S.pagination._h0;
  if(h0 && h0.unit !== div) S.pagination._noSkip = true;   // la frappe ne vient pas du bloc mesuré : pas de saut de la pagination
  schedulePaginate('typing');
  scheduleAutosave();
}
function autoDetect(el, div){
  const t = el.text.trim();
  if(el.type==='action'){
    if(/^(INT|EXT|INT\.\/EXT|EXT\.\/INT|EST|INTERIEUR|EXTERIEUR|INT\/EXT)[.\s]/i.test(t) && t.length>3){
      el.type='scene'; pushUndoLight(); refreshLineDiv(div, el); renumberScenes();
    } else if(/^\(.*\)?$/.test(t) && t.startsWith('(')){
      el.type='parenthetical'; pushUndoLight(); refreshLineDiv(div, el);
    }
  }
}
function pushUndoLight(){ /* structural auto-changes: keep undo stack sane, snapshot occasionally */ }
function renumberScenes(){
  // La chaîne des reprises de parole dépend de l'ORDRE des lignes : elle
  // change exactement aux mêmes moments que les numéros de scène (insertion,
  // scission, collage, resynchronisation). On la recalcule donc ici.
  refreshContdMarks();
  // The scene number is a ::before (see CSS) driven by a data-sceneNum
  // attribute on the line itself, not a DOM node inside the editable
  // content — so updating it here never touches the line's child nodes
  // and can never disturb an in-progress caret/selection.
  const numbers = sceneNumbers();
  const byId = new Map(); S.project.elements.forEach(e => byId.set(e.id, e));   // findEl() par scène = recherche linéaire répétée
  document.querySelectorAll('#page .line--scene').forEach(div=>{
    const el = byId.get(div.dataset.id);
    if(el && S.project.settings.showSceneNumbers && numbers[el.id]){
      const v = numbers[el.id]+'.';
      if(div.dataset.sceneNum !== v) div.dataset.sceneNum = v;
    } else if(div.dataset.sceneNum !== undefined){
      delete div.dataset.sceneNum;
    }
  });
}

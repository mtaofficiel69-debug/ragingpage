/* =====================================================================
   ÉDITION PORTANT SUR PLUSIEURS LIGNES
   ---------------------------------------------------------------------
   Chaque ligne est un contentEditable séparé. Une sélection qui court sur
   plusieurs lignes est donc ingérable par le navigateur : selon le cas il
   n'efface qu'une partie de ce qui est surligné, ou au contraire il arrache
   des lignes entières du DOM sans que le modèle le sache — et c'est ainsi
   qu'un passage entier pouvait sembler « disparaître ». On intercepte donc
   nous-mêmes toute frappe, suppression, coupe ou collage qui traverse une
   frontière de ligne, et on l'applique au modèle ET au DOM.
===================================================================== */
function offsetInLine(line, node, off){
  try{
    const pre = document.createRange();
    pre.selectNodeContents(line);
    pre.setEnd(node, off);
    return pre.toString().length;
  }catch(err){ return 0; }
}
function selectionSpan(){
  const page = document.getElementById('page');
  const sel = window.getSelection();
  if(!page || !sel || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if(!page.contains(r.startContainer) || !page.contains(r.endContainer)) return null;
  let a = lineOf(r.startContainer), b = lineOf(r.endContainer);
  let aOff, bOff;
  // Cas du « tout sélectionner » : la sélection porte sur #page lui-même,
  // ses extrémités ne sont donc dans aucune ligne. On les ramène sur la
  // première et la dernière ligne concernées.
  const kids = (!a || !b) ? pageLineDivs() : [];      // seulement pour « tout sélectionner » : inutile de relire toutes les lignes à chaque frappe
  if(!a && r.startContainer === page && kids.length){
    a = stBoundaryLine(page, r.startOffset, false) || kids[Math.min(r.startOffset, kids.length - 1)]; aOff = 0;
  }
  if(!b && r.endContainer === page && kids.length){
    b = stBoundaryLine(page, r.endOffset, true) || kids[Math.min(Math.max(r.endOffset - 1, 0), kids.length - 1)];
    bOff = (b.textContent || '').length;
  }
  if(!a || !b) return null;
  if(aOff == null) aOff = offsetInLine(a, r.startContainer, r.startOffset);
  if(bOff == null) bOff = offsetInLine(b, r.endContainer, r.endOffset);
  return { a, b, aOff, bOff, multi: a !== b };
}
/* Remplace tout ce qui est sélectionné (d'une ligne à l'autre si besoin)
   par `insertText`. Un texte contenant des retours à la ligne crée autant
   d'éléments — c'est ce qui rend le collage d'un bloc entier propre. */
function applyRangeEdit(span, insertText){
  const ai = findIdx(span.a.dataset.id);
  const bi = findIdx(span.b.dataset.id);
  if(ai < 0 || bi < 0 || bi < ai) return false;
  pushUndo();
  const aEl = S.project.elements[ai], bEl = S.project.elements[bi];
  const head = (aEl.text || '').slice(0, span.aOff);
  const tail = (bEl.text || '').slice(span.bOff);

  // lignes entièrement ou partiellement prises entre le début et la fin
  // On repère les lignes à retirer par le MODÈLE (et non en suivant les
  // voisins dans le DOM) : une sélection qui traverse un dialogue
  // simultané ne se parcourt pas de proche en proche, les deux colonnes
  // étant imbriquées dans un conteneur.
  const touchesDual = inDualWrap(span.a) || inDualWrap(span.b);
  if(span.a !== span.b){          // sélection sur une seule ligne : rien à retirer
    const doomed = S.project.elements.slice(ai + 1, bi + 1)
      .map(el => document.querySelector('#page [data-id="' + el.id + '"]'))
      .filter(Boolean);
    S.project.elements.splice(ai + 1, bi - ai);
    doomed.forEach(d => d.remove());
  }

  const parts = String(insertText == null ? '' : insertText).split(/\r?\n/);
  aEl.text = head + parts[0] + (parts.length === 1 ? tail : '');
  span.a.textContent = aEl.text;
  span.a.dataset.empty = aEl.text ? '' : '1';

  let lastDiv = span.a, caret = (head + parts[0]).length;
  for(let i = 1; i < parts.length; i++){
    const txt = parts[i] + (i === parts.length - 1 ? tail : '');
    const el = newElement(aEl.type === 'scene' ? 'action' : aEl.type, txt);
    if(aEl.fpg) el.fpg = aEl.fpg;
    S.project.elements.splice(findIdx(lastDiv.dataset.id) + 1, 0, el);
    const div = buildLineDiv(el, sceneNumbers());
    lastDiv.after(div);
    lastDiv = div; caret = parts[i].length;
  }
  if(!S.project.elements.length){
    const el = newElement('action','');
    S.project.elements.push(el);
    const div = buildLineDiv(el, sceneNumbers());
    document.getElementById('page').appendChild(div);
    lastDiv = div; caret = 0;
  }
  renumberScenes();
  if(touchesDual){
    // Les colonnes ont bougé : on refait le montage à partir du modèle,
    // qui, lui, est juste.
    rebuildEditorAt(lastDiv.dataset.id, caret);
    scheduleAutosave();
    return true;
  }
  repaginateNow();
  focusDiv(lastDiv, caret);
  scheduleAutosave();
  return true;
}
function onBeforeInput(e){
  const span = selectionSpan();
  if(!span || !span.multi) return;          // une seule ligne : le navigateur gère très bien
  const t = e.inputType || '';
  if(t.indexOf('delete') === 0){
    e.preventDefault(); applyRangeEdit(span, '');
  } else if(t.indexOf('insert') === 0){
    let data = e.data;
    if(data == null && e.dataTransfer) data = e.dataTransfer.getData('text/plain');
    e.preventDefault(); applyRangeEdit(span, data || '');
  }
}
/* Collage : toujours en texte brut, sinon le HTML du presse-papiers
   s'installe dans la ligne et corrompt le document. */
function onPagePaste(e){
  const cd = e.clipboardData || window.clipboardData;
  if(!cd) return;
  const span = selectionSpan();
  if(!span) return;
  e.preventDefault();
  applyRangeEdit(span, cd.getData('text/plain'));
}
function onPageCut(e){
  const span = selectionSpan();
  if(!span || !e.clipboardData) return;
  let txt = window.getSelection().toString();
  if(!txt.trim()) txt = stSpanText(span) || txt;   // filet : texte relu dans le modèle
  e.clipboardData.setData('text/plain', txt);
  e.preventDefault();
  applyRangeEdit(span, '');
}
/* Filet de sécurité : si le DOM et le modèle ne coïncident plus (un
   navigateur a supprimé ou inséré un nœud dans notre dos), on réaligne le
   modèle sur ce que l'utilisateur a réellement sous les yeux, plutôt que de
   laisser les deux diverger en silence. */
function syncFromDOM(){
  const page = document.getElementById('page');
  if(!page) return;
  const kept = [];
  // Une paire simultanée est un conteneur : ce sont les lignes DANS ses
  // deux colonnes qui portent le texte et les identifiants. On les
  // remonte donc à plat, dans l'ordre du modèle (gauche puis droite).
  const flat = [];
  Array.from(page.children).forEach(node=>{
    if(node.classList && node.classList.contains('dual-wrap')){
      node.querySelectorAll('.line[data-id]').forEach(n=> flat.push(n));
    } else flat.push(node);
  });
  flat.forEach(node=>{
    if(!node.classList || !node.classList.contains('line')){
      const el = newElement('action', node.textContent || '');
      const div = buildLineDiv(el, {});
      node.replaceWith(div);
      kept.push(el);
      return;
    }
    const el = findEl(node.dataset.id);
    if(el){ el.text = node.textContent; el.type = node.dataset.type || el.type; kept.push(el); }
    else{
      const n = newElement(node.dataset.type || 'action', node.textContent || '');
      if(node.dataset.fpg) n.fpg = node.dataset.fpg;
      node.dataset.id = n.id; kept.push(n);
    }
  });
  if(!kept.length){
    const el = newElement('action','');
    kept.push(el);
    page.appendChild(buildLineDiv(el, {}));
  }
  S.project.elements = kept;
  renumberScenes();
  scheduleAutosave();
}

function getCaretOffset(div, range){
  const pre = range.cloneRange(); pre.selectNodeContents(div); pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}
function focusDiv(div, offset){
  div.focus();
  const sel = window.getSelection(); const range = document.createRange();
  let node = div.firstChild;
  if(!node){ node = document.createTextNode(''); div.appendChild(node); }
  if(node.nodeType!==3){ div.appendChild(document.createTextNode('')); node = div.lastChild; }
  const off = Math.min(offset, node.textContent.length);
  range.setStart(node, off); range.collapse(true);
  sel.removeAllRanges(); sel.addRange(range);
  // `focusin` s'est déclenché sur div.focus(), donc AVANT que la sélection
  // n'existe : à ce moment-là on ne pouvait caler la vue que sur le bloc
  // entier. Maintenant que le curseur est réellement posé, on affine.
  ensureCaretVisible();
  updatePageIndicator();
}

/* Variante pour les touches MAINTENUES (fusion de lignes en rafale) : pose le curseur sans forcer le
   navigateur à refaire toute la mise en page tout de suite. La pagination (schedulePaginate) passe une fois
   par image, puis recadre la vue sur le curseur et met l'indicateur à jour, comme d'habitude. */
function focusDivQuick(div, offset){
  S.pagination._quickFocus = true;
  try{ div.focus({ preventScroll:true }); } finally { S.pagination._quickFocus = false; }
  const sel = window.getSelection(); const range = document.createRange();
  let node = div.firstChild;
  if(!node){ node = document.createTextNode(''); div.appendChild(node); }
  if(node.nodeType!==3){ div.appendChild(document.createTextNode('')); node = div.lastChild; }
  range.setStart(node, Math.min(offset, node.textContent.length)); range.collapse(true);
  sel.removeAllRanges(); sel.addRange(range);
}

/* ---- mouse drag-to-select across lines ----
   Each script line is its own separate contentEditable element (needed so
   Enter/Backspace/type-switching can treat lines independently). Browsers
   confine a live mouse-drag selection to the editable element it started
   in, so dragging from one line into the next normally stops dead at that
   line's border. We let the browser handle the drag as usual (so a normal
   click, or a drag that stays inside one line, is untouched) and only step
   in on mouseup: if the drag crossed into a different line, we rebuild a
   single Range from where the drag started to where it was released and
   apply it — the same technique used for Ctrl+A, just between two exact
   points instead of the whole page. */
let dragStartPoint = null;
function caretFromPoint(x, y){
  if(document.caretRangeFromPoint){
    const r = document.caretRangeFromPoint(x, y);
    return r ? {node:r.startContainer, offset:r.startOffset} : null;
  }
  if(document.caretPositionFromPoint){
    const p = document.caretPositionFromPoint(x, y);
    return p ? {node:p.offsetNode, offset:p.offset} : null;
  }
  return null;
}
function lineOf(node){
  const el = node && node.nodeType===1 ? node : (node && node.parentElement);
  return el ? el.closest('.line') : null;
}
function edgePoint(line, atStart){
  let node = line.firstChild;
  if(!node) return {node:line, offset:0};
  return atStart ? {node, offset:0} : {node, offset:(node.textContent||'').length};
}
function onPageMouseDown(e){
  const line = e.target.closest('.line');
  dragStartPoint = line ? (caretFromPoint(e.clientX, e.clientY) || edgePoint(line, true)) : null;
}
/* Build the cross-line Range between the fixed drag-start point and
   whatever point the pointer is currently over. Shared by the live
   mousemove preview and the mouseup finalizer so both agree on exactly
   the same selection. Returns null if a range can't be built, or an
   object with the range plus the start/end lines (so the caller can tell
   whether the drag actually left its starting line). */
function buildCrossLineRange(startPoint, clientX, clientY){
  const page = document.getElementById('page'); if(!page) return null;
  let endPoint = caretFromPoint(clientX, clientY);
  if(!endPoint){
    // pointer is outside any text (page margin, above/below the sheet):
    // snap to the start or end of the whole script, like dragging past
    // the edge of a page in a real word processor keeps extending the
    // selection.
    // [data-id] : on veut les lignes de texte réelles, pas le conteneur
    // d'une paire de dialogue simultané (qui porte lui aussi .line).
    const lines = pageLineDivs();
    if(!lines.length) return null;
    const pageRect = page.getBoundingClientRect();
    endPoint = clientY < pageRect.top ? edgePoint(lines[0], true) : edgePoint(lines[lines.length-1], false);
  }
  const startLine = lineOf(startPoint.node), endLine = lineOf(endPoint.node);
  if(!startLine || !endLine) return null;
  const probe = document.createRange();
  probe.setStart(startPoint.node, startPoint.offset); probe.collapse(true);
  const reversed = probe.comparePoint(endPoint.node, endPoint.offset) < 0;
  const a = reversed ? endPoint : startPoint, b = reversed ? startPoint : endPoint;
  const range = document.createRange();
  try{ range.setStart(a.node, a.offset); range.setEnd(b.node, b.offset); } catch(err){ return null; }
  return { range, startLine, endLine };
}
/* Live preview: while the mouse button is down and the drag has crossed
   into a different line, keep rebuilding and applying the selection on
   every pointer move so the highlight visibly follows the drag in real
   time — instead of the browser's native per-line selection freezing at
   the line border and only being corrected once the mouse is released. */
let dragRafPending = false;
function onDocMouseMove(e){
  if(!dragStartPoint) return; // not dragging from inside a line
  if(dragRafPending) return;
  dragRafPending = true;
  const clientX = e.clientX, clientY = e.clientY;
  requestAnimationFrame(()=>{
    dragRafPending = false;
    if(!dragStartPoint) return; // drag ended while this frame was pending
    const built = buildCrossLineRange(dragStartPoint, clientX, clientY);
    if(!built || built.startLine===built.endLine) return; // still inside the starting line: let native selection handle it
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(built.range);
  });
}
function onDocMouseUp(e){
  const startPoint = dragStartPoint; dragStartPoint = null;
  if(!startPoint) return;
  const sel = window.getSelection();
  if(!sel || sel.isCollapsed) return; // plain click: leave native caret placement alone
  const built = buildCrossLineRange(startPoint, e.clientX, e.clientY);
  if(!built || built.startLine===built.endLine) return; // single-line drag: native selection already got it right
  sel.removeAllRanges(); sel.addRange(built.range);
}

function onDocKeydown(e){
  if((e.ctrlKey||e.metaKey) && 'zy'.includes(e.key.toLowerCase()) && e.key.length===1 && e.target && e.target.closest && e.target.closest('#tpPreviewShell')) return;   // page de titre : Ctrl+Z annule la saisie du texte, pas tout le scénario
  if((e.ctrlKey||e.metaKey) && !e.shiftKey && e.key.toLowerCase()==='z'){ e.preventDefault(); doUndo(); }
  else if((e.ctrlKey||e.metaKey) && e.shiftKey && e.key.toLowerCase()==='z'){ e.preventDefault(); doRedo(); }
  else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); manualSave(); }
  else if((e.ctrlKey||e.metaKey) && e.shiftKey && e.key.toLowerCase()==='f'){ e.preventDefault(); toggleFocusMode(); }
  else if((e.ctrlKey||e.metaKey) && e.shiftKey && e.key.toLowerCase()==='l'){ e.preventDefault(); if(S.tab==='editor') speakScene(); }
  else if((e.ctrlKey||e.metaKey) && e.shiftKey && e.key.toLowerCase()==='v' && !e.altKey){ e.preventDefault(); if(S.tab==='editor') toggleDictation(); }
  else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='f'){ e.preventDefault(); const si=document.getElementById('searchInput'); if(si){ si.focus(); si.select(); } }
  else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); if(S.tab==='editor') openJumpScene(); }
  else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='h'){ e.preventDefault(); if(S.tab==='editor') openReplace(); }
  else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='g'){ e.preventDefault(); if(S.tab==='editor') goToPage(); }
}
async function manualSave(){
  await doAutosave();
  toast(L('Scénario sauvegardé.','Screenplay saved.'));
}


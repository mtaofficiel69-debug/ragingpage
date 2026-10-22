/* =====================================================================
   DIALOGUE SIMULTANÉ — LA COMMANDE
   ---------------------------------------------------------------------
   Une seule commande, comme dans WriterDuet : on place le curseur dans le
   DEUXIÈME bloc de dialogue (celui qui doit monter à droite) et on
   bascule. Refaire la manœuvre le redescend sous le premier. Rien n'est
   jamais réécrit dans le texte : c'est le drapeau el.dual qu'on pose ou
   qu'on retire, donc l'opération est parfaitement réversible et Ctrl+Z la
   défait comme n'importe quelle autre modification.
===================================================================== */
function toggleDual(){
  if(!S.project) return;
  const line = focusedLine();
  const id = (line && line.dataset.id) || lastFocusedLineId;
  const idx = id ? findIdx(id) : -1;
  if(idx < 0){ toast(L('Place d\u2019abord le curseur dans la réplique concernée.','First place the cursor in the relevant line.')); return; }
  const start = dialogueBlockStart(idx);
  if(start < 0){
    toast(L('Le dialogue simultané s\u2019applique à un bloc de dialogue : place le curseur sur le nom du personnage ou sur sa réplique.','Simultaneous dialogue applies to a dialogue block: place the cursor on the character name or on their line.'));
    return;
  }
  const els = S.project.elements;
  const charEl = els[start];
  // Curseur dans la colonne de GAUCHE d'une paire existante : la commande
  // défait cette paire. Sans ce cas, elle aurait tenté d'accrocher la
  // colonne de gauche au bloc du dessus, et les blocs se seraient empilés
  // en escalier au lieu de revenir à la normale.
  const pair = dualPairRange(start);
  if(pair && !charEl.dual){
    pushUndo();
    delete els[pair.rightStart].dual;
    rebuildEditorAt(id, null);
    scheduleAutosave();
    toast(L('Dialogue simultané retiré : les deux répliques se suivent à nouveau.','Simultaneous dialogue removed: the two lines now follow each other again.'));
    return;
  }
  if(charEl.dual){
    pushUndo();
    delete charEl.dual;
    rebuildEditorAt(id, null);
    scheduleAutosave();
    toast(L('Dialogue remis à la suite de l\u2019autre.','Dialogue put back after the other one.'));
    return;
  }
  const prevStart = start > 0 ? dialogueBlockStart(start - 1) : -1;
  if(prevStart < 0){
    toast(L('Il faut un premier bloc de dialogue juste au-dessus : c\u2019est avec lui que celui-ci sera joué en même temps.','There needs to be a first dialogue block just above: this one will play at the same time as it.'));
    return;
  }
  if(els[prevStart].dual){
    toast(L('Deux colonnes au maximum : ce bloc du dessus est déjà la colonne de droite d\u2019une paire.','Two columns maximum: the block above is already the right-hand column of a pair.'));
    return;
  }
  pushUndo();
  charEl.dual = true;
  rebuildEditorAt(id, null);
  scheduleAutosave();
  toast(L('Dialogue simultané : les deux répliques se jouent en même temps.','Simultaneous dialogue: both lines play at the same time.'));
}
function dualBtnHtml(cls){
  return `<button class="btn ${cls||''}" data-act="toggleDual" title="${L('Dialogue simultané (Ctrl/Cmd+Maj+D) : place les deux répliques côte à côte, comme dans WriterDuet. Curseur dans le deuxième bloc de dialogue.','Simultaneous dialogue (Ctrl/Cmd+Shift+D): places both lines side by side, like in WriterDuet. Cursor in the second dialogue block.')}">${icon('dual')} ${L('Simultané','Simultaneous')}</button>`;
}

/* ---- keyboard behaviour ---- */
function onLineKeydown(e){
  const div = e.target.closest('.line'); if(!div) return;
  const el = findEl(div.dataset.id); if(!el) return;

  // Le menu des extensions est ouvert pour CETTE ligne : il capte ↑/↓,
  // Entrée, Tab et Échap avant tout le reste (sinon Entrée créerait une
  // ligne et Tab changerait le type de la ligne au lieu d'insérer).
  if(S.extMenu && S.extMenu.id === el.id){
    if(e.key === 'ArrowDown'){ e.preventDefault(); moveExtMenu(1); return; }
    if(e.key === 'ArrowUp'){ e.preventDefault(); moveExtMenu(-1); return; }
    if(e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)){ e.preventDefault(); acceptExtMenu(); return; }
    if(e.key === 'Escape'){ e.preventDefault(); closeExtMenu(); return; }
  }

  // Une suggestion de complétion (personnage / lieu de scène) est affichée
  // pour CETTE ligne : Tab ou Entrée l'acceptent, avant tout autre
  // traitement de ces touches (le passage « Action → Personnage » habituel
  // pour Tab, et le passage à la ligne suivante pour Entrée, ne doivent pas
  // avoir lieu dans ce cas). Toute autre touche l'annule simplement (elle
  // sera recalculée par updateAutocomplete() si elle s'applique encore).
  if(((e.key==='Tab' && !e.shiftKey) || e.key==='Enter') && S.autocomplete && S.autocomplete.id===el.id){
    e.preventDefault();
    pushUndo();
    el.text = el.text + S.autocomplete.remainder;
    div.textContent = el.text; div.dataset.empty = el.text ? '' : '1';
    hideAutocomplete();
    schedulePaginate();
    focusDiv(div, el.text.length);
    scheduleAutosave();
    return;
  }
  if(S.autocomplete && !['Shift','Control','Alt','Meta','CapsLock'].includes(e.key)){
    hideAutocomplete();
  }

  // (Ctrl/Cmd+number => force type. We read e.code (the physical key)
  // instead of e.key: e.key for a digit depends on keyboard layout (e.g. on
  // French AZERTY, Shift is required just to produce a digit character at
  // all) and, for the separate numeric keypad, on Num Lock state — with Num
  // Lock off, e.key for a numpad digit becomes Home/End/PageUp/etc instead
  // of a digit, which is what let those keystrokes fall through to native
  // browser/editing behaviour. e.code is unaffected by both layout and Num
  // Lock, so we match the physical key from either the top-row digits or
  // the numeric keypad.
  // NOTE: Ctrl/Cmd+1..9 and Ctrl/Cmd+0 are reserved by Chrome/Edge/Safari/
  // Firefox for tab-switching and zoom-reset, and the browser intercepts
  // them before this handler ever runs — no amount of preventDefault() in
  // page JS can override that. In those browsers this shortcut will not
  // fire at all. Left as Ctrl/Cmd+number only, as requested.)
  const digitMatch = /^(?:Digit|Numpad)([0-9])$/.exec(e.code);
  const digit = digitMatch ? digitMatch[1] : null;
  if((e.ctrlKey||e.metaKey) && !e.shiftKey && digit && TYPE_SHORTCUT[digit]){
    e.preventDefault();
    el.type = TYPE_SHORTCUT[digit]; pushUndo(); refreshLineDiv(div, el); renumberScenes();
    showContextPanel(el); scheduleAutosave(); return;
  }
  if((e.ctrlKey||e.metaKey) && !e.shiftKey && digit==='0'){ e.preventDefault(); el.type='text'; pushUndo(); refreshLineDiv(div,el); scheduleAutosave(); return; }

  // Ctrl/Cmd+Maj+D => basculer ce bloc de dialogue en simultané (et retour)
  if((e.ctrlKey||e.metaKey) && e.shiftKey && e.key.toLowerCase()==='d'){
    e.preventDefault();
    toggleDual();
    return;
  }

  // Ctrl/Cmd+Maj+M => ouvrir/modifier le commentaire attaché à cette ligne
  // (fonctionnalité inspirée de WriterDuet, cf. openCommentEditor).
  if((e.ctrlKey||e.metaKey) && e.shiftKey && e.key.toLowerCase()==='m'){
    e.preventDefault();
    openCommentEditor(el.id);
    return;
  }

  // Ctrl/Cmd+A => select the whole script, not just the current line.
  // Each line is its own separate contentEditable element, so the browser's
  // native "select all" only grabs the line currently focused. We build our
  // own Range covering every line in #page so Ctrl+C afterwards copies the
  // full text of the page being written.
  if((e.ctrlKey||e.metaKey) && !e.shiftKey && e.key.toLowerCase()==='a'){
    e.preventDefault();
    // v11 : même mécanisme que l'accolade « tout le scénario » (lignes
    // verrouillées le temps de la sélection) — Ctrl+A puis Ctrl+C copiait
    // parfois du vide parce que le navigateur rabotait la sélection posée
    // sur des lignes encore éditables.
    selectWholeScript(true);
    return;
  }

  // Une sélection qui traverse plusieurs lignes est traitée par nous, quelle
  // que soit la touche : c'est ce qui manquait pour que supprimer un passage
  // surligné fasse ce qu'on attend.
  if(e.key==='Enter' || e.key==='Backspace' || e.key==='Delete'){
    const span = selectionSpan();
    if(span && span.multi){
      e.preventDefault();
      applyRangeEdit(span, e.key==='Enter' ? '\n' : '');
      return;
    }
  }
  if(e.key==='Enter' && e.shiftKey && el.type==='card'){
    // Retour à la ligne DANS le carton (un carton peut tenir sur plusieurs lignes).
    // On réécrit le texte de la ligne d'un bloc plutôt que d'insérer un nœud : le
    // curseur se place alors toujours APRÈS le saut de ligne, même en fin de texte.
    e.preventDefault();
    const sel = window.getSelection();
    if(sel.rangeCount){
      pushUndo();
      const r = sel.getRangeAt(0);
      const pre = r.cloneRange(); pre.selectNodeContents(div); pre.setEnd(r.startContainer, r.startOffset);
      const start = pre.toString().length, end = start + r.toString().length;
      const full = lineText(div).replace(/\n$/, '');
      let t = full.slice(0, start) + '\n' + full.slice(end);
      // Un « \n » tout à la fin ne crée pas de ligne visible : on en garde un second
      // derrière le curseur (retiré du texte enregistré, voir onLineInput).
      if(t.slice(start + 1) === '') t += '\n';
      div.textContent = t;
      el.text = t.replace(/\n$/, ''); div.dataset.empty = el.text ? '' : '1';
      focusDiv(div, start + 1);
      schedulePaginate(); scheduleAutosave();
    }
    return;
  }
  if(e.key==='Enter'){
    e.preventDefault();
    pushUndo();
    // caret at end assumption: split text at caret
    const sel = window.getSelection();
    const range = sel.rangeCount ? sel.getRangeAt(0) : null;
    const full = lineText(div);
    const caretOffset = range ? getCaretOffset(div, range) : full.length;
    const before = full.slice(0, caretOffset);
    const after = full.slice(caretOffset);
    el.text = before;
    let nextType = ENTER_MAP[el.type] || 'action';
    if(el.type==='dialogue' && before.trim()==='' ){ nextType='action'; }
    const idx = findIdx(el.id);
    let insertAt = idx + 1;
    // ENTRÉE DANS UN DIALOGUE SIMULTANÉ. Sans cette règle, la ligne créée
    // après une réplique était un nouveau PERSONNAGE glissé entre les deux
    // colonnes : il devenait aussitôt la colonne de gauche d'une nouvelle
    // paire, et l'on voyait le bloc se dédoubler en escalier à chaque
    // Entrée. Comportement repris de WriterDuet :
    //   • on scinde une réplique en deux → la suite reste du dialogue,
    //     dans la MÊME colonne ;
    //   • on valide en bout de réplique (ou on passe à autre chose
    //     qu'un dialogue) → on SORT de la paire : la nouvelle ligne se
    //     pose sous le bloc simultané, sur toute la largeur.
    if(inDualWrap(div)){
      const pair = dualPairRange(idx);
      if(pair){
        if(nextType === 'character'){
          if(after.trim() !== '') nextType = 'dialogue';
          else insertAt = pair.end;
        } else if(nextType !== 'dialogue' && nextType !== 'parenthetical'){
          insertAt = pair.end;
        }
      }
    }
    const newEl = newElement(nextType, after);
    if(el.fpg) newEl.fpg = el.fpg;      // Entrée sur une page sans numéro : la nouvelle ligne reste sur cette page
    S.project.elements.splice(insertAt,0,newEl);
    div.textContent = before; div.dataset.empty = before?'':'1';
    if(el.type==='scene') renumberScenes();
    if(inDualWrap(div)){
      // Dans une colonne de dialogue simultané : le nœud voisin n'est pas
      // forcément la ligne suivante du scénario, on refait le montage.
      rebuildEditorAt(newEl.id, 0);
      scheduleAutosave();
      return;
    }
    const newDiv = buildLineDiv(newEl, sceneNumbers());
    div.after(newDiv);
    repaginateNow();
    focusDiv(newDiv, 0);
    scheduleAutosave();
    return;
  }
  if(e.key==='Tab'){
    e.preventDefault();
    pushUndo();
    if(e.shiftKey){
      if(el.type==='character') el.type='action';
      else if(el.type==='dialogue') el.type='character';
      else if(el.type==='parenthetical') el.type='character';
      else el.type='action';
    } else {
      if(TOWARD_CHAR.has(el.type)) el.type='character';
      else if(TOWARD_ACTION.has(el.type)) el.type='action';
    }
    refreshLineDiv(div, el); renumberScenes(); showContextPanel(el); scheduleAutosave();
    return;
  }
  if(e.key==='Backspace'){
    const sel = window.getSelection();
    const range = sel.rangeCount? sel.getRangeAt(0): null;
    const caretOffset = range? getCaretOffset(div, range) : 0;
    if(caretOffset===0 && !sel.toString()){
      // DÉFAIRE PLUTÔT QUE FUSIONNER. Retour arrière au tout début du nom
      // du personnage de droite : on redescend d'abord le bloc sous
      // l'autre (le simultané se retire), au lieu de coller ce nom à la
      // fin de la réplique d'à côté — c'est ce qui rendait un bloc
      // simultané si pénible à défaire ou à supprimer. Une deuxième
      // pression fusionne ensuite normalement, comme partout ailleurs.
      if(el.type === 'character' && el.dual){
        e.preventDefault(); pushUndo();
        delete el.dual;
        rebuildEditorAt(el.id, 0);
        scheduleAutosave();
        toast(L('Dialogue simultané retiré : les deux répliques se suivent à nouveau.','Simultaneous dialogue removed: the two lines now follow each other again.'));
        return;
      }
      const idx = findIdx(el.id);
      if(idx>0){
        e.preventDefault(); pushUndo();
        const prevEl = S.project.elements[idx-1];
        const wasDual = inDualWrap(div) || inDualWrap(document.querySelector('#page [data-id="'+prevEl.id+'"]'));
        const prevDiv = neighborLineDiv(el, -1);
        const mergedAt = prevEl.text.length;
        prevEl.text = prevEl.text + el.text;
        S.project.elements.splice(idx,1);
        div.remove();
        if(el.type==='scene' || prevEl.type==='scene') renumberScenes();
        if(wasDual){ rebuildEditorAt(prevEl.id, mergedAt); scheduleAutosave(); return; }
        if(e.repeat && prevDiv){
          // Touche maintenue : on enchaîne les fusions et la pagination ne passe qu'une fois par image.
          prevDiv.textContent = prevEl.text; prevDiv.dataset.empty = prevEl.text?'':'1';
          focusDivQuick(prevDiv, mergedAt); schedulePaginate(); scheduleAutosave();
          return;
        }
        repaginateNow();
        if(prevDiv){ prevDiv.textContent = prevEl.text; prevDiv.dataset.empty = prevEl.text?'':'1'; focusDiv(prevDiv, mergedAt); }
        scheduleAutosave();
      }
    }
    return;
  }
  if(e.key==='Delete'){
    const sel = window.getSelection();
    const range = sel.rangeCount ? sel.getRangeAt(0) : null;
    if(range && !sel.toString() && getCaretOffset(div, range) >= lineText(div).length){
      const idx = findIdx(el.id);
      if(idx >= 0 && idx < S.project.elements.length-1){
        e.preventDefault(); pushUndo();
        const nextEl = S.project.elements[idx+1];
        const nextDiv = neighborLineDiv(el, 1);
        const wasDual = inDualWrap(div) || inDualWrap(nextDiv);
        const at = el.text.length;
        el.text = el.text + nextEl.text;
        S.project.elements.splice(idx+1, 1);
        if(nextDiv) nextDiv.remove();
        div.textContent = el.text; div.dataset.empty = el.text?'':'1';
        if(el.type==='scene' || nextEl.type==='scene') renumberScenes();
        if(wasDual){ rebuildEditorAt(el.id, at); scheduleAutosave(); return; }
        if(e.repeat){ focusDivQuick(div, at); schedulePaginate(); scheduleAutosave(); return; }   // touche maintenue : une pagination par image
        repaginateNow();
        focusDiv(div, at);
        scheduleAutosave();
      }
    }
    return;
  }
  if(e.key==='ArrowUp' && !e.shiftKey){
    const sel=window.getSelection(); const r=sel.rangeCount?sel.getRangeAt(0):null;
    if(r && getCaretOffset(div,r)===0){
      const prev = neighborLineDiv(el, -1);
      if(prev){ e.preventDefault(); focusDiv(prev, prev.textContent.length); }
    }
  }
  if(e.key==='ArrowDown' && !e.shiftKey){
    const sel=window.getSelection(); const r=sel.rangeCount?sel.getRangeAt(0):null;
    if(r && getCaretOffset(div,r)>=lineText(div).length){
      const next = neighborLineDiv(el, 1);
      if(next){ e.preventDefault(); focusDiv(next, 0); }
    }
  }
}

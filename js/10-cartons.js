/* =====================================================================
   CARTONS — texte du scénario placé « où l'on veut », avec son propre style
   ---------------------------------------------------------------------
   Un carton est un élément comme les autres (type 'card') : il vit dans
   l'ordre du scénario, s'exporte, se déplace avec sa scène. Son aspect est
   stocké dans el.card — jamais dans le texte — et se règle depuis le
   panneau de droite dès que le curseur est dedans :
     taille (pt) · alignement · largeur · police · gras / italique /
     majuscules · cadre (filets, cadre, double cadre) · espacement ·
     « page entière » (le carton occupe sa propre feuille, centré au milieu).
   Maj+Entrée fait un retour à la ligne à l'intérieur du carton.
===================================================================== */
const CARD_FONTS = {
  mono:'var(--script-font,var(--mono))',
  serif:'Georgia, "Times New Roman", Times, serif',
  sans:'Helvetica, Arial, sans-serif'
};
const CARD_VARS = ['--card-size','--card-align','--card-weight','--card-style','--card-case','--card-font','--card-width','--card-ml','--card-mr','--card-sp'];
function cardDefaults(){
  return { size:22, align:'center', width:100, bold:true, italic:false, caps:true, font:'mono', frame:'none', space:2, full:false };
}
function cardOf(el){ return Object.assign(cardDefaults(), (el && el.card) || {}); }
/* Pose (ou retire) le style d'un carton sur sa ligne. Appelée partout où
   une ligne est fabriquée : éditeur, mesure d'export, longueur des scènes. */
function layoutOf(el){ return Object.assign({ align:null, left:null, right:null }, (el && el.layout) || {}); }
function layoutActive(el){ const l = layoutOf(el); return !!(l.align || isFinite(l.left) && l.left !== null || isFinite(l.right) && l.right !== null); }
function applyLayoutStyle(div, el){
  ['data-lay-a','data-lay-l','data-lay-r'].forEach(a => div.removeAttribute(a));
  ['--lay-a','--lay-l','--lay-r'].forEach(v => div.style.removeProperty(v));
  if(!el || el.type === 'card' || el.type === 'note') return;
  const l = layoutOf(el), st = div.style;
  if(l.align === 'left' || l.align === 'center' || l.align === 'right'){ div.setAttribute('data-lay-a', '1'); st.setProperty('--lay-a', l.align); }
  if(l.left !== null && isFinite(l.left)){ div.setAttribute('data-lay-l', '1'); st.setProperty('--lay-l', Math.max(0, Math.min(14, Number(l.left))) + 'cm'); }
  if(l.right !== null && isFinite(l.right)){ div.setAttribute('data-lay-r', '1'); st.setProperty('--lay-r', 'calc(' + Math.max(0, Math.min(14, Number(l.right))) + 'cm - 3px)'); }
}
function applyCardStyle(div, el){
  applyLayoutStyle(div, el);
  if(el && el.fpg) div.dataset.fpg = el.fpg; else delete div.dataset.fpg;   // page sans numéro (voir js/33-free-pages.js)
  if(!el || el.type !== 'card'){
    CARD_VARS.forEach(n => div.style.removeProperty(n));
    div.style.minHeight = '';
    delete div.dataset.frame; delete div.dataset.full;
    return;
  }
  const c = cardOf(el), st = div.style;
  const w = Math.min(100, Math.max(20, Number(c.width) || 100));
  st.setProperty('--card-size', Math.min(120, Math.max(8, Number(c.size) || 22)) + 'pt');
  st.setProperty('--card-align', c.align === 'left' || c.align === 'right' ? c.align : 'center');
  st.setProperty('--card-weight', c.bold ? '700' : '400');
  st.setProperty('--card-style', c.italic ? 'italic' : 'normal');
  st.setProperty('--card-case', c.caps ? 'uppercase' : 'none');
  st.setProperty('--card-font', CARD_FONTS[c.font] || CARD_FONTS.mono);
  st.setProperty('--card-width', w >= 100 ? 'auto' : w + '%');
  const al = (c.align === 'left' || c.align === 'right') ? c.align : 'center';
  st.setProperty('--card-ml', (w >= 100 || al === 'left') ? '-3px' : 'auto');
  st.setProperty('--card-mr', (w >= 100 || al === 'right') ? '-3px' : 'auto');
  st.setProperty('--card-sp', (Math.max(0, Number(c.space)) * 18) + 'pt');
  if(c.frame && c.frame !== 'none' && !c.full) div.dataset.frame = c.frame; else delete div.dataset.frame;
  if(c.full) div.dataset.full = '1'; else { delete div.dataset.full; div.style.minHeight = ''; }
}
function cardPanelHtml(el){
  const c = cardOf(el), id = el.id;
  const seg = (prop, opts) => opts.map(o =>
    `<button class="btn btn-sm ${String(c[prop]) === String(o[0]) ? 'btn-primary' : ''}" data-act="cardSet" data-id="${id}|${prop}|${o[0]}">${o[1]}</button>`).join('');
  const tog = (prop, label, title) =>
    `<button class="btn btn-sm ${c[prop] ? 'btn-primary' : ''}" data-act="cardSet" data-id="${id}|${prop}|${!c[prop]}" title="${title||''}">${label}</button>`;
  return `<div class="pane-title">${L('Carton','Title card')}</div>
  <div class="panel-block card-panel" data-card-id="${id}">
    <div class="cp-row"><div class="cp-lbl">${L('Taille','Size')} — <span id="cardSizeVal">${c.size}</span> pt</div>
      <input type="range" id="cardSizeRange" min="10" max="96" step="1" value="${c.size}">
      <div class="cp-seg" style="margin-top:6px;">${seg('size',[[14,'S'],[22,'M'],[32,'L'],[48,'XL'],[72,'XXL']])}</div></div>
    <div class="cp-row"><div class="cp-lbl">${L('Position du texte','Text alignment')}</div>
      <div class="cp-seg">${seg('align',[['left',L('Gauche','Left')],['center',L('Centre','Center')],['right',L('Droite','Right')]])}</div></div>
    <div class="cp-row"><div class="cp-lbl">${L('Largeur du bloc','Block width')}</div>
      <div class="cp-seg">${seg('width',[[100,'100 %'],[75,'75 %'],[50,'50 %'],[33,'33 %']])}</div></div>
    <div class="cp-row"><div class="cp-lbl">${L('Police','Font')}</div>
      <div class="cp-seg">${seg('font',[['mono',L('Machine','Typewriter')],['serif','Serif'],['sans','Sans']])}</div></div>
    <div class="cp-row"><div class="cp-lbl">${L('Style','Style')}</div>
      <div class="cp-seg">${tog('bold','<b>B</b>',L('Gras','Bold'))}${tog('italic','<i>I</i>',L('Italique','Italic'))}${tog('caps','AA',L('Majuscules','Capitals'))}</div></div>
    ${c.full ? '' : `<div class="cp-row"><div class="cp-lbl">${L('Cadre','Frame')}</div>
      <div class="cp-seg">${seg('frame',[['none',L('Aucun','None')],['lines',L('Filets','Rules')],['box',L('Cadre','Box')],['double',L('Double','Double')]])}</div></div>`}
    <div class="cp-row"><div class="cp-lbl">${L('Espace autour','Spacing')}</div>
      <div class="cp-seg">${seg('space',[[0,L('Aucun','None')],[1,L('Serré','Tight')],[2,'Normal'],[4,L('Aéré','Airy')]])}</div></div>
    <div class="cp-row"><div class="cp-lbl">${L('Page','Page')}</div>
      <div class="cp-seg">${tog('full',L('Page entière, centré au milieu','Full page, centered'),L('Le carton prend sa propre feuille, centré verticalement.','The card gets its own page, vertically centered.'))}</div></div>
    <p style="font-size:12px;color:var(--ink-soft);line-height:1.5;margin:0 0 10px;">${L('Maj+Entrée : retour à la ligne dans le carton.','Shift+Enter: line break inside the card.')}</p>
    <button class="btn btn-sm btn-danger" data-act="deleteElement" data-id="${id}">${L('Supprimer ce carton','Delete this card')}</button>
  </div>`;
}
function bindCardPanel(el){
  const r = document.getElementById('cardSizeRange'); if(!r) return;
  let undone = false;
  r.addEventListener('input', ()=>{
    if(!undone){ pushUndo(); undone = true; }
    el.card = cardOf(el); el.card.size = Number(r.value);
    const v = document.getElementById('cardSizeVal'); if(v) v.textContent = r.value;
    const div = document.querySelector('#page [data-id="' + el.id + '"]');
    if(div) applyCardStyle(div, el);
    schedulePaginate(); scheduleAutosave();
  });
  r.addEventListener('change', ()=>{ undone = false; showContextPanel(el); });
}
function cardSet(raw){
  const parts = String(raw).split('|');
  const el = findEl(parts[0]); if(!el || el.type !== 'card') return;
  const prop = parts[1], val = parts[2];
  pushUndo();
  el.card = cardOf(el);
  el.card[prop] = (prop === 'size' || prop === 'width' || prop === 'space') ? Number(val)
                : val === 'true' ? true : val === 'false' ? false : val;
  const div = document.querySelector('#page [data-id="' + el.id + '"]');
  if(div) applyCardStyle(div, el);
  repaginateNow(); scheduleAutosave();
  showContextPanel(el);
}
/* ---- Mise en page libre (v48) ---- */
function layoutPanelHtml(el){
  const l = layoutOf(el), id = el.id;
  const num = v => (v === null || !isFinite(v)) ? null : Number(v);
  const lv = num(l.left), rv = num(l.right);
  const al = (val, label) => `<button class="btn btn-sm ${(l.align || '') === val ? 'btn-primary' : ''}" data-act="layoutSet" data-id="${id}|align|${val || 'default'}">${label}</button>`;
  const pre = (name, label) => `<button class="btn btn-sm" data-act="layoutPreset" data-id="${id}|${name}">${label}</button>`;
  return `<div class="pane-title">${L('Aligner la ligne','Align the line')}</div>
  <div class="panel-block card-panel" data-layout-id="${id}">
    <p style="font-size:12px;color:var(--ink-soft);line-height:1.5;margin:0 0 10px;">${L('S\u2019applique à la ligne en cours, quel que soit son type. Clique une autre ligne : le panneau la suit.','Applies to the current line, whatever its type. Click another line: the panel follows it.')}</p>
    <div class="cp-row"><div class="cp-lbl">${L('Alignement du texte','Text alignment')}</div>
      <div class="cp-seg">${al('', L('Par défaut','Default'))}${al('left', L('Gauche','Left'))}${al('center', L('Centre','Center'))}${al('right', L('Droite','Right'))}</div></div>
    <div class="cp-row"><div class="cp-lbl">${L('Retrait gauche','Left indent')} — <span id="layLeftVal">${lv === null ? L('défaut','default') : lv.toFixed(1) + ' cm'}</span></div>
      <input type="range" id="layLeftRange" min="0" max="12" step="0.1" value="${lv === null ? 0 : lv}">
      <div class="cp-seg" style="margin-top:6px;"><button class="btn btn-sm" data-act="layoutSet" data-id="${id}|left|default">${L('Défaut','Default')}</button></div></div>
    <div class="cp-row"><div class="cp-lbl">${L('Retrait droit','Right indent')} — <span id="layRightVal">${rv === null ? L('défaut','default') : rv.toFixed(1) + ' cm'}</span></div>
      <input type="range" id="layRightRange" min="0" max="12" step="0.1" value="${rv === null ? 0 : rv}">
      <div class="cp-seg" style="margin-top:6px;"><button class="btn btn-sm" data-act="layoutSet" data-id="${id}|right|default">${L('Défaut','Default')}</button></div></div>
    <div class="cp-row"><div class="cp-lbl">${L('Raccourcis','Presets')}</div>
      <div class="cp-seg">${pre('center', L('Centré étroit','Narrow centered'))}${pre('right', L('Bloc à droite','Right block'))}${pre('indent', L('Retrait 2 cm','2 cm indent'))}${pre('full', L('Pleine largeur','Full width'))}</div></div>
    <p style="font-size:12px;color:var(--ink-soft);line-height:1.5;margin:0 0 10px;">${L('0 cm = comme une ligne d\u2019action. Les retraits se comptent depuis les bords de la colonne de texte et suivent l\u2019export PDF et l\u2019impression.','0 cm = like an action line. Indents are measured from the text column edges and carry through to PDF export and printing.')}</p>
    <div class="cp-seg"><button class="btn btn-sm" data-act="layoutReset" data-id="${id}">${L('Rétablir la mise en page de cette ligne','Reset this line')}</button>
    <button class="btn btn-sm btn-ghost" data-act="layoutClose">${L('Fermer','Close')}</button></div>
  </div>`;
}
function showLayoutPanel(el){
  const side = document.getElementById('sidePane'); if(!side) return;
  side.dataset.mode = 'layout';
  side.classList.remove('hidden');
  side.innerHTML = layoutPanelHtml(el);
  bindLayoutPanel(el);
}
function layoutTarget(){
  const line = focusedLine();
  const id = (line && line.dataset.id) || lastFocusedLineId;
  const el = id ? findEl(id) : null;
  return (el && el.type !== 'card' && el.type !== 'note') ? el : null;
}
function openLayout(){
  if(!S.project) return;
  const side = document.getElementById('sidePane');
  if(side && side.dataset.mode === 'layout'){ layoutClose(); return; }     // 2e clic = fermer
  const el = layoutTarget();
  if(!el){ toast(L('Clique d\u2019abord dans une ligne du scénario (hors carton et note).','Click inside a screenplay line first (not a card or note).')); return; }
  showLayoutPanel(el);
}
function layoutClose(){
  const side = document.getElementById('sidePane'); if(!side) return;
  side.dataset.mode = ''; side.classList.add('hidden'); side.innerHTML = '';
  if(S.navOpen) renderNavPane();
}
function layoutApply(el){
  const l = layoutOf(el);
  if(!l.align && (l.left === null || !isFinite(l.left)) && (l.right === null || !isFinite(l.right))) delete el.layout;
  else el.layout = { align:l.align || null, left:(l.left === null || !isFinite(l.left)) ? null : Number(l.left), right:(l.right === null || !isFinite(l.right)) ? null : Number(l.right) };
  const div = document.querySelector('#page [data-id="' + el.id + '"]');
  if(div) applyCardStyle(div, el);
}
function layoutSet(raw){
  const parts = String(raw).split('|');
  const el = findEl(parts[0]); if(!el || el.type === 'card' || el.type === 'note') return;
  const prop = parts[1], val = parts[2];
  pushUndo();
  const l = layoutOf(el);
  if(prop === 'align') l.align = (val === 'left' || val === 'center' || val === 'right') ? val : null;
  else if(prop === 'left' || prop === 'right') l[prop] = (val === 'default') ? null : Math.max(0, Math.min(12, Number(val) || 0));
  el.layout = l; layoutApply(el);
  repaginateNow(); scheduleAutosave(); showLayoutPanel(el);
}
function layoutPreset(raw){
  const parts = String(raw).split('|');
  const el = findEl(parts[0]); if(!el || el.type === 'card' || el.type === 'note') return;
  pushUndo();
  const P = { center:{ align:'center', left:3.5, right:3.5 }, right:{ align:'right', left:6, right:0 }, indent:{ align:null, left:2, right:null }, full:{ align:null, left:null, right:null } };
  el.layout = Object.assign({ align:null, left:null, right:null }, P[parts[1]] || P.full);
  layoutApply(el);
  repaginateNow(); scheduleAutosave(); showLayoutPanel(el);
}
function layoutReset(id){
  const el = findEl(id); if(!el) return;
  pushUndo(); delete el.layout; layoutApply(el);
  repaginateNow(); scheduleAutosave(); showLayoutPanel(el);
}
function bindLayoutPanel(el){
  const bind = (rid, vid, prop) => {
    const r = document.getElementById(rid); if(!r) return;
    let undone = false;
    r.addEventListener('input', ()=>{
      if(!undone){ pushUndo(); undone = true; }
      const l = layoutOf(el); l[prop] = Number(r.value); el.layout = l;
      const v = document.getElementById(vid); if(v) v.textContent = Number(r.value).toFixed(1) + ' cm';
      layoutApply(el); schedulePaginate(); scheduleAutosave();
    });
    r.addEventListener('change', ()=>{ undone = false; showLayoutPanel(el); });
  };
  bind('layLeftRange', 'layLeftVal', 'left');
  bind('layRightRange', 'layRightVal', 'right');
}
function insertCard(){
  if(!S.project) return;
  const line = focusedLine();
  const id = (line && line.dataset.id) || lastFocusedLineId;
  const els = S.project.elements;
  const idx = id ? findIdx(id) : -1;
  pushUndo();
  if(idx >= 0 && !(els[idx].text || '').trim() && els[idx].type !== 'scene'){
    // Ligne vide : on la transforme simplement en carton.
    const el = els[idx];
    el.type = 'card'; if(!el.card) el.card = cardDefaults();
    rebuildEditorAt(el.id, 0);
    const d = document.querySelector('#page [data-id="' + el.id + '"]');
    showContextPanel(el); if(d) focusDiv(d, 0);
    scheduleAutosave(); return;
  }
  const newEl = newElement('card', ''); newEl.card = cardDefaults();
  let at = idx < 0 ? els.length : idx + 1;
  if(idx >= 0){ const d = document.querySelector('#page [data-id="' + id + '"]');
    if(inDualWrap(d)){ const pair = dualPairRange(idx); if(pair) at = pair.end; } }
  els.splice(at, 0, newEl);
  rebuildEditorAt(newEl.id, 0);
  const nd = document.querySelector('#page [data-id="' + newEl.id + '"]');
  showContextPanel(newEl); if(nd) focusDiv(nd, 0);
  scheduleAutosave();
}

function insertScene(){
  pushUndo();
  const focused = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.line') : null;
  if(focused){
    const el = findEl(focused.dataset.id);
    if(el && !el.text.trim()){
      // current line is empty: just turn it into a scene heading, nothing new to insert
      el.type = 'scene'; refreshLineDiv(focused, el); renumberScenes(); showContextPanel(el);
      repaginateNow(); focusDiv(focused, 0); scheduleAutosave(); return;
    }
    if(el){
      const idx = findIdx(el.id);
      const newEl = newElement('scene', '');
      S.project.elements.splice(idx+1, 0, newEl);
      const newDiv = buildLineDiv(newEl, sceneNumbers());
      focused.after(newDiv);
      renumberScenes(); repaginateNow(); focusDiv(newDiv, 0); showContextPanel(newEl);
      scheduleAutosave();
      return;
    }
  }
  // nothing focused: just append at the end
  const newEl = newElement('scene', '');
  S.project.elements.push(newEl);
  const page = document.getElementById('page');
  if(page){
    const newDiv = buildLineDiv(newEl, sceneNumbers());
    page.appendChild(newDiv);
    renumberScenes(); repaginateNow(); focusDiv(newDiv, 0); showContextPanel(newEl);
  }
  scheduleAutosave();
}
function onLineFocus(e){
  // Changement de ligne : le menu ouvert sur la précédente n'a plus lieu d'être.
  if(S.extMenu){
    const d = e.target.closest && e.target.closest('.line');
    if(!d || d.dataset.id !== S.extMenu.id) closeExtMenu();
  }
  const div = e.target.closest('.line'); if(!div) return;
  const el = findEl(div.dataset.id); if(!el) return;
  hideAutocomplete();
  // On vient de quitter une autre ligne : si c'était une ligne Personnage,
  // elle a été ignorée par refreshContdMarks() tant qu'elle avait le focus
  // (voir le correctif juste au-dessus de cette fonction) — on rattrape sa
  // mention maintenant qu'elle ne l'a plus.
  if(lastFocusedLineId && lastFocusedLineId !== div.dataset.id) refreshContdMarks();
  lastFocusedLineId = div.dataset.id;
  if(S.focusMode){
    const prev = document.querySelector('#page .line.line-active');
    if(prev && prev!==div) prev.classList.remove('line-active');
    div.classList.add('line-active');
  }
  // La ligne vient d'obtenir le focus (frappe, flèches, clic) : on la garde
  // sous les yeux. Appelé après repaginateNow() partout où l'un et l'autre
  // se combinent, la position lue ici est donc déjà la position finale —
  // un seul déplacement de la vue, jamais deux qui se contredisent.
  if(!S.pagination._quickFocus){ ensureLineVisible(div); updatePageIndicator(); }   // focus rapide : la pagination de l'image s'en charge
  showContextPanel(el);
}
/* Fait défiler #centerPane, sans effet de bord ni animation (le déplacement
   doit être instantané pour suivre la frappe sans donner d'à-coup), pour
   que la ligne reste confortablement dans la zone visible. */
function ensureLineVisible(div){
  ensureRectVisible(div ? div.getBoundingClientRect() : null);
}
/* Version précise : suit la position RÉELLE du curseur, pas seulement le
   bloc qui le contient. Un bloc peut retourner à la ligne plusieurs fois
   (une réplique qui s'allonge, une action longue) sans jamais changer de
   focus — dans ce cas ensureLineVisible seule ne voit rien bouger, alors
   que le curseur, lui, continue de descendre à l'intérieur du bloc. C'est
   ce qui laissait le curseur sortir de l'écran en pleine frappe. */
/* Premier rectangle réellement exploitable d'une liste (Chrome en renvoie
   régulièrement de dégénérés, 0×0 en (0,0), qu'il ne faut surtout pas
   prendre pour la position du curseur : on croirait le curseur en haut à
   gauche de l'écran et la vue sauterait). */
function usableRect(rects){
  for(let i = 0; i < rects.length; i++){
    const r = rects[i];
    if(r.height > 0 || r.width > 0) return r;
  }
  return null;
}
function caretRect(){
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(true);
  let r = usableRect(range.getClientRects());
  if(r) return r;

  // CORRECTIF. Un point de collapse en tout début de ligne ne renvoie aucun
  // rect utilisable dans Chrome — autrement dit après CHAQUE appui sur
  // Entrée, le cas le plus fréquent qui soit. L'ancien code ne détectait
  // alors rien et ne faisait rien suivre. On élargit le range d'un seul
  // caractère, en arrière puis en avant : cela donne toujours un rectangle
  // sur la bonne ligne, sans jamais toucher au DOM ni à la sélection de
  // l'utilisateur (c'est ce dernier point qui cassait les sélections
  // multi-lignes dans l'approche « insertion d'un repère »).
  const node = range.startContainer, off = range.startOffset;
  if(node.nodeType === 3){
    if(off > 0){
      const p = range.cloneRange(); p.setStart(node, off - 1); p.setEnd(node, off);
      r = usableRect(p.getClientRects()); if(r) return r;
    }
    if(off < node.textContent.length){
      const n = range.cloneRange(); n.setStart(node, off); n.setEnd(node, off + 1);
      r = usableRect(n.getClientRects()); if(r) return r;
    }
  }
  // Ligne entièrement vide : le bloc lui-même fait office de repère.
  const host = node.nodeType === 1 ? node : node.parentNode;
  const line = host && host.closest ? host.closest('.line') : null;
  if(!line) return null;
  const lr = line.getBoundingClientRect();
  return (lr.width || lr.height) ? lr : null;
}
function ensureRectVisible(r){
  const pane = document.getElementById('centerPane');
  if(!pane || !r || (!r.width && !r.height && !r.top && !r.bottom)) return;
  const paneRect = pane.getBoundingClientRect();
  if(S.typewriterMode){
    // Le curseur reste toujours au centre vertical de la fenêtre : on
    // défile toujours d'exactement l'écart entre son centre et celui de
    // la zone visible, jamais seulement quand il sort d'une marge.
    pane.scrollTop += (r.top + r.bottom)/2 - (paneRect.top + paneRect.height/2);
    return;
  }
  const margin = 96;
  if(r.top < paneRect.top + margin){
    pane.scrollTop -= (paneRect.top + margin) - r.top;
  } else if(r.bottom > paneRect.bottom - margin){
    pane.scrollTop += r.bottom - (paneRect.bottom - margin);
  }
}
function ensureCaretVisible(){
  ensureRectVisible(caretRect());
}
/* v84 : cliquer sur une note n'ouvre plus de panneau à droite (il ne servait qu'à supprimer la note et prenait toute la place).
   À la place, une petite corbeille apparaît dans l'en-tête de la carte de la note, tant qu'on la modifie (comme les bulles de commentaire de WriterDuet). */
let noteBarEl = null, noteBarFor = null;
function hideNoteBar(){ if(noteBarEl) noteBarEl.style.display = 'none'; noteBarFor = null; }
function placeNoteBar(){
  if(!noteBarEl || !noteBarFor) return;
  const d = document.querySelector('#page [data-id="' + noteBarFor + '"]');
  if(!d || document.activeElement !== d){ hideNoteBar(); return; }
  const r = d.getBoundingClientRect();
  noteBarEl.style.display = 'inline-flex';
  noteBarEl.style.top = Math.round(r.top + 5) + 'px';
  noteBarEl.style.left = Math.round(r.right - noteBarEl.offsetWidth - 8) + 'px';
}
function showNoteBar(el){
  if(!noteBarEl){
    noteBarEl = document.createElement('button');
    noteBarEl.type = 'button'; noteBarEl.className = 'note-bar'; noteBarEl.setAttribute('data-act', 'deleteElement');
    noteBarEl.addEventListener('mousedown', e=> e.preventDefault());
    noteBarEl.addEventListener('click', ()=> setTimeout(hideNoteBar, 0));
    document.body.appendChild(noteBarEl);
    document.addEventListener('focusout', e=>{ if(e.target && e.target.closest && e.target.closest('.line--note')) hideNoteBar(); });
    document.addEventListener('scroll', ()=> requestAnimationFrame(placeNoteBar), true);
    window.addEventListener('resize', ()=> requestAnimationFrame(placeNoteBar));
  }
  noteBarEl.setAttribute('data-id', el.id);
  noteBarEl.title = L('Supprimer cette note','Delete this note');
  noteBarEl.innerHTML = icon('trash') + '<span>' + L('Supprimer','Delete') + '</span>';
  noteBarFor = el.id;
  placeNoteBar();
}
function showContextPanel(el){
  const side = document.getElementById('sidePane');
  if(el.type === 'note'){ showNoteBar(el); if(side && side.dataset.mode === 'layout') return; } else hideNoteBar();
  if(side && side.dataset.mode === 'layout' && el.type !== 'card' && el.type !== 'note'){ side.innerHTML = layoutPanelHtml(el); bindLayoutPanel(el); return; }   // v48 : le panneau « Aligner » suit la ligne active
  // Note: scene headings used to pop this panel open on focus (outline,
  // tags, duplicate/delete). It sat right next to — and on narrow windows
  // on top of — the text being typed, making the heading itself hard to
  // edit. Outline & tags editing and duplicate/delete are all still
  // available, just from the dedicated "Outline" and "Cartes" tabs, so
  // writing a scene heading is no longer interrupted by anything.
  if(el.type==='card'){
    side.dataset.mode = 'card';
    side.classList.remove('hidden');
    side.innerHTML = (el.fpg ? fpPanelHtml(el) : '') + cardPanelHtml(el);
    bindCardPanel(el);
  } else if(el.fpg && !fpPanelOff){
    side.dataset.mode = 'freepage';
    side.classList.remove('hidden');
    side.innerHTML = fpPanelHtml(el);
  } else if(S.navOpen){
    // On sort d'une note : le navigateur reprend sa place. S'il est déjà
    // affiché, on se contente de déplacer le surlignage (reconstruire la
    // liste à chaque changement de ligne serait du gaspillage pur).
    if(navVisible()) navSyncActive();
    else { side.dataset.mode = ''; renderNavPane(); }
  } else {
    side.dataset.mode = ''; side.classList.add('hidden'); side.innerHTML='';
  }
}
function deleteElement(id){
  const idx = findIdx(id); if(idx<0) return;
  pushUndo(); S.project.elements.splice(idx,1); scheduleAutosave(); renderEditorTab();
}
function editOutline(id, e){ sceneMeta(id).outline = e.target.value; scheduleAutosave(); }
function editSceneTags(id, e){
  const tags = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
  sceneMeta(id).tags = tags; scheduleAutosave();
}


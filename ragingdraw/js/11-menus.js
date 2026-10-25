/* =====================================================================
   RAGING DRAW — MENUS
   Clic droit sur l'affiche ou sur un calque : toutes les actions possibles
   sur ce qu'on vise. Menus « Aligner » et « ⋮ » de la barre du haut,
   comme dans Raging Page.
===================================================================== */
const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || '');
function kb(s){ return IS_MAC ? s.replace(/Ctrl\+/g, '⌘').replace(/Maj\+|Shift\+/g, '⇧').replace(/Alt\+/g, '⌥') : s.replace(/Maj\+/g, L('Maj+','Shift+')); }

/* ---------- Composant menu ---------- */
let _menu = null;
function closeMenu(){
  if(!_menu) return;
  const m = _menu; _menu = null;
  m.el.remove();
  document.removeEventListener('mousedown', m.away, true);
  document.removeEventListener('keydown', m.key, true);
  window.removeEventListener('resize', closeMenu);
  window.removeEventListener('blur', closeMenu);
}
function menuItemsHtml(items){
  return items.map((it, i) => {
    if(!it) return '';
    if(it === 'sep') return '<div class="cm-sep"></div>';
    if(it.head) return `<div class="cm-head">${esc(it.head)}</div>`;
    if(it.row) return `<div class="cm-row">${it.label ? `<span class="cm-row-l">${esc(it.label)}</span>` : ''}${it.row.map((b, j) => `<button class="cm-ib" data-mi="${i}.${j}" title="${esc(b.title)}" ${b.disabled?'disabled':''}>${icon(b.icon)}</button>`).join('')}</div>`;
    return `<button class="cm-it ${it.danger?'danger':''} ${it.checked!=null?'chk':''}" data-mi="${i}" ${it.disabled?'disabled':''} role="menuitem">
      <span class="cm-ic">${it.checked != null ? (it.checked ? icon('check') : '') : icon(it.icon || 'more')}</span>
      <span class="cm-l">${esc(it.label)}</span>${it.kbd ? `<span class="cm-k">${esc(kb(it.kbd))}</span>` : ''}</button>`;
  }).join('');
}
/* place : {x, y} (au curseur) ou {anchor: élément} (sous un bouton) */
function openMenu(place, items){
  closeMenu(); closePop();
  const el = document.createElement('div');
  el.className = 'cmenu'; el.setAttribute('role', 'menu');
  el.innerHTML = menuItemsHtml(items);
  document.body.appendChild(el);
  const w = el.offsetWidth, h = el.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
  let x, y;
  if(place.anchor){
    const r = place.anchor.getBoundingClientRect();
    x = place.alignRight ? r.right - w : r.left; y = r.bottom + 6;
  }else{ x = place.x + 2; y = place.y + 2; }
  if(x + w > vw - 8) x = Math.max(8, (place.anchor ? vw - w - 8 : place.x - w - 2));
  if(y + h > vh - 8) y = Math.max(8, place.anchor ? vh - h - 8 : place.y - h - 2);
  el.style.left = Math.max(8, x) + 'px'; el.style.top = Math.max(8, y) + 'px';
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-mi]'); if(!b || b.disabled) return;
    const [i, j] = b.dataset.mi.split('.').map(Number);
    const it = items[i], fn = j != null && !isNaN(j) ? it.row[j].act : it.act;
    closeMenu();
    if(fn) fn();
  });
  el.addEventListener('contextmenu', e => e.preventDefault());
  const away = e => { if(!el.contains(e.target)) closeMenu(); };
  const key = e => {
    if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); closeMenu(); return; }
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault(); e.stopPropagation();
      const bs = [...el.querySelectorAll('button:not([disabled])')];
      const k = bs.indexOf(document.activeElement);
      const n = e.key === 'ArrowDown' ? (k + 1) % bs.length : (k <= 0 ? bs.length - 1 : k - 1);
      if(bs[n]) bs[n].focus();
    }
  };
  setTimeout(() => { document.addEventListener('mousedown', away, true); }, 0);
  document.addEventListener('keydown', key, true);
  window.addEventListener('resize', closeMenu);
  window.addEventListener('blur', closeMenu);
  _menu = {el, away, key};
  return el;
}

/* ---------- Copier / coller le style ---------- */
const STYLE_KEYS = {
  text:['font','weight','italic','upper','align','lineHeight','letterSpacing','fill','stroke','glow','shadow','opacity','blend'],
  shape:['fill','stroke','shadow','opacity','blend','radius'],
  path:['fill','stroke','shadow','opacity','blend'],
  image:['filters','tint','fade','radius','ellipse','stroke','shadow','opacity','blend'],
  draw:['shadow','opacity','blend']
};
function copyStyle(o){
  const st = {};
  (STYLE_KEYS[o.type] || []).forEach(k => { if(o[k] !== undefined) st[k] = deepClone(o[k]); });
  S.styleClip = {type:o.type, st};
  toast(L('Style copié : colle-le sur un autre élément.','Style copied: paste it on another element.'));
}
function pasteStyle(){
  const c = S.styleClip; if(!c) return;
  let n = 0;
  selObjs().forEach(o => {
    const keys = STYLE_KEYS[o.type] || [];
    Object.keys(c.st).forEach(k => { if(keys.includes(k)){ o[k] = deepClone(c.st[k]); n++; } });
    if(o.type === 'text'){ ensureFont(o); fitTextHeight(o); }
    touch(o);
  });
  if(n){ commit(); renderSide(); requestRender(); }
}
async function renameObj(o){
  const v = await rdPrompt(L('Renommer le calque','Rename layer'), typeLabel(o));
  if(v != null){ o.name = v.trim(); commit(); renderSide(); }
}

/* ---------- Menu d'un ou plusieurs éléments ---------- */
function alignRowItem(label){
  const multi = selObjs().length > 1;
  return {label, row:[
    {icon:'alignL', title:L('Aligner à gauche','Align left'), act:() => alignSel('l')},
    {icon:'alignCH', title:L('Centrer horizontalement','Centre horizontally'), act:() => alignSel('ch')},
    {icon:'alignR', title:L('Aligner à droite','Align right'), act:() => alignSel('r')},
    {icon:'alignT', title:L('Aligner en haut','Align top'), act:() => alignSel('t')},
    {icon:'alignCV', title:L('Centrer verticalement','Centre vertically'), act:() => alignSel('cv')},
    {icon:'alignB', title:L('Aligner en bas','Align bottom'), act:() => alignSel('b')}
  ].concat(multi ? [
    {icon:'distH', title:L('Répartir horizontalement (3 ou plus)','Distribute horizontally (3 or more)'), act:() => distributeSel('h'), disabled:selObjs().length < 3},
    {icon:'distV', title:L('Répartir verticalement (3 ou plus)','Distribute vertically (3 or more)'), act:() => distributeSel('v'), disabled:selObjs().length < 3}
  ] : [])};
}
function objectMenuItems(){
  const sel = selObjs(), one = sel.length === 1 ? sel[0] : null;
  const allLocked = sel.every(o => o.locked), anyHidden = sel.some(o => !o.visible);
  const items = [];
  if(one){
    items.push({head:typeLabel(one)});
    if(one.type === 'text') items.push({label:L('Modifier le texte','Edit text'), icon:'typeT', kbd:L('Entrée','Enter'), act:() => startTextEdit(one), disabled:one.locked});
    if(one.type === 'image'){
      items.push({label:one.asset ? L('Remplacer l’image…','Replace image…') : L('Choisir une image…','Choose an image…'), icon:'upload', act:() => pickImageFile(one)});
      if(one.asset) items.push({label:L('Remplir l’affiche','Fill poster'), icon:'fit', act:() => { coverDoc(one, false); commit(); syncFields(); requestRender(); }, disabled:one.locked});
    }
    if(one.type === 'draw') items.push({label:L('Continuer à dessiner','Keep drawing'), icon:'brush', kbd:'B', act:() => setTool('brush'), disabled:one.locked});
    if(items.length > 1) items.push('sep');
  }else items.push({head:sel.length + ' ' + L('éléments','elements')});
  items.push(
    {label:L('Couper','Cut'), icon:'crop', kbd:'Ctrl+X', act:() => { copySel(); deleteSel(); }, disabled:allLocked},
    {label:L('Copier','Copy'), icon:'copy', kbd:'Ctrl+C', act:() => { copySel(); toast(L('Copié','Copied')); }},
    {label:L('Coller','Paste'), icon:'file', kbd:'Ctrl+V', act:() => pasteInternal(), disabled:!S.clipboard},
    {label:L('Dupliquer','Duplicate'), icon:'copy', kbd:'Ctrl+D', act:() => duplicateSel()},
    'sep');
  if(one) items.push({label:L('Copier le style','Copy style'), icon:'palette', act:() => copyStyle(one)});
  items.push({label:L('Coller le style','Paste style'), icon:'drop', act:() => pasteStyle(), disabled:!S.styleClip || allLocked});
  items.push('sep',
    alignRowItem(sel.length > 1 ? L('Aligner','Align') : L('Sur l’affiche','On poster')),
    {label:L('Premier plan','Bring to front'), icon:'top', kbd:'Ctrl+Maj+]', act:() => arrange('front')},
    {label:L('Avancer','Bring forward'), icon:'up', kbd:'Ctrl+]', act:() => arrange('up')},
    {label:L('Reculer','Send backward'), icon:'down', kbd:'Ctrl+[', act:() => arrange('down')},
    {label:L('Arrière-plan','Send to back'), icon:'bottom', kbd:'Ctrl+Maj+[', act:() => arrange('back')},
    'sep',
    {label:L('Retourner horizontalement','Flip horizontally'), icon:'flipH', act:() => ACT.flip({dataset:{id:'x'}}), disabled:allLocked},
    {label:L('Retourner verticalement','Flip vertically'), icon:'flipV', act:() => ACT.flip({dataset:{id:'y'}}), disabled:allLocked},
    {label:allLocked ? L('Déverrouiller','Unlock') : L('Verrouiller','Lock'), icon:allLocked ? 'unlock' : 'lock', act:() => { sel.forEach(o => o.locked = !allLocked); commit(); renderSide(); requestRender(); }},
    {label:anyHidden ? L('Afficher','Show') : L('Masquer','Hide'), icon:anyHidden ? 'eye' : 'eyeoff', act:() => { sel.forEach(o => o.visible = anyHidden); commit(); renderSide(); requestRender(); }});
  if(one) items.push({label:L('Renommer…','Rename…'), icon:'pen', act:() => renameObj(one)});
  if(sel.some(o => o.mask && o.mask.strokes && o.mask.strokes.length)) items.push({label:L('Restaurer ce qui a été gommé','Restore what was erased'), icon:'undo', act:() => ACT.clearMask()});
  items.push('sep', {label:L('Supprimer','Delete'), icon:'trash', kbd:L('Suppr','Del'), danger:true, act:() => deleteSel(), disabled:allLocked});
  return items;
}
/* ---------- Menu d'une zone vide ---------- */
function canvasMenuItems(p){
  const W = S.doc.w, H = S.doc.h;
  return [
    {label:L('Coller','Paste'), icon:'file', kbd:'Ctrl+V', act:() => pasteInternal(), disabled:!S.clipboard},
    {label:L('Tout sélectionner','Select all'), icon:'group', kbd:'Ctrl+A', act:() => setSel(S.doc.objects.filter(o => o.visible && !o.locked).map(o => o.id)), disabled:!S.doc.objects.length},
    'sep',
    {label:L('Ajouter un texte ici','Add a text here'), icon:'typeT', kbd:'T', act:() => addTextAt(p.x, p.y)},
    {label:L('Importer une image…','Import an image…'), icon:'image', kbd:'I', act:() => pickImageFile(null)},
    {label:L('Dessiner','Draw'), icon:'brush', kbd:'B', act:() => setTool('brush')},
    'sep',
    {label:L('Fond et ambiance','Background & mood'), icon:'bg', act:() => ACT.docSettings()},
    {label:L('Format de l’affiche…','Poster size…'), icon:'ratio', act:() => openFormat()},
    {label:L('Modèles','Templates'), icon:'templates', act:() => { S.flyout = 'templates'; renderFlyout(); }},
    'sep',
    {label:L('Magnétisme','Snapping'), checked:S.snap, act:() => { S.snap = !S.snap; syncFields(); }},
    {label:L('Grille des tiers','Rule-of-thirds grid'), checked:S.grid, act:() => { S.grid = !S.grid; syncFields(); requestRender(); }},
    {label:L('Marges de sécurité','Safe margins'), checked:S.safe, act:() => { S.safe = !S.safe; syncFields(); requestRender(); }},
    'sep',
    {label:L('Ajuster à l’écran','Fit to screen'), icon:'fit', kbd:'Ctrl+0', act:() => fitView()},
    {label:L('Taille réelle','Actual size'), icon:'zoomIn', kbd:'Ctrl+1', act:() => zoomAt(1)}
  ];
}
function addTextAt(x, y){
  const u = Math.min(S.doc.w, S.doc.h);
  const o = mkText(L('Ton texte','Your text'), x, y, Math.min(S.doc.w*.6, 900), {font:'Bebas Neue', size:Math.round(u*.08)});
  fitTextHeight(o);
  insertObj(o, S.doc.objects.length); setTool('select'); setSel([o.id]); commit();
  startTextEdit(o, true);
}
function onCanvasContextMenu(e){
  e.preventDefault();
  if(S.drag) return;
  if(S.editingId) endTextEdit();
  if(S.tool !== 'select' && S.tool !== 'hand') setTool('select');
  const p = screenToDoc(e.clientX, e.clientY);
  const hit = pickAt(p.x, p.y, null, true);
  if(hit){
    if(!S.sel.includes(hit.id)) setSel([hit.id]);
  }else{
    const sel = selObjs(), b = sel.length > 1 ? unionBox(sel) : null;
    if(!(b && p.x >= b.x1 && p.x <= b.x2 && p.y >= b.y1 && p.y <= b.y2)) setSel([]);
  }
  requestRender();
  openMenu({x:e.clientX, y:e.clientY}, S.sel.length ? objectMenuItems() : canvasMenuItems(p));
}
/* clic droit sur un calque de la liste */
document.addEventListener('contextmenu', e => {
  const row = e.target.closest && e.target.closest('#side .lr');
  if(!row || S.view !== 'editor') return;
  e.preventDefault();
  if(!S.sel.includes(row.dataset.lid)) setSel([row.dataset.lid], true);
  renderLayersIfOpen();
  openMenu({x:e.clientX, y:e.clientY}, objectMenuItems());
});

/* ---------- Barre du haut ---------- */
ACT.tbAddText = () => addTextAt(S.doc.w/2, S.doc.h/2);
ACT.tbAlignMenu = el => {
  const sel = selObjs();
  if(!sel.length){
    openMenu({anchor:el}, [{head:L('Aligner','Align')}, {label:L('Sélectionne d’abord un ou plusieurs éléments.','Select one or more elements first.'), icon:'cursor', disabled:true}]);
    return;
  }
  const multi = sel.length > 1;
  openMenu({anchor:el}, [
    {head:multi ? L('Entre les éléments sélectionnés','Between the selected elements') : L('Sur l’affiche','On the poster')},
    {label:L('À gauche','Left'), icon:'alignL', act:() => alignSel('l')},
    {label:L('Au centre (horizontal)','Centre (horizontal)'), icon:'alignCH', act:() => alignSel('ch')},
    {label:L('À droite','Right'), icon:'alignR', act:() => alignSel('r')},
    'sep',
    {label:L('En haut','Top'), icon:'alignT', act:() => alignSel('t')},
    {label:L('Au milieu (vertical)','Middle (vertical)'), icon:'alignCV', act:() => alignSel('cv')},
    {label:L('En bas','Bottom'), icon:'alignB', act:() => alignSel('b')},
    'sep',
    {label:L('Centrer sur l’affiche','Centre on the poster'), icon:'fit', act:() => { const s0 = S.sel.slice(); centerOnPoster(); setSel(s0); }}
  ].concat(multi ? ['sep',
    {label:L('Répartir horizontalement','Distribute horizontally'), icon:'distH', act:() => distributeSel('h'), disabled:sel.length < 3},
    {label:L('Répartir verticalement','Distribute vertically'), icon:'distV', act:() => distributeSel('v'), disabled:sel.length < 3}] : []));
};
function centerOnPoster(){
  const sel = selObjs().filter(o => !o.locked); if(!sel.length) return;
  const b = unionBox(sel), dx = S.doc.w/2 - (b.x1 + b.x2)/2, dy = S.doc.h/2 - (b.y1 + b.y2)/2;
  sel.forEach(o => { o.x += dx; o.y += dy; });
  commit(); syncFields(); requestRender();
}
ACT.tbMoreMenu = el => {
  const items = [
    {label:L('Dupliquer cette affiche','Duplicate this poster'), icon:'copy', act:() => duplicateCurrentPoster()},
    {label:L('Format de l’affiche…','Poster size…'), icon:'ratio', act:() => openFormat()},
    {label:L('Fond et ambiance','Background & mood'), icon:'bg', act:() => ACT.docSettings()},
    'sep',
    {label:L('Magnétisme','Snapping'), checked:S.snap, act:() => { S.snap = !S.snap; syncFields(); }},
    {label:L('Grille des tiers','Rule-of-thirds grid'), checked:S.grid, act:() => { S.grid = !S.grid; syncFields(); requestRender(); }},
    {label:L('Marges de sécurité','Safe margins'), checked:S.safe, act:() => { S.safe = !S.safe; syncFields(); requestRender(); }},
    'sep'
  ].concat(typeof driveMenuItems === 'function' ? driveMenuItems() : [], [
    'sep',
    {label:L('Enregistrer le projet (.rdraw)','Save the project (.rdraw)'), icon:'save', act:() => saveProjectFile(S.doc)},
    {label:L('Raccourcis et aide','Shortcuts & help'), icon:'keyboard', act:() => openHelp()},
    {label:L('Guide des outils Raging','Raging tools guide'), icon:'read', act:() => { saveDoc().then(() => { location.href = '../guide.html?from=draw'; }); }}
  ]);
  openMenu({anchor:el, alignRight:true}, items);
};
async function duplicateCurrentPoster(){
  await saveDoc();
  const c = JSON.parse(JSON.stringify(S.doc, (k, v) => k === '_v' ? undefined : v));
  c.id = uid('p'); c.title = S.doc.title + L(' (copie)',' (copy)'); c.createdAt = c.updatedAt = Date.now();
  S.doc = c; await saveDoc(); openDoc(c);
  toast(L('Copie ouverte : l’originale est restée sur l’accueil.','Copy opened: the original is still on the home screen.'));
}

/* ---------- Barre du haut qui tient toujours en entier (même principe que Raging Page) ---------- */
const TB_FIT_LEVELS = 8;
let tbFitRO = null, tbFitBusy = false;
function tbFit(){
  const tb = document.querySelector('#editorView .topbar');
  if(!tb || tbFitBusy) return;
  tbFitBusy = true;
  try{
    const l = tb.querySelector('.topbar-left'), over = () => l.scrollWidth > l.clientWidth + 1;
    for(let k = 1; k <= TB_FIT_LEVELS; k++) tb.classList.remove('tb-c' + k);
    for(let k = 1; k <= TB_FIT_LEVELS && over(); k++) tb.classList.add('tb-c' + k);
  }finally{ tbFitBusy = false; }
}
const __rdAttachForFit = attachEditorEvents;
attachEditorEvents = function(){
  __rdAttachForFit.apply(this, arguments);
  const tb = document.querySelector('#editorView .topbar'); if(!tb) return;
  if(tbFitRO) tbFitRO.disconnect();
  if(window.ResizeObserver){
    tbFitRO = new ResizeObserver(() => tbFit());
    tbFitRO.observe(tb);
    tb.querySelectorAll('.topbar-left > *, .topbar-right > *').forEach(n => tbFitRO.observe(n));
  }
  tbFit();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(tbFit);
};

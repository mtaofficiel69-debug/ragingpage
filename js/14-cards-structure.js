/* =====================================================================
   CARDS
===================================================================== */
let dragSceneId=null;
function renderCards(){
  const blocks = getSceneBlocks().filter(b=>b.sceneId);
  const numbers = sceneNumbers();
  const lens = sceneLengths();
  const cards = blocks.map(b=>{
    const headingEl = b.elements[0];
    const meta = sceneMeta(b.sceneId);
    const synopsis = meta.outline || (b.elements.find(e=>e.type==='action')||{}).text || '';
    const chars = [...new Set(b.elements.filter(e=>e.type==='character').map(e=>characterBaseName(e.text)).filter(Boolean))];
    const tagsHtml = meta.tags.map(t=>`<span class="tag-chip">#${esc(t)}</span>`).join('');
    const len = lens[b.sceneId];
    return `<div class="card" ${meta.color?`style="--sc-color:${meta.color};"`:''} draggable="true" tabindex="0" data-scene="${b.sceneId}" data-act="focusSceneFromCard" data-id="${b.sceneId}">
      <div class="card-head"><span class="card-num">${numbers[b.sceneId]}</span><span class="card-heading">${esc(headingEl.text)||L('(scène sans titre)','(untitled scene)')}</span>${len?`<span class="scene-len" title="${L('Longueur de la scène, en huitièmes de page','Scene length, in eighths of a page')}">${eighthsLabel(len)}</span>`:''}</div>
      <div class="card-syn">${esc(synopsis)||`<span style='color:#bbb'>${L('Pas d\u2019outline','No outline')}</span>`}</div>
      ${chars.length?`<div class="card-chars">${esc(chars.join(', '))}</div>`:''}
      ${tagsHtml?`<div class="card-tags">${tagsHtml}</div>`:''}
      <div class="card-foot"><button class="btn btn-sm btn-ghost" data-act="duplicateScene" data-id="${b.sceneId}" data-stop="1">${L('Dupliquer','Duplicate')}</button><button class="btn btn-sm btn-ghost" data-act="deleteScene" data-id="${b.sceneId}" data-stop="1">${L('Supprimer','Delete')}</button></div>
    </div>`;
  }).join('');
  return `
    <div class="cards-toolbar"><div class="pane-title" style="margin:0;">${L('Cartes','Cards')}${paneCount(blocks.length)}</div>
      <button class="btn btn-sm" data-act="switchTab" data-id="editor">${L('Retour à l\u2019éditeur','Back to the editor')}</button></div>
    <div class="cards-hint">${L('Glisse une carte pour réorganiser les scènes (un trait indique où elle ira) · au clavier : Alt + flèches · Ctrl+Z annule.','Drag a card to reorder scenes (a line shows where it will land) · keyboard: Alt + arrows · Ctrl+Z undoes.')}</div>
    <div class="cards-grid" id="cardsGrid">${cards || `<p style="color:var(--ink-soft);padding:20px;">${L('Aucune scène pour l\u2019instant. Ajoute une ligne de type Scène dans l\u2019éditeur.','No scene yet. Add a Scene-type line in the editor.')}</p>`}</div>`;
}
function cardsScrollParent(el){
  let n = el.parentElement;
  while(n && n !== document.body){
    const o = getComputedStyle(n).overflowY;
    if(o === 'auto' || o === 'scroll') return n;
    n = n.parentElement;
  }
  return null;   // la page elle-même
}
function attachCardsDnD(){
  const grid = document.getElementById('cardsGrid'); if(!grid) return;
  const sp = cardsScrollParent(grid);
  let drop = null, auto = 0, raf = 0;

  const clearMarks = ()=>{
    grid.querySelectorAll('.drop-before,.drop-after,.drop-h').forEach(c=>c.classList.remove('drop-before','drop-after','drop-h'));
    drop = null;
  };
  const tick = ()=>{
    if(!auto){ raf = 0; return; }
    if(sp) sp.scrollTop += auto; else window.scrollBy(0, auto);
    raf = requestAnimationFrame(tick);
  };
  const edge = y=>{
    const r = sp ? sp.getBoundingClientRect() : {top:0, bottom:window.innerHeight};
    const top = Math.max(r.top, 0), bot = Math.min(r.bottom, window.innerHeight), z = 80;
    auto = y < top + z ? -Math.min(22, Math.ceil((top + z - y)/5))
         : y > bot - z ?  Math.min(22, Math.ceil((y - (bot - z))/5)) : 0;
    if(auto && !raf) raf = requestAnimationFrame(tick);
  };
  const nearest = (x,y)=>{
    let best = null, bd = Infinity;
    grid.querySelectorAll('.card').forEach(c=>{
      const r = c.getBoundingClientRect();
      const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
      const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
      const d = dx*dx + dy*dy;
      if(d < bd){ bd = d; best = c; }
    });
    return best;
  };
  const finish = ()=>{
    auto = 0; clearMarks(); dragSceneId = null;
    grid.querySelectorAll('.dragging').forEach(c=>c.classList.remove('dragging'));
  };
  // Déplace une scène, redessine en gardant la position de défilement, puis
  // fait « atterrir » la carte (éclat bref) et rend le focus au clavier.
  const move = (fromId, toId, after, focus)=>{
    const top = sp ? sp.scrollTop : window.scrollY;
    pushUndo();
    reorderScenes(fromId, toId, after);
    renderTabBody();
    const g2 = document.getElementById('cardsGrid');
    const sp2 = g2 ? cardsScrollParent(g2) : null;
    if(sp2) sp2.scrollTop = top; else window.scrollTo(0, top);
    const c = g2 && g2.querySelector('.card[data-scene="'+fromId+'"]');
    if(c){
      c.classList.add('just-moved');
      if(focus){ c.focus({preventScroll:true}); c.scrollIntoView({block:'nearest'}); }
    }
    const n = sceneNumbers()[fromId];
    toast(L('Scène déplacée','Scene moved') + (n ? ' — n° '+n : '') + ' · ' + L('Ctrl+Z pour annuler','Ctrl+Z to undo'));
  };

  grid.addEventListener('dragstart', e=>{
    const card = e.target.closest && e.target.closest('.card');
    if(!card || e.target.closest('[data-stop]')) return;
    dragSceneId = card.dataset.scene;
    if(e.dataTransfer){ e.dataTransfer.effectAllowed = 'move'; try{ e.dataTransfer.setData('text/plain', dragSceneId); }catch(err){} }
    setTimeout(()=>card.classList.add('dragging'), 0);   // après la capture de l'image fantôme
  });
  grid.addEventListener('dragover', e=>{
    if(!dragSceneId) return;
    e.preventDefault();
    if(e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    edge(e.clientY);
    clearMarks();
    const t = nearest(e.clientX, e.clientY); if(!t) return;
    const r = t.getBoundingClientRect();
    const single = t.offsetWidth > grid.clientWidth * 0.6;          // une seule colonne : on repère à la verticale
    const after = single ? e.clientY > r.top + r.height/2 : e.clientX > r.left + r.width/2;
    const ids = [...grid.querySelectorAll('.card')].map(c=>c.dataset.scene);
    const di = ids.indexOf(dragSceneId), ti = ids.indexOf(t.dataset.scene);
    const p = ti + (after ? 1 : 0);
    if(di < 0 || p === di || p === di + 1) return;                  // ça ne changerait rien : pas de repère
    t.classList.add(after ? 'drop-after' : 'drop-before');
    if(single) t.classList.add('drop-h');
    drop = { id: t.dataset.scene, after };
  });
  grid.addEventListener('dragleave', e=>{
    if(!e.relatedTarget || !grid.contains(e.relatedTarget)){ auto = 0; clearMarks(); }
  });
  grid.addEventListener('drop', e=>{
    if(!dragSceneId) return;
    e.preventDefault();
    const d = drop, from = dragSceneId;
    finish();
    if(d && d.id !== from) move(from, d.id, d.after, false);
  });
  grid.addEventListener('dragend', finish);

  // Clavier : Alt + flèches déplacent la carte active ; Entrée l'ouvre.
  grid.addEventListener('keydown', e=>{
    const card = e.target.closest && e.target.closest('.card');
    if(!card || e.target !== card) return;
    if(e.key === 'Enter'){ e.preventDefault(); focusSceneFromCard(card.dataset.scene, e); return; }
    if(!e.altKey || e.ctrlKey || e.metaKey) return;
    const prev = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
    const next = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    if(!prev && !next) return;
    e.preventDefault();
    const cards = [...grid.querySelectorAll('.card')];
    const i = cards.indexOf(card), j = i + (next ? 1 : -1);
    if(j < 0 || j >= cards.length) return;
    move(card.dataset.scene, cards[j].dataset.scene, next, true);
  });
}
function reorderScenes(fromId, toId, after){
  const blocks = getSceneBlocks();
  const pre = blocks[0] && !blocks[0].sceneId ? blocks.shift() : null;
  const fromIdx = blocks.findIndex(b=>b.sceneId===fromId);
  if(fromIdx<0 || !blocks.some(b=>b.sceneId===toId)) return;
  const [moved] = blocks.splice(fromIdx,1);
  const toIdx = blocks.findIndex(b=>b.sceneId===toId);
  blocks.splice(toIdx + (after ? 1 : 0), 0, moved);
  S.project.elements = (pre?pre.elements:[]).concat(...blocks.map(b=>b.elements));
  scheduleAutosave();
}
function focusSceneFromCard(id, e){
  if(e.target.closest('[data-stop]')) return;
  S.tab='editor'; renderTabBody(); syncRailActive('editor');
  setTimeout(()=>{ const div = document.querySelector('#page [data-id="'+id+'"]'); if(div){ div.scrollIntoView({block:'center'}); div.focus(); } }, 30);
}
function duplicateScene(id){
  const blocks = getSceneBlocks(); const b = blocks.find(x=>x.sceneId===id); if(!b) return;
  pushUndo();
  const idx = findIdx(id);
  const fpgMap = {};                  // une page sans numéro dupliquée devient une nouvelle page, distincte de l'originale
  const clones = b.elements.map(e=>{
    const c = newElement(e.type, e.text);
    if(e.fpg) c.fpg = fpgMap[e.fpg] || (fpgMap[e.fpg] = uid('fpg'));
    if(e.dual) c.dual = true;         // une scène dupliquée garde ses simultanés
    if(e.card) c.card = JSON.parse(JSON.stringify(e.card));   // et le style de ses cartons
    return c;
  });
  S.project.elements.splice(idx + b.elements.length, 0, ...clones);
  const oldMeta = sceneMeta(id);
  sceneMeta(clones[0].id).tags = [...oldMeta.tags]; sceneMeta(clones[0].id).outline = oldMeta.outline;
  scheduleAutosave(); renderTabBody();
}
async function deleteScene(id, e){
  if(e && e.stopPropagation) e.stopPropagation();
  const blocks = getSceneBlocks(); const b = blocks.find(x=>x.sceneId===id); if(!b) return;
  if(!await mmConfirm(L('Tu pourras la restaurer depuis la corbeille.','You can restore it from the trash.'),
    {title:L('Déplacer cette scène vers la corbeille ?','Move this scene to the trash?'), ok:L('Déplacer','Move')})) return;
  pushUndo();
  const idx = findIdx(id);
  S.project.elements.splice(idx, b.elements.length);
  S.project.graveyard.push({ id: uid('grv'), sceneId:id, elements:b.elements, meta: sceneMeta(id), deletedAt: Date.now() });
  scheduleAutosave(); renderTabBody();
}

/* =====================================================================
   STRUCTURE — squelette du film AVANT l'écriture des scènes.
   ---------------------------------------------------------------------
   Complètement indépendant des éléments du scénario (S.project.elements) :
   de simples fiches (S.project.structure.beats), en une liste VERTICALE
   sans limite — la première scène tout en haut, on en ajoute en dessous,
   glisser-déposer pour réordonner. Pas de colonnes/actes : juste l'ordre
   du film, de haut en bas.
   Une fiche peut ensuite être « poussée » dans le vrai scénario d'un clic
   (convertBeatToScene) une fois qu'on est prêt à l'écrire pour de bon ;
   elle reste alors visible ici, grisée, comme repère.
===================================================================== */
let dragBeatId = null;
function renderStructure(){
  const beats = ensureStructure(S.project).beats;
  const cards = beats.map((b,i)=> structureCardHtml(b, i+1)).join('');
  return `<div class="cards-toolbar"><div class="pane-title" style="margin:0;">${L('Structure','Structure')}${paneCount(beats.length)}</div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-sm btn-ghost" data-act="openStructureTemplateMenu">${icon('layers')} ${L('Gabarit','Template')}</button>
        <button class="btn btn-sm" data-act="switchTab" data-id="editor">${L('Retour à l\u2019éditeur','Back to the editor')}</button>
      </div></div>
    <p class="structure-help" style="margin-left:24px;">${L('Prépare le squelette du film avant d\u2019écrire : une carte par scène, dans l\u2019ordre du film, de la première (en haut) à la dernière. Glisse une carte pour la réordonner. Une fois prêt, transforme-la en vraie scène dans l\u2019éditeur.','Sketch the film\u2019s skeleton before writing: one card per scene, in the film\u2019s order, from the first (at the top) to the last. Drag a card to reorder it. When ready, turn it into a real scene in the editor.')}</p>
    <div class="structure-list" id="structureList">${cards}</div>
    <div style="padding:0 24px 60px;"><button class="structure-add" data-act="addStructureBeat">+ ${L('Ajouter une scène','Add a scene')}</button></div>`;
}
function structureCardHtml(b, num){
  const color = b.color || STRUCTURE_COLORS[0];
  const swatches = STRUCTURE_COLORS.map(c=>
    `<button class="structure-swatch ${c===b.color?'active':''}" style="background:${c};" data-act="setStructureColor" data-id="${b.id}" data-color="${c}" title="${c}"></button>`
  ).join('');
  const linked = !!b.sceneId && !!findEl(b.sceneId);
  return `<div class="structure-card" style="--sc-color:${color};" draggable="true" data-beat="${b.id}">
    <div class="structure-card-num">${num}</div>
    <div class="structure-card-body ${linked?'is-linked':''}">
      <input type="text" placeholder="${L('Ce qui se passe dans cette scène…','What happens in this scene…')}" value="${esc(b.title)}" data-act="editStructureTitle" data-id="${b.id}">
      <textarea placeholder="${L('Détails, ambiance, enjeux, notes…','Details, mood, stakes, notes…')}" data-act="editStructureNote" data-id="${b.id}">${esc(b.note)}</textarea>
      <div class="structure-card-foot">
        <div class="structure-swatches">${swatches}</div>
        <div class="structure-card-foot-btns">
          ${linked
            ? `<span class="structure-linked-badge">✓ ${L('Dans le scénario','In the script')}</span><button class="btn btn-sm btn-ghost" data-act="openStructureScene" data-id="${b.id}">${L('Ouvrir','Open')}</button>`
            : `<button class="btn btn-sm btn-ghost" data-act="convertBeatToScene" data-id="${b.id}">→ ${L('Créer la scène','Create the scene')}</button>`}
          <button class="btn btn-sm btn-ghost" data-act="deleteStructureBeat" data-id="${b.id}" title="${L('Supprimer la carte','Delete card')}">${icon('trash')}</button>
        </div>
      </div>
    </div>
  </div>`;
}
function addStructureBeat(){
  const beats = ensureStructure(S.project).beats;
  beats.push({ id: uid('beat'), title:'', note:'', color: STRUCTURE_COLORS[beats.length % STRUCTURE_COLORS.length], sceneId:null });
  scheduleAutosave(); renderTabBody();
  const list = document.querySelectorAll('#structureList input[type=text]');
  const last = list[list.length-1];
  if(last){ last.focus(); last.scrollIntoView({block:'center', behavior:'smooth'}); }
}
/* Menu « Gabarit » — même mécanique que le menu « Plus d'options » de la
   barre d'outils (menu flottant ancré sous le bouton, fermé par un clic
   dehors, par Échap, ou par le choix lui-même). */
function structureTemplateMenuHtml(){
  return Object.keys(STRUCTURE_TEMPLATES).map(key=>{
    const tpl = STRUCTURE_TEMPLATES[key];
    return `<button class="btn" data-act="applyStructureTemplate" data-id="${key}">${icon('layers')} ${tpl.label()}</button>`;
  }).join('');
}
function openStructureTemplateMenu(id, e){
  if(document.getElementById('stTplMenu')){ closeStructureTemplateMenu(); return; }
  const btn = e.target.closest('button'); if(!btn) return;
  const r = btn.getBoundingClientRect();
  const html = `<div class="tb-more-backdrop" id="stTplBackdrop" data-act="closeStructureTemplateMenu"></div>
    <div class="tb-more-menu" id="stTplMenu" data-stop="1" style="top:${Math.round(r.bottom+6)}px; left:${Math.round(r.left)}px;">${structureTemplateMenuHtml()}</div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('stTplMenu').addEventListener('click', closeStructureTemplateMenu);
  document.addEventListener('keydown', onStructureTemplateKeydown);
}
function closeStructureTemplateMenu(){
  const b = document.getElementById('stTplBackdrop'); if(b) b.remove();
  const m = document.getElementById('stTplMenu'); if(m) m.remove();
  document.removeEventListener('keydown', onStructureTemplateKeydown);
}
function onStructureTemplateKeydown(e){ if(e.key === 'Escape') closeStructureTemplateMenu(); }
/* Ajoute les jalons du gabarit choisi À LA SUITE de la structure existante
   — jamais en remplacement : un squelette déjà commencé n'est jamais
   écrasé silencieusement par un gabarit. */
async function applyStructureTemplate(key){
  const tpl = STRUCTURE_TEMPLATES[key]; if(!tpl) return;
  const beats = ensureStructure(S.project).beats;
  const already = beats.length > 0;
  if(already && !await mmConfirm(L('Les jalons du gabarit seront ajoutés après ceux que tu as déjà. Rien n\u2019est écrasé.','The template milestones will be added after the ones you already have. Nothing is overwritten.'),
    {title:L('Ajouter ces jalons à ta structure ?','Add these milestones to your structure?'), ok:L('Ajouter','Add')})) return;
  tpl.beats().forEach(([title, note], i)=>{
    beats.push({ id: uid('beat'), title, note, color: STRUCTURE_COLORS[(beats.length+i) % STRUCTURE_COLORS.length], sceneId:null });
  });
  scheduleAutosave(); renderTabBody();
  toast(L('Gabarit ajouté.','Template added.'));
}
function findBeat(id){ return ensureStructure(S.project).beats.find(b=>b.id===id); }
function editStructureTitle(id, e){ const b = findBeat(id); if(!b) return; b.title = e.target.value; scheduleAutosave(); }
function editStructureNote(id, e){ const b = findBeat(id); if(!b) return; b.note = e.target.value; scheduleAutosave(); }
function setStructureColor(id, e){
  const b = findBeat(id); if(!b) return;
  const color = e.target.closest('[data-color]').dataset.color;
  b.color = color; scheduleAutosave(); renderTabBody();
}
async function deleteStructureBeat(id){
  if(!await mmConfirm(L('Cette carte de structure sera supprimée.','This structure card will be deleted.'),
    {title:L('Supprimer cette carte ?','Delete this card?'), ok:L('Supprimer','Delete'), danger:true})) return;
  const st = ensureStructure(S.project);
  st.beats = st.beats.filter(b=>b.id!==id);
  scheduleAutosave(); renderTabBody();
}
/* Fait naître une vraie scène (entête + note d'action) dans le scénario, à
   la toute fin, à partir d'une fiche de structure. La fiche elle-même
   reste en place — grisée, avec un lien vers la scène créée — pour servir
   de repère pendant l'écriture plutôt que de disparaître. */
function convertBeatToScene(id){
  const b = findBeat(id); if(!b) return;
  pushUndo();
  const sceneEl = newElement('scene', b.title || '');
  const actionEl = newElement('action', b.note || '');
  S.project.elements.push(sceneEl, actionEl);
  b.sceneId = sceneEl.id;
  const meta = sceneMeta(sceneEl.id);
  meta.outline = b.note || '';
  meta.color = b.color || '';
  scheduleAutosave();
  S.tab='editor'; renderTabBody(); syncRailActive('editor');
  setTimeout(()=>{ const div = document.querySelector('#page [data-id="'+sceneEl.id+'"]'); if(div){ div.scrollIntoView({block:'center'}); div.focus(); } }, 30);
  toast(L('Scène créée à la fin du scénario.','Scene created at the end of the script.'));
}
function openStructureScene(id){
  const b = findBeat(id); if(!b || !b.sceneId) return;
  focusSceneFromCard(b.sceneId, {target:document.createElement('span')});
}
/* Glisser-déposer VERTICAL, un seul flux : on lâche une carte au-dessus ou
   en dessous de la ligne médiane de la carte survolée pour s'y placer
   avant ou après — pas de colonnes, juste l'ordre haut → bas. */
function attachStructureDnD(){
  const list = document.getElementById('structureList'); if(!list) return;
  list.querySelectorAll('.structure-card').forEach(card=>{
    card.addEventListener('dragstart', e=>{
      // Ne pas déclencher le drag depuis un champ de texte (sélection de
      // texte) : seule la carte elle-même (poignée) doit pouvoir glisser.
      if(e.target.closest('input,textarea,button')){ e.preventDefault(); return; }
      dragBeatId = card.dataset.beat; card.classList.add('dragging');
    });
    card.addEventListener('dragend', ()=>{
      dragBeatId = null; card.classList.remove('dragging');
      list.querySelectorAll('.structure-card').forEach(c=>c.classList.remove('drop-before','drop-after'));
    });
    card.addEventListener('dragover', e=>{
      e.preventDefault();
      if(!dragBeatId || dragBeatId===card.dataset.beat) return;
      const r = card.getBoundingClientRect();
      const before = (e.clientY - r.top) < r.height/2;
      card.classList.toggle('drop-before', before);
      card.classList.toggle('drop-after', !before);
    });
    card.addEventListener('dragleave', ()=> card.classList.remove('drop-before','drop-after'));
    card.addEventListener('drop', e=>{
      e.preventDefault();
      const before = card.classList.contains('drop-before');
      card.classList.remove('drop-before','drop-after');
      if(!dragBeatId || dragBeatId===card.dataset.beat) return;
      const beats = ensureStructure(S.project).beats;
      const fromIdx = beats.findIndex(x=>x.id===dragBeatId);
      if(fromIdx<0) return;
      const [moved] = beats.splice(fromIdx,1);
      let toIdx = beats.findIndex(x=>x.id===card.dataset.beat);
      if(toIdx<0) toIdx = beats.length;
      beats.splice(before?toIdx:toIdx+1, 0, moved);
      dragBeatId = null;
      scheduleAutosave(); renderTabBody();
    });
  });
}

/* =====================================================================
   OUTLINE
===================================================================== */
function renderOutline(){
  const blocks = getSceneBlocks().filter(b=>b.sceneId);
  const numbers = sceneNumbers();
  const lens = sceneLengths();
  const rows = blocks.map(b=>{
    const meta = sceneMeta(b.sceneId);
    const len = lens[b.sceneId];
    return `<div class="flat-row">
      <div class="flat-row-head">
        <div class="flat-row-title">${numbers[b.sceneId]}. ${esc(b.elements[0].text)||L('(sans titre)','(untitled)')}</div>
        ${len?`<span class="scene-len" title="${L('Longueur de la scène, en huitièmes de page','Scene length, in eighths of a page')}">${eighthsLabel(len)}</span>`:''}
        <button class="btn btn-sm btn-ghost" data-act="focusSceneFromCard" data-id="${b.sceneId}">${L('Ouvrir','Open')}</button>
      </div>
      <textarea placeholder="${L('Outline / synopsis…','Outline / synopsis…')}" data-act="editOutline" data-id="${b.sceneId}">${esc(meta.outline)}</textarea>
      <div class="row-tags-edit">${meta.tags.map(t=>`<span class="tag-chip">#${esc(t)}</span>`).join('')}
        <input type="text" style="max-width:200px;" placeholder="${L('tags, séparés, virgule','tags, comma-separated')}" data-act="editSceneTags" data-id="${b.sceneId}" value="${esc(meta.tags.join(', '))}"></div>
    </div>`;
  }).join('');
  return `<div class="cards-toolbar"><div class="pane-title" style="margin:0;">Outline${paneCount(blocks.length)}</div></div>
    <div class="wh-wrap">
      <p class="wh-lead">${L('Un résumé d’une phrase par scène : la colonne vertébrale de ton scénario.','A one-sentence summary per scene: the backbone of your screenplay.')}</p>
      ${rows ? `<div class="flat-list">${rows}</div>` : whEmpty(L('Aucune scène.','No scene.'), 'list')}
    </div>`;
}


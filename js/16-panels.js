/* =====================================================================
   CHARACTERS
===================================================================== */
/* v94 : état vide commun à tous les onglets (pictogramme dans une pastille + phrase), au lieu d'une ligne grise à puce */
function whEmpty(t, ic){ return `<div class="wh-empty"><span class="wh-empty-ic">${icon(ic || 'note')}</span><span class="wh-empty-t">${t}</span></div>`; }
/* v94 : nombre affiché à côté du titre d'un onglet, comme « Mes scénarios » sur l'accueil */
function paneCount(n){ return n ? ` <span class="pane-count">${n}</span>` : ''; }
function renderCharacters(){
  const stats = characterStats();
  const rows = stats.map(s=>`
    <div class="char-row" data-act="showCharDetail" data-id="${esc(s.name)}">
      <div class="char-name">${esc(s.name)}</div>
      <div class="char-stats">${s.scenes.size} ${L(s.scenes.size===1?'scène':'scènes', s.scenes.size===1?'scene':'scenes')} · ${s.dialogueLines} ${L('répliques','lines')} · ${s.words} ${L('mots','words')}</div>
    </div>`).join('');
  return `<div class="cards-toolbar"><div class="pane-title" style="margin:0;">${L('Personnages','Characters')}${paneCount(stats.length)}</div></div>
    <div class="wh-wrap">
      <p class="wh-lead">${L('Qui parle dans ton scénario, et combien. Clique sur un personnage pour relire ses répliques.','Who speaks in your screenplay, and how much. Click a character to reread their lines.')}</p>
      <div class="wh-card">
        <div class="wh-card-t"><span>${L('Les personnages','The characters')}</span></div>
        <p class="wh-card-s">${L('Classés par nombre de mots dits.','Ranked by number of words spoken.')}</p>
        ${rows ? `<div class="wh-chars">${rows}</div>` : whEmpty(L('Aucun personnage détecté. Ajoute une ligne de type Personnage.','No character detected. Add a Character-type line.'), 'users')}
      </div>
      <div id="charDetail"></div>
    </div>`;
}
function showCharDetail(name){
  const numbers = sceneNumbers();
  const sceneOf = {}; let curScene = null;
  S.project.elements.forEach(el=>{ if(el.type==='scene') curScene = el.id; sceneOf[el.id]=curScene; });
  let current=null; const lines=[];
  S.project.elements.forEach(el=>{
    if(el.type==='character'){ current = characterBaseName(el.text); }
    else if(el.type==='dialogue' && current===name){ lines.push({sceneId: sceneOf[el.id], text: el.text}); }
    else if(el.type!=='parenthetical'){ current=null; }
  });
  const html = `<div class="wh-card">
    <div class="wh-card-t"><span>${L('Répliques de','Lines by')} ${esc(name)}</span></div>
    <p class="wh-card-s">${lines.length} ${L(lines.length===1?'réplique':'répliques', lines.length===1?'line':'lines')}</p>
    <div class="wh-lines">${lines.map(l=>`<div class="flat-row">
      <div style="font-size:12.5px;color:var(--ink-soft);margin-bottom:4px;">${L('Scène','Scene')} ${numbers[l.sceneId]||'?'}</div>
      <div style="font-family:var(--mono);font-size:13px;">${esc(l.text)}</div>
    </div>`).join('')}</div>${lines.length ? '' : whEmpty(L('Aucune réplique.','No line.'), 'bubbles')}
  </div>`;
  document.getElementById('charDetail').innerHTML = html;
}

/* =====================================================================
   TAGS
===================================================================== */
function allTagsUsed(){
  const set = new Set();
  Object.values(S.project.sceneMeta).forEach(m=> (m.tags||[]).forEach(t=>set.add(t)));
  return [...set].sort();
}
function renderTags(){
  const tags = allTagsUsed();
  const numbers = sceneNumbers();
  const chips = tags.map(t=>`<span class="chip-toggle ${S.filterTags.has(t)?'on':''}" data-act="toggleTagFilter" data-id="${esc(t)}">#${esc(t)}</span>`).join(' ');
  const blocks = getSceneBlocks().filter(b=>b.sceneId).filter(b=>{
    if(!S.filterTags.size) return true;
    const m = sceneMeta(b.sceneId); return [...S.filterTags].every(t=>m.tags.includes(t));
  });
  const rows = blocks.map(b=>`<div class="flat-row"><div class="flat-row-head">
    <div class="flat-row-title">${numbers[b.sceneId]}. ${esc(b.elements[0].text||'')}</div>
    <button class="btn btn-sm btn-ghost" data-act="focusSceneFromCard" data-id="${b.sceneId}">${L('Ouvrir','Open')}</button></div>
    <div class="row-tags-edit">${sceneMeta(b.sceneId).tags.map(t=>`<span class="tag-chip">#${esc(t)}</span>`).join('')}</div></div>`).join('');
  return `<div class="cards-toolbar"><div class="pane-title" style="margin:0;">Tags${paneCount(tags.length)}</div></div>
    <div class="wh-wrap">
      <p class="wh-lead">${L('Des étiquettes pour retrouver les scènes d\u2019un même thème ou d\u2019un même fil.','Labels to find the scenes of a same theme or thread.')}</p>
      <div class="wh-card">
        <div class="wh-card-t"><span>${L('Filtrer par tag','Filter by tag')}</span></div>
        <p class="wh-card-s">${L('Clique sur un ou plusieurs tags pour ne garder que les scènes qui les portent toutes.','Click one or more tags to keep only the scenes that carry all of them.')}</p>
        ${chips ? `<div class="wh-chips">${chips}</div>` : whEmpty(L('Aucun tag pour l\u2019instant, ajoute-en depuis une scène.','No tag yet, add one from a scene.'), 'tag')}
      </div>
      ${rows ? `<div class="wh-card wh-list"><div class="wh-card-t"><span>${S.filterTags.size ? L('Scènes filtrées','Filtered scenes') : L('Toutes les scènes','All scenes')}</span><span class="wh-card-n">${blocks.length}</span></div><div class="flat-list">${rows}</div></div>` : whEmpty(S.filterTags.size ? L('Aucune scène ne porte tous ces tags.','No scene carries all these tags.') : L('Aucune scène.','No scene.'), 'tag')}
    </div>`;
}
function toggleTagFilter(tag){
  if(S.filterTags.has(tag)) S.filterTags.delete(tag); else S.filterTags.add(tag);
  renderTabBody();
}

/* =====================================================================
   NOTES (personal notepad)
===================================================================== */
function renderNotes(){
  return `<div class="cards-toolbar"><div class="pane-title" style="margin:0;">${L('Notes personnelles','Personal notes')}</div></div>
  <div class="wh-wrap">
    <p class="wh-lead">${L('Un bloc-notes à part, pour tout ce qui n\u2019a pas sa place dans le scénario.','A separate notepad, for everything that doesn\u2019t belong in the screenplay.')}</p>
    <div class="wh-card">
      <div class="wh-card-t"><span>${L('Ton bloc-notes','Your notepad')}</span></div>
      <p class="wh-card-s">${L('Séparé du scénario et jamais exporté, comme les notes glissées dans le texte (Ctrl+9).','Kept apart from the screenplay and never exported, like the notes slipped into the text (Ctrl+9).')}</p>
      <textarea class="notes-area" id="personalNotes" placeholder="${L('Idées, recherches, choses à ne pas oublier…','Ideas, research, things not to forget…')}">${esc(S.project.personalNotes)}</textarea>
    </div>
  </div>`;
}

/* =====================================================================
   REPORTS
===================================================================== */
function renderReports(){
  const numbers = sceneNumbers();
  const blocks = getSceneBlocks().filter(b=>b.sceneId);
  const chars = characterStats().map(c=>c.name);
  const opts = chars.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  return `<div class="cards-toolbar"><div class="pane-title" style="margin:0;">${L('Rapports','Reports')}</div></div>
  <div class="wh-wrap">
    <p class="wh-lead">${L('Retrouve vite des scènes ou des éléments précis de ton scénario.','Quickly find specific scenes or elements of your screenplay.')}</p>
    <div class="wh-card">
      <div class="wh-card-t"><span>${L('Par personnage','By character')}</span></div>
      <p class="wh-card-s">${L('Liste les scènes où un personnage prend la parole.','Lists the scenes where a character speaks.')}</p>
      <div class="field" style="max-width:320px;"><label>${L('Filtrer par personnage','Filter by character')}</label>
        <select id="reportChar"><option value="">${L('Toutes les scènes','All scenes')}</option>${opts}</select></div>
      <div class="sset-actions"><button class="btn btn-sm" data-act="runReportChar">${L('Afficher','Show')}</button></div>
    </div>
    <div id="reportResults"></div>
    <div class="wh-card">
      <div class="wh-card-t"><span>${L('Raccourcis','Shortcuts')}</span></div>
      <p class="wh-card-s">${L('Des listes toutes prêtes : scènes de nuit, notes, plans, transitions.','Ready-made lists: night scenes, notes, shots, transitions.')}</p>
      <div class="sset-actions">
        <button class="btn btn-sm" data-act="reportPreset" data-id="night">${L('Scènes de nuit','Night scenes')}</button>
        <button class="btn btn-sm" data-act="reportPreset" data-id="notes">${L('Toutes les notes','All notes')}</button>
        <button class="btn btn-sm" data-act="reportPreset" data-id="shots">${L('Tous les plans','All shots')}</button>
        <button class="btn btn-sm" data-act="reportPreset" data-id="transitions">${L('Toutes les transitions','All transitions')}</button>
      </div>
    </div>
  </div>`;
}
function runReportChar(){
  const sel = document.getElementById('reportChar'); const name = sel.value;
  const numbers = sceneNumbers();
  const blocks = getSceneBlocks().filter(b=>b.sceneId);
  const out = document.getElementById('reportResults');
  if(!name){ out.innerHTML=`<p style="color:var(--ink-soft);">${L('Choisis un personnage, ou consulte les raccourcis ci-dessous.','Pick a character, or use the shortcuts below.')}</p>`; return; }
  const matching = blocks.filter(b=> b.elements.some(e=>e.type==='character' && characterBaseName(e.text)===name));
  out.innerHTML = `<div class="flat-list" style="padding:0;">${matching.map(b=>`
    <div class="flat-row"><div class="flat-row-head"><div class="flat-row-title">${numbers[b.sceneId]}. ${esc(b.elements[0].text)}</div>
    <button class="btn btn-sm btn-ghost" data-act="focusSceneFromCard" data-id="${b.sceneId}">${L('Ouvrir','Open')}</button></div></div>`).join('') || `<p style="color:var(--ink-soft);">${L('Aucune scène.','No scene.')}</p>`}</div>`;
}
function reportPreset(kind){
  const out = document.getElementById('reportResults');
  const numbers = sceneNumbers();
  if(kind==='night'){
    const blocks = getSceneBlocks().filter(b=>b.sceneId && /NUIT/i.test(b.elements[0].text));
    out.innerHTML = listResult(blocks.map(b=>({label:numbers[b.sceneId]+'. '+b.elements[0].text, id:b.sceneId})));
  } else if(kind==='notes'){
    const items = S.project.elements.filter(e=>e.type==='note');
    out.innerHTML = listResult(items.map(e=>({label:e.text||L('(note vide)','(empty note)'), id:e.id})));
  } else if(kind==='shots'){
    const items = S.project.elements.filter(e=>e.type==='shot');
    out.innerHTML = listResult(items.map(e=>({label:e.text||L('(plan vide)','(empty shot)'), id:e.id})));
  } else if(kind==='transitions'){
    const items = S.project.elements.filter(e=>e.type==='transition');
    out.innerHTML = listResult(items.map(e=>({label:e.text||L('(transition vide)','(empty transition)'), id:e.id})));
  }
}
function listResult(arr){
  if(!arr.length) return `<p style="color:var(--ink-soft);">${L('Aucun résultat.','No results.')}</p>`;
  return `<div class="flat-list" style="padding:0;">${arr.map(x=>`
    <div class="flat-row"><div class="flat-row-head"><div class="flat-row-title">${esc(x.label)}</div>
    <button class="btn btn-sm btn-ghost" data-act="focusSceneFromCard" data-id="${x.id}">${L('Ouvrir','Open')}</button></div></div>`).join('')}</div>`;
}

/* =====================================================================
   STATS
===================================================================== */
function renderStats(){
  const s = computeStats();
  const pages = measuredPageCount();   // vraie pagination, pas une estimation
  const top = characterStats().slice(0,5);
  return `<div class="cards-toolbar"><div class="pane-title" style="margin:0;">${L('Statistiques','Statistics')}</div></div>
  <div class="wh-wrap">
    <p class="wh-lead">${L('Les grands chiffres de ton scénario.','The big numbers of your screenplay.')}</p>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-num">${pages}</div><div class="stat-label">${L('Pages (paginées)','Pages (paginated)')}</div></div>
      <div class="stat-card"><div class="stat-num">${s.scenes}</div><div class="stat-label">${L('Scènes','Scenes')}</div></div>
      <div class="stat-card"><div class="stat-num">${s.words}</div><div class="stat-label">${L('Mots','Words')}</div></div>
      <div class="stat-card"><div class="stat-num">${s.dialogues}</div><div class="stat-label">${L('Répliques','Lines')}</div></div>
      <div class="stat-card"><div class="stat-num">${pages} min</div><div class="stat-label">${L('Lecture estimée','Estimated reading time')}</div></div>
      <div class="stat-card"><div class="stat-num">${s.chars}</div><div class="stat-label">${L('Caractères','Characters')}</div></div>
    </div>
    <div class="wh-card">
      <div class="wh-card-t"><span>${L('Personnages les plus présents','Most present characters')}</span></div>
      <p class="wh-card-s">${L('Les cinq qui parlent le plus, en nombre de mots.','The five who speak the most, by word count.')}</p>
      ${top.length ? `<div class="wh-chars">${top.map(t=>`<div class="char-row" style="cursor:default;"><div class="char-name">${esc(t.name)}</div><div class="char-stats">${t.words} ${L('mots','words')}</div></div>`).join('')}</div>` : whEmpty(L('Aucun personnage pour l\u2019instant.','No character yet.'))}
    </div>
  </div>`;
}

/* =====================================================================
   GRAVEYARD
===================================================================== */
function renderGraveyard(){
  const g = S.project.graveyard || [];
  const rows = g.slice().reverse().map(item=>`
    <div class="flat-row"><div class="flat-row-head">
      <div class="flat-row-title">${esc(item.elements[0].text)||L('(scène sans titre)','(untitled scene)')}</div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-sm" data-act="restoreScene" data-id="${item.id}">${L('Restaurer','Restore')}</button>
        <button class="btn btn-sm btn-danger" data-act="purgeScene" data-id="${item.id}">${L('Supprimer définitivement','Delete permanently')}</button>
      </div></div>
      <div style="font-size:12.5px;color:var(--ink-soft);">${L('Supprimée','Deleted')} ${timeAgo(item.deletedAt)}</div>
    </div>`).join('');
  return `<div class="cards-toolbar"><div class="pane-title" style="margin:0;">${L('Corbeille','Graveyard')}${paneCount(g.length)}</div></div>
    <div class="wh-wrap">
      <p class="wh-lead">${L('Les scènes supprimées restent ici : tu peux les restaurer, ou les supprimer pour de bon.','Deleted scenes stay here: you can restore them, or delete them for good.')}</p>
      ${rows ? `<div class="flat-list">${rows}</div>` : whEmpty(L('La corbeille est vide.','The graveyard is empty.'), 'trash')}
    </div>`;
}
function restoreScene(id){
  const idx = S.project.graveyard.findIndex(x=>x.id===id); if(idx<0) return;
  pushUndo();
  const item = S.project.graveyard[idx];
  S.project.elements.push(...item.elements);
  if(item.meta) S.project.sceneMeta[item.sceneId] = item.meta;
  S.project.graveyard.splice(idx,1);
  scheduleAutosave(); renderTabBody();
  toast(L('Scène restaurée à la fin du scénario.','Scene restored at the end of the screenplay.'));
}
async function purgeScene(id){
  if(!await mmConfirm(L('La scène sera supprimée pour de bon. Cette action est irréversible.','The scene will be deleted for good. This can\u2019t be undone.'),
    {title:L('Supprimer définitivement ?','Delete permanently?'), ok:L('Supprimer','Delete'), danger:true})) return;
  const gone = S.project.graveyard.find(x=>x.id===id);
  if(gone && gone.meta && gone.meta.lockedNum && S.project.settings.numbersLocked){
    if(!S.project.omittedNums) S.project.omittedNums = [];
    if(!S.project.omittedNums.includes(String(gone.meta.lockedNum))) S.project.omittedNums.push(String(gone.meta.lockedNum));
  }
  S.project.graveyard = S.project.graveyard.filter(x=>x.id!==id);
  scheduleAutosave(); renderTabBody();
}

/* =====================================================================
   HISTORY / VERSIONS
===================================================================== */
function renderHistory(){
  const v = S.project.versions || [];
  const rows = v.slice().reverse().map(ver=>`
    <div class="flat-row"><div class="flat-row-head">
      <div class="flat-row-title">${esc(versionLabel(ver))}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="btn btn-sm ${S.diffVerId===ver.id?'btn-primary':''}" data-act="compareVersion" data-id="${ver.id}">${S.diffVerId===ver.id?L('Masquer la comparaison','Hide the comparison'):L('Comparer avec maintenant','Compare with now')}</button>
        <button class="btn btn-sm" data-act="restoreVersion" data-id="${ver.id}">${L('Restaurer cette version','Restore this version')}</button>
        <button class="btn btn-sm" data-act="wdRestoreScenes" data-id="${ver.id}">${L('Récupérer une scène…','Recover a scene…')}</button>
      </div>
    </div><div style="font-size:12.5px;color:var(--ink-soft);">${new Date(ver.timestamp).toLocaleString(getLang()==='en'?'en-US':'fr-FR')}</div></div>`).join('');
  return `<div class="cards-toolbar"><div class="pane-title" style="margin:0;">${L('Historique','History')}${paneCount(v.length)}</div>
      <button class="btn btn-sm btn-primary" data-act="createVersion">${L('Enregistrer une version','Save a version')}</button></div>
    <div class="wh-wrap">
      <p class="wh-lead">${L('Chaque version est un instantané de ton scénario, à comparer avec l’état actuel ou à restaurer.','Each version is a snapshot of your screenplay, to compare with its current state or to restore.')}</p>
      ${rows ? `<div class="flat-list">${rows}</div>` : whEmpty(L('Aucune version enregistrée. Le bouton ci-dessus fige un instantané que tu pourras comparer ou restaurer plus tard.','No version saved yet. The button above freezes a snapshot you can compare or restore later.'), 'clock')}
      ${S.diffVerId ? diffPanelHtml() : ''}
    </div>`;
}
/* CORRECTIF I18N. Le nom par défaut d'une version ("Version du 18/09/2026"
   côté français, "Version of 9/18/2026" côté anglais) était écrit une fois
   pour toutes dans la langue active à l'enregistrement, puis stocké tel
   quel : changer de langue ensuite laissait « Version du » affiché en
   pleine interface anglaise, exactement comme les indicatifs de ligne.
   On ne fige donc plus ce texte quand c'est le nom par défaut, repéré via
   ver.auto : versionLabel() le régénère à l'affichage, dans la langue
   courante. Un nom choisi par l'utilisateur (ver.auto === false) reste lui
   affiché tel quel — c'est du contenu qu'il a écrit, pas un libellé
   d'interface, et il n'y a pas de raison de le traduire. */
function versionDefaultLabel(ts){
  const en = getLang()==='en';
  return (en?'Version of ':'Version du ')+new Date(ts).toLocaleDateString(en?'en-US':'fr-FR');
}
function versionLabel(ver){ return ver.auto ? versionDefaultLabel(ver.timestamp) : ver.label; }
async function createVersion(){
  const ts = Date.now();
  const suggested = versionDefaultLabel(ts);
  const label = await mmPrompt(L('Nom de cette version','Name for this version'), suggested, {title:L('Enregistrer une version','Save a version'), ok:L('Enregistrer','Save')});
  if(label===null) return;
  const trimmed = label.trim();
  const auto = trimmed === suggested.trim();
  S.project.versions.push({
    id: uid('ver'), label: auto ? suggested : (trimmed || L('Sans nom','Untitled')),
    auto, timestamp: ts, elements: snapshot()
  });
  if(S.project.versions.length>25) S.project.versions.shift();
  scheduleAutosave(); renderTabBody();
  toast(L('Version enregistrée.','Version saved.'));
}
async function restoreVersion(id){
  const ver = S.project.versions.find(v=>v.id===id); if(!ver) return;
  if(!await mmConfirm(L('Le scénario actuel sera remplacé par cette version. Ton état actuel restera disponible via Annuler.','The current screenplay will be replaced by this version. Your current state will stay available via Undo.'),
    {title:L('Restaurer cette version ?','Restore this version?'), ok:L('Restaurer','Restore')})) return;
  pushUndo();
  S.project.elements = JSON.parse(JSON.stringify(ver.elements));
  S.diffVerId = null;
  scheduleAutosave(); renderTabBody();
}


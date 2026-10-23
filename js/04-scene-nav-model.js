/* =====================================================================
   NAVIGATEUR DE SCÈNES
   ---------------------------------------------------------------------
   Fonctionnalité de WriterDuet absente de Raging Page : le « Navigator »,
   la liste de toutes les scènes affichée EN PERMANENCE à côté du texte,
   avec la scène en cours d'écriture surlignée et un clic pour sauter
   n'importe où.

   POURQUOI C'ÉTAIT LE MANQUE PRINCIPAL : Raging Page savait déjà sauter à
   une scène (Ctrl+G) et les montrer en cartes ou en séquencier, mais
   toujours en QUITTANT la page — soit dans une boîte modale, soit dans
   un autre onglet. Or la question qu'on se pose en écrivant n'est pas
   « où aller ? » mais « où suis-je ? » : à la scène 34 sur 61, page 42,
   au milieu du deuxième acte. Le navigateur répond à ça sans jamais
   interrompre la frappe — c'est la boussole du scénario.

   CE QU'IL NE TOUCHE PAS : rien du flux de texte ni du moteur de
   pagination. Il vit dans #sidePane, un panneau déjà prévu par la mise
   en page, et se contente de LIRE getSceneBlocks(), sceneNumbers() et
   S.pagination.pageOf. Aucun risque pour le document lui-même.
===================================================================== */
function navDefaultOpen(){
  // Ouvert d'office sur un grand écran (il y a la place à côté du papier),
  // fermé sur une fenêtre étroite où il passerait par-dessus le texte.
  // Le choix de l'utilisateur, lui, est retenu d'une session à l'autre.
  try{
    const v = localStorage.getItem('scriptmm_nav');
    if(v === '1') return true;
    if(v === '0') return false;
  }catch(e){}
  return window.innerWidth >= 1180;
}
function navTitle(){
  return S.navOpen
    ? 'Navigateur de scènes ACTIF : la liste des scènes reste à côté du texte. Cliquer pour le fermer.'
    : 'Navigateur de scènes fermé : cliquer pour afficher la liste des scènes à côté du texte.';
}
function navBtnHtml(cls){
  return `<button class="btn btn-tw ${cls||''}" data-act="toggleNav" aria-pressed="${S.navOpen?'true':'false'}" title="${navTitle()}">${icon('sidebar')} Scènes<span class="tw-dot${S.navOpen?' on':''}"></span></button>`;
}
function toggleNav(){
  S.navOpen = !S.navOpen;
  try{ localStorage.setItem('scriptmm_nav', S.navOpen ? '1' : '0'); }catch(e){}
  document.querySelectorAll('[data-act="toggleNav"]').forEach(btn=>{
    btn.setAttribute('aria-pressed', S.navOpen ? 'true' : 'false');
    btn.title = navTitle();
    const dot = btn.querySelector('.tw-dot');
    if(dot) dot.classList.toggle('on', S.navOpen);
  });
  const side = document.getElementById('sidePane');
  if(S.navOpen) renderNavPane();
  else if(side && side.dataset.mode !== 'note'){ side.classList.add('hidden'); side.innerHTML = ''; side.dataset.mode = ''; }
  // La feuille se recentre : sa largeur disponible vient de changer.
  if(S.view === 'editor' && S.tab === 'editor') schedulePaginate(30);
}
/* Le panneau est-il en train d'afficher la liste des scènes ? */
function navVisible(){
  const side = document.getElementById('sidePane');
  return !!(side && side.dataset.mode === 'nav' && !side.classList.contains('hidden'));
}
/* Scène dans laquelle se trouve le curseur (ou la dernière ligne éditée). */
function currentSceneId(){
  if(!S.project) return null;
  const line = focusedLine();
  const id = (line && line.dataset.id) || lastFocusedLineId;
  const els = S.project.elements;
  let idx = id ? els.findIndex(e=>e.id===id) : -1;
  if(idx < 0) idx = 0;
  for(let i = idx; i >= 0; i--) if(els[i] && els[i].type === 'scene') return els[i].id;
  return null;
}
function navListHtml(){
  const numbers = sceneNumbers();
  const pageOf = (S.pagination && S.pagination.pageOf) || {};
  const q = (S.navFilter || '').trim().toLowerCase();
  const cur = currentSceneId();
  const blocks = getSceneBlocks().filter(b=>b.sceneId);
  const rows = blocks.map(b=>{
    // L'élément de la scène est déjà le premier du bloc : inutile de le rechercher
    // dans tout le scénario à chaque scène (coût qui explosait avec les longs scripts).
    const el = b.elements[0];
    if(!el) return '';
    const txt = (el.text || '').trim();
    if(q && txt.toLowerCase().indexOf(q) < 0) return '';
    const pg = pageOf[b.sceneId];
    const num = numbers[b.sceneId];
    return `<div class="nav-item${b.sceneId===cur?' active':''}" data-act="navGoScene" data-id="${b.sceneId}" title="${esc(txt) || L('Scène sans titre','Untitled scene')}">
      <span class="nav-num">${num!=null?esc(String(num)):'·'}</span>
      <span class="nav-txt">${esc(txt) || L('Scène sans titre','Untitled scene')}</span>
      <span class="nav-page">${pg?('p.'+esc(pageLbl(pg))):''}</span>
    </div>`;
  }).join('');
  if(rows) return rows;
  return `<div class="nav-empty">${blocks.length ? L('Aucune scène ne correspond à ce filtre.','No scene matches this filter.') : L('Aucune scène pour l\u2019instant. Écris une entête de scène (INT./EXT.) et elle apparaîtra ici.','No scene yet. Write a scene heading (INT./EXT.) and it will show up here.')}</div>`;
}
/* Construction complète du panneau (à l'ouverture ou au changement d'onglet). */
function renderNavPane(){
  const side = document.getElementById('sidePane');
  if(!side || !S.project) return;
  if(!(S.navOpen && S.view === 'editor' && S.tab === 'editor')) return;
  const count = getSceneBlocks().filter(b=>b.sceneId).length;
  side.dataset.mode = 'nav';
  side.classList.remove('hidden');
  navLastHtml = null;
  side.innerHTML = `
    <div class="nav-pane-head">
      <span class="t">${L('Scènes','Scenes')}</span>
      <span class="c">${count} ${L(count>1?'scènes':'scène', count>1?'scenes':'scene')} \u00b7 ${S.pagination.count} ${L(S.pagination.count>1?'pages':'page', S.pagination.count>1?'pages':'page')}</span>
    </div>
    <div class="nav-filter"><input type="text" id="navFilter" placeholder="${L('Filtrer les scènes…','Filter scenes…')}" value="${esc(S.navFilter||'')}" autocomplete="off"></div>
    <div class="nav-list" id="navList">${navListHtml()}</div>`;
  const f = side.querySelector('#navFilter');
  if(f) f.addEventListener('input', e=>{
    S.navFilter = e.target.value;
    const list = document.getElementById('navList');
    if(list) list.innerHTML = navListHtml();
  });
}
/* Rafraîchissement léger : on ne refait que la liste, jamais le champ de
   filtre — sinon la frappe dans ce champ se perdrait à chaque pagination.
   Et on ne réécrit le DOM QUE si le résultat a changé : la pagination est
   rejouée à chaque frappe, il serait absurde de reconstruire la liste des
   scènes à chaque lettre tapée au milieu d'une réplique. */
let navLastHtml = null;
function refreshNav(){
  if(!navVisible()){ navLastHtml = null; return; }
  const list = document.getElementById('navList');
  if(!list){ navLastHtml = null; renderNavPane(); return; }
  const html = navListHtml();
  /* L'en-tête (scènes · pages) se met à jour À CHAQUE passe : une nouvelle
     page peut apparaître sans que la liste des scènes change. */
  const head = document.querySelector('#sidePane .nav-pane-head .c');
  if(head){
    const count = getSceneBlocks().filter(b=>b.sceneId).length;
    const txt = `${count} ${L(count>1?'scènes':'scène', count>1?'scenes':'scene')} \u00b7 ${S.pagination.count} ${L(S.pagination.count>1?'pages':'page', S.pagination.count>1?'pages':'page')}`;
    if(head.textContent !== txt) head.textContent = txt;
  }
  if(html === navLastHtml) return;
  navLastHtml = html;
  list.innerHTML = html;
}
/* Déplacement du surlignage seul : appelé à chaque mouvement du curseur,
   donc volontairement sans reconstruction de la liste. */
let __navActive = { id:null, el:null };
function navSyncActive(){
  if(!navVisible()) return;
  const cur = currentSceneId();
  // PERFORMANCE. Le curseur bouge à chaque frappe, mais la scène courante rarement : si la même entrée est
  // déjà surlignée, il n'y a rien à faire (ni relire toute la liste, ni mesurer le panneau).
  const prev = __navActive;
  if(prev.id === cur && prev.el && prev.el.isConnected && prev.el.classList.contains('active')) return;
  let active = null;
  document.querySelectorAll('#navList .nav-item').forEach(d=>{
    const on = d.dataset.id === cur;
    d.classList.toggle('active', on);
    if(on) active = d;
  });
  if(active){
    const pane = document.getElementById('sidePane');
    const r = active.getBoundingClientRect(), pr = pane.getBoundingClientRect();
    if(r.top < pr.top + 4 || r.bottom > pr.bottom - 4) active.scrollIntoView({block:'nearest'});
  }
  __navActive = { id:cur, el:active };
}
/* Clic sur une scène : on pose le curseur au début de son entête sans
   reconstruire l'éditeur (donc sans perdre l'historique d'annulation ni
   la position de défilement des autres panneaux). */
function navGoScene(id){
  const div = document.querySelector('#page [data-id="' + id + '"]');
  if(!div) return;
  div.focus();
  const r = document.createRange();
  r.selectNodeContents(div); r.collapse(true);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
  div.scrollIntoView({block:'center', behavior:'smooth'});
  navSyncActive();
}

function readAloudBtnHtml(cls){
  return `<button class="btn btn-tw ${cls||''}${S.reading?' reading':''}" data-act="speakScene" title="${S.reading?L('Lecture en cours : cliquer pour arrêter','Reading in progress: click to stop'):L('Lire à voix haute la scène où se trouve le curseur','Read the scene where the cursor is aloud')}">${icon('speaker')} ${L('Lire','Read')}</button>`;
}
function updateReadBtns(){
  document.querySelectorAll('[data-act="speakScene"]').forEach(btn=>{
    btn.classList.toggle('reading', S.reading);
    btn.title = S.reading ? L('Lecture en cours : cliquer pour arrêter','Reading in progress: click to stop') : L('Lire à voix haute la scène où se trouve le curseur','Read the scene where the cursor is aloud');
  });
}
function stopReading(){
  if(!S.reading) return;
  S.reading = false;
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  updateReadBtns();
}
/* Lit la scène qui contient la ligne éditée en dernier (voir
   lastFocusedLineId, mis à jour à chaque focus d'une ligne) — PAS la ligne
   qui a le focus DOM au moment du clic : cliquer sur le bouton "Lire"
   retire justement le focus de la ligne éditée pour le donner au bouton
   lui-même, donc document.activeElement pointait sur le bouton et le
   scénario retombait systématiquement sur sa première scène quel que soit
   l'endroit où l'on écrivait. Entête, actions, personnages et répliques
   sont lus dans l'ordre — les parenthétiques sont sautés, comme un acteur
   qui lit son texte sans les didascalies. Un seul clic pour lancer, un
   seul pour arrêter en cours de lecture. */
/* Voix disponibles pour la lecture, dans la langue de l'interface quand
   c'est possible (repli sur toutes les voix du navigateur sinon — certains
   navigateurs/OS n'ont qu'une voix française ou anglaise installée). */
function readingVoices(){
  const all = (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
  const prefix = getLang()==='en' ? 'en' : 'fr';
  const matching = all.filter(v=>v.lang && v.lang.toLowerCase().startsWith(prefix));
  return matching.length ? matching : all;
}
/* ---------- Table Read : une voix par personnage (WriterDuet) ----------
   Emprunté à WriterDuet ("Table Read") : chaque personnage de la scène
   reçoit automatiquement une voix distincte parmi celles installées sur
   l'appareil (l'entête et les actions gardent la première voix, en guise
   de narrateur) — pour repérer d'une oreille qui parle, sans avoir à
   attribuer les voix soi-même. Rien n'est configurable : ça marche tout
   seul avec les voix déjà présentes sur l'ordinateur ou le téléphone. */
function speakScene(){
  if(!S.project) return;
  if(S.reading){ stopReading(); return; }
  if(!('speechSynthesis' in window)){ toast(L('La lecture à voix haute n\u2019est pas prise en charge par ce navigateur.','Reading aloud isn\u2019t supported by this browser.')); return; }
  const blocks = getSceneBlocks().filter(b=>b.sceneId);
  let block = lastFocusedLineId ? blocks.find(b=> b.elements.some(e=>e.id===lastFocusedLineId)) : null;
  if(!block) block = blocks[0];
  if(!block){ toast(L('Aucune scène à lire.','No scene to read.')); return; }
  const segs = block.elements
    .filter(e=>e.type!=='parenthetical')
    .map(e=>({type:e.type, text:(e.text||'').trim()}))
    .filter(s=>s.text);
  if(!segs.length){ toast(L('Cette scène est vide.','This scene is empty.')); return; }
  window.speechSynthesis.cancel();
  const lang = getLang()==='en' ? 'en-US' : 'fr-FR';
  const pool = readingVoices();
  const narratorVoice = pool[0] || null;
  const charVoices = {};
  let usedCount = 0;
  let currentVoice = narratorVoice;
  segs.forEach((s, idx)=>{
    const utter = new SpeechSynthesisUtterance(s.text);
    utter.lang = lang;
    if(s.type === 'character'){
      const base = characterBaseName(s.text);
      if(base && !charVoices[base]){
        usedCount++;
        charVoices[base] = pool.length ? pool[usedCount % pool.length] : null;
      }
      currentVoice = base ? charVoices[base] : narratorVoice;
      utter.voice = currentVoice;
    } else if(s.type === 'dialogue'){
      utter.voice = currentVoice;
    } else {
      utter.voice = narratorVoice;
    }
    if(idx === segs.length - 1){
      utter.onend = utter.onerror = ()=>{ S.reading = false; updateReadBtns(); };
    }
    window.speechSynthesis.speak(utter);
  });
  S.reading = true; updateReadBtns();
}

/* ---------- Dictée vocale (Ctrl+Maj+D) ----------
   Emprunté à WriterDuet ("Dictate") : dicter une réplique ou une action au
   micro plutôt que la taper — pratique pour tester si un dialogue sonne
   juste à voix haute, ou pour écrire les mains libres. Repose sur la
   reconnaissance vocale du navigateur (Web Speech API), absente de Firefox
   à ce jour : un message le signale plutôt que d'échouer en silence,
   exactement comme speakScene() le fait déjà pour la synthèse vocale.
   Le texte reconnu est inséré dans la DERNIÈRE LIGNE ÉDITÉE
   (lastFocusedLineId, déjà tenu à jour pour la lecture à voix haute), en
   modifiant el.text puis en rejouant les mêmes étapes que onLineInput —
   autodétection du type, mentions de continuité, autocomplétion,
   pagination, sauvegarde — donc rien de spécifique à entretenir en
   parallèle du reste de l'éditeur. */
function dictationSupported(){ return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
function dictationTitle(){
  return S.dictating
    ? L('Dictée en cours : cliquer pour arrêter','Dictation in progress: click to stop')
    : L('Dicter du texte dans la ligne en cours','Dictate text into the current line');
}
function dictateBtnHtml(cls){
  return `<button class="btn btn-tw ${cls||''}${S.dictating?' reading':''}" data-act="toggleDictation" title="${dictationTitle()}">${icon('mic')} ${L('Dicter','Dictate')}</button>`;
}
function updateDictateBtns(){
  document.querySelectorAll('[data-act="toggleDictation"]').forEach(btn=>{
    btn.title = dictationTitle();
    btn.classList.toggle('reading', S.dictating);
  });
}
function stopDictation(){
  if(!S.dictating) return;
  S.dictating = false;
  if(S.recognizer){ try{ S.recognizer.stop(); }catch(e){} }
  S.recognizer = null;
  updateDictateBtns();
}
function insertDictatedText(text){
  const id = lastFocusedLineId;
  const pageEl = document.getElementById('page');
  const div = id && pageEl && pageEl.querySelector('.line[data-id="'+id+'"]');
  const el = id && findEl(id);
  if(!div || !el) return;
  const sep = el.text && !/\s$/.test(el.text) ? ' ' : '';
  el.text = (el.text || '') + sep + text;
  div.textContent = el.text;
  div.dataset.empty = el.text ? '' : '1';
  autoDetect(el, div);
  refreshContdMarks();
  updateAutocomplete(div, el);
  schedulePaginate();
  scheduleAutosave();
  focusDiv(div, el.text.length);
}
function toggleDictation(){
  if(S.dictating){ stopDictation(); return; }
  if(!dictationSupported()){ toast(L('La dictée vocale n\u2019est pas prise en charge par ce navigateur.','Voice dictation isn\u2019t supported by this browser.')); return; }
  if(!lastFocusedLineId){ toast(L('Place d\u2019abord le curseur sur la ligne à compléter.','First place the cursor on the line to fill in.')); return; }
  const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new RecognitionCtor();
  rec.lang = getLang()==='en' ? 'en-US' : 'fr-FR';
  rec.continuous = true;
  rec.interimResults = false;
  rec.onresult = ev=>{
    for(let i = ev.resultIndex; i < ev.results.length; i++){
      if(!ev.results[i].isFinal) continue;
      const text = (ev.results[i][0].transcript || '').trim();
      if(text) insertDictatedText(text);
    }
  };
  // La plupart des moteurs coupent le micro tout seuls après un court
  // silence : tant que l'utilisateur n'a pas cliqué sur « Arrêter », on
  // relance aussitôt, pour un fonctionnement continu comme dans WriterDuet.
  rec.onend = ()=>{ if(S.dictating){ try{ rec.start(); }catch(e){ stopDictation(); } } };
  rec.onerror = ()=>{ stopDictation(); };
  S.recognizer = rec;
  S.dictating = true;
  updateDictateBtns();
  try{ rec.start(); }catch(e){ S.dictating = false; S.recognizer = null; updateDictateBtns(); }
}

function scheduleAutosave(){
  markDot('saving');
  clearTimeout(S.saveTimer);
  S.saveTimer = setTimeout(doAutosave, 1200);
}
async function doAutosave(){
  if(!S.project) return;
  S.project.updatedAt = Date.now();
  await storSet(proj_key(S.project.id), S.project);
  const entry = S.projectsIndex.find(p=>p.id===S.project.id);
  if(entry){
    entry.title = S.project.title; entry.updatedAt = S.project.updatedAt; entry.format = S.project.format;
    entry.kind = S.project.kind;
    entry.seriesId = S.project.seriesId || null;
    entry.seriesName = S.project.seriesName || '';
    entry.season = S.project.season || null;
    entry.episode = S.project.episode || null;
    entry.seasonName = S.project.seasonName || '';
  }
  await saveIndex();
  markDot('saved');
}
function flushAutosave(){
  // ensure the very last edit is written before navigating away from a
  // project (e.g. going home or starting a new one), instead of relying on
  // the 1.2s debounce timer which might not have fired yet
  if(S.saveTimer){ clearTimeout(S.saveTimer); S.saveTimer=null; }
  if(S.project) doAutosave();
}
function markDot(state){
  const dot = document.getElementById('saveDot'); const label = document.getElementById('saveLabel');
  if(!dot) return;
  if(state==='saving'){ dot.classList.add('saving'); if(label) label.textContent=L('Sauvegarde…','Saving…'); }
  else{ dot.classList.remove('saving'); if(label) label.textContent=L('Sauvegardé','Saved'); }
}

/* =====================================================================
   MODEL HELPERS
===================================================================== */
function newElement(type, text){ return { id: uid('el'), type: type||'action', text: text||'' }; }

/* `seriesMeta`, quand fourni ({seriesId, seriesName, season, episode}), fait
   de ce projet un ÉPISODE : il reste un projet comme un autre (mêmes
   éléments, même moteur d'édition et d'export), mais il porte en plus un
   identifiant de série commun à tous ses épisodes. C'est ce seul
   identifiant partagé qui permet de les regrouper sur l'accueil et dans le
   hub de série, et de les exporter ensemble. */
function newProject(title, format, kind, seriesMeta){
  const id = uid('proj');
  const p = {
    // kind vaut '' quand on ne veut RIEN afficher sous le titre (cas d'un
    // scénario importé : on ne sait pas s'il s'agit d'un court, d'un long ou
    // d'un pilote, et une étiquette inventée se retrouvait imprimée sur la
    // page de titre). Seul un kind absent retombe sur la valeur par défaut.
    id, title: title || L('Sans titre','Untitled'), format: format || 'fr',
    kind: (kind === undefined || kind === null) ? 'Long métrage' : kind,
    author:'', contact:'', version:'1', date:new Date().toISOString().slice(0,10),
    titlePageExtra:'',
    createdAt: Date.now(), updatedAt: Date.now(),
    elements: [ newElement('scene',''), newElement('action','') ],
    sceneMeta:{}, personalNotes:'', graveyard:[], versions:[],
    tagDefs:{}, structure:{ beats:[] },
    settings:{ showSceneNumbers:true, numberStart:1, titlePageEnabled:true,
               showPageNumbers:true, numberFirstPage:true, pageNumberStart:1, showContinued:true,
               numbersLocked:false, lineSpacing:'standard',
               autoContd:true, contdMark:'auto', watermarkText:'', scriptFont:'courier-prime' },
    titlePageDesign: defaultTPDesign(),
    seriesId:null, seriesName:'', season:null, episode:null, seasonName:''
  };
  if(seriesMeta){
    p.seriesId = seriesMeta.seriesId;
    p.seriesName = seriesMeta.seriesName || title || 'Série';
    p.season = Math.max(1, seriesMeta.season || 1);
    p.episode = Math.max(1, seriesMeta.episode || 1);
    p.seasonName = seriesMeta.seasonName || '';
  }
  return p;
}
/* Entrée d'index correspondant à un projet : c'est cette version allégée
   (sans les éléments du scénario) qui vit dans scriptmm_projects_index et
   sert à afficher l'accueil et le hub de série sans recharger chaque
   projet complet. */
function indexEntryFor(p){
  return { id:p.id, title:p.title, format:p.format, updatedAt:p.updatedAt, kind:p.kind,
           seriesId:p.seriesId||null, seriesName:p.seriesName||'', season:p.season||null, episode:p.episode||null,
           seasonName:p.seasonName||'' };
}
function defaultTPDesign(){
  return {
    font:'mono', align:'center',
    titleFont:'', subFont:'', byFont:'', authorFont:'', extraFont:'', footFont:'',          // v51 : '' = comme la page
    titleColor:'', subColor:'', byColor:'', authorColor:'', extraColor:'', footColor:'',
    titleAlign:'', subAlign:'', byAlign:'', authorAlign:'', extraAlign:'', footAlign:'',
    bySize:'', extraSize:'', fmt:{},
    titleSize:20, subSize:12, authorSize:12, footSize:10,
    color:'#23262E', bg:'#ffffff',
    pattern:'none', patternColor:'#000000',
    bgImage:null, bgImageOpacity:1,
    drawing:null,
    titleHidden:false,      // v79 : titre rendu invisible (il garde sa place, le reste de la page ne bouge pas)
    freeImg:null            // v79 : {src, x, y, w, h} en % de la page — image libre à la place du titre
  };
}
/* Interligne du scénario : « standard » (1,0 — normes du métier) ou « comfort » (1,5). */
function applyLineSpacing(p){
  // v49 : la grille de page est TOUJOURS la grille standard du métier (interligne simple, 6 lignes au pouce,
  // ~58 lignes par page), comme WriterDuet. L'ancien réglage « Confortable » (1,5) divisait la capacité d'une
  // page par deux : c'est ce qui faisait démarrer la page suivante vers la ligne 30 dans certains scénarios.
  document.documentElement.classList.add('ls-std');
}
function ensureSettings(p){
  /* Les projets créés avant la pagination n'ont pas ces réglages : on les
     complète à l'ouverture plutôt que de laisser des undefined se propager
     jusque dans le moteur de pagination. */
  const d = { showSceneNumbers:true, numberStart:1, titlePageEnabled:true,
              showPageNumbers:true, numberFirstPage:false, pageNumberStart:1, showContinued:true,
              numbersLocked:false, lineSpacing:'standard',
              autoContd:true, contdMark:'auto', watermarkText:'', scriptFont:'courier-prime' };
  if(!p.settings) p.settings = {};
  fpMigrateLegacy(p);
  // Projets antérieurs au réglage : les pages verrouillées gardent l'ancien interligne (rien ne bouge sans demande).
  const hadLock = !!(p.pageLock && Array.isArray(p.pageLock.pages) && p.pageLock.pages.length);
  const wasComfort = p.settings.lineSpacing === 'comfort' || (p.settings.lineSpacing === undefined && hadLock);
  for(const k in d) if(p.settings[k]===undefined) p.settings[k] = d[k];
  // v49 : migration vers la grille standard (voir applyLineSpacing). Des pages verrouillées sous l'ancien interligne
  // ne peuvent plus correspondre à la nouvelle grille : leurs ancres imposeraient des sauts de page trop tôt. On les
  // met de côté (pageLockArchive) au lieu de les appliquer.
  if(p.settings.lineSpacing !== 'standard') p.settings.lineSpacing = 'standard';
  if(wasComfort && hadLock && !p.pageLock.std){ p.pageLockArchive = p.pageLock; p.pageLock = null; }
  return p.settings;
}
/* Les projets créés avant l'onglet Structure n'ont pas ce champ. */
function ensureStructure(p){
  if(!p.structure || !Array.isArray(p.structure.beats)) p.structure = { beats:[] };
  return p.structure;
}
const STRUCTURE_COLORS = ['#3699D4','#2F9E44','#D64545','#E8A33D','#8854D0','#20B2AA','#DB5A9C','#6C757D'];
/* Gabarits de structure classiques : pré-remplissent des cartes vides avec
   les jalons attendus (titre + une phrase expliquant le rôle du beat), pour
   partir d'un cadre à remplir plutôt que d'une page blanche. Toujours
   AJOUTÉS à la suite de la structure existante — jamais de remplacement
   silencieux d'un travail déjà en cours. */
const STRUCTURE_TEMPLATES = {
  stc: {
    label: ()=>L('Save the Cat (15 beats)','Save the Cat (15 beats)'),
    beats: ()=>[
      [L('Image d\u2019ouverture','Opening Image'), L('Le tout premier instant du film : montre le monde et le héros \u00ab avant \u00bb, pose le ton.','The very first moment of the film: shows the world and the hero \u201cbefore\u201d, sets the tone.')],
      [L('Énoncé du thème','Theme Stated'), L('Quelqu\u2019un (souvent pas le héros) énonce, sans le savoir, la leçon que le héros devra apprendre.','Someone (often not the hero) states, without realizing it, the lesson the hero will have to learn.')],
      [L('Mise en place','Setup'), L('Présente le héros, son quotidien, ses manques, les enjeux — tout ce qui va être bouleversé.','Introduces the hero, their daily life, their flaws, the stakes — everything about to be upended.')],
      [L('Catalyseur','Catalyst'), L('L\u2019événement qui déclenche tout : plus rien ne sera comme avant.','The event that sets everything in motion: nothing will be the same again.')],
      [L('Débat','Debate'), L('Le héros hésite, doute, résiste avant de s\u2019engager dans l\u2019aventure.','The hero hesitates, doubts, resists before committing to the journey.')],
      [L('Passage à l\u2019acte 2','Break into Two'), L('Le héros fait le choix actif de plonger dans le nouveau monde. Fin de l\u2019acte 1.','The hero actively chooses to dive into the new world. End of act 1.')],
      [L('Intrigue secondaire','B Story'), L('Une relation ou sous-intrigue qui porte souvent le thème du film.','A relationship or subplot that often carries the film\u2019s theme.')],
      [L('Jeux et réjouissances','Fun and Games'), L('La \u00ab promesse de la prémisse \u00bb : le héros explore le nouveau monde, ce pour quoi on est venu voir le film.','The \u201cpromise of the premise\u201d: the hero explores the new world — what the audience came to see.')],
      [L('Point médian','Midpoint'), L('Fausse victoire ou fausse défaite ; les enjeux montent, souvent une horloge se met en marche.','A false victory or false defeat; the stakes rise, often a clock starts ticking.')],
      [L('Les méchants resserrent l\u2019étau','Bad Guys Close In'), L('Les forces antagonistes (externes et internes) se referment sur le héros.','The antagonistic forces (external and internal) close in on the hero.')],
      [L('Tout est perdu','All Is Lost'), L('Le point le plus bas : le héros perd tout (parfois symbolisé par une \u00ab odeur de mort \u00bb).','The lowest point: the hero loses everything (sometimes symbolized by a \u201cwhiff of death\u201d).')],
      [L('Nuit noire de l\u2019âme','Dark Night of the Soul'), L('Le héros touche le fond émotionnellement, avant de trouver la solution.','The hero hits emotional rock bottom, just before finding the solution.')],
      [L('Passage à l\u2019acte 3','Break into Three'), L('Grâce à la leçon du thème, le héros trouve la solution et passe à l\u2019action finale.','Thanks to the theme\u2019s lesson, the hero finds the solution and moves into the final action.')],
      [L('Finale','Finale'), L('Le héros affronte l\u2019antagoniste et résout l\u2019histoire en appliquant ce qu\u2019il a appris.','The hero confronts the antagonist and resolves the story by applying what they\u2019ve learned.')],
      [L('Image finale','Final Image'), L('Miroir inversé de l\u2019image d\u2019ouverture : montre à quel point le héros (ou le monde) a changé.','Mirror opposite of the opening image: shows how much the hero (or the world) has changed.')],
    ]
  },
  seq8: {
    label: ()=>L('3 actes / 8 séquences','3 acts / 8 sequences'),
    beats: ()=>[
      [L('Statu quo','Status Quo'), L('Présentation du héros et de son monde avant que tout bascule.','Introduces the hero and their world before everything changes.')],
      [L('Élément perturbateur','Inciting Incident'), L('Ce qui vient briser l\u2019équilibre initial et lancer l\u2019histoire.','What breaks the initial balance and sets the story in motion.')],
      [L('Premier point de pivot (fin Acte 1)','First Turning Point (end of Act 1)'), L('Le héros s\u2019engage activement dans le conflit principal.','The hero actively commits to the main conflict.')],
      [L('Premiers obstacles','First Obstacles'), L('Le héros affronte les premières difficultés du nouveau contexte.','The hero faces the first difficulties of the new situation.')],
      [L('Point médian','Midpoint'), L('Un retournement majeur qui relance l\u2019histoire et augmente les enjeux.','A major reversal that relaunches the story and raises the stakes.')],
      [L('Complications croissantes','Rising Complications'), L('Les obstacles s\u2019intensifient, la situation du héros se dégrade.','The obstacles intensify, the hero\u2019s situation worsens.')],
      [L('Crise / Tout est perdu (fin Acte 2)','Crisis / All Is Lost (end of Act 2)'), L('Le point le plus bas, juste avant le dernier sursaut.','The lowest point, right before the final push.')],
      [L('Climax et résolution (Acte 3)','Climax and Resolution (Act 3)'), L('Confrontation finale et dénouement de l\u2019histoire.','Final confrontation and resolution of the story.')],
    ]
  }
};
function ensureTPDesign(p){
  if(!p.titlePageDesign) p.titlePageDesign = defaultTPDesign();
  else{
    const d = defaultTPDesign();
    for(const k in d) if(p.titlePageDesign[k]===undefined) p.titlePageDesign[k] = d[k];
  }
  // Le fond de la page de titre doit toujours rester blanc pur, quel que
  // soit ce qu'un projet plus ancien avait pu enregistrer (l'édition de
  // cette couleur n'est plus proposée).
  p.titlePageDesign.bg = '#ffffff';
  // v79 : l'image libre voyage avec le projet (.smmproj) — on vérifie qu'elle est complète après un import.
  const fi = p.titlePageDesign.freeImg;
  if(fi){
    const ok = typeof fi.src==='string' && /^data:image\//.test(fi.src) && [fi.x,fi.y,fi.w,fi.h].every(v=>typeof v==='number' && isFinite(v)) && fi.w>0 && fi.h>0;
    if(!ok) p.titlePageDesign.freeImg = null;
  }
  // v96 : textes libres — on ne garde que des entrées complètes (après un import par exemple).
  const tx = p.titlePageDesign.texts;
  if(tx !== undefined){
    const ok = Array.isArray(tx) ? tx.filter(t=>t && typeof t.id==='string' && /^tx[a-z0-9]+$/.test(t.id) && typeof t.text==='string') : [];
    if(ok.length) p.titlePageDesign.texts = ok; else delete p.titlePageDesign.texts;
  }
  return p.titlePageDesign;
}

function snapshot(){
  /* Copie profonde SANS passer par JSON.stringify/parse du scénario entier (le coût de chaque Entrée croissait
     avec la taille du scénario). Les éléments sont de petits objets plats : on copie chacun, et seules les
     valeurs imbriquées (ex. le style d'un carton) sont dupliquées en profondeur. Résultat identique. */
  const src = S.project.elements, out = new Array(src.length);
  for(let i = 0; i < src.length; i++){
    const c = Object.assign({}, src[i]);
    for(const k in c){ const v = c[k]; if(v !== null && typeof v === 'object') c[k] = JSON.parse(JSON.stringify(v)); }
    out[i] = c;
  }
  return out;
}
function pushUndo(){
  S.undoStack.push(snapshot());
  if(S.undoStack.length>60) S.undoStack.shift();
  S.redoStack = [];
}
function doUndo(){
  if(!S.undoStack.length) return;
  S.redoStack.push(snapshot());
  S.project.elements = S.undoStack.pop();
  scheduleAutosave(); (S.tab==='cards' ? renderTabBody() : renderEditorTab());
}
function doRedo(){
  if(!S.redoStack.length) return;
  S.undoStack.push(snapshot());
  S.project.elements = S.redoStack.pop();
  scheduleAutosave(); (S.tab==='cards' ? renderTabBody() : renderEditorTab());
}

function getSceneBlocks(){
  const els = S.project.elements;
  const blocks = []; let cur = null;
  els.forEach((el, idx)=>{
    if(el.type==='scene'){ cur = { sceneId: el.id, elements:[el] }; blocks.push(cur); }
    else if(cur){ cur.elements.push(el); }
    else{
      if(!blocks.length || blocks[0].sceneId!==null){ blocks.unshift({sceneId:null, elements:[]}); }
      blocks[0].elements.push(el);
    }
  });
  return blocks;
}
/* =====================================================================
   VERROUILLAGE DES NUMÉROS DE SCÈNE (WriterDuet : "Lock Scene Numbers")
   -----------------------------------------------------------------
   Sur un plateau, les numéros de scène servent de repère à toute l'équipe
   (feuille de service, rapports de continuité…) : une fois le découpage
   distribué, on ne veut plus JAMAIS qu'ajouter ou supprimer une scène
   décale tous les numéros suivants. La pratique du métier — reprise ici
   telle quelle — est de figer les numéros existants et de donner aux
   scènes insérées ensuite une lettre accolée au numéro qui les précède
   (12, puis 12A, 12B… avant que 13 ne revienne). Les numéros restent
   figés dans sceneMeta(id).lockedNum tant que le verrou est actif ;
   le déverrouiller revient à une numérotation séquentielle normale. */
function sceneNumbers(){
  const blocks = getSceneBlocks().filter(b=>b.sceneId);
  const map = {};
  if(!S.project.settings.numbersLocked){
    let n = S.project.settings.numberStart||1;
    blocks.forEach(b=>{ map[b.sceneId]=n; n++; });
    return map;
  }
  let lastLocked = S.project.settings.numberStart||1, letterIdx = 0;
  blocks.forEach(b=>{
    const meta = sceneMeta(b.sceneId);
    if(meta.lockedNum){
      map[b.sceneId] = meta.lockedNum;
      lastLocked = meta.lockedNum;
      letterIdx = 0;
    } else {
      letterIdx++;
      map[b.sceneId] = String(lastLocked) + String.fromCharCode(64+letterIdx); // A, B, C…
    }
  });
  return map;
}
/* Fige dans sceneMeta les numéros actuellement affichés (appelé au moment
   où le verrou passe de désactivé à activé). */
function lockCurrentSceneNumbers(){
  const nums = sceneNumbers(); // encore en mode séquentiel : le verrou n'est pas encore posé
  getSceneBlocks().filter(b=>b.sceneId).forEach(b=>{ sceneMeta(b.sceneId).lockedNum = nums[b.sceneId]; });
}
/* Efface les numéros figés (appelé quand le verrou est retiré), pour que
   le reverrouiller plus tard reparte d'une numérotation fraîche plutôt que
   de réutiliser d'anciennes valeurs devenues incohérentes. */
function unlockSceneNumbers(){
  getSceneBlocks().filter(b=>b.sceneId).forEach(b=>{ delete sceneMeta(b.sceneId).lockedNum; });
}
function sceneMeta(sceneId){
  if(!S.project.sceneMeta[sceneId]) S.project.sceneMeta[sceneId] = { tags:[], outline:'', color:'' };
  return S.project.sceneMeta[sceneId];
}
function wordCount(str){ const t = (str||'').trim(); return t? t.split(/\s+/).length : 0; }
function visibleElements(){
  return S.project.elements.filter(e=>e.type!=='note');
}
function fullText(){ return S.project.elements.map(e=>e.text).join(' '); }

/* Nom d'un personnage utilisé pour le REGROUPER (liste des personnages,
   fiches, filtres de scènes, cartes). Une ligne « Personnage » peut porter
   une extension entre parenthèses juste après le nom — (CONT'D), (V.O.),
   (O.S.), (O.C.), (À LA RADIO)… — qui indique COMMENT la réplique est
   dite, pas QUI la dit : PIERRE et PIERRE (CONT'D) sont le même
   personnage, et doivent compter comme un seul dans la liste, exactement
   comme dans Final Draft ou WriterDuet. On retire donc la dernière
   parenthèse de fin de ligne pour l'identité du personnage — jamais celle
   du texte réellement affiché à l'écran/à l'export, qui garde l'extension. */
function characterBaseName(text){
  // On retire TOUTES les parenthèses finales, pas seulement la dernière :
  // une ligne peut en porter deux à la fois — « PIERRE (V.O.) (CONT'D) » est
  // la forme standard quand une voix off reprend après une interruption.
  let t = (text||'').trim();
  let prev;
  do { prev = t; t = t.replace(/\s*\([^()]*\)\s*$/,'').trim(); } while(t !== prev);
  return t.toUpperCase();
}

/* =====================================================================
   EXTENSIONS DE PERSONNAGE — (CONT'D), (V.O.), (O.S.)…
   ---------------------------------------------------------------------
   Une extension se place entre parenthèses juste après le nom et dit
   COMMENT la réplique est dite, pas qui la dit. La liste proposée suit la
   LANGUE de l'interface (pas le format du projet) : en anglais, seuls les
   termes américains essentiels et reconnus du métier ; en français, la
   liste complète des termes français. Comme ça, pas de terme français qui
   traîne dans la version anglaise, et inversement. C'est ce qui s'affiche
   quand on tape « ( » sur une ligne Personnage.
===================================================================== */
const CHAR_EXTENSIONS = {
  fr: [
    ["(SUITE)",             ['reprend la parole après une interruption', 'resumes speaking after being interrupted']],
    ["(V.O.)",              ['voix off : pensée, narration, lettre lue', 'voice-over: thoughts, narration, a letter being read']],
    ["(HORS CHAMP)",        ['présent dans la scène, mais pas à l\u2019image', 'present in the scene, but not on screen']],
    ["(OFF)",               ['abrégé courant de hors champ', 'common shorthand for off-screen']],
    ["(AU TÉLÉPHONE)",      ['voix entendue dans le combiné', 'voice heard through the phone']],
    ["(À LA RADIO)",        ['voix diffusée par un haut-parleur', 'voice broadcast through a speaker']],
    ["(À LA TÉLÉ)",         ['voix venant d\u2019un téléviseur ou d\u2019un écran', 'voice coming from a television or a screen']],
    ["(RÉPONDEUR)",         ['voix enregistrée sur un répondeur ou une messagerie', 'voice recorded on an answering machine or voicemail']],
    ["(VOIX DÉFORMÉE)",     ['voix altérée : machine, masque, talkie-walkie…', 'altered voice: a device, a mask, a walkie-talkie…']],
    ["(CHANTÉ)",            ['réplique chantée', 'sung line']],
    ["(MURMURÉ)",           ['réplique dite à voix basse', 'line said in a low voice']],
    ["(CRIÉ)",              ['réplique criée', 'shouted line']],
    ["(SOUS-TITRÉ)",        ['réplique sous-titrée à l\u2019écran', 'line subtitled on screen']],
    ["(PRÉ-SON)",           ['la réplique commence avant que la scène suivante n\u2019apparaisse à l\u2019image (transition sonore)', 'the line starts before the next scene appears on screen (a sound transition)']],
  ],
  /* Volontairement plus courte : seulement les codes américains essentiels
     et couramment reconnus (Final Draft, WGA), pas une liste exhaustive. */
  us: [
    ["(CONT'D)",            ['reprend la parole après une interruption', 'resumes speaking after being interrupted']],
    ["(V.O.)",              ['voix off : pensée, narration, lettre lue', 'voice-over: thoughts, narration, a letter being read']],
    ["(O.S.)",              ['off screen : présent mais pas à l\u2019image', 'off-screen: present but not on screen']],
    ["(O.C.)",              ['off camera : hors cadre', 'off-camera: outside the frame']],
    ["(INTO PHONE)",        ['parle dans le combiné', 'speaking into the phone']],
    ["(ON RADIO)",          ['voix diffusée par un haut-parleur', 'voice broadcast through a speaker']],
    ["(SINGING)",           ['réplique chantée', 'sung line']],
    ["(SUBTITLED)",         ['réplique sous-titrée à l\u2019écran', 'line subtitled on screen']],
  ]
};
/* CORRECTIF I18N. charExtensions() renvoyait directement la description
   française : figée dans le HTML du menu, elle ne changeait jamais avec la
   langue de l'interface. On choisit maintenant la description via L() à
   chaque appel, c'est-à-dire à chaque frappe qui redessine le menu.
   La liste elle-même (les codes proposés) suit désormais la langue de
   l'interface, plus le format du projet : en anglais on ne propose que la
   liste américaine essentielle, en français la liste française complète. */
function charExtensions(){
  const list = CHAR_EXTENSIONS[getLang()==='en' ? 'us' : 'fr'];
  return list.map(([code, desc]) => [code, L(desc[0], desc[1])]);
}

/* Une extension de type « suite » est-elle DÉJÀ présente sur cette ligne ?
   C'est ce test qui fait que les scénarios importés gardent les (CONT'D)
   qu'ils portaient déjà, sans en recevoir un second par-dessus. Toutes les
   graphies rencontrées dans la nature sont acceptées : (CONT'D), (CONTD),
   (CONT.), (CONTINUED), (SUITE), (suite)… */
const CONTD_RE = /\(\s*(cont'?d\.?|contd\.?|continued|suite)\s*\)/i;
function hasContdMark(text){ return CONTD_RE.test(text || ''); }

/* Quelles lignes Personnage doivent recevoir une mention de continuité ?
   RÈGLE (celle de WriterDuet et de Final Draft) : le même personnage
   reprend la parole plus loin dans LA MÊME SCÈNE, sans qu'un autre
   personnage se soit exprimé entre-temps. Une nouvelle scène ou une
   transition remettent le compteur à zéro.

   La mention n'est JAMAIS écrite dans le texte de la ligne : elle est
   calculée à l'affichage et à l'export. Conséquence directe : déplacer une
   scène, supprimer la réplique qui interrompait, ou couper l'option la font
   apparaître ou disparaître toute seule, sans laisser de résidu à nettoyer
   à la main dans le script. */
function contdMap(els){
  const st = S.project && S.project.settings;
  if(!st || !st.autoContd) return {};
  // La mention suit la langue de l'interface par défaut ('auto'), mais peut
  // être figée sur une graphie précise — (SUITE) ou (CONT'D) — indépendamment
  // de la langue, via le menu « Mention utilisée » des Paramètres.
  const mark = (st.contdMark==='suite') ? '(SUITE)'
             : (st.contdMark==='contd') ? "(CONT'D)"
             : L('(SUITE)', "(CONT'D)");
  const out = {};
  let lastSpeaker = null;
  (els||[]).forEach(el=>{
    if(el.type === 'scene' || el.type === 'transition'){ lastSpeaker = null; return; }
    if(el.type !== 'character') return;
    const base = characterBaseName(el.text);
    if(base && base === lastSpeaker && !hasContdMark(el.text)) out[el.id] = mark;
    lastSpeaker = base || null;
  });
  return out;
}
/* Texte d'une ligne Personnage tel qu'il doit SORTIR (export, PDF, mesure) :
   nom tapé + mention de continuité éventuelle. */
function contdText(el, marks){
  const m = marks && marks[el.id];
  return m ? ((el.text || '') + ' ' + m) : (el.text || '');
}
/* Pose/retire l'attribut data-contd sur les lignes Personnage de l'éditeur.
   La mention est rendue par un ::after en CSS, donc elle n'existe pas dans
   le contenu éditable : impossible de placer le curseur dedans, de
   l'effacer par mégarde, ou de la voir remonter dans el.text. */
let __contdPrev = null;
function refreshContdMarks(){
  const page = document.getElementById('page');
  if(!page) return;
  const marks = contdMap(S.project.elements);
  // CORRECTIF « (SUITE) collé dans le mot en cours de frappe ». Cette
  // fonction tourne à CHAQUE frappe (voir onLineInput), sur TOUTES les
  // lignes Personnage, y compris celle qu'on est en train de taper. Or le
  // nom d'un personnage passe souvent, lettre après lettre, par un état qui
  // correspond exactement au nom d'un personnage précédent (ex. on tape
  // « MARC » avant de continuer en « MARCO », et « MARC » seul est déjà un
  // personnage antérieur) : la mention s'affichait alors une frappe sur
  // deux, juste après le caret, donnant l'impression qu'elle se collait au
  // milieu du mot. On ne touche donc jamais la ligne qui a le focus — la
  // mention s'y (ré)applique dès qu'on la quitte, voir onLineFocus.
  const activeDiv = document.activeElement && document.activeElement.closest
    ? document.activeElement.closest('.line--character') : null;
  const skipId = activeDiv ? activeDiv.dataset.id : null;
  // PERFORMANCE. Appelée à chaque frappe : quand ni les mentions, ni la ligne active, ni les lignes
  // Personnage n'ont changé, il n'y a rien à réécrire, inutile de relire tout le scénario.
  const chars = page.getElementsByClassName('line--character');
  let key = skipId + '|' + chars.length; for(const id in marks) key += '|' + id + '=' + marks[id];
  const P = __contdPrev;
  if(P && P.page === page && P.key === key && P.first === chars[0] && P.last === chars[chars.length - 1]) return;
  __contdPrev = { page, key, first: chars[0], last: chars[chars.length - 1] };
  page.querySelectorAll('.line--character').forEach(div=>{
    if(div.dataset.id === skipId) return;
    const m = marks[div.dataset.id];
    // On n'écrit l'attribut que s'il change : réécrire la même valeur sur des milliers de lignes
    // obligeait le navigateur à recalculer leurs styles à chaque Entrée.
    const cur = div.dataset.contd;
    if(m){ if(cur !== m) div.dataset.contd = m; } else if(cur !== undefined) delete div.dataset.contd;
  });
}

/* =====================================================================
   COMPLÉTION AUTOMATIQUE — noms de personnages / lieux de scène
   -----------------------------------------------------------------
   Inspiré du SmartType de Final Draft et de la complétion équivalente de
   WriterDuet : en tapant sur une ligne Personnage ou Scène, le début d'un
   nom déjà utilisé ailleurs dans le script est proposé en texte fantôme
   juste après le curseur ; Tab l'accepte, n'importe quelle autre touche
   l'annule (elle sera recalculée, si elle s'applique encore, au prochain
   caractère tapé). Rien n'est inséré dans le texte avant acceptation :
   la suggestion vit dans un calque à part (#acGhost), jamais dans le
   contentEditable, pour ne jamais perturber le caret ni l'historique
   d'annulation. */
function characterAutocompleteCandidates(){
  const freq = {};
  S.project.elements.forEach(e=>{
    if(e.type==='character'){
      const name = characterBaseName(e.text);
      if(name) freq[name] = (freq[name]||0) + 1;
    }
  });
  return Object.keys(freq).sort((a,b)=> freq[b]-freq[a] || a.localeCompare(b));
}
/* Même liste de préfixes que isSceneHeading()/autoDetect(), pour repérer
   où finit l'indicatif (INT./EXT./…) et où commence le LIEU proprement
   dit dans une en-tête de scène. */
const SCENE_PREFIX_RE = /^(INT\.\/EXT|EXT\.\/INT|INT\/EXT|INTERIEUR|EXTERIEUR|EST|INT|EXT)[.\s]+/i;
function sceneLocationPart(text){
  const t = text || '';
  const m = SCENE_PREFIX_RE.exec(t);
  if(!m) return null;
  return t.slice(m[0].length);
}
function sceneAutocompleteCandidates(){
  const freq = {};
  S.project.elements.forEach(e=>{
    if(e.type==='scene'){
      const loc = sceneLocationPart(e.text);
      if(loc==null) return;
      // On retire un éventuel « - MOMENT » final (JOUR/NUIT/…) : c'est le
      // LIEU qu'on veut retrouver en tapant, pas l'en-tête complète.
      const clean = loc.replace(/\s*-\s*[^-]*$/,'').trim().toUpperCase();
      if(clean) freq[clean] = (freq[clean]||0) + 1;
    }
  });
  return Object.keys(freq).sort((a,b)=> freq[b]-freq[a] || a.localeCompare(b));
}
function hideAutocomplete(){
  S.autocomplete = null;
  const g = document.getElementById('acGhost');
  if(g) g.style.display = 'none';
}
function showAutocompleteGhost(div, remainder){
  const rect = caretRect();
  if(!rect){ hideAutocomplete(); return; }
  let g = document.getElementById('acGhost');
  if(!g){
    g = document.createElement('div');
    g.id = 'acGhost';
    g.style.position = 'fixed';
    g.style.pointerEvents = 'none';
    g.style.whiteSpace = 'pre';
    g.style.zIndex = '60';
    g.style.color = 'var(--ink-soft)';
    g.style.opacity = '.5';
    document.body.appendChild(g);
  }
  const cs = getComputedStyle(div);
  g.style.font = cs.font;
  g.style.letterSpacing = cs.letterSpacing;
  g.style.textTransform = cs.textTransform;
  g.textContent = remainder;
  g.style.left = rect.right + 'px';
  g.style.top = rect.top + 'px';
  g.style.display = 'block';
}
/* Appelée à chaque frappe sur une ligne Personnage ou Scène : cherche,
   parmi les noms déjà utilisés, le premier qui commence par ce qui vient
   d'être tapé et propose le reste. Ne se déclenche que si le curseur est
   à la toute fin de la ligne (comme dans WriterDuet/Final Draft : on ne
   propose pas de complétion au milieu d'un mot qu'on modifie). */
function updateAutocomplete(div, el){
  if(el.type!=='character' && el.type!=='scene'){ hideAutocomplete(); return; }
  const sel = window.getSelection();
  const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
  const caretOffset = range ? getCaretOffset(div, range) : -1;
  const text = el.text || '';
  if(caretOffset !== text.length || !text.trim()){ hideAutocomplete(); return; }

  let candidates, typedKey;
  if(el.type==='character'){
    candidates = characterAutocompleteCandidates();
    typedKey = text.trim().toUpperCase();
  } else {
    const loc = sceneLocationPart(text);
    if(loc==null || !loc.trim()){ hideAutocomplete(); return; }
    candidates = sceneAutocompleteCandidates();
    typedKey = loc.trim().toUpperCase();
  }
  const match = candidates.find(c => c.length > typedKey.length && c.startsWith(typedKey));
  if(!match){ hideAutocomplete(); return; }
  const remainder = match.slice(typedKey.length);
  S.autocomplete = { id: el.id, remainder };
  showAutocompleteGhost(div, remainder);
}
/* =====================================================================
   MENU DES EXTENSIONS — s'ouvre en tapant « ( » après un nom de personnage
   ---------------------------------------------------------------------
   Même principe que la complétion fantôme : rien n'est inséré tant qu'on
   n'a pas choisi. La parenthèse ouvrante que l'on vient de taper reste
   normalement dans le texte — si on ignore le menu et qu'on continue à
   écrire son extension à la main, rien ne s'y oppose. Le menu se contente
   de proposer.

   Ce qui est tapé APRÈS la parenthèse filtre la liste : « (v » ne laisse
   que (V.O.). Entrée ou Tab insèrent, ↑/↓ naviguent, Échap referme.
===================================================================== */
function closeExtMenu(){
  S.extMenu = null;
  const m = document.getElementById('extMenu');
  if(m) m.remove();
}
/* Position du curseur dans la ligne, et texte tapé depuis la dernière
   parenthèse ouvrante non refermée. Renvoie null si on n'est pas dans ce
   cas — curseur ailleurs qu'en fin de ligne, parenthèse déjà refermée,
   ligne qui n'est pas un personnage. */
function extTypedPart(div, el){
  if(el.type !== 'character') return null;
  const sel = window.getSelection();
  const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
  const caret = range ? getCaretOffset(div, range) : -1;
  const text = el.text || '';
  if(caret !== text.length) return null;
  const open = text.lastIndexOf('(');
  if(open < 0) return null;
  const typed = text.slice(open + 1);
  if(typed.indexOf(')') >= 0) return null;   // extension déjà refermée
  return { open, typed };
}
function updateExtMenu(div, el){
  const part = extTypedPart(div, el);
  if(!part){ closeExtMenu(); return; }
  const needle = part.typed.trim().toUpperCase();
  const items = charExtensions().filter(([code])=>{
    if(!needle) return true;
    // On compare sans la parenthèse ni les points : taper « vo » doit
    // trouver (V.O.), et « os » (O.S.).
    const flat = code.replace(/[()\s.']/g, '').toUpperCase();
    return flat.startsWith(needle.replace(/[()\s.']/g, ''));
  });
  if(!items.length){ closeExtMenu(); return; }
  hideAutocomplete();                       // les deux ne cohabitent jamais
  const keep = S.extMenu && S.extMenu.id === el.id ? S.extMenu.sel : 0;
  S.extMenu = { id: el.id, sel: Math.min(keep, items.length - 1), items, open: part.open };
  drawExtMenu(div);
}
function drawExtMenu(div){
  const st = S.extMenu; if(!st) return;
  let m = document.getElementById('extMenu');
  if(!m){
    m = document.createElement('div');
    m.id = 'extMenu'; m.className = 'ext-menu';
    // mousedown plutôt que click : on doit empêcher le contentEditable de
    // perdre le focus, sinon le curseur saute avant l'insertion.
    m.addEventListener('mousedown', e=>{
      const b = e.target.closest('.ext-item'); if(!b) return;
      e.preventDefault();
      S.extMenu.sel = parseInt(b.dataset.i, 10);
      acceptExtMenu();
    });
    document.body.appendChild(m);
  }
  m.innerHTML = st.items.map(([code, desc], i)=>
    `<button class="ext-item ${i===st.sel?'sel':''}" data-i="${i}" type="button">
       <span class="ext-code">${esc(code)}</span>
       <span class="ext-desc">${esc(desc)}</span>
     </button>`).join('') +
    `<div class="ext-hint">${L('↑ ↓ pour choisir · Entrée pour insérer · Échap pour ignorer','↑ ↓ to choose · Enter to insert · Esc to dismiss')}</div>`;
  const r = caretRect();
  if(r){
    m.style.left = Math.min(r.left, window.innerWidth - m.offsetWidth - 12) + 'px';
    // Sous le curseur, sauf si ça dépasse en bas : dans ce cas au-dessus.
    const below = r.bottom + 6;
    m.style.top = (below + m.offsetHeight > window.innerHeight - 8
      ? Math.max(8, r.top - m.offsetHeight - 6) : below) + 'px';
  }
  const sel = m.querySelector('.ext-item.sel');
  if(sel) sel.scrollIntoView({ block:'nearest' });
}
function moveExtMenu(delta){
  const st = S.extMenu; if(!st) return;
  st.sel = (st.sel + delta + st.items.length) % st.items.length;
  const div = document.querySelector('#page [data-id="' + st.id + '"]');
  if(div) drawExtMenu(div);
}
function acceptExtMenu(){
  const st = S.extMenu; if(!st) return;
  const div = document.querySelector('#page [data-id="' + st.id + '"]');
  const el = findEl(st.id);
  if(!div || !el){ closeExtMenu(); return; }
  pushUndo();
  const code = st.items[st.sel][0];
  // On remplace tout depuis la parenthèse ouvrante, et on s'assure qu'un
  // espace sépare le nom de son extension.
  const head = (el.text || '').slice(0, st.open).replace(/\s+$/, '');
  el.text = (head ? head + ' ' : '') + code;
  div.textContent = el.text;
  div.dataset.empty = el.text ? '' : '1';
  closeExtMenu();
  refreshContdMarks();
  schedulePaginate();
  focusDiv(div, el.text.length);
  scheduleAutosave();
}

function characterStats(){
  const stats = {};
  let current = null;
  const sceneOf = {}; let curScene = null;
  S.project.elements.forEach(el=>{
    if(el.type==='scene') curScene = el.id;
    sceneOf[el.id]=curScene;
  });
  S.project.elements.forEach(el=>{
    if(el.type==='character'){
      const name = characterBaseName(el.text) || L('(SANS NOM)','(UNNAMED)');
      current = name;
      if(!stats[name]) stats[name] = { name, scenes:new Set(), dialogueLines:0, words:0 };
      stats[name].scenes.add(sceneOf[el.id]);
    } else if(el.type==='dialogue' && current){
      stats[current].dialogueLines++;
      stats[current].words += wordCount(el.text);
    } else if(el.type!=='parenthetical'){
      current = null;
    }
  });
  return Object.values(stats).sort((a,b)=> b.words - a.words);
}
function computeStats(){
  const els = S.project.elements;
  let words=0, chars=0, dialogues=0, scenes=0, weightedLines=0;
  els.forEach(e=>{
    if(e.type==='note') return;
    words += wordCount(e.text); chars += (e.text||'').length;
    if(e.type==='dialogue') dialogues++;
    if(e.type==='scene') scenes++;
    const perLine = (e.type==='dialogue')?30:(e.type==='character'||e.type==='transition'||e.type==='parenthetical')?60:55;
    weightedLines += Math.max(1, Math.ceil((e.text||'').length/perLine)) + (e.type==='scene'?1:0);
  });
  const pages = Math.max(1, Math.round(weightedLines/55));
  return { words, chars, dialogues, scenes, pages, readMin: pages };
}

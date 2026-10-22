/* =====================================================================
   STATE
===================================================================== */
let S = {
  view:'home',            // home | editor
  projectsIndex:[],
  project:null,
  tab:'editor',            // editor|cards|outline|characters|tags|notes|reports|stats|graveyard|history|settings
  saveTimer:null,
  saving:false,
  undoStack:[], redoStack:[],
  filterTags:new Set(),
  filterChar:null,
  search:{ query:'', matches:[], idx:-1, open:false },
  createFmt:'fr',
  seriesId:null,           // id de la série actuellement affichée dans le hub série
  tpDrawMode:false, tpPenColor:'#23262E', tpPenSize:6,
  pagination:{ count:1, current:1, pageOf:{}, pending:null, zoom:1 },
  autocomplete:null,      // { id, remainder } — suggestion en cours (Tab pour l'accepter)
  extMenu:null,           // { id, sel, items, open } — menu des extensions de personnage
  typewriterMode:false,   // Mode Machine à écrire (WriterDuet) : curseur toujours centré. Désactivé par défaut (v87), comme WriterDuet ; le choix de l'utilisateur est mémorisé.
                          // ACTIVÉ DE BASE — un clic sur le bouton le coupe (et le bouton
                          // devient alors invisible, fondu dans le fond de la barre).
  focusMode:false,        // Mode Focus (WriterDuet) : estompe tout sauf la ligne active
  reading:false,          // Lire à voix haute (WriterDuet) : lecture de la scène en cours
  dictating:false,        // Dictée vocale (WriterDuet) : micro ouvert, transcrit dans la ligne en cours
  recognizer:null,        // instance SpeechRecognition active pendant la dictée
  navOpen:false,          // Navigateur de scènes (WriterDuet) : panneau latéral de l'éditeur
  navFilter:'',           // filtre de frappe du navigateur (jamais sauvegardé : c'est une vue, pas une donnée)
  diffVerId:null,         // version actuellement comparée au scénario en cours (vue seulement)
};

/* =====================================================================
   STORAGE HELPERS
   ---------------------------------------------------------------------
   Les scénarios vivent dans IndexedDB plutôt que dans localStorage : le
   quota y est bien plus large (des centaines de Mo, au lieu des 5-10 Mo
   de localStorage), ce qui évite qu'une page de titre illustrée ou un
   historique de versions fasse échouer l'enregistrement en silence une
   fois le quota atteint. localStorage ne garde plus que de petits
   réglages (thème, horodatage de dernière sauvegarde…) et sert de filet
   de secours si IndexedDB est indisponible : dans ce cas l'app continue
   de fonctionner exactement comme avant, sans rien casser.
===================================================================== */
const IDB_NAME = 'scriptmm_db';
const IDB_STORE = 'kv';
let __idbOpenPromise = null;
function openIDB(){
  if(__idbOpenPromise) return __idbOpenPromise;
  __idbOpenPromise = new Promise(resolve=>{
    if(!('indexedDB' in window)){ resolve(null); return; }
    let req;
    try{ req = indexedDB.open(IDB_NAME, 1); }catch(e){ resolve(null); return; }
    req.onupgradeneeded = ()=>{ try{ req.result.createObjectStore(IDB_STORE); }catch(e){} };
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> resolve(null);
    req.onblocked = ()=> resolve(null);
  });
  return __idbOpenPromise;
}
function idbGet(key){
  return openIDB().then(db=>{
    if(!db) return Promise.reject(new Error('idb-unavailable'));
    return new Promise((resolve,reject)=>{
      try{
        const rq = db.transaction(IDB_STORE,'readonly').objectStore(IDB_STORE).get(key);
        rq.onsuccess = ()=> resolve(rq.result===undefined ? null : rq.result);
        rq.onerror = ()=> reject(rq.error);
      }catch(e){ reject(e); }
    });
  });
}
function idbSet(key, val){
  return openIDB().then(db=>{
    if(!db) return Promise.reject(new Error('idb-unavailable'));
    return new Promise((resolve,reject)=>{
      try{
        const tx = db.transaction(IDB_STORE,'readwrite');
        tx.objectStore(IDB_STORE).put(val, key);
        tx.oncomplete = ()=> resolve(true);
        tx.onerror = ()=> reject(tx.error);
        tx.onabort = ()=> reject(tx.error);
      }catch(e){ reject(e); }
    });
  });
}
function idbDelete(key){
  return openIDB().then(db=>{
    if(!db) return Promise.reject(new Error('idb-unavailable'));
    return new Promise((resolve,reject)=>{
      try{
        const tx = db.transaction(IDB_STORE,'readwrite');
        tx.objectStore(IDB_STORE).delete(key);
        tx.oncomplete = ()=> resolve(true);
        tx.onerror = ()=> reject(tx.error);
      }catch(e){ reject(e); }
    });
  });
}
/* DOUBLE ÉCRITURE : IndexedDB **et** localStorage.
   IndexedDB reste la référence (quota large, pas de limite pratique),
   mais chaque enregistrement est aussi recopié dans localStorage quand
   il y tient. Les deux stockages ne tombent pas toujours ensemble : un
   nettoyage, un profil corrompu ou un navigateur qui bloque l'un peut
   laisser l'autre intact — et la relecture ci-dessous récupère alors
   automatiquement la copie survivante. Si la copie localStorage ne
   passe pas (quota atteint, page de titre illustrée…), on ne bloque
   rien : on efface simplement la copie devenue périmée pour ne jamais
   ressusciter une vieille version, et IndexedDB continue seul. */
async function storGet(key){
  let v = null;
  try{ v = await idbGet(key); }catch(e){ v = null; }
  if(v != null) return v;
  try{ const raw = localStorage.getItem(key); return raw != null ? JSON.parse(raw) : null; }
  catch(e2){ return null; }
}
async function storSet(key, val){
  let ok = false;
  try{ await idbSet(key, val); ok = true; }catch(e){}
  try{ localStorage.setItem(key, JSON.stringify(val)); ok = true; }
  catch(e2){ try{ localStorage.removeItem(key); }catch(e3){} }
  return ok;
}
async function storDelete(key){
  try{ await idbDelete(key); }catch(e){}
  try{ localStorage.removeItem(key); }catch(e2){}
}
/* Migration ponctuelle et sûre : copie l'index et chaque projet déjà
   présents dans localStorage vers IndexedDB, et ne nettoie localStorage
   qu'une fois la copie confirmée — impossible de perdre un scénario au
   passage. Si IndexedDB n'est pas disponible, rien n'est supprimé et
   l'app continue de tourner sur localStorage comme avant cette mise à
   jour ; la tentative sera simplement refaite au prochain lancement. */
async function migrateLocalStorageToIDB(){
  try{
    const rawIdx = localStorage.getItem(IDX_KEY);
    if(rawIdx==null) return;
    const idx = JSON.parse(rawIdx);
    if(!Array.isArray(idx)) return;
    // RÉCUPÉRATION, plus migration : localStorage est désormais une copie
    // permanente et volontaire. On ne recopie donc vers IndexedDB que ce
    // qui y MANQUE, et on n'efface plus jamais la copie localStorage — sans
    // quoi un simple lancement écraserait du récent par du plus ancien.
    let cur = null;
    try{ cur = await idbGet(IDX_KEY); }catch(e){ cur = null; }
    if(cur == null) await idbSet(IDX_KEY, idx);
    for(const entry of idx){
      let has = null;
      try{ has = await idbGet(proj_key(entry.id)); }catch(e){ has = null; }
      if(has != null) continue;
      const raw = localStorage.getItem(proj_key(entry.id));
      if(raw!=null) await idbSet(proj_key(entry.id), JSON.parse(raw));
    }
  }catch(e){ /* IndexedDB indisponible ou erreur en cours de route : on ne touche à rien. */ }
}
/* Demande au navigateur de classer Raging Page en stockage "persistant" :
   Chrome et Firefox honorent cette demande et excluent alors le site de
   l'éviction automatique en cas de pression mémoire (le nettoyage
   silencieux qui peut sinon vider les données d'un site peu visité).
   Best-effort : ignorée sans erreur si l'API n'existe pas ou refuse. */
function requestPersistentStorage(){
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }
  catch(e){}
}
async function loadIndex(){
  const idx = await storGet(IDX_KEY);
  S.projectsIndex = idx || [];
}
async function saveIndex(){
  await storSet(IDX_KEY, S.projectsIndex);
}
function uid(p){ return (p||'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

/* =====================================================================
   THEME (mode sombre)
===================================================================== */
function isDarkTheme(){ return document.documentElement.getAttribute('data-theme')==='dark'; }
function themeToggleBtnHtml(cls){
  return `<button class="btn ${cls||''}" data-act="toggleTheme" title="Changer d\u2019apparence">${icon(isDarkTheme()?'sun':'moon')} ${isDarkTheme()?'Mode clair':'Mode sombre'}</button>`;
}
function toggleTheme(){
  const dark = isDarkTheme();
  if(dark) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme','dark');
  try{ localStorage.setItem('scriptmm_theme', dark ? 'light' : 'dark'); }catch(e){}
  document.querySelectorAll('[data-act="toggleTheme"]').forEach(btn=>{
    btn.innerHTML = `${icon(isDarkTheme()?'sun':'moon')} ${isDarkTheme()?'Mode clair':'Mode sombre'}`;
  });
}

/* =====================================================================
   MODE MACHINE À ÉCRIRE (typewriter mode)
   -----------------------------------------------------------------
   Fonctionnalité de WriterDuet (Menu > View > Typewriter Mode) absente
   de Raging Page : quand elle est activée, le curseur reste toujours centré
   verticalement dans la fenêtre pendant l'écriture — c'est la page qui
   défile sous lui, jamais l'inverse, comme sur une vraie machine à
   écrire. Se branche uniquement sur ensureRectVisible() (voir plus bas),
   déjà utilisée par tout le code existant pour garder le curseur visible :
   rien d'autre à toucher. */
function typewriterTitle(){
  return S.typewriterMode
    ? L('Mode machine à écrire ACTIF : le curseur reste centré verticalement. Cliquer pour le couper.', 'Typewriter mode ON: the cursor stays vertically centered. Click to turn it off.')
    : L('Mode machine à écrire coupé : défilement normal. Cliquer pour l\u2019activer.', 'Typewriter mode off: normal scrolling. Click to turn it on.');
}
function typewriterBtnHtml(cls){
  return `<button class="btn btn-tw ${cls||''}" data-act="toggleTypewriterMode" aria-pressed="${S.typewriterMode?'true':'false'}" title="${typewriterTitle()}">${icon('typeT')} ${L('Machine à écrire','Typewriter')}<span class="tw-dot${S.typewriterMode?' on':''}"></span></button>`;
}
function toggleTypewriterMode(){
  S.typewriterMode = !S.typewriterMode;
  try{ localStorage.setItem('scriptmm_typewriter', S.typewriterMode ? '1' : '0'); }catch(e){}
  document.querySelectorAll('[data-act="toggleTypewriterMode"]').forEach(btn=>{
    btn.setAttribute('aria-pressed', S.typewriterMode ? 'true' : 'false');
    btn.title = typewriterTitle();
    const dot = btn.querySelector('.tw-dot');
    if(dot) dot.classList.toggle('on', S.typewriterMode);
  });
  ensureCaretVisible();
}

function focusTitle(){
  return S.focusMode
    ? L('Mode Focus ACTIF : le texte hors de la ligne en cours est estompé. Cliquer pour le couper.', 'Focus mode ON: text outside the current line is dimmed. Click to turn it off.')
    : L('Mode Focus coupé : cliquer pour estomper tout sauf la ligne en cours.', 'Focus mode off: click to dim everything except the current line.');
}
function focusBtnHtml(cls){
  return `<button class="btn btn-tw ${cls||''}" data-act="toggleFocusMode" aria-pressed="${S.focusMode?'true':'false'}" title="${focusTitle()}">${icon('focus')} ${L('Focus','Focus')}<span class="tw-dot${S.focusMode?' on':''}"></span></button>`;
}
function toggleFocusMode(){
  S.focusMode = !S.focusMode;
  try{ localStorage.setItem('scriptmm_focus', S.focusMode ? '1' : '0'); }catch(e){}
  document.querySelectorAll('[data-act="toggleFocusMode"]').forEach(btn=>{
    btn.setAttribute('aria-pressed', S.focusMode ? 'true' : 'false');
    btn.title = focusTitle();
    const dot = btn.querySelector('.tw-dot');
    if(dot) dot.classList.toggle('on', S.focusMode);
  });
  const page = document.getElementById('page');
  if(page) page.classList.toggle('focus-mode', S.focusMode);
}
/* Mémorisation : les modes Machine à écrire et Focus retrouvent leur dernier état
   à la réouverture du site (sans valeur enregistrée, les réglages d'origine restent). */
(function(){
  try{
    const tw = localStorage.getItem('scriptmm_typewriter');
    if(tw === '1') S.typewriterMode = true; else if(tw === '0') S.typewriterMode = false;
    const fo = localStorage.getItem('scriptmm_focus');
    if(fo === '1') S.focusMode = true; else if(fo === '0') S.focusMode = false;
  }catch(e){}
})();


/* =====================================================================
   PAGES LIBRES (hors numérotation)
   ---------------------------------------------------------------------
   Des pages de texte libre (dédicace, citation, synopsis, remerciements,
   page blanche...) posées AVANT le scénario (5 au maximum, juste après la
   page de titre) ou APRÈS lui (autant qu'on veut, dans l'ordre voulu).
   Elles ne portent jamais de numéro et ne comptent pas dans la
   numérotation : la première page du scénario est toujours la page 1.
   Rangées dans le projet : p.freePages = { front:[...], back:[...] }, chaque
   page = { id, text, align:'left'|'center' }. Un ancien scénario n'a
   rien de tel : ensureFreePages() renvoie alors deux listes vides, sans
   rien changer au reste. */
const FREE_PAGES_MAX_FRONT = 5;
function ensureFreePages(p){
  p = p || S.project;
  if(!p) return { front:[], back:[] };
  if(!p.freePages || typeof p.freePages !== 'object') p.freePages = {};
  const fp = p.freePages;
  ['front','back'].forEach(k=>{
    if(!Array.isArray(fp[k])) fp[k] = [];
    fp[k] = fp[k].filter(x => x && typeof x === 'object');
    fp[k].forEach(x=>{
      if(!x.id) x.id = uid('fp');
      if(typeof x.text !== 'string') x.text = '';
      if(x.align !== 'center') x.align = 'left';
    });
  });
  return fp;
}
/* Les pages libres ci-dessus ne vivaient que dans les Paramètres et n'apparaissaient qu'à l'export. Elles
   sont maintenant de vraies pages sans numéro, posées dans le scénario lui-même (voir js/33-free-pages.js) :
   à l'ouverture, chacune devient un carton sur sa propre page sans numéro — même texte, même alignement —
   au début (pages « avant ») ou à la fin (pages « après ») du scénario. Rien n'est perdu, rien n'est numéroté. */
function fpMigrateLegacy(p){
  if(!p || !p.freePages || typeof p.freePages !== 'object' || !Array.isArray(p.elements)) return;
  const fp = ensureFreePages(p);
  const conv = it => {
    const el = { id: uid('el'), type:'card', text: String(it.text || '').replace(/\r\n?/g, '\n').replace(/\s+$/, ''), fpg: uid('fpg') };
    el.card = { size:12, align: it.align === 'center' ? 'center' : 'left', width:100, bold:false, italic:false, caps:false, font:'mono', frame:'none', space:0, full:false };
    return el;
  };
  const front = fp.front.map(conv), back = fp.back.map(conv);
  if(front.length) p.elements.unshift(...front);
  if(back.length) p.elements.push(...back);
  delete p.freePages;
}

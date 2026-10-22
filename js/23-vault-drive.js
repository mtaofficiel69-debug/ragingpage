/* =====================================================================
   COFFRE-FORT — SAUVEGARDE HORS NAVIGATEUR
   ---------------------------------------------------------------------
   POURQUOI CE BLOC EXISTE
   Jusqu'ici, l'unique exemplaire d'un scénario vivait dans le stockage
   du navigateur (IndexedDB, avec localStorage en secours). C'est rapide
   et gratuit, mais ce stockage peut disparaître sans prévenir, et
   surtout il n'existe PAS DU TOUT dans trois situations très courantes :
     - la page est ouverte directement depuis le disque (file://) :
       Chrome interdit IndexedDB dans ce mode ;
     - la page tourne dans un aperçu en cadre (iframe bac à sable) :
       le navigateur y bloque tout stockage ;
     - navigation privée ou nettoyage automatique des données de site.
   Dans ces cas, tout ce qui est écrit s'évapore au rafraîchissement —
   exactement le symptôme constaté. Aucune correction du code de
   sauvegarde interne ne peut y changer quoi que ce soit : il faut écrire
   AILLEURS que dans le navigateur.

   CE QUE FONT LES LOGICIELS DU MÉTIER
   WriterDuet, Fade In ou Final Draft ne font pas confiance au navigateur :
   ils écrivent dans un vrai fichier, et/ou sur un compte distant. Sans un
   centime de serveur, on peut reproduire les deux :
     1. COFFRE LOCAL — l'API File System Access (Chrome, Edge, Opera)
        permet de demander UNE FOIS un fichier sur le disque, de garder
        son autorisation, puis d'y réécrire silencieusement à chaque
        modification. Le scénario vit alors dans un vrai .smmproj sur
        l'ordinateur : vider le navigateur ne l'atteint plus.
     2. GOOGLE DRIVE — tout se fait depuis le navigateur, en OAuth, avec
        le Drive de l'utilisateur comme espace de stockage. Aucun serveur
        à héberger, aucun abonnement : seul un identifiant client Google
        (gratuit) est nécessaire, à coller dans les Paramètres.
   Les deux fonctionnent ensemble ou séparément, et n'enlèvent rien à ce
   qui existait : l'enregistrement dans le navigateur continue comme avant
   et reste le plus rapide. Le coffre est une seconde copie, pas un
   remplacement.
===================================================================== */

/* ---------------------------------------------------------------------
   1. DIAGNOSTIC : le navigateur conserve-t-il vraiment quelque chose ?
   On n'attend pas la panne : on écrit un témoin et on le relit. Si la
   relecture échoue, on le dit franchement à l'écran plutôt que de
   laisser croire à une sauvegarde qui n'a pas lieu.
--------------------------------------------------------------------- */
let __storageMode = 'idb';
const PROBE_KEY = 'scriptmm_probe';
async function checkStorageHealth(){
  try{
    await idbSet(PROBE_KEY, 1);
    if(await idbGet(PROBE_KEY) === 1){ __storageMode = 'idb'; return 'idb'; }
  }catch(e){}
  try{
    localStorage.setItem(PROBE_KEY, '1');
    if(localStorage.getItem(PROBE_KEY) === '1'){ __storageMode = 'ls'; return 'ls'; }
  }catch(e){}
  __storageMode = 'none';
  return 'none';
}
function inIframe(){ try{ return window.self !== window.top; }catch(e){ return true; } }
function storageDiagnosis(){
  if(location.protocol === 'file:')
    return L('La page est ouverte directement depuis le disque (adresse en file://). Chrome et Edge interdisent tout stockage dans ce mode : rien de ce qui est écrit ne survit au rafraîchissement.', 'The page is opened directly from disk (a file:// address). Chrome and Edge forbid all storage in this mode: nothing written survives a refresh.');
  if(inIframe())
    return L('La page tourne dans un cadre d\u2019aperçu où le navigateur bloque le stockage : chaque rechargement repart de zéro.', 'The page is running inside a preview frame where the browser blocks storage: every reload starts from scratch.');
  return L('Ce navigateur refuse le stockage local (navigation privée, ou données de site bloquées dans les réglages).', 'This browser refuses local storage (private browsing, or site data blocked in settings).');
}
function showStorageBanner(){
  if(document.getElementById('storageBanner')) return;
  const b = document.createElement('div');
  b.id = 'storageBanner';
  b.className = 'storage-banner';
  b.innerHTML = `<div class="sb-text"><b>${L('Attention : ce navigateur ne garde rien.','Warning: this browser keeps nothing.')}</b> ${esc(storageDiagnosis())}
    ${L('Lie un fichier de ton ordinateur (ou Google Drive) : c\u2019est la seule façon de ne rien perdre ici.','Link a file from your computer (or Google Drive): it\u2019s the only way not to lose anything here.')}</div>
    <div class="sb-actions">
      <button class="btn btn-sm btn-primary" data-act="vaultAttach">${icon('save')} ${L('Lier un fichier','Link a file')}</button>
      <button class="btn btn-sm btn-ghost" data-act="vaultOpenFromFile">${icon('upload')} ${L('Ouvrir un .smmproj','Open a .smmproj')}</button>
      <button class="btn btn-sm btn-ghost" data-act="dismissStorageBanner">${icon('close')}</button>
    </div>`;
  document.body.appendChild(b);
}
function dismissStorageBanner(){ const b = document.getElementById('storageBanner'); if(b) b.remove(); }

/* ---------------------------------------------------------------------
   2. COFFRE LOCAL (File System Access API)
   Le handle de fichier obtenu au premier choix est stocké tel quel dans
   IndexedDB : il est « clonable », donc il survit à la fermeture de
   l'onglet. Au retour, le navigateur redemande éventuellement
   l'autorisation — qui exige un geste de l'utilisateur, d'où la pastille
   cliquable dans la barre d'outils.
--------------------------------------------------------------------- */
const FSA_OK = (typeof window.showSaveFilePicker === 'function');
const vaultKey = id => 'scriptmm_vault_' + id;
let V = { handle:null, pid:null, ok:false, name:'', at:0, err:'', busy:false, timer:null, loading:false };

function safeFileName(t){ return String(t || 'scenario').replace(/[\\/:*?"<>|]/g, '-').slice(0, 80); }
function vaultPayload(p){
  return JSON.stringify({ app:'Raging Page', kind:'project-backup', version:1, savedAt:Date.now(), project:p });
}
function vaultActive(){ return !!(V.handle && V.ok && S.project && V.pid === S.project.id); }

async function vaultLoadFor(pid){
  V = { handle:null, pid, ok:false, name:'', at:0, err:'', busy:false, timer:null, loading:false };
  if(FSA_OK){
    let rec = null;
    try{ rec = await idbGet(vaultKey(pid)); }catch(e){}
    if(rec && rec.handle){
      V.handle = rec.handle; V.at = rec.at || 0; V.name = rec.name || '';
      try{
        const perm = await rec.handle.queryPermission({ mode:'readwrite' });
        V.ok = (perm === 'granted');
        if(!V.ok) V.err = 'perm';
      }catch(e){ V.ok = false; V.err = 'perm'; }
    }
  }
  updateVaultChip();
}

/* Lier (ou relier) le scénario ouvert à un fichier du disque. */
async function vaultAttach(){
  if(!S.project){ toast(L('Ouvre d\u2019abord un scénario, puis relie-le à un fichier.','First open a screenplay, then link it to a file.')); return; }
  if(!FSA_OK){
    toast(L('Ce navigateur ne sait pas écrire directement dans un fichier : utilise Chrome, Edge ou Opera. En attendant, voici une sauvegarde à télécharger.','This browser can\u2019t write directly to a file: use Chrome, Edge or Opera. In the meantime, here\u2019s a backup to download.'));
    try{ exportBackup(); }catch(e){}
    return;
  }
  try{
    const h = await window.showSaveFilePicker({
      suggestedName: safeFileName(S.project.title) + '.smmproj',
      types:[{ description:L('Scénario Raging Page','Raging Page screenplay'), accept:{ 'application/json':['.smmproj'] } }]
    });
    V.handle = h; V.pid = S.project.id; V.ok = true; V.err = ''; V.name = h.name || '';
    try{ await idbSet(vaultKey(S.project.id), { handle:h, at:Date.now(), name:V.name }); }catch(e){}
    await vaultWrite();
    dismissStorageBanner();
    toast(L('Coffre lié : « ','Vault linked: \u201c') + V.name + L(' » est désormais réécrit à chaque modification.','\u201d is now rewritten on every change.'));
    if(S.view === 'editor' && S.tab === 'settings') renderTabBody();
  }catch(e){
    if(e && e.name === 'AbortError') return;
    toast(L('Impossible de lier ce fichier.','Couldn\u2019t link this file.'));
  }
}

/* Redemander l'autorisation d'écriture (exige un clic : d'où la pastille). */
async function vaultReconnect(){
  if(!V.handle){ vaultAttach(); return; }
  try{
    const perm = await V.handle.requestPermission({ mode:'readwrite' });
    if(perm === 'granted'){
      V.ok = true; V.err = '';
      await vaultWrite();
      toast(L('Coffre reconnecté : « ','Vault reconnected: \u201c') + (V.name || L('fichier','file')) + L(' ».','\u201d.'));
    }else{
      toast(L('Autorisation refusée : le fichier ne sera pas mis à jour.','Permission denied: the file won\u2019t be updated.'));
    }
  }catch(e){ toast(L('Impossible de reconnecter ce fichier.','Couldn\u2019t reconnect this file.')); }
  updateVaultChip();
  if(S.view === 'editor' && S.tab === 'settings') renderTabBody();
}

async function vaultWrite(){
  if(!vaultActive() || V.busy) return false;
  V.busy = true; updateVaultChip();
  let ok = false;
  try{
    const w = await V.handle.createWritable();
    await w.write(vaultPayload(S.project));
    await w.close();
    V.at = Date.now(); V.err = ''; ok = true;
    try{ await idbSet(vaultKey(S.project.id), { handle:V.handle, at:V.at, name:V.name }); }catch(e){}
  }catch(e){
    if(e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')){ V.err = 'perm'; V.ok = false; }
    else V.err = 'write';
  }
  V.busy = false; updateVaultChip();
  return ok;
}
function scheduleVaultWrite(){
  if(!vaultActive()) return;
  clearTimeout(V.timer);
  updateVaultChip('pending');
  V.timer = setTimeout(()=>{ vaultWrite(); }, 2500);
}
function flushVaultWrite(){
  if(!vaultActive()) return;
  clearTimeout(V.timer); V.timer = null;
  vaultWrite();
}
function vaultDetach(){
  if(!S.project) return;
  const id = S.project.id;
  clearTimeout(V.timer);
  V = { handle:null, pid:id, ok:false, name:'', at:0, err:'', busy:false, timer:null, loading:false };
  try{ idbDelete(vaultKey(id)); }catch(e){}
  updateVaultChip();
  if(S.view === 'editor' && S.tab === 'settings') renderTabBody();
  toast(L('Coffre détaché : le fichier reste sur ton disque, il n\u2019est simplement plus mis à jour.','Vault detached: the file stays on your disk, it simply isn\u2019t updated anymore.'));
}

/* Remettre un projet complet en état après lecture d'un fichier :
   mêmes garde-fous que la restauration d'une sauvegarde existante. */
function vaultNormalize(p){
  ensureSettings(p); ensureTPDesign(p); ensureStructure(p);
  if(!p.sceneMeta) p.sceneMeta = {};
  if(!p.tagDefs) p.tagDefs = {};
  if(!Array.isArray(p.graveyard)) p.graveyard = [];
  if(!Array.isArray(p.versions)) p.versions = [];
  if(p.seasonName === undefined) p.seasonName = '';
  return p;
}

/* Ouvrir un .smmproj depuis le disque ET rester lié à ce fichier : c'est
   le chemin de retour après un nettoyage du navigateur, et le mode de
   travail « comme un logiciel classique » (un scénario = un fichier). */
async function vaultOpenFromFile(){
  if(!FSA_OK){ try{ triggerImport(); }catch(e){} return; }
  let h, data;
  try{
    const picked = await window.showOpenFilePicker({
      types:[{ description:L('Scénario Raging Page','Raging Page screenplay'), accept:{ 'application/json':['.smmproj','.json'] } }],
      multiple:false
    });
    h = picked[0];
    const f = await h.getFile();
    data = JSON.parse(await f.text());
  }catch(e){
    if(e && e.name === 'AbortError') return;
    toast(L('Fichier illisible : ce n\u2019est pas une sauvegarde Raging Page.','Unreadable file: this isn\u2019t a Raging Page backup.'));
    return;
  }
  const src = data && data.project ? data.project : null;
  if(!src || !Array.isArray(src.elements)){ toast(L('Ce fichier n\u2019est pas une sauvegarde Raging Page.','This file isn\u2019t a Raging Page backup.')); return; }

  const entry = S.projectsIndex.find(e => e.id === src.id);
  if(entry){
    const fileTime = src.updatedAt || 0, localTime = entry.updatedAt || 0;
    if(fileTime > localTime + 2000){
      const go = await mmConfirm(L('Ce fichier est plus récent que la version présente dans ce navigateur. L\u2019ouvrir remplacera la version du navigateur.','This file is more recent than the version in this browser. Opening it will replace the browser\u2019s version.'),
        {title:L('Ouvrir la version du fichier ?','Open the file\u2019s version?'), ok:L('Ouvrir le fichier','Open file'), cancel:L('Garder le navigateur','Keep browser version')});
      if(!go){ await openProject(src.id); await vaultBind(h, src.id); return; }
    }else{
      await openProject(src.id);
      await vaultBind(h, src.id);
      toast(L('Scénario rouvert, et relié à « ','Screenplay reopened, and linked to \u201c') + (h.name || L('ce fichier','this file')) + L(' ».','\u201d.'));
      return;
    }
  }
  const p = vaultNormalize(JSON.parse(JSON.stringify(src)));
  p.updatedAt = Date.now();
  if(p.seriesId && !S.projectsIndex.some(e => e.seriesId === p.seriesId)){
    p.seriesId = null; p.season = null; p.episode = null;
  }
  const idx = S.projectsIndex.findIndex(e => e.id === p.id);
  S.project = p;
  if(idx >= 0) S.projectsIndex[idx] = indexEntryFor(p);
  else S.projectsIndex.push(indexEntryFor(p));
  await saveIndex(); await storSet(proj_key(p.id), p);
  S.view = 'editor'; S.tab = 'editor'; S.undoStack = []; S.redoStack = [];
  render();
  await vaultBind(h, p.id);
  dismissStorageBanner();
  toast(L('Scénario ouvert depuis le fichier, et relié à lui : chaque modification y sera réécrite.','Screenplay opened from the file, and linked to it: every change will be rewritten there.'));
}
async function vaultBind(h, pid){
  V.handle = h; V.pid = pid; V.ok = true; V.err = ''; V.name = h.name || '';
  try{ await idbSet(vaultKey(pid), { handle:h, at:Date.now(), name:V.name }); }catch(e){}
  updateVaultChip();
}

/* ---------------------------------------------------------------------
   3. PASTILLE D'ÉTAT DU COFFRE (à côté de « Sauvegardé »)
   Elle dit la vérité en un coup d'œil : liée / en attente / à reconnecter
   / pas de coffre. Un clic agit selon l'état, sans passer par un menu.
--------------------------------------------------------------------- */
let __vaultChipLoading = false;
function updateVaultChip(state){
  const chip = document.getElementById('vaultChip');
  if(S.project && V.pid !== S.project.id && !__vaultChipLoading){
    __vaultChipLoading = true;
    vaultLoadFor(S.project.id).then(()=>{ __vaultChipLoading = false; });
    return;
  }
  if(!chip) return;
  let cls = 'vault-chip', txt = '', title = '';
  if(!S.project){ chip.style.display = 'none'; return; }
  chip.style.display = '';
  if(V.err === 'perm' || (V.handle && !V.ok)){
    cls += ' warn'; txt = L('Coffre à reconnecter','Vault to reconnect');
    title = L('Le navigateur redemande l\u2019autorisation d\u2019écrire dans « ','The browser is asking again for permission to write to \u201c') + (V.name || L('ton fichier','your file')) + L(' ». Clique pour la redonner.','\u201d. Click to grant it again.');
  }else if(V.err === 'write'){
    cls += ' warn'; txt = L('Coffre en erreur','Vault error');
    title = L('La dernière écriture dans le fichier a échoué. Clique pour réessayer.','The last write to the file failed. Click to try again.');
  }else if(vaultActive()){
    cls += ' ok';
    txt = (state === 'pending' || V.busy) ? L('Coffre…','Vault…') : L('Coffre OK','Vault OK');
    title = L('Chaque modification est réécrite dans « ','Every change is rewritten to \u201c') + (V.name || L('ton fichier','your file')) + L(' »','\u201d') +
            (V.at ? L(' \u00b7 dernière écriture ',' \u00b7 last write ') + timeAgo(V.at) : '') + L('. Clique pour forcer une écriture.','. Click to force a write.');
  }else{
    cls += ' off'; txt = L('Aucun coffre','No vault');
    title = L('Ce scénario n\u2019existe que dans ce navigateur. Clique pour le relier à un fichier de ton ordinateur.','This screenplay only exists in this browser. Click to link it to a file on your computer.');
  }
  chip.className = cls; chip.textContent = txt; chip.title = title;
}
function vaultChipClick(){
  if(!S.project) return;
  if(V.err === 'perm' || (V.handle && !V.ok)) return vaultReconnect();
  if(vaultActive()){ flushVaultWrite(); toast(L('Écriture forcée dans le fichier.','Write to the file forced.')); return; }
  vaultAttach();
}

/* ---------------------------------------------------------------------
   4. GOOGLE DRIVE — sans serveur, sans abonnement
   Le navigateur parle directement à l'API Google avec un jeton obtenu en
   OAuth. La portée demandée est « drive.file » : la plus étroite qui
   existe — Raging Page ne voit QUE les fichiers qu'il a lui-même créés,
   jamais le reste du Drive. Le jeton ne vit qu'en mémoire (perdu à la
   fermeture de l'onglet) : rien de sensible n'est écrit sur le disque.
   Seul l'identifiant client, qui n'est pas un secret, est conservé.
--------------------------------------------------------------------- */
const GD_CLIENT_KEY = 'scriptmm_gdrive_client_id';
const GD_FILE_KEY = id => 'scriptmm_gdrive_file_' + id;
const GD_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GD_ON_KEY = 'scriptmm_gdrive_on'; // « Drive connecté » mémorisé (jamais le jeton lui-même)
let GD = { token:null, exp:0, tc:null, resolve:null, reject:null, timer:null, at:0, busy:false, err:'' };

/* IDENTIFIANT GOOGLE DU SITE (à remplir UNE SEULE FOIS par la personne qui
   met Raging Page en ligne). Une fois collé ici, les visiteurs n'ont plus rien
   à configurer : un bouton « Se connecter avec Google », et c'est tout.
   Ce n'est pas un secret. Laisser vide = ancien fonctionnement (chacun colle
   son propre identifiant dans Paramètres). */
const GD_BUILTIN_CLIENT_ID = '1070717972969-lk5q67452eocggr9jl2296mqakannt0g.apps.googleusercontent.com';
function gdClientId(){ if(GD_BUILTIN_CLIENT_ID) return GD_BUILTIN_CLIENT_ID; try{ return localStorage.getItem(GD_CLIENT_KEY) || ''; }catch(e){ return ''; } }
function gdSaveClientId(){
  const el = document.getElementById('gdClientId');
  if(!el) return;
  const v = el.value.trim();
  try{ localStorage.setItem(GD_CLIENT_KEY, v); }catch(e){}
  GD.tc = null; GD.token = null;
  toast(v ? L('Identifiant Google enregistré. Tu peux maintenant connecter Drive.','Google client ID saved. You can now connect Drive.') : L('Identifiant Google effacé.','Google client ID cleared.'));
  if(S.view === 'editor' && S.tab === 'settings') renderTabBody();
}
function gdConnected(){ return !!(GD.token && Date.now() < GD.exp); }
function gdFileId(pid){ try{ return localStorage.getItem(GD_FILE_KEY(pid)) || ''; }catch(e){ return ''; } }
function gdSetFileId(pid, fid){ try{ fid ? localStorage.setItem(GD_FILE_KEY(pid), fid) : localStorage.removeItem(GD_FILE_KEY(pid)); }catch(e){} }

function gdLoadScript(){
  return new Promise((resolve, reject)=>{
    if(window.google && window.google.accounts && window.google.accounts.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = ()=> resolve();
    s.onerror = ()=> reject(new Error('gsi'));
    document.head.appendChild(s);
  });
}
async function gdRequestToken(interactive){
  if(gdConnected()) return GD.token;
  const cid = gdClientId();
  if(!cid) throw new Error('no-client-id');
  await gdLoadScript();
  if(!GD.tc){
    GD.tc = google.accounts.oauth2.initTokenClient({
      client_id: cid,
      scope: GD_SCOPE,
      callback: (resp)=>{
        if(resp && resp.access_token){
          GD.token = resp.access_token;
          GD.exp = Date.now() + ((resp.expires_in || 3600) - 120) * 1000;
          try{ localStorage.setItem(GD_ON_KEY, '1'); }catch(e){}
          gdSaveToken();
          if(GD.resolve) GD.resolve(GD.token);
        }else if(GD.reject){ GD.reject(new Error((resp && resp.error) || 'oauth')); }
        GD.resolve = GD.reject = null;
      },
      error_callback: (err)=>{ if(GD.reject) GD.reject(new Error((err && err.type) || 'oauth')); GD.resolve = GD.reject = null; }
    });
  }
  return new Promise((resolve, reject)=>{
    GD.resolve = resolve; GD.reject = reject;
    // prompt '' : Google ne montre son écran d'autorisation que la toute première fois ; ensuite sa fenêtre se
    // referme d'elle-même. (« consent » le réaffichait à chaque reconnexion.)
    try{ GD.tc.requestAccessToken({ prompt: interactive === 'none' ? 'none' : '' }); }
    catch(e){ GD.resolve = GD.reject = null; reject(e); }
  });
}
async function gdConnect(){
  if(!gdClientId()){ toast(L('Google Drive n\u2019est pas encore activé sur ce site.','Google Drive isn\u2019t enabled on this site yet.')); try{ switchTab('settings'); }catch(e){} return; }
  try{
    await gdRequestToken(true);
    GD.err = '';
    toast(L('Google Drive connecté.','Google Drive connected.'));
    // Se connecter depuis un scénario encore « non décidé » = le relier (c'est ce qu'on vient de demander).
    if(S.project && S.view === 'editor' && gdLinkState(S.project.id) === null) gdSetLinked(S.project.id, true);
    await gdPush(true);
  }catch(e){
    GD.err = 'auth';
    toast(L('Connexion à Google Drive impossible. Réessaie, et accepte la demande dans la fenêtre Google (autorise aussi les fenêtres pop-up).','Couldn\u2019t connect to Google Drive. Try again, and accept the request in the Google window (also allow pop-ups).'));
  }
  if(S.view === 'editor' && S.tab === 'settings') renderTabBody();
}
function gdDisconnect(){
  GD.token = null; GD.exp = 0; gdSaveToken();
  try{ localStorage.removeItem(GD_ON_KEY); }catch(e){}
  toast(L('Déconnecté de Google Drive (les fichiers déjà envoyés restent dans ton Drive).','Disconnected from Google Drive (files already sent stay in your Drive).'));
  if(S.view === 'editor' && S.tab === 'settings') renderTabBody();
}
async function gdUpload(fileId, name, content){
  const boundary = '-------scriptmm' + Date.now();
  const meta = fileId ? { name } : { name, mimeType:'application/json' };
  const body =
    '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) +
    '\r\n--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' + content +
    '\r\n--' + boundary + '--';
  const url = fileId
    ? 'https://www.googleapis.com/upload/drive/v3/files/' + encodeURIComponent(fileId) + '?uploadType=multipart&fields=id'
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';
  const res = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers:{ Authorization:'Bearer ' + GD.token, 'Content-Type':'multipart/related; boundary=' + boundary },
    body
  });
  if(!res.ok) throw new Error('upload-' + res.status);
  return (await res.json()).id;
}
/* ---- UN SCÉNARIO = UN FICHIER DRIVE, ET SEULEMENT SI ON L'A DEMANDÉ ----
   Chaque scénario décide pour lui-même : relié (envoyé sur le Drive, dans SON propre fichier), refusé, ou pas
   encore décidé (une petite carte le propose, voir 31a-drive-chip.js). Un scénario déjà envoyé avant cette
   mise à jour (il a un fichier Drive) reste relié. Rangé dans ce navigateur, par identifiant de scénario. */
const GD_LINK_KEY = id => 'scriptmm_gdrive_link_' + id;
const GD_DIRTY_KEY = id => 'scriptmm_gdrive_dirty_' + id;
function gdLinkState(pid){
  try{ const v = localStorage.getItem(GD_LINK_KEY(pid)); if(v === '1') return true; if(v === '0') return false; }catch(e){}
  return gdFileId(pid) ? true : null;
}
function gdSetLinked(pid, on){ try{ localStorage.setItem(GD_LINK_KEY(pid), on ? '1' : '0'); }catch(e){} }
/* « Modifié depuis le dernier envoi » : posé à chaque vraie modification (scheduleAutosave), retiré après un
   envoi réussi. Avant, la date d'enregistrement servait de repère : revenir de l'accueil réenregistrait le
   scénario sans rien changer, et la pastille repassait « en attente ». */
const GD_DIRTY = {};
function gdIsDirty(pid){ if(GD_DIRTY[pid] !== undefined) return GD_DIRTY[pid]; try{ return (GD_DIRTY[pid] = localStorage.getItem(GD_DIRTY_KEY(pid)) === '1'); }catch(e){ return false; } }
function gdSetDirty(pid, on){
  if(gdIsDirty(pid) === on) return;
  GD_DIRTY[pid] = on;
  try{ on ? localStorage.setItem(GD_DIRTY_KEY(pid), '1') : localStorage.removeItem(GD_DIRTY_KEY(pid)); }catch(e){}
  try{ if(typeof updateDriveChip === 'function') updateDriveChip(); }catch(e){}   // la pastille suit tout de suite (OK <-> en attente)
}
let GD_EDIT_SEQ = 0;
/* Un fichier Drive n'appartient qu'à un seul scénario : si un autre scénario de ce navigateur pointe déjà
   vers lui (copie, ancienne version...), on en crée un nouveau plutôt que d'écraser l'autre. */
function gdFileOwnedElsewhere(pid, fid){
  if(!fid) return false;
  try{
    const pre = GD_FILE_KEY('');
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if(k && k.indexOf(pre) === 0 && k !== GD_FILE_KEY(pid) && localStorage.getItem(k) === fid) return true;
    }
  }catch(e){}
  return false;
}
async function gdPush(silent, proj){
  const P = proj || S.project;
  if(!P || GD.busy) return;
  if(!gdConnected()){
    if(silent) return;      // un envoi automatique n'ouvre JAMAIS la fenêtre Google : il attend la reconnexion (pastille Drive)
    try{ await gdRequestToken(false); }
    catch(e){ toast(L('Reconnecte Google Drive pour envoyer ce scénario.','Reconnect Google Drive to send this screenplay.')); return; }
  }
  const linkSt = gdLinkState(P.id);
  if(linkSt !== true){
    if(silent) return;                                // jamais d'envoi automatique d'un scénario non relié
    gdSetLinked(P.id, true);                          // « Envoyer maintenant » sur ce scénario = le relier
  }
  if(silent && !gdIsDirty(P.id) && gdFileId(P.id)) return;   // rien de nouveau depuis le dernier envoi
  GD.busy = true; updateVaultChip();
  const seq = GD_EDIT_SEQ;
  try{
    const pid = P.id;
    let fid = gdFileId(pid);
    if(gdFileOwnedElsewhere(pid, fid)) fid = '';
    const name = safeFileName(P.title) + '.smmproj';
    const body = vaultPayload(P);
    try{
      fid = await gdUpload(fid, name, body);
    }catch(e){
      if(String(e.message).indexOf('upload-404') === 0 || String(e.message).indexOf('upload-403') === 0){
        fid = await gdUpload('', name, body); // le fichier a été supprimé côté Drive : on en recrée un
      }else throw e;
    }
    gdSetFileId(pid, fid);
    if(GD_EDIT_SEQ === seq || !S.project || S.project.id !== pid) gdSetDirty(pid, false);   // modifié pendant l'envoi : reste à envoyer
    GD.at = Date.now(); GD.err = '';
    if(!silent) toast(L('Scénario envoyé dans ton Google Drive.','Screenplay sent to your Google Drive.'));
  }catch(e){
    GD.err = 'push';
    // Jeton refusé par Google (expiré ou révoqué avant l'heure) : on l'oublie, la pastille propose alors la
    // reconnexion et le prochain clic la refait (voir 31a-drive-chip.js), au lieu de rester bloqué « en erreur ».
    if(String(e && e.message) === 'upload-401'){ GD.token = null; GD.exp = 0; gdSaveToken(); }
    if(!silent) toast(L('Envoi vers Google Drive impossible.','Couldn\u2019t send to Google Drive.'));
  }
  GD.busy = false;
  if(S.view === 'editor' && S.tab === 'settings') renderTabBody();
}
function scheduleDrivePush(){
  if(!gdConnected() || !S.project) return;
  clearTimeout(GD.timer);
  GD.timer = setTimeout(()=>{ gdPush(true); }, 30000);
}
async function gdPull(){
  if(!S.project) return;
  const fid = gdFileId(S.project.id);
  if(!fid){ toast(L('Ce scénario n\u2019a pas encore de copie dans ton Drive.','This screenplay doesn\u2019t have a copy in your Drive yet.')); return; }
  if(!gdConnected()){ try{ await gdRequestToken(false); }catch(e){ toast(L('Reconnecte Google Drive.','Reconnect Google Drive.')); return; } }
  if(!await mmConfirm(L('La version ouverte ici sera remplacée par celle de ton Google Drive.','The version open here will be replaced by the one in your Google Drive.'),
    {title:L('Remplacer par la version du Drive ?','Replace with the Drive version?'), ok:L('Remplacer','Replace')})) return;
  try{
    const res = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fid) + '?alt=media',
      { headers:{ Authorization:'Bearer ' + GD.token } });
    if(!res.ok) throw new Error('get');
    const data = await res.json();
    const src = data && data.project;
    if(!src || !Array.isArray(src.elements)) throw new Error('shape');
    const p = vaultNormalize(JSON.parse(JSON.stringify(src)));
    p.id = S.project.id; p.updatedAt = Date.now();
    S.project = p;
    const i = S.projectsIndex.findIndex(e => e.id === p.id);
    if(i >= 0) S.projectsIndex[i] = indexEntryFor(p);
    await saveIndex(); await storSet(proj_key(p.id), p);
    S.undoStack = []; S.redoStack = [];
    render();
    toast(L('Version de Google Drive récupérée.','Version retrieved from Google Drive.'));
  }catch(e){ toast(L('Récupération depuis Google Drive impossible.','Couldn\u2019t retrieve from Google Drive.')); }
}

/* ---------------------------------------------------------------------
   5. PANNEAU « COFFRE-FORT » DANS LES PARAMÈTRES
--------------------------------------------------------------------- */
function vaultSettingsHtml(){
  const linked = vaultActive();
  const needPerm = (V.handle && !V.ok);
  const cid = gdClientId();
  const vaultStatus = linked
    ? L('Relié à ','Linked to ') + '<b>' + esc(V.name || L('ton fichier','your file')) + '</b>' + (V.at ? L(' · dernière écriture ',' · last write ') + esc(timeAgo(V.at)) : '')
    : needPerm
      ? L('Fichier mémorisé (<b>' + esc(V.name || '') + '</b>) : clique sur « Reconnecter le fichier » pour redonner l\u2019autorisation.', 'File remembered (<b>' + esc(V.name || '') + '</b>): click \u201cReconnect the file\u201d to grant permission again.')
      : L('Aucun fichier relié pour l\u2019instant', 'No file linked yet');
  return `
    <div class="panel-block"><h4>${L('Google Drive (facultatif, gratuit)','Google Drive (optional, free)')}</h4>
      <p class="sset-sub">${L('Une copie de ton scénario dans <b>ton</b> Google Drive, mise à jour toute seule.','A copy of your screenplay in <b>your</b> Google Drive, updated automatically.')}</p>
      <ul class="sset-points">
        <li>${L('Tu le retrouves sur tous tes appareils','You can reach it from all your devices')}</li>
        <li>${L('Raging Page ne voit que ses propres fichiers, jamais le reste de ton Drive','Raging Page only sees its own files, never the rest of your Drive')}</li>
        <li>${L('Tu peux te déconnecter à tout moment','You can disconnect at any time')}</li>
      </ul>
      <div class="sset-actions">
        ${ gdConnected()
            ? `<button class="btn btn-sm btn-primary" data-act="gdPushNow">${L('Envoyer maintenant','Send now')}</button>
               <button class="btn btn-sm" data-act="gdPull">${L('Récupérer depuis Drive','Retrieve from Drive')}</button>
               <button class="btn btn-sm btn-ghost" data-act="gdDisconnect">${L('Se déconnecter','Disconnect')}</button>`
            : `<button class="btn btn-sm btn-primary" data-act="gdConnect">${L('Se connecter avec Google','Sign in with Google')}</button>` }
      </div>
      <div class="sset-status ${gdConnected() ? 'ok' : ''}"><span class="sset-dot"></span><span>${ gdConnected()
          ? (S.project && gdLinkState(S.project.id) !== true
              ? L('Connecté · ce scénario n\u2019est pas relié à ton Drive (il reste dans ce navigateur)','Connected · this screenplay isn\u2019t linked to your Drive (it stays in this browser)')
              : L('Connecté : ton scénario est copié automatiquement','Connected: your screenplay is copied automatically') + (GD.at ? L(' · dernier envoi ',' · last sent ') + esc(timeAgo(GD.at)) : ''))
          : (gdClientId() ? L('Pas encore connecté : un clic, ton compte Google, et c\u2019est fait','Not connected yet: one click, your Google account, done') : L('Google Drive n\u2019est pas encore activé sur ce site','Google Drive isn\u2019t enabled on this site yet')) }</span></div>
      ${ gdConnected() && S.project ? `<div class="sset-actions" style="margin-top:8px;">${ gdLinkState(S.project.id) === true
          ? `<button class="btn btn-sm btn-ghost" data-act="gdLinkToggle">${L('Ne plus envoyer ce scénario sur Drive','Stop sending this screenplay to Drive')}</button>`
          : `<button class="btn btn-sm" data-act="gdLinkToggle">${icon('cloud')} ${L('Relier ce scénario à mon Drive','Link this screenplay to my Drive')}</button>` }</div>
        <p class="sset-hint" style="margin:6px 0 0;">${L('Chaque scénario a son propre fichier sur ton Drive et se relie à part.','Each screenplay has its own file on your Drive and is linked separately.')}</p>` : '' }
      ${ GD_BUILTIN_CLIENT_ID ? '' : `<details class="sset-more"><summary>${L('Réglage du site (une seule fois, pour l\u2019hébergeur)','Site setup (one time, for the host)')}</summary>
        <div class="field" style="margin-top:8px;"><label>${L('Identifiant client Google (OAuth)','Google client ID (OAuth)')}</label>
          <input type="text" id="gdClientId" placeholder="xxxxxxxx.apps.googleusercontent.com" value="${esc(cid)}">
        </div>
        <button class="btn btn-sm" data-act="gdSaveClientId">${L('Enregistrer l\u2019identifiant','Save the ID')}</button>
        <p class="opt-help" style="margin-top:8px;">${L('Pour que tes visiteurs n\u2019aient rien à régler, colle cet identifiant dans le fichier, à la ligne <code>GD_BUILTIN_CLIENT_ID</code>.','So your visitors have nothing to set up, paste this ID in the file, on the <code>GD_BUILTIN_CLIENT_ID</code> line.')}</p></details>` }
    </div>
    <div class="panel-block"><h4>${L('Coffre-fort : fichier sur mon ordinateur','Vault: file on my computer')}</h4>
      <p class="sset-sub">${L('Le plus sûr : ce scénario est relié à un vrai fichier <b>.smmproj</b> de ton ordinateur.','The safest option: this screenplay is linked to a real <b>.smmproj</b> file on your computer.')}</p>
      <ul class="sset-points">
        <li>${L('Réécrit tout seul quelques secondes après chaque modification','Rewritten automatically a few seconds after each change')}</li>
        <li>${L('Vider ou changer de navigateur n\u2019y change rien','Clearing or switching browsers changes nothing')}</li>
        <li>${L('Le fichier reste sur ton disque, à toi','The file stays on your disk, yours')}</li>
      </ul>
      ${ !FSA_OK ? `<div class="sset-status warn"><span class="sset-dot"></span><span>${L('Ce navigateur ne peut pas écrire directement dans un fichier. Utilise Chrome, Edge ou Opera sur ordinateur ; ici, garde la sauvegarde automatique ci-dessous.','This browser can\u2019t write directly to a file. Use Chrome, Edge or Opera on desktop; here, keep the automatic backup below.')}</span></div>` : `
      <div class="sset-actions">
        <button class="btn btn-sm ${linked?'':'btn-primary'}" data-act="vaultAttach">${icon('save')} ${linked?L('Changer de fichier','Change file'):L('Lier un fichier','Link a file')}</button>
        ${ needPerm ? `<button class="btn btn-sm btn-primary" data-act="vaultReconnect">${L('Reconnecter le fichier','Reconnect the file')}</button>` : '' }
        ${ linked ? `<button class="btn btn-sm" data-act="vaultForceWrite">${L('Écrire maintenant','Write now')}</button>
                     <button class="btn btn-sm btn-ghost btn-danger" data-act="vaultDetach">${L('Détacher','Detach')}</button>` : '' }
        <button class="btn btn-sm btn-ghost" data-act="vaultOpenFromFile">${icon('upload')} ${L('Ouvrir un .smmproj','Open a .smmproj')}</button>
      </div>
      <div class="sset-status ${linked ? 'ok' : (needPerm ? 'warn' : '')}"><span class="sset-dot"></span><span>${vaultStatus}</span></div>
      ${ __storageMode !== 'idb' ? `<details class="sset-more"><summary>${L('À savoir sur cette configuration','About this setup')}</summary><p class="opt-help" style="margin-top:8px;">${L('<b>Dans cette configuration, le lien vers le fichier ne survit pas au rechargement</b> (le navigateur n\u2019autorise pas à mémoriser l\u2019autorisation ici, typiquement parce que la page est ouverte en file:// ou dans un cadre). Le fichier, lui, est bien écrit pendant toute la session ; au prochain lancement, un clic sur « Ouvrir un .smmproj » rouvre le scénario et rétablit le lien. Pour que tout devienne automatique, place le fichier sur une adresse http(s) — un hébergement gratuit suffit.','<b>In this setup, the link to the file doesn\u2019t survive a reload</b> (the browser doesn\u2019t allow remembering the permission here, typically because the page is opened over file:// or inside a frame). The file itself is written correctly throughout the session; on the next launch, clicking \u201cOpen a .smmproj\u201d reopens the screenplay and restores the link. To make everything automatic, host the file at an http(s) address — free hosting is enough.')}</p></details>` : '' }`}
    </div>`;
}
function vaultForceWrite(){ flushVaultWrite(); toast(L('Écriture dans le fichier demandée.','Write to the file requested.')); }
function gdPushNow(){ gdPush(false); }
function gdChipClick(){
  if(gdConnected()){ try{ switchTab('settings'); }catch(e){} return; }
  gdConnect();
}
/* CONNEXION QUI SURVIT AU RECHARGEMENT, SANS FENÊTRE GOOGLE IMPRÉVUE.
   La fenêtre Google ne s'ouvre plus JAMAIS d'elle-même : seulement quand on clique sur un bouton Drive
   (pastille « Drive à reconnecter », « Oui, me reconnecter », Paramètres). Avant, le site tentait une
   reconnexion à chaque ouverture (et le navigateur pouvait afficher la page Google sans qu'on ait rien
   demandé). À la place, l'accès donné par Google (valable environ une heure, limité aux fichiers créés par
   Raging Page) est gardé dans ce navigateur jusqu'à son expiration : recharger la page ou rouvrir le site
   dans l'heure ne déconnecte plus. « Se déconnecter » l'efface. */
const GD_TOK_KEY = 'scriptmm_gdrive_tok';
function gdSaveToken(){
  try{
    if(GD.token && GD.exp > Date.now()) localStorage.setItem(GD_TOK_KEY, JSON.stringify({ t:GD.token, e:GD.exp }));
    else localStorage.removeItem(GD_TOK_KEY);
  }catch(e){}
}
window.__rpGdAuto = { state:'idle' };   // V82 : la fenêtre de reconnexion attend la tentative silencieuse
(function(){
  try{
    const wanted = localStorage.getItem(GD_ON_KEY) === '1';
    const raw = wanted ? JSON.parse(localStorage.getItem(GD_TOK_KEY) || 'null') : null;
    if(raw && raw.t && raw.e > Date.now() + 30000){ GD.token = raw.t; GD.exp = raw.e; }
    else localStorage.removeItem(GD_TOK_KEY);
  }catch(e){}
  window.__rpGdAuto.state = 'done';
})();

/* ---------------------------------------------------------------------
   6. BRANCHEMENTS
   On enveloppe les fonctions existantes au lieu de les modifier : le
   comportement d'origine est appelé tel quel, on ajoute juste le coffre
   par-dessus. Aucune ligne de l'ancien code ne change de sens.
--------------------------------------------------------------------- */
const __origDoAutosave = doAutosave;
doAutosave = async function(){
  await __origDoAutosave.apply(this, arguments);
  scheduleVaultWrite();
  scheduleDrivePush();
};
const __origRender = render;
render = function(){
  __origRender.apply(this, arguments);
  try{ updateVaultChip(); }catch(e){}
};
const __origOpenProject = openProject;
openProject = async function(id){
  await __origOpenProject.apply(this, arguments);
  if(S.project && S.project.id === id){ try{ await vaultLoadFor(id); }catch(e){} }
};
/* Un coffre actif rend inutile le téléchargement automatique toutes les
   20 minutes : le fichier est déjà à jour en permanence. */
const __origDueForBackup = dueForBackup;
dueForBackup = function(){
  if(vaultActive() || gdConnected()) return false;
  return __origDueForBackup.apply(this, arguments);
};

/* Dernière écriture avant de quitter, et avertissement franc quand il n'y
   a réellement nulle part où écrire. */
function onBeforeUnloadVault(e){
  if(vaultActive()){ try{ flushVaultWrite(); }catch(err){} }
  if(S.project && __storageMode === 'none' && !vaultActive()){
    e.preventDefault(); e.returnValue = '';
    return '';
  }
}
async function vaultInit(){
  const mode = await checkStorageHealth();
  window.addEventListener('beforeunload', onBeforeUnloadVault);
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) flushVaultWrite(); });
  if(mode === 'none') showStorageBanner();
  updateVaultChip();
}

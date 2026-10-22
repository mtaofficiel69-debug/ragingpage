/* =====================================================================
   PASTILLE « DRIVE » — l'état de Google Drive, visible dans l'éditeur
   Elle se place à côté de la pastille « Coffre » (même look, mêmes
   couleurs) et dit à tout moment si la copie Drive de CE scénario est à
   jour. Avant, l'état de Drive n'apparaissait que dans Paramètres, et si
   la session Google expirait pendant l'écriture (le jeton dure environ une
   heure), l'envoi automatique s'arrêtait sans aucun signal.
     · Drive OK               dernier envoi réussi, rien de modifié depuis
     · Drive…                 envoi en cours (ou reconnexion automatique)
     · Drive : en attente     connecté, ce scénario part ~30 s après la
                              prochaine modification (clic = envoyer maintenant)
     · Drive en erreur        le dernier envoi a échoué (clic = réessayer)
     · Drive à reconnecter    la connexion a expiré : plus rien n'est envoyé
                              tant qu'elle est coupée (clic = se reconnecter)
   Pastille cachée si Drive n'a jamais été connecté (ou après « Se déconnecter »).
   Rien de l'ancien code n'est modifié : on enveloppe les fonctions existantes.
--------------------------------------------------------------------- */
const DRIVE_SENT = {};   // id du scénario -> heure du dernier envoi réussi (depuis l'ouverture du site)
function driveWanted(){ try{ return localStorage.getItem(GD_ON_KEY) === '1'; }catch(e){ return false; } }
function updateDriveChip(){
  const chip = document.getElementById('driveChip');
  if(!chip) return;
  if(!S.project){ chip.style.display = 'none'; return; }
  const connected = gdConnected();
  if(!connected && !driveWanted()){ chip.style.display = 'none'; return; }
  chip.style.display = '';
  const pending = !!(window.__rpGdAuto && window.__rpGdAuto.state === 'pending');
  const sentAt = DRIVE_SENT[S.project.id] || 0;
  let cls = 'vault-chip', txt = '', title = '';
  if(!connected && pending){
    cls += ' off'; txt = L('Drive…','Drive…');
    title = L('Reconnexion automatique à Google Drive en cours…','Reconnecting to Google Drive automatically…');
  }else if(!connected){
    cls += ' warn'; txt = L('Drive à reconnecter','Drive to reconnect');
    title = L('La connexion à Google Drive a expiré. Tant qu\u2019elle est coupée, ce scénario n\u2019est plus envoyé sur ton Drive (il reste sauvegardé dans le navigateur). Clique pour te reconnecter.',
              'The Google Drive connection has expired. While it is off, this screenplay is no longer sent to your Drive (it is still saved in the browser). Click to reconnect.');
  }else if(GD.busy){
    cls += ' ok'; txt = L('Drive…','Drive…');
    title = L('Envoi vers ton Google Drive en cours…','Sending to your Google Drive…');
  }else if(GD.err === 'push'){
    cls += ' warn'; txt = L('Drive en erreur','Drive error');
    title = L('Le dernier envoi vers Google Drive a échoué. Clique pour réessayer.','The last send to Google Drive failed. Click to try again.');
  }else if(gdLinkState(S.project.id) !== true){
    cls += ' off'; txt = L('Drive : non relié','Drive: not linked');
    title = L('Ce scénario n\u2019est pas enregistré sur ton Google Drive. Clique pour le relier : il aura son propre fichier, mis à jour tout seul.',
              'This screenplay isn\u2019t saved to your Google Drive. Click to link it: it gets its own file, updated automatically.');
  }else if(!gdIsDirty(S.project.id) && gdFileId(S.project.id)){
    cls += ' ok'; txt = L('Drive OK','Drive OK');
    title = (sentAt ? L('Dernier envoi vers ton Google Drive : ','Last sent to your Google Drive: ') + timeAgo(sentAt) : L('Ton Google Drive est à jour','Your Google Drive is up to date')) + L('. Clique pour envoyer maintenant.','. Click to send now.');
  }else{
    cls += ' off'; txt = L('Drive : en attente','Drive: pending');
    title = L('Connecté. Ce scénario est envoyé sur ton Drive environ 30 secondes après ta prochaine modification. Clique pour l\u2019envoyer maintenant.',
              'Connected. This screenplay is sent to your Drive about 30 seconds after your next change. Click to send it now.');
  }
  chip.className = cls; chip.textContent = txt; chip.title = title;
}
ACTIONS.driveChipClick = function(){
  if(!S.project) return;
  if(!gdConnected()){ gdConnect(); return; }
  gdPush(false);
};
/* Mise à jour de la pastille chaque fois que la pastille Coffre est rafraîchie
   (changement d'écran, de langue, de scénario…) et à la fin de chaque envoi. */
const __driveOrigUpdateVaultChip = updateVaultChip;
updateVaultChip = function(){
  const r = __driveOrigUpdateVaultChip.apply(this, arguments);
  try{ updateDriveChip(); }catch(e){}
  return r;
};
const __driveOrigPush = gdPush;
gdPush = async function(silent, proj){
  const P = proj || S.project, pid = P && P.id, before = GD.at;
  try{ return await __driveOrigPush.apply(this, arguments); }
  finally{
    if(pid && GD.at !== before && !GD.err) DRIVE_SENT[pid] = GD.at;
    try{ updateDriveChip(); }catch(e){}
  }
};
const __driveOrigConnect = gdConnect;
gdConnect = async function(){
  try{ return await __driveOrigConnect.apply(this, arguments); }
  finally{ try{ updateDriveChip(); }catch(e){} }
};
const __driveOrigDisconnect = gdDisconnect;
gdDisconnect = function(){
  const r = __driveOrigDisconnect.apply(this, arguments);
  try{ updateDriveChip(); }catch(e){}
  return r;
};
/* L'expiration du jeton n'appelle aucune fonction : on la surveille. */
setInterval(()=>{ try{ updateDriveChip(); }catch(e){} }, 15000);

/* ---------------------------------------------------------------------
   EXPIRATION DE LA CONNEXION GOOGLE DRIVE — sans jamais ouvrir Google tout seul
   L'accès donné par Google dure environ une heure (un site sans serveur n'en
   obtient pas de plus long). Quand il expire, rien ne s'ouvre : la pastille
   passe à « Drive à reconnecter », un seul message discret le signale, et
   l'écriture continue (tout reste sauvegardé dans le navigateur). Un clic sur
   la pastille reconnecte ; la fenêtre Google se referme alors d'elle-même et
   les modifications faites entre-temps partent aussitôt sur le Drive.
--------------------------------------------------------------------- */
let __gdWasConnected = gdConnected();
setInterval(() => {
  const now = gdConnected();
  if(__gdWasConnected && !now && driveWanted() && S.project && S.view === 'editor'){
    toast(L('Google Drive : la connexion a expiré. Ton travail reste sauvegardé ici ; clique sur la pastille « Drive à reconnecter » quand tu veux reprendre l\u2019envoi.',
            'Google Drive: the connection has expired. Your work is still saved here; click the \u201cDrive to reconnect\u201d chip whenever you want sending to resume.'));
  }
  __gdWasConnected = now;
}, 15000);
/* Après une (re)connexion, ce qui n'était pas encore parti est envoyé tout de suite. */
const __driveConnect2 = gdConnect;
gdConnect = async function(){
  const r = await __driveConnect2.apply(this, arguments);
  __gdWasConnected = gdConnected();
  return r;
};

/* ---------------------------------------------------------------------
   UN SCÉNARIO = SON PROPRE FICHIER DRIVE, ET UNE CONNEXION POUR TOUTE L'APPLI
   · La connexion vaut pour tout le site : accueil, chaque scénario, nouveaux
     scénarios. Elle ne tombe qu'à l'expiration de l'accès Google ou sur
     « Se déconnecter ».
   · Chaque scénario est relié (ou non) à SON fichier Drive. Ouvrir ou créer
     un scénario pas encore décidé, quand Drive est connecté, affiche une
     petite carte « Enregistrer ce scénario sur ton Drive ? » (Oui / Non,
     mémorisé pour ce scénario ; la croix = plus tard). Jamais de fenêtre
     qui bloque, jamais d'envoi d'un scénario non relié.
   · Seules les vraies modifications comptent (pas les réenregistrements),
     et en quittant un scénario ce qui n'était pas parti est envoyé tout de
     suite, au lieu d'attendre 30 secondes.
--------------------------------------------------------------------- */
const __gdOrigScheduleAutosave = scheduleAutosave;
scheduleAutosave = function(){
  if(S.project){ GD_EDIT_SEQ++; gdSetDirty(S.project.id, true); }
  return __gdOrigScheduleAutosave.apply(this, arguments);
};
/* Envoi immédiat d'un scénario qu'on quitte (attend la fin d'un envoi en cours). */
async function gdFlushProject(P){
  if(!P || !gdConnected() || gdLinkState(P.id) !== true || !gdIsDirty(P.id)) return;
  clearTimeout(GD.timer);
  for(let i = 0; i < 100 && GD.busy; i++) await new Promise(r => setTimeout(r, 200));
  try{ await gdPush(true, P); }catch(e){}
}
const __gdOrigGoHome = goHome;
goHome = function(){
  const P = S.project;
  const r = __gdOrigGoHome.apply(this, arguments);     // la sauvegarde finale a lieu ici (flushAutosave)
  gdFlushProject(P);
  gdAskHide();
  return r;
};
if(ACTIONS.goHome) ACTIONS.goHome = goHome;
const __gdOrigOpenProject = openProject;
openProject = async function(id){
  const prev = (S.view === 'editor' && S.project && S.project.id !== id) ? S.project : null;
  if(prev){ try{ flushAutosave(); }catch(e){} gdFlushProject(prev); }
  gdAskHide();
  const r = await __gdOrigOpenProject.apply(this, arguments);
  // Relié et modifié depuis le dernier envoi (site fermé avant l'envoi, par exemple) : il part maintenant.
  if(S.project && S.project.id === id && gdConnected() && gdLinkState(id) === true && gdIsDirty(id)) setTimeout(() => { if(S.project && S.project.id === id) gdPush(true); }, 2500);
  return r;
};
if(ACTIONS.openProject) ACTIONS.openProject = openProject;

/* ---- la petite carte « Enregistrer ce scénario sur ton Drive ? » ---- */
const GD_ASK_LATER = {};   // croix : on ne redemande pas pour ce scénario avant la prochaine ouverture du site
let __gdAskTimer = null;
function gdAskHide(){ clearTimeout(__gdAskTimer); __gdAskTimer = null; const c = document.getElementById('gdLinkAsk'); if(c) c.remove(); }
function gdAskShouldShow(){
  const P = S.project;
  return !!(P && S.view === 'editor' && gdConnected() && gdLinkState(P.id) === null && !GD_ASK_LATER[P.id] && !document.querySelector('.modal-backdrop, .mmd-backdrop'));
}
function gdAskMaybe(){
  if(!gdAskShouldShow()){ if(!(S.project && S.view === 'editor' && gdConnected() && gdLinkState(S.project.id) === null)) gdAskHide(); return; }
  const cur = document.getElementById('gdLinkAsk');
  if(cur && cur.dataset.pid === S.project.id && cur.dataset.lang === getLang()) return;   // autre langue : la carte est refaite
  if(__gdAskTimer) return;
  __gdAskTimer = setTimeout(() => {
    __gdAskTimer = null;
    if(!gdAskShouldShow()) return;
    gdAskHide();
    const P = S.project;
    const d = document.createElement('div');
    d.id = 'gdLinkAsk'; d.className = 'gd-ask'; d.dataset.pid = P.id; d.dataset.lang = getLang();
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-live', 'polite');
    d.innerHTML = `<button type="button" class="fp-x gd-ask-x" data-act="gdAskLater" title="${L('Plus tard','Later')}" aria-label="${L('Plus tard','Later')}">${icon('close')}</button>
      <div class="gd-ask-h"><span class="gd-ask-ico">${icon('cloud')}</span><div>
        <b>${L('Enregistrer ce scénario sur ton Drive\u00a0?','Save this screenplay to your Drive?')}</b>
        <p>${L('«\u00a0' + esc(P.title || 'Sans titre') + '\u00a0» aura son propre fichier dans ton Google Drive, mis à jour tout seul. Chaque scénario se décide à part.','\u201c' + esc(P.title || 'Untitled') + '\u201d gets its own file in your Google Drive, updated automatically. Each screenplay is decided separately.')}</p>
      </div></div>
      <div class="gd-ask-act"><button type="button" class="btn btn-sm btn-ghost" data-act="gdAskNo">${L('Non, pas celui-ci','No, not this one')}</button>
        <button type="button" class="btn btn-sm btn-primary" data-act="gdAskYes">${L('Oui, l\u2019enregistrer','Yes, save it')}</button></div>`;
    document.body.appendChild(d);
  }, 900);
}
ACTIONS.gdAskYes = function(){
  const c = document.getElementById('gdLinkAsk'), pid = c && c.dataset.pid; gdAskHide();
  if(!S.project || S.project.id !== pid) return;
  gdSetLinked(pid, true); gdSetDirty(pid, true);
  gdPush(true).then(() => { if(gdFileId(pid)) toast(L('Ce scénario est maintenant enregistré sur ton Google Drive.','This screenplay is now saved to your Google Drive.')); });
  updateDriveChip();
};
ACTIONS.gdAskNo = function(){
  const c = document.getElementById('gdLinkAsk'), pid = c && c.dataset.pid; gdAskHide();
  if(!pid) return;
  gdSetLinked(pid, false); updateDriveChip();
  toast(L('Ce scénario reste seulement dans ce navigateur. La pastille « Drive : non relié » permet de changer d\u2019avis.','This screenplay stays in this browser only. The \u201cDrive: not linked\u201d chip lets you change your mind.'));
};
ACTIONS.gdAskLater = function(){
  const c = document.getElementById('gdLinkAsk'), pid = c && c.dataset.pid; gdAskHide();
  if(pid) GD_ASK_LATER[pid] = true;
};
/* La carte suit l'état de la pastille : même moments (rendu, changement de scénario, connexion, minuterie). */
const __gdAskUpdateChip = updateDriveChip;
updateDriveChip = function(){
  const r = __gdAskUpdateChip.apply(this, arguments);
  try{ gdAskMaybe(); }catch(e){}
  return r;
};
ACTIONS.gdLinkToggle = function(){
  if(!S.project) return;
  const pid = S.project.id;
  if(gdLinkState(pid) === true){
    gdSetLinked(pid, false);
    toast(L('Ce scénario n\u2019est plus envoyé sur ton Drive (le fichier déjà envoyé y reste).','This screenplay is no longer sent to your Drive (the file already sent stays there).'));
  }else{
    gdSetLinked(pid, true); gdSetDirty(pid, true); gdAskHide();
    gdPush(true).then(() => { if(gdFileId(pid)) toast(L('Ce scénario est maintenant enregistré sur ton Google Drive.','This screenplay is now saved to your Google Drive.')); });
  }
  updateDriveChip();
  if(S.view === 'editor' && S.tab === 'settings') renderTabBody();
};

/* ---------------------------------------------------------------------
   RATTRAPAGE : aucun scénario relié ne reste en retard sur le Drive
   · Après une (re)connexion, et à l'ouverture du site quand l'accès est
     encore valable, TOUS les scénarios reliés modifiés depuis leur dernier
     envoi partent (pas seulement celui qui est ouvert) : modifications
     faites pendant une coupure, ou juste avant de fermer/recharger le site.
   · Un scénario supprimé emporte ses réglages Drive (le fichier déjà envoyé
     reste dans le Drive).
--------------------------------------------------------------------- */
let __gdSyncing = false;
async function gdSyncAllDirty(){
  if(__gdSyncing || !gdConnected()) return;
  __gdSyncing = true;
  try{
    const ids = (S.projectsIndex || []).map(e => e.id).filter(id => gdLinkState(id) === true && gdIsDirty(id));
    for(const id of ids){
      if(!gdConnected()) break;
      for(let i = 0; i < 150 && GD.busy; i++) await new Promise(r => setTimeout(r, 200));
      if(!gdIsDirty(id)) continue;                         // déjà parti entre-temps
      let P = (S.project && S.project.id === id) ? S.project : null;
      if(!P){ try{ P = await storGet(proj_key(id)); }catch(e){ P = null; } }
      if(P && P.id === id) await gdPush(true, P);
    }
  }catch(e){}
  __gdSyncing = false;
}
const __gdSyncConnect = gdConnect;
gdConnect = async function(){
  const r = await __gdSyncConnect.apply(this, arguments);
  gdSyncAllDirty();
  return r;
};
setTimeout(() => { if(gdConnected()) gdSyncAllDirty(); }, 3000);   // ouverture du site, accès encore valable
const __gdDelProject = deleteProject;
deleteProject = async function(id){
  const r = await __gdDelProject.apply(this, arguments);
  if(!(S.projectsIndex || []).some(e => e.id === id)){            // vraiment supprimé (pas annulé)
    try{ [GD_LINK_KEY(id), GD_DIRTY_KEY(id), GD_FILE_KEY(id)].forEach(k => localStorage.removeItem(k)); }catch(e){}
    delete GD_DIRTY[id];
  }
  return r;
};
if(ACTIONS.deleteProject) ACTIONS.deleteProject = deleteProject;


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
  }else if(sentAt && (S.project.updatedAt || 0) <= sentAt){
    cls += ' ok'; txt = L('Drive OK','Drive OK');
    title = L('Dernier envoi vers ton Google Drive : ','Last sent to your Google Drive: ') + timeAgo(sentAt) + L('. Clique pour envoyer maintenant.','. Click to send now.');
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
gdPush = async function(){
  const pid = S.project && S.project.id, before = GD.at;
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

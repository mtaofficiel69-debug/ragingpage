/* =====================================================================
   PASTILLE « DRIVE » — l'état de Google Drive, visible dans l'éditeur
   Elle se place à côté de la pastille « Coffre » (même look, mêmes
   couleurs) et dit à tout moment si la copie Drive de CE scénario est à
   jour.
     · Drive OK                  dernier envoi réussi, rien de modifié depuis
     · Drive…                    envoi en cours, ou reconnexion automatique
     · Drive : en attente        modifié depuis le dernier envoi : il part
                                 tout seul (clic = envoyer maintenant)
     · Drive : connecté          une copie existe sur ton Drive ; pas de
                                 suivi précis avant le prochain envoi
     · Drive : pas encore envoyé ce scénario n'est pas encore sur ton Drive
     · Drive en erreur           le dernier envoi a échoué (clic = réessayer)
     · Drive à reconnecter       connexion perdue : plus rien n'est envoyé
                                 (clic = se reconnecter)
   Pastille cachée si Drive n'a jamais été connecté (ou après « Se déconnecter »).

   « À jour » se juge sur le CONTENU du scénario (une empreinte mémorisée à
   chaque envoi réussi), pas sur l'heure : quitter puis rouvrir un scénario
   non modifié reste « Drive OK ».

   Connexion qui tient : le jeton Google dure environ une heure. Il est
   maintenant renouvelé en silence (sans fenêtre) quelques minutes avant la
   fin, et re-tenté en silence s'il a expiré ; si Google refuse, la pastille
   passe à « à reconnecter » et un clic suffit. Les modifications faites
   pendant que Drive était coupé, ou juste avant de quitter un scénario, sont
   renvoyées automatiquement au lieu d'être oubliées.

   Rien de l'ancien code n'est modifié : on enveloppe les fonctions existantes.
--------------------------------------------------------------------- */
const DRIVE_REC_KEY = id => 'scriptmm_gdrive_sent_' + id;   // { sig, at } du dernier envoi réussi
const DRIVE_RENEW = { busy:false, last:0 };
const DRIVE_AUTOPUSH = {};                                   // id -> heure du dernier renvoi automatique
function driveWanted(){ try{ return localStorage.getItem(GD_ON_KEY) === '1'; }catch(e){ return false; } }
function driveRec(pid){
  try{ const r = JSON.parse(localStorage.getItem(DRIVE_REC_KEY(pid)) || 'null'); return (r && r.sig) ? r : null; }catch(e){ return null; }
}
function driveSetRec(pid, sig, at){ try{ localStorage.setItem(DRIVE_REC_KEY(pid), JSON.stringify({ sig, at })); }catch(e){} }
/* Empreinte du contenu du scénario (l'heure de modification est ignorée). */
function driveHash(s){
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for(let i = 0, c; i < s.length; i++){ c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36) + ':' + s.length;
}
let __driveSigCache = { p:null, u:-1, sig:'' };
function driveSig(force){
  const p = S.project;
  if(!p) return '';
  if(!force && __driveSigCache.p === p && __driveSigCache.u === p.updatedAt) return __driveSigCache.sig;
  let sig = '';
  try{ sig = driveHash(JSON.stringify(p, (k, v)=> k === 'updatedAt' ? undefined : v)); }catch(e){}
  __driveSigCache = { p, u:p.updatedAt, sig };
  return sig;
}
function updateDriveChip(){
  const chip = document.getElementById('driveChip');
  if(!chip) return;
  if(!S.project){ chip.style.display = 'none'; return; }
  const connected = gdConnected();
  if(!connected && !driveWanted()){ chip.style.display = 'none'; return; }
  chip.style.display = '';
  const pending = !!(window.__rpGdAuto && window.__rpGdAuto.state === 'pending') || DRIVE_RENEW.busy;
  const pid = S.project.id;
  let cls = 'vault-chip', txt = '', title = '';
  if(!connected && pending){
    cls += ' off'; txt = L('Drive…','Drive…');
    title = L('Reconnexion automatique à Google Drive en cours…','Reconnecting to Google Drive automatically…');
  }else if(!connected){
    cls += ' warn'; txt = L('Drive à reconnecter','Drive to reconnect');
    title = L('La connexion à Google Drive est coupée. Tant qu\u2019elle l\u2019est, ce scénario n\u2019est plus envoyé sur ton Drive (il reste sauvegardé dans le navigateur). Clique pour te reconnecter.',
              'The Google Drive connection is off. While it is, this screenplay is no longer sent to your Drive (it is still saved in the browser). Click to reconnect.');
  }else if(GD.busy){
    cls += ' ok'; txt = L('Drive…','Drive…');
    title = L('Envoi vers ton Google Drive en cours…','Sending to your Google Drive…');
  }else if(GD.err === 'push'){
    cls += ' warn'; txt = L('Drive en erreur','Drive error');
    title = L('Le dernier envoi vers Google Drive a échoué. Clique pour réessayer.','The last send to Google Drive failed. Click to try again.');
  }else{
    const rec = driveRec(pid);
    if(rec && rec.sig === driveSig()){
      cls += ' ok'; txt = L('Drive OK','Drive OK');
      title = L('Dernier envoi vers ton Google Drive : ','Last sent to your Google Drive: ') + timeAgo(rec.at) + L('. Clique pour envoyer maintenant.','. Click to send now.');
    }else if(rec){
      cls += ' off'; txt = L('Drive : en attente','Drive: pending');
      title = L('Modifié depuis le dernier envoi : ce scénario part tout seul sur ton Drive dans quelques instants. Clique pour l\u2019envoyer maintenant.',
                'Changed since the last send: this screenplay goes to your Drive on its own in a few moments. Click to send it now.');
    }else if(gdFileId(pid)){
      cls += ' off'; txt = L('Drive : connecté','Drive: connected');
      title = L('Connecté. Une copie de ce scénario existe sur ton Drive ; elle sera mise à jour après ta prochaine modification. Clique pour l\u2019envoyer maintenant.',
                'Connected. A copy of this screenplay exists on your Drive; it will be updated after your next change. Click to send it now.');
    }else{
      cls += ' off'; txt = L('Drive : pas encore envoyé','Drive: not sent yet');
      title = L('Connecté, mais ce scénario n\u2019est pas encore sur ton Drive : il y part après ta prochaine modification. Clique pour l\u2019envoyer maintenant.',
                'Connected, but this screenplay is not on your Drive yet: it goes there after your next change. Click to send it now.');
    }
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
  let sig = ''; try{ sig = driveSig(true); }catch(e){}
  try{ return await __driveOrigPush.apply(this, arguments); }
  finally{
    if(pid && GD.at !== before && !GD.err && sig) driveSetRec(pid, sig, GD.at);
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
/* Renouvellement silencieux du jeton. Avant l'expiration, on redemande un jeton
   au client Google déjà créé (sans fenêtre) ; après, on refait la demande
   silencieuse habituelle. Au plus une tentative toutes les 2 minutes. */
function driveRenewNear(){
  return new Promise((resolve, reject)=>{
    if(!GD.tc) return reject(new Error('no-client'));
    GD.resolve = resolve; GD.reject = reject;
    try{ GD.tc.requestAccessToken({ prompt:'none' }); }
    catch(e){ GD.resolve = GD.reject = null; reject(e); }
  });
}
async function driveRenew(){
  DRIVE_RENEW.busy = true; DRIVE_RENEW.last = Date.now();
  try{ updateDriveChip(); }catch(e){}
  try{
    await Promise.race([
      gdConnected() ? driveRenewNear() : gdRequestToken('none'),
      new Promise((_, no)=> setTimeout(()=> no(new Error('timeout')), 8000))
    ]);
    GD.err = '';
  }catch(e){ GD.resolve = GD.reject = null; }
  DRIVE_RENEW.busy = false;
  try{ updateDriveChip(); }catch(e){}
  try{ if(S.view === 'editor' && S.tab === 'settings') renderTabBody(); }catch(e){}
}
function driveTick(){
  try{ updateDriveChip(); }catch(e){}
  if(!driveWanted() || !gdClientId()) return;
  const now = Date.now();
  if(window.__rpGdAuto && window.__rpGdAuto.state === 'pending') return;
  // 1. Garder la connexion : renouveler avant l'expiration, ou re-tenter après.
  if(!GD.busy && !GD.resolve && !DRIVE_RENEW.busy && now - DRIVE_RENEW.last > 120000){
    if(!gdConnected()) driveRenew();
    else if(GD.tc && GD.exp - now < 5 * 60000) driveRenew();
  }
  // 2. Ne rien oublier : renvoyer ce que l'envoi automatique n'a pas pu envoyer
  //    (modifs faites pendant une coupure, ou juste avant de quitter le scénario).
  if(gdConnected() && !GD.busy && !DRIVE_RENEW.busy && S.project){
    const pid = S.project.id, rec = driveRec(pid);
    if(rec && rec.sig !== driveSig(true) && now - (S.project.updatedAt || 0) > 35000 && now - (DRIVE_AUTOPUSH[pid] || 0) > 60000){
      DRIVE_AUTOPUSH[pid] = now;
      gdPush(true);
    }
  }
}
setInterval(driveTick, 15000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden){ try{ driveTick(); }catch(e){} } });

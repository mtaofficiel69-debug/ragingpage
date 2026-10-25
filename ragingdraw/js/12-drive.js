/* =====================================================================
   RAGING DRAW — GOOGLE DRIVE
   Même fonctionnement que dans Raging Page, et même connexion : Raging
   Page et Raging Draw sont sur le même site, se connecter dans l'un
   connecte l'autre. Chaque affiche reliée a son propre fichier .rdraw
   dans ton Drive, mis à jour tout seul environ 30 secondes après chaque
   modification. Raging Draw ne voit que les fichiers qu'il a créés
   (autorisation « drive.file »), jamais le reste de ton Drive.
   La fenêtre Google ne s'ouvre jamais d'elle-même : seulement quand on
   clique sur la pastille Drive ou dans le menu ⋮.
===================================================================== */
const GD_CLIENT_ID = '1070717972969-lk5q67452eocggr9jl2296mqakannt0g.apps.googleusercontent.com';  // celui de Raging Page
const GD_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GD_ON_KEY = 'scriptmm_gdrive_on', GD_TOK_KEY = 'scriptmm_gdrive_tok';   // partagés avec Raging Page
const RDGD_FILE = id => 'ragingdraw_gdrive_file_' + id;
const RDGD_LINK = id => 'ragingdraw_gdrive_link_' + id;
const RDGD_DIRTY = id => 'ragingdraw_gdrive_dirty_' + id;
const GD = {token:null, exp:0, tc:null, resolve:null, reject:null, timer:null, busy:false, err:'', at:{}};

(function(){
  try{
    const raw = lsGet(GD_ON_KEY) === '1' ? JSON.parse(lsGet(GD_TOK_KEY) || 'null') : null;
    if(raw && raw.t && raw.e > Date.now() + 30000){ GD.token = raw.t; GD.exp = raw.e; }
  }catch(e){}
})();
function gdConnected(){ return !!(GD.token && Date.now() < GD.exp); }
function gdWanted(){ return lsGet(GD_ON_KEY) === '1'; }
function gdSaveToken(){
  try{
    if(GD.token && GD.exp > Date.now()) localStorage.setItem(GD_TOK_KEY, JSON.stringify({t:GD.token, e:GD.exp}));
    else localStorage.removeItem(GD_TOK_KEY);
  }catch(e){}
}
function gdLinked(id){ return lsGet(RDGD_LINK(id)) === '1'; }
function gdSetLinked(id, on){ lsSet(RDGD_LINK(id), on ? '1' : '0'); }
function gdFile(id){ return lsGet(RDGD_FILE(id)) || ''; }
function gdSetFile(id, f){ try{ f ? localStorage.setItem(RDGD_FILE(id), f) : localStorage.removeItem(RDGD_FILE(id)); }catch(e){} }
function gdDirty(id){ return lsGet(RDGD_DIRTY(id)) === '1'; }
function gdSetDirty(id, on){ try{ on ? localStorage.setItem(RDGD_DIRTY(id), '1') : localStorage.removeItem(RDGD_DIRTY(id)); }catch(e){} }

function gdLoadScript(){
  return new Promise((resolve, reject) => {
    if(window.google && window.google.accounts && window.google.accounts.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => resolve(); s.onerror = () => reject(new Error('gsi'));
    document.head.appendChild(s);
  });
}
async function gdRequestToken(){
  if(gdConnected()) return GD.token;
  await gdLoadScript();
  if(!GD.tc){
    GD.tc = google.accounts.oauth2.initTokenClient({
      client_id:GD_CLIENT_ID, scope:GD_SCOPE,
      callback:resp => {
        if(resp && resp.access_token){
          GD.token = resp.access_token; GD.exp = Date.now() + ((resp.expires_in || 3600) - 120)*1000;
          lsSet(GD_ON_KEY, '1'); gdSaveToken();
          if(GD.resolve) GD.resolve(GD.token);
        }else if(GD.reject) GD.reject(new Error((resp && resp.error) || 'oauth'));
        GD.resolve = GD.reject = null;
      },
      error_callback:err => { if(GD.reject) GD.reject(new Error((err && err.type) || 'oauth')); GD.resolve = GD.reject = null; }
    });
  }
  return new Promise((resolve, reject) => {
    GD.resolve = resolve; GD.reject = reject;
    try{ GD.tc.requestAccessToken({prompt:''}); }catch(e){ GD.resolve = GD.reject = null; reject(e); }
  });
}
async function gdConnect(){
  if(location.protocol === 'file:'){
    rdAlert(L('Google Drive a besoin du site en ligne','Google Drive needs the online site'), L('Google n’autorise la connexion que depuis l’adresse du site. Ouvre Raging Draw en ligne pour relier tes affiches à ton Drive ; ici, tout reste enregistré dans ce navigateur.','Google only allows signing in from the site’s address. Open Raging Draw online to link your posters to your Drive; here, everything stays saved in this browser.'));
    return false;
  }
  try{
    await gdRequestToken();
    GD.err = '';
    toast(L('Google Drive connecté.','Google Drive connected.'));
    updateDriveChip();
    return true;
  }catch(e){
    GD.err = 'auth'; updateDriveChip();
    toast(L('Connexion à Google Drive impossible. Réessaie, et accepte la demande dans la fenêtre Google (autorise aussi les fenêtres pop-up).','Couldn’t connect to Google Drive. Try again, and accept the request in the Google window (also allow pop-ups).'), 'warn');
    return false;
  }
}
function gdDisconnect(){
  GD.token = null; GD.exp = 0; gdSaveToken();
  try{ localStorage.removeItem(GD_ON_KEY); }catch(e){}
  updateDriveChip();
  toast(L('Déconnecté de Google Drive (les fichiers déjà envoyés restent dans ton Drive).','Disconnected from Google Drive (files already sent stay in your Drive).'));
}
function gdPayload(d){
  const used = new Set(d.objects.filter(o => o.type === 'image' && o.asset).map(o => o.asset));
  const assets = {}; used.forEach(id => { if(d.assets[id]) assets[id] = d.assets[id]; });
  return JSON.stringify({app:'ragingdraw', v:1, doc:Object.assign({}, d, {assets})}, (k, v) => k === '_v' ? undefined : v);
}
async function gdUpload(fileId, name, content){
  const boundary = '-------ragingdraw' + Date.now();
  const meta = fileId ? {name} : {name, mimeType:'application/json'};
  const body = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) +
    '\r\n--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' + content + '\r\n--' + boundary + '--';
  const url = fileId ? 'https://www.googleapis.com/upload/drive/v3/files/' + encodeURIComponent(fileId) + '?uploadType=multipart&fields=id'
                     : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';
  const res = await fetch(url, {method:fileId ? 'PATCH' : 'POST', headers:{Authorization:'Bearer ' + GD.token, 'Content-Type':'multipart/related; boundary=' + boundary}, body});
  if(!res.ok) throw new Error('upload-' + res.status);
  return (await res.json()).id;
}
/* silent : envoi automatique, qui n'ouvre jamais Google et ne touche qu'aux affiches reliées */
async function gdPush(silent){
  const d = S.doc;
  if(!d || GD.busy) return;
  if(!gdConnected()){
    if(silent) return;
    if(!await gdConnect()) return;
  }
  if(!gdLinked(d.id)){ if(silent) return; gdSetLinked(d.id, true); }
  if(silent && !gdDirty(d.id) && gdFile(d.id)) return;
  GD.busy = true; updateDriveChip();
  const id = d.id;
  try{
    const name = safeName(d.title) + '.rdraw', body = gdPayload(d);
    let fid = gdFile(id);
    try{ fid = await gdUpload(fid, name, body); }
    catch(e){
      if(/upload-40[34]/.test(e.message)) fid = await gdUpload('', name, body);   // fichier supprimé côté Drive : on en recrée un
      else throw e;
    }
    gdSetFile(id, fid); gdSetDirty(id, false);
    GD.at[id] = Date.now(); GD.err = '';
    if(!silent) toast(L('Affiche envoyée dans ton Google Drive.','Poster sent to your Google Drive.'));
  }catch(e){
    GD.err = 'push';
    if(String(e && e.message) === 'upload-401'){ GD.token = null; GD.exp = 0; gdSaveToken(); }
    if(!silent) toast(L('Envoi vers Google Drive impossible.','Couldn’t send to Google Drive.'), 'warn');
  }
  GD.busy = false; updateDriveChip();
}
async function gdPull(){
  const d = S.doc; if(!d) return;
  const fid = gdFile(d.id);
  if(!fid){ toast(L('Cette affiche n’a pas encore de copie dans ton Drive.','This poster doesn’t have a copy in your Drive yet.')); return; }
  if(!gdConnected() && !await gdConnect()) return;
  if(!await rdConfirm(L('Remplacer par la version du Drive ?','Replace with the Drive version?'), L('L’affiche ouverte ici sera remplacée par celle de ton Google Drive. Tu peux revenir en arrière avec Ctrl+Z.','The poster open here will be replaced by the one in your Google Drive. You can go back with Ctrl+Z.'), L('Remplacer','Replace'))) return;
  try{
    const res = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fid) + '?alt=media', {headers:{Authorization:'Bearer ' + GD.token}});
    if(!res.ok) throw new Error('get');
    const data = await res.json();
    if(!data || data.app !== 'ragingdraw' || !data.doc || !Array.isArray(data.doc.objects)) throw new Error('shape');
    const n = data.doc;
    ['title','format','w','h','phys','bg','fx','objects'].forEach(k => { if(n[k] !== undefined) d[k] = n[k]; });
    Object.assign(d.assets, n.assets || {});
    S.sel = [];
    preloadImages(d).then(() => requestRender()); loadDocFonts(d).then(() => requestRender());
    commit(); render();
    toast(L('Version de Google Drive récupérée.','Version retrieved from Google Drive.'));
  }catch(e){ toast(L('Récupération depuis Google Drive impossible.','Couldn’t retrieve from Google Drive.'), 'warn'); }
}

/* ---------- Pastille, comme dans Raging Page ---------- */
function updateDriveChip(){
  const chip = document.getElementById('driveChip');
  if(!chip || !S.doc) return;
  const id = S.doc.id, connected = gdConnected();
  let cls = 'vault-chip', txt, title;
  if(!connected && gdWanted()){
    cls += ' warn'; txt = L('Drive à reconnecter','Drive to reconnect');
    title = L('La connexion à Google Drive a expiré. Ton affiche reste enregistrée dans ce navigateur. Clique pour te reconnecter.','The Google Drive connection has expired. Your poster is still saved in this browser. Click to reconnect.');
  }else if(!connected){
    cls += ' off'; txt = 'Google Drive';
    title = L('Garder une copie de cette affiche dans ton Google Drive, mise à jour toute seule. Clique pour te connecter.','Keep a copy of this poster in your Google Drive, updated automatically. Click to connect.');
  }else if(GD.busy){
    cls += ' ok'; txt = L('Drive…','Drive…'); title = L('Envoi vers ton Google Drive en cours…','Sending to your Google Drive…');
  }else if(GD.err === 'push'){
    cls += ' warn'; txt = L('Drive en erreur','Drive error'); title = L('Le dernier envoi a échoué. Clique pour réessayer.','The last send failed. Click to try again.');
  }else if(!gdLinked(id)){
    cls += ' off'; txt = L('Drive : non relié','Drive: not linked');
    title = L('Cette affiche n’est pas dans ton Google Drive. Clique pour la relier : elle aura son propre fichier, mis à jour tout seul.','This poster isn’t in your Google Drive. Click to link it: it gets its own file, updated automatically.');
  }else if(!gdDirty(id) && gdFile(id)){
    cls += ' ok'; txt = L('Drive OK','Drive OK');
    title = (GD.at[id] ? L('Dernier envoi : ','Last sent: ') + timeAgo(GD.at[id]) : L('Ton Google Drive est à jour','Your Google Drive is up to date')) + L('. Clique pour envoyer maintenant.','. Click to send now.');
  }else{
    cls += ' off'; txt = L('Drive : en attente','Drive: pending');
    title = L('Connecté. L’affiche part sur ton Drive environ 30 secondes après ta prochaine modification. Clique pour l’envoyer maintenant.','Connected. The poster goes to your Drive about 30 seconds after your next change. Click to send it now.');
  }
  chip.className = cls; chip.textContent = txt; chip.title = title;
}
ACT.driveChipClick = () => {
  if(!S.doc) return;
  if(!gdConnected()){ gdConnect().then(ok => { if(ok) gdPush(false); }); return; }
  gdPush(false);
};
function driveMenuItems(){
  const d = S.doc, c = gdConnected();
  const items = [{head:'Google Drive'}];
  if(!c) items.push({label:gdWanted() ? L('Se reconnecter à Google Drive','Reconnect to Google Drive') : L('Se connecter à Google Drive','Connect to Google Drive'), icon:'folder', act:() => ACT.driveChipClick()});
  else{
    items.push({label:L('Envoyer sur le Drive maintenant','Send to Drive now'), icon:'upload', act:() => gdPush(false)});
    if(gdFile(d.id)) items.push({label:L('Récupérer la version du Drive','Get the Drive version'), icon:'undo', act:() => gdPull()});
    if(gdLinked(d.id)) items.push({label:L('Ne plus envoyer cette affiche','Stop sending this poster'), icon:'close', act:() => { gdSetLinked(d.id, false); updateDriveChip(); toast(L('Cette affiche n’est plus envoyée sur ton Drive.','This poster is no longer sent to your Drive.')); }});
    items.push({label:L('Se déconnecter de Google Drive','Disconnect Google Drive'), icon:'close', act:() => gdDisconnect()});
  }
  return items;
}

/* ---------- Branchements : après chaque enregistrement, envoi différé si l'affiche est reliée ---------- */
/* « Modifié depuis le dernier envoi » : seulement quand le contenu change vraiment (revenir à l'accueil
   réenregistre l'affiche sans rien changer : ça ne compte pas). */
const GD_LAST = {};
const __rdSaveDoc = saveDoc;
saveDoc = function(){
  const d = S.doc, r = __rdSaveDoc.apply(this, arguments);
  if(d && gdLinked(d.id)){
    const snap = snapshot();
    if(GD_LAST[d.id] !== undefined && GD_LAST[d.id] !== snap) gdSetDirty(d.id, true);
    GD_LAST[d.id] = snap;
    clearTimeout(GD.timer);
    if(gdConnected() && gdDirty(d.id)) GD.timer = setTimeout(() => { if(S.doc && S.doc.id === d.id) gdPush(true); }, 30000);
  }
  Promise.resolve(r).then(() => updateDriveChip());
  return r;
};
const __rdAttachEditor = attachEditorEvents;
attachEditorEvents = function(){
  __rdAttachEditor.apply(this, arguments);
  if(S.doc) GD_LAST[S.doc.id] = snapshot();
  updateDriveChip();
};
setInterval(() => { try{ updateDriveChip(); }catch(e){} }, 15000);

/* =====================================================================
   v29 — OUTILS DE SÉCURITÉ ET DE CIRCULATION DU SCÉNARIO
   ---------------------------------------------------------------------
   1. Rappel de sauvegarde hors navigateur (bandeau discret, par projet)
   2. Renommer partout : personnage ou décor, avec aperçu ligne par ligne
   3. Chasseur de variantes : quasi-doublons de noms (MARC / MARCO, CAFÉ / CAFE)
   4. Récupérer UNE scène depuis une ancienne version
   5. Sides : PDF d'un acteur (ses scènes, ses répliques surlignées)
   Tout est greffé sur l'existant : mêmes boîtes de dialogue, même annulation
   (Ctrl+Z), même sauvegarde automatique. Avant chaque geste de masse, un
   instantané est ajouté à l'Historique.
===================================================================== */
const WD = { h:{} };
const WD_BK_KEY = 'scriptmm_backup_by_project', WD_SNOOZE_KEY = 'scriptmm_backup_snooze';
const WD_BK_DAYS = 7;

/* ---------- utilitaires ---------- */
function wdRead(k){ try{ return JSON.parse(localStorage.getItem(k)) || {}; }catch(e){ return {}; } }
function wdWrite(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function wdNorm(s){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()
    .replace(/[\u2019\u2018]/g,"'").replace(/[^A-Z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
}
function wdSig(s){ return wdNorm(s).replace(/^(LE|LA|LES|UN|UNE|THE|AN|A)\s+/,'').replace(/^L'\s*/,'').trim(); }
function wdLev(a, b, max){
  if(Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({length:b.length + 1}, (_, i)=>i);
  for(let i = 1; i <= a.length; i++){
    const cur = [i]; let rowMin = i;
    for(let j = 1; j <= b.length; j++){
      const v = Math.min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1));
      cur[j] = v; if(v < rowMin) rowMin = v;
    }
    if(rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
function wdSimilar(a, b){
  if(a === b) return true;
  if(Math.min(a.length, b.length) < 4) return false;
  if(/\d/.test(a + b) && a.replace(/\d+/g,'#') === b.replace(/\d+/g,'#')) return false;   // AGENT 1 / AGENT 2 : deux personnes
  const thr = Math.max(a.length, b.length) >= 9 ? 2 : 1;
  return wdLev(a, b, thr) <= thr;
}
function wdRx(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function wdCapital(nn){
  if(nn !== nn.toUpperCase()) return nn;
  return nn.toLowerCase().replace(/(^|[\s\-'\u2019])(\p{L})/gu, (m, a, b)=> a + b.toUpperCase());
}
function wdCase(match, nn){
  if(match === match.toUpperCase() && match !== match.toLowerCase()) return nn.toUpperCase();
  if(match === match.toLowerCase()) return nn.toLowerCase();
  return wdCapital(nn);
}
function wdMarkHtml(s){ return esc(s).replace(/\u0001/g,'<mark>').replace(/\u0002/g,'</mark>'); }
function wdAfterEdit(){ if(S.tab === 'editor') renderEditorTab(); else renderTabBody(); }
function wdSnapshot(label){
  const p = S.project; if(!Array.isArray(p.versions)) p.versions = [];
  p.versions.push({ id: uid('ver'), label, auto:false, timestamp:Date.now(), elements:snapshot() });
  if(p.versions.length > 25) p.versions.shift();
}
function wdApply(changes, label){
  const on = changes.filter(c=>c.on);
  if(!on.length) return 0;
  pushUndo(); wdSnapshot(label);
  const map = new Map(on.map(c=>[c.id, c.after]));
  S.project.elements.forEach(el=>{ if(map.has(el.id)) el.text = map.get(el.id); });
  scheduleAutosave(); wdAfterEdit();
  return on.length;
}

/* ---------- fenêtres ---------- */
function wdCloseModal(id){ const m = document.getElementById(id); if(m) m.remove(); }
function wdModal(id, inner){
  wdCloseModal(id);
  const bd = document.createElement('div');
  bd.className = 'modal-backdrop'; bd.id = id;
  bd.innerHTML = '<div class="modal wd-modal" role="dialog" aria-modal="true" data-stop="1">' + inner + '</div>';
  bd.addEventListener('mousedown', e=>{ bd._d = (e.target === bd); });
  bd.addEventListener('click', e=>{
    e.stopPropagation();
    if(e.target === bd && bd._d){ wdCloseModal(id); return; }
    const b = e.target.closest('[data-wd]');
    if(b && bd.contains(b) && WD.h[b.dataset.wd]) WD.h[b.dataset.wd](b, e);
  });
  bd.addEventListener('input', e=>{
    const t = e.target.closest('[data-wdin]');
    if(t && WD.h[t.dataset.wdin]) WD.h[t.dataset.wdin](t, e);
  });
  bd.addEventListener('keydown', e=>{ e.stopPropagation(); if(e.key === 'Escape'){ e.preventDefault(); wdCloseModal(id); } });
  bd.addEventListener('keyup', e=> e.stopPropagation());
  document.body.appendChild(bd);
  return bd;
}
WD.h.close = b=>{ const m = b.closest('.modal-backdrop'); if(m) m.remove(); };

/* =====================================================================
   1. RAPPEL DE SAUVEGARDE
===================================================================== */
function wdMarkBackup(pid){ const m = wdRead(WD_BK_KEY); m[pid] = Date.now(); wdWrite(WD_BK_KEY, m); }
function wdBackupState(){
  const p = S.project;
  if(!p || S.view !== 'editor') return null;
  try{ if(vaultActive()) return null; }catch(e){}            // le coffre écrit déjà sur le disque
  const size = (p.elements||[]).reduce((n, e)=> n + (e.text||'').length, 0);
  const last = wdRead(WD_BK_KEY)[p.id] || 0;
  const snooze = wdRead(WD_SNOOZE_KEY)[p.id] || 0;
  if(Date.now() < snooze) return null;
  if(!last){ return size > 1500 ? { never:true } : null; }
  if((p.updatedAt || 0) <= last) return null;                   // rien de neuf depuis
  const days = Math.floor((Date.now() - last) / 864e5);
  return days >= WD_BK_DAYS ? { days } : null;
}
function wdBackupCheck(){
  const old = document.getElementById('wdBackupBar'); if(old) old.remove();
  const st = wdBackupState(); if(!st) return;
  const tb = document.querySelector('.main-col > .topbar'); if(!tb) return;
  const bar = document.createElement('div');
  bar.className = 'wd-bar'; bar.id = 'wdBackupBar'; bar.setAttribute('role','status');
  const msg = st.never
    ? L('Ce scénario n\u2019existe que dans ce navigateur. Un nettoyage du navigateur peut l\u2019effacer : garde une copie en fichier.',
        'This screenplay only exists in this browser. Clearing browser data can erase it: keep a file copy.')
    : L('Dernière sauvegarde en fichier : il y a ' + st.days + ' jours. Ce que tu as écrit depuis n\u2019existe que dans ce navigateur.',
        'Last file backup: ' + st.days + ' days ago. Everything written since only exists in this browser.');
  bar.innerHTML = '<div class="wd-bar-text"><b>' + L('Sauvegarde','Backup') + '</b> · ' + esc(msg) + '</div>' +
    '<div class="wd-bar-actions"><button class="btn btn-sm btn-primary" data-wd="bkNow">' + icon('save') + ' ' + L('Sauvegarder maintenant','Back up now') + '</button>' +
    '<button class="btn btn-sm btn-ghost" data-wd="bkLater">' + L('Plus tard','Later') + '</button></div>';
  bar.addEventListener('click', e=>{
    const b = e.target.closest('[data-wd]'); if(b && WD.h[b.dataset.wd]) WD.h[b.dataset.wd](b, e);
  });
  tb.insertAdjacentElement('afterend', bar);
}
WD.h.bkNow = ()=>{ exportBackup(); };
WD.h.bkLater = ()=>{
  const m = wdRead(WD_SNOOZE_KEY); m[S.project.id] = Date.now() + 864e5; wdWrite(WD_SNOOZE_KEY, m);
  const b = document.getElementById('wdBackupBar'); if(b) b.remove();
};
const __wdDownloadBackup = downloadProjectBackup;
downloadProjectBackup = function(p, silent){
  __wdDownloadBackup(p, silent);
  try{ wdMarkBackup(p.id); }catch(e){}
  setTimeout(wdBackupCheck, 60);
};
const __wdRender = render;
render = function(){
  const r = __wdRender.apply(this, arguments);
  try{ wdBackupCheck(); }catch(e){}
  return r;
};
setInterval(()=>{ try{ if(!document.hidden) wdBackupCheck(); }catch(e){} }, 5 * 60 * 1000);

/* =====================================================================
   DONNÉES : personnages et décors
===================================================================== */
const WD_HEAD = /^(\s*(?:INT\.?\s*\/\s*EXT|EXT\.?\s*\/\s*INT|I\s*\/\s*E|INT|EXT)\s*[.\-\u2013]?\s+)([\s\S]*)$/i;
function wdParseHeading(t){
  t = t || '';
  const m = WD_HEAD.exec(t);
  const pre = m ? m[1] : '', body = m ? m[2] : t;
  const loc = body.split(/\s+[-\u2013\u2014]\s+/)[0];
  return { pre, loc, rest: body.slice(loc.length) };
}
function wdCharSplit(text){
  const full = text || '';
  let core = full.replace(/\s+$/, ''), prev;
  do { prev = core; core = core.replace(/\s*\([^()]*\)\s*$/, ''); } while(core !== prev);
  const lead = core.length - core.replace(/^\s+/, '').length;
  return { pre: core.slice(0, lead), raw: core.trim(), tail: full.slice(core.length) };
}
function wdCharList(){
  const m = new Map();
  S.project.elements.forEach(el=>{
    if(el.type !== 'character') return;
    const k = wdCharSplit(el.text).raw.toUpperCase(); if(!k) return;
    if(!m.has(k)) m.set(k, { key:k, n:0 });
    m.get(k).n++;
  });
  return Array.from(m.values()).sort((a, b)=> b.n - a.n || a.key.localeCompare(b.key));
}
function wdLocList(){
  const m = new Map();
  S.project.elements.forEach(el=>{
    if(el.type !== 'scene') return;
    const k = wdParseHeading(el.text).loc.trim().toUpperCase(); if(!k) return;
    if(!m.has(k)) m.set(k, { key:k, n:0 });
    m.get(k).n++;
  });
  return Array.from(m.values()).sort((a, b)=> b.n - a.n || a.key.localeCompare(b.key));
}
/* Plans de changement : [{id, kind, before, after, bh, ah, on}] */
function wdPlanChar(olds, nn, opt){
  opt = opt || {};
  const set = new Set(olds.map(k=>k.toUpperCase()));
  const alt = olds.slice().sort((a, b)=> b.length - a.length).map(wdRx).join('|');
  const rx = alt ? new RegExp('(?<![\\p{L}\\p{N}_])(' + alt + ')(?![\\p{L}\\p{N}_])', 'giu') : null;
  const out = [];
  S.project.elements.forEach(el=>{
    if(el.type === 'character'){
      const b = wdCharSplit(el.text);
      if(!set.has(b.raw.toUpperCase())) return;
      const after = b.pre + nn.toUpperCase() + b.tail;
      if(after !== el.text) out.push({ id:el.id, kind:'cue', before:el.text, after,
        bh:esc(el.text), ah:wdMarkHtml(b.pre + '\u0001' + nn.toUpperCase() + '\u0002' + b.tail), on:true });
      return;
    }
    const wanted = (el.type === 'action' && opt.action) || ((el.type === 'dialogue' || el.type === 'parenthetical') && opt.dlg);
    if(!wanted || !rx || !el.text) return;
    let hit = false;
    const after = el.text.replace(rx, m=>{ hit = true; return wdCase(m, nn); });
    if(!hit || after === el.text) return;
    const bh = wdMarkHtml(el.text.replace(rx, m=>'\u0001' + m + '\u0002'));
    const ah = wdMarkHtml(el.text.replace(rx, m=>'\u0001' + wdCase(m, nn) + '\u0002'));
    out.push({ id:el.id, kind: el.type === 'action' ? 'action' : 'dial', before:el.text, after, bh, ah, on:true });
  });
  return out;
}
function wdPlanLoc(olds, nn){
  const set = new Set(olds.map(k=>k.toUpperCase()));
  const out = [];
  S.project.elements.forEach(el=>{
    if(el.type !== 'scene') return;
    const h = wdParseHeading(el.text);
    if(!set.has(h.loc.trim().toUpperCase())) return;
    const lead = h.loc.length - h.loc.replace(/^\s+/, '').length, trail = h.loc.length - h.loc.replace(/\s+$/, '').length;
    const mid = nn.toUpperCase();
    const after = h.pre + h.loc.slice(0, lead) + mid + h.loc.slice(h.loc.length - trail) + h.rest;
    if(after !== el.text) out.push({ id:el.id, kind:'scene', before:el.text, after, bh:esc(el.text),
      ah:wdMarkHtml(h.pre + '\u0001' + mid + '\u0002' + h.rest), on:true });
  });
  return out;
}
function wdKindLabel(k){
  return k === 'cue' ? L('Réplique','Cue') : k === 'action' ? L('Action','Action') : k === 'dial' ? L('Dialogue','Dialogue') : L('Scène','Scene');
}

/* =====================================================================
   2. RENOMMER PARTOUT
===================================================================== */
function wdOpenRename(pre){
  closeMoreMenu(); 
  WD.rn = Object.assign({ mode:'char', old:'', nn:'', action:true, dlg:true, changes:[] }, pre || {});
  wdRnDraw();
}
function wdRnList(){ return WD.rn.mode === 'char' ? wdCharList() : wdLocList(); }
function wdRnPlan(){
  const R = WD.rn;
  if(!R.old || !R.nn.trim() || R.nn.trim().toUpperCase() === R.old){ R.changes = []; return; }
  R.changes = R.mode === 'char' ? wdPlanChar([R.old], R.nn.trim(), { action:R.action, dlg:R.dlg }) : wdPlanLoc([R.old], R.nn.trim());
}
function wdRnDraw(){
  const R = WD.rn, list = wdRnList();
  if(!R.old || !list.some(x=>x.key === R.old)) R.old = list.length ? list[0].key : '';
  wdRnPlan();
  const opts = list.map(x=>'<option value="' + esc(x.key) + '"' + (x.key === R.old ? ' selected' : '') + '>' + esc(x.key) + ' — ' +
    x.n + ' ' + (R.mode === 'char' ? L('répliques','cues') : L('scènes','scenes')) + '</option>').join('');
  wdModal('wdRnBd',
    '<h2>' + L('Renommer partout','Rename everywhere') + '</h2>' +
    '<p class="wd-sub">' + L('Change un nom dans tout le scénario d\u2019un coup. Tu vois chaque ligne touchée avant de valider, et tu peux en décocher.',
      'Change a name across the whole screenplay in one go. You see every affected line before confirming, and can untick any.') + '</p>' +
    '<div class="wd-seg"><button data-wd="rnMode" data-m="char" class="' + (R.mode === 'char' ? 'on' : '') + '">' + L('Personnage','Character') + '</button>' +
    '<button data-wd="rnMode" data-m="loc" class="' + (R.mode === 'loc' ? 'on' : '') + '">' + L('Décor','Location') + '</button></div>' +
    '<div class="wd-row2"><div class="field"><label>' + L('Nom actuel','Current name') + '</label><select data-wdin="rnOld">' + opts + '</select></div>' +
    '<div class="field"><label>' + L('Nouveau nom','New name') + '</label><input type="text" id="wdRnNew" data-wdin="rnNew" value="' + esc(R.nn) + '" autocomplete="off" spellcheck="false"></div></div>' +
    (R.mode === 'char' ? '<div class="wd-opts"><label><input type="checkbox" data-wdin="rnAct"' + (R.action ? ' checked' : '') + '> ' + L('Mentions dans l\u2019action','Mentions in action') + '</label>' +
      '<label><input type="checkbox" data-wdin="rnDlg"' + (R.dlg ? ' checked' : '') + '> ' + L('Mentions dans les dialogues','Mentions in dialogue') + '</label></div>' : '') +
    '<div class="wd-body" id="wdRnPrev"></div>' +
    '<div class="modal-actions"><button class="btn" data-wd="close">' + L('Annuler','Cancel') + '</button>' +
    '<button class="btn btn-primary" id="wdRnGo" data-wd="rnGo"></button></div>');
  wdRnPaint();
  const inp = document.getElementById('wdRnNew'); if(inp) inp.focus();
}
function wdRnPaint(){
  const R = WD.rn, box = document.getElementById('wdRnPrev'), go = document.getElementById('wdRnGo'); if(!box) return;
  const ch = R.changes, n = ch.filter(c=>c.on).length;
  const cnt = k=> ch.filter(c=>c.on && c.kind === k).length;
  let html = '';
  if(!R.nn.trim()) html = '<div class="wd-empty">' + L('Tape le nouveau nom pour voir les lignes concernées.','Type the new name to see the affected lines.') + '</div>';
  else if(R.nn.trim().toUpperCase() === R.old) html = '<div class="wd-empty">' + L('Le nouveau nom est identique.','The new name is the same.') + '</div>';
  else {
    const exists = wdRnList().some(x=>x.key === R.nn.trim().toUpperCase());
    if(exists) html += '<p class="wd-warn">' + L('« ' + esc(R.nn.trim().toUpperCase()) + ' » existe déjà : les deux seront fusionnés.', '“' + esc(R.nn.trim().toUpperCase()) + '” already exists: the two will be merged.') + '</p>';
    if(R.mode === 'char' && R.old.length <= 3) html += '<p class="wd-warn">' + L('Nom très court : vérifie bien les mentions avant de valider.','Very short name: check the mentions carefully.') + '</p>';
    html += '<p class="wd-sum">' + (R.mode === 'char'
      ? cnt('cue') + ' ' + L('répliques','cues') + ' · ' + cnt('action') + ' ' + L('mentions dans l\u2019action','in action') + ' · ' + cnt('dial') + ' ' + L('dans les dialogues','in dialogue')
      : cnt('scene') + ' ' + L('entêtes de scène','scene headings')) + '</p>';
    html += '<div class="wd-list">' + ch.slice(0, 80).map((c, i)=>
      '<label class="wd-chg"><input type="checkbox" data-wdin="rnChk" data-i="' + i + '"' + (c.on ? ' checked' : '') + '>' +
      '<span class="wd-k">' + wdKindLabel(c.kind) + '</span><span class="wd-t"><span class="wd-b">' + c.bh + '</span><br>' + c.ah + '</span></label>').join('') + '</div>';
    if(ch.length > 80) html += '<div class="wd-more">' + L('+ ' + (ch.length - 80) + ' autres lignes, toutes cochées.', '+ ' + (ch.length - 80) + ' more lines, all ticked.') + '</div>';
    if(!ch.length) html = html + '<div class="wd-empty">' + L('Aucune ligne concernée.','No line affected.') + '</div>';
  }
  box.innerHTML = html;
  go.disabled = n === 0;
  go.textContent = n ? L('Renommer (' + n + ' lignes)', 'Rename (' + n + ' lines)') : L('Renommer','Rename');
}
WD.h.rnMode = b=>{ WD.rn.mode = b.dataset.m; WD.rn.old = ''; WD.rn.nn = ''; wdRnDraw(); };
WD.h.rnOld = t=>{ WD.rn.old = t.value; wdRnPlan(); wdRnPaint(); };
WD.h.rnNew = t=>{ WD.rn.nn = t.value; wdRnPlan(); wdRnPaint(); };
WD.h.rnAct = t=>{ WD.rn.action = t.checked; wdRnPlan(); wdRnPaint(); };
WD.h.rnDlg = t=>{ WD.rn.dlg = t.checked; wdRnPlan(); wdRnPaint(); };
WD.h.rnChk = t=>{ const c = WD.rn.changes[+t.dataset.i]; if(c){ c.on = t.checked; wdRnPaint(); } };
WD.h.rnGo = ()=>{
  const R = WD.rn, name = R.nn.trim();
  const n = wdApply(R.changes, L('Avant renommage : ','Before renaming: ') + R.old + ' \u2192 ' + name.toUpperCase());
  wdCloseModal('wdRnBd');
  toast(L(n + ' lignes modifiées. Annulable avec Ctrl+Z.', n + ' lines changed. Undo with Ctrl+Z.'));
};

/* =====================================================================
   3. CHASSEUR DE VARIANTES
===================================================================== */
function wdFindVariants(){
  const ign = new Set(S.project.wdIgnore || []), out = [];
  [['char', wdCharList()], ['loc', wdLocList()]].forEach(([type, list])=>{
    const it = list.map(x=>({ key:x.key, n:x.n, sig:wdSig(x.key) })).filter(x=>x.sig);
    const par = it.map((_, i)=>i);
    const find = i=> par[i] === i ? i : (par[i] = find(par[i]));
    for(let i = 0; i < it.length; i++) for(let j = i + 1; j < it.length; j++)
      if(wdSimilar(it[i].sig, it[j].sig)) par[find(j)] = find(i);
    const groups = new Map();
    it.forEach((x, i)=>{ const r = find(i); if(!groups.has(r)) groups.set(r, []); groups.get(r).push(x); });
    groups.forEach(g=>{
      if(g.length < 2) return;
      const sig = type + ':' + g.map(x=>x.key).sort().join('|');
      if(ign.has(sig)) return;
      g.sort((a, b)=> b.n - a.n);
      out.push({ type, sig, members:g, pick:g[0].key });
    });
  });
  return out;
}
function wdOpenVariants(){
  closeMoreMenu();
  WD.vr = { groups: wdFindVariants() };
  wdVrDraw();
}
function wdVrDraw(){
  const gs = WD.vr.groups;
  const body = gs.length ? gs.map((g, i)=>
    '<div class="wd-card"><div class="wd-card-h"><span class="wd-badge">' + (g.type === 'char' ? L('Personnage','Character') : L('Décor','Location')) + '</span>' +
    '<span style="display:flex;gap:6px;"><button class="btn btn-sm btn-primary" data-wd="vrMerge" data-i="' + i + '">' + L('Fusionner','Merge') + '</button>' +
    '<button class="btn btn-sm btn-ghost" data-wd="vrIgnore" data-i="' + i + '">' + L('Ce sont des différents','They\u2019re different') + '</button></span></div>' +
    g.members.map(m=>'<label class="wd-pick"><input type="radio" name="wdvr' + i + '" data-wdin="vrPick" data-i="' + i + '" value="' + esc(m.key) + '"' + (m.key === g.pick ? ' checked' : '') + '>' +
      '<span class="wd-name">' + esc(m.key) + '</span><span class="wd-n">' + m.n + ' ' + (g.type === 'char' ? L('répliques','cues') : L('scènes','scenes')) + '</span></label>').join('') + '</div>').join('')
    : '<div class="wd-empty">' + L('Aucune variante suspecte. Tes noms de personnages et de décors sont cohérents.','No suspicious variants. Your character and location names are consistent.') + '</div>';
  wdModal('wdVrBd',
    '<h2>' + L('Variantes de noms','Name variants') + '</h2>' +
    '<p class="wd-sub">' + L('Noms très proches (MARC / MARCO, CAFÉ / CAFE) : souvent une faute de frappe qui fausse les rapports et la liste des personnages. Coche le bon nom, puis fusionne.',
      'Very similar names (MARC / MARCO, CAFÉ / CAFE): often a typo that skews reports and the character list. Tick the right name, then merge.') + '</p>' +
    '<div class="wd-body">' + body + '</div>' +
    '<div class="modal-actions"><button class="btn" data-wd="close">' + L('Fermer','Close') + '</button></div>');
}
WD.h.vrPick = t=>{ WD.vr.groups[+t.dataset.i].pick = t.value; };
WD.h.vrIgnore = b=>{
  const g = WD.vr.groups[+b.dataset.i];
  S.project.wdIgnore = (S.project.wdIgnore || []).concat(g.sig); scheduleAutosave();
  WD.vr.groups.splice(+b.dataset.i, 1); wdVrDraw();
};
WD.h.vrMerge = b=>{
  const g = WD.vr.groups[+b.dataset.i];
  const olds = g.members.map(m=>m.key).filter(k=>k !== g.pick);
  const plan = g.type === 'char' ? wdPlanChar(olds, g.pick, { action:false, dlg:false }) : wdPlanLoc(olds, g.pick);
  const n = wdApply(plan, L('Avant fusion : ','Before merge: ') + olds.join(', ') + ' \u2192 ' + g.pick);
  toast(L(n + ' lignes unifiées en « ' + g.pick + ' ». Annulable avec Ctrl+Z.', n + ' lines unified as “' + g.pick + '”. Undo with Ctrl+Z.'));
  WD.vr.groups = wdFindVariants(); wdVrDraw();
};

/* =====================================================================
   4. RÉCUPÉRER UNE SCÈNE DEPUIS UNE ANCIENNE VERSION
===================================================================== */
function wdScenesOf(els){
  const out = []; let cur = null;
  els.forEach(el=>{
    if(el.type === 'scene'){ cur = { id:el.id, heading:el.text, els:[el] }; out.push(cur); }
    else if(cur) cur.els.push(el);
  });
  return out;
}
function wdSig2(sc){ return sc.els.map(e=>e.type + ':' + (e.text || '')).join('\n'); }
function wdOpenSceneRestore(verId){
  const ver = (S.project.versions || []).find(v=>v.id === verId); if(!ver) return;
  WD.sr = { verId, onlyDiff:true, open:null };
  wdSrDraw();
}
function wdSrData(){
  const ver = S.project.versions.find(v=>v.id === WD.sr.verId);
  const cur = new Map(wdScenesOf(S.project.elements).map(s=>[s.id, s]));
  return { ver, rows: wdScenesOf(ver.elements).map((s, i)=>{
    const c = cur.get(s.id);
    const st = !c ? 'gone' : (wdSig2(c) === wdSig2(s) ? 'same' : 'mod');
    return { s, i, c, st };
  }) };
}
function wdSrDraw(){
  const { ver, rows } = wdSrData();
  const shown = rows.filter(r=> !WD.sr.onlyDiff || r.st !== 'same');
  const chip = st=> st === 'gone' ? '<span class="wd-chip gone">' + L('Supprimée','Deleted') + '</span>' : st === 'mod' ? '<span class="wd-chip mod">' + L('Modifiée','Edited') + '</span>' : '<span class="wd-chip same">' + L('Identique','Same') + '</span>';
  const body = shown.length ? shown.map(r=>{
    const open = WD.sr.open === r.s.id;
    let prev = '';
    if(open){
      const curLines = r.c ? new Set(r.c.els.map(e=>e.type + ':' + e.text)) : new Set();
      prev = '<div class="wd-prev">' + r.s.els.map(e=>{
        const isNew = !curLines.has(e.type + ':' + e.text);
        return '<span class="' + (isNew && r.st === 'mod' ? 'wd-ln-new' : '') + '">' + esc(e.text || ' ') + '</span>';
      }).join('\n') + '</div>';
    }
    const back = r.c ? r.s.els.filter(e=> !new Set(r.c.els.map(x=>x.type + ':' + x.text)).has(e.type + ':' + e.text)).length : r.s.els.length;
    const lost = r.c ? r.c.els.filter(e=> !new Set(r.s.els.map(x=>x.type + ':' + x.text)).has(e.type + ':' + e.text)).length : 0;
    return '<div class="wd-card"><div class="wd-card-h"><div style="min-width:0;"><div class="flat-row-title" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
      (r.i + 1) + '. ' + esc(r.s.heading || L('(sans titre)','(untitled)')) + '</div>' +
      '<div style="font-size:12px;color:var(--ink-soft);margin-top:3px;">' + chip(r.st) + ' ' + (r.st === 'mod' ? L('+' + back + ' lignes retrouvées · −' + lost + ' lignes actuelles', '+' + back + ' lines back · −' + lost + ' current lines') : r.st === 'gone' ? r.s.els.length + ' ' + L('lignes','lines') : '') + '</div></div>' +
      '<span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">' +
      '<button class="btn btn-sm btn-ghost" data-wd="srPrev" data-id="' + esc(r.s.id) + '">' + (open ? L('Masquer','Hide') : L('Aperçu','Preview')) + '</button>' +
      (r.st === 'mod' ? '<button class="btn btn-sm" data-wd="srCopy" data-id="' + esc(r.s.id) + '">' + L('Insérer en copie','Insert as copy') + '</button>' +
        '<button class="btn btn-sm btn-primary" data-wd="srReplace" data-id="' + esc(r.s.id) + '">' + L('Remplacer','Replace') + '</button>' : '') +
      (r.st === 'gone' ? '<button class="btn btn-sm btn-primary" data-wd="srBack" data-id="' + esc(r.s.id) + '">' + L('Récupérer','Recover') + '</button>' : '') +
      '</span></div>' + prev + '</div>';
  }).join('') : '<div class="wd-empty">' + L('Toutes les scènes de cette version sont identiques à ton scénario actuel.','Every scene in this version is identical to your current screenplay.') + '</div>';
  wdModal('wdSrBd',
    '<h2>' + L('Récupérer une scène','Recover a scene') + '</h2>' +
    '<p class="wd-sub">' + L('Version « ' + esc(versionLabel(ver)) + ' ». Reprends une seule scène sans toucher au reste du scénario.', 'Version “' + esc(versionLabel(ver)) + '”. Take back a single scene without touching the rest.') + '</p>' +
    '<div class="wd-opts"><label><input type="checkbox" data-wdin="srOnly"' + (WD.sr.onlyDiff ? ' checked' : '') + '> ' + L('Masquer les scènes identiques','Hide identical scenes') + '</label></div>' +
    '<div class="wd-body">' + body + '</div>' +
    '<div class="modal-actions"><button class="btn" data-wd="close">' + L('Fermer','Close') + '</button></div>');
}
WD.h.srOnly = t=>{ WD.sr.onlyDiff = t.checked; wdSrDraw(); };
WD.h.srPrev = b=>{ WD.sr.open = WD.sr.open === b.dataset.id ? null : b.dataset.id; const bd = document.querySelector('#wdSrBd .wd-body'); const y = bd ? bd.scrollTop : 0; wdSrDraw(); const nb = document.querySelector('#wdSrBd .wd-body'); if(nb) nb.scrollTop = y; };
/* Clone d'une scène ancienne ; les id déjà pris ailleurs dans le scénario sont renouvelés. */
function wdCloneScene(sc, takenIds, forceNew){
  return sc.els.map(e=>{
    const c = JSON.parse(JSON.stringify(e));
    if(forceNew || takenIds.has(c.id)) c.id = uid('el');
    return c;
  });
}
function wdSrDo(sceneId, mode){
  const { ver } = wdSrData();
  const old = wdScenesOf(ver.elements).find(s=>s.id === sceneId); if(!old) return;
  const els = S.project.elements;
  const start = els.findIndex(e=>e.id === sceneId);
  let end = -1;
  if(start >= 0){ end = els.findIndex((e, i)=> i > start && e.type === 'scene'); if(end < 0) end = els.length; }
  const label = L('Avant récupération de la scène : ','Before recovering scene: ') + (old.heading || '');
  pushUndo(); wdSnapshot(label);
  let at, insert;
  if(mode === 'replace' && start >= 0){
    const taken = new Set(els.filter((_, i)=> i < start || i >= end).map(e=>e.id));
    insert = wdCloneScene(old, taken, false);
    els.splice(start, end - start, ...insert);
  } else {
    const taken = new Set(els.map(e=>e.id));
    insert = wdCloneScene(old, taken, mode === 'copy');
    if(mode === 'copy' && start >= 0) at = end;
    else {
      const prevSc = wdScenesOf(ver.elements); const k = prevSc.findIndex(s=>s.id === sceneId);
      let prevId = null; for(let q = k - 1; q >= 0; q--){ if(els.some(e=>e.id === prevSc[q].id)){ prevId = prevSc[q].id; break; } }
      if(prevId){
        const ps = els.findIndex(e=>e.id === prevId);
        at = els.findIndex((e, i)=> i > ps && e.type === 'scene'); if(at < 0) at = els.length;
      } else {
        const fs = els.findIndex(e=>e.type === 'scene'); at = fs < 0 ? els.length : fs;
      }
    }
    els.splice(at, 0, ...insert);
  }
  scheduleAutosave();
  toast(mode === 'replace' ? L('Scène remplacée. Annulable avec Ctrl+Z.','Scene replaced. Undo with Ctrl+Z.') : mode === 'copy' ? L('Copie insérée après la scène actuelle.','Copy inserted after the current scene.') : L('Scène récupérée à sa place.','Scene recovered in place.'));
  if(S.tab === 'history') renderTabBody();
  wdSrDraw();
}
WD.h.srReplace = b=>{ wdSrDo(b.dataset.id, 'replace'); };
WD.h.srCopy = b=>{ wdSrDo(b.dataset.id, 'copy'); };
WD.h.srBack = b=>{ wdSrDo(b.dataset.id, 'back'); };

/* =====================================================================
   5. SIDES POUR ACTEURS
===================================================================== */
function wdWithProject(p, fn){
  const real = S.project; S.project = p;
  try{ return fn(); } finally { S.project = real; }
}
function wdSidesBuild(o){
  const real = S.project, nums = sceneNumbers();
  const key = o.key.toUpperCase();
  const mention = new RegExp('(?<![\\p{L}\\p{N}_])' + wdRx(key) + '(?![\\p{L}\\p{N}_])', 'iu');
  const scenes = wdScenesOf(real.elements.filter(e=>e.type !== 'note'));
  const hl = new Set(), kept = [];
  scenes.forEach(sc=>{
    let speaks = false, mentioned = false, on = false;
    sc.els.forEach(e=>{
      if(e.type === 'character'){ on = wdCharSplit(e.text).raw.toUpperCase() === key; if(on){ speaks = true; hl.add(e.id); } }
      else if(e.type === 'dialogue' || e.type === 'parenthetical'){ if(on) hl.add(e.id); }
      else { on = false; if(mention.test(e.text || '')) mentioned = true; }
    });
    if(speaks || (o.scope === 'appears' && mentioned)) kept.push(sc);
  });
  const meta = {};
  kept.forEach(sc=>{ meta[sc.id] = Object.assign({}, (real.sceneMeta || {})[sc.id], { lockedNum: nums[sc.id] }); });
  const clone = Object.assign({}, real, {
    elements: [].concat(...kept.map(sc=>sc.els)), sceneMeta: meta, pageLock: null, versions: [], graveyard: [], comments: {}, pageImages: undefined,   // images : leurs numéros de page sont ceux du scénario complet
    settings: Object.assign({}, real.settings, { numbersLocked:true, watermarkText:o.wm || '', titlePageEnabled:!!o.title })
  });
  return { clone, hl, count: kept.length };
}
function wdOpenSides(){
  closeExportMenu(); closeMoreMenu();
  const list = wdCharList();
  if(!list.length){ toast(L('Aucun personnage qui parle dans ce scénario.','No speaking character in this screenplay.')); return; }
  WD.sd = { key:list[0].key, scope:'speaks', hl:true, title:false, wm:null };
  WD.sd.list = list;
  wdSdDraw();
}
function wdSdWm(){ return WD.sd.wm != null ? WD.sd.wm : 'SIDES \u2014 ' + WD.sd.key; }
function wdSdDraw(){
  const D = WD.sd;
  wdModal('wdSdBd',
    '<h2>' + L('Sides pour un acteur','Actor sides') + '</h2>' +
    '<p class="wd-sub">' + L('Un PDF avec seulement les scènes d\u2019un personnage, ses répliques surlignées. Les numéros de scène d\u2019origine sont conservés.',
      'A PDF with only one character\u2019s scenes, their lines highlighted. Original scene numbers are kept.') + '</p>' +
    '<div class="field"><label>' + L('Personnage','Character') + '</label><select data-wdin="sdKey">' +
    D.list.map(x=>'<option value="' + esc(x.key) + '"' + (x.key === D.key ? ' selected' : '') + '>' + esc(x.key) + ' — ' + x.n + ' ' + L('répliques','cues') + '</option>').join('') + '</select></div>' +
    '<div class="wd-opts"><label><input type="radio" name="wdsc" data-wdin="sdScope" value="speaks"' + (D.scope === 'speaks' ? ' checked' : '') + '> ' + L('Scènes où il parle','Scenes where he/she speaks') + '</label>' +
    '<label><input type="radio" name="wdsc" data-wdin="sdScope" value="appears"' + (D.scope === 'appears' ? ' checked' : '') + '> ' + L('Scènes où il parle ou est cité','Scenes where he/she speaks or is named') + '</label></div>' +
    '<div class="wd-opts"><label><input type="checkbox" data-wdin="sdHl"' + (D.hl ? ' checked' : '') + '> ' + L('Surligner ses répliques','Highlight his/her lines') + '</label>' +
    '<label><input type="checkbox" data-wdin="sdTitle"' + (D.title ? ' checked' : '') + '> ' + L('Inclure la page de titre','Include title page') + '</label></div>' +
    '<div class="field"><label>' + L('Filigrane (laisser vide pour aucun)','Watermark (leave empty for none)') + '</label><input type="text" data-wdin="sdWm" value="' + esc(wdSdWm()) + '" autocomplete="off"></div>' +
    '<p class="wd-sum" id="wdSdSum"></p>' +
    '<div class="modal-actions"><button class="btn" data-wd="close">' + L('Annuler','Cancel') + '</button>' +
    '<button class="btn btn-primary" id="wdSdGo" data-wd="sdGo">' + icon('export') + ' ' + L('Imprimer / enregistrer en PDF','Print / save as PDF') + '</button></div>');
  wdSdSum();
}
function wdSdOpts(){ const D = WD.sd; return { key:D.key, scope:D.scope, hl:D.hl, title:D.title, wm:wdSdWm() }; }
function wdSdSum(){
  const el = document.getElementById('wdSdSum'), go = document.getElementById('wdSdGo'); if(!el) return;
  const b = wdSidesBuild(wdSdOpts());
  let pages = 0;
  if(b.count) pages = wdWithProject(b.clone, ()=> measureExportPages(b.clone).pageCount);
  el.textContent = b.count ? b.count + ' ' + L('scènes','scenes') + ' · ' + L('environ ','about ') + pages + ' ' + L('pages','pages') : L('Aucune scène pour ce choix.','No scene for this choice.');
  if(go) go.disabled = !b.count;
}
WD.h.sdKey = t=>{ WD.sd.key = t.value; const w = document.querySelector('#wdSdBd [data-wdin="sdWm"]'); if(WD.sd.wm == null && w) w.value = wdSdWm(); wdSdSum(); };
WD.h.sdScope = t=>{ WD.sd.scope = t.value; wdSdSum(); };
WD.h.sdHl = t=>{ WD.sd.hl = t.checked; };
WD.h.sdTitle = t=>{ WD.sd.title = t.checked; wdSdSum(); };
WD.h.sdWm = t=>{ WD.sd.wm = t.value; };
WD.h.sdGo = ()=>{
  const o = wdSdOpts(), b = wdSidesBuild(o);
  if(!b.count) return;
  wdCloseModal('wdSdBd');
  const real = S.project;
  S.project = b.clone;
  try{
    printScript();
    if(o.hl){
      const area = document.getElementById('printArea');
      if(area) area.querySelectorAll('.line[data-id]').forEach(d=>{ if(b.hl.has(d.dataset.id)) d.classList.add('side-hl'); });
    }
  } finally { S.project = real; }
};

/* ---------- branchement sur le dispatcher existant ---------- */
Object.assign(ACTIONS, {
  wdOpenRename, wdOpenVariants, wdOpenSides,
  wdRestoreScenes: (id)=> wdOpenSceneRestore(id)
});


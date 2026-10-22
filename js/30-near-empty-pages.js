/* =====================================================================
   v30 — PAGES PRESQUE VIDES  +  RÉSUMÉ DE LA DERNIÈRE SESSION
===================================================================== */
const WD_SESS_GAP = 30 * 60 * 1000;      // au-delà de 30 min d'absence, c'est une nouvelle session
const WD_SESS_KEY = pid => 'scriptmm_session_' + pid;

function wdGoto(id){
  if(!id) return;
  ['wdOrBd','wdSsBd'].forEach(wdCloseModal);
  const bar = document.getElementById('wdSessBar'); if(bar) bar.remove();
  if(S.tab !== 'editor'){ S.tab = 'editor'; renderTabBody(); try{ syncRailActive('editor'); }catch(e){} }
  setTimeout(()=>{
    const d = document.querySelector('#page [data-id="' + id + '"]');
    if(d){ navGoScene(id); d.scrollIntoView({ block:'center', behavior:'smooth' }); }
    else toast(L('Cette ligne n\u2019existe plus.','That line no longer exists.'));
  }, 80);
}

/* =====================================================================
   A. PAGES PRESQUE VIDES
   ---------------------------------------------------------------------
   On refait la pagination d'export (celle du PDF) et on mesure combien de
   lignes occupe chaque feuille. Une feuille qui n'en porte que quelques-unes
   est un « débord » : quelques lignes de trop qui ont forcé une page de plus.
===================================================================== */
function wdMeasure(p){
  const wrap = document.createElement('div'); wrap.className = FORMATS[p.format].cls;
  const mc = document.createElement('div'); mc.id = 'pageMeasure';
  const numbers = sceneNumbers(), els = visibleElements(), marks = contdMap(els);
  appendFlow(mc, els, el=>{
    const div = document.createElement('div');
    div.className = 'line line--' + el.type;
    div.dataset.type = el.type; div.dataset.id = el.id;
    div.textContent = contdText(el, marks);
    if(el.type === 'scene' && p.settings.showSceneNumbers && numbers[el.id]) div.dataset.sceneNum = numbers[el.id] + '.';
    applyCardStyle(div, el);
    return div;
  });
  wrap.appendChild(mc); document.body.appendChild(wrap);
  try{
    const res = computePagination(mc, p.format, false, p);
    const first = mc.querySelector('.line');
    const lh = parseFloat(getComputedStyle(first || mc).lineHeight) || res.debug.oneLine || 20;
    const PLB = computePageLabels(res.pages, p), labels = PLB.labels;
    const lock = pageLockSet(p);
    let heading = '';
    const pages = res.pages.map((divs, k)=>{
      let used = 0;
      const items = divs.map((d, i)=>{
        const tmp = !d.isConnected; if(tmp) mc.appendChild(d);
        const h = d.offsetHeight, mt = parseFloat(getComputedStyle(d).marginTop) || 0;
        if(tmp) mc.removeChild(d);
        used += h + (i > 0 ? mt : 0);
        const type = d.dataset.type || (d.classList.contains('pg-mark') ? 'mark' : '');
        if(type === 'scene') heading = d.textContent;
        return { id: d.dataset.id || '', type, rows: Math.max(1, Math.round(h / lh)), text: (d.textContent || '').trim(), heading, full: d.dataset.full === '1' };
      });
      const locked = !!(lock && divs[0] && lock.has(plKey(divs[0])));
      return { k, label: labels[k], rows: Math.round(used / lh), items, locked, free: PLB.free[k] };
    });
    return { pages, cap: res.debug.linesPerPage, total: res.pages.length, spill: res.spill || {} };
  } finally { wrap.remove(); }
}
function wdOrphans(m, T){
  const out = [];
  m.pages.forEach((pg, k)=>{
    if(k === 0 || !pg.items.length || pg.locked || pg.free || m.spill[k] || pg.items.some(i=>i.full)) return;   // une page sans numéro est voulue telle quelle
    if(pg.rows > T) return;
    const isLast = k === m.pages.length - 1;
    const prev = m.pages.slice(Math.max(0, k - 2), k).reverse();
    const cands = [].concat(...prev.filter(q=> !q.free).map(q=> q.items.filter(i=> i.id && (i.type === 'action' || i.type === 'dialogue' || i.type === 'text') && i.rows >= 3).map(i=>Object.assign({ page:q.label }, i))))
      .sort((a, b)=> b.rows - a.rows).slice(0, 3);
    out.push({ k, label: pg.label, rows: pg.rows, isLast, first: pg.items.find(i=>i.id), text: pg.items.map(i=>i.text).filter(Boolean).join(' / '),
      next: !isLast ? m.pages[k + 1].items.find(i=>i.id) : null, cands });
  });
  return out;
}
function wdOpenOrphans(){
  closeMoreMenu();
  WD.or = WD.or || { T: 4 };
  wdOrDraw();
}
function wdOrDraw(){
  const T = WD.or.T;
  const m = wdMeasure(S.project), list = wdOrphans(m, T);
  const gain = list.filter(o=>o.isLast).reduce((n, o)=> n + o.rows, 0);
  const rowsTxt = n=> n + ' ' + (n > 1 ? L('lignes','lines') : L('ligne','line'));
  const body = list.length ? list.map(o=>{
    const head = '<div class="wd-card-h"><div style="min-width:0;"><div class="flat-row-title" style="font-size:13px;">' + L('Page ','Page ') + esc(o.label) + ' <span class="wd-chip mod">' + rowsTxt(o.rows) + '</span></div>' +
      '<div style="font-size:12px;color:var(--ink-soft);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:430px;">' + esc(o.text) + '</div></div>' +
      '<button class="btn btn-sm btn-ghost" data-wd="orGo" data-id="' + esc(o.first ? o.first.id : '') + '">' + L('Voir','View') + '</button></div>';
    const advice = o.isLast
      ? '<p class="wd-sub" style="margin:0 0 6px;">' + L('Couper environ <b>' + rowsTxt(o.rows) + '</b> avant cette page la fait disparaître : <b>−1 page</b>.', 'Cutting about <b>' + rowsTxt(o.rows) + '</b> before this page removes it: <b>−1 page</b>.') + '</p>'
      : '<p class="wd-sub" style="margin:0 0 6px;">' + L('Le bloc suivant' + (o.next ? ' (' + o.next.rows + ' lignes)' : '') + ' ne tient pas dans le bas de cette page. Couper des lignes ici ne suffit que si ce bloc finit par y rentrer.', 'The next block' + (o.next ? ' (' + o.next.rows + ' lines)' : '') + ' doesn\u2019t fit at the bottom of this page. Cutting lines here only helps if that block ends up fitting.') + '</p>';
    const cands = o.cands.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;"><span style="font-size:12px;color:var(--ink-soft);">' + L('Pistes :','Where to trim:') + '</span>' +
      o.cands.map(c=>'<button class="btn btn-sm" data-wd="orGo" data-id="' + esc(c.id) + '" title="' + esc(c.heading) + '">' + (c.type === 'dialogue' ? L('Réplique','Line') : c.type === 'action' ? L('Action','Action') : L('Texte','Text')) + ' · ' + rowsTxt(c.rows) + ' · p.' + esc(c.page) + '</button>').join('') + '</div>' : '';
    return '<div class="wd-card">' + head + advice + cands + '</div>';
  }).join('') : '<div class="wd-empty">' + L('Aucune page presque vide à ce seuil. Ta pagination est propre.','No nearly-empty page at this threshold. Your pagination is clean.') + '</div>';
  wdModal('wdOrBd',
    '<h2>' + L('Pages presque vides','Nearly-empty pages') + '</h2>' +
    '<p class="wd-sub">' + L('Pages qui ne portent que quelques lignes, restes d\u2019une scène ou d\u2019une réplique qui débordent. C\u2019est ce qu\u2019on traque avant un envoi pour avoir un nombre de pages exact. Calculé sur la pagination d\u2019export.',
      'Pages carrying only a few lines — leftovers of a scene or line spilling over. This is what you chase before sending, to get an exact page count. Based on the export pagination.') + '</p>' +
    '<div class="wd-row2"><div class="field"><label>' + L('Pages de moins de','Pages of fewer than') + '</label><select data-wdin="orT">' +
    [2, 4, 6, 8].map(n=>'<option value="' + n + '"' + (n === T ? ' selected' : '') + '>' + n + ' ' + L('lignes ou moins','lines or fewer') + '</option>').join('') + '</select></div>' +
    '<div class="field"><label>' + L('Bilan','Summary') + '</label><div style="padding:8px 0;font-size:13.5px;"><b>' + m.total + '</b> ' + L('pages','pages') + ' · ' + list.length + ' ' + L('presque vide(s)','nearly empty') +
    (gain ? ' · ' + L('gain possible : ','possible gain: ') + '<b>−1 page</b>' : '') + '</div></div></div>' +
    '<div class="wd-body">' + body + '</div>' +
    '<div class="modal-actions"><button class="btn btn-ghost" data-wd="orRefresh">' + L('Actualiser','Refresh') + '</button><button class="btn" data-wd="close">' + L('Fermer','Close') + '</button></div>');
}
WD.h.orT = t=>{ WD.or.T = +t.value; wdOrDraw(); };
WD.h.orRefresh = ()=>{ wdOrDraw(); };
WD.h.orGo = b=>{ wdGoto(b.dataset.id); };

/* =====================================================================
   B. RÉSUMÉ DE LA DERNIÈRE SESSION
   ---------------------------------------------------------------------
   Une session = une période d'écriture ; au-delà de 30 min d'absence, la
   suivante commence. Au début de chaque session, on garde une photo
   compacte du scénario (hors du fichier projet : elle n'alourdit ni les
   sauvegardes ni les exports). À la reprise, on compare cette photo à
   l'état actuel : c'est ce qui a changé pendant la session précédente.
===================================================================== */
function wdSessSnap(){
  const p = S.project, scenes = []; let cur = null;
  p.elements.forEach(el=>{
    if(el.type === 'scene'){ cur = { id: el.id, h: el.text || '', ls: [ 'scene\u0001' + (el.text || '') ] }; scenes.push(cur); }
    else if(cur && el.type !== 'note') cur.ls.push(el.type + '\u0001' + (el.text || ''));
  });
  let pages = 0; try{ pages = measuredPageCount(); }catch(e){}
  return { pages, words: p.elements.reduce((n, e)=> n + (e.type === 'note' ? 0 : wordCount(e.text)), 0), scenes };
}
function wdLis(a){           // plus longue sous-suite croissante : renvoie l'ensemble des indices conservés
  const n = a.length, len = new Array(n).fill(1), prv = new Array(n).fill(-1);
  let best = -1;
  for(let i = 0; i < n; i++){
    for(let j = 0; j < i; j++) if(a[j] < a[i] && len[j] + 1 > len[i]){ len[i] = len[j] + 1; prv[i] = j; }
    if(best < 0 || len[i] > len[best]) best = i;
  }
  const keep = new Set(); for(let i = best; i >= 0; i = prv[i]) keep.add(i);
  return keep;
}
function wdSessDiff(base, cur){
  const bm = new Map(base.scenes.map((s, i)=>[s.id, { s, i }])), cm = new Map(cur.scenes.map(s=>[s.id, s]));
  const nums = (()=>{ try{ return sceneNumbers(); }catch(e){ return {}; } })();
  const rows = [];
  const lineDiff = (from, to)=>{
    const cnt = new Map(); from.forEach(l=> cnt.set(l, (cnt.get(l) || 0) + 1));
    const add = [];
    to.forEach(l=>{ const c = cnt.get(l) || 0; if(c > 0) cnt.set(l, c - 1); else add.push(l); });
    const del = []; cnt.forEach((c, l)=>{ for(let q = 0; q < c; q++) del.push(l); });
    return { add, del };
  };
  const show = l=> l.split('\u0001')[1] || '';
  // ordre relatif des scènes communes : celles qui sortent de la plus longue suite stable ont été déplacées
  const common = cur.scenes.filter(s=>bm.has(s.id));
  const keep = wdLis(common.map(s=>bm.get(s.id).i));
  const moved = new Set(common.filter((s, i)=>!keep.has(i)).map(s=>s.id));
  cur.scenes.forEach(s=>{
    const b = bm.get(s.id);
    if(!b){ rows.push({ id:s.id, num:nums[s.id], h:s.h, kind:'new', addN:s.ls.length, delN:0, add:s.ls.map(show).slice(0, 14), del:[] }); return; }
    const d = lineDiff(b.s.ls, s.ls);
    if(d.add.length || d.del.length) rows.push({ id:s.id, num:nums[s.id], h:s.h, kind:'mod', addN:d.add.length, delN:d.del.length, add:d.add.map(show).slice(0, 14), del:d.del.map(show).slice(0, 14), moved:moved.has(s.id) });
    else if(moved.has(s.id)) rows.push({ id:s.id, num:nums[s.id], h:s.h, kind:'moved', addN:0, delN:0, add:[], del:[] });
  });
  base.scenes.forEach(s=>{
    if(!cm.has(s.id)) rows.push({ id:s.id, num:null, h:s.h, kind:'del', addN:0, delN:s.ls.length, add:[], del:s.ls.map(show).slice(0, 14), gone:true });
  });
  return { pagesFrom:base.pages, pagesTo:cur.pages, wordsDelta:cur.words - base.words, rows };
}
function wdSessEmpty(d){ return !d.rows.length && d.pagesFrom === d.pagesTo && d.wordsDelta === 0; }
function wdSessSave(){
  const r = WD.sess; if(!r) return;
  try{ idbSet(WD_SESS_KEY(r.pid), r.rec).catch(()=>{}); }catch(e){}
}
function wdSessTouch(){
  const r = WD.sess; if(!r || S.view !== 'editor' || !S.project || S.project.id !== r.pid) return;
  r.rec.lastSeen = Date.now(); if(WD.lastEdit) r.rec.lastEl = WD.lastEdit;
  wdSessSave();
}
async function wdSessionStart(){
  const p = S.project; if(!p || WD.sessBusy) return;
  WD.sessBusy = true;
  try{
    let rec = null;
    try{ rec = await idbGet(WD_SESS_KEY(p.id)); }catch(e){}
    if(S.project !== p) return;
    const now = Date.now(), cur = wdSessSnap();
    let summary = null, fresh = false;
    if(!rec || !rec.base){
      rec = { base:cur, baseAt:now, lastSeen:now, lastEl:null, summary:null };
    } else if(now - (rec.lastSeen || 0) > WD_SESS_GAP){
      const d = wdSessDiff(rec.base, cur);
      if(!wdSessEmpty(d)){
        const ids = new Set(p.elements.map(e=>e.id));
        const resume = rec.lastEl && ids.has(rec.lastEl) ? rec.lastEl : null;
        summary = Object.assign(d, { from:rec.baseAt, to:rec.lastSeen, resume });
        rec.summary = summary; rec.base = cur; rec.baseAt = now; fresh = true;
      }
      rec.lastSeen = now;
    } else {
      rec.lastSeen = now;
    }
    WD.sess = { pid:p.id, rec };
    WD.lastEdit = rec.lastEl || null;
    wdSessSave();
    if(fresh) wdSessBar(summary);
  } finally { WD.sessBusy = false; }
}
function wdSessLine(d){
  const c = k=> d.rows.filter(r=>r.kind === k).length;
  const parts = [];
  const dp = d.pagesTo - d.pagesFrom;
  if(dp) parts.push((dp > 0 ? '+' : '\u2212') + Math.abs(dp) + ' ' + (Math.abs(dp) > 1 ? L('pages','pages') : L('page','page')));
  if(c('mod')) parts.push(c('mod') + ' ' + (c('mod') > 1 ? L('scènes modifiées','scenes edited') : L('scène modifiée','scene edited')));
  if(c('new')) parts.push(c('new') + ' ' + (c('new') > 1 ? L('ajoutées','added') : L('ajoutée','added')));
  if(c('del')) parts.push(c('del') + ' ' + (c('del') > 1 ? L('supprimées','deleted') : L('supprimée','deleted')));
  if(c('moved')) parts.push(c('moved') + ' ' + L('déplacée(s)','moved'));
  return parts.join(' · ') || L('quelques retouches de texte','a few text tweaks');
}
function wdSessBar(s){
  const old = document.getElementById('wdSessBar'); if(old) old.remove();
  const tb = document.querySelector('.main-col > .topbar'); if(!tb) return;
  const bar = document.createElement('div');
  bar.className = 'wd-bar wd-bar-info'; bar.id = 'wdSessBar'; bar.setAttribute('role','status');
  bar.innerHTML = '<div class="wd-bar-text"><b>' + L('Depuis ta dernière session','Since your last session') + '</b> · ' + esc(wdSessLine(s)) + '</div>' +
    '<div class="wd-bar-actions">' + (s.resume ? '<button class="btn btn-sm btn-primary" data-wd="ssResume">' + L('Reprendre où j\u2019en étais','Pick up where I left off') + '</button>' : '') +
    '<button class="btn btn-sm" data-wd="ssOpen">' + L('Voir le détail','See details') + '</button>' +
    '<button class="btn btn-sm btn-ghost" data-wd="ssClose" title="' + L('Fermer','Close') + '">' + icon('close') + '</button></div>';
  bar.addEventListener('click', e=>{ const b = e.target.closest('[data-wd]'); if(b && WD.h[b.dataset.wd]) WD.h[b.dataset.wd](b, e); });
  tb.insertAdjacentElement('afterend', bar);
}
function wdOpenSession(tab){
  closeMoreMenu();
  WD.ss = { tab: tab || ((WD.sess && WD.sess.rec.summary) ? 'last' : 'now'), open:null };
  wdSsDraw();
}
function wdSsData(){
  const r = WD.sess && WD.sess.pid === S.project.id ? WD.sess.rec : null;
  if(WD.ss.tab === 'last') return r && r.summary ? r.summary : null;
  if(!r) return null;
  const d = wdSessDiff(r.base, wdSessSnap());
  return Object.assign(d, { from:r.baseAt, to:Date.now(), resume:null });
}
function wdSsDraw(){
  const d = wdSsData(), T = WD.ss.tab;
  const fmt = ts=> new Date(ts).toLocaleString(getLang() === 'en' ? 'en-US' : 'fr-FR', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  const chip = k=> k === 'new' ? '<span class="wd-chip mod" style="background:rgba(47,158,68,.16);color:#237a38;">' + L('Ajoutée','Added') + '</span>'
    : k === 'del' ? '<span class="wd-chip gone">' + L('Supprimée','Deleted') + '</span>'
    : k === 'moved' ? '<span class="wd-chip same">' + L('Déplacée','Moved') + '</span>' : '<span class="wd-chip mod">' + L('Modifiée','Edited') + '</span>';
  let body;
  if(!d || wdSessEmpty(d)){
    body = '<div class="wd-empty">' + (T === 'last' ? L('Pas encore de session passée à résumer. Elle apparaîtra ici dès que tu reviendras après une pause.','No past session to sum up yet. It will show up here once you come back after a break.') : L('Rien n\u2019a changé depuis le début de cette session.','Nothing has changed since this session started.')) + '</div>';
  } else {
    const dw = d.wordsDelta, dp = d.pagesTo - d.pagesFrom;
    body = '<div class="wd-opts" style="margin-bottom:10px;gap:6px 22px;">' +
      '<span><b>' + d.pagesFrom + ' \u2192 ' + d.pagesTo + '</b> ' + L('pages','pages') + (dp ? ' (' + (dp > 0 ? '+' : '\u2212') + Math.abs(dp) + ')' : '') + '</span>' +
      '<span><b>' + (dw > 0 ? '+' : dw < 0 ? '\u2212' : '') + Math.abs(dw) + '</b> ' + L('mots','words') + '</span></div>' +
      d.rows.map(r=>{
        const open = WD.ss.open === r.id;
        const detail = open ? '<div class="wd-prev">' + r.del.map(t=>'<span class="wd-ln-old">\u2212 ' + esc(t || ' ') + '</span>').join('\n') + (r.del.length && r.add.length ? '\n' : '') +
          r.add.map(t=>'<span class="wd-ln-new">+ ' + esc(t || ' ') + '</span>').join('\n') +
          ((r.addN > r.add.length || r.delN > r.del.length) ? '\n\u2026' : '') + '</div>' : '';
        return '<div class="wd-card"><div class="wd-card-h"><div style="min-width:0;"><div class="flat-row-title" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
          (r.num ? esc(r.num) + '. ' : '') + esc(r.h || L('(sans titre)','(untitled)')) + '</div>' +
          '<div style="font-size:12px;color:var(--ink-soft);margin-top:3px;">' + chip(r.kind) + (r.moved && r.kind === 'mod' ? ' ' + chip('moved') : '') + ' ' +
          (r.kind === 'moved' ? '' : (r.addN ? '+' + r.addN : '') + (r.addN && r.delN ? ' · ' : '') + (r.delN ? '\u2212' + r.delN : '') + ' ' + L('lignes','lines')) + '</div></div>' +
          '<span style="display:flex;gap:6px;">' + (r.kind !== 'moved' ? '<button class="btn btn-sm btn-ghost" data-wd="ssDiff" data-id="' + esc(r.id) + '">' + (open ? L('Masquer','Hide') : L('Changements','Changes')) + '</button>' : '') +
          (!r.gone ? '<button class="btn btn-sm" data-wd="orGo" data-id="' + esc(r.id) + '">' + L('Aller','Go') + '</button>' : '') + '</span></div>' + detail + '</div>';
      }).join('');
  }
  wdModal('wdSsBd',
    '<h2>' + L('Ma session d\u2019écriture','My writing session') + '</h2>' +
    '<p class="wd-sub">' + (d ? (T === 'last' ? L('Dernière session : ','Last session: ') : L('Session en cours depuis ','Current session since ')) + esc(fmt(d.from)) + (T === 'last' ? ' \u2192 ' + esc(fmt(d.to)) : '') : '') + '</p>' +
    '<div class="wd-seg"><button data-wd="ssTab" data-t="last" class="' + (T === 'last' ? 'on' : '') + '">' + L('Dernière session','Last session') + '</button>' +
    '<button data-wd="ssTab" data-t="now" class="' + (T === 'now' ? 'on' : '') + '">' + L('Cette session','This session') + '</button></div>' +
    '<div class="wd-body">' + body + '</div>' +
    '<div class="modal-actions">' + (T === 'last' && d && d.resume ? '<button class="btn btn-primary" data-wd="ssResume2">' + L('Reprendre où j\u2019en étais','Pick up where I left off') + '</button>' : '') +
    '<button class="btn" data-wd="close">' + L('Fermer','Close') + '</button></div>');
}
WD.h.ssTab = b=>{ WD.ss.tab = b.dataset.t; WD.ss.open = null; wdSsDraw(); };
WD.h.ssDiff = b=>{ WD.ss.open = WD.ss.open === b.dataset.id ? null : b.dataset.id; const bd = document.querySelector('#wdSsBd .wd-body'); const y = bd ? bd.scrollTop : 0; wdSsDraw(); const nb = document.querySelector('#wdSsBd .wd-body'); if(nb) nb.scrollTop = y; };
WD.h.ssOpen = ()=>{ wdOpenSession('last'); };
WD.h.ssClose = ()=>{ const b = document.getElementById('wdSessBar'); if(b) b.remove(); };
WD.h.ssResume = ()=>{ const s = WD.sess && WD.sess.rec.summary; if(s) wdGoto(s.resume); };
WD.h.ssResume2 = WD.h.ssResume;

/* branchements : dernière ligne éditée, battement de présence, démarrage de session */
document.addEventListener('input', e=>{
  const d = e.target && e.target.closest && e.target.closest('#page .line[data-id]');
  if(d) WD.lastEdit = d.dataset.id;
}, true);
setInterval(()=>{ try{ wdSessTouch(); }catch(e){} }, 2 * 60 * 1000);
document.addEventListener('visibilitychange', ()=>{ if(document.hidden){ try{ wdSessTouch(); }catch(e){} } });
window.addEventListener('pagehide', ()=>{ try{ wdSessTouch(); }catch(e){} });
const __wdRender30 = render;
render = function(){
  const r = __wdRender30.apply(this, arguments);
  try{
    if(S.view === 'editor' && S.project){
      if(WD.sessFor !== S.project.id){ WD.sessFor = S.project.id; setTimeout(()=>{ try{ wdSessionStart(); }catch(e){} }, 900); }
    } else { WD.sessFor = null; if(WD.sess) wdSessTouch(); }
  }catch(e){}
  return r;
};
Object.assign(ACTIONS, { wdOpenOrphans, wdOpenSession: ()=> wdOpenSession() });


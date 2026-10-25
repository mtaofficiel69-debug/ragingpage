/* =====================================================================
   DÉMÉNAGEMENT — Raging Page et Raging Draw vivent maintenant sur
   ragingstudio.com. Ce bandeau s'affiche sous la barre de l'accueil de
   l'ancienne adresse et propose de tout transférer en un clic : on lit
   les scénarios et les affiches de ce navigateur, on ouvre
   ragingstudio.com/move.html et on les lui confie (postMessage, limité
   aux deux origines). Rien n'est supprimé ici.
===================================================================== */
(function(){
  var NEW = window.RAGING_MOVE_TO || 'https://ragingstudio.com';
  var IS_DRAW = /\/ragingdraw\//.test(location.pathname);
  var state = 'idle', result = null;

  function lang(){ try{ return typeof getLang === 'function' ? getLang() : 'en'; }catch(e){ return 'en'; } }
  function T(fr, en){ return lang() === 'en' ? en : fr; }

  function idbOpen(name, upgrade){
    return new Promise(function(res){
      var r; try{ r = indexedDB.open(name, 1); }catch(e){ return res(null); }
      r.onupgradeneeded = function(){ try{ upgrade(r.result); }catch(e){} };
      r.onsuccess = function(){ res(r.result); }; r.onerror = r.onblocked = function(){ res(null); };
    });
  }
  function idbReq(db, store, fn){
    return new Promise(function(res){
      try{ var q = fn(db.transaction(store, 'readonly').objectStore(store)); q.onsuccess = function(){ res(q.result); }; q.onerror = function(){ res(null); }; }
      catch(e){ res(null); }
    });
  }
  function lsJson(k){ try{ var v = localStorage.getItem(k); return v != null ? JSON.parse(v) : null; }catch(e){ return null; } }

  // les mêmes clés que Raging Page (IndexedDB d'abord, localStorage en secours)
  async function readPage(){
    var IDX = 'scriptmm_projects_index', db = await idbOpen('scriptmm_db', function(d){ if(!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); });
    var get = async function(k){ var v = db ? await idbReq(db, 'kv', function(s){ return s.get(k); }) : null; return v != null ? v : lsJson(k); };
    var index = await get(IDX); if(!Array.isArray(index)) index = [];
    var projects = {};
    for(var i = 0; i < index.length; i++){
      var e = index[i]; if(!e || !e.id) continue;
      var p = await get('scriptmm_project_' + e.id); if(p) projects[e.id] = p;
    }
    if(db) db.close();
    return {index:index, projects:projects};
  }
  async function readDraw(){
    var db = await idbOpen('ragingdraw', function(d){
      if(!d.objectStoreNames.contains('docs')) d.createObjectStore('docs', {keyPath:'id'});
      if(!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', {keyPath:'id'});
    });
    if(!db) return {docs:[], meta:[]};
    var docs = await idbReq(db, 'docs', function(s){ return s.getAll(); }) || [];
    var meta = await idbReq(db, 'meta', function(s){ return s.getAll(); }) || [];
    db.close();
    return {docs:docs, meta:meta};
  }

  function transfer(){
    if(state === 'busy') return;
    var w = window.open(NEW + '/move.html?lang=' + lang(), '_blank');
    if(!w){ state = 'error'; result = 'popup'; paint(); return; }
    state = 'busy'; paint();
    var data = Promise.all([readPage(), readDraw()]), sent = false;
    var stop = setTimeout(function(){ if(state === 'busy'){ state = 'error'; result = 'timeout'; cleanup(); paint(); } }, 60000);
    function cleanup(){ clearTimeout(stop); window.removeEventListener('message', onMsg); }
    function onMsg(e){
      if(e.origin !== NEW || e.source !== w || !e.data) return;
      if(e.data.type === 'raging-move-ready' && !sent){
        sent = true;
        data.then(function(d){ w.postMessage({type:'raging-move-data', page:d[0], draw:d[1]}, NEW); });
      } else if(e.data.type === 'raging-move-done'){
        state = 'done'; result = e.data; cleanup(); paint();
      } else if(e.data.type === 'raging-move-error'){
        state = 'error'; result = 'failed'; cleanup(); paint();
      }
    }
    window.addEventListener('message', onMsg);
  }

  function html(){
    var url = NEW + (IS_DRAW ? '/draw/' : '/page/');
    var msg, act = '';
    if(state === 'busy') msg = T('Transfert en cours… garde l’onglet ragingstudio.com ouvert.', 'Transferring… keep the ragingstudio.com tab open.');
    else if(state === 'done'){
      var np = result && result.page ? result.page.added : 0, nd = result && result.draw ? result.draw.added : 0;
      msg = T('C’est fait : ' + np + ' scénario' + (np > 1 ? 's' : '') + ' et ' + nd + ' affiche' + (nd > 1 ? 's' : '') + ' sont maintenant sur ragingstudio.com.',
              'Done: ' + np + ' screenplay' + (np === 1 ? '' : 's') + ' and ' + nd + ' poster' + (nd === 1 ? '' : 's') + ' are now on ragingstudio.com.');
    }
    else if(state === 'error') msg = result === 'popup'
      ? T('Ton navigateur a bloqué la nouvelle fenêtre. Autorise-la, puis réessaie.', 'Your browser blocked the new window. Allow it, then try again.')
      : T('Le transfert n’a pas abouti. Rien n’est perdu : réessaie.', 'The transfer didn’t finish. Nothing is lost: try again.');
    else msg = T('Raging Page et Raging Draw déménagent sur <b>ragingstudio.com</b>. Mêmes outils, nouvelle adresse.', 'Raging Page and Raging Draw are moving to <b>ragingstudio.com</b>. Same tools, new address.');
    if(state !== 'done' && state !== 'busy') act += '<button type="button" class="mvb-btn mvb-p" data-mvb="go">' + T('Transférer mon travail', 'Transfer my work') + '</button>';
    act += '<a class="mvb-btn" href="' + url + '">' + T('Aller sur ragingstudio.com', 'Go to ragingstudio.com') + '</a>';
    if(state === 'idle') act += '<button type="button" class="mvb-how" data-mvb="how" aria-expanded="false">' + T('Comment ça marche ?', 'How does it work?') + '</button>';
    var how = '<div class="mvb-more" hidden>' + T(
      'Tes scénarios et tes affiches sont enregistrés dans ce navigateur, à cette adresse. <b>Transférer mon travail</b> ouvre ragingstudio.com et y copie tout, en un clic, sans rien effacer ici. Sans transfert, tu peux aussi enregistrer chaque scénario en sauvegarde complète (.smmproj) et chaque affiche en projet (.rdraw), puis les ouvrir sur ragingstudio.com.',
      'Your screenplays and posters are saved in this browser, at this address. <b>Transfer my work</b> opens ragingstudio.com and copies everything there, in one click, without erasing anything here. You can also save each screenplay as a full backup (.smmproj) and each poster as a project (.rdraw), then open them on ragingstudio.com.') + '</div>';
    return '<div class="mvb-in"><span class="mvb-dot" aria-hidden="true"></span><p class="mvb-msg">' + msg + '</p><div class="mvb-act">' + act + '</div></div>' + how;
  }
  function paint(){
    var el = document.querySelector('.mvb');
    if(!el) return;
    el.className = 'mvb mvb-' + state;
    el.innerHTML = html();
  }
  function mount(){
    var top = document.querySelector('#homeView .wd-top');
    if(!top || (top.nextElementSibling && top.nextElementSibling.classList.contains('mvb'))) return;
    var el = document.createElement('div');
    el.className = 'mvb'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'ragingstudio.com');
    top.insertAdjacentElement('afterend', el);
    paint();
  }
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-mvb]'); if(!b) return;
    if(b.dataset.mvb === 'go') transfer();
    else if(b.dataset.mvb === 'how'){
      var m = document.querySelector('.mvb .mvb-more'); if(!m) return;
      m.hidden = !m.hidden; b.setAttribute('aria-expanded', m.hidden ? 'false' : 'true');
    }
  });

  var css = document.createElement('style');
  css.textContent = [
    '.mvb{flex:none; background:var(--surface-soft, #F7F9FB); border-bottom:1px solid var(--hair, #DADFE6); color:var(--ink, #23262E); font-family:Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;}',
    '.mvb-in{display:flex; align-items:center; gap:12px; flex-wrap:wrap; min-height:48px; padding:7px 24px;}',
    '.mvb-dot{width:8px; height:8px; border-radius:50%; flex:none; background:var(--accent, #3699D4);}',
    '.mvb-done .mvb-dot{background:var(--ok, #2F9E44);} .mvb-error .mvb-dot{background:var(--danger, #D64545);}',
    '.mvb-busy .mvb-dot{animation:mvbP 1s ease-in-out infinite;} @keyframes mvbP{50%{opacity:.3;}}',
    '.mvb-msg{flex:1; min-width:220px; margin:0; font-size:13.5px; line-height:1.45; color:var(--ink-soft, #5C6270);}',
    '.mvb-msg b{color:var(--ink, #23262E); font-weight:600;}',
    '.mvb-act{display:flex; align-items:center; gap:8px; flex-wrap:wrap;}',
    '.mvb-btn{display:inline-flex; align-items:center; height:32px; padding:0 13px; border-radius:6px; border:1px solid var(--hair, #DADFE6); background:var(--surface, #fff); color:var(--ink, #23262E); font:inherit; font-size:13px; font-weight:600; text-decoration:none; cursor:pointer; white-space:nowrap;}',
    '.mvb-btn:hover{border-color:var(--accent, #3699D4);}',
    '.mvb-btn.mvb-p{background:var(--accent, #3699D4); border-color:var(--accent, #3699D4); color:#fff;}',
    '.mvb-btn.mvb-p:hover{filter:brightness(.94);}',
    '.mvb-how{border:0; background:none; padding:0 4px; font:inherit; font-size:13px; color:var(--ink-soft, #5C6270); text-decoration:underline; text-underline-offset:3px; cursor:pointer;}',
    '.mvb-how:hover{color:var(--ink, #23262E);}',
    '.mvb-more{padding:0 24px 12px 44px; max-width:880px; font-size:13px; line-height:1.55; color:var(--ink-soft, #5C6270);}',
    '.mvb-more b{color:var(--ink, #23262E);}',
    '.mvb :focus-visible{outline:2px solid var(--accent, #3699D4); outline-offset:2px;}',
    '@media (max-width:720px){ .mvb-in{padding:8px 16px;} .mvb-more{padding:0 16px 12px 36px;} }',
    '@media print{ .mvb{display:none !important;} }'
  ].join('\n');
  document.head.appendChild(css);

  new MutationObserver(mount).observe(document.documentElement, {childList:true, subtree:true});
  mount();
})();

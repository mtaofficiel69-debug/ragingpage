/* =====================================================================
   V82 — RECONNEXION DRIVE · REPÈRE MUSIQUE · STORYBOARD EN TEMPS RÉEL
   ---------------------------------------------------------------------
   Bloc ajouté en fin de script, comme le bloc V81.
   1. Au clic sur un scénario, si Drive était connecté à la dernière visite
      et ne l'est plus, une fenêtre aux couleurs du site propose de se
      reconnecter (oui = reconnexion).
   2. Le repère de musique devient une pastille « ▶ Écouter » lisible ; le
      lecteur a un bouton « copier le lien » et un bouton « modifier ».
   3. Storyboard en temps réel : colonne à côté des pages, désactivée par
      défaut, rangée dans S.project.storyboard (sauvegardée avec le
      scénario, jamais dans les exports). Un plan = une image importée ou
      un dessin, placé sur une page, avec légende, glisser-déposer pour
      réordonner, suppression annulable, visionneuse plein écran.
===================================================================== */
(function(){
  const $ = id => document.getElementById(id);
  const live = () => !!(S && S.view === 'editor' && S.project && S.tab === 'editor' && $('page'));
  const svg = (p, w) => `<svg width="${w||14}" height="${w||14}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const SB_KEY = 'scriptmm_storyboard';
  /* v92 : le storyboard a maintenant son propre onglet (colonne de gauche) ; la colonne à côté des pages n'existe plus. */
  const sbOn = () => false;
  const sbSetOn = v => { try{ localStorage.setItem(SB_KEY, v ? '1' : '0'); }catch(e){} };
  const uid = () => 'sb' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const ICON_FRAME = '<rect x="2" y="3" width="12" height="10" rx="2"/><circle cx="6" cy="7" r="1"/><path d="M2.5 12l3.6-3.4 2.4 2.2 2-1.8 3 3"/>';
  function store(){
    const p = S.project;
    if(!p.storyboard || typeof p.storyboard !== 'object') p.storyboard = { frames:[] };
    if(!Array.isArray(p.storyboard.frames)) p.storyboard.frames = [];
    if(!Array.isArray(p.storyboard.seqs)) p.storyboard.seqs = [];   // v93 : séquences libres
    return p.storyboard;
  }
  const save = () => { try{ scheduleAutosave(); }catch(e){} };

  /* ---------- styles ---------- */
  const st = document.createElement('style'); st.id = 'rpV82Style';
  st.textContent = `
  /* repère de musique : pastille lisible */
  .line[data-music]:after{content:'▶ ' attr(data-mlabel); right:-2.4cm; top:.1em; width:auto; height:21px; line-height:21px; padding:0 9px;
    font:700 10.5px/21px var(--sans); letter-spacing:.01em; text-transform:none; white-space:nowrap; color:#fff; background:#3699D4;
    border-radius:999px; opacity:.95; box-shadow:0 1px 4px rgba(31,111,160,.35); transition:background .15s ease, box-shadow .15s ease;}
  .line[data-music]:hover:after{background:#2B86C0; opacity:1;}
  .line[data-music][data-mplay]:after{content:'■ ' attr(data-mlabel); background:#1F6FA0; box-shadow:0 0 0 3px rgba(54,153,212,.3);}
  .line[data-music][data-comment]:after{content:'💬  ▶ ' attr(data-mlabel); right:-3.4cm; width:auto; font-size:10.5px;}
  .line[data-music][data-comment][data-mplay]:after{content:'💬  ■ ' attr(data-mlabel);}

  /* storyboard : colonne */
  .rp-sb{flex:none; position:relative; width:300px; min-width:0; border-left:1px solid var(--hair); overflow:hidden; font-family:var(--sans); color:var(--ink);
    background:color-mix(in srgb, var(--surface) 55%, var(--editor-backdrop, #DCE0E7)); animation:rpSbIn .22s ease;}
  @keyframes rpSbIn{from{opacity:0; transform:translateX(14px);} to{opacity:1; transform:none;}}
  .rp-sb-head{position:absolute; z-index:3; top:0; left:0; right:0; height:44px; display:flex; align-items:center; gap:8px; padding:0 10px 0 14px;
    background:color-mix(in srgb, var(--surface) 82%, transparent); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); border-bottom:1px solid var(--hair);}
  .rp-sb-head b{font-size:11px; font-weight:700; letter-spacing:.11em; text-transform:uppercase; color:var(--ink-soft); display:flex; align-items:center; gap:7px;}
  .rp-sb-head em{margin-left:auto; font-style:normal; font-size:12px; color:var(--ink-soft); font-variant-numeric:tabular-nums;}
  .rp-sb-head button{width:26px; height:26px; display:grid; place-items:center; border:0; border-radius:50%; background:none; color:var(--ink-soft); cursor:pointer;}
  .rp-sb-head button:hover{background:var(--hair); color:var(--ink);}
  .rp-sb-scroll{position:absolute; inset:0; overflow:hidden;}
  .rp-sb-inner{position:relative; width:100%;}
  .rp-sb-lane{position:absolute; left:0; right:0; padding:0 12px; display:flex; flex-direction:column; min-height:0;}
  .rp-sb-lh{flex:none; display:flex; align-items:center; height:30px; padding-top:4px; font-size:11.5px; font-weight:700; color:var(--ink-soft); letter-spacing:.02em;}
  .rp-sb-lh span{flex:1;}
  .rp-sb-add{width:24px; height:24px; display:grid; place-items:center; border:1px solid var(--hair); border-radius:50%; background:var(--surface); color:var(--ink-soft); cursor:pointer; padding:0; transition:all .14s ease;}
  .rp-sb-add:hover{color:#fff; background:var(--accent); border-color:var(--accent);}
  .rp-sb-fl{flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:10px; padding:2px 0 14px; scrollbar-width:thin;}
  .rp-sb-lane.drop .rp-sb-fl{outline:2px dashed var(--accent); outline-offset:2px; border-radius:10px;}
  .rp-sb-f{flex:none;}
  .rp-sb-img{position:relative; aspect-ratio:16/9; border-radius:10px; overflow:hidden; background:#fff; border:1px solid var(--hair); box-shadow:var(--shadow-sm); cursor:zoom-in;}
  .rp-sb-img img{display:block; width:100%; height:100%; object-fit:cover; -webkit-user-drag:none;}
  .rp-sb-f.over .rp-sb-img{outline:2px solid var(--accent); outline-offset:2px;}
  .rp-sb-f.dragging{opacity:.4;}
  .rp-sb-n{position:absolute; top:7px; left:7px; min-width:20px; height:20px; padding:0 6px; display:grid; place-items:center; border-radius:99px; background:rgba(15,17,21,.82); color:#fff; font-size:11px; font-weight:700;}
  .rp-sb-tools{position:absolute; top:6px; right:6px; display:flex; gap:4px; opacity:0; transition:opacity .14s ease;}
  .rp-sb-img:hover .rp-sb-tools, .rp-sb-img:focus-within .rp-sb-tools{opacity:1;}
  .rp-sb-tools button{width:26px; height:26px; display:grid; place-items:center; border:0; border-radius:50%; background:rgba(15,17,21,.82); color:#fff; cursor:pointer; padding:0;}
  .rp-sb-tools button:hover{background:var(--accent);}
  .rp-sb-tools button[data-a="del"]:hover{background:#D64545;}
  .rp-sb-cap{display:block; width:100%; margin-top:5px; padding:4px 6px; border:1px solid transparent; border-radius:6px; background:transparent; color:var(--ink); font:inherit; font-size:12.5px; line-height:1.35;}
  .rp-sb-cap::placeholder{color:var(--ink-soft); opacity:.75;}
  .rp-sb-cap:hover{border-color:var(--hair);}
  .rp-sb-cap:focus{outline:none; border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px rgba(54,153,212,.2);}
  .rp-sb-ghost{flex:none; display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 8px; border:1.5px dashed var(--hair); border-radius:10px; color:var(--ink-soft); font-size:12px;}
  .rp-sb-ghost button{display:flex; align-items:center; gap:6px; padding:6px 10px; border:1px solid var(--hair); border-radius:999px; background:var(--surface); color:var(--ink); font:inherit; font-size:12px; font-weight:600; cursor:pointer;}
  .rp-sb-ghost button:hover{border-color:var(--accent); color:var(--accent);}
  .rp-sb-menu{position:fixed; z-index:140; min-width:190px; padding:6px; border-radius:12px; background:var(--surface); border:1px solid var(--hair); box-shadow:var(--shadow-md); font-family:var(--sans); animation:rpPop .14s ease;}
  .rp-sb-menu button{display:flex; align-items:center; gap:9px; width:100%; padding:8px 10px; border:0; border-radius:8px; background:none; color:var(--ink); font:inherit; font-size:13px; cursor:pointer; text-align:left;}
  .rp-sb-menu button:hover{background:var(--hair);}
  .rp-sb-menu svg{color:var(--accent); flex:none;}
  .rp-sb-fab{position:fixed; z-index:60; pointer-events:auto; display:none; width:38px; height:38px; place-items:center; border-radius:50%; border:1px solid var(--hair); cursor:pointer; padding:0;
    background:color-mix(in srgb, var(--surface) 88%, transparent); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); color:var(--ink-soft); box-shadow:var(--shadow-sm); transition:all .15s ease;}
  .rp-sb-fab.on{display:grid;}
  .rp-sb-fab:hover{color:#fff; background:var(--accent); border-color:var(--accent); transform:translateY(-1px);}

  /* storyboard : fenêtre de dessin */
  .rp-draw-bg{position:fixed; inset:0; z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(20,20,30,.55); animation:mmdFade .14s ease-out; font-family:var(--sans);}
  .rp-draw{width:min(900px,100%); padding:14px 14px 16px; border-radius:16px; background:var(--surface); color:var(--ink); border:1px solid var(--hair); box-shadow:var(--shadow-md);}
  .rp-draw-bar{display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:10px;}
  .rp-draw-bar h3{margin:0 10px 0 4px; font-size:15px; font-weight:700;}
  .rp-draw-bar i{width:1px; height:20px; background:var(--hair); margin:0 4px;}
  .rp-draw-bar button{height:30px; min-width:30px; display:inline-grid; place-items:center; padding:0 8px; border:1px solid var(--hair); border-radius:8px; background:var(--surface); color:var(--ink); font:inherit; font-size:12.5px; cursor:pointer;}
  .rp-draw-bar button:hover{border-color:var(--accent);}
  .rp-draw-bar button.sel{border-color:var(--accent); box-shadow:0 0 0 2px rgba(54,153,212,.3);}
  .rp-draw-bar .col{width:24px; min-width:24px; height:24px; padding:0; border-radius:50%;}
  .rp-draw canvas{display:block; width:100%; aspect-ratio:16/9; background:#fff; border:1px solid var(--hair); border-radius:10px; touch-action:none; cursor:crosshair;}
  .rp-draw-act{display:flex; justify-content:flex-end; gap:8px; margin-top:12px;}
  .rp-lb{position:fixed; inset:0; z-index:310; display:flex; align-items:center; justify-content:center; padding:30px; background:rgba(10,11,16,.86); cursor:zoom-out; animation:mmdFade .14s ease-out;}
  .rp-lb img{max-width:100%; max-height:100%; border-radius:10px; box-shadow:0 20px 60px rgba(0,0,0,.5); background:#fff;}
  #rpSnack{position:fixed; z-index:320; left:50%; bottom:26px; transform:translateX(-50%); display:flex; align-items:center; gap:14px; padding:9px 10px 9px 16px; border-radius:999px;
    background:#262535; color:#fff; font:13px var(--sans); box-shadow:0 8px 24px #0005; animation:rpSnackIn .18s ease both;}
  @keyframes rpSnackIn{from{opacity:0; transform:translate(-50%, 10px);} to{opacity:1; transform:translate(-50%, 0);}}
  #rpSnack button{border:0; border-radius:999px; padding:5px 12px; background:rgba(255,255,255,.14); color:#6CB8E8; font:inherit; font-weight:700; cursor:pointer;}
  #rpSnack button:hover{background:rgba(255,255,255,.22);}
  @media (max-width:1100px){ .rp-sb{width:250px;} }
  @media (max-width:760px){ .rp-sb{width:200px;} .rp-sb-ghost span{display:none;} }
  @media print{ .rp-sb, .rp-sb-fab, .rp-draw-bg, .rp-lb, #rpSnack, .rp-sb-menu{display:none !important;} }
  `;
  document.head.appendChild(st);

  /* =====================================================================
     1. RECONNEXION GOOGLE DRIVE
  ===================================================================== */
  let gdAsking = false, gdRefused = false;
  const GD_ASK_KEY = 'scriptmm_gdrive_ask_at';   // la question n'est posée qu'une fois par 24 h, quelle que soit la réponse
  async function gdAskReconnect(){
    if(gdAsking || gdRefused) return;
    try{
      if(localStorage.getItem(GD_ON_KEY) !== '1' || !gdClientId()) return;
      if(gdConnected()) return;
      if(Date.now() - (+localStorage.getItem(GD_ASK_KEY) || 0) < 24 * 3600 * 1000) return;
      gdAsking = true;
      for(let i = 0; i < 110 && window.__rpGdAuto && window.__rpGdAuto.state === 'pending'; i++) await sleep(100);
      if(gdConnected() || !live()) return;
      try{ localStorage.setItem(GD_ASK_KEY, String(Date.now())); }catch(e){}
      const name = (S.project && S.project.title) || '';
      const ok = await mmConfirm(
        L('Tu as été déconnecté de ton Google Drive depuis ta dernière visite. Veux-tu te reconnecter pour que ce scénario continue d\u2019être sauvegardé sur ton Drive ?',
          'You were signed out of your Google Drive since your last visit. Do you want to reconnect so this screenplay keeps being saved to your Drive?') + (name ? '\n\u201C' + name + '\u201D' : ''),
        { title:L('Google Drive est déconnecté', 'Google Drive is disconnected'), ok:L('Oui, me reconnecter', 'Yes, reconnect'), cancel:L('Non, pas maintenant', 'No, not now') });
      if(ok) await gdConnect(); else gdRefused = true;
    }catch(e){}
    gdAsking = false;
  }
  const __openProject82 = openProject;
  openProject = async function(id){
    const r = await __openProject82.apply(this, arguments);
    if(S.project && S.project.id === id){ try{ gdAskReconnect(); }catch(e){} }
    return r;
  };
  if(ACTIONS.openProject) ACTIONS.openProject = openProject;   // la table des actions garde sa propre référence

  /* =====================================================================
     2. REPÈRE DE MUSIQUE : libellé et état « en lecture »
  ===================================================================== */
  let MUK = '';
  function musicUi(){
    const pg = $('page'); if(!pg) return;
    // Le lecteur est posé directement dans <body> : on le cherche parmi ses quelques enfants, pas dans tout le document.
    let mp = null; for(const c of document.body.children){ if(c.classList.contains('rp-mp')){ mp = c; break; } }
    const pid = mp ? mp.dataset.id : null;
    // PERFORMANCE : rien à relire quand ni la musique en lecture, ni la langue, ni les lignes marquées n'ont changé.
    const k = pid + '|' + getLang() + '|' + Object.keys((S.project && S.project.music) || {}).join(',') + '|' + pageLineCount() + '|' + (S.musicMarkVer || 0);
    if(pg.__muk === k && MUK === k) return;
    MUK = k; pg.__muk = k;
    pg.querySelectorAll('.line[data-music]').forEach(d => {
      const playing = d.dataset.id === pid;
      const lab = playing ? L('En lecture', 'Playing') : L('Écouter', 'Play');
      if(d.dataset.mlabel !== lab) d.dataset.mlabel = lab;
      if(playing){ if(d.dataset.mplay !== '1') d.dataset.mplay = '1'; } else if('mplay' in d.dataset) delete d.dataset.mplay;
    });
  }

  /* =====================================================================
     3. STORYBOARD EN TEMPS RÉEL
  ===================================================================== */
  const SB = { sig:'', ro:null, roEls:[], pickPage:1, snack:null };
  const SELS = new Set();   // v89 : plans cochés pour le téléchargement
  function nPages(){ const n = document.querySelectorAll('#sheets .sheet').length; return Math.max(1, n || (S.pagination && S.pagination.count) || 1); }   // v92 : aussi hors de l'éditeur
  /* v90 : un plan appartient à une scène (f.sc) ; sans scène choisie (ou si la scène ne passe plus par cette page),
     il retombe sur la première scène présente sur la page */
  function sceneIdOf(f, ps){
    if(!ps || !ps.length) return '';
    for(let i = 0; i < ps.length; i++) if(ps[i].id === f.sc) return ps[i].id;
    return ps[0].id;
  }
  function framesByPage(n, scs){
    scs = scs || sbScenes();
    const by = {}; for(let p = 1; p <= n; p++) by[p] = [];
    store().frames.forEach(f => { const p = Math.max(1, Math.min(n, parseInt(f.pg, 10) || 1)); by[p].push(f); });
    for(let p = 1; p <= n; p++){
      const ps = scs.filter(s => s.from <= p && p <= s.to);
      if(ps.length > 1) by[p] = by[p].map((f, i) => ({ f:f, i:i, r:ps.findIndex(s => s.id === sceneIdOf(f, ps)) })).sort((a, b) => a.r - b.r || a.i - b.i).map(x => x.f);
    }
    return by;
  }
  function sbFab(){
    let f = $('rpSbFab');
    if(f){ f.remove(); f = null; }       // v87 : plus de bouton rond ; le storyboard s'ouvre par le menu ⋯ (ou Ctrl+Alt+B)
    if(!f){
      f = document.createElement('button'); f.type = 'button'; f.id = 'rpSbFab'; f.className = 'rp-sb-fab rp-ui';
      f.title = L('Storyboard en temps réel (Ctrl+Alt+B)', 'Live storyboard (Ctrl+Alt+B)');
      f.setAttribute('aria-label', f.title); f.innerHTML = svg(ICON_FRAME, 18);
      /* volontairement NON ajouté à la page : sbSync() continue de le manipuler sans qu'il apparaisse */
    }
    return f;
  }
  function sbToggle(v){
    if(S && S.view === 'editor' && S.project){ switchTab(S.tab === 'storyboard' ? 'editor' : 'storyboard'); return; }   // v92 : ouvre l'onglet Storyboard
    const next = v == null ? !sbOn() : !!v;
    sbSetOn(next); sbSync();
    try{ schedulePaginate(40); }catch(err){}     // v86 : la feuille se remet à la largeur restante
    if(!next){ const m = document.querySelector('.rp-sb-menu'); if(m) m.remove(); }
  }
  function laneHtml(p, list, nums){
    const ps = (SB.scs || []).filter(s => s.from <= p && p <= s.to);
    const frameHtml = f => `<div class="rp-sb-f${SELS.has(f.id) ? ' sel' : ''}" data-id="${f.id}" data-sc="${esc(sceneIdOf(f, ps))}">
        <div class="rp-sb-img" draggable="true" title="${esc(L('Clique pour agrandir · glisse pour réordonner', 'Click to enlarge · drag to reorder'))}">
          <span class="rp-sb-n">${nums[f.id]}</span><img src="${f.src}" alt="" draggable="false">
          <button type="button" class="rp-sb-chk" data-a="sel" aria-pressed="${SELS.has(f.id) ? 'true' : 'false'}" title="${esc(L('Cocher pour télécharger', 'Tick to download'))}">${svg('<path d="M4 8.5l2.5 2.5L12 5.5"/>', 12)}</button>
          <div class="rp-sb-tools">
            <button type="button" data-a="mv" title="${esc(L('Déplacer vers une autre page…', 'Move to another page…'))}">${svg('<path d="M5.5 3v10M3 5.5L5.5 3 8 5.5M10.5 13V3M8 10.5l2.5 2.5 2.5-2.5"/>', 13)}</button>
            <button type="button" data-a="dl" title="${esc(L('Télécharger ce plan…', 'Download this shot…'))}">${svg('<path d="M8 2.5v8M5 7.5l3 3 3-3M3 13h10"/>', 13)}</button>
            <button type="button" data-a="edit" title="${esc(L('Dessiner dessus / modifier', 'Draw on it / edit'))}">${svg('<path d="M3 13l.7-3L10.8 3a1.4 1.4 0 0 1 2 2L5.7 12.2 3 13z"/>', 13)}</button>
            <button type="button" data-a="del" title="${esc(L('Supprimer ce plan', 'Delete this shot'))}">${svg('<path d="M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.5 8h5l.5-8"/>', 13)}</button>
          </div></div>
        <input class="rp-sb-cap" type="text" maxlength="200" placeholder="${esc(L('Légende (cadrage, mouvement…)', 'Caption (framing, movement…)'))}" value="${esc(f.cap || '')}">
      </div>`;
    const scHead = s => `<div class="rp-sb-sh" data-sc="${esc(s.id)}"><span class="n">${esc(String(s.num || ''))}</span><span class="t" data-a="gosc" data-sc="${esc(s.id)}" title="${esc(L('Aller à cette scène : ', 'Go to this scene: ') + s.title)}">${esc(s.title)}</span>${s.from < p ? `<em>${esc(L('suite', 'cont.'))}</em>` : ''}<button type="button" class="rp-sb-add" title="${esc(L('Ajouter un plan à cette scène', 'Add a shot to this scene'))}">${svg('<path d="M8 3v10M3 8h10"/>', 12)}</button></div>`;
    let frames;
    if(ps.length){
      const g = {}; ps.forEach(s => { g[s.id] = []; });
      list.forEach(f => g[sceneIdOf(f, ps)].push(f));
      frames = ps.map(s => scHead(s) + g[s.id].map(frameHtml).join('')).join('');
    } else frames = list.map(frameHtml).join('');
    const ghost = list.length ? '' : `<div class="rp-sb-ghost first"><span>${esc(L('Aucun plan', 'No shot'))}</span>
        <button type="button" data-a="upload">${svg('<path d="M8 11V3M5 6l3-3 3 3M3 13h10"/>', 13)} ${esc(L('Image', 'Image'))}</button>
        <button type="button" data-a="draw">${svg('<path d="M3 13l.7-3L10.8 3a1.4 1.4 0 0 1 2 2L5.7 12.2 3 13z"/>', 13)} ${esc(L('Dessin', 'Draw'))}</button></div>`;
    return `<div class="rp-sb-lane" data-p="${p}"><div class="rp-sb-lh"><span class="rp-sb-pg" data-a="gopage" title="${esc(L('Aller à cette page du scénario', 'Go to this page of the script'))}">${L('Page', 'Page')} ${p}</span>
      <button type="button" class="rp-sb-add" title="${esc(L('Ajouter un plan à cette page', 'Add a shot to this page'))}">${svg('<path d="M8 3v10M3 8h10"/>', 13)}</button></div>
      <div class="rp-sb-fl">${frames}${ghost}</div></div>`;
  }
  /* v92 : après chaque changement de plans, l'onglet Storyboard se redessine s'il est ouvert */
  function sbChanged(){ sbRender(); if(typeof window.sbTabRefresh === 'function') window.sbTabRefresh(); }
  function sbRender(){
    const root = $('rpSb'); if(!root) return;
    SB.scs = sbScenes();
    const n = nPages(), by = framesByPage(n, SB.scs), nums = {}; let k = 0;
    for(let p = 1; p <= n; p++) by[p].forEach(f => { nums[f.id] = ++k; });
    const inner = root.querySelector('.rp-sb-inner');
    inner.innerHTML = Object.keys(by).map(p => laneHtml(p, by[p], nums)).join('');
    const c = root.querySelector('.rp-sb-head em'); const tot = store().frames.length;
    c.textContent = tot ? tot + ' ' + (tot > 1 ? L('plans', 'shots') : L('plan', 'shot')) : '';
    SB.sig = sigNow();
    sbPlace();
    selRefresh();
  }
  const sigNow = () => { SB.scsNow = sbScenes(); return (S.project ? S.project.id : '') + '|' + nPages() + '|' + getLang() + '|' + SB.scsNow.map(s => s.id + ':' + s.from + '-' + s.to).join(';'); };
  function sbPlace(){
    const root = $('rpSb'), cp = $('centerPane'); if(!root || !cp) return;
    const sheets = Array.from(document.querySelectorAll('#sheets .sheet'));
    const cr = cp.getBoundingClientRect(), inner = root.querySelector('.rp-sb-inner'), sc = root.querySelector('.rp-sb-scroll');
    const full = Math.max(cp.scrollHeight, cp.clientHeight);
    if(inner.style.height !== full + 'px') inner.style.height = full + 'px';
    root.querySelectorAll('.rp-sb-lane').forEach(l => {
      const sh = sheets[(parseInt(l.dataset.p, 10) || 1) - 1];
      if(!sh) return;
      const r = sh.getBoundingClientRect();
      const top = Math.round(r.top - cr.top + cp.scrollTop), h = Math.max(120, Math.round(r.height));
      if(l.style.top !== top + 'px') l.style.top = top + 'px';
      if(l.style.height !== h + 'px') l.style.height = h + 'px';
    });
    if(Math.abs(sc.scrollTop - cp.scrollTop) > 0.5) sc.scrollTop = cp.scrollTop;
    /* v90 : numéro et titre des scènes suivent ce qui est tapé dans le scénario, sans refaire toute la colonne */
    const scs = SB.scsNow || SB.scs || [];
    root.querySelectorAll('.rp-sb-sh').forEach(h => {
      const s = scs.filter(x => x.id === h.dataset.sc)[0]; if(!s) return;
      const nn = h.querySelector('.n'), tt = h.querySelector('.t'), num = String(s.num || '');
      if(nn && nn.textContent !== num) nn.textContent = num;
      if(tt && tt.textContent !== s.title){ tt.textContent = s.title; tt.title = L('Aller à cette scène : ', 'Go to this scene: ') + s.title; }
    });
  }
  function sbSync(){
    const fab = sbFab();
    if(!live()){ const p = $('rpSb'); if(p) p.remove(); fab.classList.remove('on'); return; }
    const cp = $('centerPane'), cr = cp.getBoundingClientRect(), enabled = sbOn();
    if(SB.cw !== undefined && Math.abs(SB.cw - cp.clientWidth) > 1){ try{ schedulePaginate(40); }catch(err){} }   // v86
    SB.cw = cp.clientWidth;
    fab.classList.toggle('on', !enabled);
    /* v86 : le bouton reste toujours dans l'écran, même si la zone d'écriture dépasse la fenêtre */
    fab.style.right = Math.max(12, Math.round(window.innerWidth - Math.min(cr.right, window.innerWidth) + 24)) + 'px';
    fab.style.bottom = Math.max(12, Math.round(window.innerHeight - Math.min(cr.bottom, window.innerHeight) + 18)) + 'px';
    let root = $('rpSb');
    if(!enabled){ if(root) root.remove(); return; }
    if(!root){
      root = document.createElement('div'); root.id = 'rpSb'; root.className = 'rp-sb rp-ui';
      root.innerHTML = `<div class="rp-sb-head"><b>${svg(ICON_FRAME, 14)} Storyboard</b><em></em>
        <button type="button" data-a="dlopen" title="${esc(L('Télécharger les plans…', 'Download the shots…'))}">${svg('<path d="M8 2.5v8M5 7.5l3 3 3-3M3 13h10"/>', 13)}</button>
        <button type="button" data-a="close" title="${esc(L('Masquer le storyboard', 'Hide the storyboard'))}">${svg('<path d="M4 4l8 8M12 4l-8 8"/>', 13)}</button></div>
        <div class="rp-sb-scroll"><div class="rp-sb-inner"></div></div>`;
      const row = document.querySelector('.body-row') || (cp && cp.parentNode), side = $('sidePane');
      if(!row) return;
      row.insertBefore(root, side && side.parentNode === row ? side : null);
      SB.sig = '';
    }
    if(SB.sig !== sigNow()) sbRender(); else sbPlace();
    if(!SB.ro && window.ResizeObserver){ SB.ro = new ResizeObserver(() => tick()); }
    [cp, $('pageStack')].forEach(el => { if(el && SB.ro && SB.roEls.indexOf(el) < 0){ SB.ro.observe(el); SB.roEls.push(el); } });
  }

  /* ---- ajout d'images ---- */
  function compress(file){
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const max = 960, k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        const w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(im, 0, 0, w, h);
        URL.revokeObjectURL(url); resolve(cv.toDataURL('image/jpeg', 0.8));
      };
      im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')); };
      im.src = url;
    });
  }
  async function addFiles(files, page, sc, sq){
    const list = Array.from(files || []).filter(f => /^image\//.test(f.type));
    if(!list.length){ toast(L('Dépose une image (JPG, PNG, WebP…).', 'Drop an image (JPG, PNG, WebP…).')); return; }
    for(const f of list){
      try{ store().frames.push(Object.assign({ id:uid(), pg:page, k:'img', src:await compress(f), cap:'' }, sc ? { sc:sc } : {}, sq ? { sq:sq } : {})); }
      catch(e){ toast(L('Image illisible : ', 'Unreadable image: ') + f.name); }
    }
    save(); sbChanged();
  }
  function pickFile(page, sc, sq){
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.style.display = 'none';
    inp.addEventListener('change', () => { addFiles(inp.files, page, sc, sq); inp.remove(); });
    document.body.appendChild(inp); inp.click();
  }
  async function pasteImage(page, sc, sq){
    try{
      const items = await navigator.clipboard.read();
      for(const it of items){
        const t = it.types.find(x => /^image\//.test(x));
        if(t){ const b = await it.getType(t); await addFiles([new File([b], 'collage', { type:t })], page, sc, sq); return; }
      }
      toast(L('Aucune image dans le presse-papiers.', 'No image in the clipboard.'));
    }catch(e){ toast(L('Colle avec Ctrl/Cmd+V en survolant la page voulue.', 'Paste with Ctrl/Cmd+V while hovering the page you want.')); }
  }

  /* ---- suppression annulable ---- */
  function snack(msg, undo){
    const o = $('rpSnack'); if(o) o.remove(); clearTimeout(SB.snack);
    const d = document.createElement('div'); d.id = 'rpSnack'; d.className = 'rp-ui';
    d.innerHTML = `<span>${esc(msg)}</span><button type="button">${esc(L('Annuler', 'Undo'))}</button>`;
    d.querySelector('button').addEventListener('click', () => { undo(); d.remove(); });
    document.body.appendChild(d);
    SB.snack = setTimeout(() => { d.style.transition = 'opacity .16s ease'; d.style.opacity = '0'; setTimeout(() => d.remove(), 170); }, 4000);
  }
  function delFrame(id){
    const fr = store().frames, i = fr.findIndex(f => f.id === id); if(i < 0) return;
    const f = fr.splice(i, 1)[0]; save(); sbChanged();
    snack(L('Plan supprimé.', 'Shot deleted.'), () => { const a = store().frames; a.splice(Math.min(i, a.length), 0, f); save(); sbChanged(); });
  }
  function lightbox(src){
    const d = document.createElement('div'); d.className = 'rp-lb rp-ui'; d.innerHTML = `<img src="${src}" alt="">`;
    const close = () => { d.remove(); document.removeEventListener('keydown', onKey, true); };
    const onKey = e => { if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(); } };
    d.addEventListener('click', close); document.addEventListener('keydown', onKey, true); document.body.appendChild(d);
  }

  /* ---- éditeur de dessin (v90 : formes, flèche, texte, remplissage, rétablir, repères de cadrage) ---- */
  function drawOpen(page, frame, sc, sq){
    const old = $('rpDrawBg'); if(old) old.remove();
    /* v92 : outils rangés par groupe dans une colonne, chacun avec son nom et sa touche ; au-dessus du dessin,
       seulement les réglages utiles à l'outil choisi (couleur, épaisseur, opacité, trait, remplissage). */
    const COLORS = [['#1b1b1f', L('Noir', 'Black')], ['#8A8F98', L('Gris', 'Grey')], ['#FFFFFF', L('Blanc', 'White')], ['#3699D4', L('Bleu', 'Blue')], ['#D64545', L('Rouge', 'Red')], ['#2E9E6B', L('Vert', 'Green')], ['#E0A21B', L('Jaune', 'Yellow')], ['#8E5BD0', L('Violet', 'Purple')]];
    const FF = 'system-ui, "Helvetica Neue", Arial, sans-serif';
    const IC = {
      pen:'<path d="M11.2 2.3a1.6 1.6 0 0 1 2.3 2.3L5.4 12.7l-2.9.8.8-2.9z"/><path d="M9.8 3.7l2.5 2.5"/>',
      marker:'<path d="M10.4 1.9l3.7 3.7-5.6 5.6-3.7-3.7z"/><path d="M4.8 7.5l-1.6 3.4 1.9 1.9 3.4-1.6"/><path d="M2.2 14.2h5.6" stroke-width="2.2" stroke-opacity=".45"/>',
      eraser:'<path d="M6.3 13.5L2.4 9.6a1.4 1.4 0 0 1 0-2l5.2-5.2a1.4 1.4 0 0 1 2 0l4 4a1.4 1.4 0 0 1 0 2l-5.1 5.1"/><path d="M5.1 5l5.9 5.9M6.3 13.5h7.4"/>',
      line:'<path d="M3.4 12.6l9.2-9.2"/><circle cx="3" cy="13" r="1.3" fill="currentColor"/><circle cx="13" cy="3" r="1.3" fill="currentColor"/>',
      arrow:'<path d="M3 13L12.6 3.4M7.4 3H13v5.6"/>',
      rect:'<rect x="2.5" y="3.5" width="11" height="9" rx="1.2"/>',
      ellipse:'<circle cx="8" cy="8" r="5.6"/>',
      text:'<path d="M3 4.6V3h10v1.6M8 3v10M6 13h4"/>',
      bucket:'<path d="M2.9 7.6L7.4 3.1l5.3 5.3-4.5 4.5a1.6 1.6 0 0 1-2.3 0L2.9 9.9a1.6 1.6 0 0 1 0-2.3z"/><path d="M3.2 8.6h9.3M5.6 1.6l1.8 1.5"/><path d="M14.1 10.4s1.1 1.5 1.1 2.3a1.1 1.1 0 0 1-2.2 0c0-.8 1.1-2.3 1.1-2.3z" fill="currentColor"/>',
      picker:'<path d="M10.5 2.7a1.9 1.9 0 0 1 2.8 2.8l-1.7 1.7-2.8-2.8z"/><path d="M9.6 5.5L3.5 11.6 3 13l1.4-.5 6.1-6.1M8.3 4.2l3.5 3.5"/>',
      crop:'<path d="M4.5 1.5v10h10M1.5 4.5h10v10"/>'
    };
    const GROUPS = [
      [L('Dessin', 'Draw'), [['pen', L('Crayon', 'Pencil'), 'B'], ['marker', L('Marqueur', 'Marker'), 'M'], ['eraser', L('Gomme', 'Eraser'), 'E']]],
      [L('Formes', 'Shapes'), [['line', L('Ligne', 'Line'), 'L'], ['arrow', L('Flèche', 'Arrow'), 'A'], ['rect', L('Rectangle', 'Rectangle'), 'R'], ['ellipse', L('Ellipse', 'Ellipse'), 'O']]],
      [L('Couleur & texte', 'Colour & text'), [['text', L('Texte', 'Text'), 'T'], ['bucket', L('Seau', 'Bucket'), 'G'], ['picker', L('Pipette', 'Eyedropper'), 'I']]],
      [L('Image', 'Picture'), [['crop', L('Cadrer', 'Frame'), 'C']]]
    ];
    const TIPS = {
      pen:L('Crayon : trait à main levée', 'Pencil: freehand stroke'), marker:L('Marqueur : trait large et transparent, pour ombrer ou surligner', 'Marker: wide see-through stroke, to shade or highlight'),
      eraser:L('Gomme : efface en blanc', 'Eraser: erases to white'), line:L('Ligne · Maj = droite', 'Line · Shift = straight'),
      arrow:L('Flèche · mouvement de caméra ou de personnage · Maj = droite', 'Arrow · camera or character move · Shift = straight'),
      rect:L('Rectangle · Maj = carré', 'Rectangle · Shift = square'), ellipse:L('Ellipse · Maj = cercle', 'Ellipse · Shift = circle'),
      text:L('Texte : clique où écrire', 'Text: click where to write'), bucket:L('Seau : colorie la zone cliquée', 'Bucket: fills the clicked area'),
      picker:L('Pipette : prend une couleur du dessin', 'Eyedropper: picks a colour from the drawing'), crop:L('Cadrer : déplacer et zoomer l’image dans le cadre', 'Frame: move and zoom the picture in the frame')
    };
    const KEYS = { b:'pen', m:'marker', e:'eraser', l:'line', a:'arrow', r:'rect', o:'ellipse', t:'text', g:'bucket', i:'picker' };
    /* réglages montrés pour chaque outil */
    const SHOW = { pen:'col size op dash', marker:'col size op', eraser:'size', line:'col size op dash', arrow:'col size op dash', rect:'col size op dash fill', ellipse:'col size op dash fill', text:'col size op', bucket:'col', picker:'pick' };
    const cur = (paths, hx, hy) => 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#fff" stroke-width="3">' + paths + '</g><g stroke="#1b1b1f" stroke-width="1.3">' + paths + '</g></svg>') + '") ' + hx + ' ' + hy + ', crosshair';
    const BUCKET_CUR = cur('<path d="M2.9 7.6L7.4 3.1l5.3 5.3-4.5 4.5a1.6 1.6 0 0 1-2.3 0L2.9 9.9a1.6 1.6 0 0 1 0-2.3z"/><path d="M14.1 10.4s1.1 1.5 1.1 2.3a1.1 1.1 0 0 1-2.2 0c0-.8 1.1-2.3 1.1-2.3z"/>', 21, 21);
    const PICK_CUR = cur('<path d="M10.5 2.7a1.9 1.9 0 0 1 2.8 2.8l-1.7 1.7-2.8-2.8z"/><path d="M9.6 5.5L3.5 11.6 3 13l1.4-.5 6.1-6.1"/>', 4, 20);
    const toolBtn = t => `<button type="button" data-tool="${t[0]}" class="${t[0] === 'pen' ? 'sel' : ''}" title="${esc(TIPS[t[0]] + ' (' + t[2] + ')')}">${svg(IC[t[0]], 16)}<span>${esc(t[1])}</span><kbd>${t[2]}</kbd></button>`;
    const bg = document.createElement('div'); bg.id = 'rpDrawBg'; bg.className = 'rp-draw-bg rp-ui';
    bg.innerHTML = `<div class="rp-draw v92" role="dialog" aria-modal="true" aria-label="${esc(frame ? L('Modifier le plan', 'Edit the shot') : L('Dessiner un plan', 'Draw a shot'))}">
      <div class="rd-head"><h3>${esc(frame ? L('Modifier le plan', 'Edit the shot') : L('Dessiner un plan', 'Draw a shot'))}</h3>
        <div class="rd-acts">
          <button type="button" data-a="undo" title="${esc(L('Annuler (Ctrl+Z)', 'Undo (Ctrl+Z)'))}">${svg('<path d="M4 7h6a3 3 0 0 1 0 6H6M4 7l2.5-2.5M4 7l2.5 2.5"/>', 15)}</button>
          <button type="button" data-a="redo" title="${esc(L('Rétablir (Ctrl+Y)', 'Redo (Ctrl+Y)'))}">${svg('<path d="M12 7H6a3 3 0 0 0 0 6h4M12 7l-2.5-2.5M12 7l-2.5 2.5"/>', 15)}</button><i></i>
          <button type="button" data-a="guides" title="${esc(L('Repères de cadrage (tiers) — non enregistrés', 'Framing guides (thirds) — not saved'))}">${svg('<path d="M6 2.5v11M10 2.5v11M2.5 6h11M2.5 10h11"/>', 15)}<span>${esc(L('Repères', 'Guides'))}</span></button>
          <button type="button" data-a="mirror" title="${esc(L('Retourner le dessin (miroir gauche ↔ droite), pour changer le sens du regard ou du mouvement', 'Flip the drawing (left ↔ right mirror), to change the direction of a look or a move'))}">${svg('<path d="M8 1.8v12.4" stroke-dasharray="1.6 1.6"/><path d="M5.8 4.2L2 11.8h3.8zM10.2 4.2l3.8 7.6h-3.8z"/>', 15)}<span>${esc(L('Miroir', 'Mirror'))}</span></button>
          <button type="button" data-a="clear" title="${esc(L('Tout effacer', 'Clear all'))}">${svg('<path d="M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.5 8h5l.5-8"/>', 15)}<span>${esc(L('Tout effacer', 'Clear all'))}</span></button>
        </div></div>
      <div class="rd-body">
        <div class="rd-tools" role="toolbar" aria-orientation="vertical" aria-label="${esc(L('Outils', 'Tools'))}">${GROUPS.map(g => `<div class="rd-g">${esc(g[0])}</div>` + g[1].map(t => t[0] === 'crop'
            ? `<button type="button" data-a="crop" title="${esc(TIPS.crop + ' (C)')}">${svg(IC.crop, 16)}<span>${esc(t[1])}</span><kbd>C</kbd></button>` : toolBtn(t)).join('')).join('')}</div>
        <div class="rd-main">
          <div class="rd-opts">
            <div class="rd-o" data-o="col"><span class="rd-l">${esc(L('Couleur', 'Colour'))}</span>
              ${COLORS.map((c, i) => `<button type="button" class="col${i ? '' : ' sel'}" data-col="${c[0]}" style="background:${c[0]}" title="${esc(c[1])}" aria-label="${esc(c[1])}"></button>`).join('')}
              <label class="cust" title="${esc(L('Autre couleur…', 'Other colour…'))}"><input type="color" class="cust" value="#1b1b1f" aria-label="${esc(L('Autre couleur', 'Other colour'))}">${svg('<path d="M8 3.5v9M3.5 8h9"/>', 12)}</label></div>
            <div class="rd-o" data-o="size"><span class="rd-l">${esc(L('Épaisseur', 'Size'))}</span><input type="range" class="rd-size" min="1" max="40" value="3" title="${esc(L('Épaisseur ( [ et ] )', 'Size ( [ and ] )'))}" aria-label="${esc(L('Épaisseur', 'Size'))}"><span class="rd-dot" title="${esc(L('Aperçu du trait', 'Stroke preview'))}"><b></b></span></div>
            <div class="rd-o" data-o="op"><span class="rd-l">${esc(L('Opacité', 'Opacity'))}</span><input type="range" class="rd-op" min="10" max="100" step="5" value="100" aria-label="${esc(L('Opacité', 'Opacity'))}"><span class="rd-v rd-op-v">100 %</span></div>
            <div class="rd-o" data-o="dash"><div class="rd-seg"><button type="button" data-dash="0" class="sel" title="${esc(L('Trait plein', 'Solid line'))}">${svg('<path d="M2 8h12"/>', 15)}</button><button type="button" data-dash="1" title="${esc(L('Pointillés (mouvement, hors champ…)', 'Dashed (movement, off-screen…)'))}">${svg('<path d="M2 8h2.6M6.7 8h2.6M11.4 8H14"/>', 15)}</button></div></div>
            <div class="rd-o" data-o="fill"><button type="button" class="rd-chip" data-a="fill" title="${esc(L('Remplir l’intérieur des rectangles et ellipses', 'Fill the inside of rectangles and ellipses'))}">${svg('<rect x="3" y="4" width="10" height="8" rx="1.2" fill="currentColor" fill-opacity=".35"/>', 14)}<span>${esc(L('Remplir', 'Fill'))}</span></button></div>
            <div class="rd-o rd-hint" data-o="pick">${esc(L('Clique sur le dessin pour prendre sa couleur.', 'Click the drawing to pick its colour.'))}</div>
          </div>
          <div class="rp-draw-cv"><canvas width="960" height="540"></canvas><canvas class="rd-ov" width="960" height="540"></canvas><div class="rp-draw-guides"></div>
            <div class="rp-crop-bar" hidden><span class="h">${esc(L('Glisse l’image pour la placer · molette pour zoomer', 'Drag the picture to place it · scroll to zoom'))}</span>
              <button type="button" data-crop="cover" title="${esc(L('L’image remplit tout le cadre', 'The picture fills the whole frame'))}">${esc(L('Remplir', 'Fill'))}</button>
              <button type="button" data-crop="contain" title="${esc(L('Toute l’image est visible', 'The whole picture is visible'))}">${esc(L('Image entière', 'Whole picture'))}</button>
              <button type="button" data-crop="out" title="${esc(L('Dézoomer', 'Zoom out'))}">${svg('<path d="M3.5 8h9"/>', 13)}</button>
              <input type="range" min="0" max="1000" value="500" aria-label="${esc(L('Zoom', 'Zoom'))}">
              <button type="button" data-crop="in" title="${esc(L('Zoomer', 'Zoom in'))}">${svg('<path d="M3.5 8h9M8 3.5v9"/>', 13)}</button>
              <button type="button" class="ok" data-crop="ok" title="${esc(L('Valider le cadrage (Entrée)', 'Apply the framing (Enter)'))}">${esc(L('OK', 'OK'))}</button></div></div>
        </div></div>
      <div class="rp-draw-act"><button type="button" class="btn btn-ghost" data-a="cancel">${esc(L('Annuler', 'Cancel'))}</button>
        <button type="button" class="btn btn-primary" data-a="save">${esc(L('Enregistrer le plan', 'Save the shot'))}</button></div></div>`;
    document.body.appendChild(bg);
    const cvw = bg.querySelector('.rp-draw-cv'), cv = bg.querySelector('canvas'), cx = cv.getContext('2d', { willReadFrequently:true });
    const ov = bg.querySelector('.rd-ov'), ox = ov.getContext('2d');
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, 960, 540);
    if(frame){
      const im = new Image();
      im.onload = () => { const k = Math.min(960 / im.naturalWidth, 540 / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k; cx.drawImage(im, (960 - w) / 2, (540 - h) / 2, w, h); origIm = im; };
      im.src = frame.src;
    }
    let color = COLORS[0][0], size = 3, tool = 'pen', fill = false, hist = [], fwd = [], last = null, prevMid = null, down = false, moved = false, start = null, base = null, txt = null, origIm = null, crop = null, lastCrop = null;
    let opac = 1, dash = false, path = null, prevTool = 'pen';
    const snap = () => { hist.push(cx.getImageData(0, 0, 960, 540)); if(hist.length > 30) hist.shift(); fwd.length = 0; };
    const pt = e => { const r = cv.getBoundingClientRect(); return { x:(e.clientX - r.left) * 960 / r.width, y:(e.clientY - r.top) * 540 / r.height, p:(e.pointerType === 'pen' && e.pressure) ? e.pressure : 0.5 }; };
    const style = (p, c) => { c = c || cx; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = tool === 'eraser' ? '#fff' : color; c.fillStyle = c.strokeStyle; c.lineWidth = (tool === 'eraser' ? size * 3 : tool === 'marker' ? size * 2.5 + 6 : size) * (p === 0.5 ? 1 : (0.5 + p)); c.setLineDash(dash && tool !== 'eraser' && tool !== 'marker' ? [c.lineWidth * 2.4 + 2, c.lineWidth * 2 + 4] : []); };
    const isShape = () => tool === 'line' || tool === 'arrow' || tool === 'rect' || tool === 'ellipse';
    /* trait sur un calque à part (marqueur, opacité < 100 %, pointillés) : posé d'un coup à la fin, sans surépaisseur aux jointures */
    const layered = () => tool === 'marker' || (tool !== 'eraser' && (opac < 1 || dash));
    const cursorFor = t => t === 'text' ? 'text' : t === 'bucket' ? BUCKET_CUR : t === 'picker' ? PICK_CUR : 'crosshair';
    function refreshOpts(){
      const show = (SHOW[tool] || '').split(' ');
      bg.querySelectorAll('.rd-o').forEach(o => { o.hidden = show.indexOf(o.dataset.o) < 0; });
      const dot = bg.querySelector('.rd-dot b'), w = Math.max(2, Math.min(24, tool === 'eraser' ? size * 3 : tool === 'marker' ? size * 2.5 + 6 : size));
      dot.style.width = dot.style.height = w + 'px';
      dot.style.background = tool === 'eraser' ? 'var(--surface)' : color; dot.style.opacity = tool === 'marker' ? .45 * opac : opac;
      dot.style.boxShadow = tool === 'eraser' || /^#f/i.test(color) ? 'inset 0 0 0 1px var(--hair)' : 'none';
    }
    function setTool(t){
      commitText(); cropEnd(true);
      if(t === 'picker' && tool !== 'picker') prevTool = tool;
      tool = t;
      bg.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('sel', x.dataset.tool === t));
      cv.style.cursor = cursorFor(t);
      refreshOpts();
    }
    function setColor(c, sw){
      color = c; if(tool === 'eraser' || tool === 'picker') setTool(tool === 'picker' ? (prevTool === 'eraser' ? 'pen' : prevTool) : 'pen');
      bg.querySelectorAll('[data-col]').forEach(x => x.classList.toggle('sel', sw ? x === sw : x.dataset.col.toLowerCase() === String(c).toLowerCase()));
      const ci = bg.querySelector('input.cust'); if(/^#[0-9a-f]{6}$/i.test(c)) ci.value = c;
      const lab = bg.querySelector('label.cust'), hit = !!bg.querySelector('[data-col].sel');
      lab.classList.toggle('sel', !hit); lab.style.background = hit ? '' : c;
      refreshOpts();
    }
    function setSize(v){ size = Math.max(1, Math.min(40, Math.round(v))); const r = bg.querySelector('.rd-size'); r.value = size; r.title = L('Épaisseur : ', 'Size: ') + size + ' ( [ ]  )'; refreshOpts(); }
    function drawShape(a, b, shift, c){
      c = c || cx;
      style(0.5, c); c.beginPath();
      let x2 = b.x, y2 = b.y;
      if(shift){
        if(tool === 'line' || tool === 'arrow'){ const dx = b.x - a.x, dy = b.y - a.y, ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), d = Math.hypot(dx, dy); x2 = a.x + Math.cos(ang) * d; y2 = a.y + Math.sin(ang) * d; }
        else { const m = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)); x2 = a.x + (b.x < a.x ? -m : m); y2 = a.y + (b.y < a.y ? -m : m); }
      }
      if(tool === 'line' || tool === 'arrow'){
        c.moveTo(a.x, a.y); c.lineTo(x2, y2); c.stroke();
        if(tool === 'arrow'){
          const ang = Math.atan2(y2 - a.y, x2 - a.x), hl = Math.max(14, c.lineWidth * 4);
          c.setLineDash([]);
          c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - hl * Math.cos(ang - 0.45), y2 - hl * Math.sin(ang - 0.45));
          c.moveTo(x2, y2); c.lineTo(x2 - hl * Math.cos(ang + 0.45), y2 - hl * Math.sin(ang + 0.45)); c.stroke();
        }
      } else if(tool === 'rect'){
        c.rect(Math.min(a.x, x2), Math.min(a.y, y2), Math.abs(x2 - a.x), Math.abs(y2 - a.y)); if(fill) c.fill(); c.stroke();
      } else {
        c.ellipse((a.x + x2) / 2, (a.y + y2) / 2, Math.max(0.5, Math.abs(x2 - a.x) / 2), Math.max(0.5, Math.abs(y2 - a.y) / 2), 0, 0, Math.PI * 2); if(fill) c.fill(); c.stroke();
      }
      c.setLineDash([]);
    }
    /* pose le calque sur le dessin (opacité, et mélange « marqueur » qui fonce sans couvrir) */
    function flushLayer(){
      cx.save(); cx.globalAlpha = tool === 'marker' ? 0.42 * opac : opac; if(tool === 'marker') cx.globalCompositeOperation = 'multiply';
      cx.drawImage(ov, 0, 0); cx.restore(); ox.clearRect(0, 0, 960, 540);
    }
    function drawPath(pts){
      ox.clearRect(0, 0, 960, 540); style(0.5, ox);
      if(pts.length < 2){ ox.beginPath(); ox.arc(pts[0].x, pts[0].y, ox.lineWidth / 2, 0, Math.PI * 2); ox.fill(); return; }
      ox.beginPath(); ox.moveTo(pts[0].x, pts[0].y);
      for(let i = 1; i < pts.length - 1; i++){ const m = { x:(pts[i].x + pts[i + 1].x) / 2, y:(pts[i].y + pts[i + 1].y) / 2 }; ox.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y); }
      const l = pts[pts.length - 1]; ox.lineTo(l.x, l.y); ox.stroke();
    }
    /* seau de peinture : colorie la zone de couleur proche autour du point cliqué (un trait fermé = une zone ;
       cliquer sur le fond colorie tout le fond). La zone déborde d'un pixel sous les bords adoucis des traits,
       pour ne pas laisser de liseré blanc. */
    function bucketAt(p){
      const W = 960, H = 540, x0 = Math.max(0, Math.min(W - 1, Math.floor(p.x))), y0 = Math.max(0, Math.min(H - 1, Math.floor(p.y)));
      const img = cx.getImageData(0, 0, W, H), d = img.data, px = new Uint32Array(d.buffer);
      const probe = document.createElement('canvas').getContext('2d'); probe.fillStyle = color; probe.fillRect(0, 0, 1, 1);
      const c = probe.getImageData(0, 0, 1, 1).data;                          // couleur choisie → RGB (tout format CSS)
      const i0 = (y0 * W + x0) * 4, sr = d[i0], sg = d[i0 + 1], sb = d[i0 + 2];
      if(Math.abs(sr - c[0]) < 3 && Math.abs(sg - c[1]) < 3 && Math.abs(sb - c[2]) < 3) return;   // déjà de cette couleur
      const TOL = 48, near = i => Math.abs(d[i] - sr) <= TOL && Math.abs(d[i + 1] - sg) <= TOL && Math.abs(d[i + 2] - sb) <= TOL;
      const mask = new Uint8Array(W * H), stack = [x0, y0];
      while(stack.length){
        const y = stack.pop(); let x = stack.pop();
        while(x >= 0 && !mask[y * W + x] && near((y * W + x) * 4)) x--;
        x++;
        let up = false, dn = false;
        while(x < W && !mask[y * W + x] && near((y * W + x) * 4)){
          mask[y * W + x] = 1;
          if(y > 0){ const a = !mask[(y - 1) * W + x] && near(((y - 1) * W + x) * 4); if(a && !up){ stack.push(x, y - 1); up = true; } else if(!a) up = false; }
          if(y < H - 1){ const b = !mask[(y + 1) * W + x] && near(((y + 1) * W + x) * 4); if(b && !dn){ stack.push(x, y + 1); dn = true; } else if(!b) dn = false; }
          x++;
        }
      }
      snap();
      const val = new Uint32Array(new Uint8ClampedArray([c[0], c[1], c[2], 255]).buffer)[0];
      for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
        const k = y * W + x;
        if(mask[k] || (x > 0 && mask[k - 1] === 1) || (x < W - 1 && mask[k + 1] === 1) || (y > 0 && mask[k - W] === 1) || (y < H - 1 && mask[k + W] === 1)) px[k] = val;
      }
      cx.putImageData(img, 0, 0);
    }
    function pickAt(p){
      const d = cx.getImageData(Math.max(0, Math.min(959, Math.floor(p.x))), Math.max(0, Math.min(539, Math.floor(p.y))), 1, 1).data;
      setColor('#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''));
    }
    function mirror(){
      commitText(); cropEnd(true); snap();
      const t = document.createElement('canvas'); t.width = 960; t.height = 540; t.getContext('2d').drawImage(cv, 0, 0);
      cx.save(); cx.setTransform(-1, 0, 0, 1, 960, 0); cx.drawImage(t, 0, 0); cx.restore();
      lastCrop = null;
    }
    /* cadrer : l'image (celle d'origine si rien n'a encore été dessiné, sinon le dessin actuel) se déplace
       et se zoome dans le cadre 16:9 ; ce qu'on voit est exactement ce qui sera enregistré et exporté. */
    const cropBar = bg.querySelector('.rp-crop-bar'), cropRange = cropBar.querySelector('input');
    function cropStart(){
      if(crop) return;
      commitText();
      let src = null, sw = 960, sh = 540, s = 1, ox0 = 0, oy0 = 0;
      if(origIm && (!hist.length || (lastCrop && lastCrop.h === hist.length))){     // rien dessiné depuis : on repart de l'image d'origine, nette
        src = origIm; sw = origIm.naturalWidth; sh = origIm.naturalHeight;
        if(hist.length){ s = lastCrop.s; ox0 = lastCrop.ox; oy0 = lastCrop.oy; }
        else { s = Math.min(960 / sw, 540 / sh); ox0 = (960 - sw * s) / 2; oy0 = (540 - sh * s) / 2; }
      } else { src = document.createElement('canvas'); src.width = 960; src.height = 540; src.getContext('2d').drawImage(cv, 0, 0); }
      snap();
      const guides = bg.querySelector('.rp-draw-guides');
      crop = { src, sw, sh, s, ox:ox0, oy:oy0, min:Math.min(960 / sw, 540 / sh) * 0.5, max:Math.max(960 / sw, 540 / sh) * 4, drag:null, guides:guides.classList.contains('on') };
      guides.classList.add('on');
      cropBar.hidden = false; cv.style.cursor = 'grab';
      bg.querySelector('[data-a="crop"]').classList.add('sel');
      cropDraw();
    }
    function cropDraw(){
      const c = crop; cx.fillStyle = '#fff'; cx.fillRect(0, 0, 960, 540);
      cx.imageSmoothingQuality = 'high'; cx.drawImage(c.src, c.ox, c.oy, c.sw * c.s, c.sh * c.s);
      cropRange.value = Math.round(Math.log(c.s / c.min) / Math.log(c.max / c.min) * 1000);
    }
    function cropZoom(ns, fx, fy){
      const c = crop; ns = Math.max(c.min, Math.min(c.max, ns));
      if(fx == null){ fx = 480; fy = 270; }
      c.ox = fx - (fx - c.ox) * ns / c.s; c.oy = fy - (fy - c.oy) * ns / c.s; c.s = ns;
      cropDraw();
    }
    function cropFit(mode){
      const c = crop, s = mode === 'cover' ? Math.max(960 / c.sw, 540 / c.sh) : Math.min(960 / c.sw, 540 / c.sh);
      c.s = s; c.ox = (960 - c.sw * s) / 2; c.oy = (540 - c.sh * s) / 2; cropDraw();
    }
    /* aimant doux : les bords et le centre de l'image s'alignent sur ceux du cadre quand on en approche */
    function cropSnap(v, sz, full){
      const T = 10, cand = [0, full - sz, (full - sz) / 2];
      for(const t of cand) if(Math.abs(v - t) < T) return t;
      return v;
    }
    function cropEnd(keep){
      if(!crop) return;
      const c = crop; crop = null;
      if(!keep){ const h = hist.pop(); if(h) cx.putImageData(h, 0, 0); }
      else if(c.src === origIm) lastCrop = { s:c.s, ox:c.ox, oy:c.oy, h:hist.length };
      cropBar.hidden = true;
      if(!c.guides) bg.querySelector('.rp-draw-guides').classList.remove('on');
      bg.querySelector('[data-a="crop"]').classList.remove('sel');
      cv.style.cursor = cursorFor(tool);
    }
    cv.addEventListener('wheel', e => {
      if(!crop) return; e.preventDefault();
      const r = cv.getBoundingClientRect(), fx = (e.clientX - r.left) * 960 / r.width, fy = (e.clientY - r.top) * 540 / r.height;
      cropZoom(crop.s * Math.exp(-e.deltaY * 0.0015), fx, fy);
    }, { passive:false });
    cropRange.addEventListener('input', () => { if(crop) cropZoom(crop.min * Math.pow(crop.max / crop.min, cropRange.value / 1000)); });
    cropBar.addEventListener('mousedown', e => { if(e.target.closest('button')) e.preventDefault(); });   // Entrée reste « valider » après un clic
    cropBar.addEventListener('click', e => {
      const b = e.target.closest('[data-crop]'); if(!b || !crop) return;
      const k = b.dataset.crop;
      if(k === 'ok') cropEnd(true);
      else if(k === 'cover' || k === 'contain') cropFit(k);
      else cropZoom(crop.s * (k === 'in' ? 1.2 : 1 / 1.2));
    });
    /* texte : un champ posé sur le dessin, validé par Entrée ou en cliquant ailleurs */
    function textAt(p){
      const fpx = Math.round(size * 2.2 + 14), r = cv.getBoundingClientRect(), k = r.width / 960;
      const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'rp-draw-txt'; inp.maxLength = 120;
      inp.placeholder = L('Texte…', 'Text…');
      inp.style.left = Math.round(p.x * k) + 'px'; inp.style.top = Math.round(p.y * k) + 'px';
      inp.style.width = Math.max(120, Math.round(r.width - p.x * k - 6)) + 'px';
      inp.style.font = '600 ' + (fpx * k) + 'px/1.2 ' + FF; inp.style.color = color; inp.style.opacity = opac;
      cvw.appendChild(inp); txt = { el:inp, x:p.x, y:p.y, f:fpx, c:color, o:opac };
      inp.addEventListener('blur', commitText);
      setTimeout(() => inp.focus(), 0);
    }
    function commitText(){
      if(!txt) return; const t = txt; txt = null;
      const v = t.el.value; t.el.remove();
      if(!v.trim()) return;
      snap(); cx.save(); cx.globalAlpha = t.o; cx.font = '600 ' + t.f + 'px ' + FF; cx.textBaseline = 'top'; cx.fillStyle = t.c; cx.fillText(v, t.x, t.y + t.f * 0.1); cx.restore();
    }
    cv.addEventListener('pointerdown', e => {
      e.preventDefault(); commitText(); try{ cv.setPointerCapture(e.pointerId); }catch(err){}
      const p = pt(e);
      if(crop){ crop.drag = { x:p.x, y:p.y, ox:crop.ox, oy:crop.oy }; cv.style.cursor = 'grabbing'; return; }
      if(tool === 'text'){ textAt(p); return; }
      if(tool === 'bucket'){ bucketAt(p); return; }
      if(tool === 'picker'){ pickAt(p); return; }
      snap(); down = true; moved = false; last = p; prevMid = p;
      if(isShape()){ start = p; base = hist[hist.length - 1]; }
      else if(layered()){ start = null; path = [p]; drawPath(path); }
      else { start = null; path = null; style(p.p); }
    });
    cv.addEventListener('pointermove', e => {
      if(crop && crop.drag){
        e.preventDefault(); const p = pt(e), c = crop, w = c.sw * c.s, h = c.sh * c.s;
        c.ox = cropSnap(c.drag.ox + p.x - c.drag.x, w, 960); c.oy = cropSnap(c.drag.oy + p.y - c.drag.y, h, 540); cropDraw(); return;
      }
      if(!down) return; e.preventDefault(); moved = true;
      const p = pt(e);
      if(start){
        if(opac < 1){ cx.putImageData(base, 0, 0); ox.clearRect(0, 0, 960, 540); drawShape(start, p, e.shiftKey, ox); cx.save(); cx.globalAlpha = opac; cx.drawImage(ov, 0, 0); cx.restore(); ox.clearRect(0, 0, 960, 540); }
        else { cx.putImageData(base, 0, 0); drawShape(start, p, e.shiftKey); }
        last = p; return;
      }
      if(path){ path.push(p); drawPath(path); last = p; return; }
      const mid = { x:(last.x + p.x) / 2, y:(last.y + p.y) / 2 };
      style(p.p); cx.beginPath(); cx.moveTo(prevMid.x, prevMid.y); cx.quadraticCurveTo(last.x, last.y, mid.x, mid.y); cx.stroke();
      prevMid = mid; last = p;
    });
    const end = () => {
      if(crop && crop.drag){ crop.drag = null; cv.style.cursor = 'grab'; return; }
      if(!down) return; down = false;
      if(start){ if(!moved) hist.pop(); start = null; base = null; return; }     // forme : déjà tracée pendant le glissement
      if(path){ flushLayer(); path = null; return; }
      if(!moved){ cx.beginPath(); cx.arc(last.x, last.y, cx.lineWidth / 2, 0, Math.PI * 2); cx.fill(); }
      else { cx.beginPath(); cx.moveTo(prevMid.x, prevMid.y); cx.lineTo(last.x, last.y); cx.stroke(); }
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    const undo = () => { const h = hist.pop(); if(h){ fwd.push(cx.getImageData(0, 0, 960, 540)); cx.putImageData(h, 0, 0); } };
    const redo = () => { const h = fwd.pop(); if(h){ hist.push(cx.getImageData(0, 0, 960, 540)); cx.putImageData(h, 0, 0); } };
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey, true); };
    function onKey(e){
      if(txt && e.target === txt.el){
        if(e.key === 'Enter'){ e.preventDefault(); commitText(); }
        else if(e.key === 'Escape'){ e.preventDefault(); const t = txt; txt = null; t.el.remove(); }
        e.stopPropagation(); return;
      }
      if(crop && (e.key === 'Escape' || e.key === 'Enter') && !(e.target && e.target.tagName === 'BUTTON' && e.key === 'Enter')){ e.preventDefault(); e.stopPropagation(); cropEnd(e.key === 'Enter'); return; }
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(); return; }
      const mod = e.ctrlKey || e.metaKey, k = (e.key || '').toLowerCase(), inField = e.target && (e.target.type === 'color' || e.target.type === 'range');
      if(crop && mod && k === 'z'){ e.preventDefault(); e.stopPropagation(); cropEnd(false); return; }
      if(!mod && !e.altKey && k === 'c' && !inField){ e.preventDefault(); e.stopPropagation(); if(crop) cropEnd(true); else cropStart(); return; }
      if(mod && !e.shiftKey && k === 'z'){ e.preventDefault(); e.stopPropagation(); commitText(); undo(); return; }
      if(mod && (k === 'y' || (k === 'z' && e.shiftKey))){ e.preventDefault(); e.stopPropagation(); redo(); return; }
      if(!mod && !e.altKey && (e.key === '[' || e.key === ']')){ e.preventDefault(); e.stopPropagation(); setSize(size + (e.key === ']' ? (size < 10 ? 1 : 3) : (size <= 10 ? -1 : -3))); return; }
      if(!mod && !e.altKey && KEYS[k] && !(e.target && e.target.type === 'color')){ e.preventDefault(); setTool(KEYS[k]); }
      e.stopPropagation();
    }
    document.addEventListener('keydown', onKey, true);
    bg.addEventListener('mousedown', e => { bg._d = e.target === bg; });
    bg.addEventListener('input', e => {
      const t = e.target;
      if(t.matches && t.matches('input[type="color"]')){ setColor(t.value); return; }
      if(t.classList.contains('rd-size')){ setSize(+t.value); return; }
      if(t.classList.contains('rd-op')){ opac = (+t.value) / 100; bg.querySelector('.rd-op-v').textContent = t.value + ' %'; refreshOpts(); }
    });
    bg.addEventListener('click', e => {
      if(e.target === bg && bg._d){ close(); return; }
      const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.col) setColor(b.dataset.col, b);
      else if(b.dataset.tool) setTool(b.dataset.tool);
      else if(b.dataset.dash != null){ dash = b.dataset.dash === '1'; bg.querySelectorAll('[data-dash]').forEach(x => x.classList.toggle('sel', x === b)); }
      else if(b.dataset.a === 'fill'){ fill = !fill; b.classList.toggle('sel', fill); b.setAttribute('aria-pressed', fill ? 'true' : 'false'); }
      else if(b.dataset.a === 'crop'){ if(crop) cropEnd(true); else cropStart(); }
      else if(b.dataset.a === 'mirror') mirror();
      else if(b.dataset.a === 'guides'){ const g = bg.querySelector('.rp-draw-guides'); g.classList.toggle('on'); b.classList.toggle('sel', g.classList.contains('on')); if(crop) crop.guides = g.classList.contains('on'); }
      else if(b.dataset.a === 'undo'){ commitText(); if(crop) cropEnd(false); else undo(); }
      else if(b.dataset.a === 'redo'){ cropEnd(true); redo(); }
      else if(b.dataset.a === 'clear'){ commitText(); cropEnd(true); snap(); cx.fillStyle = '#fff'; cx.fillRect(0, 0, 960, 540); }
      else if(b.dataset.a === 'cancel') close();
      else if(b.dataset.a === 'save'){
        commitText(); cropEnd(true);
        const kind = frame ? frame.k : 'draw';
        const src = kind === 'img' ? cv.toDataURL('image/jpeg', 0.85) : cv.toDataURL('image/png');
        if(frame){ frame.src = src; } else store().frames.push(Object.assign({ id:uid(), pg:page, k:'draw', src, cap:'' }, sc ? { sc:sc } : {}, sq ? { sq:sq } : {}));
        close(); save(); sbChanged();
      }
    });
    refreshOpts();
  }

  /* ---- événements de la colonne (délégation) ---- */
  const laneOf = el => { const l = el.closest('.rp-sb-lane'); return l ? parseInt(l.dataset.p, 10) : 1; };
  const scOfEl = el => { const h = el.closest('.rp-sb-sh'); return h ? h.dataset.sc : ''; };
  const frameOf = el => { const f = el.closest('.rp-sb-f'); return f ? store().frames.find(x => x.id === f.dataset.id) : null; };
  function menu(btn, page, sc){
    const o = document.querySelector('.rp-sb-menu'); if(o) o.remove();
    const m = document.createElement('div'); m.className = 'rp-sb-menu rp-ui';
    m.innerHTML = `<button type="button" data-m="up">${svg('<path d="M8 11V3M5 6l3-3 3 3M3 13h10"/>', 14)} ${esc(L('Importer une image…', 'Import an image…'))}</button>
      <button type="button" data-m="draw">${svg('<path d="M3 13l.7-3L10.8 3a1.4 1.4 0 0 1 2 2L5.7 12.2 3 13z"/>', 14)} ${esc(L('Dessiner un plan…', 'Draw a shot…'))}</button>
      <button type="button" data-m="paste">${svg('<rect x="4" y="3.5" width="8" height="9.5" rx="1.4"/><path d="M6.5 3.5V2.5h3v1"/>', 14)} ${esc(L('Coller l\u2019image copiée', 'Paste copied image'))}</button>`;
    const r = btn.getBoundingClientRect();
    m.style.top = Math.round(Math.max(8, Math.min(window.innerHeight - 150, r.bottom + 6))) + 'px'; m.style.left = Math.round(Math.max(8, Math.min(window.innerWidth - 210, r.right - 200))) + 'px';
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-m]'); if(!b) return; m.remove();
      if(b.dataset.m === 'up') pickFile(page, sc); else if(b.dataset.m === 'draw') drawOpen(page, undefined, sc); else pasteImage(page, sc);
    });
    document.body.appendChild(m);
    setTimeout(() => document.addEventListener('click', function off(e){ if(!m.contains(e.target)) { m.remove(); } document.removeEventListener('click', off, true); }, true), 0);
  }
  document.addEventListener('click', e => {
    const root = $('rpSb'); if(!root || !root.contains(e.target)) return;
    const a = e.target.closest('[data-a]'), add = e.target.closest('.rp-sb-add');
    if(add){ e.stopPropagation(); menu(add, laneOf(add), scOfEl(add)); return; }
    if(a){
      const act = a.dataset.a;
      if(act === 'close') sbToggle(false);
      else if(act === 'upload') pickFile(laneOf(a));
      else if(act === 'draw') drawOpen(laneOf(a));
      else if(act === 'edit'){ const f = frameOf(a); if(f) drawOpen(f.pg, f); }
      else if(act === 'del'){ const f = frameOf(a); if(f) delFrame(f.id); }
      return;
    }
    const img = e.target.closest('.rp-sb-img');
    if(img){ const f = frameOf(img); if(f) lightbox(f.src); }
  });
  document.addEventListener('input', e => {
    if(!e.target.classList || !e.target.classList.contains('rp-sb-cap')) return;
    const f = frameOf(e.target); if(f){ f.cap = e.target.value; save(); }
  });
  /* glisser-déposer : réordonner ou déposer un fichier image sur une page */
  let dragId = null;
  document.addEventListener('dragstart', e => {
    const im = e.target.closest && e.target.closest('#rpSb .rp-sb-img'); if(!im) return;
    const f = frameOf(im); if(!f) return; dragId = f.id;
    try{ e.dataTransfer.setData('text/plain', 'rpsb:' + f.id); e.dataTransfer.effectAllowed = 'move'; }catch(err){}
    im.closest('.rp-sb-f').classList.add('dragging');
  });
  document.addEventListener('dragend', () => {
    dragId = null; document.querySelectorAll('#rpSb .dragging, #rpSb .over, #rpSb .drop').forEach(x => x.classList.remove('dragging', 'over', 'drop'));
  });
  document.addEventListener('dragover', e => {
    const root = $('rpSb'); if(!root || !root.contains(e.target)) return;
    const hasFile = e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0;
    if(!dragId && !hasFile) return;
    e.preventDefault();
    root.querySelectorAll('.over, .drop').forEach(x => x.classList.remove('over', 'drop'));
    const f = e.target.closest('.rp-sb-f'), l = e.target.closest('.rp-sb-lane');
    if(f && dragId) f.classList.add('over'); else if(l) l.classList.add('drop');
  });
  document.addEventListener('drop', e => {
    const root = $('rpSb'); if(!root || !root.contains(e.target)) return;
    const lane = e.target.closest('.rp-sb-lane'); if(!lane) return;
    const page = parseInt(lane.dataset.p, 10) || 1;
    if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length){ e.preventDefault(); addFiles(e.dataTransfer.files, page); return; }
    if(!dragId) return; e.preventDefault();
    const arr = store().frames, mv = arr.find(x => x.id === dragId); if(!mv) return;
    const tEl = e.target.closest('.rp-sb-f'), tf = tEl && tEl.dataset.id !== dragId ? arr.find(x => x.id === tEl.dataset.id) : null;
    let after = false;
    if(tEl && tf){ const r = tEl.querySelector('.rp-sb-img').getBoundingClientRect(); after = e.clientY > r.top + r.height / 2; }
    arr.splice(arr.indexOf(mv), 1);
    const shEl = e.target.closest('.rp-sb-sh');
    if(tf){ arr.splice(arr.indexOf(tf) + (after ? 1 : 0), 0, mv); mv.pg = tf.pg; if(tEl.dataset.sc) mv.sc = tEl.dataset.sc; else delete mv.sc; }
    else { mv.pg = page; arr.push(mv); if(shEl && shEl.dataset.sc) mv.sc = shEl.dataset.sc; }
    dragId = null; save(); sbRender();
  });
  /* coller une image avec Ctrl/Cmd+V en survolant une page de la colonne */
  let hoverPage = 0;
  document.addEventListener('mousemove', e => {
    const l = e.target.closest && e.target.closest('#rpSb .rp-sb-lane'); hoverPage = l ? parseInt(l.dataset.p, 10) : 0;
  });
  document.addEventListener('paste', e => {
    if(!hoverPage || !$('rpSb')) return;
    const files = Array.from((e.clipboardData && e.clipboardData.files) || []).filter(f => /^image\//.test(f.type));
    if(files.length){ e.preventDefault(); addFiles(files, hoverPage); }
  }, true);
  /* la molette au-dessus de la colonne fait défiler le scénario (sauf dans une page pleine) */
  document.addEventListener('wheel', e => {
    const root = $('rpSb'); if(!root || !root.contains(e.target)) return;
    const fl = e.target.closest('.rp-sb-fl');
    if(fl && fl.scrollHeight > fl.clientHeight + 1) return;
    const cp = $('centerPane'); if(cp){ e.preventDefault(); cp.scrollTop += e.deltaY; }
  }, { passive:false, capture:true });
  document.addEventListener('scroll', e => { if(e.target && e.target.id === 'centerPane') sbPlace(); }, true);

  Object.assign(ACTIONS, { rpSbToggle: () => sbToggle() });
  document.addEventListener('keydown', e => {
    if(!(S && S.view === 'editor' && S.project) || document.getElementById('rpDrawBg')) return;
    if((e.ctrlKey || e.metaKey) && e.altKey && !e.shiftKey && e.code === 'KeyB'){ e.preventDefault(); e.stopPropagation(); sbToggle(); }
  }, true);

  /* =====================================================================
     v89 — TÉLÉCHARGER LES PLANS (PNG / PDF) · PASSER D'UNE PAGE À L'AUTRE
     ---------------------------------------------------------------------
     Bloc ajouté sans toucher au reste du storyboard.
     • Chaque plan peut être coché (rond en bas à gauche de l'image) ; le bouton « Télécharger »
       de l'en-tête (ou la flèche sur un plan) ouvre une fenêtre : un plan, les plans cochés,
       une scène entière, une page, ou tout le storyboard — en PNG ou en PDF.
       Plusieurs PNG sont réunis dans un seul fichier ZIP (écrit ici, sans bibliothèque) ;
       le PDF est une planche de plans avec numéro, page et légende (jsPDF, déjà utilisé par
       l'export du scénario).
     • Passer d'une page à l'autre : cliquer sur « Page N » défile le scénario jusqu'à cette page ;
       un plan se déplace vers n'importe quelle page par un menu (sans avoir à le glisser sur
       tout l'écran) avec retour en arrière possible ; et glisser un plan près du haut ou du bas
       de la colonne fait défiler le scénario tout seul.
  ===================================================================== */
  const stDl = document.createElement('style'); stDl.id = 'rpV89Style';
  stDl.textContent = `
  .rp-sb-chk{position:absolute; bottom:7px; left:7px; width:22px; height:22px; display:grid; place-items:center; padding:0; border:1.5px solid rgba(255,255,255,.92);
    border-radius:50%; background:rgba(15,17,21,.55); color:transparent; cursor:pointer; opacity:0; transition:opacity .14s ease, background .14s ease, border-color .14s ease;}
  .rp-sb-img:hover .rp-sb-chk, .rp-sb-img:focus-within .rp-sb-chk, .rp-sb-f.sel .rp-sb-chk{opacity:1;}
  .rp-sb-chk:hover{background:rgba(15,17,21,.8);}
  .rp-sb-f.sel .rp-sb-chk{background:var(--accent); border-color:var(--accent); color:#fff;}
  .rp-sb-f.sel .rp-sb-img{outline:2px solid var(--accent); outline-offset:2px;}
  .rp-sb-f.flash .rp-sb-img{animation:rpSbFlash 1.2s ease;}
  @keyframes rpSbFlash{0%,55%{box-shadow:0 0 0 4px var(--accent);} 100%{box-shadow:var(--shadow-sm);}}
  @media (hover:none){ .rp-sb-chk{opacity:1;} }
  .rp-sb-pg{cursor:pointer; border-radius:6px; transition:color .14s ease;}
  .rp-sb-pg:hover{color:var(--accent);}
  .rp-sb-head em[data-a]{cursor:pointer; color:var(--accent); font-weight:600;}
  .rp-sb-head em[data-a]:hover{text-decoration:underline;}
  .rp-sb-pgmenu{position:fixed; z-index:140; width:228px; padding:10px; border-radius:12px; background:var(--surface); border:1px solid var(--hair); box-shadow:var(--shadow-md); font-family:var(--sans); animation:rpPop .14s ease;}
  .rp-sb-pgmenu h4{margin:0 0 8px; font-size:11px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--ink-soft);}
  .rp-sb-pgmenu .g{display:grid; grid-template-columns:repeat(6,1fr); gap:4px; max-height:184px; overflow-y:auto;}
  .rp-sb-pgmenu button{height:30px; border:1px solid var(--hair); border-radius:8px; background:var(--surface); color:var(--ink); font:inherit; font-size:12.5px; font-variant-numeric:tabular-nums; cursor:pointer; padding:0;}
  .rp-sb-pgmenu button:hover{border-color:var(--accent); color:var(--accent);}
  .rp-sb-pgmenu button.cur{background:var(--hair); color:var(--ink-soft); border-color:transparent; cursor:default;}
  .rp-dl-sec{margin:16px 0 8px; font-size:11px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--ink-soft);}
  .rp-dl-sec:first-of-type{margin-top:4px;}
  .rp-dl-opt{display:flex; align-items:center; gap:10px; padding:9px 11px; margin-bottom:6px; border:1px solid var(--hair); border-radius:10px; background:var(--surface); color:var(--ink); font-size:13.5px; cursor:pointer;}
  .rp-dl-opt:hover{border-color:var(--accent);}
  .rp-dl-opt.sel{border-color:var(--accent); background:rgba(54,153,212,.08); box-shadow:0 0 0 2px rgba(54,153,212,.18);}
  .rp-dl-opt.off{opacity:.5; cursor:not-allowed;}
  .rp-dl-opt.off:hover{border-color:var(--hair);}
  .rp-dl-opt input[type=radio]{margin:0; accent-color:var(--accent); flex:none;}
  .rp-dl-opt .t{flex:1; min-width:0;}
  .rp-dl-opt small{display:block; margin-top:1px; font-size:12px; color:var(--ink-soft);}
  .rp-dl-opt select, .rp-dl-extra select{height:32px; max-width:190px; padding:0 6px; border:1px solid var(--hair); border-radius:8px; background:var(--surface); color:var(--ink); font:inherit; font-size:13px;}
  .rp-dl-seg{display:flex; gap:8px;}
  .rp-dl-seg button{flex:1; height:38px; border:1px solid var(--hair); border-radius:10px; background:var(--surface); color:var(--ink); font:inherit; font-size:13.5px; font-weight:600; cursor:pointer;}
  .rp-dl-seg button:hover{border-color:var(--accent);}
  .rp-dl-seg button.sel{border-color:var(--accent); background:rgba(54,153,212,.08); box-shadow:0 0 0 2px rgba(54,153,212,.18);}
  .rp-dl-extra{display:flex; align-items:center; gap:10px; margin-top:10px; font-size:13px; color:var(--ink);}
  .rp-dl-extra[hidden]{display:none;}
  .rp-dl-extra label{display:flex; align-items:center; gap:8px; cursor:pointer;}
  .rp-dl-extra input[type=checkbox]{accent-color:var(--accent);}
  .rp-dl-sum{margin-top:14px; min-height:18px; font-size:13px; color:var(--ink-soft);}
  `;
  document.head.appendChild(stDl);

  /* =====================================================================
     v90 — STORYBOARD RANGÉ PAR SCÈNE · DESSIN PLUS COMPLET · POP-UP « PLAN SUPPRIMÉ »
     ---------------------------------------------------------------------
     • Dans chaque page, les plans sont rangés sous l'entête de leur scène (numéro + titre) ; une scène
       qui continue d'une page à l'autre reprend son entête avec « suite ». Chaque entête a son « + », se
       clique pour aller à la scène, et reçoit les plans qu'on y glisse. Un plan se déplace aussi vers une
       scène par le menu de la flèche haut/bas. « Une scène » du téléchargement = les plans de cette scène.
     • Dessin : crayon, ligne, flèche, rectangle, ellipse (remplissage au choix), texte, gomme, couleur libre,
       4 épaisseurs, rétablir (Ctrl+Y), repères de cadrage (tiers) non enregistrés, raccourcis B L A R O T E.
     • La pop-up « Plan supprimé » dure 4 s et apparaît sans se décaler.
  ===================================================================== */
  const stV90 = document.createElement('style'); stV90.id = 'rpV90Style';
  stV90.textContent = `
  .rp-sb-sh{flex:none; display:flex; align-items:center; gap:7px; min-height:26px; padding:2px 4px 2px 8px; border-radius:7px; border-left:3px solid var(--accent);
    background:color-mix(in srgb, var(--accent) 9%, transparent); font-size:11px; color:var(--ink);}
  .rp-sb-sh .n{font-weight:700; color:var(--accent); font-variant-numeric:tabular-nums;}
  .rp-sb-sh .n:empty{display:none;}
  .rp-sb-sh .t{flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:700; letter-spacing:.02em; text-transform:uppercase; cursor:pointer; transition:color .14s ease;}
  .rp-sb-sh .t:hover{color:var(--accent);}
  .rp-sb-sh em{flex:none; font-style:normal; font-size:10.5px; font-weight:600; color:var(--ink-soft);}
  .rp-sb-sh .rp-sb-add{flex:none; width:20px; height:20px;}
  .rp-sb-sh.over{outline:2px solid var(--accent); outline-offset:1px;}
  .rp-sb-pgmenu .s{display:flex; flex-direction:column; gap:3px; max-height:150px; overflow-y:auto;}
  .rp-sb-pgmenu .s button{height:auto; min-height:28px; padding:4px 8px; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
  .rp-draw-bar input[type="color"].cust{width:24px; height:24px; padding:0; border:1px solid var(--hair); border-radius:50%; background:none; cursor:pointer; overflow:hidden;}
  .rp-draw-bar input[type="color"].cust::-webkit-color-swatch-wrapper{padding:0;}
  .rp-draw-bar input[type="color"].cust::-webkit-color-swatch{border:0; border-radius:50%;}
  .rp-draw-bar input[type="color"].cust::-moz-color-swatch{border:0; border-radius:50%;}
  .rp-draw-cv{position:relative;}
  .rp-draw-guides{position:absolute; inset:0; display:none; pointer-events:none; border-radius:10px;
    background-image:linear-gradient(90deg, transparent calc(33.333% - .5px), rgba(54,153,212,.6) calc(33.333% - .5px), rgba(54,153,212,.6) calc(33.333% + .5px), transparent calc(33.333% + .5px)),
      linear-gradient(90deg, transparent calc(66.666% - .5px), rgba(54,153,212,.6) calc(66.666% - .5px), rgba(54,153,212,.6) calc(66.666% + .5px), transparent calc(66.666% + .5px)),
      linear-gradient(180deg, transparent calc(33.333% - .5px), rgba(54,153,212,.6) calc(33.333% - .5px), rgba(54,153,212,.6) calc(33.333% + .5px), transparent calc(33.333% + .5px)),
      linear-gradient(180deg, transparent calc(66.666% - .5px), rgba(54,153,212,.6) calc(66.666% - .5px), rgba(54,153,212,.6) calc(66.666% + .5px), transparent calc(66.666% + .5px));}
  .rp-draw-guides.on{display:block;}
  .rp-draw-txt{position:absolute; z-index:2; box-sizing:border-box; padding:0 2px; margin:0; border:1px dashed var(--accent); border-radius:3px; background:rgba(255,255,255,.6); outline:none;}
  `;
  document.head.appendChild(stV90);
  /* v91 : seau de peinture et cadrage de l'image dans l'éditeur de dessin */
  const stV91 = document.createElement('style'); stV91.id = 'rpV91Style';
  stV91.textContent = `
  .rp-crop-bar{position:absolute; left:50%; bottom:12px; transform:translateX(-50%); z-index:3; display:flex; align-items:center; gap:6px; max-width:calc(100% - 24px); padding:6px 6px 6px 14px;
    border-radius:999px; background:var(--surface); color:var(--ink); border:1px solid var(--hair); box-shadow:var(--shadow-md); font-size:12.5px; white-space:nowrap; animation:rpCropIn .14s ease;}
  @keyframes rpCropIn{from{opacity:0;} to{opacity:1;}}
  .rp-crop-bar[hidden]{display:none;}
  .rp-crop-bar .h{color:var(--ink-soft); margin-right:4px; overflow:hidden; text-overflow:ellipsis; min-width:0;}
  .rp-crop-bar button{flex:none; height:28px; min-width:28px; display:inline-grid; place-items:center; padding:0 10px; border:1px solid var(--hair); border-radius:999px; background:var(--surface); color:var(--ink); font:inherit; font-size:12.5px; font-weight:600; cursor:pointer;}
  .rp-crop-bar button[data-crop="in"], .rp-crop-bar button[data-crop="out"]{padding:0; width:28px;}
  .rp-crop-bar button:hover{border-color:var(--accent); color:var(--accent);}
  .rp-crop-bar button.ok{background:var(--accent); border-color:var(--accent); color:#fff; padding:0 14px;}
  .rp-crop-bar button.ok:hover{color:#fff; filter:brightness(1.06);}
  .rp-crop-bar input[type=range]{flex:none; width:110px; accent-color:var(--accent); margin:0 2px;}
  @media (max-width:760px){ .rp-crop-bar .h{display:none;} .rp-crop-bar input[type=range]{width:70px;} }
  `;
  document.head.appendChild(stV91);
  /* v92 : éditeur de dessin réorganisé — outils nommés et groupés à gauche, réglages de l'outil au-dessus du dessin */
  const stV92 = document.createElement('style'); stV92.id = 'rpV92Style';
  stV92.textContent = `
  .rp-draw.v92{width:min(1120px,100%); max-height:calc(100vh - 40px); overflow:auto; display:flex; flex-direction:column; padding:14px 16px 16px;}
  .rd-head{display:flex; align-items:center; gap:10px; margin:0 0 12px; min-height:32px;}
  .rd-head h3{margin:0 0 0 4px; font-size:15px; font-weight:700;}
  .rd-acts{margin-left:auto; display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end;}
  .rd-acts i{width:1px; height:20px; background:var(--hair); margin:0 4px;}
  .rd-acts button{height:32px; min-width:32px; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:0 9px; border:1px solid var(--hair); border-radius:8px; background:var(--surface); color:var(--ink); font:inherit; font-size:12.5px; font-weight:600; cursor:pointer;}
  .rd-acts button svg{color:var(--ink-soft);}
  .rd-acts button:hover{border-color:var(--accent);}
  .rd-acts button:focus-visible, .rd-tools button:focus-visible{outline:2px solid var(--accent); outline-offset:1px;}
  .rd-acts button.sel{border-color:var(--accent); background:color-mix(in srgb, var(--accent) 10%, var(--surface)); box-shadow:0 0 0 2px rgba(54,153,212,.22);}
  .rd-acts button.sel svg{color:var(--accent);}
  .rd-body{display:flex; gap:14px; min-height:0;}
  .rd-tools{flex:none; width:162px; align-self:flex-start; display:flex; flex-direction:column; gap:2px; padding:6px; border:1px solid var(--hair); border-radius:12px; background:var(--surface-soft);}
  .rd-g{padding:9px 8px 4px; font-size:10px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--ink-soft);}
  .rd-g:first-child{padding-top:4px;}
  .rd-tools button{display:flex; align-items:center; gap:9px; height:32px; padding:0 7px 0 9px; border:0; border-radius:8px; background:none; color:var(--ink); font:inherit; font-size:13px; text-align:left; cursor:pointer;}
  .rd-tools button svg{flex:none; color:var(--ink-soft);}
  .rd-tools button span{flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
  .rd-tools kbd{flex:none; font:600 10px var(--sans); color:var(--ink-soft); border:1px solid var(--hair); border-bottom-width:2px; border-radius:5px; padding:0 5px; background:var(--surface); line-height:15px;}
  .rd-tools button:hover{background:color-mix(in srgb, var(--accent) 7%, transparent);}
  .rd-tools button.sel{background:color-mix(in srgb, var(--accent) 13%, var(--surface)); box-shadow:inset 3px 0 0 var(--accent); font-weight:600;}
  .rd-tools button.sel svg{color:var(--accent);}
  .rd-main{flex:1; min-width:0; display:flex; flex-direction:column; gap:10px;}
  .rd-opts{display:flex; align-items:center; flex-wrap:wrap; gap:8px 16px; min-height:34px;}
  .rd-o{display:flex; align-items:center; gap:6px;}
  .rd-o[hidden]{display:none;}
  .rd-l{font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--ink-soft); margin-right:2px;}
  .rd-o .col{width:20px; height:20px; padding:0; border:1px solid rgba(0,0,0,.14); border-radius:50%; cursor:pointer;}
  .rd-o .col:hover{transform:scale(1.08);}
  .rd-o .col.sel, .rd-o label.cust.sel{box-shadow:0 0 0 2px var(--surface), 0 0 0 4px var(--accent);}
  .rd-o label.cust{position:relative; width:20px; height:20px; display:grid; place-items:center; border:1px dashed var(--ink-soft); border-radius:50%; color:var(--ink-soft); cursor:pointer; overflow:hidden;}
  .rd-o label.cust:hover{border-color:var(--accent); color:var(--accent);}
  .rd-o label.cust.sel{border-style:solid; border-color:rgba(0,0,0,.14);}
  .rd-o label.cust.sel svg{display:none;}
  .rd-o label.cust input{position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; padding:0; border:0;}
  .rd-o input[type=range]{width:84px; accent-color:var(--accent);}
  .rd-dot{width:26px; height:26px; display:grid; place-items:center;}
  .rd-dot b{display:block; border-radius:50%;}
  .rd-v{min-width:34px; font-size:12px; color:var(--ink-soft); font-variant-numeric:tabular-nums;}
  .rd-seg{display:flex; border:1px solid var(--hair); border-radius:8px; overflow:hidden;}
  .rd-seg button{width:32px; height:28px; display:grid; place-items:center; padding:0; border:0; background:var(--surface); color:var(--ink-soft); cursor:pointer;}
  .rd-seg button + button{border-left:1px solid var(--hair);}
  .rd-seg button.sel{background:color-mix(in srgb, var(--accent) 12%, var(--surface)); color:var(--accent);}
  .rd-chip{display:inline-flex; align-items:center; gap:6px; height:30px; padding:0 11px; border:1px solid var(--hair); border-radius:999px; background:var(--surface); color:var(--ink); font:inherit; font-size:12.5px; font-weight:600; cursor:pointer;}
  .rd-chip:hover{border-color:var(--accent);}
  .rd-chip.sel{border-color:var(--accent); color:var(--accent); background:color-mix(in srgb, var(--accent) 9%, var(--surface));}
  .rd-hint{font-size:12.5px; color:var(--ink-soft);}
  .rp-draw.v92 .rp-draw-cv{width:100%; max-width:calc((100vh - 250px) * 16 / 9);}
  .rp-draw.v92 canvas.rd-ov{position:absolute; inset:0; height:100%; background:transparent; border-color:transparent; pointer-events:none;}
  @media (max-width:760px){
    .rd-body{flex-direction:column;}
    .rd-tools{width:auto; align-self:stretch; flex-direction:row; flex-wrap:wrap;}
    .rd-g, .rd-tools kbd, .rd-acts button span{display:none;}
    .rd-tools button{flex:1 1 auto;}
  }
  `;
  document.head.appendChild(stV92);

  const plansTxt = n => n + ' ' + (n > 1 ? L('plans', 'shots') : L('plan', 'shot'));
  const pad2 = n => (n < 10 ? '0' : '') + n;
  const sanitize = s => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const clip = (t, n) => { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '\u2026' : t; };

  /* ---------- sélection ---------- */
  function selRefresh(){
    const root = $('rpSb'); if(!root) return;
    const ids = {}; store().frames.forEach(f => { ids[f.id] = 1; });
    Array.from(SELS).forEach(id => { if(!ids[id]) SELS.delete(id); });
    root.querySelectorAll('.rp-sb-f').forEach(el => {
      const on = SELS.has(el.dataset.id);
      el.classList.toggle('sel', on);
      const b = el.querySelector('.rp-sb-chk'); if(b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const em = root.querySelector('.rp-sb-head em');
    if(!em) return;
    if(SELS.size){
      em.textContent = SELS.size + ' ' + (SELS.size > 1 ? L('cochés', 'selected') : L('coché', 'selected')) + ' \u2715';
      em.setAttribute('data-a', 'clearsel'); em.title = L('Tout décocher', 'Clear the selection');
    } else {
      const tot = store().frames.length;
      em.textContent = tot ? plansTxt(tot) : '';
      em.removeAttribute('data-a'); em.removeAttribute('title');
    }
  }

  /* ---------- plans dans l'ordre d'affichage, scènes et pages ---------- */
  /* ancien rangement (par page puis par scène) : ne sert plus qu'à convertir un storyboard existant */
  function sbOrderedByPage(){
    const n = nPages(), scs = sbScenes(), by = framesByPage(n, scs), out = []; let k = 0;
    for(let p = 1; p <= n; p++){ const ps = scs.filter(s => s.from <= p && p <= s.to); by[p].forEach(f => out.push({ f:f, num:++k, pg:p, sc:sceneIdOf(f, ps) })); }
    return out;
  }
  /* v93 — SÉQUENCES LIBRES
     Le storyboard n'est plus rangé de force sous les scènes : il suit l'ordre du film, découpé en séquences
     que l'on crée, nomme et range soi-même (générique, ouverture, montage, scène 12, fin…). Une séquence peut
     être reliée à une scène du scénario (son titre suit alors l'entête) ou rester libre.
     store().seqs = [{ id, title, sc }] dans l'ordre ; chaque plan porte f.sq ; l'ordre des plans d'une
     séquence est celui du tableau store().frames. Un storyboard d'avant est converti une fois, à l'identique :
     une séquence reliée par scène qui avait des plans, dans le même ordre. */
  function sbMigrate(){
    const st = store(); if(st.v === 2) return;
    const hasScenes = (() => { try{ return getSceneBlocks().some(b => b.sceneId); }catch(e){ return false; } })();
    if(st.frames.length && hasScenes && !Object.keys((S.pagination && S.pagination.pageOf) || {}).length) return;   // pagination pas encore prête
    const old = sbOrderedByPage(), seqs = [], byKey = {};
    old.forEach(x => {
      const k = x.sc || ('p' + x.pg); let q = byKey[k];
      if(!q){ q = { id:uid(), title:x.sc ? '' : L('Page ', 'Page ') + x.pg, sc:x.sc || '' }; byKey[k] = q; seqs.push(q); }
      x.f.sq = q.id;
    });
    const seen = new Set(old.map(x => x.f));
    st.frames = old.map(x => x.f).concat(st.frames.filter(f => !seen.has(f)));
    st.seqs = seqs.concat(st.seqs || []); st.v = 2;
    if(old.length) save();
  }
  function seqLabel(q, scById){
    if(q.title && q.title.trim()) return q.title.trim();
    const sc = q.sc && scById[q.sc];
    if(sc) return sc.title;
    return L('Séquence sans titre', 'Untitled sequence');
  }
  function sbOrdered(){
    sbMigrate();
    const st = store(), ids = new Set(st.seqs.map(q => q.id));
    const lost = st.frames.filter(f => !ids.has(f.sq));
    if(lost.length){                                   // plan sans séquence (ajouté ailleurs) : va dans la dernière
      if(!st.seqs.length) st.seqs.push({ id:uid(), title:'', sc:'' });
      const last = st.seqs[st.seqs.length - 1]; lost.forEach(f => { f.sq = last.id; }); save();
    }
    const scById = {}; sbScenes().forEach(x => { scById[x.id] = x; });
    const by = {}; st.frames.forEach(f => { (by[f.sq] = by[f.sq] || []).push(f); });
    const out = []; let k = 0;
    st.seqs.forEach(q => {
      const sc = q.sc && scById[q.sc], label = seqLabel(q, scById);
      (by[q.id] || []).forEach(f => out.push({ f:f, num:++k, pg:sc ? sc.from : (parseInt(f.pg, 10) || 1), sc:sc ? sc.id : '', sq:q.id, seq:q, label:label }));
    });
    return out;
  }
  /* pages couvertes par chaque scène : de la page de son entête à la page de son dernier bloc
     (une page où deux scènes se partagent la place appartient donc aux deux) */
  function sbScenes(){
    const out = [];
    try{
      const numbers = sceneNumbers(), po = (S.pagination && S.pagination.pageOf) || {};
      getSceneBlocks().filter(b => b.sceneId).forEach(b => {
        const els = b.elements || [], start = po[b.sceneId];
        if(!start) return;
        let end = start;
        for(let i = els.length - 1; i >= 0; i--){ const v = po[els[i].id]; if(v){ end = v; break; } }
        out.push({ id:b.sceneId, eid:(els[0] && els[0].id) || '', num:numbers[b.sceneId] || '', title:(els[0] && els[0].text) || L('(scène sans titre)', '(untitled scene)'), from:start, to:Math.max(start, end) });
      });
    }catch(err){}
    return out;
  }
  function sbPick(scope, val, one){
    const all = sbOrdered();
    if(scope === 'one') return all.filter(x => x.f.id === one);
    if(scope === 'sel') return all.filter(x => SELS.has(x.f.id));
    if(scope === 'scene') return all.filter(x => x.sc === val);
    if(scope === 'seq') return all.filter(x => x.sq === val);
    if(scope === 'page') return all.filter(x => x.pg === (parseInt(val, 10) || 1));
    return all;
  }

  /* ---------- ZIP (sans compression, sans bibliothèque) ---------- */
  const CRC_T = (() => { const t = new Uint32Array(256); for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
  function crc32(u8){ let c = 0xFFFFFFFF; for(let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipStore(files){
    const enc = new TextEncoder(), parts = [], central = [], d = new Date(); let offset = 0;
    const dt = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const dd = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(f => {
      const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, dt, true); lh.setUint16(12, dd, true); lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true);
      lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, nm, f.data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, dt, true); ch.setUint16(14, dd, true); ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true);
      ch.setUint16(28, nm.length, true); ch.setUint32(42, offset, true);
      central.push(ch.buffer, nm);
      offset += 30 + nm.length + sz;
    });
    const cdSize = central.reduce((a, b) => a + (b.byteLength !== undefined ? b.byteLength : b.length), 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end.buffer]), { type:'application/zip' });
  }

  /* ---------- image d'un plan → canvas (avec numéro et légende si demandé) ---------- */
  const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('img')); im.src = src; });
  const canvasBlob = cv => new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('png')), 'image/png'));
  function wrapLines(cx, text, maxW){
    const words = String(text || '').split(/\s+/).filter(Boolean), lines = []; let cur = '';
    words.forEach(w => { const t = cur ? cur + ' ' + w : w; if(!cur || cx.measureText(t).width <= maxW) cur = t; else { lines.push(cur); cur = w; } });
    if(cur) lines.push(cur);
    return lines;
  }
  async function frameCanvas(x, caps){
    const im = await loadImg(x.f.src);
    const W = im.naturalWidth || 960, H = im.naturalHeight || 540, ff = 'system-ui, "Helvetica Neue", Arial, sans-serif';
    let lines = [], tp = 0, fs = 0, lh = 0;
    if(caps){
      const m = document.createElement('canvas').getContext('2d');
      fs = Math.max(12, Math.round(W * .026)); lh = Math.round(fs * 1.45); tp = Math.round(W * .021);
      m.font = fs + 'px ' + ff;
      lines = wrapLines(m, x.f.cap || '', W - Math.round(W * .06));
    }
    const strip = caps ? tp * 2 + lh * (1 + lines.length) : 0;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + strip;
    const cx = cv.getContext('2d');
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
    cx.drawImage(im, 0, 0, W, H);
    if(caps){
      const px = Math.round(W * .03);
      cx.textBaseline = 'top';
      cx.font = '700 ' + fs + 'px ' + ff; cx.fillStyle = '#1F6FA0';
      cx.fillText(L('PLAN', 'SHOT') + ' ' + x.num + (x.label ? '  \u00B7  ' + clip(x.label, 60).toUpperCase() : ''), px, H + tp);
      cx.font = fs + 'px ' + ff; cx.fillStyle = '#1b1b1f';
      lines.forEach((t, i) => cx.fillText(t, px, H + tp + lh * (i + 1)));
    }
    return cv;
  }

  /* ---------- PDF : une planche de plans (1, 2 ou 6 par page) ---------- */
  async function sbBuildPdf(list, o){
    const jsPDF = await loadJsPdf();
    const p = S.project, us = p.format === 'us';
    const W = us ? 612 : 595.28, H = us ? 792 : 841.89;
    const per = (o.per === 1 || o.per === 2) ? o.per : 6;
    const cols = per === 6 ? 2 : 1, rows = per === 1 ? 1 : (per === 2 ? 2 : 3);
    const M = 40, top = 66, bot = 48, gx = 18, gy = 16;
    const cw = (W - 2 * M - gx * (cols - 1)) / cols, chh = (H - top - bot - gy * (rows - 1)) / rows;
    const capH = per === 6 ? 46 : (per === 2 ? 64 : 84);
    const safe = t => typeof pdfSafeText === 'function' ? pdfSafeText(t) : String(t == null ? '' : t);
    const doc = new jsPDF({ unit:'pt', orientation:'portrait', format:[W, H], compress:true });
    const pages = Math.ceil(list.length / per);
    for(let i = 0; i < list.length; i++){
      const k = i % per;
      if(i > 0 && k === 0) doc.addPage([W, H], 'portrait');
      if(k === 0){
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(110, 115, 125);
        doc.text(safe(clip(p.title || 'Storyboard', 60)), M, 40);
        doc.text(safe(clip(o.label, 70)), W - M, 40, { align:'right' });
        doc.setDrawColor(215, 219, 226); doc.setLineWidth(.6); doc.line(M, 48, W - M, 48);
        doc.text((Math.floor(i / per) + 1) + ' / ' + pages, W / 2, H - 26, { align:'center' });
      }
      const x0 = M + (k % cols) * (cw + gx), y0 = top + Math.floor(k / cols) * (chh + gy);
      const it = list[i], cv = await frameCanvas(it, false);
      let iw = cw, ih = iw * cv.height / cv.width;
      if(ih > chh - capH){ ih = chh - capH; iw = ih * cv.width / cv.height; }
      const isDraw = it.f.k === 'draw';
      doc.addImage(isDraw ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', .9), isDraw ? 'PNG' : 'JPEG', x0, y0, iw, ih);
      doc.setDrawColor(205, 210, 218); doc.setLineWidth(.6); doc.rect(x0, y0, iw, ih, 'S');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(31, 111, 160);
      doc.text(safe(L('PLAN', 'SHOT') + ' ' + it.num), x0, y0 + ih + 14);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 115, 125);
      doc.text(safe(clip(it.label || '', per === 6 ? 26 : 50)), x0 + iw, y0 + ih + 14, { align:'right' });
      const cap = safe(it.f.cap || '').trim();
      if(cap){
        const fs = per === 6 ? 9 : 10.5, lh = fs * 1.3, maxL = Math.max(1, Math.floor((capH - 22) / lh));
        doc.setFontSize(fs); doc.setTextColor(35, 38, 46);
        let ls = doc.splitTextToSize(cap, iw);
        if(ls.length > maxL){ ls = ls.slice(0, maxL); ls[maxL - 1] = ls[maxL - 1].slice(0, -1) + '\u2026'; }
        doc.text(ls, x0, y0 + ih + 28, { lineHeightFactor:1.3 });
      }
    }
    try{ doc.setProperties({ title:(p.title || 'Storyboard') + ' \u2014 Storyboard', author:p.author || '' }); }catch(err){}
    return doc.output('blob');
  }

  async function sbRunDownload(list, o){
    const p = S.project, base = sanitize(p.title) || 'Storyboard';
    toast(L('Préparation du téléchargement…', 'Preparing the download…'));
    try{
      if(o.fmt === 'png'){
        const files = [];
        for(const x of list) files.push({ x:x, blob:await canvasBlob(await frameCanvas(x, o.caps)) });
        if(files.length === 1){
          downloadBlob(base + ' - ' + L('plan', 'shot') + ' ' + pad2(files[0].x.num) + '.png', files[0].blob, 'image/png');
        } else {
          const zf = [];
          for(const f of files) zf.push({ name:L('plan', 'shot') + ' ' + pad2(f.x.num) + (f.x.label ? ' - ' + sanitize(clip(f.x.label, 40)) : '') + '.png', data:new Uint8Array(await f.blob.arrayBuffer()) });
          downloadBlob(base + ' - ' + o.file + '.zip', zipStore(zf), 'application/zip');
        }
      } else {
        downloadBlob(base + ' - ' + o.file + '.pdf', await sbBuildPdf(list, o), 'application/pdf');
      }
      toast(L('Téléchargement prêt : ', 'Download ready: ') + plansTxt(list.length) + '.');
    }catch(err){
      console.error(err);
      toast(L('Impossible de préparer le téléchargement', 'Couldn\u2019t prepare the download') + (o.fmt === 'pdf' ? L(' (le PDF a besoin de charger une bibliothèque : vérifie ta connexion, ou choisis PNG).', ' (the PDF needs to load a library: check your connection, or pick PNG).') : '.'));
    }
  }

  /* ---------- fenêtre « Télécharger » ---------- */
  function dlOpen(one){
    const old = $('rpDlBg'); if(old) old.remove();
    const all = sbOrdered();
    if(!all.length){ toast(L('Aucun plan à télécharger.', 'No shots to download.')); return; }
    const seqL = []; store().seqs.forEach(q => { const its = all.filter(x => x.sq === q.id); if(its.length) seqL.push({ id:q.id, label:its[0].label, n:its.length }); });
    const selN = all.filter(x => SELS.has(x.f.id)).length, oneIt = one ? all.filter(x => x.f.id === one)[0] : null;
    let scope = oneIt ? 'one' : (selN ? 'sel' : 'all'), fmt = 'png';
    const opt = (val, title, sub, extra, off) => `<label class="rp-dl-opt${off ? ' off' : ''}" data-scope="${val}"><input type="radio" name="rpDlScope" value="${val}"${off ? ' disabled' : ''}><span class="t">${title}${sub ? `<small>${sub}</small>` : ''}</span>${extra || ''}</label>`;
    const seqSel = seqL.length ? `<select data-sel="seq" aria-label="${esc(L('Séquence', 'Sequence'))}">${seqL.map(q => `<option value="${esc(q.id)}">${esc(clip(q.label, 34) + ' \u00B7 ' + q.n)}</option>`).join('')}</select>` : '';
    const bg = document.createElement('div'); bg.id = 'rpDlBg'; bg.className = 'modal-backdrop rp-ui'; bg.style.zIndex = '300';
    bg.innerHTML = `<div class="modal rp-dl" role="dialog" aria-modal="true" style="max-width:440px;">
      <h2>${esc(L('Télécharger le storyboard', 'Download the storyboard'))}</h2>
      <div class="rp-dl-sec">${esc(L('Quoi télécharger', 'What to download'))}</div>
      ${oneIt ? opt('one', esc(L('Ce plan', 'This shot')), esc(L('Plan', 'Shot') + ' ' + oneIt.num + ' \u00B7 ' + clip(oneIt.label, 40))) : ''}
      ${opt('sel', esc(L('Les plans cochés', 'Selected shots')), esc(selN ? plansTxt(selN) : L('Coche des plans avec le rond en bas à gauche de chaque image', 'Tick shots with the circle at the bottom left of each image')), '', !selN)}
      ${opt('seq', esc(L('Une séquence', 'A sequence')), esc(L('Tous les plans de cette séquence', 'Every shot of this sequence')), seqSel, !seqL.length)}
      ${opt('all', esc(L('Tout le storyboard', 'The whole storyboard')), esc(plansTxt(all.length)))}
      <div class="rp-dl-sec">Format</div>
      <div class="rp-dl-seg"><button type="button" data-fmt="png">PNG</button><button type="button" data-fmt="pdf">PDF</button></div>
      <div class="rp-dl-extra" id="rpDlPng"><label><input type="checkbox" id="rpDlCap"> ${esc(L('Ajouter le numéro et la légende sous chaque dessin', 'Add the number and caption under each drawing'))}</label></div>
      <div class="rp-dl-extra" id="rpDlPdf" hidden><span>${esc(L('Plans par page', 'Shots per page'))}</span><select id="rpDlPer"><option value="6">6</option><option value="2">2</option><option value="1">1</option></select></div>
      <div class="rp-dl-sum" id="rpDlSum"></div>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-r="cancel">${esc(L('Annuler', 'Cancel'))}</button>
        <button type="button" class="btn btn-primary" data-r="go">${esc(L('Télécharger', 'Download'))}</button></div></div>`;
    document.body.appendChild(bg);
    const q = s => bg.querySelector(s);
    const items = () => { const sq = q('select[data-sel="seq"]'); return sbPick(scope, sq && sq.value, one); };
    function names(){
      if(scope === 'one') return { file:L('plan', 'shot') + ' ' + pad2(oneIt.num), label:L('Plan', 'Shot') + ' ' + oneIt.num };
      if(scope === 'sel') return { file:L('plans choisis', 'selected shots'), label:L('Plans choisis', 'Selected shots') };
      if(scope === 'seq'){ const it = seqL.filter(x => x.id === q('select[data-sel="seq"]').value)[0] || { label:'' }; return { file:sanitize(clip(it.label, 40)) || L('séquence', 'sequence'), label:it.label }; }
      return { file:'storyboard', label:L('Tout le storyboard', 'Whole storyboard') };
    }
    function upd(){
      bg.querySelectorAll('.rp-dl-opt').forEach(l => { const on = l.dataset.scope === scope; l.classList.toggle('sel', on); const r = l.querySelector('input'); if(r) r.checked = on; });
      bg.querySelectorAll('[data-fmt]').forEach(b => b.classList.toggle('sel', b.dataset.fmt === fmt));
      q('#rpDlPng').hidden = fmt !== 'png'; q('#rpDlPdf').hidden = fmt !== 'pdf';
      const n = items().length, per = +q('#rpDlPer').value, sheets = Math.ceil(n / per);
      q('#rpDlSum').textContent = !n ? L('Rien à télécharger avec ce choix.', 'Nothing to download with this choice.')
        : fmt === 'png' ? (n === 1 ? L('1 image PNG.', '1 PNG image.') : n + ' ' + L('images PNG réunies dans un fichier ZIP.', 'PNG images bundled in one ZIP file.'))
        : L('PDF de ', 'PDF of ') + sheets + ' ' + (sheets > 1 ? 'pages' : 'page') + ' \u00B7 ' + plansTxt(n) + '.';
      q('[data-r="go"]').disabled = !n;
    }
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey, true); };
    function onKey(e){ if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(); } }
    document.addEventListener('keydown', onKey, true);
    async function go(){
      const list = items(); if(!list.length) return;
      const nm = names(), o = { fmt:fmt, caps:q('#rpDlCap').checked, per:+q('#rpDlPer').value, file:nm.file, label:nm.label };
      close();
      await sbRunDownload(list, o);
    }
    bg.addEventListener('mousedown', e => { bg._d = e.target === bg; });
    bg.addEventListener('click', e => {
      if(e.target === bg && bg._d){ close(); return; }
      const f = e.target.closest('[data-fmt]'); if(f){ fmt = f.dataset.fmt; upd(); return; }
      const r = e.target.closest('[data-r]');
      if(r){ if(r.dataset.r === 'cancel') close(); else if(r.dataset.r === 'go') go(); }
    });
    bg.addEventListener('change', e => {
      const t = e.target;
      if(t.name === 'rpDlScope') scope = t.value; else if(t.dataset && t.dataset.sel) scope = t.dataset.sel;
      upd();
    });
    upd();
  }

  /* ---------- passer d'une page à l'autre ---------- */
  function goPage(p){
    const cp = $('centerPane'), sh = document.querySelectorAll('#sheets .sheet')[p - 1]; if(!cp || !sh) return;
    const cr = cp.getBoundingClientRect(), r = sh.getBoundingClientRect();
    cp.scrollTo({ top:Math.max(0, Math.round(r.top - cr.top + cp.scrollTop - 16)), behavior:'smooth' });
  }
  function flashFrame(id){
    const el = document.querySelector('#rpSb .rp-sb-f[data-id="' + id + '"]'); if(!el) return;
    const fl = el.closest('.rp-sb-fl'); if(fl) fl.scrollTop = Math.max(0, el.offsetTop - fl.offsetTop - 8);
    el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1300);
  }
  function goScene(id){
    const s = (SB.scs || sbScenes()).filter(x => x.id === id)[0]; if(!s) return;
    const cp = $('centerPane');
    let el = null;
    if(s.eid){ try{ el = document.querySelector('#sheets [data-id="' + String(s.eid).replace(/"/g, '\\"') + '"]'); }catch(err){} }
    if(cp && el){ const cr = cp.getBoundingClientRect(), r = el.getBoundingClientRect(); cp.scrollTo({ top:Math.max(0, Math.round(r.top - cr.top + cp.scrollTop - 60)), behavior:'smooth' }); }
    else goPage(s.from);
  }
  function moveFrame(f, p, sc){
    const arr = store().frames, i = arr.indexOf(f); if(i < 0) return;
    const from = f.pg, fromSc = f.sc;
    arr.splice(i, 1); f.pg = p; if(sc) f.sc = sc; else delete f.sc; arr.push(f);          // le plan arrive en dernier sur la page / scène choisie
    save(); sbRender(); goPage(p); flashFrame(f.id);
    const scn = sc ? (SB.scs || []).filter(s => s.id === sc)[0] : null;
    snack((scn ? L('Plan déplacé vers la scène ', 'Shot moved to scene ') + (scn.num || scn.title) : L('Plan déplacé vers la page ', 'Shot moved to page ') + p) + '.', () => {
      const a = store().frames, j = a.indexOf(f); if(j >= 0) a.splice(j, 1);
      f.pg = from; if(fromSc) f.sc = fromSc; else delete f.sc; a.splice(Math.min(i, a.length), 0, f); save(); sbRender(); goPage(from); flashFrame(f.id);
    });
  }
  function moveMenu(btn, f){
    const o = document.querySelector('.rp-sb-pgmenu'); if(o) o.remove();
    const n = nPages(), cur = Math.max(1, Math.min(n, parseInt(f.pg, 10) || 1));
    const scs = SB.scs || [], curPs = scs.filter(s => s.from <= cur && cur <= s.to), curSc = sceneIdOf(f, curPs);
    const m = document.createElement('div'); m.className = 'rp-sb-pgmenu rp-ui';
    let g = ''; for(let p = 1; p <= n; p++) g += `<button type="button" data-pg="${p}"${p === cur ? ' class="cur" aria-current="true"' : ''}>${p}</button>`;
    const sl = scs.length ? `<h4 style="margin-top:12px">${esc(L('ou vers la scène', 'or to scene'))}</h4><div class="s">${scs.map(s => `<button type="button" data-sc="${esc(s.id)}"${s.id === curSc ? ' class="cur" aria-current="true"' : ''} title="${esc(s.title)}">${esc((s.num ? s.num + '. ' : '') + s.title)}</button>`).join('')}</div>` : '';
    m.innerHTML = `<h4>${esc(L('Déplacer vers la page', 'Move to page'))}</h4><div class="g">${g}</div>${sl}`;
    const r = btn.getBoundingClientRect();
    m.style.top = Math.round(Math.max(8, Math.min(window.innerHeight - (scs.length ? 400 : 250), r.bottom + 6))) + 'px';
    m.style.left = Math.round(Math.max(8, Math.min(window.innerWidth - 240, r.right - 228))) + 'px';
    m.addEventListener('click', e => {
      const sb = e.target.closest('[data-sc]');
      if(sb){
        const s = scs.filter(x => x.id === sb.dataset.sc)[0]; if(!s) return;
        m.remove();
        if(s.id === curSc) goScene(s.id); else moveFrame(f, (s.from <= cur && cur <= s.to) ? cur : s.from, s.id);
        return;
      }
      const b = e.target.closest('[data-pg]'); if(!b) return;
      const p = parseInt(b.dataset.pg, 10); m.remove();
      if(p !== cur) moveFrame(f, p); else goPage(p);
    });
    document.body.appendChild(m);
    setTimeout(() => document.addEventListener('click', function off(e){ if(!m.contains(e.target)) m.remove(); document.removeEventListener('click', off, true); }, true), 0);
  }
  document.addEventListener('click', e => {
    const root = $('rpSb'); if(!root || !root.contains(e.target)) return;
    const a = e.target.closest('[data-a]'); if(!a) return;
    const act = a.dataset.a;
    if(act === 'sel'){ const f = frameOf(a); if(f){ if(SELS.has(f.id)) SELS.delete(f.id); else SELS.add(f.id); selRefresh(); } }
    else if(act === 'clearsel'){ SELS.clear(); selRefresh(); }
    else if(act === 'dlopen') dlOpen();
    else if(act === 'dl'){ const f = frameOf(a); if(f) dlOpen(f.id); }
    else if(act === 'mv'){ const f = frameOf(a); if(f) moveMenu(a, f); }
    else if(act === 'gopage') goPage(laneOf(a));
    else if(act === 'gosc') goScene(a.dataset.sc);
  });
  /* glisser un plan près du haut ou du bas de la colonne : le scénario défile tout seul */
  document.addEventListener('dragover', e => {
    const root = $('rpSb'); if(!root || !root.contains(e.target)) return;
    const hasFile = e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0;
    if(!dragId && !hasFile) return;
    const cp = $('centerPane'); if(!cp) return;
    const r = root.getBoundingClientRect(), z = 90, t = r.top + 44;
    let dv = 0;
    if(e.clientY < t + z) dv = -Math.ceil((t + z - e.clientY) / z * 24);
    else if(e.clientY > r.bottom - z) dv = Math.ceil((e.clientY - (r.bottom - z)) / z * 24);
    if(dv) cp.scrollTop += Math.max(-30, Math.min(30, dv));
  });

  document.addEventListener('dragover', e => {
    const root = $('rpSb'); if(!root || !root.contains(e.target) || !dragId) return;
    const sh = e.target.closest('.rp-sb-sh'); if(!sh) return;
    sh.classList.add('over'); const l = sh.closest('.rp-sb-lane'); if(l) l.classList.remove('drop');
  });

  /* menu ⋯ et liste des raccourcis */
  const __moreMenu82 = moreMenuHtml;
  moreMenuHtml = function(){
    let h = __moreMenu82.apply(this, arguments);
    const mark = '<div class="tb-more-title">' + L('Voix', 'Voice') + '</div>';
    return h;   // v92 : le storyboard s'ouvre depuis la colonne de gauche, plus depuis ce menu
    const add = `<button class="btn" data-act="rpSbToggle" title="Ctrl+Alt+B">${svg(ICON_FRAME, 16)} ${L('Storyboard en temps réel', 'Live storyboard')}${sbOn() ? ' \u2713' : ''}</button>`;
    const i = h.indexOf(mark);
    return i >= 0 ? h.slice(0, i) + add + h.slice(i) : h + add;
  };
  const __shortcuts82 = openShortcuts;
  openShortcuts = function(){
    const r = __shortcuts82.apply(this, arguments);
    try{
      const kb = ks => ks.map(k => `<span class="kbd">${k}</span>`).join('<span class="sc-plus">+</span>');
      let g = null; document.querySelectorAll('#shortcutsBackdrop .sc-group-title').forEach(t => { if(/^(Annoter|Annotate)$/.test(t.textContent.trim())) g = t.parentElement; });
      if(g) g.insertAdjacentHTML('beforeend', `<div class="sc-row"><div class="sc-keys">${kb(['Ctrl/Cmd', 'Alt', 'B'])}</div><div class="sc-desc">${L('Ouvrir le storyboard / revenir au scénario', 'Open the storyboard / back to the screenplay')}<span class="sc-note">${L('Onglet Storyboard de la colonne de gauche : plans rangés par scène, lecture auto ou manuelle, dessin, téléchargement.', 'Storyboard tab in the left sidebar: shots grouped by scene, auto or manual playback, drawing, download.')}</span></div></div>`);
    }catch(err){}
    return r;
  };
  if(ACTIONS.openShortcuts) ACTIONS.openShortcuts = openShortcuts;

  /* v92 : fonctions partagées avec l'onglet Storyboard (js/36-storyboard-tab.js) */
  window.RPSB = { store, save, drawOpen, pickFile, pasteImage, addFiles, dlOpen, delFrame, sbScenes, sbOrdered, sbMigrate, seqLabel, sceneIdOf, snack, SELS, svg, ICON_FRAME, uid, changed:sbChanged };

  /* ---------- boucle de mise à jour ---------- */
  let raf = 0;
  function tick(){
    if(raf) return;
    raf = requestAnimationFrame(() => { raf = 0; try{ musicUi(); sbSync(); }catch(err){} });
  }
  new MutationObserver(muts => {
    for(const m of muts){
      const n = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      if(!(n && n.closest && n.closest('.rp-ui'))){ tick(); return; }
    }
  }).observe(document.body, { childList:true, subtree:true, characterData:true });
  window.addEventListener('resize', tick);
  tick();
})();

/* v86 — Menu ⋯ : une icône propre à chaque fonction (comme WriterDuet : un symbole = une action).
   Avant, « Rechercher / remplacer », « Renommer partout » et « Variantes de noms » partageaient la
   même loupe, « Pages presque vides » et « Ma session d'écriture » la même feuille, et Google Drive
   reprenait la flèche d'import. Seul le dessin change ; libellés, ordre et actions sont intacts. */
(function(){
  const sv = p => '<svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const ICONS = {
    wdOpenRename:   sv('<path d="M10.6 1.9l3.5 3.5-7.6 7.6-3.9.5.5-3.9z"/><path d="M9.2 3.3l3.5 3.5M8.8 14.5h5.4"/>'),
    wdOpenVariants: sv('<circle cx="4" cy="3.6" r="1.6"/><circle cx="4" cy="12.4" r="1.6"/><circle cx="12" cy="6.4" r="1.6"/><path d="M4 5.2v5.6M4 9.6c0-2.2 1.6-3.2 6.4-3.2"/>'),
    wdOpenOrphans:  sv('<path d="M3 1h7l3 3v11H3z" stroke-dasharray="2.3 1.9"/><path d="M9 1v4h4M5.6 12h2.8"/>'),
    wdOpenSession:  sv('<circle cx="8" cy="9" r="5.2"/><path d="M8 9V6.2M6.2 1.6h3.6M12.3 3.8l1.1-1.1"/>'),
    gdChipClick:    sv('<path d="M4.8 12.6h6.4a2.9 2.9 0 0 0 .5-5.75A4 4 0 0 0 4 6.4a3.1 3.1 0 0 0 .8 6.2z"/>')
  };
  const prev = moreMenuHtml;
  moreMenuHtml = function(){
    let h = prev.apply(this, arguments);
    Object.keys(ICONS).forEach(k => {
      const a = h.indexOf('data-act="' + k + '"'); if(a < 0) return;
      const b = h.indexOf('</button>', a), s0 = h.indexOf('<svg', a);
      if(s0 < 0 || (b >= 0 && s0 > b)) return;
      const e0 = h.indexOf('</svg>', s0); if(e0 < 0) return;
      h = h.slice(0, s0) + ICONS[k] + h.slice(e0 + 6);
    });
    return h;
  };
  if(typeof ACTIONS !== 'undefined' && ACTIONS.toggleMoreMenu) { /* le menu relit moreMenuHtml à l'ouverture */ }
})();

init();

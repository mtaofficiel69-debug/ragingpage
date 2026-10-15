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
  const sbOn = () => { try{ return localStorage.getItem(SB_KEY) === '1'; }catch(e){ return false; } };
  const sbSetOn = v => { try{ localStorage.setItem(SB_KEY, v ? '1' : '0'); }catch(e){} };
  const uid = () => 'sb' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const ICON_FRAME = '<rect x="2" y="3" width="12" height="10" rx="2"/><circle cx="6" cy="7" r="1"/><path d="M2.5 12l3.6-3.4 2.4 2.2 2-1.8 3 3"/>';
  function store(){
    const p = S.project;
    if(!p.storyboard || typeof p.storyboard !== 'object') p.storyboard = { frames:[] };
    if(!Array.isArray(p.storyboard.frames)) p.storyboard.frames = [];
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
    background:#262535; color:#fff; font:13px var(--sans); box-shadow:0 8px 24px #0005; animation:rpPop .16s ease;}
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
  async function gdAskReconnect(){
    if(gdAsking || gdRefused) return;
    try{
      if(localStorage.getItem(GD_ON_KEY) !== '1' || !gdClientId()) return;
      gdAsking = true;
      for(let i = 0; i < 110 && window.__rpGdAuto && window.__rpGdAuto.state === 'pending'; i++) await sleep(100);
      if(gdConnected() || !live()) return;
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
  function musicUi(){
    const pg = $('page'); if(!pg) return;
    const mp = document.querySelector('.rp-mp'), pid = mp ? mp.dataset.id : null;
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
  function nPages(){ return Math.max(1, document.querySelectorAll('#sheets .sheet').length); }
  function framesByPage(n){
    const by = {}; for(let p = 1; p <= n; p++) by[p] = [];
    store().frames.forEach(f => { const p = Math.max(1, Math.min(n, parseInt(f.pg, 10) || 1)); by[p].push(f); });
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
    const next = v == null ? !sbOn() : !!v;
    sbSetOn(next); sbSync();
    try{ schedulePaginate(40); }catch(err){}     // v86 : la feuille se remet à la largeur restante
    if(!next){ const m = document.querySelector('.rp-sb-menu'); if(m) m.remove(); }
  }
  function laneHtml(p, list, nums){
    const frames = list.map(f => `<div class="rp-sb-f" data-id="${f.id}">
        <div class="rp-sb-img" draggable="true" title="${esc(L('Clique pour agrandir · glisse pour réordonner', 'Click to enlarge · drag to reorder'))}">
          <span class="rp-sb-n">${nums[f.id]}</span><img src="${f.src}" alt="" draggable="false">
          <div class="rp-sb-tools">
            <button type="button" data-a="edit" title="${esc(L('Dessiner dessus / modifier', 'Draw on it / edit'))}">${svg('<path d="M3 13l.7-3L10.8 3a1.4 1.4 0 0 1 2 2L5.7 12.2 3 13z"/>', 13)}</button>
            <button type="button" data-a="del" title="${esc(L('Supprimer ce plan', 'Delete this shot'))}">${svg('<path d="M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.5 8h5l.5-8"/>', 13)}</button>
          </div></div>
        <input class="rp-sb-cap" type="text" maxlength="200" placeholder="${esc(L('Légende (cadrage, mouvement…)', 'Caption (framing, movement…)'))}" value="${esc(f.cap || '')}">
      </div>`).join('');
    const ghost = list.length ? '' : `<div class="rp-sb-ghost first"><span>${esc(L('Aucun plan', 'No shot'))}</span>
        <button type="button" data-a="upload">${svg('<path d="M8 11V3M5 6l3-3 3 3M3 13h10"/>', 13)} ${esc(L('Image', 'Image'))}</button>
        <button type="button" data-a="draw">${svg('<path d="M3 13l.7-3L10.8 3a1.4 1.4 0 0 1 2 2L5.7 12.2 3 13z"/>', 13)} ${esc(L('Dessin', 'Draw'))}</button></div>`;
    return `<div class="rp-sb-lane" data-p="${p}"><div class="rp-sb-lh"><span>${L('Page', 'Page')} ${p}</span>
      <button type="button" class="rp-sb-add" title="${esc(L('Ajouter un plan à cette page', 'Add a shot to this page'))}">${svg('<path d="M8 3v10M3 8h10"/>', 13)}</button></div>
      <div class="rp-sb-fl">${frames}${ghost}</div></div>`;
  }
  function sbRender(){
    const root = $('rpSb'); if(!root) return;
    const n = nPages(), by = framesByPage(n), nums = {}; let k = 0;
    for(let p = 1; p <= n; p++) by[p].forEach(f => { nums[f.id] = ++k; });
    const inner = root.querySelector('.rp-sb-inner');
    inner.innerHTML = Object.keys(by).map(p => laneHtml(p, by[p], nums)).join('');
    const c = root.querySelector('.rp-sb-head em'); const tot = store().frames.length;
    c.textContent = tot ? tot + ' ' + (tot > 1 ? L('plans', 'shots') : L('plan', 'shot')) : '';
    SB.sig = sigNow();
    sbPlace();
  }
  const sigNow = () => (S.project ? S.project.id : '') + '|' + nPages() + '|' + getLang();
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
  async function addFiles(files, page){
    const list = Array.from(files || []).filter(f => /^image\//.test(f.type));
    if(!list.length){ toast(L('Dépose une image (JPG, PNG, WebP…).', 'Drop an image (JPG, PNG, WebP…).')); return; }
    for(const f of list){
      try{ store().frames.push({ id:uid(), pg:page, k:'img', src:await compress(f), cap:'' }); }
      catch(e){ toast(L('Image illisible : ', 'Unreadable image: ') + f.name); }
    }
    save(); sbRender();
  }
  function pickFile(page){
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.style.display = 'none';
    inp.addEventListener('change', () => { addFiles(inp.files, page); inp.remove(); });
    document.body.appendChild(inp); inp.click();
  }
  async function pasteImage(page){
    try{
      const items = await navigator.clipboard.read();
      for(const it of items){
        const t = it.types.find(x => /^image\//.test(x));
        if(t){ const b = await it.getType(t); await addFiles([new File([b], 'collage', { type:t })], page); return; }
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
    SB.snack = setTimeout(() => d.remove(), 7000);
  }
  function delFrame(id){
    const fr = store().frames, i = fr.findIndex(f => f.id === id); if(i < 0) return;
    const f = fr.splice(i, 1)[0]; save(); sbRender();
    snack(L('Plan supprimé.', 'Shot deleted.'), () => { const a = store().frames; a.splice(Math.min(i, a.length), 0, f); save(); sbRender(); });
  }
  function lightbox(src){
    const d = document.createElement('div'); d.className = 'rp-lb rp-ui'; d.innerHTML = `<img src="${src}" alt="">`;
    const close = () => { d.remove(); document.removeEventListener('keydown', onKey, true); };
    const onKey = e => { if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(); } };
    d.addEventListener('click', close); document.addEventListener('keydown', onKey, true); document.body.appendChild(d);
  }

  /* ---- éditeur de dessin ---- */
  function drawOpen(page, frame){
    const old = $('rpDrawBg'); if(old) old.remove();
    const COLORS = ['#1b1b1f', '#3699D4', '#D64545', '#2E9E6B', '#E0A21B'];
    const bg = document.createElement('div'); bg.id = 'rpDrawBg'; bg.className = 'rp-draw-bg rp-ui';
    bg.innerHTML = `<div class="rp-draw" role="dialog" aria-modal="true">
      <div class="rp-draw-bar"><h3>${esc(frame ? L('Modifier le plan', 'Edit the shot') : L('Dessiner un plan', 'Draw a shot'))}</h3>
        ${COLORS.map((c, i) => `<button type="button" class="col${i ? '' : ' sel'}" data-col="${c}" style="background:${c}" title="${c}"></button>`).join('')}<i></i>
        <button type="button" data-size="3" class="sel" title="${esc(L('Fin', 'Thin'))}">${svg('<path d="M3 8h10" stroke-width="1.2"/>', 14)}</button>
        <button type="button" data-size="7" title="${esc(L('Moyen', 'Medium'))}">${svg('<path d="M3 8h10" stroke-width="2.6"/>', 14)}</button>
        <button type="button" data-size="14" title="${esc(L('Épais', 'Thick'))}">${svg('<path d="M3 8h10" stroke-width="4.6"/>', 14)}</button><i></i>
        <button type="button" data-tool="eraser" title="${esc(L('Gomme', 'Eraser'))}">${svg('<path d="M3 11l5-6 5 4-3.5 4H5.5L3 11zM6.5 8.2l4 3.2"/>', 14)}</button>
        <button type="button" data-a="undo" title="${esc(L('Annuler le dernier trait (Ctrl+Z)', 'Undo last stroke (Ctrl+Z)'))}">${svg('<path d="M4 7h6a3 3 0 0 1 0 6H6M4 7l2.5-2.5M4 7l2.5 2.5"/>', 14)}</button>
        <button type="button" data-a="clear" title="${esc(L('Tout effacer', 'Clear all'))}">${svg('<path d="M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.5 8h5l.5-8"/>', 14)}</button></div>
      <canvas width="960" height="540"></canvas>
      <div class="rp-draw-act"><button type="button" class="btn btn-ghost" data-a="cancel">${esc(L('Annuler', 'Cancel'))}</button>
        <button type="button" class="btn btn-primary" data-a="save">${esc(L('Enregistrer le plan', 'Save the shot'))}</button></div></div>`;
    document.body.appendChild(bg);
    const cv = bg.querySelector('canvas'), cx = cv.getContext('2d', { willReadFrequently:true });
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, 960, 540);
    if(frame){
      const im = new Image();
      im.onload = () => { const k = Math.min(960 / im.naturalWidth, 540 / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k; cx.drawImage(im, (960 - w) / 2, (540 - h) / 2, w, h); };
      im.src = frame.src;
    }
    let color = COLORS[0], size = 3, eraser = false, hist = [], last = null, prevMid = null, down = false, moved = false;
    const pt = e => { const r = cv.getBoundingClientRect(); return { x:(e.clientX - r.left) * 960 / r.width, y:(e.clientY - r.top) * 540 / r.height, p:(e.pointerType === 'pen' && e.pressure) ? e.pressure : 0.5 }; };
    const style = p => { cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = eraser ? '#fff' : color; cx.fillStyle = cx.strokeStyle; cx.lineWidth = (eraser ? size * 3 : size) * (p === 0.5 ? 1 : (0.5 + p)); };
    cv.addEventListener('pointerdown', e => {
      e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(err){}
      hist.push(cx.getImageData(0, 0, 960, 540)); if(hist.length > 30) hist.shift();
      const p = pt(e); style(p.p); down = true; moved = false; last = p; prevMid = p;
    });
    cv.addEventListener('pointermove', e => {
      if(!down) return; e.preventDefault(); moved = true;
      const p = pt(e), mid = { x:(last.x + p.x) / 2, y:(last.y + p.y) / 2 };
      style(p.p); cx.beginPath(); cx.moveTo(prevMid.x, prevMid.y); cx.quadraticCurveTo(last.x, last.y, mid.x, mid.y); cx.stroke();
      prevMid = mid; last = p;
    });
    const end = () => {
      if(!down) return; down = false;
      if(!moved){ cx.beginPath(); cx.arc(last.x, last.y, cx.lineWidth / 2, 0, Math.PI * 2); cx.fill(); }
      else { cx.beginPath(); cx.moveTo(prevMid.x, prevMid.y); cx.lineTo(last.x, last.y); cx.stroke(); }
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    const undo = () => { const h = hist.pop(); if(h) cx.putImageData(h, 0, 0); };
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey, true); };
    function onKey(e){
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(); return; }
      if((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z'){ e.preventDefault(); e.stopPropagation(); undo(); return; }
      e.stopPropagation();
    }
    document.addEventListener('keydown', onKey, true);
    bg.addEventListener('mousedown', e => { bg._d = e.target === bg; });
    bg.addEventListener('click', e => {
      if(e.target === bg && bg._d){ close(); return; }
      const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.col){ color = b.dataset.col; eraser = false; bg.querySelectorAll('[data-col]').forEach(x => x.classList.toggle('sel', x === b)); bg.querySelector('[data-tool]').classList.remove('sel'); }
      else if(b.dataset.size){ size = +b.dataset.size; bg.querySelectorAll('[data-size]').forEach(x => x.classList.toggle('sel', x === b)); }
      else if(b.dataset.tool){ eraser = !eraser; b.classList.toggle('sel', eraser); }
      else if(b.dataset.a === 'undo') undo();
      else if(b.dataset.a === 'clear'){ hist.push(cx.getImageData(0, 0, 960, 540)); cx.fillStyle = '#fff'; cx.fillRect(0, 0, 960, 540); }
      else if(b.dataset.a === 'cancel') close();
      else if(b.dataset.a === 'save'){
        const kind = frame ? frame.k : 'draw';
        const src = kind === 'img' ? cv.toDataURL('image/jpeg', 0.85) : cv.toDataURL('image/png');
        if(frame){ frame.src = src; } else store().frames.push({ id:uid(), pg:page, k:'draw', src, cap:'' });
        close(); save(); sbRender();
      }
    });
  }

  /* ---- événements de la colonne (délégation) ---- */
  const laneOf = el => { const l = el.closest('.rp-sb-lane'); return l ? parseInt(l.dataset.p, 10) : 1; };
  const frameOf = el => { const f = el.closest('.rp-sb-f'); return f ? store().frames.find(x => x.id === f.dataset.id) : null; };
  function menu(btn, page){
    const o = document.querySelector('.rp-sb-menu'); if(o) o.remove();
    const m = document.createElement('div'); m.className = 'rp-sb-menu rp-ui';
    m.innerHTML = `<button type="button" data-m="up">${svg('<path d="M8 11V3M5 6l3-3 3 3M3 13h10"/>', 14)} ${esc(L('Importer une image…', 'Import an image…'))}</button>
      <button type="button" data-m="draw">${svg('<path d="M3 13l.7-3L10.8 3a1.4 1.4 0 0 1 2 2L5.7 12.2 3 13z"/>', 14)} ${esc(L('Dessiner un plan…', 'Draw a shot…'))}</button>
      <button type="button" data-m="paste">${svg('<rect x="4" y="3.5" width="8" height="9.5" rx="1.4"/><path d="M6.5 3.5V2.5h3v1"/>', 14)} ${esc(L('Coller l\u2019image copiée', 'Paste copied image'))}</button>`;
    const r = btn.getBoundingClientRect();
    m.style.top = Math.round(Math.max(8, Math.min(window.innerHeight - 150, r.bottom + 6))) + 'px'; m.style.left = Math.round(Math.max(8, Math.min(window.innerWidth - 210, r.right - 200))) + 'px';
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-m]'); if(!b) return; m.remove();
      if(b.dataset.m === 'up') pickFile(page); else if(b.dataset.m === 'draw') drawOpen(page); else pasteImage(page);
    });
    document.body.appendChild(m);
    setTimeout(() => document.addEventListener('click', function off(e){ if(!m.contains(e.target)) { m.remove(); } document.removeEventListener('click', off, true); }, true), 0);
  }
  document.addEventListener('click', e => {
    const root = $('rpSb'); if(!root || !root.contains(e.target)) return;
    const a = e.target.closest('[data-a]'), add = e.target.closest('.rp-sb-add');
    if(add){ e.stopPropagation(); menu(add, laneOf(add)); return; }
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
    if(tf){ arr.splice(arr.indexOf(tf) + (after ? 1 : 0), 0, mv); mv.pg = tf.pg; }
    else { mv.pg = page; arr.push(mv); }
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
    if(!live()) return;
    if((e.ctrlKey || e.metaKey) && e.altKey && !e.shiftKey && e.code === 'KeyB'){ e.preventDefault(); e.stopPropagation(); sbToggle(); }
  }, true);

  /* menu ⋯ et liste des raccourcis */
  const __moreMenu82 = moreMenuHtml;
  moreMenuHtml = function(){
    let h = __moreMenu82.apply(this, arguments);
    const mark = '<div class="tb-more-title">' + L('Voix', 'Voice') + '</div>';
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
      if(g) g.insertAdjacentHTML('beforeend', `<div class="sc-row"><div class="sc-keys">${kb(['Ctrl/Cmd', 'Alt', 'B'])}</div><div class="sc-desc">${L('Afficher / masquer le storyboard en temps réel', 'Show / hide the live storyboard')}<span class="sc-note">${L('Une colonne à côté des pages : images ou dessins par page, légendes, glisser pour réordonner.', 'A column beside the pages: images or drawings per page, captions, drag to reorder.')}</span></div></div>`);
    }catch(err){}
    return r;
  };
  if(ACTIONS.openShortcuts) ACTIONS.openShortcuts = openShortcuts;

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

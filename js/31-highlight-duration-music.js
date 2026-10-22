/* =====================================================================
   V81 — SURLIGNAGE MÉMORISÉ · DURÉE ESTIMÉE · MUSIQUE YOUTUBE
   ---------------------------------------------------------------------
   Bloc ajouté en fin de script : aucune ligne existante n'est modifiée.
   Il se branche sur le reste par des écouteurs d'événements et par
   l'enrobage de deux fonctions d'affichage (menu ⋯, liste des raccourcis).

   1. SURLIGNAGE. Les surlignages sont rangés DANS les lignes du modèle
      (el.hl = [[début, fin, couleur], …]), donc sauvegardés avec le
      scénario (autosave, Drive, export JSON), restaurés par Ctrl+Z, et
      déplacés avec le texte quand on tape, coupe ou fusionne une ligne.
      Ils sont peints avec l'API CSS « Custom Highlight » : rien n'est
      écrit dans le contenu éditable, le curseur n'est jamais perturbé.
   2. DURÉE ESTIMÉE. Une petite pastille discrète, dans la marge basse de
      la page, recalculée en direct pendant la frappe.
   3. MUSIQUE. Un lien YouTube attaché à une ligne (S.project.music,
      rangé à part comme les commentaires). Repère ♪ dans la marge, clic
      pour ouvrir un petit lecteur flottant, déplaçable.
===================================================================== */
(function(){
  const $ = id => document.getElementById(id);
  const live = () => !!(S && S.view === 'editor' && S.project && S.tab === 'editor' && $('page'));
  const svg = (p, w) => `<svg width="${w||14}" height="${w||14}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;

  /* ---------- styles (injectés ici pour ne pas toucher à la feuille d'origine) ---------- */
  const st = document.createElement('style'); st.id = 'rpV81Style';
  st.textContent = `
  ::highlight(rp-hl-0){background-color:rgba(255,214,10,.55);}
  ::highlight(rp-hl-1){background-color:rgba(52,211,153,.42);}
  ::highlight(rp-hl-2){background-color:rgba(244,114,182,.38);}
  ::highlight(rp-hl-3){background-color:rgba(96,165,250,.42);}
  ::highlight(rp-hl-4){text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:2px;}
  ::highlight(rp-hl-5){text-shadow:.45px 0 0 currentColor, -.15px 0 0 currentColor;}

  .rp-hlbar{position:fixed; z-index:120; display:none; align-items:center; gap:5px; padding:5px 8px; border-radius:999px;
    background:var(--surface); border:1px solid var(--hair); box-shadow:var(--shadow-md); font-family:var(--sans);
    -webkit-user-select:none; user-select:none; animation:rpPop .14s ease;}
  .rp-hlbar.on{display:flex;}
  .rp-hlbar button{width:20px; height:20px; padding:0; border-radius:50%; border:1px solid rgba(0,0,0,.14); cursor:pointer; transition:transform .12s ease;}
  .rp-hlbar button:hover{transform:scale(1.2);}
  .rp-hlbar .rp-hl-x{background:transparent; color:var(--ink-soft); border:1.5px solid var(--hair); display:grid; place-items:center;}
  .rp-hlbar .rp-hl-u{background:transparent; color:var(--ink); border:1.5px solid var(--hair); font:700 11px/1 var(--sans); text-decoration:underline; display:grid; place-items:center;}
  .rp-hlbar .rp-hl-b{font-weight:900; text-decoration:none;}
  .rp-hlbar i{width:1px; height:16px; background:var(--hair); margin:0 2px;}
  @keyframes rpPop{from{opacity:0; transform:translateY(4px) scale(.96);} to{opacity:1; transform:none;}}

  .rp-rt{position:fixed; z-index:40; display:none; font-family:var(--sans); color:var(--ink-soft);
    -webkit-user-select:none; user-select:none; transition:opacity .35s ease;}
  .rp-rt.on{display:block;}
  .rp-rt.typing:not(:hover){opacity:.38;}
  .rp-rt-pill{display:flex; align-items:center; gap:7px; height:30px; padding:0 13px 0 10px; border-radius:999px;
    background:color-mix(in srgb, var(--surface) 86%, transparent); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px);
    border:1px solid var(--hair); box-shadow:var(--shadow-sm); font-size:12.5px; font-weight:600; font-variant-numeric:tabular-nums; cursor:default; white-space:nowrap;}
  .rp-rt-pill svg{color:var(--accent); flex:none;}
  .rp-rt-pill b{color:var(--ink); font-weight:700;}
  .rp-rt-card{position:absolute; left:0; bottom:38px; width:252px; padding:14px 16px 13px; border-radius:14px;
    background:var(--surface); color:var(--ink); border:1px solid var(--hair); box-shadow:var(--shadow-md);
    opacity:0; transform:translateY(6px); pointer-events:none; transition:opacity .16s ease, transform .16s ease;}
  .rp-rt:hover .rp-rt-card{opacity:1; transform:none;}
  .rp-rt-k{font-size:10.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-soft);}
  .rp-rt-big{font-size:26px; font-weight:700; letter-spacing:-.02em; margin:3px 0 10px; font-variant-numeric:tabular-nums;}
  .rp-rt-bar{display:flex; height:6px; border-radius:99px; overflow:hidden; background:var(--hair); gap:2px; margin-bottom:10px;}
  .rp-rt-bar span{display:block; height:100%; min-width:0; transition:flex-grow .3s ease;}
  .rp-rt-row{display:flex; align-items:center; gap:8px; font-size:12.5px; padding:2px 0;}
  .rp-rt-row i{width:8px; height:8px; border-radius:50%; flex:none;}
  .rp-rt-row em{margin-left:auto; font-style:normal; font-weight:600; font-variant-numeric:tabular-nums;}
  .rp-rt-foot{margin-top:9px; padding-top:9px; border-top:1px solid var(--hair); font-size:11.5px; line-height:1.45; color:var(--ink-soft);}

  .line[data-music]:after{content:'♪'; position:absolute; right:-1.9cm; top:.15em; width:1cm; height:.6cm; line-height:.6cm;
    text-align:center; font-size:9pt; font-weight:700; text-transform:none; color:#fff; background:#3699D4; border-radius:999px;
    cursor:pointer; -webkit-user-select:none; user-select:none; opacity:.92; box-shadow:0 1px 3px rgba(31,111,160,.4);}
  .line[data-music]:hover:after{opacity:1;}
  .line--character[data-contd][data-music]::after{content:" " attr(data-contd); position:static; width:auto; height:auto; line-height:inherit; background:none; color:inherit; font-size:inherit; font-weight:inherit; box-shadow:none; opacity:1; cursor:auto; border-radius:0;}
  .line[data-music][data-comment]:after{content:'💬 ♪'; width:1.75cm; right:-2.6cm; font-size:8.5pt;}

  .rp-mp{position:fixed; z-index:130; width:356px; border-radius:16px; overflow:hidden; background:#0f1115; color:#fff; font-family:var(--sans);
    box-shadow:0 18px 50px -12px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.09); animation:rpPop .2s ease;}
  .rp-mp-h{display:flex; align-items:center; gap:8px; height:38px; padding:0 6px 0 13px; cursor:grab; touch-action:none;
    background:linear-gradient(#1c1f27,#15171d); -webkit-user-select:none; user-select:none;}
  .rp-mp-h:active{cursor:grabbing;}
  .rp-mp-n{color:#6CB8E8; font-weight:700; font-size:14px; flex:none;}
  .rp-mp-t{flex:1; min-width:0; font-size:12.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; opacity:.94;}
  .rp-mp-h a, .rp-mp-h button{width:28px; height:28px; display:grid; place-items:center; border:0; border-radius:50%; background:none; color:#C9CEDB; cursor:pointer; text-decoration:none; flex:none;}
  .rp-mp-h a:hover, .rp-mp-h button:hover{background:rgba(255,255,255,.1); color:#fff;}
  .rp-mp iframe{display:block; width:356px; height:200px; border:0; background:#000;}

  .rp-yt-prev{display:none; gap:12px; align-items:center; margin:-4px 0 14px; padding:8px; border-radius:10px; background:var(--chip-bg); border:1px solid var(--hair);}
  .rp-yt-prev.on{display:flex;}
  .rp-yt-prev img{width:96px; height:54px; object-fit:cover; border-radius:6px; background:#000; flex:none;}
  .rp-yt-prev span{font-size:12.5px; color:var(--ink-soft); line-height:1.4;}

  @media (max-width:880px){ .rp-rt-pill{height:28px; padding:0 10px 0 8px;} .rp-mp{width:300px;} .rp-mp iframe{width:300px; height:169px;} }
  @media print{ .rp-rt, .rp-hlbar, .rp-mp{display:none !important;} }
  `;
  document.head.appendChild(st);

  /* =====================================================================
     1. SURLIGNAGE
  ===================================================================== */
  const HLAPI = (typeof Highlight !== 'undefined' && window.CSS && CSS.highlights) ? CSS.highlights : null;
  const HL = { colors:['#FFD60A','#34D399','#F472B6','#60A5FA'], hold:false };

  function hlNorm(arr, len){
    const out = arr.map(r => [Math.max(0, Math.min(len, r[0])), Math.max(0, Math.min(len, r[1])), r[2] | 0])
                   .filter(r => r[1] > r[0]).sort((a, b) => a[0] - b[0]);
    const m = [], last = {};
    out.forEach(r => {
      const l = last[r[2]];                          // fusion par couleur : les calques peuvent s'intercaler
      if(l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else { m.push(r); last[r[2]] = r; }
    });
    return m;
  }
  /* Calques indépendants : 0 = couleurs, 1 = soulignement (4), 2 = gras (5). */
  const hlLay = c => { c = Math.abs(c); return c === 4 ? 1 : c === 5 ? 2 : 0; };
  function hlCut(arr, s, e, lay){
    const out = [];
    arr.forEach(r => {
      if(hlLay(r[2]) !== (lay | 0) || r[1] <= s || r[0] >= e){ out.push(r); return; }   // v85 : couleur, soulignement et gras sont des calques indépendants
      if(r[0] < s) out.push([r[0], s, r[2]]);
      if(r[1] > e) out.push([e, r[1], r[2]]);
    });
    return out;
  }
  /* Recale les surlignages d'une ligne sur son texte actuel : on compare le
     texte au moment où ils ont été posés (el.hlT) et le texte d'aujourd'hui,
     quel que soit le chemin par lequel il a changé (frappe, collage,
     remplacement, annulation…). */
  function hlSync(el){
    if(!el.hl) return;
    const nt = el.text || '', ot = el.hlT == null ? nt : el.hlT;
    if(ot !== nt){
      const mo = Math.min(ot.length, nt.length);
      let p = 0; while(p < mo && ot.charCodeAt(p) === nt.charCodeAt(p)) p++;
      let s = 0; while(s < mo - p && ot.charCodeAt(ot.length - 1 - s) === nt.charCodeAt(nt.length - 1 - s)) s++;
      const oe = ot.length - s, ne = nt.length - s, d = nt.length - ot.length;
      const mp = (x, isStart) => x <= p ? x : (x >= oe ? x + d : (isStart ? ne : p));
      el.hl = el.hl.map(r => [mp(r[0], true), mp(r[1], false), r[2]]);
    }
    el.hl = hlNorm(el.hl, nt.length);
    el.hlT = nt;
    if(!el.hl.length){ delete el.hl; delete el.hlT; }
  }
  function hlRange(div, a, b){
    const w = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
    let n, pos = 0, sn = null, so = 0, en = null, eo = 0;
    while((n = w.nextNode())){
      const l = n.nodeValue.length;
      if(!sn && a <= pos + l){ sn = n; so = a - pos; }
      if(b <= pos + l){ en = n; eo = b - pos; break; }
      pos += l;
    }
    if(!sn || !en) return null;
    const r = document.createRange();
    try{ r.setStart(sn, so); r.setEnd(en, eo); }catch(e){ return null; }
    return r;
  }
  function hlPaint(){
    if(!HLAPI || HL.hold) return;
    const sets = [[], [], [], [], [], []];
    if(live()){
      const page = $('page');
      S.project.elements.forEach(el => {
        if(!el.hl || el.type === 'note') return;
        hlSync(el);
        if(!el.hl) return;
        const div = page.querySelector('.line[data-id="' + el.id + '"]');
        if(!div) return;
        el.hl.forEach(r => { const rg = hlRange(div, r[0], r[1]); if(rg && sets[r[2]]) sets[r[2]].push(rg); });
      });
    }
    sets.forEach((list, i) => {
      if(list.length) HLAPI.set('rp-hl-' + i, new Highlight(...list)); else HLAPI.delete('rp-hl-' + i);
    });
  }
  function hlApply(color){
    const sp = selectionSpan();
    if(!sp || !live()) return;
    const els = S.project.elements, ai = findIdx(sp.a.dataset.id), bi = findIdx(sp.b.dataset.id);
    if(ai < 0 || bi < 0 || bi < ai) return;
    pushUndo();
    for(let i = ai; i <= bi; i++){
      const el = els[i], len = (el.text || '').length;
      if(el.type === 'note'){ delete el.hl; delete el.hlT; continue; }   // v87 : les notes ne sont jamais surlignées
      const s = i === ai ? sp.aOff : 0, e = i === bi ? sp.bOff : len;
      if(e <= s) continue;
      hlSync(el);
      let arr = hlCut(el.hl || [], s, e, hlLay(color));
      if(color >= 0) arr.push([s, e, color]);
      arr = hlNorm(arr, len);
      if(arr.length){ el.hl = arr; el.hlT = el.text || ''; } else { delete el.hl; delete el.hlT; }
    }
    scheduleAutosave();
    try{ flushAutosave(); }catch(err){}                 // V82 : sauvegarde immédiate, un rechargement juste après ne perd plus rien
    hlPaint();
  }
  function hlCovered(sp, lay){
    const els = S.project.elements, ai = findIdx(sp.a.dataset.id), bi = findIdx(sp.b.dataset.id);
    if(ai < 0 || bi < ai) return false;
    let any = false;
    for(let i = ai; i <= bi; i++){
      const el = els[i], len = (el.text || '').length;
      if(el.type === 'note') continue;
      const s = i === ai ? sp.aOff : 0, e = i === bi ? sp.bOff : len;
      if(e <= s) continue;
      any = true;
      hlSync(el);
      const rs = (el.hl || []).filter(r => hlLay(r[2]) === (lay | 0)); let p = s;
      for(const r of rs){ if(r[1] <= p) continue; if(r[0] > p) break; p = r[1]; if(p >= e) break; }
      if(p < e) return false;
    }
    return any;
  }
  /* Entrée / Retour arrière / Suppr : couper ou fusionner une ligne change
     le nombre de lignes. On photographie l'état avant, puis on répartit les
     surlignages sur les bonnes lignes une fois le travail du code existant fait. */
  function hlReconcile(snap){
    try{
      if(!live()) return;
      const els = S.project.elements, now = new Map(els.map(x => [x.id, x])), old = new Map(snap.map(x => [x.id, x]));
      snap.forEach((o, i) => {                       // fusion : la ligne disparue rejoint celle du dessus
        if(now.has(o.id) || !o.hl || !i) return;
        const prev = snap[i - 1], sv = now.get(prev.id);
        if(!sv || (sv.text || '') !== prev.text + o.text) return;
        const base = prev.text.length, arr = (prev.hl || []).map(r => r.slice());
        o.hl.forEach(r => arr.push([r[0] + base, r[1] + base, r[2]]));
        sv.hl = hlNorm(arr, (sv.text || '').length); sv.hlT = sv.text || '';
        if(!sv.hl.length){ delete sv.hl; delete sv.hlT; }
      });
      snap.forEach(o => {                            // coupure : la fin du texte part sur la nouvelle ligne
        const e0 = now.get(o.id);
        if(!e0 || !o.hl || (e0.text || '') === o.text) return;
        const nx = els[els.indexOf(e0) + 1];
        if(!nx || old.has(nx.id) || (e0.text || '') + (nx.text || '') !== o.text) return;
        const c = (e0.text || '').length, head = [], tail = [];
        o.hl.forEach(r => {
          if(r[0] < c) head.push([r[0], Math.min(r[1], c), r[2]]);
          if(r[1] > c) tail.push([Math.max(r[0], c) - c, r[1] - c, r[2]]);
        });
        e0.hl = hlNorm(head, c); e0.hlT = e0.text || '';
        if(!e0.hl.length){ delete e0.hl; delete e0.hlT; }
        nx.hl = hlNorm(tail, (nx.text || '').length); nx.hlT = nx.text || '';
        if(!nx.hl.length){ delete nx.hl; delete nx.hlT; }
      });
    }catch(err){}
    HL.hold = false;
    hlPaint();
  }

  /* Petite barre de couleurs qui apparaît au-dessus d'une sélection. */
  let bar = null, barTimer = 0, mouseDown = false;
  function hlBar(){
    if(bar) return bar;
    bar = document.createElement('div'); bar.className = 'rp-hlbar rp-ui'; bar.id = 'rpHlBar';
    bar.innerHTML = HL.colors.map((c, i) => `<button type="button" data-c="${i}" style="background:${c}" title="${L('Surligner','Highlight')}"></button>`).join('') +
      `<i></i><button type="button" class="rp-hl-u rp-hl-b" data-c="5" title="${L('Gras (Ctrl+B)','Bold (Ctrl+B)')}">B</button><button type="button" class="rp-hl-u" data-c="4" title="${L('Souligner (Ctrl+U)','Underline (Ctrl+U)')}">U</button><button type="button" class="rp-hl-x" data-c="-1" title="${L('Retirer le surlignage','Remove highlight')}">${svg('<path d="M4 4l8 8M12 4l-8 8"/>', 10)}</button>`;
    bar.addEventListener('mousedown', e => e.preventDefault());       // garde la sélection intacte
    bar.addEventListener('click', e => {
      const b = e.target.closest('button[data-c]'); if(!b) return;
      let c = parseInt(b.dataset.c, 10);
      if(c === 4 || c === 5){ const sp = selectionSpan(); if(sp && hlCovered(sp, hlLay(c))) c = -c; }   // v85 : « U » / « B » posent la marque, ou la retirent si elle y est déjà
      hlApply(c);
      hlBarHide();
    });
    document.body.appendChild(bar);
    return bar;
  }
  function hlBarHide(){ if(bar) bar.classList.remove('on'); }
  window.rpHlRanges = el => { hlSync(el); return el.hl ? el.hl.map(r => r.slice()) : []; };   // v85 : lu par les exports
  function hlBarUpdate(){
    if(!HLAPI || !live()){ hlBarHide(); return; }
    const sel = window.getSelection();
    if(!sel || !sel.rangeCount || sel.isCollapsed || !sel.toString().trim()){ hlBarHide(); return; }
    const ae = document.activeElement;
    if(ae && ae.closest && ae.closest('#synPanel, .modal, input, textarea')){ hlBarHide(); return; }
    const sp = selectionSpan(); if(!sp){ hlBarHide(); return; }
    if(!sp.multi){ const e1 = S.project.elements[findIdx(sp.a.dataset.id)]; if(e1 && e1.type === 'note'){ hlBarHide(); return; } }   // v87 : pas de barre sur une note
    /* v86 : la barre se pose sur la partie VISIBLE de la sélection (zone du scénario à l'écran),
       pas sur sa toute première ligne — sinon, avec « tout sélectionner » depuis une page
       plus bas, elle partait loin au-dessus de l'écran. */
    const rects = sel.getRangeAt(0).getClientRects();
    const cpEl = document.getElementById('centerPane'), cb = cpEl ? cpEl.getBoundingClientRect() : null;
    const vTop = Math.max(cb ? cb.top : 0, 0), vBot = Math.min(cb ? cb.bottom : window.innerHeight, window.innerHeight);
    let r = null, big = null;
    for(let k = 0; k < rects.length; k++){
      const q = rects[k];
      if(!(q.width || q.height) || q.bottom <= vTop + 4 || q.top >= vBot - 4) continue;
      if(q.height <= 90){ r = q; break; }        // une ligne visible
      if(!big) big = q;                           // sinon un grand bloc qui traverse l'écran
    }
    if(!r && big) r = { left:big.left, width:big.width, top:Math.max(big.top, vTop), bottom:Math.min(big.bottom, vBot) };
    if(!r){ hlBarHide(); return; }
    const b = hlBar(); b.classList.add('on');
    const w = b.offsetWidth || 150;
    let x = r.left + r.width / 2 - w / 2, y = r.top - 42;
    if(y < vTop + 8) y = Math.max(r.bottom + 8, vTop + 8);
    y = Math.min(y, vBot - 50);
    x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
    b.style.left = Math.round(x) + 'px'; b.style.top = Math.round(y) + 'px';
  }
  function hlBarSchedule(){ clearTimeout(barTimer); barTimer = setTimeout(() => { if(!mouseDown) hlBarUpdate(); }, 220); }
  document.addEventListener('mousedown', e => { mouseDown = true; if(!(e.target.closest && e.target.closest('#rpHlBar'))) hlBarHide(); }, true);
  document.addEventListener('mouseup', () => { mouseDown = false; hlBarSchedule(); }, true);
  document.addEventListener('keyup', e => { if(e.shiftKey || e.key === 'Shift') hlBarSchedule(); }, true);
  document.addEventListener('selectionchange', () => { if(!mouseDown){ const s = window.getSelection(); if(!s || s.isCollapsed) hlBarHide(); } });
  document.addEventListener('scroll', hlBarHide, true);

  /* =====================================================================
     2. DURÉE ESTIMÉE (temps réel)
     Rythmes : dialogue ≈ 3 mots/s (180 mots/min, pauses comprises),
     action ≈ 5 mots/s, plus de petites pauses fixes. Étalonné pour tomber
     autour d'« une page ≈ une minute » sur un scénario classique, mais en
     tenant compte de ce qui est réellement écrit (une page de dialogues
     et une page d'action ne durent pas pareil).
  ===================================================================== */
  const RT = { el:null, sig:'', timer:0, typing:0, data:null };
  function rtFmt(sec){
    sec = Math.max(0, Math.round(sec));
    if(sec < 60) return sec + ' s';
    const m = Math.round(sec / 60);
    if(m < 60) return m + ' min';
    const h = Math.floor(m / 60), mm = m % 60;
    return h + ' h ' + (mm < 10 ? '0' : '') + mm;
  }
  function rtCompute(){
    if(!live()) return;
    let dlg = 0, act = 0, oth = 0, words = 0, scenes = 0;
    S.project.elements.forEach(el => {
      const t = (el.text || '').trim();
      const w = t ? t.split(/\s+/).length : 0;
      switch(el.type){
        case 'scene':         scenes++; oth += 2.5; break;
        case 'action':
        case 'text':          act += w / 5; words += w; break;
        case 'character':     if(t) oth += 0.4; break;
        case 'dialogue':      dlg += w / 3; words += w; break;
        case 'parenthetical': if(t) oth += 0.8; break;
        case 'transition':    if(t) oth += 1.2; break;
        case 'shot':          if(t) oth += 1; break;
        case 'card':          if(t) oth += 3; break;
        default: break;                                  // notes : jamais comptées
      }
    });
    const total = dlg + act + oth;
    RT.data = { dlg, act, oth, total, words, scenes, pages:(S.pagination && S.pagination.count) || 1 };
    rtDraw();
  }
  function rtEnsure(){
    if(RT.el) return RT.el;
    const d = document.createElement('div'); d.className = 'rp-rt rp-ui'; d.id = 'rpRuntime';
    d.innerHTML = `<div class="rp-rt-card"></div><div class="rp-rt-pill">${svg('<circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.3 1.4"/>', 15)}<span class="rp-rt-v"></span></div>`;
    document.body.appendChild(d);
    RT.el = d; return d;
  }
  function rtDraw(){
    const d = rtEnsure(), x = RT.data; if(!x) return;
    const v = d.querySelector('.rp-rt-v');
    const txt = '≈ ' + rtFmt(x.total);
    if(v.textContent !== txt) v.innerHTML = '<b>' + txt + '</b>';
    const tt = Math.max(1, x.total), pc = n => Math.max(0, n) / tt;
    const rows = [
      [L('Dialogues','Dialogue'), x.dlg, 'var(--accent)'],
      [L('Action & texte','Action & text'), x.act, 'var(--accent-2)'],
      [L('Scènes & pauses','Scenes & pauses'), x.oth, 'var(--ink-soft)']
    ];
    d.querySelector('.rp-rt-card').innerHTML =
      `<div class="rp-rt-k">${L('Durée estimée du film','Estimated running time')}</div>` +
      `<div class="rp-rt-big">${rtFmt(x.total)}</div>` +
      `<div class="rp-rt-bar">${rows.map(r => `<span style="flex-grow:${(pc(r[1]) * 100).toFixed(1)}; background:${r[2]}"></span>`).join('')}</div>` +
      rows.map(r => `<div class="rp-rt-row"><i style="background:${r[2]}"></i>${r[0]}<em>${rtFmt(r[1])}</em></div>`).join('') +
      `<div class="rp-rt-foot">${x.pages} ${L('pages','pages')} · ${x.scenes} ${L('scènes','scenes')} · ${x.words.toLocaleString(getLang()==='en'?'en-US':'fr-FR')} ${L('mots','words')}<br>` +
      `${L('Repère classique, 1 page ≈ 1 min : ','Classic rule, 1 page ≈ 1 min: ')}${rtFmt(x.pages * 60)}</div>`;
  }
  function rtPlace(){
    const d = rtEnsure();
    if(!live()){ d.classList.remove('on'); return; }
    const pane = $('centerPane'); if(!pane){ d.classList.remove('on'); return; }
    const r = pane.getBoundingClientRect();
    if(!d.classList.contains('on')) d.classList.add('on');      // réécrire la même classe relançait les observateurs du document
    const lx = Math.round(r.left + 16) + 'px', by = Math.round(window.innerHeight - r.bottom + 14) + 'px';
    if(d.style.left !== lx) d.style.left = lx;
    if(d.style.bottom !== by) d.style.bottom = by;
  }
  function rtWatch(){
    if(!live()) return;
    let n = 0; const els = S.project.elements;
    for(let i = 0; i < els.length; i++) n += (els[i].text || '').length + (els[i].type || '').length * 3;
    const sig = els.length + ':' + n + ':' + ((S.pagination && S.pagination.count) || 1);
    if(sig === RT.sig) return;
    const first = !RT.data;
    RT.sig = sig;
    clearTimeout(RT.timer);
    if(first) rtCompute(); else RT.timer = setTimeout(rtCompute, 250);
  }
  document.addEventListener('input', e => {
    if(!(e.target && e.target.closest && e.target.closest('#page'))) return;
    const d = rtEnsure(); if(!d.classList.contains('typing')) d.classList.add('typing');
    clearTimeout(RT.typing); RT.typing = setTimeout(() => d.classList.remove('typing'), 1700);
  }, true);

  /* =====================================================================
     3.  YOUTUBE
  ===================================================================== */
  function music(){ if(!S.project.music) S.project.music = {}; return S.project.music; }
  function ytTime(s){
    if(/^\d+$/.test(s)) return +s;
    const m = String(s).match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
    return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
  }
  function ytClock(t){ const m = Math.floor(t / 60), x = t % 60; return m + ':' + (x < 10 ? '0' : '') + x; }
  function ytParse(u){
    u = (u || '').trim(); if(!u) return null;
    let id = null, t = 0;
    if(/^[\w-]{11}$/.test(u)) id = u;
    else {
      let url; try{ url = new URL(/^https?:/i.test(u) ? u : 'https://' + u); }catch(e){ return null; }
      const h = url.hostname.replace(/^(www|m|music)\./, '');
      if(h === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
      else if(h === 'youtube.com' || h === 'youtube-nocookie.com'){
        if(url.pathname === '/watch') id = url.searchParams.get('v');
        else { const m = url.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]{11})/); if(m) id = m[2]; }
      }
      const tt = url.searchParams.get('t') || url.searchParams.get('start');
      if(tt) t = ytTime(tt);
    }
    return (id && /^[\w-]{11}$/.test(id)) ? { id, t } : null;
  }
  /* PERFORMANCE. Tourne à chaque image où le document bouge (donc à chaque frappe) : sans musique, ou quand
     rien n'a changé depuis la dernière passe (mêmes musiques, même éditeur, même nombre de lignes), on ne
     relit pas tout le scénario. */
  let MMK = '';
  function musicMarks(){
    if(!S.project) return;
    const page = $('page'), m = S.project.music || {};
    const k = page ? Object.keys(m).join(',') + '|' + pageLineCount() : '';
    if(page && page.__mmk === k && MMK === k) return;
    MMK = k; if(page) page.__mmk = k;
    document.querySelectorAll('#page .line[data-music]').forEach(d => { if(!m[d.dataset.id]){ delete d.dataset.music; S.musicMarkVer = (S.musicMarkVer || 0) + 1; } });
    if(!page) return;
    Object.keys(m).forEach(id => {
      const d = page.querySelector('.line[data-id="' + id + '"]');
      if(d && d.dataset.music !== '1'){ d.dataset.music = '1'; S.musicMarkVer = (S.musicMarkVer || 0) + 1; }   // relu par musicUi (32) : un repère posé ici doit recevoir son libellé
    });
  }
  function musicClose(){ const b = $('rpMusicBackdrop'); if(b) b.remove(); }
  function musicOpen(id){
    if(!live()) return;
    if(!id){ const f = focusedLine(); id = (f && f.dataset.id) || (typeof lastFocusedLineId !== 'undefined' ? lastFocusedLineId : null); }
    if(id && !findEl(id)) id = null;
    if(!id){ toast(L('Place d\u2019abord le curseur sur la ligne qui parle de la .', 'First place the cursor on the line that mentions the music.')); return; }
    const cur = music()[id] || null;
    musicClose();
    const html = `<div class="modal-backdrop" id="rpMusicBackdrop" data-act="rpMusicBg">
      <div class="modal" style="max-width:440px;" data-stop="1">
        <h2>${L('Musique YouTube','YouTube music')}</h2>
        <p style="font-size:13.5px;color:var(--ink-soft);margin:-8px 0 14px;">${L('Un repère ♪ apparaît dans la marge de cette ligne : un clic ouvre un petit lecteur. Visible uniquement dans l\u2019éditeur, jamais dans les exports.','A ♪ marker appears in this line\u2019s margin: one click opens a small player. Only visible in the editor, never in exports.')}</p>
        <div class="field"><label>${L('Lien YouTube','YouTube link')}</label><input type="text" id="rpYtUrl" placeholder="https://www.youtube.com/watch?v=…" value="${esc(cur ? 'https://youtu.be/' + cur.v + (cur.t ? '?t=' + cur.t : '') : '')}" autocomplete="off" spellcheck="false"></div>
        <div class="rp-yt-prev" id="rpYtPrev"><img alt=""><span></span></div>
        <div class="field"><label>${L('Nom affiché (facultatif)','Display name (optional)')}</label><input type="text" id="rpYtName" placeholder="${L('ex. Le thème de Léa','e.g. Léa\u2019s theme')}" value="${esc(cur && cur.n || '')}" autocomplete="off"></div>
        <div class="modal-actions">
          ${cur ? `<button class="btn btn-danger" data-act="rpMusicDel" data-id="${id}">${L('Retirer','Remove')}</button>` : ''}
          <button class="btn btn-ghost" data-act="rpMusicBgClose">${L('Annuler','Cancel')}</button>
          <button class="btn btn-primary" data-act="rpMusicSave" data-id="${id}">${L('Enregistrer','Save')}</button>
        </div>
      </div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const u = $('rpYtUrl'), prev = $('rpYtPrev');
    const upd = () => {
      const p = ytParse(u.value);
      prev.classList.toggle('on', !!(p || u.value.trim()));
      if(p){ prev.querySelector('img').style.display = ''; prev.querySelector('img').src = 'https://i.ytimg.com/vi/' + p.id + '/mqdefault.jpg'; prev.querySelector('span').textContent = L('Vidéo reconnue','Video recognised') + (p.t ? ' · ' + L('départ à ','starts at ') + ytClock(p.t) : ''); }
      else if(u.value.trim()){ prev.querySelector('img').style.display = 'none'; prev.querySelector('span').textContent = L('Lien non reconnu : colle l\u2019adresse d\u2019une vidéo YouTube.','Link not recognised: paste a YouTube video address.'); }
    };
    u.addEventListener('input', upd); upd();
    u.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); musicSave(id); } });
    u.focus(); u.select();
  }
  function musicSave(id){
    const u = $('rpYtUrl'), n = $('rpYtName');
    const raw = u ? u.value.trim() : '';
    if(!raw){ musicDel(id); return; }
    const p = ytParse(raw);
    if(!p){ toast(L('Lien YouTube non reconnu.', 'YouTube link not recognised.')); return; }
    music()[id] = { v:p.id, t:p.t || 0, n:(n ? n.value.trim() : '').slice(0, 80) };
    musicClose(); musicMarks(); scheduleAutosave();
    toast(L('Musique ajoutée à la ligne.', 'Music added to the line.'));
  }
  function musicDel(id){
    delete music()[id];
    if(MP.id === id) mpClose();
    musicClose(); musicMarks(); scheduleAutosave();
  }

  /* Lecteur flottant : un seul à la fois, déplaçable, fermé = musique coupée. */
  const MP = { el:null, id:null, drag:null };
  /* Copie dans le presse-papiers (avec repli pour les pages ouvertes en file:// ou sans HTTPS). */
  function rpCopy(txt, okMsg){
    const done = () => toast(okMsg);
    const fallback = () => {
      try{
        const t = document.createElement('textarea'); t.value = txt; t.setAttribute('readonly', '');
        t.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;'; document.body.appendChild(t);
        t.select(); const ok = document.execCommand('copy'); t.remove();
        if(ok) done(); else toast(L('Copie impossible : ', 'Couldn\u2019t copy: ') + txt);
      }catch(err){ toast(L('Copie impossible : ', 'Couldn\u2019t copy: ') + txt); }
    };
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done, fallback); } else fallback();
  }
  function mpClose(){ if(MP.el){ MP.el.remove(); MP.el = null; MP.id = null; } }
  function mpPlay(id){
    const m = music()[id]; if(!m) return;
    if(MP.el && MP.id === id){ mpClose(); return; }
    const keep = MP.el ? MP.el.getBoundingClientRect() : null;
    mpClose();
    const d = document.createElement('div'); d.className = 'rp-mp rp-ui'; d.dataset.id = id;
    const src = 'https://www.youtube-nocookie.com/embed/' + m.v + '?autoplay=1&rel=0&modestbranding=1&playsinline=1' + (m.t ? '&start=' + m.t : '');
    const link = 'https://www.youtube.com/watch?v=' + m.v + (m.t ? '&t=' + m.t + 's' : '');
    d.innerHTML = `<div class="rp-mp-h"><span class="rp-mp-n">♪</span><span class="rp-mp-t">${esc(m.n || L('Musique de la scène','Scene music'))}</span>` +
      `<button type="button" data-copy="1" title="${L('Copier le lien YouTube','Copy the YouTube link')}">${svg('<rect x="5.5" y="5.5" width="7.5" height="8" rx="1.4"/><path d="M10.5 5.5V4a1.4 1.4 0 0 0-1.4-1.4H4.4A1.4 1.4 0 0 0 3 4v6.2a1.4 1.4 0 0 0 1.4 1.4h1.1"/>', 13)}</button>` +
      `<button type="button" data-edit="1" title="${L('Changer le lien, le nom ou retirer la musique','Change the link, the name or remove the music')}">${svg('<path d="M3 13l.7-3L10.8 3a1.4 1.4 0 0 1 2 2L5.7 12.2 3 13z"/>', 13)}</button>` +
      `<a href="${link}" target="_blank" rel="noopener" title="${L('Ouvrir sur YouTube','Open on YouTube')}">${svg('<path d="M9 3h4v4M13 3L7.5 8.5M12 9.5V13H3V4h3.5"/>', 13)}</a>` +
      `<button type="button" data-x="1" title="${L('Fermer (coupe la musique)','Close (stops the music)')}">${svg('<path d="M4 4l8 8M12 4l-8 8"/>', 12)}</button></div>` +
      `<iframe src="${src}" title="YouTube" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    document.body.appendChild(d);
    MP.el = d; MP.id = id;
    const pr = $('centerPane') ? $('centerPane').getBoundingClientRect() : { right:window.innerWidth, bottom:window.innerHeight };
    const w = d.offsetWidth, h = d.offsetHeight;
    let x = keep ? keep.left : pr.right - w - 34, y = keep ? keep.top : pr.bottom - h - 56;
    x = Math.max(8, Math.min(window.innerWidth - w - 8, x)); y = Math.max(8, Math.min(window.innerHeight - h - 8, y));
    d.style.left = Math.round(x) + 'px'; d.style.top = Math.round(y) + 'px';
    const hd = d.querySelector('.rp-mp-h');
    d.querySelector('[data-x]').addEventListener('click', mpClose);
    d.querySelector('[data-copy]').addEventListener('click', () => rpCopy(link, L('Lien YouTube copié.', 'YouTube link copied.')));
    d.querySelector('[data-edit]').addEventListener('click', () => musicOpen(id));
    hd.addEventListener('pointerdown', e => {
      if(e.target.closest('a,button')) return;
      const r = d.getBoundingClientRect();
      MP.drag = { dx:e.clientX - r.left, dy:e.clientY - r.top };
      try{ hd.setPointerCapture(e.pointerId); }catch(err){}
      d.querySelector('iframe').style.pointerEvents = 'none';        // l'iframe ne doit pas avaler le glissement
    });
    hd.addEventListener('pointermove', e => {
      if(!MP.drag) return;
      const nx = Math.max(8, Math.min(window.innerWidth - d.offsetWidth - 8, e.clientX - MP.drag.dx));
      const ny = Math.max(8, Math.min(window.innerHeight - d.offsetHeight - 8, e.clientY - MP.drag.dy));
      d.style.left = Math.round(nx) + 'px'; d.style.top = Math.round(ny) + 'px';
    });
    const end = () => { MP.drag = null; const f = d.querySelector('iframe'); if(f) f.style.pointerEvents = ''; };
    hd.addEventListener('pointerup', end); hd.addEventListener('pointercancel', end);
  }
  /* Clic sur le repère ♪ (il est dessiné dans la marge, à droite de la ligne). */
  document.addEventListener('click', e => {
    const ln = e.target.closest && e.target.closest('#page .line[data-music]');
    if(!ln) return;
    const r = ln.getBoundingClientRect();
    if(e.clientX > r.right + 2){ e.preventDefault(); e.stopPropagation(); mpPlay(ln.dataset.id); }
  }, true);

  Object.assign(ACTIONS, {
    rpMusicOpen: id => musicOpen(id),
    rpMusicSave: id => musicSave(id),
    rpMusicDel: id => musicDel(id),
    rpMusicBgClose: () => musicClose(),
    rpMusicBg: (id, e) => { if(e.target.id === 'rpMusicBackdrop') musicClose(); }
  });

  /* =====================================================================
     RACCOURCIS, MENU ⋯ ET LISTE DES RACCOURCIS
  ===================================================================== */
  document.addEventListener('keydown', e => {
    if(!live()) return;
    const mod = e.ctrlKey || e.metaKey;
    if(mod && e.altKey && !e.shiftKey && e.code === 'KeyH'){                 // Ctrl/Cmd+Alt+H : surligner / retirer
      e.preventDefault(); e.stopPropagation();
      if(!HLAPI){ toast(L('Le surlignage n\u2019est pas pris en charge par ce navigateur.', 'Highlighting isn\u2019t supported by this browser.')); return; }
      const sp = selectionSpan();
      if(!sp || (!sp.multi && sp.aOff === sp.bOff)){ toast(L('Sélectionne d\u2019abord du texte à surligner.', 'First select some text to highlight.')); return; }
      hlApply(hlCovered(sp) ? -1 : 0); hlBarHide();
      return;
    }
    if(mod && !e.altKey && !e.shiftKey && String(e.key).toLowerCase() === 'u' && e.target && e.target.closest && e.target.closest('#page')){   // v85 : Ctrl/Cmd+U = souligner, mémorisé dans le scénario
      e.preventDefault(); e.stopPropagation();
      if(!HLAPI){ toast(L('Le soulignement n\u2019est pas pris en charge par ce navigateur.', 'Underlining isn\u2019t supported by this browser.')); return; }
      const sp = selectionSpan();
      if(!sp || (!sp.multi && sp.aOff === sp.bOff)){ toast(L('Sélectionne d\u2019abord du texte à souligner.', 'First select some text to underline.')); return; }
      hlApply(hlCovered(sp, 1) ? -4 : 4); hlBarHide();
      return;
    }
    if(mod && !e.altKey && !e.shiftKey && String(e.key).toLowerCase() === 'b' && e.target && e.target.closest && e.target.closest('#page')){   // Ctrl/Cmd+B = gras, mémorisé dans le scénario (le gras du navigateur, lui, se perdait)
      e.preventDefault(); e.stopPropagation();
      if(!HLAPI){ toast(L('Le gras n\u2019est pas pris en charge par ce navigateur.', 'Bold isn\u2019t supported by this browser.')); return; }
      const sp = selectionSpan();
      if(!sp || (!sp.multi && sp.aOff === sp.bOff)){ toast(L('Sélectionne d\u2019abord du texte à mettre en gras.', 'First select some text to make bold.')); return; }
      hlApply(hlCovered(sp, 2) ? -5 : 5); hlBarHide();
      return;
    }
    if(mod && e.altKey && !e.shiftKey && e.code === 'KeyY'){                 // Ctrl/Cmd+Alt+Y : musique YouTube
      e.preventDefault(); e.stopPropagation(); musicOpen(); return;
    }
    if(e.target && e.target.closest && e.target.closest('#page') && (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete')){
      if(!S.project.elements.some(x => x.hl)) return;
      const snap = S.project.elements.map(x => ({ id:x.id, text:x.text || '', hl:x.hl ? x.hl.map(r => r.slice()) : null }));
      HL.hold = true;
      setTimeout(() => hlReconcile(snap), 0);
    }
  }, true);

  const __moreMenu81 = moreMenuHtml;
  moreMenuHtml = function(){
    let h = __moreMenu81.apply(this, arguments);
    const mark = '<div class="tb-more-title">' + L('Analyse', 'Insights') + '</div>';
    const add = `<button class="btn" data-act="rpMusicOpen" title="Ctrl+Alt+Y">${svg('<path d="M6 12V4l7-1.5V10.5"/><circle cx="4.5" cy="12" r="1.7"/><circle cx="11.5" cy="10.5" r="1.7"/>', 16)} ${L('Musique sur la ligne…', 'YouTube music on the line…')}</button>`;
    const i = h.indexOf(mark);
    return i >= 0 ? h.slice(0, i) + add + h.slice(i) : h + add;
  };
  const __shortcuts81 = openShortcuts;
  openShortcuts = function(){
    const r = __shortcuts81.apply(this, arguments);
    try{
      const kb = ks => ks.map(k => `<span class="kbd">${k}</span>`).join('<span class="sc-plus">+</span>');
      const row = (keys, t, n) => `<div class="sc-row"><div class="sc-keys">${kb(keys)}</div><div class="sc-desc">${t}<span class="sc-note">${n}</span></div></div>`;
      const titles = document.querySelectorAll('#shortcutsBackdrop .sc-group-title');
      let g = null; titles.forEach(t => { if(/^(Annoter|Annotate)$/.test(t.textContent.trim())) g = t.parentElement; });
      if(g){
        g.insertAdjacentHTML('beforeend',
          row(['Ctrl/Cmd', 'Alt', 'H'], L('Surligner / retirer le surlignage', 'Highlight / remove highlight'), L('Sur le texte sélectionné. Une petite barre de couleurs apparaît aussi au-dessus de toute sélection. Le surlignage est sauvegardé avec le scénario et apparaît dans le PDF, l\u2019impression et le .fdx.', 'On the selected text. A small colour bar also appears above any selection. Highlights are saved with the screenplay and appear in the PDF, print and .fdx exports.')) +
          row(['Ctrl/Cmd', 'U'], L('Souligner / retirer le soulignement', 'Underline / remove underline'), L('Sur le texte sélectionné. Le soulignement est sauvegardé avec le scénario et apparaît dans les exports.', 'On the selected text. Underlining is saved with the screenplay and appears in exports.')) +
          row(['Ctrl/Cmd', 'Alt', 'Y'], L('Musique YouTube sur la ligne en cours', 'YouTube music on the current line'), L('Colle un lien YouTube : un repère ♪ apparaît dans la marge, un clic ouvre un petit lecteur déplaçable.', 'Paste a YouTube link: a ♪ marker appears in the margin, one click opens a small movable player.')));
      }
    }catch(err){}
    return r;
  };
  if(ACTIONS.openShortcuts) ACTIONS.openShortcuts = openShortcuts;

  /* =====================================================================
     BOUCLE DE MISE À JOUR : tout ce qui suit le contenu de la page
  ===================================================================== */
  let raf = 0;
  function tick(){
    if(raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      try{
        hlPaint(); musicMarks(); rtPlace(); rtWatch();
        if(!live() && MP.el) mpClose();
      }catch(err){}
    });
  }
  new MutationObserver(muts => {
    for(const m of muts){
      const n = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      if(!(n && n.closest && n.closest('.rp-ui'))){ tick(); return; }
    }
  }).observe(document.body, { childList:true, subtree:true, characterData:true });
  window.addEventListener('resize', tick);
  document.addEventListener('input', tick, true);
  tick();
})();


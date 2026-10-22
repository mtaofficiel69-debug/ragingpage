/* =====================================================================
   STORYBOARD — ONGLET À PART (colonne de gauche › Écrire › Storyboard)
   ---------------------------------------------------------------------
   Le storyboard quitte le côté des pages pour avoir sa propre place :
   • les plans sont rangés sous l'entête de leur scène (numéro, titre, page),
     en grandes vignettes 16:9 avec leur légende ; chaque scène a ses boutons
     « Image », « Dessin », « Coller » ; glisser un plan le déplace (dans la
     scène ou vers une autre) ; déposer un fichier image sur une scène l'ajoute ;
   • « Lecture auto » fait défiler tous les plans, du premier au dernier, au
     rythme choisi ; « Défilement manuel » laisse passer d'un plan à l'autre
     soi-même (flèches, clic, glisser du doigt). Les deux dans la même
     visionneuse : Espace bascule de l'un à l'autre ;
   • tout le reste (dessin, téléchargement, suppression annulable, cases à
     cocher) reprend les outils déjà en place (js/32, via window.RPSB).
   Les plans restent rangés dans S.project.storyboard (rien ne change dans les
   données ni dans les exports du scénario).
===================================================================== */
(function(){
  const R = () => window.RPSB;
  const $ = id => document.getElementById(id);
  const ONLY_KEY = 'scriptmm_sb_only', DUR_KEY = 'scriptmm_sb_dur', LOOP_KEY = 'scriptmm_sb_loop';
  const lsGet = (k, d) => { try{ const v = localStorage.getItem(k); return v == null ? d : v; }catch(e){ return d; } };
  const lsSet = (k, v) => { try{ localStorage.setItem(k, v); }catch(e){} };
  const plans = n => n + ' ' + (n > 1 ? L('plans', 'shots') : L('plan', 'shot'));
  const ic = (p, w) => R().svg(p, w);
  const I = {
    play:'<path d="M5 3.2v9.6L12.8 8z" fill="currentColor"/>',
    pause:'<path d="M5 3.5v9M11 3.5v9" stroke-width="2.2"/>',
    manual:'<path d="M2.5 8h11M5.5 5L2.5 8l3 3M10.5 5l3 3-3 3"/>',
    dl:'<path d="M8 2.5v8M5 7.5l3 3 3-3M3 13h10"/>',
    img:'<path d="M8 11V3M5 6l3-3 3 3M3 13h10"/>',
    draw:'<path d="M11.2 2.3a1.6 1.6 0 0 1 2.3 2.3L5.4 12.7l-2.9.8.8-2.9z"/>',
    paste:'<rect x="4" y="3.5" width="8" height="9.5" rx="1.4"/><path d="M6.5 3.5V2.5h3v1"/>',
    mv:'<path d="M5.5 3v10M3 5.5L5.5 3 8 5.5M10.5 13V3M8 10.5l2.5 2.5 2.5-2.5"/>',
    edit:'<path d="M3 13l.7-3L10.8 3a1.4 1.4 0 0 1 2 2L5.7 12.2 3 13z"/>',
    del:'<path d="M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.5 8h5l.5-8"/>',
    chk:'<path d="M4 8.5l2.5 2.5L12 5.5"/>',
    prev:'<path d="M10 3.5L5.5 8l4.5 4.5"/>', next:'<path d="M6 3.5l4.5 4.5L6 12.5"/>',
    first:'<path d="M4 3.5v9M11.5 3.5L7 8l4.5 4.5"/>', last:'<path d="M12 3.5v9M4.5 3.5L9 8l-4.5 4.5"/>',
    loop:'<path d="M3 7V6a2.5 2.5 0 0 1 2.5-2.5H12M10 1.5l2 2-2 2M13 9v1a2.5 2.5 0 0 1-2.5 2.5H4M6 14.5l-2-2 2-2"/>',
    full:'<path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/>',
    close:'<path d="M4 4l8 8M12 4l-8 8"/>'
  };

  /* ---------------- données : plans rangés par scène ---------------- */
  function groups(){
    const scs = R().sbScenes(), list = R().sbOrdered(), by = new Map();
    scs.forEach(s => by.set(s.id, { s, items:[] }));
    const orphans = new Map();   // pages sans scène (scénario sans entête)
    list.forEach(x => {
      if(x.sc && by.has(x.sc)) by.get(x.sc).items.push(x);
      else { if(!orphans.has(x.pg)) orphans.set(x.pg, []); orphans.get(x.pg).push(x); }
    });
    const out = scs.map(s => by.get(s.id));
    orphans.forEach((items, pg) => out.push({ s:{ id:'', num:'', title:L('Page ', 'Page ') + pg, from:pg, to:pg, page:true }, items }));
    out.sort((a, b) => a.s.from - b.s.from);
    return { groups:out, list };
  }

  /* ---------------- affichage de l'onglet ---------------- */
  function frameCard(x){
    const f = x.f, sel = R().SELS.has(f.id);
    return `<div class="sbt-f${sel ? ' sel' : ''}" data-id="${f.id}" data-sc="${esc(x.sc || '')}">
      <div class="sbt-img" draggable="true" title="${esc(L('Clique pour voir en grand · glisse pour déplacer', 'Click to view large · drag to move'))}">
        <img src="${f.src}" alt="" draggable="false" loading="lazy" decoding="async"><span class="sbt-num">${x.num}</span>
        <button type="button" class="sbt-chk" data-sb="sel" aria-pressed="${sel}" title="${esc(L('Cocher pour télécharger', 'Tick to download'))}">${ic(I.chk, 12)}</button>
        <div class="sbt-tools">
          <button type="button" data-sb="mv" title="${esc(L('Déplacer vers une autre scène…', 'Move to another scene…'))}">${ic(I.mv, 13)}</button>
          <button type="button" data-sb="dl" title="${esc(L('Télécharger ce plan…', 'Download this shot…'))}">${ic(I.dl, 13)}</button>
          <button type="button" data-sb="edit" title="${esc(L('Dessiner dessus / cadrer', 'Draw on it / frame it'))}">${ic(I.edit, 13)}</button>
          <button type="button" data-sb="del" title="${esc(L('Supprimer ce plan', 'Delete this shot'))}">${ic(I.del, 13)}</button>
        </div></div>
      <input class="sbt-cap" type="text" maxlength="200" placeholder="${esc(L('Légende (cadrage, mouvement…)', 'Caption (framing, movement…)'))}" value="${esc(f.cap || '')}">
    </div>`;
  }
  function addBtns(){
    return `<div class="sbt-addb">
      <button type="button" data-sb="add-img" title="${esc(L('Importer une ou plusieurs images', 'Import one or more pictures'))}"><i class="mi-img"></i><span>${esc(L('Image', 'Picture'))}</span></button>
      <button type="button" data-sb="add-draw" title="${esc(L('Dessiner un plan', 'Draw a shot'))}"><i class="mi-draw"></i><span>${esc(L('Dessin', 'Drawing'))}</span></button>
      <button type="button" data-sb="add-paste" title="${esc(L('Coller l’image copiée (ou Ctrl+V en survolant la scène)', 'Paste the copied picture (or Ctrl+V while hovering the scene)'))}"><i class="mi-paste"></i><span>${esc(L('Coller', 'Paste'))}</span></button></div>`;
  }
  window.renderStoryboard = function(){
    if(!R()) return '';
    const { groups:gs, list } = groups(), only = lsGet(ONLY_KEY, '0') === '1', n = list.length, nSel = R().SELS.size;
    const shown = gs.filter(g => !only || g.items.length);
    const body = shown.map(g => {
      const s = g.s, pages = s.from === s.to ? L('p. ', 'p. ') + s.from : L('p. ', 'p. ') + s.from + '–' + s.to;
      return `<section class="sbt-sc${g.items.length ? '' : ' empty'}" data-sc="${esc(s.id)}" data-pg="${s.from}">
        <header class="sbt-sh">${s.page ? '' : `<span class="sbt-n">${esc(String(s.num || ''))}</span>`}
          <span class="sbt-t"${s.page ? '' : ` data-sb="gosc" title="${esc(L('Aller à cette scène dans le scénario', 'Go to this scene in the screenplay'))}"`}>${esc(s.title)}</span>
          <span class="sbt-meta">${esc(pages)}${g.items.length ? ' · ' + esc(plans(g.items.length)) : ''}</span>
          ${g.items.length ? `<button type="button" class="sbt-playsc" data-sb="play-sc" title="${esc(L('Lire à partir de cette scène', 'Play from this scene'))}">${ic(I.play, 12)}</button>` : ''}
          ${addBtns()}</header>
        ${g.items.length ? `<div class="sbt-grid">${g.items.map(frameCard).join('')}</div>` : ''}
      </section>`;
    }).join('');
    const none = !gs.length ? `<div class="sbt-empty">${esc(L('Ton scénario n’a pas encore de scène. Ajoute une entête de scène dans l’éditeur : chaque scène aura ici sa place pour ses plans.', 'Your screenplay has no scene yet. Add a scene heading in the editor: each scene will get its place here for its shots.'))}</div>` : '';
    return `<div class="cards-toolbar sbt-bar"><div class="pane-title" style="margin:0;">${esc(L('Storyboard', 'Storyboard'))}${n ? ' — ' + esc(plans(n)) : ''}</div>
        <div class="sbt-acts">
          <button type="button" class="btn btn-sm btn-primary" data-sb="play"${n ? '' : ' disabled'} title="${esc(L('Fait défiler tous les plans, du premier au dernier, au rythme choisi', 'Plays every shot, first to last, at the pace you choose'))}">${ic(I.play, 13)} ${esc(L('Lecture auto', 'Auto play'))}</button>
          <button type="button" class="btn btn-sm" data-sb="manual"${n ? '' : ' disabled'} title="${esc(L('Passe d’un plan à l’autre toi-même (flèches, clic ou glisser)', 'Go from shot to shot yourself (arrows, click or swipe)'))}">${ic(I.manual, 13)} ${esc(L('Défilement manuel', 'Manual'))}</button>
          <button type="button" class="btn btn-sm" data-sb="dlall"${n ? '' : ' disabled'} title="${esc(L('Télécharger les plans (PNG ou PDF)…', 'Download the shots (PNG or PDF)…'))}">${ic(I.dl, 13)} ${esc(L('Télécharger', 'Download'))}</button>
        </div></div>
      <div class="cards-hint sbt-hint"><span>${esc(L('Chaque scène a sa place : ajoute une image ou un dessin, glisse un plan pour le déplacer, clique dessus pour le voir en grand.', 'Each scene has its place: add a picture or a drawing, drag a shot to move it, click it to view it large.'))}</span>
        <span class="sbt-filters">${nSel ? `<button type="button" class="sbt-pill on" data-sb="clearsel" title="${esc(L('Tout décocher', 'Clear the selection'))}">${nSel} ${esc(nSel > 1 ? L('cochés', 'selected') : L('coché', 'selected'))} ✕</button>` : ''}
        <button type="button" class="sbt-pill${only ? ' on' : ''}" data-sb="only" aria-pressed="${only}">${esc(L('Seulement les scènes avec des plans', 'Only scenes with shots'))}</button></span></div>
      <div class="sbt-wrap" id="sbtWrap">${body}${none}${only && !shown.length && gs.length ? `<div class="sbt-empty">${esc(L('Aucun plan pour l’instant. Décoche le filtre pour voir toutes les scènes et leur ajouter des plans.', 'No shot yet. Turn the filter off to see every scene and add shots to them.'))}</div>` : ''}</div>`;
  };
  function refresh(keepScroll){
    if(!(S && S.view === 'editor' && S.tab === 'storyboard')) return;
    const c = $('centerPane'); if(!c) return;
    const y = c.scrollTop, act = document.activeElement, capId = act && act.classList && act.classList.contains('sbt-cap') ? act.closest('.sbt-f').dataset.id : null;
    c.innerHTML = renderStoryboard();
    if(keepScroll !== false) c.scrollTop = y;
    if(capId){ const i = c.querySelector('.sbt-f[data-id="' + capId + '"] .sbt-cap'); if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
  }
  window.sbTabRefresh = () => refresh(true);
  const flash = id => { const el = document.querySelector('#sbtWrap .sbt-f[data-id="' + id + '"]'); if(!el) return; el.scrollIntoView({ block:'nearest', behavior:'smooth' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1300); };

  const frameById = id => R().store().frames.find(f => f.id === id);
  const sceneOfEl = el => { const s = el.closest('.sbt-sc'); return s ? { sc:s.dataset.sc, pg:parseInt(s.dataset.pg, 10) || 1 } : { sc:'', pg:1 }; };
  /* place un plan dans une scène : il garde sa page si elle appartient à la scène, sinon prend la 1re page de la scène */
  function placeIn(f, sc, pg){
    const s = R().sbScenes().find(x => x.id === sc);
    if(s){ const p = parseInt(f.pg, 10) || 1; f.pg = (s.from <= p && p <= s.to) ? p : s.from; f.sc = s.id; }
    else { f.pg = pg; delete f.sc; }
  }
  function moveTo(f, sc, pg, before, after){
    const arr = R().store().frames, i = arr.indexOf(f); if(i < 0) return;
    const was = { pg:f.pg, sc:f.sc, i };
    arr.splice(i, 1);
    if(before){ arr.splice(arr.indexOf(before), 0, f); }
    else if(after){ arr.splice(arr.indexOf(after) + 1, 0, f); }
    else arr.push(f);
    placeIn(f, sc, pg);
    if(before || after){ const t = before || after; f.pg = t.pg; if(t.sc) f.sc = t.sc; }
    R().save(); refresh(); flash(f.id);
    return was;
  }

  /* ---------------- menu « déplacer vers une scène » ---------------- */
  function moveMenu(btn, f){
    const o = document.querySelector('.sbt-menu'); if(o) o.remove();
    const scs = R().sbScenes(), cur = (btn.closest('.sbt-f') || {}).dataset ? btn.closest('.sbt-f').dataset.sc : '';
    const m = document.createElement('div'); m.className = 'sbt-menu rp-ui';
    m.innerHTML = `<h4>${esc(L('Déplacer vers la scène', 'Move to scene'))}</h4><div class="s">${scs.map(s => `<button type="button" data-msc="${esc(s.id)}"${s.id === cur ? ' class="cur" aria-current="true"' : ''} title="${esc(s.title)}"><b>${esc(String(s.num || ''))}</b>${esc(s.title)}</button>`).join('') || `<p>${esc(L('Aucune scène.', 'No scene.'))}</p>`}</div>`;
    const r = btn.getBoundingClientRect();
    document.body.appendChild(m);
    const h = m.offsetHeight;
    m.style.top = Math.round(Math.max(8, Math.min(window.innerHeight - h - 8, r.bottom + 6))) + 'px';
    m.style.left = Math.round(Math.max(8, Math.min(window.innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth))) + 'px';
    const c = m.querySelector('.cur'); if(c) c.scrollIntoView({ block:'center' });
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-msc]'); if(!b) return; m.remove();
      if(b.dataset.msc === cur) return;
      const s = scs.find(x => x.id === b.dataset.msc);
      const was = moveTo(f, s.id, s.from);
      R().snack(L('Plan déplacé vers la scène ', 'Shot moved to scene ') + (s.num || s.title) + '.', () => {
        const arr = R().store().frames, j = arr.indexOf(f); if(j >= 0) arr.splice(j, 1);
        arr.splice(Math.min(was.i, arr.length), 0, f); f.pg = was.pg; if(was.sc) f.sc = was.sc; else delete f.sc;
        R().save(); refresh(); flash(f.id);
      });
    });
    setTimeout(() => document.addEventListener('mousedown', function off(e){ if(!m.contains(e.target)){ m.remove(); document.removeEventListener('mousedown', off, true); } }, true), 0);
  }

  /* ---------------- clics de l'onglet ---------------- */
  document.addEventListener('click', e => {
    const wrap = e.target.closest && e.target.closest('#centerPane');
    if(!wrap || S.tab !== 'storyboard' || !R()) return;
    const b = e.target.closest('[data-sb]');
    if(!b){
      const im = e.target.closest('.sbt-img');
      if(im){ const list = R().sbOrdered(), i = list.findIndex(x => x.f.id === im.closest('.sbt-f').dataset.id); openViewer(Math.max(0, i), false); }
      return;
    }
    const a = b.dataset.sb, fEl = b.closest('.sbt-f'), f = fEl ? frameById(fEl.dataset.id) : null, where = sceneOfEl(b);
    if(a === 'play' || a === 'manual') openViewer(0, a === 'play');
    else if(a === 'play-sc'){ const list = R().sbOrdered(), i = list.findIndex(x => x.sc === where.sc); openViewer(Math.max(0, i), true); }
    else if(a === 'dlall') R().dlOpen();
    else if(a === 'only'){ lsSet(ONLY_KEY, lsGet(ONLY_KEY, '0') === '1' ? '0' : '1'); refresh(); }
    else if(a === 'clearsel'){ R().SELS.clear(); refresh(); }
    else if(a === 'add-img') R().pickFile(where.pg, where.sc || undefined);
    else if(a === 'add-draw') R().drawOpen(where.pg, undefined, where.sc || undefined);
    else if(a === 'add-paste') R().pasteImage(where.pg, where.sc || undefined);
    else if(a === 'gosc'){
      const s = R().sbScenes().find(x => x.id === where.sc); switchTab('editor'); if(!s || !s.eid) return;
      let n = 0; const tryJump = () => { if(S.tab !== 'editor') return; if(document.querySelector('#page [data-id="' + s.eid + '"]')){ try{ jumpToScene(s.eid); }catch(err){} } else if(++n < 40) setTimeout(tryJump, 50); };
      setTimeout(tryJump, 60);
    }
    else if(!f) return;
    else if(a === 'sel'){ if(R().SELS.has(f.id)) R().SELS.delete(f.id); else R().SELS.add(f.id); refresh(); }
    else if(a === 'mv') moveMenu(b, f);
    else if(a === 'dl') R().dlOpen(f.id);
    else if(a === 'edit') R().drawOpen(f.pg, f);
    else if(a === 'del') R().delFrame(f.id);
  });
  document.addEventListener('input', e => {
    if(!e.target.classList || !e.target.classList.contains('sbt-cap')) return;
    const f = frameById(e.target.closest('.sbt-f').dataset.id); if(f){ f.cap = e.target.value; R().save(); }
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Enter' && e.target.classList && e.target.classList.contains('sbt-cap')){ e.preventDefault(); e.target.blur(); }
  });

  /* ---------------- glisser-déposer ---------------- */
  let drag = null;
  const clearMarks = () => document.querySelectorAll('#sbtWrap .over-b, #sbtWrap .over-a, #sbtWrap .drop').forEach(x => x.classList.remove('over-b', 'over-a', 'drop'));
  document.addEventListener('dragstart', e => {
    const im = e.target.closest && e.target.closest('#sbtWrap .sbt-img'); if(!im) return;
    drag = im.closest('.sbt-f').dataset.id;
    try{ e.dataTransfer.setData('text/plain', 'sbt:' + drag); e.dataTransfer.effectAllowed = 'move'; }catch(err){}
    im.closest('.sbt-f').classList.add('dragging');
  });
  document.addEventListener('dragend', () => { drag = null; clearMarks(); document.querySelectorAll('#sbtWrap .dragging').forEach(x => x.classList.remove('dragging')); });
  document.addEventListener('dragover', e => {
    const w = $('sbtWrap'); if(!w || !w.contains(e.target)) return;
    const files = e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0;
    if(!drag && !files) return;
    e.preventDefault(); clearMarks();
    const card = e.target.closest('.sbt-f'), sec = e.target.closest('.sbt-sc');
    if(card && drag && card.dataset.id !== drag){ const r = card.getBoundingClientRect(); card.classList.add(e.clientX > r.left + r.width / 2 ? 'over-a' : 'over-b'); }
    else if(sec) sec.classList.add('drop');
    const cp = $('centerPane'), r = cp.getBoundingClientRect();   // près du haut ou du bas : la page défile toute seule
    if(e.clientY < r.top + 70) cp.scrollTop -= 18; else if(e.clientY > r.bottom - 70) cp.scrollTop += 18;
  });
  document.addEventListener('drop', e => {
    const w = $('sbtWrap'); if(!w || !w.contains(e.target)) return;
    const sec = e.target.closest('.sbt-sc'); if(!sec){ clearMarks(); return; }
    const where = sceneOfEl(sec);
    if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length){ e.preventDefault(); clearMarks(); R().addFiles(e.dataTransfer.files, where.pg, where.sc || undefined); return; }
    if(!drag) return; e.preventDefault();
    const f = frameById(drag), card = e.target.closest('.sbt-f'); clearMarks(); if(!f) return;
    let before = null, after = null;
    if(card && card.dataset.id !== drag){ const t = frameById(card.dataset.id), r = card.getBoundingClientRect(); if(e.clientX > r.left + r.width / 2) after = t; else before = t; }
    moveTo(f, where.sc, where.pg, before, after); drag = null;
  });
  /* Ctrl+V en survolant une scène : l'image copiée s'y ajoute */
  let hoverSc = null;
  document.addEventListener('mousemove', e => { const s = e.target.closest && e.target.closest('#sbtWrap .sbt-sc'); hoverSc = s ? sceneOfEl(s) : null; });
  document.addEventListener('paste', e => {
    if(!hoverSc || S.tab !== 'storyboard' || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return;
    const files = Array.from((e.clipboardData && e.clipboardData.files) || []).filter(f => /^image\//.test(f.type));
    if(files.length){ e.preventDefault(); R().addFiles(files, hoverSc.pg, hoverSc.sc || undefined); }
  }, true);

  /* =====================================================================
     VISIONNEUSE : lecture auto (au rythme choisi) ou défilement manuel
  ===================================================================== */
  const V = { list:[], i:0, playing:false, t:0, el:null, dur:3, loop:false, startAt:0, left:0 };
  const DURS = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 15];
  function fmtDur(d){ return (Math.round(d * 10) / 10).toString().replace('.', getLang() === 'en' ? '.' : ',') + ' s'; }
  function openViewer(i, play){
    V.list = R().sbOrdered(); if(!V.list.length) return;
    const scs = R().sbScenes(); V.scs = {}; scs.forEach(s => { V.scs[s.id] = s; });
    V.dur = Math.max(0.5, Math.min(30, parseFloat(lsGet(DUR_KEY, '3')) || 3)); V.loop = lsGet(LOOP_KEY, '0') === '1';
    closeViewer();
    const d = document.createElement('div'); d.className = 'sbv rp-ui'; d.id = 'sbViewer'; d.tabIndex = -1;
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', L('Lecture du storyboard', 'Storyboard playback'));
    d.innerHTML = `<div class="sbv-top"><div class="sbv-info"><b class="sbv-pos"></b><span class="sbv-sc"></span></div>
        <div class="sbv-tr"><button type="button" data-v="full" title="${esc(L('Plein écran (F)', 'Full screen (F)'))}">${ic(I.full, 15)}</button>
        <button type="button" data-v="close" title="${esc(L('Fermer (Échap)', 'Close (Esc)'))}">${ic(I.close, 15)}</button></div></div>
      <div class="sbv-stage"><button type="button" class="sbv-nav p" data-v="prev" aria-label="${esc(L('Plan précédent', 'Previous shot'))}">${ic(I.prev, 22)}</button>
        <div class="sbv-frame"></div>
        <button type="button" class="sbv-nav n" data-v="next" aria-label="${esc(L('Plan suivant', 'Next shot'))}">${ic(I.next, 22)}</button></div>
      <div class="sbv-cap"></div>
      <div class="sbv-ctrl">
        <div class="sbv-prog" title="${esc(L('Clique pour aller à un plan', 'Click to go to a shot'))}"><div class="sbv-segs"></div></div>
        <div class="sbv-row">
          <div class="sbv-g">
            <button type="button" data-v="first" title="${esc(L('Premier plan (Début)', 'First shot (Home)'))}">${ic(I.first, 15)}</button>
            <button type="button" data-v="prev" title="${esc(L('Précédent (←)', 'Previous (←)'))}">${ic(I.prev, 15)}</button>
            <button type="button" class="sbv-play" data-v="toggle" title="${esc(L('Lecture auto / pause (Espace)', 'Auto play / pause (Space)'))}"></button>
            <button type="button" data-v="next" title="${esc(L('Suivant (→)', 'Next (→)'))}">${ic(I.next, 15)}</button>
            <button type="button" data-v="last" title="${esc(L('Dernier plan (Fin)', 'Last shot (End)'))}">${ic(I.last, 15)}</button></div>
          <div class="sbv-mode"></div>
          <div class="sbv-g"><span class="sbv-l">${esc(L('Durée d’un plan', 'Time per shot'))}</span>
            <button type="button" data-v="slower" title="${esc(L('Plus court (−)', 'Shorter (−)'))}">−</button><b class="sbv-dur"></b>
            <button type="button" data-v="faster" title="${esc(L('Plus long (+)', 'Longer (+)'))}">+</button>
            <button type="button" class="sbv-loop" data-v="loop" title="${esc(L('Recommencer au début après le dernier plan', 'Start over after the last shot'))}">${ic(I.loop, 15)}<span>${esc(L('En boucle', 'Loop'))}</span></button></div>
        </div>
        <div class="sbv-strip"></div>
      </div>`;
    document.body.appendChild(d); V.el = d;
    d.querySelector('.sbv-frame').dataset.end = L('Fin', 'The end');
    const segs = d.querySelector('.sbv-segs'), strip = d.querySelector('.sbv-strip');
    segs.innerHTML = V.list.map((x, k) => `<i data-k="${k}"><b></b></i>`).join('');
    strip.innerHTML = V.list.map((x, k) => `<button type="button" data-k="${k}" title="${esc(L('Plan ', 'Shot ') + x.num)}"><img src="${x.f.src}" alt=""><span>${x.num}</span></button>`).join('');
    d.addEventListener('click', onViewerClick);
    d.addEventListener('pointerdown', onSwipeStart);
    document.addEventListener('keydown', onViewerKey, true);
    document.addEventListener('fullscreenchange', syncFull);
    V.i = Math.max(0, Math.min(V.list.length - 1, i));
    show(V.i, 0);
    setPlaying(!!play);
    d.focus();
  }
  function closeViewer(){
    if(!V.el) return;
    clearTimeout(V.t); V.playing = false;
    if(document.fullscreenElement === V.el){ try{ document.exitFullscreen(); }catch(e){} }
    V.el.remove(); V.el = null;
    document.removeEventListener('keydown', onViewerKey, true);
    document.removeEventListener('fullscreenchange', syncFull);
  }
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* dir : 1 = vers la droite (suivant), -1 = précédent, 0 = sans animation */
  function show(i, dir){
    const d = V.el; if(!d) return;
    V.i = i; const x = V.list[i], fr = d.querySelector('.sbv-frame');
    const img = document.createElement('img'); img.src = x.f.src; img.alt = ''; img.draggable = false;
    const olds = Array.from(fr.querySelectorAll('img'));
    if(dir && olds.length && !reduced()){
      img.className = 'in ' + (dir > 0 ? 'from-r' : 'from-l');
      fr.appendChild(img);
      olds.forEach(o => { o.className = 'out ' + (dir > 0 ? 'to-l' : 'to-r'); setTimeout(() => o.remove(), 420); });
      requestAnimationFrame(() => requestAnimationFrame(() => { img.className = 'in'; }));
    } else { olds.forEach(o => o.remove()); img.className = 'in'; fr.appendChild(img); }
    const s = x.sc && V.scs[x.sc];
    d.querySelector('.sbv-pos').textContent = L('Plan ', 'Shot ') + x.num + ' / ' + V.list.length;
    d.querySelector('.sbv-sc').textContent = (s ? (s.num ? L('Scène ', 'Scene ') + s.num + ' — ' : '') + s.title + ' · ' : '') + L('page ', 'page ') + x.pg;
    const cap = d.querySelector('.sbv-cap'); cap.textContent = x.f.cap || ''; cap.classList.toggle('none', !x.f.cap);
    d.querySelectorAll('.sbv-segs i').forEach((el, k) => { el.className = k < i ? 'done' : k === i ? 'cur' : ''; const b = el.firstChild; b.style.transition = 'none'; b.style.width = k < i ? '100%' : '0'; });
    d.querySelectorAll('.sbv-strip button').forEach((el, k) => el.classList.toggle('cur', k === i));
    const cb = d.querySelector('.sbv-strip button.cur'); if(cb) cb.scrollIntoView({ block:'nearest', inline:'center', behavior:reduced() ? 'auto' : 'smooth' });
    d.querySelector('.sbv-nav.p').disabled = i === 0 && !V.loop;
    d.querySelector('.sbv-nav.n').disabled = i === V.list.length - 1 && !V.loop;
    if(V.playing) arm(V.dur * 1000);
  }
  /* minuterie du plan en cours ; la barre de progression du plan avance au même rythme */
  function arm(ms){
    clearTimeout(V.t); V.startAt = performance.now(); V.left = ms;
    const seg = V.el && V.el.querySelector('.sbv-segs i.cur b');
    if(seg){
      const done = 1 - ms / (V.dur * 1000);
      seg.style.transition = 'none'; seg.style.width = (done * 100) + '%';
      void seg.offsetWidth; seg.style.transition = 'width ' + ms + 'ms linear'; seg.style.width = '100%';
    }
    V.t = setTimeout(() => {
      if(!V.playing) return;
      if(V.i < V.list.length - 1) show(V.i + 1, 1);
      else if(V.loop) show(0, 1);
      else { setPlaying(false); V.el.classList.add('ended'); }
    }, ms);
  }
  function setPlaying(on){
    const d = V.el; if(!d) return;
    if(on && V.i === V.list.length - 1 && d.classList.contains('ended')){ d.classList.remove('ended'); show(0, 0); }
    d.classList.remove('ended');
    V.playing = on;
    const b = d.querySelector('.sbv-play');
    b.innerHTML = ic(on ? I.pause : I.play, 18) + '<span>' + esc(on ? L('Pause', 'Pause') : L('Lecture auto', 'Auto play')) + '</span>';
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    d.querySelector('.sbv-mode').innerHTML = on ? '<span class="sbv-badge on">' + esc(L('Lecture auto', 'Auto play')) + '</span>' : '<span class="sbv-badge">' + esc(L('Défilement manuel', 'Manual')) + '</span>';
    d.querySelector('.sbv-dur').textContent = fmtDur(V.dur);
    d.querySelector('.sbv-loop').classList.toggle('on', V.loop); d.querySelector('.sbv-loop').setAttribute('aria-pressed', V.loop ? 'true' : 'false');
    const seg = d.querySelector('.sbv-segs i.cur b');
    if(on) arm(V.dur * 1000);
    else { clearTimeout(V.t); if(seg){ const w = getComputedStyle(seg).width; seg.style.transition = 'none'; seg.style.width = w; } }
  }
  function go(k, dir){
    const n = V.list.length;
    if(k < 0){ if(!V.loop) return; k = n - 1; }
    if(k >= n){ if(!V.loop) return; k = 0; }
    if(k === V.i) return;
    if(V.el) V.el.classList.remove('ended');
    show(k, dir == null ? (k > V.i ? 1 : -1) : dir);
  }
  function setDur(dir){
    let i = DURS.findIndex(x => x >= V.dur - 0.01); if(i < 0) i = DURS.length - 1;
    i = Math.max(0, Math.min(DURS.length - 1, (DURS[i] > V.dur + 0.01 && dir < 0) ? i - 1 : i + dir));
    V.dur = DURS[i]; lsSet(DUR_KEY, String(V.dur));
    V.el.querySelector('.sbv-dur').textContent = fmtDur(V.dur);
    if(V.playing) arm(V.dur * 1000);
  }
  function toggleFull(){
    const d = V.el; if(!d) return;
    try{ if(document.fullscreenElement) document.exitFullscreen(); else if(d.requestFullscreen) d.requestFullscreen(); }catch(e){}
  }
  function syncFull(){ if(V.el) V.el.classList.toggle('fs', document.fullscreenElement === V.el); }
  function onViewerClick(e){
    const b = e.target.closest('[data-v], [data-k]');
    if(!b){
      if(e.target.closest('.sbv-frame') && !V.swiped){ const r = e.target.closest('.sbv-frame').getBoundingClientRect(); go(V.i + (e.clientX > r.left + r.width / 2 ? 1 : -1)); }
      return;
    }
    if(b.dataset.k != null){ const k = +b.dataset.k; if(k !== V.i) show(k, k > V.i ? 1 : -1); return; }
    const v = b.dataset.v;
    if(v === 'close') closeViewer();
    else if(v === 'full') toggleFull();
    else if(v === 'toggle') setPlaying(!V.playing);
    else if(v === 'prev') go(V.i - 1, -1);
    else if(v === 'next') go(V.i + 1, 1);
    else if(v === 'first'){ if(V.i) show(0, -1); }
    else if(v === 'last'){ if(V.i !== V.list.length - 1) show(V.list.length - 1, 1); }
    else if(v === 'slower') setDur(-1);
    else if(v === 'faster') setDur(1);
    else if(v === 'loop'){ V.loop = !V.loop; lsSet(LOOP_KEY, V.loop ? '1' : '0'); b.classList.toggle('on', V.loop); b.setAttribute('aria-pressed', V.loop ? 'true' : 'false'); show(V.i, 0); }
  }
  /* glisser du doigt (ou de la souris) sur l'image : plan suivant / précédent */
  function onSwipeStart(e){
    if(!e.target.closest('.sbv-frame')) return;
    const x0 = e.clientX, y0 = e.clientY; V.swiped = false;
    const up = ev => {
      document.removeEventListener('pointerup', up, true);
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3){ V.swiped = true; go(V.i + (dx < 0 ? 1 : -1)); setTimeout(() => { V.swiped = false; }, 0); }
    };
    document.addEventListener('pointerup', up, true);
  }
  function onViewerKey(e){
    if(!V.el) return;
    const k = e.key;
    if(k === 'Escape'){ if(document.fullscreenElement) return; e.preventDefault(); e.stopPropagation(); closeViewer(); return; }
    let used = true;
    if(k === 'ArrowRight' || k === 'PageDown') go(V.i + 1, 1);
    else if(k === 'ArrowLeft' || k === 'PageUp') go(V.i - 1, -1);
    else if(k === ' ' || k === 'k' || k === 'K'){ if(e.target && e.target.tagName === 'BUTTON' && k === ' ') { e.preventDefault(); } setPlaying(!V.playing); }
    else if(k === 'Home'){ if(V.i) show(0, -1); }
    else if(k === 'End'){ if(V.i !== V.list.length - 1) show(V.list.length - 1, 1); }
    else if(k === '+' || k === '='){ setDur(1); }
    else if(k === '-' || k === '_'){ setDur(-1); }
    else if(k === 'f' || k === 'F') toggleFull();
    else used = false;
    if(used){ e.preventDefault(); e.stopPropagation(); }
    else if(!(e.ctrlKey || e.metaKey)) e.stopPropagation();   // le scénario derrière ne reçoit rien
  }
  /* en quittant l'onglet ou le scénario, la visionneuse se ferme */
  const __switchTab36 = switchTab;
  switchTab = function(){ closeViewer(); const m = document.querySelector('.sbt-menu'); if(m) m.remove(); return __switchTab36.apply(this, arguments); };
  if(ACTIONS.switchTab) ACTIONS.switchTab = (id, e) => switchTab(id, e);
  const __goHome36 = goHome;
  goHome = function(){ closeViewer(); return __goHome36.apply(this, arguments); };
  if(ACTIONS.goHome) ACTIONS.goHome = goHome;

  /* ---------------- styles ---------------- */
  const mask = p => 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>');
  const st = document.createElement('style'); st.id = 'rpSbTabStyle';
  st.textContent = `
  .sbt-bar .sbt-acts{display:flex; align-items:center; gap:8px; flex-wrap:wrap;}
  .sbt-bar .btn svg{vertical-align:-2px;}
  .sbt-hint{display:flex; align-items:center; gap:10px 16px; flex-wrap:wrap; justify-content:space-between;}
  .sbt-filters{display:flex; gap:8px; flex-wrap:wrap;}
  .sbt-pill{height:28px; padding:0 12px; border:1px solid var(--hair); border-radius:999px; background:var(--surface); color:var(--ink-soft); font:inherit; font-size:12.5px; font-weight:600; cursor:pointer;}
  .sbt-pill:hover{border-color:var(--accent); color:var(--ink);}
  .sbt-pill.on{border-color:var(--accent); color:var(--accent); background:color-mix(in srgb, var(--accent) 9%, var(--surface));}
  .sbt-wrap{padding:6px 24px 80px; display:flex; flex-direction:column; gap:14px;}
  .sbt-sc{background:var(--surface); border:1px solid var(--hair); border-radius:12px; box-shadow:var(--shadow-sm); padding:12px 14px 14px; transition:border-color .14s ease, box-shadow .14s ease;}
  .sbt-sc.empty{padding:8px 14px; box-shadow:none; background:color-mix(in srgb, var(--surface) 70%, transparent);}
  .sbt-sc{content-visibility:auto; contain-intrinsic-size:auto 320px;} .sbt-sc.empty{contain-intrinsic-size:auto 48px;}   /* longs scénarios : seules les scènes visibles sont dessinées */
  .sbt-sc.drop{border-color:var(--accent); box-shadow:0 0 0 3px rgba(54,153,212,.22);}
  .sbt-sh{display:flex; align-items:center; gap:10px; min-height:30px;}
  .sbt-n{flex:none; font:600 12.5px var(--mono); color:var(--accent);}
  .sbt-t{min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font:700 12.5px var(--mono); letter-spacing:.02em; text-transform:uppercase; color:var(--ink);}
  .sbt-t[data-sb]{cursor:pointer;} .sbt-t[data-sb]:hover{color:var(--accent);}
  .sbt-meta{flex:none; font-size:12px; color:var(--ink-soft); white-space:nowrap;}
  .sbt-playsc{flex:none; width:24px; height:24px; display:grid; place-items:center; padding:0 0 0 1px; border:1px solid var(--hair); border-radius:50%; background:var(--surface); color:var(--accent); cursor:pointer;}
  .sbt-playsc:hover{background:var(--accent); border-color:var(--accent); color:#fff;}
  .sbt-addb{margin-left:auto; flex:none; display:flex; gap:6px;}
  .sbt-addb button{display:inline-flex; align-items:center; gap:6px; height:28px; padding:0 10px; border:1px solid var(--hair); border-radius:999px; background:var(--surface); color:var(--ink); font:inherit; font-size:12px; font-weight:600; cursor:pointer;}
  /* icônes des boutons d'ajout dessinées en CSS (une scène vide = quelques nœuds seulement, même avec des centaines de scènes) */
  .sbt-addb i{flex:none; width:13px; height:13px; background:var(--accent); -webkit-mask:var(--m) center/13px 13px no-repeat; mask:var(--m) center/13px 13px no-repeat;}
  .sbt-addb .mi-img{--m:url("${mask(I.img)}");} .sbt-addb .mi-draw{--m:url("${mask(I.draw)}");} .sbt-addb .mi-paste{--m:url("${mask(I.paste)}");}
  .sbt-addb button:hover{border-color:var(--accent); color:var(--accent);}
  .sbt-sc.empty .sbt-addb button{opacity:.75;} .sbt-sc.empty:hover .sbt-addb button{opacity:1;}
  .sbt-grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:14px; margin-top:12px;}
  .sbt-f{min-width:0;}
  .sbt-img{position:relative; aspect-ratio:16/9; border-radius:10px; overflow:hidden; background:#fff; border:1px solid var(--hair); box-shadow:var(--shadow-sm); cursor:zoom-in;}
  .sbt-img img{display:block; width:100%; height:100%; object-fit:cover; -webkit-user-drag:none;}
  .sbt-num{position:absolute; top:7px; left:7px; min-width:20px; height:20px; padding:0 6px; display:grid; place-items:center; border-radius:99px; background:rgba(15,17,21,.82); color:#fff; font-size:11px; font-weight:700;}
  .sbt-tools{position:absolute; top:6px; right:6px; display:flex; gap:4px; opacity:0; transition:opacity .14s ease;}
  .sbt-img:hover .sbt-tools, .sbt-img:focus-within .sbt-tools{opacity:1;}
  .sbt-tools button{width:26px; height:26px; display:grid; place-items:center; padding:0; border:0; border-radius:50%; background:rgba(15,17,21,.82); color:#fff; cursor:pointer;}
  .sbt-tools button:hover{background:var(--accent);} .sbt-tools button[data-sb="del"]:hover{background:#D64545;}
  .sbt-chk{position:absolute; bottom:7px; left:7px; width:22px; height:22px; display:grid; place-items:center; padding:0; border:1.5px solid rgba(255,255,255,.92); border-radius:50%; background:rgba(15,17,21,.55); color:transparent; cursor:pointer; opacity:0; transition:opacity .14s ease;}
  .sbt-img:hover .sbt-chk, .sbt-img:focus-within .sbt-chk, .sbt-f.sel .sbt-chk{opacity:1;}
  .sbt-f.sel .sbt-chk{background:var(--accent); border-color:var(--accent); color:#fff;}
  .sbt-f.sel .sbt-img{outline:2px solid var(--accent); outline-offset:2px;}
  @media (hover:none){ .sbt-tools, .sbt-chk{opacity:1;} }
  .sbt-f.dragging{opacity:.4;}
  .sbt-f.over-b .sbt-img{box-shadow:-4px 0 0 var(--accent);} .sbt-f.over-a .sbt-img{box-shadow:4px 0 0 var(--accent);}
  .sbt-f.flash .sbt-img{animation:rpSbFlash 1.2s ease;}
  .sbt-cap{display:block; width:100%; box-sizing:border-box; margin-top:6px; padding:5px 7px; border:1px solid transparent; border-radius:6px; background:transparent; color:var(--ink); font:inherit; font-size:13px; line-height:1.35;}
  .sbt-cap::placeholder{color:var(--ink-soft); opacity:.75;}
  .sbt-cap:hover{border-color:var(--hair);}
  .sbt-cap:focus{outline:none; border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px rgba(54,153,212,.2);}
  .sbt-empty{padding:30px 10px; text-align:center; color:var(--ink-soft); font-size:14px;}
  .sbt-menu{position:fixed; z-index:140; width:290px; padding:10px; border-radius:12px; background:var(--surface); border:1px solid var(--hair); box-shadow:var(--shadow-md); font-family:var(--sans); animation:rpPop .14s ease;}
  .sbt-menu h4{margin:0 0 8px; font-size:11px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--ink-soft);}
  .sbt-menu .s{display:flex; flex-direction:column; gap:3px; max-height:300px; overflow-y:auto;}
  .sbt-menu button{display:flex; align-items:center; gap:8px; min-height:30px; padding:4px 8px; border:1px solid var(--hair); border-radius:8px; background:var(--surface); color:var(--ink); font:inherit; font-size:12.5px; text-align:left; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
  .sbt-menu button b{flex:none; min-width:18px; font:600 12px var(--mono); color:var(--accent);}
  .sbt-menu button:hover{border-color:var(--accent); color:var(--accent);}
  .sbt-menu button.cur{background:var(--hair); color:var(--ink-soft); border-color:transparent; cursor:default;}
  @media (max-width:760px){ .sbt-wrap{padding:6px 16px 60px;} .sbt-addb span{display:none;} .sbt-meta{display:none;} .sbt-grid{grid-template-columns:repeat(auto-fill, minmax(160px, 1fr));} }

  /* visionneuse */
  .sbv{position:fixed; inset:0; z-index:330; display:flex; flex-direction:column; background:#0E0F14; color:#EDEEF5; font-family:var(--sans); outline:none; animation:mmdFade .16s ease-out;}
  .sbv-top{flex:none; display:flex; align-items:center; gap:14px; padding:14px 18px 6px;}
  .sbv-info{flex:1; min-width:0; display:flex; align-items:baseline; gap:12px;}
  .sbv-pos{flex:none; font-size:14px; font-weight:700; font-variant-numeric:tabular-nums;}
  .sbv-sc{min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font:600 12.5px var(--mono); letter-spacing:.02em; text-transform:uppercase; color:#9A99B0;}
  .sbv-tr{display:flex; gap:6px;}
  .sbv button{font:inherit; color:inherit;}
  .sbv-tr button, .sbv-g button{min-width:34px; height:34px; display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:0 9px; border:0; border-radius:10px; background:rgba(255,255,255,.07); cursor:pointer; font-size:13px; font-weight:600;}
  .sbv-tr button:hover, .sbv-g button:hover{background:rgba(255,255,255,.16);}
  .sbv-stage{flex:1; min-height:0; position:relative; display:flex; align-items:center; justify-content:center; padding:8px 70px;}
  .sbv-frame{position:relative; width:min(100%, calc((100vh - 290px) * 16 / 9)); aspect-ratio:16/9; border-radius:12px; overflow:hidden; background:#fff; box-shadow:0 24px 70px rgba(0,0,0,.55); touch-action:pan-y; cursor:pointer; user-select:none;}
  .sbv.fs .sbv-frame{width:min(100%, calc((100vh - 250px) * 16 / 9));}
  .sbv-frame img{position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .38s cubic-bezier(.2,.7,.2,1), opacity .38s ease; -webkit-user-drag:none;}
  .sbv-frame img.from-r{transform:translateX(100%);} .sbv-frame img.from-l{transform:translateX(-100%);}
  .sbv-frame img.to-l{transform:translateX(-100%);} .sbv-frame img.to-r{transform:translateX(100%);}
  @media (prefers-reduced-motion:reduce){ .sbv-frame img{transition:none;} }
  .sbv-nav{position:absolute; top:50%; transform:translateY(-50%); width:46px; height:46px; display:grid; place-items:center; padding:0; border:0; border-radius:50%; background:rgba(255,255,255,.08); cursor:pointer; transition:background .14s ease, opacity .14s ease;}
  .sbv-nav:hover{background:rgba(255,255,255,.18);}
  .sbv-nav:disabled{opacity:.2; cursor:default;}
  .sbv-nav.p{left:14px;} .sbv-nav.n{right:14px;}
  .sbv-cap{flex:none; min-height:24px; max-width:900px; margin:10px auto 0; padding:0 20px; text-align:center; font-size:16px; line-height:1.45; color:#EDEEF5;}
  .sbv-cap.none{visibility:hidden;}
  .sbv-ctrl{flex:none; padding:10px 18px 14px;}
  .sbv-prog{max-width:980px; margin:0 auto; padding:6px 0; cursor:pointer;}
  .sbv-segs{display:flex; gap:3px; height:4px;}
  .sbv-segs i{flex:1; position:relative; border-radius:2px; background:rgba(255,255,255,.18); overflow:hidden;}
  .sbv-segs i b{position:absolute; left:0; top:0; bottom:0; width:0; background:#6CB8E8; border-radius:2px;}
  .sbv-segs i.done b{width:100%;}
  .sbv-row{max-width:980px; margin:8px auto 0; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;}
  .sbv-g{display:flex; align-items:center; gap:6px;}
  .sbv-l{font-size:12px; color:#9A99B0; margin-right:2px;}
  .sbv-dur{min-width:46px; text-align:center; font-size:13.5px; font-variant-numeric:tabular-nums;}
  .sbv .sbv-play{min-width:150px; height:40px; padding:0 18px; border-radius:999px; background:var(--accent); color:#fff; font-size:13.5px;}
  .sbv .sbv-play:hover{background:#2B86C0;}
  .sbv-loop.on{background:rgba(54,153,212,.28) !important; color:#9BD3F5;}
  .sbv-badge{display:inline-flex; align-items:center; height:24px; padding:0 10px; border-radius:999px; background:rgba(255,255,255,.08); color:#9A99B0; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;}
  .sbv-badge.on{background:rgba(54,153,212,.22); color:#9BD3F5;}
  .sbv-strip{max-width:980px; margin:12px auto 0; display:flex; gap:8px; overflow-x:auto; padding:4px 2px 6px; scrollbar-width:thin;}
  .sbv-strip button{flex:none; position:relative; width:96px; aspect-ratio:16/9; padding:0; border:2px solid transparent; border-radius:8px; overflow:hidden; background:#fff; cursor:pointer; opacity:.55; transition:opacity .14s ease, border-color .14s ease;}
  .sbv-strip button:hover{opacity:.9;}
  .sbv-strip button.cur{opacity:1; border-color:var(--accent);}
  .sbv-strip img{width:100%; height:100%; object-fit:cover; display:block;}
  .sbv-strip span{position:absolute; left:4px; top:4px; min-width:16px; height:16px; padding:0 4px; border-radius:99px; background:rgba(15,17,21,.82); color:#fff; font-size:10px; font-weight:700; line-height:16px;}
  .sbv.ended .sbv-frame:after{content:attr(data-end); position:absolute; inset:auto 12px 12px auto; padding:4px 12px; border-radius:999px; background:rgba(15,17,21,.8); color:#fff; font-size:12px; font-weight:700;}
  @media (max-width:760px){ .sbv-stage{padding:8px 10px;} .sbv-nav{display:none;} .sbv-l, .sbv-loop span{display:none;} .sbv .sbv-play{min-width:0;} .sbv-play span{display:none;} }
  @media print{ .sbv, .sbt-menu{display:none !important;} }
  `;
  document.head.appendChild(st);
})();

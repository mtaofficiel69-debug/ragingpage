/* =====================================================================
   STORYBOARD — ONGLET À PART (colonne de gauche › Écrire › Storyboard)
   ---------------------------------------------------------------------
   v93 : le storyboard suit l'ordre du FILM, découpé en séquences libres
   (générique, ouverture, montage, scène 12, fin…). On les crée, les nomme
   et les range soi-même ; une séquence peut être reliée à une scène du
   scénario (son titre suit alors l'entête) ou rester libre : beaucoup de
   plans n'appartiennent à aucune scène.
   • une carte par séquence : poignée pour la déplacer, titre modifiable sur
     place, pastille « Scène 12 » / « Séquence libre », nombre de plans,
     lecture à partir d'ici, menu ⋯ (relier, monter, descendre, insérer,
     supprimer — annulable) ;
   • les plans en vignettes 16:9 avec leur légende, une tuile « Ajouter un
     plan » (Image · Dessin · Coller) au bout de chaque séquence ; glisser un
     plan le range ailleurs, déposer un fichier image l'ajoute ;
   • taille des vignettes au choix (petites, moyennes, grandes), mémorisée ;
   • « Lecture auto » / « Défilement manuel » : même visionneuse qu'avant.
   Les données restent dans S.project.storyboard (frames + seqs).
===================================================================== */
(function(){
  const R = () => window.RPSB;
  const $ = id => document.getElementById(id);
  const DUR_KEY = 'scriptmm_sb_dur', LOOP_KEY = 'scriptmm_sb_loop', SIZE_KEY = 'scriptmm_sb_size';
  const lsGet = (k, d) => { try{ const v = localStorage.getItem(k); return v == null ? d : v; }catch(e){ return d; } };
  const lsSet = (k, v) => { try{ localStorage.setItem(k, v); }catch(e){} };
  const plans = n => n + ' ' + (n > 1 ? L('plans', 'shots') : L('plan', 'shot'));
  const seqsTxt = n => n + ' ' + (n > 1 ? L('séquences', 'sequences') : L('séquence', 'sequence'));
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
    close:'<path d="M4 4l8 8M12 4l-8 8"/>',
    plus:'<path d="M8 3v10M3 8h10"/>',
    more:'<circle cx="3.5" cy="8" r=".9" fill="currentColor"/><circle cx="8" cy="8" r=".9" fill="currentColor"/><circle cx="12.5" cy="8" r=".9" fill="currentColor"/>',
    grip:'<circle cx="6" cy="4" r=".9" fill="currentColor"/><circle cx="10" cy="4" r=".9" fill="currentColor"/><circle cx="6" cy="8" r=".9" fill="currentColor"/><circle cx="10" cy="8" r=".9" fill="currentColor"/><circle cx="6" cy="12" r=".9" fill="currentColor"/><circle cx="10" cy="12" r=".9" fill="currentColor"/>',
    scene:'<rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M2 6.5h12M5 3.5l1.5 3M9 3.5l1.5 3"/>',
    link:'<path d="M6.8 9.2a2.6 2.6 0 0 0 3.7 0l2-2a2.6 2.6 0 0 0-3.7-3.7l-.8.8M9.2 6.8a2.6 2.6 0 0 0-3.7 0l-2 2a2.6 2.6 0 0 0 3.7 3.7l.8-.8"/>',
    up:'<path d="M8 13V3M4 7l4-4 4 4"/>', down:'<path d="M8 3v10M4 9l4 4 4-4"/>',
    ins:'<path d="M2.5 4h11M2.5 12h11M8 6v4M6 8h4"/>',
    sz1:'<rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="1"/><rect x="9" y="9" width="4.5" height="4.5" rx="1"/>',
    sz2:'<rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="M8 3v10"/>',
    sz3:'<rect x="2.5" y="3" width="11" height="10" rx="1.5"/>'
  };
  const SIZES = { s:170, m:230, l:320 };

  /* ---------------- données ---------------- */
  const st = () => R().store();
  const seqById = id => st().seqs.find(q => q.id === id);
  const frameById = id => st().frames.find(f => f.id === id);
  const scenesById = () => { const m = {}; R().sbScenes().forEach(s => { m[s.id] = s; }); return m; };
  function newSeq(at, props){
    const q = Object.assign({ id:R().uid(), title:'', sc:'' }, props || {});
    const a = st().seqs; a.splice(at == null ? a.length : at, 0, q); R().save();
    return q;
  }
  const pgOf = q => { const s = q && q.sc && scenesById()[q.sc]; return s ? s.from : 1; };

  /* ---------------- affichage ---------------- */
  function frameCard(x){
    const f = x.f, sel = R().SELS.has(f.id);
    return `<div class="sbt-f${sel ? ' sel' : ''}" data-id="${f.id}">
      <div class="sbt-img" draggable="true" title="${esc(L('Clique pour voir en grand · glisse pour déplacer', 'Click to view large · drag to move'))}">
        <img src="${f.src}" alt="" draggable="false" loading="lazy" decoding="async"><span class="sbt-num">${x.num}</span>
        <button type="button" class="sbt-chk" data-sb="sel" aria-pressed="${sel}" title="${esc(L('Cocher pour télécharger', 'Tick to download'))}">${ic(I.chk, 12)}</button>
        <div class="sbt-tools">
          <button type="button" data-sb="mv" title="${esc(L('Déplacer vers une autre séquence…', 'Move to another sequence…'))}">${ic(I.mv, 13)}</button>
          <button type="button" data-sb="dl" title="${esc(L('Télécharger ce plan…', 'Download this shot…'))}">${ic(I.dl, 13)}</button>
          <button type="button" data-sb="edit" title="${esc(L('Dessiner dessus / cadrer', 'Draw on it / frame it'))}">${ic(I.edit, 13)}</button>
          <button type="button" data-sb="del" title="${esc(L('Supprimer ce plan', 'Delete this shot'))}">${ic(I.del, 13)}</button>
        </div></div>
      <input class="sbt-cap" type="text" maxlength="200" placeholder="${esc(L('Légende (cadrage, mouvement…)', 'Caption (framing, movement…)'))}" value="${esc(f.cap || '')}">
    </div>`;
  }
  function addTile(){
    return `<div class="sbt-add"><span class="sbt-add-t">${ic(I.plus, 15)}${esc(L('Ajouter un plan', 'Add a shot'))}</span>
      <span class="sbt-add-b"><button type="button" data-sb="add-img" title="${esc(L('Importer une ou plusieurs images', 'Import one or more pictures'))}">${esc(L('Image', 'Picture'))}</button><i></i><button type="button" data-sb="add-draw" title="${esc(L('Dessiner un plan', 'Draw a shot'))}">${esc(L('Dessin', 'Drawing'))}</button><i></i><button type="button" data-sb="add-paste" title="${esc(L('Coller l’image copiée (ou Ctrl+V en survolant la séquence)', 'Paste the copied picture (or Ctrl+V while hovering the sequence)'))}">${esc(L('Coller', 'Paste'))}</button></span></div>`;
  }
  function seqCard(q, idx, items, scs){
    const sc = q.sc && scs[q.sc], label = R().seqLabel(q, scs);
    const chip = sc
      ? `<button type="button" class="sbt-chip on" data-sb="link" title="${esc(L('Reliée à la scène ', 'Linked to scene ') + (sc.num || '') + ' — ' + sc.title + L(' · changer', ' · change'))}">${ic(I.scene, 13)}<span>${esc((sc.num ? L('Scène ', 'Scene ') + sc.num : L('Scène', 'Scene')) + ' · ' + L('p. ', 'p. ') + sc.from)}</span></button>`
      : `<button type="button" class="sbt-chip" data-sb="link" title="${esc(L('Relier cette séquence à une scène du scénario (facultatif)', 'Link this sequence to a scene of the screenplay (optional)'))}">${ic(I.link, 13)}<span>${esc(L('Séquence libre', 'Free sequence'))}</span></button>`;
    return `<section class="sbt-sq" data-sq="${esc(q.id)}">
      <header class="sbt-sh">
        <span class="sbt-grip" draggable="true" title="${esc(L('Glisser pour déplacer la séquence', 'Drag to move the sequence'))}" aria-hidden="true">${ic(I.grip, 14)}</span>
        <span class="sbt-ix">${idx + 1}</span>
        <input class="sbt-title" type="text" maxlength="120" value="${esc(q.title || '')}" placeholder="${esc(sc ? sc.title : L('Titre de la séquence (ex. Générique, Ouverture…)', 'Sequence title (e.g. Opening credits…)'))}" aria-label="${esc(L('Titre de la séquence', 'Sequence title'))}">
        ${chip}
        <span class="sbt-cnt">${items.length ? esc(plans(items.length)) : esc(L('vide', 'empty'))}</span>
        <span class="sbt-hb">
          ${items.length ? `<button type="button" data-sb="play-sq" title="${esc(L('Lire à partir de cette séquence', 'Play from this sequence'))}">${ic(I.play, 12)}</button>` : ''}
          <button type="button" data-sb="sqmenu" title="${esc(L('Plus d’options', 'More options'))}" aria-haspopup="menu">${ic(I.more, 15)}</button></span>
      </header>
      <div class="sbt-grid">${items.map(frameCard).join('')}${addTile()}</div>
    </section>`;
  }
  window.renderStoryboard = function(){
    if(!R()) return '';
    const list = R().sbOrdered(), seqs = st().seqs, scs = scenesById(), n = list.length, nSel = R().SELS.size;
    const by = {}; list.forEach(x => { (by[x.sq] = by[x.sq] || []).push(x); });
    const size = SIZES[lsGet(SIZE_KEY, 'm')] ? lsGet(SIZE_KEY, 'm') : 'm';
    const hasScenes = R().sbScenes().length > 0;
    const body = seqs.length ? seqs.map((q, i) => seqCard(q, i, by[q.id] || [], scs)).join('') + `<button type="button" class="sbt-newsq" data-sb="newsq">${ic(I.plus, 14)}${esc(L('Nouvelle séquence', 'New sequence'))}</button>`
      : `<div class="sbt-start">
          <div class="sbt-start-ic">${ic(I.scene, 26)}</div>
          <h3>${esc(L('Commence ton storyboard', 'Start your storyboard'))}</h3>
          <p>${esc(L('Découpe ton film en séquences — un générique, une ouverture, une scène, un montage, une fin… — puis ajoute-y tes plans : images ou dessins. Une séquence peut suivre une scène du scénario ou rester libre.', 'Split your film into sequences — opening credits, an opening, a scene, a montage, an ending… — then add your shots: pictures or drawings. A sequence can follow a scene of the screenplay or stay free.'))}</p>
          <div class="sbt-start-b"><button type="button" class="btn btn-primary" data-sb="newsq">${ic(I.plus, 13)} ${esc(L('Nouvelle séquence', 'New sequence'))}</button>
          ${hasScenes ? `<button type="button" class="btn" data-sb="fromscenes">${ic(I.scene, 13)} ${esc(L('Une séquence par scène du scénario', 'One sequence per scene of the screenplay'))}</button>` : ''}</div></div>`;
    return `<div class="cards-toolbar sbt-bar"><div class="pane-title" style="margin:0;">${esc(L('Storyboard', 'Storyboard'))}${paneCount(n)}</div>
        <div class="sbt-acts"${n ? '' : ' hidden'}>
          <button type="button" class="btn btn-sm btn-primary" data-sb="play"${n ? '' : ' disabled'} title="${esc(L('Fait défiler tous les plans, du premier au dernier, au rythme choisi', 'Plays every shot, first to last, at the pace you choose'))}">${ic(I.play, 12)} ${esc(L('Lecture auto', 'Auto play'))}</button>
          <button type="button" class="btn btn-sm" data-sb="manual"${n ? '' : ' disabled'} title="${esc(L('Passe d’un plan à l’autre toi-même (flèches, clic ou glisser)', 'Go from shot to shot yourself (arrows, click or swipe)'))}">${ic(I.manual, 13)} ${esc(L('Défilement manuel', 'Manual'))}</button>
          <button type="button" class="btn btn-sm" data-sb="dlall"${n ? '' : ' disabled'} title="${esc(L('Télécharger les plans (PNG ou PDF)…', 'Download the shots (PNG or PDF)…'))}">${ic(I.dl, 13)} ${esc(L('Télécharger', 'Download'))}</button>
        </div></div>
      <div class="sbt-sub"${seqs.length ? '' : ' hidden'}><span class="sbt-stats">${esc(plans(n))} · ${esc(seqsTxt(seqs.length))}${nSel ? ` · <button type="button" class="sbt-clr" data-sb="clearsel" title="${esc(L('Tout décocher', 'Clear the selection'))}">${nSel} ${esc(nSel > 1 ? L('cochés', 'selected') : L('coché', 'selected'))} ✕</button>` : ''}</span>
        <span class="sbt-subr">${n ? `<span class="sbt-seg" role="group" aria-label="${esc(L('Taille des vignettes', 'Thumbnail size'))}">${['s', 'm', 'l'].map((k, i) => `<button type="button" data-sb="size" data-v="${k}" class="${k === size ? 'on' : ''}" aria-pressed="${k === size}" title="${esc([L('Petites vignettes', 'Small thumbnails'), L('Vignettes moyennes', 'Medium thumbnails'), L('Grandes vignettes', 'Large thumbnails')][i])}">${ic(I['sz' + (i + 1)], 14)}</button>`).join('')}</span>` : ''}
        ${seqs.length ? `<button type="button" class="btn btn-sm" data-sb="newsq">${ic(I.plus, 12)} ${esc(L('Nouvelle séquence', 'New sequence'))}</button>` : ''}</span></div>
      <div class="sbt-wrap sz-${size}" id="sbtWrap">${body}</div>`;
  };
  function refresh(focusTitleOf){
    if(!(S && S.view === 'editor' && S.tab === 'storyboard')) return;
    const c = $('centerPane'); if(!c) return;
    const y = c.scrollTop, act = document.activeElement;
    const capId = act && act.classList && act.classList.contains('sbt-cap') ? act.closest('.sbt-f').dataset.id : null;
    const titleId = act && act.classList && act.classList.contains('sbt-title') ? act.closest('.sbt-sq').dataset.sq : null;
    c.innerHTML = renderStoryboard();
    c.scrollTop = y;
    const fid = focusTitleOf || titleId;
    if(fid){ const i = c.querySelector('.sbt-sq[data-sq="' + fid + '"] .sbt-title'); if(i){ i.focus(); if(focusTitleOf){ i.closest('.sbt-sq').scrollIntoView({ block:'nearest', behavior:'smooth' }); } } }
    else if(capId){ const i = c.querySelector('.sbt-f[data-id="' + capId + '"] .sbt-cap'); if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
  }
  window.sbTabRefresh = () => refresh();
  const flash = (sel) => { const el = document.querySelector('#sbtWrap ' + sel); if(!el) return; el.scrollIntoView({ block:'nearest', behavior:'smooth' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1300); };
  const flashF = id => flash('.sbt-f[data-id="' + id + '"]');

  /* place un plan dans une séquence, avant / après un autre plan ou à la fin */
  function moveTo(f, sq, before, after){
    const arr = st().frames, i = arr.indexOf(f); if(i < 0) return null;
    const was = { i, sq:f.sq };
    arr.splice(i, 1);
    if(before) arr.splice(arr.indexOf(before), 0, f);
    else if(after) arr.splice(arr.indexOf(after) + 1, 0, f);
    else arr.push(f);
    f.sq = sq;
    R().save(); refresh(); flashF(f.id);
    return was;
  }
  function undoMove(f, was){
    const arr = st().frames, j = arr.indexOf(f); if(j >= 0) arr.splice(j, 1);
    arr.splice(Math.min(was.i, arr.length), 0, f); f.sq = was.sq; R().save(); refresh(); flashF(f.id);
  }

  /* ---------------- petits menus (même style que les autres menus du storyboard) ---------------- */
  function popMenu(btn, html, width){
    closeMenus();
    const m = document.createElement('div'); m.className = 'sbt-menu rp-ui'; m.style.width = (width || 260) + 'px'; m.innerHTML = html;
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect(), h = m.offsetHeight;
    m.style.top = Math.round(r.bottom + 6 + h > window.innerHeight - 8 ? Math.max(8, r.top - 6 - h) : r.bottom + 6) + 'px';
    m.style.left = Math.round(Math.max(8, Math.min(window.innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth))) + 'px';
    setTimeout(() => document.addEventListener('mousedown', function off(e){ if(!m.contains(e.target)){ m.remove(); document.removeEventListener('mousedown', off, true); } }, true), 0);
    return m;
  }
  function closeMenus(){ document.querySelectorAll('.sbt-menu').forEach(m => m.remove()); }
  /* déplacer un plan vers une séquence */
  function moveMenu(btn, f){
    const scs = scenesById();
    const m = popMenu(btn, `<h4>${esc(L('Déplacer vers la séquence', 'Move to sequence'))}</h4><div class="s">${st().seqs.map((q, i) => `<button type="button" data-msq="${esc(q.id)}"${q.id === f.sq ? ' class="cur" aria-current="true"' : ''}><b>${i + 1}</b><span>${esc(R().seqLabel(q, scs))}</span></button>`).join('')}</div>`, 280);
    const c = m.querySelector('.cur'); if(c) c.scrollIntoView({ block:'nearest' });
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-msq]'); if(!b) return; m.remove();
      if(b.dataset.msq === f.sq) return;
      const q = seqById(b.dataset.msq), was = moveTo(f, q.id);
      R().snack(L('Plan déplacé vers « ', 'Shot moved to “') + R().seqLabel(q, scs) + L(' ».', '”.'), () => undoMove(f, was));
    });
  }
  /* relier une séquence à une scène (avec recherche) */
  function linkMenu(btn, q){
    const scs = R().sbScenes();
    const m = popMenu(btn, `<h4>${esc(L('Relier à une scène', 'Link to a scene'))}</h4>
      <input type="text" class="sbt-mq" placeholder="${esc(L('Chercher une scène…', 'Search a scene…'))}" aria-label="${esc(L('Chercher une scène', 'Search a scene'))}">
      <div class="s"><button type="button" data-lsc=""${q.sc ? '' : ' class="cur"'}><b>—</b><span>${esc(L('Aucune — séquence libre', 'None — free sequence'))}</span></button>
      ${scs.map(s => `<button type="button" data-lsc="${esc(s.id)}"${s.id === q.sc ? ' class="cur" aria-current="true"' : ''} data-k="${esc(((s.num || '') + ' ' + s.title).toLowerCase())}"><b>${esc(String(s.num || ''))}</b><span>${esc(s.title)}</span><em>${esc(L('p. ', 'p. ') + s.from)}</em></button>`).join('')}</div>`, 340);
    const inp = m.querySelector('.sbt-mq'); setTimeout(() => inp.focus(), 0);
    inp.addEventListener('input', () => { const v = inp.value.trim().toLowerCase(); m.querySelectorAll('[data-k]').forEach(b => { b.hidden = !!v && b.dataset.k.indexOf(v) < 0; }); });
    inp.addEventListener('keydown', e => { if(e.key === 'Enter'){ const b = m.querySelector('[data-k]:not([hidden])'); if(b) b.click(); } else if(e.key === 'Escape'){ e.stopPropagation(); m.remove(); } });
    const c = m.querySelector('.cur'); if(c) c.scrollIntoView({ block:'nearest' });
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-lsc]'); if(!b) return; m.remove();
      q.sc = b.dataset.lsc; R().save(); refresh(); flash('.sbt-sq[data-sq="' + q.id + '"]');
    });
  }
  function seqMenu(btn, q){
    const a = st().seqs, i = a.indexOf(q), n = st().frames.filter(f => f.sq === q.id).length;
    const it = (k, ico, t, off, cls) => `<button type="button" data-qm="${k}"${off ? ' disabled' : ''}${cls ? ' class="' + cls + '"' : ''}>${ic(ico, 14)}<span>${esc(t)}</span></button>`;
    const m = popMenu(btn, `<div class="m">${it('rename', I.edit, L('Renommer', 'Rename'))}${it('link', I.link, q.sc ? L('Changer la scène reliée…', 'Change the linked scene…') : L('Relier à une scène…', 'Link to a scene…'))}
      <i></i>${it('up', I.up, L('Monter', 'Move up'), i === 0)}${it('down', I.down, L('Descendre', 'Move down'), i === a.length - 1)}${it('ins', I.ins, L('Insérer une séquence après', 'Insert a sequence after'))}
      <i></i>${it('del', I.del, n === 1 ? L('Supprimer la séquence et son plan', 'Delete the sequence and its shot') : n ? L('Supprimer la séquence et ses ', 'Delete the sequence and its ') + plans(n) : L('Supprimer la séquence', 'Delete the sequence'), false, 'danger')}</div>`, 270);
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-qm]'); if(!b || b.disabled) return; m.remove();
      const k = b.dataset.qm;
      if(k === 'rename') refresh(q.id);
      else if(k === 'link') linkMenu(document.querySelector('.sbt-sq[data-sq="' + q.id + '"] [data-sb="link"]') || btn, q);
      else if(k === 'up' || k === 'down'){ a.splice(i, 1); a.splice(i + (k === 'up' ? -1 : 1), 0, q); R().save(); refresh(); flash('.sbt-sq[data-sq="' + q.id + '"]'); }
      else if(k === 'ins'){ const nq = newSeq(i + 1); refresh(nq.id); }
      else if(k === 'del'){
        const fr = st().frames, gone = fr.map((f, j) => ({ f, j })).filter(x => x.f.sq === q.id);
        a.splice(i, 1); st().frames = fr.filter(f => f.sq !== q.id); gone.forEach(x => R().SELS.delete(x.f.id)); R().save(); refresh();
        R().snack(L('Séquence supprimée.', 'Sequence deleted.'), () => {
          st().seqs.splice(Math.min(i, st().seqs.length), 0, q);
          const arr = st().frames; gone.forEach(x => arr.splice(Math.min(x.j, arr.length), 0, x.f)); R().save(); refresh();
        });
      }
    });
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
    const a = b.dataset.sb, fEl = b.closest('.sbt-f'), f = fEl ? frameById(fEl.dataset.id) : null, qEl = b.closest('.sbt-sq'), q = qEl ? seqById(qEl.dataset.sq) : null;
    if(a === 'play' || a === 'manual') openViewer(0, a === 'play');
    else if(a === 'dlall') R().dlOpen();
    else if(a === 'clearsel'){ R().SELS.clear(); refresh(); }
    else if(a === 'size'){ lsSet(SIZE_KEY, b.dataset.v); refresh(); }
    else if(a === 'newsq'){ const nq = newSeq(); refresh(nq.id); }
    else if(a === 'fromscenes'){ R().sbScenes().forEach(s => newSeq(null, { sc:s.id })); refresh(); }
    else if(!q) return;
    else if(a === 'play-sq'){ const list = R().sbOrdered(), i = list.findIndex(x => x.sq === q.id); openViewer(Math.max(0, i), true); }
    else if(a === 'link') linkMenu(b, q);
    else if(a === 'sqmenu') seqMenu(b, q);
    else if(a === 'add-img') R().pickFile(pgOf(q), q.sc || undefined, q.id);
    else if(a === 'add-draw') R().drawOpen(pgOf(q), undefined, q.sc || undefined, q.id);
    else if(a === 'add-paste') R().pasteImage(pgOf(q), q.sc || undefined, q.id);
    else if(!f) return;
    else if(a === 'sel'){ if(R().SELS.has(f.id)) R().SELS.delete(f.id); else R().SELS.add(f.id); refresh(); }
    else if(a === 'mv') moveMenu(b, f);
    else if(a === 'dl') R().dlOpen(f.id);
    else if(a === 'edit') R().drawOpen(f.pg, f);
    else if(a === 'del') R().delFrame(f.id);
  });
  document.addEventListener('input', e => {
    const t = e.target; if(!t.classList) return;
    if(t.classList.contains('sbt-cap')){ const f = frameById(t.closest('.sbt-f').dataset.id); if(f){ f.cap = t.value; R().save(); } }
    else if(t.classList.contains('sbt-title')){ const q = seqById(t.closest('.sbt-sq').dataset.sq); if(q){ q.title = t.value; R().save(); } }
  });
  document.addEventListener('keydown', e => {
    const t = e.target; if(!t.classList) return;
    if(e.key === 'Enter' && (t.classList.contains('sbt-cap') || t.classList.contains('sbt-title'))){ e.preventDefault(); t.blur(); }
  });

  /* ---------------- glisser-déposer : plans et séquences ---------------- */
  let drag = null, dragSq = null;
  const clearMarks = () => document.querySelectorAll('#sbtWrap .over-b, #sbtWrap .over-a, #sbtWrap .drop, #sbtWrap .sq-b, #sbtWrap .sq-a').forEach(x => x.classList.remove('over-b', 'over-a', 'drop', 'sq-b', 'sq-a'));
  document.addEventListener('dragstart', e => {
    const g = e.target.closest && e.target.closest('#sbtWrap .sbt-grip');
    if(g){ dragSq = g.closest('.sbt-sq').dataset.sq; try{ e.dataTransfer.setData('text/plain', 'sbq:' + dragSq); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setDragImage(g.closest('.sbt-sh'), 20, 20); }catch(err){} g.closest('.sbt-sq').classList.add('dragging'); return; }
    const im = e.target.closest && e.target.closest('#sbtWrap .sbt-img'); if(!im) return;
    drag = im.closest('.sbt-f').dataset.id;
    try{ e.dataTransfer.setData('text/plain', 'sbt:' + drag); e.dataTransfer.effectAllowed = 'move'; }catch(err){}
    im.closest('.sbt-f').classList.add('dragging');
  });
  document.addEventListener('dragend', () => { drag = null; dragSq = null; clearMarks(); document.querySelectorAll('#sbtWrap .dragging').forEach(x => x.classList.remove('dragging')); });
  document.addEventListener('dragover', e => {
    const w = $('sbtWrap'); if(!w || !w.contains(e.target)) return;
    const files = e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0;
    if(!drag && !dragSq && !files) return;
    e.preventDefault(); clearMarks();
    const sec = e.target.closest('.sbt-sq');
    if(dragSq){ if(sec && sec.dataset.sq !== dragSq){ const r = sec.getBoundingClientRect(); sec.classList.add(e.clientY > r.top + r.height / 2 ? 'sq-a' : 'sq-b'); } }
    else {
      const card = e.target.closest('.sbt-f');
      if(card && drag && card.dataset.id !== drag){ const r = card.getBoundingClientRect(); card.classList.add(e.clientX > r.left + r.width / 2 ? 'over-a' : 'over-b'); }
      else if(sec) sec.classList.add('drop');
    }
    const cp = $('centerPane'), r = cp.getBoundingClientRect();   // près du haut ou du bas : la page défile toute seule
    if(e.clientY < r.top + 70) cp.scrollTop -= 18; else if(e.clientY > r.bottom - 70) cp.scrollTop += 18;
  });
  document.addEventListener('drop', e => {
    const w = $('sbtWrap'); if(!w || !w.contains(e.target)) return;
    const sec = e.target.closest('.sbt-sq'); if(!sec){ clearMarks(); return; }
    const q = seqById(sec.dataset.sq);
    if(dragSq){
      e.preventDefault(); clearMarks();
      const a = st().seqs, mv = seqById(dragSq); dragSq = null; if(!mv || mv === q) return;
      const r = sec.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      a.splice(a.indexOf(mv), 1); a.splice(a.indexOf(q) + (after ? 1 : 0), 0, mv); R().save(); refresh(); flash('.sbt-sq[data-sq="' + mv.id + '"]');
      return;
    }
    if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length){ e.preventDefault(); clearMarks(); R().addFiles(e.dataTransfer.files, pgOf(q), q.sc || undefined, q.id); return; }
    if(!drag) return; e.preventDefault();
    const f = frameById(drag), card = e.target.closest('.sbt-f'); clearMarks(); if(!f) return;
    let before = null, after = null;
    if(card && card.dataset.id !== drag){ const t = frameById(card.dataset.id), r = card.getBoundingClientRect(); if(e.clientX > r.left + r.width / 2) after = t; else before = t; }
    moveTo(f, q.id, before, after); drag = null;
  });
  /* Ctrl+V en survolant une séquence : l'image copiée s'y ajoute */
  let hoverSq = null;
  document.addEventListener('mousemove', e => { const s = e.target.closest && e.target.closest('#sbtWrap .sbt-sq'); hoverSq = s ? s.dataset.sq : null; });
  document.addEventListener('paste', e => {
    if(!hoverSq || S.tab !== 'storyboard' || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return;
    const q = seqById(hoverSq); if(!q) return;
    const files = Array.from((e.clipboardData && e.clipboardData.files) || []).filter(f => /^image\//.test(f.type));
    if(files.length){ e.preventDefault(); R().addFiles(files, pgOf(q), q.sc || undefined, q.id); }
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
    d.querySelector('.sbv-sc').textContent = x.label + (s ? ' · ' + (s.num ? L('Scène ', 'Scene ') + s.num + ' · ' : '') + L('p. ', 'p. ') + s.from : '');
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
  switchTab = function(){ closeViewer(); closeMenus(); return __switchTab36.apply(this, arguments); };
  if(ACTIONS.switchTab) ACTIONS.switchTab = (id, e) => switchTab(id, e);
  const __goHome36 = goHome;
  goHome = function(){ closeViewer(); return __goHome36.apply(this, arguments); };
  if(ACTIONS.goHome) ACTIONS.goHome = goHome;

  /* ---------------- styles ---------------- */
  const stEl = document.createElement('style'); stEl.id = 'rpSbTabStyle';
  stEl.textContent = `
  .sbt-bar .sbt-acts{display:flex; align-items:center; gap:8px; flex-wrap:wrap;}
  .sbt-bar .btn svg{vertical-align:-2px;}
  .sbt-sub[hidden], .sbt-bar .sbt-acts[hidden]{display:none;}
  .sbt-sub{display:flex; align-items:center; justify-content:space-between; gap:10px 16px; flex-wrap:wrap; padding:8px 24px 14px;}
  .sbt-stats{font-size:13.5px; color:var(--ink-soft); font-variant-numeric:tabular-nums;}
  .sbt-clr{border:0; background:none; padding:0; color:var(--accent); font:inherit; font-weight:600; cursor:pointer;}
  .sbt-clr:hover{text-decoration:underline;}
  .sbt-subr{display:flex; align-items:center; gap:10px;}
  .sbt-subr .btn svg{vertical-align:-2px;}
  .sbt-seg{display:inline-flex; padding:2px; border:1px solid var(--hair); border-radius:9px; background:var(--surface);}
  .sbt-seg button{width:30px; height:26px; display:grid; place-items:center; padding:0; border:0; border-radius:7px; background:none; color:var(--ink-soft); cursor:pointer;}
  .sbt-seg button:hover{color:var(--ink);}
  .sbt-seg button.on{background:color-mix(in srgb, var(--accent) 13%, var(--surface)); color:var(--accent);}
  .sbt-wrap{padding:0 24px 80px; display:flex; flex-direction:column; gap:16px;}
  .sbt-sq{position:relative; background:var(--surface); border:1px solid var(--hair); border-radius:14px; box-shadow:var(--shadow-sm); padding:12px 16px 16px; transition:border-color .14s ease, box-shadow .14s ease;
    content-visibility:auto; contain-intrinsic-size:auto 300px;}
  .sbt-sq.drop{border-color:var(--accent); box-shadow:0 0 0 3px rgba(54,153,212,.22);}
  .sbt-sq.dragging{opacity:.45;}
  .sbt-sq.sq-b{box-shadow:0 -4px 0 -1px var(--accent);} .sbt-sq.sq-a{box-shadow:0 4px 0 -1px var(--accent);}
  .sbt-sq.flash{animation:sbtSqFlash 1.2s ease;}
  @keyframes sbtSqFlash{0%,50%{border-color:var(--accent); box-shadow:0 0 0 3px rgba(54,153,212,.25);} 100%{}}
  .sbt-sh{display:flex; align-items:center; gap:10px; min-height:36px; margin:0 0 12px;}
  .sbt-grip{flex:none; width:18px; height:28px; display:grid; place-items:center; margin-left:-6px; color:var(--ink-soft); opacity:.45; cursor:grab; border-radius:6px;}
  .sbt-sq:hover .sbt-grip{opacity:.9;} .sbt-grip:hover{background:var(--chip-bg);}
  .sbt-ix{flex:none; min-width:26px; height:26px; padding:0 7px; display:grid; place-items:center; border-radius:8px; background:color-mix(in srgb, var(--accent) 12%, var(--surface)); color:var(--accent); font-size:12.5px; font-weight:700; font-variant-numeric:tabular-nums;}
  .sbt-title{flex:1 1 160px; min-width:0; height:34px; padding:0 8px; margin:0 0 0 -2px; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--ink); font:600 16px var(--sans); letter-spacing:-.01em; text-overflow:ellipsis;}
  .sbt-title::placeholder{color:var(--ink); opacity:.55;}
  .sbt-title:hover{border-color:var(--hair);}
  .sbt-title:focus{outline:none; border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px rgba(54,153,212,.2);}
  .sbt-chip{flex:none; display:inline-flex; align-items:center; gap:6px; height:28px; max-width:240px; padding:0 11px; border:1px dashed var(--hair); border-radius:999px; background:none; color:var(--ink-soft); font:inherit; font-size:12.5px; font-weight:600; cursor:pointer; white-space:nowrap;}
  .sbt-chip span{overflow:hidden; text-overflow:ellipsis;}
  .sbt-chip:hover{border-color:var(--accent); color:var(--accent);}
  .sbt-chip.on{border-style:solid; border-color:transparent; background:color-mix(in srgb, var(--accent) 11%, var(--surface)); color:var(--accent);}
  .sbt-cnt{flex:none; font-size:12.5px; color:var(--ink-soft); font-variant-numeric:tabular-nums;}
  .sbt-hb{flex:none; display:flex; gap:4px; margin-left:2px;}
  .sbt-hb button{width:30px; height:30px; display:grid; place-items:center; padding:0; border:1px solid transparent; border-radius:8px; background:none; color:var(--ink-soft); cursor:pointer;}
  .sbt-hb button:hover{border-color:var(--hair); color:var(--ink); background:var(--surface);}
  .sbt-hb button[data-sb="play-sq"]{color:var(--accent);}
  .sbt-grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(var(--sbt-w, 230px), 1fr)); gap:16px;}
  .sz-s .sbt-grid{--sbt-w:170px; gap:12px;} .sz-m .sbt-grid{--sbt-w:230px;} .sz-l .sbt-grid{--sbt-w:320px; gap:20px;}
  .sbt-f{min-width:0;}
  .sbt-img{position:relative; aspect-ratio:16/9; border-radius:10px; overflow:hidden; background:#fff; border:1px solid var(--hair); box-shadow:var(--shadow-sm); cursor:zoom-in; transition:transform .14s ease, box-shadow .14s ease;}
  .sbt-img:hover{box-shadow:var(--shadow-md, 0 8px 22px rgba(10,10,20,.14));}
  .sbt-img img{display:block; width:100%; height:100%; object-fit:cover; -webkit-user-drag:none;}
  .sbt-num{position:absolute; top:7px; left:7px; min-width:20px; height:20px; padding:0 6px; display:grid; place-items:center; border-radius:99px; background:rgba(15,17,21,.78); color:#fff; font-size:11px; font-weight:700; font-variant-numeric:tabular-nums;}
  .sbt-tools{position:absolute; top:6px; right:6px; display:flex; gap:4px; opacity:0; transition:opacity .14s ease;}
  .sbt-img:hover .sbt-tools, .sbt-img:focus-within .sbt-tools{opacity:1;}
  .sbt-tools button{width:26px; height:26px; display:grid; place-items:center; padding:0; border:0; border-radius:50%; background:rgba(15,17,21,.78); color:#fff; cursor:pointer;}
  .sbt-tools button:hover{background:var(--accent);} .sbt-tools button[data-sb="del"]:hover{background:#D64545;}
  .sbt-chk{position:absolute; bottom:7px; left:7px; width:22px; height:22px; display:grid; place-items:center; padding:0; border:1.5px solid rgba(255,255,255,.92); border-radius:50%; background:rgba(15,17,21,.5); color:transparent; cursor:pointer; opacity:0; transition:opacity .14s ease;}
  .sbt-img:hover .sbt-chk, .sbt-img:focus-within .sbt-chk, .sbt-f.sel .sbt-chk{opacity:1;}
  .sbt-f.sel .sbt-chk{background:var(--accent); border-color:var(--accent); color:#fff;}
  .sbt-f.sel .sbt-img{outline:2px solid var(--accent); outline-offset:2px;}
  @media (hover:none){ .sbt-tools, .sbt-chk{opacity:1;} }
  .sbt-f.dragging{opacity:.4;}
  .sbt-f.over-b .sbt-img{box-shadow:-4px 0 0 var(--accent);} .sbt-f.over-a .sbt-img{box-shadow:4px 0 0 var(--accent);}
  .sbt-f.flash .sbt-img{animation:rpSbFlash 1.2s ease;}
  .sbt-cap{display:block; width:100%; box-sizing:border-box; margin-top:6px; padding:5px 7px; border:1px solid transparent; border-radius:7px; background:transparent; color:var(--ink); font:inherit; font-size:13px; line-height:1.35;}
  .sbt-cap::placeholder{color:var(--ink-soft); opacity:.7;}
  .sbt-cap:hover{border-color:var(--hair);}
  .sbt-cap:focus{outline:none; border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px rgba(54,153,212,.2);}
  .sbt-add{aspect-ratio:16/9; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; border:1.5px dashed var(--hair); border-radius:10px; color:var(--ink-soft); transition:border-color .14s ease, background .14s ease;}
  .sbt-add:hover{border-color:var(--accent); background:color-mix(in srgb, var(--accent) 4%, transparent);}
  .sbt-add-t{display:flex; align-items:center; gap:7px; font-size:13px; font-weight:600;}
  .sbt-add-t svg{color:var(--accent);}
  .sbt-add-b{display:flex; align-items:center; gap:2px; flex-wrap:wrap; justify-content:center;}
  .sbt-add-b i{width:3px; height:3px; border-radius:50%; background:var(--hair);}
  .sbt-add-b button{height:26px; padding:0 9px; border:0; border-radius:7px; background:none; color:var(--accent); font:inherit; font-size:12.5px; font-weight:600; cursor:pointer;}
  .sbt-add-b button:hover{background:color-mix(in srgb, var(--accent) 10%, transparent);}
  .sz-s .sbt-add{gap:6px;} .sz-s .sbt-add-b button{padding:0 6px; font-size:12px;}
  .sbt-newsq{align-self:flex-start; display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 18px; border:1.5px dashed var(--hair); border-radius:12px; background:none; color:var(--ink-soft); font:inherit; font-size:13.5px; font-weight:600; cursor:pointer;}
  .sbt-newsq svg{color:var(--accent);}
  .sbt-newsq:hover{border-color:var(--accent); color:var(--accent);}
  .sbt-start{max-width:560px; margin:30px auto; padding:34px 30px; text-align:center; background:var(--surface); border:1px solid var(--hair); border-radius:16px; box-shadow:var(--shadow-sm);}
  .sbt-start-ic{width:56px; height:56px; margin:0 auto 14px; display:grid; place-items:center; border-radius:16px; background:color-mix(in srgb, var(--accent) 12%, var(--surface)); color:var(--accent);}
  .sbt-start h3{margin:0 0 8px; font-size:19px; font-weight:700; letter-spacing:-.01em;}
  .sbt-start p{margin:0 0 20px; font-size:14px; line-height:1.55; color:color-mix(in srgb, var(--ink) 78%, var(--surface));}
  .sbt-start-b{display:flex; gap:10px; justify-content:center; flex-wrap:wrap;}
  .sbt-start-b .btn svg{vertical-align:-2px;}
  .sbt-menu{position:fixed; z-index:140; padding:8px; border-radius:12px; background:var(--surface); border:1px solid var(--hair); box-shadow:var(--shadow-md); font-family:var(--sans); animation:rpPop .14s ease;}
  .sbt-menu h4{margin:2px 4px 8px; font-size:10.5px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--ink-soft);}
  .sbt-menu .s{display:flex; flex-direction:column; gap:2px; max-height:300px; overflow-y:auto;}
  .sbt-menu .s button, .sbt-menu .m button{display:flex; align-items:center; gap:9px; width:100%; min-height:32px; padding:4px 9px; border:0; border-radius:8px; background:none; color:var(--ink); font:inherit; font-size:13px; text-align:left; cursor:pointer;}
  .sbt-menu .s button span{flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
  .sbt-menu .s button b{flex:none; min-width:20px; font-size:12px; font-weight:700; color:var(--accent); font-variant-numeric:tabular-nums;}
  .sbt-menu .s button em{flex:none; font-style:normal; font-size:11.5px; color:var(--ink-soft);}
  .sbt-menu .s button:hover, .sbt-menu .m button:hover{background:color-mix(in srgb, var(--accent) 9%, transparent);}
  .sbt-menu .s button.cur{background:color-mix(in srgb, var(--accent) 13%, var(--surface)); box-shadow:inset 3px 0 0 var(--accent); font-weight:600;}
  .sbt-menu .s button[hidden]{display:none;}
  .sbt-menu .m svg{flex:none; color:var(--ink-soft);}
  .sbt-menu .m button:disabled{opacity:.4; cursor:default; background:none;}
  .sbt-menu .m button.danger, .sbt-menu .m button.danger svg{color:var(--danger);}
  .sbt-menu .m button.danger:hover{background:color-mix(in srgb, var(--danger) 9%, transparent);}
  .sbt-menu .m i{display:block; height:1px; margin:5px 4px; background:var(--hair);}
  .sbt-mq{display:block; width:100%; box-sizing:border-box; height:32px; margin:0 0 6px; padding:0 10px; border:1px solid var(--hair); border-radius:8px; background:var(--surface-soft, var(--surface)); color:var(--ink); font:inherit; font-size:13px;}
  .sbt-mq:focus{outline:none; border-color:var(--accent); box-shadow:0 0 0 3px rgba(54,153,212,.2);}
  @media (max-width:760px){ .sbt-wrap{padding:0 16px 60px;} .sbt-sub{padding:6px 16px 12px;} .sbt-cnt{display:none;} .sbt-chip{max-width:170px;} .sbt-grid{--sbt-w:150px !important;}
    .sbt-sh{flex-wrap:wrap; row-gap:8px;} .sbt-title{flex:1 1 calc(100% - 64px);} .sbt-hb{margin-left:auto;} }

  /* visionneuse */
  .sbv{position:fixed; inset:0; z-index:330; display:flex; flex-direction:column; background:#0E0F14; color:#EDEEF5; font-family:var(--sans); outline:none; animation:mmdFade .16s ease-out;}
  .sbv-top{flex:none; display:flex; align-items:center; gap:14px; padding:14px 18px 6px;}
  .sbv-info{flex:1; min-width:0; display:flex; align-items:baseline; gap:12px;}
  .sbv-pos{flex:none; font-size:14px; font-weight:700; font-variant-numeric:tabular-nums;}
  .sbv-sc{min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13.5px; font-weight:600; color:#9A99B0;}
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
  document.head.appendChild(stEl);
})();

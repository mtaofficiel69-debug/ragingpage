/* =====================================================================
   RÉVISIONS COLORÉES (façon Final Draft / WriterDuet)
   ---------------------------------------------------------------------
   Le principe des scénarios de tournage : le texte « blanc » est figé,
   puis chaque nouvelle série de modifications reçoit une couleur (bleue,
   rose, jaune, verte…). Les lignes touchées portent un astérisque dans la
   marge de droite, et chaque page modifiée affiche en haut la couleur et
   la date de la dernière révision qui la concerne.

   COMMENT : au lancement d'une révision, on photographie le texte de
   chaque ligne (p.rev.rounds[k].base = { idLigne: texte }). Les marques
   ne sont JAMAIS stockées ligne par ligne : elles se déduisent en
   comparant le texte actuel à ces photographies. Du coup elles restent
   justes quel que soit le chemin d'édition (frappe, collage, remplacement,
   synonymes, Ctrl+Z…). Une ligne appartient à la révision la plus récente
   qui l'a modifiée.
===================================================================== */
const REV_COLORS = [
  {id:'blue',   fr:'Bleue',   en:'Blue',      ink:'#1d5fc4', bg:'#dbe8fb'},
  {id:'pink',   fr:'Rose',    en:'Pink',      ink:'#d63a82', bg:'#fbdceb'},
  {id:'yellow', fr:'Jaune',   en:'Yellow',    ink:'#a98300', bg:'#fbf1c2'},
  {id:'green',  fr:'Verte',   en:'Green',     ink:'#2a8f4a', bg:'#d9f1df'},
  {id:'gold',   fr:'Dorée',   en:'Goldenrod', ink:'#b36b00', bg:'#f6e0b4'},
  {id:'buff',   fr:'Chamois', en:'Buff',      ink:'#8c6d4a', bg:'#efe3d0'},
  {id:'salmon', fr:'Saumon',  en:'Salmon',    ink:'#d2553f', bg:'#fbd9d0'},
  {id:'cherry', fr:'Cerise',  en:'Cherry',    ink:'#b3173f', bg:'#f4cdd7'},
  {id:'tan',    fr:'Beige',   en:'Tan',       ink:'#7a6a55', bg:'#e8dfd2'}
];
const REV_UI = { color:null, cmp:null };

function revColor(id){ return REV_COLORS.find(c=>c.id===id) || REV_COLORS[0]; }
function revColorName(id){ const c = revColor(id); return L(c.fr, c.en); }
function revEnsure(p){
  if(!p.rev || !Array.isArray(p.rev.rounds)) p.rev = { rounds:[], show:true, inExport:true, paper:true, inText:true };
  if(p.rev.show === undefined) p.rev.show = true;
  if(p.rev.inExport === undefined) p.rev.inExport = true;
  if(p.rev.paper === undefined) p.rev.paper = true;      // papier de couleur (PDF / impression)
  if(p.rev.inText === undefined) p.rev.inText = true;    // marques dans .txt / .fountain / .fdx
  if(!p.rev.manual) p.rev.manual = {};                   // lignes marquées à la main { id: indice de révision }
  if(!p.rev.hidden) p.rev.hidden = {};                   // lignes démarquées à la main { id: texte au moment du démarquage }
  return p.rev;
}
function revDateStr(ts){
  try{ return new Date(ts).toLocaleDateString(L('fr-FR','en-US'), {day:'2-digit', month:'2-digit', year:'numeric'}); }
  catch(e){ return ''; }
}
/* { idLigne: indice de la révision qui l'a modifiée en dernier } */
function revCalc(p){
  const r = revEnsure(p), n = r.rounds.length, marks = {}, delOnly = {}, del = r.rounds.map(()=>0);
  if(!n) return { marks, delOnly, del };
  const live = p.elements.filter(el=>el.type !== 'note'), liveSet = new Set(live.map(e=>e.id));
  live.forEach(el=>{
    let next = el.text || '';
    for(let k = n - 1; k >= 0; k--){
      const base = r.rounds[k].base || {};
      const has = Object.prototype.hasOwnProperty.call(base, el.id);
      const prev = has ? base[el.id] : null;
      if(prev !== next){ marks[el.id] = k; break; }
      next = prev;
    }
  });
  // Suppressions : une ligne présente à la photo k et absente aujourd'hui laisse un
  // astérisque sur la ligne qui la précédait (comme dans Final Draft).
  if(live.length) r.rounds.forEach((rd, k)=>{
    const base = rd.base || {};
    let last = null, pend = [];
    const put = id=>{
      if(marks[id] === undefined || marks[id] < k){ marks[id] = k; delOnly[id] = true; }
    };
    Object.keys(base).forEach(id=>{
      if(liveSet.has(id)){
        if(pend.length && last === null) put(id);
        pend = []; last = id;
      } else if((base[id] || '').trim()){
        del[k]++;
        if(last !== null) put(last); else pend.push(id);
      }
    });
    if(pend.length && last === null) put(live[0].id);
  });
  // Marquage manuel (Ctrl+Alt+M) : forcé en plus, ou retiré tant que le texte n'a pas rebougé.
  const man = r.manual || {}, hid = r.hidden || {};
  Object.keys(man).forEach(id=>{
    const k = man[id];
    if(k < n && liveSet.has(id) && (marks[id] === undefined || marks[id] < k)){ marks[id] = k; delete delOnly[id]; }
  });
  live.forEach(el=>{
    if(hid[el.id] !== undefined && hid[el.id] === (el.text || '')){ delete marks[el.id]; delete delOnly[el.id]; }
  });
  return { marks, delOnly, del };
}
function revMarks(p){ return revCalc(p).marks; }
/* Scènes omises : numéro figé d'une scène qui n'est plus dans le scénario
   (corbeille ou supprimée définitivement). Le numéro n'est jamais réattribué. */
function revOmittedScenes(p){
  p = p || S.project;
  if(!p.settings || !p.settings.numbersLocked) return [];
  const set = new Set((p.omittedNums || []).map(String));
  (p.graveyard || []).forEach(g=>{ if(g.meta && g.meta.lockedNum) set.add(String(g.meta.lockedNum)); });
  return Array.from(set).sort((a,b)=>{
    const ma = /^(\d+)(.*)$/.exec(a) || [0,0,a], mb = /^(\d+)(.*)$/.exec(b) || [0,0,b];
    return (+ma[1] - +mb[1]) || String(ma[2]).localeCompare(String(mb[2]));
  });
}
/* Hauteur de chaque ligne visuelle d'un bloc (un astérisque par ligne). */
function revLineTops(div){
  const rg = document.createRange(); rg.selectNodeContents(div);
  const tops = [];
  Array.from(rg.getClientRects()).filter(r=>r.height>0).forEach(r=>{
    if(!tops.some(t=>Math.abs(t.top - r.top) < 3)) tops.push({top:r.top, h:r.height});
  });
  if(!tops.length){ const r = div.getBoundingClientRect(); tops.push({top:r.top, h:r.height}); }
  return tops.sort((a,b)=>a.top-b.top);
}
function revLabelText(k, p){
  const rd = (p || S.project).rev.rounds[k];
  return L('RÉVISION ','REVISED ') + revColorName(rd.color).toUpperCase() + ' · ' + revDateStr(rd.date);
}
function revCss(){
  if(document.getElementById('revCss')) return;
  const st = document.createElement('style'); st.id = 'revCss';
  st.textContent = `
  #revMarks{position:absolute; inset:0; z-index:3; pointer-events:none; -webkit-user-select:none; user-select:none;}
  .rev-star, .rev-label{position:absolute; font-family:var(--script-font,var(--mono)); white-space:nowrap; font-weight:700;}
  .rev-star{left:calc(var(--page-w,21cm) - var(--pm-right,2.5cm) + .45cm); font-size:12pt; width:.8cm;}
  .rev-omit{position:absolute; left:var(--pm-left,3cm); right:var(--pm-right,2.5cm); bottom:calc(var(--pm-bottom,2.5cm) * .35); font-family:var(--script-font,var(--mono)); font-size:9pt; color:#555; line-height:1.3;}
  .rev-label{right:calc(var(--pm-right,2.5cm) + 1.7cm); top:var(--pn-top,1.2cm); font-size:9.5pt; letter-spacing:.04em;}
  #printArea .print-page, #pdfStage .print-page, #printArea .rev-star, #printArea .rev-label, #printArea .rev-omit{-webkit-print-color-adjust:exact; print-color-adjust:exact;}
  #revBackdrop .modal{max-width:470px; max-height:90vh; overflow:auto;}
  #revBackdrop .rv-sub{font-size:13.5px; color:var(--ink-soft); margin:-8px 0 14px; line-height:1.45;}
  #revBackdrop .rv-row{display:flex; align-items:center; gap:10px; padding:8px 10px; border:1px solid var(--hair); border-radius:4px; margin-bottom:6px; font-size:14px;}
  #revBackdrop .rv-dot{width:14px; height:14px; border-radius:50%; flex:none;}
  #revBackdrop .rv-row span.rv-n{margin-left:auto; color:var(--ink-soft); font-size:12.5px;}
  #revBackdrop .rv-sw{display:flex; flex-wrap:wrap; gap:8px; margin:6px 0 14px;}
  #revBackdrop .rv-sw button{display:flex; align-items:center; gap:6px; padding:5px 10px 5px 6px; border:2px solid var(--hair); background:var(--surface-soft); color:var(--ink); border-radius:16px; font:13px var(--sans); cursor:pointer;}
  #revBackdrop .rv-sw button.on{border-color:var(--accent);}
  #revBackdrop .rv-chk{display:flex; align-items:center; gap:8px; font-size:13.5px; margin:6px 0; cursor:pointer;}
  #revBackdrop .rv-cmp{border:1px solid var(--hair); border-radius:4px; padding:8px 10px; margin:0 0 8px; max-height:240px; overflow:auto; font-size:13px;}
  #revBackdrop .rv-cmp-h{font-weight:700; margin-bottom:6px;}
  #revBackdrop .rv-cmp-row{padding:4px 0; border-top:1px solid var(--hair);}
  #revBackdrop .rv-cmp-row del{display:block; color:var(--ink-soft);}
  #revBackdrop .rv-cmp-row ins{display:block; text-decoration:none;}
  #revBackdrop .rv-cmp-row em{display:block; color:var(--ink-soft);}
  #revBackdrop .rv-row button.rv-see{margin-left:auto; border:1px solid var(--hair); background:none; color:var(--ink); border-radius:12px; padding:2px 9px; font:12px var(--sans); cursor:pointer;}
  #revBackdrop h3{font:700 11px var(--sans); letter-spacing:.07em; text-transform:uppercase; color:var(--ink-soft); margin:16px 0 8px;}
  `;
  document.head.appendChild(st);
}

/* ---- Éditeur : astérisques dans la marge + étiquette en haut de page ---- */
function revDraw(){
  const stack = document.getElementById('pageStack'), page = document.getElementById('page');
  let layer = document.getElementById('revMarks');
  if(!stack || !page || !S.project || S.tab !== 'editor'){ if(layer) layer.remove(); return; }
  const p = S.project, r = revEnsure(p);
  if(!r.rounds.length || !r.show){ if(layer) layer.remove(); return; }
  revCss();
  if(!layer){ layer = document.createElement('div'); layer.id = 'revMarks'; stack.appendChild(layer); }
  const sr = stack.getBoundingClientRect();
  const sc = (stack.offsetWidth ? sr.width / stack.offsetWidth : 1) || 1;
  const rc = revCalc(p), marks = rc.marks;
  const sheets = Array.from(document.querySelectorAll('#sheets .sheet')).map(s=>({top:s.offsetTop, h:s.offsetHeight}));
  const pageBest = {};
  let html = '';
  page.querySelectorAll('.line[data-id]').forEach(div=>{
    const k = marks[div.dataset.id]; if(k === undefined) return;
    const ink = revColor(r.rounds[k].color).ink;
    const tl = revLineTops(div);
    (rc.delOnly[div.dataset.id] ? tl.slice(-1) : tl).forEach(t=>{
      const y = (t.top - sr.top) / sc, h = t.h / sc;
      html += `<div class="rev-star" style="top:${y.toFixed(1)}px;height:${h.toFixed(1)}px;line-height:${h.toFixed(1)}px;color:${ink}">*</div>`;
      const mid = y + h / 2;
      const si = sheets.findIndex(s=> mid >= s.top && mid < s.top + s.h);
      if(si >= 0) pageBest[si] = Math.max(pageBest[si] === undefined ? -1 : pageBest[si], k);
    });
  });
  Object.keys(pageBest).forEach(si=>{
    const k = pageBest[si], ink = revColor(r.rounds[k].color).ink;
    html += `<div class="rev-label" style="top:${sheets[si].top}px;color:${ink}">${esc(revLabelText(k))}</div>`;
  });
  layer.innerHTML = html;
}
let REV_T = null;
function scheduleRevDraw(ms){
  clearTimeout(REV_T);
  REV_T = setTimeout(()=>{ try{ revDraw(); }catch(e){} }, ms === undefined ? 180 : ms);
}

/* ---- Impression / PDF : mêmes marques, posées sur chaque feuille ---- */
/* Scènes et pages omises : mention en pied de la dernière feuille (impression et PDF),
   lue telle quelle par pdfReadSheet comme les autres marques. */
function revOmitNote(sheets, p){
  if(!sheets.length) return;
  const sc = revOmittedScenes(p);
  const pg = (p === S.project && S.pagination && S.pagination.omitted) ? S.pagination.omitted : [];
  if(!sc.length && !pg.length) return;
  revCss();
  const parts = [];
  if(sc.length) parts.push(L('Scènes omises (OMITTED) : ','Omitted scenes: ') + sc.join(', '));
  if(pg.length) parts.push(L('Pages omises (OMITTED) : ','Omitted pages: ') + pg.join(', '));
  const last = sheets[sheets.length - 1];
  const d = document.createElement('div');
  d.className = 'rev-omit'; d.textContent = parts.join('  ·  ');
  last.appendChild(d);
}
function revDecorateSheets(sheets, p){
  const r = revEnsure(p);
  try{ revOmitNote(sheets, p); }catch(e){}
  if(!r.rounds.length) return;
  if(!r.inExport && !r.paper) return;
  revCss();   // indispensable aussi pour un export de série : l'épisode exporté n'est pas forcément ouvert
  const rc = revCalc(p), marks = rc.marks;
  sheets.forEach(sheet=>{
    const sr = sheet.getBoundingClientRect();
    let best = -1;
    const stars = [];
    sheet.querySelectorAll('.line[data-id]').forEach(div=>{
      const k = marks[div.dataset.id]; if(k === undefined) return;
      best = Math.max(best, k);
      const ink = revColor(r.rounds[k].color).ink;
      const tl = revLineTops(div);
      (rc.delOnly[div.dataset.id] ? tl.slice(-1) : tl).forEach(t=> stars.push({ top:t.top - sr.top, h:t.h, ink }));
    });
    if(best < 0) return;                      // page intacte : reste blanche, sans marque
    const col = revColor(r.rounds[best].color);
    // Papier de couleur : la page prend la teinte de sa révision la plus récente,
    // comme les pages de remplacement d'un vrai tournage. pdfReadSheet relit
    // ce fond tel quel, le PDF le reproduit donc sans code supplémentaire.
    if(r.paper) sheet.style.background = col.bg;
    if(!r.inExport) return;
    stars.forEach(t=>{
      const el = document.createElement('div');
      el.className = 'rev-star'; el.textContent = '*';
      el.style.cssText = `top:${t.top.toFixed(1)}px;height:${t.h.toFixed(1)}px;line-height:${t.h.toFixed(1)}px;color:${t.ink};`;
      sheet.appendChild(el);
    });
    const l = document.createElement('div');
    l.className = 'rev-label'; l.textContent = revLabelText(best, p);
    l.style.color = col.ink;
    sheet.appendChild(l);
  });
}

/* ---- Exports texte : .txt, .fountain, .fdx ----
   Mêmes marques que dans l'éditeur, déduites de la même comparaison.
   - .txt : astérisque calé au bord droit (colonne 78), comme sur une page.
   - .fountain : note [[révision bleue]] en fin de ligne (syntaxe standard,
     ignorée à l'affichage par WriterDuet, Fade In, Highland…). Les lignes
     Personnage et Parenthèse ne la portent pas : elle casserait leur
     détection chez la plupart des lecteurs ; leur marque passe à la
     réplique qui suit.
   - .fdx : attribut RevisionID sur chaque <Text> + liste <Revisions>. */
function revTextMarks(p){
  p = p || S.project;
  const r = revEnsure(p);
  if(!r.rounds.length || !r.inText) return null;
  return revMarks(p);
}
function revOmittedText(p){
  const om = revOmittedScenes(p);
  return om.length ? L('Scènes omises (OMITTED) : ','Omitted scenes: ') + om.join(', ') : '';
}
function revLegendText(p){
  const r = revEnsure(p), om = revOmittedText(p);
  if(!r.rounds.length || !r.inText) return om;
  return L('Révisions','Revisions') + ' : ' +
    r.rounds.map(rd=> revColorName(rd.color) + ' (' + revDateStr(rd.date) + ')').join(', ') +
    ' — * ' + L('= ligne modifiée','= changed line') + (om ? '\n' + om : '');
}
function revTxtStar(line){
  const W = 78;
  if(line.length >= W - 2) return line + ' *';
  return line + ' '.repeat(W - line.length - 1) + '*';
}
function revFountainNote(k, p){
  const r = revEnsure(p || S.project);
  return '[[' + L('révision ','revision ') + revColorName(r.rounds[k].color).toLowerCase() + ']]';
}
function revFdxColor(hex){ return String(hex).toUpperCase() + '000000'; }
function revFdxBlock(p){
  const r = revEnsure(p);
  if(!r.rounds.length || !r.inText) return '';
  const rows = ['<Revision ID="0" Name="White Revision" Color="#FFFFFF000000" Mark="" Style=""/>'].concat(r.rounds.map((rd, i)=>{
    const c = revColor(rd.color);
    return `<Revision ID="${i+1}" Name="${esc(c.en + ' Revision')}" Color="${revFdxColor(c.ink)}" Mark="*" Style=""/>`;
  })).join('\n');
  return `<Revisions ActiveSet="${r.rounds.length}">\n${rows}\n</Revisions>\n`;
}

/* ---- Fenêtre « Révisions » ---- */
function revNextColor(r){
  if(!r.rounds.length) return REV_COLORS[0].id;
  const last = REV_COLORS.findIndex(c=>c.id === r.rounds[r.rounds.length-1].color);
  return REV_COLORS[(last + 1) % REV_COLORS.length].id;
}
/* Comparaison : ce que la révision k a changé (avant → après), plus les lignes disparues depuis. */
function revCmpHtml(p, k){
  const r = revEnsure(p), rc = revCalc(p), base = r.rounds[k].base || {};
  const c = revColor(r.rounds[k].color), cut = t=> esc(String(t || '').trim().slice(0, 160));
  const live = p.elements.filter(e=>e.type !== 'note'), liveSet = new Set(live.map(e=>e.id));
  const ch = live.filter(e=> rc.marks[e.id] === k && !rc.delOnly[e.id]);
  const dl = Object.keys(base).filter(id=> !liveSet.has(id) && (base[id] || '').trim());
  const rows = ch.slice(0, 40).map(e=>{
    const had = Object.prototype.hasOwnProperty.call(base, e.id) && (base[e.id] || '').trim();
    return `<div class="rv-cmp-row">${had ? `<del>${cut(base[e.id])}</del>` : `<em>${L('nouvelle ligne','new line')}</em>`}<ins>${cut(e.text)}</ins></div>`;
  }).join('') + dl.slice(0, 20).map(id=>`<div class="rv-cmp-row"><del>${cut(base[id])}</del><em>${L('supprimée','deleted')}</em></div>`).join('');
  const more = Math.max(0, ch.length - 40) + Math.max(0, dl.length - 20);
  return `<div class="rv-cmp"><div class="rv-cmp-h" style="color:${c.ink}">${L('Changements de la révision ','Changes in the ')}${esc(revColorName(r.rounds[k].color))}${L('',' revision')} · ${ch.length} ${L('modifiée(s)','changed')}, ${dl.length} ${L('supprimée(s)','deleted')}</div>${rows || `<em>${L('Aucun changement.','No changes.')}</em>`}${more ? `<div class="rv-cmp-row"><em>${L('…et ' + more + ' autre(s).','…and ' + more + ' more.')}</em></div>` : ''}</div>`;
}
function revModalInner(){
  const p = S.project, r = revEnsure(p), rc = revCalc(p), marks = rc.marks;
  const counts = r.rounds.map(()=>0);
  Object.keys(marks).forEach(id=>{ counts[marks[id]]++; });
  if(!REV_UI.color) REV_UI.color = revNextColor(r);
  const cur = r.rounds.length ? r.rounds[r.rounds.length-1] : null;
  const rows = r.rounds.length
    ? r.rounds.map((rd, k)=>{
        const c = revColor(rd.color), n = counts[k];
        return `<div class="rv-row"><span class="rv-dot" style="background:${c.ink}"></span><b>${esc(revColorName(rd.color))}</b><span>${esc(revDateStr(rd.date))}</span><span class="rv-n">${n} ${L(n>1?'lignes':'ligne', n>1?'lines':'line')}${rc.del[k] ? ' · ' + rc.del[k] + ' ' + L(rc.del[k]>1?'supprimées':'supprimée', rc.del[k]>1?'deleted':'deleted') : ''}${k===r.rounds.length-1 ? ' · ' + L('en cours','active') : ''}</span><button class="rv-see" data-rv="cmp" data-k="${k}">${REV_UI.cmp===k ? L('Masquer','Hide') : L('Voir','View')}</button></div>`;
      }).reverse().join('')
    : `<div class="rv-sub" style="margin:0 0 6px;">${L('Aucune révision pour l\u2019instant : le texte actuel est la version blanche.','No revisions yet: the current text is the white draft.')}</div>`;
  const sw = REV_COLORS.map(c=>`<button data-rc="${c.id}" class="${REV_UI.color===c.id?'on':''}"><span class="rv-dot" style="background:${c.ink}"></span>${esc(L(c.fr,c.en))}</button>`).join('');
  return `<h2>${L('Révisions colorées','Colour revisions')}</h2>
    <p class="rv-sub">${L('Fige le texte actuel et lance une nouvelle couleur : chaque ligne modifiée ensuite reçoit un astérisque dans la marge, et chaque page touchée indique sa couleur et sa date.','Freezes the current text and starts a new colour: every line changed afterwards gets an asterisk in the margin, and each touched page shows its colour and date.')}</p>
    <h3>${L('Historique','History')}</h3>${rows}${(REV_UI.cmp != null && r.rounds[REV_UI.cmp]) ? revCmpHtml(p, REV_UI.cmp) : ''}
    <h3>${L('Nouvelle révision','New revision')}</h3>
    <div class="rv-sw">${sw}</div>
    <button class="btn btn-primary" data-rv="new">${L('Lancer la révision ','Start the ')}${esc(revColorName(REV_UI.color))}${L('',' revision')}</button>
    ${cur ? `<button class="btn btn-ghost" data-rv="del" style="margin-left:6px;">${L('Annuler la dernière','Undo the last one')}</button>` : ''}
    <h3>${L('Numéros de page','Page numbers')}</h3>
    <p class="rv-sub" style="margin:0 0 8px;">${L('Verrouille la pagination actuelle : une page modifiée garde son numéro et les pages ajoutées deviennent 12A, 12B… Un saut de page est forcé devant chaque page figée.','Locks the current pagination: a revised page keeps its number and added pages become 12A, 12B… A page break is forced before each locked page.')}</p>
    ${p.pageLock ? `<div class="rv-row"><span class="rv-dot" style="background:var(--accent)"></span><b>${L('Pages verrouillées','Pages locked')}</b><span>${esc(revDateStr(p.pageLock.date))}</span><span class="rv-n">${p.pageLock.pages.length} ${L('pages','pages')}</span></div>
      ${(S.pagination.omitted||[]).length ? `<div class="rv-sub" style="margin:0 0 8px;">${L('Pages omises (OMITTED) : ','Omitted pages: ')}${esc(S.pagination.omitted.join(', '))}</div>` : ''}` : ''}
    ${revOmittedScenes(p).length ? `<div class="rv-sub" style="margin:0 0 8px;">${esc(revOmittedText(p))}</div>` : ''}
    <button class="btn btn-primary" data-rv="plock">${p.pageLock ? L('Figer à nouveau les pages','Re-lock the pages') : L('Verrouiller les pages','Lock the pages')}</button>
    ${p.pageLock ? `<button class="btn btn-ghost" data-rv="punlock" style="margin-left:6px;">${L('Déverrouiller','Unlock')}</button>` : ''}
    <h3>${L('Affichage','Display')}</h3>
    <label class="rv-chk"><input type="checkbox" data-rv="show" ${r.show?'checked':''}> ${L('Afficher les astérisques dans l\u2019éditeur','Show asterisks in the editor')}</label>
    <label class="rv-chk"><input type="checkbox" data-rv="exp" ${r.inExport?'checked':''}> ${L('Astérisques et étiquette dans le PDF et l\u2019impression','Asterisks and label in the PDF and print')}</label>
    <label class="rv-chk"><input type="checkbox" data-rv="paper" ${r.paper?'checked':''}> ${L('Papier de couleur : les pages modifiées prennent la teinte de leur révision (PDF et impression)','Coloured paper: changed pages take the tint of their revision (PDF and print)')}</label>
    <label class="rv-chk"><input type="checkbox" data-rv="txt" ${r.inText?'checked':''}> ${L('Marquer les lignes modifiées dans les exports .txt, .fountain et .fdx','Mark changed lines in the .txt, .fountain and .fdx exports')}</label>
    <div class="rv-sub" style="margin:10px 0 0;">${L('Raccourci : Ctrl+Alt+R (Cmd+Alt+R sur Mac).','Shortcut: Ctrl+Alt+R (Cmd+Alt+R on Mac).')}</div>
    <div class="modal-actions"><button class="btn btn-ghost" data-rv="close">${L('Fermer','Close')}</button></div>`;
}
/* Marque / démarque à la main la ligne où se trouve le curseur (Ctrl+Alt+M). */
function revToggleLine(){
  if(!S.project || S.tab !== 'editor') return;
  const p = S.project, r = revEnsure(p);
  if(!r.rounds.length){ toast(L('Lance d\u2019abord une révision.','Start a revision first.')); return; }
  const sel = window.getSelection(); let n = sel && sel.anchorNode;
  if(n && n.nodeType === 3) n = n.parentNode;
  const div = n && n.closest ? n.closest('.line[data-id]') : null;
  const el = div ? p.elements.find(e=>e.id === div.dataset.id) : null;
  if(!el || el.type === 'note'){ toast(L('Place le curseur dans une ligne du scénario.','Put the cursor in a screenplay line.')); return; }
  const marked = revCalc(p).marks[el.id] !== undefined;
  if(marked){ delete r.manual[el.id]; r.hidden[el.id] = el.text || ''; toast(L('Ligne démarquée.','Line unmarked.')); }
  else { delete r.hidden[el.id]; r.manual[el.id] = r.rounds.length - 1; toast(L('Ligne marquée.','Line marked.')); }
  scheduleAutosave(); revDraw();
}
function openRevisions(){
  if(!S.project || S.tab !== 'editor') return;
  closeRevisions(); revCss();
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="revBackdrop"><div class="modal" data-stop="1">${revModalInner()}</div></div>`);
  const bd = document.getElementById('revBackdrop');
  const redraw = ()=>{ bd.querySelector('.modal').innerHTML = revModalInner(); };
  bd.addEventListener('click', async e=>{
    if(e.target === bd){ closeRevisions(); return; }
    const sw = e.target.closest('[data-rc]');
    if(sw){ REV_UI.color = sw.dataset.rc; redraw(); return; }
    const b = e.target.closest('button[data-rv]'); if(!b) return;
    const p = S.project, r = revEnsure(p), act = b.dataset.rv;
    if(act === 'close'){ closeRevisions(); }
    else if(act === 'new'){
      const base = {};
      p.elements.forEach(el=>{ if(el.type !== 'note') base[el.id] = el.text || ''; });
      r.rounds.push({ color:REV_UI.color, date:Date.now(), base });
      REV_UI.color = revNextColor(r);
      scheduleAutosave(); redraw(); revDraw();
      toast(L('Révision ' + revColorName(r.rounds[r.rounds.length-1].color).toLowerCase() + ' lancée : tes modifications seront marquées.','Revision started: your changes will be marked.'));
    }
    else if(act === 'plock' || act === 'punlock'){
      if(act === 'plock') plLock(p); else p.pageLock = null;
      scheduleAutosave(); try{ paginateEditor(); }catch(e){} redraw(); revDraw();
      toast(act === 'plock' ? L('Pages verrouillées.','Pages locked.') : L('Pages déverrouillées.','Pages unlocked.'));
    }
    else if(act === 'cmp'){ const k = +b.dataset.k; REV_UI.cmp = (REV_UI.cmp === k) ? null : k; redraw(); }
    else if(act === 'del'){
      if(!r.rounds.length) return;
      if(!await mmConfirm(L('Ses marques disparaissent. Le texte n\u2019est pas modifié.','Its marks disappear. The text is not changed.'),
        {title:L('Annuler la dernière révision ?','Undo the last revision?'), ok:L('Annuler la révision','Undo revision'), cancel:L('Garder','Keep'), danger:true})) return;
      r.rounds.pop(); REV_UI.color = revNextColor(r);
      scheduleAutosave(); redraw(); revDraw();
    }
  });
  bd.addEventListener('change', e=>{
    const c = e.target.closest('input[data-rv]'); if(!c) return;
    const r = revEnsure(S.project);
    if(c.dataset.rv === 'show') r.show = c.checked;
    if(c.dataset.rv === 'exp') r.inExport = c.checked;
    if(c.dataset.rv === 'paper') r.paper = c.checked;
    if(c.dataset.rv === 'txt') r.inText = c.checked;
    scheduleAutosave(); revDraw();
  });
}
function closeRevisions(){ const b = document.getElementById('revBackdrop'); if(b) b.remove(); }
ACTIONS.openRevisions = openRevisions;
ACTIONS.toggleRevMark = revToggleLine;

// Redessin des astérisques : après chaque pagination, à la frappe et au redimensionnement.
(function(){
  const basePaginate = paginateEditor;
  paginateEditor = function(){
    const out = basePaginate.apply(this, arguments);
    scheduleRevDraw(30);
    return out;
  };
  document.addEventListener('input', ()=>scheduleRevDraw(220), true);
  window.addEventListener('resize', ()=>scheduleRevDraw(260));
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape' && document.getElementById('revBackdrop')) closeRevisions();
    if((e.ctrlKey || e.metaKey) && e.altKey && !e.shiftKey && e.code === 'KeyM'){ e.preventDefault(); revToggleLine(); return; }
    // Ctrl+Alt+R (Cmd+Alt+R sur Mac) : ouvre / ferme la fenêtre des révisions.
    // e.code et non e.key : avec Alt, le Mac renvoie un autre caractère que « r ».
    if((e.ctrlKey || e.metaKey) && e.altKey && !e.shiftKey && e.code === 'KeyR'){
      e.preventDefault();
      if(document.getElementById('revBackdrop')) closeRevisions(); else openRevisions();
    }
  }, true);
})();



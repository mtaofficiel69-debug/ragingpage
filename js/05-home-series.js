/* =====================================================================
   RENDER: ROOT
===================================================================== */
function render(){
  try{ applyLineSpacing(S.view==='editor' ? S.project : null); }catch(e){}
  const app = document.getElementById('app');
  document.title = L('Raging Page : écriture de scénario','Raging Page: screenwriting');
  if(S.view==='home'){ app.innerHTML = renderHome(); attachHomeEvents(); }
  else if(S.view==='series'){ app.innerHTML = renderSeriesHub(); }
  else{ applyScriptFont(S.project); app.innerHTML = renderEditorShell(); attachEditorEvents(); renderTabBody(); }
}

/* =====================================================================
   HOME
===================================================================== */
function esc(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
/* Ce texte relatif est généré directement dans la langue active plutôt que
   traduit après coup : la valeur ("5 min", "2 j"...) change à chaque
   rendu, un dictionnaire à correspondance exacte ne peut pas la capturer. */
function timeAgo(ts){
  const diff = Date.now()-ts; const m = Math.floor(diff/60000);
  const en = getLang()==='en';
  if(m<1) return en ? 'just now' : 'à l\u2019instant';
  if(m<60) return en ? m+' min ago' : 'il y a '+m+' min';
  const h = Math.floor(m/60); if(h<24) return en ? h+' h ago' : 'il y a '+h+' h';
  const d = Math.floor(h/24); if(d<30) return en ? d+' d ago' : 'il y a '+d+' j';
  return new Date(ts).toLocaleDateString(en ? 'en-US' : 'fr-FR');
}
/* Regroupe les entrées de l'index : les épisodes d'une même série
   (identifiés par seriesId) sont fondus en UNE seule carte, pour que
   l'accueil reste lisible même quand une série compte des dizaines
   d'épisodes. Les projets sans seriesId (long métrage, court métrage,
   documentaire…) restent affichés un par un, comme avant. */
function groupHomeEntries(){
  const seriesMap = new Map();
  const rows = [];
  S.projectsIndex.forEach(p=>{
    if(p.seriesId){
      if(!seriesMap.has(p.seriesId)) seriesMap.set(p.seriesId, []);
      seriesMap.get(p.seriesId).push(p);
    }else{
      rows.push({ type:'single', entry:p, sortAt:p.updatedAt });
    }
  });
  seriesMap.forEach((entries, seriesId)=>{
    rows.push({ type:'series', seriesId, entries, sortAt: Math.max(...entries.map(e=>e.updatedAt)) });
  });
  return rows.sort((a,b)=>b.sortAt-a.sortAt);
}
function renderHome(){
  const groups = groupHomeEntries();
  const rows = groups.map(g=>{
    if(g.type==='series'){
      const entries = g.entries;
      const seasons = new Set(entries.map(e=>e.season||1));
      const name = entries.find(e=>e.seriesName)?.seriesName || entries[0].title;
      return `
    <div class="proj-row" data-act="openSeriesHub" data-id="${g.seriesId}">
      <div class="wd-title"><span class="wd-ico"></span><div style="min-width:0;">
        <div class="proj-name">${esc(name)}</div>
        <div class="proj-meta">${seasons.size} ${L(seasons.size>1?'saisons':'saison', seasons.size>1?'seasons':'season')} \u00b7 ${entries.length} ${L(entries.length>1?'épisodes':'épisode', entries.length>1?'episodes':'episode')}</div>
      </div></div>
      <div class="wd-cell wd-fmt"><span class="proj-badge">${L('Série','Series')}</span></div>
      <div class="wd-cell wd-date">${timeAgo(g.sortAt)}</div>
      <div class="proj-row-actions">
        <button class="btn btn-sm btn-ghost" data-act="renameSeries" data-id="${g.seriesId}" data-stop="1">${L('Renommer','Rename')}</button>
      </div>
    </div>`;
    }
    const p = g.entry;
    return `
    <div class="proj-row" data-act="openProject" data-id="${p.id}">
      <div class="wd-title"><span class="wd-ico"></span><div style="min-width:0;">
        <div class="proj-name">${esc(p.title)}</div>
      </div></div>
      <div class="wd-cell wd-fmt"><span class="proj-badge">${formatLabel(p.format)}</span></div>
      <div class="wd-cell wd-date">${timeAgo(p.updatedAt)}</div>
      <div class="proj-row-actions">
        <button class="btn btn-sm btn-ghost" data-act="renameProject" data-id="${p.id}" data-stop="1">${L('Renommer','Rename')}</button>
        <button class="btn btn-sm btn-danger btn-ghost" data-act="deleteProject" data-id="${p.id}" data-stop="1">${L('Supprimer','Delete')}</button>
      </div>
    </div>`;
  }).join('');
  const nb = groups.length;
  const list = rows
    ? `<div class="wd-thead"><span>${L('Titre','Title')}</span><span class="wd-fmt">${L('Format','Format')}</span><span>${L('Modifié','Modified')}</span><span></span></div>
       <div class="home-list-scroll"><div class="proj-list">${rows}</div></div>`
    : `<div class="wd-empty"><span class="wd-ico"></span>
         <p>${L('Aucun scénario pour l\u2019instant. Crée le premier, tu pourras écrire dès l\u2019écran suivant.','No screenplay yet. Create the first one, and you\u2019ll be writing on the very next screen.')}</p>
         <button class="btn btn-primary" data-act="openCreateModal">${icon('plus')} ${L('Nouveau scénario','New screenplay')}</button>
         <button class="btn" data-act="openSampleModal" style="margin-top:8px;">${icon('book')} ${L('Voir le scénario d\u2019exemple','See the example screenplay')}</button>
       </div>`;
  return `
  <div id="homeView">
    <header class="wd-top">
      <div class="wd-brand">
        ${mmLogo(40,'wd-logo',true)}
        ${mmWordmark()}
      </div>
      <div class="wd-top-r">${appLinksHtml()}${langFlagsHtml()}${themeToggleBtnHtml('btn-ghost btn-sm')}</div>
    </header>
      <div class="wd-set"><div class="wd-set-col wd-set-l"><div class="wd-strip"></div>
        <svg viewBox="0 0 124 112" aria-hidden="true"><defs><clipPath id="wdCa"><rect x="14" y="29" width="96" height="13" rx="3"/></clipPath><clipPath id="wdCb"><rect x="14" y="44" width="96" height="11" rx="2"/></clipPath></defs>
          <ellipse class="sh" cx="62" cy="106" rx="46" ry="4"/>
          <rect class="st fs" x="14" y="44" width="96" height="58" rx="5"/>
          <g clip-path="url(#wdCb)"><rect class="fs" x="14" y="44" width="96" height="11"/><path class="st ac" d="M26 56l8-12M46 56l8-12M66 56l8-12M86 56l8-12M106 56l8-12"/></g><rect class="st" x="14" y="44" width="96" height="11" rx="2"/>
          <text x="22" y="72" font-size="7.5">${L('SCÈNE','SCENE')}</text><text x="22" y="87" font-size="7.5">${L('PRISE','TAKE')}</text><text x="64" y="72" font-size="11" style="fill:var(--accent)">12</text><text x="64" y="87" font-size="11" style="fill:var(--accent)">3</text><path class="st" d="M20 76h84M20 91h84" style="opacity:.35"/>
          <g class="wd-clap"><rect class="st fs" x="14" y="29" width="96" height="13" rx="3"/><g clip-path="url(#wdCa)"><path class="st ac" d="M22 43l8-14M42 43l8-14M62 43l8-14M82 43l8-14M102 43l8-14"/></g><rect class="st" x="14" y="29" width="96" height="13" rx="3"/></g></svg>
        <svg viewBox="0 0 124 120" aria-hidden="true">
          <ellipse class="sh" cx="60" cy="115" rx="34" ry="3.5"/><path class="st" d="M60 86L40 113M60 86v27M60 86l20 27"/><rect class="st fs" x="50" y="80" width="20" height="7" rx="2.5"/>
          <rect class="st fs" x="14" y="52" width="9" height="15" rx="2.5"/><rect class="st fs" x="22" y="44" width="68" height="36" rx="7"/><path class="st" d="M90 52h8v20h-8"/><path class="st fs" d="M98 53l16-8v34l-16-8Z"/><path class="st ac" d="M104 56v18"/>
          <g class="wd-reel"><circle class="st fs" cx="42" cy="28" r="14"/><circle class="st ac" cx="42" cy="28" r="3"/><circle class="st" cx="42" cy="20" r="2.6"/><circle class="st" cx="49.8" cy="32.5" r="2.6"/><circle class="st" cx="34.2" cy="32.5" r="2.6"/></g>
          <g class="wd-reel r2"><circle class="st fs" cx="70" cy="28" r="14"/><circle class="st ac" cx="70" cy="28" r="3"/><circle class="st" cx="70" cy="20" r="2.6"/><circle class="st" cx="77.8" cy="32.5" r="2.6"/><circle class="st" cx="62.2" cy="32.5" r="2.6"/></g>
          <circle class="wd-rec-h" cx="34" cy="56" r="4"/><circle class="wd-rec" cx="34" cy="56" r="3.2"/></svg>
        <svg viewBox="0 0 124 120" aria-hidden="true"><defs><linearGradient id="wdBeamG" x1="0" x2="1" y1="0" y2="0"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.3"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient></defs>
          <ellipse class="sh" cx="30" cy="115" rx="26" ry="3.5"/>
          <path class="st" d="M30 60v32M30 92L12 114M30 92l18 22M30 92v22"/>
          <g class="wd-lamp"><g class="wd-beam-i"><path d="M48 26L124 -8V84L48 50Z" fill="url(#wdBeamG)" stroke="none"/></g>
            <rect class="st fs" x="12" y="24" width="30" height="28" rx="7"/><path class="st" d="M19 31v14M25 31v14M31 31v14" style="opacity:.45"/><ellipse class="st ac fs" cx="44" cy="38" rx="4" ry="12"/></g>
          <path class="st" d="M20 58q10 9 20 0"/><circle class="st fs" cx="30" cy="38" r="3"/></svg>
      </div>
      <div class="wd-set-col wd-set-r"><div class="wd-strip"></div>
        <svg viewBox="0 0 124 120" aria-hidden="true">
          <ellipse class="sh" cx="24" cy="115" rx="22" ry="3.5"/><path class="st" d="M24 100v14M10 114h28M24 114l-12 0"/><circle class="st fs" cx="24" cy="100" r="4"/>
          <g class="wd-boom"><path class="st" d="M24 100L98 40"/><path class="st" d="M14 108l10-8" stroke-width="5"/>
            <g transform="rotate(-38 100 38)"><path class="st" d="M92 46q-6 8-14 6" style="opacity:.5"/>
              <path class="st" d="M80 29v-3M86 29v-4M92 29v-3M98 29v-4M104 29v-3M110 29v-4M116 29v-3M80 47v3M86 47v4M92 47v3M98 47v4M104 47v3M110 47v4M116 47v3" style="opacity:.55"/>
              <rect class="st ac fs" x="74" y="29" width="52" height="18" rx="9"/>
              <path class="st" d="M84 30v16M116 30v16" style="opacity:.4"/><path class="st" d="M96 29v-6h8v6M96 47v6h8v-6"/>
              <ellipse class="st fs" cx="126" cy="38" rx="3.2" ry="7"/></g></g></svg>
        <svg viewBox="0 0 124 120" aria-hidden="true">
          <ellipse class="sh" cx="54" cy="115" rx="40" ry="3.5"/>
          <path class="st" d="M24 66v46M84 66v46M26 80l56 32M82 80l-56 32"/>
          <rect class="st fs" x="14" y="68" width="80" height="7" rx="3.5"/><rect class="st fs" x="12" y="60" width="14" height="5" rx="2.5"/><rect class="st fs" x="82" y="60" width="14" height="5" rx="2.5"/>
          <rect class="st fs" x="16" y="38" width="76" height="20" rx="4"/><text x="54" y="52" font-size="6.6" text-anchor="middle" textLength="${L('56','42')}" lengthAdjust="spacingAndGlyphs">${L('RÉALISATEUR','DIRECTOR')}</text>
          <g class="wd-act"><rect class="fl2" x="52" y="0" width="68" height="25" rx="8"/><path class="fl2" d="M62 24l8 10 6-10Z"/><text x="86" y="17" font-size="11" text-anchor="middle" style="fill:#fff">${L('Action !','Action!')}</text></g></svg>
        <svg viewBox="0 0 124 120" aria-hidden="true">
          <ellipse class="sh" cx="56" cy="113" rx="38" ry="3.5"/>
          <path class="st wd-tail" d="M58 84C62 104 92 108 120 94" style="stroke-width:13; opacity:.22; stroke-dasharray:none"/><path class="wd-tail" d="M58 84C62 104 92 108 120 94" style="fill:none; stroke:var(--surface); stroke-width:13; stroke-dasharray:1.5 9; stroke-linecap:butt"/>
          <g class="wd-spool"><circle class="st fs" cx="56" cy="50" r="36"/><circle class="st" cx="56" cy="50" r="30" style="opacity:.3"/><circle class="st" cx="56" cy="26" r="9"/><circle class="st" cx="78.8" cy="42.6" r="9"/><circle class="st" cx="70.1" cy="69.4" r="9"/><circle class="st" cx="41.9" cy="69.4" r="9"/><circle class="st" cx="33.2" cy="42.6" r="9"/><circle class="st ac fs" cx="56" cy="50" r="6"/></g></svg>
      </div></div>
    <div class="wd-body">
      <aside class="wd-side">
        <button class="btn btn-primary wd-new" data-act="openCreateModal">${icon('plus')} ${L('Nouveau scénario','New screenplay')}</button>
        <div class="wd-navs">
        <button class="btn wd-nav" data-act="triggerImport">${icon('upload')}<span>${L('Importer','Import')}<small>.fdx, .fountain, .txt, .pdf</small></span></button>
        <button class="btn wd-nav" data-act="vaultOpenFromFile" title="${L('Rouvrir un scénario enregistré sur ton ordinateur, et rester relié à ce fichier','Reopen a screenplay saved on your computer, and stay linked to that file')}">${icon('save')}<span>${L('Ouvrir depuis mon ordinateur','Open from my computer')}<small>.smmproj</small></span></button>
        <button class="btn wd-nav wd-nav-sample" data-act="openSampleModal">${icon('book')}<span>${L('Scénario d\u2019exemple','Example screenplay')}<small>${L('17 pages annotées · FR / EN','17 annotated pages · FR / EN')}</small></span></button>
        <button class="btn wd-nav" data-act="openHelp">${icon('read')}<span>${L('Comment faire','How it works')}</span></button>
        <input type="file" id="importFile" accept=".txt,.fountain,.fdx,.pdf,.smmproj,.json" class="hidden">
        </div>
        ${homeTipHtml()}
        <div class="wd-about">
          <b>${mmWordmark()}</b>
          <p class="wd-tag">${L('L\u2019écriture de scénario, gratuite et sans compte.','Screenwriting, free and without an account.')}</p>
          <ul class="wd-points">
            <li>${icon('doc')}<span>${L('Pagination professionnelle','Industry-standard pagination')}</span></li>
            <li>${icon('swap')}<span>${L('Compatible Final Draft (.fdx), Fountain, texte et PDF','Final Draft (.fdx), Fountain, text and PDF')}</span></li>
            <li>${icon('save')}<span>${L('Tes données restent sur ton ordinateur','Your work stays on your computer')}</span></li>
          </ul>
          <div class="wd-ver" style="margin-top:16px;"><span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px 3px 8px;border-radius:999px;background:var(--tag-chip-bg);color:var(--ink-soft);font-size:11.5px;font-weight:600;letter-spacing:.02em;line-height:1.4;font-variant-numeric:tabular-nums;"><i style="width:5px;height:5px;border-radius:50%;background:var(--accent);opacity:.8;flex:none;"></i>v1.12</span></div>
          <a class="wd-ato" href="https://alternativeto.net/software/raging-page/about/?utm_source=badge&utm_medium=referral" target="_blank" rel="noopener" title="${L('Raging Page sur AlternativeTo','Raging Page on AlternativeTo')}" style="display:block;width:150px;margin-top:14px;opacity:.92;"><img src="https://alternativeto.net/static/badges/badge-compact-color.svg" alt="Raging Page | AlternativeTo" width="150" height="49" style="display:block;width:150px;height:auto;"></a>
        </div>
      </aside>
      <main class="wd-main">
        <div class="wd-main-h"><h1>${L('Mes scénarios','My screenplays')}</h1>${nb ? `<span class="wd-count">${nb}</span>` : ''}${homeResumeHtml()}</div>
        <div class="wd-table">${list}<div class="wd-slug" aria-hidden="true"><span class="wd-slug-n">1</span><span class="wd-slug-t"></span><span class="wd-slug-c"></span><span class="wd-slug-n wd-slug-r">1</span></div></div>
      </main>
    </div>
  </div>`;
}
/* Accueil — « Reprendre » : le dernier scénario modifié, en un clic, à côté du titre (sans rien décaler).
   Un simple lien, dans le ton de la page : pas de cadre, la couleur de l'accent. */
function homeResumeHtml(){
  const last = (S.projectsIndex || []).filter(p => p && p.id).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  if(!last) return '';
  const name = last.seriesId && last.episode ? (last.seriesName || last.title) + ' · ' + L('ép. ','ep. ') + last.episode : last.title;
  return `<button type="button" class="wd-resume" data-act="openProject" data-id="${esc(last.id)}" title="${L('Rouvrir le dernier scénario modifié','Reopen the last screenplay you edited')} (${esc(timeAgo(last.updatedAt || Date.now()))})">
    <span class="wd-resume-l">${L('Reprendre','Resume')}</span><span class="wd-resume-t">${esc(name || L('Sans titre','Untitled'))}</span>
    <svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"/></svg></button>`;
}
/* Accueil — une astuce par jour, dans la colonne de gauche, présentée comme les autres liens de la colonne.
   Un clic montre la suivante. */
const HOME_TIPS = [
  ['Glisse une photo sur une page : le texte ne bouge pas.', 'Drop a photo on a page: the text doesn’t move.'],
  ['Ctrl+K dans l’éditeur : toutes les scènes et commandes, à taper.', 'Ctrl+K in the editor: every scene and command, just type.'],
  ['« + Carton » : titre ou citation, stylé en un clic.', '“+ Card”: title, quote, divider. The templates style it.'],
  ['Menu ⋮ › Page sans numéro : idéal pour une dédicace.', 'Menu ⋮ › Unnumbered page: a dedication, off the count.'],
  ['Ctrl+Maj+D : deux répliques en même temps, côte à côte.', 'Ctrl+Shift+D: two characters talking at once, side by side.'],
  ['Ctrl+Alt+R : révisions colorées, astérisques en marge.', 'Ctrl+Alt+R: colour revisions, with asterisks in the margin.'],
  ['Exporter › Sides : un PDF avec les seules scènes d’un acteur.', 'Export › Sides: a PDF with only one actor’s scenes.'],
  ['Ctrl+H : remplace un nom dans tout le scénario d’un coup.', 'Ctrl+H: replace a name across the whole script at once.'],
  ['Ctrl+Maj+Y sur un mot : ses synonymes.', 'Ctrl+Shift+Y on a word: its synonyms.'],
  ['Ctrl+Maj+M : une note sur la ligne, jamais imprimée.', 'Ctrl+Shift+M: a note on the line, never printed.'],
  ['Exporter › Sauvegarde complète : tout en un fichier.', 'Export › Full backup: the whole project in one file.'],
  ['Menu ⋮ › Affichage : mode focus et machine à écrire.', 'Menu ⋮ › View: focus mode and typewriter mode.']
];
let homeTipK = null;
function homeTipIndex(){
  if(homeTipK === null){ const d = new Date(); homeTipK = (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % HOME_TIPS.length; }
  return ((homeTipK % HOME_TIPS.length) + HOME_TIPS.length) % HOME_TIPS.length;
}
function homeTipInner(){
  const k = homeTipIndex(), t = HOME_TIPS[k];
  return `<svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5.6 10.6C4.5 9.8 3.8 8.6 3.8 7.2a4.2 4.2 0 0 1 8.4 0c0 1.4-.7 2.6-1.8 3.4v1.4H5.6z"/><path d="M6.2 14h3.6"/></svg>
    <span>${L('Astuce','Tip')} <em>${k + 1}/${HOME_TIPS.length}</em><small>${esc(L(t[0], t[1]))}</small></span>
    <svg class="icon wd-tip-go" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>`;
}
function homeTipHtml(){ return `<button type="button" class="btn wd-nav wd-tip" id="wdTip" data-act="homeTipStep" data-id="1" title="${L('Astuce suivante','Next tip')}" aria-live="polite">${homeTipInner()}</button>`; }
function homeTipStep(d){
  homeTipIndex(); homeTipK += Number(d) || 1;
  const box = document.getElementById('wdTip'); if(box){ box.innerHTML = homeTipInner(); homeTipFit(); }
}
/* La note ne prend que de la place libre : si la colonne manque de hauteur, elle s'efface plutôt que de pousser le reste. */
function homeTipFit(){
  const box = document.getElementById('wdTip'); if(!box) return;
  const side = box.closest('.wd-side'), about = side && side.querySelector('.wd-about');
  box.classList.remove('is-off');
  if(!side || !about || getComputedStyle(side).display === 'contents') return;
  if(side.scrollHeight > side.clientHeight + 1) box.classList.add('is-off');
}
window.addEventListener('resize', () => { if(document.getElementById('wdTip')) homeTipFit(); });
function icon(name){
  const p = {
    plus:'<path d="M8 2v12M2 8h12"/>',
    upload:'<path d="M8 11V2M4 6l4-4 4 4M2 13h12"/>',
    save:'<path d="M2 2h9l3 3v9H2z"/><path d="M5 2v4h6V2M5 13v-4h6v4"/>',
    undo:'<path d="M4 4v4h4"/><path d="M4 8a6 6 0 1 1 2 4.5"/>',
    redo:'<path d="M12 4v4H8"/><path d="M12 8a6 6 0 1 0-2 4.5"/>',
    export:'<path d="M8 10V2M4 6l4-4 4 4"/><path d="M2 13h12"/>',
    search:'<circle cx="6.5" cy="6.5" r="4.5"/><path d="M13 13l-3.2-3.2"/>',
    doc:'<path d="M3 1h7l3 3v11H3z"/><path d="M9 1v4h4"/>',
    frames:'<rect x="1.5" y="1.8" width="13" height="8" rx="1.4"/><path d="M1.9 8.4l3.4-3 2.6 2.2 2-1.6 4.3 3.4"/><path d="M1.5 13.2h3.4M6.3 13.2h3.4M11.1 13.2h3.4"/>',
    grid:'<rect x="2" y="2" width="5" height="5"/><rect x="9" y="2" width="5" height="5"/><rect x="2" y="9" width="5" height="5"/><rect x="9" y="9" width="5" height="5"/>',
    layers:'<path d="M8 1.5l6.2 3.3L8 8.1 1.8 4.8z"/><path d="M1.8 8.2 8 11.5l6.2-3.3"/><path d="M1.8 11.5 8 14.8l6.2-3.3"/>',
    list:'<path d="M4 4h9M4 8h9M4 12h9"/><circle cx="1.3" cy="4" r=".9"/><circle cx="1.3" cy="8" r=".9"/><circle cx="1.3" cy="12" r=".9"/>',
    users:'<circle cx="5.5" cy="5" r="2.3"/><path d="M1 14c.5-3 2.3-4.5 4.5-4.5S9.5 11 10 14"/><circle cx="11.5" cy="5.5" r="1.9"/><path d="M9.5 9.7c2 .2 3.4 1.7 3.8 4.3"/>',
    tag:'<path d="M2 2h5l7 7-5 5-7-7z"/><circle cx="4.5" cy="4.5" r=".9"/>',
    note:'<path d="M3 2h10v12H3z"/><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3"/>',
    chart:'<path d="M2 14V2M2 14h12"/><rect x="4" y="8" width="2" height="4"/><rect x="7.5" y="5" width="2" height="7"/><rect x="11" y="3" width="2" height="9"/>',
    trash:'<path d="M3 4h10M6 4V2h4v2M4.5 4l.7 10h5.6l.7-10"/>',
    clock:'<circle cx="8" cy="8" r="6.3"/><path d="M8 4.5V8l2.6 1.6"/>',
    gear:'<circle cx="8" cy="8" r="2.6"/><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4"/>',
    read:'<path d="M8 3C6 2 3.5 2 2 2.8v10c1.5-.8 4-.8 6 .2M8 3c2-1 4.5-1 6 -.2v10c-1.5-.8-4-.8-6 .2V3z"/>',
    close:'<path d="M3 3l10 10M13 3L3 13"/>',
    drag:'<circle cx="5" cy="4" r="1"/><circle cx="5" cy="8" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="10" cy="4" r="1"/><circle cx="10" cy="8" r="1"/><circle cx="10" cy="12" r="1"/>',
    palette:'<path d="M8 1.6C4.2 1.6 1.3 4.5 1.3 8c0 3.4 2.7 6 6 6.4.7.1 1.1-.7.7-1.3-.3-.4-.2-1 .3-1.2.3-.1.6-.2 1-.2h1.6c2 0 3.4-1.6 3.4-3.5 0-3.8-2.8-6.6-6.3-6.6z"/><circle cx="4.9" cy="6.4" r=".8"/><circle cx="7.6" cy="4.6" r=".8"/><circle cx="10.5" cy="6" r=".8"/><circle cx="10.4" cy="9.2" r=".8"/>',
    pen:'<path d="M10.5 2.3l3.2 3.2-8 8-3.6.6.6-3.6z"/><path d="M9 3.8l3.2 3.2"/>',
    image:'<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><circle cx="5.2" cy="6" r="1.2"/><path d="M2 12.5l3.8-4 2.6 2.6 2-2L14.5 12"/>',
    sun:'<circle cx="8" cy="8" r="3"/><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4"/>',
    moon:'<path d="M13.2 9.3A5.6 5.6 0 0 1 6.7 2.8a5.6 5.6 0 1 0 6.5 6.5z"/>',
    center:'<circle cx="8" cy="8" r="5.3"/><circle cx="8" cy="8" r="1.1"/><path d="M8 1v2.4M8 12.6V15M1 8h2.4M12.6 8H15"/>',
    swap:'<path d="M2 5h9M8.5 2.2 11.5 5 8.5 7.8"/><path d="M14 11H5M7.5 8.2 4.5 11l3 2.8"/>',
    dual:'<rect x="1.6" y="3" width="5.4" height="10"/><rect x="9" y="3" width="5.4" height="10"/>',
    focus:'<path d="M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3"/><circle cx="8" cy="8" r="2.6"/>',
    speaker:'<path d="M2 6v4h2.6L9 13V3L4.6 6H2z"/><path d="M11.2 5.2a4 4 0 0 1 0 5.6M13 3.4a7 7 0 0 1 0 9.2"/>',
    mic:'<rect x="5.8" y="1.6" width="4.4" height="7.6" rx="2.2"/><path d="M3.2 7.4a4.8 4.8 0 0 0 9.6 0M8 12.2V14.4M5.6 14.4h4.8"/>',
    findrep:'<circle cx="6.8" cy="6.8" r="4.6"/><path d="M14.5 14.5l-4.4-4.4M4.6 6.8h4.4M7.6 5.2l1.5 1.6-1.5 1.6"/>',
    book:'<path d="M3 2.5h8.5A1.5 1.5 0 0 1 13 4v9.5H4.5A1.5 1.5 0 0 1 3 12z"/><path d="M3 12a1.5 1.5 0 0 1 1.5-1.5H13M6 5.5h4"/>',
    flag:'<path d="M3.5 14.5V2M3.5 2.8h8.2l-1.7 2.8 1.7 2.8H3.5"/>',
    typeT:'<path d="M2.5 4V2.5h11V4M8 2.5v11M5.8 13.5h4.4"/>',
    newdoc:'<path d="M3 1.5h6.5L13 5v9.5H3z"/><path d="M9.5 1.5V5H13M8 8v4M6 10h4"/>',
    keyboard:'<rect x="1.5" y="4" width="13" height="8.5" rx="1.5"/><path d="M4.2 6.9h.01M6.7 6.9h.01M9.3 6.9h.01M11.8 6.9h.01M5 10h6"/>',
    font:'<path d="M1.8 13.5 5.5 3l3.7 10.5M3.1 10h4.8"/><path d="M10.6 13.5l2-6 2 6M11.3 11.7h2.6"/>',
    home:'<path d="M2 7.5 8 2.5l6 5"/><path d="M3.5 6.8V14h9V6.8M6.5 14V9.5h3V14"/>',
    scene:'<rect x="2" y="7" width="12" height="7" rx=".8"/><path d="M2 7 1.6 4.4 13.9 2.4 14 7"/><path d="M5.4 3.9 6.6 7M9 3.3 10.2 7"/>',
    card:'<rect x="1.8" y="3" width="12.4" height="10" rx="1"/><path d="M5 7.2h6M6.5 9.8h3"/>',
    align:'<path d="M2 3.5h12M2 8h8M2 12.5h10"/>',
    printer:'<path d="M4.5 6V2h7v4"/><rect x="2" y="6" width="12" height="5.5" rx="1"/><path d="M4.5 9.5h7V14h-7z"/>',
    filetext:'<path d="M3 1h7l3 3v11H3z"/><path d="M9 1v4h4M5.5 8.5h5M5.5 11h5"/>',
    drop:'<path d="M8 1.8C8 1.8 3.5 6.6 3.5 9.6a4.5 4.5 0 0 0 9 0C12.5 6.6 8 1.8 8 1.8z"/><path d="M6 10.2a2.2 2.2 0 0 0 2 1.8"/>',
    film:'<rect x="2" y="2.5" width="12" height="11" rx="1"/><path d="M5 2.5v11M11 2.5v11M2 6h3M2 10h3M11 6h3M11 10h3"/>',
    user:'<circle cx="8" cy="5" r="2.8"/><path d="M2.5 14c.6-3.2 2.7-4.8 5.5-4.8s4.9 1.6 5.5 4.8"/>',
    files:'<path d="M5 1.5h6l2.5 2.5v8H5z"/><path d="M5 4.5H2.5v10H10v-1.5"/>',
    pdf:'<path d="M3 1h7l3 3v11H3z"/><path d="M9 1v4h4M8 7.5v4M6 9.8l2 2 2-2"/>',
    cursor:'<path d="M5.5 2.5h5M5.5 13.5h5M8 2.5v11"/>',
    copy:'<rect x="5.5" y="5.5" width="8" height="8.5" rx="1"/><path d="M10.5 5.5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7.5a1 1 0 0 0 1 1h2.5"/>',
    emptypage:'<path d="M3 1h7l3 3v11H3z" stroke-dasharray="2 1.6"/><path d="M9 1v4h4"/>',
    pulse:'<path d="M1.5 8.5h3l1.8-5 3.2 9 1.8-4h3.2"/>',
    bubbles:'<path d="M2 3h7v5H5.5L3.5 10V8H2z"/><path d="M7 8.5V11h2.5l2 2v-2H14V6h-3"/>',
    more:'<circle cx="8" cy="3" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="8" cy="13" r="1.4"/>',
    railhide:'<rect x="1.8" y="2.5" width="12.4" height="11" rx="1.2"/><path d="M5.8 2.5v11M11 6.1 9.1 8l1.9 1.9"/>',
    railshow:'<rect x="1.8" y="2.5" width="12.4" height="11" rx="1.2"/><path d="M5.8 2.5v11M9.2 6.1 11.1 8l-1.9 1.9"/>',
    nonum:'<path d="M3 1.5h6.5L13 5v9.5H3z"/><path d="M9.5 1.5V5H13M6.6 7.4l-.6 4.6M9 7.4l-.6 4.6M5.3 9h4.6M5 10.6h4.6"/><path d="M4.4 13.2l7.2-6.4"/>',
    asterisk:'<path d="M8 2.5v11M3.2 5.2l9.6 5.6M12.8 5.2l-9.6 5.6"/>',
    sidebar:'<rect x="1.8" y="2.5" width="12.4" height="11" rx="1.2"/><path d="M9.8 2.5v11M11.4 5.6h1.3M11.4 8h1.3M11.4 10.4h1.3"/>',
    cloud:'<path d="M4.6 12.5h6.9a2.9 2.9 0 0 0 .3-5.8 4 4 0 0 0-7.6.9 2.5 2.5 0 0 0 .4 4.9z"/>',
    hash:'<path d="M6.3 2.5 5.1 13.5M10.9 2.5 9.7 13.5M2.8 6h10.6M2.6 10h10.6"/>',
    tplText:'<rect x="3" y="1.5" width="10" height="13" rx=".6"/><path d="M5.5 4.5h5M5.5 6.5h5M5.5 8.5h3"/>',
    tplCenter:'<rect x="3" y="1.5" width="10" height="13" rx=".6"/><path d="M6.2 7.2h3.6M5.4 9h5.2"/>',
    tplTitle:'<rect x="3" y="1.5" width="10" height="13" rx=".6"/><path d="M5.4 8h5.2" stroke-width="2.2"/>',
  }[name] || '';
  return `<svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}

/* v95 : petit bandeau décoratif en bas de « Mes scénarios » — une entête de scène s'y tape à la machine,
   s'efface, puis la suivante (numéro de scène des deux côtés, comme sur un scénario de tournage).
   Aucune place en plus : il occupe le bas de la carte. Fixe si le système demande moins d'animations. */
let __reelT = 0;
function homeReel(){
  clearTimeout(__reelT);
  const box = document.querySelector('#homeView .wd-slug'); if(!box) return;
  const lines = getLang() === 'en'
    ? ['EXT. TRAIN PLATFORM - DAWN', 'INT. ALL-NIGHT DINER - NIGHT', 'EXT. ROOFTOP - DUSK', 'INT. EDITING ROOM - LATER', 'EXT. COUNTRY ROAD - DAY', 'INT. NEIGHBORHOOD CINEMA - NIGHT', 'EXT. EMPTY BEACH - DAWN', 'INT. YOUR NEXT FILM - CONTINUOUS']
    : ['EXT. QUAI DE GARE - AUBE', 'INT. CAFÉ DES ARTISTES - NUIT', 'EXT. TOIT D\u2019IMMEUBLE - CRÉPUSCULE', 'INT. SALLE DE MONTAGE - PLUS TARD', 'EXT. ROUTE DE CAMPAGNE - JOUR', 'INT. CINÉMA DE QUARTIER - NUIT', 'EXT. PLAGE DÉSERTE - AUBE', 'INT. TON PROCHAIN FILM - CONTINU'];
  const t = box.querySelector('.wd-slug-t'), ns = box.querySelectorAll('.wd-slug-n');
  let k = 0, i = 0, del = false;
  const setN = () => ns.forEach(n => { n.textContent = String(k + 1); });
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){ t.textContent = lines[0]; setN(); return; }
  const step = () => {
    if(!box.isConnected) return;
    if(document.hidden){ __reelT = setTimeout(step, 800); return; }
    const L0 = lines[k];
    if(!del){
      i++; t.textContent = L0.slice(0, i);
      if(i >= L0.length){ del = true; __reelT = setTimeout(step, 2600); return; }
      __reelT = setTimeout(step, 55 + Math.random() * 70);
    } else {
      i--; t.textContent = L0.slice(0, i);
      if(i <= 0){ del = false; k = (k + 1) % lines.length; setN(); __reelT = setTimeout(step, 500); return; }
      __reelT = setTimeout(step, 22);
    }
  };
  setN(); __reelT = setTimeout(step, 700);
}
function attachHomeEvents(){
  const f = document.getElementById('importFile');
  if(f) f.addEventListener('change', onImportFile);
  homeReel();
  homeTipFit();
  try{ if(document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(homeTipFit); }catch(e){}
}

/* create modal */
function openCreateModal(keepFmt){
  if(!keepFmt){ flushAutosave(); S.createFmt = 'fr'; keepSeriesNameVal=''; keepSeasonVal=1; keepEpisodeVal=1; keepSeasonNameVal=''; keepEpisodeNameVal=''; keepAuthorVal = getDefaultAuthor(); }
  const keepTitle = keepFmt ? keepTitleVal : '';
  const keepKind = keepFmt ? keepKindVal : PROJECT_KINDS[0];
  const isSeries = keepKind === 'Série';
  const kindOpts = PROJECT_KINDS.map(k=>`<option value="${k}" ${k===keepKind?'selected':''}>${kindOptionLabel(k)}</option>`).join('');
  const html = `
  <div class="modal-backdrop" id="createBackdrop" data-act="closeModalBg">
    <div class="modal" data-stop="1">
      <h2>${L('Créer un scénario','Create a screenplay')}</h2>
      <div class="field" id="newTitleField" style="display:${isSeries?'none':'block'};"><label>${L('Titre','Title')}</label><input type="text" id="newTitle" placeholder="${L('Le titre de ton scénario','The title of your screenplay')}" value="${esc(keepTitle)}"></div>
      <div class="field"><label>${L('Auteur','Author')}</label><input type="text" id="newAuthor" placeholder="${L('Ton nom (facultatif)','Your name (optional)')}" value="${esc(keepAuthorVal)}"></div>
      <div class="field"><label>${L('Format','Format')}</label>
        <div class="fmt-choice">
          <div class="fmt-opt ${S.createFmt==='fr'?'active':''}" data-act="pickFmt" data-fmt="fr">
            <div class="t">${L('Français','French')}</div><div class="d">${L('Marges et conventions du scénario français','French screenplay margins and conventions')}</div>
          </div>
          <div class="fmt-opt ${S.createFmt==='us'?'active':''}" data-act="pickFmt" data-fmt="us">
            <div class="t">${L('Américain','American')}</div><div class="d">${L('Mise en page façon Hollywood','Hollywood-style page layout')}</div>
          </div>
        </div>
      </div>
      <div class="field"><label>${L('Type de projet','Project type')}</label><select id="newKind">${kindOpts}</select></div>
      <div id="newSeriesFields" style="display:${isSeries?'block':'none'};">
        <p style="font-size:11.96px;color:var(--ink-soft);margin:-4px 0 14px;">${L('Une série regroupe tous ses épisodes sous un même nom : pas besoin de « titre » séparé, le nom de la série sert de titre à ce premier épisode.','A series groups all its episodes under one name: no need for a separate \u201ctitle\u201d, the series name serves as the title for this first episode.')}</p>
        <div class="field"><label>${L('Nom de la série','Series name')}</label><input type="text" id="newSeriesName" placeholder="${L('Le nom de la série','The series name')}" value="${esc(keepSeriesNameVal)}"></div>
        <div style="display:flex;gap:10px;">
          <div class="field" style="flex:1"><label>${L('Saison','Season')}</label><input type="number" min="1" id="newSeason" value="${keepSeasonVal||1}"></div>
          <div class="field" style="flex:1"><label>${L('Épisode','Episode')}</label><input type="number" min="1" id="newEpisode" value="${keepEpisodeVal||1}"></div>
        </div>
        <div class="field"><label>${L('Nom de la saison (facultatif)','Season name (optional)')}</label><input type="text" id="newSeasonName" placeholder="${L('Ex. Origines','E.g. Origins')}" value="${esc(keepSeasonNameVal)}"></div>
        <div class="field"><label>${L('Nom de l\u2019épisode (facultatif)','Episode name (optional)')}</label><input type="text" id="newEpisodeName" placeholder="${L('Ex. Pilote','E.g. Pilot')}" value="${esc(keepEpisodeNameVal)}"></div>
        <p style="font-size:11.96px;color:var(--ink-soft);margin-top:-6px;">${L('Ceci crée le premier épisode de la série. Tu pourras ajouter d\u2019autres épisodes et saisons ensuite, depuis la série sur l\u2019accueil, et les exporter ensemble ou séparément.','This creates the series\u2019 first episode. You can add more episodes and seasons later from the series on the home screen, and export them together or separately.')}</p>
      </div>
      <div class="modal-actions">
        <button class="btn" data-act="closeModal">${L('Annuler','Cancel')}</button>
        <button class="btn btn-primary" data-act="confirmCreate">${L('Créer et commencer à écrire','Create and start writing')}</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('newTitle').focus();
  const sel = document.getElementById('newKind');
  if(sel) sel.addEventListener('change', onCreateKindChange);
}
function onCreateKindChange(e){
  const isSeries = e.target.value==='Série';
  const f = document.getElementById('newSeriesFields');
  const t = document.getElementById('newTitleField');
  if(f) f.style.display = isSeries ? 'block' : 'none';
  if(t) t.style.display = isSeries ? 'none' : 'block';
}
function closeModal(){ const b = document.getElementById('createBackdrop'); if(b) b.remove(); }
let keepTitleVal='';
let keepAuthorVal='';
let keepKindVal='';
let keepSeriesNameVal='';
let keepSeasonVal=1;
let keepEpisodeVal=1;
let keepSeasonNameVal='';
let keepEpisodeNameVal='';
function pickFmt(id, e){
  keepTitleVal = document.getElementById('newTitle').value;
  const au = document.getElementById('newAuthor'); if(au) keepAuthorVal = au.value;
  keepKindVal = document.getElementById('newKind').value;
  const sn = document.getElementById('newSeriesName'); if(sn) keepSeriesNameVal = sn.value;
  const ss = document.getElementById('newSeason'); if(ss) keepSeasonVal = parseInt(ss.value,10) || 1;
  const se = document.getElementById('newEpisode'); if(se) keepEpisodeVal = parseInt(se.value,10) || 1;
  const sna = document.getElementById('newSeasonName'); if(sna) keepSeasonNameVal = sna.value;
  const ena = document.getElementById('newEpisodeName'); if(ena) keepEpisodeNameVal = ena.value;
  S.createFmt = e.target.closest('[data-fmt]').dataset.fmt;
  closeModal();
  openCreateModal(true);
}
async function confirmCreate(){
  const kind = document.getElementById('newKind').value;
  let seriesMeta = null;
  let title;
  if(kind === 'Série'){
    const nameEl = document.getElementById('newSeriesName');
    const seasonEl = document.getElementById('newSeason');
    const episodeEl = document.getElementById('newEpisode');
    const seasonNameEl = document.getElementById('newSeasonName');
    const episodeNameEl = document.getElementById('newEpisodeName');
    const seriesName = (nameEl && nameEl.value.trim()) || L('Sans titre','Untitled');
    const episodeName = episodeNameEl ? episodeNameEl.value.trim() : '';
    title = episodeName || seriesName;
    seriesMeta = {
      seriesId: uid('series'),
      seriesName,
      season: Math.max(1, parseInt(seasonEl && seasonEl.value, 10) || 1),
      episode: Math.max(1, parseInt(episodeEl && episodeEl.value, 10) || 1),
      seasonName: seasonNameEl ? seasonNameEl.value.trim() : ''
    };
  }else{
    title = document.getElementById('newTitle').value.trim() || L('Sans titre','Untitled');
  }
  const authorEl = document.getElementById('newAuthor');
  const author = authorEl ? authorEl.value.trim() : '';
  const p = newProject(title, S.createFmt, kind, seriesMeta);
  if(author){ p.author = author; setDefaultAuthor(author); }
  S.project = p;
  S.projectsIndex.push(indexEntryFor(p));
  await saveIndex(); await storSet(proj_key(p.id), p);
  closeModal();
  S.view='editor'; S.tab='editor'; S.undoStack=[]; S.redoStack=[];
  render();
}
async function openProject(id){
  const p = await storGet(proj_key(id));
  if(!p){ toast(L('Impossible de charger ce scénario.','Couldn\u2019t load this screenplay.')); return; }
  if(!p.tagDefs) p.tagDefs={};
  if(p.seasonName===undefined) p.seasonName='';
  ensureTPDesign(p); ensureSettings(p); ensureStructure(p);
  S.project = p; S.view='editor'; S.tab='editor'; S.undoStack=[]; S.redoStack=[];
  render();
}
async function deleteProject(id, e){
  if(e && e.stopPropagation) e.stopPropagation();
  const _en = S.projectsIndex.find(p=>p.id===id);
  if(!await mmConfirm(L('Ce scénario sera supprimé définitivement. Cette action est irréversible.','This screenplay will be permanently deleted. This can\u2019t be undone.') + (_en && _en.title ? '\n\u201C' + _en.title + '\u201D' : ''),
    {title:L('Supprimer ce scénario ?','Delete this screenplay?'), ok:L('Supprimer','Delete'), danger:true})) return;
  S.projectsIndex = S.projectsIndex.filter(p=>p.id!==id);
  await saveIndex(); await storDelete(proj_key(id));
  render();
}
async function renameProject(id, e){
  if(e && e.stopPropagation) e.stopPropagation();
  const entry = S.projectsIndex.find(p=>p.id===id);
  const val = await mmPrompt(L('Nouveau titre','New title'), entry?entry.title:'', {title:L('Renommer le scénario','Rename screenplay'), ok:L('Renommer','Rename')});
  if(!val) return;
  if(entry){ entry.title = val.trim(); await saveIndex(); }
  const full = await storGet(proj_key(id));
  if(full){ full.title = val.trim(); await storSet(proj_key(id), full); }
  render();
}
function triggerImport(){ document.getElementById('importFile').click(); }

/* =====================================================================
   AIDE — récapitulatif court, accessible depuis l'accueil
   ---------------------------------------------------------------------
   Avant : un seul panneau à faire défiler du haut en bas, dans l'ordre où
   les fonctionnalités ont été codées plutôt que dans l'ordre où on se
   pose ces questions. Maintenant : quatre onglets par situation, chacun
   court et scannable (étapes numérotées pour « comment démarrer »,
   listes à puces pour ce qui est descriptif, encart à part pour ce qui a
   le plus de conséquences si on l\u2019ignore : la sauvegarde complète).
===================================================================== */
let S_helpTab = 'start';
const HELP_TABS = [
  { id:'start',  label:['Démarrer','Getting started'], icon:'plus'  },
  { id:'editor', label:['Écrire','Writing'],           icon:'pen'   },
  { id:'save',   label:['Sauvegarde','Backup'],        icon:'save'  },
  { id:'export', label:['Export','Export'],            icon:'read'  },
  { id:'series', label:['Séries','Series'],            icon:'users' },
];
function helpTabsHtml(){
  return HELP_TABS.map(t=>`<button class="help-tab ${t.id===S_helpTab?'active':''}" data-act="helpSetTab" data-id="${t.id}">${icon(t.icon)}${L(t.label[0],t.label[1])}</button>`).join('');
}
function helpTabContent(tab){
  const C = (title, inner) => `<div class="help-card"><div class="help-card-t">${title}</div>${inner}</div>`;
  const P = arr => `<ul class="help-points">${arr.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  const T = (fr, en) => `<p class="help-p">${L(fr, en)}</p>`;
  if(tab==='series') return `
    ${C(L('Qu\u2019est-ce qu\u2019une série ?','What is a series?'),
      T('Choisir « Série » (au lieu d\u2019un « Type de projet » classique) à la création crée le premier épisode d\u2019un ensemble, et change la façon dont le projet fonctionne.','Choosing \u201cSeries\u201d (instead of a regular \u201cProject type\u201d) at creation makes the first episode of a set, and changes how the project works.'))}
    ${C(L('Sur l\u2019accueil','On the home screen'),
      T('Tous les épisodes d\u2019une série tiennent dans une seule carte, au lieu d\u2019une carte par épisode. Cliquer dessus ouvre le hub de la série : ajouter des épisodes, des saisons, renommer la série.','All the episodes of a series fit in a single card, instead of one card per episode. Clicking it opens the series hub: add episodes, seasons, rename the series.'))}
    ${C(L('Exporter','Export'),
      T('Depuis le hub, l\u2019export multi-épisodes propose un épisode, plusieurs, une saison entière, ou tout, en PDF fusionné, en PDF séparés, ou en texte.','From the hub, multi-episode export lets you pick one episode, several, a whole season, or everything, as a merged PDF, separate PDFs, or text.'))}
    ${C(L('À l\u2019intérieur','Inside'),
      T('Chaque épisode reste un scénario normal : même éditeur, même export individuel qu\u2019un scénario seul.','Each episode stays a normal screenplay: same editor, same individual export as a standalone screenplay.'))}`;
  if(tab==='export') return `
    ${C(L('Exporter','Export'),
      P([L('Dans l\u2019éditeur, « Exporter » propose PDF (impression), texte, Fountain et Final Draft (<b>.fdx</b>)','In the editor, \u201cExport\u201d offers PDF (print), text, Fountain and Final Draft (<b>.fdx</b>)'),
         L('Le .fdx est le format que lisent Final Draft, WriterDuet, Fade In et la plupart des productions','.fdx is the format read by Final Draft, WriterDuet, Fade In and most productions'),
         L('Un .fdx peut aussi être réimporté ici depuis l\u2019accueil : c\u2019est l\u2019import le plus fidèle, puisque le fichier indique lui-même le type de chaque ligne','A .fdx file can also be re-imported here from the home screen: it\u2019s the most faithful import, since the file itself states the type of every line')]))}
    ${C(L('Révisions colorées','Colour revisions'),
      T('<b>Menu ⋯ ou Ctrl/Cmd+Alt+R.</b> Les lignes modifiées après le lancement d\u2019une révision portent un astérisque, les pages touchées prennent la teinte de leur révision (PDF et impression) et les exports .txt, .fountain et .fdx signalent les mêmes lignes.','<b>\u22ef menu or Ctrl/Cmd+Alt+R.</b> Lines changed after a revision is started get an asterisk, touched pages take the tint of their revision (PDF and print), and the .txt, .fountain and .fdx exports flag the same lines.'))}
    ${C(L('Pages verrouillées','Locked pages'),
      P([L('Dans la fenêtre Révisions, chaque page garde son numéro : une page ajoutée devient 12A, 12B…, une page disparue est listée comme omise','In the Revisions window, each page keeps its number: an added page becomes 12A, 12B…, a vanished page is listed as omitted'),
         L('Une ligne supprimée laisse un astérisque sur la ligne qui la précédait','A deleted line leaves an asterisk on the line before it'),
         L('Ctrl/Cmd+Alt+M marque ou démarque à la main la ligne en cours','Ctrl/Cmd+Alt+M marks or unmarks the current line by hand'),
         L('« Voir », dans la fenêtre Révisions, montre ce qu\u2019une révision a changé','\u201cView\u201d, in the Revisions window, shows what a revision changed')]))}`;
  if(tab==='save') return `
    ${C(L('Pendant que tu écris','While you write'),
      T('Tout s\u2019enregistre automatiquement dans ce navigateur, sans compte à créer.','Everything saves automatically in this browser, with no account to create.'))}
    ${C(L('Google Drive','Google Drive'),
      P([L('Une copie de ton scénario dans <b>ton</b> Drive, mise à jour toute seule','A copy of your screenplay in <b>your</b> Drive, updated automatically'),
         L('Raging Page ne voit que ses propres fichiers, jamais le reste de ton Drive','Raging Page only sees its own files, never the rest of your Drive'),
         L('Menu ⋯ › « Connecter Google Drive », ou Paramètres › Sauvegarde','\u22ef menu \u203a \u201cConnect Google Drive\u201d, or Settings \u203a Backup')]))}
    ${C(L('Coffre-fort','Vault'),
      P([L('Relie ton scénario à un fichier <b>.smmproj</b> de ton ordinateur : il est réécrit tout seul après chaque modification','Link your screenplay to a <b>.smmproj</b> file on your computer: it is rewritten automatically after every change'),
         L('Fonctionne sur Chrome, Edge et Opera, sur ordinateur','Works on Chrome, Edge and Opera, on desktop'),
         L('Paramètres › Sauvegarde, ou la pastille « Coffre » en haut de l\u2019éditeur','Settings \u203a Backup, or the \u201cVault\u201d chip at the top of the editor')]))}
    ${C(L('Sauvegarde complète','Full backup'),
      T('Le fichier <b>.smmproj</b> contient le projet entier : notes, outlines, tags, versions, cimetière, page de titre. Il se rouvre par « Importer ».','The <b>.smmproj</b> file contains the entire project: notes, outlines, tags, versions, graveyard, title page. It reopens through \u201cImport\u201d.') +
      T('Une restauration crée toujours un nouveau scénario à côté : elle n\u2019écrase jamais celui sur lequel tu travailles.','A restore always creates a new screenplay alongside: it never overwrites the one you\u2019re working on.') +
      `<div class="help-callout">${L('À faire de temps en temps si tu n\u2019as relié ni Google Drive ni le Coffre-fort : comme tout vit dans ce navigateur, vider ses données ou changer d\u2019ordinateur fait tout disparaître. Le réglage « Sauvegarde » de Paramètres peut aussi télécharger ce fichier pour toi.','Worth doing now and then if you haven\u2019t linked Google Drive or the Vault: since everything lives in this browser, clearing its data or switching computers makes everything disappear. The \u201cBackup\u201d setting in Settings can also download this file for you.')}</div>`)}`;
  if(tab==='editor') return `
    ${C(L('Les raccourcis essentiels','Essential shortcuts'),
      `<div class="help-keys">${[
        [['Tab'], L('Passer en ligne Personnage','Switch to a Character line')],
        [[L('Maj','Shift'), 'Tab'], L('Revenir en Action','Back to Action')],
        [[L('Entrée','Enter')], L('Passer à l\u2019élément suivant (scène → action, personnage → dialogue…)','Move to the next element (scene → action, character → dialogue…)')],
        [['Ctrl/Cmd', 'K'], L('Tout trouver : scènes, personnages, actions, réglages','Find anything: scenes, characters, actions, settings')],
        [['Ctrl/Cmd', 'Z'], L('Annuler — couvre aussi le rechercher / remplacer','Undo — also covers find / replace')]
      ].map(r => `<div class="help-key"><span class="help-key-k">${r[0].map(k => `<span class="kbd">${k}</span>`).join('<span class="sc-plus">+</span>')}</span><span class="help-key-d">${r[1]}</span></div>`).join('')}</div>`)}
    ${C(L('Tout voir','See everything'),
      T('Raccourcis clavier et mise en forme du texte : bouton « Raccourcis », en haut de l\u2019éditeur (ou dans le menu ⋯ sur petit écran).','Keyboard shortcuts and text formatting: \u201cShortcuts\u201d button, at the top of the editor (or in the \u22ef menu on small screens).') +
      T('La liste complète (navigation, recherche, mode focus, lecture à voix haute, annotations…) est dans « Raccourcis ».','The full list (navigation, search, focus mode, read-aloud, annotations…) is in \u201cShortcuts\u201d.'))}`;
  // 'start' par défaut
  return `
    ${C(L('En 3 étapes','In 3 steps'), `<ol class="help-step-list">
        <li class="help-step"><span class="help-step-num">1</span><span class="help-step-body">${L('Clique « Nouveau scénario » sur l\u2019accueil : l\u2019éditeur s\u2019ouvre directement, pas de formulaire à remplir avant d\u2019écrire.','Click \u201cNew screenplay\u201d on the home screen: the editor opens right away, no form to fill in before you start writing.')}</span></li>
        <li class="help-step"><span class="help-step-num">2</span><span class="help-step-body">${L('Choisis le format : Français (marges et conventions françaises) ou Américain (mise en page façon Hollywood).','Choose the format: French (French margins and conventions) or American (Hollywood-style layout).')}</span></li>
        <li class="help-step"><span class="help-step-num">3</span><span class="help-step-body">${L('Choisis un « Type de projet » : une simple étiquette affichée sur la page de titre à l\u2019export, sauf « Série », qui change la façon dont le projet fonctionne (voir l\u2019onglet <b>Séries</b>).','Choose a \u201cProject type\u201d: a simple label shown on the title page on export, except \u201cSeries\u201d, which changes how the project works (see the <b>Series</b> tab).')}</span></li>
      </ol>`)}
    ${C(L('Bon à savoir','Good to know'),
      P([L('Tout s\u2019enregistre automatiquement dans ce navigateur, sans compte à créer','Everything saves automatically in this browser, with no account to create'),
         L('Tu peux aussi garder une copie sur Google Drive ou dans un fichier de ton ordinateur (onglet <b>Sauvegarde</b>)','You can also keep a copy on Google Drive or in a file on your computer (<b>Backup</b> tab)'),
         L('Tu peux importer un scénario existant (.fdx, .fountain, .txt) ou une sauvegarde .smmproj depuis l\u2019accueil','You can import an existing screenplay (.fdx, .fountain, .txt) or a .smmproj backup from the home screen')]))}`;
}
function openHelp(){
  S_helpTab = 'start';
  const html = `<div class="modal-backdrop" id="helpBackdrop" data-act="closeHelp">
    <div class="modal help-modal" data-stop="1">
      <h2>${L('Comment faire','How it works')}</h2>
      <p class="help-lead">${L('Les réponses courtes aux premières questions qu’on se pose.','Short answers to the first questions you’ll have.')}</p>
      <div class="help-tabs" id="helpTabs">${helpTabsHtml()}</div>
      <div class="help-body" id="helpBody">${helpTabContent(S_helpTab)}</div>
      <div class="modal-actions"><button class="btn btn-primary" data-act="closeHelp">${L('Fermer','Close')}</button></div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}
function helpSetTab(id){
  if(!id || id===S_helpTab) return;
  S_helpTab = id;
  const tabsEl = document.getElementById('helpTabs');
  const bodyEl = document.getElementById('helpBody');
  if(tabsEl) tabsEl.innerHTML = helpTabsHtml();
  if(bodyEl){ bodyEl.innerHTML = helpTabContent(S_helpTab); bodyEl.scrollTop = 0; }
}
function closeHelp(){ const b=document.getElementById('helpBackdrop'); if(b) b.remove(); }

/* =====================================================================
   HUB DE SÉRIE
   ---------------------------------------------------------------------
   Une « série » n'est pas un objet séparé : c'est simplement le
   regroupement, par seriesId, des projets-épisodes déjà présents dans
   l'index. Ce hub liste les saisons et épisodes d'une série, permet d'en
   ajouter, et ouvre le menu d'export multi-épisodes.
===================================================================== */
function openSeriesHub(seriesId){
  flushAutosave();
  S.seriesId = seriesId; S.view = 'series';
  render();
}
async function findSeriesAuthor(seriesId){
  const entries = seriesEntries(seriesId);
  for(const e of entries){
    const proj = await storGet(proj_key(e.id));
    if(proj && proj.author) return proj.author;
  }
  return '';
}
function seriesEntries(seriesId){
  return S.projectsIndex.filter(p=>p.seriesId===seriesId)
    .sort((a,b)=> (a.season||1)-(b.season||1) || (a.episode||1)-(b.episode||1));
}
function renderSeriesHub(){
  const entries = seriesEntries(S.seriesId);
  if(!entries.length){ S.view='home'; return renderHome(); }
  const name = entries.find(e=>e.seriesName)?.seriesName || entries[0].title;
  const bySeason = {};
  entries.forEach(e=>{ const s=e.season||1; (bySeason[s]=bySeason[s]||[]).push(e); });
  const seasonNums = Object.keys(bySeason).map(Number).sort((a,b)=>a-b);
  const seasonsHtml = seasonNums.map(sn=>{
    const eps = bySeason[sn];
    const rows = eps.map(e=>`
      <div class="proj-row" data-act="openProject" data-id="${e.id}">
        <div>
          <div class="proj-name">${L('Épisode','Episode')} ${e.episode||1}${e.title && e.title!==name ? ' : '+esc(e.title) : ''}</div>
          <div class="proj-meta"><span class="proj-badge">${formatLabel(e.format)}</span>${L('Modifié','Updated')} ${timeAgo(e.updatedAt)}</div>
        </div>
        <div class="proj-row-actions">
          <button class="btn btn-sm btn-ghost" data-act="renameProject" data-id="${e.id}" data-stop="1">${L('Renommer','Rename')}</button>
          <button class="btn btn-sm btn-danger btn-ghost" data-act="deleteProject" data-id="${e.id}" data-stop="1">${L('Supprimer','Delete')}</button>
        </div>
      </div>`).join('');
    return `<div class="panel-block">
      <h4 style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <span>${L('Saison','Season')} ${sn}${eps[0] && eps[0].seasonName ? ' — ' + esc(eps[0].seasonName) : ''}</span>
        <span style="display:flex;gap:6px;">
          <button class="btn btn-sm btn-ghost" data-act="renameSeason" data-id="${S.seriesId}" data-season="${sn}">${L('Renommer','Rename')}</button>
          <button class="btn btn-sm" data-act="openAddEpisodeModal" data-id="${S.seriesId}" data-season="${sn}">${icon('plus')} ${L('Épisode','Episode')}</button>
        </span>
      </h4>
      <div class="proj-list">${rows}</div>
    </div>`;
  }).join('');
  return `<div id="seriesHubView">
    <div class="home-wrap">
      <div class="home-brand" style="justify-content:space-between; width:100%;">
        <span style="display:flex; align-items:center; gap:10px;">${mmLogo(40,'wd-logo')}${mmWordmark('mm-word-sm')}<span class="hub-sep"></span><button class="btn btn-ghost btn-sm" data-act="goHome">${icon('undo')} ${L('Accueil','Home')}</button></span>
        ${themeToggleBtnHtml('btn-ghost btn-sm')}
      </div>
      <div class="home-sub" style="font-size:22px;font-weight:600;color:var(--ink);margin-top:10px;">${esc(name)}</div>
      <div class="home-sub" style="margin-top:2px;">${L('Série','Series')} · ${seasonNums.length} ${L(seasonNums.length>1?'saisons':'saison', seasonNums.length>1?'seasons':'season')} · ${entries.length} ${L(entries.length>1?'épisodes':'épisode', entries.length>1?'episodes':'episode')}</div>
      <div class="home-actions">
        <button class="btn btn-primary" data-act="openAddEpisodeModal" data-id="${S.seriesId}">${icon('plus')} ${L('Nouvel épisode','New episode')}</button>
        <button class="btn" data-act="openAddSeasonModal" data-id="${S.seriesId}">${icon('plus')} ${L('Nouvelle saison','New season')}</button>
        <button class="btn" data-act="openSeriesExportMenu" data-id="${S.seriesId}">${icon('export')} ${L('Exporter la série…','Export the series…')}</button>
        <button class="btn btn-ghost" data-act="renameSeries" data-id="${S.seriesId}">${L('Renommer la série','Rename the series')}</button>
      </div>
      ${seasonsHtml}
    </div>
  </div>`;
}
async function renameSeries(seriesId, e){
  if(e && e.stopPropagation) e.stopPropagation();
  const entries = seriesEntries(seriesId);
  if(!entries.length) return;
  const current = entries.find(x=>x.seriesName)?.seriesName || '';
  const val = await mmPrompt(L('Nouveau nom de la série','New series name'), current, {title:L('Renommer la série','Rename series'), ok:L('Renommer','Rename')});
  if(val==null) return;
  const name = val.trim();
  if(!name) return;
  for(const entry of entries){
    entry.seriesName = name;
    const full = await storGet(proj_key(entry.id));
    if(full){ full.seriesName = name; await storSet(proj_key(entry.id), full); }
    if(S.project && S.project.id===entry.id) S.project.seriesName = name;
  }
  await saveIndex();
  render();
}
async function renameSeason(seriesId, e){
  const t = e && e.target ? e.target.closest('[data-season]') : null;
  const season = t && t.dataset.season ? parseInt(t.dataset.season,10) : null;
  if(e && e.stopPropagation) e.stopPropagation();
  if(!season) return;
  const entries = seriesEntries(seriesId);
  const current = seasonNameFor(entries, season);
  const val = await mmPrompt(L('Laisse vide pour n\u2019afficher aucun nom.','Leave empty to show no name.'), current, {title:L('Nom de la saison ' + season, 'Name for season ' + season), ok:L('Enregistrer','Save')});
  if(val==null) return;
  await applySeasonName(seriesId, season, val.trim());
  await saveIndex();
  render();
}

/* --- Ajout d'un épisode / d'une saison ------------------------------ */
let S_epFmt = 'fr';
function openAddEpisodeModal(seriesId, e){
  const t = e && e.target ? e.target.closest('[data-season]') : null;
  const presetSeason = t && t.dataset.season ? parseInt(t.dataset.season,10) : null;
  buildEpisodeModal(seriesId, presetSeason, false);
}
function openAddSeasonModal(seriesId){
  const entries = seriesEntries(seriesId);
  const nextSeason = entries.length ? Math.max(...entries.map(x=>x.season||1))+1 : 1;
  buildEpisodeModal(seriesId, nextSeason, true);
}
function seasonNameFor(entries, season){
  const e = entries.find(x=>(x.season||1)===season && x.seasonName);
  return e ? e.seasonName : '';
}
function buildEpisodeModal(seriesId, presetSeason, forceEp1){
  const entries = seriesEntries(seriesId);
  const seriesName = entries.find(x=>x.seriesName)?.seriesName || L('Série','Series');
  const season = presetSeason || (entries.length ? Math.max(...entries.map(x=>x.season||1)) : 1);
  const epsInSeason = entries.filter(x=>(x.season||1)===season);
  const nextEp = forceEp1 ? 1 : (epsInSeason.length ? Math.max(...epsInSeason.map(x=>x.episode||0))+1 : 1);
  const currentSeasonName = forceEp1 ? '' : seasonNameFor(entries, season);
  S_epFmt = (entries[0] && entries[0].format) || 'fr';
  const html = `<div class="modal-backdrop" id="epBackdrop" data-act="closeEpModal">
    <div class="modal" data-stop="1">
      <h2>${forceEp1 ? L('Nouvelle saison','New season') : L('Nouvel épisode','New episode')} · ${esc(seriesName)}</h2>
      <div class="field"><label>${L('Nom de l\u2019épisode (facultatif)','Episode name (optional)')}</label><input type="text" id="epTitle" placeholder="${L('Titre de l\u2019épisode','Episode title')}"></div>
      <div style="display:flex;gap:10px;">
        <div class="field" style="flex:1"><label>${L('Saison','Season')}</label><input type="number" min="1" id="epSeason" value="${season}"></div>
        <div class="field" style="flex:1"><label>${L('Épisode','Episode')}</label><input type="number" min="1" id="epNumber" value="${nextEp}"></div>
      </div>
      <div class="field"><label>${L('Nom de la saison (facultatif)','Season name (optional)')}</label><input type="text" id="epSeasonName" placeholder="${L('Ex. Origines','E.g. Origins')}" value="${esc(currentSeasonName)}"></div>
      <div class="field"><label>${L('Format','Format')}</label>
        <div class="fmt-choice">
          <div class="fmt-opt ${S_epFmt==='fr'?'active':''}" data-act="epPickFmt" data-fmt="fr"><div class="t">${L('Français','French')}</div></div>
          <div class="fmt-opt ${S_epFmt==='us'?'active':''}" data-act="epPickFmt" data-fmt="us"><div class="t">${L('Américain','American')}</div></div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn" data-act="closeEpModal">${L('Annuler','Cancel')}</button>
        <button class="btn btn-primary" data-act="confirmAddEpisode" data-id="${seriesId}">${L('Créer l\u2019épisode','Create the episode')}</button>
      </div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('epTitle').focus();
}
function epPickFmt(id, e){
  const opt = e.target.closest('[data-fmt]');
  if(!opt) return;
  S_epFmt = opt.dataset.fmt;
  opt.parentElement.querySelectorAll('.fmt-opt').forEach(x=>x.classList.remove('active'));
  opt.classList.add('active');
}
function closeEpModal(){ const b=document.getElementById('epBackdrop'); if(b) b.remove(); }
/* Répercute le nom d'une saison sur tous les épisodes existants de cette
   saison (même principe que le nom de série : donnée dupliquée sur chaque
   projet, tenue synchronisée à chaque changement). */
async function applySeasonName(seriesId, season, seasonName){
  const entries = seriesEntries(seriesId).filter(x=>(x.season||1)===season);
  for(const entry of entries){
    entry.seasonName = seasonName;
    const full = await storGet(proj_key(entry.id));
    if(full){ full.seasonName = seasonName; await storSet(proj_key(entry.id), full); }
    if(S.project && S.project.id===entry.id) S.project.seasonName = seasonName;
  }
}
async function confirmAddEpisode(seriesId){
  const entries = seriesEntries(seriesId);
  const seriesName = entries.find(x=>x.seriesName)?.seriesName || L('Série','Series');
  const season = Math.max(1, parseInt(document.getElementById('epSeason').value,10) || 1);
  const episode = Math.max(1, parseInt(document.getElementById('epNumber').value,10) || 1);
  const epTitleVal = (document.getElementById('epTitle').value || '').trim();
  const seasonNameVal = (document.getElementById('epSeasonName').value || '').trim();
  const title = epTitleVal || (seriesName + ' · S' + season + 'E' + episode);
  const p = newProject(title, S_epFmt, 'Série', { seriesId, seriesName, season, episode, seasonName: seasonNameVal });
  const seriesAuthor = await findSeriesAuthor(seriesId);
  p.author = seriesAuthor || getDefaultAuthor();
  S.projectsIndex.push(indexEntryFor(p));
  await saveIndex(); await storSet(proj_key(p.id), p);
  if(seasonNameVal) await applySeasonName(seriesId, season, seasonNameVal);
  await saveIndex();
  closeEpModal();
  S.project = p; S.view='editor'; S.tab='editor'; S.undoStack=[]; S.redoStack=[];
  render();
}

/* toast */
/* ===================== LOGO + BOÎTES DE DIALOGUE ===================== */
/* Un seul logo pour toute l'appli (accueil, hub de série, colonne de
   l'éditeur, favicon). Le favicon du <head> est la même image, en data-URI. */
function mmLogo(size, cls, smoke){
  return '<svg class="' + (cls||'') + (smoke ? ' mm-logo-smoke' : '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true"><rect class="mmlb" width="64" height="64" rx="14" fill="#1F6FA0"/><path d="M12 7H38L53 22V57H12Z" fill="#FCFDFE" stroke="#FCFDFE" stroke-width="3" stroke-linejoin="round"/><path d="M38 7V22H53Z" fill="#B7D4EC" stroke="#B7D4EC" stroke-width="2" stroke-linejoin="round"/><path d="M16 25L31 30M50 27L35 30" stroke="#14425E" stroke-width="6" stroke-linecap="round"/><circle cx="25" cy="38" r="6.6" fill="#14425E"/><circle cx="27.2" cy="35.8" r="1.9" fill="#FCFDFE"/><circle cx="41" cy="38" r="6.6" fill="#14425E"/><circle cx="43.2" cy="35.8" r="1.9" fill="#FCFDFE"/><path d="M20 51H37" stroke="#14425E" stroke-width="5.6" stroke-linecap="round"/><g transform="translate(37 51) rotate(-28)"><rect x="-1" y="-3.2" width="5" height="6.4" rx="1" fill="#5DB6EC"/><rect x="4" y="-3.2" width="15" height="6.4" fill="#14425E"/><path d="M19 -3.2L25.5 0L19 3.2Z" fill="#FCFDFE"/></g>' + (smoke ? '<g class="mm-smoke"><circle class="sp sp1" cx="58.5" cy="37" r="4.2"/><circle class="sp sp2" cx="58.5" cy="37" r="4.2"/><circle class="sp sp3" cx="58.5" cy="37" r="4.2"/></g>' : '') + '</svg>';
}
/* Le nom « Raging Page », dessiné une seule fois : accueil, hub de série, colonne de l'éditeur. */
function mmWordmark(cls){
  return '<span class="mm-word' + (cls ? ' ' + cls : '') + '" role="img" aria-label="Raging Page"><svg viewBox="0 -1911 11713 2422" aria-hidden="true" focusable="false"><path class="w1" d="M1428 -913Q1428 -826 1388.0 -750.0Q1348 -674 1276.0 -621.5Q1204 -569 1107 -552Q1048 -542 1004.0 -525.5Q960 -509 913.0 -496.5Q866 -484 799 -484Q746 -484 696.0 -492.5Q646 -501 603.5 -514.5Q561 -528 530 -544L528 -703Q561 -683 594.0 -672.5Q627 -662 662.0 -658.5Q697 -655 735 -655Q865 -655 934.5 -722.0Q1004 -789 1004 -917Q1004 -1005 964.5 -1074.0Q925 -1143 854.0 -1182.5Q783 -1222 686 -1222H637V-294Q637 -255 650.5 -237.0Q664 -219 689 -204L718 -189Q747 -171 758.5 -148.0Q770 -125 770 -93Q770 0 665 0H177Q125 0 99.0 -24.5Q73 -49 73 -93Q73 -161 135 -192L169 -209Q195 -221 208.5 -239.0Q222 -257 222 -294V-1106Q222 -1143 208.5 -1161.0Q195 -1179 169 -1191L135 -1208Q73 -1239 73 -1307Q73 -1351 99.0 -1375.5Q125 -1400 177 -1400H710Q944 -1400 1104.0 -1336.5Q1264 -1273 1346.0 -1163.0Q1428 -1053 1428 -913ZM800 -567 1196 -615 1392 -271Q1411 -239 1428.0 -223.0Q1445 -207 1479 -190Q1509 -175 1524.0 -151.5Q1539 -128 1539 -93Q1539 -50 1513.5 -25.0Q1488 0 1434 0H1012Q912 0 912 -93Q912 -115 921.0 -132.0Q930 -149 946 -163L963 -173Q973 -181 975.5 -195.5Q978 -210 967 -231Z M2191.0 -156V-183L2156.0 -191V-731Q2156.0 -775 2133.5 -800.5Q2111.0 -826 2071.0 -826Q2040.0 -826 2019.0 -811.5Q1998.0 -797 1998.0 -773V-715Q1998.0 -638 1947.5 -596.5Q1897.0 -555 1803.0 -555Q1720.0 -555 1680.0 -590.5Q1640.0 -626 1640.0 -689Q1640.0 -755 1698.0 -817.5Q1756.0 -880 1873.0 -920.5Q1990.0 -961 2164.0 -961Q2350.0 -961 2439.0 -886.5Q2528.0 -812 2528.0 -682V-249Q2528.0 -233 2536.5 -220.5Q2545.0 -208 2565.0 -208Q2576.0 -208 2583.5 -211.5Q2591.0 -215 2597.0 -219Q2602.0 -223 2608.0 -226.0Q2614.0 -229 2622.0 -229Q2645.0 -229 2657.5 -211.5Q2670.0 -194 2670.0 -169Q2670.0 -123 2640.5 -78.5Q2611.0 -34 2557.0 -4.5Q2503.0 25 2429.0 25Q2327.0 25 2259.0 -25.5Q2191.0 -76 2191.0 -156ZM1605.0 -212Q1605.0 -348 1725.0 -427.0Q1845.0 -506 2046.0 -506Q2100.0 -506 2144.5 -499.5Q2189.0 -493 2217.0 -480L2180.0 -371Q2158.0 -383 2136.5 -388.0Q2115.0 -393 2088.0 -393Q2040.0 -393 2010.5 -364.0Q1981.0 -335 1981.0 -286Q1981.0 -235 2009.5 -206.5Q2038.0 -178 2086.0 -178Q2121.0 -178 2150.0 -192.5Q2179.0 -207 2195.0 -227L2220.0 -119Q2173.0 -50 2083.5 -12.5Q1994.0 25 1893.0 25Q1760.0 25 1682.5 -42.0Q1605.0 -109 1605.0 -212Z M3386.0 -131Q3279.0 -143 3224.5 -151.5Q3170.0 -160 3150.5 -170.0Q3131.0 -180 3131.0 -196Q3131.0 -206 3139.5 -215.5Q3148.0 -225 3166.0 -235L3152.0 -253Q3018.0 -252 2940.5 -223.5Q2863.0 -195 2831.0 -151.0Q2799.0 -107 2799.0 -58Q2799.0 -6 2827.5 35.0Q2856.0 76 2935.5 105.5Q3015.0 135 3166.0 152Q3285.0 165 3350.5 177.0Q3416.0 189 3442.0 204.5Q3468.0 220 3468.0 245Q3468.0 267 3449.5 284.0Q3431.0 301 3382.0 310.0Q3333.0 319 3242.0 319Q3087.0 319 3033.5 290.0Q2980.0 261 2980.0 214Q2980.0 188 2994.0 164.5Q3008.0 141 3032.0 129L3011.0 106Q2834.0 112 2759.5 161.5Q2685.0 211 2685.0 297Q2685.0 358 2735.0 401.5Q2785.0 445 2891.0 467.5Q2997.0 490 3164.0 490Q3478.0 490 3635.0 396.5Q3792.0 303 3792.0 149Q3792.0 65 3751.5 8.5Q3711.0 -48 3621.5 -81.5Q3532.0 -115 3386.0 -131ZM3356.0 -861 3460.0 -846Q3486.0 -908 3508.5 -936.5Q3531.0 -965 3561.0 -965Q3584.0 -965 3599.5 -951.5Q3615.0 -938 3630.0 -921.0Q3645.0 -904 3667.5 -891.0Q3690.0 -878 3727.0 -878Q3785.0 -878 3818.0 -920.0Q3851.0 -962 3851.0 -1033Q3851.0 -1110 3805.5 -1150.5Q3760.0 -1191 3691.0 -1191Q3598.0 -1191 3520.0 -1131.0Q3442.0 -1071 3390.0 -944ZM3710.0 -600Q3710.0 -697 3655.5 -778.5Q3601.0 -860 3494.0 -909.5Q3387.0 -959 3231.0 -959Q3068.0 -959 2952.0 -911.5Q2836.0 -864 2774.0 -777.5Q2712.0 -691 2712.0 -572Q2712.0 -471 2771.0 -392.0Q2830.0 -313 2944.5 -268.0Q3059.0 -223 3224.0 -223Q3370.0 -223 3479.0 -270.0Q3588.0 -317 3649.0 -401.5Q3710.0 -486 3710.0 -600ZM3179.0 -823Q3243.0 -826 3283.0 -753.5Q3323.0 -681 3334.0 -553Q3344.0 -459 3320.5 -410.0Q3297.0 -361 3242.0 -359Q3203.0 -357 3170.5 -388.5Q3138.0 -420 3117.5 -482.5Q3097.0 -545 3089.0 -637Q3082.0 -694 3090.5 -734.5Q3099.0 -775 3121.5 -798.5Q3144.0 -822 3179.0 -823Z M4297.0 -878V-262Q4297.0 -214 4304.5 -196.0Q4312.0 -178 4326.0 -168L4343.0 -158Q4365.0 -144 4377.0 -125.0Q4389.0 -106 4389.0 -78Q4389.0 -42 4366.5 -21.0Q4344.0 0 4304.0 0H3915.0Q3876.0 0 3853.5 -21.0Q3831.0 -42 3831.0 -78Q3831.0 -106 3843.0 -125.0Q3855.0 -144 3877.0 -158L3894.0 -168Q3908.0 -178 3915.5 -196.0Q3923.0 -214 3923.0 -262V-609Q3923.0 -650 3913.0 -666.0Q3903.0 -682 3885.0 -691L3865.0 -697Q3843.0 -711 3831.0 -726.5Q3819.0 -742 3819.0 -767Q3819.0 -796 3836.0 -816.0Q3853.0 -836 3893.0 -852L4084.0 -926Q4132.0 -945 4162.0 -953.0Q4192.0 -961 4222.0 -961Q4258.0 -961 4277.5 -938.0Q4297.0 -915 4297.0 -878ZM4093.0 -1057Q3993.0 -1057 3934.0 -1106.5Q3875.0 -1156 3875.0 -1241Q3875.0 -1326 3934.0 -1375.0Q3993.0 -1424 4093.0 -1424Q4194.0 -1424 4252.5 -1375.0Q4311.0 -1326 4311.0 -1242Q4311.0 -1156 4252.5 -1106.5Q4194.0 -1057 4093.0 -1057Z M4922.0 -878V-262Q4922.0 -209 4928.0 -189.0Q4934.0 -169 4949.0 -159L4967.0 -148Q5003.0 -121 5003.0 -78Q5003.0 0 4927.0 0H4540.0Q4501.0 0 4478.0 -21.0Q4455.0 -42 4455.0 -78Q4455.0 -106 4467.0 -124.5Q4479.0 -143 4502.0 -158L4518.0 -168Q4533.0 -178 4540.0 -196.0Q4547.0 -214 4547.0 -262V-609Q4547.0 -650 4537.5 -666.0Q4528.0 -682 4510.0 -691L4490.0 -697Q4468.0 -711 4455.5 -726.5Q4443.0 -742 4443.0 -767Q4443.0 -796 4460.5 -816.0Q4478.0 -836 4517.0 -852L4709.0 -926Q4756.0 -945 4786.0 -953.0Q4816.0 -961 4847.0 -961Q4882.0 -961 4902.0 -938.0Q4922.0 -915 4922.0 -878ZM4888.0 -609 4819.0 -690 4864.0 -734Q4992.0 -861 5090.5 -911.5Q5189.0 -962 5274.0 -962Q5401.0 -962 5477.0 -878.5Q5553.0 -795 5553.0 -656V-262Q5553.0 -214 5560.0 -195.5Q5567.0 -177 5582.0 -168L5598.0 -158Q5621.0 -142 5633.0 -124.0Q5645.0 -106 5645.0 -78Q5645.0 -42 5622.5 -21.0Q5600.0 0 5560.0 0H5173.0Q5097.0 0 5097.0 -78Q5097.0 -121 5133.0 -148L5151.0 -159Q5167.0 -169 5173.0 -189.0Q5179.0 -209 5179.0 -262V-564Q5179.0 -629 5149.0 -663.5Q5119.0 -698 5065.0 -698Q5030.0 -698 4993.5 -685.0Q4957.0 -672 4922.0 -640Z M6390.0 -131Q6283.0 -143 6228.5 -151.5Q6174.0 -160 6154.5 -170.0Q6135.0 -180 6135.0 -196Q6135.0 -206 6143.5 -215.5Q6152.0 -225 6170.0 -235L6156.0 -253Q6022.0 -252 5944.5 -223.5Q5867.0 -195 5835.0 -151.0Q5803.0 -107 5803.0 -58Q5803.0 -6 5831.5 35.0Q5860.0 76 5939.5 105.5Q6019.0 135 6170.0 152Q6289.0 165 6354.5 177.0Q6420.0 189 6446.0 204.5Q6472.0 220 6472.0 245Q6472.0 267 6453.5 284.0Q6435.0 301 6386.0 310.0Q6337.0 319 6246.0 319Q6091.0 319 6037.5 290.0Q5984.0 261 5984.0 214Q5984.0 188 5998.0 164.5Q6012.0 141 6036.0 129L6015.0 106Q5838.0 112 5763.5 161.5Q5689.0 211 5689.0 297Q5689.0 358 5739.0 401.5Q5789.0 445 5895.0 467.5Q6001.0 490 6168.0 490Q6482.0 490 6639.0 396.5Q6796.0 303 6796.0 149Q6796.0 65 6755.5 8.5Q6715.0 -48 6625.5 -81.5Q6536.0 -115 6390.0 -131ZM6360.0 -861 6464.0 -846Q6490.0 -908 6512.5 -936.5Q6535.0 -965 6565.0 -965Q6588.0 -965 6603.5 -951.5Q6619.0 -938 6634.0 -921.0Q6649.0 -904 6671.5 -891.0Q6694.0 -878 6731.0 -878Q6789.0 -878 6822.0 -920.0Q6855.0 -962 6855.0 -1033Q6855.0 -1110 6809.5 -1150.5Q6764.0 -1191 6695.0 -1191Q6602.0 -1191 6524.0 -1131.0Q6446.0 -1071 6394.0 -944ZM6714.0 -600Q6714.0 -697 6659.5 -778.5Q6605.0 -860 6498.0 -909.5Q6391.0 -959 6235.0 -959Q6072.0 -959 5956.0 -911.5Q5840.0 -864 5778.0 -777.5Q5716.0 -691 5716.0 -572Q5716.0 -471 5775.0 -392.0Q5834.0 -313 5948.5 -268.0Q6063.0 -223 6228.0 -223Q6374.0 -223 6483.0 -270.0Q6592.0 -317 6653.0 -401.5Q6714.0 -486 6714.0 -600ZM6183.0 -823Q6247.0 -826 6287.0 -753.5Q6327.0 -681 6338.0 -553Q6348.0 -459 6324.5 -410.0Q6301.0 -361 6246.0 -359Q6207.0 -357 6174.5 -388.5Q6142.0 -420 6121.5 -482.5Q6101.0 -545 6093.0 -637Q6086.0 -694 6094.5 -734.5Q6103.0 -775 6125.5 -798.5Q6148.0 -822 6183.0 -823Z"/><path class="w2" transform="translate(7180 0)" d="M1445 -915Q1428 -797 1370.5 -706.5Q1313 -616 1226.5 -555.0Q1140 -494 1034.0 -463.0Q928 -432 814 -432Q709 -432 635.0 -448.5Q561 -465 481 -505L537 -667Q581 -633 632.5 -614.5Q684 -596 746 -596Q836 -596 906.0 -637.5Q976 -679 1021.0 -756.0Q1066 -833 1080 -940Q1095 -1038 1074.0 -1101.5Q1053 -1165 1007.5 -1196.0Q962 -1227 900 -1227Q842 -1227 810.5 -1192.5Q779 -1158 758 -1083Q756 -1073 745.5 -1035.5Q735 -998 720.0 -940.5Q705 -883 686.0 -813.5Q667 -744 646.5 -669.5Q626 -595 607.0 -523.0Q588 -451 572.0 -389.5Q556 -328 545 -285Q533 -234 539.5 -212.5Q546 -191 567 -186L629 -171Q657 -164 669.0 -144.0Q681 -124 681 -96Q681 -54 654.5 -27.0Q628 0 579 0H97Q45 0 27.0 -23.5Q9 -47 9 -82Q9 -118 29.5 -141.5Q50 -165 77 -177L111 -191Q138 -201 151.0 -217.0Q164 -233 174 -269Q186 -311 203.0 -372.0Q220 -433 240.0 -505.0Q260 -577 281.5 -654.5Q303 -732 323.5 -806.5Q344 -881 361.5 -948.0Q379 -1015 392.0 -1066.5Q405 -1118 411 -1147Q417 -1174 409.0 -1189.5Q401 -1205 383 -1213L348 -1229Q323 -1243 309.5 -1260.0Q296 -1277 296 -1304Q296 -1348 323.0 -1374.0Q350 -1400 401 -1400H957Q1083 -1400 1181.5 -1366.0Q1280 -1332 1345.0 -1268.0Q1410 -1204 1436.5 -1114.5Q1463 -1025 1445 -915Z M2269.0 -359Q2255.0 -308 2261.5 -281.0Q2268.0 -254 2293.0 -254Q2310.0 -254 2322.0 -261.0Q2334.0 -268 2350.0 -280Q2362.0 -288 2374.0 -289.5Q2386.0 -291 2395.0 -287Q2416.0 -280 2421.0 -253.0Q2426.0 -226 2407.0 -175Q2375.0 -85 2293.0 -31.0Q2211.0 23 2104.0 23Q2039.0 23 2002.5 -20.0Q1966.0 -63 1966.0 -139Q1966.0 -167 1968.0 -194.0Q1970.0 -221 1974.5 -251.5Q1979.0 -282 1987.0 -319.5Q1995.0 -357 2008.0 -404L2029.0 -309Q1971.0 -197 1905.0 -123.0Q1839.0 -49 1762.5 -13.0Q1686.0 23 1593.0 23Q1480.0 23 1416.0 -56.0Q1352.0 -135 1367.0 -299Q1375.0 -390 1409.5 -482.0Q1444.0 -574 1504.5 -657.0Q1565.0 -740 1650.0 -805.0Q1735.0 -870 1844.0 -907.5Q1953.0 -945 2085.0 -945Q2221.0 -945 2300.0 -927.0Q2379.0 -909 2411.0 -874.5Q2443.0 -840 2437.0 -793Q2433.0 -755 2414.0 -734.5Q2395.0 -714 2374.5 -693.5Q2354.0 -673 2344.0 -635ZM1706.0 -332Q1697.0 -261 1714.5 -230.5Q1732.0 -200 1761.0 -200Q1795.0 -200 1833.5 -229.0Q1872.0 -258 1909.5 -308.0Q1947.0 -358 1978.5 -420.0Q2010.0 -482 2031.0 -549.0Q2052.0 -616 2057.0 -679Q2061.0 -719 2045.0 -741.5Q2029.0 -764 1998.0 -764Q1961.0 -764 1922.5 -739.0Q1884.0 -714 1848.5 -670.5Q1813.0 -627 1783.5 -572.0Q1754.0 -517 1733.5 -455.0Q1713.0 -393 1706.0 -332Z M3345.0 -14Q3303.0 158 3217.0 272.0Q3131.0 386 2996.5 443.5Q2862.0 501 2674.0 501Q2539.0 501 2456.0 447.0Q2373.0 393 2373.0 305Q2373.0 243 2413.0 199.5Q2453.0 156 2520.0 156Q2571.0 156 2612.5 179.5Q2654.0 203 2691.0 233.5Q2728.0 264 2764.0 287.0Q2800.0 310 2838.0 310Q2877.0 310 2908.5 291.0Q2940.0 272 2964.5 229.0Q2989.0 186 3006.0 115L3128.0 -357L3158.0 -305Q3104.0 -194 3039.5 -121.5Q2975.0 -49 2897.5 -13.0Q2820.0 23 2727.0 23Q2651.0 23 2596.5 -12.5Q2542.0 -48 2516.5 -120.0Q2491.0 -192 2501.0 -300Q2509.0 -391 2543.5 -483.0Q2578.0 -575 2638.0 -658.0Q2698.0 -741 2783.5 -805.5Q2869.0 -870 2978.5 -907.5Q3088.0 -945 3221.0 -945Q3356.0 -945 3435.0 -927.0Q3514.0 -909 3545.5 -877.0Q3577.0 -845 3569.0 -801Q3564.0 -771 3551.5 -752.0Q3539.0 -733 3525.0 -710.5Q3511.0 -688 3501.0 -646ZM2840.0 -334Q2834.0 -287 2840.5 -257.5Q2847.0 -228 2862.5 -215.0Q2878.0 -202 2898.0 -202Q2932.0 -202 2970.0 -229.5Q3008.0 -257 3044.5 -305.5Q3081.0 -354 3112.0 -415.0Q3143.0 -476 3163.5 -543.0Q3184.0 -610 3189.0 -675Q3193.0 -718 3176.5 -741.5Q3160.0 -765 3131.0 -765Q3094.0 -765 3056.0 -740.0Q3018.0 -715 2982.5 -672.0Q2947.0 -629 2917.5 -573.5Q2888.0 -518 2867.5 -456.5Q2847.0 -395 2840.0 -334Z M3733.0 -429Q3733.0 -429 3765.5 -438.5Q3798.0 -448 3851.5 -463.5Q3905.0 -479 3967.0 -498.0Q4029.0 -517 4088.5 -535.5Q4148.0 -554 4192.0 -570L4164.0 -531Q4176.0 -561 4181.5 -598.5Q4187.0 -636 4187.0 -680Q4187.0 -725 4166.5 -751.0Q4146.0 -777 4107.0 -777Q4074.0 -777 4041.5 -750.5Q4009.0 -724 3981.5 -676.0Q3954.0 -628 3935.5 -564.0Q3917.0 -500 3913.0 -427Q3906.0 -307 3951.0 -246.5Q3996.0 -186 4080.0 -186Q4127.0 -186 4171.0 -201.0Q4215.0 -216 4254.0 -244.5Q4293.0 -273 4322.0 -315Q4356.0 -353 4378.5 -367.5Q4401.0 -382 4429.0 -379Q4457.0 -378 4468.5 -356.5Q4480.0 -335 4479.0 -308Q4478.0 -229 4414.5 -152.5Q4351.0 -76 4232.5 -26.0Q4114.0 24 3948.0 24Q3813.0 24 3728.0 -24.0Q3643.0 -72 3605.5 -158.0Q3568.0 -244 3574.0 -356Q3581.0 -478 3628.0 -584.5Q3675.0 -691 3756.0 -771.5Q3837.0 -852 3944.5 -897.5Q4052.0 -943 4180.0 -943Q4269.0 -943 4327.5 -914.5Q4386.0 -886 4420.0 -834.5Q4454.0 -783 4468.0 -716Q4474.0 -694 4481.0 -680.0Q4488.0 -666 4499.0 -660Q4514.0 -655 4523.0 -642.5Q4532.0 -630 4533.0 -609Q4533.0 -578 4512.0 -552.5Q4491.0 -527 4435.0 -512Q4381.0 -496 4309.0 -475.0Q4237.0 -454 4158.5 -432.0Q4080.0 -410 4005.5 -389.0Q3931.0 -368 3871.5 -351.0Q3812.0 -334 3776.0 -324.0Q3740.0 -314 3740.0 -314Z"/></svg></span>';
}
/* Remplacent confirm() et prompt() : mêmes réponses (true/false, texte/null),
   mais en promesse — l'appelant fait « await ». Échap = annuler, Entrée =
   valider, clic en dehors = annuler. Pour une action destructrice, le focus
   démarre sur « Annuler » (une Entrée distraite ne supprime rien). */
function mmdOpen(cfg){
  return new Promise(resolve=>{
    const prev = document.activeElement;
    const isPrompt = cfg.kind === 'prompt';
    const ico = cfg.danger
      ? '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'
      : (isPrompt ? '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>' : '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.6v.01"/>');
    const bd = document.createElement('div');
    bd.className = 'mmd-backdrop';
    bd.innerHTML =
      '<div class="mmd' + (cfg.danger ? ' danger' : '') + '" role="dialog" aria-modal="true" aria-labelledby="mmdTitle" data-stop="1">' +
        '<div class="mmd-head"><span class="mmd-ico"><svg viewBox="0 0 24 24">' + ico + '</svg></span>' +
        '<div class="mmd-text"><h3 class="mmd-title" id="mmdTitle"></h3>' +
        (cfg.message ? '<p class="mmd-msg"></p>' : '') + '</div></div>' +
        (isPrompt ? '<input class="mmd-input" type="text" autocomplete="off" spellcheck="false">' : '') +
        '<div class="mmd-actions"><button type="button" class="btn btn-ghost mmd-cancel"></button>' +
        '<button type="button" class="btn btn-primary mmd-ok"></button></div>' +
      '</div>';
    bd.querySelector('.mmd-title').textContent = cfg.title;
    if(cfg.message) bd.querySelector('.mmd-msg').textContent = cfg.message;
    const okBtn = bd.querySelector('.mmd-ok'), cancelBtn = bd.querySelector('.mmd-cancel');
    okBtn.textContent = cfg.ok; cancelBtn.textContent = cfg.cancel;
    const input = bd.querySelector('.mmd-input');
    if(input) input.value = cfg.value == null ? '' : String(cfg.value);
    let done = false;
    const finish = val=>{
      if(done) return; done = true;
      document.removeEventListener('keydown', onKey, true);
      bd.remove();
      try{ if(prev && prev.focus && document.contains(prev)) prev.focus(); }catch(e){}
      resolve(val);
    };
    const accept = ()=> finish(isPrompt ? input.value : true);
    const dismiss = ()=> finish(isPrompt ? null : false);
    function onKey(e){
      if(!bd.contains(e.target) && e.target !== document.body && e.target !== document.documentElement){
        /* le focus s'est échappé : on le ramène dans la boîte */
        (input || (cfg.danger ? cancelBtn : okBtn)).focus();
      }
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); dismiss(); return; }
      if(e.key === 'Enter' && !e.shiftKey && !e.isComposing){
        if(e.target === cancelBtn){ e.stopPropagation(); return; }   /* Entrée sur « Annuler » = annuler */
        e.preventDefault(); e.stopPropagation(); accept(); return;
      }
      if(e.key === 'Tab'){
        const f = [].slice.call(bd.querySelectorAll('input,button'));
        const i = f.indexOf(document.activeElement);
        const nx = e.shiftKey ? (i <= 0 ? f.length-1 : i-1) : (i === f.length-1 ? 0 : i+1);
        e.preventDefault(); f[nx].focus();
      }
      e.stopPropagation();   /* aucun raccourci de l'éditeur ne doit réagir pendant la boîte */
    }
    bd.addEventListener('mousedown', e=>{ if(e.target === bd) bd._down = true; else bd._down = false; });
    bd.addEventListener('click', e=>{ e.stopPropagation(); if(e.target === bd && bd._down) dismiss(); });
    okBtn.addEventListener('click', accept);
    cancelBtn.addEventListener('click', dismiss);
    document.body.appendChild(bd);
    document.addEventListener('keydown', onKey, true);
    if(input){ input.focus(); input.select(); }
    else (cfg.danger ? cancelBtn : okBtn).focus();
  });
}
function mmConfirm(message, o){
  o = o || {};
  return mmdOpen({ kind:'confirm', message:message, danger:!!o.danger,
    title:o.title || L('Confirmation','Confirmation'),
    ok:o.ok || L('Confirmer','Confirm'), cancel:o.cancel || L('Annuler','Cancel') });
}
function mmPrompt(label, value, o){
  o = o || {};
  return mmdOpen({ kind:'prompt', message:label, value:value,
    title:o.title || L('Saisie','Input'),
    ok:o.ok || L('Valider','OK'), cancel:o.cancel || L('Annuler','Cancel') });
}

function toast(msg){
  let t = document.getElementById('toastEl');
  if(!t){ t = document.createElement('div'); t.id='toastEl';
    t.style.cssText='position:fixed;bottom:20px;right:20px;background:#262535;color:#fff;padding:10px 16px;border-radius:4px;font-size:13px;z-index:500;box-shadow:0 8px 24px #0004;';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity='1';
  clearTimeout(t._h); t._h = setTimeout(()=>{ t.style.transition='opacity .4s'; t.style.opacity='0'; }, 2600);
}

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
      <div class="wd-top-r">${langFlagsHtml()}${themeToggleBtnHtml('btn-ghost btn-sm')}</div>
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
        <div class="wd-about">
          <b>${mmWordmark()}</b>
          <p class="wd-tag">${L('L\u2019écriture de scénario, gratuite et sans compte.','Screenwriting, free and without an account.')}</p>
          <ul class="wd-points">
            <li>${icon('doc')}<span>${L('Pagination professionnelle','Industry-standard pagination')}</span></li>
            <li>${icon('swap')}<span>${L('Compatible Final Draft (.fdx), Fountain, texte et PDF','Final Draft (.fdx), Fountain, text and PDF')}</span></li>
            <li>${icon('save')}<span>${L('Tes données restent sur ton ordinateur','Your work stays on your computer')}</span></li>
          </ul>
          <div class="wd-ver" style="margin-top:16px;"><span style="display:inline-block;padding:4px 12px;border-radius:12px;background:var(--tag-chip-bg);color:var(--tag-chip-text);font-size:16px;font-weight:700;letter-spacing:.02em;">v1.12</span></div>
        </div>
      </aside>
      <main class="wd-main">
        <div class="wd-main-h"><h1>${L('Mes scénarios','My screenplays')}</h1>${nb ? `<span class="wd-count">${nb}</span>` : ''}</div>
        <div class="wd-table">${list}</div>
      </main>
    </div>
  </div>`;
}
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
    more:'<circle cx="8" cy="3" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="8" cy="13" r="1.4"/>',
  }[name] || '';
  return `<svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}

function attachHomeEvents(){
  const f = document.getElementById('importFile');
  if(f) f.addEventListener('change', onImportFile);
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
      `<ul class="help-list">
        <li><span class="help-kbd-row"><span class="kbd">Tab</span></span> ${L('pour passer en ligne Personnage,','to switch to a Character line,')} <span class="help-kbd-row"><span class="kbd">${L('Maj','Shift')}</span><span class="kbd">Tab</span></span> ${L('pour revenir en Action.','to go back to Action.')}</li>
        <li><span class="help-kbd-row"><span class="kbd">Ctrl/Cmd</span><span class="kbd">K</span></span> ${L('pour sauter à une scène.','to jump to a scene.')}</li>
        <li><span class="help-kbd-row"><span class="kbd">Ctrl/Cmd</span><span class="kbd">Z</span></span> ${L('pour annuler. L\u2019historique couvre aussi le rechercher/remplacer.','to undo. The history also covers find/replace.')}</li>
      </ul>`)}
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
const MM_LOGO_SRC = 'data:image/png;base64,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';
function mmLogo(size, cls, smoke){
  return '<img class="' + (cls||'') + (smoke ? ' mm-logo-smoke' : '') + '" width="' + size + '" height="' + size + '" src="' + MM_LOGO_SRC + '" alt="" aria-hidden="true" draggable="false">';
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

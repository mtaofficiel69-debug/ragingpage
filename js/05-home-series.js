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
/* Logo : PNG pré-réduit à la taille exacte d'affichage (40 px accueil/hub, 38 px colonne de l'éditeur)
   pour écrans 1x, 2x et 3x. Un seul gros PNG réduit par le navigateur donnait une image floue. */
const MM_LOGO = {
  40: ['data:image/png;base64,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', 'data:image/png;base64,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', 'data:image/png;base64,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'],
  38: ['data:image/png;base64,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', 'data:image/png;base64,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', 'data:image/png;base64,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'],
};
function mmLogo(size, cls, smoke){
  /* Image choisie selon la taille et la densité de l'écran (1x, 2x, 3x) : le navigateur ne la rééchelonne jamais beaucoup. */
  const r = window.devicePixelRatio || 1;
  const set = MM_LOGO[size] || MM_LOGO[40];
  const src = r > 2.25 ? set[2] : (r > 1.1 ? set[1] : set[0]);
  return '<img class="' + (cls||'') + (smoke ? ' mm-logo-smoke' : '') + '" width="' + size + '" height="' + size + '" src="' + src + '" alt="" aria-hidden="true" draggable="false">';
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

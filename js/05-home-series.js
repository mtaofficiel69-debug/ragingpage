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
/* Logo : PNG pré-réduit à la taille exacte d'affichage (56 px) pour 1x, 2x et 3x.
   Un seul gros PNG réduit par le navigateur donnait une image floue. */
const MM_LOGO_1X = 'data:image/png;base64,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';
const MM_LOGO_2X = 'data:image/png;base64,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';
const MM_LOGO_3X = 'data:image/png;base64,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';
function mmLogo(size, cls, smoke){
  /* L'image est choisie selon la densité de l'écran (1x, 2x, 3x) : le navigateur n'a jamais à la rééchelonner beaucoup. */
  const r = window.devicePixelRatio || 1;
  const src = r > 2.25 ? MM_LOGO_3X : (r > 1.1 ? MM_LOGO_2X : MM_LOGO_1X);
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

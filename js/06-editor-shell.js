/* =====================================================================
   EDITOR SHELL
===================================================================== */
function railItems(){
  return [
    ['editor','doc',L('Éditeur','Editor')],
    ['cards','grid',L('Cartes','Cards')],
    ['structure','layers',L('Structure','Structure')],
    ['outline','list',L('Outline','Outline')],
    ['storyboard','frames',L('Storyboard','Storyboard')],
    ['guide','book',L('Aide à l\u2019écriture','Writing help')],
    ['characters','users',L('Personnages','Characters')],
    ['tags','tag',L('Tags','Tags')],
    ['titlepage','palette',L('Page de titre','Title page')],
    ['notes','note',L('Notes','Notes')],
    ['reports','search',L('Rapports','Reports')],
    ['stats','chart',L('Statistiques','Statistics')],
    ['graveyard','trash',L('Corbeille','Graveyard')],
    ['history','clock',L('Historique','History')],
    ['settings','gear',L('Paramètres','Settings')],
  ];
}
function renderEditorShell(){
  const p = S.project;
  const railGroups = [
    [L('Écrire','Write'), ['editor','cards','structure','outline','storyboard','guide']],
    [L('Univers','Story world'), ['characters','tags','notes']],
    [L('Projet','Project'), ['titlepage','reports','stats','history','graveyard','settings']],
  ];
  const railById = {}; railItems().forEach(r=>{ railById[r[0]] = r; });
  const items = railGroups.map(([gl, ids])=>
    `<div class="rail-group">${gl}</div>` + ids.filter(id=>railById[id]).map(id=>{
      const [, ic, label] = railById[id];
      return `<div class="rail-item ${S.tab===id?'active':''}" data-act="switchTab" data-id="${id}" data-tip="${label}">${icon(ic)}<span class="lbl">${label}</span></div>`;
    }).join('')
  ).join('');
  const railShut = railClosed();
  return `
  <div id="editorView"${railShut ? ' class="rail-collapsed"' : ''}>
    <div class="rail">
      <div class="rail-top">
        <div class="rail-brand" data-act="goHome" title="${L('Retour au portfolio','Back to portfolio')}">${mmLogo(38,'rail-logo')}${mmWordmark()}</div>
        <div class="rail-project" data-label="${L('Scénario','Screenplay')}">${esc(p.title)}</div>
      </div>
      <div class="rail-nav">${items}</div>
      <div class="rail-bottom" id="railCount">${p.elements.length} ${L('éléments','elements')}</div>
      <button type="button" class="rail-toggle" data-act="toggleRail" title="${L('Masquer la colonne','Hide the sidebar')}" aria-label="${L('Masquer la colonne','Hide the sidebar')}" aria-expanded="true">${icon('railhide')}</button>
    </div>
    <button type="button" class="rail-reopen" data-act="toggleRail" title="${L('Afficher la colonne','Show the sidebar')}" aria-label="${L('Afficher la colonne','Show the sidebar')}" aria-expanded="false">${icon('railshow')}</button>
    <div class="main-col">
      <div class="topbar">
        <div class="topbar-left">
          <button class="btn btn-sm btn-ghost" data-act="goHome" title="${L('Retour au portfolio','Back to portfolio')}">${icon('home')} <span class="tb-lbl">${L('Portfolio','Portfolio')}</span></button>
          <span class="tb-div"></span>
          <button class="btn btn-sm" data-act="insertScene" title="${L('Insérer une nouvelle entête de scène','Insert a new scene heading')}">${icon('scene')} + <span class="tb-lbl">${L('Scène','Scene')}</span></button>
          <button class="btn btn-sm" data-act="insertCard" title="${L('Insérer un carton : texte placé où tu veux (milieu de page, gros titre, cadre…), taille et style réglables','Insert a title card: text placed anywhere (centered, big title, frame…) with adjustable size and style')}">${icon('card')} + <span class="tb-lbl">${L('Carton','Card')}</span></button>
          <button class="btn btn-sm" data-act="openLayout" title="${L('Aligner / placer librement la ligne en cours : alignement, retrait gauche et droit (sans carton)','Align / freely place the current line: alignment, left and right indent (no card needed)')}">${icon('align')} <span class="tb-lbl">${L('Aligner','Align')}</span></button>
          <span class="tb-div"></span>
          <button class="btn btn-sm btn-ghost" data-act="doUndo" title="${L('Annuler (Ctrl+Z)','Undo (Ctrl+Z)')}">${icon('undo')}</button>
          <button class="btn btn-sm btn-ghost" data-act="doRedo" title="${L('Rétablir (Ctrl+Shift+Z)','Redo (Ctrl+Shift+Z)')}">${icon('redo')}</button>
          <span class="tb-div"></span>
          ${scriptFontSelectHtml('tb-font')}
          <span class="tb-div"></span>
          <div class="save-status"><span class="dot" id="saveDot"></span><span id="saveLabel">${L('Sauvegardé','Saved')}</span></div>
          <span class="vault-chip off" id="vaultChip" data-act="vaultChipClick" title="${L('Coffre-fort','Vault')}"></span>
          <span class="vault-chip off" id="driveChip" data-act="driveChipClick" style="display:none" title="${L('Google Drive','Google Drive')}"></span>
          ${langFlagsHtml()}
        </div>
        <div class="topbar-right">
          <div class="pg-indicator" id="pageIndicator" data-act="goToPage" title="${L('Aller à une page…','Go to a page…')}">${L('Page','Page')} <b>1</b> / 1</div>
          <div class="search-box"><input type="text" id="searchInput" placeholder="${L('Rechercher…','Search…')}" value="${esc(S.search.query)}">
            <span class="search-count" id="searchCount"></span></div>
          <button class="btn btn-sm btn-ghost" data-act="toggleMoreMenu" title="${L('Plus d\u2019options','More options')}">${icon('more')}</button>
          <button class="btn btn-sm btn-primary" data-act="openExportMenu" title="${L('Exporter','Export')}">${icon('export')} <span class="tb-lbl">${L('Exporter','Export')}</span></button>
        </div>
      </div>
      <div class="body-row">
        <div class="center-pane" id="centerPane"></div>
        <div class="side-pane hidden" id="sidePane"></div>
      </div>
    </div>
  </div>`;
}
/* COLONNE DE GAUCHE REPLIABLE : ouverte par défaut ; le bouton en bas de la colonne la masque pour laisser
   toute la place au scénario, l'onglet sur le bord gauche la rouvre. Le choix est mémorisé dans ce navigateur. */
const RAIL_KEY = 'scriptmm_rail_closed';
function railClosed(){ try{ return localStorage.getItem(RAIL_KEY) === '1'; }catch(e){ return false; } }
function toggleRail(){
  const view = document.getElementById('editorView'); if(!view) return;
  const shut = !view.classList.contains('rail-collapsed');
  try{ localStorage.setItem(RAIL_KEY, shut ? '1' : '0'); }catch(e){}
  view.classList.toggle('rail-collapsed', shut);
  // La zone du scénario change de largeur : même traitement qu'un redimensionnement de la fenêtre
  // (échelle de la feuille, barre du haut, repères...).
  try{ window.dispatchEvent(new Event('resize')); }catch(e){}
  const to = view.querySelector(shut ? '.rail-reopen' : '.rail-toggle');
  if(to && document.activeElement && document.activeElement.closest && document.activeElement.closest('.rail-toggle, .rail-reopen')) to.focus({ preventScroll:true });
}
/* Cliquer sur ces boutons ne retire pas le curseur du scénario. */
document.addEventListener('mousedown', e => { if(e.target && e.target.closest && e.target.closest('.rail-toggle, .rail-reopen')) e.preventDefault(); }, true);
function attachEditorEvents(){
  syncRailTips();
  const si = document.getElementById('searchInput');
  if(si){ si.addEventListener('input', onSearchInput); si.addEventListener('keydown', onSearchKeydown); }
  document.addEventListener('keydown', onDocKeydown);
  document.addEventListener('mouseup', onDocMouseUp);
  document.addEventListener('mousemove', onDocMouseMove);
  window.addEventListener('resize', onWindowResize);
  tbFitWatch();
}
/* Infobulle native seulement quand la colonne est réduite (libellés cachés) :
   sinon elle répète le libellé déjà visible, d'où l'impression de survol « en double ». */
function syncRailTips(){
  const narrow = window.matchMedia('(max-width:880px)').matches;
  document.querySelectorAll('.rail-item[data-tip]').forEach(el=>{
    if(narrow){ if(el.getAttribute('title') !== el.dataset.tip) el.setAttribute('title', el.dataset.tip); }
    else if(el.hasAttribute('title')) el.removeAttribute('title');
  });
}
function onWindowResize(){ syncRailTips(); closeMoreMenu(); hideAutocomplete(); schedulePaginate(160); }
function switchTab(id, e){
  /* Clic sur l'onglet déjà ouvert dans la colonne de gauche : rien à refaire
     (comme WriterDuet). Évite de reconstruire toute la page pour rien. */
  if(e && e.target && e.target.closest && e.target.closest('.rail-item') && id === S.tab) return;
  closeMoreMenu();
  stopReading();
  stopDictation();
  if(S.tab==='titlepage' && id!=='titlepage' && S.tpDrawMode && tpCanvas){
    ensureTPDesign(S.project).drawing = tpCanvas.toDataURL('image/png');
    S.tpDrawMode = false; scheduleAutosave();
  }
  S.tab=id; syncRailActive(id);
  /* Le surlignage est peint AVANT le rendu lourd de l'onglet (sinon le
     navigateur attend la fin du rendu et le bouton « traîne »). */
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ if(S.tab===id) renderTabBody(); }));
}
function syncRailActive(id){
  const rail = document.querySelector('.rail-nav');
  if(rail) rail.querySelectorAll('.rail-item').forEach(el=> el.classList.toggle('active', el.dataset.id===id));
}
function cancelPendingPagination(){
  if(S.pagination.pending != null){ cancelAnimationFrame(S.pagination.pending); S.pagination.pending = null; }
}
function goHome(){ closeMoreMenu(); stopReading(); stopDictation(); flushAutosave(); cancelPendingPagination(); hideAutocomplete(); closeExtMenu(); window.removeEventListener('resize', onWindowResize); document.removeEventListener('keydown', onDocKeydown); document.removeEventListener('mouseup', onDocMouseUp); document.removeEventListener('mousemove', onDocMouseMove); S.view='home'; render(); }

function renderTabBody(){
  const c = document.getElementById('centerPane'); const side = document.getElementById('sidePane');
  side.classList.add('hidden'); side.innerHTML='';
  /* v94 : onglets « document » (contenu sur une colonne) : leur en-tête s'aligne sur cette colonne */
  c.classList.toggle('pane-doc', ['structure','outline','guide','characters','tags','notes','reports','stats','history','graveyard','settings'].indexOf(S.tab) >= 0);
  if(S.tab==='editor') renderEditorTab();
  else if(S.tab==='cards') c.innerHTML = renderCards();
  else if(S.tab==='structure') c.innerHTML = renderStructure();
  else if(S.tab==='outline') c.innerHTML = renderOutline();
  else if(S.tab==='storyboard') c.innerHTML = renderStoryboard();
  else if(S.tab==='guide') c.innerHTML = renderWritingHelp();
  else if(S.tab==='titlepage'){ c.innerHTML = renderTitlePageDesign(); }
  else if(S.tab==='characters') c.innerHTML = renderCharacters();
  else if(S.tab==='tags') c.innerHTML = renderTags();
  else if(S.tab==='notes') c.innerHTML = renderNotes();
  else if(S.tab==='reports') c.innerHTML = renderReports();
  else if(S.tab==='stats') c.innerHTML = renderStats();
  else if(S.tab==='graveyard') c.innerHTML = renderGraveyard();
  else if(S.tab==='history') c.innerHTML = renderHistory();
  else if(S.tab==='settings') c.innerHTML = renderSettings();
  const pi = document.getElementById('pageIndicator');
  if(pi) pi.style.visibility = (S.tab==='editor') ? '' : 'hidden';
  // Le navigateur de scènes n'existe qu'à côté de la page d'écriture.
  if(S.tab==='editor' && S.navOpen) renderNavPane();
  attachTabEvents();
}

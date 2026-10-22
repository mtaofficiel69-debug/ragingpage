/* =====================================================================
   SETTINGS
===================================================================== */
let __setSec = 'projet';
function setSettingsSection(_, e){
  const el = e && e.target && e.target.closest && e.target.closest('[data-sec]');
  if(!el) return;
  __setSec = el.dataset.sec;
  document.querySelectorAll('.sset-group').forEach(g=>{ g.style.display = (g.dataset.g === __setSec) ? '' : 'none'; });
  document.querySelectorAll('.sset-tab').forEach(t=>{ t.classList.toggle('active', t.dataset.sec === __setSec); });
}
function settingsCloudHtml(){
  const h = vaultSettingsHtml();
  const m = '<div class="panel-block"><h4>';
  const i = h.indexOf(m, h.indexOf(m) + 1);
  return i > 0 ? h.slice(i) + h.slice(0, i) : h; // Google Drive d'abord, puis le coffre-fort
}
/* Aperçu de la numérotation d'après ce qui est coché / saisi (mêmes règles que computePageLabels et l'export). */
function setPageNumPreviewText(show, first, startRaw){
  const nF = fpCount(S.project);
  if(!show && !nF) return L('Aucun numéro de page ne sera affiché.','No page number will be shown.');
  const v = parseInt(startRaw, 10), start = isNaN(v) ? 1 : Math.max(0, v);
  const parts = [];
  if(show) parts.push(L('scénario : ','script: ') + [0, 1, 2].map(k => 'p. ' + (k + 1) + ' → ' + ((k > 0 || first) ? (start + k) + '.' : L('sans numéro','no number'))).join(' · ') + ' ...');
  else parts.push(L('scénario : aucun numéro affiché','script: no number shown'));
  if(nF) parts.push(nF + ' ' + L('page' + (nF > 1 ? 's' : '') + ' sans numéro, qui ne compte' + (nF > 1 ? 'nt' : '') + ' pas', 'unnumbered page' + (nF > 1 ? 's' : '') + ', not counted'));
  return L('Aperçu du PDF : ','PDF preview: ') + parts.join('  |  ');
}
function setPageNumPreviewRender(){
  const out = document.getElementById('setPageNumPreview'); if(!out) return;
  const g = id => document.getElementById(id);
  if(!g('setPageNum') || !g('setPageNumFirst') || !g('setPageStart')) return;
  out.textContent = setPageNumPreviewText(g('setPageNum').checked, g('setPageNumFirst').checked, g('setPageStart').value);
}
function setPageNumPreviewRefresh(e){
  const t = e.target; if(!t || !(t.id === 'setPageNum' || t.id === 'setPageNumFirst' || t.id === 'setPageStart')) return;
  setPageNumPreviewRender();
}
document.addEventListener('input', setPageNumPreviewRefresh);
document.addEventListener('change', setPageNumPreviewRefresh);

function renderSettings(){
  const p = S.project;
  return `<div class="cards-toolbar"><div class="pane-title" style="margin:0;">${L('Paramètres','Settings')}</div></div>
  <div style="padding:8px 24px 60px;max-width:860px;">
    <div class="fmt-choice sset-nav">
${[['projet',L('Projet','Project')],['page',L('Mise en page','Layout')],['backup',L('Sauvegarde','Backup')]].map(x=>`      <div class="fmt-opt sset-tab ${__setSec===x[0]?'active':''}" data-act="setSettingsSection" data-sec="${x[0]}"><div class="t">${x[1]}</div></div>`).join('\n')}
    </div>
    <div class="sset-group" data-g="projet" style="${__setSec==='projet'?'':'display:none'}">
      <p class="sset-lead">${L('Le titre, le format et la page de titre de ce scénario.','The title, format and title page of this screenplay.')}</p>
    <div class="panel-block"><h4>${L('Projet','Project')}</h4>
      <p class="sset-sub">${L('Le nom et le format de ce scénario.','The name and format of this screenplay.')}</p>
      <div class="field"><label>${L('Titre','Title')}</label><input type="text" id="setTitle" value="${esc(p.title)}"></div>
      <div class="field"><label>${L('Format','Format')}</label>
        <div class="fmt-choice">
          <div class="fmt-opt ${p.format==='fr'?'active':''}" data-act="setFormat" data-fmt="fr"><div class="t">${L('Français','French')}</div><div class="d">${L('mise en page française','French layout')}</div></div>
          <div class="fmt-opt ${p.format==='us'?'active':''}" data-act="setFormat" data-fmt="us"><div class="t">${L('Américain','American')}</div><div class="d">${L('mise en page américaine','US layout')}</div></div>
        </div>
      </div>
    </div>
    <div class="panel-block"><h4>${L('Page de titre (à l\u2019export)','Title page (on export)')}</h4>
      <p class="sset-sub">${L('Ce qui s\u2019affiche sur la page de titre, à l\u2019export.','What appears on the title page, on export.')}</p>
      <div class="sset-row">
        <label class="opt-label">
          <input type="checkbox" id="setTitlePage" ${p.settings.titlePageEnabled?'checked':''}> ${L('Inclure une page de titre','Include a title page')}
        </label>
      </div>
      <div class="sset-sep"></div>
      <div class="sset-label">${L('Informations','Details')}</div>
      <div class="wd-row2">
        <div class="field"><label>${L('Auteur','Author')}</label><input type="text" id="setAuthor" value="${esc(p.author)}"></div>
        <div class="field"><label>${L('Type de projet','Project type')}</label>
          <select id="setKind">
            <option value="" ${p.kind?'':'selected'}>${L('Ne rien afficher','Show nothing')}</option>
            ${PROJECT_KINDS.concat(PROJECT_KINDS.includes(p.kind)||!p.kind ? [] : [p.kind])
              .map(k=>`<option value="${esc(k)}" ${k===p.kind?'selected':''}>${esc(kindOptionLabel(k))}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field"><label>${L('Contact','Contact')}</label><input type="text" id="setContact" value="${esc(p.contact)}"></div>
      <div class="wd-row2">
        <div class="field"><label>${L('Version','Version')}</label><input type="text" id="setVersion" value="${esc(p.version)}"></div>
        <div class="field"><label>${L('Date','Date')}</label><input type="date" id="setDate" value="${esc(p.date)}"></div>
      </div>
    </div>
    ${p.seriesId ? `
    <div class="panel-block"><h4>${L('Série','Series')}</h4>
      <p class="sset-sub">${L('Ce scénario est un épisode : ces réglages valent pour lui. Le nom de la série et celui de la saison se répercutent sur les autres épisodes concernés.','This screenplay is an episode: these settings apply to it. The series name and season name carry over to the other episodes concerned.')}</p>
      <div class="field"><label>${L('Nom de la série','Series name')}</label><input type="text" id="setSeriesName" value="${esc(p.seriesName||'')}"></div>
      <div class="wd-row2">
        <div class="field"><label>${L('Saison','Season')}</label><input type="number" min="1" id="setSeason" value="${p.season||1}"></div>
        <div class="field"><label>${L('Épisode','Episode')}</label><input type="number" min="1" id="setEpisode" value="${p.episode||1}"></div>
      </div>
      <div class="field"><label>${L('Nom de la saison (facultatif)','Season name (optional)')}</label><input type="text" id="setSeasonName" placeholder="${L('Ex. Origines','E.g. Origins')}" value="${esc(p.seasonName||'')}"></div>
      <div class="sset-actions"><button class="btn btn-sm" data-act="openSeriesHub" data-id="${p.seriesId}">${icon('list')} ${L('Voir tous les épisodes de la série','See all episodes of the series')}</button></div>
    </div>` : ''}
    </div>
    <div class="sset-group" data-g="page" style="${__setSec==='page'?'':'display:none'}">
      <p class="sset-lead">${L('L\u2019apparence du scénario, à l\u2019écran comme à l\u2019export.','How the screenplay looks, on screen and when exported.')}</p>
    <div class="panel-block"><h4>${L('Police du scénario','Screenplay font')}</h4>
      <p class="sset-sub">${L('La police de tout le scénario, à l\u2019écran comme à l\u2019export. Tu peux la changer à tout moment.','The font for the whole screenplay, on screen and in exports. You can change it at any time.')}</p>
      <div class="field" style="margin-bottom:14px;">${scriptFontSelectHtml('')}</div>
      <ul class="sset-points">
        <li>${L('Les polices à chasse fixe (Courier) gardent la règle « une page \u2248 une minute »','Monospaced fonts (Courier) keep the \u201cone page \u2248 one minute\u201d rule')}</li>
        <li>${L('Une autre police change le nombre de lignes par page, donc la pagination','Any other font changes the number of lines per page, and so the pagination')}</li>
        <li>${L('Dans le PDF, une police sans équivalent standard est remplacée par la plus proche (Courier, Times ou Helvetica)','In the PDF, a font without a standard equivalent is replaced by the closest one (Courier, Times or Helvetica)')}</li>
      </ul>
    </div>
    <div class="panel-block"><h4>${L('Numérotation','Numbering')}</h4>
      <p class="sset-sub">${L('Les numéros de scène, à l\u2019écran et à l\u2019export.','Scene numbers, on screen and in exports.')}</p>
      <div class="sset-row">
        <label class="opt-label">
          <input type="checkbox" id="setSceneNum" ${p.settings.showSceneNumbers?'checked':''}> ${L('Afficher les numéros de scène','Show scene numbers')}
        </label>
      </div>
      <div class="field"><label>${L('Commencer à','Start at')}</label><input type="text" id="setNumStart" value="${p.settings.numberStart}" style="max-width:100px;"></div>
      <div class="sset-sep"></div>
      <div class="sset-row">
        <label class="opt-label">
          <input type="checkbox" id="setNumLock" ${p.settings.numbersLocked?'checked':''}> ${L('Verrouiller les numéros de scène','Lock scene numbers')}
        </label>
        <p class="sset-hint">${L('Les numéros existants ne bougent plus : une scène insérée entre deux scènes verrouillées reçoit une lettre (12, 12A, 12B…) au lieu de tout décaler. Pratique une fois le découpage distribué à l\u2019équipe. Déverrouiller revient à la numérotation automatique.','Existing numbers no longer move: a scene inserted between two locked scenes gets a letter (12, 12A, 12B…) instead of shifting everything. Handy once the breakdown has been distributed to the team. Unlocking goes back to automatic numbering.')}</p>
      </div>
    </div>
    <div class="panel-block"><h4>${L('Pagination','Pagination')}</h4>
      <p class="sset-sub">${L('Les sauts de page suivent les dimensions réelles du papier (' + (p.format==='us'?'Letter':'A4') + ') : le PDF reproduit exactement les pages de l\u2019éditeur.','Page breaks follow the real paper dimensions (' + (p.format==='us'?'Letter':'A4') + '): the PDF reproduces exactly the pages shown in the editor.')}</p>
      <div class="sset-label">${L('Pages sans numéro','Unnumbered pages')}</div>
      <p class="sset-sub">${L('Elles se posent directement dans le scénario, autant que tu veux et où tu veux (dédicace, citation, synopsis, intercalaire, page blanche...) : menu \u22EE (plus d\u2019options) \u203A « Page sans numéro ». Elles ne portent pas de numéro et ne comptent pas : les pages du scénario gardent leur numérotation.','They go straight into the script, as many as you like and wherever you like (dedication, quote, synopsis, act break, blank page...): \u22EE menu (more options) \u203A \u201cUnnumbered page\u201d. They carry no number and are not counted: the script pages keep their numbering.')}${fpCount(p) ? ' <b>' + L('Dans ce scénario : ','In this script: ') + fpCount(p) + '.</b>' : ''}</p>
      <div class="sset-sep"></div>
      <div class="sset-label">${L('Numéros de page du scénario','Script page numbers')}</div>
      <div class="sset-row">
        <label class="opt-label">
          <input type="checkbox" id="setPageNum" ${p.settings.showPageNumbers?'checked':''}> ${L('Afficher les numéros de page','Show page numbers')}
        </label>
      </div>
      <div class="sset-row">
        <label class="opt-label">
          <input type="checkbox" id="setPageNumFirst" ${p.settings.numberFirstPage?'checked':''}> ${L('Afficher le numéro sur la première page du scénario','Show the number on the first page of the script')}
        </label>
      </div>
      <p class="sset-sub">${L('Décochée, la première page du scénario n\u2019affiche pas son numéro, mais elle compte : la suivante porte le n° 2.','Unticked, the first page of the script shows no number but still counts: the next one is numbered 2.')}</p>
      <div class="field"><label>${L('Numéro de la première page du scénario','Number of the first script page')}</label><input type="text" id="setPageStart" value="${p.settings.pageNumberStart}" style="max-width:100px;"></div>
      <p class="sset-sub">${L('1 par défaut. Les pages sans numéro ne comptent pas : le scénario commence toujours ici. Mets 0 pour que la page suivante porte le n° 1.','1 by default. Unnumbered pages are not counted: the script always starts here. Enter 0 for the next page to be numbered 1.')}</p>
      <p class="sset-sub" id="setPageNumPreview" style="font-weight:600;">${setPageNumPreviewText(p.settings.showPageNumbers, p.settings.numberFirstPage, p.settings.pageNumberStart)}</p>
      <div class="sset-sep"></div>
      <div class="sset-label">${L('Continuité','Continuity')}</div>
      <div class="sset-row">
        <label class="opt-label">
          <input type="checkbox" id="setContinued" ${p.settings.showContinued?'checked':''}> ${L('Mention « CONTINUITÉ : » entre deux pages','\u201cCONTINUED:\u201d mark between pages')}
        </label>
        <p class="sset-hint">${L('Affichée en bas et en haut de page quand une scène se poursuit d\u2019une page à l\u2019autre.','Shown at the bottom and top of the page when a scene continues from one page to the next.')}</p>
      </div>
      <div class="sset-row">
        <label class="opt-label">
          <input type="checkbox" id="setAutoContd" ${p.settings.autoContd?'checked':''}> ${L('Mention de continuité quand un personnage reprend la parole','Continuity mark when a character resumes speaking')}
        </label>
        <p class="sset-hint">${L('Ajoutée automatiquement quand le même personnage reprend la parole dans la scène, après une action ou un plan. Elle n\u2019est pas écrite dans le texte : déplacer une scène ou couper l\u2019option la fait disparaître sans rien à nettoyer. Les mentions déjà présentes dans un scénario importé sont reconnues, jamais doublées.','Added automatically when the same character resumes speaking within the scene, after an action line or a shot. It is never written into the text: moving a scene or turning the option off makes it disappear with nothing to clean up. Marks already present in an imported screenplay are recognized, never duplicated.')}</p>
      </div>
      <div class="field" style="margin-bottom:6px;"><label>${L('Mention utilisée','Mark used')}</label>
        <select id="setContdMark">
          <option value="auto" ${(!p.settings.contdMark||p.settings.contdMark==='auto')?'selected':''}>${L('Automatique (selon la langue de l\u2019interface)','Automatic (based on interface language)')}</option>
          <option value="suite" ${p.settings.contdMark==='suite'?'selected':''}>(SUITE)</option>
          <option value="contd" ${p.settings.contdMark==='contd'?'selected':''}>(CONT'D)</option>
        </select>
      </div>
      <p class="sset-hint" style="margin:0 0 14px;">${L('En automatique : « (SUITE) » en français, « (CONT\u2019D) » en anglais. Tu peux aussi figer une seule graphie.','Automatic: \u201c(SUITE)\u201d in French, \u201c(CONT\u2019D)\u201d in English. You can also lock in a single spelling.')}</p>
      <div class="sset-sep"></div>
      <div class="sset-label">${L('Interligne','Line spacing')}</div>
      <div class="sset-status ok"><span class="sset-dot"></span><span>${L('Standard (norme du métier) — verrouillé','Standard (industry norm) — locked')}</span></div>
      <p class="sset-hint" style="margin:-4px 0 14px;">${L('Comme dans Final Draft et WriterDuet : interligne simple, 6 lignes au pouce, environ 58 lignes par page. Ce réglage est fixe pour que la page suivante ne commence jamais avant que la page soit pleine.','As in Final Draft and WriterDuet: single spacing, 6 lines per inch, about 58 lines per page. This setting is fixed so the next page never starts before the page is full.')}</p>
    </div>
    <div class="panel-block"><h4>${L('Filigrane (PDF & impression)','Watermark (PDF & print)')}</h4>
      <p class="sset-sub">${L('Un texte discret, en diagonale, sur chaque page du PDF et de l\u2019impression. Jamais dans l\u2019éditeur.','A discreet diagonal text on every page of the PDF and print output. Never in the editor.')}</p>
      <div class="field"><label>${L('Texte du filigrane','Watermark text')}</label>
        <input type="text" id="setWatermark" placeholder="${L('Ex. CONFIDENTIEL, ou le nom du destinataire','E.g. CONFIDENTIAL, or the recipient\u2019s name')}" value="${esc(p.settings.watermarkText||'')}">
      </div>
      <ul class="sset-points">
        <li>${L('Pratique pour marquer une copie de lecture','Handy for marking a reading copy')}</li>
        <li>${L('Permet de repérer d\u2019où vient une fuite si le scénario circule avant sa sortie','Helps trace where a leak came from if the screenplay circulates before release')}</li>
        <li>${L('Laisse vide pour ne rien afficher','Leave empty to show nothing')}</li>
      </ul>
    </div>
    </div>
    <div class="sset-group" data-g="backup" style="${__setSec==='backup'?'':'display:none'}">
      <p class="sset-lead">${L('Choisis comment protéger ton travail. Ces réglages s\u2019appliquent tout de suite.','Choose how to protect your work. These settings apply immediately.')}</p>
    ${settingsCloudHtml()}
    <div class="panel-block"><h4>${L('Sauvegarde','Backup')}</h4>
      <p class="sset-sub">${L('De temps en temps, Raging Page télécharge une copie <b>.smmproj</b> de ton scénario, hors du navigateur.','From time to time, Raging Page downloads a <b>.smmproj</b> copy of your screenplay, outside the browser.')}</p>
      <div class="sset-label">${L('À quelle fréquence ?','How often?')}</div>
      <div class="fmt-choice" style="flex-wrap:wrap;margin-bottom:14px;">
          <div class="fmt-opt ${backupLevel()==='off'?'active':''}" data-act="setBackupLevel" data-lvl="off"><div class="t">${L('Désactivée','Off')}</div><div class="d">${L('aucun fichier','no files')}</div></div>
          <div class="fmt-opt ${backupLevel()==='low'?'active':''}" data-act="setBackupLevel" data-lvl="low"><div class="t">${L('Discrète','Light')}</div><div class="d">${L('1 fichier / 4 h','1 file / 4 h')}</div></div>
          <div class="fmt-opt ${backupLevel()==='normal'?'active':''}" data-act="setBackupLevel" data-lvl="normal"><div class="t">${L('Équilibrée','Balanced')}</div><div class="d">${L('1 fichier / heure','1 file / hour')}</div></div>
          <div class="fmt-opt ${backupLevel()==='high'?'active':''}" data-act="setBackupLevel" data-lvl="high"><div class="t">${L('Renforcée','Strong')}</div><div class="d">${L('1 fichier / 20 min','1 file / 20 min')}</div></div>
      </div>
      <ul class="sset-points">
        <li>${L('Un fichier n\u2019est créé que si ton scénario a changé depuis le dernier','A file is only created if your screenplay changed since the last one')}</li>
        <li>${L('Aucun fichier si le Coffre-fort ou Google Drive est actif : c\u2019est déjà sauvegardé ailleurs','No file if the Vault or Google Drive is active: it is already saved elsewhere')}</li>
        <li>${L('Réglage valable pour tous tes scénarios','Applies to all your screenplays')}</li>
      </ul>
      <div class="sset-status"><span class="sset-dot"></span><span>${L('Dernière sauvegarde : ','Last backup: ')}${getLastBackupAt() ? esc(timeAgo(getLastBackupAt())) : L('aucune pour l\u2019instant','none yet')}</span></div>
    </div>
    </div>
    <button class="btn btn-primary" data-act="saveSettings" style="margin-top:4px;">${L('Enregistrer les paramètres','Save settings')}</button>
  </div>`;
}

/* =====================================================================
   POLICE DU SCÉNARIO
   Un réglage par projet (settings.scriptFont), appliqué via la variable CSS
   --script-font posée sur <html> : la feuille, la mesure de pagination, la
   zone d'impression et les cartons « machine » la lisent toutes. Changer de
   police ne touche pas au texte, seulement à son habillage ; la pagination
   est refaite aussitôt (et à nouveau quand la police est réellement chargée).
===================================================================== */
const SCRIPT_FONTS = [
  {id:'courier-prime', label:'Courier Prime', family:"'Courier Prime','Courier New',monospace"},
  {id:'courier-new',   label:'Courier New',   family:"'Courier New',Courier,monospace"},
  {id:'special-elite', label:'Special Elite (vintage)', family:"'Special Elite','Courier New',monospace"},
  {id:'times',         label:'Times New Roman', family:"'Times New Roman',Tinos,Times,serif"},
  {id:'arial',         label:'Arial', family:"Arial,Arimo,Helvetica,sans-serif"}
];
function scriptFontOf(p){
  const id = p && p.settings && p.settings.scriptFont;
  return SCRIPT_FONTS.find(f => f.id === id) || SCRIPT_FONTS[0];
}
function applyScriptFont(p){
  document.documentElement.style.setProperty('--script-font', scriptFontOf(p).family);
}
function scriptFontSelectHtml(cls){
  const cur = scriptFontOf(S.project).id;
  return `<select class="${cls}" data-scriptfont="1" title="${L('Police du scénario','Screenplay font')}">${
    SCRIPT_FONTS.map(f=>`<option value="${f.id}" ${f.id===cur?'selected':''}>${esc(f.label)}</option>`).join('')}</select>`;
}
function setScriptFont(id){
  const p = S.project; if(!p) return;
  const f = SCRIPT_FONTS.find(x => x.id === id) || SCRIPT_FONTS[0];
  ensureSettings(p).scriptFont = f.id;
  p.updatedAt = Date.now();
  applyScriptFont(p);
  document.querySelectorAll('[data-scriptfont]').forEach(s => { s.value = f.id; });
  repaginateNow();
  if(document.fonts && document.fonts.load){
    document.fonts.load('12pt ' + f.family.split(',')[0]).then(()=>repaginateNow()).catch(()=>{});
  }
  scheduleAutosave();
}
document.addEventListener('change', e=>{
  const t = e.target;
  if(t && t.dataset && t.dataset.scriptfont){ setScriptFont(t.value); t.blur(); closeMoreMenu(); }
});
function setFormat(_, e){ S.project.format = e.target.closest('[data-fmt]').dataset.fmt; renderTabBody(); scheduleAutosave(); }
function saveSettings(){
  const p = S.project;
  p.title = document.getElementById('setTitle').value.trim() || p.title;
  p.author = document.getElementById('setAuthor').value;
  p.kind = document.getElementById('setKind').value;   // '' = rien sur la page de titre
  p.contact = document.getElementById('setContact').value;
  p.version = document.getElementById('setVersion').value;
  p.date = document.getElementById('setDate').value;
  p.settings.titlePageEnabled = document.getElementById('setTitlePage').checked;
  p.settings.showSceneNumbers = document.getElementById('setSceneNum').checked;
  p.settings.numberStart = parseInt(document.getElementById('setNumStart').value,10) || 1;
  const nowLocked = document.getElementById('setNumLock').checked;
  if(nowLocked && !p.settings.numbersLocked) lockCurrentSceneNumbers();
  else if(!nowLocked && p.settings.numbersLocked) unlockSceneNumbers();
  p.settings.numbersLocked = nowLocked;
  p.settings.showPageNumbers = document.getElementById('setPageNum').checked;
  p.settings.numberFirstPage = document.getElementById('setPageNumFirst').checked;
  p.settings.showContinued = document.getElementById('setContinued').checked;
  p.settings.autoContd = document.getElementById('setAutoContd').checked;
  const contdMarkEl = document.getElementById('setContdMark');
  p.settings.contdMark = contdMarkEl ? contdMarkEl.value : 'auto';
  const psv = parseInt(document.getElementById('setPageStart').value,10);
  p.settings.pageNumberStart = isNaN(psv) ? 1 : Math.max(0, psv);   // 0 permis : la page 2 porte alors le n° 1
  const lsEl = document.getElementById('setLineSpacing');
  if(lsEl){ p.settings.lineSpacing = lsEl.value === 'comfort' ? 'comfort' : 'standard'; applyLineSpacing(p); }
  const wmEl = document.getElementById('setWatermark');
  p.settings.watermarkText = wmEl ? wmEl.value.trim() : '';
  if(p.seriesId){
    const snEl = document.getElementById('setSeriesName');
    const ssEl = document.getElementById('setSeason');
    const seEl = document.getElementById('setEpisode');
    const snaEl = document.getElementById('setSeasonName');
    const newSeriesName = (snEl ? snEl.value.trim() : '') || p.seriesName;
    p.season = Math.max(1, parseInt(ssEl && ssEl.value, 10) || 1);
    p.episode = Math.max(1, parseInt(seEl && seEl.value, 10) || 1);
    p.seasonName = snaEl ? snaEl.value.trim() : (p.seasonName||'');
    if(newSeriesName !== p.seriesName){
      // Le nom de la série est partagé par tous les épisodes : on le
      // répercute sur les autres entrées de l'index et leurs projets.
      p.seriesName = newSeriesName;
      seriesEntries(p.seriesId).forEach(async entry=>{
        if(entry.id === p.id) return;
        entry.seriesName = newSeriesName;
        const full = await storGet(proj_key(entry.id));
        if(full){ full.seriesName = newSeriesName; await storSet(proj_key(entry.id), full); }
      });
    }
    // Le nom de saison est partagé par tous les épisodes de la même saison :
    // on le répercute de la même façon, une fois cet épisode sauvegardé.
    applySeasonName(p.seriesId, p.season, p.seasonName).then(saveIndex);
  }
  scheduleAutosave();
  toast(L('Paramètres enregistrés.','Settings saved.'));
  renderTabBody();
}

/* =====================================================================
   SHORTCUTS MODAL
===================================================================== */
function openShortcuts(){
  /* [libellé court, [touches], note longue facultative] — chaque champ
     texte est un tuple [fr, en] choisi par L() au rendu. */
  const groups = [
    [['Écrire & structurer','Write & structure'], [
      [['Entrée','Enter'], ['Entrée'], ['Enchaîne sur le type suivant logique : Scène→Action, Personnage→Dialogue, Dialogue→Personnage… Accepte aussi la suggestion de complétion si elle est affichée.','Moves to the logical next type: Scene→Action, Character→Dialogue, Dialogue→Character… Also accepts the completion suggestion if one is shown.']],
      [['Passer en Personnage','Switch to Character'], ['Tab'], ['Depuis Action, Scène, Transition, Plan ou Texte. Accepte la suggestion si un nom de personnage ou un lieu est proposé en cours de frappe.','From Action, Scene, Transition, Shot or Text. Accepts the suggestion if a character name or location is offered while typing.']],
      [['Revenir en Action','Go back to Action'], ['Maj','Tab'], ['Depuis Personnage, Parenthétique ou Dialogue.','From Character, Parenthetical or Dialogue.']],
      [['Forcer le type de la ligne','Force the line type'], ['Ctrl/Cmd','1..9'], ['Scène, Action, Personnage, Parenthétique, Dialogue, Transition, Plan, Texte, Note.','Scene, Action, Character, Parenthetical, Dialogue, Transition, Shot, Text, Note.']],
      [['Fusionner avec la ligne du dessus','Merge with the line above'], ['Retour arrière'], ['Quand le curseur est au tout début de la ligne.','When the cursor is at the very start of the line.']],
      [['Dialogue simultané','Simultaneous dialogue'], ['Ctrl/Cmd','Maj','D'], ['Curseur dans le DEUXIÈME bloc de dialogue : il monte à côté du précédent, les deux répliques se jouant en même temps. Même raccourci pour revenir en arrière.','Cursor in the SECOND dialogue block: it moves up next to the previous one, both lines playing at the same time. Same shortcut to undo it.']],
      [['Déplacer le curseur entre les lignes','Move the cursor between lines'], ['↑','↓'], ['','']],
      [['Remettre la ligne en Texte','Set the line back to Text'], ['Ctrl/Cmd','0'], ['Comme Ctrl+1..9 : certains navigateurs réservent ces combinaisons (changement d\u2019onglet) et le raccourci peut alors ne pas répondre.','Like Ctrl+1..9: some browsers reserve these combinations (tab switching), and the shortcut may then not respond.']],
      [['Fusionner avec la ligne du dessous','Merge with the line below'], ['Suppr'], ['Quand le curseur est tout à la fin de la ligne.','When the cursor is at the very end of the line.']],
      [['Retour à la ligne dans un carton','New line inside a title card'], ['Maj','Entrée'], ['Un carton peut tenir sur plusieurs lignes.','A title card can span several lines.']],
      [['Choisir dans le menu des extensions','Choose in the extensions menu'], ['↑','↓'], ['Extensions de personnage : (V.O.), (O.S.), (CONT\u2019D)… Entrée ou Tab pour valider, Échap pour fermer le menu.','Character extensions: (V.O.), (O.S.), (CONT\u2019D)… Enter or Tab to confirm, Esc to close the menu.']],
      [['Effacer un passage sur plusieurs lignes','Delete a passage across several lines'], ['Retour arrière'], ['Suppr fait la même chose. Entrée remplace le passage par un saut de ligne.','Delete does the same. Enter replaces the passage with a line break.']],
      [['Copier la sélection','Copy the selection'], ['Ctrl/Cmd','C'], ['Marche aussi sur une sélection de plusieurs lignes ou sur tout le scénario.','Also works on a selection spanning several lines or the whole screenplay.']],
      [['Couper la sélection','Cut the selection'], ['Ctrl/Cmd','X'], ['','']],
    ]],
    [['Naviguer & chercher','Navigate & search'], [
      [['Tout trouver (scènes, personnages, actions, réglages)','Find anything (scenes, characters, actions, settings)'], ['Ctrl/Cmd','K'], ['Tape quelques lettres : une scène, un personnage, « pdf », « sombre », « numéro de page »… Entrée pour y aller ou le faire. Sans rien taper : tes actions récentes puis toutes les scènes. Marche aussi depuis l\u2019accueil et dans la barre « Rechercher… ».','Type a few letters: a scene, a character, “pdf”, “dark”, “page number”… Enter to go there or do it. With nothing typed: your recent actions, then every scene. Also works from the home page and in the “Search…” bar.']],
      [['Rechercher','Search'], ['Ctrl/Cmd','F'], ['','']],
      [['Mode Focus','Focus mode'], ['Ctrl/Cmd','Maj','F'], ['Estompe tout le texte sauf la ligne où est le curseur, pour écrire sans distraction.','Dims all the text except the line the cursor is on, for distraction-free writing.']],
      [['Lire la scène à voix haute','Read the scene aloud'], ['Ctrl/Cmd','Maj','L'], ['Lit la scène où se trouve le curseur (entêtes, actions, personnages, répliques) avec une voix différente par personnage, façon Table Read de WriterDuet, pratique pour repérer les lourdeurs de dialogue à l\u2019oreille.','Reads the scene the cursor is in (headings, actions, characters, lines) with a different voice per character, like WriterDuet\u2019s Table Read, handy for catching clunky dialogue by ear.']],
      [['Dicter dans la ligne en cours','Dictate into the current line'], ['Ctrl/Cmd','Maj','V'], ['Ouvre le micro et transcrit ce qui est dit dans la ligne éditée, comme si c\u2019était tapé. Reclique pour arrêter. Nécessite un navigateur compatible (Chrome, Edge…).','Opens the microphone and transcribes what\u2019s said into the line being edited, as if typed. Click again to stop. Needs a supporting browser (Chrome, Edge…).']],
      [['Rechercher &amp; remplacer','Find &amp; replace'], ['Ctrl/Cmd','H'], ['Dans tout le scénario, annulable d\u2019un seul Ctrl+Z.','Across the whole screenplay, undoable with a single Ctrl+Z.']],
      [['Aller à une page','Go to a page'], ['Ctrl/Cmd','G'], ['','']],
      [['Tout sélectionner sur la page en cours','Select all on the current page'], ['Ctrl/Cmd','A'], ['Pratique pour copier le texte d\u2019une page entière.','Handy for copying the text of a whole page.']],
      [['Résultat de recherche suivant','Next search result'], ['Entrée'], ['Dans le champ de recherche.','In the search field.']],
      [['Résultat de recherche précédent','Previous search result'], ['Maj','Entrée'], ['Dans le champ de recherche.','In the search field.']],
      [['Choisir dans la liste des scènes','Choose in the scene list'], ['↑','↓'], ['Dans la fenêtre « Aller à une scène » (Ctrl+K). Entrée pour sauter dans la scène, Échap pour fermer.','In the \u201cGo to a scene\u201d window (Ctrl+K). Enter to jump into the scene, Esc to close.']],
      [['Lancer le remplacement partout','Run replace everywhere'], ['Entrée'], ['Dans le champ de remplacement de la fenêtre Rechercher &amp; remplacer.','In the replacement field of the Find &amp; replace window.']],
      [['Synonymes','Synonyms'], ['Ctrl/Cmd','Maj','Y'], ['Ouvre ou ferme le panneau des synonymes.','Opens or closes the synonyms panel.']],
    ]],
    [['Historique & sauvegarde','History & backup'], [
      [['Annuler la dernière action','Undo the last action'], ['Ctrl/Cmd','Z'], ['','']],
      [['Rétablir','Redo'], ['Ctrl/Cmd','Maj','Z'], ['','']],
      [['Sauvegarder maintenant','Save now'], ['Ctrl/Cmd','S'], ['La sauvegarde automatique tourne déjà en continu.','Autosave is already running continuously.']],
    ]],
    [['Annoter','Annotate'], [
      [['Commentaire sur la ligne en cours','Comment on the current line'], ['Ctrl/Cmd','Maj','M'], ['Repère 💬 discret dans la marge, n\u2019apparaît jamais dans les exports.','Discreet 💬 marker in the margin, never appears in exports.']],
      [['Révisions colorées','Colour revisions'], ['Ctrl/Cmd','Alt','R'], ['Ouvre ou ferme la fenêtre des révisions : couleur, historique, papier coloré, marques dans les exports.','Opens or closes the revisions window: colour, history, coloured paper, marks in the exports.']],
      [['Marquer / démarquer la ligne en cours','Mark / unmark the current line'], ['Ctrl/Cmd','Alt','M'], ['Ajoute ou retire à la main l\u2019astérisque de révision de la ligne où se trouve le curseur.','Adds or removes the revision asterisk of the line the cursor is on, by hand.']],
    ]],
    [['Cartes','Cards'], [
      [['Déplacer la carte sélectionnée','Move the selected card'], ['Alt','←','→','↑','↓'], ['Sur la carte active, dans l\u2019onglet Cartes.','On the active card, in the Cards tab.']],
      [['Ouvrir la scène de la carte','Open the card\u2019s scene'], ['Entrée'], ['Sur la carte active.','On the active card.']],
    ]],
    [['Page de titre','Title page'], [
      [['Gras','Bold'], ['Ctrl/Cmd','B'], ['Dans le scénario et dans les champs de la page de titre.','In the screenplay and in the title page fields.']],
      [['Italique','Italic'], ['Ctrl/Cmd','I'], ['Dans les champs de la page de titre.','In the title page fields.']],
      [['Souligné','Underline'], ['Ctrl/Cmd','U'], ['Dans les champs de la page de titre.','In the title page fields.']],
      [['Valider le titre ou l\u2019auteur','Confirm the title or the author'], ['Entrée'], ['','']],
    ]],
    [['Fenêtres & outils','Windows & tools'], [
      [['Valider une boîte de dialogue','Confirm a dialog box'], ['Entrée'], ['Tab fait passer d\u2019un champ ou d\u2019un bouton à l\u2019autre.','Tab moves from one field or button to the next.']],
      [['Fermer ou annuler','Close or cancel'], ['Échap'], ['Boîtes de dialogue, liste des scènes, révisions, synonymes, menus, aperçu d\u2019une image, éditeur de dessin, plein écran de la page de titre.','Dialog boxes, scene list, revisions, synonyms, menus, image preview, drawing editor, title page full screen.']],
      [['Annuler le dernier trait','Undo the last stroke'], ['Ctrl/Cmd','Z'], ['Dans l\u2019éditeur de dessin du storyboard.','In the storyboard drawing editor.']],
      [['Diagnostic de pagination','Pagination diagnostics'], ['Ctrl','Alt','D'], ['Affiche pourquoi un bloc ne tient pas sur une page, reste solidaire d\u2019un autre ou verrouille la page. Même raccourci pour le masquer.','Shows why a block doesn\u2019t fit on a page, stays together with another, or locks the page. Same shortcut to hide it.']],
    ]],
  ];
  const keysHtml = keys => keys.map(k=>`<span class="kbd">${k}</span>`)
    .join('<span class="sc-plus">+</span>');
  const body = groups.map(([title, rows])=>`
    <div class="sc-group">
      <div class="sc-group-title">${L(title[0],title[1])}</div>
      ${rows.map(r=>`<div class="sc-row">
        <div class="sc-keys">${keysHtml(r[1])}</div>
        <div class="sc-desc">${L(r[0][0],r[0][1])}${r[2][0]?`<span class="sc-note">${L(r[2][0],r[2][1])}</span>`:''}</div>
      </div>`).join('')}
    </div>`).join('');
  const html = `<div class="modal-backdrop" id="shortcutsBackdrop" data-act="closeShortcutsBg">
    <div class="modal sc-modal" data-stop="1">
      <h2>${L('Raccourcis clavier','Keyboard shortcuts')}</h2>
      <p class="sc-intro">${L('Classés par moment d\u2019usage. Sur Mac, remplace Ctrl par Cmd.','Grouped by when you\u2019d use them. On Mac, replace Ctrl with Cmd.')}</p>
      ${body}
      <div class="modal-actions"><button class="btn btn-primary" data-act="closeShortcuts">${L('Fermer','Close')}</button></div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}
function closeShortcuts(){ const b=document.getElementById('shortcutsBackdrop'); if(b) b.remove(); }

/* =====================================================================
   COMMENTAIRES DE LIGNE
   -----------------------------------------------------------------
   Fonctionnalité empruntée à WriterDuet (et absente de Raging Page jusqu'ici) :
   attacher une remarque à une ligne précise du script — repère visuel
   discret dans la marge, jamais dans le texte, jamais dans les exports
   (PDF/TXT/Fountain), exactement comme les commentaires en marge d'un
   traitement de texte collaboratif. Stockés à part (S.project.comments,
   indexé par id de ligne), donc totalement invisibles à tout le code
   existant qui ne lit que el.text. */
function commentsMap(){
  if(!S.project.comments) S.project.comments = {};
  return S.project.comments;
}
function openCommentEditor(id){
  const el = findEl(id); if(!el) return;
  const current = commentsMap()[id] || '';
  const html = `<div class="modal-backdrop" id="commentBackdrop" data-act="closeCommentEditor">
    <div class="modal" style="max-width:420px;" data-stop="1">
      <h2>${L('Commentaire','Comment')}</h2>
      <p style="font-size:13.5px;color:var(--ink-soft);margin:-8px 0 14px;">${L('Visible uniquement dans l\u2019éditeur (petit repère 💬 dans la marge), n\u2019apparaîtra jamais dans les exports.','Visible only in the editor (a small 💬 marker in the margin), will never appear in exports.')}</p>
      <div class="field"><textarea id="commentText" rows="4" placeholder="${L('Écris ta remarque ici…','Write your note here…')}">${esc(current)}</textarea></div>
      <div class="modal-actions">
        ${current ? `<button class="btn btn-danger" data-act="deleteCommentEditor" data-id="${id}">${L('Supprimer','Delete')}</button>` : ''}
        <button class="btn btn-ghost" data-act="closeCommentEditor">${L('Annuler','Cancel')}</button>
        <button class="btn btn-primary" data-act="saveCommentEditor" data-id="${id}">${L('Enregistrer','Save')}</button>
      </div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  const ta = document.getElementById('commentText');
  if(ta){ ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length; }
}
function closeCommentEditor(){ const b=document.getElementById('commentBackdrop'); if(b) b.remove(); }
function refreshCommentMarker(id){
  const div = document.querySelector('#page [data-id="'+id+'"]');
  if(!div) return;
  const text = commentsMap()[id];
  if(text){ div.dataset.comment='1'; div.title = L('Commentaire : ','Comment: ') + text; }
  else { delete div.dataset.comment; div.removeAttribute('title'); }
}
function saveCommentEditor(id){
  const ta = document.getElementById('commentText');
  const text = ta ? ta.value.trim() : '';
  const map = commentsMap();
  if(text) map[id] = text; else delete map[id];
  closeCommentEditor();
  refreshCommentMarker(id);
  scheduleAutosave();
}
function deleteCommentEditor(id){
  delete commentsMap()[id];
  closeCommentEditor();
  refreshCommentMarker(id);
  scheduleAutosave();
}

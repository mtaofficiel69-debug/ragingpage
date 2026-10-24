/* =====================================================================
   PALETTE DE COMMANDES — « tout trouver » en tapant quelques lettres
   ---------------------------------------------------------------------
   Deux portes d'entrée, rien de caché, rien à régler :
     1. la barre « Rechercher… » du haut : en tapant, une liste s'ouvre
        dessous. Sa première ligne reste la recherche dans le texte
        (Entrée / Maj+Entrée font exactement comme avant) ; ↑ ↓ permettent
        de choisir une scène, un personnage, une action, un réglage ;
     2. Ctrl+K (Cmd+K sur Mac) : l'ancien « Aller à une scène » devient la
        palette complète. Sans rien taper : tes actions récentes puis toutes
        les scènes, comme avant. Marche aussi sur l'accueil (scénarios).
   Chaque action dit où elle se trouve d'habitude et montre son raccourci :
   on apprend le site en s'en servant. Les réglages ouvrent la bonne page
   des Paramètres et entourent le réglage. Accents, majuscules et petites
   fautes de frappe sont ignorés ; les mots français et anglais marchent
   dans les deux langues. Rien n'est calculé tant que la palette est fermée.
===================================================================== */
const CP_MAC = /Mac|iPhone|iPad/.test(navigator.platform || '');
const CP_RECENT_KEY = 'scriptmm_cp_recent';
const cpMod = () => CP_MAC ? '⌘' : 'Ctrl';
const cpShift = () => CP_MAC ? '⇧' : L('Maj', 'Shift');
const cpAlt = () => CP_MAC ? '⌥' : 'Alt';

function cpNorm(s){
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, ' ').trim();
}
/* Distance d'édition bornée (fautes de frappe : une lettre en trop, en moins, changée ou inversée). */
function cpTypo(a, b, max){
  if(Math.abs(a.length - b.length) > max) return max + 1;
  const d = []; for(let i = 0; i <= a.length; i++){ d[i] = [i]; }
  for(let j = 1; j <= b.length; j++) d[0][j] = j;
  for(let i = 1; i <= a.length; i++){
    let rowMin = Infinity;
    for(let j = 1; j <= b.length; j++){
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if(i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      if(d[i][j] < rowMin) rowMin = d[i][j];
    }
    if(rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}
/* Note d'un élément pour une recherche : 0 = ne correspond pas. Tous les mots tapés doivent se retrouver. */
function cpScore(q, label, other, kw){
  const qn = cpNorm(q); if(!qn) return 1;
  const ln = cpNorm(label), on = cpNorm(other), kn = cpNorm(kw);
  if(ln === qn) return 120;
  if(ln.indexOf(qn) === 0) return 110;
  const all = (ln + ' ' + on + ' ' + kn).split(' ').filter(Boolean);
  let total = 0;
  for(const w of qn.split(' ')){
    let best = 0;
    if((' ' + ln).indexOf(' ' + w) >= 0) best = 95;
    else if((' ' + on).indexOf(' ' + w) >= 0) best = 75;
    else if((' ' + kn).indexOf(' ' + w) >= 0) best = 70;
    else if(w.length >= 5 && ln.indexOf(w) >= 0) best = 62;
    else if(w.length >= 5 && (on.indexOf(w) >= 0 || kn.indexOf(w) >= 0)) best = 55;
    else if(w.length >= 5){
      const max = w.length >= 8 ? 2 : 1;
      for(const t of all){ if(t.length >= 3 && (cpTypo(w, t, max) <= max || (t.length > w.length && cpTypo(w, t.slice(0, w.length), max) <= max))){ best = 40; break; } }
    }
    if(!best) return 0;
    total += best;
  }
  return total / qn.split(' ').length;
}

/* ---------------- Catalogue des actions ----------------
   t : [fr, en] · k : mots-clés (les deux langues) · w : où elle se trouve d'habitude · keys : raccourci
   st : état actuel (true / false) · line : agit sur la ligne en cours (le curseur est remis en place avant)
   ed : a besoin de l'éditeur · home : proposée sur l'accueil · show : visible seulement si vrai */
const CP_W = {
  top: ['Barre du haut', 'Top bar'], exp: ['Bouton Exporter', 'Export button'], rail: ['Colonne de gauche', 'Left sidebar'],
  mW: ['Menu ⋮ › Écriture', 'Menu ⋮ › Writing'], mA: ['Menu ⋮ › Analyse', 'Menu ⋮ › Insights'], mV: ['Menu ⋮ › Affichage', 'Menu ⋮ › View'],
  mVo: ['Menu ⋮ › Voix', 'Menu ⋮ › Voice'], mG: ['Menu ⋮ › Général', 'Menu ⋮ › General'], rep: ['Colonne › Rapports', 'Sidebar › Reports'],
  sB: ['Paramètres › Sauvegarde', 'Settings › Backup'], key: ['Clavier', 'Keyboard'], line: ['Ligne en cours', 'Current line'], home: ['Accueil', 'Home']
};
function cpActions(){
  const A = ACTIONS, M = cpMod(), Sh = cpShift(), Al = cpAlt();
  const ed = S.view === 'editor' && !!S.project;
  const drv = typeof gdConnected === 'function' && gdConnected();
  const linked = drv && S.project && typeof gdLinkState === 'function' && gdLinkState(S.project.id) === true;
  const tab = (id, ic, fr, en, k) => ({ id:'tab:' + id, ic, t:[fr, en], k:'onglet tab ' + k, w:CP_W.rail, run:() => switchTab(id), tabId:id });
  const list = [
    // Barre du haut
    { id:'insertScene', ic:'scene', t:['Nouvelle scène', 'New scene'], k:'scene entete ajouter inserer heading add insert int ext', w:CP_W.top, ed:true, line:true, run:() => insertScene() },
    { id:'insertCard', ic:'card', t:['Insérer un carton', 'Insert a title card'], k:'carton titre gros texte card title', w:CP_W.top, ed:true, line:true, run:() => insertCard() },
    { id:'openLayout', ic:'align', t:['Aligner la ligne (alignement, retraits)', 'Align the line (alignment, indents)'], k:'aligner centrer retrait align center indent', w:CP_W.top, ed:true, line:true, run:() => openLayout() },
    { id:'doUndo', ic:'undo', t:['Annuler', 'Undo'], k:'annuler retour undo', w:CP_W.top, keys:[M, 'Z'], ed:true, run:() => doUndo() },
    { id:'doRedo', ic:'redo', t:['Rétablir', 'Redo'], k:'retablir refaire redo', w:CP_W.top, keys:[M, Sh, 'Z'], ed:true, run:() => doRedo() },
    { id:'goHome', ic:'home', t:['Retour au portfolio (accueil)', 'Back to portfolio (home)'], k:'accueil portfolio home quitter liste scenarios', w:CP_W.top, run:() => goHome() },
    { id:'goToPage', ic:'flag', t:['Aller à une page…', 'Go to a page…'], k:'page aller numero go', w:['Indicateur « Page x / y »', '“Page x / y” indicator'], keys:[M, 'G'], ed:true, run:() => goToPage() },
    { id:'manualSave', ic:'save', t:['Sauvegarder maintenant', 'Save now'], k:'sauvegarder enregistrer save', w:CP_W.key, keys:[M, 'S'], run:() => manualSave() },
    { id:'toggleRail', ic:railClosed() ? 'railshow' : 'railhide', t:railClosed() ? ['Afficher la colonne de gauche', 'Show the left sidebar'] : ['Masquer la colonne de gauche', 'Hide the left sidebar'], k:'colonne gauche masquer afficher replier sidebar hide show plein ecran', w:CP_W.rail, run:() => toggleRail() },
    // Exporter
    { id:'openExportMenu', ic:'export', t:['Exporter…', 'Export…'], k:'exporter export telecharger download', w:CP_W.exp, run:() => openExportMenu() },
    { id:'exportPDF', ic:'pdf', t:['Exporter en PDF', 'Export as PDF'], k:'pdf exporter export telecharger', w:CP_W.exp, run:() => exportPDF() },
    { id:'printScript', ic:'printer', t:['Imprimer / aperçu PDF du navigateur', 'Print / browser PDF preview'], k:'imprimer impression print pdf apercu', w:CP_W.exp, run:() => printScript() },
    { id:'exportFDX', ic:'film', t:['Exporter en Final Draft (.fdx)', 'Export as Final Draft (.fdx)'], k:'final draft fdx exporter export', w:CP_W.exp, run:() => exportFDX() },
    { id:'exportFountain', ic:'drop', t:['Exporter en Fountain', 'Export as Fountain'], k:'fountain exporter export', w:CP_W.exp, run:() => exportFountain() },
    { id:'exportTXT', ic:'filetext', t:['Exporter en texte (.txt)', 'Export as text (.txt)'], k:'texte txt exporter export text', w:CP_W.exp, run:() => exportTXT() },
    { id:'wdOpenSides', ic:'user', t:['Sides pour un acteur (PDF de ses scènes)', 'Actor sides (PDF of their scenes)'], k:'sides acteur comedien casting pdf actor', w:CP_W.exp, run:() => A.wdOpenSides() },
    { id:'exportBackup', ic:'save', t:['Sauvegarde complète (.smmproj)', 'Full backup (.smmproj)'], k:'sauvegarde backup smmproj fichier copie', w:CP_W.exp, run:() => exportBackup() },
    // Menu ⋮ › Écriture
    { id:'toggleDual', ic:'dual', t:['Dialogue simultané', 'Simultaneous dialogue'], k:'simultane dual dialogue double colonne', w:CP_W.mW, keys:[M, Sh, 'D'], ed:true, line:true, run:() => toggleDual() },
    { id:'openFreePageMenu', ic:'nonum', t:['Insérer une page sans numéro', 'Insert an unnumbered page'], k:'page sans numero dedicace citation synopsis intercalaire blanche unnumbered', w:CP_W.mW, ed:true, line:true, run:() => openFreePageMenu() },
    { id:'pgiToggle', ic:'image', t:['Images sur les pages', 'Images on pages'], k:'image images photo illustration rogner recadrer agrandir crop picture', w:CP_W.mW, ed:true, run:() => pgiToggle() },
    { id:'openReplace', ic:'findrep', t:['Rechercher / remplacer', 'Find / replace'], k:'remplacer rechercher replace find', w:CP_W.mW, keys:[M, 'H'], ed:true, run:() => openReplace() },
    { id:'openSynonyms', ic:'bubbles', t:['Synonymes', 'Synonyms'], k:'synonyme mot thesaurus synonym', w:CP_W.mW, keys:[M, Sh, 'Y'], ed:true, line:true, run:() => A.openSynonyms() },
    { id:'wdOpenRename', ic:'cursor', t:['Renommer partout…', 'Rename everywhere…'], k:'renommer personnage nom rename character', w:CP_W.mW, ed:true, run:() => A.wdOpenRename() },
    { id:'wdOpenVariants', ic:'copy', t:['Variantes de noms…', 'Name variants…'], k:'variantes noms orthographe variants names spelling', w:CP_W.mW, ed:true, run:() => A.wdOpenVariants() },
    { id:'openRevisions', ic:'asterisk', t:['Révisions colorées', 'Colour revisions'], k:'revisions couleur verrouiller pages revision color lock', w:CP_W.mW, keys:[M, Al, 'R'], ed:true, run:() => A.openRevisions() },
    { id:'toggleRevMark', ic:'flag', t:['Marquer / démarquer la ligne', 'Mark / unmark the line'], k:'marquer asterisque revision ligne mark', w:CP_W.mW, keys:[M, Al, 'M'], ed:true, line:true, run:() => A.toggleRevMark() },
    { id:'openComment', ic:'note', t:['Commentaire sur la ligne', 'Comment on the line'], k:'commentaire note annoter comment', w:CP_W.line, keys:[M, Sh, 'M'], ed:true, line:true, run:() => { const id = cpLineId(); if(id) openCommentEditor(id); } },
    { id:'rpMusicOpen', ic:'speaker', t:['Musique sur la ligne…', 'Music on the line…'], k:'musique youtube son chanson music song', w:CP_W.mW, keys:[M, Al, 'Y'], ed:true, line:true, run:() => A.rpMusicOpen && A.rpMusicOpen() },
    // Analyse
    { id:'wdOpenOrphans', ic:'emptypage', t:['Pages presque vides…', 'Nearly-empty pages…'], k:'pages vides orphelines empty pages', w:CP_W.mA, ed:true, run:() => A.wdOpenOrphans() },
    { id:'wdOpenSession', ic:'pulse', t:['Ma session d’écriture…', 'My writing session…'], k:'session ecriture progression changements writing session', w:CP_W.mA, ed:true, run:() => A.wdOpenSession() },
    // Affichage
    { id:'toggleTheme', ic:isDarkTheme() ? 'sun' : 'moon', t:['Mode sombre', 'Dark mode'], k:'sombre nuit theme clair dark light night', w:CP_W.mV, st:() => isDarkTheme(), home:true, run:() => toggleTheme() },
    { id:'toggleNav', ic:'sidebar', t:['Liste des scènes (panneau de droite)', 'Scene list (right panel)'], k:'scenes navigateur panneau droite navigator', w:CP_W.mV, st:() => !!S.navOpen, ed:true, run:() => toggleNav() },
    { id:'toggleFocusMode', ic:'focus', t:['Mode Focus', 'Focus mode'], k:'focus concentration estomper distraction', w:CP_W.mV, keys:[M, Sh, 'F'], st:() => !!S.focusMode, ed:true, line:true, run:() => toggleFocusMode() },
    { id:'toggleTypewriterMode', ic:'typeT', t:['Mode machine à écrire', 'Typewriter mode'], k:'machine a ecrire centre curseur typewriter', w:CP_W.mV, st:() => !!S.typewriterMode, ed:true, line:true, run:() => toggleTypewriterMode() },
    { id:'sbPlay', ic:'frames', t:['Storyboard : lecture auto des plans', 'Storyboard: auto play the shots'], k:'storyboard lecture lire diaporama animatique plans defiler play slideshow', w:CP_W.rail, run:() => { switchTab('storyboard'); setTimeout(() => { const b = document.querySelector('[data-sb="play"]'); if(b && !b.disabled) b.click(); }, 120); } },
    // Voix
    { id:'speakScene', ic:'speaker', t:['Lire la scène à voix haute', 'Read the scene aloud'], k:'lire voix haute lecture read aloud speak table read', w:CP_W.mVo, keys:[M, Sh, 'L'], ed:true, line:true, run:() => speakScene() },
    { id:'toggleDictation', ic:'mic', t:['Dicter dans la ligne', 'Dictate into the line'], k:'dicter dictee micro voix dictate microphone', w:CP_W.mVo, keys:[M, Sh, 'V'], ed:true, line:true, run:() => toggleDictation() },
    // Général
    { id:'openCreateModal', ic:'newdoc', t:['Nouveau scénario', 'New screenplay'], k:'nouveau creer projet new create', w:CP_W.mG, home:true, run:() => openCreateModal() },
    { id:'triggerImport', ic:'upload', t:['Importer un scénario (.fdx, .fountain, .txt, .pdf)', 'Import a screenplay (.fdx, .fountain, .txt, .pdf)'], k:'importer ouvrir fichier import open file', w:CP_W.home, home:true, only:'home', run:() => triggerImport() },
    { id:'openSampleModal', ic:'book', t:['Scénario d’exemple', 'Example screenplay'], k:'exemple modele sample example apprendre', w:CP_W.home, home:true, only:'home', run:() => openSampleModal() },
    { id:'openShortcuts', ic:'keyboard', t:['Raccourcis clavier', 'Keyboard shortcuts'], k:'raccourcis clavier shortcuts keyboard aide', w:CP_W.mG, run:() => A.openShortcuts() },
    { id:'openHelp', ic:'read', t:['Aide', 'Help'], k:'aide comment faire help how', w:CP_W.home, home:true, run:() => openHelp() },
    { id:'setLang', ic:'swap', t:getLang() === 'en' ? ['Passer en français', 'Switch to French'] : ['Passer en anglais', 'Switch to English'], k:'langue anglais francais english french language', w:CP_W.top, home:true, run:() => setLang(getLang() === 'en' ? 'fr' : 'en') },
    // Google Drive / coffre
    { id:'gdConnect', ic:'cloud', t:['Se connecter à Google Drive', 'Sign in to Google Drive'], k:'google drive connecter cloud sauvegarde', w:CP_W.sB, show:!drv, run:() => gdConnect() },
    { id:'gdPushNow', ic:'cloud', t:['Envoyer ce scénario sur Google Drive', 'Send this screenplay to Google Drive'], k:'google drive envoyer cloud send', w:CP_W.sB, show:drv, run:() => gdPushNow() },
    { id:'gdLinkToggle', ic:'cloud', t:linked ? ['Ne plus envoyer ce scénario sur Drive', 'Stop sending this screenplay to Drive'] : ['Relier ce scénario à mon Drive', 'Link this screenplay to my Drive'], k:'google drive relier lien link', w:CP_W.sB, show:drv && ed, run:() => A.gdLinkToggle() },
    { id:'gdPull', ic:'cloud', t:['Récupérer depuis Google Drive', 'Retrieve from Google Drive'], k:'google drive recuperer telecharger retrieve pull', w:CP_W.sB, show:drv && ed, run:() => gdPull() },
    { id:'gdDisconnect', ic:'cloud', t:['Se déconnecter de Google Drive', 'Disconnect from Google Drive'], k:'google drive deconnecter disconnect', w:CP_W.sB, show:drv, run:() => gdDisconnect() },
    { id:'vaultAttach', ic:'save', t:['Coffre-fort : lier un fichier de l’ordinateur', 'Vault: link a file on my computer'], k:'coffre fort fichier disque ordinateur vault file', w:CP_W.sB, run:() => vaultAttach() },
    // Rapports prêts à l'emploi
    { id:'rep:night', ic:'search', t:['Rapport : scènes de nuit', 'Report: night scenes'], k:'nuit rapport night report', w:CP_W.rep, ed:true, run:() => cpReport('night') },
    { id:'rep:notes', ic:'search', t:['Rapport : toutes les notes', 'Report: all notes'], k:'notes rapport report', w:CP_W.rep, ed:true, run:() => cpReport('notes') },
    { id:'rep:shots', ic:'search', t:['Rapport : tous les plans', 'Report: all shots'], k:'plans rapport shots report', w:CP_W.rep, ed:true, run:() => cpReport('shots') },
    { id:'rep:transitions', ic:'search', t:['Rapport : toutes les transitions', 'Report: all transitions'], k:'transitions rapport report', w:CP_W.rep, ed:true, run:() => cpReport('transitions') },
    // Onglets de la colonne
    tab('editor', 'doc', 'Éditeur', 'Editor', 'editeur ecrire editor write'),
    tab('cards', 'grid', 'Cartes', 'Cards', 'cartes fiches cards'),
    tab('structure', 'layers', 'Structure', 'Structure', 'structure actes beats'),
    tab('outline', 'list', 'Outline', 'Outline', 'outline sequencier plan resume'),
    Object.assign(tab('storyboard', 'frames', 'Storyboard', 'Storyboard', 'storyboard plans dessins images vignettes shots drawings'), { keys:[M, Al, 'B'] }),
    tab('guide', 'book', 'Aide à l’écriture', 'Writing help', 'aide ecriture conseils guide writing help'),
    tab('characters', 'users', 'Personnages', 'Characters', 'personnages roles characters'),
    tab('tags', 'tag', 'Tags', 'Tags', 'tags etiquettes'),
    tab('notes', 'note', 'Notes', 'Notes', 'notes personnelles idees'),
    tab('titlepage', 'palette', 'Page de titre', 'Title page', 'page de titre couverture title page cover'),
    tab('reports', 'search', 'Rapports', 'Reports', 'rapports reports'),
    tab('stats', 'chart', 'Statistiques', 'Statistics', 'statistiques chiffres mots stats'),
    tab('history', 'clock', 'Historique (versions)', 'History (versions)', 'historique versions comparer history compare'),
    tab('graveyard', 'trash', 'Corbeille', 'Graveyard', 'corbeille scenes supprimees graveyard trash'),
    tab('settings', 'gear', 'Paramètres', 'Settings', 'parametres reglages settings options')
  ];
  return list.filter(a => a.show !== false && (S.view === 'editor' ? a.only !== 'home' : a.home));
}
/* Réglages : ouvrent Paramètres à la bonne section, font défiler jusqu'au réglage et l'entourent. */
function cpSettings(){
  const st = (S.project && S.project.settings) || {};
  const set = (id, fr, en, k, sec, sel, stf) => ({ id:'set:' + id, ic:'gear', t:[fr, en], k:k, w:sec === 'projet' ? ['Paramètres › Projet', 'Settings › Project'] : sec === 'page' ? ['Paramètres › Mise en page', 'Settings › Layout'] : CP_W.sB, st:stf, setting:{ sec, sel } });
  return [
    set('title', 'Titre du scénario', 'Screenplay title', 'titre nom title name', 'projet', '#setTitle'),
    set('titlepage', 'Inclure une page de titre', 'Include a title page', 'page de titre export title page', 'projet', '#setTitlePage', () => !!st.titlePageEnabled),
    set('author', 'Auteur', 'Author', 'auteur nom author writer', 'projet', '#setAuthor'),
    set('contact', 'Contact (page de titre)', 'Contact (title page)', 'contact email telephone', 'projet', '#setContact'),
    set('font', 'Police du scénario', 'Screenplay font', 'police caractere courier typo font typeface', 'page', '.sset-group[data-g="page"] select[data-scriptfont]'),
    set('scenenum', 'Afficher les numéros de scène', 'Show scene numbers', 'numeros scene numerotation scene numbers', 'page', '#setSceneNum', () => !!st.showSceneNumbers),
    set('numlock', 'Verrouiller les numéros de scène', 'Lock scene numbers', 'verrouiller numeros 12a lock numbers', 'page', '#setNumLock', () => !!st.numbersLocked),
    set('pagenum', 'Afficher les numéros de page', 'Show page numbers', 'numeros de page numero page pagination page numbers', 'page', '#setPageNum', () => !!st.showPageNumbers),
    set('pagefirst', 'Numéro sur la première page', 'Number on the first page', 'premiere page numero first page number', 'page', '#setPageNumFirst', () => !!st.numberFirstPage),
    set('pagestart', 'Numéro de la première page du scénario', 'Number of the first script page', 'commencer numero page start', 'page', '#setPageStart'),
    set('continued', 'Mention « CONTINUITÉ » entre deux pages', '“CONTINUED” mark between pages', 'continuite continued suite', 'page', '#setContinued', () => !!st.showContinued),
    set('contd', 'Mention (SUITE) / (CONT’D) des personnages', 'Character (CONT’D) mark', 'suite contd personnage reprend parole', 'page', '#setAutoContd', () => !!st.autoContd),
    set('watermark', 'Filigrane du PDF et de l’impression', 'PDF and print watermark', 'filigrane confidentiel watermark pdf impression', 'page', '#setWatermark'),
    set('backup', 'Sauvegarde automatique (fréquence)', 'Automatic backup (frequency)', 'sauvegarde automatique frequence fichier backup', 'backup', '[data-act="setBackupLevel"]'),
    set('drive', 'Google Drive', 'Google Drive', 'google drive cloud', 'backup', '[data-act="gdConnect"], [data-act="gdPushNow"]'),
    set('vault', 'Coffre-fort (fichier sur l’ordinateur)', 'Vault (file on my computer)', 'coffre fort fichier vault', 'backup', '[data-act="vaultAttach"]')
  ];
}
function cpReport(kind){ switchTab('reports'); setTimeout(() => { try{ reportPreset(kind); }catch(e){} }, 0); }
function cpLineId(){ return (CP.saved && CP.saved.id) || lastFocusedLineId || null; }

/* ---------------- Données du scénario (calculées à l'ouverture seulement) ---------------- */
function cpIndex(){
  if(S.view !== 'editor' || !S.project) return { scenes:[], chars:[], notes:[] };
  const els = S.project.elements, numbers = sceneNumbers(), pageOf = (S.pagination && S.pagination.pageOf) || {};
  const scenes = [], chars = new Map(), notes = [];
  let cur = null;
  for(const el of els){
    if(el.type === 'scene'){ cur = { id:el.id, n:numbers[el.id] || '', t:el.text || L('(scène sans titre)', '(untitled scene)'), p:pageOf[el.id] || '' }; scenes.push(cur); }
    else if(el.type === 'character'){
      const nm = characterBaseName(el.text); if(!nm) continue;
      let c = chars.get(nm); if(!c){ c = { name:nm, n:0, first:el.id, scene:cur }; chars.set(nm, c); }
      c.n++;
    } else if(el.type === 'note' && (el.text || '').trim()) notes.push({ id:el.id, t:el.text, scene:cur });
  }
  return { scenes, chars:[...chars.values()].sort((a, b) => b.n - a.n), notes };
}
function cpTextCount(q){
  const qn = cpNorm(q); if(qn.length < 2 || !S.project) return 0;
  let n = 0; for(const el of S.project.elements){ if(el.type !== 'note' && cpNorm(el.text).indexOf(qn) >= 0) n++; }
  return n;
}

/* ---------------- Recherche ---------------- */
function cpRecent(){ try{ return JSON.parse(localStorage.getItem(CP_RECENT_KEY) || '[]'); }catch(e){ return []; } }
function cpRemember(id){ try{ const r = cpRecent().filter(x => x !== id); r.unshift(id); localStorage.setItem(CP_RECENT_KEY, JSON.stringify(r.slice(0, 8))); }catch(e){} }
/* Renvoie les sections [{title, rows:[...]}]. text : ligne « dans le scénario » (true pour Ctrl+K, false pour la barre du haut). */
function cpSearch(q, opts){
  opts = opts || {};
  const lang = getLang() === 'en' ? 1 : 0, oth = 1 - lang;
  const qt = String(q || '').trim(), qn = cpNorm(qt);
  const secs = [];
  const acts = cpActions(), sets = S.view === 'editor' ? cpSettings() : [];
  const ix = CP.ix || (CP.ix = cpIndex());
  const asRow = (a, sc) => ({ kind:'act', item:a, score:sc, label:a.t[lang], where:a.w ? a.w[lang] : '', keys:a.keys, ic:a.ic, st:a.st ? a.st() : undefined });
  if(!qn){
    // Vide : actions récentes, puis (éditeur) toutes les scènes, (accueil) tous les scénarios.
    const byId = new Map(acts.concat(sets).map(a => [a.id, a]));
    const rec = cpRecent().map(id => byId.get(id)).filter(Boolean).slice(0, 4);
    if(rec.length) secs.push({ title:L('Récemment utilisé', 'Recently used'), rows:rec.map(a => asRow(a, 0)) });
    if(S.view === 'editor') secs.push({ title:L('Scènes', 'Scenes'), rows:ix.scenes.map(s => ({ kind:'scene', s })) });
    else secs.push({ title:L('Scénarios', 'Screenplays'), rows:cpProjects('') });
    return secs;
  }
  // Raccourcis directs : « 12 » = scène 12, « p 45 » = page 45.
  if(S.view === 'editor'){
    const pm = /^(?:p|p\.|pg|page)\s*(\d{1,4})$/i.exec(qt);
    const direct = [];
    if(pm){ const n = +pm[1], tot = (S.pagination && S.pagination.count) || 1; if(n >= 1 && n <= tot) direct.push({ kind:'page', n }); }
    const sm = /^(?:sc(?:ene|ène)?\.?\s*)?(\d{1,4}[a-z]{0,2})$/i.exec(qt);
    if(sm){ const s = ix.scenes.find(x => String(x.n).toLowerCase() === sm[1].toLowerCase()); if(s) direct.push({ kind:'scene', s }); }
    if(direct.length) secs.push({ title:L('Aller à', 'Go to'), rows:direct, rank:1e9 });
  }
  // Personnages (éditeur)
  let topChar = null;
  if(S.view === 'editor' && qn.length >= 2){
    const cs = ix.chars.map(c => ({ c, sc:cpScore(qt, c.name, '', '') })).filter(x => x.sc >= 70).sort((a, b) => b.sc - a.sc).slice(0, 3);
    if(cs.length){ secs.push({ title:L('Personnages', 'Characters'), rows:cs.map(x => ({ kind:'char', c:x.c })), rank:cs[0].sc + 3 }); if(cs[0].sc >= 95 || cs.length === 1) topChar = cs[0].c; }
  }
  // Actions (+ celles du personnage trouvé)
  const rec = cpRecent();
  let ar = acts.map(a => { let sc = cpScore(qt, a.t[lang], a.t[oth], a.k); if(sc && rec.indexOf(a.id) >= 0) sc += 6 - rec.indexOf(a.id) * 0.5; return { a, sc }; }).filter(x => x.sc > 0).sort((x, y) => y.sc - x.sc).slice(0, 7).map(x => asRow(x.a, x.sc));
  if(topChar){
    const nm = topChar.name, disp = nm.charAt(0) + nm.slice(1).toLowerCase();
    ar = [
      { kind:'act', ic:'cursor', label:L('Aller à la 1re réplique de ', 'Go to the first line of ') + disp, where:topChar.scene ? L('scène ', 'scene ') + topChar.scene.n : '', item:{ id:'char:first', ed:true, run:() => cpJumpTo(topChar.first) } },
      { kind:'act', ic:'user', label:L('Sides de ', 'Sides for ') + disp + L(' (ses scènes en PDF)', ' (their scenes as PDF)'), where:CP_W.exp[lang], item:{ id:'char:sides', ed:true, run:() => cpSidesFor(nm) } },
      { kind:'act', ic:'cursor', label:L('Renommer ', 'Rename ') + disp + L(' partout…', ' everywhere…'), where:CP_W.mW[lang], item:{ id:'char:rename', ed:true, run:() => ACTIONS.wdOpenRename(nm) } }
    ].concat(ar.slice(0, 4));
  }
  if(ar.length) secs.push({ title:L('Actions', 'Actions'), rows:ar, rank:topChar ? secs[secs.length - 1].rank - 1 : ar[0].score });
  // Réglages
  const sr = sets.map(a => ({ a, sc:cpScore(qt, a.t[lang], a.t[oth], a.k) })).filter(x => x.sc > 0).sort((x, y) => y.sc - x.sc).slice(0, 4).map(x => asRow(x.a, x.sc));
  if(sr.length) secs.push({ title:L('Réglages', 'Settings'), rows:sr, rank:sr[0].score - 20 });
  // Scènes
  if(S.view === 'editor'){
    const sc = ix.scenes.map(s => ({ s, sc:cpScore(qt, s.t, '', '') })).filter(x => x.sc >= 60);
    if(sc.length){ const rows = sc.slice(0, 6).map(x => ({ kind:'scene', s:x.s })); if(sc.length > 6) rows.push({ kind:'more', n:sc.length - 6, q:qt }); secs.push({ title:L('Scènes', 'Scenes'), rows, rank:Math.max.apply(null, sc.map(x => x.sc)) - 2 }); }
    const nt = ix.notes.filter(n => cpNorm(n.t).indexOf(qn) >= 0).slice(0, 3);
    if(nt.length) secs.push({ title:L('Notes', 'Notes'), rows:nt.map(n => ({ kind:'note', n })), rank:1 });
    if(opts.text !== false && qn.length >= 2){ const n = cpTextCount(qt); secs.push({ title:L('Dans le scénario', 'In the screenplay'), rows:[{ kind:'text', q:qt, n }], rank:-1 }); }
    secs.sort((a, b) => (b.rank || 0) - (a.rank || 0));     // la section la plus pertinente d'abord
  } else {
    const pr = cpProjects(qt); if(pr.length) secs.unshift({ title:L('Scénarios', 'Screenplays'), rows:pr });
  }
  return secs;
}
function cpProjects(q){
  const list = (S.projectsIndex || []).map(p => ({ p, sc:q ? cpScore(q, p.title || '', p.seriesName || '', p.kind || '') : 1 })).filter(x => x.sc > 0);
  if(q) list.sort((a, b) => b.sc - a.sc); else list.sort((a, b) => (b.p.updatedAt || 0) - (a.p.updatedAt || 0));
  return list.slice(0, q ? 8 : 12).map(x => ({ kind:'proj', p:x.p }));
}

/* ---------------- Affichage d'une liste ---------------- */
function cpHl(text, q){
  const t = String(text || ''), qn = cpNorm(q); if(!qn) return esc(t);
  const plain = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const w0 = qn.split(' ')[0], ws = plain.search(new RegExp('(^|[^a-z0-9])' + w0.replace(/[^a-z0-9]/g, '')));
  const i = ws >= 0 ? ws + (/[a-z0-9]/.test(plain[ws]) ? 0 : 1) : plain.indexOf(w0);   // de préférence au début d'un mot
  if(i < 0 || plain.length !== t.length) return esc(t);
  const n = qn.split(' ')[0].length;
  return esc(t.slice(0, i)) + '<b>' + esc(t.slice(i, i + n)) + '</b>' + esc(t.slice(i + n));
}
function cpKbd(keys){ return keys && keys.length ? '<span class="cp-kbd">' + keys.map(k => '<span>' + esc(k) + '</span>').join('') + '</span>' : ''; }
function cpRowHtml(r, q, idx){
  const a = 'class="cp-row" role="option" id="cpOpt' + idx + '" data-cpi="' + idx + '"';
  if(r.kind === 'act'){
    const st = r.st === undefined ? '' : '<span class="cp-st' + (r.st ? ' on' : '') + '">' + (r.st ? L('activé', 'on') : L('désactivé', 'off')) + '</span>';
    return '<div ' + a + '>' + icon(r.ic || 'more') + '<span class="cp-lab">' + cpHl(r.label, q) + '</span>' + st + (r.where ? '<span class="cp-where">' + esc(r.where) + '</span>' : '') + cpKbd(r.keys) + '</div>';
  }
  if(r.kind === 'scene') return '<div ' + a + '><span class="cp-num">' + esc(r.s.n) + '</span><span class="cp-lab">' + cpHl(r.s.t, q) + '</span>' + (r.s.p ? '<span class="cp-where">' + L('p.', 'p.') + esc(pageLbl(r.s.p)) + '</span>' : '') + '</div>';
  if(r.kind === 'page') return '<div ' + a + '>' + icon('flag') + '<span class="cp-lab">' + L('Aller à la page ', 'Go to page ') + r.n + '</span><span class="cp-where">' + L('sur ', 'of ') + ((S.pagination && S.pagination.count) || 1) + '</span></div>';
  if(r.kind === 'char'){
    const c = r.c, disp = c.name;
    return '<div ' + a + '>' + icon('user') + '<span class="cp-lab">' + cpHl(disp, q) + '<span class="cp-sub">' + c.n + ' ' + L(c.n > 1 ? 'répliques' : 'réplique', c.n > 1 ? 'lines' : 'line') + (c.scene ? ' · ' + L('1re apparition scène ', 'first appears in scene ') + esc(c.scene.n) : '') + '</span></span><span class="cp-where">' + esc(CP_W.rail[getLang() === 'en' ? 1 : 0] + ' › ' + L('Personnages', 'Characters')) + '</span></div>';
  }
  if(r.kind === 'note') return '<div ' + a + '>' + icon('note') + '<span class="cp-lab">' + cpHl(r.n.t.slice(0, 120), q) + (r.n.scene ? '<span class="cp-sub">' + L('scène ', 'scene ') + esc(r.n.scene.n) + '</span>' : '') + '</span></div>';
  if(r.kind === 'text') return '<div ' + a + '>' + icon('findrep') + '<span class="cp-lab">' + L('« ', '“') + esc(r.q) + L(' » — ', '” — ') + (r.n ? r.n + ' ' + L(r.n > 1 ? 'lignes du scénario' : 'ligne du scénario', r.n > 1 ? 'lines in the screenplay' : 'line in the screenplay') : L('chercher dans le texte', 'search the text')) + '</span><span class="cp-where">' + L('Rechercher', 'Search') + '</span>' + cpKbd([cpMod(), 'F']) + '</div>';
  if(r.kind === 'search') return '<div ' + a + '>' + icon('findrep') + '<span class="cp-lab">' + L('« ', '“') + esc(r.q) + L(' » — ', '” — ') + (r.n ? r.n + ' ' + L(r.n > 1 ? 'résultats dans le texte' : 'résultat dans le texte', r.n > 1 ? 'results in the text' : 'result in the text') : L('aucun résultat dans le texte', 'no result in the text')) + '</span>' + (r.n ? cpKbd([L('Entrée', 'Enter')]) + '<span class="cp-where">' + L('suivant', 'next') + '</span>' : '') + '</div>';
  if(r.kind === 'more') return '<div ' + a + '><span class="cp-num"></span><span class="cp-lab cp-soft">+ ' + r.n + ' ' + L(r.n > 1 ? 'autres scènes' : 'autre scène', r.n > 1 ? 'more scenes' : 'more scene') + '</span></div>';
  if(r.kind === 'proj'){
    const p = r.p, sub = p.seriesName ? esc(p.seriesName) + (p.season ? ' · S' + p.season : '') + (p.episode ? 'E' + p.episode : '') : esc(kindOptionLabel(p.kind || ''));
    return '<div ' + a + '>' + icon('doc') + '<span class="cp-lab">' + cpHl(p.title || L('Sans titre', 'Untitled'), q) + '<span class="cp-sub">' + sub + '</span></span><span class="cp-where">' + esc(timeAgo(p.updatedAt || Date.now())) + '</span></div>';
  }
  return '';
}
function cpListHtml(secs, q){
  const rows = []; let html = '';
  secs.forEach(s => {
    if(!s.rows.length) return;
    html += '<div class="cp-sec" role="presentation">' + esc(s.title) + '</div>';
    s.rows.forEach(r => { html += cpRowHtml(r, q, rows.length); rows.push(r); });
  });
  if(!rows.length) html = '<div class="cp-empty">' + L('Rien trouvé. Essaie un autre mot : une scène, un personnage, « pdf », « sombre », « numéro de page »…', 'Nothing found. Try another word: a scene, a character, “pdf”, “dark”, “page number”…') + '</div>';
  return { html, rows };
}

/* ---------------- Exécution ---------------- */
const CP = { el:null, rows:[], sel:0, saved:null, ix:null, drop:null, dropRows:[], dropSel:0, dropHidden:false, t:null };
function cpSaveSelection(){
  const line = typeof focusedLine === 'function' ? focusedLine() : null;
  if(!line){ CP.saved = lastFocusedLineId ? { id:lastFocusedLineId } : null; return; }
  const sel = window.getSelection();
  CP.saved = { id:line.dataset.id, range: sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null };
}
function cpRestoreSelection(){
  const s = CP.saved; if(!s || S.view !== 'editor' || S.tab !== 'editor') return;
  const d = document.querySelector('#page [data-id="' + s.id + '"]'); if(!d) return;
  try{
    d.focus({ preventScroll:true });
    if(s.range && d.contains(s.range.startContainer)){ const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(s.range); }
  }catch(e){}
}
function cpJumpTo(id){
  if(S.tab !== 'editor') switchTab('editor');
  setTimeout(() => { try{ jumpToScene(id); }catch(e){} }, S.tab === 'editor' ? 0 : 60);
}
function cpSidesFor(nm){
  ACTIONS.wdOpenSides();
  try{ const e = WD.sd && WD.sd.list && WD.sd.list.find(x => x.key === nm || x.key.indexOf(nm) === 0); if(e){ WD.sd.key = e.key; wdSdDraw(); } }catch(e){}
}
function cpOpenSetting(st){
  let tries = 0;
  const go = () => {
    const el0 = document.querySelector(st.sel);
    if(!el0 || S.tab !== 'settings'){ if(++tries < 40) setTimeout(go, 40); return; }   // la page Paramètres peut s'afficher un peu plus tard
    try{ setSettingsSection(null, { target:document.querySelector('[data-sec="' + st.sec + '"]') }); }catch(e){}
    const el = document.querySelector(st.sel); if(!el) return;
    const box = el.closest('.sset-row') || el.closest('.field') || el.closest('.panel-block') || el;
    box.scrollIntoView({ block:'center' });
    box.classList.add('cp-glow'); setTimeout(() => box.classList.remove('cp-glow'), 2600);
    if(/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && el.type !== 'checkbox') try{ el.focus({ preventScroll:true }); }catch(e){}
  };
  if(S.tab !== 'settings'){ switchTab('settings'); setTimeout(go, 30); } else go();
}
function cpRun(r){
  if(!r) return;
  if(r.kind === 'more'){ cpOpen(r.q, true); return; }
  if(r.kind === 'search') return;                          // géré par la barre du haut (Entrée = résultat suivant)
  cpClose(false);
  if(r.kind === 'proj'){ openProject(r.p.id); return; }
  if(r.kind === 'scene'){ cpJumpTo(r.s.id); return; }
  if(r.kind === 'note'){ cpJumpTo(r.n.id); return; }
  if(r.kind === 'page'){ if(S.tab !== 'editor') switchTab('editor'); setTimeout(() => scrollToPage(r.n), 40); return; }
  if(r.kind === 'char'){ switchTab('characters'); setTimeout(() => { try{ showCharDetail(r.c.name); }catch(e){} }, 30); return; }
  if(r.kind === 'text'){
    if(S.tab !== 'editor') switchTab('editor');
    setTimeout(() => { const si = document.getElementById('searchInput'); if(si){ si.value = r.q; CP.dropHidden = true; si.focus(); } try{ runSearch(r.q); }catch(e){} }, 40);
    return;
  }
  const a = r.item; if(!a) return;
  if(a.id && !/^char:/.test(a.id)) cpRemember(a.id);
  if(a.setting){ cpOpenSetting(a.setting); return; }
  const exec = () => { if(a.line) cpRestoreSelection(); try{ a.run(); }catch(e){ if(window.console) console.warn('[palette]', e); } };
  if(a.ed && S.view === 'editor' && S.tab !== 'editor' && !a.tabId){ switchTab('editor'); setTimeout(exec, 60); }
  else exec();
}

/* ---------------- La fenêtre Ctrl+K ---------------- */
function cpOpen(q, keepSaved){
  if(!S.project && S.view === 'editor') return;
  if(!keepSaved) cpSaveSelection();
  CP.ix = null;
  closeMoreMenu && closeMoreMenu();
  cpDropHide();
  let bd = document.getElementById('cpBackdrop');
  if(!bd){
    const ph = S.view === 'editor' ? L('Chercher une scène, un personnage, une action, un réglage…', 'Search a scene, a character, an action, a setting…') : L('Chercher un scénario ou une action…', 'Search a screenplay or an action…');
    document.body.insertAdjacentHTML('beforeend', `<div class="cp-backdrop" id="cpBackdrop"><div class="cp-modal" role="dialog" aria-modal="true" aria-label="${L('Palette de commandes', 'Command palette')}">
      <div class="cp-in">${icon('search')}<input type="text" id="cpInput" autocomplete="off" spellcheck="false" placeholder="${ph}" role="combobox" aria-expanded="true" aria-controls="cpList" aria-autocomplete="list">${cpKbd([L('Échap', 'Esc')])}</div>
      <div class="cp-list" id="cpList" role="listbox"></div>
      <div class="cp-foot"><span>${cpKbd(['↑', '↓'])}${L('choisir', 'select')}</span><span>${cpKbd([L('Entrée', 'Enter')])}${L('valider', 'run')}</span><span>${cpKbd([L('Échap', 'Esc')])}${L('fermer', 'close')}</span><span class="cp-foot-r">${cpMod()}+K</span></div>
    </div></div>`);
    bd = document.getElementById('cpBackdrop');
    bd.addEventListener('mousedown', e => { if(e.target === bd){ e.preventDefault(); cpClose(true); } });
    const list = document.getElementById('cpList');
    list.addEventListener('mousedown', e => e.preventDefault());           // le champ garde le focus
    list.addEventListener('click', e => { const row = e.target.closest('[data-cpi]'); if(row) cpRun(CP.rows[+row.dataset.cpi]); });
    list.addEventListener('mousemove', e => { const row = e.target.closest('[data-cpi]'); if(row && +row.dataset.cpi !== CP.sel){ CP.sel = +row.dataset.cpi; cpPaintSel(list, CP.sel, 'cpInput'); } });
    const inp = document.getElementById('cpInput');
    inp.addEventListener('input', () => { clearTimeout(CP.t); CP.t = setTimeout(() => { CP.t = null; cpRender(); }, 60); });
    inp.addEventListener('keydown', cpKey);
  }
  const inp = document.getElementById('cpInput');
  inp.value = q || '';
  cpRender();
  inp.focus(); inp.select();
}
function cpRender(){
  const inp = document.getElementById('cpInput'), list = document.getElementById('cpList'); if(!inp || !list) return;
  const q = inp.value;
  const out = cpListHtml(cpSearch(q, { text:true }), q);
  CP.rows = out.rows; CP.sel = 0;
  list.innerHTML = out.html; list.scrollTop = 0;
  cpPaintSel(list, 0, 'cpInput');
}
function cpPaintSel(list, i, inputId){
  list.querySelectorAll('.cp-row.sel').forEach(r => r.classList.remove('sel'));
  const row = list.querySelector('[data-cpi="' + i + '"]');
  const inp = document.getElementById(inputId);
  if(row){ row.classList.add('sel'); row.scrollIntoView({ block:'nearest' }); if(inp) inp.setAttribute('aria-activedescendant', row.id); }
}
function cpKey(e){
  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    e.preventDefault(); if(!CP.rows.length) return;
    if(CP.t){ clearTimeout(CP.t); CP.t = null; cpRender(); }       // la liste suit toujours ce qui est tapé
    CP.sel = (CP.sel + (e.key === 'ArrowDown' ? 1 : -1) + CP.rows.length) % CP.rows.length;
    cpPaintSel(document.getElementById('cpList'), CP.sel, 'cpInput');
  } else if(e.key === 'Enter'){ e.preventDefault(); if(e.repeat) return; if(CP.t){ clearTimeout(CP.t); CP.t = null; cpRender(); } cpRun(CP.rows[CP.sel]); }
  else if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); cpClose(true); }
  else if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); e.stopPropagation(); cpClose(true); }
}
function cpClose(restore){
  clearTimeout(CP.t); CP.t = null;
  const bd = document.getElementById('cpBackdrop'); if(bd) bd.remove();
  CP.rows = []; CP.ix = null;
  if(restore) cpRestoreSelection();
}

/* Ctrl+K : partout (éditeur, autres onglets, accueil). Dans l'éditeur, l'ancien raccourci « Aller à une scène » ouvre la palette. */
const __cpOrigJump = openJumpScene;
openJumpScene = function(){ cpOpen(''); };
ACTIONS.openJumpScene = () => cpOpen('');
document.addEventListener('keydown', e => {
  if(!((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key && e.key.toLowerCase() === 'k')) return;
  if(document.getElementById('cpBackdrop')) return;                       // la fenêtre gère elle-même Ctrl+K (fermer)
  if(document.querySelector('.modal-backdrop, .mmd-backdrop')) return;     // une autre fenêtre est ouverte : on ne l'empile pas
  if(S.view === 'editor' && S.tab === 'editor') return;                   // onDocKeydown s'en charge (openJumpScene)
  if(S.view !== 'editor' && S.view !== 'home') return;
  e.preventDefault(); cpOpen('');
}, true);

/* ---------------- La barre « Rechercher… » du haut ---------------- */
function cpDropHide(){ if(CP.drop){ CP.drop.remove(); CP.drop = null; } CP.dropRows = []; const si = document.getElementById('searchInput'); if(si) si.setAttribute('aria-expanded', 'false'); }
function cpDropShow(){
  const si = document.getElementById('searchInput');
  if(!si || S.view !== 'editor' || document.activeElement !== si){ cpDropHide(); return; }
  const q = si.value;
  if(!q.trim() || CP.dropHidden){ cpDropHide(); return; }
  if(!CP.ixFresh){ CP.ix = null; CP.ixFresh = true; }
  const n = (S.search && S.search.matches) ? S.search.matches.length : 0;
  const secs = [{ title:L('Dans le scénario', 'In the screenplay'), rows:[{ kind:'search', q:q.trim(), n }] }].concat(cpSearch(q, { text:false }).map(s => ({ title:s.title, rows:s.rows.slice(0, 4) })));
  const out = cpListHtml(secs, q);
  let d = CP.drop;
  if(!d){
    d = document.createElement('div'); d.className = 'cp-drop'; d.id = 'cpDrop'; d.setAttribute('role', 'listbox');
    d.addEventListener('mousedown', e => e.preventDefault());
    d.addEventListener('click', e => { const row = e.target.closest('[data-cpi]'); if(!row) return; const r = CP.dropRows[+row.dataset.cpi]; if(r && r.kind === 'search'){ try{ gotoMatch(1); }catch(err){} return; } cpSaveSelectionFromDrop(); cpRun(r); });
    d.addEventListener('mousemove', e => { const row = e.target.closest('[data-cpi]'); if(row && +row.dataset.cpi !== CP.dropSel){ CP.dropSel = +row.dataset.cpi; cpPaintSel(d, CP.dropSel, 'searchInput'); } });
    document.body.appendChild(d); CP.drop = d;
    si.setAttribute('role', 'combobox'); si.setAttribute('aria-controls', 'cpDrop');
  }
  d.innerHTML = out.html + '<div class="cp-drop-foot">' + L('Plus de choix : ', 'More options: ') + cpKbd([cpMod(), 'K']) + '</div>';
  CP.dropRows = out.rows; CP.dropSel = 0;
  cpDropPos();
  si.setAttribute('aria-expanded', 'true');
  cpPaintSel(d, 0, 'searchInput');
}
function cpDropPos(){
  const si = document.getElementById('searchInput'), d = CP.drop; if(!si || !d) return;
  const r = si.closest('.search-box').getBoundingClientRect(), w = Math.min(560, window.innerWidth - 24);
  d.style.width = w + 'px'; d.style.top = Math.round(r.bottom + 8) + 'px';
  d.style.left = Math.round(Math.max(12, Math.min(r.right - w, window.innerWidth - w - 12))) + 'px';
}
/* Avant d'agir depuis la barre du haut, la « ligne en cours » est celle d'avant le clic dans la barre. */
function cpSaveSelectionFromDrop(){ CP.saved = CP.lastLine ? { id:CP.lastLine } : (lastFocusedLineId ? { id:lastFocusedLineId } : null); }
document.addEventListener('focusin', e => {
  const t = e.target;
  if(t && t.id === 'searchInput'){ CP.lastLine = lastFocusedLineId; CP.dropHidden = false; CP.ixFresh = false; cpDropShow(); }
});
document.addEventListener('click', e => { if(e.target && e.target.id === 'searchInput' && !CP.drop){ CP.dropHidden = false; cpDropShow(); } });
document.addEventListener('focusout', e => { if(e.target && e.target.id === 'searchInput') setTimeout(() => { if(document.activeElement !== e.target) cpDropHide(); }, 0); });
document.addEventListener('input', e => {
  if(!e.target || e.target.id !== 'searchInput') return;
  CP.dropHidden = false;
  clearTimeout(CP.dt); CP.dt = setTimeout(() => { CP.dt = null; cpDropShow(); }, 50);   // après la recherche dans le texte (même événement), sans ralentir la frappe
});
document.addEventListener('keydown', e => {
  const si = e.target; if(!si || si.id !== 'searchInput' || !CP.drop) return;
  if(CP.dt && /^(ArrowDown|ArrowUp|Enter)$/.test(e.key)){ clearTimeout(CP.dt); CP.dt = null; cpDropShow(); if(!CP.drop) return; }
  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    e.preventDefault(); e.stopImmediatePropagation(); if(!CP.dropRows.length) return;
    CP.dropSel = (CP.dropSel + (e.key === 'ArrowDown' ? 1 : -1) + CP.dropRows.length) % CP.dropRows.length;
    cpPaintSel(CP.drop, CP.dropSel, 'searchInput');
  } else if(e.key === 'Enter'){
    const r = CP.dropRows[CP.dropSel];
    if(!r || r.kind === 'search'){ CP.dropHidden = true; cpDropHide(); return; }   // comme avant : résultat suivant / précédent
    e.preventDefault(); e.stopImmediatePropagation();
    cpSaveSelectionFromDrop(); cpDropHide(); cpRun(r);
  } else if(e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); CP.dropHidden = true; cpDropHide(); }
}, true);
window.addEventListener('resize', () => { if(CP.drop) cpDropPos(); });
/* Infobulle sur la barre de recherche (aucun changement visuel) : rappelle Ctrl+K. */
document.addEventListener('mouseover', e => {
  const b = e.target && e.target.closest && e.target.closest('.search-box');
  if(b && !b.dataset.cpTip){ b.dataset.cpTip = '1'; b.title = L('Rechercher dans le texte — et tout le reste : scènes, personnages, actions, réglages (', 'Search the text — and everything else: scenes, characters, actions, settings (') + cpMod() + '+K)'; }
});

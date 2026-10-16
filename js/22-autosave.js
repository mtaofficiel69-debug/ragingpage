/* =====================================================================
   SAUVEGARDE AUTOMATIQUE PÉRIODIQUE
   ---------------------------------------------------------------------
   Sans compte ni cloud, l'unique exemplaire d'un scénario en cours
   d'écriture vit dans ce navigateur. Toutes les AUTO_BACKUP_INTERVAL_MS
   d'écriture active — et juste avant de quitter l'onglet — Raging Page
   télécharge discrètement une sauvegarde .smmproj du scénario ouvert :
   le même fichier que "Exporter > Sauvegarde complète", en automatique.
   Ne se déclenche que s'il y a eu du changement depuis la dernière
   sauvegarde, pour ne jamais empiler des fichiers identiques. Réglage
   coupable à tout moment dans Paramètres.
===================================================================== */
/* Niveaux de protection : l'ancien réglage (un fichier toutes les 20 min)
   en faisait beaucoup trop. Par défaut : « discrète » (au plus un fichier
   toutes les 4 h d'écriture). Chacun peut monter, baisser ou couper. */
const AUTO_BACKUP_LEVELS = { low: 4*60*60*1000, normal: 60*60*1000, high: 20*60*1000 };
const AUTO_BACKUP_LEVEL_KEY = 'scriptmm_auto_backup_level';
const AUTO_BACKUP_INTERVAL_MS = AUTO_BACKUP_LEVELS.low;
function backupLevel(){
  try{
    const v = localStorage.getItem(AUTO_BACKUP_LEVEL_KEY);
    if(v === 'off' || AUTO_BACKUP_LEVELS[v]) return v;
    if(localStorage.getItem(AUTO_BACKUP_PREF_KEY) === '0') return 'off'; // ancien réglage « désactivé » respecté
  }catch(e){}
  return 'low';
}
function setBackupLevel(_, e){
  const el = e && e.target && e.target.closest && e.target.closest('[data-lvl]');
  if(!el) return;
  const v = el.dataset.lvl;
  try{ localStorage.setItem(AUTO_BACKUP_LEVEL_KEY, v); localStorage.setItem(AUTO_BACKUP_PREF_KEY, v === 'off' ? '0' : '1'); }catch(err){}
  if(S.view==='editor' && S.tab==='settings') renderTabBody();
}
const LAST_BACKUP_KEY = 'scriptmm_last_backup_at';
const AUTO_BACKUP_PREF_KEY = 'scriptmm_auto_backup_enabled';
function getLastBackupAt(){
  try{ return parseInt(localStorage.getItem(LAST_BACKUP_KEY), 10) || 0; }catch(e){ return 0; }
}
function setLastBackupAt(ts){ try{ localStorage.setItem(LAST_BACKUP_KEY, String(ts)); }catch(e){} }
function isAutoBackupEnabled(){
  return backupLevel() !== 'off';
}
function setAutoBackupEnabled(on){ try{ localStorage.setItem(AUTO_BACKUP_LEVEL_KEY, on ? (backupLevel()==='off' ? 'low' : backupLevel()) : 'off'); localStorage.setItem(AUTO_BACKUP_PREF_KEY, on?'1':'0'); }catch(e){} }
function toggleAutoBackup(){
  setAutoBackupEnabled(!isAutoBackupEnabled());
  if(S.view==='editor' && S.tab==='settings') renderTabBody();
}
function dueForBackup(){
  if(!S.project || !isAutoBackupEnabled()) return false;
  const last = getLastBackupAt();
  if(Date.now() - last < (AUTO_BACKUP_LEVELS[backupLevel()] || AUTO_BACKUP_INTERVAL_MS)) return false;
  return (S.project.updatedAt||0) > last; // modifié depuis la dernière sauvegarde fichier
}
function downloadProjectBackup(p, silent){
  const payload = { app:'Raging Page', kind:'project-backup', version:1, savedAt:Date.now(), project:p };
  const name = (p.title||'scenario').replace(/[\\/:*?"<>|]/g,'-');
  downloadBlob(name + '.smmproj', JSON.stringify(payload), 'application/json');
  setLastBackupAt(Date.now());
  toast(silent ? (L('Sauvegarde automatique : ','Automatic backup: ')+name+L('.smmproj téléchargé.','.smmproj downloaded.')) : L('Sauvegarde enregistrée : garde ce fichier hors du navigateur.','Backup saved: keep this file outside the browser.'));
}
function runAutoBackupIfDue(){
  if(!dueForBackup()) return;
  flushAutosave();
  downloadProjectBackup(S.project, true);
}
function onVisibilityChangeAutoBackup(){
  if(document.hidden) runAutoBackupIfDue();
}
function exportBackup(){
  closeExportMenu();
  flushAutosave();
  downloadProjectBackup(S.project, false);
}
function importBackupFile(file){
  const reader = new FileReader();
  reader.onload = async ()=>{
    let data = null;
    try{ data = JSON.parse(String(reader.result)); }catch(e){ data = null; }
    const src = data && data.project ? data.project : null;
    if(!src || !Array.isArray(src.elements)){
      toast(L('Ce fichier n\u2019est pas une sauvegarde Raging Page.','This file isn\u2019t a Raging Page backup.'));
      return;
    }
    // On RESTAURE TOUJOURS SOUS UN NOUVEL IDENTIFIANT. Sans cela, restaurer
    // une vieille sauvegarde écraserait silencieusement la version en cours
    // du même projet — exactement l'accident qu'une sauvegarde doit éviter.
    // Le scénario restauré arrive donc à côté, jamais à la place.
    const p = JSON.parse(JSON.stringify(src));
    p.id = uid('proj');
    p.updatedAt = Date.now();
    // Un épisode restauré rejoint sa série si elle est encore là ; sinon il
    // redevient un scénario autonome plutôt qu'un épisode orphelin
    // rattaché à une série qui n'existe plus.
    if(p.seriesId && !S.projectsIndex.some(e=>e.seriesId===p.seriesId)){
      p.seriesId = null; p.season = null; p.episode = null;
    }
    ensureSettings(p); ensureTPDesign(p); ensureStructure(p);
    if(!p.sceneMeta) p.sceneMeta = {};
    if(!p.tagDefs) p.tagDefs = {};
    if(!Array.isArray(p.graveyard)) p.graveyard = [];
    if(!Array.isArray(p.versions)) p.versions = [];
    S.project = p;
    S.projectsIndex.push(indexEntryFor(p));
    await saveIndex(); await storSet(proj_key(p.id), p);
    S.view='editor'; S.tab='editor'; S.undoStack=[]; S.redoStack=[];
    render();
    toast(L('Sauvegarde restaurée : ouverte comme un nouveau scénario, l\u2019existant n\u2019a pas été touché.','Backup restored: opened as a new screenplay, the existing one was left untouched.'));
  };
  reader.readAsText(file);
}

function importTextFile(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    const lines = String(reader.result).split(/\r?\n/);
    const elements = [];
    let expectDialogue = false;
    lines.forEach(raw=>{
      const t = raw.trim();
      if(!t){ expectDialogue = false; return; }
      const c = classifyScreenplayLine(t, null, expectDialogue);
      const el = newElement(c.type, c.text);
      if(c.dual) el.dual = true;
      elements.push(el);
      expectDialogue = c.expect;
    });
    const title = file.name.replace(/\.(txt|fountain)$/i,'');
    finishImport(elements, title);
  };
  reader.readAsText(file);
}

/* ---------------------------------------------------------------------
   Import PDF.
   Le PDF n'a pas de notion de "ligne" ou de "paragraphe" : c'est un nuage
   de fragments de texte positionnés au point près. Extraire un scénario
   exploitable demande donc de reconstituer les lignes nous-mêmes à partir
   des coordonnées, puis de s'en servir comme indice de mise en forme
   (indentation) en plus du texte.

   AVERTISSEMENT HONNÊTE : cette extraction dépend de la bibliothèque
   pdf.js, chargée depuis un CDN au moment de l'import (elle n'est pas
   embarquée dans le fichier, sinon il aurait fallu multiplier sa taille
   par dix). Elle a été testée ici sur des données simulées reproduisant
   la structure que pdf.js renvoie, mais pas sur un vrai PDF de logiciel
   de scénario (Final Draft, Fade In, l'export PDF de Raging Page lui-même,
   etc.) faute de connexion internet pendant son écriture. Si un import
   donne un résultat manifestement faux, dites-moi lequel : la classification
   se corrige facilement une fois qu'on sait ce qui a été mal détecté.
--------------------------------------------------------------------- */

let __pdfjsLoading = null;
function loadPdfJs(){
  if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if(__pdfjsLoading) return __pdfjsLoading;
  const sources = [
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js'
  ];
  const workerFor = src => src.replace(/pdf\.min\.js$/, 'pdf.worker.min.js');
  __pdfjsLoading = (async ()=>{
    let lastErr = null;
    for(const src of sources){
      try{
        await new Promise((resolve, reject)=>{
          const s = document.createElement('script');
          s.src = src; s.onload = resolve; s.onerror = ()=>reject(new Error('échec de chargement: '+src));
          document.head.appendChild(s);
        });
        if(window.pdfjsLib){
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerFor(src);
          return window.pdfjsLib;
        }
      }catch(err){ lastErr = err; }
    }
    throw lastErr || new Error('pdf.js indisponible');
  })();
  return __pdfjsLoading;
}

/* Regroupe les fragments de texte d'une page en lignes, en se fiant à leur
   position verticale plutôt qu'à leur ordre d'apparition dans le flux PDF
   (qui ne suit pas toujours l'ordre de lecture). */
function pdfPageToLines(items){
  const rows = [];
  for(const it of items){
    const s = it.str;
    if(!s) continue;
    // Étoile de révision Final Draft (« * » seule, en marge droite) : ce n'est jamais du texte
    // joué. Laissée là, elle se retrouvait collée au bout de la ligne, puis au MILIEU du
    // paragraphe une fois les lignes recollées (« Mr * Glaisher »).
    if(/^\s*\*+\s*$/.test(s)) continue;
    const tr = it.transform;                    // [a,b,c,d,e,f] ; e,f = x,y
    const x = tr[4], y = tr[5];
    const h = it.height || Math.hypot(tr[2], tr[3]) || 10;
    const row = rows[rows.length - 1];
    if(row && Math.abs(row.y - y) <= Math.max(2, h * 0.4)){
      row.items.push({ x, s, w: it.width || 0 });
    } else {
      rows.push({ y, items:[{ x, s, w: it.width || 0 }] });
    }
  }
  // CORRECTIF. La passe ci-dessus ne compare qu'à la DERNIÈRE ligne en
  // cours : deux fragments à la même hauteur mais séparés dans le flux du
  // PDF (le cas le plus courant : le titre à gauche et le numéro de page à
  // droite d'un en-tête, souvent écrits à des moments différents du flux)
  // atterrissaient dans deux lignes distinctes. On les refusionne ici.
  for(let i = 0; i < rows.length; i++){
    if(!rows[i]) continue;
    for(let j = i + 1; j < rows.length; j++){
      if(!rows[j]) continue;
      const h = 10;
      if(Math.abs(rows[i].y - rows[j].y) <= Math.max(2, h * 0.4)){
        rows[i].items.push(...rows[j].items);
        rows[j] = null;
      }
    }
  }
  const merged = rows.filter(Boolean);
  merged.sort((a, b) => b.y - a.y);   // l'axe Y du PDF monte : le haut de page a le plus grand y
  return merged.map(r=>{
    r.items.sort((a, b) => a.x - b.x);
    let text = '', prevEnd = null;
    for(const it of r.items){
      if(prevEnd != null){
        const gap = it.x - prevEnd;
        if(gap > 2 && !/\s$/.test(text) && !/^\s/.test(it.s)) text += ' ';
      }
      text += it.s; prevEnd = it.x + it.w;
    }
    return { text: text.replace(/[ \t]+/g,' ').trim(), x: r.items[0].x, y: r.y };
  }).filter(l => l.text);
}

/* Regroupe les positions horizontales voisines (à quelques points près) et
   renvoie leurs centres, triés du moins indenté au plus indenté. */
function clusterIndents(xs){
  const sorted = xs.slice().sort((a, b) => a - b);
  const clusters = [];
  for(const x of sorted){
    const last = clusters[clusters.length - 1];
    if(last && x - last.max <= 6){ last.max = x; last.sum += x; last.n++; }
    else clusters.push({ max:x, sum:x, n:1 });
  }
  return clusters.map(c => c.sum / c.n);
}

/* Repère une éventuelle page de titre en tête du PDF — page 1 sans la
   moindre en-tête de scène, alors que le reste du document en contient —
   et en extrait au passage un auteur probable (« Un scénario de… »,
   « Écrit par… », « Written by… »). Une page de titre n'a rien à faire
   dans le corps du texte : mise en page libre, souvent des fragments
   décoratifs (filets, encadrés) qui n'ont pas de sens hors contexte et
   qui, mélangés aux vraies lignes du scénario, produisaient un texte qui
   semblait "désordonné". On ne retire la page que si on est sûr qu'elle
   n'est pas la scène d'ouverture elle-même (garde-fou : le reste du
   document doit contenir au moins une vraie scène). */
function stripTitlePage(pages){
  if(pages.length < 2) return { pages, titleInfo:null };
  const hasHeading = pl => pl.some(l=>{
    const m = l.text.match(/^\d+[A-Za-z]?\.?\s+(.+)$/);
    return isSceneHeading(l.text) || (m && isSceneHeading(m[1]));
  });
  if(hasHeading(pages[0])) return { pages, titleInfo:null };
  if(!pages.slice(1).some(hasHeading)) return { pages, titleInfo:null };

  // NB. On extrait volontairement l'auteur mais pas le titre : les pages
  // de titre mettent souvent le titre en forme avec des éléments décoratifs
  // (cadres, filets) dont le rendu texte est peu fiable selon la police —
  // testé sur un vrai PDF, ça produisait un titre dédoublé et truffé de
  // parasites. Le nom du fichier reste une base plus sûre pour le titre ;
  // l'utilisateur peut de toute façon le corriger dans les réglages du
  // projet. La détection de l'auteur, elle, s'appuie sur un motif de texte
  // précis et n'a pas ce problème.
  const lines = pages[0].map(l => l.text.trim()).filter(Boolean);
  const authorPattern = /^(un\s+sc[ée]nario\s+de|un\s+film\s+de|[ée]crit\s+par|written\s+by)\s*:?\s*(.*)$/i;
  let author = null;
  for(let i = 0; i < lines.length; i++){
    const m = lines[i].match(authorPattern);
    if(m){ author = (m[2] && m[2].trim()) || (lines[i+1] || '').trim() || null; break; }
  }
  return { pages: pages.slice(1), titleInfo: author ? { author } : null };
}

/* Transforme les pages déjà extraites (tableau de tableaux de {text,x,y})
   en une liste d'éléments de scénario. Séparé de l'extraction elle-même
   pour pouvoir être testé sans PDF réel. */
function pdfPagesToElements(pages){
  const titlePage = stripTitlePage(pages);
  pages = titlePage.pages;
  const norm = s => s.replace(/\d+/g,'#').replace(/\s+/g,' ').trim().toLowerCase();

  // CORRECTIF. Un en-tête/pied de page se reconnaît à sa position RELATIVE
  // À SA PROPRE PAGE (les toutes premières / toutes dernières lignes),
  // jamais à une fraction fixe de la hauteur : une scène commence parfois
  // à quelques points seulement de la marge du haut, trop près d'un seuil
  // fixe pour l'en distinguer de façon fiable. Un seuil fixe avait aussi
  // pour effet pervers de supprimer une réplique récurrente du CORPS du
  // texte (un running gag, par exemple) sous prétexte qu'elle revenait
  // souvent — la voilà maintenant protégée dès qu'elle n'est pas au tout
  // début ou à la toute fin d'une page.
  // CORRECTIF. Un en-tête/pied de page se reconnaît à l'écart vertical
  // INHABITUEL qui le sépare du corps du texte, jamais à un rang fixe
  // (« les 2 premières lignes ») : une scène commence parfois tout près de
  // la marge, et un rang fixe la happait par erreur. On cherche, dans le
  // premier tiers puis le dernier tiers de chaque page, le plus grand saut
  // vertical ; s'il dépasse nettement l'interligne habituel de la page,
  // tout ce qui est au-delà de ce saut (vers le bord) est candidat à la
  // détection de répétition ci-dessous — jamais supprimé sur ce seul
  // critère, seulement s'il revient sur plus de 4 pages sur 10.
  function markEdgeLines(pl){
    // CORRECTIF. Le repérage par saut vertical ci-dessous rate les pages denses, où l'en-tête
    // n'est pas nettement séparé du corps : il fuyait alors dans le texte (« The AERONAUTS Cut
    // Order - As of … 3 » en action). On marque donc aussi les 2 premières et 2 dernières lignes
    // de chaque page (_rim) ; elles ne sont supprimées que si leur texte REVIENT sur plus de 4
    // pages sur 10 (même règle de répétition que pour _edge), et seulement si assez long pour
    // être un titre courant et non un nom de personnage.
    const byY0 = pl.slice().sort((a, b) => b.y - a.y);
    byY0.slice(0, 2).concat(byY0.slice(-2)).forEach(l => { l._rim = true; });
    if(pl.length < 5) return;   // trop peu de lignes pour distinguer quoi que ce soit
    const byY = pl.slice().sort((a, b) => b.y - a.y);
    const gaps = [];
    for(let i = 0; i < byY.length - 1; i++) gaps.push(byY[i].y - byY[i+1].y);
    const sortedGaps = gaps.slice().sort((a, b) => a - b);
    const typical = sortedGaps[Math.floor(sortedGaps.length / 2)] || 14;
    const zone = Math.max(1, Math.floor(byY.length / 3));

    let cut = -1, cutGap = 0;
    for(let i = 0; i < zone; i++) if(gaps[i] > cutGap){ cutGap = gaps[i]; cut = i; }
    if(cut >= 0 && cutGap > typical * 1.7) for(let i = 0; i <= cut; i++) byY[i]._edge = true;

    cut = -1; cutGap = 0;
    const n = gaps.length;
    for(let i = n - 1; i >= n - zone && i >= 0; i--) if(gaps[i] > cutGap){ cutGap = gaps[i]; cut = i; }
    if(cut >= 0 && cutGap > typical * 1.7) for(let i = cut + 1; i < byY.length; i++) byY[i]._edge = true;
  }
  pages.forEach(markEdgeLines);

  // 1) Titre/numéro de page répété sur beaucoup de pages, EN BORD DE PAGE.
  const freqText = new Map();
  pages.forEach(pl => pl.forEach(l=>{
    if(!l._edge && !(l._rim && l.text.trim().length >= 10)) return;
    const n = norm(l.text); if(n.length < 3) return;
    freqText.set(n, (freqText.get(n) || 0) + 1);
  }));
  const total = pages.length;
  const isNoise = l=>{
    const t = l.text.trim();
    if(/^[ivxlcdm0-9]{1,5}\.?$/i.test(t)) return true;                          // numéro de page seul
    if(/^\(?\s*(more|cont'?d\.?|continued)\.?\)?\s*:?\s*$/i.test(t)) return true; // (MORE) / (CONT'D)
    if(!l._edge && !(l._rim && t.length >= 10)) return false;
    const n = norm(t);
    return total >= 3 && (freqText.get(n) || 0) / total > 0.4 && t.length < 60; // en-tête/pied répété
  };

  // 2) Ligne de base (marge action/scène = position la plus fréquente) et
  //    niveaux d'indentation au-dessus, pour distinguer dialogue/personnage.
  const freqX = new Map();
  pages.forEach(pl => pl.forEach(l=>{
    if(isNoise(l)) return;
    const rx = Math.round(l.x / 2) * 2;
    freqX.set(rx, (freqX.get(rx) || 0) + 1);
  }));
  // CORRECTIF. La position la plus fréquente n'est pas forcément la marge
  // d'action/scène : dans une scène très dialoguée, les répliques sont
  // souvent plus nombreuses que les lignes d'action, et l'ancienne règle
  // ("la plus fréquente = la marge") prenait alors la colonne du dialogue
  // pour la marge de base — ce qui faisait basculer aussi bien l'action
  // QUE le dialogue dans le même panier, tout classé "action" ensuite. La
  // vraie marge de base est toujours la colonne exploitée la plus à
  // GAUCHE parmi celles qui reviennent assez souvent pour être une
  // colonne à part entière (et non le numéro de scène isolé, rare, collé
  // tout à gauche).
  const totalKept = [...freqX.values()].reduce((a, b) => a + b, 0);
  const significant = [...freqX.entries()].filter(([, c]) => c >= Math.max(2, totalKept * 0.1));
  let baseline = 0;
  if(significant.length){
    baseline = significant.reduce((min, [x]) => Math.min(min, x), Infinity);
  } else {
    let best = -1;
    freqX.forEach((c, x)=>{ if(c > best){ best = c; baseline = x; } });
  }
  const centers = clusterIndents([...freqX.keys()].filter(x => x > baseline + 8));
  const dialogueX = centers.length ? centers[0] : null;
  const characterX = centers.length ? centers[centers.length - 1] : null;

  function bucketOf(x){
    if(dialogueX == null) return null;   // aucun retrait distinct nulle part : pas d'info exploitable
    if(x <= baseline + 8) return 'baseline';
    if(centers.length === 1) return 'indented';
    return Math.abs(x - characterX) < Math.abs(x - dialogueX) ? 'character' : 'dialogue';
  }

  // 3) Aplatissement en éléments de scénario. Deux règles opposées mais
  //    complémentaires, et c'est la seconde qui manquait :
  //
  //    a) SAUT DE PARAGRAPHE. Un écart vertical nettement supérieur à
  //       l'interligne habituel de la page vaut ligne vide (comme en .txt) :
  //       le bloc en cours est terminé.
  //
  //    b) RECOLLAGE. CORRECTIF. Un PDF ne contient pas de paragraphes, il
  //       contient des lignes : une réplique de trois lignes y est écrite
  //       en trois lignes distinctes, coupées par la largeur de la page.
  //       Chacune devenait un élément séparé — d'où un texte importé sans
  //       structure, où plus rien ne distinguait une vraie fin de
  //       paragraphe d'une simple coupure de ligne. On refusionne donc les
  //       lignes qui ne sont que la suite du bloc précédent. Le signal est
  //       purement géométrique, et c'est ce qui le rend fiable : même
  //       colonne à quelques points près + interligne normal = suite du
  //       même bloc, quoi que raconte le texte.
  const WRAPPABLE = new Set(['action','dialogue','parenthetical','text']);
  // Volontairement exclus : 'character' et 'transition'. Une réplique placée
  // juste sous le nom du personnage a le même interligne qu'une suite de
  // ligne ; dans un PDF mal formaté où les deux partagent la même colonne,
  // les recoller donnerait « SALOMON Pardon ? » sur une seule ligne.
  // Exclue aussi : 'scene'. Un test l'a montré — dans un scénario non
  // numéroté, l'en-tête de scène est à la même marge que l'action, et le
  // premier paragraphe d'action se faisait absorber par l'en-tête. Une
  // en-tête de scène qui déborde sur deux lignes reste toutefois recollée,
  // mais à une condition que l'action ne remplit jamais : la suite est elle
  // aussi entièrement en majuscules (voir plus bas).
  const CAPS_ONLY = t => /[A-ZÀ-Ý]/.test(t) && !/[a-zà-ÿ]/.test(t);
  const joinWrapped = (a, b) => (a.replace(/\s+$/,'') + ' ' + b.replace(/^\s+/,'')).replace(/\s{2,}/g,' ');

  const elements = [];
  let expectDialogue = false;
  let prev = null;                  // dernier élément créé, candidat au recollage
  pages.forEach(pl=>{
    const kept = pl.filter(l => !isNoise(l));
    const gaps = [];
    for(let i = 1; i < kept.length; i++) gaps.push(kept[i-1].y - kept[i].y);
    // CORRECTIF. On cherche ici l'INTERLIGNE de la page (l'écart entre deux
    // lignes d'un même paragraphe), pas un écart « moyen ». Une médiane ne
    // convient pas : dans une page composée pour moitié de lignes simples
    // et pour moitié de sauts de bloc, elle tombe entre les deux et un vrai
    // saut de paragraphe passait alors pour une simple suite de ligne. Le
    // bon repère est le plus petit écart qui se répète — un interligne, par
    // définition, revient sans arrêt, alors qu'un écart isolé plus petit
    // n'est qu'un accident de mise en page.
    const counts = new Map();
    gaps.forEach(g=>{ const k = Math.round(g); counts.set(k, (counts.get(k) || 0) + 1); });
    const repeated = [...counts.entries()].filter(([, n]) => n >= 2).map(([g]) => g);
    const lineGap = repeated.length ? Math.min(...repeated)
                  : (gaps.length ? Math.min(...gaps) : 14);
    prev = null;                    // jamais de recollage d'une page à l'autre
    kept.forEach((l, i)=>{
      const gap = i > 0 ? kept[i-1].y - l.y : null;
      const sameFlow = gap != null && lineGap > 0 && gap <= lineGap * 1.35;
      if(gap != null && lineGap > 0 && gap > lineGap * 1.6) expectDialogue = false;

      const c = classifyScreenplayLine(l.text, bucketOf(l.x), expectDialogue);

      // Suite du bloc précédent : même colonne, interligne normal, et le
      // bloc en cours est d'un type qui peut déborder sur plusieurs lignes.
      // Garde-fou : une en-tête de scène ouvre toujours un nouveau bloc,
      // même collée au paragraphe du dessus (certains PDF serrent
      // l'interligne avant une scène).
      const continues = prev && sameFlow && c.type !== 'scene' && Math.abs(prev.x - l.x) <= 6
        && (WRAPPABLE.has(prev.type) || (prev.type === 'scene' && CAPS_ONLY(l.text)));
      if(continues){
        prev.el.text = joinWrapped(prev.el.text, l.text);
        return;                     // expectDialogue inchangé : toujours le même bloc
      }

      const el = newElement(c.type, c.text);
      elements.push(el);
      expectDialogue = c.expect;
      prev = { el, x:l.x, type:c.type };
    });
  });
  return { elements, titleInfo: titlePage.titleInfo };
}

async function extractPdfPages(file){
  const pdfjsLib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages = [];
  for(let p = 1; p <= pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    pages.push(pdfPageToLines(content.items));
  }
  return pages;
}

async function importPdfFile(file){
  toast(L('Lecture du PDF…','Reading the PDF…'));
  try{
    const pages = await extractPdfPages(file);
    const totalChars = pages.reduce((s, pl) => s + pl.reduce((s2, l) => s2 + l.text.length, 0), 0);
    if(totalChars < 20 * pages.length && pages.length){
      toast(L('Ce PDF semble scanné (image) : aucun texte n\u2019a pu être extrait. Un scénario au format image ne peut pas être importé automatiquement.','This PDF looks scanned (image): no text could be extracted. A screenplay in image format can\u2019t be imported automatically.'));
      return;
    }
    const { elements, titleInfo } = pdfPagesToElements(pages);
    // Si une page de titre a été repérée et retirée, on s'en sert pour
    // préremplir l'auteur — le titre, lui, vient toujours du nom du
    // fichier, comme avant.
    const title = file.name.replace(/\.pdf$/i, '');
    const author = titleInfo && titleInfo.author;
    await finishImport(elements, title,
      'Import PDF terminé : la mise en forme (personnage/dialogue/action) est déduite automatiquement, vérifie-la avant d\u2019écrire.', author);
  }catch(err){
    console.error(err);
    toast(L('Impossible de lire ce PDF (','Couldn\u2019t read this PDF (') + (err && err.message ? err.message : L('erreur inconnue','unknown error')) + L('). Vérifie ta connexion internet : l\u2019import PDF a besoin de charger une bibliothèque de lecture.','). Check your internet connection: PDF import needs to load a reading library.'));
  }
}

/* =====================================================================
   GENERIC EVENT DISPATCH
===================================================================== */

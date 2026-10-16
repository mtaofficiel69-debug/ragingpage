/* =====================================================================
   IMPORT (txt / fountain / pdf)
   ---------------------------------------------------------------------
   Un seul classifieur de lignes est partagé par les trois formats. Pour
   .txt et .fountain on ne dispose que du texte ; pour .pdf on dispose EN
   PLUS de la position horizontale de chaque ligne, un signal bien plus
   fiable pour distinguer PERSONNAGE / DIALOGUE que la seule casse du texte
   (une police d'export PDF respecte toujours l'indentation standard du
   scénario, même quand la casse a été perdue en aval).
===================================================================== */

/* Une ligne est une en-tête de scène si elle commence par un indicatif
   standard (INT./EXT./INT.-EXT./EST.), OU — cas des scripts français —
   par un mot-clé de montage qui joue le même rôle d'en-tête de séquence
   sans indicatif (« SÉRIE DE PLANS », « MONTAGE »…). Les deux formes sont
   utilisées par les logiciels professionnels comme repères de haut niveau
   au même titre qu'un INT./EXT. */
function isSceneHeading(t){
  // Indicatifs combinés, quelle que soit la graphie : INT./EXT., INT/EXT, INT-EXT, EXT./INT., I/E…
  if(/^(INT|EXT)\.?\s*[\/\-–—]\s*(INT|EXT)(?=[.\s:\-–—]|$)/i.test(t)) return true;
  if(/^(I\s*\/\s*E|E\s*\/\s*I)(?=[.\s:])/i.test(t)) return true;
  if(/^(INT|EXT)(?=[.\s:\-–—])/i.test(t)) return true;
  // INTÉRIEUR / EXTÉRIEUR en toutes lettres : en capitales seulement (en minuscules c'est presque
  // toujours le début d'une phrase d'action : « Intérieur de la voiture, il pleut… »).
  if(/^(INT[ÉE]RIEUR|EXT[ÉE]RIEUR)(?=[.\s:\-–—\/])/.test(t)) return true;
  // EST. (plan d'ensemble). « Est ce que… » en minuscules est une phrase, pas une en-tête : sans point,
  // il faut que toute la ligne soit en capitales.
  if(/^EST\./i.test(t) || (/^EST\s/.test(t) && t === t.toUpperCase())) return true;
  // « SCÈNE 12 », « SÉQUENCE 3 » (capitales + numéro : jamais une phrase d'action).
  if(/^(SC[ÈE]NE|S[ÉE]QUENCE)\s*\d+/.test(t)) return true;
  if(/^(S[ÉE]RIE DE PLANS|SUITE DE PLANS|ENCHA[ÎI]NEMENT DE PLANS|MONTAGE)\b/i.test(t)) return true;
  return false;
}

/* Une ligne de TRANSITION (« COUPE À :», « CUT TO: », « FONDU AU NOIR »…)
   est courte, tout en majuscules, et se termine presque toujours par
   « À/A/SUR/TO » ou reprend un des quelques mots-clés standard du métier —
   côté français comme côté anglo-saxon. Avant ce correctif, seule la forme
   anglaise « ... TO: » était reconnue : toute transition française (très
   courante dans un scénario français) retombait sur la règle générale des
   lignes courtes en capitales et finissait classée PERSONNAGE, d'où des
   « COUPE À : » qui polluaient la liste des personnages. */
const TRANSITION_WORDS = new Set([
  'CUT','CUT TO','SMASH CUT TO','MATCH CUT TO','JUMP CUT TO','TIME CUT TO','QUICK CUT TO',
  'HARD CUT TO','DISSOLVE TO','WIPE TO','IRIS IN','IRIS OUT','FADE IN','FADE OUT',
  'FADE TO','FADE TO BLACK','FADE TO WHITE','BLACKOUT','BLACK','THE END','END',
  'COUPE','COUPE A','COUPE À','COUPE SUR','COUPE FRANCHE','CUT A','CUT À',
  'ENCHAINEMENT','ENCHAÎNEMENT','RACCORD','FONDU','FONDU AU NOIR','FONDU AU BLANC',
  'FONDU ENCHAINE','FONDU ENCHAÎNÉ',"FONDU D'OUVERTURE",'OUVERTURE EN FONDU',
  'FERMETURE EN FONDU','ECRAN NOIR','ÉCRAN NOIR','NOIR','GENERIQUE','GÉNÉRIQUE',
  'GENERIQUE DE DEBUT','GÉNÉRIQUE DE DÉBUT','GENERIQUE DE FIN','GÉNÉRIQUE DE FIN','FIN'
]);
function isTransitionLine(t){
  const raw = t.trim();
  const hadColon = /:\s*$/.test(raw);
  const s = raw.replace(/[.:]+$/,'').trim().toUpperCase();
  if(!s || s.length>40) return false;
  if(TRANSITION_WORDS.has(s)) return true;
  // Filet générique : une ligne qui finit par TO / A / À / SUR n'est fiable
  // comme repère de transition QUE si elle se termine par « : » dans le
  // texte d'origine — c'est la convention universelle des transitions
  // (« CUT TO: », « COUPE À : »). Sans ce garde-fou, un simple prénom de
  // personnage en capitales se terminant par A (SARA, ANNA, LISA…) aurait
  // été pris pour une transition.
  return hadColon && /^[A-ZÀ-Ý' ]+(TO|A|À|SUR)$/.test(s) && s.split(' ').length<=4;
}

/* Extensions de personnage reconnues à coup sûr, quelle que soit leur casse :
   (SUITE), (CONT'D), (V.O.), (O.S.), (voix off), (hors champ)… Une ligne qui se termine par l'une
   d'elles est un nom de personnage, jamais une réplique. */
const CUE_EXT_RE = /\(\s*(?:CONT['’`]?D\.?|CONTINUED|SUITE|V\.?\s?O\.?|O\.?\s?S\.?|O\.?\s?C\.?|VOIX\s+OFF|EN\s+VOIX\s+OFF|OFF|HORS[\s-]?CHAMP|H\.?\s?C\.?|[ÀA]\s+L['’]\u00c9CRAN|ON\s+SCREEN|FILTERED|PRE-?LAP)\s*\)\s*$/i;

/* Analyse la FORME d'une ligne pour savoir si elle ressemble à un nom de personnage. Les parenthèses
   sont mises de côté avant de juger la casse : « MARIE (voix off) » est un nom en capitales suivi
   d'une extension, pas une phrase contenant des minuscules. */
function cueInfo(t){
  const bare = t.replace(/\([^()]*\)/g,' ').replace(/\s+/g,' ').trim();
  const lastExt = /\(([^()]*)\)\s*$/.exec(t);
  return {
    caps:  /[A-ZÀ-ÝŒ]/.test(bare) && bare === bare.toUpperCase() && bare.length < 40 && t.length < 50,
    known: CUE_EXT_RE.test(t),
    ext:   !!lastExt && lastExt[1].length <= 30,
    // « BOUM ! », « SILENCE. », « TITLES OVER: » : une phrase en capitales, pas un nom.
    punct: /[.:!?…]$/.test(bare)
  };
}
/* Nom « à la française » écrit en minuscules/Capitale (« Marie », « Jean-Pierre Martin ») : ne sert
   que dans la colonne personnage d'un PDF, où la position suffit à dire que c'est un nom. */
function looksLikeTitleCaseCue(t){
  return t.length < 30 && !/[.:!?…]$/.test(t.replace(/\([^()]*\)/g,'').trim())
    && /^[A-ZÀ-Ý][\wÀ-ÿ'’.\-]*(\s+[A-ZÀ-Ý][\wÀ-ÿ'’.\-]*){0,3}(\s*\([^()]*\))*$/.test(t);
}

/* Classifie UNE ligne de texte déjà nettoyée (jamais vide, jamais bordée
   d'espaces). `indentBucket` vaut null (texte seul, .txt/.fountain) ou
   'baseline' / 'dialogue' / 'character' / 'indented' (indentation connue
   mais document à un seul niveau de retrait, ambiguë sans le texte).
   Renvoie { type, text, expect } où `expect` indique si la ligne SUIVANTE
   doit être traitée comme un dialogue par défaut. */
function classifyScreenplayLine(t, indentBucket, expectDialogue){
  // Final Draft marque les lignes révisées d'une étoile en marge droite (« AMELIA WREN * ») :
  // ce n'est pas du texte. On l'enlève tant qu'il reste autre chose que l'étoile.
  const noStar = t.replace(/\s+\*+\s*$/,'');
  if(noStar !== t && /[A-Za-zÀ-ÿ0-9]/.test(noStar)) t = noStar;

  // Conventions Fountain « forcées » — uniquement quand on n'a que du texte (pas de position PDF),
  // sinon une ligne d'action PDF qui commence par « ... » ou « ! » serait prise pour une marque.
  if(indentBucket === null){
    // [[note]] — « # Acte » — « = synopsis » : ce sont des notes de travail, jamais du texte joué.
    const fNote = /^\[\[(.*)\]\]$/.exec(t);
    if(fNote && fNote[1].trim()) return { type:'note', text:fNote[1].trim(), expect:expectDialogue };
    const fSect = /^#{1,6}\s*(\S.*)$/.exec(t) || /^=\s+(\S.*)$/.exec(t);
    if(fSect) return { type:'note', text:fSect[1].trim(), expect:expectDialogue };
    if(/^\.(?=[^\s.])/.test(t)) return { type:'scene', text:t.slice(1).trim(), expect:false };
    const fChar = /^@(\S.*)$/.exec(t);
    if(fChar){
      const fcar = /^(.*\S)\s*\^\s*$/.exec(fChar[1]);
      return fcar ? { type:'character', text:fcar[1].trim(), expect:true, dual:true }
                  : { type:'character', text:fChar[1].trim(), expect:true };
    }
    if(/^!\S/.test(t)) return { type:'action', text:t.slice(1), expect:false };
  }
  // Convention Fountain : « JEANNE ^ » = réplique jouée en même temps que
  // la précédente. On retire la marque du texte et on la remonte comme
  // drapeau, sans quoi le ^ finirait imprimé dans le nom du personnage.
  const caret = /^(.*\S)\s*\^\s*$/.exec(t);
  if(caret){
    const name = caret[1];
    if(cueInfo(name).caps)
      return { type:'character', text:name, expect:true, dual:true };
  }
  // CORRECTIF. Beaucoup de scripts (dont les exports PDF) collent le
  // numéro de scène devant l'indicatif : « 1 INT. TAXI - NUIT ». Comme
  // Raging Page numérote déjà les scènes tout seul, on retire ce numéro s'il
  // précède bien une vraie en-tête de scène — jamais sinon, pour ne pas
  // amputer une ligne d'action qui commencerait légitimement par un chiffre.
  // Formes acceptées : « 12 INT. », « 12. INT. », « 12 - INT. », « 12) INT. », « 12A INT. ».
  const numberedMatch = t.match(/^([A-Za-z]?\d+[A-Za-z]?)\.?\s*[)\-–—:]?\s+(.+)$/);
  if(numberedMatch){
    const lead = numberedMatch[1], rest = numberedMatch[2];
    // Final Draft garde la place d'une scène supprimée : « 8 OMITTED 8 ».
    if(rest.toUpperCase() === ('OMITTED ' + lead).toUpperCase())
      return { type:'scene', text:'OMITTED', expect:false };
    if(isSceneHeading(rest)){
      // Final Draft répète aussi le numéro EN FIN de ligne (« … CONTINUOUS - 3 ») : on le retire
      // seulement s'il est identique à celui du début, donc jamais un « INT. CHAMBRE 12 » légitime.
      const esc = lead.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const cleaned = rest.replace(new RegExp('\\s+[-–—]?\\s*' + esc + '$','i'),'').trim();
      return { type:'scene', text:(cleaned && isSceneHeading(cleaned)) ? cleaned : rest, expect:false };
    }
  }
  if(isSceneHeading(t))
    return { type:'scene', text:t, expect:false };
  // « > Texte » force une transition quel que soit le texte (convention
  // Fountain) ; sinon on retombe sur la détection par mots-clés/casse.
  if(/^>.*<\s*$/.test(t))
    return { type:'card', text:t.replace(/^>\s*/,'').replace(/\s*<\s*$/,''), expect:false };
  if(t.startsWith('>'))
    return { type:'transition', text:t.replace(/^>\s*/,''), expect:false };
  if(isTransitionLine(t) && t === t.toUpperCase())
    return { type:'transition', text:t, expect:false };
  if(t.startsWith('(')){
    // Au ras de la marge d'action, une ligne qui commence par « ( » est de l'action
    // (« (et maximiser les gains). Mais CHARLIE traverse… »), pas une didascalie de réplique.
    if(indentBucket === 'baseline') return { type:'action', text:t, expect:false };
    // Texte seul : une parenthèse qui ne suit ni un personnage ni une réplique est de l'action.
    if(indentBucket === null && !expectDialogue) return { type:'action', text:t, expect:false };
    return { type:'parenthetical', text:t, expect:expectDialogue };
  }

  const ci = cueInfo(t);
  // Un nom de personnage « plausible » : capitales (extensions entre parenthèses mises de côté),
  // court, et qui ne finit pas comme une phrase — sauf extension connue, qui tranche toujours.
  const cue = ci.caps && (ci.known || !ci.punct);

  if(indentBucket === 'character'){
    // La colonne dit « personnage », mais une ligne de PROSE (minuscules, ponctuation de phrase) y
    // arrive aussi quand un dialogue simultané déborde dans cette colonne : ce n'est pas un nom.
    if(ci.caps || looksLikeTitleCaseCue(t)) return { type:'character', text:t, expect:true };
    return { type:'dialogue', text:t, expect:true };
  }
  if(indentBucket === 'dialogue'){
    // Une extension connue (CONT'D, V.O., voix off…) prouve que c'est un nom, même collé à une réplique.
    if(ci.caps && ci.known) return { type:'character', text:t, expect:true };
    return { type: (expectDialogue || !cue) ? 'dialogue' : 'character', text:t, expect:true };
  }
  if(indentBucket === 'indented'){
    // Un seul niveau de retrait détecté dans tout le document : on ne peut
    // pas distinguer géométriquement personnage et dialogue, on retombe
    // sur la casse — comme pour .txt/.fountain.
    if(cue) return { type:'character', text:t, expect:true };
    if(expectDialogue) return { type:'dialogue', text:t, expect:true };
    return { type:'action', text:t, expect:false };
  }
  if(indentBucket === 'baseline'){
    // CORRECTIF. Position réellement mesurée, et cette ligne est au ras de
    // la marge de gauche : dans une mise en page standard, le dialogue est
    // TOUJOURS retrait — jamais à la marge. Contrairement au cas 'indented'
    // ci-dessus, on ne doit donc jamais retomber sur `expectDialogue` ici :
    // sinon une simple ligne d'action juste après une réplique (sans ligne
    // vide franche entre les deux) était prise pour la suite du dialogue.
    // Les capitales qui finissent comme une phrase (« THUNDER. », « TITLES OVER: ») sont de l'action.
    return cue ? { type:'character', text:t, expect:true } : { type:'action', text:t, expect:false };
  }
  // indentBucket vaut null : aucune information de position (.txt/.fountain,
  // ou PDF dont tout le texte partage la même colonne — mise en page trop
  // inhabituelle pour qu'on en tire quoi que ce soit). On retombe sur la
  // seule casse, comme le faisait l'importeur .txt d'origine.
  if(cue) return { type:'character', text:t, expect:true };
  if(expectDialogue) return { type:'dialogue', text:t, expect:true };
  return { type:'action', text:t, expect:false };
}

/* Termine un import commun aux trois formats : crée le projet, l'enregistre,
   bascule dans l'éditeur. */
async function finishImport(elements, title, warning, author, extra){
  if(!elements.length) elements.push(newElement('action',''));
  // Rien sous le titre : le type de projet est inconnu à l'import, et il est
  // modifiable à tout moment dans les réglages du projet.
  const p = newProject(title, 'fr', '');
  p.elements = elements;
  if(author) p.author = author;
  if(typeof extra === 'function'){ try{ extra(p); }catch(e){} }
  S.project = p;
  S.projectsIndex.push({ id:p.id, title:p.title, format:p.format, updatedAt:p.updatedAt });
  await saveIndex(); await storSet(proj_key(p.id), p);
  S.view='editor'; S.tab='editor'; S.undoStack=[]; S.redoStack=[];
  render();
  toast(warning || 'Import terminé, vérifie les types de lignes détectés.');
}

function onImportFile(e){
  const file = e.target.files[0]; if(!file) return;
  const ext = (file.name.match(/\.([a-z0-9]+)$/i) || [,''])[1].toLowerCase();
  e.target.value = '';
  if(ext === 'pdf') importPdfFile(file);
  else if(ext === 'fdx') importFDXFile(file);
  else if(ext === 'smmproj' || ext === 'json') importBackupFile(file);
  else importTextFile(file);
}

/* ---------------------------------------------------------------------
   Import Final Draft (.fdx)
   ---------------------------------------------------------------------
   Raging Page savait déjà ÉCRIRE du .fdx (exportFDX) mais pas le relire, ce
   qui rendait l'échange à sens unique : impossible de récupérer un
   scénario venu de Final Draft, WriterDuet, Fade In, Celtx… alors que tous
   exportent ce format.

   Un .fdx est du XML, pas du texte libre : chaque paragraphe y porte déjà
   son type (<Paragraph Type="Character">). Il n'y a donc RIEN à deviner —
   contrairement à l'import .txt ou .pdf, qui doivent classer les lignes à
   l'aveugle. C'est l'import le plus fiable de l'application, et le mapping
   est exactement l'inverse de fdxParagraphType().
--------------------------------------------------------------------- */
function fdxTypeToElement(type){
  switch(String(type||'').trim().toLowerCase()){
    case 'scene heading': return 'scene';
    case 'character':     return 'character';
    case 'parenthetical': return 'parenthetical';
    case 'dialogue':      return 'dialogue';
    case 'transition':    return 'transition';
    case 'shot':          return 'shot';
    case 'general':       return 'text';
    case 'action':        return 'action';
    default:              return 'action';
  }
}
/* Le texte d'un paragraphe FDX est découpé en plusieurs <Text> dès qu'il
   change de style (gras, italique, souligné…). On les recolle bout à bout :
   Raging Page stocke du texte brut par ligne, le style ne se perd donc pas
   « à moitié », il ne suit simplement pas — comme pour les autres imports. */
function fdxParagraphText(par){
  const runs = par.getElementsByTagName('Text');
  let t = '';
  if(runs.length){ for(let i=0;i<runs.length;i++) t += runs[i].textContent || ''; }
  else t = par.textContent || '';
  return t.replace(/\s+/g,' ').trim();
}
function importFDXFile(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    let doc = null;
    try{ doc = new DOMParser().parseFromString(String(reader.result), 'application/xml'); }catch(e){ doc = null; }
    // parseFromString ne lève pas d'exception sur un XML cassé : il renvoie
    // un document contenant <parsererror>. C'est le seul test fiable.
    if(!doc || doc.getElementsByTagName('parsererror').length || !doc.getElementsByTagName('FinalDraft').length){
      toast(L('Ce fichier .fdx n\u2019a pas pu être lu : il est peut-être endommagé.','This .fdx file couldn\u2019t be read: it may be damaged.'));
      return;
    }
    // On ne prend QUE les paragraphes du <Content> principal du script :
    // ceux d'un éventuel <TitlePage> servent au titre/à l'auteur, pas au
    // corps du scénario (sinon la page de titre se retrouve collée en tête
    // du texte, comme une scène).
    const titlePage = doc.getElementsByTagName('TitlePage')[0] || null;
    const inTitlePage = node => { let n = node; while(n){ if(n === titlePage) return true; n = n.parentNode; } return false; };

    const pars = Array.prototype.filter.call(doc.getElementsByTagName('Paragraph'), p=> !inTitlePage(p));
    const elements = [], revIds = [];
    // Dialogue simultané : Final Draft enferme les deux blocs dans un
    // <DualDialogue>. Le DEUXIÈME personnage rencontré à l'intérieur est
    // celui qui porte le drapeau chez nous (colonne de droite).
    const dualBoxOf = node => { let n = node; while(n){ if(n.nodeName === 'DualDialogue') return n; n = n.parentNode; } return null; };
    let curBox = null, charsInBox = 0;
    pars.forEach((par, pi)=>{
      const txt = fdxParagraphText(par);
      if(!txt) return;                     // lignes vides d'aération du .fdx
      let type = fdxTypeToElement(par.getAttribute('Type'));
      const box = dualBoxOf(par);
      // Certains exports étiquettent « Character » une ligne qui n'en est pas une (en-tête de scène,
      // « FADE OUT. », « FIN »…). Si elle n'est pas suivie d'une réplique, on la range comme au .txt.
      if(type === 'character' && !box){
        const nx = pars[pi + 1] ? fdxTypeToElement(pars[pi + 1].getAttribute('Type')) : '';
        if(nx !== 'dialogue' && nx !== 'parenthetical'){
          if(isSceneHeading(txt)) type = 'scene';
          else if(isTransitionLine(txt)) type = 'transition';
        }
      }
      if(box !== curBox){ curBox = box; charsInBox = 0; }
      // Final Draft laisse une ligne blanche devant chaque paragraphe d'action : deux actions de suite
      // se lisent donc comme deux paragraphes séparés. Sans cela ils arrivaient collés l'un à l'autre
      // dans l'éditeur ; on rend la ligne blanche par un élément action vide (comme l'import PDF).
      const lastEl = elements[elements.length - 1];
      if(type === 'action' && lastEl && lastEl.type === 'action' && lastEl.text !== ''){
        elements.push(newElement('action',''));
        revIds.push(0);                    // garde revIds aligné sur elements
      }
      const el = newElement(type, txt);
      if(box && type === 'character' && ++charsInBox >= 2) el.dual = true;
      elements.push(el);
      // Révisions : on garde le plus grand RevisionID porté par le paragraphe.
      let rv = 0;
      Array.prototype.forEach.call(par.getElementsByTagName('Text'), t=>{ rv = Math.max(rv, parseInt(t.getAttribute('RevisionID'), 10) || 0); });
      revIds.push(rv);
    });

    // Révisions Final Draft → révisions colorées (dates inconnues : date d'import).
    const revExtra = (()=>{
      const used = Array.from(new Set(revIds.filter(x=>x>0))).sort((a,b)=>a-b);
      if(!used.length) return null;
      const decl = {};
      Array.prototype.forEach.call(doc.getElementsByTagName('Revision'), r=>{ decl[parseInt(r.getAttribute('ID'),10)] = r.getAttribute('Name') || ''; });
      const ids = Array.from(new Set(used.concat(Object.keys(decl).map(Number).filter(x=>x>0)))).sort((a,b)=>a-b);
      return p=>{
        const rounds = ids.map((id, j)=>{
          const nm = String(decl[id] || '').toLowerCase();
          const c = REV_COLORS.find(c=> nm.indexOf(c.en.toLowerCase()) === 0) || REV_COLORS[j % REV_COLORS.length];
          return { color:c.id, date:Date.now(), base:{} };
        });
        const rIdx = {}; ids.forEach((id, j)=>{ rIdx[id] = j; });
        // Une ligne portant la révision j est absente de la photo j (donc marquée j) et présente dans les suivantes.
        p.elements.forEach((el, i)=>{
          const own = revIds[i] > 0 ? rIdx[revIds[i]] : -1;
          rounds.forEach((rd, j)=>{ if(own < j) rd.base[el.id] = el.text; });
        });
        p.rev = { rounds, show:true, inExport:true, paper:true, inText:true, manual:{}, hidden:{} };
      };
    })();

    // Titre, auteur et autres textes depuis la page de titre du .fdx quand elle existe,
    // sinon le nom du fichier (comme les autres imports). Les textes restent rangés par BLOCS,
    // séparés par une ligne vide dans « Phrases supplémentaires » : ceux du fichier (paragraphes
    // vides = espace voulu, ou types Final Draft Title/Author/DraftDate/Contact…), jamais collés.
    let title = file.name.replace(/\.fdx$/i,'');
    let author = '';
    let tpExtra = '';
    if(titlePage){
      const tpPars = Array.prototype.map.call(titlePage.getElementsByTagName('Paragraph'), par=>({
        type: String(par.getAttribute('Type') || '').replace(/\s+/g,'').toLowerCase(),
        text: fdxParagraphText(par)
      }));
      const TYPED = ['title','subtitle','credit','author','authors','source','draftdate','date','revision','contact','copyright'];
      // « Written by » / « Écrit par » : l'appli l'écrit déjà devant l'auteur, on ne le garde pas deux fois.
      const GENERIC_CREDIT = /^(?:(?:written|screenplay|teleplay|story)\s+by|[ée]crit(?:e)?\s+(?:et\s+r[ée]alis[ée]e?\s+)?par|un\s+(?:sc[ée]nario|film)\s+de|sc[ée]nario\s+(?:de|par)|by|par)\s*:?$/i;
      const groups = [];
      if(tpPars.some(q => q.text && TYPED.indexOf(q.type) >= 0)){
        // Le fichier dit lui-même ce qu'est chaque paragraphe : rien à deviner.
        const ofType = (...ts)=> tpPars.filter(q => q.text && ts.indexOf(q.type) >= 0).map(q => q.text);
        const tt = ofType('title');   if(tt.length) title = tt.join(' ');
        const au = ofType('author','authors'); if(au.length) author = au.join(', ');
        const head = ofType('subtitle','source').concat(ofType('credit').filter(c => !GENERIC_CREDIT.test(c)));
        if(head.length) groups.push(head);
        tpPars.filter(q => q.text && TYPED.indexOf(q.type) < 0).forEach(q => groups.push([q.text]));
        const dates = ofType('draftdate','date','revision'); if(dates.length) groups.push(dates);
        const foot = ofType('copyright','contact');          if(foot.length) groups.push(foot);
      }else{
        // Pas de types (cas courant de Final Draft) : on garde l'ordre, et les paragraphes vides
        // (l'espace vertical voulu) séparent les blocs.
        const flat = [];
        let blk = 0, pendingBreak = false;
        tpPars.forEach(q=>{
          if(!q.text){ pendingBreak = true; return; }
          if(pendingBreak && flat.length) blk++;
          pendingBreak = false;
          flat.push({ t:q.text, b:blk });
        });
        if(flat.length){
          const MARK = /^(?:written\s+by|screenplay\s+by|teleplay\s+by|[ée]crit(?:e)?\s+par|un\s+sc[ée]nario\s+de|sc[ée]nario\s+(?:de|par)|by|par|de)\b\s*:?\s*(.*)$/i;
          let mk = -1;
          for(let i = 1; i < flat.length; i++){ if(MARK.test(flat[i].t)){ mk = i; break; } }
          // Titre : les lignes du premier bloc (3 au plus, ou jusqu'à la mention d'auteur).
          // Sans mention d'auteur, une 2e/3e ligne du même bloc n'est prise dans le titre que si elle est,
          // comme la première, toute en capitales (jamais « Copyright… »).
          const allCaps = t => /[A-ZÀ-Ý]/.test(t) && !/[a-zà-ÿ]/.test(t);
          let n = 0;
          const lim = mk >= 0 ? mk : Math.min(flat.length, 3);
          while(n < lim && flat[n].b === flat[0].b
                && (mk >= 0 || n === 0 || (allCaps(flat[0].t) && allCaps(flat[n].t)))) n++;
          if(n < 1) n = 1;
          title = flat.slice(0, n).map(f => f.t).join(' ');
          const used = new Set();
          for(let i = 0; i < n; i++) used.add(i);
          if(mk >= 0){
            const name = flat[mk].t.match(MARK)[1].trim();
            used.add(mk);
            if(name) author = name;
            else if(flat[mk+1]){ author = flat[mk+1].t; used.add(mk+1); }
          }else if(flat[n] && flat[n].t.length < 60){
            author = flat[n].t; used.add(n);
          }
          flat.forEach((f, i)=>{
            if(used.has(i)) return;
            if(!groups.length || groups[groups.length-1].b !== f.b) groups.push(Object.assign([], { b:f.b }));
            groups[groups.length-1].push(f.t);
          });
        }
      }
      tpExtra = groups.filter(g => g.length).map(g => g.join('\n')).join('\n\n');
    }
    if(!elements.length){
      toast(L('Aucun texte trouvé dans ce .fdx.','No text found in this .fdx.'));
      return;
    }
    // Phrases supplémentaires de la page de titre d'abord, puis les révisions.
    const fdxExtra = (revExtra || tpExtra) ? (p=>{ if(tpExtra) p.titlePageExtra = tpExtra; if(revExtra) revExtra(p); }) : undefined;
    finishImport(elements, title, 'Import Final Draft terminé : les types de lignes viennent du fichier, rien n\u2019a été deviné.' + (revExtra ? ' Les révisions ont été reconstituées (dates = jour d\u2019import).' : ''), author, fdxExtra);
  };
  reader.readAsText(file);
}

/* ---------------------------------------------------------------------
   Sauvegarde complète du projet (.smmproj)
   ---------------------------------------------------------------------
   POURQUOI C'EST ESSENTIEL : tout Raging Page vit dans le localStorage de CE
   navigateur. Vider les données du navigateur, changer d'ordinateur, passer
   en navigation privée, ou une simple mise à jour agressive du navigateur —
   et les scénarios disparaissent, sans copie nulle part. C'est la seule
   chose que WriterDuet fait et que Raging Page ne faisait pas du tout : garder
   le travail ailleurs que dans le navigateur.

   Les exports existants (PDF, txt, Fountain, fdx) ne remplacent PAS une
   sauvegarde : ils ne contiennent que le texte du scénario. Les notes, les
   outlines, les tags, les scènes au cimetière, les versions, le design de
   la page de titre — tout cela n'existe dans aucun d'eux. Le .smmproj est
   simplement le projet entier tel qu'il est stocké, dans un fichier.
--------------------------------------------------------------------- */

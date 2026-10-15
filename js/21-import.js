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
  if(/^(INT|EXT|INT\.\/EXT|EXT\.\/INT|EST)[.\s]/i.test(t)) return true;
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

/* Classifie UNE ligne de texte déjà nettoyée (jamais vide, jamais bordée
   d'espaces). `indentBucket` vaut null (texte seul, .txt/.fountain) ou
   'baseline' / 'dialogue' / 'character' / 'indented' (indentation connue
   mais document à un seul niveau de retrait, ambiguë sans le texte).
   Renvoie { type, text, expect } où `expect` indique si la ligne SUIVANTE
   doit être traitée comme un dialogue par défaut. */
function classifyScreenplayLine(t, indentBucket, expectDialogue){
  // Convention Fountain : « JEANNE ^ » = réplique jouée en même temps que
  // la précédente. On retire la marque du texte et on la remonte comme
  // drapeau, sans quoi le ^ finirait imprimé dans le nom du personnage.
  const caret = /^(.*\S)\s*\^\s*$/.exec(t);
  if(caret){
    const name = caret[1];
    if(name === name.toUpperCase() && /[A-ZÀ-Ý]/.test(name))
      return { type:'character', text:name, expect:true, dual:true };
  }
  // CORRECTIF. Beaucoup de scripts (dont les exports PDF) collent le
  // numéro de scène devant l'indicatif : « 1 INT. TAXI - NUIT ». Comme
  // Raging Page numérote déjà les scènes tout seul, on retire ce numéro s'il
  // précède bien une vraie en-tête de scène — jamais sinon, pour ne pas
  // amputer une ligne d'action qui commencerait légitimement par un chiffre.
  const numberedMatch = t.match(/^\d+[A-Za-z]?\.?\s+(.+)$/);
  if(numberedMatch && isSceneHeading(numberedMatch[1]))
    return { type:'scene', text:numberedMatch[1], expect:false };
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
  if(t.startsWith('('))
    return { type:'parenthetical', text:t, expect:expectDialogue };

  const allCapsShort = t === t.toUpperCase() && t.length < 40 && /[A-ZÀ-Ý]/.test(t) && !/[a-zà-ÿ]/.test(t);

  if(indentBucket === 'character') return { type:'character', text:t, expect:true };
  if(indentBucket === 'dialogue')
    return { type: (expectDialogue || !allCapsShort) ? 'dialogue' : 'character', text:t, expect:true };
  if(indentBucket === 'indented'){
    // Un seul niveau de retrait détecté dans tout le document : on ne peut
    // pas distinguer géométriquement personnage et dialogue, on retombe
    // sur la casse — comme pour .txt/.fountain.
    if(allCapsShort) return { type:'character', text:t, expect:true };
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
    return allCapsShort ? { type:'character', text:t, expect:true } : { type:'action', text:t, expect:false };
  }
  // indentBucket vaut null : aucune information de position (.txt/.fountain,
  // ou PDF dont tout le texte partage la même colonne — mise en page trop
  // inhabituelle pour qu'on en tire quoi que ce soit). On retombe sur la
  // seule casse, comme le faisait l'importeur .txt d'origine.
  if(allCapsShort) return { type:'character', text:t, expect:true };
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
    pars.forEach(par=>{
      const txt = fdxParagraphText(par);
      if(!txt) return;                     // lignes vides d'aération du .fdx
      const type = fdxTypeToElement(par.getAttribute('Type'));
      const box = dualBoxOf(par);
      if(box !== curBox){ curBox = box; charsInBox = 0; }
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

    // Titre et auteur depuis la page de titre du .fdx quand elle existe,
    // sinon le nom du fichier (comme les autres imports).
    let title = file.name.replace(/\.fdx$/i,'');
    let author = '';
    if(titlePage){
      const tp = Array.prototype.map.call(titlePage.getElementsByTagName('Paragraph'), fdxParagraphText).filter(Boolean);
      if(tp.length){
        title = tp[0];
        const a = tp.find(l=>/^(written by|écrit par|by|de)\b/i.test(l));
        if(a) author = a.replace(/^(written by|écrit par|by|de)\s*/i,'').trim();
        else if(tp[1] && tp[1].length < 60) author = tp[1];
      }
    }
    if(!elements.length){
      toast(L('Aucun texte trouvé dans ce .fdx.','No text found in this .fdx.'));
      return;
    }
    finishImport(elements, title, L('Import Final Draft terminé : les types de lignes viennent du fichier, rien n\u2019a été deviné.','Final Draft import complete: line types come from the file, nothing was guessed.') + (revExtra ? L(' Les révisions ont été reconstituées (dates = jour d\u2019import).',' Revisions were rebuilt (dates = import day).') : ''), author, revExtra);
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

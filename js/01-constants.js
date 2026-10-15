/* =====================================================================
   CONSTANTS
===================================================================== */
const TYPES = ['scene','action','character','parenthetical','dialogue','transition','shot','text','card','note'];
const TYPE_LABEL = {
  scene:'Scène', action:'Action', character:'Personnage', parenthetical:'Parenthétique',
  dialogue:'Dialogue', transition:'Transition', shot:'Plan', text:'Texte libre', card:'Carton', note:'Note'
};
const TYPE_LABEL_EN = {
  scene:'Scene', action:'Action', character:'Character', parenthetical:'Parenthetical',
  dialogue:'Dialogue', transition:'Transition', shot:'Shot', text:'Free text', card:'Title card', note:'Note'
};
function typeLabelDisplay(type){ return L(TYPE_LABEL[type] || type || '', TYPE_LABEL_EN[type] || type || ''); }
const TYPE_SHORTCUT = {1:'scene',2:'action',3:'character',4:'parenthetical',5:'dialogue',6:'transition',7:'shot',8:'text',9:'note'};
/* CORRECTIF I18N. Un objet PLACEHOLDER figé au chargement (donc dans la
   langue active à cet instant précis) ne pouvait jamais changer ensuite :
   passer l'interface en anglais laissait tous les indicatifs de ligne vide
   en français, puisqu'ils avaient déjà été copiés dans dataset.placeholder
   une fois pour toutes. On calcule donc l'indicatif à la demande, via L(),
   à chaque fois qu'une ligne est (re)construite — buildLineDiv/refreshLineDiv
   étant rappelées à chaque rendu (y compris juste après un changement de
   langue), le libellé affiché est toujours celui de la langue courante. */
function placeholderFor(type){
  switch(type){
    case 'scene': return L('INT. CAFÉ - JOUR','INT. CAFE - DAY');
    case 'action': return L('Description de l\u2019action…','Action description…');
    case 'character': return L('NOM DU PERSONNAGE','CHARACTER NAME');
    case 'parenthetical': return L('(indication)','(parenthetical)');
    case 'dialogue': return L('Réplique…','Dialogue…');
    case 'transition': return 'CUT TO:';
    case 'shot': return L('GROS PLAN -','CLOSE-UP -');
    case 'text': return L('Texte libre…','Free text…');
    case 'card': return L('Texte du carton…','Title card text…');
    case 'note': return L('Note de travail (invisible à l\u2019export)…','Working note (invisible on export)…');
    default: return '';
  }
}
const TOWARD_CHAR = new Set(['action','scene','transition','shot','text','card','note']);
const TOWARD_ACTION = new Set(['character','parenthetical','dialogue']);
const ENTER_MAP = { scene:'action', action:'action', character:'dialogue', parenthetical:'dialogue',
  dialogue:'character', transition:'scene', shot:'action', text:'text', card:'action', note:'note' };

const FORMATS = {
  fr:{ label:'Scénario français', labelEn:'French screenplay', cls:'format-fr' },
  us:{ label:'Scénario américain', labelEn:'American screenplay', cls:'format-us' }
};
function formatLabel(fmt){ const f = FORMATS[fmt]; if(!f) return fmt; return L(f.label, f.labelEn); }
const PROJECT_KINDS = ['Long métrage','Moyen métrage','Court métrage','Série','Épisode','Documentaire','Clip','Format libre'];
const PROJECT_KIND_EN = {
  'Long métrage':'Feature film', 'Moyen métrage':'Mid-length film', 'Court métrage':'Short film',
  'Série':'Series', 'Épisode':'Episode', 'Documentaire':'Documentary', 'Clip':'Music video', 'Format libre':'Free format'
};
function kindOptionLabel(k){ return L(k, PROJECT_KIND_EN[k] || k); }

const TP_FONTS = [
  {id:'mono', label:'Machine à écrire', family:"'Courier Prime','Courier New',monospace"},
  {id:'special', label:'Scénario vintage', family:"'Special Elite','Courier New',monospace"},
  {id:'display', label:'Moderne', family:"'Space Grotesk',sans-serif"},
  {id:'sans', label:'Épuré', family:"'Inter',sans-serif"},
  {id:'serif', label:'Élégant', family:"'Playfair Display',serif"},
  {id:'garamond', label:'Classique', family:"'Cormorant Garamond',serif"},
  {id:'cinzel', label:'Cinématique', family:"'Cinzel',serif"},
  {id:'bebas', label:'Affiche', family:"'Bebas Neue',sans-serif"},
  {id:'hand', label:'Manuscrit', family:"'Caveat',cursive"},
];


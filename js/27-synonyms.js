/* =====================================================================
   SYNONYMES (v14) — panneau d'alternatives pour éviter les répétitions
   ---------------------------------------------------------------------
   Ctrl/Cmd+Maj+Y, ou « Synonymes » dans le menu ⋯. Sélectionne un mot (ou
   pose juste le curseur dedans) : le panneau propose des alternatives
   regroupées par NUANCE. Un clic remplace le mot dans le texte (annulable
   par Ctrl+Z). Onglet « Répétitions » : les mots les plus répétés du script.
   Format du dictionnaire : voir l'en-tête de SYN_DB_TEXT.
===================================================================== */
const SYN_DB_TEXT = `
v|Fixer, dévisager|fixer>d;dévisager>d;toiser>d;river {p} regard>sur;darder {p} regard>sur;braquer {p} regard>sur;planter {p} regard>dans;ancrer {p} regard>dans|regarder
v|Observer, scruter|observer>d;scruter>d;examiner>d;détailler>d;étudier>d;inspecter>d|regarder
v|Contempler, admirer|contempler>d;admirer>d;s'attarder>sur|regarder
v|Coup d'œil rapide|jeter un coup d'œil>à;jeter un œil>à;lancer un regard>vers;glisser un regard>vers;risquer un œil>vers;lorgner>d;zieuter>d|regarder
v|Épier, surveiller|épier>d;guetter>d;surveiller>d;espionner>d|regarder
v|Détourner le regard|détourner {p} regard>de;détourner les yeux>de;éviter {p} regard>d;fuir {p} regard>d;esquiver {p} regard>d|regarder
v|Baisser, lever les yeux|baisser les yeux>sur;baisser {p} regard>sur;lever les yeux>vers;lever {p} regard>vers;relever {p} regard>vers;tourner {p} regard>vers;porter {p} regard>sur;diriger {p} regard>vers|regarder
v|Se tourner, se retourner|se tourner>vers;se retourner>vers;pivoter>vers;faire volte-face>i;faire demi-tour>i;tourner la tête>vers;tourner les talons>i;se détourner>de|tourner,retourner
v|Soupirer|soupirer>i;pousser un soupir>i;pousser un long soupir>i;laisser échapper un soupir>i;lâcher un soupir>i;expirer longuement>i;souffler>i|
v|Avancer lentement|s'avancer>vers;progresser>i;cheminer>i;avancer à pas lents>vers;se traîner>vers|avancer
v|Marcher sans but|déambuler>i;errer>i;flâner>i;vagabonder>i;arpenter>d;tourner en rond>i|marcher
v|Aller vers|se diriger>vers;s'approcher>de;se rapprocher>de;gagner>d;rejoindre>d;atteindre>d|avancer,marcher
v|Avancer avec détermination|foncer>vers;s'élancer>vers;se précipiter>vers;marcher d'un pas décidé>vers|avancer,marcher,courir
v|Entrer|entrer>dans;pénétrer>dans;s'introduire>dans;s'engouffrer>dans;faire irruption>dans;franchir le seuil>de|
v|Sortir, quitter|sortir>de;quitter>d;s'éclipser>i;s'esquiver>i;déguerpir>i;s'éloigner>de;partir>i|
v|Sourire|sourire>à;esquisser un sourire>à;ébaucher un sourire>à;adresser un sourire>à;afficher un sourire>i;sourire en coin>i|
v|Rire|rire>i;pouffer>i;s'esclaffer>i;éclater de rire>i;ricaner>i;glousser>i|
v|Pleurer|pleurer>i;sangloter>i;fondre en larmes>i;verser des larmes>i;s'effondrer en larmes>i|
v|Crier|crier>i;hurler>i;vociférer>i;rugir>i;s'époumoner>i;s'égosiller>i;beugler>i|
v|Trembler|trembler>i;frissonner>i;frémir>i;tressaillir>i;grelotter>i;vibrer>i|
v|Se figer|se figer>i;se pétrifier>i;s'immobiliser>i;se raidir>i;se glacer>i|
v|Dire à voix basse|murmurer>d;chuchoter>d;souffler>d;glisser>d;marmonner>d;susurrer>d|dire
v|Dire à voix haute|lancer>d;lâcher>d;clamer>d;s'exclamer>i;déclarer>d|dire
v|Répondre|répondre>à;répliquer>à;rétorquer>d;riposter>à|
v|Acquiescer|hocher la tête>i;acquiescer>i;opiner>i;approuver>d;faire signe que oui>i;incliner la tête>i|
v|Se lever|se lever>i;se dresser>i;se redresser>i;se mettre debout>i;bondir>i;sursauter>i|
v|S'asseoir|s'asseoir>i;s'installer>i;prendre place>i;s'affaler>i;se laisser tomber>i;s'écrouler>i;se poser>i|
v|Saisir|saisir>d;attraper>d;empoigner>d;agripper>d;s'emparer>de;se saisir>de;prendre>d|prendre
v|Toucher|toucher>d;effleurer>d;frôler>d;caresser>d;palper>d;tâter>d|
v|Tenir, serrer|tenir>d;serrer>d;étreindre>d;agripper>d;empoigner>d;s'accrocher>à|
v|Frapper|frapper>d;cogner>d;heurter>d;marteler>d;tambouriner>sur;cogner>contre|
v|Jeter|jeter>d;lancer>d;balancer>d;projeter>d;envoyer>d;flanquer>d|
v|Ressentir|ressentir>d;éprouver>d;percevoir>d;sentir>d|
v|Voir|voir>d;apercevoir>d;remarquer>d;distinguer>d;repérer>d;discerner>d;constater>d|
v|Entendre|entendre>d;percevoir>d;discerner>d;capter>d;tendre l'oreille>vers|écouter
v|Attendre|attendre>d;patienter>i;guetter>d;ronger {p} frein>i;faire le pied de grue>i|
v|Courir|courir>i;filer>i;détaler>i;se précipiter>vers;s'élancer>vers;foncer>vers;dévaler>d|
v|Tomber|tomber>i;s'effondrer>i;s'écrouler>i;s'affaisser>i;chuter>i;dégringoler>i;s'étaler>i|
v|Parler|parler>à;s'adresser>à;discuter>avec;s'entretenir>avec;converser>avec;s'exprimer>i|
v|Penser|penser>à;songer>à;réfléchir>à;méditer>sur;ruminer>d|
v|Commencer|commencer>à;se mettre>à;se lancer>dans;entamer>d;amorcer>d;entreprendre>d|
v|Sembler|sembler>i;paraître>i;se montrer>i|
v|Rester|rester>i;demeurer>i;se tenir>i;se maintenir>i;persister>i|
v|Respirer|respirer>i;inspirer>i;prendre une inspiration>i;reprendre {p} souffle>i|
v|Ouvrir|ouvrir>d;entrouvrir>d;pousser>d;écarter>d;ouvrir en grand>d|
v|Fermer|fermer>d;refermer>d;claquer>d;verrouiller>d;rabattre>d|
n|Les yeux|regard~nm;prunelle~nf;pupille~nf;iris~nm|œil:yeux
n|Les yeux, familier|mirette~nf;quinquet~nm;châsse~nf|œil:yeux
n|Le regard, les yeux|yeux~nmp;prunelles~nfp;pupilles~nfp;iris~nm|regard
n|Le regard, l'expression|air~nm;expression~nf;mine~nf;lueur~nf|regard
n|Le regard, l'acte de regarder|coup d'œil~nm:coups d'œil;œillade~nf;examen~nm;contemplation~nf|regard
n|Le soupir|souffle~nm;expiration~nf;gémissement~nm;plainte~nf;murmure~nm;râle~nm|soupir
n|La bouche|lèvres~nfp|bouche
n|La bouche, familier|gueule~nf;bec~nm|bouche
n|Le visage|face~nf;figure~nf;traits~nmp;physionomie~nf;faciès~nm;tête~nf|visage
n|Le silence|calme~nm;quiétude~nf;mutisme~nm|silence
n|Le bruit fort|vacarme~nm;fracas~nm;tapage~nm;tumulte~nm;boucan~nm|bruit
n|Le bruit léger|son~nm;murmure~nm;bruissement~nm;froissement~nm;chuchotement~nm|bruit
n|La voix|ton~nm;timbre~nm;intonation~nf;organe~nm|voix
n|Un instant|seconde~nf;moment~nm;éclair~nm|instant
n|Un geste|mouvement~nm;signe~nm|geste
n|La peur|frayeur~nf;effroi~nm;terreur~nf;angoisse~nf;crainte~nf;épouvante~nf|peur
n|La colère|rage~nf;fureur~nf;courroux~nm;irritation~nf;emportement~nm|colère
n|La tristesse|chagrin~nm;peine~nf;mélancolie~nf;affliction~nf;désespoir~nm|tristesse
n|La lumière|clarté~nf;éclat~nm;lueur~nf;luminosité~nf;rayon~nm|lumière
n|L'ombre|obscurité~nf;pénombre~nf;ténèbres~nfp;noirceur~nf|ombre
a|Étonné|stupéfait;ébahi;médusé;sidéré;interdit;abasourdi;ahuri|étonné,surpris
a|Fatigué|épuisé;las;exténué;harassé;éreinté|fatigué
a|Triste|abattu;morose;sombre;mélancolique;accablé;chagriné|triste
a|Silencieux|muet;taciturne;mutique;discret|silencieux
x|Bouche bée|sans voix;la mâchoire pendante;interdit~a;médusé~a;stupéfait~a;sidéré~a;pétrifié~a;muet de stupeur~a|bouche bée
x|Bouche entrouverte|les lèvres entrouvertes;la bouche à demi ouverte;{pf} bouche légèrement ouverte;les lèvres à peine écartées;les lèvres légèrement écartées;la bouche semi-ouverte|bouche entrouverte,bouche ouverte,lèvres entrouvertes
x|En colère|furieux~a;furibond~a;excédé~a;irrité~a;hors de soi|en colère
x|Doucement|lentement;tendrement;avec douceur;en douceur;délicatement;calmement;posément|doucement
x|Lentement|doucement;posément;sans hâte;avec lenteur;à pas lents;calmement|lentement
x|Soudain|brusquement;tout à coup;d'un coup;subitement;soudainement;sans prévenir;en un instant|soudain
x|Puis|ensuite;alors;après quoi;peu après;un instant plus tard;à ce moment|puis,ensuite
x|Fixement|intensément;avec insistance;sans ciller;obstinément;longuement|fixement
x|Silencieusement|sans bruit;sans un mot;en silence;discrètement;à pas feutrés;dans un silence total|silencieusement
x|Rapidement|vite;promptement;en hâte;à toute vitesse;prestement;sans attendre|rapidement,vite
x|Très|extrêmement;terriblement;profondément;infiniment;grandement;fort|très
x|Un peu|légèrement;à peine;faiblement;vaguement;quelque peu|un peu
x|Encore|toujours;de nouveau;une fois de plus;à nouveau|encore
x|Peut-être|sans doute;probablement;éventuellement|peut-être
x|Tout de suite|aussitôt;immédiatement;sur-le-champ;sans attendre;illico|tout de suite
x|Longtemps|longuement;pendant un moment;un long moment;des heures|longtemps
`;
const SYN = { groups:null, open:false, tab:'alt', last:null, query:'', items:[], timer:null, repMode:'words', repMin:3, repOpen:null, repData:null, repTimer:null };
const SYN_ER = ['e','es','ent','ons','ez','ait','aient','ais','ant','é','ée','és','ées','a','èrent','er','era','erait','erai','eras','eront'];
function synEsc(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function synParse(){
  if(SYN.groups) return SYN.groups;
  SYN.groups = SYN_DB_TEXT.trim().split('\n').map(line=>{
    const p = line.split('|');
    const t = p[0], nuance = p[1], alts = (p[2]||'').split(';').filter(Boolean), heads = (p[3]||'').split(',').filter(Boolean);
    const items = alts.map(a=>{
      if(t==='v'){ const m=a.split('>'); return {text:m[0], cons:m[1]||'d', lemma:m[0]}; }
      if(t==='n'){ const q=a.split(':'), w=q[0].split('~'); return {text:w[0], tag:w[1]||'', pl:q[1]||'', lemma:w[0]}; }
      const w=a.split('~'); return {text:w[0], adj:w[1]==='a', lemma:w[0]};
    });
    const keys = [];
    heads.forEach(h=>h.split(':').forEach(k=>keys.push({k:k.replace(/^\^/,'').toLowerCase(), head:true})));
    if(!heads.length && items[0]) keys.push({k:items[0].lemma.toLowerCase(), head:true});
    items.forEach(i=>{ if(i.lemma.indexOf('{')<0) keys.push({k:i.lemma.toLowerCase(), head:false}); });
    return {t, nuance, items, keys};
  });
  return SYN.groups;
}
function synWordMatch(key, w){
  if(w===key) return true;
  const stem = (key.length>=6 && /(er|ir|re)$/.test(key)) ? key.slice(0,-2) : key;
  if(stem.length<5) return w===key || w===key+'s' || w===key+'x';
  return w.startsWith(stem) && w.length<=stem.length+5;
}
function synTokens(s){ return s.toLowerCase().split(/[^\p{L}'’-]+/u).filter(Boolean); }
function synMatch(key, q, toks){
  if(key.indexOf(' ')>=0) return q.indexOf(key)>=0 ? q.split(key).length-1 : 0;
  let n=0; for(const w of toks) if(synWordMatch(key,w)) n++; return n;
}
function synApplyCase(src, txt){
  return (src && src[0] && src[0]!==src[0].toLowerCase() && src[0]===src[0].toUpperCase()) ? txt.charAt(0).toUpperCase()+txt.slice(1) : txt;
}
/* Construit la forme à insérer pour une alternative, d'après le mot cliqué. */
function synForm(g, it, word, key){
  let t = it.text.replace(/\{p[sf]?\}/g, m=> m==='{pf}'?'sa':'son');
  if(g.t==='v'){
    if(key && key.length>=6 && /er$/.test(key) && !/^(se |s')/.test(it.text)){
      const stem = key.slice(0,-2), w = word.toLowerCase();
      if(w.startsWith(stem)){
        const end = w.slice(stem.length);
        if(SYN_ER.indexOf(end)>=0 && /er$/.test(it.text) && it.text.indexOf(' ')<0 && !/(ger|cer|yer|eler|eter)$/.test(it.text))
          return {txt: it.text.slice(0,-2)+end, ok:true};
        if(SYN_ER.indexOf(end)>=0 && /er$/.test(it.text) && it.text.indexOf(' ')>0 && it.text.indexOf('{')<0){
          const sp = it.text.indexOf(' '), v = it.text.slice(0,sp);
          if(/^[a-zéèêàâîïôûç]+er$/.test(v) && !/(ger|cer|yer|eler|eter)$/.test(v))
            return {txt: v.slice(0,-2)+end+it.text.slice(sp), ok:true};
        }
      }
    }
    return {txt:t, ok:false};
  }
  if(g.t==='n'){
    const plural = /[sx]$/i.test(word) && word.length>3;
    if(plural && !/p$/.test(it.tag)){ t = it.pl || (/[sxz]$/.test(t)?t:t+'s'); }
    return {txt:t, ok:true};
  }
  if(it.adj || g.t==='a'){
    if(/s$/i.test(word) && !/[sx]$/.test(t)) t+='s';
    if(/e$/i.test(word) && /[ué]$/.test(t) && !/e$/.test(t)) t+='e';
  }
  return {txt:t, ok:true};
}
function synLookup(q){
  const ql = q.toLowerCase().trim(), toks = synTokens(ql), out = [];
  if(!toks.length) return out;
  synParse().forEach(g=>{
    let best = null;
    g.keys.forEach(kk=>{
      if(synMatch(kk.k, ql, toks)){ if(!best || (kk.head && !best.head) || (kk.k.length>best.k.length && kk.head===best.head)) best = kk; }
    });
    if(!best) return;
    const w = best.k.indexOf(' ')>=0 ? best.k : (toks.find(x=>synWordMatch(best.k,x))||toks[0]);
    const list = g.items.filter(i=> i.lemma.toLowerCase()!==best.k && i.lemma.toLowerCase()!==ql).map(i=>{
      const f = synForm(g, i, w, best.k); return {g, it:i, txt:f.txt, ok:f.ok};
    });
    if(list.length) out.push({g, score:(best.head?2:1)+(best.k.indexOf(' ')>=0?1:0), list});
  });
  return out.sort((a,b)=>b.score-a.score).slice(0,8);
}
/* Contexte d'édition : ligne + bornes du mot sélectionné / sous le curseur. */
function synCtxFromSelection(){
  const page = document.getElementById('page'), sel = window.getSelection();
  if(!page || !sel || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if(!page.contains(r.startContainer)) return null;
  const sp = selectionSpan();
  if(!sp) return null;
  if(sp.multi) return {multi:true, text:sel.toString().slice(0,80)};
  const el = findEl(sp.a.dataset.id); if(!el) return null;
  const txt = el.text||''; let l=sp.aOff, rr=sp.bOff;
  if(l===rr){
    while(l>0 && /[\p{L}'’-]/u.test(txt[l-1])) l--;
    while(rr<txt.length && /[\p{L}'’-]/u.test(txt[rr])) rr++;
  }
  const word = txt.slice(l,rr).replace(/^['’-]+|['’-]+$/g,'');
  return {id:sp.a.dataset.id, l, r:rr, text:txt.slice(l,rr), word};
}
function synTrack(){
  const c = synCtxFromSelection();
  if(c && !c.multi && c.text) SYN.last = c;
  if(c && SYN.open && SYN.tab==='alt' && !document.activeElement.closest?.('#synPanel')){
    clearTimeout(SYN.timer);
    SYN.timer = setTimeout(()=>{ const d=synCtxFromSelection(); if(d && d.text && d.text!==SYN.query){ SYN.query=d.text; synRender(); } }, 220);
  }
}
document.addEventListener('selectionchange', synTrack);
// L'analyse suit le texte : on la recalcule 0,7 s après la dernière frappe.
document.addEventListener('input', ()=>{
  if(!SYN.open || SYN.tab !== 'rep') return;
  clearTimeout(SYN.repTimer);
  SYN.repTimer = setTimeout(()=>{ SYN.repData = null; synRender(); }, 700);
}, true);
function synCss(){
  if(document.getElementById('synStyle')) return;
  const st = document.createElement('style'); st.id='synStyle';
  st.textContent = `
  #synPanel{position:fixed; top:64px; right:16px; width:360px; max-height:calc(100vh - 88px); display:flex; flex-direction:column; z-index:260;
    background:var(--surface); color:var(--ink); border:1px solid var(--hair); border-radius:10px; box-shadow:0 1px 2px #0002, 0 16px 40px -12px #0005; font-family:var(--sans); overflow:hidden;}
  #synPanel .sy-h{display:flex; align-items:center; gap:10px; padding:14px 8px 8px 18px;}
  #synPanel .sy-h b{font:600 16px var(--sans); letter-spacing:-.005em; flex:1;}
  #synPanel .sy-x{width:30px; height:30px; display:grid; place-items:center; background:none; border:0; border-radius:50%; color:var(--ink-soft); cursor:pointer;}
  #synPanel .sy-x:hover{background:var(--surface-soft); color:var(--ink);}
  #synPanel .sy-tabs{display:flex; padding:0 10px; border-bottom:1px solid var(--hair);}
  #synPanel .sy-tab{flex:1; padding:11px 8px 10px; background:none; border:0; border-bottom:2px solid transparent; margin-bottom:-1px; color:var(--ink-soft); font:600 11.5px var(--sans); letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:color .12s;}
  #synPanel .sy-tab:hover{color:var(--ink);}
  #synPanel .sy-tab.on{color:var(--accent); border-bottom-color:var(--accent);}
  #synPanel .sy-q{position:relative; padding:12px 14px 4px;}
  #synPanel .sy-q svg{position:absolute; left:26px; top:50%; margin-top:-5px; color:var(--ink-soft); pointer-events:none;}
  #synPanel .sy-q input{width:100%; box-sizing:border-box; padding:9px 12px 9px 34px; border:1px solid transparent; background:var(--surface-soft); color:var(--ink); border-radius:8px; font:14px var(--sans); outline:none; transition:border-color .12s, background .12s;}
  #synPanel .sy-q input:focus{border-color:var(--accent); background:var(--surface);}
  #synPanel .sy-body{overflow:auto; padding:4px 14px 14px;}
  #synPanel .sy-g{margin-top:14px;}
  #synPanel .sy-gt{font:600 10.5px var(--sans); letter-spacing:.09em; text-transform:uppercase; color:var(--ink-soft); margin:0 0 7px 2px;}
  #synPanel .sy-chips{display:flex; flex-wrap:wrap; gap:6px;}
  #synPanel .sy-chip{padding:6px 11px; border:1px solid var(--hair); background:var(--surface); color:var(--ink); border-radius:6px; font:13.5px var(--sans); cursor:pointer; text-align:left; transition:border-color .1s, background .1s;}
  #synPanel .sy-chip:hover{border-color:var(--accent); background:var(--tag-chip-bg);}
  #synPanel .sy-chip small{color:var(--ink-soft); font-size:11px; margin-left:5px;}
  #synPanel .sy-chip.inf{border-style:dashed;}
  #synPanel .sy-empty,#synPanel .sy-hint{color:var(--ink-soft); font-size:12.5px; line-height:1.5; padding:12px 2px;}
  #synPanel .sy-empty{text-align:center; padding:28px 12px;}
  #synPanel .sy-ctl{display:flex; align-items:center; gap:10px; padding:12px 0 6px;}
  #synPanel .sy-seg{display:flex; flex:1; background:var(--surface-soft); border-radius:8px; padding:3px;}
  #synPanel .sy-seg button{flex:1; padding:6px 4px; border:0; background:none; border-radius:6px; color:var(--ink-soft); font:600 12px var(--sans); cursor:pointer;}
  #synPanel .sy-seg button.on{background:var(--surface); color:var(--ink); box-shadow:0 1px 2px #0003;}
  #synPanel .sy-min{display:flex; align-items:center; gap:6px; font-size:12px; color:var(--ink-soft);}
  #synPanel .sy-min select{border:1px solid var(--hair); background:var(--surface); color:var(--ink); border-radius:6px; padding:5px 6px; font:12.5px var(--sans);}
  #synPanel .sy-sum{font-size:12px; color:var(--ink-soft); padding:4px 2px 8px;}
  #synPanel .sy-row{display:block; width:100%; text-align:left; background:none; border:0; border-bottom:1px solid var(--hair); padding:9px 4px 8px; cursor:pointer; color:var(--ink); font:inherit;}
  #synPanel .sy-row:hover{background:var(--surface-soft);}
  #synPanel .sy-rl{display:flex; align-items:center; gap:8px;}
  #synPanel .sy-rw{flex:1; font:500 14px var(--sans); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
  #synPanel .sy-tag{font:600 9.5px var(--sans); letter-spacing:.06em; text-transform:uppercase; color:var(--accent); border:1px solid var(--accent); border-radius:3px; padding:1px 4px;}
  #synPanel .sy-rn{font:600 12.5px var(--sans); font-variant-numeric:tabular-nums; min-width:26px; text-align:right;}
  #synPanel .sy-ch{color:var(--ink-soft); transition:transform .15s;}
  #synPanel .sy-row.open .sy-ch{transform:rotate(90deg);}
  #synPanel .sy-bar{height:2px; background:var(--hair); border-radius:2px; margin-top:7px; overflow:hidden;}
  #synPanel .sy-bar i{display:block; height:100%; background:var(--accent); opacity:.7;}
  #synPanel .sy-occ{background:var(--surface-soft); border-bottom:1px solid var(--hair); padding:4px 0;}
  #synPanel .sy-oc{display:block; width:100%; text-align:left; background:none; border:0; padding:7px 12px; cursor:pointer; color:var(--ink); font:inherit;}
  #synPanel .sy-oc:hover{background:var(--tag-chip-bg);}
  #synPanel .sy-ow{font:600 10.5px var(--sans); color:var(--ink-soft); letter-spacing:.03em; margin-bottom:2px;}
  #synPanel .sy-ot{font-size:12.5px; line-height:1.4;}
  #synPanel .sy-ot mark{background:var(--tag-chip-bg); color:var(--accent); font-weight:700; border-radius:2px; padding:0 1px;}
  `;
  document.head.appendChild(st);
}
function synChip(i, r){
  const cons = (r.g.t==='v' && r.it.cons && r.it.cons!=='d' && r.it.cons!=='i') ? ' '+r.it.cons : '';
  const tag = r.g.t==='n' ? (r.it.tag?'<small>'+synEsc(r.it.tag.replace('nm','m.').replace('nf','f.').replace(/p$/,' pl.'))+'</small>':'') : '';
  return `<button class="sy-chip${r.ok?'':' inf'}" data-i="${i}" title="${r.ok?L('Remplacer dans le texte','Replace in the text'):L('Insère l’infinitif : à conjuguer','Inserts the infinitive: to be conjugated')}">${synEsc(r.txt)}${cons?'<small>'+synEsc(cons.trim())+'</small>':''}${tag}</button>`;
}
function synRender(){
  const p = document.getElementById('synPanel'); if(!p) return;
  const body = p.querySelector('.sy-body'); p.querySelectorAll('.sy-tab').forEach(t=>t.classList.toggle('on', t.dataset.tab===SYN.tab));
  p.querySelector('.sy-q').style.display = SYN.tab==='alt' ? '' : 'none';
  const inp = p.querySelector('.sy-q input'); if(inp && document.activeElement!==inp) inp.value = SYN.query;
  SYN.items = [];
  if(SYN.tab==='alt'){
    if(!SYN.query.trim()){ body.innerHTML = '<div class="sy-hint">'+L('Sélectionne un mot dans ton scénario (ou pose le curseur dedans), ou tape-le ci-dessus. Les alternatives sont classées par nuance.','Select a word in your screenplay (or place the cursor in it), or type it above. Alternatives are sorted by nuance.')+'</div>'; return; }
    const res = synLookup(SYN.query);
    if(!res.length){ body.innerHTML = '<div class="sy-empty">'+L('Aucune alternative pour « ','No alternative for “')+synEsc(SYN.query)+L(' » dans le dictionnaire pour l’instant.','” in the dictionary yet.')+'</div>'; return; }
    body.innerHTML = res.map(g=>`<div class="sy-g"><div class="sy-gt">${synEsc(g.g.nuance)}</div><div class="sy-chips">${g.list.map(r=>{ SYN.items.push(r); return synChip(SYN.items.length-1, r); }).join('')}</div></div>`).join('')
      + '<div class="sy-hint">'+L('Trait pointillé = l’infinitif est inséré, à conjuguer à la main.','Dotted line = the infinitive is inserted, to be conjugated by hand.')+'</div>';
  } else {
    body.innerHTML = synRepHtml();
  }
}
/* ---- Onglet Répétitions : analyse de tout le scénario ---- */
const SYN_STOP = new Set(('alors,aucun,aussi,autre,avait,avant,avec,avez,avoir,beaucoup,bien,cela,celle,celui,cependant,ces,cette,ceux,chaque,chez,comme,comment,dans,depuis,dont,donc,elle,elles,encore,entre,est,etaient,était,étaient,etre,être,eux,faire,fait,fois,font,hors,ici,ils,jamais,jusque,leur,leurs,lors,lui,mais,même,mes,moi,moins,mon,nous,notre,nos,oui,non,par,parce,pas,peu,plus,pour,pourquoi,puis,quand,que,quel,quelle,quelques,qui,quoi,sans,ses,sera,sera,seront,sont,sous,suis,sur,tes,toi,ton,tous,tout,toute,toutes,très,tres,une,vos,votre,vous,était,étais,êtes,ça,cet,déjà,ainsi,après,afin,car,celà,peut,veux,veut,faut,vais,vas,allez,rien,quelque,the,and,that,this,with,from,have,has,had,was,were,are,you,your,for,not,but,they,them,their,his,her,she,him,its,what,when,where,who,will,would,there,here,been,into,than,then,just,out,all,can,could,about,over,some,very').split(','));
function synRepScan(){
  const p = S.project, numbers = sceneNumbers(), pageOf = (S.pagination && S.pagination.pageOf) || {};
  const SKIP = {scene:1, character:1, note:1, shot:1, transition:1};
  const words = {}, near = {}, units = [];
  let sceneNo = '', gi = 0;
  p.elements.forEach(el=>{
    if(el.type === 'scene'){ sceneNo = numbers[el.id] != null ? String(numbers[el.id]) : ''; return; }
    if(SKIP[el.type] || !el.text) return;
    const toks = [], re = /\p{L}[\p{L}'’-]*/gu; let m;
    while((m = re.exec(el.text))){
      const w = m[0].replace(/^['’-]+|['’-]+$/g, '');
      toks.push({ w:w.toLowerCase(), off:m.index, len:m[0].length, g:gi++ });
    }
    units.push({ el, toks, sc:sceneNo, pg:pageOf[el.id] });
  });
  const stem = w=> (w.length > 4 && /[sx]$/.test(w)) ? w.slice(0, -1) : w;
  const okWord = w=> w.length >= 4 && !SYN_STOP.has(w);
  const add = (map, key, surf, u, t, len)=>{
    const e = map[key] || (map[key] = { k:key, forms:{}, occ:[] });
    e.forms[surf] = (e.forms[surf] || 0) + 1;
    e.occ.push({ id:u.el.id, off:t.off, len, sc:u.sc, pg:u.pg, g:t.g });
  };
  const phr = {};
  units.forEach(u=>{
    u.toks.forEach((t, i)=>{
      if(okWord(t.w)) add(words, stem(t.w), t.w, u, t, t.len);
      for(const n of [2, 3]){
        const e = u.toks[i + n - 1]; if(!e) continue;
        if(!okWord(t.w) || !okWord(e.w)) continue;
        const raw = u.el.text.slice(t.off, e.off + e.len);
        add(phr, u.toks.slice(i, i + n).map(x=>x.w).join(' '), raw.toLowerCase(), u, t, raw.length);
      }
    });
  });
  const fin = map=> Object.values(map).map(e=>{
    e.label = Object.keys(e.forms).sort((a, b)=>e.forms[b] - e.forms[a])[0];
    e.n = e.occ.length; return e;
  });
  const W = fin(words), P = fin(phr);
  // Échos : même mot à moins de 30 mots d'écart.
  W.forEach(e=>{
    let c = 0; for(let i = 1; i < e.occ.length; i++) if(e.occ[i].g - e.occ[i-1].g <= 30) c++;
    e.near = c;
  });
  return { W, P, total: units.reduce((s, u)=>s + u.toks.length, 0) };
}
function synRepList(){
  const d = SYN.repData || (SYN.repData = synRepScan()), min = SYN.repMin;
  let list;
  if(SYN.repMode === 'near') list = d.W.filter(e=>e.near >= 1 && e.n >= 2).sort((a, b)=>b.near - a.near || b.n - a.n);
  else if(SYN.repMode === 'phr'){
    list = d.P.filter(e=>e.n >= Math.max(2, min - 1));
    // une expression de 2 mots incluse dans une de 3 mots de même fréquence est redondante
    list = list.filter(e=> e.k.split(' ').length === 3 || !list.some(o=>o !== e && o.k.indexOf(e.k) >= 0 && o.n >= e.n));
    list.sort((a, b)=>b.n - a.n || b.k.length - a.k.length);
  } else list = d.W.filter(e=>e.n >= min).sort((a, b)=>b.n - a.n);
  return list.slice(0, 40);
}
function synRepSnippet(o, el){
  const t = el.text || '', a = Math.max(0, o.off - 38), b = Math.min(t.length, o.off + o.len + 38);
  return (a > 0 ? '… ' : '') + synEsc(t.slice(a, o.off)) + '<mark>' + synEsc(t.slice(o.off, o.off + o.len)) + '</mark>' + synEsc(t.slice(o.off + o.len, b)) + (b < t.length ? ' …' : '');
}
function synRepHtml(){
  const mode = SYN.repMode, list = synRepList(), d = SYN.repData;
  const seg = [['words', L('Mots','Words')], ['phr', L('Expressions','Phrases')], ['near', L('Échos','Echoes')]]
    .map(([k, t])=>`<button data-rm="${k}" class="${mode===k?'on':''}">${t}</button>`).join('');
  const sel = mode === 'near' ? '' : `<label class="sy-min">${L('Min.','Min.')}<select data-rmin="1">${[2,3,4,5,6].map(n=>`<option value="${n}"${SYN.repMin===n?' selected':''}>${n}×</option>`).join('')}</select></label>`;
  const hint = mode === 'near' ? L('Mots qui reviennent à moins de 30 mots d\u2019écart : les échos les plus audibles à la lecture.', 'Words that come back within 30 words: the echoes you hear most when reading.')
    : mode === 'phr' ? L('Suites de 2 ou 3 mots qui reviennent dans le scénario.', 'Two- or three-word sequences that recur in the script.')
    : L('Mots pleins les plus répétés (les mots-outils sont ignorés ; singulier et pluriel regroupés). Noms de scène et de personnage exclus.', 'Most repeated content words (function words ignored; singular and plural merged). Scene headings and character names excluded.');
  let rows;
  if(!list.length) rows = `<div class="sy-empty">${L('Aucune répétition à ce seuil.', 'No repetition at this threshold.')}<br>${L('Baisse le minimum ou change de vue.', 'Lower the minimum or switch view.')}</div>`;
  else {
    const max = list[0].n || 1, big = mode === 'near' ? e=>e.near : e=>e.n;
    const maxv = Math.max(...list.map(big));
    rows = list.map(e=>{
      const open = SYN.repOpen === mode + ':' + e.k;
      let occ = '';
      if(open) occ = '<div class="sy-occ">' + e.occ.slice(0, 40).map(o=>{
        const el = findEl(o.id); if(!el) return '';
        const where = (o.sc ? L('Sc.', 'Sc.') + ' ' + o.sc : L('Hors scène', 'No scene')) + (o.pg ? ' · p.' + synEsc(pageLbl(o.pg)) : '');
        return `<button class="sy-oc" data-jump="${o.id}|${o.off}|${o.len}"><div class="sy-ow">${synEsc(where)}</div><div class="sy-ot">${synRepSnippet(o, el)}</div></button>`;
      }).join('') + (e.occ.length > 40 ? `<div class="sy-hint" style="padding:6px 12px;">+ ${e.occ.length - 40}</div>` : '') + '</div>';
      return `<button class="sy-row${open?' open':''}" data-rk="${synEsc(e.k)}"><div class="sy-rl"><span class="sy-rw">${synEsc(e.label)}</span>${mode==='words'&&e.near>=3?`<span class="sy-tag" title="${L('Revient souvent à moins de 30 mots','Often within 30 words')}">${L('proches','close')}</span>`:''}<span class="sy-rn">${mode==='near'?e.near+'×':e.n+'×'}</span><svg class="sy-ch" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 1.5 6.5 5 3 8.5"/></svg></div><div class="sy-bar"><i style="width:${Math.max(6, Math.round(big(e) / maxv * 100))}%"></i></div></button>${occ}`;
    }).join('');
  }
  return `<div class="sy-ctl"><div class="sy-seg">${seg}</div>${sel}</div>
    <div class="sy-sum">${L('Analyse de', 'Analysis of')} ${d.total.toLocaleString()} ${L('mots · clique un mot pour voir où il revient', 'words · click an entry to see where it recurs')}</div>${rows}<div class="sy-hint">${hint}</div>`;
}
function synJump(id, off, len){
  const div = document.querySelector('#page [data-id="' + id + '"]'); if(!div) return;
  div.scrollIntoView({ block:'center', behavior:'smooth' });
  try{
    const tn = div.firstChild;
    if(tn && tn.nodeType === 3){
      const r = document.createRange(); r.setStart(tn, Math.min(off, tn.length)); r.setEnd(tn, Math.min(off + len, tn.length));
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  }catch(e){}
  div.classList.add('hl'); setTimeout(()=>div.classList.remove('hl'), 1600);
}
function synReplace(i){
  const r = SYN.items[i], c = SYN.last; if(!r || !c){ toast('Sélectionne d’abord un mot dans le scénario.'); return; }
  const div = document.querySelector('#page [data-id="'+c.id+'"]'), el = findEl(c.id);
  if(!div || !el){ toast('Mot introuvable.'); return; }
  if((el.text||'').slice(c.l,c.r)!==c.text){ toast('Le texte a changé : re-sélectionne le mot.'); return; }
  const txt = synApplyCase(c.text, r.txt);
  if(applyRangeEdit({a:div, b:div, aOff:c.l, bOff:c.r}, txt)){
    SYN.last = {id:c.id, l:c.l, r:c.l+txt.length, text:txt, word:txt};
    SYN.query = txt;
    if(!r.ok) toast('Infinitif inséré : pense à le conjuguer.');
    synRender();
  }
}
function openSynonyms(){
  synCss();
  let p = document.getElementById('synPanel');
  if(!p){
    p = document.createElement('div'); p.id='synPanel';
    p.innerHTML = `<div class="sy-h"><b>${L('Synonymes','Synonyms')}</b><button class="sy-x" data-close="1" title="${L('Fermer (Échap)','Close (Esc)')}"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2 2l10 10M12 2 2 12"/></svg></button></div>
      <div class="sy-tabs"><button class="sy-tab on" data-tab="alt">${L('Alternatives','Alternatives')}</button><button class="sy-tab" data-tab="rep">${L('Répétitions','Repetitions')}</button></div>
      <div class="sy-q"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="5.5" cy="5.5" r="4"/><path d="M8.6 8.6 12 12"/></svg><input type="text" placeholder="${L('Un mot ou une expression…','A word or phrase…')}" autocomplete="off" spellcheck="false"></div>
      <div class="sy-body"></div>`;
    document.body.appendChild(p);
    p.addEventListener('mousedown', e=>{ if(!e.target.closest('input,select')) e.preventDefault(); });
    p.addEventListener('click', e=>{
      const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.close){ closeSynonyms(); }
      else if(b.dataset.tab){ SYN.tab=b.dataset.tab; if(SYN.tab==='rep') SYN.repData=null; synRender(); }
      else if(b.dataset.rm){ SYN.repMode=b.dataset.rm; SYN.repOpen=null; synRender(); }
      else if(b.dataset.rk){ const key=SYN.repMode+':'+b.dataset.rk; SYN.repOpen = SYN.repOpen===key ? null : key; synRender(); }
      else if(b.dataset.jump){ const j=b.dataset.jump.split('|'); synJump(j[0], +j[1], +j[2]); }
      else if(b.dataset.i!==undefined){ synReplace(+b.dataset.i); }
    });
    p.addEventListener('change', e=>{ if(e.target.dataset && e.target.dataset.rmin){ SYN.repMin = +e.target.value; SYN.repOpen = null; synRender(); } });
    p.querySelector('input').addEventListener('input', e=>{ SYN.query = e.target.value; synRender(); });
  }
  SYN.open = true;
  const c = synCtxFromSelection();
  if(c && !c.multi && c.text){ SYN.last = c; }
  if(c && c.multi){ SYN.query = c.text; } else if(SYN.last) SYN.query = SYN.last.text;
  SYN.tab='alt'; synRender();
}
function closeSynonyms(){ const p=document.getElementById('synPanel'); if(p) p.remove(); SYN.open=false; }
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && e.shiftKey && e.key.toLowerCase()==='y'){ e.preventDefault(); if(SYN.open) closeSynonyms(); else if(S.tab==='editor') openSynonyms(); }
  else if(e.key==='Escape' && SYN.open && !document.getElementById('tbMoreMenu')){ closeSynonyms(); }
}, true);
ACTIONS.openSynonyms = openSynonyms;

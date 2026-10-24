/* =====================================================================
   MOTEUR DE PAGINATION
   ---------------------------------------------------------------------
   Découpe un flux de lignes en pages réelles (A4 ou Letter) en mesurant
   les hauteurs rendues, exactement comme le fera l'impression.

   Principe : on ne coupe jamais un bloc en deux. Si un bloc ne tient pas
   dans ce qu'il reste de la page, il est rejeté en entier au sommet de la
   page suivante. Deux règles de typographie de scénario en plus :
     - une entête de scène ou un nom de personnage ne reste jamais seul en
       bas d'une page (règle « solidaire du bloc suivant ») ;
     - un bloc plus haut qu'une page entière est laissé tel quel (on ne
       peut pas mieux faire sans couper le texte), la pagination reprend
       après lui.
===================================================================== */
const PAGE_GAP = 26;                                   // gouttière visuelle entre deux feuilles (px écran)
const KEEP_WITH_NEXT = new Set(['scene','character','parenthetical','shot']);
/* Blocs qu'on a le droit de couper entre deux pages (au moins 2 lignes de chaque côté). */
const SPLITTABLE = new Set(['dialogue','action','text']);
/* Fins de phrase d'un bloc (pour couper « comme WriterDuet », même au milieu d'une ligne).
   Renvoie [{idx, ln, right}] : idx = index du caractère qui suit la ponctuation (et ses guillemets fermants),
   ln = ligne visuelle (0 = première) où elle tombe, right = abscisse (px, dans la boîte de contenu) de son bord droit. */
const SENT_ABBR = /(?:^|[\s(«"'“—–-])(?:M|MM|Mme|Mmes|Mlle|Mr|Dr|Dre|Pr|St|Ste|Me|Cie|etc|vs|n°|p|ex|cf)$/i;
function sentenceBreaks(div, lh1, pT){
  const out = [];
  try{
    const nodes = []; let full = '';
    const tw = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
    let nd; while((nd = tw.nextNode())){ nodes.push({nd, start: full.length}); full += nd.nodeValue; }
    if(!full) return out;
    const cs = getComputedStyle(div);
    const dr = div.getBoundingClientRect();
    const sc = (dr.height / (div.offsetHeight || 1)) || 1;
    const padL = parseFloat(cs.paddingLeft) || 0, bL = parseFloat(cs.borderLeftWidth) || 0;
    const re = /([.!?…]+)(["'»”’)\]]*)(?=\s+["'«“(\[—–-]?\s*[A-ZÀ-ÝŒ0-9])/g;
    const rg = document.createRange();
    let mt;
    while((mt = re.exec(full))){
      if(mt[1] === '.' && SENT_ABBR.test(full.slice(0, mt.index))) continue;
      const idx = mt.index + mt[0].length, last = idx - 1;
      let hit = null;
      for(let q = nodes.length - 1; q >= 0; q--){ if(nodes[q].start <= last){ hit = nodes[q]; break; } }
      if(!hit) continue;
      const off = last - hit.start;
      rg.setStart(hit.nd, off); rg.setEnd(hit.nd, off + 1);
      const r = rg.getClientRects()[0];
      if(!r) continue;
      const ln = Math.floor(((r.top + r.height / 2) - dr.top - pT * sc) / (lh1 * sc));
      if(ln < 0) continue;
      out.push({ idx, ln, right: (r.right - dr.left) / sc - padL - bL });
    }
  }catch(e){}
  return out;
}
/* Nombre de lignes qu'occuperait un texte seul dans un bloc de même mise en forme que `div`. */
function probeLines(div, text, lh1, pT, pB){
  const pr = div.cloneNode(false);
  pr.removeAttribute('data-id'); pr.removeAttribute('id'); pr.removeAttribute('contenteditable');
  pr.classList.remove('is-split', 'is-split-mid', 'is-pagetop');
  pr.style.marginTop = '0'; pr.style.visibility = 'hidden'; pr.textContent = text;
  div.parentNode.appendChild(pr);
  const n = Math.round((pr.offsetHeight - pT - pB) / lh1);
  pr.remove();
  return n;
}
function contdMarkWord(){
  const st = S.project && S.project.settings;
  return (st && st.contdMark==='suite') ? '(SUITE)' : (st && st.contdMark==='contd') ? "(CONT'D)" : L('(SUITE)', "(CONT'D)");
}
function moreMarkWord(){
  /* (MORE) / (SUITE) en bas de page : suit le même réglage que (CONT'D) / (SUITE)
     en haut de la page suivante, pour ne jamais mélanger « (SUITE) » et « NOM (CONT'D) ». */
  const st = S.project && S.project.settings;
  return (st && st.contdMark==='contd') ? '(MORE)' : (st && st.contdMark==='suite') ? '(SUITE)' : L('(SUITE)','(MORE)');
}

/* Géométrie d'une page, mesurée sur le conteneur lui-même : on déduit
   l'échelle px/cm de sa largeur réelle, ce qui reste juste quelle que soit
   la résolution, le zoom navigateur ou le format choisi. */
function pageGeometry(container, format){
  const cs = getComputedStyle(container);
  const inner = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const total = inner + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const ratio = format === 'us' ? (11 / 8.5) : (29.7 / 21);
  const pageH = total * ratio;
  const mTop = parseFloat(cs.paddingTop) || 0;
  const mBottom = parseFloat(cs.paddingBottom) || 0;
  return { pageH, mTop, mBottom, contentH: Math.max(60, pageH - mTop - mBottom) };
}

/* Calcule les sauts de page d'un conteneur de lignes.
   Si `apply` est vrai, la marge haute des blocs rejetés est écrite dans le
   DOM (mode éditeur). Sinon on se contente de renvoyer la répartition
   (mode export/statistiques).
   Renvoie { pageCount, pages:[[element,…],…], pageOf:{idElement:numéro} }. */
/* Associe un bloc mesuré à sa page. Un bloc de dialogue simultané n'a pas
   d'identifiant propre (c'est un conteneur) : ce sont les deux répliques
   qu'il contient qui doivent recevoir le numéro de page, sinon elles
   disparaîtraient de l'indicateur de page, du navigateur de scènes et des
   rapports. */
function mapPageIds(div, pageOf, pageNo){
  if(div.dataset && div.dataset.id) pageOf[div.dataset.id] = pageNo;
  if(div.classList && div.classList.contains('dual-wrap')){
    div.querySelectorAll('[data-id]').forEach(n=>{ pageOf[n.dataset.id] = pageNo; });
  }
}
/* ---- Verrouillage des pages (12A, 12B) ----
   p.pageLock = { pages:[{label, first}] } : à chaque page figée on garde son
   numéro et l'id du premier bloc qui COMMENCE sur elle (l'ancre). La
   pagination force un saut de page devant chaque ancre : une page révisée
   ne déborde plus sur la suivante, elle s'allonge en 12A, 12B. */
function pageLockSet(proj){
  proj = proj || S.project;
  const pl = proj && proj.pageLock;
  if(!pl || !Array.isArray(pl.pages) || !pl.pages.length) return null;
  const s = new Set(); pl.pages.forEach(x=>{ if(x.first) s.add(x.first); });
  return s.size ? s : null;
}
function plKey(d){
  if(!d) return '';
  if(d.dataset && d.dataset.id) return d.dataset.id;
  const n = d.querySelector && d.querySelector('[data-id]');
  return n ? n.dataset.id : '';
}
function plNextLabel(prev){
  const m = /^(\d+)([A-Z]*)$/.exec(String(prev));
  if(!m) return prev + 'A';
  const a = m[2].split('');
  if(!a.length) return m[1] + 'A';
  let i = a.length - 1;
  while(i >= 0){ if(a[i] === 'Z'){ a[i] = 'A'; i--; } else { a[i] = String.fromCharCode(a[i].charCodeAt(0) + 1); break; } }
  if(i < 0) a.unshift('A');
  return m[1] + a.join('');
}
/* Pour une page : id de son premier bloc (ancre) ou, si elle ne fait que
   prolonger un bloc coupé de la page précédente, id de ce bloc (suite). */
function plInfo(pages, k){
  const pg = pages[k] || [], key = plKey(pg[0]);
  if(k === 0) return { key, ckey:'' };
  const prev = new Set(pages[k-1].map(plKey).filter(Boolean));
  const c = pg.map(plKey).find(x=> x && prev.has(x));
  if(c && (!key || key === c)) return { key:'', ckey:c };
  return { key, ckey:'' };
}
/* Pages sans numéro (voir js/33-free-pages.js) : une feuille l'est si son premier bloc appartient à une
   page sans numéro (data-fpg). Une feuille traversée par un bloc géant (vide) suit la précédente. */
function pageFreeFlags(pages){
  const out = []; let prev = false;
  pages.forEach(pg => {
    const d = pg.find(x => x && x.dataset && !x.classList.contains('pg-mark'));
    const f = d ? !!d.dataset.fpg : prev;
    out.push(f); prev = f;
  });
  return out;
}
/* Numéro affiché de chaque page + pages figées qui n'existent plus (omises).
   Les pages sans numéro reçoivent un libellé vide et ne comptent pas : la numérotation (et le verrouillage
   12A, 12B) ne voit que les autres pages, comme si elles n'existaient pas. `free[k]` les signale,
   `firstNum` est l'indice de la première page numérotée (celle de « Numéroter aussi la première page »). */
function computePageLabels(pages, proj){
  const free = pageFreeFlags(pages);
  if(!free.some(Boolean)) return Object.assign(pageLabelsCore(pages, proj), { free, firstNum:0 });
  const keep = []; pages.forEach((pg, k) => { if(!free[k]) keep.push(k); });
  const r = pageLabelsCore(keep.map(k => pages[k]), proj), labels = pages.map(() => '');
  keep.forEach((k, q) => { labels[k] = r.labels[q]; });
  return { labels, omitted: r.omitted, free, firstNum: keep.length ? keep[0] : -1 };
}
/* Le numéro de la page k est-il imprimé ? (mêmes règles dans l'éditeur, l'impression et le PDF) */
function pageNumShown(PLB, k, st){
  return !PLB.free[k] && !!st.showPageNumbers && (k !== PLB.firstNum || !!st.numberFirstPage);
}
function pageLabelsCore(pages, proj){
  proj = proj || S.project;
  /* Numéro de la page 1 (qu'elle l'affiche ou non) : 1 par défaut, donc la page 2 porte le n° 2. 0 est permis (la page 2 porte alors le n° 1). */
  const ps = ensureSettings(proj).pageNumberStart, start = (typeof ps === 'number' && isFinite(ps)) ? ps : 1, pl = proj.pageLock;
  if(!pl || !Array.isArray(pl.pages) || !pl.pages.length)
    return { labels: pages.map((_, k)=> String(start + k)), omitted: [] };
  const idx = {}, cidx = {};
  pl.pages.forEach((x, i)=>{
    if(x.first) idx[x.first] = i;
    else if(x.cont){ (cidx[x.cont] = cidx[x.cont] || []).push(i); }
  });
  const used = new Set(), labels = []; let prev = null;
  pages.forEach((pg, k)=>{
    const inf = plInfo(pages, k);
    let lab = null;
    if(inf.key && idx[inf.key] !== undefined && !used.has(idx[inf.key])){ lab = pl.pages[idx[inf.key]].label; used.add(idx[inf.key]); }
    else if(inf.ckey && cidx[inf.ckey]){
      const q = cidx[inf.ckey].find(i=>!used.has(i));
      if(q !== undefined){ lab = pl.pages[q].label; used.add(q); }
    }
    if(lab === null && k === 0){ lab = pl.pages[0].label; used.add(0); }
    if(lab === null) lab = plNextLabel(prev);
    labels.push(lab); prev = lab;
  });
  return { labels, omitted: pl.pages.filter((x, i)=>!used.has(i)).map(x=>x.label) };
}
function pageLbl(n){ const l = S.pagination && S.pagination.labels; if(l && l[n-1] === '') return '–'; return (l && l[n-1]) || String(n); }   // page sans numéro : un tiret, aussi court qu'un numéro
function plLock(p){
  const res = measureExportPages(p), PLB = computePageLabels(res.pages, p), pages = [];
  const np = res.pages.filter((_, k) => !PLB.free[k]), labels = PLB.labels.filter((_, k) => !PLB.free[k]);   // les pages sans numéro ne sont pas figées
  np.forEach((pg, k)=>{
    if(!pg.length) return;
    const inf = plInfo(np, k);
    pages.push({ label: labels[k], first: inf.key || '', cont: inf.ckey || '' });
  });
  p.pageLock = { pages, date: Date.now(), std: true };
}
/* ---------------------------------------------------------------------
   v44 — PAGINATION ALIGNÉE SUR PageRenderer.js
   Mêmes règles, dans le même ordre de décision :
   · un bloc « Personnage » = nom + didascalies + répliques, posé d'un seul tenant ;
   · s'il ne tient pas : coupe la plus basse possible, ENTRE deux répliques (la réplique du
     haut doit faire ≥ 2 lignes) ou DANS une réplique (≥ 2 lignes de chaque côté), avec
     (MORE) en bas et NOM (CONT'D) en haut de la page suivante ;
   · sinon le bloc entier passe à la page suivante, sans (CONT'D) ;
   · une entête de scène ne reste en bas de page que si ≥ 2 lignes du bloc suivant tiennent
     dessous (1 ligne si c'est une autre entête ou une transition), sinon saut AVANT l'entête ;
     une entête restée seule après un report est emmenée avec le bloc ;
   · action / transition / texte : posés entiers, sinon coupés (≥ 2 lignes de chaque côté),
     sinon reportés ; coupe au mot qui tient (jamais « à la fin de phrase ») ;
   · tolérance de 1 px sous la hauteur utile (PAGE_EPS), aucune ligne dans la marge basse.
--------------------------------------------------------------------- */
const PAGE_EPS = 1;
const SPLIT_C = new Set(['action','text','dialogue','parenthetical','transition','shot']);
function computePagination(container, format, apply, proj, inc){
  const allLines = (inc && inc.allLines) || Array.from(container.children).filter(n => n.classList && n.classList.contains('line'));
  const lines = (inc && inc.cur) || allLines.filter(n => n.dataset.type !== 'note');   // v49 : les notes sont hors flux (voir .line--note)
  /* MODE INCRÉMENTAL (inc) : au lieu de tout remesurer, on ne traite qu'une FENÊTRE de lignes, qui commence
     au début d'une page propre (rien n'y dépend de ce qui précède) et qui est assez longue pour que les sauts
     de page se recalent sur l'ancien découpage. Les lignes hors fenêtre ne sont ni effacées, ni mesurées, ni
     réécrites. Le calcul lui-même est strictement le même que pour le scénario entier. */
  let win = lines, winAll = allLines, savedState = null;
  const CLEAR = d => { d.style.marginTop = ''; d.classList.remove('is-pagetop'); if(d.classList.contains('is-split')){ d.classList.remove('is-split', 'is-split-mid'); d.style.removeProperty('--sp-top'); d.style.removeProperty('--sp-h'); d.style.removeProperty('--sp-x'); d.style.removeProperty('--sp-y1'); } };
  const SPV = ['--sp-top', '--sp-h', '--sp-x', '--sp-y1'];
  if(inc && lines.length){
    win = lines.slice(inc.from, inc.to);
    const a0 = allLines.indexOf(win[0]), a1 = allLines.indexOf(win[win.length - 1]);
    winAll = allLines.slice(a0, a1 + 1);
    savedState = inc.saved;                                    // état d'origine, conservé d'une tentative à l'autre
    winAll.forEach(d => {
      if(inc.seen.has(d)) return; inc.seen.add(d);
      const mt = d.style.marginTop, pt = d.classList.contains('is-pagetop'), sp = d.classList.contains('is-split');
      if(mt || pt || sp) savedState.set(d, { mt, pt, sp, spm: d.classList.contains('is-split-mid'), vars: SPV.map(v => d.style.getPropertyValue(v)) });
    });
  }
  if(apply) winAll.forEach(CLEAR);
  if(!lines.length) return { pageCount:1, pages:[[]], pageOf:{}, spill:{}, geo:pageGeometry(container, format) };

  const geo = pageGeometry(container, format);
  // Signature de la géométrie relue ICI, pendant que la mise en page est encore à jour : la relire après
  // l'écriture des marges forçait le navigateur à refaire toute la mise en page une fois de plus.
  const sig = apply ? pgSignature(container) : '';
  const contentH = geo.contentH;
  // Carton « page entière » : sa boîte fait exactement la hauteur utile d'une feuille.
  win.forEach(d => { if(d.classList.contains('line--card')) d.style.minHeight = (d.dataset.full === '1') ? Math.floor(contentH - 2) + 'px' : ''; });
  const dead = geo.mBottom + PAGE_GAP + geo.mTop;   // espace mort entre deux zones de texte
  const step = contentH + dead;

  // Une seule passe de lecture : position et hauteur réelles de chaque ligne (marges fusionnées comprises).
  // v45 : mesures FRACTIONNAIRES (getBoundingClientRect) au lieu des entiers d'offsetTop/offsetHeight.
  // Un carton (22 pt x 1,35 = 39,6 px) arrondi à 40 px décalait chaque carton de 0,4 px : après quelques
  // cartons, le haut des pages dérivait et la pagination « cassait ».
  const r0 = win[0].getBoundingClientRect();
  const cssW = parseFloat(getComputedStyle(container).width);   // largeur CSS exacte (offsetWidth est arrondi)
  const sc0 = (cssW > 0) ? (container.getBoundingClientRect().width / cssW) : 1;
  const scl = (isFinite(sc0) && sc0 > 0 && Math.abs(sc0 - 1) > 0.002) ? sc0 : 1;
  const base0 = (r0.top - container.getBoundingClientRect().top) / scl;   // v49 : fractionnaire aussi (offsetTop est arrondi : 0,5 px d'erreur sur toute la page)
  const m = win.map(d => {
    const r = d.getBoundingClientRect();
    if(!(r.height > 0)) return { d, top:d.offsetTop, h:d.offsetHeight };
    return { d, top: base0 + (r.top - r0.top) / scl, h: r.height / scl };
  });
  const lh = parseFloat(getComputedStyle(lines[0]).lineHeight);
  const oneLine = (isFinite(lh) && lh > 0) ? lh : 20;
  const stg = S.project && S.project.settings; const marksOn = !!(stg && stg.autoContd);
  const lockSet = pageLockSet(proj);
  const MORE_H = marksOn ? oneLine : 0;

  const typ = i => m[i].d.dataset.type;
  const gapOf = i => i === 0 ? 0 : Math.max(0, m[i].top - (m[i-1].top + m[i-1].h));
  const hOv = {};                                   // hauteur du RESTE d'une ligne coupée
  const hOf = i => hOv[i] !== undefined ? hOv[i] : m[i].h;
  const isLock = i => !!(lockSet && lockSet.has(plKey(m[i].d)));
  const fk = i => m[i].d.dataset.fpg || '';           // page sans numéro à laquelle appartient la ligne ('' = scénario)
  let lastFk = '';

  // ---- Blocs logiques (comme _buildBlockQueue) ----
  const dq = [];
  for(let i = 0; i < m.length;){
    if(typ(i) === 'character'){
      const ls = [i]; i++;
      while(i < m.length && (typ(i) === 'parenthetical' || typ(i) === 'dialogue') && !isLock(i) && fk(i) === fk(ls[0])){ ls.push(i); i++; }
      dq.push({ type:'character', lines:ls, cue:false });
    } else { dq.push({ type:typ(i), lines:[i] }); i++; }
  }

  // ---- État ----
  const startPg = inc ? inc.startPage : 0;
  const pages = [], pgIdx = [], filled = [];
  pages[startPg] = []; pgIdx[startPg] = []; filled[startPg] = false;
  const pageOf = {}, spill = {}, splits = [], breaks = [], splitWrites = [];
  const topOf = [], domBottom = [], firstOfPage = [];
  let pageIdx = startPg, y = startPg * step;
  const pageTop = () => pageIdx * step;
  const limit = () => pageIdx * step + contentH + PAGE_EPS;
  const ensure = k => { if(!pages[k]){ pages[k] = []; pgIdx[k] = []; filled[k] = false; } };
  const newPage = () => { pageIdx++; ensure(pageIdx); y = pageIdx * step; };
  const firstTop = (i, pad) => filled[pageIdx] ? y + gapOf(i) : pageTop() + pad;
  const extent = (ls, first) => {
    const tops = []; let pb = 0;
    ls.forEach((i, q) => { const t = q === 0 ? first : pb + gapOf(i); tops.push(t); pb = t + hOf(i); });
    return { tops, bottom: pb };
  };
  const commit = (ls, tops, contLine) => {
    const atTop = !filled[pageIdx];
    ls.forEach((i, q) => {
      if(i !== contLine){ topOf[i] = tops[q]; firstOfPage[i] = (q === 0 && atTop); }
      domBottom[i] = tops[q] + hOf(i);
      pages[pageIdx].push(m[i].d); pgIdx[pageIdx].push(i);
    });
    filled[pageIdx] = true; y = domBottom[ls[ls.length - 1]]; lastFk = fk(ls[ls.length - 1]);
  };
  // Changement de page parce que le bloc courant est reporté en entier (_breakPage) :
  // une entête de scène restée seule en bas de page est emmenée avec lui.
  const breakPage = (why, type, need) => {
    const pg = pgIdx[pageIdx];
    const carry = (pg.length > 1 && typ(pg[pg.length - 1]) === 'scene') ? pg[pg.length - 1] : -1;
    breaks.push({ to: pageIdx + 2, why, free: Math.max(0, limit() - y), need: need || 0, type });
    if(carry >= 0){ pg.pop(); pages[pageIdx].pop(); }
    newPage();
    if(carry >= 0) commit([carry], [pageTop()]);
  };
  // Bloc plus haut qu'une page, impossible à couper : il déborde sur les feuilles suivantes.
  const spillLoop = () => {
    let g = 0;
    while(y > pageIdx * step + contentH + PAGE_EPS && g++ < 500){ pageIdx++; ensure(pageIdx); filled[pageIdx] = true; spill[pageIdx] = true; }
  };
  const lineMetrics = i => {
    const cs = getComputedStyle(m[i].d);
    const lh1 = parseFloat(cs.lineHeight) || oneLine;
    const pT = parseFloat(cs.paddingTop) || 0, pB = parseFloat(cs.paddingBottom) || 0;
    return { lh1, pT, pB, n: Math.round((m[i].h - pT - pB) / lh1) };
  };
  const cueFor = cd => {
    if(!marksOn || !cd) return '';
    const who = (cd.textContent || '').trim();
    return who ? (hasContdMark(who) ? who : who + ' ' + contdMarkWord()) : '';
  };
  // Coupe DANS la ligne i (posée en `top`) : k lignes restent ici, le reste passe en haut de la page suivante.
  const cutInside = (i, top, k, mt, isDlg, cueText, left) => {
    const cueH = cueText ? oneLine : 0;
    const newTop0 = (pageIdx + 1) * step;
    const spH = newTop0 - (top + mt.pT + k * mt.lh1) + cueH;
    splits.push({ kind:'inside', div:m[i].d, k, top, pT:mt.pT, lh:mt.lh1, spH, newTop:newTop0, startPage:pageIdx,
                  more: isDlg && marksOn, cue:cueText, left, extra:0, cutIdx:null, moreY: top + mt.pT + k * mt.lh1 });
    if(apply){
      // Écriture différée jusqu'après la boucle : écrite ici, elle obligeait le navigateur à refaire toute la
      // mise en page à la lecture suivante (offsetLeft, style calculé). Le calcul n'en dépend pas (hOv).
      const d = m[i].d, a = (k * mt.lh1 + 0.5) + 'px', b = (spH - 0.5) + 'px';
      splitWrites.push(() => { d.classList.add('is-split'); d.style.setProperty('--sp-top', a); d.style.setProperty('--sp-h', b); });
    }
    hOv[i] = m[i].h - mt.pT - k * mt.lh1;           // hauteur du reste, sur la page suivante
  };
  // _splitDialogue : la coupe la plus basse possible (entre deux répliques, puis dans la réplique).
  const splitDlg = (b, first) => {
    const ls = b.lines, ex = extent(ls, first), minJ = b.cue ? 0 : 1;
    for(let j = ls.length - 1; j >= minJ; j--){
      const i = ls[j]; if(typ(i) !== 'dialogue') continue;
      if(j < ls.length - 1 && ex.tops[j] + hOf(i) + MORE_H <= limit() && hOf(i) >= 2 * oneLine - 1) return { kind:'between', j, ex };
      if(hOv[i] !== undefined) continue;             // déjà coupée : pas de double coupe
      const mt = lineMetrics(i);
      const k = Math.min(Math.floor((limit() - ex.tops[j] - mt.pT - MORE_H) / mt.lh1 + 1e-6), mt.n - 2);
      if(k >= 2) return { kind:'inside', j, k, mt, ex };
    }
    return null;
  };

  // ---- Boucle principale (comme _layout) ----
  while(dq.length){
    const b = dq.shift(), i0 = b.lines[0];
    if(lockSet && !b.cue && !b.contLine && filled[pageIdx] && isLock(i0)){      // page figée : saut forcé devant l'ancre
      breaks.push({ to: pageIdx + 2, why:'lock', free: Math.max(0, limit() - y), need:0, type: typ(i0) });
      newPage();
    }
    if(!b.cue && !b.contLine && filled[pageIdx] && fk(i0) !== lastFk){         // page sans numéro : elle commence sur sa propre feuille, et la suite aussi
      breaks.push({ to: pageIdx + 2, why:'freepage', free: Math.max(0, limit() - y), need:0, type: typ(i0) });
      newPage();
    }

    // Cas A : entête de scène + sonde du bloc suivant
    if(b.type === 'scene'){
      const nb = (dq[0] && fk(dq[0].lines[0]) === fk(i0)) ? dq[0] : null;     // le bloc suivant est sur une autre feuille : rien à garder avec lui
      const nbBig = !!(nb && nb.type === 'card' && m[i0].h + gapOf(nb.lines[0]) + m[nb.lines[0]].h > contentH);   // carton page entière : il ne peut pas suivre l'entête
      const need = m[i0].h + ((nb && !nbBig) ? gapOf(nb.lines[0]) + ((nb.type === 'scene' || nb.type === 'transition' || nb.type === 'card') ? 1 : 2) * oneLine : 0);
      let first = firstTop(i0, 0);
      if(first + need > limit() && filled[pageIdx]){ breakPage('keep', 'scene', need); first = firstTop(i0, 0); }
      commit([i0], [first]);
      continue;
    }

    // Cas B : bloc Personnage (nom + didascalies + répliques)
    if(b.type === 'character'){
      const pad = (b.cue && b.cueText) ? oneLine : 0;
      let first = firstTop(i0, pad), ex = extent(b.lines, first);
      if(ex.bottom <= limit()){ commit(b.lines, ex.tops, b.contLine); continue; }
      let sp = splitDlg(b, first);
      if(!sp && filled[pageIdx]){
        breakPage('fit', 'character', ex.bottom - first);
        first = firstTop(i0, pad); ex = extent(b.lines, first);
        if(ex.bottom <= limit()){ commit(b.lines, ex.tops, b.contLine); continue; }
        sp = splitDlg(b, first);
      }
      if(!sp){ commit(b.lines, ex.tops, b.contLine); spillLoop(); continue; }       // cas dégénéré : bloc insécable
      const ls = b.lines, j = sp.j, cueDiv = b.cueDiv || m[i0].d;
      const cueText = b.cue ? b.cueText : cueFor(cueDiv);
      const left = cueDiv.offsetLeft;
      if(sp.kind === 'between'){
        commit(ls.slice(0, j + 1), sp.ex.tops.slice(0, j + 1), b.contLine);
        const ia = ls[j], bot = sp.ex.tops[j] + hOf(ia);
        splits.push({ kind:'between', div:m[ia].d, startPage:pageIdx, more:marksOn, cue:cueText, left, newTop:(pageIdx + 1) * step, moreY:bot });
        newPage();
        dq.unshift({ type:'character', lines: ls.slice(j + 1), cue:true, cueText, cueDiv });
      } else {
        const i = ls[j];
        commit(ls.slice(0, j + 1), sp.ex.tops.slice(0, j + 1), b.contLine);
        cutInside(i, sp.ex.tops[j], sp.k, sp.mt, true, cueText, left);
        newPage();
        dq.unshift({ type:'character', lines: ls.slice(j), cue:true, cueText, cueDiv, contLine:i });
      }
      continue;
    }

    // Cas C : action, transition, texte, carton, dialogue simultané… (un seul nœud)
    const t = typ(i0);
    let first = firstTop(i0, 0);
    if(first + hOf(i0) <= limit()){ commit([i0], [first], b.contLine); continue; }
    const canSplit = SPLIT_C.has(t) && hOf(i0) <= contentH && hOv[i0] === undefined;
    const trySplit = f => { if(!canSplit) return null; const mt = lineMetrics(i0); const k = Math.min(Math.floor((limit() - f - mt.pT) / mt.lh1 + 1e-6), mt.n - 2); return k >= 2 ? { k, mt } : null; };
    let sp = trySplit(first);
    if(!sp && filled[pageIdx]){
      breakPage('fit', t, hOf(i0));
      first = firstTop(i0, 0);
      if(first + hOf(i0) <= limit()){ commit([i0], [first], b.contLine); continue; }
      sp = trySplit(first);
    }
    if(!sp){ commit([i0], [first], b.contLine); spillLoop(); continue; }
    commit([i0], [first], b.contLine);
    cutInside(i0, first, sp.k, sp.mt, false, '', m[i0].d.offsetLeft);
    newPage();
    dq.unshift({ type:b.type, lines:[i0], contLine:i0 });
  }
  for(let k = 0; k < pages.length; k++) if(!pages[k]) pages[k] = [];

  // ---- Pages « propres » : première ligne posée en haut de feuille, ni suite d'un bloc coupé, ni reprise de
  // dialogue (« SUITE »), ni débordement. À partir d'une telle page, ce qui suit ne dépend plus de ce qui
  // précède : c'est le point de recalage de la repagination incrémentale. ----
  const cuePages = new Set(); splits.forEach(sp => { if(sp.kind === 'between' && sp.cue) cuePages.add(sp.startPage + 1); });
  const cleanNew = k => {
    if(k === startPg) return inc ? !!inc.old.clean[k] : true;
    const f = pgIdx[k] && pgIdx[k][0];
    return f !== undefined && firstOfPage[f] === true && !cuePages.has(k) && !spill[k];
  };
  let convK = -1, convOld = -1, convI = m.length - 1;
  if(inc && inc.to < lines.length){
    const O = inc.old;
    for(let k = startPg + 1; k < pages.length - 1 && convK < 0; k++){
      if(!cleanNew(k)) continue;
      const fi = pgIdx[k][0];
      if(inc.from + fi <= inc.safeAfter) continue;             // il faut être passé AU-DELÀ de ce qui a changé
      const ko = m[fi].d._pgk;                                 // page de départ de cette ligne dans l'ancien découpage
      if(ko === undefined || !O.clean[ko] || !O.pages[ko] || O.pages[ko][0] !== m[fi].d) continue;
      let same = true;
      for(let q = 0; q < 2 && same; q++){
        if(q === 1 && k + 1 >= pages.length - 1) break;        // la dernière page de la fenêtre peut être tronquée
        const pa = pages[k + q], pb = O.pages[ko + q];
        if(!pa || !pb || pa.length !== pb.length || pa[0] !== pb[0] || pa[pa.length - 1] !== pb[pb.length - 1]) same = false;
      }
      if(same){ convK = k; convOld = ko; convI = fi; }
    }
    if(convK < 0) return { retry:true };                        // pas encore recalé : on élargit la fenêtre
  }

  // Marges : seule la 1re ligne de chaque feuille est repoussée (les autres gardent leur marge naturelle).
  if(apply){
    splitWrites.forEach(f => f());
    const restoreNode = d => {
      CLEAR(d);
      const st = savedState && savedState.get(d);
      if(!st) return;
      if(st.mt) d.style.marginTop = st.mt;
      if(st.pt) d.classList.add('is-pagetop');
      if(st.sp){ d.classList.add('is-split'); if(st.spm) d.classList.add('is-split-mid'); SPV.forEach((v, q) => { if(st.vars[q]) d.style.setProperty(v, st.vars[q]); }); }
    };
    if(!inc || inc.from === 0) m[0].d.style.marginTop = '0px';
    else restoreNode(m[0].d);                                   // page propre : sa marge n'a pas changé
    for(let i = 1; i <= convI && i < m.length; i++) if(firstOfPage[i]){
      m[i].d.style.marginTop = (topOf[i] - domBottom[i-1]) + 'px';
      m[i].d.classList.add('is-pagetop');
    }
    if(convK >= 0){                                              // après le recalage, tout est comme avant : on remet l'état d'origine
      const cut = winAll.indexOf(m[convI].d);
      for(let q = cut + 1; q < winAll.length; q++) restoreNode(winAll[q]);
    }
  }

  // ---- Assemblage du résultat (fenêtre + parties inchangées de l'ancien découpage) ----
  let PG = pages, outSplits = splits, outSpill = spill, outBreaks = breaks;
  const cleanArr = [];
  for(let k = 0; k < pages.length; k++) cleanArr[k] = (k < startPg) ? false : cleanNew(k);
  let outClean = cleanArr;
  if(inc){
    const O = inc.old, dd = convK >= 0 ? convK - convOld : 0, endNew = convK >= 0 ? convK : pages.length;
    const shiftSp = sp => { const c = Object.assign({}, sp); c.startPage += dd; ['top','newTop','moreY'].forEach(f => { if(typeof c[f] === 'number') c[f] += dd * step; }); return c; };
    PG = O.pages.slice(0, startPg).concat(pages.slice(startPg, endNew), convK >= 0 ? O.pages.slice(convOld) : []);
    outClean = O.clean.slice(0, startPg).concat(cleanArr.slice(startPg, endNew), convK >= 0 ? O.clean.slice(convOld) : []);
    outSplits = O.splits.filter(sp => sp.startPage < startPg)
      .concat(splits.filter(sp => sp.startPage < endNew), convK >= 0 ? O.splits.filter(sp => sp.startPage >= convOld).map(shiftSp) : []);
    outSpill = {};
    Object.keys(O.spill).forEach(k => { k = +k; if(k < startPg) outSpill[k] = true; else if(convK >= 0 && k >= convOld) outSpill[k + dd] = true; });
    Object.keys(spill).forEach(k => { k = +k; if(k >= startPg && k < endNew) outSpill[k] = true; });
    outBreaks = (O.breaks || []).filter(b => b.to - 1 <= startPg)
      .concat(breaks.filter(b => b.to - 1 > startPg && b.to - 1 <= endNew), convK >= 0 ? (O.breaks || []).filter(b => b.to - 1 > convOld).map(b => Object.assign({}, b, { to: b.to + dd })) : []);
  }
  // Un bloc appartient à la page où il COMMENCE.
  let pageOut = pageOf;
  if(inc){
    // L'ancienne table est reprise telle quelle ; on ne réécrit que le tronçon recalculé et on décale la suite.
    const O = inc.old, dd = convK >= 0 ? convK - convOld : 0, endNew = convK >= 0 ? convK : pages.length;
    pageOut = Object.assign({}, O.pageOf);
    (inc.removed || []).forEach(n => {
      if(n.dataset && n.dataset.id) delete pageOut[n.dataset.id];
      if(n.querySelectorAll) n.querySelectorAll('[data-id]').forEach(c => { delete pageOut[c.dataset.id]; });
    });
    if(dd !== 0) for(const key in pageOut){ if(pageOut[key] > convOld) pageOut[key] += dd; }
    const seenW = new Set();
    for(let k = startPg; k < endNew; k++) pages[k].forEach(d => { if(seenW.has(d)) return; seenW.add(d); mapPageIds(d, pageOut, k + 1); });
  } else {
    const seen = new Set();
    PG.forEach((pg, k) => pg.forEach(d => { if(seen.has(d)) return; seen.add(d); mapPageIds(d, pageOut, k + 1); }));
  }
  // v49 : une note est rattachée à la page de la ligne qui la précède (sinon de celle qui la suit).
  if(allLines.length !== lines.length){
    let lastPg = null; const pending = [];
    allLines.forEach(d => {
      if(d.dataset.type === 'note'){ if(lastPg !== null) pageOut[d.dataset.id] = lastPg; else pending.push(d); }
      else { const v = pageOut[d.dataset.id]; if(v !== undefined){ lastPg = v; pending.splice(0).forEach(n => { pageOut[n.dataset.id] = v; }); } }
    });
  }
  // Page de départ de chaque ligne (relue par la repagination suivante). À rebours : la 1re page l'emporte.
  { const dd2 = (inc && convK >= 0) ? convK - convOld : 0;
    const hi = (inc && convK >= 0 && dd2 === 0) ? convK - 1 : PG.length - 1;     // même numérotation qu'avant : la suite n'a pas bougé
    for(let k = hi; k >= (inc ? startPg : 0); k--){ const pg = PG[k]; for(let q = 0; q < pg.length; q++) pg[q]._pgk = k; }
  }

  // Export / impression : on coupe réellement le nœud (la copie de mesure est jetable).
  if(!apply) splits.forEach(sp => {
    const A = sp.div, pa = pages[sp.startPage], pb = pages[sp.startPage + 1];
    const mk = (txt) => { const d = document.createElement('div'); d.className = 'line line--character pg-mark';
      d.style.marginTop = '0'; d.textContent = txt; return d; };
    if(sp.kind === 'between'){
      if(sp.more) pa.splice(pa.indexOf(A) + 1, 0, mk(moreMarkWord()));
      if(sp.cue && pb) pb.unshift(mk(sp.cue));
      return;
    }
    const tn = A.firstChild;
    if(!tn || tn.nodeType !== 3) return;
    const base = A.getBoundingClientRect().top + sp.pT + sp.k * sp.lh - 2;
    const rng = document.createRange();
    let lo = 0, hi = tn.length;
    while(lo < hi){
      const mid = (lo + hi) >> 1;
      rng.setStart(tn, mid); rng.setEnd(tn, Math.min(mid + 1, tn.length));
      if(rng.getBoundingClientRect().top >= base) hi = mid; else lo = mid + 1;
    }
    const full = tn.data;
    const B = A.cloneNode(false);
    A.textContent = full.slice(0, lo).replace(/\s+$/, '');
    B.textContent = full.slice(lo).replace(/^\s+/, '');
    if(sp.more) pa.splice(pa.indexOf(A) + 1, 0, mk(moreMarkWord()));
    const at = pb.indexOf(A);
    if(at >= 0) pb.splice(at, 1, ...(sp.cue ? [mk(sp.cue), B] : [B]));
  });
  return { pageCount: PG.length, pages: PG, pageOf: pageOut, spill: outSpill, geo, sig, splits: outSplits, breaks: outBreaks, topOf, domBottom, firstOfPage, lines,
           clean: outClean, incRange: inc ? [startPg, convK >= 0 ? convK + 1 : PG.length] : null,
           debug:{ contentH, step, oneLine, linesPerPage: Math.floor((contentH + PAGE_EPS) / oneLine), blocks: m.length } };
}

/* ---- rendu des feuilles derrière le texte de l'éditeur ---- */
/* ---- v49 : VÉRIFICATION APRÈS COUP ----
   La pagination décide d'après des mesures ; une fois les marges écrites dans le DOM, on relit la position
   RÉELLE de la première ligne de chaque feuille. Si elle n'est pas exactement en haut de la zone de texte
   (police arrivée en retard, arrondi du navigateur, zoom…), on corrige sa marge de l'écart constaté, feuille
   après feuille. Garantie : une nouvelle page commence toujours sur sa première ligne de texte, au pixel près. */
function pgVerifyAndHeal(res, range){
  /* PERFORMANCE. L'ancienne version corrigeait les feuilles UNE PAR UNE : chaque marge écrite obligeait le
     navigateur à refaire toute la mise en page à la lecture suivante, soit un recalcul complet du document PAR
     feuille décalée (plusieurs secondes sur 700 pages). On lit maintenant toutes les positions en une passe, on
     calcule les corrections en tenant compte du décalage cumulé des précédentes, puis on les écrit d'un coup :
     au plus 3 recalculs au total. Même seuil, mêmes marges. `range` : en repagination incrémentale, seules les
     pages recalculées sont contrôlées (les autres n'ont pas bougé). */
  try{
    const page = document.getElementById('page'); if(!page || !res || !res.pages) return;
    const geo = res.geo, pageH = geo.pageH;
    const cssW = parseFloat(getComputedStyle(page).width);
    const pr0 = page.getBoundingClientRect();
    const K = (cssW > 0 && pr0.width > 0) ? pr0.width / cssW : 1;
    const viol = [];
    // CORRECTIF. Une page qui reprend un dialogue coupé ENTRE deux répliques commence par le nom
    // répété (« NOM (SUITE) »), qui occupe la 1re ligne de la feuille : sa première ligne de texte
    // est donc voulue UNE LIGNE plus bas. Sans cela, le recalage ci-dessous la remontait tout en
    // haut, sous le nom répété (texte superposé), et décalait d'autant tout ce qui suit, d'où le
    // même chevauchement sur les coupes « dans une réplique » des pages suivantes.
    const cuePad = {};
    (res.splits || []).forEach(sp => { if(sp.kind === 'between' && sp.cue) cuePad[sp.startPage + 1] = (res.debug && res.debug.oneLine) || 0; });
    const targets = [];
    const kLo = range ? Math.max(1, range[0]) : 1, kHi = range ? Math.min(res.pages.length, range[1] + 1) : res.pages.length;
    for(let k = kLo; k < kHi; k++){
      const first = res.pages[k][0];
      if(!first || first.classList.contains('is-split')) continue;           // suite d'un bloc coupé : posée par la coupe
      if(first.dataset && first.dataset.synthetic) continue;
      targets.push({ k, first, want: geo.mTop + k * (pageH + PAGE_GAP) + (cuePad[k] || 0) });
    }
    const guard = new Array(targets.length).fill(0);
    for(let pass = 0; pass < 3; pass++){
      const pr = page.getBoundingClientRect();
      const got = targets.map(t => (t.first.getBoundingClientRect().top - pr.top) / K);   // lecture seule : un seul recalcul
      let cum = 0; const writes = [];
      targets.forEach((t, q) => {
        const dlt = t.want - (got[q] + cum);
        if(Math.abs(dlt) <= 0.6 || guard[q] >= 3) return;
        guard[q]++;
        viol.push({ page:t.k + 1, delta:+dlt.toFixed(2) });
        writes.push([t.first, (parseFloat(t.first.style.marginTop) || 0) + dlt]);
        cum += dlt;
      });
      if(!writes.length) break;
      writes.forEach(([d, v]) => { d.style.marginTop = v + 'px'; d.classList.add('is-pagetop'); });
    }
    window.__pgViolations = viol;
    if(viol.length && window.console) console.warn('[pagination] recalage de', viol.length, 'première(s) ligne(s) de page', viol.slice(0, 5));
  }catch(err){ /* la vérification ne doit jamais bloquer l'édition */ }
}

/* =====================================================================
   REPAGINATION INCRÉMENTALE
   ---------------------------------------------------------------------
   Refaire TOUTE la pagination à chaque Entrée coûtait un temps proportionnel à la taille du scénario :
   effacer, mesurer, replacer des milliers de lignes — alors que l'on n'a touché qu'à une page. Les sauts de
   page ne dépendent que de la hauteur des blocs, dans l'ordre. Donc : tout ce qui précède la page modifiée
   est inchangé, et à partir du moment où un début de page retombe sur le même bloc qu'avant (et que rien
   n'y est coupé ou repris d'une page précédente), tout ce qui suit est lui aussi inchangé. On ne recalcule
   que le tronçon entre les deux, avec exactement le même algorithme ; en cas de doute on retombe sur le
   calcul complet. Les scénarios courts gardent le calcul complet d'avant (rien ne change pour eux).
===================================================================== */
const PG_INC_MIN_LINES = 400;                 // en dessous (~30 pages) : calcul complet, comme avant
let PG_MO = null, PG_MO_PAGE = null;
const PG_DIRTY = new Set();                   // lignes touchées depuis la dernière pagination
const PG_IGN_CLS = new Set(['line-active', 'hl', 'is-pagetop', 'is-split', 'is-split-mid']);
function pgObserve(page){
  if(PG_MO_PAGE === page) return;
  if(PG_MO) PG_MO.disconnect();
  PG_DIRTY.clear();
  PG_MO = new MutationObserver(() => {});
  PG_MO.observe(page, { subtree:true, childList:true, characterData:true, attributes:true, attributeOldValue:true, attributeFilter:['class', 'data-type', 'style'] });
  PG_MO_PAGE = page;
}
function pgClsKey(str){ return (str || '').split(/\s+/).filter(c => c && !PG_IGN_CLS.has(c)).sort().join(' '); }
/* Relève ce que le navigateur a vu bouger dans les lignes (frappe, collage, changement de type…), quel que soit le
   code qui l'a fait. `skipUnit` : ligne dont on sait que la modification ne change pas la mise en page. */
function pgCollectDirty(skipUnit){
  if(!PG_MO) return;
  const page = PG_MO_PAGE;
  PG_MO.takeRecords().forEach(r => {
    if(r.type === 'attributes'){
      if(r.attributeName === 'class' && pgClsKey(r.oldValue) === pgClsKey(r.target.getAttribute('class'))) return;
      if(r.attributeName === 'style' && r.oldValue === r.target.getAttribute('style')) return;
    }
    let n = r.target;
    if(n === page) return;                                     // structure : détectée par comparaison des listes
    while(n && n.parentNode !== page) n = n.parentNode;
    if(n && n !== skipUnit) PG_DIRTY.add(n);
  });
}
/* Nos propres écritures (marges, classes) ne sont pas des modifications du texte. */
function pgMuteOwnMutations(){ if(PG_MO) PG_MO.takeRecords(); }
function pgSignature(page){
  const cs = getComputedStyle(page), stg = (S.project && S.project.settings) || {};
  const ls = pageLockSet();
  return [page.clientWidth, S.project.format, cs.fontFamily, cs.fontSize, cs.lineHeight, cs.paddingTop, cs.paddingBottom, cs.paddingLeft,
          !!stg.autoContd, ls ? ls.size : 0, document.fonts ? document.fonts.status : ''].join('|');
}
/* Cherche le tronçon à recalculer. Renvoie null (calcul complet) ou { from, startPage, safeAfter, old, cur, allLines, removed }. */
function pgPlan(page){
  const P = S.pagination, old = P.res;
  if(!old || !old.lines || P._resPage !== page || P._forceFull || !old.clean) return null;
  const kids = page.children, allLines = [], cur = [];
  for(let i = 0; i < kids.length; i++){
    const n = kids[i];
    if(!n.classList.contains('line')) continue;
    allLines.push(n); if(n.getAttribute('data-type') !== 'note') cur.push(n);
  }
  const prev = old.lines;
  if(cur.length < PG_INC_MIN_LINES || !prev.length) return null;
  let removed = [];
  let a = 0; const nmin = Math.min(prev.length, cur.length);
  while(a < nmin && prev[a] === cur[a]) a++;
  let lo = Infinity, hi = -Infinity;
  if(a < prev.length || a < cur.length){                       // la liste des lignes a changé (insertion, suppression, fusion…)
    let pe = prev.length - 1, ce = cur.length - 1;
    while(pe >= a && ce >= a && prev[pe] === cur[ce]){ pe--; ce--; }
    lo = Math.max(0, a - 1); hi = Math.min(cur.length - 1, Math.max(ce, a) + 1);
    removed = prev.slice(a, pe + 1);
  }
  if(PG_DIRTY.size > 40) return null;
  for(const n of PG_DIRTY){
    if(n.dataset.type === 'note') continue;
    const ix = cur.indexOf(n);
    if(ix < 0) continue;                                       // ligne retirée : la comparaison des listes l'a déjà vue
    lo = Math.min(lo, Math.max(0, ix - 1)); hi = Math.max(hi, Math.min(cur.length - 1, ix + 1));
  }
  if(lo === Infinity) return null;                           // aucune modification repérée : on ne devine pas, calcul complet
  // 1re page propre au plus tard sur la page de la 1re ligne touchée, moins une page de sécurité
  const anchor = cur[Math.min(lo, a > 0 ? a - 1 : lo)];
  let rs = anchor._pgk;
  if(rs === undefined || !old.pages[rs]) return null;
  rs = Math.max(0, rs - 1);
  while(rs > 0 && !old.clean[rs]) rs--;
  const f = old.pages[rs] && old.pages[rs][0];
  const from = f ? cur.indexOf(f) : -1;
  if(from < 0 || from > lo) return null;
  return { from, startPage: rs, safeAfter: hi, old, cur, allLines, removed };
}
function pgComputeEditor(page){
  const P = S.pagination, fmt = S.project.format;
  pgObserve(page);
  pgCollectDirty(null);
  let res = null;
  let plan = null;
  try{ plan = pgPlan(page); }catch(err){ plan = null; }
  if(plan){
    try{
      const n = plan.cur.length, lpp = Math.max(20, n / Math.max(1, plan.old.pages.length));
      const inc = { from:plan.from, startPage:plan.startPage, safeAfter:plan.safeAfter, old:plan.old, cur:plan.cur, allLines:plan.allLines, removed:plan.removed, saved:new Map(), seen:new Set(), to:n };
      for(const extra of [3, 10, 40]){
        const to = Math.min(n, Math.ceil(plan.safeAfter + 1 + (extra + 1) * lpp));
        if(to >= n - lpp) break;                               // le reste du scénario est presque entièrement concerné : autant tout faire
        inc.to = to;
        const r = computePagination(page, fmt, true, undefined, inc);
        if(!r.retry){ res = r; break; }
      }
      if(!res){ inc.to = n; res = computePagination(page, fmt, true, undefined, inc); }
    }catch(err){ res = null; if(window.console) console.warn('[pagination] repli sur le calcul complet', err); }
  }
  /* La géométrie (largeur, police, interligne, réglages) n'est relue qu'APRÈS le calcul : la lire avant aurait
     forcé le navigateur à refaire toute la mise en page une fois de plus. Si elle a changé depuis la
     dernière pagination (fenêtre redimensionnée, police arrivée…), le tronçon calculé ne vaut rien : calcul complet. */
  const sigNow = (res && res.sig) || pgSignature(page);
  if(plan && res && P._sig !== sigNow) res = null;
  if(!res) res = computePagination(page, fmt, true);
  P.res = res; P._resPage = page; P._sig = sigNow; P._forceFull = false;
  PG_DIRTY.clear();
  return res;
}
function paginateEditor(force){
  if(force) S.pagination._forceFull = true;
  const page = document.getElementById('page');
  const stack = document.getElementById('pageStack');
  const sheets = document.getElementById('sheets');
  const zoom = document.getElementById('pageZoom');
  if(!page || !stack || !sheets || !zoom || !S.project) return;

  const st = ensureSettings(S.project);
  const res = pgComputeEditor(page);
  const { pageH } = res.geo;
  pgVerifyAndHeal(res, res.incRange);
  pgMuteOwnMutations();

  // min-height (et non height) : si un bloc dépasse la hauteur d'une page,
  // la pile s'agrandit au lieu de rogner la fin du texte.
  stack.style.minHeight = (res.pageCount * pageH + (res.pageCount - 1) * PAGE_GAP) + 'px';

  const numbers = sceneNumbers();
  const sceneOfPage = firstSceneOfEachPage(res.pages, numbers, res.spill);
  const PLB = computePageLabels(res.pages);
  S.pagination.labels = PLB.labels; S.pagination.omitted = PLB.omitted;
  let html = '';
  for(let k = 0; k < res.pageCount; k++){
    const top = k * (pageH + PAGE_GAP);
    const num = PLB.labels[k], isFree = PLB.free[k];
    const showNum = pageNumShown(PLB, k, st);
    // « CONTINUITÉ : » en bas de page quand la scène se poursuit sur la
    // suivante, « (continuité) » en haut de la page qui la reprend.
    // Une page sans numéro n'en porte jamais (et la page qui la précède n'annonce pas une suite).
    const contBottom = st.showContinued && !isFree && !PLB.free[k+1] && sceneOfPage[k+1] && sceneOfPage[k+1].continued;
    const contTop = st.showContinued && !isFree && sceneOfPage[k] && sceneOfPage[k].continued;
    html += `<div class="sheet${isFree ? ' is-free' : ''}" style="top:${top}px;height:${pageH}px;">
      ${k > 0 ? `<div class="pg-dot" style="top:${res.geo.mTop + 6}px"></div>` : ''}
      ${showNum ? `<div class="sheet-num">${num}.</div>` : ''}${isFree ? `<div class="sheet-free-tag">${esc(L('Page sans numéro','Unnumbered page'))}</div>` : ''}
      ${contTop ? `<div class="sheet-cont is-top">${esc(pageContWord('top'))}</div>` : ''}
      ${contBottom ? `<div class="sheet-cont is-bottom">${esc(pageContWord('bottom'))}</div>` : ''}
    </div>`;
    if(k < res.pageCount - 1){
      html += `<div class="sheet-tab" style="top:${top + pageH + 8}px;">${isFree ? L('fin de page sans numéro','end of unnumbered page') : 'fin de page ' + num}</div>`;
    }
  }
  (res.splits || []).forEach(sp => {
    if(sp.more) html += `<div class="pg-mark-lbl" style="left:${sp.left}px;top:${res.geo.mTop + sp.moreY}px">${esc(moreMarkWord())}</div>`;
    if(sp.cue) html += `<div class="pg-mark-lbl" style="left:${sp.left}px;top:${res.geo.mTop + sp.newTop}px">${esc(sp.cue)}</div>`;
  });
  /* On ne reconstruit les feuilles que si leur rendu a changé : évite le
     clignotement des numéros / « fin de page » à chaque frappe. */
  if(S.pagination._sheetsHtml !== html || !sheets.firstChild){
    sheets.innerHTML = html;
    S.pagination._sheetsHtml = html;
  }
  const rc = document.getElementById('railCount');
  if(rc){ const t = S.project.elements.length + ' ' + L('éléments','elements'); if(rc.textContent !== t) rc.textContent = t; }

  // Mise à l'échelle si la fenêtre est plus étroite qu'une feuille : le
  // papier garde ses proportions et ses marges réelles, on ne fait que le
  // regarder de plus loin. La pagination, elle, reste calculée sur les
  // dimensions vraies.
  const pane = document.getElementById('centerPane');
  const avail = pane ? pane.clientWidth - 28 : stack.offsetWidth;
  const k = Math.min(1, Math.max(0.35, avail / stack.offsetWidth));
  S.pagination.zoom = k;
  stack.style.transform = k < 1 ? 'scale(' + k + ')' : '';
  zoom.style.width = (stack.offsetWidth * k) + 'px';
  zoom.style.height = (stack.offsetHeight * k) + 'px';

  S.pagination.count = res.pageCount;
  S.pagination.pageOf = res.pageOf;
  S.pagination.debug = res.debug;
  updatePageIndicator();
  /* Les accolades de sélection de scène relisent la position de chaque scène : sur un long scénario on les
     remet à jour une fraction de seconde plus tard, sans bloquer la frappe (elles ne servent qu'à la souris). */
  if(res.lines && res.lines.length > 1500){
    clearTimeout(S.pagination._stT);
    S.pagination._stT = setTimeout(() => { try{ if(S.view === 'editor' && S.tab === 'editor') refreshSceneTools(); }catch(err){} }, 250);
  } else {
    try{ refreshSceneTools(); }catch(err){ /* les boutons de marge ne doivent jamais gêner la pagination */ }
  }
  refreshNav();   // les numéros de page affichés par le navigateur viennent d'ici
  try{ pgiRender(); }catch(err){ /* images sur les pages (js/37-page-images.js) : calque à part, jamais dans le texte */ }
  if(window.__pgDebug) renderPgDebug(res);
}

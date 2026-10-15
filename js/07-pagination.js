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
/* Numéro affiché de chaque page + pages figées qui n'existent plus (omises). */
function computePageLabels(pages, proj){
  proj = proj || S.project;
  const start = (ensureSettings(proj).pageNumberStart) || 1, pl = proj.pageLock;
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
function pageLbl(n){ const l = S.pagination && S.pagination.labels; return (l && l[n-1]) || String(n); }
function plLock(p){
  const res = measureExportPages(p), labels = computePageLabels(res.pages, p).labels, pages = [];
  res.pages.forEach((pg, k)=>{
    if(!pg.length) return;
    const inf = plInfo(res.pages, k);
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
function computePagination(container, format, apply, proj){
  const allLines = Array.from(container.children).filter(n => n.classList && n.classList.contains('line'));
  const lines = allLines.filter(n => n.dataset.type !== 'note');   // v49 : les notes sont hors flux (voir .line--note)
  if(apply) allLines.forEach(d => { d.style.marginTop = ''; d.classList.remove('is-pagetop'); if(d.classList.contains('is-split')){ d.classList.remove('is-split', 'is-split-mid'); d.style.removeProperty('--sp-top'); d.style.removeProperty('--sp-h'); d.style.removeProperty('--sp-x'); d.style.removeProperty('--sp-y1'); } });
  if(!lines.length) return { pageCount:1, pages:[[]], pageOf:{}, spill:{}, geo:pageGeometry(container, format) };

  const geo = pageGeometry(container, format);
  const contentH = geo.contentH;
  // Carton « page entière » : sa boîte fait exactement la hauteur utile d'une feuille.
  lines.forEach(d => { if(d.classList.contains('line--card')) d.style.minHeight = (d.dataset.full === '1') ? Math.floor(contentH - 2) + 'px' : ''; });
  const dead = geo.mBottom + PAGE_GAP + geo.mTop;   // espace mort entre deux zones de texte
  const step = contentH + dead;

  // Une seule passe de lecture : position et hauteur réelles de chaque ligne (marges fusionnées comprises).
  // v45 : mesures FRACTIONNAIRES (getBoundingClientRect) au lieu des entiers d'offsetTop/offsetHeight.
  // Un carton (22 pt x 1,35 = 39,6 px) arrondi à 40 px décalait chaque carton de 0,4 px : après quelques
  // cartons, le haut des pages dérivait et la pagination « cassait ».
  const r0 = lines[0].getBoundingClientRect();
  const cssW = parseFloat(getComputedStyle(container).width);   // largeur CSS exacte (offsetWidth est arrondi)
  const sc0 = (cssW > 0) ? (container.getBoundingClientRect().width / cssW) : 1;
  const scl = (isFinite(sc0) && sc0 > 0 && Math.abs(sc0 - 1) > 0.002) ? sc0 : 1;
  const base0 = (r0.top - container.getBoundingClientRect().top) / scl;   // v49 : fractionnaire aussi (offsetTop est arrondi : 0,5 px d'erreur sur toute la page)
  const m = lines.map(d => {
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

  // ---- Blocs logiques (comme _buildBlockQueue) ----
  const dq = [];
  for(let i = 0; i < m.length;){
    if(typ(i) === 'character'){
      const ls = [i]; i++;
      while(i < m.length && (typ(i) === 'parenthetical' || typ(i) === 'dialogue') && !isLock(i)){ ls.push(i); i++; }
      dq.push({ type:'character', lines:ls, cue:false });
    } else { dq.push({ type:typ(i), lines:[i] }); i++; }
  }

  // ---- État ----
  const pages = [[]], pgIdx = [[]], filled = [false];
  const pageOf = {}, spill = {}, splits = [], breaks = [];
  const topOf = [], domBottom = [], firstOfPage = [];
  let pageIdx = 0, y = 0;
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
    filled[pageIdx] = true; y = domBottom[ls[ls.length - 1]];
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
      m[i].d.classList.add('is-split');
      m[i].d.style.setProperty('--sp-top', (k * mt.lh1 + 0.5) + 'px');
      m[i].d.style.setProperty('--sp-h', (spH - 0.5) + 'px');
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

    // Cas A : entête de scène + sonde du bloc suivant
    if(b.type === 'scene'){
      const nb = dq[0];
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

  // Marges : seule la 1re ligne de chaque feuille est repoussée (les autres gardent leur marge naturelle).
  if(apply){
    lines[0].style.marginTop = '0px';
    for(let i = 1; i < m.length; i++) if(firstOfPage[i]){
      m[i].d.style.marginTop = (topOf[i] - domBottom[i-1]) + 'px';
      m[i].d.classList.add('is-pagetop');
    }
  }
  // Un bloc appartient à la page où il COMMENCE.
  const seen = new Set();
  pages.forEach((pg, k) => pg.forEach(d => { if(seen.has(d)) return; seen.add(d); mapPageIds(d, pageOf, k + 1); }));
  // v49 : une note est rattachée à la page de la ligne qui la précède (sinon de celle qui la suit).
  { let lastPg = null; const pending = [];
    allLines.forEach(d => {
      if(d.dataset.type === 'note'){ if(lastPg !== null) pageOf[d.dataset.id] = lastPg; else pending.push(d); }
      else { const v = pageOf[d.dataset.id]; if(v !== undefined){ lastPg = v; pending.splice(0).forEach(n => { pageOf[n.dataset.id] = v; }); } }
    }); }

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
  return { pageCount: pages.length, pages, pageOf, spill, geo, splits, breaks, topOf, domBottom, firstOfPage, lines,
           debug:{ contentH, step, oneLine, linesPerPage: Math.floor((contentH + PAGE_EPS) / oneLine), blocks: m.length } };
}

/* ---- rendu des feuilles derrière le texte de l'éditeur ---- */
/* ---- v49 : VÉRIFICATION APRÈS COUP ----
   La pagination décide d'après des mesures ; une fois les marges écrites dans le DOM, on relit la position
   RÉELLE de la première ligne de chaque feuille. Si elle n'est pas exactement en haut de la zone de texte
   (police arrivée en retard, arrondi du navigateur, zoom…), on corrige sa marge de l'écart constaté, feuille
   après feuille. Garantie : une nouvelle page commence toujours sur sa première ligne de texte, au pixel près. */
function pgVerifyAndHeal(res){
  try{
    const page = document.getElementById('page'); if(!page || !res || !res.pages) return;
    const geo = res.geo, pageH = geo.pageH;
    const cssW = parseFloat(getComputedStyle(page).width);
    const pr0 = page.getBoundingClientRect();
    const K = (cssW > 0 && pr0.width > 0) ? pr0.width / cssW : 1;
    const viol = [];
    for(let k = 1; k < res.pages.length; k++){
      const first = res.pages[k][0];
      if(!first || first.classList.contains('is-split')) continue;           // suite d'un bloc coupé : posée par la coupe
      if(first.dataset && first.dataset.synthetic) continue;
      let guard = 0;
      while(guard++ < 3){
        const pr = page.getBoundingClientRect();
        const want = geo.mTop + k * (pageH + PAGE_GAP);
        const got = (first.getBoundingClientRect().top - pr.top) / K;
        const dlt = want - got;
        if(Math.abs(dlt) <= 0.6) break;
        viol.push({ page:k + 1, delta:+dlt.toFixed(2) });
        const cur = parseFloat(first.style.marginTop) || 0;
        first.style.marginTop = (cur + dlt) + 'px';
        first.classList.add('is-pagetop');
      }
    }
    window.__pgViolations = viol;
    if(viol.length && window.console) console.warn('[pagination] recalage de', viol.length, 'première(s) ligne(s) de page', viol.slice(0, 5));
  }catch(err){ /* la vérification ne doit jamais bloquer l'édition */ }
}
function paginateEditor(){
  const page = document.getElementById('page');
  const stack = document.getElementById('pageStack');
  const sheets = document.getElementById('sheets');
  const zoom = document.getElementById('pageZoom');
  if(!page || !stack || !sheets || !zoom || !S.project) return;

  const st = ensureSettings(S.project);
  const res = computePagination(page, S.project.format, true);
  const { pageH } = res.geo;
  pgVerifyAndHeal(res);

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
    const num = PLB.labels[k];
    const showNum = st.showPageNumbers && (k > 0 || st.numberFirstPage);
    // « CONTINUITÉ : » en bas de page quand la scène se poursuit sur la
    // suivante, « (continuité) » en haut de la page qui la reprend.
    const contBottom = st.showContinued && sceneOfPage[k+1] && sceneOfPage[k+1].continued;
    const contTop = st.showContinued && sceneOfPage[k] && sceneOfPage[k].continued;
    html += `<div class="sheet" style="top:${top}px;height:${pageH}px;">
      ${k > 0 ? `<div class="pg-dot" style="top:${res.geo.mTop + 6}px"></div>` : ''}
      ${showNum ? `<div class="sheet-num">${num}.</div>` : ''}
      ${contTop ? `<div class="sheet-cont is-top">${esc(pageContWord('top'))}</div>` : ''}
      ${contBottom ? `<div class="sheet-cont is-bottom">${esc(pageContWord('bottom'))}</div>` : ''}
    </div>`;
    if(k < res.pageCount - 1){
      html += `<div class="sheet-tab" style="top:${top + pageH + 8}px;">fin de page ${num}</div>`;
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
  try{ refreshSceneTools(); }catch(err){ /* les boutons de marge ne doivent jamais gêner la pagination */ }
  refreshNav();   // les numéros de page affichés par le navigateur viennent d'ici
  if(window.__pgDebug) renderPgDebug(res);
}


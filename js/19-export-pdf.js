/* =====================================================================
   EXPORT PDF — le site écrit lui-même le fichier
   ---------------------------------------------------------------------
   Jusqu'ici, « exporter en PDF » voulait dire : ouvrir la boîte
   d'impression et laisser le NAVIGATEUR fabriquer le fichier. Ce moteur-là
   ne nous appartient pas — et selon la machine, il rendait un PDF vide,
   tronqué, ou refusé à la réouverture. Impossible à corriger depuis le
   site.

   On écrit donc le PDF nous-mêmes, octet par octet (bibliothèque jsPDF,
   chargée depuis un CDN au moment de l'export). Le fichier obtenu est un
   vrai PDF de texte : sélectionnable, cherchable, léger — et il est à la
   fois TÉLÉCHARGÉ sur la machine et OUVERT dans un onglet.

   La mise en page n'est pas réinventée pour autant : on construit les
   feuilles exactement comme l'éditeur les affiche, hors écran, puis on
   relève au point près la position que le navigateur a calculée pour
   chaque bloc, et on la recopie dans le PDF. Mêmes marges, mêmes retraits,
   mêmes sauts de page, mêmes numéros de scène.
===================================================================== */

let __jspdfLoading = null;
function loadJsPdf(){
  if(window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if(__jspdfLoading) return __jspdfLoading;
  const sources = [
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
    'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'
  ];
  __jspdfLoading = (async ()=>{
    let lastErr = null;
    for(const src of sources){
      try{
        await new Promise((resolve, reject)=>{
          const s = document.createElement('script');
          s.src = src; s.onload = resolve; s.onerror = ()=>reject(new Error(L('échec de chargement: ','loading failed: ')+src));
          document.head.appendChild(s);
        });
        if(window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
      }catch(err){ lastErr = err; }
    }
    throw lastErr || new Error('jsPDF indisponible');
  })();
  return __jspdfLoading;
}

const PX_TO_PT = 0.75;                    // 1 px CSS = 1/96 pouce = 0,75 pt

/* Les polices standard d'un PDF (Courier, Helvetica, Times) n'acceptent que
   le jeu de caractères Windows-1252. Les accents, les apostrophes courbes,
   les tirets cadratins et les points de suspension en font partie : ils
   passent tels quels. Le reste (flèches, symboles exotiques) serait écrit
   n'importe comment — on le remplace plutôt que de livrer du charabia. */
const CP1252_EXTRA = new Set('\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178'.split(''));
function pdfSafeText(t){
  let out = '';
  for(const ch of String(t == null ? '' : t)){
    if(ch.charCodeAt(0) < 256 || CP1252_EXTRA.has(ch)){ out += ch; continue; }
    // Dernier recours : on retire les accents décomposables, sinon « ? ».
    const stripped = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    out += (stripped && stripped.charCodeAt(0) < 256) ? stripped : '?';
  }
  return out;
}

/* Une police du site → la police PDF standard la plus proche. L'ordre des
   tests compte : « sans-serif » contient « serif ». */
function pdfFontFor(family){
  const f = String(family || '').toLowerCase();
  if(/courier|monospace|special elite/.test(f)) return 'courier';
  if(/sans-serif|inter|grotesk|bebas|caveat|helvetica|arial/.test(f)) return 'helvetica';
  if(/serif|times|playfair|garamond|cinzel/.test(f)) return 'times';
  return 'helvetica';
}

function parseCssColor(c){
  const m = String(c || '').match(/rgba?\(([^)]+)\)/);
  if(!m) return { r:0, g:0, b:0, a:1 };
  const v = m[1].split(',').map(s => parseFloat(s));
  return { r:v[0]||0, g:v[1]||0, b:v[2]||0, a:(v[3] === undefined ? 1 : v[3]) };
}

/* Position verticale de la ligne de base du texte dans sa boîte de ligne.
   Mesurée sur la vraie police via le canevas quand le navigateur le permet,
   sinon estimée sur les proportions du Courier. Sans ça, tout le texte du
   PDF serait décalé de un à deux points vers le haut ou vers le bas. */
let __fontMetricsCache = {};
function fontMetrics(fontShorthand, fontSizePx){
  if(__fontMetricsCache[fontShorthand]) return __fontMetricsCache[fontShorthand];
  let asc = fontSizePx * 0.629, desc = fontSizePx * 0.157;   // proportions du Courier
  try{
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = fontShorthand;
    const m = ctx.measureText('Hxp');
    if(m && isFinite(m.fontBoundingBoxAscent) && isFinite(m.fontBoundingBoxDescent)
       && m.fontBoundingBoxAscent > 0){
      asc = m.fontBoundingBoxAscent; desc = m.fontBoundingBoxDescent;
    }
  }catch(e){ /* canevas indisponible : on garde l'estimation */ }
  const res = { asc, desc };
  __fontMetricsCache[fontShorthand] = res;
  return res;
}

/* v85 : surlignages en couleur et soulignements (Ctrl+U) dans les exports.
   Les plages sont rangées dans el.hl ([début, fin, couleur], la couleur 4 = soulignement, 5 = gras). */
const RP_HL_RGBA = [[255,214,10,.55],[52,211,153,.42],[244,114,182,.38],[96,165,250,.42]];
function rpMarkFlags(el, len){
  const rs = window.rpHlRanges ? window.rpHlRanges(el) : [];
  if(!rs.length) return null;
  const col = new Int8Array(len).fill(-1), ul = new Uint8Array(len), bd = new Uint8Array(len);
  rs.forEach(r => { for(let i = Math.max(0, r[0]); i < Math.min(len, r[1]); i++){ if(r[2] === 4) ul[i] = 1; else if(r[2] === 5) bd[i] = 1; else if(RP_HL_RGBA[r[2]]) col[i] = r[2]; } });
  let any = false; for(let i = 0; i < len; i++){ if(col[i] >= 0 || ul[i] || bd[i]){ any = true; break; } }
  return any ? { col, ul, bd } : null;
}
function rpModelOf(id){ return (S.project && S.project.elements || []).find(x => x.id === id) || null; }
/* Les marques d'une ligne, recalées sur le texte tel que le PDF le relit (espaces fusionnés, rognés). */
function pdfMarksFor(node, own, finalText){
  try{
    if(!node.classList.contains('line') || node.classList.contains('line--card') || !node.dataset.id) return null;
    const m = rpModelOf(node.dataset.id); if(!m || !m.text) return null;
    if(own.length < m.text.length || own.slice(0, m.text.length) !== m.text) return null;
    const fl = rpMarkFlags(m, own.length); if(!fl) return null;
    let t = '', col = [], ul = [], bd = [];
    for(let i = 0; i < own.length;){
      if(/\s/.test(own[i])){ let j = i; while(j < own.length && /\s/.test(own[j])) j++; t += ' '; col.push(fl.col[i]); ul.push(fl.ul[i]); bd.push(fl.bd[i]); i = j; }
      else { t += own[i]; col.push(fl.col[i]); ul.push(fl.ul[i]); bd.push(fl.bd[i]); i++; }
    }
    let a = 0, b = t.length; while(a < b && t[a] === ' ') a++; while(b > a && t[b - 1] === ' ') b--;
    t = t.slice(a, b); col = col.slice(a, b); ul = ul.slice(a, b); bd = bd.slice(a, b);
    if(t.length !== finalText.length || t.toLowerCase() !== finalText.toLowerCase()) return null;
    return { col, ul, bd };
  }catch(e){ return null; }
}
function pdfPaintMarks(doc, b, lines, x){
  const mk = b.marks; if(!mk) return;
  const safe = pdfSafeText(b.text); if(safe.length !== b.text.length) return;
  const fs = b.fontPt; let pos = 0;
  lines.forEach((ln, li) => {
    let st = safe.indexOf(ln, pos); if(st < 0) st = pos;
    const en = Math.min(safe.length, st + ln.length); pos = en;
    const lw = doc.getTextWidth(ln);
    const x0 = b.align === 'right' ? x - lw : b.align === 'center' ? x - lw / 2 : x;
    const y = b.yPt + li * b.lineHeightPt;
    for(let i = st; i < en;){
      const c = mk.col[i], u = mk.ul[i]; let j = i + 1;
      while(j < en && mk.col[j] === c && mk.ul[j] === u) j++;
      if(c >= 0 || u){
        const xa = x0 + doc.getTextWidth(safe.slice(st, i)), w = doc.getTextWidth(safe.slice(i, j));
        if(c >= 0){
          const q = RP_HL_RGBA[c];
          doc.saveGraphicsState();
          try{ doc.setGState(new doc.GState({ opacity:q[3] })); }catch(e){}
          doc.setFillColor(q[0], q[1], q[2]);
          doc.rect(xa, y - fs * 0.8, w, fs * 1.02, 'F');
          doc.restoreGraphicsState();
        }
        if(u){
          doc.setDrawColor(b.color.r, b.color.g, b.color.b);
          doc.setLineWidth(Math.max(0.5, fs * 0.055));
          doc.line(xa, y + fs * 0.14, xa + w, y + fs * 0.14);
        }
      }
      i = j;
    }
  });
  doc.setTextColor(b.color.r, b.color.g, b.color.b);
}
/* Gras posé à la main (Ctrl+B) : la ligne est écrite morceau par morceau, en
   passant en graisse sur les passages concernés. Sans gras, rien ne change. */
function pdfTextWithBold(doc, b, lines, x, isBold){
  const mk = b.marks, safe = pdfSafeText(b.text);
  const plain = () => lines.forEach((ln, i)=> doc.text(ln, x, b.yPt + i * b.lineHeightPt, { align:b.align, baseline:'alphabetic' }));
  if(isBold || !mk || !mk.bd || safe.length !== b.text.length || !mk.bd.some(v => v)) return plain();
  const fN = b.italic ? 'italic' : 'normal', fB = b.italic ? 'bolditalic' : 'bold';
  let pos = 0;
  lines.forEach((ln, li) => {
    const y = b.yPt + li * b.lineHeightPt;
    let st = safe.indexOf(ln, pos); if(st < 0) st = pos;
    const en = Math.min(safe.length, st + ln.length); pos = en;
    const segs = [];
    for(let i = st; i < en;){ const k = mk.bd[i] ? 1 : 0; let j = i + 1; while(j < en && (mk.bd[j] ? 1 : 0) === k) j++; segs.push([safe.slice(i, j), k]); i = j; }
    if(segs.length === 1 && !segs[0][1]){ doc.text(ln, x, y, { align:b.align, baseline:'alphabetic' }); return; }
    const wOf = sg => { doc.setFont(b.font, sg[1] ? fB : fN); return doc.getTextWidth(sg[0]); };
    const tw = segs.reduce((a, sg) => a + wOf(sg), 0);
    let xx = b.align === 'right' ? x - tw : b.align === 'center' ? x - tw / 2 : x;
    segs.forEach(sg => { const w = wOf(sg); doc.text(sg[0], xx, y, { baseline:'alphabetic' }); xx += w; });
    doc.setFont(b.font, fN);
  });
}
/* Impression navigateur : on remplace le texte de la ligne par des segments marqués. */
function rpDecoratePrint(root){
  const map = new Map((S.project.elements || []).map(x => [x.id, x]));
  root.querySelectorAll('.line[data-id]').forEach(div => {
    if(div.classList.contains('line--card')) return;
    const m = map.get(div.dataset.id); if(!m || !m.text) return;
    const full = div.textContent;
    if(full.length < m.text.length || full.slice(0, m.text.length) !== m.text) return;
    const fl = rpMarkFlags(m, m.text.length); if(!fl) return;
    const frag = document.createDocumentFragment(); const n = m.text.length;
    for(let i = 0; i < n;){
      const c = fl.col[i], u = fl.ul[i], g = fl.bd[i]; let j = i + 1;
      while(j < n && fl.col[j] === c && fl.ul[j] === u && fl.bd[j] === g) j++;
      const txt = m.text.slice(i, j);
      if(c < 0 && !u && !g) frag.appendChild(document.createTextNode(txt));
      else {
        const sp = document.createElement('span');
        let css = '-webkit-print-color-adjust:exact; print-color-adjust:exact;';
        if(c >= 0){ const q = RP_HL_RGBA[c]; css += 'background-color:rgba(' + q[0] + ',' + q[1] + ',' + q[2] + ',' + q[3] + ');'; }
        if(u) css += 'text-decoration:underline;';
        if(g) css += 'font-weight:700;';
        sp.style.cssText = css; sp.textContent = txt; frag.appendChild(sp);
      }
      i = j;
    }
    if(full.length > n) frag.appendChild(document.createTextNode(full.slice(n)));
    div.textContent = ''; div.appendChild(frag);
  });
}
/* Final Draft : un <Text> par segment, avec Style="Bold+Underline" et Background (16 bits par canal). */
function rpFdxRuns(el, t, rid){
  const n = (el.text || '').length;
  if(!n || t.length < n || t.slice(0, n).toLowerCase() !== el.text.toLowerCase()) return null;
  const fl = rpMarkFlags(el, n); if(!fl) return null;
  const hx = v => { const h = Math.round(v).toString(16).toUpperCase().padStart(2, '0'); return h + h; };
  const bg = c => { const q = RP_HL_RGBA[c], mix = k => q[k] * q[3] + 255 * (1 - q[3]); return '#' + hx(mix(0)) + hx(mix(1)) + hx(mix(2)); };
  const runs = [];
  for(let i = 0; i < n;){
    const c = fl.col[i], u = fl.ul[i], g = fl.bd[i]; let j = i + 1;
    while(j < n && fl.col[j] === c && fl.ul[j] === u && fl.bd[j] === g) j++;
    const sty = [g ? 'Bold' : '', u ? 'Underline' : ''].filter(Boolean).join('+');
    runs.push('<Text' + rid + (sty ? ' Style="' + sty + '"' : '') + (c >= 0 ? ' Background="' + bg(c) + '"' : '') + '>' + esc(t.slice(i, j)) + '</Text>');
    i = j;
  }
  if(t.length > n) runs.push('<Text' + rid + '>' + esc(t.slice(n)) + '</Text>');
  return runs.join('');
}
/* Fountain : le soulignement s'écrit _texte_, le gras **texte** (pas de norme pour le surlignage). */
function rpFountainUnderline(el, t){
  const n = (el.text || '').length;
  if(!n || t.length < n || t.slice(0, n) !== el.text) return t;
  const fl = rpMarkFlags(el, n); if(!fl) return t;
  /* Entoure de mk les passages [i, j) où on[k] vaut 1, espaces du bord laissés dehors. */
  const wrap = (s0, e0, on, mk, inner) => {
    let out = '', last = s0;
    for(let i = s0; i < e0;){
      if(!on[i]){ i++; continue; }
      let j = i; while(j < e0 && on[j]) j++;
      let a = i, b = j; while(a < b && /\s/.test(t[a])) a++; while(b > a && /\s/.test(t[b - 1])) b--;
      if(b > a){ out += inner(last, a) + mk + inner(a, b) + mk; last = b; }
      i = j;
    }
    return out + inner(last, e0);
  };
  const under = (a, b) => wrap(a, b, fl.ul, '_', (x, y) => t.slice(x, y));
  return wrap(0, n, fl.bd, '**', under) + t.slice(n);
}

/* Relève sur une feuille déjà mise en page par le navigateur tout ce qu'il
   faut pour la redessiner : fond, images, et chaque bloc de texte avec sa
   position, sa largeur utile, sa police et son alignement. Rien n'est
   décidé ici — on ne fait que constater ce que le navigateur a calculé. */
function pdfReadSheet(sheet){
  const pr = sheet.getBoundingClientRect();
  const scs = getComputedStyle(sheet);
  // Ton d'encre "discret" (numéro de scène en marge…) : relevé sur une
  // sonde de la même classe que les repères de page plutôt que deviné, pour
  // être certain qu'il correspond exactement à ce que l'écran affiche,
  // thème clair ou sombre. Sans cela, le numéro de scène ressortait du même
  // noir plein que le texte à côté de lui dans le PDF, alors qu'il est
  // délibérément plus discret à l'écran.
  const softProbe = document.createElement('span');
  softProbe.className = 'sheet-num';
  softProbe.style.cssText = 'position:absolute; visibility:hidden;';
  sheet.appendChild(softProbe);
  const softColor = parseCssColor(getComputedStyle(softProbe).color);
  softProbe.remove();
  // v46 : écart du numéro de scène (variable --sn-gap), mesuré sur une sonde plutôt que codé en dur.
  const snProbe = document.createElement('span');
  snProbe.style.cssText = 'position:absolute; visibility:hidden; display:block; height:0; width:var(--sn-gap,.4cm);';
  sheet.appendChild(snProbe);
  const snGapPt = snProbe.getBoundingClientRect().width * PX_TO_PT;
  snProbe.remove();
  const page = {
    snGapPt: (snGapPt > 0 && isFinite(snGapPt)) ? snGapPt : 0.4 * 28.3465,
    wPt: pr.width * PX_TO_PT,
    hPt: pr.height * PX_TO_PT,
    bg: parseCssColor(scs.backgroundColor),
    softColor,
    // Filigrane : texte simple sur le sheet (voir buildPdfStage/printScript),
    // relevé à part et JAMAIS via la boucle générique ci-dessous — il doit
    // sortir en diagonale (doc.text{angle:...}), ce qu'une simple boîte de
    // texte axée sur les axes ne peut pas produire. Le CSS rotate() de
    // .sheet-watermark n'existe d'ailleurs que pour l'écran/l'impression
    // navigateur ; getBoundingClientRect() ignore la rotation, donc le
    // relever comme un bloc normal produirait une boîte fausse.
    watermark: (sheet.querySelector('.sheet-watermark') || {}).textContent || null,
    images: [],
    topImages: [],   // v90 : le dessin libre de la page de titre se pose PAR-DESSUS le texte, comme à l'écran
    blocks: [],
    rules: []
  };

  sheet.querySelectorAll('img').forEach(img=>{
    if(!img.src) return;
    const r = img.getBoundingClientRect();
    const ics = getComputedStyle(img);
    // object-fit:cover — l'image déborde de la page, qui la recadre. Un PDF
    // n'affiche rien hors de sa page : le débordement fait le recadrage.
    let w = r.width, h = r.height, x = r.left - pr.left, y = r.top - pr.top;
    if(ics.objectFit === 'cover' && img.naturalWidth && img.naturalHeight){
      const scale = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
      w = img.naturalWidth * scale; h = img.naturalHeight * scale;
      x += (r.width - w) / 2; y += (r.height - h) / 2;
    }
    // Image posée sur une page du scénario (js/37-page-images.js) : son cadre la rogne, devant ou derrière le texte.
    const pgi = img.parentNode && img.parentNode.classList && img.parentNode.classList.contains('pgi-print') ? img.parentNode : null;
    let clip = null;
    if(pgi){ const cr = pgi.getBoundingClientRect(); clip = { xPt:(cr.left - pr.left) * PX_TO_PT, yPt:(cr.top - pr.top) * PX_TO_PT, wPt:cr.width * PX_TO_PT, hPt:cr.height * PX_TO_PT }; }
    ((img.classList && img.classList.contains('tp-drawing-layer')) || (pgi && pgi.classList.contains('is-front')) ? page.topImages : page.images).push({
      src: img.src, opacity: parseFloat(ics.opacity) || 1,
      xPt: x * PX_TO_PT, yPt: y * PX_TO_PT, wPt: w * PX_TO_PT, hPt: h * PX_TO_PT, clip
    });
  });

  // Blocs de texte : tout élément qui porte lui-même du texte (et pas
  // seulement via ses enfants), quel que soit son niveau d'imbrication.
  sheet.querySelectorAll('*').forEach(el=>{
    if(el.classList.contains('sheet-watermark')) return;   // relevé à part, plus haut
    const own = Array.from(el.childNodes)
      .filter(n => n.nodeType === 3 && n.nodeValue.trim())
      .map(n => n.nodeValue).join('');
    const sceneNum = el.dataset ? el.dataset.sceneNum : null;
    if(!own.trim() && !sceneNum) return;
    const cs = getComputedStyle(el);
    if(cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    const padL = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0), padR = (parseFloat(cs.paddingRight) || 0) + (parseFloat(cs.borderRightWidth) || 0);
    const padT = parseFloat(cs.paddingTop) || 0;
    const fontSizePx = parseFloat(cs.fontSize) || 16;
    let lineHeightPx = parseFloat(cs.lineHeight);
    if(!isFinite(lineHeightPx) || lineHeightPx <= 0) lineHeightPx = fontSizePx * 1.2;
    const padB = parseFloat(cs.paddingBottom) || 0;
    const borderT = parseFloat(cs.borderTopWidth) || 0, borderB = parseFloat(cs.borderBottomWidth) || 0;
    const fm = fontMetrics(cs.font || (cs.fontSize + ' ' + cs.fontFamily), fontSizePx);
    let baseline = borderT + padT + (lineHeightPx - (fm.asc + fm.desc)) / 2 + fm.asc;
    // CARTON : le texte peut être centré verticalement (page entière) — on lit donc la
    // position RÉELLE de sa première ligne plutôt que de la déduire du haut de la boîte.
    let cardRows = 0;
    if(el.classList.contains('line--card')){
      const rg = document.createRange(); rg.selectNodeContents(el);
      const rr = Array.from(rg.getClientRects()).filter(q => q.width > 0 && q.height > 0);
      if(rr.length){
        baseline = (rr[0].top - r.top) + fm.asc;
        cardRows = new Set(rr.map(q => Math.round(q.top))).size;
      }
    }
    // Nombre de lignes que le navigateur a RÉELLEMENT utilisées. Les polices
    // du PDF ne sont pas au micron les mêmes que celles de l'écran : sans ce
    // repère, une boîte juste à la taille de son texte (un numéro de page,
    // par exemple) se faisait couper en deux dans le PDF — « 2 » sur une
    // ligne, « . » sur la suivante. Le navigateur, lui, sait combien de
    // lignes il a fallu : on s'y tient.
    const domLines = cardRows || Math.max(1, Math.round((r.height - padT - padB - borderT - borderB) / lineHeightPx));
    let text = el.classList.contains('line--card')
      ? own.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/^\n+|\n+$/g, '')
      : own.replace(/\s+/g, ' ').trim();
    if(cs.textTransform === 'uppercase') text = text.toUpperCase();
    else if(cs.textTransform === 'lowercase') text = text.toLowerCase();
    const col = parseCssColor(cs.color);
    let opacity = parseFloat(cs.opacity) || 1;
    // CORRECTIF. Le corps du scénario (toute ligne .line — scène, action,
    // personnage, dialogue…) doit s'imprimer à encre pleine, point final :
    // c'est ainsi que fonctionnent les logiciels professionnels (Final
    // Draft, WriterDuet…), qui n'essaient jamais de recalculer une opacité
    // depuis l'écran. Un rendu vectoriel PDF et un rendu écran anti-aliasé
    // ne « pèsent » jamais exactement pareil au pixel près, même à couleur
    // identique — tenter de les faire correspondre dynamiquement, comme le
    // faisait l'ancien code, est justement ce qui produisait des écarts
    // d'un export à l'autre. On fige donc ici l'opacité et le canal alpha
    // de la couleur à 1 pour tout le texte du scénario, et on ne laisse
    // varier dynamiquement que les quelques éléments volontairement
    // discrets (mention « SUITE », etc.) qui gardent leur vraie opacité.
    if(el.classList.contains('line')){ opacity = 1; col.a = 1; }
    const marks = pdfMarksFor(el, own, text);   // v85

    page.blocks.push({
      text,
      xPt: (r.left - pr.left + padL) * PX_TO_PT,
      yPt: (r.top - pr.top + baseline) * PX_TO_PT,
      widthPt: Math.max(1, (r.width - padL - padR)) * PX_TO_PT,
      lineHeightPt: lineHeightPx * PX_TO_PT,
      maxLines: domLines,
      fontPt: fontSizePx * PX_TO_PT,
      font: pdfFontFor(cs.fontFamily),
      fam: cs.fontFamily,
      under: /underline/.test(cs.textDecorationLine || cs.textDecoration || ''),
      bold: (parseInt(cs.fontWeight, 10) || 400) >= 600,
      italic: /italic|oblique/.test(cs.fontStyle),
      align: (cs.textAlign === 'right' || cs.textAlign === 'center') ? cs.textAlign : 'left',
      color: col,
      opacity,
      // Le numéro de scène est un pseudo-élément ::before : il n'existe pas
      // dans le DOM, on le repose donc à la main, aux mêmes coordonnées que
      // celles que décrit sa règle CSS (boîte de 1,7 cm calée 2,1 cm à
      // gauche du texte, alignée à droite).
      marks,
      sceneNum: sceneNum || null
    });
  });

  // Cadres des cartons : le PDF ne connaît pas les bordures CSS, on les redessine en traits.
  sheet.querySelectorAll('.line--card').forEach(el=>{
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    const x0 = r.left - pr.left, y0 = r.top - pr.top, x1 = r.right - pr.left, y1 = r.bottom - pr.top;
    const sides = [['Top', x0, y0, x1, y0, 0, 1], ['Bottom', x0, y1, x1, y1, 0, -1],
                   ['Left', x0, y0, x0, y1, 1, 0], ['Right', x1, y0, x1, y1, -1, 0]];
    sides.forEach(sd=>{
      const w = parseFloat(cs['border' + sd[0] + 'Width']) || 0;
      if(w <= 0 || cs['border' + sd[0] + 'Style'] === 'none') return;
      const col = parseCssColor(cs['border' + sd[0] + 'Color']);
      const dbl = cs['border' + sd[0] + 'Style'] === 'double';
      const lw = dbl ? w / 3 : w;
      const offs = dbl ? [lw / 2, w - lw / 2] : [w / 2];
      offs.forEach(o=>{
        page.rules.push({ x1:(sd[1] + sd[5] * o) * PX_TO_PT, y1:(sd[2] + sd[6] * o) * PX_TO_PT,
                          x2:(sd[3] + sd[5] * o) * PX_TO_PT, y2:(sd[4] + sd[6] * o) * PX_TO_PT,
                          wPt: lw * PX_TO_PT, color: col });
      });
    });
  });
  return page;
}

/* Motif décoratif de la page de titre. Les motifs sont des dégradés CSS :
   ils n'existent pas dans un PDF, on les redessine en géométrie simple. */
function pdfPaintPattern(doc, design, wPt, hPt){
  if(!design || !design.pattern || design.pattern === 'none') return;
  const c = parseCssColor(hexToRgba(design.color || '#000000', .16));
  const px = v => v * PX_TO_PT;
  doc.saveGraphicsState();
  try{ doc.setGState(new doc.GState({ opacity:0.16 })); }catch(e){}
  doc.setFillColor(c.r, c.g, c.b); doc.setDrawColor(c.r, c.g, c.b); doc.setLineWidth(px(1));
  if(design.pattern === 'dots'){
    for(let y = 0; y < hPt; y += px(14)) for(let x = 0; x < wPt; x += px(14)) doc.circle(x, y, px(1.4), 'F');
  } else if(design.pattern === 'lines'){
    for(let y = 0; y < hPt; y += px(11)) doc.line(0, y, wPt, y);
  } else if(design.pattern === 'grid'){
    for(let y = 0; y < hPt; y += px(22)) doc.line(0, y, wPt, y);
    for(let x = 0; x < wPt; x += px(22)) doc.line(x, 0, x, hPt);
  } else if(design.pattern === 'diagonal'){
    const step = px(12) * Math.SQRT2;
    for(let d = -hPt; d < wPt + hPt; d += step) doc.line(d, hPt, d + hPt, 0);
  } else if(design.pattern === 'film'){
    doc.setLineWidth(px(3));
    for(let x = 0; x < wPt; x += px(16)) doc.line(x, 0, x, hPt);
  }
  doc.restoreGraphicsState();
}

/* Dessine dans le PDF une page relevée par pdfReadSheet. Aucune couleur
   n'est ici recalculée ou substituée : `b.color` et `b.opacity` viennent
   tels quels de ce que le navigateur affichait à l'écran (voir
   pdfReadSheet / getComputedStyle) — texte normal comme texte en gras,
   l'export reproduit exactement ce que montrait l'éditeur. */
function pdfPaintPage(doc, page){
  if(page.bg && page.bg.a > 0 && !(page.bg.r === 255 && page.bg.g === 255 && page.bg.b === 255)){
    doc.setFillColor(page.bg.r, page.bg.g, page.bg.b);
    doc.rect(0, 0, page.wPt, page.hPt, 'F');
  }
  if(page.pattern) pdfPaintPattern(doc, page.pattern, page.wPt, page.hPt);

  (page.images || []).forEach(im=>{
    try{
      doc.saveGraphicsState();
      if(im.opacity < 1){ try{ doc.setGState(new doc.GState({ opacity:im.opacity })); }catch(e){} }
      if(im.clip){ doc.rect(im.clip.xPt, im.clip.yPt, im.clip.wPt, im.clip.hPt, null); doc.clip(); doc.discardPath(); }   // image rognée
      doc.addImage(im.src, im.xPt, im.yPt, im.wPt, im.hPt);
      doc.restoreGraphicsState();
    }catch(e){ /* une image illisible ne doit pas faire échouer tout l'export */ }
  });

  (page.rules || []).forEach(ru=>{
    doc.setDrawColor(ru.color.r, ru.color.g, ru.color.b);
    doc.setLineWidth(Math.max(0.25, ru.wPt));
    doc.line(ru.x1, ru.y1, ru.x2, ru.y2);
  });

  page.blocks.forEach(b=>{
    // v51 : page de titre seulement — polices ajoutées et texte souligné (voir tpRasterBlock).
    if(page.pattern && b.text && b.fam && (tpIsRasterFam(b.fam) || b.under)){ try{ tpRasterBlock(doc, b); return; }catch(e){} }
    const isBold = !!b.bold;
    doc.setFont(b.font, isBold ? (b.italic ? 'bolditalic' : 'bold') : (b.italic ? 'italic' : 'normal'));
    doc.setFontSize(b.fontPt);
    doc.setTextColor(b.color.r, b.color.g, b.color.b);
    doc.saveGraphicsState();
    const alpha = (b.opacity === undefined ? 1 : b.opacity) * (b.color.a === undefined ? 1 : b.color.a);
    if(alpha < 1){ try{ doc.setGState(new doc.GState({ opacity:alpha })); }catch(e){} }

    if(b.sceneNum){
      // Boîte de 1,7 cm calée 2,1 cm à gauche du texte, alignée à droite :
      // son bord droit tombe donc 0,4 cm avant le début de l'entête.
      // CORRECTIF. Ce numéro est délibérément plus discret que l'en-tête de
      // scène à l'écran (var(--paper-ink-soft)) : sans repasser sur cette
      // teinte ici, il ressortait à l'export dans la même encre pleine que
      // le texte de la scène juste à côté.
      const prev = doc.getFontSize();
      const sc = page.softColor || b.color;
      doc.setFontSize(10.5);
      doc.setFont('courier', 'normal');
      doc.setTextColor(sc.r, sc.g, sc.b);
      doc.text(pdfSafeText(b.sceneNum), b.xPt - (page.snGapPt || 0.4 * 28.3465), b.yPt, { align:'right' });
      doc.setTextColor(b.color.r, b.color.g, b.color.b);
      doc.setFontSize(prev);
      doc.setFont(b.font, isBold ? 'bold' : 'normal');
    }

    if(b.text){
      // On élargit très légèrement la colonne tant que le PDF découpe le
      // texte en plus de lignes que le navigateur n'en a utilisées : c'est
      // un écart de métrique entre polices, pas un vrai retour à la ligne.
      // Un carton peut contenir des retours à la ligne voulus : chaque paragraphe est coupé séparément.
      const wrapAt = w => String(b.text).split('\n').reduce((acc, para)=> acc.concat(para ? doc.splitTextToSize(pdfSafeText(para), w) : ['']), []);
      let lines = wrapAt(b.widthPt);
      for(let tries = 0; b.maxLines && lines.length > b.maxLines && tries < 4; tries++)
        lines = wrapAt(b.widthPt * (1 + 0.02 * (tries + 1)));
      const x = b.align === 'right' ? b.xPt + b.widthPt
              : b.align === 'center' ? b.xPt + b.widthPt / 2
              : b.xPt;
      if(b.marks){ try{ pdfPaintMarks(doc, b, lines, x); }catch(e){} }   // v85 : surlignages et soulignements, sous le texte
      if(b.marks){ try{ pdfTextWithBold(doc, b, lines, x, isBold); }catch(e){ lines.forEach((ln, i)=> doc.text(ln, x, b.yPt + i * b.lineHeightPt, { align:b.align, baseline:'alphabetic' })); } }   // gras Ctrl+B
      else lines.forEach((ln, i)=> doc.text(ln, x, b.yPt + i * b.lineHeightPt, { align:b.align, baseline:'alphabetic' }));
    }
    doc.restoreGraphicsState();
  });

  (page.topImages || []).forEach(im=>{
    try{
      doc.saveGraphicsState();
      if(im.opacity < 1){ try{ doc.setGState(new doc.GState({ opacity:im.opacity })); }catch(e){} }
      if(im.clip){ doc.rect(im.clip.xPt, im.clip.yPt, im.clip.wPt, im.clip.hPt, null); doc.clip(); doc.discardPath(); }   // image rognée
      doc.addImage(im.src, im.xPt, im.yPt, im.wPt, im.hPt);
      doc.restoreGraphicsState();
    }catch(e){ /* une image illisible ne doit pas faire échouer tout l'export */ }
  });

  if(page.watermark){
    doc.saveGraphicsState();
    try{ doc.setGState(new doc.GState({ opacity:0.08 })); }catch(e){}
    doc.setFont('courier', 'bold');
    doc.setFontSize(52);
    doc.setTextColor(0, 0, 0);
    // Même angle et même centrage que le CSS (.sheet-watermark, rotate(-38deg)
    // sur le centre de la page) : ce que montre l'aperçu écran/impression est
    // ce que produit le PDF.
    doc.text(pdfSafeText(page.watermark), page.wPt / 2, page.hPt / 2, { align:'center', angle:38 });
    doc.restoreGraphicsState();
  }
}

/* Construit hors écran les feuilles telles que l'éditeur les affiche.
   Volontairement PAS display:none : un élément masqué n'est pas mis en
   page par le navigateur, et on n'aurait alors aucune position à relever. */
function buildPdfStage(p, numbers){
  const stage = document.createElement('div');
  stage.id = 'pdfStage';
  stage.className = FORMATS[p.format].cls;
  stage.style.cssText = 'position:fixed; left:-20000px; top:0; z-index:-1; pointer-events:none;';

  const sheets = [];
  if(p.settings.titlePageEnabled){
    const tp = buildTitlePageEl(p);
    tp.style.marginBottom = '0';
    stage.appendChild(tp);
    sheets.push({ el:tp, isTitle:true });
  }
  const res = measureExportPages(p);
  const PLB = computePageLabels(res.pages, p), PLX = PLB.labels;
  const cont = p.settings.showContinued ? firstSceneOfEachPage(res.pages, numbers, res.spill) : {};
  PLB.free.forEach((f, k) => { if(f) delete cont[k]; });   // une page sans numéro ne porte aucune mention de continuité
  res.pages.forEach((linesOfPage, k)=>{
    if(res.spill[k] && !linesOfPage.length) return;
    const sheet = document.createElement('div');
    sheet.className = 'print-page';
    if(res.spill[k+1]) sheet.style.height = 'auto';
    const num = PLX[k];
    if(pageNumShown(PLB, k, p.settings)){
      const n = document.createElement('div'); n.className = 'sheet-num'; n.textContent = num + '.';
      sheet.appendChild(n);
    }
    if(cont[k]){
      const ct = document.createElement('div'); ct.className = 'sheet-cont is-top';
      ct.textContent = pageContWord('top'); sheet.appendChild(ct);
    }
    if(cont[k+1] && !PLB.free[k] && !PLB.free[k+1]){
      const c = document.createElement('div'); c.className = 'sheet-cont is-bottom';
      c.textContent = pageContWord('bottom'); sheet.appendChild(c);
    }
    if(p.settings.watermarkText){
      const wm = document.createElement('div'); wm.className = 'sheet-watermark';
      wm.textContent = p.settings.watermarkText; sheet.appendChild(wm);
    }
    linesOfPage.forEach((div, ix) => { sheet.appendChild(div); div.classList.toggle('pg-first', ix === 0); });
    try{ pgiDecorateSheet(sheet, k, p, res.pages.length); }catch(e){}   // images sur les pages (js/37-page-images.js)
    stage.appendChild(sheet);
    sheets.push({ el:sheet, isTitle:false });
  });
  document.body.appendChild(stage);
  try{ revDecorateSheets(sheets.filter(s=>!s.isTitle).map(s=>s.el), p); }catch(e){}
  return { stage, sheets };
}
async function exportPDF(){
  closeExportMenu();
  const p = S.project;
  ensureSettings(p);
  toast(L('Génération du PDF…','Generating the PDF…'));

  let stageRef = null;
  try{
    const jsPDF = await loadJsPdf();
    await tpPreloadFonts(p);
    const numbers = sceneNumbers();
    const built = buildPdfStage(p, numbers);
    stageRef = built.stage;

    const pages = built.sheets.map(s=>{
      const data = pdfReadSheet(s.el);
      if(s.isTitle) data.pattern = ensureTPDesign(p);
      return data;
    });
    if(!pages.length) throw new Error(L('rien à exporter','nothing to export'));

    const doc = new jsPDF({ unit:'pt', orientation:'portrait', format:[pages[0].wPt, pages[0].hPt], compress:true });
    pages.forEach((page, i)=>{
      if(i > 0) doc.addPage([page.wPt, page.hPt], 'portrait');
      pdfPaintPage(doc, page);
    });
    doc.setProperties({ title:p.title || L('Scénario','Screenplay'), author:p.author || '' });

    stageRef.remove(); stageRef = null;

    // Téléchargé sur la machine ET ouvert dans un onglet.
    const filename = ((p.title || 'scenario').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'scenario') + '.pdf';
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();

    const win = window.open(url, '_blank');
    if(!win) toast(L('PDF téléchargé. Ton navigateur a bloqué l\u2019ouverture de l\u2019onglet : autorise les fenêtres pop-up pour l\u2019avoir aussi à l\u2019écran.','PDF downloaded. Your browser blocked the tab from opening: allow pop-ups to also see it on screen.'));
    else toast(L('PDF téléchargé et ouvert dans un onglet.','PDF downloaded and opened in a tab.'));

    // L'onglet a besoin du lien tant qu'il charge le fichier : on ne libère
    // la mémoire que bien après.
    setTimeout(()=>{ try{ URL.revokeObjectURL(url); }catch(e){} }, 180000);
  }catch(err){
    console.error(err);
    if(stageRef) stageRef.remove();
    toast(L('Impossible de générer le PDF (', 'Couldn\u2019t generate the PDF (') + (err && err.message ? err.message : L('erreur inconnue','unknown error')) + L('). Vérifie ta connexion : la génération a besoin de charger une bibliothèque. Tu peux aussi passer par « Imprimer ».', '). Check your connection: generation needs to load a library. You can also try \u201cPrint\u201d instead.'));
  }
}

function elementsToText(els, fountain){
  const numbers = sceneNumbers();
  const marks = contdMap(els);
  const rm = revTextMarks(S.project);
  let carry;                       // Fountain : marque d'un Personnage / d'une Parenthèse, reportée sur la réplique
  let out = [];
  els.forEach(el=>{
    const startLen = out.length;
    let t = contdText(el, marks);
    if(fountain && (el.type==='action' || el.type==='dialogue' || el.type==='text')) t = rpFountainUnderline(el, t);   // v85
    if(el.type==='scene'){ out.push(''); out.push(t.toUpperCase()); }
    else if(el.type==='action'){ out.push(''); out.push(t); }
    else if(el.type==='character'){
      // Convention Fountain : un ^ après le nom signale une réplique jouée
      // en même temps que la précédente. C'est ce que lisent WriterDuet,
      // Fade In, Highland… on l'écrit donc tel quel.
      out.push(''); out.push(t.toUpperCase() + (fountain && el.dual ? ' ^' : ''));
    }
    else if(el.type==='parenthetical'){ out.push(t.startsWith('(')?t:('('+t+')')); }
    else if(el.type==='dialogue'){ out.push(t); }
    else if(el.type==='transition'){ out.push(''); out.push((fountain?'> ':'')+t.toUpperCase()); }
    else if(el.type==='shot'){ out.push(''); out.push(t.toUpperCase()); }
    else if(el.type==='text'){ out.push(''); out.push(t); }
    else if(el.type==='card'){
      // Fountain : « > TEXTE < » = texte centré. Les autres alignements restent du texte simple.
      const c = cardOf(el);
      const body = (c.caps ? t.toUpperCase() : t).replace(/\n+$/,'').split('\n');
      out.push('');
      body.forEach(ln => out.push(fountain && c.align === 'center' ? '> ' + ln + ' <' : ln));
    }
    if(rm && out.length > startLen){
      const own = rm[el.id];
      const last = out.length - 1;
      if(!fountain){
        if(own !== undefined) out[last] = revTxtStar(out[last]);
      } else if(el.type === 'character' || el.type === 'parenthetical'){
        if(own !== undefined) carry = Math.max(own, carry === undefined ? -1 : carry);
      } else {
        let k = own;
        if(el.type === 'dialogue' && carry !== undefined) k = Math.max(own === undefined ? -1 : own, carry);
        if(k !== undefined){
          const note = revFountainNote(k, S.project);
          out[last] = (el.type === 'card' && / <$/.test(out[last])) ? out[last].replace(/ <$/, ' ' + note + ' <') : out[last] + ' ' + note;
        }
        carry = undefined;
      }
    }
  });
  return out.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}
function downloadBlob(filename, content, mime){
  const blob = new Blob([content], {type:mime||'text/plain'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}
function exportTXT(){
  closeExportMenu();
  const p = S.project;
  const header = `${p.title.toUpperCase()}\n${p.author?(L('Écrit par ','Written by ')+p.author+'\n'):''}\n`;
  const lg = revLegendText(p);
  downloadBlob((p.title||'scenario')+'.txt', header + (lg ? lg + '\n\n' : '') + elementsToText(visibleElements(), false), 'text/plain');
}
function exportFountain(){
  closeExportMenu();
  const p = S.project;
  const rr = revEnsure(p);
  const lastRd = (rr.rounds.length && rr.inText) ? rr.rounds[rr.rounds.length-1] : null;
  const draft = lastRd ? `Draft date: ${revDateStr(lastRd.date)} (${L('révision ','revision ')}${revColorName(lastRd.color).toLowerCase()})\n` : '';
  const omT = revOmittedText(p);
  const header = `Title: ${p.title}\nAuthor: ${p.author||''}\n${draft}${omT ? 'Notes: ' + omT + '\n' : ''}\n`;
  downloadBlob((p.title||'scenario')+'.fountain', header + elementsToText(visibleElements(), true), 'text/plain');
}

/* Export Final Draft (.fdx) — le format d'échange standard du métier
   (WriterDuet, Fade In… tous savent l'ouvrir et l'écrire). Raging Page avait
   déjà PDF/TXT/Fountain mais pas celui-là, qui est souvent le seul accepté
   par un partenaire de production ou un·e autre scénariste équipé·e de
   Final Draft. Le mapping est direct : un type d'élément Raging Page = un
   Paragraph Type FDX, comme dans elementsToText() ci-dessus. */
function fdxParagraphType(type){
  switch(type){
    case 'scene': return 'Scene Heading';
    case 'character': return 'Character';
    case 'parenthetical': return 'Parenthetical';
    case 'dialogue': return 'Dialogue';
    case 'transition': return 'Transition';
    case 'shot': return 'Shot';
    case 'text': return 'General';
    case 'action': default: return 'Action';
  }
}
function elementsToFDX(els){
  const marks = contdMap(els);
  const rm = revTextMarks(S.project);
  const rid = el => (rm && rm[el.id] !== undefined) ? ` RevisionID="${rm[el.id] + 1}"` : '';
  const para = el=>{
    let t = contdText(el, marks);
    if(el.type==='scene' || el.type==='character' || el.type==='transition' || el.type==='shot') t = t.toUpperCase();
    if(el.type==='parenthetical' && !t.startsWith('(')) t = '(' + t + (t.endsWith(')') ? '' : ')');
    if(el.type === 'card'){
      const c = cardOf(el);
      const style = [c.bold ? 'Bold' : '', c.italic ? 'Italic' : '', c.caps ? 'AllCaps' : ''].filter(Boolean).join('+');
      const al = c.align === 'left' ? 'Left' : c.align === 'right' ? 'Right' : 'Center';
      return `<Paragraph Type="Action" Alignment="${al}"><Text${style ? ' Style="' + style + '"' : ''}${rid(el)} Size="${c.size}">${esc(t.replace(/\n+$/,''))}</Text></Paragraph>`;
    }
    const runs = rpFdxRuns(el, t, rid(el));   // v85
    return `<Paragraph Type="${fdxParagraphType(el.type)}">${runs || `<Text${rid(el)}>${esc(t)}</Text>`}</Paragraph>`;
  };
  // Final Draft note le dialogue simultané en enfermant les DEUX blocs
  // dans un <DualDialogue>. On réutilise le même découpage en unités que
  // l'affichage : ce qui est côte à côte à l'écran l'est dans le .fdx.
  return flowUnits(els).map(u=>{
    if(u.kind === 'dual')
      return '<DualDialogue>\n' + u.left.concat(u.right).map(para).join('\n') + '\n</DualDialogue>';
    if(u.kind === 'block') return u.arr.map(para).join('\n');
    return para(u.el);
  }).join('\n');
}
function fdxDocument(p){
  const body = elementsToFDX(visibleElements());
  const titleParas = [];
  if(p.title) titleParas.push(`<Paragraph><Text>${esc(p.title)}</Text></Paragraph>`);
  if(p.author) titleParas.push(`<Paragraph><Text>${esc(L('Écrit par ','Written by ') + p.author)}</Text></Paragraph>`);
  const titlePage = titleParas.length
    ? `<TitlePage>\n<Content>\n${titleParas.join('\n')}\n</Content>\n</TitlePage>\n`
    : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<FinalDraft DocumentType="Script" Template="No" Version="1">\n<Content>\n${body}\n</Content>\n${revFdxBlock(p)}${titlePage}</FinalDraft>\n`;
}
function exportFDX(){
  closeExportMenu();
  const p = S.project;
  downloadBlob((p.title||'scenario')+'.fdx', fdxDocument(p), 'application/xml');
}

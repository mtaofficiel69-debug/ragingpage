/* =====================================================================
   CARTONS — texte du scénario placé « où l'on veut », avec son propre style
   ---------------------------------------------------------------------
   Un carton est un élément comme les autres (type 'card') : il vit dans
   l'ordre du scénario, s'exporte, se déplace avec sa scène. Son aspect est
   stocké dans el.card — jamais dans le texte — et se règle depuis le
   panneau de droite dès que le curseur est dedans :
     taille (pt) · alignement · largeur · police · gras / italique /
     majuscules · cadre (filets, cadre, double cadre) · espacement ·
     « page entière » (le carton occupe sa propre feuille, centré au milieu).
   Maj+Entrée fait un retour à la ligne à l'intérieur du carton.
===================================================================== */
const CARD_FONTS = {
  mono:'var(--script-font,var(--mono))',
  serif:'Georgia, "Times New Roman", Times, serif',
  sans:'Helvetica, Arial, sans-serif'
};
const CARD_VARS = ['--card-size','--card-align','--card-weight','--card-style','--card-case','--card-font','--card-width','--card-ml','--card-mr','--card-sp','--card-color','--card-lh'];
/* Couleur et interligne d'un carton (réglages ajoutés au panneau) : absents = rendu d'origine, au pixel près. */
function cardColorOk(v){ return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v); }
function cardLhOk(v){ v = Number(v); return isFinite(v) && v >= 0.9 && v <= 2.5 && Math.abs(v - 1.35) > 0.001; }
function cardDefaults(){
  return { size:22, align:'center', width:100, bold:true, italic:false, caps:true, font:'mono', frame:'none', space:2, full:false };
}
function cardOf(el){ return Object.assign(cardDefaults(), (el && el.card) || {}); }
/* Pose (ou retire) le style d'un carton sur sa ligne. Appelée partout où
   une ligne est fabriquée : éditeur, mesure d'export, longueur des scènes. */
function layoutOf(el){ return Object.assign({ align:null, left:null, right:null }, (el && el.layout) || {}); }
function layoutActive(el){ const l = layoutOf(el); return !!(l.align || isFinite(l.left) && l.left !== null || isFinite(l.right) && l.right !== null); }
function applyLayoutStyle(div, el){
  ['data-lay-a','data-lay-l','data-lay-r'].forEach(a => div.removeAttribute(a));
  ['--lay-a','--lay-l','--lay-r'].forEach(v => div.style.removeProperty(v));
  if(!el || el.type === 'card' || el.type === 'note') return;
  const l = layoutOf(el), st = div.style;
  if(l.align === 'left' || l.align === 'center' || l.align === 'right'){ div.setAttribute('data-lay-a', '1'); st.setProperty('--lay-a', l.align); }
  if(l.left !== null && isFinite(l.left)){ div.setAttribute('data-lay-l', '1'); st.setProperty('--lay-l', Math.max(0, Math.min(14, Number(l.left))) + 'cm'); }
  if(l.right !== null && isFinite(l.right)){ div.setAttribute('data-lay-r', '1'); st.setProperty('--lay-r', 'calc(' + Math.max(0, Math.min(14, Number(l.right))) + 'cm - 3px)'); }
}
function applyCardStyle(div, el){
  applyLayoutStyle(div, el);
  if(el && el.fpg) div.dataset.fpg = el.fpg; else delete div.dataset.fpg;   // page sans numéro (voir js/33-free-pages.js)
  if(!el || el.type !== 'card'){
    CARD_VARS.forEach(n => div.style.removeProperty(n));
    div.style.minHeight = '';
    delete div.dataset.frame; delete div.dataset.full;
    return;
  }
  const c = cardOf(el), st = div.style;
  const w = Math.min(100, Math.max(20, Number(c.width) || 100));
  st.setProperty('--card-size', Math.min(120, Math.max(8, Number(c.size) || 22)) + 'pt');
  st.setProperty('--card-align', c.align === 'left' || c.align === 'right' ? c.align : 'center');
  st.setProperty('--card-weight', c.bold ? '700' : '400');
  st.setProperty('--card-style', c.italic ? 'italic' : 'normal');
  st.setProperty('--card-case', c.caps ? 'uppercase' : 'none');
  st.setProperty('--card-font', CARD_FONTS[c.font] || CARD_FONTS.mono);
  st.setProperty('--card-width', w >= 100 ? 'auto' : w + '%');
  const al = (c.align === 'left' || c.align === 'right') ? c.align : 'center';
  st.setProperty('--card-ml', (w >= 100 || al === 'left') ? '-3px' : 'auto');
  st.setProperty('--card-mr', (w >= 100 || al === 'right') ? '-3px' : 'auto');
  st.setProperty('--card-sp', (Math.max(0, Number(c.space)) * 18) + 'pt');
  if(cardColorOk(c.color)) st.setProperty('--card-color', c.color); else st.removeProperty('--card-color');
  if(cardLhOk(c.lh)) st.setProperty('--card-lh', String(Number(c.lh))); else st.removeProperty('--card-lh');
  if(c.frame && c.frame !== 'none' && !c.full) div.dataset.frame = c.frame; else delete div.dataset.frame;
  if(c.full) div.dataset.full = '1'; else { delete div.dataset.full; div.style.minHeight = ''; }
}
/* ---- Panneau « Carton » (à droite, quand le curseur est dans un carton) ----
   Dans la DA de l'appli : modèles en un clic (avec aperçu), taille au point près, police avec aperçu,
   alignement en icônes, cadres en vignettes, largeur au pourcentage près, interligne, couleur.
   Tout passe par el.card et applyCardStyle : l'éditeur, l'impression et le PDF lisent le même rendu. */
const CARD_PRESETS = [
  ['title', ['Grand titre','Big title'],   { size:36, align:'center', width:100, bold:true,  italic:false, caps:true,  font:'mono',  frame:'none',   space:2, lh:1.35, color:'' }, 'TITRE'],
  ['act',   ['Acte / intertitre','Act / divider'], { size:24, align:'center', width:75, bold:true, italic:false, caps:true, font:'mono', frame:'lines', space:2, lh:1.35, color:'' }, 'ACTE I'],
  ['quote', ['Citation','Quote'],          { size:14, align:'center', width:75,  bold:false, italic:true,  caps:false, font:'serif', frame:'none',   space:2, lh:1.5,  color:'' }, '« Citation »'],
  ['place', ['Lieu et date','Place & date'], { size:14, align:'left', width:100, bold:false, italic:false, caps:true,  font:'mono',  frame:'none',   space:1, lh:1.35, color:'' }, 'PARIS, 1942'],
  ['box',   ['Encadré','Boxed'],           { size:16, align:'center', width:75,  bold:false, italic:false, caps:false, font:'sans',  frame:'box',    space:2, lh:1.35, color:'' }, 'Encadré'],
  ['end',   ['Fin','The end'],             { size:48, align:'center', width:100, bold:true,  italic:false, caps:true,  font:'serif', frame:'none',   space:4, lh:1.35, color:'' }, 'FIN']
];
const CARD_COLORS = [['', ['Encre','Ink'], 'var(--paper-ink)'], ['#5a5f68', ['Gris','Grey']], ['#8e2430', ['Bordeaux','Burgundy']], ['#1f4e79', ['Bleu nuit','Navy']], ['#2f5d3a', ['Vert forêt','Forest green']]];
function cardIsPreset(c, p){ return Object.keys(p).every(k => k === 'lh' ? Math.abs((Number(c.lh) || 1.35) - p.lh) < 0.001 : k === 'color' ? (c.color || '') === p.color : String(c[k]) === String(p[k])); }
function cardPanelHtml(el){
  const c = cardOf(el), id = el.id;
  const svg = p => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const act = (prop, val) => `data-act="cardSet" data-id="${id}|${prop}|${val}"`;
  const on = (prop, val) => String(c[prop]) === String(val) ? ' on' : '';
  const lh = Number(c.lh) || 1.35, color = cardColorOk(c.color) ? c.color.toLowerCase() : '';
  const presets = CARD_PRESETS.map(([k, name, p, demo]) => {
    const fs = Math.max(9, Math.min(19, p.size * 0.42));
    const st = `font-family:${CARD_FONTS[p.font]};font-size:${fs}px;font-weight:${p.bold ? 700 : 400};font-style:${p.italic ? 'italic' : 'normal'};text-transform:${p.caps ? 'uppercase' : 'none'};text-align:${p.align};`;
    return `<button type="button" class="crd-preset${cardIsPreset(c, p) ? ' on' : ''}" data-act="cardPreset" data-id="${id}|${k}" title="${L(name[0], name[1])}">
      <span class="crd-preset-demo" data-frame="${p.frame}" style="${st}">${esc(k === 'quote' ? L('« Citation »','“Quote”') : k === 'end' ? L('FIN','THE END') : k === 'box' ? L('Encadré','Boxed') : k === 'act' ? L('ACTE I','ACT I') : k === 'place' ? L('PARIS, 1942','PARIS, 1942') : L('TITRE','TITLE'))}</span>
      <span class="crd-preset-name">${L(name[0], name[1])}</span></button>`;
  }).join('');
  const fonts = [['mono', L('Machine','Typewriter')], ['serif', 'Serif'], ['sans', 'Sans']].map(([k, n]) =>
    `<button type="button" class="crd-tile${on('font', k)}" ${act('font', k)} title="${n}"><span class="crd-aa" style="font-family:${CARD_FONTS[k]};">Aa</span><span>${n}</span></button>`).join('');
  const aligns = [['left', svg('<path d="M2.5 4h11M2.5 7h7M2.5 10h11M2.5 13h7"/>'), L('À gauche','Left')], ['center', svg('<path d="M2.5 4h11M4.5 7h7M2.5 10h11M4.5 13h7"/>'), L('Centré','Centered')], ['right', svg('<path d="M2.5 4h11M6.5 7h7M2.5 10h11M6.5 13h7"/>'), L('À droite','Right')]].map(([k, ic, n]) =>
    `<button type="button" class="crd-seg-b${on('align', k)}" ${act('align', k)} title="${n}" aria-label="${n}">${ic}</button>`).join('');
  const styles = [['bold', '<b>B</b>', L('Gras','Bold')], ['italic', '<i style="font-family:Georgia,serif;">I</i>', L('Italique','Italic')], ['caps', '<span style="font-size:11.5px;letter-spacing:.04em;">AA</span>', L('Majuscules','Capitals')]].map(([k, g, n]) =>
    `<button type="button" class="crd-seg-b${c[k] ? ' on' : ''}" ${act(k, !c[k])} title="${n}" aria-label="${n}" aria-pressed="${!!c[k]}">${g}</button>`).join('');
  const frames = [['none', L('Aucun','None')], ['lines', L('Filets','Rules')], ['box', L('Cadre','Box')], ['double', L('Double','Double')]].map(([k, n]) =>
    `<button type="button" class="crd-tile${on('frame', k)}" ${act('frame', k)} title="${n}"><span class="crd-frame-demo" data-frame="${k}"><i></i><i></i></span><span>${n}</span></button>`).join('');
  const seg = (prop, opts, cur) => opts.map(([v, n]) => `<button type="button" class="crd-seg-b txt${String(cur) === String(v) ? ' on' : ''}" ${act(prop, v)}>${n}</button>`).join('');
  const colors = CARD_COLORS.map(([v, n, show]) => `<button type="button" class="crd-sw${color === v ? ' on' : ''}" ${act('color', v || 'none')} title="${L(n[0], n[1])}" aria-label="${L(n[0], n[1])}" style="--sw:${show || v};"></button>`).join('');
  const custom = color && !CARD_COLORS.some(x => x[0] === color);
  return `<div class="pane-title">${L('Carton','Title card')}</div>
  <div class="crd" data-card-id="${id}">
    <section class="crd-sec">
      <div class="crd-h">${L('Modèles','Templates')}<small>${L('un clic, tout reste réglable','one click, all still adjustable')}</small></div>
      <div class="crd-presets">${presets}</div>
    </section>
    <section class="crd-sec">
      <div class="crd-h">${L('Texte','Text')}</div>
      <div class="crd-line"><span class="crd-lbl">${L('Taille','Size')}</span>
        <span class="crd-step"><button type="button" data-act="cardStep" data-id="${id}|size|-1" title="${L('Plus petit','Smaller')}" aria-label="${L('Plus petit','Smaller')}">−</button><input type="number" id="cardSizeNum" min="8" max="120" step="1" value="${c.size}" aria-label="${L('Taille en points','Size in points')}"><em>pt</em><button type="button" data-act="cardStep" data-id="${id}|size|1" title="${L('Plus grand','Bigger')}" aria-label="${L('Plus grand','Bigger')}">+</button></span></div>
      <input type="range" class="crd-range" id="cardSizeRange" min="10" max="96" step="1" value="${Math.min(96, Math.max(10, c.size))}" aria-label="${L('Taille','Size')}">
      <div class="crd-chips">${[[14,'S'],[22,'M'],[32,'L'],[48,'XL'],[72,'XXL']].map(([v, n]) => `<button type="button" class="crd-chip${on('size', v)}" ${act('size', v)}>${n}</button>`).join('')}</div>
      <div class="crd-lbl crd-lbl-top">${L('Police','Font')}</div>
      <div class="crd-tiles three">${fonts}</div>
      <div class="crd-line crd-line-2">
        <span class="crd-seg" role="group" aria-label="${L('Style','Style')}">${styles}</span>
        <span class="crd-seg" role="group" aria-label="${L('Alignement','Alignment')}">${aligns}</span>
      </div>
      <div class="crd-line stack"><span class="crd-lbl">${L('Interligne','Line spacing')}</span>
        <span class="crd-seg fill">${seg('lh', [[1.1, L('Serré','Tight')], [1.35, 'Normal'], [1.7, L('Aéré','Airy')]], [1.1, 1.35, 1.7].find(v => Math.abs(v - lh) < 0.001) || '')}</span></div>
      <div class="crd-line"><span class="crd-lbl">${L('Couleur','Colour')}</span>
        <span class="crd-sws">${colors}<label class="crd-sw crd-sw-custom${custom ? ' on' : ''}" title="${L('Autre couleur…','Other colour…')}" style="${custom ? '--sw:' + color + ';' : ''}"><input type="color" id="cardColorPick" value="${color || '#1a1d22'}" aria-label="${L('Autre couleur','Other colour')}"></label></span></div>
    </section>
    <section class="crd-sec">
      <div class="crd-h">${L('Bloc','Block')}</div>
      <div class="crd-line"><span class="crd-lbl">${L('Largeur','Width')}</span><span class="crd-val" id="cardWidthVal">${Math.round(c.width)} %</span></div>
      <input type="range" class="crd-range" id="cardWidthRange" min="20" max="100" step="1" value="${Math.min(100, Math.max(20, Number(c.width) || 100))}" aria-label="${L('Largeur','Width')}">
      <div class="crd-chips">${[[100,'100 %'],[75,'75 %'],[50,'50 %'],[33,'33 %']].map(([v, n]) => `<button type="button" class="crd-chip${on('width', v)}" ${act('width', v)}>${n}</button>`).join('')}</div>
      ${c.full ? '' : `<div class="crd-lbl crd-lbl-top">${L('Cadre','Frame')}</div><div class="crd-tiles four">${frames}</div>`}
      <div class="crd-line stack"><span class="crd-lbl">${L('Espace autour','Spacing')}</span>
        <span class="crd-seg fill">${seg('space', [[0, L('Aucun','None')], [1, L('Serré','Tight')], [2, 'Normal'], [4, L('Aéré','Airy')]], c.space)}</span></div>
      <button type="button" class="crd-switch${c.full ? ' on' : ''}" ${act('full', !c.full)} role="switch" aria-checked="${!!c.full}">
        <span class="crd-switch-t"><b>${L('Page entière','Full page')}</b><small>${L('Le carton prend sa propre feuille, centré au milieu','The card gets its own page, centred in the middle')}</small></span><span class="crd-knob"></span></button>
    </section>
    <p class="crd-hint">${L('Maj+Entrée : retour à la ligne dans le carton.','Shift+Enter: line break inside the card.')}</p>
    <div class="crd-foot">
      <button type="button" class="crd-btn" data-act="cardReset" data-id="${id}" title="${L('Revenir au style de départ d’un carton','Back to a card’s starting style')}">${icon('undo')}<span>${L('Réinitialiser','Reset')}</span></button>
      <button type="button" class="crd-btn is-danger" data-act="deleteElement" data-id="${id}">${icon('trash')}<span>${L('Supprimer','Delete')}</span></button>
    </div>
  </div>`;
}
/* Applique un changement de style au carton, sans perdre le défilement du panneau. */
function cardCommit(el, live){
  const div = document.querySelector('#page [data-id="' + el.id + '"]');
  if(div) applyCardStyle(div, el);
  if(live){ schedulePaginate(); scheduleAutosave(); return; }
  repaginateNow(); scheduleAutosave();
  const side = document.getElementById('sidePane'), top = side ? side.scrollTop : 0;
  showContextPanel(el);
  if(side) side.scrollTop = top;
}
function bindCardPanel(el){
  const r = document.getElementById('cardSizeRange'); if(!r) return;
  let undone = false;
  const live = (inp, apply) => {
    inp.addEventListener('input', ()=>{
      if(!undone){ pushUndo(); undone = true; }
      el.card = cardOf(el); apply(inp.value);
      cardCommit(el, true);
    });
    inp.addEventListener('change', ()=>{ undone = false; cardCommit(el); });
  };
  live(r, v => { el.card.size = Number(v); const n = document.getElementById('cardSizeNum'); if(n) n.value = v; });
  const w = document.getElementById('cardWidthRange');
  if(w) live(w, v => { el.card.width = Number(v); const t = document.getElementById('cardWidthVal'); if(t) t.textContent = v + ' %'; });
  const n = document.getElementById('cardSizeNum');
  if(n){
    const go = ()=>{ const v = Math.round(Number(n.value)); if(!isFinite(v)) return; cardSet(el.id + '|size|' + Math.min(120, Math.max(8, v))); };
    n.addEventListener('change', go);
    n.addEventListener('keydown', e=>{ if(e.key === 'Enter'){ e.preventDefault(); go(); } });
  }
  const cp = document.getElementById('cardColorPick');
  if(cp){
    let pushed = false;
    cp.addEventListener('input', ()=>{
      if(!pushed){ pushUndo(); pushed = true; }
      el.card = cardOf(el); el.card.color = cp.value.toLowerCase();
      cardCommit(el, true);
    });
    cp.addEventListener('change', ()=>{ pushed = false; cardCommit(el); });
  }
}
function cardSet(raw){
  const parts = String(raw).split('|');
  const el = findEl(parts[0]); if(!el || el.type !== 'card') return;
  const prop = parts[1], val = parts[2];
  if(prop === 'color' && val !== 'none' && !cardColorOk(val)) return;
  pushUndo();
  el.card = cardOf(el);
  if(prop === 'color'){ if(val === 'none') delete el.card.color; else el.card.color = val.toLowerCase(); }
  else if(prop === 'lh'){ if(Math.abs(Number(val) - 1.35) < 0.001) delete el.card.lh; else el.card.lh = Number(val); }
  else el.card[prop] = (prop === 'size' || prop === 'width' || prop === 'space') ? Number(val)
                : val === 'true' ? true : val === 'false' ? false : val;
  cardCommit(el);
}
function cardStep(raw){
  const parts = String(raw).split('|');
  const el = findEl(parts[0]); if(!el || el.type !== 'card') return;
  const c = cardOf(el), d = Number(parts[2]) || 0;
  cardSet(el.id + '|size|' + Math.min(120, Math.max(8, Number(c.size) + d)));
}
function cardPreset(raw){
  const parts = String(raw).split('|');
  const el = findEl(parts[0]); if(!el || el.type !== 'card') return;
  const p = CARD_PRESETS.find(x => x[0] === parts[1]); if(!p) return;
  pushUndo();
  const full = cardOf(el).full;
  el.card = Object.assign(cardOf(el), p[2], { full });
  if(Math.abs(el.card.lh - 1.35) < 0.001) delete el.card.lh;
  if(!el.card.color) delete el.card.color;
  cardCommit(el);
}
function cardReset(id){
  const el = findEl(id); if(!el || el.type !== 'card') return;
  pushUndo();
  el.card = Object.assign(cardDefaults(), { full: cardOf(el).full });
  cardCommit(el);
}
/* ---- Mise en page libre (v48) ---- */
function layoutPanelHtml(el){
  const l = layoutOf(el), id = el.id;
  const num = v => (v === null || !isFinite(v)) ? null : Number(v);
  const lv = num(l.left), rv = num(l.right);
  const svg = p => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const al = (val, ic, n) => `<button type="button" class="crd-seg-b${(l.align || '') === val ? ' on' : ''}" data-act="layoutSet" data-id="${id}|align|${val || 'default'}" title="${n}" aria-label="${n}">${ic}</button>`;
  const fmt = v => v.toLocaleString(getLang() === 'en' ? 'en' : 'fr', { minimumFractionDigits:1, maximumFractionDigits:1 }) + ' cm';
  const ind = (side, v, label) => `<div class="lay-ind">
      <div class="crd-line"><span class="crd-lbl">${label}</span>
        <span class="lay-ind-v"><b id="lay${side}Val">${v === null ? L('Par défaut','Default') : fmt(v)}</b>${v === null ? '' : `<button type="button" class="lay-x" data-act="layoutSet" data-id="${id}|${side === 'Left' ? 'left' : 'right'}|default" title="${L('Revenir au retrait par défaut','Back to the default indent')}" aria-label="${L('Par défaut','Default')}">${icon('close')}</button>`}</span></div>
      <input type="range" class="crd-range" id="lay${side}Range" min="0" max="12" step="0.1" value="${v === null ? 0 : v}" aria-label="${label}">
    </div>`;
  const LP = { center:{ align:'center', left:3.5, right:3.5 }, right:{ align:'right', left:6, right:0 }, indent:{ align:null, left:2, right:null } };
  const isPre = name => name === 'full' ? (!l.align && lv === null && rv === null) : !!LP[name] && (l.align || null) === LP[name].align && lv === LP[name].left && rv === LP[name].right;
  const pre = (name, label, blk) => `<button type="button" class="crd-tile lay-pre${isPre(name) ? ' on' : ''}" data-act="layoutPreset" data-id="${id}|${name}" title="${label}"><span class="lay-mini"><span class="lay-mini-b" style="${blk}"><i></i><i></i><i></i></span></span><span>${label}</span></button>`;
  const txt = String(el.text || '').replace(/\s+/g, ' ').trim();
  return `<div class="pane-title">${L('Aligner la ligne','Align the line')}</div>
  <div class="crd lay" data-layout-id="${id}">
    <div class="lay-target"><span class="lay-type">${esc(typeLabelDisplay(el.type))}</span><span class="lay-snip">${txt ? esc(txt.length > 46 ? txt.slice(0, 44) + '…' : txt) : `<em>${L('ligne vide','empty line')}</em>`}</span></div>
    <p class="crd-hint lay-hint">${L('Clique une autre ligne : le panneau la suit.','Click another line: the panel follows it.')}</p>
    <div class="lay-diag" id="layDiag" aria-hidden="true">
      <span class="lay-diag-col"><span class="lay-diag-b" id="layDiagB"><i></i><i></i><i></i></span></span>
      <span class="lay-diag-l" id="layDiagL"></span><span class="lay-diag-r" id="layDiagR"></span>
    </div>
    <section class="crd-sec">
      <div class="crd-h">${L('Alignement','Alignment')}</div>
      <span class="crd-seg fill">
        ${al('', svg('<path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v2.3h2.3"/>') + `<span class="lay-seg-t">${L('Défaut','Default')}</span>`, L('Alignement par défaut du type de ligne','Default alignment for the line type'))}
        ${al('left', svg('<path d="M2.5 4h11M2.5 7h7M2.5 10h11M2.5 13h7"/>'), L('À gauche','Left'))}
        ${al('center', svg('<path d="M2.5 4h11M4.5 7h7M2.5 10h11M4.5 13h7"/>'), L('Centré','Centered'))}
        ${al('right', svg('<path d="M2.5 4h11M6.5 7h7M2.5 10h11M6.5 13h7"/>'), L('À droite','Right'))}
      </span>
    </section>
    <section class="crd-sec">
      <div class="crd-h">${L('Retraits','Indents')}<small>${L('depuis les bords de la colonne','from the column edges')}</small></div>
      ${ind('Left', lv, L('Retrait gauche','Left indent'))}
      ${ind('Right', rv, L('Retrait droit','Right indent'))}
    </section>
    <section class="crd-sec">
      <div class="crd-h">${L('Raccourcis','Presets')}</div>
      <div class="crd-tiles four">
        ${pre('center', L('Centré étroit','Narrow centred'), 'left:25%;right:25%;align-items:center;')}
        ${pre('right', L('Bloc à droite','Right block'), 'left:50%;right:0;align-items:flex-end;')}
        ${pre('indent', L('Retrait 2 cm','2 cm indent'), 'left:16%;right:0;')}
        ${pre('full', L('Pleine largeur','Full width'), 'left:0;right:0;')}
      </div>
    </section>
    <p class="crd-hint">${L('0 cm = comme une ligne d’action. Les retraits suivent l’export PDF et l’impression.','0 cm = like an action line. Indents carry through to PDF export and printing.')}</p>
    <div class="crd-foot">
      <button type="button" class="crd-btn" data-act="layoutReset" data-id="${id}" title="${L('Rétablir la mise en page de cette ligne','Reset this line')}">${icon('undo')}<span>${L('Rétablir','Reset')}</span></button>
      <button type="button" class="crd-btn" data-act="layoutClose">${icon('close')}<span>${L('Fermer','Close')}</span></button>
    </div>
  </div>`;
}
/* Schéma de la colonne de texte : la ligne y est dessinée telle qu'elle est vraiment posée (lue sur la page). */
function layoutDiagSync(el){
  const B = document.getElementById('layDiagB'); if(!B) return;
  const div = document.querySelector('#page [data-id="' + el.id + '"]'), page = document.getElementById('page');
  if(!div || !page) return;
  const cs = getComputedStyle(page), pr = page.getBoundingClientRect(), z = pr.width / (page.offsetWidth || 1) || 1;
  const colL = pr.left + (parseFloat(cs.paddingLeft) || 0) * z, colR = pr.right - (parseFloat(cs.paddingRight) || 0) * z, colW = colR - colL;
  if(colW <= 0) return;
  const r = div.getBoundingClientRect();
  const a = Math.max(0, Math.min(100, (r.left - colL) / colW * 100)), b = Math.max(0, Math.min(100, (colR - r.right) / colW * 100));
  B.style.left = a + '%'; B.style.right = b + '%';
  const ta = getComputedStyle(div).textAlign;
  B.style.alignItems = ta === 'center' ? 'center' : (ta === 'right' || ta === 'end') ? 'flex-end' : 'flex-start';
  const cmPerPx = (S.project && S.project.format === 'us' ? 21.59 : 21) / ((page.offsetWidth || 1) * z);
  const fmt = v => (Math.round(v * 10) / 10).toLocaleString(getLang() === 'en' ? 'en' : 'fr', { minimumFractionDigits:1, maximumFractionDigits:1 }) + ' cm';
  const Lb = document.getElementById('layDiagL'), Rb = document.getElementById('layDiagR');
  // Retrait réglé : on affiche la valeur choisie ; sinon, celle que l'on mesure sur la page.
  const l = layoutOf(el), set = v => v !== null && v !== undefined && isFinite(v);
  if(Lb) Lb.textContent = fmt(set(l.left) ? Number(l.left) : Math.max(0, r.left - colL) * cmPerPx);
  if(Rb) Rb.textContent = fmt(set(l.right) ? Number(l.right) : Math.max(0, colR - r.right) * cmPerPx);
}
function showLayoutPanel(el){
  const side = document.getElementById('sidePane'); if(!side) return;
  side.dataset.mode = 'layout';
  side.classList.remove('hidden');
  const top = side.scrollTop;
  side.innerHTML = layoutPanelHtml(el);
  side.scrollTop = top;
  bindLayoutPanel(el);
}
function layoutTarget(){
  const line = focusedLine();
  const id = (line && line.dataset.id) || lastFocusedLineId;
  const el = id ? findEl(id) : null;
  return (el && el.type !== 'card' && el.type !== 'note') ? el : null;
}
function openLayout(){
  if(!S.project) return;
  const side = document.getElementById('sidePane');
  if(side && side.dataset.mode === 'layout'){ layoutClose(); return; }     // 2e clic = fermer
  const el = layoutTarget();
  if(!el){ toast(L('Clique d\u2019abord dans une ligne du scénario (hors carton et note).','Click inside a screenplay line first (not a card or note).')); return; }
  showLayoutPanel(el);
}
function layoutClose(){
  const side = document.getElementById('sidePane'); if(!side) return;
  side.dataset.mode = ''; side.classList.add('hidden'); side.innerHTML = '';
  if(S.navOpen) renderNavPane();
}
function layoutApply(el){
  const l = layoutOf(el);
  if(!l.align && (l.left === null || !isFinite(l.left)) && (l.right === null || !isFinite(l.right))) delete el.layout;
  else el.layout = { align:l.align || null, left:(l.left === null || !isFinite(l.left)) ? null : Number(l.left), right:(l.right === null || !isFinite(l.right)) ? null : Number(l.right) };
  const div = document.querySelector('#page [data-id="' + el.id + '"]');
  if(div) applyCardStyle(div, el);
}
function layoutSet(raw){
  const parts = String(raw).split('|');
  const el = findEl(parts[0]); if(!el || el.type === 'card' || el.type === 'note') return;
  const prop = parts[1], val = parts[2];
  pushUndo();
  const l = layoutOf(el);
  if(prop === 'align') l.align = (val === 'left' || val === 'center' || val === 'right') ? val : null;
  else if(prop === 'left' || prop === 'right') l[prop] = (val === 'default') ? null : Math.max(0, Math.min(12, Number(val) || 0));
  el.layout = l; layoutApply(el);
  repaginateNow(); scheduleAutosave(); showLayoutPanel(el);
}
function layoutPreset(raw){
  const parts = String(raw).split('|');
  const el = findEl(parts[0]); if(!el || el.type === 'card' || el.type === 'note') return;
  pushUndo();
  const P = { center:{ align:'center', left:3.5, right:3.5 }, right:{ align:'right', left:6, right:0 }, indent:{ align:null, left:2, right:null }, full:{ align:null, left:null, right:null } };
  el.layout = Object.assign({ align:null, left:null, right:null }, P[parts[1]] || P.full);
  layoutApply(el);
  repaginateNow(); scheduleAutosave(); showLayoutPanel(el);
}
function layoutReset(id){
  const el = findEl(id); if(!el) return;
  pushUndo(); delete el.layout; layoutApply(el);
  repaginateNow(); scheduleAutosave(); showLayoutPanel(el);
}
function bindLayoutPanel(el){
  const bind = (rid, vid, prop) => {
    const r = document.getElementById(rid); if(!r) return;
    let undone = false;
    r.addEventListener('input', ()=>{
      if(!undone){ pushUndo(); undone = true; }
      const l = layoutOf(el); l[prop] = Number(r.value); el.layout = l;
      const v = document.getElementById(vid); if(v) v.textContent = Number(r.value).toLocaleString(getLang() === 'en' ? 'en' : 'fr', { minimumFractionDigits:1, maximumFractionDigits:1 }) + ' cm';
      layoutApply(el); schedulePaginate(); scheduleAutosave();
      layoutDiagSync(el);
    });
    r.addEventListener('change', ()=>{ undone = false; showLayoutPanel(el); });
  };
  bind('layLeftRange', 'layLeftVal', 'left');
  bind('layRightRange', 'layRightVal', 'right');
  layoutDiagSync(el);
}
function insertCard(){
  if(!S.project) return;
  const line = focusedLine();
  const id = (line && line.dataset.id) || lastFocusedLineId;
  const els = S.project.elements;
  const idx = id ? findIdx(id) : -1;
  pushUndo();
  if(idx >= 0 && !(els[idx].text || '').trim() && els[idx].type !== 'scene'){
    // Ligne vide : on la transforme simplement en carton.
    const el = els[idx];
    el.type = 'card'; if(!el.card) el.card = cardDefaults();
    rebuildEditorAt(el.id, 0);
    const d = document.querySelector('#page [data-id="' + el.id + '"]');
    showContextPanel(el); if(d) focusDiv(d, 0);
    scheduleAutosave(); return;
  }
  const newEl = newElement('card', ''); newEl.card = cardDefaults();
  let at = idx < 0 ? els.length : idx + 1;
  if(idx >= 0){ const d = document.querySelector('#page [data-id="' + id + '"]');
    if(inDualWrap(d)){ const pair = dualPairRange(idx); if(pair) at = pair.end; } }
  els.splice(at, 0, newEl);
  rebuildEditorAt(newEl.id, 0);
  const nd = document.querySelector('#page [data-id="' + newEl.id + '"]');
  showContextPanel(newEl); if(nd) focusDiv(nd, 0);
  scheduleAutosave();
}

function insertScene(){
  pushUndo();
  const focused = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.line') : null;
  if(focused){
    const el = findEl(focused.dataset.id);
    if(el && !el.text.trim()){
      // current line is empty: just turn it into a scene heading, nothing new to insert
      el.type = 'scene'; refreshLineDiv(focused, el); renumberScenes(); showContextPanel(el);
      repaginateNow(); focusDiv(focused, 0); scheduleAutosave(); return;
    }
    if(el){
      const idx = findIdx(el.id);
      const newEl = newElement('scene', '');
      S.project.elements.splice(idx+1, 0, newEl);
      const newDiv = buildLineDiv(newEl, sceneNumbers());
      focused.after(newDiv);
      renumberScenes(); repaginateNow(); focusDiv(newDiv, 0); showContextPanel(newEl);
      scheduleAutosave();
      return;
    }
  }
  // nothing focused: just append at the end
  const newEl = newElement('scene', '');
  S.project.elements.push(newEl);
  const page = document.getElementById('page');
  if(page){
    const newDiv = buildLineDiv(newEl, sceneNumbers());
    page.appendChild(newDiv);
    renumberScenes(); repaginateNow(); focusDiv(newDiv, 0); showContextPanel(newEl);
  }
  scheduleAutosave();
}
function onLineFocus(e){
  // Changement de ligne : le menu ouvert sur la précédente n'a plus lieu d'être.
  if(S.extMenu){
    const d = e.target.closest && e.target.closest('.line');
    if(!d || d.dataset.id !== S.extMenu.id) closeExtMenu();
  }
  const div = e.target.closest('.line'); if(!div) return;
  const el = findEl(div.dataset.id); if(!el) return;
  hideAutocomplete();
  // On vient de quitter une autre ligne : si c'était une ligne Personnage,
  // elle a été ignorée par refreshContdMarks() tant qu'elle avait le focus
  // (voir le correctif juste au-dessus de cette fonction) — on rattrape sa
  // mention maintenant qu'elle ne l'a plus.
  if(lastFocusedLineId && lastFocusedLineId !== div.dataset.id) refreshContdMarks();
  lastFocusedLineId = div.dataset.id;
  if(S.focusMode){
    const prev = document.querySelector('#page .line.line-active');
    if(prev && prev!==div) prev.classList.remove('line-active');
    div.classList.add('line-active');
  }
  // La ligne vient d'obtenir le focus (frappe, flèches, clic) : on la garde
  // sous les yeux. Appelé après repaginateNow() partout où l'un et l'autre
  // se combinent, la position lue ici est donc déjà la position finale —
  // un seul déplacement de la vue, jamais deux qui se contredisent.
  if(!S.pagination._quickFocus){ ensureLineVisible(div); updatePageIndicator(); }   // focus rapide : la pagination de l'image s'en charge
  showContextPanel(el);
}
/* Fait défiler #centerPane, sans effet de bord ni animation (le déplacement
   doit être instantané pour suivre la frappe sans donner d'à-coup), pour
   que la ligne reste confortablement dans la zone visible. */
function ensureLineVisible(div){
  ensureRectVisible(div ? div.getBoundingClientRect() : null);
}
/* Version précise : suit la position RÉELLE du curseur, pas seulement le
   bloc qui le contient. Un bloc peut retourner à la ligne plusieurs fois
   (une réplique qui s'allonge, une action longue) sans jamais changer de
   focus — dans ce cas ensureLineVisible seule ne voit rien bouger, alors
   que le curseur, lui, continue de descendre à l'intérieur du bloc. C'est
   ce qui laissait le curseur sortir de l'écran en pleine frappe. */
/* Premier rectangle réellement exploitable d'une liste (Chrome en renvoie
   régulièrement de dégénérés, 0×0 en (0,0), qu'il ne faut surtout pas
   prendre pour la position du curseur : on croirait le curseur en haut à
   gauche de l'écran et la vue sauterait). */
function usableRect(rects){
  for(let i = 0; i < rects.length; i++){
    const r = rects[i];
    if(r.height > 0 || r.width > 0) return r;
  }
  return null;
}
function caretRect(){
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(true);
  let r = usableRect(range.getClientRects());
  if(r) return r;

  // CORRECTIF. Un point de collapse en tout début de ligne ne renvoie aucun
  // rect utilisable dans Chrome — autrement dit après CHAQUE appui sur
  // Entrée, le cas le plus fréquent qui soit. L'ancien code ne détectait
  // alors rien et ne faisait rien suivre. On élargit le range d'un seul
  // caractère, en arrière puis en avant : cela donne toujours un rectangle
  // sur la bonne ligne, sans jamais toucher au DOM ni à la sélection de
  // l'utilisateur (c'est ce dernier point qui cassait les sélections
  // multi-lignes dans l'approche « insertion d'un repère »).
  const node = range.startContainer, off = range.startOffset;
  if(node.nodeType === 3){
    if(off > 0){
      const p = range.cloneRange(); p.setStart(node, off - 1); p.setEnd(node, off);
      r = usableRect(p.getClientRects()); if(r) return r;
    }
    if(off < node.textContent.length){
      const n = range.cloneRange(); n.setStart(node, off); n.setEnd(node, off + 1);
      r = usableRect(n.getClientRects()); if(r) return r;
    }
  }
  // Ligne entièrement vide : le bloc lui-même fait office de repère.
  const host = node.nodeType === 1 ? node : node.parentNode;
  const line = host && host.closest ? host.closest('.line') : null;
  if(!line) return null;
  const lr = line.getBoundingClientRect();
  return (lr.width || lr.height) ? lr : null;
}
function ensureRectVisible(r){
  const pane = document.getElementById('centerPane');
  if(!pane || !r || (!r.width && !r.height && !r.top && !r.bottom)) return;
  const paneRect = pane.getBoundingClientRect();
  if(S.typewriterMode){
    // Le curseur reste toujours au centre vertical de la fenêtre : on
    // défile toujours d'exactement l'écart entre son centre et celui de
    // la zone visible, jamais seulement quand il sort d'une marge.
    pane.scrollTop += (r.top + r.bottom)/2 - (paneRect.top + paneRect.height/2);
    return;
  }
  const margin = 96;
  if(r.top < paneRect.top + margin){
    pane.scrollTop -= (paneRect.top + margin) - r.top;
  } else if(r.bottom > paneRect.bottom - margin){
    pane.scrollTop += r.bottom - (paneRect.bottom - margin);
  }
}
function ensureCaretVisible(){
  ensureRectVisible(caretRect());
}
/* v84 : cliquer sur une note n'ouvre plus de panneau à droite (il ne servait qu'à supprimer la note et prenait toute la place).
   À la place, une petite corbeille apparaît dans l'en-tête de la carte de la note, tant qu'on la modifie (comme les bulles de commentaire de WriterDuet). */
let noteBarEl = null, noteBarFor = null;
function hideNoteBar(){ if(noteBarEl) noteBarEl.style.display = 'none'; noteBarFor = null; }
function placeNoteBar(){
  if(!noteBarEl || !noteBarFor) return;
  const d = document.querySelector('#page [data-id="' + noteBarFor + '"]');
  if(!d || document.activeElement !== d){ hideNoteBar(); return; }
  const r = d.getBoundingClientRect();
  noteBarEl.style.display = 'inline-flex';
  noteBarEl.style.top = Math.round(r.top + 5) + 'px';
  noteBarEl.style.left = Math.round(r.right - noteBarEl.offsetWidth - 8) + 'px';
}
function showNoteBar(el){
  if(!noteBarEl){
    noteBarEl = document.createElement('button');
    noteBarEl.type = 'button'; noteBarEl.className = 'note-bar'; noteBarEl.setAttribute('data-act', 'deleteElement');
    noteBarEl.addEventListener('mousedown', e=> e.preventDefault());
    noteBarEl.addEventListener('click', ()=> setTimeout(hideNoteBar, 0));
    document.body.appendChild(noteBarEl);
    document.addEventListener('focusout', e=>{ if(e.target && e.target.closest && e.target.closest('.line--note')) hideNoteBar(); });
    document.addEventListener('scroll', ()=> requestAnimationFrame(placeNoteBar), true);
    window.addEventListener('resize', ()=> requestAnimationFrame(placeNoteBar));
  }
  noteBarEl.setAttribute('data-id', el.id);
  noteBarEl.title = L('Supprimer cette note','Delete this note');
  noteBarEl.innerHTML = icon('trash') + '<span>' + L('Supprimer','Delete') + '</span>';
  noteBarFor = el.id;
  placeNoteBar();
}
function showContextPanel(el){
  const side = document.getElementById('sidePane');
  if(el.type === 'note'){ showNoteBar(el); if(side && side.dataset.mode === 'layout') return; } else hideNoteBar();
  if(side && side.dataset.mode === 'layout' && el.type !== 'card' && el.type !== 'note'){ side.innerHTML = layoutPanelHtml(el); bindLayoutPanel(el); return; }   // v48 : le panneau « Aligner » suit la ligne active
  // Note: scene headings used to pop this panel open on focus (outline,
  // tags, duplicate/delete). It sat right next to — and on narrow windows
  // on top of — the text being typed, making the heading itself hard to
  // edit. Outline & tags editing and duplicate/delete are all still
  // available, just from the dedicated "Outline" and "Cartes" tabs, so
  // writing a scene heading is no longer interrupted by anything.
  if(el.type==='card'){
    side.dataset.mode = 'card';
    side.classList.remove('hidden');
    side.innerHTML = (el.fpg ? fpPanelHtml(el) : '') + cardPanelHtml(el);
    bindCardPanel(el);
  } else if(el.fpg && !fpPanelOff){
    side.dataset.mode = 'freepage';
    side.classList.remove('hidden');
    side.innerHTML = fpPanelHtml(el);
  } else if(S.navOpen){
    // On sort d'une note : le navigateur reprend sa place. S'il est déjà
    // affiché, on se contente de déplacer le surlignage (reconstruire la
    // liste à chaque changement de ligne serait du gaspillage pur).
    if(navVisible()) navSyncActive();
    else { side.dataset.mode = ''; renderNavPane(); }
  } else {
    side.dataset.mode = ''; side.classList.add('hidden'); side.innerHTML='';
  }
}
function deleteElement(id){
  const idx = findIdx(id); if(idx<0) return;
  pushUndo(); S.project.elements.splice(idx,1); scheduleAutosave(); renderEditorTab();
}
function editOutline(id, e){ sceneMeta(id).outline = e.target.value; scheduleAutosave(); }
function editSceneTags(id, e){
  const tags = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
  sceneMeta(id).tags = tags; scheduleAutosave();
}


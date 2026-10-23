/* =====================================================================
   v51 — PAGE DE TITRE : barre d'outils + édition directe sur la page
   Une seule barre d'outils (police, taille, gras / italique / souligné, alignement, couleur) agit sur ce qu'on a
   sélectionné sur la page : un texte précis, ou « toute la page » en cliquant dans le blanc. Le texte du titre,
   de l'auteur et des phrases se tape directement sur la page.
===================================================================== */
const TP_FONT_CATS = [
  {id:'all', fr:'Toutes', en:'All'}, {id:'mono', fr:'Machine à écrire', en:'Typewriter'},
  {id:'sans', fr:'Sans empattement', en:'Sans serif'}, {id:'serif', fr:'Avec empattement', en:'Serif'},
  {id:'display', fr:'Affiche', en:'Display'}, {id:'hand', fr:'Manuscrit', en:'Handwriting'}
];
const TP_FONT_CAT_OF = {mono:'mono', special:'mono', display:'sans', sans:'sans', serif:'serif', garamond:'serif', cinzel:'display', bebas:'display', hand:'hand'};
(function(){
  const GENERIC = {mono:'monospace', sans:'sans-serif', serif:'serif', display:'sans-serif', hand:'cursive'};
  const MORE = [
  ['mono','Cutive Mono',0],
  ['mono','Anonymous Pro',1],
  ['mono','IBM Plex Mono',1],
  ['mono','Space Mono',1],
  ['mono','JetBrains Mono',1],
  ['mono','Roboto Mono',1],
  ['mono','Source Code Pro',1],
  ['mono','DM Mono',0],
  ['mono','Overpass Mono',1],
  ['mono','Xanh Mono',0],
  ['mono','Syne Mono',0],
  ['mono','VT323',0],
  ['mono','Share Tech Mono',0],
  ['sans','Roboto',1],
  ['sans','Open Sans',1],
  ['sans','Lato',1],
  ['sans','Montserrat',1],
  ['sans','Poppins',1],
  ['sans','Raleway',1],
  ['sans','Nunito',1],
  ['sans','Work Sans',1],
  ['sans','DM Sans',1],
  ['sans','Manrope',1],
  ['sans','Outfit',1],
  ['sans','Urbanist',1],
  ['sans','Jost',1],
  ['sans','Josefin Sans',1],
  ['sans','Quicksand',1],
  ['sans','Barlow',1],
  ['sans','Karla',1],
  ['sans','Rubik',1],
  ['sans','Lexend',1],
  ['sans','Figtree',1],
  ['sans','Plus Jakarta Sans',1],
  ['sans','Sora',1],
  ['sans','Mulish',1],
  ['sans','Cabin',1],
  ['sans','Questrial',0],
  ['sans','Libre Franklin',1],
  ['sans','Albert Sans',1],
  ['sans','Red Hat Display',1],
  ['sans','Syne',1],
  ['sans','Arimo',1],
  ['sans','Archivo',1],
  ['serif','Libre Baskerville',1],
  ['serif','Lora',1],
  ['serif','Merriweather',1],
  ['serif','EB Garamond',1],
  ['serif','Crimson Text',1],
  ['serif','Cormorant',1],
  ['serif','Spectral',1],
  ['serif','Libre Caslon Text',1],
  ['serif','Bodoni Moda',1],
  ['serif','DM Serif Display',0],
  ['serif','DM Serif Text',0],
  ['serif','Cardo',1],
  ['serif','Gelasio',1],
  ['serif','Tinos',1],
  ['serif','Source Serif 4',1],
  ['serif','PT Serif',1],
  ['serif','Noto Serif',1],
  ['serif','Old Standard TT',1],
  ['serif','Vollkorn',1],
  ['serif','Prata',0],
  ['serif','Gloock',0],
  ['serif','Young Serif',0],
  ['serif','Marcellus',0],
  ['serif','Cinzel Decorative',1],
  ['serif','Forum',0],
  ['serif','Playfair Display SC',1],
  ['serif','Cormorant SC',1],
  ['display','Anton',0],
  ['display','Oswald',1],
  ['display','League Gothic',0],
  ['display','Archivo Black',0],
  ['display','Alfa Slab One',0],
  ['display','Bungee',0],
  ['display','Righteous',0],
  ['display','Limelight',0],
  ['display','Monoton',0],
  ['display','Fjalla One',0],
  ['display','Staatliches',0],
  ['display','Big Shoulders Display',1],
  ['display','Teko',1],
  ['display','Abril Fatface',0],
  ['display','Black Ops One',0],
  ['display','Rubik Mono One',0],
  ['display','Unbounded',1],
  ['display','Bowlby One',0],
  ['display','Fugaz One',0],
  ['display','Pirata One',0],
  ['display','UnifrakturCook',1],
  ['display','Creepster',0],
  ['display','Orbitron',1],
  ['display','Audiowide',0],
  ['display','Press Start 2P',0],
  ['display','Michroma',0],
  ['display','Russo One',0],
  ['display','Rye',0],
  ['hand','Dancing Script',1],
  ['hand','Pacifico',0],
  ['hand','Great Vibes',0],
  ['hand','Satisfy',0],
  ['hand','Sacramento',0],
  ['hand','Allura',0],
  ['hand','Alex Brush',0],
  ['hand','Parisienne',0],
  ['hand','Kaushan Script',0],
  ['hand','Shadows Into Light',0],
  ['hand','Indie Flower',0],
  ['hand','Permanent Marker',0],
  ['hand','Homemade Apple',0],
  ['hand','Reenie Beanie',0],
  ['hand','Rock Salt',0],
  ['hand','Covered By Your Grace',0],
  ['hand','Nanum Pen Script',0],
  ['hand','Gloria Hallelujah',0],
  ['hand','Amatic SC',1],
  ['hand','Courgette',0],
  ['hand','Marck Script',0],
  ['hand','Yellowtail',0],
  ['hand','Cookie',0],
  ['hand','Italianno',0],
  ['hand','Tangerine',1],
  ['hand','Pinyon Script',0],
  ['hand','Mr Dafoe',0],
  ['hand','Rancho',0]
  ];
  MORE.forEach(r=>{
    const id = 'g_' + r[1].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    TP_FONT_CAT_OF[id] = r[0];
    TP_FONTS.push({id, label:r[1], family:"'"+r[1]+"',"+GENERIC[r[0]], bold:!!r[2], cat:r[0], more:true});
  });
})();
const TP_RASTER_FONTS = new Set(TP_FONTS.filter(f=>f.more).map(f=>f.label));
function tpFontBold(id){ const f = TP_FONTS.find(x=>x.id===id); return !f || f.bold!==false; }
function tpFontRealName(f){ return f.family.split(',')[0].replace(/['"]/g,'').trim(); }
const TP_ELEMENTS = [
  {key:'title',  fr:'Titre',               en:'Title',         size:'titleSize'},
  {key:'sub',    fr:'Sous-titre',          en:'Subtitle',      size:'subSize'},
  {key:'by',     fr:'« Écrit par »',       en:'\u201cWritten by\u201d', size:'bySize', fallback:'authorSize'},
  {key:'author', fr:'Nom de l\u2019auteur', en:'Author name',   size:'authorSize'},
  {key:'extra',  fr:'Phrases en plus',     en:'Extra lines',   size:'extraSize', fallback:'subSize'},
  {key:'foot',   fr:'Bas de page',         en:'Footer',        size:'footSize'}
];
const TP_COLORS = ['#23262E','#5C6270','#3699D4','#1F6FA0','#2F9E44','#D64545','#B8860B','#7B4B94','#8B5E3C','#EEF1F5','#DCEEFB','#ffffff'];
let tpSel = 'page', tpFmOpen = false, tpColorOpen = false, tpFmCatSel = 'all';
function tpEl(k){ return TP_ELEMENTS.find(e=>e.key===k) || tpFtxEl(k); }
/* Textes libres (design.texts = [{id, text}]) : autant qu'on veut, chacun indépendant des autres.
   Leur clé (« tx… ») passe partout où passent les textes fixes : police, taille, couleur, alignement,
   gras / italique / souligné et position se rangent dans le design sous le même nom (d[k+'Font'], d.pos[k]…). */
function tpFtxList(d){ return d && Array.isArray(d.texts) ? d.texts : []; }
function tpIsFtx(k){ return typeof k==='string' && /^tx[a-z0-9]+$/.test(k); }
function tpFtxEl(k){
  if(!tpIsFtx(k) || !S.project || !S.project.titlePageDesign) return undefined;
  const d = S.project.titlePageDesign, i = tpFtxList(d).findIndex(t=>t.id===k);
  if(i<0) return undefined;
  let nm = String(tpFtxList(d)[i].text||'').split('\n').map(x=>x.trim()).filter(Boolean)[0] || '';
  if(nm.length > 18) nm = nm.slice(0, 17).trim() + '…';
  return {key:k, fr:nm || 'Texte '+(i+1), en:nm || 'Text '+(i+1), size:k+'Size', fallback:'subSize', free:true};
}
function tpFtxLinesHtml(text){
  const lines = String(text||'').split('\n');
  return lines.length===1 && !lines[0] ? '' : lines.map(l=>`<div class="tp-ftx-l">${l ? esc(l) : '<br>'}</div>`).join('');
}
function tpFtxHtml(d){
  const list = tpFtxList(d); if(!list.length) return '';
  const v = (k,p,f)=>`var(--tp-${k}-${p},${f})`;
  return `<div class="tp-ftx-layer">` + list.map(t=>{ const k = t.id;
    return `<div class="tp-ftx" data-ftx="${k}" style="text-align:${v(k,'ta','var(--tp-text-align,center)')}"><div class="tp-ftx-in" style="font-family:${v(k,'font','inherit')}; font-size:${v(k,'size','var(--tp-sub-size,12pt)')}; font-weight:${v(k,'weight','inherit')}; font-style:${v(k,'style','inherit')}; text-decoration:${v(k,'deco','none')}; color:${v(k,'color','inherit')};">${tpFtxLinesHtml(t.text)}</div></div>`;
  }).join('') + `</div>`;
}
function tpSizeOf(d,k){ const e = tpEl(k); return +(d[e.size] || (e.fallback ? d[e.fallback] : 0)) || 12; }
function tpEffFont(d,k){ return k==='page' ? d.font : (d[k+'Font'] || d.font); }
function tpEffColor(d,k){ return k==='page' ? d.color : (d[k+'Color'] || d.color); }
function tpEffAlign(d,k){ return k==='page' ? (d.align||'center') : (d[k+'Align'] || d.align || 'center'); }
function tpIsFmt(d,k,f){
  const v = d.fmt && d.fmt[k] && d.fmt[k][f];
  if(v!==undefined) return !!v;
  return f==='b' && k==='title' ? tpFontBold(tpEffFont(d,k)) : false;
}
function tpApplyElementStyles(el, d){
  const set = (v,val)=>{ if(val===''||val==null) el.style.removeProperty(v); else el.style.setProperty(v,val); };
  TP_ELEMENTS.concat(tpFtxList(d).map(t=>({key:t.id, free:true}))).forEach(e=>{
    const k = e.key, f = (d.fmt && d.fmt[k]) || {}, al = d[k+'Align'] || '';
    if(e.free) set('--tp-'+k+'-size', d[k+'Size'] ? d[k+'Size']+'pt' : '');
    set('--tp-'+k+'-font', d[k+'Font'] ? tpFontFamily(d[k+'Font']) : '');
    set('--tp-'+k+'-color', d[k+'Color'] || '');
    set('--tp-'+k+'-ta', al);
    if(k!=='by' && k!=='author' && !e.free) set('--tp-'+k+'-self', al==='left'?'flex-start':al==='right'?'flex-end':al==='center'?'center':'');
    if(k==='title') set('--tp-title-weight', tpIsFmt(d,'title','b') ? '700' : '400');
    else set('--tp-'+k+'-weight', f.b===undefined ? '' : (f.b ? '700' : '400'));
    set('--tp-'+k+'-style', f.i===undefined ? '' : (f.i ? 'italic' : 'normal'));
    set('--tp-'+k+'-deco', f.u===undefined ? '' : (f.u ? 'underline' : 'none'));
  });
  set('--tp-author-box', (d.byAlign || d.authorAlign) ? 'stretch' : '');
  set('--tp-by-size', d.bySize ? d.bySize+'pt' : '');
  set('--tp-extra-size', d.extraSize ? d.extraSize+'pt' : '');
}
/* ---------- v52 : mémoire des polices (favoris, récentes) ---------- */
const TP_FAV_KEY = 'scriptmm_tp_fav_fonts', TP_REC_KEY = 'scriptmm_tp_recent_fonts';
function tpLoadList(key){ try{ const a = JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(a) ? a.filter(x=>typeof x==='string') : []; }catch(err){ return []; } }
function tpSaveList(key, a){ try{ localStorage.setItem(key, JSON.stringify(a)); }catch(err){} }
let tpFavs = tpLoadList(TP_FAV_KEY), tpRecents = tpLoadList(TP_REC_KEY);
let tpFmSnap = null, tpFmPrev = false, tpPane = 'content';
function tpCloseMenus(){ tpFmOpen = false; tpColorOpen = false; tpFmSnap = null; }
/* ---------- menu de polices ---------- */
/* Les rubriques « Sur cette page » et « Récentes » sont figées à l'ouverture du menu : la liste ne bouge donc pas
   sous la souris quand on essaie plusieurs polices à la suite. */
function tpFmSnapshot(){
  const d = ensureTPDesign(S.project), ok = id => id && TP_FONTS.some(f=>f.id===id);
  const used = [];
  [d.font, ...TP_ELEMENTS.map(e=>d[e.key+'Font']), ...tpFtxList(d).map(t=>d[t.id+'Font'])].forEach(id=>{ if(ok(id) && !used.includes(id)) used.push(id); });
  return {used, recents: tpRecents.filter(id=>ok(id) && !used.includes(id)).slice(0,5)};
}
function tpFmPopHtml(k){
  const d = ensureTPDesign(S.project), page = k==='page';
  const cur = page ? d.font : (d[k+'Font'] || '');
  const snap = tpFmSnap || (tpFmSnap = tpFmSnapshot());
  const byId = id => TP_FONTS.find(f=>f.id===id);
  const cats = TP_FONT_CATS.filter(c=>c.id!=='all');
  const inCat = c => TP_FONTS.filter(f=>(TP_FONT_CAT_OF[f.id]||'sans')===c).sort((a,b)=>{
    if(!!a.more !== !!b.more) return a.more ? 1 : -1;
    return a.more ? a.label.localeCompare(b.label) : 0;
  });
  const head = (g,fr,en)=>`<div class="tp-fm-grp" data-grp="${g}">${L(fr,en)}</div>`;
  const item = (x,g)=>{
    const fav = tpFavs.includes(x.id);
    return `<div class="tp-fm-item ${cur===x.id?'active':''}" role="option" style="font-family:${x.family}" data-act="tpFmPick" data-id="${k}|${x.id}" data-grp="${g}" data-name="${esc((tpFontRealName(x)+' '+x.label).toLowerCase())}"><span class="tp-fm-nm">${esc(tpFontRealName(x))}</span>${x.more?'':`<small>${esc(x.label)}</small>`}<button type="button" class="tp-fm-star ${fav?'on':''}" data-act="tpFmFav" data-id="${x.id}" title="${fav?L('Retirer des favoris','Remove from favorites'):L('Ajouter aux favoris','Add to favorites')}" aria-label="${L('Favori','Favorite')}">${fav?'★':'☆'}</button></div>`;
  };
  const favs = tpFavs.map(byId).filter(Boolean);
  let items = '';
  if(favs.length) items += head('fav','★ Favoris','★ Favorites') + favs.map(x=>item(x,'fav')).join('');
  if(snap.used.length > 1) items += head('page','Sur cette page','On this page') + snap.used.map(id=>item(byId(id),'page')).join('');
  if(snap.recents.length) items += head('recent','Récentes','Recent') + snap.recents.map(id=>item(byId(id),'recent')).join('');
  cats.forEach(c=>{ items += head(c.id,c.fr,c.en) + inCat(c.id).map(x=>item(x,c.id)).join(''); });
  const chip = (id,label,n)=>`<span class="tp-fm-cat ${tpFmCatSel===id?'active':''}" data-act="tpFmSetCat" data-id="${id}">${label}<i>${n}</i></span>`;
  const chips = chip('all', L('Toutes','All'), TP_FONTS.length) + chip('fav', L('★ Favoris','★ Favorites'), favs.length)
    + cats.map(c=>chip(c.id, L(c.fr,c.en), TP_FONTS.filter(f=>(TP_FONT_CAT_OF[f.id]||'sans')===c.id).length)).join('');
  return `<div class="tp-fm-pop">
    <input type="search" class="tp-fm-search" placeholder="${L('Rechercher parmi '+TP_FONTS.length+' polices…','Search '+TP_FONTS.length+' fonts…')}" autocomplete="off" spellcheck="false">
    <div class="tp-fm-cats">${chips}</div>
    <div class="tp-fm-list" role="listbox">
      ${page?'':`<div class="tp-fm-item follow ${cur===''?'active':''}" data-act="tpFmPick" data-id="${k}|"><span class="tp-fm-nm">${L('Comme la page','Same as page')}</span></div>`}
      ${items}
      <div class="tp-fm-empty" style="display:none;"></div>
    </div>
    <div class="tp-fm-foot"><span>↑ ↓ ${L('naviguer','browse')}</span><span>↵ ${L('choisir','pick')}</span><span>${L('Échap fermer','Esc close')}</span></div></div>`;
}
function tpFmFilter(){
  const pop = document.querySelector('.tp-fm-pop'); if(!pop) return;
  const q = (pop.querySelector('.tp-fm-search').value||'').trim().toLowerCase();
  const TOP = ['fav','page','recent'];
  let any = false; const seen = {};
  pop.querySelectorAll('.tp-fm-item:not(.follow)').forEach(it=>{
    const g = it.dataset.grp, top = TOP.includes(g), match = !q || (it.dataset.name||'').includes(q);
    let ok;
    if(tpFmCatSel==='fav') ok = g==='fav' && match;
    else if(tpFmCatSel!=='all') ok = g===tpFmCatSel && match;
    else ok = q ? (!top && match) : true;
    it.style.display = ok ? '' : 'none';
    it.classList.remove('kb');
    if(ok){ any = true; seen[g] = 1; }
  });
  pop.querySelectorAll('.tp-fm-grp').forEach(g=>{ g.style.display = seen[g.dataset.grp] ? '' : 'none'; });
  const fol = pop.querySelector('.tp-fm-item.follow'); if(fol) fol.style.display = (!q && tpFmCatSel==='all') ? '' : 'none';
  const emp = pop.querySelector('.tp-fm-empty');
  if(emp){
    emp.textContent = (tpFmCatSel==='fav' && !tpFavs.length && !q) ? L('Aucun favori. Clique sur ☆ à côté d\u2019une police pour la garder sous la main.','No favorites yet. Click ☆ next to a font to keep it handy.') : L('Aucune police trouvée.','No font found.');
    emp.style.display = any ? 'none' : '';
  }
}
/* Aperçu en direct : survoler une police l'applique provisoirement au texte sélectionné sur la page. */
function tpFmRestore(){
  tpFmPrev = false;
  const tp = document.querySelector('#tpPreviewShell .titlepage');
  if(tp) applyTPDesignVars(tp, ensureTPDesign(S.project));
}
function tpFmPreview(it){
  const tp = document.querySelector('#tpPreviewShell .titlepage'); if(!tp || !it) return;
  const v = String(it.dataset.id||''), i = v.indexOf('|'); if(i<0) return;
  const key = v.slice(0,i), fid = v.slice(i+1);
  const prop = key==='page' ? '--tp-font' : '--tp-'+key+'-font';
  if(!fid){ if(key==='page') return; tp.style.removeProperty(prop); tpFmPrev = true; return; }
  tp.style.setProperty(prop, tpFontFamily(fid)); tpFmPrev = true;
}
function tpFmMove(dir){
  const list = document.querySelector('.tp-fm-pop .tp-fm-list'); if(!list) return;
  const items = [...list.querySelectorAll('.tp-fm-item')].filter(n=>n.style.display!=='none');
  if(!items.length) return;
  let i = items.findIndex(n=>n.classList.contains('kb'));
  items.forEach(n=>n.classList.remove('kb'));
  i = i<0 ? (dir>0 ? 0 : items.length-1) : Math.max(0, Math.min(items.length-1, i+dir));
  const n = items[i]; n.classList.add('kb');
  if(n.offsetTop < list.scrollTop + 30) list.scrollTop = Math.max(0, n.offsetTop - 30);
  else if(n.offsetTop + n.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = n.offsetTop + n.offsetHeight - list.clientHeight + 6;
  tpFmPreview(n);
}
/* ---------- barre d'outils ---------- */
const TP_ALIGN_ICON = {
  left:'<path d="M2 3.5h12M2 6.5h8M2 9.5h12M2 12.5h8"/>', center:'<path d="M2 3.5h12M4 6.5h8M2 9.5h12M4 12.5h8"/>', right:'<path d="M2 3.5h12M6 6.5h8M2 9.5h12M6 12.5h8"/>'
};
function tpPillsHtml(){
  const items = [{key:'page', fr:'Toute la page', en:'Whole page'}, ...TP_ELEMENTS, ...tpFtxList(ensureTPDesign(S.project)).map(t=>tpFtxEl(t.id))];
  return `<span class="tp-pills-lbl">${L('Modifier','Edit')}</span>` + items.map(e=>`<button type="button" class="tp-pill ${tpSel===e.key?'on':''}" data-act="tpPill" data-id="${e.key}">${L(e.fr,e.en)}</button>`).join('')
    + `<button type="button" class="tp-pill tp-pill-add" data-act="tpFtxAdd" title="${L('Ajouter un texte libre, à placer où tu veux','Add a free text, to place anywhere')}">+ ${L('Texte','Text')}</button>`;
}
function tpToolbarHtml(){
  const d = ensureTPDesign(S.project), k = tpSel, page = k==='page', none = k==='none';
  const f = TP_FONTS.find(x=>x.id===tpEffFont(d,k)) || TP_FONTS[0];
  const col = tpEffColor(d,k), al = tpEffAlign(d,k);
  const dis = (page||none) ? ' disabled' : '', off = none ? ' disabled' : '';
  const hint = none ? L('Clique sur la page ou sur un texte pour le modifier','Click the page or a text to edit it') : L('Choisis d\u2019abord un texte (ci-dessous ou sur la page)','Pick a text first (below or on the page)');
  const fmt = (c,label,style,tip)=>`<button type="button" class="tp-tb-btn tp-tb-fmt ${!page && !none && tpIsFmt(d,k,c)?'on':''}" data-act="tpTbFmt" data-id="${c}" title="${(page||none)?hint:tip}" style="${style}"${dis}>${label}</button>`;
  const sizeGroup = `
    <span class="tp-tb-sep"></span>
    <span class="tp-tb-size"><button type="button" class="tp-tb-btn" data-act="tpTbSizeStep" data-id="-1" title="${(page||none)?hint:L('Plus petit','Smaller')}"${dis}>−</button><input id="tpTbSize" type="text" inputmode="numeric" value="${(page||none)?'':tpSizeOf(d,k)}" placeholder="—" aria-label="${L('Taille en points','Size in points')}" title="${(page||none)?hint:L('Taille en points','Size in points')}"${dis}><button type="button" class="tp-tb-btn" data-act="tpTbSizeStep" data-id="1" title="${(page||none)?hint:L('Plus grand','Larger')}"${dis}>+</button></span>
    <span class="tp-tb-sep"></span>
    ${fmt('b','B','font-weight:800;',L('Gras (Ctrl/⌘ B)','Bold (Ctrl/⌘ B)'))}${fmt('i','I','font-style:italic;font-family:Georgia,serif;',L('Italique (Ctrl/⌘ I)','Italic (Ctrl/⌘ I)'))}${fmt('u','U','text-decoration:underline;',L('Souligné (Ctrl/⌘ U)','Underline (Ctrl/⌘ U)'))}`;
  const alignBtns = ['left','center','right'].map(a=>`<button type="button" class="tp-tb-btn ${!none&&al===a?'on':''}" data-act="tpTbAlign" data-id="${a}"${off} title="${L({left:'Aligner à gauche',center:'Centrer',right:'Aligner à droite'}[a],{left:'Align left',center:'Center',right:'Align right'}[a])}"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">${TP_ALIGN_ICON[a]}</svg></button>`).join('');
  const swatches = TP_COLORS.map(c=>`<button type="button" class="tp-swatch ${col.toLowerCase()===c.toLowerCase()?'active':''}" style="background:${c}" data-act="tpTbColor" data-id="${c}" title="${c}"></button>`).join('');
  const colPop = tpColorOpen ? `<div class="tp-tb-pop"><div class="tp-tb-swatches">${swatches}</div>
      <div class="tp-tb-pop-row"><span>${L('Autre couleur','Custom color')}</span><input type="color" id="tpTbColorPick" value="${/^#[0-9a-f]{6}$/i.test(col)?col:'#23262e'}"></div>
      ${page?'':`<div class="tp-tb-pop-row"><span>${L('Comme la page','Same as page')}</span><button type="button" class="tp-tb-auto" data-act="tpTbColor" data-id="">${L('Automatique','Automatic')}</button></div>`}</div>` : '';
  return `<span class="tp-fm-wrap"><button type="button" class="tp-tb-btn tp-tb-font ${tpFmOpen?'open':''}" data-act="tpTbFont" title="${none?hint:L('Police','Font')}"${off}><span class="tp-fm-name" style="font-family:${f.family}">${esc(tpFontRealName(f))}</span><span class="tp-fm-caret">▾</span></button>${tpFmOpen?tpFmPopHtml(k):''}</span>
    ${sizeGroup}
    <span class="tp-tb-sep"></span>${alignBtns}
    <span class="tp-tb-sep"></span>
    <span class="tp-col-wrap"><button type="button" class="tp-tb-btn" data-act="tpTbColorToggle" title="${none?hint:L('Couleur du texte','Text color')}"${off}><span class="tp-tb-dot" style="background:${col}"></span><span class="tp-fm-caret">▾</span></button>${colPop}</span>
    <span class="tp-tb-sep"></span><button type="button" class="tp-tb-btn txt" data-act="tpTbReset" title="${(page||none)?hint:L('Remettre ce texte comme la page','Reset this text to the page style')}"${dis}>${L('Réinitialiser','Reset')}</button>${tpIsFtx(k) ? `<button type="button" class="tp-tb-btn tp-tb-del" data-act="tpFtxDel" data-id="${k}" title="${L('Supprimer ce texte','Delete this text')}"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9.5h6.6L12 4M6.8 6.5v4.5M9.2 6.5v4.5"/></svg></button>` : ''}`;
}
function tpRenderToolbar(){
  const t = document.getElementById('tpToolbar'); if(!t) return;
  if(S.tpDrawMode){ tpdRenderBars(); return; }   // v90 : en mode dessin, la barre porte les outils de dessin
  // Le menu de polices garde sa recherche, son défilement et sa sélection clavier d'un rendu à l'autre : il reste ouvert quand on choisit une police.
  const old = t.querySelector('.tp-fm-pop'); let keep = null;
  if(old){
    const s = old.querySelector('.tp-fm-search'), l = old.querySelector('.tp-fm-list'), kb = old.querySelector('.tp-fm-item.kb');
    let anchor = null;
    [...l.querySelectorAll('.tp-fm-item')].some(n=>{
      if(n.style.display==='none') return false;
      if(n.offsetTop + n.offsetHeight > l.scrollTop){ anchor = {g:n.dataset.grp, id:n.dataset.id, off:n.offsetTop - l.scrollTop}; return true; }
      return false;
    });
    keep = {q:s.value, top:l.scrollTop, anchor, focus:document.activeElement===s, a:s.selectionStart, b:s.selectionEnd, kb: kb ? [kb.dataset.grp, kb.dataset.id] : null};
  }
  t.innerHTML = tpToolbarHtml();
  const pills = document.getElementById('tpPills'); if(pills) pills.innerHTML = tpPillsHtml();
  const pop = t.querySelector('.tp-fm-pop');
  if(pop){
    // le menu s'ouvre SOUS la rangée « Modifier » : on peut changer d'élément sans le fermer
    const wrap = pop.parentNode, pl = document.getElementById('tpPills');
    if(wrap && pl){
      const gap = Math.max(8, Math.round(pl.getBoundingClientRect().bottom - wrap.getBoundingClientRect().top) + 8);
      pop.style.top = gap + 'px';
      // …et au-dessus de la colonne de droite, pour ne jamais cacher la page : l'aperçu en direct reste visible
      const col = document.getElementById('tpControlsCol');
      if(col){
        const cl = col.getBoundingClientRect().left, wl = wrap.getBoundingClientRect().left;
        if(cl > wl && cl + 360 <= window.innerWidth - 12) pop.style.left = Math.round(cl - wl) + 'px';
      }
      pop.style.maxHeight = Math.max(260, Math.min(480, window.innerHeight - pl.getBoundingClientRect().bottom - 24)) + 'px';
    }
    const s = pop.querySelector('.tp-fm-search'), list = pop.querySelector('.tp-fm-list');
    if(keep){
      s.value = keep.q; tpFmFilter();
      const same = (g,id)=>[...list.querySelectorAll('.tp-fm-item')].find(x=>x.dataset.grp===g && x.dataset.id===id);
      const an = keep.anchor && same(keep.anchor.g, keep.anchor.id);
      list.scrollTop = an ? Math.max(0, an.offsetTop - keep.anchor.off) : keep.top;
      if(keep.kb){ const n = same(keep.kb[0], keep.kb[1]); if(n && n.style.display!=='none') n.classList.add('kb'); }
      if(keep.focus){ try{ s.focus({preventScroll:true}); s.setSelectionRange(keep.a, keep.b); }catch(err){} }
    }else{
      tpFmFilter();
      const act = [...list.querySelectorAll('.tp-fm-item.active:not(.follow)')].find(n=>!['fav','page','recent'].includes(n.dataset.grp));
      if(act) list.scrollTop = Math.max(0, act.offsetTop - 90);
      try{ s.focus({preventScroll:true}); }catch(err){}
    }
  }else if(tpFmPrev){ tpFmRestore(); }
}
/* Réapplique le style sur l'aperçu (sans le reconstruire : un texte en cours de frappe ou un dessin ne sont jamais perdus). */
function tpStyleChanged(){
  scheduleAutosave();
  const tp = document.querySelector('#tpPreviewShell .titlepage');
  if(tp) applyTPDesignVars(tp, ensureTPDesign(S.project));
  tpRenderToolbar(); tpFitPreview();
}
function tpMarkSelection(){
  const shell = document.getElementById('tpPreviewShell'); if(!shell) return;
  shell.classList.toggle('tp-page-sel', tpSel==='page');
  shell.querySelectorAll('[data-tpk]').forEach(n=> n.classList.toggle('tp-sel', n.dataset.tpk===tpSel));
  tpUpdateMoveHandle();
}
function tpSelect(k){
  if(k!=='page' && k!=='none' && !tpEl(k)) k = 'page';
  const changed = (k!==tpSel) || tpColorOpen;
  const act = document.activeElement, sh = document.getElementById('tpPreviewShell');
  if(act && sh && act!==document.body && sh.contains(act)){ const ak = act.closest('[data-tpk]'); if(!ak || ak.dataset.tpk!==k) act.blur(); }   // le curseur suit toujours la sélection
  tpSel = k; tpColorOpen = false;   // le menu de polices reste ouvert : il suit la sélection
  tpMarkSelection();
  if(changed) tpRenderToolbar();
}
function tpPill(id){ tpSelect(id); }
function tpTbFont(){
  if(tpSel==='none') return;
  if(tpFmOpen){ tpCloseMenus(); }
  else{ tpFmOpen = true; tpColorOpen = false; tpFmCatSel = 'all'; tpFmSnap = null; }
  tpRenderToolbar();
}
function tpTbColorToggle(){ if(tpSel==='none') return; const o = !tpColorOpen; tpCloseMenus(); tpColorOpen = o; tpRenderToolbar(); }
function tpFmSetCat(id){
  tpFmCatSel = id;
  document.querySelectorAll('.tp-fm-cat').forEach(c=> c.classList.toggle('active', c.dataset.id===id));
  tpFmFilter();
  const l = document.querySelector('.tp-fm-pop .tp-fm-list'); if(l) l.scrollTop = 0;
}
function tpFmPick(id){
  const i = String(id).indexOf('|'); const key = id.slice(0,i), fid = id.slice(i+1);
  const d = ensureTPDesign(S.project);
  if(key==='page'){ if(fid) d.font = fid; } else if(tpEl(key)) d[key+'Font'] = fid; else return;
  if(fid){ tpRecents = [fid, ...tpRecents.filter(x=>x!==fid)].slice(0,8); tpSaveList(TP_REC_KEY, tpRecents); }
  tpStyleChanged();   // v52 : le menu reste ouvert, on peut essayer plusieurs polices à la suite
}
function tpFmFav(id){
  if(!TP_FONTS.some(f=>f.id===id)) return;
  tpFavs = tpFavs.includes(id) ? tpFavs.filter(x=>x!==id) : [id, ...tpFavs];
  tpSaveList(TP_FAV_KEY, tpFavs);
  tpRenderToolbar();
}
function tpPanelTab(id){
  if(S.tpDrawMode && id!=='draw') tpFinishDraw();
  tpPane = id; tpRebuildControls();
}
/* Ajuste la page d'aperçu à la hauteur de l'écran : on voit toute la page sans défiler. */
function tpFitPreview(){
  const shell = document.getElementById('tpPreviewShell'); if(!shell) return;
  const tp = shell.querySelector('.titlepage'); if(!tp) return;
  const pw = tp.offsetWidth, ph = tp.offsetHeight; if(!pw || !ph) return;
  const wide = window.innerWidth > 820;
  // la section occupe exactement la hauteur visible : rien ne défile, la barre et les boutons « Modifier » restent en place
  const root = document.getElementById('tpRoot'), pane = document.getElementById('centerPane');
  if(root && pane) root.style.height = wide ? pane.clientHeight+'px' : '';
  const dw = shell.closest('.tp-design-wrap'), cap = document.querySelector('.tp-preview-caption'), mat = shell.parentNode;
  let availH;
  if(wide && dw){
    const cs = getComputedStyle(dw);
    const inner = dw.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    availH = inner - (mat.offsetHeight - shell.offsetHeight) - (cap ? cap.offsetHeight : 0) - 14;
  }else availH = window.innerHeight * 0.75;
  availH = Math.max(260, availH);
  const availW = Math.max(220, Math.min(window.innerWidth - 90, 640));
  const s = Math.max(0.25, Math.min(availH/ph, availW/pw, 0.9));
  shell.style.width = Math.round(pw*s)+'px'; shell.style.height = Math.round(ph*s)+'px';
  tp.style.transform = 'scale('+s.toFixed(4)+')';
  tp.style.setProperty('--tp-hs', (1/s).toFixed(4));
  if(cap) cap.style.width = (shell.parentNode.offsetWidth)+'px';
  // Le panneau de réglages (Contenu / Fond / Dessin) finit exactement au bord du bas du cadre de l'aperçu.
  const ctl = document.getElementById('tpControlsCol');
  if(ctl) ctl.style.height = (wide && mat) ? mat.offsetHeight+'px' : '';
  tpUpdateMoveHandle();
  if(typeof tpdMaybeResize === 'function') tpdMaybeResize();   // v90 : le dessin garde la bonne résolution
}
function tpTbColor(id){
  if(tpSel==='none') return;
  const d = ensureTPDesign(S.project);
  if(tpSel==='page') d.color = id || d.color; else d[tpSel+'Color'] = id || '';
  tpColorOpen = false; tpStyleChanged();
}
function tpSetSize(v){
  if(tpSel==='page' || tpSel==='none') return;
  const n = Math.max(6, Math.min(120, Math.round(+v)));
  if(!isFinite(n)) { tpRenderToolbar(); return; }
  ensureTPDesign(S.project)[tpEl(tpSel).size] = n;
  tpStyleChanged();
}
function tpTbSizeStep(id){ if(tpSel==='page' || tpSel==='none') return; tpSetSize(tpSizeOf(ensureTPDesign(S.project), tpSel) + (parseInt(id,10)||0)); }
function tpTbFmt(id){
  if(tpSel==='page' || tpSel==='none') return;
  const d = ensureTPDesign(S.project); if(!d.fmt) d.fmt = {}; if(!d.fmt[tpSel]) d.fmt[tpSel] = {};
  d.fmt[tpSel][id] = !tpIsFmt(d, tpSel, id);
  tpStyleChanged();
}
function tpTbAlign(id){
  if(tpSel==='none') return;
  const d = ensureTPDesign(S.project);
  if(tpSel==='page'){ d.align = id; TP_ELEMENTS.forEach(e=>{ d[e.key+'Align'] = ''; }); }   // l'alignement de la page s'applique à tout
  else d[tpSel+'Align'] = id;
  tpStyleChanged();
}
function tpTbReset(){
  if(tpSel==='page' || tpSel==='none') return;
  const d = ensureTPDesign(S.project), e = tpEl(tpSel), def = defaultTPDesign();
  d[tpSel+'Font'] = ''; d[tpSel+'Color'] = ''; d[tpSel+'Align'] = '';
  if(d.fmt) delete d.fmt[tpSel];
  if(d.pos && !e.free) delete d.pos[tpSel];   // un texte libre garde sa place
  d[e.size] = def[e.size];
  tpStyleChanged();
}
/* ---------- édition directe sur la page ---------- */
function tpSyncField(id, val){ const n = document.getElementById(id); if(n && document.activeElement!==n) n.value = val; }
function tpDecoratePreview(shell, tp){
  if(!shell || !tp) return;
  if(S.tpDrawMode){ tp.classList.remove('tp-editing'); return; }
  const p = S.project;
  tp.classList.add('tp-editing');
  const mark = (sel,k,edit,ph)=>{
    const n = tp.querySelector(sel); if(!n) return;
    n.dataset.tpk = k;
    if(edit){ n.setAttribute('contenteditable','true'); n.setAttribute('spellcheck','false'); }
    if(ph) n.dataset.ph = ph;
  };
  const box = tp.querySelector('.tp-author');
  if(box){
    if(!box.querySelector('.tp-author-name')) box.innerHTML = `<div class="tp-author-label">${L('Écrit par','Written by')}</div><div class="tp-author-name"></div>`;
    box.classList.toggle('tp-ph-grp', !String(p.author||'').trim());
  }
  mark('.tp-title','title',!ensureTPDesign(p).titleHidden);
  mark('.tp-sub','sub');
  mark('.tp-author-label','by');
  mark('.tp-author-name','author',true,L('Nom de l\u2019auteur','Author name'));
  mark('.tp-extra-wrap','extra',true,L('Phrases en plus…','Extra lines…'));
  mark('.tp-foot','foot');
  tp.querySelectorAll('.tp-ftx').forEach(w=>{ const n = w.querySelector('.tp-ftx-in'); if(!n) return;
    n.dataset.tpk = w.dataset.ftx; n.setAttribute('contenteditable','true'); n.setAttribute('spellcheck','false'); n.dataset.ph = L('Ton texte…','Your text…'); });
  tpBindPreview(shell);
  tpApplyPositions(tp);
  tpMoveBind(shell);
  tpMarkSelection();
  tpFreeImgDecorate(shell, tp);
}
function tpDragSelKey(shell){
  const sel = window.getSelection ? window.getSelection() : null;
  if(!sel || sel.isCollapsed || !sel.anchorNode || !shell || !shell.contains(sel.anchorNode)) return null;
  const el = sel.anchorNode.nodeType===1 ? sel.anchorNode : sel.anchorNode.parentElement;
  const n = el && el.closest ? el.closest('[data-tpk]') : null;
  return n ? n.dataset.tpk : null;
}
function tpBindPreview(shell){
  if(shell._tpBound) return; shell._tpBound = true;
  const keyOf = t => { const n = t && t.closest ? t.closest('[data-tpk]') : null; return n ? n.dataset.tpk : null; };
  // un bloc de texte occupe toute la largeur de la page : on ne le sélectionne que si le clic tombe vraiment sur son texte
  const hitKey = e=>{
    const n = e.target && e.target.closest ? e.target.closest('[data-tpk]') : null; if(!n) return null;
    let rects = [];
    try{ const r = document.createRange(); r.selectNodeContents(n); rects = [...r.getClientRects()].filter(q=>q.width>0 && q.height>0); }catch(err){}
    if(!rects.length) rects = [n.getBoundingClientRect()];
    const tol = 8;
    return rects.some(q=> e.clientX>=q.left-tol && e.clientX<=q.right+tol && e.clientY>=q.top-tol && e.clientY<=q.bottom+tol) ? n.dataset.tpk : null;
  };
  shell.addEventListener('mousedown', e=>{
    if(S.tpDrawMode || e.button!==0) return;
    if(hitKey(e)) return;
    const n = e.target.closest ? e.target.closest('[data-tpk]') : null;
    if(n){ e.preventDefault(); const a = document.activeElement; if(a && a!==document.body && shell.contains(a) && a.blur) a.blur(); }   // clic à côté du texte : pas de curseur dans le bloc
  });
  shell.addEventListener('click', e=>{
    if(S.tpDrawMode) return;
    const ds = tpDragSelKey(shell); if(ds){ tpSelect(ds); return; }   // fin d'un glisser-sélectionner : on garde le bloc et son texte sélectionné
    const k = hitKey(e) || 'page';
    const a = document.activeElement;
    if(a && a!==document.body && shell.contains(a) && keyOf(a)!==k && a.blur) a.blur();   // le curseur ne reste pas dans l'ancien bloc
    tpSelect(k);
  });
  shell.addEventListener('focusin', e=>{ const k = keyOf(e.target); if(k) tpSelect(k); });
  shell.addEventListener('keydown', e=>{
    const k = keyOf(e.target); if(!k) return;
    if(e.key==='Enter' && (k==='title' || k==='author')){ e.preventDefault(); e.target.blur(); return; }
    if((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && 'biu'.includes(e.key.toLowerCase()) && e.key.length===1){
      e.preventDefault(); tpSel = k; tpTbFmt(e.key.toLowerCase());
    }
  });
  shell.addEventListener('paste', e=>{
    const k = keyOf(e.target); if(!k || !e.target.isContentEditable) return;
    e.preventDefault();
    let t = (e.clipboardData || window.clipboardData).getData('text') || '';
    if(k!=='extra' && !tpIsFtx(k)) t = t.replace(/\s*\n\s*/g,' ');
    document.execCommand('insertText', false, t);
  });
  shell.addEventListener('input', e=>{
    const k = keyOf(e.target); const p = S.project; if(!k) return;
    if(k==='title'){
      p.title = e.target.textContent; tpSyncField('tpProjectTitle', p.title);
      const rail = document.querySelector('.rail-project'); if(rail) rail.textContent = p.title;
      scheduleAutosave();
    }else if(k==='author'){
      p.author = e.target.textContent; tpSyncField('tpAuthorText', p.author);
      const box = e.target.closest('.tp-author'); if(box) box.classList.toggle('tp-ph-grp', !p.author.trim());
      scheduleAutosave();
    }else if(k==='extra'){
      p.titlePageExtra = String(e.target.innerText||'').split('\n').map(s=>s.replace(/\s+$/,'')).join('\n').replace(/\n{3,}/g,'\n\n').replace(/^\n+|\n+$/g,'');
      tpSyncField('tpExtraText', p.titlePageExtra); scheduleAutosave();
    }else if(tpIsFtx(k)){
      const t = tpFtxList(ensureTPDesign(p)).find(x=>x.id===k); if(!t) return;
      t.text = String(e.target.innerText||'').replace(/\r/g,'').split('\n').map(s=>s.replace(/\s+$/,'')).join('\n').replace(/\n+$/,'');
      scheduleAutosave(); tpUpdateMoveHandle();
    }
  });
  shell.addEventListener('focusout', e=>{
    const k = keyOf(e.target); const p = S.project; if(!k) return;
    if(k==='title' && !String(p.title||'').trim()){
      p.title = L('Sans titre','Untitled'); e.target.textContent = p.title; tpSyncField('tpProjectTitle', p.title);
      const rail = document.querySelector('.rail-project'); if(rail) rail.textContent = p.title;
      scheduleAutosave();
    }
    if(k==='author'){ p.author = String(p.author||'').trim(); if(p.author) setDefaultAuthor(p.author); }
    if(k==='extra') e.target.innerHTML = tpExtraLinesHtml(p.titlePageExtra);
    if(tpIsFtx(k)){ const t = tpFtxList(ensureTPDesign(p)).find(x=>x.id===k); if(t){ e.target.innerHTML = tpFtxLinesHtml(t.text); tpRenderToolbar(); } }   // le nom de la pastille suit le texte
  });
}
document.addEventListener('mousedown', e=>{
  const t = e.target; if(!t || !t.closest) return;
  if(t.closest('.tp-tb button, .tp-tb .tp-fm-item, .tp-tb .tp-fm-cat, .tp-tb .tp-swatch, .tp-pills button')) e.preventDefault();   // la barre d'outils ne vole jamais le curseur du texte
});
document.addEventListener('input', e=>{
  const t = e.target; if(!t || !t.classList) return;
  if(t.classList.contains('tp-fm-search')) tpFmFilter();
  if(t.closest && t.closest('#tpPreviewShell')) tpFitPreview();
  if(t.id==='tpTbColorPick'){
    const d = ensureTPDesign(S.project);
    if(tpSel==='page') d.color = t.value; else d[tpSel+'Color'] = t.value;
    scheduleAutosave();
    const tp = document.querySelector('#tpPreviewShell .titlepage'); if(tp) applyTPDesignVars(tp, d);
    const dot = document.querySelector('.tp-tb .tp-tb-dot'); if(dot) dot.style.background = t.value;
  }
});
document.addEventListener('change', e=>{ if(e.target && e.target.id==='tpTbSize') tpSetSize(e.target.value); });
document.addEventListener('keydown', e=>{
  const t = e.target;
  if(t && t.id==='tpTbSize' && e.key==='Enter'){ e.preventDefault(); tpSetSize(t.value); return; }
  if(t && t.classList && t.classList.contains('tp-fm-search')){
    if(e.key==='ArrowDown'){ e.preventDefault(); tpFmMove(1); return; }
    if(e.key==='ArrowUp'){ e.preventDefault(); tpFmMove(-1); return; }
    if(e.key==='Enter'){
      e.preventDefault();
      let n = document.querySelector('.tp-fm-pop .tp-fm-item.kb');
      if(!n && t.value.trim()) n = [...document.querySelectorAll('.tp-fm-pop .tp-fm-item')].find(x=>x.style.display!=='none');
      if(n) tpFmPick(n.dataset.id);
      return;
    }
    if(e.key==='Escape' && t.value){ e.preventDefault(); t.value = ''; tpFmFilter(); return; }
  }
  if(e.key==='Escape' && (tpFmOpen || tpColorOpen)){ tpCloseMenus(); tpRenderToolbar(); }
  else if(e.key==='Escape' && S && S.tab==='titlepage' && !tpFsEl && !S.tpDrawMode && document.getElementById('tpRoot')){
    const sh = document.getElementById('tpPreviewShell');
    if(t && sh && sh.contains(t) && t.isContentEditable){ t.blur(); }   // 1er Échap : on quitte la saisie, le bloc reste sélectionné
    else if(!(t && t.matches && t.matches('input, textarea, select')) && tpSel!=='none') tpSelect('none');   // 2e Échap : on désélectionne
  }
});
document.addEventListener('click', e=>{
  if(!(tpFmOpen || tpColorOpen)) return;
  if(e.target.closest && e.target.closest('.tp-fm-wrap,.tp-col-wrap,#tpPreviewShell,#tpPills')) return;
  tpCloseMenus(); tpRenderToolbar();
});
document.addEventListener('mouseover', e=>{
  const it = e.target.closest && e.target.closest('.tp-fm-pop .tp-fm-item'); if(it) tpFmPreview(it);
});
document.addEventListener('mouseout', e=>{
  if(!tpFmPrev) return;
  const from = e.target.closest && e.target.closest('.tp-fm-pop .tp-fm-list'); if(!from) return;
  const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('.tp-fm-list') : null;
  if(!to) tpFmRestore();
});
window.addEventListener('resize', ()=>{ if(S && S.tab==='titlepage') tpFitPreview(); });

/* ---------- v54 : zone morte = désélection, et page de titre seule en plein écran ---------- */
document.addEventListener('click', e=>{
  if(!S || S.tab!=='titlepage' || S.tpDrawMode) return;
  const t = e.target; if(!t || !t.closest || !t.closest('#tpRoot')) return;
  if(t.closest('.tp-tb, #tpPills button, #tpPreviewShell, button, input, select, textarea, a')) return;
  if(t.closest('.tp-controls-col') && !(t.classList.contains('tp-controls-col') || t.classList.contains('tp-panes'))) return;   // seul le fond de la colonne compte comme zone morte
  if(tpDragSelKey(document.getElementById('tpPreviewShell'))) return;   // on relâche un glisser-sélectionner hors de la page
  const a = document.activeElement; if(a && a.closest && a.closest('#tpPreviewShell') && a.blur) a.blur();
  tpSelect('none');
});
let tpFsEl = null;
/* v90 : plein écran avec zoom et déplacement (molette / pincement / boutons + −, Espace + glisser), et dessin possible dessus.
   z = zoom relatif à « page entière visible » (100 % = ajustée à l'écran) ; L et T = position de la page à l'écran. */
const TPFS = { z:1, L:0, T:0, fit:1, pw:0, ph:0, ptrs:new Map(), pan:null, pinch:null, moved:false };
function tpFsPageEl(){ return tpFsEl ? tpFsEl.querySelector('.titlepage') : null; }
function tpFsTopY(){ const b = tpFsEl && tpFsEl.querySelector('.tp-fs-tb'); return b ? Math.round(b.getBoundingClientRect().bottom) + 12 : 16; }
function tpFsApply(){
  if(!tpFsEl) return;
  const tp = tpFsPageEl(), box = tpFsEl.querySelector('.tp-fs-page'); if(!tp || !box || !TPFS.pw) return;
  const s = TPFS.fit * TPFS.z, w = Math.round(TPFS.pw * s), h = Math.round(TPFS.ph * s);
  const vw = tpFsEl.clientWidth, vh = tpFsEl.clientHeight, top = tpFsTopY();
  TPFS.L = Math.max(60 - w, Math.min(vw - 60, TPFS.L));        // la page ne sort jamais complètement de l'écran
  TPFS.T = Math.max(top + 40 - h, Math.min(vh - 60, TPFS.T));
  box.style.width = w + 'px'; box.style.height = h + 'px';
  box.style.left = Math.round(TPFS.L) + 'px'; box.style.top = Math.round(TPFS.T) + 'px';
  tp.style.transform = 'scale(' + s.toFixed(5) + ')';
  tp.style.setProperty('--tp-hs', (1 / s).toFixed(4));
  tpFsEl.querySelectorAll('.tp-d-zv').forEach(n=>{ n.textContent = Math.round(TPFS.z * 100) + '%'; });
  if(typeof tpdMaybeResize === 'function') tpdMaybeResize();
}
function tpFsFitReset(){
  if(!tpFsEl) return;
  const tp = tpFsPageEl(); if(!tp) return;
  TPFS.pw = tp.offsetWidth; TPFS.ph = tp.offsetHeight; if(!TPFS.pw || !TPFS.ph) return;
  const vw = tpFsEl.clientWidth, vh = tpFsEl.clientHeight, top = tpFsTopY();
  TPFS.fit = Math.max(.1, Math.min((vw - 40) / TPFS.pw, (vh - top - 20) / TPFS.ph, 2.5));
  TPFS.z = 1;
  TPFS.L = (vw - TPFS.pw * TPFS.fit) / 2;
  TPFS.T = top + (vh - top - 20 - TPFS.ph * TPFS.fit) / 2;
  tpFsApply();
}
function tpFsZoom(f, cx, cy){
  if(!tpFsEl) return;
  if(cx == null){ cx = tpFsEl.clientWidth / 2; cy = (tpFsTopY() + tpFsEl.clientHeight) / 2; }
  const z1 = Math.max(.5, Math.min(8, TPFS.z * f)), k = z1 / TPFS.z; if(k === 1) return;
  TPFS.L = cx - (cx - TPFS.L) * k; TPFS.T = cy - (cy - TPFS.T) * k; TPFS.z = z1;
  tpFsApply();
}
function tpFsBuildPageEl(){
  const tp = buildTitlePageEl(S.project, {live:S.tpDrawMode});
  tp.style.margin = '0'; tp.style.boxShadow = 'none'; tp.style.transformOrigin = 'top left';
  return tp;
}
/* Reconstruit la page du plein écran (entrée / sortie du mode dessin) en gardant le zoom et la position. */
function tpFsRebuildPage(){
  if(!tpFsEl) return;
  const box = tpFsEl.querySelector('.tp-fs-page'); if(!box) return;
  if(typeof tpdDetach === 'function') tpdDetach();
  box.innerHTML = '';
  const tp = tpFsBuildPageEl(); box.appendChild(tp);
  tpFsApply();
  if(S.tpDrawMode) tpdAttach(tp);
}
function tpFsWheel(e){
  if(!tpFsEl) return;
  if(e.target.closest && e.target.closest('.tp-fs-tb, .tp-tb-pop')) return;
  e.preventDefault();
  const mouse = e.deltaMode === 1 || (e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 50);
  if(e.ctrlKey || e.metaKey || mouse){
    tpFsZoom(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : e.deltaMode === 1 ? .05 : .0016)), e.clientX, e.clientY);   // molette ou pincement du pavé tactile
  }else{ TPFS.L -= e.deltaX; TPFS.T -= e.deltaY; tpFsApply(); }                                                     // deux doigts sur le pavé tactile : déplacer
}
function tpFsDown(e){
  if(!tpFsEl) return;
  if(e.target.closest && e.target.closest('.tp-fs-tb, .tp-fs-exit, .tp-tb-pop')) return;
  TPFS.ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if(TPFS.ptrs.size >= 2){        // deux doigts : pincer pour zoomer, glisser pour déplacer (le trait en cours est annulé)
    if(typeof tpdCancelStroke === 'function') tpdCancelStroke();
    TPFS.pan = null;
    const p = [...TPFS.ptrs.values()];
    TPFS.pinch = {d:Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, cx:(p[0].x + p[1].x) / 2, cy:(p[0].y + p[1].y) / 2};
    e.preventDefault(); e.stopPropagation(); return;
  }
  const onCanvas = e.target && e.target.id === 'tpDrawCanvas';
  const pan = e.button === 1 || !(S.tpDrawMode && onCanvas) || TPD.hand || TPD.space || (e.pointerType === 'touch' && TPD.seenPen);
  if(!pan) return;
  TPFS.pan = {id:e.pointerId, x:e.clientX, y:e.clientY, L:TPFS.L, T:TPFS.T}; TPFS.moved = false;
  e.preventDefault(); e.stopPropagation();
  try{ tpFsEl.setPointerCapture(e.pointerId); }catch(err){}
  tpFsEl.classList.add('tp-fs-panning');
}
function tpFsMove(e){
  const q = TPFS.ptrs.get(e.pointerId); if(q){ q.x = e.clientX; q.y = e.clientY; }
  if(TPFS.pinch && TPFS.ptrs.size >= 2){
    const p = [...TPFS.ptrs.values()], d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, cx = (p[0].x + p[1].x) / 2, cy = (p[0].y + p[1].y) / 2;
    TPFS.L += cx - TPFS.pinch.cx; TPFS.T += cy - TPFS.pinch.cy;
    tpFsZoom(d / TPFS.pinch.d, cx, cy);
    TPFS.pinch = {d, cx, cy}; e.preventDefault(); e.stopPropagation(); return;
  }
  if(TPFS.pan && e.pointerId === TPFS.pan.id){
    const dx = e.clientX - TPFS.pan.x, dy = e.clientY - TPFS.pan.y;
    if(Math.hypot(dx, dy) > 4) TPFS.moved = true;
    TPFS.L = TPFS.pan.L + dx; TPFS.T = TPFS.pan.T + dy; tpFsApply();
    e.preventDefault(); e.stopPropagation();
  }
}
function tpFsUp(e){
  TPFS.ptrs.delete(e.pointerId);
  if(TPFS.pinch && TPFS.ptrs.size < 2) TPFS.pinch = null;
  if(TPFS.pan && e.pointerId === TPFS.pan.id){
    TPFS.pan = null; if(tpFsEl) tpFsEl.classList.remove('tp-fs-panning');
    if(TPFS.moved){ TPFS.suppress = true; setTimeout(()=>{ TPFS.suppress = false; }, 60); }   // le clic qui suit un déplacement ne ferme pas le plein écran
  }
}
function tpFsResize(){
  if(!tpFsEl) return;
  if(TPFS.z === 1) tpFsFitReset(); else tpFsApply();
}
function tpFullscreen(){
  if(tpFsEl) return;
  tpCloseMenus();
  if(S.tpDrawMode && typeof tpdDetach === 'function'){ tpdCancelStroke(); tpdFlush(); tpdDetach(); }   // le canevas passe de l'aperçu au plein écran, sans rien perdre
  const ov = document.createElement('div'); ov.id = 'tpFs'; ov.className = 'tp-fs';
  ov.innerHTML = `<div class="tp-tb tp-fs-tb" id="tpFsToolbar"></div><button type="button" class="tp-fs-exit" data-tpd="fsexit">✕ ${L('Quitter le plein écran','Exit full screen')}</button><div class="tp-fs-page"></div>`;
  ov.querySelector('.tp-fs-page').appendChild(tpFsBuildPageEl());
  ov.addEventListener('click', e=>{
    if(e.target !== ov || S.tpDrawMode) return;
    if(TPFS.suppress){ TPFS.suppress = false; return; }
    tpFullscreenExit();
  });
  ov.addEventListener('pointerdown', tpFsDown, true);
  ov.addEventListener('pointermove', tpFsMove, true);
  ov.addEventListener('pointerup', tpFsUp, true);
  ov.addEventListener('pointercancel', tpFsUp, true);
  ov.addEventListener('wheel', tpFsWheel, {passive:false});
  TPFS.ptrs.clear(); TPFS.pan = TPFS.pinch = null; TPFS.z = 1;
  document.body.appendChild(ov); tpFsEl = ov;
  if(typeof tpdRenderBars === 'function') tpdRenderBars();
  tpFsFitReset();
  if(S.tpDrawMode) tpdAttach(tpFsPageEl());
  // En dessin, pas de plein écran du navigateur : la couche couvre déjà toute l'application, et on évite le bandeau noir « appuyez sur Échap ».
  if(!S.tpDrawMode){ try{ if(ov.requestFullscreen){ const r = ov.requestFullscreen(); if(r && r.catch) r.catch(()=>{}); } }catch(err){} }
}
function tpFullscreenExit(){
  const ov = tpFsEl; if(!ov) return; tpFsEl = null;
  TPD.space = false; TPD.hand = false; TPD.pop = null; TPD.clearArmed = false;
  if(typeof tpdDetach === 'function'){ tpdCancelStroke(); tpdFlush(); tpdDetach(); }
  if(S.tpDrawMode){ S.tpDrawMode = false; TPD.autoFs = false; try{ scheduleAutosave(); }catch(err){} }   // fin du dessin : les traits sont déjà dans le projet
  TPFS.ptrs.clear(); TPFS.pan = TPFS.pinch = null;
  if(ov.parentNode) ov.parentNode.removeChild(ov);
  try{ if(document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); }catch(err){}
  if(S && document.getElementById('tpPreviewShell')){ refreshTPPreview(); tpRenderToolbar(); if(typeof tpdRefreshPanel === 'function') tpdRefreshPanel(); }
  if(S && S.tab === 'titlepage' && typeof tpRebuildControls === 'function' && document.getElementById('tpControlsCol')) tpRebuildControls();
}
document.addEventListener('fullscreenchange', ()=>{ if(tpFsEl && !document.fullscreenElement) tpFullscreenExit(); else if(tpFsEl) setTimeout(tpFsResize, 60); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && tpFsEl){ e.preventDefault(); tpFullscreenExit(); } });
window.addEventListener('resize', tpFsResize);

/* Export PDF : les polices du PDF sont les polices standard (Courier / Helvetica / Times). Une police ajoutée en v51 ou un texte
   souligné, sur la page de titre, serait donc dégradé. Pour que le PDF soit identique à l'écran, ces blocs de texte
   (page de titre seulement) sont dessinés avec la vraie police sur un canevas haute résolution (288 dpi), puis posés dans le PDF.
   Les polices d'origine non soulignées et tout le corps du scénario gardent exactement le chemin d'avant. */
function tpIsRasterFam(fam){
  const first = String(fam||'').split(',')[0].replace(/['"]/g,'').trim();
  return TP_RASTER_FONTS.has(first);
}
async function tpPreloadFonts(p){
  try{
    if(!document.fonts || !document.fonts.load) return;
    const d = ensureTPDesign(p);
    const ids = new Set([d.font].concat(TP_ELEMENTS.map(e=>d[e.key+'Font'])).filter(Boolean));
    const jobs = [];
    ids.forEach(id=>{ const f = TP_FONTS.find(x=>x.id===id); if(!f) return;
      jobs.push(document.fonts.load('400 24px '+f.family, 'Aa')); jobs.push(document.fonts.load('700 24px '+f.family, 'Aa')); jobs.push(document.fonts.load('italic 400 24px '+f.family, 'Aa')); });
    await Promise.race([Promise.all(jobs), new Promise(r=>setTimeout(r,6000))]);
  }catch(e){}
}
function tpRasterBlock(doc, b){
  const K = 4;                                   // pixels par point
  const wPx = Math.max(1, Math.ceil(b.widthPt * K));
  const pad = Math.ceil(b.fontPt * K * 0.5);     // marge de sécurité : une lettre à empattement large ne doit jamais être rognée
  const font = (b.italic?'italic ':'') + (b.bold?'700':'400') + ' ' + (b.fontPt*K) + 'px ' + b.fam;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const wrapAt = limit => {
    const out = [];
    String(b.text).split('\n').forEach(para=>{
      let cur = '';
      para.split(' ').forEach(w=>{
        const t = cur ? cur+' '+w : w;
        if(!cur || probe.measureText(t).width <= limit) cur = t; else { out.push(cur); cur = w; }
      });
      out.push(cur);
    });
    return out;
  };
  // Même garde-fou que pour le texte normal : plus de lignes que le navigateur n'en a utilisé = écart d'arrondi, pas un vrai retour à la ligne.
  let lines = wrapAt(wPx + 2);
  for(let t = 1; b.maxLines && lines.length > b.maxLines && t <= 6; t++) lines = wrapAt(wPx * (1 + 0.03*t) + 2);
  const top = b.fontPt * 1.25;
  const cv = document.createElement('canvas');
  cv.width = wPx + 2*pad; cv.height = Math.ceil((top + (lines.length-1)*b.lineHeightPt + b.fontPt*0.6) * K);
  const ctx = cv.getContext('2d');
  ctx.font = font; ctx.textBaseline = 'alphabetic';
  ctx.textAlign = b.align==='center' ? 'center' : b.align==='right' ? 'right' : 'left';
  const a = (b.opacity===undefined?1:b.opacity) * (b.color.a===undefined?1:b.color.a);
  const rgba = 'rgba('+b.color.r+','+b.color.g+','+b.color.b+','+a+')';
  ctx.fillStyle = rgba; ctx.strokeStyle = rgba; ctx.lineWidth = Math.max(1, b.fontPt * K * 0.055);
  const x = pad + (b.align==='center' ? wPx/2 : b.align==='right' ? wPx : 0);
  lines.forEach((ln,i)=>{
    const y = (top + i*b.lineHeightPt) * K;
    ctx.fillText(ln, x, y);
    if(b.under){
      const w = ctx.measureText(ln).width;
      const x0 = b.align==='center' ? x - w/2 : b.align==='right' ? x - w : x;
      ctx.beginPath(); ctx.moveTo(x0, y + b.fontPt*K*0.13); ctx.lineTo(x0 + w, y + b.fontPt*K*0.13); ctx.stroke();
    }
  });
  doc.addImage(cv.toDataURL('image/png'), 'PNG', b.xPt - pad / K, b.yPt - top, cv.width / K, cv.height / K, undefined, 'FAST');
}
const TP_PATTERNS = [
  {id:'none', label:'Aucun'},
  {id:'dots', label:'Points'},
  {id:'lines', label:'Lignes'},
  {id:'grid', label:'Quadrillage'},
  {id:'diagonal', label:'Diagonales'},
  {id:'film', label:'Trame film'},
];
const TP_SWATCHES = ['#23262E','#3699D4','#1F6FA0','#2F2E44','#2F9E44','#DCEEFB','#EEF1F5','#ffffff'];

function hexToRgba(hex, alpha){
  const h = (hex||'#000000').replace('#','');
  const r = parseInt(h.substring(0,2),16)||0, g = parseInt(h.substring(2,4),16)||0, b = parseInt(h.substring(4,6),16)||0;
  return `rgba(${r},${g},${b},${alpha})`;
}
function tpFontFamily(id){ return (TP_FONTS.find(f=>f.id===id)||TP_FONTS[0]).family; }
function tpPatternCss(design){
  const c = hexToRgba(design.color||'#000000', .16);
  switch(design.pattern){
    case 'dots': return { image:`radial-gradient(${c} 1.4px, transparent 1.6px)`, size:'14px 14px' };
    case 'lines': return { image:`repeating-linear-gradient(0deg, ${c} 0, ${c} 1px, transparent 1px, transparent 11px)`, size:'auto' };
    case 'grid': return { image:`repeating-linear-gradient(0deg, ${c} 0, ${c} 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, ${c} 0, ${c} 1px, transparent 1px, transparent 22px)`, size:'auto' };
    case 'diagonal': return { image:`repeating-linear-gradient(45deg, ${c} 0, ${c} 1px, transparent 1px, transparent 12px)`, size:'auto' };
    case 'film': return { image:`repeating-linear-gradient(90deg, ${c} 0, ${c} 3px, transparent 3px, transparent 16px)`, size:'auto' };
    default: return { image:'none', size:'auto' };
  }
}
/* Applies every design variable as inline CSS custom properties on the
   .titlepage element. Used by both the live design-tab preview and the
   PDF/print export, so what you tweak is exactly what comes out. */
function applyTPDesignVars(el, design){
  const pat = tpPatternCss(design);
  el.style.setProperty('--tp-font', tpFontFamily(design.font));
  el.style.setProperty('--tp-align-items', design.align==='left' ? 'flex-start' : design.align==='right' ? 'flex-end' : 'center');
  el.style.setProperty('--tp-text-align', design.align==='left' ? 'left' : design.align==='right' ? 'right' : 'center');
  el.style.setProperty('--tp-color', design.color);
  el.style.setProperty('--tp-bg', '#ffffff');
  el.style.setProperty('--tp-title-size', design.titleSize+'pt');
  el.style.setProperty('--tp-sub-size', design.subSize+'pt');
  el.style.setProperty('--tp-author-size', design.authorSize+'pt');
  el.style.setProperty('--tp-foot-size', design.footSize+'pt');
  el.style.setProperty('--tp-pattern-image', pat.image);
  el.style.setProperty('--tp-pattern-size', pat.size);
  el.style.setProperty('--tp-img-opacity', design.bgImageOpacity);
  tpApplyElementStyles(el, design);   // v51 : style propre à chaque élément
  tpApplyPositions(el, design);       // position libre de chaque texte (voir 15-title-page.js)
}
function tpExtraLinesHtml(text){
  // Une ligne vide sépare deux blocs (comme sur une page de titre pro) : on la garde comme une
  // ligne vide à l'écran et à l'export. Plusieurs lignes vides de suite n'en font qu'une, et celles
  // du début / de la fin sont ignorées. <br> garde la hauteur d'une ligne et rend « \n » à l'édition.
  const lines = String(text||'').split('\n').map(l=>l.trim());
  while(lines.length && !lines[0]) lines.shift();
  while(lines.length && !lines[lines.length-1]) lines.pop();
  if(!lines.length) return '';
  return lines.filter((l,i)=> l || lines[i-1])
    .map(l=> l ? `<div class="tp-extra-line">${esc(l)}</div>` : `<div class="tp-extra-line tp-extra-gap"><br></div>`).join('');
}
/* Étiquette affichée sous le titre : pour un épisode de série, on préfère
   « Série — Nom · S1 E2 » à un simple « Série » qui ne dirait rien du
   tout sur la page de titre exportée. */
function kindLabel(p){
  if(p.seriesId){
    const nm = p.seriesName ? (' : ' + p.seriesName) : '';
    const snLabel = p.seasonName ? (L(' « ' + p.seasonName + ' »', ' \u201c' + p.seasonName + '\u201d')) : '';
    return L('Série','Series') + nm + ' · S' + (p.season||1) + snLabel + ' E' + (p.episode||1);
  }
  return kindOptionLabel(p.kind);
}
/* Comme sur une page de titre pro (Final Draft, Highland…) : « Écrit par »
   au-dessus du nom, sur deux lignes distinctes plutôt que côte à côte. */
function tpAuthorInnerHtml(author){
  return author ? `<div class="tp-author-label">${L('Écrit par','Written by')}</div><div class="tp-author-name">${esc(author)}</div>` : '';
}
function tpInnerHtml(p){
  return `<div class="tp-content">
      <div class="tp-title${ensureTPDesign(p).titleHidden?' tp-title-off':''}">${esc(p.title)}</div>
      ${p.kind?`<div class="tp-sub">${esc(kindLabel(p))}</div>`:''}
      <div class="tp-author">${tpAuthorInnerHtml(p.author)}</div>
      <div class="tp-extra-wrap">${tpExtraLinesHtml(p.titlePageExtra)}</div>
      <div class="tp-foot">${esc(p.contact||'')}${p.tpShowFoot&&p.contact&&p.version?' · ':''}${p.tpShowFoot&&p.version?('v'+esc(p.version)):''}${p.tpShowFoot&&p.date?(' · '+esc(p.date)):''}</div>
    </div>${tpFtxHtml(ensureTPDesign(p))}`;
}
/* Builds a full .titlepage element (background image layer + drawing
   layer + text content), applies the design variables, and returns it.
   Shared by the design-tab preview and the PDF export. */
function buildTitlePageEl(p, opts){
  const design = ensureTPDesign(p);
  try{ tpdSyncRaster(design); }catch(e){}   // v90 : l'image du dessin est toujours à jour avec les traits (aperçu, impression, PDF)
  const tp = document.createElement('div'); tp.className='titlepage';
  applyTPDesignVars(tp, design);
  let html = '';
  if(design.bgImage) html += `<img class="tp-bg-image" src="${design.bgImage}">`;
  if(design.drawing && !(opts && opts.live)) html += `<img class="tp-drawing-layer" src="${design.drawing}">`;   // v90 : en cours de dessin, c'est le canevas qui montre les traits
  html += tpInnerHtml(p);
  if(design.freeImg && design.freeImg.src){
    const f = design.freeImg;
    html += `<div class="tp-free-img" data-free-img="1" style="left:${f.x}%;top:${f.y}%;width:${f.w}%;height:${f.h}%;"><img src="${f.src}" alt="" draggable="false"></div>`;
  }
  tp.innerHTML = html;
  tpApplyPositions(tp, design);   // les textes déplacés gardent leur place : aperçu, plein écran, impression, PDF
  return tp;
}

const DEFAULT_AUTHOR_KEY = 'scriptmm_default_author';
function getDefaultAuthor(){ try{ return localStorage.getItem(DEFAULT_AUTHOR_KEY) || ''; }catch(e){ return ''; } }
function setDefaultAuthor(name){ try{ if(name) localStorage.setItem(DEFAULT_AUTHOR_KEY, name); }catch(e){} }
const IDX_KEY = 'scriptmm_projects_index';
const proj_key = id => 'scriptmm_project_' + id;
const OLD_IDX_KEY = 'feuille_projects_index';
const OLD_proj_key = id => 'feuille_project_' + id;
/* Migration ponctuelle : si l'app tournait précédemment sous l'ancien nom
   "Feuille", on récupère les scénarios déjà enregistrés sous ces anciennes
   clés localStorage, sans jamais écraser des données déjà migrées. */
function migrateOldStorage(){
  try{
    if(localStorage.getItem(IDX_KEY)!=null) return;
    const oldRaw = localStorage.getItem(OLD_IDX_KEY);
    if(!oldRaw) return;
    const oldIdx = JSON.parse(oldRaw);
    if(!Array.isArray(oldIdx) || !oldIdx.length) return;
    oldIdx.forEach(entry=>{
      const raw = localStorage.getItem(OLD_proj_key(entry.id));
      if(raw!=null) localStorage.setItem(proj_key(entry.id), raw);
    });
    localStorage.setItem(IDX_KEY, oldRaw);
  }catch(e){}
}

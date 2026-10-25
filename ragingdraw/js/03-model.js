/* =====================================================================
   RAGING DRAW — MODÈLE
   Formats d'affiche, polices, objets, décors (tracés vectoriels générés)
   et modèles de départ.
===================================================================== */

/* ---------- Formats ----------
   Chaque format a une taille de travail (en unités) et, s'il s'agit d'un
   format papier, sa taille physique : l'export « impression » en tire
   le nombre exact de pixels pour 300 dpi. */
const FORMATS = [
  {id:'onesheet', g:'print', fr:'Affiche cinéma US', en:'US one-sheet', d:'27 × 40 in', w:1620, h:2400, phys:{w:27, h:40, unit:'in'}},
  {id:'fr120',    g:'print', fr:'Affiche française', en:'French poster', d:'120 × 160 cm', w:1800, h:2400, phys:{w:120, h:160, unit:'cm'}},
  {id:'p40',      g:'print', fr:'Affiche 40 × 60', en:'40 × 60 poster', d:'40 × 60 cm', w:1600, h:2400, phys:{w:40, h:60, unit:'cm'}},
  {id:'a3',       g:'print', fr:'A3', en:'A3', d:'297 × 420 mm', w:1697, h:2400, phys:{w:297, h:420, unit:'mm'}},
  {id:'a4',       g:'print', fr:'A4', en:'A4', d:'210 × 297 mm', w:1697, h:2400, phys:{w:210, h:297, unit:'mm'}},
  {id:'insta',    g:'screen', fr:'Post Instagram', en:'Instagram post', d:'1080 × 1350 px · 4:5', w:1080, h:1350, phys:null},
  {id:'story',    g:'screen', fr:'Story · Reel', en:'Story · Reel', d:'1080 × 1920 px · 9:16', w:1080, h:1920, phys:null},
  {id:'wide',     g:'screen', fr:'Bannière · Vignette', en:'Banner · Thumbnail', d:'1920 × 1080 px · 16:9', w:1920, h:1080, phys:null},
  {id:'square',   g:'screen', fr:'Carré', en:'Square', d:'1080 × 1080 px · 1:1', w:1080, h:1080, phys:null}
];
function formatById(id){ return FORMATS.find(f => f.id === id) || null; }
function formatLabel(doc){
  const f = formatById(doc.format);
  if(f) return L(f.fr, f.en);
  if(doc.phys) return round(doc.phys.w,1) + ' × ' + round(doc.phys.h,1) + ' ' + doc.phys.unit;
  return doc.w + ' × ' + doc.h + ' px';
}
function physInches(phys){
  if(!phys) return null;
  const k = phys.unit === 'in' ? 1 : phys.unit === 'cm' ? 1/2.54 : 1/25.4;
  return {w: phys.w*k, h: phys.h*k};
}

/* ---------- Polices (toutes chargées depuis Google Fonts, comme dans Raging Page) ---------- */
const FONT_GROUPS = [
  {fr:'Cinéma · condensées', en:'Cinema · condensed', list:['Bebas Neue','Anton','Oswald','League Gothic','Fjalla One','Staatliches','Big Shoulders Display','Teko','Archivo Black','Alfa Slab One','Six Caps','Antonio']},
  {fr:'Titres', en:'Display', list:['Cinzel','Cinzel Decorative','Abril Fatface','Limelight','Monoton','Bungee','Righteous','Bowlby One','Fugaz One','Black Ops One','Rubik Mono One','Unbounded','Orbitron','Audiowide','Michroma','Russo One','Rye','Pirata One','UnifrakturCook','Creepster','Press Start 2P']},
  {fr:'Avec empattements', en:'Serif', list:['Playfair Display','Fraunces','Cormorant Garamond','Bodoni Moda','DM Serif Display','Libre Baskerville','EB Garamond','Lora','Merriweather','Prata','Gloock','Young Serif','Marcellus','Forum','Old Standard TT','Spectral','Libre Caslon Text']},
  {fr:'Sans empattements', en:'Sans serif', list:['Inter','Archivo','Montserrat','Poppins','Raleway','Space Grotesk','Work Sans','DM Sans','Manrope','Outfit','Jost','Josefin Sans','Barlow','Syne','Lexend','Sora','Red Hat Display']},
  {fr:'Manuscrites', en:'Handwritten', list:['Caveat','Permanent Marker','Rock Salt','Dancing Script','Pacifico','Great Vibes','Satisfy','Sacramento','Allura','Alex Brush','Kaushan Script','Shadows Into Light','Homemade Apple','Amatic SC','Yellowtail','Mr Dafoe']},
  {fr:'Machine à écrire', en:'Typewriter', list:['Courier Prime','Special Elite','Space Mono','IBM Plex Mono','VT323','Share Tech Mono']}
];
const ALL_FONTS = FONT_GROUPS.reduce((a, g) => a.concat(g.list), []);

const BLENDS = [
  ['source-over','Normal','Normal'], ['multiply','Produit','Multiply'], ['screen','Superposition claire','Screen'],
  ['overlay','Incrustation','Overlay'], ['soft-light','Lumière tamisée','Soft light'], ['hard-light','Lumière crue','Hard light'],
  ['color-dodge','Densité −','Color dodge'], ['color-burn','Densité +','Color burn'], ['darken','Obscurcir','Darken'],
  ['lighten','Éclaircir','Lighten'], ['difference','Différence','Difference'], ['exclusion','Exclusion','Exclusion'],
  ['hue','Teinte','Hue'], ['saturation','Saturation','Saturation'], ['color','Couleur','Color'], ['luminosity','Luminosité','Luminosity']
];

const SWATCHES = ['#FFFFFF','#E8EAF2','#9A99B0','#5C6270','#23262E','#0B0B10','#000000',
  '#3699D4','#1F6FA0','#5DB6EC','#B7D4EC','#14425E',
  '#D64545','#8E1B1B','#F2994A','#F2C94C','#FFE8A3','#2F9E44','#1B5E3B','#8E5BD6','#E86FB0','#C8A165','#7A5230'];

/* ---------- Objets ---------- */
function solid(c){ return {type:'solid', color:c}; }
function linear(angle, stops){ return {type:'linear', angle, stops}; }
function radial(stops, cx, cy){ return {type:'radial', cx:cx==null?.5:cx, cy:cy==null?.5:cy, stops}; }
function stop(o, c){ return {o, c}; }

function baseObj(type, x, y, w, h){
  return {id:uid(), type, name:'', x, y, w, h, rot:0, opacity:1, blend:'source-over', visible:true, locked:false,
    flipX:false, flipY:false, shadow:{on:false, color:'#000000b3', blur:30, x:0, y:12}, mask:null};
}
function mkText(text, x, y, w, o){
  const t = Object.assign(baseObj('text', x, y, w, 100), {
    text, font:'Bebas Neue', size:120, weight:400, italic:false, align:'center', lineHeight:1.0, letterSpacing:0,
    upper:false, fill:solid('#FFFFFF'), stroke:{on:false, color:'#000000', width:4}, glow:{on:false, color:'#3699D4', blur:40}
  }, o||{});
  return t;
}
function mkShape(shape, x, y, w, h, o){
  return Object.assign(baseObj('shape', x, y, w, h), {
    shape, radius:0, points:5, inner:.45, sides:6, arrow:false,
    fill:solid('#D9363E'), stroke:{on:false, color:'#FFFFFF', width:6}
  }, o||{});
}
function mkPath(dec, x, y, w, h, o){
  return Object.assign(baseObj('path', x, y, w, h), {
    d:dec.d, vw:dec.vw, vh:dec.vh, rule:dec.rule || 'nonzero', decor:dec.id || '',
    fill:solid('#FFFFFF'), stroke:{on:false, color:'#000000', width:4}
  }, o||{});
}
function mkImage(asset, x, y, w, h, nw, nh, o){
  return Object.assign(baseObj('image', x, y, w, h), {
    asset, nw:nw||w, nh:nh||h,
    filters:{brightness:100, contrast:100, saturate:100, hue:0, blur:0, grayscale:0, sepia:0, invert:0},
    tint:{on:false, color:'#1F6FA0', amount:50},
    fade:{top:0, bottom:0, left:0, right:0},
    crop:{l:0, t:0, r:0, b:0}, radius:0, ellipse:false,
    stroke:{on:false, color:'#FFFFFF', width:8}
  }, o||{});
}
function mkDraw(x, y, w, h){
  return Object.assign(baseObj('draw', x, y, w, h), {bw:w, bh:h, strokes:[]});
}
function typeLabel(o){
  if(o.name) return o.name;
  switch(o.type){
    case 'text': return (o.text || L('Texte','Text')).split('\n')[0].slice(0, 28) || L('Texte','Text');
    case 'image': return o.asset ? L('Image','Image') : L('Cadre photo','Photo frame');
    case 'draw': return L('Dessin','Drawing');
    case 'path': return decorLabel(o.decor);
    case 'shape': return ({rect:L('Rectangle','Rectangle'), ellipse:L('Ellipse','Ellipse'), triangle:L('Triangle','Triangle'),
      star:L('Étoile','Star'), polygon:L('Polygone','Polygon'), line:L('Trait','Line')})[o.shape] || L('Forme','Shape');
  }
  return L('Objet','Object');
}

/* ---------- Décors vectoriels générés ----------
   Chaque décor rend un tracé SVG (d) dans sa propre boîte (vw × vh). */
function _n(v){ return Math.round(v*10)/10; }
function _rng(seed){ let s = seed>>>0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s>>>0) % 100000) / 100000; }; }
function _leaf(px, py, ang, len, wid){
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const tx = px + ca*len, ty = py + sa*len;
  const mx = px + ca*len*.5, my = py + sa*len*.5;
  const nx = -sa*wid, ny = ca*wid;
  return `M${_n(px)} ${_n(py)}Q${_n(mx+nx)} ${_n(my+ny)} ${_n(tx)} ${_n(ty)}Q${_n(mx-nx)} ${_n(my-ny)} ${_n(px)} ${_n(py)}Z`;
}
function decorLaurel(){
  const vw = 400, vh = 300, cx = 200, cy = 150, R = 128;
  let d = '';
  [-1, 1].forEach(side => {
    const a0 = 112, a1 = 262, n = 9;
    for(let i = 0; i < n; i++){
      const t = i/(n-1), aDeg = a0 + (a1-a0)*t, a = aDeg*Math.PI/180;
      let px = cx + Math.cos(a)*R, py = cy + Math.sin(a)*R;
      if(side === 1) px = 2*cx - px;
      // tangente vers le haut de la branche
      let tx = -Math.sin(a)*(-1), ty = Math.cos(a)*(-1);
      if(side === 1) tx = -tx;
      const base = Math.atan2(ty, tx);
      const len = 46 - t*14, wid = 11 - t*3;
      d += _leaf(px, py, base + side*0.62, len, wid);
      d += _leaf(px, py, base - side*0.62, len*.88, wid*.92);
    }
    // tige : bande fine entre deux arcs
    const s0 = a0*Math.PI/180, s1 = a1*Math.PI/180, r1 = R+3, r2 = R-3;
    const P = (r, a) => { let x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r; if(side === 1) x = 2*cx - x; return [_n(x), _n(y)]; };
    const A = P(r1, s0), B = P(r1, s1), C = P(r2, s1), D = P(r2, s0);
    const sw = side === 1 ? 0 : 1;
    d += `M${A[0]} ${A[1]}A${r1} ${r1} 0 0 ${sw} ${B[0]} ${B[1]}L${C[0]} ${C[1]}A${r2} ${r2} 0 0 ${1-sw} ${D[0]} ${D[1]}Z`;
  });
  return {id:'laurel', d, vw, vh};
}
function decorStarPoly(n, inner, vw){
  vw = vw || 200; const c = vw/2, R = vw/2; let d = '';
  for(let i = 0; i < n*2; i++){
    const r = i%2 ? R*inner : R, a = -Math.PI/2 + i*Math.PI/n;
    d += (i ? 'L' : 'M') + _n(c + Math.cos(a)*r) + ' ' + _n(c + Math.sin(a)*r);
  }
  return d + 'Z';
}
function decorSunburst(){
  const n = 36, c = 500; let d = '';
  for(let i = 0; i < n; i++){
    const a0 = (i/n)*Math.PI*2, a1 = a0 + Math.PI/n;
    d += `M${c} ${c}L${_n(c+Math.cos(a0)*720)} ${_n(c+Math.sin(a0)*720)}L${_n(c+Math.cos(a1)*720)} ${_n(c+Math.sin(a1)*720)}Z`;
  }
  return {id:'sunburst', d, vw:1000, vh:1000};
}
function decorFilmstrip(){
  const vw = 1000, vh = 160; let d = `M0 0H${vw}V${vh}H0Z`;
  for(let x = 14; x < vw-20; x += 52){ d += `M${x} 14h30v24h-30zM${x} ${vh-38}h30v24h-30z`; }
  for(let x = 20; x < vw-120; x += 240){ d += `M${x} 54h220v52h-220z`; }
  return {id:'filmstrip', d, vw, vh, rule:'evenodd'};
}
function decorStars5(){
  let d = ''; for(let i = 0; i < 5; i++){ d += decorStarPoly(5, .45, 200).replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, x, y) => _n(+x + i*220) + ' ' + y); }
  return {id:'stars5', d, vw:1080, vh:200};
}
function decorDrips(seed){
  const r = _rng(seed||7), vw = 1000; let d = 'M0 0H1000V60';
  let x = 1000;
  while(x > 0){
    const w = 30 + r()*70, len = 60 + r()*260, dw = Math.min(w*.6, 16 + r()*22);
    const xm = x - w/2;
    d += `L${_n(xm + dw/2)} 60L${_n(xm + dw/2)} ${_n(len)}A${_n(dw/2)} ${_n(dw/2)} 0 0 1 ${_n(xm - dw/2)} ${_n(len)}L${_n(xm - dw/2)} 60`;
    x -= w;
  }
  d += 'L0 60Z';
  return {id:'drips', d, vw, vh:360};
}
function decorSplatter(seed){
  const r = _rng(seed||11); let d = '';
  const blob = (cx, cy, rad, k) => {
    let s = ''; const n = 14;
    for(let i = 0; i <= n; i++){
      const a = i/n*Math.PI*2, rr = rad*(0.75 + r()*k);
      s += (i ? 'L' : 'M') + _n(cx + Math.cos(a)*rr) + ' ' + _n(cy + Math.sin(a)*rr);
    }
    return s + 'Z';
  };
  d += blob(500, 500, 210, .5);
  for(let i = 0; i < 26; i++){
    const a = r()*Math.PI*2, dist = 250 + r()*230, rad = 8 + r()*34;
    d += blob(500 + Math.cos(a)*dist, 500 + Math.sin(a)*dist, rad, .4);
    if(r() > .5){
      const dd = 200 + r()*80, ww = 10 + r()*16;
      d += `M${_n(500+Math.cos(a)*120)} ${_n(500+Math.sin(a)*120)}L${_n(500+Math.cos(a+ .06)*dd)} ${_n(500+Math.sin(a+.06)*dd)}L${_n(500+Math.cos(a-.06)*dd)} ${_n(500+Math.sin(a-.06)*dd)}Z`;
      void ww;
    }
  }
  return {id:'splatter', d, vw:1000, vh:1000};
}
function decorStarfield(vw, vh, seed){
  const r = _rng(seed || 3); let d = '';
  for(let i = 0; i < 110; i++){
    const x = r()*vw, y = r()*vh, rad = 0.6 + r()*r()*2.6;
    d += `M${_n(x + rad)} ${_n(y)}A${_n(rad)} ${_n(rad)} 0 1 0 ${_n(x - rad)} ${_n(y)}A${_n(rad)} ${_n(rad)} 0 1 0 ${_n(x + rad)} ${_n(y)}Z`;
  }
  return {id:'starfield', d, vw:Math.round(vw), vh:Math.round(vh)};
}
const DECORS = {
  laurel: () => decorLaurel(),
  star: () => ({id:'star', d:decorStarPoly(5, .45, 200), vw:200, vh:200}),
  burst: () => ({id:'burst', d:decorStarPoly(20, .78, 200), vw:200, vh:200}),
  stars5: () => decorStars5(),
  sunburst: () => decorSunburst(),
  filmstrip: () => decorFilmstrip(),
  ring: () => ({id:'ring', d:'M100 0A100 100 0 1 1 99.9 0ZM100 14A86 86 0 1 0 100.1 14Z', vw:200, vh:200, rule:'evenodd'}),
  frame: () => ({id:'frame', d:'M0 0H1000V1400H0ZM40 40V1360H960V40Z', vw:1000, vh:1400, rule:'evenodd'}),
  heart: () => ({id:'heart', d:'M100 180C40 135 0 100 0 58 0 24 26 0 56 0 76 0 92 10 100 26 108 10 124 0 144 0 174 0 200 24 200 58 200 100 160 135 100 180Z', vw:200, vh:180}),
  bolt: () => ({id:'bolt', d:'M70 0H150L105 85H160L45 220L75 115H25Z', vw:180, vh:220}),
  arrow: () => ({id:'arrow', d:'M0 70H260V20L360 100L260 180V130H0Z', vw:360, vh:200}),
  crosshair: () => ({id:'crosshair', d:'M100 10A90 90 0 1 1 99.9 10ZM100 22A78 78 0 1 0 100.1 22ZM96 0H104V70H96ZM96 130H104V200H96ZM0 96H70V104H0ZM130 96H200V104H130Z', vw:200, vh:200, rule:'evenodd'}),
  bubble: () => ({id:'bubble', d:'M30 0H270Q300 0 300 30V150Q300 180 270 180H110L60 230L70 180H30Q0 180 0 150V30Q0 0 30 0Z', vw:300, vh:230}),
  drips: () => decorDrips(7),
  splatter: () => decorSplatter(11),
  scratch: () => ({id:'scratch', d:'M0 40L300 0L290 12L20 48ZM10 90L320 46L312 58L28 98ZM30 140L330 96L322 108L44 148Z', vw:330, vh:150}),
  starfield: () => decorStarfield(1000, 1400, 9),
  rays: () => ({id:'rays', d:(() => { let d = ''; for(let i = -6; i <= 6; i++){ const a = i*0.11; d += `M500 1000L${_n(500+Math.sin(a-0.025)*1100)} ${_n(1000-Math.cos(a-0.025)*1100)}L${_n(500+Math.sin(a+0.025)*1100)} ${_n(1000-Math.cos(a+0.025)*1100)}Z`; } return d; })(), vw:1000, vh:1000})
};
const DECOR_LIST = [
  ['laurel','Lauriers','Laurels'], ['stars5','5 étoiles','5 stars'], ['star','Étoile','Star'], ['burst','Macaron','Burst'],
  ['filmstrip','Pellicule','Film strip'], ['sunburst','Rayons','Sunburst'], ['rays','Faisceaux','Light beams'], ['ring','Anneau','Ring'],
  ['frame','Cadre','Frame'], ['crosshair','Viseur','Crosshair'], ['heart','Cœur','Heart'], ['bolt','Éclair','Lightning'],
  ['arrow','Flèche','Arrow'], ['bubble','Bulle','Speech bubble'], ['drips','Coulures','Drips'], ['splatter','Éclaboussure','Splatter'], ['scratch','Griffures','Scratches'], ['starfield','Ciel étoilé','Starry sky']
];
function decorLabel(id){ const e = DECOR_LIST.find(x => x[0] === id); return e ? L(e[1], e[2]) : L('Décor','Decor'); }
function addDecorObj(id, W, H){
  const dec = DECORS[id](), u = Math.min(W, H);
  let w = u*.5, h = w*dec.vh/dec.vw;
  if(id === 'filmstrip'){ w = W; h = w*dec.vh/dec.vw; }
  if(id === 'frame'){ w = W*.92; h = H*.94; }
  if(id === 'drips'){ w = W; h = w*dec.vh/dec.vw; }
  if(id === 'sunburst' || id === 'rays'){ w = h = Math.max(W, H)*1.2; }
  if(id === 'starfield'){ w = W; h = H; }
  const o = mkPath(dec, W/2, id === 'drips' ? h/2 : H/2, w, h);
  if(id === 'drips' || id === 'splatter') o.fill = solid('#8E1B1B');
  if(id === 'sunburst' || id === 'rays'){ o.fill = solid('#FFFFFF'); o.opacity = .12; }
  if(id === 'stars5' || id === 'star' || id === 'burst') o.fill = solid('#F2C94C');
  return o;
}

/* ---------- Textes prêts à l'emploi ---------- */
function textPresets(){
  return [
    {id:'title', fr:'Titre du film', en:'Film title', make:(W,H) => [mkText(L('LE TITRE','THE TITLE'), W/2, H*.72, W*.9, {font:'Bebas Neue', size:Math.round(W*.2), letterSpacing:20})]},
    {id:'tagline', fr:'Slogan', en:'Tagline', make:(W,H) => [mkText(L('Certaines histoires ne devraient jamais être racontées.','Some stories should never be told.'), W/2, H*.12, W*.8, {font:'Cormorant Garamond', size:Math.round(W*.04), weight:600, italic:true, lineHeight:1.2})]},
    {id:'actors', fr:'Noms des acteurs', en:'Top billing', make:(W,H) => [mkText(L('PRÉNOM NOM    PRÉNOM NOM    PRÉNOM NOM','FIRST LAST    FIRST LAST    FIRST LAST'), W/2, H*.06, W*.9, {font:'Oswald', size:Math.round(W*.032), letterSpacing:120})]},
    {id:'billing', fr:'Bloc de crédits', en:'Billing block', make:(W,H) => [mkText(L('UNE PRODUCTION RAGING FILMS  EN ASSOCIATION AVEC STUDIO NORD  UN FILM DE PRÉNOM NOM  AVEC PRÉNOM NOM  PRÉNOM NOM  PRÉNOM NOM  MUSIQUE ORIGINALE PRÉNOM NOM  MONTAGE PRÉNOM NOM  DIRECTEUR DE LA PHOTOGRAPHIE PRÉNOM NOM  DÉCORS PRÉNOM NOM  COSTUMES PRÉNOM NOM  PRODUIT PAR PRÉNOM NOM  ÉCRIT ET RÉALISÉ PAR PRÉNOM NOM',
      'RAGING FILMS PRESENTS  IN ASSOCIATION WITH NORTH STUDIO  A FIRST LAST FILM  STARRING FIRST LAST  FIRST LAST  FIRST LAST  ORIGINAL MUSIC BY FIRST LAST  EDITED BY FIRST LAST  DIRECTOR OF PHOTOGRAPHY FIRST LAST  PRODUCTION DESIGN FIRST LAST  COSTUMES FIRST LAST  PRODUCED BY FIRST LAST  WRITTEN AND DIRECTED BY FIRST LAST'),
      W/2, H*.91, W*.78, {font:'League Gothic', size:Math.round(W*.026), lineHeight:1.05, letterSpacing:40, fill:solid('#FFFFFFd9')})]},
    {id:'date', fr:'Date de sortie', en:'Release date', make:(W,H) => [mkText(L('LE 12 MARS AU CINÉMA','IN THEATERS MARCH 12'), W/2, H*.84, W*.8, {font:'Oswald', size:Math.round(W*.04), weight:700, letterSpacing:80})]},
    {id:'soon', fr:'Prochainement', en:'Coming soon', make:(W,H) => [mkText(L('PROCHAINEMENT','COMING SOON'), W/2, H*.84, W*.8, {font:'Bebas Neue', size:Math.round(W*.06), letterSpacing:300, fill:solid('#5DB6EC')})]},
    {id:'quote', fr:'Citation critique', en:'Critic quote', make:(W,H) => {
      const t = mkText(L('« UN CHOC. »','“A KNOCKOUT.”'), W/2, H*.2, W*.6, {font:'Playfair Display', size:Math.round(W*.05), weight:700, italic:true});
      const s = mkPath(decorStars5(), W/2, H*.2 + W*.07, W*.22, W*.22*200/1080, {fill:solid('#F2C94C')});
      const src = mkText(L('LE JOURNAL','THE DAILY'), W/2, H*.2 + W*.12, W*.5, {font:'Oswald', size:Math.round(W*.022), letterSpacing:200, fill:solid('#FFFFFFcc')});
      return [t, s, src];
    }},
    {id:'laurels', fr:'Lauriers de festival', en:'Festival laurels', make:(W,H) => {
      const w = W*.34, dec = decorLaurel();
      const p = mkPath(dec, W/2, H*.3, w, w*dec.vh/dec.vw, {fill:solid('#E8D9A8')});
      const t = mkText(L('SÉLECTION\nOFFICIELLE\nFESTIVAL 2026','OFFICIAL\nSELECTION\nFESTIVAL 2026'), W/2, H*.3, w*.48, {font:'Cinzel', size:Math.round(w*.07), weight:700, lineHeight:1.15, letterSpacing:60, fill:solid('#E8D9A8')});
      return [p, t];
    }},
    {id:'rating', fr:'Classification', en:'Rating', make:(W,H) => {
      const s = W*.08;
      const r = mkShape('rect', W*.9, H*.95, s, s*.7, {radius:s*.08, fill:solid('#00000000'), stroke:{on:true, color:'#FFFFFF', width:Math.max(2, s*.05)}});
      const t = mkText('-12', W*.9, H*.95, s, {font:'Oswald', size:Math.round(s*.42), weight:700});
      return [r, t];
    }},
    {id:'body', fr:'Paragraphe', en:'Paragraph', make:(W,H) => [mkText(L('Écris ton texte ici.','Write your text here.'), W/2, H/2, W*.6, {font:'Inter', size:Math.round(W*.03), lineHeight:1.35})]},
    {id:'hand', fr:'Manuscrit', en:'Handwritten', make:(W,H) => [mkText(L('Signé…','Signed…'), W/2, H/2, W*.6, {font:'Permanent Marker', size:Math.round(W*.06), rot:-6})]}
  ];
}

/* ---------- Modèles de départ ---------- */
const TEMPLATES = [
  {id:'blank', fr:'Toile vierge', en:'Blank canvas', make:(W,H) => ({bg:solid('#0B0B10'), fx:{grain:0, vignette:0}, objects:[]})},
  {id:'blankw', fr:'Toile blanche', en:'White canvas', make:(W,H) => ({bg:solid('#FFFFFF'), fx:{grain:0, vignette:0}, objects:[]})},
  {id:'thriller', fr:'Thriller', en:'Thriller', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkImage(null, W/2, H*.42, W, H*.84, W, H*.84, {fade:{top:0, bottom:45, left:0, right:0}}));
    o.push(mkShape('ellipse', W*.5, H*.36, W*1.2, W*1.2, {fill:radial([stop(0,'#3699D455'), stop(1,'#3699D400')]), blend:'screen'}));
    o.push(mkText(L('ILS NE SONT JAMAIS REPARTIS.','THEY NEVER LEFT.'), W/2, H*.07, W*.86, {font:'Oswald', size:Math.round(u*.032), letterSpacing:420, fill:solid('#E8EAF2')}));
    o.push(mkText(L('NUIT\nBLANCHE','SLEEP\nLESS'), W/2, H*.735, W*.94, {font:'Anton', size:Math.round(u*.2), lineHeight:.9, letterSpacing:10, fill:linear(90, [stop(0,'#FFFFFF'), stop(1,'#B7D4EC')]), shadow:{on:true, color:'#000000cc', blur:40, x:0, y:10}}));
    o.push(textPresets().find(p => p.id === 'billing').make(W, H)[0]);
    o.push(mkText(L('LE 31 OCTOBRE AU CINÉMA','IN THEATERS OCTOBER 31'), W/2, H*.965, W*.8, {font:'Oswald', size:Math.round(u*.028), weight:700, letterSpacing:160, fill:solid('#5DB6EC')}));
    return {bg:linear(180, [stop(0,'#0E1A26'), stop(1,'#050508')]), fx:{grain:18, vignette:55}, objects:o};
  }},
  {id:'horror', fr:'Horreur', en:'Horror', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkImage(null, W/2, H*.45, W, H*.7, W, H*.7, {filters:{brightness:90, contrast:130, saturate:0, hue:0, blur:0, grayscale:100, sepia:0, invert:0}, fade:{top:30, bottom:40, left:0, right:0}}));
    const dr = addDecorObj('drips', W, H); dr.fill = solid('#7A0E0E'); o.push(dr);
    o.push(mkText(L('LA CAVE','THE CELLAR'), W/2, H*.8, W*.92, {font:'Creepster', size:Math.round(u*.18), fill:solid('#C21F1F'), glow:{on:true, color:'#FF2A2A', blur:60}}));
    o.push(mkText(L('N’ÉTEINS PAS LA LUMIÈRE','DON’T TURN OFF THE LIGHT'), W/2, H*.9, W*.8, {font:'Special Elite', size:Math.round(u*.034), letterSpacing:120, fill:solid('#E8EAF2')}));
    o.push(mkText(L('PROCHAINEMENT','COMING SOON'), W/2, H*.96, W*.6, {font:'Oswald', size:Math.round(u*.024), letterSpacing:500, fill:solid('#9A99B0')}));
    return {bg:solid('#050505'), fx:{grain:35, vignette:80}, objects:o};
  }},
  {id:'scifi', fr:'Science-fiction', en:'Sci-fi', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkPath(decorStarfield(W, H*.75, 42), W/2, H*.375, W, H*.75, {fill:solid('#FFFFFF'), opacity:.85, name:L('Étoiles','Stars')}));
    o.push(mkShape('ellipse', W*.5, H*1.02, W*1.9, W*1.9, {fill:radial([stop(0,'#1F6FA0'), stop(.7,'#0E2A3D'), stop(1,'#06121C')], .5, .1), shadow:{on:true, color:'#5DB6ECaa', blur:120, x:0, y:0}}));
    o.push(mkShape('ellipse', W*.72, H*.28, W*.22, W*.22, {fill:radial([stop(0,'#FFE8A3'), stop(1,'#F2994A')], .35, .35), shadow:{on:true, color:'#F2994Acc', blur:90, x:0, y:0}}));
    o.push(mkText('ORBITA', W/2, H*.6, W*.94, {font:'Orbitron', size:Math.round(u*.16), weight:700, letterSpacing:200, fill:linear(90, [stop(0,'#FFFFFF'), stop(1,'#5DB6EC')]), glow:{on:true, color:'#3699D4', blur:50}}));
    o.push(mkText(L('LE SILENCE N’EST QUE LE DÉBUT','SILENCE IS ONLY THE BEGINNING'), W/2, H*.69, W*.8, {font:'Michroma', size:Math.round(u*.024), letterSpacing:200, fill:solid('#B7D4EC')}));
    const b = textPresets().find(p => p.id === 'billing').make(W, H)[0]; b.y = H*.93; o.push(b);
    return {bg:linear(180, [stop(0,'#02040A'), stop(1,'#0B1624')]), fx:{grain:10, vignette:40}, objects:o};
  }},
  {id:'festival', fr:'Festival · drame', en:'Festival · drama', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkImage(null, W/2, H*.4, W*.84, H*.56, W*.84, H*.56, {filters:{brightness:100, contrast:105, saturate:80, hue:0, blur:0, grayscale:0, sepia:15, invert:0}}));
    const lw = W*.28, dec = decorLaurel();
    o.push(mkPath(dec, W*.5, H*.79, lw, lw*dec.vh/dec.vw, {fill:solid('#23262E')}));
    o.push(mkText(L('SÉLECTION\nOFFICIELLE','OFFICIAL\nSELECTION'), W*.5, H*.79, lw*.5, {font:'Cinzel', size:Math.round(lw*.075), weight:700, lineHeight:1.15, letterSpacing:60, fill:solid('#23262E')}));
    o.push(mkText(L('L’Été d’après','The Summer After'), W/2, H*.065, W*.9, {font:'Cormorant Garamond', size:Math.round(u*.1), weight:600, italic:true, fill:solid('#23262E')}));
    o.push(mkText(L('UN FILM DE PRÉNOM NOM','A FILM BY FIRST LAST'), W/2, H*.9, W*.8, {font:'Cinzel', size:Math.round(u*.026), weight:600, letterSpacing:300, fill:solid('#5C6270')}));
    return {bg:solid('#F4EFE6'), fx:{grain:14, vignette:0}, objects:o};
  }},
  {id:'comedy', fr:'Comédie', en:'Comedy', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    const sb = addDecorObj('sunburst', W, H); sb.fill = solid('#FFFFFF'); sb.opacity = .22; sb.y = H*.42; o.push(sb);
    o.push(mkImage(null, W/2, H*.43, W*.72, W*.72, W*.72, W*.72, {ellipse:true, stroke:{on:true, color:'#FFFFFF', width:Math.round(u*.018)}}));
    const bu = addDecorObj('burst', W, H); bu.x = W*.8; bu.y = H*.2; bu.w = bu.h = u*.26; bu.fill = solid('#D64545'); bu.rot = 12; o.push(bu);
    o.push(mkText(L('ENFIN\nLIBRE !','FINALLY\nFREE!'), W*.8, H*.2, u*.2, {font:'Bowlby One', size:Math.round(u*.034), lineHeight:1.05, rot:12}));
    o.push(mkText(L('Les Vacances\nde Marcel','Marcel’s\nVacation'), W/2, H*.79, W*.94, {font:'Bowlby One', size:Math.round(u*.105), lineHeight:.95, fill:solid('#14425E'), stroke:{on:true, color:'#FFFFFF', width:Math.round(u*.012)}, shadow:{on:true, color:'#14425E66', blur:0, x:Math.round(u*.008), y:Math.round(u*.01)}}));
    o.push(mkText(L('CET ÉTÉ AU CINÉMA','THIS SUMMER IN THEATERS'), W/2, H*.945, W*.8, {font:'Montserrat', size:Math.round(u*.03), weight:700, letterSpacing:200, fill:solid('#14425E')}));
    return {bg:linear(180, [stop(0,'#F2C94C'), stop(1,'#F2994A')]), fx:{grain:0, vignette:0}, objects:o};
  }},
  {id:'vintage', fr:'Vintage', en:'Vintage', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    const fr = addDecorObj('frame', W, H); fr.w = W*.94; fr.h = H*.95; fr.fill = solid('#7A5230'); o.push(fr);
    const fr2 = addDecorObj('frame', W, H); fr2.w = W*.9; fr2.h = H*.925; fr2.fill = solid('#7A5230'); fr2.opacity = .6; o.push(fr2);
    o.push(mkImage(null, W/2, H*.45, W*.74, H*.48, W*.74, H*.48, {filters:{brightness:100, contrast:110, saturate:40, hue:0, blur:0, grayscale:0, sepia:70, invert:0}, radius:u*.02}));
    o.push(mkText(L('LE DERNIER\nTRAIN','THE LAST\nTRAIN'), W/2, H*.14, W*.86, {font:'Rye', size:Math.round(u*.09), lineHeight:1.05, fill:solid('#8E1B1B')}));
    o.push(mkText(L('— UNE AVENTURE EN TECHNICOLOR —','— AN ADVENTURE IN TECHNICOLOR —'), W/2, H*.75, W*.8, {font:'Limelight', size:Math.round(u*.028), letterSpacing:60, fill:solid('#7A5230')}));
    o.push(mkText(L('AVEC PRÉNOM NOM · PRÉNOM NOM','STARRING FIRST LAST · FIRST LAST'), W/2, H*.84, W*.8, {font:'Old Standard TT', size:Math.round(u*.03), weight:700, letterSpacing:100, fill:solid('#23262E')}));
    o.push(mkText(L('EN SALLE DÈS LE 4 JUILLET','IN THEATERS JULY 4'), W/2, H*.9, W*.7, {font:'Oswald', size:Math.round(u*.026), letterSpacing:260, fill:solid('#8E1B1B')}));
    return {bg:solid('#EFE3C8'), fx:{grain:30, vignette:35, vignetteColor:'#5A3A1A'}, objects:o};
  }},
  {id:'minimal', fr:'Minimaliste', en:'Minimalist', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkShape('ellipse', W/2, H*.42, u*.5, u*.5, {fill:solid('#3699D4')}));
    o.push(mkShape('rect', W/2, H*.42 + u*.08, W, u*.002 + 2, {fill:solid('#23262E')}));
    o.push(mkText(L('HORIZON','HORIZON'), W/2, H*.78, W*.9, {font:'Inter', size:Math.round(u*.09), weight:700, letterSpacing:500, fill:solid('#23262E')}));
    o.push(mkText(L('un film de Prénom Nom','a film by First Last'), W/2, H*.84, W*.8, {font:'Inter', size:Math.round(u*.024), fill:solid('#5C6270')}));
    return {bg:solid('#FCFDFE'), fx:{grain:6, vignette:0}, objects:o};
  }},
  {id:'neon', fr:'Néon', en:'Neon', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkImage(null, W/2, H*.4, W, H*.8, W, H*.8, {tint:{on:true, color:'#8E5BD6', amount:55}, fade:{top:0, bottom:50, left:0, right:0}}));
    o.push(mkText(L('MINUIT','MIDNIGHT'), W/2, H*.72, W*.9, {font:'Monoton', size:Math.round(u*.14), fill:solid('#FFE6FA'), glow:{on:true, color:'#E86FB0', blur:70}}));
    o.push(mkText(L('LA VILLE NE DORT JAMAIS','THE CITY NEVER SLEEPS'), W/2, H*.81, W*.8, {font:'Audiowide', size:Math.round(u*.03), letterSpacing:200, fill:solid('#A9D8F5'), glow:{on:true, color:'#3699D4', blur:30}}));
    const b = textPresets().find(p => p.id === 'billing').make(W, H)[0]; b.y = H*.92; o.push(b);
    return {bg:linear(180, [stop(0,'#120A24'), stop(1,'#05030C')]), fx:{grain:12, vignette:50}, objects:o};
  }}
];

function newDoc(title, fmt, templateId){
  const W = fmt.w, H = fmt.h;
  const t = (TEMPLATES.find(x => x.id === templateId) || TEMPLATES[0]).make(W, H);
  return {
    id:uid('p'), v:1, title:title || L('Nouvelle affiche','New poster'), format:fmt.id || 'custom',
    w:W, h:H, phys:fmt.phys ? deepClone(fmt.phys) : null,
    bg:t.bg, fx:Object.assign({grain:0, vignette:0, vignetteColor:'#000000'}, t.fx || {}),
    objects:t.objects, assets:{}, createdAt:Date.now(), updatedAt:Date.now()
  };
}

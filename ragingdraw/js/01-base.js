/* =====================================================================
   RAGING DRAW — BASE
   Langue, petits utilitaires, icônes, logo, boîtes de dialogue, toasts.
   Même DA que Raging Page : mêmes couleurs, mêmes boîtes, même ton.
===================================================================== */
const RD_VERSION = 'v1.0';
const LS_LANG = 'ragingdraw_lang', LS_THEME = 'ragingdraw_theme';

function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }

/* Langue : celle choisie dans Raging Draw, sinon celle de Raging Page, sinon celle du navigateur. */
function getLang(){
  const v = lsGet(LS_LANG) || lsGet('scriptmm_lang');
  if(v === 'fr' || v === 'en') return v;
  return (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}
function L(fr, en){ return getLang() === 'en' ? en : fr; }
function setLang(l){ lsSet(LS_LANG, l); document.documentElement.lang = l; render(); }

function isDarkTheme(){ return document.documentElement.getAttribute('data-theme') === 'dark'; }
function toggleTheme(){
  const dark = isDarkTheme();
  if(dark) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', 'dark');
  lsSet(LS_THEME, dark ? 'light' : 'dark');
  document.querySelectorAll('[data-act="toggleTheme"]').forEach(b => { b.innerHTML = themeBtnInner(b.dataset.compact === '1'); });
  if(typeof requestRender === 'function') requestRender();
}
function themeBtnInner(compact){
  return icon(isDarkTheme() ? 'sun' : 'moon') + (compact ? '' : ' ' + (isDarkTheme() ? L('Mode clair','Light mode') : L('Mode sombre','Dark mode')));
}
function themeToggleBtnHtml(cls, compact){
  return `<button class="btn ${cls||''}" data-act="toggleTheme" data-compact="${compact?1:0}" title="${L('Changer d’apparence','Change appearance')}">${themeBtnInner(compact)}</button>`;
}
function langFlagsHtml(){
  const lang = getLang();
  return `<div class="lang-flags" role="group" aria-label="Langue / Language">
    <button class="lang-flag ${lang==='fr'?'active':''}" data-act="setLang" data-id="fr" title="${L('Passer en français','Switch to French')}" aria-label="Français">FR</button>
    <button class="lang-flag ${lang==='en'?'active':''}" data-act="setLang" data-id="en" title="${L('Passer en anglais','Switch to English')}" aria-label="English">EN</button>
  </div>`;
}

function esc(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function uid(p){ return (p||'o') + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
function round(v, d){ const k = Math.pow(10, d||0); return Math.round(v*k)/k; }
function deepClone(o){ return JSON.parse(JSON.stringify(o)); }
function debounce(fn, ms){ let t; return function(...a){ clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }
function timeAgo(ts){
  const m = Math.floor((Date.now()-ts)/60000), en = getLang()==='en';
  if(m < 1) return en ? 'just now' : 'à l’instant';
  if(m < 60) return en ? m+' min ago' : 'il y a '+m+' min';
  const h = Math.floor(m/60); if(h < 24) return en ? h+' h ago' : 'il y a '+h+' h';
  const d = Math.floor(h/24); if(d < 30) return en ? d+' d ago' : 'il y a '+d+' j';
  return new Date(ts).toLocaleDateString(en ? 'en-US' : 'fr-FR');
}
function fmtBytes(n){
  if(n < 1024*1024) return Math.max(1, Math.round(n/1024)) + ' ' + L('Ko','KB');
  return round(n/1024/1024, 1).toString().replace('.', getLang()==='fr' ? ',' : '.') + ' ' + L('Mo','MB');
}
function fmtNum(n){ return Math.round(n).toLocaleString(getLang()==='en' ? 'en-US' : 'fr-FR'); }
function safeName(s){
  // lettres sans accents, chiffres et ponctuation sûre : certains navigateurs renomment sinon le fichier « download »
  return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").replace(/Œ/g, 'OE').replace(/œ/g, 'oe').replace(/Æ/g, 'AE').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/[^A-Za-z0-9 _\-().,'!&+]+/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, 80) || 'affiche';
}
function downloadBlob(blob, name){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
function readFileAsDataURL(file){
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
function readFileAsText(file){
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); });
}

/* ---------- Couleurs ---------- */
function parseColor(c){
  if(!c) return {r:0,g:0,b:0,a:1};
  c = String(c).trim();
  if(c[0] === '#'){
    let h = c.slice(1);
    if(h.length === 3 || h.length === 4) h = h.split('').map(x => x+x).join('');
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    const a = h.length >= 8 ? parseInt(h.slice(6,8),16)/255 : 1;
    return {r:r||0, g:g||0, b:b||0, a};
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if(m){ const p = m[1].split(',').map(parseFloat); return {r:p[0]||0, g:p[1]||0, b:p[2]||0, a:p[3]==null?1:p[3]}; }
  return {r:0,g:0,b:0,a:1};
}
function hex2(n){ return clamp(Math.round(n),0,255).toString(16).padStart(2,'0'); }
function toHex(c, withAlpha){
  const o = typeof c === 'string' ? parseColor(c) : c;
  const base = '#' + hex2(o.r) + hex2(o.g) + hex2(o.b);
  return (withAlpha && o.a < 0.999) ? base + hex2(o.a*255) : base;
}
function colorAlpha(c){ return parseColor(c).a; }
function withAlpha(c, a){ const o = parseColor(c); o.a = clamp(a,0,1); return toHex(o, true); }
function isLight(c){ const o = parseColor(c); return (o.r*0.299 + o.g*0.587 + o.b*0.114) > 160; }

/* ---------- Icônes (même trait que Raging Page) ---------- */
function icon(name, cls){
  const p = {
    plus:'<path d="M8 2v12M2 8h12"/>',
    upload:'<path d="M8 11V2M4 6l4-4 4 4M2 13h12"/>',
    save:'<path d="M2 2h9l3 3v9H2z"/><path d="M5 2v4h6V2M5 13v-4h6v4"/>',
    undo:'<path d="M4 4v4h4"/><path d="M4 8a6 6 0 1 1 2 4.5"/>',
    redo:'<path d="M12 4v4H8"/><path d="M12 8a6 6 0 1 0-2 4.5"/>',
    export:'<path d="M8 10V2M4 6l4-4 4 4"/><path d="M2 13h12"/>',
    home:'<path d="M2 7.5 8 2.5l6 5"/><path d="M3.5 6.5V14h9V6.5"/><path d="M6.5 14v-4h3v4"/>',
    doc:'<path d="M3 1h7l3 3v11H3z"/><path d="M9 1v4h4"/>',
    poster:'<rect x="3" y="1.5" width="10" height="13" rx="1"/><path d="M5 11.5h6M5.8 9.5h4.4"/><path d="M5 4.5l3 3 3-3"/>',
    layers:'<path d="M8 1.5l6.2 3.3L8 8.1 1.8 4.8z"/><path d="M1.8 8.2 8 11.5l6.2-3.3"/><path d="M1.8 11.5 8 14.8l6.2-3.3"/>',
    trash:'<path d="M3 4h10M6 4V2h4v2M4.5 4l.7 10h5.6l.7-10"/>',
    close:'<path d="M3 3l10 10M13 3L3 13"/>',
    palette:'<path d="M8 1.6C4.2 1.6 1.3 4.5 1.3 8c0 3.4 2.7 6 6 6.4.7.1 1.1-.7.7-1.3-.3-.4-.2-1 .3-1.2.3-.1.6-.2 1-.2h1.6c2 0 3.4-1.6 3.4-3.5 0-3.8-2.8-6.6-6.3-6.6z"/><circle cx="4.9" cy="6.4" r=".8"/><circle cx="7.6" cy="4.6" r=".8"/><circle cx="10.5" cy="6" r=".8"/><circle cx="10.4" cy="9.2" r=".8"/>',
    pen:'<path d="M10.5 2.3l3.2 3.2-8 8-3.6.6.6-3.6z"/><path d="M9 3.8l3.2 3.2"/>',
    brush:'<path d="M14 2 8.2 8.6"/><path d="M7.4 7.7l1.6 1.6"/><path d="M5.6 9.3c1-.9 2.4-.7 3 .2.8 1.2.1 3-1.4 3.6-1.3.6-3.3.6-5.2.4 1.2-.9 1.2-1.9 1.6-2.7.4-.7 1-1.2 2-1.5z"/>',
    eraser:'<path d="M6.2 13.5h7.3"/><path d="M2.6 9.6 8.9 3.3a1.4 1.4 0 0 1 2 0l2.5 2.5a1.4 1.4 0 0 1 0 2l-5.7 5.7H5.3L2.6 10.8a.9.9 0 0 1 0-1.2z"/><path d="M5.6 6.6l4.5 4.5"/>',
    cursor:'<path d="M3 2l9.5 5.2-4.2 1.1L6.1 12.3z"/>',
    hand:'<path d="M5 8.5V3.6a1 1 0 0 1 2 0V7.5M7 7V2.6a1 1 0 0 1 2 0V7M9 7V3.4a1 1 0 0 1 2 0V8M11 5.6a1 1 0 0 1 2 0V9.5c0 2.8-2 4.9-4.6 4.9-1.8 0-3-.8-4-2.2L2.6 9.3a1 1 0 0 1 1.6-1.2L5 9.1"/>',
    typeT:'<path d="M2.5 4V2.5h11V4M8 2.5v11M5.8 13.5h4.4"/>',
    shapes:'<rect x="1.8" y="8.2" width="6" height="6" rx=".8"/><circle cx="11" cy="5" r="3.2"/><path d="M10.8 9.5l3.4 5H7.4z"/>',
    rect:'<rect x="2" y="3" width="12" height="10" rx="1.2"/>',
    ellipse:'<ellipse cx="8" cy="8" rx="6" ry="5"/>',
    triangle:'<path d="M8 2.5l6 10.5H2z"/>',
    star:'<path d="M8 1.8l1.8 4 4.4.4-3.3 2.9 1 4.3L8 11.1l-3.9 2.3 1-4.3-3.3-2.9 4.4-.4z"/>',
    polygon:'<path d="M8 1.8l5.6 4.1-2.1 6.6h-7L2.4 5.9z"/>',
    line:'<path d="M2.5 13.5l11-11"/>',
    arrow:'<path d="M2 8h11M9.5 4.5 13 8l-3.5 3.5"/>',
    image:'<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><circle cx="5.2" cy="6" r="1.2"/><path d="M2 12.5l3.8-4 2.6 2.6 2-2L14.5 12"/>',
    pipette:'<path d="M10.4 2.6a1.9 1.9 0 0 1 2.7 2.7l-1.6 1.6-2.7-2.7z"/><path d="M9.6 5.1 3.3 11.4l-.6 2 2-.6 6.3-6.3"/>',
    sparkles:'<path d="M6 1.8l1.2 3.1 3.1 1.2-3.1 1.2L6 10.4 4.8 7.3 1.7 6.1l3.1-1.2z"/><path d="M11.8 8.8l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z"/>',
    templates:'<rect x="1.8" y="1.8" width="5.4" height="7.4" rx=".8"/><rect x="8.8" y="1.8" width="5.4" height="4.4" rx=".8"/><rect x="8.8" y="7.8" width="5.4" height="6.4" rx=".8"/><rect x="1.8" y="10.8" width="5.4" height="3.4" rx=".8"/>',
    bg:'<rect x="1.8" y="1.8" width="12.4" height="12.4" rx="1.4"/><path d="M1.8 10.5 6 6.3l3 3 1.8-1.8 3.4 3.4"/>',
    ratio:'<rect x="3" y="1.5" width="10" height="13" rx="1"/><path d="M5.5 4h-1v1.5M10.5 12h1v-1.5"/>',
    eye:'<path d="M1.2 8S3.6 3.3 8 3.3 14.8 8 14.8 8 12.4 12.7 8 12.7 1.2 8 1.2 8z"/><circle cx="8" cy="8" r="2.1"/>',
    eyeoff:'<path d="M2 2l12 12"/><path d="M6.4 3.6C6.9 3.4 7.4 3.3 8 3.3c4.4 0 6.8 4.7 6.8 4.7s-.7 1.3-2 2.6M10.2 11.9c-.7.5-1.4.8-2.2.8-4.4 0-6.8-4.7-6.8-4.7s.8-1.6 2.4-3"/>',
    lock:'<rect x="3" y="7" width="10" height="7.5" rx="1.2"/><path d="M5.2 7V5a2.8 2.8 0 0 1 5.6 0v2"/>',
    unlock:'<rect x="3" y="7" width="10" height="7.5" rx="1.2"/><path d="M5.2 7V5a2.8 2.8 0 0 1 5.5-.7"/>',
    copy:'<rect x="5" y="5" width="9" height="9" rx="1.2"/><path d="M11 5V3.2A1.2 1.2 0 0 0 9.8 2H3.2A1.2 1.2 0 0 0 2 3.2v6.6A1.2 1.2 0 0 0 3.2 11H5"/>',
    up:'<path d="M8 13V3M4 7l4-4 4 4"/>',
    down:'<path d="M8 3v10M4 9l4 4 4-4"/>',
    top:'<path d="M3 2.5h10M8 14V5.5M4.5 9 8 5.5 11.5 9"/>',
    bottom:'<path d="M3 13.5h10M8 2v8.5M4.5 7 8 10.5 11.5 7"/>',
    flipH:'<path d="M8 1.5v13"/><path d="M6 4 2 12h4z"/><path d="M10 4l4 8h-4z"/>',
    flipV:'<path d="M1.5 8h13"/><path d="M4 6l8-4v4z"/><path d="M4 10l8 4v-4z"/>',
    alignL:'<path d="M2 1.5v13"/><rect x="4" y="3.5" width="9" height="3" rx=".6"/><rect x="4" y="9.5" width="5.5" height="3" rx=".6"/>',
    alignCH:'<path d="M8 1.5v13"/><rect x="3" y="3.5" width="10" height="3" rx=".6"/><rect x="5" y="9.5" width="6" height="3" rx=".6"/>',
    alignR:'<path d="M14 1.5v13"/><rect x="3" y="3.5" width="9" height="3" rx=".6"/><rect x="6.5" y="9.5" width="5.5" height="3" rx=".6"/>',
    alignT:'<path d="M1.5 2h13"/><rect x="3.5" y="4" width="3" height="9" rx=".6"/><rect x="9.5" y="4" width="3" height="5.5" rx=".6"/>',
    alignCV:'<path d="M1.5 8h13"/><rect x="3.5" y="3" width="3" height="10" rx=".6"/><rect x="9.5" y="5" width="3" height="6" rx=".6"/>',
    alignB:'<path d="M1.5 14h13"/><rect x="3.5" y="3" width="3" height="9" rx=".6"/><rect x="9.5" y="6.5" width="3" height="5.5" rx=".6"/>',
    distH:'<path d="M1.5 2v12M14.5 2v12"/><rect x="6" y="4.5" width="4" height="7" rx=".6"/>',
    distV:'<path d="M2 1.5h12M2 14.5h12"/><rect x="4.5" y="6" width="7" height="4" rx=".6"/>',
    zoomIn:'<circle cx="7" cy="7" r="5"/><path d="M14 14l-3.4-3.4M5 7h4M7 5v4"/>',
    zoomOut:'<circle cx="7" cy="7" r="5"/><path d="M14 14l-3.4-3.4M5 7h4"/>',
    fit:'<path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5"/>',
    read:'<path d="M8 3C6 2 3.5 2 2 2.8v10c1.5-.8 4-.8 6 .2M8 3c2-1 4.5-1 6 -.2v10c-1.5-.8-4-.8-6 .2V3z"/>',
    folder:'<path d="M1.8 4.2a1 1 0 0 1 1-1h3.4l1.4 1.6h5.6a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1H2.8a1 1 0 0 1-1-1z"/>',
    sun:'<circle cx="8" cy="8" r="3"/><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4"/>',
    moon:'<path d="M13.2 9.3A5.6 5.6 0 0 1 6.7 2.8a5.6 5.6 0 1 0 6.5 6.5z"/>',
    gear:'<circle cx="8" cy="8" r="2.6"/><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4"/>',
    keyboard:'<rect x="1.5" y="4" width="13" height="8.5" rx="1.5"/><path d="M4.2 6.9h.01M6.7 6.9h.01M9.3 6.9h.01M11.8 6.9h.01M5 10h6"/>',
    bulb:'<path d="M5.6 10.6C4.5 9.8 3.8 8.6 3.8 7.2a4.2 4.2 0 0 1 8.4 0c0 1.4-.7 2.6-1.8 3.4v1.4H5.6z"/><path d="M6.2 14h3.6"/>',
    chevR:'<path d="M6 3.5 10.5 8 6 12.5"/>',
    chevD:'<path d="M3.5 6 8 10.5 12.5 6"/>',
    check:'<path d="M2.5 8.5l3.5 3.5 7.5-8"/>',
    grid:'<rect x="2" y="2" width="12" height="12" rx="1"/><path d="M6 2v12M10 2v12M2 6h12M2 10h12"/>',
    magnet:'<path d="M3 2.5h3v5a2 2 0 0 0 4 0v-5h3v5a5 5 0 0 1-10 0z"/><path d="M3 5h3M10 5h3"/>',
    film:'<rect x="1.5" y="2" width="13" height="12" rx="1"/><path d="M4.5 2v12M11.5 2v12M1.5 5h3M1.5 8h3M1.5 11h3M11.5 5h3M11.5 8h3M11.5 11h3"/>',
    laurel:'<path d="M5 14c-2.8-1.6-3.8-4.6-3.2-8M11 14c2.8-1.6 3.8-4.6 3.2-8"/><path d="M2 9.5c1.2.1 2 .7 2.3 1.6M1.8 6.5c1.1.3 1.8 1 2 2M14 9.5c-1.2.1-2 .7-2.3 1.6M14.2 6.5c-1.1.3-1.8 1-2 2"/>',
    group:'<rect x="1.5" y="1.5" width="8" height="8" rx="1"/><rect x="6.5" y="6.5" width="8" height="8" rx="1"/>',
    rotate:'<path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9"/><path d="M12.5 1.5v3h-3"/>',
    file:'<path d="M3 1.5h6.5L13 5v9.5H3z"/><path d="M9.5 1.5V5H13"/>',
    question:'<circle cx="8" cy="8" r="6.3"/><path d="M6.2 6.2a1.9 1.9 0 1 1 2.7 1.7c-.6.3-.9.7-.9 1.3v.4M8 11.6v.1"/>',
    more:'<circle cx="8" cy="3.5" r=".9"/><circle cx="8" cy="8" r=".9"/><circle cx="8" cy="12.5" r=".9"/>',
    crop:'<path d="M4 1.5V12h10.5M1.5 4H12v10.5"/>',
    drop:'<path d="M8 1.8C8 1.8 3.5 7 3.5 10a4.5 4.5 0 0 0 9 0C12.5 7 8 1.8 8 1.8z"/>'
  }[name] || '';
  return `<svg class="icon ${cls||''}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
}

/* ---------- Logo : le visage de Raging Page, mais sur une toile qui coule et avec un pinceau ---------- */
function rdLogo(size, cls, splash){
  return '<svg class="' + (cls||'') + (splash ? ' rd-logo-splash' : '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true">' +
    '<rect class="rdlb" width="64" height="64" rx="14" fill="#A51F2B"/>' +
    '<path d="M12 7H53V57H12Z" fill="#FCFDFE" stroke="#FCFDFE" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M12 7H53V12.6c0 1.7-1 2.7-2.3 2.7s-2.3-1-2.3-2.7V12H43.6v5.2c0 1.9-1.1 3-2.5 3s-2.5-1.1-2.5-3V12H12Z" fill="#F2C4C7" stroke="#F2C4C7" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M16 25L31 30M50 27L35 30" stroke="#5E1418" stroke-width="6" stroke-linecap="round"/>' +
    '<circle cx="25" cy="38" r="6.6" fill="#5E1418"/><circle cx="27.2" cy="35.8" r="1.9" fill="#FCFDFE"/>' +
    '<circle cx="41" cy="38" r="6.6" fill="#5E1418"/><circle cx="43.2" cy="35.8" r="1.9" fill="#FCFDFE"/>' +
    '<path d="M20 51H37" stroke="#5E1418" stroke-width="5.6" stroke-linecap="round"/>' +
    '<g transform="translate(36 51) rotate(-30)"><path d="M-2 -1.9Q-2 -2.4 -1.4 -2.4H11V2.4H-1.4Q-2 2.4 -2 1.9Z" fill="#5E1418"/><path d="M10.5 -3.1H15.5V3.1H10.5Z" fill="#F0646B"/><path d="M15.3 -3.6C20 -4.2 24.5 -2.6 28.5 0C24.5 2.6 20 4.2 15.3 3.6Z" fill="#FCFDFE"/><path d="M22 -3C24.4 -2.2 26.6 -1.2 28.5 0C26.6 1.2 24.4 2.2 22 3C23.2 1 23.2 -1 22 -3Z" fill="#F0646B"/></g>' +
    (splash ? '<g class="rd-splash"><circle class="sp sp1" cx="60" cy="36.5" r="3.4"/><circle class="sp sp2" cx="60" cy="36.5" r="3.4"/><circle class="sp sp3" cx="60" cy="36.5" r="3.4"/></g>' : '') +
    '</svg>';
}
/* Le nom « Raging Draw » : « Raging » est exactement celui de Raging Page ;
   « Draw » est tracé dans la même italique (Fraunces), au même réglage que « Page ». */
const RD_W1 = "M1428 -913Q1428 -826 1388.0 -750.0Q1348 -674 1276.0 -621.5Q1204 -569 1107 -552Q1048 -542 1004.0 -525.5Q960 -509 913.0 -496.5Q866 -484 799 -484Q746 -484 696.0 -492.5Q646 -501 603.5 -514.5Q561 -528 530 -544L528 -703Q561 -683 594.0 -672.5Q627 -662 662.0 -658.5Q697 -655 735 -655Q865 -655 934.5 -722.0Q1004 -789 1004 -917Q1004 -1005 964.5 -1074.0Q925 -1143 854.0 -1182.5Q783 -1222 686 -1222H637V-294Q637 -255 650.5 -237.0Q664 -219 689 -204L718 -189Q747 -171 758.5 -148.0Q770 -125 770 -93Q770 0 665 0H177Q125 0 99.0 -24.5Q73 -49 73 -93Q73 -161 135 -192L169 -209Q195 -221 208.5 -239.0Q222 -257 222 -294V-1106Q222 -1143 208.5 -1161.0Q195 -1179 169 -1191L135 -1208Q73 -1239 73 -1307Q73 -1351 99.0 -1375.5Q125 -1400 177 -1400H710Q944 -1400 1104.0 -1336.5Q1264 -1273 1346.0 -1163.0Q1428 -1053 1428 -913ZM800 -567 1196 -615 1392 -271Q1411 -239 1428.0 -223.0Q1445 -207 1479 -190Q1509 -175 1524.0 -151.5Q1539 -128 1539 -93Q1539 -50 1513.5 -25.0Q1488 0 1434 0H1012Q912 0 912 -93Q912 -115 921.0 -132.0Q930 -149 946 -163L963 -173Q973 -181 975.5 -195.5Q978 -210 967 -231Z M2191.0 -156V-183L2156.0 -191V-731Q2156.0 -775 2133.5 -800.5Q2111.0 -826 2071.0 -826Q2040.0 -826 2019.0 -811.5Q1998.0 -797 1998.0 -773V-715Q1998.0 -638 1947.5 -596.5Q1897.0 -555 1803.0 -555Q1720.0 -555 1680.0 -590.5Q1640.0 -626 1640.0 -689Q1640.0 -755 1698.0 -817.5Q1756.0 -880 1873.0 -920.5Q1990.0 -961 2164.0 -961Q2350.0 -961 2439.0 -886.5Q2528.0 -812 2528.0 -682V-249Q2528.0 -233 2536.5 -220.5Q2545.0 -208 2565.0 -208Q2576.0 -208 2583.5 -211.5Q2591.0 -215 2597.0 -219Q2602.0 -223 2608.0 -226.0Q2614.0 -229 2622.0 -229Q2645.0 -229 2657.5 -211.5Q2670.0 -194 2670.0 -169Q2670.0 -123 2640.5 -78.5Q2611.0 -34 2557.0 -4.5Q2503.0 25 2429.0 25Q2327.0 25 2259.0 -25.5Q2191.0 -76 2191.0 -156ZM1605.0 -212Q1605.0 -348 1725.0 -427.0Q1845.0 -506 2046.0 -506Q2100.0 -506 2144.5 -499.5Q2189.0 -493 2217.0 -480L2180.0 -371Q2158.0 -383 2136.5 -388.0Q2115.0 -393 2088.0 -393Q2040.0 -393 2010.5 -364.0Q1981.0 -335 1981.0 -286Q1981.0 -235 2009.5 -206.5Q2038.0 -178 2086.0 -178Q2121.0 -178 2150.0 -192.5Q2179.0 -207 2195.0 -227L2220.0 -119Q2173.0 -50 2083.5 -12.5Q1994.0 25 1893.0 25Q1760.0 25 1682.5 -42.0Q1605.0 -109 1605.0 -212Z M3386.0 -131Q3279.0 -143 3224.5 -151.5Q3170.0 -160 3150.5 -170.0Q3131.0 -180 3131.0 -196Q3131.0 -206 3139.5 -215.5Q3148.0 -225 3166.0 -235L3152.0 -253Q3018.0 -252 2940.5 -223.5Q2863.0 -195 2831.0 -151.0Q2799.0 -107 2799.0 -58Q2799.0 -6 2827.5 35.0Q2856.0 76 2935.5 105.5Q3015.0 135 3166.0 152Q3285.0 165 3350.5 177.0Q3416.0 189 3442.0 204.5Q3468.0 220 3468.0 245Q3468.0 267 3449.5 284.0Q3431.0 301 3382.0 310.0Q3333.0 319 3242.0 319Q3087.0 319 3033.5 290.0Q2980.0 261 2980.0 214Q2980.0 188 2994.0 164.5Q3008.0 141 3032.0 129L3011.0 106Q2834.0 112 2759.5 161.5Q2685.0 211 2685.0 297Q2685.0 358 2735.0 401.5Q2785.0 445 2891.0 467.5Q2997.0 490 3164.0 490Q3478.0 490 3635.0 396.5Q3792.0 303 3792.0 149Q3792.0 65 3751.5 8.5Q3711.0 -48 3621.5 -81.5Q3532.0 -115 3386.0 -131ZM3356.0 -861 3460.0 -846Q3486.0 -908 3508.5 -936.5Q3531.0 -965 3561.0 -965Q3584.0 -965 3599.5 -951.5Q3615.0 -938 3630.0 -921.0Q3645.0 -904 3667.5 -891.0Q3690.0 -878 3727.0 -878Q3785.0 -878 3818.0 -920.0Q3851.0 -962 3851.0 -1033Q3851.0 -1110 3805.5 -1150.5Q3760.0 -1191 3691.0 -1191Q3598.0 -1191 3520.0 -1131.0Q3442.0 -1071 3390.0 -944ZM3710.0 -600Q3710.0 -697 3655.5 -778.5Q3601.0 -860 3494.0 -909.5Q3387.0 -959 3231.0 -959Q3068.0 -959 2952.0 -911.5Q2836.0 -864 2774.0 -777.5Q2712.0 -691 2712.0 -572Q2712.0 -471 2771.0 -392.0Q2830.0 -313 2944.5 -268.0Q3059.0 -223 3224.0 -223Q3370.0 -223 3479.0 -270.0Q3588.0 -317 3649.0 -401.5Q3710.0 -486 3710.0 -600ZM3179.0 -823Q3243.0 -826 3283.0 -753.5Q3323.0 -681 3334.0 -553Q3344.0 -459 3320.5 -410.0Q3297.0 -361 3242.0 -359Q3203.0 -357 3170.5 -388.5Q3138.0 -420 3117.5 -482.5Q3097.0 -545 3089.0 -637Q3082.0 -694 3090.5 -734.5Q3099.0 -775 3121.5 -798.5Q3144.0 -822 3179.0 -823Z M4297.0 -878V-262Q4297.0 -214 4304.5 -196.0Q4312.0 -178 4326.0 -168L4343.0 -158Q4365.0 -144 4377.0 -125.0Q4389.0 -106 4389.0 -78Q4389.0 -42 4366.5 -21.0Q4344.0 0 4304.0 0H3915.0Q3876.0 0 3853.5 -21.0Q3831.0 -42 3831.0 -78Q3831.0 -106 3843.0 -125.0Q3855.0 -144 3877.0 -158L3894.0 -168Q3908.0 -178 3915.5 -196.0Q3923.0 -214 3923.0 -262V-609Q3923.0 -650 3913.0 -666.0Q3903.0 -682 3885.0 -691L3865.0 -697Q3843.0 -711 3831.0 -726.5Q3819.0 -742 3819.0 -767Q3819.0 -796 3836.0 -816.0Q3853.0 -836 3893.0 -852L4084.0 -926Q4132.0 -945 4162.0 -953.0Q4192.0 -961 4222.0 -961Q4258.0 -961 4277.5 -938.0Q4297.0 -915 4297.0 -878ZM4093.0 -1057Q3993.0 -1057 3934.0 -1106.5Q3875.0 -1156 3875.0 -1241Q3875.0 -1326 3934.0 -1375.0Q3993.0 -1424 4093.0 -1424Q4194.0 -1424 4252.5 -1375.0Q4311.0 -1326 4311.0 -1242Q4311.0 -1156 4252.5 -1106.5Q4194.0 -1057 4093.0 -1057Z M4922.0 -878V-262Q4922.0 -209 4928.0 -189.0Q4934.0 -169 4949.0 -159L4967.0 -148Q5003.0 -121 5003.0 -78Q5003.0 0 4927.0 0H4540.0Q4501.0 0 4478.0 -21.0Q4455.0 -42 4455.0 -78Q4455.0 -106 4467.0 -124.5Q4479.0 -143 4502.0 -158L4518.0 -168Q4533.0 -178 4540.0 -196.0Q4547.0 -214 4547.0 -262V-609Q4547.0 -650 4537.5 -666.0Q4528.0 -682 4510.0 -691L4490.0 -697Q4468.0 -711 4455.5 -726.5Q4443.0 -742 4443.0 -767Q4443.0 -796 4460.5 -816.0Q4478.0 -836 4517.0 -852L4709.0 -926Q4756.0 -945 4786.0 -953.0Q4816.0 -961 4847.0 -961Q4882.0 -961 4902.0 -938.0Q4922.0 -915 4922.0 -878ZM4888.0 -609 4819.0 -690 4864.0 -734Q4992.0 -861 5090.5 -911.5Q5189.0 -962 5274.0 -962Q5401.0 -962 5477.0 -878.5Q5553.0 -795 5553.0 -656V-262Q5553.0 -214 5560.0 -195.5Q5567.0 -177 5582.0 -168L5598.0 -158Q5621.0 -142 5633.0 -124.0Q5645.0 -106 5645.0 -78Q5645.0 -42 5622.5 -21.0Q5600.0 0 5560.0 0H5173.0Q5097.0 0 5097.0 -78Q5097.0 -121 5133.0 -148L5151.0 -159Q5167.0 -169 5173.0 -189.0Q5179.0 -209 5179.0 -262V-564Q5179.0 -629 5149.0 -663.5Q5119.0 -698 5065.0 -698Q5030.0 -698 4993.5 -685.0Q4957.0 -672 4922.0 -640Z M6390.0 -131Q6283.0 -143 6228.5 -151.5Q6174.0 -160 6154.5 -170.0Q6135.0 -180 6135.0 -196Q6135.0 -206 6143.5 -215.5Q6152.0 -225 6170.0 -235L6156.0 -253Q6022.0 -252 5944.5 -223.5Q5867.0 -195 5835.0 -151.0Q5803.0 -107 5803.0 -58Q5803.0 -6 5831.5 35.0Q5860.0 76 5939.5 105.5Q6019.0 135 6170.0 152Q6289.0 165 6354.5 177.0Q6420.0 189 6446.0 204.5Q6472.0 220 6472.0 245Q6472.0 267 6453.5 284.0Q6435.0 301 6386.0 310.0Q6337.0 319 6246.0 319Q6091.0 319 6037.5 290.0Q5984.0 261 5984.0 214Q5984.0 188 5998.0 164.5Q6012.0 141 6036.0 129L6015.0 106Q5838.0 112 5763.5 161.5Q5689.0 211 5689.0 297Q5689.0 358 5739.0 401.5Q5789.0 445 5895.0 467.5Q6001.0 490 6168.0 490Q6482.0 490 6639.0 396.5Q6796.0 303 6796.0 149Q6796.0 65 6755.5 8.5Q6715.0 -48 6625.5 -81.5Q6536.0 -115 6390.0 -131ZM6360.0 -861 6464.0 -846Q6490.0 -908 6512.5 -936.5Q6535.0 -965 6565.0 -965Q6588.0 -965 6603.5 -951.5Q6619.0 -938 6634.0 -921.0Q6649.0 -904 6671.5 -891.0Q6694.0 -878 6731.0 -878Q6789.0 -878 6822.0 -920.0Q6855.0 -962 6855.0 -1033Q6855.0 -1110 6809.5 -1150.5Q6764.0 -1191 6695.0 -1191Q6602.0 -1191 6524.0 -1131.0Q6446.0 -1071 6394.0 -944ZM6714.0 -600Q6714.0 -697 6659.5 -778.5Q6605.0 -860 6498.0 -909.5Q6391.0 -959 6235.0 -959Q6072.0 -959 5956.0 -911.5Q5840.0 -864 5778.0 -777.5Q5716.0 -691 5716.0 -572Q5716.0 -471 5775.0 -392.0Q5834.0 -313 5948.5 -268.0Q6063.0 -223 6228.0 -223Q6374.0 -223 6483.0 -270.0Q6592.0 -317 6653.0 -401.5Q6714.0 -486 6714.0 -600ZM6183.0 -823Q6247.0 -826 6287.0 -753.5Q6327.0 -681 6338.0 -553Q6348.0 -459 6324.5 -410.0Q6301.0 -361 6246.0 -359Q6207.0 -357 6174.5 -388.5Q6142.0 -420 6121.5 -482.5Q6101.0 -545 6093.0 -637Q6086.0 -694 6094.5 -734.5Q6103.0 -775 6125.5 -798.5Q6148.0 -822 6183.0 -823Z";
const RD_W2 = "M9.2 -87.9Q9.5 -124 29.1 -150.7Q48.7 -177.4 78.6 -191.2L113.2 -206.3Q130.1 -214.3 141.5 -226.6Q153 -239 164.3 -267Q175.7 -295.1 190.1 -348.2Q202.5 -393 218.2 -450.4Q233.8 -507.7 251.5 -571.8Q269.1 -636 287.5 -702.5Q306 -769 323 -832.6Q340.1 -896.3 355.3 -952.9Q370.6 -1009.5 381.8 -1053.4Q393 -1097.2 399.1 -1123.9Q406.5 -1154.1 400 -1171.4Q393.6 -1188.6 373 -1198.8L341.7 -1215Q316.8 -1229.3 302.3 -1247.6Q287.9 -1265.8 287.6 -1295.7Q287.9 -1342.6 316.2 -1371.3Q344.6 -1400 399 -1400H936.8Q1093.5 -1400 1217.4 -1351.4Q1341.2 -1302.8 1424.4 -1212.3Q1507.5 -1121.9 1541.7 -997.3Q1575.8 -872.6 1553.1 -720.3Q1528.6 -546.1 1451.8 -411.7Q1375.1 -277.3 1259.4 -185.8Q1143.8 -94.3 1001.3 -47.1Q858.8 0 702.7 0H103.3Q47.4 0 28.5 -25.3Q9.5 -50.6 9.2 -87.9ZM722.5 -191.3Q791.4 -191.3 854.8 -229.5Q918.1 -267.8 970.8 -340.1Q1023.5 -412.4 1062.3 -515.4Q1101.1 -618.4 1121.3 -747.2Q1143.8 -865.7 1137 -953Q1130.2 -1040.2 1102.5 -1097.3Q1074.9 -1154.3 1033.3 -1182.5Q991.6 -1210.7 943.5 -1210.7H915.4Q871.7 -1210.7 841.5 -1180.4Q811.3 -1150.1 787.7 -1073.9Q781.1 -1053.1 768.8 -1012.6Q756.5 -972 740.9 -917.9Q725.2 -863.7 707.3 -801.8Q689.5 -739.9 671.8 -675.3Q654.1 -610.7 638.1 -548.8Q622.1 -486.8 609.5 -433.1Q597 -379.4 590.3 -340.3Q576.3 -262.8 600.1 -227Q623.9 -191.3 678.7 -191.3Z M1604.5 -623.1Q1576.9 -623.7 1558.6 -650.8Q1540.4 -678 1560.4 -724Q1585 -783.7 1637.8 -835.1Q1690.7 -886.5 1764.9 -918.1Q1839 -949.8 1925.4 -949.8Q1994.8 -949.8 2032.4 -914Q2070 -878.2 2070 -819Q2070 -774.8 2054.7 -715.8Q2039.4 -656.7 2018.2 -592.8Q1996.9 -528.9 1979.5 -469.9Q1962.1 -410.8 1957.5 -365.1L1914.2 -377.4Q1949.3 -514.2 1996.8 -620.2Q2044.3 -726.2 2101.4 -798.7Q2158.6 -871.2 2223.6 -908.7Q2288.6 -946.1 2359.1 -946.1Q2445.8 -946.1 2496.1 -889.5Q2546.4 -833 2546.4 -735Q2546.4 -651.6 2511.6 -586.6Q2476.8 -521.7 2422.6 -484.6Q2368.4 -447.4 2310.7 -447.4Q2248.9 -447.4 2225.4 -475Q2202 -502.7 2202 -529.5Q2202 -557.2 2210.9 -583.7Q2219.9 -610.3 2219.9 -641.6Q2219.9 -658.9 2212.1 -668.5Q2204.2 -678.2 2189 -678.2Q2161.6 -678.2 2135.1 -656.5Q2108.6 -634.9 2083.7 -590.7Q2058.7 -546.5 2034.7 -478.5Q2009.1 -407.5 2000.7 -358.9Q1992.3 -310.3 1992.3 -265.3Q1992.3 -236.2 2001.4 -214.5Q2010.5 -192.9 2019.5 -174.2Q2028.5 -155.5 2028.5 -134.1Q2028.5 -87.1 1988 -51.8Q1947.5 -16.5 1874.7 3.3Q1801.9 23.2 1705.3 23.2Q1621.8 23.2 1585.9 -13.3Q1550 -49.8 1554.7 -115.7Q1559.5 -181.7 1598.6 -269L1711.1 -531.8Q1739.9 -597.8 1736.8 -629.8Q1733.7 -661.8 1701.7 -661.8Q1690.1 -661.8 1679.7 -657.7Q1669.4 -653.7 1655 -642.7Q1644.1 -633.9 1630.3 -628.2Q1616.6 -622.5 1604.5 -623.1Z M3442.7 -383Q3429 -332.3 3435.5 -305.4Q3441.9 -278.6 3466.7 -278.6Q3483.1 -278.6 3493.9 -285Q3504.7 -291.4 3520.3 -301.1Q3531.7 -308.4 3544 -309.7Q3556.3 -311 3565.9 -306.2Q3587.7 -299.5 3592.9 -270.6Q3598.2 -241.7 3578.9 -186.5Q3544.9 -89.9 3458.3 -32.8Q3371.7 24.4 3257.4 24.4Q3189.6 24.4 3151.6 -21.6Q3113.6 -67.6 3113.6 -148.2Q3113.6 -176.5 3115.2 -203.7Q3116.7 -230.8 3120.6 -259.7Q3124.5 -288.6 3130.8 -321.5Q3137.1 -354.3 3146.7 -393.2L3168.7 -288Q3112.4 -181.7 3048.2 -112.2Q2984 -42.7 2907.9 -9.2Q2831.9 24.4 2737.7 24.4Q2620.4 24.4 2553.7 -57.9Q2486.9 -140.1 2503.4 -309.8Q2511.4 -399.4 2545.8 -490.6Q2580.3 -581.9 2640.7 -664.7Q2701.1 -747.5 2787.1 -812.2Q2873.1 -876.9 2984.7 -914.6Q3096.3 -952.3 3232.9 -952.3Q3380 -952.3 3464.3 -932.9Q3548.6 -913.5 3581.9 -877.3Q3615.3 -841 3609.3 -790.6Q3604.3 -750.5 3584.3 -728.7Q3564.4 -706.9 3542.6 -686Q3520.8 -665 3509.7 -625.3ZM2874.4 -344.6Q2864.9 -275.8 2880.9 -247.2Q2896.9 -218.5 2922.9 -218.5Q2953.8 -218.5 2988.3 -244.6Q3022.9 -270.7 3057.3 -316.3Q3091.7 -361.9 3120.8 -419.5Q3150 -477.2 3169.8 -541Q3189.7 -604.7 3195.5 -667Q3199.9 -709 3184.5 -732.8Q3169.2 -756.7 3139.8 -756.7Q3106.6 -756.7 3072 -732.5Q3037.4 -708.3 3005.2 -666.6Q2973.1 -624.9 2946.1 -572.1Q2919.1 -519.3 2900.5 -460.6Q2881.9 -401.9 2874.4 -344.6Z M4808.2 -942Q4867.9 -941.6 4893.8 -862.7Q4919.7 -783.8 4888.3 -646Q4850.9 -479.1 4771.5 -353.4Q4692.1 -227.6 4582.9 -143.3Q4473.7 -59 4344 -16.7Q4214.3 25.6 4075.9 25.6Q3950.5 25.6 3883.8 -27.7Q3817.1 -81 3817.2 -169.7Q3817.3 -243.1 3850.6 -299.6Q3883.8 -356.1 3935.3 -401.1Q3986.9 -446.2 4043.7 -484.7Q4100.5 -523.3 4149.6 -559.9Q4198.6 -596.6 4225.2 -637.7L4218.1 -587Q4150.3 -587 4095 -601.9Q4039.8 -616.9 3994 -636.5Q3948.2 -656.1 3908.1 -671Q3868 -686 3829.8 -686Q3803.9 -686 3790.6 -674.8Q3777.2 -663.5 3777.2 -646.6Q3777.2 -614.8 3807 -592.1Q3829.3 -575.5 3841.3 -558.2Q3853.3 -540.9 3853.5 -505.6Q3853.8 -460.2 3826.2 -435.4Q3798.5 -410.7 3759.6 -410.7Q3697.8 -410.7 3658.5 -464.6Q3619.2 -518.6 3619.2 -616.4Q3619.2 -708.7 3658.7 -784Q3698.1 -859.2 3770.2 -903.9Q3842.3 -948.6 3939.9 -948.6Q3983.1 -948.6 4023 -932.9Q4062.9 -917.3 4097.6 -901.6Q4132.2 -885.9 4159.6 -885.9Q4191.5 -885.9 4223.5 -904.1Q4255.6 -922.3 4290.3 -937.7Q4324.9 -953 4363 -944.2Q4408.1 -934.2 4426.9 -894.4Q4445.8 -854.6 4420.9 -792.3Q4397.5 -732.8 4375.1 -676.6Q4352.6 -620.4 4333.4 -568.7Q4314.1 -517 4299.5 -469.8Q4284.8 -422.6 4276.4 -380.7Q4268 -338.7 4268 -303.1Q4268 -248.9 4291.7 -220.9Q4315.5 -192.8 4364.9 -192.8Q4414.3 -192.8 4474.3 -214.6Q4534.3 -236.3 4597.9 -289.5Q4661.5 -342.8 4720.9 -435.7Q4780.3 -528.7 4827.4 -670.8Q4792.7 -516.2 4783.7 -416.1Q4774.8 -315.9 4785.9 -259.6Q4797 -203.4 4823.9 -181Q4850.7 -158.5 4887.5 -158.5Q4921.6 -158.5 4952.1 -177.1Q4982.6 -195.7 5007 -229.4Q5031.3 -263.2 5047.6 -310.7Q5063.9 -358.2 5069.7 -415.7Q5074.5 -456.9 5072.6 -494.5Q5070.6 -532 5062 -563.2Q5053.4 -594.4 5038.8 -616Q5021.6 -642.8 5010.3 -676.3Q4999.1 -709.7 4999.1 -753.3Q4999.1 -803.1 5024.7 -846.7Q5050.4 -890.3 5096.9 -917.5Q5143.4 -944.8 5205.5 -944.8Q5314.7 -944.8 5362.9 -851.8Q5411 -758.8 5390.1 -599.4Q5375.7 -463.8 5324.9 -349.6Q5274.2 -235.5 5195.6 -151.2Q5117 -66.9 5018.4 -20.6Q4919.9 25.6 4810.3 25.6Q4697.7 25.6 4624.4 -16.1Q4551 -57.8 4515.3 -136.4Q4479.6 -214.9 4479.7 -326Q4479.7 -437.1 4514.4 -575.8Q4562.5 -771.5 4640.9 -856.9Q4719.3 -942.4 4808.2 -942Z";
function rdWordmark(cls){
  return '<span class="mm-word' + (cls ? ' ' + cls : '') + '" role="img" aria-label="Raging Draw"><svg viewBox="0 -1911 12592 2422" aria-hidden="true" focusable="false"><path class="w1" d="' + RD_W1 + '"/><path class="w2" transform="translate(7180 0)" d="' + RD_W2 + '"/></svg></span>';
}

/* ---------- Boîtes de dialogue (remplacent alert/confirm/prompt), comme dans Raging Page ---------- */
function rdDialog(opts){
  return new Promise(resolve => {
    const ico = opts.danger ? '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'
      : (opts.input != null ? '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>' : '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>');
    const bd = document.createElement('div');
    bd.className = 'mmd-backdrop';
    bd.innerHTML = '<div class="mmd' + (opts.danger ? ' danger' : '') + '" role="dialog" aria-modal="true">' +
      '<div class="mmd-head"><span class="mmd-ico"><svg viewBox="0 0 24 24">' + ico + '</svg></span>' +
      '<div class="mmd-text"><h3 class="mmd-title">' + esc(opts.title||'') + '</h3>' + (opts.msg ? '<p class="mmd-msg">' + esc(opts.msg) + '</p>' : '') +
      (opts.input != null ? '<input class="mmd-input" type="text" value="' + esc(opts.input) + '" spellcheck="false">' : '') + '</div></div>' +
      '<div class="mmd-actions">' + (opts.cancel === false ? '' : '<button class="btn btn-ghost mmd-cancel">' + esc(opts.cancelLabel || L('Annuler','Cancel')) + '</button>') +
      '<button class="btn btn-primary mmd-ok">' + esc(opts.okLabel || 'OK') + '</button></div></div>';
    document.body.appendChild(bd);
    const inp = bd.querySelector('.mmd-input');
    const done = v => { bd.remove(); document.removeEventListener('keydown', onKey, true); resolve(v); };
    const ok = () => done(inp ? inp.value : true);
    const cancel = () => done(inp ? null : false);
    const onKey = e => {
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); cancel(); }
      else if(e.key === 'Enter'){ e.preventDefault(); e.stopPropagation(); ok(); }
    };
    document.addEventListener('keydown', onKey, true);
    bd.querySelector('.mmd-ok').onclick = ok;
    const c = bd.querySelector('.mmd-cancel'); if(c) c.onclick = cancel;
    bd.addEventListener('mousedown', e => { if(e.target === bd) cancel(); });
    setTimeout(() => { if(inp){ inp.focus(); inp.select(); } else bd.querySelector('.mmd-ok').focus(); }, 20);
  });
}
function rdConfirm(title, msg, okLabel, danger){ return rdDialog({title, msg, okLabel, danger}); }
function rdPrompt(title, value, msg){ return rdDialog({title, msg, input: value || '', okLabel: L('Valider','OK')}); }
function rdAlert(title, msg){ return rdDialog({title, msg, cancel:false}); }

/* ---------- Toasts ---------- */
function toast(msg, kind){
  let host = document.getElementById('rdToasts');
  if(!host){ host = document.createElement('div'); host.id = 'rdToasts'; document.body.appendChild(host); }
  const t = document.createElement('div');
  t.className = 'rd-toast' + (kind ? ' ' + kind : '');
  t.innerHTML = '<i></i><span>' + esc(msg) + '</span>';
  host.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3000);
}

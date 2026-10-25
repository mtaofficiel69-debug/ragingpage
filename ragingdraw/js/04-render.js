/* =====================================================================
   RAGING DRAW — RENDU
   Un seul moteur pour l'écran, les vignettes et les exports : tout est
   vectoriel (textes, formes, décors, dessins à main levée), redessiné à
   la taille demandée. Une affiche exportée en 300 dpi est donc aussi
   nette que sa version écran, jamais agrandie.
===================================================================== */
const IMG = {};            // asset id -> HTMLImageElement
const PATHS = new Map();   // d -> Path2D
const RCACHE = new WeakMap(); // objet -> {key, canvas, scale}
const FONT_OK = new Set();
const HAS_LS = (() => { try{ return 'letterSpacing' in document.createElement('canvas').getContext('2d'); }catch(e){ return false; } })();
const HAS_FILTER = (() => { try{ const c = document.createElement('canvas').getContext('2d'); c.filter = 'blur(2px)'; return c.filter === 'blur(2px)'; }catch(e){ return false; } })();
let _measureCtx = null;
function mctx(){ if(!_measureCtx) _measureCtx = document.createElement('canvas').getContext('2d'); return _measureCtx; }

function touch(o){ o._v = (o._v || 0) + 1; }

function getImage(doc, id){
  if(!id) return null;
  const im = IMG[id];
  if(im) return im.complete && im.naturalWidth ? im : null;
  const src = doc && doc.assets && doc.assets[id];
  if(!src) return null;
  const img = new Image();
  img.onload = () => { if(typeof requestRender === 'function') requestRender(); };
  img.src = src;
  IMG[id] = img;
  return img.complete && img.naturalWidth ? img : null;
}
function preloadImages(doc){
  const ids = Object.keys(doc.assets || {});
  return Promise.all(ids.map(id => new Promise(res => {
    getImage(doc, id);
    const im = IMG[id];
    if(!im || (im.complete && im.naturalWidth)) return res();
    im.addEventListener('load', res, {once:true}); im.addEventListener('error', res, {once:true});
    if(im.decode) im.decode().then(res, res);
  })));
}
function getPath(d){
  let p = PATHS.get(d);
  if(!p){ p = new Path2D(d); PATHS.set(d, p); }
  return p;
}

/* ---------- Polices ---------- */
function fontStr(o, size){ return (o.italic ? 'italic ' : '') + (o.weight || 400) + ' ' + size + 'px "' + o.font + '", "Inter", sans-serif'; }
function fontKey(o){ return o.font + '|' + (o.weight||400) + '|' + (o.italic?1:0); }
function ensureFont(o){
  const k = fontKey(o);
  if(FONT_OK.has(k)) return true;
  if(!document.fonts || !document.fonts.load){ FONT_OK.add(k); return true; }
  const f = fontStr(o, 40);
  if(document.fonts.check(f)){ FONT_OK.add(k); return true; }
  if(!ensureFont._pending) ensureFont._pending = new Set();
  if(!ensureFont._pending.has(k)){
    ensureFont._pending.add(k);
    document.fonts.load(f, 'AaÉé').then(() => { FONT_OK.add(k); if(typeof requestRender === 'function') requestRender(true); })
      .catch(() => { FONT_OK.add(k); });
  }
  return false;
}
function loadDocFonts(doc){
  if(!document.fonts || !document.fonts.load) return Promise.resolve();
  const texts = doc.objects.filter(o => o.type === 'text');
  return Promise.all(texts.map(o => document.fonts.load(fontStr(o, 40), o.text.slice(0, 40) || 'A').catch(() => null)))
    .then(() => { texts.forEach(o => FONT_OK.add(fontKey(o))); });
}

/* ---------- Peintures (uni, dégradés) ---------- */
function makePaint(ctx, p, x, y, w, h){
  if(!p || p.type === 'solid' || !p.stops || p.stops.length < 1) return (p && p.color) || '#000000';
  let g;
  if(p.type === 'radial'){
    const cx = x + w*(p.cx==null?.5:p.cx), cy = y + h*(p.cy==null?.5:p.cy);
    const r = Math.max(1, Math.hypot(Math.max(cx-x, x+w-cx), Math.max(cy-y, y+h-cy)));
    g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  }else{
    const a = ((p.angle||0) - 90) * Math.PI/180;
    const cx = x + w/2, cy = y + h/2;
    const half = (Math.abs(Math.cos(a))*w + Math.abs(Math.sin(a))*h)/2;
    g = ctx.createLinearGradient(cx - Math.cos(a)*half, cy - Math.sin(a)*half, cx + Math.cos(a)*half, cy + Math.sin(a)*half);
  }
  p.stops.slice().sort((a, b) => a.o - b.o).forEach(s => { try{ g.addColorStop(clamp(s.o,0,1), s.c); }catch(e){} });
  return g;
}
function paintPreviewCss(p){
  if(!p || p.type === 'solid') return (p && p.color) || '#000';
  const st = p.stops.slice().sort((a, b) => a.o - b.o).map(s => s.c + ' ' + Math.round(s.o*100) + '%').join(', ');
  return p.type === 'radial' ? 'radial-gradient(circle at ' + Math.round((p.cx==null?.5:p.cx)*100) + '% ' + Math.round((p.cy==null?.5:p.cy)*100) + '%, ' + st + ')' : 'linear-gradient(' + (p.angle||0) + 'deg, ' + st + ')';
}

/* ---------- Mise en page des textes ---------- */
function layoutText(o){
  const ctx = mctx();
  ensureFont(o);
  const str = o.upper ? (o.text||'').toUpperCase() : (o.text||'');
  ctx.font = fontStr(o, o.size);
  const ls = (o.letterSpacing||0)/1000 * o.size;
  if(HAS_LS) ctx.letterSpacing = ls + 'px';
  const meas = s => {
    if(!s) return 0;
    if(HAS_LS) return ctx.measureText(s).width;
    return ctx.measureText(s).width + ls*s.length;
  };
  const maxW = Math.max(1, o.w);
  const lines = [];
  str.split('\n').forEach(par => {
    const words = par.split(' ');
    let cur = '';
    words.forEach((wd, i) => {
      const cand = i === 0 ? wd : cur + ' ' + wd;
      if(i > 0 && meas(cand) > maxW + 0.01){
        lines.push(cur); cur = wd;
      }else cur = cand;
      // mot plus large que la boîte : on le coupe lettre par lettre
      while(meas(cur) > maxW + 0.01 && cur.length > 1){
        let k = cur.length - 1;
        while(k > 1 && meas(cur.slice(0, k)) > maxW) k--;
        lines.push(cur.slice(0, k)); cur = cur.slice(k);
      }
    });
    lines.push(cur);
  });
  const m = ctx.measureText('HgÉ');
  const asc = m.fontBoundingBoxAscent != null ? m.fontBoundingBoxAscent : o.size*.8;
  const desc = m.fontBoundingBoxDescent != null ? m.fontBoundingBoxDescent : o.size*.2;
  const lineH = o.size * (o.lineHeight || 1);
  const out = lines.map(t => ({t, w:meas(t)}));
  const h = Math.max(lineH * out.length, o.size*.5);
  if(HAS_LS) ctx.letterSpacing = '0px';
  return {lines:out, lineH, ls, asc, desc, h};
}
function fitTextHeight(o){
  const lay = layoutText(o);
  if(Math.abs(lay.h - o.h) > 0.01){ o.h = lay.h; }
  return lay;
}

/* ---------- Dessin des objets ---------- */
function shapePath(ctx, o){
  const w = o.w, h = o.h;
  ctx.beginPath();
  switch(o.shape){
    case 'ellipse': ctx.ellipse(0, 0, Math.abs(w/2), Math.abs(h/2), 0, 0, Math.PI*2); break;
    case 'triangle': ctx.moveTo(0, -h/2); ctx.lineTo(w/2, h/2); ctx.lineTo(-w/2, h/2); ctx.closePath(); break;
    case 'star': {
      const n = Math.max(3, o.points|0), inner = clamp(o.inner, .05, 1);
      for(let i = 0; i < n*2; i++){
        const r = i%2 ? inner : 1, a = -Math.PI/2 + i*Math.PI/n;
        const x = Math.cos(a)*r*w/2, y = Math.sin(a)*r*h/2;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); break;
    }
    case 'polygon': {
      const n = Math.max(3, o.sides|0);
      for(let i = 0; i < n; i++){
        const a = -Math.PI/2 + i*2*Math.PI/n;
        const x = Math.cos(a)*w/2, y = Math.sin(a)*h/2;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); break;
    }
    case 'line': {
      if(o.arrow){
        const ah = Math.min(w*.45, h*3.2), aw = h*3;
        ctx.moveTo(-w/2, -h/2); ctx.lineTo(w/2 - ah, -h/2); ctx.lineTo(w/2 - ah, -aw/2); ctx.lineTo(w/2, 0);
        ctx.lineTo(w/2 - ah, aw/2); ctx.lineTo(w/2 - ah, h/2); ctx.lineTo(-w/2, h/2); ctx.closePath();
      }else ctx.rect(-w/2, -h/2, w, h);
      break;
    }
    default: {
      const r = clamp(o.radius||0, 0, Math.min(Math.abs(w), Math.abs(h))/2);
      if(r > 0 && ctx.roundRect) ctx.roundRect(-w/2, -h/2, w, h, r);
      else ctx.rect(-w/2, -h/2, w, h);
    }
  }
}
function applyShadow(ctx, sh, scale){
  if(!sh || !sh.on){ ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; return; }
  ctx.shadowColor = sh.color; ctx.shadowBlur = Math.max(0, sh.blur*scale);
  ctx.shadowOffsetX = (sh.x||0)*scale; ctx.shadowOffsetY = (sh.y||0)*scale;
}
function noShadow(ctx){ ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }

function drawText(ctx, o, scale, withShadow){
  const lay = fitTextHeight(o);
  const w = o.w, h = o.h;
  ctx.font = fontStr(o, o.size);
  ctx.textBaseline = 'alphabetic';
  if(HAS_LS) ctx.letterSpacing = lay.ls + 'px';
  const fill = makePaint(ctx, o.fill, -w/2, -h/2, w, h);
  const top = -h/2;
  const each = fn => lay.lines.forEach((ln, i) => {
    const by = top + i*lay.lineH + lay.lineH/2 + (lay.asc - lay.desc)/2;
    let x;
    if(o.align === 'left') x = -w/2; else if(o.align === 'right') x = w/2 - ln.w; else x = -ln.w/2;
    fn(ln.t, x, by);
  });
  const put = (mode, t, x, y) => {
    ctx.textAlign = 'left';
    if(HAS_LS || !lay.ls){ mode === 's' ? ctx.strokeText(t, x, y) : ctx.fillText(t, x, y); return; }
    let cx = x;
    for(const ch of t){ mode === 's' ? ctx.strokeText(ch, cx, y) : ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + lay.ls; }
  };
  const hasStroke = o.stroke && o.stroke.on && o.stroke.width > 0;
  // halo lumineux (néon)
  if(o.glow && o.glow.on){
    ctx.save();
    ctx.shadowColor = o.glow.color; ctx.shadowBlur = o.glow.blur*scale; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = o.glow.color;
    each((t, x, y) => put('f', t, x, y));
    ctx.shadowBlur = o.glow.blur*scale*.4;
    each((t, x, y) => put('f', t, x, y));
    ctx.restore();
  }
  if(withShadow) applyShadow(ctx, o.shadow, scale); else noShadow(ctx);
  if(hasStroke){
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.strokeStyle = o.stroke.color; ctx.lineWidth = o.stroke.width*2;
    each((t, x, y) => put('s', t, x, y));
    noShadow(ctx);
  }
  ctx.fillStyle = fill;
  each((t, x, y) => put('f', t, x, y));
  if(HAS_LS) ctx.letterSpacing = '0px';
}

function drawShape(ctx, o, scale, withShadow){
  shapePath(ctx, o);
  if(withShadow) applyShadow(ctx, o.shadow, scale);
  const fillOn = o.fill && !(o.fill.type === 'solid' && colorAlpha(o.fill.color) === 0);
  if(fillOn){ ctx.fillStyle = makePaint(ctx, o.fill, -o.w/2, -o.h/2, o.w, o.h); ctx.fill(); noShadow(ctx); }
  if(o.stroke && o.stroke.on && o.stroke.width > 0){
    ctx.strokeStyle = o.stroke.color; ctx.lineWidth = o.stroke.width; ctx.lineJoin = 'round';
    ctx.stroke();
  }
  noShadow(ctx);
}
function drawPathObj(ctx, o, scale, withShadow){
  const p = getPath(o.d);
  const sx = o.w/o.vw, sy = o.h/o.vh;
  ctx.save();
  ctx.translate(-o.w/2, -o.h/2);
  ctx.scale(sx, sy);
  if(withShadow) applyShadow(ctx, o.shadow, scale);
  ctx.fillStyle = makePaint(ctx, o.fill, 0, 0, o.vw, o.vh);
  ctx.fill(p, o.rule || 'nonzero');
  noShadow(ctx);
  if(o.stroke && o.stroke.on && o.stroke.width > 0){
    ctx.strokeStyle = o.stroke.color; ctx.lineWidth = o.stroke.width / Math.sqrt(Math.abs(sx*sy)) ; ctx.lineJoin = 'round';
    ctx.stroke(p);
  }
  ctx.restore();
}
function imageFilterStr(f, scale){
  if(!f) return 'none';
  const parts = [];
  if(f.brightness !== 100) parts.push('brightness(' + f.brightness + '%)');
  if(f.contrast !== 100) parts.push('contrast(' + f.contrast + '%)');
  if(f.saturate !== 100) parts.push('saturate(' + f.saturate + '%)');
  if(f.hue) parts.push('hue-rotate(' + f.hue + 'deg)');
  if(f.grayscale) parts.push('grayscale(' + f.grayscale + '%)');
  if(f.sepia) parts.push('sepia(' + f.sepia + '%)');
  if(f.invert) parts.push('invert(' + f.invert + '%)');
  if(f.blur) parts.push('blur(' + round(f.blur*scale, 2) + 'px)');
  return parts.length ? parts.join(' ') : 'none';
}
function imageClip(ctx, o){
  const w = o.w, h = o.h;
  ctx.beginPath();
  if(o.ellipse) ctx.ellipse(0, 0, Math.abs(w/2), Math.abs(h/2), 0, 0, Math.PI*2);
  else if(o.radius > 0 && ctx.roundRect) ctx.roundRect(-w/2, -h/2, w, h, Math.min(o.radius, Math.min(Math.abs(w), Math.abs(h))/2));
  else ctx.rect(-w/2, -h/2, w, h);
}
function drawImageObj(ctx, o, scale, withShadow, opts, doc){
  const img = getImage(doc, o.asset);
  const w = o.w, h = o.h;
  if(!img){
    if(opts && opts.screen) drawPlaceholder(ctx, o, scale, doc);
    return;
  }
  const iw = img.naturalWidth, ih = img.naturalHeight, c = o.crop || {l:0,t:0,r:0,b:0};
  const sx = iw*c.l, sy = ih*c.t, sw = Math.max(1, iw*(1-c.l-c.r)), sh = Math.max(1, ih*(1-c.t-c.b));
  const clipped = o.ellipse || o.radius > 0;
  if(withShadow && o.shadow && o.shadow.on){
    // l'ombre suit la forme de l'image (rectangle, arrondi ou ellipse)
    ctx.save(); applyShadow(ctx, o.shadow, scale); imageClip(ctx, o); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
  }
  ctx.save();
  if(clipped){ imageClip(ctx, o); ctx.clip(); }
  if(HAS_FILTER) ctx.filter = imageFilterStr(o.filters, scale);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, -w/2, -h/2, w, h);
  ctx.filter = 'none';
  ctx.restore();
  if(o.stroke && o.stroke.on && o.stroke.width > 0){
    imageClip(ctx, o); ctx.strokeStyle = o.stroke.color; ctx.lineWidth = o.stroke.width; ctx.stroke();
  }
}
function drawPlaceholder(ctx, o, scale, doc){
  const w = o.w, h = o.h;
  ctx.save();
  imageClip(ctx, o); ctx.clip();
  ctx.fillStyle = '#2F2E44b3'; ctx.fillRect(-w/2, -h/2, w, h);
  ctx.strokeStyle = '#ffffff0d'; ctx.lineWidth = 1.5/scale;
  const step = 22/scale;
  ctx.beginPath();
  for(let x = -w/2 - h; x < w/2 + h; x += step){ ctx.moveTo(x, -h/2); ctx.lineTo(x + h, h/2); }
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.setLineDash([8/scale, 6/scale]); ctx.strokeStyle = '#F0646B'; ctx.lineWidth = 1.5/scale;
  imageClip(ctx, o); ctx.stroke(); ctx.setLineDash([]);
  const fs = clamp(Math.min(w, h)*.06, 11/scale, 22/scale);
  ctx.fillStyle = '#EDEEF5'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '600 ' + fs + 'px Inter, sans-serif';
  ctx.fillText(L('Glisse une image ici','Drop an image here'), 0, fs*.9);
  ctx.font = '400 ' + fs*.8 + 'px Inter, sans-serif'; ctx.fillStyle = '#9A99B0';
  ctx.fillText(L('ou double-clique pour en choisir une','or double-click to choose one'), 0, fs*2.2);
  // petite icône image
  const s = fs*1.6;
  ctx.strokeStyle = '#F0646B'; ctx.lineWidth = fs*.12; ctx.lineJoin = 'round';
  ctx.strokeRect(-s/2, -s*1.15, s, s*.8);
  ctx.beginPath(); ctx.moveTo(-s/2 + s*.05, -s*.42); ctx.lineTo(-s*.15, -s*.75); ctx.lineTo(s*.05, -s*.55); ctx.lineTo(s*.2, -s*.68); ctx.lineTo(s/2 - s*.05, -s*.42); ctx.stroke();
  ctx.restore();
}

/* ---------- Traits de dessin à main levée ---------- */
function strokePolyline(ctx, pts){
  const n = pts.length/3;
  ctx.beginPath();
  if(n === 1){ ctx.moveTo(pts[0], pts[1]); ctx.lineTo(pts[0] + 0.01, pts[1]); return; }
  ctx.moveTo(pts[0], pts[1]);
  for(let i = 1; i < n - 1; i++){
    const x = pts[i*3], y = pts[i*3+1], nx = pts[(i+1)*3], ny = pts[(i+1)*3+1];
    ctx.quadraticCurveTo(x, y, (x+nx)/2, (y+ny)/2);
  }
  ctx.lineTo(pts[(n-1)*3], pts[(n-1)*3+1]);
}
function hasPressure(pts){
  for(let i = 2; i < pts.length; i += 3) if(Math.abs(pts[i] - 0.5) > 0.02) return true;
  return false;
}
function variableOutline(ctx, pts, size){
  const n = pts.length/3, L1 = [], R1 = [];
  for(let i = 0; i < n; i++){
    const x = pts[i*3], y = pts[i*3+1], p = pts[i*3+2];
    const a = i > 0 ? i-1 : i, b = i < n-1 ? i+1 : i;
    let dx = pts[b*3] - pts[a*3], dy = pts[b*3+1] - pts[a*3+1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const r = Math.max(0.3, size*(0.15 + p*0.85)/2);
    L1.push([x - dy*r, y + dx*r]); R1.push([x + dy*r, y - dx*r]);
  }
  ctx.beginPath();
  ctx.moveTo(L1[0][0], L1[0][1]);
  for(let i = 1; i < n; i++) ctx.lineTo(L1[i][0], L1[i][1]);
  for(let i = n-1; i >= 0; i--) ctx.lineTo(R1[i][0], R1[i][1]);
  ctx.closePath();
  // bouts arrondis
  for(const i of [0, n-1]){
    const r = Math.max(0.3, size*(0.15 + pts[i*3+2]*0.85)/2);
    ctx.moveTo(pts[i*3] + r, pts[i*3+1]); ctx.arc(pts[i*3], pts[i*3+1], r, 0, Math.PI*2);
  }
}
function drawStroke(ctx, s, scale){
  const pts = s.pts; if(!pts || pts.length < 3) return;
  ctx.save();
  ctx.globalAlpha = s.opacity == null ? 1 : s.opacity;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if(s.tool === 'erase'){
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000'; ctx.fillStyle = '#000';
    if(hasPressure(pts)){ variableOutline(ctx, pts, s.size); ctx.fill('nonzero'); }
    else{ ctx.lineWidth = s.size; strokePolyline(ctx, pts); ctx.stroke(); }
  }else if(s.tool === 'marker'){
    // feutre biseauté : un ruban à angle fixe, comme une plume de calligraphie
    const a = -Math.PI/4, vx = Math.cos(a)*s.size/2, vy = Math.sin(a)*s.size/2, n = pts.length/3;
    ctx.fillStyle = s.color; ctx.beginPath();
    const quad = (x1, y1, x2, y2) => {
      const P = [[x1-vx, y1-vy], [x2-vx, y2-vy], [x2+vx, y2+vy], [x1+vx, y1+vy]];
      let area = 0; for(let k = 0; k < 4; k++){ const q = P[k], r = P[(k+1)%4]; area += q[0]*r[1] - r[0]*q[1]; }
      if(area < 0) P.reverse();
      ctx.moveTo(P[0][0], P[0][1]); for(let k = 1; k < 4; k++) ctx.lineTo(P[k][0], P[k][1]); ctx.closePath();
    };
    if(n === 1) quad(pts[0], pts[1], pts[0] + 0.01, pts[1] + 0.01);
    for(let i = 0; i < n-1; i++) quad(pts[i*3], pts[i*3+1], pts[(i+1)*3], pts[(i+1)*3+1]);
    ctx.fill('nonzero');
  }else if(s.tool === 'spray'){
    const r = _rng(s.seed || 1), n = pts.length/3, R = s.size/2;
    const dot = Math.max(0.5, s.size/45);
    ctx.fillStyle = s.color; ctx.beginPath();
    for(let i = 0; i < n; i++){
      const cnt = Math.min(60, 6 + s.size/2.5);
      for(let k = 0; k < cnt; k++){
        const a = r()*Math.PI*2, d = Math.sqrt(r())*R*(0.3 + 0.7*r());
        const x = pts[i*3] + Math.cos(a)*d, y = pts[i*3+1] + Math.sin(a)*d;
        ctx.moveTo(x + dot, y); ctx.arc(x, y, dot, 0, Math.PI*2);
      }
    }
    ctx.fill();
  }else if(s.tool === 'neon'){
    ctx.strokeStyle = s.color; ctx.lineWidth = s.size;
    ctx.shadowColor = s.color; ctx.shadowBlur = s.size*1.6*scale;
    strokePolyline(ctx, pts); ctx.stroke(); ctx.stroke();
    noShadow(ctx);
    ctx.strokeStyle = '#FFFFFFee'; ctx.lineWidth = Math.max(0.6, s.size*.32);
    strokePolyline(ctx, pts); ctx.stroke();
  }else{
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color;
    if(hasPressure(pts)){ variableOutline(ctx, pts, s.size); ctx.fill('nonzero'); }
    else{ ctx.lineWidth = s.size; strokePolyline(ctx, pts); ctx.stroke(); }
  }
  ctx.restore();
}

/* ---------- Rendu en image intermédiaire (dessins, gomme, fondus, teinte) ---------- */
function needsRaster(o){
  if(o.type === 'draw') return true;
  if(o.mask && o.mask.strokes && o.mask.strokes.length) return true;
  if(o.type === 'image' && o.asset && ((o.tint && o.tint.on) || (o.fade && (o.fade.top || o.fade.bottom || o.fade.left || o.fade.right)))) return true;
  return false;
}
function strokesMargin(o){
  if(o.type !== 'draw') return 0;
  let m = 0; o.strokes.forEach(s => { if(s.tool === 'neon') m = Math.max(m, s.size*2.2); });
  return m;
}
const RASTER_MAX_SIDE = 8192, RASTER_MAX_AREA = 48e6;
function rasterize(o, scale, doc, opts){
  const marg = strokesMargin(o);
  const bw = Math.abs(o.w) + marg*2, bh = Math.abs(o.h) + marg*2;
  let s = scale;
  if(bw*s > RASTER_MAX_SIDE) s = RASTER_MAX_SIDE/bw;
  if(bh*s > RASTER_MAX_SIDE) s = Math.min(s, RASTER_MAX_SIDE/bh);
  if(bw*bh*s*s > RASTER_MAX_AREA) s = Math.sqrt(RASTER_MAX_AREA/(bw*bh));
  const key = (o._v||0) + '@' + s.toFixed(5) + (opts && opts.screen ? 's' : 'e') + (o.asset && getImage(doc, o.asset) ? 'i' : '');
  const c0 = RCACHE.get(o);
  if(c0 && c0.key === key) return c0;
  const cw = Math.max(1, Math.ceil(bw*s)), ch = Math.max(1, Math.ceil(bh*s));
  const cv = (c0 && c0.canvas) || document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const c = cv.getContext('2d');
  c.setTransform(s, 0, 0, s, cw/2, ch/2);
  c.clearRect(-cw, -ch, cw*2, ch*2);
  if(o.type === 'draw'){
    c.save(); c.scale(o.w/o.bw, o.h/o.bh); c.translate(-o.bw/2, -o.bh/2);
    o.strokes.forEach(st => drawStroke(c, st, s));
    c.restore();
  }else{
    drawContent(c, o, s, false, opts, doc);
    if(o.type === 'image' && o.asset && getImage(doc, o.asset)){
      if(o.tint && o.tint.on){
        // teinte en mode « couleur », puis on remet exactement l'alpha d'origine de l'image
        const keep = document.createElement('canvas'); keep.width = cw; keep.height = ch;
        keep.getContext('2d').drawImage(cv, 0, 0);
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalCompositeOperation = 'color'; c.globalAlpha = clamp(o.tint.amount/100, 0, 1);
        c.fillStyle = o.tint.color; c.fillRect(0, 0, cw, ch);
        c.globalAlpha = 1; c.globalCompositeOperation = 'destination-in'; c.drawImage(keep, 0, 0);
        c.restore();
      }
      const f = o.fade || {};
      const edge = (k, x0, y0, x1, y1, rx, ry, rw, rh) => {
        if(!k) return;
        const g = c.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = g; c.fillRect(rx, ry, rw, rh); c.restore();
      };
      const W2 = o.w/2, H2 = o.h/2;
      edge(f.top, 0, -H2, 0, -H2 + o.h*f.top/100, -W2-1, -H2-1, o.w+2, o.h*f.top/100+1);
      edge(f.bottom, 0, H2, 0, H2 - o.h*f.bottom/100, -W2-1, H2 - o.h*f.bottom/100, o.w+2, o.h*f.bottom/100+1);
      edge(f.left, -W2, 0, -W2 + o.w*f.left/100, 0, -W2-1, -H2-1, o.w*f.left/100+1, o.h+2);
      edge(f.right, W2, 0, W2 - o.w*f.right/100, 0, W2 - o.w*f.right/100, -H2-1, o.w*f.right/100+1, o.h+2);
    }
  }
  if(o.mask && o.mask.strokes && o.mask.strokes.length){
    c.save(); c.scale(o.w/o.mask.bw, o.h/o.mask.bh); c.translate(-o.mask.bw/2, -o.mask.bh/2);
    o.mask.strokes.forEach(st => drawStroke(c, Object.assign({}, st, {tool:'erase'}), s));
    c.restore();
  }
  const out = {key, canvas:cv, s, bw, bh};
  RCACHE.set(o, out);
  return out;
}
function drawContent(ctx, o, scale, withShadow, opts, doc){
  if(o.type === 'text') drawText(ctx, o, scale, withShadow);
  else if(o.type === 'shape') drawShape(ctx, o, scale, withShadow);
  else if(o.type === 'path') drawPathObj(ctx, o, scale, withShadow);
  else if(o.type === 'image') drawImageObj(ctx, o, scale, withShadow, opts, doc);
}
function objTransform(ctx, o){
  ctx.translate(o.x, o.y);
  if(o.rot) ctx.rotate(o.rot*Math.PI/180);
  if(o.flipX || o.flipY) ctx.scale(o.flipX ? -1 : 1, o.flipY ? -1 : 1);
}
function drawObject(ctx, o, scale, opts, doc){
  if(!o.visible) return;
  if(o.type === 'text' && opts && opts.editingId === o.id) return;
  ctx.save();
  ctx.globalAlpha = clamp(o.opacity == null ? 1 : o.opacity, 0, 1);
  ctx.globalCompositeOperation = o.blend || 'source-over';
  objTransform(ctx, o);
  if(needsRaster(o) && !(o.type === 'image' && !getImage(doc, o.asset))){
    if(o.type === 'draw' && !o.strokes.length){ ctx.restore(); return; }
    const r = rasterize(o, scale, doc, opts);
    if(o.shadow && o.shadow.on) applyShadow(ctx, o.shadow, scale);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(r.canvas, -r.bw/2, -r.bh/2, r.bw, r.bh);
  }else{
    drawContent(ctx, o, scale, true, opts, doc);
  }
  ctx.restore();
}

/* ---------- Grain et vignettage ---------- */
let _grain = null;
function grainTile(){
  if(_grain) return _grain;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), id = g.createImageData(256, 256), r = _rng(1234567);
  for(let i = 0; i < id.data.length; i += 4){
    const v = Math.floor(r()*255);
    id.data[i] = id.data[i+1] = id.data[i+2] = v; id.data[i+3] = 255;
  }
  g.putImageData(id, 0, 0);
  _grain = c; return c;
}
function drawFx(ctx, doc, scale){
  const W = doc.w, H = doc.h, fx = doc.fx || {};
  if(fx.vignette > 0){
    const g = ctx.createRadialGradient(W/2, H/2, Math.min(W, H)*.25, W/2, H/2, Math.hypot(W, H)/2);
    g.addColorStop(0, withAlpha(fx.vignetteColor || '#000000', 0));
    g.addColorStop(1, withAlpha(fx.vignetteColor || '#000000', clamp(fx.vignette/100, 0, 1)*.92));
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if(fx.grain > 0){
    const pat = ctx.createPattern(grainTile(), 'repeat');
    const k = Math.max(W, H)/1400;     // le grain garde la même taille relative à toutes les résolutions
    if(pat.setTransform) pat.setTransform(new DOMMatrix().scale(k, k));
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = clamp(fx.grain/100, 0, 1)*.55;
    ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
}
/* Dessine toute l'affiche. Le contexte doit déjà porter la transformation
   (unités de l'affiche -> pixels) ; scale = pixels par unité. */
function renderDoc(ctx, doc, scale, opts){
  opts = opts || {};
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, doc.w, doc.h); ctx.clip();
  if(!opts.transparent){
    ctx.fillStyle = makePaint(ctx, doc.bg, 0, 0, doc.w, doc.h);
    ctx.fillRect(0, 0, doc.w, doc.h);
  }
  doc.objects.forEach(o => drawObject(ctx, o, scale, opts, doc));
  drawFx(ctx, doc, scale);
  ctx.restore();
}
function renderThumb(doc, maxW, maxH){
  const k = Math.min(maxW/doc.w, maxH/doc.h);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(doc.w*k)); c.height = Math.max(1, Math.round(doc.h*k));
  const ctx = c.getContext('2d');
  ctx.setTransform(k, 0, 0, k, 0, 0);
  renderDoc(ctx, doc, k, {});
  return c;
}

/* ---------- Géométrie : repères locaux, boîtes, tests de clic ---------- */
function toLocal(o, px, py){
  const a = -(o.rot||0)*Math.PI/180, dx = px - o.x, dy = py - o.y;
  let lx = dx*Math.cos(a) - dy*Math.sin(a), ly = dx*Math.sin(a) + dy*Math.cos(a);
  if(o.flipX) lx = -lx; if(o.flipY) ly = -ly;
  return {x:lx, y:ly};
}
function toWorld(o, lx, ly){
  if(o.flipX) lx = -lx; if(o.flipY) ly = -ly;
  const a = (o.rot||0)*Math.PI/180;
  return {x:o.x + lx*Math.cos(a) - ly*Math.sin(a), y:o.y + lx*Math.sin(a) + ly*Math.cos(a)};
}
function corners(o){
  const w = o.w/2, h = o.h/2;
  return [toWorld(o, -w, -h), toWorld(o, w, -h), toWorld(o, w, h), toWorld(o, -w, h)];
}
function aabb(o){
  const c = corners(o);
  const xs = c.map(p => p.x), ys = c.map(p => p.y);
  return {x1:Math.min(...xs), y1:Math.min(...ys), x2:Math.max(...xs), y2:Math.max(...ys)};
}
function unionBox(list){
  if(!list.length) return null;
  const b = list.map(aabb);
  return {x1:Math.min(...b.map(q => q.x1)), y1:Math.min(...b.map(q => q.y1)), x2:Math.max(...b.map(q => q.x2)), y2:Math.max(...b.map(q => q.y2))};
}
function hitObject(o, px, py, tol, doc){
  if(!o.visible) return false;
  const p = toLocal(o, px, py), w = Math.abs(o.w)/2, h = Math.abs(o.h)/2;
  if(Math.abs(p.x) > w + tol || Math.abs(p.y) > h + tol) return false;
  if(o.type === 'shape' && o.shape === 'ellipse'){
    const rx = w + tol, ry = h + tol;
    return (p.x*p.x)/(rx*rx) + (p.y*p.y)/(ry*ry) <= 1;
  }
  if(o.type === 'image' && o.ellipse){
    const rx = w + tol, ry = h + tol;
    return (p.x*p.x)/(rx*rx) + (p.y*p.y)/(ry*ry) <= 1;
  }
  if(o.type === 'path'){
    const c = mctx(), path = getPath(o.d);
    const X = (p.x + o.w/2)*o.vw/o.w, Y = (p.y + o.h/2)*o.vh/o.h;
    c.setTransform(1, 0, 0, 1, 0, 0);
    if(c.isPointInPath(path, X, Y, o.rule || 'nonzero')) return true;
    c.lineWidth = tol*2*o.vw/Math.max(1, o.w) + 4;
    return c.isPointInStroke(path, X, Y);
  }
  if(o.type === 'draw'){
    const r = RCACHE.get(o);
    if(!r) return true;
    const ix = Math.floor((p.x + r.bw/2)*r.s), iy = Math.floor((p.y + r.bh/2)*r.s), rad = Math.max(2, Math.ceil(tol*r.s));
    try{
      const d = r.canvas.getContext('2d').getImageData(Math.max(0, ix - rad), Math.max(0, iy - rad), rad*2 + 1, rad*2 + 1).data;
      for(let i = 3; i < d.length; i += 4) if(d[i] > 12) return true;
      return false;
    }catch(e){ return true; }
  }
  return true;
}

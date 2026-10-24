/* =====================================================================
   IMAGES SUR LES PAGES DU SCÉNARIO — autant qu'on veut
   ---------------------------------------------------------------------
   Des images posées PAR-DESSUS les feuilles, sur un calque à part : le
   texte n'en sait rien. Aucune ligne ne bouge, la pagination ne change
   pas d'un pixel, avec ou sans images.

   Modèle : S.project.pageImages = [{ id, page, x, y, w, h, cl, ct, cr, cb,
   src, ar, back, op }]
     · page        : indice de la feuille (0 = première page du scénario,
                     page de titre non comprise) ;
     · x, y, w, h  : cadre visible, en % de la largeur / hauteur de la page
                     (donc identique à l'écran, à l'impression et au PDF) ;
     · cl, ct, cr, cb : recadrage, part de l'image d'origine coupée à
                     gauche / en haut / à droite / en bas (0 à 1) ;
     · ar          : proportions de l'image d'origine (hauteur / largeur) ;
     · back        : derrière le texte (sinon devant) ;
     · op          : opacité (0,1 à 1).
   L'ordre du tableau est l'ordre d'empilement (la dernière est dessus).
   Une image dont la page n'existe plus (texte supprimé) se pose sur la
   dernière page : elle n'est jamais perdue.

   Hors du mode Images, le calque ne capte aucun clic : l'écriture reste
   exactement comme avant. Le mode Images (menu ⋮ › Écriture › Images sur
   les pages…) rend les images sélectionnables : glisser pour déplacer (y
   compris vers une autre page), poignées pour agrandir / réduire, Rogner
   pour recadrer, et la barre en haut pour le reste.
===================================================================== */
const PGI_HANDLES = ['nw','n','ne','e','se','s','sw','w'];
const PGI_MIN = 2;             // plus petit côté d'un cadre, en % de la page
let pgiOn = false, pgiSel = null, pgiCrop = false, pgiWatch = 0;
let pgiUndo = [], pgiRedo = [];

function pgiList(p){
  p = p || S.project;
  if(!p) return [];
  if(!Array.isArray(p.pageImages)) return [];
  return p.pageImages;
}
/* Ne garde que des entrées complètes (projet importé, ancienne sauvegarde…). */
function pgiSanitize(p){
  if(!p || p.pageImages === undefined) return;
  const num = v => typeof v === 'number' && isFinite(v);
  const ok = Array.isArray(p.pageImages) ? p.pageImages.filter(m => m && typeof m.src === 'string' && /^data:image\//.test(m.src)
    && [m.page, m.x, m.y, m.w, m.h].every(num) && m.w > 0 && m.h > 0) : [];
  ok.forEach(m => {
    ['cl','ct','cr','cb'].forEach(k => { if(!num(m[k]) || m[k] < 0) m[k] = 0; });
    if(m.cl + m.cr > 0.98){ m.cl = 0; m.cr = 0; }
    if(m.ct + m.cb > 0.98){ m.ct = 0; m.cb = 0; }
    if(!num(m.op) || m.op < 0.05 || m.op > 1) m.op = 1;
    if(!num(m.ar) || m.ar <= 0) m.ar = 1;
    m.page = Math.max(0, Math.floor(m.page));
    m.back = !!m.back;
    if(typeof m.id !== 'string' || !m.id) m.id = uid('pgi');
  });
  if(!ok.length) delete p.pageImages;
  else if(ok.length !== p.pageImages.length) p.pageImages = ok;
}
function pgiFind(id){ return pgiList().find(m => m.id === id) || null; }
/* Feuille où se pose une image (une page disparue renvoie à la dernière). */
function pgiPageOf(m, count){ return Math.max(0, Math.min(Math.max(1, count) - 1, m.page)); }
/* Largeur / hauteur de la page (pour garder les proportions en %). */
function pgiPageRatio(){ return S.project && S.project.format === 'us' ? 8.5 / 11 : 21 / 29.7; }

/* ---- Annuler / rétablir (propre aux images : le texte garde son propre historique) ---- */
function pgiSnap(){ return pgiList().map(m => Object.assign({}, m)); }
function pgiPush(){
  pgiUndo.push(pgiSnap()); if(pgiUndo.length > 60) pgiUndo.shift();
  pgiRedo = [];
}
function pgiRestore(arr){
  if(arr.length) S.project.pageImages = arr; else delete S.project.pageImages;
  if(pgiSel && !pgiFind(pgiSel)){ pgiSel = null; pgiCrop = false; }
  pgiChanged(true);
}
function pgiDoUndo(){ if(!pgiUndo.length) return; pgiRedo.push(pgiSnap()); pgiRestore(pgiUndo.pop()); }
function pgiDoRedo(){ if(!pgiRedo.length) return; pgiUndo.push(pgiSnap()); pgiRestore(pgiRedo.pop()); }

/* ---- Rendu dans l'éditeur ---- */
/* Style CSS du cadre et de l'image qu'il recadre : le cadre coupe, l'image garde sa taille d'origine. */
function pgiImgCss(m){
  const fw = 1 - m.cl - m.cr, fh = 1 - m.ct - m.cb;
  return `left:${(-m.cl / fw * 100).toFixed(4)}%;top:${(-m.ct / fh * 100).toFixed(4)}%;width:${(100 / fw).toFixed(4)}%;height:${(100 / fh).toFixed(4)}%;opacity:${m.op};`;
}
function pgiLayers(){
  const stack = document.getElementById('pageStack');
  if(!stack) return null;
  let back = document.getElementById('pgiBack'), front = document.getElementById('pgiFront');
  if(!back){
    back = document.createElement('div'); back.id = 'pgiBack'; back.className = 'pgi-layer is-back';
    const sheets = document.getElementById('sheets');
    stack.insertBefore(back, sheets ? sheets.nextSibling : stack.firstChild);
  }
  if(!front){
    front = document.createElement('div'); front.id = 'pgiFront'; front.className = 'pgi-layer is-front';
    stack.appendChild(front);
  }
  return { stack, back, front };
}
function pgiGeo(){
  const res = S.pagination && S.pagination.res;
  const geo = res && res.geo;
  const stack = document.getElementById('pageStack');
  if(!geo || !stack) return null;
  return { pageH: geo.pageH, pageW: stack.offsetWidth, count: res.pageCount || 1, step: geo.pageH + PAGE_GAP };
}
let pgiSig = '';
/* Appelée après chaque pagination de l'éditeur. Ne reconstruit le calque que si quelque chose a changé. */
function pgiRender(force){
  if(!S.project) return;
  pgiSanitize(S.project);
  const g = pgiGeo(); if(!g) return;
  const list = pgiList();
  const Ls = pgiLayers(); if(!Ls) return;
  Ls.stack.classList.toggle('pgi-on', pgiOn);
  const sig = [g.pageH, g.pageW, g.count, pgiOn, pgiSel, pgiCrop, list.length].join('|') + '|' + list.map(m => [m.id, m.page, m.x, m.y, m.w, m.h, m.cl, m.ct, m.cr, m.cb, m.back, m.op, m.src.length].join(',')).join(';');
  if(!force && sig === pgiSig && Ls.back.isConnected) { pgiBarSync(); return; }
  pgiSig = sig;
  const byPage = { back:{}, front:{} };
  list.forEach(m => { const k = pgiPageOf(m, g.count), side = m.back ? 'back' : 'front'; (byPage[side][k] = byPage[side][k] || []).push(m); });
  ['back','front'].forEach(side => {
    let html = '';
    Object.keys(byPage[side]).forEach(k => {
      k = +k;
      const items = byPage[side][k];
      const open = pgiOn && items.some(m => m.id === pgiSel);
      html += `<div class="pgi-page${open ? ' is-open' : ''}" data-k="${k}" style="top:${k * g.step}px;height:${g.pageH}px;">`;
      items.forEach(m => {
        const sel = pgiOn && m.id === pgiSel;
        const fw = m.w / (1 - m.cl - m.cr), fh = m.h / (1 - m.ct - m.cb);
        if(sel && pgiCrop) html += `<div class="pgi-ghost" style="left:${m.x - m.cl * fw}%;top:${m.y - m.ct * fh}%;width:${fw}%;height:${fh}%;"><img src="${m.src}" alt="" draggable="false"></div>`;
        html += `<div class="pgi${sel ? ' is-sel' : ''}${sel && pgiCrop ? ' is-crop' : ''}" data-pgi="${m.id}" style="left:${m.x}%;top:${m.y}%;width:${m.w}%;height:${m.h}%;">`
          + `<div class="pgi-clip"><img src="${m.src}" alt="" draggable="false" style="${pgiImgCss(m)}"></div>`
          + (sel ? PGI_HANDLES.map(h => `<div class="pgi-h" data-h="${h}"></div>`).join('') : '')
          + `</div>`;
      });
      html += `</div>`;
    });
    Ls[side].innerHTML = html;
  });
  pgiBarSync();
}
/* Met à jour un seul cadre pendant un glisser (sans tout reconstruire). */
function pgiApply(m){
  document.querySelectorAll(`.pgi[data-pgi="${m.id}"]`).forEach(n => {
    n.style.left = m.x + '%'; n.style.top = m.y + '%'; n.style.width = m.w + '%'; n.style.height = m.h + '%';
    const im = n.querySelector('.pgi-clip img'); if(im) im.style.cssText = pgiImgCss(m);
    const gh = n.parentNode && n.parentNode.querySelector('.pgi-ghost');
    if(gh){
      const fw = m.w / (1 - m.cl - m.cr), fh = m.h / (1 - m.ct - m.cb);
      gh.style.left = (m.x - m.cl * fw) + '%'; gh.style.top = (m.y - m.ct * fh) + '%'; gh.style.width = fw + '%'; gh.style.height = fh + '%';
    }
  });
}
function pgiChanged(full){
  scheduleAutosave();
  if(full) pgiRender(true);
}

/* ---- Import d'un fichier image (même conversion que l'image libre de la page de titre) ---- */
function pgiReadFile(file){
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => {
      const im = new Image();
      im.onload = () => {
        let w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
        if(!w || !h){ w = 1000; h = 1000; }   // SVG sans dimensions
        const MAX = 2400, k = Math.min(1, MAX / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
        const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
        const ctx = cv.getContext('2d');
        const isJpg = /jpe?g/i.test(file.type || '') || /\.jpe?g$/i.test(file.name || '');
        if(isJpg){ ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch); }
        ctx.drawImage(im, 0, 0, cw, ch);
        let url = null;
        try{
          if(isJpg) url = cv.toDataURL('image/jpeg', 0.92);
          else {
            url = cv.toDataURL('image/png');
            // Grande photo sans transparence enregistrée en PNG : JPEG, bien plus léger pour le projet.
            if(url.length > 1500000){
              const px = ctx.getImageData(0, 0, cw, ch).data;
              let opaque = true; for(let i = 3; i < px.length; i += 4) if(px[i] < 255){ opaque = false; break; }
              if(opaque) url = cv.toDataURL('image/jpeg', 0.92);
            }
          }
        }catch(err){ url = null; }
        resolve(url ? { src:url, ar:ch / cw } : null);
      };
      im.onerror = () => resolve(null);
      im.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
/* Feuille la plus visible à l'écran (là où l'on pose une nouvelle image). */
function pgiVisiblePage(){
  const g = pgiGeo(), stack = document.getElementById('pageStack'), pane = document.getElementById('centerPane');
  if(!g || !stack) return 0;
  const sr = stack.getBoundingClientRect(), pr = pane ? pane.getBoundingClientRect() : { top:0, bottom:window.innerHeight };
  const z = sr.height / (stack.offsetHeight || 1) || 1;
  const mid = ((Math.max(pr.top, sr.top) + Math.min(pr.bottom, sr.bottom)) / 2 - sr.top) / z;
  return Math.max(0, Math.min(g.count - 1, Math.floor(mid / g.step)));
}
async function pgiAddFiles(files, at){
  files = Array.from(files || []).filter(f => f && (/^image\//.test(f.type || '') || /\.(png|jpe?g|webp|gif|svg|bmp|avif|ico)$/i.test(f.name || '')));
  if(!files.length || !S.project) return;
  const page = at ? at.page : pgiVisiblePage();
  const R = pgiPageRatio();
  let added = 0, firstId = null;
  pgiPush();
  for(const f of files){
    const r = await pgiReadFile(f);
    if(!r){ toast(L('Format d’image non reconnu par le navigateur : ','Image format not recognised by the browser: ') + (f.name || '')); continue; }
    let w = 50, h = w * r.ar * R;
    if(h > 70){ h = 70; w = h / (r.ar * R); }
    let x, y;
    if(at && added === 0){ x = at.x - w / 2; y = at.y - h / 2; }
    else { x = 50 - w / 2 + added * 5; y = 30 - h / 2 + added * 5; if(y < 4) y = 4 + added * 5; }
    const m = { id:uid('pgi'), page, x, y, w, h, cl:0, ct:0, cr:0, cb:0, src:r.src, ar:r.ar, back:false, op:1 };
    if(!Array.isArray(S.project.pageImages)) S.project.pageImages = [];
    S.project.pageImages.push(m);
    if(!firstId) firstId = m.id;
    added++;
  }
  if(!added){ pgiUndo.pop(); return; }
  if(!pgiOn) pgiEnter(true);
  pgiSel = firstId; pgiCrop = false;
  pgiChanged(true);
  toast(added > 1 ? L(added + ' images ajoutées sur la page ' + pgiPageLabel(page) + '.', added + ' images added on page ' + pgiPageLabel(page) + '.')
                  : L('Image ajoutée sur la page ' + pgiPageLabel(page) + '. Glisse-la, tire les poignées, « Rogner » pour la recadrer.', 'Image added on page ' + pgiPageLabel(page) + '. Drag it, pull the handles, “Crop” to trim it.'));
}
function pgiPageLabel(k){ try{ const l = pageLbl(k + 1); return l === '–' ? String(k + 1) : l; }catch(e){ return String(k + 1); } }
function pgiPickFiles(){
  let inp = document.getElementById('pgiFileInput');
  if(!inp){
    inp = document.createElement('input'); inp.type = 'file'; inp.id = 'pgiFileInput'; inp.multiple = true;
    inp.accept = 'image/*,.png,.jpg,.jpeg,.webp,.gif,.svg,.bmp,.avif';
    inp.style.display = 'none';
    inp.addEventListener('change', () => { const fs = Array.from(inp.files || []); inp.value = ''; pgiAddFiles(fs); });
    document.body.appendChild(inp);
  }
  inp.click();
}

/* ---- Mode Images ---- */
function pgiEnter(silent){
  if(!S.project) return;
  if(S.view !== 'editor') return;
  if(S.tab !== 'editor'){ S.tab = 'editor'; renderTabBody(); try{ syncRailActive('editor'); }catch(e){} }
  pgiOn = true; pgiCrop = false;
  const a = document.activeElement; if(a && a !== document.body && a.blur) a.blur();
  try{ window.getSelection().removeAllRanges(); }catch(e){}
  pgiRender(true);
  clearInterval(pgiWatch);
  pgiWatch = setInterval(() => { if(!document.getElementById('pageStack') || S.view !== 'editor' || S.tab !== 'editor') pgiExit(); }, 500);
  if(!silent && !pgiList().length) toast(L('Mode Images : « Ajouter des images » ou glisse tes fichiers sur une page. Le texte ne bouge pas.','Images mode: “Add images” or drop your files on a page. The text doesn’t move.'));
}
function pgiExit(){
  if(!pgiOn) return;
  pgiOn = false; pgiSel = null; pgiCrop = false;
  clearInterval(pgiWatch);
  const b = document.getElementById('pgiBar'); if(b) b.remove();
  pgiRender(true);
}
function pgiToggle(){ pgiOn ? pgiExit() : pgiEnter(); }
function pgiSelect(id){
  if(pgiSel === id) return;
  pgiSel = id; pgiCrop = false;
  pgiRender(true);
}

/* Barre d'outils du mode Images, posée en haut de la zone d'écriture (sans rien décaler). */
function pgiBarHtml(){
  const m = pgiSel ? pgiFind(pgiSel) : null;
  const n = pgiList().length;
  const b = (act, ic, label, tip, cls) => `<button type="button" class="btn btn-sm${cls ? ' ' + cls : ''}" data-act="${act}" title="${tip || label}">${ic}${label ? `<span>${label}</span>` : ''}</button>`;
  const svg = p => `<svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const I = {
    crop: svg('<path d="M4 1.5V12h10.5M1.5 4H12v10.5"/>'),
    ratio: svg('<rect x="2" y="4" width="12" height="8" rx="1"/><path d="M5 7V6h1.5M11 9v1H9.5"/>'),
    front: svg('<rect x="5.5" y="5.5" width="8.5" height="8.5" rx="1" fill="currentColor" fill-opacity=".25"/><path d="M2 10.5V2h8.5"/>'),
    back: svg('<rect x="2" y="2" width="8.5" height="8.5" rx="1"/><path d="M5.5 14h8.5V5.5" stroke-dasharray="1.6 1.6"/>'),
    up: svg('<path d="M8 13V3M4 7l4-4 4 4"/>'),
    down: svg('<path d="M8 3v10M4 9l4 4 4-4"/>')
  };
  let html = `<div class="pgi-bar-in">
    <span class="pgi-bar-t">${icon('image')}<b>${L('Images','Images')}</b><small>${n ? (n + ' ' + (n > 1 ? L('images','images') : L('image','image'))) : L('aucune','none')}</small></span>
    ${b('pgiPickFiles', icon('plus'), L('Ajouter des images','Add images'), L('Une ou plusieurs images, sur la page affichée (tu peux aussi les glisser sur une page, ou coller avec Ctrl+V)','One or more images, on the page shown (you can also drop them on a page, or paste with Ctrl+V)'), 'btn-primary')}`;
  if(m){
    html += `<span class="pgi-sep"></span>
    ${b('pgiToggleCrop', I.crop, pgiCrop ? L('Fin du rognage','Done cropping') : L('Rogner','Crop'), L('Recadrer : tire les bords, glisse l’image dans le cadre (double-clic sur l’image aussi)','Crop: pull the edges, drag the image inside the frame (double-click the image too)'), pgiCrop ? 'is-on' : '')}
    ${(m.cl || m.ct || m.cr || m.cb) ? b('pgiUncrop', '', L('Annuler le rognage','Reset crop'), L('Retrouver toute l’image','Get the whole image back')) : ''}
    ${b('pgiRatio', I.ratio, '', L('Rétablir les proportions','Restore proportions'))}
    ${b('pgiToggleBack', m.back ? I.front : I.back, m.back ? L('Devant le texte','In front of text') : L('Derrière le texte','Behind text'), m.back ? L('Passer l’image devant le texte','Put the image in front of the text') : L('Passer l’image derrière le texte (comme un fond)','Put the image behind the text (like a background)'))}
    ${b('pgiForward', I.up, '', L('Mettre au premier plan (par-dessus les autres images)','Bring to front (over the other images)'))}
    ${b('pgiBackward', I.down, '', L('Mettre à l’arrière-plan (sous les autres images)','Send to back (under the other images)'))}
    <label class="pgi-op" title="${L('Opacité','Opacity')}"><span>${L('Opacité','Opacity')}</span><input type="range" id="pgiOpacity" min="0.1" max="1" step="0.05" value="${m.op}"><em id="pgiOpVal">${Math.round(m.op * 100)}%</em></label>
    ${b('pgiDuplicate', icon('copy'), '', L('Dupliquer (Ctrl+D)','Duplicate (Ctrl+D)'))}
    ${b('pgiRemove', icon('trash'), '', L('Supprimer (Suppr)','Delete (Del)'), 'btn-danger')}`;
  }
  html += `<span class="pgi-sep"></span>
    ${b('pgiExit', '', L('Terminé','Done'), L('Revenir à l’écriture (Échap)','Back to writing (Esc)'))}
  </div>`;
  return html;
}
function pgiBarSync(){
  let bar = document.getElementById('pgiBar');
  if(!pgiOn){ if(bar) bar.remove(); return; }
  const pane = document.getElementById('centerPane');
  if(!pane) return;
  if(!bar){
    bar = document.createElement('div'); bar.id = 'pgiBar'; bar.className = 'pgi-bar'; bar.dataset.stop = '1';
    document.body.appendChild(bar);
    bar.addEventListener('input', e => {
      if(e.target && e.target.id === 'pgiOpacity'){
        const m = pgiFind(pgiSel); if(!m) return;
        if(!bar._opPushed){ pgiPush(); bar._opPushed = true; }
        m.op = +e.target.value; pgiApply(m);
        const v = document.getElementById('pgiOpVal'); if(v) v.textContent = Math.round(m.op * 100) + '%';
        scheduleAutosave();
      }
    });
    bar.addEventListener('change', e => { if(e.target && e.target.id === 'pgiOpacity'){ bar._opPushed = false; pgiRender(true); } });
  }
  const html = pgiBarHtml();
  if(bar._html !== html){ bar.innerHTML = html; bar._html = html; }
  const r = pane.getBoundingClientRect();
  bar.style.top = Math.round(r.top + 10) + 'px';
  bar.style.left = Math.round(r.left + r.width / 2) + 'px';
  bar.style.maxWidth = Math.max(260, Math.round(r.width - 24)) + 'px';
}
window.addEventListener('resize', () => { if(pgiOn) pgiBarSync(); });

/* ---- Actions de la barre ---- */
function pgiCur(){ return pgiSel ? pgiFind(pgiSel) : null; }
function pgiToggleCrop(){ if(!pgiCur()) return; pgiCrop = !pgiCrop; pgiRender(true); }
function pgiUncrop(){
  const m = pgiCur(); if(!m) return;
  pgiPush();
  const fw = m.w / (1 - m.cl - m.cr), fh = m.h / (1 - m.ct - m.cb);
  m.x -= m.cl * fw; m.y -= m.ct * fh; m.w = fw; m.h = fh;
  m.cl = m.ct = m.cr = m.cb = 0;
  pgiChanged(true);
}
function pgiRatio(){
  const m = pgiCur(); if(!m) return;
  pgiPush();
  const want = m.ar * (1 - m.ct - m.cb) / (1 - m.cl - m.cr) * pgiPageRatio();
  const cy = m.y + m.h / 2;
  m.h = m.w * want; m.y = cy - m.h / 2;
  pgiChanged(true);
}
function pgiToggleBack(){ const m = pgiCur(); if(!m) return; pgiPush(); m.back = !m.back; pgiChanged(true); }
function pgiForward(){
  const a = pgiList(), m = pgiCur(); if(!m) return;
  const i = a.indexOf(m); if(i === a.length - 1) return;
  pgiPush(); a.splice(i, 1); a.push(m); pgiChanged(true);
}
function pgiBackward(){
  const a = pgiList(), m = pgiCur(); if(!m) return;
  const i = a.indexOf(m); if(i === 0) return;
  pgiPush(); a.splice(i, 1); a.unshift(m); pgiChanged(true);
}
function pgiDuplicate(){
  const m = pgiCur(); if(!m) return;
  pgiPush();
  const c = Object.assign({}, m, { id:uid('pgi'), x:m.x + 3, y:m.y + 3 });
  const a = pgiList(); a.splice(a.indexOf(m) + 1, 0, c);
  pgiSel = c.id; pgiCrop = false;
  pgiChanged(true);
}
function pgiRemove(){
  const m = pgiCur(); if(!m) return;
  pgiPush();
  const a = pgiList(); a.splice(a.indexOf(m), 1);
  if(!a.length) delete S.project.pageImages;
  pgiSel = null; pgiCrop = false;
  pgiChanged(true);
  toast(L('Image supprimée (Ctrl+Z pour la retrouver).','Image deleted (Ctrl+Z to get it back).'));
}

/* ---- Souris / doigt / stylet ---- */
document.addEventListener('pointerdown', e => {
  if(!pgiOn) return;
  const t = e.target;
  if(!t || !t.closest) return;
  if(t.closest('#pgiBar')) return;
  const box = t.closest('.pgi-layer .pgi');
  if(!box){
    // Clic sur une page, hors image : on désélectionne (le mode reste actif).
    if(t.closest('#pageStack') && pgiSel){ pgiSel = null; pgiCrop = false; pgiRender(true); }
    return;
  }
  if(e.button !== undefined && e.button !== 0) return;
  e.preventDefault(); e.stopPropagation();
  const id = box.dataset.pgi;
  if(pgiSel !== id){ pgiSelect(id); }
  const m = pgiFind(id); if(!m) return;
  const node = document.querySelector(`.pgi[data-pgi="${id}"]`); if(!node) return;
  const hEl = t.closest('.pgi-h');
  pgiDrag(e, m, node, hEl ? hEl.dataset.h : null);
}, true);
document.addEventListener('dblclick', e => {
  if(!pgiOn) return;
  const box = e.target && e.target.closest && e.target.closest('.pgi-layer .pgi');
  if(!box) return;
  e.preventDefault();
  if(pgiSel !== box.dataset.pgi) pgiSelect(box.dataset.pgi);
  pgiToggleCrop();
}, true);

function pgiDrag(e, m, node, handle){
  const g = pgiGeo(); if(!g) return;
  const stack = document.getElementById('pageStack');
  const sr = stack.getBoundingClientRect();
  const z = sr.width / (stack.offsetWidth || 1) || 1;
  const pxW = g.pageW * z, pxH = g.pageH * z;          // taille d'une page à l'écran
  const sx = e.clientX, sy = e.clientY;
  const o = Object.assign({}, m);
  const k0 = pgiPageOf(m, g.count);
  const fw0 = o.w / (1 - o.cl - o.cr), fh0 = o.h / (1 - o.ct - o.cb);
  const F = { x:o.x - o.cl * fw0, y:o.y - o.ct * fh0, w:fw0, h:fh0 };   // image entière (fixe pendant un rognage)
  const ar = o.h / o.w;
  const snap = pgiSnap();
  let moved = false, pushed = false;
  const pageBox = node.parentNode;
  if(pageBox) pageBox.classList.add('is-open', 'is-drag');
  const move = ev => {
    const dx = (ev.clientX - sx) / pxW * 100, dy = (ev.clientY - sy) / pxH * 100;
    if(!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 3) return;
    if(!pushed){ pgiUndo.push(snap); if(pgiUndo.length > 60) pgiUndo.shift(); pgiRedo = []; pushed = true; }
    moved = true;
    if(pgiCrop){
      if(!handle){
        // Glisser dans le cadre : l'image se déplace derrière le cadre, qui ne bouge pas.
        const nx = Math.min(o.x, Math.max(o.x + o.w - F.w, F.x + dx));
        const ny = Math.min(o.y, Math.max(o.y + o.h - F.h, F.y + dy));
        m.cl = (o.x - nx) / F.w; m.cr = 1 - m.cl - o.w / F.w;
        m.ct = (o.y - ny) / F.h; m.cb = 1 - m.ct - o.h / F.h;
      } else {
        // Tirer un bord : le cadre rogne l'image, qui garde sa taille et sa place.
        let Lx = o.x, Rx = o.x + o.w, Ty = o.y, By = o.y + o.h;
        if(handle.includes('w')) Lx = Math.max(F.x, Math.min(Rx - PGI_MIN, o.x + dx));
        if(handle.includes('e')) Rx = Math.min(F.x + F.w, Math.max(Lx + PGI_MIN, o.x + o.w + dx));
        if(handle.includes('n')) Ty = Math.max(F.y, Math.min(By - PGI_MIN, o.y + dy));
        if(handle.includes('s')) By = Math.min(F.y + F.h, Math.max(Ty + PGI_MIN, o.y + o.h + dy));
        m.x = Lx; m.w = Rx - Lx; m.y = Ty; m.h = By - Ty;
        m.cl = (Lx - F.x) / F.w; m.cr = (F.x + F.w - Rx) / F.w;
        m.ct = (Ty - F.y) / F.h; m.cb = (F.y + F.h - By) / F.h;
      }
      ['cl','cr','ct','cb'].forEach(q => { if(m[q] < 1e-6) m[q] = 0; });
    } else if(!handle){
      m.x = o.x + dx; m.y = o.y + dy;
    } else {
      let x = o.x, y = o.y, w = o.w, h = o.h;
      const L_ = handle.includes('w'), R_ = handle.includes('e'), T_ = handle.includes('n'), B_ = handle.includes('s');
      if(L_){ w = o.w - dx; x = o.x + dx; } if(R_){ w = o.w + dx; }
      if(T_){ h = o.h - dy; y = o.y + dy; } if(B_){ h = o.h + dy; }
      if(handle.length === 2 && !ev.shiftKey){
        // coins : proportions gardées (Maj = étirement libre)
        const wFromH = h / ar;
        if(Math.abs(w - o.w) >= Math.abs(wFromH - o.w)) h = w * ar; else w = wFromH;
        if(L_) x = o.x + o.w - w; if(T_) y = o.y + o.h - h;
      }
      if(w < PGI_MIN){ w = PGI_MIN; if(L_) x = o.x + o.w - w; }
      if(h < PGI_MIN){ h = PGI_MIN; if(T_) y = o.y + o.h - h; }
      m.x = x; m.y = y; m.w = w; m.h = h;
    }
    pgiApply(m);
  };
  const up = () => {
    document.removeEventListener('pointermove', move, true);
    document.removeEventListener('pointerup', up, true);
    document.removeEventListener('pointercancel', up, true);
    if(pageBox) pageBox.classList.remove('is-drag');
    if(!moved) return;
    // Déplacé vers une autre feuille ? L'image change de page (son centre décide).
    if(!handle && !pgiCrop){
      const cy = k0 * g.step + (m.y + m.h / 2) / 100 * g.pageH;
      const k = Math.max(0, Math.min(g.count - 1, Math.floor((cy + PAGE_GAP / 2) / g.step)));
      if(k !== k0){ m.y += (k0 - k) * g.step / g.pageH * 100; m.page = k; }
      else if(m.page !== k0) m.page = k0;
    }
    pgiChanged(true);
  };
  document.addEventListener('pointermove', move, true);
  document.addEventListener('pointerup', up, true);
  document.addEventListener('pointercancel', up, true);
}

/* ---- Clavier (seulement en mode Images, jamais pendant la frappe dans un champ) ---- */
document.addEventListener('keydown', e => {
  if(!pgiOn) return;
  const t = e.target;
  if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) && !(t.id === 'pgiOpacity')) return;
  if(document.querySelector('.modal-backdrop')) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key;
  let done = true;
  if(k === 'Escape'){ if(pgiCrop){ pgiCrop = false; pgiRender(true); } else if(pgiSel){ pgiSel = null; pgiRender(true); } else pgiExit(); }
  else if(mod && !e.shiftKey && (k === 'z' || k === 'Z')) pgiDoUndo();
  else if(mod && ((k === 'y' || k === 'Y') || (e.shiftKey && (k === 'z' || k === 'Z')))) pgiDoRedo();
  else if(!pgiSel) done = false;
  else if(k === 'Delete' || k === 'Backspace') pgiRemove();
  else if(mod && (k === 'd' || k === 'D')) pgiDuplicate();
  else if(k === 'Enter'){ pgiToggleCrop(); }
  else if(/^Arrow/.test(k)){
    const m = pgiCur(); if(!m) return;
    const st = e.shiftKey ? 2 : 0.25;
    pgiPush();
    if(k === 'ArrowLeft') m.x -= st; else if(k === 'ArrowRight') m.x += st;
    else if(k === 'ArrowUp') m.y -= st * pgiPageRatio(); else m.y += st * pgiPageRatio();
    pgiApply(m); scheduleAutosave(); pgiSig = '';
  }
  else done = false;
  if(done){ e.preventDefault(); e.stopPropagation(); }
}, true);

/* ---- Glisser des fichiers sur une page, ou coller une image (Ctrl+V) ---- */
function pgiHasImageFiles(dt){
  if(!dt) return false;
  const items = Array.from(dt.items || []);
  if(items.length) return items.some(it => it.kind === 'file' && /^image\//.test(it.type || ''));
  return Array.from(dt.files || []).some(f => /^image\//.test(f.type || ''));
}
document.addEventListener('dragover', e => {
  if(!S.project || S.view !== 'editor' || S.tab !== 'editor') return;
  if(!e.target || !e.target.closest || !e.target.closest('#pageStack')) return;
  if(!pgiHasImageFiles(e.dataTransfer)) return;
  e.preventDefault(); e.dataTransfer.dropEffect = 'copy';
}, true);
document.addEventListener('drop', e => {
  if(!S.project || S.view !== 'editor' || S.tab !== 'editor') return;
  if(!e.target || !e.target.closest || !e.target.closest('#pageStack')) return;
  const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []).filter(f => /^image\//.test(f.type || ''));
  if(!files.length) return;
  e.preventDefault(); e.stopPropagation();
  const g = pgiGeo(), stack = document.getElementById('pageStack');
  let at = null;
  if(g && stack){
    const sr = stack.getBoundingClientRect(), z = sr.width / (stack.offsetWidth || 1) || 1;
    const sy = (e.clientY - sr.top) / z, sx = (e.clientX - sr.left) / z;
    const page = Math.max(0, Math.min(g.count - 1, Math.floor(sy / g.step)));
    at = { page, x: sx / g.pageW * 100, y: (sy - page * g.step) / g.pageH * 100 };
  }
  pgiAddFiles(files, at);
}, true);
document.addEventListener('paste', e => {
  if(!S.project || S.view !== 'editor' || S.tab !== 'editor') return;
  const cd = e.clipboardData; if(!cd) return;
  const inEditor = e.target && e.target.closest && e.target.closest('#page');
  if(!inEditor && !pgiOn) return;
  if((cd.getData('text/plain') || '').length) return;      // du texte : collage habituel
  const files = Array.from(cd.files || []).filter(f => /^image\//.test(f.type || ''));
  if(!files.length) return;
  e.preventDefault(); e.stopPropagation();
  pgiAddFiles(files);
}, true);

/* ---- Impression et PDF : mêmes cadres, posés dans chaque feuille exportée ----
   Positions en fraction de --page-w / --page-h : la feuille imprimée (raccourcie d'1 mm à l'impression)
   n'en déplace aucune. Ajoutées à la fin de la feuille, en position absolue : rien dans le texte ne bouge. */
function pgiDecorateSheet(sheet, k, p, count){
  pgiSanitize(p);
  const list = pgiList(p); if(!list.length) return;
  list.forEach(m => {
    if(pgiPageOf(m, count) !== k) return;
    const box = document.createElement('div');
    box.className = 'pgi-print' + (m.back ? ' is-back' : ' is-front');
    box.style.cssText = `left:calc(var(--page-w,21cm) * ${m.x / 100});top:calc(var(--page-h,29.7cm) * ${m.y / 100});width:calc(var(--page-w,21cm) * ${m.w / 100});height:calc(var(--page-h,29.7cm) * ${m.h / 100});`;
    const im = document.createElement('img');
    im.src = m.src; im.alt = ''; im.style.cssText = pgiImgCss(m);
    box.appendChild(im);
    sheet.appendChild(box);
    if(m.back) sheet.classList.add('has-pgi-back');
  });
}

Object.assign(ACTIONS, {
  pgiToggle, pgiEnter: () => pgiEnter(), pgiExit, pgiPickFiles, pgiToggleCrop, pgiUncrop, pgiRatio,
  pgiToggleBack, pgiForward, pgiBackward, pgiDuplicate, pgiRemove
});

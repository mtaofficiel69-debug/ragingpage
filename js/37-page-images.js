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
let pgiOn = false, pgiSel = null, pgiCrop = false, pgiWatch = 0, pgiOpOpen = false, pgiPickAt = null, pgiListOpen = false, pgiPickReplace = null;
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
  // Fenêtre étroite (page affichée en réduction) : la mini-barre et la taille gardent une taille lisible.
  const zk = (S.pagination && S.pagination.zoom) || 1;
  Ls.stack.style.setProperty('--pgi-iz', String(zk < 1 ? 1 / zk : 1));
  const sig = [g.pageH, g.pageW, g.count, pgiOn, pgiSel, pgiCrop, list.length, zk].join('|') + '|' + list.map(m => [m.id, m.page, m.x, m.y, m.w, m.h, m.cl, m.ct, m.cr, m.cb, m.back, m.op, m.src.length].join(',')).join(';');
  // Le calque garde la trace de ce qu'il affiche : un éditeur reconstruit (ajout d'un carton, annuler, collage…)
  // repart d'un calque neuf, vide, qui doit être redessiné même si les images n'ont pas changé.
  if(!force && sig === pgiSig && Ls.back._pgiSig === sig && Ls.front._pgiSig === sig) { pgiBarSync(); return; }
  pgiSig = sig; Ls.back._pgiSig = sig; Ls.front._pgiSig = sig;
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
          + (sel ? PGI_HANDLES.map(h => `<div class="pgi-h" data-h="${h}"></div>`).join('') + `<div class="pgi-dim">${pgiDimText(m)}</div>` + pgiQuickHtml(m, g) : '')
          + `</div>`;
      });
      html += `</div>`;
    });
    // Mode Images : un bouton « + Image » discret en haut de chaque feuille, pour poser une image exactement sur cette page.
    if(side === 'front' && pgiOn){
      for(let k = 0; k < g.count; k++) html += `<button type="button" class="pgi-add" data-act="pgiAddHere" data-id="${k}" style="top:${k * g.step + 12}px;" title="${L('Ajouter une ou plusieurs images sur cette page','Add one or more images on this page')}">${icon('plus')}<span>${L('Image','Image')}</span></button>`;
    }
    Ls[side].innerHTML = html;
  });
  pgiBarSync();
}
/* Mini-barre posée sur l'image sélectionnée : les gestes les plus courants, à portée de souris. */
function pgiQuickHtml(m, g){
  const below = m.y / 100 * g.pageH < 54;          // trop près du haut de la page : sous l'image
  const b = (act, ic, label, cls) => `<button type="button" class="pgi-qa-b${cls ? ' ' + cls : ''}" data-act="${act}" title="${label}">${ic}<span>${label}</span></button>`;
  const svg = p => `<svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const crop = svg('<path d="M4 1.5V12h10.5M1.5 4H12v10.5"/>'), ok = svg('<path d="M3 8.5l3.2 3.2L13 4.8"/>');
  const swap = svg('<path d="M2.5 5.5h9l-2.5-2.5M13.5 10.5h-9l2.5 2.5"/>');
  const cropped = !!(m.cl || m.ct || m.cr || m.cb);
  const inner = pgiCrop
    ? b('pgiToggleCrop', ok, L('Valider le rognage','Apply crop'), 'is-main') + (cropped ? b('pgiUncrop', '', L('Image entière','Whole image')) : '')
    : b('pgiToggleCrop', crop, L('Rogner','Crop')) + b('pgiReplace', swap, L('Remplacer','Replace')) + b('pgiDuplicate', icon('copy'), L('Dupliquer','Duplicate')) + b('pgiRemove', icon('trash'), L('Supprimer','Delete'), 'is-danger');
  return `<div class="pgi-qa${below ? ' is-below' : ''}" data-stop="1">${inner}</div>`;
}
/* Taille réelle du cadre sur le papier, en centimètres (comme à l'impression). */
function pgiDimText(m){
  const us = S.project && S.project.format === 'us', W = us ? 21.59 : 21, H = us ? 27.94 : 29.7;
  const f = v => (Math.round(v * 10) / 10).toLocaleString(getLang() === 'en' ? 'en' : 'fr', { minimumFractionDigits:1, maximumFractionDigits:1 });
  return f(m.w / 100 * W) + ' \u00d7 ' + f(m.h / 100 * H) + ' cm';
}
/* Met à jour un seul cadre pendant un glisser (sans tout reconstruire). */
function pgiApply(m){
  document.querySelectorAll(`.pgi[data-pgi="${m.id}"]`).forEach(n => {
    n.style.left = m.x + '%'; n.style.top = m.y + '%'; n.style.width = m.w + '%'; n.style.height = m.h + '%';
    const im = n.querySelector('.pgi-clip img'); if(im) im.style.cssText = pgiImgCss(m);
    const dm = n.querySelector('.pgi-dim'); if(dm) dm.textContent = pgiDimText(m);
    const gh = n.parentNode && n.parentNode.querySelector('.pgi-ghost');
    if(gh){
      const fw = m.w / (1 - m.cl - m.cr), fh = m.h / (1 - m.ct - m.cb);
      gh.style.left = (m.x - m.cl * fw) + '%'; gh.style.top = (m.y - m.ct * fh) + '%'; gh.style.width = fw + '%'; gh.style.height = fh + '%';
    }
  });
}
function pgiChanged(full){
  pgiSaveNow();
  if(full) pgiRender(true);
}
/* Sauvegarde des images : TOUT DE SUITE après chaque action (ajout, déplacement, rognage, suppression…),
   et non 1,2 s plus tard comme la frappe — un rechargement ou un onglet fermé juste après ne perd rien.
   Les réglages continus (curseur d'opacité, flèches) passent par l'enregistrement différé habituel, que
   l'on force à la fermeture de l'onglet s'il est encore en attente. */
let pgiPending = false;
function pgiSaveNow(){
  pgiPending = false;
  if(!S.project) return;
  clearTimeout(S.saveTimer); S.saveTimer = null;
  markDot('saving');
  try{ doAutosave(); }catch(e){}
}
function pgiSaveLater(){ pgiPending = true; scheduleAutosave(); }
function pgiFlushPending(){ if(pgiPending && S.saveTimer) pgiSaveNow(); }
window.addEventListener('pagehide', pgiFlushPending);
document.addEventListener('visibilitychange', () => { if(document.hidden) pgiFlushPending(); });

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
  const read = [];
  for(const f of files){
    const r = await pgiReadFile(f);
    if(!r){ toast(L('Format d’image non reconnu par le navigateur : ','Image format not recognised by the browser: ') + (f.name || '')); continue; }
    read.push(r);
  }
  const added = read.length;
  if(!added) return;
  pgiPush();
  // Plusieurs images d'un coup : rangées côte à côte sur la page (jamais empilées), chacune dans sa case.
  const cols = added === 1 ? 1 : added <= 4 ? 2 : 3, rows = Math.ceil(added / cols);
  const cellW = added === 1 ? 100 : 84 / cols, cellH = added === 1 ? 70 : Math.min(36, 84 / rows);
  const cx0 = at && added === 1 ? at.x : 50, cy0 = at ? at.y : (added === 1 ? 30 : 42);
  const gridTop = Math.max(4, Math.min(96 - rows * cellH, cy0 - rows * cellH / 2));
  let firstId = null;
  if(!Array.isArray(S.project.pageImages)) S.project.pageImages = [];
  read.forEach((r, i) => {
    let w = added === 1 ? 50 : cellW - 4, h = w * r.ar * R;
    if(h > cellH - (added === 1 ? 0 : 4)){ h = cellH - (added === 1 ? 0 : 4); w = h / (r.ar * R); }
    let x, y;
    if(added === 1){ x = cx0 - w / 2; y = at ? cy0 - h / 2 : Math.max(4, cy0 - h / 2); }
    else {
      const c = i % cols, row = Math.floor(i / cols);
      const inRow = Math.min(cols, added - row * cols);              // dernière rangée incomplète : centrée
      const left = 50 - inRow * cellW / 2;
      x = left + c * cellW + (cellW - w) / 2; y = gridTop + row * cellH + (cellH - h) / 2;
    }
    const m = { id:uid('pgi'), page, x, y, w, h, cl:0, ct:0, cr:0, cb:0, src:r.src, ar:r.ar, back:false, op:1 };
    S.project.pageImages.push(m);
    if(!firstId) firstId = m.id;
  });
  if(!pgiOn) pgiEnter(true);
  pgiSel = firstId; pgiCrop = false;
  pgiChanged(true);
  // La nouvelle image arrive à l'écran en entier (rien d'autre ne défile que la vue).
  try{
    const n = document.querySelector(`.pgi[data-pgi="${firstId}"]`), pane = document.getElementById('centerPane');
    if(n && pane){
      const r = n.getBoundingClientRect(), pr = pane.getBoundingClientRect();
      if(r.top < pr.top + 90 || r.bottom > pr.bottom - 40) pane.scrollTop += (r.top + r.height / 2) - (pr.top + pr.height / 2) + 30;
    }
  }catch(e){}
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
    inp.addEventListener('change', () => {
      const fs = Array.from(inp.files || []), at = pgiPickAt, rp = pgiPickReplace;
      inp.value = ''; pgiPickAt = null; pgiPickReplace = null; inp.multiple = true;
      if(rp) pgiReplaceWith(rp, fs[0]); else pgiAddFiles(fs, at);
    });
    document.body.appendChild(inp);
  }
  inp.click();
}
/* « + Image » d'une feuille : l'image arrive au centre de cette page-là. */
function pgiAddHere(k){
  const g = pgiGeo(); k = Math.max(0, Math.min(g ? g.count - 1 : 0, +k || 0));
  pgiPickFiles(); pgiPickAt = { page:k, x:50, y:38 };
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
  pgiOn = false; pgiSel = null; pgiCrop = false; pgiOpOpen = false; pgiListOpen = false;
  clearInterval(pgiWatch);
  const b = document.getElementById('pgiBar'); if(b) b.remove();
  pgiRender(true);
}
function pgiToggle(){ pgiOn ? pgiExit() : pgiEnter(); }
function pgiSelect(id){
  if(pgiSel === id) return;
  pgiSel = id; pgiCrop = false; pgiOpOpen = false;
  pgiRender(true);
}

/* ---- Hors du mode Images : au survol d'une image, un bouton « Modifier l'image » pour y entrer directement ----
   Seul ce petit bouton capte la souris : partout ailleurs, le clic va au texte, comme avant. */
let pgiHovRaf = 0, pgiHovId = null;
function pgiHoverHide(){ pgiHovId = null; const h = document.getElementById('pgiHover'); if(h) h.remove(); }
document.addEventListener('mousemove', e => {
  if(pgiOn || !S.project || S.view !== 'editor' || S.tab !== 'editor' || !pgiList().length){ if(pgiHovId) pgiHoverHide(); return; }
  if(e.buttons){ if(pgiHovId) pgiHoverHide(); return; }
  const x = e.clientX, y = e.clientY, tgt = e.target;
  if(pgiHovRaf) return;
  pgiHovRaf = requestAnimationFrame(() => {
    pgiHovRaf = 0;
    if(tgt && tgt.closest && tgt.closest('#pgiHover')) return;
    const nodes = Array.from(document.querySelectorAll('#pgiFront .pgi, #pgiBack .pgi')), pane = document.getElementById('centerPane');
    const pr = pane ? pane.getBoundingClientRect() : null;
    let hit = null;
    if(pr && x >= pr.left && x <= pr.right && y >= pr.top && y <= pr.bottom){
      for(const n of nodes){ const r = n.getBoundingClientRect(); if(x >= r.left && x <= r.right && y >= r.top && y <= r.bottom){ hit = { n, r }; break; } }
    }
    if(!hit){ if(pgiHovId) pgiHoverHide(); return; }
    const id = hit.n.dataset.pgi;
    let h = document.getElementById('pgiHover');
    if(!h){
      h = document.createElement('button'); h.type = 'button'; h.id = 'pgiHover'; h.className = 'pgi-hover';
      h.innerHTML = `${icon('image')}<span>${L('Modifier l’image','Edit image')}</span>`;
      h.title = L('Déplacer, agrandir, rogner, supprimer…','Move, resize, crop, delete…');
      h.addEventListener('mousedown', ev => ev.preventDefault());   // le curseur de texte reste où il est
      h.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); const k = pgiHovId; pgiHoverHide(); pgiEnter(true); if(k){ pgiSel = k; pgiCrop = false; pgiRender(true); } });
      document.body.appendChild(h);
    }
    pgiHovId = id;
    const top = Math.max(pr.top + 6, hit.r.top + 8);
    h.style.top = Math.round(top) + 'px';
    h.style.left = Math.round(Math.min(pr.right - 8, hit.r.right - 8)) + 'px';
  });
}, true);
document.addEventListener('keydown', () => { if(pgiHovId) pgiHoverHide(); }, true);
document.addEventListener('scroll', () => { if(pgiHovId) pgiHoverHide(); }, true);

/* Barre d'outils du mode Images : même barre flottante que la page de titre (verre dépoli, boutons-icônes),
   posée en haut de la zone d'écriture sans rien décaler. */
function pgiBarHtml(){
  const m = pgiSel ? pgiFind(pgiSel) : null;
  const n = pgiList().length;
  const svg = p => `<svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const I = {
    crop: svg('<path d="M4 1.5V12h10.5M1.5 4H12v10.5"/>'),
    ratio: svg('<rect x="2" y="3.5" width="12" height="9" rx="1.2"/><path d="M4.8 7.6V6.3h1.6M11.2 8.4v1.3H9.6"/>'),
    front: svg('<rect x="2" y="2" width="8" height="8" rx="1" stroke-dasharray="1.6 1.6"/><rect x="6" y="6" width="8" height="8" rx="1" fill="currentColor" fill-opacity=".22"/>'),
    back: svg('<rect x="2" y="2" width="8" height="8" rx="1" fill="currentColor" fill-opacity=".22"/><path d="M10 6h3a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-3"/><path d="M7.5 9h4M7.5 11.5h4" opacity=".7"/>'),
    up: svg('<path d="M8 13V3.5M4.2 7.3 8 3.5l3.8 3.8"/>'),
    down: svg('<path d="M8 3v9.5M4.2 8.7 8 12.5l3.8-3.8"/>'),
    op: svg('<circle cx="8" cy="8" r="6"/><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" stroke="none"/>'),
    whole: svg('<rect x="2" y="2" width="12" height="12" rx="1.2"/><path d="M5 11l2.3-2.6 1.6 1.6L10.6 8 13 11"/><circle cx="5.6" cy="5.6" r="1"/>'),
    done: svg('<path d="M3 8.5l3.2 3.2L13 4.8"/>')
  };
  const b = (act, ic, label, tip, cls, id) => `<button type="button" class="tp-tb-btn${cls ? ' ' + cls : ''}" data-act="${act}"${id !== undefined ? ` data-id="${id}"` : ''} title="${tip || label}"${tip || label ? ` aria-label="${tip || label}"` : ''}>${ic}${label ? `<span>${label}</span>` : ''}</button>`;
  const sep = '<span class="tp-tb-sep"></span>';
  let html = `<div class="tp-tb pgi-tb" role="toolbar" aria-label="${L('Images sur les pages','Images on pages')}">
    <span class="tp-col-wrap pgi-list-wrap"><button type="button" class="tp-tb-chip pgi-chip${pgiListOpen ? ' on' : ''}" data-act="pgiListToggle" title="${L('Toutes les images du scénario (aller à une image, supprimer)','All images in the script (go to an image, delete)')}" aria-expanded="${pgiListOpen}">${icon('image')}${m ? '' : L('Images','Images')}${n ? ` <b>${n}</b>` : ''}<svg class="pgi-caret" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4l2.5 2.5L7.5 4"/></svg></button>${pgiListOpen ? pgiListHtml() : ''}</span>
    ${b('pgiPickFiles', icon('plus'), L('Ajouter','Add'), L('Ajouter une ou plusieurs images sur la page affichée (ou glisse-les sur une page, ou Ctrl+V)','Add one or more images on the page shown (or drop them on a page, or Ctrl+V)'), 'pgi-tb-add')}
    ${sep}`;
  if(m){
    const cropped = !!(m.cl || m.ct || m.cr || m.cb);
    html += `${b('pgiToggleCrop', I.crop, pgiCrop ? L('Valider','Apply') : L('Rogner','Crop'), pgiCrop ? L('Valider le rognage (Entrée)','Apply the crop (Enter)') : L('Rogner : tire les bords, glisse l’image dans le cadre (Entrée ou double-clic)','Crop: pull the edges, drag the image inside the frame (Enter or double-click)'), pgiCrop ? 'on pgi-crop-on' : '')}
    ${cropped ? b('pgiUncrop', I.whole, '', L('Retrouver l’image entière (annuler le rognage)','Get the whole image back (undo the crop)')) : ''}
    ${b('pgiRatio', I.ratio, '', L('Rétablir les proportions d’origine','Restore the original proportions'))}
    ${sep}
    <span class="pgi-seg" role="group" aria-label="${L('Position par rapport au texte','Position relative to the text')}">
      ${b('pgiSetFront', I.front, L('Devant','Front'), L('Image devant le texte','Image in front of the text'), m.back ? '' : 'on')}
      ${b('pgiSetBack', I.back, L('Derrière','Behind'), L('Image derrière le texte, comme un fond','Image behind the text, like a background'), m.back ? 'on' : '')}
    </span>
    ${b('pgiForward', I.up, '', L('Mettre au premier plan (au-dessus des autres images)','Bring to front (above the other images)'))}
    ${b('pgiBackward', I.down, '', L('Mettre à l’arrière-plan (sous les autres images)','Send to back (under the other images)'))}
    ${sep}
    <span class="tp-col-wrap pgi-op-wrap">
      ${b('pgiOpToggle', I.op, `<em id="pgiOpBtnVal">${Math.round(m.op * 100)} %</em>`, L('Opacité','Opacity'), 'pgi-op-btn' + (pgiOpOpen ? ' on' : ''))}
      ${pgiOpOpen ? `<div class="tp-tb-pop pgi-op-pop" data-stop="1">
        <div class="pgi-op-head"><span>${L('Opacité','Opacity')}</span><em id="pgiOpVal">${Math.round(m.op * 100)} %</em></div>
        <input type="range" id="pgiOpacity" min="0.1" max="1" step="0.05" value="${m.op}" aria-label="${L('Opacité','Opacity')}">
        <div class="pgi-op-presets">${[0.25, 0.5, 0.75, 1].map(v => `<button type="button" class="tp-tb-auto${Math.abs(m.op - v) < 0.001 ? ' on' : ''}" data-act="pgiSetOp" data-id="${v}">${v * 100} %</button>`).join('')}</div>
      </div>` : ''}
    </span>
    ${b('pgiDuplicate', icon('copy'), '', L('Dupliquer (Ctrl+D)','Duplicate (Ctrl+D)'))}
    ${b('pgiRemove', icon('trash'), '', L('Supprimer (Suppr)','Delete (Del)'), 'tp-tb-del')}`;
  } else {
    html += `<span class="pgi-tb-hint">${n ? L('Clique sur une image pour la modifier','Click an image to edit it') : L('Glisse des images sur une page, ou « + Image » en haut de la page voulue','Drop images on a page, or “+ Image” at the top of the page you want')}</span>`;
  }
  html += `${sep}
    ${b('pgiExit', I.done, L('Terminé','Done'), L('Revenir à l’écriture (Échap)','Back to writing (Esc)'), 'pgi-tb-done')}
  </div>`;
  return html;
}
function pgiBarSync(){
  let bar = document.getElementById('pgiBar');
  if(!pgiOn){ if(bar) bar.remove(); return; }
  const pane = document.getElementById('centerPane');
  if(!pane) return;
  if(!bar){
    bar = document.createElement('div'); bar.id = 'pgiBar'; bar.className = 'pgi-bar';
    document.body.appendChild(bar);
    bar.addEventListener('input', e => {
      if(e.target && e.target.id === 'pgiOpacity'){
        const m = pgiFind(pgiSel); if(!m) return;
        if(!bar._opPushed){ pgiPush(); bar._opPushed = true; }
        m.op = +e.target.value; pgiApply(m);
        ['pgiOpVal','pgiOpBtnVal'].forEach(id => { const v = document.getElementById(id); if(v) v.textContent = Math.round(m.op * 100) + ' %'; });
        document.querySelectorAll('#pgiBar [data-act="pgiSetOp"]').forEach(x => x.classList.toggle('on', Math.abs(+x.dataset.id - m.op) < 0.001));
        pgiSaveLater();
      }
    });
    bar.addEventListener('change', e => { if(e.target && e.target.id === 'pgiOpacity'){ bar._opPushed = false; pgiSaveNow(); pgiSig = ''; pgiBarSync(); } });
  }
  const html = pgiBarHtml();
  if(bar._html !== html){ bar.innerHTML = html; bar._html = html; bar._fit = null; }
  const r = pane.getBoundingClientRect();
  bar.style.top = Math.round(r.top + 12) + 'px';
  bar.style.left = Math.round(r.left + 12) + 'px';
  bar.style.width = Math.max(260, Math.round(r.width - 24)) + 'px';
  // Pas assez de place sur une ligne : les boutons secondaires ne gardent que leur icône (le nom reste en info-bulle).
  const tb = bar.querySelector('.pgi-tb'), key = bar.style.width + '|' + (bar._html || '').length;
  if(tb && bar._fit !== key){
    bar._fit = key;
    tb.classList.remove('is-tight', 'is-compact');
    if(tb.offsetHeight > 52) tb.classList.add('is-tight');
    if(tb.offsetHeight > 52) tb.classList.add('is-compact');
  }
}
window.addEventListener('resize', () => { if(pgiOn) pgiBarSync(); });

/* ---- Actions de la barre ---- */
function pgiCur(){ return pgiSel ? pgiFind(pgiSel) : null; }
function pgiToggleCrop(){ if(!pgiCur()) return; pgiCrop = !pgiCrop; pgiOpOpen = false; pgiRender(true); }
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
function pgiSetFront(){ const m = pgiCur(); if(m && m.back) pgiToggleBack(); }
function pgiSetBack(){ const m = pgiCur(); if(m && !m.back) pgiToggleBack(); }
function pgiOpToggle(){ pgiOpOpen = !pgiOpOpen; pgiBarSync(); }
/* Referme le réglage d'opacité sans reconstruire la barre : le clic en cours (sur un autre bouton) n'est pas perdu. */
function pgiOpClose(){
  pgiOpOpen = false;
  const bar = document.getElementById('pgiBar'); if(!bar) return;
  const pop = bar.querySelector('.pgi-op-pop'); if(pop) pop.remove();
  const btn = bar.querySelector('.pgi-op-btn'); if(btn) btn.classList.remove('on');
  bar._html = null;
}
function pgiSetOp(v){
  const m = pgiCur(); v = +v; if(!m || !(v >= 0.1 && v <= 1) || m.op === v) return;
  pgiPush(); m.op = v; pgiApply(m); pgiSaveNow(); pgiSig = ''; pgiBarSync();
}
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
/* Remplacer l'image sélectionnée par une autre : même place, même largeur, nouvelles proportions. */
function pgiReplace(){
  const m = pgiCur(); if(!m) return;
  pgiPickFiles();
  pgiPickReplace = m.id; pgiPickAt = null;
  const inp = document.getElementById('pgiFileInput'); if(inp) inp.multiple = false;
}
async function pgiReplaceWith(id, file){
  if(!file) return;
  const r = await pgiReadFile(file);
  if(!r){ toast(L('Format d’image non reconnu par le navigateur : ','Image format not recognised by the browser: ') + (file.name || '')); return; }
  const m = pgiFind(id); if(!m) return;
  pgiPush();
  const cy = m.y + m.h / 2;
  m.src = r.src; m.ar = r.ar; m.cl = m.ct = m.cr = m.cb = 0;
  m.h = m.w * r.ar * pgiPageRatio(); m.y = cy - m.h / 2;
  pgiSel = m.id; pgiCrop = false;
  pgiChanged(true);
  toast(L('Image remplacée.','Image replaced.'));
}
/* Liste de toutes les images du scénario : aller à l'une d'elles, la supprimer, ou tout supprimer. */
function pgiListHtml(){
  const g = pgiGeo(), list = pgiList().slice().sort((a, b) => pgiPageOf(a, g ? g.count : 1) - pgiPageOf(b, g ? g.count : 1));
  const rows = list.map(m => {
    const k = pgiPageOf(m, g ? g.count : 1);
    return `<div class="pgi-li${m.id === pgiSel ? ' on' : ''}">
      <button type="button" class="pgi-li-go" data-act="pgiGoTo" data-id="${m.id}" title="${L('Aller à cette image','Go to this image')}">
        <span class="pgi-li-th"><img src="${m.src}" alt="" draggable="false"></span>
        <span class="pgi-li-t"><b>${L('Page ','Page ')}${esc(pgiPageLabel(k))}</b><small>${pgiDimText(m)} · ${m.back ? L('derrière le texte','behind text') : L('devant le texte','in front of text')}</small></span>
      </button>
      <button type="button" class="pgi-li-del" data-act="pgiRemoveId" data-id="${m.id}" title="${L('Supprimer cette image','Delete this image')}" aria-label="${L('Supprimer cette image','Delete this image')}">${icon('trash')}</button>
    </div>`;
  }).join('');
  return `<div class="tp-tb-pop pgi-list-pop" data-stop="1">
    <div class="pgi-list-head"><b>${L('Images du scénario','Images in the script')}</b><small>${list.length}</small></div>
    ${list.length ? `<div class="pgi-list">${rows}</div>
    <button type="button" class="pgi-list-clear" data-act="pgiRemoveAll">${icon('trash')}${L('Supprimer toutes les images','Delete all images')}</button>`
    : `<p class="pgi-list-empty">${L('Aucune image pour l’instant.','No images yet.')}</p>`}
  </div>`;
}
function pgiListToggle(){ pgiListOpen = !pgiListOpen; pgiOpOpen = false; pgiBarSync(); }
function pgiListClose(){
  pgiListOpen = false;
  const bar = document.getElementById('pgiBar'); if(!bar) return;
  const pop = bar.querySelector('.pgi-list-pop'); if(pop) pop.remove();
  const btn = bar.querySelector('.pgi-chip'); if(btn) btn.classList.remove('on');
  bar._html = null;
}
function pgiGoTo(id){
  const m = pgiFind(id); if(!m) return;
  pgiListOpen = false;
  pgiSel = id; pgiCrop = false; pgiRender(true);
  const n = document.querySelector(`.pgi[data-pgi="${id}"]`), pane = document.getElementById('centerPane');
  if(n && pane){ const r = n.getBoundingClientRect(), pr = pane.getBoundingClientRect(); pane.scrollTop += (r.top + r.height / 2) - (pr.top + pr.height / 2) + 30; }
}
function pgiRemoveId(id){
  if(!pgiFind(id)) return;
  pgiSel = id; pgiRemove();
}
async function pgiRemoveAll(){
  const n = pgiList().length; if(!n) return;
  pgiListClose();
  if(!await mmConfirm(L('Supprimer les ' + n + ' images du scénario ? (Ctrl+Z pour revenir en arrière)', 'Delete all ' + n + ' images in the script? (Ctrl+Z to undo)'), { title:L('Supprimer toutes les images','Delete all images'), ok:L('Tout supprimer','Delete all'), danger:true })) return;
  pgiPush();
  delete S.project.pageImages;
  pgiSel = null; pgiCrop = false;
  pgiChanged(true);
  toast(L('Images supprimées (Ctrl+Z pour les retrouver).','Images deleted (Ctrl+Z to get them back).'));
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
  if(pgiOpOpen && !t.closest('.pgi-op-wrap')) pgiOpClose();
  if(pgiListOpen && !t.closest('.pgi-list-wrap')) pgiListClose();
  if(t.closest('#pgiBar') || t.closest('.pgi-add') || t.closest('.pgi-qa')) return;
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

/* Le curseur revient dans le texte (nouveau carton, nouvelle scène…) : on quitte le mode Images pour écrire. */
document.addEventListener('focusin', e => {
  if(pgiOn && e.target && e.target.closest && e.target.closest('#page .line')) pgiExit();
}, true);

/* ---- Clavier (seulement en mode Images, jamais pendant la frappe dans un champ) ---- */
document.addEventListener('keydown', e => {
  if(!pgiOn) return;
  const t = e.target;
  if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) && !(t.id === 'pgiOpacity')) return;
  if(document.querySelector('.modal-backdrop')) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key;
  let done = true;
  if(k === 'Escape' && pgiOpOpen) pgiOpClose();
  else if(k === 'Escape' && pgiListOpen) pgiListClose();
  else if(k === 'Escape'){ if(pgiCrop){ pgiCrop = false; pgiRender(true); } else if(pgiSel){ pgiSel = null; pgiRender(true); } else pgiExit(); }
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
    pgiApply(m); pgiSaveLater(); pgiSig = '';
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
  pgiDropHint(e);
}, true);
/* Pendant qu'on survole les pages avec des fichiers : la feuille visée s'entoure, avec son numéro. */
let pgiDropT = 0;
function pgiDropHint(e){
  const g = pgiGeo(), stack = document.getElementById('pageStack'), Ls = pgiLayers();
  if(!g || !stack || !Ls) return;
  const sr = stack.getBoundingClientRect(), z = sr.width / (stack.offsetWidth || 1) || 1;
  const k = Math.max(0, Math.min(g.count - 1, Math.floor((e.clientY - sr.top) / z / g.step)));
  let h = document.getElementById('pgiDropHint');
  if(!h){ h = document.createElement('div'); h.id = 'pgiDropHint'; h.className = 'pgi-drop'; Ls.front.appendChild(h); }
  if(h._k !== k){
    h._k = k; h.style.top = (k * g.step) + 'px'; h.style.height = g.pageH + 'px';
    h.innerHTML = `<span>${icon('image')}${L('Déposer sur la page ','Drop on page ')}${esc(pgiPageLabel(k))}</span>`;
  }
  clearTimeout(pgiDropT);
  pgiDropT = setTimeout(pgiDropHintOff, 160);
}
function pgiDropHintOff(){ clearTimeout(pgiDropT); const h = document.getElementById('pgiDropHint'); if(h) h.remove(); }
document.addEventListener('drop', e => {
  if(!S.project || S.view !== 'editor' || S.tab !== 'editor') return;
  if(!e.target || !e.target.closest || !e.target.closest('#pageStack')) return;
  const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []).filter(f => /^image\//.test(f.type || ''));
  pgiDropHintOff();
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
  pgiToggleBack, pgiForward, pgiBackward, pgiDuplicate, pgiRemove,
  pgiSetFront, pgiSetBack, pgiOpToggle, pgiSetOp, pgiAddHere,
  pgiReplace, pgiListToggle, pgiGoTo, pgiRemoveId, pgiRemoveAll
});

/* =====================================================================
   EXPORT MENU
===================================================================== */
function openExportMenu(){
  const html = `<div class="modal-backdrop" id="exportBackdrop" data-act="closeExportMenu">
    <div class="modal" style="max-width:400px;" data-stop="1">
      <h2>${L('Exporter','Export')}</h2>
      <button class="btn" style="width:100%;margin-bottom:8px;justify-content:flex-start;" data-act="printScript">${icon('printer')} ${L('PDF (imprimer / aperçu du navigateur)','PDF (print / browser preview)')}</button>
      <button class="btn" style="width:100%;margin-bottom:8px;justify-content:flex-start;" data-act="exportTXT">${icon('filetext')} ${L('Texte (.txt)','Text (.txt)')}</button>
      <button class="btn" style="width:100%;margin-bottom:8px;justify-content:flex-start;" data-act="exportFountain">${icon('drop')} Fountain (.fountain)</button>
      <button class="btn" style="width:100%;margin-bottom:8px;justify-content:flex-start;" data-act="exportFDX">${icon('film')} Final Draft (.fdx)</button>
      <button class="btn" style="width:100%;margin-bottom:8px;justify-content:flex-start;" data-act="wdOpenSides">${icon('user')} ${L('Sides pour un acteur…','Actor sides…')}</button>
      <div style="border-top:1px solid var(--hair);margin:14px 0 12px;"></div>
      <button class="btn" style="width:100%;justify-content:flex-start;" data-act="exportBackup">${icon('save')} ${L('Sauvegarde complète (.smmproj)','Full backup (.smmproj)')}</button>
      <p style="font-size:12.5px;color:var(--ink-soft);margin-top:10px;line-height:1.5;">${L('Les notes, outlines et tags ne sont jamais inclus dans les exports.<br>La <strong>sauvegarde complète</strong>, elle, contient tout le projet (notes, outlines, tags, versions, cimetière, page de titre) dans un fichier à garder hors du navigateur. Pour la rouvrir : « Importer », sur l\u2019accueil.','Notes, outlines and tags are never included in exports.<br>The <strong>full backup</strong>, on the other hand, contains the entire project (notes, outlines, tags, versions, graveyard, title page) in a file to keep outside the browser. To reopen it: \u201cImport\u201d, on the home screen.')}</p>
      <div class="modal-actions"><button class="btn" data-act="closeExportMenu">${L('Fermer','Close')}</button></div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}
function closeExportMenu(){ const b=document.getElementById('exportBackdrop'); if(b) b.remove(); }

/* Construit hors écran le flux réellement exporté (les notes en sont
   exclues, la pagination de l'export n'est donc pas celle de l'éditeur) et
   renvoie sa répartition en pages. Les éléments renvoyés sont de vrais
   nœuds DOM, prêts à être replacés dans les pages d'impression. */
function measureExportPages(p){
  ensureSettings(p);   // v49 : grille standard + migration, même si l'export est lancé avant l'ouverture complète
  const wrap = document.createElement('div');
  wrap.className = FORMATS[p.format].cls;
  const mc = document.createElement('div'); mc.id = 'pageMeasure';
  const numbers = sceneNumbers();
  const els = visibleElements();
  const marks = contdMap(els);
  // Ici la mention est écrite EN DUR dans le texte (et non en ::after comme
  // dans l'éditeur) : ce montage alimente la pagination, l'export PDF et
  // l'impression, qui relisent tout le texte réel des nœuds.
  appendFlow(mc, els, el=>{
    const div = document.createElement('div');
    div.className = 'line line--' + el.type;
    div.dataset.type = el.type; div.dataset.id = el.id;
    div.textContent = contdText(el, marks);
    if(el.type==='scene' && p.settings.showSceneNumbers && numbers[el.id]) div.dataset.sceneNum = numbers[el.id] + '.';
    applyCardStyle(div, el);
    return div;
  });
  wrap.appendChild(mc); document.body.appendChild(wrap);
  const res = computePagination(mc, p.format, false, p);
  wrap.remove();                       // les nœuds restent utilisables une fois détachés
  return res;
}
/* Nombre de pages réel du scénario (utilisé par les statistiques). */
function measuredPageCount(){
  try{ return measureExportPages(S.project).pageCount; }
  catch(e){ return computeStats().pages; }
}

/* =====================================================================
   LONGUEUR DES SCÈNES, EN HUITIÈMES DE PAGE
   ---------------------------------------------------------------------
   POURQUOI : Raging Page savait dire combien de pages fait un SCÉNARIO, mais
   pas combien fait une SCÈNE. Or c'est à l'échelle de la scène qu'on juge
   le rythme — repérer la scène de six pages qui plombe un deuxième acte,
   ou l'enchaînement de douze scènes d'un huitième qui part en confettis.
   WriterDuet affiche cette longueur, Raging Page non : on la lisait en
   faisant défiler.

   POURQUOI EN HUITIÈMES ET PAS EN POURCENTAGE : c'est l'unité du métier.
   Un dépouillement, un plan de travail, une feuille de service comptent en
   huitièmes de page depuis toujours (« 2 3/8 »). Afficher « 0,42 page »
   obligerait à retraduire. Par convention la fraction ne se simplifie
   jamais : on écrit 4/8, pas 1/2.

   COMMENT : on réutilise exactement le montage hors écran de
   measureExportPages() — mêmes classes CSS, mêmes marges, donc les mêmes
   hauteurs que l'export. La longueur d'une scène est l'écart entre le haut
   de son entête et le haut de l'entête suivante, ce qui inclut au passage
   les espacements entre blocs. Les notes sont exclues, comme à l'export.
===================================================================== */
function eighthsLabel(eighths){
  const pages = Math.floor(eighths / 8);
  const rest = eighths % 8;
  if(pages && rest) return pages + ' ' + rest + '/8';
  if(pages) return pages + (pages > 1 ? ' pages' : ' page');
  return rest + '/8';
}
function sceneLengths(){
  const p = S.project;
  const out = {};
  try{
    const wrap = document.createElement('div');
    wrap.className = FORMATS[p.format].cls;
    const mc = document.createElement('div'); mc.id = 'pageMeasure';
    const numbers = sceneNumbers();
    const els = visibleElements();
    const marks = contdMap(els);
    appendFlow(mc, els, el=>{
      const div = document.createElement('div');
      div.className = 'line line--' + el.type;
      div.dataset.type = el.type; div.dataset.id = el.id;
      div.textContent = contdText(el, marks);
      if(el.type==='scene' && p.settings.showSceneNumbers && numbers[el.id]) div.dataset.sceneNum = numbers[el.id] + '.';
      applyCardStyle(div, el);
      return div;
    });
    wrap.appendChild(mc); document.body.appendChild(wrap);

    const geo = pageGeometry(mc, p.format);
    const lines = Array.from(mc.children);
    // Bornes de chaque scène : indice de son entête, et indice de l'entête
    // suivante (ou fin du script).
    const heads = [];
    lines.forEach((d, i)=>{ if(d.dataset.type === 'scene') heads.push(i); });
    heads.forEach((start, k)=>{
      const nextStart = (k + 1 < heads.length) ? heads[k+1] : lines.length;
      const last = lines[nextStart - 1];
      const height = (last.offsetTop + last.offsetHeight) - lines[start].offsetTop;
      // Toute scène pèse au moins 1/8 : une scène d'une seule ligne existe
      // quand même dans un plan de travail, elle ne vaut pas zéro.
      const eighths = Math.max(1, Math.round(height / geo.contentH * 8));
      out[lines[start].dataset.id] = eighths;
    });
    wrap.remove();
  }catch(e){ /* mesure impossible : on n'affiche simplement pas la longueur */ }
  return out;
}

/* Ancien chemin d'export : on laisse le navigateur fabriquer le PDF via sa
   boîte d'impression. Il reste disponible sous « Imprimer », parce qu'il a
   l'avantage de donner un aperçu et de permettre d'imprimer sur papier —
   mais ce n'est plus lui qui produit le fichier PDF téléchargé (voir
   exportPDF plus bas : sur certaines machines, le PDF sorti de la boîte
   d'impression était illisible, et ce moteur-là ne nous appartient pas). */
function printScript(){
  closeExportMenu();
  const p = S.project;
  ensureSettings(p);
  const numbers = sceneNumbers();
  const sizeCss = p.format==='us' ? '@page{size:letter;margin:0;}' : '@page{size:A4;margin:0;}';
  let old = document.getElementById('printPageSize');
  if(old) old.remove();
  const styleTag = document.createElement('style'); styleTag.id='printPageSize'; styleTag.textContent = sizeCss;
  document.head.appendChild(styleTag);

  let old2 = document.getElementById('printArea'); if(old2) old2.remove();
  const wrap = document.createElement('div'); wrap.id='printArea'; wrap.className = FORMATS[p.format].cls;

  if(p.settings.titlePageEnabled){
    wrap.appendChild(buildTitlePageEl(p));
  }

  // Mêmes sauts de page que dans l'éditeur : une feuille = une page PDF.
  const res = measureExportPages(p);
  const PLB = computePageLabels(res.pages, p), PLX = PLB.labels;
  const cont = p.settings.showContinued ? firstSceneOfEachPage(res.pages, numbers, res.spill) : {};
  PLB.free.forEach((f, k) => { if(f) delete cont[k]; });   // une page sans numéro ne porte aucune mention de continuité
  res.pages.forEach((linesOfPage, k)=>{
    // Feuille entièrement occupée par le débordement d'un bloc géant :
    // elle n'existe pas en tant que page, le bloc la traverse déjà.
    if(res.spill[k] && !linesOfPage.length) return;
    const sheet = document.createElement('div');
    sheet.className = 'print-page';
    if(res.spill[k+1]) sheet.style.height = 'auto';   // laisse le bloc géant se répartir
    const num = PLX[k];
    if(pageNumShown(PLB, k, p.settings)){
      const n = document.createElement('div'); n.className='sheet-num'; n.textContent = num + '.';
      sheet.appendChild(n);
    }
    if(cont[k]){
      const ct = document.createElement('div'); ct.className='sheet-cont is-top';
      ct.textContent = pageContWord('top'); sheet.appendChild(ct);
    }
    if(cont[k+1] && !PLB.free[k] && !PLB.free[k+1]){
      const c = document.createElement('div'); c.className='sheet-cont is-bottom';
      c.textContent = pageContWord('bottom'); sheet.appendChild(c);
    }
    if(p.settings.watermarkText){
      const wm = document.createElement('div'); wm.className = 'sheet-watermark';
      wm.textContent = p.settings.watermarkText; sheet.appendChild(wm);
    }
    linesOfPage.forEach((div, ix)=>{ sheet.appendChild(div); div.classList.toggle('pg-first', ix === 0); });
    try{ pgiDecorateSheet(sheet, k, p, res.pages.length); }catch(e){}   // images sur les pages (js/37-page-images.js)
    wrap.appendChild(sheet);
  });

  document.body.appendChild(wrap);
  try{ rpDecoratePrint(wrap); }catch(e){}   // v85 : surlignages et soulignements
  // Révisions colorées : la zone d'impression est masquée à l'écran, on la
  // rend mesurable un instant (hors champ) pour poser les astérisques.
  try{
    wrap.style.cssText = 'display:block; position:fixed; left:-20000px; top:0; visibility:hidden;';
    revDecorateSheets(Array.from(wrap.querySelectorAll('.print-page')), p);
  }catch(e){}
  wrap.style.cssText = '';

  // CORRECTIF. L'ancienne version retirait la zone d'impression 500 ms après
  // l'appel à window.print(). Or window.print() ne rend pas la main de la
  // même façon partout : sur Firefox et sur plusieurs navigateurs mobiles,
  // l'aperçu se construit de façon asynchrone et la fonction retourne
  // immédiatement. Le contenu était donc arraché du document pendant que le
  // PDF était encore en train d'être écrit — d'où un fichier vide ou
  // tronqué, que le navigateur refuse ensuite de rouvrir. On attend
  // maintenant le signal de fin d'impression du navigateur, avec deux
  // filets de sécurité pour ceux qui ne l'émettent pas.
  const restoreTitle = document.title;
  document.title = p.title || 'scenario';     // nom de fichier proposé pour le PDF

  let cleaned = false, safety = null;
  const mql = window.matchMedia ? window.matchMedia('print') : null;
  const onLeavePrint = ev => { if(!ev.matches) cleanup(); };
  function cleanup(){
    if(cleaned) return;
    cleaned = true;
    window.removeEventListener('afterprint', cleanup);
    if(mql && mql.removeEventListener) mql.removeEventListener('change', onLeavePrint);
    if(safety) clearTimeout(safety);
    wrap.remove(); styleTag.remove();
    document.title = restoreTitle;
  }
  window.addEventListener('afterprint', cleanup);
  if(mql && mql.addEventListener) mql.addEventListener('change', onLeavePrint);
  // Dernier filet, pour les navigateurs qui n'émettent ni afterprint ni le
  // changement de média. La zone d'impression étant invisible à l'écran,
  // la laisser en place deux minutes ne gêne rien.
  safety = setTimeout(cleanup, 120000);

  setTimeout(()=>{ window.print(); }, 60);
}

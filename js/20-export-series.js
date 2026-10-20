/* =====================================================================
   EXPORT DE SÉRIE — un, plusieurs, toute une saison, ou toute la série
   ---------------------------------------------------------------------
   Le moteur de pagination/export existant (measureExportPages, sceneNumbers,
   visibleElements…) lit toujours S.project. Plutôt que de le réécrire pour
   qu'il accepte un projet en paramètre, on bascule temporairement S.project
   sur l'épisode à traiter, le temps de construire ses pages, puis on
   restaure le projet réellement ouvert. Chaque épisode garde ainsi son
   PDF de qualité identique à un export individuel classique.
===================================================================== */
async function withSwappedProject(p, fn){
  const prev = S.project;
  S.project = p;
  applyScriptFont(p);
  try{ return await fn(); }
  finally{ S.project = prev; applyScriptFont(prev); }
}
async function buildEpisodePagesForPDF(p){
  if(!p.tagDefs) p.tagDefs = {};
  await tpPreloadFonts(p);
  return withSwappedProject(p, ()=>{
    ensureSettings(p); ensureTPDesign(p);
    const numbers = sceneNumbers();
    const built = buildPdfStage(p, numbers);
    const pages = built.sheets.map(s=>{
      const data = pdfReadSheet(s.el);
      if(s.isTitle) data.pattern = ensureTPDesign(p);
      return data;
    });
    built.stage.remove();
    return pages;
  });
}
function openSeriesExportMenu(seriesId){
  const entries = seriesEntries(seriesId);
  if(!entries.length) return;
  const bySeason = {};
  entries.forEach(e=>{ const s=e.season||1; (bySeason[s]=bySeason[s]||[]).push(e); });
  const seasonNums = Object.keys(bySeason).map(Number).sort((a,b)=>a-b);
  const body = seasonNums.map(sn=>{
    const eps = bySeason[sn];
    const rows = eps.map(e=>`
      <label style="display:flex;gap:8px;align-items:center;font-size:13px;padding:3px 0;">
        <input type="checkbox" class="expChk" data-id="${e.id}" checked> ${L('Épisode','Episode')} ${e.episode||1}${e.title?(' · '+esc(e.title)):''}
      </label>`).join('');
    return `<div class="expSeasonGroup" data-season="${sn}" style="margin-bottom:10px;">
      <label style="display:flex;gap:8px;align-items:center;font-size:13px;font-weight:600;padding:3px 0;">
        <input type="checkbox" class="expSeasonChk" data-season="${sn}" checked> ${L('Saison','Season')} ${sn}${eps[0] && eps[0].seasonName ? ' — ' + esc(eps[0].seasonName) : ''} (${L('tout','all')})
      </label>
      <div style="padding-left:22px;">${rows}</div>
    </div>`;
  }).join('');
  const html = `<div class="modal-backdrop" id="seriesExportBackdrop" data-act="closeSeriesExportMenu">
    <div class="modal" style="max-width:440px;" data-stop="1">
      <h2>${L('Exporter la série','Export the series')}</h2>
      <p style="font-size:12.5px;color:var(--ink-soft);margin-top:-6px;">${L('Coche un seul épisode, plusieurs, une saison entière (case du haut), ou toute la série.','Check a single episode, several, a whole season (top checkbox), or the whole series.')}</p>
      <div style="max-height:260px;overflow:auto;margin:10px 0;border:1px solid var(--hair);border-radius:var(--radius);padding:10px;">${body}</div>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <button class="btn btn-sm" data-act="seriesExportSelectAll" data-id="1">${L('Tout cocher','Check all')}</button>
        <button class="btn btn-sm" data-act="seriesExportSelectAll" data-id="0">${L('Tout décocher','Uncheck all')}</button>
      </div>
      <button class="btn" style="width:100%;margin-bottom:8px;justify-content:flex-start;" data-act="doSeriesExport" data-id="${seriesId}" data-mode="pdfMerged">${icon('files')} ${L('PDF (un seul fichier fusionné)','PDF (one merged file)')}</button>
      <button class="btn" style="width:100%;margin-bottom:8px;justify-content:flex-start;" data-act="doSeriesExport" data-id="${seriesId}" data-mode="pdfSeparate">${icon('pdf')} ${L('PDF (un fichier par épisode)','PDF (one file per episode)')}</button>
      <button class="btn" style="width:100%;margin-bottom:8px;justify-content:flex-start;" data-act="doSeriesExport" data-id="${seriesId}" data-mode="txt">${icon('filetext')} ${L('Texte (.txt), un seul fichier','Text (.txt), one file')}</button>
      <button class="btn" style="width:100%;margin-bottom:8px;justify-content:flex-start;" data-act="doSeriesExport" data-id="${seriesId}" data-mode="fountain">${icon('drop')} ${L('Fountain (.fountain), un seul fichier','Fountain (.fountain), one file')}</button>
      <button class="btn" style="width:100%;margin-bottom:8px;justify-content:flex-start;" data-act="doSeriesExport" data-id="${seriesId}" data-mode="fdx">${icon('film')} ${L('Final Draft (.fdx), un fichier par épisode','Final Draft (.fdx), one file per episode')}</button>
      <p style="font-size:12.5px;color:var(--ink-soft);margin-top:14px;">${L('Les notes, outlines et tags ne sont jamais inclus dans les exports.','Notes, outlines and tags are never included in exports.')}</p>
      <div class="modal-actions"><button class="btn" data-act="closeSeriesExportMenu">${L('Fermer','Close')}</button></div>
    </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  attachSeriesExportSeasonToggles();
}
function attachSeriesExportSeasonToggles(){
  document.querySelectorAll('.expSeasonChk').forEach(cb=>{
    cb.addEventListener('change', e=>{
      const group = e.target.closest('.expSeasonGroup');
      if(group) group.querySelectorAll('.expChk').forEach(x=> x.checked = e.target.checked);
    });
  });
}
function seriesExportSelectAll(val){
  const checked = val === '1';
  document.querySelectorAll('#seriesExportBackdrop .expChk, #seriesExportBackdrop .expSeasonChk').forEach(x=> x.checked = checked);
}
function closeSeriesExportMenu(){ const b=document.getElementById('seriesExportBackdrop'); if(b) b.remove(); }
async function doSeriesExport(seriesId, e){
  const btn = e.target.closest('[data-act]');
  const mode = btn ? btn.dataset.mode : null;
  const checkedIds = Array.from(document.querySelectorAll('#seriesExportBackdrop .expChk:checked')).map(x=>x.dataset.id);
  if(!checkedIds.length){ toast(L('Sélectionne au moins un épisode.','Select at least one episode.')); return; }
  const entries = seriesEntries(seriesId).filter(e=>checkedIds.includes(e.id));
  closeSeriesExportMenu();
  if(mode==='pdfMerged') await exportSeriesPDFMerged(entries);
  else if(mode==='pdfSeparate') await exportSeriesPDFSeparate(entries);
  else if(mode==='txt') await exportSeriesTXT(entries);
  else if(mode==='fountain') await exportSeriesFountain(entries);
  else if(mode==='fdx') await exportSeriesFDX(entries);
}
async function exportSeriesPDFMerged(entries){
  toast(L('Génération du PDF de la série…','Generating the series PDF…'));
  try{
    const jsPDF = await loadJsPdf();
    const allPages = [];
    for(const entry of entries){
      const p = await storGet(proj_key(entry.id));
      if(!p) continue;
      const pages = await buildEpisodePagesForPDF(p);
      pages.forEach(pg=> allPages.push(pg));
    }
    if(!allPages.length) throw new Error(L('rien à exporter','nothing to export'));
    const doc = new jsPDF({ unit:'pt', orientation:'portrait', format:[allPages[0].wPt, allPages[0].hPt], compress:true });
    allPages.forEach((page, i)=>{
      if(i>0) doc.addPage([page.wPt, page.hPt], 'portrait');
      pdfPaintPage(doc, page);
    });
    const seriesName = entries.find(e=>e.seriesName)?.seriesName || L('Série','Series');
    doc.setProperties({ title: seriesName });
    const filename = (seriesName.replace(/[\\/:*?"<>|]+/g,' ').trim() || 'serie') + '.pdf';
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=filename;
    document.body.appendChild(a); a.click(); a.remove();
    toast(L('PDF téléchargé (','PDF downloaded (') + entries.length + ' ' + L('épisode'+(entries.length>1?'s':'')+' fusionnés).','episode'+(entries.length>1?'s':'')+' merged).'));
    setTimeout(()=>{ try{ URL.revokeObjectURL(url); }catch(e){} }, 180000);
  }catch(err){
    console.error(err);
    toast(L('Impossible de générer le PDF (','Couldn’t generate the PDF (') + (err && err.message ? err.message : L('erreur inconnue','unknown error')) + ').');
  }
}
async function exportSeriesPDFSeparate(entries){
  toast(L('Génération des PDF…','Generating the PDFs…'));
  try{
    const jsPDF = await loadJsPdf();
    for(let i=0;i<entries.length;i++){
      const p = await storGet(proj_key(entries[i].id));
      if(!p) continue;
      const pages = await buildEpisodePagesForPDF(p);
      if(!pages.length) continue;
      const doc = new jsPDF({ unit:'pt', orientation:'portrait', format:[pages[0].wPt, pages[0].hPt], compress:true });
      pages.forEach((page, k)=>{ if(k>0) doc.addPage([page.wPt, page.hPt], 'portrait'); pdfPaintPage(doc, page); });
      doc.setProperties({ title:p.title || L('Épisode','Episode'), author:p.author||'' });
      const label = 'S' + (p.season||1) + 'E' + (p.episode||1);
      const filename = ((p.seriesName||L('Série','Series')) + ' - ' + label + ' - ' + (p.title||'Episode'))
        .replace(/[\\/:*?"<>|]+/g,' ').trim() + '.pdf';
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      // Un léger délai entre chaque téléchargement : plusieurs navigateurs
      // bloquent ou avalent les téléchargements déclenchés en rafale.
      await new Promise(res=>{
        setTimeout(()=>{
          const a = document.createElement('a'); a.href=url; a.download=filename;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(()=>{ try{ URL.revokeObjectURL(url); }catch(e){} }, 180000);
          res();
        }, i===0 ? 0 : 500);
      });
    }
    toast(entries.length + ' ' + L('PDF téléchargés (un par épisode).','PDFs downloaded (one per episode).'));
  }catch(err){
    console.error(err);
    toast(L('Impossible de générer les PDF (','Couldn’t generate the PDFs (') + (err && err.message ? err.message : L('erreur inconnue','unknown error')) + ').');
  }
}
async function exportSeriesFountain(entries){
  let out = '', first = null;
  for(const entry of entries){
    const p = await storGet(proj_key(entry.id));
    if(!p) continue;
    if(!p.tagDefs) p.tagDefs = {};
    if(!first) first = p;
    const head = (p.seriesName || L('Série','Series')) + ' · S' + (p.season||1) + 'E' + (p.episode||1) + (p.title ? (' · ' + p.title) : '');
    await withSwappedProject(p, ()=>{
      ensureSettings(p);
      const lg = revLegendText(p);
      out += (out ? '\n===\n\n' : '') + '# ' + head + '\n\n' + (lg ? '[[' + lg.replace(/\n+/g, ' — ') + ']]\n\n' : '') + elementsToText(visibleElements(), true) + '\n';
    });
  }
  if(!out) return;
  const seriesName = entries.find(e=>e.seriesName)?.seriesName || L('Série','Series');
  downloadBlob((seriesName.replace(/[\\/:*?"<>|]+/g,' ').trim() || 'serie') + '.fountain', 'Title: ' + seriesName + '\nAuthor: ' + ((first && first.author) || '') + '\n\n' + out, 'text/plain');
}
/* Final Draft : un script = un épisode, donc un .fdx par épisode. */
async function exportSeriesFDX(entries){
  let n = 0;
  for(const entry of entries){
    const p = await storGet(proj_key(entry.id));
    if(!p) continue;
    if(!p.tagDefs) p.tagDefs = {};
    let xml = '';
    await withSwappedProject(p, ()=>{ ensureSettings(p); xml = fdxDocument(p); });
    const nm = ((p.seriesName || L('Serie','Series')) + ' S' + (p.season||1) + 'E' + (p.episode||1) + (p.title ? ' ' + p.title : '')).replace(/[\\/:*?"<>|]+/g,' ').trim();
    downloadBlob(nm + '.fdx', xml, 'application/xml');
    if(++n < entries.length) await new Promise(r=>setTimeout(r, 400));   // laisse le navigateur accepter plusieurs téléchargements
  }
}
async function exportSeriesTXT(entries){
  let out = '';
  for(const entry of entries){
    const p = await storGet(proj_key(entry.id));
    if(!p) continue;
    if(!p.tagDefs) p.tagDefs = {};
    out += (p.seriesName || L('Série','Series')) + ' · S' + (p.season||1) + 'E' + (p.episode||1) + (p.title ? (' · ' + p.title) : '') + '\n';
    out += '='.repeat(44) + '\n\n';
    await withSwappedProject(p, ()=>{ const lg = revLegendText(p); if(lg) out += lg + '\n\n'; out += elementsToText(visibleElements(), false); });
    out += '\n\n';
  }
  const seriesName = entries.find(e=>e.seriesName)?.seriesName || L('Série','Series');
  downloadBlob((seriesName.replace(/[\\/:*?"<>|]+/g,' ').trim() || 'serie') + '.txt', out, 'text/plain');
}

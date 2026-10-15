/* =====================================================================
   COMPARAISON DE VERSIONS (« Compare » de WriterDuet)
   ---------------------------------------------------------------------
   L'historique savait déjà figer une version et la restaurer — mais en
   aveugle : impossible de voir ce qui séparait la version d'aujourd'hui
   de celle d'il y a trois jours autrement qu'en la restaurant pour aller
   regarder, donc en écrasant son travail en cours. C'est la fonction que
   WriterDuet met au cœur de son historique, et la seule qui manquait
   vraiment : montrer, ligne par ligne, ce qui a été AJOUTÉ et ce qui a
   été SUPPRIMÉ entre une version enregistrée et le scénario actuel.

   L'algorithme est une plus longue sous-séquence commune classique, avec
   deux précautions pour rester instantané même sur un long-métrage :
   on retire d'abord les débuts et fins identiques (dans la vraie vie,
   99 % du scénario n'a pas bougé), et on ne lance le calcul complet que
   si la zone qui reste est raisonnable. Deux lignes sont « la même » si
   elles ont le même type et le même texte, espaces superflus ignorés.
===================================================================== */
function diffKey(e){ return (e.type||'action') + '\u0000' + String(e.text||'').trim().replace(/\s+/g,' '); }
function diffElements(a, b){
  const A = a.map(diffKey), B = b.map(diffKey);
  let s = 0;
  while(s < A.length && s < B.length && A[s] === B[s]) s++;
  let ea = A.length, eb = B.length;
  while(ea > s && eb > s && A[ea-1] === B[eb-1]){ ea--; eb--; }
  const out = [];
  for(let i = 0; i < s; i++) out.push({ op:'=', el:b[i] });
  const ma = A.slice(s, ea), mb = B.slice(s, eb);
  if(ma.length * mb.length > 1200000){
    // Zone modifiée énorme : on n'invente pas un alignement fin, on
    // annonce le bloc tel quel plutôt que de faire ramer la page.
    for(let i = 0; i < ma.length; i++) out.push({ op:'-', el:a[s+i] });
    for(let j = 0; j < mb.length; j++) out.push({ op:'+', el:b[s+j] });
  }else{
    const n = ma.length, m = mb.length;
    const dp = new Uint32Array((n+1) * (m+1));
    const W = m + 1;
    for(let i = n-1; i >= 0; i--)
      for(let j = m-1; j >= 0; j--)
        dp[i*W+j] = (ma[i] === mb[j]) ? dp[(i+1)*W+j+1] + 1
                  : Math.max(dp[(i+1)*W+j], dp[i*W+j+1]);
    let i = 0, j = 0;
    while(i < n && j < m){
      if(ma[i] === mb[j]){ out.push({ op:'=', el:b[s+j] }); i++; j++; }
      else if(dp[(i+1)*W+j] >= dp[i*W+j+1]){ out.push({ op:'-', el:a[s+i] }); i++; }
      else { out.push({ op:'+', el:b[s+j] }); j++; }
    }
    while(i < n){ out.push({ op:'-', el:a[s+i] }); i++; }
    while(j < m){ out.push({ op:'+', el:b[s+j] }); j++; }
  }
  for(let k = eb; k < b.length; k++) out.push({ op:'=', el:b[k] });
  return out;
}
function diffExcerpt(t){
  const s = String(t || '').trim();
  return s ? esc(s.length > 300 ? s.slice(0,300) + '…' : s) : `<i>${L('(ligne vide)','(empty line)')}</i>`;
}
/* N'affiche que les passages qui bougent, avec deux lignes intactes
   autour pour savoir OÙ l'on est dans le scénario. */
function diffPanelHtml(){
  const ver = (S.project.versions || []).find(v => v.id === S.diffVerId);
  if(!ver) return '';
  const rows = diffElements(ver.elements || [], S.project.elements || []);
  const add = rows.filter(r => r.op === '+').length;
  const del = rows.filter(r => r.op === '-').length;
  const CTX = 2;
  const keep = new Array(rows.length).fill(false);
  rows.forEach((r, i) => {
    if(r.op === '=') return;
    for(let k = Math.max(0, i-CTX); k <= Math.min(rows.length-1, i+CTX); k++) keep[k] = true;
  });
  let html = '', gap = false;
  rows.forEach((r, i) => {
    if(!keep[i]){ gap = true; return; }
    if(gap){ html += '<div class="diff-gap">⋯</div>'; gap = false; }
    const cls = r.op === '+' ? 'diff-add' : r.op === '-' ? 'diff-del' : 'diff-ctx';
    const sign = r.op === '+' ? '+' : r.op === '-' ? '−' : '';
    html += `<div class="diff-line ${cls}"><span class="diff-sign">${sign}</span>
      <span class="diff-type">${typeLabelDisplay(r.el.type)}</span>
      <span class="diff-text">${diffExcerpt(r.el.text)}</span></div>`;
  });
  if(!add && !del) html = `<div class="diff-same">${L('Aucune différence : cette version est identique au scénario actuel.','No difference: this version is identical to the current screenplay.')}</div>`;
  return `<div class="diff-panel">
    <div class="diff-head">
      <div><b>${L('Comparaison','Comparison')}</b> — « ${esc(versionLabel(ver))} » (${new Date(ver.timestamp).toLocaleString(getLang()==='en'?'en-US':'fr-FR')}) ${L('face au scénario actuel','against the current screenplay')}</div>
      <button class="btn btn-sm btn-ghost" data-act="closeCompare">${icon('close')} ${L('Fermer','Close')}</button>
    </div>
    <div class="diff-legend"><span class="diff-badge add">+${add} ${L(add>1?'lignes ajoutées':'ligne ajoutée', add>1?'lines added':'line added')}</span>
      <span class="diff-badge del">−${del} ${L(del>1?'lignes supprimées':'ligne supprimée', del>1?'lines removed':'line removed')}</span>
      <span class="diff-note">${L('Le vert est ce qu\u2019il y a aujourd\u2019hui et qui n\u2019existait pas dans la version ; le rouge est ce que la version contenait et qui a disparu depuis.','Green is what exists today and didn\u2019t exist in that version; red is what the version contained and has since disappeared.')}</span></div>
    <div class="diff-body">${html}</div>
  </div>`;
}
function compareVersion(id){ S.diffVerId = (S.diffVerId === id) ? null : id; renderTabBody(); }
function closeCompare(){ S.diffVerId = null; renderTabBody(); }


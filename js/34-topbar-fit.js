/* =====================================================================
   BARRE DU HAUT QUI TIENT TOUJOURS EN ENTIER
   ---------------------------------------------------------------------
   Les paliers de compactage de la barre (style.css, « v36 ») dépendent de
   la largeur de la FENÊTRE. Or la place réellement prise par les boutons
   change aussi avec la langue (« Sauvegardé » / « Saved »), la puce Google
   Drive (« Drive à reconnecter »), l'indicateur de page, la police
   chargée... : à certaines largeurs, les derniers éléments (coffre, langue)
   passaient sous le bord et disparaissaient.

   Ici on regarde la place RÉELLE : tant que la partie gauche déborde, on
   applique le palier suivant (mêmes réglages et même ordre que ceux de
   style.css : police, libellés, statut en pastille, recherche réduite...).
   Quand tout tient, aucun palier n'est ajouté : la barre reste exactement
   telle qu'elle était.
===================================================================== */
const TB_FIT_LEVELS = 8;
let tbFitRO = null, tbFitBusy = false;
function tbFitOverflows(tb){
  const l = tb.querySelector('.topbar-left');
  return !!l && l.scrollWidth > l.clientWidth + 1;
}
function tbFit(){
  const tb = document.querySelector('.topbar');
  if(!tb || tbFitBusy) return;
  tbFitBusy = true;
  try{
    for(let k = 1; k <= TB_FIT_LEVELS; k++) tb.classList.remove('tb-c' + k);
    for(let k = 1; k <= TB_FIT_LEVELS && tbFitOverflows(tb); k++) tb.classList.add('tb-c' + k);
  }finally{ tbFitBusy = false; }
}
/* Appelée à chaque construction de l'éditeur : suit la taille de la barre et de chacun de ses éléments. */
function tbFitWatch(){
  const tb = document.querySelector('.topbar');
  if(!tb) return;
  if(tbFitRO) tbFitRO.disconnect();
  if(window.ResizeObserver){
    tbFitRO = new ResizeObserver(() => tbFit());
    tbFitRO.observe(tb);
    tb.querySelectorAll('.topbar-left, .topbar-left > *, .topbar-right > *').forEach(n => tbFitRO.observe(n));
  }
  tbFit();
}

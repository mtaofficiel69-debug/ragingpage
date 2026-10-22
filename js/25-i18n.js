/* =====================================================================
   LANGUE DE L'INTERFACE (FR / EN)
   ---------------------------------------------------------------------
   Raging Page est écrit en français dans son code, mais s'affiche en
   ANGLAIS par défaut. Un clic sur l'un des deux drapeaux traduit tout
   le CHROME de l'application (boutons, onglets, menus, paramètres,
   aides, messages) — jamais le contenu du scénario : le texte des
   scènes, les titres de projet, les noms de personnages, les tags, les
   notes personnelles et les commentaires restent exactement ce que
   l'utilisateur a écrit, quelle que soit la langue choisie.

   COMMENT ÇA MARCHE, SANS RÉÉCRIRE CHAQUE FONCTION D'AFFICHAGE
   Plutôt que de dupliquer des centaines de chaînes dans tout le code,
   un dictionnaire FR → EN est appliqué directement sur le DOM après
   chaque rendu : chaque nœud de texte est comparé, une fois débarrassé
   des espaces superflus, aux clés du dictionnaire — remplacé seulement
   en cas de correspondance EXACTE. Cette exactitude est ce qui protège
   le contenu de l'utilisateur : une scène, un nom de personnage ou un
   tag ne collera par hasard à une clé du dictionnaire que si l'auteur a
   nommé sa scène très exactement « Ouvrir » ou « Titre », un risque
   négligeable en pratique. Par prudence supplémentaire, la traduction
   n'entre de toute façon jamais dans les zones qui affichent du contenu
   utilisateur (liste I18N_EXCLUDE_SEL ci-dessous) : texte des scènes
   dans l'éditeur, cartes, outline, personnages, tags, notes, corbeille,
   historique, commentaires, page de titre, titres de projet.
   Un MutationObserver relance cette passe à chaque changement du DOM
   (nouvel onglet affiché, menu ouvert, toast affiché…) : aucune fonction
   d'affichage n'a besoin d'appeler quoi que ce soit explicitement.
===================================================================== */
const LANG_KEY = 'scriptmm_lang';
function getLang(){ try{ return localStorage.getItem(LANG_KEY) || 'en'; }catch(e){ return 'en'; } }
function setLangPref(l){ try{ localStorage.setItem(LANG_KEY, l); }catch(e){} try{ document.documentElement.lang = l; }catch(e){} }

/* Petit raccourci pour tout ce qui échappe forcément au dictionnaire :
   les boîtes natives prompt()/confirm() ne sont pas des éléments du DOM,
   le MutationObserver qui traduit le reste de l'appli ne peut donc jamais
   les voir. Ce sont les seuls endroits du fichier où le texte anglais est
   écrit à la main à côté du français, plutôt que dans le dictionnaire. */
function L(fr, en){ return getLang()==='en' ? en : fr; }

/* Dictionnaire FR (tel qu'écrit dans le code) -> EN. Une seule table à
   étendre si une phrase venait à manquer : aucune autre modification
   n'est nécessaire pour qu'une nouvelle entrée soit prise en compte. */
const I18N_EN = {
  'Nouveau scénario':'New screenplay',
  'Importer (.fdx / .fountain / .txt / .pdf)':'Import (.fdx / .fountain / .txt / .pdf)',
  'Ouvrir depuis mon ordinateur (.smmproj)':'Open from my computer (.smmproj)',
  'Comment faire':'How it works',
  'Écriture de scénario, structurée, sauvegardée automatiquement dans ce navigateur.':'Structured screenwriting, autosaved in this browser.',
  'Compatible Final Draft : les scénarios s\u2019importent et s\u2019exportent en .fdx, le format d\u2019échange du métier, plus Fountain, texte et PDF.':'Final Draft compatible: screenplays import and export as .fdx, the industry exchange format, plus Fountain, text and PDF.',
  'Aucun scénario pour l\u2019instant. Crée le premier, tu pourras écrire dès l\u2019écran suivant.':'No screenplay yet. Create the first one, you\u2019ll be writing on the very next screen.',
  'Un traitement de texte pensé pour le scénario, et rien d\u2019autre : format professionnel, pagination réelle, export Final Draft.':'A word processor built for screenwriting, and nothing else: professional format, real pagination, Final Draft export.',
  'Série':'Series', 'Renommer':'Rename', 'Renommer la série':'Rename series', 'Supprimer':'Delete',
  'Créer l\u2019épisode':'Create episode', 'Séries':'Series',
  'Filtrer les scènes…':'Filter scenes…',
  'Créer un scénario':'Create a screenplay', 'Titre':'Title', 'Format':'Format',
  'Français':'French', 'Américain':'American',
  'Scénario français':'French screenplay', 'Scénario américain':'American screenplay',
  'Marges et conventions du scénario français':'French screenplay margins and conventions',
  'Mise en page façon Hollywood':'Hollywood-style page layout',
  'Auteur':'Author', 'Annuler':'Cancel', 'Créer et commencer à écrire':'Create and start writing',
  'Le titre de ton scénario':'Your screenplay\u2019s title', 'Ton nom (facultatif)':'Your name (optional)',
  'Le nom de la série':'The series name', 'Ex. Origines':'E.g. Origins', 'Ex. Pilote':'E.g. Pilot',
  'Titre de l\u2019épisode':'Episode title', 'Nom de la série':'Series name',
  'Nom de la saison (facultatif)':'Season name (optional)',
  'Nom de l\u2019épisode (facultatif)':'Episode title (optional)', 'Saison':'Season', 'Épisode':'Episode',
  'Type de projet':'Project type', 'Ne rien afficher':'Show nothing',
  'Sur l\u2019accueil':'On the home screen', 'À l\u2019intérieur':'Inside the editor',
  'Pendant que tu écris':'While you write',
  'Tout s\u2019enregistre automatiquement dans ce navigateur, sans compte à créer.':'Everything is saved automatically in this browser, no account needed.',
  'Sauvegarde complète':'Full backup', 'Le fichier':'The file', 'sauvegarde complète':'full backup',
  'Quelques essentiels':'A few essentials', 'Maj':'Shift',
  'pour passer en ligne Personnage,':'to switch to a Character line,',
  'pour revenir en Action.':'to go back to Action.',
  'pour sauter à une scène.':'to jump to a scene.',
  'pour annuler. L\u2019historique couvre aussi le rechercher/remplacer.':'to undo. History also covers find/replace.',
  'Les notes, outlines et tags ne sont jamais inclus dans les exports.':'Notes, outlines and tags are never included in exports.',
  'Portfolio':'Portfolio', '+ Scène':'+ Scene', 'Retour au portfolio':'Back to portfolio',
  'Insérer une nouvelle entête de scène':'Insert a new scene heading',
  'Changer d\u2019apparence':'Switch appearance', 'Mode clair':'Light mode', 'Mode sombre':'Dark mode',
  'Annuler (Ctrl+Z)':'Undo (Ctrl+Z)', 'Rétablir (Ctrl+Shift+Z)':'Redo (Ctrl+Shift+Z)',
  'Sauvegardé':'Saved', 'Sauvegarde…':'Saving…',
  'Aller à une page…':'Go to page…', 'Page':'Page', 'Rechercher…':'Search…',
  'Plus d\u2019options':'More options', 'Coffre-fort':'Vault',
  'Rouvrir un scénario enregistré sur ton ordinateur, et rester relié à ce fichier':'Reopen a screenplay saved on your computer, and stay linked to that file',
  'Longueur de la scène, en huitièmes de page':'Scene length, in eighths of a page',
  'Rechercher & remplacer':'Find & replace', 'Rechercher':'Find', 'Remplacer par':'Replace with',
  'Remplacer tout':'Replace all', 'Texte à trouver…':'Text to find…', 'Nouveau texte…':'New text…',
  'Aller à la scène… (titre, lieu ou numéro)':'Go to scene… (title, location or number)',
  'Aucune scène ne correspond.':'No matching scene.', 'Aucune scène.':'No scenes.',
  '↑ ↓ pour choisir · Entrée pour insérer · Échap pour ignorer':'\u2191 \u2193 to choose \u00b7 Enter to insert \u00b7 Esc to dismiss',
  'Raccourcis clavier':'Keyboard shortcuts',
  'Classés par moment d\u2019usage. Sur Mac, remplace Ctrl par Cmd.':'Grouped by when you\u2019d use them. On Mac, use Cmd instead of Ctrl.',
  'Ctrl/Cmd':'Ctrl/Cmd', 'Fermer':'Close',
  'Commentaire':'Comment', 'Enregistrer':'Save',
  'Cette note n\u2019apparaîtra jamais dans les exports (PDF, TXT, Fountain).':'This note will never appear in exports (PDF, TXT, Fountain).',
  'Supprimer cette note':'Delete this note', 'Note':'Note',
  'Écris ta remarque ici…':'Write your note here…',
  'Exporter':'Export', 'Exporter la série':'Export series', 'Tout cocher':'Select all', 'Tout décocher':'Deselect all',
  'Éditeur':'Editor', 'Cartes':'Cards', 'Outline':'Outline', 'Personnages':'Characters', 'Tags':'Tags',
  'Page de titre':'Title page', 'Notes':'Notes', 'Rapports':'Reports', 'Statistiques':'Stats',
  'Corbeille':'Trash', 'Historique':'History', 'Paramètres':'Settings',
  'Retour à l\u2019éditeur':'Back to editor', 'Ouvrir':'Open', 'Dupliquer':'Duplicate',
  'Pas d\u2019outline':'No outline', 'Outline / synopsis…':'Outline / synopsis…',
  'tags, séparés, virgule':'tags, comma-separated',
  'Aucun personnage détecté. Ajoute une ligne de type Personnage.':'No character detected yet. Add a Character-type line.',
  'Aucune réplique.':'No lines yet.',
  'Aucun tag pour l\u2019instant, ajoute-en depuis une scène.':'No tags yet — add one from a scene.',
  'Notes personnelles':'Personal notes',
  'Séparées du scénario, jamais exportées. Les notes insérées directement dans le texte (Ctrl+9) restent visibles dans l\u2019éditeur mais sont, elles aussi, exclues des exports.':'Kept apart from the screenplay, never exported. Notes inserted directly in the text (Ctrl+9) stay visible in the editor but are excluded from exports too.',
  'Idées, recherches, choses à ne pas oublier…':'Ideas, research, things not to forget…',
  'Filtrer par personnage':'Filter by character', 'Toutes les scènes':'All scenes', 'Afficher':'Show',
  'Raccourcis':'Shortcuts', 'Scènes de nuit':'Night scenes', 'Toutes les notes':'All notes',
  'Tous les plans':'All shots', 'Toutes les transitions':'All transitions',
  'Choisis un personnage, ou consulte les raccourcis ci-dessous.':'Pick a character, or use the shortcuts below.',
  'Aucun résultat.':'No results.',
  'Pages (paginées)':'Pages (paginated)', 'Scènes':'Scenes', 'Mots':'Words', 'Répliques':'Lines',
  'Lecture estimée':'Est. reading time', 'Caractères':'Characters',
  'Personnages les plus présents':'Most-featured characters',
  'Aucun personnage pour l\u2019instant.':'No characters yet.',
  'Restaurer':'Restore', 'Supprimer définitivement':'Delete permanently',
  'La corbeille est vide.':'The trash is empty.',
  'Comparer avec maintenant':'Compare with now', 'Masquer la comparaison':'Hide comparison',
  'Restaurer cette version':'Restore this version', 'Enregistrer une version':'Save a version',
  'Aucune version enregistrée. Le bouton ci-dessus fige un instantané que tu pourras comparer ou restaurer plus tard.':'No version saved yet. The button above freezes a snapshot you can compare or restore later.',
  'Comparaison':'Comparison', '(ligne vide)':'(empty line)',
  'Aucune différence : cette version est identique au scénario actuel.':'No difference: this version is identical to the current screenplay.',
  'Projet':'Project', 'Sauvegarde':'Backup',
  'Sauvegarde automatique (.smmproj) toutes les 20 min d\u2019écriture':'Automatic backup (.smmproj) every 20 minutes of writing',
  'Page de titre (à l\u2019export)':'Title page (on export)', 'Inclure une page de titre':'Include a title page',
  'Contact':'Contact', 'Version':'Version', 'Date':'Date',
  'Voir tous les épisodes de la série':'View all episodes in the series',
  'Numérotation':'Numbering', 'Afficher les numéros de scène':'Show scene numbers',
  'Commencer à':'Start at', 'Verrouiller les numéros de scène':'Lock scene numbers',
  'Pagination':'Pagination', 'Afficher les numéros de page':'Show page numbers',
  'Numéroter aussi la première page':'Also number the first page',
  'Mentions « (SUITE) » quand une scène se poursuit':'"(CONT\u2019D)" marks when a scene continues',
  'Mention de continuité quand un personnage reprend la parole':'Continuity mark when a character speaks again',
  'Mention utilisée':'Mark used', 'Première page numérotée':'First numbered page',
  'Enregistrer les paramètres':'Save settings',
  'Ton nom':'Your name', 'Ex. Adapté du roman de…':'E.g. Adapted from the novel by…',
  'N\u2019apparaît jamais dans le corps du scénario':'Never appears in the body of the screenplay',
  'Aperçu à l\u2019échelle ·':'Preview to scale \u00b7', 'Identique à ce que produira l\u2019export PDF':'Matches exactly what the PDF export will produce',
  'Contenu':'Content', 'Titre du scénario':'Screenplay title', 'Écrit par':'Written by',
  'Affiché sous le titre, précédé de « Écrit par ».':'Shown under the title, preceded by \u201cWritten by\u201d.',
  'Phrases supplémentaires':'Extra lines',
  'Une phrase par ligne : adaptation, avertissement, citation, mention légale…':'One line each: adaptation credit, disclaimer, quote, legal notice…',
  'Typographie':'Typography', 'Police d\u2019écriture':'Font', 'Taille du texte':'Text size',
  'Sous-titre':'Subtitle', 'Bas de page':'Footer', 'Alignement':'Alignment',
  'Centré':'Centered', 'À gauche':'Left', 'Couleur du texte':'Text color', 'Fond':'Background',
  'Motif de fond':'Background pattern', 'Image de fond':'Background image', 'Opacité':'Opacity',
  'Retirer l\u2019image':'Remove image', 'Dessin libre':'Freehand drawing',
  'Dessine directement sur la page de titre : logo, croquis, signature…':'Draw directly on the title page: logo, sketch, signature…',
  'Couleur':'Color', 'Épaisseur':'Thickness', 'Effacer':'Clear', 'Terminer le dessin':'Finish drawing',
  'Effacer le dessin':'Clear drawing',
  'Attention : ce navigateur ne garde rien.':'Warning: this browser isn\u2019t keeping anything.',
  'Coffre-fort : fichier sur mon ordinateur':'Vault: a file on my computer',
  'Le plus sûr, et le plus proche d\u2019un logiciel classique : ce scénario est relié à un vrai fichier .smmproj de ton disque, réécrit tout seul quelques secondes après chaque modification. Vider le navigateur, changer de navigateur ou fermer l\u2019onglet n\u2019y change plus rien — le fichier, lui, reste.':'The safest option, closest to a regular desktop app: this screenplay is linked to a real .smmproj file on your disk, rewritten automatically a few seconds after each change. Clearing the browser, switching browsers or closing the tab no longer matters — the file stays.',
  'Ce navigateur ne gère pas l\u2019écriture directe dans un fichier. Chrome, Edge ou Opera sur ordinateur le font ; Firefox et Safari, non — là-bas, garde la sauvegarde automatique par téléchargement ci-dessus.':'This browser can\u2019t write directly to a file. Chrome, Edge and Opera on desktop can; Firefox and Safari can\u2019t — there, keep using the automatic download backup above.',
  'Lier un fichier':'Link a file', 'Changer de fichier':'Change file',
  'Reconnecter le fichier':'Reconnect the file', 'Écrire maintenant':'Write now', 'Détacher':'Detach',
  'Dans cette configuration, le lien vers le fichier ne survit pas au rechargement':'In this setup, the link to the file doesn\u2019t survive a reload',
  'Google Drive (facultatif, gratuit)':'Google Drive (optional, free)',
  'Une copie du scénario dans':'A copy of the screenplay in', 'ton':'your',
  'Identifiant client Google (OAuth)':'Google client ID (OAuth)',
  'Enregistrer l\u2019identifiant':'Save the client ID', 'Envoyer maintenant':'Send now',
  'Récupérer depuis Drive':'Fetch from Drive', 'Se déconnecter':'Disconnect',
  'Connecter Google Drive':'Connect Google Drive',
  'Non connecté.':'Not connected.',
  'Raging Page : écriture de scénario':'Raging Page: screenwriting',

  /* --- Ajouts : accueil, création de série, onglets « Comment faire » --- */
  'Gratuit et ouvert à tout le monde. Aucun compte à créer, aucun abonnement, aucune publicité. Tes scénarios restent sur ton ordinateur, dans ce navigateur, et n\u2019appartiennent qu\u2019à toi.':'Free and open to everyone. No account to create, no subscription, no ads. Your screenplays stay on your computer, in this browser, and belong to you alone.',
  'Une série regroupe tous ses épisodes sous un même nom : pas besoin de « titre » séparé, le nom de la série sert de titre à ce premier épisode.':'A series groups all its episodes under one name: no need for a separate \u201ctitle\u201d \u2014 the series name serves as this first episode\u2019s title.',
  'Ceci crée le premier épisode de la série. Tu pourras ajouter d\u2019autres épisodes et saisons ensuite, depuis la série sur l\u2019accueil, et les exporter ensemble ou séparément.':'This creates the series\u2019 first episode. You can add more episodes and seasons later, from the series on the home screen, and export them together or separately.',
  'Démarrer':'Getting started', 'Sauvegarde & export':'Backup & export',
  'Choisir « Série » (au lieu d\u2019un « Type de projet » classique) à la création crée le premier épisode d\u2019un ensemble, et change la façon dont le projet fonctionne.':'Choosing \u201cSeries\u201d (instead of a regular \u201cProject type\u201d) at creation creates the first episode of a set, and changes how the project works.',
  'Tous les épisodes d\u2019une série tiennent dans une seule carte, au lieu d\u2019une carte par épisode. Cliquer dessus ouvre le hub de la série : ajouter des épisodes, des saisons, renommer la série.':'All the episodes of a series fit in a single card, instead of one card per episode. Clicking it opens the series hub: add episodes, seasons, rename the series.',
  'Depuis le hub, l\u2019export multi-épisodes propose un épisode, plusieurs, une saison entière, ou tout, en PDF fusionné, en PDF séparés, ou en texte.':'From the hub, the multi-episode export offers one episode, several, a whole season, or everything, as a merged PDF, separate PDFs, or text.',
  'Chaque épisode reste un scénario normal : même éditeur, même export individuel qu\u2019un scénario seul.':'Each episode stays a normal screenplay: same editor, same individual export as a standalone screenplay.',
  'Dans l\u2019éditeur, « Exporter » propose PDF (impression), texte, Fountain et Final Draft (':'In the editor, \u201cExport\u201d offers PDF (print), text, Fountain and Final Draft (',
  ') : le format que lisent Final Draft, WriterDuet, Fade In et la plupart des productions.':'): the format read by Final Draft, WriterDuet, Fade In and most productions.',
  'Un .fdx peut aussi être réimporté ici depuis l\u2019accueil. C\u2019est l\u2019import le plus fidèle, puisque le fichier indique lui-même le type de chaque ligne.':'A .fdx file can also be reimported here from the home screen. It\u2019s the most faithful import, since the file itself states the type of each line.',
  'contient le projet entier : notes, outlines, tags, versions, cimetière, page de titre. Il se rouvre par « Importer ».':'contains the entire project: notes, outlines, tags, versions, trash, title page. It reopens via \u201cImport\u201d.',
  'Une restauration crée toujours un nouveau scénario à côté : elle n\u2019écrase jamais celui sur lequel tu travailles.':'A restore always creates a new screenplay alongside: it never overwrites the one you\u2019re working on.',
  'À faire de temps en temps : comme tout vit dans ce navigateur, vider ses données ou changer d\u2019ordinateur fait tout disparaître. C\u2019est le seul filet de sécurité en dehors de ce navigateur.':'Worth doing now and then: since everything lives in this browser, clearing its data or switching computers makes it all disappear. This is the only safety net outside this browser.',
  'Raccourcis clavier et mise en forme du texte : bouton « Raccourcis », en haut de l\u2019éditeur (ou dans le menu ⋯ sur petit écran).':'Keyboard shortcuts and text formatting: the \u201cShortcuts\u201d button, at the top of the editor (or in the ⋯ menu on small screens).',
  'La liste complète (navigation, recherche, mode focus, lecture à voix haute, annotations…) est dans « Raccourcis ».':'The full list (navigation, search, focus mode, read aloud, annotations…) is in \u201cShortcuts\u201d.',
  'Clique « Nouveau scénario » sur l\u2019accueil : l\u2019éditeur s\u2019ouvre directement, pas de formulaire à remplir avant d\u2019écrire.':'Click \u201cNew screenplay\u201d on the home screen: the editor opens directly, no form to fill in before writing.',
  'Choisis le format : Français (marges et conventions françaises) ou Américain (mise en page façon Hollywood).':'Choose the format: French (French margins and conventions) or American (Hollywood-style page layout).',
  'Choisis un « Type de projet » : une simple étiquette affichée sur la page de titre à l\u2019export, sauf « Série », qui change la façon dont le projet fonctionne (voir l\u2019onglet':'Choose a \u201cProject type\u201d: a simple label shown on the title page on export, except \u201cSeries\u201d, which changes how the project works (see the',
  ').':').',

  /* --- Ajouts : rechercher/remplacer, cartes, page de titre --- */
  'Remplace dans tout le scénario. Les occurrences écrites en majuscules (noms de personnages, entêtes de scène) restent en majuscules. Ctrl+Z annule l\u2019ensemble.':'Replaces throughout the whole screenplay. Occurrences written in capitals (character names, scene headings) stay in capitals. Ctrl+Z undoes the whole thing.',
  'Aucune scène pour l\u2019instant. Ajoute une ligne de type Scène dans l\u2019éditeur.':'No scenes yet. Add a Scene-type line in the editor.',
  'Renommer ici, sans repasser par l\u2019accueil : le titre change en même temps dans la barre latérale et dans le portfolio.':'Rename it here, without going back to the home screen: the title changes at the same time in the sidebar and in the portfolio.',

  /* --- Ajouts : réglages du scénario (épisode, numérotation, continuité) --- */
  'Ce scénario est un épisode. Ces réglages s\u2019appliquent à cet épisode ; le nom de la série et le nom de la saison se répercutent sur les autres épisodes concernés.':'This screenplay is an episode. These settings apply to this episode; the series name and season name carry over to the other episodes involved.',
  'Une fois verrouillés, les numéros existants ne bougent plus. Insérer une scène entre deux scènes verrouillées lui donne une lettre (12, 12A, 12B…) au lieu de tout décaler, pratique une fois le découpage distribué à l\u2019équipe. Déverrouiller revient à une numérotation automatique.':'Once locked, existing numbers no longer move. Inserting a scene between two locked scenes gives it a letter (12, 12A, 12B…) instead of shifting everything, handy once the breakdown has been distributed to the crew. Unlocking goes back to automatic numbering.',
  'Ajoutée automatiquement quand le même personnage reprend la parole dans la scène, après une action ou un plan. Elle n\u2019est pas écrite dans le texte : déplacer une scène ou couper l\u2019option la fait disparaître sans rien laisser à nettoyer. Les mentions déjà présentes dans un scénario importé sont reconnues et jamais doublées.':'Added automatically when the same character speaks again within the scene, after an action or a shot. It isn\u2019t written into the text: moving a scene or turning off the option makes it disappear with nothing left to clean up. Marks already present in an imported screenplay are recognized and never duplicated.',

  /* --- Ajouts : menu Exporter et export de série --- */
  'PDF (imprimer / aperçu du navigateur)':'PDF (print / browser preview)',
  'Texte (.txt)':'Text (.txt)', 'Fountain (.fountain)':'Fountain (.fountain)',
  'Final Draft (.fdx)':'Final Draft (.fdx)', 'Sauvegarde complète (.smmproj)':'Full backup (.smmproj)',
  'La':'The',
  ', elle, contient tout le projet (notes, outlines, tags, versions, cimetière, page de titre) dans un fichier à garder hors du navigateur. Pour la rouvrir : « Importer », sur l\u2019accueil.':', on the other hand, contains the whole project (notes, outlines, tags, versions, trash, title page) in a file to keep outside the browser. To reopen it: \u201cImport\u201d, on the home screen.',
  'Coche un seul épisode, plusieurs, une saison entière (case du haut), ou toute la série.':'Check a single episode, several, a whole season (top checkbox), or the entire series.',
  'PDF (un seul fichier fusionné)':'PDF (single merged file)', 'PDF (un fichier par épisode)':'PDF (one file per episode)',
  'Texte (.txt), un seul fichier':'Text (.txt), single file',

  /* --- Ajouts : Coffre-fort / Google Drive (phrases coupées par un <b>) --- */
  'Le plus sûr, et le plus proche d\u2019un logiciel classique : ce scénario est relié à un vrai fichier':'The safest option, and the closest to a regular desktop app: this screenplay is linked to a real',
  'de ton disque, réécrit tout seul quelques secondes après chaque modification. Vider le navigateur, changer de navigateur ou fermer l\u2019onglet n\u2019y change plus rien — le fichier, lui, reste.':'file on your disk, rewritten automatically a few seconds after each change. Clearing the browser, switching browsers or closing the tab no longer changes anything \u2014 the file itself stays.',
  'Ouvrir un .smmproj':'Open a .smmproj',
  'Un fichier est mémorisé (':'A file is remembered (',
  ') mais le navigateur redemande l\u2019autorisation d\u2019y écrire : clique sur « Reconnecter le fichier ».':') but the browser is asking again for permission to write to it: click \u201cReconnect the file\u201d.',
  'Aucun fichier relié : ce scénario n\u2019existe que dans le stockage de ce navigateur.':'No file linked: this screenplay only exists in this browser\u2019s storage.',
  '(le navigateur n\u2019autorise pas à mémoriser l\u2019autorisation ici, typiquement parce que la page est ouverte en file:// ou dans un cadre). Le fichier, lui, est bien écrit pendant toute la session ; au prochain lancement, un clic sur « Ouvrir un .smmproj » rouvre le scénario et rétablit le lien. Pour que tout devienne automatique, place le fichier sur une adresse http(s) — un hébergement gratuit suffit.':'(the browser doesn\u2019t allow remembering the permission here, typically because the page is open over file:// or inside a frame). The file itself is still written throughout the session; next time you launch, clicking \u201cOpen a .smmproj\u201d reopens the screenplay and restores the link. To make it all automatic, host the file at an http(s) address \u2014 a free host is enough.',
  'Drive, envoyée directement par le navigateur : aucun serveur à payer, aucune donnée qui passe ailleurs. Raging Page demande la permission la plus étroite possible (':'Drive, sent directly by the browser: no server to pay for, no data going anywhere else. Raging Page asks for the narrowest permission possible (',
  ') : il ne voit que les fichiers qu\u2019il a lui-même créés, jamais le reste de ton Drive.':'): it only sees the files it created itself, never the rest of your Drive.',

  /* --- Ajouts : comparaison de versions --- */
  'Le vert est ce qu\u2019il y a aujourd\u2019hui et qui n\u2019existait pas dans la version ; le rouge est ce que la version contenait et qui a disparu depuis.':'Green is what exists today and didn\u2019t exist in that version; red is what the version contained and has since disappeared.',

  /* --- Ajouts : modale Raccourcis clavier (groupes, libellés, notes) --- */
  'Écrire & structurer':'Write & structure', 'Naviguer & chercher':'Navigate & search',
  'Historique & sauvegarde':'History & backup', 'Annoter':'Annotate',
  'Entrée':'Enter',
  'Enchaîne sur le type suivant logique : Scène→Action, Personnage→Dialogue, Dialogue→Personnage… Accepte aussi la suggestion de complétion si elle est affichée.':'Moves to the next logical type: Scene→Action, Character→Dialogue, Dialogue→Character… Also accepts the completion suggestion if one is shown.',
  'Passer en Personnage':'Switch to Character',
  'Depuis Action, Scène, Transition, Plan ou Texte. Accepte la suggestion si un nom de personnage ou un lieu est proposé en cours de frappe.':'From Action, Scene, Transition, Shot or Text. Accepts the suggestion if a character name or location is offered while typing.',
  'Revenir en Action':'Back to Action', 'Depuis Personnage, Parenthétique ou Dialogue.':'From Character, Parenthetical or Dialogue.',
  'Forcer le type de la ligne':'Force the line type',
  'Scène, Action, Personnage, Parenthétique, Dialogue, Transition, Plan, Texte, Note.':'Scene, Action, Character, Parenthetical, Dialogue, Transition, Shot, Text, Note.',
  'Fusionner avec la ligne du dessus':'Merge with the line above', 'Retour arrière':'Backspace',
  'Quand le curseur est au tout début de la ligne.':'When the cursor is at the very start of the line.',
  'Dialogue simultané':'Simultaneous dialogue',
  'Curseur dans le DEUXIÈME bloc de dialogue : il monte à côté du précédent, les deux répliques se jouant en même temps. Même raccourci pour revenir en arrière.':'Cursor in the SECOND dialogue block: it moves up next to the previous one, with both lines playing at the same time. Same shortcut to undo it.',
  'Déplacer le curseur entre les lignes':'Move the cursor between lines',
  'Aller à une scène':'Jump to a scene',
  'Liste filtrable de toutes les scènes avec leur numéro et leur page. Entrée pour sauter dedans.':'Filterable list of every scene with its number and page. Enter to jump to it.',
  'Mode Focus':'Focus Mode',
  'Estompe tout le texte sauf la ligne où est le curseur, pour écrire sans distraction.':'Fades out all the text except the line the cursor is on, for distraction-free writing.',
  'Lire la scène à voix haute':'Read the scene aloud',
  'Lit la scène où se trouve le curseur (entêtes, actions, personnages, répliques), pratique pour repérer les lourdeurs de dialogue à l\u2019oreille.':'Reads aloud the scene the cursor is in (headings, actions, characters, lines) \u2014 handy for catching clunky dialogue by ear.',
  'Dans tout le scénario, annulable d\u2019un seul Ctrl+Z.':'Throughout the whole screenplay, undoable with a single Ctrl+Z.',
  'Aller à une page':'Go to a page',
  'Tout sélectionner sur la page en cours':'Select all on the current page',
  'Pratique pour copier le texte d\u2019une page entière.':'Handy for copying the text of a whole page.',
  'Annuler la dernière action':'Undo the last action', 'Rétablir':'Redo',
  'Sauvegarder maintenant':'Save now', 'La sauvegarde automatique tourne déjà en continu.':'Autosave is already running continuously.',
  'Commentaire sur la ligne en cours':'Comment on the current line',
  'Repère 💬 discret dans la marge, n\u2019apparaît jamais dans les exports.':'A discreet 💬 marker in the margin, never appears in exports.',
  'Visible uniquement dans l\u2019éditeur (petit repère 💬 dans la marge), n\u2019apparaîtra jamais dans les exports.':'Only visible in the editor (a small 💬 marker in the margin), will never appear in exports.',

  /* --- Ajouts : machine à écrire, mode focus, navigateur de scènes (infobulles) --- */
  'Mode machine à écrire ACTIF : le curseur reste centré verticalement. Cliquer pour le couper.':'Typewriter mode ON: the cursor stays vertically centered. Click to turn it off.',
  'Mode machine à écrire coupé : défilement normal. Cliquer pour l\u2019activer.':'Typewriter mode off: normal scrolling. Click to turn it on.',
  'Machine à écrire':'Typewriter',
  'Mode Focus ACTIF : le texte hors de la ligne en cours est estompé. Cliquer pour le couper.':'Focus Mode ON: text outside the current line is faded. Click to turn it off.',
  'Mode Focus coupé : cliquer pour estomper tout sauf la ligne en cours.':'Focus Mode off: click to fade everything except the current line.',
  'Navigateur de scènes ACTIF : la liste des scènes reste à côté du texte. Cliquer pour le fermer.':'Scene navigator ON: the scene list stays next to the text. Click to close it.',
  'Navigateur de scènes fermé : cliquer pour afficher la liste des scènes à côté du texte.':'Scene navigator closed: click to show the scene list next to the text.',

  /* --- Ajouts : types de projet (menu déroulant "Type de projet") --- */
  'Long métrage':'Feature film', 'Moyen métrage':'Medium-length film', 'Court métrage':'Short film',
  'Documentaire':'Documentary', 'Clip':'Music video', 'Format libre':'Freeform',

  /* --- Ajouts : polices et motifs de fond de la page de titre --- */
  'Scénario vintage':'Vintage screenplay', 'Moderne':'Modern', 'Épuré':'Clean', 'Élégant':'Elegant',
  'Classique':'Classic', 'Cinématique':'Cinematic', 'Affiche':'Poster', 'Manuscrit':'Handwritten',
  'Aucun':'None', 'Points':'Dots', 'Lignes':'Lines', 'Quadrillage':'Grid', 'Diagonales':'Diagonal',
  'Trame film':'Film grain', 'Dessiner sur la page':'Draw on the page',

  /* --- Ajouts : menu "⋯" (dialogue simultané, rechercher/remplacer) --- */
  'Simultané':'Simultaneous',
  'Dialogue simultané (Ctrl/Cmd+Maj+D) : place les deux répliques côte à côte, comme dans WriterDuet. Curseur dans le deuxième bloc de dialogue.':'Simultaneous dialogue (Ctrl/Cmd+Shift+D): places both lines side by side, like in WriterDuet. Cursor in the second dialogue block.',
  'Rechercher / remplacer':'Find / replace',

  /* --- Ajouts : navigateur de scènes (entête vide) --- */
  'Scène sans titre':'Untitled scene',

  /* --- Ajouts : hub de série --- */
  'Accueil':'Home', 'Nouvel épisode':'New episode', 'Nouvelle saison':'New season',
  'Exporter la série…':'Export series…',

  /* --- Ajouts : messages d'import et notifications du panneau Synonymes --- */
  'Import terminé, vérifie les types de lignes détectés.':'Import complete: check the detected line types.',
  'Import PDF terminé : la mise en forme (personnage/dialogue/action) est déduite automatiquement, vérifie-la avant d\u2019écrire.':'PDF import complete: the formatting (character/dialogue/action) is detected automatically, check it before writing.',
  'Sélectionne d\u2019abord un mot dans le scénario.':'First select a word in the screenplay.',
  'Mot introuvable.':'Word not found.',
  'Le texte a changé : re-sélectionne le mot.':'The text has changed: select the word again.',
  'Infinitif inséré : pense à le conjuguer.':'Infinitive inserted: remember to conjugate it.',
};

/* Sélecteur des zones jamais traduites : tout ce qui affiche du texte
   choisi par l'utilisateur (scénario, titres, personnages, tags, notes,
   versions, commentaires, page de titre…), protégé même si une phrase
   venait par malchance à coïncider avec une clé du dictionnaire. */
const I18N_EXCLUDE_SEL = [
  '.line', '[contenteditable]', 'textarea', 'input', 'script', 'style',
  '.card-heading', '.card-syn', '.flat-row-title', '.char-name', '.char-stats',
  '.tag-chip', '.chip-toggle', '.proj-name', '.rail-project', '#charDetail',
  '.titlepage', '#reportResults', '.comment-body', '.diff-text', '.diff-type', '.cp-lab', '.wd-slug'
].join(',');

function i18nSkip(el){ return !!(el && el.closest && el.closest(I18N_EXCLUDE_SEL)); }
function i18nWalk(root){
  if(!root || root.nodeType === 8) return;
  if(root.nodeType === 3){
    const raw = root.nodeValue, trimmed = raw.trim();
    if(trimmed && I18N_EN.hasOwnProperty(trimmed) && !i18nSkip(root.parentElement)){
      /* On n'écrit que si le texte change vraiment : écrire la même valeur
         relance le MutationObserver, donc la passe, donc l'écriture… en
         boucle à chaque image (clés identiques FR/EN : Notes, Tags, Outline…). */
      const nv = raw.replace(trimmed, I18N_EN[trimmed]);
      if(nv !== raw) root.nodeValue = nv;
    }
    return;
  }
  if(root.nodeType === 1){
    /* Les attributs title/placeholder sont traduits même sur un élément
       par ailleurs exclu (input, textarea…) : l'exclusion protège le
       CONTENU (texte tapé par l'utilisateur), pas l'indice statique
       affiché quand ce contenu est vide. Il faut donc lire ces attributs
       AVANT de sortir sur i18nSkip, sans quoi le placeholder d'un champ
       de recherche ou d'une zone de notes ne serait jamais traduit. */
    ['title','placeholder'].forEach(attr=>{
      const v = root.getAttribute && root.getAttribute(attr);
      if(v && I18N_EN.hasOwnProperty(v.trim()) && I18N_EN[v.trim()] !== v) root.setAttribute(attr, I18N_EN[v.trim()]);
    });
    if(root.id === 'page' || i18nSkip(root)) return;   // #page : uniquement le texte du scénario, jamais traduit
  }
  let child = root.firstChild;
  while(child){ i18nWalk(child); child = child.nextSibling; }
}
function applyLanguage(){ if(getLang() === 'en') i18nWalk(document.body); }

/* PERFORMANCE. Chaque modification du document (une frappe dans le scénario, une marge posée par la
   pagination...) relançait une traduction de TOUT le document : sur un long métrage, des dizaines de
   milliers de nœuds relus à chaque touche, plus de la moitié du temps de réaction de l'éditeur. On ne
   relit plus que ce qui vient de changer (nœuds ajoutés, texte ou attribut modifié) ; la passe complète
   reste faite au démarrage et au changement de langue. Le résultat affiché est le même. */
let __i18nRaf = null, __i18nFull = false;
const __i18nPending = new Set();
function i18nFlush(){
  __i18nRaf = null;
  if(getLang() !== 'en'){ __i18nPending.clear(); __i18nFull = false; return; }
  if(__i18nFull){ __i18nFull = false; __i18nPending.clear(); applyLanguage(); return; }
  const nodes = Array.from(__i18nPending); __i18nPending.clear();
  nodes.forEach(n => { if(n.isConnected) i18nWalk(n); });
}
function scheduleI18n(){
  __i18nFull = true;
  if(!__i18nRaf) __i18nRaf = requestAnimationFrame(i18nFlush);
}
function i18nOnMutations(records){
  if(getLang() !== 'en') return;
  for(const r of records){
    if(r.type === 'childList'){ r.addedNodes.forEach(n => __i18nPending.add(n)); }
    else __i18nPending.add(r.target);
  }
  if(__i18nPending.size && !__i18nRaf) __i18nRaf = requestAnimationFrame(i18nFlush);
}
let __i18nObserver = null;
function startI18nObserver(){
  if(__i18nObserver) return;
  __i18nObserver = new MutationObserver(i18nOnMutations);
  __i18nObserver.observe(document.body, {
    childList:true, subtree:true, characterData:true,
    attributes:true, attributeFilter:['title','placeholder']
  });
  scheduleI18n();
}

/* Traduction des toasts : seuls les messages STATIQUES (correspondance
   exacte avec une clé) passent en anglais ; les messages qui contiennent
   des données de l'utilisateur (nom de fichier, titre…) restent
   inchangés faute de correspondance exacte — le comportement voulu. */
const __origToast = toast;
toast = function(msg){
  if(getLang() === 'en' && I18N_EN.hasOwnProperty(String(msg).trim())) msg = I18N_EN[String(msg).trim()];
  return __origToast(msg);
};

/* Boutons de langue, affichés sur l'accueil et dans l'éditeur.
   Texte "FR"/"EN" plutôt que des emojis drapeaux : sur certains systèmes
   (Windows sans pack d'emojis couleur, notamment) un drapeau non pris en
   charge s'affiche comme du texte brut ("GB"...), ce qui rendait le
   bouton illisible et personne ne comprenait qu'il servait à changer de
   langue. Du texte simple s'affiche partout, sans ambiguïté. */
function langFlagsHtml(extraCls){
  const lang = getLang();
  return `<div class="lang-flags ${extraCls||''}" role="group" aria-label="Langue / Language">
    <button class="lang-flag ${lang==='fr'?'active':''}" data-act="setLang" data-id="fr" title="${L('Passer en français','Switch to French')}" aria-label="Français">FR</button>
    <button class="lang-flag ${lang==='en'?'active':''}" data-act="setLang" data-id="en" title="${L('Passer en anglais','Switch to English')}" aria-label="English">EN</button>
  </div>`;
}
/* Les mentions de continuité (personnage ET page) sont désormais toujours
   calculées à partir de la langue de l'interface — plus besoin de les
   resynchroniser à part : render() suffit, elles se recalculent au
   passage (voir contdMap et pageContWord). */
/* Changer de langue reconstruit toute l'interface : sans précaution, chaque
   zone qui défile (scénario, panneaux, navigateur de scènes, listes…) repartait
   tout en haut. On note donc la position de chaque zone qui défile, puis on la
   remet une fois la nouvelle langue affichée (plusieurs fois, car la pagination
   et la traduction finissent un instant après le rendu). */
function scrollKeyOf(el){
  if(el.id) return '#' + el.id;
  const parts = [];
  let n = el;
  while(n && n !== document.body && n.nodeType === 1){
    if(n.id){ parts.unshift('#' + n.id); break; }
    const sib = n.parentNode ? Array.prototype.indexOf.call(n.parentNode.children, n) : 0;
    parts.unshift(n.tagName.toLowerCase() + ':' + sib);
    n = n.parentNode;
  }
  return parts.join('>');
}
function captureScrolls(){
  const out = [];
  const root = document.getElementById('app') || document.body;
  const seen = [root].concat(Array.prototype.slice.call(root.querySelectorAll('*')));
  seen.forEach(el => { if(el.scrollTop > 0 || el.scrollLeft > 0) out.push([scrollKeyOf(el), el.scrollTop, el.scrollLeft]); });
  return { items: out, win: [window.scrollX, window.scrollY] };
}
function restoreScrolls(snap){
  const root = document.getElementById('app') || document.body;
  const byKey = new Map();
  [root].concat(Array.prototype.slice.call(root.querySelectorAll('*'))).forEach(el => {
    if(el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) byKey.set(scrollKeyOf(el), el);
  });
  snap.items.forEach(([k, top, left]) => {
    const el = byKey.get(k);
    if(el){ el.scrollTop = top; el.scrollLeft = left; }
  });
  if(snap.win[0] || snap.win[1]) window.scrollTo(snap.win[0], snap.win[1]);
}
function setLang(l){
  const snap = captureScrolls();
  const selTab = S.tab;
  setLangPref(l); render(); scheduleI18n();
  // le rendu pose d'abord un contenu vide ou non paginé : on remet la position
  // tout de suite, puis après la pagination et la traduction.
  restoreScrolls(snap);
  [60, 200, 500, 1000].forEach(ms => setTimeout(() => {
    if(S.tab !== selTab) return;          // l'utilisateur a changé d'onglet entre-temps
    restoreScrolls(snap);
  }, ms));
}

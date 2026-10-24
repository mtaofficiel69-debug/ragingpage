/* =====================================================================
   SYNONYMES (v14) — panneau d'alternatives pour éviter les répétitions
   ---------------------------------------------------------------------
   Ctrl/Cmd+Maj+Y, ou « Synonymes » dans le menu ⋯. Sélectionne un mot (ou
   pose juste le curseur dedans) : le panneau propose des alternatives
   regroupées par NUANCE. Un clic remplace le mot dans le texte (annulable
   par Ctrl+Z). Onglet « Répétitions » : les mots les plus répétés du script.
   Format du dictionnaire : voir l'en-tête de SYN_DB_TEXT.
===================================================================== */
const SYN_DB_TEXT = `
v|Fixer, dévisager|fixer>d;dévisager>d;toiser>d;river {p} regard>sur;darder {p} regard>sur;braquer {p} regard>sur;planter {p} regard>dans;ancrer {p} regard>dans;transpercer du regard>d;couver des yeux>d|regarder
v|Observer, scruter|observer>d;scruter>d;examiner>d;détailler>d;étudier>d;inspecter>d;considérer>d;sonder>d;passer en revue>d;ausculter>d|regarder
v|Contempler, admirer|contempler>d;admirer>d;s'attarder>sur;dévorer des yeux>d;couver du regard>d|regarder
v|Coup d'œil rapide|jeter un coup d'œil>à;jeter un œil>à;lancer un regard>vers;glisser un regard>vers;risquer un œil>vers;lorgner>d;zieuter>d;jeter un regard>vers;balayer du regard>d;parcourir des yeux>d|regarder
v|Épier, surveiller|épier>d;guetter>d;surveiller>d;espionner>d;observer en cachette>d;garder un œil>sur;pister>d|regarder
v|Détourner le regard|détourner {p} regard>de;détourner les yeux>de;éviter {p} regard>d;fuir {p} regard>d;esquiver {p} regard>d|regarder
v|Baisser, lever les yeux|baisser les yeux>sur;baisser {p} regard>sur;lever les yeux>vers;lever {p} regard>vers;relever {p} regard>vers;tourner {p} regard>vers;porter {p} regard>sur;diriger {p} regard>vers|regarder
v|Se tourner, se retourner|se tourner>vers;se retourner>vers;pivoter>vers;faire volte-face>i;faire demi-tour>i;tourner la tête>vers;tourner les talons>i;se détourner>de|tourner,retourner
v|Soupirer|soupirer>i;pousser un soupir>i;pousser un long soupir>i;laisser échapper un soupir>i;lâcher un soupir>i;expirer longuement>i;souffler>i|
v|Avancer lentement|s'avancer>vers;progresser>i;cheminer>i;avancer à pas lents>vers;se traîner>vers;approcher à pas comptés>de;s'approcher à pas de loup>de|avancer
v|Marcher sans but|déambuler>i;errer>i;flâner>i;vagabonder>i;arpenter>d;tourner en rond>i;traîner>i;divaguer>i;se balader>i;musarder>i;lambiner>i|marcher
v|Aller vers|se diriger>vers;s'approcher>de;se rapprocher>de;gagner>d;rejoindre>d;atteindre>d;se rendre>à;filer>vers;regagner>d|avancer,marcher
v|Avancer avec détermination|foncer>vers;s'élancer>vers;se précipiter>vers;marcher d'un pas décidé>vers|avancer,marcher,courir
v|Entrer|entrer>dans;pénétrer>dans;s'introduire>dans;s'engouffrer>dans;faire irruption>dans;franchir le seuil>de;débarquer>dans;surgir>dans;se glisser>dans|
v|Sortir, quitter|sortir>de;quitter>d;s'éclipser>i;s'esquiver>i;déguerpir>i;s'éloigner>de;partir>i;s'en aller>i;filer>i;prendre congé>i;se retirer>i;décamper>i|
v|Sourire|sourire>à;esquisser un sourire>à;ébaucher un sourire>à;adresser un sourire>à;afficher un sourire>i;sourire en coin>i;rayonner>i;sourire jusqu'aux oreilles>i;minauder>i|
v|Rire|rire>i;pouffer>i;s'esclaffer>i;éclater de rire>i;ricaner>i;glousser>i;se marrer>i;rigoler>i;se tordre de rire>i;rire aux éclats>i;se bidonner>i;se gondoler>i|
v|Pleurer|pleurer>i;sangloter>i;fondre en larmes>i;verser des larmes>i;s'effondrer en larmes>i;larmoyer>i;pleurnicher>i;avoir les larmes aux yeux>i;éclater en sanglots>i|
v|Crier|crier>i;hurler>i;vociférer>i;rugir>i;s'époumoner>i;s'égosiller>i;beugler>i;brailler>i;gueuler>i;s'écrier>i;tonner>i;glapir>i;piailler>i|
v|Trembler|trembler>i;frissonner>i;frémir>i;tressaillir>i;grelotter>i;vibrer>i;trembloter>i;flageoler>i|
v|Se figer|se figer>i;se pétrifier>i;s'immobiliser>i;se raidir>i;se glacer>i;rester pétrifié>i;se tétaniser>i;rester cloué sur place>i|
v|Dire à voix basse|murmurer>d;chuchoter>d;souffler>d;glisser>d;marmonner>d;susurrer>d;bredouiller>d;balbutier>d;bafouiller>d;souffler à l'oreille>d;grommeler>d;maugréer>d|dire
v|Dire à voix haute|lancer>d;lâcher>d;clamer>d;s'exclamer>i;déclarer>d;annoncer>d;proclamer>d;scander>d;tonner>i|dire
v|Répondre|répondre>à;répliquer>à;rétorquer>d;riposter>à;renchérir>i;objecter>d|
v|Acquiescer|hocher la tête>i;acquiescer>i;opiner>i;approuver>d;faire signe que oui>i;incliner la tête>i;consentir>à;opiner du chef>i;donner son accord>i|
v|Se lever|se lever>i;se dresser>i;se redresser>i;se mettre debout>i;bondir>i;sursauter>i;se relever>i;se hisser>i;se remettre debout>i|
v|S'asseoir|s'asseoir>i;s'installer>i;prendre place>i;s'affaler>i;se laisser tomber>i;s'écrouler>i;se poser>i;s'accroupir>i;se caler>dans;s'enfoncer>dans|
v|Saisir|saisir>d;attraper>d;empoigner>d;agripper>d;s'emparer>de;se saisir>de;prendre>d;happer>d;rafler>d;arracher>d;cueillir>d|prendre
v|Toucher|toucher>d;effleurer>d;frôler>d;caresser>d;palper>d;tâter>d;tapoter>d;masser>d;pincer>d|
v|Tenir, serrer|tenir>d;serrer>d;étreindre>d;agripper>d;empoigner>d;s'accrocher>à;enlacer>d;cramponner>d;presser>d|
v|Frapper|frapper>d;cogner>d;heurter>d;marteler>d;tambouriner>sur;cogner>contre;taper>sur;gifler>d;boxer>d;rouer de coups>d;tabasser>d;corriger>d|
v|Jeter|jeter>d;lancer>d;balancer>d;projeter>d;envoyer>d;flanquer>d;lâcher>d;expédier>d;catapulter>d|
v|Ressentir|ressentir>d;éprouver>d;percevoir>d;sentir>d;endurer>d;subir>d|
v|Voir|voir>d;apercevoir>d;remarquer>d;distinguer>d;repérer>d;discerner>d;constater>d;entrevoir>d;surprendre>d;déceler>d|
v|Entendre|entendre>d;percevoir>d;discerner>d;capter>d;tendre l'oreille>vers;ouïr>d;surprendre>d|écouter
v|Attendre|attendre>d;patienter>i;guetter>d;ronger {p} frein>i;faire le pied de grue>i;poireauter>i;languir>i;compter les minutes>i|
v|Courir|courir>i;filer>i;détaler>i;se précipiter>vers;s'élancer>vers;foncer>vers;dévaler>d;galoper>i;cavaler>i;sprinter>i;prendre ses jambes à son cou>i;piquer un sprint>i;filer à toute allure>i|
v|Tomber|tomber>i;s'effondrer>i;s'écrouler>i;s'affaisser>i;chuter>i;dégringoler>i;s'étaler>i;basculer>i;trébucher>i;s'étaler de tout son long>i;choir>i;se casser la figure>i|
v|Parler|parler>à;s'adresser>à;discuter>avec;s'entretenir>avec;converser>avec;s'exprimer>i;bavarder>avec;causer>avec;dialoguer>avec;échanger>avec|
v|Penser|penser>à;songer>à;réfléchir>à;méditer>sur;ruminer>d;cogiter>i;gamberger>i;se demander>d|
v|Commencer|commencer>à;se mettre>à;se lancer>dans;entamer>d;amorcer>d;entreprendre>d;débuter>i;démarrer>d;s'atteler>à|
v|Sembler|sembler>i;paraître>i;se montrer>i;avoir l'air>i;donner l'impression>de|
v|Rester|rester>i;demeurer>i;se tenir>i;se maintenir>i;persister>i;s'attarder>i;stationner>i;camper>i|
v|Respirer|respirer>i;inspirer>i;prendre une inspiration>i;reprendre {p} souffle>i;haleter>i;reprendre haleine>i|
v|Ouvrir|ouvrir>d;entrouvrir>d;pousser>d;écarter>d;ouvrir en grand>d;déverrouiller>d;ouvrir à la volée>d|
v|Fermer|fermer>d;refermer>d;claquer>d;verrouiller>d;rabattre>d;clore>d;boucler>d|
n|Les yeux|regard~nm;prunelle~nf;pupille~nf;iris~nm|œil:yeux
n|Les yeux, familier|mirette~nf;quinquet~nm;châsse~nf|œil:yeux
n|Le regard, les yeux|yeux~nmp;prunelles~nfp;pupilles~nfp;iris~nm|regard
n|Le regard, l'expression|air~nm;expression~nf;mine~nf;lueur~nf|regard
n|Le regard, l'acte de regarder|coup d'œil~nm:coups d'œil;œillade~nf;examen~nm;contemplation~nf|regard
n|Le soupir|souffle~nm;expiration~nf;gémissement~nm;plainte~nf;murmure~nm;râle~nm|soupir
n|La bouche|lèvres~nfp;babines~nfp|bouche
n|La bouche, familier|gueule~nf;bec~nm|bouche
n|Le visage|face~nf;figure~nf;traits~nmp;physionomie~nf;faciès~nm;tête~nf;frimousse~nf;bouille~nf;minois~nm|visage
n|Le silence|calme~nm;quiétude~nf;mutisme~nm;paix~nf;accalmie~nf|silence
n|Le bruit fort|vacarme~nm;fracas~nm;tapage~nm;tumulte~nm;boucan~nm;raffut~nm;brouhaha~nm;tintamarre~nm|bruit
n|Le bruit léger|son~nm;murmure~nm;bruissement~nm;froissement~nm;chuchotement~nm;clapotis~nm;tintement~nm;crissement~nm|bruit
n|La voix|ton~nm;timbre~nm;intonation~nf;organe~nm|voix
n|Un instant|seconde~nf;moment~nm;éclair~nm;minute~nf|instant
n|Un geste|mouvement~nm;signe~nm|geste
n|La peur|frayeur~nf;effroi~nm;terreur~nf;angoisse~nf;crainte~nf;épouvante~nf;panique~nf;appréhension~nf;trouille~nf|peur
n|La colère|rage~nf;fureur~nf;courroux~nm;irritation~nf;emportement~nm;exaspération~nf;indignation~nf|colère
n|La tristesse|chagrin~nm;peine~nf;mélancolie~nf;affliction~nf;désespoir~nm;détresse~nf;spleen~nm;abattement~nm|tristesse
n|La lumière|clarté~nf;éclat~nm;lueur~nf;luminosité~nf;rayon~nm;halo~nm;faisceau~nm;reflet~nm|lumière
n|L'ombre|obscurité~nf;pénombre~nf;ténèbres~nfp;noirceur~nf;noir~nm;nuit~nf|ombre
a|Étonné|stupéfait;ébahi;médusé;sidéré;interdit;abasourdi;ahuri;estomaqué;éberlué;interloqué;déconcerté;épaté;soufflé|étonné,surpris
a|Fatigué|épuisé;las;exténué;harassé;éreinté;vanné;crevé;lessivé;fourbu;à bout;claqué;sur les rotules|fatigué
a|Triste|abattu;morose;sombre;mélancolique;accablé;chagriné;malheureux;peiné;désolé;affligé;cafardeux;navré|triste
a|Silencieux|muet;taciturne;mutique;discret;coi;réservé;feutré|silencieux
x|Bouche bée|sans voix;la mâchoire pendante;interdit~a;médusé~a;stupéfait~a;sidéré~a;pétrifié~a;muet de stupeur~a|bouche bée
x|Bouche entrouverte|les lèvres entrouvertes;la bouche à demi ouverte;{pf} bouche légèrement ouverte;les lèvres à peine écartées;les lèvres légèrement écartées;la bouche semi-ouverte|bouche entrouverte,bouche ouverte,lèvres entrouvertes
x|En colère|furieux~a;furibond~a;excédé~a;irrité~a;hors de soi;fou de rage;enragé~a;remonté~a;furax~a;hors de lui|en colère
x|Doucement|lentement;tendrement;avec douceur;en douceur;délicatement;calmement;posément;avec précaution;sans brusquerie|doucement
x|Lentement|doucement;posément;sans hâte;avec lenteur;à pas lents;calmement|lentement
x|Soudain|brusquement;tout à coup;d'un coup;subitement;soudainement;sans prévenir;en un instant;brutalement;tout d'un coup;d'un seul coup;inopinément|soudain
x|Puis|ensuite;alors;après quoi;peu après;un instant plus tard;à ce moment;par la suite|puis,ensuite
x|Fixement|intensément;avec insistance;sans ciller;obstinément;longuement|fixement
x|Silencieusement|sans bruit;sans un mot;en silence;discrètement;à pas feutrés;dans un silence total|silencieusement
x|Rapidement|vite;promptement;en hâte;à toute vitesse;prestement;sans attendre;à la hâte;en un éclair;en vitesse;en quatrième vitesse;dare-dare|rapidement,vite
x|Très|extrêmement;terriblement;profondément;infiniment;grandement;fort;vraiment;particulièrement;énormément|très
x|Un peu|légèrement;à peine;faiblement;vaguement;quelque peu;un brin;un tantinet|un peu
x|Encore|toujours;de nouveau;une fois de plus;à nouveau;derechef|encore
x|Peut-être|sans doute;probablement;éventuellement;possiblement;sait-on jamais|peut-être
x|Tout de suite|aussitôt;immédiatement;sur-le-champ;sans attendre;illico;à l'instant;séance tenante|tout de suite
x|Longtemps|longuement;pendant un moment;un long moment;des heures;une éternité|longtemps
v|Ramasser|ramasser>d;récupérer>d;recueillir>d;relever>d|ramasser
v|Poser|poser>d;déposer>d;placer>d;mettre>d;installer>d;reposer>d|poser
v|Donner|donner>d;tendre>d;passer>d;remettre>d;offrir>d;confier>d|donner
v|Chercher|chercher>d;fouiller>d;explorer>d;rechercher>d;farfouiller>d;fureter>i|chercher
v|Trouver|trouver>d;découvrir>d;dénicher>d;tomber sur>d;mettre la main>sur|trouver
v|Montrer|montrer>d;désigner>d;indiquer>d;pointer>d;exhiber>d;brandir>d|montrer
v|Montrer du doigt|pointer du doigt>d;désigner du menton>d;indiquer d'un geste>d|montrer
v|Arriver|arriver>i;débarquer>i;surgir>i;se pointer>i;apparaître>i;faire son entrée>i|arriver
v|Revenir|revenir>i;rentrer>i;retourner>i;réapparaître>i;faire marche arrière>i|revenir
v|Partir|partir>i;s'en aller>i;filer>i;décamper>i;mettre les voiles>i;prendre la porte>i;plier bagage>i;tirer sa révérence>i|partir
v|Fuir|fuir>i;s'enfuir>i;détaler>i;prendre la fuite>i;se sauver>i;déguerpir>i|fuir
v|Se cacher|se cacher>i;se dissimuler>i;se planquer>i;se tapir>i;se terrer>i|cacher
v|Cacher|cacher>d;dissimuler>d;camoufler>d;planquer>d;masquer>d;enfouir>d|cacher
v|Essayer|essayer>de;tenter>de;s'efforcer>de;chercher>à;tâcher>de|essayer
v|Aider|aider>d;secourir>d;épauler>d;assister>d;soutenir>d;prêter main-forte>à|aider
v|Appeler|appeler>d;héler>d;interpeller>d;apostropher>d|appeler
v|Téléphoner|téléphoner>à;passer un coup de fil>à;composer le numéro>de|téléphoner
v|Pousser|pousser>d;bousculer>d;repousser>d;écarter>d;propulser>d|pousser
v|Tirer|tirer>d;traîner>d;haler>d;remorquer>d;tracter>d|tirer
v|Embrasser|embrasser>d;étreindre>d;enlacer>d;serrer dans ses bras>d;donner un baiser>à|embrasser
v|Comprendre|comprendre>d;saisir>d;piger>d;réaliser>d;percuter>i;deviner>d|comprendre
v|Se souvenir|se souvenir>de;se rappeler>d;se remémorer>d;revoir>d|souvenir,rappeler
v|Oublier|oublier>d;négliger>d;omettre>d;perdre de vue>d|oublier
v|Vouloir|vouloir>d;désirer>d;souhaiter>d;convoiter>d;rêver>de|vouloir
v|Aimer|aimer>d;adorer>d;chérir>d;affectionner>d;apprécier>d|aimer
v|Détester|détester>d;haïr>d;exécrer>d;abhorrer>d;ne pas supporter>d|détester
v|Hésiter|hésiter>i;tergiverser>i;balancer>i;tâtonner>i;se tâter>i|hésiter
v|Refuser|refuser>d;décliner>d;rejeter>d;repousser>d;secouer la tête>i|refuser
v|Accepter|accepter>d;consentir>à;admettre>d;céder>i|accepter
v|Arrêter, cesser|arrêter>d;cesser>d;stopper>d;interrompre>d;suspendre>d|arrêter
v|S'arrêter|s'arrêter>i;s'immobiliser>i;faire halte>i;marquer une pause>i;piler>i|arrêter
v|Continuer|continuer>d;poursuivre>d;reprendre>d;persévérer>i|continuer
v|Finir|finir>d;terminer>d;achever>d;conclure>d;boucler>d|finir
v|Manger|manger>d;dévorer>d;engloutir>d;grignoter>d;avaler>d;se goinfrer>de|manger
v|Boire|boire>d;siroter>d;avaler>d;descendre>d;lamper>d;s'enfiler>d|boire
v|Dormir|dormir>i;sommeiller>i;somnoler>i;roupiller>i;s'assoupir>i;piquer du nez>i|dormir
v|Se réveiller|se réveiller>i;s'éveiller>i;ouvrir les yeux>i;émerger>i|réveiller
v|Écrire|écrire>d;noter>d;griffonner>d;gribouiller>d;rédiger>d;inscrire>d|écrire
v|Lire|lire>d;parcourir>d;déchiffrer>d;feuilleter>d;survoler>d|lire
v|Se battre|se battre>avec;se bagarrer>avec;lutter>contre;s'affronter>i;en venir aux mains>i|battre
v|Tuer|tuer>d;abattre>d;éliminer>d;assassiner>d;liquider>d;descendre>d|tuer
v|Mourir|mourir>i;décéder>i;expirer>i;s'éteindre>i;rendre l'âme>i;succomber>i|mourir
v|Conduire|conduire>d;piloter>d;rouler>i;filer>i|conduire
v|Monter|monter>d;grimper>d;gravir>d;escalader>d;se hisser>sur|monter
v|Descendre|descendre>d;dévaler>d;dégringoler>d;redescendre>d|descendre
v|Briller|briller>i;scintiller>i;étinceler>i;miroiter>i;luire>i;rayonner>i|briller
v|Changer|changer>d;modifier>d;transformer>d;bouleverser>d;métamorphoser>d|changer
v|Casser|casser>d;briser>d;fracasser>d;rompre>d;pulvériser>d|casser
v|Se cogner|se cogner>contre;heurter>d;percuter>d;buter>contre|cogner
v|Gémir|gémir>i;geindre>i;grogner>i;râler>i;couiner>i|gémir
v|Rougir|rougir>i;s'empourprer>i;piquer un fard>i|rougir
v|Pâlir|pâlir>i;blêmir>i;blanchir>i;devenir livide>i|pâlir
v|Avaler sa salive|déglutir>i;avaler sa salive>i;ravaler>d|déglutir
v|S'éloigner, reculer|s'éloigner>de;reculer>i;battre en retraite>i;prendre ses distances>avec|éloigner,reculer
v|Se pencher|se pencher>vers;s'incliner>vers;se courber>i;se baisser>i|pencher
v|Allumer|allumer>d;éclairer>d;mettre en marche>d|allumer
v|Éteindre|éteindre>d;couper>d;souffler>d|éteindre
v|Sonner|sonner>i;retentir>i;tinter>i;carillonner>i;vibrer>i|sonner
v|Expliquer|expliquer>d;préciser>d;détailler>d;clarifier>d;exposer>d|expliquer
v|Demander|demander>d;questionner>d;interroger>d;s'enquérir>de|demander
v|Mentir|mentir>i;inventer>d;bluffer>i;raconter des histoires>i|mentir
v|Avouer|avouer>d;admettre>d;reconnaître>d;confesser>d|avouer
v|Menacer|menacer>d;intimider>d;défier>d|menacer
v|Rassurer|rassurer>d;réconforter>d;consoler>d;apaiser>d;calmer>d|rassurer
v|Se calmer|se calmer>i;s'apaiser>i;se détendre>i;reprendre ses esprits>i|calmer
v|S'énerver|s'énerver>i;s'emporter>i;exploser>i;sortir de ses gonds>i;perdre patience>i|énerver
v|Hausser les épaules|hausser les épaules>i;lever les yeux au ciel>i;faire la moue>i|hausser
v|Froncer les sourcils|froncer les sourcils>i;plisser les yeux>i;se renfrogner>i|froncer
v|Cligner des yeux|cligner des yeux>i;battre des paupières>i;ciller>i|cligner
v|Se faufiler|se faufiler>vers;se glisser>vers;ramper>vers;s'avancer à pas de loup>vers|faufiler
n|La maison|demeure~nf;foyer~nm;logis~nm;domicile~nm;bâtisse~nf;baraque~nf;pavillon~nm;villa~nf;masure~nf|maison
n|L'appartement|logement~nm;studio~nm;appart~nm|appartement
n|La pièce|salle~nf;chambre~nf;séjour~nm|pièce
n|La rue|ruelle~nf;avenue~nf;boulevard~nm;allée~nf;chaussée~nf|rue
n|La voiture|auto~nf;véhicule~nm;bagnole~nf;caisse~nf;berline~nf;guimbarde~nf|voiture
n|L'homme|type~nm;individu~nm;gars~nm;monsieur~nm;bonhomme~nm;mec~nm;gaillard~nm|homme
n|La femme|dame~nf;jeune femme~nf;inconnue~nf;nana~nf;meuf~nf|femme
n|L'enfant|gamin~nm;gosse~nm;petit~nm;bambin~nm;môme~nm|enfant
n|La nuit|obscurité~nf;soir~nm;ténèbres~nfp|nuit
n|Le matin|aube~nf;aurore~nf;petit jour~nm;lever du jour~nm|matin
n|Le soir|crépuscule~nm;tombée de la nuit~nf;soirée~nf|soir
n|La porte|entrée~nf;battant~nm;seuil~nm|porte
n|La fenêtre|vitre~nf;carreau~nm;baie vitrée~nf|fenêtre
n|La main|paume~nf;poing~nm;doigts~nmp|main
n|Les larmes|pleurs~nmp;sanglots~nmp|larmes,larme
n|Le cri|hurlement~nm;clameur~nf;exclamation~nf;appel~nm|cri
n|Le coup|choc~nm;impact~nm;heurt~nm;gifle~nf|coup
n|Le sourire|rictus~nm;risette~nf;sourire en coin~nm|sourire
n|Le cœur|poitrine~nf;âme~nf|cœur
n|La ville|cité~nf;métropole~nf;agglomération~nf|ville
n|Le chemin|sentier~nm;route~nf;piste~nf;voie~nf|chemin
n|La forêt|bois~nm;sous-bois~nm;futaie~nf|forêt
n|La mer|océan~nm;flots~nmp;large~nm|mer
n|Le ciel|firmament~nm;voûte céleste~nf;nuages~nmp|ciel
n|La pluie|averse~nf;ondée~nf;bruine~nf;crachin~nm;déluge~nm|pluie
n|Le vent|brise~nf;bourrasque~nf;rafale~nf;souffle~nm|vent
n|Le feu|flammes~nfp;brasier~nm;incendie~nm|feu
n|L'argent|fric~nm;pognon~nm;oseille~nf;liquide~nm|argent
n|Le travail|boulot~nm;job~nm;emploi~nm;tâche~nf|travail
n|L'ami|copain~nm;camarade~nm;pote~nm;compagnon~nm|ami
n|Le problème|souci~nm;ennui~nm;difficulté~nf;embrouille~nf|problème
n|La joie|bonheur~nm;allégresse~nf;gaieté~nf;euphorie~nf|joie
n|La honte|gêne~nf;embarras~nm;humiliation~nf|honte
n|La surprise|étonnement~nm;stupeur~nf;stupéfaction~nf|surprise
n|La fatigue|épuisement~nm;lassitude~nf;exténuation~nf|fatigue
n|Le corps|silhouette~nf;carcasse~nf|corps
n|La table|bureau~nm;comptoir~nm;établi~nm|table
n|Le lit|couche~nf;matelas~nm;pieu~nm|lit
n|Le téléphone|portable~nm;mobile~nm;combiné~nm|téléphone
n|L'arme|pistolet~nm;revolver~nm;flingue~nm;fusil~nm|arme
n|La lettre|missive~nf;courrier~nm;mot~nm;billet~nm|lettre
a|Grand|immense;gigantesque;énorme;imposant;colossal;géant;titanesque|grand
a|Petit|minuscule;menu;frêle;chétif;exigu;riquiqui;microscopique|petit
a|Beau|magnifique;superbe;splendide;ravissant;séduisant|beau
a|Belle|magnifique;superbe;splendide;ravissante;séduisante|belle
a|Laid|affreux;hideux;disgracieux;moche|laid
a|Vieux|âgé;ancien;usé;vétuste;décrépit|vieux
a|Jeune|juvénile;adolescent|jeune
a|Sombre|obscur;ténébreux;noir;lugubre|sombre
a|Froid|glacial;glacé;frais;gelé|froid
a|Chaud|brûlant;torride;bouillant;étouffant|chaud
a|Calme|serein;paisible;tranquille;posé;placide|calme
a|Nerveux|agité;fébrile;tendu;anxieux;crispé|nerveux
a|Inquiet|soucieux;préoccupé;anxieux;angoissé|inquiet
a|Effrayé|apeuré;terrifié;épouvanté;terrorisé;affolé|effrayé
a|Heureux|ravi;comblé;radieux;enchanté;aux anges|heureux
a|Content|satisfait;ravi;réjoui|content
a|Gêné|embarrassé;mal à l'aise;confus;troublé|gêné
a|Fier|orgueilleux;hautain;altier|fier
a|Seul|solitaire;isolé;esseulé|seul
a|Vide|désert;dépeuplé;inoccupé;abandonné|vide
a|Rapide|vif;prompt;fulgurant;véloce|rapide
a|Lent|nonchalant;traînant;indolent|lent
a|Fort|costaud;robuste;puissant;solide;baraqué|fort
a|Faible|fragile;frêle;chancelant;épuisé|faible
a|Sale|crasseux;poisseux;souillé;dégoûtant|sale
a|Propre|net;impeccable;immaculé;nickel|propre
a|Étrange|bizarre;curieux;insolite;singulier;déroutant|étrange,bizarre
a|Pâle|blême;livide;blafard;cireux|pâle
a|Ivre|soûl;éméché;pompette;bourré|ivre
a|Malade|souffrant;fiévreux;mal en point|malade
a|Blessé|meurtri;touché;amoché|blessé
a|Mort|décédé;sans vie;inanimé|mort
a|Furieux|enragé;furibond;fou de rage|furieux
a|Gentil|aimable;doux;bienveillant;attentionné|gentil
a|Méchant|cruel;malveillant;odieux;mauvais|méchant
a|Intelligent|brillant;malin;futé;astucieux|intelligent
a|Bête|idiot;stupide;sot;niais|bête
a|Bruyant|tapageur;assourdissant;sonore|bruyant
a|Énorme|gigantesque;colossal;monumental;démesuré|énorme
a|Joli|mignon;charmant;gracieux|joli
x|Enfin|finalement;au bout du compte;en fin de compte;pour finir|enfin
x|D'abord|en premier;tout d'abord;pour commencer;avant tout|d'abord
x|Parfois|quelquefois;de temps en temps;par moments;de temps à autre|parfois
x|Souvent|fréquemment;régulièrement;maintes fois;bien des fois|souvent
x|Toujours|sans cesse;constamment;en permanence;continuellement|toujours
x|Jamais|à aucun moment;en aucun cas;nullement|jamais
x|Presque|quasiment;pratiquement;à peu près;pour ainsi dire|presque
x|Vraiment|réellement;véritablement;sincèrement;franchement|vraiment
x|Beaucoup|énormément;considérablement;largement;pas mal|beaucoup
x|Trop|excessivement;à l'excès;exagérément|trop
x|Ensemble|côte à côte;de concert;main dans la main|ensemble
x|Partout|en tout lieu;de tous côtés;aux quatre coins|partout
x|Brusquement|sèchement;vivement;d'un geste vif;abruptement|brusquement
x|Calmement|posément;tranquillement;sereinement;sans s'énerver|calmement
x|Nerveusement|fébrilement;anxieusement;avec agitation|nerveusement
x|Tristement|mélancoliquement;d'un air triste;le cœur lourd|tristement
x|En silence|sans un mot;sans bruit;silencieusement|en silence
x|À bout de souffle|essoufflé~a;haletant~a;hors d'haleine;le souffle court|essoufflé,à bout de souffle
x|Les larmes aux yeux|les yeux embués;les yeux humides;au bord des larmes;les yeux rougis|larmes aux yeux
x|Mal à l'aise|gêné~a;embarrassé~a;troublé~a;dans ses petits souliers|mal à l'aise
x|Au même moment|au même instant;simultanément;pile à ce moment|au même moment
x|Plus tard|par la suite;un peu après;quelques instants plus tard|plus tard
x|Tout à coup|soudain;subitement;brusquement;sans crier gare|tout à coup
v|Bouger|bouger>i;remuer>i;gigoter>i;s'agiter>i;se déplacer>i|bouger
v|Sauter|sauter>i;bondir>i;s'élancer>i;faire un bond>i;enjamber>d|sauter
v|Glisser, perdre l'équilibre|glisser>i;déraper>i;patiner>i;perdre l'équilibre>i|déraper
v|Escalader|se hisser>sur;grimper>sur;escalader>d;crapahuter>i|grimper
v|Ramper|ramper>i;se traîner>i;avancer à quatre pattes>i|ramper
v|S'agenouiller|s'agenouiller>i;se mettre à genoux>i;tomber à genoux>i|agenouiller
v|S'allonger|s'allonger>i;s'étendre>i;se coucher>i;se vautrer>i|allonger,coucher
v|Fumer|fumer>d;griller une cigarette>i;allumer une cigarette>i;tirer une bouffée>i|fumer
v|Cuisiner|cuisiner>d;préparer>d;mijoter>d;concocter>d|cuisiner
v|Nettoyer|nettoyer>d;essuyer>d;frotter>d;laver>d;astiquer>d|nettoyer
v|Ranger|ranger>d;trier>d;classer>d;mettre de l'ordre>dans|ranger
v|S'habiller|s'habiller>i;enfiler>d;revêtir>d;passer>d|habiller
v|Se déshabiller|se déshabiller>i;ôter>d;retirer>d;enlever>d|déshabiller,enlever
v|Couper|couper>d;trancher>d;découper>d;tailler>d;sectionner>d|couper
v|Déchirer|déchirer>d;lacérer>d;mettre en pièces>d|déchirer
v|Froisser|froisser>d;chiffonner>d;plier>d;replier>d|froisser,plier
v|Remplir|remplir>d;verser>d;emplir>d;servir>d|remplir
v|Vider|vider>d;renverser>d;déverser>d|vider
v|Acheter|acheter>d;se procurer>d;acquérir>d|acheter
v|Vendre|vendre>d;céder>d;brader>d|vendre
v|Payer|payer>d;régler>d;rembourser>d;débourser>d|payer
v|Voler|voler>d;dérober>d;subtiliser>d;piquer>d;chaparder>d|voler
v|Attraper|attraper>d;rattraper>d;intercepter>d;capturer>d|attraper
v|Poursuivre|poursuivre>d;pourchasser>d;traquer>d;talonner>d|poursuivre
v|Suivre|suivre>d;emboîter le pas>à;accompagner>d;escorter>d;filer>d|suivre
v|Guider|guider>d;mener>d;entraîner>d;escorter>d|guider
v|Attaquer|attaquer>d;agresser>d;assaillir>d;se jeter>sur|attaquer
v|Protéger|protéger>d;défendre>d;abriter>d;couvrir>d|protéger
v|Sauver|sauver>d;secourir>d;tirer d'affaire>d;délivrer>d|sauver
v|Blesser|blesser>d;meurtrir>d;amocher>d|blesser
v|Soigner|soigner>d;panser>d;bander>d;guérir>d|soigner
v|Faire feu|faire feu>i;ouvrir le feu>i;tirer>sur;mitrailler>d|feu
v|Viser|viser>d;mettre en joue>d;braquer>d|viser
v|Exploser|exploser>i;éclater>i;sauter>i;voler en éclats>i|exploser
v|Brûler|brûler>i;flamber>i;se consumer>i;prendre feu>i|brûler
v|Couler|couler>i;ruisseler>i;dégouliner>i;s'écouler>i|couler
v|Renifler|renifler>d;humer>d;flairer>d|renifler
v|Goûter|goûter>d;savourer>d;déguster>d|goûter
v|Promettre|promettre>d;jurer>d;assurer>d;garantir>d|promettre
v|Supplier|supplier>d;implorer>d;conjurer>d;prier>d|supplier,prier
v|Ordonner|ordonner>d;commander>d;exiger>d;intimer>d|ordonner
v|Se disputer|se disputer>avec;se quereller>avec;s'engueuler>avec;se chamailler>avec|disputer
v|Insulter|insulter>d;injurier>d;offenser>d|insulter
v|Se moquer|se moquer>de;railler>d;persifler>d|moquer
v|Remercier|remercier>d;dire merci>à;exprimer sa gratitude>à|remercier
v|S'excuser|s'excuser>i;demander pardon>à;faire amende honorable>i|excuser
v|Pardonner|pardonner>d;excuser>d;absoudre>d|pardonner
v|Saluer|saluer>d;faire signe>à;accueillir>d;serrer la main>à|saluer
v|Rencontrer|rencontrer>d;croiser>d;tomber sur>d;retrouver>d|rencontrer
v|Inviter|inviter>d;convier>d;recevoir>d|inviter
v|Quitter quelqu'un|quitter>d;abandonner>d;laisser tomber>d;plaquer>d|quitter
v|Décider|décider>d;choisir>d;trancher>i;opter>pour|décider
v|Préparer|préparer>d;organiser>d;planifier>d;arranger>d|préparer
v|Réparer|réparer>d;bricoler>d;rafistoler>d;remettre en état>d|réparer
v|Construire|construire>d;bâtir>d;édifier>d;monter>d|construire
v|Détruire|détruire>d;démolir>d;ravager>d;saccager>d;anéantir>d|détruire
v|Gagner|gagner>d;remporter>d;triompher>i;l'emporter>i|gagner
v|Perdre|perdre>d;égarer>d;échouer>i|perdre
v|Jouer|jouer>i;s'amuser>i;batifoler>i|jouer
v|Danser|danser>i;valser>i;se trémousser>i;tournoyer>i|danser
v|Chanter|chanter>d;fredonner>d;chantonner>d;entonner>d|chanter
v|Siffler|siffler>i;siffloter>i|siffler
v|Grogner, râler|maugréer>i;ronchonner>i;bougonner>i;pester>i|ronchonner
v|Soupçonner|soupçonner>d;se méfier>de;douter>de;suspecter>d|soupçonner
v|Croire|croire>d;penser>d;estimer>d;supposer>d;s'imaginer>d|croire
v|Imaginer|imaginer>d;se figurer>d;fantasmer>sur;se représenter>d|imaginer
v|Rêver|rêver>i;rêvasser>i;songer>i;être dans la lune>i|rêver
v|S'inquiéter|s'inquiéter>i;s'en faire>i;se tracasser>i;se faire du souci>i|inquiéter
v|Paniquer|paniquer>i;s'affoler>i;perdre la tête>i;céder à la panique>i|paniquer
v|Sursauter|sursauter>i;tressaillir>i;faire un bond>i|sursauter
v|Se détendre|se détendre>i;se relâcher>i;décompresser>i;souffler un peu>i|détendre
v|Regretter|regretter>d;se reprocher>d;s'en vouloir>i|regretter
v|Espérer|espérer>d;souhaiter>d;compter>sur|espérer
v|Craindre|craindre>d;redouter>d;appréhender>d;avoir peur>de|craindre
v|Partager|partager>d;diviser>d;répartir>d|partager
v|Envoyer|envoyer>d;expédier>d;adresser>d;transmettre>d|envoyer
v|Recevoir|recevoir>d;obtenir>d;récupérer>d|recevoir
v|Bâiller|bâiller>i;s'étirer>i|bâiller
v|Tousser|tousser>i;toussoter>i;s'étrangler>i;s'étouffer>i|tousser
v|Vomir|vomir>i;rendre>i;avoir un haut-le-cœur>i|vomir
v|S'évanouir|s'évanouir>i;perdre connaissance>i;tomber dans les pommes>i;défaillir>i|évanouir
v|Grimacer|grimacer>i;se crisper>i;faire la grimace>i|grimacer
v|Caresser|caresser>d;flatter>d;cajoler>d|caresser
v|Gratter|gratter>d;griffer>d;érafler>d|gratter
v|Mordre|mordre>d;mordiller>d;croquer>d|mordre
v|Fouetter|fouetter>d;cingler>d;battre>d|fouetter
v|Pleuvoir|pleuvoir>i;tomber des cordes>i;crachiner>i;bruiner>i|pleuvoir
v|S'assombrir|s'assombrir>i;s'obscurcir>i;se couvrir>i|assombrir
v|Grincer|grincer>i;crisser>i;craquer>i|grincer
v|Claquer|claquer>i;battre>i;cogner>i|claquer
v|Vibrer|vibrer>i;bourdonner>i;vrombir>i|vibrer
v|Rouler|rouler>i;dévaler>d;tournoyer>i|rouler
n|La chambre|piaule~nf;chambrette~nf;pièce~nf|chambre
n|La cuisine|kitchenette~nf;coin cuisine~nm|cuisine
n|Le couloir|corridor~nm;passage~nm;galerie~nf|couloir
n|L'escalier|marches~nfp;cage d'escalier~nf|escalier
n|Le toit|toiture~nf;terrasse~nf|toit
n|Le jardin|parc~nm;potager~nm;cour~nf|jardin
n|Le bar|café~nm;troquet~nm;rade~nm;bistrot~nm|bar
n|Le restaurant|brasserie~nf;cantine~nf;resto~nm|restaurant
n|L'hôpital|clinique~nf;urgences~nfp;hosto~nm|hôpital
n|L'école|lycée~nm;collège~nm;établissement~nm|école
n|La gare|quai~nm;station~nf|gare
n|Le village|bourg~nm;hameau~nm;patelin~nm|village
n|La route|autoroute~nf;nationale~nf;départementale~nf|route
n|La campagne|champs~nmp;cambrousse~nf;province~nf|campagne
n|La montagne|sommet~nm;pic~nm;mont~nm|montagne
n|La rivière|fleuve~nm;ruisseau~nm;cours d'eau~nm|rivière
n|La plage|rivage~nm;bord de mer~nm;littoral~nm|plage
n|Le bateau|navire~nm;embarcation~nf;barque~nf;rafiot~nm|bateau
n|L'avion|appareil~nm;coucou~nm;jet~nm|avion
n|Le train|convoi~nm;rame~nf;wagon~nm|train
n|La moto|bécane~nf;deux-roues~nm;scooter~nm|moto
n|Le policier|flic~nm;agent~nm;inspecteur~nm;gendarme~nm|policier,flic
n|Le médecin|docteur~nm;toubib~nm;praticien~nm|médecin
n|Le patron|chef~nm;boss~nm;directeur~nm;supérieur~nm|patron
n|La mère|maman~nf;mère de famille~nf|mère
n|Le père|papa~nm;paternel~nm|père
n|Le frère|frangin~nm|frère
n|La sœur|frangine~nf|sœur
n|Le mari|époux~nm;conjoint~nm;compagnon~nm|mari
n|L'épouse|épouse~nf;conjointe~nf;compagne~nf|épouse
n|Le vieillard|vieil homme~nm;ancien~nm;aïeul~nm;papy~nm|vieillard
n|La foule|monde~nm;cohue~nf;attroupement~nm;masse~nf|foule
n|L'inconnu|étranger~nm;quidam~nm;individu~nm|inconnu
n|L'ennemi|adversaire~nm;rival~nm;opposant~nm|ennemi
n|La tête|crâne~nm;caboche~nf;citron~nm|tête
n|Les cheveux|chevelure~nf;tignasse~nf;crinière~nf|cheveux
n|Le dos|échine~nf;reins~nmp|dos
n|Les jambes|guiboles~nfp;gambettes~nfp|jambes
n|La peau|épiderme~nm;teint~nm|peau
n|Les vêtements|habits~nmp;tenue~nf;fringues~nfp;affaires~nfp|vêtements,vêtement
n|Le manteau|pardessus~nm;veste~nf;imperméable~nm;blouson~nm|manteau
n|Le sac|sacoche~nf;besace~nf;cartable~nm;valise~nf|sac
n|La clé|clef~nf;trousseau~nm|clé
n|Le verre|coupe~nf;gobelet~nm;tasse~nf|verre
n|La bouteille|flasque~nf;carafe~nf;fiole~nf|bouteille
n|Le repas|déjeuner~nm;dîner~nm;festin~nm;casse-croûte~nm|repas
n|Le livre|bouquin~nm;ouvrage~nm;roman~nm;volume~nm|livre
n|La photo|cliché~nm;image~nf;portrait~nm|photo
n|Le secret|mystère~nm;confidence~nf;énigme~nf|secret
n|Le mensonge|bobard~nm;invention~nf;tromperie~nf|mensonge
n|La vérité|réalité~nf;fait~nm;exactitude~nf|vérité
n|La mort|décès~nm;trépas~nm;disparition~nf|mort
n|La vie|existence~nf;destin~nm;vécu~nm|vie
n|L'amour|passion~nf;tendresse~nf;affection~nf;béguin~nm|amour
n|La haine|aversion~nf;rancœur~nf;animosité~nf;répulsion~nf|haine
n|L'espoir|espérance~nf;optimisme~nm;attente~nf|espoir
n|Le danger|péril~nm;menace~nf;risque~nm|danger
n|Le plan|projet~nm;stratagème~nm;combine~nf;idée~nf|plan
n|L'idée|pensée~nf;intuition~nf;concept~nm;lubie~nf|idée
n|La question|interrogation~nf;demande~nf|question
n|La réponse|réplique~nf;riposte~nf;répartie~nf|réponse
n|La dispute|querelle~nf;altercation~nf;engueulade~nf;prise de bec~nf|dispute
n|La bagarre|rixe~nf;échauffourée~nf;baston~nf;mêlée~nf|bagarre
n|Le baiser|bisou~nm;bise~nf;embrassade~nf|baiser
n|L'odeur|parfum~nm;relent~nm;effluve~nm;puanteur~nf|odeur
n|Le froid|fraîcheur~nf;gel~nm|froid
n|La chaleur|canicule~nf;fournaise~nf;moiteur~nf|chaleur
n|L'orage|tempête~nf;tonnerre~nm;éclair~nm|orage
n|Le brouillard|brume~nf;purée de pois~nf|brouillard
n|La neige|flocons~nmp;poudreuse~nf|neige
n|Le soleil|astre~nm;rayons~nmp|soleil
n|La lune|croissant~nm;astre de la nuit~nm|lune
n|L'eau|flotte~nf;liquide~nm|eau
n|Le sol|plancher~nm;parquet~nm;carrelage~nm;terre~nf|sol
n|Le mur|paroi~nf;cloison~nf;muraille~nf|mur
n|La fin|terme~nm;conclusion~nf;dénouement~nm;issue~nf|fin
n|Le début|commencement~nm;départ~nm;origine~nf|début
a|Riche|aisé;fortuné;nanti;plein aux as|riche
a|Pauvre|démuni;fauché;indigent;sans le sou|pauvre
a|Gros|corpulent;massif;enrobé;bedonnant|gros
a|Mince|svelte;élancé;fin;filiforme|mince
a|Maigre|squelettique;décharné;efflanqué;famélique|maigre
a|Courageux|brave;audacieux;intrépide;vaillant|courageux
a|Lâche|peureux;couard;poltron;froussard|lâche
a|Honnête|franc;loyal;sincère;intègre|honnête
a|Menteur|fourbe;hypocrite;faux;sournois|menteur
a|Timide|réservé;craintif;effacé;introverti|timide
a|Bavard|loquace;volubile;causant|bavard
a|Drôle|amusant;comique;hilarant;marrant|drôle
a|Sérieux|grave;solennel;austère|sérieux
a|Confiant|sûr de lui;assuré;déterminé;résolu|confiant
a|Perdu|égaré;désorienté;déboussolé;paumé|perdu
a|Pressé|impatient;fébrile;speed|pressé
a|Jaloux|envieux;possessif|jaloux
a|Amoureux|épris;entiché;fou amoureux|amoureux
a|Ému|touché;bouleversé;attendri;remué|ému
a|Choqué|sous le choc;secoué;traumatisé|choqué
a|Dégoûté|écœuré;révulsé;répugné|dégoûté
a|Soulagé|rassuré;apaisé;libéré|soulagé
a|Déçu|désappointé;dépité;désenchanté|déçu
a|Ennuyé|las;blasé;morne|ennuyé
a|Pensif|songeur;rêveur;absorbé;méditatif|pensif
a|Concentré|attentif;appliqué;absorbé|concentré
a|Méfiant|soupçonneux;sur ses gardes;défiant|méfiant
a|Dangereux|périlleux;risqué;menaçant|dangereux
a|Lumineux|clair;éclatant;radieux;ensoleillé|lumineux
a|Mouillé|humide;trempé;moite;détrempé|mouillé,humide
a|Sec|aride;desséché|sec
a|Ancien|antique;d'époque|ancien
a|Moderne|récent;neuf;actuel|moderne
a|Luxueux|somptueux;cossu;opulent;huppé|luxueux
a|Miteux|délabré;sordide;décrépit|miteux
a|Étroit|exigu;resserré;confiné|étroit
a|Large|vaste;spacieux;ample|large
a|Lourd|pesant;massif;écrasant|lourd
a|Léger|aérien;délicat|léger
a|Doux|tendre;moelleux;soyeux;velouté|doux
a|Dur|rigide;rugueux;ferme|dur
a|Rouge (visage)|cramoisi;écarlate;empourpré|rouge
x|À pas comptés|pas à pas;à petits pas;à pas lents|à pas comptés
x|À voix basse|à mi-voix;dans un souffle;tout bas|à voix basse
x|À voix haute|à tue-tête;à pleins poumons;haut et fort|à voix haute
x|Ailleurs|autre part;loin d'ici|ailleurs
x|Maintenant|à présent;désormais;en ce moment|maintenant
x|Aujourd'hui|ce jour;de nos jours|aujourd'hui
x|Bientôt|sous peu;prochainement;d'ici peu|bientôt
x|Seulement|uniquement;juste;simplement|seulement
x|Surtout|particulièrement;notamment;avant tout|surtout
x|Pourtant|cependant;néanmoins;toutefois;malgré tout|pourtant
x|Évidemment|bien sûr;naturellement;forcément|évidemment
x|Discrètement|en douce;l'air de rien;furtivement|discrètement
x|Violemment|brutalement;rageusement;avec force|violemment
x|Tendrement|affectueusement;amoureusement|tendrement
x|Froidement|sèchement;glacialement;d'un ton sec|froidement
x|Joyeusement|gaiement;allègrement;avec entrain|joyeusement
x|Prudemment|précautionneusement;sur la pointe des pieds|prudemment
x|Péniblement|difficilement;laborieusement;avec peine|péniblement
x|Longuement|un long moment;interminablement|longuement
x|Aussitôt|dans la foulée;instantanément|aussitôt
x|De loin|à distance;au loin|de loin
x|De près|à proximité;tout près|de près
x|En face|vis-à-vis;de l'autre côté|en face
x|Au bout d'un moment|après un temps;au bout d'un instant|au bout d'un moment
x|En même temps|simultanément;à la fois|en même temps
x|Petit à petit|peu à peu;progressivement;graduellement|petit à petit
x|Sans un mot|sans rien dire;en silence;muet~a|sans un mot
x|Le regard dans le vague|le regard perdu;le regard dans le vide;absent~a|regard dans le vague
x|Les poings serrés|les poings fermés;crispé~a;tendu~a|poings serrés
x|Le cœur battant|le cœur battant la chamade;le pouls emballé|cœur battant
x|En sueur|en nage;trempé de sueur;ruisselant~a|en sueur
`;
/* Dictionnaire anglais : même format, types en majuscules (V verbe, N nom, A adjectif, X expression). Les verbes
   et les noms anglais prennent la forme du mot cliqué (looked → glanced, rooms → chambers) : voir synEnForm. */
const SYN_DB_EN = `
V|Stare|stare>at;gaze>at;glare>at;peer>at;eye>d;fix>on;goggle>at;ogle>d|look,stare
V|Look closely|examine>d;study>d;scrutinize>d;inspect>d;survey>d;observe>d|look,watch
V|Quick look|glance>at;peek>at;peep>at;sneak a look>at;steal a glance>at;cast a glance>at;take a peek>at;check out>d|look
V|Watch, spy|watch>d;observe>d;spy>on;keep an eye>on;monitor>d|watch
V|Look away|look away>i;avert>d;turn away>i;glance away>i|look
V|Turn|turn>i;spin around>i;whirl around>i;swivel>i;pivot>i;turn around>i|turn
V|Sigh|sigh>i;exhale>i;let out a sigh>i;breathe out>i|sigh
V|Walk slowly|stroll>i;amble>i;saunter>i;wander>i;meander>i;shuffle>i;mosey>i;trudge>i;plod>i;lumber>i|walk
V|Walk with purpose|stride>i;march>i;stalk>i;pace>i;storm>i;stomp>i;strut>i|walk
V|Walk quietly|tiptoe>i;creep>i;sneak>i;slip>i;pad>i|walk
V|Run|run>i;dash>i;sprint>i;race>i;bolt>i;rush>i;hurry>i;scramble>i;dart>i;hustle>i;scurry>i|run
V|Go toward|head>toward;approach>d;move>toward;close in>on|go,walk,approach
V|Enter|enter>d;come in>i;step in>i;walk in>i;burst in>i;barge in>i;slip in>i|enter
V|Leave|leave>d;exit>d;depart>i;walk out>i;storm out>i;slip out>i;take off>i|leave,exit
V|Smile|smile>at;grin>at;beam>at;smirk>at;crack a smile>i;grin from ear to ear>i|smile
V|Laugh|laugh>i;chuckle>i;giggle>i;snicker>i;burst out laughing>i;cackle>i;guffaw>i;crack up>i;howl>i;titter>i|laugh
V|Cry|cry>i;weep>i;sob>i;well up>i;break down>i;burst into tears>i;whimper>i;bawl>i;blubber>i;sniffle>i|cry
V|Shout|shout>i;yell>i;scream>i;shriek>i;bellow>i;roar>i;holler>i;cry out>i;howl>i;screech>i|shout,yell,scream
V|Tremble|tremble>i;shake>i;shiver>i;quiver>i;shudder>i;quake>i|tremble,shake
V|Freeze|freeze>i;stiffen>i;go still>i;stop dead>i;stand frozen>i|freeze
V|Say quietly|whisper>d;murmur>d;mutter>d;mumble>d;breathe>d;hiss>d|say,whisper
V|Say loudly|announce>d;declare>d;exclaim>d;blurt out>d;call out>d|say
V|Say|say>d;tell>d;state>d;add>d;remark>d;note>d;mention>d;point out>d;comment>d|say
V|Answer|answer>d;reply>d;respond>i;retort>d;fire back>i;counter>d;shoot back>i|answer,reply
V|Nod|nod>i;agree>i;nod along>i;give a nod>i|nod
V|Stand up|stand up>i;get up>i;rise>i;jump up>i;straighten up>i|stand,get up
V|Sit down|sit down>i;take a seat>i;settle>i;slump>i;flop down>i;perch>i;collapse>i|sit
V|Grab|grab>d;seize>d;snatch>d;grasp>d;clutch>d;grip>d;nab>d;take hold>of|grab,take
V|Touch|touch>d;brush>d;stroke>d;caress>d;tap>d;graze>d|touch
V|Hold|hold>d;clutch>d;squeeze>d;cling>to;hug>d|hold
V|Hit|hit>d;strike>d;punch>d;slap>d;smack>d;whack>d;pound>d;kick>d;knock>d;bash>d;thump>d|hit
V|Throw|throw>d;toss>d;hurl>d;fling>d;chuck>d;lob>d;pitch>d;sling>d|throw
V|See|see>d;notice>d;spot>d;catch sight>of;glimpse>d;make out>d;detect>d;witness>d|see
V|Hear|hear>d;catch>d;overhear>d;pick up>d|hear,listen
V|Wait|wait>i;linger>i;hang back>i;hold on>i|wait
V|Fall|fall>i;collapse>i;tumble>i;stumble>i;trip>i;topple>i;crumple>i;slump>i;keel over>i;go down>i|fall
V|Talk|talk>to;speak>to;chat>with;converse>with;discuss>d|talk,speak
V|Think|think>i;ponder>d;wonder>i;reflect>i;consider>d;muse>i;mull over>d;contemplate>d;brood>i|think
V|Start|start>d;begin>d;launch>d;set about>d;get going>i|start,begin
V|Seem|seem>i;appear>i;look>i|seem
V|Stay|stay>i;remain>i;linger>i;stick around>i|stay
V|Breathe|breathe>i;inhale>i;gasp>i;pant>i;draw breath>i|breathe
V|Open|open>d;unlock>d;pull open>d;push open>d;fling open>d;throw open>d;crack open>d|open
V|Close|close>d;shut>d;slam>d;lock>d;pull shut>d;bolt>d;latch>d|close,shut
V|Take|take>d;pick up>d;collect>d;fetch>d|take
V|Put|put>d;place>d;set>d;lay>d;drop>d;rest>d|put
V|Give|give>d;hand>d;pass>d;offer>d;slide>d|give
V|Search|search>d;look for>d;hunt for>d;rummage>through;dig through>d;scour>d;comb through>d;sift through>d|search
V|Find|find>d;discover>d;come across>d;stumble upon>d;dig up>d|find
V|Show|show>d;point to>d;point at>d;indicate>d;reveal>d;display>d|show
V|Arrive|arrive>i;show up>i;turn up>i;appear>i;pull up>i|arrive
V|Return|return>i;come back>i;go back>i;head back>i;reappear>i|return
V|Flee|flee>i;run away>i;escape>i;bolt>i;take off>i;make a run for it>i|flee
V|Hide|hide>i;duck>i;crouch>i;take cover>i|hide
V|Try|try>to;attempt>to;struggle>to;strive>to|try
V|Help|help>d;assist>d;support>d;aid>d;give a hand>i;lend a hand>i;back up>d|help
V|Call|call>d;call out>to;shout for>d;summon>d;hail>d|call
V|Push|push>d;shove>d;nudge>d;press>d;thrust>d|push
V|Pull|pull>d;drag>d;tug>d;yank>d;haul>d|pull
V|Kiss, hug|kiss>d;embrace>d;hug>d;hold close>d|kiss,hug
V|Understand|understand>d;realize>d;get>d;grasp>d;figure out>d|understand,realize
V|Remember|remember>d;recall>d;recollect>d;think back>i|remember
V|Forget|forget>d;overlook>d;lose track>of|forget
V|Want|want>d;wish>for;crave>d;long>for;desire>d|want
V|Love|love>d;adore>d;cherish>d;treasure>d|love
V|Hate|hate>d;loathe>d;despise>d;detest>d|hate
V|Hesitate|hesitate>i;pause>i;falter>i;waver>i;hang back>i|hesitate
V|Refuse|refuse>d;decline>d;reject>d;turn down>d|refuse
V|Stop|stop>i;halt>i;pause>i;freeze>i;come to a stop>i|stop
V|Continue|continue>d;keep going>i;carry on>i;go on>i;press on>i|continue
V|Finish|finish>d;end>d;complete>d;wrap up>d|finish
V|Eat|eat>d;devour>d;wolf down>d;munch>d;nibble>d;gobble>d;chow down>i;scarf down>d|eat
V|Drink|drink>d;sip>d;gulp>d;swig>d;knock back>d;chug>d;nurse>d|drink
V|Sleep|sleep>i;doze>i;nap>i;snooze>i;drift off>i;drop off>i;crash>i;conk out>i|sleep
V|Wake up|wake up>i;stir>i;come to>i;awaken>i|wake
V|Write|write>d;scribble>d;jot down>d;note>d;scrawl>d|write
V|Read|read>d;scan>d;skim>d;pore over>d;browse>d|read
V|Fight|fight>d;struggle>i;wrestle>d;brawl>i;scuffle>i|fight
V|Kill|kill>d;murder>d;slay>d;take out>d;finish off>d;execute>d;eliminate>d;bump off>d|kill
V|Die|die>i;pass away>i;perish>i;expire>i;slip away>i|die
V|Drive|drive>d;steer>d;speed>i;cruise>i;pull away>i|drive
V|Climb|climb>d;scale>d;clamber>up;scramble>up;ascend>d|climb
V|Shine|shine>i;glow>i;gleam>i;glint>i;sparkle>i;glitter>i;shimmer>i|shine
V|Break|break>d;smash>d;shatter>d;crack>d;snap>d;splinter>d;bust>d|break
V|Groan|groan>i;moan>i;whimper>i;grunt>i;wince>i|groan,moan
V|Blush|blush>i;flush>i;redden>i;turn red>i|blush
V|Swallow|swallow>i;gulp>i;swallow hard>i|swallow
V|Back away|back away>i;step back>i;retreat>i;recoil>i;shrink back>i|back away,retreat
V|Lean|lean>toward;bend>down;stoop>i;crouch>i;hunch>over|lean,bend
V|Ask|ask>d;inquire>i;question>d;demand>d|ask
V|Explain|explain>d;clarify>d;describe>d;spell out>d|explain
V|Lie|lie>i;bluff>i;make up>d;fib>i|lie
V|Admit|admit>d;confess>d;acknowledge>d;own up>i|admit
V|Threaten|threaten>d;intimidate>d;menace>d;warn>d|threaten
V|Comfort|comfort>d;reassure>d;soothe>d;console>d;calm>d|comfort,reassure
V|Calm down|calm down>i;relax>i;settle down>i;cool off>i|calm
V|Get angry|snap>i;blow up>i;fly off the handle>i;fume>i;see red>i|angry
V|Shrug|shrug>i;pout>i;smirk>i|shrug
V|Frown|frown>i;scowl>i;squint>i;grimace>i|frown
V|Blink|blink>i;wink>i;blink rapidly>i|blink
V|Sneak|sneak>i;slip>i;slink>i;creep>i;edge>toward|sneak
N|The eyes|gaze;stare;glance;look|eyes,eye
N|The gaze|look;stare;glance;glare;eyes|gaze
N|The face|features;expression;countenance;visage|face
N|Silence|quiet;hush;stillness;calm|silence
N|A loud noise|racket;din;clamor;uproar;commotion;crash;bang;clatter;blast;roar|noise
N|A faint sound|murmur;rustle;whisper;hum;creak;click|sound
N|The voice|tone;timbre;pitch|voice
N|A moment|instant;second;minute;beat|moment
N|Fear|terror;dread;panic;fright;horror;anxiety;alarm;unease|fear
N|Anger|rage;fury;wrath;irritation;outrage;resentment|anger
N|Sadness|sorrow;grief;gloom;despair;melancholy|sadness
N|Light|glow;gleam;glare;radiance;beam|light
N|Darkness|shadow;gloom;dark;dimness|darkness,shadow
N|The house|home;place;residence;building;cottage;mansion;shack|house
N|The room|chamber;space;quarters|room
N|The street|road;avenue;alley;lane;boulevard|street
N|The car|vehicle;ride;auto;sedan;truck;wheels|car
N|The man|guy;fellow;gentleman;stranger;dude;bloke|man
N|The woman|lady;girl;stranger;gal|woman
N|The child|kid;boy;girl;youngster;toddler|child,kid
N|The night|evening;dark;nighttime|night
N|The morning|dawn;daybreak;sunrise|morning
N|The door|doorway;entrance;exit|door
N|The window|pane;glass|window
N|The hand|fist;palm;fingers|hand
N|Tears|sobs;weeping|tears
N|A scream|cry;shriek;yell;shout;howl|scream
N|A blow|hit;punch;slap;strike;knock|blow
N|A smile|grin;smirk;beam;half-smile|smile
N|The city|town;metropolis|city
N|The path|trail;track;way;road|path
N|Money|cash;dough;funds|money
N|The job|work;gig;task|job
N|The friend|pal;buddy;mate;companion|friend
N|A problem|issue;trouble;snag;hitch|problem
N|Joy|happiness;delight;glee;bliss|joy
N|Shame|embarrassment;humiliation|shame
N|Surprise|astonishment;amazement;shock|surprise
N|The gun|pistol;revolver;weapon;handgun|gun
N|The phone|cell;cellphone;mobile|phone
N|The rain|downpour;drizzle;shower|rain
N|The wind|breeze;gust;draft|wind
A|Surprised|astonished;amazed;stunned;startled;taken aback;dumbfounded;flabbergasted;floored|surprised
A|Tired|exhausted;weary;worn out;drained;spent;beat;wiped out|tired
A|Sad|unhappy;gloomy;glum;downcast;miserable;heartbroken;blue;down;despondent|sad
A|Quiet|silent;hushed;mute;still;wordless|quiet,silent
A|Angry|furious;livid;irate;enraged;mad;fuming;cross;seething|angry
A|Scared|afraid;frightened;terrified;petrified;spooked;shaken;panicked|scared,afraid
A|Nervous|anxious;tense;jittery;edgy;on edge;uneasy|nervous
A|Worried|concerned;troubled;uneasy;anxious|worried
A|Happy|glad;cheerful;delighted;thrilled;elated;overjoyed;joyful;content;over the moon|happy
A|Calm|serene;peaceful;composed;collected;relaxed|calm
A|Big|huge;enormous;massive;giant;vast;towering;hulking;colossal|big,large
A|Small|tiny;little;minuscule;slight;compact;petite;miniature|small,little
A|Beautiful|gorgeous;stunning;lovely;striking;pretty|beautiful,pretty
A|Ugly|hideous;grotesque;unsightly|ugly
A|Old|elderly;aged;ancient;worn;battered;aging;antique|old
A|Young|youthful;juvenile|young
A|Dark|dim;gloomy;shadowy;murky;pitch-black;inky;pitch-dark|dark
A|Cold|freezing;icy;chilly;frigid;frosty;bitter|cold
A|Hot|scorching;sweltering;boiling;stifling|hot
A|Strange|odd;weird;bizarre;peculiar;eerie;uncanny;freaky;offbeat|strange,weird
A|Pale|ashen;pallid;wan;white as a sheet|pale
A|Drunk|tipsy;wasted;hammered;intoxicated|drunk
A|Embarrassed|awkward;sheepish;flustered;self-conscious|embarrassed
A|Alone|lonely;solitary;isolated|alone
A|Empty|deserted;bare;vacant;abandoned|empty
A|Fast|quick;swift;rapid;speedy|fast,quick
A|Slow|sluggish;unhurried;leisurely|slow
A|Strong|powerful;sturdy;muscular;burly|strong
A|Weak|frail;feeble;fragile;shaky|weak
A|Dirty|filthy;grimy;grubby;muddy|dirty
A|Clean|spotless;immaculate;neat;tidy|clean
A|Loud|noisy;deafening;booming;thunderous|loud
A|Kind|gentle;caring;warm;considerate|kind
A|Mean|cruel;nasty;vicious;spiteful|mean,cruel
A|Smart|clever;bright;sharp;brilliant|smart,clever
A|Stupid|dumb;foolish;idiotic;dense|stupid
A|Dead|lifeless;deceased;gone|dead
A|Hurt|injured;wounded;bruised;battered|hurt,injured
X|Suddenly|all of a sudden;abruptly;without warning;in a flash;out of nowhere;all at once;without notice|suddenly
X|Slowly|gradually;leisurely;unhurriedly;at a crawl|slowly
X|Quickly|fast;rapidly;swiftly;hastily;in a hurry;in a rush;speedily|quickly
X|Quietly|silently;softly;without a sound;in a whisper;noiselessly;hushed|quietly
X|Gently|softly;tenderly;delicately;carefully|gently
X|Then|next;after that;afterward;a moment later|then
X|Very|extremely;really;incredibly;deeply;terribly|very
X|A little|slightly;a bit;somewhat;barely|a little,slightly
X|Again|once more;once again;anew|again
X|Maybe|perhaps;possibly;probably|maybe,perhaps
X|Immediately|at once;instantly;right away;straight away|immediately
X|Finally|at last;eventually;in the end|finally
X|Often|frequently;regularly;repeatedly|often
X|Always|constantly;forever;all the time|always
X|Never|not once;at no time;not ever|never
X|Almost|nearly;practically;all but|almost
X|Really|truly;genuinely;honestly|really
X|Nervously|anxiously;uneasily;tensely|nervously
X|Angrily|furiously;heatedly;bitterly|angrily
X|Sadly|sorrowfully;glumly;wistfully|sadly
X|Out of breath|breathless;panting;gasping;winded|out of breath,breathless
X|Later|afterward;eventually;subsequently|later
X|Together|side by side;as one;jointly|together
X|Everywhere|all over;far and wide;all around|everywhere
X|Carefully|cautiously;gingerly;warily|carefully
V|Jump|jump>i;leap>i;hop>i;spring>i;vault>d|jump
V|Slip, skid|slide>i;skid>i;lose balance>i;stumble>i|slip,skid
V|Crawl|crawl>i;creep>i;inch>forward;slither>i|crawl
V|Kneel|kneel>i;crouch>i;squat>i;get down>i|kneel
V|Stretch out|stretch out>i;sprawl>i;recline>i;lounge>i;settle back>i|stretch out
V|Smoke|smoke>d;light up>i;puff on>d;drag on>d|smoke
V|Cook|cook>d;prepare>d;fix>d;whip up>d|cook
V|Clean up|clean>d;wipe>d;scrub>d;rinse>d;polish>d|clean
V|Tidy|tidy>d;straighten>d;organize>d;sort>d|tidy
V|Get dressed|put on>d;pull on>d;slip on>d;dress>i|dress
V|Undress|undress>i;take off>d;strip>i;peel off>d|undress
V|Cut|cut>d;slice>d;chop>d;carve>d;trim>d|cut
V|Rip|rip>d;shred>d;tear apart>d|rip
V|Fold|fold>d;crumple>d;crease>d|fold
V|Fill|fill>d;pour>d;top up>d|fill
V|Empty out|empty>d;drain>d;spill>d|empty
V|Buy|buy>d;purchase>d;pick up>d;get>d|buy
V|Sell|sell>d;trade>d;flog>d|sell
V|Pay|pay>d;settle>d;cover>d;pay off>d|pay
V|Steal|steal>d;swipe>d;pinch>d;nick>d;lift>d|steal
V|Catch|catch>d;capture>d;trap>d;nab>d|catch
V|Chase|chase>d;pursue>d;run after>d;hunt>d;track>d|chase
V|Follow|follow>d;trail>d;tail>d;shadow>d;tag along>i|follow
V|Lead|lead>d;guide>d;steer>d;usher>d|lead
V|Attack|attack>d;assault>d;lunge>at;charge>at|attack
V|Protect|protect>d;defend>d;shield>d;guard>d|protect
V|Save|save>d;rescue>d;free>d|save
V|Injure|hurt>d;injure>d;wound>d|injure
V|Heal|heal>d;treat>d;bandage>d;patch up>d|heal
V|Shoot|shoot>d;fire>at;open fire>i|shoot
V|Aim|aim>at;point>d;train>on|aim
V|Explode|explode>i;blow up>i;burst>i;go off>i|explode
V|Burn|burn>i;blaze>i;flare up>i;smolder>i|burn
V|Flow|flow>i;stream>i;trickle>i;drip>i;pour>i|flow
V|Sniff|sniff>d;smell>d;inhale>d|sniff,smell
V|Taste|taste>d;savor>d;sample>d|taste
V|Promise|promise>d;swear>d;vow>d;pledge>d|promise
V|Beg|beg>d;plead>i;implore>d;pray>i|beg
V|Order|order>d;command>d;demand>d;instruct>d|order
V|Argue|argue>i;quarrel>i;bicker>i;squabble>i;row>i|argue
V|Insult|insult>d;offend>d;mock>d;taunt>d|insult
V|Thank|thank>d;show gratitude>i|thank
V|Apologize|apologize>i;say sorry>i;make amends>i|apologize
V|Forgive|forgive>d;excuse>d;pardon>d|forgive
V|Greet|greet>d;welcome>d;wave>at;hail>d|greet
V|Meet|meet>d;run into>d;bump into>d;come across>d|meet
V|Decide|decide>d;choose>d;opt>for;settle on>d|decide
V|Prepare|prepare>d;get ready>i;set up>d|prepare
V|Fix|fix>d;repair>d;mend>d;patch up>d|fix,repair
V|Build|build>d;construct>d;put up>d;assemble>d|build
V|Destroy|destroy>d;wreck>d;ruin>d;demolish>d;trash>d|destroy
V|Win|win>d;triumph>i;prevail>i|win
V|Lose|lose>d;misplace>d;fail>i|lose
V|Play|play>i;fool around>i;mess around>i|play
V|Dance|dance>i;sway>i;twirl>i;groove>i|dance
V|Sing|sing>d;hum>d;croon>d|sing
V|Grumble|grumble>i;grouse>i;complain>i;gripe>i;whine>i|grumble
V|Suspect|suspect>d;doubt>d;distrust>d|suspect
V|Believe|believe>d;trust>d;suppose>d;figure>d|believe
V|Imagine|imagine>d;picture>d;envision>d;fancy>d|imagine
V|Dream|dream>i;daydream>i;drift>i|dream
V|Worry|worry>i;fret>i;agonize>i;stress>i|worry
V|Panic|panic>i;freak out>i;lose it>i|panic
V|Flinch|flinch>i;start>i;jolt>i;jerk>i|flinch
V|Regret|regret>d;rue>d|regret
V|Hope|hope>for;wish>for;pray>for|hope
V|Dread|fear>d;dread>d|dread
V|Share|share>d;split>d;divide>d|share
V|Send|send>d;mail>d;ship>d;forward>d|send
V|Receive|receive>d;get>d;obtain>d|receive
V|Cough|cough>i;splutter>i;choke>i;wheeze>i|cough
V|Throw up|throw up>i;vomit>i;retch>i;gag>i|vomit,throw up
V|Faint|faint>i;pass out>i;black out>i;keel over>i|faint
V|Clench|clench>d;grit>d;tense>d|clench
V|Pet|pet>d;pat>d;fondle>d|pet
V|Scratch|scratch>d;claw>d;scrape>d|scratch
V|Bite|bite>d;nibble>d;chew>d;gnaw>d|bite
V|Rain|rain>i;pour>i;drizzle>i;pelt down>i|rain
V|Creak|creak>i;squeak>i;grate>i;screech>i|creak
V|Bang|bang>i;rattle>i;clatter>i|bang
V|Buzz|buzz>i;vibrate>i;hum>i;whir>i|buzz
V|Roll|roll>i;tumble>i;spin>i|roll
V|Wave|wave>i;gesture>i;signal>i;beckon>i|wave
V|Point|point>at;gesture>toward;motion>toward|point
V|Check|check>d;verify>d;double-check>d|check
V|Count|count>d;tally>d;add up>d|count
V|Hurry|rush>i;hasten>i;get a move on>i|hurry
V|Escape|escape>i;get away>i;break free>i;slip away>i|escape
V|Ransack|ransack>d;comb>d;turn upside down>d|ransack
V|Knock|knock>i;rap>i;tap>i;bang>i|knock
N|The bedroom|room;quarters;chamber|bedroom
N|The kitchen|kitchenette;galley|kitchen
N|The office|study;workspace;bureau|office
N|The hallway|corridor;passage;hall|hallway,corridor
N|The stairs|staircase;steps;stairway|stairs
N|The roof|rooftop;terrace|roof
N|The garden|yard;backyard;lawn|garden
N|The bar|pub;tavern;saloon;dive|bar
N|The restaurant|diner;cafe;bistro;eatery|restaurant
N|The hospital|clinic;ER;infirmary|hospital
N|The school|academy;college;campus|school
N|The station|platform;depot;terminal|station
N|The village|hamlet;town|village
N|The road|highway;street;freeway;route|road
N|The countryside|country;farmland;fields|countryside
N|The mountain|peak;summit;ridge|mountain
N|The river|stream;creek;waterway|river
N|The beach|shore;seashore;coast|beach
N|The boat|ship;vessel;dinghy;yacht|boat
N|The plane|aircraft;jet;airplane|plane
N|The train|subway;carriage;locomotive|train
N|The cop|police officer;officer;detective;deputy|cop,officer
N|The doctor|physician;medic;surgeon|doctor
N|The boss|chief;manager;supervisor|boss
N|The mother|mom;mum|mother
N|The father|dad;pop;old man|father
N|The brother|bro;sibling|brother
N|The sister|sibling|sister
N|The husband|spouse;partner|husband
N|The wife|spouse;partner|wife
N|The old man|old-timer;elder;geezer|old man
N|The crowd|mob;throng;horde;mass|crowd
N|The enemy|foe;rival;adversary;opponent|enemy
N|The head|skull;noggin|head
N|The hair|locks;mane;mop|hair
N|The legs|limbs;pins|legs
N|The skin|flesh;complexion|skin
N|The clothes|outfit;clothing;garments;gear|clothes
N|The coat|jacket;overcoat;raincoat;parka|coat
N|The bag|purse;backpack;satchel;suitcase|bag
N|The key|keys;keychain|key
N|The cup|tumbler;mug;glass|cup
N|The bottle|flask;jug;carafe|bottle
N|The meal|dinner;lunch;feast;snack|meal
N|The book|novel;volume;paperback|book
N|The photo|picture;snapshot;photograph;print|photo
N|The secret|mystery;confidence|secret
N|A lie|fib;falsehood;tall tale|lie
N|The truth|fact;reality|truth
N|Death|demise;passing;end|death
N|Life|existence;lifetime|life
N|Love (noun)|affection;passion;devotion;tenderness|love
N|Hatred|hate;loathing;contempt;animosity|hatred
N|Hope (noun)|optimism;faith;expectation|hope
N|Danger|peril;threat;risk;hazard|danger
N|The plan|scheme;plot;strategy;idea|plan
N|The idea|thought;notion;hunch;concept|idea
N|An argument|quarrel;fight;row;dispute;spat|argument
N|A brawl|scuffle;fistfight;tussle;melee|brawl
N|A kiss|peck;smooch|kiss
N|The smell|scent;odor;stench;whiff;aroma|smell
N|The cold|chill;frost|cold
N|The heat|warmth;swelter|heat
N|The storm|thunderstorm;tempest;squall|storm
N|The fog|mist;haze|fog
N|The snow|snowfall;flurries|snow
N|The sun|sunlight;sunshine|sun
N|The floor|ground;floorboards|floor
N|The wall|partition|wall
N|The end|finish;finale;close|end
N|The beginning|start;outset;opening|beginning
A|Rich|wealthy;loaded;well-off;affluent|rich
A|Poor|broke;penniless;needy;hard up|poor
A|Fat|heavy;overweight;stout;chubby|fat
A|Thin|slim;slender;skinny;lean;gaunt|thin
A|Brave|courageous;bold;fearless;daring|brave
A|Cowardly|spineless;gutless;chicken|cowardly
A|Honest|truthful;sincere;frank;upfront|honest
A|Shy|timid;bashful;reserved;meek|shy
A|Funny|hilarious;amusing;comical;witty|funny
A|Serious|grave;solemn;stern;somber|serious
A|Confident|self-assured;sure;poised;cocky|confident
A|Confused|bewildered;disoriented;puzzled;baffled|confused
A|Jealous|envious;possessive|jealous
A|Moved|touched;stirred;emotional|moved
A|Shocked|stunned;shaken;rattled;appalled|shocked
A|Disgusted|repulsed;revolted;sickened|disgusted
A|Relieved|reassured;comforted|relieved
A|Disappointed|let down;crestfallen;dismayed|disappointed
A|Bored|uninterested;restless;listless|bored
A|Thoughtful|pensive;lost in thought;reflective|thoughtful,pensive
A|Suspicious|wary;distrustful;skeptical;leery|suspicious
A|Dangerous|risky;perilous;deadly;threatening|dangerous
A|Safe|secure;protected|safe
A|Bright|luminous;sunny;radiant;brilliant|bright
A|Wet|damp;soaked;drenched;soggy|wet
A|Dry|parched;arid;bone-dry|dry
A|New|brand-new;fresh;modern|new
A|Fancy|luxurious;posh;lavish;upscale|fancy
A|Shabby|run-down;seedy;dilapidated;squalid|shabby
A|Narrow|cramped;tight;confined|narrow
A|Wide|broad;spacious;roomy|wide
A|Heavy|weighty;hefty;bulky|heavy
A|Soft|smooth;silky;tender;fluffy|soft
A|Hard|rigid;firm;solid;stiff|hard
A|Red-faced|flushed;crimson;beet-red|red-faced
A|Busy|hectic;swamped;occupied|busy
A|Crazy|insane;mad;nuts;deranged|crazy
A|Sick|ill;unwell;queasy;feverish|sick,ill
A|Hungry|starving;famished;ravenous|hungry
A|Lonely|isolated;forlorn;lonesome|lonely
A|Famous|well-known;renowned;celebrated|famous
A|Ready|prepared;set;all set|ready
A|Excited|thrilled;eager;pumped;elated|excited
A|Proud|pleased;self-satisfied;smug|proud
A|Guilty|ashamed;remorseful;sorry|guilty
X|Softly|in a low voice;barely audible;in a hush|softly
X|Loudly|out loud;aloud;at full volume|loudly
X|Elsewhere|somewhere else;away|elsewhere
X|Now|right now;at this moment;at present|now
X|Soon|shortly;in a moment;before long|soon
X|Already|by now;by then|already
X|Only|just;merely;simply|only
X|Especially|particularly;above all;notably|especially
X|However|yet;still;nevertheless;even so|however
X|Of course|naturally;obviously;certainly|of course
X|Secretly|on the sly;furtively;covertly|secretly
X|Violently|brutally;fiercely;savagely|violently
X|Tenderly|affectionately;lovingly;fondly|tenderly
X|Coldly|icily;curtly;frostily|coldly
X|Happily|cheerfully;gleefully;joyfully|happily
X|Cautiously|warily;gingerly;with care|cautiously
X|With difficulty|laboriously;painfully;with effort|with difficulty
X|From afar|at a distance;from a distance|from afar
X|Up close|close up;nearby|up close
X|In the distance|far off;on the horizon|in the distance
X|After a while|eventually;after a moment|after a while
X|Little by little|bit by bit;gradually;step by step|little by little
X|Without a word|silently;wordlessly;in silence|without a word
X|Lost in thought|miles away;daydreaming;absent-minded|lost in thought
X|Heart pounding|heart racing;pulse quickening|heart pounding
X|Sweating|drenched in sweat;soaked with sweat;clammy|sweating
`;
const SYN = { groups:null, open:false, tab:'alt', last:null, query:'', items:[], timer:null, repMode:'words', repMin:3, repOpen:null, repData:null, repTimer:null };
const SYN_ER = ['e','es','ent','ons','ez','ait','aient','ais','ant','é','ée','és','ées','a','èrent','er','era','erait','erai','eras','eront'];
function synEsc(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function synParse(){
  if(SYN.groups) return SYN.groups;
  SYN.groups = (SYN_DB_TEXT.trim() + '\n' + SYN_DB_EN.trim()).split('\n').map(line=>{
    const p = line.split('|');
    const t = p[0], nuance = p[1], alts = (p[2]||'').split(';').filter(Boolean), heads = (p[3]||'').split(',').filter(Boolean);
    const en = /^[VNAX]$/.test(t);   // groupes anglais : V verbe, N nom, A adjectif, X expression
    const items = alts.map(a=>{
      if(t==='v' || t==='V'){ const m=a.split('>'); return {text:m[0], cons:m[1]||'d', lemma:m[0]}; }
      if(en) return {text:a, lemma:a};
      if(t==='n'){ const q=a.split(':'), w=q[0].split('~'); return {text:w[0], tag:w[1]||'', pl:q[1]||'', lemma:w[0]}; }
      const w=a.split('~'); return {text:w[0], adj:w[1]==='a', lemma:w[0]};
    });
    const keys = [];
    heads.forEach(h=>h.split(':').forEach(k=>keys.push({k:k.replace(/^\^/,'').toLowerCase(), head:true})));
    if(!heads.length && items[0]) keys.push({k:items[0].lemma.toLowerCase(), head:true});
    items.forEach(i=>{ if(i.lemma.indexOf('{')<0) keys.push({k:i.lemma.toLowerCase(), head:false}); });
    return {t, nuance, items, keys, en};
  });
  return SYN.groups;
}
function synWordMatch(key, w){
  if(w===key) return true;
  const stem = (key.length>=6 && /(er|ir|re)$/.test(key)) ? key.slice(0,-2) : key;
  if(stem.length<5) return w===key || w===key+'s' || w===key+'x';
  return w.startsWith(stem) && w.length<=stem.length+5;
}
function synTokens(s){ return s.toLowerCase().split(/[^\p{L}'’-]+/u).filter(Boolean); }
function synMatch(key, q, toks){
  if(key.indexOf(' ')>=0) return q.indexOf(key)>=0 ? q.split(key).length-1 : 0;
  let n=0; for(const w of toks) if(synWordMatch(key,w)) n++; return n;
}
function synApplyCase(src, txt){
  return (src && src[0] && src[0]!==src[0].toLowerCase() && src[0]===src[0].toUpperCase()) ? txt.charAt(0).toUpperCase()+txt.slice(1) : txt;
}
/* Construit la forme à insérer pour une alternative, d'après le mot cliqué. */
function synForm(g, it, word, key){
  if(g.en) return synEnForm(g, it, word, key);
  let t = it.text.replace(/\{p[sf]?\}/g, m=> m==='{pf}'?'sa':'son');
  if(g.t==='v'){
    if(key && key.length>=6 && /er$/.test(key) && !/^(se |s')/.test(it.text)){
      const stem = key.slice(0,-2), w = word.toLowerCase();
      if(w.startsWith(stem)){
        const end = w.slice(stem.length);
        if(SYN_ER.indexOf(end)>=0 && /er$/.test(it.text) && it.text.indexOf(' ')<0 && !/(ger|cer|yer|eler|eter)$/.test(it.text))
          return {txt: it.text.slice(0,-2)+end, ok:true};
        if(SYN_ER.indexOf(end)>=0 && /er$/.test(it.text) && it.text.indexOf(' ')>0 && it.text.indexOf('{')<0){
          const sp = it.text.indexOf(' '), v = it.text.slice(0,sp);
          if(/^[a-zéèêàâîïôûç]+er$/.test(v) && !/(ger|cer|yer|eler|eter)$/.test(v))
            return {txt: v.slice(0,-2)+end+it.text.slice(sp), ok:true};
        }
      }
    }
    return {txt:t, ok:false};
  }
  if(g.t==='n'){
    const plural = /[sx]$/i.test(word) && word.length>3;
    if(plural && !/p$/.test(it.tag)){ t = it.pl || (/[sxz]$/.test(t)?t:t+'s'); }
    return {txt:t, ok:true};
  }
  if(it.adj || g.t==='a'){
    if(/s$/i.test(word) && !/[sx]$/.test(t)) t+='s';
    // Le « e » final du mot cliqué ne marque le féminin que s'il n'appartient pas déjà au mot de base (riche, triste, calme…).
    if(/e$/i.test(word) && /[ué]$/.test(t) && !/e$/.test(t) && !(key && /e$/i.test(key) && String(word).toLowerCase() === key)) t+='e';
  }
  return {txt:t, ok:true};
}
/* ---- Anglais : formes des verbes (s, -ed, -ing, participe) et pluriel des noms ----
   On reconnaît « whispered », « looking », « ran »… et l'alternative prend la même forme. */
const SYN_EN_IRR = {
  be:['was','been','being','is'], have:['had','had','having','has'], do:['did','done','doing','does'], go:['went','gone','going','goes'],
  come:['came','come'], see:['saw','seen'], run:['ran','run'], sit:['sat','sat'], stand:['stood','stood'], take:['took','taken'],
  give:['gave','given'], get:['got','gotten'], make:['made','made'], say:['said','said'], tell:['told','told'], think:['thought','thought'],
  know:['knew','known'], feel:['felt','felt'], find:['found','found'], leave:['left','left'], hold:['held','held'], bring:['brought','brought'],
  keep:['kept','kept'], fall:['fell','fallen'], throw:['threw','thrown'], hear:['heard','heard'], speak:['spoke','spoken'], break:['broke','broken'],
  catch:['caught','caught'], shake:['shook','shaken'], rise:['rose','risen'], wake:['woke','woken'], hide:['hid','hidden'], strike:['struck','struck'],
  swing:['swung','swung'], slide:['slid','slid'], spin:['spun','spun'], stride:['strode','stridden'], creep:['crept','crept'], sweep:['swept','swept'],
  weep:['wept','wept'], sleep:['slept','slept'], freeze:['froze','frozen'], begin:['began','begun','beginning'], drink:['drank','drunk'], eat:['ate','eaten'],
  write:['wrote','written'], read:['read','read'], shoot:['shot','shot'], fight:['fought','fought'], fly:['flew','flown'], drive:['drove','driven'],
  ride:['rode','ridden'], cling:['clung','clung'], fling:['flung','flung'], stick:['stuck','stuck'], dig:['dug','dug'], tear:['tore','torn'],
  wear:['wore','worn'], bite:['bit','bitten'], blow:['blew','blown'], draw:['drew','drawn'], grow:['grew','grown'], burst:['burst','burst'],
  cast:['cast','cast'], cut:['cut','cut'], hit:['hit','hit'], hurt:['hurt','hurt'], let:['let','let'], put:['put','put'], quit:['quit','quit','quitting'],
  set:['set','set'], shut:['shut','shut'], spread:['spread','spread'], thrust:['thrust','thrust'], bend:['bent','bent'], lay:['laid','laid'],
  seek:['sought','sought'], slay:['slew','slain'], sling:['slung','slung'], slink:['slunk','slunk'], shine:['shone','shone'], forget:['forgot','forgotten','forgetting'],
  understand:['understood','understood'], mean:['meant','meant'], lose:['lost','lost'], buy:['bought','bought'], send:['sent','sent'], spend:['spent','spent'],
  stink:['stank','stunk'], swim:['swam','swum'], sing:['sang','sung'], ring:['rang','rung'], sink:['sank','sunk'], steal:['stole','stolen'],
  admit:['admitted','admitted','admitting'], overhear:['overheard','overheard'], overlook:['overlooked','overlooked'], become:['became','become'],
  awaken:['awakened','awakened'], lie:['lied','lied','lying'], die:['died','died','dying'], speed:['sped','sped'],
  hang:['hung','hung'], flee:['fled','fled'],
  sell:['sold','sold'], pay:['paid','paid'], lead:['led','led'], swear:['swore','sworn'], forgive:['forgave','forgiven'], meet:['met','met'],
  choose:['chose','chosen'], build:['built','built'], win:['won','won','winning'], split:['split','split','splitting'], light:['lit','lit'],
  lend:['lent','lent'], kneel:['knelt','knelt'], panic:['panicked','panicked','panicking'], regret:['regretted','regretted','regretting'],
  squat:['squatted','squatted','squatting'], spring:['sprang','sprung'], shrink:['shrank','shrunk'], strive:['strove','striven'], sneak:['snuck','snuck']
};
function synEnVerb(v, form){
  if(form === 'base') return v;
  const irr = SYN_EN_IRR[v];
  if(form === 'ed' && irr) return irr[0];
  if(form === 'pp') return irr ? irr[1] : synEnVerb(v, 'ed');
  if(form === 'ing' && irr && irr[2]) return irr[2];
  if(form === 's' && irr && irr[3]) return irr[3];
  const cvc = /^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v) && !/^(ex|fix|mix)$/.test(v);   // nod → nodded, grin → grinning
  if(form === 's'){
    if(/(s|x|z|ch|sh|o)$/.test(v)) return v + 'es';
    if(/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
    return v + 's';
  }
  if(form === 'ing'){
    if(/ie$/.test(v)) return v.slice(0, -2) + 'ying';
    if(/(ee|ye|oe)$/.test(v)) return v + 'ing';
    if(/e$/.test(v)) return v.slice(0, -1) + 'ing';
    if(cvc) return v + v.slice(-1) + 'ing';
    return v + 'ing';
  }
  if(/e$/.test(v)) return v + 'd';
  if(/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ied';
  if(cvc) return v + v.slice(-1) + 'ed';
  return v + 'ed';
}
/* Une expression verbale : seul le premier mot se conjugue (« look away » → « looked away »). */
function synEnPhrase(p, form){ const i = p.indexOf(' '); return i < 0 ? synEnVerb(p, form) : synEnVerb(p.slice(0, i), form) + p.slice(i); }
const SYN_EN_PL = { man:'men', woman:'women', child:'children', gentleman:'gentlemen', foot:'feet', tooth:'teeth', person:'people', mouse:'mice',
  life:'lives', wife:'wives', knife:'knives', leaf:'leaves', half:'halves', thief:'thieves', shelf:'shelves', wolf:'wolves', 'old man':'old men', aircraft:'aircraft' };
function synEnPlural(n){
  if(SYN_EN_PL[n]) return SYN_EN_PL[n];
  if(/(s|x|z|ch|sh)$/.test(n)) return n + 'es';
  if(/[^aeiou]y$/.test(n)) return n.slice(0, -1) + 'ies';
  return n + 's';
}
/* Forme d'un mot anglais par rapport à sa tête : base, s, ed, pp, ing (verbes) ; sg, pl (noms) ; null si aucun rapport. */
function synEnWordForm(g, key, w){
  if(w === key) return g.t === 'N' ? 'sg' : 'base';
  if(key.indexOf(' ') >= 0){
    if(g.t === 'V') for(const f of ['ed', 'pp', 'ing', 's']) if(synEnPhrase(key, f) === w) return f;
    return null;
  }
  if(g.t === 'V'){
    for(const f of ['ed', 'pp', 'ing', 's']) if(synEnVerb(key, f) === w) return f;
    return null;
  }
  if(g.t === 'N') return synEnPlural(key) === w ? 'pl' : null;
  return null;
}
function synEnWord(g, key, w){ return synEnWordForm(g, key, w) !== null; }
/* Expression verbale trouvée dans le texte sélectionné, sous n'importe quelle forme (« stood up » pour « stand up »). */
function synEnPhraseIn(g, key, q){
  if(q.indexOf(key) >= 0) return key;
  if(g.t === 'V') for(const f of ['ed', 'pp', 'ing', 's']){ const p = synEnPhrase(key, f); if(q.indexOf(p) >= 0) return p; }
  return null;
}
function synEnMatch(g, key, q, toks){
  if(key.indexOf(' ') >= 0){ const p = synEnPhraseIn(g, key, q); return p ? q.split(p).length - 1 : 0; }
  let n = 0; for(const w of toks) if(synEnWord(g, key, w)) n++; return n;
}
function synEnForm(g, it, word, key){
  const f = (key && word) ? synEnWordForm(g, key, String(word).toLowerCase()) : null;
  if(g.t === 'V') return { txt: synEnPhrase(it.text, f || 'base'), ok:true };
  if(g.t === 'N') return { txt: (f === 'pl' && !/s$/.test(it.text)) ? synEnPlural(it.text) : it.text, ok:true };
  return { txt: it.text, ok:true };
}
function synLookup(q){
  const ql = q.toLowerCase().trim(), toks = synTokens(ql), out = [];
  if(!toks.length) return out;
  const lang = (S.project && S.project.format === 'us') ? 'en' : 'fr';   // à égalité, la langue du scénario passe devant
  synParse().forEach(g=>{
    let best = null;
    const match = g.en ? (k=>synEnMatch(g, k, ql, toks)) : (k=>synMatch(k, ql, toks));
    g.keys.forEach(kk=>{
      if(match(kk.k)){ if(!best || (kk.head && !best.head) || (kk.k.length>best.k.length && kk.head===best.head)) best = kk; }
    });
    if(!best) return;
    const w = best.k.indexOf(' ')>=0 ? (g.en ? (synEnPhraseIn(g, best.k, ql) || best.k) : best.k) : (toks.find(x=> g.en ? synEnWord(g, best.k, x) : synWordMatch(best.k,x))||toks[0]);
    const list = g.items.filter(i=> i.lemma.toLowerCase()!==best.k && i.lemma.toLowerCase()!==ql).map(i=>{
      const f = synForm(g, i, w, best.k); return {g, it:i, txt:f.txt, ok:f.ok};
    });
    if(list.length) out.push({g, score:(best.head?2:1)+(best.k.indexOf(' ')>=0?1:0)+((g.en ? 'en' : 'fr') === lang ? 0.5 : 0), list});
  });
  return out.sort((a,b)=>b.score-a.score).slice(0,8);
}
/* Contexte d'édition : ligne + bornes du mot sélectionné / sous le curseur. */
function synCtxFromSelection(){
  const page = document.getElementById('page'), sel = window.getSelection();
  if(!page || !sel || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if(!page.contains(r.startContainer)) return null;
  const sp = selectionSpan();
  if(!sp) return null;
  if(sp.multi) return {multi:true, text:sel.toString().slice(0,80)};
  const el = findEl(sp.a.dataset.id); if(!el) return null;
  const txt = el.text||''; let l=sp.aOff, rr=sp.bOff;
  if(l===rr){
    while(l>0 && /[\p{L}'’-]/u.test(txt[l-1])) l--;
    while(rr<txt.length && /[\p{L}'’-]/u.test(txt[rr])) rr++;
  }
  const word = txt.slice(l,rr).replace(/^['’-]+|['’-]+$/g,'');
  return {id:sp.a.dataset.id, l, r:rr, text:txt.slice(l,rr), word};
}
function synTrack(){
  const c = synCtxFromSelection();
  if(c && !c.multi && c.text) SYN.last = c;
  if(c && SYN.open && SYN.tab==='alt' && !document.activeElement.closest?.('#synPanel')){
    clearTimeout(SYN.timer);
    SYN.timer = setTimeout(()=>{ const d=synCtxFromSelection(); if(d && d.text && d.text!==SYN.query){ SYN.query=d.text; synRender(); } }, 220);
  }
}
document.addEventListener('selectionchange', synTrack);
// L'analyse suit le texte : on la recalcule 0,7 s après la dernière frappe.
document.addEventListener('input', ()=>{
  if(!SYN.open || SYN.tab !== 'rep') return;
  clearTimeout(SYN.repTimer);
  SYN.repTimer = setTimeout(()=>{ SYN.repData = null; synRender(); }, 700);
}, true);
function synCss(){
  if(document.getElementById('synStyle')) return;
  const st = document.createElement('style'); st.id='synStyle';
  st.textContent = `
  #synPanel{position:fixed; top:64px; right:16px; width:360px; max-height:calc(100vh - 88px); display:flex; flex-direction:column; z-index:260;
    background:var(--surface); color:var(--ink); border:1px solid var(--hair); border-radius:10px; box-shadow:0 1px 2px #0002, 0 16px 40px -12px #0005; font-family:var(--sans); overflow:hidden;}
  #synPanel .sy-h{display:flex; align-items:center; gap:10px; padding:14px 8px 8px 18px;}
  #synPanel .sy-h b{font:600 16px var(--sans); letter-spacing:-.005em; flex:1;}
  #synPanel .sy-x{width:30px; height:30px; display:grid; place-items:center; background:none; border:0; border-radius:50%; color:var(--ink-soft); cursor:pointer;}
  #synPanel .sy-x:hover{background:var(--surface-soft); color:var(--ink);}
  #synPanel .sy-tabs{display:flex; padding:0 10px; border-bottom:1px solid var(--hair);}
  #synPanel .sy-tab{flex:1; padding:11px 8px 10px; background:none; border:0; border-bottom:2px solid transparent; margin-bottom:-1px; color:var(--ink-soft); font:600 11.5px var(--sans); letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:color .12s;}
  #synPanel .sy-tab:hover{color:var(--ink);}
  #synPanel .sy-tab.on{color:var(--accent); border-bottom-color:var(--accent);}
  #synPanel .sy-q{position:relative; padding:12px 14px 4px;}
  #synPanel .sy-q svg{position:absolute; left:26px; top:50%; margin-top:-5px; color:var(--ink-soft); pointer-events:none;}
  #synPanel .sy-q input{width:100%; box-sizing:border-box; padding:9px 12px 9px 34px; border:1px solid transparent; background:var(--surface-soft); color:var(--ink); border-radius:8px; font:14px var(--sans); outline:none; transition:border-color .12s, background .12s;}
  #synPanel .sy-q input:focus{border-color:var(--accent); background:var(--surface);}
  #synPanel .sy-body{overflow:auto; padding:4px 14px 14px;}
  #synPanel .sy-g{margin-top:14px;}
  #synPanel .sy-gt{font:600 10.5px var(--sans); letter-spacing:.09em; text-transform:uppercase; color:var(--ink-soft); margin:0 0 7px 2px;}
  #synPanel .sy-chips{display:flex; flex-wrap:wrap; gap:6px;}
  #synPanel .sy-chip{padding:6px 11px; border:1px solid var(--hair); background:var(--surface); color:var(--ink); border-radius:6px; font:13.5px var(--sans); cursor:pointer; text-align:left; transition:border-color .1s, background .1s;}
  #synPanel .sy-chip:hover{border-color:var(--accent); background:var(--tag-chip-bg);}
  #synPanel .sy-chip small{color:var(--ink-soft); font-size:11px; margin-left:5px;}
  #synPanel .sy-chip.inf{border-style:dashed;}
  #synPanel .sy-empty,#synPanel .sy-hint{color:var(--ink-soft); font-size:12.5px; line-height:1.5; padding:12px 2px;}
  #synPanel .sy-empty{text-align:center; padding:28px 12px;}
  #synPanel .sy-ctl{display:flex; align-items:center; gap:10px; padding:12px 0 6px;}
  #synPanel .sy-seg{display:flex; flex:1; background:var(--surface-soft); border-radius:8px; padding:3px;}
  #synPanel .sy-seg button{flex:1; padding:6px 4px; border:0; background:none; border-radius:6px; color:var(--ink-soft); font:600 12px var(--sans); cursor:pointer;}
  #synPanel .sy-seg button.on{background:var(--surface); color:var(--ink); box-shadow:0 1px 2px #0003;}
  #synPanel .sy-min{display:flex; align-items:center; gap:6px; font-size:12px; color:var(--ink-soft);}
  #synPanel .sy-min select{border:1px solid var(--hair); background:var(--surface); color:var(--ink); border-radius:6px; padding:5px 6px; font:12.5px var(--sans);}
  #synPanel .sy-sum{font-size:12px; color:var(--ink-soft); padding:4px 2px 8px;}
  #synPanel .sy-row{display:block; width:100%; text-align:left; background:none; border:0; border-bottom:1px solid var(--hair); padding:9px 4px 8px; cursor:pointer; color:var(--ink); font:inherit;}
  #synPanel .sy-row:hover{background:var(--surface-soft);}
  #synPanel .sy-rl{display:flex; align-items:center; gap:8px;}
  #synPanel .sy-rw{flex:1; font:500 14px var(--sans); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
  #synPanel .sy-tag{font:600 9.5px var(--sans); letter-spacing:.06em; text-transform:uppercase; color:var(--accent); border:1px solid var(--accent); border-radius:3px; padding:1px 4px;}
  #synPanel .sy-rn{font:600 12.5px var(--sans); font-variant-numeric:tabular-nums; min-width:26px; text-align:right;}
  #synPanel .sy-ch{color:var(--ink-soft); transition:transform .15s;}
  #synPanel .sy-row.open .sy-ch{transform:rotate(90deg);}
  #synPanel .sy-bar{height:2px; background:var(--hair); border-radius:2px; margin-top:7px; overflow:hidden;}
  #synPanel .sy-bar i{display:block; height:100%; background:var(--accent); opacity:.7;}
  #synPanel .sy-occ{background:var(--surface-soft); border-bottom:1px solid var(--hair); padding:4px 0;}
  #synPanel .sy-oc{display:block; width:100%; text-align:left; background:none; border:0; padding:7px 12px; cursor:pointer; color:var(--ink); font:inherit;}
  #synPanel .sy-oc:hover{background:var(--tag-chip-bg);}
  #synPanel .sy-ow{font:600 10.5px var(--sans); color:var(--ink-soft); letter-spacing:.03em; margin-bottom:2px;}
  #synPanel .sy-ot{font-size:12.5px; line-height:1.4;}
  #synPanel .sy-ot mark{background:var(--tag-chip-bg); color:var(--accent); font-weight:700; border-radius:2px; padding:0 1px;}
  `;
  document.head.appendChild(st);
}
function synChip(i, r){
  const cons = ((r.g.t==='v' || r.g.t==='V') && r.it.cons && r.it.cons!=='d' && r.it.cons!=='i') ? ' '+r.it.cons : '';
  const tag = r.g.t==='n' ? (r.it.tag?'<small>'+synEsc(r.it.tag.replace('nm','m.').replace('nf','f.').replace(/p$/,' pl.'))+'</small>':'') : '';
  return `<button class="sy-chip${r.ok?'':' inf'}" data-i="${i}" title="${r.ok?L('Remplacer dans le texte','Replace in the text'):L('Insère l’infinitif : à conjuguer','Inserts the infinitive: to be conjugated')}">${synEsc(r.txt)}${cons?'<small>'+synEsc(cons.trim())+'</small>':''}${tag}</button>`;
}
function synRender(){
  const p = document.getElementById('synPanel'); if(!p) return;
  const body = p.querySelector('.sy-body'); p.querySelectorAll('.sy-tab').forEach(t=>t.classList.toggle('on', t.dataset.tab===SYN.tab));
  p.querySelector('.sy-q').style.display = SYN.tab==='alt' ? '' : 'none';
  const inp = p.querySelector('.sy-q input'); if(inp && document.activeElement!==inp) inp.value = SYN.query;
  SYN.items = [];
  if(SYN.tab==='alt'){
    if(!SYN.query.trim()){ body.innerHTML = '<div class="sy-hint">'+L('Sélectionne un mot dans ton scénario (ou pose le curseur dedans), ou tape-le ci-dessus. Les alternatives sont classées par nuance.','Select a word in your screenplay (or place the cursor in it), or type it above. Alternatives are sorted by nuance.')+'</div>'; return; }
    const res = synLookup(SYN.query);
    if(!res.length){ body.innerHTML = '<div class="sy-empty">'+L('Aucune alternative pour « ','No alternative for “')+synEsc(SYN.query)+L(' » dans le dictionnaire pour l’instant.','” in the dictionary yet.')+'</div>'; return; }
    body.innerHTML = res.map(g=>`<div class="sy-g"><div class="sy-gt">${synEsc(g.g.nuance)}</div><div class="sy-chips">${g.list.map(r=>{ SYN.items.push(r); return synChip(SYN.items.length-1, r); }).join('')}</div></div>`).join('')
      + '<div class="sy-hint">'+L('Trait pointillé = l’infinitif est inséré, à conjuguer à la main.','Dotted line = the infinitive is inserted, to be conjugated by hand.')+'</div>';
  } else {
    body.innerHTML = synRepHtml();
  }
}
/* ---- Onglet Répétitions : analyse de tout le scénario ---- */
const SYN_STOP = new Set(('alors,aucun,aussi,autre,avait,avant,avec,avez,avoir,beaucoup,bien,cela,celle,celui,cependant,ces,cette,ceux,chaque,chez,comme,comment,dans,depuis,dont,donc,elle,elles,encore,entre,est,etaient,était,étaient,etre,être,eux,faire,fait,fois,font,hors,ici,ils,jamais,jusque,leur,leurs,lors,lui,mais,même,mes,moi,moins,mon,nous,notre,nos,oui,non,par,parce,pas,peu,plus,pour,pourquoi,puis,quand,que,quel,quelle,quelques,qui,quoi,sans,ses,sera,sera,seront,sont,sous,suis,sur,tes,toi,ton,tous,tout,toute,toutes,très,tres,une,vos,votre,vous,était,étais,êtes,ça,cet,déjà,ainsi,après,afin,car,celà,peut,veux,veut,faut,vais,vas,allez,rien,quelque,the,and,that,this,with,from,have,has,had,was,were,are,you,your,for,not,but,they,them,their,his,her,she,him,its,what,when,where,who,will,would,there,here,been,into,than,then,just,out,all,can,could,about,over,some,very').split(','));
function synRepScan(){
  const p = S.project, numbers = sceneNumbers(), pageOf = (S.pagination && S.pagination.pageOf) || {};
  const SKIP = {scene:1, character:1, note:1, shot:1, transition:1};
  const words = {}, near = {}, units = [];
  let sceneNo = '', gi = 0;
  p.elements.forEach(el=>{
    if(el.type === 'scene'){ sceneNo = numbers[el.id] != null ? String(numbers[el.id]) : ''; return; }
    if(SKIP[el.type] || !el.text) return;
    const toks = [], re = /\p{L}[\p{L}'’-]*/gu; let m;
    while((m = re.exec(el.text))){
      const w = m[0].replace(/^['’-]+|['’-]+$/g, '');
      toks.push({ w:w.toLowerCase(), off:m.index, len:m[0].length, g:gi++ });
    }
    units.push({ el, toks, sc:sceneNo, pg:pageOf[el.id] });
  });
  const stem = w=> (w.length > 4 && /[sx]$/.test(w)) ? w.slice(0, -1) : w;
  const okWord = w=> w.length >= 4 && !SYN_STOP.has(w);
  const add = (map, key, surf, u, t, len)=>{
    const e = map[key] || (map[key] = { k:key, forms:{}, occ:[] });
    e.forms[surf] = (e.forms[surf] || 0) + 1;
    e.occ.push({ id:u.el.id, off:t.off, len, sc:u.sc, pg:u.pg, g:t.g });
  };
  const phr = {};
  units.forEach(u=>{
    u.toks.forEach((t, i)=>{
      if(okWord(t.w)) add(words, stem(t.w), t.w, u, t, t.len);
      for(const n of [2, 3]){
        const e = u.toks[i + n - 1]; if(!e) continue;
        if(!okWord(t.w) || !okWord(e.w)) continue;
        const raw = u.el.text.slice(t.off, e.off + e.len);
        add(phr, u.toks.slice(i, i + n).map(x=>x.w).join(' '), raw.toLowerCase(), u, t, raw.length);
      }
    });
  });
  const fin = map=> Object.values(map).map(e=>{
    e.label = Object.keys(e.forms).sort((a, b)=>e.forms[b] - e.forms[a])[0];
    e.n = e.occ.length; return e;
  });
  const W = fin(words), P = fin(phr);
  // Échos : même mot à moins de 30 mots d'écart.
  W.forEach(e=>{
    let c = 0; for(let i = 1; i < e.occ.length; i++) if(e.occ[i].g - e.occ[i-1].g <= 30) c++;
    e.near = c;
  });
  return { W, P, total: units.reduce((s, u)=>s + u.toks.length, 0) };
}
function synRepList(){
  const d = SYN.repData || (SYN.repData = synRepScan()), min = SYN.repMin;
  let list;
  if(SYN.repMode === 'near') list = d.W.filter(e=>e.near >= 1 && e.n >= 2).sort((a, b)=>b.near - a.near || b.n - a.n);
  else if(SYN.repMode === 'phr'){
    list = d.P.filter(e=>e.n >= Math.max(2, min - 1));
    // une expression de 2 mots incluse dans une de 3 mots de même fréquence est redondante
    list = list.filter(e=> e.k.split(' ').length === 3 || !list.some(o=>o !== e && o.k.indexOf(e.k) >= 0 && o.n >= e.n));
    list.sort((a, b)=>b.n - a.n || b.k.length - a.k.length);
  } else list = d.W.filter(e=>e.n >= min).sort((a, b)=>b.n - a.n);
  return list.slice(0, 40);
}
function synRepSnippet(o, el){
  const t = el.text || '', a = Math.max(0, o.off - 38), b = Math.min(t.length, o.off + o.len + 38);
  return (a > 0 ? '… ' : '') + synEsc(t.slice(a, o.off)) + '<mark>' + synEsc(t.slice(o.off, o.off + o.len)) + '</mark>' + synEsc(t.slice(o.off + o.len, b)) + (b < t.length ? ' …' : '');
}
function synRepHtml(){
  const mode = SYN.repMode, list = synRepList(), d = SYN.repData;
  const seg = [['words', L('Mots','Words')], ['phr', L('Expressions','Phrases')], ['near', L('Échos','Echoes')]]
    .map(([k, t])=>`<button data-rm="${k}" class="${mode===k?'on':''}">${t}</button>`).join('');
  const sel = mode === 'near' ? '' : `<label class="sy-min">${L('Min.','Min.')}<select data-rmin="1">${[2,3,4,5,6].map(n=>`<option value="${n}"${SYN.repMin===n?' selected':''}>${n}×</option>`).join('')}</select></label>`;
  const hint = mode === 'near' ? L('Mots qui reviennent à moins de 30 mots d\u2019écart : les échos les plus audibles à la lecture.', 'Words that come back within 30 words: the echoes you hear most when reading.')
    : mode === 'phr' ? L('Suites de 2 ou 3 mots qui reviennent dans le scénario.', 'Two- or three-word sequences that recur in the script.')
    : L('Mots pleins les plus répétés (les mots-outils sont ignorés ; singulier et pluriel regroupés). Noms de scène et de personnage exclus.', 'Most repeated content words (function words ignored; singular and plural merged). Scene headings and character names excluded.');
  let rows;
  if(!list.length) rows = `<div class="sy-empty">${L('Aucune répétition à ce seuil.', 'No repetition at this threshold.')}<br>${L('Baisse le minimum ou change de vue.', 'Lower the minimum or switch view.')}</div>`;
  else {
    const max = list[0].n || 1, big = mode === 'near' ? e=>e.near : e=>e.n;
    const maxv = Math.max(...list.map(big));
    rows = list.map(e=>{
      const open = SYN.repOpen === mode + ':' + e.k;
      let occ = '';
      if(open) occ = '<div class="sy-occ">' + e.occ.slice(0, 40).map(o=>{
        const el = findEl(o.id); if(!el) return '';
        const where = (o.sc ? L('Sc.', 'Sc.') + ' ' + o.sc : L('Hors scène', 'No scene')) + (o.pg ? ' · p.' + synEsc(pageLbl(o.pg)) : '');
        return `<button class="sy-oc" data-jump="${o.id}|${o.off}|${o.len}"><div class="sy-ow">${synEsc(where)}</div><div class="sy-ot">${synRepSnippet(o, el)}</div></button>`;
      }).join('') + (e.occ.length > 40 ? `<div class="sy-hint" style="padding:6px 12px;">+ ${e.occ.length - 40}</div>` : '') + '</div>';
      return `<button class="sy-row${open?' open':''}" data-rk="${synEsc(e.k)}"><div class="sy-rl"><span class="sy-rw">${synEsc(e.label)}</span>${mode==='words'&&e.near>=3?`<span class="sy-tag" title="${L('Revient souvent à moins de 30 mots','Often within 30 words')}">${L('proches','close')}</span>`:''}<span class="sy-rn">${mode==='near'?e.near+'×':e.n+'×'}</span><svg class="sy-ch" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 1.5 6.5 5 3 8.5"/></svg></div><div class="sy-bar"><i style="width:${Math.max(6, Math.round(big(e) / maxv * 100))}%"></i></div></button>${occ}`;
    }).join('');
  }
  return `<div class="sy-ctl"><div class="sy-seg">${seg}</div>${sel}</div>
    <div class="sy-sum">${L('Analyse de', 'Analysis of')} ${d.total.toLocaleString()} ${L('mots · clique un mot pour voir où il revient', 'words · click an entry to see where it recurs')}</div>${rows}<div class="sy-hint">${hint}</div>`;
}
function synJump(id, off, len){
  const div = document.querySelector('#page [data-id="' + id + '"]'); if(!div) return;
  div.scrollIntoView({ block:'center', behavior:'smooth' });
  try{
    const tn = div.firstChild;
    if(tn && tn.nodeType === 3){
      const r = document.createRange(); r.setStart(tn, Math.min(off, tn.length)); r.setEnd(tn, Math.min(off + len, tn.length));
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  }catch(e){}
  div.classList.add('hl'); setTimeout(()=>div.classList.remove('hl'), 1600);
}
function synReplace(i){
  const r = SYN.items[i], c = SYN.last; if(!r || !c){ toast('Sélectionne d’abord un mot dans le scénario.'); return; }
  const div = document.querySelector('#page [data-id="'+c.id+'"]'), el = findEl(c.id);
  if(!div || !el){ toast('Mot introuvable.'); return; }
  if((el.text||'').slice(c.l,c.r)!==c.text){ toast('Le texte a changé : re-sélectionne le mot.'); return; }
  const txt = synApplyCase(c.text, r.txt);
  if(applyRangeEdit({a:div, b:div, aOff:c.l, bOff:c.r}, txt)){
    SYN.last = {id:c.id, l:c.l, r:c.l+txt.length, text:txt, word:txt};
    SYN.query = txt;
    if(!r.ok) toast('Infinitif inséré : pense à le conjuguer.');
    synRender();
  }
}
function openSynonyms(){
  synCss();
  let p = document.getElementById('synPanel');
  if(!p){
    p = document.createElement('div'); p.id='synPanel';
    p.innerHTML = `<div class="sy-h"><b>${L('Synonymes','Synonyms')}</b><button class="sy-x" data-close="1" title="${L('Fermer (Échap)','Close (Esc)')}"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2 2l10 10M12 2 2 12"/></svg></button></div>
      <div class="sy-tabs"><button class="sy-tab on" data-tab="alt">${L('Alternatives','Alternatives')}</button><button class="sy-tab" data-tab="rep">${L('Répétitions','Repetitions')}</button></div>
      <div class="sy-q"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="5.5" cy="5.5" r="4"/><path d="M8.6 8.6 12 12"/></svg><input type="text" placeholder="${L('Un mot ou une expression…','A word or phrase…')}" autocomplete="off" spellcheck="false"></div>
      <div class="sy-body"></div>`;
    document.body.appendChild(p);
    p.addEventListener('mousedown', e=>{ if(!e.target.closest('input,select')) e.preventDefault(); });
    p.addEventListener('click', e=>{
      const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.close){ closeSynonyms(); }
      else if(b.dataset.tab){ SYN.tab=b.dataset.tab; if(SYN.tab==='rep') SYN.repData=null; synRender(); }
      else if(b.dataset.rm){ SYN.repMode=b.dataset.rm; SYN.repOpen=null; synRender(); }
      else if(b.dataset.rk){ const key=SYN.repMode+':'+b.dataset.rk; SYN.repOpen = SYN.repOpen===key ? null : key; synRender(); }
      else if(b.dataset.jump){ const j=b.dataset.jump.split('|'); synJump(j[0], +j[1], +j[2]); }
      else if(b.dataset.i!==undefined){ synReplace(+b.dataset.i); }
    });
    p.addEventListener('change', e=>{ if(e.target.dataset && e.target.dataset.rmin){ SYN.repMin = +e.target.value; SYN.repOpen = null; synRender(); } });
    p.querySelector('input').addEventListener('input', e=>{ SYN.query = e.target.value; synRender(); });
  }
  SYN.open = true;
  const c = synCtxFromSelection();
  if(c && !c.multi && c.text){ SYN.last = c; }
  if(c && c.multi){ SYN.query = c.text; } else if(SYN.last) SYN.query = SYN.last.text;
  SYN.tab='alt'; synRender();
}
function closeSynonyms(){ const p=document.getElementById('synPanel'); if(p) p.remove(); SYN.open=false; }
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && e.shiftKey && e.key.toLowerCase()==='y'){ e.preventDefault(); if(SYN.open) closeSynonyms(); else if(S.tab==='editor') openSynonyms(); }
  else if(e.key==='Escape' && SYN.open && !document.getElementById('tbMoreMenu')){ closeSynonyms(); }
}, true);
ACTIONS.openSynonyms = openSynonyms;

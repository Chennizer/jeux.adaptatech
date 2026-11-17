# Développement cérébral — prototype interactif

Page statique : `/pedagogique/developpement-cerebral/`, sur l’hébergement existant, sans compilation ni requête externe à l’exécution. L’interface est en français.

## Utilisation

Deux vues du cortex et du cervelet, de côté et du dessus, évoluent ensemble avec un curseur **mensuel de 0 à 20 ans**. Lecture/pause, remise à zéro, repères et sources, et plein écran sont disponibles. La vue de côté se tourne à la souris, au toucher ou avec les flèches lorsque le cerveau a le focus ; Début rétablit l’orientation. L’âge s’affiche en mois avant un an, puis en années et mois.

Le graphique occupe **tout l’écran**, avec des commandes superposées qui ne réduisent pas sa surface. Les repères par âge sont intégrés en haut de la vue : un titre court, la période et trois mots-clés. Par exemple : « Babiller et échanger — Babillage · Imitation · Échanges ». Les dix périodes évoluent avec le curseur, de 0–3 mois à 16–20 ans. Aucun encadré ni volet détaillé ne masque le graphique. L’âge exact, les commandes et le curseur sont réunis dans une barre flottante compacte en bas. En paysage très court, seul le titre est conservé pour donner la priorité au cerveau. Les textes suivent l’âge global, y compris pendant un scénario focal. Les réglages des profils et de l’épilepsie sont réunis dans un inspecteur à droite, sans redimensionner le cerveau. Un seul volet de réglages est ouvert à la fois ; son contenu défile sur petit écran sans recouvrir le curseur d’âge.

Le seul mode de couleurs est une **illustration** continue à sept repères : rouge, orange, jaune, vert, turquoise, bleu et bleu profond. L’échelle reste visible. Elle n’est pas un pourcentage de maturité, un bilan individuel ou une mesure d’épaisseur. Une région rouge est déjà fonctionnelle et le bleu ne signifie pas un développement achevé.

## Recherche et lecture des couleurs

« Repères & sources » ouvre deux onglets : lire l’illustration et consulter treize études primaires par région ou par capacité. Chaque fiche précise la fenêtre d’âge, l’échantillon, la mesure, le résultat et sa limite. Aucun appel externe n’est effectué pour afficher ces fiches ; les liens ouvrent les publications à la demande. La [revue complète](RESEARCH_REVIEW.md), datée du 17 novembre 2026, documente la sélection, la correspondance avec les régions et les limites. Les preuves soutiennent les grandes tendances, sans valider les couleurs numériques.

Le modèle de couleur est désormais construit sur **19 trajectoires régionales**, attribuées explicitement aux 74 labels Destrieux de chaque hémisphère. Les 64 variations spatiales artificielles ont été retirées. Chaque trajectoire comporte huit repères : naissance, 6 mois, 1, 2, 5, 10, 15 et 20 ans. Une interpolation cubique monotone sur `log(1 + âge)` garde des transitions continues et un raffinement après vingt ans. Deux passes de lissage très locales sur le maillage adoucissent les frontières sans mélanger les hémisphères.

La vision primaire calcarine est distinguée des aires visuelles d’association ; Heschl des régions auditives associatives ; le frontal inférieur operculaire du sillon temporal supérieur ; les réseaux frontopariétaux du pôle préfrontal. Les rythmes sont donc différenciés par région et par période, avec un état initial présent à la naissance. Les références guident qualitativement ces distinctions ; les valeurs des huit repères restent des conventions de couleur, sans ajustement à une mesure d’imagerie. Le gabarit anatomique adulte reste fixe.

## Profil : dix curseurs

Le volet **Profils** contient uniquement les catégories et leurs curseurs : communication expressive, communication réceptive, motricité, compréhension des consignes, mémoire des étapes, coordination, autorégulation, inhibition, traitement sensoriel et flexibilité cognitive. Les exemples prédéfinis, situations de classe, menus, accordéon et comparaison ont été retirés.

Tous les curseurs démarrent à droite, au **repère neurotypique illustratif du même âge**. Ils se déplacent progressivement vers la gauche pour illustrer des déficits, sans position supérieure au repère. Leur plage interne est −1 à 0, par pas de 0,01 ; aucun pourcentage de capacité n’est affiché. Les libellés accessibles précisent la position. Les repères d’âge restent visibles.

Les dix influences spatiales sont distinctes et partiellement communes. Les communications expressive et réceptive sont séparées, ainsi que la motricité et la coordination. Ces deux derniers domaines influent aussi, avec des poids différents, sur le cervelet. Les nouvelles dimensions d’inhibition, de traitement sensoriel et de flexibilité cognitive utilisent des réseaux distribués et partiellement partagés avec les autres domaines. Les déficits se cumulent de manière bornée : accentuer un déficit ne peut pas annuler celui d’un autre domaine.

La plage de couleur couvre désormais tout le trajet jusqu’au rouge, même à 16 ou 20 ans, dans les noyaux des réseaux influencés. Les poids forts sont saturés progressivement à partir du seuil illustratif 0,9 ; les influences périphériques restent graduelles. Le contraste multiplie la couleur de référence par la fraction restante, sans plafonnement lié à l’âge. La coordination au maximum peut aussi amener le cervelet au rouge. Ce rouge reste une convention de couleur, sans signifier une absence de fonctionnement.

Replacer tous les curseurs à droite restitue exactement le rendu de référence au même âge. Fermer le volet conserve les réglages. La remise à zéro globale rétablit le repère et revient à la naissance. Les poids et les couleurs restent des conventions pédagogiques, sans score psychométrique, âge mental ou profil diagnostique. Le terme « neurotypique » désigne ici le repère de l’illustration, pas une norme mesurée.

## Épilepsie dans le volet de droite

Le bouton **Épilepsie** active le ciblage cortical et un menu extensible :

- **Crise focale avec diffusion** : expansion violette pendant huit secondes, puis zone atteinte persistante. Relancer rejoue l’expansion.
- **Activité électrique localisée** : zone rose plus petite, deux anneaux et pulsation douce de quatre secondes.
- **Développement local (hypothèse)** : zone ambrée hachurée, avec un décalage illustratif de 0 à 60 mois, borné à zéro au niveau de l’âge effectif.

Un clic ou un toucher choisit le foyer ; un autre le déplace. Changer d’effet conserve le foyer. Effacer le foyer l’efface ; le bouton ou Échap quitte le mode. Réduire le volet conserve le ciblage et le foyer. Le bouton Épilepsie permet alors de rouvrir ses réglages. Si le volet Profils est ouvert, Échap replie d’abord ce volet. Entrée sur le cerveau sélectionne le centre de la vue de côté, après orientation au clavier. Faire glisser continue de tourner le cerveau. Le cervelet n’est pas une cible corticale. Les effets peuvent se combiner à un profil illustratif ; les deux réglages restent indépendants. La réduction des animations conserve les trois effets sous une forme statique distincte. Les effets restent pédagogiques, sans modèle neuronal, EEG ni prédiction clinique.

## Audition, langage et régions précoces

Le modèle couvre toutes les régions de l’atlas avec des courbes propres à leur ensemble anatomique. `REGIONAL_CURVES` conserve les huit repères et les références utilisées pour chaque trajectoire ; `curveForLabel` permet d’auditer l’attribution. La correspondance est bilatérale, sans simulation de latéralisation. Les limites gyrales ne sont pas des frontières fonctionnelles exactes. Sans atlas, un champ spatial grossier assure le rendu de secours et les profils sont désactivés.

Les thèmes affichés reposent sur des repères généraux de communication et de développement. Les tranches sont éditoriales ; elles ne décrivent pas une bascule biologique à une date précise. Les textes ne sont pas calculés à partir de la couleur des régions. Sources et limites : [SCIENTIFIC_SOURCES.md](SCIENTIFIC_SOURCES.md).

## Anatomie et fichiers

- `assets/cortex.bin` : surface adulte fsaverage5 distribuée par Nilearn 0.12.1, 20 484 sommets et 40 960 triangles, avec profondeur des sillons. En-tête uint32 little-endian (`0x42524E31`, sommets, indices, réservé), puis positions RAS float32, profondeurs float32 et indices uint16. `tools/prepare-cortex.py` reproduit le fichier.
- `assets/cerebellum.bin` : deux hémisphères cérébelleux, 32 694 sommets et 65 376 triangles, extraits des labels FreeSurfer 7+8 et 46+47. En-tête uint32 (`0x43424C31`, total sommets, total indices, nombre de parties), positions RAS float32 puis indices uint32 locaux à chaque partie. Les offsets, labels, empreintes et bornes sont dans `assets/cerebellum-source.json`.
- `tools/prepare-cerebellum.py --segmentation chemin/aseg.mgz` reproduit le cervelet avec NumPy, SciPy, NiBabel et scikit-image. L’entrée est vérifiée par SHA-256. Le gabarit fsaverage est fixé au commit MNE testing data `20cc221d737a37a6ee3a9c007e91bd69541fefe9`.
- `assets/destrieux-labels.bin` : un uint16 par sommet, 0 sans label, 1–74 à gauche et 75–148 à droite. `tools/prepare-atlas.py` extrait seulement les labels anatomiques au commit CTdev `418ff157bd8036e01a5d823754bbd7cff5fdda1b`. Les noms et empreintes figurent dans `assets/atlas-source.json`.
- `development-profiles.js` définit les dix domaines, leurs influences anatomiques approximatives et le cumul borné des déficits. Les influences sont lissées le long des arêtes corticales.
- `maturation.js` définit les trajectoires anatomiques et leur interpolation, `age-insights.js` les repères textuels, `colour-scale.js` la palette, `cortical-network.js` les distances géodésiques du cortex et `epilepsy-effects.js` le registre extensible des effets.
- Three.js 0.170.0 est servi depuis `vendor/`. Le rendu se déclenche à la demande ou pendant une animation. Le cortex et le cervelet gardent une anatomie adulte fixe, sans simulation de croissance.
- Les actifs d’atlas restent sous **CC BY-NC-SA 4.0** et le cervelet sous la licence **FreeSurfer v1.0**, séparément du code. Les avis complets sont dans `THIRD_PARTY_NOTICES.txt` et les fichiers de licence associés.

## Vérification

Depuis la racine du dépôt :

```sh
python3 -m http.server 5173
node --test pedagogique/developpement-cerebral/tests/scientific-model.test.mjs
```

Ouvrir `http://localhost:5173/pedagogique/developpement-cerebral/` avec WebGL 2. Les modules et fichiers binaires nécessitent HTTP, pas `file://`.

Les tests couvrent les maillages fermés et orientés du cervelet, les identités anatomiques, les bandes dorsales et les trajectoires auditives/langagières bilatérales, la palette, les repères des 241 choix mensuels et l’absence de propagation entre hémisphères disjoints. Les tests couvrent aussi l’identité du réglage zéro, les bornes des variations, l’accès au rouge à 16 et 20 ans pour les dix domaines, les influences partagées et leur lissage sans saut entre hémisphères. Le parcours navigateur vérifie les interactions, le retour exact au repère au même âge, les dix réglages indépendants, les volets à droite, le rendu, les petits écrans et les scénarios focaux.

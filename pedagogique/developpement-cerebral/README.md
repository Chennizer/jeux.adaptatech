# Développement cérébral — prototype interactif

Page statique : `/pedagogique/developpement-cerebral/`, sur l’hébergement existant, sans compilation ni requête externe à l’exécution. L’interface est en français.

## Utilisation

Deux vues du cortex et du cervelet, de côté et du dessus, évoluent ensemble avec un curseur **mensuel de 0 à 20 ans**. Lecture/pause, remise à zéro, aide et plein écran sont disponibles. La vue de côté se tourne à la souris, au toucher ou avec les flèches lorsque le cerveau a le focus ; Début rétablit l’orientation. L’âge s’affiche en mois avant un an, puis en années et mois.

Le graphique occupe **tout l’écran**, avec des commandes superposées qui ne réduisent pas sa surface. Les repères par âge sont intégrés en haut de la vue : un titre court, la période et trois mots-clés. Par exemple : « Babiller et échanger — Babillage · Imitation · Échanges ». Les dix périodes évoluent avec le curseur, de 0–3 mois à 16–20 ans. Aucun encadré ni volet détaillé ne masque le graphique. L’âge exact et le curseur restent centrés en bas. En paysage très court, seul le titre est conservé pour donner la priorité au cerveau. Les textes suivent l’âge global, y compris pendant un scénario focal. Le panneau des scénarios s’ouvre au-dessus des commandes sans redimensionner le cerveau.

Le seul mode de couleurs est une **illustration** continue à sept repères : rouge, orange, jaune, vert, turquoise, bleu et bleu profond. L’échelle reste visible. Elle n’est pas un pourcentage de maturité, un bilan individuel ou une mesure d’épaisseur. Une région rouge est déjà fonctionnelle et le bleu ne signifie pas un développement achevé.

Le bouton **Épilepsie** active le ciblage cortical et un menu extensible :

- **Crise focale avec diffusion** : expansion violette pendant huit secondes, puis zone atteinte persistante. Relancer rejoue l’expansion.
- **Activité électrique localisée** : zone rose plus petite, deux anneaux et pulsation douce de quatre secondes.
- **Développement local (hypothèse)** : zone ambrée hachurée, avec un décalage illustratif de 0 à 60 mois, borné à zéro au niveau de l’âge effectif.

Un clic ou un toucher choisit le foyer ; un autre le déplace. Changer d’effet conserve le foyer. La croix l’efface ; le bouton ou Échap quitte le mode. Entrée sur le cerveau sélectionne le centre de la vue de côté, après orientation au clavier. Faire glisser continue de tourner le cerveau. Le cervelet n’est pas une cible corticale. La réduction des animations conserve les trois effets sous une forme statique distincte. Les effets restent pédagogiques, sans modèle neuronal, EEG ni prédiction clinique.

## Audition, langage et régions précoces

Le modèle combine 64 sous-zones illustratives par hémisphère avec des **repères anatomiques Destrieux** :

- Gyri postcentral et précentral, région paracentrale et sillons centraux : bandes sensorielles et motrices dorsales précoces, conservées dans les deux hémisphères.
- Régions visuelles : cunéus, gyrus lingual, pôle occipital et sillon calcarin.
- Audition primaire : gyrus temporal transverse, repère anatomique du gyrus de Heschl.
- Audition associative et langage : gyrus temporal supérieur, planum temporale, planum polare, gyrus temporal moyen et sillon temporal supérieur ; régions frontales inférieures operculaire, triangulaire et orbitaire ; gyri angulaire et supramarginal.

Les fenêtres de couleur de l’audition primaire, des régions temporales et des régions frontales sont différentes. Elles rendent visibles des changements précoces et un raffinement prolongé. Les régions sont des repères gyralement définis, pas des limites fonctionnelles exactes. Le langage est distribué et n’est pas réduit à deux centres. Les paramètres restent illustratifs, sans ajustement à des données longitudinales ni simulation de latéralisation.

Les thèmes affichés reposent sur des repères généraux de communication et de développement. Les tranches sont éditoriales ; elles ne décrivent pas une bascule biologique à une date précise. Les textes ne sont pas calculés à partir de la couleur des régions. Sources et limites : [SCIENTIFIC_SOURCES.md](SCIENTIFIC_SOURCES.md).

## Anatomie et fichiers

- `assets/cortex.bin` : surface adulte fsaverage5 distribuée par Nilearn 0.12.1, 20 484 sommets et 40 960 triangles, avec profondeur des sillons. En-tête uint32 little-endian (`0x42524E31`, sommets, indices, réservé), puis positions RAS float32, profondeurs float32 et indices uint16. `tools/prepare-cortex.py` reproduit le fichier.
- `assets/cerebellum.bin` : deux hémisphères cérébelleux, 32 694 sommets et 65 376 triangles, extraits des labels FreeSurfer 7+8 et 46+47. En-tête uint32 (`0x43424C31`, total sommets, total indices, nombre de parties), positions RAS float32 puis indices uint32 locaux à chaque partie. Les offsets, labels, empreintes et bornes sont dans `assets/cerebellum-source.json`.
- `tools/prepare-cerebellum.py --segmentation chemin/aseg.mgz` reproduit le cervelet avec NumPy, SciPy, NiBabel et scikit-image. L’entrée est vérifiée par SHA-256. Le gabarit fsaverage est fixé au commit MNE testing data `20cc221d737a37a6ee3a9c007e91bd69541fefe9`.
- `assets/destrieux-labels.bin` : un uint16 par sommet, 0 sans label, 1–74 à gauche et 75–148 à droite. `tools/prepare-atlas.py` extrait seulement les labels anatomiques au commit CTdev `418ff157bd8036e01a5d823754bbd7cff5fdda1b`. Les noms et empreintes figurent dans `assets/atlas-source.json`.
- `maturation.js` définit les fenêtres illustratives, `age-insights.js` les repères textuels, `colour-scale.js` la palette, `cortical-network.js` les distances géodésiques du cortex et `epilepsy-effects.js` le registre extensible des effets.
- Three.js 0.170.0 est servi depuis `vendor/`. Le rendu se déclenche à la demande ou pendant une animation. Le cortex et le cervelet gardent une anatomie adulte fixe, sans simulation de croissance.
- Les actifs d’atlas restent sous **CC BY-NC-SA 4.0** et le cervelet sous la licence **FreeSurfer v1.0**, séparément du code. Les avis complets sont dans `THIRD_PARTY_NOTICES.txt` et les fichiers de licence associés.

## Vérification

Depuis la racine du dépôt :

```sh
python3 -m http.server 5173
node --test pedagogique/developpement-cerebral/tests/scientific-model.test.mjs
```

Ouvrir `http://localhost:5173/pedagogique/developpement-cerebral/` avec WebGL 2. Les modules et fichiers binaires nécessitent HTTP, pas `file://`.

Les tests couvrent les maillages fermés et orientés du cervelet, les identités anatomiques, les bandes dorsales et les trajectoires auditives/langagières bilatérales, la palette, les repères des 241 choix mensuels et l’absence de propagation entre hémisphères disjoints. Le parcours navigateur vérifie les interactions, les textes selon l’âge, le rendu, les petits écrans et les scénarios focaux.

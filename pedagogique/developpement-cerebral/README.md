# Développement cérébral — prototype interactif

Page statique : `/pedagogique/developpement-cerebral/`. Elle utilise le même hébergement que le reste du dépôt, sans service Sites, compilation ni requête externe à l’exécution.

Deux affichages sont disponibles avec le bouton latéral **IRM** : l’illustration de la naissance à 20 ans, et des épaisseurs corticales de référence sur **148 régions anatomiques entre 5 et 20 ans**. Le second affichage utilise des données publiées en millimètres, avec une échelle fixe ; ses couleurs ne sont pas un score de maturité. La sélection du mode IRM depuis un âge inférieur à 5 ans place le curseur à 5 ans ; revenir à l’illustration retrouve l’âge initial.

## Utilisation

Le curseur de 0 à 20 ans modifie les deux vues du cerveau en continu. Lecture/pause, remise à zéro et plein écran sont accessibles par des boutons. La vue de côté peut être tournée à la souris, au doigt ou avec les flèches lorsque le cerveau a le focus (Début rétablit l’orientation). Le curseur natif fonctionne au clavier. Les vues se superposent sur un écran étroit. Le bouton d’information ouvre les explications, sources et crédits ; aucune annotation n’est superposée au cerveau.

Le tronc cérébral est visible sous le cortex dès le chargement. Le bouton **Tronc** alterne la seconde vue entre une vue oblique en transparence, qui le dégage, et la vue du dessus. Il reste anatomiquement présent dans les deux cas.

Le curseur se règle mois par mois. L’âge s’affiche en mois avant le premier anniversaire (« 6 mois »), puis en années et mois (« 1 an 6 mois »). Pendant la lecture, les couleurs évoluent en continu entre les mois.

Le bouton **Épilepsie** active un curseur de ciblage et un menu de trois effets : **crise focale avec diffusion**, **activité électrique localisée** et **développement local hypothétique**. Un clic ou un toucher dans l’une des deux vues choisit le foyer ; un autre clic le déplace. La croix l’efface ; Échap ou le bouton quitte le mode. Il reste possible de tourner la vue de côté en faisant glisser. Au clavier, Entrée sur le cerveau sélectionne le centre de la vue de côté, après orientation avec les flèches. La diffusion colore une zone violette qui s’étend pendant huit secondes, puis reste visible. **Relancer** permet de revoir son expansion. L’activité localisée est bleue avec deux anneaux et une pulsation lente ; elle conserve une zone plus petite. L’hypothèse de développement est ambrée et hachurée. La réduction des animations conserve ces différences et affiche directement la zone de diffusion finale. Le ciblage est réservé au cortex ; toucher le tronc cérébral invite à choisir une zone corticale.

L’hypothèse de développement propose un décalage local réglable de 0 à 60 mois. Elle passe en mode Illustration et ne modifie jamais les données IRM. Le bouton IRM quitte cette hypothèse pour retrouver les valeurs de référence. Le menu conserve le foyer lorsque l’on change d’effet.

Pour essayer localement, depuis la racine du dépôt :

```sh
python3 -m http.server 5173
```

Ouvrir `http://localhost:5173/pedagogique/developpement-cerebral/` dans un navigateur avec WebGL 2. Un chargement par `file://` ne fonctionne pas pour les modules et le modèle binaire.

## Portée scientifique

Le détail des sources, des extractions, de l’échelle de couleurs et des limites est dans [SCIENTIFIC_SOURCES.md](SCIENTIFIC_SOURCES.md).

### Mode IRM

- Courbes de référence de Lotter et al. (2024), issues du modèle de Rutherford et al. (2022), avec l’atlas Destrieux 2010 sur fsaverage5. Il s’agit de prédictions d’un modèle de population, pas d’IRM d’une personne.
- Moyenne arithmétique des médianes féminine et masculine, interpolée entre les 31 estimations semestrielles de 5 à 20 ans. Les fichiers amont contiennent des âges extrapolés plus jeunes ; ils sont exclus de l’application conformément à la plage utilisée dans l’étude.
- Échelle **4 mm rouge → 1,5 mm vert**, avec zones non parcellisées en gris. Plus fin ne signifie pas systématiquement plus mature. Aucune trajectoire monotone n’est forcée sur les valeurs publiées.
- Données dérivées sous **CC BY-NC-SA 4.0** ; crédits et licence conservés séparément du code.

### Mode Illustration

- La géométrie réelle est la surface corticale moyenne **adulte** fsaverage5, distribuée par Nilearn 0.12.1 à partir de FreeSurfer. Il ne s’agit pas d’un modèle anatomique de nouveau-né ni d’une simulation de croissance. Le tronc cérébral provient de la segmentation fsaverage compatible (voir ci-dessous). Le cervelet n’est pas représenté.
- Sept grandes tendances spatiales en coordonnées RAS sont déclinées en **64 sous-zones par hémisphère**, réparties sur la surface corticale. Chaque sous-zone a un calendrier distinct et reproductible pour faire coexister des poches rouges, oranges, jaunes et vertes au même âge. Leurs bords se mélangent localement avec une légère variation liée aux sillons. Ces zones et leurs courbes, dans `maturation.js`, sont **illustratives**, sans atlas parcellisé ni ajustement à des données longitudinales. Les âges de début/fin sont des paramètres d’animation.
- Chaque sous-zone combine une progression dès les premiers mois et une phase plus lente étalée sur l’enfance et l’adolescence. La part et la vitesse de la phase initiale varient selon les zones, avec davantage de changements précoces dans les zones sensorielles. Ce choix visuel rend 6 mois, 1 an et 2 ans distincts tout en conservant une évolution après 5 ans.
- Une interpolation progressive transforme le rouge en orange, jaune, puis vert. Elle indique une maturation relative schématique, sans exprimer un pourcentage, une capacité individuelle ou une mesure de matière grise. Le rouge ne signifie pas qu’une région est inactive.
- Les régions antérieures restent partiellement jaunes à 20 ans pour ne pas suggérer une maturation achevée à cet âge. La maturation varie selon la mesure étudiée et se poursuit au-delà de 20 ans.
- Les sous-zones servent à enrichir visuellement la progression. La carte ancienne des images de référence ne doit pas être assimilée directement à un indice global de maturité.

Repère général : [NIMH — The Teen Brain: 7 Things to Know](https://www.nimh.nih.gov/health/publications/the-teen-brain-7-things-to-know).

### Tronc cérébral

- Anatomie réelle : label 16 de `fsaverage/mri/aseg.mgz`, distribué par MNE testing data au commit `20cc221d737a37a6ee3a9c007e91bd69541fefe9`. La surface est extraite après lissage léger et exprimée en RAS de surface FreeSurfer pour rester alignée avec le cortex.
- Le développement prénatal et la myélinisation précoce justifient une couleur déjà vert clair à la naissance, qui évolue encore après celle-ci. Cette chronologie est **qualitative** : `brainstemColourStage()` n’est pas une courbe ajustée à des mesures, ni un pourcentage de maturité. Le tronc n’est pas considéré comme achevé à la naissance.
- En mode IRM, le tronc reste **gris** : les données d’épaisseur corticale ne fournissent aucune mesure pour cette structure. Les scénarios d’épilepsie restent corticaux.
- Source scientifique : [Normal human brainstem development in vivo: a quantitative fetal MRI study](https://pmc.ncbi.nlm.nih.gov/articles/PMC8457244/). Les références complètes et limites figurent dans `SCIENTIFIC_SOURCES.md`.

## Rendu et fichiers

- Three.js 0.170.0, copié localement dans `vendor/`, sous licence MIT.
- `assets/cortex.bin` : deux hémisphères, 20 484 sommets, 40 960 triangles ; profondeur des sillons pour accentuer le relief. En-tête de quatre uint32 little-endian (`0x42524E31`, nombre de sommets, nombre d’indices, réservé), puis positions RAS float32, profondeurs float32 et indices uint16.
- `assets/brainstem.bin` : 8 680 sommets, 17 356 triangles. En-tête de quatre uint32 little-endian (`0x42535431`, sommets, indices, réservé), puis positions RAS float32 et indices uint16. `tools/prepare-brainstem.py --segmentation chemin/aseg.mgz` reproduit cette surface avec NumPy, SciPy, NiBabel et scikit-image. Les paramètres, coordonnées et empreintes de la source sont dans `assets/brainstem-source.json` ; licence FreeSurfer séparée dans `assets/freesurfer-license.txt`.
- `tools/prepare-cortex.py` reproduit le modèle depuis la version 0.12.1 de Nilearn avec la bibliothèque standard Python. La topologie et les coordonnées sont conservées. La permutation des axes et le centrage se font à l’affichage.
- Les couleurs sont calculées dans un matériau éclairé avec un paramètre d’âge partagé par les deux vues. Le rendu se déclenche uniquement lors d’un changement, d’une rotation, d’un redimensionnement ou pendant la lecture.
- Le mode de réduction des animations respecte la lecture volontaire, en avançant alors par années entières. La lecture s’arrête si l’onglet est masqué ou si l’aide est ouverte.
- Les crédits et licences des éléments tiers sont conservés dans `THIRD_PARTY_NOTICES.txt` et ne sont pas remplacés par la licence générale du dépôt.

Source anatomique : [Nilearn, fetch_surf_fsaverage](https://nilearn.github.io/stable/modules/generated/nilearn.datasets.fetch_surf_fsaverage.html).

## Données et activité focale

- `assets/cortical-thickness.json` contient les médianes régionales, les âges, les DOI, le commit amont et les empreintes des sources. `assets/destrieux-labels.bin` contient un uint16 little-endian par sommet, de 0 (sans label) à 148. La correspondance des noms et identifiants est vérifiée par le script de préparation.
- `tools/prepare-scientific-data.py` reproduit ces actifs avec Python 3 et NumPy. Il ne charge aucun objet pickle et ne refait pas l’ajustement statistique des auteurs.
- `cortical-data.js` interpole les courbes sans extrapolation hors de la plage 5–20 ans. Les valeurs corticales restent inchangées lorsque l’activité focale est affichée.
- `cortical-network.js` construit le graphe des arêtes du cortex et calcule des distances de surface par Dijkstra. La diffusion est une illustration géométrique locale, sans connectome, modèle neuronal, EEG, prédiction clinique ou estimation d’un effet sur le développement.
- `epilepsy-effects.js` contient le registre des choix du menu, leurs descriptions, leur famille de rendu et leur besoin éventuel du mode Illustration. De nouveaux choix peuvent être ajoutés à ce registre ; une famille de rendu nouvelle nécessite aussi son implémentation dans le matériau. L’activité locale pulse lentement sur une période de quatre secondes, sans diffusion. L’hypothèse de développement utilise un âge effectif réduit autour du foyer et borné à zéro, selon le décalage choisi ; elle ne représente pas un effet biologique mesuré de l’épilepsie.

## Vérification

Depuis la racine du dépôt, avec Node 22 ou plus récent :

```sh
node --test pedagogique/developpement-cerebral/tests/scientific-model.test.mjs
```

Les tests couvrent l’intégrité et l’orientation du maillage du tronc, son alignement en coordonnées de surface, les valeurs publiées, l’interpolation, l’absence d’extrapolation vers la petite enfance, les identifiants anatomiques et l’impossibilité d’une propagation par le maillage vers l’autre hémisphère. Le parcours navigateur vérifie séparément le ciblage dans les deux vues, le tactile, le clavier, les changements de mode et le rendu.

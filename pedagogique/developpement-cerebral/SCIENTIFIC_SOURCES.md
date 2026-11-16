# Sources, mesures et limites

## Ce qui est réellement basé sur des données

Le bouton **IRM** affiche l’**épaisseur corticale régionale en millimètres**, de 5 à 20 ans, sur l’atlas anatomique **Destrieux 2010 : 74 régions par hémisphère**. Il remplace les découpages et calendriers illustratifs par les labels de l’atlas sur fsaverage5 et les prédictions d’un modèle de référence publié.

Sources principales :

- Lotter et al. (2024), *Regional patterns of human cortex development correlate with underlying neurobiology*, Nature Communications 15, 7987. DOI : https://doi.org/10.1038/s41467-024-52366-7.
- Rutherford et al. (2022), *Charting brain growth and aging at high spatial precision*, eLife 11:e72904. DOI : https://doi.org/10.7554/eLife.72904.
- Données extraites, atlas et code des auteurs : https://github.com/LeonDLotter/CTdev ; archive https://doi.org/10.5281/zenodo.7902901.
- Atlas : Destrieux et al. (2010), *Automatic parcellation of human cortical gyri and sulci using standard anatomical nomenclature*, NeuroImage. DOI : https://doi.org/10.1016/j.neuroimage.2010.06.010.

### Extraction reproductible

Le script `tools/prepare-scientific-data.py` utilise le commit `418ff157bd8036e01a5d823754bbd7cff5fdda1b` du dépôt des auteurs. Il retient le 50e centile de chaque courbe féminine et masculine, aux 31 âges semestriels de 5 à 20 ans inclus. Les prédictions inférieures à 5 ans présentes dans les fichiers des auteurs sont **exclues** : l’article restreint son analyse à partir de 5 ans parce que la chaîne FreeSurfer utilisée n’est pas adaptée aux très jeunes enfants.

L’affichage prend la **moyenne arithmétique des deux médianes de modèle**. Ce n’est pas une médiane obtenue sur une population regroupée, une mesure individuelle ni une prédiction du futur d’un enfant. L’interpolation linéaire entre estimations semestrielles permet un curseur mensuel ; ces valeurs intermédiaires ne sont pas de nouvelles observations IRM. Les valeurs publiées sont conservées à six décimales dans le fichier de données. Les empreintes SHA-256 des entrées et les DOI sont enregistrés dans ses métadonnées.

Les labels d’atlas sont conservés sommet par sommet sur la grille fsaverage5 commune aux deux hémisphères. Le script vérifie le nombre de sommets, tous les identifiants et la correspondance de chaque nom d’atlas avec la ligne de la table de prédictions. Il ne déduit pas une région à partir de sa position approximative dans le cerveau.

### Sens des couleurs

L’échelle fixe va de **4 mm en rouge à 1,5 mm en vert**. Elle encode une épaisseur, pas une valeur de « développement ». Un cortex plus fin n’est pas systématiquement meilleur, plus fonctionnel ou plus mature. L’épaisseur et ses variations reflètent plusieurs propriétés biologiques et des effets de mesure. Une région peut avoir une trajectoire différente d’une autre ; aucune progression artificiellement monotone n’est imposée aux courbes IRM. Les surfaces sans label sont grises.

L’éclairage et l’accentuation des sillons améliorent la lisibilité du relief et ne représentent pas des données biologiques supplémentaires. La surface reste un gabarit moyen adulte fixe, sans croissance anatomique ni atlas spécifique à chaque âge. Les incertitudes et différences individuelles ne sont pas affichées sous forme de cartes ; la carte est une référence agrégée.

## Petite enfance : limite conservée explicitement

Le mode **Illustration** garde son curseur de la naissance à 20 ans, ses zones et ses deux phases schématiques. Il permet d’expliquer visuellement les différences entre 6 mois, 1 an et 2 ans. Il ne devient pas une carte scientifique parce qu’un mode IRM a été ajouté.

Le mode IRM commence à 5 ans et n’extrapole pas vers la naissance. Pour étendre une version fondée sur les données à tout l’intervalle 0–20 ans, il faudrait une chaîne infantile dédiée et une harmonisation entre cohortes et atlas, avec une validation des raccordements. Un exemple de travail spécifiquement consacré à cette période est Wang et al. (2019), *Developmental topography of cortical thickness during infancy*, https://doi.org/10.1073/pnas.1821523116 (210 IRM longitudinales chez 43 nourrissons, âges planifiés de 1 à 24 mois). Ce travail est cité comme piste et n’alimente pas les couleurs de l’application.

## Tronc cérébral : anatomie réelle, chronologie qualitative

Le maillage provient du label **16 (Brain-Stem)** de la segmentation adulte FreeSurfer `fsaverage/mri/aseg.mgz`, distribuée par [MNE testing data](https://github.com/mne-tools/mne-testing-data/blob/20cc221d737a37a6ee3a9c007e91bd69541fefe9/subjects/fsaverage/mri/aseg.mgz), au commit `20cc221d737a37a6ee3a9c007e91bd69541fefe9`. Le script `tools/prepare-brainstem.py` isole le label, applique un filtre gaussien de sigma 0,8 voxel, extrait la surface à 0,5 par marching cubes et utilise la matrice **vox2ras_tkr** pour rejoindre les coordonnées du cortex. Les triangles sont orientés vers l’extérieur. L’empreinte du fichier d’entrée, les bornes RAS et les paramètres sont conservés dans `assets/brainstem-source.json`.

La surface compte 8 680 sommets et 17 356 triangles. Il s’agit d’un gabarit adulte fixe, sans croissance ni séparation du mésencéphale, du pont et du bulbe en trajectoires mesurées. La seconde vue utilise un cortex transparent pour dégager cette anatomie ; le bouton Tronc rétablit une vue du dessus opaque.

Le développement du tronc commence pendant la vie fœtale et sa maturation se poursuit après la naissance. Sources :

- *Normal human brainstem development in vivo: a quantitative fetal MRI study*, https://pmc.ncbi.nlm.nih.gov/articles/PMC8457244/ : croissance et changements des sous-structures pendant les deuxième et troisième trimestres.
- *Neonate and Infant brain development from birth to 2 years assessed using MRI-based quantitative susceptibility mapping*, https://pmc.ncbi.nlm.nih.gov/articles/PMC6292682/ : contexte de myélinisation précoce et changements après la naissance.

Ces références justifient un **repère chronologique**, pas les valeurs d’une courbe de maturité. Le vert clair dès la naissance et son évolution ultérieure sont choisis pour l’illustration. La fonction numérique `brainstemColourStage()` sert uniquement au mélange de couleurs ; elle ne doit pas être présentée comme un pourcentage, une mesure de myéline ou un ajustement à ces études. En mode IRM, le tronc est gris, car aucune valeur d’épaisseur corticale ne lui est attribuable.

## Mode épilepsie : activité focale schématique

Le bouton active un curseur de ciblage. Le clic dans l’une des deux vues est projeté sur la vraie surface par ray casting ; le sommet le plus proche du triangle touché devient le foyer. L’identité anatomique est lue dans le même atlas. Un autre clic remplace le foyer ; la croix l’efface ; le bouton ou Échap désactive le mode. La sélection est également disponible avec Entrée sur le cerveau, après rotation au clavier.

Le menu est construit à partir du registre `epilepsy-effects.js`, pour permettre l’ajout de choix ultérieurs. Les trois choix initiaux sont :

1. **Crise focale avec diffusion** : une zone violette s’étend sur la surface pendant huit secondes, puis la zone atteinte reste affichée après l’arrêt de l’animation à dix secondes. Le bouton Relancer rejoue l’expansion depuis le même foyer.
2. **Activité électrique localisée** : une zone bleue avec deux anneaux qui pulse lentement sur une période de quatre secondes, sans onde de diffusion. Avec réduction des animations, elle reste statique.
3. **Développement local (hypothèse)** : une zone ambrée hachurée distingue le scénario. Un décalage choisi de 0 à 60 mois (36 mois par défaut) est appliqué à l’âge effectif du modèle illustratif autour du foyer, avec une influence qui décroît avec la distance de surface et un âge effectif borné à zéro. Il s’agit d’un paramètre de scénario, sans calibration biologique ni estimation d’un effet de l’épilepsie. Le mode Illustration est imposé pour ce choix. Revenir à l’IRM ferme le scénario et affiche les valeurs de référence inchangées.

La diffusion violette utilise les plus courts chemins pondérés sur les arêtes du maillage. Elle suit la surface et reste dans l’hémisphère du foyer. Elle s’étend progressivement jusqu’à un rayon géodésique illustratif de 96 mm et conserve sa zone colorée ; elle ne revient plus à un simple point. L’activité locale utilise un rayon de 34 mm et le scénario de développement un rayon de 58 mm, avec une influence décroissante. Ces rayons sont des paramètres de lisibilité sur le gabarit adulte et ne sont pas des étendues cliniques mesurées. Le point central est seulement un repère de sélection. La pulsation locale est une variation douce de rayon. Il n’y a pas de flash ni de clignotement brusque. La préférence de réduction des animations donne une représentation statique distincte pour chaque effet : diffusion finale violette, zone bleue à anneaux ou hachures ambrées. Les animations s’arrêtent lorsque l’aide s’ouvre ou que l’onglet est masqué.

Ce mécanisme est une **illustration géométrique**, sans connectome, conduction axonale, modèles neuronaux, EEG, symptômes, diagnostic ou estimation d’un risque de crise. Il n’est pas un modèle Epileptor, ne reproduit pas toutes les formes d’épilepsie et ne prédit pas l’impact d’une crise sur le développement. Les crises focales réelles peuvent se propager dans des réseaux distants, profonds ou controlatéraux ; cet aspect n’est pas simulé ici.

Références conceptuelles :

- ILAE, classification des crises mise à jour en 2025 : https://www.ilae.org/guidelines/definition-and-classification/updated-classification-of-epileptic-seizures-2025 ; DOI https://doi.org/10.1111/epi.18338.
- ILAE, crises focales : https://www.epilepsydiagnosis.org/seizure/focal-seizure-groupoverview.html.

## Licences et vérification

La surface `assets/brainstem.bin` dérive de données FreeSurfer ; elle conserve séparément la licence FreeSurfer v1.0 complète dans `assets/freesurfer-license.txt`, avec l’avis MGH et les modifications décrites dans `THIRD_PARTY_NOTICES.txt`.

Les fichiers `assets/cortical-thickness.json` et `assets/destrieux-labels.bin` sont des adaptations du dépôt CTdev, conservées sous **CC BY-NC-SA 4.0**. Le texte complet est dans `assets/ctdev-license.txt`. Ces conditions s’appliquent à ces données séparément du code de l’application ; les données ne sont pas placées sous la licence générale du dépôt. Les modifications apportées sont l’extraction des âges, la sélection des médianes, l’arrondi et le changement de conteneur de l’atlas.

Les tests `tests/scientific-model.test.mjs` vérifient le maillage fermé et orienté du tronc en RAS de surface, les points publiés, l’interpolation, l’exclusion des âges non couverts, les identifiants anatomiques et la propagation sur des composants de surface séparés. Ils vérifient l’implémentation et ne constituent pas une validation clinique de l’application.

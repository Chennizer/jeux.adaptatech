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

## Mode épilepsie : activité focale schématique

Le bouton active un curseur de ciblage. Le clic dans l’une des deux vues est projeté sur la vraie surface par ray casting ; le sommet le plus proche du triangle touché devient le foyer. L’identité anatomique est lue dans le même atlas. Un autre clic remplace le foyer ; la croix l’efface ; le bouton ou Échap désactive le mode. La sélection est également disponible avec Entrée sur le cerveau, après rotation au clavier.

Le menu est construit à partir du registre `epilepsy-effects.js`, pour permettre l’ajout de choix ultérieurs. Les trois choix initiaux sont :

1. **Crise focale avec diffusion** : un foyer et une diffusion de surface pendant dix secondes, puis un foyer local persistant.
2. **Activité électrique localisée** : une zone locale qui pulse lentement sur une période de quatre secondes, sans onde de diffusion. Avec réduction des animations, elle reste statique.
3. **Développement local (hypothèse)** : un décalage choisi de 0 à 60 mois est appliqué à l’âge effectif du modèle illustratif autour du foyer, avec une influence qui décroît avec la distance de surface et un âge effectif borné à zéro. Il s’agit d’un paramètre de scénario, sans calibration biologique ni estimation d’un effet de l’épilepsie. Le mode Illustration est imposé pour ce choix. Revenir à l’IRM ferme le scénario et affiche les valeurs de référence inchangées.

La diffusion violette utilise les plus courts chemins pondérés sur les arêtes du maillage. Elle suit la surface et reste dans l’hémisphère du foyer. Elle s’étend progressivement puis s’atténue, avec un repère local persistant. La pulsation locale est une variation douce de rayon. Il n’y a pas de flash ni de clignotement brusque. La préférence de réduction des animations donne une représentation locale statique. Les animations s’arrêtent lorsque l’aide s’ouvre ou que l’onglet est masqué.

Ce mécanisme est une **illustration géométrique**, sans connectome, conduction axonale, modèles neuronaux, EEG, symptômes, diagnostic ou estimation d’un risque de crise. Il n’est pas un modèle Epileptor, ne reproduit pas toutes les formes d’épilepsie et ne prédit pas l’impact d’une crise sur le développement. Les crises focales réelles peuvent se propager dans des réseaux distants, profonds ou controlatéraux ; cet aspect n’est pas simulé ici.

Références conceptuelles :

- ILAE, classification des crises mise à jour en 2025 : https://www.ilae.org/guidelines/definition-and-classification/updated-classification-of-epileptic-seizures-2025 ; DOI https://doi.org/10.1111/epi.18338.
- ILAE, crises focales : https://www.epilepsydiagnosis.org/seizure/focal-seizure-groupoverview.html.

## Licences et vérification

Les fichiers `assets/cortical-thickness.json` et `assets/destrieux-labels.bin` sont des adaptations du dépôt CTdev, conservées sous **CC BY-NC-SA 4.0**. Le texte complet est dans `assets/ctdev-license.txt`. Ces conditions s’appliquent à ces données séparément du code de l’application ; les données ne sont pas placées sous la licence générale du dépôt. Les modifications apportées sont l’extraction des âges, la sélection des médianes, l’arrondi et le changement de conteneur de l’atlas.

Les tests `tests/scientific-model.test.mjs` vérifient les points publiés, l’interpolation, l’exclusion des âges non couverts, les identifiants anatomiques et la propagation sur des composants de surface séparés. Ils vérifient l’implémentation et ne constituent pas une validation clinique de l’application.

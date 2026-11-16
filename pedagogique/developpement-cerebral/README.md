# Développement cérébral — prototype interactif

Page statique : `/pedagogique/developpement-cerebral/`. Elle utilise le même hébergement que le reste du dépôt, sans service Sites, compilation ni requête externe à l’exécution.

## Utilisation

Le curseur de 0 à 20 ans modifie les deux vues du cortex en continu. Lecture/pause, remise à zéro et plein écran sont accessibles par des boutons. La vue de côté peut être tournée à la souris, au doigt ou avec les flèches lorsque le cerveau a le focus (Début rétablit l’orientation). Le curseur natif fonctionne au clavier. Les vues se superposent sur un écran étroit. Le bouton d’information ouvre les explications, sources et crédits ; aucune annotation n’est superposée au cerveau.

Pour essayer localement, depuis la racine du dépôt :

```sh
python3 -m http.server 5173
```

Ouvrir `http://localhost:5173/pedagogique/developpement-cerebral/` dans un navigateur avec WebGL 2. Un chargement par `file://` ne fonctionne pas pour les modules et le modèle binaire.

## Portée scientifique

- La géométrie réelle est la surface corticale moyenne **adulte** fsaverage5, distribuée par Nilearn 0.12.1 à partir de FreeSurfer. Il ne s’agit pas d’un modèle anatomique de nouveau-né ni d’une simulation de croissance. Le cervelet et le tronc cérébral ne sont pas représentés.
- Les zones sont des noyaux spatiaux approximatifs en coordonnées RAS, et non un atlas parcellisé. Leurs courbes, dans `maturation.js`, sont **illustratives**, sans ajustement à des données longitudinales ou validation clinique. Les âges de début/fin des noyaux sont des paramètres d’animation, pas des estimations scientifiques.
- Une interpolation progressive transforme le rouge en orange, jaune, puis vert. Elle indique une maturation relative schématique, sans exprimer un pourcentage, une capacité individuelle ou une mesure de matière grise. Le rouge ne signifie pas qu’une région est inactive.
- Les régions antérieures restent partiellement jaunes à 20 ans pour ne pas suggérer une maturation achevée à cet âge. La maturation varie selon la mesure étudiée et se poursuit au-delà de 20 ans.
- Pour une version scientifique, remplacer les courbes et la segmentation par un jeu de données validé avec un spécialiste. La carte ancienne des images de référence ne doit pas être assimilée directement à un indice global de maturité.

Repère général : [NIMH — The Teen Brain: 7 Things to Know](https://www.nimh.nih.gov/health/publications/the-teen-brain-7-things-to-know).

## Rendu et fichiers

- Three.js 0.170.0, copié localement dans `vendor/`, sous licence MIT.
- `assets/cortex.bin` : deux hémisphères, 20 484 sommets, 40 960 triangles ; profondeur des sillons pour accentuer le relief. En-tête de quatre uint32 little-endian (`0x42524E31`, nombre de sommets, nombre d’indices, réservé), puis positions RAS float32, profondeurs float32 et indices uint16.
- `tools/prepare-cortex.py` reproduit le modèle depuis la version 0.12.1 de Nilearn avec la bibliothèque standard Python. La topologie et les coordonnées sont conservées. La permutation des axes et le centrage se font à l’affichage.
- Les couleurs sont calculées dans un matériau éclairé avec un paramètre d’âge partagé par les deux vues. Le rendu se déclenche uniquement lors d’un changement, d’une rotation, d’un redimensionnement ou pendant la lecture.
- Le mode de réduction des animations respecte la lecture volontaire, en avançant alors par années entières. La lecture s’arrête si l’onglet est masqué ou si l’aide est ouverte.
- Les crédits et licences des éléments tiers sont conservés dans `THIRD_PARTY_NOTICES.txt` et ne sont pas remplacés par la licence générale du dépôt.

Source anatomique : [Nilearn, fetch_surf_fsaverage](https://nilearn.github.io/stable/modules/generated/nilearn.datasets.fetch_surf_fsaverage.html).

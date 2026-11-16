# Sources, représentation et limites

## Anatomie réelle, couleurs illustratives

La page représente une **progression schématique de 0 à 20 ans**. Les limites de certaines régions viennent d’un atlas réel, mais les courbes de couleur sont des paramètres d’animation : elles ne mesurent pas une maturité, une capacité individuelle, la myéline ou une épaisseur. Une région rouge est déjà fonctionnelle ; une région bleue n’est pas nécessairement arrivée au terme de son développement.

Le cortex et le cervelet ont la forme fixe d’un gabarit moyen **adulte**. Le curseur ne simule ni la croissance anatomique ni la variabilité entre personnes. La palette à sept repères rouge → orange → jaune → vert → turquoise → bleu → bleu profond est interpolée en continu et expliquée dans l’aide.

## Repérage des régions corticales

L’atlas **Destrieux 2010** fournit 74 régions par hémisphère sur fsaverage5 :

- Destrieux et al. (2010), *Automatic parcellation of human cortical gyri and sulci using standard anatomical nomenclature*. https://doi.org/10.1016/j.neuroimage.2010.06.010.
- Labels distribués par le dépôt [CTdev](https://github.com/LeonDLotter/CTdev), commit `418ff157bd8036e01a5d823754bbd7cff5fdda1b`, archive https://doi.org/10.5281/zenodo.7902901.

`tools/prepare-atlas.py` extrait uniquement les labels de sommet et les noms anatomiques des fichiers GIFTI, sans mesure développementale ni prédiction d’épaisseur. Il vérifie les 20 484 sommets et les identifiants 0–148. `assets/atlas-source.json` conserve les noms, le commit et les empreintes des entrées ; `assets/destrieux-labels.bin` conserve les labels uint16. Le clic sur le cortex lit la région dans ce même atlas.

## Bandes sensorielles et motrices dorsales

Les labels des gyri postcentral et précentral, de la région paracentrale et des sillons centraux définissent des bandes à progression illustrative précoce dans chaque hémisphère. Les régions visuelles primaires sont approchées par le cunéus, le gyrus lingual, le pôle occipital et le sillon calcarin. Toutes les régions dorsales d’association ne sont pas assimilées à des aires sensorielles primaires.

Deoni et al. (2015), *Cortical maturation and myelination in healthy toddlers and young children*, https://pmc.ncbi.nlm.nih.gov/articles/PMC4463864/, fournit un repère général : la myélinisation est relativement précoce dans les cortex sensorimoteurs et sensoriels primaires. Cette étude ne fournit pas les valeurs numériques des fenêtres d’animation.

## Audition et réseau du langage

Des fenêtres illustratives distinctes concernent :

| Ensemble | Labels Destrieux par hémisphère | Représentation |
| --- | --- | --- |
| Audition primaire | 33 : gyrus temporal transverse / Heschl | Phase infantile plus précoce |
| Audition associative | 34 : temporal supérieur ; 36 : planum temporale ; 35 : planum polare | Changements précoces puis raffinement prolongé |
| Régions temporales du réseau du langage | 38 : temporal moyen ; 73 : sillon temporal supérieur | Trajectoires distinctes de l’audition primaire |
| Régions frontales inférieures | 12 : operculaire ; 14 : triangulaire ; 13 : orbitaire | Phase précoce présente, puis progression plus étalée |
| Régions pariétales associées | 25 : angulaire ; 26 : supramarginal | Raffinement prolongé |

Les labels de droite ajoutent 74 à l’identifiant. Ces régions sont des **repères anatomiques**, pas une parcellisation fonctionnelle exacte de l’audition ou du langage. Le réseau du langage est distribué, participe aussi à d’autres fonctions et est actif dès la petite enfance. La même logique de progression est représentée dans les deux hémisphères, sans simuler les changements de latéralisation. Les paramètres dans `maturation.js` sont illustratifs, sans ajustement aux courbes de ces publications :

- Deoni et al. (2015), cité ci-dessus : contexte de myélinisation sensorielle précoce.
- Emerson et al. (2016), *Longitudinal Study of the Emerging Functional Connectivity Asymmetry of Primary Language Regions during Infancy*, https://pmc.ncbi.nlm.nih.gov/articles/PMC5083015/ : évolution de l’organisation fonctionnelle des régions temporales et frontales pendant la petite enfance.
- Perani et al. (2011), *Neural language networks at birth*, https://doi.org/10.1073/pnas.1102991108 : activité du réseau auditif et langagier chez le nouveau-né. Une couleur précoce moins avancée ne signifie donc pas qu’un réseau est inactif.

La myélinisation, la connectivité, la croissance et la performance ne sont pas des mesures interchangeables. Elles ne sont pas fusionnées ici en un score scientifique global.

## Cervelet

Les deux surfaces cérébelleuses proviennent des labels FreeSurfer **7+8 à gauche et 46+47 à droite** (substance blanche et cortex réunis) du fichier adulte `fsaverage/mri/aseg.mgz`, distribué par [MNE testing data](https://github.com/mne-tools/mne-testing-data/blob/20cc221d737a37a6ee3a9c007e91bd69541fefe9/subjects/fsaverage/mri/aseg.mgz). Le script `tools/prepare-cerebellum.py` vérifie l’empreinte de l’entrée, applique un lissage gaussien de sigma 0,65 voxel, extrait la surface à 0,5 par marching cubes et utilise **vox2ras_tkr** pour l’aligner avec le cortex. Il oriente les triangles vers l’extérieur.

L’ensemble compte 32 694 sommets et 65 376 triangles. Les bornes RAS, offsets, labels et paramètres figurent dans `assets/cerebellum-source.json`. La géométrie n’est pas subdivisée en lobules mesurés. La couleur illustre une participation sensorimotrice précoce et un raffinement qui continue ensuite ; `cerebellumColourStage()` n’est pas une courbe ajustée à des mesures.

Repères : *Functional development of the human cerebellum from birth to age five* (2025), https://www.nature.com/articles/s41467-025-61465-y ; *Longitudinal development of the cerebellum in human infants during the first 800 days* (2023), https://pubmed.ncbi.nlm.nih.gov/36964904/.

## Carte « À cet âge »

`age-insights.js` contient dix regroupements pédagogiques : 0–3, 3–6 et 6–12 mois ; 1–2, 2–3, 3–5, 5–8, 8–12, 12–16 et 16–20 ans. Chaque carte donne deux exemples de fonctions ou d’apprentissages qui évoluent pendant cette période. Les textes dépendent de l’âge global sélectionné, sans être déduits des couleurs ou d’un scénario focal.

Ces plages sont **éditoriales**, pas des seuils biologiques ou des dates d’acquisition individuelle. Elles ne sont pas un outil de dépistage. Les expériences, l’environnement, les langues et l’enseignement contribuent aux apprentissages. Les repères sont des paraphrases générales, sans reprise de tableaux normatifs ni de scores :

- ASHA, *Communication Milestones*, https://www.asha.org/public/developmental-milestones/communication-milestones/ ; exemples pour [la naissance à un an](https://www.asha.org/public/developmental-milestones/communication-milestones-birth-to-1-year/) et [19–24 mois](https://www.asha.org/public/developmental-milestones/communication-milestones-19-to-24-months/). Les autres tranches ASHA jusqu’à cinq ans sont liées depuis cet index.
- NIMH, *The Teen Brain: 7 Things to Know*, https://www.nimh.nih.gov/health/publications/the-teen-brain-7-things-to-know : raffinement à l’adolescence, apprentissage, relations et planification. Le développement ne se termine pas à 20 ans.

## Mode épilepsie

Le ray casting choisit le sommet cortical le plus proche du triangle touché. Le cervelet n’est pas une cible corticale. Le menu est généré depuis le registre `epilepsy-effects.js` et conserve le foyer lors d’un changement d’effet :

1. **Diffusion violette** : zone qui s’étend pendant huit secondes, puis reste affichée après l’arrêt de l’animation à dix secondes. Relancer rejoue l’expansion.
2. **Activité locale rose** : zone avec deux anneaux et pulsation lente de quatre secondes, sans diffusion.
3. **Développement local hypothétique** : âge effectif illustratif diminué autour du foyer, selon un décalage choisi de 0 à 60 mois, borné à zéro. Les hachures et le contour ambrés identifient le scénario même à décalage nul.

Les distances sont des plus courts chemins sur les arêtes du maillage, dans le même hémisphère. Les rayons (96, 34 et 58 mm sur le gabarit adulte) sont des paramètres de lisibilité et non des étendues cliniques. Ces effets sont des illustrations géométriques sans connectome, conduction axonale, EEG, diagnostic ou prédiction de l’impact d’une crise sur le développement. Une propagation profonde, distante ou vers l’autre hémisphère n’est pas simulée.

La réduction des animations donne trois formes statiques distinctes. Les animations s’arrêtent lorsque l’aide s’ouvre ou que l’onglet est masqué. Référence conceptuelle : [ILAE, classification 2025](https://www.ilae.org/guidelines/definition-and-classification/updated-classification-of-epileptic-seizures-2025), https://doi.org/10.1111/epi.18338.

## Licences et vérification

L’atlas adapté reste sous **CC BY-NC-SA 4.0**, avec le texte complet dans `assets/ctdev-license.txt`. Le cervelet garde séparément la licence **FreeSurfer v1.0** dans `assets/freesurfer-license.txt`. Les sources, avis et modifications sont conservés dans `THIRD_PARTY_NOTICES.txt` et ne sont pas remplacés par la licence générale du code.

Les tests vérifient les maillages cérébelleux fermés et orientés, les identités anatomiques, les trajectoires auditives/langagières et dorsales des deux côtés, la couverture des 241 sélections mensuelles par la carte, la palette et les composants disjoints du cortex. Ils vérifient l’implémentation et ne constituent pas une validation clinique.

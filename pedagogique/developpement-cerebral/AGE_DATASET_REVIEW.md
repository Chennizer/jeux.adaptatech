# Catalogue de descriptions par âge

Recherche et vérification : **17 novembre 2026**. Les 32 descriptions de `data/age-descriptions.fr.json` sont des **synthèses françaises originales**, rédigées à partir des ressources ci-dessous. Ce catalogue n’est ni un jeu de mesures de maturation, ni une norme de capacités, ni une importation de données individuelles. Les âges scolaires et adolescents ont des fenêtres plus larges que la petite enfance.

## Le jeu ouvert trouvé

[childdevdata](https://d-score.org/childdevdata/) est un véritable jeu de données de développement, distribué sous **CC BY 4.0**. La version consultée réunit dix études, 10 831 enfants, 28 465 visites, 21 instruments et 1 116 061 évaluations d’items. Sa documentation précise les références et les conditions d’attribution propres aux études.

Ce sont des réponses à des items avec l’âge de passation, principalement de développement précoce. Ce n’est pas une bibliothèque de courts textes décrivant treize réseaux cérébraux de la naissance à vingt ans. Aucune ligne individuelle n’est téléchargée, reproduite ou utilisée pour calibrer les couleurs. Le catalogue de l’application ne doit donc pas être présenté comme provenant de ces microdonnées. La licence de childdevdata ne s’étend pas aux autres ressources examinées.

## Ressources effectivement synthétisées

| Ressource | Portée retenue | Nature et limite |
| --- | --- | --- |
| [CDC — Developmental Milestones](https://www.cdc.gov/act-early/milestones/) | Repères à 2, 4, 6, 9, 12, 15, 18, 24, 36, 48 et 60 mois | Listes de compétences qu’au moins 75 % des enfants réalisent **à** cet âge. Ce ne sont ni des dates de début ni des outils de dépistage validés. Les liens précis sont conservés dans le JSON. |
| [ASHA — Birth to 1 Year](https://www.asha.org/public/developmental-milestones/communication-milestones-birth-to-1-year/) | Réactions aux sons, orientation vers les voix, suivi visuel et prénom | Tranches de communication 0–3, 4–6 et 7–9 mois. Réagir à un son ne mesure pas l’acuité auditive. |
| [MedlinePlus / A.D.A.M — School-age development](https://medlineplus.gov/ency/article/002017.htm) | Motricité fine, consignes et complexité des phrases | Synthèse sur les 6–12 ans. Les sous-périodes 6–8 et 8–12 sont un choix d’affichage, sans preuve d’un seuil à huit ans. Les chiffres de durée d’attention ne sont pas repris. |
| [HHS / OPA — Cognitive Development](https://opa.hhs.gov/adolescent-health/adolescent-development-explained/cognitive-development) | Raisonnement abstrait et réflexion sur ses stratégies | Tendances fonctionnelles adolescentes, sans âge de bascule. Les explications neuronales simplifiées de cette page ne servent pas au modèle. |
| [NIMH — The Teen Brain](https://www.nimh.nih.gov/health/publications/the-teen-brain-7-things-to-know) | Transformation prolongée des régions préfrontales et planification | Synthèse adolescente et jeune adulte. Aucun âge universel de fin de maturation n’est retenu. |
| [Natu et al., 2021](https://doi.org/10.1038/s42003-021-02706-w) | Transformations microstructurelles précoces des cortex sensoriels | Étude d’imagerie des six premiers mois, déjà présente parmi les études de l’application. Ni acuité sensorielle ni performance mesurée par ces textes. |
| [Harvard — guide 5–7 ans](https://developingchild.harvard.edu/wp-content/uploads/2024/10/Executive-Function-Activities-for-5-to-7-year-olds.pdf) | Jeux exerçant mémoire de travail, inhibition et changement de règle | **Pistes de pratique**, explicitement nommées ainsi. Aucune norme d’acquisition, aucun effet mesuré attribué à ces exemples. |
| [Harvard — guide adolescents](https://developingchild.harvard.edu/wp-content/uploads/2024/10/Activities-for-Adolescents.pdf) | Objectifs, étapes et révision d’un plan | Activités proposées aux adolescents. La fenêtre locale 12–18 ans est éditoriale ; le document ne fixe pas ces seuils. |

## Règles de sélection et d’affichage

- `fromMonths` est inclusif, `toMonths` exclusif. Ce sont des fenêtres **éditoriales d’affichage**, pas des intervalles biologiques ni une disparition de compétence. `241` inclut la position finale de vingt ans.
- `sourceAge.byMonths` conserve l’âge d’une liste CDC. `sourceAge.rangeMonths` conserve une tranche explicitement donnée par la source. Un libellé « adolescence » reste non chiffré lorsque la source ne définit pas d’âge précis.
- `automatic: true` définit seize textes successifs sans trou ni chevauchement, pour les 241 positions mensuelles. Le rythme des changements est plus serré dans les deux premières années.
- Le menu conserve les treize identifiants de `PROFILE_DOMAINS`. Il sélectionne le premier texte du catalogue qui correspond au domaine et à sa fenêtre : le récit automatique a priorité lorsqu’il traite déjà ce domaine, puis viennent les textes complémentaires. Il n’y a pas de carrousel temporisé pendant une pause.
- En cas de manque pour une catégorie, le texte précédent disparaît et un message discret explique cette absence. On n’interpole pas un jalon manquant. En particulier, la couverture des modalités sensorielles est précoce ; son absence ultérieure ne signifie pas un développement achevé.
- Le contenu suit exclusivement l’âge chronologique et la catégorie choisie. Les déficits illustratifs ne changent ni le texte, ni son âge source, ni sa sélection.
- Les mentions de réseaux sont de larges **associations pédagogiques éditoriales**. Elles ne proviennent pas d’une localisation cérébrale démontrée par les listes CDC/ASHA et ne pointent pas vers une parcelle précise du maillage. Elles ne calibrent pas les couleurs.
- Les deux vues gardent la même taille et la même position, que les Repères soient ouverts ou fermés. Sur grand écran suffisamment haut, la description se place sous la vue fixe ; sur les autres formats, elle remplace temporairement le titre en haut à gauche, sans réduire les cerveaux. L’encart compact défile si nécessaire. L’affichage Repères est masqué par défaut ; le volet Profils et les Repères sont mutuellement exclusifs pour limiter l’encombrement. Fermer conserve la catégorie choisie ; la remise à zéro générale revient à Automatique.

## Réutilisation et maintenance

Les textes locaux sont des paraphrases factuelles courtes et originales ; aucun tableau ou texte intégral des organismes n’est reproduit. Ils suivent la licence du code du dépôt (`Unlicense`). Les pages sources et guides restent soumis à leurs propres droits : ASHA, A.D.A.M et Harvard notamment ne deviennent pas des données ouvertes par le simple fait d’être cités. Les liens permettent de consulter l’original. Le JSON garde une date de revue et une provenance explicite.

Pour enrichir une catégorie, ajouter une entrée avec sa source vérifiée et la nature de la preuve. Éviter de combler systématiquement tous les âges avec des descriptions inventées. Exécuter `node --test pedagogique/developpement-cerebral/tests/*.test.mjs` : les tests contrôlent la provenance, les catégories, la couverture automatique et les limites d’entrée/sortie des fenêtres. La recherche de microdonnées est distincte de cette bibliothèque pédagogique ; un futur ajustement quantitatif demanderait un autre travail de validation.

# Activités vidéo
Application HTML/CSS/JavaScript sans dépendance ni compte, pour le video modeling et le video prompting.

## Utilisation
Créer une activité, importer ou filmer des vidéos, modifier les titres et l’ordre avec Avant / Après, puis choisir Vidéo puis image, Vidéo répétable ou Galerie.
Le bouton Réglages regroupe le choix et la création des activités ainsi que le mode élève. Toucher une carte en création pour modifier son titre, remplacer sa vidéo, la déplacer ou la supprimer. Les grilles occupent la hauteur disponible sans défilement ; les flèches de pagination donnent accès aux vidéos supplémentaires, en création comme en galerie élève. Le nombre de cartes par page s’adapte à la taille de l’écran.
Cette page n’est pas référencée depuis les portails du site pour le moment et ne comporte pas de lien de retour vers le portail pédagogique.
La grille utilise la surface disponible selon le nombre de vidéos : une seule grande carte, deux cartes côte à côte ou empilées selon l’écran, quatre cartes en grille, etc. La pagination ne sert que lorsque les cartes deviendraient trop petites.

Le mode Séquence présente une seule carte à la fois. L’élève doit la toucher pour lancer la vidéo ; pendant la lecture, aucune commande ne permet de passer à la suivante. À la fin, seule la carte suivante apparaît et attend un nouvel appui. Après la dernière vidéo, « Terminé » s’affiche.

En Mode intervenant, glisser une carte sur une autre pour modifier l’ordre à la souris ou au tactile. Un simple appui ouvre ses commandes : Avant / Après ou Placer à… permettent aussi de choisir sa position, y compris sur une autre page. L’ordre est sauvegardé automatiquement et utilisé par les séquences.
En Mode élève, la vidéo occupe toute la fenêtre et demande le plein écran du navigateur lorsque disponible. Les proportions sont conservées. Si Safari refuse le plein écran, la lecture continue dans toute la fenêtre.
Le plein écran est demandé dès l’appui sur Mode élève, y compris pour la galerie et la séquence avant le choix de la première vidéo.
Maintenir le coin supérieur gauche pendant 3 secondes pour revenir au mode intervenant. Au clavier, placer le focus sur ce coin et maintenir Espace ou Entrée.

## Stockage
Activités, vidéos et vignettes sont conservées dans IndexedDB sur l’appareil. Utiliser le même navigateur et la même adresse. Supprimer les données du site efface les activités ; la navigation privée peut ne pas les conserver. Les erreurs de quota et de format sont signalées. Aucun média n’est téléversé et aucun suivi analytique n’est ajouté.
Servir le dossier en HTTPS ou sur localhost. Le service worker ne gère que ce sous-dossier et son propre cache.

## Vérification
Depuis ce dossier : `node --test tests/video-fullscreen.test.cjs`.
Avant utilisation en classe sur iPad réel : importer et filmer un MP4, tester les trois modes, les appuis rapides et la sortie prolongée, puis recharger et vérifier titres, ordre et vidéos. Tester également les refus de lecture automatique et les erreurs de stockage.

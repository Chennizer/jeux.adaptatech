# Activités vidéo
Application HTML/CSS/JavaScript sans dépendance ni compte, pour le video modeling et le video prompting.

## Utilisation
Créer une activité, importer ou filmer des vidéos, modifier les titres et l’ordre avec Avant / Après, puis choisir Vidéo puis image, Vidéo répétable ou Galerie.
En Mode élève, la vidéo occupe toute la fenêtre et demande le plein écran du navigateur lorsque disponible. Les proportions sont conservées. Si Safari refuse le plein écran, la lecture continue dans toute la fenêtre.
Maintenir le coin supérieur gauche pendant 3 secondes pour revenir au mode intervenant. Au clavier, placer le focus sur ce coin et maintenir Espace ou Entrée.

## Stockage
Activités, vidéos et vignettes sont conservées dans IndexedDB sur l’appareil. Utiliser le même navigateur et la même adresse. Supprimer les données du site efface les activités ; la navigation privée peut ne pas les conserver. Les erreurs de quota et de format sont signalées. Aucun média n’est téléversé et aucun suivi analytique n’est ajouté.
Servir le dossier en HTTPS ou sur localhost. Le service worker ne gère que ce sous-dossier et son propre cache.

## Vérification
Depuis ce dossier : `node --test tests/video-fullscreen.test.cjs`.
Avant utilisation en classe sur iPad réel : importer et filmer un MP4, tester les trois modes, les appuis rapides et la sortie prolongée, puis recharger et vérifier titres, ordre et vidéos. Tester également les refus de lecture automatique et les erreurs de stockage.

(function (global) {
  'use strict';

  const gamesConfig = [
    {
      id: 'puzzle',
      label: 'Casse-tête',
      file: 'puzzle.html',
      options: [
        {
          type: 'select',
          label: 'Taille du casse-tête:',
          name: 'puzzleDimension',
          options: [
            { value: '2x2', text: '2×2' },
            { value: '3x3', text: '3×3' },
            { value: '4x4', text: '4×4' }
          ]
        },
        {
          type: 'checkbox',
          label: 'Indicateur de contour:',
          name: 'puzzleEasy'
        }
      ]
    },
    {
      id: 'completeword',
      label: 'Compléter le mot',
      file: 'completeword.html',
      options: [
        {
          type: 'checkbox',
          label: 'Modèle de lettres:',
          name: 'showModelLetters',
          defaultChecked: true
        },
        {
          type: 'number',
          label: 'Nombre de mots:',
          name: 'testtoupieWordCount',
          min: 1,
          max: 10,
          value: 1
        }
      ]
    },
    {
      id: 'matchnumber',
      label: 'Additions',
      file: 'matchnumber.html',
      options: [
        {
          type: 'select',
          label: 'Nouvelle tentative après une erreur :',
          name: 'wrongAnswerRetry',
          options: [
            { value: 'true', text: 'Oui' },
            { value: 'false', text: 'Non' }
          ]
        },
        {
          type: 'number',
          label: 'Répétitions de l’activité :',
          name: 'activityRepetitions',
          min: 1,
          max: 10,
          value: 1
        },
        {
          type: 'number',
          label: 'Terme maximal :',
          name: 'maxAddend',
          min: 2,
          max: 10,
          value: 5
        },
        {
          type: 'checkbox',
          label: 'Afficher le cadre de dix:',
          name: 'showTenFrame'
        }
      ]
    },
    {
      id: 'cartes-memoire',
      label: 'Cartes mémoire',
      file: 'Cartes mémoire.html',
      options: [
        {
          type: 'number',
          label: 'Nombre de paires :',
          name: 'paires',
          min: 1,
          max: 10,
          value: 3
        }
      ]
    },
    {
      id: 'denombrer',
      label: 'Dénombrer',
      file: 'Dénombrer.html',
      options: [
        {
          type: 'select',
          label: 'Difficulté:',
          name: 'difficulty',
          options: [
            { value: 'easy', text: '1 à 3' },
            { value: 'medium', text: '1 à 5' },
            { value: 'hard', text: '1 à 10' }
          ]
        },
        {
          type: 'number',
          label: 'Répétitions:',
          name: 'activityRepetitions',
          min: 1,
          max: 10,
          value: 1
        }
      ]
    },
    {
      id: 'imagedecouverte',
      label: "Découvrir l'image",
      file: 'imagedecouverte.html',
      options: [
        {
          type: 'select',
          label: 'Difficulté :',
          name: 'difficulty',
          options: [
            { value: 'easy', text: 'Débutant' },
            { value: 'medium', text: 'Intermédiaire' },
            { value: 'hard', text: 'Difficile' }
          ]
        }
      ]
    },
    {
      id: 'suivre-le-chemin',
      label: 'Suivre le chemin',
      file: 'Suivre le chemin.html',
      options: [
        {
          type: 'select',
          label: 'Largeur du tracé:',
          name: 'Largeur du tracé',
          options: [
            { value: 'easy', text: 'Large' },
            { value: 'medium', text: 'Moyen' },
            { value: 'hard', text: 'Étroit' }
          ]
        },
        {
          type: 'checkbox',
          label: 'Mode difficile (retour au début en cas de déviation):',
          name: 'Hard mode'
        },
        {
          type: 'number',
          label: 'Nombre de répétitions:',
          name: 'activityRepetitions',
          min: 1,
          max: 10,
          value: 1
        }
      ]
    },
    {
      id: 'tri-thematique',
      label: 'Classer les pictogrammes',
      file: 'tri-thematique.html',
      options: [
        {
          type: 'select',
          label: 'Nombre de catégories:',
          name: 'categoryCount',
          options: [
            { value: '2', text: '2' },
            { value: '3', text: '3' },
            { value: '4', text: '4' }
          ],
          value: '3'
        },
        {
          type: 'number',
          label: 'Nombre d’items:',
          name: 'itemCount',
          min: 3,
          max: 12,
          value: 6
        }
      ]
    },
    {
      id: 'mot-vers-image',
      label: 'Lecture globale',
      file: 'mot-vers-image.html',
      options: [
        {
          type: 'number',
          label: 'Nombre d’épreuves:',
          name: 'roundCount',
          min: 1,
          max: 10,
          value: 4
        },
        {
          type: 'select',
          label: 'Nombre de choix:',
          name: 'choiceCount',
          options: [
            { value: '2', text: '2' },
            { value: '3', text: '3' },
            { value: '4', text: '4' }
          ],
          value: '3'
        }
      ]
    },
    {
      id: 'taille',
      label: 'Comparer les tailles',
      file: 'taille.html',
      options: [
        {
          type: 'number',
          label: 'Nombre d’épreuves:',
          name: 'roundCount',
          min: 1,
          max: 10,
          value: 3
        }
      ]
    },
    {
      id: 'shadow-match',
      label: 'Associer aux ombres',
      file: 'shadow-match.html',
      options: [
        {
          type: 'number',
          label: 'Nombre d’ombres:',
          name: 'pairCount',
          min: 2,
          max: 6,
          value: 3
        }
      ]
    },
    {
      id: 'identical-match',
      label: 'Images identiques',
      file: 'identical-match.html',
      options: [
        {
          type: 'number',
          label: 'Nombre d’épreuves:',
          name: 'roundCount',
          min: 1,
          max: 10,
          value: 4
        },
        {
          type: 'number',
          label: 'Nombre de choix:',
          name: 'choiceCount',
          min: 2,
          max: 5,
          value: 3
        }
      ]
    }
  ];

  global.gamesConfig = gamesConfig;
})(window);

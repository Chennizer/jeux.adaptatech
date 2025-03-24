const mediaChoices = [
  {
    name: "Taylor Swift - Shake it off",
    image: "../../images/taylorswift.jpg",
    video: "https://bucket.adaptatech.org/tsshakeitoff.mp4",
    audio: "../../sounds/taylorswift.mp3",
    category: "pop"
  },
  {
    name: "Moana - Le bleu lumière",
    image: "../../images/moana-background.jpg",
    video: "https://bucket.adaptatech.org/moana-le-bleu-lumiere.mp4",
    audio: "../../sounds/moana.mp3",
    category: "disney"
  },
  {
    name: "Titouni - Les couleurs",
    image: "../../images/titounis.jpg",
    video: "https://bucket.adaptatech.org/titouni-lescouleurs.mp4",
    audio: "../../sounds/titouni.mp3",
    category: "enfant"
  },
  {
    name: "Arthur l'aventurier - Les oiseaux",
    image: "../../images/arthur.jpg",
    video: "https://bucket.adaptatech.org/arthur-oiseaux.mp4",
    category: "enfant"
  },
  {
    name: "Rick Astley - Never gonna give you up",
    image: "../../images/rickrolled.jpg",
    video: "https://bucket.adaptatech.org/rickrolled.mp4",
    category: "pop"
  },
  {
    name: "Lady Gaga - Bad Romance",
    image: "../../images/ladygaga.jpg",
    video: "https://bucket.adaptatech.org/ladygagabadromance.mp4",
    category: "pop"
  },
  {
    name: "Ariane Grande - Problems",
    image: "../../images/arianagrande.webp", 
    video: "https://bucket.adaptatech.org/arianagrandeproblems.mp4",
    category: "pop"
  },
  {
    name: "Lady Gaga - Poker Face",
    image: "../../images/ladygagapokerface.webp", 
    video: "https://bucket.adaptatech.org/ladygagapokerface.mp4",
    category: "pop"
  },
  {
    name: "La belle et la bête - Belle",
    image: "../../images/belleetbete.jpg",
    video: "https://bucket.adaptatech.org/belleetbete-belle.mp4",
    category: "disney"
  },
  {
    name: "Kids United - On écrit sur les murs",
    image: "../../images/kidsunited.jpg",
    video: "https://bucket.adaptatech.org/kidsunited-on-ecrit.mp4",
    category: "enfant"

  },
  {
    name: "Comptine africaine - Tape des mains",
    image: "../../images/ca.jpg",
    video: "https://bucket.adaptatech.org/ca-tape-des-mains.mp4",
    category: "enfant"
  },
  {
    name: "La reine des neiges - Libérée, délivrée",
    image: "../../images/frozen.jpg",
    video: "https://bucket.adaptatech.org/frozen-libéréedélivrée.mp4",
    category: "disney"
  },
  {
    name: "Encanto - Ne parlons pas de Bruno",
    image: "../../images/encanto.jpg",
    video: "https://bucket.adaptatech.org/encanto-ne-parlons-pas-de-bruno.mp4",
    category: "disney"
  },
  {
    name: "Passe Partout - Introduction",
    image: "../../images/passe-partout-control-panel.webp",
    video: "https://bucket.adaptatech.org/passe-partout-intro.mp4",
    category: "enfant"
  },
  {
    name: "Roi Lion - Histoire de la vie",
    image: "../../images/roi-lion.jpg",
    video: "https://bucket.adaptatech.org/roi-lion-histoire-de-la-vie.mp4",
    category: "disney"
  },
  {
    name: "TFO - bonjour",
    image: "../../images/tfo-saisons.jpg",
    video: "https://bucket.adaptatech.org/tfo-bonjour.mp4",
    category: ["enfant","bonjour"]
  },
  {
    name: "Kendrick Lamar - All the stars",
    image: "../../images/kendricklamar.webp",
    video: "https://bucket.adaptatech.org/kendricklamar-allthestars.mp4",
    category: "hip hop"
  },
  {
    name: "Post Malone - Sunflower",
    image: "../../images/postmalone-sunflower.jpg",
    video: "https://bucket.adaptatech.org/postmalone-sunflower.mp4",
    category: "hip hop"
  },
  {
    name: "Eminem - Lose Yourself",
    image: "../../images/eminem-loseyourself.webp",
    video: "https://bucket.adaptatech.org/eminem-loseyourself.mp4",
    category: "hip hop"
  },
  {
    name: "Wu Tang Clan - The mystery of chessboxin",
    image: "../../images/wutangclan.jpg",
    video: "https://bucket.adaptatech.org/wutang-chessboxin.mp4",
    category: "hip hop"
  },
  {
    name: "Macklemore - Thrift Shop",
    image: "../../images/macklemore-thriftshop.jpg",
    video: "https://bucket.adaptatech.org/macklemore-thriftshop.mp4",
    category: "hip hop"
  },
  {
    name: "Sum 41 - Landmines",
    image: "../../images/sum41.jpg",
    video: "https://bucket.adaptatech.org/sum41-landmines.mp4",
    category: "rock"
  },
  {
    name: "Enfantastiques - Dire bonjour c'est joli",
    image: "../../images/enfantastiques.jpg",
    video: "https://bucket.adaptatech.org/lesenfantastiques-direbonjourcestjoli.mp4",
    category: ["enfant","bonjour"]
  },
  {
    name: "Jérémy et Jazzy - Bonjour",
    image: "../../images/jeremyetjazzy.webp",
    video: "https://bucket.adaptatech.org/jeremyetjazzy-bonjour.mp4",
    category: ["enfant","bonjour"]
  },
  {
    name: "Green Day - Basketcase",
    image: "../../images/greenday-basketcase.jpg",
    video: "https://bucket.adaptatech.org/greenday-basketcase.mp4",
    category: "rock"
  },
  {
    name: "Cage The Elephant - Come a little closer",
    image: "../../images/cagetheelephant-comealittlecloser.jpg",
    video: "https://bucket.adaptatech.org/cagetheelephant-comealittlecloser.mp4",
    category: "rock"
  },
  {
    name: "Linkin Park - In the end",
    image: "../../images/linkinpark.webp",
    video: "https://bucket.adaptatech.org/linkinpark-intheend.mp4",
    category: "rock"
  },
  {
    name: "Alain le Lait - Bonjour",
    image: "../../images/alainlelait-bonjour.jpg",
    video: "https://bucket.adaptatech.org/alainlelait-bonjour.mp4",
    category: ["enfant","bonjour"]
  },
  {
    name: "Déménageurs - Bonjour",
    image: "../../images/demenageurs-bonjour.jpg",
    video: "https://bucket.adaptatech.org/demenageurs-bonjour.mp4",
    category: ["enfant","bonjour"]
  },
  {
    name: "All American Rejects - Dirty Little Secret",
    image: "../../images/allamericanrejects-dirtylittlesecret.jpg",   
    video: "https://bucket.adaptatech.org/allamericanrejects-dirtylittlesecret.mp4",
    category: ["rock"]
  },
  {
    name: "Statique (faux choix)",
    image: "../../images/statique.jpeg",   
    video: "https://bucket.adaptatech.org/whitenoise.mp4",
    category: ["rock"]
  },



];

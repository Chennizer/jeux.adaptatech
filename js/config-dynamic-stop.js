window.dynamicStopActionConfig = {
  pauseSoundSrc: '../../sounds/piano.mp3',
  defaultPauseSound: true,
  actionPrompts: {
    jump: {
      image: '../../images/gaminganimation/jump.png',
      text: {
        en: 'Jump',
        fr: 'Saute',
        ja: 'ジャンプ'
      }
    },
    dodge: {
      image: '../../images/gaminganimation/dodge.png',
      text: {
        en: 'Dodge',
        fr: 'Esquive',
        ja: 'よける'
      }
    },
    crouch: {
      image: '../../images/gaminganimation/crouch.png',
      text: {
        en: 'Crouch',
        fr: 'Accroupis-toi',
        ja: 'しゃがむ'
      }
    },
    kick: {
      image: '../../images/gaminganimation/kick.png',
      text: {
        en: 'Kick',
        fr: 'Coup de pied',
        ja: 'キック'
      }
    }
  },
  pauseEvents: [
    { time: 5.0, action: 'jump' },
    { time: 10.0, action: 'dodge' },
    { time: 15.0, action: 'crouch' },
    { time: 20.2, action: 'jump' },
    { time: 25.5, action: 'crouch' },
    { time: 30.4, action: 'kick' },
    { time: 36.3, action: 'jump' }
  ]
};

(function(){
  const baseStyles = `
    .switch-info-button{position:fixed;bottom:12px;left:12px;z-index:99999;padding:0.55rem 0.9rem;border-radius:12px;border:2px solid #0ea5e9;background:rgba(5,10,25,0.8);color:#e0f2fe;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,0.35);backdrop-filter:blur(4px);} 
    .switch-info-button:hover{background:rgba(14,165,233,0.2);} 
    .switch-info-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:1rem;z-index:99998;background:rgba(0,0,0,0.6);} 
    .switch-info-modal.open{display:flex;} 
    .switch-info-card{background:#0b1220;color:#e5e7eb;max-width:640px;width:100%;border-radius:16px;padding:1rem 1.25rem;box-shadow:0 12px 40px rgba(0,0,0,0.4);line-height:1.55;font-size:0.95rem;} 
    .switch-info-card h3{margin:0 0 .35rem 0;font-size:1.05rem;color:#7dd3fc;} 
    .switch-info-card p{margin:0.4rem 0;} 
    .switch-info-close{margin-top:0.75rem;display:inline-block;padding:0.45rem 0.9rem;border-radius:10px;border:none;background:#0ea5e9;color:#0b1220;font-weight:700;cursor:pointer;} 
  `;

  const infoPresets = {
    causeEffect: {
      fr: "Compétence : appui simple cause → effet.<br>SENICT : niveau 1.<br>Switch Progression Roadmap : niveaux 8 à 10.<br>Jiao Switch Heroes : missions cause-effet (appuyer pour déclencher).",
      en: "Skill: single-press cause → effect.<br>SENICT: level 1.<br>Switch Progression Roadmap: levels 8–10.<br>Jiao Switch Heroes: cause-and-effect quests (press to trigger)."
    },
    pressHold: {
      fr: "Compétence : appuyer et maintenir pour faire durer l'effet.<br>SENICT : niveau 2.<br>Switch Progression Roadmap : niveaux 11 à 13.<br>Jiao Switch Heroes : maintenir l'appui pour activer et doser l'effet.",
      en: "Skill: press and hold to sustain the effect.<br>SENICT: level 2.<br>Switch Progression Roadmap: levels 11–13.<br>Jiao Switch Heroes: hold-to-activate missions (sustained press)."
    },
    repeatedShort: {
      fr: "Compétence : appuis répétés courts pour déclencher une action (comptage).<br>SENICT : niveau 3.<br>Switch Progression Roadmap : niveaux 13 à 15.<br>Jiao Switch Heroes : séries d'appuis ciblés pour atteindre un seuil.",
      en: "Skill: short repeated presses to trigger an action (counting).<br>SENICT: level 3.<br>Switch Progression Roadmap: levels 13–15.<br>Jiao Switch Heroes: targeted press series to reach a threshold."
    },
    repeatedLong: {
      fr: "Compétence : appuyer plusieurs fois pour faire progresser une séquence jusqu'au résultat final.<br>SENICT : niveau 4.<br>Switch Progression Roadmap : niveaux 17 à 18.<br>Jiao Switch Heroes : construction progressive par appuis répétés (progression multi-étapes).",
      en: "Skill: press repeatedly to advance a sequence to completion.<br>SENICT: level 4.<br>Switch Progression Roadmap: levels 17–18.<br>Jiao Switch Heroes: progressive builds through repeated presses (multi-step progression)."
    },
    dualSwitch: {
      fr: "Compétence : différencier deux actions de switch et gérer l'appui prolongé.<br>SENICT : niveaux 2 et 6.<br>Switch Progression Roadmap : niveaux 11–13 et 20.<br>Jiao Switch Heroes : missions à deux fonctions (tenir/relâcher) avec choix de switch.",
      en: "Skill: differentiate two switch actions and manage press-and-hold.<br>SENICT: levels 2 and 6.<br>Switch Progression Roadmap: levels 11–13 and 20.<br>Jiao Switch Heroes: dual-function quests (hold/release) with switch choice."
    },
    timedPress: {
      fr: "Compétence : appuyer au bon moment sur un stimulus indicateur (timing).<br>SENICT : niveau 3 (appuis séquencés avec attente).<br>Switch Progression Roadmap : niveaux 13 à 15.<br>Jiao Switch Heroes : missions de timing sur stimulus visuel/audio (réaction).",
      en: "Skill: press at the indicated moment (timing task).<br>SENICT: level 3 (sequenced presses with waiting).<br>Switch Progression Roadmap: levels 13–15.<br>Jiao Switch Heroes: timing missions on visual/audio prompts (reaction)."
    }
  };

  const gameInfo = {
    cloud: infoPresets.causeEffect,
    cloudauto: infoPresets.causeEffect,
    colorcycle: infoPresets.causeEffect,
    storm: infoPresets.causeEffect,
    londonrain: infoPresets.causeEffect,
    rainbow: infoPresets.causeEffect,
    fireflies: infoPresets.causeEffect,
    bubbles: infoPresets.causeEffect,
    sadness: infoPresets.causeEffect,
    kpop: infoPresets.causeEffect,
    seasons: infoPresets.causeEffect,
    zenitude: infoPresets.causeEffect,
    sun: infoPresets.causeEffect,
    sunauto: infoPresets.repeatedLong,
    weatherauto: infoPresets.repeatedLong,
    stormauto: infoPresets.repeatedLong,
    snow: infoPresets.repeatedLong,
    snowauto: infoPresets.repeatedLong,
    shapes: infoPresets.causeEffect,
    storybook: infoPresets.causeEffect,
    DK2: infoPresets.causeEffect,
    vortex: infoPresets.pressHold,
    window: infoPresets.repeatedLong,
    coloredtrace: infoPresets.pressHold,
    FTL: infoPresets.dualSwitch,
    bees: infoPresets.repeatedLong,
    plant: infoPresets.repeatedLong,
    rocket: infoPresets.repeatedShort,
    easter: infoPresets.pressHold,
    qwen3maxtest: infoPresets.timedPress,
    promenade: infoPresets.causeEffect,
    xylophone: infoPresets.causeEffect,
    imagereveal: infoPresets.causeEffect,
    mario: infoPresets.timedPress,
    samurai-rpg: infoPresets.causeEffect,
    gaming: infoPresets.causeEffect
  };

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const slug = pathParts[pathParts.length - 2] || 'gaming';
  const info = gameInfo[slug];
  if(!info) return;

  const head = document.head || document.getElementsByTagName('head')[0];
  if(head && !document.getElementById('switch-info-style')){
    const style = document.createElement('style');
    style.id = 'switch-info-style';
    style.textContent = baseStyles;
    head.appendChild(style);
  }

  const button = document.createElement('button');
  button.className = 'switch-info-button translate';
  button.textContent = 'ℹ️ Info';
  button.setAttribute('data-fr','ℹ️ Info');
  button.setAttribute('data-en','ℹ️ Info');
  button.setAttribute('type','button');

  const modal = document.createElement('div');
  modal.className = 'switch-info-modal';

  const card = document.createElement('div');
  card.className = 'switch-info-card';
  const title = document.createElement('h3');
  title.className = 'translate';
  title.setAttribute('data-fr','Repères de progression du switch');
  title.setAttribute('data-en','Switch progression references');
  title.textContent = 'Repères de progression du switch';

  const p = document.createElement('p');
  p.className = 'translate';
  p.setAttribute('data-fr', info.fr);
  p.setAttribute('data-en', info.en);
  p.innerHTML = info.fr;

  const close = document.createElement('button');
  close.className = 'switch-info-close translate';
  close.setAttribute('data-fr','Fermer');
  close.setAttribute('data-en','Close');
  close.type = 'button';
  close.textContent = 'Fermer';

  card.appendChild(title);
  card.appendChild(p);
  card.appendChild(close);
  modal.appendChild(card);
  document.body.appendChild(button);
  document.body.appendChild(modal);

  const toggle = (state) => { modal.classList[state ? 'add' : 'remove']('open'); };
  button.addEventListener('click', ()=>toggle(true));
  close.addEventListener('click', ()=>toggle(false));
  modal.addEventListener('click', (e)=>{ if(e.target === modal) toggle(false); });
})();

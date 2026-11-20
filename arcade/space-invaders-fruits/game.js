import { ONLINE_WORLD } from '../space-adventure-coop/protocol.js';

(() => {
  const online = window.spaceAdventureOnline;
  const controlPanel = document.getElementById('control-panel');
  const startButton = document.getElementById('control-panel-start-button');
  const gameContainer = document.getElementById('game-container');
  const hud = document.getElementById('hud');
  const gameOverScreen = document.getElementById('game-over');
  const restartButton = document.getElementById('continue-button');
  const retryHint = document.getElementById('retry-hint');
  const retryEyegazeTiles = document.getElementById('retry-eyegaze-tiles');
  const retryEyegazeTile = document.getElementById('retry-eyegaze-tile');
  const retryEyegazeFill = document.getElementById('retry-eyegaze-fill');
  const retryEyegazeLabel = document.getElementById('retry-eyegaze-label');
  const registerEyegazeTile = document.getElementById('register-eyegaze-tile');
  const registerEyegazeFill = document.getElementById('register-eyegaze-fill');
  const registerEyegazeLabel = document.getElementById('register-eyegaze-label');
  const music = document.getElementById('bg-music');
  const menuMusic = document.getElementById('menu-music');
  const languageToggleButton = document.getElementById('language-toggle');
  const assetLoadStatus = document.getElementById('asset-load-status');

  const scoreNode = document.getElementById('hud-score');
  const livesNode = document.getElementById('hud-lives');
  const gameOverScore = document.getElementById('game-over-score');
  const ammoMeter = document.getElementById('ammo-meter');
  const ammoMeterFill = document.getElementById('ammo-meter-fill');
  const ammoMeterRight = document.getElementById('ammo-meter-right');
  const ammoMeterFillRight = document.getElementById('ammo-meter-fill-right');
  const scoreRegisterPanel = document.getElementById('score-register-panel');
  const scoreUiLayout = document.getElementById('score-ui-layout');
  const scoreRegisterQuestion = document.getElementById('score-register-question');
  const scorePlayerNameLabel = document.getElementById('score-player-name-label');
  const scorePlayerNameInput = document.getElementById('score-player-name');
  const scoreSubmitButton = document.getElementById('score-submit');
  const scoreRetryButton = document.getElementById('score-retry');
  const scoreSubmitFill = document.getElementById('score-submit-fill');
  const scoreRetryFill = document.getElementById('score-retry-fill');
  const scoreRegisterStatus = document.getElementById('score-register-status');
  const leaderboardPanel = document.getElementById('leaderboard-panel');
  const leaderboardTitle = document.getElementById('leaderboard-title');
  const leaderboardList = document.getElementById('leaderboard-list');

  const shipCards = Array.from(document.querySelectorAll('.ship-card'));
  const shipSelectTitle = document.getElementById('ship-select-title');

  const shipSelectStarsCanvas = document.getElementById('ship-select-stars');
  const shipSelectStarsCtx = shipSelectStarsCanvas.getContext('2d');
  const menuStars = [];
  const MENU_STAR_COUNT = 90;
  let menuStarsLastTs = 0;
  let menuStarsRafId = null;

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const { width: arenaWidth, height: arenaHeight } = ONLINE_WORLD;

  const enemySprites = [];
  const enemyImagePaths = [
    '../../images/spaceadventure/enemy1.png',
    '../../images/spaceadventure/enemy2.png',
    '../../images/spaceadventure/enemy3.png',
    '../../images/spaceadventure/enemy4.png',
    '../../images/spaceadventure/enemy5.png',
    '../../images/spaceadventure/enemy6.png'
  ];

  const playerSprite = new Image();
  const bluePlayerSprite = new Image();
  const redPlayerSprite = new Image();
  const playerSprites = {
    blue: '../../images/spaceadventure/blueship.png',
    red: '../../images/spaceadventure/redship.png'
  };

  const shipProfiles = {
    blue: {
      speed: 4,
      shields: 9,
      trait: {
        fr: 'PLUS FORT CONTRE LES GROS VAISSEAUX',
        en: 'STRONGER AGAINST BIGGER SHIPS',
        ja: '大型の敵に強い'
      },
      name: {
        fr: 'GUARDIAN SWITCH',
        en: 'GUARDIAN SWITCH',
        ja: 'ガーディアン・スイッチ'
      },
      tag: {
        fr: 'CHÂSSIS DE VAISSEAU DÉFENSIF',
        en: 'DEFENSIVE SHIP FRAME',
        ja: '防御型シップフレーム'
      },
      themeSong: '../../songs/space/spacearcade1.mp3'
    },
    red: {
      speed: 9,
      shields: 3,
      trait: {
        fr: 'PLUS FORT CONTRE LES PETITS VAISSEAUX',
        en: 'STRONGER AGAINST SMALLER SHIPS',
        ja: '小型の敵に強い'
      },
      name: {
        fr: 'CRIMSON GAZE',
        en: 'CRIMSON GAZE',
        ja: 'クリムゾン・ゲイズ'
      },
      tag: {
        fr: 'CHÂSSIS DE VAISSEAU D’ASSAUT',
        en: 'ASSAULT SHIP FRAME',
        ja: 'アサルトシップフレーム'
      },
      themeSong: '../../songs/space/spacearcade2.mp3'
    }
  };

  const heavyEnemySprite = new Image();
  heavyEnemySprite.src = '../../images/spaceadventure/enemy1.png';

  const musicPlaylist = [
    '../../songs/space/spacearcade1.mp3',
    '../../songs/space/spacearcade2.mp3'
  ];
  const menuBaseMusicPath = '../../songs/space/spacequest1.mp3';
  const BG_MUSIC_VOLUME = 0.5;
  const MENU_MUSIC_VOLUME = 0.28;
  const SCORE_API_BASE = 'https://score-api-2.gui98789.workers.dev';
  const SCORE_TOP_LIMIT = 5;
  const SCORE_GAMES = {
    switch: 'space-adventure-switch',
    switch2p: 'space-adventure-switch-2players',
    eyegaze: 'space-adventure-eyegaze'
  };

  let selectedShip = 'blue';
  let inputMode = 'switch';
  let difficulty = 'normal';
  let running = false;
  let assetsReady = false;
  let menuMusicStarted = false;
  let rafId = null;
  let score = 0;
  let lives = 3;
  let enemySpawnTimer = 0;
  let currentSpawnDelay = 10000;
  let lastTs = 0;
  let motionTime = 0;
  let ammoEnergy = 1;
  const ammoEnergyByShip = { blue: 1, red: 1 };
  let gazeX = window.innerWidth * 0.5;
  let gazeY = window.innerHeight * 0.5;
  let hoveredEnemyId = null;
  let hoverStartAt = 0;
  let shieldFlashUntil = 0;
  let shieldFlashStartedAt = 0;
  let projectileFlashUntil = 0;
  let retryHoverStartAt = 0;
  let registerHoverStartAt = 0;
  let retryRafId = null;
  let scoreRafId = null;
  let musicStartTimeoutId = null;
  let gameOverPending = false;
  let gameOverPendingAt = 0;
  let screenShakeUntil = 0;
  let screenShakeStrength = 0;
  let scoreSubmissionState = 'idle';
  let gameOverMenuVisible = false;
  let switchIsDown = false;
  let scoreSubmitHoverStartAt = 0;
  let scoreRetryHoverStartAt = 0;
  let normalModeEndsAt = 0;
  let onlineTimeOffset = 0;
  let pausedAt = null;
  let previousFrame = null;
  let lastFrameAt = 0;
  let nextProjectileId = 1;
  const onlineEffects = [];

  function gameNow() {
    return online ? (pausedAt ?? performance.now()) - onlineTimeOffset : performance.now();
  }

  function usesGazeField() {
    return inputMode === 'eyegaze' || Boolean(online?.gazeField);
  }

  function usesGazeControls() {
    return online ? online.input === 'gaze' : inputMode === 'eyegaze';
  }

  const EYEGAZE_DWELL_MS = 1000;
  const EYEGAZE_ROW_STEP_MS = 10000;
  const EYEGAZE_ROW_TRANSITION_MS = 2000;
  const EYEGAZE_ROW_GAP_PX = 18;
  const EYEGAZE_FIELD_TOP_RATIO = 0.03;
  const EYEGAZE_FIELD_HEIGHT_RATIO = 0.67;
  const EYEGAZE_LEGACY_FIELD_TOP_RATIO = 0.08;
  const EYEGAZE_LEGACY_FIELD_HEIGHT_RATIO = 0.62;
  const EYEGAZE_LEGACY_ROW_GAP_PX = 24;
  const EYEGAZE_DANGER_HOLD_MS = 4000;
  const EYEGAZE_ATTACK_RISE_SPEED = 220;
  const EYEGAZE_RISE_SPEED_MULTIPLIER = { normal: 1, hard: 1.25, competitive: 1.4 };
  const EYEGAZE_ROW_STEP_SPEED_MULTIPLIER = { normal: 1, hard: 1.4, competitive: 1.5625 };
  const EYEGAZE_ATTACK_SHAKE_MS = 320;
  const EYEGAZE_SHIELD_FLASH_MS = 1350;
  const GAME_OVER_DELAY_MS = 900;
  const NORMAL_MODE_DURATION_MS = 5 * 60 * 1000;

  const stars = [];
  const bullets = [];
  const enemies = [];
  const fxBursts = [];
  let nextEnemyId = 1;
  const STAR_COUNT = 220;
  const SWITCH_ENEMY_VW = 0.15;
  const NORMAL_SWITCH_ENEMY_SIZE_MULTIPLIER = 1.2;
  const PLAYER_SHIP_VW = 0.22;
  const SHIELD_CONTACT_DELAY_RATIO = 0;
  const PROJECTILE_HIT_BOTTOM_PENETRATION_RATIO = 0.33;
  const fractureCanvas = document.createElement('canvas');
  const fractureCtx = fractureCanvas.getContext('2d');

  const player = {
    x: 0,
    y: 0,
    width: 72,
    height: 28,
    cooldown: 0
  };
  const players = {
    blue: { x: 0, y: 0, cooldown: 0 },
    red: { x: 0, y: 0, cooldown: 0 }
  };

  function createSegments(container, total = 10) {
    container.innerHTML = '';
    for (let i = 0; i < total; i += 1) {
      const seg = document.createElement('div');
      seg.className = 'ship-stat-segment';
      container.appendChild(seg);
    }
  }

  function setSegmentValue(container, value) {
    const segments = Array.from(container.children);
    segments.forEach((seg, index) => {
      seg.classList.toggle('active', index < value);
    });
  }

  function resizeMenuStarsCanvas() {
    if (!shipSelectStarsCanvas) return;
    const rect = shipSelectStarsCanvas.getBoundingClientRect();
    shipSelectStarsCanvas.width = Math.max(1, Math.round(rect.width));
    shipSelectStarsCanvas.height = Math.max(1, Math.round(rect.height));
  }

  function initMenuStars() {
    resizeMenuStarsCanvas();
    menuStars.length = 0;
    for (let i = 0; i < MENU_STAR_COUNT; i += 1) {
      menuStars.push({
        x: Math.random() * shipSelectStarsCanvas.width,
        y: Math.random() * shipSelectStarsCanvas.height,
        z: Math.random(),
        size: 1 + Math.random() * 2.2
      });
    }
  }

  function updateMenuStars(dt) {
    const speed = 55;
    for (const star of menuStars) {
      star.y += speed * (0.3 + star.z * 1.1) * dt;
      if (star.y > shipSelectStarsCanvas.height + 4) {
        star.y = -6;
        star.x = Math.random() * shipSelectStarsCanvas.width;
        star.z = Math.random();
        star.size = 1 + Math.random() * 2.2;
      }
    }
  }

  function drawMenuStars() {
    const w = shipSelectStarsCanvas.width;
    const h = shipSelectStarsCanvas.height;
    shipSelectStarsCtx.fillStyle = '#000';
    shipSelectStarsCtx.fillRect(0, 0, w, h);
    for (const star of menuStars) {
      const alpha = 0.28 + star.z * 0.68;
      shipSelectStarsCtx.fillStyle = `rgba(255,255,255,${alpha})`;
      shipSelectStarsCtx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  function tickMenuStars(ts) {
    const dt = Math.min(0.033, (ts - menuStarsLastTs) / 1000 || 0.016);
    menuStarsLastTs = ts;
    updateMenuStars(dt);
    drawMenuStars();
    menuStarsRafId = requestAnimationFrame(tickMenuStars);
  }

  function startMenuStars() {
    if (menuStarsRafId) cancelAnimationFrame(menuStarsRafId);
    initMenuStars();
    menuStarsLastTs = performance.now();
    menuStarsRafId = requestAnimationFrame(tickMenuStars);
  }

  function resizeCanvas(resetPositions = false) {
    // Draw the same arena at the screen's pixel density in every game mode.
    const pixelScale = Math.min(3, Math.max(1, canvas.clientWidth * window.devicePixelRatio / arenaWidth));
    const pixelWidth = Math.round(arenaWidth * pixelScale);
    const pixelHeight = Math.round(arenaHeight * pixelScale);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(pixelWidth / arenaWidth, 0, 0, pixelHeight / arenaHeight, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    if (resetPositions) {
      player.y = arenaHeight - 90;
      if (player.x === 0) player.x = arenaWidth * 0.5;
      players.blue.y = arenaHeight - 90;
      players.red.y = arenaHeight - 90;
      players.blue.x = arenaWidth * 0.28;
      players.red.x = arenaWidth * 0.72;
    }
    updateAmmoMeterLayout();
  }

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i += 1) {
      stars.push({
        x: Math.random() * arenaWidth,
        y: Math.random() * arenaHeight,
        z: Math.random() * 1,
        size: 1 + Math.random() * 2.5
      });
    }
  }

  function updateStars(dt) {
    const speed = 160;
    for (const star of stars) {
      star.y += speed * (0.35 + star.z) * dt;
      if (star.y > arenaHeight + 4) {
        star.y = -8;
        star.x = Math.random() * arenaWidth;
        star.z = Math.random();
        star.size = 1 + Math.random() * 2.5;
      }
    }
  }

  function drawStars() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, arenaWidth, arenaHeight);
    for (const star of stars) {
      const alpha = 0.35 + star.z * 0.65;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  function loadSprites() {
    enemyImagePaths.forEach((path) => {
      const img = new Image();
      img.src = path;
      enemySprites.push(img);
    });
  }

  function preloadImage(path) {
    return new Promise((resolve) => {
      const img = new Image();
      const done = () => resolve();
      img.onload = done;
      img.onerror = done;
      img.src = path;
      if (img.complete) resolve();
    });
  }

  function preloadAudio(path) {
    return new Promise((resolve) => {
      const audio = new Audio();
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        audio.removeEventListener('canplaythrough', finish);
        audio.removeEventListener('loadeddata', finish);
        audio.removeEventListener('error', finish);
        resolve();
      };

      audio.preload = 'auto';
      audio.addEventListener('canplaythrough', finish, { once: true });
      audio.addEventListener('loadeddata', finish, { once: true });
      audio.addEventListener('error', finish, { once: true });
      audio.src = path;
      audio.load();

      setTimeout(finish, 5000);
    });
  }

  async function preloadAssets() {
    const imagePaths = [
      ...enemyImagePaths,
      playerSprites.blue,
      playerSprites.red
    ];

    const audioPaths = [
      '../../sounds/spaceadventure/missile.mp3',
      '../../sounds/spaceadventure/hit.mp3',
      '../../sounds/spaceadventure/shipdestroyed.mp3',
      '../../sounds/spaceadventure/shield.mp3',
      '../../sounds/spaceadventure/replay.mp3',
      '../../sounds/spaceadventure/gamestart.mp3',
      ...musicPlaylist
    ];

    const total = imagePaths.length + audioPaths.length;
    let loaded = 0;

    const updateStatus = () => {
      const percent = Math.round((loaded / total) * 100);
      const lang = getCurrentLanguage();
      assetLoadStatus.textContent =
        lang === 'fr' ? `Chargement des ressources... ${percent}%` :
        lang === 'ja' ? `アセット読み込み中... ${percent}%` :
        `Loading assets... ${percent}%`;
    };

    updateStatus();

    const tasks = [
      ...imagePaths.map((path) => preloadImage(path).then(() => {
        loaded += 1;
        updateStatus();
      })),
      ...audioPaths.map((path) => preloadAudio(path).then(() => {
        loaded += 1;
        updateStatus();
      }))
    ];

    await Promise.all(tasks);
    assetsReady = true;
    refreshStartButtonState();
    tryStartMenuMusic();

    const lang = getCurrentLanguage();
    assetLoadStatus.textContent =
      lang === 'fr' ? 'Ressources prêtes' :
      lang === 'ja' ? 'アセットの準備完了' :
      'Assets ready';
  }

  function getSelectedShipSong() {
    return shipProfiles[selectedShip]?.themeSong || menuBaseMusicPath;
  }

  function syncMenuMusicToSelection(playNow = false) {
    const targetSong = getSelectedShipSong();
    const songChanged = !menuMusic.src.endsWith(targetSong);

    if (songChanged) {
      menuMusic.pause();
      menuMusicStarted = false;
      menuMusic.src = targetSong;
      menuMusic.load();
    }

    menuMusic.volume = MENU_MUSIC_VOLUME;

    if (playNow && assetsReady && !running) {
      menuMusic.currentTime = 0;
      const playPromise = menuMusic.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
          menuMusicStarted = true;
        }).catch(() => {});
      } else {
        menuMusicStarted = true;
      }
    }
  }

  function tryStartMenuMusic() {
    if (!assetsReady || running || menuMusicStarted) return;
    syncMenuMusicToSelection(false);
    menuMusic.currentTime = 0;
    const playPromise = menuMusic.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        menuMusicStarted = true;
      }).catch(() => {});
    } else {
      menuMusicStarted = true;
    }
  }

  function stopMenuMusic() {
    menuMusic.pause();
    menuMusic.currentTime = 0;
    menuMusicStarted = false;
  }

  function refreshStartButtonState() {
    const lang = getCurrentLanguage();
    if (online) {
      online.render();
      return;
    }
    if (assetsReady) {
      startButton.disabled = false;
      startButton.dataset.fr = 'Commencer';
      startButton.dataset.en = 'Start';
      startButton.dataset.ja = '開始';
      startButton.textContent =
        lang === 'fr' ? 'Commencer' :
        lang === 'ja' ? '開始' :
        'Start';
    } else {
      startButton.disabled = true;
      startButton.dataset.fr = 'Chargement...';
      startButton.dataset.en = 'Loading...';
      startButton.dataset.ja = '読み込み中...';
      startButton.textContent =
        lang === 'fr' ? 'Chargement...' :
        lang === 'ja' ? '読み込み中...' :
        'Loading...';
    }
  }

  function getProjectileStyle(ship = selectedShip) {
    return ship === 'red' ? 'redLaser' : 'missile';
  }

  function getProjectileSpeed(ship = selectedShip) {
    return getProjectileStyle(ship) === 'redLaser' ? 760 : 350;
  }

  function getEnemyMaxHp(enemy) {
    if (enemy.type === 'laser' || enemy.type === 'tank') {
      return selectedShip === 'red' ? 3 : 2;
    }
    return 1;
  }

  function createProjectileData({ x, y, vx, vy, speed, targetId = null, homing = false, ship = selectedShip }) {
    const style = getProjectileStyle(ship);
    return {
      ...(online && { id: nextProjectileId++ }),
      x,
      y,
      vx,
      vy,
      speed,
      targetId,
      homing,
      turnRate: style === 'redLaser' ? 4.5 : 3.1,
      r: style === 'redLaser' ? 6 : 9,
      trail: [],
      style
    };
  }

  function applyShipChoice(shipId) {
    selectedShip = shipId === 'red' ? 'red' : 'blue';
    playerSprite.src = playerSprites[selectedShip];
    bluePlayerSprite.src = playerSprites.blue;
    redPlayerSprite.src = playerSprites.red;
    updateShipCardSelection();

    syncMenuMusicToSelection(menuMusicStarted || assetsReady);
    updateShipPanelLanguage();
  }

  function updateShipCardSelection() {
    const twoPlayersSelected = inputMode === 'switch2p';
    shipCards.forEach((card) => {
      const selected = twoPlayersSelected ? true : card.dataset.ship === selectedShip;
      card.classList.toggle('selected', selected);
      if (!online) card.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
  }

  function updateShipPanelLanguage() {
    const lang = getCurrentLanguage();

    shipSelectTitle.textContent =
      lang === 'fr' ? (online ? 'VAISSEAUX DE L’ÉQUIPE' : 'CHOISIS TON VAISSEAU') :
      lang === 'ja' ? (online ? 'チームの機体' : '機体を選ぼう') :
      (online ? 'TEAM SHIPS' : 'CHOOSE YOUR SHIP');

    shipCards.forEach((card) => {
      const shipId = card.dataset.ship;
      const cardProfile = shipProfiles[shipId];

      const nameNode = card.querySelector('.ship-card-name');
      const tagNode = card.querySelector('.ship-card-tag');
      const statLabels = card.querySelectorAll('.ship-card-stat-label');
      const speedBarNode = card.querySelector('.ship-card-speed-bar');
      const shieldsBarNode = card.querySelector('.ship-card-shields-bar');
      const traitNode = card.querySelector('.ship-card-trait');

      if (nameNode) nameNode.textContent = cardProfile.name[lang] || cardProfile.name.en;
      if (tagNode) tagNode.textContent = cardProfile.tag[lang] || cardProfile.tag.en;

      if (statLabels[0]) {
        statLabels[0].textContent =
          lang === 'fr' ? 'VITESSE' :
          lang === 'ja' ? 'スピード' :
          'SPEED';
      }

      if (statLabels[1]) {
        statLabels[1].textContent =
          lang === 'fr' ? 'BOUCLIERS' :
          lang === 'ja' ? 'シールド' :
          'SHIELDS';
      }

      if (speedBarNode) setSegmentValue(speedBarNode, cardProfile.speed);
      if (shieldsBarNode) setSegmentValue(shieldsBarNode, cardProfile.shields);
      if (traitNode) traitNode.textContent = cardProfile.trait[lang] || cardProfile.trait.en;
    });

    refreshStartButtonState();
    if (assetLoadStatus && assetsReady) {
      assetLoadStatus.textContent =
        lang === 'fr' ? 'Ressources prêtes' :
        lang === 'ja' ? 'アセットの準備完了' :
        'Assets ready';
    }
  }
  function findNearestEnemy(x, y) {
    let best = null;
    let bestDistSq = Infinity;

    for (const e of enemies) {
      if (e.attackState) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        best = e;
      }
    }

    return best;
  }

  function findEnemyById(id) {
    return enemies.find(enemy => enemy.id === id) ?? null;
  }
  function spawnEnemy() {
    const roll = Math.random();
    let type = 'normal';
    let image = enemySprites[Math.floor(Math.random() * enemySprites.length)] || null;

    if (!usesGazeField()) {
      if (roll < (difficulty === 'competitive' ? 0.14 : difficulty === 'hard' ? 0.18 : 0.08)) {
        type = 'laser';
        image = heavyEnemySprite;
      } else if (
        (difficulty === 'hard' && Math.random() < 0.35) ||
        (difficulty === 'competitive' && Math.random() < 0.22)
      ) {
        type = 'tank';
        image = heavyEnemySprite;
      }
    }

    if (usesGazeField()) {
      const tileSize = getEyegazeTileSize();
      const availableLanes = getAvailableEyegazeLanes();
      if (!availableLanes.length) return;
      const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      const rowY = getEyegazeRowY(0);

      enemies.push({
        id: nextEnemyId++,
        x: arenaWidth * lane,
        y: rowY,
        size: tileSize,
        speed: 0,
        image,
        type: 'normal',
        hp: 1,
        maxHp: 1,
        eyegazeTile: true,
        resolved: false,
        spawnAt: gameNow(),
        lane,
        introMs: getEyegazeIntroDurationMs(tileSize),
        damageFlashUntil: 0
      });
      return;
    }

    const baseSpeed = 58;
    const speedMultiplier = difficulty === 'competitive' ? 1.5 : difficulty === 'hard' ? 1.25 : 1;
    const switchSize = Math.max(120, arenaWidth * SWITCH_ENEMY_VW);
    const isHeavyEnemy = type === 'tank' || type === 'laser';
    const enemySize = isHeavyEnemy
      ? switchSize * 1.5
      : switchSize * NORMAL_SWITCH_ENEMY_SIZE_MULTIPLIER;
    const actualSpeed = baseSpeed * speedMultiplier * (type === 'laser' ? 1.04 : 1);
    const leftSafeZone = arenaWidth * 0.1;
    const minX = Math.max(leftSafeZone + enemySize * 0.5, 30 + enemySize * 0.5);
    const maxX = Math.max(minX, arenaWidth - Math.max(60, enemySize * 0.5 + 20));
    const maxHp = getEnemyMaxHp({ type });

    enemies.push({
      id: nextEnemyId++,
      x: minX + Math.random() * Math.max(0, maxX - minX),
      y: 70,
      size: enemySize,
      speed: actualSpeed,
      baseSpeed: actualSpeed,
      image,
      type,
      hp: maxHp,
      maxHp,
      damageFlashUntil: 0,
      smokeLevel: 0,
      fractureLines: []
    });
  }

  function getEnemyShieldContactOffset(enemy) {
    return enemy.size * SHIELD_CONTACT_DELAY_RATIO;
  }

  function getEnemyProjectileHitCenterY(enemy) {
    return enemy.y - enemy.size * PROJECTILE_HIT_BOTTOM_PENETRATION_RATIO;
  }

  function getSpawnDelayMs() {
    const baseDelay = difficulty === 'hard'
      ? 5000 + Math.random() * 3000
      : difficulty === 'competitive'
        ? 3000 + Math.random() * 1000
        : 10000;

    if (inputMode === 'switch2p' && !usesGazeField()) return baseDelay * 0.5;
    if (!usesGazeField()) return baseDelay;

    const spawnSpeedMultiplier = difficulty === 'hard'
      ? 1.4
      : difficulty === 'competitive'
        ? 1.5625
        : 1;
    return baseDelay / spawnSpeedMultiplier;
  }

  function shoot(ship = selectedShip) {
    const shooter = ship === 'red' ? players.red : ship === 'blue' ? players.blue : player;
    if (!running || shooter.cooldown > 0 || gameOverPending) return;
    if (inputMode === 'eyegaze') return;

    if (usesAmmoMeter()) {
      const cost = getShotCost();
      if (inputMode === 'switch2p') {
        if (ammoEnergyByShip[ship] < cost) return;
        ammoEnergyByShip[ship] = Math.max(0, ammoEnergyByShip[ship] - cost);
      } else {
        if (ammoEnergy < cost) return;
        ammoEnergy = Math.max(0, ammoEnergy - cost);
      }
      updateAmmoMeter();
    }

    const muzzleX = shooter.x;
    const muzzleY = shooter.y - 16;
    const speed = getProjectileSpeed(ship);
    const target = findNearestEnemy(muzzleX, muzzleY);
    let vx = 0;
    let vy = -speed;
    let targetId = null;
    let homing = false;

    if (target) {
      targetId = target.id;
      homing = true;
      const arcDirection = target.x >= muzzleX ? 1 : -1;
      const launchAngle = (-Math.PI / 2) + arcDirection * 0.48;
      vx = Math.cos(launchAngle) * speed;
      vy = Math.sin(launchAngle) * speed;
    }

    bullets.push(createProjectileData({
      x: muzzleX,
      y: muzzleY,
      vx,
      vy,
      speed,
      targetId,
      homing,
      ship
    }));

    playSfx('launch');
    shooter.cooldown = usesAmmoMeter() ? 0.12 : 1.0;
  }

  function applyDamageToEnemy(enemy) {
    enemy.hp -= 1;
    enemy.damageFlashUntil = gameNow() + 140;

    const damageTaken = Math.max(0, (enemy.maxHp || 1) - enemy.hp);
    enemy.smokeLevel = damageTaken;

    if (enemy.hp > 0) {
      const slowRatio =
        enemy.type === 'laser'
          ? (enemy.hp === 2 ? 0.68 : 0.42)
          : 0.45;

      if (typeof enemy.baseSpeed === 'number') {
        enemy.speed = enemy.baseSpeed * slowRatio;
      } else {
        enemy.speed *= slowRatio;
      }

      ensureEnemyFractures(enemy, damageTaken);
    }
  }

  function updateGame(dt) {
    player.cooldown = Math.max(0, player.cooldown - dt);
    players.blue.cooldown = Math.max(0, players.blue.cooldown - dt);
    players.red.cooldown = Math.max(0, players.red.cooldown - dt);

    if (!gameOverPending && difficulty === 'normal' && normalModeEndsAt > 0 && gameNow() >= normalModeEndsAt) {
      triggerGameOverSequence();
      return;
    }

    if (usesAmmoMeter() && !gameOverPending) {
      if (inputMode === 'switch2p') {
        ammoEnergyByShip.blue = Math.min(1, ammoEnergyByShip.blue + getAmmoRegenPerSecond('blue') * dt);
        ammoEnergyByShip.red = Math.min(1, ammoEnergyByShip.red + getAmmoRegenPerSecond('red') * dt);
      } else {
        ammoEnergy = Math.min(1, ammoEnergy + getAmmoRegenPerSecond(selectedShip) * dt);
      }
      updateAmmoMeter();
    }

    motionTime += dt;
    const centerX = arenaWidth * 0.5;
    const horizontalRange = arenaWidth / 12;
    if (inputMode === 'switch2p') {
      player.x = centerX;
      const sway = Math.sin(motionTime * 0.8) * (arenaWidth / 30);
      players.blue.x = arenaWidth * 0.28 + sway;
      players.red.x = arenaWidth * 0.72 - sway;
    } else {
      player.x = centerX + Math.sin(motionTime * 0.6) * horizontalRange;
      players.blue.x = player.x;
      players.red.x = player.x;
    }

    if (!gameOverPending) {
      enemySpawnTimer += dt * 1000;
      if (enemySpawnTimer >= currentSpawnDelay) {
        enemySpawnTimer = 0;
        spawnEnemy();
        currentSpawnDelay = getSpawnDelayMs();
      }
    }

    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const b = bullets[i];
      const trailRadiusBase = b.style === 'redLaser' ? 3.6 : b.r * (0.55 + Math.random() * 0.45);
      b.trail.unshift({
        x: b.x,
        y: b.y,
        life: b.style === 'redLaser' ? 0.16 : 0.5,
        r: trailRadiusBase
      });
      if (b.trail.length > (b.style === 'redLaser' ? 10 : 16)) b.trail.pop();
      for (const p of b.trail) p.life -= dt;
      b.trail = b.trail.filter((p) => p.life > 0);

      if (b.homing && b.targetId !== null) {
        const targetEnemy = findEnemyById(b.targetId);
        if (targetEnemy) {
          const desiredAngle = Math.atan2(targetEnemy.y - b.y, targetEnemy.x - b.x);
          const currentAngle = Math.atan2(b.vy, b.vx);
          let delta = desiredAngle - currentAngle;
          while (delta > Math.PI) delta -= Math.PI * 2;
          while (delta < -Math.PI) delta += Math.PI * 2;
          const maxTurn = b.turnRate * dt;
          const clampedTurn = Math.max(-maxTurn, Math.min(maxTurn, delta));
          const nextAngle = currentAngle + clampedTurn;
          b.vx = Math.cos(nextAngle) * b.speed;
          b.vy = Math.sin(nextAngle) * b.speed;
        } else {
          b.targetId = null;
          b.homing = false;
        }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.y < -20 || b.y > arenaHeight + 20 || b.x < -20 || b.x > arenaWidth + 20) {
        bullets.splice(i, 1);
      }
    }

    if (!gameOverPending) {
      for (let i = enemies.length - 1; i >= 0; i -= 1) {
        const e = enemies[i];
        if (e.eyegazeTile) {
          const now = gameNow();
          if (e.attackState === 'ascending') {
            const dangerY = getDangerLineY();
            const riseMultiplier = EYEGAZE_RISE_SPEED_MULTIPLIER[difficulty] || 1;
            e.y += EYEGAZE_ATTACK_RISE_SPEED * riseMultiplier * dt;
            const bottomEdge = e.y + e.size * 0.5;
            if (bottomEdge >= dangerY) {
              e.attackState = 'shaking';
              e.attackStartAt = now;
              e.y = dangerY - e.size * 0.5;
              triggerShieldFlash(now);
              playSfx('shield');
              if (loseLife()) return;
            }
          } else if (e.attackState === 'shaking') {
            if (now - (e.attackStartAt || now) >= EYEGAZE_ATTACK_SHAKE_MS) {
              spawnEyegazeBottomBurst(e.x, getDangerLineY(), e.size * 1.05);
              enemies.splice(i, 1);
              continue;
            }
          } else {
            const elapsed = now - (e.spawnAt || 0);
            const animatedY = getEyegazeAnimatedY(elapsed);
            if (animatedY === null) {
              e.attackState = 'ascending';
              e.attackStartAt = now;
              continue;
            }
            const introDuration = Math.max(300, e.introMs || 300);
            const introT = Math.max(0, Math.min(1, elapsed / introDuration));
            const introStartY = -e.size;
            e.y = introStartY + (animatedY - introStartY) * introT;
          }
        } else {
          e.y += e.speed * dt;
          const dangerY = getDangerLineY();
          const enemyShieldContactY = e.y - getEnemyShieldContactOffset(e);
          if (enemyShieldContactY >= dangerY) {
            spawnShieldContactBurst(e.x, dangerY, e.size);
            playSfx('shield');
            enemies.splice(i, 1);
            if (loseLife()) return;
            continue;
          }
        }

        if (usesGazeField() && e.y - e.size * 0.5 > arenaHeight) {
          enemies.splice(i, 1);
          if (loseLife()) return;
          continue;
        }

        for (let j = bullets.length - 1; j >= 0; j -= 1) {
          const b = bullets[j];
          if (e.attackState) continue;
          if (b.targetId !== null && b.targetId !== e.id) continue;

          const hitCenterY = e.eyegazeTile ? e.y : getEnemyProjectileHitCenterY(e);
          const dx = b.x - e.x;
          const dy = b.y - hitCenterY;
          const hitRadius = e.eyegazeTile ? e.size * 0.45 : e.size * 0.4;
          if ((dx * dx + dy * dy) <= (hitRadius * hitRadius)) {
            bullets.splice(j, 1);
            playSfx('hit');

            if (e.eyegazeTile) {
              enemies.splice(i, 1);
              score += 10;
              spawnProjectileBurst(e.x, e.y, e.size);
              playSfx('destroy');
              updateHud();
              break;
            }

            applyDamageToEnemy(e);

            if (e.hp <= 0) {
              enemies.splice(i, 1);
              score += e.type === 'laser' ? 30 : e.type === 'tank' ? 20 : 10;
              spawnProjectileBurst(e.x, e.y, e.size);
              playSfx('destroy');
              updateHud();
            }
            break;
          }
        }
      }

      if (usesGazeControls() && (!online || !document.hidden)) {
        updateEyegazeDwell();
      }
    } else {
      for (let i = enemies.length - 1; i >= 0; i -= 1) {
        const e = enemies[i];
        if (e.eyegazeTile && e.attackState === 'shaking') {
          const now = gameNow();
          if (now - (e.attackStartAt || now) >= EYEGAZE_ATTACK_SHAKE_MS) {
            spawnEyegazeBottomBurst(e.x, getDangerLineY(), e.size * 1.05);
            enemies.splice(i, 1);
          }
        }
      }

      if (gameNow() - gameOverPendingAt >= GAME_OVER_DELAY_MS) {
        showGameOverScreen();
        return;
      }
    }

    updateFx(dt);
  }

  function updateFx(dt) {
    for (let i = fxBursts.length - 1; i >= 0; i -= 1) {
      const burst = fxBursts[i];
      const stepDt = dt * (typeof burst.timeScale === 'number' ? burst.timeScale : 1);
      burst.life -= stepDt;

      if (burst.type === 'ring') {
        const t = 1 - (burst.life / burst.maxLife);
        burst.r = burst.r + (burst.maxR - burst.r) * Math.min(1, stepDt * 8) + t * 20 * stepDt;
      } else if (burst.type === 'ellipseRing') {
        const t = 1 - (burst.life / burst.maxLife);
        burst.rx = burst.rx + (burst.maxRx - burst.rx) * Math.min(1, stepDt * 8) + t * 22 * stepDt;
        burst.ry = burst.ry + (burst.maxRy - burst.ry) * Math.min(1, stepDt * 8) + t * 10 * stepDt;
      } else if (burst.type === 'particles' || burst.type === 'sparks') {
        const drag = typeof burst.drag === 'number' ? burst.drag : 0.985;
        for (const p of burst.particles) {
          p.x += p.vx * stepDt;
          p.y += p.vy * stepDt;

          p.vx *= drag;
          p.vy *= drag;
        }
      }

      if (burst.life <= 0) fxBursts.splice(i, 1);
    }
  }

  function getEyegazeRowY(rowIndex) {
    const size = getEyegazeTileSize();
    const fieldTop = arenaHeight * EYEGAZE_FIELD_TOP_RATIO;
    const rows = getEyegazeRowCount();
    const clampedRow = Math.max(0, Math.min(rows - 1, rowIndex));
    return fieldTop + size * 0.5 + clampedRow * (size + EYEGAZE_ROW_GAP_PX);
  }

  function getEyegazeTileSize() {
    const cols = getEyegazeColumnLanes().length;
    const rows = getEyegazeRowCount();
    const byWidth = arenaWidth * (cols === 2 ? 0.44 : 0.34);
    const fieldHeight = arenaHeight * EYEGAZE_FIELD_HEIGHT_RATIO;
    const byHeight = (fieldHeight - EYEGAZE_ROW_GAP_PX * (rows - 1)) / rows;
    return Math.max(110, Math.min(byWidth, byHeight));
  }

  function getEyegazeIntroDurationMs(tileSize) {
    const rowDistance = Math.max(1, Math.abs(getEyegazeRowY(1) - getEyegazeRowY(0)));
    const pxPerMs = rowDistance / EYEGAZE_ROW_TRANSITION_MS;
    const introDistance = getEyegazeRowY(0) + tileSize;
    return Math.max(400, introDistance / Math.max(0.01, pxPerMs));
  }

  function getAvailableEyegazeLanes() {
    const lanes = getEyegazeColumnLanes();
    const occupied = new Set();
    const topY = getEyegazeRowY(0);
    const nextRowY = getEyegazeRowY(1);
    const topRowCutoff = (topY + nextRowY) * 0.5;
    for (const enemy of enemies) {
      if (!enemy.eyegazeTile) continue;
      if (typeof enemy.lane !== 'number') continue;
      if (enemy.y <= topRowCutoff) occupied.add(enemy.lane);
    }
    return lanes.filter((lane) => !occupied.has(lane));
  }

  function getEyegazeRowStepMs() {
    const speedMultiplier = EYEGAZE_ROW_STEP_SPEED_MULTIPLIER[difficulty] || 1;
    return EYEGAZE_ROW_STEP_MS / speedMultiplier;
  }

  function getEyegazeAnimatedY(elapsedMs) {
    const top = getEyegazeRowY(0);
    const second = getEyegazeRowY(1);
    const rowStepMs = getEyegazeRowStepMs();
    const isNormalGrid = difficulty === 'normal';

    if (isNormalGrid) {
      const bottomStartMs = rowStepMs + EYEGAZE_ROW_TRANSITION_MS;
      const bottomEndMs = bottomStartMs + EYEGAZE_DANGER_HOLD_MS;
      if (elapsedMs < rowStepMs) return top;
      if (elapsedMs < rowStepMs + EYEGAZE_ROW_TRANSITION_MS) {
        const t = (elapsedMs - rowStepMs) / EYEGAZE_ROW_TRANSITION_MS;
        return top + (second - top) * t;
      }
      if (elapsedMs < bottomEndMs) return second;
      return null;
    }

    const middle = second;
    const bottom = getEyegazeRowY(2);
    const bottomStartMs = rowStepMs * 2 + EYEGAZE_ROW_TRANSITION_MS;
    const bottomEndMs = bottomStartMs + EYEGAZE_DANGER_HOLD_MS;

    if (elapsedMs < rowStepMs) return top;
    if (elapsedMs < rowStepMs + EYEGAZE_ROW_TRANSITION_MS) {
      const t = (elapsedMs - rowStepMs) / EYEGAZE_ROW_TRANSITION_MS;
      return top + (middle - top) * t;
    }
    if (elapsedMs < rowStepMs * 2) return middle;
    if (elapsedMs < rowStepMs * 2 + EYEGAZE_ROW_TRANSITION_MS) {
      const t = (elapsedMs - rowStepMs * 2) / EYEGAZE_ROW_TRANSITION_MS;
      return middle + (bottom - middle) * t;
    }
    if (elapsedMs < bottomEndMs) return bottom;
    return null;
  }

  function drawEyegazeDangerLine() {
    const y = getDangerLineY();
    ctx.save();
    const now = gameNow();
    const pulse = 0.5 + Math.sin(now * 0.0042) * 0.5;
    const pulseStrength = 0.12 + pulse * 0.2;
    const flashProgress = Math.max(0, Math.min(1, (now - shieldFlashStartedAt) / EYEGAZE_SHIELD_FLASH_MS));
    const flashActive = now <= shieldFlashUntil ? 1 : 0;
    const flashStrength = flashActive ? Math.sin(Math.PI * flashProgress) : 0;
    const redBoost = Math.round(120 * flashStrength);

    const gradient = ctx.createLinearGradient(0, y, arenaWidth, y);
    gradient.addColorStop(0, `rgba(${120 + redBoost}, 190, 255, 0.05)`);
    gradient.addColorStop(0.5, `rgba(${120 + redBoost}, ${190 - redBoost * 0.4}, ${255 - redBoost * 0.6}, ${0.6 + pulseStrength * 0.8})`);
    gradient.addColorStop(1, `rgba(${120 + redBoost}, 190, 255, 0.05)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3.5 + pulse * 1.2;
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.lineTo(arenaWidth - 12, y);
    ctx.stroke();

    const layerWidth = arenaWidth - 24;
    const layerLeft = 12;
    const shieldDepth = 64;
    const shieldGrad = ctx.createLinearGradient(0, y, 0, y + shieldDepth);
    shieldGrad.addColorStop(0, 'rgba(130, 200, 255, 0.26)');
    shieldGrad.addColorStop(0.35, 'rgba(130, 200, 255, 0.14)');
    shieldGrad.addColorStop(1, 'rgba(130, 200, 255, 0)');
    ctx.fillStyle = shieldGrad;
    ctx.fillRect(layerLeft, y, layerWidth, shieldDepth);

    ctx.shadowColor = flashStrength > 0.01 ? 'rgba(255, 90, 90, 0.9)' : `rgba(100, 180, 255, ${0.62 + pulse * 0.3})`;
    ctx.shadowBlur = 16 + pulse * 10 + flashStrength * 8;
    ctx.strokeStyle = flashStrength > 0.01 ? 'rgba(255, 130, 130, 0.7)' : `rgba(135, 205, 255, ${0.42 + pulse * 0.24})`;
    ctx.lineWidth = 7 + pulse * 2;
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.lineTo(arenaWidth - 12, y);
    ctx.stroke();
    ctx.restore();
  }

  function getDangerLineY() {
    const cols = getEyegazeColumnLanes().length;
    const rows = getEyegazeRowCount();
    const byWidth = arenaWidth * (cols === 2 ? 0.44 : 0.34);
    const legacyFieldHeight = arenaHeight * EYEGAZE_LEGACY_FIELD_HEIGHT_RATIO;
    const legacyByHeight = (legacyFieldHeight - EYEGAZE_LEGACY_ROW_GAP_PX * (rows - 1)) / rows;
    const legacyTileSize = Math.max(110, Math.min(byWidth, legacyByHeight));
    const bottomRowCenterY =
      arenaHeight * EYEGAZE_LEGACY_FIELD_TOP_RATIO +
      legacyTileSize * 0.5 +
      (rows - 1) * (legacyTileSize + EYEGAZE_LEGACY_ROW_GAP_PX);
    return bottomRowCenterY + legacyTileSize * 0.5 + 18;
  }

  function getEyegazeColumnLanes() {
    return difficulty === 'normal' ? [0.3, 0.7] : [0.16, 0.5, 0.84];
  }

  function getEyegazeRowCount() {
    return difficulty === 'normal' ? 2 : 3;
  }

  function getPlayerRenderSize() {
    if (playerSprite.complete && playerSprite.naturalWidth > 0) {
      const aspectRatio = playerSprite.naturalHeight / playerSprite.naturalWidth || 0.8;
      const baseShipWidth = Math.max(140, arenaWidth * PLAYER_SHIP_VW);
      const smallScreenScale = Math.max(0.9, Math.min(1, arenaHeight / 1080));
      const drawWidth = baseShipWidth * smallScreenScale;
      const drawHeight = drawWidth * aspectRatio;
      return { drawWidth, drawHeight };
    }
    return { drawWidth: 44, drawHeight: 44 };
  }

  function drawPlayer() {
    if (inputMode === 'switch2p') {
      drawSinglePlayerShip(players.blue, 'blue');
      drawSinglePlayerShip(players.red, 'red');
      online?.positionPlayerNames(players.blue.x, players.red.x);
      return;
    }
    drawSinglePlayerShip(player, selectedShip);
  }

  function drawSinglePlayerShip(shipState, shipId) {
    const shipSprite =
      shipId === 'red'
        ? redPlayerSprite
        : (inputMode === 'switch2p' ? bluePlayerSprite : playerSprite);
    const shipX = shipState.x;
    const shipY = shipState.y;
    const now = gameNow();
    const failing = gameOverPending;
    const wobbleX = failing ? Math.sin((now - gameOverPendingAt) * 0.06) * 10 : 0;
    const wobbleRot = failing ? Math.sin((now - gameOverPendingAt) * 0.04) * 0.08 : 0;
    const flicker = failing ? (0.55 + Math.sin((now - gameOverPendingAt) * 0.09) * 0.22) : 1;

    if (shipSprite.complete && shipSprite.naturalWidth > 0) {
      const { drawWidth, drawHeight } = getPlayerRenderSize();
      ctx.save();
      ctx.translate(shipX + wobbleX, shipY);
      ctx.rotate(wobbleRot);
      ctx.globalAlpha = flicker;
      ctx.drawImage(shipSprite, -drawWidth * 0.5, -drawHeight * 0.55, drawWidth, drawHeight);
      ctx.restore();

      if (failing) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const glow = ctx.createRadialGradient(shipX + wobbleX, shipY, 0, shipX + wobbleX, shipY, drawWidth * 0.55);
        glow.addColorStop(0, 'rgba(255,110,80,0.28)');
        glow.addColorStop(1, 'rgba(255,110,80,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(shipX + wobbleX, shipY, drawWidth * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    ctx.save();
    ctx.translate(shipX + wobbleX, shipY);
    ctx.rotate(wobbleRot);
    ctx.globalAlpha = flicker;
    ctx.fillStyle = '#2f8bff';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(-22, 18);
    ctx.lineTo(22, 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function prepareGameplayMusic() {
    const selectedTrack = getSelectedShipSong();
    music.volume = BG_MUSIC_VOLUME;
    if (!music.src.endsWith(selectedTrack)) {
      music.src = selectedTrack;
      music.load();
    }
  }

  function drawBullets() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const b of bullets) {
      if (b.style === 'redLaser') {
        for (const p of b.trail) {
          const alpha = Math.max(0, p.life / 0.16);
          ctx.fillStyle = `rgba(255, 70, 70, ${0.22 * alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1.2, p.r * (0.8 + alpha * 0.45)), 0, Math.PI * 2);
          ctx.fill();
        }

        const angle = Math.atan2(b.vy, b.vx);
        const length = 32;
        const beamBackX = b.x - Math.cos(angle) * length;
        const beamBackY = b.y - Math.sin(angle) * length;

        ctx.save();
        ctx.lineCap = 'round';

        ctx.strokeStyle = 'rgba(255, 70, 70, 0.34)';
        ctx.lineWidth = 13;
        ctx.shadowColor = 'rgba(255, 55, 55, 0.95)';
        ctx.shadowBlur = 26;
        ctx.beginPath();
        ctx.moveTo(beamBackX, beamBackY);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 195, 195, 0.96)';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(beamBackX, beamBackY);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        ctx.fillStyle = '#fff0f0';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      const headR = b.r * 2.25;
      for (const p of b.trail) {
        const alpha = Math.max(0, p.life / 0.5);
        ctx.fillStyle = `rgba(255, 150, 60, ${0.22 * alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.4, p.r * (0.95 + alpha * 0.45)), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowColor = 'rgba(255, 198, 80, 0.85)';
      ctx.shadowBlur = 24;
      ctx.fillStyle = '#ffd66b';
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.fillStyle = '#ffc24b';
      ctx.beginPath();
      ctx.moveTo(headR + 4, 0);
      ctx.lineTo(-headR * 0.8, -headR * 0.55);
      ctx.lineTo(-headR * 0.8, headR * 0.55);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fff4c4';
      ctx.beginPath();
      ctx.ellipse(-headR * 0.12, 0, headR * 0.44, headR * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function ensureEnemyFractures(enemy, damageLevel) {
    if (!enemy || enemy.eyegazeTile) return;

    if (!Array.isArray(enemy.fractureLines)) enemy.fractureLines = [];
    const targetCount = Math.min(18, 4 + damageLevel * 5 + (enemy.type === 'laser' ? 2 : 0));

    while (enemy.fractureLines.length < targetCount) {
      const points = [];
      const segments = 2 + Math.floor(Math.random() * 3);
      const startX = (Math.random() - 0.5) * 0.56;
      const startY = -0.28 + Math.random() * 0.5;
      points.push({ x: startX, y: startY });

      let px = startX;
      let py = startY;
      for (let i = 0; i < segments; i += 1) {
        px += (Math.random() - 0.5) * 0.22;
        py += 0.07 + Math.random() * 0.11;
        points.push({
          x: Math.max(-0.34, Math.min(0.34, px)),
          y: Math.max(-0.34, Math.min(0.34, py))
        });
      }

      enemy.fractureLines.push({
        points,
        thickness: 1.4 + Math.random() * 1.8,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  function drawEnemyDamageState(e) {
    if (e.eyegazeTile) return;

    const damageLevel = e.smokeLevel || ((e.maxHp || 1) - e.hp);
    if (damageLevel <= 0 || !e.image || !e.image.complete) return;

    ensureEnemyFractures(e, damageLevel);
    if (!e.fractureLines || !e.fractureLines.length) return;

    const sizePx = Math.max(2, Math.round(e.size));
    if (fractureCanvas.width !== sizePx || fractureCanvas.height !== sizePx) {
      fractureCanvas.width = sizePx;
      fractureCanvas.height = sizePx;
    }

    fractureCtx.clearRect(0, 0, sizePx, sizePx);

    const pulseTime = gameNow() * 0.012;
    const flashBoost = gameNow() < (e.damageFlashUntil || 0) ? 0.34 : 0;

    fractureCtx.save();
    fractureCtx.globalCompositeOperation = 'lighter';
    fractureCtx.lineCap = 'round';
    fractureCtx.lineJoin = 'round';

    for (const crack of e.fractureLines) {
      const pulse = 0.52 + 0.48 * Math.sin(pulseTime + crack.pulseOffset);
      const alpha = Math.min(0.95, 0.24 + damageLevel * 0.08 + pulse * 0.24 + flashBoost);
      const width = crack.thickness * (0.75 + pulse * 0.55);

      fractureCtx.strokeStyle = `rgba(255, 36, 52, ${alpha})`;
      fractureCtx.shadowColor = `rgba(255, 20, 40, ${Math.min(1, alpha + 0.16)})`;
      fractureCtx.shadowBlur = 9 + pulse * 8;
      fractureCtx.lineWidth = width;
      fractureCtx.beginPath();

      crack.points.forEach((pt, index) => {
        const px = sizePx * 0.5 + pt.x * sizePx;
        const py = sizePx * 0.5 + pt.y * sizePx;
        if (index === 0) fractureCtx.moveTo(px, py);
        else fractureCtx.lineTo(px, py);
      });

      fractureCtx.stroke();
    }

    fractureCtx.restore();

    fractureCtx.save();
    fractureCtx.globalCompositeOperation = 'destination-in';
    fractureCtx.drawImage(e.image, 0, 0, sizePx, sizePx);
    fractureCtx.restore();

    ctx.drawImage(fractureCanvas, e.x - sizePx * 0.5, e.y - sizePx * 0.5, sizePx, sizePx);
  }

  function drawEnemies() {
    for (const e of enemies) {
      if (e.eyegazeTile) {
        const shakeOffset = e.attackState === 'shaking'
          ? (Math.sin(gameNow() * 0.06) * 6)
          : 0;
        const renderX = e.x + shakeOffset;
        const x = renderX - e.size * 0.5;
        const y = e.y - e.size * 0.5;
        const hovered = !e.resolved && hoveredEnemyId === e.id;

        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 3;
        ctx.fillRect(x, y, e.size, e.size);
        ctx.strokeRect(x, y, e.size, e.size);

        if (e.image && e.image.complete) {
          ctx.drawImage(e.image, x + 6, y + 6, e.size - 12, e.size - 12);
        }

        if (e.resolved) {
          ctx.fillStyle = 'rgba(255, 52, 52, 0.42)';
          ctx.fillRect(x, y, e.size, e.size);
          ctx.strokeStyle = 'rgba(255, 120, 120, 0.8)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, e.size, e.size);
        } else if (hovered && hoverStartAt) {
          const progress = Math.max(0, Math.min(1, (gameNow() - hoverStartAt) / EYEGAZE_DWELL_MS));
          const fillW = e.size * progress;
          const fillH = e.size * progress;
          const fillX = e.x - fillW * 0.5;
          const fillY = e.y - fillH * 0.5;
          ctx.fillStyle = 'rgba(255, 52, 52, 0.42)';
          ctx.fillRect(fillX, fillY, fillW, fillH);
          ctx.strokeStyle = 'rgba(255, 120, 120, 0.8)';
          ctx.lineWidth = 2;
          ctx.strokeRect(fillX, fillY, fillW, fillH);
        }
        continue;
      }

      if (e.image && e.image.complete) {
        ctx.drawImage(e.image, e.x - e.size * 0.5, e.y - e.size * 0.5, e.size, e.size);
      } else {
        ctx.fillStyle = '#ff3b6b';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      drawEnemyDamageState(e);
      if (online && e.id === hoveredEnemyId && hoverStartAt) {
        const growth = Math.min(1, (gameNow() - hoverStartAt) / EYEGAZE_DWELL_MS);
        const side = e.size * growth;
        ctx.fillStyle = 'rgba(255, 52, 52, 0.42)';
        ctx.fillRect(e.x - side / 2, e.y - side / 2, side, side);
      }
    }
  }

  function drawFxBursts() {
    for (const burst of fxBursts) {
      const alpha = Math.max(0, burst.life / burst.maxLife);

      if (burst.type === 'ring') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(${burst.ringColor || '255,235,170'}, ${0.7 * alpha})`;
        ctx.lineWidth = (burst.lineWidth || 4) * (0.7 + alpha * 0.6);
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, burst.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      if (burst.type === 'ellipseRing') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(${burst.ringColor || '140,220,255'}, ${0.72 * alpha})`;
        ctx.lineWidth = (burst.lineWidth || 4) * (0.7 + alpha * 0.6);
        ctx.beginPath();
        ctx.ellipse(burst.x, burst.y, burst.rx, burst.ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      if (burst.type === 'flash') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, burst.r);
        grad.addColorStop(0, `rgba(${burst.innerColor || '255,250,230'}, ${0.7 * alpha})`);
        grad.addColorStop(0.35, `rgba(${burst.midColor || '255,200,120'}, ${0.35 * alpha})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, burst.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (burst.type === 'sparks') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        for (const p of burst.particles) {
          const px = p.x - p.vx * 0.035;
          const py = p.y - p.vy * 0.035;
          ctx.strokeStyle = `rgba(${p.color}, ${0.9 * alpha})`;
          ctx.lineWidth = Math.max(1, p.r * alpha);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        ctx.restore();
        continue;
      }

      for (const p of burst.particles) {
        let colorA = '255,110,70';
        let colorB = null;
        let baseAlpha = 0.65;

        if (burst.color === 'blue') {
          colorA = '110,190,255';
          colorB = '220,245,255';
          baseAlpha = 0.6;
        } else if (burst.color === 'gold') {
          colorA = '255,190,70';
          colorB = '255,245,210';
          baseAlpha = 0.78;
        } else if (burst.color === 'orange') {
          colorA = '255,120,70';
          colorB = '255,220,120';
          baseAlpha = 0.68;
        } else if (burst.color === 'red') {
          colorA = '255,70,70';
          colorB = '255,220,220';
          baseAlpha = 0.72;
        }

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const radius = Math.max(0.5, p.r * alpha);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        grad.addColorStop(0, `rgba(${colorB || colorA}, ${Math.min(1, baseAlpha * 1.15 * alpha)})`);
        grad.addColorStop(0.45, `rgba(${colorA}, ${baseAlpha * alpha})`);
        grad.addColorStop(1, `rgba(${colorA}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function spawnLaserDamageBurst(x, y, size, stage) {
    if (online?.isHost) onlineEffects.push(['laser', x, y, size, stage]);
    const particles = [];
    const count = 10 + stage * 4;
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 90 + stage * 18;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: 1.8 + Math.random() * 2.6
      });
    }

    fxBursts.push({
      life: 0.42,
      maxLife: 0.42,
      particles,
      type: 'particles',
      color: 'red',
      drag: 0.97
    });

    fxBursts.push({
      life: 0.3,
      maxLife: 0.3,
      type: 'ring',
      x,
      y,
      r: Math.max(8, size * 0.1),
      maxR: Math.max(28, size * (0.22 + stage * 0.07)),
      lineWidth: 3,
      ringColor: '255,90,90'
    });
  }

  function spawnEyegazeBottomBurst(x, y, size) {
    if (online?.isHost) onlineEffects.push(['breach', x, y, size]);
    const particles = [];
    const sparks = [];
    const count = 28;

    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const speed = 90 + Math.random() * 150;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed * 0.8,
        r: Math.max(2.5, size * 0.05 + Math.random() * 3)
      });
    }

    for (let i = 0; i < 14; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 180;
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: 2 + Math.random() * 2,
        color: '255,180,90'
      });
    }

    fxBursts.push({
      life: 1.4,
      maxLife: 1.4,
      particles,
      type: 'particles',
      color: 'orange',
      drag: 0.972
    });

    fxBursts.push({
      life: 0.9,
      maxLife: 0.9,
      particles: sparks,
      type: 'sparks',
      drag: 0.985
    });

    fxBursts.push({
      life: 0.75,
      maxLife: 0.75,
      type: 'ring',
      x,
      y,
      r: Math.max(12, size * 0.14),
      maxR: Math.max(70, size * 1.1),
      lineWidth: 5,
      ringColor: '255,180,90'
    });

    fxBursts.push({
      life: 0.35,
      maxLife: 0.35,
      type: 'flash',
      x,
      y,
      r: Math.max(34, size * 0.6),
      innerColor: '255,245,225',
      midColor: '255,180,90'
    });
  }

  function spawnProjectileBurst(x, y, size) {
    if (online?.isHost) onlineEffects.push(['projectile', x, y, size]);
    const particles = [];
    const sparks = [];
    const count = 26;

    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.22;
      const speed = 120 + Math.random() * 180;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: Math.max(2.5, size * 0.04 + Math.random() * 3)
      });
    }

    for (let i = 0; i < 18; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 220 + Math.random() * 200;
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: 2 + Math.random() * 2.5,
        color: Math.random() < 0.6 ? '255,210,120' : '255,120,70'
      });
    }

    fxBursts.push({
      life: 0.95,
      maxLife: 0.95,
      particles,
      type: 'particles',
      color: 'gold',
      drag: 0.968
    });

    fxBursts.push({
      life: 0.75,
      maxLife: 0.75,
      particles: sparks,
      type: 'sparks',
      drag: 0.986
    });

    fxBursts.push({
      life: 0.8,
      maxLife: 0.8,
      type: 'ring',
      x,
      y,
      r: Math.max(10, size * 0.12),
      maxR: Math.max(58, size * 1.05),
      lineWidth: 5,
      ringColor: '255,220,140'
    });

    fxBursts.push({
      life: 0.55,
      maxLife: 0.55,
      type: 'ring',
      x,
      y,
      r: Math.max(8, size * 0.08),
      maxR: Math.max(40, size * 0.72),
      lineWidth: 3,
      ringColor: '255,130,80'
    });

    fxBursts.push({
      life: 0.42,
      maxLife: 0.42,
      type: 'flash',
      x,
      y,
      r: Math.max(34, size * 0.65),
      innerColor: '255,250,235',
      midColor: '255,170,90'
    });

    projectileFlashUntil = gameNow() + 130;
  }

  function spawnShieldContactBurst(x, y, size) {
    if (online?.isHost) onlineEffects.push(['shield', x, y, size]);
    const particles = [];
    const sparks = [];
    const count = 34;

    for (let i = 0; i < count; i += 1) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      const horizontal = (120 + Math.random() * 220) * dir;
      const vertical = -25 - Math.random() * 90 + (Math.random() - 0.5) * 40;
      particles.push({
        x: x + (Math.random() - 0.5) * size * 0.08,
        y: y + (Math.random() - 0.5) * 6,
        vx: horizontal,
        vy: vertical,
        r: Math.max(2.5, size * 0.035 + Math.random() * 3)
      });
    }

    for (let i = 0; i < 20; i += 1) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      const horizontal = (180 + Math.random() * 260) * dir;
      const vertical = -10 - Math.random() * 85 + (Math.random() - 0.5) * 30;
      sparks.push({
        x,
        y,
        vx: horizontal,
        vy: vertical,
        r: 2 + Math.random() * 2,
        color: Math.random() < 0.7 ? '140,220,255' : '255,255,255'
      });
    }

    triggerShieldFlash();
    triggerScreenShake(340, 10);

    fxBursts.push({
      life: 1.1,
      maxLife: 1.1,
      particles,
      type: 'particles',
      color: 'blue',
      drag: 0.968
    });

    fxBursts.push({
      life: 0.82,
      maxLife: 0.82,
      particles: sparks,
      type: 'sparks',
      drag: 0.985
    });

    fxBursts.push({
      life: 0.95,
      maxLife: 0.95,
      type: 'ellipseRing',
      x,
      y,
      rx: Math.max(24, size * 0.28),
      ry: Math.max(8, size * 0.09),
      maxRx: Math.max(110, size * 1.55),
      maxRy: Math.max(26, size * 0.32),
      lineWidth: 5,
      ringColor: '140,220,255'
    });

    fxBursts.push({
      life: 0.65,
      maxLife: 0.65,
      type: 'ellipseRing',
      x,
      y,
      rx: Math.max(16, size * 0.18),
      ry: Math.max(5, size * 0.06),
      maxRx: Math.max(72, size * 1.0),
      maxRy: Math.max(18, size * 0.2),
      lineWidth: 3,
      ringColor: '210,245,255'
    });

    fxBursts.push({
      life: 0.45,
      maxLife: 0.45,
      type: 'flash',
      x,
      y,
      r: Math.max(34, size * 0.62),
      innerColor: '230,248,255',
      midColor: '120,200,255'
    });
  }

  function triggerShieldFlash(now = gameNow()) {
    if (online?.isHost) onlineEffects.push(['flash']);
    shieldFlashStartedAt = now;
    shieldFlashUntil = now + EYEGAZE_SHIELD_FLASH_MS;
  }

  function triggerScreenShake(durationMs = 250, strength = 8) {
    if (online?.isHost) onlineEffects.push(['shake', durationMs, strength]);
    screenShakeUntil = gameNow() + durationMs;
    screenShakeStrength = Math.max(screenShakeStrength, strength);
  }

  function getScreenShakeOffset() {
    const remaining = screenShakeUntil - gameNow();
    if (remaining <= 0) {
      screenShakeStrength = 0;
      return { x: 0, y: 0 };
    }
    const strength = screenShakeStrength * Math.min(1, remaining / 300);
    return {
      x: (Math.random() - 0.5) * 2 * strength,
      y: (Math.random() - 0.5) * 2 * strength * 0.7
    };
  }

  function drawImpactFlash() {
    const remaining = projectileFlashUntil - gameNow();
    const strength = Math.max(0, Math.min(1, remaining / 130));
    if (strength <= 0.01) return;

    ctx.save();
    ctx.fillStyle = `rgba(255, 245, 210, ${0.16 * strength})`;
    ctx.fillRect(0, 0, arenaWidth, arenaHeight);
    ctx.restore();
  }

  function drawFailureOverlay() {
    if (!gameOverPending) return;
    const elapsed = gameNow() - gameOverPendingAt;
    const progress = Math.max(0, Math.min(1, elapsed / GAME_OVER_DELAY_MS));
    const vignetteAlpha = 0.1 + progress * 0.26;

    ctx.save();
    const grad = ctx.createRadialGradient(
      arenaWidth * 0.5,
      arenaHeight * 0.72,
      arenaWidth * 0.08,
      arenaWidth * 0.5,
      arenaHeight * 0.55,
      arenaWidth * 0.8
    );
    grad.addColorStop(0, 'rgba(255,0,0,0)');
    grad.addColorStop(1, `rgba(120,0,0,${vignetteAlpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, arenaWidth, arenaHeight);

    const pulse = 0.08 + Math.sin(elapsed * 0.04) * 0.04;
    ctx.fillStyle = `rgba(255, 120, 90, ${Math.max(0.04, pulse)})`;
    ctx.fillRect(0, 0, arenaWidth, arenaHeight);
    ctx.restore();
  }

  function drawNormalModeTimer() {
    if (!running || difficulty !== 'normal' || normalModeEndsAt <= 0) return;

    const remainingMs = Math.max(0, normalModeEndsAt - gameNow());
    const progress = Math.max(0, Math.min(1, remainingMs / NORMAL_MODE_DURATION_MS));
    const cx = 82;
    const cy = 84;
    const radius = 44;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * progress;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(30,30,30,0.75)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    const hue = Math.round(18 + progress * 102);
    ctx.fillStyle = `hsl(${hue} 92% 52%)`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle, false);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.24)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function updateEyegazeDwell() {
    const hovered = findEyegazeTarget();
    const now = gameNow();
    if (!hovered) {
      hoveredEnemyId = null;
      hoverStartAt = 0;
      return;
    }

    if (hoveredEnemyId !== hovered.id) {
      hoveredEnemyId = hovered.id;
      hoverStartAt = now;
      return;
    }

    if (hoverStartAt && now - hoverStartAt >= EYEGAZE_DWELL_MS) {
      if (online) online.fire(hovered.id);
      else launchEyegazeProjectile(hovered);
      hoveredEnemyId = null;
      hoverStartAt = 0;
    }
  }

  function findEyegazeTarget() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    const x = (gazeX - bounds.left) * arenaWidth / bounds.width;
    const y = (gazeY - bounds.top) * arenaHeight / bounds.height;
    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const e = enemies[i];
      if ((!online && !e.eyegazeTile) || e.resolved || e.attackState) continue;
      const half = e.size * 0.5;
      if (x >= e.x - half && x <= e.x + half && y >= e.y - half && y <= e.y + half) {
        return e;
      }
    }
    return null;
  }

  function launchEyegazeProjectile(target, ship = selectedShip, shooter = player) {
    if (!target || target.resolved || target.attackState || gameOverPending) return;
    if (target.eyegazeTile) target.resolved = true;
    const muzzleX = shooter.x;
    const muzzleY = shooter.y - 16;
    const speed = getProjectileSpeed(ship);
    const dx = target.x - muzzleX;
    const dy = target.y - muzzleY;
    const dist = Math.hypot(dx, dy) || 1;

    bullets.push(createProjectileData({
      x: muzzleX,
      y: muzzleY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      speed,
      targetId: target.id,
      homing: true,
      ship
    }));

    playSfx('launch');
  }

  function updateHud() {
    if (online) return updateHudLanguage();
    scoreNode.textContent = `Score: ${score}`;
    livesNode.style.display = hasLimitedLives() ? '' : 'none';
    if (hasLimitedLives()) livesNode.textContent = `Shield: ${lives}`;
  }

  function getCurrentLanguage() {
    return (typeof getStoredLanguage === 'function' ? getStoredLanguage() : (document.documentElement.lang || 'fr')) || 'fr';
  }

  function updateHudLanguage() {
    const lang = getCurrentLanguage();
    const scoreLabel = lang === 'fr' ? 'Score' : lang === 'ja' ? 'スコア' : 'Score';
    const livesLabel = lang === 'fr' ? 'Bouclier' : lang === 'ja' ? 'シールド' : 'Shield';
    scoreNode.textContent = `${scoreLabel}: ${score}`;
    livesNode.style.display = hasLimitedLives() ? '' : 'none';
    if (hasLimitedLives()) livesNode.textContent = `${livesLabel}: ${lives}`;
  }

  function getScoreGameKey() {
    if (inputMode === 'eyegaze') return SCORE_GAMES.eyegaze;
    if (inputMode === 'switch2p') return SCORE_GAMES.switch2p;
    return SCORE_GAMES.switch;
  }

  function getSelectedModeForScoreboard() {
    return ['normal', 'hard', 'competitive'].includes(difficulty) ? difficulty : 'normal';
  }

  function getScorePanelCopy() {
    const lang = getCurrentLanguage();
    const copy = {
      fr: {
        registerQuestion: 'Enregistre ton score dans le classement.',
        nameLabel: 'Votre nom',
        submit: 'Enregistrer',
        retry: 'Recommencer',
        sending: 'Enregistrement du score...',
        submitSuccess: 'Score enregistré.',
        submitError: 'Impossible d\'enregistrer le score pour le moment.',
        emptyName: 'Veuillez entrer un nom.',
        leaderboardTitle: (mode) => `Top ${SCORE_TOP_LIMIT} (${mode})`,
        emptyLeaderboard: 'Aucun score pour le moment.',
        loadingLeaderboard: 'Chargement du classement...',
        leaderboardError: 'Impossible de charger le classement.',
        anonymous: 'Anonyme',
        modes: { normal: 'Normal', hard: 'Difficile', competitive: 'Maître' }
      },
      en: {
        registerQuestion: 'Save your score to the leaderboard.',
        nameLabel: 'Your name',
        submit: 'Submit score',
        retry: 'Retry',
        sending: 'Submitting score...',
        submitSuccess: 'Score submitted.',
        submitError: 'Unable to submit score right now.',
        emptyName: 'Please enter a name.',
        leaderboardTitle: (mode) => `Top ${SCORE_TOP_LIMIT} (${mode})`,
        emptyLeaderboard: 'No scores yet.',
        loadingLeaderboard: 'Loading leaderboard...',
        leaderboardError: 'Unable to load leaderboard.',
        anonymous: 'Anonymous',
        modes: { normal: 'Normal', hard: 'Hard', competitive: 'Master' }
      },
      ja: {
        registerQuestion: 'スコアをランキングに登録します。',
        nameLabel: '名前',
        submit: 'スコア登録',
        retry: 'もう一度',
        sending: 'スコアを送信中...',
        submitSuccess: 'スコアを登録しました。',
        submitError: '現在スコアを登録できません。',
        emptyName: '名前を入力してください。',
        leaderboardTitle: (mode) => `トップ${SCORE_TOP_LIMIT}（${mode}）`,
        emptyLeaderboard: 'まだスコアがありません。',
        loadingLeaderboard: 'ランキングを読み込み中...',
        leaderboardError: 'ランキングを読み込めません。',
        anonymous: '匿名',
        modes: { normal: 'ノーマル', hard: 'ハード', competitive: 'マスター' }
      }
    };
    return copy[lang] || copy.en;
  }

  function getModeLabelForLeaderboard(mode, copy) {
    return copy?.modes?.[mode] || mode;
  }

  function setScoreStatusMessage(message, isError) {
    if (!scoreRegisterStatus) return;
    scoreRegisterStatus.textContent = message || '';
    scoreRegisterStatus.classList.toggle('is-error', Boolean(isError));
  }

  function updateScorePanelCopy() {
    const copy = getScorePanelCopy();
    if (scoreRegisterQuestion) scoreRegisterQuestion.textContent = copy.registerQuestion;
    if (scorePlayerNameLabel) scorePlayerNameLabel.textContent = copy.nameLabel;
    if (scoreSubmitButton) scoreSubmitButton.textContent = copy.submit;
    if (scoreRetryButton) scoreRetryButton.textContent = copy.retry;
    if (scoreSubmissionState === 'sending') setScoreStatusMessage(copy.sending, false);
  }

  function updateGameOverOptionLabels() {
    const lang = getCurrentLanguage();
    if (retryEyegazeLabel) {
      retryEyegazeLabel.textContent =
        lang === 'fr' ? 'Réessayer' :
        lang === 'ja' ? 'もう一度' :
        'Retry';
    }
    if (registerEyegazeLabel) {
      registerEyegazeLabel.textContent =
        lang === 'fr' ? 'Entrer ton score' :
        lang === 'ja' ? 'スコアを登録' :
        'Enter your score';
    }
  }

  function resetScoreEyegazeFills() {
    scoreSubmitHoverStartAt = 0;
    scoreRetryHoverStartAt = 0;
    if (scoreSubmitFill) scoreSubmitFill.style.transform = 'scale(0)';
    if (scoreRetryFill) scoreRetryFill.style.transform = 'scale(0)';
  }

  function startEyegazeScoreMonitor() {
    if (inputMode !== 'eyegaze') return;
    if (scoreRafId) cancelAnimationFrame(scoreRafId);
    resetScoreEyegazeFills();

    const loop = () => {
      if (running || !gameOverScreen || gameOverScreen.style.display !== 'flex' || gameOverMenuVisible || inputMode !== 'eyegaze') return;
      const now = performance.now();
      const submitRect = scoreSubmitButton?.getBoundingClientRect();
      const retryRect = scoreRetryButton?.getBoundingClientRect();
      const overSubmit = submitRect && gazeX >= submitRect.left && gazeX <= submitRect.right && gazeY >= submitRect.top && gazeY <= submitRect.bottom;
      const overRetry = retryRect && gazeX >= retryRect.left && gazeX <= retryRect.right && gazeY >= retryRect.top && gazeY <= retryRect.bottom;

      if (overSubmit) {
        if (!scoreSubmitHoverStartAt) scoreSubmitHoverStartAt = now;
        const progress = Math.max(0, Math.min(1, (now - scoreSubmitHoverStartAt) / EYEGAZE_DWELL_MS));
        if (scoreSubmitFill) scoreSubmitFill.style.transform = `scale(${progress})`;
        scoreRetryHoverStartAt = 0;
        if (scoreRetryFill) scoreRetryFill.style.transform = 'scale(0)';
        if (progress >= 1) {
          handleScoreSubmission();
          return;
        }
      } else if (overRetry) {
        if (!scoreRetryHoverStartAt) scoreRetryHoverStartAt = now;
        const progress = Math.max(0, Math.min(1, (now - scoreRetryHoverStartAt) / EYEGAZE_DWELL_MS));
        if (scoreRetryFill) scoreRetryFill.style.transform = `scale(${progress})`;
        scoreSubmitHoverStartAt = 0;
        if (scoreSubmitFill) scoreSubmitFill.style.transform = 'scale(0)';
        if (progress >= 1) {
          playSfx('retry');
          startGame();
          return;
        }
      } else {
        resetScoreEyegazeFills();
      }

      scoreRafId = requestAnimationFrame(loop);
    };

    scoreRafId = requestAnimationFrame(loop);
  }

  function setScoreUiVisible(showScorePanel) {
    const show = Boolean(showScorePanel);
    gameOverMenuVisible = inputMode === 'switch' ? true : !show;
    gameOverScreen?.classList.toggle('switch-score-screen', show && inputMode === 'switch');
    if (scoreUiLayout) scoreUiLayout.style.display = show ? 'grid' : 'none';
    if (scoreRegisterPanel) {
      scoreRegisterPanel.classList.toggle('hidden', !show);
      scoreRegisterPanel.style.display = show ? 'block' : 'none';
    }
    if (leaderboardPanel) {
      leaderboardPanel.classList.toggle('hidden', !show);
      leaderboardPanel.style.display = show ? 'flex' : 'none';
    }
    restartButton.style.display = inputMode === 'switch' ? 'inline-flex' : 'none';
    if (retryEyegazeTiles) retryEyegazeTiles.style.display = show || inputMode !== 'eyegaze' ? 'none' : 'grid';
  }

  async function submitScore(game, playerName, scoreValue, mode) {
    const response = await fetch(SCORE_API_BASE + '/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, playerName, score: scoreValue, mode })
    });
    if (!response.ok) throw new Error('submit_failed');
    return response.json();
  }

  async function getLeaderboard(game, mode, limit) {
    const params = new URLSearchParams({ game, mode, limit: String(limit) });
    const response = await fetch(SCORE_API_BASE + '/leaderboard?' + params.toString());
    if (!response.ok) throw new Error('leaderboard_failed');
    return response.json();
  }

  async function renderLeaderboard() {
    if (!leaderboardPanel || !leaderboardList || !leaderboardTitle) return;
    const copy = getScorePanelCopy();
    const mode = getSelectedModeForScoreboard();
    leaderboardTitle.textContent = copy.leaderboardTitle(getModeLabelForLeaderboard(mode, copy));
    leaderboardPanel.classList.remove('hidden');
    leaderboardList.innerHTML = '';
    const loadingItem = document.createElement('li');
    loadingItem.textContent = copy.loadingLeaderboard;
    leaderboardList.appendChild(loadingItem);
    try {
      const data = await getLeaderboard(getScoreGameKey(), mode, SCORE_TOP_LIMIT);
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      leaderboardList.innerHTML = '';
      if (!rows.length) {
        const empty = document.createElement('li');
        empty.textContent = copy.emptyLeaderboard;
        leaderboardList.appendChild(empty);
        return;
      }
      rows.slice(0, SCORE_TOP_LIMIT).forEach((row, index) => {
        const item = document.createElement('li');
        const medal = index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : '';
        const name = typeof row?.player_name === 'string' && row.player_name.trim() ? row.player_name.trim() : copy.anonymous;
        const value = Number.isFinite(Number(row?.score)) ? Number(row.score) : 0;
        item.textContent = `${medal}${name} — ${value}`;
        leaderboardList.appendChild(item);
      });
    } catch (_) {
      leaderboardList.innerHTML = '';
      const error = document.createElement('li');
      error.textContent = copy.leaderboardError;
      leaderboardList.appendChild(error);
    }
  }

  function resetScorePanel() {
    scoreSubmissionState = 'idle';
    if (scorePlayerNameInput) {
      scorePlayerNameInput.disabled = false;
      scorePlayerNameInput.value = '';
    }
    if (scoreSubmitButton) scoreSubmitButton.disabled = false;
    if (scoreRetryButton) scoreRetryButton.disabled = false;
    resetScoreEyegazeFills();
    setScoreStatusMessage('', false);
    updateScorePanelCopy();
  }

  async function handleScoreSubmission() {
    if (scoreSubmissionState === 'sending' || scoreSubmissionState === 'submitted') return;
    const copy = getScorePanelCopy();
    const playerName = (scorePlayerNameInput?.value || '').trim();
    if (!playerName) {
      setScoreStatusMessage(copy.emptyName, true);
      scorePlayerNameInput?.focus();
      return;
    }

    scoreSubmissionState = 'sending';
    if (scoreSubmitButton) scoreSubmitButton.disabled = true;
    if (scoreRetryButton) scoreRetryButton.disabled = true;
    setScoreStatusMessage(copy.sending, false);

    try {
      await submitScore(getScoreGameKey(), playerName.slice(0, 20), score, getSelectedModeForScoreboard());
      scoreSubmissionState = 'submitted';
      if (scorePlayerNameInput) scorePlayerNameInput.disabled = true;
      if (scoreRetryButton) scoreRetryButton.disabled = true;
      setScoreStatusMessage(copy.submitSuccess, false);
      await renderLeaderboard();
      setTimeout(() => {
        if (!running) startGame();
      }, 900);
    } catch (_) {
      scoreSubmissionState = 'idle';
      if (scoreSubmitButton) scoreSubmitButton.disabled = false;
      if (scoreRetryButton) scoreRetryButton.disabled = false;
      setScoreStatusMessage(copy.submitError, true);
    }
  }

  function getStartingShields() {
    if (difficulty === 'hard') return selectedShip === 'blue' ? 6 : 5;
    if (difficulty === 'competitive') return selectedShip === 'blue' ? 3 : 2;
    return 0;
  }

  function hasLimitedLives() {
    return difficulty !== 'normal';
  }

  function loseLife() {
    if (!hasLimitedLives()) return false;
    lives -= 1;
    updateHud();
    if (lives <= 0) {
      triggerGameOverSequence();
      return true;
    }
    return false;
  }

  function triggerGameOverSequence() {
    if (gameOverPending) return;
    gameOverPending = true;
    gameOverPendingAt = gameNow();
    enemySpawnTimer = 0;
    hoveredEnemyId = null;
    hoverStartAt = 0;
    bullets.length = 0;
    triggerScreenShake(GAME_OVER_DELAY_MS, 14);
    spawnProjectileBurst(player.x, player.y - 12, 120);
    spawnProjectileBurst(player.x + 22, player.y + 4, 70);
    spawnProjectileBurst(player.x - 20, player.y + 8, 64);
    music.pause();
  }

  function usesAmmoMeter() {
    return (difficulty === 'hard' || difficulty === 'competitive') && !usesGazeField();
  }

  function isSwitchScoreScreenVisible() {
    return !usesGazeControls() && gameOverScreen?.classList.contains('switch-score-screen');
  }

  function updateCursorVisibility() {
    if (isSwitchScoreScreenVisible()) {
      document.body.style.cursor = '';
      return;
    }
    const inGameplayFlow = running || (!online && gameOverScreen?.style.display === 'flex');
    document.body.style.cursor = inGameplayFlow ? 'none' : '';
  }

  function playSfx(type) {
    if (online?.isHost && running && type !== 'start') onlineEffects.push(['sound', type]);
    const map = {
      launch: document.getElementById('sfx-launch'),
      hit: document.getElementById('sfx-hit'),
      destroy: document.getElementById('sfx-destroy'),
      shield: document.getElementById('sfx-shield'),
      retry: document.getElementById('sfx-retry'),
      start: document.getElementById('sfx-start')
    };
    const base = map[type] || map.start;
    if (!base) return;
    const sfx = base.cloneNode(true);
    sfx.volume = type === 'destroy' || type === 'shield' ? 0.5 : 0.35;
    sfx.play().catch(() => {});
  }

  function getShotCost() {
    return difficulty === 'competitive' ? 0.55 : 0.35;
  }

  function getAmmoRegenPerSecond(ship = selectedShip) {
    const baseRegen = difficulty === 'competitive' ? 0.22 : 0.3;
    return ship === 'blue' ? baseRegen * 0.7 : baseRegen;
  }

  function renderAmmoFill(fillNode, energy, ship = 'blue') {
    if (!fillNode) return;
    const percent = Math.round(energy * 100);
    const hue = ship === 'red' ? 0 : Math.round(energy * 120);
    fillNode.style.height = `${percent}%`;
    fillNode.style.background = ship === 'red'
      ? `hsl(${hue} 85% ${40 + energy * 16}%)`
      : `hsl(${hue} 88% 52%)`;
    fillNode.style.boxShadow = ship === 'red'
      ? `0 0 16px hsla(${hue} 95% 60% / ${0.35 + energy * 0.35})`
      : `0 0 16px hsla(${hue} 95% 60% / 0.65)`;
  }

  function updateAmmoMeter() {
    if (!ammoMeter || !ammoMeterFill) return;
    updateAmmoMeterLayout();
    updateHudLayout();
    const show = usesAmmoMeter();
    const showDual = show && inputMode === 'switch2p';
    ammoMeter.style.display = show && online?.inputs[0] !== 'gaze' ? 'block' : 'none';
    if (ammoMeterRight) ammoMeterRight.style.display = showDual && online?.inputs[1] !== 'gaze' ? 'block' : 'none';

    if (showDual) {
      renderAmmoFill(ammoMeterFill, ammoEnergyByShip.blue, 'blue');
      renderAmmoFill(ammoMeterFillRight, ammoEnergyByShip.red, 'red');
    } else {
      renderAmmoFill(ammoMeterFill, ammoEnergy, selectedShip);
    }
  }

  function updateAmmoMeterLayout() {
    const shield = getDangerLineY() / arenaHeight;
    const top = shield + Math.max(0, (1 - shield - 0.25) / 2);
    hud.style.setProperty('--ammo-top', `${100 * top}%`);
  }

  function updateHudLayout() {
    if (!hud) return;
    const rightMeter = inputMode === 'switch2p' && usesAmmoMeter() && online?.inputs[1] !== 'gaze';
    hud.style.setProperty('--hud-right', rightMeter ? '8.6%' : '1.4%');
  }

  function tick(ts) {
    if (!running) return;
    if (pausedAt !== null || (online?.isHost && document.hidden)) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    const time = online ? gameNow() : ts;
    const dt = Math.min(0.033, Math.max(0, (time - lastTs) / 1000) || 0.016);
    lastTs = time;

    updateStars(dt);
    if (!online || online.isHost) {
      updateGame(dt);
    } else {
      interpolateOnlineFrame();
      updateFx(dt);
      if (!gameOverPending && usesGazeControls()) updateEyegazeDwell();
      online.requestFrame();
    }

    drawFrame();
    if (online && running) online.publish(captureOnlineFrame);
    rafId = requestAnimationFrame(tick);
  }

  function advanceBackgroundFrame() {
    if (!running || pausedAt !== null || !document.hidden) return;
    const now = gameNow();
    let remaining = Math.min(0.25, Math.max(0, (now - lastTs) / 1000));
    lastTs = now;
    hoveredEnemyId = null;
    hoverStartAt = 0;
    // The guest can ask for a frame while the browser pauses the host's animation loop.
    while (running && remaining > 0) {
      const step = Math.min(remaining, 1 / 60);
      updateStars(step);
      updateGame(step);
      remaining -= step;
    }
    if (running) online.publish(captureOnlineFrame);
  }

  function drawFrame() {
    const shake = getScreenShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    drawStars();
    drawEyegazeDangerLine();
    drawEnemies();
    drawFxBursts();
    drawBullets();
    drawImpactFlash();
    drawPlayer();
    drawNormalModeTimer();
    drawFailureOverlay();

    ctx.restore();
  }

  function captureOnlineFrame() {
    return {
      now: gameNow(),
      score,
      lives,
      players,
      player,
      energy: ammoEnergyByShip,
      bullets,
      enemies: enemies.map(({ image, ...enemy }) => ({
        ...enemy,
        sprite: image === heavyEnemySprite ? 0 : enemySprites.indexOf(image)
      })),
      timers: {
        normalModeEndsAt, gameOverPendingAt, gameOverPending, shieldFlashUntil, shieldFlashStartedAt,
        projectileFlashUntil, screenShakeUntil, screenShakeStrength, nextEnemyId, nextProjectileId,
        currentSpawnDelay, enemySpawnTimer, motionTime
      },
      effects: onlineEffects.splice(0)
    };
  }

  function applyOnlineFrame(frame, restoreHost = false) {
    onlineTimeOffset = (pausedAt ?? performance.now()) - frame.now;
    const oldEnemies = new Map(enemies.map(enemy => [enemy.id, enemy]));
    const oldShots = new Map(bullets.map(shot => [shot.id, shot]));
    const from = { blue: { ...players.blue }, red: { ...players.red } };
    const targetEnemies = frame.enemies.map(({ sprite, ...enemy }) => ({
      ...enemy,
      image: enemySprites[sprite] ?? null
    }));
    const targetShots = frame.bullets.map(shot => ({ ...shot }));

    score = frame.score;
    lives = frame.lives;
    Object.assign(player, frame.player);
    Object.assign(players.blue, frame.players.blue);
    Object.assign(players.red, frame.players.red);
    Object.assign(ammoEnergyByShip, frame.energy);
    ({
      normalModeEndsAt, gameOverPendingAt, gameOverPending, shieldFlashUntil, shieldFlashStartedAt,
      projectileFlashUntil, screenShakeUntil, screenShakeStrength, nextEnemyId, nextProjectileId,
      currentSpawnDelay, enemySpawnTimer, motionTime
    } = frame.timers);
    enemies.splice(0, enemies.length, ...targetEnemies);
    bullets.splice(0, bullets.length, ...targetShots);

    if (!restoreHost) {
      const motion = (entity, start) => start && {
        entity, fromX: start.x, fromY: start.y, toX: entity.x, toY: entity.y
      };
      previousFrame = [
        motion(players.blue, from.blue), motion(players.red, from.red),
        ...targetEnemies.map(enemy => motion(enemy, oldEnemies.get(enemy.id))),
        ...targetShots.map(shot => motion(shot, oldShots.get(shot.id)))
      ].filter(Boolean);
      lastFrameAt = performance.now();
      const effects = {
        laser: spawnLaserDamageBurst,
        breach: spawnEyegazeBottomBurst,
        projectile: spawnProjectileBurst,
        shield: spawnShieldContactBurst,
        flash: triggerShieldFlash,
        shake: triggerScreenShake,
        sound: playSfx
      };
      for (const [name, ...args] of frame.effects) {
        if (Object.hasOwn(effects, name)) effects[name](...args);
      }
      if (gameOverPending) music.pause();
    }
    updateHud();
    updateAmmoMeter();
    lastTs = gameNow();
    drawFrame();
  }

  function interpolateOnlineFrame() {
    if (!previousFrame) return;
    const progress = Math.min(1, (performance.now() - lastFrameAt) / online.frameInterval);
    for (const { entity, fromX, fromY, toX, toY } of previousFrame) {
      entity.x = fromX + (toX - fromX) * progress;
      entity.y = fromY + (toY - fromY) * progress;
    }
  }

  function setOnlinePaused(paused) {
    if (paused === (pausedAt !== null)) return;
    if (paused) {
      pausedAt = performance.now();
      hoveredEnemyId = null;
      hoverStartAt = 0;
      music.pause();
    } else {
      onlineTimeOffset += performance.now() - pausedAt;
      pausedAt = null;
      lastTs = gameNow();
      if (running && !gameOverPending) music.play().catch(() => {});
    }
  }

  function fireOnlinePlayer(seat, targetId) {
    if (!running || pausedAt !== null || gameOverPending) return;
    const ship = seat === 0 ? 'blue' : 'red';
    if (online.inputs[seat] === 'gaze') {
      launchEyegazeProjectile(findEnemyById(targetId), ship, players[ship]);
    } else {
      shoot(ship);
    }
  }

  function showOnlineResult(finalScore) {
    score = finalScore;
    updateHud();
    if (!running && gameOverScreen.style.display === 'flex') {
      const lang = getCurrentLanguage();
      const label = lang === 'fr' ? 'Score final' : lang === 'ja' ? '最終スコア' : 'Final score';
      gameOverScore.textContent = `${label}: ${score}`;
      return;
    }
    running = false;
    controlPanel.style.display = 'none';
    gameContainer.style.display = 'block';
    hud.style.display = 'block';
    languageToggleButton.style.display = 'none';
    showGameOverScreen();
  }

  function returnToOnlineLobby() {
    running = false;
    cancelAnimationFrame(rafId);
    cancelAnimationFrame(retryRafId);
    clearTimeout(musicStartTimeoutId);
    music.pause();
    controlPanel.style.display = 'flex';
    gameContainer.style.display = 'none';
    hud.style.display = 'none';
    gameOverScreen.style.display = 'none';
    languageToggleButton.style.display = '';
    updateCursorVisibility();
    updateGazePointer(gazeX, gazeY);
  }

  function startGame() {
    if (!assetsReady) return;

    stopMenuMusic();

    controlPanel.style.display = 'none';
    gameContainer.style.display = 'block';
    hud.style.display = 'block';
    gameOverScreen.style.display = 'none';
    if (languageToggleButton) languageToggleButton.style.display = 'none';
    if (retryRafId) cancelAnimationFrame(retryRafId);
    retryRafId = null;
    if (scoreRafId) cancelAnimationFrame(scoreRafId);
    scoreRafId = null;
    retryHoverStartAt = 0;
    registerHoverStartAt = 0;
    resetScoreEyegazeFills();
    if (retryEyegazeFill) retryEyegazeFill.style.transform = 'scale(0)';
    if (registerEyegazeFill) registerEyegazeFill.style.transform = 'scale(0)';
    if (retryEyegazeTiles) retryEyegazeTiles.style.display = 'none';
    if (retryHint) retryHint.textContent = '';
    if (restartButton) restartButton.style.display = 'none';
    setScoreUiVisible(false);
    resetScorePanel();

    resizeCanvas(true);
    if (online) {
      onlineTimeOffset = 0;
      pausedAt = null;
      previousFrame = null;
      nextProjectileId = 1;
      onlineEffects.length = 0;
      players.blue.cooldown = 0;
      players.red.cooldown = 0;
    }
    score = 0;
    lives = getStartingShields();
    bullets.length = 0;
    enemies.length = 0;
    fxBursts.length = 0;
    enemySpawnTimer = 0;
    currentSpawnDelay = getSpawnDelayMs();
    motionTime = 0;
    ammoEnergy = 1;
    ammoEnergyByShip.blue = 1;
    ammoEnergyByShip.red = 1;
    hoveredEnemyId = null;
    hoverStartAt = 0;
    screenShakeUntil = 0;
    screenShakeStrength = 0;
    gameOverPending = false;
    gameOverPendingAt = 0;
    normalModeEndsAt = difficulty === 'normal' ? gameNow() + NORMAL_MODE_DURATION_MS : 0;
    player.x = arenaWidth * 0.5;
    running = true;
    updateHudLanguage();
    updateShipPanelLanguage();
    updateAmmoMeter();
    updateCursorVisibility();

    if (!online || online.isHost) spawnEnemy();
    playSfx('start');
    prepareGameplayMusic();
    music.pause();
    music.currentTime = 0;
    if (musicStartTimeoutId) clearTimeout(musicStartTimeoutId);
    musicStartTimeoutId = setTimeout(() => {
      if (!running || gameOverPending || pausedAt !== null) return;
      try { music.currentTime = 0; music.play(); } catch (_) {}
    }, 3000);

    if (!online && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }

    lastTs = gameNow();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function showGameOverScreen() {
    if (online?.isHost && running) online.finish();
    running = false;
    gameOverPending = false;
    cancelAnimationFrame(rafId);
    if (musicStartTimeoutId) {
      clearTimeout(musicStartTimeoutId);
      musicStartTimeoutId = null;
    }
    music.pause();
    updateCursorVisibility();
    if (gazePointer) gazePointer.style.opacity = '0';

    const lang = getCurrentLanguage();
    const finalScoreLabel = lang === 'fr' ? 'Score final' : lang === 'ja' ? '最終スコア' : 'Final score';
    gameOverScore.textContent = `${finalScoreLabel}: ${score}`;

    if (retryRafId) cancelAnimationFrame(retryRafId);
    retryRafId = null;
    if (scoreRafId) cancelAnimationFrame(scoreRafId);
    scoreRafId = null;
    retryHoverStartAt = 0;
    registerHoverStartAt = 0;
    resetScoreEyegazeFills();
    if (retryEyegazeFill) retryEyegazeFill.style.transform = 'scale(0)';
    if (registerEyegazeFill) registerEyegazeFill.style.transform = 'scale(0)';
    if (restartButton) restartButton.style.display = 'none';
    resetScorePanel();
    updateGameOverOptionLabels();

    if (online) {
      setScoreUiVisible(false);
      restartButton.style.display = 'inline-flex';
    } else if (inputMode === 'eyegaze') {
      setScoreUiVisible(false);
      if (retryHint) retryHint.textContent = lang === 'fr' ? 'Réessayer ?' : lang === 'ja' ? 'もう一度？' : 'Try again?';
      if (retryEyegazeTiles) retryEyegazeTiles.style.display = 'grid';
      startEyegazeRetryMonitor();
    } else {
      setScoreUiVisible(true);
      if (retryHint) retryHint.textContent = lang === 'fr' ? 'Appuie sur ton switch pour recommencer' : lang === 'ja' ? 'スイッチで再開' : 'Press your switch to retry';
      if (retryEyegazeTiles) retryEyegazeTiles.style.display = 'none';
      if (restartButton) restartButton.style.display = 'inline-flex';
      renderLeaderboard();
    }

    gameOverScreen.style.display = 'flex';
    updateCursorVisibility();
    updateGazePointer(gazeX, gazeY);
    online?.render();
  }

  function showScoreEntryScreen() {
    if (!gameOverScreen || gameOverScreen.style.display !== 'flex') return;
    if (retryRafId) cancelAnimationFrame(retryRafId);
    retryRafId = null;
    if (scoreRafId) cancelAnimationFrame(scoreRafId);
    scoreRafId = null;
    retryHoverStartAt = 0;
    registerHoverStartAt = 0;
    if (retryEyegazeFill) retryEyegazeFill.style.transform = 'scale(0)';
    if (registerEyegazeFill) registerEyegazeFill.style.transform = 'scale(0)';
    setScoreUiVisible(true);
    scorePlayerNameInput?.focus();
    renderLeaderboard();
    startEyegazeScoreMonitor();
  }

  function startEyegazeRetryMonitor() {
    if (inputMode !== 'eyegaze') return;
    const loop = () => {
      if (running || !gameOverScreen || gameOverScreen.style.display !== 'flex' || !gameOverMenuVisible) return;
      const retryRect = retryEyegazeTile?.getBoundingClientRect();
      const registerRect = registerEyegazeTile?.getBoundingClientRect();
      if (!retryRect || !registerRect) return;
      const now = performance.now();
      const insideRetry = gazeX >= retryRect.left && gazeX <= retryRect.right && gazeY >= retryRect.top && gazeY <= retryRect.bottom;
      const insideRegister = gazeX >= registerRect.left && gazeX <= registerRect.right && gazeY >= registerRect.top && gazeY <= registerRect.bottom;

      if (insideRetry) {
        if (!retryHoverStartAt) retryHoverStartAt = now;
        const progress = Math.max(0, Math.min(1, (now - retryHoverStartAt) / EYEGAZE_DWELL_MS));
        if (retryEyegazeFill) retryEyegazeFill.style.transform = `scale(${progress})`;
        registerHoverStartAt = 0;
        if (registerEyegazeFill) registerEyegazeFill.style.transform = 'scale(0)';
        if (progress >= 1) {
          playSfx('retry');
          startGame();
          return;
        }
      } else if (insideRegister) {
        if (!registerHoverStartAt) registerHoverStartAt = now;
        const progress = Math.max(0, Math.min(1, (now - registerHoverStartAt) / EYEGAZE_DWELL_MS));
        if (registerEyegazeFill) registerEyegazeFill.style.transform = `scale(${progress})`;
        retryHoverStartAt = 0;
        if (retryEyegazeFill) retryEyegazeFill.style.transform = 'scale(0)';
        if (progress >= 1) {
          showScoreEntryScreen();
          return;
        }
      } else {
        retryHoverStartAt = 0;
        registerHoverStartAt = 0;
        if (retryEyegazeFill) retryEyegazeFill.style.transform = 'scale(0)';
        if (registerEyegazeFill) registerEyegazeFill.style.transform = 'scale(0)';
      }
      retryRafId = requestAnimationFrame(loop);
    };
    retryRafId = requestAnimationFrame(loop);
  }

  function applyInputMode(mode) {
    inputMode = mode === 'eyegaze' ? 'eyegaze' : mode === 'switch2p' ? 'switch2p' : 'switch';
    document.body.setAttribute('data-input-mode', inputMode);

    if (!online) {
      const buttons = document.querySelectorAll('.input-mode-btn');
      for (const button of buttons) {
        const selected = button.dataset.inputMode === inputMode;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      }
      const multiplayer = document.getElementById('multiplayer-toggle');
      multiplayer.search = `?mode=multiplayer&input=${inputMode === 'eyegaze' ? 'gaze' : 'switch'}`;
    }

    updateShipCardSelection();
    updateAmmoMeter();
    updateCursorVisibility();
  }

  function applyDifficulty(mode) {
    difficulty = ['normal', 'hard', 'competitive'].includes(mode) ? mode : 'normal';
    const modeButtons = Array.from(document.querySelectorAll('#stop-action-mode-segmented-control .stop-action-mode-btn'));
    modeButtons.forEach((button) => {
      const selected = button.dataset.mode === difficulty;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    const desc = document.getElementById('stop-action-mode-description');
    if (!desc) return;

    if (difficulty === 'hard') {
      desc.dataset.fr = 'Les ennemis sont plus rapides et apparaissent plus vite. Les ennemis blindés apparaissent aussi.';
      desc.dataset.en = 'Enemies are faster and spawn faster. Armored enemies also appear.';
      desc.dataset.ja = '敵の速度と出現が速くなります。装甲敵も登場します。';
    } else if (difficulty === 'competitive') {
      desc.dataset.fr = 'Les ennemis sont encore plus rapides et apparaissent encore plus vite. Il y a moins de vies.';
      desc.dataset.en = 'Enemies are even faster and spawn even faster. You also have fewer shields.';
      desc.dataset.ja = '敵はさらに速く出現もさらに早くなります。ライフも少なくなります。';
    } else {
      desc.dataset.fr = 'Cadence équilibrée pour commencer. Partie limitée à 5 minutes.';
      desc.dataset.en = 'Balanced pace to get started. Match is limited to 5 minutes.';
      desc.dataset.ja = '始めやすいバランス設定です。5分で終了します。';
    }

    const lang = getCurrentLanguage();
    desc.textContent = lang === 'en' ? desc.dataset.en : lang === 'ja' ? desc.dataset.ja : desc.dataset.fr;
    updateAmmoMeter();
  }

  document.addEventListener('keydown', (event) => {
    if (!menuMusicStarted && assetsReady && !running) tryStartMenuMusic();

    if (online) {
      if (!event.target.closest('input, button, a, select') && !event.repeat &&
          (event.code === 'Space' || event.key === 'Enter') && !usesGazeControls()) {
        if (running) {
          event.preventDefault();
          online.fire();
        } else if (gameOverScreen.style.display === 'flex') {
          event.preventDefault();
          online.ready();
        }
      }
      return;
    }

    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      if (switchIsDown) return;
      switchIsDown = true;
      if (running && !gameOverPending) shoot(inputMode === 'switch2p' ? 'blue' : selectedShip);
      else if (!running && inputMode !== 'eyegaze' && gameOverScreen?.style.display === 'flex' && gameOverMenuVisible) {
        playSfx('retry');
        startGame();
      }
    } else if (event.key === 'Enter' && inputMode === 'switch2p') {
      event.preventDefault();
      if (running && !gameOverPending) shoot('red');
    }
  });

  document.addEventListener('keyup', (event) => {
    if (event.key === ' ' || event.code === 'Space') {
      switchIsDown = false;
    }
  });

  document.addEventListener('pointerdown', () => {
    if (assetsReady && !running) tryStartMenuMusic();
  }, { passive: true });

  const gazePointer = document.getElementById('gazePointer');
  function updateGazePointer(x, y) {
    gazeX = x;
    gazeY = y;
    const eyegazeActive = usesGazeControls() && (running || (!online && gameOverScreen?.style.display === 'flex'));
    if (!eyegazeActive) {
      if (gazePointer) gazePointer.style.opacity = '0';
      return;
    }
    if (gazePointer) {
      gazePointer.style.display = 'block';
      gazePointer.style.opacity = '1';
      gazePointer.style.left = `${x}px`;
      gazePointer.style.top = `${y}px`;
    }
  }

  document.addEventListener('pointermove', (event) => {
    updateGazePointer(event.clientX, event.clientY);
  });

  startButton.addEventListener('click', () => {
    if (online) online.ready();
    else startGame();
  });

  restartButton.addEventListener('click', () => {
    if (online) {
      online.ready();
    } else {
      playSfx('retry');
      startGame();
    }
  });

  scoreSubmitButton?.addEventListener('click', handleScoreSubmission);
  scoreRetryButton?.addEventListener('click', () => {
    playSfx('retry');
    startGame();
  });
  scorePlayerNameInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleScoreSubmission();
    }
  });

  document.getElementById('language-toggle')?.addEventListener('pointerup', () => {
    toggleLanguage();
    updateHudLanguage();
    applyDifficulty(difficulty);
    updateShipPanelLanguage();
    updateScorePanelCopy();
    updateGameOverOptionLabels();
    online?.render();
  });

  if (!online) {
    for (const button of document.querySelectorAll('.input-mode-btn')) {
      button.addEventListener('click', () => applyInputMode(button.dataset.inputMode));
    }
  }

  Array.from(document.querySelectorAll('#stop-action-mode-segmented-control .stop-action-mode-btn')).forEach((button) => {
    button.addEventListener('click', () => {
      applyDifficulty(button.dataset.mode);
      online?.chooseDifficulty(difficulty);
    });
  });

  for (const card of shipCards) {
    if (online) {
      card.disabled = true;
      card.removeAttribute('aria-pressed');
    } else {
      card.addEventListener('click', () => applyShipChoice(card.dataset.ship));
    }
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    resizeMenuStarsCanvas();
    if (running) {
      drawFrame();
    } else if (!running) {
      drawStars();
      drawPlayer();
    }
  });

  shipCards.forEach((card) => {
    const speedBarNode = card.querySelector('.ship-card-speed-bar');
    const shieldsBarNode = card.querySelector('.ship-card-shields-bar');
    if (speedBarNode) createSegments(speedBarNode, 10);
    if (shieldsBarNode) createSegments(shieldsBarNode, 10);
  });

  resizeCanvas(true);
  loadSprites();
  makeStars();
  applyShipChoice('blue');
  applyInputMode(online ? 'switch2p' : 'switch');
  applyDifficulty('normal');
  updateHudLanguage();
  updateShipPanelLanguage();
  updateAmmoMeter();
  updateScorePanelCopy();
  updateGameOverOptionLabels();
  refreshStartButtonState();
  drawStars();
  drawPlayer();

  menuMusic.volume = MENU_MUSIC_VOLUME;
  syncMenuMusicToSelection(false);
  startMenuStars();
  if (online) online.attach({
    get loaded() { return assetsReady; },
    assignShip: applyShipChoice,
    setDifficulty: applyDifficulty,
    start: startGame,
    pause: setOnlinePaused,
    receive: applyOnlineFrame,
    advanceBackgroundFrame,
    fire: fireOnlinePlayer,
    result: showOnlineResult,
    lobby: returnToOnlineLobby
  });
  preloadAssets();
})();

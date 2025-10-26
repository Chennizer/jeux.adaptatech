document.addEventListener('DOMContentLoaded', () => {
    let preventInput = false;
    const mediaType = document.body.getAttribute('data-media-type');
    const startButton = document.getElementById('control-panel-start-button');
    const blackBackground = document.getElementById('black-background');
    const playModeSelect = document.getElementById('control-panel-play-mode');
    const intervalTimeInput = document.getElementById('interval-time');
    const intervalLabel = document.getElementById('interval-label');
    const selectVideosButton = document.getElementById('select-videos-button');
    const videoSelectionModal = document.getElementById('video-selection-modal');
    const closeModal = document.getElementById('close-modal');
    const okButton = document.getElementById('ok-button');
    const videoCards = document.querySelectorAll('.video-card');
    const introJingle = document.getElementById('intro-jingle');
    const visualOptionsSelect = document.getElementById('special-options-select');
    const videoContainer = document.getElementById('video-container');

    const homeButtonTarget = document.body.dataset.homeTarget || '../index.html';
    if (homeButtonTarget) {
      const userLang = localStorage.getItem('siteLanguage') || 'en';
      const homeButtonLabel = userLang === 'fr' ? 'Retour au menu précédent' : 'Back to previous menu';
      const homeButton = document.createElement('a');
      homeButton.href = homeButtonTarget;
      homeButton.className = 'floating-button home-button';
      homeButton.textContent = '🏠';
      homeButton.setAttribute('aria-label', homeButtonLabel);
      homeButton.title = homeButtonLabel;
      document.body.appendChild(homeButton);
    }

    // Default to interval mode with a 30-second interval
    playModeSelect.value = 'interval';
    intervalLabel.style.display = 'inline-block';
    intervalTimeInput.style.display = 'inline-block';
    intervalTimeInput.value = 30;
  
    let mediaPlayer = null;
    if (mediaType === 'video') {
      mediaPlayer = document.getElementById('video-player');
    }
  
    const spacePrompt = document.getElementById('space-prompt');
    const textPrompt = document.getElementById('text-prompt');
    const selectSpacePromptButton = document.getElementById('select-space-prompt-button');
    const spacePromptSelectionModal = document.getElementById('space-prompt-selection-modal');
    const closeSpacePromptModal = document.getElementById('close-space-prompt-modal');
    const applySpacePromptButton = document.getElementById('apply-space-prompt');
    const textPromptInput = document.getElementById('text-prompt-input');
    const imageCardsContainer1 = document.getElementById('space-prompt-selection');
    let selectedSpacePromptSrc = '';
    let useTextPrompt = false;
  
    const spacePrompt2 = document.getElementById('space-prompt-2');
    const textPrompt2 = document.getElementById('text-prompt-2');
    const selectSpacePromptButton2 = document.getElementById('select-space-prompt-button-2');
    const spacePromptSelectionModal2 = document.getElementById('space-prompt-selection-modal-2');
    const closeSpacePromptModal2 = document.getElementById('close-space-prompt-modal-2');
    const applySpacePromptButton2 = document.getElementById('apply-space-prompt-2');
    const textPromptInput2 = document.getElementById('text-prompt-input-2');
    const imageCardsContainer2 = document.getElementById('space-prompt-selection-2');
    let selectedSpacePromptSrc2 = '';
    let useTextPrompt2 = false;
  
    const soundOptionsSelect = document.getElementById('sound-options-select');
    let selectedSound = 'none';
    const soundOptionsSelect2 = document.getElementById('sound-options-select-2');
    let selectedSound2 = 'none';
    let currentSound = null;
    let recordedAudio = null;
    let mediaRecorder;
    let audioChunks = [];
    const recordModal = document.getElementById('record-modal');
    const recordButton = document.getElementById('record-button');
    const stopRecordingButton = document.getElementById('stop-recording-button');
    const okRecordingButton = document.getElementById('ok-recording-button');
    const closeRecordModal = document.getElementById('close-record-modal');
    const recordStatus = document.getElementById('record-status');
  
    const miscOptionsContainer = document.getElementById('misc-options-container');
    const miscOptionsModal = document.getElementById('misc-options-modal');
    const closeMiscOptionsModal = document.getElementById('close-misc-options-modal');
    const miscOptionsOkButton = document.getElementById('misc-options-ok-button');
    const miscOptionsButton = document.getElementById('misc-options-button');
    const miscOptionsState = {};
  
    const player2PromptContainer = document.getElementById('player2-prompt-container');
  
    let selectedMedia = [];
    let controlsEnabled = false;
    let playedMedia = [];
    let currentMediaIndex = 0;
    let mode = 'interval';
    let intervalID = null;
    let intervalTime = 30;
    let pausedAtTime = 0;
    let currentPlayer = 1;
  
    let player1Name = '';
    let player2Name = '';
  
    const playerNameOverlay = document.createElement('div');
    playerNameOverlay.id = 'player-name-overlay';
    playerNameOverlay.style.position = 'absolute';
    playerNameOverlay.style.top = '12%';
    playerNameOverlay.style.left = '50%';
    playerNameOverlay.style.transform = 'translateX(-50%)';
    playerNameOverlay.style.fontSize = '40px';
    playerNameOverlay.style.color = 'white';
    playerNameOverlay.style.textAlign = 'center';
    playerNameOverlay.style.display = 'none';
    playerNameOverlay.style.zIndex = '3002';
    document.body.appendChild(playerNameOverlay);
  
    const playerNamesModal = document.getElementById('player-names-modal');
    const closePlayerNamesModal = document.getElementById('close-player-names-modal');
    const playerNamesOkButton = document.getElementById('player-names-ok-button');
    const playerNamesCancelButton = document.getElementById('player-names-cancel-button');
    const player1NameInput = document.getElementById('player1-name-input');
    const player2NameInput = document.getElementById('player2-name-input');
  
    let timedCycleTimeout = null;
    let promptCurrentlyVisible = true;
  
    function isTwoPlayerMode() {
      return !!miscOptionsState['two-player-mode-option'];
    }
  
    const videoCardsArray = Array.from(videoCards);
    selectedMedia = videoCardsArray.map(card => card.dataset.src);
    videoCardsArray.forEach(card => card.classList.add('selected'));
  
    function preloadMedia(list, onComplete) {
      let loaded = 0;
      const total = list.length;
      const loadingBar = document.getElementById('control-panel-loading-bar-container').querySelector('#control-panel-loading-bar');
      list.forEach(src => {
        const mediaEl = document.createElement('video');
        mediaEl.src = src;
        mediaEl.preload = 'auto';
        mediaEl.style.display = 'none';
        document.body.appendChild(mediaEl);
        mediaEl.addEventListener('canplaythrough', () => {
          loaded++;
          const percent = (loaded / total) * 100;
          loadingBar.style.width = `${percent}%`;
          if (loaded === total) onComplete();
        });
        mediaEl.addEventListener('error', () => {
          loaded++;
          const percent = (loaded / total) * 100;
          loadingBar.style.width = `${percent}%`;
          if (loaded === total) onComplete();
        });
      });
    }
  
    function playIntroJingle() {
      introJingle.play().catch(() => {});
    }
  
    selectVideosButton.addEventListener('click', () => {
      videoSelectionModal.style.display = 'block';
    });
  
    closeModal.addEventListener('click', () => {
      videoSelectionModal.style.display = 'none';
    });
  
    okButton.addEventListener('click', () => {
      updateSelectedMedia();
      videoSelectionModal.style.display = 'none';
    });
  
    videoCards.forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('selected');
        updateSelectedMedia();
      });
    });
  
    function updateSelectedMedia() {
      selectedMedia = videoCardsArray.filter(c => c.classList.contains('selected')).map(c => c.dataset.src);
      if (!selectedMedia.length) {
        selectedMedia = videoCardsArray.map(c => c.dataset.src);
      }
    }
  
    preloadMedia(selectedMedia, () => {
      startButton.style.display = 'block';
      document.getElementById('control-panel-loading-bar-container').style.display = 'none';
      playIntroJingle();
    });
  
    function showPlayerNamesModal() {
      [player1NameInput, player2NameInput].forEach(input => {
        if (input) {
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
              e.stopPropagation();
            }
          });
        }
      });
      player1NameInput.value = '';
      player2NameInput.value = '';
      playerNamesModal.style.display = 'block';
    }
  
    function closePlayerNamesModalFn() {
      playerNamesModal.style.display = 'none';
      player1Name = '';
      player2Name = '';
      showPromptForCurrentPlayer();
    }
  
    closePlayerNamesModal.addEventListener('click', closePlayerNamesModalFn);
    playerNamesCancelButton.addEventListener('click', closePlayerNamesModalFn);
  
    playerNamesOkButton.addEventListener('click', () => {
      player1Name = player1NameInput.value.trim();
      player2Name = player2NameInput.value.trim();
      playerNamesModal.style.display = 'none';
      showPromptForCurrentPlayer();
    });
  
    startButton.addEventListener('click', () => {
      if (!selectedMedia.length) {
        alert('Veuillez sélectionner au moins un média pour démarrer le jeu.');
        return;
      }
      introJingle.pause();
      introJingle.currentTime = 0;
      if (playModeSelect.value === 'interval') {
        intervalTime = parseInt(intervalTimeInput.value, 10);
        if (isNaN(intervalTime) || intervalTime <= 0) {
          alert('Veuillez entrer un temps d\'intervalle valide en secondes.');
          return;
        }
      }
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
      document.getElementById('control-panel').style.display = 'none';
      playedMedia = [];
      currentMediaIndex = getNextMediaIndex();
      preventInputTemporarily();
      currentPlayer = 1;
      if (isTwoPlayerMode()) {
        showPlayerNamesModal();
      } else {
        showPromptForCurrentPlayer();
      }
    });
  
    playModeSelect.addEventListener('change', () => {
      mode = playModeSelect.value;
      if (mode === 'interval') {
        intervalLabel.style.display = 'inline-block';
        intervalTimeInput.style.display = 'inline-block';
      } else {
        intervalLabel.style.display = 'none';
        intervalTimeInput.style.display = 'none';
      }
    });
  
    function preventInputTemporarily() {
      preventInput = true;
      setTimeout(() => {
        preventInput = false;
      }, 500);
    }
  
    function clearTimedCycle() {
      if (timedCycleTimeout) {
        clearTimeout(timedCycleTimeout);
        timedCycleTimeout = null;
      }
      promptCurrentlyVisible = true;
    }
  
    function startTimedPromptCycle(visibleSecs) {
      setPromptVisibility(true);
      timedCycleTimeout = setTimeout(() => {
        setPromptVisibility(false);
        timedCycleTimeout = setTimeout(() => {
          if (controlsEnabled) {
            startTimedPromptCycle(visibleSecs);
          }
        }, 5000);
      }, visibleSecs * 1000);
    }
  
    function setPromptVisibility(show) {
      promptCurrentlyVisible = show;
      if (!controlsEnabled) return;
      if (show) {
        playSoundPromptForPlayer(currentPlayer);
      }
      if (currentPlayer === 1) {
        if (isTwoPlayerMode() && player1Name) {
          playerNameOverlay.style.display = show ? 'block' : 'none';
        }
        if (useTextPrompt && selectedSpacePromptSrc) {
          textPrompt.style.display = show ? 'block' : 'none';
        } else if (selectedSpacePromptSrc) {
          spacePrompt.style.display = show ? 'block' : 'none';
        }
      } else {
        if (isTwoPlayerMode() && player2Name) {
          playerNameOverlay.style.display = show ? 'block' : 'none';
        }
        if (useTextPrompt2 && selectedSpacePromptSrc2) {
          textPrompt2.style.display = show ? 'block' : 'none';
        } else if (selectedSpacePromptSrc2) {
          spacePrompt2.style.display = show ? 'block' : 'none';
        }
      }
    }
  
    function showPromptForCurrentPlayer() {
      clearTimedCycle();
      blackBackground.style.display = 'block';
      controlsEnabled = true;
      spacePrompt.style.display = 'none';
      textPrompt.style.display = 'none';
      spacePrompt2.style.display = 'none';
      textPrompt2.style.display = 'none';
      playerNameOverlay.style.display = 'none';
      if (currentPlayer === 1) {
        if (isTwoPlayerMode() && player1Name) {
          playerNameOverlay.textContent = player1Name;
        }
        if (useTextPrompt && selectedSpacePromptSrc) {
          textPrompt.textContent = selectedSpacePromptSrc;
        } else if (selectedSpacePromptSrc) {
          spacePrompt.src = selectedSpacePromptSrc;
        }
      } else {
        if (isTwoPlayerMode() && player2Name) {
          playerNameOverlay.textContent = player2Name;
        }
        if (useTextPrompt2 && selectedSpacePromptSrc2) {
          textPrompt2.textContent = selectedSpacePromptSrc2;
        } else if (selectedSpacePromptSrc2) {
          spacePrompt2.src = selectedSpacePromptSrc2;
        }
      }
      const timedOn = !!miscOptionsState['timed-prompt-option'];
      if (!timedOn) {
        setPromptVisibility(true);
        return;
      }
      let visibleSecs = parseInt(miscOptionsState['timed-prompt-seconds'] || '5', 10);
      if (isNaN(visibleSecs) || visibleSecs < 1) visibleSecs = 5;
      startTimedPromptCycle(visibleSecs);
    }
  
    function hideAllPrompts() {
      clearTimedCycle();
      promptCurrentlyVisible = false;
      blackBackground.style.display = 'none';
      spacePrompt.style.display = 'none';
      textPrompt.style.display = 'none';
      spacePrompt2.style.display = 'none';
      textPrompt2.style.display = 'none';
      playerNameOverlay.style.display = 'none';
      controlsEnabled = false;
    }
  
    document.addEventListener('keydown', e => {
      if (preventInput) return;
      if (currentPlayer === 1 && controlsEnabled && e.code === 'Space' && promptCurrentlyVisible) {
        e.preventDefault();
        proceedAfterPrompt();
      }
      handleEnterPause(e);
    });
  
    document.addEventListener('keydown', e => {
      if (preventInput) return;
      if (!isTwoPlayerMode()) return;
      if (currentPlayer === 2 && controlsEnabled && promptCurrentlyVisible && e.code === 'Enter') {
        e.preventDefault();
        proceedAfterPrompt();
      }
    });
  
    function proceedAfterPrompt() {
      hideAllPrompts();
      if (pausedAtTime > 0) {
        mediaPlayer.currentTime = pausedAtTime;
        mediaPlayer.play();
        pausedAtTime = 0;
      } else {
        startMediaPlayback();
      }
      if (mode === 'interval') {
        setPauseInterval();
      }
    }
  
    function startMediaPlayback() {
      if (!mediaPlayer) return;
      mediaPlayer.removeAttribute('controls');
      mediaPlayer.src = selectedMedia[currentMediaIndex];
      mediaPlayer.play();
      if (mediaType === 'video') {
        videoContainer.style.display = 'block';
      }
      if (mode === 'interval') {
        setPauseInterval();
      }
    }
  
    function setPauseInterval() {
      if (intervalID) clearInterval(intervalID);
      intervalID = setInterval(() => {
        if (!mediaPlayer.paused) {
          pausedAtTime = mediaPlayer.currentTime;
          mediaPlayer.pause();
          switchPlayer();
          showPromptForCurrentPlayer();
          clearInterval(intervalID);
        }
      }, intervalTime * 1000);
    }
  
    if (mediaPlayer) {
      mediaPlayer.addEventListener('ended', handleMediaEnd);
    }
  
    function handleMediaEnd() {
      if (mode === 'pressBetween') {
        if (playedMedia.length < selectedMedia.length) {
          currentMediaIndex = getNextMediaIndex();
          switchPlayer();
          showPromptForCurrentPlayer();
        } else {
          playedMedia = [];
          currentMediaIndex = getNextMediaIndex();
          switchPlayer();
          showPromptForCurrentPlayer();
        }
      } else if (mode === 'onePress' || mode === 'interval') {
        if (playedMedia.length < selectedMedia.length) {
          currentMediaIndex = getNextMediaIndex();
          startMediaPlayback();
        } else {
          playedMedia = [];
          currentMediaIndex = getNextMediaIndex();
          switchPlayer();
          showPromptForCurrentPlayer();
        }
      }
    }
  
    function getNextMediaIndex() {
      if (playedMedia.length === selectedMedia.length) {
        playedMedia = [];
      }
      let next;
      do {
        next = Math.floor(Math.random() * selectedMedia.length);
      } while (playedMedia.includes(next));
      playedMedia.push(next);
      return next;
    }
  
    function switchPlayer() {
      if (!isTwoPlayerMode()) {
        currentPlayer = 1;
      } else {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
      }
    }
  
    function playSoundPromptForPlayer(num) {
      let s = num === 1 ? selectedSound : selectedSound2;
      if (!s || s === 'none') return;
      if (currentSound) {
        currentSound.pause();
        currentSound.currentTime = 0;
      }
      if (s === 'record-own' && recordedAudio) {
        currentSound = new Audio(recordedAudio);
      } else {
        const found = spacePromptSounds.find(opt => opt.value === s);
        if (found && found.src) {
          currentSound = new Audio(found.src);
        }
      }
      if (currentSound) {
        currentSound.play().catch(() => {});
      }
    }
  
    function openRecordModal() {
      recordModal.style.display = 'block';
    }
  
    closeRecordModal.addEventListener('click', () => {
      recordModal.style.display = 'none';
    });
  
    recordButton.addEventListener('click', () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            audioChunks = [];
            mediaRecorder.ondataavailable = e => {
              audioChunks.push(e.data);
            };
            mediaRecorder.onstop = () => {
              const blob = new Blob(audioChunks, { type: 'audio/mp3' });
              recordedAudio = URL.createObjectURL(blob);
              recordStatus.textContent = 'Enregistrement complété!';
              okRecordingButton.style.display = 'block';
            };
            recordStatus.textContent = 'Enregistrement...';
            stopRecordingButton.style.display = 'block';
            recordButton.style.display = 'none';
            setTimeout(() => {
              stopRecording();
            }, 5000);
          })
          .catch(() => {
            recordStatus.textContent = 'Error accessing microphone';
          });
      }
    });
  
    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        stopRecordingButton.style.display = 'none';
        recordButton.style.display = 'block';
      }
    }
  
    stopRecordingButton.addEventListener('click', () => {
      stopRecording();
    });
  
    okRecordingButton.addEventListener('click', () => {
      stopRecording();
      recordModal.style.display = 'none';
      okRecordingButton.style.display = 'none';
      stopRecordingButton.style.display = 'none';
      recordButton.style.display = 'block';
      if (recordedAudio) {
        const r = new Audio(recordedAudio);
        r.play();
      }
    });
  
    selectSpacePromptButton.addEventListener('click', () => {
      spacePromptSelectionModal.style.display = 'block';
    });
  
    closeSpacePromptModal.addEventListener('click', () => {
      spacePromptSelectionModal.style.display = 'none';
    });
  
    applySpacePromptButton.addEventListener('click', () => {
      spacePromptSelectionModal.style.display = 'none';
      if (useTextPrompt && selectedSpacePromptSrc) {
        textPrompt.textContent = selectedSpacePromptSrc;
      }
    });
  
    selectSpacePromptButton2.addEventListener('click', () => {
      spacePromptSelectionModal2.style.display = 'block';
    });
  
    closeSpacePromptModal2.addEventListener('click', () => {
      spacePromptSelectionModal2.style.display = 'none';
    });
  
    applySpacePromptButton2.addEventListener('click', () => {
      spacePromptSelectionModal2.style.display = 'none';
      if (useTextPrompt2 && selectedSpacePromptSrc2) {
        textPrompt2.textContent = selectedSpacePromptSrc2;
      }
    });
  
    soundOptionsSelect.addEventListener('change', () => {
      if (soundOptionsSelect.value === 'record-own') {
        openRecordModal();
      } else {
        selectedSound = soundOptionsSelect.value;
      }
    });
  
    soundOptionsSelect2.addEventListener('change', () => {
      if (soundOptionsSelect2.value === 'record-own') {
        openRecordModal();
      } else {
        selectedSound2 = soundOptionsSelect2.value;
      }
    });
  
    visualOptionsSelect.addEventListener('change', () => {
      if (!mediaPlayer) return;
      mediaPlayer.className = '';
      mediaPlayer.style.filter = '';
      switch (visualOptionsSelect.value) {
        case 'green-filter':
          mediaPlayer.classList.add('green-filter');
          break;
        case 'red-filter':
          mediaPlayer.classList.add('red-filter');
          break;
        case 'blue-filter':
          mediaPlayer.classList.add('blue-filter');
          break;
        case 'high-contrast':
          mediaPlayer.style.filter = 'contrast(200%)';
          break;
        case 'grayscale':
          mediaPlayer.style.filter = 'grayscale(100%)';
          break;
        case 'invert':
          mediaPlayer.style.filter = 'invert(100%)';
          break;
        case 'brightness':
          mediaPlayer.style.filter = 'brightness(1.5)';
          break;
        case 'saturation':
          mediaPlayer.style.filter = 'saturate(200%)';
          break;
        default:
          break;
      }
    });
  
    miscOptionsButton.addEventListener('click', () => {
      miscOptionsModal.style.display = 'block';
    });
  
    closeMiscOptionsModal.addEventListener('click', () => {
      miscOptionsModal.style.display = 'none';
    });
  
    miscOptionsOkButton.addEventListener('click', () => {
      miscOptionsModal.style.display = 'none';
      if (miscOptionsState['mouse-click-option']) {
        document.addEventListener('click', handleSpacebarPressEquivalent);
      } else {
        document.removeEventListener('click', handleSpacebarPressEquivalent);
      }
      if (miscOptionsState['right-click-next-option']) {
        document.addEventListener('contextmenu', handleRightClickNextVideo);
      } else {
        document.removeEventListener('contextmenu', handleRightClickNextVideo);
      }
      const player2SoundContainer = document.getElementById('player2-sound-container');
      if (miscOptionsState['two-player-mode-option']) {
        if (player2PromptContainer) player2PromptContainer.style.display = 'block';
        if (player2SoundContainer) player2SoundContainer.style.display = 'block';
      } else {
        if (player2PromptContainer) player2PromptContainer.style.display = 'none';
        if (player2SoundContainer) player2SoundContainer.style.display = 'none';
      }
    });
  
    function handleSpacebarPressEquivalent() {
      if (currentPlayer === 1 && controlsEnabled && promptCurrentlyVisible) {
        proceedAfterPrompt();
      }
    }
  
    function handleRightClickNextVideo(e) {
      e.preventDefault();
      console.log('Right-click detected');
      currentMediaIndex = getNextMediaIndex();
      startMediaPlayback();
    }
  
    function handleEnterPause(e) {
      if (miscOptionsState['enter-pause-option'] && e.code === 'Backspace') {
        e.preventDefault();
        pauseActivityAndShowPrompt();
      }
    }
  
    function pauseActivityAndShowPrompt() {
      if (mediaPlayer && !mediaPlayer.paused) {
        pausedAtTime = mediaPlayer.currentTime;
        mediaPlayer.pause();
      }
      switchPlayer();
      showPromptForCurrentPlayer();
    }
  
    function loadConfig() {
      const userLang = localStorage.getItem('siteLanguage') || 'en';
      spacePromptImages.forEach((p) => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.src = p.src;
        const altText = (typeof p.alt === 'object') ? p.alt[userLang] : p.alt;
        card.innerHTML = `<img src="${p.src}" alt="${altText}">`;
        imageCardsContainer1.appendChild(card);
        card.addEventListener('click', () => {
          textPromptInput.value = '';
          useTextPrompt = false;
          Array.from(imageCardsContainer1.querySelectorAll('.image-card')).forEach(a => a.classList.remove('selected'));
          card.classList.add('selected');
          selectedSpacePromptSrc = card.dataset.src;
        });
      });
      spacePromptImages.forEach((p) => {
        const card2 = document.createElement('div');
        card2.className = 'image-card';
        card2.dataset.src = p.src;
        const altText = (typeof p.alt === 'object') ? p.alt[userLang] : p.alt;
        card2.innerHTML = `<img src="${p.src}" alt="${altText}">`;
        imageCardsContainer2.appendChild(card2);
        card2.addEventListener('click', () => {
          textPromptInput2.value = '';
          useTextPrompt2 = false;
          Array.from(imageCardsContainer2.querySelectorAll('.image-card')).forEach(a => a.classList.remove('selected'));
          card2.classList.add('selected');
          selectedSpacePromptSrc2 = card2.dataset.src;
        });
      });
      const firstList = Array.from(imageCardsContainer1.querySelectorAll('.image-card'));
      if (firstList.length > 0) {
        firstList[0].classList.add('selected');
        selectedSpacePromptSrc = firstList[0].dataset.src;
      }
      const secondList = Array.from(imageCardsContainer2.querySelectorAll('.image-card'));
      if (secondList.length > 1) {
        secondList[1].classList.add('selected');
        selectedSpacePromptSrc2 = secondList[1].dataset.src;
      } else if (secondList.length > 0) {
        secondList[0].classList.add('selected');
        selectedSpacePromptSrc2 = secondList[0].dataset.src;
      }
      textPromptInput.addEventListener('input', () => {
        Array.from(imageCardsContainer1.querySelectorAll('.image-card')).forEach(a => a.classList.remove('selected'));
        selectedSpacePromptSrc = textPromptInput.value;
        useTextPrompt = true;
      });
      textPromptInput2.addEventListener('input', () => {
        Array.from(imageCardsContainer2.querySelectorAll('.image-card')).forEach(a => a.classList.remove('selected'));
        selectedSpacePromptSrc2 = textPromptInput2.value;
        useTextPrompt2 = true;
      });
      spacePromptSounds.forEach(o => {
        const opt1 = document.createElement('option');
        opt1.value = o.value;
        opt1.textContent = (typeof o.label === 'object') ? o.label[userLang] : o.label;
        soundOptionsSelect.appendChild(opt1);
        const opt2 = document.createElement('option');
        opt2.value = o.value;
        opt2.textContent = (typeof o.label === 'object') ? o.label[userLang] : o.label;
        soundOptionsSelect2.appendChild(opt2);
      });
      visualOptions.forEach(e => {
        const effOpt = document.createElement('option');
        effOpt.value = e.value;
        effOpt.textContent = (typeof e.label === 'object') ? e.label[userLang] : e.label;
        visualOptionsSelect.appendChild(effOpt);
      });
      miscOptions.forEach(o => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('misc-option-wrapper');
        if (o.id === 'timed-prompt-option') {
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.id = o.id;
          cb.checked = o.defaultChecked;
          miscOptionsState[o.id] = cb.checked;
          const label = document.createElement('label');
          label.htmlFor = o.id;
          label.textContent = (typeof o.label === 'object') ? o.label[userLang] : o.label;
          label.style.color = 'black';
          wrapper.appendChild(cb);
          wrapper.appendChild(label);
          miscOptionsContainer.appendChild(wrapper);
          cb.addEventListener('change', () => {
            miscOptionsState[o.id] = cb.checked;
            const numericDiv = document.getElementById('timed-seconds-wrapper');
            if (numericDiv) {
              numericDiv.style.display = cb.checked ? 'block' : 'none';
            }
          });
        } else if (o.id === 'timed-prompt-seconds') {
          wrapper.id = 'timed-seconds-wrapper';
          wrapper.style.display = 'none';
          const numericLabelText = { fr: "Temps pour appuyer sur la switch (s)", en: "Time to press the switch (s)" };
          const userLang = localStorage.getItem('siteLanguage') || 'en';
          const numericLabel = document.createElement('label');
          numericLabel.textContent = numericLabelText[userLang];
          numericLabel.style.color = 'black';
          const numberInput = document.createElement('input');
          numberInput.type = 'number';
          numberInput.min = '1';
          let fallback = (typeof o.label === 'object') ? o.label[userLang] : o.label;
          if (!fallback) fallback = '5';
          numberInput.value = fallback;
          numberInput.style.width = '60px';
          numberInput.style.marginLeft = '8px';
          miscOptionsState[o.id] = numberInput.value;
          numberInput.addEventListener('change', () => {
            miscOptionsState[o.id] = numberInput.value;
          });
          wrapper.appendChild(numericLabel);
          wrapper.appendChild(numberInput);
          miscOptionsContainer.appendChild(wrapper);
        } else {
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.id = o.id;
          cb.checked = o.defaultChecked;
          miscOptionsState[o.id] = o.defaultChecked;
          const label = document.createElement('label');
          label.htmlFor = o.id;
          label.textContent = (typeof o.label === 'object') ? o.label[userLang] : o.label;
          label.style.color = 'black';
          wrapper.appendChild(cb);
          wrapper.appendChild(label);
          miscOptionsContainer.appendChild(wrapper);
          cb.addEventListener('change', () => {
            miscOptionsState[o.id] = cb.checked;
          });
        }
      });
    }
  
    function hidePlaceholderOnFocus(selectElement) {
      selectElement.addEventListener('focus', function() {
        const firstOption = this.options[0];
        if (firstOption.disabled && firstOption.selected) {
          firstOption.style.display = 'none';
        }
      });
    }
  
    function showPlaceholderOnBlur(selectElement) {
      selectElement.addEventListener('blur', function() {
        const firstOption = this.options[0];
        if (firstOption.disabled && this.selectedIndex === 0) {
          firstOption.style.display = 'block';
        }
      });
    }
  
    function applyMiscOptions() {
      if (miscOptionsState['right-click-next-option']) {
        document.addEventListener('contextmenu', handleRightClickNextVideo);
      } else {
        document.removeEventListener('contextmenu', handleRightClickNextVideo);
      }
      if (miscOptionsState['mouse-click-option']) {
        document.addEventListener('click', handleSpacebarPressEquivalent);
      } else {
        document.removeEventListener('click', handleSpacebarPressEquivalent);
      }
    }
  
    const soundSelect1 = document.getElementById('sound-options-select');
    const soundSelect2 = document.getElementById('sound-options-select-2');
    if (soundSelect1) {
      hidePlaceholderOnFocus(soundSelect1);
      showPlaceholderOnBlur(soundSelect1);
    }
    if (soundSelect2) {
      hidePlaceholderOnFocus(soundSelect2);
      showPlaceholderOnBlur(soundSelect2);
    }
  
    loadConfig();
    applyMiscOptions();
  });
  
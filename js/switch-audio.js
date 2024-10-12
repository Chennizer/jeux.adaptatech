document.addEventListener('DOMContentLoaded', () => { 
    let preventInput = false;

    const mediaType = document.body.getAttribute('data-media-type'); // 'audio'

    // Common elements
    const startButton = document.getElementById('control-panel-start-button');
    const blackBackground = document.getElementById('black-background');
    const spacePrompt = document.getElementById('space-prompt');
    const textPrompt = document.getElementById('text-prompt');
    const playModeSelect = document.getElementById('control-panel-play-mode');
    const intervalTimeInput = document.getElementById('interval-time');
    const intervalLabel = document.getElementById('interval-label');
    const selectAudioButton = document.getElementById('select-videos-button');
    const audioSelectionModal = document.getElementById('video-selection-modal');
    const closeModal = document.getElementById('close-modal');
    const okButton = document.getElementById('ok-button');
    const audioCards = document.querySelectorAll('.video-card');
    const introJingle = document.getElementById('intro-jingle');
    const interactiveImage = document.getElementById('interactive-image');
    let mediaPlayer = document.getElementById('audio-player');

    const soundOptionsSelect = document.getElementById('sound-options-select');
    const recordModal = document.getElementById('record-modal');
    const recordButton = document.getElementById('record-button');
    const stopRecordingButton = document.getElementById('stop-recording-button');
    const okRecordingButton = document.getElementById('ok-recording-button');
    const closeRecordModal = document.getElementById('close-record-modal');
    const recordStatus = document.getElementById('record-status');

    let selectedSound = 'none';
    let currentSound = null;
    let recordedAudio = null;
    let mediaRecorder;
    let audioChunks = [];

    loadConfig();

    const selectSpacePromptButton = document.getElementById('select-space-prompt-button');
    const spacePromptSelectionModal = document.getElementById('space-prompt-selection-modal');
    const closeSpacePromptModal = document.getElementById('close-space-prompt-modal');
    const imageCards = document.querySelectorAll('.image-card');
    const textPromptInput = document.getElementById('text-prompt-input');
    const applySpacePromptButton = document.getElementById('apply-space-prompt');
    let selectedSpacePromptSrc = '';
    let useTextPrompt = false;

    imageCards[0]?.classList.add('selected');
    selectedSpacePromptSrc = imageCards[0]?.dataset.src || '';

    let selectedMedia = Array.from(audioCards).map(card => card.dataset.src);
    let controlsEnabled = false;
    let playedMedia = [];
    let currentMediaIndex = 0;
    let mode = 'pressBetween';
    let intervalID = null;
    let intervalTime = 5;
    let pausedAtTime = 0;

    console.log("Document loaded");

    audioCards.forEach(card => card.classList.add('selected'));

    function playIntroJingle() {
        introJingle.play();
    }

    function preloadMedia(mediaList, onComplete) {
        console.log("Skipping preload for audio media");
        onComplete();
    }

    startButton.style.display = 'none';
    intervalLabel.style.display = 'none';
    intervalTimeInput.style.display = 'none';

    selectAudioButton.addEventListener('click', () => {
        audioSelectionModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        audioSelectionModal.style.display = 'none';
    });

    okButton.addEventListener('click', () => {
        updateSelectedMedia();
        audioSelectionModal.style.display = 'none';
    });

    audioCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('selected');
            updateSelectedMedia();
        });
    });

    function updateSelectedMedia() {
        selectedMedia = Array.from(audioCards)
            .filter(card => card.classList.contains('selected'))
            .map(card => card.dataset.src);

        if (selectedMedia.length === 0) {
            selectedMedia = Array.from(audioCards).map(card => card.dataset.src);
        }
    }

    preloadMedia(selectedMedia, () => {
        console.log("Preloading complete, displaying start button");
        startButton.style.display = 'block';
        document.getElementById('control-panel-loading-bar-container').style.display = 'none';
        playIntroJingle();
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

    startButton.addEventListener('click', () => {
        if (selectedMedia.length === 0) {
            alert("Veuillez sélectionner au moins un média pour démarrer le jeu.");
            return;
        }

        introJingle.pause();
        introJingle.currentTime = 0;

        if (mode === 'interval') {
            intervalTime = parseInt(intervalTimeInput.value);
            if (isNaN(intervalTime) || intervalTime <= 0) {
                alert("Veuillez entrer un temps d'intervalle valide en secondes.");
                return;
            }
        }

        document.getElementById('control-panel').style.display = 'none';
        playedMedia = [];
        currentMediaIndex = getNextMediaIndex();
        preventInputTemporarily();
        showSpacePrompt();
    });

    function showSpacePrompt() {
        interactiveImage.style.display = 'none'; 
        interactiveImage.style.visibility = 'hidden'; 
    
        if (useTextPrompt && selectedSpacePromptSrc) {
            textPrompt.textContent = selectedSpacePromptSrc;
            textPrompt.style.display = 'block';
            spacePrompt.style.display = 'none';
        } else if (selectedSpacePromptSrc) {
            textPrompt.style.display = 'none';
            spacePrompt.src = selectedSpacePromptSrc;
            spacePrompt.style.display = 'block';
        }

        // Play selected sound
        if (currentSound) {
            const audio = new Audio(currentSound);
            audio.play();
        }

        blackBackground.style.display = 'block';
        controlsEnabled = true;

        // Disable right-click while space prompt is visible
        document.removeEventListener('contextmenu', handleRightClickNextAudio);
    }

    function hideSpacePrompt() {
        interactiveImage.style.display = 'block';
        interactiveImage.style.visibility = 'visible';
    
        blackBackground.style.display = 'none';
        spacePrompt.style.display = 'none';
        textPrompt.style.display = 'none';
        controlsEnabled = false;

        // Re-enable right-click when space prompt is hidden
        if (miscOptionsState['right-click-next-option']) {
            document.addEventListener('contextmenu', handleRightClickNextAudio);
        }
    }

    function handleSpacebarPress(event) {
        if (preventInput) return;
        if (controlsEnabled && event.code === 'Space') {
            event.preventDefault();
            hideSpacePrompt();
            if (pausedAtTime > 0) {
                mediaPlayer.currentTime = pausedAtTime;
                mediaPlayer.play();
                pausedAtTime = 0;
            } else {
                startMediaPlayback();
            }

            if (mode === 'interval') {
                setPauseInterval(); // Reset the interval after spacebar press
            }
        }
    }

    function startMediaPlayback() {
        mediaPlayer.src = selectedMedia[currentMediaIndex];
        mediaPlayer.play();
        interactiveImage.style.display = 'block';
        interactiveImage.style.visibility = 'visible';

        // Handle interval mode: Pause at regular intervals while the media plays
        if (mode === 'interval') {
            setPauseInterval();
        }
    }

    function setPauseInterval() {
        if (intervalID) {
            clearInterval(intervalID);
        }

        intervalID = setInterval(() => {
            if (!mediaPlayer.paused) {
                pausedAtTime = mediaPlayer.currentTime;
                mediaPlayer.pause(); // Pause the media playback
                showSpacePrompt(); // Show the space prompt when paused
                clearInterval(intervalID); // Clear the interval after the first pause
            }
        }, intervalTime * 1000); // Interval in milliseconds
    }

    mediaPlayer.addEventListener('play', () => {
        console.log("Media is playing");
    });

    mediaPlayer.addEventListener('ended', () => {
        handleMediaEnd();
    });

    function handleMediaEnd() {
        if (mode === 'pressBetween') {
            if (playedMedia.length < selectedMedia.length) {
                currentMediaIndex = getNextMediaIndex();
                showSpacePrompt();
            } else {
                playedMedia = [];
                currentMediaIndex = getNextMediaIndex();
                showSpacePrompt();
            }
        } else if (mode === 'onePress' || mode === 'interval') {
            if (playedMedia.length < selectedMedia.length) {
                currentMediaIndex = getNextMediaIndex();
                startMediaPlayback();
            } else {
                playedMedia = [];
                currentMediaIndex = getNextMediaIndex();
                showSpacePrompt();
            }
        }
    }

    function getNextMediaIndex() {
        if (playedMedia.length === selectedMedia.length) {
            playedMedia = [];
        }

        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * selectedMedia.length);
        } while (playedMedia.includes(nextIndex));

        playedMedia.push(nextIndex);
        return nextIndex;
    }

    document.addEventListener('keydown', handleSpacebarPress);

    // Right-click functionality to advance to the next audio
    function handleRightClickNextAudio(event) {
        event.preventDefault(); // Prevent the context menu from appearing
        console.log('Right-click detected, advancing to the next audio');
        
        currentMediaIndex = getNextMediaIndex();
        startMediaPlayback();
    }

    selectSpacePromptButton.addEventListener('click', () => {
        spacePromptSelectionModal.style.display = 'block';
    });

    closeSpacePromptModal.addEventListener('click', () => {
        spacePromptSelectionModal.style.display = 'none';
    });

    imageCards.forEach(card => {
        card.addEventListener('click', () => {
            textPromptInput.value = '';
            useTextPrompt = false;

            imageCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedSpacePromptSrc = card.dataset.src;
        });
    });

    textPromptInput.addEventListener('input', () => {
        imageCards.forEach(card => card.classList.remove('selected'));
        selectedSpacePromptSrc = textPromptInput.value;
        useTextPrompt = true;
    });

    applySpacePromptButton.addEventListener('click', () => {
        spacePromptSelectionModal.style.display = 'none';
        if (useTextPrompt && selectedSpacePromptSrc) {
            textPrompt.textContent = selectedSpacePromptSrc;
        }
    });

    // Sound Options Handling
    soundOptionsSelect.addEventListener('change', () => {
        const selectedOption = soundOptionsSelect.value;
        if (selectedOption === 'record-own') {
            recordModal.style.display = 'block';
        } else {
            const sound = spacePromptSounds.find(sound => sound.value === selectedOption);
            currentSound = sound ? sound.src : null;
        }
    });

    closeRecordModal.addEventListener('click', () => {
        recordModal.style.display = 'none';
    });

    recordButton.addEventListener('click', () => {
        startRecording();
        recordButton.style.display = 'none';
        stopRecordingButton.style.display = 'block';
        recordStatus.textContent = 'Recording...';
    });

    stopRecordingButton.addEventListener('click', () => {
        stopRecording();
        recordButton.style.display = 'block';
        stopRecordingButton.style.display = 'none';
        okRecordingButton.style.display = 'block';
        recordStatus.textContent = 'Recording complete. Click OK to save.';
    });

    okRecordingButton.addEventListener('click', () => {
        saveRecording();
        recordModal.style.display = 'none';
    });

    function startRecording() {
        audioChunks = [];
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.start();
            });
    }

    function stopRecording() {
        mediaRecorder.stop();
    }

    function saveRecording() {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
        recordedAudio = URL.createObjectURL(audioBlob);
        currentSound = recordedAudio;
    }

    const miscOptionsContainer = document.getElementById('misc-options-container');
    const miscOptionsModal = document.getElementById('misc-options-modal');
    const closeMiscOptionsModal = document.getElementById('close-misc-options-modal');
    const miscOptionsOkButton = document.getElementById('misc-options-ok-button');
    const miscOptionsState = {};

    function loadMiscOptions() {
        miscOptions.forEach(option => {
            const optionWrapper = document.createElement('div');
            optionWrapper.classList.add('misc-option-wrapper');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = option.id;
            checkbox.checked = option.defaultChecked;
            miscOptionsState[option.id] = option.defaultChecked;

            const label = document.createElement('label');
            label.htmlFor = option.id;
            label.textContent = option.label;
            label.style.color = "black";

            optionWrapper.appendChild(checkbox);
            optionWrapper.appendChild(label);
            miscOptionsContainer.appendChild(optionWrapper);

            checkbox.addEventListener('change', () => {
                miscOptionsState[option.id] = checkbox.checked;
            });
        });
    }

    loadMiscOptions();

    const miscOptionsButton = document.getElementById('misc-options-button');
    miscOptionsButton.addEventListener('click', () => {
        miscOptionsModal.style.display = 'block';
    });

    closeMiscOptionsModal.addEventListener('click', () => {
        miscOptionsModal.style.display = 'none';
    });

    miscOptionsOkButton.addEventListener('click', () => {
        console.log('Miscellaneous options state:', miscOptionsState);
        miscOptionsModal.style.display = 'none';

        if (miscOptionsState['mouse-click-option']) {
            document.addEventListener('click', handleSpacebarPressEquivalent);
        } else {
            document.removeEventListener('click', handleSpacebarPressEquivalent);
        }

        // Right-click functionality to advance to the next audio
        if (miscOptionsState['right-click-next-option']) {
            document.addEventListener('contextmenu', handleRightClickNextAudio);
        } else {
            document.removeEventListener('contextmenu', handleRightClickNextAudio);
        }
    });

    function handleSpacebarPressEquivalent(event) {
        handleSpacebarPress({ code: 'Space', preventDefault: () => {} });
    }

    function handleEnterPause(event) {
        if (miscOptionsState['enter-pause-option'] && event.code === 'Enter') {
            event.preventDefault();
            pauseActivityAndShowPrompt();
        }
    }

    document.addEventListener('keydown', handleEnterPause);

    function pauseActivityAndShowPrompt() {
        if (mediaPlayer && !mediaPlayer.paused) {
            pausedAtTime = mediaPlayer.currentTime;
            mediaPlayer.pause();
        }
        showSpacePrompt();
    }

    function loadConfig() {
        const spacePromptSelection = document.getElementById('space-prompt-selection');
        spacePromptImages.forEach(prompt => {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            imageCard.dataset.src = prompt.src;
            imageCard.innerHTML = `<img src="${prompt.src}" alt="${prompt.alt}">`;
            spacePromptSelection.appendChild(imageCard);
        });

        spacePromptSounds.forEach(option => {
            const soundOption = document.createElement('option');
            soundOption.value = option.value;
            soundOption.textContent = option.label;
            soundOptionsSelect.appendChild(soundOption);
        });
    }

    interactiveImage.style.display = 'none';
    interactiveImage.style.visibility = 'hidden';

    document.addEventListener('keydown', handleSpacebarPress);
});

document.addEventListener('DOMContentLoaded', () => {
    let preventInput = false;

    const mediaType = document.body.getAttribute('data-media-type'); // 'audio' or 'video'

    // Common elements
    const startButton = document.getElementById('control-panel-start-button');
    const blackBackground = document.getElementById('black-background');
    const spacePrompt = document.getElementById('space-prompt');
    const textPrompt = document.getElementById('text-prompt');
    const playModeSelect = document.getElementById('control-panel-play-mode');
    const intervalTimeInput = document.getElementById('interval-time');
    const intervalLabel = document.getElementById('interval-label');
    const selectVideosButton = document.getElementById('select-videos-button');
    const videoSelectionModal = document.getElementById('video-selection-modal');
    const closeModal = document.getElementById('close-modal');
    const okButton = document.getElementById('ok-button');
    const videoCards = document.querySelectorAll('.video-card');
    const introJingle = document.getElementById('intro-jingle');

    // Media elements
    const videoContainer = document.getElementById('video-container');
    let mediaPlayer = null;

    if (mediaType === 'video') {
        mediaPlayer = document.getElementById('video-player');
    }

    // Visual and Sound Options
    const visualOptionsSelect = document.getElementById('special-options-select');
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

    // Media selection (videos)
    let selectedMedia = Array.from(videoCards).map(card => card.dataset.src);
    let controlsEnabled = false;
    let playedMedia = [];
    let currentMediaIndex = 0;
    let mode = 'pressBetween';
    let intervalID = null;
    let intervalTime = 5;
    let pausedAtTime = 0;

    console.log("Document loaded");

    // Mark all media cards as selected by default
    videoCards.forEach(card => card.classList.add('selected'));

    function playIntroJingle() {
        introJingle.play();
    }

    function playSoundPrompt() {
        if (selectedSound && selectedSound !== 'none') {
            if (currentSound) {
                currentSound.pause();
                currentSound.currentTime = 0;
            }
    
            if (selectedSound === 'record-own' && recordedAudio) {
                // Create a new Audio object each time we play the recorded sound
                currentSound = new Audio(recordedAudio);  // Use the recorded audio URL
            } else {
                const soundOption = spacePromptSounds.find(option => option.value === selectedSound);
                if (soundOption && soundOption.src) {
                    currentSound = new Audio(soundOption.src);
                }
            }
    
            if (currentSound) {
                console.log("Playing sound: ", currentSound.src);  // Debugging log for sound source
                currentSound.play().catch(err => {
                    console.error("Error playing sound: ", err);  // Catch any playback issues
                });
            }
        }
    }

    function preloadMedia(mediaList, onComplete) {
        let mediaLoaded = 0;
        const totalMedia = mediaList.length;
        const loadingBar = document.getElementById('control-panel-loading-bar');

        mediaList.forEach((mediaSrc, index) => {
            const mediaElement = document.createElement('video');
            mediaElement.src = mediaSrc;
            mediaElement.preload = 'auto';
            mediaElement.style.display = 'none';
            document.body.appendChild(mediaElement);

            mediaElement.addEventListener('canplaythrough', () => {
                mediaLoaded++;
                const progress = (mediaLoaded / totalMedia) * 100;
                loadingBar.style.width = `${progress}%`;

                if (mediaLoaded === totalMedia) {
                    console.log("All media preloaded");
                    onComplete();
                }
            });

            mediaElement.addEventListener('error', (e) => {
                console.error(`Error preloading media ${index + 1}:`, e);
                mediaLoaded++;
                const progress = (mediaLoaded / totalMedia) * 100;
                loadingBar.style.width = `${progress}%`;

                if (mediaLoaded === totalMedia) {
                    onComplete();
                }
            });
        });
    }

     soundOptionsSelect.addEventListener('change', () => {
        if (soundOptionsSelect.value === 'record-own') {
            openRecordModal(); // Open modal to record custom sound
        } else {
            selectedSound = soundOptionsSelect.value;
        }
    });

    // Function to open the recording modal
    function openRecordModal() {
        recordModal.style.display = 'block';
    }

    // Function to close the recording modal
    closeRecordModal.addEventListener('click', () => {
        recordModal.style.display = 'none';
    });

    // Record button event to start recording audio
    recordButton.addEventListener('click', () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                audioChunks = [];
    
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
    
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                    recordedAudio = URL.createObjectURL(audioBlob);  // Store the URL of the recorded audio
                    console.log("Recording URL set to: ", recordedAudio); // Debugging log
                
                    recordStatus.textContent = "Enregistrement complété!";
                    okRecordingButton.style.display = 'block';  // Show OK button
                };
    
                recordStatus.textContent = "Enregistrement...";
                stopRecordingButton.style.display = 'block';  // Show stop button during recording
                recordButton.style.display = 'none';  // Hide the record button during recording
    
                // Auto stop after 5 seconds
                setTimeout(() => {
                    stopRecording();
                }, 5000);
            }).catch(err => {
                console.error('Error accessing microphone: ', err);
                recordStatus.textContent = "Error accessing microphone";
            });
        }
    });
    
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop(); // Stop the recording
            stopRecordingButton.style.display = 'none'; // Hide stop button
            recordButton.style.display = 'block'; // Show record button again for new recording
        }
    }

    stopRecordingButton.addEventListener('click', () => {
        stopRecording(); // Stop recording when the stop button is clicked
    });

    okRecordingButton.addEventListener('click', () => {
        stopRecording(); // Ensure recording is stopped
        recordModal.style.display = 'none';  // Close the modal
        okRecordingButton.style.display = 'none';  // Hide the OK button after closing the modal
        stopRecordingButton.style.display = 'none';  // Hide stop button
        recordButton.style.display = 'block';  // Reset record button for next use
    
        // Play the recorded sound after closing the modal
        if (recordedAudio) {
            recordedAudio.play();  // Play the recorded audio
            console.log("Playing the recorded sound");
        }
    });
    // Show the media selection modal
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
        selectedMedia = Array.from(videoCards)
            .filter(card => card.classList.contains('selected'))
            .map(card => card.dataset.src);

        if (selectedMedia.length === 0) {
            selectedMedia = Array.from(videoCards).map(card => card.dataset.src);
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
    
        // Enter fullscreen mode
        const elem = document.documentElement; // The entire document
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.error("Error attempting to enable fullscreen mode:", err.message);
            });
        } else if (elem.mozRequestFullScreen) { // Firefox
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { // Chrome, Safari, and Opera
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE/Edge
            elem.msRequestFullscreen();
        }
    
        // Hide the control panel
        document.getElementById('control-panel').style.display = 'none';
    
        playedMedia = [];
        currentMediaIndex = getNextMediaIndex();
        preventInputTemporarily();
        showSpacePrompt();
    });

    function showSpacePrompt() {
        playSoundPrompt();  // Play the sound here, when the prompt appears
    
        if (useTextPrompt && selectedSpacePromptSrc) {
            textPrompt.textContent = selectedSpacePromptSrc;
            textPrompt.style.display = 'block';
            spacePrompt.style.display = 'none';
        } else if (selectedSpacePromptSrc) {
            textPrompt.style.display = 'none';
            spacePrompt.src = selectedSpacePromptSrc;
            spacePrompt.style.display = 'block';
        }
    
        blackBackground.style.display = 'block';
        controlsEnabled = true;
    
        // Disable right-click while space prompt is visible
        document.removeEventListener('contextmenu', handleRightClickNextVideo);
    }

    function hideSpacePrompt() {
        blackBackground.style.display = 'none';
        spacePrompt.style.display = 'none';
        textPrompt.style.display = 'none';
        controlsEnabled = false;

        // Re-enable right-click when space prompt is hidden
        if (miscOptionsState['right-click-next-option']) {
            document.addEventListener('contextmenu', handleRightClickNextVideo);
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
                setPauseInterval();
            }
        }
    }

    function startMediaPlayback() {
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
        if (intervalID) {
            clearInterval(intervalID);
        }

        intervalID = setInterval(() => {
            if (!mediaPlayer.paused) {
                pausedAtTime = mediaPlayer.currentTime;
                mediaPlayer.pause();
                showSpacePrompt();
                clearInterval(intervalID);
            }
        }, intervalTime * 1000);
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

    soundOptionsSelect.addEventListener('change', () => {
        selectedSound = soundOptionsSelect.value;
        console.log(`Selected sound: ${selectedSound}`);
    });

    visualOptionsSelect.addEventListener('change', () => {
        const selectedOption = visualOptionsSelect.value;
        mediaPlayer.className = '';

        switch (selectedOption) {
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
                mediaPlayer.style.filter = '';
                break;
        }
    });

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

        // Right-click functionality to advance the video
        if (miscOptionsState['right-click-next-option']) {
            document.addEventListener('contextmenu', handleRightClickNextVideo);
        } else {
            document.removeEventListener('contextmenu', handleRightClickNextVideo);
        }
    });

    function handleRightClickNextVideo(event) {
        event.preventDefault(); // Prevent the context menu from appearing
        console.log('Right-click detected, advancing to the next video');
        
        currentMediaIndex = getNextMediaIndex();
        startMediaPlayback();
    }

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

        visualOptions.forEach(effect => {
            const effectOption = document.createElement('option');
            effectOption.value = effect.value;
            effectOption.textContent = effect.label;
            visualOptionsSelect.appendChild(effectOption);
        });
    }
});

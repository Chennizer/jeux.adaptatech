document.addEventListener('DOMContentLoaded', () => {
    // ----- State Variables -----
    let preventInput = false; 
    let spaceBarAttemptCount = 0; 
    let pauseDurations = []; 
    let pauseStartTime = null; 
    let sessionStartTime = null; 
    let sessionCompleted = false; 

    // ----- DOM Elements -----
    const mediaType = document.body.getAttribute('data-media-type'); 
    const videoSource = document.body.getAttribute('data-video-source');
    let timestampsEasy = document.body.getAttribute('data-timestamps-easy').split(',').map(Number);
    let timestampsMedium = document.body.getAttribute('data-timestamps-medium').split(',').map(Number);
    let timestampsHard = document.body.getAttribute('data-timestamps-hard').split(',').map(Number);
    const promptText = document.body.getAttribute('data-prompt-text') || "Press the space bar to continue!";
    const pauseSoundSrc = document.body.getAttribute('data-pause-sound');

    const startButton = document.getElementById('control-panel-start-button');
    const overlayScreen = document.getElementById('overlay-screen');
    const playModeSelect = document.getElementById('control-panel-play-mode');
    const soundOptionsSelect = document.getElementById('sound-options-select');
    const levelSelect = document.getElementById('level-select');
    const videoContainer = document.getElementById('video-container');

    let mediaPlayer = null;
    if (mediaType === 'video') {
        mediaPlayer = document.getElementById('video-player');
        mediaPlayer.src = videoSource;
    }

    // Recording Modal Elements
    const recordModal = document.getElementById('record-modal');
    const recordButton = document.getElementById('record-button');
    const stopRecordingButton = document.getElementById('stop-recording-button');
    const okRecordingButton = document.getElementById('ok-recording-button');
    const closeRecordModal = document.getElementById('close-record-modal');
    const recordStatus = document.getElementById('record-status');

    // Sound / Prompt Selection
    let selectedSound = 'none';
    let currentSound = null;
    let recordedAudio = null;
    let mediaRecorder;
    let audioChunks = [];

    const selectSpacePromptButton = document.getElementById('select-space-prompt-button');
    const spacePromptModal = document.getElementById('space-prompt-selection-modal');
    const closeSpacePromptModal = document.getElementById('close-space-prompt-modal');
    const spacePromptImagesContainer = document.getElementById('space-prompt-selection');
    const spacePromptOkButton = document.getElementById('apply-space-prompt');
    const textPromptInput = document.getElementById('text-prompt-input');

    // Arrays or objects that might be defined in config.js:
    //  let spacePromptImages = [ ... ];
    //  let spacePromptSounds = [ ... ];
    //  let miscOptions = [ ... ];

    let selectedSpacePromptImage = null;
    let customTextPrompt = null;
    let selectedDifficulty = 'easy';
    let timestamps = [];
    let currentTimestampIndex = 0;
    let pausedAtTime = 0;
    let controlsEnabled = false;
    let pauseSoundInterval = null; 
    let fadeOutTimeout = null;
    let hideTimeout = null;
    
    // -------------------------
    // Initialize / Load Config
    // -------------------------
    function populateSpacePromptImages() {
        spacePromptImagesContainer.innerHTML = '';
        if (!Array.isArray(spacePromptImages) || spacePromptImages.length === 0) {
            spacePromptImagesContainer.textContent = "No images available.";
            return;
        }
        // If no image is selected yet, set the first image as the default
        if (!selectedSpacePromptImage) {
            selectedSpacePromptImage = spacePromptImages[0].src;
        }
        spacePromptImages.forEach(image => {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            imageCard.dataset.src = image.src;
            // Use the proper alt text based on the current language (if needed)
            let altText = image.alt[document.documentElement.lang] || image.alt.en || "";
            imageCard.innerHTML = `<img src="${image.src}" alt="${altText}">`;
            if (selectedSpacePromptImage === image.src) {
                imageCard.classList.add('selected');
            }
            imageCard.addEventListener('click', () => {
                const imageCards = spacePromptImagesContainer.querySelectorAll('.image-card');
                imageCards.forEach(card => card.classList.remove('selected'));
                imageCard.classList.add('selected');
                selectedSpacePromptImage = imageCard.dataset.src;
                customTextPrompt = null;
                textPromptInput.value = '';
            });
            spacePromptImagesContainer.appendChild(imageCard);
        });
    }
    
    

    function populateSoundOptions() {
        // Clear existing options
        soundOptionsSelect.innerHTML = '';
        
        // Determine the current language; default to 'en'
        const currentLang = document.documentElement.lang || "en";
        
        // Loop through the sound options and create option elements
        spacePromptSounds.forEach((option) => {
            const soundOption = document.createElement('option');
            soundOption.value = option.value;
            // Use the appropriate label based on current language
            if (typeof option.label === 'object') {
                soundOption.textContent = option.label[currentLang] || option.label.en;
            } else {
                soundOption.textContent = option.label;
            }
            soundOptionsSelect.appendChild(soundOption);
        });
        
        // Set the default selected value to 'piano-sound'
        soundOptionsSelect.value = 'piano-sound';
        // Also update the selectedSound variable so playPauseSound() knows which sound to play
        selectedSound = 'piano-sound';
    }
    
    
    
    

    function loadConfig() {
        // Called initially or on changes to reassign timestamps, etc.
        populateSoundOptions();
        selectedDifficulty = playModeSelect.value || 'easy';
        switch (selectedDifficulty) {
            case 'easy':
                timestamps = timestampsEasy;
                break;
            case 'medium':
                timestamps = timestampsMedium;
                break;
            case 'hard':
                timestamps = timestampsHard;
                break;
            default:
                timestamps = [];
        }
    }

    playModeSelect.addEventListener('change', () => {
        selectedDifficulty = playModeSelect.value;
        switch (selectedDifficulty) {
            case 'easy':
                timestamps = timestampsEasy;
                break;
            case 'medium':
                timestamps = timestampsMedium;
                break;
            case 'hard':
                timestamps = timestampsHard;
                break;
            default:
                timestamps = [];
        }
    });

    soundOptionsSelect.addEventListener('change', () => {
        if (soundOptionsSelect.value === 'record-own') {
            openRecordModal();
        } else {
            selectedSound = soundOptionsSelect.value;
        }
    });

    function openRecordModal() {
        recordModal.style.display = 'block';
    }

    closeRecordModal.addEventListener('click', () => {
        recordModal.style.display = 'none';
    });

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
                    recordedAudio = URL.createObjectURL(audioBlob);
                    recordStatus.textContent = "Enregistrement complété!";
                    okRecordingButton.style.display = 'block';
                };
                recordStatus.textContent = "Enregistrement...";
                stopRecordingButton.style.display = 'block';
                recordButton.style.display = 'none';
                setTimeout(() => {
                    stopRecording();
                }, 5000);
            }).catch(err => {
                recordStatus.textContent = "Erreur d'accès au microphone";
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
            currentSound = new Audio(recordedAudio);
            currentSound.play().catch(() => {});
        }
    });

    // -------------------------
    // Prompt / Pause Sound
    // -------------------------
    function playPauseSound() {
        if (selectedSound && selectedSound !== 'none') {
            if (currentSound) {
                currentSound.pause();
                currentSound.currentTime = 0;
            }
            if (selectedSound === 'record-own' && recordedAudio) {
                currentSound = new Audio(recordedAudio);
            } else if (selectedSound === 'pause-sound' && pauseSoundSrc) {
                currentSound = new Audio(pauseSoundSrc);
            } else {
                const soundOption = spacePromptSounds.find(option => option.value === selectedSound);
                if (soundOption && soundOption.src) {
                    currentSound = new Audio(soundOption.src);
                }
            }
            if (currentSound) {
                currentSound.play().catch(() => {});
            }
        }
    }

    // -------------------------
    // Start Button
    // -------------------------
    startButton.addEventListener('click', () => {
        if (!selectedDifficulty) {
            alert("Please select a game mode to start.");
            return;
        }
        if (!levelSelect.value) {
            alert("Please select a level to start.");
            return;
        }
        if (timestamps.length === 0) {
            alert("No timestamps defined for this level and game mode.");
            return;
        }
        loadConfig(); // Ensure timestamps are updated
        sessionStartTime = Date.now();

        // Attempt fullscreen
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
        // Hide control panel
        document.getElementById('control-panel').style.display = 'none';

        currentTimestampIndex = 0;
        if (mediaPlayer) {
            mediaPlayer.currentTime = 0;
            videoContainer.style.display = 'block';
            mediaPlayer.addEventListener('timeupdate', handleTimeUpdate);
            mediaPlayer.addEventListener('ended', handleMediaEnd);
            mediaPlayer.play().catch(() => {});
        }

        preventInput = true;
        overlayScreen.classList.remove('show');
    });

    // -------------------------
    // Timestamps / Overlays
    // -------------------------
    function handleTimeUpdate() {
        if (!mediaPlayer) return;
        const currentTime = mediaPlayer.currentTime;
        if (currentTimestampIndex < timestamps.length && currentTime >= timestamps[currentTimestampIndex]) {
            mediaPlayer.pause();
            pausedAtTime = currentTime;
            showOverlayScreen();
            currentTimestampIndex++;
        }
    }

    function showOverlayScreen() {
        overlayScreen.classList.add('show');
        controlsEnabled = true;
        preventInput = false;
        pauseStartTime = Date.now();

        const spacePromptImage = document.getElementById('space-prompt-image');

        if (fadeOutTimeout) {
            clearTimeout(fadeOutTimeout);
            fadeOutTimeout = null;
        }
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        if (selectedSpacePromptImage) {
            spacePromptImage.src = selectedSpacePromptImage; 
            spacePromptImage.classList.remove('hidden'); 
            spacePromptImage.style.transform = 'translate(-50%, -50%) scale(0.1)';
            spacePromptImage.style.opacity = '1';
            void spacePromptImage.offsetWidth; 
            spacePromptImage.style.transform = 'translate(-50%, -50%) scale(1)';

            fadeOutTimeout = setTimeout(() => {
                spacePromptImage.style.opacity = '0';
            }, 5000); 
            hideTimeout = setTimeout(() => {
                spacePromptImage.classList.add('hidden');
                spacePromptImage.style.transform = 'translate(-50%, -50%) scale(0.1)';
                spacePromptImage.style.opacity = '1';
            }, 5500); 
        }

        playPauseSound();
        pauseSoundInterval = setInterval(() => {
            if (selectedSpacePromptImage) {
                spacePromptImage.src = selectedSpacePromptImage;
                spacePromptImage.classList.remove('hidden');
                spacePromptImage.style.transform = 'translate(-50%, -50%) scale(0.1)';
                spacePromptImage.style.opacity = '1';
                void spacePromptImage.offsetWidth;
                spacePromptImage.style.transform = 'translate(-50%, -50%) scale(1)';

                if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
                if (hideTimeout) clearTimeout(hideTimeout);

                fadeOutTimeout = setTimeout(() => {
                    spacePromptImage.style.opacity = '0';
                }, 5000);
                hideTimeout = setTimeout(() => {
                    spacePromptImage.classList.add('hidden');
                    spacePromptImage.style.transform = 'translate(-50%, -50%) scale(0.1)';
                    spacePromptImage.style.opacity = '1';
                }, 5500);
            }
            playPauseSound();
        }, 20000);
    }

    function hideOverlayScreen() {
        overlayScreen.classList.remove('show');
        controlsEnabled = false;

        if (fadeOutTimeout) {
            clearTimeout(fadeOutTimeout);
            fadeOutTimeout = null;
        }
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
        if (pauseSoundInterval) {
            clearInterval(pauseSoundInterval);
            pauseSoundInterval = null;
        }

        const spacePromptImage = document.getElementById('space-prompt-image');
        if (spacePromptImage) {
            spacePromptImage.classList.add('hidden');
            spacePromptImage.style.transform = 'translate(-50%, -50%) scale(0.1)';
            spacePromptImage.style.opacity = '1';
        }

        if (pauseStartTime) {
            const pauseEndTime = Date.now();
            const duration = pauseEndTime - pauseStartTime; 
            pauseDurations.push(duration);
            pauseStartTime = null;
        }

        preventInput = true;
        startMediaPlayback();
    }

    function startMediaPlayback() {
        if (mediaPlayer) {
            mediaPlayer.removeAttribute('controls');
            mediaPlayer.play().catch(() => {});
            if (mediaType === 'video') {
                videoContainer.style.display = 'block';
            }
        }
    }

    // -------------------------
    // MEDIA END => Return to Control Panel
    // -------------------------
    function handleMediaEnd() {
        // Hide the video container
        const videoContainer = document.getElementById('video-container');
        videoContainer.style.display = 'none';
        // or videoContainer.classList.add('hidden');
    
        // Exit fullscreen if still active
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => {});
        }
    
        const controlPanel = document.getElementById('control-panel');
        controlPanel.style.display = '';
    }
    
    let isSpaceKeyPressed = false; 
    function handleSpacebarPress(event) {
        if (event.code === 'Space' && !isSpaceKeyPressed) {
            isSpaceKeyPressed = true; 
            if (preventInput) {
                // Count it as an unnecessary press
                spaceBarAttemptCount++;
                const attemptDisplay = document.getElementById('space-bar-attempts');
                if (attemptDisplay) {
                    attemptDisplay.textContent = `Space Bar Attempts: ${spaceBarAttemptCount}`;
                    attemptDisplay.style.display = 'block';
                }
            } else if (controlsEnabled) {
                event.preventDefault();
                hideOverlayScreen(); 
                if (pausedAtTime > 0 && mediaPlayer) {
                    mediaPlayer.currentTime = pausedAtTime;
                    mediaPlayer.play().catch(() => {});
                    pausedAtTime = 0;
                }
            }
        }
    }

    function handleSpacebarRelease(event) {
        if (event.code === 'Space') {
            isSpaceKeyPressed = false; 
        }
    }

    document.addEventListener('keydown', handleSpacebarPress, true);
    document.addEventListener('keyup', handleSpacebarRelease, true);

    document.addEventListener('keydown', (event) => {

        if (preventInput && event.code !== 'Space' && event.code !== 'F5') {
            event.preventDefault();
            event.stopPropagation();
        }
    }, false);

    document.addEventListener('mousedown', (event) => {
        if (preventInput) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, false);

    document.addEventListener('mousemove', (event) => {
        if (preventInput) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, false);

    document.addEventListener('touchstart', (event) => {
        if (preventInput) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, false);

    document.addEventListener('touchmove', (event) => {
        if (preventInput) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, false);

    // -------------------------
    // Misc. Options
    // -------------------------
    const miscOptionsModal = document.getElementById('misc-options-modal');
    const closeMiscOptionsModal = document.getElementById('close-misc-options-modal');
    const miscOptionsOkButton = document.getElementById('misc-options-ok-button');
    const miscOptionsButton = document.getElementById('misc-options-button');
    const miscOptionsContainer = document.getElementById('misc-options-container');
    const miscOptionsState = {};

    function populateMiscOptions() {
        if (!Array.isArray(miscOptions) || miscOptions.length === 0) {
            return;
        }
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

    function loadMiscOptions() {
        populateMiscOptions();
    }

    miscOptionsButton.addEventListener('click', () => {
        miscOptionsModal.style.display = 'block';
    });
    closeMiscOptionsModal.addEventListener('click', () => {
        miscOptionsModal.style.display = 'none';
    });
    miscOptionsOkButton.addEventListener('click', () => {
        miscOptionsModal.style.display = 'none';
        // Example toggles from checkboxes:
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
    });

    function handleRightClickNextVideo(event) {
        event.preventDefault();
        if (mediaPlayer) {
            mediaPlayer.currentTime = 0;
            mediaPlayer.play().catch(() => {});
        }
    }

    function handleSpacebarPressEquivalent(event) {
        // Synthesize a Space press
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
        showOverlayScreen();
    }

    levelSelect.addEventListener('change', () => {
        const selectedOption = levelSelect.options[levelSelect.selectedIndex];
        if (selectedOption) {
            const newVideoSource = selectedOption.getAttribute('data-video-source');
            if (mediaPlayer) {
                mediaPlayer.src = newVideoSource;
                mediaPlayer.load();
                timestampsEasy   = selectedOption.getAttribute('data-timestamps-easy').split(',').map(Number);
                timestampsMedium = selectedOption.getAttribute('data-timestamps-medium').split(',').map(Number);
                timestampsHard   = selectedOption.getAttribute('data-timestamps-hard').split(',').map(Number);

                switch (selectedDifficulty) {
                    case 'easy':
                        timestamps = timestampsEasy;
                        break;
                    case 'medium':
                        timestamps = timestampsMedium;
                        break;
                    case 'hard':
                        timestamps = timestampsHard;
                        break;
                    default:
                        timestamps = [];
                }
            }
            startButton.classList.remove('hidden');
            videoContainer.classList.add('hidden');
        }
    });

    selectSpacePromptButton.addEventListener('click', () => {
        populateSpacePromptImages();
        spacePromptModal.style.display = 'block';
    });

    closeSpacePromptModal.addEventListener('click', () => {
        spacePromptModal.style.display = 'none';
    });

    spacePromptOkButton.addEventListener('click', () => {
        customTextPrompt = textPromptInput.value.trim() || null;
        spacePromptModal.style.display = 'none';
    });
    populateSpacePromptImages();
    loadMiscOptions();
    loadConfig();
    if(levelSelect.value) {
        const event = new Event('change');
        levelSelect.dispatchEvent(event);
      }
});

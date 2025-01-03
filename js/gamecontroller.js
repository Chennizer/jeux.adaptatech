document.addEventListener('DOMContentLoaded', () => {
    // ----- Scoring Constants -----
    const MAX_AVG_PAUSE_TIME = 60; 
    const WEIGHT_RPA = 300;        
    const WEIGHT_APT = 500;        
    const WEIGHT_NSP = 10;         
    const NSP_CAP = 50;            

    // NEW CONSTANT FOR CAUSE-EFFECT FORMULA
    const TIME_THRESHOLD = 30; // Adjust as desired (in seconds)

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

    const selectSpacePromptButton = document.getElementById('select-space-prompt-button');
    const spacePromptModal = document.getElementById('space-prompt-selection-modal');
    const closeSpacePromptModal = document.getElementById('close-space-prompt-modal');
    const spacePromptImagesContainer = document.getElementById('space-prompt-selection');
    const spacePromptOkButton = document.getElementById('apply-space-prompt');
    const textPromptInput = document.getElementById('text-prompt-input');

    // e.g. let spacePromptImages = [...], let spacePromptSounds = [...], etc.
    // let miscOptions = [...];

    let selectedSpacePromptImage = null;
    let customTextPrompt = null;
    let selectedDifficulty = 'easy';
    let timestamps = [];
    let currentTimestampIndex = 0;
    let pausedAtTime = 0;
    let controlsEnabled = false;
    let pauseSoundInterval = null; 
    let pauseSoundTimeout = null;  
    const miscOptionsState = {};

    let medianPauseTime = 0;
    let trendOfPauseDurations = "N/A";

    let fadeOutTimeout = null;
    let hideTimeout = null;

    // ----------------------------------------
    // (NEW) Tiered Forgiveness Function
    // ----------------------------------------
    //  (1) First 2 presses/min => 0% counted
    //  (2) Next 2 presses/min => 34% counted
    //  (3) Next 2 presses/min => 67% counted
    //  (4) Remaining => 100% counted
    function adjustedWrongCountTiered(x, sessionLengthMin) {
        // Each 'tier' is 2 presses per minute
        const TIER_SIZE = 2 * sessionLengthMin; 
        const tier1Max = TIER_SIZE;      // 0% counted
        const tier2Max = 2 * TIER_SIZE;  // 34% counted
        const tier3Max = 3 * TIER_SIZE;  // 67% counted

        let adjusted = 0;
        let remaining = x;

        // Tier1: 0% penalty
        const tier1Presses = Math.min(remaining, tier1Max);
        adjusted += tier1Presses * 0;
        remaining -= tier1Presses;

        // Tier2: 34% penalty
        const tier2Presses = Math.min(remaining, tier2Max - tier1Max);
        adjusted += tier2Presses * 0.34;
        remaining -= tier2Presses;

        // Tier3: 67% penalty
        const tier3Presses = Math.min(remaining, tier3Max - tier2Max);
        adjusted += tier3Presses * 0.67;
        remaining -= tier3Presses;

        // Tier4: 100% penalty
        adjusted += remaining * 1.0;

        return adjusted;
    }

    function populateSpacePromptImages() {
        spacePromptImagesContainer.innerHTML = '';
        if (!Array.isArray(spacePromptImages) || spacePromptImages.length === 0) {
            spacePromptImagesContainer.textContent = "No images available.";
            return;
        }
        spacePromptImages.forEach(image => {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            imageCard.dataset.src = image.src;
            imageCard.innerHTML = `<img src="${image.src}" alt="${image.alt}">`;
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
        if (!Array.isArray(spacePromptSounds) || spacePromptSounds.length === 0) {
            return;
        }
        spacePromptSounds.forEach(option => {
            const soundOption = document.createElement('option');
            soundOption.value = option.value;
            soundOption.textContent = option.label;
            soundOptionsSelect.appendChild(soundOption);
        });
    }

    function populateMiscOptions() {
        const miscOptionsContainer = document.getElementById('misc-options-container');
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

    function loadConfig() {
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
            currentSound.play().catch(err => {});
        }
    });

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
                currentSound.play().catch(err => {});
            }
        }
    }

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
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {});
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        document.getElementById('control-panel').style.display = 'none';
        currentTimestampIndex = 0;
        if (mediaPlayer) {
            mediaPlayer.currentTime = 0;
            videoContainer.style.display = 'block';
            mediaPlayer.addEventListener('timeupdate', handleTimeUpdate);
            mediaPlayer.play().catch(err => {});
        }
        preventInput = true;
        overlayScreen.classList.remove('show');
    });

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
        if (pauseSoundTimeout) {
            clearTimeout(pauseSoundTimeout);
            pauseSoundTimeout = null;
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
            mediaPlayer.play().catch(err => {});
            if (mediaType === 'video') {
                videoContainer.style.display = 'block';
            }
            mediaPlayer.addEventListener('ended', handleMediaEnd);
        }
    }

    function handleMediaEnd() {
        const resultsScreen = document.getElementById('results-screen');
        const spaceBarAttemptsResult = document.getElementById('space-bar-attempts-result');
        const timeRatioElem = document.getElementById('time-ratio');
        const finalScoreElem = document.getElementById('final-score');

        sessionCompleted = true;
        videoContainer.style.display = 'none';

        // Basic stats
        const totalPauseTimeMs = pauseDurations.reduce((a, b) => a + b, 0);
        const totalPauseTime = totalPauseTimeMs / 1000; 
        const sessionEndTime = Date.now();
        const totalSessionTimeMs = sessionEndTime - sessionStartTime;
        const totalSessionTime = totalSessionTimeMs / 1000; 
        const totalActiveTime = totalSessionTime - totalPauseTime;

        spaceBarAttemptsResult.textContent = "Fréquence d'appuis au mauvais moment" + spaceBarAttemptCount;

        let pausePercentageText = "Impossible de calculer le pourcentage.";
        if (totalSessionTime > 0) {
            const pausePercentage = (totalPauseTime / totalSessionTime) * 100;
            pausePercentageText = `Temps de pause ${pausePercentage.toFixed(2)}%`;
        } 
        timeRatioElem.textContent = pausePercentageText;

        // Compute median, average, std. dev., etc.
        const median = computeMedian(pauseDurations);
        medianPauseTime = median; // in seconds
        document.getElementById('pdf-median-pause').textContent = medianPauseTime.toFixed(2);

        const { average, stdDev } = computeStatistics(pauseDurations);
        document.getElementById('pdf-average-pause').textContent = average.toFixed(2);
        document.getElementById('pdf-std-dev').textContent = stdDev.toFixed(2);

        document.getElementById('pdf-session-duration').textContent = totalSessionTime.toFixed(2);

        trendOfPauseDurations = computePauseTrend(pauseDurations);
        document.getElementById('pdf-pause-trend').textContent = trendOfPauseDurations;

        const finalScore = calculateFinalScore(
            totalPauseTime,
            totalActiveTime,
            pauseDurations.length,
            spaceBarAttemptCount
        );
        finalScoreElem.textContent = `Score: ${finalScore.toFixed(2)}`;
        document.getElementById('pdf-final-score').textContent = `${finalScore.toFixed(2)} / 1000`;

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString(); 
        const formattedTime = currentDate.toLocaleTimeString(); 
        document.getElementById('pdf-date').textContent = formattedDate;
        document.getElementById('pdf-time').textContent = formattedTime;

        const selectedLevelOption = levelSelect.options[levelSelect.selectedIndex].textContent.trim();
        document.getElementById('pdf-level').textContent = selectedLevelOption;
        document.getElementById('pdf-difficulty').textContent = 
            selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);

        // ===========================
        // PDF pause durations in SECONDS with two decimals
        // ===========================
        if (pauseDurations.length > 0) {
            // Convert each pause duration from ms -> s, then format
            document.getElementById('pdf-pause-durations').textContent =
                pauseDurations.map(d => (d / 1000).toFixed(2)).join(", ");
        } else {
            document.getElementById('pdf-pause-durations').textContent = 
                "Aucune pause enregistrée.";
        }
        document.getElementById('pdf-space-bar-attempts').textContent = spaceBarAttemptCount;

        if (totalSessionTime > 0) {
            const pausePercentage = (totalPauseTime / totalSessionTime) * 100;
            document.getElementById('pdf-time-ratio').textContent = 
                ` ${pausePercentage.toFixed(2)}%`;
        } else {
            document.getElementById('pdf-time-ratio').textContent = 
                "Impossible de calculer le pourcentage.";
        }

        // Chosen image for PDF
        let chosenImageObj = null;
        if (selectedSpacePromptImage) {
            chosenImageObj = spacePromptImages.find(img => img.src === selectedSpacePromptImage);
        }
        const pdfChosenImage = document.getElementById('pdf-chosen-image');
        pdfChosenImage.src = chosenImageObj ? chosenImageObj.src : '';

        // Chosen sound for PDF
        let chosenSoundObj = null;
        if (selectedSound) {
            chosenSoundObj = spacePromptSounds.find(s => s.value === selectedSound);
        }
        if (chosenSoundObj && chosenSoundObj.label) {
            document.getElementById('pdf-chosen-sound').textContent = chosenSoundObj.label;
        } else {
            document.getElementById('pdf-chosen-sound').textContent = "Aucun son choisi.";
        }

        // ================================================
        // CAUSE-EFFECT SCORE + FREQUENCY PENALTY
        // ================================================
        const sessionLengthSec = totalSessionTime;
        const sessionLengthMin = sessionLengthSec / 60;
        const tieredWrongCount = adjustedWrongCountTiered(spaceBarAttemptCount, sessionLengthMin);

        let totalPresses = pauseDurations.length + spaceBarAttemptCount; 
        let wrongPressRatio = 0;
        if (totalPresses > 0) {
            wrongPressRatio = tieredWrongCount / totalPresses;
        }

        let ratioPart = medianPauseTime / TIME_THRESHOLD;
        if (ratioPart > 1) ratioPart = 1;

        let baseCauseEffectScore = 
            0.5 * (1 - ratioPart) + 
            0.5 * (1 - wrongPressRatio);

        const baseAllowed = sessionLengthSec / 10; 
        const maxAllowed  = sessionLengthSec / 3;  
        const x = spaceBarAttemptCount;
        let overPressPenalty = 0;
        if (x > baseAllowed) {
            overPressPenalty = (x - baseAllowed) / (maxAllowed - baseAllowed);
        }

        const penaltyWeight = 0.3;
        let finalCauseEffectScore = 
            baseCauseEffectScore - penaltyWeight * overPressPenalty;

        if (finalCauseEffectScore < 0) finalCauseEffectScore = 0;
        if (finalCauseEffectScore > 1) finalCauseEffectScore = 1;

        document.getElementById('pdf-cause-effect-score').textContent = 
            (finalCauseEffectScore * 100).toFixed(2) + "%";


        // Show results screen
        resultsScreen.style.display = 'flex';
        resultsScreen.classList.add('show'); 
    }

    let isSpaceKeyPressed = false; 

    function handleSpacebarPress(event) {
        if (event.code === 'Space' && !isSpaceKeyPressed) {
            isSpaceKeyPressed = true; 
            if (preventInput) {
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
                    mediaPlayer.play().catch(err => {});
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

    // Prevent input if needed
    document.addEventListener('keydown', (event) => {
        if (preventInput && event.code !== 'Space') {
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

    // Misc Options and Modals
    const miscOptionsContainer = document.getElementById('misc-options-container');
    const miscOptionsModal = document.getElementById('misc-options-modal');
    const closeMiscOptionsModal = document.getElementById('close-misc-options-modal');
    const miscOptionsOkButton = document.getElementById('misc-options-ok-button');
    loadMiscOptions();
    const miscOptionsButton = document.getElementById('misc-options-button');
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
    });

    function handleRightClickNextVideo(event) {
        event.preventDefault();
        if (mediaPlayer) {
            mediaPlayer.currentTime = 0;
            mediaPlayer.play().catch(err => {});
        }
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
        showOverlayScreen();
    }

    levelSelect.addEventListener('change', () => {
        const selectedOption = levelSelect.options[levelSelect.selectedIndex];
        if (selectedOption) {
            const newVideoSource = selectedOption.getAttribute('data-video-source');
            if (mediaPlayer) {
                mediaPlayer.src = newVideoSource;
                mediaPlayer.load();
                timestampsEasy = selectedOption.getAttribute('data-timestamps-easy').split(',').map(Number);
                timestampsMedium = selectedOption.getAttribute('data-timestamps-medium').split(',').map(Number);
                timestampsHard = selectedOption.getAttribute('data-timestamps-hard').split(',').map(Number);
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

    const continueButton = document.getElementById('continue-button');
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            location.reload();
        });
    }

    loadConfig();

    // Statistics helpers
    function computeStatistics(pauseDurations) {
        if (pauseDurations.length === 0) {
            return { average: 0, stdDev: 0 };
        }
        const pausesInSeconds = pauseDurations.map(d => d / 1000);
        const N = pausesInSeconds.length;
        const sum = pausesInSeconds.reduce((a, b) => a + b, 0);
        const average = sum / N;
        let stdDev = 0;
        if (N > 1) {
            const variance = pausesInSeconds.reduce((acc, val) => 
                acc + Math.pow(val - average, 2), 0) / (N - 1);
            stdDev = Math.sqrt(variance);
        }
        return { average, stdDev };
    }

    function computeMedian(pauseDurations) {
        if (pauseDurations.length === 0) return 0;
        // Convert to seconds first, then sort
        const sorted = pauseDurations.slice().sort((a, b) => a - b)
            .map(d => d / 1000);
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
            return sorted[mid];
        }
    }

    function computePauseTrend(pauseDurations) {
        if (pauseDurations.length < 2) return "Insufficient data";
        let increasing = 0;
        let decreasing = 0;
        for (let i = 1; i < pauseDurations.length; i++) {
            if (pauseDurations[i] > pauseDurations[i - 1]) increasing++;
            else if (pauseDurations[i] < pauseDurations[i - 1]) decreasing++;
        }
        if (increasing > decreasing) return "Croissant";
        if (decreasing > increasing) return "Décroissant";
        return "Stable";
    }

    function calculateRPA(totalPauseTime, totalActiveTime) {
        if (totalActiveTime === 0) return 0;
        return totalPauseTime / totalActiveTime;
    }

    function calculateAveragePauseTime(totalPauseTime, numberOfPauses) {
        if (numberOfPauses === 0) return 0;
        return totalPauseTime / numberOfPauses;
    }

    function calculateNormalizedAPT(apt) {
        const normalizedAPT = (apt / MAX_AVG_PAUSE_TIME) * 100;
        return Math.min(normalizedAPT, 100);
    }

    function calculateNSPPenalty(nsp) {
        const cappedNSP = Math.min(nsp, NSP_CAP);
        return cappedNSP * WEIGHT_NSP;
    }

    function calculateFinalScore(totalPauseTime, totalActiveTime, numberOfPauses, nsp) {
        const rpa = calculateRPA(totalPauseTime, totalActiveTime);
        const apt = calculateAveragePauseTime(totalPauseTime, numberOfPauses);
        const normalizedAPT = calculateNormalizedAPT(apt);
        const aptPenalty = (normalizedAPT / 100) * WEIGHT_APT; 
        const rpaPenalty = rpa * WEIGHT_RPA;
        const nspPenalty = calculateNSPPenalty(nsp);
        const finalScore = 1000 - rpaPenalty - aptPenalty - nspPenalty;
        return Math.max(finalScore, 0);
    }

    // PDF generation logic
    const downloadPdfButton = document.getElementById('download-pdf-button');
    const pdfInfoModal = document.getElementById('pdf-info-modal');
    const closePdfInfoModal = document.getElementById('close-pdf-info-modal');
    const pdfInfoOkButton = document.getElementById('pdf-info-ok-button');

    downloadPdfButton.addEventListener('click', () => {
        preventInput = false;
        pdfInfoModal.style.display = 'block';
    });

    if (closePdfInfoModal) {
        closePdfInfoModal.addEventListener('click', () => {
            pdfInfoModal.style.display = 'none';
        });
    }

    pdfInfoOkButton.addEventListener('click', async () => {
        const studentNameInput = document.getElementById('pdf-student-name-input').value.trim();
        const switchTypeInput = document.getElementById('pdf-switch-type-input').value.trim();
        const switchPositionInput = document.getElementById('pdf-switch-position-input').value.trim();

        document.getElementById('pdf-student-name').textContent = studentNameInput || "Not Provided";
        document.getElementById('pdf-switch-type').textContent = switchTypeInput || "Not Provided";
        document.getElementById('pdf-switch-position').textContent = switchPositionInput || "Not Provided";

        pdfInfoModal.style.display = 'none';

        const pdfSectionPage1 = document.getElementById('pdf-summary-page1');
        const pdfSectionPage2 = document.getElementById('pdf-summary-page2');

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'pt', 'a4');

        const canvas1 = await html2canvas(pdfSectionPage1, { scale: 2, useCORS: true, allowTaint: false });
        const imgData1 = canvas1.toDataURL('image/png');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth - 80;
        const aspectRatio = canvas1.width / canvas1.height;
        const imgHeight = imgWidth / aspectRatio;
        pdf.addImage(imgData1, 'PNG', 40, 40, imgWidth, imgHeight);

        pdf.addPage();

        const canvas2 = await html2canvas(pdfSectionPage2, { scale: 2, useCORS: true, allowTaint: false });
        const imgData2 = canvas2.toDataURL('image/png');
        const pageWidth2 = pdf.internal.pageSize.getWidth();
        const imgWidth2 = pageWidth2 - 80;
        const aspectRatio2 = canvas2.width / canvas2.height;
        const imgHeight2 = imgWidth2 / aspectRatio2;
        pdf.addImage(imgData2, 'PNG', 40, 40, imgWidth2, imgHeight2);

        pdf.save('Rapport_Switch.pdf');
    });
});
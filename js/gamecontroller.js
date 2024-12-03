document.addEventListener('DOMContentLoaded', () => {
    let preventInput = false;

    // Retrieve data attributes from the body
    const mediaType = document.body.getAttribute('data-media-type'); // 'audio' or 'video'
    const videoSource = document.body.getAttribute('data-video-source');
    let timestampsEasy = document.body.getAttribute('data-timestamps-easy').split(',').map(Number);
    let timestampsMedium = document.body.getAttribute('data-timestamps-medium').split(',').map(Number);
    let timestampsHard = document.body.getAttribute('data-timestamps-hard').split(',').map(Number);
    const promptText = document.body.getAttribute('data-prompt-text');
    const pauseSoundSrc = document.body.getAttribute('data-pause-sound');

    // Common Elements
    const startButton = document.getElementById('control-panel-start-button');
    const overlayScreen = document.getElementById('overlay-screen');
    const playModeSelect = document.getElementById('control-panel-play-mode');
    const soundOptionsSelect = document.getElementById('sound-options-select');
    const levelSelect = document.getElementById('level-select');

    // Media Elements
    const videoContainer = document.getElementById('video-container');
    let mediaPlayer = null;

    if (mediaType === 'video') {
        mediaPlayer = document.getElementById('video-player');
        mediaPlayer.src = videoSource;
    }

    // Recording Elements
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

    // Space Prompt Image Selection Elements
    const selectSpacePromptButton = document.getElementById('select-space-prompt-button');
    const spacePromptModal = document.getElementById('space-prompt-selection-modal');
    const closeSpacePromptModal = document.getElementById('close-space-prompt-modal');
    const spacePromptImagesContainer = document.getElementById('space-prompt-selection');
    const spacePromptOkButton = document.getElementById('apply-space-prompt');
    const textPromptInput = document.getElementById('text-prompt-input');

    let selectedSpacePromptImage = null;
    let customTextPrompt = null;

    // State Variables
    let selectedDifficulty = 'easy';
    let timestamps = [];
    let currentTimestampIndex = 0;
    let pausedAtTime = 0;
    let controlsEnabled = false;

    let pauseSoundInterval = null; // Variable to store the interval ID for pause sound prompts
    let pauseSoundTimeout = null;  // Variable to store the timeout ID for the initial delay

    // Configuration Arrays (Assuming these are globally available via config.js)
    // const spacePromptImages = [...];
    // const spacePromptSounds = [...];
    // const miscOptions = [...];

    // Function to Populate Sound Options Dropdown
    function populateSoundOptions() {
        if (!Array.isArray(spacePromptSounds) || spacePromptSounds.length === 0) {
            console.error("spacePromptSounds is not defined or empty.");
            return;
        }

        spacePromptSounds.forEach(option => {
            const soundOption = document.createElement('option');
            soundOption.value = option.value;
            soundOption.textContent = option.label;
            soundOptionsSelect.appendChild(soundOption);
        });
    }

    // Function to Populate Miscellaneous Options
    function populateMiscOptions() {
        const miscOptionsContainer = document.getElementById('misc-options-container');
        if (!Array.isArray(miscOptions) || miscOptions.length === 0) {
            console.error("miscOptions is not defined or empty.");
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

    // Function to Load Miscellaneous Options State
    const miscOptionsState = {};
    function loadMiscOptions() {
        populateMiscOptions();
    }

    // Function to Load Configuration and Populate Dropdowns
    function loadConfig() {
        // Populate sound options
        populateSoundOptions();

        // Set initial timestamps based on default selected difficulty
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

    // Event Listener for Play Mode Selection
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

    // Event Listener for Sound Options
    soundOptionsSelect.addEventListener('change', () => {
        if (soundOptionsSelect.value === 'record-own') {
            openRecordModal(); // Open modal to record custom sound
        } else {
            selectedSound = soundOptionsSelect.value;
        }
    });

    // Function to Open the Recording Modal
    function openRecordModal() {
        recordModal.style.display = 'block';
    }

    // Function to Close the Recording Modal
    closeRecordModal.addEventListener('click', () => {
        recordModal.style.display = 'none';
    });

    // Record Button Event to Start Recording Audio
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

                // Auto stop after 5 seconds
                setTimeout(() => {
                    stopRecording();
                }, 5000);
            }).catch(err => {
                console.error('Error accessing microphone: ', err);
                recordStatus.textContent = "Erreur d'accès au microphone";
            });
        }
    });

    // Function to Stop Recording
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            stopRecordingButton.style.display = 'none';
            recordButton.style.display = 'block';
        }
    }

    // Stop Recording Button Event
    stopRecordingButton.addEventListener('click', () => {
        stopRecording();
    });

    // OK Recording Button Event
    okRecordingButton.addEventListener('click', () => {
        stopRecording();
        recordModal.style.display = 'none';
        okRecordingButton.style.display = 'none';
        stopRecordingButton.style.display = 'none';
        recordButton.style.display = 'block';

        // Play the recorded sound after closing the modal
        if (recordedAudio) {
            currentSound = new Audio(recordedAudio);
            currentSound.play().catch(err => {
                console.error("Error playing recorded sound:", err);
            });
        }
    });

    // Function to Play the Sound Prompt
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
                // Handle other predefined sounds if any
                const soundOption = spacePromptSounds.find(option => option.value === selectedSound);
                if (soundOption && soundOption.src) {
                    currentSound = new Audio(soundOption.src);
                }
            }

            if (currentSound) {
                currentSound.play().catch(err => {
                    console.error("Error playing sound:", err);
                });
            }
        }
    }

    // Start Button Event to Begin the Game
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
    
        // Enter fullscreen mode
        const elem = document.documentElement; // The entire document or a specific element can be fullscreen
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
    
        // Reset video and timestamps
        currentTimestampIndex = 0;
        if (mediaPlayer) {
            mediaPlayer.currentTime = 0;
            videoContainer.style.display = 'block';
            mediaPlayer.addEventListener('timeupdate', handleTimeUpdate);
            mediaPlayer.play().catch(err => {
                console.error("Error playing video:", err);
            });
        }
    
        overlayScreen.classList.remove('show');
    });
    

    // Function to Handle Time Updates and Check for Timestamps
    function handleTimeUpdate() {
        if (!mediaPlayer) return;

        const currentTime = mediaPlayer.currentTime;
        if (currentTimestampIndex < timestamps.length && currentTime >= timestamps[currentTimestampIndex]) {
            mediaPlayer.pause();
            pausedAtTime = currentTime;

            // Show overlay when paused at a timestamp
            showOverlayScreen();

            // Increment to the next timestamp
            currentTimestampIndex++;
        }
    }

    // Function to Show the Overlay with Sound Prompts and Image Animation
    // Function to Show the Overlay with Sound Prompts and Image Animation
    function showOverlayScreen() {
        overlayScreen.classList.add('show'); // Show the overlay
        controlsEnabled = true;
    
        if (selectedSpacePromptImage) {
            // Display the space prompt image
            const spacePromptImage = document.getElementById('space-prompt-image');
            spacePromptImage.src = selectedSpacePromptImage; // Set the image source
            spacePromptImage.classList.remove('hidden'); // Make the image visible
    
            // Reset styles in case they were modified previously
            spacePromptImage.style.transform = 'translate(-50%, -50%) scale(0.1)';
            spacePromptImage.style.opacity = '1';
    
            // Force a reflow to ensure the browser notices the change in styles
            void spacePromptImage.offsetWidth;
    
            // Start the animation by changing the transform
            spacePromptImage.style.transform = 'translate(-50%, -50%) scale(1)';
    
            // After the animation ends, keep the image visible for 5 seconds
            setTimeout(() => {
                spacePromptImage.style.opacity = '0'; // Start fading out
            }, 5000); // Keep the image visible for 5 seconds (duration of the animation)
    
            // Remove the image from the DOM after the fade-out completes
            setTimeout(() => {
                spacePromptImage.classList.add('hidden'); // Hide the image
                // Reset styles for next time
                spacePromptImage.style.transform = 'translate(-50%, -50%) scale(0.1)';
                spacePromptImage.style.opacity = '1';
            }, 5500); // Total display time (5s + 0.5s fade-out)
        }
    
        // Play the sound prompt immediately when the overlay appears
        playPauseSound();
    
        // Synchronize the animation and sound to repeat every 20 seconds
        pauseSoundInterval = setInterval(() => {
            // Trigger animation and sound together
            if (selectedSpacePromptImage) {
                // Trigger image animation
                const spacePromptImage = document.getElementById('space-prompt-image');
                spacePromptImage.src = selectedSpacePromptImage;
                spacePromptImage.classList.remove('hidden');
                spacePromptImage.style.transform = 'translate(-50%, -50%) scale(0.1)';
                spacePromptImage.style.opacity = '1';
    
                void spacePromptImage.offsetWidth; // Force reflow
                spacePromptImage.style.transform = 'translate(-50%, -50%) scale(1)';
    
                setTimeout(() => {
                    spacePromptImage.style.opacity = '0';
                }, 5000); // Keep the image visible for 5 seconds
    
                setTimeout(() => {
                    spacePromptImage.classList.add('hidden');
                    spacePromptImage.style.transform = 'translate(-50%, -50%) scale(0.1)';
                    spacePromptImage.style.opacity = '1';
                }, 5500);
            }
    
            // Trigger sound
            playPauseSound();
        }, 20000); // 20-second interval
    }
    
    


    // Function to Hide the Overlay and Resume Playback
    function hideOverlayScreen() {
        overlayScreen.classList.remove('show'); // Hide the overlay
        controlsEnabled = false;

        // Clear the timeout and interval to stop sound prompts
        if (pauseSoundTimeout) {
            clearTimeout(pauseSoundTimeout);
            pauseSoundTimeout = null;
        }

        if (pauseSoundInterval) {
            clearInterval(pauseSoundInterval);
            pauseSoundInterval = null;
        }

        startMediaPlayback();
    }

    // Function to Start Media Playback
    function startMediaPlayback() {
        if (mediaPlayer) {
            mediaPlayer.removeAttribute('controls');
            mediaPlayer.play().catch(err => {
                console.error("Error playing media:", err);
            });

            if (mediaType === 'video') {
                videoContainer.style.display = 'block';
            }

            // Attach event listener for media end
            mediaPlayer.addEventListener('ended', handleMediaEnd);
        }
    }

    // Function to Handle Media End
    function handleMediaEnd() {
        // Refresh the page to return to the Control Panel
        location.reload();
    }

    // Function to Handle Space Bar Press
    function handleSpacebarPress(event) {
        if (preventInput) return;
        if (controlsEnabled && event.code === 'Space') {
            event.preventDefault();

            hideOverlayScreen(); // Hide the overlay and stop sound prompts
            if (pausedAtTime > 0 && mediaPlayer) {
                mediaPlayer.currentTime = pausedAtTime;
                mediaPlayer.play().catch(err => {
                    console.error("Error resuming media:", err);
                });
                pausedAtTime = 0;
            }

            preventInputTemporarily();
        }
    }

    // Function to Temporarily Prevent Rapid Inputs
    function preventInputTemporarily() {
        preventInput = true;
        setTimeout(() => {
            preventInput = false;
        }, 500);
    }

    // Attach Event Listener for Space Bar Press
    document.addEventListener('keydown', handleSpacebarPress);

    // Miscellaneous Options Handling
    const miscOptionsContainer = document.getElementById('misc-options-container');
    const miscOptionsModal = document.getElementById('misc-options-modal');
    const closeMiscOptionsModal = document.getElementById('close-misc-options-modal');
    const miscOptionsOkButton = document.getElementById('misc-options-ok-button');

    // Load Miscellaneous Options
    loadMiscOptions();

    // Miscellaneous Options Button Event
    const miscOptionsButton = document.getElementById('misc-options-button');
    miscOptionsButton.addEventListener('click', () => {
        miscOptionsModal.style.display = 'block';
    });

    // Close Miscellaneous Options Modal
    closeMiscOptionsModal.addEventListener('click', () => {
        miscOptionsModal.style.display = 'none';
    });

    // Miscellaneous Options OK Button Event
    miscOptionsOkButton.addEventListener('click', () => {
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

    // Function to Handle Right-Click to Advance Video
    function handleRightClickNextVideo(event) {
        event.preventDefault(); // Prevent the context menu from appearing
        if (mediaPlayer) {
            mediaPlayer.currentTime = 0;
            mediaPlayer.play().catch(err => {
                console.error("Error playing media:", err);
            });
        }
    }

    // Function to Handle Space Bar Press Equivalent via Mouse Click
    function handleSpacebarPressEquivalent(event) {
        handleSpacebarPress({ code: 'Space', preventDefault: () => {} });
    }

    // Function to Handle Enter Key to Pause Activity
    function handleEnterPause(event) {
        if (miscOptionsState['enter-pause-option'] && event.code === 'Enter') {
            event.preventDefault();
            pauseActivityAndShowPrompt();
        }
    }

    // Attach Event Listener for Enter Key Press
    document.addEventListener('keydown', handleEnterPause);

    // Function to Pause Activity and Show Prompt
    function pauseActivityAndShowPrompt() {
        if (mediaPlayer && !mediaPlayer.paused) {
            pausedAtTime = mediaPlayer.currentTime;
            mediaPlayer.pause();
        }
        showOverlayScreen(); // Show the overlay with delayed and periodic sound prompts
    }

    // Handle Level Selection Dropdown
    levelSelect.addEventListener('change', () => {
        const selectedOption = levelSelect.options[levelSelect.selectedIndex];
        if (selectedOption) {
            const newVideoSource = selectedOption.getAttribute('data-video-source');
            if (mediaPlayer) {
                mediaPlayer.src = newVideoSource;
                mediaPlayer.load();

                // Update timestamp arrays based on the selected level's data attributes
                timestampsEasy = selectedOption.getAttribute('data-timestamps-easy').split(',').map(Number);
                timestampsMedium = selectedOption.getAttribute('data-timestamps-medium').split(',').map(Number);
                timestampsHard = selectedOption.getAttribute('data-timestamps-hard').split(',').map(Number);

                // Update the timestamps array based on the currently selected difficulty
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
            } else {
                console.error("mediaPlayer is not defined.");
            }

            // Show the Start button
            startButton.classList.remove('hidden');

            // Hide video container until the game starts
            videoContainer.classList.add('hidden');
        }
    });

    // Open the space prompt image selection modal
    selectSpacePromptButton.addEventListener('click', () => {
        populateSpacePromptImages();
        spacePromptModal.style.display = 'block';
    });

    // Close the space prompt modal
    closeSpacePromptModal.addEventListener('click', () => {
        spacePromptModal.style.display = 'none';
    });

    // OK button in the space prompt modal
    spacePromptOkButton.addEventListener('click', () => {
        customTextPrompt = textPromptInput.value.trim() || null;
        spacePromptModal.style.display = 'none';
    });

    // Function to populate images in the space prompt modal
    function populateSpacePromptImages() {
        // Clear any existing images
        spacePromptImagesContainer.innerHTML = '';

        spacePromptImages.forEach(image => {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            imageCard.dataset.src = image.src;
            imageCard.innerHTML = `<img src="${image.src}" alt="${image.alt}">`;

            // If this image is the selected one, add the 'selected' class
            if (selectedSpacePromptImage === image.src) {
                imageCard.classList.add('selected');
            }

            // Add click event to select the image
            imageCard.addEventListener('click', () => {
                // Remove 'selected' class from all image cards
                const imageCards = spacePromptImagesContainer.querySelectorAll('.image-card');
                imageCards.forEach(card => card.classList.remove('selected'));

                // Add 'selected' class to the clicked image card
                imageCard.classList.add('selected');

                // Set the selected image and clear any custom text
                selectedSpacePromptImage = imageCard.dataset.src;
                customTextPrompt = null;
                textPromptInput.value = '';
            });

            spacePromptImagesContainer.appendChild(imageCard);
        });
    }

    // Initialize Configuration
    loadConfig();
});

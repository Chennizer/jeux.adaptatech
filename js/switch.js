document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('control-panel-start-button');
    const blackBackground = document.getElementById('black-background');
    const spacePrompt = document.getElementById('space-prompt');
    const textPrompt = document.getElementById('text-prompt'); // Text prompt element
    const videoContainer = document.getElementById('video-container');
    const videoPlayer = document.getElementById('video-player');
    const playModeSelect = document.getElementById('control-panel-play-mode');
    const intervalTimeInput = document.getElementById('interval-time');
    const intervalLabel = document.getElementById('interval-label');
    const selectVideosButton = document.getElementById('select-videos-button');
    const videoSelectionModal = document.getElementById('video-selection-modal');
    const closeModal = document.getElementById('close-modal');
    const okButton = document.getElementById('ok-button');
    const videoCards = document.querySelectorAll('.video-card');
    const introJingle = document.getElementById('intro-jingle');

    // Visual and Sound Options
    const visualOptionsSelect = document.getElementById('special-options-select'); 
    const soundOptionsSelect = document.getElementById('sound-options-select');
    const soundEffects = document.querySelectorAll('.sound-effect'); 
    const gongSound = document.getElementById('gong-sound');
    const pianoSound = document.getElementById('piano-sound');
    const roosterSound = document.getElementById('rooster-sound');
    const recordModal = document.getElementById('record-modal'); // New modal for recording
    const recordButton = document.getElementById('record-button'); // Button inside modal
    const stopRecordingButton = document.getElementById('stop-recording-button'); // New stop button
    const okRecordingButton = document.getElementById('ok-recording-button'); // New OK button
    const closeRecordModal = document.getElementById('close-record-modal');
    const recordStatus = document.getElementById('record-status'); // Status text

    let selectedSound = 'none'; // Default sound
    let currentSound = null; // Store the current playing sound
    let recordedAudio = null; // Store recorded audio
    let mediaRecorder; // For recording audio
    let audioChunks = []; // Stores chunks of audio data during recording

    // Set volume for all sounds using the 'sound-effect' class
    soundEffects.forEach(sound => {
        sound.volume = 0.5; 
    });

    // Space Prompt Image and Text Selection
    const selectSpacePromptButton = document.getElementById('select-space-prompt-button');
    const spacePromptSelectionModal = document.getElementById('space-prompt-selection-modal');
    const closeSpacePromptModal = document.getElementById('close-space-prompt-modal');
    const imageCards = document.querySelectorAll('.image-card');
    const textPromptInput = document.getElementById('text-prompt-input');
    const applySpacePromptButton = document.getElementById('apply-space-prompt');
    let selectedSpacePromptSrc = ''; 
    let useTextPrompt = false; 

    // Default to the first image in the list
    imageCards[0].classList.add('selected');
    selectedSpacePromptSrc = imageCards[0].dataset.src;

    // Videos
    let selectedVideos = Array.from(videoCards).map(card => card.dataset.src);
    let controlsEnabled = false;
    let playedVideos = [];
    let currentVideoIndex = 0;
    let mode = 'pressBetween';
    let intervalID = null;
    let intervalTime = 5;
    let pausedAtTime = 0;

    console.log("Document loaded");

    // Mark all video cards as selected by default
    videoCards.forEach(card => card.classList.add('selected'));

    // Play the intro jingle when the control panel is shown
    function playIntroJingle() {
        introJingle.play();
    }

    // Preload Videos
    function preloadVideos(videos, onComplete) {
        let videosLoaded = 0;
        const totalVideos = videos.length;
        const loadingBar = document.getElementById('control-panel-loading-bar');

        videos.forEach((videoSrc, index) => {
            const video = document.createElement('video');
            video.src = videoSrc;
            video.preload = 'auto';
            video.style.display = 'none';
            document.body.appendChild(video);

            video.addEventListener('canplaythrough', () => {
                videosLoaded++;
                const progress = (videosLoaded / totalVideos) * 100;
                loadingBar.style.width = `${progress}%`;

                if (videosLoaded === totalVideos) {
                    console.log("All videos preloaded");
                    onComplete();
                }
            });

            video.addEventListener('error', (e) => {
                console.error(`Error preloading video ${index + 1}:`, e);
            });
        });
    }

    // Initially hide the start button
    startButton.style.display = 'none';

    // Hide interval input and label by default on page load
    intervalLabel.style.display = 'none';
    intervalTimeInput.style.display = 'none';

    // Show the video selection modal
    selectVideosButton.addEventListener('click', () => {
        videoSelectionModal.style.display = 'block';
    });

    // Close the video modal using the close button
    closeModal.addEventListener('click', () => {
        videoSelectionModal.style.display = 'none';
    });

    // Handle OK button click to close the modal and update the selected videos
    okButton.addEventListener('click', () => {
        updateSelectedVideos();
        videoSelectionModal.style.display = 'none';
    });

    // Update selected videos based on clicked video cards
    videoCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('selected');
            updateSelectedVideos();
        });
    });

    // Update the selectedVideos array based on which video cards are selected
    function updateSelectedVideos() {
        selectedVideos = Array.from(videoCards)
            .filter(card => card.classList.contains('selected'))
            .map(card => card.dataset.src);

        // If no videos are selected, use all videos by default
        if (selectedVideos.length === 0) {
            selectedVideos = Array.from(videoCards).map(card => card.dataset.src);
        }
    }

    preloadVideos(selectedVideos, () => {
        console.log("Preloading complete, displaying start button");
        startButton.style.display = 'block';
        document.getElementById('control-panel-loading-bar-container').style.display = 'none';
        playIntroJingle();
    });

    // Add event listener for play mode selection change
    playModeSelect.addEventListener('change', () => {
        mode = playModeSelect.value;
        if (mode === 'interval') {
            intervalLabel.style.display = 'inline-block'; // Show interval options
            intervalTimeInput.style.display = 'inline-block';
        } else {
            intervalLabel.style.display = 'none'; 
            intervalTimeInput.style.display = 'none';
        }
    });

    // Handle space prompt sound selection change
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
                    recordedAudio = new Audio(URL.createObjectURL(audioBlob));
                    recordedAudio.volume = 0.5; // Set volume
                    selectedSound = 'custom'; // Set custom sound
                    recordStatus.textContent = "Recording complete!";
                    okRecordingButton.style.display = 'block'; // Show OK button
                };

                recordStatus.textContent = "Recording...";
                stopRecordingButton.style.display = 'block'; // Show stop button during recording
                recordButton.style.display = 'none'; // Hide the record button during recording
                setTimeout(() => {
                    stopRecording(); // Auto stop after 5 seconds
                }, 5000);
            }).catch(err => {
                console.error('Error accessing microphone: ', err);
                recordStatus.textContent = "Error accessing microphone";
            });
        }
    });

    // Function to stop recording manually or automatically
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop(); // Stop the recording
            stopRecordingButton.style.display = 'none'; // Hide stop button
            recordButton.style.display = 'block'; // Show record button again for new recording
        }
    }

    // Stop button event to manually stop recording
    stopRecordingButton.addEventListener('click', () => {
        stopRecording(); // Stop recording when the stop button is clicked
    });

    // OK button event to confirm the recording and close the modal
    okRecordingButton.addEventListener('click', () => {
        stopRecording(); // Ensure recording is stopped
        recordModal.style.display = 'none'; // Close the modal
        okRecordingButton.style.display = 'none'; // Hide the OK button after closing the modal
        stopRecordingButton.style.display = 'none'; // Hide stop button
        recordButton.style.display = 'block'; // Reset record button for next use
    });

    startButton.addEventListener('click', () => {
        if (selectedVideos.length === 0) {
            alert("Please select at least one video to start the game.");
            return;
        }

        if (mode === 'interval') {
            intervalTime = parseInt(intervalTimeInput.value);
            if (isNaN(intervalTime) || intervalTime <= 0) {
                alert("Please enter a valid interval time in seconds.");
                return;
            }
        }

        document.getElementById('control-panel').style.display = 'none';
        playedVideos = [];
        currentVideoIndex = getNextVideoIndex();
        showSpacePrompt();
    });

    function showSpacePrompt() {
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

        playSpacePromptSound();
    }

    function playSpacePromptSound() {
        if (currentSound) {
            currentSound.pause();
            currentSound.currentTime = 0; 
        }

        if (selectedSound === 'gong-sound') {
            currentSound = gongSound;
        } else if (selectedSound === 'piano-sound') {
            currentSound = pianoSound;
        } else if (selectedSound === 'rooster-sound') {
            currentSound = roosterSound;
        } else if (selectedSound === 'custom' && recordedAudio) {
            currentSound = recordedAudio;
        }

        if (currentSound) {
            currentSound.play();
        }
    }

    function hideSpacePrompt() {
        blackBackground.style.display = 'none';
        spacePrompt.style.display = 'none';
        textPrompt.style.display = 'none'; 
        controlsEnabled = false;
    }

    function handleSpacebarPress(event) {
        if (controlsEnabled && event.code === 'Space') {
            event.preventDefault();
            if (currentSound) {
                currentSound.pause();
                currentSound.currentTime = 0; 
            }

            hideSpacePrompt();
            if (mode === 'interval' && pausedAtTime > 0) {
                videoPlayer.currentTime = pausedAtTime;
                videoPlayer.play();
                pausedAtTime = 0;
                setTimeout(setPauseInterval, 100);
            } else {
                startVideoPlayback();
            }
        }
    }

    function startVideoPlayback() {
        videoPlayer.removeAttribute('controls');
        videoContainer.style.display = 'block';
        videoPlayer.src = selectedVideos[currentVideoIndex];
        videoPlayer.play();

        if (mode === 'interval') {
            setPauseInterval();
        }
    }

    function setPauseInterval() {
        if (intervalID) {
            clearInterval(intervalID);
        }

        intervalID = setInterval(() => {
            pausedAtTime = videoPlayer.currentTime;
            videoPlayer.pause();
            showSpacePrompt();
            clearInterval(intervalID);
        }, intervalTime * 1000);
    }

    videoPlayer.addEventListener('play', () => {
        console.log("Video is playing");
    });

    videoPlayer.addEventListener('ended', () => {
        handleVideoEnd();
    });

    function handleVideoEnd() {
        if (mode === 'pressBetween') {
            if (playedVideos.length < selectedVideos.length) {
                currentVideoIndex = getNextVideoIndex();
                showSpacePrompt();
            } else {
                playedVideos = [];
                currentVideoIndex = getNextVideoIndex();
                showSpacePrompt();
            }
        } else if (mode === 'onePress' || mode === 'interval') {
            if (playedVideos.length < selectedVideos.length) {
                currentVideoIndex = getNextVideoIndex();
                startVideoPlayback();
            } else {
                playedVideos = [];
                currentVideoIndex = getNextVideoIndex();
                showSpacePrompt();
            }
        }
    }

    function getNextVideoIndex() {
        if (playedVideos.length === selectedVideos.length) {
            playedVideos = [];
        }

        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * selectedVideos.length);
        } while (playedVideos.includes(nextIndex));

        playedVideos.push(nextIndex);
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

    visualOptionsSelect.addEventListener('change', () => {
        const selectedOption = visualOptionsSelect.value;
        videoPlayer.className = ''; 

        switch (selectedOption) {
            case 'green-filter':
                videoPlayer.classList.add('green-filter');
                break;
            case 'red-filter':
                videoPlayer.classList.add('red-filter');
                break;
            case 'blue-filter':
                videoPlayer.classList.add('blue-filter');
                break;
            case 'high-contrast':
                videoPlayer.style.filter = 'contrast(200%)';
                break;
            case 'grayscale':
                videoPlayer.style.filter = 'grayscale(100%)';
                break;
            case 'invert':
                videoPlayer.style.filter = 'invert(100%)';
                break;
            case 'brightness':
                videoPlayer.style.filter = 'brightness(1.5)';
                break;
            case 'saturation':
                videoPlayer.style.filter = 'saturate(200%)';
                break;
            default:
                videoPlayer.style.filter = '';
                break;
        }
    });
});

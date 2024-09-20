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
    const visualOptionsSelect = document.getElementById('special-options-select'); // Corrected ID
    const soundOptionsSelect = document.getElementById('sound-options-select');
    const soundEffects = document.querySelectorAll('.sound-effect'); // Select all sound effect elements
    const gongSound = document.getElementById('gong-sound'); // Corrected to gong-sound
    const bellSound = document.getElementById('bell-sound');
    const chimeSound = document.getElementById('chime-sound');

    let selectedSound = 'none'; // Default sound
    let currentSound = null; // Store the current playing sound

    // Set volume for all sounds using the 'sound-effect' class
    soundEffects.forEach(sound => {
        sound.volume = 0.5; // Lower the volume
    });

    // Space Prompt Image and Text Selection
    const selectSpacePromptButton = document.getElementById('select-space-prompt-button');
    const spacePromptSelectionModal = document.getElementById('space-prompt-selection-modal');
    const closeSpacePromptModal = document.getElementById('close-space-prompt-modal');
    const imageCards = document.querySelectorAll('.image-card');
    const textPromptInput = document.getElementById('text-prompt-input'); // Text input for custom prompt
    const applySpacePromptButton = document.getElementById('apply-space-prompt');
    let selectedSpacePromptSrc = ''; // Holds either image src or text content
    let useTextPrompt = false; // Tracks if the user is using text instead of an image

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
            intervalLabel.style.display = 'none'; // Hide interval options
            intervalTimeInput.style.display = 'none';
        }
    });

    // Handle space prompt sound selection change
    soundOptionsSelect.addEventListener('change', () => {
        selectedSound = soundOptionsSelect.value;
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
        console.log("Control panel hidden, showing space prompt");
        playedVideos = [];
        currentVideoIndex = getNextVideoIndex();
        showSpacePrompt();
    });

    function showSpacePrompt() {
        console.log("Displaying space prompt");

        if (useTextPrompt && selectedSpacePromptSrc) {
            // Show the text prompt
            textPrompt.textContent = selectedSpacePromptSrc; // Use the text provided in the input
            textPrompt.style.display = 'block';
            spacePrompt.style.display = 'none'; // Hide the image prompt
        } else if (selectedSpacePromptSrc) {
            // Show the image prompt
            textPrompt.style.display = 'none';
            spacePrompt.src = selectedSpacePromptSrc;
            spacePrompt.style.display = 'block';
        }

        blackBackground.style.display = 'block';
        controlsEnabled = true;

        // Play selected sound when space prompt is displayed
        playSpacePromptSound();
    }

    function playSpacePromptSound() {
        // Pause the currently playing sound if any
        if (currentSound) {
            currentSound.pause();
            currentSound.currentTime = 0; // Reset the sound to start
        }

        if (selectedSound === 'gong-sound') {
            currentSound = gongSound;
        } else if (selectedSound === 'bell') {
            currentSound = bellSound;
        } else if (selectedSound === 'chime') {
            currentSound = chimeSound;
        }

        if (currentSound) {
            currentSound.play();
        }
    }

    function hideSpacePrompt() {
        console.log("Hiding space prompt");
        blackBackground.style.display = 'none';
        spacePrompt.style.display = 'none';
        textPrompt.style.display = 'none'; // Hide the text prompt as well
        controlsEnabled = false;
    }

    function handleSpacebarPress(event) {
        if (controlsEnabled && event.code === 'Space') {
            event.preventDefault();
            console.log("Spacebar pressed, hiding space prompt and starting video playback");

            // Stop the current sound if it's still playing
            if (currentSound) {
                currentSound.pause();
                currentSound.currentTime = 0; // Reset the sound to start
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
        console.log("Starting video playback");

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
        console.log("Video ended");
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
        console.log("Space prompt button clicked");
        spacePromptSelectionModal.style.display = 'block';
    });

    // Close the space prompt modal
    closeSpacePromptModal.addEventListener('click', () => {
        spacePromptSelectionModal.style.display = 'none';
    });

    // Handle image selection and text input for space prompt
    imageCards.forEach(card => {
        card.addEventListener('click', () => {
            // Deselect the text input
            textPromptInput.value = '';
            useTextPrompt = false;

            // Select the clicked image and deselect others
            imageCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedSpacePromptSrc = card.dataset.src; // Set the selected image
        });
    });

    // Handle text input focus (deselect images when text is typed)
    textPromptInput.addEventListener('input', () => {
        // Deselect all images when text is typed
        imageCards.forEach(card => card.classList.remove('selected'));
        selectedSpacePromptSrc = textPromptInput.value; // Set the inputted text as the prompt
        useTextPrompt = true;
    });

    // Apply the selected space prompt image or text
    applySpacePromptButton.addEventListener('click', () => {
        spacePromptSelectionModal.style.display = 'none';
        if (useTextPrompt && selectedSpacePromptSrc) {
            // Show the custom text prompt
            textPrompt.textContent = selectedSpacePromptSrc;
        }
    });

    // Add event listener for visual options selection change
    visualOptionsSelect.addEventListener('change', () => {
        const selectedOption = visualOptionsSelect.value;

        // Remove any previously applied filter
        videoPlayer.className = ''; // Clear existing classes

        // Apply selected visual filter
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
                // Normal (no filter)
                videoPlayer.style.filter = '';
                break;
        }
    });

});

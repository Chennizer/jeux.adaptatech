document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('control-panel-start-button');
    const blackBackground = document.getElementById('black-background');
    const spacePrompt = document.getElementById('space-prompt');
    const videoContainer = document.getElementById('video-container');
    const videoPlayer = document.getElementById('video-player');
    const playModeSelect = document.getElementById('control-panel-play-mode');
    const intervalTimeInput = document.getElementById('interval-time');
    const intervalLabel = document.getElementById('interval-label');
    const selectVideosButton = document.getElementById('select-videos-button');
    const videoSelectionModal = document.getElementById('video-selection-modal');
    const closeModal = document.getElementById('close-modal');
    const okButton = document.getElementById('ok-button'); // Reference to the OK button
    const videoCards = document.querySelectorAll('.video-card'); // Video cards
    const introJingle = document.getElementById('intro-jingle'); // Reference to the intro jingle element

    // Set all video cards as selected by default when the modal loads
    videoCards.forEach(card => {
        card.classList.add('selected'); // Mark all video cards as selected by default
    });

    let selectedVideos = Array.from(videoCards).map(card => card.dataset.src); // Default to all videos
    let controlsEnabled = false;
    let playedVideos = [];
    let currentVideoIndex = 0;
    let mode = 'onePress';
    let intervalID = null;
    let intervalTime = 5;
    let pausedAtTime = 0;

    console.log("Document loaded");

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

    // Show the video selection modal
    selectVideosButton.addEventListener('click', () => {
        videoSelectionModal.style.display = 'block';
    });

    // Close the modal using the close button
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
        startButton.style.display = 'block'; // Ensure the button is shown after videos are preloaded
        document.getElementById('control-panel-loading-bar-container').style.display = 'none';
        playIntroJingle(); // Play the jingle when the control panel is ready
    });

    playModeSelect.addEventListener('change', () => {
        mode = playModeSelect.value;
        if (mode === 'interval') {
            intervalLabel.style.display = 'block';
            intervalTimeInput.style.display = 'block';
        } else {
            intervalLabel.style.display = 'none';
            intervalTimeInput.style.display = 'none';
        }
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
        playedVideos = []; // Reset played videos list
        currentVideoIndex = getNextVideoIndex(); // Randomize the first video
        showSpacePrompt();
    });

    function showSpacePrompt() {
        console.log("Displaying space prompt");
        blackBackground.style.display = 'block';
        spacePrompt.style.display = 'block';
        controlsEnabled = true;
    }

    function hideSpacePrompt() {
        console.log("Hiding space prompt");
        blackBackground.style.display = 'none';
        spacePrompt.style.display = 'none';
        controlsEnabled = false;
    }

    function handleSpacebarPress(event) {
        if (controlsEnabled && event.code === 'Space') {
            event.preventDefault();
            console.log("Spacebar pressed, hiding space prompt and starting video playback");
            hideSpacePrompt();
            if (mode === 'interval' && pausedAtTime > 0) {
                videoPlayer.currentTime = pausedAtTime; // Resume from where it paused
                videoPlayer.play();
                pausedAtTime = 0; // Reset paused time
                setTimeout(setPauseInterval, 100); // Restart the interval pause mechanism after a brief delay
            } else {
                startVideoPlayback();
            }
        }
    }

    function startVideoPlayback() {
        console.log("Starting video playback");

        // Ensure the controls are not shown
        videoPlayer.removeAttribute('controls');

        videoContainer.style.display = 'block';
        videoPlayer.src = selectedVideos[currentVideoIndex];
        videoPlayer.play();

        if (mode === 'interval') {
            setPauseInterval(); // Set up the interval pauses
        }
    }

    function setPauseInterval() {
        // Ensure any existing interval is cleared before starting a new one
        if (intervalID) {
            clearInterval(intervalID);
        }

        intervalID = setInterval(() => {
            pausedAtTime = videoPlayer.currentTime; // Capture the current time before pausing
            videoPlayer.pause();
            showSpacePrompt();
            clearInterval(intervalID); // Clear the interval once paused
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
                playedVideos = []; // Reset the playedVideos array
                currentVideoIndex = getNextVideoIndex(); // Start a new round with a new video
                showSpacePrompt();
            }
        } else if (mode === 'onePress' || mode === 'interval') {
            if (playedVideos.length < selectedVideos.length) {
                currentVideoIndex = getNextVideoIndex(); // Select the next video that hasn't been played
                startVideoPlayback(); // Automatically play the next video in the playlist
            } else {
                playedVideos = []; // Reset the playedVideos array
                currentVideoIndex = getNextVideoIndex(); // Start a new round with a new video
                showSpacePrompt();
            }
        }
    }

    function getNextVideoIndex() {
        if (playedVideos.length === selectedVideos.length) {
            playedVideos = []; // Reset playlist if all videos have been played
        }

        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * selectedVideos.length);
        } while (playedVideos.includes(nextIndex));

        playedVideos.push(nextIndex);
        return nextIndex;
    }

    function endVideoPlayback() {
        console.log("Ending video playback");
        videoContainer.style.display = 'none';
        if (intervalID) {
            clearInterval(intervalID);
            intervalID = null;
        }
        controlsEnabled = false;
        showSpacePrompt();
    }

    document.addEventListener('keydown', handleSpacebarPress);
});

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
    const okButton = document.getElementById('ok-button');
    const videoCards = document.querySelectorAll('.video-card');
    const introJingle = document.getElementById('intro-jingle');

    // Space Prompt Image Selection
    const selectSpacePromptButton = document.getElementById('select-space-prompt-button');
    const spacePromptSelectionModal = document.getElementById('space-prompt-selection-modal');
    const closeSpacePromptModal = document.getElementById('close-space-prompt-modal');
    const imageCards = document.querySelectorAll('.image-card');
    const applySpacePromptButton = document.getElementById('apply-space-prompt');
    let selectedSpacePromptSrc = '../../images/test.png'; // Default space prompt image

    // Videos
    let selectedVideos = Array.from(videoCards).map(card => card.dataset.src);
    let controlsEnabled = false;
    let playedVideos = [];
    let currentVideoIndex = 0;
    let mode = 'onePress';
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
        blackBackground.style.display = 'block';
        spacePrompt.src = selectedSpacePromptSrc; // Use the selected space prompt image
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

    // Show the space prompt selection modal
    selectSpacePromptButton.addEventListener('click', () => {
        spacePromptSelectionModal.style.display = 'block';
    });

    // Close the space prompt modal
    closeSpacePromptModal.addEventListener('click', () => {
        spacePromptSelectionModal.style.display = 'none';
    });

    // Handle space prompt image selection
    imageCards.forEach(card => {
        card.addEventListener('click', () => {
            imageCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedSpacePromptSrc = card.dataset.src; // Update the selected image src
        });
    });

    // Apply the selected space prompt image
    applySpacePromptButton.addEventListener('click', () => {
        spacePromptSelectionModal.style.display = 'none';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('control-panel-start-button');
    const blackBackground = document.getElementById('black-background');
    const spacePrompt = document.getElementById('space-prompt');
    const videoContainer = document.getElementById('video-container');
    const videoPlayer = document.getElementById('video-player');
    const playModeSelect = document.getElementById('control-panel-play-mode');
    const intervalTimeInput = document.getElementById('interval-time');
    const intervalLabel = document.getElementById('interval-label');
    const videoElements = document.querySelectorAll('#video-list video');
    const videos = Array.from(videoElements).map(video => video.getAttribute('data-src'));

    let controlsEnabled = false;
    let currentVideoIndex = 0;
    let mode = 'onePress';
    let intervalID = null;
    let intervalTime = 5;

    console.log("Document loaded");

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

    startButton.style.display = 'none';

    preloadVideos(videos, () => {
        startButton.style.display = 'block';
        document.getElementById('control-panel-loading-bar-container').style.display = 'none';
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
        if (mode === 'interval') {
            intervalTime = parseInt(intervalTimeInput.value);
            if (isNaN(intervalTime) || intervalTime <= 0) {
                alert("Please enter a valid interval time in seconds.");
                return;
            }
        }

        document.getElementById('control-panel').style.display = 'none';
        console.log("Control panel hidden, showing space prompt");
        currentVideoIndex = 0; // Start from the first video
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
            startVideoPlayback();
        }
    }

    function startVideoPlayback() {
        console.log("Starting video playback");

        // Ensure the controls are not shown
        videoPlayer.removeAttribute('controls');

        videoContainer.style.display = 'block';
        videoPlayer.src = videos[currentVideoIndex];
        videoPlayer.play();

        if (mode === 'interval') {
            intervalID = setInterval(() => {
                videoPlayer.pause();
                showSpacePrompt();
                clearInterval(intervalID);
            }, intervalTime * 1000);
        }
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
            if (currentVideoIndex < videos.length - 1) {
                currentVideoIndex++;
                showSpacePrompt();
            } else {
                endVideoPlayback();
            }
        } else if (mode === 'onePress') {  // This handles the playlist mode
            if (currentVideoIndex < videos.length - 1) {
                currentVideoIndex++;
                startVideoPlayback();  // Automatically play the next video in the playlist
            } else {
                endVideoPlayback();  // End playback and show the prompt after the entire playlist is done
            }
        } else if (mode === 'interval') {
            if (currentVideoIndex < videos.length - 1) {
                currentVideoIndex++;
                startVideoPlayback();
            } else {
                endVideoPlayback();
            }
        }
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

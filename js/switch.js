document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('video-player');
    const playModeSelect = document.getElementById('play-mode');
    const intervalTimeInput = document.getElementById('interval-time');
    const intervalLabel = document.getElementById('interval-label');
    const startButton = document.getElementById('start-button');
    const videoContainer = document.getElementById('video-container');
    const blackBackground = document.getElementById('black-background');
    
    const spacePrompt = document.createElement('img');
    spacePrompt.id = 'space-prompt';
    spacePrompt.src = '../../images/test.png'; // Update with your image path
    spacePrompt.style.display = 'none';
    spacePrompt.style.position = 'fixed';
    spacePrompt.style.top = '50%';
    spacePrompt.style.left = '50%';
    spacePrompt.style.transform = 'translate(-50%, -50%)';
    spacePrompt.style.zIndex = '1001';
    document.body.appendChild(spacePrompt);

    const videoElements = document.querySelectorAll('#video-list video');
    const videos = Array.from(videoElements).map(video => video.getAttribute('data-src'));

    let currentVideoIndex = 0;
    let intervalID = null;
    let mode = 'onePress';
    let intervalTime = 5;

    function preloadVideos(videos, onComplete) {
        let videosLoaded = 0;
        const totalVideos = videos.length;

        console.log("Starting video preloading...");

        const loadingBar = document.getElementById('control-panel-loading-bar');

        videos.forEach((videoSrc, index) => {
            const video = document.createElement('video');
            video.src = videoSrc;
            video.preload = 'auto';
            video.style.display = 'none';
            document.body.appendChild(video);

            video.addEventListener('canplaythrough', () => {
                videosLoaded++;
                console.log(`Video ${index + 1} preloaded successfully.`);

                const progress = (videosLoaded / totalVideos) * 100;
                loadingBar.style.width = `${progress}%`;

                if (videosLoaded === totalVideos) {
                    console.log('All videos preloaded successfully.');
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
        startButton.style.display = 'block'; // Show the start button after preloading
        const loadingBarContainer = document.getElementById('control-panel-loading-bar-container');
        loadingBarContainer.style.display = 'none'; // Hide the loading bar
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
        intervalTime = parseInt(intervalTimeInput.value) || 5;
        videoContainer.style.display = 'none';
        showSpacePrompt();
    });

    function showSpacePrompt() {
        blackBackground.style.display = 'block';
        spacePrompt.style.display = 'block';
        document.addEventListener('keydown', handleSpacebarPress);
    }

    function handleSpacebarPress(event) {
        if (event.code === 'Space') {
            event.preventDefault();
            spacePrompt.style.display = 'none';
            blackBackground.style.display = 'none';
            document.removeEventListener('keydown', handleSpacebarPress);
            startVideoPlayback();
        }
    }

    function startVideoPlayback() {
        videoContainer.style.display = 'block';
        switch (mode) {
            case 'onePress':
                playRandomVideo();
                break;
            case 'pressBetween':
                playRandomVideo();
                break;
            case 'interval':
                playRandomVideo();
                intervalID = setInterval(() => {
                    showSpacePrompt();
                }, intervalTime * 1000);
                break;
            case 'afterPlaylist':
                playPlaylist();
                break;
            default:
                playRandomVideo();
                break;
        }
    }

    function playRandomVideo() {
        currentVideoIndex = Math.floor(Math.random() * videos.length);
        playVideo(videos[currentVideoIndex]);
    }

    function playPlaylist() {
        currentVideoIndex = 0;
        playVideo(videos[currentVideoIndex]);

        videoPlayer.onended = () => {
            currentVideoIndex++;
            if (currentVideoIndex < videos.length) {
                playVideo(videos[currentVideoIndex]);
            } else {
                endVideoPlayback();
            }
        };
    }

    function playVideo(videoSrc) {
        videoPlayer.src = videoSrc;
        videoPlayer.play();

        videoPlayer.onplay = () => {
            blackBackground.style.display = 'none';
            spacePrompt.style.display = 'none';
        };

        videoPlayer.onended = () => {
            endVideoPlayback();
        };
    }

    function endVideoPlayback() {
        videoContainer.style.display = 'none';
        if (intervalID) {
            clearInterval(intervalID);
            intervalID = null;
        }
        showSpacePrompt();
    }
});

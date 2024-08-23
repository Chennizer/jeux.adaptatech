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
    spacePrompt.style.display = 'none'; // Start hidden
    spacePrompt.style.position = 'fixed';
    spacePrompt.style.top = '50%';
    spacePrompt.style.left = '50%';
    spacePrompt.style.transform = 'translate(-50%, -50%)';
    spacePrompt.style.zIndex = '1001'; // Ensure it is above other elements
    document.body.appendChild(spacePrompt);
    
    const videoElements = document.querySelectorAll('#video-list video');
    const videos = Array.from(videoElements).map(video => video.getAttribute('data-src'));
    
    let currentVideoIndex = 0;
    let intervalID = null;
    let mode = 'onePress';
    let intervalTime = 5;
    
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
        videoContainer.style.display = 'none'; // Hide video container initially
        showSpacePrompt(); // Show prompt to start the game
    });

    function showSpacePrompt() {
        blackBackground.style.display = 'block';
        spacePrompt.style.display = 'block';
        document.addEventListener('keydown', handleSpacebarPress);
    }

    function handleSpacebarPress(event) {
        if (event.code === 'Space') {
            // Only hide the prompt and start the video on the first space press
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

        // Ensure the black background and prompt are hidden during playback
        videoPlayer.onplay = () => {
            blackBackground.style.display = 'none';
            spacePrompt.style.display = 'none';
        };

        // Handle end of video playback
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

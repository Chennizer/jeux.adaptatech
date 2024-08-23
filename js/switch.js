document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('video-player');
    const playModeSelect = document.getElementById('play-mode');
    const intervalTimeInput = document.getElementById('interval-time');
    const intervalLabel = document.getElementById('interval-label');
    const startButton = document.getElementById('start-button');
    const videoContainer = document.getElementById('video-container');
    const blackBackground = document.getElementById('black-background');

    const spacePrompt = new Image();
    spacePrompt.id = 'space-prompt';
    spacePrompt.src = '../../images/test.png';
    spacePrompt.style.display = 'none';
    spacePrompt.style.position = 'fixed';
    spacePrompt.style.top = '50%';
    spacePrompt.style.left = '50%';
    spacePrompt.style.transform = 'translate(-50%, -50%)';
    spacePrompt.style.zIndex = '2';
    
    document.body.appendChild(spacePrompt);

    const videoElements = document.querySelectorAll('#video-list video');
    let videos = Array.from(videoElements).map(video => video.getAttribute('data-src'));

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
        videoContainer.style.display = 'block';
        startGame();
    });

    function startGame() {
        blackBackground.style.display = 'block';
        spacePrompt.style.display = 'block';
        document.addEventListener('keydown', waitForSpaceToStart);
    }

    function waitForSpaceToStart(event) {
        if (event.code === 'Space') {
            spacePrompt.style.display = 'none';
            blackBackground.style.display = 'none';
            document.removeEventListener('keydown', waitForSpaceToStart);
            startVideoPlayback();
        }
    }

    function startVideoPlayback() {
        switch (mode) {
            case 'onePress':
                playRandomVideo();
                break;
            case 'pressBetween':
                document.addEventListener('keydown', playOnSpace);
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
                showSpacePrompt();
            }
        };
    }

    function playVideo(videoSrc) {
        videoPlayer.src = videoSrc;
        videoPlayer.requestFullscreen();
        videoPlayer.play();
    }

    function showSpacePrompt() {
        blackBackground.style.display = 'block';
        spacePrompt.style.display = 'block';
        document.addEventListener('keydown', waitForSpace);
    }

    function waitForSpace(event) {
        if (event.code === 'Space') {
            spacePrompt.style.display = 'none';
            blackBackground.style.display = 'none';
            document.removeEventListener('keydown', waitForSpace);
            if (mode === 'interval') {
                playRandomVideo();
            } else if (mode === 'pressBetween') {
                playRandomVideo();
            } else if (mode === 'afterPlaylist') {
                resetGame();
            }
        }
    }

    function resetGame() {
        videoContainer.style.display = 'none';
        if (intervalID) clearInterval(intervalID);
    }

    function playOnSpace(event) {
        if (event.code === 'Space') {
            playRandomVideo();
            document.removeEventListener('keydown', playOnSpace);
        }
    }
});

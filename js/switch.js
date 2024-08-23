document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const videoPlayer = document.getElementById('video-player');
    const playModeSelect = document.getElementById('play-mode');
    const intervalTimeInput = document.getElementById('interval-time');
    const intervalLabel = document.getElementById('interval-label');
    const startButton = document.getElementById('start-button');
    const videoContainer = document.getElementById('video-container');
    const blackBackground = document.getElementById('black-background');

    // Create and style the space prompt image
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

    // Collect video sources
    const videoElements = document.querySelectorAll('#video-list video');
    const videos = Array.from(videoElements).map(video => video.getAttribute('data-src'));

    // Initialize variables
    let currentVideoIndex = 0;
    let intervalID = null;
    let mode = 'onePress';
    let intervalTime = 5;

    // Handle play mode selection changes
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

    // Start button click handler
    startButton.addEventListener('click', () => {
        intervalTime = parseInt(intervalTimeInput.value) || 5;
        videoContainer.style.display = 'none'; // Hide video container initially
        showSpacePrompt(); // Show prompt to start the game
    });

    // Function to show the space prompt
    function showSpacePrompt() {
        blackBackground.style.display = 'block';
        spacePrompt.style.display = 'block';
        document.addEventListener('keydown', handleSpacebarPress);
    }

    // Function to handle spacebar press to start or continue the game
    function handleSpacebarPress(event) {
        if (event.code === 'Space') {
            spacePrompt.style.display = 'none';
            blackBackground.style.display = 'none';
            document.removeEventListener('keydown', handleSpacebarPress);
            startVideoPlayback();
        }
    }

    // Function to start video playback based on the selected mode
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

    // Function to play a random video
    function playRandomVideo() {
        currentVideoIndex = Math.floor(Math.random() * videos.length);
        playVideo(videos[currentVideoIndex]);
    }

    // Function to play videos in a playlist sequence
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

    // Function to play a specific video
    function playVideo(videoSrc) {
        videoPlayer.src = videoSrc;
        videoPlayer.play();

        // Handle end of video playback
        videoPlayer.onended = () => {
            endVideoPlayback();
        };
    }

    // Function to handle end of video playback
    function endVideoPlayback() {
        videoContainer.style.display = 'none';
        if (intervalID) {
            clearInterval(intervalID);
            intervalID = null;
        }
        showSpacePrompt();
    }
});

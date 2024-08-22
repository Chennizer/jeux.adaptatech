// Preload videos
function preloadVideos(zoneEffects, onComplete) {
    const videoElements = []; // Store references to video elements
    let videosLoaded = 0; // Counter for loaded videos
    const totalVideos = Object.keys(zoneEffects).length;

    console.log("Starting video preloading...");

    // Show the loading bar and text
    const loadingBarContainer = document.getElementById('control-panel-loading-bar-container');
    const loadingBar = document.getElementById('control-panel-loading-bar');
    const loadingText = document.getElementById('control-panel-loading-text');
    
    loadingBarContainer.style.display = 'block';
    loadingText.style.display = 'block'; // Ensure the loading text is visible

    for (let zone in zoneEffects) {
        const video = document.createElement('video');
        video.src = zoneEffects[zone].video;
        video.preload = 'auto';
        video.style.display = 'none';
        document.body.appendChild(video);

        // Use canplaythrough event to ensure video is ready for playback
        video.addEventListener('canplaythrough', () => {
            videosLoaded++;
            console.log(`Video for ${zone} preloaded successfully.`);

            // Update the loading bar width based on the progress
            const progress = (videosLoaded / totalVideos) * 100;
            loadingBar.style.width = `${progress}%`;

            if (videosLoaded === totalVideos) {
                console.log('All videos preloaded successfully.');
                onComplete(); // Callback to enable game start when all videos are loaded
                loadingText.innerText = 'Vidéos prêtes. Vous pouvez commencer le jeu.';
                setTimeout(() => {
                    loadingBarContainer.style.display = 'none'; // Hide the loading bar
                    loadingText.style.display = 'none'; // Hide the loading text
                }, 2000); // Hide the loading bar after a brief delay
            }
        });

        video.addEventListener('error', (e) => {
            console.error(`Error preloading video for ${zone}:`, e);
            loadingText.innerText = 'Erreur de chargement des vidéos.';
        });

        videoElements.push(video);
    }
}



function setupInteractiveMapGame({ dwellTimeInputSelector, zoneEffects }) {
    let hoverTimeout;
    let dwellTime = 1000; // Default dwell time in milliseconds

    // Elements
    const dwellTimeInput = document.querySelector(dwellTimeInputSelector);
    const startButton = document.getElementById('control-panel-start-button');
    const hoverCircle = document.getElementById('hover-circle');
    const mapContainer = document.getElementById('map-container');
    const overlay = document.getElementById('overlay');
    const videoContainer = document.getElementById('video-container');
    const endVideo = document.getElementById('end-video');
    const videoSource = document.getElementById('video-source');

    // Disable the start button until videos are preloaded
    startButton.disabled = true;

    console.log("Game initialization started. Preloading videos...");

    preloadVideos(zoneEffects, () => {
        // Enable start button once videos are preloaded
        startButton.disabled = false;
        console.log("Videos preloaded. Game can start.");
    });

    // Start the game when the start button is clicked
    startButton.addEventListener('click', () => {
        const dwellTimeValue = dwellTimeInput.value;
        if (dwellTimeValue && !isNaN(dwellTimeValue)) {
            dwellTime = parseInt(dwellTimeValue);
        } else {
            alert("Please enter a valid number for dwell time.");
            return;
        }

        console.log("Game starting...");
        document.getElementById('control-panel').style.display = 'none';
        mapContainer.style.display = 'block';
        imageMapResize(); // Initialize the image map resizer
    });

    // Hover effect handling
    document.querySelectorAll('area').forEach(area => {
        area.addEventListener('mouseover', event => startHover(event, area.alt.toLowerCase()));
        area.addEventListener('mouseout', stopHover);
        area.addEventListener('mousemove', moveCircle);
    });

    function startHover(event, zone) {
        moveCircle(event);
        hoverCircle.style.display = 'block';
        hoverCircle.style.width = '20px';
        hoverCircle.style.height = '20px';
        hoverCircle.style.transition = 'none';

        setTimeout(() => {
            hoverCircle.style.transition = `width ${dwellTime}ms ease, height ${dwellTime}ms ease`;
            hoverCircle.style.width = '100px';
            hoverCircle.style.height = '100px';
        }, 0);

        hoverTimeout = setTimeout(() => {
            playEffect(zone);
            hoverCircle.style.display = 'none';
        }, dwellTime);
    }

    function stopHover() {
        clearTimeout(hoverTimeout);
        hoverCircle.style.display = 'none';
    }

    function moveCircle(event) {
        const rect = mapContainer.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        hoverCircle.style.left = `${x - hoverCircle.offsetWidth / 2}px`;
        hoverCircle.style.top = `${y - hoverCircle.offsetHeight / 2}px`;
    }

    function playEffect(zone) {
        const effect = zoneEffects[zone];
        if (!effect) return;

        overlay.style.display = 'block';
        mapContainer.style.display = 'none';

        playVideo(effect.video);
    }

    function playVideo(videoSrc) {
        videoSource.src = videoSrc;
        videoContainer.style.display = 'block';
        endVideo.load();
        endVideo.play();

        endVideo.onended = () => {
            videoContainer.style.display = 'none';
            overlay.style.display = 'none';
            mapContainer.style.display = 'block';
        };
    }
}

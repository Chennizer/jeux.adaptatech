// Preload videos
function preloadVideos(zoneEffects, onComplete) {
    const videoElements = []; // Store references to video elements
    let videosLoaded = 0; // Counter for loaded videos
    const totalVideos = Object.keys(zoneEffects).length;

    console.log("Starting video preloading...");

    // Show the loading bar
    const loadingBar = document.getElementById('control-panel-loading-bar');
    const loadingBarContainer = document.getElementById('control-panel-loading-bar-container');
    
    loadingBarContainer.style.display = 'block'; // Ensure the loading bar is visible

    for (let zone in zoneEffects) {
        const video = document.createElement('video');
        video.src = zoneEffects[zone].video;
        video.preload = 'auto';
        video.style.display = 'none';
        document.body.appendChild(video);

        video.addEventListener('canplaythrough', () => {
            videosLoaded++;
            console.log(`Video for ${zone} preloaded successfully.`);

            // Update the loading bar width based on the progress
            const progress = (videosLoaded / totalVideos) * 100;
            loadingBar.style.width = `${progress}%`;

            if (videosLoaded === totalVideos) {
                console.log('All videos preloaded successfully.');
                onComplete(); // Callback to enable game start when all videos are loaded
                
                setTimeout(() => {
                    loadingBarContainer.style.display = 'none'; // Hide the loading bar
                    const startButton = document.getElementById('startButton');
                    startButton.style.display = 'block'; // Show the start button
                }, 500); // Brief delay to smooth the transition
            }
        });

        video.addEventListener('error', (e) => {
            console.error(`Error preloading video for ${zone}:`, e);
        });

        videoElements.push(video);
    }
}


function setupInteractiveMapGame({ zoneEffects }) {
    let hoverTimeout;

    // Elements
    const startButton = document.getElementById('startButton');
    const hoverCircle = document.getElementById('hover-circle');
    const mapContainer = document.getElementById('map-container');
    const overlay = document.getElementById('overlay');
    const videoContainer = document.getElementById('video-container');
    const endVideo = document.getElementById('end-video');
    const videoSource = document.getElementById('video-source');

    // Initially hide the start button until videos are preloaded
    startButton.style.display = 'none';

    console.log("Game initialization started. Preloading videos...");

    preloadVideos(zoneEffects, () => {
        console.log("Videos preloaded. Game can start.");
    });

    // Start the game when the start button is clicked
    startButton.addEventListener('click', () => {
        console.log("Game starting...");
        eyegazeSettings.hideOverlay();
        mapContainer.style.display = 'block';

        // Ensure the map is resized and interactive
        imageMapResize(); // Initialize the image map resizer

        // Additional logging to confirm visibility changes
        console.log("Overlay hidden, map container visible.");
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

        const dwell = eyegazeSettings.dwellTime;
        setTimeout(() => {
            hoverCircle.style.transition = `width ${dwell}ms ease, height ${dwell}ms ease`;
            hoverCircle.style.width = '100px';
            hoverCircle.style.height = '100px';
        }, 0);

        hoverTimeout = setTimeout(() => {
            playEffect(zone);
            hoverCircle.style.display = 'none';
        }, dwell);
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
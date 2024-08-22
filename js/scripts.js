// Preload videos
function preloadVideos(zoneEffects) {
    const videoElements = []; // Store references to video elements
    let videosLoaded = 0; // Counter for loaded videos

    console.log("Starting video preloading...");

    for (let zone in zoneEffects) {
        const video = document.createElement('video');
        video.src = zoneEffects[zone].video;
        video.preload = 'auto';
        video.style.display = 'none';
        document.body.appendChild(video);

        // Force video to load by playing it briefly and then pausing
        video.play().then(() => {
            video.pause();
            video.currentTime = 0; // Reset to the beginning
            videosLoaded++;
            console.log(`Video for ${zone} preloaded successfully.`);

            // Check if all videos are loaded
            if (videosLoaded === Object.keys(zoneEffects).length) {
                console.log('All videos preloaded successfully.');
            }
        }).catch(error => {
            console.error(`Error preloading video for ${zone}:`, error);
        });

        videoElements.push(video);
    }
}

// This function is called when a specific game initializes
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

    // Start the game
    startButton.addEventListener('click', () => {
        const dwellTimeValue = dwellTimeInput.value;
        if (dwellTimeValue && !isNaN(dwellTimeValue)) {
            dwellTime = parseInt(dwellTimeValue);
        } else {
            alert("Please enter a valid number for dwell time.");
            return;
        }

        console.log("Game starting. Preloading videos...");
        preloadVideos(zoneEffects);
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

        // Directly play the video without showing an image or playing sound
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

    // Initialize the global events
    initializeGlobalEvents();
}

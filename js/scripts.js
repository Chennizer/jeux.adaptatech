// Global function to initialize events like the Escape key handling
function initializeGlobalEvents() {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            resetToControlPanel();
        }
    });
}

// Function to reset to the control panel (this will need to be customized based on your game structure)
function resetToControlPanel() {
    // Hide game elements
    document.getElementById('map-container').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('video-container').style.display = 'none';
    
    // Show control panel
    document.getElementById('control-panel').style.display = 'block';
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

        preloadVideos();
        document.getElementById('control-panel').style.display = 'none';
        mapContainer.style.display = 'block';
        imageMapResize(); // Initialize the image map resizer
    });

    // Preload videos
    function preloadVideos() {
        for (let zone in zoneEffects) {
            const video = document.createElement('video');
            video.src = zoneEffects[zone].video;
            video.preload = 'auto';
            document.body.appendChild(video);
            video.style.display = 'none';
        }
    }

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

        // Remove the reset to control panel on video end
        endVideo.onended = () => {
            videoContainer.style.display = 'none';
            overlay.style.display = 'none';
            mapContainer.style.display = 'block';
        };
    }

    // Initialize the global events
    initializeGlobalEvents();
}

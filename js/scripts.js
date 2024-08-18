function setupInteractiveMapGame({
    dwellTimeInputSelector,
    startButtonSelector,
    zoneEffects
}) {
    let hoverTimeout;
    let dwellTime = 1000; // Default dwell time in milliseconds

    // Elements
    const dwellTimeInput = document.querySelector(dwellTimeInputSelector);
    const startButton = document.querySelector(startButtonSelector);
    const hoverCircle = document.getElementById('hover-circle');
    const animationContainer = document.getElementById('animation-container');
    const zoneAnimation = document.getElementById('zone-animation');
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

        const randomX = 50 + (Math.random() * 20 - 10);
        const randomY = 50 + (Math.random() * 20 - 10);

        animationContainer.style.left = `${randomX}%`;
        animationContainer.style.top = `${randomY}%`;
        zoneAnimation.src = effect.image;
        animationContainer.style.display = 'block';
        animationContainer.style.animation = effect.animation;

        const sound = new Audio(effect.sound);
        sound.play();

        sound.onended = () => {
            animationContainer.style.display = 'none';
            playVideo(effect.video);
        };
    }

    function playVideo(videoSrc) {
        videoSource.src = videoSrc;
        videoContainer.style.display = 'block';
        endVideo.load();
        endVideo.play();

        endVideo.onended = resetToMapState;
    }

    function resetToMapState() {
        videoContainer.style.display = 'none';
        overlay.style.display = 'none';
        mapContainer.style.display = 'block';
    }
}

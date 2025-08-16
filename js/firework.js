function startFeuArtificeGame() {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let isPlaying = false;

    const intervalInput = document.getElementById('interval-input');
    let interval = parseInt(intervalInput.value) * 1000;

    const initialCirclesInput = document.getElementById('initial-circles-input');
    let initialCircleCount = parseInt(initialCirclesInput.value);

    eyegazeSettings.hideOverlay();
    document.body.classList.add('hide-cursor');
    isPlaying = true;

    for (let i = 0; i < initialCircleCount; i++) {
        createTrailCircle();
    }

    setInterval(createTrailCircle, interval);

    function generateTrail() {
        if (isPlaying) {
            createTrail(mouseX, mouseY);
            requestAnimationFrame(generateTrail);
        }
    }
    requestAnimationFrame(generateTrail);

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.backgroundColor = getRandomColor();

        const angle = Math.random() * 360;
        const distance = Math.random() * 300 + 100;
        particle.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--y', `${Math.sin(angle) * distance}px`);

        explosion.appendChild(particle);
    }

    document.body.appendChild(explosion);

    explosion.addEventListener('animationend', () => {
        explosion.remove();
    });
}

function playExplosionSound() {
    const explosionSound = document.getElementById('explosionSound');
    explosionSound.volume = eyegazeSettings.sfxMuted ? 0 : eyegazeSettings.sfxVolume / 100;
    explosionSound.currentTime = 0;
    explosionSound.play();
}

function createTrail(x, y) {
    const trail = document.createElement('div');
    trail.classList.add('trail');
    trail.style.left = `${x - 10}px`;
    trail.style.top = `${y - 10}px`;

    document.body.appendChild(trail);

    trail.addEventListener('animationend', () => {
        trail.remove();
    });
}

function getRandomColor() {
    const colors = ['#ff6347', '#3cb371', '#1e90ff', '#ffd700', '#9370db', '#ff4500', '#48d1cc', '#daa520'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function createTrailCircle() {
    const circle = document.createElement('div');
    circle.classList.add('trail-circle');
    circle.style.backgroundColor = getRandomColor();
    circle.style.left = `${Math.random() * (window.innerWidth - 100)}px`;
    circle.style.top = `${Math.random() * (window.innerHeight - 100)}px`;

    document.body.appendChild(circle);

    circle.addEventListener('mouseover', () => {
        createExplosion(circle.offsetLeft + 50, circle.offsetTop + 50);
        playExplosionSound();
        circle.remove();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('#startButton');
    const intervalInput = document.getElementById('interval-input');
    const intervalVal = document.getElementById('intervalVal');
    const initialCirclesInput = document.getElementById('initial-circles-input');
    const initialCirclesVal = document.getElementById('initialCirclesVal');

    if (intervalInput && intervalVal) {
        intervalVal.textContent = intervalInput.value;
        intervalInput.addEventListener('input', () => {
            intervalVal.textContent = intervalInput.value;
        });
    }

    if (initialCirclesInput && initialCirclesVal) {
        initialCirclesVal.textContent = initialCirclesInput.value;
        initialCirclesInput.addEventListener('input', () => {
            initialCirclesVal.textContent = initialCirclesInput.value;
        });
    }

    if (startButton) {
        startButton.addEventListener('click', startFeuArtificeGame);
    }
});

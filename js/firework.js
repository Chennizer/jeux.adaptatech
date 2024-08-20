function startFeuArtificeGame() {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let isPlaying = false;

    // Get the user-specified interval
    const intervalInput = document.getElementById('interval-input');
    let interval = parseInt(intervalInput.value) * 1000; // Convert seconds to milliseconds

    // Get the user-specified initial circle count
    const initialCirclesInput = document.getElementById('initial-circles-input');
    let initialCircleCount = parseInt(initialCirclesInput.value);

    // Hide control panel and show the game
    document.getElementById('control-panel').style.display = 'none';
    document.body.classList.add('hide-cursor'); // Hide the cursor
    isPlaying = true;

    // Spawn the initial circles
    for (let i = 0; i < initialCircleCount; i++) {
        createTrailCircle();
    }

    // Start the game logic with the specified interval
    setInterval(createTrailCircle, interval);

    // Request animation frame loop for continuous trail generation
    function generateTrail() {
        if (isPlaying) {
            createTrail(mouseX, mouseY);
            requestAnimationFrame(generateTrail);
        }
    }
    requestAnimationFrame(generateTrail);

    // Track mouse movement to update position
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

    for (let i = 0; i < 50; i++) { // Increase the number of particles
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.backgroundColor = getRandomColor();

        const angle = Math.random() * 360;
        const distance = Math.random() * 300 + 100; // Farther distance
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
    explosionSound.currentTime = 0;
    explosionSound.play();
}

function createTrail(x, y) {
    const trail = document.createElement('div');
    trail.classList.add('trail');
    trail.style.left = `${x - 10}px`; // Center the trail
    trail.style.top = `${y - 10}px`; // Center the trail

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

// Initialize the Feu d'artifice game if the start button is present
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('#control-panel-start-button');
    if (startButton) {
        startButton.addEventListener('click', startFeuArtificeGame);
    }
});

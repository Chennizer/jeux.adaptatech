function startFeuArtificeGame() {
    let lastMouseX = window.innerWidth / 2;
    let lastMouseY = window.innerHeight / 2;
    let lastTimestamp = Date.now();
    let isPlaying = false;

    // Hide control panel and show the game
    document.getElementById('control-panel').style.display = 'none';
    isPlaying = true;

    // Start the game logic with trail generation based on speed
    function generateTrail() {
        if (isPlaying) {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTimestamp;
            lastTimestamp = currentTime;

            const speed = calculateSpeed(lastMouseX, lastMouseY, mouseX, mouseY, deltaTime);

            // Number of circles based on speed (adjust this factor as needed)
            const circlesToSpawn = Math.max(1, Math.floor(speed / 10));

            for (let i = 0; i < circlesToSpawn; i++) {
                createTrailCircle(lastMouseX + (mouseX - lastMouseX) * (i / circlesToSpawn), 
                                  lastMouseY + (mouseY - lastMouseY) * (i / circlesToSpawn));
            }

            requestAnimationFrame(generateTrail);
        }
    }
    requestAnimationFrame(generateTrail);

    // Track mouse movement to update position and calculate speed
    document.addEventListener('mousemove', (e) => {
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
}

// Calculate speed based on mouse movement
function calculateSpeed(x1, y1, x2, y2, deltaTime) {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance / deltaTime;
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

function createTrailCircle(x, y) {
    const circle = document.createElement('div');
    circle.classList.add('trail-circle');
    circle.style.backgroundColor = getRandomColor();
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;

    document.body.appendChild(circle);

    circle.addEventListener('mouseover', () => {
        createExplosion(circle.offsetLeft + 50, circle.offsetTop + 50);
        playExplosionSound();
        circle.remove();
    });
}

// Initialize the Feu d'artifice game if the start button is present
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('#start-button');
    if (startButton) {
        startButton.addEventListener('click', startFeuArtificeGame);
    }
});

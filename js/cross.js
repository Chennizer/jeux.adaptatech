document.addEventListener('DOMContentLoaded', () => {
    const screen = document.getElementById('screen');
    const objectSources = screen.dataset.objectSrc.split(',');

    // Get settings menu elements
    const settingsIcon = document.getElementById('settings-icon');
    const settingsMenu = document.getElementById('settings-menu');
    const objectSpeedInput = document.getElementById('object-speed');
    const applySettingsButton = document.getElementById('apply-settings');

    let speedMultiplier = 5; // Default speed multiplier

    // Toggle settings menu visibility
    settingsIcon.addEventListener('click', () => {
        settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Apply settings when the Apply button is clicked
    applySettingsButton.addEventListener('click', () => {
        // Map input value to a speed multiplier (e.g., 1 - 20 becomes 0.5 - 10)
        speedMultiplier = objectSpeedInput.value * 2;
        settingsMenu.style.display = 'none'; // Hide menu after applying settings
    });

    // Function to start the game and keep creating objects
    function startGame() {
        setInterval(createMovingObject, 1000); // Creates an object every second
    }

    // Create a moving object that crosses the screen
    function createMovingObject() {
        const object = document.createElement('img');
        object.src = objectSources[Math.floor(Math.random() * objectSources.length)];
        object.classList.add('object'); // Use the 'object' class from CSS
        object.style.top = `${Math.random() * 90}vh`; // Random vertical position
        screen.appendChild(object);

        let position = -100; // Start position off-screen left
        const interval = setInterval(() => {
            position += speedMultiplier; // Move object by current speed multiplier
            object.style.transform = `translateX(${position}px)`;

            // Remove object if it goes beyond screen width
            if (position > window.innerWidth) {
                clearInterval(interval);
                object.remove();
            }
        }, 50);
    }

    // Start the game
    startGame();
});

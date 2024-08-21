// Function to return to the control panel when the Escape key is pressed
function setupEscapeToControlPanel(controlPanelSelector, mapContainerSelector, videoContainerSelector) {
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            // Hide map and video containers
            document.querySelector(mapContainerSelector).style.display = 'none';
            document.querySelector(videoContainerSelector).style.display = 'none';
            
            // Show the control panel
            document.querySelector(controlPanelSelector).style.display = 'block';
        }
    });
}

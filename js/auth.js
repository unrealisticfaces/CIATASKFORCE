// Functionality to handle user profile dropdown and logout
document.addEventListener('DOMContentLoaded', () => {
    const userProfileButton = document.getElementById('userProfileButton');
    const logoutMenu = document.getElementById('logoutMenu');
    const logoutButton = document.getElementById('logoutButton');

    if (userProfileButton) {
        userProfileButton.addEventListener('click', (event) => {
            event.stopPropagation();
            logoutMenu.classList.toggle('hidden');
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Redirect to the index page for logout
            window.location.href = '../index.html'; 
        });
    }

    window.addEventListener('click', () => {
        if (logoutMenu && !logoutMenu.classList.contains('hidden')) {
            logoutMenu.classList.add('hidden');
        }
    });
});
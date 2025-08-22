// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDA_q4-NEMJij-ojfQIahQRFov1n6p7qNM",
    authDomain: "cia-bayanihan-app.firebaseapp.com",
    databaseURL: "https://cia-bayanihan-app-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cia-bayanihan-app",
    storageBucket: "cia-bayanihan-app.appspot.com",
    messagingSenderId: "35363747720",
    appId: "1:35363747720:web:23840cad1a7f8f3f442c3d",
    measurementId: "G-8BGFGETSKD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);


// --- NEW: INACTIVITY TIMEOUT LOGIC ---

// Set the timeout duration in milliseconds. 5 minutes = 5 * 60 * 1000 = 300000 ms
const INACTIVITY_TIMEOUT = 300000; 
let inactivityTimer;

// Function to log the user out
function performLogout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('loggedInUser');
    // You can add a query parameter to show a message on the login page
    window.location.href = '../index.html?reason=inactivity'; 
}

// Function to reset the inactivity timer
function resetInactivityTimer() {
    // Clear the previous timer
    clearTimeout(inactivityTimer);
    // Start a new timer
    inactivityTimer = setTimeout(performLogout, INACTIVITY_TIMEOUT);
}


// --- EXISTING FUNCTIONALITY ---

document.addEventListener('DOMContentLoaded', () => {
    const userProfileButton = document.getElementById('userProfileButton');
    const logoutMenu = document.getElementById('logoutMenu');
    const logoutButton = document.getElementById('logoutButton');

    // Function to update the user profile display in the sidebar
    function updateUserProfileDisplay() {
        const loggedInUserString = sessionStorage.getItem('loggedInUser');
        if (loggedInUserString) {
            try {
                const loggedInUser = JSON.parse(loggedInUserString);
                const displayNameElement = document.querySelector('#userProfileButton .font-semibold');
                const emailElement = document.querySelector('#userProfileButton .text-xs');
                const avatarElement = document.querySelector('#userProfileButton img');

                if (displayNameElement) displayNameElement.textContent = loggedInUser.displayName;
                if (emailElement) emailElement.textContent = loggedInUser.email;
                
                if (avatarElement && loggedInUser.displayName) {
                    const initials = loggedInUser.displayName.split(' ').map(n => n[0]).join('').substring(0, 2);
                    avatarElement.src = `https://placehold.co/100x100/667eea/ffffff?text=${initials}`;
                    avatarElement.alt = loggedInUser.displayName;
                }
            } catch (error) {
                console.error('Failed to parse user data from sessionStorage', error);
            }
        }
    }

    // Call the function to update the profile on page load
    updateUserProfileDisplay();

    // Event listeners for logout menu
    if (userProfileButton) {
        userProfileButton.addEventListener('click', (event) => {
            event.stopPropagation();
            logoutMenu.classList.toggle('hidden');
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', performLogout); // Use the new logout function
    }

    window.addEventListener('click', () => {
        if (logoutMenu && !logoutMenu.classList.contains('hidden')) {
            logoutMenu.classList.add('hidden');
        }
    });

    // --- NEW: START THE INACTIVITY TIMER ---
    
    // Listen for user activity events
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    
    // Start the timer for the first time when the page loads
    resetInactivityTimer();
});

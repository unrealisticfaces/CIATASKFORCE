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


// --- INACTIVITY TIMEOUT LOGIC ---
const INACTIVITY_TIMEOUT = 300000; // 5 minutes
let inactivityTimer;

function performLogout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('loggedInUser');
    window.location.href = '../index.html?reason=inactivity'; 
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(performLogout, INACTIVITY_TIMEOUT);
}


// --- Function to load app config and control UI ---
async function initializeUI() {
    // 1. Load App Configuration from Firebase
    try {
        const configRef = ref(database, 'config');
        const snapshot = await get(configRef);
        if (snapshot.exists()) {
            const config = snapshot.val();
            document.getElementById('sidebar-logo').src = config.logoUrl || '../js/data/indexwall.webp';
            document.getElementById('sidebar-app-name').textContent = config.appName || 'CIA TASK FORCE';
        }
    } catch (error) {
        console.error("Failed to load app configuration:", error);
    }

    // 2. Check User Role and add a class to the body
    try {
        const loggedInUserString = sessionStorage.getItem('loggedInUser');
        if (loggedInUserString) {
            const loggedInUser = JSON.parse(loggedInUserString);
            
            // *** THIS IS THE FIX ***
            // Add a class to the body based on the user's role
            if (loggedInUser.role === 'superadmin') {
                document.body.classList.add('role-superadmin');
            } else {
                document.body.classList.add('role-admin');
            }
        }
    } catch (error) {
        console.error("Failed to check user role:", error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    initializeUI();

    const userProfileButton = document.getElementById('userProfileButton');
    const logoutMenu = document.getElementById('logoutMenu');
    const logoutButton = document.getElementById('logoutButton');

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

    updateUserProfileDisplay();

    if (userProfileButton) {
        userProfileButton.addEventListener('click', (event) => {
            event.stopPropagation();
            logoutMenu.classList.toggle('hidden');
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', performLogout);
    }

    window.addEventListener('click', () => {
        if (logoutMenu && !logoutMenu.classList.contains('hidden')) {
            logoutMenu.classList.add('hidden');
        }
    });
    
    // Start the inactivity timer
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    resetInactivityTimer();
});

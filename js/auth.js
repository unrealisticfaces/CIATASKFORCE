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
            // --- THIS IS THE UPDATED LOGOUT LOGIC ---
            // 1. Remove the login flag from sessionStorage.
            sessionStorage.removeItem('isLoggedIn');
            
            // 2. Redirect to the login page.
            window.location.href = '../index.html'; 
        });
    }

    window.addEventListener('click', () => {
        if (logoutMenu && !logoutMenu.classList.contains('hidden')) {
            logoutMenu.classList.add('hidden');
        }
    });
});

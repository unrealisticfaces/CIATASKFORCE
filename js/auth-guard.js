// This script acts as a "guard" for all protected pages.

// Check the sessionStorage for the 'isLoggedIn' flag.
const isLoggedIn = sessionStorage.getItem('isLoggedIn');

// If the flag is not 'true', the user is not logged in.
if (isLoggedIn !== 'true') {
    // Immediately redirect the user to the login page.
    // The '../' is important to go up one directory from 'html' to the root.
    window.location.href = '../index.html';
}

// If the user IS logged in, the script does nothing, and the page will load normally.

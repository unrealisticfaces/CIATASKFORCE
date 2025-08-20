document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // --- IMPORTANT ---
        // This is a simple, hardcoded check for demonstration purposes.
        // In a real application, you would use a secure authentication service.
        if (username === 'admin' && password === 'password') {
            // On successful login, set a flag in sessionStorage.
            // sessionStorage is cleared when the browser tab is closed.
            sessionStorage.setItem('isLoggedIn', 'true');
            
            // Redirect to the dashboard.
            window.location.href = './html/dashboard.html';
        } else {
            errorMessage.textContent = 'Invalid username or password.';
        }
    });
});

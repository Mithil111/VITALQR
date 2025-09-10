// --- CONFIGURATION ---
const RENDER_BACKEND_URL = "https://vitalqr-backend.onrender.com";
const FRONTEND_URL = window.location.origin; // Gets the base URL of where the frontend is running

// --- ROUTING ---
// Simple router to check which page we're on and run the correct code
document.addEventListener('DOMContentLoaded', () => {
    if (document.title.includes("Dashboard")) {
        initDashboardPage();
    } else if (document.title.includes("Welcome")) {
        initAuthPage();
    } else if (document.title.includes("Emergency Info")) {
        initDisplayPage(); // Call the new function for the display page
    }
});


// =================================================================
// AUTHENTICATION PAGE LOGIC (index.html)
// =================================================================
function initAuthPage() {
    const authContainer = document.getElementById('auth-container');
    const alertContainer = document.getElementById('alert-container');

    const signupFormTemplate = `
        <h2 class="h4 mb-3 text-center">Create Account</h2>
        <form id="signup-form">
            <div class="mb-3"><label for="signup-email" class="form-label">Email address</label><input type="email" class="form-control" id="signup-email" required></div>
            <div class="mb-3"><label for="signup-password" class="form-label">Password</label><input type="password" class="form-control" id="signup-password" required minlength="6"></div>
            <button type="submit" class="btn btn-primary w-100">Sign Up</button>
        </form>
        <p class="mt-3 text-center">Already have an account? <a href="#" id="show-login">Log In</a></p>`;

    const loginFormTemplate = `
        <h2 class="h4 mb-3 text-center">Log In</h2>
        <form id="login-form">
            <div class="mb-3"><label for="login-email" class="form-label">Email address</label><input type="email" class="form-control" id="login-email" required></div>
            <div class="mb-3"><label for="login-password" class="form-label">Password</label><input type="password" class="form-control" id="login-password" required></div>
            <button type="submit" class="btn btn-success w-100">Log In</button>
        </form>
        <p class="mt-3 text-center">Don't have an account? <a href="#" id="show-signup">Sign Up</a></p>`;

    function showAlert(message, type = 'danger') {
        if(alertContainer) alertContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
    }

    function handleSignup(event) {
        event.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        fetch(`${RENDER_BACKEND_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.uid) {
                showAlert('Signup successful! Please log in.', 'success');
                showLoginForm();
            } else {
                let errorMessage = "An unknown error occurred.";
                if (typeof data.error === 'string' && data.error.includes("EMAIL_EXISTS")) {
                    errorMessage = "This email address is already in use.";
                } else if (data.error) {
                    errorMessage = data.error;
                }
                showAlert(errorMessage);
            }
        })
        .catch(error => showAlert('Could not connect to the server.'));
    }

    function handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        fetch(`${RENDER_BACKEND_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.idToken) {
                localStorage.setItem('userToken', data.idToken);
                localStorage.setItem('userUID', data.uid);
                window.location.href = 'dashboard.html';
            } else {
                showAlert(data.error || 'Invalid email or password.');
            }
        })
        .catch(error => showAlert('Could not connect to the server.'));
    }

    function showSignupForm() {
        authContainer.innerHTML = signupFormTemplate;
        document.getElementById('signup-form').addEventListener('submit', handleSignup);
        document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });
    }

    function showLoginForm() {
        authContainer.innerHTML = loginFormTemplate;
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('show-signup').addEventListener('click', (e) => { e.preventDefault(); showSignupForm(); });
    }
    
    showLoginForm();
}


// =================================================================
// DASHBOARD PAGE LOGIC (dashboard.html)
// =================================================================
function initDashboardPage() {
    const userUID = localStorage.getItem('userUID');
    const userToken = localStorage.getItem('userToken');

    if (!userUID || !userToken) {
        window.location.href = 'index.html';
        return;
    }

    const alertContainer = document.getElementById('alert-container');
    const profileForm = document.getElementById('profile-form');
    
    function showAlert(message, type = 'success') {
         if(alertContainer) alertContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
    }

    async function loadProfile() {
        const response = await fetch(`${RENDER_BACKEND_URL}/profile/${userUID}`);
        if (response.ok) {
            const data = await response.json();
            for (const key in data) {
                if (document.getElementById(key)) {
                    document.getElementById(key).value = data[key];
                }
            }
        }
    }

    async function handleProfileSave(event) {
        event.preventDefault();
        const formData = {
            fullName: document.getElementById('fullName').value,
            bloodType: document.getElementById('bloodType').value,
            allergies: document.getElementById('allergies').value,
            conditions: document.getElementById('conditions').value,
            medications: document.getElementById('medications').value,
            emergencyContactName: document.getElementById('emergencyContactName').value,
            emergencyContactPhone: document.getElementById('emergencyContactPhone').value,
        };

        const response = await fetch(`${RENDER_BACKEND_URL}/profile/${userUID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showAlert('Profile saved successfully!', 'success');
        } else {
            showAlert('Failed to save profile.', 'danger');
        }
    }

    function generateUserQRCode() {
        // Construct the URL using the deployed frontend's future location, or a local file path for testing
        const publicURL = `${window.location.href.substring(0, window.location.href.lastIndexOf('/'))}/display.html?uid=${userUID}`;
        
        const qrCodeContainer = document.getElementById('qrcode-container');
        qrCodeContainer.innerHTML = "";

        new QRCode(qrCodeContainer, {
            text: publicURL,
            width: 200,
            height: 200,
        });

        const publicLink = document.getElementById('public-link');
        publicLink.href = publicURL;
        publicLink.textContent = "Click to view your public profile";
    }

    function handleLogout() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userUID');
        window.location.href = 'index.html';
    }

    profileForm.addEventListener('submit', handleProfileSave);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    loadProfile();
    generateUserQRCode();
}


// =================================================================
// PUBLIC DISPLAY PAGE LOGIC (display.html)
// =================================================================
function initDisplayPage() {
    const profileContainer = document.getElementById('profile-display-container');
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid');

    if (!uid) {
        profileContainer.innerHTML = `<p class="text-danger">Error: No user ID provided.</p>`;
        return;
    }

    fetch(`${RENDER_BACKEND_URL}/profile/${uid}`)
        .then(response => {
            if (!response.ok) { throw new Error('Profile not found'); }
            return response.json();
        })
        .then(data => {
            profileContainer.innerHTML = `
                <dl class="row">
                    <dt class="col-sm-5">Full Name:</dt><dd class="col-sm-7">${data.fullName || 'N/A'}</dd>
                    <dt class="col-sm-5">Blood Type:</dt><dd class="col-sm-7">${data.bloodType || 'N/A'}</dd>
                    <dt class="col-sm-5">Allergies:</dt><dd class="col-sm-7">${data.allergies || 'N/A'}</dd>
                    <dt class="col-sm-5">Medical Conditions:</dt><dd class="col-sm-7">${data.conditions || 'N/A'}</dd>
                    <dt class="col-sm-5">Current Medications:</dt><dd class="col-sm-7">${data.medications || 'N/A'}</dd>
                    <hr class="my-3">
                    <dt class="col-sm-5">Emergency Contact:</dt><dd class="col-sm-7">${data.emergencyContactName || 'N/A'}</dd>
                    <dt class="col-sm-5">Contact Phone:</dt><dd class="col-sm-7">${data.emergencyContactPhone || 'N/A'}</dd>
                </dl>`;
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            profileContainer.innerHTML = `<p class="text-danger">Could not load profile. The user may not have created one yet.</p>`;
        });
}
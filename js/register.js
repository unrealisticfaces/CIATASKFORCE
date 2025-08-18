// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set, child } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
const usersRef = ref(database, 'users');

// --- Element References ---
const form = document.getElementById('registrationForm');
const idInput = document.getElementById('id-no');
const messageDiv = document.getElementById('form-message');
const regionSelect = document.getElementById('region');
const provinceSelect = document.getElementById('province');
const citySelect = document.getElementById('city');
const barangaySelect = document.getElementById('barangay');

// --- PSGC API Helper Functions ---
const PSGC_API_BASE = 'https://psgc.gitlab.io/api';

async function populateDropdown(selectElement, url, nameProperty) {
    selectElement.innerHTML = `<option value="" disabled selected>Loading...</option>`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        data.sort((a, b) => a.name.localeCompare(b.name));
        
        selectElement.innerHTML = `<option value="" disabled selected>Select ${selectElement.previousElementSibling.textContent}</option>`;
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.code;
            option.textContent = item[nameProperty];
            selectElement.appendChild(option);
        });
        selectElement.disabled = false;
    } catch (error) {
        console.error(`Failed to fetch ${selectElement.id}:`, error);
        selectElement.innerHTML = `<option value="" disabled selected>Failed to load</option>`;
    }
}

function resetDropdowns(...dropdowns) {
    dropdowns.forEach(dd => {
        const label = dd.previousElementSibling.textContent;
        dd.innerHTML = `<option value="" disabled selected>Select ${label}</option>`;
        dd.disabled = true;
    });
}

// --- Event Listeners ---
regionSelect.addEventListener('change', () => {
    resetDropdowns(provinceSelect, citySelect, barangaySelect);
    if (regionSelect.value) {
        populateDropdown(provinceSelect, `${PSGC_API_BASE}/regions/${regionSelect.value}/provinces/`, 'name');
    }
});

provinceSelect.addEventListener('change', () => {
    resetDropdowns(citySelect, barangaySelect);
    if (provinceSelect.value) {
        populateDropdown(citySelect, `${PSGC_API_BASE}/provinces/${provinceSelect.value}/cities-municipalities/`, 'name');
    }
});

citySelect.addEventListener('change', () => {
    resetDropdowns(barangaySelect);
    if (citySelect.value) {
        populateDropdown(barangaySelect, `${PSGC_API_BASE}/cities-municipalities/${citySelect.value}/barangays/`, 'name');
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageDiv.textContent = 'Submitting...';
    messageDiv.className = 'text-center mt-4 text-blue-400';

    const newId = idInput.value;
    if (!newId || newId === "Generating..." || newId === "Error") {
        messageDiv.textContent = 'Error: ID not generated. Cannot submit.';
        messageDiv.className = 'text-center mt-4 text-red-500 font-semibold';
        return;
    }
    
    // Helper to get text from selected dropdown option
    const getSelectedText = (el) => el.options[el.selectedIndex]?.textContent || '';

    const userData = {
        personalInfo: {
            id: newId,
            firstName: document.getElementById('first-name').value,
            middleName: document.getElementById('middle-name').value,
            lastName: document.getElementById('last-name').value,
            contactNo: document.getElementById('contact-no').value,
            dob: document.getElementById('dob').value,
            age: document.getElementById('age').value,
            sex: document.getElementById('sex').value,
            bloodType: document.getElementById('blood-type').value,
        },
        address: {
            region: getSelectedText(regionSelect),
            province: getSelectedText(provinceSelect),
            city: getSelectedText(citySelect),
            barangay: getSelectedText(barangaySelect),
            zipCode: document.getElementById('zip-code').value,
        },
        otherInfo: {
            occupation: document.getElementById('occupation').value,
            skills: document.getElementById('skills').value,
            joinDate: document.getElementById('join-date').value,
            referrerName: document.getElementById('referrer-name').value,
        },
        emergencyContact: {
            lastName: document.getElementById('ec-last-name').value,
            firstName: document.getElementById('ec-first-name').value,
            middleName: document.getElementById('ec-middle-name').value,
            nickname: document.getElementById('ec-nickname').value,
            contactNo: document.getElementById('ec-contact-no').value,
            address: document.getElementById('ec-address').value,
        }
    };

    try {
        await set(child(usersRef, newId), userData);
        messageDiv.textContent = 'User registered successfully!';
        messageDiv.className = 'text-center mt-4 text-green-500 font-semibold';
        form.reset();
        resetDropdowns(provinceSelect, citySelect, barangaySelect);
        initializePage(); 
    } catch (error) {
        console.error("Firebase write failed: ", error);
        messageDiv.textContent = 'An error occurred during submission. Please check console.';
        messageDiv.className = 'text-center mt-4 text-red-500 font-semibold';
    }
});

// --- Page Initialization ---
async function initializePage() {
    // Generate new User ID
    idInput.value = 'Generating...';
    try {
        const snapshot = await get(usersRef);
        let userCount = 0;
        if (snapshot.exists()) {
            userCount = Object.keys(snapshot.val()).length;
        }
        const newId = `100-${101 + userCount}`;
        idInput.value = newId;
    } catch(error) {
        console.error("Could not fetch user count from Firebase:", error);
        idInput.value = "Error";
    }

    // Populate the initial regions dropdown
    populateDropdown(regionSelect, `${PSGC_API_BASE}/regions/`, 'name');
}

// Run initialization when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);
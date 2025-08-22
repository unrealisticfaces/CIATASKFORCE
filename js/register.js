// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set, child } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Import Supabase functions
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

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

// Your Supabase credentials
const supabaseUrl = 'https://ytcafvozshnuxbeyeexl.supabase.co';
const supabaseKey = 'sb_publishable_GYrIDlEyqpLpauiJMfBY6Q_veQssAEv';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const usersRef = ref(database, 'users');

// --- Element References ---
const form = document.getElementById('registrationForm');
const userIdInput = document.getElementById('user-id');
const idNoInput = document.getElementById('id-no');
const messageDiv = document.getElementById('form-message');
const profileImageInput = document.getElementById('profile-image');
const signatureImageInput = document.getElementById('signature-image');
const dobInput = document.getElementById('dob');
const ageInput = document.getElementById('age');

// --- Address Element References ---
const ncrToggle = document.getElementById('ncr-toggle');
const addressDropdowns = document.getElementById('address-dropdowns');
const addressManualInputs = document.getElementById('address-manual-inputs');

// Dropdown Selects
const regionSelect = document.getElementById('region');
const provinceSelect = document.getElementById('province');
const citySelect = document.getElementById('city');
const barangaySelect = document.getElementById('barangay');

// Manual Text Inputs
const regionManual = document.getElementById('region-manual');
const provinceManual = document.getElementById('province-manual');
const cityManual = document.getElementById('city-manual');
const barangayManual = document.getElementById('barangay-manual');

// --- Supabase Upload Helper Function ---
async function uploadImageToSupabase(file, bucketName, userId, imageType) {
    if (!file) return null;
    const filePath = `${userId}/${imageType}-${Date.now()}.${file.name.split('.').pop()}`;
    try {
        await supabase.auth.signInAnonymously();
        const { error } = await supabase.storage.from(bucketName).upload(filePath, file);
        if (error) throw error;
        const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) {
        console.error(`Error uploading ${imageType} image:`, error);
        return null;
    }
}

// --- PSGC API Helper Functions ---
const PSGC_API_BASE = 'https://psgc.gitlab.io/api';
const NCR_REGION_CODE = '130000000';

async function populateRegions() {
    regionSelect.innerHTML = `<option value="" disabled selected>Loading...</option>`;
    try {
        const response = await fetch(`${PSGC_API_BASE}/regions/`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        data.sort((a, b) => a.name.localeCompare(b.name));
        regionSelect.innerHTML = `<option value="" disabled selected>Select Region</option>`;
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.code;
            option.textContent = item.name;
            if (item.code === NCR_REGION_CODE) {
                option.disabled = true;
            }
            regionSelect.appendChild(option);
        });
        regionSelect.disabled = false;
    } catch (error) {
        console.error(`Failed to fetch regions:`, error);
        regionSelect.innerHTML = `<option value="" disabled selected>Failed to load</option>`;
    }
}

async function populateDropdown(selectElement, url) {
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
            option.textContent = item.name;
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

dobInput.addEventListener('change', () => {
    const dob = new Date(dobInput.value);
    if (isNaN(dob.getTime())) {
        ageInput.value = '';
        return;
    }
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    ageInput.value = age >= 0 ? age : '';
});


ncrToggle.addEventListener('change', () => {
    const isManualMode = ncrToggle.checked;
    addressDropdowns.classList.toggle('hidden', isManualMode);
    addressManualInputs.classList.toggle('hidden', !isManualMode);
    if (isManualMode) {
        regionSelect.value = NCR_REGION_CODE;
        regionSelect.disabled = true;
        resetDropdowns(provinceSelect, citySelect, barangaySelect);
    } else {
        regionSelect.disabled = false;
        regionSelect.value = '';
        const ncrOption = regionSelect.querySelector(`option[value="${NCR_REGION_CODE}"]`);
        if (ncrOption) ncrOption.disabled = true;
    }
});

regionSelect.addEventListener('change', async () => {
    resetDropdowns(provinceSelect, citySelect, barangaySelect);
    if (regionSelect.value) {
        await populateDropdown(provinceSelect, `${PSGC_API_BASE}/regions/${regionSelect.value}/provinces/`);
    }
});

provinceSelect.addEventListener('change', () => {
    resetDropdowns(citySelect, barangaySelect);
    if (provinceSelect.value) {
        populateDropdown(citySelect, `${PSGC_API_BASE}/provinces/${provinceSelect.value}/cities-municipalities/`);
    }
});

citySelect.addEventListener('change', () => {
    resetDropdowns(barangaySelect);
    if (citySelect.value) {
        populateDropdown(barangaySelect, `${PSGC_API_BASE}/cities-municipalities/${citySelect.value}/barangays/`);
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageDiv.textContent = 'Submitting...';
    messageDiv.className = 'text-center mt-4 text-blue-400';

    const newUserId = userIdInput.value;
    const newIdNo = idNoInput.value;

    if (!newUserId || newUserId === "Generating..." || newUserId === "Error") {
        messageDiv.textContent = 'Error: User-ID not generated.';
        messageDiv.className = 'text-center mt-4 text-red-500';
        return;
    }
    
    // --- DUPLICATE CHECK LOGIC ---
    const newFirstName = document.getElementById('first-name').value.trim();
    const newLastName = document.getElementById('last-name').value.trim();
    const newFullName = `${newFirstName} ${newLastName}`.toLowerCase();

    try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            for (const userId in usersData) {
                const user = usersData[userId].personalInfo;
                const existingFullName = `${user.firstName.trim()} ${user.lastName.trim()}`.toLowerCase();
                if (existingFullName === newFullName) {
                    messageDiv.textContent = `Error: A user with the name "${newFirstName} ${newLastName}" already exists.`;
                    messageDiv.className = 'text-center mt-4 text-red-500';
                    return; 
                }
            }
        }
    } catch (error) {
        console.error("Error checking for duplicate users:", error);
        messageDiv.textContent = 'Error checking for duplicates. Please try again.';
        messageDiv.className = 'text-center mt-4 text-red-500';
        return;
    }
    
    // --- NEW: GET LOGGED-IN ADMIN'S NAME ---
    let adminName = 'Unknown';
    try {
        const loggedInUserString = sessionStorage.getItem('loggedInUser');
        if (loggedInUserString) {
            const loggedInUser = JSON.parse(loggedInUserString);
            adminName = loggedInUser.displayName || 'Unknown';
        }
    } catch (error) {
        console.error('Could not get admin name from session storage:', error);
    }
    // --- END ---


    const [profileImageUrl, signatureImageUrl] = await Promise.all([
        uploadImageToSupabase(profileImageInput.files[0], 'profile-images', newUserId, 'profile'),
        uploadImageToSupabase(signatureImageInput.files[0], 'signatures', newUserId, 'signature')
    ]);
    
    const getSelectedText = (el) => (el.selectedIndex > 0) ? el.options[el.selectedIndex].textContent : '';

    let addressData;
    if (ncrToggle.checked) {
        addressData = {
            region: regionManual.value,
            province: provinceManual.value,
            city: cityManual.value,
            barangay: barangayManual.value,
        };
    } else {
        addressData = {
            region: getSelectedText(regionSelect),
            province: getSelectedText(provinceSelect),
            city: getSelectedText(citySelect),
            barangay: getSelectedText(barangaySelect),
        };
    }
    
    const userData = {
        personalInfo: {
            id: newUserId,
            idNo: newIdNo,
            firstName: newFirstName,
            middleName: document.getElementById('middle-name').value,
            lastName: newLastName,
            contactNo: document.getElementById('contact-no').value,
            dob: document.getElementById('dob').value,
            age: document.getElementById('age').value,
            sex: document.getElementById('sex').value,
            bloodType: document.getElementById('blood-type').value,
        },
        address: {
            addressLine1: document.getElementById('address-line-1').value,
            ...addressData,
            zipCode: document.getElementById('zip-code').value,
        },
        otherInfo: {
            occupation: document.getElementById('occupation').value,
            skills: document.getElementById('skills').value,
            joinDate: document.getElementById('join-date').value,
            referrerId: document.getElementById('referrer-id').value.trim(),
            profileImageUrl: profileImageUrl || '',
            signatureImageUrl: signatureImageUrl || '',
            addedBy: adminName // --- NEW: SAVE THE ADMIN NAME ---
        },
        emergencyContact: {
            lastName: document.getElementById('ec-last-name').value,
            firstName: document.getElementById('ec-first-name').value,
            middleName: document.getElementById('ec-middle-name').value,
            nickname: document.getElementById('ec-nickname').value,
            relationship: document.getElementById('ec-relationship').value,
            contactNo: document.getElementById('ec-contact-no').value,
            address: document.getElementById('ec-address').value,
        }
    };

    try {
        await set(child(usersRef, newUserId), userData);
        messageDiv.textContent = 'User registered successfully!';
        messageDiv.className = 'text-center mt-4 text-green-500';
        form.reset();
        ncrToggle.checked = false; 
        ncrToggle.dispatchEvent(new Event('change'));
        
        initializePage(); 
    } catch (error) {
        console.error("Firebase write failed: ", error);
        messageDiv.textContent = 'Submission error. See console.';
        messageDiv.className = 'text-center mt-4 text-red-500';
    }
});

// --- Page Initialization ---
async function initializePage() {
    userIdInput.value = 'Generating...';
    idNoInput.value = 'Generating...';
    try {
        const snapshot = await get(usersRef);
        const userCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        
        userIdInput.value = `100-${101 + userCount}`;
        
        const newIdNumber = (userCount + 1).toString().padStart(7, '0');
        idNoInput.value = `2025-${newIdNumber}`;

    } catch(error) {
        console.error("Could not fetch user count:", error);
        userIdInput.value = "Error";
        idNoInput.value = "Error";
    }
    populateRegions();
    resetDropdowns(provinceSelect, citySelect, barangaySelect);
}

document.addEventListener('DOMContentLoaded', initializePage);

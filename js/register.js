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
const idInput = document.getElementById('id-no');
const messageDiv = document.getElementById('form-message');
const regionSelect = document.getElementById('region');
const provinceSelect = document.getElementById('province');
const citySelect = document.getElementById('city');
const profileImageInput = document.getElementById('profile-image');
const signatureImageInput = document.getElementById('signature-image');

// --- Caching for NCR data ---
let ncrCitiesData = null;

// --- Supabase Upload Helper Function ---
async function uploadImageToSupabase(file, bucketName, userId, imageType) {
    if (!file) {
        console.warn(`No file selected for ${imageType} upload.`);
        return null;
    }

    const filePath = `${userId}/${imageType}-${Date.now()}.${file.name.split('.').pop()}`;

    try {
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
            console.error("Supabase anonymous sign-in failed:", signInError);
            return null;
        }
        
        const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file);

        if (error) {
            console.error(`Error uploading ${imageType} image:`, error);
            return null;
        }

        const { data: { publicUrl }, error: publicUrlError } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        
        if (publicUrlError) {
            console.error(`Error getting public URL for ${imageType} image:`, publicUrlError);
            return null;
        }

        return publicUrl;
    } catch (error) {
        console.error(`Unexpected error during ${imageType} image upload:`, error);
        return null;
    }
}

// --- PSGC API Helper Functions ---
const PSGC_API_BASE = 'https://psgc.gitlab.io/api';

async function fetchNcrCities() {
    if (ncrCitiesData) return ncrCitiesData;
    const response = await fetch('../js/data/ncr_cities.json');
    ncrCitiesData = await response.json();
    return ncrCitiesData;
}

async function populateDropdown(selectElement, dataSource, nameProperty) {
    selectElement.innerHTML = `<option value="" disabled selected>Loading...</option>`;
    try {
        let data;
        if (typeof dataSource === 'string') {
            const response = await fetch(dataSource);
            if (!response.ok) throw new Error('Network response was not ok');
            data = await response.json();
        } else {
            data = dataSource;
        }

        if (nameProperty) {
            data.sort((a, b) => a.name.localeCompare(b.name));
            selectElement.innerHTML = `<option value="" disabled selected>Select ${selectElement.previousElementSibling.textContent}</option>`;
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.code;
                option.textContent = item[nameProperty];
                selectElement.appendChild(option);
            });
        }
        
        selectElement.disabled = false;
    } catch (error) {
        console.error(`Failed to fetch ${selectElement.id}:`, error);
        selectElement.innerHTML = `<option value="" disabled selected>Failed to load</option>`;
    }
}

function resetDropdowns(...dropdowns) {
    dropdowns.forEach(dd => {
        if (dd && dd.tagName === 'SELECT') {
            const label = dd.previousElementSibling.textContent;
            dd.innerHTML = `<option value="" disabled selected>Select ${label}</option>`;
            dd.disabled = true;
        }
    });
}

// --- Event Listeners ---
regionSelect.addEventListener('change', async () => {
    const barangayElement = document.getElementById('barangay');
    resetDropdowns(provinceSelect, citySelect, barangayElement);

    const NCR_CODE = '130000000';

    if (regionSelect.value === NCR_CODE) {
        provinceSelect.disabled = true;
        provinceSelect.innerHTML = `<option value="N/A" selected>N/A</option>`;
        
        const ncrCities = await fetchNcrCities();
        await populateDropdown(citySelect, ncrCities, 'name');
        
        citySelect.disabled = false;
    } else if (regionSelect.value) {
        await populateDropdown(provinceSelect, `${PSGC_API_BASE}/regions/${regionSelect.value}/provinces/`, 'name');
    }
});

provinceSelect.addEventListener('change', () => {
    const barangayElement = document.getElementById('barangay');
    resetDropdowns(citySelect, barangayElement);
    if (provinceSelect.value) {
        populateDropdown(citySelect, `${PSGC_API_BASE}/provinces/${provinceSelect.value}/cities-municipalities/`, 'name');
    }
});

citySelect.addEventListener('change', async () => {
    const selectedRegionName = regionSelect.options[regionSelect.selectedIndex].textContent;
    const selectedCityCode = citySelect.value;
    
    const barangayContainer = document.getElementById('barangay').parentNode;

    if (selectedRegionName === 'National Capital Region (NCR)') {
        const barangayInput = document.createElement('input');
        barangayInput.type = 'text';
        barangayInput.id = 'barangay';
        barangayInput.className = 'form-input';
        barangayInput.placeholder = 'Enter Barangay';
        barangayInput.required = true;

        barangayContainer.innerHTML = '';
        
        const label = document.createElement('label');
        label.htmlFor = 'barangay';
        label.className = 'block text-sm font-medium';
        label.textContent = 'Barangay';
        barangayContainer.appendChild(label);
        
        barangayContainer.appendChild(barangayInput);

    } else if (selectedCityCode) {
        const barangaySelect = document.createElement('select');
        barangaySelect.id = 'barangay';
        barangaySelect.className = 'form-input';
        barangaySelect.required = true;
        barangaySelect.disabled = true;
        
        barangayContainer.innerHTML = '';
        
        const label = document.createElement('label');
        label.htmlFor = 'barangay';
        label.className = 'block text-sm font-medium';
        label.textContent = 'Barangay';
        barangayContainer.appendChild(label);

        barangayContainer.appendChild(barangaySelect);
        
        populateDropdown(barangaySelect, `${PSGC_API_BASE}/cities-municipalities/${selectedCityCode}/barangays/`, 'name');
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

    const profileImageFile = profileImageInput.files[0];
    const signatureImageFile = signatureImageInput.files[0];
    
    const [profileImageUrl, signatureImageUrl] = await Promise.all([
        uploadImageToSupabase(profileImageFile, 'profile-images', newId, 'profile'),
        uploadImageToSupabase(signatureImageFile, 'signatures', newId, 'signature')
    ]);
    
    const getSelectedText = (el) => el.options[el.selectedIndex]?.textContent || '';

    const barangayElement = document.getElementById('barangay');
    const barangayValue = (barangayElement.tagName === 'SELECT') 
        ? getSelectedText(barangayElement) 
        : barangayElement.value;

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
            barangay: barangayValue,
            zipCode: document.getElementById('zip-code').value,
        },
        otherInfo: {
            occupation: document.getElementById('occupation').value,
            skills: document.getElementById('skills').value,
            joinDate: document.getElementById('join-date').value,
            referrerName: document.getElementById('referrer-name').value,
            profileImageUrl: profileImageUrl || '',
            signatureImageUrl: signatureImageUrl || '',
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
        
        const barangayContainer = document.getElementById('barangay').parentNode;
        const newBarangaySelect = document.createElement('select');
        newBarangaySelect.id = 'barangay';
        newBarangaySelect.className = 'form-input';
        newBarangaySelect.required = true;
        newBarangaySelect.disabled = true;
        newBarangaySelect.innerHTML = `<option value="" disabled selected>Select Barangay</option>`;
        
        barangayContainer.innerHTML = '';
        const label = document.createElement('label');
        label.htmlFor = 'barangay';
        label.className = 'block text-sm font-medium';
        label.textContent = 'Barangay';
        barangayContainer.appendChild(label);
        barangayContainer.appendChild(newBarangaySelect);

        resetDropdowns(provinceSelect, citySelect);
        initializePage(); 
    } catch (error) {
        console.error("Firebase write failed: ", error);
        messageDiv.textContent = 'An error occurred during submission. Please check console.';
        messageDiv.className = 'text-center mt-4 text-red-500 font-semibold';
    }
});

// --- Page Initialization ---
async function initializePage() {
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

    populateDropdown(regionSelect, `${PSGC_API_BASE}/regions/`, 'name');
}

document.addEventListener('DOMContentLoaded', initializePage);
// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
const dbRef = ref(database);

// --- Main function to fetch and display the user's profile ---
async function displayUserProfile() {
    const userId = getQueryParam('id'); // This is the User-ID (100-X)
    const profileContainer = document.getElementById('profile-container');
    const profileImageDisplay = document.getElementById('profile-image-display');
    const signatureImageDisplay = document.getElementById('signature-image-display');
    
    if (!userId) {
        profileContainer.innerHTML = '<p class="text-center text-red-400">No user ID provided.</p>';
        return;
    }
    
    populateElement('user-id-header', userId);

    try {
        // Fetch all users to create a lookup map for referrer's name
        const allUsersSnapshot = await get(ref(database, 'users'));
        const allUsersData = allUsersSnapshot.exists() ? allUsersSnapshot.val() : {};

        const userSnapshot = await get(child(dbRef, `users/${userId}`));
        if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            
            if (userData.otherInfo.profileImageUrl) {
                profileImageDisplay.src = userData.otherInfo.profileImageUrl;
            }
            if (userData.otherInfo.signatureImageUrl) {
                signatureImageDisplay.src = userData.otherInfo.signatureImageUrl;
            }

            // Populate Personal Info
            const pi = userData.personalInfo;
            populateElement('id-no', pi.idNo); // Populate the new ID No field
            const fullName = `${pi.firstName || ''} ${pi.middleName || ''} ${pi.lastName || ''}`.replace(/\s+/g, ' ').trim();
            populateElement('full-name', fullName);
            populateElement('contact-no', pi.contactNo);
            populateElement('dob', pi.dob);
            populateElement('age', pi.age);
            populateElement('sex', pi.sex);
            populateElement('blood-type', pi.bloodType);

            // Populate Address
            const addr = userData.address;
            populateElement('address-line-1', addr.addressLine1);
            populateElement('region', addr.region);
            populateElement('province', addr.province);
            populateElement('city', addr.city);
            populateElement('barangay', addr.barangay);
            populateElement('zip-code', addr.zipCode);

            // Populate Other Info
            const other = userData.otherInfo;
            populateElement('occupation', other.occupation);
            populateElement('skills', other.skills);
            populateElement('join-date', other.joinDate);
            
            // Display Referrer Info
            const referrerId = other.referrerId;
            if (referrerId && allUsersData[referrerId]) {
                const referrer = allUsersData[referrerId].personalInfo;
                const referrerFullName = `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim();
                populateElement('referrer-info', `${referrerFullName} (ID: ${referrerId})`);
            } else if (referrerId) {
                populateElement('referrer-info', `ID: ${referrerId} (User not found)`);
            } else {
                populateElement('referrer-info', 'Direct');
            }
            
            // Populate Emergency Contact
            const ec = userData.emergencyContact;
            const ecFullName = `${ec.firstName || ''} ${ec.middleName || ''} ${ec.lastName || ''}`.replace(/\s+/g, ' ').trim();
            populateElement('ec-full-name', ecFullName);
            populateElement('ec-nickname', ec.nickname);
            populateElement('ec-relationship', ec.relationship);
            populateElement('ec-contact-no', ec.contactNo);
            populateElement('ec-address', ec.address);

        } else {
            profileContainer.innerHTML = `<p class="text-center text-yellow-400">User with ID '${userId}' not found.</p>`;
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        profileContainer.innerHTML = '<p class="text-center text-red-400">Failed to load user profile.</p>';
    }
}

// Helper function to populate an element's text content
function populateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value || 'N/A';
    }
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', displayUserProfile);
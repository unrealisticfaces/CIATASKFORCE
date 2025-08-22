// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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

// --- Google Drive API Configuration ---
// IMPORTANT: Replace with your own API Key and Client ID from Google Cloud Console
const GOOGLE_API_KEY = 'wala';
const GOOGLE_CLIENT_ID = 'wala';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// --- System Stats Functionality ---
async function displaySystemStats() {
    try {
        const adminsRef = ref(database, 'admins');
        const adminsSnapshot = await get(adminsRef);
        const adminCount = adminsSnapshot.exists() ? Object.keys(adminsSnapshot.val()).length : 0;
        document.getElementById('total-admins-stat').textContent = adminCount;

        const usersRef = ref(database, 'users');
        const usersSnapshot = await get(usersRef);
        const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};
        const userCount = Object.keys(usersData).length;
        document.getElementById('total-users-stat').textContent = userCount;

        const dataString = JSON.stringify(usersData);
        const bytes = new TextEncoder().encode(dataString).length;
        const kilobytes = (bytes / 1024).toFixed(2);
        document.getElementById('firebase-usage-stat').textContent = `${kilobytes} KB`;

        await supabase.auth.signInAnonymously();
        const { data: profileFiles } = await supabase.storage.from('profile-images').list('', { limit: 10000 });
        const { data: signatureFiles } = await supabase.storage.from('signatures').list('', { limit: 10000 });
        const totalFiles = (profileFiles?.length || 0) + (signatureFiles?.length || 0);
        document.getElementById('supabase-usage-stat').textContent = `${totalFiles} Files`;

        createRegistrationsChart(Object.values(usersData));

    } catch (error) {
        console.error("Error calculating system stats:", error);
        document.getElementById('total-users-stat').textContent = 'Error';
        document.getElementById('total-admins-stat').textContent = 'Error';
        document.getElementById('firebase-usage-stat').textContent = 'Error';
        document.getElementById('supabase-usage-stat').textContent = 'Error';
    }
}

function createRegistrationsChart(usersArray) {
    const monthlyData = usersArray.reduce((acc, user) => {
        const joinDate = user.otherInfo?.joinDate;
        if (joinDate) {
            const date = new Date(joinDate);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[yearMonth] = (acc[yearMonth] || 0) + 1;
        }
        return acc;
    }, {});

    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(yearMonth => {
        const [year, month] = yearMonth.split('-');
        return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    const data = sortedMonths.map(month => monthlyData[month]);

    const ctx = document.getElementById('registrations-timeline-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'New Users',
                data: data,
                backgroundColor: '#3b82f6',
                borderRadius: 4,
                maxBarThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#9ca3af', precision: 0 } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// --- Backup & Restore Functionality ---
async function prepareUserDataForExport() {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) {
        alert("No user data available to export.");
        return null;
    }
    const allUsers = Object.values(snapshot.val());
    return allUsers.map(user => ({
        "User ID": user.personalInfo.id,
        "ID No": user.personalInfo.idNo,
        "First Name": user.personalInfo.firstName,
        "Middle Name": user.personalInfo.middleName,
        "Last Name": user.personalInfo.lastName,
        "Contact No": user.personalInfo.contactNo,
        "Date of Birth": user.personalInfo.dob,
        "Age": user.personalInfo.age,
        "Sex": user.personalInfo.sex,
        "Blood Type": user.personalInfo.bloodType,
        "Address Line 1": user.address.addressLine1,
        "Region": user.address.region,
        "Province": user.address.province,
        "City/Municipality": user.address.city,
        "Barangay": user.address.barangay,
        "Zip Code": user.address.zipCode,
        "Occupation": user.otherInfo.occupation,
        "Skills": user.otherInfo.skills,
        "Join Date": user.otherInfo.joinDate,
        "Referred By ID": user.otherInfo.referrerId,
        "Added By": user.otherInfo.addedBy,
        "EC Last Name": user.emergencyContact.lastName,
        "EC First Name": user.emergencyContact.firstName,
        "EC Middle Name": user.emergencyContact.middleName,
        "EC Nickname": user.emergencyContact.nickname,
        "EC Relationship": user.emergencyContact.relationship,
        "EC Contact No": user.emergencyContact.contactNo,
        "EC Address": user.emergencyContact.address
    }));
}

async function downloadToComputer() {
    const downloadBtn = document.getElementById('download-xlsx-btn');
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Generating...';
    try {
        const flattenedData = await prepareUserDataForExport();
        if (!flattenedData) return;
        const worksheet = XLSX.utils.json_to_sheet(flattenedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
        const today = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `CIA_Users_Backup_${today}.xlsx`);
    } catch (error) {
        console.error("Error exporting to Excel:", error);
        alert("An error occurred while exporting the data.");
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<i class="fas fa-file-excel mr-2"></i> Download to Computer';
    }
}

function initializeGapiClient() {
    gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    }).then(() => gapiInited = true);
}

function initializeGisClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', // Callback will be set dynamically
    });
    gisInited = true;
}

async function uploadToGoogleDrive() {
    const uploadBtn = document.getElementById('upload-gdrive-btn');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Preparing...';
    try {
        const flattenedData = await prepareUserDataForExport();
        if (!flattenedData) return;
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                throw (resp);
            }
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Uploading...';
            const worksheet = XLSX.utils.json_to_sheet(flattenedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
            const xlsxData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([new Uint8Array(xlsxData)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const today = new Date().toISOString().slice(0, 10);
            const fileName = `CIA_Users_Backup_${today}.xlsx`;
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify({ name: fileName })], { type: 'application/json' }));
            form.append('file', blob);
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ 'Authorization': `Bearer ${gapi.client.getToken().access_token}` }),
                body: form,
            });
            if (response.ok) {
                alert(`File "${fileName}" uploaded successfully to your Google Drive!`);
            } else {
                throw new Error('Upload failed.');
            }
        };
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    } catch (error) {
        console.error("Error uploading to Google Drive:", error);
        alert("An error occurred during the upload.");
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fab fa-google-drive mr-2"></i> Upload to Google Drive';
    }
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    const loggedInUserString = sessionStorage.getItem('loggedInUser');
    if (loggedInUserString) {
        const user = JSON.parse(loggedInUserString);
        if (user.role !== 'superadmin') {
            document.body.innerHTML = '<div class="h-screen flex items-center justify-center text-red-500 text-2xl">Access Denied: Super Admin only.</div>';
            return;
        }
    }

    // Initialize both features
    displaySystemStats();
    
    const backupBtn = document.getElementById('backup-btn');
    const backupModal = document.getElementById('backup-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    backupBtn.addEventListener('click', () => backupModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => backupModal.classList.add('hidden'));

    document.getElementById('download-xlsx-btn').addEventListener('click', downloadToComputer);
    document.getElementById('upload-gdrive-btn').addEventListener('click', uploadToGoogleDrive);

    gapi.load('client', initializeGapiClient);
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = initializeGisClient;
    document.body.appendChild(gisScript);
});

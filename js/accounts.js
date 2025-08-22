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
const usersRef = ref(database, 'users');

// Store all users fetched from Firebase to enable client-side search
let allUsers = [];

// Function to render a given list of users into the table
function renderUsers(usersToDisplay) {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = ''; // Clear the table first

    if (usersToDisplay.length === 0) {
        tableBody.innerHTML = '<tr class="border-b border-gray-700"><td colspan="8" class="text-center px-6 py-12 text-gray-400">No users match your search.</td></tr>';
        return;
    }

    usersToDisplay.forEach(userData => {
        // --- FIX: Handle both old and new data structures ---
        const userId = userData.importantInfo?.id || userData.personalInfo?.id;
        const fullName = `${userData.personalInfo?.firstName || ''} ${userData.personalInfo?.lastName || ''}`.trim();
        const contactNo = userData.address?.contactNo || userData.personalInfo?.contactNo || 'N/A';
        const joinDate = userData.importantInfo?.joinDate || userData.otherInfo?.joinDate || 'N/A';
        const addedBy = userData.otherInfo?.addedBy || 'N/A';

        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700 hover:bg-gray-700/50';
        
        row.innerHTML = `
            <td class="p-4"><input type="checkbox" class="bg-gray-700 border-gray-600 rounded"></td>
            <td class="px-6 py-4 font-medium text-white">${userId}</td>
            <td class="px-6 py-4">${fullName}</td>
            <td class="px-6 py-4">${contactNo}</td>
            <td class="px-6 py-4">${joinDate}</td>
            <td class="px-6 py-4">${addedBy}</td>
            <td class="px-6 py-4">
                <span class="flex items-center text-sm font-medium"><span class="flex w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span> Active</span>
            </td>
            <td class="px-6 py-4">
                <a href="./profile.html?id=${userId}" class="font-medium text-blue-500 hover:underline">View</a>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// This function now fetches all users and calls the render function
async function displayUsers() {
    const tableBody = document.getElementById('users-table-body');
    try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            allUsers = Object.values(snapshot.val());
            renderUsers(allUsers); 
        } else {
            tableBody.innerHTML = '<tr class="border-b border-gray-700"><td colspan="8" class="text-center px-6 py-12 text-gray-400">No users found in the database.</td></tr>';
        }
    } catch (error) {
        console.error("Error fetching users:", error);
        tableBody.innerHTML = '<tr class="border-b border-gray-700"><td colspan="8" class="text-center px-6 py-12 text-red-400">Failed to load user data. See console for details.</td></tr>';
    }
}

// Event listener now also sets up the search functionality
document.addEventListener('DOMContentLoaded', () => {
    displayUsers();

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        const filteredUsers = allUsers.filter(user => {
            const fullName = `${user.personalInfo?.firstName || ''} ${user.personalInfo?.lastName || ''}`.toLowerCase();
            // --- FIX: Use correct path for the user ID in search ---
            const userId = (user.importantInfo?.id || user.personalInfo?.id).toLowerCase();
            
            return fullName.includes(searchTerm) || userId.includes(searchTerm);
        });
        
        renderUsers(filteredUsers);
    });
});
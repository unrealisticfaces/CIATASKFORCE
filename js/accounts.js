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

// Function to fetch and display users
async function displayUsers() {
    const tableBody = document.getElementById('users-table-body');
    try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            tableBody.innerHTML = ''; // Clear the "Loading..." message
            snapshot.forEach(childSnapshot => {
                const userId = childSnapshot.key;
                const userData = childSnapshot.val();
                
                // Combine first and last name
                const fullName = `${userData.personalInfo.firstName || ''} ${userData.personalInfo.lastName || ''}`.trim();
                
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-700 hover:bg-gray-700/50';
                
                // **THIS IS THE UPDATED PART**
                // The href attribute now correctly links to the profile page with the user's ID
                row.innerHTML = `
                    <td class="p-4"><input type="checkbox" class="bg-gray-700 border-gray-600 rounded"></td>
                    <td class="px-6 py-4 font-medium text-white">${userId}</td>
                    <td class="px-6 py-4">${fullName}</td>
                    <td class="px-6 py-4">${userData.personalInfo.contactNo || 'N/A'}</td>
                    <td class="px-6 py-4">${userData.otherInfo.joinDate || 'N/A'}</td>
                    <td class="px-6 py-4">
                        <span class="flex items-center text-sm font-medium"><span class="flex w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span> Active</span>
                    </td>
                    <td class="px-6 py-4">
                        <a href="./profile.html?id=${userId}" class="font-medium text-blue-500 hover:underline">View</a>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr class="border-b border-gray-700"><td colspan="7" class="text-center px-6 py-12 text-gray-400">No users found in the database.</td></tr>';
        }
    } catch (error) {
        console.error("Error fetching users:", error);
        tableBody.innerHTML = '<tr class="border-b border-gray-700"><td colspan="7" class="text-center px-6 py-12 text-red-400">Failed to load user data.</td></tr>';
    }
}

// Run the function when the DOM is loaded
document.addEventListener('DOMContentLoaded', displayUsers);
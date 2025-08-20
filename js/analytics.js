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

// Global variable to hold all user data for searching
let allUsersById = new Map();

// --- Fetch all user data once when the page loads ---
async function fetchAllUsers() {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const usersData = snapshot.val();
            Object.values(usersData).forEach(user => {
                allUsersById.set(user.personalInfo.id, { ...user, children: [] });
            });
        }
    } catch (error) {
        console.error("Failed to fetch user data:", error);
    }
}

// --- Main function to build and render a specific user's tree ---
function buildGenealogyTree(startUserId) {
    const container = document.getElementById('genealogy-container');
    container.innerHTML = ''; // Clear previous results

    if (!allUsersById.has(startUserId)) {
        container.innerHTML = `<p class="text-yellow-400">User ID "${startUserId}" not found.</p>`;
        return;
    }

    // Reset children arrays before rebuilding
    allUsersById.forEach(user => user.children = []);

    // Build the full tree structure in memory
    allUsersById.forEach(user => {
        const referrerId = user.otherInfo?.referrerId?.trim();
        if (referrerId && allUsersById.has(referrerId)) {
            allUsersById.get(referrerId).children.push(user);
        }
    });

    const rootUser = allUsersById.get(startUserId);

    if (rootUser.children.length === 0) {
        container.innerHTML = `<p class="text-gray-400">User "${rootUser.personalInfo.firstName} ${rootUser.personalInfo.lastName}" has not referred anyone.</p>`;
        return;
    }

    const treeRootUl = document.createElement('ul');
    treeRootUl.appendChild(createNodeElement(rootUser));
    container.appendChild(treeRootUl);
}

// --- Recursive function to create each node element ---
function createNodeElement(user) {
    const li = document.createElement('li');
    const fullName = `${user.personalInfo.firstName || ''} ${user.personalInfo.lastName || ''}`.trim();
    const userId = user.personalInfo.id;

    const nodeLink = document.createElement('a');
    nodeLink.href = `./profile.html?id=${userId}`;
    nodeLink.innerHTML = `
        <div class="font-bold text-white">${fullName}</div>
        <div class="text-xs text-gray-400 mt-1">ID: ${userId}</div>
    `;
    li.appendChild(nodeLink);

    if (user.children && user.children.length > 0) {
        const childrenUl = document.createElement('ul');
        user.children.forEach(child => {
            childrenUl.appendChild(createNodeElement(child));
        });
        li.appendChild(childrenUl);
    }
    return li;
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Fetch all users as soon as the page loads
    fetchAllUsers();

    const searchForm = document.getElementById('genealogy-search-form');
    const searchInput = document.getElementById('search-id-input');

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchId = searchInput.value.trim();
        if (searchId) {
            buildGenealogyTree(searchId);
        }
    });
});

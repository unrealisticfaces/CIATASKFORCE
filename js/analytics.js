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

// --- Main function to build and render the genealogy tree ---
async function buildGenealogyTree() {
    const container = document.getElementById('genealogy-container');
    if (!container) return;

    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        if (!snapshot.exists()) {
            container.innerHTML = '<p class="text-gray-400">No user data found to build the tree.</p>';
            return;
        }

        const usersData = snapshot.val();
        const users = Object.values(usersData);
        
        // A map to hold all users by their full name for easy lookup.
        // NOTE: This assumes names are unique. A more robust solution for the future
        // would be to save the referrer's ID instead of their name.
        const usersByName = new Map();
        users.forEach(user => {
            const fullName = `${user.personalInfo.firstName || ''} ${user.personalInfo.lastName || ''}`.trim();
            if (fullName) {
                usersByName.set(fullName, { ...user, children: [] });
            }
        });

        // A list of root nodes (users who were not referred by anyone in the system).
        const rootNodes = [];

        // Build the tree structure.
        usersByName.forEach(user => {
            const referrerName = user.otherInfo?.referrerName?.trim();
            if (referrerName && usersByName.has(referrerName)) {
                // If the user has a valid referrer, add them as a child to that referrer.
                usersByName.get(referrerName).children.push(user);
            } else {
                // Otherwise, they are a root node.
                rootNodes.push(user);
            }
        });
        
        // Clear the loading message and render the tree.
        container.innerHTML = '';
        if (rootNodes.length > 0) {
            const treeRootUl = document.createElement('ul');
            rootNodes.forEach(node => {
                treeRootUl.appendChild(createNodeElement(node));
            });
            container.appendChild(treeRootUl);
        } else {
            container.innerHTML = '<p class="text-gray-400">Could not determine root nodes for the tree.</p>';
        }

    } catch (error) {
        console.error("Failed to build genealogy tree:", error);
        container.innerHTML = '<p class="text-red-500">An error occurred while loading the data.</p>';
    }
}

// --- Recursive function to create each node in the tree ---
function createNodeElement(user) {
    const li = document.createElement('li');
    
    const fullName = `${user.personalInfo.firstName || ''} ${user.personalInfo.lastName || ''}`.trim();
    const userId = user.personalInfo.id;

    // Create the clickable node element.
    const nodeLink = document.createElement('a');
    nodeLink.href = `./profile.html?id=${userId}`;
    nodeLink.innerHTML = `
        <div class="font-bold text-white">${fullName}</div>
        <div class="text-xs text-gray-400 mt-1">ID: ${userId}</div>
    `;
    li.appendChild(nodeLink);

    // If the user has children, create a new list and recursively add them.
    if (user.children && user.children.length > 0) {
        const childrenUl = document.createElement('ul');
        user.children.forEach(child => {
            childrenUl.appendChild(createNodeElement(child));
        });
        li.appendChild(childrenUl);
    }

    return li;
}

document.addEventListener('DOMContentLoaded', buildGenealogyTree);

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

// Global variables
let allUsersById = new Map();
let currentSearchId = null;

// --- Fetch all user data once when the page loads ---
async function fetchAllUsers() {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            Object.values(usersData).forEach(user => {
                // --- FIX: Handle both old and new data structures ---
                const userId = user.importantInfo?.id || user.personalInfo?.id;
                if (userId) {
                    allUsersById.set(userId, { ...user, children: [] });
                }
            });
        }
    } catch (error) {
        console.error("Failed to fetch user data:", error);
    }
}

// --- Main function to build and render the tree ---
function buildAndRenderTree(startUserId) {
    currentSearchId = startUserId;
    const container = document.getElementById('genealogy-container');
    const treeRoot = document.getElementById('tree-root');
    const svg = document.getElementById('tree-lines-svg');
    container.innerHTML = ''; // Clear previous results
    svg.innerHTML = ''; // Clear previous SVG lines

    if (!allUsersById.has(startUserId)) {
        container.innerHTML = `<p class="text-yellow-400">User ID "${startUserId}" not found.</p>`;
        return;
    }

    // Build the hierarchy
    allUsersById.forEach(user => user.children = []);
    allUsersById.forEach(user => {
        const referrerId = user.otherInfo?.referrerId?.trim();
        if (referrerId && allUsersById.has(referrerId)) {
            allUsersById.get(referrerId).children.push(user);
        }
    });

    const rootUser = allUsersById.get(startUserId);
    const isMobile = window.innerWidth <= 768;

    // Set layout class
    treeRoot.className = isMobile ? 'tree mobile-tree' : 'tree desktop-tree';

    // Build HTML
    const treeUl = document.createElement('ul');
    treeUl.appendChild(createNodeElement(rootUser));
    container.appendChild(treeUl);

    // --- DRAW SVG LINES ONLY ON DESKTOP ---
    if (!isMobile) {
        // Use a short timeout to ensure the DOM is fully updated before drawing
        setTimeout(drawSvgConnectors, 50);
    }
}

// --- Recursive function to create HTML nodes ---
function createNodeElement(user) {
    const li = document.createElement('li');
    // --- FIX: Handle both old and new data structures ---
    const userId = user.importantInfo?.id || user.personalInfo?.id;
    li.id = `user-node-${userId.replace(/\s+/g, '-')}`;
    
    const fullName = `${user.personalInfo?.firstName || ''} ${user.personalInfo?.lastName || ''}`.trim();

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

// --- Function to draw connectors using SVG (FOR DESKTOP ONLY) ---
function drawSvgConnectors() {
    const svg = document.getElementById('tree-lines-svg');
    const treeRoot = document.getElementById('tree-root');
    svg.innerHTML = ''; // Clear previous lines

    const wrapperRect = treeRoot.getBoundingClientRect();
    const parentNodes = treeRoot.querySelectorAll('li:has(ul)');

    parentNodes.forEach(parentLi => {
        const parentRect = parentLi.querySelector('a').getBoundingClientRect();
        const childrenUl = parentLi.querySelector('ul');
        const childrenLi = childrenUl.querySelectorAll('li');

        childrenLi.forEach(childLi => {
            const childRect = childLi.querySelector('a').getBoundingClientRect();
            
            // Calculate coordinates relative to the tree-wrapper
            const startX = parentRect.left + parentRect.width / 2 - wrapperRect.left;
            const startY = parentRect.bottom - wrapperRect.top;
            const endX = childRect.left + childRect.width / 2 - wrapperRect.left;
            const endY = childRect.top - wrapperRect.top;
            const midY = startY + (endY - startY) / 2;

            const pathData = `M ${startX},${startY} L ${startX},${midY} L ${endX},${midY} L ${endX},${endY}`;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('stroke', '#4b5563');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'none');
            svg.appendChild(path);
        });
    });
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    fetchAllUsers();

    const searchForm = document.getElementById('genealogy-search-form');
    const searchInput = document.getElementById('search-id-input');

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchId = searchInput.value.trim();
        if (searchId) {
            buildAndRenderTree(searchId);
        }
    });

    // Redraw on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (currentSearchId) {
                buildAndRenderTree(currentSearchId);
            }
        }, 200);
    });
});
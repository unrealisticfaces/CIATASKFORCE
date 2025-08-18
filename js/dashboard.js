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

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', async () => {

    // // --- Logout Functionality ---
    // const userProfileButton = document.getElementById('userProfileButton');
    // const logoutMenu = document.getElementById('logoutMenu');
    // const logoutButton = document.getElementById('logoutButton');

    // if (userProfileButton) {
    //     userProfileButton.addEventListener('click', (event) => {
    //         event.stopPropagation();
    //         logoutMenu.classList.toggle('hidden');
    //     });
    // }

    // if (logoutButton) {
    //     logoutButton.addEventListener('click', () => {
    //         window.location.href = '../index.html'; 
    //     });
    // }

    // window.addEventListener('click', () => {
    //     if (logoutMenu && !logoutMenu.classList.contains('hidden')) {
    //         logoutMenu.classList.add('hidden');
    //     }
    // });

    // --- Fetch User Data and Create Charts ---
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        let usersArray = [];
        if (snapshot.exists()) {
            usersArray = Object.values(snapshot.val());
        }
        
        // Update the main "Users" stat card
        const totalUsersStat = document.getElementById('total-users-stat');
        if (totalUsersStat) {
            totalUsersStat.textContent = usersArray.length.toLocaleString();
        }
        
        // Process data for INTERACTIVE USERS chart
        const dailyRegistrations = usersArray.reduce((acc, user) => {
            const date = user.otherInfo?.joinDate;
            if(date) {
                acc[date] = (acc[date] || 0) + 1;
            }
            return acc;
        }, {});

        const userLabels = [];
        const userData = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateString = d.toISOString().split('T')[0];
            userLabels.push(dateString);
            userData.push(dailyRegistrations[dateString] || 0);
        }
        createInteractiveUsersChart('usersChart', userLabels, userData, '#22c55e');

        // --- Process data for SESSIONS (Referral vs Direct) chart ---
        initializeSessionsChart(usersArray);

        // --- Process data for REGION chart ---
        const regionCounts = usersArray.reduce((acc, user) => {
            const region = user.address?.region || 'Unknown';
            acc[region] = (acc[region] || 0) + 1;
            return acc;
        }, {});
        
        createRegionChart(regionCounts, usersArray.length);
        
        // --- Initialize other static charts ---
        createMiniChart('conversionsChart', [80, 75, 60, 65, 50, 45, 40, 35, 30, 25], '#ef4444');
        initializeMonthlySessionsChart(usersArray);
        
    } catch (error) {
        console.error("Failed to fetch user data for charts:", error);
    }
});


// --- Chart Creation Functions ---

function createMiniChart(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 60);
    gradient.addColorStop(0, `${color}4D`);
    gradient.addColorStop(1, `${color}00`);
    new Chart(ctx, { type: 'line', data: { labels: Array(data.length).fill(''), datasets: [{ data: data, borderColor: color, borderWidth: 2, fill: true, backgroundColor: gradient, tension: 0.4, pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display:false } } } });
}

function createInteractiveUsersChart(canvasId, labels, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 60);
    gradient.addColorStop(0, `${color}4D`);
    gradient.addColorStop(1, `${color}00`);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                borderColor: color,
                borderWidth: 2,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointBackgroundColor: color,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItems) {
                             const date = new Date(tooltipItems[0].label);
                             return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        },
                        label: function(tooltipItem) {
                            return `Users: ${tooltipItem.raw}`;
                        }
                    }
                }
            },
            scales: { x: { display: false }, y: { display: false } }
        }
    });
}

// Sessions Chart (UPDATED with 5-day intervals)
function initializeSessionsChart(usersArray) {
    const sessionsCanvas = document.getElementById('sessionsChart');
    if (!sessionsCanvas) return;

    // 1. Get daily counts from the raw user data
    const directCounts = {};
    const referralCounts = {};
    usersArray.forEach(user => {
        const date = user.otherInfo?.joinDate;
        if (!date) return;

        if (user.otherInfo.referrerName && user.otherInfo.referrerName.trim() !== '') {
            referralCounts[date] = (referralCounts[date] || 0) + 1;
        } else {
            directCounts[date] = (directCounts[date] || 0) + 1;
        }
    });

    // 2. Aggregate daily counts into 5-day buckets
    const labels = [];
    const directData = [];
    const referralData = [];
    const bucketSize = 5;
    const numberOfBuckets = 6; // 6 buckets of 5 days = 30 days total

    for (let i = numberOfBuckets - 1; i >= 0; i--) {
        let directSum = 0;
        let referralSum = 0;
        
        // Create the label for the end of the bucket (e.g., "Aug 18", "Aug 13")
        const bucketEndDate = new Date();
        bucketEndDate.setDate(bucketEndDate.getDate() - (i * bucketSize));
        const formattedLabel = bucketEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labels.push(formattedLabel);

        // Sum the data for the 5 days within this bucket
        for (let j = 0; j < bucketSize; j++) {
            const dayToSum = new Date();
            dayToSum.setDate(bucketEndDate.getDate() - j);
            const dateString = dayToSum.toISOString().split('T')[0];
            
            directSum += (directCounts[dateString] || 0);
            referralSum += (referralCounts[dateString] || 0);
        }
        
        directData.push(directSum);
        referralData.push(referralSum);
    }
    
    // 3. Create the chart
    const sessionsCtx = sessionsCanvas.getContext('2d');
    new Chart(sessionsCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Referral',
                    data: referralData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Direct',
                    data: directData,
                    borderColor: '#d1d5db',
                    backgroundColor: 'rgba(209, 213, 219, 0.2)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: { 
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: '#374151' },
                    ticks: { 
                        color: '#9ca3af',
                        precision: 0 
                    }
                },
                x: {
                    grid: { color: '#374151' },
                    ticks: { color: '#9ca3af' }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#9ca3af', usePointStyle: true, boxWidth: 8 }
                }
            }
        }
    });
}

// NEW: Dynamically generate the "Sessions per month" chart
function initializeMonthlySessionsChart(usersArray) {
    const pageViewsCanvas = document.getElementById('pageViewsChart');
    if (!pageViewsCanvas) return;

    // 1. Aggregate data by month
    const monthlyData = usersArray.reduce((acc, user) => {
        const joinDate = user.otherInfo?.joinDate;
        if (joinDate) {
            const date = new Date(joinDate);
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!acc[yearMonth]) {
                acc[yearMonth] = { direct: 0, referral: 0 };
            }
            if (user.otherInfo.referrerName && user.otherInfo.referrerName.trim() !== '') {
                acc[yearMonth].referral += 1;
            } else {
                acc[yearMonth].direct += 1;
            }
        }
        return acc;
    }, {});

    // 2. Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort();

    // 3. Prepare labels and data for the chart
    const labels = sortedMonths.map(yearMonth => {
        const [year, month] = yearMonth.split('-');
        return new Date(year, month - 1).toLocaleString('en-US', { month: 'short' });
    });

    const directData = sortedMonths.map(month => monthlyData[month].direct);
    const referralData = sortedMonths.map(month => monthlyData[month].referral);
    
    const pageViewsCtx = pageViewsCanvas.getContext('2d');
    new Chart(pageViewsCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Direct',
                data: directData,
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }, {
                label: 'Referral',
                data: referralData,
                backgroundColor: '#1e40af',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { color: '#374151' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#9ca3af' }
                }
            }
        }
    });
}

function createRegionChart(regionData, totalUsers) {
    const canvas = document.getElementById('regionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = Object.keys(regionData);
    const data = Object.values(regionData);
    
    const centerText = {
        id: 'centerText',
        afterDraw: (chart) => {
            const { ctx } = chart;
            const centerX = chart.width / 2;
            const centerY = chart.height / 2;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 24px Inter';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(totalUsers.toLocaleString(), centerX, centerY - 10);
            ctx.font = 'normal 12px Inter';
            ctx.fillStyle = '#9ca3af';
            ctx.fillText('Total', centerX, centerY + 15);
            ctx.restore();
        }
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#3b82f6', '#1e40af', '#60a5fa', '#93c5fd', '#a78bfa'],
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true 
                }
            }
        },
        plugins: [centerText]
    });
    
    const legendContainer = document.getElementById('regionChartLegend');
    legendContainer.innerHTML = '';
    const colors = ['bg-blue-500', 'bg-blue-800', 'bg-blue-400', 'bg-blue-300', 'bg-purple-400'];

    labels.forEach((label, index) => {
        const percentage = ((regionData[label] / totalUsers) * 100).toFixed(0);
        const color = colors[index % colors.length];
        
        const legendItem = `
            <div class="flex items-center justify-between text-sm">
                <div class="flex items-center">
                    <span class="w-3 h-3 rounded-full ${color} mr-2"></span>
                    <span class="text-gray-300">${label}</span>
                </div>
                <div class="flex items-center">
                    <div class="w-20 h-2 bg-gray-700 rounded-full mr-2">
                        <div class="${color} h-2 rounded-full" style="width: ${percentage}%;"></div>
                    </div>
                    <span class="font-semibold text-gray-300">${percentage}%</span>
                </div>
            </div>
        `;
        legendContainer.innerHTML += legendItem;
    });
}
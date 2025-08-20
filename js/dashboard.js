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

    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        let usersArray = [];
        if (snapshot.exists()) {
            usersArray = Object.values(snapshot.val());
        } else {
            console.log("No users found in the database.");
            return;
        }

        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const registrationsToday = usersArray.filter(user => user.otherInfo?.joinDate === todayString).length;
        
        const totalUsersStat = document.getElementById('total-users-stat');
        const registrationsTodayStat = document.getElementById('registrations-today-stat');

        if (totalUsersStat) {
            totalUsersStat.textContent = usersArray.length.toLocaleString();
        }
        if (registrationsTodayStat) {
            registrationsTodayStat.textContent = `${registrationsToday.toLocaleString()} today`;
        }

        const dailyRegistrations = usersArray.reduce((acc, user) => {
            const date = user.otherInfo?.joinDate;
            if (date) {
                acc[date] = (acc[date] || 0) + 1;
            }
            return acc;
        }, {});

        const registrationLabels = [];
        const registrationData = [];
        
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            const formattedLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            registrationLabels.push(formattedLabel);
            registrationData.push(dailyRegistrations[dateString] || 0);
        }
        
        createInteractiveChart('registrationsChart', registrationLabels, registrationData, '#22c55e');
        initializeSessionsChart(usersArray);

        const regionCounts = usersArray.reduce((acc, user) => {
            const region = user.address?.region || 'Unknown';
            acc[region] = (acc[region] || 0) + 1;
            return acc;
        }, {});

        createRegionChart(regionCounts, usersArray.length);
        initializeMonthlySessionsChart(usersArray);

    } catch (error) {
        console.error("Failed to fetch user data for charts:", error);
    }
});


// --- Chart Creation Functions ---

function createInteractiveChart(canvasId, labels, data, color) {
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
                            return tooltipItems[0].label;
                        },
                        label: function(tooltipItem) {
                            return `Registrations: ${tooltipItem.raw}`;
                        }
                    }
                }
            },
            scales: { x: { display: false }, y: { display: false } }
        }
    });
}

// Sessions Chart
function initializeSessionsChart(usersArray) {
    const sessionsCanvas = document.getElementById('sessionsChart');
    if (!sessionsCanvas) return;

    const directCounts = {};
    const referralCounts = {};
    usersArray.forEach(user => {
        const date = user.otherInfo?.joinDate;
        if (!date) return;

        // --- THIS IS THE FIX ---
        // Changed from referrerName to referrerId
        if (user.otherInfo.referrerId && user.otherInfo.referrerId.trim() !== '') {
            referralCounts[date] = (referralCounts[date] || 0) + 1;
        } else {
            directCounts[date] = (directCounts[date] || 0) + 1;
        }
    });

    const labels = [];
    const directData = [];
    const referralData = [];
    const bucketSize = 5;
    const numberOfBuckets = 6;

    const today = new Date();
    for (let i = numberOfBuckets - 1; i >= 0; i--) {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (i * bucketSize));
        const formattedLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labels.push(formattedLabel);

        let directSum = 0;
        let referralSum = 0;

        for (let j = 0; j < bucketSize; j++) {
            const dayToSum = new Date(startDate);
            dayToSum.setDate(startDate.getDate() + j);
            const year = dayToSum.getFullYear();
            const month = String(dayToSum.getMonth() + 1).padStart(2, '0');
            const day = String(dayToSum.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            directSum += (directCounts[dateString] || 0);
            referralSum += (referralCounts[dateString] || 0);
        }

        directData.push(directSum);
        referralData.push(referralSum);
    }

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
                    ticks: { color: '#9ca3af', precision: 0 }
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

// Monthly Sessions Chart
function initializeMonthlySessionsChart(usersArray) {
    const pageViewsCanvas = document.getElementById('pageViewsChart');
    if (!pageViewsCanvas) return;

    const monthlyData = usersArray.reduce((acc, user) => {
        const joinDate = user.otherInfo?.joinDate;
        if (joinDate) {
            const date = new Date(joinDate);
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!acc[yearMonth]) {
                acc[yearMonth] = { direct: 0, referral: 0 };
            }
            // --- THIS IS THE FIX ---
            // Changed from referrerName to referrerId
            if (user.otherInfo.referrerId && user.otherInfo.referrerId.trim() !== '') {
                acc[yearMonth].referral += 1;
            } else {
                acc[yearMonth].direct += 1;
            }
        }
        return acc;
    }, {});

    const sortedMonths = Object.keys(monthlyData).sort();
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
    if (!legendContainer) return;
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

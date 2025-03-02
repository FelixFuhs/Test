// dashboard.js

/**
 * Dashboard Module - Analyzes workout data and displays statistics and charts
 */

import {
    loadUserExercises,
    loadWorkoutData,
    getWeekKey
} from './data.js';

let workoutHistory = [];
let userExercises = {};
let workoutData = {};

/**
 * Initialize the dashboard
 */
export function initDashboard() {
    console.log("Initializing dashboard...");
    
    loadUserExercises();
    loadWorkoutData();
    loadWorkoutHistory();
    
    renderStatsSummary();
    initCharts();
    renderMuscleProgress();
    
    setupEventListeners();
}

/**
 * Load workout history from localStorage
 */
function loadWorkoutHistory() {
    const stored = localStorage.getItem('workoutHistory');
    workoutHistory = stored ? JSON.parse(stored) : [];
    console.log(`Loaded ${workoutHistory.length} workout sessions`);
}

/**
 * Get statistics summary from workout history
 */
function getStatsSummary() {
    const now = new Date();
    
    // Start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Start of previous month
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Filter workouts for current and previous month
    const currentMonthWorkouts = workoutHistory.filter(workout => 
        new Date(workout.startTime) >= monthStart
    );
    
    const prevMonthWorkouts = workoutHistory.filter(workout => 
        new Date(workout.startTime) >= prevMonthStart && 
        new Date(workout.startTime) < monthStart
    );
    
    // Calculate statistics
    const workoutsThisMonth = currentMonthWorkouts.length;
    const workoutsPrevMonth = prevMonthWorkouts.length;
    const workoutChange = workoutsPrevMonth > 0 
        ? Math.round((workoutsThisMonth - workoutsPrevMonth) / workoutsPrevMonth * 100) 
        : 100;
    
    // Calculate training time
    let trainingTimeThisMonth = 0;
    let trainingTimePrevMonth = 0;
    
    currentMonthWorkouts.forEach(workout => {
        if (workout.startTime && workout.endTime) {
            const start = new Date(workout.startTime);
            const end = new Date(workout.endTime);
            trainingTimeThisMonth += (end - start) / (1000 * 60 * 60); // in hours
        }
    });
    
    prevMonthWorkouts.forEach(workout => {
        if (workout.startTime && workout.endTime) {
            const start = new Date(workout.startTime);
            const end = new Date(workout.endTime);
            trainingTimePrevMonth += (end - start) / (1000 * 60 * 60); // in hours
        }
    });
    
    const timeChange = trainingTimePrevMonth > 0 
        ? (trainingTimeThisMonth - trainingTimePrevMonth).toFixed(1) 
        : trainingTimeThisMonth.toFixed(1);
    
    // Calculate total volume
    let volumeThisMonth = 0;
    let volumePrevMonth = 0;
    
    currentMonthWorkouts.forEach(workout => {
        volumeThisMonth += workout.totalVolume || 0;
    });
    
    prevMonthWorkouts.forEach(workout => {
        volumePrevMonth += workout.totalVolume || 0;
    });
    
    const volumeChange = volumePrevMonth > 0 
        ? Math.round((volumeThisMonth - volumePrevMonth) / volumePrevMonth * 100) 
        : 100;
    
    // Calculate active streak
    let streak = 0;
    let lastWorkoutDate = null;
    
    // Sort workouts by date, most recent first
    const sortedWorkouts = [...workoutHistory].sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
    );
    
    // Check for consecutive days
    if (sortedWorkouts.length > 0) {
        lastWorkoutDate = new Date(sortedWorkouts[0].startTime);
        let currentDate = new Date(lastWorkoutDate);
        currentDate.setHours(0, 0, 0, 0);
        
        // Check if the most recent workout is today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (currentDate.getTime() === today.getTime()) {
            streak = 1;
            
            for (let i = 1; i < sortedWorkouts.length; i++) {
                const prevDate = new Date(sortedWorkouts[i].startTime);
                prevDate.setHours(0, 0, 0, 0);
                
                // Calculate days between workouts
                const daysBetween = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
                
                if (daysBetween === 1) {
                    streak++;
                    currentDate = new Date(prevDate);
                } else {
                    break;
                }
            }
        } else {
            // If most recent workout isn't today, streak is 0
            streak = 0;
        }
    }
    
    return {
        workoutsThisMonth,
        workoutChange,
        trainingTimeThisMonth: trainingTimeThisMonth.toFixed(1),
        timeChange,
        volumeThisMonth: Math.round(volumeThisMonth),
        volumeChange,
        streak
    };
}

/**
 * Render statistics summary to the dashboard
 */
function renderStatsSummary() {
    const stats = getStatsSummary();
    
    document.getElementById('workouts-value').textContent = stats.workoutsThisMonth;
    document.getElementById('workouts-trend').innerHTML = stats.workoutChange >= 0 
        ? `<i class="fas fa-arrow-up"></i> ${Math.abs(stats.workoutChange)}% increase`
        : `<i class="fas fa-arrow-down"></i> ${Math.abs(stats.workoutChange)}% decrease`;
    document.getElementById('workouts-trend').className = `stat-trend ${stats.workoutChange >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('time-value').textContent = `${stats.trainingTimeThisMonth} hrs`;
    document.getElementById('time-trend').innerHTML = stats.timeChange >= 0 
        ? `<i class="fas fa-arrow-up"></i> ${Math.abs(stats.timeChange)} hrs more`
        : `<i class="fas fa-arrow-down"></i> ${Math.abs(stats.timeChange)} hrs less`;
    document.getElementById('time-trend').className = `stat-trend ${stats.timeChange >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('volume-value').textContent = stats.volumeThisMonth.toLocaleString();
    document.getElementById('volume-trend').innerHTML = stats.volumeChange >= 0 
        ? `<i class="fas fa-arrow-up"></i> ${Math.abs(stats.volumeChange)}% increase`
        : `<i class="fas fa-arrow-down"></i> ${Math.abs(stats.volumeChange)}% decrease`;
    document.getElementById('volume-trend').className = `stat-trend ${stats.volumeChange >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('streak-value').textContent = stats.streak;
}

/**
 * Initialize charts using Chart.js
 */
function initCharts() {
    // Volume Progression Chart
    const volumeCtx = document.getElementById('volume-chart').getContext('2d');
    const volumeData = getVolumeProgressionData('month');
    
    const volumeChart = new Chart(volumeCtx, {
        type: 'bar',
        data: {
            labels: volumeData.labels,
            datasets: [{
                label: 'Weekly Volume (kg)',
                data: volumeData.data,
                backgroundColor: 'rgba(42, 157, 143, 0.6)',
                borderColor: 'rgba(42, 157, 143, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Volume (kg)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Volume: ${context.raw.toLocaleString()} kg`;
                        }
                    }
                }
            }
        }
    });
    
    // Store chart instance for later updates
    window.volumeChart = volumeChart;
    
    // Muscle Balance Chart
    const muscleCtx = document.getElementById('muscle-chart').getContext('2d');
    const muscleData = getMuscleBalanceData();
    
    const muscleChart = new Chart(muscleCtx, {
        type: 'polarArea',
        data: {
            labels: muscleData.labels,
            datasets: [{
                data: muscleData.data,
                backgroundColor: [
                    'rgba(42, 157, 143, 0.6)',
                    'rgba(231, 111, 81, 0.6)',
                    'rgba(38, 70, 83, 0.6)',
                    'rgba(233, 196, 106, 0.6)',
                    'rgba(244, 162, 97, 0.6)',
                    'rgba(56, 176, 0, 0.6)'
                ],
                borderColor: [
                    'rgba(42, 157, 143, 1)',
                    'rgba(231, 111, 81, 1)',
                    'rgba(38, 70, 83, 1)',
                    'rgba(233, 196, 106, 1)',
                    'rgba(244, 162, 97, 1)',
                    'rgba(56, 176, 0, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw} sets/week`;
                        }
                    }
                }
            }
        }
    });
    
    // Store chart instance for later updates
    window.muscleChart = muscleChart;
}

/**
 * Get data for volume progression chart
 * @param {string} timeframe - 'week', 'month', or 'year'
 */
function getVolumeProgressionData(timeframe) {
    const sortedWorkouts = [...workoutHistory].sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
    );
    
    const labels = [];
    const data = [];
    
    if (timeframe === 'week') {
        // Daily data for one week
        const weekData = {};
        const today = new Date();
        
        // Initialize the last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            weekData[dateStr] = 0;
            labels.push(date.toLocaleDateString(undefined, { weekday: 'short' }));
        }
        
        // Populate data
        sortedWorkouts.forEach(workout => {
            const date = new Date(workout.startTime).toISOString().split('T')[0];
            if (weekData[date] !== undefined) {
                weekData[date] += workout.totalVolume || 0;
            }
        });
        
        // Convert to array
        data.push(...Object.values(weekData));
    } 
    else if (timeframe === 'month') {
        // Weekly data for one month
        const monthData = {};
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Calculate week ranges for the current month
        let currentWeekStart = new Date(monthStart);
        while (currentWeekStart <= today) {
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const weekKey = `Week ${Math.floor((currentWeekStart.getDate() - 1) / 7) + 1}`;
            monthData[weekKey] = 0;
            labels.push(weekKey);
            
            sortedWorkouts.forEach(workout => {
                const workoutDate = new Date(workout.startTime);
                if (workoutDate >= currentWeekStart && workoutDate <= weekEnd) {
                    monthData[weekKey] += workout.totalVolume || 0;
                }
            });
            
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }
        
        // Convert to array
        data.push(...Object.values(monthData));
    } 
    else if (timeframe === 'year') {
        // Monthly data for one year
        const yearData = {};
        const today = new Date();
        
        // Initialize the last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString(undefined, { month: 'short' });
            yearData[monthKey] = 0;
            labels.push(monthKey);
        }
        
        // Populate data
        sortedWorkouts.forEach(workout => {
            const date = new Date(workout.startTime);
            const monthKey = date.toLocaleDateString(undefined, { month: 'short' });
            if (yearData[monthKey] !== undefined) {
                yearData[monthKey] += workout.totalVolume || 0;
            }
        });
        
        // Convert to array
        data.push(...Object.values(yearData));
    }
    
    return { labels, data };
}

/**
 * Get data for muscle balance chart
 */
function getMuscleBalanceData() {
    // Analyze the current week's volume per muscle group
    const weekKey = getWeekKey();
    const weekData = workoutData[weekKey] || {};
    
    // Define muscle categories
    const muscleCategories = {
        'Chest': ['Chest', 'Front Delts', 'Serratus Anterior'],
        'Back': ['Lats', 'Traps', 'Rhomboids', 'Lower Back'],
        'Shoulders': ['Front Delts', 'Side Delts', 'Rear Delts'],
        'Arms': ['Biceps', 'Triceps', 'Forearms', 'Brachialis'],
        'Legs': ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Hip Flexors', 'Adductors'],
        'Core': ['Abs', 'Obliques', 'Lower Back', 'Core Stabilizers']
    };
    
    // Initialize volume counters
    const muscleVolume = {
        'Chest': 0,
        'Back': 0,
        'Shoulders': 0,
        'Arms': 0,
        'Legs': 0,
        'Core': 0
    };
    
    // Count sets per muscle group for the week
    Object.values(weekData).forEach(dayExercises => {
        dayExercises.forEach(exercise => {
            // Find the exercise in userExercises
            let exerciseData = null;
            
            for (const category in userExercises) {
                const found = userExercises[category].find(ex => ex.name === exercise.exercise);
                if (found) {
                    exerciseData = found;
                    break;
                }
            }
            
            if (exerciseData) {
                // Count direct muscles (full sets)
                const directMuscles = exerciseData.directMuscles || [];
                directMuscles.forEach(muscle => {
                    // Find which category this muscle belongs to
                    for (const category in muscleCategories) {
                        if (muscleCategories[category].includes(muscle)) {
                            muscleVolume[category] += exercise.sets;
                        }
                    }
                });
                
                // Count indirect muscles (half sets)
                const indirectMuscles = exerciseData.indirectMuscles || [];
                indirectMuscles.forEach(muscle => {
                    // Find which category this muscle belongs to
                    for (const category in muscleCategories) {
                        if (muscleCategories[category].includes(muscle)) {
                            muscleVolume[category] += exercise.sets * 0.5;
                        }
                    }
                });
            }
        });
    });
    
    // Round values
    for (const muscle in muscleVolume) {
        muscleVolume[muscle] = Math.round(muscleVolume[muscle]);
    }
    
    return {
        labels: Object.keys(muscleVolume),
        data: Object.values(muscleVolume)
    };
}

/**
 * Render muscle group progress cards
 */
function renderMuscleProgress() {
    const muscleProgress = getMuscleProgress();
    const container = document.getElementById('muscle-progress-container');
    
    // Clear existing cards
    container.innerHTML = '';
    
    // Create cards for each muscle group
    Object.entries(muscleProgress).forEach(([muscle, data]) => {
        const card = document.createElement('div');
        card.className = 'muscle-card';
        
        // Icon mapping
        const iconMap = {
            'Chest': 'fa-chevron-up',
            'Back': 'fa-chevron-down',
            'Shoulders': 'fa-grip-lines',
            'Arms': 'fa-ellipsis-h',
            'Legs': 'fa-grip-vertical',
            'Core': 'fa-circle'
        };
        
        const icon = iconMap[muscle] || 'fa-dumbbell';
        
        card.innerHTML = `
            <div class="muscle-title">
                <div class="muscle-icon"><i class="fas ${icon}"></i></div>
                ${muscle}
            </div>
            <div class="muscle-stats">
                <div class="muscle-stat">
                    <div class="muscle-stat-label">Sets/Week</div>
                    <div class="muscle-stat-value">${data.setsPerWeek}</div>
                </div>
                <div class="muscle-stat">
                    <div class="muscle-stat-label">${data.primaryExercise}</div>
                    <div class="muscle-stat-value">${data.maxValue}</div>
                </div>
            </div>
            <div class="muscle-progress-bar">
                <div class="muscle-progress-value" style="width: ${data.progress}%;"></div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

/**
 * Calculate muscle group progress data
 */
function getMuscleProgress() {
    // This is a simplified version - in a real implementation, 
    // you would analyze workout history for actual progress
    return {
        'Chest': {
            setsPerWeek: 15,
            primaryExercise: 'Bench 1RM',
            maxValue: '95 kg',
            progress: 65
        },
        'Back': {
            setsPerWeek: 18,
            primaryExercise: 'Pull-up Max',
            maxValue: '12 reps',
            progress: 78
        },
        'Shoulders': {
            setsPerWeek: 12,
            primaryExercise: 'OHP 1RM',
            maxValue: '65 kg',
            progress: 55
        },
        'Arms': {
            setsPerWeek: 14,
            primaryExercise: 'Curl 1RM',
            maxValue: '22 kg',
            progress: 62
        },
        'Legs': {
            setsPerWeek: 16,
            primaryExercise: 'Squat 1RM',
            maxValue: '120 kg',
            progress: 70
        },
        'Core': {
            setsPerWeek: 10,
            primaryExercise: 'Plank Max',
            maxValue: '3:15 min',
            progress: 45
        }
    };
}

/**
 * Set up event listeners for the dashboard
 */
function setupEventListeners() {
    // Chart filters
    document.querySelectorAll('.chart-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            // Remove active class from all filters in the same group
            this.parentElement.querySelectorAll('.chart-filter').forEach(f => {
                f.classList.remove('active');
            });
            
            // Add active class to the clicked filter
            this.classList.add('active');
            
            // Update chart data based on selected timeframe
            const timeframe = this.textContent.trim().toLowerCase();
            updateVolumeChart(timeframe);
        });
    });
}

/**
 * Update volume progression chart with new timeframe
 * @param {string} timeframe - 'week', 'month', or 'year'
 */
function updateVolumeChart(timeframe) {
    if (window.volumeChart) {
        const chartData = getVolumeProgressionData(timeframe);
        
        window.volumeChart.data.labels = chartData.labels;
        window.volumeChart.data.datasets[0].data = chartData.data;
        window.volumeChart.update();
        
        console.log(`Updated volume chart to ${timeframe} view`);
    }
}

// Export the initialization function
export { initDashboard };
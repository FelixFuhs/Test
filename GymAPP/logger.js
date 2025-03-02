// logger.js - Training Log module

import {
    loadUserExercises,
    userExercises,
    workoutData,
    loadWorkoutData,
    saveWorkoutData,
    currentDate,
    getWeekKey,
    changeWeek
} from './data.js';

import {
    calculate1RM,
    getRecommendedWeight,
    suggestNextSetWeight,
    getPreviousBestPerformance,
    updatePerformanceHistory
} from './training-utils.js';

// Workout logging variables
let activeWorkout = null;
let workoutTimer = null;
let workoutStartTime = null;
let currentExerciseIndex = 0;
let restTimer = null;

// Initialize the logger
export function initLogger() {
    console.log("Initializing training logger...");
    loadUserExercises();
    loadWorkoutData();
    loadPerformanceHistory();

    updateDayViewHeader();      // Show current date/day
    populatePlanSelection();    // Populate the "Current Plan" dropdown
    renderDayExercises();       // Render today's exercises in the day-exercises section

    setupLoggerEventListeners();
}

// -------------------------
// New functions for Day View UI
// -------------------------

// Update the header with the current date and day
function updateDayViewHeader() {
    const today = new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const dayOptions = { weekday: 'long' };

    const dateStr = today.toLocaleDateString(undefined, dateOptions); 
    const dayStr = today.toLocaleDateString(undefined, dayOptions);

    document.getElementById('current-date').textContent = `Today: ${dateStr}`;
    document.getElementById('current-day').textContent = dayStr;
}

// Populate the "Current Plan" dropdown
function populatePlanSelection() {
    const planSelect = document.getElementById('current-plan-select');
    planSelect.innerHTML = '<option value="">Select a plan</option>';

    const workoutPlans = loadWorkoutPlans();
    Object.values(workoutPlans).forEach(plan => {
        const option = document.createElement('option');
        option.value = plan.id;
        option.textContent = plan.name;
        planSelect.appendChild(option);
    });
}

// Render exercises for the current day into the "day-exercises" container
function renderDayExercises() {
    const weekKey = getWeekKey();
    const today = new Date();
    const dayOptions = { weekday: 'long' };
    const todayName = today.toLocaleDateString(undefined, dayOptions).toLowerCase();

    const exercisesContainer = document.getElementById('day-exercises');
    exercisesContainer.innerHTML = '';

    if (workoutData[weekKey] && workoutData[weekKey][todayName]) {
        workoutData[weekKey][todayName].forEach((exerciseData) => {
            const exerciseItem = document.createElement('div');
            exerciseItem.classList.add('exercise-item');

            // Header with exercise name
            const header = document.createElement('div');
            header.classList.add('exercise-header');
            const name = document.createElement('span');
            name.textContent = exerciseData.exercise;
            header.appendChild(name);
            exerciseItem.appendChild(header);

            // Details: sets, reps, RIR
            const details = document.createElement('div');
            details.classList.add('exercise-details');
            details.innerHTML = `
                <div><strong>Sets:</strong> ${exerciseData.sets}</div>
                <div><strong>Reps:</strong> ${exerciseData.repGoal}</div>
                <div><strong>RIR:</strong> ${exerciseData.rirGoal}</div>
            `;
            exerciseItem.appendChild(details);

            exercisesContainer.appendChild(exerciseItem);
        });
    } else {
        exercisesContainer.innerHTML = '<p>No exercises planned for today.</p>';
    }
}

// -------------------------
// Existing code (adjusted to remove openWorkoutModal references)
// -------------------------

// Load workout plans
function loadWorkoutPlans() {
    const stored = localStorage.getItem('workoutPlans');
    return stored ? JSON.parse(stored) : {};
}

// Load performance history
function loadPerformanceHistory() {
    const stored = localStorage.getItem('performanceHistory');
    return stored ? JSON.parse(stored) : {};
}

// Save performance history
function savePerformanceHistory(history) {
    localStorage.setItem('performanceHistory', JSON.stringify(history));
}

// Render workouts for the current week (if you still use the old weekly calendar)
function renderWorkouts() {
    const weekKey = getWeekKey();

    document.querySelectorAll('.day').forEach(dayElement => {
        const day = dayElement.dataset.day;
        const exercisesList = dayElement.querySelector('.exercises-list');
        exercisesList.innerHTML = '';

        if (workoutData[weekKey] && workoutData[weekKey][day]) {
            workoutData[weekKey][day].forEach((exerciseData) => {
                const exerciseItem = document.createElement('div');
                exerciseItem.classList.add('exercise-item');

                // Exercise header
                const header = document.createElement('div');
                header.classList.add('exercise-header');
                const name = document.createElement('span');
                name.textContent = exerciseData.exercise;
                header.appendChild(name);
                exerciseItem.appendChild(header);

                // Exercise details
                const details = document.createElement('div');
                details.classList.add('exercise-details');
                details.innerHTML = `
                    <div><strong>Sets:</strong> ${exerciseData.sets}</div>
                    <div><strong>Reps:</strong> ${exerciseData.repGoal}</div>
                    <div><strong>RIR:</strong> ${exerciseData.rirGoal}</div>
                `;
                exerciseItem.appendChild(details);

                // Sets summary
                const setsSummary = document.createElement('div');
                setsSummary.classList.add('sets-summary');
                const completedSets = exerciseData.actualReps
                    ? exerciseData.actualReps.filter(rep => rep !== '').length
                    : 0;
                setsSummary.innerHTML = `
                    <div class="progress-bar">
                        <div class="progress" style="width: ${(completedSets / exerciseData.sets) * 100}%"></div>
                    </div>
                    <div class="sets-count">${completedSets}/${exerciseData.sets} sets</div>
                `;
                exerciseItem.appendChild(setsSummary);

                exercisesList.appendChild(exerciseItem);
            });
        }
    });
}

// Setup event listeners
function setupLoggerEventListeners() {
    // If you still have week nav buttons in the UI:
    document.getElementById('prev-week')?.addEventListener('click', () => {
        changeWeek(-7);
        updateDayViewHeader();
        renderDayExercises();
    });

    document.getElementById('next-week')?.addEventListener('click', () => {
        changeWeek(7);
        updateDayViewHeader();
        renderDayExercises();
    });

    // The old "Start Workout" button in the nav (optional):
    // If you don't want it, you can remove or comment this out entirely
    // Currently, it does nothing, or you can make it do something else if desired
    document.getElementById('start-workout')?.addEventListener('click', () => {
        console.log("The top nav 'Start Workout' button was clicked. No action is defined.");
    });

    // The old day-based buttons from the old calendar approach (optional):
    document.querySelectorAll('.start-day-workout').forEach(button => {
        button.addEventListener('click', () => {
            console.log("Old calendar button clicked. No action is defined here anymore.");
        });
    });

    // NEW: "Start Today's Workout" from the day-based UI
    document.getElementById('start-day-workout')?.addEventListener('click', startWorkoutForDay);

    // Workout modal controls (only relevant if you still open it somewhere else)
    document.getElementById('close-workout-modal')?.addEventListener('click', () => {
        document.getElementById('workout-modal').classList.remove('show');
    });

    document.getElementById('start-workout-btn')?.addEventListener('click', startWorkout);

    // Active workout controls
    document.getElementById('finish-workout')?.addEventListener('click', finishWorkout);
    document.getElementById('prev-exercise')?.addEventListener('click', () => navigateExercise(-1));
    document.getElementById('next-exercise')?.addEventListener('click', () => navigateExercise(1));

    // Workout complete modal
    document.getElementById('save-workout-btn')?.addEventListener('click', saveCompletedWorkout);
    document.getElementById('discard-workout-btn')?.addEventListener('click', discardWorkout);

    // If you still have the old plan/day dropdown in a modal:
    document.getElementById('workout-plan-select')?.addEventListener('change', () => {
        const planSelect = document.getElementById('workout-plan-select');
        const daySelect = document.getElementById('workout-day-select');

        if (planSelect.value) {
            const workoutPlans = loadWorkoutPlans();
            const selectedPlan = workoutPlans[planSelect.value];
            if (selectedPlan) {
                const trainingDays = Object.keys(selectedPlan.days)
                    .filter(day => selectedPlan.days[day].type === 'training');
                if (trainingDays.length > 0) {
                    daySelect.value = trainingDays[0];
                }
            }
        }
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        const workoutModal = document.getElementById('workout-modal');
        const completeModal = document.getElementById('workout-complete-modal');
        
        if (e.target === workoutModal) {
            workoutModal.classList.remove('show');
        }
        if (e.target === completeModal) {
            completeModal.classList.remove('show');
        }
    });
}

// -------------------------
// "Start Today's Workout" approach
// -------------------------
function startWorkoutForDay() {
    const planSelect = document.getElementById('current-plan-select');
    const selectedPlan = planSelect.value;

    const today = new Date();
    const dayOptions = { weekday: 'long' };
    const dayName = today.toLocaleDateString(undefined, dayOptions).toLowerCase();

    // Close any open modals
    document.getElementById('workout-modal')?.classList.remove('show');

    // Initialize active workout using today's day and selected plan
    activeWorkout = {
        day: dayName,
        plan: selectedPlan,
        exercises: [],
        startTime: new Date().toISOString(),
        endTime: null,
        totalVolume: 0,
        notes: ''
    };

    if (selectedPlan) {
        const workoutPlans = loadWorkoutPlans();
        const plan = workoutPlans[selectedPlan];
        if (plan && plan.days[dayName] && plan.days[dayName].type === 'training') {
            // Spawn exercises from the selected plan
            plan.days[dayName].exercises.forEach(planExercise => {
                activeWorkout.exercises.push({
                    name: planExercise.name,
                    category: planExercise.category,
                    directMuscles: planExercise.directMuscles,
                    indirectMuscles: planExercise.indirectMuscles,
                    targetSets: planExercise.sets,
                    repRange: planExercise.repRange,
                    rirRange: planExercise.rirRange,
                    rest: planExercise.rest || 90,
                    notes: planExercise.notes,
                    sets: [],
                    completed: false
                });
            });
        }
    } else {
        // If no plan is selected, try loading from current week's data for today
        const weekKey = getWeekKey();
        if (workoutData[weekKey] && workoutData[weekKey][dayName]) {
            workoutData[weekKey][dayName].forEach(exerciseData => {
                activeWorkout.exercises.push({
                    name: exerciseData.exercise,
                    targetSets: exerciseData.sets,
                    repRange: exerciseData.repGoal,
                    rirRange: exerciseData.rirGoal,
                    rest: 90,
                    sets: [],
                    completed: false
                });
            });
        }
    }

    if (activeWorkout.exercises.length === 0) {
        console.log("No exercises found for today.");
    }

    // Show the active workout modal
    document.getElementById('active-workout-modal').classList.add('show');

    // Start workout timer
    workoutStartTime = new Date();
    startWorkoutTimer();

    // Reset current exercise index
    currentExerciseIndex = 0;
    renderActiveWorkout();
}

// A fallback "startWorkout" if you still want the old plan/day modal approach
function startWorkout() {
    // If you don't need this, you can remove it or leave it for the old approach
    console.log("startWorkout() was called from the old plan/day modal. This function is optional now.");
}

// -------------------------
// Active Workout / Logging
// -------------------------
function startWorkoutTimer() {
    const timerDisplay = document.getElementById('workout-timer-display');
    if (workoutTimer) {
        clearInterval(workoutTimer);
    }
    workoutTimer = setInterval(() => {
        const now = new Date();
        const elapsed = now - workoutStartTime;
        const hours = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
        timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }, 1000);
}

function renderActiveWorkout() {
    if (!activeWorkout || activeWorkout.exercises.length === 0) return;
    const title = document.getElementById('active-workout-title');
    title.textContent = activeWorkout.plan
        ? `${getWorkoutPlanName(activeWorkout.plan)} - ${getFormattedDay(activeWorkout.day)}`
        : `Workout - ${getFormattedDay(activeWorkout.day)}`;
    renderCurrentExercise();
    renderWorkoutExerciseList();
}

// Render the current exercise
function renderCurrentExercise() {
    if (!activeWorkout || activeWorkout.exercises.length === 0) return;
    const exercise = activeWorkout.exercises[currentExerciseIndex];

    document.getElementById('current-exercise-name').textContent = exercise.name;
    document.getElementById('exercise-position').textContent =
        `${currentExerciseIndex + 1} of ${activeWorkout.exercises.length}`;
    document.getElementById('exercise-target').textContent =
        `${exercise.targetSets} sets, ${exercise.repRange} reps, ${exercise.rirRange} RIR`;

    // Previous best display
    const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    const previousBest = getPreviousBestForDisplay(exercise.name, history);
    document.getElementById('exercise-previous').textContent = previousBest || 'No previous data';

    // Estimated 1RM display with rounding
    const performanceHistory = loadPerformanceHistory();
    const exerciseHistory = performanceHistory[exercise.name] || {};
    const estimated1RMValue = exerciseHistory.estimated1RM;
    const rounded1RM = (typeof estimated1RMValue === 'number')
        ? Math.round(estimated1RMValue)
        : 'N/A';

    document.getElementById('exercise-1rm').textContent =
        (rounded1RM === 'N/A') ? 'N/A' : `${rounded1RM}kg`;

    document.getElementById('current-1rm').textContent =
        (rounded1RM === 'N/A') ? '1RM: N/A' : `1RM: ${rounded1RM}kg`;

    document.getElementById('prev-exercise').disabled = (currentExerciseIndex === 0);
    document.getElementById('next-exercise').disabled = (currentExerciseIndex === activeWorkout.exercises.length - 1);

    renderExerciseSets();
}

function renderExerciseSets() {
    const setsContainer = document.getElementById('sets-container');
    setsContainer.innerHTML = '';

    const exercise = activeWorkout.exercises[currentExerciseIndex];
    if (exercise.sets.length === 0) {
        const performanceHistory = loadPerformanceHistory();
        const exerciseHistory = performanceHistory[exercise.name] || {};
        let initialWeight = 0;
        if (exerciseHistory.estimated1RM) {
            initialWeight = getRecommendedWeight(exercise, exerciseHistory);
        }
        for (let i = 0; i < exercise.targetSets; i++) {
            exercise.sets.push({
                reps: '',
                weight: initialWeight ? initialWeight.toString() : '',
                rir: '',
                completed: false
            });
        }
    }

    exercise.sets.forEach((set, index) => {
        const setElement = document.createElement('div');
        setElement.classList.add('set-row');
        setElement.innerHTML = `
            <div class="set-number">Set ${index + 1}</div>
            <div class="set-inputs">
                <div class="input-group">
                    <label for="weight-${index}">Weight</label>
                    <input type="number" id="weight-${index}" class="weight-input" placeholder="kg"
                           value="${set.weight}" data-set-index="${index}">
                </div>
                <div class="input-group">
                    <label for="reps-${index}">Reps</label>
                    <input type="number" id="reps-${index}" class="reps-input" placeholder="reps"
                           value="${set.reps}" data-set-index="${index}">
                </div>
                <div class="input-group">
                    <label for="rir-${index}">RIR</label>
                    <input type="number" id="rir-${index}" class="rir-input" placeholder="RIR"
                           value="${set.rir}" data-set-index="${index}">
                </div>
            </div>
            <div class="set-actions">
                <button class="complete-set-btn ${set.completed ? 'completed' : ''}" data-set-index="${index}">
                    ${set.completed ? '<i class="fas fa-check"></i> Done' : 'Complete'}
                </button>
            </div>
        `;
        setsContainer.appendChild(setElement);
    });

    if (exercise.rest) {
        const restTimerElement = document.createElement('div');
        restTimerElement.classList.add('rest-timer-container');
        restTimerElement.innerHTML = `
            <div class="rest-timer">
                <div class="rest-timer-display">
                    <span id="rest-time-display">Rest: ${formatRestTime(exercise.rest)}</span>
                </div>
                <button id="start-rest-timer" class="rest-timer-button">
                    <i class="fas fa-stopwatch"></i> Start Rest Timer
                </button>
            </div>
        `;
        setsContainer.appendChild(restTimerElement);
    }

    document.querySelectorAll('.weight-input').forEach(input => {
        input.addEventListener('change', (e) => updateSetField(e, 'weight'));
    });
    document.querySelectorAll('.reps-input').forEach(input => {
        input.addEventListener('change', (e) => updateSetField(e, 'reps'));
    });
    document.querySelectorAll('.rir-input').forEach(input => {
        input.addEventListener('change', (e) => updateSetField(e, 'rir'));
    });
    document.querySelectorAll('.complete-set-btn').forEach(button => {
        button.addEventListener('click', (e) => completeSet(parseInt(e.currentTarget.dataset.setIndex)));
    });

    const startRestTimerBtn = document.getElementById('start-rest-timer');
    if (startRestTimerBtn) {
        startRestTimerBtn.addEventListener('click', startRestTimer);
    }
}

function formatRestTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startRestTimer() {
    const exercise = activeWorkout.exercises[currentExerciseIndex];
    const restTimeDisplay = document.getElementById('rest-time-display');
    const startRestTimerBtn = document.getElementById('start-rest-timer');

    if (restTimer) {
        clearInterval(restTimer);
    }
    let remainingTime = exercise.rest;
    restTimeDisplay.textContent = `Rest: ${formatRestTime(remainingTime)}`;
    startRestTimerBtn.disabled = true;
    startRestTimerBtn.innerHTML = '<i class="fas fa-stopwatch"></i> Resting...';

    restTimer = setInterval(() => {
        remainingTime--;
        if (remainingTime <= 0) {
            clearInterval(restTimer);
            restTimeDisplay.textContent = 'Rest Complete!';
            startRestTimerBtn.disabled = false;
            startRestTimerBtn.innerHTML = '<i class="fas fa-stopwatch"></i> Start Rest Timer';
            playRestCompleteSound();
        } else {
            restTimeDisplay.textContent = `Rest: ${formatRestTime(remainingTime)}`;
        }
    }, 1000);
}

function playRestCompleteSound() {
    try {
        const audio = new Audio('https://soundbible.com/grab.php?id=1599&type=mp3');
        audio.play();
    } catch (error) {
        console.error("Could not play rest timer completion sound:", error);
    }
}

function updateSetField(event, field) {
    const setIndex = parseInt(event.target.dataset.setIndex);
    const exercise = activeWorkout.exercises[currentExerciseIndex];
    exercise.sets[setIndex][field] = event.target.value;
}

// ----------------------
// Finish, Save, Discard, Navigation
// ----------------------
function finishWorkout() {
    if (!activeWorkout) return;
    activeWorkout.endTime = new Date().toISOString();

    if (workoutTimer) {
        clearInterval(workoutTimer);
        workoutTimer = null;
    }
    document.getElementById('active-workout-modal').classList.remove('show');
    document.getElementById('workout-complete-modal').classList.add('show');

    const durationElem = document.getElementById('complete-duration');
    const setsElem = document.getElementById('complete-sets');
    const volumeElem = document.getElementById('complete-volume');

    const startTime = new Date(activeWorkout.startTime);
    const endTime = new Date(activeWorkout.endTime);
    const elapsedMs = endTime - startTime;

    const hours = Math.floor(elapsedMs / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((elapsedMs % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((elapsedMs % 60000) / 1000).toString().padStart(2, '0');
    durationElem.textContent = `${hours}:${minutes}:${seconds}`;

    let totalSets = 0;
    let totalVolume = 0;
    activeWorkout.exercises.forEach(ex => {
        ex.sets.forEach(set => {
            if (set.completed && set.weight && set.reps) {
                totalSets++;
                totalVolume += parseFloat(set.weight) * parseInt(set.reps);
            }
        });
    });
    setsElem.textContent = totalSets;
    volumeElem.textContent = `${totalVolume} kg`;
}

function saveCompletedWorkout() {
    if (!activeWorkout) return;
    const notes = document.getElementById('workout-notes').value;
    activeWorkout.notes = notes;

    let perfHistory = loadPerformanceHistory();
    perfHistory = updatePerformanceHistory(activeWorkout, perfHistory);
    savePerformanceHistory(perfHistory);

    let workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    workoutHistory.push(activeWorkout);
    localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));

    document.getElementById('workout-complete-modal').classList.remove('show');
    activeWorkout = null;

    renderWorkouts();     // If you still want the old weekly calendar updated
    renderDayExercises(); // Update the new day view as well
}

function discardWorkout() {
    document.getElementById('workout-complete-modal').classList.remove('show');
    activeWorkout = null;
    renderWorkouts();
    renderDayExercises();
}

function navigateExercise(direction) {
    if (!activeWorkout || !activeWorkout.exercises) return;
    currentExerciseIndex += direction;
    if (currentExerciseIndex < 0) currentExerciseIndex = 0;
    if (currentExerciseIndex >= activeWorkout.exercises.length) {
        currentExerciseIndex = activeWorkout.exercises.length - 1;
    }
    renderCurrentExercise();
}

function completeSet(setIndex) {
    const exercise = activeWorkout.exercises[currentExerciseIndex];
    if (!exercise || !exercise.sets[setIndex]) return;
    exercise.sets[setIndex].completed = true;
    renderExerciseSets();
}

function getWorkoutPlanName(planId) {
    const workoutPlans = loadWorkoutPlans();
    return workoutPlans[planId] ? workoutPlans[planId].name : 'Custom Workout';
}

function getFormattedDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1);
}

function getPreviousBestForDisplay(exerciseName, workoutHistory) {
    const best = getPreviousBestPerformance(exerciseName, workoutHistory);
    if (!best) return null;
    const dateString = new Date(best.date).toLocaleDateString();
    return `${best.weight}kg × ${best.reps} (${dateString})`;
}

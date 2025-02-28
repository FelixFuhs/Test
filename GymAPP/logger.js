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

// Workout logging variables
let activeWorkout = null;
let workoutTimer = null;
let workoutStartTime = null;
let currentExerciseIndex = 0;

// Load workout plans
function loadWorkoutPlans() {
    const stored = localStorage.getItem('workoutPlans');
    return stored ? JSON.parse(stored) : {};
}

// Initialize the logger
export function initLogger() {
    console.log("Initializing training logger...");
    loadUserExercises();
    loadWorkoutData();
    renderWorkouts();
    setupLoggerEventListeners();
}

// Update week display
function updateWeekDisplay() {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    document.getElementById('current-week').textContent =
        `Week of ${weekStart.toLocaleDateString(undefined, options)}`;
    renderWorkouts();
}

// Render workouts for the current week
function renderWorkouts() {
    const weekKey = getWeekKey();
    document.querySelectorAll('.day').forEach(dayElement => {
        const day = dayElement.dataset.day;
        const exercisesList = dayElement.querySelector('.exercises-list');
        exercisesList.innerHTML = '';

        if (workoutData[weekKey] && workoutData[weekKey][day]) {
            workoutData[weekKey][day].forEach((exerciseData, index) => {
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

                // Count completed sets
                const completedSets = exerciseData.actualReps.filter(rep => rep !== '').length;
                
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
    // Week navigation
    document.getElementById('prev-week').addEventListener('click', () => {
        changeWeek(-7);
        updateWeekDisplay();
    });
    
    document.getElementById('next-week').addEventListener('click', () => {
        changeWeek(7);
        updateWeekDisplay();
    });

    // Start workout buttons
    document.getElementById('start-workout').addEventListener('click', openWorkoutModal);
    
    document.querySelectorAll('.start-day-workout').forEach(button => {
        button.addEventListener('click', () => {
            const day = button.dataset.day;
            openWorkoutModal(day);
        });
    });

    // Workout modal controls
    document.getElementById('close-workout-modal').addEventListener('click', () => {
        document.getElementById('workout-modal').classList.remove('show');
    });
    
    document.getElementById('start-workout-btn').addEventListener('click', startWorkout);

    // Active workout controls
    document.getElementById('finish-workout').addEventListener('click', finishWorkout);
    document.getElementById('prev-exercise').addEventListener('click', () => navigateExercise(-1));
    document.getElementById('next-exercise').addEventListener('click', () => navigateExercise(1));
    document.getElementById('add-set').addEventListener('click', addSetToExercise);

    // Workout complete modal
    document.getElementById('save-workout-btn').addEventListener('click', saveCompletedWorkout);
    document.getElementById('discard-workout-btn').addEventListener('click', discardWorkout);

    // Update plan selection when selecting a day from the dropdown
    document.getElementById('workout-plan-select').addEventListener('change', () => {
        const planSelect = document.getElementById('workout-plan-select');
        const daySelect = document.getElementById('workout-day-select');
        
        // If a plan is selected, update the day options based on plan structure
        if (planSelect.value) {
            const workoutPlans = loadWorkoutPlans();
            const selectedPlan = workoutPlans[planSelect.value];
            
            if (selectedPlan) {
                // Update day options based on training days in the plan
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

// Open the workout modal
function openWorkoutModal(day = null) {
    const modal = document.getElementById('workout-modal');
    const daySelect = document.getElementById('workout-day-select');
    const planSelect = document.getElementById('workout-plan-select');
    
    // Clear previous selections
    planSelect.innerHTML = '<option value="">Select a plan or continue without one</option>';
    
    // Load workout plans
    const workoutPlans = loadWorkoutPlans();
    
    // Add plans to dropdown
    Object.values(workoutPlans).forEach(plan => {
        const option = document.createElement('option');
        option.value = plan.id;
        option.textContent = plan.name;
        planSelect.appendChild(option);
    });
    
    // Set day if provided
    if (day) {
        daySelect.value = day;
    }
    
    modal.classList.add('show');
}

// Start a new workout
function startWorkout() {
    const planSelect = document.getElementById('workout-plan-select');
    const daySelect = document.getElementById('workout-day-select');
    
    const selectedDay = daySelect.value;
    const selectedPlan = planSelect.value;
    
    // Close selection modal
    document.getElementById('workout-modal').classList.remove('show');
    
    // Initialize workout
    activeWorkout = {
        day: selectedDay,
        plan: selectedPlan,
        exercises: [],
        startTime: new Date().toISOString(),
        endTime: null,
        totalVolume: 0,
        notes: ''
    };
    
    // Load exercises from plan if selected
    if (selectedPlan) {
        const workoutPlans = loadWorkoutPlans();
        const plan = workoutPlans[selectedPlan];
        
        if (plan && plan.days[selectedDay] && plan.days[selectedDay].type === 'training') {
            // Convert plan exercises to workout exercises
            plan.days[selectedDay].exercises.forEach(planExercise => {
                activeWorkout.exercises.push({
                    name: planExercise.name,
                    category: planExercise.category,
                    directMuscles: planExercise.directMuscles,
                    indirectMuscles: planExercise.indirectMuscles,
                    targetSets: planExercise.sets,
                    repRange: planExercise.repRange,
                    rirRange: planExercise.rirRange,
                    rest: planExercise.rest,
                    notes: planExercise.notes,
                    sets: [],
                    completed: false
                });
            });
        }
    } else {
        // Load from current week's workout data if available
        const weekKey = getWeekKey();
        if (workoutData[weekKey] && workoutData[weekKey][selectedDay]) {
            workoutData[weekKey][selectedDay].forEach(exerciseData => {
                activeWorkout.exercises.push({
                    name: exerciseData.exercise,
                    targetSets: exerciseData.sets,
                    repRange: exerciseData.repGoal,
                    rirRange: exerciseData.rirGoal,
                    sets: [],
                    completed: false
                });
            });
        }
    }
    
    // If no exercises, allow the user to add them manually
    if (activeWorkout.exercises.length === 0) {
        // You could add a UI to select exercises or simply start with an empty workout
        console.log("No exercises in plan or current data, starting empty workout");
    }
    
    // Show active workout modal
    document.getElementById('active-workout-modal').classList.add('show');
    
    // Start workout timer
    workoutStartTime = new Date();
    startWorkoutTimer();
    
    // Reset current exercise index
    currentExerciseIndex = 0;
    
    // Render the workout
    renderActiveWorkout();
}

// Start workout timer
function startWorkoutTimer() {
    const timerDisplay = document.getElementById('workout-timer-display');
    
    // Clear any existing timer
    if (workoutTimer) {
        clearInterval(workoutTimer);
    }
    
    // Update timer every second
    workoutTimer = setInterval(() => {
        const now = new Date();
        const elapsed = now - workoutStartTime;
        
        // Format time as hh:mm:ss
        const hours = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
        
        timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }, 1000);
}

// Render the active workout
function renderActiveWorkout() {
    if (!activeWorkout || activeWorkout.exercises.length === 0) {
        return;
    }
    
    // Set workout title
    const title = document.getElementById('active-workout-title');
    title.textContent = activeWorkout.plan ? 
        `${getWorkoutPlanName(activeWorkout.plan)} - ${getFormattedDay(activeWorkout.day)}` : 
        `Workout - ${getFormattedDay(activeWorkout.day)}`;
    
    // Render current exercise
    renderCurrentExercise();
    
    // Render exercise list
    renderWorkoutExerciseList();
}

// Render the current exercise
function renderCurrentExercise() {
    if (!activeWorkout || activeWorkout.exercises.length === 0) {
        return;
    }
    
    const exercise = activeWorkout.exercises[currentExerciseIndex];
    
    // Set exercise name
    document.getElementById('current-exercise-name').textContent = exercise.name;
    
    // Set exercise position
    document.getElementById('exercise-position').textContent = 
        `${currentExerciseIndex + 1} of ${activeWorkout.exercises.length}`;
    
    // Set exercise target
    document.getElementById('exercise-target').textContent = 
        `${exercise.targetSets} sets, ${exercise.repRange} reps, ${exercise.rirRange} RIR`;
    
    // Set previous best (if available)
    const previousBest = getPreviousBest(exercise.name);
    document.getElementById('exercise-previous').textContent = previousBest || 'No previous data';
    
    // Enable/disable navigation buttons
    document.getElementById('prev-exercise').disabled = currentExerciseIndex === 0;
    document.getElementById('next-exercise').disabled = currentExerciseIndex === activeWorkout.exercises.length - 1;
    
    // Render sets
    renderExerciseSets();
}

// Render the sets for the current exercise
function renderExerciseSets() {
    const setsContainer = document.getElementById('sets-container');
    setsContainer.innerHTML = '';
    
    const exercise = activeWorkout.exercises[currentExerciseIndex];
    
    // If no sets yet, add the first one
    if (exercise.sets.length === 0) {
        exercise.sets.push({ reps: '', weight: '', rir: '', completed: false });
    }
    
    // Render each set
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
    
    // Add event listeners
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
}

// Update a field in a set
function updateSetField(event, field) {
    const setIndex = parseInt(event.target.dataset.setIndex);
    const exercise = activeWorkout.exercises[currentExerciseIndex];
    
    exercise.sets[setIndex][field] = event.target.value;
}

// Mark a set as completed
function completeSet(setIndex) {
    const exercise = activeWorkout.exercises[currentExerciseIndex];
    const set = exercise.sets[setIndex];
    
    // Toggle completed state
    set.completed = !set.completed;
    
    // If completed and valid data, add a new set if needed
    if (set.completed && set.reps && set.weight) {
        // Check if this is the last set and less than target sets
        if (setIndex === exercise.sets.length - 1 && exercise.sets.length < exercise.targetSets) {
            // Suggest next set weight based on current performance
            const nextWeight = suggestNextWeight(exercise, setIndex);
            
            // Add new set
            exercise.sets.push({ 
                reps: '', 
                weight: nextWeight, 
                rir: '', 
                completed: false 
            });
        }
    }
    
    // Check if all sets are completed
    const allCompleted = exercise.sets.every(s => s.completed);
    exercise.completed = allCompleted;
    
    // Re-render
    renderExerciseSets();
    renderWorkoutExerciseList();
}

// Add a new set to the current exercise
function addSetToExercise() {
    const exercise = activeWorkout.exercises[currentExerciseIndex];
    
    // Get the last set's data for reference
    const lastSet = exercise.sets[exercise.sets.length - 1];
    
    // Add new set, possibly with suggested weight
    const nextWeight = lastSet && lastSet.weight ? lastSet.weight : '';
    
    exercise.sets.push({ 
        reps: '', 
        weight: nextWeight, 
        rir: '', 
        completed: false 
    });
    
    // Re-render
    renderExerciseSets();
}

// Suggest a weight for the next set based on performance
function suggestNextWeight(exercise, currentSetIndex) {
    const currentSet = exercise.sets[currentSetIndex];
    
    // If no valid data, return empty string
    if (!currentSet || !currentSet.weight || !currentSet.reps || !currentSet.rir) {
        return '';
    }
    
    const weight = parseFloat(currentSet.weight);
    const reps = parseInt(currentSet.reps);
    const rir = parseInt(currentSet.rir);
    
    // Get target rep range
    const repRangeParts = exercise.repRange.split('-');
    const targetMinReps = parseInt(repRangeParts[0]);
    const targetMaxReps = parseInt(repRangeParts[1]);
    
    // Get target RIR range
    const rirRangeParts = exercise.rirRange.split('-');
    const targetMinRIR = parseInt(rirRangeParts[0]);
    const targetMaxRIR = parseInt(rirRangeParts[1]);
    
    // Simple algorithm for weight suggestion:
    // - If reps < targetMinReps, decrease weight by 5-10%
    // - If reps > targetMaxReps, increase weight by 5-10%
    // - If RIR < targetMinRIR, decrease weight by 5%
    // - If RIR > targetMaxRIR, increase weight by 5%
    
    let adjustmentFactor = 1.0;
    
    if (reps < targetMinReps) {
        adjustmentFactor -= 0.05; // Decrease by 5%
    } else if (reps > targetMaxReps) {
        adjustmentFactor += 0.05; // Increase by 5%
    }
    
    if (rir < targetMinRIR) {
        adjustmentFactor -= 0.05; // Decrease by 5%
    } else if (rir > targetMaxRIR) {
        adjustmentFactor += 0.05; // Increase by 5%
    }
    
    // Calculate new weight
    const newWeight = Math.round(weight * adjustmentFactor * 2) / 2; // Round to nearest 0.5
    
    return newWeight.toString();
}

// Navigate between exercises
function navigateExercise(direction) {
    const newIndex = currentExerciseIndex + direction;
    
    if (newIndex >= 0 && newIndex < activeWorkout.exercises.length) {
        currentExerciseIndex = newIndex;
        renderCurrentExercise();
    }
}

// Render the list of exercises in the workout
function renderWorkoutExerciseList() {
    const exerciseList = document.getElementById('workout-exercise-list');
    exerciseList.innerHTML = '';
    
    activeWorkout.exercises.forEach((exercise, index) => {
        const exerciseItem = document.createElement('div');
        exerciseItem.classList.add('workout-exercise-item');
        
        if (index === currentExerciseIndex) {
            exerciseItem.classList.add('current');
        }
        
        if (exercise.completed) {
            exerciseItem.classList.add('completed');
        }
        
        // Count completed sets
        const completedSets = exercise.sets.filter(set => set.completed).length;
        
        exerciseItem.innerHTML = `
            <div class="workout-exercise-name">${exercise.name}</div>
            <div class="workout-exercise-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: ${(completedSets / exercise.targetSets) * 100}%"></div>
                </div>
                <div class="sets-count">${completedSets}/${exercise.targetSets}</div>
            </div>
        `;
        
        exerciseItem.addEventListener('click', () => {
            currentExerciseIndex = index;
            renderCurrentExercise();
        });
        
        exerciseList.appendChild(exerciseItem);
    });
}

// Finish the workout
function finishWorkout() {
    // Stop timer
    clearInterval(workoutTimer);
    
    // Set end time
    activeWorkout.endTime = new Date().toISOString();
    
    // Calculate duration
    const duration = new Date(activeWorkout.endTime) - new Date(activeWorkout.startTime);
    const hours = Math.floor(duration / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((duration % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((duration % 60000) / 1000).toString().padStart(2, '0');
    
    // Calculate total volume
    let totalVolume = 0;
    let totalSets = 0;
    
    activeWorkout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
            if (set.completed && set.weight && set.reps) {
                totalVolume += parseFloat(set.weight) * parseInt(set.reps);
                totalSets++;
            }
        });
    });
    
    activeWorkout.totalVolume = totalVolume;
    activeWorkout.totalSets = totalSets;
    
    // Close active workout modal
    document.getElementById('active-workout-modal').classList.remove('show');
    
    // Show completion modal
    const completeModal = document.getElementById('workout-complete-modal');
    
    document.getElementById('complete-duration').textContent = `${hours}:${minutes}:${seconds}`;
    document.getElementById('complete-volume').textContent = `${Math.round(totalVolume).toLocaleString()} kg`;
    document.getElementById('complete-sets').textContent = totalSets.toString();
    
    completeModal.classList.add('show');
}

// Save the completed workout
function saveCompletedWorkout() {
    // Get notes
    activeWorkout.notes = document.getElementById('workout-notes').value;
    
    // Save to workout history
    const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    history.push(activeWorkout);
    localStorage.setItem('workoutHistory', JSON.stringify(history));
    
    // Update current week's data with completed exercises
    const weekKey = getWeekKey();
    if (!workoutData[weekKey]) workoutData[weekKey] = {};
    if (!workoutData[weekKey][activeWorkout.day]) workoutData[weekKey][activeWorkout.day] = [];
    
    // Add or update exercises in workout data
    activeWorkout.exercises.forEach(exercise => {
        // Check if this exercise already exists for the day
        const existingIndex = workoutData[weekKey][activeWorkout.day]
            .findIndex(ex => ex.exercise === exercise.name);
        
        if (existingIndex >= 0) {
            // Update existing exercise
            const existingExercise = workoutData[weekKey][activeWorkout.day][existingIndex];
            
            existingExercise.actualReps = exercise.sets.map(set => set.reps);
            existingExercise.actualRIRs = exercise.sets.map(set => set.rir);
            existingExercise.weights = exercise.sets.map(set => set.weight);
        } else {
            // Add new exercise
            workoutData[weekKey][activeWorkout.day].push({
                exercise: exercise.name,
                sets: exercise.targetSets,
                repGoal: exercise.repRange,
                rirGoal: exercise.rirRange,
                repeating: false,
                actualReps: exercise.sets.map(set => set.reps),
                actualRIRs: exercise.sets.map(set => set.rir),
                weights: exercise.sets.map(set => set.weight)
            });
        }
    });
    
    // Save workout data
    saveWorkoutData();
    
    // Close complete modal
    document.getElementById('workout-complete-modal').classList.remove('show');
    
    // Reset active workout
    activeWorkout = null;
    
    // Update UI
    renderWorkouts();
    
    // Show confirmation
    alert('Workout saved successfully!');
}

// Discard the current workout
function discardWorkout() {
    if (confirm('Are you sure you want to discard this workout? All data will be lost.')) {
        // Close all modals
        document.getElementById('active-workout-modal').classList.remove('show');
        document.getElementById('workout-complete-modal').classList.remove('show');
        
        // Reset active workout
        activeWorkout = null;
        
        // Clear timer
        clearInterval(workoutTimer);
    }
}

// Helper function to get workout plan name
function getWorkoutPlanName(planId) {
    const workoutPlans = loadWorkoutPlans();
    return workoutPlans[planId]?.name || 'Custom Workout';
}

// Helper function to format day name
function getFormattedDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1);
}

// Helper function to get previous best performance
function getPreviousBest(exerciseName) {
    // Load workout history
    const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    
    // Find all instances of this exercise
    const exerciseInstances = [];
    
    history.forEach(workout => {
        workout.exercises.forEach(exercise => {
            if (exercise.name === exerciseName) {
                // Find best set by weight * reps (volume)
                let bestSet = null;
                let bestVolume = 0;
                
                exercise.sets.forEach(set => {
                    if (set.completed && set.weight && set.reps) {
                        const volume = parseFloat(set.weight) * parseInt(set.reps);
                        if (volume > bestVolume) {
                            bestVolume = volume;
                            bestSet = set;
                        }
                    }
                });
                
                if (bestSet) {
                    exerciseInstances.push({
                        date: new Date(workout.startTime),
                        weight: parseFloat(bestSet.weight),
                        reps: parseInt(bestSet.reps),
                        volume: bestVolume
                    });
                }
            }
        });
    });
    
    // If no history, return null
    if (exerciseInstances.length === 0) {
        return null;
    }
    
    // Sort by volume (descending)
    exerciseInstances.sort((a, b) => b.volume - a.volume);
    
    // Format date
    const date = exerciseInstances[0].date;
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
    
    // Return formatted string
    return `${exerciseInstances[0].weight}kg × ${exerciseInstances[0].reps} (${formattedDate})`;
}
// planner.js - Workout Planner module

import {
    loadUserExercises,
    userExercises,
    saveUserExercises
} from './data.js';

// Planner data structures
let workoutPlans = {};
let currentPlan = null;
let currentDay = 'monday';

// Training volume landmarks based on scientific research
// Based on Dr. Mike Israetel's volume landmarks (2019)
const volumeLandmarks = {
    'Chest': { MV: 6, MEV: 10, MAV: 16, MRV: 22, color: '#FF6B6B' },
    'Front Delts': { MV: 4, MEV: 6, MAV: 12, MRV: 20, color: '#4ECDC4' },
    'Side Delts': { MV: 6, MEV: 12, MAV: 20, MRV: 26, color: '#4ECDC4' },
    'Rear Delts': { MV: 6, MEV: 12, MAV: 20, MRV: 26, color: '#4ECDC4' },
    'Lats': { MV: 6, MEV: 12, MAV: 18, MRV: 25, color: '#1A535C' },
    'Traps': { MV: 6, MEV: 10, MAV: 16, MRV: 22, color: '#1A535C' },
    'Rhomboids': { MV: 4, MEV: 8, MAV: 14, MRV: 20, color: '#1A535C' },
    'Lower Back': { MV: 4, MEV: 8, MAV: 14, MRV: 20, color: '#1A535C' },
    'Biceps': { MV: 5, MEV: 8, MAV: 14, MRV: 20, color: '#FFE66D' },
    'Triceps': { MV: 4, MEV: 8, MAV: 14, MRV: 20, color: '#FFE66D' },
    'Forearms': { MV: 4, MEV: 6, MAV: 12, MRV: 16, color: '#FFE66D' },
    'Abs': { MV: 0, MEV: 12, MAV: 16, MRV: 20, color: '#F7FFF7' },
    'Obliques': { MV: 0, MEV: 8, MAV: 14, MRV: 20, color: '#F7FFF7' },
    'Quads': { MV: 6, MEV: 12, MAV: 18, MRV: 22, color: '#6B5B95' },
    'Hamstrings': { MV: 4, MEV: 10, MAV: 16, MRV: 20, color: '#6B5B95' },
    'Glutes': { MV: 4, MEV: 12, MAV: 18, MRV: 24, color: '#6B5B95' },
    'Calves': { MV: 6, MEV: 8, MAV: 16, MRV: 20, color: '#6B5B95' },
    'Hip Flexors': { MV: 0, MEV: 6, MAV: 12, MRV: 16, color: '#6B5B95' },
    'Adductors': { MV: 4, MEV: 6, MAV: 12, MRV: 16, color: '#6B5B95' },
    'Serratus Anterior': { MV: 2, MEV: 6, MAV: 10, MRV: 14, color: '#FF6B6B' },
    'Brachialis': { MV: 4, MEV: 6, MAV: 12, MRV: 16, color: '#FFE66D' },
    'Core Stabilizers': { MV: 0, MEV: 8, MAV: 14, MRV: 20, color: '#F7FFF7' }
};

// Frequency recommendations by muscle group
const frequencyRecommendations = {
    // Large muscles - recover more slowly, typically lower frequency
    'Chest': { min: 2, optimal: 3, max: 4 },
    'Lats': { min: 2, optimal: 2, max: 3 },
    'Quads': { min: 1, optimal: 2, max: 3 },
    'Hamstrings': { min: 1, optimal: 2, max: 3 },
    'Glutes': { min: 2, optimal: 2, max: 3 },
    'Lower Back': { min: 1, optimal: 2, max: 3 },
    
    // Medium muscles
    'Front Delts': { min: 2, optimal: 3, max: 4 },
    'Side Delts': { min: 2, optimal: 3, max: 5 },
    'Rear Delts': { min: 2, optimal: 3, max: 5 },
    'Traps': { min: 1, optimal: 2, max: 4 },
    'Rhomboids': { min: 2, optimal: 2, max: 4 },
    
    // Small muscles - recover faster, benefit from higher frequency
    'Biceps': { min: 2, optimal: 3, max: 5 },
    'Triceps': { min: 2, optimal: 3, max: 5 },
    'Calves': { min: 2, optimal: 3, max: 6 },
    'Forearms': { min: 2, optimal: 3, max: 4 },
    'Abs': { min: 2, optimal: 3, max: 5 },
    'Obliques': { min: 2, optimal: 3, max: 5 },
    
    // Other muscles
    'Hip Flexors': { min: 1, optimal: 2, max: 3 },
    'Adductors': { min: 1, optimal: 2, max: 3 },
    'Serratus Anterior': { min: 1, optimal: 2, max: 3 },
    'Brachialis': { min: 2, optimal: 3, max: 5 },
    'Core Stabilizers': { min: 2, optimal: 3, max: 5 }
};

// Training goal presets
const trainingGoals = {
    hypertrophy: {
        name: "Hypertrophy",
        repRange: "8-12",
        rirRange: "1-3",
        restRange: "60-90",
        frequency: "2-3× per muscle group weekly",
        description: "Optimal for muscle growth",
        volumeFocus: "MAV"
    },
    strength: {
        name: "Strength",
        repRange: "3-6",
        rirRange: "2-4",
        restRange: "180-300",
        frequency: "2-4× per muscle group weekly",
        description: "Optimal for maximal strength",
        volumeFocus: "MEV to lower MAV",
        volumeTarget: 0.7  // Use 70% of MAV for strength
    },
    power: {
        name: "Power",
        repRange: "1-5",
        rirRange: "3-6",
        restRange: "180-300",
        frequency: "3-4× per muscle group weekly",
        description: "Optimal for explosive strength",
        volumeFocus: "MEV",
        volumeTarget: 1.0  // Use 100% of MEV for power
    },
    endurance: {
        name: "Muscular Endurance",
        repRange: "15-30",
        rirRange: "0-2",
        restRange: "30-60",
        frequency: "2-3× per muscle group weekly",
        description: "Optimal for muscular endurance",
        volumeFocus: "MAV to MRV",
        volumeTarget: 0.9  // Use 90% of MRV for endurance
    },
    balanced: {
        name: "Balanced",
        repRange: "6-15",
        rirRange: "1-3",
        restRange: "90-120",
        frequency: "2-3× per muscle group weekly",
        description: "Balanced approach for size and strength",
        volumeFocus: "MAV",
        volumeTarget: 1.0  // Use 100% of MAV for balanced
    }
};

// Current training goal
let currentTrainingGoal = "hypertrophy";

// Maximum RIR to count a set as a "working set"
const WORKING_SET_THRESHOLD = 3; // Sets with RIR ≤ 3 count as full volume

// Storage functions
function loadWorkoutPlans() {
    const stored = localStorage.getItem('workoutPlans');
    workoutPlans = stored ? JSON.parse(stored) : {};
    console.log("Loaded workout plans:", workoutPlans);
}

function saveWorkoutPlans() {
    localStorage.setItem('workoutPlans', JSON.stringify(workoutPlans));
    console.log("Saved workout plans:", workoutPlans);
}

// Initialize the planner
export function initPlanner() {
    console.log("Initializing workout planner...");
    loadUserExercises();
    loadWorkoutPlans();
    renderPlansList();
    setupPlannerEventListeners();
    setupModalHandlers();
    
    // Initialize training goal selector if it exists
    const goalSelector = document.getElementById('training-goal');
    if (goalSelector) {
        for (const key in trainingGoals) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = trainingGoals[key].name;
            goalSelector.appendChild(option);
        }
        
        goalSelector.value = currentTrainingGoal;
        goalSelector.addEventListener('change', (e) => {
            currentTrainingGoal = e.target.value;
            updateVolumeChart();
            
            // Update recommendation displays
            const goal = trainingGoals[currentTrainingGoal];
            document.getElementById('recommended-rep-range').textContent = goal.repRange;
            document.getElementById('recommended-rir-range').textContent = goal.rirRange;
            document.getElementById('recommended-rest-range').textContent = goal.restRange + " seconds";
            document.getElementById('recommended-frequency').textContent = goal.frequency;
        });
        
        // Initialize recommendation displays
        const goal = trainingGoals[currentTrainingGoal];
        if (document.getElementById('recommended-rep-range')) {
            document.getElementById('recommended-rep-range').textContent = goal.repRange;
            document.getElementById('recommended-rir-range').textContent = goal.rirRange;
            document.getElementById('recommended-rest-range').textContent = goal.restRange + " seconds";
            document.getElementById('recommended-frequency').textContent = goal.frequency;
        }
    }
}

// Setup event listeners
function setupPlannerEventListeners() {
    // Create new plan button
    document.getElementById('create-plan').addEventListener('click', createNewPlan);
    
    // Save plans button
    document.getElementById('save-plan').addEventListener('click', () => {
        savePlanDetails();
        saveWorkoutPlans();
        alert('All workout plans saved.');
    });
    
    // Day tabs
    document.querySelectorAll('.week-tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const day = tab.dataset.day;
            switchToDay(day);
        });
    });
    
    // Day type dropdown
    document.getElementById('day-type').addEventListener('change', updateDayType);
    
    // Add exercise to plan button
    document.getElementById('add-exercise-to-plan').addEventListener('click', openPlanExerciseModal);
    
    // Plan name and description input changes
    const planNameInput = document.getElementById('plan-name');
    const planDescriptionInput = document.getElementById('plan-description');
    
    if (planNameInput) {
        planNameInput.addEventListener('input', () => {
            if (currentPlan) {
                workoutPlans[currentPlan].name = planNameInput.value;
                saveWorkoutPlans();
                renderPlansList(); // Update the list to show the new name
            }
        });
    }
    
    if (planDescriptionInput) {
        planDescriptionInput.addEventListener('input', () => {
            if (currentPlan) {
                workoutPlans[currentPlan].description = planDescriptionInput.value;
                saveWorkoutPlans();
                renderPlansList(); // Update the list to show the new description
            }
        });
    }
}

// Setup modal handlers
function setupModalHandlers() {
    const planExerciseModal = document.getElementById('plan-exercise-modal');
    const closePlanModalBtn = document.getElementById('close-plan-modal');
    const planExerciseForm = document.getElementById('plan-exercise-form');
    const planExerciseCategorySelect = document.getElementById('plan-exercise-category');
    
    // Category selection change
    planExerciseCategorySelect.addEventListener('change', updatePlanExerciseOptions);
    
    // Close modal button
    closePlanModalBtn.addEventListener('click', () => {
        planExerciseModal.classList.remove('show');
    });
    
    // Form submission
    planExerciseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addExerciseToPlan();
    });
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === planExerciseModal) {
            planExerciseModal.classList.remove('show');
        }
    });
}

// Create a new workout plan
function createNewPlan() {
    const planId = 'plan_' + Date.now();
    const newPlan = {
        id: planId,
        name: 'New Workout Plan',
        description: '',
        goal: currentTrainingGoal,
        days: {
            monday: { type: 'training', customName: '', exercises: [] },
            tuesday: { type: 'training', customName: '', exercises: [] },
            wednesday: { type: 'training', customName: '', exercises: [] },
            thursday: { type: 'training', customName: '', exercises: [] },
            friday: { type: 'training', customName: '', exercises: [] },
            saturday: { type: 'rest', customName: '', exercises: [] },
            sunday: { type: 'rest', customName: '', exercises: [] }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    workoutPlans[planId] = newPlan;
    currentPlan = planId;
    
    renderPlansList();
    selectPlan(planId);
    
    // Ensure "New Workout Plan" appears in the input field immediately
    document.getElementById('plan-name').value = newPlan.name;
    
    // Save to storage
    saveWorkoutPlans();
}

// Render the list of workout plans
function renderPlansList() {
    const plansList = document.getElementById('plans-list');
    plansList.innerHTML = '';
    
    if (Object.keys(workoutPlans).length === 0) {
        plansList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list empty-icon"></i>
                <p>No workout plans yet</p>
                <p>Click "New Plan" to create one</p>
            </div>
        `;
        return;
    }
    
    // Sort plans by updated date
    const sortedPlans = Object.values(workoutPlans).sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    
    sortedPlans.forEach(plan => {
        const planItem = document.createElement('div');
        planItem.classList.add('plan-item');
        if (currentPlan === plan.id) {
            planItem.classList.add('active');
        }
        
        planItem.innerHTML = `
            <div class="plan-item-content">
                <div class="plan-item-title">${plan.name}</div>
                <div class="plan-item-description">${plan.description || 'No description'}</div>
            </div>
            <div class="plan-item-actions">
                <button class="plan-action-button delete-plan" data-plan-id="${plan.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        // Select plan on click
        planItem.addEventListener('click', (e) => {
            if (!e.target.closest('.plan-action-button')) {
                selectPlan(plan.id);
            }
        });
        
        plansList.appendChild(planItem);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-plan').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const planId = button.dataset.planId;
            deletePlan(planId);
        });
    });
}

// Select a workout plan to edit
function selectPlan(planId) {
    // Save current plan details if there is one
    if (currentPlan && workoutPlans[currentPlan]) {
        savePlanDetails();
    }
    
    currentPlan = planId;
    currentDay = 'monday';
    
    // Update UI to reflect selection
    document.querySelectorAll('.plan-item').forEach(item => {
        item.classList.remove('active');
        if (item.querySelector(`[data-plan-id="${planId}"]`)) {
            item.classList.add('active');
        }
    });
    
    // Show the plan details section
    document.getElementById('no-plan-selected').style.display = 'none';
    document.getElementById('plan-details').style.display = 'block';
    
    // Load plan details
    const plan = workoutPlans[planId];
    document.getElementById('plan-name').value = plan.name;
    document.getElementById('plan-description').value = plan.description || '';
    
    // Set training goal if it exists on the plan
    if (plan.goal && document.getElementById('training-goal')) {
        document.getElementById('training-goal').value = plan.goal;
        currentTrainingGoal = plan.goal;
        
        // Update recommendation displays
        const goal = trainingGoals[currentTrainingGoal];
        document.getElementById('recommended-rep-range').textContent = goal.repRange;
        document.getElementById('recommended-rir-range').textContent = goal.rirRange;
        document.getElementById('recommended-rest-range').textContent = goal.restRange + " seconds";
        document.getElementById('recommended-frequency').textContent = goal.frequency;
    }
    
    // Switch to the first day tab
    document.querySelectorAll('.week-tabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.week-tabs .tab[data-day="monday"]`).classList.add('active');
    
    // Load the day details
    loadDayDetails('monday');
    
    // Update volume chart
    updateVolumeChart();
}

// Delete a workout plan
function deletePlan(planId) {
    if (confirm('Are you sure you want to delete this workout plan?')) {
        delete workoutPlans[planId];
        
        if (currentPlan === planId) {
            currentPlan = null;
            document.getElementById('no-plan-selected').style.display = 'flex';
            document.getElementById('plan-details').style.display = 'none';
        }
        
        saveWorkoutPlans();
        renderPlansList();
    }
}

// Save current plan details
function savePlanDetails() {
    if (!currentPlan || !workoutPlans[currentPlan]) return;
    
    const plan = workoutPlans[currentPlan];
    const nameInput = document.getElementById('plan-name');
    const descriptionInput = document.getElementById('plan-description');
    
    if (nameInput) {
        plan.name = nameInput.value || 'Unnamed Plan';
    }
    
    if (descriptionInput) {
        plan.description = descriptionInput.value || '';
    }
    
    plan.updatedAt = new Date().toISOString();
    
    // Save training goal if the selector exists
    const goalSelector = document.getElementById('training-goal');
    if (goalSelector) {
        plan.goal = goalSelector.value;
    }
    
    // Save current day details
    saveDayDetails(currentDay);
    
    // Save to storage immediately
    saveWorkoutPlans();
}

// Switch to a different day
function switchToDay(day) {
    // Save current day details
    saveDayDetails(currentDay);
    
    // Update UI
    document.querySelectorAll('.week-tabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.week-tabs .tab[data-day="${day}"]`).classList.add('active');
    
    // Update current day and load details
    currentDay = day;
    loadDayDetails(day);
}

// Load day details
function loadDayDetails(day) {
    if (!currentPlan || !workoutPlans[currentPlan]) return;
    
    const plan = workoutPlans[currentPlan];
    const dayData = plan.days[day];
    
    // Update day name
    document.getElementById('current-day-name').textContent = 
        day.charAt(0).toUpperCase() + day.slice(1);
    
    // Update day type
    document.getElementById('day-type').value = dayData.type;
    
    // Update custom name
    document.getElementById('day-name').value = dayData.customName || '';
    
    // Show the appropriate content based on day type
    updateDayContentVisibility(dayData.type);
    
    // Render exercises if it's a training day
    if (dayData.type === 'training') {
        renderDayExercises(dayData.exercises);
    }
    
    // Update recovery details if it's an active recovery day
    if (dayData.type === 'active-recovery') {
        document.getElementById('recovery-activity').value = dayData.recoveryActivity || '';
        document.getElementById('recovery-duration').value = dayData.recoveryDuration || 30;
        document.getElementById('recovery-notes').value = dayData.recoveryNotes || '';
    }
}

// Save day details
function saveDayDetails(day) {
    if (!currentPlan || !workoutPlans[currentPlan]) return;
    
    const plan = workoutPlans[currentPlan];
    const dayData = plan.days[day];
    
    // Update day type
    dayData.type = document.getElementById('day-type').value;
    
    // Update custom name
    dayData.customName = document.getElementById('day-name').value;
    
    // Update recovery details if it's an active recovery day
    if (dayData.type === 'active-recovery') {
        dayData.recoveryActivity = document.getElementById('recovery-activity').value;
        dayData.recoveryDuration = parseInt(document.getElementById('recovery-duration').value) || 30;
        dayData.recoveryNotes = document.getElementById('recovery-notes').value;
    }
    
    // Note: Exercises are updated as they are added/removed
}

// Update day type
function updateDayType() {
    const dayType = document.getElementById('day-type').value;
    updateDayContentVisibility(dayType);
    
    // Update the day data
    if (currentPlan && workoutPlans[currentPlan]) {
        workoutPlans[currentPlan].days[currentDay].type = dayType;
    }
}

// Update day content visibility based on day type
function updateDayContentVisibility(dayType) {
    document.getElementById('training-day-content').style.display = 
        dayType === 'training' ? 'block' : 'none';
    
    document.getElementById('rest-day-content').style.display = 
        dayType === 'rest' ? 'block' : 'none';
    
    document.getElementById('active-recovery-content').style.display = 
        dayType === 'active-recovery' ? 'block' : 'none';
}

// Render the exercises for a day
function renderDayExercises(exercises) {
    const exercisesList = document.getElementById('plan-exercises-list');
    exercisesList.innerHTML = '';
    
    if (exercises.length === 0) {
        exercisesList.innerHTML = `
            <div class="empty-state small">
                <p>No exercises added yet</p>
                <p>Click "Add Exercise" to add exercises to this day</p>
            </div>
        `;
        return;
    }
    
    exercises.forEach((exercise, index) => {
        const exerciseItem = document.createElement('div');
        exerciseItem.classList.add('plan-exercise-item');
        
        exerciseItem.innerHTML = `
            <div class="plan-exercise-header">
                <span class="plan-exercise-name">${exercise.name}</span>
                <div class="plan-exercise-actions">
                    <button class="plan-exercise-action edit-exercise" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="plan-exercise-action delete-exercise" data-index="${index}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="plan-exercise-details">
                <div><strong>Sets:</strong> ${exercise.sets}</div>
                <div><strong>Reps:</strong> ${exercise.repRange}</div>
                <div><strong>RIR:</strong> ${exercise.rirRange}</div>
                <div><strong>Rest:</strong> ${exercise.rest}s</div>
            </div>
            <div class="plan-exercise-muscles">
                <div><strong>Primary:</strong> ${exercise.directMuscles.join(', ')}</div>
                <div><strong>Secondary:</strong> ${exercise.indirectMuscles.join(', ')}</div>
            </div>
            ${exercise.notes ? `<div class="plan-exercise-notes">${exercise.notes}</div>` : ''}
        `;
        
        exercisesList.appendChild(exerciseItem);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-exercise').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(button.dataset.index);
            editPlanExercise(index);
        });
    });
    
    document.querySelectorAll('.delete-exercise').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(button.dataset.index);
            deletePlanExercise(index);
        });
    });
}

// Open the exercise modal for adding a new exercise
function openPlanExerciseModal() {
    const modal = document.getElementById('plan-exercise-modal');
    modal.classList.add('show');
    
    // Reset form
    document.getElementById('plan-exercise-form').reset();
    document.getElementById('plan-exercise-select').innerHTML = '<option value="">Select Exercise</option>';
    
    // Update the modal title
    document.getElementById('plan-modal-title').textContent = 'Add Exercise to Plan';
    
    // Remove any edit data attribute
    document.getElementById('add-plan-exercise-btn').removeAttribute('data-edit-index');
    
    // Set default values based on current training goal
    const goal = trainingGoals[currentTrainingGoal];
    const repRangeParts = goal.repRange.split('-');
    const rirRangeParts = goal.rirRange.split('-');
    const restRangeParts = goal.restRange.split('-');
    
    document.getElementById('plan-exercise-rep-range').value = goal.repRange;
    document.getElementById('plan-exercise-rir-range').value = goal.rirRange;
    document.getElementById('plan-exercise-rest').value = 
        Math.floor((parseInt(restRangeParts[0]) + parseInt(restRangeParts[1])) / 2);
}

// Update exercise options based on selected category
function updatePlanExerciseOptions() {
    const categorySelect = document.getElementById('plan-exercise-category');
    const exerciseSelect = document.getElementById('plan-exercise-select');
    
    const category = categorySelect.value;
    exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';
    
    if (category && userExercises[category]) {
        userExercises[category].forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.name;
            option.textContent = exercise.name;
            option.dataset.exercise = JSON.stringify(exercise);
            exerciseSelect.appendChild(option);
        });
    }
}

// Add exercise to current plan
function addExerciseToPlan() {
    const categorySelect = document.getElementById('plan-exercise-category');
    const exerciseSelect = document.getElementById('plan-exercise-select');
    const setsInput = document.getElementById('plan-exercise-sets');
    const repRangeInput = document.getElementById('plan-exercise-rep-range');
    const rirRangeInput = document.getElementById('plan-exercise-rir-range');
    const restInput = document.getElementById('plan-exercise-rest');
    const notesInput = document.getElementById('plan-exercise-notes');
    
    // Validate inputs
    if (!categorySelect.value || !exerciseSelect.value || !setsInput.value || 
        !repRangeInput.value || !rirRangeInput.value) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Find the selected exercise in user exercises
    const selectedExercise = userExercises[categorySelect.value].find(
        ex => ex.name === exerciseSelect.value
    );
    
    if (!selectedExercise) {
        alert('Selected exercise not found. Please try again.');
        return;
    }
    
    // Create exercise data
    const exerciseData = {
        name: selectedExercise.name,
        category: categorySelect.value,
        directMuscles: selectedExercise.directMuscles || [],
        indirectMuscles: selectedExercise.indirectMuscles || [],
        sets: parseInt(setsInput.value),
        repRange: repRangeInput.value,
        rirRange: rirRangeInput.value,
        rest: parseInt(restInput.value) || 90,
        notes: notesInput.value
    };
    
    // Check if we're editing an existing exercise
    const editIndex = document.getElementById('add-plan-exercise-btn').dataset.editIndex;
    
    if (editIndex !== undefined) {
        // Update existing exercise
        const index = parseInt(editIndex);
        workoutPlans[currentPlan].days[currentDay].exercises[index] = exerciseData;
    } else {
        // Add new exercise
        workoutPlans[currentPlan].days[currentDay].exercises.push(exerciseData);
    }
    
    // Update UI
    renderDayExercises(workoutPlans[currentPlan].days[currentDay].exercises);
    
    // Update volume chart
    updateVolumeChart();
    
    // Close modal
    document.getElementById('plan-exercise-modal').classList.remove('show');
    
    // Save changes
    saveWorkoutPlans();
}

// Edit a plan exercise
function editPlanExercise(index) {
    if (!currentPlan || !workoutPlans[currentPlan]) return;
    
    const exercise = workoutPlans[currentPlan].days[currentDay].exercises[index];
    if (!exercise) return;
    
    // Open modal
    const modal = document.getElementById('plan-exercise-modal');
    modal.classList.add('show');
    
    // Update modal title
    document.getElementById('plan-modal-title').textContent = 'Edit Exercise';
    
    // Set form values
    document.getElementById('plan-exercise-category').value = exercise.category;
    
    // Update exercise options
    updatePlanExerciseOptions();
    
    // Select the correct exercise
    setTimeout(() => {
        document.getElementById('plan-exercise-select').value = exercise.name;
    }, 50);
    
    document.getElementById('plan-exercise-sets').value = exercise.sets;
    document.getElementById('plan-exercise-rep-range').value = exercise.repRange;
    document.getElementById('plan-exercise-rir-range').value = exercise.rirRange;
    document.getElementById('plan-exercise-rest').value = exercise.rest;
    document.getElementById('plan-exercise-notes').value = exercise.notes || '';
    
    // Set data attribute for editing
    document.getElementById('add-plan-exercise-btn').dataset.editIndex = index;
}

// Delete a plan exercise
function deletePlanExercise(index) {
    if (!currentPlan || !workoutPlans[currentPlan]) return;
    
    if (confirm('Are you sure you want to remove this exercise from the plan?')) {
        workoutPlans[currentPlan].days[currentDay].exercises.splice(index, 1);
        renderDayExercises(workoutPlans[currentPlan].days[currentDay].exercises);
        updateVolumeChart();
        saveWorkoutPlans();
    }
}

// Calculate and update volume chart
function updateVolumeChart() {
    if (!document.getElementById('volume-chart')) return;
    
    const volumeChart = document.getElementById('volume-chart');
    
    // Calculate volume for each muscle group
    const muscleVolume = {};
    
    // Initialize all muscle groups with zero volume
    for (const muscle in volumeLandmarks) {
        muscleVolume[muscle] = 0;
    }
    
    // Calculate volume if we have a plan
    if (currentPlan && workoutPlans[currentPlan]) {
        const plan = workoutPlans[currentPlan];
        
        // Calculate volume from all training days
        for (const day in plan.days) {
            const dayData = plan.days[day];
            
            if (dayData.type !== 'training') continue;
            
            dayData.exercises.forEach(exercise => {
                // Get the RIR range
                const rirRange = exercise.rirRange.split('-');
                const avgRIR = (parseInt(rirRange[0]) + parseInt(rirRange[1])) / 2;
                
                // Determine if it's a working set based on RIR threshold
                const volumeFactor = avgRIR <= WORKING_SET_THRESHOLD ? 1 : 0.5;
                
                // Add direct muscles (full sets)
                exercise.directMuscles.forEach(muscle => {
                    muscleVolume[muscle] = (muscleVolume[muscle] || 0) + (exercise.sets * volumeFactor);
                });
                
                // Add indirect muscles (half sets - estimating lower stimulus)
                exercise.indirectMuscles.forEach(muscle => {
                    muscleVolume[muscle] = (muscleVolume[muscle] || 0) + (exercise.sets * volumeFactor * 0.5);
                });
            });
        }
    }
    
    // Generate chart HTML
    let chartHtml = '<div class="volume-bars">';
    
    // Get current goal focus and target
    const goal = trainingGoals[currentTrainingGoal];
    const goalFocus = goal.volumeFocus;
    const volumeTarget = goal.volumeTarget || 1.0;
    
    // Convert volumeFocus string to actual value based on goal
    const getTargetValue = (muscle) => {
        const landmarks = volumeLandmarks[muscle];
        
        if (goalFocus === "MAV") {
            return landmarks.MAV * volumeTarget;
        } else if (goalFocus === "MEV") {
            return landmarks.MEV * volumeTarget;
        } else if (goalFocus === "MRV") {
            return landmarks.MRV * volumeTarget;
        } else if (goalFocus === "MEV to lower MAV") {
            return landmarks.MEV + ((landmarks.MAV - landmarks.MEV) * 0.3) * volumeTarget;
        } else if (goalFocus === "MAV to MRV") {
            return landmarks.MAV + ((landmarks.MRV - landmarks.MAV) * 0.5) * volumeTarget;
        } else {
            return landmarks.MAV * volumeTarget;
        }
    };
    
    // Sort muscles by volume
    const sortedMuscles = Object.keys(volumeLandmarks).sort((a, b) => {
        // First sort by whether there's any volume
        const aHasVolume = muscleVolume[a] > 0;
        const bHasVolume = muscleVolume[b] > 0;
        
        if (aHasVolume && !bHasVolume) return -1;
        if (!aHasVolume && bHasVolume) return 1;
        
        // Then sort by how far from the target they are
        const aTarget = getTargetValue(a);
        const bTarget = getTargetValue(b);
        
        const aDistance = Math.abs(muscleVolume[a] - aTarget);
        const bDistance = Math.abs(muscleVolume[b] - bTarget);
        
        // Sort muscles with higher deviation from target first
        return bDistance - aDistance;
    });
    
    // Show all muscles regardless of current volume
    const musclesToShow = sortedMuscles;
    
    if (musclesToShow.length === 0) {
        volumeChart.innerHTML = `
            <div class="empty-state small">
                <p>No training volume data available</p>
                <p>Add exercises to see volume analysis</p>
            </div>
        `;
        return;
    }
    
    musclesToShow.forEach(muscle => {
        const volume = muscleVolume[muscle];
        const landmarks = volumeLandmarks[muscle];
        const targetValue = getTargetValue(muscle);
        
        // Determine status based on volume landmarks
        let statusClass = 'optimal';
        let statusText = '';
        
        if (volume < landmarks.MV) {
            statusClass = 'too-low';
            statusText = 'Below maintenance (MV)';
        } else if (volume < landmarks.MEV) {
            statusClass = 'low';
            statusText = 'Maintenance only';
        } else if (volume < Math.min(targetValue, landmarks.MAV)) {
            statusClass = 'good';
            statusText = 'Growth range';
        } else if (volume <= landmarks.MRV) {
            statusClass = 'high';
            statusText = 'Optimal growth';
        } else {
            statusClass = 'too-high';
            statusText = 'Exceeds recoverable volume';
        }
        
        // Special handling for strength/power goals
        if (goalFocus === "MEV" || goalFocus === "MEV to lower MAV") {
            if (Math.abs(volume - targetValue) < 2) {
                statusClass = 'optimal';
                statusText = 'Optimal for strength/power';
            }
        }
        
        // Calculate percentage for bar width (based on MRV being 100%)
        const maxVolumeForDisplay = landmarks.MRV * 1.2; // 20% buffer beyond MRV
        const percentage = (volume / maxVolumeForDisplay) * 100;
        
        // Add landmark markers
        const mvPercentage = (landmarks.MV / maxVolumeForDisplay) * 100;
        const mevPercentage = (landmarks.MEV / maxVolumeForDisplay) * 100;
        const mavPercentage = (landmarks.MAV / maxVolumeForDisplay) * 100;
        const mrvPercentage = (landmarks.MRV / maxVolumeForDisplay) * 100;
        const targetPercentage = (targetValue / maxVolumeForDisplay) * 100;
        
        chartHtml += `
            <div class="volume-bar-container">
                <div class="volume-bar-label">
                    <strong>${muscle}</strong>
                    <span class="volume-status ${statusClass}">${volume > 0 ? statusText : 'No volume'}</span>
                </div>
                <div class="volume-bar-wrapper">
                    <div class="landmarks">
                        <div class="landmark mv" style="left: ${mvPercentage}%" title="Maintenance Volume (MV): ${landmarks.MV} sets"></div>
                        <div class="landmark mev" style="left: ${mevPercentage}%" title="Minimum Effective Volume (MEV): ${landmarks.MEV} sets"></div>
                        <div class="landmark mav" style="left: ${mavPercentage}%" title="Maximum Adaptive Volume (MAV): ${landmarks.MAV} sets"></div>
                        <div class="landmark mrv" style="left: ${mrvPercentage}%" title="Maximum Recoverable Volume (MRV): ${landmarks.MRV} sets"></div>
                        <div class="landmark target" style="left: ${targetPercentage}%" title="Target for ${goal.name}: ${Math.round(targetValue * 10) / 10} sets"></div>
                    </div>
                    <div class="volume-bar ${statusClass}" style="
                        width: ${percentage}%; 
                        background-color: ${landmarks.color};"
                    ></div>
                </div>
                <div class="volume-value">
                    <span class="current-volume ${statusClass}">${Math.round(volume * 10) / 10}</span>
                    <span class="target-volume">${Math.round(targetValue * 10) / 10}</span>
                </div>
            </div>
        `;
    });
    
    chartHtml += '</div>';
    
    // Add legend
    chartHtml += `
        <div class="volume-legend">
            <div class="legend-item">
                <span class="legend-marker mv"></span>
                <span class="legend-text">MV: Maintenance Volume</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker mev"></span>
                <span class="legend-text">MEV: Minimum Effective Volume</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker mav"></span>
                <span class="legend-text">MAV: Maximum Adaptive Volume</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker mrv"></span>
                <span class="legend-text">MRV: Maximum Recoverable Volume</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker target"></span>
                <span class="legend-text">Target for ${goal.name}</span>
            </div>
        </div>
    `;
    
    // Add frequency analysis
    chartHtml += `<div class="frequency-analysis">
        <h3>Muscle Group Frequency</h3>
        <div class="frequency-bars">
            ${generateFrequencyAnalysis()}
        </div>
    </div>`;
    
    volumeChart.innerHTML = chartHtml;
}

// Calculate and generate frequency analysis
function generateFrequencyAnalysis() {
    // Get all muscle groups
    const allMuscleGroups = Object.keys(frequencyRecommendations);
    
    // Initialize data object for each muscle
    const muscleFrequency = {};
    allMuscleGroups.forEach(muscle => {
        muscleFrequency[muscle] = {
            direct: 0,
            indirect: 0,
            days: new Set()
        };
    });
    
    // Calculate actual frequency if we have a plan
    if (currentPlan && workoutPlans[currentPlan]) {
        const plan = workoutPlans[currentPlan];
        
        // Calculate frequency from all training days
        for (const day in plan.days) {
            const dayData = plan.days[day];
            
            if (dayData.type !== 'training') continue;
            
            dayData.exercises.forEach(exercise => {
                // Track direct muscles
                exercise.directMuscles.forEach(muscle => {
                    if (muscleFrequency[muscle]) {
                        muscleFrequency[muscle].direct++;
                        muscleFrequency[muscle].days.add(day);
                    }
                });
                
                // Track indirect muscles
                exercise.indirectMuscles.forEach(muscle => {
                    if (muscleFrequency[muscle]) {
                        muscleFrequency[muscle].indirect++;
                        muscleFrequency[muscle].days.add(day);
                    }
                });
            });
        }
    }
    
    // Generate HTML for frequency analysis
    let html = '';
    
    // Sort muscles by importance and then alphabetically
    // Main muscle groups come first
    const mainMuscleGroups = [
        'Chest', 'Lats', 'Quads', 'Hamstrings', 'Glutes', 'Front Delts', 
        'Side Delts', 'Rear Delts', 'Biceps', 'Triceps', 'Abs'
    ];
    
    const sortedMuscles = allMuscleGroups.sort((a, b) => {
        const aIsMain = mainMuscleGroups.includes(a);
        const bIsMain = mainMuscleGroups.includes(b);
        
        if (aIsMain && !bIsMain) return -1;
        if (!aIsMain && bIsMain) return 1;
        
        // Secondary sort by current frequency (higher first)
        const aFreq = muscleFrequency[a]?.days.size || 0;
        const bFreq = muscleFrequency[b]?.days.size || 0;
        
        if (aFreq !== bFreq) return bFreq - aFreq;
        
        // Finally, sort alphabetically
        return a.localeCompare(b);
    });
    
    // Create frequency bars for all muscles, showing recommendations
    sortedMuscles.forEach(muscle => {
        const data = muscleFrequency[muscle];
        const freq = data ? data.days.size : 0;
        const recs = frequencyRecommendations[muscle];
        
        if (!recs) return; // Skip if no recommendations available
        
        let statusClass = 'optimal';
        let statusText = `Optimal (${recs.min}-${recs.max}× recommended)`;
        
        if (freq < recs.min) {
            statusClass = 'too-low';
            statusText = `Low (${recs.min}-${recs.max}× recommended)`;
        } else if (freq > recs.max) {
            statusClass = 'too-high';
            statusText = `High (${recs.min}-${recs.max}× recommended)`;
        }
        
        html += `
            <div class="frequency-bar-container">
                <div class="frequency-bar-label">${muscle}</div>
                <div class="frequency-bar-wrapper">
                    <div class="frequency-guidelines">
                        <div class="min-frequency" style="left: ${(recs.min / 7) * 100}%" title="Minimum: ${recs.min}× weekly"></div>
                        <div class="optimal-frequency" style="left: ${(recs.optimal / 7) * 100}%" title="Optimal: ${recs.optimal}× weekly"></div>
                        <div class="max-frequency" style="left: ${(recs.max / 7) * 100}%" title="Maximum: ${recs.max}× weekly"></div>
                    </div>
                    <div class="frequency-bar ${statusClass}" 
                         style="width: ${Math.max((freq / 7) * 100, 8)}%;">
                        ${freq}× weekly
                    </div>
                </div>
                <div class="frequency-recommendation ${statusClass}">
                    ${statusText}
                </div>
            </div>
        `;
    });
    
    // Add legend for frequency guidelines
    html += `
        <div class="frequency-legend">
            <div class="legend-item">
                <span class="legend-marker min-frequency"></span>
                <span class="legend-text">Minimum Effective Frequency</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker optimal-frequency"></span>
                <span class="legend-text">Optimal Frequency</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker max-frequency"></span>
                <span class="legend-text">Maximum Productive Frequency</span>
            </div>
        </div>
    `;
    
    return html;
}
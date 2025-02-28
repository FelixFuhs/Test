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

// Recommended weekly volume ranges (sets per muscle group)
const volumeRecommendations = {
    'Chest': { min: 10, max: 16, color: '#FF6B6B' },
    'Front Delts': { min: 6, max: 12, color: '#4ECDC4' },
    'Side Delts': { min: 12, max: 20, color: '#4ECDC4' },
    'Rear Delts': { min: 12, max: 20, color: '#4ECDC4' },
    'Lats': { min: 12, max: 18, color: '#1A535C' },
    'Traps': { min: 10, max: 16, color: '#1A535C' },
    'Rhomboids': { min: 8, max: 14, color: '#1A535C' },
    'Lower Back': { min: 8, max: 14, color: '#1A535C' },
    'Biceps': { min: 8, max: 14, color: '#FFE66D' },
    'Triceps': { min: 8, max: 14, color: '#FFE66D' },
    'Forearms': { min: 6, max: 12, color: '#FFE66D' },
    'Abs': { min: 12, max: 20, color: '#F7FFF7' },
    'Obliques': { min: 8, max: 14, color: '#F7FFF7' },
    'Quads': { min: 12, max: 18, color: '#6B5B95' },
    'Hamstrings': { min: 10, max: 16, color: '#6B5B95' },
    'Glutes': { min: 12, max: 18, color: '#6B5B95' },
    'Calves': { min: 8, max: 16, color: '#6B5B95' },
    'Hip Flexors': { min: 6, max: 12, color: '#6B5B95' },
    'Adductors': { min: 6, max: 12, color: '#6B5B95' },
    'Serratus Anterior': { min: 6, max: 10, color: '#FF6B6B' },
    'Brachialis': { min: 6, max: 12, color: '#FFE66D' },
    'Core Stabilizers': { min: 8, max: 14, color: '#F7FFF7' }
};

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
    savePlanDetails();
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
    plan.name = document.getElementById('plan-name').value;
    plan.description = document.getElementById('plan-description').value;
    plan.updatedAt = new Date().toISOString();
    
    // Save current day details
    saveDayDetails(currentDay);
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
    if (!currentPlan || !workoutPlans[currentPlan]) return;
    
    const plan = workoutPlans[currentPlan];
    const volumeChart = document.getElementById('volume-chart');
    
    // Calculate volume for each muscle group
    const muscleVolume = {};
    
    // Initialize all muscle groups with zero volume
    for (const muscle in volumeRecommendations) {
        muscleVolume[muscle] = 0;
    }
    
    // Calculate volume from all training days
    for (const day in plan.days) {
        const dayData = plan.days[day];
        
        if (dayData.type !== 'training') continue;
        
        dayData.exercises.forEach(exercise => {
            // Add direct muscles (full sets)
            exercise.directMuscles.forEach(muscle => {
                muscleVolume[muscle] = (muscleVolume[muscle] || 0) + exercise.sets;
            });
            
            // Add indirect muscles (half sets - estimating lower stimulus)
            exercise.indirectMuscles.forEach(muscle => {
                muscleVolume[muscle] = (muscleVolume[muscle] || 0) + (exercise.sets * 0.5);
            });
        });
    }
    
    // Generate chart HTML
    let chartHtml = '<div class="volume-bars">';
    
    // Sort muscles by volume
    const sortedMuscles = Object.keys(muscleVolume).sort((a, b) => 
        muscleVolume[b] - muscleVolume[a]
    );
    
    // Only display muscles with some volume
    const activeMuscles = sortedMuscles.filter(muscle => muscleVolume[muscle] > 0);
    
    if (activeMuscles.length === 0) {
        volumeChart.innerHTML = `
            <div class="empty-state small">
                <p>No training volume yet</p>
                <p>Add exercises to see volume analysis</p>
            </div>
        `;
        return;
    }
    
    activeMuscles.forEach(muscle => {
        const volume = muscleVolume[muscle];
        const recommendation = volumeRecommendations[muscle];
        
        let statusClass = 'optimal';
        
        if (volume < recommendation.min) {
            statusClass = 'too-low';
        } else if (volume > recommendation.max) {
            statusClass = 'too-high';
        }
        
        // Calculate percentage for bar width (based on max recommendation being 100%)
        const maxVolumeForDisplay = Math.max(recommendation.max * 1.5, volume);
        const percentage = (volume / maxVolumeForDisplay) * 100;
        
        // Add min/max markers
        const minPercentage = (recommendation.min / maxVolumeForDisplay) * 100;
        const maxPercentage = (recommendation.max / maxVolumeForDisplay) * 100;
        
        chartHtml += `
            <div class="volume-bar-container">
                <div class="volume-bar-label">${muscle}</div>
                <div class="volume-bar-wrapper">
                    <div class="optimal-range" style="
                        left: ${minPercentage}%; 
                        width: ${maxPercentage - minPercentage}%;"
                    ></div>
                    <div class="volume-bar ${statusClass}" style="
                        width: ${percentage}%; 
                        background-color: ${recommendation.color};"
                    ></div>
                    <span class="min-marker" style="left: ${minPercentage}%;">
                        <span class="marker-value">${recommendation.min}</span>
                    </span>
                    <span class="max-marker" style="left: ${maxPercentage}%;">
                        <span class="marker-value">${recommendation.max}</span>
                    </span>
                </div>
                <div class="volume-value ${statusClass}">${Math.round(volume * 10) / 10}</div>
            </div>
        `;
    });
    
    chartHtml += '</div>';
    
    // Add legend
    chartHtml += `
        <div class="volume-legend">
            <div class="legend-item">
                <span class="legend-marker too-low"></span>
                <span class="legend-text">Too Low</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker optimal"></span>
                <span class="legend-text">Optimal Range</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker too-high"></span>
                <span class="legend-text">Too High</span>
            </div>
        </div>
    `;
    
    volumeChart.innerHTML = chartHtml;
}
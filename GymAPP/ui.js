// ui.js

import {
    allMuscles,
    muscleGroups,
    exercises,
    userExercises,
    workoutData,
    currentDate,
    currentDay,
    currentEditingExercise,
    loadUserExercises,
    saveUserExercises,
    loadWorkoutData,
    saveWorkoutData,
    getWeekKey,
    changeWeek
} from './data.js';

// DOM Elements
const exerciseModal = document.getElementById('exercise-modal');
const detailsModal = document.getElementById('exercise-details-modal');
const categorySelect = document.getElementById('exercise-category');
const exerciseSelect = document.getElementById('exercise-select');
const closeModalBtn = document.getElementById('close-modal');
const closeDetailsBtn = document.getElementById('close-details-modal');

// Modal state management
let isModalOpen = false;

// Function to update the week display
export function updateWeekDisplay() {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    document.getElementById('current-week').textContent =
        `Week of ${weekStart.toLocaleDateString(undefined, options)}`;
    renderWorkouts();
}

// Function to render workouts on the UI
export function renderWorkouts() {
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

                // Delete button
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-exercise');
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteButton.addEventListener('click', () => {
                    deleteExercise(day, index);
                });
                header.appendChild(deleteButton);

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

                // Input fields for actual progress
                for (let i = 0; i < exerciseData.sets; i++) {
                    const setInfo = document.createElement('div');
                    setInfo.classList.add('set-info');

                    const repInput = document.createElement('input');
                    repInput.type = 'number';
                    repInput.placeholder = 'Reps';
                    repInput.value = exerciseData.actualReps[i];
                    repInput.dataset.setIndex = i;
                    repInput.classList.add('actual-reps');
                    repInput.addEventListener('change', (event) => {
                        saveActualProgress(event, day, index);
                    });

                    const rirInput = document.createElement('input');
                    rirInput.type = 'number';
                    rirInput.placeholder = 'RIR';
                    rirInput.value = exerciseData.actualRIRs[i];
                    rirInput.dataset.setIndex = i;
                    rirInput.classList.add('actual-rir');
                    rirInput.addEventListener('change', (event) => {
                        saveActualProgress(event, day, index);
                    });

                    const weightInput = document.createElement('input');
                    weightInput.type = 'number';
                    weightInput.placeholder = 'Weight';
                    weightInput.value = exerciseData.weights[i];
                    weightInput.dataset.setIndex = i;
                    weightInput.classList.add('actual-weight');
                    weightInput.addEventListener('change', (event) => {
                        saveActualProgress(event, day, index);
                    });

                    setInfo.appendChild(repInput);
                    setInfo.appendChild(rirInput);
                    setInfo.appendChild(weightInput);

                    exerciseItem.appendChild(setInfo);
                }

                exercisesList.appendChild(exerciseItem);
            });
        }
    });
}

// Function to handle adding a new exercise
export function addExercise() {
    if (!exerciseSelect.value) {
        alert('Please select an exercise');
        return;
    }

    const setsValue = parseInt(document.getElementById('exercise-sets').value);
    const exerciseData = {
        exercise: exerciseSelect.value,
        sets: setsValue,
        repGoal: document.getElementById('exercise-rep-range').value,
        rirGoal: document.getElementById('exercise-rir-range').value,
        repeating: document.getElementById('exercise-repeating').checked,
        actualReps: Array(setsValue).fill(''),
        actualRIRs: Array(setsValue).fill(''),
        weights: Array(setsValue).fill('')
    };

    if (!exerciseData.exercise || isNaN(exerciseData.sets) || !exerciseData.repGoal || !exerciseData.rirGoal) {
        alert('Please fill in all fields.');
        return;
    }

    const weekKey = getWeekKey();
    if (!workoutData[weekKey]) workoutData[weekKey] = {};
    if (!workoutData[weekKey][currentDay]) workoutData[weekKey][currentDay] = [];

    workoutData[weekKey][currentDay].push(exerciseData);
    saveWorkoutData();
    renderWorkouts();
    closeModal();
}

// Function to handle deleting an exercise
export function deleteExercise(day, index) {
    const weekKey = getWeekKey();
    if (confirm('Are you sure you want to delete this exercise?')) {
        workoutData[weekKey][day].splice(index, 1);
        saveWorkoutData();
        renderWorkouts();
    }
}

// Function to save actual progress
export function saveActualProgress(event, day, index) {
    const weekKey = getWeekKey();

    const target = event.target;
    const setIndex = parseInt(target.dataset.setIndex);

    if (target.classList.contains('actual-reps')) {
        workoutData[weekKey][day][index].actualReps[setIndex] = target.value;
    } else if (target.classList.contains('actual-rir')) {
        workoutData[weekKey][day][index].actualRIRs[setIndex] = target.value;
    } else if (target.classList.contains('actual-weight')) {
        workoutData[weekKey][day][index].weights[setIndex] = target.value;
    }

    saveWorkoutData();
}

// Modal management functions
export function openModal(day) {
    if (isModalOpen) return;
    currentDay = day;
    exerciseModal.classList.add('show');
    isModalOpen = true;
    resetModalFields();
}

export function closeModal() {
    exerciseModal.classList.remove('show');
    isModalOpen = false;
    resetModalFields();
}

function closeDetailsModal() {
    detailsModal.classList.remove('show');
    isModalOpen = false;
}

function resetModalFields() {
    categorySelect.value = '';
    exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';
    document.getElementById('exercise-sets').value = '';
    document.getElementById('exercise-rep-range').value = '';
    document.getElementById('exercise-rir-range').value = '';
    document.getElementById('exercise-repeating').checked = false;
}

// Function to update exercise options when category is selected
export function updateExerciseOptions() {
    const category = categorySelect.value;
    exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';

    if (category) {
        const builtInExercises = exercises[category] || [];
        const customExercises = userExercises[category] || [];
        const allExercises = [...builtInExercises, ...customExercises];

        allExercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.name || exercise;
            option.textContent = exercise.name || exercise;
            exerciseSelect.appendChild(option);
        });
    }
}

// Event listeners and initialization
export function setupEventListeners() {
    // Add exercise buttons
    document.querySelectorAll('.add-exercise').forEach(button => {
        button.addEventListener('click', () => {
            const day = button.closest('.day').dataset.day;
            openModal(day);
        });
    });

    // Modal controls
    closeModalBtn.addEventListener('click', closeModal);

    document.getElementById('add-exercise-btn').addEventListener('click', (event) => {
        event.preventDefault();
        addExercise();
    });

    // Category selection
    categorySelect.addEventListener('change', updateExerciseOptions);

    // Week navigation
    document.getElementById('prev-week').addEventListener('click', () => {
        changeWeek(-7);
        updateWeekDisplay();
    });

    document.getElementById('next-week').addEventListener('click', () => {
        changeWeek(7);
        updateWeekDisplay();
    });

    // Save/Load workout buttons
    document.getElementById('save-workout')?.addEventListener('click', () => {
        saveWorkoutData();
        alert('Workout data saved.');
    });

    document.getElementById('load-workout')?.addEventListener('click', () => {
        loadWorkoutData();
        renderWorkouts();
        alert('Workout data loaded.');
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === exerciseModal) {
            closeModal();
        }
        if (e.target === detailsModal) {
            closeDetailsModal();
        }
    });

    // Close modals on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeDetailsModal();
        }
    });
}

// Initialization function
export function initUI() {
    loadUserExercises();
    loadWorkoutData();
    preventModalOnLoad();
    setupEventListeners();
    updateWeekDisplay();
}

// Prevent modals from showing on page load
function preventModalOnLoad() {
    exerciseModal?.classList.remove('show');
    detailsModal?.classList.remove('show');
}

// Error handling wrapper
function handleError(fn) {
    return function (...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    };
}

// Wrap key functions with error handling
addExercise = handleError(addExercise);
deleteExercise = handleError(deleteExercise);
saveActualProgress = handleError(saveActualProgress);

// Initialize the manage exercises page
export function initManageExercises() {
    renderExerciseList();
    initializeExerciseForm();
    setupManageEventListeners();
}

// Render the list of exercises
export function renderExerciseList() {
    const exerciseList = document.getElementById('exercise-list');
    exerciseList.innerHTML = '';

    for (const category in userExercises) {
        const categorySection = document.createElement('div');
        categorySection.classList.add('category-section');
        categorySection.innerHTML = `<h3>${category}</h3>`;

        userExercises[category].forEach(exercise => {
            const exerciseItem = document.createElement('div');
            exerciseItem.classList.add('exercise-item');
            exerciseItem.innerHTML = `
                <span>${exercise.name}</span>
                <div class="exercise-actions">
                    <button onclick="viewExerciseDetails('${exercise.name}', '${category}')">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button onclick="deleteUserExercise('${exercise.name}', '${category}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            categorySection.appendChild(exerciseItem);
        });

        exerciseList.appendChild(categorySection);
    }
}

function initializeExerciseForm() {
    const categorySelect = document.getElementById('new-exercise-category');
    const directMusclesContainer = document.getElementById('direct-muscles');
    const indirectMusclesContainer = document.getElementById('indirect-muscles');

    categorySelect.innerHTML = '<option value="">Select Category</option>';
    muscleGroups.forEach(category => {
        categorySelect.innerHTML += `<option value="${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</option>`;
    });

    // Populate muscle options based on selected category
    allMuscles.forEach(muscle => {
        const option = `<div class="muscle-option">${muscle}</div>`;
        directMusclesContainer.innerHTML += option;
        indirectMusclesContainer.innerHTML += option;
    });

    // Add event listeners for muscle selection
    directMusclesContainer.querySelectorAll('.muscle-option').forEach(option => {
        option.addEventListener('click', () => toggleMuscleSelection(option));
    });

    indirectMusclesContainer.querySelectorAll('.muscle-option').forEach(option => {
        option.addEventListener('click', () => toggleMuscleSelection(option));
    });
}

function setupManageEventListeners() {
    document.getElementById('new-exercise-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addNewExercise();
    });

    document.getElementById('new-exercise-category').addEventListener('change', (e) => {
        updateMuscleOptions(e.target.value, 'direct-muscles', 'indirect-muscles');
    });
}

export function viewExerciseDetails(exerciseName, category) {
    const exercise = userExercises[category].find(e => e.name === exerciseName);
    if (!exercise) {
        alert('Exercise not found.');
        return;
    }

    currentEditingExercise = { ...exercise, category };
    const modal = document.getElementById('exercise-details-modal');
    
    document.getElementById('detail-name').textContent = exercise.name;
    document.getElementById('detail-category').textContent = category.charAt(0).toUpperCase() + category.slice(1);
    document.getElementById('detail-direct-muscles').textContent = exercise.directMuscles.join(', ');
    document.getElementById('detail-indirect-muscles').textContent = exercise.indirectMuscles.join(', ');
    
    modal.classList.add('show');
}

// Function to delete a user exercise
export function deleteUserExercise(exerciseName, category) {
    if (confirm(`Are you sure you want to delete the exercise "${exerciseName}" from ${category}?`)) {
        const exercisesList = userExercises[category];
        const index = exercisesList.findIndex(ex => ex.name === exerciseName);
        if (index !== -1) {
            exercisesList.splice(index, 1);
            saveUserExercises();
            renderExerciseList();
            alert('Exercise deleted successfully.');
        } else {
            alert('Exercise not found.');
        }
    }
}

// Expose functions to the global scope for inline onclick handlers
window.viewExerciseDetails = viewExerciseDetails;
window.deleteUserExercise = deleteUserExercise;

function enableEditMode() {
    if (!currentEditingExercise) return;
    
    const form = document.getElementById('edit-exercise-form');
    form.elements['name'].value = currentEditingExercise.name;
    form.elements['category'].value = currentEditingExercise.category;
    
    // Enable form fields
    form.querySelectorAll('input, select').forEach(element => {
        element.disabled = false;
    });

    document.getElementById('exercise-details-content').style.display = 'none';
    form.style.display = 'block';
}

function saveExerciseChanges() {
    // Implement saving changes to the exercise
    const form = document.getElementById('edit-exercise-form');
    const name = form.elements['name'].value.trim();
    const category = form.elements['category'].value;
    const directMuscles = Array.from(document.querySelectorAll('#edit-direct-muscles .selected')).map(el => el.textContent);
    const indirectMuscles = Array.from(document.querySelectorAll('#edit-indirect-muscles .selected')).map(el => el.textContent);

    if (!name || !category) {
        alert('Please fill in all required fields.');
        return;
    }

    // Update the exercise in userExercises
    const exercises = userExercises[currentEditingExercise.category];
    const index = exercises.findIndex(e => e.name === currentEditingExercise.name);
    if (index !== -1) {
        exercises[index] = { name, category, directMuscles, indirectMuscles };
        saveUserExercises();
        initManageExercises();
        closeDetailsModal();
    }
}

function addNewExercise() {
    const form = document.getElementById('new-exercise-form');
    const name = form.elements['new-exercise-name'].value.trim();
    const category = form.elements['new-exercise-category'].value;
    const directMuscles = Array.from(document.querySelectorAll('#direct-muscles .selected')).map(el => el.textContent);
    const indirectMuscles = Array.from(document.querySelectorAll('#indirect-muscles .selected')).map(el => el.textContent);

    if (!name || !category) {
        alert('Please fill in all required fields.');
        return;
    }

    if (!userExercises[category]) {
        userExercises[category] = [];
    }

    userExercises[category].push({ name, category, directMuscles, indirectMuscles });
    saveUserExercises();
    initManageExercises();
    form.reset();
}

function resetNewExerciseFields() {
    const form = document.getElementById('new-exercise-form');
    form.reset();
    document.getElementById('direct-muscles').innerHTML = '';
    document.getElementById('indirect-muscles').innerHTML = '';
}

function updateMuscleOptions(category, directContainerId, indirectContainerId) {
    const directContainer = document.getElementById(directContainerId);
    const indirectContainer = document.getElementById(indirectContainerId);
    directContainer.innerHTML = '';
    indirectContainer.innerHTML = '';

    muscleGroups[category].forEach(muscle => {
        directContainer.innerHTML += `<div class="muscle-option">${muscle}</div>`;
        indirectContainer.innerHTML += `<div class="muscle-option">${muscle}</div>`;
    });

    // Add event listeners for muscle selection
    directContainer.querySelectorAll('.muscle-option').forEach(option => {
        option.addEventListener('click', () => toggleMuscleSelection(option));
    });

    indirectContainer.querySelectorAll('.muscle-option').forEach(option => {
        option.addEventListener('click', () => toggleMuscleSelection(option));
    });
}

function toggleMuscleSelection(element) {
    element.classList.toggle('selected');
}

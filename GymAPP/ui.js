// ui.js

import {
    allMuscles,
    muscleGroups,
    exercises,
    userExercises,
    workoutData,
    currentDate,
    loadUserExercises,
    saveUserExercises,
    loadWorkoutData,
    saveWorkoutData,
    getWeekKey,
    changeWeek,
    initializeDefaultExercises
} from './data.js';

// Global variables
export let currentDay = null;
export let currentEditingExercise = null;

// Modal state management
let isModalOpen = false;

// Function to update the week display
export function updateWeekDisplay() {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
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
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent event bubbling
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
                    repInput.value = exerciseData.actualReps[i] || '';
                    repInput.dataset.setIndex = i;
                    repInput.classList.add('actual-reps');
                    repInput.addEventListener('change', (event) => {
                        saveActualProgress(event, day, index);
                    });

                    const rirInput = document.createElement('input');
                    rirInput.type = 'number';
                    rirInput.placeholder = 'RIR';
                    rirInput.value = exerciseData.actualRIRs[i] || '';
                    rirInput.dataset.setIndex = i;
                    rirInput.classList.add('actual-rir');
                    rirInput.addEventListener('change', (event) => {
                        saveActualProgress(event, day, index);
                    });

                    const weightInput = document.createElement('input');
                    weightInput.type = 'number';
                    weightInput.placeholder = 'Weight';
                    weightInput.value = exerciseData.weights[i] || '';
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
    const categorySelect = document.getElementById('exercise-category');
    const exerciseSelect = document.getElementById('exercise-select');
    
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
    const exerciseModal = document.getElementById('exercise-modal');
    exerciseModal.classList.add('show');
    isModalOpen = true;
    resetModalFields();
}

export function closeModal() {
    const exerciseModal = document.getElementById('exercise-modal');
    exerciseModal.classList.remove('show');
    isModalOpen = false;
    resetModalFields();
}

export function closeDetailsModal() {
    const detailsModal = document.getElementById('exercise-details-modal');
    detailsModal.classList.remove('show');
    isModalOpen = false;
}

function resetModalFields() {
    const categorySelect = document.getElementById('exercise-category');
    const exerciseSelect = document.getElementById('exercise-select');
    
    if (categorySelect) categorySelect.value = '';
    if (exerciseSelect) exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';
    
    const setsInput = document.getElementById('exercise-sets');
    const repRangeInput = document.getElementById('exercise-rep-range');
    const rirRangeInput = document.getElementById('exercise-rir-range');
    const repeatingCheckbox = document.getElementById('exercise-repeating');
    
    if (setsInput) setsInput.value = '';
    if (repRangeInput) repRangeInput.value = '';
    if (rirRangeInput) rirRangeInput.value = '';
    if (repeatingCheckbox) repeatingCheckbox.checked = false;
}

// Function to update exercise options when category is selected
export function updateExerciseOptions() {
    const categorySelect = document.getElementById('exercise-category');
    const exerciseSelect = document.getElementById('exercise-select');
    
    if (!categorySelect || !exerciseSelect) return;
    
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
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    const addExerciseBtn = document.getElementById('add-exercise-btn');
    if (addExerciseBtn) {
        addExerciseBtn.addEventListener('click', (event) => {
            event.preventDefault();
            addExercise();
        });
    }

    // Category selection
    const categorySelect = document.getElementById('exercise-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', updateExerciseOptions);
    }

    // Week navigation
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            changeWeek(-7);
            updateWeekDisplay();
        });
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            changeWeek(7);
            updateWeekDisplay();
        });
    }

    // Save/Load workout buttons
    const saveWorkoutBtn = document.getElementById('save-workout');
    const loadWorkoutBtn = document.getElementById('load-workout');
    
    if (saveWorkoutBtn) {
        saveWorkoutBtn.addEventListener('click', () => {
            saveWorkoutData();
            alert('Workout data saved.');
        });
    }
    
    if (loadWorkoutBtn) {
        loadWorkoutBtn.addEventListener('click', () => {
            loadWorkoutData();
            renderWorkouts();
            alert('Workout data loaded.');
        });
    }

    // Close modals on outside click
    const exerciseModal = document.getElementById('exercise-modal');
    const detailsModal = document.getElementById('exercise-details-modal');
    
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
    console.log("Initializing UI...");
    loadUserExercises();
    loadWorkoutData();
    initializeDefaultExercises();
    preventModalOnLoad();
    setupEventListeners();
    updateWeekDisplay();
    console.log("UI Initialized with exercises:", userExercises);
}

// Prevent modals from showing on page load
function preventModalOnLoad() {
    const exerciseModal = document.getElementById('exercise-modal');
    const detailsModal = document.getElementById('exercise-details-modal');
    
    if (exerciseModal) exerciseModal.classList.remove('show');
    if (detailsModal) detailsModal.classList.remove('show');
}

// Initialize the manage exercises page
export function initManageExercises() {
    console.log("Initializing Manage Exercises page...");
    loadUserExercises();
    initializeDefaultExercises();
    
    const newCategorySelect = document.getElementById('new-exercise-category');
    if (newCategorySelect) {
        newCategorySelect.addEventListener('change', () => {
            updateMuscleOptions(newCategorySelect.value, 'direct-muscles', 'indirect-muscles');
        });
    }
    
    const newExerciseForm = document.getElementById('new-exercise-form');
    if (newExerciseForm) {
        newExerciseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewExercise();
        });
    }
    
    const filterCategorySelect = document.getElementById('filter-category');
    if (filterCategorySelect) {
        filterCategorySelect.addEventListener('change', renderExerciseList);
    }
    
    const closeDetailsBtn = document.getElementById('close-details-modal');
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', closeDetailsModal);
    }
    
    const editExerciseBtn = document.getElementById('edit-exercise-btn');
    if (editExerciseBtn) {
        editExerciseBtn.addEventListener('click', enableEditMode);
    }
    
    const saveExerciseBtn = document.getElementById('save-exercise-btn');
    if (saveExerciseBtn) {
        saveExerciseBtn.addEventListener('click', saveExerciseChanges);
    }
    
    renderExerciseList();
    console.log("Manage Exercises page initialized with exercises:", userExercises);
}

// Render the list of exercises for the manage exercises page
export function renderExerciseList() {
    const exerciseList = document.getElementById('exercise-list');
    if (!exerciseList) return;
    
    exerciseList.innerHTML = '';
    const filterCategory = document.getElementById('filter-category')?.value || '';

    const categories = filterCategory ? [filterCategory] : Object.keys(userExercises);

    categories.forEach(category => {
        if (!userExercises[category]) return;
        
        const exercises = userExercises[category];
        if (exercises.length === 0) return;
        
        const categoryHeader = document.createElement('h3');
        categoryHeader.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        exerciseList.appendChild(categoryHeader);

        exercises.forEach(exercise => {
            const exerciseItem = document.createElement('div');
            exerciseItem.classList.add('exercise-item');
            exerciseItem.dataset.category = category;
            exerciseItem.dataset.name = exercise.name;
            
            exerciseItem.innerHTML = `
                <span>${exercise.name}</span>
                <div class="exercise-actions">
                    <button class="view-details" data-name="${exercise.name}" data-category="${category}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="delete-exercise" data-name="${exercise.name}" data-category="${category}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            exerciseList.appendChild(exerciseItem);
        });
    });

    // Add event listeners to the dynamically created buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = button.dataset.name;
            const category = button.dataset.category;
            viewExerciseDetails(name, category);
        });
    });

    document.querySelectorAll('.delete-exercise').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = button.dataset.name;
            const category = button.dataset.category;
            deleteUserExercise(name, category);
        });
    });
}

// Function to view exercise details
export function viewExerciseDetails(exerciseName, category) {
    if (!userExercises[category]) return;
    
    const exercise = userExercises[category].find(e => e.name === exerciseName);
    if (!exercise) {
        alert('Exercise not found.');
        return;
    }

    currentEditingExercise = { ...exercise, category };
    const modal = document.getElementById('exercise-details-modal');
    
    document.getElementById('detail-name').textContent = exercise.name;
    document.getElementById('detail-category').textContent = category.charAt(0).toUpperCase() + category.slice(1);
    
    // Handle differences in property names (directMuscles vs primary)
    const primaryMuscles = exercise.directMuscles || exercise.primary || [];
    const secondaryMuscles = exercise.indirectMuscles || exercise.secondary || [];
    
    document.getElementById('detail-direct-muscles').textContent = primaryMuscles.join(', ') || 'None';
    document.getElementById('detail-indirect-muscles').textContent = secondaryMuscles.join(', ') || 'None';
    
    const editButton = document.getElementById('edit-exercise-btn');
    const saveButton = document.getElementById('save-exercise-btn');
    const detailsContent = document.getElementById('exercise-details-content');
    const editForm = document.getElementById('edit-exercise-form');
    
    if (editButton) editButton.style.display = 'inline-block';
    if (saveButton) saveButton.style.display = 'none';
    if (editForm) editForm.style.display = 'none';
    if (detailsContent) detailsContent.style.display = 'grid';
    
    modal.classList.add('show');
}

// Function to delete a user exercise
export function deleteUserExercise(exerciseName, category) {
    if (!userExercises[category]) return;
    
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

function enableEditMode() {
    if (!currentEditingExercise) return;
    
    const detailsContent = document.getElementById('exercise-details-content');
    const editForm = document.getElementById('edit-exercise-form');
    const editButton = document.getElementById('edit-exercise-btn');
    const saveButton = document.getElementById('save-exercise-btn');
    
    if (editForm) {
        const nameInput = document.getElementById('edit-exercise-name');
        const categorySelect = document.getElementById('edit-exercise-category');
        
        if (nameInput) nameInput.value = currentEditingExercise.name;
        if (categorySelect) categorySelect.value = currentEditingExercise.category;
        
        updateMuscleOptions(
            currentEditingExercise.category, 
            'edit-direct-muscles', 
            'edit-indirect-muscles'
        );
        
        setTimeout(() => {
            const directMuscles = currentEditingExercise.directMuscles || currentEditingExercise.primary || [];
            const indirectMuscles = currentEditingExercise.indirectMuscles || currentEditingExercise.secondary || [];
            
            directMuscles.forEach(muscle => {
                const muscleOption = document.querySelector(`#edit-direct-muscles .muscle-option[data-muscle="${muscle}"]`);
                if (muscleOption) muscleOption.classList.add('selected');
            });
            
            indirectMuscles.forEach(muscle => {
                const muscleOption = document.querySelector(`#edit-indirect-muscles .muscle-option[data-muscle="${muscle}"]`);
                if (muscleOption) muscleOption.classList.add('selected');
            });
        }, 50);
    }
    
    if (detailsContent) detailsContent.style.display = 'none';
    if (editForm) editForm.style.display = 'block';
    if (editButton) editButton.style.display = 'none';
    if (saveButton) saveButton.style.display = 'inline-block';
}

function saveExerciseChanges() {
    if (!currentEditingExercise) return;
    
    const nameInput = document.getElementById('edit-exercise-name');
    const categorySelect = document.getElementById('edit-exercise-category');
    
    if (!nameInput || !categorySelect) return;
    
    const name = nameInput.value.trim();
    const newCategory = categorySelect.value;
    
    const directMusclesContainer = document.getElementById('edit-direct-muscles');
    const indirectMusclesContainer = document.getElementById('edit-indirect-muscles');
    
    if (!directMusclesContainer || !indirectMusclesContainer) return;
    
    const directMuscles = Array.from(directMusclesContainer.querySelectorAll('.muscle-option.selected'))
        .map(el => el.dataset.muscle);
    
    const indirectMuscles = Array.from(indirectMusclesContainer.querySelectorAll('.muscle-option.selected'))
        .map(el => el.dataset.muscle);

    if (!name || !newCategory || directMuscles.length === 0) {
        alert('Please fill in all required fields. Primary muscles are required.');
        return;
    }

    // Handle category changes
    const oldCategory = currentEditingExercise.category;
    
    if (oldCategory !== newCategory) {
        // Remove from old category
        userExercises[oldCategory] = userExercises[oldCategory].filter(
            ex => ex.name !== currentEditingExercise.name
        );
        
        // Ensure new category exists
        if (!userExercises[newCategory]) {
            userExercises[newCategory] = [];
        }
    } else {
        // Remove from same category to avoid duplicates
        userExercises[newCategory] = userExercises[newCategory].filter(
            ex => ex.name !== currentEditingExercise.name
        );
    }

    // Add updated exercise to appropriate category
    userExercises[newCategory].push({
        name: name,
        directMuscles: directMuscles,
        indirectMuscles: indirectMuscles
    });

    saveUserExercises();
    renderExerciseList();
    closeDetailsModal();
}

function addNewExercise() {
    const nameInput = document.getElementById('new-exercise-name');
    const categorySelect = document.getElementById('new-exercise-category');
    const directMusclesContainer = document.getElementById('direct-muscles');
    const indirectMusclesContainer = document.getElementById('indirect-muscles');
    
    if (!nameInput || !categorySelect) return;
    
    const name = nameInput.value.trim();
    const category = categorySelect.value;
    
    if (!directMusclesContainer || !indirectMusclesContainer) return;
    
    const directMuscles = Array.from(directMusclesContainer.querySelectorAll('.muscle-option.selected'))
        .map(el => el.dataset.muscle);
    
    const indirectMuscles = Array.from(indirectMusclesContainer.querySelectorAll('.muscle-option.selected'))
        .map(el => el.dataset.muscle);

    if (!name || !category) {
        alert('Please enter an exercise name and select a category.');
        return;
    }

    if (directMuscles.length === 0) {
        alert('Please select at least one primary muscle.');
        return;
    }

    if (!userExercises[category]) {
        userExercises[category] = [];
    }

    const exists = userExercises[category].some(ex => ex.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        alert('An exercise with this name already exists in the selected category.');
        return;
    }

    userExercises[category].push({
        name: name,
        directMuscles: directMuscles,
        indirectMuscles: indirectMuscles
    });

    saveUserExercises();
    renderExerciseList();
    resetNewExerciseFields();
    alert('Exercise added successfully!');
}

function resetNewExerciseFields() {
    const nameInput = document.getElementById('new-exercise-name');
    const categorySelect = document.getElementById('new-exercise-category');
    const directMusclesContainer = document.getElementById('direct-muscles');
    const indirectMusclesContainer = document.getElementById('indirect-muscles');
    
    if (nameInput) nameInput.value = '';
    if (categorySelect) categorySelect.value = '';
    
    if (directMusclesContainer) directMusclesContainer.innerHTML = '';
    if (indirectMusclesContainer) indirectMusclesContainer.innerHTML = '';
    
    document.querySelectorAll('.muscle-option').forEach(option => {
        option.classList.remove('selected');
    });
}

function updateMuscleOptions(category, directContainerId, indirectContainerId) {
    const directContainer = document.getElementById(directContainerId);
    const indirectContainer = document.getElementById(indirectContainerId);
    
    if (!directContainer || !indirectContainer || !category) return;
    
    directContainer.innerHTML = '';
    indirectContainer.innerHTML = '';

    console.log("Updating muscle options for category:", category);
    console.log("Available muscle groups:", muscleGroups);

    // Get muscles relevant to the selected category
    const relevantMuscles = muscleGroups[category] || [];
    console.log("Relevant muscles for category:", relevantMuscles);
    
    // Add muscle options to direct muscles container
    relevantMuscles.forEach(muscle => {
        const muscleOption = document.createElement('div');
        muscleOption.classList.add('muscle-option');
        muscleOption.dataset.muscle = muscle;
        muscleOption.textContent = muscle;
        muscleOption.addEventListener('click', () => toggleMuscleSelection(muscleOption));
        directContainer.appendChild(muscleOption);
    });

    // Add all muscles to indirect muscles container
    allMuscles.forEach(muscle => {
        const muscleOption = document.createElement('div');
        muscleOption.classList.add('muscle-option');
        muscleOption.dataset.muscle = muscle;
        muscleOption.textContent = muscle;
        muscleOption.addEventListener('click', () => toggleMuscleSelection(muscleOption));
        indirectContainer.appendChild(muscleOption);
    });
}

function toggleMuscleSelection(element) {
    if (!element) return;
    element.classList.toggle('selected');
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
viewExerciseDetails = handleError(viewExerciseDetails);
deleteUserExercise = handleError(deleteUserExercise);
addNewExercise = handleError(addNewExercise);
saveExerciseChanges = handleError(saveExerciseChanges);
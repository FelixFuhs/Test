// All available muscles for selection
const allMuscles = [
    'Chest', 'Front Delts', 'Side Delts', 'Rear Delts', 'Lats',
    'Traps', 'Rhomboids', 'Lower Back', 'Biceps', 'Triceps',
    'Forearms', 'Abs', 'Obliques', 'Quads', 'Hamstrings',
    'Glutes', 'Calves', 'Hip Flexors', 'Adductors',
    'Serratus Anterior', 'Brachialis', 'Core Stabilizers'
];

// Muscle groups for categories
const muscleGroups = {
    chest: ['Chest', 'Front Delts', 'Serratus Anterior'],
    back: ['Lats', 'Traps', 'Rhomboids', 'Lower Back'],
    shoulders: ['Front Delts', 'Side Delts', 'Rear Delts'],
    arms: ['Biceps', 'Triceps', 'Forearms', 'Brachialis'],
    legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Hip Flexors', 'Adductors'],
    core: ['Abs', 'Obliques', 'Lower Back', 'Core Stabilizers']
};

// Essential data structures
const exercises = {
    chest: [],
    back: [], 
    shoulders: [],
    arms: [],
    legs: [],
    core: []
};

// Global state management
let userExercises = {};
let workoutData = {};
let currentDate = new Date();
let currentDay = null;
let currentEditingExercise = null;

// DOM Elements
const modal = document.getElementById('exercise-modal');
const categorySelect = document.getElementById('exercise-category');
const exerciseSelect = document.getElementById('exercise-select');

// Storage functions
function loadUserExercises() {
    const stored = localStorage.getItem('userExercises');
    userExercises = stored ? JSON.parse(stored) : {};
}

function saveUserExercises() {
    localStorage.setItem('userExercises', JSON.stringify(userExercises));
}

function loadWorkoutData() {
    const stored = localStorage.getItem('workoutData');
    workoutData = stored ? JSON.parse(stored) : {};
}

function saveWorkoutData() {
    localStorage.setItem('workoutData', JSON.stringify(workoutData));
}

// Week management
function getWeekKey(date = currentDate) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().split('T')[0];
}

function changeWeek(days) {
    const oldDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + days);
    const oldWeekKey = getWeekKey(oldDate);
    const newWeekKey = getWeekKey();

    // Copy repeating exercises to new week
    if (days !== 0 && workoutData[oldWeekKey]) {
        if (!workoutData[newWeekKey]) {
            workoutData[newWeekKey] = {};
            for (const day in workoutData[oldWeekKey]) {
                workoutData[newWeekKey][day] = workoutData[oldWeekKey][day].filter(ex => ex.repeating);
            }
            saveWorkoutData();
        }
    }

    updateWeekDisplay();
}

function updateWeekDisplay() {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    document.getElementById('current-week').textContent =
        `Week of ${weekStart.toLocaleDateString(undefined, options)}`;
    renderWorkouts();
}

// Function to handle adding a new exercise
function addExercise() {
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
    modal.style.display = 'none';
}

// Function to handle deleting an exercise
function deleteExercise(day, index) {
    const weekKey = getWeekKey();
    if (confirm('Are you sure you want to delete this exercise?')) {
        workoutData[weekKey][day].splice(index, 1);
        saveWorkoutData();
        renderWorkouts();
    }
}

// Function to render workouts
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

// Function to save actual progress
function saveActualProgress(event, day, index) {
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

// Modal state management
let isModalOpen = false;

// Modal elements
const exerciseModal = document.getElementById('exercise-modal');
const detailsModal = document.getElementById('exercise-details-modal');
const closeModalBtn = document.getElementById('close-modal');
const closeDetailsBtn = document.getElementById('close-details-modal');

function preventModalOnLoad() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
    });
    isModalOpen = false;
}

function openModal(day) {
    if (isModalOpen) return;
    currentDay = day;
    exerciseModal.classList.add('show');
    isModalOpen = true;
    resetModalFields();
}

function closeModal() {
    exerciseModal.classList.remove('show');
    isModalOpen = false;
    resetModalFields();
}

function closeDetailsModal() {
    detailsModal.classList.remove('show');
    isModalOpen = false;
}

// Event handlers for modal management
function setupModalEventListeners() {
    // Close on X button click
    closeModalBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    });

    closeDetailsBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeDetailsModal();
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === exerciseModal) {
            closeModal();
        }
        if (e.target === detailsModal) {
            closeDetailsModal();
        }
    });

    // Prevent modal close on modal content click
    const modalContents = document.querySelectorAll('.modal-content');
    modalContents.forEach(content => {
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeDetailsModal();
        }
    });
}

// Modal management
function resetModalFields() {
    categorySelect.value = '';
    exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';
    document.getElementById('exercise-sets').value = '';
    document.getElementById('exercise-rep-range').value = '';
    document.getElementById('exercise-rir-range').value = '';
    document.getElementById('exercise-repeating').checked = false;
}

// Event listeners and initialization
function setupEventListeners() {
    // Add exercise buttons in index.html
    document.querySelectorAll('.add-exercise').forEach(button => {
        button.addEventListener('click', () => {
            const day = button.closest('.day').dataset.day;
            openModal(day);
        });
    });

    // Modal controls in index.html
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('add-exercise-btn').addEventListener('click', (event) => {
        event.preventDefault();
        addExercise();
    });

    // Category selection in index.html
    categorySelect.addEventListener('change', updateExerciseOptions);

    // Week navigation in index.html
    document.getElementById('prev-week').addEventListener('click', () => changeWeek(-7));
    document.getElementById('next-week').addEventListener('click', () => changeWeek(7));

    // Save/Load workout buttons in index.html
    document.getElementById('save-workout')?.addEventListener('click', () => {
        saveWorkoutData();
        alert('Workout data saved.');
    });

    document.getElementById('load-workout')?.addEventListener('click', () => {
        loadWorkoutData();
        renderWorkouts();
        alert('Workout data loaded.');
    });

    // Exercise item click in manage_exercises.html
    if (document.getElementById('exercise-list')) {
        document.getElementById('exercise-list').addEventListener('click', (event) => {
            const exerciseItem = event.target.closest('.exercise-item');
            if (exerciseItem) {
                const category = exerciseItem.dataset.category;
                const exerciseName = exerciseItem.dataset.name;
                viewExerciseDetails(exerciseName, category);
            }
        });
    }

    // Close details modal in manage_exercises.html
    document.getElementById('close-details-modal')?.addEventListener('click', closeDetailsModal);

    // Edit and Save buttons in manage_exercises.html
    document.getElementById('edit-exercise-btn')?.addEventListener('click', enableEditMode);
    document.getElementById('save-exercise-btn')?.addEventListener('click', saveExerciseChanges);

    // Filter exercises in manage_exercises.html
    document.getElementById('filter-category')?.addEventListener('change', renderExerciseList);
}

// Initialize default exercises if none exist
function initializeDefaultExercises() {
    if (Object.keys(userExercises).length === 0) {
        userExercises = JSON.parse(JSON.stringify(exercises));
        saveUserExercises();
    }
}

// Call during initialization
document.addEventListener('DOMContentLoaded', () => {
    loadUserExercises();
    loadWorkoutData();
    initializeDefaultExercises();
    preventModalOnLoad();
    setupModalEventListeners();

    if (window.location.pathname.endsWith('manage_exercises.html')) {
        initManageExercises();
    } else {
        setupEventListeners();
        updateWeekDisplay();
    }
});

// Prevent modals from showing on page load
function preventModalOnLoad() {
    document.getElementById('exercise-modal')?.classList.remove('show');
    document.getElementById('exercise-details-modal')?.classList.remove('show');
}

// Update exercise options when category is selected
function updateExerciseOptions() {
    const category = categorySelect.value;
    exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';

    if (category) {
        const builtInExercises = exercises[category] || [];
        const customExercises = userExercises[category] || [];
        const allExercises = [...builtInExercises, ...customExercises];

        allExercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.name;
            option.textContent = exercise.name;
            exerciseSelect.appendChild(option);
        });
    }
}

// Functions for manage_exercises.html
function initManageExercises() {
    initializeExerciseForm();
    renderExerciseList();
    setupEditMode();
    setupManageEventListeners();
}

function initializeExerciseForm() {
    const newExerciseForm = document.getElementById('new-exercise-form');
    const newCategorySelect = document.getElementById('new-exercise-category');
    const directMusclesContainer = document.getElementById('direct-muscles');
    const indirectMusclesContainer = document.getElementById('indirect-muscles');

    newCategorySelect.addEventListener('change', () => {
        updateMuscleOptions(newCategorySelect.value, directMusclesContainer, indirectMusclesContainer);
    });

    newExerciseForm.addEventListener('submit', (event) => {
        event.preventDefault();
        addNewExercise();
    });
}

function renderExerciseList() {
    const exerciseList = document.getElementById('exercise-list');
    const filterCategory = document.getElementById('filter-category').value;
    exerciseList.innerHTML = '';

    const categories = filterCategory ? [filterCategory] : Object.keys(userExercises);

    categories.forEach(category => {
        const exercisesInCategory = userExercises[category] || [];
        exercisesInCategory.forEach(exercise => {
            const exerciseItem = document.createElement('div');
            exerciseItem.classList.add('exercise-item');
            exerciseItem.dataset.category = category;
            exerciseItem.dataset.name = exercise.name;

            exerciseItem.innerHTML = `
                <span>${exercise.name}</span>
                <i class="fas fa-chevron-right"></i>
            `;

            exerciseItem.addEventListener('click', () => {
                viewExerciseDetails(exercise.name, category);
            });

            exerciseList.appendChild(exerciseItem);
        });
    });
}

function viewExerciseDetails(exerciseName, category) {
    const exerciseData = userExercises[category].find(e => e.name === exerciseName);
    if (!exerciseData) return;

    currentEditingExercise = { ...exerciseData, originalCategory: category };

    const detailsContent = document.getElementById('exercise-details-content');
    const editForm = document.getElementById('edit-exercise-form');
    const editButton = document.getElementById('edit-exercise-btn');
    const saveButton = document.getElementById('save-exercise-btn');

    detailsContent.innerHTML = `
        <div class="exercise-details-label">Name:</div>
        <div>${exerciseData.name}</div>
        <div class="exercise-details-label">Category:</div>
        <div>${category}</div>
        <div class="exercise-details-label">Primary Muscles:</div>
        <div>${exerciseData.muscles?.primary?.join(', ') || 'None'}</div>
        <div class="exercise-details-label">Secondary Muscles:</div>
        <div>${exerciseData.muscles?.secondary?.join(', ') || 'None'}</div>
    `;

    editButton.style.display = 'inline-block';
    saveButton.style.display = 'none';
    editForm.style.display = 'none';
    detailsContent.style.display = 'grid';
    detailsModal.classList.add('show');
}

function closeDetailsModal() {
    detailsModal.classList.remove('show');
    currentEditingExercise = null;
}

function enableEditMode() {
    const editForm = document.getElementById('edit-exercise-form');
    const detailsContent = document.getElementById('exercise-details-content');
    const editButton = document.getElementById('edit-exercise-btn');
    const saveButton = document.getElementById('save-exercise-btn');

    editForm.style.display = 'block';
    detailsContent.style.display = 'none';
    editButton.style.display = 'none';
    saveButton.style.display = 'inline-block';

    document.getElementById('edit-exercise-name').value = currentEditingExercise.name;
    document.getElementById('edit-exercise-category').value = currentEditingExercise.category;

    const directMusclesContainer = document.getElementById('edit-direct-muscles');
    const indirectMusclesContainer = document.getElementById('edit-indirect-muscles');
    
    updateMuscleOptions(currentEditingExercise.category, directMusclesContainer, indirectMusclesContainer);

    setTimeout(() => {
        currentEditingExercise.muscles.primary.forEach(muscle => {
            const muscleElement = directMusclesContainer.querySelector(`[data-muscle="${muscle}"]`);
            if (muscleElement) muscleElement.classList.add('selected');
        });
        currentEditingExercise.muscles.secondary.forEach(muscle => {
            const muscleElement = indirectMusclesContainer.querySelector(`[data-muscle="${muscle}"]`);
            if (muscleElement) muscleElement.classList.add('selected');
        });
    }, 0);
}

function saveExerciseChanges() {
    const newName = document.getElementById('edit-exercise-name').value.trim();
    const newCategory = document.getElementById('edit-exercise-category').value;
    const directMuscles = Array.from(document.querySelectorAll('#edit-direct-muscles .muscle-option.selected'))
        .map(el => el.dataset.muscle);
    const indirectMuscles = Array.from(document.querySelectorAll('#edit-indirect-muscles .muscle-option.selected'))
        .map(el => el.dataset.muscle);

    if (!newName || !newCategory || !directMuscles.length) {
        alert('Please fill in all required fields');
        return;
    }

    // Remove from old category if category changed
    if (currentEditingExercise.originalCategory !== newCategory) {
        userExercises[currentEditingExercise.originalCategory] = userExercises[currentEditingExercise.originalCategory].filter(ex => ex.name !== currentEditingExercise.name);
    } else {
        // Remove the old exercise
        userExercises[newCategory] = userExercises[newCategory].filter(ex => ex.name !== currentEditingExercise.name);
    }

    // Add updated exercise
    const updatedExercise = {
        name: newName,
        category: newCategory,
        muscles: {
            primary: directMuscles,
            secondary: indirectMuscles
        }
    };

    if (!userExercises[newCategory]) {
        userExercises[newCategory] = [];
    }
    userExercises[newCategory].push(updatedExercise);

    saveUserExercises();
    renderExerciseList();

    // Close modal
    document.getElementById('exercise-details-modal').classList.remove('show');
}

function updateMuscleOptions(category, directContainer, indirectContainer) {
    // Clear current options
    directContainer.innerHTML = '';
    indirectContainer.innerHTML = '';

    // Add suggested primary muscles based on category
    if (category && muscleGroups[category]) {
        muscleGroups[category].forEach(muscle => {
            const muscleOption = document.createElement('div');
            muscleOption.classList.add('muscle-option');
            muscleOption.dataset.muscle = muscle;
            muscleOption.textContent = muscle;
            muscleOption.addEventListener('click', () => toggleMuscleSelection(muscleOption));

            directContainer.appendChild(muscleOption);
        });
    }

    // Add all muscles as secondary options
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

function addNewExercise() {
    const name = document.getElementById('new-exercise-name').value.trim();
    const category = document.getElementById('new-exercise-category').value;
    const directMuscles = Array.from(document.querySelectorAll('#direct-muscles .muscle-option.selected'))
        .map(el => el.dataset.muscle);
    const indirectMuscles = Array.from(document.querySelectorAll('#indirect-muscles .muscle-option.selected'))
        .map(el => el.dataset.muscle);

    if (!name || !category || !directMuscles.length) {
        alert('Please fill in all required fields');
        return;
    }

    // Initialize category if it doesn't exist
    if (!userExercises[category]) {
        userExercises[category] = [];
    }

    // Check for duplicate exercise
    const exists = userExercises[category].some(ex => ex.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        alert('An exercise with this name already exists in the selected category.');
        return;
    }

    // Create and add new exercise
    const newExercise = {
        name: name,
        category: category,
        muscles: {
            primary: directMuscles,
            secondary: indirectMuscles
        }
    };

    userExercises[category].push(newExercise);

    saveUserExercises();
    renderExerciseList();
    resetNewExerciseFields();

    alert('Exercise added successfully!');
}

function resetNewExerciseFields() {
    document.getElementById('new-exercise-name').value = '';
    document.getElementById('new-exercise-category').value = '';
    document.querySelectorAll('.muscle-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.getElementById('direct-muscles').innerHTML = '';
    document.getElementById('indirect-muscles').innerHTML = '';
}

function setupEditMode() {
    // Edit button click handler is already set up in setupEventListeners()
}

function setupManageEventListeners() {
    // Close modal
    document.getElementById('close-details-modal').addEventListener('click', closeDetailsModal);

    // Edit category change
    document.getElementById('edit-exercise-category').addEventListener('change', () => {
        const newCategory = document.getElementById('edit-exercise-category').value;
        const directMusclesContainer = document.getElementById('edit-direct-muscles');
        const indirectMusclesContainer = document.getElementById('edit-indirect-muscles');
        updateMuscleOptions(newCategory, directMusclesContainer, indirectMusclesContainer);
    });
}

// Ensure modals are closed on page load
window.addEventListener('load', preventModalOnLoad);

// Error handling wrapper
function handleError(fn) {
    return function(...args) {
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
saveExerciseChanges = handleError(saveExerciseChanges);
deleteExercise = handleError(deleteExercise);

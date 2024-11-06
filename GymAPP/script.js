// Built-in exercises database
const exercises = {
    chest: [
        { name: 'Bench Press', muscles: { primary: ['Chest', 'Front Delts'], secondary: ['Triceps'] } },
        { name: 'Dumbbell Press', muscles: { primary: ['Chest'], secondary: ['Front Delts', 'Triceps'] } },
        // Add more exercises as needed
    ],
    back: [
        { name: 'Pull-ups', muscles: { primary: ['Lats'], secondary: ['Biceps', 'Rhomboids'] } },
        { name: 'Barbell Row', muscles: { primary: ['Lats', 'Rhomboids'], secondary: ['Biceps', 'Rear Delts'] } },
        // Add more exercises as needed
    ],
    shoulders: [
        { name: 'Overhead Press', muscles: { primary: ['Front Delts'], secondary: ['Side Delts', 'Triceps'] } },
        { name: 'Lateral Raise', muscles: { primary: ['Side Delts'], secondary: ['Traps'] } },
        // Add more exercises as needed
    ],
    arms: [
        { name: 'Bicep Curl', muscles: { primary: ['Biceps'], secondary: ['Forearms'] } },
        { name: 'Tricep Extension', muscles: { primary: ['Triceps'], secondary: [] } },
        // Add more exercises as needed
    ],
    legs: [
        { name: 'Squat', muscles: { primary: ['Quads', 'Glutes'], secondary: ['Hamstrings', 'Core'] } },
        { name: 'Deadlift', muscles: { primary: ['Hamstrings', 'Glutes'], secondary: ['Lower Back', 'Quads'] } },
        // Add more exercises as needed
    ],
    core: [
        { name: 'Plank', muscles: { primary: ['Core'], secondary: ['Shoulders'] } },
        { name: 'Crunch', muscles: { primary: ['Abs'], secondary: ['Hip Flexors'] } },
        // Add more exercises as needed
    ]
};

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

// Global state management
let userExercises = {};
let workoutData = {};
let currentDate = new Date();
let currentDay = null;

// Storage functions
function loadUserExercises() {
    const saved = localStorage.getItem('userExercises');
    if (saved) {
        userExercises = JSON.parse(saved);
    } else {
        // Initialize with default exercises
        userExercises = {
            chest: [
                { name: 'Bench Press', category: 'chest', muscles: { primary: ['Chest', 'Front Delts'], secondary: ['Triceps'] } },
                { name: 'Dumbbell Press', category: 'chest', muscles: { primary: ['Chest'], secondary: ['Front Delts', 'Triceps'] } }
            ],
            back: [
                { name: 'Pull-ups', category: 'back', muscles: { primary: ['Lats'], secondary: ['Biceps', 'Rhomboids'] } },
                { name: 'Barbell Row', category: 'back', muscles: { primary: ['Lats', 'Rhomboids'], secondary: ['Biceps', 'Rear Delts'] } }
            ],
            // ... add other default exercises as needed
        };
        saveUserExercises(); // Save initial exercises
    }
}

function saveUserExercises() {
    localStorage.setItem('userExercises', JSON.stringify(userExercises));
}

function loadWorkoutData() {
    const saved = localStorage.getItem('workoutData');
    workoutData = saved ? JSON.parse(saved) : {};
}

function saveWorkoutData() {
    localStorage.setItem('workoutData', JSON.stringify(workoutData));
}

// Week management
function getWeekKey(date = currentDate) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
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
        }
        Object.keys(workoutData[oldWeekKey]).forEach(day => {
            const repeatingExercises = workoutData[oldWeekKey][day]?.filter(ex => ex.repeating) || [];
            if (repeatingExercises.length > 0) {
                if (!workoutData[newWeekKey][day]) {
                    workoutData[newWeekKey][day] = [];
                }
                repeatingExercises.forEach(ex => {
                    workoutData[newWeekKey][day].push({
                        ...ex,
                        actualReps: Array(ex.sets).fill(''),
                        actualRIRs: Array(ex.sets).fill(''),
                        weights: Array(ex.sets).fill('')
                    });
                });
            }
        });
        saveWorkoutData();
    }

    updateWeekDisplay();
}

function updateWeekDisplay() {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-week').textContent = 
        `Week of ${currentDate.toLocaleDateString(undefined, options)}`;
    renderWorkouts();
}

// Exercise management
function addExercise() {
    const exerciseData = {
        exercise: exerciseSelect.value,
        sets: parseInt(document.getElementById('exercise-sets').value),
        repGoal: document.getElementById('exercise-rep-range').value,
        rirGoal: document.getElementById('exercise-rir-range').value,
        repeating: document.getElementById('exercise-repeating').checked,
        actualReps: Array(parseInt(document.getElementById('exercise-sets').value)).fill(''),
        actualRIRs: Array(parseInt(document.getElementById('exercise-sets').value)).fill(''),
        weights: Array(parseInt(document.getElementById('exercise-sets').value)).fill('')
    };

    if (!exerciseData.exercise || !exerciseData.sets || !exerciseData.repGoal || !exerciseData.rirGoal) {
        alert('Please fill in all required fields');
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

function deleteExercise(day, index) {
    const weekKey = getWeekKey();
    if (confirm('Are you sure you want to delete this exercise?')) {
        workoutData[weekKey][day].splice(index, 1);
        saveWorkoutData();
        renderWorkouts();
    }
}

// Modal management
function openModal(day) {
    currentDay = day;
    resetModalFields();
    document.getElementById('exercise-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('exercise-modal').classList.remove('show');
    resetModalFields();
}

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
    // Add exercise buttons
    document.querySelectorAll('.add-exercise').forEach(button => {
        button.addEventListener('click', (e) => {
            openModal(e.target.closest('.day').dataset.day);
        });
    });

    // Modal controls
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('add-exercise-btn').addEventListener('click', addExercise);
    
    // Category selection
    categorySelect.addEventListener('change', updateExerciseOptions);

    // Week navigation
    document.getElementById('prev-week').addEventListener('click', () => changeWeek(-7));
    document.getElementById('next-week').addEventListener('click', () => changeWeek(7));

    // Save/Load workout buttons
    document.getElementById('save-workout')?.addEventListener('click', () => {
        const weekKey = getWeekKey();
        const workout = workoutData[weekKey];
        const blob = new Blob([JSON.stringify(workout, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workout-${weekKey}.json`;
        a.click();
    });

    document.getElementById('load-workout')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const weekKey = getWeekKey();
                workoutData[weekKey] = JSON.parse(event.target.result);
                saveWorkoutData();
                renderWorkouts();
            };
            reader.readAsText(file);
        };
        input.click();
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('manage_exercises.html')) {
        loadUserExercises();
        initializeExerciseForm();
        renderExerciseList();
        setupEditMode();
    } else {
        loadUserExercises();
        loadWorkoutData();
        updateWeekDisplay();
        setupEventListeners();
    }
});

// Keep all other existing functions (renderWorkouts, exercise management, etc.)
// ... (rest of your existing code)

// Update exercise options when category is selected
function updateExerciseOptions() {
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

// DOM Elements
const modal = document.getElementById('exercise-modal');
const categorySelect = document.getElementById('exercise-category');
const exerciseSelect = document.getElementById('exercise-select');

function loadWorkoutData() {
    const saved = localStorage.getItem('workoutData');
    workoutData = saved ? JSON.parse(saved) : {};
}

function saveWorkoutData() {
    localStorage.setItem('workoutData', JSON.stringify(workoutData));
}

function updateWeekDisplay() {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-week').textContent = 
        `Week of ${currentDate.toLocaleDateString(undefined, options)}`;
    renderWorkouts();
}

function setupEventListeners() {
    // Add exercise buttons
    document.querySelectorAll('.add-exercise').forEach(button => {
        button.addEventListener('click', (event) => {
            currentDay = event.target.closest('.day').dataset.day;
            modal.style.display = 'flex'; // Change 'block' to 'flex'
        });
    });

    // Category selection
    categorySelect.addEventListener('change', updateExerciseOptions);

    // Modal controls
    document.getElementById('close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.getElementById('add-exercise-btn').addEventListener('click', addExercise);

    // Week navigation
    document.getElementById('prev-week').addEventListener('click', () => {
        changeWeek(-7);
    });

    document.getElementById('next-week').addEventListener('click', () => {
        changeWeek(7);
    });

    // Manage exercises
    if (document.getElementById('add-new-exercise-btn')) {
        document.getElementById('add-new-exercise-btn').addEventListener('click', addNewExercise);
    }
}

// Update the addExercise function to include new parameters
function addExercise() {
    const exercise = exerciseSelect.value;
    const sets = document.getElementById('exercise-sets').value;
    const repGoal = document.getElementById('exercise-rep-range').value;
    const rirGoal = document.getElementById('exercise-rir-range').value;
    const repeating = document.getElementById('exercise-repeating').checked;

    if (!exercise || !sets || !repGoal || !rirGoal) {
        alert('Please fill in all required fields');
        return;
    }

    const weekKey = getWeekKey();
    if (!workoutData[weekKey]) workoutData[weekKey] = {};
    if (!workoutData[weekKey][currentDay]) workoutData[weekKey][currentDay] = [];

    workoutData[weekKey][currentDay].push({
        exercise,
        sets: parseInt(sets),
        repGoal,
        rirGoal,
        repeating,
        actualReps: Array(parseInt(sets)).fill(''),
        actualRIRs: Array(parseInt(sets)).fill(''),
        weights: Array(parseInt(sets)).fill('')
    });

    saveWorkoutData();
    renderWorkouts();
    modal.style.display = 'none';
    resetModalFields();
}

// Update renderWorkouts to use the new layout
function renderWorkouts() {
    const weekKey = getWeekKey();
    document.querySelectorAll('.day').forEach(dayElement => {
        const day = dayElement.dataset.day;
        const exercisesList = dayElement.querySelector('.exercises-list');
        exercisesList.innerHTML = '';

        if (workoutData[weekKey] && workoutData[weekKey][day]) {
            workoutData[weekKey][day].forEach((exerciseData, index) => {
                const exerciseItem = document.createElement('div');
                exerciseItem.className = 'exercise-item';

                // Create header with exercise name and delete button
                const header = document.createElement('div');
                header.className = 'exercise-header';
                header.innerHTML = `
                    <strong>${exerciseData.exercise}</strong>
                    <button class="delete-exercise" title="Delete Exercise">&times;</button>
                `;
                exerciseItem.appendChild(header);

                // Create exercise details section
                const details = document.createElement('div');
                details.className = 'exercise-details';
                details.innerHTML = `
                    <div>Sets: ${exerciseData.sets}</div>
                    <div>Goal Reps: ${exerciseData.repGoal}</div>
                    <div>Goal RIR: ${exerciseData.rirGoal}</div>
                `;
                exerciseItem.appendChild(details);

                // Create sets tracking
                const setsContainer = document.createElement('div');
                setsContainer.className = 'sets-container';
                
                for (let i = 0; i < exerciseData.sets; i++) {
                    const setDiv = document.createElement('div');
                    setDiv.className = 'set-info';
                    setDiv.innerHTML = `
                        <input type="number" class="actual-reps" 
                            data-day="${day}" data-index="${index}" data-set="${i}"
                            value="${exerciseData.actualReps[i] || ''}" 
                            placeholder="Reps">
                        <input type="number" class="actual-rir"
                            data-day="${day}" data-index="${index}" data-set="${i}"
                            value="${exerciseData.actualRIRs[i] || ''}"
                            placeholder="RIR">
                        <input type="number" class="actual-weight"
                            data-day="${day}" data-index="${index}" data-set="${i}"
                            value="${exerciseData.weights[i] || ''}"
                            placeholder="kg">
                    `;
                    setsContainer.appendChild(setDiv);
                }
                exerciseItem.appendChild(setsContainer);

                // Add delete functionality
                const deleteBtn = header.querySelector('.delete-exercise');
                deleteBtn.onclick = () => deleteExercise(day, index);

                exercisesList.appendChild(exerciseItem);
            });
        }
    });
}

// Save actual progress when inputs change
function saveActualProgress(event) {
    const input = event.target;
    const day = input.dataset.day;
    const index = input.dataset.index;
    const set = input.dataset.set;
    const weekKey = getWeekKey();
    const exerciseData = workoutData[weekKey][day][index];

    if (input.classList.contains('actual-reps')) {
        exerciseData.actualReps[set] = input.value;
    } else if (input.classList.contains('actual-rir')) {
        exerciseData.actualRIRs[set] = input.value;
    } else if (input.classList.contains('actual-weight')) {
        exerciseData.weights[set] = input.value;
    }

    saveWorkoutData();
}

// Update changeWeek to copy repeating exercises
function changeWeek(days) {
    const oldDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + days);
    const oldWeekKey = getWeekKeyForDate(oldDate);
    const newWeekKey = getWeekKey();

    if (days !== 0 && workoutData[oldWeekKey]) {
        workoutData[newWeekKey] = {};
        Object.keys(workoutData[oldWeekKey]).forEach(day => {
            const repeatingExercises = workoutData[oldWeekKey][day].filter(ex => ex.repeating);
            if (repeatingExercises.length > 0) {
                workoutData[newWeekKey][day] = repeatingExercises.map(ex => ({
                    ...ex,
                    actualReps: Array(ex.sets).fill(''),
                    actualRIRs: Array(ex.sets).fill(''),
                    weights: Array(ex.sets).fill('')
                }));
            }
        });
        saveWorkoutData();
    }

    updateWeekDisplay();
}

// Helper function to get week key for a specific date
function getWeekKeyForDate(dateObj) {
    const date = new Date(dateObj);
    date.setDate(date.getDate() - date.getDay());
    return date.toISOString().split('T')[0];
}

// Modify getWeekKey to use currentDate by default
function getWeekKey() {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - date.getDay());
    return date.toISOString().split('T')[0];
}

function deleteExercise(day, index) {
    const weekKey = getWeekKey();
    if (confirm('Are you sure you want to delete this exercise?')) {
        workoutData[weekKey][day].splice(index, 1);
        saveWorkoutData();
        renderWorkouts();
    }
}

// Adjust resetModalFields to reset new inputs
function resetModalFields() {
    categorySelect.value = '';
    exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';
    document.getElementById('exercise-sets').value = '';
    document.getElementById('exercise-rep-range').value = '';
    document.getElementById('exercise-rir-range').value = '';
    document.getElementById('exercise-repeating').checked = false;
}

let currentEditingExercise = null;

function showExerciseDetails(exercise, type, category) {
    const detailsModal = document.getElementById('exercise-details-modal');
    const detailsContent = document.getElementById('exercise-details-content');
    const editForm = document.getElementById('edit-exercise-form');
    const editButton = document.getElementById('edit-exercise-btn');
    const saveButton = document.getElementById('save-exercise-btn');
    
    const exerciseData = userExercises[category].find(e => e.name === exercise);
    if (!exerciseData) return;

    currentEditingExercise = { ...exerciseData, originalCategory: category };

    detailsContent.innerHTML = `
        <div class="exercise-details-label">Name:</div>
        <div>${exerciseData.name}</div>
        <div class="exercise-details-label">Category:</div>
        <div>${exerciseData.category}</div>
        <div class="exercise-details-label">Primary Muscles:</div>
        <div>${exerciseData.muscles.primary.join(', ') || 'None'}</div>
        <div class="exercise-details-label">Secondary Muscles:</div>
        <div>${exerciseData.muscles.secondary.join(', ') || 'None'}</div>
    `;

    editButton.style.display = 'inline-block';
    saveButton.style.display = 'none';
    editForm.style.display = 'none';

    detailsModal.style.display = 'flex';
}

function setupEditMode() {
    // Edit button click handler
    document.getElementById('edit-exercise-btn').addEventListener('click', enableEditMode);
    
    // Save button click handler
    document.getElementById('save-exercise-btn').addEventListener('click', saveExerciseChanges);
}

function enableEditMode() {
    const editForm = document.getElementById('edit-exercise-form');
    const detailsContent = document.getElementById('exercise-details-content');
    const editButton = document.getElementById('edit-exercise-btn');
    const saveButton = document.getElementById('save-exercise-btn');

    // Show edit form, hide display content
    editForm.style.display = 'block';
    detailsContent.style.display = 'none';
    editButton.style.display = 'none';
    saveButton.style.display = 'inline-block';

    // Populate edit form with current values
    document.getElementById('edit-exercise-name').value = currentEditingExercise.name;
    document.getElementById('edit-exercise-category').value = currentEditingExercise.category;

    // Update muscle options
    updateMuscleOptions(
        currentEditingExercise.category,
        document.getElementById('edit-direct-muscles'),
        document.getElementById('edit-indirect-muscles')
    );

    // Pre-select current muscles
    setTimeout(() => {
        currentEditingExercise.muscles.primary.forEach(muscle => {
            const option = document.querySelector(`#edit-direct-muscles .muscle-option[data-muscle="${muscle}"]`);
            if (option) option.classList.add('selected');
        });

        currentEditingExercise.muscles.secondary.forEach(muscle => {
            const option = document.querySelector(`#edit-indirect-muscles .muscle-option[data-muscle="${muscle}"]`);
            if (option) option.classList.add('selected');
        });
    }, 0);
}

function saveExerciseChanges() {
    const newName = document.getElementById('edit-exercise-name').value.trim();
    const newCategory = document.getElementById('edit-exercise-category').value;
    const newDirectMuscles = Array.from(document.querySelectorAll('#edit-direct-muscles .muscle-option.selected'))
        .map(el => el.dataset.muscle);
    const newIndirectMuscles = Array.from(document.querySelectorAll('#edit-indirect-muscles .muscle-option.selected'))
        .map(el => el.dataset.muscle);

    if (!newName || !newCategory || !newDirectMuscles.length) {
        alert('Please fill in all required fields');
        return;
    }

    // Initialize category array if it doesn't exist
    if (!userExercises[newCategory]) {
        userExercises[newCategory] = [];
    }

    const updatedExercise = {
        name: newName,
        category: newCategory,
        muscles: {
            primary: newDirectMuscles,
            secondary: newIndirectMuscles
        }
    };

    // Handle built-in exercise editing
    if (currentEditingExercise.originalType === 'built-in') {
        // Check if a custom version already exists
        const existingCustomVersion = userExercises[newCategory].find(
            e => e.originalName === currentEditingExercise.name
        );

        if (existingCustomVersion) {
            // Update existing custom version
            Object.assign(existingCustomVersion, updatedExercise);
            existingCustomVersion.originalName = currentEditingExercise.name;
        } else {
            // Create new custom version
            updatedExercise.originalName = currentEditingExercise.name;
            userExercises[newCategory].push(updatedExercise);
        }
    } else {
        // Handle custom exercise editing
        const oldCategory = currentEditingExercise.originalCategory;
        
        // Remove from old category if category changed
        if (oldCategory !== newCategory) {
            userExercises[oldCategory] = userExercises[oldCategory].filter(
                e => e.name !== currentEditingExercise.name
            );
        }

        // Find and update existing exercise or add new one
        const existingIndex = userExercises[newCategory].findIndex(
            e => e.name === currentEditingExercise.name
        );

        if (existingIndex !== -1) {
            userExercises[newCategory][existingIndex] = updatedExercise;
        } else {
            userExercises[newCategory].push(updatedExercise);
        }
    }

    saveUserExercises();
    renderExerciseList();
    
    // Close modal
    document.getElementById('exercise-details-modal').style.display = 'none';
}

function deleteCustomExercise(exerciseName, category) {
    if (confirm(`Are you sure you want to delete ${exerciseName}?`)) {
        userExercises[category] = userExercises[category].filter(e => e.name !== exerciseName);
        saveUserExercises();
        renderExerciseList();
        document.getElementById('exercise-details-modal').style.display = 'none';
    }
}

// Update renderExerciseList function
function renderExerciseList() {
    const exerciseList = document.getElementById('exercise-list');
    if (!exerciseList) return;
    
    exerciseList.innerHTML = '';
    
    // Display user-added exercises
    for (const category in userExercises) {
        const exerciseArray = userExercises[category];
        exerciseArray.forEach(exercise => {
            const div = document.createElement('div');
            div.className = 'exercise-item';
            div.innerHTML = `
                <span>${exercise.name} (${category})</span>
                <button class="delete-exercise" title="Delete Exercise">×</button>
            `;
            
            // Prevent click propagation on delete button
            const deleteBtn = div.querySelector('.delete-exercise');
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteCustomExercise(exercise.name, category);
            };
            
            // Show details when clicking on the exercise name
            div.querySelector('span').onclick = () => showExerciseDetails(exercise.name, category);
            
            exerciseList.appendChild(div);
        });
    }
}

// Simplified initialization
function initializeExerciseForm() {
    const categorySelect = document.getElementById('new-exercise-category');
    const directMusclesSelect = document.getElementById('direct-muscles');
    const indirectMusclesSelect = document.getElementById('indirect-muscles');

    // Add category change listener
    categorySelect.addEventListener('change', function() {
        const category = this.value;
        updateMuscleOptions(category, directMusclesSelect, indirectMusclesSelect);
    });

    // Make sure the add button has the correct event listener
    const addButton = document.getElementById('add-new-exercise-btn');
    if (addButton) {
        addButton.addEventListener('click', addNewExercise);
    }
}

// Simplified muscle options update
function updateMuscleOptions(category, directContainer, indirectContainer) {
    // Clear current options
    directContainer.innerHTML = '';
    indirectContainer.innerHTML = '';

    // Add suggested primary muscles based on category
    if (category && muscleGroups[category]) {
        muscleGroups[category].forEach(muscle => {
            const option = document.createElement('div');
            option.className = 'muscle-option';
            option.dataset.muscle = muscle;
            option.textContent = muscle;
            option.addEventListener('click', () => toggleMuscleSelection(option));
            directContainer.appendChild(option);
        });
    }

    // Add ALL possible muscles as secondary options
    allMuscles.forEach(muscle => {
        const option = document.createElement('div');
        option.className = 'muscle-option';
        option.dataset.muscle = muscle;
        option.textContent = muscle;
        option.addEventListener('click', () => toggleMuscleSelection(option));
        indirectContainer.appendChild(option);
    });
}

function toggleMuscleSelection(element) {
    if (element) {
        element.classList.toggle('selected');
    }
}

// Update addNewExercise function
function addNewExercise(event) {
    event.preventDefault();

    const name = document.getElementById('new-exercise-name').value.trim();
    const category = document.getElementById('new-exercise-category').value;
    
    const directMuscles = Array.from(document.querySelectorAll('#direct-muscles .muscle-option.selected'))
        .map(el => el.dataset.muscle);
    const indirectMuscles = Array.from(document.querySelectorAll('#indirect-muscles .muscle-option.selected'))
        .map(el => el.dataset.muscle);

    if (!name || !category) {
        alert('Please enter exercise name and select category');
        return;
    }

    if (!directMuscles.length) {
        alert('Please select at least one primary muscle');
        return;
    }

    // Initialize category if it doesn't exist
    if (!userExercises[category]) {
        userExercises[category] = [];
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
    
    // Save to localStorage
    saveUserExercises();

    // Reset form
    document.getElementById('new-exercise-name').value = '';
    document.getElementById('new-exercise-category').value = '';
    document.querySelectorAll('.muscle-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Clear muscle options
    document.getElementById('direct-muscles').innerHTML = '';
    document.getElementById('indirect-muscles').innerHTML = '';

    // Update display
    renderExerciseList();

    // Show success message
    alert('Exercise added successfully!');
}

function resetNewExerciseFields() {
    document.getElementById('new-exercise-name').value = '';
    document.getElementById('new-exercise-category').value = '';
    document.getElementById('direct-muscles').selectedIndex = -1;
    document.getElementById('indirect-muscles').selectedIndex = -1;
}

function viewExerciseDetails(exercise, category) {
    const exerciseInfo = exercises[category].find(e => e.name === exercise);
    if (!exerciseInfo) return;

    const details = `
        Exercise: ${exerciseInfo.name}
        Category: ${exerciseInfo.category}
        Primary Muscles: ${exerciseInfo.muscles.primary.join(', ')}
        Secondary Muscles: ${exerciseInfo.muscles.secondary.join(', ')}
    `;
    
    alert(details);
}

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('manage_exercises.html')) {
        console.log('Initializing manage exercises page');
        loadUserExercises(); // Load saved exercises
        initializeExerciseForm(); // Setup the form
        renderExerciseList(); // Show existing exercises
        
        // Debug log
        console.log('User exercises loaded:', userExercises);
        
        const addButton = document.getElementById('add-new-exercise-btn');
        if (addButton) {
            addButton.addEventListener('click', addNewExercise);
        }
        setupEditMode();
    } else {
        init();
    }

    // Add modal close handler
    const detailsModal = document.getElementById('exercise-details-modal');
    if (detailsModal) {
        document.getElementById('close-details-modal').onclick = () => {
            detailsModal.style.display = 'none';
        };

        // Close modal when clicking outside
        detailsModal.onclick = (e) => {
            if (e.target === detailsModal) {
                detailsModal.style.display = 'none';
            }
        };
    }
});

// Ensure loadUserExercises is called during initialization
function init() {
    loadUserExercises();
    loadWorkoutData();
    updateWeekDisplay();
    setupEventListeners();
}

// Modify updateExerciseOptions to include both custom and built-in exercises
function updateExerciseOptions() {
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

// Adjust modal display style when opening to center it
document.querySelectorAll('.add-exercise').forEach(button => {
    button.addEventListener('click', (event) => {
        currentDay = event.target.closest('.day').dataset.day;
        modal.style.display = 'flex'; // Change 'block' to 'flex'
    });
});

// Fix modal display logic
document.querySelectorAll('.add-exercise').forEach(button => {
    button.addEventListener('click', (event) => {
        currentDay = event.target.closest('.day').dataset.day;
        modal.classList.add('show');
    });
});

document.getElementById('close-modal').addEventListener('click', () => {
    modal.classList.remove('show');
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.classList.remove('show');
    }
});

// Reset modal display on page load
document.addEventListener('DOMContentLoaded', () => {
    modal.classList.remove('show');
    // ...rest of your initialization code...
});

// ...existing code...
// Exercise categories and data
const exercises = {
    chest: ['Bench Press', 'Incline Press', 'Dumbbell Flyes'],
    back: ['Pull-ups', 'Rows', 'Deadlift'],
    legs: ['Squats', 'Leg Press', 'Lunges'],
    shoulders: ['Overhead Press', 'Lateral Raises', 'Front Raises'],
    arms: ['Bicep Curls', 'Tricep Extensions', 'Hammer Curls'],
    core: ['Planks', 'Crunches', 'Russian Twists']
};

const muscleGroups = {
    chest: ['Upper Chest', 'Middle Chest', 'Lower Chest'],
    back: ['Upper Back', 'Lower Back', 'Lats', 'Traps'],
    shoulders: ['Front Deltoid', 'Side Deltoid', 'Rear Deltoid'],
    arms: ['Biceps', 'Triceps', 'Forearms'],
    legs: ['Quads', 'Hamstrings', 'Calves', 'Glutes'],
    core: ['Rectus Abdominis', 'Obliques', 'Lower Back']
};

// Initialize userExercises object
let userExercises = {};

// Load user exercises from localStorage
function loadUserExercises() {
    const savedExercises = localStorage.getItem('userExercises');
    userExercises = savedExercises ? JSON.parse(savedExercises) : {};
}

// Save user exercises to localStorage
function saveUserExercises() {
    localStorage.setItem('userExercises', JSON.stringify(userExercises));
}

// Current week data
let currentDate = new Date();
let workoutData = {};

// DOM Elements
const modal = document.getElementById('exercise-modal');
const categorySelect = document.getElementById('exercise-category');
const exerciseSelect = document.getElementById('exercise-select');
let currentDay = null;

// Initialize
function init() {
    loadUserExercises();
    loadWorkoutData();
    updateWeekDisplay();
    setupEventListeners();
    // Remove or comment out initializeExerciseForm();
    // Remove or adjust renderExerciseList() if necessary
}

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
            modal.style.display = 'block';
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

// Modify updateExerciseOptions to include userExercises
function updateExerciseOptions() {
    const category = categorySelect.value;
    exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';

    // First add built-in exercises
    if (category && exercises[category]) {
        exercises[category].forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            option.textContent = `${exercise} (Built-in)`;
            exerciseSelect.appendChild(option);
        });
    }

    // Then add user-created exercises
    if (category && userExercises[category]) {
        userExercises[category].forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.name;
            option.textContent = `${exercise.name} (Custom)`;
            exerciseSelect.appendChild(option);
        });
    }
}

function addExercise() {
    const exercise = exerciseSelect.value;
    const sets = document.getElementById('exercise-sets').value;
    const reps = document.getElementById('exercise-reps').value;
    const weight = document.getElementById('exercise-weight').value;

    if (!exercise || !sets || !reps) {
        alert('Please fill in all required fields');
        return;
    }

    const weekKey = getWeekKey();
    if (!workoutData[weekKey]) {
        workoutData[weekKey] = {};
    }
    if (!workoutData[weekKey][currentDay]) {
        workoutData[weekKey][currentDay] = [];
    }

    workoutData[weekKey][currentDay].push({
        exercise,
        sets,
        reps,
        weight
    });

    saveWorkoutData();
    renderWorkouts();
    modal.style.display = 'none';
    resetModalFields();
}

function getWeekKey() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    return startOfWeek.toISOString().split('T')[0];
}

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
                
                // Exercise info
                const exerciseInfo = document.createElement('span');
                exerciseInfo.textContent = `${exerciseData.exercise} - ${exerciseData.sets} sets x ${exerciseData.reps} reps @ ${exerciseData.weight} kg`;
                exerciseItem.appendChild(exerciseInfo);
                
                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-exercise';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.onclick = () => deleteExercise(day, index);
                exerciseItem.appendChild(deleteBtn);
                
                exercisesList.appendChild(exerciseItem);
            });
        }
    });
}

function deleteExercise(day, index) {
    const weekKey = getWeekKey();
    if (confirm('Are you sure you want to delete this exercise?')) {
        workoutData[weekKey][day].splice(index, 1);
        saveWorkoutData();
        renderWorkouts();
    }
}

function resetModalFields() {
    categorySelect.value = '';
    exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';
    document.getElementById('exercise-sets').value = '';
    document.getElementById('exercise-reps').value = '';
    document.getElementById('exercise-weight').value = '';
}

function changeWeek(days) {
    currentDate.setDate(currentDate.getDate() + days);
    updateWeekDisplay();
}

let currentEditingExercise = null;

function showExerciseDetails(exercise, type, category) {
    const detailsModal = document.getElementById('exercise-details-modal');
    const detailsContent = document.getElementById('exercise-details-content');
    const editForm = document.getElementById('edit-exercise-form');
    const editButton = document.getElementById('edit-exercise-btn');
    const saveButton = document.getElementById('save-exercise-btn');
    
    let exerciseData;
    if (type === 'custom') {
        exerciseData = userExercises[category].find(e => e.name === exercise);
    } else {
        exerciseData = {
            name: exercise,
            category: category,
            muscles: {
                primary: muscleGroups[category] || [],
                secondary: []
            },
            type: 'built-in'
        };
    }

    currentEditingExercise = { ...exerciseData, originalType: type, originalCategory: category };

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

    // If this was a built-in exercise, create a new custom exercise
    if (currentEditingExercise.originalType === 'built-in') {
        if (!userExercises[newCategory]) {
            userExercises[newCategory] = [];
        }
        userExercises[newCategory].push({
            name: newName,
            category: newCategory,
            muscles: {
                primary: newDirectMuscles,
                secondary: newIndirectMuscles
            },
            isCustomVersion: true,
            originalName: currentEditingExercise.name
        });
    } else {
        // Update existing custom exercise
        const oldCategory = currentEditingExercise.originalCategory;
        
        // Remove from old category if category changed
        if (oldCategory !== newCategory) {
            userExercises[oldCategory] = userExercises[oldCategory].filter(
                e => e.name !== currentEditingExercise.name
            );
            if (!userExercises[newCategory]) {
                userExercises[newCategory] = [];
            }
        }

        // Find and update the exercise
        const exerciseIndex = userExercises[newCategory].findIndex(
            e => e.name === currentEditingExercise.name
        );

        const updatedExercise = {
            name: newName,
            category: newCategory,
            muscles: {
                primary: newDirectMuscles,
                secondary: newIndirectMuscles
            }
        };

        if (exerciseIndex !== -1) {
            userExercises[newCategory][exerciseIndex] = updatedExercise;
        } else {
            userExercises[newCategory].push(updatedExercise);
        }
    }

    saveUserExercises();
    renderExerciseList();
    
    // Close modal or return to view mode
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

// Modify the renderExerciseList function
function renderExerciseList() {
    const exerciseList = document.getElementById('exercise-list');
    if (!exerciseList) return;
    
    exerciseList.innerHTML = '';
    
    // Display predefined exercises
    for (const category in exercises) {
        const exerciseArray = exercises[category];
        exerciseArray.forEach(exercise => {
            const div = document.createElement('div');
            div.className = 'exercise-item';
            div.textContent = `${exercise} (${category}) - Built-in`;
            div.onclick = () => showExerciseDetails(exercise, 'built-in', category);
            exerciseList.appendChild(div);
        });
    }

    // Display user-added exercises
    for (const category in userExercises) {
        const exerciseArray = userExercises[category];
        exerciseArray.forEach(exercise => {
            const div = document.createElement('div');
            div.className = 'exercise-item';
            div.textContent = `${exercise.name} (${category}) - Custom`;
            div.onclick = () => showExerciseDetails(exercise.name, 'custom', category);
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
}

// Simplified muscle options update
function updateMuscleOptions(category, directContainer, indirectContainer) {
    // Clear current options
    directContainer.innerHTML = '';
    indirectContainer.innerHTML = '';

    if (category && muscleGroups[category]) {
        // Add primary muscles
        muscleGroups[category].forEach(muscle => {
            const option = document.createElement('div');
            option.className = 'muscle-option';
            option.dataset.muscle = muscle;
            option.textContent = muscle;
            option.addEventListener('click', () => toggleMuscleSelection(option));
            directContainer.appendChild(option);
        });

        // Add all other muscles as secondary
        Object.values(muscleGroups)
            .flat()
            .filter(muscle => !muscleGroups[category].includes(muscle))
            .forEach(muscle => {
                const option = document.createElement('div');
                option.className = 'muscle-option';
                option.dataset.muscle = muscle;
                option.textContent = muscle;
                option.addEventListener('click', () => toggleMuscleSelection(option));
                indirectContainer.appendChild(option);
            });
    }
}

function toggleMuscleSelection(element) {
    element.classList.toggle('selected');
}

// Simplified add new exercise function
function addNewExercise(event) {
    event.preventDefault(); // Prevent form submission

    // Get form values
    const name = document.getElementById('new-exercise-name').value.trim();
    const category = document.getElementById('new-exercise-category').value;
    
    // Get selected muscles
    const directMuscles = Array.from(document.querySelectorAll('#direct-muscles .muscle-option.selected'))
        .map(el => el.dataset.muscle);
    const indirectMuscles = Array.from(document.querySelectorAll('#indirect-muscles .muscle-option.selected'))
        .map(el => el.dataset.muscle);

    // Validation
    if (!name || !category) {
        alert('Please enter exercise name and select category');
        return;
    }

    if (!directMuscles.length) {
        alert('Please select at least one primary muscle');
        return;
    }

    // Create new exercise object
    const newExercise = {
        name: name,
        category: category,
        muscles: {
            primary: directMuscles,
            secondary: indirectMuscles
        }
    };

    // Initialize category if it doesn't exist
    if (!userExercises[category]) {
        userExercises[category] = [];
    }

    // Add the exercise
    userExercises[category].push(newExercise);
    
    // Save to localStorage
    saveUserExercises();

    // Reset form
    document.getElementById('new-exercise-name').value = '';
    document.getElementById('new-exercise-category').value = '';
    document.querySelectorAll('.muscle-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Update exercise list
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
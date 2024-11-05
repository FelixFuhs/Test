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

    // Merge initial exercises and userExercises
    const allExercises = { ...exercises, ...userExercises };

    if (category && allExercises[category]) {
        allExercises[category].forEach(exerciseData => {
            const option = document.createElement('option');
            option.value = exerciseData.name || exerciseData;
            option.textContent = exerciseData.name || exerciseData;
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
            workoutData[weekKey][day].forEach(exerciseData => {
                const exerciseItem = document.createElement('div');
                exerciseItem.className = 'exercise-item';
                exerciseItem.textContent = `${exerciseData.exercise} - ${exerciseData.sets} sets x ${exerciseData.reps} reps @ ${exerciseData.weight} kg`;
                exercisesList.appendChild(exerciseItem);
            });
        }
    });
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

function renderExerciseList() {
    const exerciseList = document.getElementById('exercise-list');
    exerciseList.innerHTML = '';

    for (const category in exercises) {
        exercises[category].forEach(exercise => {
            const exerciseItem = document.createElement('div');
            exerciseItem.textContent = `${exercise.name || exercise} (${category})`;
            exerciseItem.addEventListener('click', () => {
                viewExerciseDetails(exercise.name || exercise, category);
            });
            exerciseList.appendChild(exerciseItem);
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
function updateMuscleOptions(category, directSelect, indirectSelect) {
    // Clear current options
    directSelect.innerHTML = '';
    indirectSelect.innerHTML = '';

    if (category && muscleGroups[category]) {
        // Add primary muscles
        muscleGroups[category].forEach(muscle => {
            const option = document.createElement('option');
            option.value = muscle;
            option.textContent = muscle;
            directSelect.appendChild(option);
        });

        // Add all other muscles as secondary
        Object.values(muscleGroups)
            .flat()
            .filter(muscle => !muscleGroups[category].includes(muscle))
            .forEach(muscle => {
                const option = document.createElement('option');
                option.value = muscle;
                option.textContent = muscle;
                indirectSelect.appendChild(option);
            });
    }
}

// Simplified add new exercise function
function addNewExercise() {
    const name = document.getElementById('new-exercise-name').value;
    const category = document.getElementById('new-exercise-category').value;
    const directMuscles = Array.from(document.getElementById('direct-muscles').selectedOptions).map(opt => opt.value);
    const indirectMuscles = Array.from(document.getElementById('indirect-muscles').selectedOptions).map(opt => opt.value);

    if (!name || !category) {
        alert('Please enter exercise name and select category');
        return;
    }

    if (!directMuscles.length) {
        alert('Please select at least one primary muscle');
        return;
    }

    // Create and save new exercise
    if (!userExercises[category]) {
        userExercises[category] = [];
    }

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
    
    // Reset form and update display
    document.getElementById('new-exercise-name').value = '';
    document.getElementById('new-exercise-category').value = '';
    document.getElementById('direct-muscles').innerHTML = '';
    document.getElementById('indirect-muscles').innerHTML = '';
    
    renderExerciseList();
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
        console.log('On manage exercises page');
        loadUserExercises();
        initializeExerciseForm(); // This should now work correctly
        renderExerciseList();
    } else {
        init();
    }
});
// Exercise database
let exercises = {
    chest: ['Bench Press', 'Incline Press', 'Dumbbell Flyes'],
    back: ['Pull-ups', 'Rows', 'Deadlift'],
    legs: ['Squats', 'Leg Press', 'Lunges'],
    shoulders: ['Overhead Press', 'Lateral Raises', 'Front Raises'],
    arms: ['Bicep Curls', 'Tricep Extensions', 'Hammer Curls'],
    core: ['Planks', 'Crunches', 'Russian Twists']
};

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
    if (document.getElementById('exercise-list')) {
        renderExerciseList();
    }
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

function updateExerciseOptions() {
    const category = categorySelect.value;
    exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';
    
    if (category && exercises[category]) {
        exercises[category].forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            option.textContent = exercise;
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
            exerciseItem.textContent = `${exercise} (${category})`;
            exerciseItem.addEventListener('click', () => {
                viewExerciseDetails(exercise, category);
            });
            exerciseList.appendChild(exerciseItem);
        });
    }
}

function addNewExercise() {
    const name = document.getElementById('new-exercise-name').value;
    const category = document.getElementById('new-exercise-category').value;
    const muscles = document.getElementById('new-exercise-muscles').value;

    if (!name || !category || !muscles) {
        alert('Please fill in all fields');
        return;
    }

    if (!exercises[category]) {
        exercises[category] = [];
    }

    exercises[category].push(name);
    renderExerciseList();
    resetNewExerciseFields();
}

function resetNewExerciseFields() {
    document.getElementById('new-exercise-name').value = '';
    document.getElementById('new-exercise-category').value = '';
    document.getElementById('new-exercise-muscles').value = '';
}

function viewExerciseDetails(exercise, category) {
    alert(`Exercise: ${exercise}\nCategory: ${category}\nMuscles Worked: ${exercises[category].muscles || 'N/A'}`);
}

// Initialize the app
init();
const allMuscles = [
    'Chest', 'Front Delts', 'Side Delts', 'Rear Delts', 'Lats',
    'Traps', 'Rhomboids', 'Lower Back', 'Biceps', 'Triceps',
    'Forearms', 'Abs', 'Obliques', 'Quads', 'Hamstrings',
    'Glutes', 'Calves', 'Hip Flexors', 'Adductors',
    'Serratus Anterior', 'Brachialis', 'Core Stabilizers'
];

const muscleGroups = {
    chest: ['Chest', 'Front Delts', 'Serratus Anterior'],
    back: ['Lats', 'Traps', 'Rhomboids', 'Lower Back'],
    shoulders: ['Front Delts', 'Side Delts', 'Rear Delts'],
    arms: ['Biceps', 'Triceps', 'Forearms', 'Brachialis'],
    legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Hip Flexors', 'Adductors'],
    core: ['Abs', 'Obliques', 'Lower Back', 'Core Stabilizers']
};

const exercises = {
    chest: [],
    back: [], 
    shoulders: [],
    arms: [],
    legs: [],
    core: []
};

let userExercises = {};
let workoutData = {};
let currentDate = new Date();
let currentDay = null;
let currentEditingExercise = null;

const modal = document.getElementById('exercise-modal');
const categorySelect = document.getElementById('exercise-category');
const exerciseSelect = document.getElementById('exercise-select');

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

function deleteExercise(day, index) {
    const weekKey = getWeekKey();
    if (confirm('Are you sure you want to delete this exercise?')) {
        workoutData[weekKey][day].splice(index, 1);
        saveWorkoutData();
        renderWorkouts();
    }
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
                exerciseItem.classList.add('exercise-item');

                const header = document.createElement('div');
                header.classList.add('exercise-header');
                const name = document.createElement('span');
                name.textContent = exerciseData.exercise;
                header.appendChild(name);

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-exercise');
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteButton.addEventListener('click', () => {
                    deleteExercise(day, index);
                });
                header.appendChild(deleteButton);

                exerciseItem.appendChild(header);

                const details = document.createElement('div');
                details.classList.add('exercise-details');
                details.innerHTML = `
                    <div><strong>Sets:</strong> ${exerciseData.sets}</div>
                    <div><strong>Reps:</strong> ${exerciseData.repGoal}</div>
                    <div><strong>RIR:</strong> ${exerciseData.rirGoal}</div>
                `;
                exerciseItem.appendChild(details);

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

let isModalOpen = false;

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

function setupModalEventListeners() {
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

    window.addEventListener('click', (e) => {
        if (e.target === exerciseModal) {
            closeModal();
        }
        if (e.target === detailsModal) {
            closeDetailsModal();
        }
    });

    const modalContents = document.querySelectorAll('.modal-content');
    modalContents.forEach(content => {
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeDetailsModal();
        }
    });
}

function resetModalFields() {
    categorySelect.value = '';
    exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';
    document.getElementById('exercise-sets').value = '';
    document.getElementById('exercise-rep-range').value = '';
    document.getElementById('exercise-rir-range').value = '';
    document.getElementById('exercise-repeating').checked = false;
}

function setupEventListeners() {
    document.querySelectorAll('.add-exercise').forEach(button => {
        button.addEventListener('click', () => {
            const day = button.closest('.day').dataset.day;
            openModal(day);
        });
    });

    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('add-exercise-btn').addEventListener('click', (event) => {
        event.preventDefault();
        addExercise();
    });

    categorySelect.addEventListener('change', updateExerciseOptions);

    document.getElementById('prev-week').addEventListener('click', () => changeWeek(-7));
    document.getElementById('next-week').addEventListener('click', () => changeWeek(7));

    document.getElementById('save-workout')?.addEventListener('click', () => {
        saveWorkoutData();
        alert('Workout data saved.');
    });

    document.getElementById('load-workout')?.addEventListener('click', () => {
        loadWorkoutData();
        renderWorkouts();
        alert('Workout data loaded.');
    });

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

    document.getElementById('close-details-modal')?.addEventListener('click', closeDetailsModal);

    document.getElementById('edit-exercise-btn')?.addEventListener('click', enableEditMode);
    document.getElementById('save-exercise-btn')?.addEventListener('click', saveExerciseChanges);

    document.getElementById('filter-category')?.addEventListener('change', renderExerciseList);
}

function initializeDefaultExercises() {
    if (Object.keys(userExercises).length === 0) {
        userExercises = JSON.parse(JSON.stringify(exercises));
        saveUserExercises();
    }
}

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

function preventModalOnLoad() {
    document.getElementById('exercise-modal')?.classList.remove('show');
    document.getElementById('exercise-details-modal')?.classList.remove('show');
}

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

    if (currentEditingExercise.originalCategory !== newCategory) {
        userExercises[currentEditingExercise.originalCategory] = userExercises[currentEditingExercise.originalCategory].filter(ex => ex.name !== currentEditingExercise.name);
    } else {
        userExercises[newCategory] = userExercises[newCategory].filter(ex => ex.name !== currentEditingExercise.name);
    }

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

    document.getElementById('exercise-details-modal').classList.remove('show');
}

function updateMuscleOptions(category, directContainer, indirectContainer) {
    directContainer.innerHTML = '';
    indirectContainer.innerHTML = '';

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

    if (!userExercises[category]) {
        userExercises[category] = [];
    }

    const exists = userExercises[category].some(ex => ex.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        alert('An exercise with this name already exists in the selected category.');
        return;
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
}

function setupManageEventListeners() {
    document.getElementById('close-details-modal').addEventListener('click', closeDetailsModal);

    document.getElementById('edit-exercise-category').addEventListener('change', () => {
        const newCategory = document.getElementById('edit-exercise-category').value;
        const directMusclesContainer = document.getElementById('edit-direct-muscles');
        const indirectMusclesContainer = document.getElementById('edit-indirect-muscles');
        updateMuscleOptions(newCategory, directMusclesContainer, indirectMusclesContainer);
    });
}

window.addEventListener('load', preventModalOnLoad);

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

addExercise = handleError(addExercise);
saveExerciseChanges = handleError(saveExerciseChanges);
deleteExercise = handleError(deleteExercise);

// data.js

// All available muscles for selection
export const allMuscles = [
    'Chest', 'Front Delts', 'Side Delts', 'Rear Delts', 'Lats',
    'Traps', 'Rhomboids', 'Lower Back', 'Biceps', 'Triceps',
    'Forearms', 'Abs', 'Obliques', 'Quads', 'Hamstrings',
    'Glutes', 'Calves', 'Hip Flexors', 'Adductors',
    'Serratus Anterior', 'Brachialis', 'Core Stabilizers'
];

// Muscle groups for categories
export const muscleGroups = {
    chest: ['Chest', 'Front Delts', 'Serratus Anterior'],
    back: ['Lats', 'Traps', 'Rhomboids', 'Lower Back'],
    shoulders: ['Front Delts', 'Side Delts', 'Rear Delts'],
    arms: ['Biceps', 'Triceps', 'Forearms', 'Brachialis'],
    legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Hip Flexors', 'Adductors'],
    core: ['Abs', 'Obliques', 'Lower Back', 'Core Stabilizers']
};

// Essential data structures
export const exercises = {
    chest: [],
    back: [], 
    shoulders: [],
    arms: [],
    legs: [],
    core: []
};

// Global state management
export let userExercises = {};
export let workoutData = {};
export let currentDate = new Date();
export let currentDay = null;
export let currentEditingExercise = null;

// Storage functions
export function loadUserExercises() {
    const stored = localStorage.getItem('userExercises');
    userExercises = stored ? JSON.parse(stored) : {};
}

export function saveUserExercises() {
    localStorage.setItem('userExercises', JSON.stringify(userExercises));
}

export function loadWorkoutData() {
    const stored = localStorage.getItem('workoutData');
    workoutData = stored ? JSON.parse(stored) : {};
}

export function saveWorkoutData() {
    localStorage.setItem('workoutData', JSON.stringify(workoutData));
}

// Initialize default exercises if none exist
export function initializeDefaultExercises() {
    if (Object.keys(userExercises).length === 0) {
        userExercises = {
            chest: [
                { name: 'Bench Press', directMuscles: ['Chest', 'Front Delts'], indirectMuscles: ['Triceps'] },
                { name: 'Incline Dumbbell Press', directMuscles: ['Chest', 'Front Delts'], indirectMuscles: ['Triceps'] }
            ],
            back: [
                { name: 'Pull Ups', directMuscles: ['Lats'], indirectMuscles: ['Biceps'] },
                { name: 'Deadlifts', directMuscles: ['Lats', 'Lower Back'], indirectMuscles: ['Hamstrings', 'Glutes'] }
            ],
            shoulders: [
                { name: 'Overhead Press', directMuscles: ['Shoulders'], indirectMuscles: ['Triceps'] },
                { name: 'Lateral Raises', directMuscles: ['Side Delts'], indirectMuscles: [] }
            ],
            arms: [
                { name: 'Bicep Curls', directMuscles: ['Biceps'], indirectMuscles: [] },
                { name: 'Tricep Dips', directMuscles: ['Triceps'], indirectMuscles: [] }
            ],
            legs: [
                { name: 'Squats', directMuscles: ['Quads', 'Hamstrings', 'Glutes'], indirectMuscles: [] },
                { name: 'Leg Press', directMuscles: ['Quads', 'Hamstrings'], indirectMuscles: ['Glutes'] }
            ],
            core: [
                { name: 'Planks', directMuscles: ['Abs'], indirectMuscles: ['Lower Back'] },
                { name: 'Russian Twists', directMuscles: ['Obliques'], indirectMuscles: [] }
            ]
        };
        saveUserExercises();
    }
}

// Week management
export function getWeekKey(date = currentDate) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().split('T')[0];
}

export function changeWeek(days) {
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
    // Note: UI updates like updateWeekDisplay() will be handled in ui.js
}
// Performance history management
export let performanceHistory = {};

export function loadPerformanceHistory() {
    const stored = localStorage.getItem('performanceHistory');
    performanceHistory = stored ? JSON.parse(stored) : {};
    return performanceHistory;
}

export function savePerformanceHistory() {
    localStorage.setItem('performanceHistory', JSON.stringify(performanceHistory));
}

// Get an exercise's current estimated 1RM
export function getExerciseEstimated1RM(exerciseName) {
    if (!performanceHistory[exerciseName]) {
        return 0;
    }
    return performanceHistory[exerciseName].estimated1RM || 0;
}

// Update an exercise's estimated 1RM
export function updateExerciseEstimated1RM(exerciseName, newEstimate) {
    if (!performanceHistory[exerciseName]) {
        performanceHistory[exerciseName] = {
            estimated1RM: 0,
            sets: [],
            progression: []
        };
    }
    
    // Only update if the new estimate is valid and better than current
    if (newEstimate > 0 && newEstimate > performanceHistory[exerciseName].estimated1RM) {
        performanceHistory[exerciseName].estimated1RM = newEstimate;
        
        // Add to progression history
        performanceHistory[exerciseName].progression.push({
            date: new Date().toISOString(),
            estimated1RM: newEstimate
        });
        
        savePerformanceHistory();
        return true;
    }
    
    return false;
}
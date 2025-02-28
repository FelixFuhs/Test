// main.js

import {
    loadUserExercises,
    initializeDefaultExercises
} from './data.js';

import {
    initUI,
    initManageExercises
} from './ui.js';

// Check which page is currently loaded
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    return page;
}

// Initialize the application based on the current page
document.addEventListener('DOMContentLoaded', () => {
    loadUserExercises();
    initializeDefaultExercises();

    const currentPage = getCurrentPage();

    if (currentPage === 'index.html' || currentPage === '') {
        // Initialize main workout page
        initUI();
    } else if (currentPage === 'manage_exercises.html') {
        // Initialize manage exercises page
        initManageExercises();
    }

    // Additional initialization if needed
});

// Removed functions specific to `manage_exercises.html`

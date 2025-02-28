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
    console.log("DOM Content Loaded - Initializing application...");
    
    try {
        loadUserExercises();
        initializeDefaultExercises();

        const currentPage = getCurrentPage();
        console.log("Current page:", currentPage);

        if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
            // Initialize main workout page
            console.log("Initializing main workout page");
            initUI();
        } else if (currentPage === 'manage_exercises.html') {
            // Initialize manage exercises page
            console.log("Initializing manage exercises page");
            initManageExercises();
        }
    } catch (error) {
        console.error("Error initializing application:", error);
        alert("There was an error initializing the application. Please check the console for details.");
    }
});
// main.js

import {
    loadUserExercises,
    initializeDefaultExercises
} from './data.js';

import {
    initUI,
    initManageExercises
} from './ui.js';

// Import the new modules
import { initPlanner } from './planner.js';
import { initLogger } from './logger.js';

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
            // Initialize the training log page (index.html is now the training log)
            console.log("Initializing training log page");
            initLogger();
        } 
        // ADD THIS ELSE IF FOR training_log.html
        else if (currentPage === 'training_log.html') {
            console.log("Initializing training log page (training_log.html)");
            initLogger();
        }
        else if (currentPage === 'workout_planner.html') {
            // Initialize workout planner page
            console.log("Initializing workout planner page");
            initPlanner();
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

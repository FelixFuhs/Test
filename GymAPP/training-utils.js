// training-utils.js - Utilities for training calculations

/**
 * Calculate estimated 1RM using various formulas
 * @param {number} weight - Weight lifted in kg
 * @param {number} reps - Reps performed
 * @param {number} rir - Reps in reserve (optional)
 * @param {string} formula - Formula to use (brzycki, epley, etc.)
 * @returns {number} - Estimated 1RM
 */
export function calculate1RM(weight, reps, rir = 0, formula = 'brzycki') {
    // Add RIR to reps to get total potential reps
    const totalPotentialReps = reps + rir;
    
    // Ensure inputs are valid
    if (!weight || weight <= 0 || !totalPotentialReps || totalPotentialReps <= 0) {
        return 0;
    }

    // Apply the selected formula
    switch (formula) {
        case 'brzycki':
            // Brzycki formula: weight × (36 / (37 - totalPotentialReps))
            return weight * (36 / (37 - Math.min(totalPotentialReps, 36)));
        
        case 'epley':
            // Epley formula: weight × (1 + 0.0333 × totalPotentialReps)
            return weight * (1 + 0.0333 * totalPotentialReps);
        
        case 'lander':
            // Lander formula: (100 × weight) / (101.3 - 2.67123 × totalPotentialReps)
            return (100 * weight) / (101.3 - 2.67123 * totalPotentialReps);
        
        default:
            // Default to Brzycki
            return weight * (36 / (37 - Math.min(totalPotentialReps, 36)));
    }
}

/**
 * Calculate weight for target reps based on 1RM
 * @param {number} oneRepMax - Estimated 1RM
 * @param {number} targetReps - Target number of reps
 * @param {number} targetRIR - Target RIR
 * @param {number} increment - Weight increment (default 2.5kg)
 * @returns {number} - Calculated weight, rounded to the nearest increment
 */
export function calculateWeightForReps(oneRepMax, targetReps, targetRIR = 2, increment = 2.5) {
    // Ensure valid inputs
    if (!oneRepMax || oneRepMax <= 0 || !targetReps || targetReps <= 0) {
        return 0;
    }

    // Total potential reps (including RIR)
    const totalReps = targetReps + targetRIR;
    
    // Reverse the Brzycki formula to find weight
    // 1RM = weight × (36 / (37 - reps))
    // => weight = 1RM / (36 / (37 - reps))
    // => weight = 1RM × (37 - reps) / 36
    
    const weight = oneRepMax * (37 - Math.min(totalReps, 36)) / 36;
    
    // Round to the nearest increment
    return Math.round(weight / increment) * increment;
}

/**
 * Update the estimated 1RM based on performance
 * @param {number} currentEstimate - Current e1RM
 * @param {number} weight - Weight used in the set
 * @param {number} reps - Reps performed
 * @param {number} rir - Reps in reserve
 * @returns {number} - Updated e1RM
 */
export function updateEstimated1RM(currentEstimate, weight, reps, rir = 0) {
    // Calculate new estimate
    const newEstimate = calculate1RM(weight, reps, rir);
    
    // If this is the first estimate or the new one is higher, return it
    if (!currentEstimate || newEstimate > currentEstimate) {
        return newEstimate;
    }
    
    // Otherwise, use a weighted average to avoid sudden drops
    // (90% current + 10% new) to smooth out fluctuations
    return currentEstimate * 0.9 + newEstimate * 0.1;
}

/**
 * Suggest weight for the next set based on previous performance
 * @param {Object} exercise - Current exercise data
 * @param {number} setIndex - Current set index
 * @returns {number} - Suggested weight for next set
 */
export function suggestNextSetWeight(exercise, lastSetData) {
    if (!exercise || !lastSetData) return 0;
    
    const { weight, reps, rir } = lastSetData;
    if (!weight || !reps) return weight || 0;
    
    // Parse target rep and RIR ranges
    const repRangeParts = exercise.repRange.split('-');
    const targetMinReps = parseInt(repRangeParts[0]);
    const targetMaxReps = parseInt(repRangeParts[1]);
    const targetMidReps = Math.floor((targetMinReps + targetMaxReps) / 2);
    
    const rirRangeParts = exercise.rirRange.split('-');
    const targetMinRIR = parseInt(rirRangeParts[0]);
    const targetMaxRIR = parseInt(rirRangeParts[1]);
    const targetMidRIR = Math.floor((targetMinRIR + targetMaxRIR) / 2);
    
    // Determine adjustment factor based on performance
    let adjustmentFactor = 1.0;
    
    // If user did fewer reps than lower target, decrease weight
    if (reps < targetMinReps) {
        adjustmentFactor = 0.95;  // 5% decrease
    } 
    // If user did more reps than upper target, increase weight
    else if (reps > targetMaxReps) {
        adjustmentFactor = 1.05;  // 5% increase
    }
    
    // Further adjust based on RIR
    if (rir < targetMinRIR) {
        adjustmentFactor *= 0.95;  // Too close to failure, reduce weight
    } else if (rir > targetMaxRIR) {
        adjustmentFactor *= 1.05;  // Too far from failure, increase weight
    }
    
    // Calculate new weight
    const newWeight = Math.round((weight * adjustmentFactor) / 2.5) * 2.5;
    
    return newWeight;
}

/**
 * Get optimal weight for an exercise based on the performance history
 * @param {Object} exercise - Exercise data with rep range and RIR targets
 * @param {Object} performanceHistory - User's performance history for this exercise
 * @param {number} increment - Weight increment (default 2.5kg)
 * @returns {number} - Recommended weight
 */
export function getRecommendedWeight(exercise, performanceHistory, increment = 2.5) {
    if (!exercise || !performanceHistory) return 0;
    
    // Get the estimated 1RM from history or calculate from best set
    const e1RM = performanceHistory.estimated1RM || 0;
    
    if (e1RM <= 0) {
        return 0; // No history yet, user should choose initial weight
    }
    
    // Parse target rep range
    const repRangeParts = exercise.repRange.split('-');
    const targetMinReps = parseInt(repRangeParts[0]);
    const targetMaxReps = parseInt(repRangeParts[1]);
    const targetReps = Math.floor((targetMinReps + targetMaxReps) / 2);
    
    // Parse target RIR range
    const rirRangeParts = exercise.rirRange.split('-');
    const targetMinRIR = parseInt(rirRangeParts[0]);
    const targetMaxRIR = parseInt(rirRangeParts[1]);
    const targetRIR = Math.floor((targetMinRIR + targetMaxRIR) / 2);
    
    // Calculate recommended weight
    const recommendedWeight = calculateWeightForReps(e1RM, targetReps, targetRIR, increment);
    
    return recommendedWeight;
}

/**
 * Get previous best performance for an exercise
 * @param {string} exerciseName - Name of the exercise
 * @param {Array} workoutHistory - User's workout history
 * @returns {Object|null} - Previous best performance data or null
 */
export function getPreviousBestPerformance(exerciseName, workoutHistory) {
    if (!exerciseName || !workoutHistory || !workoutHistory.length) {
        return null;
    }
    
    let bestVolume = 0;
    let bestPerformance = null;
    
    // Loop through workout history to find best performance
    workoutHistory.forEach(workout => {
        if (!workout.exercises) return;
        
        workout.exercises.forEach(exercise => {
            if (exercise.name !== exerciseName) return;
            
            exercise.sets.forEach(set => {
                if (!set.completed || !set.weight || !set.reps) return;
                
                const weight = parseFloat(set.weight);
                const reps = parseInt(set.reps);
                const volume = weight * reps;
                
                if (volume > bestVolume) {
                    bestVolume = volume;
                    bestPerformance = {
                        date: new Date(workout.startTime),
                        weight,
                        reps,
                        rir: set.rir ? parseInt(set.rir) : 0,
                        volume,
                        estimated1RM: calculate1RM(weight, reps, set.rir ? parseInt(set.rir) : 0)
                    };
                }
            });
        });
    });
    
    return bestPerformance;
}

/**
 * Process and update performance history based on completed workout
 * @param {Object} workout - Completed workout data
 * @param {Object} performanceHistory - Current performance history
 * @returns {Object} - Updated performance history
 */
export function updatePerformanceHistory(workout, performanceHistory = {}) {
    if (!workout || !workout.exercises) return performanceHistory;
    
    // Create a deep copy of performance history to avoid mutations
    const updatedHistory = JSON.parse(JSON.stringify(performanceHistory || {}));
    
    // Process each exercise in the workout
    workout.exercises.forEach(exercise => {
        const exerciseName = exercise.name;
        
        // Initialize exercise history if it doesn't exist
        if (!updatedHistory[exerciseName]) {
            updatedHistory[exerciseName] = {
                estimated1RM: 0,
                sets: [],
                progression: []
            };
        }
        
        const exerciseHistory = updatedHistory[exerciseName];
        
        // Find the best set in this workout (highest estimated 1RM)
        let bestSet = null;
        let bestEstimated1RM = 0;
        
        exercise.sets.forEach(set => {
            if (!set.completed || !set.weight || !set.reps) return;
            
            const weight = parseFloat(set.weight);
            const reps = parseInt(set.reps);
            const rir = set.rir ? parseInt(set.rir) : 0;
            
            // Calculate estimated 1RM for this set
            const estimated1RM = calculate1RM(weight, reps, rir);
            
            // Store set data
            exerciseHistory.sets.push({
                date: workout.startTime,
                weight,
                reps,
                rir,
                estimated1RM
            });
            
            // Check if this is the best set
            if (estimated1RM > bestEstimated1RM) {
                bestEstimated1RM = estimated1RM;
                bestSet = {
                    date: workout.startTime,
                    weight,
                    reps,
                    rir,
                    estimated1RM
                };
            }
        });
        
        // If we found a best set, update the history
        if (bestSet) {
            // Update estimated 1RM (using weighted average if existing)
            exerciseHistory.estimated1RM = updateEstimated1RM(
                exerciseHistory.estimated1RM, 
                bestSet.weight, 
                bestSet.reps, 
                bestSet.rir
            );
            
            // Add to progression history
            exerciseHistory.progression.push({
                date: workout.startTime,
                estimated1RM: exerciseHistory.estimated1RM
            });
        }
    });
    
    return updatedHistory;
}
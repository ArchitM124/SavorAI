// Debug flag
const DEBUG = true;

// Debug function
function debug(msg, data = null) {
    if (DEBUG) {
        if (data) {
            console.log('Debug:', msg, data);
        } else {
            console.log('Debug:', msg);
        }
    }
}

// Make sure the script is loaded
console.log('Script loaded and running');

document.addEventListener('DOMContentLoaded', function() {
    debug('Script loaded');

    // Get elements
    const form = document.getElementById('ingredientForm');
    const ingredientsList = document.getElementById('ingredientsList');
    const addIngredientBtn = document.getElementById('addIngredient');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const recipeModal = new bootstrap.Modal(document.getElementById('recipeModal'));

    debug('Add ingredient button:', addIngredientBtn);
    debug('Ingredients list:', ingredientsList);

    // Get the template for new ingredients
    const templateEntry = document.querySelector('.ingredient-entry');

    // Add click handler for delete buttons
    document.body.addEventListener('click', function(e) {
        debug('Click event:', e.target);
        if (e.target.classList.contains('delete-ingredient')) {
            debug('Delete button clicked');
            const entry = e.target.closest('.ingredient-entry');
            if (entry && document.querySelectorAll('.ingredient-entry').length > 1) {
                entry.remove();
            }
        }
    });

    // Add ingredient entry
    addIngredientBtn.addEventListener('click', function(e) {
        debug('Add ingredient button clicked');
        e.preventDefault();
        e.stopPropagation();

        // Get the first ingredient entry
        const firstEntry = document.querySelector('.ingredient-entry');
        debug('First entry:', firstEntry);

        if (firstEntry) {
            // Clone the entry
            const newEntry = firstEntry.cloneNode(true);
            debug('New entry created');

            // Clear the values
            newEntry.querySelectorAll('input, select').forEach(input => {
                input.value = '';
            });

            // Add to the list
            ingredientsList.appendChild(newEntry);
            debug('New entry added');
        }
    });

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleFormSubmit(form);
    });

    debug('Script initialization complete');
});

// Global function to handle form submission
async function handleFormSubmit(form) {
    console.log('handleFormSubmit called');
    debug('Form submitted');
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsDiv = document.getElementById('recipeResults');
    
    debug('Loading indicator element:', loadingIndicator);
    debug('Results div element:', resultsDiv);

    const ingredients = [];
    const ingredientEntries = form.querySelectorAll('.ingredient-entry');
    debug('Found ingredient entries:', ingredientEntries.length);

    ingredientEntries.forEach((entry, index) => {
        const input = entry.querySelector('input');
        const quantitySelect = entry.querySelector('.quantity-select');
        const unitSelect = entry.querySelector('.unit-select');
        
        if (input && input.value.trim()) {
            ingredients.push({
                name: input.value.trim(),
                quantity: quantitySelect ? quantitySelect.value || null : null,
                unit: unitSelect ? unitSelect.value || null : null
            });
        }
    });

    const fitnessGoal = document.getElementById('fitnessGoal').value.trim();
    const mealType = document.getElementById('mealType').value;
    const cookingTime = document.getElementById('cookingTime').value.trim();

    debug('Collected form data:', {
        fitnessGoal,
        mealType,
        cookingTime,
        ingredients
    });

    const data = {
        fitness_goal: fitnessGoal,
        meal_type: mealType,
        max_cooking_time: cookingTime || null,
        ingredients: ingredients,
        is_more: false,
        allow_extra_ingredients: false
    };

    await fetchAndDisplayRecipes(data);
}

// Function to fetch and display recipes
async function fetchAndDisplayRecipes(data) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsDiv = document.getElementById('recipeResults');
    
    debug('Loading indicator element:', loadingIndicator);
    debug('Results div element:', resultsDiv);

    debug('Submitting data:', data);

    // Show loading indicator
    if (loadingIndicator) {
        loadingIndicator.classList.remove('d-none');
        debug('Loading indicator shown');
    }
    
    if (resultsDiv) {
        if (!data.is_more) {
            resultsDiv.innerHTML = '';
            debug('Results div cleared');
        }
    }

    try {
        debug('Starting fetch request');
        const response = await fetch('/get_recipes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        debug('Fetch response received:', response);

        const result = await response.json();
        debug('Response JSON:', result);
        
        if (result.error) {
            throw new Error(result.error);
        }

        // If this is a "more recipes" request, append to existing recipes
        // Otherwise, clear and show new recipes
        if (data.is_more) {
            displayRecipes(result.recipes || [], true);
        } else {
            displayRecipes(result.recipes || [], false);
        }

        // Add the "More Recipes" button if we successfully got recipes
        if (result.recipes && result.recipes.length > 0) {
            const moreButton = document.createElement('button');
            moreButton.className = 'btn btn-outline-primary w-100 mb-4';
            moreButton.textContent = 'Load More Recipes';
            moreButton.onclick = async () => {
                // Remove the current "More" button
                moreButton.remove();
                // Fetch more recipes with the same parameters
                const newData = { ...data, is_more: true };
                await fetchAndDisplayRecipes(newData);
            };
            resultsDiv.appendChild(moreButton);
        }

    } catch (error) {
        console.error('Error:', error);
        if (resultsDiv) {
            if (!data.is_more) {
                resultsDiv.innerHTML = `
                    <div class="alert alert-danger">
                        Error: ${error.message || 'Failed to generate recipe. Please try again.'}
                    </div>
                `;
            } else {
                // If this was a "more recipes" request that failed, show a message and try with extra ingredients
                const newData = { ...data, is_more: false, allow_extra_ingredients: true };
                await fetchAndDisplayRecipes(newData);
            }
        }
    } finally {
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.classList.add('d-none');
            debug('Loading indicator hidden');
        }
    }
}

// Function to display recipes
function displayRecipes(recipes, append = false) {
    debug('Displaying recipes:', recipes);
    const resultsDiv = document.getElementById('recipeResults');
    if (!resultsDiv) {
        console.error('Results div not found');
        return;
    }
    
    if (!append) {
        resultsDiv.innerHTML = '';
    }

    recipes.forEach((recipe, index) => {
        const card = document.createElement('div');
        card.className = 'card mb-3 recipe-card';
        
        // Check if recipe requires additional ingredients
        const description = recipe.description;
        const hasAdditionalIngredients = description.toLowerCase().includes('additional required ingredients');
        
        // Create preview card with null checks for nutrition values
        card.innerHTML = `
            <div class="card-body">
                ${hasAdditionalIngredients ? `
                    <div class="alert alert-info mb-3">
                        This recipe requires a few additional ingredients
                    </div>
                ` : ''}
                <h5 class="card-title">${recipe.name || 'Untitled Recipe'}</h5>
                <p class="card-text">${recipe.description || 'No description available'}</p>
                <div class="recipe-meta mb-2">
                    <small class="text-muted">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock me-1" viewBox="0 0 16 16">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                        </svg>
                        ${(recipe.cooking_time || recipe.prep_time) ? `${recipe.cooking_time || recipe.prep_time} minutes` : 'Time not specified'}
                    </small>
                </div>
                <div class="nutrition-info mb-2">
                    <small class="text-muted">
                        Calories: ${recipe.nutrition?.calories || '0'} | 
                        Protein: ${recipe.nutrition?.protein || '0'}g | 
                        Carbs: ${recipe.nutrition?.carbs || '0'}g | 
                        Fats: ${recipe.nutrition?.fats || '0'}g
                    </small>
                </div>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#recipeModal${index}">
                    View Full Recipe
                </button>
            </div>
        `;

        // Create detailed modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = `recipeModal${index}`;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', `recipeModalLabel${index}`);
        modal.setAttribute('aria-hidden', 'true');

        const ingredientsList = (recipe.ingredients || [])
            .map(ingredient => `<li>${ingredient || ''}</li>`)
            .join('');

        const instructionsList = (recipe.instructions || [])
            .map(step => `<li>${step || ''}</li>`)
            .join('');

        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="recipeModalLabel${index}">${recipe.name || 'Untitled Recipe'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${hasAdditionalIngredients ? `
                            <div class="alert alert-info mb-3">
                                This recipe requires a few additional ingredients beyond what you have available.
                                Check the recipe description for details.
                            </div>
                        ` : ''}
                        <div class="recipe-meta mb-3">
                            <strong>Time Required:</strong>
                            <div class="d-flex align-items-center mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock me-2" viewBox="0 0 16 16">
                                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                                </svg>
                                ${recipe.cooking_time || recipe.prep_time ? `
                                    Total Time: ${recipe.cooking_time || recipe.prep_time} minutes
                                    ${recipe.prep_time && recipe.cooking_time ? `<br>(${recipe.prep_time} min prep + ${recipe.cooking_time - recipe.prep_time} min cooking)` : ''}
                                ` : 'Time not specified'}
                            </div>
                        </div>

                        <h6>Description</h6>
                        <p>${recipe.description || 'No description available'}</p>
                        
                        <h6>Nutrition Information</h6>
                        <p>
                            Calories: ${recipe.nutrition?.calories || '0'}<br>
                            Protein: ${recipe.nutrition?.protein || '0'}g<br>
                            Carbs: ${recipe.nutrition?.carbs || '0'}g<br>
                            Fats: ${recipe.nutrition?.fats || '0'}g
                        </p>

                        <h6>How This Recipe Supports Your Goal</h6>
                        <p>${recipe.goal_alignment || 'No goal alignment information available'}</p>

                        <h6>Ingredients</h6>
                        <ul class="ingredients-list">
                            ${ingredientsList}
                        </ul>

                        <h6>Instructions</h6>
                        <ol class="instructions-list">
                            ${instructionsList}
                        </ol>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;

        resultsDiv.appendChild(card);
        resultsDiv.appendChild(modal);
    });
} 
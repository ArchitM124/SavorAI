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
async function handleFormSubmit(form, isMore = false) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.remove('d-none');

    try {
        const ingredients = Array.from(document.querySelectorAll('.ingredient-entry')).map(entry => {
            return {
                name: entry.querySelector('input').value,
                quantity: entry.querySelector('.quantity-select').value,
                unit: entry.querySelector('.unit-select').value
            };
        }).filter(ing => ing.name.trim() !== '');

        const data = {
            fitness_goal: document.getElementById('fitnessGoal').value,
            meal_type: document.getElementById('mealType').value,
            ingredients: ingredients,
            is_more: isMore,
            max_cooking_time: document.getElementById('cookingTime').value || null
        };

        const response = await fetch('/get_recipes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 429) {
                // Rate limit exceeded
                const retryAfter = errorData.retry_after || 60;
                const minutes = Math.ceil(retryAfter / 60);
                throw new Error(`Rate limit exceeded. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
            }
            throw new Error(errorData.error || 'Failed to get recipes');
        }

        const result = await response.json();
        displayRecipes(result.recipes);
    } catch (error) {
        // Create or update error message
        let errorDiv = document.getElementById('errorMessage');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'errorMessage';
            errorDiv.className = 'alert alert-danger mt-3';
            document.getElementById('recipeResults').prepend(errorDiv);
        }
        errorDiv.textContent = error.message;
        
        // Scroll to error message on mobile
        if (window.innerWidth <= 768) {
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } finally {
        loadingIndicator.classList.add('d-none');
    }
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
    const resultsDiv = document.getElementById('recipeResults');
    resultsDiv.innerHTML = '';

    recipes.forEach((recipe, index) => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card mb-3';
        
        // Create the preview section (always visible)
        const preview = document.createElement('div');
        preview.className = 'recipe-preview p-3 d-flex justify-content-between align-items-center';
        preview.style.cursor = 'pointer';
        
        const previewLeft = document.createElement('div');
        previewLeft.innerHTML = `
            <h3 class="h5 mb-0">${recipe.name}</h3>
            <div class="recipe-info mt-1">
                <span class="text-muted">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 4px;">
                        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                    </svg>${recipe.cooking_time} mins
                </span>
            </div>`;
        preview.appendChild(previewLeft);

        const toggleButton = document.createElement('button');
        toggleButton.className = 'btn btn-link text-decoration-none';
        toggleButton.innerHTML = 'Show Details';
        preview.appendChild(toggleButton);

        // Create the details section (hidden by default)
        const details = document.createElement('div');
        details.className = 'recipe-details p-3 border-top d-none';
        
        // Add description if available
        if (recipe.description) {
            const description = document.createElement('p');
            description.className = 'mb-3';
            description.textContent = recipe.description;
            details.appendChild(description);
        }

        // Ingredients section
        const ingredientsTitle = document.createElement('h4');
        ingredientsTitle.textContent = 'Ingredients';
        ingredientsTitle.className = 'h6 mb-2';
        details.appendChild(ingredientsTitle);

        const ingredientsList = document.createElement('ul');
        ingredientsList.className = 'ingredients-list mb-3';
        recipe.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = ingredient;
            ingredientsList.appendChild(li);
        });
        details.appendChild(ingredientsList);

        // Instructions section
        const instructionsTitle = document.createElement('h4');
        instructionsTitle.textContent = 'Instructions';
        instructionsTitle.className = 'h6 mb-2';
        details.appendChild(instructionsTitle);

        const instructionsList = document.createElement('ol');
        instructionsList.className = 'instructions-list mb-3';
        recipe.instructions.forEach(instruction => {
            const li = document.createElement('li');
            li.textContent = instruction;
            instructionsList.appendChild(li);
        });
        details.appendChild(instructionsList);

        // Nutrition section
        const nutritionTitle = document.createElement('h4');
        nutritionTitle.textContent = 'Nutrition Information';
        nutritionTitle.className = 'h6 mb-2';
        details.appendChild(nutritionTitle);

        const nutritionInfo = document.createElement('div');
        nutritionInfo.className = 'nutrition-info mb-3';
        nutritionInfo.innerHTML = `
            <div class="row g-2">
                <div class="col-6 col-sm-3">
                    <div class="p-2 border rounded text-center">
                        <div class="small text-muted">Calories</div>
                        <div class="fw-bold">${recipe.nutrition.calories}</div>
                    </div>
                </div>
                <div class="col-6 col-sm-3">
                    <div class="p-2 border rounded text-center">
                        <div class="small text-muted">Protein</div>
                        <div class="fw-bold">${recipe.nutrition.protein}g</div>
                    </div>
                </div>
                <div class="col-6 col-sm-3">
                    <div class="p-2 border rounded text-center">
                        <div class="small text-muted">Carbs</div>
                        <div class="fw-bold">${recipe.nutrition.carbs}g</div>
                    </div>
                </div>
                <div class="col-6 col-sm-3">
                    <div class="p-2 border rounded text-center">
                        <div class="small text-muted">Fats</div>
                        <div class="fw-bold">${recipe.nutrition.fats}g</div>
                    </div>
                </div>
            </div>`;
        details.appendChild(nutritionInfo);

        // Goal alignment section
        if (recipe.goal_alignment) {
            const goalTitle = document.createElement('h4');
            goalTitle.textContent = 'How This Recipe Supports Your Goal';
            goalTitle.className = 'h6 mb-2';
            details.appendChild(goalTitle);

            const goalText = document.createElement('p');
            goalText.className = 'mb-0';
            goalText.textContent = recipe.goal_alignment;
            details.appendChild(goalText);
        }

        // Add click handler for toggling details
        let isExpanded = false;
        preview.addEventListener('click', () => {
            isExpanded = !isExpanded;
            details.classList.toggle('d-none');
            toggleButton.innerHTML = isExpanded ? 'Hide Details' : 'Show Details';
        });

        // Add all elements to the card
        recipeCard.appendChild(preview);
        recipeCard.appendChild(details);
        resultsDiv.appendChild(recipeCard);
    });

    // Add "Load More" button if there are more recipes
    if (recipes.length === 5) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'btn btn-outline-primary w-100 mt-3';
        loadMoreBtn.textContent = 'Load More Recipes';
        loadMoreBtn.onclick = () => {
            const currentIngredients = Array.from(document.querySelectorAll('.ingredient-entry')).map(entry => {
                return {
                    name: entry.querySelector('input').value,
                    quantity: entry.querySelector('.quantity-select').value,
                    unit: entry.querySelector('.unit-select').value
                };
            }).filter(ing => ing.name.trim() !== '');

            handleFormSubmit(document.getElementById('ingredientForm'), true);
        };
        resultsDiv.appendChild(loadMoreBtn);
    }
}

// Add smooth scrolling to recipe results on mobile
if (window.innerWidth <= 768) {
    document.getElementById('ingredientForm').addEventListener('submit', function() {
        setTimeout(() => {
            const resultsDiv = document.getElementById('recipeResults');
            if (resultsDiv.children.length > 0) {
                resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 500); // Small delay to ensure results are rendered
    });
}

// Prevent double-tap zoom on iOS
document.addEventListener('touchend', function(event) {
    if (event.target.tagName === 'BUTTON' || event.target.tagName === 'SELECT') {
        event.preventDefault();
    }
}, false);

// Handle orientation changes
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});

// Add rate limit check function
async function checkRateLimit() {
    try {
        const response = await fetch('/rate_limit');
        if (response.ok) {
            const data = await response.json();
            // You can use this data to show remaining requests
            // For now, we'll just log it
            console.log('Rate limit info:', data);
        }
    } catch (error) {
        console.error('Failed to check rate limit:', error);
    }
}

// Check rate limit periodically
setInterval(checkRateLimit, 60000); // Check every minute 
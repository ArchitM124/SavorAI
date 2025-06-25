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
    const mealTypeSelect = document.getElementById('mealType');

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
    addIngredientBtn.addEventListener('click', function() {
        debug('Add ingredient button clicked');
        const template = document.querySelector('.ingredient-entry');
        const newEntry = template.cloneNode(true);
        
        // Clear all inputs in the new entry
        newEntry.querySelectorAll('input, select').forEach(input => {
            input.value = '';
        });
        
        // Ensure the new entry is visible
        newEntry.style.display = '';
        ingredientsList.appendChild(newEntry);
        
        // Focus the new ingredient input
        const newInput = newEntry.querySelector('input[type="text"]');
        if (newInput) {
            newInput.focus();
        }
    });

    // Handle ingredient removal
    ingredientsList.addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('.delete-ingredient');
        if (deleteBtn) {
            debug('Delete button clicked');
            const entry = deleteBtn.closest('.ingredient-entry');
            const allEntries = document.querySelectorAll('.ingredient-entry');
            
            if (entry && allEntries.length > 1) {
                entry.remove();
            }
        }
    });

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleFormSubmit(form);
    });

    // Ensure meal type dropdown works
    if (mealTypeSelect) {
        mealTypeSelect.addEventListener('change', function() {
            debug('Meal type changed:', this.value);
        });
    }

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
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        // Recipe title
        const title = document.createElement('h3');
        title.textContent = recipe.name;
        cardBody.appendChild(title);

        // Recipe info (cooking time, servings, etc)
        const recipeInfo = document.createElement('div');
        recipeInfo.className = 'recipe-info';
        
        if (recipe.cooking_time) {
            const timeSpan = document.createElement('span');
            timeSpan.innerHTML = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
            </svg>${recipe.cooking_time} mins`;
            recipeInfo.appendChild(timeSpan);
        }

        if (recipe.servings) {
            const servingsSpan = document.createElement('span');
            servingsSpan.innerHTML = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
            </svg>${recipe.servings} servings`;
            recipeInfo.appendChild(servingsSpan);
        }

        cardBody.appendChild(recipeInfo);

        // Ingredients section
        const ingredientsTitle = document.createElement('h4');
        ingredientsTitle.textContent = 'Ingredients';
        ingredientsTitle.className = 'mt-3 mb-2';
        cardBody.appendChild(ingredientsTitle);

        const ingredientsList = document.createElement('ul');
        ingredientsList.className = 'ingredients-list';
        recipe.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = ingredient;
            ingredientsList.appendChild(li);
        });
        cardBody.appendChild(ingredientsList);

        // Instructions section
        const instructionsTitle = document.createElement('h4');
        instructionsTitle.textContent = 'Instructions';
        instructionsTitle.className = 'mt-3 mb-2';
        cardBody.appendChild(instructionsTitle);

        const instructionsList = document.createElement('ol');
        instructionsList.className = 'instructions-list';
        recipe.instructions.forEach(instruction => {
            const li = document.createElement('li');
            li.textContent = instruction;
            instructionsList.appendChild(li);
        });
        cardBody.appendChild(instructionsList);

        // Add the card body to the recipe card
        recipeCard.appendChild(cardBody);
        resultsDiv.appendChild(recipeCard);

        // Add touch-friendly expand/collapse for mobile
        if (window.innerWidth <= 768) {
            const preview = document.createElement('div');
            preview.className = 'recipe-preview d-md-none';
            preview.style.maxHeight = '150px';
            preview.style.overflow = 'hidden';
            preview.style.position = 'relative';
            
            const expandBtn = document.createElement('button');
            expandBtn.className = 'btn btn-link text-decoration-none w-100 text-center py-2 mt-2';
            expandBtn.innerHTML = 'Show More';
            
            let expanded = false;
            expandBtn.addEventListener('click', () => {
                if (expanded) {
                    preview.style.maxHeight = '150px';
                    expandBtn.innerHTML = 'Show More';
                } else {
                    preview.style.maxHeight = 'none';
                    expandBtn.innerHTML = 'Show Less';
                }
                expanded = !expanded;
            });
            
            // Move content to preview
            while (cardBody.firstChild) {
                preview.appendChild(cardBody.firstChild);
            }
            
            cardBody.appendChild(preview);
            cardBody.appendChild(expandBtn);
        }
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
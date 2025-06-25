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

    const addIngredientBtn = document.getElementById('addIngredient');
    const ingredientsList = document.getElementById('ingredientsList');
    const findRecipesBtn = document.getElementById('findRecipes');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const recipesOverlay = document.querySelector('.recipes-overlay');
    const closeRecipesBtn = document.querySelector('.close-recipes');
    const recipesContainer = document.querySelector('.recipes-container');
    let ingredientCounter = 0;

    function createIngredientEntry() {
        const entry = document.createElement('div');
        entry.className = 'ingredient-entry';
        entry.innerHTML = `
            <div class="row">
                <div class="col-md-5 mb-2">
                    <input type="text" class="form-control ingredient-name" placeholder="Ingredient name" required>
                </div>
                <div class="col-md-4 mb-2">
                    <input type="number" class="form-control ingredient-amount" placeholder="Amount" required>
                </div>
                <div class="col-md-3 mb-2">
                    <select class="form-select ingredient-unit" required>
                        <option value="">Unit</option>
                        <option value="grams">grams</option>
                        <option value="ml">ml</option>
                        <option value="pieces">pieces</option>
                        <option value="cups">cups</option>
                        <option value="tbsp">tbsp</option>
                        <option value="tsp">tsp</option>
                    </select>
                </div>
            </div>
            <button type="button" class="btn btn-outline-danger delete-ingredient">Remove Ingredient</button>
        `;

        entry.querySelector('.delete-ingredient').addEventListener('click', function() {
            entry.remove();
        });

        return entry;
    }

    addIngredientBtn.addEventListener('click', function() {
        const newEntry = createIngredientEntry();
        ingredientsList.appendChild(newEntry);
        ingredientCounter++;
    });

    // Add initial ingredient entry
    if (ingredientCounter === 0) {
        const initialEntry = createIngredientEntry();
        ingredientsList.appendChild(initialEntry);
        ingredientCounter++;
    }

    findRecipesBtn.addEventListener('click', async function(e) {
        e.preventDefault();

        const ingredients = [];
        const entries = document.querySelectorAll('.ingredient-entry');
        let isValid = true;

        entries.forEach(entry => {
            const name = entry.querySelector('.ingredient-name').value.trim();
            const amount = entry.querySelector('.ingredient-amount').value.trim();
            const unit = entry.querySelector('.ingredient-unit').value;

            if (!name || !amount || !unit) {
                isValid = false;
                return;
            }

            ingredients.push({
                name: name,
                amount: parseFloat(amount),
                unit: unit
            });
        });

        if (!isValid || ingredients.length === 0) {
            alert('Please fill in all ingredient fields correctly.');
            return;
        }

        const cookingTime = document.getElementById('cookingTime').value;
        const mealType = document.getElementById('mealType').value;

        if (!cookingTime) {
            alert('Please specify the maximum cooking time.');
            return;
        }

        loadingIndicator.style.display = 'block';

        try {
            const response = await fetch('/get_recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ingredients: ingredients,
                    max_cooking_time: parseInt(cookingTime),
                    meal_type: mealType
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            displayRecipes(data.recipes);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while fetching recipes. Please try again.');
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });

    function displayRecipes(recipes) {
        recipesContainer.innerHTML = '';
        
        if (recipes.length === 0) {
            recipesContainer.innerHTML = '<div class="alert alert-info">No recipes found with the given ingredients and criteria.</div>';
        } else {
            recipes.forEach(recipe => {
                const recipeCard = document.createElement('div');
                recipeCard.className = 'recipe-card card mb-4';
                
                const ingredients = recipe.ingredients.map(ing => 
                    `<li>${ing.amount} ${ing.unit} ${ing.name}</li>`
                ).join('');

                const steps = recipe.cooking_steps.map((step, index) => 
                    `<li>${step}</li>`
                ).join('');

                recipeCard.innerHTML = `
                    <div class="card-header">
                        <h5 class="card-title mb-0">${recipe.name}</h5>
                    </div>
                    <div class="card-body">
                        <p class="recipe-info">
                            <i class="bi bi-clock"></i> ${recipe.cooking_time} minutes
                            <span class="mx-2">|</span>
                            <i class="bi bi-tag"></i> ${recipe.meal_type}
                        </p>
                        <h6>Ingredients:</h6>
                        <ul class="ingredients-list">
                            ${ingredients}
                        </ul>
                        <h6>Cooking Steps:</h6>
                        <ol class="cooking-steps">
                            ${steps}
                        </ol>
                    </div>
                `;
                
                recipesContainer.appendChild(recipeCard);
            });
        }
        
        recipesOverlay.classList.add('active');
    }

    closeRecipesBtn.addEventListener('click', function() {
        recipesOverlay.classList.remove('active');
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
function displayRecipes(recipes, inOverlay = true) {
    const targetElement = inOverlay ? 
        document.getElementById('overlayRecipeResults') : 
        document.getElementById('recipeResults');

    if (!targetElement) return;
    targetElement.innerHTML = '';

    if (!recipes || recipes.length === 0) {
        targetElement.innerHTML = `
            <div class="alert alert-info">
                No recipes found. Try adjusting your ingredients or meal type.
            </div>
        `;
        return;
    }

    // For mobile, create pages of 3 recipes each
    if (window.innerWidth <= 768) {
        const recipesPerPage = 3;
        const pages = Math.ceil(recipes.length / recipesPerPage);
        
        // Create container for pages
        const pagesContainer = document.createElement('div');
        pagesContainer.className = 'recipe-pages';
        
        // Split recipes into pages
        for (let i = 0; i < pages; i++) {
            const page = document.createElement('div');
            page.className = `recipe-page ${i === 0 ? 'active' : ''}`;
            page.dataset.page = i;
            
            const pageRecipes = recipes.slice(i * recipesPerPage, (i + 1) * recipesPerPage);
            pageRecipes.forEach(recipe => {
                const recipeCard = createRecipeCard(recipe);
                page.appendChild(recipeCard);
            });
            
            pagesContainer.appendChild(page);
        }
        
        targetElement.appendChild(pagesContainer);
        
        // Add pagination if there are multiple pages
        if (pages > 1) {
            const pagination = document.createElement('div');
            pagination.className = 'recipes-pagination';
            
            for (let i = 0; i < pages; i++) {
                const pageButton = document.createElement('button');
                pageButton.type = 'button';
                pageButton.className = i === 0 ? 'active' : '';
                pageButton.textContent = (i + 1).toString();
                pageButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Update active page
                    document.querySelectorAll('.recipe-page').forEach(p => p.classList.remove('active'));
                    document.querySelector(`.recipe-page[data-page="${i}"]`).classList.add('active');
                    
                    // Update active button
                    document.querySelectorAll('.recipes-pagination button').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                });
                pagination.appendChild(pageButton);
            }
            
            targetElement.appendChild(pagination);
        }
    } else {
        // Desktop view - show all recipes
        recipes.forEach(recipe => {
            const recipeCard = createRecipeCard(recipe);
            targetElement.appendChild(recipeCard);
        });
    }
}

function createRecipeCard(recipe) {
    const recipeCard = document.createElement('div');
    recipeCard.className = 'recipe-card';
    recipeCard.innerHTML = `
        <div class="card-body">
            <h3>${recipe.name || 'Untitled Recipe'}</h3>
            <div class="recipe-info">
                ${recipe.cooking_time ? `
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock" viewBox="0 0 16 16">
                        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                    </svg>
                    ${recipe.cooking_time} mins
                </span>
                ` : ''}
                ${recipe.calories ? `
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fire" viewBox="0 0 16 16">
                        <path d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16Zm0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15Z"/>
                    </svg>
                    ${recipe.calories} cal
                </span>
                ` : ''}
            </div>
            
            <h6>Ingredients:</h6>
            <ul class="ingredients-list">
                ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
            </ul>
            
            <h6>Instructions:</h6>
            <ol class="cooking-steps">
                ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
    `;
    return recipeCard;
}

// Add touch event handlers to improve mobile interaction
document.addEventListener('DOMContentLoaded', function() {
    // Prevent double-tap zoom on buttons and form elements
    document.querySelectorAll('.btn, .form-select, .form-control').forEach(element => {
        element.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.click();
        }, { passive: false });
    });

    // Add active state handling
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('touchstart', function() {
            this.classList.add('active');
        });
        
        button.addEventListener('touchend', function() {
            this.classList.remove('active');
        });
        
        button.addEventListener('touchcancel', function() {
            this.classList.remove('active');
        });
    });
});

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
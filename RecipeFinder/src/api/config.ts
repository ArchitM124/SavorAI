import axios from 'axios';

// Using localhost for iOS simulator/device
const BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

interface Ingredient {
    name: string;
    quantity?: string;
    unit?: string;
}

function createRequestKey(ingredients: string, fitnessGoal: string, mealType: string, isMore: boolean = false): string {
    return `${ingredients}_${fitnessGoal}_${mealType}_${isMore}`;
}

export const searchRecipes = async (ingredients: string, fitnessGoal: string, mealType: string) => {
    const requestKey = createRequestKey(ingredients, fitnessGoal, mealType, false);
    
    // Check if there's already a pending request for the same parameters
    if (pendingRequests.has(requestKey)) {
        console.log('Using existing request for:', requestKey);
        return await pendingRequests.get(requestKey);
    }

    const requestPromise = (async () => {
        try {
            // Parse ingredients string into array of objects
            const ingredientsList = ingredients.split(',').map(ing => {
                const parts = ing.trim().split(' ');
                const ingredient: Ingredient = {
                    name: parts[parts.length - 1]
                };
                if (parts.length > 1) {
                    ingredient.quantity = parts[0];
                    ingredient.unit = parts.length > 2 ? parts[1] : undefined;
                }
                return ingredient;
            });

            console.log('Making request to:', `${BASE_URL}/recipes`);
            console.log('Request payload:', {
                ingredients: ingredientsList,
                fitness_goal: fitnessGoal,
                meal_type: mealType,
                allow_extra_ingredients: true
            });

            const response = await api.post('/recipes', {
                ingredients: ingredientsList,
                fitness_goal: fitnessGoal,
                meal_type: mealType,
                allow_extra_ingredients: true
            });

            console.log('Response:', response.data);
            return {
                recipes: response.data.recipes,
                hasExtraIngredients: response.data.has_extra_ingredients || false
            };
        } catch (error) {
            console.error('Error searching recipes:', error);
            if (axios.isAxiosError(error)) {
                console.error('Request failed:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
            }
            throw error;
        } finally {
            // Remove from pending requests
            pendingRequests.delete(requestKey);
        }
    })();

    // Store the promise
    pendingRequests.set(requestKey, requestPromise);
    return await requestPromise;
};

export const loadMoreRecipes = async (ingredients: string, fitnessGoal: string, mealType: string) => {
    const requestKey = createRequestKey(ingredients, fitnessGoal, mealType, true);
    
    // Check if there's already a pending request for the same parameters
    if (pendingRequests.has(requestKey)) {
        console.log('Using existing load more request for:', requestKey);
        return await pendingRequests.get(requestKey);
    }

    const requestPromise = (async () => {
        try {
            // Parse ingredients string into array of objects
            const ingredientsList = ingredients.split(',').map(ing => {
                const parts = ing.trim().split(' ');
                const ingredient: Ingredient = {
                    name: parts[parts.length - 1]
                };
                if (parts.length > 1) {
                    ingredient.quantity = parts[0];
                    ingredient.unit = parts.length > 2 ? parts[1] : undefined;
                }
                return ingredient;
            });

            console.log('Making load more request to:', `${BASE_URL}/recipes/more`);
            console.log('Request payload:', {
                ingredients: ingredientsList,
                fitness_goal: fitnessGoal,
                meal_type: mealType,
                allow_extra_ingredients: true
            });

            const response = await api.post('/recipes/more', {
                ingredients: ingredientsList,
                fitness_goal: fitnessGoal,
                meal_type: mealType,
                allow_extra_ingredients: true
            });

            console.log('Load more response:', response.data);
            return {
                recipes: response.data.recipes,
                hasExtraIngredients: response.data.has_extra_ingredients || false
            };
        } catch (error) {
            console.error('Error loading more recipes:', error);
            if (axios.isAxiosError(error)) {
                console.error('Load more request failed:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
            }
            throw error;
        } finally {
            // Remove from pending requests
            pendingRequests.delete(requestKey);
        }
    })();

    // Store the promise
    pendingRequests.set(requestKey, requestPromise);
    return await requestPromise;
};

export default api; 
import axios, { isAxiosError } from 'axios';

// Using ngrok HTTPS tunnel (temporary)
const BASE_URL = 'http://ec2-18-216-74-132.us-east-2.compute.amazonaws.com:8000';
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'SavorAI/1.0.0'
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

            const requestPayload = {
                ingredients: ingredientsList,
                fitness_goal: fitnessGoal,
                meal_type: mealType,
                allow_extra_ingredients: true
            };

            console.log('Making request to:', `${BASE_URL}/recipes`);
            console.log('Request payload:', requestPayload);

            // Try native fetch first
            console.log('Attempting native fetch...');
            const fetchResponse = await fetch(`${BASE_URL}/recipes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'SavorAI/1.0.0'
                },
                body: JSON.stringify(requestPayload)
            });

            console.log('Fetch response status:', fetchResponse.status);
            console.log('Fetch response ok:', fetchResponse.ok);

            if (!fetchResponse.ok) {
                throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
            }

            const responseData = await fetchResponse.json();
            console.log('Fetch response data:', responseData);

            return {
                recipes: responseData.recipes,
                hasExtraIngredients: responseData.has_extra_ingredients || false
            };
        } catch (error: any) {
            console.error('Error searching recipes:', error);
            console.error('Error type:', typeof error);
            console.error('Error constructor:', error?.constructor?.name);
            console.error('Error message:', error?.message);
            console.error('Error code:', error?.code);
            
            if (isAxiosError(error)) {
                console.error('Axios error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message,
                    code: error.code,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        baseURL: error.config?.baseURL,
                        headers: error.config?.headers
                    }
                });
            } else {
                console.error('Non-axios error:', {
                    name: error?.name,
                    message: error?.message,
                    stack: error?.stack
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
            if (isAxiosError(error)) {
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

// Test function to check if server is reachable
export const testServerConnection = async () => {
    try {
        console.log('Testing server connection to:', BASE_URL);
        
        // Try native fetch to root endpoint
        const response = await fetch(`${BASE_URL}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        console.log('Server test response status:', response.status);
        console.log('Server test response ok:', response.ok);
        
        if (response.ok) {
            const data = await response.text();
            console.log('Server test response data:', data);
            return true;
        } else {
            console.error('Server test failed with status:', response.status);
            return false;
        }
    } catch (error: any) {
        console.error('Server connection test failed:', error?.message);
        console.error('Server connection test error type:', typeof error);
        console.error('Server connection test error constructor:', error?.constructor?.name);
        return false;
    }
};

export default api; 
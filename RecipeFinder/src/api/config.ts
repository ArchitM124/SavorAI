import axios from 'axios';

// Using localhost for iOS simulator/device
const BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

interface Ingredient {
    name: string;
    quantity?: string;
    unit?: string;
}

export const searchRecipes = async (ingredients: string, fitnessGoal: string, mealType: string) => {
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
    }
};

export const loadMoreRecipes = async (ingredients: string, fitnessGoal: string, mealType: string) => {
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
    }
};

export default api; 
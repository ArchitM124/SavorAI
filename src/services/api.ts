import axios from 'axios';

// TODO: Replace with your actual API endpoint
const API_URL = 'http://your-api-endpoint.com';

export const findRecipes = async (ingredients: string, fitnessGoal?: string) => {
  try {
    const response = await axios.post(`${API_URL}/recipes`, {
      ingredients,
      fitness_goal: fitnessGoal,
    });
    return response.data;
  } catch (error) {
    console.error('Error in findRecipes:', error);
    throw error;
  }
};

export const getRecipeDetails = async (recipeId: string) => {
  try {
    const response = await axios.get(`${API_URL}/recipes/${recipeId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getRecipeDetails:', error);
    throw error;
  }
}; 
// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:5000',
  TIMEOUT: 10000, // 10 seconds
};

// App Theme Colors
export const COLORS = {
  primary: '#3498db',
  secondary: '#2ecc71',
  background: '#ffffff',
  text: '#2c3e50',
  textLight: '#666666',
  border: '#e1e8ed',
  error: '#e74c3c',
  success: '#2ecc71',
  warning: '#f1c40f',
};

// App Constants
export const APP_CONSTANTS = {
  MAX_INGREDIENTS: 10,
  MIN_INGREDIENT_LENGTH: 2,
  DEBOUNCE_DELAY: 300, // milliseconds
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  INVALID_INPUT: 'Please enter valid ingredients.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NO_RECIPES: 'No recipes found with these ingredients. Try different ingredients.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  RECIPES_FOUND: 'Recipes found successfully!',
};

// Navigation Routes
export const ROUTES = {
  HOME: 'Home',
  RESULTS: 'Results',
  RECIPE_DETAILS: 'RecipeDetails',
}; 
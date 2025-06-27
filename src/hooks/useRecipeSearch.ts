import { useState, useCallback } from 'react';
import { findRecipes } from '../services/api';
import { ERROR_MESSAGES } from '../utils/config';

interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string;
  prepTime: string;
  nutritionalInfo: string;
}

interface UseRecipeSearchResult {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  searchRecipes: (ingredients: string, fitnessGoal?: string) => Promise<void>;
  clearError: () => void;
}

export const useRecipeSearch = (): UseRecipeSearchResult => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRecipes = useCallback(async (ingredients: string, fitnessGoal?: string) => {
    if (!ingredients.trim()) {
      setError(ERROR_MESSAGES.INVALID_INPUT);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await findRecipes(ingredients, fitnessGoal);
      setRecipes(response);
      
      if (response.length === 0) {
        setError(ERROR_MESSAGES.NO_RECIPES);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        ERROR_MESSAGES.NETWORK_ERROR
      );
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    recipes,
    loading,
    error,
    searchRecipes,
    clearError,
  };
}; 
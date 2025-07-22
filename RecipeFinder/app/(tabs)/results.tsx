import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadMoreRecipes } from '@/src/api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useHover } from '@/src/hooks/useHover';

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface Recipe {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  nutrition: Nutrition;
  goal_alignment: string;
  cooking_time: number;
  prep_time: number;
}

export default function ResultsScreen() {
  const { recipes, hasExtraIngredients, originalIngredients, fitnessGoal, mealType } = useLocalSearchParams();
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [hasMoreRecipes, setHasMoreRecipes] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [extraIngredientsUsed, setExtraIngredientsUsed] = useState(false);
  const { width } = useWindowDimensions();
  const styles = getStyles(width);

  // Parse recipes and load favorites when component mounts
  useEffect(() => {
    try {
      if (recipes) {
        const parsedRecipes = JSON.parse(recipes as string);
        setAllRecipes(parsedRecipes);
      }
      
      if (hasExtraIngredients) {
        const extraUsed = JSON.parse(hasExtraIngredients as string) || false;
        setExtraIngredientsUsed(extraUsed);
      }
    } catch (error) {
      console.error('Error parsing recipes:', error);
    }
    
    loadFavorites();
  }, [recipes, hasExtraIngredients]);

  // Reload favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      const storedRecipes = await AsyncStorage.getItem('favoriteRecipes');
      
      if (storedFavorites) {
        setFavorites(new Set(JSON.parse(storedFavorites)));
      }
      
      if (storedRecipes) {
        setFavoriteRecipes(JSON.parse(storedRecipes));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (recipe: Recipe) => {
    try {
      const recipeKey = `${recipe.name}-${recipe.nutrition.calories}`;
      const newFavorites = new Set(favorites);
      
      console.log('Toggling favorite for:', recipe.name);
      console.log('Current favorites:', Array.from(favorites));
      
      if (newFavorites.has(recipeKey)) {
        console.log('Removing from favorites');
        newFavorites.delete(recipeKey);
        // Remove from favorite recipes
        const updatedFavoriteRecipes = favoriteRecipes.filter(r => `${r.name}-${r.nutrition.calories}` !== recipeKey);
        setFavoriteRecipes(updatedFavoriteRecipes);
        await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(updatedFavoriteRecipes));
      } else {
        console.log('Adding to favorites');
        newFavorites.add(recipeKey);
        // Add to favorite recipes
        const updatedFavoriteRecipes = [...favoriteRecipes, recipe];
        setFavoriteRecipes(updatedFavoriteRecipes);
        await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(updatedFavoriteRecipes));
      }
      
      setFavorites(newFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify([...newFavorites]));
      console.log('Updated favorites:', Array.from(newFavorites));
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  const isFavorite = (recipe: Recipe) => {
    const recipeKey = `${recipe.name}-${recipe.nutrition.calories}`;
    return favorites.has(recipeKey);
  };

  const handleLoadMore = async () => {
    if (!hasMoreRecipes || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const moreRecipes = await loadMoreRecipes(
        originalIngredients as string,
        fitnessGoal as string,
        mealType as string
      );
      
      if (moreRecipes.recipes && moreRecipes.recipes.length > 0) {
        setAllRecipes(prev => [...prev, ...moreRecipes.recipes]);
      } else {
        setHasMoreRecipes(false);
        Alert.alert('No More Recipes', 'We\'ve found all the recipes we can make with these ingredients. Try adding some different ingredients for more variety!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load more recipes. Please try again.');
      console.error('Load more error:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const toggleRecipe = (recipeId: number) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  if (allRecipes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText style={styles.title}>No Recipes Found</ThemedText>
          <ThemedText style={styles.subtitle}>
            We couldn&apos;t find recipes with just those ingredients. Try adding a few more ingredients or we can suggest recipes with some additional common ingredients.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          <ThemedText style={styles.title}>Results</ThemedText>
          
          {extraIngredientsUsed && (
            <ThemedView style={styles.extraIngredientsNotice}>
              <ThemedText style={styles.extraIngredientsText}>
                💡 Some recipes include additional common ingredients to make them more complete and delicious!
              </ThemedText>
            </ThemedView>
          )}
          
          <View style={styles.recipeGrid}>
            {allRecipes.map((recipe, index) => {
              const { hoverProps, isHovered } = useHover();
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.recipeCard, isHovered && styles.cardHover]}
                  onPress={() => toggleRecipe(index)}
                  {...hoverProps}
                >
                  <View style={styles.recipeHeader}>
                    <ThemedText style={styles.recipeTitle}>{recipe.name}</ThemedText>
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => toggleFavorite(recipe)}
                    >
                      <ThemedText style={styles.favoriteIcon}>
                        {isFavorite(recipe) ? '❤️' : '🤍'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.macrosContainer}>
                    <View style={styles.macroItem}>
                      <ThemedText style={styles.macroLabel}>Calories</ThemedText>
                      <ThemedText style={styles.macroValue}>{recipe.nutrition.calories}</ThemedText>
                    </View>
                    <View style={styles.macroItem}>
                      <ThemedText style={styles.macroLabel}>Protein</ThemedText>
                      <ThemedText style={styles.macroValue}>{recipe.nutrition.protein}g</ThemedText>
                    </View>
                    <View style={styles.macroItem}>
                      <ThemedText style={styles.macroLabel}>Carbs</ThemedText>
                      <ThemedText style={styles.macroValue}>{recipe.nutrition.carbs}g</ThemedText>
                    </View>
                    <View style={styles.macroItem}>
                      <ThemedText style={styles.macroLabel}>Fats</ThemedText>
                      <ThemedText style={styles.macroValue}>{recipe.nutrition.fats}g</ThemedText>
                    </View>
                  </View>

                  {expandedRecipe === index && (
                    <View style={styles.recipeDetails}>
                      <ThemedText style={styles.description}>{recipe.description}</ThemedText>
                      
                      <ThemedText style={styles.sectionTitle}>Ingredients:</ThemedText>
                      {recipe.ingredients.map((ingredient, idx) => (
                        <ThemedText key={idx} style={styles.listItem}>• {ingredient}</ThemedText>
                      ))}
                      
                      <ThemedText style={styles.sectionTitle}>Instructions:</ThemedText>
                      {recipe.instructions.map((instruction, idx) => (
                        <ThemedText key={idx} style={styles.listItem}>{idx + 1}. {instruction}</ThemedText>
                      ))}

                      <ThemedText style={styles.sectionTitle}>Fitness Goal Alignment:</ThemedText>
                      <ThemedText style={styles.listItem}>{recipe.goal_alignment}</ThemedText>

                      <ThemedText style={styles.sectionTitle}>Time:</ThemedText>
                      <ThemedText style={styles.listItem}>Prep Time: {recipe.prep_time} minutes</ThemedText>
                      <ThemedText style={styles.listItem}>Cooking Time: {recipe.cooking_time} minutes</ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {hasMoreRecipes && (
            <TouchableOpacity
              style={[styles.loadMoreButton, isLoadingMore && styles.loadMoreButtonDisabled]}
              onPress={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <ThemedText style={styles.loadMoreButtonText}>Load More Recipes</ThemedText>
              )}
            </TouchableOpacity>
          )}
          
          {/* Add extra padding at the bottom for better visibility */}
          <View style={styles.bottomPadding} />
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (width: number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recipeCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: width > 768 ? '48%' : '100%',
  },
  cardHover: {
    transform: [{ translateY: -5 }],
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  recipeDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    marginBottom: 6,
    paddingLeft: 8,
  },
  loadMoreButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  loadMoreButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loadMoreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  extraIngredientsNotice: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  extraIngredientsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  bottomPadding: {
    height: 20,
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    fontSize: 20,
  },
});
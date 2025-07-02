import { ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

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

export default function FavoritesScreen() {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  // Reload favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      console.log('Loading favorites...');
      const storedRecipes = await AsyncStorage.getItem('favoriteRecipes');
      console.log('Stored recipes:', storedRecipes);
      if (storedRecipes) {
        const recipes = JSON.parse(storedRecipes);
        console.log('Parsed recipes:', recipes);
        setFavoriteRecipes(recipes);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (recipe: Recipe) => {
    try {
      const updatedRecipes = favoriteRecipes.filter(r => 
        `${r.name}-${r.nutrition.calories}` !== `${recipe.name}-${recipe.nutrition.calories}`
      );
      setFavoriteRecipes(updatedRecipes);
      await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(updatedRecipes));
      
      // Also update the favorites set
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        const favorites = new Set(JSON.parse(storedFavorites));
        const recipeKey = `${recipe.name}-${recipe.nutrition.calories}`;
        favorites.delete(recipeKey);
        await AsyncStorage.setItem('favorites', JSON.stringify([...favorites]));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const toggleRecipe = (recipeId: number) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading favorites...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (favoriteRecipes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText style={styles.title}>Favorites</ThemedText>
          <ThemedText style={styles.subtitle}>
            You haven&apos;t favorited any recipes yet. Start exploring recipes and tap the star to save your favorites!
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          <ThemedText style={styles.title}>Favorites</ThemedText>
          
          {favoriteRecipes.map((recipe, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recipeCard}
              onPress={() => toggleRecipe(index)}
            >
              <View style={styles.recipeHeader}>
                <ThemedText style={styles.recipeTitle}>{recipe.name}</ThemedText>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => removeFavorite(recipe)}
                  >
                    <ThemedText style={styles.favoriteIcon}>❤️</ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.recipeArrow}>
                    {expandedRecipe === index ? '▼' : '▶'}
                  </ThemedText>
                </View>
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
          ))}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  recipeCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  recipeArrow: {
    fontSize: 16,
    color: '#666',
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
}); 
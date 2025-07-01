import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { searchRecipes } from '../api/config';

interface Recipe {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  goal_alignment: string;
  cooking_time: number;
  prep_time: number;
}

export default function RecipesScreen() {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [favorites, setFavorites] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const navigation = useNavigation();
  const route = useRoute();

  React.useEffect(() => {
    loadFavorites();
    fetchRecipes();
  }, []);

  const loadFavorites = async () => {
    try {
      const favoritesData = await AsyncStorage.getItem('favoriteRecipes');
      if (favoritesData) {
        setFavorites(JSON.parse(favoritesData));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const fetchRecipes = async () => {
    try {
      const { ingredients, fitnessGoal, mealType } = route.params as any;
      const result = await searchRecipes(ingredients, fitnessGoal, mealType);
      setRecipes(result.recipes);
      
      // Save to search history
      const searchHistory = {
        ingredients: ingredients.split(','),
        fitnessGoal,
        mealType,
        timestamp: new Date().toISOString(),
      };
      saveToHistory(searchHistory);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async (searchData: any) => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      const historyArray = history ? JSON.parse(history) : [];
      historyArray.unshift(searchData);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(historyArray.slice(0, 10)));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const toggleFavorite = async (recipe: Recipe) => {
    try {
      const isFavorite = favorites.some(fav => fav.name === recipe.name);
      let newFavorites;
      
      if (isFavorite) {
        newFavorites = favorites.filter(fav => fav.name !== recipe.name);
      } else {
        newFavorites = [...favorites, recipe];
      }
      
      await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  const viewRecipeDetails = (recipe: Recipe) => {
    navigation.navigate('Results', { recipe });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.recipeItem}
            onPress={() => viewRecipeDetails(item)}
          >
            <View style={styles.recipeHeader}>
              <Text style={styles.recipeName}>{item.name}</Text>
              <TouchableOpacity
                onPress={() => toggleFavorite(item)}
                style={styles.favoriteButton}
              >
                <Ionicons 
                  name={favorites.some(fav => fav.name === item.name) ? "heart" : "heart-outline"} 
                  size={24} 
                  color="#ff4444" 
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.recipeDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.recipeDetails}>
              {item.cooking_time + item.prep_time} mins • {item.nutrition.calories} cal
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  recipeItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  favoriteButton: {
    padding: 5,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  recipeDetails: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
}); 
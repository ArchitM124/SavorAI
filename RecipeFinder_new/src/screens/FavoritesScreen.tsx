import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

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

export default function FavoritesScreen() {
  const [favorites, setFavorites] = React.useState<Recipe[]>([]);
  const navigation = useNavigation();

  React.useEffect(() => {
    loadFavorites();
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

  const removeFavorite = async (recipe: Recipe) => {
    try {
      const newFavorites = favorites.filter(fav => fav.name !== recipe.name);
      await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const viewRecipeDetails = (recipe: Recipe) => {
    navigation.navigate('Results', { recipe });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorite Recipes</Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.recipeItem}
            onPress={() => viewRecipeDetails(item)}
          >
            <View style={styles.recipeHeader}>
              <Text style={styles.recipeName}>{item.name}</Text>
              <TouchableOpacity
                onPress={() => removeFavorite(item)}
                style={styles.removeButton}
              >
                <Ionicons name="heart" size={24} color="#ff4444" />
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
            <Text style={styles.emptyText}>No favorite recipes yet</Text>
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
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
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
  removeButton: {
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
}); 
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

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

export default function RecipesScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { recipes } = route.params as { recipes: Recipe[] };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back to Ingredients</Text>
      </TouchableOpacity>

      {recipes.map((recipe, index) => (
        <View key={index} style={styles.recipeCard}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Text style={styles.description}>{recipe.description}</Text>

          <Text style={styles.sectionTitle}>Ingredients:</Text>
          {recipe.ingredients.map((ingredient, i) => (
            <Text key={i} style={styles.listItem}>• {ingredient}</Text>
          ))}

          <Text style={styles.sectionTitle}>Instructions:</Text>
          {recipe.instructions.map((instruction, i) => (
            <Text key={i} style={styles.listItem}>
              {i + 1}. {instruction}
            </Text>
          ))}

          <Text style={styles.sectionTitle}>Nutrition Information:</Text>
          <View style={styles.nutritionInfo}>
            <Text style={styles.nutritionItem}>Calories: {recipe.nutrition.calories}</Text>
            <Text style={styles.nutritionItem}>Protein: {recipe.nutrition.protein}g</Text>
            <Text style={styles.nutritionItem}>Carbs: {recipe.nutrition.carbs}g</Text>
            <Text style={styles.nutritionItem}>Fats: {recipe.nutrition.fats}g</Text>
          </View>

          <Text style={styles.sectionTitle}>Fitness Goal Alignment:</Text>
          <Text style={styles.goalAlignment}>{recipe.goal_alignment}</Text>

          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>
              Prep Time: {recipe.prep_time} minutes
            </Text>
            <Text style={styles.timeText}>
              Cooking Time: {recipe.cooking_time} minutes
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#444',
  },
  listItem: {
    fontSize: 16,
    marginBottom: 8,
    paddingLeft: 10,
    color: '#555',
  },
  nutritionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  nutritionItem: {
    width: '50%',
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  goalAlignment: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  timeText: {
    fontSize: 14,
    color: '#888',
  },
}); 
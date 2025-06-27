import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRecipeSearch } from '../hooks/useRecipeSearch';
import { COLORS } from '../utils/config';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type ResultsScreenProps = {
  navigation: NativeStackNavigationProp<any, 'Results'>;
  route: RouteProp<any, 'Results'>;
};

const ResultsScreen: React.FC<ResultsScreenProps> = ({ route, navigation }) => {
  const { ingredients, fitnessGoal } = route.params;
  const { recipes, loading, error, searchRecipes } = useRecipeSearch();
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);

  useEffect(() => {
    searchRecipes(ingredients, fitnessGoal);
  }, [ingredients, fitnessGoal, searchRecipes]);

  const toggleRecipe = (recipeId: number) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Finding the perfect recipes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Found Recipes</Text>
        {recipes.map((recipe) => (
          <View key={recipe.id} style={styles.recipeCard}>
            <TouchableOpacity
              style={styles.recipeHeader}
              onPress={() => toggleRecipe(recipe.id)}
            >
              <Text style={styles.recipeName}>{recipe.name}</Text>
              <Text style={styles.prepTime}>Prep Time: {recipe.prepTime}</Text>
            </TouchableOpacity>

            {expandedRecipe === recipe.id && (
              <View style={styles.recipeDetails}>
                <Text style={styles.sectionTitle}>Ingredients:</Text>
                {recipe.ingredients.map((ingredient, index) => (
                  <Text key={index} style={styles.ingredient}>• {ingredient}</Text>
                ))}

                <Text style={styles.sectionTitle}>Instructions:</Text>
                <Text style={styles.instructions}>{recipe.instructions}</Text>

                <Text style={styles.sectionTitle}>Nutritional Information:</Text>
                <Text style={styles.nutritionalInfo}>{recipe.nutritionalInfo}</Text>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Search Again</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.text,
  },
  recipeCard: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recipeHeader: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  prepTime: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  recipeDetails: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  ingredient: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  instructions: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  nutritionalInfo: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  backButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default ResultsScreen; 
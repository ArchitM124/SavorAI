import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

type Recipe = {
  id: string;
  title: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  servings: number;
};

type RootStackParamList = {
  Results: {
    recipe: Recipe;
  };
};

type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

export default function ResultsScreen() {
  const route = useRoute<ResultsScreenRouteProp>();
  const { recipe } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{recipe.title}</Text>
      {recipe.image && (
        <Image
          source={{ uri: recipe.image }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Cooking Time: {recipe.cookingTime} minutes</Text>
        <Text style={styles.infoText}>Servings: {recipe.servings}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <Text key={index} style={styles.listItem}>• {ingredient}</Text>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.instructions.map((instruction, index) => (
          <Text key={index} style={styles.listItem}>
            {index + 1}. {instruction}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listItem: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
}); 
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  HomeScreen: undefined;
  Ingredients: undefined;
  Recipes: { ingredients: string[] };
  Results: undefined;
};

type IngredientsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Ingredients'>;

export default function IngredientsScreen() {
  const navigation = useNavigation<IngredientsScreenNavigationProp>();
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);

  const addIngredient = () => {
    if (currentIngredient.trim()) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const findRecipes = () => {
    if (ingredients.length > 0) {
      navigation.navigate('Recipes', { ingredients });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Your Ingredients</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={currentIngredient}
          onChangeText={setCurrentIngredient}
          placeholder="Enter an ingredient"
          onSubmitEditing={addIngredient}
        />
        <Button title="Add" onPress={addIngredient} />
      </View>
      <ScrollView style={styles.ingredientsList}>
        {ingredients.map((ingredient, index) => (
          <Text key={index} style={styles.ingredient}>• {ingredient}</Text>
        ))}
      </ScrollView>
      <Button
        title="Find Recipes"
        onPress={findRecipes}
        disabled={ingredients.length === 0}
      />
    </View>
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
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  ingredientsList: {
    flex: 1,
    marginBottom: 20,
  },
  ingredient: {
    fontSize: 16,
    marginBottom: 10,
  },
}); 
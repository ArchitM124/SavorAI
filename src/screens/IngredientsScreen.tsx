import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api, { endpoints } from '../api/config';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export default function IngredientsScreen() {
  const navigation = useNavigation();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient>({
    name: '',
    quantity: '',
    unit: '',
  });
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [mealType, setMealType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addIngredient = () => {
    if (!currentIngredient.name.trim()) {
      Alert.alert('Error', 'Please enter an ingredient name');
      return;
    }
    setIngredients([...ingredients, currentIngredient]);
    setCurrentIngredient({ name: '', quantity: '', unit: '' });
  };

  const removeIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const findRecipes = async () => {
    if (ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post(endpoints.recipes, {
        ingredients,
        fitness_goal: fitnessGoal,
        meal_type: mealType,
      });

      navigation.navigate('Recipes', { recipes: response.data.recipes });
    } catch (error) {
      Alert.alert('Error', 'Failed to get recipes. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Your Ingredients</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ingredient name"
          value={currentIngredient.name}
          onChangeText={(text) => setCurrentIngredient({ ...currentIngredient, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Quantity (optional)"
          value={currentIngredient.quantity}
          onChangeText={(text) => setCurrentIngredient({ ...currentIngredient, quantity: text })}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Unit (optional)"
          value={currentIngredient.unit}
          onChangeText={(text) => setCurrentIngredient({ ...currentIngredient, unit: text })}
        />
        <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
          <Text style={styles.buttonText}>Add Ingredient</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ingredientsList}>
        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientItem}>
            <Text>
              {ingredient.name}
              {ingredient.quantity && ingredient.unit
                ? ` (${ingredient.quantity} ${ingredient.unit})`
                : ''}
            </Text>
            <TouchableOpacity onPress={() => removeIngredient(index)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.preferencesContainer}>
        <TextInput
          style={styles.input}
          placeholder="Fitness Goal (e.g., high protein, low carb)"
          value={fitnessGoal}
          onChangeText={setFitnessGoal}
        />
        <TextInput
          style={styles.input}
          placeholder="Meal Type (e.g., breakfast, lunch, dinner)"
          value={mealType}
          onChangeText={setMealType}
        />
      </View>

      <TouchableOpacity
        style={[styles.findButton, isLoading && styles.disabledButton]}
        onPress={findRecipes}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Finding Recipes...' : 'Find Recipes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  findButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ingredientsList: {
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  removeText: {
    color: '#f44336',
  },
  preferencesContainer: {
    marginBottom: 20,
  },
}); 
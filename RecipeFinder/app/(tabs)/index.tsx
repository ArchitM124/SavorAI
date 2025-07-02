import { StyleSheet, Alert, KeyboardAvoidingView, Platform, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, View, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState, useEffect, useRef } from 'react';
import { searchRecipes, testServerConnection } from '@/src/api/config';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
}

const FITNESS_GOALS = ['Bulking', 'Cutting', 'Maintenance', 'Weight Loss', 'Muscle Gain'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function HomeScreen() {
  const { repeatSearch } = useLocalSearchParams();
  const [fitnessGoal, setFitnessGoal] = useState<string>('');
  const [mealType, setMealType] = useState<string>('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '', unit: '' },
    { name: '', amount: '', unit: '' },
    { name: '', amount: '', unit: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Handle repeat search from history
  useEffect(() => {
    if (repeatSearch) {
      try {
        const historyItem = JSON.parse(repeatSearch as string);
        setFitnessGoal(historyItem.fitnessGoal);
        setMealType(historyItem.mealType);
        
        // Parse ingredients from the saved string
        const ingredientNames = historyItem.ingredients.split(', ').map((ing: string) => ing.trim());
        const newIngredients = ingredientNames.map((name: string) => ({ name, amount: '', unit: '' }));
        setIngredients(newIngredients.length > 0 ? newIngredients : [{ name: '', amount: '', unit: '' }]);
      } catch (error) {
        console.error('Error parsing repeat search:', error);
      }
    }
  }, [repeatSearch]);

  // Test server connection on app load
  useEffect(() => {
    testServerConnection();
    
    // Also test with native fetch
    const testNativeFetch = async () => {
      try {
        console.log('Testing native fetch to:', 'http://18.216.74.132:8000');
        const response = await fetch('http://18.216.74.132:8000', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Native fetch response:', response.status, response.statusText);
      } catch (error: any) {
        console.error('Native fetch failed:', error?.message);
      }
    };
    
    testNativeFetch();
  }, []);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };
  
  const handleSearch = async () => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the search to prevent rapid successive calls
    searchTimeoutRef.current = setTimeout(async () => {
      await performSearch();
    }, 300); // 300ms delay
  };

  const performSearch = async () => {
    if (!fitnessGoal) {
      Alert.alert('Error', 'Please select a fitness goal');
      return;
    }

    if (!mealType) {
      Alert.alert('Error', 'Please select a meal type');
      return;
    }

    // Filter and validate ingredients
    const validIngredients = ingredients.filter(ing => {
      // If amount or unit is filled, name is required
      if (ing.amount || ing.unit) {
        return ing.name.trim() !== '';
      }
      // Otherwise, include only if name is filled
      return ing.name.trim() !== '';
    });

    if (validIngredients.length === 0) {
      Alert.alert('Error', 'Please enter at least one ingredient');
      return;
    }

    setIsLoading(true);
    try {
      const formattedIngredients = validIngredients.map(ing => {
        const parts = [ing.name.trim()];
        if (ing.amount && ing.unit) {
          parts.unshift(`${ing.amount} ${ing.unit}`);
        }
        return parts.join(' ');
      });

      const recipes = await searchRecipes(formattedIngredients.join(', '), fitnessGoal, mealType);
      router.push({
        pathname: "/(tabs)/results",
        params: { 
          recipes: JSON.stringify(recipes.recipes),
          hasExtraIngredients: JSON.stringify(recipes.hasExtraIngredients),
          originalIngredients: formattedIngredients.join(', '),
          fitnessGoal: fitnessGoal,
          mealType: mealType
        }
      });

      // Save to history
      await saveToHistory(formattedIngredients.join(', '), fitnessGoal, mealType);
    } catch (error: any) {
      console.error('Search error in HomeScreen:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      
      Alert.alert(
        'Error',
        'Failed to fetch recipes. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const saveToHistory = async (ingredientsString: string, fitnessGoal: string, mealType: string) => {
    try {
      const historyItem = {
        id: Date.now().toString(),
        ingredients: ingredientsString,
        fitnessGoal,
        mealType,
        timestamp: Date.now()
      };
      
      const existingHistory = await AsyncStorage.getItem('searchHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Add new item to the beginning
      history.unshift(historyItem);
      
      // Keep only last 20 searches
      const limitedHistory = history.slice(0, 20);
      
      await AsyncStorage.setItem('searchHistory', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText style={styles.title}>SavorAI</ThemedText>
        <ThemedView style={styles.content}>
          <ThemedView style={styles.section}>
            <ThemedText style={styles.label}>Select Fitness Goal</ThemedText>
            <View style={styles.goalsContainer}>
              {FITNESS_GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalButton,
                    fitnessGoal === goal && styles.goalButtonSelected
                  ]}
                  onPress={() => setFitnessGoal(goal)}
                >
                  <ThemedText style={[
                    styles.goalButtonText,
                    fitnessGoal === goal && styles.goalButtonTextSelected
                  ]}>
                    {goal}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText style={styles.label}>Select Meal Type</ThemedText>
            <View style={styles.goalsContainer}>
              {MEAL_TYPES.map((meal) => (
                <TouchableOpacity
                  key={meal}
                  style={[
                    styles.goalButton,
                    mealType === meal && styles.goalButtonSelected
                  ]}
                  onPress={() => setMealType(meal)}
                >
                  <ThemedText style={[
                    styles.goalButtonText,
                    mealType === meal && styles.goalButtonTextSelected
                  ]}>
                    {meal}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText style={styles.label}>Ingredients</ThemedText>
            <ThemedText style={styles.subtitle}>Basic ingredients like salt, pepper, oil, etc. are assumed available</ThemedText>
            
            <View style={styles.inputLabelsRow}>
              <View style={styles.labelContainer}>
                <ThemedText style={[styles.inputLabel, styles.nameInputLabel]}>Required*</ThemedText>
              </View>
              <View style={[styles.labelContainer, styles.optionalLabelContainer]}>
                <ThemedText style={[styles.inputLabel, styles.optionalInputLabel]}>Optional</ThemedText>
              </View>
              <View style={[styles.labelContainer, styles.optionalLabelContainer]}>
                <ThemedText style={[styles.inputLabel, styles.optionalInputLabel]}>Optional</ThemedText>
              </View>
            </View>
            
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientContainer}>
                <View style={styles.ingredientRow}>
                  <TextInput
                    style={[styles.input, styles.nameInput]}
                    value={ingredient.name}
                    onChangeText={(value) => updateIngredient(index, 'name', value)}
                    placeholder="Enter ingredient"
                    placeholderTextColor="#666"
                    editable={!isLoading}
                  />
                  <TextInput
                    style={[styles.input, styles.amountInput]}
                    value={ingredient.amount}
                    onChangeText={(value) => updateIngredient(index, 'amount', value)}
                    placeholder="Amount"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                  <TextInput
                    style={[styles.input, styles.unitInput]}
                    value={ingredient.unit}
                    onChangeText={(value) => updateIngredient(index, 'unit', value)}
                    placeholder="Unit"
                    placeholderTextColor="#666"
                    editable={!isLoading}
                  />
                </View>
                {ingredients.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeIngredient(index)}
                    disabled={isLoading}
                  >
                    <ThemedText style={styles.removeButtonText}>✕</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={addIngredient}
              disabled={isLoading}
            >
              <ThemedText style={styles.addButtonText}>+ Add Another Ingredient</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.searchButton, isLoading && styles.buttonDisabled]} 
              onPress={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.buttonText}>Find Recipes</ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ScrollView>

      <Modal
        visible={isLoading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <ThemedText style={styles.loadingText}>Finding the perfect recipes...</ThemedText>
            <ThemedText style={styles.loadingSubtext}>This may take a few moments</ThemedText>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputLabelsRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
  },
  nameInputLabel: {
    flex: 2,
    textAlign: 'left',
  },
  optionalLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  optionalInputLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  goalButtonSelected: {
    backgroundColor: '#007AFF',
  },
  goalButtonText: {
    fontSize: 16,
    color: '#333',
  },
  goalButtonTextSelected: {
    color: 'white',
  },
  ingredientContainer: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    height: 36,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  nameInput: {
    flex: 2,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    marginRight: 8,
  },
  unitInput: {
    flex: 1,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#FF3B30',
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#007AFF80',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  picker: {
    marginTop: Platform.OS === 'ios' ? -6 : -12,
    marginBottom: Platform.OS === 'ios' ? -6 : -12,
    height: 36,
  },
  labelContainer: {
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRecipeSearch } from '../hooks/useRecipeSearch';
import { COLORS, APP_CONSTANTS } from '../utils/config';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any, 'Home'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [ingredients, setIngredients] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const { loading, error, searchRecipes } = useRecipeSearch();

  const handleSubmit = async () => {
    if (!ingredients.trim()) {
      Alert.alert('Error', 'Please enter at least one ingredient');
      return;
    }

    try {
      await searchRecipes(ingredients, fitnessGoal);
      navigation.navigate('Results', {
        ingredients,
        fitnessGoal,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to find recipes. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Recipe AI</Text>
        <View style={styles.form}>
          <Text style={styles.label}>Enter Ingredients</Text>
          <TextInput
            style={styles.input}
            value={ingredients}
            onChangeText={setIngredients}
            placeholder="e.g., chicken, rice, tomatoes"
            multiline
            maxLength={200}
          />
          
          <Text style={styles.label}>Fitness Goal (optional)</Text>
          <TextInput
            style={styles.input}
            value={fitnessGoal}
            onChangeText={setFitnessGoal}
            placeholder="e.g., build muscle, lose weight"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Finding Recipes...' : 'Find Recipes'}
            </Text>
          </TouchableOpacity>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
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
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: COLORS.text,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: COLORS.text,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default HomeScreen; 
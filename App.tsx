import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IngredientsScreen from './src/screens/IngredientsScreen';
import RecipesScreen from './src/screens/RecipesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Ingredients"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Ingredients"
          component={IngredientsScreen}
          options={{ title: 'Recipe AI' }}
        />
        <Stack.Screen
          name="Recipes"
          component={RecipesScreen}
          options={{ title: 'Your Recipes' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

interface SearchHistory {
  id: string;
  ingredients: string;
  fitnessGoal: string;
  mealType: string;
  timestamp: number;
}

export default function HistoryScreen() {
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  // Reload history when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('searchHistory');
      if (storedHistory) {
        setSearchHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all search history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('searchHistory');
              setSearchHistory([]);
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          }
        }
      ]
    );
  };

  const deleteHistoryItem = async (itemId: string) => {
    try {
      const updatedHistory = searchHistory.filter(item => item.id !== itemId);
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  };

  const confirmDeleteItem = (item: SearchHistory) => {
    Alert.alert(
      'Delete Search',
      `Delete search for "${item.ingredients}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteHistoryItem(item.id)
        }
      ]
    );
  };

  const repeatSearch = (historyItem: SearchHistory) => {
    // Navigate to home screen with the search parameters
    router.push({
      pathname: "/(tabs)",
      params: { 
        repeatSearch: JSON.stringify(historyItem)
      }
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (searchHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText style={styles.title}>Search History</ThemedText>
          <ThemedText style={styles.subtitle}>
            Your past searches will appear here. Start searching for recipes to build your history!
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Search History</ThemedText>
            <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
              <ThemedText style={styles.clearButtonText}>Clear All</ThemedText>
            </TouchableOpacity>
          </View>
          
          {searchHistory.map((item, index) => (
            <View key={item.id} style={styles.historyItem}>
              <TouchableOpacity
                style={styles.historyContent}
                onPress={() => repeatSearch(item)}
              >
                <ThemedText style={styles.ingredientsText}>{item.ingredients}</ThemedText>
                <View style={styles.metaInfo}>
                  <ThemedText style={styles.metaText}>{item.fitnessGoal} • {item.mealType}</ThemedText>
                  <ThemedText style={styles.dateText}>{formatDate(item.timestamp)}</ThemedText>
                </View>
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.repeatButton}
                  onPress={() => repeatSearch(item)}
                >
                  <ThemedText style={styles.repeatIcon}>↻</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => confirmDeleteItem(item)}
                >
                  <ThemedText style={styles.deleteIcon}>🗑️</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  historyItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
  },
  ingredientsText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repeatButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffe6e6',
  },
  repeatIcon: {
    fontSize: 18,
    color: '#007AFF',
  },
  deleteIcon: {
    fontSize: 18,
    color: '#FF6B6B',
  },
}); 
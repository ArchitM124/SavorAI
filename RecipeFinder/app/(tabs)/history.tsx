import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

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
    try {
      await AsyncStorage.removeItem('searchHistory');
      setSearchHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const repeatSearch = (historyItem: SearchHistory) => {
    router.push({
      pathname: "/",
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
            <TouchableOpacity
              key={item.id}
              style={styles.historyItem}
              onPress={() => repeatSearch(item)}
            >
              <View style={styles.historyContent}>
                <ThemedText style={styles.ingredientsText}>{item.ingredients}</ThemedText>
                <View style={styles.metaInfo}>
                  <ThemedText style={styles.metaText}>{item.fitnessGoal} • {item.mealType}</ThemedText>
                  <ThemedText style={styles.dateText}>{formatDate(item.timestamp)}</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.repeatIcon}>↻</ThemedText>
            </TouchableOpacity>
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
  repeatIcon: {
    fontSize: 20,
    color: '#007AFF',
    marginLeft: 12,
  },
}); 

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const WebNavBar = () => {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.navBar, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.navContent}>
        <Link href="/(tabs)" asChild>
          <TouchableOpacity>
            <Text style={styles.brand}>SavorAI</Text>
          </TouchableOpacity>
        </Link>
        <View style={styles.navLinks}>
          <Link href="/(tabs)" asChild>
            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navLinkText}>Home</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/favorites" asChild>
            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navLinkText}>Favorites</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/history" asChild>
            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navLinkText}>History</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 1000,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
  brand: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  navLinks: {
    flexDirection: 'row',
    gap: 40,
  },
  navLink: {
    paddingVertical: 5,
  },
  navLinkText: {
    fontSize: 18,
  },
});

export default WebNavBar;

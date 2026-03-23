import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LiveTrackingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Transportation tracking system</Text>
      <Text style={styles.screenName}>Live Tracking Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  screenName: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
  },
});

export default LiveTrackingScreen;

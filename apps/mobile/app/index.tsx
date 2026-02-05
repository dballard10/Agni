/**
 * Home screen for the Agni mobile app.
 * This is a placeholder that will be expanded with actual features.
 */

import { View, Text, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import Constants from 'expo-constants'

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Agni' }} />

      <View style={styles.header}>
        <Text style={styles.title}>Agni Mobile</Text>
        <Text style={styles.subtitle}>
          Expo SDK {Constants.expoConfig?.sdkVersion ?? 'unknown'}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.text}>
          This is the Agni mobile app shell. Features will be implemented using
          React Native components that mirror the web app's functionality.
        </Text>
        <Text style={styles.code}>@agni/api</Text>
        <Text style={styles.text}>and</Text>
        <Text style={styles.code}>@agni/shared</Text>
        <Text style={styles.text}>
          will provide shared types and API client.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 24,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#eaeaea',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  text: {
    fontSize: 16,
    color: '#eaeaea',
    lineHeight: 24,
    marginBottom: 8,
  },
  code: {
    backgroundColor: '#0f3460',
    color: '#eaeaea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: 'monospace',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
})

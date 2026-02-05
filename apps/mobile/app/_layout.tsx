/**
 * Root layout for the Expo Router app.
 * Handles navigation structure and global providers.
 */

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#16213e',
          },
          headerTintColor: '#eaeaea',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#1a1a2e',
          },
        }}
      />
    </SafeAreaProvider>
  )
}

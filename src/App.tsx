import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './navigation/RootNavigator';
import { AdManager } from './core/ads/adManager';
import { HistoryRepository } from './core/storage/historyRepository';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

// Keep the splash screen visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize SQLite schema and AdMob in parallel
        await Promise.allSettled([
          HistoryRepository.getInstance().init(),
          AdManager.getInstance().initialize(),
        ]);
      } catch (err) {
        console.warn('Initialization error:', err);
      } finally {
        // Hide splash screen smoothly once the foundation is ready
        await SplashScreen.hideAsync().catch(() => {});
      }
    };

    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <RootNavigator />
          <StatusBar style="light" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import KaamHisab from './src/KaamHisab';
import ErrorBoundary from './src/ui/ErrorBoundary';
import { ThemeProvider } from './src/ui/theme-context';

export default function App() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: '#f2f2f7' }} />;
  return (
    <SafeAreaProvider>
      {/* A crash anywhere below shows a friendly screen instead of a blank page. */}
      <ThemeProvider mode="light">
        <ErrorBoundary background="#f2f2f7">
          <KaamHisab />
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

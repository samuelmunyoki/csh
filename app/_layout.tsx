import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; 
// 1. Import LogBox to hide the internal library warning
import { LogBox } from 'react-native'; 
import { useAuthStore } from '@/store/useAuthStore';
import { NotificationService } from '@/services/notificationService';
import { AuthService } from '@/services/authService';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setUser } = useAuthStore();
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn('[RootLayout] Initialization error:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, [setUser]);

  if (!isReady) {
    return null;
  }


  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* 3. Ensure StatusBar is configured for the new Android logic */}
      <StatusBar/>
      <Stack
        screenOptions={{
          headerShown: false,
          
          contentStyle: { backgroundColor: 'white' } 
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}
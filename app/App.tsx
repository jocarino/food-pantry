import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Handle incoming deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Deep link received (app open):', url);
      handleDeepLink(url);
    });

    // Handle deep link that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 App opened with URL:', url);
        handleDeepLink(url);
      } else {
        console.log('🔗 App opened without URL');
      }
    });

    // Also check when app comes to foreground (for share intents)
    const subscription2 = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('🔗 App became active, checking for URL...');
        Linking.getInitialURL().then((url) => {
          if (url) {
            console.log('🔗 Found URL after becoming active:', url);
            handleDeepLink(url);
          }
        });
      }
    });

    return () => {
      subscription.remove();
      subscription2.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    console.log('🔗 handleDeepLink called with:', url);
    
    // Parse the URL
    const parsed = Linking.parse(url);
    console.log('🔗 Parsed deep link:', JSON.stringify(parsed, null, 2));
    
    // Check if it's a social media URL
    const isSocialMedia = url.includes('instagram.com') || 
                         url.includes('tiktok.com') || 
                         url.includes('facebook.com');
    
    if (isSocialMedia) {
      console.log('🔗 Social media URL detected!');
      
      // Store the URL
      await AsyncStorage.setItem('pending_shared_url', url);
      console.log('🔗 Stored URL in AsyncStorage');
      
      // Show immediate feedback
      setTimeout(() => {
        Alert.alert(
          '📱 Recipe Link Received!',
          `You shared a recipe from social media!\n\nURL: ${url.substring(0, 50)}...\n\nNavigate to the Recipes screen to add it.`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
      }, 1000); // Delay to ensure app is ready
    } else {
      console.log('🔗 Not a social media URL:', url);
    }
  };
  
  // Check native SharedPreferences for share intent data
  const checkNativeSharedData = async () => {
    try {
      const { default: SharedPreferences } = await import('react-native').then(rn => ({
        default: rn.NativeModules.SharedPreferences
      }));
      
      // For now, we'll just check AsyncStorage since the native data
      // should be picked up by RecipesScreen
      console.log('🔗 Checking for native shared data...');
    } catch (error) {
      console.log('🔗 No native shared data module');
    }
  };

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}

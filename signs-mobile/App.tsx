import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Alert, View, Text, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/LoginScreen';
import MapScreen from './screens/MapScreen';
import BusinessInfoScreen from './screens/BusinessInfoScreen';
import BusinessDetailScreen from './screens/BusinessDetailScreen';
import ProductSelectionScreen from './screens/ProductSelectionScreen';
import NFCActionScreen from './screens/NFCActionScreen';
import SaleCreationScreen from './screens/SaleCreationScreen';
import EraseTagScreen from './screens/EraseTagScreen';
import AdminSearchScreen from './screens/AdminSearchScreen';
import WiFiCredentialScreen from './screens/WiFiCredentialScreen';
import WiFiNFCWriteScreen from './screens/WiFiNFCWriteScreen';
import MultiPlatformTagScreen from './screens/MultiPlatformTagScreen';
import SignTypeSelectionScreen from './screens/SignTypeSelectionScreen';
import FruitMachineNFCScreen from './screens/FruitMachineNFCScreen';
import FruitMachineSetupScreen from './screens/FruitMachineSetupScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

const Stack = createNativeStackNavigator();

// Deep linking configuration
const linking = {
  prefixes: ['review-signs://', 'https://review-signs.co.uk'],
  config: {
    screens: {
      FruitMachineNFC: 'fruit-machine?promotionId=:promotionId&placeId=:placeId',
    },
  },
};

// Global error handler
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('Global error caught:', error, isFatal);
  console.error('Error stack:', error.stack);
  
  // Ignore devtools websocket errors in production builds
  if (error.message?.includes('devtools websocket') || error.message?.includes('runtime not ready')) {
    console.warn('Ignoring dev tools error in production build');
    return;
  }
  
  if (isFatal) {
    Alert.alert(
      'Unexpected error occurred',
      `
Error: ${error.name}
Message: ${error.message}
Stack: ${error.stack?.substring(0, 500)}

Please report this to support.
      `,
      [{
        text: 'OK'
      }]
    );
  }
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (!AsyncStorage) {
        console.error('AsyncStorage is not initialized');
        setIsLoading(false);
        return;
      }
      const token = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth:', error);
      // Continue even if AsyncStorage fails - user can login
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      if (AsyncStorage) {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Loading...</Text>
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>© 2025 Daniel Allport</Text>
          <Text style={styles.versionText}>Version 1.0.1 • Build 10</Text>
          <Text style={styles.versionText}>Released November 2025</Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer 
      linking={linking} 
      fallback={<ActivityIndicator color="#4f46e5" />}
      onReady={() => {
        console.log('NavigationContainer ready with deep linking');
      }}
    >
      <StatusBar style="auto" />
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen 
              name="Map" 
              options={({ navigation }) => ({
                title: 'Find Businesses',
                headerRight: () => (
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('AdminSearch')}
                    style={{ paddingRight: 15 }}
                  >
                    <Text style={{ fontSize: 18, color: '#007AFF' }}>🔍</Text>
                  </TouchableOpacity>
                )
              })}
            >
              {(props) => <MapScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="BusinessInfo"
              options={{ title: 'Business Review Platforms' }}
            >
              {(props) => (
                <ErrorBoundary navigation={props.navigation}>
                  <BusinessInfoScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen
              name="BusinessDetail"
              options={{ title: 'Business Details' }}
            >
              {(props) => (
                <ErrorBoundary navigation={props.navigation}>
                  <BusinessDetailScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen
              name="WiFiCredential"
              options={{ title: 'WiFi Credentials' }}
            >
              {(props) => (
                <ErrorBoundary navigation={props.navigation}>
                  <WiFiCredentialScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen
              name="WiFiNFCWrite"
              options={{ title: 'Write WiFi to Tag' }}
            >
              {(props) => (
                <ErrorBoundary navigation={props.navigation}>
                  <WiFiNFCWriteScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen
              name="MultiPlatformTag"
              options={{ title: 'Multi-Platform Tag' }}
            >
              {(props) => (
                <ErrorBoundary navigation={props.navigation}>
                  <MultiPlatformTagScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen
              name="SignTypeSelection"
              options={{ title: 'Choose Sign Type' }}
            >
              {(props) => (
                <ErrorBoundary navigation={props.navigation}>
                  <SignTypeSelectionScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen
              name="ProductSelection"
              options={{ title: 'Choose Product' }}
            >
              {(props) => (
                <ErrorBoundary navigation={props.navigation}>
                  <ProductSelectionScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen
              name="NFCAction"
              options={{ title: 'Program Sign' }}
            >
              {(props) => (
                <ErrorBoundary navigation={props.navigation}>
                  <NFCActionScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen
              name="SaleCreation"
              options={{ title: 'Create Sale' }}
            >
              {(props) => (
                <ErrorBoundary navigation={props.navigation}>
                  <SaleCreationScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="EraseTag" 
              component={EraseTagScreen}
              options={{ title: 'Erase NFC Tag' }}
            />
            <Stack.Screen 
              name="AdminSearch" 
              component={AdminSearchScreen}
              options={{ title: 'Admin Business Search' }}
            />
            <Stack.Screen 
              name="FruitMachineNFC" 
              options={{ title: 'Fruit Machine Promotion' }}
            >
              {(props) => (
                <ErrorBoundary navigation={props.navigation}>
                  <FruitMachineNFCScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="FruitMachineSetup" 
              options={{ title: 'Setup Fruit Machine Promo' }}
            >
              {(props) => (
                <ErrorBoundary navigation={props.navigation}>
                  <FruitMachineSetupScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4f46e5',
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  cardText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  copyrightContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 11,
    color: '#d1d5db',
    marginTop: 2,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  FlatList,
  Keyboard
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Business } from '../types';

// API URL - use environment variable or default to network IP
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

// Default fallback location: Central Manchester, UK
const DEFAULT_LOCATION = {
  latitude: 53.4808,
  longitude: -2.2426,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen({ navigation, onLogout, route }: any) {
  const [location, setLocation] = useState<any>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isListVisible, setIsListVisible] = useState(true);
  const [searchRadius, setSearchRadius] = useState(3000); // Default 3000m
  
  // Get return destination and purpose from route params
  const returnTo = route?.params?.returnTo;
  const purpose = route?.params?.purpose;

  useEffect(() => {
    loadUser();
    fetchSearchRadius();
    requestLocationPermission();
  }, []);

  const loadUser = async () => {
    try {
      if (!AsyncStorage) {
        console.warn('AsyncStorage not available');
        return;
      }
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user from AsyncStorage:', error);
    }
  };

  const fetchSearchRadius = async () => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/search-settings`);
      
      // Check if response is OK before parsing
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      if (data.searchDistance) {
        setSearchRadius(data.searchDistance);
      }
    } catch (error) {
      // Silently use default - this endpoint is optional
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission not granted, using default location (Manchester, UK)');
      setLocation(DEFAULT_LOCATION);
      searchNearby(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
      return;
    }
    getCurrentLocation();
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      searchNearby(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocation(DEFAULT_LOCATION);
      searchNearby(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
    } finally {
      setLoading(false);
    }
  };

  const searchNearby = async (lat: number, lng: number, keyword: string = searchKeyword) => {
    setLoading(true);
    try {
      let token = '';
      try {
        token = await AsyncStorage.getItem('authToken') || '';
      } catch (error) {
        console.error('Error retrieving auth token:', error);
      }
      // Convert radius from meters to kilometers (API expects radius in meters but we'll use the dynamic value)
      const radiusInMeters = searchRadius || 3000;
      const url = `${API_URL}/places/search?latitude=${lat}&longitude=${lng}&radius=${radiusInMeters}${keyword ? `&keyword=${keyword}` : ''}`;
      console.log('Searching places with URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Search response status:', response.status);
      const data = await response.json();
      console.log('Search response data:', data);
      
      if (response.ok && data.success) {
        setBusinesses(data.data || []);
      } else if (data.success && data.data) {
        // Even if response isn't fully ok, if data has success flag and data, use it
        setBusinesses(data.data);
      } else {
        console.error('Search failed:', data);
        Alert.alert('Error', data.error || 'Failed to search businesses');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search nearby businesses: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (business: Business) => {
    if (!business) {
      Alert.alert('Error', 'No business data available');
      return;
    }
    
    if (!business.placeId || !business.name) {
      Alert.alert('Error', 'Business data is incomplete');
      return;
    }
    
    try {
      // If this map was opened to return a business selection, navigate back with the business
      if (returnTo) {
        navigation.navigate(returnTo, { business });
        return;
      }
      
      // Otherwise, navigate to BusinessDetail for normal workflow
      navigation.navigate('BusinessDetail', { business });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to navigate: ' + error.message);
    }
  };

  const handleSearch = () => {
    Keyboard.dismiss();
    if (location) {
      searchNearby(location.latitude, location.longitude, searchKeyword);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: onLogout, style: 'destructive' }
      ]
    );
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {purpose && (
        <View style={styles.purposeBanner}>
          <Text style={styles.purposeText}>📍 {purpose}</Text>
        </View>
      )}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={location}
        showsUserLocation
        showsMyLocationButton
      >
        {businesses.map((business) => (
          <Marker
            key={business.placeId}
            coordinate={{
              latitude: business.location.lat,
              longitude: business.location.lng,
            }}
          >
            <Callout onPress={() => handleMarkerPress(business)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{business.name}</Text>
                <Text style={styles.calloutAddress}>{business.address}</Text>
                <Text style={styles.calloutTapText}>Tap to program NFC tag</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search (e.g., restaurant, cafe)"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          blurOnSubmit={true}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {businesses.length > 0 && (
        <>
          <TouchableOpacity 
            style={[
              styles.toggleListButton,
              !isListVisible && styles.toggleListButtonHidden
            ]} 
            onPress={() => setIsListVisible(!isListVisible)}
          >
            <Text style={styles.toggleListButtonText}>
              {isListVisible ? '▼ Hide List' : '▲ Show List'}
            </Text>
          </TouchableOpacity>

          {isListVisible && (
            <View style={styles.listContainer}>
              <FlatList
                data={businesses}
                keyExtractor={(item) => item.placeId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => handleMarkerPress(item)}
                  >
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemName}>{item.name}</Text>
                      <Text style={styles.listItemAddress} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </>
      )}

      <View style={styles.bottomBar}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || user?.email}</Text>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Text style={styles.userRole}>{user.role}</Text>
          )}
        </View>
        <View style={styles.stats}>
          <Text style={styles.statsText}>{businesses.length} businesses found</Text>
        </View>
        <TouchableOpacity 
          style={styles.adminButton} 
          onPress={() => navigation.navigate('AdminSearch')}
        >
          <Text style={styles.adminButtonText}>🔍 Global</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  calloutContainer: {
    minWidth: 200,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  calloutTapText: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: '600',
    textAlign: 'center',
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  toggleListButton: {
    position: 'absolute',
    bottom: 290,
    right: 10,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleListButtonHidden: {
    bottom: 90,
  },
  toggleListButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  listContainer: {
    position: 'absolute',
    bottom: 80,
    left: 10,
    right: 10,
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  listItemAddress: {
    fontSize: 12,
    color: '#6b7280',
  },
  bottomBar: {
    backgroundColor: '#fff',
    padding: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'column',
    gap: 8,
  },
  userInfo: {
    paddingBottom: 4,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  userRole: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4f46e5',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  stats: {
    paddingBottom: 4,
  },
  statsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  adminButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  purposeBanner: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  purposeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
  Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socialMediaService } from '../services/socialMediaService';
import PLATFORM_ICONS from '../assets/platform-icons';
import { Image } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

interface Business {
  placeId: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  userRatingsTotal?: number;
  reviewUrl: string;
  mapsUrl: string;
  // optional container for prefetched social links
  social?: any;
}

export default function AdminSearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Required', 'Please enter a business name or location to search');
      return;
    }

    Keyboard.dismiss();
    setBusinesses([]);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      const url = `${API_URL}/places/text-search?query=${encodeURIComponent(searchQuery)}`;
      console.log('Admin search URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Admin search response status:', response.status);
      const data = await response.json();
      console.log('Admin search response data:', data);
      
      if (response.ok && data.success) {
        setBusinesses(data.data || []);

        // Prefetch social links for top results (non-blocking)
        if (data.data && data.data.length > 0) {
          const top = data.data.slice(0, 5); // consider top 5 then filter

          // Business classification system - determines which review platforms are relevant
          const getBusinessCategory = (b: any): string => {
            const types: string[] = (b.types || []).map((t: string) => t.toLowerCase());
            const name = (b.name || '').toLowerCase();
            
            // Hospitality & Leisure - TripAdvisor, Google, Facebook, Trustpilot
            if (types.some((t) => ['lodging', 'hotel', 'motel', 'rv_park', 'campground'].includes(t)) || 
                /hotel|motel|guest house|bed and breakfast|bnb|inn|lodge/.test(name)) {
              return 'accommodation';
            }
            if (types.some((t) => ['restaurant', 'cafe', 'bar', 'meal_takeaway', 'meal_delivery', 'bakery', 'food'].includes(t)) ||
                /restaurant|cafe|pub|bistro|eatery|takeaway/.test(name)) {
              return 'food_beverage';
            }
            if (types.some((t) => ['tourist_attraction', 'museum', 'park', 'zoo', 'aquarium', 'amusement_park'].includes(t))) {
              return 'attractions';
            }
            
            // Trades & Services - Checkatrade, TrustATrader, RatedPeople, Yell, Google, Facebook
            if (types.some((t) => ['plumber', 'electrician', 'roofing_contractor', 'general_contractor', 'painter', 'carpenter', 'hvac_contractor'].includes(t)) ||
                /plumber|electrician|builder|contractor|roofer|carpenter|joiner|gas engineer|heating engineer/.test(name)) {
              return 'construction_trades';
            }
            if (types.some((t) => ['car_repair', 'car_dealer', 'car_wash', 'auto_body_shop'].includes(t)) ||
                /garage|mechanic|car repair|auto repair|mot|tyre|bodywork/.test(name)) {
              return 'automotive';
            }
            if (types.some((t) => ['beauty_salon', 'hair_care', 'spa', 'nail_salon'].includes(t)) ||
                /salon|hairdresser|barber|beauty|spa|nails/.test(name)) {
              return 'beauty_wellness';
            }
            if (types.some((t) => ['locksmith', 'moving_company', 'pest_control_service', 'cleaning_service'].includes(t)) ||
                /locksmith|removals|pest control|cleaning|cleaner/.test(name)) {
              return 'home_services';
            }
            
            // Professional Services - Google, Facebook, Trustpilot, Yell (NO trades platforms)
            if (types.some((t) => ['real_estate_agency', 'real_estate_agent'].includes(t)) ||
                /estate agent|letting|property|realty/.test(name)) {
              return 'estate_agents';
            }
            if (types.some((t) => ['lawyer', 'accounting', 'insurance_agency', 'finance'].includes(t)) ||
                /solicitor|lawyer|accountant|insurance|financial advisor/.test(name)) {
              return 'professional_services';
            }
            if (types.some((t) => ['dentist', 'doctor', 'physiotherapist', 'hospital', 'pharmacy', 'veterinary_care'].includes(t)) ||
                /doctor|dentist|dental|medical|clinic|vet|veterinary|physio/.test(name)) {
              return 'healthcare';
            }
            
            // Retail - Google, Facebook, Trustpilot, Yell (NO trades platforms)
            if (types.some((t) => ['store', 'shopping_mall', 'department_store', 'clothing_store', 'shoe_store', 'jewelry_store', 'electronics_store', 'book_store', 'furniture_store', 'home_goods_store', 'hardware_store', 'pet_store', 'florist'].includes(t)) ||
                /shop|store|retail|boutique/.test(name)) {
              return 'retail';
            }
            
            // Education & Childcare - Google, Facebook (limited other platforms)
            if (types.some((t) => ['school', 'university', 'library', 'primary_school', 'secondary_school'].includes(t)) ||
                /school|college|university|education|academy/.test(name)) {
              return 'education';
            }
            if (types.some((t) => ['child_care', 'day_care'].includes(t)) ||
                /nursery|daycare|childcare|pre-school|preschool/.test(name)) {
              return 'childcare';
            }
            
            return 'general'; // Default - Google, Facebook only
          };

          // Determine which businesses should trigger social media prefetch
          const shouldPrefetch = (b: any): boolean => {
            const category = getBusinessCategory(b);
            // Only prefetch for categories that have multiple review platforms beyond Google
            return ['accommodation', 'food_beverage', 'attractions', 'construction_trades', 
                    'automotive', 'beauty_wellness', 'home_services', 'estate_agents'].includes(category);
          };

          const candidates = top.filter((b: any) => shouldPrefetch(b));

          if (candidates.length > 0) {
            Promise.all(candidates.map(async (b: any) => {
              try {
                const soc = await socialMediaService.getSocialMediaLinks(b.name, b.address, b.placeId, false);
                return { placeId: b.placeId, social: soc };
              } catch (e) {
                return { placeId: b.placeId, social: {} };
              }
            })).then((results) => {
              setBusinesses((prev) => prev.map((item) => {
                const found = results.find((r) => r.placeId === item.placeId);
                return found ? { ...item, social: found.social } : item;
              }));
            }).catch((e) => {
              console.error('Prefetch social links failed:', e);
            });
          }
        }

        if (data.data.length === 0) {
          Alert.alert('No Results', 'No businesses found. Try a different search term.');
        }
      } else if (data.success && data.data) {
        // Even if response isn't fully ok, if data has success flag and data, use it
        setBusinesses(data.data);
      } else {
        console.error('Admin search failed:', data);
        Alert.alert('Error', data.error || 'Failed to search businesses');
      }
    } catch (error) {
      console.error('Admin search error:', error);
      Alert.alert('Error', 'Failed to search businesses: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusiness = (business: Business) => {
    // Global (admin) search previously navigated to BusinessInfo ("Business Review Platforms").
    // Keep UX consistent with map/list selections by navigating to BusinessDetail instead.
    navigation.navigate('BusinessDetail', { business });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Business Search</Text>
        <Text style={styles.headerSubtitle}>Search any business worldwide</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search business name or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          blurOnSubmit={true}
          autoCorrect={false}
        />
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {businesses.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {businesses.length} business{businesses.length !== 1 ? 'es' : ''} found
          </Text>
          <FlatList
            data={businesses}
            keyExtractor={(item) => item.placeId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.businessItem}
                onPress={() => handleSelectBusiness(item)}
              >
                <View style={styles.businessContent}>
                  <Text style={styles.businessName}>{item.name}</Text>
                  <Text style={styles.businessAddress} numberOfLines={2}>
                    {item.address}
                  </Text>
                  {item.social?.tripadvisor && (
                    PLATFORM_ICONS['tripadvisor'] ? (
                      <Image source={PLATFORM_ICONS['tripadvisor']} style={styles.platformIcon} />
                    ) : (
                      <Text style={styles.platformIndicator}>🦉 TripAdvisor</Text>
                    )
                  )}
                  {item.rating && (
                    <Text style={styles.businessRating}>
                      ⭐ {item.rating} ({item.userRatingsTotal || 0} reviews)
                    </Text>
                  )}
                </View>
                <Text style={styles.selectButton}>Select →</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={true}
          />
        </View>
      )}

      {!loading && businesses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateTitle}>Global Business Search</Text>
          <Text style={styles.emptyStateText}>
            Enter a business name or location to search anywhere in the world.
            Perfect for programming tags for online orders.
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Searching businesses...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4f46e5',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginRight: 8,
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
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  resultsCount: {
    padding: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  businessItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  businessContent: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  platformIndicator: {
    fontSize: 12,
    color: '#2b6cb0',
    marginBottom: 4,
    fontWeight: '600',
  },
  platformIcon: {
    width: 18,
    height: 18,
    marginBottom: 4,
  },
  businessRating: {
    fontSize: 12,
    color: '#9ca3af',
  },
  selectButton: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '600',
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});

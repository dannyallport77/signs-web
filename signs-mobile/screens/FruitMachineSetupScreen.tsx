import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { nfcLoggingService } from '../services/nfcLoggingService';
import PLATFORM_ICONS from '../assets/platform-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

interface Promotion {
  id: string;
  placeId: string;
  businessName: string;
  prizeType: string;
  giftName?: string;
  giftEmoji?: string;
  enabled: boolean;
}

export default function FruitMachineSetupScreen({ navigation, route }: any) {
  let initialBusiness = route?.params?.business;
  
  const [business, setBusiness] = useState(initialBusiness || null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [nfcReady, setNfcReady] = useState(false);
  const [writing, setWriting] = useState(false);

  // Form fields for new promotion
  const [businessName, setBusinessName] = useState(business?.name || '');
  const [placeId, setPlaceId] = useState(business?.placeId || '');
  const [giftName, setGiftName] = useState('Free Drink');
  const [giftEmoji, setGiftEmoji] = useState('🍺');
  const [usePlatformIcon, setUsePlatformIcon] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    initNfc();
    // Handle business selection from map
    const unsubscribe = navigation.addListener('focus', () => {
      const routeParams = route?.params;
      if (routeParams?.business) {
        setBusiness(routeParams.business);
        setBusinessName(routeParams.business.name || '');
        setPlaceId(routeParams.business.placeId || '');
      }
    });
    
    return unsubscribe;
  }, [navigation, route]);

  useEffect(() => {
    if (business) {
      loadPromotions();
    }
  }, [business]);

  const initNfc = async () => {
    try {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
        setNfcReady(true);
      } else {
        Alert.alert('NFC Not Supported', 'This device does not support NFC');
      }
    } catch (error) {
      console.error('NFC init failed', error);
      Alert.alert('NFC Error', 'Failed to initialize NFC');
    }
  };

  const loadPromotions = async () => {
    if (!business?.placeId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/fruit-machine/promotion/list?placeId=${business.placeId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setPromotions(data);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFromMap = () => {
    // Navigate to map and return when business is selected
    navigation.navigate('Map', {
      returnTo: 'FruitMachineSetup',
      purpose: 'Select a business for fruit machine setup'
    });
  };

  const createPromotion = async () => {
    if (!businessName || !placeId) {
      Alert.alert('Error', 'Business name and place ID are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/fruit-machine/promotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId,
          businessName,
          prizeType: 'gift',
          giftName,
          giftEmoji,
          giftValue: 'Free',
          defaultWinOdds: 0.004, // 1 in 250
          enabled,
        }),
      });

      if (response.ok) {
        const newPromotion = await response.json();
        Alert.alert('Success', 'Promotion created! Now program an NFC tag.');
        setSelectedPromotion(newPromotion);
        if (business) {
          loadPromotions();
        }
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to create promotion');
      }
    } catch (error) {
      console.error('Error creating promotion:', error);
      Alert.alert('Error', 'Failed to create promotion');
    } finally {
      setLoading(false);
    }
  };

  const writeNfcTag = async () => {
    if (!selectedPromotion) {
      Alert.alert('Error', 'Please create or select a promotion first');
      return;
    }

    if (!nfcReady) {
      Alert.alert('NFC Not Ready', 'NFC is not initialized');
      return;
    }

    setWriting(true);

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Create URL that opens the fruit machine screen
      // Use https:// which is more reliably recognized by NFC readers
      const url = `https://review-signs.co.uk/fruit-machine?promotionId=${selectedPromotion.id}&placeId=${selectedPromotion.placeId}`;
      
      console.log('Writing NFC URL:', url);
      
      // Encode as URI record - https:// URLs are universally recognized
      let bytes = null;
      try {
        bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
      } catch (uriError) {
        console.warn('URI record encoding failed, trying text record:', uriError);
        // Fallback to text record if URI encoding fails
        try {
          bytes = Ndef.encodeMessage([Ndef.textRecord(url)]);
        } catch (textError) {
          console.error('Text record encoding also failed:', textError);
          throw new Error('Failed to encode NFC message in both URI and text formats');
        }
      }

      if (!bytes) {
        throw new Error('Failed to encode NFC message');
      }

      await NfcManager.ndefHandler.writeNdefMessage(bytes);

      // Log tag write to backend
      if (selectedPromotion?.businessName && selectedPromotion?.placeId) {
        await nfcLoggingService.logTagWrite({
          businessName: selectedPromotion.businessName,
          businessAddress: selectedPromotion.businessAddress,
          placeId: selectedPromotion.placeId,
          reviewUrl: `fruit-machine://${selectedPromotion.id}`,
          latitude: selectedPromotion.latitude,
          longitude: selectedPromotion.longitude,
          writtenBy: 'Mobile App - Fruit Machine',
        });
      }

      Alert.alert(
        'Success!',
        `NFC tag programmed for ${selectedPromotion.businessName}\n\nCustomers can now tap this tag to spin the fruit machine!`,
        [
          {
            text: 'Program Another',
            onPress: () => {
              setWriting(false);
            },
          },
          {
            text: 'Done',
            onPress: () => {
              setWriting(false);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('NFC write error:', error);
      Alert.alert('Write Failed', 'Could not write to NFC tag: ' + error.message);
    } finally {
      NfcManager.cancelTechnologyRequest();
      setWriting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎰 Fruit Machine Setup</Text>
        <Text style={styles.subtitle}>Program NFC tags for promotions</Text>
      </View>

      {/* Business Selection */}
      {!business ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select a Business</Text>
          <Text style={styles.infoText}>
            Please select a business from the map to set up fruit machine promotions.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSelectFromMap}
          >
            <Text style={styles.buttonText}>🗺️ Select from Map</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Business Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Selected Business</Text>
            <Text style={styles.businessName}>{business.name}</Text>
            <Text style={styles.businessAddress}>{business.address}</Text>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSelectFromMap}
            >
              <Text style={styles.buttonText}>🗺️ Change Business</Text>
            </TouchableOpacity>
          </View>

          {/* Create New Promotion */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create New Promotion</Text>
            
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Enter business name"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Place ID *</Text>
            <TextInput
              style={styles.input}
              value={placeId}
              onChangeText={setPlaceId}
              placeholder="Google Place ID"
              placeholderTextColor="#999"
              editable={false}
            />

            <Text style={styles.label}>Gift Name</Text>
            <TextInput
              style={styles.input}
              value={giftName}
              onChangeText={setGiftName}
              placeholder="e.g., Free Drink"
              placeholderTextColor="#999"
            />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Use Platform Icon</Text>
              <Switch value={usePlatformIcon} onValueChange={(val) => {
                setUsePlatformIcon(val);
                if (val) setGiftEmoji('google'); // Default to google
                else setGiftEmoji('🍺');
              }} />
            </View>

            <Text style={styles.label}>Gift Icon/Emoji</Text>
            {usePlatformIcon ? (
              <View style={styles.iconGrid}>
                {Object.keys(PLATFORM_ICONS).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.iconOption,
                      giftEmoji === key && styles.iconOptionSelected
                    ]}
                    onPress={() => setGiftEmoji(key)}
                  >
                    <Image source={PLATFORM_ICONS[key]} style={styles.platformIcon} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={giftEmoji}
                onChangeText={setGiftEmoji}
                placeholder="e.g., 🍺"
                placeholderTextColor="#999"
              />
            )}

            <View style={styles.switchRow}>
              <Text style={styles.label}>Enabled</Text>
              <Switch value={enabled} onValueChange={setEnabled} />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={createPromotion}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Promotion</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Existing Promotions */}
          {promotions.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Existing Promotions</Text>
              {promotions.map((promo) => (
                <TouchableOpacity
                  key={promo.id}
                  style={[
                    styles.promotionItem,
                    selectedPromotion?.id === promo.id && styles.promotionItemSelected,
                  ]}
                  onPress={() => setSelectedPromotion(promo)}
                >
                  {promo.giftEmoji && PLATFORM_ICONS[promo.giftEmoji] ? (
                    <Image source={PLATFORM_ICONS[promo.giftEmoji]} style={styles.listPlatformIcon} />
                  ) : (
                    <Text style={styles.promotionEmoji}>{promo.giftEmoji || '🎁'}</Text>
                  )}
                  <View style={styles.promotionInfo}>
                    <Text style={styles.promotionName}>{promo.giftName || 'Prize'}</Text>
                    <Text style={styles.promotionBusiness}>{promo.businessName}</Text>
                  </View>
                  <View style={[styles.statusBadge, promo.enabled ? styles.statusEnabled : styles.statusDisabled]}>
                    <Text style={styles.statusText}>{promo.enabled ? 'Active' : 'Disabled'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Write to NFC Tag */}
          {selectedPromotion && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Program NFC Tag</Text>
              <View style={styles.selectedPromotionRow}>
                <Text style={styles.selectedPromotionText}>Selected: </Text>
                {selectedPromotion.giftEmoji && PLATFORM_ICONS[selectedPromotion.giftEmoji] ? (
                  <Image source={PLATFORM_ICONS[selectedPromotion.giftEmoji]} style={styles.selectedPlatformIcon} />
                ) : (
                  <Text style={styles.selectedPromotionEmoji}>{selectedPromotion.giftEmoji}</Text>
                )}
                <Text style={styles.selectedPromotionText}> {selectedPromotion.giftName}</Text>
              </View>
              <Text style={styles.infoText}>
                Tap the button below, then hold an NFC tag near your device to program it.
              </Text>

              <TouchableOpacity
                style={[styles.button, styles.nfcButton, writing && styles.buttonDisabled]}
                onPress={writeNfcTag}
                disabled={writing || !nfcReady}
              >
                {writing ? (
                  <>
                    <ActivityIndicator color="#fff" style={styles.buttonSpinner} />
                    <Text style={styles.buttonText}>Hold tag near device...</Text>
                  </>
                ) : (
                  <Text style={styles.buttonText}>📱 Write to NFC Tag</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
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
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
    marginTop: 12,
  },
  nfcButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSpinner: {
    marginRight: 8,
  },
  promotionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  promotionItemSelected: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  promotionEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  promotionInfo: {
    flex: 1,
  },
  promotionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  promotionBusiness: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusEnabled: {
    backgroundColor: '#dcfce7',
  },
  statusDisabled: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedPromotionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
  },
  backButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  iconOptionSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#e0e7ff',
  },
  platformIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  listPlatformIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    resizeMode: 'contain',
  },
  selectedPromotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectedPlatformIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginHorizontal: 4,
  },
  selectedPromotionEmoji: {
    fontSize: 20,
  },
});

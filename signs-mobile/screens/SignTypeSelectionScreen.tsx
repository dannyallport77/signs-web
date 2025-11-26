import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  AppState
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signTypeService } from '../services/signTypeService';
import { transactionService } from '../services/transactionService';
import { nfcLoggingService } from '../services/nfcLoggingService';
import SalePriceInputModal from '../components/SalePriceInputModal';
import { SignType, Business, Transaction } from '../types';

interface SignTypeSelectionScreenProps {
  navigation: any;
  route: any;
}

export default function SignTypeSelectionScreen({ navigation, route }: SignTypeSelectionScreenProps) {
  const [signTypes, setSignTypes] = useState<SignType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<SignType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [showSalePriceModal, setShowSalePriceModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  
  let business: Business | undefined, reviewUrl: string, reviewPlatform: string, linkDescription: string;
  
  try {
    const params = route?.params || {};
    business = params.business;
    reviewUrl = params.reviewUrl;
    // Check both platformLabel and reviewPlatform for backward compatibility
    reviewPlatform = params.platformLabel || params.reviewPlatform || 'Google Review';
    linkDescription = params.linkDescription || 'Review Link';
  } catch (e) {
    console.error('Error accessing route params:', e);
    setError('Failed to load business data: ' + (e as Error).message);
  }

  useEffect(() => {
    try {
      loadSignTypes();
      initNFC();
    } catch (e) {
      console.error('Error in useEffect:', e);
      setError('Error loading sign types: ' + (e as Error).message);
    }

    // Cleanup NFC on unmount
    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const initNFC = async () => {
    try {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
      }
    } catch (error) {
      console.error('Error initializing NFC:', error);
    }
  };

  const loadSignTypes = async () => {
    try {
      setLoading(true);
      
      // Fetch sign types for the selected platform if available
      let types: SignType[] = [];
      if (reviewPlatform && reviewPlatform !== 'Google Review') {
        // Extract platform key from label (e.g., "Facebook" -> "facebook")
        const platformKey = reviewPlatform.toLowerCase().replace(/\s+/g, '');
        const platformMap: { [key: string]: string } = {
          'facebook': 'facebook',
          'instagram': 'instagram',
          'tripadvisor': 'tripadvisor',
          'trustpilot': 'trustpilot',
          'yell': 'yell',
          'ratedpeople': 'ratedpeople',
          'trustatrader': 'trustatrader',
          'checkatrade': 'checkatrade',
          'tiktok': 'tiktok',
          'twitter': 'twitter',
          'linkedin': 'linkedin',
        };
        
        const platform = platformMap[platformKey];
        if (!platform) {
          types = await signTypeService.getAll();
        } else {
          try {
            types = await signTypeService.getByPlatform(platform);
          } catch (error) {
            types = await signTypeService.getAll();
          }
        }
      } else {
        types = await signTypeService.getAll();
      }
      
      setSignTypes(types.filter(t => t.isActive));
    } catch (error) {
      console.error('Error loading sign types:', error);
      Alert.alert('Error', 'Failed to load sign types');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (signType: SignType) => {
    setSelectedType(signType);
  };

  const handleContinue = async () => {
    if (!selectedType) {
      Alert.alert('Please Select', 'Please select a sign type to continue');
      return;
    }

    if (!business) {
      Alert.alert('Error', 'Business information is missing');
      navigation.navigate('Map');
      return;
    }

    if (!reviewUrl) {
      Alert.alert('Error', 'Review URL is missing');
      return;
    }

    await writeNFC();
  };

  const writeNFC = async () => {
    if (!selectedType || !business || !reviewUrl) {
      const missing = [];
      if (!selectedType) missing.push('sign type');
      if (!business) missing.push('business');
      if (!reviewUrl) missing.push('review URL');
      
      console.error('Missing information for NFC write:', missing.join(', '));
      console.error('selectedType:', selectedType);
      console.error('business:', business);
      console.error('reviewUrl:', reviewUrl);
      
      Alert.alert('Error', `Missing required information: ${missing.join(', ')}`);
      return;
    }

    try {
      setWriting(true);

      // Check if NFC is supported
      const supported = await NfcManager.isSupported();
      if (!supported) {
        Alert.alert('NFC Not Supported', 'This device does not support NFC');
        return;
      }

      // Check if NFC is enabled
      const enabled = await NfcManager.isEnabled();
      if (!enabled) {
        Alert.alert(
          'NFC Disabled',
          'Please enable NFC in your device settings',
          [{ text: 'OK' }]
        );
        return;
      }

      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: `Hold your phone near the ${selectedType.name} NFC tag`,
      });

      // Write URL to tag
      const bytes = Ndef.encodeMessage([Ndef.uriRecord(reviewUrl)]);
      
      if (bytes) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);

        // Log tag write to backend
        if (business) {
          await nfcLoggingService.logTagWrite({
            businessName: business.name,
            businessAddress: business.address,
            placeId: business.placeId,
            reviewUrl: reviewUrl,
            latitude: business.location?.lat,
            longitude: business.location?.lng,
            writtenBy: 'Mobile App',
          });
        }

        // Create transaction record
        try {
          const transaction = await transactionService.create({
            signTypeId: selectedType.id,
            businessName: business.name,
            businessAddress: business.address,
            placeId: business.placeId,
            reviewUrl: reviewUrl,
            status: 'pending',
            locationLat: business.location.lat,
            locationLng: business.location.lng,
            notes: `${reviewPlatform} - ${linkDescription}`
          });

          setCurrentTransaction(transaction);
          console.log('✅ Transaction recorded:', transaction.id);

          // Show success with sale recording option
          Alert.alert(
            'Success!',
            `NFC tag programmed successfully with ${linkDescription}`,
            [
              {
                text: 'Record Sale',
                onPress: () => setShowSalePriceModal(true)
              },
              {
                text: 'Done',
                style: 'cancel'
              }
            ]
          );
        } catch (error) {
          console.error('Transaction creation failed:', error);
          // Show success anyway - tag was written
          Alert.alert(
            'Success!',
            `NFC tag programmed successfully with ${linkDescription}\n\n(Transaction logging unavailable)`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error: any) {
      console.error('NFC write error:', error);
      
      if (error.toString().includes('cancelled') || error.toString().includes('Cancel')) {
        Alert.alert('Cancelled', 'NFC write was cancelled');
      } else {
        const errorMsg = error.message || error.toString() || 'Unknown error';
        Alert.alert(
          'Write Failed',
          `Failed to write to NFC tag: ${errorMsg}`
        );
      }
    } finally {
      setWriting(false);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  const handleConfirmSale = async (salePrice: number) => {
    if (!currentTransaction || !selectedType) return;

    try {
      await transactionService.update(currentTransaction.id, {
        status: 'success',
        salePrice
      });

      setShowSalePriceModal(false);
      setCurrentTransaction(null);

      Alert.alert(
        'Sale Recorded',
        `£${salePrice.toFixed(2)} sale recorded successfully!`,
        [
          {
            text: 'Program Another',
            onPress: () => setSelectedType(null)
          },
          {
            text: 'Done',
            onPress: () => navigation.navigate('Map')
          }
        ]
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to record sale');
    }
  };

  const handleMarkFailed = async () => {
    if (!currentTransaction) return;

    try {
      await transactionService.update(currentTransaction.id, {
        status: 'failed'
      });

      setShowSalePriceModal(false);
      setCurrentTransaction(null);

      Alert.alert(
        'Sale Marked as Failed',
        'The transaction has been marked as failed',
        [
          {
            text: 'Try Again',
            onPress: () => setSelectedType(null)
          },
          {
            text: 'Done',
            onPress: () => navigation.navigate('Map')
          }
        ]
      );
    } catch (error) {
      console.error('Error marking transaction as failed:', error);
      Alert.alert('Error', 'Failed to update transaction');
    }
  };

  const renderSignType = ({ item }: { item: SignType }) => {
    const isSelected = selectedType?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.signTypeCard, isSelected && styles.selectedCard]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.cardContent}>
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.signImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.cardTextContainer}>
            <View style={styles.cardHeader}>
              <Text style={[styles.signTypeName, isSelected && styles.selectedText]}>
                {item.name}
              </Text>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Default Price:</Text>
              <Text style={[styles.price, isSelected && styles.selectedText]}>
                £{item.defaultPrice.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading sign types...</Text>
      </View>
    );
  }

  // Show error if any
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.subtitle}>{error}</Text>
        </View>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Text style={styles.continueButtonText}>Back to Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if business data is missing
  if (!business) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.subtitle}>Business information is missing. Please select a business from the map.</Text>
        </View>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Text style={styles.continueButtonText}>Back to Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Sign Type</Text>
        <Text style={styles.subtitle}>
          Choose the sign type for {business?.name || 'this business'}
        </Text>
        <View style={styles.platformInfo}>
          <Text style={styles.platformLabel}>Programming for:</Text>
          <Text style={styles.platformValue}>{linkDescription}</Text>
        </View>
      </View>

      <FlatList
        data={signTypes}
        renderItem={renderSignType}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sign types available</Text>
            <Text style={styles.emptySubtext}>Contact your administrator</Text>
          </View>
        }
      />

      {selectedType && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, writing && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={writing}
          >
            <Text style={styles.continueButtonText}>
              {writing ? 'Hold near NFC tag...' : `Write NFC Tag - ${selectedType.name}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedType && currentTransaction && (
        <SalePriceInputModal
          visible={showSalePriceModal}
          signType={selectedType}
          businessName={business?.name || 'Unknown'}
          onConfirm={handleConfirmSale}
          onMarkFailed={handleMarkFailed}
          onCancel={() => {
            setShowSalePriceModal(false);
            setCurrentTransaction(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
  },
  platformLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
  },
  platformValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  listContent: {
    padding: 16,
  },
  signTypeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  cardContent: {
    flexDirection: 'row',
  },
  signImage: {
    width: 80,
    height: 80,
    backgroundColor: '#f3f4f6',
  },
  cardTextContainer: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  signTypeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedText: {
    color: '#4f46e5',
  },
  checkmark: {
    fontSize: 24,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  priceLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

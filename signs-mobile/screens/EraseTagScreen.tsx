import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { transactionService } from '../services/transactionService';

export default function EraseTagScreen({ route, navigation }: any) {
  const { business } = route.params;
  const [erasing, setErasing] = useState(false);

  const eraseNFC = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'NFC is not supported on web');
      return;
    }

    Alert.alert(
      'Erase NFC Tag',
      'This will erase the NFC tag and update your inventory. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase',
          style: 'destructive',
          onPress: async () => {
            try {
              const supported = await NfcManager.isSupported();
              if (!supported) {
                Alert.alert('NFC Not Supported', 'Your device does not support NFC');
                return;
              }

              const enabled = await NfcManager.isEnabled();
              if (!enabled) {
                Alert.alert(
                  'NFC Disabled',
                  'Please enable NFC in your device settings',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => NfcManager.goToNfcSetting() }
                  ]
                );
                return;
              }

              setErasing(true);
              await NfcManager.start();

              Alert.alert(
                'Ready to Erase',
                'Hold your phone near the NFC tag to erase it',
                [
                  {
                    text: 'Cancel',
                    onPress: async () => {
                      await NfcManager.cancelTechnologyRequest();
                      setErasing(false);
                    },
                    style: 'cancel'
                  },
                  {
                    text: 'Continue',
                    onPress: async () => {
                      try {
                        await NfcManager.requestTechnology(NfcTech.Ndef);

                        // Write empty NDEF message to erase
                        const emptyBytes = Ndef.encodeMessage([]);
                        if (emptyBytes) {
                          await NfcManager.ndefHandler.writeNdefMessage(emptyBytes);

                          // Find and update transaction
                          await markTransactionAsErased();

                          await NfcManager.cancelTechnologyRequest();
                          setErasing(false);

                          Alert.alert(
                            'Tag Erased ✅',
                            'NFC tag has been erased and inventory updated.',
                            [
                              {
                                text: 'OK',
                                onPress: () => navigation.goBack()
                              }
                            ]
                          );
                        } else {
                          throw new Error('Failed to create empty NDEF message');
                        }
                      } catch (ex) {
                        console.error('NFC erase error:', ex);
                        Alert.alert('Erase Failed', 'Failed to erase NFC tag. Please try again.');
                        await NfcManager.cancelTechnologyRequest();
                        setErasing(false);
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('NFC error:', error);
              Alert.alert('Error', 'Failed to initialize NFC');
              setErasing(false);
            }
          }
        }
      ]
    );
  };

  const markTransactionAsErased = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      // Find the transaction by placeId and mark as erased
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api'}/transactions/erase`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            placeId: business?.placeId
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to mark transaction as erased:', data.error);
      }
    } catch (error) {
      console.error('Failed to mark transaction as erased:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🗑️</Text>
        <Text style={styles.title}>Erase NFC Tag</Text>
        <Text style={styles.description}>
          Erasing an NFC tag will:
        </Text>

        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.infoText}>Clear the NFC tag data</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.infoText}>Update your inventory count</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.infoText}>Mark the transaction as erased</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.infoText}>Keep the tag available for reuse</Text>
          </View>
        </View>

        {business && (
          <View style={styles.businessCard}>
            <Text style={styles.businessLabel}>Last Business:</Text>
            <Text style={styles.businessName}>{business.name}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.eraseButton, erasing && styles.buttonDisabled]}
          onPress={eraseNFC}
          disabled={erasing}
        >
          {erasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.eraseButtonText}>Erase NFC Tag</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={erasing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 20,
    color: '#4f46e5',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  businessCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  businessLabel: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#78350f',
  },
  eraseButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  eraseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});

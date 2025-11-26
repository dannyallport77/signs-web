import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { nfcLoggingService } from '../services/nfcLoggingService';
import { Business } from '../types';

interface WiFiNFCWriteScreenProps {
  navigation: any;
  route: any;
}

export default function WiFiNFCWriteScreen({ navigation, route }: WiFiNFCWriteScreenProps) {
  const [writing, setWriting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to write');
  const [lastWrittenWiFi, setLastWrittenWiFi] = useState<string | null>(null);

  let business: Business | undefined;
  let ssid = '';
  let password = '';
  let security = 'WPA';
  let isMultiPlatformUrl = false;
  let urlToWrite = '';
  let description = '';

  try {
    const params = route?.params || {};
    business = params.business;
    ssid = params.ssid || '';
    password = params.password || '';
    security = params.security || 'WPA';
    isMultiPlatformUrl = params.isMultiPlatformUrl || false;
    urlToWrite = params.url || '';
    description = params.description || 'Tag';
  } catch (e) {
    console.error('Error accessing route params:', e);
  }

  useEffect(() => {
    initNFC();
    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const initNFC = async () => {
    try {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
      } else {
        Alert.alert('NFC Not Supported', 'Your device does not support NFC');
      }
    } catch (error) {
      console.error('Error initializing NFC:', error);
    }
  };

  const encodeWiFiRecord = (ssid: string, password: string, security: string) => {
    try {
      // Use WIFI URI format for better compatibility across all devices
      // Format: WIFI:T:<security>;S:<ssid>;P:<password>;;
      const securityCode = security === 'Open' ? 'nopass' : security.toUpperCase();
      const wifiUri = `WIFI:T:${securityCode};S:${ssid};P:${password};;`;
      
      return Ndef.encodeMessage([Ndef.uriRecord(wifiUri)]);
    } catch (error) {
      console.error('Error creating WiFi record:', error);
      return null;
    }
  };

  const handleWriteTag = async () => {
    if (isMultiPlatformUrl) {
      // Writing multi-platform URL tag
      if (!business || !urlToWrite) {
        Alert.alert('Error', 'Missing URL to write');
        return;
      }

      try {
        setWriting(true);
        setStatusMessage('Requesting NFC technology access...');

        const supported = await NfcManager.isSupported();
        if (!supported) {
          Alert.alert('NFC Not Supported', 'This device does not support NFC');
          setStatusMessage('NFC not supported');
          return;
        }

        const enabled = await NfcManager.isEnabled();
        if (!enabled) {
          Alert.alert(
            'NFC Disabled',
            'Please enable NFC in your device settings',
            [{ text: 'OK' }]
          );
          setStatusMessage('NFC disabled');
          return;
        }

        await NfcManager.requestTechnology(NfcTech.Ndef, {
          alertMessage: `Hold your phone near the NFC tag to write: ${description}`,
        });

        setStatusMessage('Hold tag near phone...');

        // Encode URL to NFC record
        const bytes = Ndef.encodeMessage([Ndef.uriRecord(urlToWrite)]);

        if (!bytes) {
          Alert.alert('Error', 'Failed to encode URL');
          setStatusMessage('Encoding failed');
          return;
        }

        // Write to tag
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        
        // Log tag write to backend
        if (business) {
          await nfcLoggingService.logTagWrite({
            businessName: business.name,
            businessAddress: business.address,
            placeId: business.placeId,
            reviewUrl: `wifi://${wifiSsid}`,
            latitude: business.latitude,
            longitude: business.longitude,
            writtenBy: 'Mobile App - WiFi Credential',
          });
        }
        
        setStatusMessage('✅ Multi-platform tag written successfully!');

        Alert.alert(
          'Success!',
          `NFC tag programmed with:\n\n${description}`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      } catch (error: any) {
        console.error('NFC write error:', error);

        if (error.toString().includes('cancelled') || error.toString().includes('Cancel')) {
          Alert.alert('Cancelled', 'NFC write was cancelled');
          setStatusMessage('Cancelled');
        } else {
          Alert.alert(
            'Write Failed',
            'Could not write to tag. Make sure NFC is enabled and try again.'
          );
          setStatusMessage('Write failed');
        }
      } finally {
        setWriting(false);
        await NfcManager.cancelTechnologyRequest().catch(() => {});
      }
    } else {
      // Original WiFi writing logic
      if (!business || !ssid || !password) {
        Alert.alert('Error', 'Missing WiFi credentials');
        return;
      }

      try {
        setWriting(true);
        setStatusMessage('Requesting NFC technology access...');

        const supported = await NfcManager.isSupported();
        if (!supported) {
          Alert.alert('NFC Not Supported', 'This device does not support NFC');
          setStatusMessage('NFC not supported');
          return;
        }

        const enabled = await NfcManager.isEnabled();
        if (!enabled) {
          Alert.alert(
            'NFC Disabled',
            'Please enable NFC in your device settings',
            [{ text: 'OK' }]
          );
          setStatusMessage('NFC disabled');
          return;
        }

        await NfcManager.requestTechnology(NfcTech.Ndef, {
          alertMessage: `Hold your phone near the NFC tag to program WiFi: ${ssid}`,
        });

        setStatusMessage('Hold tag near phone...');

        // Encode WiFi credentials to NFC record
        const bytes = encodeWiFiRecord(ssid, password, security);

        if (!bytes) {
          Alert.alert('Error', 'Failed to encode WiFi credentials');
          setStatusMessage('Encoding failed');
          return;
        }

        // Write to tag
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        setStatusMessage('✅ WiFi tag written successfully!');
        setLastWrittenWiFi(ssid);

        Alert.alert(
          'Success!',
          `NFC tag programmed with WiFi:\n\nNetwork: ${ssid}\nSecurity: ${security}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset and go back
                navigation.goBack();
              }
            }
          ]
        );
      } catch (error: any) {
        console.error('NFC write error:', error);

        if (error.toString().includes('cancelled') || error.toString().includes('Cancel')) {
          Alert.alert('Cancelled', 'NFC write was cancelled');
          setStatusMessage('Cancelled');
        } else {
          Alert.alert(
            'Write Failed',
            `Failed to write WiFi to NFC tag: ${error.message || error.toString()}`
          );
          setStatusMessage('Write failed');
        }
      } finally {
        setWriting(false);
        NfcManager.cancelTechnologyRequest().catch(() => {});
      }
    }
  };

  const handleTestTag = async () => {
    if (!lastWrittenWiFi) {
      Alert.alert('Test Required', 'Write a tag first before testing');
      return;
    }

    try {
      setWriting(true);
      setStatusMessage('Hold tag near phone to read...');

      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Hold the programmed WiFi tag near your phone to verify',
      });

      const tag = await NfcManager.getTag();

      if (!tag || !tag.ndefMessage || tag.ndefMessage.length === 0) {
        Alert.alert(
          'Test Failed',
          'No data found on tag. The tag may be blank or unreadable.',
          [{ text: 'OK' }]
        );
        setStatusMessage('⚠️ Test failed - no data found');
      } else {
        Alert.alert(
          'Test Passed',
          `Tag contains ${tag.ndefMessage.length} record(s)`,
          [{ text: 'OK' }]
        );
        setStatusMessage('✅ Test passed - data found on tag');
      }
    } catch (error: any) {
      Alert.alert('Test Error', error.message || 'Failed to read tag');
      setStatusMessage('Test error');
    } finally {
      setWriting(false);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isMultiPlatformUrl ? '📱 Write Multi-Platform Link' : '📱 Write WiFi to NFC Tag'}
        </Text>
        {business && (
          <Text style={styles.subtitle}>{business.name}</Text>
        )}
      </View>

      {isMultiPlatformUrl ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tag Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{description}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>URL:</Text>
            <Text style={[styles.infoValue, { fontSize: 11 }]} numberOfLines={2}>
              {urlToWrite}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Network Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Network Name:</Text>
            <Text style={styles.infoValue}>{ssid}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Security Type:</Text>
            <Text style={styles.infoValue}>{security}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Password:</Text>
            <Text style={styles.infoValue}>{'•'.repeat(Math.min(password.length, 12))}</Text>
          </View>
        </View>
      )}

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={styles.statusMessage}>{statusMessage}</Text>
      </View>

      <View style={styles.instructionCard}>
        <Text style={styles.instructionTitle}>📖 Instructions</Text>
        <Text style={styles.instructionText}>
          1. Tap "Write to Tag" below{'\n'}
          2. Hold your phone near an NFC tag{'\n'}
          3. Wait for the write to complete{'\n'}
          4. Customers can then scan the tag with their phone to connect to WiFi
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.writeButton, writing && styles.buttonDisabled]}
          onPress={handleWriteTag}
          disabled={writing}
        >
          {writing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.writeButtonText}>📝 Write to Tag</Text>
          )}
        </TouchableOpacity>

        {lastWrittenWiFi && (
          <TouchableOpacity
            style={[styles.testButton, writing && styles.buttonDisabled]}
            onPress={handleTestTag}
            disabled={writing}
          >
            {writing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.testButtonText}>✓ Test Tag</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={writing}
        >
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
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#e0e7ff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: '#4338ca',
    fontWeight: '500',
  },
  instructionCard: {
    backgroundColor: '#f0fdf4',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#065f46',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  writeButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  writeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

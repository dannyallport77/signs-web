import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { stockService } from '../services/stockService';
import { nfcLoggingService } from '../services/nfcLoggingService';
import { Product, ProductVariant, Business } from '../types';

interface NFCActionScreenProps {
  navigation: any;
  route: any;
}

export default function NFCActionScreen({ navigation, route }: NFCActionScreenProps) {
  const {
    business,
    reviewUrl,
    platformLabel,
    linkDescription,
    product,
    variant,
  } = route?.params || {};

  const [writing, setWriting] = useState(false);
  const [stockLevel, setStockLevel] = useState<number>(0);
  const [lastWrittenUrl, setLastWrittenUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Awaiting action');

  useEffect(() => {
    loadStock();
    initNfc();
  }, []);

  const loadStock = async () => {
    if (!product) return;
    const levels = await stockService.getStockLevels();
    setStockLevel(levels[product.id] ?? 20);
  };

  const initNfc = async () => {
    try {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
      }
    } catch (error) {
      console.error('NFC init failed', error);
    }
  };

  const handleProgram = async () => {
    if (!reviewUrl || !product || !variant) {
      Alert.alert('Missing data', 'Ensure the platform and product are selected');
      return;
    }

    try {
      setWriting(true);
      setStatusMessage('Hold near NFC tag to program...');
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: `Hold near the ${product.name} tag to program ${linkDescription}`,
      });

      const message = Ndef.encodeMessage([Ndef.uriRecord(reviewUrl)]);
      if (!message) {
        throw new Error('Unable to encode NFC message');
      }

      await NfcManager.ndefHandler.writeNdefMessage(message);
      setLastWrittenUrl(reviewUrl);
      setStatusMessage('Tag programmed successfully');
      const newLevel = await stockService.adjust(product.id, -1);
      setStockLevel(newLevel);

      // Log the tag write to backend for audit trail
      if (business) {
        await nfcLoggingService.logTagWrite({
          businessName: business.name,
          businessAddress: business.address,
          placeId: business.place_id,
          reviewUrl: reviewUrl,
          latitude: business.latitude,
          longitude: business.longitude,
          writtenBy: 'Mobile App',
        });
      }
    } catch (error: any) {
      Alert.alert('Program failed', error.message || 'Unable to write the tag');
      setStatusMessage('Programming failed');
    } finally {
      setWriting(false);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  const handleTest = async () => {
    if (!lastWrittenUrl) {
      Alert.alert('Test Required', 'Program a tag first before testing');
      return;
    }

    try {
      setWriting(true);
      setStatusMessage('Hold tag near phone to read...');
      
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Hold the programmed tag near your phone to verify',
      });

      const tag = await NfcManager.getTag();
      
      if (!tag || !tag.ndefMessage || tag.ndefMessage.length === 0) {
        Alert.alert(
          'Test Failed',
          'No data found on tag. The tag may be blank or unreadable.',
          [{ text: 'OK' }]
        );
        setStatusMessage('Test failed - no data found');
        return;
      }

      const record = tag.ndefMessage[0];
      const uri = Ndef.uri.decodePayload(record.payload);
      
      const match = uri === lastWrittenUrl;
      const matchExpected = uri === reviewUrl;

      if (match && matchExpected) {
        Alert.alert(
          '✅ Test Passed',
          `Tag verified successfully!\n\nExpected: ${reviewUrl}\n\nFound: ${uri}\n\n✓ Data matches perfectly`,
          [{ text: 'OK' }]
        );
        setStatusMessage('✅ Test passed - data verified');
      } else if (uri) {
        Alert.alert(
          '⚠️ Data Mismatch',
          `Tag contains different data:\n\nExpected: ${reviewUrl}\n\nFound: ${uri}\n\n${match ? '✓ Matches last write' : '✗ Does not match last write'}`,
          [{ text: 'OK' }]
        );
        setStatusMessage('⚠️ Test failed - data mismatch');
      } else {
        Alert.alert(
          '❌ Test Failed',
          'Unable to read tag data',
          [{ text: 'OK' }]
        );
        setStatusMessage('❌ Test failed - read error');
      }
    } catch (error: any) {
      Alert.alert('Test Error', error.message || 'Failed to read tag');
      setStatusMessage('Test error');
    } finally {
      setWriting(false);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  const handleErase = async () => {
    try {
      setWriting(true);
      setStatusMessage('Hold near tag to erase...');
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Hold near the tag to erase its contents',
      });

      await NfcManager.ndefHandler.writeNdefMessage(Ndef.encodeMessage([]));
      setLastWrittenUrl(null);
      setStatusMessage('Tag erased');
      if (product) {
        const newLevel = await stockService.adjust(product.id, 1);
        setStockLevel(newLevel);
      }
    } catch (error: any) {
      Alert.alert('Erase failed', error.message || 'Unable to erase the tag');
      setStatusMessage('Erase failed');
    } finally {
      setWriting(false);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  if (!business || !product || !variant) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Required data is missing.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.arrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Program Sign</Text>
          <Text style={styles.subtitle}>{platformLabel} • {variant.label}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('SaleCreation', { business, product, variant, reviewUrl, linkDescription })}>
          <Text style={styles.next}>Next ➜</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Current stock</Text>
        <Text style={styles.infoValue}>{stockLevel}</Text>
        <Text style={styles.infoCaption}>Program decreases, erase returns stock</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>{statusMessage}</Text>
      </View>

      <View style={styles.buttonGrid}>
        <TouchableOpacity style={[styles.actionButton, styles.primary]} onPress={handleProgram} disabled={writing}>
          {writing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionText}>Program Sign</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondary]} onPress={handleTest}>
          <Text style={styles.actionText}>Test Sign</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.tertiary]} onPress={handleErase}>
          <Text style={styles.actionText}>Erase Sign</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.createSaleButton}
        onPress={() => navigation.navigate('SaleCreation', { business, product, variant, reviewUrl, linkDescription })}
      >
        <Text style={styles.createSaleText}>Create Sale</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  arrow: {
    fontSize: 20,
    color: '#4f46e5',
  },
  next: {
    fontSize: 16,
    color: '#4f46e5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10b981',
  },
  infoCaption: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusCard: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
  },
  statusLabel: {
    color: '#1f2937',
    fontWeight: '600',
  },
  buttonGrid: {
    margin: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primary: {
    backgroundColor: '#10b981',
  },
  secondary: {
    backgroundColor: '#4f46e5',
  },
  tertiary: {
    backgroundColor: '#d97706',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },
  createSaleButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1d4ed8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createSaleText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 40,
    color: '#dc2626',
  },
});

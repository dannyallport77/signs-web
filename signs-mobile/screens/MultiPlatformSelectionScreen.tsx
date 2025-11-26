import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nfcLoggingService } from '../services/nfcLoggingService';
import { Business, SocialMediaLinks } from '../types';
import PLATFORM_ICONS from '../assets/platform-icons';

interface Platform {
  key: string;
  label: string;
  emoji: string;
  url?: string;
  available: boolean;
  color: string;
  shape: 'circle' | 'square' | 'roundedSquare';
}

interface MultiPlatformSelectionScreenProps {
  navigation: any;
  route: any;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

export default function MultiPlatformSelectionScreen({ 
  navigation, 
  route 
}: MultiPlatformSelectionScreenProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [writing, setWriting] = useState(false);

  const business: Business = route?.params?.business;
  const socialMedia: SocialMediaLinks = route?.params?.socialMedia || {};

  if (!business) {
    Alert.alert('Error', 'No business selected');
    navigation.goBack();
    return null;
  }

  // Define available platforms with colors and shapes
  const platforms: Platform[] = [
    {
      key: 'google',
      label: 'Google',
      emoji: '⭐',
      url: business.reviewUrl,
      available: true,
      color: '#4285F4',
      shape: 'circle',
    },
    {
      key: 'facebook',
      label: 'Facebook',
      emoji: '📘',
      url: socialMedia.facebook?.reviewUrl || socialMedia.facebook?.profileUrl,
      available: !!(socialMedia.facebook?.reviewUrl || socialMedia.facebook?.profileUrl),
      color: '#1877F2',
      shape: 'roundedSquare',
    },
    {
      key: 'tripadvisor',
      label: 'TripAdvisor',
      emoji: '🦉',
      url: socialMedia.tripadvisor?.reviewUrl,
      available: !!socialMedia.tripadvisor?.reviewUrl,
      color: '#00AA6C',
      shape: 'circle',
    },
    {
      key: 'trustpilot',
      label: 'Trustpilot',
      emoji: '🛡️',
      url: socialMedia.trustpilot?.reviewUrl,
      available: !!socialMedia.trustpilot?.reviewUrl,
      color: '#00B67A',
      shape: 'square',
    },
    {
      key: 'yell',
      label: 'Yell',
      emoji: '📢',
      url: socialMedia.yell?.profileUrl,
      available: !!socialMedia.yell?.profileUrl,
      color: '#FDB913',
      shape: 'roundedSquare',
    },
    {
      key: 'ratedpeople',
      label: 'Rated People',
      emoji: '👥',
      url: socialMedia.ratedpeople?.profileUrl,
      available: !!socialMedia.ratedpeople?.profileUrl,
      color: '#E74C3C',
      shape: 'circle',
    },
    {
      key: 'trustatrader',
      label: 'TrustATrader',
      emoji: '🛠️',
      url: socialMedia.trustatrader?.profileUrl,
      available: !!socialMedia.trustatrader?.profileUrl,
      color: '#2ECC71',
      shape: 'square',
    },
    {
      key: 'checkatrade',
      label: 'Checkatrade',
      emoji: '✅',
      url: socialMedia.checkatrade?.profileUrl,
      available: !!socialMedia.checkatrade?.profileUrl,
      color: '#FF6B35',
      shape: 'roundedSquare',
    },
  ].filter(p => p.available);

  const togglePlatform = (key: string) => {
    const newSelected = new Set(selectedPlatforms);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedPlatforms(newSelected);
  };

  const handleCreateAndWrite = async () => {
    if (selectedPlatforms.size === 0) {
      Alert.alert('No Platforms Selected', 'Please select at least one platform');
      return;
    }

    setCreating(true);

    try {
      // Prepare platform data
      const selectedPlatformData = platforms
        .filter(p => selectedPlatforms.has(p.key))
        .map(p => ({
          key: p.key,
          label: p.label,
          url: p.url,
          emoji: p.emoji,
          color: p.color,
          shape: p.shape,
        }));

      // Create multi-platform tag on server
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/multi-platform/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessName: business.name,
          businessPlaceId: business.placeId,
          platforms: selectedPlatformData,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create multi-platform tag');
      }

      const reviewUrl = data.reviewUrl;

      // Show confirmation with option to write
      Alert.alert(
        'Multi-Platform Tag Created',
        `Review URL: ${reviewUrl}\n\nSelected platforms: ${data.platforms}\n\nReady to write to NFC tag?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Write to Tag', onPress: () => writeToNfc(reviewUrl) },
        ]
      );

    } catch (error: any) {
      console.error('Creation error:', error);
      Alert.alert('Error', error.message || 'Failed to create multi-platform tag');
    } finally {
      setCreating(false);
    }
  };

  const writeToNfc = async (url: string) => {
    setWriting(true);

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);

      if (!bytes) {
        throw new Error('Failed to encode NFC message');
      }

      await NfcManager.ndefHandler.writeNdefMessage(bytes);

      // Log tag write to backend
      if (businessData) {
        await nfcLoggingService.logTagWrite({
          businessName: businessData.name,
          businessAddress: businessData.address,
          placeId: businessData.placeId,
          reviewUrl: url,
          latitude: businessData.latitude,
          longitude: businessData.longitude,
          writtenBy: 'Mobile App',
        });
      }

      Alert.alert(
        'Success!',
        `Multi-platform review tag written successfully!\n\nURL: ${url}`,
        [{ text: 'Done', onPress: () => navigation.navigate('Map') }]
      );

    } catch (error: any) {
      console.error('NFC write error:', error);
      if (error.message?.includes('cancelled')) {
        Alert.alert('Cancelled', 'NFC write was cancelled');
      } else {
        Alert.alert('NFC Error', 'Failed to write to NFC tag. Please try again.');
      }
    } finally {
      NfcManager.cancelTechnologyRequest();
      setWriting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Multi-Platform Review Tag</Text>
          <Text style={styles.businessName}>{business.name}</Text>
          <Text style={styles.description}>
            Select multiple platforms. Customers will choose their preferred one when they scan.
          </Text>
        </View>

        <View style={styles.platformsContainer}>
          <Text style={styles.sectionTitle}>
            Available Platforms ({platforms.length})
          </Text>
          <Text style={styles.sectionSubtitle}>
            Selected: {selectedPlatforms.size}
          </Text>

          <View style={styles.platformGrid}>
            {platforms.map((platform) => {
              const isSelected = selectedPlatforms.has(platform.key);
              
              return (
                <TouchableOpacity
                  key={platform.key}
                  style={[
                    styles.platformCard,
                    isSelected && styles.platformCardSelected,
                    { borderColor: platform.color },
                    isSelected && { backgroundColor: `${platform.color}15` },
                  ]}
                  onPress={() => togglePlatform(platform.key)}
                >
                  <View style={[
                    styles.platformIcon,
                    platform.shape === 'circle' && styles.platformIconCircle,
                    platform.shape === 'roundedSquare' && styles.platformIconRounded,
                    { backgroundColor: platform.color },
                  ]}>
                    {PLATFORM_ICONS[platform.key] ? (
                      <Image 
                        source={PLATFORM_ICONS[platform.key]} 
                        style={styles.platformImage} 
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.platformEmoji}>{platform.emoji}</Text>
                    )}
                  </View>
                  <Text style={styles.platformLabel}>{platform.label}</Text>
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: platform.color }]}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Customer Preview</Text>
          <Text style={styles.previewDescription}>
            Customers will see these platforms as scattered, colorful buttons
          </Text>
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Leave a Review</Text>
            <Text style={styles.previewBusiness}>{business.name}</Text>
            <View style={styles.previewPlatforms}>
              {platforms
                .filter(p => selectedPlatforms.has(p.key))
                .slice(0, 4)
                .map((p, i) => (
                  <View
                    key={p.key}
                    style={[
                      styles.previewPlatform,
                      { backgroundColor: p.color },
                      i === 0 && { marginLeft: 20 },
                      i === 1 && { marginTop: 30 },
                      i === 2 && { marginRight: 20 },
                    ]}
                  >
                    {PLATFORM_ICONS[p.key] ? (
                      <Image 
                        source={PLATFORM_ICONS[p.key]} 
                        style={styles.previewImage} 
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.previewEmoji}>{p.emoji}</Text>
                    )}
                  </View>
                ))
              }
              {selectedPlatforms.size > 4 && (
                <Text style={styles.previewMore}>+{selectedPlatforms.size - 4} more</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.createButton,
            (creating || writing || selectedPlatforms.size === 0) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateAndWrite}
          disabled={creating || writing || selectedPlatforms.size === 0}
        >
          {creating || writing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>
              Create & Write ({selectedPlatforms.size})
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  platformsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  platformCardSelected: {
    borderWidth: 3,
  },
  platformIcon: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformIconCircle: {
    borderRadius: 30,
  },
  platformIconRounded: {
    borderRadius: 16,
  },
  platformEmoji: {
    fontSize: 32,
  },
  platformImage: {
    width: 40,
    height: 40,
  },
  platformLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  previewSection: {
    padding: 20,
    paddingTop: 0,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  previewBox: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minHeight: 200,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  previewBusiness: {
    fontSize: 16,
    color: '#e0e7ff',
    marginBottom: 20,
  },
  previewPlatforms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  previewPlatform: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: 24,
  },
  previewImage: {
    width: 30,
    height: 30,
  },
  previewMore: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  createButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

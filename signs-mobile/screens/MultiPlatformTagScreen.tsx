import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Picker
} from 'react-native';
import { Business, SocialMediaLinks } from '../types';
import { socialMediaService } from '../services/socialMediaService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

interface PlatformOption {
  key: string;
  label: string;
  emoji: string;
  url?: string;
  available: boolean;
}

interface MultiPlatformTagScreenProps {
  navigation: any;
  route: any;
}

export default function MultiPlatformTagScreen({ navigation, route }: MultiPlatformTagScreenProps) {
  const [socialMedia, setSocialMedia] = useState<SocialMediaLinks>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  let business: Business | undefined;
  try {
    const params = route?.params || {};
    business = params.business;
  } catch (e) {
    console.error('Error accessing route params:', e);
  }

  useEffect(() => {
    if (business) {
      loadSocialMedia();
    }
  }, [business]);

  const loadSocialMedia = async () => {
    if (!business) return;
    
    setLoading(true);
    try {
      const links = await socialMediaService.getSocialMediaLinks(
        business.name,
        business.address,
        business.placeId,
        false
      );
      setSocialMedia(links);
    } catch (error) {
      console.error('Error loading social media:', error);
    } finally {
      setLoading(false);
    }
  };

  const platforms: PlatformOption[] = [
    {
      key: 'google',
      label: 'Google Review',
      emoji: '⭐',
      url: business?.reviewUrl,
      available: true
    },
    {
      key: 'facebook',
      label: 'Facebook',
      emoji: '📘',
      url: socialMedia.facebook?.reviewUrl || socialMedia.facebook?.profileUrl,
      available: !!socialMedia.facebook
    },
    {
      key: 'instagram',
      label: 'Instagram',
      emoji: '📸',
      url: socialMedia.instagram?.profileUrl,
      available: !!socialMedia.instagram
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      emoji: '🎵',
      url: socialMedia.tiktok?.profileUrl,
      available: !!socialMedia.tiktok
    },
    {
      key: 'twitter',
      label: 'Twitter/X',
      emoji: '🐦',
      url: socialMedia.twitter?.profileUrl,
      available: !!socialMedia.twitter
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      emoji: '💼',
      url: socialMedia.linkedin?.profileUrl,
      available: !!socialMedia.linkedin
    },
    {
      key: 'tripadvisor',
      label: 'TripAdvisor',
      emoji: '🦉',
      url: socialMedia.tripadvisor?.reviewUrl,
      available: !!socialMedia.tripadvisor
    },
    {
      key: 'trustpilot',
      label: 'Trustpilot',
      emoji: '🛡️',
      url: socialMedia.trustpilot?.reviewUrl,
      available: !!socialMedia.trustpilot
    },
    {
      key: 'yell',
      label: 'Yell',
      emoji: '📢',
      url: socialMedia.yell?.profileUrl,
      available: !!socialMedia.yell
    },
    {
      key: 'checkatrade',
      label: 'Checkatrade',
      emoji: '✅',
      url: socialMedia.checkatrade?.profileUrl,
      available: !!socialMedia.checkatrade
    },
    {
      key: 'ratedpeople',
      label: 'Rated People',
      emoji: '👥',
      url: socialMedia.ratedpeople?.profileUrl,
      available: !!socialMedia.ratedpeople
    },
    {
      key: 'trustatrader',
      label: 'TrustATrader',
      emoji: '🛠️',
      url: socialMedia.trustatrader?.profileUrl,
      available: !!socialMedia.trustatrader
    },
  ];

  const togglePlatform = (key: string) => {
    if (selectedPlatforms.includes(key)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== key));
    } else {
      setSelectedPlatforms([...selectedPlatforms, key]);
    }
  };

  const handleCreateTag = async () => {
    if (!business) {
      Alert.alert('Error', 'Business information is missing');
      return;
    }

    if (selectedPlatforms.length === 0) {
      Alert.alert('Error', 'Please select at least one platform');
      return;
    }

    try {
      setCreating(true);

      // Build platform URLs array
      const platformsData = selectedPlatforms
        .map(key => {
          const platform = platforms.find(p => p.key === key);
          return {
            platform: platform?.label || key,
            url: platform?.url || ''
          };
        })
        .filter(p => p.url); // Only include platforms with URLs

      if (platformsData.length === 0) {
        Alert.alert('Error', 'Selected platforms do not have URLs available');
        return;
      }

      // Create the tag in database
      const response = await fetch(`${API_URL}/tags/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessName: business.name,
          businessAddress: business.address,
          placeId: business.placeId,
          tagType: 'multiplatform',
          platforms: platformsData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create tag');
      }

      const data = await response.json();
      const tagUrl = data.url;

      // Navigate to WiFiNFCWrite with the URL to write
      navigation.navigate('WiFiNFCWrite', {
        business,
        isMultiPlatformUrl: true,
        url: tagUrl,
        description: 'Multi-Platform Review Tag'
      });
    } catch (error) {
      Alert.alert('Error', `Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Select a business first</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Multi-Platform Review Tag</Text>
        <Text style={styles.headerSubtitle}>
          Select which platforms to include on this tag
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Available Platforms</Text>
        <Text style={styles.sectionSubtitle}>
          Customers can tap the tag to choose which platform to review you on
        </Text>

        <View style={styles.platformsGrid}>
          {platforms.map(platform => (
            <TouchableOpacity
              key={platform.key}
              style={[
                styles.platformOption,
                !platform.available && styles.platformOptionDisabled,
                selectedPlatforms.includes(platform.key) && styles.platformOptionSelected
              ]}
              onPress={() => platform.available && togglePlatform(platform.key)}
              disabled={!platform.available}
            >
              <Text style={styles.platformEmoji}>{platform.emoji}</Text>
              <Text 
                style={[
                  styles.platformLabel,
                  selectedPlatforms.includes(platform.key) && styles.platformLabelSelected
                ]}
              >
                {platform.label}
              </Text>
              {selectedPlatforms.includes(platform.key) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
              {!platform.available && (
                <Text style={styles.unavailableLabel}>Not found</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Selected Platforms:</Text>
          <Text style={styles.summaryValue}>
            {selectedPlatforms.length > 0
              ? selectedPlatforms.map(key => platforms.find(p => p.key === key)?.label).join(', ')
              : 'None selected'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, selectedPlatforms.length === 0 && styles.createButtonDisabled]}
          onPress={handleCreateTag}
          disabled={creating || selectedPlatforms.length === 0}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>📱 Create & Write to Tag</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          This will create a unique URL that customers can scan to choose their preferred review platform.
        </Text>
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  platformsGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  platformOption: {
    width: '31%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  platformOptionSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#4f46e5',
  },
  platformOptionDisabled: {
    opacity: 0.5,
  },
  platformEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  platformLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  platformLabelSelected: {
    color: '#4f46e5',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 18,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  unavailableLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 2,
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 40,
  },
});

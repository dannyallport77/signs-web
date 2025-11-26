import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Business, PlatformSelection, SocialMediaLinks } from '../types';
import { socialMediaService } from '../services/socialMediaService';

type TagMode = 'review' | 'wifi' | 'multiplatform';

const reviewPlatforms: PlatformSelection[] = [
  { key: 'google', label: 'Google Review', description: 'Official Google Business reviews', emoji: '⭐' },
  { key: 'facebook', label: 'Facebook', description: 'Customers on Facebook', emoji: '📘' },
  { key: 'instagram', label: 'Instagram', description: 'Followers and stories', emoji: '📸' },
  { key: 'tripadvisor', label: 'TripAdvisor', description: 'Travel and hospitality', emoji: '🦉' },
  { key: 'trustpilot', label: 'Trustpilot', description: 'Independent reviews', emoji: '🛡️' },
  { key: 'yell', label: 'Yell', description: 'Local UK directory', emoji: '📢' },
  { key: 'ratedpeople', label: 'Rated People', description: 'Tradespeople reviews', emoji: '👥' },
  { key: 'trustatrader', label: 'TrustATrader', description: 'Verified trades', emoji: '🛠️' },
  { key: 'checkatrade', label: 'Checkatrade', description: 'Member reviews', emoji: '✅' },
];

interface BusinessInfoScreenProps {
  navigation: any;
  route: any;
}

export default function BusinessInfoScreen({ navigation, route }: BusinessInfoScreenProps) {
  const [tagMode, setTagMode] = useState<TagMode>('review');
  const [socialMedia, setSocialMedia] = useState<SocialMediaLinks>({});
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformSelection | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const business: Business | undefined = route?.params?.business;
  
  if (!business) {
    setError('No business information provided');
    return;
  }

  useEffect(() => {
    if (business) {
      loadSocialMedia();
    }
  }, [business]);

  const loadSocialMedia = async () => {
    if (!business) return;
    setLoadingSocial(true);
    try {
      const links = await socialMediaService.getSocialMediaLinks(
        business.name,
        business.address,
        business.placeId,
        true  // Enable URL verification to check for dead links
      );
      setSocialMedia(links);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSocial(false);
    }
  };

  const getPlatformUrl = (key: string) => {
    if (!business) return undefined;
    switch (key) {
      case 'facebook':
        return socialMedia.facebook?.reviewUrl || socialMedia.facebook?.profileUrl;
      case 'instagram':
        return socialMedia.instagram?.profileUrl;
      case 'tripadvisor':
        return socialMedia.tripadvisor?.reviewUrl;
      case 'trustpilot':
        return socialMedia.trustpilot?.reviewUrl;
      case 'yell':
        return socialMedia.yell?.profileUrl;
      case 'ratedpeople':
        return socialMedia.ratedpeople?.profileUrl;
      case 'trustatrader':
        return socialMedia.trustatrader?.profileUrl;
      case 'checkatrade':
        return socialMedia.checkatrade?.profileUrl;
      case 'google':
        return business.reviewUrl;
      default:
        return undefined;
    }
  };

  const getPlatformUrls = (key: string): { reviewUrl?: string; profileUrl?: string } => {
    if (!business) return {};
    switch (key) {
      case 'facebook':
        return {
          reviewUrl: socialMedia.facebook?.reviewUrl,
          profileUrl: socialMedia.facebook?.profileUrl
        };
      case 'instagram':
        return {
          profileUrl: socialMedia.instagram?.profileUrl
        };
      case 'tripadvisor':
        return {
          reviewUrl: socialMedia.tripadvisor?.reviewUrl,
          profileUrl: socialMedia.tripadvisor?.profileUrl
        };
      case 'trustpilot':
        return {
          reviewUrl: socialMedia.trustpilot?.reviewUrl,
          profileUrl: socialMedia.trustpilot?.profileUrl
        };
      case 'yell':
        return {
          profileUrl: socialMedia.yell?.profileUrl
        };
      case 'ratedpeople':
        return {
          profileUrl: socialMedia.ratedpeople?.profileUrl
        };
      case 'trustatrader':
        return {
          profileUrl: socialMedia.trustatrader?.profileUrl
        };
      case 'checkatrade':
        return {
          profileUrl: socialMedia.checkatrade?.profileUrl
        };
      case 'google':
        return { reviewUrl: business.reviewUrl };
      default:
        return {};
    }
  };

  const handleContinue = () => {
    if (!business) {
      Alert.alert('Missing business');
      return;
    }
    if (!selectedPlatform) {
      Alert.alert('Select platform', 'Choose a review platform to continue');
      return;
    }

    // Show action modal if platform has both review and profile URLs
    const urls = getPlatformUrls(selectedPlatform.key);
    if (urls.reviewUrl && urls.profileUrl && urls.reviewUrl !== urls.profileUrl) {
      setShowActionModal(true);
    } else {
      // Only one action available, proceed directly
      const finalUrl = urls.reviewUrl || urls.profileUrl;
      if (!finalUrl) {
        Alert.alert('Profile Not Found', 'This platform profile is not available for this business.');
        return;
      }
      proceedWithUrl(finalUrl, 'default');
    }
  };

  const proceedWithUrl = (url: string, actionType: 'review' | 'profile' | 'default') => {
    setShowActionModal(false);
    
    const payload = {
      business,
      platformKey: selectedPlatform?.key,
      platformLabel: selectedPlatform?.label,
      linkDescription: selectedPlatform?.description,
      reviewUrl: url,
      actionType
    };

    // Navigate directly to ProductSelection instead of SignTypeSelection
    navigation.navigate('ProductSelection', payload);
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Select a business on the map first.</Text>
      </View>
    );
  }

  const renderCard = (platform: PlatformSelection) => {
    const isSelected = selectedPlatform?.key === platform.key;
    const platformUrl = getPlatformUrl(platform.key);
    const hasLink = !!platformUrl && platformUrl !== business.reviewUrl;
    
    // Check if this platform was searched
    const platformData = socialMedia[platform.key as keyof SocialMediaLinks];
    const wasSearched = platformData?.searched === true;
    const isVerified = platformData?.verified === true;
    const isDeadLink = platformData?.verified === false; // Explicitly marked as dead
    
    // Don't show platforms that weren't searched (based on business category)
    if (!wasSearched && platform.key !== 'google') {
      return null;
    }
    
    // Don't show platforms with dead links
    if (isDeadLink && platform.key !== 'google') {
      return null;
    }

    const handleCardPress = () => {
      const urls = getPlatformUrls(platform.key);
      
      // If platform has both review and profile URLs, show action modal
      if (urls.reviewUrl && urls.profileUrl && urls.reviewUrl !== urls.profileUrl) {
        setSelectedPlatform(platform);
        setShowActionModal(true);
      } else {
        // Navigate directly to ProductSelection with the platform info
        const finalUrl = urls.reviewUrl || urls.profileUrl;
        if (!finalUrl) {
          Alert.alert('Profile Not Found', 'This platform profile is not available for this business.');
          return;
        }
        navigation.navigate('ProductSelection', {
          business,
          reviewUrl: finalUrl,
          platformLabel: platform.label,
          linkDescription: platform.description,
        });
      }
    };
    
    return (
      <TouchableOpacity
        key={platform.key}
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={handleCardPress}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>{platform.emoji}</Text>
          <Text style={styles.cardTitle}>{platform.label}</Text>
          {hasLink && isVerified && <Text style={styles.verifiedBadge}>✓ Verified</Text>}
          {hasLink && !isVerified && <Text style={styles.foundBadge}>✓ Found</Text>}
          {!hasLink && wasSearched && <Text style={styles.notFoundBadge}>✗ Not Found</Text>}
        </View>
        <Text style={styles.cardDescription}>{platform.description}</Text>
        {platform.key === 'google' && (
          <>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Rating:</Text>
              <Text style={styles.statsValue}>{business.rating?.toFixed(1) ?? 'N/A'}</Text>
            </View>
            <View style={styles.statsList}>
              <Text style={styles.statsValue}>Total reviews: {business.userRatingsTotal ?? 0}</Text>
            </View>
          </>
        )}
        {hasLink && platform.key !== 'google' && (
          <View style={styles.statsList}>
            <Text style={styles.statsValue}>{isVerified ? 'Profile verified and ready' : 'Profile found and ready'}</Text>
          </View>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.tapToSelect}>Tap to select products →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
          <Text style={styles.arrow}>←</Text>
          <Text style={styles.arrowLabel}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review platforms for {business.name}</Text>
        <Text style={styles.headerSubtitle}>{business.address}</Text>
      </View>
      
      {/* Tag Mode Selector */}
      {tagMode === 'review' ? (
        <ScrollView contentContainerStyle={styles.cardsContainer}>
          {loadingSocial && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#4f46e5" />
              <Text style={styles.loadingText}>Looking for profiles…</Text>
            </View>
          )}
          {reviewPlatforms.map(renderCard)}
        </ScrollView>
      ) : tagMode === 'wifi' ? (
        <View style={styles.modeContent}>
          <Text style={styles.modeDescription}>
            Program an NFC tag with your guest WiFi credentials. Customers can tap the tag to automatically connect to your WiFi network.
          </Text>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => navigation.navigate('WiFiCredential', { business })}
          >
            <Text style={styles.modeButtonText}>📶 Set Up WiFi Tag</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.modeContent}>
          <Text style={styles.modeDescription}>
            Create a tag that lets customers choose which platform they want to review you on.
          </Text>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => navigation.navigate('MultiPlatformTag', { business })}
          >
            <Text style={styles.modeButtonText}>🏢 Create Multi-Platform Tag</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.modeSelector}>
        <Text style={styles.modeSelectorLabel}>What would you like to program?</Text>
        <View style={styles.modePicker}>
          <Picker
            selectedValue={tagMode}
            onValueChange={(itemValue) => setTagMode(itemValue as TagMode)}
            style={styles.picker}
          >
            <Picker.Item label="📍 Review Platforms" value="review" />
            <Picker.Item label="📶 WiFi Credentials" value="wifi" />
            <Picker.Item label="🏢 Multi-Platform Tag" value="multiplatform" />
          </Picker>
        </View>
      </View>
      
      {tagMode === 'review' && (
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue to sign types</Text>
        </TouchableOpacity>
      )}

      {/* Action Selection Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Action</Text>
            <Text style={styles.modalSubtitle}>
              What would you like customers to do on {selectedPlatform?.label}?
            </Text>
            
            {getPlatformUrls(selectedPlatform?.key || '').reviewUrl && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => proceedWithUrl(
                  getPlatformUrls(selectedPlatform?.key || '').reviewUrl!,
                  'review'
                )}
              >
                <Text style={styles.actionEmoji}>✍️</Text>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Leave a Review</Text>
                  <Text style={styles.actionDescription}>
                    Takes customers directly to write a review
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {getPlatformUrls(selectedPlatform?.key || '').profileUrl && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => proceedWithUrl(
                  getPlatformUrls(selectedPlatform?.key || '').profileUrl!,
                  'profile'
                )}
              >
                <Text style={styles.actionEmoji}>👁️</Text>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Visit Page</Text>
                  <Text style={styles.actionDescription}>
                    Takes customers to your profile/listing
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  backArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  arrow: {
    fontSize: 20,
  },
  arrowLabel: {
    marginLeft: 6,
    color: '#4f46e5',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardsContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardSelected: {
    borderColor: '#4f46e5',
    shadowColor: '#4f46e5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  foundBadge: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '600',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notFoundBadge: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginRight: 4,
  },
  statsValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  statsList: {
    marginTop: 4,
  },
  notFoundText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 12,
    color: '#6b7280',
  },
  continueButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4f46e5',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tapToSelect: {
    fontSize: 13,
    color: '#4f46e5',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    flex: 1,
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#dc2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  actionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  cancelButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  modeSelector: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  modePicker: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#1f2937',
  },
  modeContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoonBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
});

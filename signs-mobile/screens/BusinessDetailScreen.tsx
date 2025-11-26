import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  Picker
} from 'react-native';
import { Business, SocialMediaLinks } from '../types';
import { socialMediaService } from '../services/socialMediaService';

type TagMode = 'review' | 'wifi' | 'multiplatform' | 'fruit_machine' | null;

// API URL - use environment variable or default to network IP
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

import PLATFORM_ICONS from '../assets/platform-icons';

export default function BusinessDetailScreen({ route, navigation }: any) {
  const [tagMode, setTagMode] = useState<TagMode | null>(null);
  const [socialMedia, setSocialMedia] = useState<SocialMediaLinks>({});
  const [loadingSocialMedia, setLoadingSocialMedia] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<'google' | 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'tripadvisor' | 'trustpilot' | 'yell' | 'ratedpeople' | 'trustatrader' | 'checkatrade'>('google');
  const [error, setError] = useState<string | null>(null);
  
  let business;
  let signType;
  
  try {
    const params = route?.params || {};
    business = params.business;
    signType = params.signType;
  } catch (e) {
    console.error('Error accessing route params:', e);
    setError('Failed to load business data: ' + e.message);
  }

  // Fetch social media links when business is loaded
  useEffect(() => {
    try {
      if (business) {
        loadSocialMediaLinks();
      }
    } catch (e) {
      console.error('Error in useEffect:', e);
      setError('Error loading social media: ' + e.message);
    }
  }, [business]);

  const loadSocialMediaLinks = async () => {
    if (!business) return;
    
    setLoadingSocialMedia(true);
    try {
      const links = await socialMediaService.getSocialMediaLinks(
        business.name,
        business.address,
        business.placeId,
        false // Don't verify initially to keep it fast
      );
      setSocialMedia(links);
    } catch (error) {
      console.error('Error loading social media links:', error);
      // Don't set error state here - social media is optional
    } finally {
      setLoadingSocialMedia(false);
    }
  };

  const handleContinueToSignSelection = (chosenType?: string) => {
    if (!business) {
      Alert.alert('Error', 'Business information is missing');
      return;
    }

    // Handle Fruit Machine mode
    if (tagMode === 'fruit_machine') {
      navigation.navigate('FruitMachineSetup', {
        business
      });
      return;
    }

    // Handle WiFi mode
    if (tagMode === 'wifi') {
      navigation.navigate('WiFiCredential', {
        business
      });
      return;
    }

    // Handle review platform modes
    // Determine which URL to write based on selected link type
    const chosen = (chosenType as any) || selectedLinkType;
    let urlToWrite = business.reviewUrl; // Default to Google review
    let linkDescription = 'Google Review';

    switch (chosen) {
      case 'facebook':
        urlToWrite = socialMedia.facebook?.reviewUrl || socialMedia.facebook?.profileUrl || business.reviewUrl;
        linkDescription = socialMedia.facebook?.reviewUrl ? 'Facebook Review' : 'Facebook Profile';
        break;
      case 'instagram':
        urlToWrite = socialMedia.instagram?.profileUrl || business.reviewUrl;
        linkDescription = 'Instagram Profile';
        break;
      case 'tiktok':
        urlToWrite = socialMedia.tiktok?.profileUrl || business.reviewUrl;
        linkDescription = 'TikTok Profile';
        break;
      case 'twitter':
        urlToWrite = socialMedia.twitter?.profileUrl || business.reviewUrl;
        linkDescription = 'Twitter/X Profile';
        break;
      case 'linkedin':
        urlToWrite = socialMedia.linkedin?.profileUrl || business.reviewUrl;
        linkDescription = 'LinkedIn Profile';
        break;
      case 'tripadvisor':
        urlToWrite = socialMedia.tripadvisor?.reviewUrl || business.reviewUrl;
        linkDescription = 'TripAdvisor Review';
        break;
      case 'trustpilot':
        urlToWrite = socialMedia.trustpilot?.reviewUrl || business.reviewUrl;
        linkDescription = 'Trustpilot Review';
        break;
      case 'yell':
        urlToWrite = socialMedia.yell?.profileUrl || business.reviewUrl;
        linkDescription = 'Yell Profile';
        break;
      case 'ratedpeople':
        urlToWrite = socialMedia.ratedpeople?.profileUrl || business.reviewUrl;
        linkDescription = 'Rated People Profile';
        break;
      case 'trustatrader':
        urlToWrite = socialMedia.trustatrader?.profileUrl || business.reviewUrl;
        linkDescription = 'TrustATrader Profile';
        break;
      case 'checkatrade':
        urlToWrite = socialMedia.checkatrade?.profileUrl || business.reviewUrl;
        linkDescription = 'Checkatrade Profile';
        break;
      default:
        urlToWrite = business.reviewUrl;
        linkDescription = 'Google Review';
    }

    // Navigate to sign type selection with the selected review platform info
    try {
      console.log('Navigating to SignTypeSelection', { chosen, urlToWrite, linkDescription });
      navigation.navigate('SignTypeSelection', {
        business,
        reviewUrl: urlToWrite,
        reviewPlatform: chosen,
        linkDescription
      });
    } catch (navErr) {
      console.error('Navigation error in handleContinueToSignSelection:', navErr);
      Alert.alert('Navigation error', String(navErr));
    }
  };

  // navigation is triggered directly from the link option onPress handlers

  const openReviewLink = () => {
    if (!business?.reviewUrl) {
      Alert.alert('Error', 'Review link is not available');
      return;
    }
    Linking.openURL(business.reviewUrl);
  };

  const openMapsLink = () => {
    if (!business?.mapsUrl) {
      Alert.alert('Error', 'Maps link is not available');
      return;
    }
    Linking.openURL(business.mapsUrl);
  };

  // Show error if any
  if (error) {
    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Please select a business from the map</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={styles.selectButtonText}>Back to Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.businessName}>{business.name}</Text>
        <Text style={styles.address}>{business.address}</Text>
        {business.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {business.rating.toFixed(1)}</Text>
            {business.userRatingsTotal && (
              <Text style={styles.ratingsCount}>({business.userRatingsTotal} reviews)</Text>
            )}
          </View>
        )}
      </View>

      {/* Tag Mode Selector - Card Based */}
      <View style={styles.modeSelector}>
        <Text style={styles.modeSelectorLabel}>Select What to Program</Text>
        
        {/* Review Platforms - Main option */}
        <TouchableOpacity
          style={[styles.modeCard, tagMode === 'review' && styles.modeCardSelected]}
          onPress={() => setTagMode('review')}
        >
          <Text style={styles.modeCardEmoji}>📱</Text>
          <View style={styles.modeCardContent}>
            <Text style={styles.modeCardTitle}>Review Platforms</Text>
            <Text style={styles.modeCardDescription}>Write Google, Facebook, or other review links</Text>
          </View>
          {tagMode === 'review' && <Text style={styles.modeCardCheck}>✓</Text>}
        </TouchableOpacity>

        {/* WiFi Credentials - Special promotional card */}
        <TouchableOpacity
          style={[styles.modeCard, styles.modeCardPromo, tagMode === 'wifi' && styles.modeCardSelected]}
          onPress={() => setTagMode('wifi')}
        >
          <Text style={styles.modeCardEmoji}>📶</Text>
          <View style={styles.modeCardContent}>
            <Text style={styles.modeCardTitle}>WiFi Credentials</Text>
            <Text style={styles.modeCardDescription}>Program guest WiFi to NFC tags</Text>
          </View>
          {tagMode === 'wifi' && <Text style={styles.modeCardCheck}>✓</Text>}
        </TouchableOpacity>

        {/* Fruit Machine Promo - Special promotional card */}
        <TouchableOpacity
          style={[styles.modeCard, styles.modeCardPromo, tagMode === 'fruit_machine' && styles.modeCardSelected]}
          onPress={() => setTagMode('fruit_machine')}
        >
          <Text style={styles.modeCardEmoji}>🎰</Text>
          <View style={styles.modeCardContent}>
            <Text style={styles.modeCardTitle}>Fruit Machine Promotion</Text>
            <Text style={styles.modeCardDescription}>Create promotional giveaway games</Text>
          </View>
          {tagMode === 'fruit_machine' && <Text style={styles.modeCardCheck}>✓</Text>}
        </TouchableOpacity>

        {/* Multi-Platform - Coming Soon */}
        <TouchableOpacity
          style={[styles.modeCard, styles.modeCardDisabled]}
          disabled={true}
        >
          <Text style={styles.modeCardEmoji}>🏢</Text>
          <View style={styles.modeCardContent}>
            <Text style={styles.modeCardTitle}>Multi-Platform Tag</Text>
            <Text style={styles.modeCardDescription}>Coming soon: Multiple platforms on one tag</Text>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </TouchableOpacity>
      </View>

      {signType && (
        <View style={styles.signTypeCard}>
          <View style={styles.signTypeHeader}>
            <Text style={styles.signTypeLabel}>Selected Sign Type</Text>
            <TouchableOpacity 
              onPress={() => navigation.push('SignTypeSelection', {
                business
              })}
            >
              <Text style={styles.changeButton}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.signTypeName}>{signType.name}</Text>
          <Text style={styles.signTypeDescription}>{signType.description}</Text>
          <Text style={styles.signTypePrice}>Default Price: £{signType.defaultPrice.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Location</Text>
        <Text style={styles.cardText}>
          Lat: {business.location.lat.toFixed(6)}{'\n'}
          Lng: {business.location.lng.toFixed(6)}
        </Text>
        <TouchableOpacity style={styles.linkButton} onPress={openMapsLink}>
          <Text style={styles.linkButtonText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>⭐ Review Link</Text>
        <Text style={styles.cardText} numberOfLines={2}>
          {business.reviewUrl}
        </Text>
        <TouchableOpacity style={styles.linkButton} onPress={openReviewLink}>
          <Text style={styles.linkButtonText}>Open Review Page</Text>
        </TouchableOpacity>
      </View>

      {tagMode !== null && (
        <View style={styles.nfcSection}>
          <Text style={styles.nfcTitle}>
            {tagMode === 'wifi' ? '📶 WiFi Credentials' :
              tagMode === 'review' ? '📱 Write to NFC Tag' :
              tagMode === 'multiplatform' ? '🏢 Multi-Platform Tag' :
              tagMode === 'fruit_machine' ? '🎰 Fruit Machine Promotion' : ''}
          </Text>

          {(() => {
          if (tagMode === 'fruit_machine') {
            return (
              <View>
                <Text style={styles.nfcDescription}>
                  Program an NFC tag to trigger a fruit machine promotion. Customers tap the tag after making a purchase to spin and win a free gift configured by your team.
                </Text>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinueToSignSelection}
                >
                  <Text style={styles.continueButtonText}>🎰 Set Up Fruit Machine</Text>
                </TouchableOpacity>
              </View>
            );
          }
          
          if (tagMode === 'wifi') {
            return (
              <View>
                <Text style={styles.nfcDescription}>
                  Program an NFC tag with your guest WiFi credentials. Customers can tap the tag to automatically connect to your WiFi network.
                </Text>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinueToSignSelection}
                >
                  <Text style={styles.continueButtonText}>📶 Set Up WiFi Tag</Text>
                </TouchableOpacity>
              </View>
            );
          }
          
          if (tagMode === 'multiplatform') {
            return (
              <View>
                <Text style={styles.nfcDescription}>
                  Coming soon: Write multiple review platforms to a single tag. Customers will be able to choose which platform they want to review on.
                </Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Feature Coming Soon</Text>
                </View>
              </View>
            );
          }
          
          // Review mode
          return (
            <View>
              <Text style={styles.nfcDescription}>
                Select which link to program on the NFC tag, then write it to a tag.
              </Text>

              <View style={styles.linkTypeSelector}>
                <Text style={styles.linkTypeSelectorTitle}>Select Link Type:</Text>
          
          {/* Google Review - Always available */}
          <TouchableOpacity
            style={[styles.linkTypeOption, selectedLinkType === 'google' && styles.linkTypeOptionSelected]}
            onPress={() => { console.log('Google pressed'); setSelectedLinkType('google'); handleContinueToSignSelection('google'); }}
            disabled={!business?.reviewUrl}
          >
            <Text style={[styles.linkTypeEmoji, selectedLinkType === 'google' && styles.linkTypeEmojiSelected]}>🔍</Text>
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'google' && styles.linkTypeLabelSelected]}>Google Review</Text>
              <Text style={styles.linkTypeUrl} numberOfLines={1}>{business.reviewUrl}</Text>
              <Text style={{color: business.reviewUrl ? 'green' : 'gray', fontSize: 12}}>
                {business.reviewUrl ? 'Available' : 'Not available'}
              </Text>
            </View>
            {selectedLinkType === 'google' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>

          {/* Facebook */}
          <TouchableOpacity
            style={[
              styles.linkTypeOption, 
              (!socialMedia.facebook?.profileUrl && !socialMedia.facebook?.reviewUrl) && styles.linkTypeOptionDisabled,
              selectedLinkType === 'facebook' && socialMedia.facebook && styles.linkTypeOptionSelected
            ]}
            onPress={() => { console.log('Facebook pressed', { available: !!(socialMedia.facebook?.profileUrl || socialMedia.facebook?.reviewUrl) }); if (socialMedia.facebook?.profileUrl || socialMedia.facebook?.reviewUrl) { setSelectedLinkType('facebook'); handleContinueToSignSelection('facebook'); } }}
            disabled={!socialMedia.facebook?.profileUrl && !socialMedia.facebook?.reviewUrl}
          >
            {PLATFORM_ICONS.facebook ? (
              <Image source={PLATFORM_ICONS.facebook} style={styles.linkTypeIcon} />
            ) : (
              <Text style={[styles.linkTypeEmoji, selectedLinkType === 'facebook' && styles.linkTypeEmojiSelected]}>📘</Text>
            )}
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'facebook' && styles.linkTypeLabelSelected]}>
                Facebook {socialMedia.facebook?.reviewUrl ? 'Review' : 'Profile'}
              </Text>
              {socialMedia.facebook ? (
                <Text style={styles.linkTypeUrl} numberOfLines={1}>
                  {socialMedia.facebook.reviewUrl || socialMedia.facebook.profileUrl}
                </Text>
              ) : loadingSocialMedia ? (
                <Text style={styles.linkTypeUrlUnavailable}>Searching...</Text>
              ) : (
                <Text style={styles.linkTypeUrlUnavailable}>Not available for this business</Text>
              )}
              <Text style={{color: (socialMedia.facebook?.profileUrl || socialMedia.facebook?.reviewUrl) ? 'green' : 'gray', fontSize: 12}}>
                {(socialMedia.facebook?.profileUrl || socialMedia.facebook?.reviewUrl) ? 'Available' : loadingSocialMedia ? 'Searching...' : 'Not available'}
              </Text>
            </View>
            {!loadingSocialMedia && socialMedia.facebook && selectedLinkType === 'facebook' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>

          {/* Instagram */}
          <TouchableOpacity
            style={[
              styles.linkTypeOption,
              !socialMedia.instagram && styles.linkTypeOptionDisabled,
              selectedLinkType === 'instagram' && socialMedia.instagram && styles.linkTypeOptionSelected
            ]}
            onPress={() => { console.log('Instagram pressed', { available: !!socialMedia.instagram?.profileUrl }); if (socialMedia.instagram?.profileUrl) { setSelectedLinkType('instagram'); handleContinueToSignSelection('instagram'); } }}
            disabled={!socialMedia.instagram?.profileUrl}
          >
            {PLATFORM_ICONS.instagram ? (
              <Image source={PLATFORM_ICONS.instagram} style={styles.linkTypeIcon} />
            ) : (
              <Text style={[styles.linkTypeEmoji, selectedLinkType === 'instagram' && styles.linkTypeEmojiSelected]}>📸</Text>
            )}
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'instagram' && styles.linkTypeLabelSelected]}>Instagram Profile</Text>
              {socialMedia.instagram ? (
                <Text style={styles.linkTypeUrl} numberOfLines={1}>{socialMedia.instagram.profileUrl}</Text>
              ) : loadingSocialMedia ? (
                <Text style={styles.linkTypeUrlUnavailable}>Searching...</Text>
              ) : (
                <Text style={styles.linkTypeUrlUnavailable}>Not available for this business</Text>
              )}
              <Text style={{color: socialMedia.instagram?.profileUrl ? 'green' : 'gray', fontSize: 12}}>
                {socialMedia.instagram?.profileUrl ? 'Available' : loadingSocialMedia ? 'Searching...' : 'Not available'}
              </Text>
            </View>
            {!loadingSocialMedia && socialMedia.instagram && selectedLinkType === 'instagram' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>

          {/* TikTok */}
          <TouchableOpacity
            style={[
              styles.linkTypeOption,
              !socialMedia.tiktok && styles.linkTypeOptionDisabled,
              selectedLinkType === 'tiktok' && socialMedia.tiktok && styles.linkTypeOptionSelected
            ]}
            onPress={() => { console.log('TikTok pressed', { available: !!socialMedia.tiktok?.profileUrl }); if (socialMedia.tiktok?.profileUrl) { setSelectedLinkType('tiktok'); handleContinueToSignSelection('tiktok'); } }}
            disabled={!socialMedia.tiktok?.profileUrl}
          >
            {PLATFORM_ICONS.tiktok ? (
              <Image source={PLATFORM_ICONS.tiktok} style={styles.linkTypeIcon} />
            ) : (
              <Text style={[styles.linkTypeEmoji, selectedLinkType === 'tiktok' && styles.linkTypeEmojiSelected]}>🎵</Text>
            )}
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'tiktok' && styles.linkTypeLabelSelected]}>TikTok Profile</Text>
              {socialMedia.tiktok ? (
                <Text style={styles.linkTypeUrl} numberOfLines={1}>{socialMedia.tiktok.profileUrl}</Text>
              ) : loadingSocialMedia ? (
                <Text style={styles.linkTypeUrlUnavailable}>Searching...</Text>
              ) : (
                <Text style={styles.linkTypeUrlUnavailable}>Not available for this business</Text>
              )}
              <Text style={{color: socialMedia.tiktok?.profileUrl ? 'green' : 'gray', fontSize: 12}}>
                {socialMedia.tiktok?.profileUrl ? 'Available' : loadingSocialMedia ? 'Searching...' : 'Not available'}
              </Text>
            </View>
            {!loadingSocialMedia && socialMedia.tiktok && selectedLinkType === 'tiktok' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>

          {/* Twitter/X */}
          <TouchableOpacity
            style={[
              styles.linkTypeOption,
              !socialMedia.twitter && styles.linkTypeOptionDisabled,
              selectedLinkType === 'twitter' && socialMedia.twitter && styles.linkTypeOptionSelected
            ]}
            onPress={() => { console.log('Twitter pressed', { available: !!socialMedia.twitter?.profileUrl }); if (socialMedia.twitter?.profileUrl) { setSelectedLinkType('twitter'); handleContinueToSignSelection('twitter'); } }}
            disabled={!socialMedia.twitter?.profileUrl}
          >
            {PLATFORM_ICONS.twitter ? (
              <Image source={PLATFORM_ICONS.twitter} style={styles.linkTypeIcon} />
            ) : (
              <Text style={[styles.linkTypeEmoji, selectedLinkType === 'twitter' && styles.linkTypeEmojiSelected]}>🐦</Text>
            )}
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'twitter' && styles.linkTypeLabelSelected]}>Twitter/X Profile</Text>
              {socialMedia.twitter ? (
                <Text style={styles.linkTypeUrl} numberOfLines={1}>{socialMedia.twitter.profileUrl}</Text>
              ) : loadingSocialMedia ? (
                <Text style={styles.linkTypeUrlUnavailable}>Searching...</Text>
              ) : (
                <Text style={styles.linkTypeUrlUnavailable}>Not available for this business</Text>
              )}
              <Text style={{color: socialMedia.twitter?.profileUrl ? 'green' : 'gray', fontSize: 12}}>
                {socialMedia.twitter?.profileUrl ? 'Available' : loadingSocialMedia ? 'Searching...' : 'Not available'}
              </Text>
            </View>
            {!loadingSocialMedia && socialMedia.twitter && selectedLinkType === 'twitter' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>

          {/* LinkedIn */}
          <TouchableOpacity
            style={[
              styles.linkTypeOption,
              !socialMedia.linkedin && styles.linkTypeOptionDisabled,
              selectedLinkType === 'linkedin' && socialMedia.linkedin && styles.linkTypeOptionSelected
            ]}
            onPress={() => { console.log('LinkedIn pressed', { available: !!socialMedia.linkedin?.profileUrl }); if (socialMedia.linkedin?.profileUrl) { setSelectedLinkType('linkedin'); handleContinueToSignSelection('linkedin'); } }}
            disabled={!socialMedia.linkedin?.profileUrl}
          >
            {PLATFORM_ICONS.linkedin ? (
              <Image source={PLATFORM_ICONS.linkedin} style={styles.linkTypeIcon} />
            ) : (
              <Text style={[styles.linkTypeEmoji, selectedLinkType === 'linkedin' && styles.linkTypeEmojiSelected]}>💼</Text>
            )}
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'linkedin' && styles.linkTypeLabelSelected]}>LinkedIn Profile</Text>
              {socialMedia.linkedin ? (
                <Text style={styles.linkTypeUrl} numberOfLines={1}>{socialMedia.linkedin.profileUrl}</Text>
              ) : loadingSocialMedia ? (
                <Text style={styles.linkTypeUrlUnavailable}>Searching...</Text>
              ) : (
                <Text style={styles.linkTypeUrlUnavailable}>Not available for this business</Text>
              )}
              <Text style={{color: socialMedia.linkedin?.profileUrl ? 'green' : 'gray', fontSize: 12}}>
                {socialMedia.linkedin?.profileUrl ? 'Available' : loadingSocialMedia ? 'Searching...' : 'Not available'}
              </Text>
            </View>
            {!loadingSocialMedia && socialMedia.linkedin && selectedLinkType === 'linkedin' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>

          {/* TripAdvisor */}
          <TouchableOpacity
            style={[
              styles.linkTypeOption,
              !socialMedia.tripadvisor && styles.linkTypeOptionDisabled,
              selectedLinkType === 'tripadvisor' && socialMedia.tripadvisor && styles.linkTypeOptionSelected
            ]}
            onPress={() => { console.log('TripAdvisor pressed', { available: !!(socialMedia.tripadvisor?.reviewUrl || socialMedia.tripadvisor?.searchUrl) }); if (socialMedia.tripadvisor?.reviewUrl || socialMedia.tripadvisor?.searchUrl) { setSelectedLinkType('tripadvisor'); handleContinueToSignSelection('tripadvisor'); } }}
            disabled={!socialMedia.tripadvisor?.reviewUrl && !socialMedia.tripadvisor?.searchUrl}
          >
            {PLATFORM_ICONS.tripadvisor ? (
              <Image source={PLATFORM_ICONS.tripadvisor} style={styles.linkTypeIcon} />
            ) : (
              <Text style={[styles.linkTypeEmoji, selectedLinkType === 'tripadvisor' && styles.linkTypeEmojiSelected]}>🦉</Text>
            )}
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'tripadvisor' && styles.linkTypeLabelSelected]}>TripAdvisor Review</Text>
              {socialMedia.tripadvisor ? (
                <>
                  <Text style={styles.linkTypeUrl} numberOfLines={1}>
                    {socialMedia.tripadvisor.reviewUrl || socialMedia.tripadvisor.searchUrl}
                  </Text>
                  {socialMedia.tripadvisor.note && (
                    <Text style={{fontSize: 11, color: '#666', marginTop: 4}}>{socialMedia.tripadvisor.note}</Text>
                  )}
                </>
              ) : loadingSocialMedia ? (
                <Text style={styles.linkTypeUrlUnavailable}>Searching...</Text>
              ) : (
                <Text style={styles.linkTypeUrlUnavailable}>Not available for this business</Text>
              )}
              <Text style={{color: (socialMedia.tripadvisor?.reviewUrl || socialMedia.tripadvisor?.searchUrl) ? 'green' : 'gray', fontSize: 12}}>
                {(socialMedia.tripadvisor?.reviewUrl || socialMedia.tripadvisor?.searchUrl) ? 'Available' : loadingSocialMedia ? 'Searching...' : 'Not available'}
              </Text>
            </View>
            {!loadingSocialMedia && socialMedia.tripadvisor && selectedLinkType === 'tripadvisor' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>

          {/* Trustpilot */}
          <TouchableOpacity
            style={[
              styles.linkTypeOption,
              !socialMedia.trustpilot && styles.linkTypeOptionDisabled,
              selectedLinkType === 'trustpilot' && socialMedia.trustpilot && styles.linkTypeOptionSelected
            ]}
            onPress={() => { console.log('Trustpilot pressed', { available: !!(socialMedia.trustpilot?.reviewUrl || socialMedia.trustpilot?.searchUrl) }); if (socialMedia.trustpilot?.reviewUrl || socialMedia.trustpilot?.searchUrl) { setSelectedLinkType('trustpilot'); handleContinueToSignSelection('trustpilot'); } }}
            disabled={!socialMedia.trustpilot?.reviewUrl && !socialMedia.trustpilot?.searchUrl}
          >
            {PLATFORM_ICONS.trustpilot ? (
              <Image source={PLATFORM_ICONS.trustpilot} style={styles.linkTypeIcon} />
            ) : (
              <Text style={[styles.linkTypeEmoji, selectedLinkType === 'trustpilot' && styles.linkTypeEmojiSelected]}>⭐</Text>
            )}
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'trustpilot' && styles.linkTypeLabelSelected]}>Trustpilot Review</Text>
              {socialMedia.trustpilot ? (
                <>
                  <Text style={styles.linkTypeUrl} numberOfLines={1}>
                    {socialMedia.trustpilot.reviewUrl || socialMedia.trustpilot.searchUrl}
                  </Text>
                  {socialMedia.trustpilot.note && (
                    <Text style={{fontSize: 11, color: '#666', marginTop: 4}}>{socialMedia.trustpilot.note}</Text>
                  )}
                </>
              ) : loadingSocialMedia ? (
                <Text style={styles.linkTypeUrlUnavailable}>Searching...</Text>
              ) : (
                <Text style={styles.linkTypeUrlUnavailable}>Not available for this business</Text>
              )}
              <Text style={{color: (socialMedia.trustpilot?.reviewUrl || socialMedia.trustpilot?.searchUrl) ? 'green' : 'gray', fontSize: 12}}>
                {(socialMedia.trustpilot?.reviewUrl || socialMedia.trustpilot?.searchUrl) ? 'Available' : loadingSocialMedia ? 'Searching...' : 'Not available'}
              </Text>
            </View>
            {!loadingSocialMedia && socialMedia.trustpilot && selectedLinkType === 'trustpilot' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>

          {/* Yell */}
          <TouchableOpacity
            style={[
              styles.linkTypeOption,
              !socialMedia.yell && styles.linkTypeOptionDisabled,
              selectedLinkType === 'yell' && socialMedia.yell && styles.linkTypeOptionSelected
            ]}
            onPress={() => { console.log('Yell pressed', { available: !!(socialMedia.yell?.profileUrl || socialMedia.yell?.searchUrl) }); if (socialMedia.yell?.profileUrl || socialMedia.yell?.searchUrl) { setSelectedLinkType('yell'); handleContinueToSignSelection('yell'); } }}
            disabled={!socialMedia.yell?.profileUrl && !socialMedia.yell?.searchUrl}
          >
            {PLATFORM_ICONS.yell ? (
              <Image source={PLATFORM_ICONS.yell} style={styles.linkTypeIcon} />
            ) : (
              <Text style={[styles.linkTypeEmoji, selectedLinkType === 'yell' && styles.linkTypeEmojiSelected]}>📢</Text>
            )}
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'yell' && styles.linkTypeLabelSelected]}>Yell Profile</Text>
              {socialMedia.yell ? (
                <>
                  <Text style={styles.linkTypeUrl} numberOfLines={1}>
                    {socialMedia.yell.profileUrl || socialMedia.yell.searchUrl}
                  </Text>
                  {socialMedia.yell.note && (
                    <Text style={{fontSize: 11, color: '#666', marginTop: 4}}>{socialMedia.yell.note}</Text>
                  )}
                </>
              ) : loadingSocialMedia ? (
                <Text style={styles.linkTypeUrlUnavailable}>Searching...</Text>
              ) : (
                <Text style={styles.linkTypeUrlUnavailable}>Not available for this business</Text>
              )}
              <Text style={{color: (socialMedia.yell?.profileUrl || socialMedia.yell?.searchUrl) ? 'green' : 'gray', fontSize: 12}}>
                {(socialMedia.yell?.profileUrl || socialMedia.yell?.searchUrl) ? 'Available' : loadingSocialMedia ? 'Searching...' : 'Not available'}
              </Text>
            </View>
            {!loadingSocialMedia && socialMedia.yell && selectedLinkType === 'yell' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>

          {/* Checkatrade */}
          <TouchableOpacity
            style={[
              styles.linkTypeOption,
              !socialMedia.checkatrade && styles.linkTypeOptionDisabled,
              selectedLinkType === 'checkatrade' && socialMedia.checkatrade && styles.linkTypeOptionSelected
            ]}
            onPress={() => { console.log('Checkatrade pressed', { available: !!(socialMedia.checkatrade?.profileUrl || socialMedia.checkatrade?.searchUrl) }); if (socialMedia.checkatrade?.profileUrl || socialMedia.checkatrade?.searchUrl) { setSelectedLinkType('checkatrade'); handleContinueToSignSelection('checkatrade'); } }}
            disabled={!socialMedia.checkatrade?.profileUrl && !socialMedia.checkatrade?.searchUrl}
          >
            {PLATFORM_ICONS.checkatrade ? (
              <Image source={PLATFORM_ICONS.checkatrade} style={styles.linkTypeIcon} />
            ) : (
              <Text style={[styles.linkTypeEmoji, selectedLinkType === 'checkatrade' && styles.linkTypeEmojiSelected]}>✅</Text>
            )}
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'checkatrade' && styles.linkTypeLabelSelected]}>Checkatrade Profile</Text>
              {socialMedia.checkatrade ? (
                <>
                  <Text style={styles.linkTypeUrl} numberOfLines={1}>
                    {socialMedia.checkatrade.profileUrl || socialMedia.checkatrade.searchUrl}
                  </Text>
                  {socialMedia.checkatrade.note && (
                    <Text style={{fontSize: 11, color: '#666', marginTop: 4}}>{socialMedia.checkatrade.note}</Text>
                  )}
                </>
              ) : loadingSocialMedia ? (
                <Text style={styles.linkTypeUrlUnavailable}>Searching...</Text>
              ) : (
                <Text style={styles.linkTypeUrlUnavailable}>Not available for this business</Text>
              )}
              <Text style={{color: (socialMedia.checkatrade?.profileUrl || socialMedia.checkatrade?.searchUrl) ? 'green' : 'gray', fontSize: 12}}>
                {(socialMedia.checkatrade?.profileUrl || socialMedia.checkatrade?.searchUrl) ? 'Available' : loadingSocialMedia ? 'Searching...' : 'Not available'}
              </Text>
            </View>
            {!loadingSocialMedia && socialMedia.checkatrade && selectedLinkType === 'checkatrade' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>

          {/* Rated People */}
          <TouchableOpacity
            style={[
              styles.linkTypeOption,
              !socialMedia.ratedpeople && styles.linkTypeOptionDisabled,
              selectedLinkType === 'ratedpeople' && socialMedia.ratedpeople && styles.linkTypeOptionSelected
            ]}
            onPress={() => { console.log('RatedPeople pressed', { available: !!(socialMedia.ratedpeople?.profileUrl || socialMedia.ratedpeople?.searchUrl) }); if (socialMedia.ratedpeople?.profileUrl || socialMedia.ratedpeople?.searchUrl) { setSelectedLinkType('ratedpeople'); handleContinueToSignSelection('ratedpeople'); } }}
            disabled={!socialMedia.ratedpeople?.profileUrl && !socialMedia.ratedpeople?.searchUrl}
          >
            {PLATFORM_ICONS.ratedpeople ? (
              <Image source={PLATFORM_ICONS.ratedpeople} style={styles.linkTypeIcon} />
            ) : (
              <Text style={[styles.linkTypeEmoji, selectedLinkType === 'ratedpeople' && styles.linkTypeEmojiSelected]}>👥</Text>
            )}
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'ratedpeople' && styles.linkTypeLabelSelected]}>Rated People Profile</Text>
              {socialMedia.ratedpeople ? (
                <>
                  <Text style={styles.linkTypeUrl} numberOfLines={1}>
                    {socialMedia.ratedpeople.profileUrl || socialMedia.ratedpeople.searchUrl}
                  </Text>
                  {socialMedia.ratedpeople.note && (
                    <Text style={{fontSize: 11, color: '#666', marginTop: 4}}>{socialMedia.ratedpeople.note}</Text>
                  )}
                </>
              ) : loadingSocialMedia ? (
                <Text style={styles.linkTypeUrlUnavailable}>Searching...</Text>
              ) : (
                <Text style={styles.linkTypeUrlUnavailable}>Not available for this business</Text>
              )}
              <Text style={{color: (socialMedia.ratedpeople?.profileUrl || socialMedia.ratedpeople?.searchUrl) ? 'green' : 'gray', fontSize: 12}}>
                {(socialMedia.ratedpeople?.profileUrl || socialMedia.ratedpeople?.searchUrl) ? 'Available' : loadingSocialMedia ? 'Searching...' : 'Not available'}
              </Text>
            </View>
            {!loadingSocialMedia && socialMedia.ratedpeople && selectedLinkType === 'ratedpeople' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>

          {/* TrustATrader */}
          <TouchableOpacity
            style={[
              styles.linkTypeOption,
              !socialMedia.trustatrader && styles.linkTypeOptionDisabled,
              selectedLinkType === 'trustatrader' && socialMedia.trustatrader && styles.linkTypeOptionSelected
            ]}
            onPress={() => { console.log('TrustATrader pressed', { available: !!(socialMedia.trustatrader?.profileUrl || socialMedia.trustatrader?.searchUrl) }); if (socialMedia.trustatrader?.profileUrl || socialMedia.trustatrader?.searchUrl) { setSelectedLinkType('trustatrader'); handleContinueToSignSelection('trustatrader'); } }}
            disabled={!socialMedia.trustatrader?.profileUrl && !socialMedia.trustatrader?.searchUrl}
          >
            {PLATFORM_ICONS.trustatrader ? (
              <Image source={PLATFORM_ICONS.trustatrader} style={styles.linkTypeIcon} />
            ) : (
              <Text style={[styles.linkTypeEmoji, selectedLinkType === 'trustatrader' && styles.linkTypeEmojiSelected]}>🔧</Text>
            )}
            <View style={styles.linkTypeTextContainer}>
              <Text style={[styles.linkTypeLabel, selectedLinkType === 'trustatrader' && styles.linkTypeLabelSelected]}>TrustATrader Profile</Text>
              {socialMedia.trustatrader ? (
                <>
                  <Text style={styles.linkTypeUrl} numberOfLines={1}>
                    {socialMedia.trustatrader.profileUrl || socialMedia.trustatrader.searchUrl}
                  </Text>
                  {socialMedia.trustatrader.note && (
                    <Text style={{fontSize: 11, color: '#666', marginTop: 4}}>{socialMedia.trustatrader.note}</Text>
                  )}
                </>
              ) : loadingSocialMedia ? (
                <Text style={styles.linkTypeUrlUnavailable}>Searching...</Text>
              ) : (
                <Text style={styles.linkTypeUrlUnavailable}>Not available for this business</Text>
              )}
              <Text style={{color: (socialMedia.trustatrader?.profileUrl || socialMedia.trustatrader?.searchUrl) ? 'green' : 'gray', fontSize: 12}}>
                {(socialMedia.trustatrader?.profileUrl || socialMedia.trustatrader?.searchUrl) ? 'Available' : loadingSocialMedia ? 'Searching...' : 'Not available'}
              </Text>
            </View>
            {!loadingSocialMedia && socialMedia.trustatrader && selectedLinkType === 'trustatrader' && <Text style={styles.linkTypeCheck}>✓</Text>}
          </TouchableOpacity>
        </View>
              </View>
            );
        })()}
        </View>
      )}
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
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  ratingsCount: {
    fontSize: 14,
    color: '#9ca3af',
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
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  linkButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  nfcSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nfcTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  nfcDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  linkTypeSelector: {
    marginBottom: 20,
  },
  linkTypeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  linkTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  linkTypeOptionSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#4f46e5',
  },
  linkTypeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  linkTypeIcon: {
    width: 28,
    height: 28,
    marginRight: 12,
    resizeMode: 'contain'
  },
  linkTypeEmojiSelected: {
    fontSize: 28,
  },
  linkTypeTextContainer: {
    flex: 1,
  },
  linkTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  linkTypeLabelSelected: {
    color: '#4f46e5',
  },
  linkTypeUrl: {
    fontSize: 11,
    color: '#9ca3af',
  },
  linkTypeUrlUnavailable: {
    fontSize: 11,
    color: '#d1d5db',
    fontStyle: 'italic',
  },
  linkTypeOptionDisabled: {
    opacity: 0.5,
    backgroundColor: '#f3f4f6',
  },
  linkTypeCheck: {
    fontSize: 20,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  continueButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modeSelector: {
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
  modeSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  modeCardPromo: {
    backgroundColor: '#fffbeb',
    borderColor: '#fbbf24',
  },
  modeCardSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  modeCardDisabled: {
    opacity: 0.6,
  },
  modeCardEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  modeCardContent: {
    flex: 1,
  },
  modeCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  modeCardDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  modeCardCheck: {
    fontSize: 18,
    color: '#4f46e5',
    fontWeight: 'bold',
    marginLeft: 8,
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
  signTypeCard: {
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
  signTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  signTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  changeButton: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
  },
  signTypeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  signTypeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  signTypePrice: {
    fontSize: 14,
    color: '#10b981',
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
    marginTop: 12,
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  selectButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Business } from '../types';
import { wifiCredentialService, WiFiCredential } from '../services/wifiCredentialService';

interface WiFiCredentialScreenProps {
  navigation: any;
  route: any;
}

export default function WiFiCredentialScreen({ navigation, route }: WiFiCredentialScreenProps) {
  const [business, setBusiness] = useState<Business | undefined>(route?.params?.business);
  const [ssid, setSSID] = useState('');
  const [password, setPassword] = useState('');
  const [security, setSecurity] = useState<'Open' | 'WPA' | 'WPA2' | 'WPA3'>('WPA');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Handle business selection from map
    const unsubscribe = navigation.addListener('focus', () => {
      const routeParams = route?.params;
      if (routeParams?.business) {
        setBusiness(routeParams.business);
      }
    });
    
    loadCredentials();
    return unsubscribe;
  }, [navigation, route]);

  const handleSelectFromMap = () => {
    navigation.navigate('Map', {
      returnTo: 'WiFiCredential',
      purpose: 'Select a business for WiFi setup'
    });
  };

  const loadCredentials = async () => {
    if (!business?.placeId) {
      setLoading(false);
      return;
    }

    try {
      const existing = await wifiCredentialService.getForBusiness(business.placeId);
      if (existing) {
        setSSID(existing.ssid);
        setPassword(existing.password);
        setSecurity(existing.security);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!business) {
      Alert.alert('Error', 'Business information is missing');
      return;
    }

    if (!ssid.trim()) {
      Alert.alert('Error', 'Please enter a WiFi network name (SSID)');
      return;
    }

    if (security !== 'Open' && !password.trim()) {
      Alert.alert('Error', 'Please enter a password for the WiFi network');
      return;
    }

    try {
      setSaving(true);
      const success = await wifiCredentialService.saveForBusiness(
        business.name,
        business.placeId,
        ssid,
        password,
        security
      );

      if (success) {
        Alert.alert(
          'Success',
          'WiFi credentials saved. Now you can write them to an NFC tag.',
          [
            {
              text: 'Write to Tag',
              onPress: () => {
                navigation.navigate('WiFiNFCWrite', {
                  business,
                  ssid,
                  password,
                  security
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save WiFi credentials');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleWriteTag = () => {
    if (!ssid.trim()) {
      Alert.alert('Error', 'Please enter a WiFi network name first');
      return;
    }

    if (security !== 'Open' && !password.trim()) {
      Alert.alert('Error', 'Please enter a password first');
      return;
    }

    navigation.navigate('WiFiNFCWrite', {
      business,
      ssid,
      password,
      security
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>📶 WiFi Setup</Text>
          <Text style={styles.subtitle}>Store guest WiFi credentials on NFC tags</Text>
        </View>

        {!business ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select a Business</Text>
            <Text style={styles.infoText}>
              Please select a business from the map to set up WiFi credentials.
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
              <Text style={styles.sectionTitle}>Selected Business</Text>
              <Text style={styles.businessName}>{business.name}</Text>
              <Text style={styles.businessAddress}>{business.address}</Text>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSelectFromMap}
              >
                <Text style={styles.buttonText}>🗺️ Change Business</Text>
              </TouchableOpacity>
            </View>

            {/* Network Details */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Network Details</Text>

          {/* SSID Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Network Name (SSID)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., GuestWiFi"
              value={ssid}
              onChangeText={setSSID}
              editable={!saving}
            />
          </View>

          {/* Security Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Security Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={security}
                onValueChange={(itemValue) => setSecurity(itemValue as 'Open' | 'WPA' | 'WPA2' | 'WPA3')}
                enabled={!saving}
                style={styles.picker}
              >
                <Picker.Item label="Open (No Password)" value="Open" />
                <Picker.Item label="WPA / WPA2" value="WPA" />
                <Picker.Item label="WPA2" value="WPA2" />
                <Picker.Item label="WPA3" value="WPA3" />
              </Picker>
            </View>
          </View>

          {/* Password Input */}
          {security !== 'Open' ? (
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleButton}>{showPassword ? '👁️ Hide' : '👁️ Show'}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter WiFi password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!saving}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ How it works</Text>
          <Text style={styles.infoText}>
            1. Enter your guest WiFi network name and password
            {'\n'}2. Tap "Write to Tag" to program an NFC tag
            {'\n'}3. Customers tap the tag with their phone
            {'\n'}4. Their phone automatically connects to WiFi
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Save Credentials</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.writeButton, saving && styles.buttonDisabled]}
            onPress={handleWriteTag}
            disabled={saving}
          >
            <Text style={styles.writeButtonText}>📱 Write to NFC Tag</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleButton: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  infoCard: {
    backgroundColor: '#e0e7ff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4338ca',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  writeButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  writeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

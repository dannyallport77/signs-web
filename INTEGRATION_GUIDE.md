# Integration Guide: Adding Remote NFC Programming to Existing Flows

This guide shows how to integrate the Remote NFC Programming system into your existing tag programming flows (Fruit Machine, WiFi credentials, etc.).

## 1. Adding Menu Link to Passive NFC Mode

### Option A: Add to Home Screen/Main Menu

**File:** `screens/NFCActionScreen.tsx`

```tsx
import PassiveNFCModeScreen from '../screens/PassiveNFCModeScreen';

// Add this button to your menu:
<TouchableOpacity 
  style={styles.menuButton}
  onPress={() => navigation.navigate('PassiveNFCMode')}
>
  <Text style={styles.menuIcon}>📡</Text>
  <Text style={styles.menuLabel}>Passive NFC Mode</Text>
  <Text style={styles.menuSubtext}>Program tags remotely</Text>
</TouchableOpacity>
```

### Option B: Add Settings/Configuration Screen

Add a "Registered Devices" info panel in a settings screen:

```tsx
import mobileDeviceService from '../services/mobileDeviceService';

const SettingsScreen = () => {
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    const loadDeviceInfo = async () => {
      const deviceId = await mobileDeviceService.getDeviceId();
      const info = await mobileDeviceService.getDeviceInfo();
      setDeviceInfo({ deviceId, ...info });
    };
    loadDeviceInfo();
  }, []);

  return (
    <View>
      {/* Other settings */}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Registration</Text>
        {deviceInfo && (
          <View style={styles.deviceInfo}>
            <Text>Device ID: {deviceInfo.deviceId}</Text>
            <Text>Device Name: {deviceInfo.deviceName}</Text>
            <Text>OS: {deviceInfo.osVersion}</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('PassiveNFCMode')}
              style={styles.button}
            >
              <Text>Open Passive NFC Mode</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};
```

## 2. Integrating with Fruit Machine Setup

### Allow Users to Choose: Active vs Passive Programming

**File:** `screens/FruitMachinePromotionSetupScreen.tsx`

```tsx
import { Alert } from 'react-native';

const handleSavePromotion = async () => {
  // After saving promotion...
  
  Alert.alert(
    'Programming Method',
    'How would you like to program NFC tags?',
    [
      {
        text: 'Program Now (Active)',
        onPress: () => {
          // Navigate to FruitMachineNFCScreen for immediate programming
          navigation.navigate('FruitMachineNFC', {
            promotionId: promotion.id,
            placeId: businessId,
            promotionData: promotion
          });
        },
      },
      {
        text: 'Send to Device (Passive)',
        onPress: () => {
          // Send to registered device via web app
          sendToDevice(promotion);
        },
      },
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
    ]
  );
};

const sendToDevice = async (promotion) => {
  try {
    // Get auth token
    const token = await SecureStore.getItemAsync('authToken');
    const deviceId = await mobileDeviceService.getDeviceId();

    // Device is ready, show instructions
    Alert.alert(
      'Send to Device',
      `Device: ${deviceId}\n\nGo to the web app and:
1. Select this device
2. Enter promotion ID: ${promotion.id}
3. Click "Send to Device"
4. Return here and press "Listening" when ready`,
      [
        {
          text: 'Go to Passive Mode',
          onPress: () => navigation.navigate('PassiveNFCMode'),
        },
        { text: 'Later', style: 'cancel' },
      ]
    );
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

## 3. Integrating with WiFi Programming

**File:** `screens/WiFiCredentialScreen.tsx`

```tsx
const handleSaveWiFi = async () => {
  // After user enters WiFi credentials...
  
  Alert.alert(
    'WiFi Configuration',
    'Would you like to program a tag now or send to another device?',
    [
      {
        text: 'Program Tag Now',
        onPress: () => {
          navigation.navigate('WiFiNFCWrite', { 
            ssid, password, security 
          });
        },
      },
      {
        text: 'Send to Device',
        onPress: () => {
          sendWiFiToDevice({ ssid, password, security });
        },
      },
    ]
  );
};

const sendWiFiToDevice = async (credentials) => {
  try {
    // This would require creating WiFi configuration task
    // Similar to fruit machine flow
    Alert.alert('Success', 'WiFi configuration ready to send from web dashboard');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

## 4. Adding "Send to Device" Button to Dashboard

### In Fruit Machine Dashboard

**File:** `/app/dashboard/fruit-machine/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FruitMachinePage() {
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  return (
    <div>
      {/* Existing stats and tables */}

      {selectedPromotion && (
        <div style={{marginTop: '24px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px'}}>
          <h3>Quick Actions for {selectedPromotion.name}</h3>
          <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
            <Link href="/dashboard/remote-nfc-programming?promotionId=" + selectedPromotion.id>
              <button style={{padding: '10px 16px', backgroundColor: '#007AFF', color: 'white', borderRadius: '6px'}}>
                📡 Send to Device
              </button>
            </Link>
            <button style={{padding: '10px 16px', backgroundColor: '#666', color: 'white', borderRadius: '6px'}}>
              📊 View Tasks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

## 5. Pre-filling Remote Programming Dashboard

When user clicks "Send to Device", pre-populate the form:

**File:** `/app/dashboard/remote-nfc-programming/page.tsx`

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function RemoteNFCProgrammingPage() {
  const searchParams = useSearchParams();
  const promotionId = searchParams.get('promotionId');
  const businessId = searchParams.get('businessId');
  const taskType = searchParams.get('type') || 'write_fruit_machine';

  const [selectedPromotion, setSelectedPromotion] = useState(promotionId || '');
  const [selectedBusiness, setSelectedBusiness] = useState(businessId || '');
  const [selectedTaskType, setSelectedTaskType] = useState(taskType);

  useEffect(() => {
    // If params were provided, show info
    if (promotionId) {
      console.log('Pre-filled with promotion:', promotionId);
    }
  }, [promotionId]);

  // ... rest of component
}
```

### Add pre-fill params in mobile app:

```tsx
const sendToDevice = (promotion, businessId) => {
  const params = new URLSearchParams({
    promotionId: promotion.id,
    businessId: businessId,
    type: 'write_fruit_machine'
  });
  
  // Open web app with pre-filled parameters
  // This would require opening Safari with deep link
  Linking.openURL(`https://yourdomain.com/dashboard/remote-nfc-programming?${params}`);
};
```

## 6. Adding Device Status Display

### Show which devices are available in the app

**File:** `screens/FruitMachineNFCScreen.tsx`

```tsx
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import mobileDeviceService from '../services/mobileDeviceService';

const FruitMachineNFCScreen = ({ navigation, route }) => {
  const [registeredDevices, setRegisteredDevices] = useState([]);

  useEffect(() => {
    checkDeviceRegistration();
  }, []);

  const checkDeviceRegistration = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const devices = await mobileDeviceService.getRegisteredDevices(token);
        setRegisteredDevices(devices);
      }
    } catch (error) {
      console.error('Error checking devices:', error);
    }
  };

  return (
    <View>
      {/* Existing game UI */}

      {registeredDevices.length > 0 && (
        <View style={styles.deviceStatusCard}>
          <Text style={styles.cardTitle}>Passive Mode Active</Text>
          <Text style={styles.cardText}>
            {registeredDevices.filter(d => d.isActive).length} device(s) listening
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('PassiveNFCMode')}>
            <Text style={styles.link}>View Tasks →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
```

## 7. Task Status Integration

### Show active tasks in a banner

**File:** Any screen that might have pending tasks

```tsx
import { useFocusEffect } from '@react-navigation/native';

const MyScreen = () => {
  const [pendingTasks, setPendingTasks] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchPendingTasks();
      const interval = setInterval(fetchPendingTasks, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }, [])
  );

  const fetchPendingTasks = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const deviceId = await mobileDeviceService.getDeviceId();
        const tasks = await mobileDeviceService.fetchPendingTasks(token);
        setPendingTasks(tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  return (
    <View>
      {pendingTasks.length > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            📡 {pendingTasks.length} task(s) waiting
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('PassiveNFCMode')}>
            <Text style={styles.bannerButton}>Go</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
```

## 8. Complete Flow Example

### User Journey: Setup Fruit Machine → Send to Device → Program Tags

```
1. User opens app → Map Screen
   ↓
2. Selects business location
   ↓
3. Navigates to Fruit Machine Setup
   ↓
4. Configures promotion (prizes, budget, probability)
   ↓
5. Clicks "Save & Program"
   ↓
6. Chooses "Send to Device (Passive)"
   ↓
7. App shows device ID and instructions
   ↓
8. User opens web app in browser
   ↓
9. Goes to Remote NFC Programming dashboard
   ↓
10. Device appears in list (registered)
   ↓
11. User selects device
   ↓
12. Enters promotion ID (auto-filled if from link)
   ↓
13. Clicks "Send to Device"
   ↓
14. Task created on server
   ↓
15. User returns to mobile app
   ↓
16. Navigates to Passive NFC Mode
   ↓
17. Sees pending task
   ↓
18. Clicks "Start Listening"
   ↓
19. Brings NFC tag near phone
   ↓
20. App automatically programs tag
   ↓
21. Web dashboard shows real-time progress
   ↓
22. Task completes → "Done"
```

## 9. Database Seed Data

### Create test devices and tasks for development

```prisma
// seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
    },
  });

  // Create test device
  const device = await prisma.mobileDevice.create({
    data: {
      deviceId: 'test-device-uuid',
      userId: user.id,
      deviceName: 'Test iPhone',
      appVersion: '1.0.0',
      osVersion: '17.2',
    },
  });

  // Create test task
  const task = await prisma.nFCProgrammingTask.create({
    data: {
      deviceId: device.id,
      businessId: 'test-business',
      promotionId: 'test-promotion',
      taskType: 'write_fruit_machine',
      nfcData: {
        businessId: 'test-business',
        promotionId: 'test-promotion',
        prizes: ['cash', 'free_spin'],
      },
    },
  });

  console.log('Seeded:', { user, device, task });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with: `npx prisma db seed`

## 10. Error Handling and Fallbacks

### Handle offline scenarios

```tsx
const sendToDeviceWithFallback = async (promotion) => {
  try {
    // Try to get list of devices
    const devices = await mobileDeviceService.getRegisteredDevices(token);
    
    if (devices.length === 0) {
      Alert.alert(
        'No Devices',
        'No devices are registered. Open this app on an iPhone and enable Passive NFC Mode first.',
        [
          {
            text: 'Enable Passive Mode',
            onPress: () => navigation.navigate('PassiveNFCMode'),
          },
          { text: 'Cancel' },
        ]
      );
      return;
    }

    // Proceed with sending
    navigation.navigate('PassiveNFCMode');
  } catch (error) {
    // Fallback: Show local programming option
    Alert.alert(
      'Network Error',
      'Could not reach server. Program tag now instead?',
      [
        {
          text: 'Program Now',
          onPress: () => navigation.navigate('FruitMachineNFC'),
        },
        { text: 'Cancel' },
      ]
    );
  }
};
```

## Testing Integration

1. **Test Device Registration**
   - Open app, log in
   - Check device appears in web dashboard

2. **Test Task Creation**
   - Create task from web dashboard
   - Verify it appears in Passive NFC Mode

3. **Test Complete Flow**
   - Go through full user journey above
   - Verify each step completes

4. **Test Error Cases**
   - Network down → fallback to active mode
   - Device offline → show in dashboard but task remains pending
   - Tag locked → error captured and displayed

---

**Ready to integrate!** Follow these patterns for other tag types (WiFi, Smart Links, etc.)

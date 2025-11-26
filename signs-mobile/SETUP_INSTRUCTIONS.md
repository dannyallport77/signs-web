# Signs Mobile App - Setup Instructions

## Building & Running the App with Native Modules

This app uses native modules (react-native-maps, react-native-nfc-manager) that require a custom development build instead of Expo Go.

## Prerequisites

- **macOS** (for iOS development)
- **Xcode** (latest version from App Store) - for iOS
- **Android Studio** - for Android
- **EAS CLI**: `npm install -g eas-cli`

## Option 1: Local Development Build (Recommended for Testing)

### For iOS (Mac only):

```bash
# Install dependencies
npm install

# Run prebuild to generate native iOS project
npx expo prebuild --platform ios

# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Run on iOS simulator or device
npx expo run:ios
```

### For Android:

```bash
# Install dependencies
npm install

# Run prebuild to generate native Android project
npx expo prebuild --platform android

# Run on Android emulator or device
npx expo run:android
```

## Option 2: EAS Build (Cloud Build Service)

### Initial Setup:

```bash
# Login to Expo account
eas login

# Configure EAS Build
eas build:configure
```

### Build for iOS:

```bash
# Development build for iOS (install on device via QR code)
eas build --profile development --platform ios

# After build completes, scan QR code to install on your device
# Then run:
npx expo start --dev-client
```

### Build for Android:

```bash
# Development build for Android
eas build --profile development --platform android

# After build completes, download and install APK
# Then run:
npx expo start --dev-client
```

## Running After Build

Once you have the development build installed on your device:

```bash
# Start the development server
npx expo start --dev-client

# The app on your device will connect to this server
```

## Environment Configuration

Create a `.env` file in the root directory:

```
```bash
EXPO_PUBLIC_API_URL=https://review-signs.co.uk/api
```
```

Replace `192.168.1.110` with your computer's local IP address (same network as your phone).

## Testing NFC

NFC functionality **only works on physical devices** with NFC hardware:
- **iOS**: iPhone 7 or newer
- **Android**: Device with NFC support

## Troubleshooting

### "Module not found" errors
```bash
npm install
npx expo prebuild --clean
```

### iOS build issues
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android build issues
```bash
cd android
./gradlew clean
cd ..
```

## Quick Start (Fastest Option)

For the fastest way to test on a **physical device**:

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`
4. Build for your platform:
   - iOS: `eas build --profile development --platform ios`
   - Android: `eas build --profile development --platform android`
5. Install the app from the QR code/download link
6. Run: `npx expo start --dev-client`
7. Open the installed app on your device

The build process takes about 10-20 minutes for the first build.

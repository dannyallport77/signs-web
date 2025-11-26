# Physical iPhone Device Setup Guide

## Prerequisites
- Physical iPhone (iPhone 7 or newer for NFC support)
- Apple Developer account (free or paid)
- iPhone connected to Mac via USB cable
- Xcode installed on your Mac

## Step 1: Connect Your iPhone

1. Connect your iPhone to your Mac using a USB cable
2. Unlock your iPhone
3. Trust this computer when prompted on your iPhone
4. On Mac, verify device is connected:
   ```bash
   xcrun xctrace list devices
   ```

## Step 2: Option A - Development Build via EAS (Recommended)

### Build and Install via EAS:

1. **Login to EAS** (if not already logged in):
   ```bash
   cd /Users/admin/Development/signs-app/signs-mobile
   npx eas login
   ```

2. **Register your device** (first time only):
   ```bash
   npx eas device:create
   ```
   - Follow the prompts
   - This will generate a registration URL
   - Open the URL on your iPhone to register it

3. **Build for your device**:
   ```bash
   npx eas build --profile development --platform ios
   ```
   - This builds a development build in the cloud
   - Wait for build to complete (~10-15 minutes)
   - Download and install the .ipa file when ready

4. **Install the build**:
   - EAS will provide instructions to install via TestFlight or direct download
   - OR download the .ipa and use:
   ```bash
   npx eas build:run --profile development --platform ios
   ```

5. **Start the dev server**:
   ```bash
   npx expo start --dev-client
   ```

## Step 3: Option B - Local Development Build (Faster)

### Build locally using Xcode:

1. **Ensure prerequisites are installed**:
   ```bash
   cd /Users/admin/Development/signs-app/signs-mobile
   npx expo install expo-dev-client
   npx pod-install
   ```

2. **Open in Xcode**:
   ```bash
   xed ios
   ```

3. **In Xcode**:
   - Select your iPhone from the device dropdown (top toolbar)
   - Click the Play button or press ⌘R
   - Enter your Apple ID when prompted (free account is fine)
   - Xcode will handle code signing automatically

4. **On your iPhone**:
   - Go to Settings > General > VPN & Device Management
   - Trust your developer certificate
   - Open the Signs NFC Writer app

5. **Start the dev server**:
   ```bash
   npx expo start --dev-client
   ```

## Step 4: Testing NFC Functionality

Once the app is running on your physical device:

1. **Enable NFC on iPhone**:
   - NFC is always on for iPhone XR and newer
   - For iPhone 7-X: Control Center > Enable NFC

2. **Test the app**:
   - Login to the app
   - Search for businesses near you
   - Tap a business from the map or list
   - On the Business Detail screen, tap "Write to NFC Tag"
   - Hold an NFC tag near the top of your iPhone
   - The app should write the Google review URL to the tag

3. **Verify the tag**:
   - After writing, tap the NFC tag with your iPhone
   - It should open the Google review link in Safari

## Troubleshooting

### "Untrusted Developer" Error
- Settings > General > VPN & Device Management > Trust your certificate

### "Unable to Install App"
- Delete any previous versions of the app
- Restart your iPhone
- Try installing again

### NFC Not Working
- Ensure NFC tags are NDEF compatible
- Make sure iPhone is not in a thick case
- Hold the tag near the top of the iPhone (where NFC antenna is)
- Check that NFC permissions are granted in Settings

### Build Fails
- Make sure you're logged into EAS: `npx eas whoami`
- Check that your Apple ID is valid
- Verify your device is registered with Apple

## Current Configuration

- **Bundle ID**: com.anonymous.signs-mobile
- **EAS Project ID**: 6870076a-f22c-4acc-bb44-34f08072d01e
- **API URL**: https://review-signs.co.uk/api
- **NFC Permission**: Configured ✅
- **Location Permission**: Configured ✅

## Quick Reference Commands

```bash
# Check connected devices
xcrun xctrace list devices

# Start development server
npx expo start --dev-client

# Build with EAS
npx eas build --profile development --platform ios

# Install EAS build on connected device
npx eas build:run --profile development --platform ios

# Open in Xcode
xed ios
```

## Next Steps

After successful installation:
1. Test login functionality
2. Test business search and map display
3. Test business detail screen
4. **Test NFC tag writing** (requires physical NFC tags)
5. Verify written tags work by tapping them with iPhone

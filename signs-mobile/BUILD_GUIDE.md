# Signs Mobile App - Build Guide

## Prerequisites

### Apple Developer Account (Required for iOS)

✅ **You are enrolled as an Apple Developer!**

To build and distribute iOS apps, you need an active Apple Developer Program membership ($99/year). You're all set!

**What this gives you:**
- Ability to build apps with EAS Build
- TestFlight distribution for beta testing
- App Store distribution
- Push notifications and other advanced features

---

## Recommended: EAS Build (Cloud Build)

This is the most reliable way to build and test the app with native modules.

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

*Note: You'll need to create a free Expo account if you don't have one at https://expo.dev*

### Step 3: Build for iOS (Development Build)

```bash
cd "/Users/admin/Development/signs app/signs-mobile"
eas build --profile development --platform ios
```

**During the first build, EAS will:**
1. Ask you to log in with your Apple ID (your Apple Developer account)
2. Automatically generate or reuse provisioning profiles and certificates
3. Store credentials securely in Expo's servers
4. Build your app in the cloud (~15-20 minutes)
5. Give you a QR code and download link when done

**To install on your device:**
- Scan the QR code with your iPhone camera
- Or open the link on your iPhone
- Follow the installation prompts

### Step 4: Run the Development Server

Once the app is installed on your device:

```bash
npx expo start --dev-client
```

Then open the installed app on your device - it will connect to your development server.

---

## Alternative: Simplified Testing (No Native Modules)

If you just want to test the basic app flow without Maps/NFC:

### Create a simplified test version:

1. **Temporarily comment out native modules** in `App.tsx`:
   - Comment out MapView import and usage
   - Comment out NFC functionality

2. **Run with Expo Go**:
   ```bash
   npx expo start
   ```
   
3. **Scan QR code** with Expo Go app on your phone

This won't have Maps or NFC, but you can test:
- Login/Auth flow
- Navigation
- API calls
- Business listing (in list view)

---

## Building for Production & App Store

### Step 1: Create a Production Build

```bash
eas build --profile production --platform ios
```

This creates an optimized build for the App Store.

### Step 2: Submit to App Store

```bash
eas submit --platform ios
```

**Or manually:**
1. Download the `.ipa` file from the build
2. Go to [App Store Connect](https://appstoreconnect.apple.com/)
3. Create your app listing
4. Upload the `.ipa` using Transporter app or Xcode

### Step 3: TestFlight (Beta Testing)

After submission, your app will automatically appear in TestFlight:
1. Go to App Store Connect
2. Select your app → TestFlight
3. Add internal or external testers
4. Share the TestFlight link with testers

---

## For Production Builds

### iOS App Store:

```bash
eas build --profile production --platform ios
eas submit --platform ios
```

### Android Play Store:

```bash
eas build --profile production --platform android
eas submit --platform android
```

---

## Troubleshooting

### "Build failed" on EAS:
- Check build logs in the Expo dashboard
- Ensure all environment variables are set
- Verify app.json configuration

### "Can't connect to development server":
- Ensure phone and computer are on same WiFi
- Check firewall settings
- Try using tunnel: `npx expo start --dev-client --tunnel`

### NFC not working:
- NFC only works on physical devices (iPhone 7+ or Android with NFC)
- Ensure proper permissions in app.json
- Check device NFC is enabled in Settings

---

## Quick Start (Recommended Path)

```bash
# 1. Install EAS CLI (if not already installed)
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Navigate to project
cd "/Users/admin/Development/signs app/signs-mobile"

# 4. Build for iOS (development build)
eas build --profile development --platform ios

# 5. Wait for build (~15-20 min)
#    - You'll be prompted to log in with your Apple Developer account
#    - EAS will handle all certificates and provisioning automatically
#    - Install app on device via QR code when complete

# 6. Start development server
npx expo start --dev-client

# 7. Open the installed app on your device
#    - It will connect to your dev server automatically
```

**Your app is configured with:**
- Bundle ID: `com.dannyallport.signsnfc`
- App Name: Signs NFC Writer
- NFC capabilities enabled
- Google Maps integration

This is the fastest path to a working app with all native features! 🚀

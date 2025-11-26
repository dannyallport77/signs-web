# Quick Guide: Install on iPhone (FREE - No Paid Developer Account)

## 🎯 Fast Track: Build & Install via Xcode

### Step 1: Connect Your iPhone
1. Connect your iPhone to Mac via USB cable
2. Unlock your iPhone
3. Tap "Trust" when prompted on iPhone
4. Keep it connected

### Step 2: Prepare the Project

Run these commands:

```bash
cd /Users/admin/Development/signs-app/signs-mobile

# Install iOS dependencies
npx pod-install
```

### Step 3: Open in Xcode

```bash
# Open the iOS project in Xcode
open ios/SignsNFCWriter.xcworkspace
```

**OR** if that doesn't work:
```bash
xed ios
```

### Step 4: Configure in Xcode

1. **In Xcode, select your project** (SignsNFCWriter in the left sidebar)

2. **Select the target** "SignsNFCWriter" (under TARGETS)

3. **Signing & Capabilities tab**:
   - Uncheck "Automatically manage signing" (if checked)
   - Then check it again
   - Select your Apple ID in "Team" dropdown
   - If you don't see your Apple ID:
     - Click "Add Account..."
     - Sign in with your personal Apple ID (free account is fine!)
   
4. **Select your iPhone** from the device dropdown at the top (next to the play/stop buttons)

### Step 5: Build and Run

1. Click the **Play button** (▶) at the top left, or press **⌘R**
2. Xcode will build and install the app on your iPhone
3. First time: You'll need to trust the developer certificate on your iPhone:
   - Go to **Settings > General > VPN & Device Management**
   - Tap your email address
   - Tap **Trust "[your email]"**
   - Tap **Trust** again

### Step 6: Start the Dev Server

Once the app is installed and running on your iPhone:

```bash
cd /Users/admin/Development/signs-app/signs-mobile
npx expo start --dev-client
```

The app will automatically connect to your dev server and you can start testing!

## 🧪 Testing NFC

1. Open the app on your iPhone
2. Login with your credentials
3. Search for nearby businesses
4. Tap a business to view details
5. Tap "Write to NFC Tag"
6. Hold an NFC tag near the **top** of your iPhone
7. The app will write the Google review URL to the tag
8. Test the tag by tapping it with your iPhone - it should open Safari with the review link!

## ⚡ Quick Commands Reference

```bash
# Install iOS dependencies
npx pod-install

# Open in Xcode
xed ios

# Start dev server (after app is installed)
npx expo start --dev-client

# Rebuild if needed
cd ios && xcodebuild clean && cd ..
```

## 🐛 Troubleshooting

### Build Error: "No Team Found"
- Add your Apple ID in Xcode Preferences > Accounts
- Then select it in Signing & Capabilities

### "Untrusted Developer"
- Settings > General > VPN & Device Management > Trust your certificate

### App Crashes on Launch
- Make sure dev server is running: `npx expo start --dev-client`
- Check the Metro bundler terminal for errors

### NFC Not Working
- Ensure you're using NDEF-compatible NFC tags
- Hold the tag near the **top edge** of the iPhone (where NFC antenna is)
- Remove thick phone cases
- Make sure NFC permissions are granted in Settings

### Device Not Showing in Xcode
- Unplug and replug USB cable
- Restart Xcode
- Check "Trust This Computer" on iPhone

## ✅ What's Already Configured

- ✅ NFC permissions in Info.plist
- ✅ Location permissions configured
- ✅ Google Maps API key set
- ✅ Bundle ID: com.anonymous.signs-mobile
- ✅ Development client enabled
- ✅ API URL: Production backend at https://review-signs.co.uk/api

You're all set! Just open in Xcode and hit play! 🚀

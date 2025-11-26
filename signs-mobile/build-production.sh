#!/bin/bash
# Production build script for Signs NFC Writer

cd /Users/admin/Development/signs-app/signs-mobile

echo "Starting production iOS build for TestFlight..."
echo ""
echo "This will:"
echo "  1. Build optimized production version"
echo "  2. Use existing Apple Developer credentials"
echo "  3. Upload to EAS Build servers"
echo "  4. Generate .ipa for TestFlight/App Store"
echo ""

# Run EAS build with auto-responses
# n = Don't login to Apple (use existing credentials)
printf "n\n" | eas build --profile production --platform ios

echo ""
echo "Build started! Monitor progress at: https://expo.dev/accounts/dannyallport77/projects/signs-mobile/builds"

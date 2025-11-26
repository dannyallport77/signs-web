# Changelog

All notable changes to the Review Signs NFC Programmer app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-12

### Initial Release - Submitted to App Store

#### Added
- **NFC Tag Writing**: Core functionality to write business review links to NFC tags
- **Google Maps Integration**: 
  - Search for businesses by name or location
  - View nearby businesses on interactive map
  - Real-time location services
- **Business Details Screen**:
  - Display business name, address, and contact information
  - Show operating hours
  - Display review ratings and counts
  - Phone numbers and website links
- **User Authentication**:
  - Secure login system with role-based access
  - Manager and sales staff user roles
  - Email and password authentication
  - Session management
- **iOS Features**:
  - NFC reader session support
  - Location permissions handling
  - Native iOS UI components

#### Technical
- Built with React Native and Expo SDK 54
- New React Native Architecture enabled
- TypeScript for type safety
- Integration with react-native-nfc-manager
- Google Maps API integration via expo-location

#### Fixed
- NFC entitlements configuration for iOS compatibility
  - Removed NDEF format to comply with Apple's requirements
  - Kept TAG format for NFC tag writing functionality

#### App Store
- **Status**: Submitted for review
- **Submitted**: November 12, 2025
- **App ID**: 6755160639
- **Bundle ID**: com.dannyallport.signsnfc
- **Version**: 1.0.0
- **Build Number**: 1

---

## [Unreleased]

### Planned Features
- Android version support
- Bulk NFC tag writing
- Tag writing history
- Offline mode support
- Custom review link templates
- Analytics dashboard
- Multi-language support

### Future Improvements
- Enhanced error handling
- Improved loading states
- Better offline experience
- Performance optimizations
- Accessibility improvements

---

## Release Notes Template (for future versions)

### [Version Number] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes to existing functionality

#### Deprecated
- Features that will be removed in upcoming releases

#### Removed
- Features that have been removed

#### Fixed
- Bug fixes

#### Security
- Security updates and patches

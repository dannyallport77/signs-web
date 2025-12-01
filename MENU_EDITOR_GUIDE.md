# Menu Editor & Analytics Dashboard

## Overview
The dashboard now includes a comprehensive menu editor and analytics system that allows you to manage individual review menus and track user engagement.

## Features

### 1. Menu Editor (`/dashboard/review-menus/[slug]`)
A full-featured editor for managing review menus with the following capabilities:

#### Business Information
- **Business Name** - Required
- **Address** - Optional location information
- **Place ID** - Google Place ID for reference
- **Logo URL** - Custom business logo

#### Hero Section
- **Title** - Main heading (default: "Leave a review")
- **Subtitle** - Secondary message

#### WiFi Access (Optional)
- **WiFi SSID** - Network name to display
- **WiFi Password** - Connection password
- **Security Type** - WPA/WPA2, WEP, or Open

#### Promotion (Optional)
- **Promotion ID** - Reference for promotions (e.g., "promo-summer-2024")

#### Review Platforms
Full control over platform configuration:
- Enable/disable platforms
- Customize display names
- Update URLs anytime (without changing NFC tags)
- Reorder as needed

### 2. Analytics Dashboard (`/dashboard/review-menus/[slug]/analytics`)
Real-time tracking and engagement metrics:

#### Key Metrics
- **Total Clicks** - All platform link clicks tracked
- **Platforms Tracked** - Number of active review platforms
- **Reviews Submitted** - Count of completed reviews

#### Platform Performance Table
- Click counts per platform
- Review submissions per platform
- Conversion rates with visual progress bars

#### Recent Activity Log
- Timestamp of each click
- User agent information
- IP address tracking
- Review submission status

### 3. Main Menu List
Updated menu listing with quick actions:
- **Edit Button** - Opens the menu editor
- **View Menu Button** - Opens the live menu
- Shows platforms, creation date, and platform count

## How to Use

### Editing a Menu
1. Go to `/dashboard/review-menus`
2. Click **Edit** on any menu
3. Modify any settings:
   - Change platform URLs
   - Add/remove platforms
   - Update WiFi credentials
   - Add/modify promotions
4. Click **Save Changes**
5. Changes are applied immediately

### Viewing Analytics
1. From the menu editor, click **View Analytics**
2. See real-time engagement metrics
3. Track which platforms get the most traffic
4. Monitor review submission rates

## Key Benefits

✅ **Easy Management** - Update menus without changing NFC tags
✅ **Live Changes** - Modifications apply immediately
✅ **Full Visibility** - See exactly how users engage with your menus
✅ **Platform Flexibility** - Add, remove, or modify review platforms anytime
✅ **Conversion Tracking** - Monitor which platforms drive actual reviews
✅ **Per-User Setup** - Each business has their own dedicated menu editor

## API Endpoints Used

- `GET /api/review-menus/[slug]` - Fetch menu details
- `PATCH /api/review-menus/[slug]` - Update menu
- `GET /api/review-menu/[slug]/platform/[platformId]/track` - Get analytics
- `POST /api/review-menu/[slug]/platform/[platformId]/track` - Log click

## Notes

- All URLs are tracked through the splash screen
- User engagement data includes IP, user agent, and referrer
- WiFi and promotion fields are optional
- At least one platform must be enabled
- Changes save instantly without page reload confirmation

# Quick Start: Remote NFC Programming

## Setup Steps

### 1. Mobile App - First Time Setup

When users open the app and log in:
- Device is automatically registered with backend
- Device ID is generated and stored locally
- Device name, OS version, and app version are sent to web app

### 2. Enable Passive NFC Mode

Users can access Passive NFC Mode from:
- Home menu (add link to PassiveNFCModeScreen in NFCActionScreen or main navigation)
- The screen will show:
  - List of pending programming tasks
  - Current listening status (green = listening, gray = idle)
  - Device registration status
  - Real-time task updates every 5 seconds

### 3. Web App - Send Programming Task

Navigate to: **Dashboard → Remote NFC Programming**

Steps:
1. **Select Device** - Choose from list of registered devices (shows last seen time, OS version)
2. **Configure Task:**
   - Task Type: Select from dropdown (Fruit Machine, WiFi, Smart Link)
   - Business ID: Enter the business ID
   - Promotion/Config: Enter promotion ID or other configuration
3. **Send to Device** - Click button to send task
4. **Monitor Progress** - View real-time updates in **Dashboard → NFC Tasks Monitor**

### 4. Monitor Tasks

Navigate to: **Dashboard → NFC Tasks**

View:
- All tasks with real-time status
- Statistics (total, pending, completed, failed)
- Timeline of events (created, acknowledged, completed)
- Device information for each task
- Error logs if programming failed
- Attempt counts

## How It Works Behind the Scenes

```
┌─────────────────────────────────────────────────────┐
│ 1. Mobile Device Running                             │
│    Passive NFC Mode Screen                          │
│    - Polls every 5 seconds                          │
│    - Listens for NFC tags                           │
└──────────────┬──────────────────────────────────────┘
               │
               ├─ GET /api/mobile-devices/{deviceId}/tasks
               │  (Fetch pending tasks)
               │
┌──────────────┼──────────────────────────────────────┐
│ 2. Web App Server                                    │
│    - Stores tasks in database                       │
│    - Returns pending tasks to mobile                │
│    - Tracks task status                             │
└──────────────┬──────────────────────────────────────┘
               │
        NFC Tag Detected
               │
               └─ PATCH /api/mobile-devices/{deviceId}/tasks
                  (Update: pending → acknowledged → writing → completed)
```

## Database Schema Overview

**MobileDevice** - Represents a registered iPhone
- Unique device ID
- Device name (iPhone 14 Pro, etc)
- OS version
- Active status
- Last heartbeat timestamp

**NFCProgrammingTask** - Represents a programming job
- Device to program
- Business and promotion context
- Task type (fruit machine, WiFi, etc)
- NFC data to write
- Current status (pending/acknowledged/writing/completed/failed)
- Timestamps for each status change

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mobile-devices/register` | POST | Register/update device |
| `/api/mobile-devices` | GET | List user's devices |
| `/api/mobile-devices/{id}/tasks` | GET | Poll for pending tasks |
| `/api/mobile-devices/{id}/tasks` | PATCH | Update task status |
| `/api/nfc-tasks` | POST | Create new task |
| `/api/nfc-tasks` | GET | List all tasks |

## Next Steps

1. **Add menu link to Passive NFC Mode**
   - Edit `screens/NFCActionScreen.tsx` or home menu
   - Add button: `onPress={() => navigation.navigate('PassiveNFCMode')}`

2. **Implement actual NFC tag writing** 
   - In `PassiveNFCModeScreen.tsx`, implement:
     - `writeFruitMachineData()` - Write fruit machine NDEF record
     - `writeWifiData()` - Write WiFi credentials NDEF record
     - `writeSmartLinkData()` - Write URL NDEF record
   - These are currently stubs returning `true`

3. **Add device heartbeat mechanism**
   - Periodically send heartbeat to keep device active
   - Can implement in useEffect of PassiveNFCModeScreen
   - Or in a background task service

4. **Add integration to tag programming flows**
   - When user programs a tag in FruitMachineNFCScreen, offer option to:
     - "Program Now" (active mode) or
     - "Send to Device" (passive mode)
   - Same for WiFi credentials, smart links, etc.

5. **Add offline support**
   - Queue tasks locally if offline
   - Sync when back online
   - Use AsyncStorage to persist queue

## Testing Checklist

- [ ] Register device by logging into mobile app
- [ ] Device appears in web dashboard
- [ ] Device status shows "Active" with recent timestamp
- [ ] Create programming task in web dashboard
- [ ] Task appears in Passive NFC Mode on mobile
- [ ] Mobile starts listening for tags
- [ ] Programming task completes successfully
- [ ] Task status updates to "completed" in web dashboard
- [ ] Task timeline shows all status changes with timestamps
- [ ] Test with different task types (fruit machine, WiFi)
- [ ] Test error handling (remove tag during write)
- [ ] Auto-refresh in dashboard shows real-time updates

## Troubleshooting

**Device not appearing in web dashboard:**
- Ensure user is logged in on mobile app
- Check that device registration API response is successful
- Verify device ID is being stored in AsyncStorage
- Check network connectivity

**Tasks not appearing on mobile:**
- Verify API token is being sent with requests
- Check that device ID matches between registration and polling
- Ensure Passive NFC Mode screen is actively polling
- Check server logs for API errors

**NFC tag not being written:**
- Verify NFC is enabled on device
- Ensure NFC listener is started (green status indicator)
- Check task type is supported by mobile implementation
- Verify NFC data format is correct for tag type

**Task stuck in "acknowledged" state:**
- Check mobile logs for NFC writing errors
- Verify tag is compatible and not locked
- Check if tag has sufficient capacity for data
- Review error message in task details on dashboard

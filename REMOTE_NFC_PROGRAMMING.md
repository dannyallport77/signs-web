# Remote NFC Programming System

## Overview

The Remote NFC Programming system allows business users to configure tags/promotions in the web app and have their mobile devices program NFC tags without needing physical access to the web app or network connectivity at the tag location.

This is achieved through a **device registration** and **passive NFC mode** system where:

1. Mobile devices register themselves when users are logged in
2. Devices enter "Passive Mode" and listen for incoming programming tasks
3. Web app sends NFC programming data to selected devices
4. Mobile device automatically programs the next NFC tag it detects
5. Status is tracked in real-time on the web dashboard

## Architecture

### Components

#### Mobile App (React Native/Expo)

**1. Device Registration Service** (`services/mobileDeviceService.ts`)
- Generates unique device ID on first app launch (stored in AsyncStorage)
- Registers device with web backend including device name, OS version, app version
- Handles periodic heartbeats to keep device active
- Manages auth token storage and retrieval

**2. Passive NFC Mode Screen** (`screens/PassiveNFCModeScreen.tsx`)
- Displays list of pending NFC programming tasks
- Shows current device status (listening/idle)
- Polls server every 5 seconds for pending tasks
- Automatically starts NFC listener when tasks are available
- Handles NFC tag detection and writes data to tags
- Updates task status on server (acknowledged → writing → completed/failed)
- Displays task details and error information

**3. Task Handler**
- Supports multiple task types: fruit machine, WiFi credentials, smart links
- Converts JSON task data to appropriate NDEF format for tags
- Retries failed tasks with exponential backoff
- Logs all programming attempts

#### Web App (Next.js)

**1. Device Management API** (`/api/mobile-devices/`)
- `POST /api/mobile-devices/register` - Register/update mobile device
- `GET /api/mobile-devices` - List user's registered devices
- `GET /api/mobile-devices/[deviceId]/tasks` - Poll for pending tasks
- `PATCH /api/mobile-devices/[deviceId]/tasks/[taskId]` - Update task status

**2. Task Creation API** (`/api/nfc-tasks/`)
- `POST /api/nfc-tasks` - Create new programming task for device
- `GET /api/nfc-tasks` - List tasks with filtering by status

**3. Remote Programming Dashboard** (`/app/dashboard/remote-nfc-programming/`)
- Lists all registered devices with status
- Device selection interface
- Task configuration UI (task type, business, promotion)
- Sends task to selected device
- Real-time device activity

**4. Task Monitor Dashboard** (`/app/dashboard/nfc-tasks/`)
- Real-time task status tracking
- Statistics (total, pending, completed, failed)
- Filter by task status
- Timeline of task events (created, acknowledged, completed)
- Error tracking and retry information

#### Database Models

**MobileDevice**
```prisma
model MobileDevice {
  id            String
  deviceId      String   @unique    // UUID from mobile
  userId        String
  deviceName    String              // iPhone 14 Pro
  appVersion    String
  osVersion     String
  isActive      Boolean
  lastHeartbeat DateTime
  createdAt     DateTime
  updatedAt     DateTime
  
  nfcTasks      NFCProgrammingTask[]
}
```

**NFCProgrammingTask**
```prisma
model NFCProgrammingTask {
  id          String
  deviceId    String
  businessId  String
  promotionId String?
  
  taskType    String   // "write_fruit_machine", "write_wifi", etc
  nfcData     Json     // Raw NFC data to write
  
  status      String   // pending → acknowledged → writing → completed/failed
  attemptCount Int
  lastError   String?
  
  createdAt       DateTime
  acknowledgedAt  DateTime?
  completedAt     DateTime?
}
```

## Data Flow

### 1. Device Registration

```
Mobile App (on login)
    ↓
Calls: mobileDeviceService.registerDevice(token)
    ↓
POST /api/mobile-devices/register
    {
      deviceId: "uuid-xxx",
      deviceName: "iPhone 14 Pro",
      appVersion: "1.0.0",
      osVersion: "17.2"
    }
    ↓
Web App stores in database
    ↓
Returns device record to mobile
    ↓
Mobile app polls server every 5 seconds for tasks
```

### 2. Sending NFC Programming Task

```
User in Web App
    ↓
Selects device from list
    ↓
Configures task:
  - Task type (fruit machine, WiFi, etc)
  - Business ID
  - Promotion details
    ↓
Clicks "Send to Device"
    ↓
POST /api/nfc-tasks
    {
      deviceId: "selected-device",
      businessId: "biz-123",
      promotionId: "promo-456",
      taskType: "write_fruit_machine",
      nfcData: { ... }
    }
    ↓
Creates NFCProgrammingTask in database
    ↓
Returns success to web app
    ↓
Web app shows confirmation
```

### 3. Mobile Device Processing Task

```
PassiveNFCModeScreen (running)
    ↓
Every 5 seconds: calls mobileDeviceService.fetchPendingTasks()
    ↓
GET /api/mobile-devices/[deviceId]/tasks
    ↓
Server returns pending tasks
    ↓
If tasks found → Start NFC listener
    ↓
User brings NFC tag near phone
    ↓
NFC listener detects tag
    ↓
Gets first pending task
    ↓
Calls: updateTaskStatus(task.id, "acknowledged")
    ↓
PATCH /api/mobile-devices/[deviceId]/tasks?taskId=xxx
    {status: "acknowledged"}
    ↓
Begins writing data to NFC tag
    ↓
Updates task status: "writing"
    ↓
Successfully written
    ↓
Updates task status: "completed"
    ↓
OR on error → updates status: "failed", logs error
    ↓
Removes task from pending list
    ↓
Continues listening for next task
```

### 4. Real-time Monitoring

```
Web Dashboard (/dashboard/nfc-tasks/)
    ↓
Auto-refresh every 3 seconds
    ↓
Fetches: GET /api/nfc-tasks?status=all
    ↓
Displays all tasks with status
    ↓
Updates in real-time as mobile completes tasks
    ↓
Shows completion timeline
```

## Task Types

### write_fruit_machine
- Programs a fruit machine promotion configuration
- Data includes: businessId, promotionId, win probability, prize types
- Mobile app writes to NFC tag using NDEF format
- Tag can be scanned in fruit machine NFC screen to start game

### write_wifi
- Programs WiFi credentials
- Data includes: SSID, password, security type
- Mobile app writes WiFi NDEF record to tag
- Tag can be scanned to auto-connect to WiFi

### write_smart_link
- Programs a smart link/URL
- Data includes: URL, metadata
- Mobile app writes URL NDEF record to tag
- Tag can be scanned to open link

## Status Transitions

```
pending
    ↓ (phone receives task)
acknowledged
    ↓ (phone starts writing)
writing
    ↓ (success)
completed
    ↓
[task complete]

        or (on error)
    ↓
failed
    ↓
[can retry - count increments]
```

## API Reference

### Device Registration

```bash
POST /api/mobile-devices/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceId": "uuid-xxx",
  "deviceName": "iPhone 14 Pro",
  "appVersion": "1.0.0",
  "osVersion": "17.2"
}

Response:
{
  "success": true,
  "device": {
    "id": "device-id",
    "deviceId": "uuid-xxx",
    "deviceName": "iPhone 14 Pro",
    "isActive": true,
    "lastHeartbeat": "2025-01-15T10:30:00Z"
  },
  "message": "Device registered successfully"
}
```

### Fetch Devices

```bash
GET /api/mobile-devices
Authorization: Bearer {token}

Response:
{
  "devices": [
    {
      "id": "device-1",
      "deviceId": "uuid-xxx",
      "deviceName": "iPhone 14 Pro",
      "isActive": true,
      "lastHeartbeat": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Poll for Tasks

```bash
GET /api/mobile-devices/{deviceId}/tasks
Authorization: Bearer {token}

Response:
{
  "tasks": [
    {
      "id": "task-1",
      "taskType": "write_fruit_machine",
      "businessId": "biz-123",
      "promotionId": "promo-456",
      "nfcData": { ... },
      "status": "pending"
    }
  ]
}
```

### Update Task Status

```bash
PATCH /api/mobile-devices/{deviceId}/tasks?taskId={taskId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "acknowledged",
  "lastError": null
}

Response:
{
  "task": {
    "id": "task-1",
    "status": "acknowledged",
    "acknowledgedAt": "2025-01-15T10:31:00Z"
  }
}
```

### Create NFC Task

```bash
POST /api/nfc-tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceId": "device-id",
  "businessId": "biz-123",
  "promotionId": "promo-456",
  "taskType": "write_fruit_machine",
  "nfcData": {
    "type": "FRUIT_MACHINE",
    "businessId": "biz-123",
    "promotionId": "promo-456",
    "actionUrl": "/api/fruit-machine/nfc?promo=promo-456"
  }
}

Response:
{
  "success": true,
  "task": {
    "id": "task-1",
    "deviceId": "device-id",
    "taskType": "write_fruit_machine",
    "status": "pending",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### List Tasks

```bash
GET /api/nfc-tasks?status=pending
Authorization: Bearer {token}

Response:
{
  "tasks": [
    {
      "id": "task-1",
      "deviceId": "device-id",
      "businessId": "biz-123",
      "taskType": "write_fruit_machine",
      "status": "pending",
      "attemptCount": 0,
      "createdAt": "2025-01-15T10:30:00Z",
      "device": {
        "deviceName": "iPhone 14 Pro",
        "osVersion": "17.2"
      }
    }
  ]
}
```

## Implementation Checklist

- [x] Database schema (Prisma models)
- [x] Device registration API endpoints
- [x] Task management API endpoints
- [x] Mobile device service (registration, polling, status updates)
- [x] Passive NFC Mode screen with task polling
- [x] Remote NFC Programming dashboard (device selector, task creation)
- [x] Task monitoring dashboard (real-time tracking)
- [ ] NFC tag writing implementation (task-specific handlers)
- [ ] Error handling and retry logic
- [ ] Device heartbeat mechanism for tracking activity
- [ ] Offline mode fallback (queue tasks locally)
- [ ] Admin tools for managing devices and tasks

## Security Considerations

1. **Authentication**: All endpoints require valid auth token
2. **Authorization**: Users can only see/manage their own devices
3. **Device Verification**: Device ID must match the requesting device
4. **Task Isolation**: Tasks can only be sent to user's own devices
5. **Data Encryption**: Consider encrypting NFC data in transit
6. **Rate Limiting**: Implement rate limits on task polling to prevent abuse

## Future Enhancements

1. **WebSocket Support**: Real-time task updates instead of polling
2. **Batch Programming**: Queue multiple tasks for sequential programming
3. **Template Library**: Save common task configurations as templates
4. **Offline Queue**: Queue tasks locally if device goes offline
5. **Detailed Analytics**: Track programming success rates by task type/business
6. **Device Management**: Remote lock/unlock devices, force updates
7. **Task Notifications**: Push notifications when tasks are assigned/completed
8. **Selective Device Groups**: Organize devices by location/business
9. **Task Scheduling**: Schedule tasks for future programming
10. **Audit Logging**: Track all programming events with timestamps and user info

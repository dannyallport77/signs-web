# Sales Tracking & Analytics Feature Specification

## Overview
Comprehensive sales tracking system for NFC sign programming with inventory management, transaction recording, and admin analytics dashboard.

## Database Schema

### 1. sign_types Table
```sql
CREATE TABLE sign_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  default_price DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. sign_transactions Table
```sql
CREATE TABLE sign_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  sign_type_id UUID REFERENCES sign_types(id),
  business_name VARCHAR(255),
  business_address TEXT,
  place_id VARCHAR(255),
  review_url TEXT,
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'erased'
  sale_price DECIMAL(10, 2),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  notes TEXT,
  programmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  erased_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. user_inventory Table
```sql
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  sign_type_id UUID REFERENCES sign_types(id),
  quantity_programmed INT DEFAULT 0,
  quantity_sold INT DEFAULT 0,
  quantity_failed INT DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, sign_type_id)
);
```

## User Flow

### NFC Programming Flow (Updated)

1. **Before Writing**:
   - User selects business from map
   - **NEW**: Modal appears asking "Select Sign Type"
   - Display list of available sign types with descriptions
   - User selects sign type
   - User initiates NFC write

2. **During Writing**:
   - Hold phone near NFC tag
   - Write review URL to tag
   - Record transaction as 'pending'

3. **After Successful Write**:
   - **NEW**: Prompt "Enter Sale Price"
   - Input field for sale price (pre-filled with default for that sign type)
   - **NEW**: Optional notes field
   - Submit to record as 'success'
   - Update user inventory (+1 sold, + revenue)

4. **If Sale Failed**:
   - User can mark as "Failed Sale"
   - Transaction marked as 'failed'
   - Sign can be erased to clear inventory

### NFC Erase Flow (NEW)

1. **Initiate Erase**:
   - User navigates to "Erase Tag" option
   - **NEW**: Select sign type being erased
   - Confirmation dialog

2. **Erase Process**:
   - Hold phone near NFC tag
   - Write empty/null NDEF message
   - Find matching transaction and mark as 'erased'
   - Update inventory (-1 from programmed)

## Mobile App Components

### 1. Sign Type Selection Screen
**Location**: New modal/screen before NFC write

**UI Elements**:
- List of sign types (FlatList)
- Each item shows:
  - Sign type name
  - Description
  - Default price
  - Icon/image (optional)
- Search/filter functionality
- "Add New Type" button (admin only)

### 2. Sale Price Input Modal
**Trigger**: After successful NFC write

**UI Elements**:
- "Sale Recorded! 🎉" header
- Sign type badge
- Business name
- Price input field (numeric keyboard)
- Pre-filled with default price
- Optional notes textarea
- "Record Sale" button
- "Mark as Failed" button (secondary)

### 3. Erase Tag Screen
**Location**: New screen or option in BusinessDetail

**UI Elements**:
- "Erase NFC Tag" header
- Sign type dropdown
- Warning message
- "Erase Tag" button
- Confirmation dialog

### 4. Admin Dashboard Screen (NEW)
**Location**: New tab/screen for admin users

**Sections**:

#### A. Overview Cards
- Total Sales (count + revenue)
- Failed Sales count
- Active Users count
- Today's Performance

#### B. Charts (Recharts/Victory Native)
1. **Sales Trend**: Line chart showing sales over time (7/30/90 days)
2. **Sign Popularity**: Bar chart of sign types by quantity sold
3. **Revenue by Sign Type**: Pie/Donut chart
4. **User Performance**: Horizontal bar chart of top sellers

#### C. Tables
1. **Recent Transactions**: Last 20 transactions with filters
2. **User Stats**: Table of all users with their metrics
3. **Inventory Status**: Current inventory by sign type

#### D. Filters
- Date range picker
- User filter
- Sign type filter
- Status filter (success/failed/erased)

## API Endpoints

### Sign Types
```
GET    /api/sign-types              - List all active sign types
POST   /api/sign-types              - Create new sign type (admin)
PUT    /api/sign-types/:id          - Update sign type (admin)
DELETE /api/sign-types/:id          - Deactivate sign type (admin)
```

### Transactions
```
POST   /api/transactions            - Record new transaction
PUT    /api/transactions/:id        - Update transaction (mark failed/success)
GET    /api/transactions            - List transactions (with filters)
GET    /api/transactions/stats      - Get transaction statistics
```

### Inventory
```
GET    /api/inventory/user/:userId  - Get user inventory
GET    /api/inventory/all           - Get all inventory (admin)
```

### Analytics
```
GET    /api/analytics/dashboard     - Get dashboard data
GET    /api/analytics/sales-trend   - Sales trend data
GET    /api/analytics/sign-popularity - Sign type popularity
GET    /api/analytics/user-performance - User performance metrics
```

## Mobile App File Structure

```
screens/
├── SignTypeSelectionScreen.tsx      # Select sign type before write
├── SalePriceInputScreen.tsx         # Record sale price modal
├── EraseTagScreen.tsx               # Erase NFC tag functionality
├── AdminDashboardScreen.tsx         # Admin analytics dashboard
└── InventoryScreen.tsx              # User's personal inventory view

components/
├── SignTypeCard.tsx                 # Sign type display component
├── SalesChart.tsx                   # Reusable chart component
├── TransactionList.tsx              # Transaction history list
├── StatsCard.tsx                    # Dashboard stat card
└── RevenueMetrics.tsx               # Revenue display component

services/
├── signTypeService.ts               # Sign type API calls
├── transactionService.ts            # Transaction API calls
├── analyticsService.ts              # Analytics API calls
└── inventoryService.ts              # Inventory API calls

types/
└── index.ts                         # TypeScript interfaces
    ├── SignType
    ├── Transaction
    ├── Inventory
    └── Analytics
```

## Dependencies to Install

```bash
npm install react-native-chart-kit
npm install react-native-svg
npm install @react-native-picker/picker
npm install react-native-modal
npm install date-fns
```

## Implementation Phases

### Phase 1: Database & Backend (Week 1)
- Create database schema
- Build API endpoints
- Add authentication middleware
- Write tests

### Phase 2: Sign Type Management (Week 1-2)
- Build sign type selection UI
- Integrate with NFC write flow
- Add admin management screen

### Phase 3: Transaction Recording (Week 2)
- Implement sale price input
- Update NFC write to record transactions
- Build erase functionality

### Phase 4: Analytics Dashboard (Week 3)
- Create dashboard UI
- Implement charts
- Add filtering and date ranges
- User performance metrics

### Phase 5: Testing & Polish (Week 4)
- End-to-end testing
- Performance optimization
- UI/UX refinements
- Documentation

## Success Metrics

### For Users
- Track daily/weekly/monthly sales
- See commission/revenue earned
- Identify best-selling sign types
- Monitor inventory levels

### For Admins
- Monitor overall sales performance
- Identify top performers
- Optimize inventory based on popularity
- Data-driven marketing decisions
- Track failed sales for training opportunities

## Future Enhancements (v2.0)

- Offline mode with sync
- Photo upload for installed signs
- Customer feedback collection
- Automated reports (email/PDF)
- Goal setting and achievements
- Commission calculation
- Bulk operations
- CSV export functionality
- Push notifications for milestones

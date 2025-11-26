# Integration Instructions for BusinessDetailScreen

## Current Status

The following components are complete and ready:
- ✅ SignTypeSelectionScreen
- ✅ SalePriceInputModal
- ✅ EraseTagScreen
- ✅ Transaction services
- ✅ Sign type services
- ✅ Analytics services

## Integration Steps for BusinessDetailScreen

### Step 1: Add Import Statements
Add these imports to the top of BusinessDetailScreen.tsx:

```typescript
import SalePriceInputModal from '../components/SalePriceInputModal';
import { SignType, Transaction } from '../types';
import { transactionService } from '../services/transactionService';
```

### Step 2: Add State Variables
Add these state variables after the existing ones:

```typescript
const [showSalePriceModal, setShowSalePriceModal] = useState(false);
const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
const [signType, setSignType] = useState<SignType | null>(route.params.selectedSignType || null);
```

### Step 3: Add useEffect for Sign Type Selection
Add this useEffect to redirect to sign type selection if no type is selected:

```typescript
useEffect(() => {
  if (!signType) {
    navigation.navigate('SignTypeSelection', {
      business,
      onSelectSignType: (type: SignType) => setSignType(type)
    });
  }
}, []);
```

### Step 4: Modify writeNFC Function
Replace the existing success alert with transaction creation and modal display:

After successful NFC write, replace the existing alert with:

```typescript
// Create pending transaction
const transaction = await transactionService.create({
  signTypeId: signType!.id,
  businessName: business.name,
  businessAddress: business.address,
  placeId: business.placeId,
  reviewUrl: business.reviewUrl,
  locationLat: business.location.lat,
  locationLng: business.location.lng,
  status: 'pending',
  userId: userData?.id
});

setCurrentTransaction(transaction);
setShowSalePriceModal(true);
```

### Step 5: Add Sale Confirmation Handler

```typescript
const handleConfirmSale = async (salePrice: number, notes: string) => {
  if (!currentTransaction) return;
  
  await transactionService.markAsSuccess(currentTransaction.id, salePrice, notes);
  setShowSalePriceModal(false);
  Alert.alert('Sale Recorded!', `Successfully recorded for £${salePrice.toFixed(2)}`);
  navigation.goBack();
};
```

### Step 6: Add Failed Sale Handler

```typescript
const handleMarkFailed = async (notes: string) => {
  if (!currentTransaction) return;
  
  await transactionService.markAsFailed(currentTransaction.id, notes);
  setShowSalePriceModal(false);
  Alert.alert('Marked as Failed', 'Please erase the tag to maintain inventory.');
  navigation.goBack();
};
```

### Step 7: Add Modal to JSX
Add this before the closing tag of the component:

```tsx
{signType && currentTransaction && (
  <SalePriceInputModal
    visible={showSalePriceModal}
    signType={signType}
    businessName={business.name}
    onConfirm={handleConfirmSale}
    onMarkFailed={handleMarkFailed}
    onCancel={() => {
      setShowSalePriceModal(false);
      setCurrentTransaction(null);
    }}
  />
)}
```

### Step 8: Add Sign Type Display (Optional UI Enhancement)
Add a card showing the selected sign type before the NFC section:

```tsx
{signType && (
  <View style={styles.signTypeCard}>
    <Text style={styles.signTypeLabel}>Selected Sign Type:</Text>
    <Text style={styles.signTypeName}>{signType.name}</Text>
    <Text style={styles.signTypePrice}>£{signType.defaultPrice.toFixed(2)}</Text>
  </View>
)}
```

## Alternative: Minimal Integration (Quick Implementation)

If you want to test the flow without full UI changes:

1. Just ensure SignTypeSelection is called before BusinessDetail
2. Pass selectedSignType from SignTypeSelection to BusinessDetail via navigation params
3. Use the selectedSignType when creating transactions
4. Show the SalePriceInputModal after successful NFC write

## Testing Flow

1. User selects business from map
2. BusinessDetail checks if sign type selected
3. If no sign type → Navigate to SignTypeSelection
4. User selects sign type → Navigate back to BusinessDetail
5. User writes NFC tag
6. SalePriceInputModal appears
7. User enters price → Transaction marked as success
8. OR user marks as failed → Navigate to EraseTag

## Notes

- The original NFC writing logic remains unchanged
- All new functionality is additive
- No breaking changes to existing flow
- Can be implemented incrementally

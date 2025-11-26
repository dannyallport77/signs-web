import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { productService } from '../services/productService';
import { receiptService, SaleReceiptItem } from '../services/receiptService';
import { Product, Business } from '../types';

interface SaleCreationScreenProps {
  navigation: any;
  route: any;
}

export default function SaleCreationScreen({ navigation, route }: SaleCreationScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [saleInputs, setSaleInputs] = useState<Record<string, { quantity: string; price: string }>>({});
  const [receiptRequested, setReceiptRequested] = useState(false);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const { business } = route?.params || {};

  useEffect(() => {
    loadProducts();
  }, []);

  const groupedSections = useMemo(() => {
    const groups = new Map<string, Product[]>();
    products.forEach((product) => {
      const group = product.groupType || 'Default';
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)?.push(product);
    });
    return Array.from(groups.entries()).map(([groupType, groupProducts]) => ({
      groupType,
      products: groupProducts.sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [products]);

  useEffect(() => {
    setExpandedGroups((current) => {
      const updated = { ...current };
      let changed = false;
      groupedSections.forEach((section, index) => {
        if (!(section.groupType in updated)) {
          updated[section.groupType] = index === 0;
          changed = true;
        }
      });
      return changed ? updated : current;
    });
  }, [groupedSections]);

  const loadProducts = async () => {
    try {
      const catalog = await productService.fetchProducts();
      setProducts(catalog);
      const defaults: Record<string, { quantity: string; price: string }> = {};
      catalog.forEach((product) => {
        defaults[product.id] = {
          quantity: '0',
          price: (product.rrp ?? product.basePrice).toFixed(2),
        };
      });
      setSaleInputs(defaults);
    } catch (error) {
      console.error('Failed to load products for sale', error);
    }
  };

  const handleInputChange = (productId: string, field: 'quantity' | 'price', value: string) => {
    setSaleInputs((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const selectedItems = (): SaleReceiptItem[] => {
    return products
      .map((product) => {
        const input = saleInputs[product.id];
        const quantity = Number(input?.quantity) || 0;
        const unitPrice = Number(input?.price) || product.basePrice;
        return {
          productId: product.id,
          name: product.name,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
        };
      })
      .filter((item) => item.quantity > 0);
  };

  const totalAmount = () => selectedItems().reduce((sum, item) => sum + item.totalPrice, 0);

  const handleFinalize = () => {
    const items = selectedItems();
    if (items.length === 0) {
      Alert.alert('No items selected', 'Add at least one sign to continue');
      return;
    }

    Alert.alert('Receipt required?', 'Would you like to send a receipt?', [
      { text: 'No', onPress: () => finalizeSale(items, false) },
      { text: 'Yes', onPress: () => setReceiptRequested(true) },
    ]);
  };

  const finalizeSale = async (items: SaleReceiptItem[], sendReceipt: boolean) => {
    Alert.alert('Sale complete', `Finalised ${items.length} line(s).`);
    if (sendReceipt) {
      if (!receiptEmail) {
        Alert.alert('Email required', 'Enter an email address before sending the receipt');
        return;
      }
      if (!business) {
        Alert.alert('Missing business', 'Business information is required to send the receipt');
        return;
      }
      try {
        await receiptService.sendReceipt(receiptEmail, business.name, items, totalAmount());
        Alert.alert('Receipt sent', `Sent receipt to ${receiptEmail}`);
        setReceiptRequested(false);
        setReceiptEmail('');
      } catch (error: any) {
        Alert.alert('Receipt failed', error.message || 'Unable to send receipt');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.arrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Create Sale</Text>
          <Text style={styles.subtitle}>Select the quantities and final prices</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.next}>↵</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {groupedSections.map((section) => (
          <View key={section.groupType} style={styles.groupContainer}>
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() =>
                setExpandedGroups((prev) => ({
                  ...prev,
                  [section.groupType]: !prev[section.groupType],
                }))
              }
            >
              <Text style={styles.groupTitle}>{section.groupType}</Text>
              <Text style={styles.groupToggle}>{expandedGroups[section.groupType] ? '−' : '+'}</Text>
            </TouchableOpacity>
            {expandedGroups[section.groupType] && (
              <View style={styles.groupBody}>
                {section.products.map((product) => {
                  const input =
                    saleInputs[product.id] ||
                    ({
                      quantity: '0',
                      price: (product.rrp ?? product.basePrice).toFixed(2),
                    });
                  return (
                    <View key={product.id} style={styles.productRow}>
                      <View style={styles.productImageWrapper}>
                        {product.imageUrl ? (
                          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                        ) : (
                          <View style={styles.productImagePlaceholder} />
                        )}
                      </View>
                      <View style={styles.productContent}>
                        <View>
                          <Text style={styles.productName}>{product.name}</Text>
                          <Text style={styles.productDescription}>{product.description}</Text>
                          <Text style={styles.productRRP}>Base £{product.basePrice.toFixed(2)}</Text>
                        </View>
                        <View style={styles.inputGroup}> 
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="Qty"
                            value={input.quantity}
                            onChangeText={(value) => handleInputChange(product.id, 'quantity', value)}
                          />
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="Price"
                            value={input.price}
                            onChangeText={(value) => handleInputChange(product.id, 'price', value)}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>£{totalAmount().toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={styles.finalizeButton} onPress={handleFinalize}>
        <Text style={styles.finalizeText}>Finalize</Text>
      </TouchableOpacity>

      {receiptRequested && (
        <View style={styles.receiptCard}>
          <Text style={styles.receiptLabel}>Receipt email</Text>
          <TextInput
            style={styles.receiptInput}
            placeholder="customer@example.com"
            value={receiptEmail}
            keyboardType="email-address"
            onChangeText={setReceiptEmail}
          />
          <TouchableOpacity
            style={styles.sendReceiptButton}
            onPress={() => finalizeSale(selectedItems(), true)}
          >
            <Text style={styles.sendReceiptText}>Send receipt</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  arrow: {
    fontSize: 20,
    color: '#4f46e5',
  },
  next: {
    fontSize: 20,
    color: '#4f46e5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 140,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupHeader: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupToggle: {
    fontSize: 20,
    color: '#4f46e5',
  },
  groupBody: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  productRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    marginRight: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#d1d5db',
  },
  productContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  productRRP: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  inputGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  input: {
    width: 96,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  finalizeButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finalizeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  receiptCard: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  receiptLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  receiptInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  sendReceiptButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendReceiptText: {
    color: '#fff',
    fontWeight: '600',
  },
});

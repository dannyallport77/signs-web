import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

export interface SaleReceiptItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export const receiptService = {
  async sendReceipt(
    toEmail: string,
    customerName: string,
    saleItems: SaleReceiptItem[],
    totalAmount: number
  ) {
    let token = '';
    try {
      token = await AsyncStorage.getItem('authToken') || '';
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }

    const payload = {
      to: toEmail,
      customerName,
      items: saleItems,
      total: totalAmount,
    };

    const response = await fetch(`${API_URL}/mobile/receipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to send receipt');
    }

    return true;
  },
};

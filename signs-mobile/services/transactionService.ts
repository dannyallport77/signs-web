import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, TransactionFilters } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

export const transactionService = {
  async create(transaction: Partial<Transaction>): Promise<Transaction> {
    let token = '';
    let userData = null;
    try {
      token = await AsyncStorage.getItem('authToken') || '';
      const user = await AsyncStorage.getItem('user');
      userData = user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error retrieving storage data:', error);
    }

    console.log('Creating transaction:', { url: `${API_URL}/transactions`, hasToken: !!token, userId: userData?.id });

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...transaction,
          userId: userData?.id
        })
      });

      console.log('Transaction API response status:', response.status);

      const data = await response.json();
      console.log('Transaction API response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      return data.data;
    } catch (error) {
      console.error('Transaction creation network error:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    let token = '';
    try {
      token = await AsyncStorage.getItem('authToken') || '';
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update transaction');
    }

    return data.data;
  },

  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    let token = '';
    try {
      token = await AsyncStorage.getItem('authToken') || '';
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/transactions?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch transactions');
    }

    return data.data;
  },

  async markAsSuccess(id: string, salePrice: number, notes?: string): Promise<Transaction> {
    return this.update(id, {
      status: 'success',
      salePrice,
      notes
    });
  },

  async markAsFailed(id: string, notes?: string): Promise<Transaction> {
    return this.update(id, {
      status: 'failed',
      notes
    });
  },

  async markAsErased(id: string): Promise<Transaction> {
    return this.update(id, {
      status: 'erased',
      erasedAt: new Date().toISOString()
    });
  }
};

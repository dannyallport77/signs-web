import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SignType } from '../types';

interface SalePriceInputModalProps {
  visible: boolean;
  signType: SignType;
  businessName: string;
  onConfirm: (salePrice: number, notes: string) => Promise<void>;
  onMarkFailed: (notes: string) => Promise<void>;
  onCancel: () => void;
}

export default function SalePriceInputModal({
  visible,
  signType,
  businessName,
  onConfirm,
  onMarkFailed,
  onCancel
}: SalePriceInputModalProps) {
  const [salePrice, setSalePrice] = useState(signType.defaultPrice.toString());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    const price = parseFloat(salePrice);
    
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid sale price');
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(price, notes);
      // Reset form
      setSalePrice(signType.defaultPrice.toString());
      setNotes('');
    } catch (error) {
      console.error('Error confirming sale:', error);
      Alert.alert('Error', 'Failed to record sale. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkFailed = () => {
    Alert.alert(
      'Mark as Failed Sale',
      'Are you sure this sale failed? The tag will need to be erased to maintain accurate inventory.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Failed',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              await onMarkFailed(notes || 'Sale failed');
              setSalePrice(signType.defaultPrice.toString());
              setNotes('');
            } catch (error) {
              console.error('Error marking as failed:', error);
              Alert.alert('Error', 'Failed to update status. Please try again.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.title}>NFC Tag Written!</Text>
              <Text style={styles.subtitle}>Record your sale details</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Sign Type:</Text>
                <Text style={styles.value}>{signType.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Business:</Text>
                <Text style={styles.value} numberOfLines={2}>{businessName}</Text>
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>Sale Price (£) *</Text>
              <TextInput
                style={styles.priceInput}
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                autoFocus
              />

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about this sale..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, submitting && styles.buttonDisabled]}
                onPress={handleConfirm}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Record Sale</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.failedButton, submitting && styles.buttonDisabled]}
                onPress={handleMarkFailed}
                disabled={submitting}
              >
                <Text style={styles.failedButtonText}>Mark as Failed Sale</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  form: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  priceInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4f46e5',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 80,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  failedButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  failedButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});

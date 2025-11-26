/**
 * NFC Tag Logging Service
 * Logs written NFC tags to the backend API for audit trail
 */

interface LogNFCTagPayload {
  businessName: string;
  businessAddress?: string;
  placeId: string;
  reviewUrl: string;
  latitude?: number;
  longitude?: number;
  writtenBy?: string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://signs-nfc-writer.onrender.com';

export const nfcLoggingService = {
  /**
   * Log an NFC tag write to the backend
   * This creates an audit trail of all tags written from the mobile app
   */
  async logTagWrite(data: LogNFCTagPayload): Promise<void> {
    try {
      const payload = {
        businessName: data.businessName,
        businessAddress: data.businessAddress || '',
        placeId: data.placeId,
        reviewUrl: data.reviewUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        writtenBy: data.writtenBy || 'Mobile App',
      };

      const response = await fetch(`${API_BASE_URL}/api/nfc-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn('Failed to log NFC tag to backend:', response.statusText);
        // Don't throw - this shouldn't block the tag write from succeeding
        return;
      }

      const result = await response.json();
      console.log('NFC tag logged successfully:', result.data?.id);
    } catch (error) {
      console.warn('Error logging NFC tag:', error);
      // Silently fail - tag write succeeded locally, logging is best-effort
    }
  },

  /**
   * Batch log multiple tag writes
   */
  async logTagWrites(tags: LogNFCTagPayload[]): Promise<void> {
    for (const tag of tags) {
      await this.logTagWrite(tag);
    }
  },
};

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Device {
  id: string;
  deviceId: string;
  deviceName: string;
  osVersion: string;
  isActive: boolean;
  lastHeartbeat: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  hasActiveSession: boolean;
  sessionExpiresAt: string | null;
}

interface Promotion {
  id: string;
  name: string;
  businessId: string;
  data: any;
}

export default function RemoteNFCProgrammingPage() {
  const { data: session } = useSession();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [taskType, setTaskType] = useState('write_fruit_machine');

  // Fetch devices
  useEffect(() => {
    if (!session?.user?.email) return;
    fetchDevices();
  }, [session?.user?.email]);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/mobile-devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  };

  const handleSendToDevice = async () => {
    if (!selectedDevice || !businessId) {
      setError('Please select a device and business');
      return;
    }

    if (taskType === 'write_fruit_machine' && !selectedPromotion) {
      setError('Please select a promotion');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const nfcData = {
        type: taskType,
        businessId,
        promotionId: selectedPromotion || undefined,
        timestamp: new Date().toISOString(),
        // Add task-specific data based on taskType
        ...(taskType === 'write_fruit_machine' && {
          dataType: 'FRUIT_MACHINE',
          actionUrl: `/api/fruit-machine/nfc?promo=${selectedPromotion}`,
        }),
      };

      const response = await fetch('/api/nfc-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice,
          businessId,
          promotionId: selectedPromotion || undefined,
          taskType,
          nfcData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send task');
      }

      setSuccess('Task sent to device! The phone will program the next NFC tag.');
      setSelectedDevice('');
      setSelectedPromotion('');
      setBusinessId('');

      // Refresh devices
      setTimeout(fetchDevices, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send task');
    } finally {
      setLoading(false);
    }
  };

  const selectedDeviceInfo = selectedDevice
    ? devices.find((d) => d.deviceId === selectedDevice)
    : undefined;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Remote NFC Programming
        </h1>
        <p className="text-gray-600">
          Send NFC programming tasks to your mobile devices in passive mode
        </p>
      </div>

      {/* Registered Devices */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Registered Devices ({devices.length})
        </h2>

        {devices.length === 0 ? (
          <p className="text-gray-500">
            No devices registered yet. Open the mobile app and enable Passive NFC Mode
            to register your device.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className={`border rounded-lg p-4 cursor-pointer transition ${
                  selectedDevice === device.deviceId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedDevice(device.deviceId)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {device.deviceName}
                    </p>
                    <p className="text-sm text-gray-500">
                      iOS {device.osVersion}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Assigned to {device.user?.name || device.user?.email || 'Unassigned'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      device.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {device.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Last seen: {new Date(device.lastHeartbeat).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Programming Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Create Programming Task
        </h2>

        <div className="space-y-4">
          {/* Task Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Type
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="write_fruit_machine">Fruit Machine Promotion</option>
              <option value="write_wifi">WiFi Credentials</option>
              <option value="write_smart_link">Smart Link</option>
            </select>
          </div>

          {/* Business ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business ID
            </label>
            <input
              type="text"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="Enter business ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Promotion Selection (for fruit machine) */}
          {taskType === 'write_fruit_machine' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fruit Machine Promotion
              </label>
              <input
                type="text"
                value={selectedPromotion}
                onChange={(e) => setSelectedPromotion(e.target.value)}
                placeholder="Enter promotion ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                The phone will tag any NFC tags with this promotion configuration
              </p>
            </div>
          )}

          {/* Selected Device Display */}
          {selectedDeviceInfo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="space-y-1 text-sm text-blue-900">
                <p>
                  <strong>Selected Device:</strong> {selectedDeviceInfo.deviceName}
                </p>
                <p>
                  <strong>Assigned User:</strong>{' '}
                  {selectedDeviceInfo.user?.name || selectedDeviceInfo.user?.email || 'Unassigned user'}
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSendToDevice}
            disabled={loading || !selectedDevice || !businessId}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Sending...' : 'Send to Device'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How It Works</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Open the mobile app and navigate to <strong>Passive NFC Mode</strong></li>
          <li>The device will appear here once it connects</li>
          <li>Select the device and configure your programming task</li>
          <li>Click <strong>Send to Device</strong></li>
          <li>
            The phone will start listening for NFC tags and automatically program the
            next tag it detects
          </li>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Last seen: {new Date(device.lastHeartbeat).toLocaleString()}</p>
                  {device.hasActiveSession ? (
                    <p className="text-green-700">
                      Active session expires {device.sessionExpiresAt ? new Date(device.sessionExpiresAt).toLocaleTimeString() : 'soon'}
                    </p>
                  ) : (
                    <p className="text-red-600">User session inactive</p>
                  )}
                </div>
          <li>
            The task status will update in real-time as the phone acknowledges and
            completes it
          </li>
        </ol>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface NFCTask {
  id: string;
  deviceId: string;
  businessId: string;
  promotionId?: string;
  taskType: string;
  status: string;
  attemptCount: number;
  lastError?: string;
  createdAt: string;
  acknowledgedAt?: string;
  completedAt?: string;
  device: {
    deviceId: string;
    deviceName: string;
    osVersion: string;
  };
}

export default function NFCTasksMonitorPage() {
  const [tasks, setTasks] = useState<NFCTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>(
    'all'
  );
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchTasks();
    if (autoRefresh) {
      const interval = setInterval(fetchTasks, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchTasks = async () => {
    try {
      let url = '/api/nfc-tasks';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-800';
      case 'writing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'acknowledged':
        return '✓';
      case 'writing':
        return '✏️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
  };

  const filteredTasks =
    filter === 'all'
      ? tasks
      : tasks.filter((t) => t.status === filter || (filter === 'failed' && t.status === 'failed'));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          NFC Programming Tasks Monitor
        </h1>
        <p className="text-gray-600">
          Real-time tracking of NFC tag programming tasks sent to mobile devices
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Total Tasks</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Failed</p>
          <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          {(['all', 'pending', 'completed', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md font-medium transition capitalize ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
          <button
            onClick={fetchTasks}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tasks found for this filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Task Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Timeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {task.device.deviceName}
                        </p>
                        <p className="text-xs text-gray-500">
                          iOS {task.device.osVersion}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {task.taskType.replace(/_/g, ' ')}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm">{task.businessId.slice(0, 8)}</code>
                      {task.promotionId && (
                        <>
                          <br />
                          <code className="text-xs text-gray-500">
                            {task.promotionId.slice(0, 8)}
                          </code>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {getStatusIcon(task.status)} {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      <div className="space-y-1">
                        <p>
                          <strong>Created:</strong>{' '}
                          {new Date(task.createdAt).toLocaleTimeString()}
                        </p>
                        {task.acknowledgedAt && (
                          <p>
                            <strong>Acked:</strong>{' '}
                            {new Date(task.acknowledgedAt).toLocaleTimeString()}
                          </p>
                        )}
                        {task.completedAt && (
                          <p>
                            <strong>Done:</strong>{' '}
                            {new Date(task.completedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="space-y-1">
                        {task.status === 'failed' && task.lastError && (
                          <p className="text-red-600">
                            <strong>Error:</strong> {task.lastError.slice(0, 50)}...
                          </p>
                        )}
                        <p>
                          <strong>Attempts:</strong> {task.attemptCount}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Task Status Meanings</h3>
        <ul className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-yellow-600">⏳</span>
            <span>Pending - Waiting for phone</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-600">✓</span>
            <span>Acked - Phone received task</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-purple-600">✏️</span>
            <span>Writing - Programming tag</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span>Done - Successfully completed</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-red-600">❌</span>
            <span>Failed - Error occurred</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

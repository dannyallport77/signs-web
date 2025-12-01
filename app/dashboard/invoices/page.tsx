'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface InvoiceOpen {
  openedAt: string;
  userAgent?: string;
  ipAddress?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  sentAt: string;
  emailOpened: boolean;
  emailOpenedAt?: string;
  lastOpenedAt?: string;
  openCount: number;
  opens: InvoiceOpen[];
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices');
      const data = await response.json();

      if (data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-green-100 text-green-800',
      paid: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">
            Track all issued invoices with email open tracking
          </p>
        </div>
        <Link
          href="/dashboard/invoices/create"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium"
        >
          + Create Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm font-medium">Total Invoices</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm font-medium">Opened</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {invoices.filter((i) => i.emailOpened).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {invoices.length > 0
              ? Math.round(
                  (invoices.filter((i) => i.emailOpened).length / invoices.length) * 100
                )
              : 0}
            %
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm font-medium">Not Opened</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {invoices.filter((i) => !i.emailOpened).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm font-medium">Total Amount</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            £{invoices.reduce((sum, i) => sum + i.totalAmount, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full"></div>
            <p className="text-gray-600 mt-2">Loading invoices...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 text-lg">No invoices yet</p>
            <Link
              href="/dashboard/invoices/create"
              className="inline-block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Create Your First Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Email Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Invoice Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {invoice.customerName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 break-all">
                        {invoice.customerEmail}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">
                        £{invoice.totalAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatDate(invoice.sentAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.emailOpened ? (
                        <div className="space-y-1">
                          <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            ✓ Opened {invoice.openCount}x
                          </div>
                          {invoice.lastOpenedAt && (
                            <p className="text-xs text-gray-500">
                              Last: {formatDate(invoice.lastOpenedAt)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          Not opened
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          invoice.status
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowDetails(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedInvoice.invoiceNumber}
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Name</p>
                  <p className="text-lg text-gray-900">
                    {selectedInvoice.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg text-gray-900">
                    {selectedInvoice.customerEmail}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="text-lg font-bold text-gray-900">
                    £{selectedInvoice.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusBadge(
                      selectedInvoice.status
                    )}`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              {/* Email Tracking */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Email Tracking
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sent</span>
                    <span className="text-gray-900 font-medium">
                      {formatDate(selectedInvoice.sentAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Email Status</span>
                    <span
                      className={`font-medium ${
                        selectedInvoice.emailOpened
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {selectedInvoice.emailOpened ? 'Opened' : 'Not opened'}
                    </span>
                  </div>
                  {selectedInvoice.emailOpened && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">First Opened</span>
                        <span className="text-gray-900 font-medium">
                          {selectedInvoice.emailOpenedAt
                            ? formatDate(selectedInvoice.emailOpenedAt)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Last Opened</span>
                        <span className="text-gray-900 font-medium">
                          {selectedInvoice.lastOpenedAt
                            ? formatDate(selectedInvoice.lastOpenedAt)
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Opens</span>
                        <span className="text-gray-900 font-medium">
                          {selectedInvoice.openCount}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Open History */}
              {selectedInvoice.opens && selectedInvoice.opens.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Open History ({selectedInvoice.opens.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedInvoice.opens.map((open, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded p-3 text-sm space-y-1"
                      >
                        <p className="text-gray-900 font-medium">
                          {formatDate(open.openedAt)}
                        </p>
                        {open.ipAddress && (
                          <p className="text-gray-600">IP: {open.ipAddress}</p>
                        )}
                        {open.userAgent && (
                          <p className="text-gray-600 text-xs break-all">
                            Agent: {open.userAgent}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Sorting and Filtering State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Invoice; direction: 'asc' | 'desc' } | null>({ key: 'sentAt', direction: 'desc' });
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const handleSort = (key: keyof Invoice) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredInvoices = invoices
    .filter((invoice) => {
      const matchesText =
        invoice.customerName.toLowerCase().includes(filterText.toLowerCase()) ||
        invoice.customerEmail.toLowerCase().includes(filterText.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(filterText.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesText && matchesStatus;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      
      // Handle string comparisons
      const valA = a[key];
      const valB = b[key];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return direction === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      // Handle number/boolean comparisons
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ columnKey }: { columnKey: keyof Invoice }) => {
    if (sortConfig?.key !== columnKey) {
      return <span className="ml-1 text-gray-400">↕</span>;
    }
    return <span className="ml-1 text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
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
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-colors"
        >
          + Create Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-gray-600 text-sm font-medium">Total Invoices</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
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
            % conversion
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-gray-600 text-sm font-medium">Not Opened</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {invoices.filter((i) => !i.emailOpened).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-gray-600 text-sm font-medium">Total Amount</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            £{invoices.reduce((sum, i) => sum + i.totalAmount, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow border border-gray-100">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Filter emails, names, or invoice #..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-gray-600 whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full"></div>
            <p className="text-gray-600 mt-2">Loading invoices...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : sortedAndFilteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 text-lg">No invoices found</p>
            {filterText || statusFilter !== 'all' ? (
              <button 
                onClick={() => { setFilterText(''); setStatusFilter('all'); }}
                className="text-indigo-600 hover:text-indigo-800 mt-2 font-medium"
              >
                Clear filters
              </button>
            ) : (
              <Link
                href="/dashboard/invoices/create"
                className="inline-block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
              >
                Create Your First Invoice
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('invoiceNumber')}
                  >
                    <div className="flex items-center">
                      Invoice # <SortIcon columnKey="invoiceNumber" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('customerName')}
                  >
                    <div className="flex items-center">
                      Customer <SortIcon columnKey="customerName" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('customerEmail')}
                  >
                    <div className="flex items-center">
                      Email <SortIcon columnKey="customerEmail" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('totalAmount')}
                  >
                    <div className="flex items-center">
                      Amount <SortIcon columnKey="totalAmount" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('sentAt')}
                  >
                    <div className="flex items-center">
                      Sent <SortIcon columnKey="sentAt" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('emailOpened')}
                  >
                    <div className="flex items-center">
                      Email Status <SortIcon columnKey="emailOpened" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status <SortIcon columnKey="status" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedAndFilteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
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
                          <div className="inline-flex items-center px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            ✓ Opened {invoice.openCount}x
                          </div>
                          {invoice.lastOpenedAt && (
                            <p className="text-xs text-gray-500">
                              Last: {formatDate(invoice.lastOpenedAt)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          Not opened
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
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
                        Details
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-900">
                Invoice {selectedInvoice.invoiceNumber}
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Actions */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  View PDF
                </button>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Name</p>
                  <p className="text-lg text-gray-900 font-medium">
                    {selectedInvoice.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg text-gray-900 break-all">
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
              <div className="border-t pt-6">
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
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Open History ({selectedInvoice.opens.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {selectedInvoice.opens.map((open, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded p-3 text-sm space-y-1 border border-gray-100"
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

      {/* PDF Modal */}
      {showPdfModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Invoice PDF: {selectedInvoice.invoiceNumber}
              </h3>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
              <iframe
                src={`/api/invoices/${selectedInvoice.id}/pdf`}
                className="w-full h-full rounded shadow-lg bg-white"
                title={`Invoice ${selectedInvoice.invoiceNumber}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

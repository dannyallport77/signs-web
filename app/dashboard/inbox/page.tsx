'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Email {
  id: string;
  from: string;
  fromName: string | null;
  to: string;
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  receivedAt: string;
}

export default function InboxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchEmails();
  }, [filter, searchQuery]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filter === 'unread') {
        params.append('isRead', 'false');
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/emails?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setEmails(prev => 
          prev.map(e => e.id === emailId ? { ...e, isRead: true } : e)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        if (selectedEmail?.id === emailId) {
          setSelectedEmail({ ...selectedEmail, isRead: true });
        }
      }
    } catch (error) {
      console.error('Failed to mark email as read:', error);
    }
  };

  const toggleStar = async (emailId: string, currentStarred: boolean) => {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !currentStarred }),
      });

      if (response.ok) {
        setEmails(prev => 
          prev.map(e => e.id === emailId ? { ...e, isStarred: !currentStarred } : e)
        );
        if (selectedEmail?.id === emailId) {
          setSelectedEmail({ ...selectedEmail, isStarred: !currentStarred });
        }
      }
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const deleteEmail = async (emailId: string) => {
    if (!confirm('Are you sure you want to delete this email?')) return;

    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEmails(prev => prev.filter(e => e.id !== emailId));
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete email:', error);
    }
  };

  const selectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsRead(email.id);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading inbox...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <button
            onClick={fetchEmails}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === 'unread'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Email List and Detail View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Email List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          {emails.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No emails found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => selectEmail(email)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    !email.isRead ? 'bg-blue-50' : ''
                  } ${selectedEmail?.id === email.id ? 'bg-indigo-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(email.id, email.isStarred);
                        }}
                        className="text-gray-400 hover:text-yellow-500"
                      >
                        {email.isStarred ? '★' : '☆'}
                      </button>
                      <span className={`text-sm ${!email.isRead ? 'font-bold' : 'font-medium'} text-gray-900 truncate`}>
                        {email.fromName || email.from}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(email.receivedAt)}
                    </span>
                  </div>
                  <div className={`text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-900 truncate mb-1`}>
                    {email.subject}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {email.textBody?.substring(0, 100)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Detail View */}
        <div className="flex-1 overflow-y-auto">
          {selectedEmail ? (
            <div className="p-6">
              {/* Email Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStar(selectedEmail.id, selectedEmail.isStarred)}
                      className="p-2 text-gray-600 hover:text-yellow-500 rounded-md hover:bg-gray-100"
                    >
                      {selectedEmail.isStarred ? '★' : '☆'}
                    </button>
                    <button
                      onClick={() => deleteEmail(selectedEmail.id)}
                      className="p-2 text-gray-600 hover:text-red-600 rounded-md hover:bg-gray-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">From:</span>{' '}
                    {selectedEmail.fromName ? (
                      <>{selectedEmail.fromName} &lt;{selectedEmail.from}&gt;</>
                    ) : (
                      selectedEmail.from
                    )}
                  </div>
                  <div>
                    <span className="font-medium">To:</span> {selectedEmail.to}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>{' '}
                    {new Date(selectedEmail.receivedAt).toLocaleString('en-GB')}
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="border-t border-gray-200 pt-6">
                {selectedEmail.htmlBody ? (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-gray-900">
                    {selectedEmail.textBody}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select an email to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import { getInquiries, markInquiryRead, deleteInquiry } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { Inquiry } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirmDialog } from '@/components/providers/ConfirmDialogProvider';

export default function AdminInquiriesPage() {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    loadInquiries();
    // `loadInquiries` is a new function reference every render — `filter`
    // is the only real trigger. See the same note in admin/collections/[slug].
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadInquiries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getInquiries({
        limit: 100,
        read: filter === 'unread' ? false : undefined,
      });
      setInquiries(result.inquiries);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inquiries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRead = async (inquiry: Inquiry) => {
    setBusyId(inquiry.id);
    const nextRead = !inquiry.read;
    try {
      await markInquiryRead(inquiry.id, nextRead);
      setInquiries((prev) =>
        filter === 'unread' && nextRead
          ? prev.filter((i) => i.id !== inquiry.id)
          : prev.map((i) => (i.id === inquiry.id ? { ...i, read: nextRead } : i))
      );
    } catch (err) {
      console.error('Failed to update inquiry:', err);
      toast.error(err instanceof ApiError ? err.message : 'Failed to update inquiry.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (inquiry: Inquiry) => {
    const ok = await confirmDialog({
      title: 'Delete inquiry?',
      message: `Delete the message from "${inquiry.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    setBusyId(inquiry.id);
    try {
      await deleteInquiry(inquiry.id);
      setInquiries((prev) => prev.filter((i) => i.id !== inquiry.id));
      toast.success('Inquiry deleted.');
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete inquiry.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inquiries</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Messages submitted through the contact form
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading inquiries...</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900/50 p-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">Failed to load inquiries</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <Button variant="secondary" onClick={loadInquiries}>Try Again</Button>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'unread' ? 'No unread inquiries' : 'No inquiries yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border p-5 ${
                  inquiry.read
                    ? 'border-gray-200 dark:border-gray-700'
                    : 'border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-900/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{inquiry.name}</h3>
                      {!inquiry.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" title="Unread" />
                      )}
                      {inquiry.projectType && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                          {inquiry.projectType}
                        </span>
                      )}
                    </div>
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      {inquiry.email}
                    </a>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(inquiry.createdAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleRead(inquiry)}
                      disabled={busyId === inquiry.id}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                    >
                      {inquiry.read ? 'Mark unread' : 'Mark read'}
                    </button>
                    <button
                      onClick={() => handleDelete(inquiry)}
                      disabled={busyId === inquiry.id}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {inquiry.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

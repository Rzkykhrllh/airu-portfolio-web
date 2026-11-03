'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import { getInquiries, markInquiryRead, deleteInquiry } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { Inquiry } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirmDialog } from '@/components/providers/ConfirmDialogProvider';
import PageHeader from '@/components/admin/PageHeader';
import * as ui from '@/components/admin/ui';

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

  const unreadCount = inquiries.filter((i) => !i.read).length;

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <PageHeader
          title="Inquiries"
          description="Messages sent through the contact form on the About page"
          actions={
            <div className="inline-flex p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800">
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`h-9 px-3 text-sm rounded-md transition-colors capitalize ${
                    filter === f
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm font-medium'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {f}
                  {f === 'unread' && filter === 'all' && unreadCount > 0 && (
                    <span className="ml-1.5 tabular-nums text-gray-400">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          }
        />

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-gray-200/70 dark:bg-gray-800/70" />
            ))}
          </div>
        ) : error ? (
          <div className={`${ui.card} p-12 text-center`}>
            <p className="font-medium text-gray-900 dark:text-white mb-1">Couldn&apos;t load inquiries</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{error}</p>
            <Button variant="secondary" onClick={loadInquiries}>Try again</Button>
          </div>
        ) : inquiries.length === 0 ? (
          <div className={`${ui.card} p-16 text-center`}>
            <p className="font-medium text-gray-900 dark:text-white mb-1">
              {filter === 'unread' ? 'All caught up' : 'No inquiries yet'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter === 'unread' ? 'Every message has been read.' : 'New messages from the contact form will show up here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => (
              <article
                key={inquiry.id}
                className={`${ui.card} group p-5 ${inquiry.read ? '' : 'border-gray-900/30 dark:border-white/30'}`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`mt-0.5 w-9 h-9 shrink-0 rounded-full inline-flex items-center justify-center text-sm font-semibold uppercase ${
                      inquiry.read
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    }`}
                  >
                    {inquiry.name?.[0] ?? '?'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-sm text-gray-900 dark:text-white ${inquiry.read ? 'font-medium' : 'font-semibold'}`}>
                            {inquiry.name}
                          </h3>
                          {!inquiry.read && (
                            <span className="text-[0.625rem] uppercase tracking-[0.14em] font-semibold text-gray-900 dark:text-white">New</span>
                          )}
                          {inquiry.projectType && (
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs">
                              {inquiry.projectType}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          <a href={`mailto:${inquiry.email}`} className="hover:text-gray-900 dark:hover:text-white hover:underline underline-offset-4">
                            {inquiry.email}
                          </a>
                          {' · '}
                          {new Date(inquiry.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={`mailto:${inquiry.email}?subject=${encodeURIComponent('Re: your inquiry')}`}
                          className="h-8 px-3 inline-flex items-center rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-colors"
                        >
                          Reply
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleRead(inquiry)}
                          disabled={busyId === inquiry.id}
                        >
                          {inquiry.read ? 'Mark unread' : 'Mark read'}
                        </Button>
                        <button
                          onClick={() => handleDelete(inquiry)}
                          disabled={busyId === inquiry.id}
                          className={`${ui.iconButton} !w-8 !h-8 hover:!text-red-600`}
                          title="Delete"
                          aria-label="Delete inquiry"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {inquiry.message}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

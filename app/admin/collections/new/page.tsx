'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createCollection } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { useToast } from '@/components/providers/ToastProvider';
import PageHeader from '@/components/admin/PageHeader';
import * as ui from '@/components/admin/ui';

export default function NewCollectionPage() {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title || !slug) {
      toast.error('Please fill in title and slug');
      return;
    }

    setIsCreating(true);

    try {
      await createCollection({
        title,
        slug,
        description,
      });

      toast.success('Collection created successfully!');
      router.push(`/admin/collections/${slug}`);
    } catch (error) {
      console.error('Failed to create collection:', error);
      toast.error(error instanceof ApiError ? error.message : 'Failed to create collection. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <PageHeader
          back={{ href: '/admin/collections', label: 'Collections' }}
          title="New collection"
          description="Name it now — you'll add photos right after."
        />

        <form onSubmit={handleSubmit} className={`${ui.card} p-5 sm:p-6 space-y-5`}>
          <Input
            label="Title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Tokyo Streets"
            required
            autoFocus
          />

          <div>
            <Input
              label="Slug (URL)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. tokyo-streets"
              required
            />
            {slug && (
              <p className="mt-1.5 text-xs text-gray-400 truncate">byairu.com/collections/{slug}</p>
            )}
          </div>

          <div>
            <label className={ui.label}>Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A line or two about the series"
              rows={3}
              className={ui.textarea}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/admin/collections')}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create collection'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

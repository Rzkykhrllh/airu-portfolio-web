'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createCollection } from '@/lib/api';
import { useToast } from '@/components/providers/ToastProvider';

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
        coverPhotoId: '1', // Default to first photo
      });

      toast.success('Collection created successfully!');
      router.push(`/admin/collections/${slug}`);
    } catch (error) {
      console.error('Failed to create collection:', error);
      toast.error('Failed to create collection. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Collection</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a new photo collection
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <Input
              label="Title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Tokyo Streets"
              required
            />

            <Input
              label="Slug (URL)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. tokyo-streets"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter collection description"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              You can add photos and select a cover photo after creating the collection
            </p>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/collections')}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Collection'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

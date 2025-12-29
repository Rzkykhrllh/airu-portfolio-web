'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TagInput from '@/components/admin/TagInput';
import { getPhoto, updatePhoto, deletePhoto, getCollections } from '@/lib/api';
import { Photo, Collection } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';

interface EditPhotoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPhotoPage({ params }: EditPhotoPageProps) {
  const router = useRouter();
  const toast = useToast();
  const { id } = use(params);

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'COLLECTION_ONLY' | 'PRIVATE'>('PUBLIC');
  const [capturedAt, setCapturedAt] = useState('');
  const [camera, setCamera] = useState('');
  const [lens, setLens] = useState('');
  const [aperture, setAperture] = useState('');
  const [shutter, setShutter] = useState('');
  const [iso, setIso] = useState('');

  useEffect(() => {
    loadPhoto();
  }, [id]);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await getCollections();
      setAvailableCollections(data);
    } catch (error) {
      console.error('Failed to load collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setIsLoadingCollections(false);
    }
  };

  const loadPhoto = async () => {
    setIsLoading(true);
    try {
      const data = await getPhoto(id);
      if (data) {
        setPhoto(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setLocation(data.location || '');
        setTags(data.tags || []);
        setCollections(data.collections.map(c => c.id) || []);
        setFeatured(data.featured || false);
        setVisibility(data.visibility || 'PUBLIC');
        setCapturedAt(data.capturedAt || '');
        setCamera(data.exif?.camera || '');
        setLens(data.exif?.lens || '');
        setAperture(data.exif?.aperture || '');
        setShutter(data.exif?.shutter || '');
        setIso(data.exif?.iso?.toString() || '');
      }
    } catch (error) {
      console.error('Failed to load photo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updatePhoto(id, {
        title,
        description,
        location,
        tags,
        collections,
        featured,
        visibility,
        capturedAt,
        exif: {
          camera,
          lens,
          aperture,
          shutter,
          iso,
        },
      });

      toast.success('Photo updated successfully!');
      router.push('/admin/photos');
    } catch (error) {
      console.error('Failed to update photo:', error);
      toast.error('Failed to update photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePhoto(id);
      toast.success('Photo deleted successfully!');
      router.push('/admin/photos');
    } catch (error) {
      console.error('Failed to delete photo:', error);
      toast.error('Failed to delete photo. Please try again.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Loading photo...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!photo) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Photo not found</p>
          <Link href="/admin/photos" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            ← Back to Photos
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/admin/photos"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 inline-block"
            >
              ← Back to Photos
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Photo
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              type="submit"
              form="photo-form"
              variant="primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <form id="photo-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Photo Preview */}
          <div>
            <div className="sticky top-8">
              <div className="relative w-full aspect-square bg-gray-200 dark:bg-gray-900 rounded-lg overflow-hidden">
                <Image
                  src={photo.src.full}
                  alt={photo.title || 'Photo'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter photo title"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter photo description"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Tokyo, Japan"
              />

              <Input
                label="Date Captured"
                type="date"
                value={capturedAt ? capturedAt.split('T')[0] : ''}
                onChange={(e) => setCapturedAt(e.target.value ? `${e.target.value}T00:00:00Z` : '')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Collections
              </label>
              {isLoadingCollections ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading collections...</div>
              ) : availableCollections.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">No collections available</div>
              ) : (
                <div className="space-y-2">
                  {availableCollections.map((col) => (
                    <label key={col.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={collections.includes(col.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCollections([...collections, col.id]);
                          } else {
                            setCollections(collections.filter(c => c !== col.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {col.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Featured (Photographer's Pick)
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'COLLECTION_ONLY' | 'PRIVATE')}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLIC">Public (Show everywhere)</option>
                <option value="COLLECTION_ONLY">Collection Only (Not in gallery)</option>
                <option value="PRIVATE">Private (Admin only)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {visibility === 'PUBLIC' && 'Visible in gallery, collections, and admin'}
                {visibility === 'COLLECTION_ONLY' && 'Visible in collections and admin only, not in main gallery'}
                {visibility === 'PRIVATE' && 'Only visible to admins, hidden from public'}
              </p>
            </div>

            {/* EXIF Data */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                EXIF Data
              </h3>
              <div className="space-y-4">
                <Input
                  label="Camera"
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                  placeholder="e.g. Sony A7IV"
                />

                <Input
                  label="Lens"
                  value={lens}
                  onChange={(e) => setLens(e.target.value)}
                  placeholder="e.g. 24-70mm f/2.8"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <Input
                    label="Aperture"
                    value={aperture}
                    onChange={(e) => setAperture(e.target.value)}
                    placeholder="f/2.8"
                  />

                  <Input
                    label="Shutter"
                    value={shutter}
                    onChange={(e) => setShutter(e.target.value)}
                    placeholder="1/250s"
                  />

                  <Input
                    label="ISO"
                    value={iso}
                    onChange={(e) => setIso(e.target.value)}
                    placeholder="400"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

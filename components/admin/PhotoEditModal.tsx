'use client';

import { useState, useEffect, FormEvent } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TagInput from '@/components/admin/TagInput';
import { getPhoto, updatePhoto, deletePhoto, getCollections } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { Photo, Collection } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirmDialog } from '@/components/providers/ConfirmDialogProvider';
import { useUndoDelete } from '@/components/providers/UndoDeleteProvider';

interface PhotoEditModalProps {
  photoId: string;
  onClose: () => void;
  onUpdated: (photo: Photo) => void;
  onDeleted: (photoId: string) => void;
}

export default function PhotoEditModal({ photoId, onClose, onUpdated, onDeleted }: PhotoEditModalProps) {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const undoDelete = useUndoDelete();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);

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
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const data = await getPhoto(photoId);
        if (cancelled) return;
        if (data) {
          setPhoto(data);
          setTitle(data.title || '');
          setDescription(data.description || '');
          setLocation(data.location || '');
          setTags(data.tags || []);
          setCollections(data.collections.map((c) => c.id) || []);
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
        if (!cancelled) toast.error(error instanceof ApiError ? error.message : 'Failed to load photo.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    (async () => {
      try {
        const data = await getCollections();
        if (!cancelled) setAvailableCollections(data);
      } catch (error) {
        console.error('Failed to load collections:', error);
        if (!cancelled) toast.error(error instanceof ApiError ? error.message : 'Failed to load collections');
      } finally {
        if (!cancelled) setIsLoadingCollections(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [photoId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updated = await updatePhoto(photoId, {
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
      onUpdated(updated);
    } catch (error) {
      console.error('Failed to update photo:', error);
      toast.error(error instanceof ApiError ? error.message : 'Failed to update photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: 'Delete photo?',
      message: 'Are you sure you want to delete this photo? This action cannot be undone.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    // Close right away — the modal doesn't need to stay open for the grace
    // period, the Undo toast (from UndoDeleteProvider, mounted above this
    // modal in the admin layout) survives the unmount just fine.
    onClose();
    undoDelete.requestDelete({
      key: photoId,
      message: `"${photo?.title || 'Untitled'}" deleted.`,
      commit: async () => {
        try {
          await deletePhoto(photoId);
          onDeleted(photoId);
        } catch (error) {
          console.error('Failed to delete photo:', error);
          toast.error(error instanceof ApiError ? error.message : 'Failed to delete photo. Please try again.');
        }
      },
      undo: () => toast.info('Delete cancelled.'),
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Photo</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading || !photo ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Loading photo...</p>
          </div>
        ) : (
          <>
            <form id="photo-edit-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 p-6">
              {/* Photo Preview */}
              <div>
                <div className="sticky top-20">
                  <div className="relative w-full h-[70vh] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                    <Image
                      src={photo.src.full}
                      alt={photo.title || 'Photo'}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 60vw"
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
                                setCollections(collections.filter((c) => c !== col.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{col.title}</span>
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

                {/* EXIF Data */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">EXIF Data</h3>
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

            <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <Button type="button" variant="danger" onClick={handleDelete}>
                Delete
              </Button>
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" form="photo-edit-form" variant="primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
